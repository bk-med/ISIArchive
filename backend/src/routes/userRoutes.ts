import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, requireAdmin, requireOwnershipOrAdmin } from '../middleware/auth';
import { validate, validateParams, validateQuery, schemas } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints de gestion des utilisateurs (Admin uniquement)
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Créer un nouvel utilisateur
 *     description: Crée un nouvel utilisateur (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - prenom
 *               - nom
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "etudiant@isi.tn"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "MotDePasse123!"
 *               prenom:
 *                 type: string
 *                 example: "Ahmed"
 *               nom:
 *                 type: string
 *                 example: "Ben Salem"
 *               role:
 *                 type: string
 *                 enum: [etudiant, professeur, admin]
 *                 example: "etudiant"
 *               filiereId:
 *                 type: string
 *                 format: uuid
 *                 description: "Requis pour les étudiants"
 *               niveauId:
 *                 type: string
 *                 format: uuid
 *                 description: "Requis pour les étudiants"
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 */
router.post('/', authenticate, requireAdmin, validate(schemas.createUser), UserController.createUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtenir la liste des utilisateurs
 *     description: Récupère la liste des utilisateurs avec pagination et filtres (Admin uniquement)
 *     tags: [Users]
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
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par email, prénom ou nom
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [etudiant, professeur, admin]
 *         description: Filtrer par rôle
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut actif
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 */
router.get('/', authenticate, requireAdmin, validateQuery(schemas.pagination), UserController.getUsers);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Obtenir les statistiques des utilisateurs
 *     description: Récupère les statistiques des utilisateurs (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         activeUsers:
 *                           type: integer
 *                         inactiveUsers:
 *                           type: integer
 *                         roleDistribution:
 *                           type: object
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 */
router.get('/stats', authenticate, requireAdmin, UserController.getUserStats);

/**
 * @swagger
 * /api/users/bulk-update:
 *   put:
 *     summary: Mise à jour en lot des utilisateurs
 *     description: Met à jour plusieurs utilisateurs en une seule opération (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - updateData
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               updateData:
 *                 type: object
 *                 properties:
 *                   isActive:
 *                     type: boolean
 *                   role:
 *                     type: string
 *                     enum: [etudiant, professeur, admin]
 *     responses:
 *       200:
 *         description: Utilisateurs mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 */
router.put('/bulk-update', authenticate, requireAdmin, UserController.bulkUpdateUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtenir un utilisateur par ID
 *     description: Récupère les informations d'un utilisateur spécifique
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur récupéré avec succès
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:id', authenticate, requireOwnershipOrAdmin((req) => req.params.id), validateParams(schemas.uuidParam), UserController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur
 *     description: Met à jour les informations d'un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prenom:
 *                 type: string
 *               nom:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [etudiant, professeur, admin]
 *               isActive:
 *                 type: boolean
 *               filiereId:
 *                 type: string
 *                 format: uuid
 *               niveauId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/:id', authenticate, requireOwnershipOrAdmin((req) => req.params.id), validateParams(schemas.uuidParam), validate(schemas.updateUser), UserController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     description: Supprime un utilisateur (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *       400:
 *         description: Impossible de supprimer l'utilisateur
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Utilisateur non trouvé
 */
router.delete('/:id', authenticate, requireAdmin, validateParams(schemas.uuidParam), UserController.deleteUser);

/**
 * @swagger
 * /api/users/{id}/toggle-status:
 *   patch:
 *     summary: Basculer le statut actif d'un utilisateur
 *     description: Active ou désactive un utilisateur (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Statut de l'utilisateur modifié avec succès
 *       400:
 *         description: Impossible de modifier le statut
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Utilisateur non trouvé
 */
router.patch('/:id/toggle-status', authenticate, requireAdmin, validateParams(schemas.uuidParam), UserController.toggleUserStatus);

export default router; 