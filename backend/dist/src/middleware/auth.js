"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireOwnershipOrAdmin = exports.requireEtudiant = exports.requireProfessorOrAdmin = exports.requireProfesseur = exports.requireAdmin = exports.authorize = exports.authenticate = void 0;
const client_1 = require("@prisma/client");
const jwt_1 = require("../utils/jwt");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const authenticate = async (req, res, next) => {
    try {
        const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
        if (!token) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Token d\'accès requis'
            });
            return;
        }
        const payload = (0, jwt_1.verifyAccessToken)(token);
        const user = await database_1.prisma.user.findUnique({
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
    }
    catch (error) {
        logger_1.logger.error('Authentication error:', error);
        res.status(401).json({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Token invalide'
        });
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentification requise'
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            logger_1.logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role} to endpoint requiring roles: ${roles.join(', ')}`);
            res.status(403).json({
                error: 'Forbidden',
                message: 'Permissions insuffisantes'
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
exports.requireAdmin = (0, exports.authorize)(client_1.UserRole.admin);
exports.requireProfesseur = (0, exports.authorize)(client_1.UserRole.professeur, client_1.UserRole.admin);
exports.requireProfessorOrAdmin = (0, exports.authorize)(client_1.UserRole.professeur, client_1.UserRole.admin);
exports.requireEtudiant = (0, exports.authorize)(client_1.UserRole.etudiant, client_1.UserRole.professeur, client_1.UserRole.admin);
const requireOwnershipOrAdmin = (getUserId) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentification requise'
            });
            return;
        }
        const resourceUserId = getUserId(req);
        const isOwner = req.user.id === resourceUserId;
        const isAdmin = req.user.role === client_1.UserRole.admin;
        if (!isOwner && !isAdmin) {
            logger_1.logger.warn(`Unauthorized access attempt by user ${req.user.id} to resource owned by ${resourceUserId}`);
            res.status(403).json({
                error: 'Forbidden',
                message: 'Accès non autorisé à cette ressource'
            });
            return;
        }
        next();
    };
};
exports.requireOwnershipOrAdmin = requireOwnershipOrAdmin;
const optionalAuth = async (req, res, next) => {
    try {
        const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
        if (!token) {
            next();
            return;
        }
        const payload = (0, jwt_1.verifyAccessToken)(token);
        const user = await database_1.prisma.user.findUnique({
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
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map