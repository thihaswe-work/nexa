import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../health.controller';
import { HealthService } from '../health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<HealthService>;

  const mockHealthService = {
    check: jest.fn(),
    checkReadiness: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthService, useValue: mockHealthService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get(HealthService) as jest.Mocked<HealthService>;
  });

  describe('check', () => {
    it('should return health status with all checks', async () => {
      const healthResult = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: { status: 'up', latency: 5 },
          redis: { status: 'up', latency: 2 },
          memory: { status: 'up', usage: 45.2 },
        },
      };

      mockHealthService.check.mockResolvedValue(healthResult);

      const result = await controller.check();

      expect(result).toEqual(healthResult);
      expect(result.status).toBe('ok');
      expect(result.checks.database.status).toBe('up');
      expect(result.checks.redis.status).toBe('up');
    });

    it('should report degraded status when a dependency is down', async () => {
      mockHealthService.check.mockResolvedValue({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: { status: 'up', latency: 5 },
          redis: { status: 'down', error: 'Connection refused' },
          memory: { status: 'up', usage: 45.2 },
        },
      });

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.checks.redis.status).toBe('down');
    });
  });

  describe('getLiveness', () => {
    it('should return alive status', () => {
      const result = controller.getLiveness();

      expect(result.status).toBe('alive');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getReadiness', () => {
    it('should return ready status when all dependencies are up', async () => {
      mockHealthService.checkReadiness.mockResolvedValue({ status: 'ready' });

      const result = await controller.getReadiness();

      expect(result.status).toBe('ready');
    });

    it('should return not_ready when dependencies are down', async () => {
      mockHealthService.checkReadiness.mockResolvedValue({ status: 'not_ready' });

      const result = await controller.getReadiness();

      expect(result.status).toBe('not_ready');
    });
  });
});
