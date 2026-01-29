-- AlterTable
ALTER TABLE "QSO" ADD COLUMN     "myPotaRef" TEXT,
ADD COLUMN     "sourceFile" TEXT;

-- AlterTable
ALTER TABLE "Station" ADD COLUMN     "qslCardBackUploadedAt" TIMESTAMP(3),
ADD COLUMN     "qslCardBackUrl" TEXT,
ADD COLUMN     "qslCardFrontUploadedAt" TIMESTAMP(3),
ADD COLUMN     "qslCardFrontUrl" TEXT;
