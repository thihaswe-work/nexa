import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../../../database/database.service';
import { PresenceService } from '../../../infrastructure/redis/presence.service';
import { RedisPubSubService } from '../../../infrastructure/redis/redis-pubsub.service';
import { WsGateway } from '../ws.gateway';
import { WsConnectionManager } from '../ws.connection.manager';
import { WsEvent } from '../ws.events';

describe('WsGateway', () => {
  let gateway: WsGateway;
  let jwtService: jest.Mocked<JwtService>;
  let db: jest.Mocked<DatabaseService>;
  let presenceService: jest.Mocked<PresenceService>;
  let connectionManager: jest.Mocked<WsConnectionManager>;
  let pubSubService: jest.Mocked<RedisPubSubService>;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockSocketId = 'socket-123';

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockDb = {
    user: {
      findUnique: jest.fn(),
    },
    message: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    conversationParticipant: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockPresenceService = {
    setOnline: jest.fn(),
    setOffline: jest.fn(),
    isOnline: jest.fn(),
  };

  const mockConnectionManager = {
    register: jest.fn(),
    unregister: jest.fn(),
    isUserConnected: jest.fn(),
    countUserConnections: jest.fn(),
  };

  const mockPubSubService = {
    publishPresenceChange: jest.fn(),
  };

  let mockSocket: any;
  let mockServer: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: DatabaseService, useValue: mockDb },
        { provide: PresenceService, useValue: mockPresenceService },
        { provide: WsConnectionManager, useValue: mockConnectionManager },
        { provide: RedisPubSubService, useValue: mockPubSubService },
      ],
    }).compile();

    gateway = module.get<WsGateway>(WsGateway);

    mockSocket = {
      id: mockSocketId,
      handshake: { auth: {}, query: {} },
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
      to: jest.fn(() => ({
        emit: jest.fn(),
      })),
    };

    mockServer = {
      emit: jest.fn(),
      to: jest.fn(() => ({
        emit: jest.fn(),
      })),
    };

    (gateway as any).server = mockServer;
  });

  describe('handleConnection', () => {
    it('should authenticate with valid token and register connection', async () => {
      mockSocket.handshake.auth = { token: 'valid-jwt' };
      mockJwtService.verifyAsync.mockResolvedValue({ sub: mockUserId, role: 'user' });
      mockDb.user.findUnique.mockResolvedValue({ id: mockUserId, isActive: true, deletedAt: null });
      mockPresenceService.isOnline.mockResolvedValue(false);

      await gateway.handleConnection(mockSocket);

      expect(mockConnectionManager.register).toHaveBeenCalledWith(mockUserId, mockSocketId);
      expect(mockPresenceService.setOnline).toHaveBeenCalledWith(mockUserId);
      expect(mockServer.emit).toHaveBeenCalledWith(WsEvent.USER_ONLINE, {
        userId: mockUserId,
        status: 'online',
      });
      expect((mockSocket as any).userId).toBe(mockUserId);
    });

    it('should disconnect when no token provided', async () => {
      mockSocket.handshake.auth = {};

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect when token is invalid', async () => {
      mockSocket.handshake.auth = { token: 'bad-token' };
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should not broadcast online if user was already online', async () => {
      mockSocket.handshake.auth = { token: 'valid-jwt' };
      mockJwtService.verifyAsync.mockResolvedValue({ sub: mockUserId, role: 'user' });
      mockDb.user.findUnique.mockResolvedValue({ id: mockUserId, isActive: true, deletedAt: null });
      mockPresenceService.isOnline.mockResolvedValue(true);

      await gateway.handleConnection(mockSocket);

      expect(mockServer.emit).not.toHaveBeenCalledWith(WsEvent.USER_ONLINE, expect.anything());
    });
  });

  describe('handleDisconnect', () => {
    it('should mark user offline when no more connections', async () => {
      (mockSocket as any).userId = mockUserId;
      mockConnectionManager.unregister.mockResolvedValue(mockUserId);
      mockConnectionManager.isUserConnected.mockResolvedValue(false);

      await gateway.handleDisconnect(mockSocket);

      expect(mockPresenceService.setOffline).toHaveBeenCalledWith(mockUserId);
      expect(mockServer.emit).toHaveBeenCalledWith(WsEvent.USER_OFFLINE, expect.objectContaining({
        userId: mockUserId,
        status: 'offline',
      }));
    });

    it('should not mark offline when user has other connections', async () => {
      (mockSocket as any).userId = mockUserId;
      mockConnectionManager.unregister.mockResolvedValue(mockUserId);
      mockConnectionManager.isUserConnected.mockResolvedValue(true);

      await gateway.handleDisconnect(mockSocket);

      expect(mockPresenceService.setOffline).not.toHaveBeenCalled();
    });

    it('should do nothing for unauthenticated sockets', async () => {
      await gateway.handleDisconnect(mockSocket);

      expect(mockConnectionManager.unregister).not.toHaveBeenCalled();
    });
  });

  describe('handleTypingStart', () => {
    it('should broadcast typing start to conversation room', async () => {
      (mockSocket as any).userId = mockUserId;
      const payload = { conversationId: 'conv-1', userId: mockUserId };

      await gateway.handleTypingStart(mockSocket, payload);

      expect(mockSocket.to).toHaveBeenCalledWith(`conversation:conv-1`);
    });
  });

  describe('handleMessageDelivered', () => {
    it('should mark message as delivered and notify sender', async () => {
      (mockSocket as any).userId = 'recipient-id';
      const payload = { messageId: 'msg-1', conversationId: 'conv-1', deliveredAt: new Date().toISOString() };

      mockDb.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        senderId: mockUserId,
        conversationId: 'conv-1',
        deliveredAt: null,
      });

      await gateway.handleMessageDelivered(mockSocket, payload);

      expect(mockDb.message.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: { deliveredAt: expect.any(Date) },
      });
    });
  });

  describe('handleMessageRead', () => {
    it('should mark messages as read and notify senders', async () => {
      (mockSocket as any).userId = 'recipient-id';
      const payload = {
        conversationId: 'conv-1',
        messageIds: ['msg-1', 'msg-2'],
        readAt: new Date().toISOString(),
      };

      mockDb.message.findMany.mockResolvedValue([
        { id: 'msg-1', senderId: mockUserId, conversationId: 'conv-1' },
        { id: 'msg-2', senderId: mockUserId, conversationId: 'conv-1' },
      ]);

      await gateway.handleMessageRead(mockSocket, payload);

      expect(mockDb.message.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['msg-1', 'msg-2'] }, readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('sendToUser', () => {
    it('should emit event to user room', () => {
      gateway.sendToUser(mockUserId, 'test:event', { data: 123 });

      expect(mockServer.to).toHaveBeenCalledWith(`user:${mockUserId}`);
    });
  });
});
