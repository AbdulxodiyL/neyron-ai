const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

const runMigrations = () => {
  try {
    console.log('🔄 Running database schema sync...');
    execSync('npx prisma db push', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../../'),
      env: { ...process.env },
    });
    console.log('✅ Schema sync complete');
  } catch (err) {
    console.warn('⚠️  Schema sync warning (non-fatal):', err.message);
  }
};

const connectDB = async () => {
  try {
    runMigrations();
    await prisma.$connect();
    console.log('✅ PostgreSQL (Neon) connected via Prisma');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };
