#!/bin/bash

# ISI Archive - Azure Deployment Script
# This script will deploy your ISI Archive application to Azure
# Make sure you have Azure CLI installed and are logged in

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
    echo "For Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    print_error "You are not logged in to Azure. Please run 'az login' first."
    exit 1
fi

print_status "Starting ISI Archive deployment to Azure for Students..."
print_status "This deployment is optimized for Azure for Students accounts!"

# Configuration
RESOURCE_GROUP="isi-archive-rg"
LOCATION="francecentral"
ENVIRONMENT="isi-archive-env"
ACR_NAME="isiarchiveacr$(date +%s)"
DB_NAME="isi-archive-db-$(date +%s)"
STORAGE_NAME="isiarchivestorage$(date +%s | cut -c6-10)"  # Storage names must be shorter
REDIS_NAME="isi-archive-redis"
KEYVAULT_NAME="isi-archive-kv-$(date +%s | cut -c6-10)"

print_status "Using configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Database: $DB_NAME"
echo "  Storage: $STORAGE_NAME"

# Ask for confirmation
read -p "Do you want to continue with this deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled."
    exit 0
fi

# Step 1: Create Resource Group
print_status "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION
print_success "Resource group created!"

# Step 2: Create Container Apps Environment
print_status "Creating Container Apps environment (this may take 2-3 minutes)..."
az containerapp env create \
  --name $ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
print_success "Container Apps environment created!"

# Step 3: Create Azure Container Registry
print_status "Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true
print_success "Container Registry created!"

# Step 4: Create PostgreSQL Database
print_status "Creating PostgreSQL database (this may take 5-10 minutes)..."
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_NAME \
  --location $LOCATION \
  --admin-user isiuser \
  --admin-password "SecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32 \
  --public-access 0.0.0.0

# Create the database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_NAME \
  --database-name isi_archive
print_success "PostgreSQL database created!"

# Step 5: Create Redis Cache
print_status "Creating Redis cache..."
az redis create \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --location $LOCATION \
  --sku Basic \
  --vm-size c0
print_success "Redis cache created!"

# Step 6: Create Azure Files Storage
print_status "Creating Azure Files storage..."
az storage account create \
  --resource-group $RESOURCE_GROUP \
  --name $STORAGE_NAME \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Create file share
az storage share create \
  --account-name $STORAGE_NAME \
  --name documents \
  --quota 1024
print_success "Azure Files storage created!"

# Step 7: Create Key Vault
print_status "Creating Key Vault..."
az keyvault create \
  --resource-group $RESOURCE_GROUP \
  --name $KEYVAULT_NAME \
  --location $LOCATION
print_success "Key Vault created!"

# Step 8: Store secrets
print_status "Storing secrets in Key Vault..."
az keyvault secret set --vault-name $KEYVAULT_NAME --name "jwt-secret" --value "$(openssl rand -base64 32)"
az keyvault secret set --vault-name $KEYVAULT_NAME --name "jwt-refresh-secret" --value "$(openssl rand -base64 32)"
print_success "Secrets stored!"

# Get connection strings
print_status "Retrieving connection information..."
DB_CONNECTION_STRING="postgresql://isiuser:SecurePassword123!@${DB_NAME}.postgres.database.azure.com:5432/isi_archive?sslmode=require"
REDIS_KEY=$(az redis list-keys --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query primaryKey -o tsv)
REDIS_CONNECTION_STRING="rediss://:${REDIS_KEY}@${REDIS_NAME}.redis.cache.windows.net:6380"
STORAGE_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_NAME --query '[0].value' -o tsv)

# Create environment file
print_status "Creating environment configuration file..."
cat > azure-env-config.txt << EOF
# ISI Archive - Azure Configuration
# Copy these values to your application configuration

DATABASE_URL="$DB_CONNECTION_STRING"
REDIS_URL="$REDIS_CONNECTION_STRING"
AZURE_STORAGE_ACCOUNT_NAME="$STORAGE_NAME"
AZURE_STORAGE_ACCOUNT_KEY="$STORAGE_KEY"
AZURE_FILE_SHARE_NAME="documents"

# Azure Resource Information
RESOURCE_GROUP="$RESOURCE_GROUP"
CONTAINER_REGISTRY="$ACR_NAME"
KEY_VAULT="$KEYVAULT_NAME"
EOF

print_success "Deployment completed successfully!"
echo
print_status "Next steps:"
echo "1. Check the 'azure-env-config.txt' file for your connection strings"
echo "2. Update your application with these environment variables"
echo "3. Build and push your Docker images to the container registry"
echo "4. Deploy your application containers"
echo
print_status "Useful commands:"
echo "  View resources: az resource list --resource-group $RESOURCE_GROUP --output table"
echo "  Access Azure Portal: https://portal.azure.com"
echo "  Container Registry: $ACR_NAME.azurecr.io"
echo
print_warning "Important: Save the 'azure-env-config.txt' file - it contains your connection strings!"

# Estimate costs for students
print_status "Estimated monthly costs for Azure for Students:"
echo "  PostgreSQL (B1ms): ~$12-15/month (with student discounts)"
echo "  Redis (C0 Basic): ~$12/month (with student discounts)"
echo "  Storage (100GB): ~$5-10/month"
echo "  Container Apps: ~$5-15/month (with scale-to-zero)"
echo "  Total: ~$34-52/month"
echo
print_success "Your $100 annual credit should cover 2-3 months of full usage!"
print_status "With scale-to-zero and optimization, you might run for 6+ months!"
echo
print_warning "Monitor your credits in the Azure Portal under 'Cost Management + Billing'"
print_status "Set up budget alerts to track your $100 annual credit usage" 