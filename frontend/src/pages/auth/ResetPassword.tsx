import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z
    .string()
    .min(1, 'Veuillez confirmer votre mot de passe'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      toast.error('Token de réinitialisation manquant');
    } else {
      setTokenValid(true);
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Token de réinitialisation manquant');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        toast.success('Mot de passe réinitialisé avec succès !');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(result.message || 'Erreur lors de la réinitialisation');
        if (result.message?.includes('invalide') || result.message?.includes('expiré')) {
          setTokenValid(false);
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6"
            >
              <AlertCircle className="w-8 h-8 text-red-600" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-2xl font-bold text-secondary-900 mb-4"
            >
              Lien invalide
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-secondary-600 mb-6"
            >
              Ce lien de réinitialisation est invalide ou a expiré. 
              Veuillez demander un nouveau lien de réinitialisation.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              onClick={() => navigate('/forgot-password')}
              className="w-full px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Demander un nouveau lien
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-2xl font-bold text-secondary-900 mb-4"
            >
              Mot de passe réinitialisé !
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-secondary-600 mb-6"
            >
              Votre mot de passe a été réinitialisé avec succès. 
              Vous allez être redirigé vers la page de connexion.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <p className="text-sm text-green-800">
                Redirection automatique dans 3 secondes...
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            className="flex justify-center -mb-10"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <img 
              src="/assets/logo.png" 
              alt="ISI Archive Logo" 
              className="w-40 h-40 object-contain drop-shadow-2xl"
            />
          </motion.div>
          
          <motion.h1
            className="text-3xl font-bold text-secondary-900 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Nouveau mot de passe
          </motion.h1>
          
          <motion.p
            className="text-secondary-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            Choisissez un nouveau mot de passe sécurisé
          </motion.p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <Lock className="w-5 h-5 text-secondary-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-12 pr-12 py-4 border-2 border-secondary-200 rounded-xl bg-white text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-0 focus:border-primary-500 transition-all duration-200 shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 flex items-center"
                >
                  <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mr-2 text-xs">
                    !
                  </span>
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <Lock className="w-5 h-5 text-secondary-400" />
                </div>
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full pl-12 pr-12 py-4 border-2 border-secondary-200 rounded-xl bg-white text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-0 focus:border-primary-500 transition-all duration-200 shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors z-10"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 flex items-center"
                >
                  <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mr-2 text-xs">
                    !
                  </span>
                  {errors.confirmPassword.message}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className={`
                group relative w-full flex justify-center items-center py-4 px-4 border border-transparent 
                text-sm font-medium rounded-xl text-white transition-all duration-300
                ${isLoading
                  ? 'bg-secondary-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl shadow-primary-500/25'
                }
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
              `}
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Réinitialisation...
                </div>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-secondary-500">
            © 2024 ISI Archive. Plateforme de gestion de documents académiques.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword; 