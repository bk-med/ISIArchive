import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { User as UserType, CreateUserData, UpdateUserData, Niveau, Filiere } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  prenom: z
    .string()
    .min(1, 'Le prénom est requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères'),
  nom: z
    .string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères'),
  role: z.enum(['etudiant', 'professeur', 'admin'], {
    required_error: 'Le rôle est requis',
  }),
  filiereId: z.string().optional(),
  niveauId: z.string().optional(),
}).refine((data) => {
  if (data.role === 'etudiant') {
    return data.filiereId && data.niveauId;
  }
  return true;
}, {
  message: 'La filière et le niveau sont requis pour les étudiants',
  path: ['filiereId'],
});

const updateUserSchema = z.object({
  prenom: z
    .string()
    .min(1, 'Le prénom est requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères'),
  nom: z
    .string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères'),
  role: z.enum(['etudiant', 'professeur', 'admin'], {
    required_error: 'Le rôle est requis',
  }),
  isActive: z.boolean(),
  filiereId: z.string().optional(),
  niveauId: z.string().optional(),
}).refine((data) => {
  if (data.role === 'etudiant') {
    return data.filiereId && data.niveauId;
  }
  return true;
}, {
  message: 'La filière et le niveau sont requis pour les étudiants',
  path: ['filiereId'],
});

type CreateFormData = z.infer<typeof createUserSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;

interface UserFormProps {
  user?: UserType;
  onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
  onCancel: () => void;
  niveaux: Niveau[];
  filieres: Filiere[];
  isEditing?: boolean;
}

