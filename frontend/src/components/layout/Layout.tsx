import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, ChevronDown } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user } = useAuth();

  // Set sidebar open by default on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'professeur':
        return 'bg-blue-100 text-blue-700';
      case 'etudiant':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatRoleForDisplay = (role: string) => {
    switch (role) {
      case 'professeur':
        return 'enseignant(e)';
      case 'admin':
        return 'admin';
      case 'etudiant':
        return 'étudiant';
      default:
        return role;
    }
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-secondary-50 to-primary-50/30">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 px-4 py-4 relative z-50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-xl text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100/50 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu className="h-5 w-5" />
              </motion.button>
            </div>

            <div className="flex items-center space-x-4">
              {/* User menu */}
              {user && (
                <div className="relative z-50">
                  <motion.button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-secondary-100/50 transition-all duration-300 group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="hidden md:block text-right">
                      <p className="text-sm font-medium text-secondary-900 group-hover:text-primary-700 transition-colors">
                        {(user.prenom || '')} {(user.nom || '')}
                      </p>
                      <div className="flex items-center justify-end space-x-2">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {formatRoleForDisplay(user.role)}
                        </span>
                      </div>
                    </div>
                    
                    <motion.div
                      className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="text-white font-medium text-sm">
                        {(user.prenom || '').charAt(0)}{(user.nom || '').charAt(0)}
                      </span>
                    </motion.div>
                    
                    <motion.div
                      animate={{ rotate: showUserMenu ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="hidden md:block"
                    >
                      <ChevronDown className="h-4 w-4 text-secondary-400" />
                    </motion.div>
                  </motion.button>

                  {/* User dropdown menu */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-secondary-100 py-2 z-[100]"
                        onBlur={() => setShowUserMenu(false)}
                      >
                        <div className="px-4 py-3 border-b border-secondary-100">
                          <p className="text-sm font-medium text-secondary-900">
                            {(user.prenom || '')} {(user.nom || '')}
                          </p>
                          <p className="text-xs text-secondary-500">{user.email}</p>
                        </div>
                        
                        <motion.a
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <User className="h-4 w-4 mr-3" />
                          Mon Profil
                        </motion.a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="p-6"
          >
            <motion.div
              className="max-w-7xl mx-auto"
              layout
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 