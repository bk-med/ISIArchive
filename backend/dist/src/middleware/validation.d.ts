import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const validate: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateParams: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const schemas: {
    login: Joi.ObjectSchema<any>;
    refreshToken: Joi.ObjectSchema<any>;
    changePassword: Joi.ObjectSchema<any>;
    createUser: Joi.ObjectSchema<any>;
    updateUser: Joi.ObjectSchema<any>;
    uuidParam: Joi.ObjectSchema<any>;
    pagination: Joi.ObjectSchema<any>;
    createFiliere: Joi.ObjectSchema<any>;
    updateFiliere: Joi.ObjectSchema<any>;
    createMatiere: Joi.ObjectSchema<any>;
    updateMatiere: Joi.ObjectSchema<any>;
    assignMatiere: Joi.ObjectSchema<any>;
    assignMatiereWithRole: Joi.ObjectSchema<any>;
    updateMatiereProfesseurs: Joi.ObjectSchema<any>;
    professeurMatiereParams: Joi.ObjectSchema<any>;
    createDocument: Joi.ObjectSchema<any>;
    updateDocument: Joi.ObjectSchema<any>;
    createPFEDocument: Joi.ObjectSchema<any>;
    documentQuery: Joi.ObjectSchema<any>;
    createComment: Joi.ObjectSchema<any>;
    updateComment: Joi.ObjectSchema<any>;
    commentQuery: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=validation.d.ts.map