import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast.success('Email de réinitialisation envoyé !');
      } else {
        toast.error(result.message || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
              Email envoyé !
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-secondary-600 mb-6"
            >
              Si l'adresse <strong>{getValues('email')}</strong> existe dans notre système, 
              vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-4"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Vérifiez votre boîte de réception</strong><br />
                  Le lien de réinitialisation est valide pendant 1 heure seulement.
                </p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </Link>
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
            Mot de passe oublié ?
          </motion.h1>
          
          <motion.p
            className="text-secondary-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            Entrez votre email pour recevoir un lien de réinitialisation
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
                  Envoi en cours...
                </div>
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </motion.button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour à la connexion
              </Link>
            </div>
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

export default ForgotPassword; 