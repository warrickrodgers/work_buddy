-- CreateEnum
CREATE TYPE "public"."ChallengeCategory" AS ENUM ('COMMUNICATION', 'PRODUCTIVITY', 'LEADERSHIP', 'CULTURE', 'SKILLS', 'PROCESS');

-- CreateEnum
CREATE TYPE "public"."ChallengeType" AS ENUM ('HABIT', 'SKILL', 'BEHAVIOR', 'PERFORMANCE', 'ACCOUNTABILITY');

-- CreateEnum
CREATE TYPE "public"."AudienceType" AS ENUM ('INDIVIDUAL', 'TEAM', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "public"."ChallengeStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Challenge" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."ChallengeCategory" NOT NULL,
    "challenge_type" "public"."ChallengeType" NOT NULL,
    "audience_type" "public"."AudienceType" NOT NULL,
    "employee_id" TEXT,
    "team_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "success_criteria" TEXT NOT NULL,
    "metrics" TEXT,
    "ai_notes" TEXT,
    "status" "public"."ChallengeStatus" NOT NULL DEFAULT 'ACTIVE',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChallengeCheckIn" (
    "id" SERIAL NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "progress_update" INTEGER NOT NULL,
    "sentiment" TEXT,
    "ai_feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Challenge_user_id_idx" ON "public"."Challenge"("user_id");

-- CreateIndex
CREATE INDEX "Challenge_status_idx" ON "public"."Challenge"("status");

-- CreateIndex
CREATE INDEX "ChallengeCheckIn_challenge_id_idx" ON "public"."ChallengeCheckIn"("challenge_id");

-- AddForeignKey
ALTER TABLE "public"."Challenge" ADD CONSTRAINT "Challenge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeCheckIn" ADD CONSTRAINT "ChallengeCheckIn_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
