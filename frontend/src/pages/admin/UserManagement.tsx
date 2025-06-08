import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  UserCheck,
  UserX,
  Eye,
  Download,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI, academicAPI } from '../../utils/api';
import { User, CreateUserData, UpdateUserData, Niveau, Filiere } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import UserForm from '../../components/forms/UserForm';
import toast from 'react-hot-toast';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  roleDistribution: {
    admin: number;
    professeur: number;
    etudiant: number;
  };
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const itemsPerPage = 10;

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
    fetchUsers();
    fetchStats();
    fetchAcademicData();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter ? statusFilter === 'active' : undefined,
      });
      
      // The backend returns { data: { users: [...], pagination: {...} } }
      const usersData = Array.isArray(response.data.users) ? response.data.users : [];
      setUsers(usersData);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await usersAPI.getUserStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null); // Reset stats on error
    }
  };

  const fetchAcademicData = async () => {
    try {
      const [niveauxRes, filieresRes] = await Promise.all([
        academicAPI.getNiveaux(),
        academicAPI.getFilieres(),
      ]);
      setNiveaux(Array.isArray(niveauxRes.data) ? niveauxRes.data : []);
      setFilieres(Array.isArray(filieresRes.data) ? filieresRes.data : []);
    } catch (error) {
      console.error('Error fetching academic data:', error);
      setNiveaux([]);
      setFilieres([]);
    }
  };

  const handleCreateUser = async (userData: CreateUserData | UpdateUserData) => {
    try {
      await usersAPI.createUser(userData as CreateUserData);
      toast.success('Utilisateur créé avec succès');
      setShowCreateModal(false);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleUpdateUser = async (userData: CreateUserData | UpdateUserData) => {
    if (!editingUser) return;
    try {
      await usersAPI.updateUser(editingUser.id, userData as UpdateUserData);
      toast.success('Utilisateur mis à jour avec succès');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await usersAPI.deleteUser(deletingUser.id);
      toast.success('Utilisateur supprimé avec succès');
      setShowDeleteModal(false);
      setDeletingUser(null);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await usersAPI.toggleUserStatus(userId);
      toast.success('Statut modifié avec succès');
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleBulkUpdate = async (updateData: Partial<UpdateUserData>) => {
    if (selectedUsers.length === 0) return;
    try {
      await usersAPI.bulkUpdateUsers({
        userIds: selectedUsers,
        updateData,
      });
      toast.success(`${selectedUsers.length} utilisateur(s) mis à jour`);
      setSelectedUsers([]);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (!Array.isArray(users)) return; // Safety check
    
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'professeur':
        return 'bg-blue-100 text-blue-800';
      case 'etudiant':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRoleForDisplay = (role: string) => {
    switch (role) {
      case 'professeur':
        return 'enseignant(e)';
      case 'admin':
        return 'admin';
      case 'etudiant':
        return 'étudiant';
      default:
        return role;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

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
            Chargement des utilisateurs...
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
            Gestion des Utilisateurs
          </motion.h1>
          <motion.p 
            className="text-secondary-600"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Gérez les comptes utilisateurs de la plateforme
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus />}
            className="bg-primary-600 hover:bg-primary-700"
          >
            Nouvel Utilisateur
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div 
          variants={itemVariants} 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalUsers}</p>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Actifs</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.activeUsers}</p>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <UserX className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Inactifs</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.inactiveUsers}</p>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Enseignants</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.roleDistribution.professeur}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Filters and Search */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par email, prénom ou nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search />}
              />
            </div>
            <div className="flex gap-4">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Tous les rôles</option>
                <option value="admin">Admin</option>
                                  <option value="professeur">Enseignant(e)</option>
                <option value="etudiant">Étudiant</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-primary-50 border border-primary-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-primary-700 font-medium">
                {selectedUsers.length} utilisateur(s) sélectionné(s)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkUpdate({ isActive: true })}
                >
                  Activer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkUpdate({ isActive: false })}
                >
                  Désactiver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUsers([])}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-2 py-2 text-left w-8">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={selectAllUsers}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-2/5">
                    Utilisateur
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-20">
                    Rôle
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-1/5">
                    Filière
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-16">
                    Statut
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-20">
                    Créé le
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                <AnimatePresence>
                  {Array.isArray(users) && users.length > 0 ? (
                    users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-secondary-50"
                      >
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-6 w-6 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                              <span className="text-white font-medium text-xs">
                                {(user.prenom || '').charAt(0)}{(user.nom || '').charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-secondary-900 truncate">
                                {user.prenom} {user.nom}
                              </div>
                              <div className="text-xs text-secondary-500 truncate">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded ${getRoleColor(user.role)}`}>
                            {formatRoleForDisplay(user.role)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-secondary-900">
                          <div className="truncate">{user.filiere?.nom || '-'}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded ${getStatusColor(user.isActive)}`}>
                            <span className="hidden sm:inline">{user.isActive ? 'Actif' : 'Inactif'}</span>
                            <span className="sm:hidden">{user.isActive ? 'OK' : 'KO'}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-secondary-500">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: '2-digit' 
                          })}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <div title="Modifier">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingUser(user);
                                  setShowEditModal(true);
                                }}
                                className="p-1 h-6 w-6"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                            <div title={user.isActive ? 'Désactiver' : 'Activer'}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleStatus(user.id)}
                                className={`p-1 h-6 w-6 ${user.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                              >
                                {user.isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                              </Button>
                            </div>
                            <div title="Supprimer">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setDeletingUser(user);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="text-secondary-500">
                          <div>
                            <Users className="h-12 w-12 mx-auto text-secondary-300 mb-4" />
                            <p className="text-lg font-medium text-secondary-900 mb-2">Aucun utilisateur trouvé</p>
                            <p className="text-secondary-500">
                              {searchTerm || roleFilter || statusFilter 
                                ? 'Aucun utilisateur ne correspond à vos critères de recherche.'
                                : 'Commencez par créer votre premier utilisateur.'
                              }
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div 
              className="px-6 py-4 border-t border-secondary-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-secondary-700">
                  Page {currentPage} sur {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouvel utilisateur"
        size="lg"
      >
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateModal(false)}
          niveaux={niveaux}
          filieres={filieres}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        title="Modifier l'utilisateur"
        size="lg"
      >
        {editingUser && (
          <UserForm
            user={editingUser}
            onSubmit={handleUpdateUser}
            onCancel={() => {
              setShowEditModal(false);
              setEditingUser(null);
            }}
            niveaux={niveaux}
            filieres={filieres}
            isEditing
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingUser(null);
        }}
        title="Confirmer la suppression"
      >
        {deletingUser && (
          <div className="space-y-4">
            <p className="text-secondary-600">
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <strong>{deletingUser.prenom} {deletingUser.nom}</strong> ?
            </p>
            <p className="text-sm text-red-600">
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingUser(null);
                }}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteUser}
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

export default UserManagement; 