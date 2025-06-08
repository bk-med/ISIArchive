import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  User,
  BookOpen,
  GraduationCap,
  Star,
  FileIcon,
  CheckCircle,
  FileCheck,
  MessageCircle,
  Loader2,
  Upload,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { documentsAPI } from '../../utils/api';
import { Document } from '../../types';
import toast from 'react-hot-toast';
import { CorrectionUploadModal } from '../../components/forms/CorrectionUploadModal';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import CommentSection from '../../components/ui/CommentSection';

const DocumentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fetchingRef = useRef(false);

  // Animation variants matching Dashboard
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    hover: {
      y: -2,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
  };

  useEffect(() => {
    if (id && !fetchingRef.current) {
      fetchDocument();
    }
  }, [id]);

  const fetchDocument = async () => {
    if (fetchingRef.current) {
      return; // Prevent multiple simultaneous calls
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      const response = await documentsAPI.getDocumentById(id!);
      
      // Map the backend response to match frontend expectations
      const documentData = {
        ...response.data,
        pfeData: response.data.documentPFE // Map documentPFE to pfeData
      };
      
      setDocument(documentData);
    } catch (error: any) {
      console.error('Error fetching document:', error);
      toast.error('Erreur lors du chargement du document');
      navigate('/documents');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
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

  const handleCorrectionUploadSuccess = () => {
    setShowCorrectionModal(false);
    fetchDocument(); // Refresh document data
    toast.success('Correction ajoutée avec succès');
  };

  const handleDeleteDocument = async () => {
    if (!document) return;

    try {
      await documentsAPI.deleteDocument(document.id);
      toast.success('Document supprimé avec succès');
      navigate('/documents'); // Redirect to documents list
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erreur lors de la suppression du document');
    }
  };

  const canAddCorrection = (doc: Document) => {
    // Only professors and admins can add corrections
    if (user?.role !== 'professeur' && user?.role !== 'admin') return false;
    
    // Can't add correction to PFE documents or documents that already have corrections
    if (doc.categorie === 'pfe' || doc.correction || doc.correctionId) return false;
    
    return true;
  };

  const canDeleteDocument = (doc: Document) => {
    // Only document owner or admin can delete
    return user?.role === 'admin' || doc.uploader.id === user?.id;
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
      case 'cours': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'td': return 'bg-green-100 text-green-800 border-green-200';
      case 'tp': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'examen': return 'bg-red-100 text-red-800 border-red-200';
      case 'correction': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pfe': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
            Chargement du document...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Document non trouvé</h2>
          <p className="text-gray-600 mb-4">Le document demandé n'existe pas ou vous n'avez pas les permissions pour y accéder.</p>
          <button
            onClick={() => navigate('/documents')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux documents
          </button>
        </div>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(document.categorie);

  // Debug log to check if we reach the render
  console.log('Rendering DocumentDetails with document:', document?.titre);

  return (
    <div className="min-h-screen bg-gray-50">
      <div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Header */}
        <div 
          className="mb-8"
        >
          <button
            onClick={() => navigate('/documents')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour aux documents
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div 
                className="p-3 bg-white rounded-lg shadow-sm border"
              >
                <CategoryIcon className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <h1 
                  className="text-3xl font-bold text-gray-900 mb-2"
                >
                  {document.titre}
                </h1>
                <div 
                  className="flex items-center space-x-4"
                >
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(document.categorie)}`}>
                    {document.categorie.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    Ajouté le {new Date(document.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Document Information */}
            <div
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations du document</h2>
              
              <div className="space-y-4">
                {document.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                    <p className="text-gray-600">{document.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Auteur</h3>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {document.uploader.prenom} {document.uploader.nom}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Taille du fichier</h3>
                    <span className="text-gray-600">{formatFileSize(document.tailleFichier)}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Type de fichier</h3>
                    <span className="text-gray-600">{document.typeMime}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Date d'ajout</h3>
                    <span className="text-gray-600">
                      {new Date(document.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {document.matiere && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Matière</h3>
                    <span className="text-gray-600">
                      {document.matiere.nom} ({document.matiere.code})
                    </span>
                  </div>
                )}

                {/* PFE Information */}
                {document.pfeData && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Informations PFE</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Titre du projet</h4>
                        <p className="text-gray-600">{document.pfeData.titreProjet}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Année de diplôme</h4>
                          <span className="text-gray-600">{document.pfeData.anneeDiplome}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Filière de diplôme</h4>
                          <span className="text-gray-600">{document.pfeData.filiereDiplome}</span>
                        </div>
                      </div>
                      
                      {document.pfeData.resume && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Résumé</h4>
                          <p className="text-gray-600">{document.pfeData.resume}</p>
                        </div>
                      )}
                      
                      {document.pfeData.motsCles.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Mots-clés</h4>
                          <div className="flex flex-wrap gap-2">
                            {document.pfeData.motsCles.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Correction Information */}
            {document.correction && (
              <div
                className="bg-blue-50 rounded-lg border border-blue-200 p-6"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-blue-900">Correction disponible</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">Titre</h3>
                    <p className="text-blue-800">{document.correction.titre}</p>
                  </div>
                  
                  {document.correction.description && (
                    <div>
                      <h3 className="text-sm font-medium text-blue-900 mb-1">Description</h3>
                      <p className="text-blue-800">{document.correction.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-blue-900 mb-1">Taille</h3>
                      <span className="text-blue-800">{formatFileSize(document.correction.tailleFichier)}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-900 mb-1">Ajoutée le</h3>
                      <span className="text-blue-800">
                        {new Date(document.correction.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDownload(document.correction!)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger la correction
                  </button>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <CommentSection documentId={document.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleDownload(document)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le document
                </button>
                
                {document.correction && (
                  <button
                    onClick={() => handleDownload(document.correction!)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger la correction
                  </button>
                )}
                
                {canAddCorrection(document) && (
                  <button
                    onClick={() => setShowCorrectionModal(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une correction
                  </button>
                )}

                {canDeleteDocument(document) && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer le document
                  </button>
                )}
              </div>
            </div>

            {/* Document Stats */}
            <div
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Téléchargements</span>
                  <span className="text-sm font-medium text-gray-900">
                    {document.downloadCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Commentaires</span>
                  <span className="text-sm font-medium text-gray-900">
                    {document._count?.commentaires || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vues</span>
                  <span className="text-sm font-medium text-gray-900">
                    {document.viewCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Correction Upload Modal */}
      {showCorrectionModal && document && (
        <CorrectionUploadModal
          isOpen={showCorrectionModal}
          onClose={() => setShowCorrectionModal(false)}
          parentDocumentId={document.id}
          parentDocumentTitle={document.titre}
          onSuccess={handleCorrectionUploadSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
      >
        {document && (
          <div className="space-y-4">
            <p className="text-secondary-600">
              Êtes-vous sûr de vouloir supprimer le document{' '}
              <strong>{document.titre}</strong> ?
            </p>
            <p className="text-sm text-amber-600">
              Le document sera déplacé vers la corbeille et pourra être récupéré pendant 30 jours.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
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
    </div>
  );
};

export default DocumentDetails; 