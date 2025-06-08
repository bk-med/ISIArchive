// import swaggerJsdoc from 'swagger-jsdoc';
// import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { logger } from './config/logger';

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ISI Archive API',
      version: '1.0.0',
      description: 'API pour la plateforme de gestion de documents académiques ISI Tunis',
      contact: {
        name: 'ISI Archive Team',
        email: 'support@isi-archive.tn'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.isi-archive.tn',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Type d\'erreur'
            },
            message: {
              type: 'string',
              description: 'Message d\'erreur détaillé'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Horodatage de l\'erreur'
            }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'OK',
              description: 'Statut de l\'API'
            },
            message: {
              type: 'string',
              example: 'ISI Archive API is running',
              description: 'Message de statut'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Horodatage de la vérification'
            },
            environment: {
              type: 'string',
              example: 'development',
              description: 'Environnement d\'exécution'
            }
          }
        },
        ApiInfo: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'ISI Archive API',
              description: 'Nom de l\'API'
            },
            version: {
              type: 'string',
              example: '1.0.0',
              description: 'Version de l\'API'
            },
            description: {
              type: 'string',
              description: 'Description de l\'API'
            },
            endpoints: {
              type: 'object',
              description: 'Liste des endpoints disponibles'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Endpoints de vérification de santé de l\'API'
      },
      {
        name: 'Info',
        description: 'Informations générales sur l\'API'
      },
      {
        name: 'Auth',
        description: 'Authentification et autorisation'
      },
      {
        name: 'Users',
        description: 'Gestion des utilisateurs'
      },
      {
        name: 'Documents',
        description: 'Gestion des documents académiques'
      },
      {
        name: 'Filieres',
        description: 'Gestion des filières'
      },
      {
        name: 'Matieres',
        description: 'Gestion des matières'
      }
    ]
  },
  apis: ['./src/*.ts', './src/routes/*.ts'], // Chemins vers les fichiers contenant les annotations Swagger
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ISI Archive API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  }));

  // Swagger JSON
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  logger.info('📚 Swagger documentation available at: http://localhost:5001/api/docs');
};

export default specs; 