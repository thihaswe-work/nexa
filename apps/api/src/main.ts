import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  VersioningType,
  Logger,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';
import { RedisIoAdapter } from './modules/ws/ws.adapter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');

  // Security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // Serve uploaded files
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  app.useStaticAssets(join(process.cwd(), uploadDir), {
    prefix: '/uploads',
    maxAge: '7d',
  });

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Socket.IO with Redis adapter for horizontal scaling
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(configService.redisUrl);
  app.useWebSocketAdapter(redisIoAdapter);

  // Global prefix
  app.setGlobalPrefix(configService.apiPrefix, {
    exclude: ['health', 'health/live', 'health/ready'],
  });

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(
    new PrismaExceptionFilter(),
    new HttpExceptionFilter(),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );

  // Swagger documentation
  if (configService.swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Nexa API')
      .setDescription('Location-based social application REST API')
      .setVersion('1.0.0')
      .setContact('Nexa Team', '', 'dev@nexa.app')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token',
        },
        'JWT-auth',
      )
      .addTag('health', 'Health check endpoints')
      .addServer(
        configService.isProduction
          ? 'https://api.nexa.app'
          : `http://localhost:${configService.port}`,
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(configService.swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Nexa API Documentation',
    });

    logger.log(`Swagger docs available at /${configService.swaggerPath}`);
  }

  // Start server
  const port = configService.port;
  const host = configService.host;

  await app.listen(port, host);

  logger.log(`Application running on http://${host}:${port}`);
  logger.log(`Environment: ${configService.nodeEnv}`);
  logger.log(`API prefix: ${configService.apiPrefix}`);
}

bootstrap();
