import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { documentsAPI, academicAPI } from '../../utils/api';
import { CreateDocumentData, CreatePFEDocumentData, Matiere, Filiere, Niveau, Semestre } from '../../types';
import toast from 'react-hot-toast';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedMatiereId?: string;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedMatiereId
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadType, setUploadType] = useState<'document' | 'pfe'>('document');
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [professorMatieres, setProfessorMatieres] = useState<Matiere[]>([]);
  const [preselectedMatiere, setPreselectedMatiere] = useState<Matiere | null>(null);

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    categorie: '',
    matiereId: '',
    selectedMatiereIds: [] as string[],
    niveauId: '',
    filiereId: '',
    semestreId: '',
    // PFE specific fields
    anneeDiplome: new Date().getFullYear(),
    resume: '',
    motsCles: '',
    file: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  const categories = [
    { value: 'cours', label: 'Cours' },
    { value: 'td', label: 'TD' },
    { value: 'tp', label: 'TP' },
    { value: 'examen', label: 'Examen' }
  ];

  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  useEffect(() => {
    if (isOpen) {
      fetchNiveaux();
      if (user?.role === 'professeur') {
        fetchProfessorMatieres();
      }
      
      // Set preselected matiere if provided
      if (preselectedMatiereId) {
        setFormData(prev => ({ ...prev, matiereId: preselectedMatiereId }));
        fetchPreselectedMatiere(preselectedMatiereId);
      }
    }
  }, [isOpen, user, preselectedMatiereId]);

  useEffect(() => {
    if (formData.niveauId) {
      fetchFilieres(formData.niveauId);
      const niveau = niveaux.find(n => n.id === formData.niveauId);
      
      // For PFE documents, automatically set the semester based on niveau
      if (uploadType === 'pfe') {
        const niveauNom = niveau?.nom;
        let autoSemestreId = '';
        
        if (niveauNom === 'L3' || niveauNom === '3ING') {
          // For L3 and 3ING, automatically select S6
          const s6Semestre = niveau?.semestres?.find(s => s.nom === 'S6');
          autoSemestreId = s6Semestre?.id || '';
        } else if (niveauNom === 'M2') {
          // For M2, automatically select S4
          const s4Semestre = niveau?.semestres?.find(s => s.nom === 'S4');
          autoSemestreId = s4Semestre?.id || '';
        }
        
        // Automatically set the semester
        setFormData(prev => ({ ...prev, semestreId: autoSemestreId }));
        setSemestres(niveau?.semestres || []);
      } else {
        setSemestres(niveau?.semestres || []);
      }
    }
  }, [formData.niveauId, niveaux, uploadType]);

  useEffect(() => {
    if (formData.filiereId && formData.semestreId) {
      fetchMatieres(formData.filiereId, formData.semestreId);
    }
  }, [formData.filiereId, formData.semestreId]);

  const fetchNiveaux = async () => {
    try {
      const response = await academicAPI.getNiveaux();
      setNiveaux(response.data);
    } catch (error) {
      console.error('Error fetching niveaux:', error);
    }
  };

  const fetchFilieres = async (niveauId: string) => {
    try {
      const response = await academicAPI.getFilieres({ niveauId });
      setFilieres(response.data);
    } catch (error) {
      console.error('Error fetching filieres:', error);
    }
  };

  const fetchMatieres = async (filiereId: string, semestreId: string) => {
    try {
      const response = await academicAPI.getMatieres({ filiereId, semestreId });
      setMatieres(response.data);
    } catch (error) {
      console.error('Error fetching matieres:', error);
    }
  };

  const fetchProfessorMatieres = async () => {
    try {
      if (user?.id) {
        const response = await academicAPI.getProfesseurMatieres(user.id);
        setProfessorMatieres(response.data);
      }
    } catch (error) {
      console.error('Error fetching professor matieres:', error);
    }
  };

  const fetchPreselectedMatiere = async (matiereId: string) => {
    try {
      const response = await academicAPI.getMatiere(matiereId);
      setPreselectedMatiere(response.data);
    } catch (error) {
      console.error('Error fetching preselected matiere:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est requis';
    }

    if (!formData.file) {
      newErrors.file = 'Un fichier est requis';
    } else {
      if (!allowedFileTypes.includes(formData.file.type)) {
        newErrors.file = 'Type de fichier non autorisé. Utilisez PDF, DOC, DOCX, PPT ou PPTX';
      }
      if (formData.file.size > maxFileSize) {
        newErrors.file = 'Le fichier est trop volumineux (max 50MB)';
      }
    }

    if (uploadType === 'document') {
      if (!formData.categorie) {
        newErrors.categorie = 'La catégorie est requise';
      }
      if (user?.role === 'professeur') {
        // Check for multiple matiere selection or single matiere (backward compatibility)
        if (!preselectedMatiereId && formData.selectedMatiereIds.length === 0 && !formData.matiereId) {
          newErrors.matiereId = 'Au moins une matière est requise';
        }
      } else {
        if (!formData.niveauId) {
          newErrors.niveauId = 'Le niveau est requis';
        }
        if (!formData.filiereId) {
          newErrors.filiereId = 'La filière est requise';
        }
        if (!formData.semestreId) {
          newErrors.semestreId = 'Le semestre est requis';
        }
        if (!formData.matiereId) {
          newErrors.matiereId = 'La matière est requise';
        }
      }
    } else {
      if (!formData.anneeDiplome || formData.anneeDiplome < 2000 || formData.anneeDiplome > new Date().getFullYear()) {
        newErrors.anneeDiplome = 'Année de diplôme invalide';
      }
      if (!formData.niveauId) {
        newErrors.niveauId = 'Le niveau est requis';
      }
      if (!formData.filiereId) {
        newErrors.filiereId = 'La filière est requise';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Common fields
      formDataToSend.append('document', formData.file!);
      formDataToSend.append('titre', formData.titre);
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }

      if (uploadType === 'document') {
        formDataToSend.append('categorie', formData.categorie);
        
        // Handle multiple matieres for professors
        if (user?.role === 'professeur') {
          if (preselectedMatiereId) {
            // Use preselected matiere
            formDataToSend.append('matiereId', preselectedMatiereId);
          } else if (formData.selectedMatiereIds.length > 0) {
            // Use multiple selected matieres
            formDataToSend.append('matiereIds', JSON.stringify(formData.selectedMatiereIds));
            
            // For file organization, use the first selected matiere
            const firstMatiere = professorMatieres.find(m => m.id === formData.selectedMatiereIds[0]);
            if (firstMatiere) {
              const niveauNom = firstMatiere.filiere?.niveau?.nom || '';
              const filiereNom = firstMatiere.filiere?.nom || '';
              const semestreNom = firstMatiere.semestre?.nom || '';
              const matiereNom = firstMatiere.nom || '';

              formDataToSend.append('niveau', niveauNom);
              formDataToSend.append('filiere', filiereNom);
              formDataToSend.append('semestre', semestreNom);
              formDataToSend.append('matiere', matiereNom);
            }
          } else {
            // Fallback to single matiere (backward compatibility)
            formDataToSend.append('matiereId', formData.matiereId);
            const matiere = professorMatieres.find(m => m.id === formData.matiereId);
            if (matiere) {
              const niveauNom = matiere.filiere?.niveau?.nom || '';
              const filiereNom = matiere.filiere?.nom || '';
              const semestreNom = matiere.semestre?.nom || '';
              const matiereNom = matiere.nom || '';

              formDataToSend.append('niveau', niveauNom);
              formDataToSend.append('filiere', filiereNom);
              formDataToSend.append('semestre', semestreNom);
              formDataToSend.append('matiere', matiereNom);
            }
          }
        } else {
          // For admins, use single matiere selection
          formDataToSend.append('matiereId', formData.matiereId);
          
          const matiere = matieres.find(m => m.id === formData.matiereId);
          if (!matiere) {
            throw new Error('Matière non trouvée');
          }

          const niveau = niveaux.find(n => n.id === formData.niveauId);
          const filiere = filieres.find(f => f.id === formData.filiereId);
          const semestre = semestres.find(s => s.id === formData.semestreId);

          const niveauNom = niveau?.nom || '';
          const filiereNom = filiere?.nom || '';
          const semestreNom = semestre?.nom || '';
          const matiereNom = matiere.nom || '';

          formDataToSend.append('niveau', niveauNom);
          formDataToSend.append('filiere', filiereNom);
          formDataToSend.append('semestre', semestreNom);
          formDataToSend.append('matiere', matiereNom);
        }

        await documentsAPI.uploadDocument(formDataToSend);
        toast.success('Document ajouté avec succès');
      } else {
        // PFE document upload
        const niveau = niveaux.find(n => n.id === formData.niveauId);
        const filiere = filieres.find(f => f.id === formData.filiereId);
        const semestre = semestres.find(s => s.id === formData.semestreId);

        formDataToSend.append('niveau', niveau?.nom || '');
        formDataToSend.append('filiere', filiere?.nom || '');
        formDataToSend.append('semestre', semestre?.nom || '');
        formDataToSend.append('categorie', 'pfe');
        
        formDataToSend.append('anneeDiplome', formData.anneeDiplome.toString());
        formDataToSend.append('filiereDiplome', filiere?.nom || '');
        formDataToSend.append('titreProjet', formData.titre);
        if (formData.description) {
          formDataToSend.append('resume', formData.description);
        }
        if (formData.motsCles) {
          formDataToSend.append('motsCles', formData.motsCles);
        }

        await documentsAPI.uploadPFEDocument(formDataToSend);
        toast.success('Document PFE ajouté avec succès');
      }

      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout du document');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      categorie: '',
      matiereId: '',
      selectedMatiereIds: [],
      niveauId: '',
      filiereId: '',
      semestreId: '',
      anneeDiplome: new Date().getFullYear(),
      resume: '',
      motsCles: '',
      file: null
    });
    setErrors({});
    setUploadType('document');
    setPreselectedMatiere(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: '' }));
      }
    }
  };

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
      const file = files[0];
      
      // Validate file type
      if (!allowedFileTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, file: 'Type de fichier non autorisé. Utilisez PDF, DOC, DOCX, PPT ou PPTX' }));
        return;
      }
      
      // Validate file size
      if (file.size > maxFileSize) {
        setErrors(prev => ({ ...prev, file: 'Le fichier est trop volumineux (max 50MB)' }));
        return;
      }

      setFormData(prev => ({ ...prev, file }));
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: '' }));
      }
    }
  };

  const canUploadPFE = user?.role === 'admin';

  // Filter niveaux for PFE documents to only show terminal levels
  const getFilteredNiveaux = () => {
    if (uploadType === 'pfe') {
      return niveaux.filter(niveau => ['L3', '3ING', 'M2'].includes(niveau.nom));
    }
    return niveaux;
  };

  // New function to handle matiere selection
  const handleMatiereToggle = (matiereId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedMatiereIds.includes(matiereId);
      const newSelectedIds = isSelected
        ? prev.selectedMatiereIds.filter(id => id !== matiereId)
        : [...prev.selectedMatiereIds, matiereId];
      
      return { ...prev, selectedMatiereIds: newSelectedIds };
    });
    
    // Clear error when user makes a selection
    if (errors.matiereId) {
      setErrors(prev => ({ ...prev, matiereId: '' }));
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
              className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Upload className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Ajouter un document
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ajoutez un nouveau document à la bibliothèque
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Type Selection */}
              {canUploadPFE && (
                <div className="mb-6">
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setUploadType('document')}
                      className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                        uploadType === 'document'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-medium">Document académique</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadType('pfe')}
                      className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                        uploadType === 'pfe'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <GraduationCap className="w-5 h-5" />
                        <span className="font-medium">Document PFE</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier *
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
                      <FileText className={`mx-auto h-12 w-12 ${isDragOver ? 'text-primary-500' : 'text-gray-400'}`} />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                          <span>Télécharger un fichier</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">ou glisser-déposer</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX, PPT, PPTX jusqu'à 50MB
                      </p>
                      {formData.file && (
                        <p className="text-sm text-green-600 mt-2">
                          <CheckCircle className="inline w-4 h-4 mr-1" />
                          {formData.file.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {errors.file && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.file}
                    </p>
                  )}
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {uploadType === 'pfe' ? 'Titre du projet *' : 'Titre *'}
                    </label>
                    <input
                      type="text"
                      value={formData.titre}
                      onChange={(e) => handleInputChange('titre', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder={uploadType === 'pfe' ? 'Titre du projet de fin d\'études' : 'Titre du document'}
                    />
                    {errors.titre && (
                      <p className="mt-1 text-sm text-red-600">{errors.titre}</p>
                    )}
                  </div>

                  {uploadType === 'document' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie *
                      </label>
                      <select
                        value={formData.categorie}
                        onChange={(e) => handleInputChange('categorie', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      {errors.categorie && (
                        <p className="mt-1 text-sm text-red-600">{errors.categorie}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {uploadType === 'pfe' ? 'Résumé du projet' : 'Description'}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder={uploadType === 'pfe' ? 'Résumé du projet de fin d\'études (optionnel)' : 'Description du document (optionnel)'}
                  />
                </div>

                {/* PFE Specific Fields */}
                {uploadType === 'pfe' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Année de diplôme *
                        </label>
                        <input
                          type="number"
                          value={formData.anneeDiplome}
                          onChange={(e) => handleInputChange('anneeDiplome', parseInt(e.target.value))}
                          min="2000"
                          max={new Date().getFullYear()}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                        {errors.anneeDiplome && (
                          <p className="mt-1 text-sm text-red-600">{errors.anneeDiplome}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mots-clés
                      </label>
                      <input
                        type="text"
                        value={formData.motsCles}
                        onChange={(e) => handleInputChange('motsCles', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Mots-clés séparés par des virgules"
                      />
                    </div>
                  </div>
                )}

                {/* Academic Structure Selection */}
                {user?.role === 'admin' || uploadType === 'pfe' ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      Organisation académique *
                    </h4>
                    
                    <div className={`grid grid-cols-1 gap-4 ${uploadType === 'pfe' ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Niveau *
                        </label>
                        <select
                          value={formData.niveauId}
                          onChange={(e) => handleInputChange('niveauId', e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                          <option value="">Sélectionner un niveau</option>
                          {getFilteredNiveaux().map(niveau => (
                            <option key={niveau.id} value={niveau.id}>{niveau.nom}</option>
                          ))}
                        </select>
                        {errors.niveauId && (
                          <p className="mt-1 text-sm text-red-600">{errors.niveauId}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Filière *
                        </label>
                        <select
                          value={formData.filiereId}
                          onChange={(e) => handleInputChange('filiereId', e.target.value)}
                          disabled={!formData.niveauId}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100"
                        >
                          <option value="">Sélectionner une filière</option>
                          {filieres.map(filiere => (
                            <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
                          ))}
                        </select>
                        {errors.filiereId && (
                          <p className="mt-1 text-sm text-red-600">{errors.filiereId}</p>
                        )}
                      </div>

                      {uploadType === 'document' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Semestre *
                          </label>
                          <select
                            value={formData.semestreId}
                            onChange={(e) => handleInputChange('semestreId', e.target.value)}
                            disabled={!formData.niveauId}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100"
                          >
                            <option value="">Sélectionner un semestre</option>
                            {semestres.map(semestre => (
                              <option key={semestre.id} value={semestre.id}>{semestre.nom}</option>
                            ))}
                          </select>
                          {errors.semestreId && (
                            <p className="mt-1 text-sm text-red-600">{errors.semestreId}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Show automatic semester for PFE */}
                    {uploadType === 'pfe' && formData.niveauId && formData.semestreId && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-medium">i</span>
                          </div>
                          <span className="text-sm text-blue-800">
                            Semestre automatique: <strong>{semestres.find(s => s.id === formData.semestreId)?.nom}</strong> (semestre final)
                          </span>
                        </div>
                      </div>
                    )}

                    {uploadType === 'document' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Matières *
                        </label>
                        {preselectedMatiereId ? (
                          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                            {(() => {
                              const selectedMatiere = preselectedMatiere || professorMatieres.find(m => m.id === preselectedMatiereId);
                              return selectedMatiere ? `${selectedMatiere.nom} (${selectedMatiere.code})` : 'Matière sélectionnée';
                            })()}
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                            {professorMatieres.map(matiere => (
                              <label key={matiere.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={formData.selectedMatiereIds.includes(matiere.id)}
                                  onChange={() => handleMatiereToggle(matiere.id)}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-900">{matiere.nom} ({matiere.code})</span>
                              </label>
                            ))}
                            {professorMatieres.length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-2">Aucune matière assignée</p>
                            )}
                          </div>
                        )}
                        {formData.selectedMatiereIds.length > 0 && !preselectedMatiereId && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                              <strong>{formData.selectedMatiereIds.length}</strong> matière(s) sélectionnée(s)
                            </p>
                          </div>
                        )}
                        {errors.matiereId && (
                          <p className="mt-1 text-sm text-red-600">{errors.matiereId}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : user?.role === 'professeur' && uploadType === 'document' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matières *
                    </label>
                    {preselectedMatiereId ? (
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                        {(() => {
                          const selectedMatiere = professorMatieres.find(m => m.id === preselectedMatiereId);
                          return selectedMatiere ? `${selectedMatiere.nom} (${selectedMatiere.code})` : 'Matière sélectionnée';
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                        {professorMatieres.map(matiere => (
                          <label key={matiere.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={formData.selectedMatiereIds.includes(matiere.id)}
                              onChange={() => handleMatiereToggle(matiere.id)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-900">{matiere.nom} ({matiere.code})</span>
                          </label>
                        ))}
                        {professorMatieres.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-2">Aucune matière assignée</p>
                        )}
                      </div>
                    )}
                    {formData.selectedMatiereIds.length > 0 && !preselectedMatiereId && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>{formData.selectedMatiereIds.length}</strong> matière(s) sélectionnée(s)
                        </p>
                      </div>
                    )}
                    {errors.matiereId && (
                      <p className="mt-1 text-sm text-red-600">{errors.matiereId}</p>
                    )}
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
                        Ajouter
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

export default DocumentUploadModal; 