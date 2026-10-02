-- AlterEnum
ALTER TYPE "Instrument" ADD VALUE 'GUITARRA_ELECTRICA';
ALTER TYPE "Instrument" ADD VALUE 'GUITARRA_ACUSTICA';
ALTER TYPE "Instrument" ADD VALUE 'VOZ_HOMBRE';
ALTER TYPE "Instrument" ADD VALUE 'VOZ_MUJER';
ALTER TYPE "Instrument" ADD VALUE 'SONIDO';
ALTER TYPE "Instrument" ADD VALUE 'LETRAS';
ALTER TYPE "Instrument" ADD VALUE 'APOYO_MULTIMEDIA';
ALTER TYPE "Instrument" ADD VALUE 'ORACION';

-- CreateEnum
CREATE TYPE "RosterRole" AS ENUM ('BATERIA', 'BAJO', 'GUITARRA_ELECTRICA', 'GUITARRA_ACUSTICA_1', 'GUITARRA_ACUSTICA_2', 'PIANO', 'VOCES_HOMBRES', 'VOCES_MUJERES', 'SONIDO', 'LETRAS', 'APOYO_MULTIMEDIA', 'ORACION');

-- DropIndex
DROP INDEX "user_services_userId_serviceId_key";

-- CreateTable
CREATE TABLE "roster_assignments" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "role" "RosterRole" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roster_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roster_assignments_date_idx" ON "roster_assignments"("date");

-- CreateIndex
CREATE UNIQUE INDEX "roster_assignments_date_serviceType_role_userId_key" ON "roster_assignments"("date", "serviceType", "role", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_services_userId_serviceId_instrument_key" ON "user_services"("userId", "serviceId", "instrument");

-- AddForeignKey
ALTER TABLE "roster_assignments" ADD CONSTRAINT "roster_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
