-- AlterTable
ALTER TABLE "User" ADD COLUMN     "qrzSessionKey" TEXT,
ADD COLUMN     "qrzSessionKeyUpdatedAt" TIMESTAMP(3);
