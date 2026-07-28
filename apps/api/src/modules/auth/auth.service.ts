import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../database/database.service';
import { TokensService, JwtPayload } from './tokens.service';
import { AuthEmailService } from './email.service';
import { PresenceService } from '../../infrastructure/redis/presence.service';
import { RedisPubSubService } from '../../infrastructure/redis/redis-pubsub.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly tokensService: TokensService,
    private readonly emailService: AuthEmailService,
    private readonly presenceService: PresenceService,
    private readonly pubSubService: RedisPubSubService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.db.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException('Email is already registered');
      }
      throw new ConflictException('Username is already taken');
    }

    const defaultRole = await this.db.role.findFirst({
      where: { isDefault: true },
    });

    if (!defaultRole) {
      throw new Error('Default role not found. Run database seed.');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.db.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        roleId: defaultRole.id,
        isActive: true,
        verificationToken: uuidv4(),
        profile: {
          create: {
            displayName: dto.displayName,
          },
        },
      },
      include: {
        profile: true,
        role: true,
      },
    });

    const tokenPair = await this.tokensService.generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      user.verificationToken!,
    );

    this.logger.log(`User registered: ${user.email}`);

    return this.buildAuthResponse(user, tokenPair);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.db.user.findUnique({
      where: { email: dto.email },
      include: { profile: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account has been deactivated');
    }

    let passwordValid: boolean;
    try {
      passwordValid = await argon2.verify(user.password, dto.password);
    } catch {
      passwordValid = false;
    }

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokenPair = await this.tokensService.generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    await this.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), isOnline: true },
    });

    await this.presenceService.setOnline(user.id);
    await this.pubSubService.publishPresenceChange(user.id, 'online');

    this.logger.log(`User logged in: ${user.email}`);

    return this.buildAuthResponse(user, tokenPair);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.tokensService.revokeRefreshToken(refreshToken);
    } else {
      await this.tokensService.revokeAllUserTokens(userId);
    }

    await this.db.user.update({
      where: { id: userId },
      data: { isOnline: false },
    });

    await this.presenceService.setOffline(userId);
    await this.pubSubService.publishPresenceChange(userId, 'offline');

    this.logger.log(`User logged out: ${userId}`);
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const pair = await this.tokensService.refreshAccessToken(refreshToken);
    return pair;
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.db.user.findFirst({
      where: { verificationToken: token, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.db.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        verificationToken: null,
      },
    });

    this.logger.log(`Email verified: ${user.email}`);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.db.user.findUnique({
      where: { email },
    });

    if (!user || user.emailVerifiedAt) {
      return;
    }

    const newToken = uuidv4();

    await this.db.user.update({
      where: { id: user.id },
      data: { verificationToken: newToken },
    });

    await this.emailService.sendVerificationEmail(user.email, newToken);

    this.logger.log(`Verification email resent: ${user.email}`);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.db.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user) {
      return;
    }

    const resetToken = uuidv4();
    const resetTokenHash = this.tokensService.hashToken(resetToken);

    await this.db.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    this.logger.log(`Password reset requested: ${user.email}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.tokensService.hashToken(token);

    const user = await this.db.user.findFirst({
      where: {
        resetPasswordToken: tokenHash,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (!user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
      throw new UnauthorizedException('Reset token has expired');
    }

    const hashedPassword = await argon2.hash(newPassword);

    await this.db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpiresAt: null,
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    this.logger.log(`Password reset completed: ${user.email}`);
  }

  async getProfile(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.buildUserResponse(user);
  }

  private buildAuthResponse(user: any, tokenPair: any): AuthResponseDto {
    return {
      user: this.buildUserResponse(user),
      tokens: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
      },
    };
  }

  private buildUserResponse(user: any) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.profile?.displayName || user.username,
      avatarUrl: user.profile?.avatarUrl || null,
      role: user.role?.name || 'user',
      isActive: user.isActive,
      emailVerified: !!user.emailVerifiedAt,
      createdAt: user.createdAt,
    };
  }
}
