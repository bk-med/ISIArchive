/// <reference types="cookie-parser" />
import { Request, Response, NextFunction } from 'express';
import { AuditLogData } from '../services/auditService';
import { AuditAction } from '@prisma/client';
declare global {
    namespace Express {
        interface Request {
            auditData?: Partial<AuditLogData>;
        }
    }
}
export declare const auditMiddleware: (action: AuditAction, resource?: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare function logAuditEvent(userId: string | undefined, action: AuditAction, resource?: string, resourceId?: string, details?: any, req?: Request): Promise<void>;
//# sourceMappingURL=auditMiddleware.d.ts.map