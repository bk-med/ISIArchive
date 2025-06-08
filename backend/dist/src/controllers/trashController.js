"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrashStats = exports.permanentlyDeleteDocument = exports.getDocumentsExpiringSoon = exports.restoreDocument = exports.getDeletedDocuments = void 0;
const documentService_1 = require("../services/documentService");
const logger_1 = require("../config/logger");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const convertBigIntToString = (obj) => {
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
        const converted = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                converted[key] = convertBigIntToString(obj[key]);
            }
        }
        return converted;
    }
    return obj;
};
const getDeletedDocuments = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { page = 1, limit = 20 } = req.query;
        const result = await documentService_1.DocumentService.getDeletedDocuments(userId, userRole, {
            page: parseInt(page),
            limit: parseInt(limit)
        });
        const convertedResult = convertBigIntToString(result);
        await (0, auditMiddleware_1.logAuditEvent)(userId, 'PAGE_ACCESS', 'trash', undefined, {
            page: 'corbeille',
            url: req.originalUrl,
            method: req.method
        }, req);
        res.json(convertedResult);
    }
    catch (error) {
        logger_1.logger.error('Error getting deleted documents:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des documents supprimés' });
    }
};
exports.getDeletedDocuments = getDeletedDocuments;
const restoreDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        const restoredDocument = await documentService_1.DocumentService.restoreDocument(id, userId, userRole);
        await (0, auditMiddleware_1.logAuditEvent)(userId, 'DOCUMENT_RESTORE', 'document', id, {
            documentTitle: restoredDocument.titre,
            action: 'restore'
        }, req);
        const convertedDocument = convertBigIntToString(restoredDocument);
        res.json({
            message: 'Document restauré avec succès',
            document: convertedDocument
        });
    }
    catch (error) {
        logger_1.logger.error('Error restoring document:', error);
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
exports.restoreDocument = restoreDocument;
const getDocumentsExpiringSoon = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const documents = await documentService_1.DocumentService.getDocumentsExpiringSoon(userId, userRole);
        const convertedDocuments = convertBigIntToString(documents);
        res.json(convertedDocuments);
    }
    catch (error) {
        logger_1.logger.error('Error getting documents expiring soon:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des documents expirant bientôt' });
    }
};
exports.getDocumentsExpiringSoon = getDocumentsExpiringSoon;
const permanentlyDeleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'admin') {
            res.status(403).json({ message: 'Accès non autorisé' });
            return;
        }
        const document = await documentService_1.DocumentService.getDocumentById(id, userId, userRole);
        if (!document || !document.isDeleted) {
            res.status(404).json({ message: 'Document supprimé non trouvé' });
            return;
        }
        res.json({ message: 'Suppression permanente non encore implémentée' });
    }
    catch (error) {
        logger_1.logger.error('Error permanently deleting document:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression permanente du document' });
    }
};
exports.permanentlyDeleteDocument = permanentlyDeleteDocument;
const getTrashStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const result = await documentService_1.DocumentService.getDeletedDocuments(userId, userRole, { limit: 1000 });
        const documents = result.documents;
        const totalDeleted = documents.length;
        const expiringSoon = documents.filter(doc => {
            if (!doc.deletedAt)
                return false;
            const daysLeft = Math.ceil((new Date(doc.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            return daysLeft <= 7;
        }).length;
        const byCategory = documents.reduce((acc, doc) => {
            acc[doc.categorie] = (acc[doc.categorie] || 0) + 1;
            return acc;
        }, {});
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentDeletions = documents.filter(doc => doc.deletedAt && new Date(doc.deletedAt) >= sevenDaysAgo).length;
        res.json({
            totalDeleted,
            expiringSoon,
            recentDeletions,
            byCategory
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting trash stats:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques de la corbeille' });
    }
};
exports.getTrashStats = getTrashStats;
//# sourceMappingURL=trashController.js.map