"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
require("express-async-errors");
const logger_1 = require("./config/logger");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const swagger_1 = require("./swagger");
const emailService_1 = require("./services/emailService");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const academicRoutes_1 = __importDefault(require("./routes/academicRoutes"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const trashRoutes_1 = __importDefault(require("./routes/trashRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use((0, compression_1.default)());
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined', {
        stream: {
            write: (message) => {
                logger_1.logger.info(message.trim());
            }
        }
    }));
}
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
(0, swagger_1.setupSwagger)(app);
app.get('/api/health', async (req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'OK',
            message: 'ISI Archive API is running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: 'connected',
                redis: 'connected'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'ERROR',
            message: 'Service unavailable',
            timestamp: new Date().toISOString(),
            error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
        });
    }
});
app.get('/api', (req, res) => {
    res.json({
        name: 'ISI Archive API',
        version: '1.0.0',
        description: 'API pour la plateforme de gestion de documents académiques ISI Tunis',
        phase: 'Phase 2 - Système de Gestion de Documents',
        features: [
            'Authentification JWT avec refresh tokens',
            'Gestion des utilisateurs avec RBAC',
            'Contrôle d\'accès basé sur les rôles',
            'Gestion de documents avec upload',
            'Système de fichiers organisé',
            'Documents PFE pour étudiants terminaux',
            'Validation des données',
            'Rate limiting',
            'Logging structuré',
            'Documentation Swagger',
            'Réinitialisation de mot de passe par email'
        ],
        endpoints: {
            health: '/api/health',
            docs: '/api/docs',
            auth: '/api/auth',
            users: '/api/users',
            academic: '/api/academic',
            documents: '/api/documents',
            audit: '/api/audit',
            trash: '/api/trash',
            dashboard: '/api/dashboard'
        },
        roles: ['etudiant', 'professeur', 'admin'],
        authentication: {
            type: 'Bearer Token (JWT)',
            accessTokenExpiry: process.env.JWT_EXPIRES_IN || '15m',
            refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        }
    });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/academic', academicRoutes_1.default);
app.use('/api/documents', documentRoutes_1.default);
app.use('/api/audit', auditRoutes_1.default);
app.use('/api/trash', trashRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint Not Found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableEndpoints: {
            info: '/api',
            health: '/api/health',
            docs: '/api/docs',
            auth: '/api/auth',
            users: '/api/users',
            academic: '/api/academic',
            documents: '/api/documents',
            audit: '/api/audit',
            trash: '/api/trash',
            dashboard: '/api/dashboard'
        }
    });
});
app.use((err, req, res, _next) => {
    logger_1.logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(err.status || 500).json({
        success: false,
        error: err.name || 'Internal Server Error',
        message: isDevelopment ? err.message : 'Une erreur interne s\'est produite',
        ...(isDevelopment && { stack: err.stack })
    });
});
const startServer = async () => {
    try {
        await database_1.prisma.$connect();
        logger_1.logger.info('✅ Database connected successfully');
        await (0, redis_1.connectRedis)();
        logger_1.logger.info('✅ Redis connected successfully');
        emailService_1.EmailService.initialize();
        logger_1.logger.info('✅ Email service initialized');
        const server = app.listen(PORT, () => {
            logger_1.logger.info(`🚀 ISI Archive API started successfully`);
            logger_1.logger.info(`📍 Server running on port ${PORT}`);
            logger_1.logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger_1.logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
            logger_1.logger.info(`💚 Health Check: http://localhost:${PORT}/api/health`);
            logger_1.logger.info(`📋 API Info: http://localhost:${PORT}/api`);
            if (process.env.NODE_ENV === 'development') {
                logger_1.logger.info(`🔧 Development mode - detailed logging enabled`);
            }
        });
        const gracefulShutdown = (signal) => {
            logger_1.logger.info(`${signal} received, starting graceful shutdown...`);
            server.close(async () => {
                logger_1.logger.info('HTTP server closed');
                try {
                    await database_1.prisma.$disconnect();
                    logger_1.logger.info('Database disconnected');
                }
                catch (error) {
                    logger_1.logger.error('Error disconnecting from database:', error);
                }
                logger_1.logger.info('Graceful shutdown completed');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
startServer();
//# sourceMappingURL=index.js.map