import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateToken(length = 11): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let token = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    token += chars[randomBytes[i] % chars.length];
  }
  return token;
}

async function main() {
  console.log('Seeding database...');

  // 1. Seed Settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      school_name: 'SMP Negeri 1',
      school_logo: null,
      timezone: 'Asia/Makassar',
      default_start_time: '07:00',
      default_late_time: '07:30',
      default_end_time: '08:30',
    },
  });

  // 2. Seed Users
  const adminPassword = await bcrypt.hash('ChangeMe123!', 10);
  const teacherPassword = await bcrypt.hash('ChangeMe123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password_hash: adminPassword },
    create: {
      name: 'System Admin',
      email: 'admin@example.com',
      password_hash: adminPassword,
      role: 'admin',
      status: 'active',
    },
  });

  await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: { password_hash: teacherPassword },
    create: {
      name: 'Demo Teacher',
      email: 'teacher@example.com',
      password_hash: teacherPassword,
      role: 'teacher',
      status: 'active',
    },
  });

  // 3. Seed Classes
  const classData = [
    { name: 'X IPA 1', grade: '10', academic_year: '2025/2026' },
    { name: 'X IPA 2', grade: '10', academic_year: '2025/2026' },
    { name: 'XI IPA 1', grade: '11', academic_year: '2025/2026' },
    { name: 'XI IPA 2', grade: '11', academic_year: '2025/2026' },
  ];

  const createdClasses: Record<string, string> = {};

  for (const c of classData) {
    const cls = await prisma.class.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
    createdClasses[c.name] = cls.id;
  }

  // 4. Seed Students
  const studentsData = [
    { student_id: 'STD001', name: 'Ahmad', className: 'XI IPA 1' },
    { student_id: 'STD002', name: 'Budi', className: 'XI IPA 1' },
    { student_id: 'STD003', name: 'Citra', className: 'XI IPA 2' },
    { student_id: 'STD004', name: 'Deni', className: 'X IPA 1' },
    { student_id: 'STD005', name: 'Eka', className: 'X IPA 2' },
  ];

  for (const s of studentsData) {
    const classId = createdClasses[s.className];
    const existing = await prisma.student.findUnique({
      where: { student_id: s.student_id },
    });

    if (!existing) {
      await prisma.student.create({
        data: {
          student_id: s.student_id,
          name: s.name,
          class_id: classId,
          qr_token: generateToken(),
          status: 'active',
        },
      });
    }
  }

  // 5. Seed Active Session for Today
  const todayStr = new Date().toISOString().split('T')[0];

  const existingSession = await prisma.attendanceSession.findFirst({
    where: { date: todayStr, status: 'open' },
  });

  if (!existingSession) {
    await prisma.attendanceSession.create({
      data: {
        name: 'Absensi Pagi',
        date: todayStr,
        start_time: '07:00',
        late_after: '07:30',
        end_time: '08:30',
        status: 'open',
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
