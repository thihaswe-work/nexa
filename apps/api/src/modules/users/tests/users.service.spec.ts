import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { DatabaseService } from '../../../database/database.service';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdatePrivacyDto } from '../dto/update-privacy.dto';

describe('UsersService', () => {
  let service: UsersService;
  let db: jest.Mocked<DatabaseService>;
  let storage: jest.Mocked<StorageService>;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockProfileId = '660e8400-e29b-41d4-a716-446655440001';
  const mockInterestId = '770e8400-e29b-41d4-a716-446655440002';

  const mockUser: any = {
    id: mockUserId,
    username: 'johndoe',
    email: 'john@example.com',
    isActive: true,
    isOnline: true,
    lastLoginAt: new Date(),
    emailVerifiedAt: new Date(),
    createdAt: new Date('2024-01-01'),
    role: { id: 'role-uuid', name: 'user' },
    profile: {
      id: mockProfileId,
      userId: mockUserId,
      displayName: 'John Doe',
      bio: 'Hello world',
      avatarUrl: null,
      coverUrl: null,
      phoneNumber: null,
      dateOfBirth: null,
      gender: null,
      city: 'New York',
      country: 'US',
      isNearbyVisible: true,
      createdAt: new Date('2024-01-01'),
      interests: [
        {
          interest: {
            id: mockInterestId,
            name: 'Photography',
            category: 'Arts & Culture',
          },
        },
      ],
    },
    privacySettings: {
      showLastSeen: true,
      showOnline: true,
      showLocation: true,
      allowFriendRequests: true,
      allowMessagesFrom: 'everyone',
    },
  };

  const mockDb = {
    user: {
      findUnique: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    interest: {
      findMany: jest.fn(),
    },
    profileInterest: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    privacySettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockStorage = {
    upload: jest.fn(),
    delete: jest.fn(),
    extractKeyFromUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    db = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
    storage = module.get(StorageService) as jest.Mocked<StorageService>;

    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return full profile for authenticated user', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUserId);

      expect(result.id).toBe(mockUserId);
      expect(result.username).toBe('johndoe');
      expect(result.profile.displayName).toBe('John Doe');
      expect(result.profile.interests).toHaveLength(1);
      expect(result.profile.interests[0].name).toBe('Photography');
      expect(result.privacy.showLastSeen).toBe(true);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.profile.update.mockResolvedValue(mockUser.profile);

      const dto: UpdateProfileDto = {
        displayName: 'Jane Doe',
        bio: 'Updated bio',
        city: 'Los Angeles',
      };

      await service.updateProfile(mockUserId, dto);

      expect(mockDb.profile.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: {
          displayName: 'Jane Doe',
          bio: 'Updated bio',
          city: 'Los Angeles',
        },
      });
    });

    it('should only update provided fields', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.profile.update.mockResolvedValue(mockUser.profile);

      const dto: UpdateProfileDto = { bio: 'Just a bio update' };
      await service.updateProfile(mockUserId, dto);

      const updateCall = mockDb.profile.update.mock.calls[0][0];
      const keys = Object.keys(updateCall.data);
      expect(keys).toContain('bio');
      expect(keys).not.toContain('displayName');
    });

    it('should throw NotFoundException if user missing', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('bad-id', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadAvatar', () => {
    const mockFile = {
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
      size: 1024,
    } as Express.Multer.File;

    it('should upload avatar and update profile', async () => {
      mockDb.profile.findUnique.mockResolvedValue(mockUser.profile);
      mockStorage.upload.mockResolvedValue({
        url: 'http://localhost:4000/uploads/avatars/new-avatar.jpg',
      });
      mockDb.profile.update.mockResolvedValue(mockUser.profile);

      const result = await service.uploadAvatar(mockUserId, mockFile);

      expect(result.avatarUrl).toContain('new-avatar.jpg');
      expect(mockStorage.upload).toHaveBeenCalledWith(
        mockFile,
        expect.anything(),
        mockUserId,
        { maxWidth: 512, maxHeight: 512 },
      );
      expect(mockDb.profile.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { avatarUrl: expect.any(String) },
      });
    });

    it('should delete old avatar before uploading new one', async () => {
      const profileWithAvatar = {
        ...mockUser.profile,
        avatarUrl: 'http://localhost:4000/uploads/avatars/old-avatar.jpg',
      };
      mockDb.profile.findUnique.mockResolvedValue(profileWithAvatar);
      mockStorage.extractKeyFromUrl.mockResolvedValue('avatars/old-avatar.jpg');
      mockStorage.delete.mockResolvedValue(undefined);
      mockStorage.upload.mockResolvedValue({
        url: 'http://localhost:4000/uploads/avatars/new-avatar.jpg',
      });
      mockDb.profile.update.mockResolvedValue(profileWithAvatar);

      await service.uploadAvatar(mockUserId, mockFile);

      expect(mockStorage.extractKeyFromUrl).toHaveBeenCalledWith(
        'http://localhost:4000/uploads/avatars/old-avatar.jpg',
      );
      expect(mockStorage.delete).toHaveBeenCalledWith('avatars/old-avatar.jpg');
    });

    it('should throw NotFoundException if profile missing', async () => {
      mockDb.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadAvatar('bad-id', mockFile),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAvatar', () => {
    it('should remove avatar from profile and delete file', async () => {
      const profileWithAvatar = {
        ...mockUser.profile,
        avatarUrl: 'http://localhost:4000/uploads/avatars/old-avatar.jpg',
      };
      mockDb.profile.findUnique.mockResolvedValue(profileWithAvatar);
      mockStorage.extractKeyFromUrl.mockResolvedValue('avatars/old-avatar.jpg');
      mockStorage.delete.mockResolvedValue(undefined);
      mockDb.profile.update.mockResolvedValue(profileWithAvatar);

      await service.deleteAvatar(mockUserId);

      expect(mockStorage.delete).toHaveBeenCalledWith('avatars/old-avatar.jpg');
      expect(mockDb.profile.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { avatarUrl: null },
      });
    });

    it('should not call delete if no avatar exists', async () => {
      mockDb.profile.findUnique.mockResolvedValue(mockUser.profile);
      mockDb.profile.update.mockResolvedValue(mockUser.profile);

      await service.deleteAvatar(mockUserId);

      expect(mockStorage.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateInterests', () => {
    it('should replace interests for the user', async () => {
      mockDb.profile.findUnique.mockResolvedValue(mockUser.profile);
      mockDb.interest.findMany.mockResolvedValue([{ id: mockInterestId, name: 'Photography', category: 'Arts & Culture' }]);
      mockDb.$transaction.mockImplementation(async (cb: any) => cb(mockDb));

      const result = await service.updateInterests(mockUserId, {
        interestIds: [mockInterestId],
      });

      expect(result.interests).toHaveLength(1);
      expect(result.interests[0].name).toBe('Photography');
    });

    it('should throw NotFoundException for invalid interest IDs', async () => {
      mockDb.profile.findUnique.mockResolvedValue(mockUser.profile);
      mockDb.interest.findMany.mockResolvedValue([]);

      await expect(
        service.updateInterests(mockUserId, { interestIds: ['bad-id'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should clear all interests when empty array provided', async () => {
      mockDb.profile.findUnique.mockResolvedValue(mockUser.profile);
      mockDb.interest.findMany.mockResolvedValue([]);
      mockDb.$transaction.mockImplementation(async (cb: any) => cb(mockDb));

      const result = await service.updateInterests(mockUserId, {
        interestIds: [],
      });

      expect(result.interests).toEqual([]);
    });
  });

  describe('privacy settings', () => {
    it('should return existing privacy settings', async () => {
      mockDb.privacySettings.findUnique.mockResolvedValue(mockUser.privacySettings);

      const result = await service.getPrivacySettings(mockUserId);

      expect(result.showLastSeen).toBe(true);
      expect(result.allowMessagesFrom).toBe('everyone');
    });

    it('should create default settings if none exist', async () => {
      mockDb.privacySettings.findUnique.mockResolvedValue(null);
      mockDb.privacySettings.create.mockResolvedValue(mockUser.privacySettings);

      const result = await service.getPrivacySettings(mockUserId);

      expect(mockDb.privacySettings.create).toHaveBeenCalledWith({
        data: { userId: mockUserId },
      });
      expect(result).toBeDefined();
    });

    it('should update privacy settings', async () => {
      mockDb.privacySettings.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockUser.privacySettings, showOnline: false });
      mockDb.privacySettings.create.mockResolvedValue(mockUser.privacySettings);
      mockDb.privacySettings.upsert.mockResolvedValue(mockUser.privacySettings);

      const dto: UpdatePrivacyDto = { showOnline: false };

      await service.updatePrivacySettings(mockUserId, dto);

      expect(mockDb.privacySettings.upsert).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        create: { userId: mockUserId, showOnline: false },
        update: { showOnline: false },
      });
    });
  });

  describe('setNearbyVisibility', () => {
    it('should enable nearby visibility', async () => {
      mockDb.profile.findUnique.mockResolvedValue(mockUser.profile);
      mockDb.profile.update.mockResolvedValue(mockUser.profile);

      const result = await service.setNearbyVisibility(mockUserId, true);

      expect(result.isNearbyVisible).toBe(true);
      expect(mockDb.profile.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { isNearbyVisible: true },
      });
    });

    it('should disable nearby visibility', async () => {
      mockDb.profile.findUnique.mockResolvedValue(mockUser.profile);
      mockDb.profile.update.mockResolvedValue(mockUser.profile);

      const result = await service.setNearbyVisibility(mockUserId, false);

      expect(result.isNearbyVisible).toBe(false);
    });

    it('should throw if profile missing', async () => {
      mockDb.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.setNearbyVisibility('bad-id', true),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPublicProfile', () => {
    it('should return limited public profile', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: mockUserId,
        username: 'johndoe',
        isOnline: true,
        profile: mockUser.profile,
      });

      const result = await service.getPublicProfile(mockUserId);

      expect(result.id).toBe(mockUserId);
      expect(result.username).toBe('johndoe');
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('role');
    });

    it('should throw for non-existent user', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getPublicProfile('bad-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
