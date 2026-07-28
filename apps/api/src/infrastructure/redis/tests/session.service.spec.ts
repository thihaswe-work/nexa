import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from '../session.service';
import { RedisService } from '../redis.service';

describe('SessionService', () => {
  let service: SessionService;
  let redis: jest.Mocked<RedisService>;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockTokenHash = 'a1b2c3d4e5f6...';

  const mockRedis = {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
    delByPattern: jest.fn().mockResolvedValue(3),
    exists: jest.fn(),
    hexists: jest.fn(),
    hset: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(true),
    key: jest.fn((suffix: string) => `nexa:${suffix}`),
    getRawClient: jest.fn(() => ({
      keys: jest.fn().mockResolvedValue([]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    redis = module.get(RedisService) as jest.Mocked<RedisService>;
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should store session data in Redis', async () => {
      await service.createSession(mockUserId, mockTokenHash);

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining(`sessions:${mockUserId}:`),
        expect.objectContaining({
          userId: mockUserId,
          refreshTokenHash: mockTokenHash,
        }),
        604800,
      );
    });

    it('should accept custom TTL', async () => {
      await service.createSession(mockUserId, mockTokenHash, 3600);

      expect(redis.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        3600,
      );
    });
  });

  describe('revokeAllUserSessions', () => {
    it('should revoke all sessions for a user', async () => {
      const result = await service.revokeAllUserSessions(mockUserId);

      expect(result).toBe(3);
      expect(redis.delByPattern).toHaveBeenCalledWith(`sessions:${mockUserId}:*`);
    });
  });

  describe('blacklistAccessToken', () => {
    it('should blacklist a JWT with TTL', async () => {
      await service.blacklistAccessToken('jti-123', 900);

      expect(redis.set).toHaveBeenCalledWith(
        'blacklist:jwt:jti-123',
        'true',
        900,
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      mockRedis.exists.mockResolvedValue(true);

      const result = await service.isTokenBlacklisted('jti-123');

      expect(result).toBe(true);
    });

    it('should return false for non-blacklisted token', async () => {
      mockRedis.exists.mockResolvedValue(false);

      const result = await service.isTokenBlacklisted('jti-456');

      expect(result).toBe(false);
    });
  });

  describe('trackTokenFamily', () => {
    it('should store token family entry', async () => {
      await service.trackTokenFamily(mockUserId, 'old-hash', 'new-hash');

      expect(redis.hset).toHaveBeenCalledWith(
        `token-family:${mockUserId}`,
        'old-hash',
        'new-hash',
      );
      expect(redis.expire).toHaveBeenCalledWith(
        `token-family:${mockUserId}`,
        604800,
      );
    });
  });

  describe('isTokenReused', () => {
    it('should detect reused token', async () => {
      mockRedis.hexists.mockResolvedValue(true);

      const result = await service.isTokenReused(mockUserId, 'old-hash');

      expect(result).toBe(true);
    });

    it('should return false for new token', async () => {
      mockRedis.hexists.mockResolvedValue(false);

      const result = await service.isTokenReused(mockUserId, 'new-hash');

      expect(result).toBe(false);
    });
  });
});
