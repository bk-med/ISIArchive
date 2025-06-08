import { PrismaClient, Commentaire, UserRole } from '@prisma/client';
import { logger } from '../config/logger';
import { DocumentService } from './documentService';

const prisma = new PrismaClient();

export interface CreateCommentData {
  contenu: string;
  documentId: string;
  userId: string;
  parentId?: string | null;
}

export interface UpdateCommentData {
  contenu?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export class CommentService {
  /**
   * Check if user can moderate comments for a document
   */
  static async canModerateComments(
    documentId: string,
    userId: string,
    userRole: UserRole,
    userFiliereId?: string,
    userNiveauId?: string
  ): Promise<boolean> {
    try {
      // Admins can always moderate
      if (userRole === 'admin') {
        return true;
      }

      // Get document with matiere information
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

      // For PFE documents, any professor can moderate
      if (document.categorie === 'pfe' && userRole === 'professeur') {
        return true;
      }

      // For regular documents, only the responsible professor can moderate
      if (document.matiere && document.matiere.professeurMatieres.length > 0) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error checking moderation permissions:', error);
      return false;
    }
  }

  /**
   * Get comments for a document with pagination
   */
  static async getDocumentComments(
    documentId: string,
    pagination: PaginationOptions = {},
    userId: string,
    userRole: UserRole,
    userFiliereId?: string,
    userNiveauId?: string
  ) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      // First check if user has access to the document
      const document = await DocumentService.getDocumentById(
        documentId,
        userId,
        userRole,
        userFiliereId,
        userNiveauId
      );

      if (!document) {
        throw new Error('Accès non autorisé à ce document');
      }

      // Get comments with nested replies (recursive)
      const [comments, total] = await Promise.all([
        prisma.commentaire.findMany({
          where: {
            documentId,
            parentId: null // Only get top-level comments
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
    } catch (error) {
      logger.error('Error getting document comments:', error);
      throw error;
    }
  }

  /**
   * Create a new comment
   */
  static async createComment(
    data: CreateCommentData,
    userId: string,
    userRole: UserRole,
    userFiliereId?: string,
    userNiveauId?: string
  ): Promise<Commentaire> {
    try {
      // Check if user has access to the document
      const document = await DocumentService.getDocumentById(
        data.documentId,
        userId,
        userRole,
        userFiliereId,
        userNiveauId
      );

      if (!document) {
        throw new Error('Accès non autorisé à ce document');
      }

      // If this is a reply, check reply permissions
      if (data.parentId) {
        const replyPermission = await this.canReplyToComment(
          data.parentId,
          userId,
          userRole
        );

        if (!replyPermission.canReply) {
          throw new Error(replyPermission.reason || 'Réponse non autorisée');
        }

        // Verify parent comment exists
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

      logger.info(`Comment created on document ${data.documentId} by user ${data.userId}`);
      return comment;
    } catch (error) {
      logger.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  static async updateComment(
    id: string,
    data: UpdateCommentData,
    userId: string,
    userRole: UserRole
  ): Promise<Commentaire> {
    try {
      // Check if comment exists and user has permission
      const existingComment = await prisma.commentaire.findFirst({
        where: {
          id,
          isDeleted: false
        }
      });

      if (!existingComment) {
        throw new Error('Commentaire non trouvé');
      }

      // Check permissions (owner or admin)
      if (userRole !== 'admin' && existingComment.userId !== userId) {
        throw new Error('Permissions insuffisantes');
      }

      const comment = await prisma.commentaire.update({
        where: { id },
        data: {
          ...(data.contenu && { contenu: data.contenu }),
          isEdited: true // Mark as edited when content is updated
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

      logger.info(`Comment updated: ${id} by user ${userId}`);
      return comment;
    } catch (error) {
      logger.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment (soft delete)
   */
  static async deleteComment(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    try {
      // Check if comment exists and user has permission
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

      // Check permissions (owner, admin, or moderator)
      const isOwner = existingComment.userId === userId;
      const isAdmin = userRole === 'admin';
      const canModerate = await this.canModerateComments(
        existingComment.documentId,
        userId,
        userRole
      );

      if (!isOwner && !isAdmin && !canModerate) {
        throw new Error('Permissions insuffisantes');
      }

      // Soft delete the comment and its replies
      await prisma.$transaction(async (tx) => {
        // Delete the main comment
        await tx.commentaire.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userId
          }
        });

        // Delete all replies to this comment
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

      logger.info(`Comment deleted: ${id} by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Get comment by ID
   */
  static async getCommentById(id: string): Promise<Commentaire | null> {
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
    } catch (error) {
      logger.error('Error getting comment by ID:', error);
      throw error;
    }
  }

  /**
   * Get comments count for a document
   */
  static async getDocumentCommentsCount(documentId: string): Promise<number> {
    try {
      const count = await prisma.commentaire.count({
        where: {
          documentId,
          isDeleted: false
        }
      });

      return count;
    } catch (error) {
      logger.error('Error getting document comments count:', error);
      throw error;
    }
  }

  /**
   * Check if user can reply to a specific comment based on conversation flow rules
   */
  static async canReplyToComment(
    parentCommentId: string,
    userId: string,
    userRole: UserRole
  ): Promise<{ canReply: boolean; reason?: string }> {
    try {
      // Professors and admins can reply to anyone
      if (userRole === 'professeur' || userRole === 'admin') {
        return { canReply: true };
      }

      // Get the parent comment with its thread
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

      // Students can only reply to professors or admins
      if (parentComment.user.role === 'etudiant') {
        return { 
          canReply: false, 
          reason: 'Les étudiants ne peuvent répondre qu\'aux professeurs et administrateurs' 
        };
      }

      // Check if student has already replied and is waiting for professor response
      const studentReplies = parentComment.replies.filter(reply => 
        reply.userId === userId && reply.user.role === 'etudiant'
      );

      if (studentReplies.length > 0) {
        // Check if there's a professor/admin reply after the last student reply
        const lastStudentReply = studentReplies[studentReplies.length - 1];
        const repliesAfterLastStudent = parentComment.replies.filter(reply => 
          new Date(reply.createdAt) > new Date(lastStudentReply.createdAt) &&
          (reply.user.role === 'professeur' || reply.user.role === 'admin')
        );

        if (repliesAfterLastStudent.length === 0) {
          return { 
            canReply: false, 
            reason: 'Vous devez attendre une réponse du professeur avant de pouvoir répondre à nouveau' 
          };
        }
      }

      return { canReply: true };
    } catch (error) {
      logger.error('Error checking reply permissions:', error);
      return { canReply: false, reason: 'Erreur lors de la vérification des permissions' };
    }
  }
} 