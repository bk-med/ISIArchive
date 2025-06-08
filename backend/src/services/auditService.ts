import { PrismaClient, AuditAction } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

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

export class AuditService {
  /**
   * Log an audit event
   */
  static async log(data: AuditLogData): Promise<void> {
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

      logger.info(`Audit log created: ${data.action} by user ${data.userId || 'system'}`);
    } catch (error) {
      logger.error('Error creating audit log:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(
    filters: AuditFilters = {},
    pagination: PaginationOptions = {}
  ) {
    try {
      const { page = 1, limit = 50 } = pagination;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

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
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(userId: string, days: number = 30) {
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
    } catch (error) {
      logger.error('Error getting user activity summary:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs (older than specified days)
   */
  static async cleanupOldLogs(retentionDays: number = 365): Promise<void> {
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

      logger.info(`Cleaned up ${result.count} old audit logs older than ${retentionDays} days`);
    } catch (error) {
      logger.error('Error cleaning up old audit logs:', error);
      throw error;
    }
  }

  /**
   * Get system statistics
   */
  static async getSystemStats() {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      const [
        totalLogs,
        todayLogs,
        yesterdayLogs,
        weekLogs,
        topActions,
        topUsers
      ] = await Promise.all([
        // Total logs
        prisma.auditLog.count(),
        
        // Today's logs
        prisma.auditLog.count({
          where: {
            createdAt: {
              gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
            }
          }
        }),
        
        // Yesterday's logs
        prisma.auditLog.count({
          where: {
            createdAt: {
              gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
              lt: new Date(today.getFullYear(), today.getMonth(), today.getDate())
            }
          }
        }),
        
        // Last week's logs
        prisma.auditLog.count({
          where: {
            createdAt: {
              gte: lastWeek
            }
          }
        }),
        
        // Top actions
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
        
        // Top users
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
    } catch (error) {
      logger.error('Error getting system stats:', error);
      throw error;
    }
  }
} 