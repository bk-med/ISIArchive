#!/bin/bash

# ISI Archive - Déploiement Azure for Students Starter
# Utilise seulement les services autorisés dans ce type d'abonnement

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

print_title "🚀 ISI Archive - Déploiement Azure for Students Starter"

# Configuration pour Azure for Students Starter
RESOURCE_GROUP="ISIArchive-app_group"
LOCATION="francecentral"
APP_NAME="isi-archive"
SQL_SERVER_NAME="isiarchive-sql-$(openssl rand -hex 4)"
DATABASE_NAME="isiarchive"
SQL_ADMIN="isiarchive_admin"
SQL_PASSWORD="IsiArchive2024!"

print_status "Configuration:"
echo "  - Groupe de ressources: $RESOURCE_GROUP"
echo "  - Région: $LOCATION"
echo "  - Nom d'app: $APP_NAME"
echo "  - Serveur SQL: $SQL_SERVER_NAME"

# Vérifier la connexion Azure
print_status "Vérification de la connexion Azure..."
if ! az account show &> /dev/null; then
    print_error "Pas connecté à Azure. Lancez 'az login' d'abord."
    exit 1
fi

print_success "Connecté à Azure"

# Créer le serveur SQL Database (disponible dans Starter)
print_status "Création du serveur SQL Database..."
az sql server create \
    --resource-group $RESOURCE_GROUP \
    --name $SQL_SERVER_NAME \
    --location $LOCATION \
    --admin-user $SQL_ADMIN \
    --admin-password $SQL_PASSWORD

if [ $? -eq 0 ]; then
    print_success "Serveur SQL créé avec succès"
else
    print_error "Échec de la création du serveur SQL"
    exit 1
fi

# Créer la base de données
print_status "Création de la base de données..."
az sql db create \
    --resource-group $RESOURCE_GROUP \
    --server $SQL_SERVER_NAME \
    --name $DATABASE_NAME \
    --service-objective S0

if [ $? -eq 0 ]; then
    print_success "Base de données créée avec succès"
else
    print_error "Échec de la création de la base de données"
    exit 1
fi

# Configurer le firewall pour permettre les services Azure
print_status "Configuration du firewall SQL..."
az sql server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --server $SQL_SERVER_NAME \
    --name "AllowAzureServices" \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

# Afficher les informations de connexion
print_title "🎉 DÉPLOIEMENT TERMINÉ"

print_success "✅ Serveur SQL Database créé avec succès !"

echo ""
print_status "📋 Informations de connexion:"
echo "  🗄️  Serveur SQL: $SQL_SERVER_NAME.database.windows.net"
echo "  📊 Base de données: $DATABASE_NAME"
echo "  👤 Utilisateur: $SQL_ADMIN"
echo "  🔑 Mot de passe: $SQL_PASSWORD"

echo ""
print_warning "⚠️  LIMITATIONS avec Azure for Students Starter:"
echo "  - Pas de stockage de fichiers (Microsoft.Storage)"
echo "  - Pas de App Service (restrictions régionales)"
echo "  - Services très limités"

echo ""
print_status "🔄 RECOMMANDATION:"
echo "  1. Upgradez vers 'Azure for Students' pour 100$ de crédit"
echo "  2. Ou utilisez la solution hybride gratuite (Vercel + Railway)"

echo ""
print_status "🌐 Pour l'upgrade Azure for Students:"
echo "  1. Allez sur portal.azure.com"
echo "  2. Recherchez 'Subscriptions'"
echo "  3. Cliquez sur votre abonnement"
echo "  4. Cliquez sur 'Upgrade'" 