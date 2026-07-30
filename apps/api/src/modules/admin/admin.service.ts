import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalLocations,
      totalReports,
      pendingReports,
      newUsersToday,
    ] = await Promise.all([
      this.db.user.count({ where: { deletedAt: null } }),
      this.db.user.count({ where: { isActive: true, isOnline: true, deletedAt: null } }),
      this.db.user.count({ where: { isActive: false, deletedAt: null } }),
      this.db.locationHistory.count({ where: { deletedAt: null } }),
      this.db.report.count({ where: { deletedAt: null } }),
      this.db.report.count({ where: { status: 'PENDING', deletedAt: null } }),
      this.db.user.count({ where: { createdAt: { gte: todayStart }, deletedAt: null } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      bannedUsers,
      totalLocations,
      totalReports,
      pendingReports,
      newUsersToday,
      totalPlaces: 0,
    };
  }

  async getRecentActivity(limit = 10) {
    const users = await this.db.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, username: true, email: true, createdAt: true },
    });

    return users.map((u) => ({
      id: `user-${u.id}`,
      type: 'user_registered',
      description: `New user registered: ${u.username} (${u.email})`,
      userId: u.id,
      userName: u.username,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async getUsers(page = 1, limit = 20, search?: string, role?: string, status?: string) {
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = { name: role };
    if (status === 'active') where.isActive = true;
    else if (status === 'banned') where.isActive = false;

    const [users, total] = await Promise.all([
      this.db.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, username: true, email: true,
          isActive: true, isOnline: true, lastLoginAt: true, createdAt: true,
          role: { select: { name: true } },
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      }),
      this.db.user.count({ where }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        displayName: u.profile?.displayName || u.username,
        avatarUrl: u.profile?.avatarUrl || null,
        role: u.role?.name || 'user',
        isActive: u.isActive,
        isOnline: u.isOnline,
        emailVerified: false,
        lastLoginAt: u.lastLoginAt?.toISOString() || null,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserDetail(id: string) {
    const user = await this.db.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true, username: true, email: true,
        isActive: true, isOnline: true, lastLoginAt: true, createdAt: true,
        role: { select: { name: true } },
        profile: {
          select: { displayName: true, avatarUrl: true, bio: true, phoneNumber: true, dateOfBirth: true, gender: true, city: true, country: true, createdAt: true },
        },
        _count: { select: { messages: true, friendRequestsSent: true, reportsMade: true } },
      },
    });
    if (!user) return null;

    return {
      id: user.id, username: user.username, email: user.email,
      displayName: user.profile?.displayName || user.username,
      avatarUrl: user.profile?.avatarUrl || null,
      role: user.role?.name || 'user',
      isActive: user.isActive, isOnline: user.isOnline,
      emailVerified: false,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      bio: user.profile?.bio || null,
      phoneNumber: user.profile?.phoneNumber || null,
      dateOfBirth: user.profile?.dateOfBirth?.toISOString() || null,
      gender: user.profile?.gender || null, city: user.profile?.city || null, country: user.profile?.country || null,
      memberSince: user.createdAt.toISOString(),
      _count: { messages: user._count.messages, friends: user._count.friendRequestsSent, reports: user._count.reportsMade },
    };
  }

  async banUser(id: string, reason?: string) {
    await this.db.user.update({ where: { id }, data: { isActive: false } });
  }

  async unbanUser(id: string) {
    await this.db.user.update({ where: { id }, data: { isActive: true } });
  }

  async deleteUser(id: string) {
    await this.db.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getReports(page = 1, limit = 20, status?: string) {
    const where: any = { deletedAt: null };
    if (status && status !== ' ') where.status = status;

    const [reports, total] = await Promise.all([
      this.db.report.findMany({
        where,
        skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, reason: true, description: true, status: true, targetType: true, targetId: true, createdAt: true,
          reporter: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
          reportedUser: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
          resolvedBy: { select: { id: true, username: true } },
          resolvedAt: true,
        },
      }),
      this.db.report.count({ where }),
    ]);

    return {
      data: reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        description: r.description,
        status: r.status.toLowerCase(),
        createdAt: r.createdAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString() || null,
        reporter: { id: r.reporter.id, username: r.reporter.username, displayName: r.reporter.profile?.displayName || r.reporter.username },
        targetUser: { id: r.reportedUser?.id || '', username: r.reportedUser?.username || '', displayName: r.reportedUser?.profile?.displayName || r.reportedUser?.username || '' },
        resolvedBy: r.resolvedBy ? { id: r.resolvedBy.id, username: r.resolvedBy.username } : undefined,
      })),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async resolveReport(id: string, action: string) {
    await this.db.report.update({
      where: { id },
      data: { status: action === 'resolve' ? 'RESOLVED' : 'DISMISSED', resolvedAt: new Date() },
    });
  }

  async getBlocks(page = 1, limit = 20) {
    const where = { deletedAt: null };
    const [blocks, total] = await Promise.all([
      this.db.block.findMany({
        where,
        skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, reason: true, createdAt: true,
          blocker: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
          blocked: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
        },
      }),
      this.db.block.count({ where }),
    ]);

    return {
      data: blocks.map((b) => ({
        id: b.id,
        reason: b.reason,
        createdAt: b.createdAt.toISOString(),
        blocker: { id: b.blocker.id, username: b.blocker.username, displayName: b.blocker.profile?.displayName || b.blocker.username },
        blocked: { id: b.blocked.id, username: b.blocked.username, displayName: b.blocked.profile?.displayName || b.blocked.username },
      })),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async removeBlock(id: string) {
    await this.db.block.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // Content review
  async getContentItems(page = 1, limit = 20, type?: string, status?: string) {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    const where: any = { deletedAt: null };
    if (status && status !== ' ' && status === 'removed') where.deletedAt = { not: null };
    else if (status === 'flagged') where.createdAt = { gte: new Date(Date.now() - 7 * 86400000) };

    const [messages, total] = await Promise.all([
      this.db.message.findMany({
        where,
        skip, take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, content: true, type: true, createdAt: true,
          sender: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
        },
      }),
      this.db.message.count({ where }),
    ]);

    return {
      data: messages.map((m) => ({
        id: m.id,
        type: 'message',
        content: m.content || '',
        author: { id: m.sender.id, username: m.sender.username, displayName: m.sender.profile?.displayName || m.sender.username },
        flags: 0,
        status: 'flagged' as const,
        createdAt: m.createdAt.toISOString(),
      })),
      total, page, limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async removeContent(id: string) {
    await this.db.message.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // Analytics
  async getActiveUsersAnalytics(from?: string, to?: string) {
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getTime() - 30 * 86400000);
    const toDate = to ? new Date(to) : now;

    const locations = await this.db.locationHistory.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate }, deletedAt: null },
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, Set<string>>();
    locations.forEach((l) => {
      const day = l.createdAt.toISOString().slice(0, 10);
      if (!dailyMap.has(day)) dailyMap.set(day, new Set());
      dailyMap.get(day)!.add(l.userId);
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, users]) => ({ date, value: users.size }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const uniqueToday = new Set(
      locations.filter((l) => l.createdAt.toISOString().slice(0, 10) === now.toISOString().slice(0, 10)).map((l) => l.userId),
    );

    return {
      daily,
      weekly: daily.slice(-7),
      monthly: daily.slice(-30),
      currentActive: uniqueToday.size,
      peakToday: Math.max(...daily.filter((d) => d.date === now.toISOString().slice(0, 10)).map((d) => d.value), 0),
    };
  }

  async getRegistrationAnalytics(from?: string, to?: string) {
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getTime() - 30 * 86400000);
    const toDate = to ? new Date(to) : now;

    const users = await this.db.user.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate }, deletedAt: null },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, number>();
    users.forEach((u) => {
      const day = u.createdAt.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const weekStart = new Date(now.getTime() - 7 * 86400000);
    const monthStart = new Date(now.getTime() - 30 * 86400000);

    return {
      daily,
      total: users.length,
      thisWeek: users.filter((u) => u.createdAt >= weekStart).length,
      thisMonth: users.filter((u) => u.createdAt >= monthStart).length,
    };
  }

  async getLocationActivity() {
    const locations = await this.db.locationHistory.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, lat: true, lng: true, createdAt: true,
        user: { select: { id: true, username: true } },
      },
    });

    return locations.map((l) => ({
      id: l.id,
      userId: l.user.id,
      username: l.user.username,
      lat: l.lat,
      lng: l.lng,
      updatedAt: l.createdAt.toISOString(),
    }));
  }

  // Announcements
  async getAnnouncements(page = 1, limit = 20) {
    return { data: [], total: 0, page, limit, totalPages: 0 };
  }

  async createAnnouncement(input: any) {
    return { id: 'mock', ...input, status: 'draft', createdAt: new Date().toISOString() };
  }

  async publishAnnouncement(id: string) {
  }

  async deleteAnnouncement(id: string) {
  }

  // Audit logs
  async getAuditLogs(page = 1, limit = 20) {
    const [logs, total] = await Promise.all([
      this.db.report.findMany({
        where: { deletedAt: null },
        skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, reason: true, status: true, createdAt: true,
          reporter: { select: { id: true, username: true } },
        },
      }),
      this.db.report.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: logs.map((l) => ({
        id: `audit-${l.id}`,
        action: `report_${l.status.toLowerCase()}`,
        entity: 'report',
        entityId: l.id,
        description: l.reason,
        performedBy: l.reporter ? { id: l.reporter.id, username: l.reporter.username } : null,
        metadata: null,
        createdAt: l.createdAt.toISOString(),
      })),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSettings() {
    return {
      appName: 'Nexa',
      appUrl: process.env.APP_URL || 'http://localhost:4000',
      supportEmail: 'support@nexa.app',
      maxUploadSize: 10 * 1024 * 1024,
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
      userDefaultRole: 'user',
      sessionTimeout: 900,
      refreshTokenExpiry: 7 * 24 * 60 * 60,
      maxNearbyRadius: 50000,
      defaultNearbyRadius: 1000,
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: false,
    };
  }

  async updateSettings(settings: Record<string, any>) {
    return { ...(await this.getSettings()), ...settings };
  }
}
