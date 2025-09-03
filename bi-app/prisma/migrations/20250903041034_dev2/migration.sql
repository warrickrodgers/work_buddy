/*
  Warnings:

  - You are about to drop the column `status` on the `ProblemRequest` table. All the data in the column will be lost.
  - Added the required column `problem_status` to the `ProblemRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ProblemRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'DID_NOT_MEET');

-- AlterTable
ALTER TABLE "public"."ProblemRequest" DROP COLUMN "status",
ADD COLUMN     "problem_status" "public"."ProblemRequestStatus" NOT NULL;

-- DropEnum
DROP TYPE "public"."Status";
