-- AlterTable
ALTER TABLE "Station" ADD COLUMN     "qrzFirstName" TEXT,
ADD COLUMN     "qrzLastName" TEXT,
ADD COLUMN     "qrzNameRaw" TEXT,
ADD COLUMN     "lastExportedAt" TIMESTAMP(3),
ADD COLUMN     "lastExportedLabel" TEXT,
ADD COLUMN     "exportCount" INTEGER NOT NULL DEFAULT 0;
