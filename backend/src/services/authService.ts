import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { logger } from '../config/logger';
import { verifyPassword, hashPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../types/auth';
import { EmailService } from './emailService';
import crypto from 'crypto';

export class AuthService {
  private static readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';
  private static readonly USER_SESSION_PREFIX = 'user_session:';
  private static readonly TOKEN_VERSION_PREFIX = 'token_version:';

  /**
   * Authenticate user with email and password
   */
  static async login(loginData: LoginRequest): Promise<LoginResponse> {
    const { email, password } = loginData;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        filiere: true,
        niveau: true
      }
    });

    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      throw new Error('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      logger.warn(`Login attempt with inactive account: ${email}`);
      throw new Error('Compte utilisateur désactivé');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for user: ${email}`);
      throw new Error('Email ou mot de passe incorrect');
    }

    // Get or create token version
    const tokenVersion = await this.getOrCreateTokenVersion(user.id);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion
    });

    // Store refresh token in Redis
    await this.storeRefreshToken(user.id, refreshToken);

    // Update user session info
    await this.updateUserSession(user.id);

    logger.info(`Successful login for user: ${email}`);

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

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<void> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Don't reveal if email exists or not for security
        logger.warn(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      if (!user.isActive) {
        logger.warn(`Password reset requested for inactive account: ${email}`);
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Update user with reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry
        }
      });

      // Send password reset email
      await EmailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        `${user.prenom} ${user.nom}`
      );

      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error('Error requesting password reset:', error);
      throw new Error('Erreur lors de la demande de réinitialisation du mot de passe');
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Find user by reset token
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date() // Token must not be expired
          }
        }
      });

      if (!user) {
        throw new Error('Token de réinitialisation invalide ou expiré');
      }

      if (!user.isActive) {
        throw new Error('Compte utilisateur désactivé');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        }
      });

      // Logout from all devices for security
      await this.logoutAllDevices(user.id);

      logger.info(`Password reset successful for user: ${user.email}`);
    } catch (error) {
      logger.error('Error resetting password:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur lors de la réinitialisation du mot de passe');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshData: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const { refreshToken } = refreshData;

    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Check if refresh token exists in Redis
      const storedToken = await redisClient.get(`${this.REFRESH_TOKEN_PREFIX}${payload.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Token de rafraîchissement invalide');
      }

      // Check token version
      const currentTokenVersion = await this.getTokenVersion(payload.userId);
      if (currentTokenVersion !== payload.tokenVersion) {
        throw new Error('Token de rafraîchissement expiré');
      }

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user || !user.isActive) {
        throw new Error('Utilisateur non trouvé ou désactivé');
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      const newRefreshToken = generateRefreshToken({
        userId: user.id,
        tokenVersion: currentTokenVersion
      });

      // Store new refresh token
      await this.storeRefreshToken(user.id, newRefreshToken);

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.warn('Failed token refresh attempt:', error);
      throw new Error('Token de rafraîchissement invalide');
    }
  }

  /**
   * Logout user and invalidate tokens
   */
  static async logout(userId: string): Promise<void> {
    try {
      // Remove refresh token from Redis
      await redisClient.del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
      
      // Remove user session
      await redisClient.del(`${this.USER_SESSION_PREFIX}${userId}`);

      // Increment token version to invalidate all existing tokens
      await this.incrementTokenVersion(userId);

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Error during logout:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  }

  /**
   * Logout user from all devices
   */
  static async logoutAllDevices(userId: string): Promise<void> {
    try {
      // Remove all refresh tokens and sessions
      await redisClient.del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
      await redisClient.del(`${this.USER_SESSION_PREFIX}${userId}`);

      // Increment token version to invalidate all tokens
      await this.incrementTokenVersion(userId);

      logger.info(`User logged out from all devices: ${userId}`);
    } catch (error) {
      logger.error('Error during logout from all devices:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  }

  /**
   * Check if user is currently logged in
   */
  static async isUserLoggedIn(userId: string): Promise<boolean> {
    try {
      const refreshToken = await redisClient.get(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
      return !!refreshToken;
    } catch (error) {
      logger.error('Error checking user login status:', error);
      return false;
    }
  }

  /**
   * Get user session info
   */
  static async getUserSession(userId: string): Promise<any> {
    try {
      const sessionData = await redisClient.get(`${this.USER_SESSION_PREFIX}${userId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.error('Error getting user session:', error);
      return null;
    }
  }

  /**
   * Store refresh token in Redis
   */
  private static async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenTTL = 7 * 24 * 60 * 60; // 7 days in seconds
    await redisClient.setEx(`${this.REFRESH_TOKEN_PREFIX}${userId}`, refreshTokenTTL, refreshToken);
  }

  /**
   * Update user session information
   */
  private static async updateUserSession(userId: string): Promise<void> {
    const sessionData = {
      lastLogin: new Date().toISOString(),
      loginCount: await this.incrementLoginCount(userId)
    };

    const sessionTTL = 7 * 24 * 60 * 60; // 7 days in seconds
    await redisClient.setEx(
      `${this.USER_SESSION_PREFIX}${userId}`,
      sessionTTL,
      JSON.stringify(sessionData)
    );
  }

  /**
   * Get or create token version for user
   */
  private static async getOrCreateTokenVersion(userId: string): Promise<number> {
    const versionKey = `${this.TOKEN_VERSION_PREFIX}${userId}`;
    let version = await redisClient.get(versionKey);
    
    if (!version) {
      version = '1';
      await redisClient.set(versionKey, version);
    }
    
    return parseInt(version);
  }

  /**
   * Get current token version for user
   */
  private static async getTokenVersion(userId: string): Promise<number> {
    const versionKey = `${this.TOKEN_VERSION_PREFIX}${userId}`;
    const version = await redisClient.get(versionKey);
    return version ? parseInt(version) : 1;
  }

  /**
   * Increment token version (invalidates all existing tokens)
   */
  private static async incrementTokenVersion(userId: string): Promise<number> {
    const versionKey = `${this.TOKEN_VERSION_PREFIX}${userId}`;
    const newVersion = await redisClient.incr(versionKey);
    return newVersion;
  }

  /**
   * Increment login count for analytics
   */
  private static async incrementLoginCount(userId: string): Promise<number> {
    const countKey = `login_count:${userId}`;
    const count = await redisClient.incr(countKey);
    
    // Set expiry for the counter (30 days)
    if (count === 1) {
      await redisClient.expire(countKey, 30 * 24 * 60 * 60);
    }
    
    return count;
  }
} 