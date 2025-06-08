import { AuditAction } from '@prisma/client';
export interface AuditLogData {
    userId?: string;
    action: AuditAction;
    resource?: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}
export interface AuditFilters {
    userId?: string;
    action?: AuditAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
}
export interface PaginationOptions {
    page?: number;
    limit?: number;
}
export declare class AuditService {
    static log(data: AuditLogData): Promise<void>;
    static getAuditLogs(filters?: AuditFilters, pagination?: PaginationOptions): Promise<{
        logs: ({
            user: {
                id: string;
                prenom: string;
                nom: string;
                email: string;
                role: import(".prisma/client").UserRole;
            } | null;
        } & import("@prisma/client/runtime").GetResult<{
            id: string;
            userId: string | null;
            action: AuditAction;
            resource: string | null;
            resourceId: string | null;
            details: import(".prisma/client").Prisma.JsonValue;
            ipAddress: string | null;
            userAgent: string | null;
            createdAt: Date;
        }, unknown, never> & {})[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    static getUserActivitySummary(userId: string, days?: number): Promise<{
        action: AuditAction;
        count: number;
    }[]>;
    static cleanupOldLogs(retentionDays?: number): Promise<void>;
    static getSystemStats(): Promise<{
        totalLogs: number;
        todayLogs: number;
        yesterdayLogs: number;
        weekLogs: number;
        topActions: {
            action: AuditAction;
            count: number;
        }[];
        topUsers: {
            userId: string | null;
            count: number;
        }[];
    }>;
}
//# sourceMappingURL=auditService.d.ts.map