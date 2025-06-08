import { Router } from 'express';
import { DocumentController } from '../controllers/documentController';
import { CommentController } from '../controllers/commentController';
import { authenticate, requireAdmin, requireProfessorOrAdmin } from '../middleware/auth';
import { validate, validateParams, validateQuery, schemas } from '../middleware/validation';
import { uploadDocument, handleUploadError, organizeUploadedFile } from '../middleware/upload';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Gestion des documents académiques
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         titre:
 *           type: string
 *         description:
 *           type: string
 *         categorie:
 *           type: string
 *           enum: [cours, td, tp, examen, pfe]
 *         nomFichier:
 *           type: string
 *         tailleFichier:
 *           type: string
 *         typeMime:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         uploader:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             prenom:
 *               type: string
 *             nom:
 *               type: string
 *             role:
 *               type: string
 *         matiere:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             nom:
 *               type: string
 *             code:
 *               type: string
 */

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Récupérer la liste des documents
 *     description: Récupère les documents avec filtrage et pagination selon les permissions utilisateur
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: matiereId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrer par matière
 *       - in: query
 *         name: categorie
 *         schema:
 *           type: string
 *           enum: [cours, td, tp, examen, pfe]
 *         description: Filtrer par catégorie
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche dans le titre et la description
 *     responses:
 *       200:
 *         description: Documents récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Document'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Non authentifié
 */
router.get('/', authenticate, validateQuery(schemas.documentQuery), DocumentController.getDocuments);

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Télécharger un nouveau document
 *     description: Télécharge un nouveau document (Professeur/Admin uniquement)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *               - titre
 *               - categorie
 *               - niveau
 *               - filiere
 *               - semestre
 *               - matiere
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Fichier document (PDF, DOC, DOCX, PPT, PPTX)
 *               titre:
 *                 type: string
 *                 description: Titre du document
 *               description:
 *                 type: string
 *                 description: Description du document
 *               categorie:
 *                 type: string
 *                 enum: [cours, td, tp, examen, pfe]
 *                 description: Catégorie du document
 *               matiereId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la matière
 *               niveau:
 *                 type: string
 *                 description: Niveau pour l'organisation des fichiers
 *               filiere:
 *                 type: string
 *                 description: Filière pour l'organisation des fichiers
 *               semestre:
 *                 type: string
 *                 description: Semestre pour l'organisation des fichiers
 *               matiere:
 *                 type: string
 *                 description: Matière pour l'organisation des fichiers
 *     responses:
 *       201:
 *         description: Document téléchargé avec succès
 *       400:
 *         description: Données invalides ou fichier manquant
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 */
router.post('/', authenticate, requireProfessorOrAdmin, uploadDocument, organizeUploadedFile, handleUploadError, validate(schemas.createDocument), DocumentController.uploadDocument);

/**
 * @swagger
 * /api/documents/pfe:
 *   post:
 *     summary: Télécharger un document PFE
 *     description: Télécharge un nouveau document PFE (Admin uniquement)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *               - titre
 *               - anneeDiplome
 *               - filiereDiplome
 *               - titreProjet
 *               - niveau
 *               - filiere
 *               - semestre
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Fichier document PFE
 *               titre:
 *                 type: string
 *                 description: Titre du document
 *               description:
 *                 type: string
 *                 description: Description du document
 *               anneeDiplome:
 *                 type: integer
 *                 description: Année de diplôme
 *               filiereDiplome:
 *                 type: string
 *                 description: Filière de diplôme
 *               titreProjet:
 *                 type: string
 *                 description: Titre du projet PFE
 *               resume:
 *                 type: string
 *                 description: Résumé du projet
 *               motsCles:
 *                 type: string
 *                 description: Mots-clés séparés par des virgules
 *               niveau:
 *                 type: string
 *                 description: Niveau pour l'organisation des fichiers
 *               filiere:
 *                 type: string
 *                 description: Filière pour l'organisation des fichiers
 *               semestre:
 *                 type: string
 *                 description: Semestre pour l'organisation des fichiers
 *     responses:
 *       201:
 *         description: Document PFE téléchargé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes (Admin uniquement)
 */
router.post('/pfe', authenticate, requireAdmin, uploadDocument, organizeUploadedFile, handleUploadError, validate(schemas.createPFEDocument), DocumentController.uploadPFEDocument);

/**
 * @swagger
 * /api/documents/pfe:
 *   get:
 *     summary: Récupérer les documents PFE
 *     description: Récupère la liste des documents PFE (accessible aux étudiants en semestre terminal)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche dans le titre et la description
 *     responses:
 *       200:
 *         description: Documents PFE récupérés avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès réservé aux étudiants en semestre terminal
 */
router.get('/pfe', authenticate, validateQuery(schemas.documentQuery), DocumentController.getPFEDocuments);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Récupérer un document par ID
 *     description: Récupère les détails d'un document spécifique
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document récupéré avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé
 *       404:
 *         description: Document non trouvé
 */
