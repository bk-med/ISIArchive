import { Request, Response } from 'express';
import { AuditService, AuditFilters } from '../services/auditService';
import { AuditAction } from '@prisma/client';
import { logger } from '../config/logger';

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admins can access audit logs
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Accès non autorisé' });
      return;
    }

    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resource,
      startDate,
      endDate,
      search
    } = req.query;

    const filters: AuditFilters = {};

    if (userId && typeof userId === 'string') {
      filters.userId = userId;
    }

    if (action && typeof action === 'string') {
      filters.action = action as AuditAction;
    }

    if (resource && typeof resource === 'string') {
      filters.resource = resource;
    }

    if (startDate && typeof startDate === 'string') {
      filters.startDate = new Date(startDate);
    }

    if (endDate && typeof endDate === 'string') {
      filters.endDate = new Date(endDate);
    }

    if (search && typeof search === 'string') {
      filters.search = search;
    }

    const result = await AuditService.getAuditLogs(filters, {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json(result);
  } catch (error) {
    logger.error('Error getting audit logs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des logs d\'audit' });
  }
};

/**
 * Get user activity summary
 */
export const getUserActivitySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admins can access user activity summaries
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Accès non autorisé' });
      return;
    }

    const { userId } = req.params;
    const { days = 30 } = req.query;

    const summary = await AuditService.getUserActivitySummary(
      userId,
      parseInt(days as string)
    );

    res.json(summary);
  } catch (error) {
    logger.error('Error getting user activity summary:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du résumé d\'activité' });
  }
};

/**
 * Get system statistics
 */
export const getSystemStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admins can access system stats
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Accès non autorisé' });
      return;
    }

    const stats = await AuditService.getSystemStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting system stats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques système' });
  }
};

/**
 * Get available audit actions for filtering
 */
export const getAuditActions = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admins can access this
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Accès non autorisé' });
      return;
    }

    const actions = Object.values(AuditAction);
    res.json(actions);
  } catch (error) {
    logger.error('Error getting audit actions:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des actions d\'audit' });
  }
};

/**
 * Clean up old audit logs
 */
export const cleanupOldLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admins can cleanup logs
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Accès non autorisé' });
      return;
    }

    const { retentionDays = 365 } = req.body;

    await AuditService.cleanupOldLogs(parseInt(retentionDays));

    res.json({ message: 'Nettoyage des anciens logs effectué avec succès' });
  } catch (error) {
    logger.error('Error cleaning up old logs:', error);
    res.status(500).json({ message: 'Erreur lors du nettoyage des anciens logs' });
  }
}; 