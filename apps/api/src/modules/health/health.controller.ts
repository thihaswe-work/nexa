import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check API health status' })
  @ApiResponse({
    status: 200,
    description: 'Health check response',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 3600,
        checks: {
          database: { status: 'up', latency: 5 },
          redis: { status: 'up', latency: 2 },
          memory: { status: 'up', usage: 45.2 },
        },
      },
    },
  })
  async check() {
    return this.healthService.check();
  }

  @Get('live')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe' })
  getLiveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness probe' })
  async getReadiness() {
    return this.healthService.checkReadiness();
  }
}
