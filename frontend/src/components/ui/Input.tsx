import React, { InputHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = 'block w-full rounded-lg border-0 py-2.5 shadow-sm ring-1 ring-inset transition-all duration-200 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6';
    
    const stateClasses = error
      ? 'ring-red-300 placeholder:text-red-400 focus:ring-red-600 text-red-900'
      : 'ring-secondary-300 placeholder:text-secondary-400 focus:ring-primary-600 text-secondary-900';

    const paddingClasses = leftIcon && rightIcon
      ? 'pl-10 pr-10'
      : leftIcon
      ? 'pl-10 pr-3'
      : rightIcon
      ? 'pl-3 pr-10'
      : 'px-3';

    const inputClasses = clsx(
      baseClasses,
      stateClasses,
      paddingClasses,
      className
    );

    return (
      <motion.div
        className={clsx('relative', fullWidth && 'w-full')}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium leading-6 text-secondary-900 mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className={clsx('h-5 w-5', error ? 'text-red-400' : 'text-secondary-400')}>
                {leftIcon}
              </span>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            {...props}
          />
          
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className={clsx('h-5 w-5', error ? 'text-red-400' : 'text-secondary-400')}>
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2"
          >
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : (
              <p className="text-sm text-secondary-500">{helperText}</p>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 