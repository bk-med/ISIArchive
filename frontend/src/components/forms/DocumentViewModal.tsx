import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  FileText,
  Calendar,
  User,
  BookOpen,
  GraduationCap,
  Star,
  FileIcon,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { documentsAPI } from '../../utils/api';
import { Document } from '../../types';
import CommentSection from '../ui/CommentSection';
import toast from 'react-hot-toast';

interface DocumentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  onDownload: () => void;
}

const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
  isOpen,
  onClose,
  document,
  onDownload
}) => {
  const { user } = useAuth();

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

  const CategoryIcon = getCategoryIcon(document.categorie);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 z-40"
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CategoryIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {document.titre}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(document.categorie)}`}>
                      {document.categorie.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Document Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700">
                      {document.description || 'Aucune description disponible.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Auteur</h4>
                      <p className="text-gray-700">
                        {document.uploader.prenom} {document.uploader.nom}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Date</h4>
                      <p className="text-gray-700">
                        {new Date(document.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {document.matiere && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Matière</h4>
                      <p className="text-gray-700">
                        {document.matiere.nom} ({document.matiere.code})
                      </p>
                    </div>
                  )}

                  {document.pfeData && (
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Projet PFE</h4>
                        <p className="text-gray-700">{document.pfeData.titreProjet}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Année</h4>
                          <p className="text-gray-700">{document.pfeData.anneeDiplome}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Filière</h4>
                          <p className="text-gray-700">{document.pfeData.filiereDiplome}</p>
                        </div>
                      </div>
                      {document.pfeData.resume && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Résumé</h4>
                          <p className="text-gray-700">{document.pfeData.resume}</p>
                        </div>
                      )}
                      {document.pfeData.motsCles.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Mots-clés</h4>
                          <div className="flex flex-wrap gap-1">
                            {document.pfeData.motsCles.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Correction Information */}
                  {(document.correction || document.correctionId) && (
                    <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      {document.correction && (
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Correction disponible
                          </h4>
                          <div className="space-y-2">
                            <p className="text-sm text-blue-800">
                              <strong>Titre:</strong> {document.correction.titre}
                            </p>
                            {document.correction.description && (
                              <p className="text-sm text-blue-800">
                                <strong>Description:</strong> {document.correction.description}
                              </p>
                            )}
                            <p className="text-sm text-blue-700">
                              Ajoutée le {new Date(document.correction.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                            <button
                              onClick={() => {
                                // Download correction
                                const downloadCorrection = async () => {
                                  try {
                                    const blob = await documentsAPI.downloadDocument(document.correction!.id);
                                    const url = window.URL.createObjectURL(blob);
                                    const link = window.document.createElement('a');
                                    link.href = url;
                                    link.download = document.correction!.nomFichier;
                                    window.document.body.appendChild(link);
                                    link.click();
                                    window.document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                    toast.success('Correction téléchargée avec succès');
                                  } catch (error) {
                                    console.error('Error downloading correction:', error);
                                    toast.error('Erreur lors du téléchargement de la correction');
                                  }
                                };
                                downloadCorrection();
                              }}
                              className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Télécharger la correction
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {document.correctionId && (
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                            <FileCheck className="w-4 h-4 mr-2" />
                            Ceci est une correction
                          </h4>
                          <p className="text-sm text-blue-800">
                            Ce document est une correction pour un autre document.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Taille</h4>
                      <p className="text-gray-700">{formatFileSize(document.tailleFichier)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Type</h4>
                      <p className="text-gray-700">{document.typeMime}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-4">
                    <button
                      onClick={onDownload}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                <CommentSection documentId={document.id} />
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DocumentViewModal; 