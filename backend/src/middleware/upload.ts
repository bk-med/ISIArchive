import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';
import { logger } from '../config/logger';

// Allowed file types for documents
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Base upload directory
const UPLOAD_BASE_DIR = process.env.UPLOAD_PATH || './uploads';

/**
 * Create directory structure if it doesn't exist
 */
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
};

/**
 * Generate unique filename with timestamp and hash
 */
const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  
  // Sanitize filename
  const sanitizedName = nameWithoutExt
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .substring(0, 50);
  
  return `${timestamp}_${sanitizedName}_${hash}${ext}`;
};

/**
 * Get upload path based on document metadata
 */
const getUploadPath = (niveau: string, filiere: string, semestre: string, matiere: string, categorie: string): string => {
  const uploadPath = path.join(
    UPLOAD_BASE_DIR,
    'documents',
    niveau,
    filiere,
    semestre,
    matiere,
    categorie
  );
  
  ensureDirectoryExists(uploadPath);
  return uploadPath;
};

/**
 * Get PFE upload path
 */
const getPFEUploadPath = (niveau: string, filiere: string, semestre: string): string => {
  const uploadPath = path.join(
    UPLOAD_BASE_DIR,
    'documents',
    niveau,
    filiere,
    semestre,
    'pfe'
  );
  
  ensureDirectoryExists(uploadPath);
  return uploadPath;
};

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    try {
      // Use temp directory initially - we'll organize files after parsing
      const tempPath = path.join(UPLOAD_BASE_DIR, 'temp');
      ensureDirectoryExists(tempPath);
      cb(null, tempPath);
    } catch (error) {
      logger.error('Error determining upload destination:', error);
      cb(error as Error, '');
    }
  },
  
  filename: (req: Request, file, cb) => {
    try {
      const uniqueFilename = generateUniqueFilename(file.originalname);
      cb(null, uniqueFilename);
    } catch (error) {
      logger.error('Error generating filename:', error);
      cb(error as Error, '');
    }
  }
});

/**
 * File filter for validation
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    logger.warn(`Invalid file type attempted: ${file.mimetype} by user ${req.user?.id}`);
    return cb(new Error(`Type de fichier non autorisé. Types acceptés: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    logger.warn(`Invalid file extension attempted: ${ext} by user ${req.user?.id}`);
    return cb(new Error(`Extension de fichier non autorisée. Extensions acceptées: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }
  
  cb(null, true);
};

/**
 * Multer configuration
 */
export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Only one file at a time
  }
}).single('document');

/**
 * Error handler for multer errors
 */
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    logger.error('Multer error:', error);
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'File Too Large',
          message: `Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too Many Files',
          message: 'Un seul fichier autorisé par téléchargement'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected Field',
          message: 'Champ de fichier inattendu'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Upload Error',
          message: 'Erreur lors du téléchargement du fichier'
        });
    }
  }
  
  if (error.message) {
    logger.error('Upload validation error:', error.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.message
    });
  }
  
  next(error);
};

/**
 * Cleanup uploaded file in case of error
 */
export const cleanupUploadedFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Cleaned up uploaded file: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Error cleaning up file ${filePath}:`, error);
  }
};

/**
 * Get file info from uploaded file
 */
export const getFileInfo = (file: Express.Multer.File) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimeType: file.mimetype
  };
};

/**
 * Middleware to organize uploaded file after multer parsing
 */
export const organizeUploadedFile = (req: Request, res: any, next: any) => {
  try {
    if (!req.file) {
      return next();
    }

    console.log('Organizing uploaded file - req.body:', req.body);
    
    const { niveau, filiere, semestre, matiere, categorie } = req.body;
    
    console.log('File organization metadata:', { niveau, filiere, semestre, matiere, categorie });
    
    // Validate required metadata
    if (!niveau || !filiere || !semestre) {
      cleanupUploadedFile(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Niveau, filière et semestre sont requis'
      });
    }

    let targetPath: string;
    
    // For PFE documents
    if (categorie === 'pfe') {
      targetPath = getPFEUploadPath(niveau, filiere, semestre);
    } else {
      // For regular documents
      if (!matiere || !categorie) {
        cleanupUploadedFile(req.file.path);
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Matière et catégorie sont requises pour les documents académiques'
        });
      }
      targetPath = getUploadPath(niveau, filiere, semestre, matiere, categorie);
    }

    // Move file from temp to organized location
    const newFilePath = path.join(targetPath, req.file.filename);
    
    // Ensure target directory exists
    ensureDirectoryExists(targetPath);
    
    // Move the file
    fs.renameSync(req.file.path, newFilePath);
    
    // Update file path in request
    req.file.path = newFilePath;
    req.file.destination = targetPath;
    
    console.log(`File organized: ${req.file.path}`);
    next();
  } catch (error) {
    logger.error('Error organizing uploaded file:', error);
    if (req.file) {
      cleanupUploadedFile(req.file.path);
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Erreur lors de l\'organisation du fichier'
    });
  }
};

// Ensure base upload directory exists
ensureDirectoryExists(UPLOAD_BASE_DIR);
ensureDirectoryExists(path.join(UPLOAD_BASE_DIR, 'documents'));
ensureDirectoryExists(path.join(UPLOAD_BASE_DIR, 'temp')); 