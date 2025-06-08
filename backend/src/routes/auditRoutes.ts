import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { auditMiddleware } from '../middleware/auditMiddleware';
import {
  getAuditLogs,
  getUserActivitySummary,
  getSystemStats,
  getAuditActions,
  cleanupOldLogs
} from '../controllers/auditController';

const router = Router();

// All audit routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Get audit logs (admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of logs per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in logs
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/logs', getAuditLogs);

/**
 * @swagger
 * /api/audit/users/{userId}/activity:
 *   get:
 *     summary: Get user activity summary (admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: User activity summary retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/users/:userId/activity', getUserActivitySummary);

/**
 * @swagger
 * /api/audit/stats:
 *   get:
 *     summary: Get system statistics (admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/stats', getSystemStats);

/**
 * @swagger
 * /api/audit/actions:
 *   get:
 *     summary: Get available audit actions (admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit actions retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/actions', getAuditActions);

/**
 * @swagger
 * /api/audit/cleanup:
 *   post:
 *     summary: Clean up old audit logs (admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               retentionDays:
 *                 type: integer
 *                 description: Number of days to retain logs
 *                 default: 365
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *       403:
 *         description: Access denied
 */
router.post('/cleanup', cleanupOldLogs);

export default router; 