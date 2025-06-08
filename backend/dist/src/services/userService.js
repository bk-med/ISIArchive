"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const password_1 = require("../utils/password");
class UserService {
    static async createUser(userData, createdBy) {
        const { email, password, prenom, nom, role, filiereId, niveauId } = userData;
        const passwordValidation = (0, password_1.validatePasswordStrength)(password);
        if (!passwordValidation.isValid) {
            throw new Error(`Mot de passe faible: ${passwordValidation.errors.join(', ')}`);
        }
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        if (existingUser) {
            throw new Error('Un utilisateur avec cet email existe déjà');
        }
        if (filiereId) {
            const filiere = await database_1.prisma.filiere.findFirst({
                where: { id: filiereId, isDeleted: false }
            });
            if (!filiere) {
                throw new Error('Filière non trouvée');
            }
        }
        if (niveauId) {
            const niveau = await database_1.prisma.niveau.findUnique({
                where: { id: niveauId }
            });
            if (!niveau) {
                throw new Error('Niveau non trouvé');
            }
        }
        if (role === client_1.UserRole.etudiant && (!filiereId || !niveauId)) {
            throw new Error('La filière et le niveau sont requis pour les étudiants');
        }
        try {
            const hashedPassword = await (0, password_1.hashPassword)(password);
            const user = await database_1.prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    prenom,
                    nom,
                    role,
                    filiereId: filiereId || null,
                    niveauId: niveauId || null,
                    isActive: true
                },
                include: {
                    filiere: true,
                    niveau: true
                }
            });
            logger_1.logger.info(`User created: ${user.email} by admin: ${createdBy}`);
            return {
                id: user.id,
                email: user.email,
                prenom: user.prenom,
                nom: user.nom,
                role: user.role,
                isActive: user.isActive,
                filiereId: user.filiereId || undefined,
                niveauId: user.niveauId || undefined
            };
        }
        catch (error) {
            logger_1.logger.error('Error creating user:', error);
            throw new Error('Erreur lors de la création de l\'utilisateur');
        }
    }
    static async getUserById(userId) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    filiere: true,
                    niveau: true
                }
            });
            if (!user) {
                return null;
            }
            return {
                id: user.id,
                email: user.email,
                prenom: user.prenom,
                nom: user.nom,
                role: user.role,
                isActive: user.isActive,
                filiereId: user.filiereId || undefined,
                niveauId: user.niveauId || undefined
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting user by ID:', error);
            throw new Error('Erreur lors de la récupération de l\'utilisateur');
        }
    }
    static async getUsers(options) {
        const { page = 1, limit = 10, search, role, isActive } = options;
        const skip = (page - 1) * limit;
        try {
            const where = {};
            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { prenom: { contains: search, mode: 'insensitive' } },
                    { nom: { contains: search, mode: 'insensitive' } }
                ];
            }
            if (role) {
                where.role = role;
            }
            if (typeof isActive === 'boolean') {
                where.isActive = isActive;
            }
            const [users, total] = await Promise.all([
                database_1.prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        filiere: true,
                        niveau: true
                    }
                }),
                database_1.prisma.user.count({ where })
            ]);
            const formattedUsers = users.map(user => ({
                id: user.id,
                email: user.email,
                prenom: user.prenom,
                nom: user.nom,
                role: user.role,
                isActive: user.isActive,
                filiereId: user.filiereId || undefined,
                niveauId: user.niveauId || undefined,
                filiere: user.filiere ? {
                    id: user.filiere.id,
                    nom: user.filiere.nom,
                    code: user.filiere.code
                } : undefined,
                niveau: user.niveau ? {
                    id: user.niveau.id,
                    nom: user.niveau.nom,
                    type: user.niveau.type
                } : undefined,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }));
            return {
                users: formattedUsers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting users:', error);
            throw new Error('Erreur lors de la récupération des utilisateurs');
        }
    }
    static async updateUser(userId, updateData, updatedBy) {
        const { prenom, nom, role, isActive, filiereId, niveauId } = updateData;
        try {
            const existingUser = await database_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!existingUser) {
                throw new Error('Utilisateur non trouvé');
            }
            if (filiereId) {
                const filiere = await database_1.prisma.filiere.findFirst({
                    where: { id: filiereId, isDeleted: false }
                });
                if (!filiere) {
                    throw new Error('Filière non trouvée');
                }
            }
            if (niveauId) {
                const niveau = await database_1.prisma.niveau.findUnique({
                    where: { id: niveauId }
                });
                if (!niveau) {
                    throw new Error('Niveau non trouvé');
                }
            }
            const newRole = role || existingUser.role;
            if (newRole === client_1.UserRole.etudiant) {
                const newFiliereId = filiereId !== undefined ? filiereId : existingUser.filiereId;
                const newNiveauId = niveauId !== undefined ? niveauId : existingUser.niveauId;
                if (!newFiliereId || !newNiveauId) {
                    throw new Error('La filière et le niveau sont requis pour les étudiants');
                }
            }
            const user = await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    ...(prenom && { prenom }),
                    ...(nom && { nom }),
                    ...(role && { role }),
                    ...(typeof isActive === 'boolean' && { isActive }),
                    ...(filiereId !== undefined && { filiereId }),
                    ...(niveauId !== undefined && { niveauId })
                },
                include: {
                    filiere: true,
                    niveau: true
                }
            });
            logger_1.logger.info(`User updated: ${user.email} by: ${updatedBy}`);
            return {
                id: user.id,
                email: user.email,
                prenom: user.prenom,
                nom: user.nom,
                role: user.role,
                isActive: user.isActive,
                filiereId: user.filiereId || undefined,
                niveauId: user.niveauId || undefined
            };
        }
        catch (error) {
            logger_1.logger.error('Error updating user:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erreur lors de la mise à jour de l\'utilisateur');
        }
    }
    static async deleteUser(userId, deletedBy) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }
            if (user.role === client_1.UserRole.admin) {
                const adminCount = await database_1.prisma.user.count({
                    where: { role: client_1.UserRole.admin, isActive: true }
                });
                if (adminCount <= 1) {
                    throw new Error('Impossible de supprimer le dernier administrateur');
                }
            }
            await database_1.prisma.user.delete({
                where: { id: userId }
            });
            logger_1.logger.info(`User deleted: ${user.email} by admin: ${deletedBy}`);
        }
        catch (error) {
            logger_1.logger.error('Error deleting user:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erreur lors de la suppression de l\'utilisateur');
        }
    }
    static async changePassword(userId, passwordData) {
        const { currentPassword, newPassword } = passwordData;
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }
            const isCurrentPasswordValid = await (0, password_1.verifyPassword)(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new Error('Mot de passe actuel incorrect');
            }
            const passwordValidation = (0, password_1.validatePasswordStrength)(newPassword);
            if (!passwordValidation.isValid) {
                throw new Error(`Nouveau mot de passe faible: ${passwordValidation.errors.join(', ')}`);
            }
            const hashedNewPassword = await (0, password_1.hashPassword)(newPassword);
            await database_1.prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword }
            });
            logger_1.logger.info(`Password changed for user: ${user.email}`);
        }
        catch (error) {
            logger_1.logger.error('Error changing password:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erreur lors du changement de mot de passe');
        }
    }
    static async getUserStats() {
        try {
            const [totalUsers, activeUsers, roleStats] = await Promise.all([
                database_1.prisma.user.count(),
                database_1.prisma.user.count({ where: { isActive: true } }),
                database_1.prisma.user.groupBy({
                    by: ['role'],
                    _count: { role: true }
                })
            ]);
            const roleDistribution = roleStats.reduce((acc, stat) => {
                acc[stat.role] = stat._count.role;
                return acc;
            }, {});
            return {
                totalUsers,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers,
                roleDistribution
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting user stats:', error);
            throw new Error('Erreur lors de la récupération des statistiques');
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map