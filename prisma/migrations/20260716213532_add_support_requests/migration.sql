-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('WHATSAPP', 'LLAMADA', 'MENSAJE_TEXTO');

-- CreateTable
CREATE TABLE "support_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "contactMethod" "ContactMethod" NOT NULL DEFAULT 'WHATSAPP',
    "situation" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "contacted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);
