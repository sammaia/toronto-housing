import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { ToolService, TOOL_DEFINITIONS } from './chat.tools.js';

export type ChatSseEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_start'; tool: string; input: Record<string, unknown> }
  | { type: 'tool_end'; tool: string }
  | { type: 'done'; conversationId: string; title?: string }
  | { type: 'error'; message: string };

const SYSTEM_PROMPT = `You are a housing market analyst for Toronto, Canada.
You have access to official CMHC (Canada Mortgage and Housing Corporation) data via tools.
Always retrieve data before answering quantitative questions — never guess numbers.
Cite specific figures in your answers. Format values correctly ($2,847/mo, 2.4%, 38,200 units).
When multiple data sources are relevant, call all necessary tools before composing your answer.
Keep answers concise and insightful — lead with the key finding, then support with data.`;

@Injectable()
export class ChatService {
  private _anthropic: Anthropic | null = null;

  private get anthropic(): Anthropic {
    if (!this._anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in .env');
      this._anthropic = new Anthropic({ apiKey });
    }
    return this._anthropic;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly toolService: ToolService,
  ) {}

  async createConversation(userId: number): Promise<{ id: string }> {
    const conv = await this.prisma.conversation.create({
      data: { userId },
    });
    return { id: conv.id };
  }

  async getConversations(userId: number) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true },
    });
  }

  async getConversation(conversationId: string, userId: number) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true, toolCalls: true, createdAt: true },
        },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenException();
    return conv;
  }

  async deleteConversation(conversationId: string, userId: number): Promise<void> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenException();
    await this.prisma.conversation.delete({ where: { id: conversationId } });
  }

  async sendMessage(
    conversationId: string,
    userId: number,
    content: string,
    write: (event: ChatSseEvent) => void,
  ): Promise<void> {
    // 1. Validate ownership
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenException();

    // 2. Save user message
    await this.prisma.message.create({
      data: { conversationId, role: 'USER', content },
    });

    // 3. Build Anthropic messages array from history
    const messages: Anthropic.MessageParam[] = conv.messages.map((m) => ({
      role: m.role === 'USER' ? 'user' : 'assistant',
      content: m.content,
    }));
    messages.push({ role: 'user', content });

    // 4. Run agentic loop
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';
    let fullText = '';
    const toolCallsLog: Array<{ name: string; input: unknown }> = [];
    const isFirstMessage = conv.messages.length === 0;

    let continueLoop = true;
    while (continueLoop) {
      const stream = this.anthropic.messages.stream({
        model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
        tools: TOOL_DEFINITIONS,
      });

      stream.on('text', (text: string) => {
        fullText += text;
        write({ type: 'text', content: text });
      });

      const response = await stream.finalMessage();

      if (response.stop_reason === 'end_turn') {
        continueLoop = false;
      } else if (response.stop_reason === 'tool_use') {
        // Add assistant turn to messages
        messages.push({ role: 'assistant', content: response.content });

        // Execute each tool and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of response.content) {
          if (block.type === 'tool_use') {
            const toolInput = block.input as Record<string, unknown>;
            write({ type: 'tool_start', tool: block.name, input: toolInput });
            const result = await this.toolService.run(block.name, toolInput);
            write({ type: 'tool_end', tool: block.name });
            toolCallsLog.push({ name: block.name, input: toolInput });
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          }
        }

        messages.push({ role: 'user', content: toolResults });
      } else {
        continueLoop = false;
      }
    }

    // 5. Save assistant message
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: fullText,
        toolCalls: toolCallsLog.length > 0 ? (toolCallsLog as unknown as Prisma.InputJsonValue) : undefined,
      },
    });

    // 6. Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 7. Generate title for first message
    let title: string | undefined;
    if (isFirstMessage) {
      title = await this.generateTitle(content);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { title },
      });
    }

    write({ type: 'done', conversationId, title });
  }

  private async generateTitle(userMessage: string): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 20,
        messages: [{
          role: 'user',
          content: `Summarize this question in 4-6 words as a conversation title (no quotes, no punctuation):\n"${userMessage}"`,
        }],
      });
      const block = response.content[0];
      return block.type === 'text' ? block.text.trim() : 'New conversation';
    } catch {
      return 'New conversation';
    }
  }
}
