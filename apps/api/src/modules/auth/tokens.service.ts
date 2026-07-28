import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { SessionService } from '../../infrastructure/redis/session.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
  private readonly refreshTokenTTL: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly sessionService: SessionService,
  ) {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
      this.refreshTokenTTL = value * (multipliers[unit] || 86400);
    } else {
      this.refreshTokenTTL = 7 * 86400;
    }
  }

  async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
    const [accessToken, refreshTokenRaw] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(),
    ]);

    const refreshTokenHash = this.hashToken(refreshTokenRaw);
    const expiresAt = new Date(Date.now() + this.refreshTokenTTL * 1000);

    await this.db.refreshToken.create({
      data: {
        userId: payload.sub,
        token: refreshTokenHash,
        expiresAt,
      },
    });

    await this.sessionService.createSession(payload.sub, refreshTokenHash);

    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    const accessMatch = accessExpiresIn.match(/^(\d+)([smhd])$/);
    let expiresIn = 900;
    if (accessMatch) {
      const v = parseInt(accessMatch[1], 10);
      const u = accessMatch[2];
      const m: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
      expiresIn = v * (m[u] || 60);
    }

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn,
    };
  }

  async refreshAccessToken(refreshTokenRaw: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshTokenRaw);

    const existingToken = await this.db.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: { include: { role: true } } },
    });

    if (!existingToken) {
      throw new Error('Invalid refresh token');
    }

    const reused = await this.sessionService.isTokenReused(existingToken.userId, tokenHash);
    if (reused) {
      await this.revokeAllUserTokens(existingToken.userId);
      await this.sessionService.revokeAllUserSessions(existingToken.userId);
      throw new Error('Refresh token has been reused — possible token theft');
    }

    if (existingToken.revokedAt) {
      await this.sessionService.trackTokenFamily(existingToken.userId, tokenHash, '');
      await this.revokeAllUserTokens(existingToken.userId);
      await this.sessionService.revokeAllUserSessions(existingToken.userId);
      throw new Error('Refresh token has been revoked — possible token theft');
    }

    if (existingToken.expiresAt < new Date()) {
      throw new Error('Refresh token has expired');
    }

    await this.db.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() },
    });

    await this.sessionService.revokeSession(existingToken.userId, tokenHash);

    const payload: JwtPayload = {
      sub: existingToken.user.id,
      email: existingToken.user.email,
      role: existingToken.user.role.name,
    };

    return this.generateTokenPair(payload);
  }

  async revokeRefreshToken(refreshTokenRaw: string): Promise<void> {
    const tokenHash = this.hashToken(refreshTokenRaw);
    await this.db.refreshToken.updateMany({
      where: { token: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.sessionService.revokeAllUserSessions(userId);
  }

  async revokeOtherUserTokens(userId: string, currentTokenHash: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null, token: { not: currentTokenHash } },
      data: { revokedAt: new Date() },
    });
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.db.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  private async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  private async generateRefreshToken(): Promise<string> {
    return randomBytes(48).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
