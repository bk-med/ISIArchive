import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { UserRole } from '@prisma/client';
import { logger } from '../config/logger';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation error:', { errors, body: req.body });

      res.status(400).json({
        error: 'Validation Error',
        message: 'Données invalides',
        details: errors
      });
      return;
    }

    req.body = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Params validation error:', { errors, params: req.params });

      res.status(400).json({
        error: 'Validation Error',
        message: 'Paramètres invalides',
        details: errors
      });
      return;
    }

    req.params = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Query validation error:', { errors, query: req.query });

      res.status(400).json({
        error: 'Validation Error',
        message: 'Paramètres de requête invalides',
        details: errors
      });
      return;
    }

    req.query = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  // Authentication schemas
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Format d\'email invalide',
      'any.required': 'L\'email est requis'
    }),
    password: Joi.string().min(1).required().messages({
      'string.min': 'Le mot de passe est requis',
      'any.required': 'Le mot de passe est requis'
    })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Le token de rafraîchissement est requis'
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Le mot de passe actuel est requis'
    }),
    newPassword: Joi.string().min(8).max(128).required().messages({
      'string.min': 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      'string.max': 'Le nouveau mot de passe ne peut pas dépasser 128 caractères',
      'any.required': 'Le nouveau mot de passe est requis'
    })
  }),

  // User management schemas
  createUser: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Format d\'email invalide',
      'any.required': 'L\'email est requis'
    }),
    password: Joi.string().min(8).max(128).required().messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.max': 'Le mot de passe ne peut pas dépasser 128 caractères',
      'any.required': 'Le mot de passe est requis'
    }),
    prenom: Joi.string().min(1).max(50).required().messages({
      'string.min': 'Le prénom est requis',
      'string.max': 'Le prénom ne peut pas dépasser 50 caractères',
      'any.required': 'Le prénom est requis'
    }),
    nom: Joi.string().min(1).max(50).required().messages({
      'string.min': 'Le nom est requis',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères',
      'any.required': 'Le nom est requis'
    }),
    role: Joi.string().valid(...Object.values(UserRole)).required().messages({
      'any.only': 'Rôle invalide',
      'any.required': 'Le rôle est requis'
    }),
    filiereId: Joi.string().uuid().optional().messages({
      'string.uuid': 'ID de filière invalide'
    }),
    niveauId: Joi.string().uuid().optional().messages({
      'string.uuid': 'ID de niveau invalide'
    })
  }),

  updateUser: Joi.object({
    prenom: Joi.string().min(1).max(50).optional().messages({
      'string.min': 'Le prénom ne peut pas être vide',
      'string.max': 'Le prénom ne peut pas dépasser 50 caractères'
    }),
    nom: Joi.string().min(1).max(50).optional().messages({
      'string.min': 'Le nom ne peut pas être vide',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères'
    }),
    role: Joi.string().valid(...Object.values(UserRole)).optional().messages({
      'any.only': 'Rôle invalide'
    }),
    isActive: Joi.boolean().optional(),
    filiereId: Joi.string().uuid().allow(null).optional().messages({
      'string.uuid': 'ID de filière invalide'
    }),
    niveauId: Joi.string().uuid().allow(null).optional().messages({
      'string.uuid': 'ID de niveau invalide'
    })
  }),

  // Common parameter schemas
  uuidParam: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.uuid': 'ID invalide',
      'any.required': 'ID requis'
    })
  }),

  // Pagination and filtering schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Le numéro de page doit être un nombre',
      'number.integer': 'Le numéro de page doit être un entier',
      'number.min': 'Le numéro de page doit être supérieur à 0'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'La limite doit être un nombre',
      'number.integer': 'La limite doit être un entier',
      'number.min': 'La limite doit être supérieure à 0',
      'number.max': 'La limite ne peut pas dépasser 100'
    }),
    search: Joi.string().max(100).optional().messages({
      'string.max': 'La recherche ne peut pas dépasser 100 caractères'
    }),
    role: Joi.string().valid(...Object.values(UserRole)).optional().messages({
      'any.only': 'Rôle de filtre invalide'
    }),
    isActive: Joi.boolean().optional()
  }),

  // Academic structure schemas
  createFiliere: Joi.object({
    nom: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Le nom de la filière est requis',
      'string.max': 'Le nom de la filière ne peut pas dépasser 100 caractères',
      'any.required': 'Le nom de la filière est requis'
    }),
    code: Joi.string().min(1).max(20).required().messages({
      'string.min': 'Le code de la filière est requis',
      'string.max': 'Le code de la filière ne peut pas dépasser 20 caractères',
      'any.required': 'Le code de la filière est requis'
    }),
    niveauId: Joi.string().uuid().required().messages({
      'string.uuid': 'ID de niveau invalide',
      'any.required': 'L\'ID du niveau est requis'
    })
  }),

  updateFiliere: Joi.object({
    nom: Joi.string().min(1).max(100).optional().messages({
      'string.min': 'Le nom de la filière ne peut pas être vide',
      'string.max': 'Le nom de la filière ne peut pas dépasser 100 caractères'
    }),
    code: Joi.string().min(1).max(20).optional().messages({
      'string.min': 'Le code de la filière ne peut pas être vide',
      'string.max': 'Le code de la filière ne peut pas dépasser 20 caractères'
    }),
    niveauId: Joi.string().uuid().optional().messages({
      'string.uuid': 'ID de niveau invalide'
    })
  }),

  createMatiere: Joi.object({
    nom: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Le nom de la matière est requis',
      'string.max': 'Le nom de la matière ne peut pas dépasser 100 caractères',
      'any.required': 'Le nom de la matière est requis'
    }),
    code: Joi.string().min(1).max(20).required().messages({
      'string.min': 'Le code de la matière est requis',
      'string.max': 'Le code de la matière ne peut pas dépasser 20 caractères',
      'any.required': 'Le code de la matière est requis'
    }),
    filiereId: Joi.string().uuid().required().messages({
      'string.uuid': 'ID de filière invalide',
      'any.required': 'L\'ID de la filière est requis'
    }),
    semestreId: Joi.string().uuid().required().messages({
      'string.uuid': 'ID de semestre invalide',
      'any.required': 'L\'ID du semestre est requis'
    })
  }),

  updateMatiere: Joi.object({
    nom: Joi.string().min(1).max(100).optional().messages({
      'string.min': 'Le nom de la matière ne peut pas être vide',
      'string.max': 'Le nom de la matière ne peut pas dépasser 100 caractères'
    }),
    code: Joi.string().min(1).max(20).optional().messages({
      'string.min': 'Le code de la matière ne peut pas être vide',
      'string.max': 'Le code de la matière ne peut pas dépasser 20 caractères'
    }),
    filiereId: Joi.string().uuid().optional().messages({
      'string.uuid': 'ID de filière invalide'
    }),
    semestreId: Joi.string().uuid().optional().messages({
      'string.uuid': 'ID de semestre invalide'
    })
  }),

  assignMatiere: Joi.object({
    matiereId: Joi.string().uuid().required().messages({
      'string.uuid': 'ID de matière invalide',
      'any.required': 'L\'ID de la matière est requis'
    })
  }),

  assignMatiereWithRole: Joi.object({
    matiereId: Joi.string().uuid().required().messages({
      'string.uuid': 'ID de matière invalide',
      'any.required': 'L\'ID de la matière est requis'
    }),
    role: Joi.string().valid('cours', 'td', 'tp').required().messages({
      'any.only': 'Rôle invalide. Les rôles valides sont: cours, td, tp',
      'any.required': 'Le rôle est requis'
    })
  }),

  updateMatiereProfesseurs: Joi.object({
    professeurs: Joi.array().items(
      Joi.object({
        professeurId: Joi.string().uuid().required().messages({
          'string.uuid': 'ID de professeur invalide',
          'any.required': 'L\'ID du professeur est requis'
        }),
        roles: Joi.array().items(
          Joi.string().valid('cours', 'td', 'tp').messages({
            'any.only': 'Rôle invalide. Les rôles valides sont: cours, td, tp'
          })
        ).min(1).required().messages({
          'array.min': 'Au moins un rôle est requis',
          'any.required': 'Les rôles sont requis'
        })
      })
    ).required().messages({
      'any.required': 'La liste des professeurs est requise'
    })
  }),

  professeurMatiereParams: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.uuid': 'ID de professeur invalide',
      'any.required': 'ID de professeur requis'
    }),
    matiereId: Joi.string().uuid().required().messages({
      'string.uuid': 'ID de matière invalide',
      'any.required': 'ID de matière requis'
    })
  }),

  // Document schemas
  createDocument: Joi.object({
    titre: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Le titre du document est requis',
      'string.max': 'Le titre du document ne peut pas dépasser 200 caractères',
      'any.required': 'Le titre du document est requis'
    }),
    description: Joi.string().max(1000).optional().allow('').messages({
      'string.max': 'La description ne peut pas dépasser 1000 caractères'
    }),
    categorie: Joi.string().valid('cours', 'td', 'tp', 'examen', 'pfe').required().messages({
      'any.only': 'Catégorie invalide. Valeurs acceptées: cours, td, tp, examen, pfe',
      'any.required': 'La catégorie est requise'
    }),
    matiereId: Joi.string().uuid().optional().messages({
      'string.uuid': 'ID de matière invalide'
    }),
    matiereIds: Joi.string().optional().messages({
      'string.base': 'Les IDs de matières doivent être une chaîne JSON valide'
    }),
    niveau: Joi.string().optional(),
    filiere: Joi.string().optional(),
    semestre: Joi.string().optional(),
    matiere: Joi.string().optional()
  }),

  updateDocument: Joi.object({
    titre: Joi.string().min(1).max(200).optional().messages({
      'string.min': 'Le titre du document ne peut pas être vide',
      'string.max': 'Le titre du document ne peut pas dépasser 200 caractères'
    }),
    description: Joi.string().max(1000).optional().allow('').messages({
      'string.max': 'La description ne peut pas dépasser 1000 caractères'
    }),
    categorie: Joi.string().valid('cours', 'td', 'tp', 'examen', 'pfe').optional().messages({
      'any.only': 'Catégorie invalide. Valeurs acceptées: cours, td, tp, examen, pfe'
    }),
    matiereId: Joi.string().uuid().optional().allow(null).messages({
      'string.uuid': 'ID de matière invalide'
    })
  }),

  createPFEDocument: Joi.object({
    titre: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Le titre du document est requis',
      'string.max': 'Le titre du document ne peut pas dépasser 200 caractères',
      'any.required': 'Le titre du document est requis'
    }),
    description: Joi.string().max(1000).optional().allow('').messages({
      'string.max': 'La description ne peut pas dépasser 1000 caractères'
    }),
    anneeDiplome: Joi.number().integer().min(2000).max(new Date().getFullYear() + 10).required().messages({
      'number.base': 'L\'année de diplôme doit être un nombre',
      'number.integer': 'L\'année de diplôme doit être un entier',
      'number.min': 'L\'année de diplôme doit être supérieure à 2000',
      'number.max': 'L\'année de diplôme ne peut pas être dans le futur lointain',
      'any.required': 'L\'année de diplôme est requise'
    }),
    filiereDiplome: Joi.string().min(1).max(100).required().messages({
      'string.min': 'La filière de diplôme est requise',
      'string.max': 'La filière de diplôme ne peut pas dépasser 100 caractères',
      'any.required': 'La filière de diplôme est requise'
    }),
    titreProjet: Joi.string().min(1).max(300).required().messages({
      'string.min': 'Le titre du projet est requis',
      'string.max': 'Le titre du projet ne peut pas dépasser 300 caractères',
      'any.required': 'Le titre du projet est requis'
    }),
    resume: Joi.string().max(2000).optional().allow('').messages({
      'string.max': 'Le résumé ne peut pas dépasser 2000 caractères'
    }),
    motsCles: Joi.string().optional().messages({
      'string.base': 'Les mots-clés doivent être une chaîne de caractères séparés par des virgules'
    }),
    niveau: Joi.string().optional(),
    filiere: Joi.string().optional(),
    semestre: Joi.string().optional()
  }),

  documentQuery: Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
      'number.base': 'Le numéro de page doit être un nombre',
      'number.integer': 'Le numéro de page doit être un entier',
      'number.min': 'Le numéro de page doit être supérieur à 0'
    }),
    limit: Joi.number().integer().min(1).max(100).optional().messages({
      'number.base': 'La limite doit être un nombre',
      'number.integer': 'La limite doit être un entier',
      'number.min': 'La limite doit être supérieure à 0',
      'number.max': 'La limite ne peut pas dépasser 100'
    }),
    matiereId: Joi.string().uuid().optional().messages({
      'string.uuid': 'ID de matière invalide'
    }),
    categorie: Joi.string().valid('cours', 'td', 'tp', 'examen', 'pfe').optional().messages({
      'any.only': 'Catégorie invalide. Valeurs acceptées: cours, td, tp, examen, pfe'
    }),
    search: Joi.string().max(100).optional().messages({
      'string.max': 'Le terme de recherche ne peut pas dépasser 100 caractères'
    })
  }),

  // Comment schemas
  createComment: Joi.object({
    contenu: Joi.string().min(1).max(2000).required().messages({
      'string.min': 'Le contenu du commentaire est requis',
      'string.max': 'Le contenu du commentaire ne peut pas dépasser 2000 caractères',
      'any.required': 'Le contenu du commentaire est requis'
    }),
    parentId: Joi.string().uuid().optional().messages({
      'string.uuid': 'ID de commentaire parent invalide'
    })
  }),

  updateComment: Joi.object({
    contenu: Joi.string().min(1).max(2000).required().messages({
      'string.min': 'Le contenu du commentaire est requis',
      'string.max': 'Le contenu du commentaire ne peut pas dépasser 2000 caractères',
      'any.required': 'Le contenu du commentaire est requis'
    })
  }),

  commentQuery: Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
      'number.base': 'Le numéro de page doit être un nombre',
      'number.integer': 'Le numéro de page doit être un entier',
      'number.min': 'Le numéro de page doit être supérieur à 0'
    }),
    limit: Joi.number().integer().min(1).max(100).optional().messages({
      'number.base': 'La limite doit être un nombre',
      'number.integer': 'La limite doit être un entier',
      'number.min': 'La limite doit être supérieure à 0',
      'number.max': 'La limite ne peut pas dépasser 100'
    })
  })
}; 