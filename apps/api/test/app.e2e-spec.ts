import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './test-bootstrap';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /v1/health should return 200', () => {
      return request(app.getHttpServer())
        .get('/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBeDefined();
          expect(res.body.timestamp).toBeDefined();
        });
    });

    it('GET /v1/health/live should return alive', () => {
      return request(app.getHttpServer())
        .get('/v1/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('alive');
        });
    });

    it('GET /v1/health/ready should return ready or not_ready', () => {
      return request(app.getHttpServer())
        .get('/v1/health/ready')
        .expect(200)
        .expect((res) => {
          expect(['ready', 'not_ready']).toContain(res.body.status);
        });
    });
  });

  describe('Global Configuration', () => {
    it('should have CORS headers', () => {
      return request(app.getHttpServer())
        .options('/v1/health')
        .set('Origin', 'http://localhost:3000')
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
