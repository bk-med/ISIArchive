import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password';
import { CreateUserRequest, UpdateUserRequest, ChangePasswordRequest, AuthenticatedUser } from '../types/auth';

export class UserService {
  /**
   * Create a new user (Admin only)
   */
  static async createUser(userData: CreateUserRequest, createdBy: string): Promise<AuthenticatedUser> {
    const { email, password, prenom, nom, role, filiereId, niveauId } = userData;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Mot de passe faible: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Validate filiere and niveau if provided
    if (filiereId) {
      const filiere = await prisma.filiere.findFirst({
        where: { id: filiereId, isDeleted: false }
      });
      if (!filiere) {
        throw new Error('Filière non trouvée');
      }
    }

    if (niveauId) {
      const niveau = await prisma.niveau.findUnique({
        where: { id: niveauId }
      });
      if (!niveau) {
        throw new Error('Niveau non trouvé');
      }
    }

    // For students, both filiere and niveau are required
    if (role === UserRole.etudiant && (!filiereId || !niveauId)) {
      throw new Error('La filière et le niveau sont requis pour les étudiants');
    }

    try {
      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
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

      logger.info(`User created: ${user.email} by admin: ${createdBy}`);

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
    } catch (error) {
      logger.error('Error creating user:', error);
      throw new Error('Erreur lors de la création de l\'utilisateur');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<AuthenticatedUser | null> {
    try {
      const user = await prisma.user.findUnique({
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
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw new Error('Erreur lors de la récupération de l\'utilisateur');
    }
  }

  /**
   * Get all users with pagination and filtering
   */
  static async getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 10, search, role, isActive } = options;
    const skip = (page - 1) * limit;

    try {
      const where: any = {};

      // Add search filter
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { prenom: { contains: search, mode: 'insensitive' } },
          { nom: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Add role filter
      if (role) {
        where.role = role;
      }

      // Add active status filter
      if (typeof isActive === 'boolean') {
        where.isActive = isActive;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            filiere: true,
            niveau: true
          }
        }),
        prisma.user.count({ where })
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
    } catch (error) {
      logger.error('Error getting users:', error);
      throw new Error('Erreur lors de la récupération des utilisateurs');
    }
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: string,
    updateData: UpdateUserRequest,
    updatedBy: string
  ): Promise<AuthenticatedUser> {
    const { prenom, nom, role, isActive, filiereId, niveauId } = updateData;

    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Validate filiere and niveau if provided
      if (filiereId) {
        const filiere = await prisma.filiere.findFirst({
          where: { id: filiereId, isDeleted: false }
        });
        if (!filiere) {
          throw new Error('Filière non trouvée');
        }
      }

      if (niveauId) {
        const niveau = await prisma.niveau.findUnique({
          where: { id: niveauId }
        });
        if (!niveau) {
          throw new Error('Niveau non trouvé');
        }
      }

      // For students, both filiere and niveau are required
      const newRole = role || existingUser.role;
      if (newRole === UserRole.etudiant) {
        const newFiliereId = filiereId !== undefined ? filiereId : existingUser.filiereId;
        const newNiveauId = niveauId !== undefined ? niveauId : existingUser.niveauId;
        
        if (!newFiliereId || !newNiveauId) {
          throw new Error('La filière et le niveau sont requis pour les étudiants');
        }
      }

      // Update user
      const user = await prisma.user.update({
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

      logger.info(`User updated: ${user.email} by: ${updatedBy}`);

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
    } catch (error) {
      logger.error('Error updating user:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur lors de la mise à jour de l\'utilisateur');
    }
  }

  /**
   * Delete user (Admin only)
   */
  static async deleteUser(userId: string, deletedBy: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Don't allow deleting the last admin
      if (user.role === UserRole.admin) {
        const adminCount = await prisma.user.count({
          where: { role: UserRole.admin, isActive: true }
        });

        if (adminCount <= 1) {
          throw new Error('Impossible de supprimer le dernier administrateur');
        }
      }

      await prisma.user.delete({
        where: { id: userId }
      });

      logger.info(`User deleted: ${user.email} by admin: ${deletedBy}`);
    } catch (error) {
      logger.error('Error deleting user:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur lors de la suppression de l\'utilisateur');
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    passwordData: ChangePasswordRequest
  ): Promise<void> {
    const { currentPassword, newPassword } = passwordData;

    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Mot de passe actuel incorrect');
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Nouveau mot de passe faible: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Error changing password:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur lors du changement de mot de passe');
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    try {
      const [totalUsers, activeUsers, roleStats] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true }
        })
      ]);

      const roleDistribution = roleStats.reduce((acc, stat) => {
        acc[stat.role] = stat._count.role;
        return acc;
      }, {} as Record<UserRole, number>);

      return {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        roleDistribution
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw new Error('Erreur lors de la récupération des statistiques');
    }
  }
} 