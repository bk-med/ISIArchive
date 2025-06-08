import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

/**
 * Get admin dashboard data
 */
export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if user is admin
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé',
        message: 'Seuls les administrateurs peuvent accéder à ce dashboard'
      });
    }

    // Get current date and date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // Get user statistics
    const [totalUsers, activeUsers, newUsersThisMonth, newUsersLastMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ 
        where: { 
          isActive: true 
        } 
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      })
    ]);

    // Get document statistics
    const [totalDocuments, documentsThisMonth, documentsLastMonth, deletedDocuments] = await Promise.all([
      prisma.document.count(),
      prisma.document.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.document.count({
        where: {
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      prisma.document.count({ where: { isDeleted: true } })
    ]);

    // Get academic structure statistics
    const [totalFilieres, totalMatieres, totalNiveaux] = await Promise.all([
      prisma.filiere.count(),
      prisma.matiere.count(),
      prisma.niveau.count()
    ]);

    // Get recent activity statistics
    const [totalAuditLogs, recentLogins, systemActivity] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: {
          action: 'LOGIN',
          createdAt: { gte: startOfWeek }
        }
      }),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      })
    ]);

    // Calculate percentage changes
    const userGrowth = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
      : newUsersThisMonth > 0 ? '100' : '0';

    const documentGrowth = documentsLastMonth > 0
      ? ((documentsThisMonth - documentsLastMonth) / documentsLastMonth * 100).toFixed(1)
      : documentsThisMonth > 0 ? '100' : '0';

    // Get role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    // Get recent activities for timeline
    const recentActivities = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            prenom: true,
            nom: true,
            role: true
          }
        }
      }
    });

    // Get top active users
    const topActiveUsers = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startOfMonth }
      },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 5
    });

    const topActiveUsersWithDetails = await Promise.all(
      topActiveUsers.map(async (user) => {
        if (!user.userId) return null;
        const userDetails = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { prenom: true, nom: true, role: true }
        });
        return {
          ...userDetails,
          activityCount: user._count.userId
        };
      })
    );

    const dashboardData = {
      stats: {
        totalUsers,
        activeUsers,
        totalDocuments,
        totalFilieres,
        userGrowth: `${userGrowth}%`,
        documentGrowth: `${documentGrowth}%`,
        systemActivity,
        deletedDocuments
      },
      charts: {
        roleDistribution: roleDistribution.map(role => ({
          role: role.role,
          count: role._count.role
        })),
        userGrowthTrend: [
          newUsersLastMonth || 0,
          newUsersThisMonth || 0
        ]
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        user: activity.user ? `${activity.user.prenom} ${activity.user.nom}` : 'Utilisateur supprimé',
        userRole: activity.user?.role,
        createdAt: activity.createdAt,
        details: activity.details
      })),
      topActiveUsers: topActiveUsersWithDetails.filter(user => user !== null),
      systemHealth: {
        totalAuditLogs,
        recentLogins,
        activeUsers,
        systemUptime: process.uptime()
      }
    };

    return res.json({
      success: true,
      message: 'Dashboard admin récupéré avec succès',
      data: dashboardData
    });

  } catch (error) {
    logger.error('Error fetching admin dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les données du dashboard'
    });
  }
};

/**
 * Get professor dashboard data
 */
