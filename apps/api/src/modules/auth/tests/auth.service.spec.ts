import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from '../auth.service';
import { TokensService } from '../tokens.service';
import { AuthEmailService } from '../email.service';
import { DatabaseService } from '../../../database/database.service';
import { PresenceService } from '../../../infrastructure/redis/presence.service';
import { RedisPubSubService } from '../../../infrastructure/redis/redis-pubsub.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

jest.mock('argon2');

describe('AuthService', () => {
  let authService: AuthService;
  let db: jest.Mocked<DatabaseService>;
  let tokensService: jest.Mocked<TokensService>;
  let emailService: jest.Mocked<AuthEmailService>;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockRoleId = 'role-uuid';
  const mockProfileId = 'profile-uuid';

  const mockUser: any = {
    id: mockUserId,
    username: 'johndoe',
    email: 'john@example.com',
    password: 'hashed-password-argon2',
    isActive: true,
    isOnline: false,
    lastLoginAt: null,
    emailVerifiedAt: null,
    verificationToken: 'abc-123',
    resetPasswordToken: null,
    resetPasswordExpiresAt: null,
    roleId: mockRoleId,
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    role: {
      id: mockRoleId,
      name: 'user',
      description: 'Standard user',
      isDefault: true,
      deletedAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    profile: {
      id: mockProfileId,
      userId: mockUserId,
      displayName: 'John Doe',
      bio: null,
      avatarUrl: null,
      coverUrl: null,
      phoneNumber: null,
      dateOfBirth: null,
      gender: null,
      lat: null,
      lng: null,
      city: null,
      country: null,
      deletedAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  };

  const mockTokenPair = {
    accessToken: 'access-token-value',
    refreshToken: 'refresh-token-value',
    expiresIn: 900,
  };

  const mockDb = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockTokensService = {
    generateTokenPair: jest.fn().mockResolvedValue(mockTokenPair),
    refreshAccessToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllUserTokens: jest.fn(),
    hashToken: jest.fn().mockReturnValue('hashed-token-value'),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  const mockPresenceService = {
    setOnline: jest.fn().mockResolvedValue(undefined),
    setOffline: jest.fn().mockResolvedValue(undefined),
  };

  const mockPubSubService = {
    publishPresenceChange: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: TokensService, useValue: mockTokensService },
        { provide: AuthEmailService, useValue: mockEmailService },
        { provide: PresenceService, useValue: mockPresenceService },
        { provide: RedisPubSubService, useValue: mockPubSubService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    db = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
    tokensService = module.get(TokensService) as jest.Mocked<TokensService>;
    emailService = module.get(AuthEmailService) as jest.Mocked<AuthEmailService>;

    (argon2.hash as jest.Mock).mockResolvedValue('hashed-password-argon2');
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto: RegisterDto = {
      username: 'johndoe',
      email: 'john@example.com',
      displayName: 'John Doe',
      password: 'SecureP@ss123',
    };

    it('should register a new user and return tokens', async () => {
      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.role.findFirst.mockResolvedValue(mockUser.role);
      mockDb.user.create.mockResolvedValue(mockUser);

      const result = await authService.register(dto);

      expect(result.user.email).toBe(dto.email);
      expect(result.user.displayName).toBe(dto.displayName);
      expect(result.tokens.accessToken).toBe(mockTokenPair.accessToken);
      expect(result.tokens.refreshToken).toBe(mockTokenPair.refreshToken);
    });

    it('should send verification email on registration', async () => {
      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.role.findFirst.mockResolvedValue(mockUser.role);
      mockDb.user.create.mockResolvedValue(mockUser);

      await authService.register(dto);

      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        dto.email,
        expect.any(String),
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      mockDb.user.findFirst.mockResolvedValue(mockUser);

      await expect(authService.register(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when username already exists', async () => {
      mockDb.user.findFirst.mockResolvedValue({
        ...mockUser,
        email: 'other@example.com',
      });

      await expect(authService.register(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw error when no default role exists', async () => {
      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.role.findFirst.mockResolvedValue(null);

      await expect(authService.register(dto)).rejects.toThrow(
        'Default role not found',
      );
    });

    it('should hash password before storing', async () => {
      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.role.findFirst.mockResolvedValue(mockUser.role);
      mockDb.user.create.mockResolvedValue(mockUser);

      await authService.register(dto);

      expect(argon2.hash).toHaveBeenCalledWith(dto.password);
      expect(mockDb.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed-password-argon2',
          }),
        }),
      );
    });

    it('should assign the default role', async () => {
      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.role.findFirst.mockResolvedValue(mockUser.role);
      mockDb.user.create.mockResolvedValue(mockUser);

      await authService.register(dto);

      expect(mockDb.role.findFirst).toHaveBeenCalledWith({
        where: { isDefault: true },
      });
    });
  });

  describe('login', () => {
    const dto: LoginDto = {
      email: 'john@example.com',
      password: 'SecureP@ss123',
    };

    it('should login successfully with valid credentials', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.user.update.mockResolvedValue(mockUser);

      const result = await authService.login(dto);

      expect(result.user.email).toBe(dto.email);
      expect(result.tokens.accessToken).toBe(mockTokenPair.accessToken);
    });

    it('should verify password with argon2', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.user.update.mockResolvedValue(mockUser);

      await authService.login(dto);

      expect(argon2.verify).toHaveBeenCalledWith(
        mockUser.password,
        dto.password,
      );
    });

    it('should update lastLoginAt and isOnline on login', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.user.update.mockResolvedValue(mockUser);

      await authService.login(dto);

      expect(mockDb.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            lastLoginAt: expect.any(Date),
            isOnline: true,
          }),
        }),
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException for inactive account', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(authService.login(dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw UnauthorizedException for deleted account', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await expect(authService.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      mockDb.user.findFirst.mockResolvedValue(mockUser);
      mockDb.user.update.mockResolvedValue(mockUser);

      await authService.verifyEmail('valid-token');

      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          emailVerifiedAt: expect.any(Date),
          verificationToken: null,
        },
      });
    });

    it('should throw UnauthorizedException with invalid token', async () => {
      mockDb.user.findFirst.mockResolvedValue(null);

      await expect(authService.verifyEmail('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email for existing user', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.user.update.mockResolvedValue(mockUser);

      await authService.forgotPassword('john@example.com');

      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should store hashed reset token', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.user.update.mockResolvedValue(mockUser);

      await authService.forgotPassword('john@example.com');

      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          resetPasswordToken: 'hashed-token-value',
          resetPasswordExpiresAt: expect.any(Date),
        },
      });
    });

    it('should not reveal if email does not exist', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await authService.forgotPassword('unknown@example.com');

      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      mockDb.user.findFirst.mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'hashed-token',
        resetPasswordExpiresAt: new Date(Date.now() + 3600000),
      });
      mockDb.$transaction.mockImplementation(async (cb: any) => cb(mockDb));
      mockDb.user.update.mockResolvedValue(mockUser);

      await authService.resetPassword('raw-token', 'NewP@ss1234');

      expect(argon2.hash).toHaveBeenCalledWith('NewP@ss1234');
    });

    it('should revoke all sessions after password reset', async () => {
      mockDb.user.findFirst.mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'hashed-token',
        resetPasswordExpiresAt: new Date(Date.now() + 3600000),
      });
      mockDb.$transaction.mockImplementation(async (cb: any) => cb(mockDb));
      mockDb.user.update.mockResolvedValue(mockUser);

      await authService.resetPassword('raw-token', 'NewP@ss1234');

      expect(mockDb.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      mockDb.user.findFirst.mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'hashed-token',
        resetPasswordExpiresAt: new Date(Date.now() - 3600000),
      });

      await expect(
        authService.resetPassword('expired-token', 'NewP@ss1234'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject invalid token', async () => {
      mockDb.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.resetPassword('invalid-token', 'NewP@ss1234'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should send new verification email', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.user.update.mockResolvedValue(mockUser);

      await authService.resendVerificationEmail('john@example.com');

      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should not send if email already verified', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerifiedAt: new Date(),
      });

      await authService.resendVerificationEmail('john@example.com');

      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should not send if email does not exist', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await authService.resendVerificationEmail('unknown@example.com');

      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should revoke all tokens and mark offline', async () => {
      mockDb.user.update.mockResolvedValue(mockUser);

      await authService.logout('user-id');

      expect(mockTokensService.revokeAllUserTokens).toHaveBeenCalledWith(
        'user-id',
      );
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { isOnline: false },
      });
    });

    it('should revoke specific token if provided', async () => {
      mockDb.user.update.mockResolvedValue(mockUser);

      await authService.logout('user-id', 'specific-refresh-token');

      expect(mockTokensService.revokeRefreshToken).toHaveBeenCalledWith(
        'specific-refresh-token',
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getProfile(mockUserId);

      expect(result.id).toBe(mockUserId);
      expect(result.email).toBe('john@example.com');
      expect(result.displayName).toBe('John Doe');
    });

    it('should throw for non-existent user', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(authService.getProfile('bad-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
