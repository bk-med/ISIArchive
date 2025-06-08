import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Upload,
  BookOpen,
  Calendar,
  User,
  MessageCircle,
  Star,
  Grid,
  List,
  ChevronDown,
  FileIcon,
  GraduationCap,
  Plus,
  X,
  Loader2,
  CheckCircle,
  FileCheck,
  Trash2,
  Edit
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { documentsAPI, academicAPI } from '../../utils/api';
import { Document, Matiere, Filiere, Niveau } from '../../types';
import toast from 'react-hot-toast';
import DocumentUploadModal from '../../components/forms/DocumentUploadModal';
import { CorrectionUploadModal } from '../../components/forms/CorrectionUploadModal';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface DocumentFilters {
  search: string;
  categorie: string;
  matiereId: string;
  page: number;
  limit: number;
}

const Documents: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionParentDocument, setCorrectionParentDocument] = useState<Document | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    categorie: '',
    matiereId: '',
    page: 1,
    limit: 20
  });

  const categories = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'cours', label: 'Cours' },
    { value: 'td', label: 'TD' },
    { value: 'tp', label: 'TP' },
    { value: 'examen', label: 'Examens' },
    ...(user?.role === 'etudiant' && (user?.niveau?.nom === 'L3' || user?.niveau?.nom === '3ING' || user?.niveau?.nom === 'M2') 
      ? [{ value: 'pfe', label: 'PFE' }] : [])
  ];

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
    fetchDocuments();
    fetchMatieres();
  }, [filters]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.getDocuments({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        categorie: filters.categorie || undefined,
        matiereId: filters.matiereId || undefined
      });

      setDocuments(response.data);
      setPagination(response.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatieres = async () => {
    try {
      const response = await academicAPI.getMatieres();
      setMatieres(response.data);
    } catch (error) {
      console.error('Error fetching matieres:', error);
    }
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: keyof DocumentFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await documentsAPI.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.nomFichier;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Document téléchargé avec succès');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleView = (doc: Document) => {
    navigate(`/documents/${doc.id}`);
  };

  const handleAddCorrection = (doc: Document) => {
    setCorrectionParentDocument(doc);
    setShowCorrectionModal(true);
  };

  const handleDeleteDocument = async () => {
    if (!deletingDocument) return;

    try {
      await documentsAPI.deleteDocument(deletingDocument.id);
      toast.success('Document supprimé avec succès');
      setShowDeleteModal(false);
      setDeletingDocument(null);
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erreur lors de la suppression du document');
    }
  };

  const openDeleteModal = (doc: Document) => {
    setDeletingDocument(doc);
    setShowDeleteModal(true);
  };

  const canDeleteDocument = (doc: Document) => {
    // Only document owner or admin can delete
    return user?.role === 'admin' || doc.uploader.id === user?.id;
  };

  const canAddCorrection = (doc: Document) => {
    // Only professors and admins can add corrections
    if (user?.role !== 'professeur' && user?.role !== 'admin') return false;
    
    // Can't add correction to PFE documents or documents that already have corrections
    if (doc.categorie === 'pfe' || doc.correction || doc.correctionId) return false;
    
    return true;
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (categorie: string) => {
    switch (categorie) {
      case 'cours': return BookOpen;
      case 'td': return FileText;
      case 'tp': return FileIcon;
      case 'examen': return Calendar;
      case 'correction': return Star;
      case 'pfe': return GraduationCap;
      default: return FileText;
    }
  };

  const getCategoryColor = (categorie: string) => {
    switch (categorie) {
      case 'cours': return 'bg-blue-100 text-blue-800';
      case 'td': return 'bg-green-100 text-green-800';
      case 'tp': return 'bg-purple-100 text-purple-800';
      case 'examen': return 'bg-red-100 text-red-800';
      case 'correction': return 'bg-yellow-100 text-yellow-800';
      case 'pfe': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canUpload = user?.role === 'professeur' || user?.role === 'admin';

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
            Chargement des documents...
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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <motion.h1 
            className="text-2xl font-bold text-gray-900"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Documents
          </motion.h1>
          <motion.p 
            className="mt-1 text-sm text-gray-500"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Gérez et consultez les documents académiques
          </motion.p>
        </div>
        
        {canUpload && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUploadModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Ajouter un document
          </motion.button>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-lg shadow p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher des documents..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters.categorie}
            onChange={(e) => handleFilterChange('categorie', e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          {/* Matiere Filter */}
          <select
            value={filters.matiereId}
            onChange={(e) => handleFilterChange('matiereId', e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Toutes les matières</option>
            {matieres.map(matiere => (
              <option key={matiere.id} value={matiere.id}>
                {matiere.nom} ({matiere.code})
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Documents */}
      {documents.length === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="text-center py-12"
        >
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun document</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.categorie || filters.matiereId
              ? 'Aucun document ne correspond à vos critères de recherche.'
              : 'Aucun document disponible pour le moment.'}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {documents.map((document, index) => {
                  const CategoryIcon = getCategoryIcon(document.categorie);
                  return (
                    <motion.div
                      key={document.id}
                      variants={cardVariants}
                      whileHover="hover"
                      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <CategoryIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(document.categorie)}`}>
                              {document.categorie.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                        {document.titre}
                      </h3>

                      {document.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {document.description}
                        </p>
                      )}

                      <div className="space-y-2 mb-4">
                        {document.matiere && (
                          <div className="flex items-center text-sm text-gray-500">
                            <BookOpen className="w-4 h-4 mr-2" />
                            {document.matiere.nom}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="w-4 h-4 mr-2" />
                          {document.uploader.prenom} {document.uploader.nom}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(document.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {formatFileSize(document.tailleFichier)}
                          </span>
                          {document.correction && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Corrigé
                            </span>
                          )}
                          {document.correctionId && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <FileCheck className="w-3 h-3 mr-1" />
                              Correction
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(document)}
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canAddCorrection(document) && (
                            <button
                              onClick={() => handleAddCorrection(document)}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="Ajouter une correction"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(document)}
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {canDeleteDocument(document) && (
                            <button
                              onClick={() => openDeleteModal(document)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
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
                      Matière
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auteur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {documents.map((document, index) => {
                      const CategoryIcon = getCategoryIcon(document.categorie);
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
                              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                                <CategoryIcon className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {document.titre}
                                </div>
                                {document.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {document.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(document.categorie)}`}>
                              {document.categorie.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {document.matiere?.nom || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {document.uploader.prenom} {document.uploader.nom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(document.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleView(document)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {canAddCorrection(document) && (
                                <button
                                  onClick={() => handleAddCorrection(document)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Ajouter une correction"
                                >
                                  <FileCheck className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDownload(document)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {canDeleteDocument(document) && (
                                <button
                                  onClick={() => openDeleteModal(document)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <motion.div 
              className="flex items-center justify-between"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="text-sm text-gray-700">
                Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                {pagination.total} résultats
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFilterChange('page', pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                  Page {pagination.page} sur {pagination.pages}
                </span>
                <button
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false);
          fetchDocuments();
        }}
      />

      {/* Correction Upload Modal */}
      {correctionParentDocument && (
        <CorrectionUploadModal
          isOpen={showCorrectionModal}
          onClose={() => {
            setShowCorrectionModal(false);
            setCorrectionParentDocument(null);
          }}
          parentDocumentId={correctionParentDocument.id}
          parentDocumentTitle={correctionParentDocument.titre}
          onSuccess={() => {
            setShowCorrectionModal(false);
            setCorrectionParentDocument(null);
            fetchDocuments();
            toast.success('Correction ajoutée avec succès');
          }}
        />
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingDocument(null);
        }}
        title="Confirmer la suppression"
      >
        {deletingDocument && (
          <div className="space-y-4">
            <p className="text-secondary-600">
              Êtes-vous sûr de vouloir supprimer le document{' '}
              <strong>{deletingDocument.titre}</strong> ?
            </p>
            <p className="text-sm text-amber-600">
              Le document sera déplacé vers la corbeille et pourra être récupéré pendant 30 jours.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingDocument(null);
                }}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteDocument}
              >
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default Documents; 