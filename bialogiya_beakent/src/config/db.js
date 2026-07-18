const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

const runMigrations = async () => {
  try {
    // Add isFrozen to User if missing
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isFrozen" BOOLEAN NOT NULL DEFAULT false
    `);

    // Add fileUrl to Resource if missing
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT
    `);

    // Add fileData/mimeType to Resource if missing (store file bytes in DB —
    // Render's free web service disk is ephemeral and wipes uploads on restart)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "fileData" BYTEA
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "mimeType" TEXT
    `);

    // Add phone to User if missing
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT
    `);

    // Create Payment table if missing
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Payment" (
        "id"        TEXT NOT NULL,
        "month"     TEXT NOT NULL,
        "isPaid"    BOOLEAN NOT NULL DEFAULT true,
        "note"      TEXT,
        "paidAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "studentId" TEXT NOT NULL,
        "teacherId" TEXT NOT NULL,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
      )
    `);

    // Add unique constraint on Payment (studentId, month) if missing
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Payment_studentId_month_key'
        ) THEN
          ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_month_key" UNIQUE ("studentId", "month");
        END IF;
      END $$
    `);

    // Add FK on Payment.studentId if missing
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Payment_studentId_fkey'
        ) THEN
          ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey"
            FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$
    `);

    // Create LessonMedia table if missing (cached TTS audio for story narration
    // and explainer-video slides)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LessonMedia" (
        "id"         TEXT NOT NULL,
        "lessonId"   TEXT NOT NULL,
        "kind"       TEXT NOT NULL,
        "slideIndex" INTEGER NOT NULL DEFAULT -1,
        "data"       BYTEA NOT NULL,
        "mimeType"   TEXT NOT NULL DEFAULT 'audio/mpeg',
        "voice"      TEXT,
        "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LessonMedia_pkey" PRIMARY KEY ("id")
      )
    `);
    // Fix up tables created before slideIndex became non-nullable: Prisma
    // can't filter a composite @@unique key by null (Postgres NULL != NULL),
    // so 'story'/'voice' rows use -1 as a sentinel instead of null.
    await prisma.$executeRawUnsafe(`
      UPDATE "LessonMedia" SET "slideIndex" = -1 WHERE "slideIndex" IS NULL
    `).catch(() => {});
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "LessonMedia" ALTER COLUMN "slideIndex" SET DEFAULT -1
    `).catch(() => {});
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "LessonMedia" ALTER COLUMN "slideIndex" SET NOT NULL
    `).catch(() => {});
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'LessonMedia_lessonId_fkey'
        ) THEN
          ALTER TABLE "LessonMedia" ADD CONSTRAINT "LessonMedia_lessonId_fkey"
            FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'LessonMedia_lessonId_kind_slideIndex_key'
        ) THEN
          ALTER TABLE "LessonMedia" ADD CONSTRAINT "LessonMedia_lessonId_kind_slideIndex_key"
            UNIQUE ("lessonId", "kind", "slideIndex");
        END IF;
      END $$
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clonedVoiceId" TEXT,
      ADD COLUMN IF NOT EXISTS "clonedVoiceName" TEXT
    `);

    // Add 'reception' to the Role enum (admin-only role: can create teacher
    // accounts and manage student payments, nothing else).
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'reception'
    `).catch(() => {});

    // Branch (filial) table - only reception accounts create these, max 3
    // per account (enforced in the controller).
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Branch" (
        "id"          TEXT NOT NULL,
        "name"        TEXT NOT NULL,
        "address"     TEXT,
        "isActive"    BOOLEAN NOT NULL DEFAULT true,
        "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "receptionId" TEXT NOT NULL,
        CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Branch_receptionId_fkey'
        ) THEN
          ALTER TABLE "Branch" ADD CONSTRAINT "Branch_receptionId_fkey"
            FOREIGN KEY ("receptionId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `);

    // Group gets a branch link + a monthly fee amount (for payment accounting)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "branchId" TEXT,
      ADD COLUMN IF NOT EXISTS "monthlyFee" INTEGER
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Group_branchId_fkey'
        ) THEN
          ALTER TABLE "Group" ADD CONSTRAINT "Group_branchId_fkey"
            FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$
    `);

    console.log('✅ Schema migrations applied');
  } catch (err) {
    console.warn('⚠️  Migration warning (non-fatal):', err.message);
  }
};

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL (Neon) connected via Prisma');
    await runMigrations();
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };
