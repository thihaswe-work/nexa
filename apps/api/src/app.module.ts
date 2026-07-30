import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { DatabaseModule } from './database/database.module';
import { AppLoggerModule } from './infrastructure/logger/logger.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { NotificationsInfraModule } from './infrastructure/notifications/notification.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { UsersModule } from './modules/users/users.module';
import { InterestsModule } from './modules/interests/interests.module';
import { HealthModule } from './modules/health/health.module';
import { NearbyModule } from './modules/nearby/nearby.module';
import { WsModule } from './modules/ws/ws.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FilesModule } from './modules/files/files.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // Configuration (must be first)
    AppConfigModule,

    // Database
    DatabaseModule,

    // Infrastructure
    AppLoggerModule,
    RedisModule,
    StorageModule,
    NotificationsInfraModule,

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        throttlers: [
          {
            ttl: config.throttleTtl,
            limit: config.throttleLimit,
          },
        ],
      }),
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    InterestsModule,
    HealthModule,
    NearbyModule,
    WsModule,
    ChatModule,
    NotificationsModule,
    FilesModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
