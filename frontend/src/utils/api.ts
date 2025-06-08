import axios, { AxiosResponse, AxiosError } from 'axios';
import { AuthResponse, ApiResponse, LoginCredentials, User, CreateUserData, UpdateUserData, ChangePasswordData, UsersApiResponse } from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'isi_access_token';
const REFRESH_TOKEN_KEY = 'isi_refresh_token';

export const tokenManager = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  removeRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),
  
  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken
          });
          
          const { accessToken } = response.data.data;
          tokenManager.setToken(accessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          tokenManager.clearAll();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  logout: async (): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/auth/logout');
    return response.data;
  },
  
  logoutAll: async (): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/auth/logout-all');
    return response.data;
  },
  
  getProfile: async (): Promise<ApiResponse<{ user: User; session: any }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User; session: any }>> = await api.get('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (data: { prenom?: string; nom?: string }): Promise<ApiResponse<{ user: User }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await api.put('/auth/profile', data);
    return response.data;
  },
  
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/auth/change-password', data);
    return response.data;
  },
  
  checkAuth: async (): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.get('/auth/check');
    return response.data;
  },
  
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  }
};

export const usersAPI = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<UsersApiResponse>> => {
    const response: AxiosResponse<ApiResponse<UsersApiResponse>> = await api.get('/users', { params });
    return response.data;
  },
  
  createUser: async (data: CreateUserData): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.post('/users', data);
    return response.data;
  },
  
  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get(`/users/${id}`);
    return response.data;
  },
  
  updateUser: async (id: string, data: UpdateUserData): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/users/${id}`, data);
    return response.data;
  },
  
  deleteUser: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/users/${id}`);
    return response.data;
  },
  
  toggleUserStatus: async (id: string): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.patch(`/users/${id}/toggle-status`);
    return response.data;
  },
  
  getUserStats: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/users/stats');
    return response.data;
  },
  
  bulkUpdateUsers: async (data: {
    userIds: string[];
    updateData: Partial<UpdateUserData>;
  }): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.put('/users/bulk-update', data);
    return response.data;
  }
};

export const academicAPI = {
  getNiveaux: async (): Promise<ApiResponse<any[]>> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get('/academic/niveaux');
    return response.data;
  },
  
  getFilieres: async (params?: {
    niveauId?: string;
    includeDeleted?: boolean;
  }): Promise<ApiResponse<any[]>> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get('/academic/filieres', { params });
    return response.data;
  },
  
  createFiliere: async (data: {
    nom: string;
    code: string;
    niveauId: string;
  }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/academic/filieres', data);
    return response.data;
  },
  
  updateFiliere: async (id: string, data: {
    nom?: string;
    code?: string;
    niveauId?: string;
  }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(`/academic/filieres/${id}`, data);
    return response.data;
  },
  
  deleteFiliere: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/academic/filieres/${id}`);
    return response.data;
  },
  
  restoreFiliere: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post(`/academic/filieres/${id}/restore`);
    return response.data;
  },
  
  getMatieres: async (params?: {
    filiereId?: string;
    semestreId?: string;
    niveauId?: string;
    includeDeleted?: boolean;
  }): Promise<ApiResponse<any[]>> => {
    const searchParams = new URLSearchParams();
    if (params?.filiereId) searchParams.append('filiereId', params.filiereId);
    if (params?.semestreId) searchParams.append('semestreId', params.semestreId);
    if (params?.niveauId) searchParams.append('niveauId', params.niveauId);
    if (params?.includeDeleted) searchParams.append('includeDeleted', 'true');
    
    const url = `/academic/matieres${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },
  
  getMatiere: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/academic/matieres/${id}`);
    return response.data;
  },
  
  createMatiere: async (data: {
    nom: string;
    code: string;
    filiereId: string;
    semestreId: string;
  }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/academic/matieres', data);
    return response.data;
  },
  
  updateMatiere: async (id: string, data: {
    nom?: string;
    code?: string;
    filiereId?: string;
    semestreId?: string;
  }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(`/academic/matieres/${id}`, data);
    return response.data;
  },
  
  deleteMatiere: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/academic/matieres/${id}`);
    return response.data;
  },
  
  restoreMatiere: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post(`/academic/matieres/${id}/restore`);
    return response.data;
  },
  
  getProfesseurMatieres: async (id: string): Promise<ApiResponse<any[]>> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get(`/academic/professeurs/${id}/matieres`);
    return response.data;
  },

  getMatiereProfesseurs: async (id: string): Promise<ApiResponse<any[]>> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get(`/academic/matieres/${id}/professeurs`);
    return response.data;
  },

  assignMatiereToProf: async (profId: string, data: { matiereId: string; role: 'cours' | 'td' | 'tp' }): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post(`/academic/professeurs/${profId}/matieres`, data);
    return response.data;
  },

  removeMatiereFromProf: async (profId: string, matiereId: string, role?: 'cours' | 'td' | 'tp'): Promise<ApiResponse> => {
    const data = role ? { role } : {};
    const response: AxiosResponse<ApiResponse> = await api.delete(`/academic/professeurs/${profId}/matieres/${matiereId}`, { data });
    return response.data;
  },

  updateMatiereProfesseurs: async (matiereId: string, data: {
    professeurs: Array<{
      professeurId: string;
      roles: ('cours' | 'td' | 'tp')[];
    }>;
  }): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.put(`/academic/matieres/${matiereId}/professeurs`, data);
    return response.data;
  }
};

