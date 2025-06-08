import { Router } from 'express';
import { AcademicController } from '../controllers/academicController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';
import { validate, validateParams, schemas } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Academic Structure
 *   description: Endpoints de gestion de la structure académique (niveaux, filières, matières)
 */

/**
 * @swagger
 * /api/academic/niveaux:
 *   get:
 *     summary: Obtenir tous les niveaux
 *     description: Récupère la liste de tous les niveaux académiques avec leurs filières et semestres
 *     tags: [Academic Structure]
 *     responses:
 *       200:
 *         description: Niveaux récupérés avec succès
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nom:
 *                         type: string
 *                         example: "L2"
 *                       type:
 *                         type: string
 *                         enum: [licence, master, ingenieur]
 *                       ordre:
 *                         type: integer
 *                       filieres:
 *                         type: array
 *                       semestres:
 *                         type: array
 */
router.get('/niveaux', optionalAuth, AcademicController.getNiveaux);

/**
 * @swagger
 * /api/academic/filieres:
 *   get:
 *     summary: Obtenir toutes les filières
 *     description: Récupère la liste des filières avec filtrage optionnel par niveau
 *     tags: [Academic Structure]
 *     parameters:
 *       - in: query
 *         name: niveauId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrer par niveau
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *         description: Inclure les filières supprimées (Admin uniquement)
 *     responses:
 *       200:
 *         description: Filières récupérées avec succès
 */
router.get('/filieres', optionalAuth, AcademicController.getFilieres);

/**
 * @swagger
 * /api/academic/filieres:
 *   post:
 *     summary: Créer une nouvelle filière
 *     description: Crée une nouvelle filière (Admin uniquement)
 *     tags: [Academic Structure]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - code
 *               - niveauId
 *             properties:
 *               nom:
 *                 type: string
 *                 example: "Informatique et Réseaux"
 *               code:
 *                 type: string
 *                 example: "L2-IRS"
 *               niveauId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Filière créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 */
router.post('/filieres', authenticate, requireAdmin, validate(schemas.createFiliere), AcademicController.createFiliere);

/**
 * @swagger
 * /api/academic/filieres/{id}:
 *   put:
 *     summary: Mettre à jour une filière
 *     description: Met à jour les informations d'une filière (Admin uniquement)
 *     tags: [Academic Structure]
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
 *               nom:
 *                 type: string
 *               code:
 *                 type: string
 *               niveauId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Filière mise à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Filière non trouvée
 */
router.put('/filieres/:id', authenticate, requireAdmin, validateParams(schemas.uuidParam), validate(schemas.updateFiliere), AcademicController.updateFiliere);

/**
 * @swagger
 * /api/academic/filieres/{id}:
 *   delete:
 *     summary: Supprimer une filière
 *     description: Supprime une filière (suppression douce) (Admin uniquement)
 *     tags: [Academic Structure]
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
 *         description: Filière supprimée avec succès
 *       400:
 *         description: Impossible de supprimer (utilisateurs actifs)
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Filière non trouvée
 */
router.delete('/filieres/:id', authenticate, requireAdmin, validateParams(schemas.uuidParam), AcademicController.deleteFiliere);

/**
 * @swagger
 * /api/academic/matieres:
 *   get:
 *     summary: Récupérer la liste des matières
 *     description: Récupère toutes les matières avec filtrage optionnel
 *     tags: [Academic]
 *     parameters:
 *       - in: query
 *         name: filiereId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrer par filière
 *       - in: query
 *         name: semestreId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrer par semestre
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *         description: Inclure les matières supprimées (Admin uniquement)
 *     responses:
 *       200:
 *         description: Matières récupérées avec succès
 *       500:
 *         description: Erreur serveur
 */
router.get('/matieres', optionalAuth, AcademicController.getMatieres);

/**
 * @swagger
 * /api/academic/matieres/{id}:
 *   get:
 *     summary: Récupérer une matière par ID
 *     description: Récupère les détails d'une matière spécifique
 *     tags: [Academic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la matière
 *     responses:
 *       200:
 *         description: Matière récupérée avec succès
 *       403:
 *         description: Accès non autorisé
 *       404:
 *         description: Matière non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/matieres/:id', authenticate, validateParams(schemas.uuidParam), AcademicController.getMatiere);

/**
 * @swagger
 * /api/academic/matieres:
 *   post:
 *     summary: Créer une nouvelle matière
 *     description: Crée une nouvelle matière (Admin uniquement)
 *     tags: [Academic Structure]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - code
 *               - filiereId
 *               - semestreId
 *             properties:
 *               nom:
 *                 type: string
 *                 example: "Algorithmique et Structures de Données"
 *               code:
 *                 type: string
 *                 example: "ALGO"
 *               filiereId:
 *                 type: string
 *                 format: uuid
 *               semestreId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Matière créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 */
router.post('/matieres', authenticate, requireAdmin, validate(schemas.createMatiere), AcademicController.createMatiere);

