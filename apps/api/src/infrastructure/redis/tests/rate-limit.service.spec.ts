import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from '../rate-limit.service';
import { RedisService } from '../redis.service';

describe('RateLimitService', () => {
  let service: RateLimitService;

  const rawClient = {
    script: jest.fn().mockRejectedValue(new Error('Script not supported')),
    zadd: jest.fn().mockResolvedValue(1),
  };

  const mockRedis = {
    eval: jest.fn(),
    zremrangebyscore: jest.fn().mockResolvedValue(0),
    zrangebyscore: jest.fn().mockResolvedValue([]),
    zcard: jest.fn(),
    zadd: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(true),
    key: jest.fn((suffix: string) => `nexa:${suffix}`),
    getRawClient: jest.fn(() => rawClient),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
  });

  describe('check', () => {
    it('should allow requests within limit', async () => {
      mockRedis.zcard.mockResolvedValue(0);
      mockRedis.eval.mockRejectedValue(new Error('Script not loaded'));

      const result = await service.check('api:general', 'user-1', 100, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
      expect(result.totalLimit).toBe(100);
      expect(rawClient.zadd).toHaveBeenCalled();
    });

    it('should block requests exceeding limit', async () => {
      mockRedis.zcard.mockResolvedValue(100);
      mockRedis.eval.mockRejectedValue(new Error('Script not loaded'));

      const result = await service.check('api:general', 'user-1', 100, 60);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.totalLimit).toBe(100);
    });

    it('should allow at exactly the limit', async () => {
      mockRedis.zcard.mockResolvedValue(99);
      mockRedis.eval.mockRejectedValue(new Error('Script not loaded'));

      const result = await service.check('api:general', 'user-1', 100, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });
  });

  describe('getRemaining', () => {
    it('should return remaining quota without consuming', async () => {
      mockRedis.zcard.mockResolvedValue(30);

      const result = await service.getRemaining('api:general', 'user-1', 100, 60);

      expect(result).toBe(70);
      expect(mockRedis.zremrangebyscore).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should delete the rate limit key', async () => {
      await service.reset('api:general', 'user-1');

      expect(mockRedis.del).toHaveBeenCalled();
    });
  });
});
