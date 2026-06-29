require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (adminExists) {
    console.log('✅ Seed already done. Credentials:');
    console.log('   Admin:   admin / admin123');
    console.log('   Teacher: teacher / teacher123');
    console.log('   Student: student / student123');
    return;
  }

  const [adminHash, teacherHash, studentHash] = await Promise.all([
    bcrypt.hash('admin123', 12),
    bcrypt.hash('teacher123', 12),
    bcrypt.hash('student123', 12),
  ]);

  const admin = await prisma.user.create({
    data: { name: 'Super Admin', username: 'admin', email: 'admin@neyronai.uz', passwordHash: adminHash, role: 'admin' },
  });

  const teacher = await prisma.user.create({
    data: { name: 'Demo Teacher', username: 'teacher', email: 'teacher@neyronai.uz', passwordHash: teacherHash, role: 'teacher' },
  });

  const group = await prisma.group.create({
    data: { name: '9-A Biology', description: 'Demo biology group', subject: 'biology', teacherId: teacher.id },
  });

  const student = await prisma.user.create({
    data: { name: 'Demo Student', username: 'student', email: 'student@neyronai.uz', passwordHash: studentHash, role: 'student', teacherId: teacher.id, groupId: group.id, xp: 350, coins: 45, level: 2, streakCurrent: 5, streakLongest: 12 },
  });

  const lesson = await prisma.lesson.create({
    data: {
      title: 'Cell Structure and Function',
      content: 'The cell is the basic unit of life. Every living organism is made of cells...',
      subject: 'biology', groupId: group.id, teacherId: teacher.id,
      aiContent: { status: 'pending' },
    },
  });

  console.log('\n✅ Seed completed!');
  console.log('   Admin:   admin / admin123');
  console.log('   Teacher: teacher / teacher123');
  console.log('   Student: student / student123');
  console.log(`   Group:   ${group.name} (id: ${group.id})`);
  console.log(`   Lesson:  ${lesson.title}\n`);
}

seed().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
