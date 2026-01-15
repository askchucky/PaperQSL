-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "qrzApiKey" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QSO" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "band" TEXT,
    "mode" TEXT,
    "freq" TEXT,
    "rstSent" TEXT,
    "rstRcvd" TEXT,
    "qth" TEXT,
    "comment" TEXT,
    "adifData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QSO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "qsoCount" INTEGER NOT NULL DEFAULT 0,
    "eligibility" TEXT NOT NULL DEFAULT 'Unknown',
    "eligibilityOverride" BOOLEAN NOT NULL DEFAULT false,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "addressSource" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "sentMethod" TEXT,
    "receivedAt" TIMESTAMP(3),
    "notes" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Export" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "filters" JSONB,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Export_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "QSO_userId_callsign_idx" ON "QSO"("userId", "callsign");

-- CreateIndex
CREATE INDEX "QSO_userId_date_idx" ON "QSO"("userId", "date");

-- CreateIndex
CREATE INDEX "Station_userId_eligibility_idx" ON "Station"("userId", "eligibility");

-- CreateIndex
CREATE INDEX "Station_userId_status_idx" ON "Station"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Station_userId_callsign_key" ON "Station"("userId", "callsign");

-- CreateIndex
CREATE INDEX "Export_userId_createdAt_idx" ON "Export"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "QSO" ADD CONSTRAINT "QSO_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Station" ADD CONSTRAINT "Station_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
