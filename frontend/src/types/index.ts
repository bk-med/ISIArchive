export interface User {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: 'etudiant' | 'professeur' | 'admin';
  isActive: boolean;
  filiereId?: string;
  niveauId?: string;
  semestreId?: string;
  filiere?: Filiere;
  niveau?: Niveau;
  semestre?: Semestre;
  createdAt: string;
  updatedAt: string;
}

export interface Niveau {
  id: string;
  nom: string;
  type: 'licence' | 'master' | 'ingenieur';
  ordre: number;
  filieres?: Filiere[];
  semestres?: Semestre[];
}

export interface Filiere {
  id: string;
  nom: string;
  code: string;
  niveauId: string;
  niveau?: Niveau;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
}

export interface Semestre {
  id: string;
  nom: string;
  niveauId: string;
  niveau?: Niveau;
  ordre: number;
}

export interface Matiere {
  id: string;
  nom: string;
  code: string;
  filiereId: string;
  semestreId: string;
  filiere?: Filiere;
  semestre?: Semestre;
  professeurMatieres?: {
    professeur: {
      id: string;
      prenom: string;
      nom: string;
      email: string;
    };
    role: 'cours' | 'td' | 'tp';
  }[];
  roles?: ('cours' | 'td' | 'tp')[];
  isDeleted: boolean;
  deletedAt?: string;
}

export interface ProfesseurMatiere {
  id: string;
  professeurId: string;
  matiereId: string;
  role: 'cours' | 'td' | 'tp';
  createdAt: string;
  professeur?: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
  };
  matiere?: Matiere;
}

export interface ProfesseurWithRoles {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  roles: ('cours' | 'td' | 'tp')[];
}

export interface MatiereWithRoles {
  id: string;
  nom: string;
  code: string;
  filiereId: string;
  semestreId: string;
  filiere?: Filiere;
  semestre?: Semestre;
  roles: ('cours' | 'td' | 'tp')[];
  isDeleted: boolean;
  deletedAt?: string;
}

export interface Document {
  id: string;
  titre: string;
  description?: string;
  categorie: 'cours' | 'td' | 'tp' | 'examen' | 'pfe';
  nomFichier: string;
  tailleFichier: string;
  typeMime: string;
  createdAt: string;
  updatedAt?: string;
  correctionId?: string;
  downloadCount?: number;
  viewCount?: number;
  matiereId?: string;
  telchargePar?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  cheminFichier?: string;
  uploader: {
    id: string;
    prenom: string;
    nom: string;
    role: string;
  };
  matiere?: {
    id: string;
    nom: string;
    code: string;
  };
  documentMatieres?: {
    id: string;
    matiereId: string;
    matiere: {
      id: string;
      nom: string;
      code: string;
      filiere?: {
        id: string;
        nom: string;
        niveau?: {
          id: string;
          nom: string;
        };
      };
      semestre?: {
        id: string;
        nom: string;
      };
    };
  }[];
  pfeData?: PFEData;
  documentPFE?: PFEData;
  correction?: Document;
  correctionPour?: Document;
  _count?: {
    commentaires: number;
  };
}

export interface PFEData {
  id: string;
  documentId: string;
  anneeDiplome: number;
  filiereDiplome: string;
  titreProjet: string;
  resume?: string;
  motsCles: string[];
  createdAt: string;
}

export interface Comment {
  id: string;
  contenu: string;
  documentId: string;
  userId: string;
  parentId?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    prenom: string;
    nom: string;
    role: string;
  };
  replies?: Comment[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  canModerate?: boolean;
}

export interface UsersApiResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  prenom: string;
  nom: string;
  role: 'etudiant' | 'professeur' | 'admin';
  filiereId?: string;
  niveauId?: string;
}

export interface UpdateUserData {
  prenom?: string;
  nom?: string;
  role?: 'etudiant' | 'professeur' | 'admin';
  isActive?: boolean;
  filiereId?: string;
  niveauId?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface CreateDocumentData {
  titre: string;
  description?: string;
  categorie: 'cours' | 'td' | 'tp' | 'examen';
  matiereId?: string;
  matiereIds?: string[];
  niveau: string;
  filiere: string;
  semestre: string;
  matiere: string;
  document: File;
}

export interface CreatePFEDocumentData {
  titre: string;
  description?: string;
  anneeDiplome: number;
  filiereDiplome: string;
  titreProjet: string;
  resume?: string;
  motsCles?: string;
  niveau: string;
  filiere: string;
  semestre: string;
  document: File;
}

export interface CreateCorrectionData {
  titre: string;
  description?: string;
  document: File;
}

export interface CreateCommentData {
  contenu: string;
  parentId?: string;
} 