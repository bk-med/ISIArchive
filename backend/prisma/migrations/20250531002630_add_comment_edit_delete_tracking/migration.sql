-- AlterTable
ALTER TABLE "commentaires" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "is_edited" BOOLEAN NOT NULL DEFAULT false;
