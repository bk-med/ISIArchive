"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const userService_1 = require("../services/userService");
const logger_1 = require("../config/logger");
class UserController {
    static async createUser(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Utilisateur non authentifié'
                });
                return;
            }
            const userData = req.body;
            const newUser = await userService_1.UserService.createUser(userData, req.user.id);
            res.status(201).json({
                success: true,
                message: 'Utilisateur créé avec succès',
                data: { user: newUser }
            });
        }
        catch (error) {
            logger_1.logger.error('Create user error:', error);
            res.status(400).json({
                success: false,
                error: 'User Creation Failed',
                message: error instanceof Error ? error.message : 'Erreur de création d\'utilisateur'
            });
        }
    }
    static async getUsers(req, res) {
        try {
            const { page, limit, search, role, isActive } = req.query;
            const options = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                search: search,
                role: role,
                isActive: isActive !== undefined ? isActive === 'true' : undefined
            };
            const result = await userService_1.UserService.getUsers(options);
            res.status(200).json({
                success: true,
                message: 'Utilisateurs récupérés avec succès',
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Get users error:', error);
            res.status(500).json({
                success: false,
                error: 'Users Fetch Failed',
                message: error instanceof Error ? error.message : 'Erreur de récupération des utilisateurs'
            });
        }
    }
    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await userService_1.UserService.getUserById(id);
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
        }
        catch (error) {
            logger_1.logger.error('Get user by ID error:', error);
            res.status(500).json({
                success: false,
                error: 'User Fetch Failed',
                message: error instanceof Error ? error.message : 'Erreur de récupération de l\'utilisateur'
            });
        }
    }
    static async updateUser(req, res) {
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
            const updateData = req.body;
            const updatedUser = await userService_1.UserService.updateUser(id, updateData, req.user.id);
            res.status(200).json({
                success: true,
                message: 'Utilisateur mis à jour avec succès',
                data: { user: updatedUser }
            });
        }
        catch (error) {
            logger_1.logger.error('Update user error:', error);
            res.status(400).json({
                success: false,
                error: 'User Update Failed',
                message: error instanceof Error ? error.message : 'Erreur de mise à jour de l\'utilisateur'
            });
        }
    }
    static async deleteUser(req, res) {
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
            if (id === req.user.id) {
                res.status(400).json({
                    success: false,
                    error: 'Self Deletion Not Allowed',
                    message: 'Vous ne pouvez pas supprimer votre propre compte'
                });
                return;
            }
            await userService_1.UserService.deleteUser(id, req.user.id);
            res.status(200).json({
                success: true,
                message: 'Utilisateur supprimé avec succès'
            });
        }
        catch (error) {
            logger_1.logger.error('Delete user error:', error);
            res.status(400).json({
                success: false,
                error: 'User Deletion Failed',
                message: error instanceof Error ? error.message : 'Erreur de suppression de l\'utilisateur'
            });
        }
    }
    static async getUserStats(req, res) {
        try {
            const stats = await userService_1.UserService.getUserStats();
            res.status(200).json({
                success: true,
                message: 'Statistiques récupérées avec succès',
                data: { stats }
            });
        }
        catch (error) {
            logger_1.logger.error('Get user stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Stats Fetch Failed',
                message: error instanceof Error ? error.message : 'Erreur de récupération des statistiques'
            });
        }
    }
    static async toggleUserStatus(req, res) {
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
            if (id === req.user.id) {
                res.status(400).json({
                    success: false,
                    error: 'Self Deactivation Not Allowed',
                    message: 'Vous ne pouvez pas désactiver votre propre compte'
                });
                return;
            }
            const currentUser = await userService_1.UserService.getUserById(id);
            if (!currentUser) {
                res.status(404).json({
                    success: false,
                    error: 'User Not Found',
                    message: 'Utilisateur non trouvé'
                });
                return;
            }
            const updatedUser = await userService_1.UserService.updateUser(id, { isActive: !currentUser.isActive }, req.user.id);
            res.status(200).json({
                success: true,
                message: `Utilisateur ${updatedUser.isActive ? 'activé' : 'désactivé'} avec succès`,
                data: { user: updatedUser }
            });
        }
        catch (error) {
            logger_1.logger.error('Toggle user status error:', error);
            res.status(400).json({
                success: false,
                error: 'Status Toggle Failed',
                message: error instanceof Error ? error.message : 'Erreur de changement de statut'
            });
        }
    }
    static async bulkUpdateUsers(req, res) {
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
                    const updatedUser = await userService_1.UserService.updateUser(userId, updateData, req.user.id);
                    results.push(updatedUser);
                }
                catch (error) {
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
        }
        catch (error) {
            logger_1.logger.error('Bulk update users error:', error);
            res.status(500).json({
                success: false,
                error: 'Bulk Update Failed',
                message: error instanceof Error ? error.message : 'Erreur de mise à jour en lot'
            });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=userController.js.map