/**
 * @swagger
 * /api/academic/matieres/{id}:
 *   put:
 *     summary: Mettre à jour une matière
 *     description: Met à jour les informations d'une matière (Admin uniquement)
 *     tags: [Academic Structure]
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
 *               nom:
 *                 type: string
 *               code:
 *                 type: string
 *               filiereId:
 *                 type: string
 *                 format: uuid
 *               semestreId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Matière mise à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Matière non trouvée
 */
router.put('/matieres/:id', authenticate, requireAdmin, validateParams(schemas.uuidParam), validate(schemas.updateMatiere), AcademicController.updateMatiere);

/**
 * @swagger
 * /api/academic/matieres/{id}:
 *   delete:
 *     summary: Supprimer une matière
 *     description: Supprime une matière (suppression douce) (Admin uniquement)
 *     tags: [Academic Structure]
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
 *         description: Matière supprimée avec succès
 *       400:
 *         description: Impossible de supprimer (documents existants)
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Matière non trouvée
 */
router.delete('/matieres/:id', authenticate, requireAdmin, validateParams(schemas.uuidParam), AcademicController.deleteMatiere);

/**
 * @swagger
 * /api/academic/professeurs/{id}/matieres:
 *   get:
 *     summary: Obtenir les matières d'un professeur avec leurs rôles
 *     description: Récupère la liste des matières assignées à un professeur avec leurs rôles (cours, TD, TP)
 *     tags: [Academic Structure]
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
 *     responses:
 *       200:
 *         description: Matières du professeur récupérées avec succès
 *       400:
 *         description: L'utilisateur n'est pas un professeur
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Professeur non trouvé
 */
router.get('/professeurs/:id/matieres', authenticate, validateParams(schemas.uuidParam), AcademicController.getProfesseurMatieres);

/**
 * @swagger
 * /api/academic/matieres/{id}/professeurs:
 *   get:
 *     summary: Obtenir les professeurs d'une matière avec leurs rôles
 *     description: Récupère la liste des professeurs assignés à une matière avec leurs rôles
 *     tags: [Academic Structure]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la matière
 *     responses:
 *       200:
 *         description: Professeurs de la matière récupérés avec succès
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Matière non trouvée
 */
router.get('/matieres/:id/professeurs', authenticate, validateParams(schemas.uuidParam), AcademicController.getMatiereProfesseurs);

/**
 * @swagger
 * /api/academic/professeurs/{id}/matieres:
 *   post:
 *     summary: Assigner une matière à un professeur avec un rôle
 *     description: Assigne une matière à un professeur avec un rôle spécifique (cours, TD, TP) (Admin uniquement)
 *     tags: [Academic Structure]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matiereId
 *               - role
 *             properties:
 *               matiereId:
 *                 type: string
 *                 format: uuid
 *               role:
 *                 type: string
 *                 enum: [cours, td, tp]
 *                 description: Rôle du professeur pour cette matière
 *     responses:
 *       201:
 *         description: Matière assignée avec succès
 *       400:
 *         description: Assignation déjà existante ou données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Professeur ou matière non trouvé
 */
router.post('/professeurs/:id/matieres', authenticate, requireAdmin, validateParams(schemas.uuidParam), validate(schemas.assignMatiereWithRole), AcademicController.assignMatiereToProf);

/**
 * @swagger
 * /api/academic/professeurs/{id}/matieres/{matiereId}:
 *   delete:
 *     summary: Retirer une matière d'un professeur
 *     description: Retire l'assignation d'une matière à un professeur pour un rôle spécifique ou tous les rôles (Admin uniquement)
 *     tags: [Academic Structure]
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
 *       - in: path
 *         name: matiereId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la matière
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [cours, td, tp]
 *                 description: Rôle spécifique à supprimer (optionnel, si omis supprime tous les rôles)
 *     responses:
 *       200:
 *         description: Assignation supprimée avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Assignation non trouvée
 */
router.delete('/professeurs/:id/matieres/:matiereId', authenticate, requireAdmin, validateParams(schemas.professeurMatiereParams), AcademicController.removeMatiereFromProf);

/**
 * @swagger
 * /api/academic/matieres/{id}/professeurs:
 *   put:
 *     summary: Mettre à jour les assignations de professeurs pour une matière
 *     description: Met à jour complètement les assignations de professeurs pour une matière (Admin uniquement)
 *     tags: [Academic Structure]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la matière
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - professeurs
 *             properties:
 *               professeurs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - professeurId
 *                     - roles
 *                   properties:
 *                     professeurId:
 *                       type: string
 *                       format: uuid
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [cours, td, tp]
 *     responses:
 *       200:
 *         description: Assignations mises à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Matière non trouvée
 */
router.put('/matieres/:id/professeurs', authenticate, requireAdmin, validateParams(schemas.uuidParam), validate(schemas.updateMatiereProfesseurs), AcademicController.updateMatiereProfesseurs);

export default router; 