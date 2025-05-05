-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'DID_NOT_MEET');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "job_title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "auth_method" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemRequest" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_description" TEXT NOT NULL,
    "problem_description" TEXT NOT NULL,
    "problem_parameters" TEXT NOT NULL,
    "problem_insights" TEXT NOT NULL,
    "solution_summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "Status" NOT NULL,

    CONSTRAINT "ProblemRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataUpload" (
    "id" SERIAL NOT NULL,
    "problem_request_id" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataAnalysisResult" (
    "id" SERIAL NOT NULL,
    "data_upload_id" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "inferred_schema" JSONB NOT NULL,
    "outliers_found" TEXT[],
    "metrics_highlighted" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataAnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightFeedback" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricTemplate" (
    "id" SERIAL NOT NULL,
    "problem_request_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" INTEGER NOT NULL,
    "metric_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DataUpload_problem_request_id_key" ON "DataUpload"("problem_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "DataAnalysisResult_data_upload_id_key" ON "DataAnalysisResult"("data_upload_id");

-- CreateIndex
CREATE UNIQUE INDEX "MetricTemplate_problem_request_id_key" ON "MetricTemplate"("problem_request_id");

-- AddForeignKey
ALTER TABLE "ProblemRequest" ADD CONSTRAINT "ProblemRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataUpload" ADD CONSTRAINT "DataUpload_problem_request_id_fkey" FOREIGN KEY ("problem_request_id") REFERENCES "ProblemRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataAnalysisResult" ADD CONSTRAINT "DataAnalysisResult_data_upload_id_fkey" FOREIGN KEY ("data_upload_id") REFERENCES "DataUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightFeedback" ADD CONSTRAINT "InsightFeedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricTemplate" ADD CONSTRAINT "MetricTemplate_problem_request_id_fkey" FOREIGN KEY ("problem_request_id") REFERENCES "ProblemRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
