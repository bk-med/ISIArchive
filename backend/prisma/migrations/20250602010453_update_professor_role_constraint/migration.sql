/*
  Warnings:

  - A unique constraint covering the columns `[matiere_id,role]` on the table `professeur_matieres` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "professeur_matieres_professeur_id_matiere_id_role_key";

-- CreateIndex
CREATE UNIQUE INDEX "professeur_matieres_matiere_id_role_key" ON "professeur_matieres"("matiere_id", "role");
