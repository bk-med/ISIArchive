import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
  id?: string;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className,
  onClick,
  id,
  style,
}) => {
  const baseClasses = 'bg-white rounded-lg transition-all duration-200';

  const variantClasses = {
    default: 'shadow-sm border border-secondary-200',
    elevated: 'shadow-lg border border-secondary-100',
    outlined: 'border-2 border-secondary-200',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    className
  );

  const baseMotionProps = {
    className: classes,
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
    onClick,
    id,
    style,
  };

  const hoverMotionProps = hover
    ? {
        whileHover: { y: -2, boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)' },
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }
    : {};

  return (
    <motion.div {...baseMotionProps} {...hoverMotionProps}>
      {children}
    </motion.div>
  );
};

export default Card; 