router.get('/:id', authenticate, validateParams(schemas.uuidParam), DocumentController.getDocumentById);

/**
 * @swagger
 * /api/documents/{id}:
 *   put:
 *     summary: Mettre à jour un document
 *     description: Met à jour les métadonnées d'un document (propriétaire ou admin)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               description:
 *                 type: string
 *               categorie:
 *                 type: string
 *                 enum: [cours, td, tp, examen, pfe]
 *               matiereId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Document mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Document non trouvé
 */
router.put('/:id', authenticate, validateParams(schemas.uuidParam), validate(schemas.updateDocument), DocumentController.updateDocument);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Supprimer un document
 *     description: Supprime un document (soft delete - propriétaire ou admin)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Document non trouvé
 */
router.delete('/:id', authenticate, validateParams(schemas.uuidParam), DocumentController.deleteDocument);

/**
 * @swagger
 * /api/documents/{id}/download:
 *   get:
 *     summary: Télécharger un document
 *     description: Télécharge le fichier d'un document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Fichier téléchargé avec succès
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé
 *       404:
 *         description: Document ou fichier non trouvé
 */
router.get('/:id/download', authenticate, validateParams(schemas.uuidParam), DocumentController.downloadDocument);

/**
 * @swagger
 * /api/documents/professor/{id}:
 *   get:
 *     summary: Récupérer les documents d'un professeur
 *     description: Récupère tous les documents téléchargés par un professeur spécifique
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du professeur
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Documents du professeur récupérés avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 */
router.get('/professor/:id', authenticate, validateParams(schemas.uuidParam), validateQuery(schemas.documentQuery), DocumentController.getDocumentsByProfessor);

// Comment routes

/**
 * @swagger
 * /api/documents/{id}/comments:
 *   get:
 *     summary: Récupérer les commentaires d'un document
 *     description: Récupère la liste des commentaires pour un document spécifique
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du document
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Commentaires récupérés avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé au document
 *       404:
 *         description: Document non trouvé
 */
router.get('/:id/comments', authenticate, validateParams(schemas.uuidParam), validateQuery(schemas.commentQuery), CommentController.getDocumentComments);

/**
 * @swagger
 * /api/documents/{id}/comments:
 *   post:
 *     summary: Créer un commentaire
 *     description: Ajoute un nouveau commentaire à un document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du document
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contenu
 *             properties:
 *               contenu:
 *                 type: string
 *                 description: Contenu du commentaire
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID du commentaire parent (pour les réponses)
 *     responses:
 *       201:
 *         description: Commentaire créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé au document
 *       404:
 *         description: Document non trouvé
 */
router.post('/:id/comments', authenticate, validateParams(schemas.uuidParam), validate(schemas.createComment), CommentController.createComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Mettre à jour un commentaire
 *     description: Met à jour le contenu d'un commentaire (propriétaire ou admin)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du commentaire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contenu
 *             properties:
 *               contenu:
 *                 type: string
 *                 description: Nouveau contenu du commentaire
 *     responses:
 *       200:
 *         description: Commentaire mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Commentaire non trouvé
 */
router.put('/comments/:id', authenticate, validateParams(schemas.uuidParam), validate(schemas.updateComment), CommentController.updateComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Supprimer un commentaire
 *     description: Supprime un commentaire et ses réponses (propriétaire ou admin)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du commentaire
 *     responses:
 *       200:
 *         description: Commentaire supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Commentaire non trouvé
 */
router.delete('/comments/:id', authenticate, validateParams(schemas.uuidParam), CommentController.deleteComment);

/**
 * @swagger
 * /api/documents/{parentDocumentId}/correction:
 *   post:
 *     summary: Télécharger une correction pour un document
 *     description: Télécharge une correction pour un document existant (Professeur/Admin uniquement)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentDocumentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du document parent pour lequel ajouter une correction
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *               - titre
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Fichier de correction (PDF, DOC, DOCX, PPT, PPTX)
 *               titre:
 *                 type: string
 *                 description: Titre de la correction
 *               description:
 *                 type: string
 *                 description: Description de la correction
 *     responses:
 *       201:
 *         description: Correction téléchargée avec succès
 *       400:
 *         description: Données invalides ou correction déjà existante
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Document parent non trouvé
 */
router.post('/:parentDocumentId/correction', authenticate, requireProfessorOrAdmin, uploadDocument, handleUploadError, DocumentController.uploadCorrection);

/**
 * @swagger
 * /api/comments/{id}/can-reply:
 *   get:
 *     summary: Vérifier si l'utilisateur peut répondre à un commentaire
 *     description: Vérifie les permissions de réponse selon les règles de conversation
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du commentaire
 *     responses:
 *       200:
 *         description: Permissions vérifiées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     canReply:
 *                       type: boolean
 *                     reason:
 *                       type: string
 *       401:
 *         description: Non authentifié
 */
router.get('/comments/:id/can-reply', authenticate, validateParams(schemas.uuidParam), CommentController.checkReplyPermission);

export default router; 