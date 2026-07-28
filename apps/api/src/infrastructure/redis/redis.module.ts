import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/config.module';
import { RedisService } from './redis.service';
import { PresenceService } from './presence.service';
import { LocationCacheService } from './location-cache.service';
import { SessionService } from './session.service';
import { RateLimitService } from './rate-limit.service';
import { RedisPubSubService } from './redis-pubsub.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    RedisService,
    PresenceService,
    LocationCacheService,
    SessionService,
    RateLimitService,
    RedisPubSubService,
  ],
  exports: [
    RedisService,
    PresenceService,
    LocationCacheService,
    SessionService,
    RateLimitService,
    RedisPubSubService,
  ],
})
export class RedisModule {}
