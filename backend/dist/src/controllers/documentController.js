"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const documentService_1 = require("../services/documentService");
const logger_1 = require("../config/logger");
const upload_1 = require("../middleware/upload");
const bigint_1 = require("../utils/bigint");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const fs_1 = __importDefault(require("fs"));
class DocumentController {
    static async uploadDocument(req, res) {
        try {
            const { titre, description, categorie, matiereId, matiereIds } = req.body;
            const file = req.file;
            const userId = req.user.id;
            if (!file) {
                res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'Aucun fichier fourni'
                });
                return;
            }
            if (!titre || !categorie) {
                (0, upload_1.cleanupUploadedFile)(file.path);
                res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'Titre et catégorie sont requis'
                });
                return;
            }
            let parsedMatiereIds = [];
            if (matiereIds) {
                try {
                    parsedMatiereIds = typeof matiereIds === 'string' ? JSON.parse(matiereIds) : matiereIds;
                }
                catch (error) {
                    (0, upload_1.cleanupUploadedFile)(file.path);
                    res.status(400).json({
                        success: false,
                        error: 'Bad Request',
                        message: 'Format des IDs de matières invalide'
                    });
                    return;
                }
            }
            if (categorie !== 'pfe' && !matiereId && (!parsedMatiereIds || parsedMatiereIds.length === 0)) {
                (0, upload_1.cleanupUploadedFile)(file.path);
                res.status(400).json({
                    success: false,
                    error: 'Bad Request',
                    message: 'Au moins une matière est requise pour les documents non-PFE'
                });
                return;
            }
            if (req.user.role === 'professeur') {
                const matieresToCheck = parsedMatiereIds.length > 0 ? parsedMatiereIds : (matiereId ? [matiereId] : []);
                for (const matId of matieresToCheck) {
                    const assignment = await documentService_1.DocumentService.checkProfessorMatiereAssignment(userId, matId);
                    if (!assignment) {
                        (0, upload_1.cleanupUploadedFile)(file.path);
                        res.status(403).json({
                            success: false,
                            error: 'Forbidden',
                            message: 'Vous n\'êtes pas assigné à une ou plusieurs matières sélectionnées'
                        });
                        return;
                    }
                }
            }
            const fileInfo = (0, upload_1.getFileInfo)(file);
            const documentData = {
                titre,
                description,
                categorie,
                matiereId: categorie === 'pfe' ? null : matiereId,
                matiereIds: categorie === 'pfe' ? undefined : parsedMatiereIds,
                telchargePar: userId,
                cheminFichier: fileInfo.path,
                nomFichier: fileInfo.originalName,
                tailleFichier: fileInfo.size,
                typeMime: fileInfo.mimeType
            };
            const document = await documentService_1.DocumentService.createDocument(documentData);
            await (0, auditMiddleware_1.logAuditEvent)(userId, 'DOCUMENT_UPLOAD', 'document', document.id, {
                documentTitle: document.titre,
                categorie: document.categorie,
                matiereId: document.matiereId,
                matiereIds: parsedMatiereIds,
                fileName: fileInfo.originalName,
                fileSize: fileInfo.size
            }, req);
            res.status(201).json({
                success: true,
                message: 'Document téléchargé avec succès',
                data: (0, bigint_1.prepareDocumentForResponse)(document)
            });
        }
        catch (error) {
            if (req.file) {
                (0, upload_1.cleanupUploadedFile)(req.file.path);
            }
            logger_1.logger.error('Error uploading document:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors du téléchargement du document'
            });
        }
    }
    static async uploadPFEDocument(req, res) {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: 'Validation Error',
                    message: 'Aucun fichier fourni'
                });
                return;
            }
            const fileInfo = (0, upload_1.getFileInfo)(req.file);
            const { titre, description, anneeDiplome, filiereDiplome, titreProjet, resume, motsCles } = req.body;
            const pfeData = {
                titre,
                description,
                categorie: 'pfe',
                telchargePar: req.user.id,
                cheminFichier: req.file.path,
                nomFichier: fileInfo.originalName,
                tailleFichier: fileInfo.size,
                typeMime: fileInfo.mimeType,
                anneeDiplome: parseInt(anneeDiplome),
                filiereDiplome,
                titreProjet,
                resume,
                motsCles: motsCles ? motsCles.split(',').map((tag) => tag.trim()) : []
            };
            const document = await documentService_1.DocumentService.createPFEDocument(pfeData);
            res.status(201).json({
                success: true,
                message: 'Document PFE téléchargé avec succès',
                data: (0, bigint_1.prepareDocumentForResponse)(document)
            });
        }
        catch (error) {
            logger_1.logger.error('Error uploading PFE document:', error);
            if (req.file) {
                (0, upload_1.cleanupUploadedFile)(req.file.path);
            }
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    error: 'Upload Error',
                    message: error.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Internal Server Error',
                    message: 'Erreur lors du téléchargement du document PFE'
                });
            }
        }
    }
    static async getDocuments(req, res) {
        try {
            const { page = 1, limit = 20, matiereId, categorie, search } = req.query;
            const user = req.user;
            const filters = {
                matiereId: matiereId,
                categorie: categorie,
                search: search,
                userId: user.id,
                userRole: user.role,
                userFiliereId: user.filiereId,
                userNiveauId: user.niveauId
            };
            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit)
            };
            const result = await documentService_1.DocumentService.getDocuments(filters, pagination);
            await (0, auditMiddleware_1.logAuditEvent)(user.id, 'PAGE_ACCESS', 'documents', undefined, {
                page: 'documents',
                filters: {
                    matiereId,
                    categorie,
                    search
                },
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit
                }
            }, req);
            res.status(200).json({
                success: true,
                message: 'Documents récupérés avec succès',
                data: (0, bigint_1.prepareDocumentsForResponse)(result.documents),
                pagination: result.pagination
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting documents:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la récupération des documents'
            });
        }
    }
    static async getDocumentById(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const document = await documentService_1.DocumentService.getDocumentById(id, user.id, user.role, user.filiereId, user.niveauId);
            if (!document) {
                res.status(404).json({
                    success: false,
                    error: 'Not Found',
                    message: 'Document non trouvé'
                });
                return;
            }
            await documentService_1.DocumentService.incrementViewCount(id);
            await (0, auditMiddleware_1.logAuditEvent)(user.id, 'DOCUMENT_VIEW', 'document', id, {
                documentTitle: document.titre,
                categorie: document.categorie
            }, req);
            res.status(200).json({
                success: true,
                message: 'Document récupéré avec succès',
                data: (0, bigint_1.prepareDocumentForResponse)(document)
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting document by ID:', error);
            if (error instanceof Error && error.message === 'Accès non autorisé à ce document') {
                res.status(403).json({
                    success: false,
                    error: 'Forbidden',
                    message: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la récupération du document'
            });
        }
    }
    static async updateDocument(req, res) {
        try {
            const { id } = req.params;
            const { titre, description, categorie, matiereId } = req.body;
            const user = req.user;
            const updateData = {
                ...(titre && { titre }),
                ...(description !== undefined && { description }),
                ...(categorie && { categorie }),
                ...(matiereId !== undefined && { matiereId })
            };
            const document = await documentService_1.DocumentService.updateDocument(id, updateData, user.id, user.role);
            res.status(200).json({
                success: true,
                message: 'Document mis à jour avec succès',
                data: (0, bigint_1.prepareDocumentForResponse)(document)
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating document:', error);
            if (error instanceof Error) {
                if (error.message === 'Document non trouvé') {
                    res.status(404).json({
                        success: false,
                        error: 'Not Found',
                        message: error.message
                    });
                    return;
                }
                if (error.message === 'Permissions insuffisantes') {
                    res.status(403).json({
                        success: false,
                        error: 'Forbidden',
                        message: error.message
                    });
                    return;
                }
            }
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la mise à jour du document'
            });
        }
    }
    static async deleteDocument(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            await documentService_1.DocumentService.deleteDocument(id, user.id, user.role);
            res.status(200).json({
                success: true,
                message: 'Document supprimé avec succès'
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting document:', error);
            if (error instanceof Error) {
                if (error.message === 'Document non trouvé') {
                    res.status(404).json({
                        success: false,
                        error: 'Not Found',
                        message: error.message
                    });
                    return;
                }
                if (error.message === 'Permissions insuffisantes') {
                    res.status(403).json({
                        success: false,
                        error: 'Forbidden',
                        message: error.message
                    });
                    return;
                }
            }
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la suppression du document'
            });
        }
    }
    static async downloadDocument(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const filePath = await documentService_1.DocumentService.getDocumentFilePath(id, user.id, user.role, user.filiereId, user.niveauId);
            const document = await documentService_1.DocumentService.getDocumentById(id, user.id, user.role, user.filiereId, user.niveauId);
            if (!document) {
                res.status(404).json({
                    success: false,
                    error: 'Not Found',
                    message: 'Document non trouvé'
                });
                return;
            }
            const encodedFilename = encodeURIComponent(document.nomFichier);
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
            res.setHeader('Content-Type', document.typeMime);
            res.setHeader('Content-Length', document.tailleFichier.toString());
            const fileStream = fs_1.default.createReadStream(filePath);
            fileStream.pipe(res);
            fileStream.on('error', (error) => {
                logger_1.logger.error('Error streaming file:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        error: 'Internal Server Error',
                        message: 'Erreur lors du téléchargement du fichier'
                    });
                }
            });
            fileStream.on('open', async () => {
                try {
                    await documentService_1.DocumentService.incrementDownloadCount(id);
                    await (0, auditMiddleware_1.logAuditEvent)(user.id, 'DOCUMENT_DOWNLOAD', 'document', id, {
                        documentTitle: document.titre,
                        fileName: document.nomFichier,
                        fileSize: document.tailleFichier.toString()
                    }, req);
                }
                catch (error) {
                    logger_1.logger.error('Error incrementing download count:', error);
                }
            });
            logger_1.logger.info(`Document downloaded: ${document.titre} by user ${user.id}`);
        }
        catch (error) {
            logger_1.logger.error('Error downloading document:', error);
            if (error instanceof Error) {
                if (error.message === 'Document non trouvé' || error.message === 'Fichier non trouvé sur le serveur') {
                    res.status(404).json({
                        success: false,
                        error: 'Not Found',
                        message: error.message
                    });
                    return;
                }
                if (error.message === 'Accès non autorisé à ce document') {
                    res.status(403).json({
                        success: false,
                        error: 'Forbidden',
                        message: error.message
                    });
                    return;
                }
            }
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors du téléchargement du document'
            });
        }
    }
    static async getDocumentsByProfessor(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const user = req.user;
            if (user.role !== 'admin' && user.id !== id) {
                res.status(403).json({
                    success: false,
                    error: 'Forbidden',
                    message: 'Permissions insuffisantes'
                });
                return;
            }
            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit)
            };
            const result = await documentService_1.DocumentService.getDocumentsByProfessor(id, pagination);
            res.status(200).json({
                success: true,
                message: 'Documents du professeur récupérés avec succès',
                data: (0, bigint_1.prepareDocumentsForResponse)(result.documents),
                pagination: result.pagination
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting documents by professor:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la récupération des documents du professeur'
            });
        }
    }
    static async getPFEDocuments(req, res) {
        try {
            const { page = 1, limit = 20, search } = req.query;
            const user = req.user;
            if (user.role === 'etudiant') {
                const canAccessPFE = await documentService_1.DocumentService.canAccessPFEDocuments(user.niveauId);
                if (!canAccessPFE) {
                    res.status(403).json({
                        success: false,
                        error: 'Forbidden',
                        message: 'Accès aux documents PFE réservé aux étudiants en semestre terminal'
                    });
                    return;
                }
            }
            const filters = {
                categorie: 'pfe',
                search: search,
                userId: user.id,
                userRole: user.role,
                userFiliereId: user.filiereId,
                userNiveauId: user.niveauId
            };
            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit)
            };
            const result = await documentService_1.DocumentService.getDocuments(filters, pagination);
            res.status(200).json({
                success: true,
                message: 'Documents PFE récupérés avec succès',
                data: (0, bigint_1.prepareDocumentsForResponse)(result.documents),
                pagination: result.pagination
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting PFE documents:', error);
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la récupération des documents PFE'
            });
        }
    }
    static async uploadCorrection(req, res) {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: 'Validation Error',
                    message: 'Aucun fichier fourni'
                });
                return;
            }
            const { parentDocumentId } = req.params;
            const fileInfo = (0, upload_1.getFileInfo)(req.file);
            const { titre, description } = req.body;
            const correctionData = {
                titre,
                description,
                categorie: req.body.categorie || 'cours',
                telchargePar: req.user.id,
                cheminFichier: req.file.path,
                nomFichier: fileInfo.originalName,
                tailleFichier: fileInfo.size,
                typeMime: fileInfo.mimeType
            };
            const document = await documentService_1.DocumentService.createCorrection(parentDocumentId, correctionData);
            res.status(201).json({
                success: true,
                message: 'Correction téléchargée avec succès',
                data: (0, bigint_1.prepareDocumentForResponse)(document)
            });
        }
        catch (error) {
            logger_1.logger.error('Error uploading correction:', error);
            if (req.file) {
                (0, upload_1.cleanupUploadedFile)(req.file.path);
            }
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    error: 'Upload Error',
                    message: error.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Internal Server Error',
                    message: 'Erreur lors du téléchargement de la correction'
                });
            }
        }
    }
}
exports.DocumentController = DocumentController;
//# sourceMappingURL=documentController.js.map