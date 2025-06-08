import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FileText,
  Search,
  Grid,
  List,
  Loader2,
  Eye,
  Users,
  Calendar,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { academicAPI } from '../../utils/api';
import { MatiereWithRoles } from '../../types';
import toast from 'react-hot-toast';

const SubjectManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matieres, setMatieres] = useState<MatiereWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchProfessorMatieres();
  }, []);

  const fetchProfessorMatieres = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const response = await academicAPI.getProfesseurMatieres(user.id);
        setMatieres(response.data);
      }
    } catch (error) {
      console.error('Error fetching professor matieres:', error);
      toast.error('Erreur lors du chargement des matières');
    } finally {
      setLoading(false);
    }
  };

  const handleMatiereClick = (matiere: MatiereWithRoles) => {
    navigate(`/professor/subjects/${matiere.id}`);
  };

  const filteredMatieres = matieres.filter(matiere =>
    matiere.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    matiere.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Chargement de vos matières...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (matieres.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-12"
      >
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune matière assignée</h3>
        <p className="mt-1 text-sm text-gray-500">
          Contactez l'administrateur pour vous assigner des matières.
        </p>
      </motion.div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Mes Matières</h1>
          <p className="mt-1 text-sm text-gray-500">
            Consultez vos matières assignées et gérez leurs documents
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-lg shadow p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une matière..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {filteredMatieres.length === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="text-center py-12"
        >
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune matière trouvée</h3>
          <p className="mt-1 text-sm text-gray-500">
            Aucune matière ne correspond à votre recherche.
          </p>
        </motion.div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredMatieres.map((matiere, index) => (
                <motion.div
                  key={matiere.id}
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => handleMatiereClick(matiere)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {matiere.nom}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {matiere.code}
                        </span>
                        {matiere.semestre && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {matiere.semestre.nom}
                          </span>
                        )}
                      </div>
                      
                      {/* Roles */}
                      {matiere.roles && matiere.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {matiere.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                            >
                              {getRoleLabel(role)}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {matiere.filiere && (
                        <div className="flex items-center text-sm text-gray-500">
                          <GraduationCap className="w-4 h-4 mr-1" />
                          <span>{matiere.filiere.nom}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              variants={itemVariants}
              className="bg-white shadow overflow-hidden sm:rounded-lg"
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matière
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filière
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semestre
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMatieres.map((matiere, index) => (
                    <motion.tr 
                      key={matiere.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleMatiereClick(matiere)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-primary-100 rounded-lg mr-3">
                            <BookOpen className="w-4 h-4 text-primary-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {matiere.nom}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {matiere.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {matiere.roles && matiere.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {matiere.roles.map((role) => (
                              <span
                                key={role}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                              >
                                {getRoleLabel(role)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Aucun rôle</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {matiere.filiere?.nom || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {matiere.semestre?.nom || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default SubjectManagement; 