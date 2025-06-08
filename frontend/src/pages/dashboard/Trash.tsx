import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trash2, 
  RotateCcw, 
  Clock, 
  AlertTriangle, 
  FileText,
  Calendar,
  User,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

interface DeletedDocument {
  id: string;
  titre: string;
  description?: string;
  categorie: string;
  nomFichier: string;
  deletedAt: string;
  uploader: {
    prenom: string;
    nom: string;
  };
  deleter?: {
    prenom: string;
    nom: string;
  };
  matiere?: {
    nom: string;
    filiere: {
      nom: string;
      niveau: {
        nom: string;
      };
    };
  };
}

interface TrashStats {
  totalDeleted: number;
  expiringSoon: number;
  recentDeletions: number;
  byCategory: Record<string, number>;
}

const Trash: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DeletedDocument[]>([]);
  const [stats, setStats] = useState<TrashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [documentToRestore, setDocumentToRestore] = useState<DeletedDocument | null>(null);

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
    fetchDeletedDocuments();
    fetchTrashStats();
  }, [currentPage, searchTerm, categoryFilter]);

  const fetchDeletedDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/trash/documents', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm || undefined,
          category: categoryFilter || undefined
        }
      });
      setDocuments(response.data.documents);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching deleted documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrashStats = async () => {
    try {
      const response = await api.get('/trash/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching trash stats:', error);
    }
  };

  const openRestoreModal = (document: DeletedDocument) => {
    setDocumentToRestore(document);
    setShowRestoreModal(true);
  };

  const handleRestore = async () => {
    if (!documentToRestore) return;

    try {
      setRestoring(documentToRestore.id);
      await api.post(`/trash/documents/${documentToRestore.id}/restore`);
      
      // Remove from list and update stats
      setDocuments(docs => docs.filter(doc => doc.id !== documentToRestore.id));
      fetchTrashStats();
      
      // Show success message
      toast.success('Document restauré avec succès!');
      setShowRestoreModal(false);
      setDocumentToRestore(null);
    } catch (error: any) {
      console.error('Error restoring document:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la restauration');
    } finally {
      setRestoring(null);
    }
  };

  const getDaysUntilExpiry = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const expiryDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      cours: 'bg-blue-100 text-blue-800',
      td: 'bg-green-100 text-green-800',
      tp: 'bg-purple-100 text-purple-800',
      examen: 'bg-red-100 text-red-800',
      pfe: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading && documents.length === 0) {
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
            Chargement de la corbeille...
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
            <Trash2 className="mr-3 h-8 w-8 text-red-600" />
            Corbeille
          </motion.h1>
          <motion.p 
            className="text-gray-600 mt-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Documents supprimés - Récupération possible pendant 30 jours
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
              <Trash2 className="h-8 w-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total supprimés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeleted}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={cardVariants}
            whileHover="hover"
            className="bg-white p-4 rounded-lg shadow border"
          >
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Expirent bientôt</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={cardVariants}
            whileHover="hover"
            className="bg-white p-4 rounded-lg shadow border"
          >
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Récents (7j)</p>
                <p className="text-2xl font-bold text-blue-600">{stats.recentDeletions}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={cardVariants}
            whileHover="hover"
            className="bg-white p-4 rounded-lg shadow border"
          >
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Catégories</p>
                <p className="text-2xl font-bold text-green-600">
                  {Object.keys(stats.byCategory).length}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div 
        variants={itemVariants}
        className="bg-white p-4 rounded-lg shadow border"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher dans la corbeille..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les catégories</option>
              <option value="cours">Cours</option>
              <option value="td">TD</option>
              <option value="tp">TP</option>
              <option value="examen">Examen</option>
              <option value="pfe">PFE</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Documents List */}
      <motion.div 
        variants={itemVariants}
        className="bg-white shadow rounded-lg"
      >
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun document supprimé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Vos documents supprimés apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supprimé le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expire dans
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((document, index) => {
                  const daysLeft = getDaysUntilExpiry(document.deletedAt);
                  const isExpiringSoon = daysLeft <= 7;
                  
                  return (
                    <motion.tr 
                      key={document.id} 
                      className="hover:bg-gray-50"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {document.titre}
                            </div>
                            <div className="text-sm text-gray-500">
                              {document.nomFichier}
                            </div>
                            {document.matiere && (
                              <div className="text-xs text-gray-400">
                                {document.matiere.filiere.niveau.nom} - {document.matiere.filiere.nom} - {document.matiere.nom}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(document.categorie)}`}>
                          {document.categorie.toUpperCase()}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(document.deletedAt)}
                        </div>
                        {document.deleter && (
                          <div className="text-xs text-gray-400 flex items-center mt-1">
                            <User className="h-3 w-3 mr-1" />
                            par {document.deleter.prenom} {document.deleter.nom}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center text-sm ${isExpiringSoon ? 'text-red-600' : 'text-gray-500'}`}>
                          <Clock className="h-4 w-4 mr-1" />
                          {daysLeft} jour{daysLeft !== 1 ? 's' : ''}
                          {isExpiringSoon && (
                            <AlertTriangle className="h-4 w-4 ml-2 text-orange-500" />
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openRestoreModal(document)}
                          disabled={restoring === document.id || daysLeft === 0}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {restoring === document.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <RotateCcw className="h-4 w-4 mr-2" />
                          )}
                          {daysLeft === 0 ? 'Expiré' : 'Restaurer'}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
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

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setDocumentToRestore(null);
        }}
        title="Confirmer la restauration"
      >
        {documentToRestore && (
          <div className="space-y-4">
            <p className="text-secondary-600">
              Êtes-vous sûr de vouloir restaurer le document{' '}
              <strong>{documentToRestore.titre}</strong> ?
            </p>
            <p className="text-sm text-blue-600">
              Le document sera restauré et redeviendra accessible à tous les utilisateurs autorisés.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRestoreModal(false);
                  setDocumentToRestore(null);
                }}
                disabled={restoring === documentToRestore.id}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleRestore}
                disabled={restoring === documentToRestore.id}
              >
                {restoring === documentToRestore.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Restauration...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurer
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default Trash; 