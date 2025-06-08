import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  // Debug form state
  console.log('Form errors:', errors);
  console.log('Form isValid:', isValid);

  // Reset submitting state when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      setIsSubmitting(false);
    }
  }, [isAuthenticated]);

  const onSubmit = async (data: LoginFormData) => {
    console.log('Form submitted with data:', data);
    if (isSubmitting) return; // Prevent double submission
    
    try {
      setIsSubmitting(true);
      setLoginError(null); // Clear any previous errors
      await login(data);
      // Don't set isSubmitting to false here - let successful login handle navigation
    } catch (error: any) {
      // Handle the error gracefully
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Une erreur est survenue lors de la connexion';
      setLoginError(errorMessage);
      setIsSubmitting(false); // Reset on error so user can try again
      console.error('Login error:', error);
    }
  };

  // Handle form submission with explicit event handling
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    console.log('Form submit event triggered');
    e.preventDefault();
    
    // Check if there are validation errors
    console.log('Current form errors:', errors);
    console.log('Form is valid:', isValid);
    
    // Call React Hook Form's handleSubmit
    handleSubmit(onSubmit)(e);
  };

  // Clear error when user starts typing
  const clearErrorOnChange = () => {
    if (loginError) {
      setLoginError(null);
    }
  };

  // Enhanced button animations
  const buttonVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Enhanced Header with original logo */}
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
            Bienvenue sur{' '}
            <motion.span
              className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              ISI Archive
            </motion.span>
          </motion.h1>
          
          <motion.p
            className="text-secondary-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            Connectez-vous pour accéder à vos documents académiques
          </motion.p>
        </motion.div>

        {/* Login Card with original styling */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200"
        >
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <Mail className="w-5 h-5 text-secondary-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full pl-12 pr-4 py-4 border-2 border-secondary-200 rounded-xl bg-white text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-0 focus:border-primary-500 transition-all duration-200 shadow-sm"
                  placeholder="votre@email.com"
                  onInput={clearErrorOnChange}
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 flex items-center"
                >
                  <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mr-2 text-xs">
                    !
                  </span>
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Mot de passe
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
                  onInput={clearErrorOnChange}
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

            {/* Login Error Display */}
            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4"
                >
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">
                        Erreur de connexion
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        {loginError}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forgot Password Link */}
            <div className="text-right">
              <motion.a
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                Mot de passe oublié ?
              </motion.a>
            </div>

            {/* Enhanced Submit Button */}
            <motion.div
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
            >
              <motion.button
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`
                  group relative w-full flex justify-center items-center py-4 px-4 border border-transparent 
                  text-sm font-medium rounded-xl text-white transition-all duration-300
                  ${isSubmitting || isLoading
                    ? 'bg-secondary-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl shadow-primary-500/25'
                  }
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                `}
              >
                <AnimatePresence mode="wait">
                  {isSubmitting || isLoading ? (
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
                      Connexion en cours...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="submit"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center"
                    >
                      Se connecter
                      <motion.div
                        className="ml-2"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
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

export default LoginForm; 