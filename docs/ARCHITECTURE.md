# ISI Archive - Documentation d'Architecture

## Aperçu du Système

ISI Archive est une application web full-stack construite avec des technologies modernes pour fournir une plateforme de gestion de documents évolutive, sécurisée et maintenable pour les institutions académiques.

## Stack Technologique

### Frontend
- **Framework**: React 18+ avec TypeScript (TSX)
- **Stylisation**: Tailwind CSS pour stylisation utility-first
- **Gestion d'État**: React Context API + useReducer pour état global
- **Client HTTP**: Axios pour communication API
- **Routage**: React Router v6 pour routage côté client
- **Gestion de Formulaires**: React Hook Form avec validation Zod
- **Téléchargement de Fichiers**: React Dropzone pour téléchargements drag-and-drop
- **Visualiseur PDF**: React-PDF pour aperçu de documents

### Backend
- **Runtime**: Node.js (version LTS)
- **Framework**: Express.js avec TypeScript
- **Authentification**: JWT (JSON Web Tokens) avec stratégie de refresh token
- **Téléchargement de Fichiers**: Middleware Multer pour gestion multipart/form-data
- **Validation**: Joi pour validation des requêtes
- **Sécurité**: Helmet, CORS, middleware de limitation de débit
- **Journalisation**: Winston pour journalisation structurée

### Base de Données
- **Base de Données Principale**: PostgreSQL 15+
- **ORM**: Prisma pour opérations de base de données type-safe
- **Cache**: Redis pour stockage de session et cache
- **Migration**: Migrations Prisma pour gestion du schéma de base de données

### Infrastructure
- **Conteneurisation**: Docker & Docker Compose
- **Stockage de Fichiers**: Système de fichiers local avec structure de répertoires organisée
- **Gestion d'Environnement**: Variables d'environnement Docker
- **Gestion de Processus**: PM2 pour déploiement en production

## Architecture Système

### Architecture de Haut Niveau

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Base de       │
│   (React/TSX)   │◄──►│   (Node.js)     │◄──►│   Données       │
│                 │    │                 │    │   (PostgreSQL)  │
│ - Composants    │    │ - API REST      │    │ - Données User  │
│ - Gestion État  │    │ - Couche Auth   │    │ - Documents     │
│ - Routage       │    │ - Gestion Fich. │    │ - Métadonnées   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │ Système de      │
                       │ Fichiers        │
                       │ (Uploads)       │
                       │ - Documents     │
                       │ - Images        │
                       │ - Organisé      │
                       └─────────────────┘
```

### Architecture en Couches

#### Couche Présentation (Frontend)
```
┌─────────────────────────────────────────────────────────────┐
│                    Couche Présentation                      │
├─────────────────────────────────────────────────────────────┤
│  Components/     │  Pages/        │  Hooks/      │  Utils/  │
│  - Layout        │  - Dashboard   │  - useAuth   │  - API   │
│  - Formulaires   │  - Documents   │  - useFiles  │  - Types │
│  - Tableaux      │  - Profil      │  - useForm   │  - Const │
│  - Modales       │  - Admin       │  - useQuery  │  - Valid │
└─────────────────────────────────────────────────────────────┘
```

#### Couche Application (Backend)
```
┌─────────────────────────────────────────────────────────────┐
│                    Couche Application                       │
├─────────────────────────────────────────────────────────────┤
│  Controllers/    │  Middleware/   │  Services/   │  Routes/ │
│  - AuthCtrl      │  - Auth        │  - UserSvc   │  - API   │
│  - UserCtrl      │  - Upload      │  - FileSvc   │  - Auth  │
│  - FileCtrl      │  - Validate    │  - DocSvc    │  - Files │
│  - AdminCtrl     │  - Error       │  - AdminSvc  │  - Admin │
└─────────────────────────────────────────────────────────────┘
```

#### Couche Données
```
┌─────────────────────────────────────────────────────────────┐
│                      Couche Données                         │
├─────────────────────────────────────────────────────────────┤
│  Models/         │  Repositories/ │  Migrations/ │  Seeds/  │
│  - User          │  - UserRepo    │  - Schema    │  - Admin │
│  - Document      │  - DocRepo     │  - Indexes   │  - Data  │
│  - Matiere       │  - MatiereRepo │  - Relations │  - Test  │
│  - Commentaire   │  - CommentRepo │  - History   │  - Demo  │
└─────────────────────────────────────────────────────────────┘
```

## Conception Base de Données

### Entités Principales

#### Gestion des Utilisateurs
```sql
Users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR)
├── prenom (VARCHAR)
├── nom (VARCHAR)
├── role (ENUM: etudiant, professeur, admin)
├── is_active (BOOLEAN)
├── filiere_id (UUID, FK)
├── niveau_id (UUID, FK)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### Structure Académique
```sql
Niveaux
├── id (UUID, PK)
├── nom (VARCHAR) -- L1, L2, L3, M1, M2, 1ING, 2ING, 3ING
├── type (ENUM: licence, master, ingenieur)
└── ordre (INTEGER)

Filieres
├── id (UUID, PK)
├── nom (VARCHAR)
├── code (VARCHAR, UNIQUE)
├── niveau_id (UUID, FK)
├── is_deleted (BOOLEAN)
├── deleted_at (TIMESTAMP)
└── created_at (TIMESTAMP)

Semestres
├── id (UUID, PK)
├── nom (VARCHAR) -- S1, S2, S3, S4, S5, S6
├── niveau_id (UUID, FK)
└── ordre (INTEGER)

Matieres
├── id (UUID, PK)
├── nom (VARCHAR)
├── code (VARCHAR)
├── filiere_id (UUID, FK)
├── semestre_id (UUID, FK)
├── is_deleted (BOOLEAN)
└── deleted_at (TIMESTAMP)

-- Table de liaison pour professeurs et matières (relation many-to-many)
ProfesseurMatieres
├── id (UUID, PK)
├── professeur_id (UUID, FK)
├── matiere_id (UUID, FK)
├── created_at (TIMESTAMP)
└── UNIQUE(professeur_id, matiere_id)
```

