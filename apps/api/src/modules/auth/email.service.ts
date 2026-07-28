import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthEmailService {
  private readonly logger = new Logger(AuthEmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly fromAddress: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress = this.configService.get<string>('EMAIL_FROM', 'noreply@nexa.app');
    this.appUrl = this.configService.get<string>('APP_URL', 'http://localhost:4000');

    if (this.configService.get<string>('NODE_ENV') === 'production') {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST', 'smtp.sendgrid.net'),
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: false,
        auth: {
          user: this.configService.get<string>('SMTP_USER', ''),
          pass: this.configService.get<string>('SMTP_PASS', ''),
        },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST', 'localhost'),
        port: this.configService.get<number>('SMTP_PORT', 1025),
        ignoreTLS: true,
      });
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl}/auth/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: 'Verify your email address',
        html: this.verificationTemplate(link),
      });
      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}: ${(error as Error).message}`);
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl}/auth/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: 'Reset your password',
        html: this.passwordResetTemplate(link),
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}: ${(error as Error).message}`);
    }
  }

  private verificationTemplate(link: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: sans-serif; padding: 24px;">
        <h1>Welcome to Nexa!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #6C63FF; color: #fff; text-decoration: none; border-radius: 8px;">
          Verify Email
        </a>
        <p style="margin-top: 24px; color: #666;">
          If you didn't create an account, you can ignore this email.
        </p>
      </body>
      </html>
    `;
  }

  private passwordResetTemplate(link: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: sans-serif; padding: 24px;">
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #6C63FF; color: #fff; text-decoration: none; border-radius: 8px;">
          Reset Password
        </a>
        <p style="margin-top: 24px; color: #666;">
          If you didn't request a password reset, please ignore this email.
        </p>
      </body>
      </html>
    `;
  }
}
