import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../prisma/prisma.service.js';
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
  private readonly anthropic: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly toolService: ToolService,
    anthropicClient?: Anthropic,
  ) {
    this.anthropic = anthropicClient ?? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

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

  // sendMessage implemented in Task 6
  async sendMessage(
    conversationId: string,
    userId: number,
    content: string,
    write: (event: ChatSseEvent) => void,
  ): Promise<void> {
    throw new Error('Not implemented yet');
  }
}
