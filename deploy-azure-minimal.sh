#!/bin/bash

# ISI Archive - Azure for Students Starter Minimal Deployment
# Utilise Container Instances au lieu d'App Service pour contourner les restrictions

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

# Check Azure CLI and login
if ! command -v az &> /dev/null; then
    print_error "Azure CLI non installé"
    exit 1
fi

if ! az account show &> /dev/null; then
    print_error "Non connecté à Azure. Lancez 'az login' d'abord."
    exit 1
fi

print_status "Déploiement minimal ISI Archive sur Azure for Students Starter"
print_status "Utilisation de Container Instances (plus permissif)"

# Configuration minimale
RESOURCE_GROUP="ISIArchive-app_group"
LOCATION="uksouth"
STORAGE_NAME="isistudentmin$(date +%s | cut -c6-10)"

print_status "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Storage: $STORAGE_NAME"

read -p "Continuer? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Annulé."
    exit 0
fi

# Step 1: Create Storage Account (plus simple et compatible)
print_status "Création du compte de stockage..."
az storage account create \
  --resource-group $RESOURCE_GROUP \
  --name $STORAGE_NAME \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

STORAGE_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_NAME --query '[0].value' -o tsv)

# Create container for documents
az storage container create \
  --account-name $STORAGE_NAME \
  --account-key $STORAGE_KEY \
  --name documents \
  --public-access off

print_success "Stockage créé!"

# Step 2: Essayons juste de créer une ressource simple pour tester
print_status "Test de création d'une ressource simple..."

# Create a simple file share
az storage share create \
  --account-name $STORAGE_NAME \
  --account-key $STORAGE_KEY \
  --name isiarchive \
  --quota 5

print_success "Test réussi!"

# Configuration file
cat > azure-minimal-config.txt << EOF
# Configuration Azure Minimale pour ISI Archive

# Stockage Azure
AZURE_STORAGE_ACCOUNT_NAME="$STORAGE_NAME"
AZURE_STORAGE_ACCOUNT_KEY="$STORAGE_KEY"
AZURE_STORAGE_CONTAINER_NAME="documents"

# Resource Group
RESOURCE_GROUP="$RESOURCE_GROUP"
LOCATION="$LOCATION"

# Prochaines étapes:
# 1. Utilisez des services externes gratuits pour la base de données (ex: PlanetScale, Supabase)
# 2. Déployez sur des plateformes plus permissives (Vercel, Netlify, Railway)
# 3. Utilisez le stockage Azure pour les fichiers uniquement
EOF

print_success "Configuration minimale créée!"
echo
print_status "🎯 Stratégie alternative recommandée:"
echo "1. 📦 Stockage Azure: Utilisé pour les fichiers/documents"
echo "2. 🗄️ Base de données: Service externe gratuit (Supabase, PlanetScale)"
echo "3. 🌐 Frontend: Vercel ou Netlify (gratuit)"
echo "4. 🔧 Backend: Railway ou Render (gratuit)"
echo
print_status "Cette approche contourne les limitations d'Azure for Students Starter"
print_warning "Vérifiez le fichier 'azure-minimal-config.txt' pour les détails" 