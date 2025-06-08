#!/bin/bash

# ISI Archive - Azure for Students Starter Deployment Script
# Optimisé pour les comptes Azure for Students Starter avec services limités

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first:"
    echo "For macOS: brew install azure-cli"
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    print_error "You are not logged in to Azure. Please run 'az login' first."
    exit 1
fi

print_status "Starting ISI Archive deployment to Azure for Students Starter..."
print_status "Using services compatible with Azure for Students limitations"

# Configuration optimisée pour Azure for Students Starter
RESOURCE_GROUP="ISIArchive-app_group"
LOCATION="uksouth"
APP_SERVICE_PLAN="isi-archive-plan"
BACKEND_APP_NAME="isi-archive-backend-$(date +%s | cut -c6-10)"
FRONTEND_APP_NAME="isi-archive-frontend-$(date +%s | cut -c6-10)"
SQL_SERVER_NAME="isi-archive-sql-$(date +%s | cut -c6-10)"
SQL_DB_NAME="isi_archive"
STORAGE_NAME="isistudent$(date +%s | cut -c6-10)"

print_status "Configuration pour Azure for Students Starter:"
echo "  Resource Group: $RESOURCE_GROUP (existant)"
echo "  Location: $LOCATION"
echo "  App Service Plan: $APP_SERVICE_PLAN"
echo "  Backend App: $BACKEND_APP_NAME"
echo "  Frontend App: $FRONTEND_APP_NAME"
echo "  SQL Server: $SQL_SERVER_NAME"
echo "  Storage: $STORAGE_NAME"

# Ask for confirmation
read -p "Voulez-vous continuer avec ce déploiement? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Déploiement annulé."
    exit 0
fi

# Step 1: Create App Service Plan (Free tier for students)
print_status "Création du App Service Plan (gratuit pour étudiants)..."
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku F1 \
  --is-linux
print_success "App Service Plan créé!"

# Step 2: Create SQL Server and Database
print_status "Création du SQL Server et de la base de données..."
az sql server create \
  --name $SQL_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user isiuser \
  --admin-password "SecurePassword123!"

# Configure firewall to allow Azure services
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name "AllowAzureServices" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create the database (Basic tier for students)
az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name $SQL_DB_NAME \
  --service-objective Basic
print_success "SQL Server et base de données créés!"

# Step 3: Create Storage Account
print_status "Création du compte de stockage..."
az storage account create \
  --resource-group $RESOURCE_GROUP \
  --name $STORAGE_NAME \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Create blob container for documents
STORAGE_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_NAME --query '[0].value' -o tsv)
az storage container create \
  --account-name $STORAGE_NAME \
  --account-key $STORAGE_KEY \
  --name documents \
  --public-access off
print_success "Compte de stockage créé!"

# Step 4: Create Backend Web App
print_status "Création de l'application backend..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $BACKEND_APP_NAME \
  --runtime "NODE:18-lts"

# Configure backend app settings
print_status "Configuration des variables d'environnement backend..."
SQL_CONNECTION_STRING="mssql://isiuser:SecurePassword123!@${SQL_SERVER_NAME}.database.windows.net:1433/${SQL_DB_NAME}?encrypt=true&trustServerCertificate=false&hostNameInCertificate=*.database.windows.net&loginTimeout=30"

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --settings \
    NODE_ENV=production \
    PORT=8000 \
    DATABASE_URL="$SQL_CONNECTION_STRING" \
    JWT_SECRET="$(openssl rand -base64 32)" \
    JWT_REFRESH_SECRET="$(openssl rand -base64 32)" \
    AZURE_STORAGE_ACCOUNT_NAME="$STORAGE_NAME" \
    AZURE_STORAGE_ACCOUNT_KEY="$STORAGE_KEY" \
    AZURE_STORAGE_CONTAINER_NAME="documents" \
    SMTP_HOST="smtp.gmail.com" \
    SMTP_PORT="465" \
    SMTP_SERVICE="gmail"

print_success "Application backend créée!"

# Step 5: Create Frontend Web App
print_status "Création de l'application frontend..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $FRONTEND_APP_NAME \
  --runtime "NODE:18-lts"

# Configure frontend app settings
BACKEND_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP_NAME \
  --settings \
    NODE_ENV=production \
    REACT_APP_API_URL="${BACKEND_URL}/api" \
    REACT_APP_ENVIRONMENT=production

print_success "Application frontend créée!"

# Get URLs
BACKEND_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
FRONTEND_URL="https://${FRONTEND_APP_NAME}.azurewebsites.net"

# Create environment file for local development
print_status "Création du fichier de configuration..."
cat > azure-students-config.txt << EOF
# ISI Archive - Configuration Azure for Students Starter
# Variables d'environnement pour le développement local

# URLs des applications
BACKEND_URL="$BACKEND_URL"
FRONTEND_URL="$FRONTEND_URL"

# Base de données SQL Server
DATABASE_URL="$SQL_CONNECTION_STRING"
SQL_SERVER="$SQL_SERVER_NAME.database.windows.net"
SQL_DATABASE="$SQL_DB_NAME"
SQL_USER="isiuser"
SQL_PASSWORD="SecurePassword123!"

# Stockage Azure
AZURE_STORAGE_ACCOUNT_NAME="$STORAGE_NAME"
AZURE_STORAGE_ACCOUNT_KEY="$STORAGE_KEY"
AZURE_STORAGE_CONTAINER_NAME="documents"

# Noms des ressources Azure
RESOURCE_GROUP="$RESOURCE_GROUP"
APP_SERVICE_PLAN="$APP_SERVICE_PLAN"
BACKEND_APP_NAME="$BACKEND_APP_NAME"
FRONTEND_APP_NAME="$FRONTEND_APP_NAME"
EOF

print_success "Déploiement de l'infrastructure terminé avec succès!"
echo
print_status "🎉 Vos applications Azure sont créées:"
echo "  🌐 Frontend: $FRONTEND_URL"
echo "  🔧 Backend:  $BACKEND_URL"
echo "  🗄️ SQL:      $SQL_SERVER_NAME.database.windows.net"
echo "  📁 Storage:  $STORAGE_NAME"
echo
print_status "📋 Prochaines étapes:"
echo "1. Adaptez votre code pour SQL Server (au lieu de PostgreSQL)"
echo "2. Construisez et déployez votre application"
echo "3. Configurez les variables d'environnement"
echo
print_status "💰 Coûts estimés (Azure for Students Starter):"
echo "  App Service Plan F1: GRATUIT (1GB RAM, 1GB stockage)"
echo "  SQL Database Basic: ~5€/mois"
echo "  Storage Account: <1€/mois"
echo "  Total: ~6€/mois (largement couvert par vos crédits étudiants)"
echo
print_warning "Important: Sauvegardez le fichier 'azure-students-config.txt'!" 