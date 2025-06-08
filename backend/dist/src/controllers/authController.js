"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/authService");
const userService_1 = require("../services/userService");
const logger_1 = require("../config/logger");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
class AuthController {
    static async login(req, res) {
        try {
            const loginData = req.body;
            const result = await authService_1.AuthService.login(loginData);
            await (0, auditMiddleware_1.logAuditEvent)(result.user.id, 'LOGIN', 'auth', undefined, {
                email: loginData.email,
                userRole: result.user.role,
                loginTime: new Date().toISOString()
            }, req);
            res.status(200).json({
                success: true,
                message: 'Connexion réussie',
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            res.status(401).json({
                success: false,
                error: 'Authentication Failed',
                message: error instanceof Error ? error.message : 'Erreur de connexion'
            });
        }
    }
    static async requestPasswordReset(req, res) {
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
            await authService_1.AuthService.requestPasswordReset(email);
            res.status(200).json({
                success: true,
                message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation'
            });
        }
        catch (error) {
            logger_1.logger.error('Password reset request error:', error);
            res.status(500).json({
                success: false,
                error: 'Password Reset Request Failed',
                message: error instanceof Error ? error.message : 'Erreur lors de la demande de réinitialisation'
            });
        }
    }
    static async resetPassword(req, res) {
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
            await authService_1.AuthService.resetPassword(token, password);
            res.status(200).json({
                success: true,
                message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
            });
        }
        catch (error) {
            logger_1.logger.error('Password reset error:', error);
            res.status(400).json({
                success: false,
                error: 'Password Reset Failed',
                message: error instanceof Error ? error.message : 'Erreur lors de la réinitialisation du mot de passe'
            });
        }
    }
    static async refreshToken(req, res) {
        try {
            const refreshData = req.body;
            const result = await authService_1.AuthService.refreshToken(refreshData);
            res.status(200).json({
                success: true,
                message: 'Token rafraîchi avec succès',
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Token refresh error:', error);
            res.status(401).json({
                success: false,
                error: 'Token Refresh Failed',
                message: error instanceof Error ? error.message : 'Erreur de rafraîchissement du token'
            });
        }
    }
    static async logout(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Utilisateur non authentifié'
                });
                return;
            }
            await authService_1.AuthService.logout(req.user.id);
            await (0, auditMiddleware_1.logAuditEvent)(req.user.id, 'LOGOUT', 'auth', undefined, {
                logoutTime: new Date().toISOString()
            }, req);
            res.status(200).json({
                success: true,
                message: 'Déconnexion réussie'
            });
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: 'Logout Failed',
                message: error instanceof Error ? error.message : 'Erreur de déconnexion'
            });
        }
    }
    static async logoutAllDevices(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Utilisateur non authentifié'
                });
                return;
            }
            await authService_1.AuthService.logoutAllDevices(req.user.id);
            res.status(200).json({
                success: true,
                message: 'Déconnexion de tous les appareils réussie'
            });
        }
        catch (error) {
            logger_1.logger.error('Logout all devices error:', error);
            res.status(500).json({
                success: false,
                error: 'Logout Failed',
                message: error instanceof Error ? error.message : 'Erreur de déconnexion'
            });
        }
    }
    static async getProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Utilisateur non authentifié'
                });
                return;
            }
            const user = await userService_1.UserService.getUserById(req.user.id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'User Not Found',
                    message: 'Utilisateur non trouvé'
                });
                return;
            }
            const sessionInfo = await authService_1.AuthService.getUserSession(req.user.id);
            res.status(200).json({
                success: true,
                message: 'Profil récupéré avec succès',
                data: {
                    user,
                    session: sessionInfo
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Profile Fetch Failed',
                message: error instanceof Error ? error.message : 'Erreur de récupération du profil'
            });
        }
    }
    static async changePassword(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Utilisateur non authentifié'
                });
                return;
            }
            const passwordData = req.body;
            await userService_1.UserService.changePassword(req.user.id, passwordData);
            await authService_1.AuthService.logoutAllDevices(req.user.id);
            res.status(200).json({
                success: true,
                message: 'Mot de passe modifié avec succès. Veuillez vous reconnecter.'
            });
        }
        catch (error) {
            logger_1.logger.error('Change password error:', error);
            res.status(400).json({
                success: false,
                error: 'Password Change Failed',
                message: error instanceof Error ? error.message : 'Erreur de changement de mot de passe'
            });
        }
    }
    static async checkAuth(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Non authentifié'
                });
                return;
            }
            const isLoggedIn = await authService_1.AuthService.isUserLoggedIn(req.user.id);
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
        }
        catch (error) {
            logger_1.logger.error('Check auth error:', error);
            res.status(500).json({
                success: false,
                error: 'Auth Check Failed',
                message: error instanceof Error ? error.message : 'Erreur de vérification d\'authentification'
            });
        }
    }
    static async updateProfile(req, res) {
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
            const updatedUser = await userService_1.UserService.updateUser(req.user.id, { prenom, nom }, req.user.id);
            res.status(200).json({
                success: true,
                message: 'Profil mis à jour avec succès',
                data: { user: updatedUser }
            });
        }
        catch (error) {
            logger_1.logger.error('Update profile error:', error);
            res.status(400).json({
                success: false,
                error: 'Profile Update Failed',
                message: error instanceof Error ? error.message : 'Erreur de mise à jour du profil'
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=authController.js.map