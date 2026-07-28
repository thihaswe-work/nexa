import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(4000),
  API_PREFIX: Joi.string().default('/api/v1'),
  HOST: Joi.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: Joi.string()
    .uri()
    .required(),

  // Redis
  REDIS_URL: Joi.string()
    .uri()
    .required(),
  REDIS_PREFIX: Joi.string().default('nexa:'),

  // Application URL
  APP_URL: Joi.string().uri().default('http://localhost:4000'),

  // JWT
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'string.min': 'JWT_SECRET must be at least 32 characters long',
      'any.required': 'JWT_SECRET is required',
    }),
  JWT_ACCESS_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d'),
  JWT_ISSUER: Joi.string().default('nexa-api'),

  // Email (SMTP)
  SMTP_HOST: Joi.string().default('localhost'),
  SMTP_PORT: Joi.number().default(1025),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  EMAIL_FROM: Joi.string().email().default('noreply@nexa.app'),

  // Throttle
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  // Rate Limiting (Redis)
  RATE_LIMIT_LOGIN_MAX: Joi.number().default(10),
  RATE_LIMIT_LOGIN_WINDOW: Joi.number().default(300),
  RATE_LIMIT_API_MAX: Joi.number().default(200),
  RATE_LIMIT_API_WINDOW: Joi.number().default(60),

  // Presence
  PRESENCE_HEARTBEAT_INTERVAL: Joi.number().default(60),
  PRESENCE_OFFLINE_THRESHOLD: Joi.number().default(120),

  // Location Cache
  LOCATION_CACHE_TTL: Joi.number().default(300),

  // CORS
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  // File Uploads
  UPLOAD_DIR: Joi.string().default('./uploads'),

  // S3 / Cloudflare R2
  S3_ENDPOINT: Joi.string().uri().default(''),
  S3_REGION: Joi.string().default('auto'),
  S3_BUCKET: Joi.string().default('nexa-uploads'),
  S3_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  S3_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  S3_PUBLIC_URL: Joi.string().uri().default(''),
  S3_SIGNED_URL_EXPIRY: Joi.number().default(3600),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('debug'),

  // Firebase Cloud Messaging
  FCM_SERVICE_ACCOUNT_PATH: Joi.string().allow('').default(''),
  FCM_PROJECT_ID: Joi.string().allow('').default(''),
  FCM_CLIENT_EMAIL: Joi.string().email().allow('').default(''),
  FCM_PRIVATE_KEY: Joi.string().allow('').default(''),

  // BullMQ
  BULLMQ_CONCURRENCY: Joi.number().default(5),
  BULLMQ_RETRY_DELAY: Joi.number().default(5000),
  BULLMQ_MAX_RETRIES: Joi.number().default(5),

  // Swagger
  SWAGGER_ENABLED: Joi.boolean().default(true),
  SWAGGER_PATH: Joi.string().default('api/docs'),
});
