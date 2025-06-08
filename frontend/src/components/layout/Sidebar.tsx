import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
  GraduationCap,
  UserCheck,
  Shield,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Activity,
  Bell,
  Search,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles?: string[];
  children?: NavItem[];
  badge?: string;
  badgeColor?: string;
  description?: string;
}

const navigation: NavItem[] = [
  {
    name: 'Tableau de bord',
    href: '/dashboard',
    icon: Home,
    description: 'Vue d\'ensemble de votre activité',
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FileText,
    description: 'Parcourir les documents académiques',
  },
  {
    name: 'Corbeille',
    href: '/trash',
    icon: Trash2,
    roles: ['professeur', 'admin'],
    description: 'Documents supprimés - Récupération 30 jours',
  },
  {
    name: 'Administration',
    href: '/admin',
    icon: Shield,
    roles: ['admin'],
    description: 'Gestion du système',
    children: [
      {
        name: 'Utilisateurs',
        href: '/admin/users',
        icon: Users,
        roles: ['admin'],
        description: 'Gérer les comptes utilisateurs',
      },
      {
        name: 'Filières',
        href: '/admin/filieres',
        icon: BookOpen,
        roles: ['admin'],
        description: 'Gérer les filières d\'études',
      },
      {
        name: 'Matières',
        href: '/admin/matieres',
        icon: GraduationCap,
        roles: ['admin'],
        description: 'Gérer les matières enseignées',
      },
      {
        name: 'Activité',
        href: '/admin/activity',
        icon: Activity,
        roles: ['admin'],
        description: 'Journal d\'audit du système',
      },
    ],
  },
  {
    name: 'Mes Matières',
    href: '/professor/subjects',
    icon: UserCheck,
    roles: ['professeur'],
    description: 'Gérer vos matières enseignées',
  },
  {
    name: 'Mes Matières',
    href: '/student/subjects',
    icon: BookOpen,
    roles: ['etudiant'],
    description: 'Consulter vos matières d\'études',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Administration']);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
    closed: {
      x: isDesktop ? 0 : '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const overlayVariants = {
    open: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    closed: { 
      opacity: 0,
      transition: { duration: 0.3 }
    },
  };

  const itemVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    closed: {
      opacity: 0,
      x: -20,
    },
  };

  const getBadgeColor = (color?: string) => {
    switch (color) {
      case 'orange':
        return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'blue':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'green':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'red':
        return 'bg-red-100 text-red-600 border-red-200';
      default:
        return 'bg-orange-100 text-orange-600 border-orange-200';
    }
  };

  const NavItemComponent: React.FC<{ item: NavItem; level?: number }> = ({ item, level = 0 }) => {
    const [isHovered, setIsHovered] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const isActive = location.pathname === item.href || 
      (hasChildren && item.children?.some(child => location.pathname === child.href));

    const filteredChildren = item.children?.filter(child => {
      if (!child.roles) return true;
      return user && child.roles.includes(user.role);
    });

    if (hasChildren) {
      return (
        <motion.div variants={itemVariants}>
          <motion.button
            onClick={() => toggleExpanded(item.name)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
              isActive
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                : 'text-secondary-600 hover:bg-primary-50 hover:text-primary-700'
            }`}
            style={{ paddingLeft: `${1 + level * 0.5}rem` }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center">
              <item.icon className="h-5 w-5 mr-3" />
              <span className="font-medium">{item.name}</span>
              {item.badge && (
                <span
                  className={`ml-2 px-2 py-1 text-xs rounded-full border ${getBadgeColor(item.badgeColor)}`}
                >
                  {item.badge}
                </span>
              )}
            </div>
            
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isExpanded && filteredChildren && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-4 mt-2 space-y-1 border-l-2 border-primary-100 pl-4"
              >
                {filteredChildren.map((child) => (
                  <NavItemComponent key={child.name} item={child} level={level + 1} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    }

    return (
      <motion.div variants={itemVariants}>
        <NavLink
          to={item.href}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={({ isActive }) =>
            `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
              isActive
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                : 'text-secondary-600 hover:bg-primary-50 hover:text-primary-700'
            }`
          }
          style={{ paddingLeft: `${1 + level * 0.5}rem` }}
        >
          {({ isActive }) => (
            <>
              <item.icon className="h-5 w-5 mr-3" />
              
              <span className="font-medium">{item.name}</span>
              
              {item.badge && (
                <span
                  className={`ml-auto px-2 py-1 text-xs rounded-full border ${getBadgeColor(item.badgeColor)}`}
                >
                  {item.badge}
                </span>
              )}

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute right-0 top-1/2 w-1 h-8 bg-white rounded-l-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </>
          )}
        </NavLink>
      </motion.div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial={isDesktop ? 'open' : 'closed'}
        animate={isOpen ? 'open' : 'closed'}
        className={`
          w-80 bg-white/95 backdrop-blur-xl shadow-lg border-r border-secondary-200
          ${isDesktop 
            ? 'relative flex flex-col' 
            : `fixed inset-y-0 left-0 z-50 ${isOpen ? 'flex flex-col' : 'hidden'}`
          }
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <motion.div
            className="flex items-center justify-between p-6 border-b border-secondary-100"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/logo.png" 
                alt="ISI Archive Logo" 
                className="h-10 w-10 object-contain"
              />
              
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  ISI Archive
                </h1>
                <p className="text-xs text-secondary-500">Gestion documentaire</p>
              </div>
            </div>

            <motion.button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-xl text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="h-5 w-5" />
            </motion.button>
          </motion.div>

          {/* Navigation */}
          <motion.nav
            className="flex-1 px-4 py-6 space-y-2 overflow-y-auto"
            variants={sidebarVariants}
          >
            {filteredNavigation.map((item) => (
              <NavItemComponent key={item.name} item={item} />
            ))}
          </motion.nav>

          {/* Footer */}
          <motion.div
            className="p-4 border-t border-secondary-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>Se déconnecter</span>
              <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar; 