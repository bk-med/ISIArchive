"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentController = void 0;
const commentService_1 = require("../services/commentService");
const logger_1 = require("../config/logger");
class CommentController {
    static async getDocumentComments(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const user = req.user;
            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit)
            };
            const [result, canModerate] = await Promise.all([
                commentService_1.CommentService.getDocumentComments(id, pagination, user.id, user.role, user.filiereId, user.niveauId),
                commentService_1.CommentService.canModerateComments(id, user.id, user.role, user.filiereId, user.niveauId)
            ]);
            res.status(200).json({
                success: true,
                message: 'Commentaires récupérés avec succès',
                data: result.comments,
                pagination: result.pagination,
                canModerate
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting document comments:', error);
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
                message: 'Erreur lors de la récupération des commentaires'
            });
        }
    }
    static async createComment(req, res) {
        try {
            const { id } = req.params;
            const { contenu, parentId } = req.body;
            const user = req.user;
            const commentData = {
                contenu,
                documentId: id,
                userId: user.id,
                parentId: parentId || null
            };
            const comment = await commentService_1.CommentService.createComment(commentData, user.id, user.role, user.filiereId, user.niveauId);
            res.status(201).json({
                success: true,
                message: 'Commentaire créé avec succès',
                data: comment
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating comment:', error);
            if (error instanceof Error) {
                if (error.message === 'Accès non autorisé à ce document') {
                    res.status(403).json({
                        success: false,
                        error: 'Forbidden',
                        message: error.message
                    });
                    return;
                }
                if (error.message === 'Document non trouvé') {
                    res.status(404).json({
                        success: false,
                        error: 'Not Found',
                        message: error.message
                    });
                    return;
                }
                if (error.message === 'Commentaire parent non trouvé') {
                    res.status(400).json({
                        success: false,
                        error: 'Bad Request',
                        message: error.message
                    });
                    return;
                }
            }
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Erreur lors de la création du commentaire'
            });
        }
    }
    static async updateComment(req, res) {
        try {
            const { id } = req.params;
            const { contenu } = req.body;
            const user = req.user;
            const comment = await commentService_1.CommentService.updateComment(id, { contenu }, user.id, user.role);
            res.status(200).json({
                success: true,
                message: 'Commentaire mis à jour avec succès',
                data: comment
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating comment:', error);
            if (error instanceof Error) {
                if (error.message === 'Commentaire non trouvé') {
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
                message: 'Erreur lors de la mise à jour du commentaire'
            });
        }
    }
    static async deleteComment(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            await commentService_1.CommentService.deleteComment(id, user.id, user.role);
            res.status(200).json({
                success: true,
                message: 'Commentaire supprimé avec succès'
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting comment:', error);
            if (error instanceof Error) {
                if (error.message === 'Commentaire non trouvé') {
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
                message: 'Erreur lors de la suppression du commentaire'
            });
        }
    }
    static async checkReplyPermission(req, res) {
        try {
            const { id: commentId } = req.params;
            const user = req.user;
            const permission = await commentService_1.CommentService.canReplyToComment(commentId, user.id, user.role);
            res.status(200).json({
                success: true,
                message: permission.canReply ? 'Réponse autorisée' : 'Réponse non autorisée',
                data: permission
            });
        }
        catch (error) {
            logger_1.logger.error('Error checking reply permission:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification des permissions de réponse'
            });
        }
    }
}
exports.CommentController = CommentController;
//# sourceMappingURL=commentController.js.map