export const documentsAPI = {
  getDocuments: async (params?: {
    page?: number;
    limit?: number;
    matiereId?: string;
    categorie?: string;
    search?: string;
  }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/documents', { params });
    return response.data;
  },

  uploadDocument: async (formData: FormData): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadPFEDocument: async (formData: FormData): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/documents/pfe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadCorrection: async (parentDocumentId: string, formData: FormData): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(`/documents/${parentDocumentId}/correction`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPFEDocuments: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    anneeDiplome?: number;
    filiereDiplome?: string;
  }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/documents/pfe', { params });
    return response.data;
  },

  getDocumentById: async (id: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(`/documents/${id}`);
    return response.data;
  },

  updateDocument: async (id: string, data: {
    titre?: string;
    description?: string;
  }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(`/documents/${id}`, data);
    return response.data;
  },

  deleteDocument: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/documents/${id}`);
    return response.data;
  },

  downloadDocument: async (id: string): Promise<Blob> => {
    const response: AxiosResponse<Blob> = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  previewDocument: async (id: string): Promise<Blob> => {
    const response: AxiosResponse<Blob> = await api.get(`/documents/${id}/preview`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getDocumentComments: async (id: string): Promise<ApiResponse<any[]>> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get(`/documents/${id}/comments`);
    return response.data;
  },

  createComment: async (documentId: string, data: {
    contenu: string;
    parentId?: string;
  }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(`/documents/${documentId}/comments`, data);
    return response.data;
  }
};

export const commentsAPI = {
  updateComment: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(`/documents/comments/${id}`, data);
    return response.data;
  },

  deleteComment: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/documents/comments/${id}`);
    return response.data;
  },

  checkReplyPermission: async (commentId: string): Promise<ApiResponse<{ canReply: boolean; reason?: string }>> => {
    const response: AxiosResponse<ApiResponse<{ canReply: boolean; reason?: string }>> = await api.get(`/documents/comments/${commentId}/can-reply`);
    return response.data;
  }
};

export const dashboardAPI = {
  getAdminDashboard: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/dashboard/admin');
    return response.data;
  },

  getProfessorDashboard: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/dashboard/professor');
    return response.data;
  },

  getStudentDashboard: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/dashboard/student');
    return response.data;
  }
};

export const healthAPI = {
  checkHealth: async (): Promise<any> => {
    const response: AxiosResponse<any> = await api.get('/health');
    return response.data;
  }
};

export default api; 