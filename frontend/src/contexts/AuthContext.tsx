import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthResponse } from '../types';
import { authAPI, tokenManager } from '../utils/api';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_END' }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateProfile: (data: { prenom?: string; nom?: string }) => Promise<void>;
  clearError: () => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isLoggingIn: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGIN_START':
      return {
        ...state,
        isLoggingIn: true,
        error: null,
      };
    case 'LOGIN_END':
      return {
        ...state,
        isLoggingIn: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenManager.getToken();
      if (!token) {
        dispatch({ type: 'AUTH_FAILURE', payload: 'No token found' });
        return;
      }

      try {
        dispatch({ type: 'AUTH_START' });
        const response = await authAPI.getProfile();
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      } catch (error: any) {
        console.error('Auth check failed:', error);
        tokenManager.clearAll();
        dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      dispatch({ type: 'AUTH_START' });
      const response: AuthResponse = await authAPI.login(credentials);
      
      // Store tokens
      tokenManager.setToken(response.data.accessToken);
      tokenManager.setRefreshToken(response.data.refreshToken);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      dispatch({ type: 'LOGIN_END' });
      toast.success('Connexion réussie!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      dispatch({ type: 'LOGIN_END' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenManager.clearAll();
      dispatch({ type: 'LOGOUT' });
      toast.success('Déconnexion réussie');
    }
  };

  const logoutAll = async () => {
    try {
      await authAPI.logoutAll();
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      tokenManager.clearAll();
      dispatch({ type: 'LOGOUT' });
      toast.success('Déconnexion de tous les appareils réussie');
    }
  };

  const updateProfile = async (data: { prenom?: string; nom?: string }) => {
    try {
      const response = await authAPI.updateProfile(data);
      dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    logoutAll,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 