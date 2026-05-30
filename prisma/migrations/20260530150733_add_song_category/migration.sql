-- CreateEnum
CREATE TYPE "SongCategory" AS ENUM ('ALABANZA', 'ADORACION');

-- AlterTable
ALTER TABLE "songs" ADD COLUMN     "category" "SongCategory";
