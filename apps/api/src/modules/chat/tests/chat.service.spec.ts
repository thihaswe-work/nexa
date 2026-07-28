import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { LocationCacheService } from '../../../infrastructure/redis/location-cache.service';
import { NotificationsService } from '../../../infrastructure/notifications/notification.service';
import { WsGateway } from '../../ws/ws.gateway';
import { ChatService } from '../chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let db: jest.Mocked<DatabaseService>;
  let wsGateway: jest.Mocked<WsGateway>;
  let locationCache: jest.Mocked<LocationCacheService>;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockOtherUserId = '660e8400-e29b-41d4-a716-446655440001';
  const mockConversationId = '770e8400-e29b-41d4-a716-446655440002';
  const mockMessageId = '880e8400-e29b-41d4-a716-446655440003';

  const mockDb = {
    conversation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    conversationParticipant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    messageReaction: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockWsGateway = {
    sendToUser: jest.fn(),
    sendToConversation: jest.fn(),
  };

  const mockLocationCache = {
    getLocation: jest.fn(),
  };

  const mockNotifications = {
    notifyNewMessage: jest.fn().mockResolvedValue({ inAppId: 'n1', pushSent: false }),
    createInApp: jest.fn(),
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: LocationCacheService, useValue: mockLocationCache },
        { provide: WsGateway, useValue: mockWsGateway },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    db = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
    wsGateway = module.get(WsGateway) as jest.Mocked<WsGateway>;
    locationCache = module.get(LocationCacheService) as jest.Mocked<LocationCacheService>;
  });

  // ─── Conversation Tests ──────────────────────

  describe('getConversations', () => {
    it('should return paginated conversations with unread counts', async () => {
      const mockParticipant = {
        userId: mockUserId,
        conversationId: mockConversationId,
        lastReadAt: new Date('2026-01-01'),
        conversation: {
          id: mockConversationId,
          name: null,
          isGroup: false,
          isLocationBased: false,
          lastMessageAt: new Date('2026-07-28'),
          lastMessagePreview: 'Hello',
          createdAt: new Date(),
          participants: [
            {
              userId: mockUserId,
              joinedAt: new Date(),
              lastReadAt: new Date('2026-01-01'),
              lastDeliveredAt: null,
              user: {
                id: mockUserId,
                profile: { displayName: 'User1', avatarUrl: null },
              },
            },
          ],
        },
      };

      mockDb.conversationParticipant.findMany.mockResolvedValue([mockParticipant]);
      mockDb.conversationParticipant.count.mockResolvedValue(1);
      mockDb.message.count.mockResolvedValue(3);

      const result = await service.getConversations(mockUserId, { limit: 50, offset: 0 });

      expect(result.total).toBe(1);
      expect(result.conversations.length).toBe(1);
      expect(result.conversations[0].unreadCount).toBe(3);
    });

    it('should return empty list when no conversations', async () => {
      mockDb.conversationParticipant.findMany.mockResolvedValue([]);
      mockDb.conversationParticipant.count.mockResolvedValue(0);

      const result = await service.getConversations(mockUserId, { limit: 50 });

      expect(result.total).toBe(0);
      expect(result.conversations).toEqual([]);
    });
  });

  describe('getOrCreatePrivateConversation', () => {
    it('should return existing private conversation', async () => {
      const mockConv = {
        id: mockConversationId,
        name: null,
        isGroup: false,
        isLocationBased: false,
        lastMessageAt: null,
        lastMessagePreview: null,
        createdAt: new Date(),
        participants: [
          {
            userId: mockUserId,
            joinedAt: new Date(),
            lastReadAt: new Date(),
            lastDeliveredAt: null,
            user: { id: mockUserId, profile: { displayName: 'User1', avatarUrl: null } },
          },
        ],
      };

      mockDb.conversation.findFirst.mockResolvedValue(mockConv);

      const result = await service.getOrCreatePrivateConversation(mockUserId, {
        participantId: mockOtherUserId,
      });

      expect(result.id).toBe(mockConversationId);
      expect(mockDb.conversation.create).not.toHaveBeenCalled();
    });

    it('should create new private conversation if none exists', async () => {
      mockDb.conversation.findFirst.mockResolvedValue(null);
      mockDb.conversation.create.mockResolvedValue({
        id: 'new-conv-id',
        name: null,
        isGroup: false,
        isLocationBased: false,
        lastMessageAt: null,
        lastMessagePreview: null,
        createdAt: new Date(),
        participants: [
          {
            userId: mockUserId,
            joinedAt: new Date(),
            lastReadAt: new Date(),
            lastDeliveredAt: null,
            user: { id: mockUserId, profile: { displayName: 'User1', avatarUrl: null } },
          },
          {
            userId: mockOtherUserId,
            joinedAt: new Date(),
            lastReadAt: new Date(),
            lastDeliveredAt: null,
            user: { id: mockOtherUserId, profile: { displayName: 'User2', avatarUrl: null } },
          },
        ],
      });

      const result = await service.getOrCreatePrivateConversation(mockUserId, {
        participantId: mockOtherUserId,
      });

      expect(mockDb.conversation.create).toHaveBeenCalled();
      expect(result.id).toBe('new-conv-id');
      // Should notify both participants
      expect(wsGateway.sendToUser).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Message Tests ───────────────────────────

  describe('sendMessage', () => {
    it('should send message and broadcast to conversation', async () => {
      mockDb.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: mockConversationId,
        userId: mockUserId,
      });

      const now = new Date();
      mockDb.message.create.mockResolvedValue({
        id: mockMessageId,
        conversationId: mockConversationId,
        senderId: mockUserId,
        content: 'Hello!',
        type: 'TEXT',
        deliveredAt: null,
        readAt: null,
        editedAt: null,
        editCount: 0,
        createdAt: now,
        sender: {
          id: mockUserId,
          profile: { displayName: 'User1', avatarUrl: null },
        },
        attachments: [],
        reactions: [],
        replyTo: null,
      });

      const result = await service.sendMessage(mockUserId, mockConversationId, {
        content: 'Hello!',
      });

      expect(result.content).toBe('Hello!');
      expect(result.senderId).toBe(mockUserId);
      expect(mockWsGateway.sendToConversation).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not a participant', async () => {
      mockDb.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage(mockUserId, mockConversationId, { content: 'Hi' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('editMessage', () => {
    it('should edit own message and broadcast update', async () => {
      mockDb.message.findUnique.mockResolvedValue({
        id: mockMessageId,
        senderId: mockUserId,
        conversationId: mockConversationId,
        deletedAt: null,
      });

      mockDb.message.update.mockResolvedValue({
        id: mockMessageId,
        conversationId: mockConversationId,
        senderId: mockUserId,
        content: 'Edited!',
        type: 'TEXT',
        deliveredAt: null,
        readAt: null,
        editedAt: new Date(),
        editCount: 1,
        createdAt: new Date(),
        sender: {
          id: mockUserId,
          profile: { displayName: 'User1', avatarUrl: null },
        },
        attachments: [],
        reactions: [],
        replyTo: null,
      });

      const result = await service.editMessage(mockUserId, mockMessageId, { content: 'Edited!' });

      expect(result.content).toBe('Edited!');
      expect(result.editCount).toBe(1);
      expect(mockWsGateway.sendToConversation).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when editing another user message', async () => {
      mockDb.message.findUnique.mockResolvedValue({
        id: mockMessageId,
        senderId: mockOtherUserId,
        conversationId: mockConversationId,
        deletedAt: null,
      });

      await expect(
        service.editMessage(mockUserId, mockMessageId, { content: 'Hack!' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when message not found', async () => {
      mockDb.message.findUnique.mockResolvedValue(null);

      await expect(
        service.editMessage(mockUserId, mockMessageId, { content: 'Edit' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMessage', () => {
    it('should soft delete own message and broadcast', async () => {
      mockDb.message.findUnique.mockResolvedValue({
        id: mockMessageId,
        senderId: mockUserId,
        conversationId: mockConversationId,
        deletedAt: null,
      });

      await service.deleteMessage(mockUserId, mockMessageId);

      expect(mockDb.message.update).toHaveBeenCalledWith({
        where: { id: mockMessageId },
        data: { deletedAt: expect.any(Date), content: null },
      });
      expect(mockWsGateway.sendToConversation).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when deleting another user message', async () => {
      mockDb.message.findUnique.mockResolvedValue({
        id: mockMessageId,
        senderId: mockOtherUserId,
        conversationId: mockConversationId,
        deletedAt: null,
      });

      await expect(
        service.deleteMessage(mockUserId, mockMessageId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Reaction Tests ──────────────────────────

  describe('addReaction', () => {
    it('should add emoji reaction and broadcast', async () => {
      mockDb.message.findUnique.mockResolvedValue({
        id: mockMessageId,
        conversationId: mockConversationId,
        deletedAt: null,
      });

      mockDb.messageReaction.upsert.mockResolvedValue({});

      const result = await service.addReaction(mockUserId, mockMessageId, { emoji: '👍' });

      expect(result.emoji).toBe('👍');
      expect(result.userId).toBe(mockUserId);
      expect(mockWsGateway.sendToConversation).toHaveBeenCalled();
    });

    it('should throw NotFoundException for deleted message', async () => {
      mockDb.message.findUnique.mockResolvedValue({
        id: mockMessageId,
        conversationId: mockConversationId,
        deletedAt: new Date(),
      });

      await expect(
        service.addReaction(mockUserId, mockMessageId, { emoji: '❤️' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeReaction', () => {
    it('should remove reaction and broadcast', async () => {
      mockDb.message.findUnique.mockResolvedValue({
        id: mockMessageId,
        conversationId: mockConversationId,
        deletedAt: null,
      });

      await service.removeReaction(mockUserId, mockMessageId, '👍');

      expect(mockDb.messageReaction.deleteMany).toHaveBeenCalledWith({
        where: { messageId: mockMessageId, userId: mockUserId, emoji: '👍' },
      });
      expect(mockWsGateway.sendToConversation).toHaveBeenCalled();
    });
  });

  // ─── Nearby Chat Tests ───────────────────────

  describe('getNearbyRooms', () => {
    it('should return nearby location-based rooms when user has location', async () => {
      mockLocationCache.getLocation.mockResolvedValue({ lat: 40.71, lng: -74.00, updatedAt: new Date().toISOString() });

      mockDb.$queryRaw.mockResolvedValue([
        {
          id: 'room-1',
          name: 'Central Park Chat',
          locationName: 'Central Park',
          locationLat: 40.71,
          locationLng: -74.00,
          locationRadius: 500,
          distanceMeters: 50,
          participantCount: 5,
        },
      ]);

      mockDb.conversationParticipant.findMany.mockResolvedValue([{ conversationId: 'room-1' }]);

      const result = await service.getNearbyRooms(mockUserId, { radius: 1000 });

      expect(result.total).toBe(1);
      expect(result.conversations[0].name).toBe('Central Park Chat');
      expect(result.conversations[0].isJoined).toBe(true);
    });

    it('should return empty array when no location available', async () => {
      mockLocationCache.getLocation.mockResolvedValue(null);
      mockDb.$queryRaw.mockResolvedValue([]);

      const result = await service.getNearbyRooms(mockUserId, {});

      expect(result.total).toBe(0);
      expect(result.conversations).toEqual([]);
    });
  });

  describe('joinNearbyRoom', () => {
    it('should allow joining a location-based room', async () => {
      mockDb.conversation.findUnique.mockResolvedValue({
        id: 'room-1',
        isLocationBased: true,
        deletedAt: null,
      });

      mockDb.conversationParticipant.upsert.mockResolvedValue({} as any);

      await service.joinNearbyRoom(mockUserId, 'room-1');

      expect(mockDb.conversationParticipant.upsert).toHaveBeenCalledWith({
        where: { conversationId_userId: { conversationId: 'room-1', userId: mockUserId } },
        update: {},
        create: { conversationId: 'room-1', userId: mockUserId },
      });
    });

    it('should throw NotFoundException for non-existent room', async () => {
      mockDb.conversation.findUnique.mockResolvedValue(null);

      await expect(
        service.joinNearbyRoom(mockUserId, 'room-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-location-based room', async () => {
      mockDb.conversation.findUnique.mockResolvedValue({
        id: 'room-1',
        isLocationBased: false,
        deletedAt: null,
      });

      await expect(
        service.joinNearbyRoom(mockUserId, 'room-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('leaveNearbyRoom', () => {
    it('should remove user from room', async () => {
      await service.leaveNearbyRoom(mockUserId, 'room-1');

      expect(mockDb.conversationParticipant.deleteMany).toHaveBeenCalledWith({
        where: { conversationId: 'room-1', userId: mockUserId },
      });
    });
  });
});
