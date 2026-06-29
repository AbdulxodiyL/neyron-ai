const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL (Neon) connected via Prisma');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };
