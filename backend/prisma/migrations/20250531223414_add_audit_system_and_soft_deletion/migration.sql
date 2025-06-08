-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'DOCUMENT_VIEW', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_UPLOAD', 'DOCUMENT_UPDATE', 'DOCUMENT_DELETE', 'DOCUMENT_RESTORE', 'COMMENT_CREATE', 'COMMENT_UPDATE', 'COMMENT_DELETE', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'FILIERE_CREATE', 'FILIERE_UPDATE', 'FILIERE_DELETE', 'FILIERE_RESTORE', 'MATIERE_CREATE', 'MATIERE_UPDATE', 'MATIERE_DELETE', 'MATIERE_RESTORE', 'PAGE_ACCESS', 'PROFILE_UPDATE', 'PASSWORD_CHANGE');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "deleted_by" TEXT;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT,
    "resource_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
