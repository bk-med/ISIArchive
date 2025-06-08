"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
const prisma = new client_1.PrismaClient();
class AuditService {
    static async log(data) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: data.userId,
                    action: data.action,
                    resource: data.resource,
                    resourceId: data.resourceId,
                    details: data.details,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                }
            });
            logger_1.logger.info(`Audit log created: ${data.action} by user ${data.userId || 'system'}`);
        }
        catch (error) {
            logger_1.logger.error('Error creating audit log:', error);
        }
    }
    static async getAuditLogs(filters = {}, pagination = {}) {
        try {
            const { page = 1, limit = 50 } = pagination;
            const skip = (page - 1) * limit;
            const whereClause = {};
            if (filters.userId) {
                whereClause.userId = filters.userId;
            }
            if (filters.action) {
                whereClause.action = filters.action;
            }
            if (filters.resource) {
                whereClause.resource = filters.resource;
            }
            if (filters.startDate || filters.endDate) {
                whereClause.createdAt = {};
                if (filters.startDate) {
                    whereClause.createdAt.gte = filters.startDate;
                }
                if (filters.endDate) {
                    whereClause.createdAt.lte = filters.endDate;
                }
            }
            if (filters.search) {
                whereClause.OR = [
                    { resource: { contains: filters.search, mode: 'insensitive' } },
                    { user: { prenom: { contains: filters.search, mode: 'insensitive' } } },
                    { user: { nom: { contains: filters.search, mode: 'insensitive' } } },
                    { user: { email: { contains: filters.search, mode: 'insensitive' } } }
                ];
            }
            const [logs, total] = await Promise.all([
                prisma.auditLog.findMany({
                    where: whereClause,
                    include: {
                        user: {
                            select: {
                                id: true,
                                prenom: true,
                                nom: true,
                                email: true,
                                role: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    skip,
                    take: limit
                }),
                prisma.auditLog.count({ where: whereClause })
            ]);
            return {
                logs,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting audit logs:', error);
            throw error;
        }
    }
    static async getUserActivitySummary(userId, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const activities = await prisma.auditLog.groupBy({
                by: ['action'],
                where: {
                    userId,
                    createdAt: {
                        gte: startDate
                    }
                },
                _count: {
                    action: true
                }
            });
            return activities.map(activity => ({
                action: activity.action,
                count: activity._count.action
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting user activity summary:', error);
            throw error;
        }
    }
    static async cleanupOldLogs(retentionDays = 365) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            const result = await prisma.auditLog.deleteMany({
                where: {
                    createdAt: {
                        lt: cutoffDate
                    }
                }
            });
            logger_1.logger.info(`Cleaned up ${result.count} old audit logs older than ${retentionDays} days`);
        }
        catch (error) {
            logger_1.logger.error('Error cleaning up old audit logs:', error);
            throw error;
        }
    }
    static async getSystemStats() {
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);
            const [totalLogs, todayLogs, yesterdayLogs, weekLogs, topActions, topUsers] = await Promise.all([
                prisma.auditLog.count(),
                prisma.auditLog.count({
                    where: {
                        createdAt: {
                            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
                        }
                    }
                }),
                prisma.auditLog.count({
                    where: {
                        createdAt: {
                            gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
                            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate())
                        }
                    }
                }),
                prisma.auditLog.count({
                    where: {
                        createdAt: {
                            gte: lastWeek
                        }
                    }
                }),
                prisma.auditLog.groupBy({
                    by: ['action'],
                    _count: {
                        action: true
                    },
                    orderBy: {
                        _count: {
                            action: 'desc'
                        }
                    },
                    take: 10
                }),
                prisma.auditLog.groupBy({
                    by: ['userId'],
                    where: {
                        userId: {
                            not: null
                        }
                    },
                    _count: {
                        userId: true
                    },
                    orderBy: {
                        _count: {
                            userId: 'desc'
                        }
                    },
                    take: 10
                })
            ]);
            return {
                totalLogs,
                todayLogs,
                yesterdayLogs,
                weekLogs,
                topActions: topActions.map(action => ({
                    action: action.action,
                    count: action._count.action
                })),
                topUsers: topUsers.map(user => ({
                    userId: user.userId,
                    count: user._count.userId
                }))
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting system stats:', error);
            throw error;
        }
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=auditService.js.map