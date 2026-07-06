-- CreateEnum
CREATE TYPE "AiDraftOrigin" AS ENUM ('ADMIN_PANEL', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "TelegramConversationState" AS ENUM ('IDLE', 'AWAITING_CATEGORY', 'GENERATING', 'AWAITING_APPROVAL', 'AWAITING_AUTHOR', 'AWAITING_SCHEDULE', 'DONE');

-- AlterEnum
ALTER TYPE "PostStatus" ADD VALUE 'SCHEDULED';

-- AlterTable
ALTER TABLE "AiDraft" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "origin" "AiDraftOrigin" NOT NULL DEFAULT 'ADMIN_PANEL';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "scheduledAt" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "TelegramConversation" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "state" "TelegramConversationState" NOT NULL DEFAULT 'IDLE',
    "pautaRaw" TEXT,
    "categoryId" TEXT,
    "aiDraftId" TEXT,
    "postId" TEXT,
    "lastBotMessageId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "TelegramConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramConversation_chatId_key" ON "TelegramConversation"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramConversation_aiDraftId_key" ON "TelegramConversation"("aiDraftId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramConversation_postId_key" ON "TelegramConversation"("postId");

-- CreateIndex
CREATE INDEX "TelegramConversation_state_idx" ON "TelegramConversation"("state");

-- CreateIndex
CREATE INDEX "Post_status_scheduledAt_idx" ON "Post"("status", "scheduledAt");

-- AddForeignKey
ALTER TABLE "TelegramConversation" ADD CONSTRAINT "TelegramConversation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramConversation" ADD CONSTRAINT "TelegramConversation_aiDraftId_fkey" FOREIGN KEY ("aiDraftId") REFERENCES "AiDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramConversation" ADD CONSTRAINT "TelegramConversation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

