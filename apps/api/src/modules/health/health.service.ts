import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import * as os from 'os';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime: number;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
  ) {
    this.startTime = Date.now();
  }

  async check() {
    const dbStart = Date.now();
    const dbHealthy = await this.databaseService.healthCheck();
    const dbLatency = Date.now() - dbStart;

    const redisStart = Date.now();
    const redisHealthy = await this.redisService.healthCheck();
    const redisLatency = Date.now() - redisStart;

    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    const checks = {
      database: {
        status: dbHealthy ? 'up' : 'down',
        latency: dbLatency,
      },
      redis: {
        status: redisHealthy ? 'up' : 'down',
        latency: redisLatency,
      },
      memory: {
        status: memoryUsage.heapUsed / memoryUsage.heapTotal < 0.9 ? 'up' : 'degraded',
        usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
      },
      system: {
        uptime: Math.floor(process.uptime()),
        hostname: os.hostname(),
        platform: os.platform(),
        cpus: os.cpus().length,
        memory: {
          total: this.formatBytes(totalMemory),
          free: this.formatBytes(freeMemory),
          used: this.formatBytes(totalMemory - freeMemory),
        },
      },
    };

    const allHealthy = dbHealthy && redisHealthy;
    const status = allHealthy ? 'ok' : 'degraded';

    if (!allHealthy) {
      this.logger.warn('Health check detected degraded services');
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks,
    };
  }

  async checkReadiness() {
    const dbHealthy = await this.databaseService.healthCheck();
    const redisHealthy = await this.redisService.healthCheck();

    const allReady = dbHealthy && redisHealthy;

    return {
      status: allReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
      },
    };
  }

  private formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }
}
