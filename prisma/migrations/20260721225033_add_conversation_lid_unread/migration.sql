-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "lid" TEXT,
ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "conversations_lid_key" ON "conversations"("lid");

