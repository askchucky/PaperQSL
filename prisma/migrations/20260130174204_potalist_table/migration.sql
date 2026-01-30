-- CreateTable
CREATE TABLE "potalist" (
    "reference" CHAR(10) NOT NULL,
    "park_name" TEXT,
    "latitude" DECIMAL(8,6),
    "longitude" DECIMAL(9,6),
    "grid" CHAR(6),
    "locationdesc" TEXT,

    CONSTRAINT "potalist_pkey" PRIMARY KEY ("reference")
);
