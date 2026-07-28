import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Logger, INestApplication } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private allowedOrigins: string[];

  constructor(app: INestApplication) {
    super(app);
    const configService = app.get(AppConfigService);
    this.allowedOrigins = configService.corsOrigins;
  }

  async connectToRedis(redisUrl: string): Promise<void> {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);

    this.logger.log('Socket.IO Redis adapter initialized');
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const cors = {
      origin: this.allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    };

    const server = super.createIOServer(port, {
      ...options,
      cors,
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }
}
