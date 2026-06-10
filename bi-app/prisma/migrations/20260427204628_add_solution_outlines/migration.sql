-- CreateEnum
CREATE TYPE "public"."OutlineStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."HabitCadence" AS ENUM ('DAILY', 'WEEKLY');

-- CreateTable
CREATE TABLE "public"."SolutionOutline" (
    "id" SERIAL NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "source_message_id" INTEGER,
    "status" "public"."OutlineStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "SolutionOutline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OutlinePhase" (
    "id" SERIAL NOT NULL,
    "outline_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "timeframe" TEXT,
    "purpose" TEXT NOT NULL,

    CONSTRAINT "OutlinePhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChecklistItem" (
    "id" SERIAL NOT NULL,
    "phase_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "why_it_matters" TEXT,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Habit" (
    "id" SERIAL NOT NULL,
    "phase_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "cadence" "public"."HabitCadence" NOT NULL,
    "why_it_matters" TEXT,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HabitLog" (
    "id" SERIAL NOT NULL,
    "habit_id" INTEGER NOT NULL,
    "logged_for" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CheckInPrompt" (
    "id" SERIAL NOT NULL,
    "phase_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3),
    "response" TEXT,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "CheckInPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolutionOutline_challenge_id_idx" ON "public"."SolutionOutline"("challenge_id");

-- CreateIndex
CREATE INDEX "SolutionOutline_user_id_idx" ON "public"."SolutionOutline"("user_id");

-- CreateIndex
CREATE INDEX "OutlinePhase_outline_id_idx" ON "public"."OutlinePhase"("outline_id");

-- CreateIndex
CREATE UNIQUE INDEX "OutlinePhase_outline_id_order_index_key" ON "public"."OutlinePhase"("outline_id", "order_index");

-- CreateIndex
CREATE INDEX "ChecklistItem_phase_id_idx" ON "public"."ChecklistItem"("phase_id");

-- CreateIndex
CREATE INDEX "Habit_phase_id_idx" ON "public"."Habit"("phase_id");

-- CreateIndex
CREATE INDEX "HabitLog_habit_id_idx" ON "public"."HabitLog"("habit_id");

-- CreateIndex
CREATE UNIQUE INDEX "HabitLog_habit_id_logged_for_key" ON "public"."HabitLog"("habit_id", "logged_for");

-- CreateIndex
CREATE INDEX "CheckInPrompt_phase_id_idx" ON "public"."CheckInPrompt"("phase_id");

-- AddForeignKey
ALTER TABLE "public"."SolutionOutline" ADD CONSTRAINT "SolutionOutline_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OutlinePhase" ADD CONSTRAINT "OutlinePhase_outline_id_fkey" FOREIGN KEY ("outline_id") REFERENCES "public"."SolutionOutline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChecklistItem" ADD CONSTRAINT "ChecklistItem_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."OutlinePhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Habit" ADD CONSTRAINT "Habit_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."OutlinePhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HabitLog" ADD CONSTRAINT "HabitLog_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CheckInPrompt" ADD CONSTRAINT "CheckInPrompt_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "public"."OutlinePhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
