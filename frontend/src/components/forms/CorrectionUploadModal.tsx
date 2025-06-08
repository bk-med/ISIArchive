import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { documentsAPI } from '../../utils/api';
import { CreateCorrectionData } from '../../types';

interface CorrectionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentDocumentId: string;
  parentDocumentTitle: string;
  onSuccess?: () => void;
}

export const CorrectionUploadModal: React.FC<CorrectionUploadModalProps> = ({
  isOpen,
  onClose,
  parentDocumentId,
  parentDocumentTitle,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateCorrectionData>({
    titre: '',
    description: '',
    document: null as any
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  const handleClose = () => {
    if (!loading) {
      setFormData({
        titre: '',
        description: '',
        document: null as any
      });
      setErrors({});
      onClose();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est requis';
    }

    if (!formData.document) {
      newErrors.file = 'Un fichier est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (file: File) => {
    if (!allowedFileTypes.includes(file.type)) {
      setErrors(prev => ({ 
        ...prev, 
        file: 'Type de fichier non supporté. Utilisez PDF, DOC, DOCX, PPT ou PPTX.' 
      }));
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setErrors(prev => ({ 
        ...prev, 
        file: 'Le fichier ne peut pas dépasser 50MB.' 
      }));
      return;
    }

    setFormData(prev => ({ ...prev, document: file }));
    if (errors.file) {
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('document', formData.document);
      formDataToSend.append('titre', formData.titre);
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }

      await documentsAPI.uploadCorrection(parentDocumentId, formDataToSend);

      // Success
      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error uploading correction:', error);
      setErrors({ submit: 'Erreur lors du téléchargement de la correction' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 z-40"
              onClick={handleClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Ajouter une correction
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Pour: {parentDocumentTitle}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de la correction *
                  </label>
                  <input
                    type="text"
                    value={formData.titre}
                    onChange={(e) => handleInputChange('titre', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.titre ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Correction TP1 - Algorithmes de tri"
                    disabled={loading}
                  />
                  {errors.titre && (
                    <p className="mt-1 text-sm text-red-600">{errors.titre}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Description optionnelle de la correction..."
                    disabled={loading}
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier de correction *
                  </label>
                  <div 
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                      isDragOver 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-1 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                          <span>Télécharger un fichier</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileChange(file);
                            }}
                            disabled={loading}
                          />
                        </label>
                        <p className="pl-1">ou glisser-déposer</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX, PPT, PPTX jusqu'à 50MB
                      </p>
                      {formData.document && (
                        <p className="text-sm text-green-600 font-medium">
                          ✓ {formData.document.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {errors.file && (
                    <p className="mt-1 text-sm text-red-600">{errors.file}</p>
                  )}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Ajouter la correction
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}; 