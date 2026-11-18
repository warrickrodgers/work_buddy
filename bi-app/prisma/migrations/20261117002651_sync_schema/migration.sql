/*
  Warnings:

  - A unique constraint covering the columns `[invite_token]` on the table `Organisation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "IngestionDocument" ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN     "email_domain" TEXT,
ADD COLUMN     "invite_token" TEXT,
ADD COLUMN     "is_personal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboarding_complete" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'individual';

-- CreateTable
CREATE TABLE "Insight" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "summary" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Insight_user_id_idx" ON "Insight"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_invite_token_key" ON "Organisation"("invite_token");

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
