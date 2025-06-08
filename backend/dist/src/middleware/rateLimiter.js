"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserLimiter = exports.readLimiter = exports.uploadLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../config/logger");
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000');
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    message: {
        error: 'Too Many Requests',
        message: 'Trop de requêtes, veuillez réessayer plus tard',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'Trop de requêtes, veuillez réessayer plus tard',
            retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
        });
    }
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too Many Login Attempts',
        message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        logger_1.logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Email: ${req.body?.email}`);
        res.status(429).json({
            error: 'Too Many Login Attempts',
            message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
            retryAfter: 900
        });
    }
});
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        error: 'Too Many Upload Attempts',
        message: 'Trop de tentatives de téléchargement, veuillez réessayer dans une minute',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn(`Upload rate limit exceeded for IP: ${req.ip}, User: ${req.user?.id}`);
        res.status(429).json({
            error: 'Too Many Upload Attempts',
            message: 'Trop de tentatives de téléchargement, veuillez réessayer dans une minute',
            retryAfter: 60
        });
    }
});
exports.readLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    message: {
        error: 'Too Many Requests',
        message: 'Trop de requêtes de lecture, veuillez réessayer dans une minute',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn(`Read rate limit exceeded for IP: ${req.ip}, User: ${req.user?.id}`);
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'Trop de requêtes de lecture, veuillez réessayer dans une minute',
            retryAfter: 60
        });
    }
});
exports.createUserLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 5,
    message: {
        error: 'Too Many User Creation Attempts',
        message: 'Trop de créations d\'utilisateurs, veuillez réessayer dans une minute',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn(`User creation rate limit exceeded for IP: ${req.ip}, Admin: ${req.user?.id}`);
        res.status(429).json({
            error: 'Too Many User Creation Attempts',
            message: 'Trop de créations d\'utilisateurs, veuillez réessayer dans une minute',
            retryAfter: 60
        });
    }
});
//# sourceMappingURL=rateLimiter.js.map