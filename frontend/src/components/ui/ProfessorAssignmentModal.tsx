import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  User,
  BookOpen,
  Save,
  Loader2
} from 'lucide-react';
import { academicAPI, usersAPI } from '../../utils/api';
import { Matiere, User as UserType, ProfesseurWithRoles } from '../../types';
import Button from './Button';
import toast from 'react-hot-toast';

interface ProfessorAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  matiere: Matiere;
  onUpdate: () => void;
}

interface ProfessorAssignment {
  professeurId: string;
  roles: ('cours' | 'td' | 'tp')[];
}

const ProfessorAssignmentModal: React.FC<ProfessorAssignmentModalProps> = ({
  isOpen,
  onClose,
  matiere,
  onUpdate
}) => {
  const [professors, setProfessors] = useState<UserType[]>([]);
  const [currentProfessors, setCurrentProfessors] = useState<ProfesseurWithRoles[]>([]);
  const [assignments, setAssignments] = useState<ProfessorAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, matiere.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [professorsRes, currentProfessorsRes] = await Promise.all([
        usersAPI.getUsers({ role: 'professeur', limit: 100 }),
        academicAPI.getMatiereProfesseurs(matiere.id)
      ]);

      setProfessors(professorsRes.data.users || []);
      setCurrentProfessors(currentProfessorsRes.data || []);

      // Initialize assignments from current professors
      const initialAssignments = (currentProfessorsRes.data || []).map((prof: ProfesseurWithRoles) => ({
        professeurId: prof.id,
        roles: prof.roles
      }));
      setAssignments(initialAssignments);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const addProfessor = () => {
    setAssignments([...assignments, { professeurId: '', roles: [] }]);
  };

  const removeProfessor = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const updateProfessor = (index: number, professeurId: string) => {
    const newAssignments = [...assignments];
    newAssignments[index].professeurId = professeurId;
    setAssignments(newAssignments);
  };

  const updateRoles = (index: number, role: 'cours' | 'td' | 'tp', checked: boolean) => {
    const newAssignments = [...assignments];
    if (checked) {
      // Check if this role is already assigned to another professor
      const isRoleAlreadyAssigned = assignments.some((assignment, i) => 
        i !== index && assignment.roles.includes(role)
      );
      
      if (isRoleAlreadyAssigned) {
        const roleLabel = getRoleLabel(role);
        toast.error(`Le rôle ${roleLabel} est déjà assigné à un autre enseignant`);
        return;
      }
      
      if (!newAssignments[index].roles.includes(role)) {
        newAssignments[index].roles.push(role);
      }
    } else {
      newAssignments[index].roles = newAssignments[index].roles.filter(r => r !== role);
    }
    setAssignments(newAssignments);
  };

  const isRoleDisabled = (currentIndex: number, role: 'cours' | 'td' | 'tp') => {
    // Check if this role is already assigned to another professor
    return assignments.some((assignment, i) => 
      i !== currentIndex && assignment.roles.includes(role)
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate assignments
      for (const assignment of assignments) {
        if (!assignment.professeurId) {
          toast.error('Veuillez sélectionner un enseignant pour toutes les assignations');
          return;
        }
        if (assignment.roles.length === 0) {
          toast.error('Veuillez sélectionner au moins un rôle pour chaque enseignant');
          return;
        }
      }

      // Check for duplicate professors
      const professorIds = assignments.map(a => a.professeurId);
      const uniqueProfessorIds = new Set(professorIds);
      if (professorIds.length !== uniqueProfessorIds.size) {
        toast.error('Un enseignant ne peut pas être assigné plusieurs fois');
        return;
      }

      // Check for duplicate roles (each role can only be assigned to one professor)
      const allRoles: string[] = [];
      for (const assignment of assignments) {
        for (const role of assignment.roles) {
          if (allRoles.includes(role)) {
            const roleLabel = getRoleLabel(role as 'cours' | 'td' | 'tp');
            toast.error(`Le rôle ${roleLabel} ne peut être assigné qu'à un seul enseignant`);
            return;
          }
          allRoles.push(role);
        }
      }

      await academicAPI.updateMatiereProfesseurs(matiere.id, {
        professeurs: assignments
      });

      toast.success('Assignations mises à jour avec succès');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error saving assignments:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getProfessorName = (professeurId: string) => {
    const prof = professors.find(p => p.id === professeurId);
    return prof ? `${prof.prenom} ${prof.nom}` : '';
  };

  const getRoleLabel = (role: 'cours' | 'td' | 'tp') => {
    switch (role) {
      case 'cours': return 'Cours';
      case 'td': return 'TD';
      case 'tp': return 'TP';
      default: return role;
    }
  };

  const getRoleColor = (role: 'cours' | 'td' | 'tp') => {
    switch (role) {
      case 'cours': return 'bg-blue-100 text-blue-800';
      case 'td': return 'bg-green-100 text-green-800';
      case 'tp': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Assignation des Enseignants
                </h2>
                <p className="text-sm text-gray-500">
                  {matiere.nom} ({matiere.code})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Chargement...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Assignments */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Assignations des Enseignants
                    </h3>
                    <Button
                      onClick={addProfessor}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter</span>
                    </Button>
                  </div>

                  {assignments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Aucun enseignant assigné</p>
                      <p className="text-sm">Cliquez sur "Ajouter" pour commencer</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((assignment, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-start space-x-4">
                            {/* Professor Selection */}
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enseignant(e)
                              </label>
                              <select
                                value={assignment.professeurId}
                                onChange={(e) => updateProfessor(index, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Sélectionner un enseignant</option>
                                {professors.map((prof) => (
                                  <option key={prof.id} value={prof.id}>
                                    {prof.prenom} {prof.nom} ({prof.email})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Roles Selection */}
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rôles
                              </label>
                              <div className="flex space-x-4">
                                {(['cours', 'td', 'tp'] as const).map((role) => {
                                  const isDisabled = isRoleDisabled(index, role);
                                  const isChecked = assignment.roles.includes(role);
                                  
                                  return (
                                    <label key={role} className={`flex items-center ${isDisabled && !isChecked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={isDisabled && !isChecked}
                                        onChange={(e) => updateRoles(index, role, e.target.checked)}
                                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                      />
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)} ${isDisabled && !isChecked ? 'opacity-50' : ''}`}>
                                        {getRoleLabel(role)}
                                        {isDisabled && !isChecked && (
                                          <span className="ml-1 text-xs">✓</span>
                                        )}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                              {/* Show which professor has which role */}
                              <div className="mt-2 text-xs text-gray-500">
                                {(['cours', 'td', 'tp'] as const).map((role) => {
                                  const assignedProfessor = assignments.find((a, i) => 
                                    i !== index && a.roles.includes(role)
                                  );
                                  if (assignedProfessor) {
                                    const profName = getProfessorName(assignedProfessor.professeurId);
                                    return (
                                      <div key={role} className="text-orange-600">
                                        {getRoleLabel(role)}: {profName}
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            </div>

                            {/* Remove Button */}
                            <div className="pt-6">
                              <button
                                onClick={() => removeProfessor(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center space-x-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfessorAssignmentModal; 