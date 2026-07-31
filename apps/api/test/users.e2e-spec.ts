import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './test-bootstrap';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    httpServer = app.getHttpServer();

    const registerRes = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({
        username: 'e2e_profile_test',
        email: 'e2e-profile@example.com',
        password: 'SecureP@ss123',
        displayName: 'Profile Test',
      });

    accessToken = registerRes.body.tokens.accessToken;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return current user profile', async () => {
      const res = await request(httpServer)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(userId);
      expect(res.body.username).toBe('e2e_profile_test');
      expect(res.body.profile.displayName).toBe('Profile Test');
    });

    it('should require authentication', async () => {
      await request(httpServer)
        .get('/api/v1/users/profile')
        .expect(401);
    });
  });

  describe('PATCH /api/v1/users/profile', () => {
    it('should update profile display name', async () => {
      const res = await request(httpServer)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ displayName: 'Updated Name', bio: 'New bio text' })
        .expect(200);

      expect(res.body.profile.displayName).toBe('Updated Name');
      expect(res.body.profile.bio).toBe('New bio text');
    });

    it('should reject empty body', async () => {
      await request(httpServer)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(200);
    });

    it('should require auth', async () => {
      await request(httpServer)
        .patch('/api/v1/users/profile')
        .send({ displayName: 'Hacker' })
        .expect(401);
    });
  });

  describe('GET /api/v1/users/privacy', () => {
    it('should return privacy settings', async () => {
      const res = await request(httpServer)
        .get('/api/v1/users/privacy')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.showLastSeen).toBeDefined();
      expect(res.body.showOnline).toBeDefined();
      expect(typeof res.body.showLastSeen).toBe('boolean');
    });
  });

  describe('PATCH /api/v1/users/privacy', () => {
    it('should update privacy settings', async () => {
      const res = await request(httpServer)
        .patch('/api/v1/users/privacy')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ showLastSeen: false, showOnline: false })
        .expect(200);

      expect(res.body.showLastSeen).toBe(false);
      expect(res.body.showOnline).toBe(false);
    });
  });

  describe('PUT /api/v1/users/interests', () => {
    it('should update user interests', async () => {
      const interestIds = [];

      const interestsRes = await request(httpServer)
        .get('/api/v1/interests')
        .set('Authorization', `Bearer ${accessToken}`);

      if (interestsRes.body.length > 0) {
        interestIds.push(interestsRes.body[0].id);
      }

      const res = await request(httpServer)
        .put('/api/v1/users/interests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ interestIds })
        .expect(200);

      expect(res.body.interests).toBeDefined();
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return public profile by ID', async () => {
      const res = await request(httpServer)
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(userId);
    });

    it('should return 404 for non-existent user', async () => {
      await request(httpServer)
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/users/nearby-visibility', () => {
    it('should toggle nearby visibility', async () => {
      const res = await request(httpServer)
        .patch('/api/v1/users/nearby-visibility')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ visible: false })
        .expect(200);

      expect(res.body.isNearbyVisible).toBe(false);
    });
  });
});
