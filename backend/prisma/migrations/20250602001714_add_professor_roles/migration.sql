/*
  Warnings:

  - A unique constraint covering the columns `[professeur_id,matiere_id,role]` on the table `professeur_matieres` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `role` to the `professeur_matieres` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProfesseurRole" AS ENUM ('cours', 'td', 'tp');

-- DropIndex
DROP INDEX "professeur_matieres_professeur_id_matiere_id_key";

-- AlterTable
ALTER TABLE "professeur_matieres" ADD COLUMN     "role" "ProfesseurRole" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "professeur_matieres_professeur_id_matiere_id_role_key" ON "professeur_matieres"("professeur_id", "matiere_id", "role");
