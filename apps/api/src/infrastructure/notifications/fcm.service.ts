import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { AppConfigService } from '../../config/config.service';

export interface FcmMessage {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private initialized = false;

  constructor(private readonly config: AppConfigService) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.isFcmConfigured) {
      this.logger.warn('FCM not configured — push notifications disabled');
      return;
    }

    try {
      if (getApps().length === 0) {
        if (this.config.fcmServiceAccountPath) {
          initializeApp({ credential: cert(this.config.fcmServiceAccountPath) });
        } else {
          initializeApp({
            credential: cert({
              projectId: this.config.fcmProjectId,
              clientEmail: this.config.fcmClientEmail,
              privateKey: this.config.fcmPrivateKey.replace(/\\n/g, '\n'),
            }),
          });
        }
      }
      this.initialized = true;
      this.logger.log('FCM initialized successfully');
    } catch (error) {
      this.logger.error(`FCM initialization failed: ${(error as Error).message}`);
    }
  }

  async send(message: FcmMessage): Promise<boolean> {
    if (!this.initialized) {
      this.logger.warn(`FCM not initialized — skipping push to ${message.token.slice(0, 8)}...`);
      return false;
    }

    try {
      const messaging = getMessaging();
      const result = await messaging.send({
        token: message.token,
        notification: message.notification,
        data: message.data,
        android: { priority: 'high' },
        apns: {
          payload: {
            aps: { sound: 'default', badge: 1, contentAvailable: true },
          },
        },
      });
      this.logger.debug(`Push sent: ${result}`);
      return true;
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('registration-token-not-registered') || err.message.includes('NotRegistered')) {
        this.logger.warn(`FCM token invalid — ${message.token.slice(0, 8)}...`);
      } else {
        this.logger.error(`FCM send failed: ${err.message}`);
      }
      return false;
    }
  }

  async sendMulticast(messages: FcmMessage[]): Promise<{ success: number; failure: number }> {
    if (!this.initialized || messages.length === 0) {
      return { success: 0, failure: messages.length };
    }

    try {
      const messaging = getMessaging();
      const result = await messaging.sendEach(
        messages.map((m) => ({
          token: m.token,
          notification: m.notification,
          data: m.data,
          android: { priority: 'high' },
          apns: {
            payload: {
              aps: { sound: 'default', badge: 1, contentAvailable: true },
            },
          },
        })),
      );
      this.logger.debug(`Multicast push: ${result.successCount} success, ${result.failureCount} failure`);
      return { success: result.successCount, failure: result.failureCount };
    } catch (error) {
      this.logger.error(`FCM multicast failed: ${(error as Error).message}`);
      return { success: 0, failure: messages.length };
    }
  }

  get isReady(): boolean {
    return this.initialized;
  }
}