export const getProfessorDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if user is professor
    if (userRole !== 'professeur') {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé',
        message: 'Seuls les professeurs peuvent accéder à ce dashboard'
      });
    }

    // Get current date and date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get professor's document IDs efficiently in one query
    const professorDocuments = await prisma.document.findMany({
      where: {
        telchargePar: userId!,
        isDeleted: false
      },
      select: {
        id: true
      }
    });

    const documentIds = professorDocuments.map(doc => doc.id);

    // Get professor's documents statistics
    const [myDocuments, documentsThisMonth, documentsLastMonth] = await Promise.all([
      Promise.resolve(professorDocuments.length), // We already have the count
      prisma.document.count({
        where: {
          telchargePar: userId!,
          isDeleted: false,
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.document.count({
        where: {
          telchargePar: userId!,
          isDeleted: false,
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      })
    ]);

    // Get professor's assigned subjects
    const assignedMatieres = await prisma.professeurMatiere.count({
      where: {
        professeurId: userId!
      }
    });

    // Get download statistics for professor's documents using the document IDs
    const [totalDownloads, downloadsThisMonth, downloadsLastMonth] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: 'DOCUMENT_DOWNLOAD',
          resourceId: { in: documentIds }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: 'DOCUMENT_DOWNLOAD',
          resourceId: { in: documentIds },
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: 'DOCUMENT_DOWNLOAD',
          resourceId: { in: documentIds },
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      })
    ]);

    // Get views for professor's documents using the document IDs
    const [totalViews, viewsThisMonth] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: 'DOCUMENT_VIEW',
          resourceId: { in: documentIds }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: 'DOCUMENT_VIEW',
          resourceId: { in: documentIds },
          createdAt: { gte: startOfMonth }
        }
      })
    ]);

    // Get recent comments on professor's documents
    const recentComments = await prisma.commentaire.count({
      where: {
        document: {
          telchargePar: userId!,
          isDeleted: false
        },
        isDeleted: false,
        createdAt: { gte: startOfMonth }
      }
    });

    // Calculate growth percentages
    const documentGrowth = documentsLastMonth > 0
      ? ((documentsThisMonth - documentsLastMonth) / documentsLastMonth * 100).toFixed(1)
      : documentsThisMonth > 0 ? '100' : '0';

    const downloadGrowth = downloadsLastMonth > 0
      ? ((downloadsThisMonth - downloadsLastMonth) / downloadsLastMonth * 100).toFixed(1)
      : downloadsThisMonth > 0 ? '100' : '0';

    // Get professor's most popular documents
    const popularDocuments = await prisma.document.findMany({
      where: {
        telchargePar: userId!,
        isDeleted: false
      },
      select: {
        id: true,
        titre: true,
        createdAt: true,
        downloadCount: true,
        viewCount: true
      },
      orderBy: [
        { downloadCount: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5
    });

    // Get recent activity on professor's documents
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        OR: [
          {
            action: 'DOCUMENT_VIEW',
            resourceId: { in: documentIds }
          },
          {
            action: 'DOCUMENT_DOWNLOAD',
            resourceId: { in: documentIds }
          }
        ],
        createdAt: { gte: startOfMonth }
      },
      include: {
        user: {
          select: {
            prenom: true,
            nom: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get document titles for the recent activity
    const activityWithDocuments = await Promise.all(
      recentActivity.map(async (activity) => {
        const document = activity.resourceId ? await prisma.document.findUnique({
          where: { id: activity.resourceId },
          select: { titre: true }
        }) : null;
        
        return {
          id: activity.id,
          action: activity.action,
          user: activity.user ? `${activity.user.prenom} ${activity.user.nom}` : 'Utilisateur supprimé',
          userRole: activity.user?.role,
          createdAt: activity.createdAt,
          documentTitle: document?.titre || 'Document supprimé'
        };
      })
    );

    const dashboardData = {
      stats: {
        myDocuments,
        assignedMatieres,
        totalDownloads,
        totalViews,
        documentGrowth: `${documentGrowth}%`,
        downloadGrowth: `${downloadGrowth}%`,
        recentComments,
        documentsThisMonth
      },
      popularDocuments,
      recentActivity: activityWithDocuments,
      monthlyStats: {
        documentsThisMonth,
        downloadsThisMonth,
        viewsThisMonth
      }
    };

    return res.json({
      success: true,
      message: 'Dashboard professeur récupéré avec succès',
      data: dashboardData
    });

  } catch (error) {
    logger.error('Error fetching professor dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les données du dashboard'
    });
  }
};

/**
 * Get student dashboard data
 */
export const getStudentDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if user is student
    if (userRole !== 'etudiant') {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé',
        message: 'Seuls les étudiants peuvent accéder à ce dashboard'
      });
    }

    // Get current date and date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get student's activity statistics
    const [documentsViewed, documentsDownloaded, viewsThisMonth, downloadsThisMonth] = await Promise.all([
      prisma.auditLog.count({
        where: {
          userId,
          action: 'DOCUMENT_VIEW'
        }
      }),
      prisma.auditLog.count({
        where: {
          userId,
          action: 'DOCUMENT_DOWNLOAD'
        }
      }),
      prisma.auditLog.count({
        where: {
          userId,
          action: 'DOCUMENT_VIEW',
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.auditLog.count({
        where: {
          userId,
          action: 'DOCUMENT_DOWNLOAD',
          createdAt: { gte: startOfMonth }
        }
      })
    ]);

    // Get last month's statistics for comparison
    const [viewsLastMonth, downloadsLastMonth] = await Promise.all([
      prisma.auditLog.count({
        where: {
          userId,
          action: 'DOCUMENT_VIEW',
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      prisma.auditLog.count({
        where: {
          userId,
          action: 'DOCUMENT_DOWNLOAD',
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      })
    ]);

    // Get student's favorite documents (most viewed by this student)
    const favoriteDocuments = await prisma.auditLog.groupBy({
      by: ['resourceId'],
      where: {
        userId,
        action: 'DOCUMENT_VIEW',
        resourceId: { not: null }
      },
      _count: { resourceId: true },
      orderBy: { _count: { resourceId: 'desc' } },
      take: 5
    });

    const favoriteDocumentsWithDetails = await Promise.all(
      favoriteDocuments.map(async (fav) => {
        const document = await prisma.document.findUnique({
          where: { id: fav.resourceId! },
          select: {
            id: true,
            titre: true,
            description: true,
            matiere: {
              select: { nom: true }
            },
            uploader: {
              select: { prenom: true, nom: true }
            }
          }
        });
        return {
          ...document,
          viewCount: fav._count.resourceId
        };
      })
    );

    // Get recently viewed documents
    const recentlyViewed = await prisma.auditLog.findMany({
      where: {
        userId,
        action: 'DOCUMENT_VIEW',
        resourceId: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      distinct: ['resourceId']
    });

    const recentlyViewedWithDetails = await Promise.all(
      recentlyViewed.map(async (view) => {
        const document = await prisma.document.findUnique({
          where: { id: view.resourceId! },
          select: {
            id: true,
            titre: true,
            description: true,
            matiere: {
              select: { nom: true }
            },
            uploader: {
              select: { prenom: true, nom: true }
            }
          }
        });
        return {
          ...document,
          viewedAt: view.createdAt
        };
      })
    );

    // Calculate growth percentages
    const viewGrowth = viewsLastMonth > 0
      ? ((viewsThisMonth - viewsLastMonth) / viewsLastMonth * 100).toFixed(1)
      : viewsThisMonth > 0 ? '100' : '0';

    const downloadGrowth = downloadsLastMonth > 0
      ? ((downloadsThisMonth - downloadsLastMonth) / downloadsLastMonth * 100).toFixed(1)
      : downloadsThisMonth > 0 ? '100' : '0';

    // Get learning streak (consecutive days with activity)
    const learningStreak = await calculateLearningStreak(userId!);

    // Get recommended documents (popular documents)
    const recommendedDocuments = await prisma.document.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        titre: true,
        description: true,
        matiere: {
          select: { nom: true }
        },
        uploader: {
          select: { prenom: true, nom: true }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: 5
    });

    const dashboardData = {
      stats: {
        documentsViewed,
        documentsDownloaded,
        viewsThisMonth,
        downloadsThisMonth,
        viewGrowth: `${viewGrowth}%`,
        downloadGrowth: `${downloadGrowth}%`,
        learningStreak,
        favoriteCount: favoriteDocuments.length
      },
      favoriteDocuments: favoriteDocumentsWithDetails.filter(doc => doc.id),
      recentlyViewed: recentlyViewedWithDetails.filter(doc => doc.id),
      recommendedDocuments,
      learningActivity: {
        thisMonth: viewsThisMonth + downloadsThisMonth,
        lastMonth: viewsLastMonth + downloadsLastMonth,
        totalActivity: documentsViewed + documentsDownloaded
      }
    };

    return res.json({
      success: true,
      message: 'Dashboard étudiant récupéré avec succès',
      data: dashboardData
    });

  } catch (error) {
    logger.error('Error fetching student dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les données du dashboard'
    });
  }
};

/**
 * Calculate learning streak for a student
 */
async function calculateLearningStreak(userId: string): Promise<number> {
  try {
    const activities = await prisma.auditLog.findMany({
      where: {
        userId,
        action: { in: ['DOCUMENT_VIEW', 'DOCUMENT_DOWNLOAD'] }
      },
      select: {
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (activities.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const activityDates = new Set(
      activities.map(activity => {
        const date = new Date(activity.createdAt);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    // Check if there's activity today or yesterday to start the streak
    const today = currentDate.getTime();
    const yesterday = today - (24 * 60 * 60 * 1000);

    if (!activityDates.has(today) && !activityDates.has(yesterday)) {
      return 0;
    }

    // Start from yesterday if no activity today
    if (!activityDates.has(today)) {
      currentDate.setTime(yesterday);
    }

    // Count consecutive days
    while (activityDates.has(currentDate.getTime())) {
      streak++;
      currentDate.setTime(currentDate.getTime() - (24 * 60 * 60 * 1000));
    }

    return streak;
  } catch (error) {
    logger.error('Error calculating learning streak:', error);
    return 0;
  }
} 