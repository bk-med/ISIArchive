import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  BookOpen,
  TrendingUp,
  Download,
  Upload,
  Clock,
  Star,
  Activity,
  Shield,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MessageCircle,
  Calendar,
  BarChart3,
  Search,
  User,
  Flame,
  Target,
  Award,
  Zap,
  Heart,
  BookmarkPlus,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  description?: string;
  trend?: number[];
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
  bgColor: string;
}

interface RecentActivity {
  id: string;
  action: string;
  user?: string;
  userRole?: string;
  createdAt: string;
  documentTitle?: string;
  details?: any;
}

interface DashboardData {
  stats: any;
  charts?: any;
  recentActivities?: RecentActivity[];
  topActiveUsers?: any[];
  systemHealth?: any;
  popularDocuments?: any[];
  recentActivity?: RecentActivity[];
  monthlyStats?: any;
  favoriteDocuments?: any[];
  recentlyViewed?: any[];
  recommendedDocuments?: any[];
  learningActivity?: any;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        switch (user?.role) {
          case 'admin':
            response = await dashboardAPI.getAdminDashboard();
            break;
          case 'professeur':
            response = await dashboardAPI.getProfessorDashboard();
            break;
          case 'etudiant':
            response = await dashboardAPI.getStudentDashboard();
            break;
          default:
            throw new Error('Rôle utilisateur non reconnu');
        }
        
        setDashboardData(response.data);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error.response?.data?.message || 'Erreur lors du chargement du dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getStatsForRole = (): StatCard[] => {
    if (!dashboardData) return [];

