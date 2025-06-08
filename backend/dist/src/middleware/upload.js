"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizeUploadedFile = exports.getFileInfo = exports.cleanupUploadedFile = exports.handleUploadError = exports.uploadDocument = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../config/logger");
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const UPLOAD_BASE_DIR = process.env.UPLOAD_PATH || './uploads';
const ensureDirectoryExists = (dirPath) => {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
        logger_1.logger.info(`Created directory: ${dirPath}`);
    }
};
const generateUniqueFilename = (originalName) => {
    const timestamp = Date.now();
    const hash = crypto_1.default.randomBytes(8).toString('hex');
    const ext = path_1.default.extname(originalName);
    const nameWithoutExt = path_1.default.basename(originalName, ext);
    const sanitizedName = nameWithoutExt
        .replace(/[^a-zA-Z0-9\-_]/g, '_')
        .substring(0, 50);
    return `${timestamp}_${sanitizedName}_${hash}${ext}`;
};
const getUploadPath = (niveau, filiere, semestre, matiere, categorie) => {
    const uploadPath = path_1.default.join(UPLOAD_BASE_DIR, 'documents', niveau, filiere, semestre, matiere, categorie);
    ensureDirectoryExists(uploadPath);
    return uploadPath;
};
const getPFEUploadPath = (niveau, filiere, semestre) => {
    const uploadPath = path_1.default.join(UPLOAD_BASE_DIR, 'documents', niveau, filiere, semestre, 'pfe');
    ensureDirectoryExists(uploadPath);
    return uploadPath;
};
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        try {
            const tempPath = path_1.default.join(UPLOAD_BASE_DIR, 'temp');
            ensureDirectoryExists(tempPath);
            cb(null, tempPath);
        }
        catch (error) {
            logger_1.logger.error('Error determining upload destination:', error);
            cb(error, '');
        }
    },
    filename: (req, file, cb) => {
        try {
            const uniqueFilename = generateUniqueFilename(file.originalname);
            cb(null, uniqueFilename);
        }
        catch (error) {
            logger_1.logger.error('Error generating filename:', error);
            cb(error, '');
        }
    }
});
const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        logger_1.logger.warn(`Invalid file type attempted: ${file.mimetype} by user ${req.user?.id}`);
        return cb(new Error(`Type de fichier non autorisé. Types acceptés: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        logger_1.logger.warn(`Invalid file extension attempted: ${ext} by user ${req.user?.id}`);
        return cb(new Error(`Extension de fichier non autorisée. Extensions acceptées: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
    cb(null, true);
};
exports.uploadDocument = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    }
}).single('document');
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        logger_1.logger.error('Multer error:', error);
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
        logger_1.logger.error('Upload validation error:', error.message);
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: error.message
        });
    }
    next(error);
};
exports.handleUploadError = handleUploadError;
const cleanupUploadedFile = (filePath) => {
    try {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            logger_1.logger.info(`Cleaned up uploaded file: ${filePath}`);
        }
    }
    catch (error) {
        logger_1.logger.error(`Error cleaning up file ${filePath}:`, error);
    }
};
exports.cleanupUploadedFile = cleanupUploadedFile;
const getFileInfo = (file) => {
    return {
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype
    };
};
exports.getFileInfo = getFileInfo;
const organizeUploadedFile = (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }
        console.log('Organizing uploaded file - req.body:', req.body);
        const { niveau, filiere, semestre, matiere, categorie } = req.body;
        console.log('File organization metadata:', { niveau, filiere, semestre, matiere, categorie });
        if (!niveau || !filiere || !semestre) {
            (0, exports.cleanupUploadedFile)(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                message: 'Niveau, filière et semestre sont requis'
            });
        }
        let targetPath;
        if (categorie === 'pfe') {
            targetPath = getPFEUploadPath(niveau, filiere, semestre);
        }
        else {
            if (!matiere || !categorie) {
                (0, exports.cleanupUploadedFile)(req.file.path);
                return res.status(400).json({
                    success: false,
                    error: 'Validation Error',
                    message: 'Matière et catégorie sont requises pour les documents académiques'
                });
            }
            targetPath = getUploadPath(niveau, filiere, semestre, matiere, categorie);
        }
        const newFilePath = path_1.default.join(targetPath, req.file.filename);
        ensureDirectoryExists(targetPath);
        fs_1.default.renameSync(req.file.path, newFilePath);
        req.file.path = newFilePath;
        req.file.destination = targetPath;
        console.log(`File organized: ${req.file.path}`);
        next();
    }
    catch (error) {
        logger_1.logger.error('Error organizing uploaded file:', error);
        if (req.file) {
            (0, exports.cleanupUploadedFile)(req.file.path);
        }
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: 'Erreur lors de l\'organisation du fichier'
        });
    }
};
exports.organizeUploadedFile = organizeUploadedFile;
ensureDirectoryExists(UPLOAD_BASE_DIR);
ensureDirectoryExists(path_1.default.join(UPLOAD_BASE_DIR, 'documents'));
ensureDirectoryExists(path_1.default.join(UPLOAD_BASE_DIR, 'temp'));
//# sourceMappingURL=upload.js.map