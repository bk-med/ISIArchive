import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Plus,
  Search,
  Edit,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { academicAPI } from '../../utils/api';
import { Niveau, Filiere, Matiere } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ViewToggle from '../../components/ui/ViewToggle';
import ProfessorAssignmentModal from '../../components/ui/ProfessorAssignmentModal';
import toast from 'react-hot-toast';

interface MatiereFormData {
  nom: string;
  code: string;
  filiereId: string;
  semestreId: string;
}

const MatiereManagement: React.FC = () => {
  const { user } = useAuth();
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState<string>('');
  const [selectedSemestre, setSelectedSemestre] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingMatiere, setEditingMatiere] = useState<Matiere | null>(null);
  const [deletingMatiere, setDeletingMatiere] = useState<Matiere | null>(null);
  const [assigningMatiere, setAssigningMatiere] = useState<Matiere | null>(null);
  const [formData, setFormData] = useState<MatiereFormData>({
    nom: '',
    code: '',
    filiereId: '',
    semestreId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

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
    fetchData();
  }, []);

  useEffect(() => {
    fetchMatieres();
  }, [searchTerm, selectedFiliere, selectedSemestre]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matieresRes, niveauxRes, filieresRes] = await Promise.all([
        academicAPI.getMatieres({ includeDeleted: true }),
        academicAPI.getNiveaux(),
        academicAPI.getFilieres(),
      ]);
      setMatieres(matieresRes.data);
      setNiveaux(niveauxRes.data);
      setFilieres(filieresRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatieres = async () => {
    try {
      const params: any = { includeDeleted: true };
      if (selectedFiliere) params.filiereId = selectedFiliere;
      if (selectedSemestre) params.semestreId = selectedSemestre;
      
      const response = await academicAPI.getMatieres(params);
      setMatieres(response.data);
    } catch (error) {
      console.error('Error fetching matieres:', error);
    }
  };

  const handleCreateMatiere = async () => {
    if (!formData.nom || !formData.code || !formData.filiereId || !formData.semestreId) {
      toast.error('Tous les champs sont requis');
      return;
    }

    try {
      setIsSubmitting(true);
      await academicAPI.createMatiere(formData);
      toast.success('Matière créée avec succès');
      setShowCreateModal(false);
      setFormData({ nom: '', code: '', filiereId: '', semestreId: '' });
      fetchMatieres();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMatiere = async () => {
    if (!editingMatiere || !formData.nom || !formData.code || !formData.filiereId || !formData.semestreId) {
      toast.error('Tous les champs sont requis');
      return;
    }

    try {
      setIsSubmitting(true);
      await academicAPI.updateMatiere(editingMatiere.id, formData);
      toast.success('Matière mise à jour avec succès');
      setShowEditModal(false);
      setEditingMatiere(null);
      setFormData({ nom: '', code: '', filiereId: '', semestreId: '' });
      fetchMatieres();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMatiere = async () => {
    if (!deletingMatiere) return;

    try {
      await academicAPI.deleteMatiere(deletingMatiere.id);
      toast.success('Matière supprimée avec succès');
      setShowDeleteModal(false);
      setDeletingMatiere(null);
      fetchMatieres();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleRestoreMatiere = async (matiereId: string) => {
    try {
      await academicAPI.restoreMatiere(matiereId);
      toast.success('Matière restaurée avec succès');
      fetchMatieres();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la restauration');
    }
  };

  const openCreateModal = () => {
    setFormData({ nom: '', code: '', filiereId: '', semestreId: '' });
    setShowCreateModal(true);
  };

  const openEditModal = (matiere: Matiere) => {
    setEditingMatiere(matiere);
    setFormData({
      nom: matiere.nom,
      code: matiere.code,
      filiereId: matiere.filiereId,
      semestreId: matiere.semestreId,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (matiere: Matiere) => {
    setDeletingMatiere(matiere);
    setShowDeleteModal(true);
  };

  const openAssignModal = (matiere: Matiere) => {
    setAssigningMatiere(matiere);
    setShowAssignModal(true);
  };

  const filteredMatieres = matieres.filter(matiere => {
    const matchesSearch = matiere.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         matiere.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFiliere = !selectedFiliere || matiere.filiereId === selectedFiliere;
    const matchesSemestre = !selectedSemestre || matiere.semestreId === selectedSemestre;
    return matchesSearch && matchesFiliere && matchesSemestre;
  });

  // Get semestres for selected filiere
  const availableSemestres = selectedFiliere 
    ? niveaux.find(n => n.filieres?.some(f => f.id === selectedFiliere))?.semestres || []
    : [];

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
            Chargement des matières...
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
        className="flex justify-between items-center"
      >
        <div>
          <motion.h1 
            className="text-2xl font-bold text-secondary-900"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Gestion des Matières
          </motion.h1>
          <motion.p 
            className="text-secondary-600"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Gérez les matières académiques et leurs assignations
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Button
            onClick={openCreateModal}
            leftIcon={<Plus />}
            className="bg-primary-600 hover:bg-primary-700"
          >
            Nouvelle Matière
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search />}
              />
            </div>
            <div className="w-full lg:w-64">
              <select
                value={selectedFiliere}
                onChange={(e) => {
                  setSelectedFiliere(e.target.value);
                  setSelectedSemestre(''); // Reset semestre when filiere changes
                }}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Toutes les filières</option>
                {filieres.map((filiere) => (
                  <option key={filiere.id} value={filiere.id}>
                    {filiere.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full lg:w-64">
              <select
                value={selectedSemestre}
                onChange={(e) => setSelectedSemestre(e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!selectedFiliere}
              >
                <option value="">Tous les semestres</option>
                {availableSemestres.map((semestre) => (
                  <option key={semestre.id} value={semestre.id}>
                    {semestre.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <ViewToggle
                view={view}
                onViewChange={(newView) => setView(newView)}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Matieres Grid View */}
      {view === 'grid' && (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredMatieres.map((matiere, index) => (
                <motion.div
                  key={matiere.id}
                  variants={cardVariants}
                  whileHover="hover"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className={`p-6 ${matiere.isDeleted ? 'opacity-60 border-red-200' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 rounded-lg bg-green-100">
                          <GraduationCap className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-secondary-900">
                            {matiere.nom}
                          </h3>
                          <p className="text-sm text-secondary-500">{matiere.code}</p>
                        </div>
                      </div>
                      {matiere.isDeleted && (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span className="text-xs">Supprimée</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4 space-y-1">
                      <p className="text-sm text-secondary-600">
                        <strong>Filière:</strong> {matiere.filiere?.nom}
                      </p>
                      <p className="text-sm text-secondary-600">
                        <strong>Semestre:</strong> {matiere.semestre?.nom}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2">
                      {matiere.isDeleted ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreMatiere(matiere.id)}
                          leftIcon={<RotateCcw />}
                        >
                          Restaurer
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openAssignModal(matiere)}
                            leftIcon={<Users />}
                          >
                            Assigner
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(matiere)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteModal(matiere)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredMatieres.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                Aucune matière trouvée
              </h3>
              <p className="text-secondary-600">
                {searchTerm || selectedFiliere || selectedSemestre
                  ? 'Aucune matière ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre première matière.'}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Matieres List View */}
      {view === 'list' && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-2/5">
                      Matière
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-20">
                      Code
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-20">
                      Semestre
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-20">
                      Statut
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  <AnimatePresence>
                    {filteredMatieres.map((matiere, index) => (
                      <motion.tr
                        key={matiere.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`hover:bg-secondary-50 ${matiere.isDeleted ? 'opacity-60' : ''}`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-1 rounded bg-green-100 mr-2">
                              <GraduationCap className="h-3 w-3 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-secondary-900 truncate">
                                {matiere.nom}
                              </div>
                              <div className="text-xs text-secondary-500">{matiere.filiere?.nom}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-secondary-900">{matiere.code}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                            {matiere.semestre?.nom}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {matiere.isDeleted ? (
                            <span className="inline-flex items-center px-1 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">
                              <AlertTriangle className="h-2 w-2 mr-1" />
                              <span className="hidden sm:inline">Supprimée</span>
                              <span className="sm:hidden">Del</span>
                            </span>
                          ) : (
                            <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800">
                              <span className="hidden sm:inline">Active</span>
                              <span className="sm:hidden">OK</span>
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1">
                            {matiere.isDeleted ? (
                              <div title="Restaurer">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRestoreMatiere(matiere.id)}
                                  className="p-1 h-6 w-6"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div title="Assigner">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openAssignModal(matiere)}
                                    className="p-1 h-6 w-6"
                                  >
                                    <Users className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div title="Modifier">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditModal(matiere)}
                                    className="p-1 h-6 w-6"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div title="Supprimer">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openDeleteModal(matiere)}
                                    className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {filteredMatieres.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">
                  Aucune matière trouvée
                </h3>
                <p className="text-secondary-600">
                  {searchTerm || selectedFiliere || selectedSemestre
                    ? 'Aucune matière ne correspond à vos critères de recherche.'
                    : 'Commencez par créer votre première matière.'}
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer une nouvelle matière"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Nom de la matière
              </label>
              <Input
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Algorithmique et Structures de Données"
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Code de la matière
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: ALGO"
                fullWidth
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Filière
              </label>
              <select
                value={formData.filiereId}
                onChange={(e) => {
                  setFormData({ ...formData, filiereId: e.target.value, semestreId: '' });
                }}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Sélectionner une filière</option>
                {filieres.map((filiere) => (
                  <option key={filiere.id} value={filiere.id}>
                    {filiere.nom} ({filiere.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Semestre
              </label>
              <select
                value={formData.semestreId}
                onChange={(e) => setFormData({ ...formData, semestreId: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!formData.filiereId}
              >
                <option value="">Sélectionner un semestre</option>
                {formData.filiereId && 
                  niveaux.find(n => n.filieres?.some(f => f.id === formData.filiereId))?.semestres?.map((semestre) => (
                    <option key={semestre.id} value={semestre.id}>
                      {semestre.nom}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateMatiere}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier la matière"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Nom de la matière
              </label>
              <Input
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Algorithmique et Structures de Données"
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Code de la matière
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: ALGO"
                fullWidth
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Filière
              </label>
              <select
                value={formData.filiereId}
                onChange={(e) => {
                  setFormData({ ...formData, filiereId: e.target.value, semestreId: '' });
                }}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Sélectionner une filière</option>
                {filieres.map((filiere) => (
                  <option key={filiere.id} value={filiere.id}>
                    {filiere.nom} ({filiere.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Semestre
              </label>
              <select
                value={formData.semestreId}
                onChange={(e) => setFormData({ ...formData, semestreId: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!formData.filiereId}
              >
                <option value="">Sélectionner un semestre</option>
                {formData.filiereId && 
                  niveaux.find(n => n.filieres?.some(f => f.id === formData.filiereId))?.semestres?.map((semestre) => (
                    <option key={semestre.id} value={semestre.id}>
                      {semestre.nom}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdateMatiere}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Mettre à jour
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
      >
        {deletingMatiere && (
          <div className="space-y-4">
            <p className="text-secondary-600">
              Êtes-vous sûr de vouloir supprimer la matière{' '}
              <strong>{deletingMatiere.nom}</strong> ?
            </p>
            <p className="text-sm text-red-600">
              Cette action peut être annulée dans les 30 jours.
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
                onClick={handleDeleteMatiere}
              >
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Professor Assignment Modal */}
      {assigningMatiere && (
        <ProfessorAssignmentModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          matiere={assigningMatiere}
          onUpdate={fetchMatieres}
        />
      )}
    </motion.div>
  );
};

export default MatiereManagement; 