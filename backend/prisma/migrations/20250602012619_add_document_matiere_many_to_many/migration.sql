-- CreateTable
CREATE TABLE "document_matieres" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "matiere_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_matieres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_matieres_document_id_matiere_id_key" ON "document_matieres"("document_id", "matiere_id");

-- AddForeignKey
ALTER TABLE "document_matieres" ADD CONSTRAINT "document_matieres_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_matieres" ADD CONSTRAINT "document_matieres_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
