import React, { useState, useEffect, useRef } from 'react';
import {
  Activity as ActivityIcon,
  Users,
  User,
  FileText,
  Download,
  Upload,
  Eye,
  MessageSquare,
  UserPlus,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Clock,
  Shield,
  AlertCircle,
  Settings,
  LogIn,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { motion } from 'framer-motion';

interface AuditLog {
  id: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    role: string;
  };
}

interface SystemStats {
  totalLogs: number;
  todayLogs: number;
  yesterdayLogs: number;
  weekLogs: number;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  topUsers: Array<{
    userId: string;
    count: number;
  }>;
}

const Activity: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const isInitializedRef = useRef(false);
  const isLoadingRef = useRef(false);

  // Animation variants matching Dashboard
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

  useEffect(() => {
    if (user?.role === 'admin' && !isInitializedRef.current) {
      isInitializedRef.current = true;
      fetchAuditLogs();
      fetchSystemStats();
      fetchAvailableActions();
    }
  }, [user]);

  // Separate useEffect for data fetching when filters change
  useEffect(() => {
    if (user?.role === 'admin' && isInitializedRef.current) {
      fetchAuditLogs();
    }
  }, [currentPage, searchTerm, actionFilter, userFilter, dateFilter]);

  const fetchAuditLogs = async () => {
    if (isLoadingRef.current) return; // Prevent multiple simultaneous calls
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20
      };

      if (searchTerm) params.search = searchTerm;
      if (actionFilter) params.action = actionFilter;
      if (userFilter) params.userId = userFilter;
      if (dateFilter) {
        const date = new Date(dateFilter);
        params.startDate = date.toISOString();
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        params.endDate = endDate.toISOString();
      }

      const response = await api.get('/audit/logs', { params });
      setLogs(response.data.logs);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await api.get('/audit/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchAvailableActions = async () => {
    try {
      const response = await api.get('/audit/actions');
      setAvailableActions(response.data);
    } catch (error) {
      console.error('Error fetching available actions:', error);
    }
  };

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      LOGIN: <LogIn className="h-4 w-4" />,
      LOGOUT: <LogOut className="h-4 w-4" />,
      DOCUMENT_VIEW: <Eye className="h-4 w-4" />,
      DOCUMENT_DOWNLOAD: <Download className="h-4 w-4" />,
      DOCUMENT_UPLOAD: <Upload className="h-4 w-4" />,
      COMMENT_CREATE: <MessageSquare className="h-4 w-4" />,
      PAGE_ACCESS: <FileText className="h-4 w-4" />,
      USER_UPDATE: <Settings className="h-4 w-4" />,
    };
    return iconMap[action] || <ActivityIcon className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      LOGIN: 'text-green-600 bg-green-100',
      LOGOUT: 'text-red-600 bg-red-100',
      DOCUMENT_VIEW: 'text-blue-600 bg-blue-100',
      DOCUMENT_DOWNLOAD: 'text-purple-600 bg-purple-100',
      DOCUMENT_UPLOAD: 'text-orange-600 bg-orange-100',
      COMMENT_CREATE: 'text-yellow-600 bg-yellow-100',
      PAGE_ACCESS: 'text-gray-600 bg-gray-100',
      USER_UPDATE: 'text-indigo-600 bg-indigo-100',
    };
    return colorMap[action] || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      LOGIN: 'Connexion',
      LOGOUT: 'Déconnexion',
      DOCUMENT_VIEW: 'Consultation document',
      DOCUMENT_DOWNLOAD: 'Téléchargement document',
      DOCUMENT_UPLOAD: 'Upload document',
      DOCUMENT_UPDATE: 'Modification document',
      DOCUMENT_DELETE: 'Suppression document',
      DOCUMENT_RESTORE: 'Restauration document',
      COMMENT_CREATE: 'Création commentaire',
      COMMENT_UPDATE: 'Modification commentaire',
      COMMENT_DELETE: 'Suppression commentaire',
      PAGE_ACCESS: 'Accès page',
      USER_UPDATE: 'Modification utilisateur',
      PROFILE_UPDATE: 'Modification profil',
      PASSWORD_CHANGE: 'Changement mot de passe'
    };
    return actionMap[action] || action;
  };

  const formatRoleForDisplay = (role: string) => {
    switch (role) {
      case 'professeur':
        return 'enseignant(e)';
      case 'admin':
        return 'admin';
      case 'etudiant':
        return 'étudiant';
      default:
        return role;
    }
  };

  const getActivityDetails = (log: AuditLog) => {
    if (!log.details) return null;

    switch (log.action) {
      case 'DOCUMENT_VIEW':
      case 'DOCUMENT_DOWNLOAD':
      case 'DOCUMENT_UPLOAD':
      case 'DOCUMENT_UPDATE':
      case 'DOCUMENT_DELETE':
      case 'DOCUMENT_RESTORE':
        return log.details.documentTitle || log.details.responseData?.titre || 'Document';
      case 'PAGE_ACCESS':
        // Handle different page access patterns
        if (log.details.page) {
          return `Page: ${log.details.page}`;
        } else if (log.details.url) {
          // Extract page name from URL
          const urlPath = log.details.url.split('?')[0]; // Remove query params
          const pathSegments = urlPath.split('/').filter(Boolean);
          const lastSegment = pathSegments[pathSegments.length - 1];
          
          // Map common paths to readable names
          const pageMap: Record<string, string> = {
            'logs': 'Activité',
            'stats': 'Statistiques',
            'actions': 'Actions',
            'documents': 'Documents',
            'trash': 'Corbeille',
            'audit': 'Audit'
          };
          
          return `Page: ${pageMap[lastSegment] || lastSegment || 'Accueil'}`;
        }
        return 'Accès page';
      case 'LOGIN':
        return log.details.email ? `Email: ${log.details.email}` : 'Connexion';
      case 'LOGOUT':
        return 'Déconnexion';
      case 'COMMENT_CREATE':
      case 'COMMENT_UPDATE':
      case 'COMMENT_DELETE':
        return log.details.commentContent ? 
          `"${log.details.commentContent.substring(0, 50)}${log.details.commentContent.length > 50 ? '...' : ''}"` : 
          'Commentaire';
      case 'USER_CREATE':
      case 'USER_UPDATE':
        return log.details.userEmail || log.details.email || 'Utilisateur';
      case 'PROFILE_UPDATE':
        return 'Modification du profil';
      case 'PASSWORD_CHANGE':
        return 'Changement de mot de passe';
      default:
        // Try to extract meaningful info from details
        if (log.details.documentTitle) return log.details.documentTitle;
        if (log.details.email) return log.details.email;
        if (log.details.url) return `URL: ${log.details.url}`;
        return null;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <ActivityIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Accès non autorisé</h3>
        <p className="mt-1 text-sm text-gray-500">
          Cette page est réservée aux administrateurs.
        </p>
      </div>
    );
  }

  if (loading && logs.length === 0) {
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
            Chargement des logs d'activité...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div>
          <motion.h1 
            className="text-2xl font-bold text-gray-900 flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <ActivityIcon className="mr-3 h-8 w-8 text-blue-600" />
            Activité du Système
          </motion.h1>
          <motion.p 
            className="text-gray-600 mt-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Journal d'audit de toutes les activités utilisateurs
          </motion.p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <motion.div 
            variants={cardVariants}
            whileHover="hover"
            className="bg-white p-4 rounded-lg shadow border"
          >
            <div className="flex items-center">
              <ActivityIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total logs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLogs.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={cardVariants}
            whileHover="hover"
            className="bg-white p-4 rounded-lg shadow border"
          >
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Aujourd'hui</p>
                <p className="text-2xl font-bold text-green-600">{stats.todayLogs}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={cardVariants}
            whileHover="hover"
            className="bg-white p-4 rounded-lg shadow border"
          >
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Cette semaine</p>
                <p className="text-2xl font-bold text-orange-600">{stats.weekLogs}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={cardVariants}
            whileHover="hover"
            className="bg-white p-4 rounded-lg shadow border"
          >
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Évolution</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.todayLogs > stats.yesterdayLogs ? '+' : ''}
                  {((stats.todayLogs - stats.yesterdayLogs) / Math.max(stats.yesterdayLogs, 1) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Top Actions */}
      {stats && stats.topActions.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="bg-white p-6 rounded-lg shadow border"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actions les plus fréquentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topActions.slice(0, 6).map((action, index) => (
              <motion.div 
                key={action.action} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${getActionColor(action.action)}`}>
                    {getActionIcon(action.action)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{formatAction(action.action)}</p>
                    <p className="text-xs text-gray-500">#{index + 1}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-900">{action.count}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div 
        variants={itemVariants}
        className="bg-white p-4 rounded-lg shadow border"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les actions</option>
              {availableActions.map(action => (
                <option key={action} value={action}>{formatAction(action)}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setActionFilter('');
                setUserFilter('');
                setDateFilter('');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </motion.div>

      {/* Activity Log */}
      <motion.div 
        variants={itemVariants}
        className="bg-white shadow rounded-lg"
      >
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <ActivityIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune activité trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucun log d'audit ne correspond aux critères de recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Détails
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log, index) => (
                  <motion.tr 
                    key={log.id} 
                    className="hover:bg-gray-50"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {formatAction(log.action)}
                          </div>
                          {log.resource && (
                            <div className="text-xs text-gray-500">
                              {log.resource}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.user ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.user.prenom} {log.user.nom}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.user.email}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              log.user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              log.user.role === 'professeur' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {formatRoleForDisplay(log.user.role)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Système</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {getActivityDetails(log)}
                      </div>
                      {log.details && log.details.url && (
                        <div className="text-xs text-gray-500 mt-1">
                          {log.details.method} {log.details.url}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || 'N/A'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between"
        >
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> sur{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Suivant
                </button>
              </nav>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Activity; 