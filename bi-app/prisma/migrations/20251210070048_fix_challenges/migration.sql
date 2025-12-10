/*
  Warnings:

  - A unique constraint covering the columns `[challenge_id]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ConversationType" AS ENUM ('GENERAL', 'CHALLENGE');

-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "challenge_id" INTEGER,
ADD COLUMN     "conversation_type" "public"."ConversationType" NOT NULL DEFAULT 'GENERAL';

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_challenge_id_key" ON "public"."Conversation"("challenge_id");

-- CreateIndex
CREATE INDEX "Conversation_user_id_idx" ON "public"."Conversation"("user_id");

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
