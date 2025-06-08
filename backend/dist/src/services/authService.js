"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const logger_1 = require("../config/logger");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const emailService_1 = require("./emailService");
const crypto_1 = __importDefault(require("crypto"));
class AuthService {
    static async login(loginData) {
        const { email, password } = loginData;
        const user = await database_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                filiere: true,
                niveau: true
            }
        });
        if (!user) {
            logger_1.logger.warn(`Login attempt with non-existent email: ${email}`);
            throw new Error('Email ou mot de passe incorrect');
        }
        if (!user.isActive) {
            logger_1.logger.warn(`Login attempt with inactive account: ${email}`);
            throw new Error('Compte utilisateur désactivé');
        }
        const isPasswordValid = await (0, password_1.verifyPassword)(password, user.password);
        if (!isPasswordValid) {
            logger_1.logger.warn(`Failed login attempt for user: ${email}`);
            throw new Error('Email ou mot de passe incorrect');
        }
        const tokenVersion = await this.getOrCreateTokenVersion(user.id);
        const accessToken = (0, jwt_1.generateAccessToken)({
            userId: user.id,
            email: user.email,
            role: user.role
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            userId: user.id,
            tokenVersion
        });
        await this.storeRefreshToken(user.id, refreshToken);
        await this.updateUserSession(user.id);
        logger_1.logger.info(`Successful login for user: ${email}`);
        return {
            user: {
                id: user.id,
                email: user.email,
                prenom: user.prenom,
                nom: user.nom,
                role: user.role,
                isActive: user.isActive
            },
            accessToken,
            refreshToken
        };
    }
    static async requestPasswordReset(email) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { email: email.toLowerCase() }
            });
            if (!user) {
                logger_1.logger.warn(`Password reset requested for non-existent email: ${email}`);
                return;
            }
            if (!user.isActive) {
                logger_1.logger.warn(`Password reset requested for inactive account: ${email}`);
                return;
            }
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken,
                    resetTokenExpiry
                }
            });
            await emailService_1.EmailService.sendPasswordResetEmail(user.email, resetToken, `${user.prenom} ${user.nom}`);
            logger_1.logger.info(`Password reset email sent to: ${email}`);
        }
        catch (error) {
            logger_1.logger.error('Error requesting password reset:', error);
            throw new Error('Erreur lors de la demande de réinitialisation du mot de passe');
        }
    }
    static async resetPassword(token, newPassword) {
        try {
            const user = await database_1.prisma.user.findFirst({
                where: {
                    resetToken: token,
                    resetTokenExpiry: {
                        gt: new Date()
                    }
                }
            });
            if (!user) {
                throw new Error('Token de réinitialisation invalide ou expiré');
            }
            if (!user.isActive) {
                throw new Error('Compte utilisateur désactivé');
            }
            const hashedPassword = await (0, password_1.hashPassword)(newPassword);
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    resetToken: null,
                    resetTokenExpiry: null
                }
            });
            await this.logoutAllDevices(user.id);
            logger_1.logger.info(`Password reset successful for user: ${user.email}`);
        }
        catch (error) {
            logger_1.logger.error('Error resetting password:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erreur lors de la réinitialisation du mot de passe');
        }
    }
    static async refreshToken(refreshData) {
        const { refreshToken } = refreshData;
        try {
            const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
            const storedToken = await redis_1.redisClient.get(`${this.REFRESH_TOKEN_PREFIX}${payload.userId}`);
            if (!storedToken || storedToken !== refreshToken) {
                throw new Error('Token de rafraîchissement invalide');
            }
            const currentTokenVersion = await this.getTokenVersion(payload.userId);
            if (currentTokenVersion !== payload.tokenVersion) {
                throw new Error('Token de rafraîchissement expiré');
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id: payload.userId }
            });
            if (!user || !user.isActive) {
                throw new Error('Utilisateur non trouvé ou désactivé');
            }
            const newAccessToken = (0, jwt_1.generateAccessToken)({
                userId: user.id,
                email: user.email,
                role: user.role
            });
            const newRefreshToken = (0, jwt_1.generateRefreshToken)({
                userId: user.id,
                tokenVersion: currentTokenVersion
            });
            await this.storeRefreshToken(user.id, newRefreshToken);
            logger_1.logger.info(`Token refreshed for user: ${user.email}`);
            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            };
        }
        catch (error) {
            logger_1.logger.warn('Failed token refresh attempt:', error);
            throw new Error('Token de rafraîchissement invalide');
        }
    }
    static async logout(userId) {
        try {
            await redis_1.redisClient.del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
            await redis_1.redisClient.del(`${this.USER_SESSION_PREFIX}${userId}`);
            await this.incrementTokenVersion(userId);
            logger_1.logger.info(`User logged out: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Error during logout:', error);
            throw new Error('Erreur lors de la déconnexion');
        }
    }
    static async logoutAllDevices(userId) {
        try {
            await redis_1.redisClient.del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
            await redis_1.redisClient.del(`${this.USER_SESSION_PREFIX}${userId}`);
            await this.incrementTokenVersion(userId);
            logger_1.logger.info(`User logged out from all devices: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Error during logout from all devices:', error);
            throw new Error('Erreur lors de la déconnexion');
        }
    }
    static async isUserLoggedIn(userId) {
        try {
            const refreshToken = await redis_1.redisClient.get(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
            return !!refreshToken;
        }
        catch (error) {
            logger_1.logger.error('Error checking user login status:', error);
            return false;
        }
    }
    static async getUserSession(userId) {
        try {
            const sessionData = await redis_1.redisClient.get(`${this.USER_SESSION_PREFIX}${userId}`);
            return sessionData ? JSON.parse(sessionData) : null;
        }
        catch (error) {
            logger_1.logger.error('Error getting user session:', error);
            return null;
        }
    }
    static async storeRefreshToken(userId, refreshToken) {
        const refreshTokenTTL = 7 * 24 * 60 * 60;
        await redis_1.redisClient.setEx(`${this.REFRESH_TOKEN_PREFIX}${userId}`, refreshTokenTTL, refreshToken);
    }
    static async updateUserSession(userId) {
        const sessionData = {
            lastLogin: new Date().toISOString(),
            loginCount: await this.incrementLoginCount(userId)
        };
        const sessionTTL = 7 * 24 * 60 * 60;
        await redis_1.redisClient.setEx(`${this.USER_SESSION_PREFIX}${userId}`, sessionTTL, JSON.stringify(sessionData));
    }
    static async getOrCreateTokenVersion(userId) {
        const versionKey = `${this.TOKEN_VERSION_PREFIX}${userId}`;
        let version = await redis_1.redisClient.get(versionKey);
        if (!version) {
            version = '1';
            await redis_1.redisClient.set(versionKey, version);
        }
        return parseInt(version);
    }
    static async getTokenVersion(userId) {
        const versionKey = `${this.TOKEN_VERSION_PREFIX}${userId}`;
        const version = await redis_1.redisClient.get(versionKey);
        return version ? parseInt(version) : 1;
    }
    static async incrementTokenVersion(userId) {
        const versionKey = `${this.TOKEN_VERSION_PREFIX}${userId}`;
        const newVersion = await redis_1.redisClient.incr(versionKey);
        return newVersion;
    }
    static async incrementLoginCount(userId) {
        const countKey = `login_count:${userId}`;
        const count = await redis_1.redisClient.incr(countKey);
        if (count === 1) {
            await redis_1.redisClient.expire(countKey, 30 * 24 * 60 * 60);
        }
        return count;
    }
}
exports.AuthService = AuthService;
AuthService.REFRESH_TOKEN_PREFIX = 'refresh_token:';
AuthService.USER_SESSION_PREFIX = 'user_session:';
AuthService.TOKEN_VERSION_PREFIX = 'token_version:';
//# sourceMappingURL=authService.js.map