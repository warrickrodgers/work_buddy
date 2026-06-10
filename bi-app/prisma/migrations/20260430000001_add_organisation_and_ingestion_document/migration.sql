-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('PDF', 'CSV', 'DOCX', 'MD', 'TXT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('SURVEY', 'TURNOVER', 'POLICY', 'REPORT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED');

-- CreateTable: Organisation
CREATE TABLE "Organisation" (
    "id"         SERIAL       NOT NULL,
    "name"       TEXT         NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- Seed: create the default "Personal" organisation that existing users are backfilled into
INSERT INTO "Organisation" ("name", "updated_at") VALUES ('Personal', NOW());

-- Add organisation_id to User as nullable first so existing rows don't violate NOT NULL
ALTER TABLE "User" ADD COLUMN "organisation_id" INTEGER;

-- Backfill: every existing user gets the "Personal" organisation
UPDATE "User" SET "organisation_id" = (SELECT "id" FROM "Organisation" WHERE "name" = 'Personal' LIMIT 1);

-- Now make the column required
ALTER TABLE "User" ALTER COLUMN "organisation_id" SET NOT NULL;

-- FK constraint from User → Organisation
ALTER TABLE "User" ADD CONSTRAINT "User_organisation_id_fkey"
    FOREIGN KEY ("organisation_id") REFERENCES "Organisation"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: IngestionDocument
CREATE TABLE "IngestionDocument" (
    "id"              TEXT             NOT NULL,
    "organisation_id" INTEGER          NOT NULL,
    "uploaded_by_id"  INTEGER          NOT NULL,
    "filename"        TEXT             NOT NULL,
    "file_type"       "FileType"       NOT NULL,
    "document_type"   "DocumentType"   NOT NULL,
    "status"          "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "chunk_count"     INTEGER          NOT NULL DEFAULT 0,
    "tags"            TEXT[]           NOT NULL DEFAULT ARRAY[]::TEXT[],
    "error_message"   TEXT,
    "created_at"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3)     NOT NULL,
    CONSTRAINT "IngestionDocument_pkey" PRIMARY KEY ("id")
);

-- Indexes on IngestionDocument
CREATE INDEX "IngestionDocument_organisation_id_idx" ON "IngestionDocument"("organisation_id");
CREATE INDEX "IngestionDocument_uploaded_by_id_idx"  ON "IngestionDocument"("uploaded_by_id");

-- FK constraints on IngestionDocument
ALTER TABLE "IngestionDocument" ADD CONSTRAINT "IngestionDocument_organisation_id_fkey"
    FOREIGN KEY ("organisation_id") REFERENCES "Organisation"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "IngestionDocument" ADD CONSTRAINT "IngestionDocument_uploaded_by_id_fkey"
    FOREIGN KEY ("uploaded_by_id") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
