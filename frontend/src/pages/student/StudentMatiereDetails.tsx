import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Calendar,
  Users,
  GraduationCap,
  Search,
  Loader2,
  Eye,
  Download,
  FileIcon,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { academicAPI, documentsAPI } from '../../utils/api';
import { Matiere, Document } from '../../types';
import toast from 'react-hot-toast';

const StudentMatiereDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matiere, setMatiere] = useState<Matiere | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (id) {
      fetchMatiereDetails();
      fetchMatiereDocuments();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchMatiereDocuments();
    }
  }, [searchTerm]);

  const fetchMatiereDetails = async () => {
    try {
      setLoading(true);
      const response = await academicAPI.getMatiere(id!);
      setMatiere(response.data);
    } catch (error) {
      console.error('Error fetching matiere details:', error);
      toast.error('Erreur lors du chargement de la matière');
      navigate('/student/subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatiereDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const response = await documentsAPI.getDocuments({
        matiereId: id!,
        search: searchTerm || undefined,
        limit: 100
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching matiere documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDocumentClick = (document: Document) => {
    navigate(`/documents/${document.id}`);
  };

  const getCategoryIcon = (categorie: string) => {
    switch (categorie) {
      case 'cours': return BookOpen;
      case 'td': return FileText;
      case 'tp': return FileIcon;
      case 'examen': return Calendar;
      default: return FileText;
    }
  };

  const getCategoryColor = (categorie: string) => {
    switch (categorie) {
      case 'cours': return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        badge: 'bg-blue-100 text-blue-800',
        icon: 'text-blue-600'
      };
      case 'td': return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900',
        badge: 'bg-green-100 text-green-800',
        icon: 'text-green-600'
      };
      case 'tp': return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-900',
        badge: 'bg-purple-100 text-purple-800',
        icon: 'text-purple-600'
      };
      case 'examen': return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900',
        badge: 'bg-red-100 text-red-800',
        icon: 'text-red-600'
      };
      default: return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-900',
        badge: 'bg-gray-100 text-gray-800',
        icon: 'text-gray-600'
      };
    }
  };

  const getCategoryTitle = (categorie: string) => {
    switch (categorie) {
      case 'cours': return 'Cours';
      case 'td': return 'Travaux Dirigés (TD)';
      case 'tp': return 'Travaux Pratiques (TP)';
      case 'examen': return 'Examens';
      default: return categorie.toUpperCase();
    }
  };

  const groupDocumentsByCategory = (docs: Document[]) => {
    const filtered = docs.filter(doc => 
      doc.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filtered.reduce((acc, doc) => {
      if (!acc[doc.categorie]) {
        acc[doc.categorie] = [];
      }
      acc[doc.categorie].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-gray-600">Chargement de la matière...</span>
        </div>
      </div>
    );
  }

  if (!matiere) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Matière non trouvée</h2>
          <p className="text-gray-600 mb-4">La matière demandée n'existe pas ou vous n'avez pas les permissions pour y accéder.</p>
          <button
            onClick={() => navigate('/student/subjects')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux matières
          </button>
        </div>
      </div>
    );
  }

  const groupedDocuments = groupDocumentsByCategory(documents);
  const categories = ['cours', 'td', 'tp', 'examen'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/student/subjects')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour aux matières
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white rounded-lg shadow-sm border">
                <BookOpen className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{matiere.nom}</h1>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    {matiere.code}
                  </span>
                  {matiere.filiere && (
                    <span className="text-sm text-gray-500">
                      {matiere.filiere.nom}
                    </span>
                  )}
                  {matiere.semestre && (
                    <span className="text-sm text-gray-500">
                      {matiere.semestre.nom}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Matiere Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations de la matière</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Code</p>
                <p className="text-lg font-semibold text-gray-900">{matiere.code}</p>
              </div>
            </div>
            
            {matiere.filiere && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Filière</p>
                  <p className="text-lg font-semibold text-gray-900">{matiere.filiere.nom}</p>
                </div>
              </div>
            )}
            
            {matiere.semestre && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Semestre</p>
                  <p className="text-lg font-semibold text-gray-900">{matiere.semestre.nom}</p>
                </div>
              </div>
            )}
          </div>

          {/* Professors */}
          {matiere.professeurMatieres && matiere.professeurMatieres.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
                              <h3 className="text-lg font-medium text-gray-900 mb-3">Enseignant(e)(s)</h3>
              <div className="flex flex-wrap gap-3">
                {matiere.professeurMatieres.map((pm, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {pm.professeur.prenom} {pm.professeur.nom}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher dans les documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Documents by Category */}
        {documentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const categoryDocs = groupedDocuments[category] || [];
              const colors = getCategoryColor(category);
              const CategoryIcon = getCategoryIcon(category);
              
              if (categoryDocs.length === 0 && !searchTerm) return null;

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${colors.bg} rounded-lg border ${colors.border} p-6`}
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className={`p-2 bg-white rounded-lg border ${colors.border}`}>
                      <CategoryIcon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold ${colors.text}`}>
                        {getCategoryTitle(category)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {categoryDocs.length} document{categoryDocs.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {categoryDocs.length === 0 ? (
                    <div className="text-center py-8">
                      <CategoryIcon className={`mx-auto h-12 w-12 ${colors.icon} opacity-50`} />
                      <h4 className={`mt-2 text-sm font-medium ${colors.text}`}>
                        {searchTerm ? 'Aucun document trouvé' : 'Aucun document'}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm 
                          ? 'Aucun document ne correspond à votre recherche dans cette catégorie.'
                          : `Aucun document de type ${category} pour cette matière.`
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryDocs.map((document) => (
                        <motion.div
                          key={document.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                          onClick={() => handleDocumentClick(document)}
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                                {category.toUpperCase()}
                              </span>
                              {document.correction && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Corrigé
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                              {document.titre}
                            </h4>

                            {document.description && (
                              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                {document.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{formatFileSize(document.tailleFichier)}</span>
                              <span>{new Date(document.createdAt).toLocaleDateString('fr-FR')}</span>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {document.uploader.prenom} {document.uploader.nom}
                              </span>
                              <Eye className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {Object.keys(groupedDocuments).length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? 'Aucun document trouvé' : 'Aucun document'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Aucun document ne correspond à votre recherche.'
                    : 'Aucun document n\'est encore disponible pour cette matière.'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMatiereDetails; 