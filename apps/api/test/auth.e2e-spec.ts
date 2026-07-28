import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    const validUser = {
      username: 'e2e-test-user',
      email: 'e2e@example.com',
      password: 'SecureP@ss123',
      displayName: 'E2E Test',
    };

    it('should register a new user', async () => {
      const res = await request(httpServer)
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await request(httpServer)
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(409);
    });

    it('should reject weak password', async () => {
      await request(httpServer)
        .post('/api/v1/auth/register')
        .send({ ...validUser, username: 'weakpw', password: '123' })
        .expect(400);
    });

    it('should reject missing fields', async () => {
      await request(httpServer)
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(httpServer)
        .post('/api/v1/auth/login')
        .send({ email: 'e2e@example.com', password: 'SecureP@ss123' })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe('e2e@example.com');
    });

    it('should reject invalid password', async () => {
      await request(httpServer)
        .post('/api/v1/auth/login')
        .send({ email: 'e2e@example.com', password: 'wrong-password' })
        .expect(401);
    });

    it('should reject non-existent email', async () => {
      await request(httpServer)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'SecureP@ss123' })
        .expect(401);
    });

    it('should reject empty body', async () => {
      await request(httpServer)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const res = await request(httpServer)
        .post('/api/v1/auth/login')
        .send({ email: 'e2e@example.com', password: 'SecureP@ss123' });
      refreshToken = res.body.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const res = await request(httpServer)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      await request(httpServer)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('Auth-required endpoints', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(httpServer)
        .post('/api/v1/auth/login')
        .send({ email: 'e2e@example.com', password: 'SecureP@ss123' });
      accessToken = res.body.accessToken;
    });

    it('should access /api/v1/auth/me with valid token', async () => {
      await request(httpServer)
        .post('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject /api/v1/auth/me without token', async () => {
      await request(httpServer)
        .post('/api/v1/auth/me')
        .expect(401);
    });

    it('should reject /api/v1/auth/me with invalid token', async () => {
      await request(httpServer)
        .post('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
