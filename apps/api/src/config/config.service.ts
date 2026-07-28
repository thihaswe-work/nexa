import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 4000);
  }

  get host(): string {
    return this.configService.get<string>('HOST', '0.0.0.0');
  }

  get apiPrefix(): string {
    return this.configService.get<string>('API_PREFIX', '/api/v1');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get databaseUrl(): string {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }

  get redisUrl(): string {
    return this.configService.getOrThrow<string>('REDIS_URL');
  }

  get redisPrefix(): string {
    return this.configService.get<string>('REDIS_PREFIX', 'nexa:');
  }

  get jwtSecret(): string {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }

  get jwtAccessExpiresIn(): string {
    return this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
  }

  get jwtRefreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  get jwtIssuer(): string {
    return this.configService.get<string>('JWT_ISSUER', 'nexa-api');
  }

  get bcryptSaltRounds(): number {
    return this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
  }

  get throttleTtl(): number {
    return this.configService.get<number>('THROTTLE_TTL', 60);
  }

  get throttleLimit(): number {
    return this.configService.get<number>('THROTTLE_LIMIT', 100);
  }

  get rateLimitLoginMax(): number {
    return this.configService.get<number>('RATE_LIMIT_LOGIN_MAX', 10);
  }

  get rateLimitLoginWindow(): number {
    return this.configService.get<number>('RATE_LIMIT_LOGIN_WINDOW', 300);
  }

  get rateLimitApiMax(): number {
    return this.configService.get<number>('RATE_LIMIT_API_MAX', 200);
  }

  get rateLimitApiWindow(): number {
    return this.configService.get<number>('RATE_LIMIT_API_WINDOW', 60);
  }

  get presenceHeartbeatInterval(): number {
    return this.configService.get<number>('PRESENCE_HEARTBEAT_INTERVAL', 60);
  }

  get presenceOfflineThreshold(): number {
    return this.configService.get<number>('PRESENCE_OFFLINE_THRESHOLD', 120);
  }

  get locationCacheTtl(): number {
    return this.configService.get<number>('LOCATION_CACHE_TTL', 300);
  }

  get corsOrigins(): string[] {
    const origins = this.configService.get<string>('CORS_ORIGINS', 'http://localhost:3000');
    return origins.split(',').map((o) => o.trim());
  }

  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'debug');
  }

  get swaggerEnabled(): boolean {
    return this.configService.get<boolean>('SWAGGER_ENABLED', true);
  }

  get swaggerPath(): string {
    return this.configService.get<string>('SWAGGER_PATH', 'api/docs');
  }

  // Firebase Cloud Messaging
  get fcmServiceAccountPath(): string {
    return this.configService.get<string>('FCM_SERVICE_ACCOUNT_PATH', '');
  }

  get fcmProjectId(): string {
    return this.configService.get<string>('FCM_PROJECT_ID', '');
  }

  get fcmClientEmail(): string {
    return this.configService.get<string>('FCM_CLIENT_EMAIL', '');
  }

  get fcmPrivateKey(): string {
    return this.configService.get<string>('FCM_PRIVATE_KEY', '');
  }

  get isFcmConfigured(): boolean {
    if (this.fcmServiceAccountPath) return true;
    return !!(this.fcmProjectId && this.fcmClientEmail && this.fcmPrivateKey);
  }

  // BullMQ
  get bullmqConcurrency(): number {
    return this.configService.get<number>('BULLMQ_CONCURRENCY', 5);
  }

  get bullmqRetryDelay(): number {
    return this.configService.get<number>('BULLMQ_RETRY_DELAY', 5000);
  }

  get bullmqMaxRetries(): number {
    return this.configService.get<number>('BULLMQ_MAX_RETRIES', 5);
  }

  // S3 / Cloudflare R2
  get s3Endpoint(): string {
    return this.configService.get<string>('S3_ENDPOINT', '');
  }

  get s3Region(): string {
    return this.configService.get<string>('S3_REGION', 'auto');
  }

  get s3Bucket(): string {
    return this.configService.get<string>('S3_BUCKET', 'nexa-uploads');
  }

  get s3AccessKeyId(): string {
    return this.configService.get<string>('S3_ACCESS_KEY_ID', '');
  }

  get s3SecretAccessKey(): string {
    return this.configService.get<string>('S3_SECRET_ACCESS_KEY', '');
  }

  get s3PublicUrl(): string {
    return this.configService.get<string>('S3_PUBLIC_URL', '');
  }

  get s3SignedUrlExpiry(): number {
    return this.configService.get<number>('S3_SIGNED_URL_EXPIRY', 3600);
  }

  get isS3Configured(): boolean {
    return !!(this.s3Endpoint && this.s3AccessKeyId && this.s3SecretAccessKey);
  }
}
