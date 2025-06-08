import { Request, Response } from 'express';
import { CommentService, CreateCommentData } from '../services/commentService';
import { logger } from '../config/logger';

export class CommentController {
  /**
   * Get comments for a document
   */
  static async getDocumentComments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const user = req.user!;

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const [result, canModerate] = await Promise.all([
        CommentService.getDocumentComments(
          id,
          pagination,
          user.id,
          user.role,
          user.filiereId,
          user.niveauId
        ),
        CommentService.canModerateComments(
          id,
          user.id,
          user.role,
          user.filiereId,
          user.niveauId
        )
      ]);

      res.status(200).json({
        success: true,
        message: 'Commentaires récupérés avec succès',
        data: result.comments,
        pagination: result.pagination,
        canModerate
      });
    } catch (error) {
      logger.error('Error getting document comments:', error);
      
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

  /**
   * Create a new comment
   */
  static async createComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { contenu, parentId } = req.body;
      const user = req.user!;

      const commentData: CreateCommentData = {
        contenu,
        documentId: id,
        userId: user.id,
        parentId: parentId || null
      };

      const comment = await CommentService.createComment(
        commentData,
        user.id,
        user.role,
        user.filiereId,
        user.niveauId
      );

      res.status(201).json({
        success: true,
        message: 'Commentaire créé avec succès',
        data: comment
      });
    } catch (error) {
      logger.error('Error creating comment:', error);
      
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

  /**
   * Update a comment
   */
  static async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { contenu } = req.body;
      const user = req.user!;

      const comment = await CommentService.updateComment(
        id,
        { contenu },
        user.id,
        user.role
      );

      res.status(200).json({
        success: true,
        message: 'Commentaire mis à jour avec succès',
        data: comment
      });
    } catch (error) {
      logger.error('Error updating comment:', error);
      
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

  /**
   * Delete a comment
   */
  static async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      await CommentService.deleteComment(id, user.id, user.role);

      res.status(200).json({
        success: true,
        message: 'Commentaire supprimé avec succès'
      });
    } catch (error) {
      logger.error('Error deleting comment:', error);
      
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

  /**
   * Check if user can reply to a comment
   */
  static async checkReplyPermission(req: Request, res: Response): Promise<void> {
    try {
      const { id: commentId } = req.params;
      const user = req.user!;

      const permission = await CommentService.canReplyToComment(
        commentId,
        user.id,
        user.role
      );

      res.status(200).json({
        success: true,
        message: permission.canReply ? 'Réponse autorisée' : 'Réponse non autorisée',
        data: permission
      });
    } catch (error) {
      logger.error('Error checking reply permission:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions de réponse'
      });
    }
  }
} 