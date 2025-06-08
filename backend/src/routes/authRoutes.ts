import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints d'authentification et de gestion de session
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur avec email et mot de passe
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@isi.tn"
 *               password:
 *                 type: string
 *                 example: "admin123"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Connexion réussie"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Identifiants invalides
 *       429:
 *         description: Trop de tentatives de connexion
 */
router.post('/login', validate(schemas.login), AuthController.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Demander la réinitialisation du mot de passe
 *     description: Envoie un email avec un lien de réinitialisation du mot de passe
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@isi.tn"
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé (si l'email existe)
 *       400:
 *         description: Email requis
 *       500:
 *         description: Erreur serveur
 */
router.post('/forgot-password', AuthController.requestPasswordReset);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe
 *     description: Réinitialise le mot de passe avec un token valide
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: "reset-token-here"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Token invalide ou mot de passe faible
 *       500:
 *         description: Erreur serveur
 */
router.post('/reset-password', AuthController.resetPassword);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Rafraîchir le token d'accès
 *     description: Génère un nouveau token d'accès à partir du token de rafraîchissement
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token rafraîchi avec succès
 *       401:
 *         description: Token de rafraîchissement invalide
 */
router.post('/refresh', validate(schemas.refreshToken), AuthController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion utilisateur
 *     description: Déconnecte l'utilisateur et invalide les tokens
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non authentifié
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Déconnexion de tous les appareils
 *     description: Déconnecte l'utilisateur de tous les appareils
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion de tous les appareils réussie
 *       401:
 *         description: Non authentifié
 */
router.post('/logout-all', authenticate, AuthController.logoutAllDevices);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtenir le profil utilisateur
 *     description: Récupère les informations du profil de l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
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
 *                     session:
 *                       type: object
 *       401:
 *         description: Non authentifié
 */
router.get('/profile', authenticate, AuthController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Mettre à jour le profil utilisateur
 *     description: Met à jour les informations de base du profil utilisateur
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prenom:
 *                 type: string
 *                 example: "Mohamed"
 *               nom:
 *                 type: string
 *                 example: "Ben Ali"
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.put('/profile', authenticate, validate(schemas.updateUser), AuthController.updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Changer le mot de passe
 *     description: Change le mot de passe de l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *       400:
 *         description: Mot de passe actuel incorrect ou nouveau mot de passe faible
 *       401:
 *         description: Non authentifié
 */
router.post('/change-password', authenticate, validate(schemas.changePassword), AuthController.changePassword);

/**
 * @swagger
 * /api/auth/check:
 *   get:
 *     summary: Vérifier l'authentification
 *     description: Vérifie si l'utilisateur est authentifié et sa session est valide
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utilisateur authentifié
 *       401:
 *         description: Non authentifié ou session expirée
 */
router.get('/check', authenticate, AuthController.checkAuth);

export default router; 