"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordStrength = exports.verifyPassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../config/logger");
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
const hashPassword = async (password) => {
    try {
        const salt = await bcryptjs_1.default.genSalt(BCRYPT_ROUNDS);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        return hashedPassword;
    }
    catch (error) {
        logger_1.logger.error('Error hashing password:', error);
        throw new Error('Failed to hash password');
    }
};
exports.hashPassword = hashPassword;
const verifyPassword = async (password, hashedPassword) => {
    try {
        const isValid = await bcryptjs_1.default.compare(password, hashedPassword);
        return isValid;
    }
    catch (error) {
        logger_1.logger.error('Error verifying password:', error);
        throw new Error('Failed to verify password');
    }
};
exports.verifyPassword = verifyPassword;
const validatePasswordStrength = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    if (password.length > 128) {
        errors.push('Le mot de passe ne peut pas dépasser 128 caractères');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
    }
    if (!/\d/.test(password)) {
        errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }
    const commonPatterns = [
        /123456/,
        /password/i,
        /qwerty/i,
        /admin/i,
        /letmein/i
    ];
    for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
            errors.push('Le mot de passe ne doit pas contenir de motifs courants');
            break;
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validatePasswordStrength = validatePasswordStrength;
//# sourceMappingURL=password.js.map