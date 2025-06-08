-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "download_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0;
