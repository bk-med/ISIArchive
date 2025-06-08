import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AuthenticatedUser } from '../types/auth';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token d\'accès requis'
      });
      return;
    }

    const payload = verifyAccessToken(token);
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        filiere: true,
        niveau: true
      }
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Compte utilisateur désactivé'
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      role: user.role,
      isActive: user.isActive,
      filiereId: user.filiereId || undefined,
      niveauId: user.niveauId || undefined
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Token invalide'
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentification requise'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role} to endpoint requiring roles: ${roles.join(', ')}`);
      res.status(403).json({
        error: 'Forbidden',
        message: 'Permissions insuffisantes'
      });
      return;
    }

    next();
  };
};

export const requireAdmin = authorize(UserRole.admin);
export const requireProfesseur = authorize(UserRole.professeur, UserRole.admin);
export const requireProfessorOrAdmin = authorize(UserRole.professeur, UserRole.admin);
export const requireEtudiant = authorize(UserRole.etudiant, UserRole.professeur, UserRole.admin);

// Middleware to check if user can access their own resource or is admin
export const requireOwnershipOrAdmin = (getUserId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentification requise'
      });
      return;
    }

    const resourceUserId = getUserId(req);
    const isOwner = req.user.id === resourceUserId;
    const isAdmin = req.user.role === UserRole.admin;

    if (!isOwner && !isAdmin) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} to resource owned by ${resourceUserId}`);
      res.status(403).json({
        error: 'Forbidden',
        message: 'Accès non autorisé à cette ressource'
      });
      return;
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        filiere: true,
        niveau: true
      }
    });

    if (user && user.isActive) {
      req.user = {
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

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
}; 