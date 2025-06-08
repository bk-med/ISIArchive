"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
const documentService_1 = require("./documentService");
const prisma = new client_1.PrismaClient();
class CommentService {
    static async canModerateComments(documentId, userId, userRole, userFiliereId, userNiveauId) {
        try {
            if (userRole === 'admin') {
                return true;
            }
            const document = await prisma.document.findFirst({
                where: { id: documentId },
                include: {
                    matiere: {
                        include: {
                            professeurMatieres: {
                                where: { professeurId: userId }
                            }
                        }
                    }
                }
            });
            if (!document) {
                return false;
            }
            if (document.categorie === 'pfe' && userRole === 'professeur') {
                return true;
            }
            if (document.matiere && document.matiere.professeurMatieres.length > 0) {
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('Error checking moderation permissions:', error);
            return false;
        }
    }
    static async getDocumentComments(documentId, pagination = {}, userId, userRole, userFiliereId, userNiveauId) {
        try {
            const { page = 1, limit = 20 } = pagination;
            const skip = (page - 1) * limit;
            const document = await documentService_1.DocumentService.getDocumentById(documentId, userId, userRole, userFiliereId, userNiveauId);
            if (!document) {
                throw new Error('Accès non autorisé à ce document');
            }
            const [comments, total] = await Promise.all([
                prisma.commentaire.findMany({
                    where: {
                        documentId,
                        parentId: null
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                prenom: true,
                                nom: true,
                                role: true
                            }
                        },
                        replies: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        prenom: true,
                                        nom: true,
                                        role: true
                                    }
                                },
                                replies: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                prenom: true,
                                                nom: true,
                                                role: true
                                            }
                                        },
                                        replies: {
                                            include: {
                                                user: {
                                                    select: {
                                                        id: true,
                                                        prenom: true,
                                                        nom: true,
                                                        role: true
                                                    }
                                                },
                                                replies: {
                                                    include: {
                                                        user: {
                                                            select: {
                                                                id: true,
                                                                prenom: true,
                                                                nom: true,
                                                                role: true
                                                            }
                                                        }
                                                    },
                                                    orderBy: {
                                                        createdAt: 'asc'
                                                    }
                                                }
                                            },
                                            orderBy: {
                                                createdAt: 'asc'
                                            }
                                        }
                                    },
                                    orderBy: {
                                        createdAt: 'asc'
                                    }
                                }
                            },
                            orderBy: {
                                createdAt: 'asc'
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    skip,
                    take: limit
                }),
                prisma.commentaire.count({
                    where: {
                        documentId,
                        parentId: null
                    }
                })
            ]);
            return {
                comments,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting document comments:', error);
            throw error;
        }
    }
    static async createComment(data, userId, userRole, userFiliereId, userNiveauId) {
        try {
            const document = await documentService_1.DocumentService.getDocumentById(data.documentId, userId, userRole, userFiliereId, userNiveauId);
            if (!document) {
                throw new Error('Accès non autorisé à ce document');
            }
            if (data.parentId) {
                const replyPermission = await this.canReplyToComment(data.parentId, userId, userRole);
                if (!replyPermission.canReply) {
                    throw new Error(replyPermission.reason || 'Réponse non autorisée');
                }
                const parentComment = await prisma.commentaire.findFirst({
                    where: {
                        id: data.parentId,
                        documentId: data.documentId,
                        isDeleted: false
                    }
                });
                if (!parentComment) {
                    throw new Error('Commentaire parent non trouvé');
                }
            }
            const comment = await prisma.commentaire.create({
                data: {
                    contenu: data.contenu,
                    documentId: data.documentId,
                    userId: data.userId,
                    parentId: data.parentId
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            prenom: true,
                            nom: true,
                            role: true
                        }
                    }
                }
            });
            logger_1.logger.info(`Comment created on document ${data.documentId} by user ${data.userId}`);
            return comment;
        }
        catch (error) {
            logger_1.logger.error('Error creating comment:', error);
            throw error;
        }
    }
    static async updateComment(id, data, userId, userRole) {
        try {
            const existingComment = await prisma.commentaire.findFirst({
                where: {
                    id,
                    isDeleted: false
                }
            });
            if (!existingComment) {
                throw new Error('Commentaire non trouvé');
            }
            if (userRole !== 'admin' && existingComment.userId !== userId) {
                throw new Error('Permissions insuffisantes');
            }
            const comment = await prisma.commentaire.update({
                where: { id },
                data: {
                    ...(data.contenu && { contenu: data.contenu }),
                    isEdited: true
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            prenom: true,
                            nom: true,
                            role: true
                        }
                    }
                }
            });
            logger_1.logger.info(`Comment updated: ${id} by user ${userId}`);
            return comment;
        }
        catch (error) {
            logger_1.logger.error('Error updating comment:', error);
            throw error;
        }
    }
    static async deleteComment(id, userId, userRole) {
        try {
            const existingComment = await prisma.commentaire.findFirst({
                where: {
                    id,
                    isDeleted: false
                },
                include: {
                    document: true
                }
            });
            if (!existingComment) {
                throw new Error('Commentaire non trouvé');
            }
            const isOwner = existingComment.userId === userId;
            const isAdmin = userRole === 'admin';
            const canModerate = await this.canModerateComments(existingComment.documentId, userId, userRole);
            if (!isOwner && !isAdmin && !canModerate) {
                throw new Error('Permissions insuffisantes');
            }
            await prisma.$transaction(async (tx) => {
                await tx.commentaire.update({
                    where: { id },
                    data: {
                        isDeleted: true,
                        deletedAt: new Date(),
                        deletedBy: userId
                    }
                });
                await tx.commentaire.updateMany({
                    where: {
                        parentId: id,
                        isDeleted: false
                    },
                    data: {
                        isDeleted: true,
                        deletedAt: new Date(),
                        deletedBy: userId
                    }
                });
            });
            logger_1.logger.info(`Comment deleted: ${id} by user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Error deleting comment:', error);
            throw error;
        }
    }
    static async getCommentById(id) {
        try {
            const comment = await prisma.commentaire.findFirst({
                where: {
                    id,
                    isDeleted: false
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            prenom: true,
                            nom: true,
                            role: true
                        }
                    },
                    document: {
                        select: {
                            id: true,
                            titre: true
                        }
                    }
                }
            });
            return comment;
        }
        catch (error) {
            logger_1.logger.error('Error getting comment by ID:', error);
            throw error;
        }
    }
    static async getDocumentCommentsCount(documentId) {
        try {
            const count = await prisma.commentaire.count({
                where: {
                    documentId,
                    isDeleted: false
                }
            });
            return count;
        }
        catch (error) {
            logger_1.logger.error('Error getting document comments count:', error);
            throw error;
        }
    }
    static async canReplyToComment(parentCommentId, userId, userRole) {
        try {
            if (userRole === 'professeur' || userRole === 'admin') {
                return { canReply: true };
            }
            const parentComment = await prisma.commentaire.findFirst({
                where: {
                    id: parentCommentId,
                    isDeleted: false
                },
                include: {
                    user: true,
                    replies: {
                        where: {
                            isDeleted: false
                        },
                        include: {
                            user: true
                        },
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                }
            });
            if (!parentComment) {
                return { canReply: false, reason: 'Commentaire parent non trouvé' };
            }
            if (parentComment.user.role === 'etudiant') {
                return {
                    canReply: false,
                    reason: 'Les étudiants ne peuvent répondre qu\'aux professeurs et administrateurs'
                };
            }
            const studentReplies = parentComment.replies.filter(reply => reply.userId === userId && reply.user.role === 'etudiant');
            if (studentReplies.length > 0) {
                const lastStudentReply = studentReplies[studentReplies.length - 1];
                const repliesAfterLastStudent = parentComment.replies.filter(reply => new Date(reply.createdAt) > new Date(lastStudentReply.createdAt) &&
                    (reply.user.role === 'professeur' || reply.user.role === 'admin'));
                if (repliesAfterLastStudent.length === 0) {
                    return {
                        canReply: false,
                        reason: 'Vous devez attendre une réponse du professeur avant de pouvoir répondre à nouveau'
                    };
                }
            }
            return { canReply: true };
        }
        catch (error) {
            logger_1.logger.error('Error checking reply permissions:', error);
            return { canReply: false, reason: 'Erreur lors de la vérification des permissions' };
        }
    }
}
exports.CommentService = CommentService;
//# sourceMappingURL=commentService.js.map