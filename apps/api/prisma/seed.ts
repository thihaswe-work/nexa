import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Ensure default roles exist
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Standard application user',
      isDefault: true,
    },
  });

  const modRole = await prisma.role.upsert({
    where: { name: 'moderator' },
    update: {},
    create: {
      name: 'moderator',
      description: 'Content moderator',
      isDefault: false,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'System administrator',
      isDefault: false,
    },
  });

  console.log(`  ✓ Roles: ${[userRole, modRole, adminRole].map(r => r.name).join(', ')}`);

  // Seed permissions
  const permissions = [
    { action: 'user:read', resource: 'user', description: 'View user profiles' },
    { action: 'user:write', resource: 'user', description: 'Update own profile' },
    { action: 'user:delete', resource: 'user', description: 'Delete account' },
    { action: 'user:manage', resource: 'user', description: 'Manage all users' },
    { action: 'place:read', resource: 'place', description: 'View places' },
    { action: 'place:create', resource: 'place', description: 'Create places' },
    { action: 'place:update', resource: 'place', description: 'Update places' },
    { action: 'place:delete', resource: 'place', description: 'Delete places' },
    { action: 'place:approve', resource: 'place', description: 'Approve/reject places' },
    { action: 'report:read', resource: 'report', description: 'View reports' },
    { action: 'report:resolve', resource: 'report', description: 'Resolve reports' },
    { action: 'system:config', resource: 'system', description: 'System configuration' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { action: perm.action },
      update: {},
      create: perm,
    });
  }

  console.log(`  ✓ ${permissions.length} permissions seeded`);

  // Assign permissions to admin role
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Assign basic permissions to user role
  const userPermissions = allPermissions.filter(p =>
    ['user:read', 'user:write', 'user:delete', 'place:read', 'place:create', 'place:update', 'place:delete'].includes(p.action),
  );
  for (const perm of userPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: userRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: userRole.id, permissionId: perm.id },
    });
  }

  // Create admin user
  const adminPassword = await argon2.hash('admin123');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nexa.app' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@nexa.app',
      password: adminPassword,
      isActive: true,
      roleId: adminRole.id,
      profile: {
        create: {
          displayName: 'Admin User',
          bio: 'System administrator',
        },
      },
    },
  });

  console.log(`  ✓ Admin user: ${adminUser.email} / admin123`);

  // Create demo users
  const demoPassword = await argon2.hash('password123');

  const demoUsers = [
    { username: 'alice', email: 'alice@nexa.app', displayName: 'Alice Johnson', lat: 40.7128, lng: -74.006 },
    { username: 'bob', email: 'bob@nexa.app', displayName: 'Bob Smith', lat: 40.7282, lng: -73.7949 },
    { username: 'charlie', email: 'charlie@nexa.app', displayName: 'Charlie Brown', lat: 40.7589, lng: -73.9851 },
  ];

  for (const u of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          username: u.username,
          email: u.email,
          password: demoPassword,
          isActive: true,
          roleId: userRole.id,
          profile: {
            create: {
              displayName: u.displayName,
              lat: u.lat,
              lng: u.lng,
              city: 'New York',
              country: 'US',
            },
          },
        },
      });
    }
  }

  console.log(`  ✓ ${demoUsers.length} demo users created (password: password123)`);

  // Seed interests
  const interestData = [
    { name: 'Photography', category: 'Arts & Culture' },
    { name: 'Painting', category: 'Arts & Culture' },
    { name: 'Museums', category: 'Arts & Culture' },
    { name: 'Live Music', category: 'Entertainment' },
    { name: 'Movies', category: 'Entertainment' },
    { name: 'Gaming', category: 'Entertainment' },
    { name: 'Hiking', category: 'Outdoors' },
    { name: 'Camping', category: 'Outdoors' },
    { name: 'Running', category: 'Sports' },
    { name: 'Cycling', category: 'Sports' },
    { name: 'Yoga', category: 'Health & Wellness' },
    { name: 'Meditation', category: 'Health & Wellness' },
    { name: 'Coffee', category: 'Food & Drink' },
    { name: 'Cooking', category: 'Food & Drink' },
    { name: 'Vegan', category: 'Food & Drink' },
    { name: 'Travel', category: 'Lifestyle' },
    { name: 'Reading', category: 'Lifestyle' },
    { name: 'Fashion', category: 'Lifestyle' },
    { name: 'Dogs', category: 'Pets' },
    { name: 'Cats', category: 'Pets' },
    { name: 'Volunteering', category: 'Community' },
    { name: 'Tech', category: 'Technology' },
    { name: 'Startups', category: 'Business' },
    { name: 'Language Exchange', category: 'Education' },
  ];

  for (const interest of interestData) {
    await prisma.interest.upsert({
      where: { name: interest.name },
      update: {},
      create: interest,
    });
  }

  console.log(`  ✓ ${interestData.length} interests seeded`);

  // Create privacy settings for demo users
  const demoUserRecords = await prisma.user.findMany({
    where: { email: { in: demoUsers.map((u) => u.email) } },
  });

  for (const user of demoUserRecords) {
    await prisma.privacySettings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }

  console.log(`  ✓ Privacy settings created for demo users`);
  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
