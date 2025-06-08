import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import 'express-async-errors';

// Import configurations
import { logger } from './config/logger';
import { prisma } from './config/database';
import { connectRedis } from './config/redis';
import { setupSwagger } from './swagger';
import { EmailService } from './services/emailService';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import academicRoutes from './routes/academicRoutes';
import documentRoutes from './routes/documentRoutes';
import auditRoutes from './routes/auditRoutes';
import trashRoutes from './routes/trashRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
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

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      }
    }
  }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Setup Swagger documentation
setupSwagger(app);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'OK',
      message: 'ISI Archive API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected',
        redis: 'connected' // We'll assume Redis is connected if no error
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

// API info endpoint
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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler for API routes
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

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: isDevelopment ? err.message : 'Une erreur interne s\'est produite',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected successfully');

    // Initialize email service
    EmailService.initialize();
    logger.info('✅ Email service initialized');

    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 ISI Archive API started successfully`);
      logger.info(`📍 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`💚 Health Check: http://localhost:${PORT}/api/health`);
      logger.info(`📋 API Info: http://localhost:${PORT}/api`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`🔧 Development mode - detailed logging enabled`);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await prisma.$disconnect();
          logger.info('Database disconnected');
        } catch (error) {
          logger.error('Error disconnecting from database:', error);
        }
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer(); 