// Create User Form Component
const CreateUserForm: React.FC<Omit<UserFormProps, 'isEditing'>> = ({
  onSubmit,
  onCancel,
  niveaux,
  filieres,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('etudiant');
  const [selectedNiveau, setSelectedNiveau] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'etudiant',
      filiereId: '',
      niveauId: '',
    },
  });

  const watchedRole = watch('role');
  const watchedNiveau = watch('niveauId');

  useEffect(() => {
    setSelectedRole(watchedRole);
  }, [watchedRole]);

  useEffect(() => {
    if (watchedNiveau !== undefined) {
      setSelectedNiveau(watchedNiveau);
    }
  }, [watchedNiveau]);

  const filteredFilieres = filieres.filter(filiere => 
    !selectedNiveau || filiere.niveauId === selectedNiveau
  );

  const onFormSubmit = async (data: CreateFormData) => {
    try {
      setIsSubmitting(true);
      const cleanedData = { ...data };
      if (data.role !== 'etudiant') {
        delete cleanedData.filiereId;
        delete cleanedData.niveauId;
      }
      await onSubmit(cleanedData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit(onFormSubmit)}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Input
          {...register('email')}
          type="email"
          label="Adresse email"
          placeholder="utilisateur@isi.tn"
          error={errors.email?.message}
          leftIcon={<Mail />}
          fullWidth
          required
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          label="Mot de passe"
          placeholder="Mot de passe sécurisé"
          error={errors.password?.message}
          leftIcon={<Lock />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          }
          fullWidth
          required
        />
        <p className="mt-1 text-xs text-secondary-500">
          Le mot de passe doit contenir au moins 8 caractères avec une minuscule, une majuscule et un chiffre.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('prenom')}
          type="text"
          label="Prénom"
          placeholder="Prénom"
          error={errors.prenom?.message}
          leftIcon={<User />}
          fullWidth
          required
        />
        <Input
          {...register('nom')}
          type="text"
          label="Nom"
          placeholder="Nom de famille"
          error={errors.nom?.message}
          leftIcon={<User />}
          fullWidth
          required
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Rôle <span className="text-red-500">*</span>
        </label>
        <select
          {...register('role')}
          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="etudiant">Étudiant</option>
          <option value="professeur">Enseignant(e)</option>
          <option value="admin">Administrateur</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </motion.div>

      {selectedRole === 'etudiant' && (
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Niveau <span className="text-red-500">*</span>
              </label>
              <select
                {...register('niveauId')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onChange={(e) => {
                  setValue('niveauId', e.target.value);
                  setValue('filiereId', '');
                }}
              >
                <option value="">Sélectionner un niveau</option>
                {niveaux.map((niveau) => (
                  <option key={niveau.id} value={niveau.id}>
                    {niveau.nom}
                  </option>
                ))}
              </select>
              {errors.niveauId && (
                <p className="mt-1 text-sm text-red-600">{errors.niveauId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Filière <span className="text-red-500">*</span>
              </label>
              <select
                {...register('filiereId')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!selectedNiveau}
              >
                <option value="">Sélectionner une filière</option>
                {filteredFilieres.map((filiere) => (
                  <option key={filiere.id} value={filiere.id}>
                    {filiere.nom} ({filiere.code})
                  </option>
                ))}
              </select>
              {errors.filiereId && (
                <p className="mt-1 text-sm text-red-600">{errors.filiereId.message}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="flex justify-end gap-3 pt-6 border-t border-secondary-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          Créer l'utilisateur
        </Button>
      </motion.div>
    </motion.form>
  );
};

// Update User Form Component
const UpdateUserForm: React.FC<Omit<UserFormProps, 'isEditing'> & { user: UserType }> = ({
  user,
  onSubmit,
  onCancel,
  niveaux,
  filieres,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(user.role);
  const [selectedNiveau, setSelectedNiveau] = useState<string>(user.niveauId || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      prenom: user.prenom,
      nom: user.nom,
      role: user.role,
      isActive: user.isActive,
      filiereId: user.filiereId || '',
      niveauId: user.niveauId || '',
    },
  });

  const watchedRole = watch('role');
  const watchedNiveau = watch('niveauId');

  useEffect(() => {
    setSelectedRole(watchedRole);
  }, [watchedRole]);

  useEffect(() => {
    if (watchedNiveau !== undefined) {
      setSelectedNiveau(watchedNiveau);
    }
  }, [watchedNiveau]);

  const filteredFilieres = filieres.filter(filiere => 
    !selectedNiveau || filiere.niveauId === selectedNiveau
  );

  const onFormSubmit = async (data: UpdateFormData) => {
    try {
      setIsSubmitting(true);
      const cleanedData = { ...data };
      if (data.role !== 'etudiant') {
        delete cleanedData.filiereId;
        delete cleanedData.niveauId;
      }
      await onSubmit(cleanedData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit(onFormSubmit)}
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('prenom')}
          type="text"
          label="Prénom"
          placeholder="Prénom"
          error={errors.prenom?.message}
          leftIcon={<User />}
          fullWidth
          required
        />
        <Input
          {...register('nom')}
          type="text"
          label="Nom"
          placeholder="Nom de famille"
          error={errors.nom?.message}
          leftIcon={<User />}
          fullWidth
          required
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Rôle <span className="text-red-500">*</span>
        </label>
        <select
          {...register('role')}
          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="etudiant">Étudiant</option>
          <option value="professeur">Enseignant(e)</option>
          <option value="admin">Administrateur</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </motion.div>

      {selectedRole === 'etudiant' && (
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Niveau <span className="text-red-500">*</span>
              </label>
              <select
                {...register('niveauId')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onChange={(e) => {
                  setValue('niveauId', e.target.value);
                  setValue('filiereId', '');
                }}
              >
                <option value="">Sélectionner un niveau</option>
                {niveaux.map((niveau) => (
                  <option key={niveau.id} value={niveau.id}>
                    {niveau.nom}
                  </option>
                ))}
              </select>
              {errors.niveauId && (
                <p className="mt-1 text-sm text-red-600">{errors.niveauId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Filière <span className="text-red-500">*</span>
              </label>
              <select
                {...register('filiereId')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!selectedNiveau}
              >
                <option value="">Sélectionner une filière</option>
                {filteredFilieres.map((filiere) => (
                  <option key={filiere.id} value={filiere.id}>
                    {filiere.nom} ({filiere.code})
                  </option>
                ))}
              </select>
              {errors.filiereId && (
                <p className="mt-1 text-sm text-red-600">{errors.filiereId.message}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <label className="flex items-center">
          <input
            {...register('isActive')}
            type="checkbox"
            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm font-medium text-secondary-700">
            Compte actif
          </span>
        </label>
      </motion.div>

      <motion.div variants={itemVariants} className="flex justify-end gap-3 pt-6 border-t border-secondary-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          Mettre à jour
        </Button>
      </motion.div>
    </motion.form>
  );
};

// Main UserForm Component
const UserForm: React.FC<UserFormProps> = (props) => {
  if (props.isEditing && props.user) {
    return <UpdateUserForm {...props} user={props.user} />;
  } else {
    return <CreateUserForm {...props} />;
  }
};

export default UserForm; 