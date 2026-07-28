import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /health should return 200', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBeDefined();
          expect(res.body.timestamp).toBeDefined();
        });
    });

    it('GET /health/live should return alive', () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('alive');
        });
    });

    it('GET /health/ready should return ready or not_ready', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect(200)
        .expect((res) => {
          expect(['ready', 'not_ready']).toContain(res.body.status);
        });
    });
  });

  describe('Global Configuration', () => {
    it('should have CORS headers', () => {
      return request(app.getHttpServer())
        .options('/health')
        .expect(204)
        .expect('Access-Control-Allow-Origin', '*');
    });

    it('should return 404 for unknown routes', () => {
      return request(app.getHttpServer())
        .get('/unknown-route')
        .expect(404);
    });
  });
});
