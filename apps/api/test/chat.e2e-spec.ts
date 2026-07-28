import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Chat (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let senderToken: string;
  let senderId: string;
  let receiverToken: string;
  let receiverId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    httpServer = app.getHttpServer();

    const senderRes = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({
        username: 'e2e-chat-sender',
        email: 'e2e-chat-sender@example.com',
        password: 'SecureP@ss123',
        displayName: 'Chat Sender',
      });

    senderToken = senderRes.body.accessToken;
    senderId = senderRes.body.user.id;

    const receiverRes = await request(httpServer)
      .post('/api/v1/auth/register')
      .send({
        username: 'e2e-chat-receiver',
        email: 'e2e-chat-receiver@example.com',
        password: 'SecureP@ss123',
        displayName: 'Chat Receiver',
      });

    receiverToken = receiverRes.body.accessToken;
    receiverId = receiverRes.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Conversations', () => {
    let conversationId: string;

    it('should create or get a direct conversation', async () => {
      const res = await request(httpServer)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ participantIds: [receiverId] })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.type).toBe('direct');
      conversationId = res.body.id;

      const res2 = await request(httpServer)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ participantIds: [receiverId] })
        .expect(200);

      expect(res2.body.id).toBe(conversationId);
    });

    it('should list conversations', async () => {
      const res = await request(httpServer)
        .get('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should require auth to create conversation', async () => {
      await request(httpServer)
        .post('/api/v1/chat/conversations')
        .send({ participantIds: [receiverId] })
        .expect(401);
    });
  });

  describe('Messages', () => {
    let conversationId: string;
    let messageId: string;

    beforeAll(async () => {
      const res = await request(httpServer)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ participantIds: [receiverId] });
      conversationId = res.body.id;
    });

    it('should send a message', async () => {
      const res = await request(httpServer)
        .post(`/api/v1/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ content: 'Hello from E2E test!' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.content).toBe('Hello from E2E test!');
      expect(res.body.senderId).toBe(senderId);
      messageId = res.body.id;
    });

    it('should list messages in conversation', async () => {
      const res = await request(httpServer)
        .get(`/api/v1/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject empty message content', async () => {
      await request(httpServer)
        .post(`/api/v1/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ content: '' })
        .expect(400);
    });

    it('should edit a message', async () => {
      const res = await request(httpServer)
        .patch(`/api/v1/chat/conversations/${conversationId}/messages/${messageId}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ content: 'Edited message' })
        .expect(200);

      expect(res.body.content).toBe('Edited message');
      expect(res.body.editedAt).toBeDefined();
    });

    it('should delete a message', async () => {
      const newMsg = await request(httpServer)
        .post(`/api/v1/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ content: 'To be deleted' });

      await request(httpServer)
        .delete(`/api/v1/chat/conversations/${conversationId}/messages/${newMsg.body.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(204);
    });
  });
});
