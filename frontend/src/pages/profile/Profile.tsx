import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Lock, 
  Mail, 
  Shield, 
  Calendar, 
  Edit3, 
  Save, 
  Eye, 
  EyeOff,
  CheckCircle,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis'),
  nom: z.string().min(1, 'Le nom est requis'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z
    .string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string().min(1, 'Confirmez le nouveau mot de passe'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      prenom: user?.prenom || '',
      nom: user?.nom || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Sync form with user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        prenom: user.prenom || '',
        nom: user.nom || '',
      });
    }
  }, [user, profileForm]);

  const onUpdateProfile = async (data: ProfileFormData) => {
    try {
      setIsUpdatingProfile(true);
      await updateProfile(data);
      // Reset form with new values after successful update
      profileForm.reset({
        prenom: data.prenom,
        nom: data.nom,
      });
    } catch (error) {
      // Error handled in context
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    try {
      setIsChangingPassword(true);
      await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Mot de passe changé avec succès');
      passwordForm.reset();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'professeur':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'etudiant':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'professeur':
        return User;
      case 'etudiant':
        return User;
      default:
        return User;
    }
  };

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'admin':
        return 'from-red-500 to-red-600';
      case 'professeur':
        return 'from-blue-500 to-blue-600';
      case 'etudiant':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const formatRoleForDisplay = (role: string) => {
    switch (role) {
      case 'professeur':
        return 'Enseignant(e)';
      case 'admin':
        return 'Administrateur';
      case 'etudiant':
        return 'Étudiant';
      default:
        return role?.charAt(0).toUpperCase() + role?.slice(1);
    }
  };

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

  const tabVariants = {
    inactive: { 
      scale: 1,
      opacity: 0.8,
    },
    active: { 
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
  };

  const FloatingLabelInput = ({ 
    label, 
    type, 
    error, 
    register, 
    name,
    rightIcon,
    disabled = false,
  }: any) => {
    const isFocused = focusedField === name;
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-700">
          {label}
        </label>
        <div className="relative">
          <input
            {...register}
            type={type}
            disabled={disabled}
            onFocus={() => setFocusedField(name)}
            onBlur={() => setFocusedField(null)}
            className={`
              w-full px-4 py-4 border-2 rounded-xl bg-white/80 backdrop-blur-sm
              transition-all duration-200
              focus:outline-none focus:ring-0
              ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
              ${error 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-secondary-200 focus:border-primary-500'
              }
              ${isFocused ? 'shadow-lg shadow-primary-500/10' : 'shadow-sm'}
            `}
            placeholder={disabled ? label : `Entrez votre ${label.toLowerCase()}`}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <div className="text-sm text-red-600 flex items-center">
            <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mr-2 text-xs">
              !
            </span>
            {error.message}
          </div>
        )}
      </div>
    );
  };

  if (!user) {
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
            Chargement du profil...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Enhanced Header */}
      <div>
        <div className={`relative overflow-hidden bg-gradient-to-br ${getRoleGradient(user.role)} rounded-2xl p-8 text-white shadow-2xl`}>
          {/* Background decoration */}
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 opacity-10"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <RoleIcon className="w-full h-full" />
          </motion.div>

          <div className="relative z-10">
            <div className="flex items-center space-x-6">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="h-24 w-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <span className="text-white font-medium text-lg">
                    {(user.prenom || '').charAt(0)}{(user.nom || '').charAt(0)}
                  </span>
                </motion.div>
                <motion.button
                  className="absolute -bottom-2 -right-2 h-8 w-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Camera className="h-4 w-4" />
                </motion.button>
              </motion.div>
              
              <div className="flex-1">
                <motion.h1
                  className="text-3xl font-bold mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  {user.prenom} {user.nom}
                </motion.h1>
                
                <motion.div
                  className="flex items-center space-x-4 mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(user.role)}`}>
                    <RoleIcon className="h-4 w-4 mr-2" />
                    {formatRoleForDisplay(user.role)}
                  </span>
                  
                  <div className="flex items-center text-white/80 text-sm">
                    <Mail className="h-4 w-4 mr-2" />
                    {user.email}
                  </div>
                </motion.div>
                
                <motion.div
                  className="flex items-center text-white/70 text-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div>
        <div className="bg-white rounded-2xl shadow-lg border border-secondary-100 p-2">
          <nav className="flex space-x-2">
            {[
              { id: 'profile', label: 'Informations personnelles', icon: User },
              { id: 'password', label: 'Sécurité', icon: Lock },
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-primary-600'
                  }`}
                >
                  <TabIcon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'profile' && (
          <motion.div
            className="bg-white rounded-2xl shadow-lg border border-secondary-100 p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center mb-6">
              <motion.div
                className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mr-4"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Edit3 className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold text-secondary-900">
                  Informations personnelles
                </h3>
                <p className="text-secondary-600">
                  Modifiez vos informations de profil
                </p>
              </div>
            </div>
            
            <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FloatingLabelInput
                  label="Prénom"
                  type="text"
                  error={profileForm.formState.errors.prenom}
                  register={profileForm.register('prenom')}
                  name="prenom"
                />
                
                <FloatingLabelInput
                  label="Nom"
                  type="text"
                  error={profileForm.formState.errors.nom}
                  register={profileForm.register('nom')}
                  name="nom"
                />
              </div>

              <FloatingLabelInput
                label="Adresse email"
                type="email"
                register={() => ({ value: user.email })}
                name="email"
                disabled={true}
              />

              {user.filiere && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium leading-6 text-secondary-900 mb-2">
                      Niveau
                    </label>
                    <div className="px-3 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg text-sm text-secondary-700">
                      {user.niveau?.nom || 'Non défini'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium leading-6 text-secondary-900 mb-2">
                      Filière
                    </label>
                    <div className="px-3 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg text-sm text-secondary-700">
                      {user.filiere?.nom || 'Non définie'}
                    </div>
                  </div>
                </div>
              )}

              <motion.div
                className="flex justify-end"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className={`
                    flex items-center px-6 py-3 rounded-xl font-medium text-white transition-all duration-300
                    ${isUpdatingProfile
                      ? 'bg-secondary-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl shadow-primary-500/25'
                    }
                  `}
                  whileHover={!isUpdatingProfile ? { scale: 1.05 } : {}}
                >
                  <AnimatePresence mode="wait">
                    {isUpdatingProfile ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center"
                      >
                        <motion.div
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Mise à jour...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="save"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center"
                      >
                        <Save className="h-5 w-5 mr-2" />
                        Sauvegarder
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        )}

        {activeTab === 'password' && (
          <motion.div
            className="bg-white rounded-2xl shadow-lg border border-secondary-100 p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center mb-6">
              <motion.div
                className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg mr-4"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Lock className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold text-secondary-900">
                  Changer le mot de passe
                </h3>
                <p className="text-secondary-600">
                  Assurez-vous d'utiliser un mot de passe sécurisé
                </p>
              </div>
            </div>
            
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-6">
              <FloatingLabelInput
                label="Mot de passe actuel"
                type={showCurrentPassword ? 'text' : 'password'}
                error={passwordForm.formState.errors.currentPassword}
                register={passwordForm.register('currentPassword')}
                name="currentPassword"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="text-secondary-400 hover:text-secondary-600 transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                }
              />

              <FloatingLabelInput
                label="Nouveau mot de passe"
                type={showNewPassword ? 'text' : 'password'}
                error={passwordForm.formState.errors.newPassword}
                register={passwordForm.register('newPassword')}
                name="newPassword"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-secondary-400 hover:text-secondary-600 transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                }
              />

              <FloatingLabelInput
                label="Confirmer le nouveau mot de passe"
                type={showConfirmPassword ? 'text' : 'password'}
                error={passwordForm.formState.errors.confirmPassword}
                register={passwordForm.register('confirmPassword')}
                name="confirmPassword"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-secondary-400 hover:text-secondary-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                }
              />

              <motion.div
                className="flex justify-end"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.button
                  type="submit"
                  disabled={isChangingPassword}
                  className={`
                    flex items-center px-6 py-3 rounded-xl font-medium text-white transition-all duration-300
                    ${isChangingPassword
                      ? 'bg-secondary-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl shadow-red-500/25'
                    }
                  `}
                  whileHover={!isChangingPassword ? { scale: 1.05 } : {}}
                >
                  <AnimatePresence mode="wait">
                    {isChangingPassword ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center"
                      >
                        <motion.div
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Changement...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="change"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Changer le mot de passe
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        )}


      </div>
    </div>
  );
};

export default Profile; 