"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenExpiration = exports.extractTokenFromHeader = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../config/logger");
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets must be defined in environment variables');
}
const generateAccessToken = (payload) => {
    try {
        const options = {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'isi-archive',
            audience: 'isi-archive-users'
        };
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
    }
    catch (error) {
        logger_1.logger.error('Error generating access token:', error);
        throw new Error('Failed to generate access token');
    }
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    try {
        const options = {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
            issuer: 'isi-archive',
            audience: 'isi-archive-users'
        };
        return jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, options);
    }
    catch (error) {
        logger_1.logger.error('Error generating refresh token:', error);
        throw new Error('Failed to generate refresh token');
    }
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            issuer: 'isi-archive',
            audience: 'isi-archive-users'
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Access token expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid access token');
        }
        else {
            logger_1.logger.error('Error verifying access token:', error);
            throw new Error('Token verification failed');
        }
    }
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET, {
            issuer: 'isi-archive',
            audience: 'isi-archive-users'
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Refresh token expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid refresh token');
        }
        else {
            logger_1.logger.error('Error verifying refresh token:', error);
            throw new Error('Token verification failed');
        }
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader) {
        return null;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
};
exports.extractTokenFromHeader = extractTokenFromHeader;
const getTokenExpiration = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (decoded && decoded.exp) {
            return new Date(decoded.exp * 1000);
        }
        return null;
    }
    catch (error) {
        logger_1.logger.error('Error decoding token for expiration:', error);
        return null;
    }
};
exports.getTokenExpiration = getTokenExpiration;
//# sourceMappingURL=jwt.js.map