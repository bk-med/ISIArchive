# 🎓 ISI Archive

**Plateforme centralisée de gestion de documents académiques pour l'Institut Supérieur d'Informatique de Tunis**

## 🚀 Démarrage Ultra-Rapide (Une seule commande !)

```bash
# Cloner et démarrer l'application complète
git clone <repository-url>
cd ISIArchive
./start.sh
```

**C'est tout !** 🎉 L'application sera disponible sur http://localhost:3000

> Le script `start.sh` configure automatiquement tout l'environnement, construit les images Docker, démarre tous les services, configure la base de données, et crée les comptes de test.

## 📋 Aperçu

ISI Archive est une solution complète qui permet aux étudiants et professeurs d'ISI Tunis de partager et d'accéder facilement aux documents académiques (cours, TDs, TPs, examens, corrections, PFE). La plateforme résout le problème récurrent de la difficulté d'accès aux ressources pédagogiques.

## ✨ Fonctionnalités Principales

- 🔐 **Authentification sécurisée** avec gestion des rôles (Étudiant/Professeur/Admin)
- 📚 **Gestion de documents** par catégorie (cours, TD, TP, examens, corrections)
- 🎯 **Accès restreint** par niveau et filière académique
- 💬 **Système de commentaires** et questions/réponses
- 🎨 **Thème personnalisable** via fichier de configuration
- 🗂️ **Système PFE** pour projets de fin d'études
- ♻️ **Récupération 30 jours** pour suppressions accidentelles

## 🏗️ Architecture

```
ISI Archive/
├── frontend/          # Application React TypeScript
├── backend/           # API Node.js Express TypeScript
├── docs/             # Documentation du projet
├── uploads/          # Stockage des fichiers (volume Docker)
└── start.sh          # Script de démarrage automatique
```

## 🔧 Démarrage Manuel (Développeurs)

### Prérequis

- [Docker](https://www.docker.com/) et Docker Compose
- [Git](https://git-scm.com/)

### Installation Manuelle

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd ISIArchive
   ```

2. **Configuration d'environnement**
   ```bash
   cp .env.example .env
   # Modifiez les variables dans .env selon vos besoins
   ```

3. **Lancer l'application**
   ```bash
   # Démarrer tous les services
   docker-compose --profile dev up -d --build
   
   # Voir les logs
   docker-compose logs -f
   ```

4. **Accéder à l'application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000
   - **Adminer** (dev): http://localhost:8080

### Comptes de Test Automatiquement Créés

- **👑 Admin**: `admin@isi.tn` / `admin123`
- **👨‍🏫 Professeurs**: 
  - `prof.cs@isi.tn` / `prof123` (Informatique)
  - `prof.irs@isi.tn` / `prof123` (Réseaux)
  - `prof.se@isi.tn` / `prof123` (Électronique)
  - `prof.master@isi.tn` / `prof123` (Master)
  - `prof.ing@isi.tn` / `prof123` (Ingénieur)
  - `prof.math@isi.tn` / `prof123` (Mathématiques)
- **👨‍🎓 Étudiants**:
  - `etudiant.l1@isi.tn` / `etudiant123` (L1 CS)
  - `etudiant.l2@isi.tn` / `etudiant123` (L2 IRS)
  - `etudiant.l3@isi.tn` / `etudiant123` (L3 SE)
  - `etudiant.m1@isi.tn` / `etudiant123` (M1 SSII)
  - `etudiant.2ing@isi.tn` / `etudiant123` (2ING IDL)

### Commandes Utiles

```bash
# Arrêter l'application
docker-compose down

# Reconstruire les images
docker-compose build

# Voir le statut des services
docker-compose ps

# Accéder au shell du backend
docker-compose exec backend sh

# Voir les logs d'un service spécifique
docker-compose logs -f backend
```

## 🗄️ Base de Données

### Structure Académique ISI

- **Niveaux**: L1, L2, L3, M1, M2, 1ING, 2ING, 3ING
- **Semestres**: S1-S6 selon le niveau
- **Filières**: Gérées par les administrateurs
- **Matières**: Assignées aux filières et professeurs

### Gestion des Uploads

Les fichiers sont stockés dans un **volume Docker persistant** avec la structure suivante :

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
│   │   │   │   └── pfe/ (semestres terminaux uniquement)
├── temp/
└── sauvegardes/
```

## 🔧 Développement

### Structure du Projet

#### Frontend (React TypeScript)
```
frontend/
├── src/
│   ├── components/    # Composants réutilisables
│   ├── pages/        # Pages de l'application
│   ├── hooks/        # Hooks personnalisés
│   ├── utils/        # Utilitaires et helpers
│   └── types/        # Types TypeScript
├── public/
└── package.json
```

#### Backend (Node.js TypeScript)
```
backend/
├── src/
│   ├── controllers/  # Contrôleurs API
│   ├── middleware/   # Middlewares Express
│   ├── services/     # Logique métier
│   ├── routes/       # Routes API
│   └── types/        # Types TypeScript
├── prisma/           # Schéma et migrations
└── package.json
```

### Scripts de Développement

#### Frontend
```bash
cd frontend
npm install
npm start          # Serveur de développement
npm run build      # Build de production
npm run lint       # Vérification du code
```

#### Backend
```bash
cd backend
npm install
npm run dev        # Serveur de développement
npm run build      # Build TypeScript
npm run db:migrate # Migrations base de données
npm run db:studio  # Interface Prisma Studio
```

## 🔐 Sécurité

- **Authentification JWT** avec refresh tokens
- **Hachage bcrypt** pour les mots de passe
- **Validation** des entrées avec Joi
- **Rate limiting** pour prévenir les abus
- **Headers de sécurité** avec Helmet
- **Validation des fichiers** (type, taille, scan)

## 🎨 Personnalisation

Le thème peut être personnalisé via les variables d'environnement :

```env
THEME_PRIMARY_COLOR=#1e40af
THEME_SECONDARY_COLOR=#64748b
THEME_ACCENT_COLOR=#f59e0b
THEME_BACKGROUND_COLOR=#f8fafc
```

## 📊 Monitoring

- **Logs structurés** avec Winston
- **Health checks** pour tous les services
- **Métriques** de performance et usage
- **Adminer** pour gestion base de données (dev)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📝 Documentation

- [Features](./docs/FEATURES.md) - Liste complète des fonctionnalités
- [Architecture](./docs/ARCHITECTURE.md) - Documentation technique détaillée

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

Développé pour l'Institut Supérieur d'Informatique de Tunis

---

**🎯 Objectif**: Faciliter l'accès aux ressources pédagogiques et améliorer l'expérience académique à ISI Tunis. 