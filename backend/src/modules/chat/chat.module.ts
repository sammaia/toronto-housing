import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ToolService } from './chat.tools.js';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ToolService],
})
export class ChatModule {}
