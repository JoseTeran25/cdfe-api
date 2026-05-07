-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DIRECTOR', 'MUSICO', 'VOCALISTA');

-- CreateEnum
CREATE TYPE "SongStatus" AS ENUM ('ACTIVA', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('DOMINGO', 'MIERCOLES');

-- CreateEnum
CREATE TYPE "Instrument" AS ENUM ('GUITARRA', 'BAJO', 'BATERIA', 'TECLADO', 'PIANO', 'VIOLIN', 'TROMPETA', 'VOZ_PRINCIPAL', 'VOZ_SECUNDARIA', 'OTRO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MUSICO',
    "avatarUrl" TEXT,
    "instrument" "Instrument",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "lyrics" TEXT,
    "bpm" INTEGER,
    "status" "SongStatus" NOT NULL DEFAULT 'PENDIENTE',
    "sequenceUrl" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "ServiceType" NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_songs" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "serviceId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,

    CONSTRAINT "service_songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_services" (
    "id" TEXT NOT NULL,
    "instrument" "Instrument" NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "user_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "service_songs_serviceId_songId_key" ON "service_songs"("serviceId", "songId");

-- CreateIndex
CREATE UNIQUE INDEX "user_services_userId_serviceId_key" ON "user_services"("userId", "serviceId");

-- AddForeignKey
ALTER TABLE "service_songs" ADD CONSTRAINT "service_songs_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_songs" ADD CONSTRAINT "service_songs_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_services" ADD CONSTRAINT "user_services_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_services" ADD CONSTRAINT "user_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
