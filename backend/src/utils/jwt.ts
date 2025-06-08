import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { JwtPayload, RefreshTokenPayload } from '../types/auth';
import { logger } from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined in environment variables');
}

export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  try {
    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as StringValue,
      issuer: 'isi-archive',
      audience: 'isi-archive-users'
    };
    return jwt.sign(payload, JWT_SECRET, options);
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
};

export const generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string => {
  try {
    const options: SignOptions = {
      expiresIn: JWT_REFRESH_EXPIRES_IN as StringValue,
      issuer: 'isi-archive',
      audience: 'isi-archive-users'
    };
    return jwt.sign(payload, JWT_REFRESH_SECRET, options);
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'isi-archive',
      audience: 'isi-archive-users'
    }) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    } else {
      logger.error('Error verifying access token:', error);
      throw new Error('Token verification failed');
    }
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'isi-archive',
      audience: 'isi-archive-users'
    }) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      logger.error('Error verifying refresh token:', error);
      throw new Error('Token verification failed');
    }
  }
};

export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    logger.error('Error decoding token for expiration:', error);
    return null;
  }
}; 