    if (user?.role === 'admin') {
      return [
        {
          title: 'Total Utilisateurs',
          value: dashboardData.stats.totalUsers || 0,
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-500',
          change: dashboardData.stats.userGrowth || '0%',
          changeType: dashboardData.stats.userGrowth?.startsWith('-') ? 'decrease' : 'increase',
          description: 'Utilisateurs actifs',
          trend: [65, 78, 82, 95, 88, 92, 100],
        },
        {
          title: 'Documents',
          value: dashboardData.stats.totalDocuments || 0,
          icon: FileText,
          color: 'text-green-600',
          bgColor: 'bg-green-500',
          change: dashboardData.stats.documentGrowth || '0%',
          changeType: dashboardData.stats.documentGrowth?.startsWith('-') ? 'decrease' : 'increase',
          description: 'Documents disponibles',
          trend: [45, 52, 48, 61, 70, 75, 82],
        },
        {
          title: 'Filières',
          value: dashboardData.stats.totalFilieres || 0,
          icon: BookOpen,
          color: 'text-purple-600',
          bgColor: 'bg-purple-500',
          description: 'Filières disponibles',
          trend: [10, 11, 12, 13, 14, 14, 15],
        },
        {
          title: 'Activité Système',
          value: dashboardData.stats.systemActivity || 0,
          icon: TrendingUp,
          color: 'text-orange-600',
          bgColor: 'bg-orange-500',
          description: 'Actions ce mois',
          trend: [75, 78, 82, 85, 87, 88, 89],
        },
      ];
    } else if (user?.role === 'professeur') {
      return [
        {
          title: 'Mes Documents',
          value: dashboardData.stats.myDocuments || 0,
          icon: FileText,
          color: 'text-blue-600',
          bgColor: 'bg-blue-500',
          change: dashboardData.stats.documentGrowth || '0%',
          changeType: dashboardData.stats.documentGrowth?.startsWith('-') ? 'decrease' : 'increase',
          description: 'Documents publiés',
          trend: [35, 38, 40, 42, 43, 44, 45],
        },
        {
          title: 'Téléchargements',
          value: dashboardData.stats.totalDownloads || 0,
          icon: Download,
          color: 'text-green-600',
          bgColor: 'bg-green-500',
          change: dashboardData.stats.downloadGrowth || '0%',
          changeType: dashboardData.stats.downloadGrowth?.startsWith('-') ? 'decrease' : 'increase',
          description: 'Total téléchargements',
          trend: [180, 195, 210, 220, 225, 230, 234],
        },
        {
          title: 'Vues',
          value: dashboardData.stats.totalViews || 0,
          icon: Eye,
          color: 'text-purple-600',
          bgColor: 'bg-purple-500',
          description: 'Vues de documents',
          trend: [120, 135, 150, 165, 170, 175, 180],
        },
        {
          title: 'Commentaires',
          value: dashboardData.stats.recentComments || 0,
          icon: MessageCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-500',
          description: 'Nouveaux ce mois',
          trend: [8, 9, 10, 10, 11, 11, 12],
        },
      ];
    } else {
      return [
        {
          title: 'Documents Consultés',
          value: dashboardData.stats.documentsViewed || 0,
          icon: Eye,
          color: 'text-blue-600',
          bgColor: 'bg-blue-500',
          change: dashboardData.stats.viewGrowth || '0%',
          changeType: dashboardData.stats.viewGrowth?.startsWith('-') ? 'decrease' : 'increase',
          description: 'Total consultés',
          trend: [55, 58, 62, 64, 65, 66, 67],
        },
        {
          title: 'Téléchargements',
          value: dashboardData.stats.documentsDownloaded || 0,
          icon: Download,
          color: 'text-green-600',
          bgColor: 'bg-green-500',
          change: dashboardData.stats.downloadGrowth || '0%',
          changeType: dashboardData.stats.downloadGrowth?.startsWith('-') ? 'decrease' : 'increase',
          description: 'Fichiers téléchargés',
          trend: [18, 19, 20, 21, 22, 22, 23],
        },
        {
          title: 'Série d\'Apprentissage',
          value: `${dashboardData.stats.learningStreak || 0} jours`,
          icon: Flame,
          color: 'text-red-600',
          bgColor: 'bg-red-500',
          description: 'Jours consécutifs',
          trend: [1, 2, 3, 4, 5, 6, 7],
        },
        {
          title: 'Activité ce Mois',
          value: dashboardData.stats.viewsThisMonth + dashboardData.stats.downloadsThisMonth || 0,
          icon: TrendingUp,
          color: 'text-orange-600',
          bgColor: 'bg-orange-500',
          description: 'Actions ce mois',
          trend: [78, 82, 85, 88, 90, 91, 92],
        },
      ];
    }
  };

  const getQuickActions = (): QuickAction[] => {
    if (user?.role === 'admin') {
      return [
        {
          title: 'Gérer les utilisateurs',
          description: 'Créer et gérer les comptes utilisateurs',
          icon: Users,
          href: '/admin/users',
          color: 'text-blue-600',
          bgColor: 'bg-blue-500',
        },
        {
          title: 'Gérer les filières',
          description: 'Organiser les filières d\'études',
          icon: BookOpen,
          href: '/admin/filieres',
          color: 'text-green-600',
          bgColor: 'bg-green-500',
        },
        {
          title: 'Gérer les matières',
          description: 'Configurer les matières enseignées',
          icon: GraduationCap,
          href: '/admin/matieres',
          color: 'text-purple-600',
          bgColor: 'bg-purple-500',
        },
        {
          title: 'Voir l\'activité',
          description: 'Analyser l\'utilisation de la plateforme',
          icon: BarChart3,
          href: '/admin/activity',
          color: 'text-orange-600',
          bgColor: 'bg-orange-500',
        },
      ];
    } else if (user?.role === 'professeur') {
      return [
        {
          title: 'Télécharger un document',
          description: 'Ajouter un nouveau document',
          icon: Upload,
          href: '/documents/upload',
          color: 'text-blue-600',
          bgColor: 'bg-blue-500',
        },
        {
          title: 'Mes documents',
          description: 'Voir tous vos documents',
          icon: FileText,
          href: '/documents',
          color: 'text-green-600',
          bgColor: 'bg-green-500',
        },
        {
          title: 'Corbeille',
          description: 'Gérer les documents supprimés',
          icon: RefreshCw,
          href: '/trash',
          color: 'text-purple-600',
          bgColor: 'bg-purple-500',
        },
        {
          title: 'Mon profil',
          description: 'Gérer vos informations',
          icon: User,
          href: '/profile',
          color: 'text-orange-600',
          bgColor: 'bg-orange-500',
        },
      ];
    } else {
      return [
        {
          title: 'Parcourir les documents',
          description: 'Explorer les ressources disponibles',
          icon: FileText,
          href: '/documents',
          color: 'text-blue-600',
          bgColor: 'bg-blue-500',
        },
        {
          title: 'Mes favoris',
          description: 'Accéder à vos documents favoris',
          icon: Star,
          href: '/favorites',
          color: 'text-green-600',
          bgColor: 'bg-green-500',
        },
        {
          title: 'Recherche avancée',
          description: 'Trouver des documents spécifiques',
          icon: Search,
          href: '/search',
          color: 'text-purple-600',
          bgColor: 'bg-purple-500',
        },
        {
          title: 'Mon profil',
          description: 'Gérer vos informations',
          icon: User,
          href: '/profile',
          color: 'text-orange-600',
          bgColor: 'bg-orange-500',
        },
      ];
    }
  };

  const statsCards = getStatsForRole();
  const quickActions = getQuickActions();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Bonsoir';
    
    if (hour < 12) greeting = 'Bonjour';
    else if (hour < 18) greeting = 'Bon après-midi';
    
    return `${greeting}, ${user?.prenom}!`;
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return Shield;
      case 'professeur':
        return GraduationCap;
      default:
        return BookOpen;
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin':
        return 'from-red-500 to-red-600';
      case 'professeur':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-green-500 to-green-600';
    }
  };

  const MiniChart = ({ data, color }: { data: number[]; color: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    return (
      <div className="flex items-end space-x-1 h-8">
        {data.map((value, index) => {
          const height = range === 0 ? 50 : ((value - min) / range) * 100;
          return (
            <motion.div
              key={index}
              className={`w-1 ${color} rounded-full`}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 10)}%` }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.p
            className="text-secondary-600 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Chargement de votre tableau de bord...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100 rounded-2xl p-8 border border-primary-100"
      >
        {/* Background decoration */}
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 opacity-10"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <RoleIcon className="w-full h-full text-primary-600" />
        </motion.div>

        <div className="relative z-10">
          <motion.div
            className="flex items-center space-x-4 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.div
              className={`h-16 w-16 bg-gradient-to-br ${getRoleColor()} rounded-2xl flex items-center justify-center shadow-lg`}
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <RoleIcon className="h-8 w-8 text-white" />
            </motion.div>
            
            <div>
              <motion.h1
                className="text-3xl font-bold text-secondary-900"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {getWelcomeMessage()}
              </motion.h1>
              <motion.p
                className="text-secondary-600 text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Voici un aperçu de votre activité sur ISI Archive
              </motion.p>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center space-x-2 text-sm text-secondary-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants}>
        <motion.h2
          className="text-2xl font-bold text-secondary-900 mb-6 flex items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <BarChart3 className="h-6 w-6 mr-3 text-primary-600" />
          Statistiques
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.title}
                variants={cardVariants}
                whileHover="hover"
                onMouseEnter={() => setHoveredCard(stat.title)}
                onMouseLeave={() => setHoveredCard(null)}
                className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg border border-secondary-100 cursor-pointer"
                style={{ 
                  boxShadow: hoveredCard === stat.title 
                    ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                    : undefined 
                }}
              >
                {/* Background gradient */}
                <motion.div
                  className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.bgColor}/10 rounded-full -mr-12 -mt-12`}
                  animate={{
                    scale: hoveredCard === stat.title ? 1.2 : 1,
                    opacity: hoveredCard === stat.title ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.3 }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      className={`h-12 w-12 bg-gradient-to-br ${stat.bgColor} rounded-xl flex items-center justify-center shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </motion.div>
                    
                    {stat.trend && (
                      <MiniChart data={stat.trend} color={stat.bgColor} />
                    )}
                  </div>

                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  >
                    <h3 className="text-sm font-medium text-secondary-600">
                      {stat.title}
                    </h3>
                    
                    <div className="flex items-end space-x-2">
                      <motion.span
                        className="text-3xl font-bold text-secondary-900"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          delay: index * 0.1 + 0.5, 
                          duration: 0.5,
                          type: 'spring',
                          stiffness: 200 
                        }}
                      >
                        {stat.value}
                      </motion.span>
                      
                      {stat.change && (
                        <motion.div
                          className={`flex items-center text-sm font-medium ${
                            stat.changeType === 'increase' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + 0.7, duration: 0.5 }}
                        >
                          {stat.changeType === 'increase' ? (
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                          )}
                          {stat.change}
                        </motion.div>
                      )}
                    </div>
                    
                    {stat.description && (
                      <motion.p
                        className="text-xs text-secondary-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.9, duration: 0.5 }}
                      >
                        {stat.description}
                      </motion.p>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <motion.h2
          className="text-2xl font-bold text-secondary-900 mb-6 flex items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Sparkles className="h-6 w-6 mr-3 text-primary-600" />
          Actions rapides
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <motion.a
                key={action.title}
                href={action.href}
                variants={cardVariants}
                whileHover="hover"
                className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg border border-secondary-100 transition-all duration-300 hover:shadow-xl"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${action.bgColor}/5 opacity-0 group-hover:opacity-100`}
                  transition={{ duration: 0.3 }}
                />

                <div className="relative z-10">
                  <motion.div
                    className={`h-12 w-12 bg-gradient-to-br ${action.bgColor} rounded-xl flex items-center justify-center shadow-lg mb-4`}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <IconComponent className="h-6 w-6 text-white" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
                  >
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2 group-hover:text-primary-700 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-secondary-600 group-hover:text-secondary-700 transition-colors">
                      {action.description}
                    </p>
                  </motion.div>

                  <motion.div
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100"
                    initial={{ scale: 0, rotate: -90 }}
                    whileHover={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowUpRight className="h-5 w-5 text-primary-600" />
                  </motion.div>
                </div>
              </motion.a>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <motion.h2
          className="text-2xl font-bold text-secondary-900 mb-6 flex items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Activity className="h-6 w-6 mr-3 text-primary-600" />
          Activité récente
        </motion.h2>
        
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-lg border border-secondary-100"
          variants={cardVariants}
        >
          <div className="text-center py-12">
            <motion.div
              className="mx-auto w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Clock className="w-8 h-8 text-secondary-400" />
            </motion.div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Aucune activité récente
            </h3>
            <p className="text-secondary-600">
              Votre activité récente apparaîtra ici une fois que vous commencerez à utiliser la plateforme.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard; 