#### Gestion des Documents
```sql
Documents
├── id (UUID, PK)
├── titre (VARCHAR)
├── description (TEXT)
├── chemin_fichier (VARCHAR)
├── nom_fichier (VARCHAR)
├── taille_fichier (BIGINT)
├── type_mime (VARCHAR)
├── categorie (ENUM: cours, td, tp, examen, correction, pfe)
├── matiere_id (UUID, FK) -- NULL pour les PFE
├── telecharge_par (UUID, FK)
├── is_deleted (BOOLEAN)
├── deleted_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- Métadonnées spécifiques aux PFE
DocumentsPFE
├── id (UUID, PK)
├── document_id (UUID, FK)
├── annee_diplome (INTEGER)
├── filiere_diplome (VARCHAR)
├── titre_projet (VARCHAR)
├── resume (TEXT)
├── mots_cles (TEXT[])
└── created_at (TIMESTAMP)

Commentaires
├── id (UUID, PK)
├── contenu (TEXT)
├── document_id (UUID, FK)
├── user_id (UUID, FK)
├── parent_id (UUID, FK) -- pour réponses
├── is_deleted (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Relations
- Les utilisateurs appartiennent à une Filière et un Niveau
- Les Filières appartiennent à un Niveau
- Les Matières appartiennent à une Filière et un Semestre
- Les Professeurs peuvent être assignés à plusieurs Matières (relation many-to-many)
- Les Documents appartiennent à une Matière (sauf PFE) et sont téléchargés par un Utilisateur
- Les Documents PFE ont des métadonnées supplémentaires et sont gérés uniquement par les admins
- Les Commentaires appartiennent à un Document et un Utilisateur

## Organisation du Système de Fichiers

### Structure des Répertoires
```
uploads/
├── documents/
│   ├── {niveau}/
│   │   ├── {filiere}/
│   │   │   ├── {semestre}/
│   │   │   │   ├── {matiere}/
│   │   │   │   │   ├── cours/
│   │   │   │   │   ├── td/
│   │   │   │   │   ├── tp/
│   │   │   │   │   ├── examens/
│   │   │   │   │   └── corrections/
│   │   │   │   └── pfe/ (seulement pour semestres terminaux)
├── temp/
└── sauvegardes/
```

### Convention de Nommage des Fichiers
```
{timestamp}_{nom_original}_{hash}.{extension}
Exemple: 20241201_cours_algo_a1b2c3d4.pdf
```

## Conception API

### Points de Terminaison RESTful

#### Authentification
```
POST   /api/auth/connexion
POST   /api/auth/deconnexion
POST   /api/auth/rafraichir
GET    /api/auth/moi
```

#### Utilisateurs
```
GET    /api/utilisateurs           (Admin seulement)
POST   /api/utilisateurs           (Admin seulement)
GET    /api/utilisateurs/:id       (Admin/Soi-même)
PUT    /api/utilisateurs/:id       (Admin/Soi-même)
DELETE /api/utilisateurs/:id       (Admin seulement)
```

#### Structure Académique
```
GET    /api/niveaux
GET    /api/filieres
POST   /api/filieres               (Admin seulement)
PUT    /api/filieres/:id           (Admin seulement)
DELETE /api/filieres/:id           (Admin seulement)
GET    /api/matieres
POST   /api/matieres               (Admin seulement)
PUT    /api/matieres/:id           (Admin seulement)
DELETE /api/matieres/:id           (Admin seulement)
```

#### Gestion Professeur-Matières
```
GET    /api/professeurs/:id/matieres     (Admin/Professeur concerné)
POST   /api/professeurs/:id/matieres     (Admin seulement)
DELETE /api/professeurs/:id/matieres/:matiereId (Admin seulement)
GET    /api/matieres/:id/professeurs     (Admin seulement)
```

#### Documents
```
GET    /api/documents
POST   /api/documents              (Professeur/Admin)
GET    /api/documents/:id
PUT    /api/documents/:id          (Propriétaire/Admin)
DELETE /api/documents/:id          (Propriétaire/Admin)
GET    /api/documents/:id/telecharger
GET    /api/professeurs/:id/documents    (Tous les documents du professeur)
```

#### Documents PFE
```
GET    /api/pfe                    (Étudiants semestres terminaux)
POST   /api/pfe                    (Admin seulement)
PUT    /api/pfe/:id                (Admin seulement)
DELETE /api/pfe/:id               (Admin seulement)
GET    /api/pfe/:id/telecharger
```

#### Commentaires
```
GET    /api/documents/:id/commentaires
POST   /api/documents/:id/commentaires
PUT    /api/commentaires/:id       (Propriétaire/Admin)
DELETE /api/commentaires/:id       (Propriétaire/Admin)
```

## Architecture de Sécurité

### Flux d'Authentification
1. L'utilisateur soumet ses identifiants
2. Le serveur valide contre la base de données
3. Token d'accès JWT (15min) + token de rafraîchissement (7 jours) émis
4. Token d'accès utilisé pour les requêtes API
5. Token de rafraîchissement utilisé pour obtenir de nouveaux tokens d'accès

### Matrice d'Autorisation
```
Ressource               | Étudiant | Professeur | Admin
------------------------|----------|------------|-------
Voir Documents          |    ✓     |     ✓      |   ✓
Télécharger Docs        |    ✗     |     ✓      |   ✓
Gérer Utilisateurs      |    ✗     |     ✗      |   ✓
Gérer Matières          |    ✗     |     ✗      |   ✓
Assigner Prof-Matières  |    ✗     |     ✗      |   ✓
Gérer PFE               |    ✗     |     ✗      |   ✓
Supprimer Données       |    ✗     |   Propre   |   ✓
```

### Protection des Données
- Hachage des mots de passe avec bcrypt (12 rounds)
- Capacité de rotation des secrets JWT
- Validation des téléchargements de fichiers (type, taille, scan antivirus)
- Prévention injection SQL via Prisma ORM
- Protection XSS via sanitisation des entrées
- Protection CSRF via cookies SameSite

## Gestion de Configuration

### Configuration d'Environnement
```typescript
interface Config {
  serveur: {
    port: number;
    host: string;
    cors: CorsOptions;
  };
  baseDonnees: {
    url: string;
    ssl: boolean;
  };
  jwt: {
    secret: string;
    expiration: string;
    refreshSecret: string;
    refreshExpiration: string;
  };
  upload: {
    tailleFichierMax: number;
    typesAutorises: string[];
    destination: string;
  };
  theme: {
    couleurPrimaire: string;
    couleurSecondaire: string;
    couleurAccent: string;
    couleurFond: string;
  };
}
```

### Configuration du Thème
```json
{
  "theme": {
    "couleurs": {
      "primaire": "#1e40af",
      "secondaire": "#64748b",
      "accent": "#f59e0b",
      "fond": "#f8fafc",
      "surface": "#ffffff",
      "erreur": "#ef4444",
      "avertissement": "#f59e0b",
      "succes": "#10b981",
      "info": "#3b82f6"
    },
    "polices": {
      "primaire": "Inter",
      "secondaire": "Roboto"
    },
    "espacement": {
      "unite": "0.25rem"
    }
  }
}
```

## Architecture de Déploiement

### Composition Docker
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
    
  backend:
    build: ./backend
    ports: ["5000:5000"]
    depends_on: [database, redis]
    
  database:
    image: postgres:15
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    
  redis:
    image: redis:7-alpine
    volumes: ["redis_data:/data"]
```

### Considérations d'Évolutivité
- Mise à l'échelle horizontale via équilibreur de charge
- Pool de connexions base de données
- Clustering Redis pour cache
- Intégration CDN pour livraison de fichiers
- Chemin de migration vers microservices

## Surveillance & Observabilité

### Stratégie de Journalisation
- Journalisation JSON structurée
- Niveaux de log: ERROR, WARN, INFO, DEBUG
- Journalisation requête/réponse
- Métriques de performance
- Journalisation des événements de sécurité

### Vérifications de Santé
- Connectivité base de données
- Connectivité Redis
- Accessibilité système de fichiers
- Surveillance utilisation mémoire
- Suivi temps de réponse API

Cette architecture fournit une base solide pour l'application ISI Archive, assurant évolutivité, maintenabilité et sécurité tout en répondant à toutes les exigences spécifiées. 