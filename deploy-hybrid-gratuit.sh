#!/bin/bash

# ISI Archive - Déploiement Hybride Gratuit
# Vercel + Railway + Supabase + Cloudinary

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_title() {
    echo
    echo -e "${YELLOW}======================================${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}======================================${NC}"
    echo
}

print_title "🚀 ISI Archive - Déploiement Hybride Gratuit"

print_status "🎯 Stack utilisée:"
echo "  🌐 Frontend: Vercel (gratuit, CDN global)"
echo "  🔧 Backend: Railway (gratuit, 512MB RAM)"
echo "  🗄️ Database: Supabase (PostgreSQL gratuit, 500MB)"
echo "  📁 Storage: Cloudinary (25GB gratuit)"
echo

print_warning "⚠️  Vous aurez besoin de créer des comptes sur:"
echo "  1. Vercel.com (avec GitHub)"
echo "  2. Railway.app (avec GitHub)"
echo "  3. Supabase.com (avec GitHub)"
echo "  4. Cloudinary.com (email)"
echo

read -p "Voulez-vous continuer? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Déploiement annulé."
    exit 0
fi

print_title "📋 Étape 1: Préparation des fichiers de configuration"

# Créer le fichier de configuration Supabase pour le backend
print_status "Création du fichier de configuration backend..."
cat > backend/.env.production << 'EOF'
# ISI Archive - Configuration Production
NODE_ENV=production
PORT=8000

# Base de données Supabase (à remplacer avec vos vraies valeurs)
DATABASE_URL="postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres"

# JWT Secrets (générés automatiquement)
JWT_SECRET="your-jwt-secret-here"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-here"

# Cloudinary (à remplacer avec vos vraies valeurs)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SERVICE="gmail"
SMTP_MAIL="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Frontend URL (sera mise à jour après déploiement Vercel)
DASHBOARD_URL="https://your-app.vercel.app"
EOF

# Créer le fichier de configuration frontend
print_status "Création du fichier de configuration frontend..."
cat > frontend/.env.production << 'EOF'
# ISI Archive Frontend - Configuration Production
REACT_APP_API_URL=https://your-backend.railway.app/api
REACT_APP_ENVIRONMENT=production
EOF

print_success "Fichiers de configuration créés!"

print_title "🗄️ Étape 2: Mise à jour du schéma Prisma pour Cloudinary"

# Adapter le service d'upload pour Cloudinary
print_status "Création du service Cloudinary..."
mkdir -p backend/src/services/cloudinary

cat > backend/src/services/cloudinary/cloudinary.service.ts << 'EOF'
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'isi-archive',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'],
    resource_type: 'auto',
  } as any,
});

export const upload = multer({ storage: storage });

export interface CloudinaryFile {
  public_id: string;
  secure_url: string;
  original_filename: string;
  bytes: number;
  format: string;
}

export const uploadToCloudinary = async (file: Express.Multer.File): Promise<CloudinaryFile> => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'isi-archive',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      original_filename: result.original_filename || file.originalname,
      bytes: result.bytes,
      format: result.format,
    };
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw new Error('Erreur lors de l\'upload du fichier');
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error);
    throw new Error('Erreur lors de la suppression du fichier');
  }
};

export default cloudinary;
EOF

# Ajouter Cloudinary aux dépendances
print_status "Ajout des dépendances Cloudinary..."
cd backend
npm install cloudinary multer-storage-cloudinary
cd ..

print_success "Service Cloudinary configuré!"

print_title "📦 Étape 3: Configuration des scripts de déploiement"

# Script pour Railway
cat > backend/railway.json << 'EOF'
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Vercel configuration
cat > frontend/vercel.json << 'EOF'
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "@react_app_api_url",
    "REACT_APP_ENVIRONMENT": "production"
  }
}
EOF

print_success "Configurations de déploiement créées!"

print_title "🎯 Instructions de déploiement"

print_status "🗄️ 1. SUPABASE (Base de données):"
echo "   • Allez sur https://supabase.com"
echo "   • Connectez-vous avec GitHub"
echo "   • Créez un nouveau projet"
echo "   • Copiez l'URL de connexion PostgreSQL"
echo "   • Mettez à jour DATABASE_URL dans backend/.env.production"
echo

print_status "📁 2. CLOUDINARY (Stockage fichiers):"
echo "   • Allez sur https://cloudinary.com"
echo "   • Créez un compte gratuit"
echo "   • Récupérez: Cloud Name, API Key, API Secret"
echo "   • Mettez à jour les variables CLOUDINARY_* dans backend/.env.production"
echo

print_status "🔧 3. RAILWAY (Backend):"
echo "   • Allez sur https://railway.app"
echo "   • Connectez-vous avec GitHub"
echo "   • Connectez votre repository GitHub"
echo "   • Sélectionnez le dossier 'backend'"
echo "   • Ajoutez les variables d'environnement depuis backend/.env.production"
echo

print_status "🌐 4. VERCEL (Frontend):"
echo "   • Allez sur https://vercel.com"
echo "   • Connectez-vous avec GitHub"
echo "   • Importez votre repository"
echo "   • Sélectionnez le dossier 'frontend'"
echo "   • Ajoutez REACT_APP_API_URL avec l'URL Railway"
echo

print_title "🔄 Scripts automatiques disponibles"

print_status "Pour déployer automatiquement:"
echo "  ./deploy-supabase.sh    # Configure Supabase"
echo "  ./deploy-railway.sh     # Déploie le backend"
echo "  ./deploy-vercel.sh      # Déploie le frontend"
echo

print_title "💰 Coûts"

print_success "TOTALEMENT GRATUIT pour commencer!"
echo "  ✅ Vercel: 100GB/mois gratuit"
echo "  ✅ Railway: 512MB RAM gratuit"
echo "  ✅ Supabase: 500MB DB gratuit"
echo "  ✅ Cloudinary: 25GB stockage gratuit"
echo

print_warning "📋 Fichiers créés:"
echo "  • backend/.env.production"
echo "  • frontend/.env.production"
echo "  • backend/src/services/cloudinary/"
echo "  • backend/railway.json"
echo "  • frontend/vercel.json"
echo

print_success "🎉 Préparation terminée!"
print_status "Suivez les instructions ci-dessus pour déployer votre application."
print_warning "N'oubliez pas de mettre à jour les URLs après chaque déploiement!" 