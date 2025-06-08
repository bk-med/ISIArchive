"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentDashboard = exports.getProfessorDashboard = exports.getAdminDashboard = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
const prisma = new client_1.PrismaClient();
const getAdminDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Accès refusé',
                message: 'Seuls les administrateurs peuvent accéder à ce dashboard'
            });
        }
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
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
        const [totalFilieres, totalMatieres, totalNiveaux] = await Promise.all([
            prisma.filiere.count(),
            prisma.matiere.count(),
            prisma.niveau.count()
        ]);
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
        const userGrowth = newUsersLastMonth > 0
            ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
            : newUsersThisMonth > 0 ? '100' : '0';
        const documentGrowth = documentsLastMonth > 0
            ? ((documentsThisMonth - documentsLastMonth) / documentsLastMonth * 100).toFixed(1)
            : documentsThisMonth > 0 ? '100' : '0';
        const roleDistribution = await prisma.user.groupBy({
            by: ['role'],
            _count: { role: true }
        });
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
        const topActiveUsers = await prisma.auditLog.groupBy({
            by: ['userId'],
            where: {
                createdAt: { gte: startOfMonth }
            },
            _count: { userId: true },
            orderBy: { _count: { userId: 'desc' } },
            take: 5
        });
        const topActiveUsersWithDetails = await Promise.all(topActiveUsers.map(async (user) => {
            if (!user.userId)
                return null;
            const userDetails = await prisma.user.findUnique({
                where: { id: user.userId },
                select: { prenom: true, nom: true, role: true }
            });
            return {
                ...userDetails,
                activityCount: user._count.userId
            };
        }));
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching admin dashboard:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            message: 'Impossible de récupérer les données du dashboard'
        });
    }
};
exports.getAdminDashboard = getAdminDashboard;
const getProfessorDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (userRole !== 'professeur') {
            return res.status(403).json({
                success: false,
                error: 'Accès refusé',
                message: 'Seuls les professeurs peuvent accéder à ce dashboard'
            });
        }
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const [myDocuments, documentsThisMonth, documentsLastMonth] = await Promise.all([
            prisma.document.count({
                where: {
                    telchargePar: userId
                }
            }),
            prisma.document.count({
                where: {
                    telchargePar: userId,
                    createdAt: { gte: startOfMonth }
                }
            }),
            prisma.document.count({
                where: {
                    telchargePar: userId,
                    createdAt: {
                        gte: startOfLastMonth,
                        lte: endOfLastMonth
                    }
                }
            })
        ]);
        const assignedMatieres = await prisma.matiere.count();
        const totalDownloads = await prisma.auditLog.count({
            where: {
                action: 'DOCUMENT_DOWNLOAD',
                resourceId: {
                    in: await prisma.document.findMany({
                        where: { telchargePar: userId },
                        select: { id: true }
                    }).then(docs => docs.map(d => d.id))
                }
            }
        });
        const downloadsThisMonth = await prisma.auditLog.count({
            where: {
                action: 'DOCUMENT_DOWNLOAD',
                resourceId: {
                    in: await prisma.document.findMany({
                        where: { telchargePar: userId },
                        select: { id: true }
                    }).then(docs => docs.map(d => d.id))
                },
                createdAt: { gte: startOfMonth }
            }
        });
        const downloadsLastMonth = await prisma.auditLog.count({
            where: {
                action: 'DOCUMENT_DOWNLOAD',
                resourceId: {
                    in: await prisma.document.findMany({
                        where: { telchargePar: userId },
                        select: { id: true }
                    }).then(docs => docs.map(d => d.id))
                },
                createdAt: {
                    gte: startOfLastMonth,
                    lte: endOfLastMonth
                }
            }
        });
        const totalViews = await prisma.auditLog.count({
            where: {
                action: 'DOCUMENT_VIEW',
                resourceId: {
                    in: await prisma.document.findMany({
                        where: { telchargePar: userId },
                        select: { id: true }
                    }).then(docs => docs.map(d => d.id))
                }
            }
        });
        const recentComments = await prisma.commentaire.count({
            where: {
                document: {
                    telchargePar: userId
                },
                createdAt: { gte: startOfMonth }
            }
        });
        const documentGrowth = documentsLastMonth > 0
            ? ((documentsThisMonth - documentsLastMonth) / documentsLastMonth * 100).toFixed(1)
            : documentsThisMonth > 0 ? '100' : '0';
        const downloadGrowth = downloadsLastMonth > 0
            ? ((downloadsThisMonth - downloadsLastMonth) / downloadsLastMonth * 100).toFixed(1)
            : downloadsThisMonth > 0 ? '100' : '0';
        const popularDocuments = await prisma.document.findMany({
            where: {
                telchargePar: userId
            },
            select: {
                id: true,
                titre: true,
                createdAt: true
            },
            orderBy: [
                { createdAt: 'desc' }
            ],
            take: 5
        });
        const recentActivity = await prisma.auditLog.findMany({
            where: {
                OR: [
                    {
                        action: 'DOCUMENT_VIEW',
                        resourceId: {
                            in: await prisma.document.findMany({
                                where: { telchargePar: userId },
                                select: { id: true }
                            }).then(docs => docs.map(d => d.id))
                        }
                    },
                    {
                        action: 'DOCUMENT_DOWNLOAD',
                        resourceId: {
                            in: await prisma.document.findMany({
                                where: { telchargePar: userId },
                                select: { id: true }
                            }).then(docs => docs.map(d => d.id))
                        }
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
            recentActivity: recentActivity.map(activity => ({
                id: activity.id,
                action: activity.action,
                user: activity.user ? `${activity.user.prenom} ${activity.user.nom}` : 'Utilisateur supprimé',
                userRole: activity.user?.role,
                createdAt: activity.createdAt,
                documentTitle: 'Document'
            })),
            monthlyStats: {
                documentsThisMonth,
                downloadsThisMonth,
                viewsThisMonth: await prisma.auditLog.count({
                    where: {
                        action: 'DOCUMENT_VIEW',
                        resourceId: {
                            in: await prisma.document.findMany({
                                where: { telchargePar: userId },
                                select: { id: true }
                            }).then(docs => docs.map(d => d.id))
                        },
                        createdAt: { gte: startOfMonth }
                    }
                })
            }
        };
        return res.json({
            success: true,
            message: 'Dashboard professeur récupéré avec succès',
            data: dashboardData
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching professor dashboard:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            message: 'Impossible de récupérer les données du dashboard'
        });
    }
};
exports.getProfessorDashboard = getProfessorDashboard;
const getStudentDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (userRole !== 'etudiant') {
            return res.status(403).json({
                success: false,
                error: 'Accès refusé',
                message: 'Seuls les étudiants peuvent accéder à ce dashboard'
            });
        }
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
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
        const favoriteDocumentsWithDetails = await Promise.all(favoriteDocuments.map(async (fav) => {
            const document = await prisma.document.findUnique({
                where: { id: fav.resourceId },
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
        }));
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
        const recentlyViewedWithDetails = await Promise.all(recentlyViewed.map(async (view) => {
            const document = await prisma.document.findUnique({
                where: { id: view.resourceId },
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
        }));
        const viewGrowth = viewsLastMonth > 0
            ? ((viewsThisMonth - viewsLastMonth) / viewsLastMonth * 100).toFixed(1)
            : viewsThisMonth > 0 ? '100' : '0';
        const downloadGrowth = downloadsLastMonth > 0
            ? ((downloadsThisMonth - downloadsLastMonth) / downloadsLastMonth * 100).toFixed(1)
            : downloadsThisMonth > 0 ? '100' : '0';
        const learningStreak = await calculateLearningStreak(userId);
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching student dashboard:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            message: 'Impossible de récupérer les données du dashboard'
        });
    }
};
exports.getStudentDashboard = getStudentDashboard;
async function calculateLearningStreak(userId) {
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
        if (activities.length === 0)
            return 0;
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const activityDates = new Set(activities.map(activity => {
            const date = new Date(activity.createdAt);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
        }));
        const today = currentDate.getTime();
        const yesterday = today - (24 * 60 * 60 * 1000);
        if (!activityDates.has(today) && !activityDates.has(yesterday)) {
            return 0;
        }
        if (!activityDates.has(today)) {
            currentDate.setTime(yesterday);
        }
        while (activityDates.has(currentDate.getTime())) {
            streak++;
            currentDate.setTime(currentDate.getTime() - (24 * 60 * 60 * 1000));
        }
        return streak;
    }
    catch (error) {
        logger_1.logger.error('Error calculating learning streak:', error);
        return 0;
    }
}
//# sourceMappingURL=dashboardController.js.map