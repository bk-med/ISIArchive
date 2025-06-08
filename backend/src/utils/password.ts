import bcrypt from 'bcryptjs';
import { logger } from '../config/logger';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    const isValid = await bcrypt.compare(password, hashedPassword);
    return isValid;
  } catch (error) {
    logger.error('Error verifying password:', error);
    throw new Error('Failed to verify password');
  }
};

export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Minimum length
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  // Maximum length
  if (password.length > 128) {
    errors.push('Le mot de passe ne peut pas dépasser 128 caractères');
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
  }

  // At least one digit
  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  // At least one special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }

  // No common patterns
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