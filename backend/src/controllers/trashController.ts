import { Request, Response } from 'express';
import { DocumentService } from '../services/documentService';
import { logger } from '../config/logger';
import { logAuditEvent } from '../middleware/auditMiddleware';

/**
 * Helper function to convert BigInt values to strings for JSON serialization
 */
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertBigIntToString(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
};

/**
 * Get deleted documents (trash) for current user
 */
export const getDeletedDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    
    const { page = 1, limit = 20 } = req.query;

    const result = await DocumentService.getDeletedDocuments(
      userId,
      userRole,
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    );

    // Convert BigInt values to strings
    const convertedResult = convertBigIntToString(result);

    // Log page access
    await logAuditEvent(
      userId,
      'PAGE_ACCESS',
      'trash',
      undefined,
      { 
        page: 'corbeille',
        url: req.originalUrl,
        method: req.method
      },
      req
    );

    res.json(convertedResult);
  } catch (error) {
    logger.error('Error getting deleted documents:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des documents supprimés' });
  }
};

/**
 * Restore a deleted document
 */
export const restoreDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const restoredDocument = await DocumentService.restoreDocument(id, userId, userRole);

    // Log document restoration
    await logAuditEvent(
      userId,
      'DOCUMENT_RESTORE',
      'document',
      id,
      { 
        documentTitle: restoredDocument.titre,
        action: 'restore'
      },
      req
    );

    // Convert BigInt values to strings
    const convertedDocument = convertBigIntToString(restoredDocument);

    res.json({
      message: 'Document restauré avec succès',
      document: convertedDocument
    });
  } catch (error) {
    logger.error('Error restoring document:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('non trouvé')) {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error.message.includes('Permissions insuffisantes')) {
        res.status(403).json({ message: error.message });
        return;
      }
      if (error.message.includes('période de récupération')) {
        res.status(400).json({ message: error.message });
        return;
      }
    }
    
    res.status(500).json({ message: 'Erreur lors de la restauration du document' });
  }
};

/**
 * Get documents expiring soon (within 7 days)
 */
export const getDocumentsExpiringSoon = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const documents = await DocumentService.getDocumentsExpiringSoon(userId, userRole);

    // Convert BigInt values to strings
    const convertedDocuments = convertBigIntToString(documents);

    res.json(convertedDocuments);
  } catch (error) {
    logger.error('Error getting documents expiring soon:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des documents expirant bientôt' });
  }
};

/**
 * Permanently delete a document (admin only)
 */
export const permanentlyDeleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Only admins can permanently delete documents
    if (userRole !== 'admin') {
      res.status(403).json({ message: 'Accès non autorisé' });
      return;
    }

    // Get document info before deletion for logging
    const document = await DocumentService.getDocumentById(id, userId, userRole);
    if (!document || !document.isDeleted) {
      res.status(404).json({ message: 'Document supprimé non trouvé' });
      return;
    }

    // This would require implementing a permanent delete method
    // For now, we'll just return a message
    res.json({ message: 'Suppression permanente non encore implémentée' });
  } catch (error) {
    logger.error('Error permanently deleting document:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression permanente du document' });
  }
};

/**
 * Get trash statistics
 */
export const getTrashStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Get all deleted documents for the user
    const result = await DocumentService.getDeletedDocuments(userId, userRole, { limit: 1000 });
    const documents = result.documents;

    // Calculate statistics
    const totalDeleted = documents.length;
    const expiringSoon = documents.filter(doc => {
      if (!doc.deletedAt) return false;
      const daysLeft = Math.ceil((new Date(doc.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      return daysLeft <= 7;
    }).length;

    // Group by category
    const byCategory = documents.reduce((acc, doc) => {
      acc[doc.categorie] = (acc[doc.categorie] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent deletions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDeletions = documents.filter(doc => 
      doc.deletedAt && new Date(doc.deletedAt) >= sevenDaysAgo
    ).length;

    res.json({
      totalDeleted,
      expiringSoon,
      recentDeletions,
      byCategory
    });
  } catch (error) {
    logger.error('Error getting trash stats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques de la corbeille' });
  }
}; 