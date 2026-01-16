/*
  Warnings:

  - You are about to drop the column `qrzApiKey` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "qrzApiKey",
ADD COLUMN     "qrzPassword" TEXT,
ADD COLUMN     "qrzUsername" TEXT;
