import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

try {
  const roles = await prisma.role.findMany();
  console.log('Roles:', roles.map(r => r.name));
  
  const adminRole = roles.find(r => r.name === 'admin');
  if (!adminRole) {
    console.log('No admin role found, creating...');
  }
  
  const adminPassword = await argon2.hash('admin123');
  console.log('Password hash:', adminPassword.substring(0, 20) + '...');
  
  // Try create instead of upsert
  const existing = await prisma.user.findUnique({ where: { email: 'admin@nexa.app' } });
  if (!existing) {
    const user = await prisma.user.create({
      data: {
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
    console.log('Admin user created:', user.id);
  } else {
    console.log('Admin user already exists:', existing.id);
  }
} catch (e) {
  console.error('Error:', e);
} finally {
  await prisma.$disconnect();
}
