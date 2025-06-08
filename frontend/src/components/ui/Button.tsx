import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      type = 'button',
      onClick,
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group';

    const variantClasses = {
      primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-primary-500 shadow-lg hover:shadow-xl',
      secondary: 'bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-900 hover:from-secondary-200 hover:to-secondary-300 focus:ring-secondary-500 shadow-md hover:shadow-lg',
      outline: 'border-2 border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400 focus:ring-primary-500 shadow-sm hover:shadow-md',
      ghost: 'text-secondary-700 hover:bg-secondary-100 focus:ring-secondary-500 hover:shadow-md',
      danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-lg hover:shadow-xl',
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-2.5 text-sm',
      lg: 'px-8 py-3 text-base',
    };

    const classes = clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'w-full',
      className
    );

    const buttonVariants = {
      initial: { scale: 1 },
      hover: { 
        scale: disabled || isLoading ? 1 : 1.02,
        transition: { duration: 0.2, ease: 'easeOut' }
      },
      tap: { 
        scale: disabled || isLoading ? 1 : 0.98,
        transition: { duration: 0.1 }
      },
    };

    const shimmerVariants = {
      initial: { x: '-100%' },
      hover: { 
        x: '100%',
        transition: { duration: 0.6, ease: 'easeInOut' }
      },
    };

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        type={type}
        onClick={onClick}
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
      >
        {/* Shimmer effect */}
        {!disabled && !isLoading && variant === 'primary' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            variants={shimmerVariants}
            initial="initial"
          />
        )}

        {/* Ripple effect background */}
        <motion.div
          className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100"
          transition={{ duration: 0.3 }}
        />

        <div className="relative z-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                <motion.div
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span>Chargement...</span>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                {leftIcon && (
                  <motion.span
                    className="mr-2"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {leftIcon}
                  </motion.span>
                )}
                <span>{children}</span>
                {rightIcon && (
                  <motion.span
                    className="ml-2"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {rightIcon}
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button; 