import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ChatService, ChatSseEvent } from './chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';

interface AuthRequest {
  user: { id: number; email: string };
}

@Controller('api/v1/chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  createConversation(@Request() req: AuthRequest) {
    return this.chatService.createConversation(req.user.id);
  }

  @Get('conversations')
  getConversations(@Request() req: AuthRequest) {
    return this.chatService.getConversations(req.user.id);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.chatService.getConversation(id, req.user.id);
  }

  @Delete('conversations/:id')
  deleteConversation(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.chatService.deleteConversation(id, req.user.id);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Request() req: AuthRequest,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const write = (event: ChatSseEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      await this.chatService.sendMessage(id, req.user.id, dto.content, write);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      write({ type: 'error', message });
    } finally {
      res.end();
    }
  }
}
