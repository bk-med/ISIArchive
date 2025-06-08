import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { academicAPI } from '../../utils/api';
import { Niveau, Filiere } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ViewToggle from '../../components/ui/ViewToggle';
import toast from 'react-hot-toast';

interface FiliereFormData {
  nom: string;
  code: string;
  niveauId: string;
}

const FiliereManagement: React.FC = () => {
  const { user } = useAuth();
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingFiliere, setEditingFiliere] = useState<Filiere | null>(null);
  const [deletingFiliere, setDeletingFiliere] = useState<Filiere | null>(null);
  const [formData, setFormData] = useState<FiliereFormData>({
    nom: '',
    code: '',
    niveauId: '',
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
    fetchFilieres();
  }, [searchTerm, selectedNiveau]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [filieresRes, niveauxRes] = await Promise.all([
        academicAPI.getFilieres({ includeDeleted: true }),
        academicAPI.getNiveaux(),
      ]);
      setFilieres(filieresRes.data);
      setNiveaux(niveauxRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilieres = async () => {
    try {
      const params: any = { includeDeleted: true };
      if (selectedNiveau) params.niveauId = selectedNiveau;
      
      const response = await academicAPI.getFilieres(params);
      setFilieres(response.data);
    } catch (error) {
      console.error('Error fetching filieres:', error);
    }
  };

  const handleCreateFiliere = async () => {
    if (!formData.nom || !formData.code || !formData.niveauId) {
      toast.error('Tous les champs sont requis');
      return;
    }

    try {
      setIsSubmitting(true);
      await academicAPI.createFiliere(formData);
      toast.success('Filière créée avec succès');
      setShowCreateModal(false);
      setFormData({ nom: '', code: '', niveauId: '' });
      fetchFilieres();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFiliere = async () => {
    if (!editingFiliere || !formData.nom || !formData.code || !formData.niveauId) {
      toast.error('Tous les champs sont requis');
      return;
    }

    try {
      setIsSubmitting(true);
      await academicAPI.updateFiliere(editingFiliere.id, formData);
      toast.success('Filière mise à jour avec succès');
      setShowEditModal(false);
      setEditingFiliere(null);
      setFormData({ nom: '', code: '', niveauId: '' });
      fetchFilieres();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFiliere = async () => {
    if (!deletingFiliere) return;

    try {
      await academicAPI.deleteFiliere(deletingFiliere.id);
      toast.success('Filière supprimée avec succès');
      setShowDeleteModal(false);
      setDeletingFiliere(null);
      fetchFilieres();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleRestoreFiliere = async (filiereId: string) => {
    try {
      await academicAPI.restoreFiliere(filiereId);
      toast.success('Filière restaurée avec succès');
      fetchFilieres();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la restauration');
    }
  };

  const openCreateModal = () => {
    setFormData({ nom: '', code: '', niveauId: '' });
    setShowCreateModal(true);
  };

  const openEditModal = (filiere: Filiere) => {
    setEditingFiliere(filiere);
    setFormData({
      nom: filiere.nom,
      code: filiere.code,
      niveauId: filiere.niveauId,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (filiere: Filiere) => {
    setDeletingFiliere(filiere);
    setShowDeleteModal(true);
  };

  const filteredFilieres = filieres.filter(filiere => {
    const matchesSearch = filiere.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         filiere.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiveau = !selectedNiveau || filiere.niveauId === selectedNiveau;
    return matchesSearch && matchesNiveau;
  });

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
            Chargement des filières...
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
            Gestion des Filières
          </motion.h1>
          <motion.p 
            className="text-secondary-600"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Gérez les filières académiques de l'institut
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
            Nouvelle Filière
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
                value={selectedNiveau}
                onChange={(e) => setSelectedNiveau(e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Tous les niveaux</option>
                {niveaux.map((niveau) => (
                  <option key={niveau.id} value={niveau.id}>
                    {niveau.nom}
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

      {/* Filieres Grid View */}
      {view === 'grid' && (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredFilieres.map((filiere, index) => (
                <motion.div
                  key={filiere.id}
                  variants={cardVariants}
                  whileHover="hover"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className={`p-6 ${filiere.isDeleted ? 'opacity-60 border-red-200' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 rounded-lg bg-primary-100">
                          <BookOpen className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-secondary-900">
                            {filiere.nom}
                          </h3>
                          <p className="text-sm text-secondary-500">{filiere.code}</p>
                        </div>
                      </div>
                      {filiere.isDeleted && (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span className="text-xs">Supprimée</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-secondary-600">
                        <strong>Niveau:</strong> {filiere.niveau?.nom}
                      </p>
                      <p className="text-sm text-secondary-600">
                        <strong>Type:</strong> {filiere.niveau?.type}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2">
                      {filiere.isDeleted ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreFiliere(filiere.id)}
                          leftIcon={<RotateCcw />}
                        >
                          Restaurer
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(filiere)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteModal(filiere)}
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

          {filteredFilieres.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                Aucune filière trouvée
              </h3>
              <p className="text-secondary-600">
                {searchTerm || selectedNiveau
                  ? 'Aucune filière ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre première filière.'}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Filieres List View */}
      {view === 'list' && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-2/5">
                      Filière
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-20">
                      Code
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-1/5">
                      Niveau
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-20">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-20">
                      Statut
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  <AnimatePresence>
                    {filteredFilieres.map((filiere, index) => (
                      <motion.tr
                        key={filiere.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05, duration: 0.5 }}
                        className={`hover:bg-secondary-50 ${filiere.isDeleted ? 'opacity-60' : ''}`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-1 rounded bg-primary-100 mr-2">
                              <BookOpen className="h-3 w-3 text-primary-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-secondary-900 truncate">
                                {filiere.nom}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-secondary-900">{filiere.code}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-secondary-900">{filiere.niveau?.nom}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                            {filiere.niveau?.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {filiere.isDeleted ? (
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
                            {filiere.isDeleted ? (
                              <div title="Restaurer">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRestoreFiliere(filiere.id)}
                                  className="p-1 h-6 w-6"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div title="Modifier">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditModal(filiere)}
                                    className="p-1 h-6 w-6"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div title="Supprimer">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openDeleteModal(filiere)}
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

            {filteredFilieres.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">
                  Aucune filière trouvée
                </h3>
                <p className="text-secondary-600">
                  {searchTerm || selectedNiveau
                    ? 'Aucune filière ne correspond à vos critères de recherche.'
                    : 'Commencez par créer votre première filière.'}
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
        title="Créer une nouvelle filière"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Nom de la filière
            </label>
            <Input
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex: Informatique et Réseaux"
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Code de la filière
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ex: L2-IRS"
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Niveau
            </label>
            <select
              value={formData.niveauId}
              onChange={(e) => setFormData({ ...formData, niveauId: e.target.value })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Sélectionner un niveau</option>
              {niveaux.map((niveau) => (
                <option key={niveau.id} value={niveau.id}>
                  {niveau.nom} ({niveau.type})
                </option>
              ))}
            </select>
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
              onClick={handleCreateFiliere}
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
        title="Modifier la filière"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Nom de la filière
            </label>
            <Input
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex: Informatique et Réseaux"
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Code de la filière
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ex: L2-IRS"
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Niveau
            </label>
            <select
              value={formData.niveauId}
              onChange={(e) => setFormData({ ...formData, niveauId: e.target.value })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Sélectionner un niveau</option>
              {niveaux.map((niveau) => (
                <option key={niveau.id} value={niveau.id}>
                  {niveau.nom} ({niveau.type})
                </option>
              ))}
            </select>
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
              onClick={handleUpdateFiliere}
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
        {deletingFiliere && (
          <div className="space-y-4">
            <p className="text-secondary-600">
              Êtes-vous sûr de vouloir supprimer la filière{' '}
              <strong>{deletingFiliere.nom}</strong> ?
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
                onClick={handleDeleteFiliere}
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

export default FiliereManagement; 