import { Test, TestingModule } from '@nestjs/testing';
import { PresenceService } from '../presence.service';
import { RedisService } from '../redis.service';

describe('PresenceService', () => {
  let service: PresenceService;
  let redis: jest.Mocked<RedisService>;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';

  const mockRedis = {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn(),
    sadd: jest.fn().mockResolvedValue(1),
    srem: jest.fn().mockResolvedValue(1),
    smembers: jest.fn(),
    scard: jest.fn(),
    expire: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PresenceService,
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<PresenceService>(PresenceService);
    redis = module.get(RedisService) as jest.Mocked<RedisService>;
    jest.clearAllMocks();
  });

  describe('setOnline', () => {
    it('should mark user online with heartbeat', async () => {
      await service.setOnline(mockUserId);

      expect(redis.set).toHaveBeenCalledWith(
        `presence:online:${mockUserId}`,
        expect.any(String),
        120,
      );
      expect(redis.set).toHaveBeenCalledWith(
        `presence:status:${mockUserId}`,
        expect.objectContaining({ userId: mockUserId, status: 'online' }),
        120,
      );
      expect(redis.sadd).toHaveBeenCalledWith('presence:online-set', mockUserId);
    });

    it('should support custom status', async () => {
      await service.setOnline(mockUserId, 'busy');

      expect(redis.set).toHaveBeenCalledWith(
        `presence:status:${mockUserId}`,
        expect.objectContaining({ status: 'busy' }),
        120,
      );
    });
  });

  describe('setOffline', () => {
    it('should remove user from online set and presence keys', async () => {
      await service.setOffline(mockUserId);

      expect(redis.del).toHaveBeenCalledWith(`presence:online:${mockUserId}`);
      expect(redis.del).toHaveBeenCalledWith(`presence:status:${mockUserId}`);
      expect(redis.srem).toHaveBeenCalledWith('presence:online-set', mockUserId);
    });
  });

  describe('isOnline', () => {
    it('should return true when user is online', async () => {
      mockRedis.exists.mockResolvedValue(true);

      const result = await service.isOnline(mockUserId);

      expect(result).toBe(true);
      expect(redis.exists).toHaveBeenCalledWith(`presence:online:${mockUserId}`);
    });

    it('should return false when user is not online', async () => {
      mockRedis.exists.mockResolvedValue(false);

      const result = await service.isOnline(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('getOnlineUserIds', () => {
    it('should return list of online user IDs', async () => {
      mockRedis.smembers.mockResolvedValue([mockUserId, 'user-2']);

      const result = await service.getOnlineUserIds();

      expect(result).toEqual([mockUserId, 'user-2']);
    });

    it('should return empty list when no users online', async () => {
      mockRedis.smembers.mockResolvedValue([]);

      const result = await service.getOnlineUserIds();

      expect(result).toEqual([]);
    });
  });

  describe('getOnlineCount', () => {
    it('should return count of online users', async () => {
      mockRedis.scard.mockResolvedValue(5);

      const result = await service.getOnlineCount();

      expect(result).toBe(5);
    });
  });

  describe('heartbeat', () => {
    it('should update lastSeenAt for online users', async () => {
      mockRedis.get.mockResolvedValue({
        userId: mockUserId,
        status: 'online',
        lastSeenAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await service.heartbeat(mockUserId);

      expect(redis.set).toHaveBeenCalledTimes(2);
    });

    it('should do nothing for offline users', async () => {
      mockRedis.get.mockResolvedValue(null);

      await service.heartbeat(mockUserId);

      expect(redis.set).not.toHaveBeenCalled();
    });
  });
});
