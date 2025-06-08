import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
import { logger } from '../config/logger';
import { LoginRequest, RefreshTokenRequest, ChangePasswordRequest } from '../types/auth';
import { logAuditEvent } from '../middleware/auditMiddleware';

export class AuthController {
  /**
   * Login user
   */
  static async login(req: Request, res: Response) {
    try {
      const loginData: LoginRequest = req.body;
      const result = await AuthService.login(loginData);

      // Log successful login
      await logAuditEvent(
        result.user.id,
        'LOGIN',
        'auth',
        undefined,
        {
          email: loginData.email,
          userRole: result.user.role,
          loginTime: new Date().toISOString()
        },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        data: result
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: 'Authentication Failed',
        message: error instanceof Error ? error.message : 'Erreur de connexion'
      });
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'L\'email est requis'
        });
        return;
      }

      await AuthService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation'
      });
    } catch (error) {
      logger.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        error: 'Password Reset Request Failed',
        message: error instanceof Error ? error.message : 'Erreur lors de la demande de réinitialisation'
      });
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Le token et le nouveau mot de passe sont requis'
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Le mot de passe doit contenir au moins 6 caractères'
        });
        return;
      }

      await AuthService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
      });
    } catch (error) {
      logger.error('Password reset error:', error);
      res.status(400).json({
        success: false,
        error: 'Password Reset Failed',
        message: error instanceof Error ? error.message : 'Erreur lors de la réinitialisation du mot de passe'
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshData: RefreshTokenRequest = req.body;
      const result = await AuthService.refreshToken(refreshData);

      res.status(200).json({
        success: true,
        message: 'Token rafraîchi avec succès',
        data: result
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: 'Token Refresh Failed',
        message: error instanceof Error ? error.message : 'Erreur de rafraîchissement du token'
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      await AuthService.logout(req.user.id);

      // Log successful logout
      await logAuditEvent(
        req.user.id,
        'LOGOUT',
        'auth',
        undefined,
        {
          logoutTime: new Date().toISOString()
        },
        req
      );

      res.status(200).json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout Failed',
        message: error instanceof Error ? error.message : 'Erreur de déconnexion'
      });
    }
  }

  /**
   * Logout from all devices
   */
  static async logoutAllDevices(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      await AuthService.logoutAllDevices(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Déconnexion de tous les appareils réussie'
      });
    } catch (error) {
      logger.error('Logout all devices error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout Failed',
        message: error instanceof Error ? error.message : 'Erreur de déconnexion'
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const user = await UserService.getUserById(req.user.id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User Not Found',
          message: 'Utilisateur non trouvé'
        });
        return;
      }

      // Get session info
      const sessionInfo = await AuthService.getUserSession(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Profil récupéré avec succès',
        data: {
          user,
          session: sessionInfo
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Profile Fetch Failed',
        message: error instanceof Error ? error.message : 'Erreur de récupération du profil'
      });
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const passwordData: ChangePasswordRequest = req.body;
      await UserService.changePassword(req.user.id, passwordData);

      // Logout from all devices after password change for security
      await AuthService.logoutAllDevices(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Mot de passe modifié avec succès. Veuillez vous reconnecter.'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(400).json({
        success: false,
        error: 'Password Change Failed',
        message: error instanceof Error ? error.message : 'Erreur de changement de mot de passe'
      });
    }
  }

  /**
   * Check authentication status
   */
  static async checkAuth(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Non authentifié'
        });
        return;
      }

      const isLoggedIn = await AuthService.isUserLoggedIn(req.user.id);
      
      if (!isLoggedIn) {
        res.status(401).json({
          success: false,
          error: 'Session Expired',
          message: 'Session expirée'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Utilisateur authentifié',
        data: {
          user: req.user,
          authenticated: true
        }
      });
    } catch (error) {
      logger.error('Check auth error:', error);
      res.status(500).json({
        success: false,
        error: 'Auth Check Failed',
        message: error instanceof Error ? error.message : 'Erreur de vérification d\'authentification'
      });
    }
  }

  /**
   * Update user profile (limited fields)
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Utilisateur non authentifié'
        });
        return;
      }

      const { prenom, nom } = req.body;
      
      // Users can only update their own basic profile info
      const updatedUser = await UserService.updateUser(
        req.user.id,
        { prenom, nom },
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: { user: updatedUser }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        error: 'Profile Update Failed',
        message: error instanceof Error ? error.message : 'Erreur de mise à jour du profil'
      });
    }
  }
} 