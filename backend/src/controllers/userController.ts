import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { logger } from '../config/logger';
import { CreateUserRequest, UpdateUserRequest } from '../types/auth';

export class UserController {
  /**
   * Create a new user (Admin only)
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const userData: CreateUserRequest = req.body;
      const newUser = await UserService.createUser(userData, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: { user: newUser }
      });
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(400).json({
        success: false,
        error: 'User Creation Failed',
        message: error instanceof Error ? error.message : 'Erreur de création d\'utilisateur'
      });
    }
  }

  /**
   * Get all users with pagination and filtering (Admin only)
   */
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, role, isActive } = req.query;

      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        role: role as any,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      };

      const result = await UserService.getUsers(options);

      res.status(200).json({
        success: true,
        message: 'Utilisateurs récupérés avec succès',
        data: result
      });
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Users Fetch Failed',
        message: error instanceof Error ? error.message : 'Erreur de récupération des utilisateurs'
      });
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User Not Found',
          message: 'Utilisateur non trouvé'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Utilisateur récupéré avec succès',
        data: { user }
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'User Fetch Failed',
        message: error instanceof Error ? error.message : 'Erreur de récupération de l\'utilisateur'
      });
    }
  }

  /**
   * Update user
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = req.params;
      const updateData: UpdateUserRequest = req.body;

      const updatedUser = await UserService.updateUser(id, updateData, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        data: { user: updatedUser }
      });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(400).json({
        success: false,
        error: 'User Update Failed',
        message: error instanceof Error ? error.message : 'Erreur de mise à jour de l\'utilisateur'
      });
    }
  }

  /**
   * Delete user (Admin only)
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user.id) {
        res.status(400).json({
          success: false,
          error: 'Self Deletion Not Allowed',
          message: 'Vous ne pouvez pas supprimer votre propre compte'
        });
        return;
      }

      await UserService.deleteUser(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Utilisateur supprimé avec succès'
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(400).json({
        success: false,
        error: 'User Deletion Failed',
        message: error instanceof Error ? error.message : 'Erreur de suppression de l\'utilisateur'
      });
    }
  }

  /**
   * Get user statistics (Admin only)
   */
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await UserService.getUserStats();

      res.status(200).json({
        success: true,
        message: 'Statistiques récupérées avec succès',
        data: { stats }
      });
    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Stats Fetch Failed',
        message: error instanceof Error ? error.message : 'Erreur de récupération des statistiques'
      });
    }
  }

  /**
   * Toggle user active status (Admin only)
   */
  static async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { id } = req.params;

      // Prevent self-deactivation
      if (id === req.user.id) {
        res.status(400).json({
          success: false,
          error: 'Self Deactivation Not Allowed',
          message: 'Vous ne pouvez pas désactiver votre propre compte'
        });
        return;
      }

      // Get current user to toggle status
      const currentUser = await UserService.getUserById(id);
      if (!currentUser) {
        res.status(404).json({
          success: false,
          error: 'User Not Found',
          message: 'Utilisateur non trouvé'
        });
        return;
      }

      const updatedUser = await UserService.updateUser(
        id,
        { isActive: !currentUser.isActive },
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: `Utilisateur ${updatedUser.isActive ? 'activé' : 'désactivé'} avec succès`,
        data: { user: updatedUser }
      });
    } catch (error) {
      logger.error('Toggle user status error:', error);
      res.status(400).json({
        success: false,
        error: 'Status Toggle Failed',
        message: error instanceof Error ? error.message : 'Erreur de changement de statut'
      });
    }
  }

  /**
   * Bulk update users (Admin only)
   */
  static async bulkUpdateUsers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { userIds, updateData } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid Input',
          message: 'Liste d\'IDs utilisateur requise'
        });
        return;
      }

      // Prevent self-modification in bulk operations
      if (userIds.includes(req.user.id)) {
        res.status(400).json({
          success: false,
          error: 'Self Modification Not Allowed',
          message: 'Vous ne pouvez pas vous inclure dans une opération en lot'
        });
        return;
      }

      const results = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          const updatedUser = await UserService.updateUser(userId, updateData, req.user.id);
          results.push(updatedUser);
        } catch (error) {
          errors.push({
            userId,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `${results.length} utilisateur(s) mis à jour avec succès`,
        data: {
          updated: results,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } catch (error) {
      logger.error('Bulk update users error:', error);
      res.status(500).json({
        success: false,
        error: 'Bulk Update Failed',
        message: error instanceof Error ? error.message : 'Erreur de mise à jour en lot'
      });
    }
  }
} 