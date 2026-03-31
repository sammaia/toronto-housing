import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service.js';

const mockConversation = { id: 'conv-1', userId: 1, title: null, createdAt: new Date(), updatedAt: new Date(), messages: [] };

const makePrisma = () => ({
  conversation: {
    create: jest.fn().mockResolvedValue(mockConversation),
    findMany: jest.fn().mockResolvedValue([mockConversation]),
    findUnique: jest.fn().mockResolvedValue(mockConversation),
    delete: jest.fn().mockResolvedValue(mockConversation),
    update: jest.fn().mockResolvedValue(mockConversation),
  },
  message: {
    create: jest.fn().mockResolvedValue({ id: 'msg-1' }),
  },
});

describe('ChatService CRUD', () => {
  let service: ChatService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    // ToolService and Anthropic not needed for CRUD tests
    service = new ChatService(prisma as any, {} as any, {} as any);
  });

  it('createConversation creates and returns conversation id', async () => {
    const result = await service.createConversation(1);
    expect(prisma.conversation.create).toHaveBeenCalledWith({
      data: { userId: 1 },
    });
    expect(result).toEqual({ id: 'conv-1' });
  });

  it('getConversations returns conversations for user', async () => {
    const result = await service.getConversations(1);
    expect(prisma.conversation.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true },
    });
    expect(result).toHaveLength(1);
  });

  it('deleteConversation throws ForbiddenException for wrong user', async () => {
    prisma.conversation.findUnique.mockResolvedValue({ ...mockConversation, userId: 999 });
    await expect(service.deleteConversation('conv-1', 1)).rejects.toThrow(ForbiddenException);
  });

  it('deleteConversation throws NotFoundException when conversation missing', async () => {
    prisma.conversation.findUnique.mockResolvedValue(null);
    await expect(service.deleteConversation('conv-1', 1)).rejects.toThrow(NotFoundException);
  });

  it('deleteConversation deletes when user matches', async () => {
    await service.deleteConversation('conv-1', 1);
    expect(prisma.conversation.delete).toHaveBeenCalledWith({ where: { id: 'conv-1' } });
  });
});
