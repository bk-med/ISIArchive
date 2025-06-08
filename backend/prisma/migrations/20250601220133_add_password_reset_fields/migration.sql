-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'DASHBOARD_VIEW';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expiry" TIMESTAMP(3);
