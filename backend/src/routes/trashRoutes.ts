import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { auditMiddleware } from '../middleware/auditMiddleware';
import {
  getDeletedDocuments,
  restoreDocument,
  getDocumentsExpiringSoon,
  permanentlyDeleteDocument,
  getTrashStats
} from '../controllers/trashController';

const router = Router();

// All trash routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/trash/documents:
 *   get:
 *     summary: Get deleted documents (trash)
 *     tags: [Trash]
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
 *         description: Number of documents per page
 *     responses:
 *       200:
 *         description: Deleted documents retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/documents', getDeletedDocuments);

/**
 * @swagger
 * /api/trash/documents/{id}/restore:
 *   post:
 *     summary: Restore a deleted document
 *     tags: [Trash]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document restored successfully
 *       400:
 *         description: Recovery period expired
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Document not found
 */
router.post('/documents/:id/restore', auditMiddleware('DOCUMENT_RESTORE', 'document'), restoreDocument);

/**
 * @swagger
 * /api/trash/documents/expiring:
 *   get:
 *     summary: Get documents expiring soon (within 7 days)
 *     tags: [Trash]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expiring documents retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/documents/expiring', getDocumentsExpiringSoon);

/**
 * @swagger
 * /api/trash/documents/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a document (admin only)
 *     tags: [Trash]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document permanently deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Document not found
 */
router.delete('/documents/:id/permanent', permanentlyDeleteDocument);

/**
 * @swagger
 * /api/trash/stats:
 *   get:
 *     summary: Get trash statistics
 *     tags: [Trash]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trash statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', getTrashStats);

export default router; 