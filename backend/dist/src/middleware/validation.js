"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.validateQuery = exports.validateParams = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            logger_1.logger.warn('Validation error:', { errors, body: req.body });
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
exports.validate = validate;
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            logger_1.logger.warn('Params validation error:', { errors, params: req.params });
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
exports.validateParams = validateParams;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            logger_1.logger.warn('Query validation error:', { errors, query: req.query });
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
exports.validateQuery = validateQuery;
exports.schemas = {
    login: joi_1.default.object({
        email: joi_1.default.string().email().required().messages({
            'string.email': 'Format d\'email invalide',
            'any.required': 'L\'email est requis'
        }),
        password: joi_1.default.string().min(1).required().messages({
            'string.min': 'Le mot de passe est requis',
            'any.required': 'Le mot de passe est requis'
        })
    }),
    refreshToken: joi_1.default.object({
        refreshToken: joi_1.default.string().required().messages({
            'any.required': 'Le token de rafraîchissement est requis'
        })
    }),
    changePassword: joi_1.default.object({
        currentPassword: joi_1.default.string().required().messages({
            'any.required': 'Le mot de passe actuel est requis'
        }),
        newPassword: joi_1.default.string().min(8).max(128).required().messages({
            'string.min': 'Le nouveau mot de passe doit contenir au moins 8 caractères',
            'string.max': 'Le nouveau mot de passe ne peut pas dépasser 128 caractères',
            'any.required': 'Le nouveau mot de passe est requis'
        })
    }),
    createUser: joi_1.default.object({
        email: joi_1.default.string().email().required().messages({
            'string.email': 'Format d\'email invalide',
            'any.required': 'L\'email est requis'
        }),
        password: joi_1.default.string().min(8).max(128).required().messages({
            'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
            'string.max': 'Le mot de passe ne peut pas dépasser 128 caractères',
            'any.required': 'Le mot de passe est requis'
        }),
        prenom: joi_1.default.string().min(1).max(50).required().messages({
            'string.min': 'Le prénom est requis',
            'string.max': 'Le prénom ne peut pas dépasser 50 caractères',
            'any.required': 'Le prénom est requis'
        }),
        nom: joi_1.default.string().min(1).max(50).required().messages({
            'string.min': 'Le nom est requis',
            'string.max': 'Le nom ne peut pas dépasser 50 caractères',
            'any.required': 'Le nom est requis'
        }),
        role: joi_1.default.string().valid(...Object.values(client_1.UserRole)).required().messages({
            'any.only': 'Rôle invalide',
            'any.required': 'Le rôle est requis'
        }),
        filiereId: joi_1.default.string().uuid().optional().messages({
            'string.uuid': 'ID de filière invalide'
        }),
        niveauId: joi_1.default.string().uuid().optional().messages({
            'string.uuid': 'ID de niveau invalide'
        })
    }),
    updateUser: joi_1.default.object({
        prenom: joi_1.default.string().min(1).max(50).optional().messages({
            'string.min': 'Le prénom ne peut pas être vide',
            'string.max': 'Le prénom ne peut pas dépasser 50 caractères'
        }),
        nom: joi_1.default.string().min(1).max(50).optional().messages({
            'string.min': 'Le nom ne peut pas être vide',
            'string.max': 'Le nom ne peut pas dépasser 50 caractères'
        }),
        role: joi_1.default.string().valid(...Object.values(client_1.UserRole)).optional().messages({
            'any.only': 'Rôle invalide'
        }),
        isActive: joi_1.default.boolean().optional(),
        filiereId: joi_1.default.string().uuid().allow(null).optional().messages({
            'string.uuid': 'ID de filière invalide'
        }),
        niveauId: joi_1.default.string().uuid().allow(null).optional().messages({
            'string.uuid': 'ID de niveau invalide'
        })
    }),
    uuidParam: joi_1.default.object({
        id: joi_1.default.string().uuid().required().messages({
            'string.uuid': 'ID invalide',
            'any.required': 'ID requis'
        })
    }),
    pagination: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1).messages({
            'number.base': 'Le numéro de page doit être un nombre',
            'number.integer': 'Le numéro de page doit être un entier',
            'number.min': 'Le numéro de page doit être supérieur à 0'
        }),
        limit: joi_1.default.number().integer().min(1).max(100).default(10).messages({
            'number.base': 'La limite doit être un nombre',
            'number.integer': 'La limite doit être un entier',
            'number.min': 'La limite doit être supérieure à 0',
            'number.max': 'La limite ne peut pas dépasser 100'
        }),
        search: joi_1.default.string().max(100).optional().messages({
            'string.max': 'La recherche ne peut pas dépasser 100 caractères'
        }),
        role: joi_1.default.string().valid(...Object.values(client_1.UserRole)).optional().messages({
            'any.only': 'Rôle de filtre invalide'
        }),
        isActive: joi_1.default.boolean().optional()
    }),
    createFiliere: joi_1.default.object({
        nom: joi_1.default.string().min(1).max(100).required().messages({
            'string.min': 'Le nom de la filière est requis',
            'string.max': 'Le nom de la filière ne peut pas dépasser 100 caractères',
            'any.required': 'Le nom de la filière est requis'
        }),
        code: joi_1.default.string().min(1).max(20).required().messages({
            'string.min': 'Le code de la filière est requis',
            'string.max': 'Le code de la filière ne peut pas dépasser 20 caractères',
            'any.required': 'Le code de la filière est requis'
        }),
        niveauId: joi_1.default.string().uuid().required().messages({
            'string.uuid': 'ID de niveau invalide',
            'any.required': 'L\'ID du niveau est requis'
        })
    }),
    updateFiliere: joi_1.default.object({
        nom: joi_1.default.string().min(1).max(100).optional().messages({
            'string.min': 'Le nom de la filière ne peut pas être vide',
            'string.max': 'Le nom de la filière ne peut pas dépasser 100 caractères'
        }),
        code: joi_1.default.string().min(1).max(20).optional().messages({
            'string.min': 'Le code de la filière ne peut pas être vide',
            'string.max': 'Le code de la filière ne peut pas dépasser 20 caractères'
        }),
        niveauId: joi_1.default.string().uuid().optional().messages({
            'string.uuid': 'ID de niveau invalide'
        })
    }),
    createMatiere: joi_1.default.object({
        nom: joi_1.default.string().min(1).max(100).required().messages({
            'string.min': 'Le nom de la matière est requis',
            'string.max': 'Le nom de la matière ne peut pas dépasser 100 caractères',
            'any.required': 'Le nom de la matière est requis'
        }),
        code: joi_1.default.string().min(1).max(20).required().messages({
            'string.min': 'Le code de la matière est requis',
            'string.max': 'Le code de la matière ne peut pas dépasser 20 caractères',
            'any.required': 'Le code de la matière est requis'
        }),
        filiereId: joi_1.default.string().uuid().required().messages({
            'string.uuid': 'ID de filière invalide',
            'any.required': 'L\'ID de la filière est requis'
        }),
        semestreId: joi_1.default.string().uuid().required().messages({
            'string.uuid': 'ID de semestre invalide',
            'any.required': 'L\'ID du semestre est requis'
        })
    }),
    updateMatiere: joi_1.default.object({
        nom: joi_1.default.string().min(1).max(100).optional().messages({
            'string.min': 'Le nom de la matière ne peut pas être vide',
            'string.max': 'Le nom de la matière ne peut pas dépasser 100 caractères'
        }),
        code: joi_1.default.string().min(1).max(20).optional().messages({
            'string.min': 'Le code de la matière ne peut pas être vide',
            'string.max': 'Le code de la matière ne peut pas dépasser 20 caractères'
        }),
        filiereId: joi_1.default.string().uuid().optional().messages({
            'string.uuid': 'ID de filière invalide'
        }),
        semestreId: joi_1.default.string().uuid().optional().messages({
            'string.uuid': 'ID de semestre invalide'
        })
    }),
    assignMatiere: joi_1.default.object({
        matiereId: joi_1.default.string().uuid().required().messages({
            'string.uuid': 'ID de matière invalide',
            'any.required': 'L\'ID de la matière est requis'
        })
    }),
    assignMatiereWithRole: joi_1.default.object({
        matiereId: joi_1.default.string().uuid().required().messages({
            'string.uuid': 'ID de matière invalide',
            'any.required': 'L\'ID de la matière est requis'
        }),
        role: joi_1.default.string().valid('cours', 'td', 'tp').required().messages({
            'any.only': 'Rôle invalide. Les rôles valides sont: cours, td, tp',
            'any.required': 'Le rôle est requis'
        })
    }),
    updateMatiereProfesseurs: joi_1.default.object({
        professeurs: joi_1.default.array().items(joi_1.default.object({
            professeurId: joi_1.default.string().uuid().required().messages({
                'string.uuid': 'ID de professeur invalide',
                'any.required': 'L\'ID du professeur est requis'
            }),
            roles: joi_1.default.array().items(joi_1.default.string().valid('cours', 'td', 'tp').messages({
                'any.only': 'Rôle invalide. Les rôles valides sont: cours, td, tp'
            })).min(1).required().messages({
                'array.min': 'Au moins un rôle est requis',
                'any.required': 'Les rôles sont requis'
            })
        })).required().messages({
            'any.required': 'La liste des professeurs est requise'
        })
    }),
    professeurMatiereParams: joi_1.default.object({
        id: joi_1.default.string().uuid().required().messages({
            'string.uuid': 'ID de professeur invalide',
            'any.required': 'ID de professeur requis'
        }),
        matiereId: joi_1.default.string().uuid().required().messages({
            'string.uuid': 'ID de matière invalide',
            'any.required': 'ID de matière requis'
        })
    }),
    createDocument: joi_1.default.object({
        titre: joi_1.default.string().min(1).max(200).required().messages({
            'string.min': 'Le titre du document est requis',
            'string.max': 'Le titre du document ne peut pas dépasser 200 caractères',
            'any.required': 'Le titre du document est requis'
        }),
        description: joi_1.default.string().max(1000).optional().allow('').messages({
            'string.max': 'La description ne peut pas dépasser 1000 caractères'
        }),
        categorie: joi_1.default.string().valid('cours', 'td', 'tp', 'examen', 'pfe').required().messages({
            'any.only': 'Catégorie invalide. Valeurs acceptées: cours, td, tp, examen, pfe',
            'any.required': 'La catégorie est requise'
        }),
        matiereId: joi_1.default.string().uuid().optional().messages({
            'string.uuid': 'ID de matière invalide'
        }),
        niveau: joi_1.default.string().optional(),
        filiere: joi_1.default.string().optional(),
        semestre: joi_1.default.string().optional(),
        matiere: joi_1.default.string().optional()
    }),
    updateDocument: joi_1.default.object({
        titre: joi_1.default.string().min(1).max(200).optional().messages({
            'string.min': 'Le titre du document ne peut pas être vide',
            'string.max': 'Le titre du document ne peut pas dépasser 200 caractères'
        }),
        description: joi_1.default.string().max(1000).optional().allow('').messages({
            'string.max': 'La description ne peut pas dépasser 1000 caractères'
        }),
        categorie: joi_1.default.string().valid('cours', 'td', 'tp', 'examen', 'pfe').optional().messages({
            'any.only': 'Catégorie invalide. Valeurs acceptées: cours, td, tp, examen, pfe'
        }),
        matiereId: joi_1.default.string().uuid().optional().allow(null).messages({
            'string.uuid': 'ID de matière invalide'
        })
    }),
    createPFEDocument: joi_1.default.object({
        titre: joi_1.default.string().min(1).max(200).required().messages({
            'string.min': 'Le titre du document est requis',
            'string.max': 'Le titre du document ne peut pas dépasser 200 caractères',
            'any.required': 'Le titre du document est requis'
        }),
        description: joi_1.default.string().max(1000).optional().allow('').messages({
            'string.max': 'La description ne peut pas dépasser 1000 caractères'
        }),
        anneeDiplome: joi_1.default.number().integer().min(2000).max(new Date().getFullYear() + 10).required().messages({
            'number.base': 'L\'année de diplôme doit être un nombre',
            'number.integer': 'L\'année de diplôme doit être un entier',
            'number.min': 'L\'année de diplôme doit être supérieure à 2000',
            'number.max': 'L\'année de diplôme ne peut pas être dans le futur lointain',
            'any.required': 'L\'année de diplôme est requise'
        }),
        filiereDiplome: joi_1.default.string().min(1).max(100).required().messages({
            'string.min': 'La filière de diplôme est requise',
            'string.max': 'La filière de diplôme ne peut pas dépasser 100 caractères',
            'any.required': 'La filière de diplôme est requise'
        }),
        titreProjet: joi_1.default.string().min(1).max(300).required().messages({
            'string.min': 'Le titre du projet est requis',
            'string.max': 'Le titre du projet ne peut pas dépasser 300 caractères',
            'any.required': 'Le titre du projet est requis'
        }),
        resume: joi_1.default.string().max(2000).optional().allow('').messages({
            'string.max': 'Le résumé ne peut pas dépasser 2000 caractères'
        }),
        motsCles: joi_1.default.string().optional().messages({
            'string.base': 'Les mots-clés doivent être une chaîne de caractères séparés par des virgules'
        }),
        niveau: joi_1.default.string().optional(),
        filiere: joi_1.default.string().optional(),
        semestre: joi_1.default.string().optional()
    }),
    documentQuery: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).optional().messages({
            'number.base': 'Le numéro de page doit être un nombre',
            'number.integer': 'Le numéro de page doit être un entier',
            'number.min': 'Le numéro de page doit être supérieur à 0'
        }),
        limit: joi_1.default.number().integer().min(1).max(100).optional().messages({
            'number.base': 'La limite doit être un nombre',
            'number.integer': 'La limite doit être un entier',
            'number.min': 'La limite doit être supérieure à 0',
            'number.max': 'La limite ne peut pas dépasser 100'
        }),
        matiereId: joi_1.default.string().uuid().optional().messages({
            'string.uuid': 'ID de matière invalide'
        }),
        categorie: joi_1.default.string().valid('cours', 'td', 'tp', 'examen', 'pfe').optional().messages({
            'any.only': 'Catégorie invalide. Valeurs acceptées: cours, td, tp, examen, pfe'
        }),
        search: joi_1.default.string().max(100).optional().messages({
            'string.max': 'Le terme de recherche ne peut pas dépasser 100 caractères'
        })
    }),
    createComment: joi_1.default.object({
        contenu: joi_1.default.string().min(1).max(2000).required().messages({
            'string.min': 'Le contenu du commentaire est requis',
            'string.max': 'Le contenu du commentaire ne peut pas dépasser 2000 caractères',
            'any.required': 'Le contenu du commentaire est requis'
        }),
        parentId: joi_1.default.string().uuid().optional().messages({
            'string.uuid': 'ID de commentaire parent invalide'
        })
    }),
    updateComment: joi_1.default.object({
        contenu: joi_1.default.string().min(1).max(2000).required().messages({
            'string.min': 'Le contenu du commentaire est requis',
            'string.max': 'Le contenu du commentaire ne peut pas dépasser 2000 caractères',
            'any.required': 'Le contenu du commentaire est requis'
        })
    }),
    commentQuery: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).optional().messages({
            'number.base': 'Le numéro de page doit être un nombre',
            'number.integer': 'Le numéro de page doit être un entier',
            'number.min': 'Le numéro de page doit être supérieur à 0'
        }),
        limit: joi_1.default.number().integer().min(1).max(100).optional().messages({
            'number.base': 'La limite doit être un nombre',
            'number.integer': 'La limite doit être un entier',
            'number.min': 'La limite doit être supérieure à 0',
            'number.max': 'La limite ne peut pas dépasser 100'
        })
    })
};
//# sourceMappingURL=validation.js.map