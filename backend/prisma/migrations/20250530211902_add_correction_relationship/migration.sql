-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('etudiant', 'professeur', 'admin');

-- CreateEnum
CREATE TYPE "NiveauType" AS ENUM ('licence', 'master', 'ingenieur');

-- CreateEnum
CREATE TYPE "DocumentCategorie" AS ENUM ('cours', 'td', 'tp', 'examen', 'pfe');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "filiere_id" TEXT,
    "niveau_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niveaux" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "NiveauType" NOT NULL,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "niveaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filieres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "niveau_id" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "filieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semestres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "niveau_id" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "semestres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matieres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "filiere_id" TEXT NOT NULL,
    "semestre_id" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professeur_matieres" (
    "id" TEXT NOT NULL,
    "professeur_id" TEXT NOT NULL,
    "matiere_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professeur_matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "chemin_fichier" TEXT NOT NULL,
    "nom_fichier" TEXT NOT NULL,
    "taille_fichier" BIGINT NOT NULL,
    "type_mime" TEXT NOT NULL,
    "categorie" "DocumentCategorie" NOT NULL,
    "matiere_id" TEXT,
    "telecharge_par" TEXT NOT NULL,
    "correction_id" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents_pfe" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "annee_diplome" INTEGER NOT NULL,
    "filiere_diplome" TEXT NOT NULL,
    "titre_projet" TEXT NOT NULL,
    "resume" TEXT,
    "mots_cles" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pfe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commentaires" (
    "id" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commentaires_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "niveaux_nom_key" ON "niveaux"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "niveaux_ordre_key" ON "niveaux"("ordre");

-- CreateIndex
CREATE UNIQUE INDEX "filieres_code_key" ON "filieres"("code");

-- CreateIndex
CREATE UNIQUE INDEX "semestres_niveau_id_ordre_key" ON "semestres"("niveau_id", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "matieres_code_filiere_id_key" ON "matieres"("code", "filiere_id");

-- CreateIndex
CREATE UNIQUE INDEX "professeur_matieres_professeur_id_matiere_id_key" ON "professeur_matieres"("professeur_id", "matiere_id");

-- CreateIndex
CREATE UNIQUE INDEX "documents_correction_id_key" ON "documents"("correction_id");

-- CreateIndex
CREATE UNIQUE INDEX "documents_pfe_document_id_key" ON "documents_pfe"("document_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_niveau_id_fkey" FOREIGN KEY ("niveau_id") REFERENCES "niveaux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filieres" ADD CONSTRAINT "filieres_niveau_id_fkey" FOREIGN KEY ("niveau_id") REFERENCES "niveaux"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semestres" ADD CONSTRAINT "semestres_niveau_id_fkey" FOREIGN KEY ("niveau_id") REFERENCES "niveaux"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matieres" ADD CONSTRAINT "matieres_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matieres" ADD CONSTRAINT "matieres_semestre_id_fkey" FOREIGN KEY ("semestre_id") REFERENCES "semestres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professeur_matieres" ADD CONSTRAINT "professeur_matieres_professeur_id_fkey" FOREIGN KEY ("professeur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professeur_matieres" ADD CONSTRAINT "professeur_matieres_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_telecharge_par_fkey" FOREIGN KEY ("telecharge_par") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_correction_id_fkey" FOREIGN KEY ("correction_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents_pfe" ADD CONSTRAINT "documents_pfe_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "commentaires"("id") ON DELETE SET NULL ON UPDATE CASCADE;
