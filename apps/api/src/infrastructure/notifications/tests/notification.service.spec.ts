import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../../database/database.service';
import { NotificationQueueService } from '../notification-queue.service';
import { NotificationsService } from '../notification.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let db: jest.Mocked<DatabaseService>;
  let queue: jest.Mocked<NotificationQueueService>;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';

  const mockDb = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    device: {
      findMany: jest.fn(),
    },
  };

  const mockQueue = {
    enqueueMessagePush: jest.fn(),
    enqueueFriendRequestPush: jest.fn(),
    enqueueNearbyInvitePush: jest.fn(),
    enqueueAnnouncementPush: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: NotificationQueueService, useValue: mockQueue },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    db = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
    queue = module.get(NotificationQueueService) as jest.Mocked<NotificationQueueService>;

    // Default mock: no FCM tokens
    mockDb.device.findMany.mockResolvedValue([]);
  });

  describe('createInApp', () => {
    it('should create an in-app notification record', async () => {
      const now = new Date();
      mockDb.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: mockUserId,
        type: 'MESSAGE',
        title: 'Sender',
        body: 'Hello',
        data: { type: 'MESSAGE', conversationId: 'conv-1' },
        isRead: false,
        readAt: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      });

      const id = await service.createInApp({
        userId: mockUserId,
        type: 'MESSAGE' as any,
        title: 'Sender',
        body: 'Hello',
        data: { type: 'MESSAGE', conversationId: 'conv-1' },
      });

      expect(id).toBe('notif-1');
      expect(mockDb.notification.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          type: 'MESSAGE',
          title: 'Sender',
          body: 'Hello',
          data: { type: 'MESSAGE', conversationId: 'conv-1' },
        },
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications with unread count', async () => {
      const now = new Date();
      mockDb.notification.findMany.mockResolvedValue([
        { id: 'n1', userId: mockUserId, type: 'MESSAGE', title: 'Hi', body: 'Hello', isRead: false, createdAt: now },
        { id: 'n2', userId: mockUserId, type: 'FRIEND_REQUEST', title: 'FR', body: 'Request', isRead: true, createdAt: now },
      ]);
      mockDb.notification.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3);

      const result = await service.getUserNotifications(mockUserId, 50, 0);

      expect(result.total).toBe(10);
      expect(result.unreadCount).toBe(3);
      expect(result.notifications.length).toBe(2);
    });
  });

  describe('markAsRead / markAllAsRead', () => {
    it('should mark single notification as read', async () => {
      await service.markAsRead('notif-1', mockUserId);

      expect(mockDb.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: mockUserId },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });

    it('should mark all as read', async () => {
      await service.markAllAsRead(mockUserId);

      expect(mockDb.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });
  });

  describe('notifyNewMessage', () => {
    it('should create in-app notification and enqueue push when tokens exist', async () => {
      mockDb.notification.create.mockResolvedValue({ id: 'notif-1' });
      mockDb.device.findMany.mockResolvedValue([
        { fcmToken: 'token-1' },
        { fcmToken: 'token-2' },
      ]);

      const result = await service.notifyNewMessage({
        recipientUserId: mockUserId,
        senderName: 'Alice',
        senderId: 'sender-1',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        content: 'Hello!',
      });

      expect(result.inAppId).toBe('notif-1');
      expect(result.pushSent).toBe(true);
      expect(mockQueue.enqueueMessagePush).toHaveBeenCalledWith({
        tokens: ['token-1', 'token-2'],
        conversationId: 'conv-1',
        messageId: 'msg-1',
        senderName: 'Alice',
        senderId: 'sender-1',
        content: 'Hello!',
      });
    });

    it('should skip push when no FCM tokens', async () => {
      mockDb.notification.create.mockResolvedValue({ id: 'notif-2' });
      mockDb.device.findMany.mockResolvedValue([]);

      const result = await service.notifyNewMessage({
        recipientUserId: mockUserId,
        senderName: 'Bob',
        senderId: 'sender-2',
        conversationId: 'conv-2',
        messageId: 'msg-2',
        content: 'Hey',
      });

      expect(result.inAppId).toBe('notif-2');
      expect(result.pushSent).toBe(false);
      expect(mockQueue.enqueueMessagePush).not.toHaveBeenCalled();
    });
  });

  describe('notifyFriendRequest', () => {
    it('should create in-app notification and enqueue push', async () => {
      mockDb.notification.create.mockResolvedValue({ id: 'fr-notif' });
      mockDb.device.findMany.mockResolvedValue([{ fcmToken: 'token-1' }]);

      const result = await service.notifyFriendRequest({
        toUserId: mockUserId,
        fromUserId: 'from-1',
        fromName: 'Charlie',
        friendRequestId: 'fr-1',
      });

      expect(result.inAppId).toBe('fr-notif');
      expect(mockQueue.enqueueFriendRequestPush).toHaveBeenCalled();
    });
  });

  describe('notifyNearbyInvite', () => {
    it('should create in-app notification and enqueue push', async () => {
      mockDb.notification.create.mockResolvedValue({ id: 'nearby-notif' });
      mockDb.device.findMany.mockResolvedValue([{ fcmToken: 'token-1' }]);

      const result = await service.notifyNearbyInvite({
        toUserId: mockUserId,
        fromUserId: 'from-1',
        fromName: 'Diana',
        locationName: 'Central Park',
        conversationId: 'conv-1',
      });

      expect(result.inAppId).toBe('nearby-notif');
      expect(mockQueue.enqueueNearbyInvitePush).toHaveBeenCalled();
    });
  });

  describe('notifyAnnouncement', () => {
    it('should create in-app notifications for all users and enqueue announcement push', async () => {
      mockDb.notification.create.mockResolvedValue({ id: 'announce-notif' });
      mockDb.device.findMany
        .mockResolvedValueOnce([{ fcmToken: 'token-1' }])
        .mockResolvedValueOnce([]);

      await service.notifyAnnouncement({
        userIds: [mockUserId, 'user-2'],
        title: 'System Update',
        body: 'New features available!',
        data: { version: '2.0' },
      });

      expect(mockDb.notification.create).toHaveBeenCalledTimes(2);
      expect(mockQueue.enqueueAnnouncementPush).toHaveBeenCalled();
    });
  });
});
