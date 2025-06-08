"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldLogs = exports.getAuditActions = exports.getSystemStats = exports.getUserActivitySummary = exports.getAuditLogs = void 0;
const auditService_1 = require("../services/auditService");
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
const getAuditLogs = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ message: 'Accès non autorisé' });
            return;
        }
        const { page = 1, limit = 50, userId, action, resource, startDate, endDate, search } = req.query;
        const filters = {};
        if (userId && typeof userId === 'string') {
            filters.userId = userId;
        }
        if (action && typeof action === 'string') {
            filters.action = action;
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
        const result = await auditService_1.AuditService.getAuditLogs(filters, {
            page: parseInt(page),
            limit: parseInt(limit)
        });
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error('Error getting audit logs:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des logs d\'audit' });
    }
};
exports.getAuditLogs = getAuditLogs;
const getUserActivitySummary = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ message: 'Accès non autorisé' });
            return;
        }
        const { userId } = req.params;
        const { days = 30 } = req.query;
        const summary = await auditService_1.AuditService.getUserActivitySummary(userId, parseInt(days));
        res.json(summary);
    }
    catch (error) {
        logger_1.logger.error('Error getting user activity summary:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du résumé d\'activité' });
    }
};
exports.getUserActivitySummary = getUserActivitySummary;
const getSystemStats = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ message: 'Accès non autorisé' });
            return;
        }
        const stats = await auditService_1.AuditService.getSystemStats();
        res.json(stats);
    }
    catch (error) {
        logger_1.logger.error('Error getting system stats:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques système' });
    }
};
exports.getSystemStats = getSystemStats;
const getAuditActions = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ message: 'Accès non autorisé' });
            return;
        }
        const actions = Object.values(client_1.AuditAction);
        res.json(actions);
    }
    catch (error) {
        logger_1.logger.error('Error getting audit actions:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des actions d\'audit' });
    }
};
exports.getAuditActions = getAuditActions;
const cleanupOldLogs = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ message: 'Accès non autorisé' });
            return;
        }
        const { retentionDays = 365 } = req.body;
        await auditService_1.AuditService.cleanupOldLogs(parseInt(retentionDays));
        res.json({ message: 'Nettoyage des anciens logs effectué avec succès' });
    }
    catch (error) {
        logger_1.logger.error('Error cleaning up old logs:', error);
        res.status(500).json({ message: 'Erreur lors du nettoyage des anciens logs' });
    }
};
exports.cleanupOldLogs = cleanupOldLogs;
//# sourceMappingURL=auditController.js.map