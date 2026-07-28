import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { StorageService, FileCategory } from '../../infrastructure/storage/storage.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UpdateInterestsDto } from './dto/update-interests.dto';
import { UserProfileResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
  ) {}

  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            interests: {
              include: { interest: true },
            },
          },
        },
        privacySettings: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.buildProfileResponse(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: Record<string, any> = {};
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
    if (dto.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender !== undefined) updateData.gender = dto.gender;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.country !== undefined) updateData.country = dto.country;

    if (Object.keys(updateData).length > 0) {
      await this.db.profile.update({
        where: { userId },
        data: updateData,
      });
    }

    return this.getProfile(userId);
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    const profile = await this.db.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.avatarUrl) {
      const key = await this.storage.extractKeyFromUrl(profile.avatarUrl);
      if (key) await this.storage.delete(key);
    }

    const result = await this.storage.upload(file, FileCategory.AVATAR, userId, { maxWidth: 512, maxHeight: 512 });
    const avatarUrl = result.url;

    await this.db.profile.update({
      where: { userId },
      data: { avatarUrl },
    });

    this.logger.log(`Avatar updated for user ${userId}`);

    return { avatarUrl };
  }

  async deleteAvatar(userId: string): Promise<void> {
    const profile = await this.db.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.avatarUrl) {
      const key = await this.storage.extractKeyFromUrl(profile.avatarUrl);
      if (key) await this.storage.delete(key);
    }

    await this.db.profile.update({
      where: { userId },
      data: { avatarUrl: null },
    });

    this.logger.log(`Avatar removed for user ${userId}`);
  }

  async updateInterests(
    userId: string,
    dto: UpdateInterestsDto,
  ): Promise<{ interests: { id: string; name: string; category?: string }[] }> {
    const profile = await this.db.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const existingInterests = await this.db.interest.findMany({
      where: { id: { in: dto.interestIds }, deletedAt: null },
    });

    const foundIds = new Set(existingInterests.map((i) => i.id));
    const invalidIds = dto.interestIds.filter((id) => !foundIds.has(id));

    if (invalidIds.length > 0) {
      throw new NotFoundException(
        `Interests not found: ${invalidIds.join(', ')}`,
      );
    }

    await this.db.$transaction(async (tx) => {
      await tx.profileInterest.deleteMany({
        where: { profileId: profile.id },
      });

      if (dto.interestIds.length > 0) {
        await tx.profileInterest.createMany({
          data: dto.interestIds.map((interestId) => ({
            profileId: profile.id,
            interestId,
          })),
        });
      }
    });

    const interests = existingInterests.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category ?? undefined,
    }));

    return { interests };
  }

  async getPrivacySettings(userId: string) {
    let settings = await this.db.privacySettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.db.privacySettings.create({
        data: { userId },
      });
    }

    return {
      showLastSeen: settings.showLastSeen,
      showOnline: settings.showOnline,
      showLocation: settings.showLocation,
      allowFriendRequests: settings.allowFriendRequests,
      allowMessagesFrom: settings.allowMessagesFrom,
    };
  }

  async updatePrivacySettings(
    userId: string,
    dto: UpdatePrivacyDto,
  ) {
    const data: Record<string, any> = {};
    if (dto.showLastSeen !== undefined) data.showLastSeen = dto.showLastSeen;
    if (dto.showOnline !== undefined) data.showOnline = dto.showOnline;
    if (dto.showLocation !== undefined) data.showLocation = dto.showLocation;
    if (dto.allowFriendRequests !== undefined) data.allowFriendRequests = dto.allowFriendRequests;
    if (dto.allowMessagesFrom !== undefined) data.allowMessagesFrom = dto.allowMessagesFrom;

    await this.db.privacySettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    return this.getPrivacySettings(userId);
  }

  async setNearbyVisibility(
    userId: string,
    visible: boolean,
  ): Promise<{ isNearbyVisible: boolean }> {
    const profile = await this.db.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    await this.db.profile.update({
      where: { userId },
      data: { isNearbyVisible: visible },
    });

    return { isNearbyVisible: visible };
  }

  async getPublicProfile(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        username: true,
        isOnline: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            bio: true,
            city: true,
            country: true,
            isNearbyVisible: true,
            interests: {
              include: { interest: { select: { id: true, name: true, category: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private buildProfileResponse(user: any): UserProfileResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role?.name || 'user',
      isActive: user.isActive,
      isOnline: user.isOnline,
      lastLoginAt: user.lastLoginAt ?? undefined,
      emailVerified: !!user.emailVerifiedAt,
      profile: {
        id: user.profile?.id || '',
        displayName: user.profile?.displayName || user.username,
        bio: user.profile?.bio ?? undefined,
        avatarUrl: user.profile?.avatarUrl ?? undefined,
        coverUrl: user.profile?.coverUrl ?? undefined,
        phoneNumber: user.profile?.phoneNumber ?? undefined,
        dateOfBirth: user.profile?.dateOfBirth?.toISOString() ?? undefined,
        gender: user.profile?.gender ?? undefined,
        city: user.profile?.city ?? undefined,
        country: user.profile?.country ?? undefined,
        isNearbyVisible: user.profile?.isNearbyVisible ?? true,
        interests: (user.profile?.interests || []).map((pi: any) => ({
          id: pi.interest.id,
          name: pi.interest.name,
          category: pi.interest.category ?? undefined,
        })),
        createdAt: user.profile?.createdAt || user.createdAt,
      },
      privacy: {
        showLastSeen: user.privacySettings?.showLastSeen ?? true,
        showOnline: user.privacySettings?.showOnline ?? true,
        showLocation: user.privacySettings?.showLocation ?? true,
        allowFriendRequests: user.privacySettings?.allowFriendRequests ?? true,
        allowMessagesFrom: user.privacySettings?.allowMessagesFrom || 'everyone',
      },
      createdAt: user.createdAt,
    };
  }
}
