import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { auditMiddleware } from '../middleware/auditMiddleware';
import {
  getAdminDashboard,
  getProfessorDashboard,
  getStudentDashboard
} from '../controllers/dashboardController';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data retrieved successfully
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
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Internal server error
 */
router.get('/admin', getAdminDashboard);

/**
 * @swagger
 * /api/dashboard/professor:
 *   get:
 *     summary: Get professor dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Professor dashboard data retrieved successfully
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
 *       403:
 *         description: Access denied - Professor only
 *       500:
 *         description: Internal server error
 */
router.get('/professor', getProfessorDashboard);

/**
 * @swagger
 * /api/dashboard/student:
 *   get:
 *     summary: Get student dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard data retrieved successfully
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
 *       403:
 *         description: Access denied - Student only
 *       500:
 *         description: Internal server error
 */
router.get('/student', getStudentDashboard);

export default router; 