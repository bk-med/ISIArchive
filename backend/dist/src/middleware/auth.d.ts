import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../types/auth';
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireProfesseur: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireProfessorOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireEtudiant: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireOwnershipOrAdmin: (getUserId: (req: Request) => string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map