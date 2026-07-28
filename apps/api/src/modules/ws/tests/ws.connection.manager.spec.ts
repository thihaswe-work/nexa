import { Test, TestingModule } from '@nestjs/testing';
import { WsConnectionManager } from '../ws.connection.manager';
import { RedisService } from '../../../infrastructure/redis/redis.service';

describe('WsConnectionManager', () => {
  let manager: WsConnectionManager;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockSocketId = 'socket-123';

  const rawClient = {
    sadd: jest.fn().mockResolvedValue(1),
    srem: jest.fn().mockResolvedValue(1),
    smembers: jest.fn(),
    scard: jest.fn(),
    keys: jest.fn(),
    setex: jest.fn().mockResolvedValue('OK'),
  };

  const mockRedis = {
    get: jest.fn(),
    exists: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    key: jest.fn((suffix: string) => `nexa:${suffix}`),
    getRawClient: jest.fn(() => rawClient),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsConnectionManager,
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    manager = module.get<WsConnectionManager>(WsConnectionManager);
  });

  describe('register', () => {
    it('should store socket-to-user mapping with TTL', async () => {
      await manager.register(mockUserId, mockSocketId);

      expect(rawClient.sadd).toHaveBeenCalledWith(
        `nexa:socket:user:${mockUserId}`,
        mockSocketId,
      );
      expect(rawClient.setex).toHaveBeenCalledWith(
        `nexa:socket:sid:${mockSocketId}`,
        86400,
        mockUserId,
      );
    });
  });

  describe('unregister', () => {
    it('should remove mappings and return userId', async () => {
      mockRedis.get.mockResolvedValue(mockUserId);

      const result = await manager.unregister(mockSocketId);

      expect(result).toBe(mockUserId);
      expect(rawClient.srem).toHaveBeenCalledWith(
        `nexa:socket:user:${mockUserId}`,
        mockSocketId,
      );
      expect(mockRedis.del).toHaveBeenCalledWith(`socket:sid:${mockSocketId}`);
    });

    it('should return null when socket not registered', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await manager.unregister(mockSocketId);

      expect(result).toBeNull();
    });
  });

  describe('getUserSockets', () => {
    it('should return all sockets for a user', async () => {
      rawClient.smembers.mockResolvedValue([mockSocketId, 'socket-456']);

      const result = await manager.getUserSockets(mockUserId);

      expect(result).toEqual([mockSocketId, 'socket-456']);
    });
  });

  describe('isUserConnected', () => {
    it('should return true when user has active sockets', async () => {
      rawClient.scard.mockResolvedValue(2);

      const result = await manager.isUserConnected(mockUserId);

      expect(result).toBe(true);
    });

    it('should return false when user has no sockets', async () => {
      rawClient.scard.mockResolvedValue(0);

      const result = await manager.isUserConnected(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('getAllConnectedUserIds', () => {
    it('should return all users with active sockets', async () => {
      rawClient.keys.mockResolvedValue([
        `nexa:socket:user:${mockUserId}`,
        'nexa:socket:user:user-2',
      ]);

      const result = await manager.getAllConnectedUserIds();

      expect(result).toEqual([mockUserId, 'user-2']);
    });
  });
});
