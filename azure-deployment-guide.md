# ISI Archive - Azure Deployment Guide

## Architecture Overview

The ISI Archive application will be deployed on Azure using the following services:

### Core Services
- **Azure Container Apps**: For backend and frontend containers
- **Azure Database for PostgreSQL**: Managed PostgreSQL database
- **Azure Cache for Redis**: Managed Redis cache
- **Azure Blob Storage**: For file uploads and document storage
- **Azure Container Registry**: For storing Docker images
- **Azure Application Gateway**: Load balancer and SSL termination
- **Azure Key Vault**: For secrets management

### Optional Services
- **Azure CDN**: For static asset delivery
- **Azure Monitor**: For logging and monitoring
- **Azure DevOps/GitHub Actions**: For CI/CD

## Deployment Options

### Option 1: Azure Container Apps (Recommended)
**Best for**: Microservices, serverless containers, auto-scaling
**Cost**: Pay-per-use, scales to zero
**Complexity**: Medium

### Option 2: Azure App Service
**Best for**: Traditional web apps, simpler deployment
**Cost**: Fixed pricing tiers
**Complexity**: Low

### Option 3: Azure Kubernetes Service (AKS)
**Best for**: Complex orchestration, full Kubernetes features
**Cost**: Higher, always-on nodes
**Complexity**: High

## Getting Started with Azure (New Account Setup)

### 1. Create Your Azure Account

#### Step 1: Sign Up for Azure
1. Go to [https://azure.microsoft.com/free/](https://azure.microsoft.com/free/)
2. Click "Start free" or "Create your Azure free account"
3. Sign in with your Microsoft account or create a new one
4. Fill out the required information:
   - Personal information
   - Phone verification
   - Credit card (for identity verification - you won't be charged for free tier)
5. Complete the agreement and sign up

#### Step 2: Azure for Students Benefits
- **$100 credit** that renews annually (no credit card required!)
- **12 months** of popular free services
- **Always free** services (with usage limits)
- **Additional student-only free services**
- **No credit card required** for signup

#### Step 3: Verify Your Account
1. Check your email for verification
2. Complete phone verification if prompted
3. Log into the [Azure Portal](https://portal.azure.com)

### 2. Initial Azure Setup

#### Install Azure CLI (Choose your OS)

**For macOS (since you're on darwin):**
```bash
# Install using Homebrew
brew install azure-cli

# Or using curl
curl -L https://aka.ms/InstallAzureCli | bash
```

**For Linux/WSL:**
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

**For Windows:**
```powershell
# Download and run the MSI installer from:
# https://aka.ms/installazurecliwindows
```

#### Login and Setup
```bash
# Login to Azure (this will open a browser)
az login

# List your subscriptions
az account list --output table

# Set your default subscription (if you have multiple)
az account set --subscription "Your Subscription Name"

# Install Container Apps extension
az extension add --name containerapp --upgrade

# Verify installation
az version
```

### 3. Understanding Azure Costs

#### Azure for Students Free Tier Limits
- **Azure Files**: 5 GB storage (always free)
- **Azure Database for PostgreSQL**: 750 hours/month (B1ms) + student bonus
- **Azure Cache for Redis**: 250 MB (C0 Basic) + student bonus
- **Container Apps**: 180,000 vCPU-seconds, 360,000 GiB-seconds/month
- **Additional student benefits**: Extra compute hours and storage

#### Estimated Monthly Costs After Free Tier
- **Development Environment**: $20-40/month (with student discounts)
- **Production Environment**: $80-250/month (with student discounts)
- **Note**: Your $100 annual credit should cover development costs entirely!

#### Cost Management Tips
1. **Set up billing alerts**:
```bash
# Create a budget alert
az consumption budget create \
  --budget-name "ISI-Archive-Budget" \
  --amount 100 \
  --time-grain Monthly \
  --time-period start-date=$(date +%Y-%m-01) \
  --category Cost
```

2. **Use Azure Cost Management**:
   - Go to Azure Portal → Cost Management + Billing
   - Set up cost alerts
   - Monitor daily spending

3. **Start with Basic tiers** and scale up as needed

## Recommended Deployment: Azure Container Apps

### 4. Prerequisites Check

Before proceeding, ensure you have:
- ✅ Azure account created and verified
- ✅ Azure CLI installed and logged in
- ✅ Active subscription with available credits/budget
- ✅ Container Apps extension installed

```bash
# Verify everything is working
az account show
az extension list --query "[?name=='containerapp']"
```

### 5. Resource Group and Environment Setup

```bash
# Set variables
RESOURCE_GROUP="isi-archive-rg"
LOCATION="francecentral"  # or your preferred region
ENVIRONMENT="isi-archive-env"
ACR_NAME="isiarchiveacr"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Container Apps environment
az containerapp env create \
  --name $ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

### 6. Azure Container Registry

```bash
# Create ACR
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Get ACR credentials
ACR_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "loginServer" --output tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "username" --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "passwords[0].value" --output tsv)
```

### 7. Database Setup

```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name isi-archive-db \
  --location $LOCATION \
  --admin-user isiuser \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32 \
  --public-access 0.0.0.0

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name isi-archive-db \
  --database-name isi_archive
```

### 8. Redis Cache

```bash
# Create Redis cache
az redis create \
  --resource-group $RESOURCE_GROUP \
  --name isi-archive-redis \
  --location $LOCATION \
  --sku Basic \
  --vm-size c0
```

### 9. Azure Files for Document Storage

```bash
# Create storage account for Azure Files
az storage account create \
  --resource-group $RESOURCE_GROUP \
  --name isiarchivestorage \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Create Azure File Share for documents
az storage share create \
  --account-name isiarchivestorage \
  --name documents \
  --quota 1024

# Enable identity-based authentication
az storage account update \
  --resource-group $RESOURCE_GROUP \
  --name isiarchivestorage \
  --enable-files-aadds true
```

### 10. Key Vault for Secrets

```bash
# Create Key Vault
az keyvault create \
  --resource-group $RESOURCE_GROUP \
  --name isi-archive-kv \
  --location $LOCATION

# Add secrets
az keyvault secret set --vault-name isi-archive-kv --name "jwt-secret" --value "your-super-secret-jwt-key-change-in-production-min-32-chars"
az keyvault secret set --vault-name isi-archive-kv --name "jwt-refresh-secret" --value "your-super-secret-refresh-key-change-in-production-min-32-chars"
az keyvault secret set --vault-name isi-archive-kv --name "smtp-password" --value "your-smtp-password"
```

## Step-by-Step Deployment Guide for Beginners

### Phase 1: Basic Setup (Day 1)

#### Step 1: Create and Test Basic Infrastructure
```bash
# Set your variables (customize these)
export RESOURCE_GROUP="isi-archive-rg"
export LOCATION="francecentral"  # or "eastus", "westeurope"
export ENVIRONMENT="isi-archive-env"
export ACR_NAME="isiarchiveacr$(date +%s)"  # Adds timestamp for uniqueness

# Create resource group
echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Verify creation
az group show --name $RESOURCE_GROUP
```

#### Step 2: Create Container Environment
```bash
# Create Container Apps environment
echo "Creating Container Apps environment..."
az containerapp env create \
  --name $ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# This may take 2-3 minutes
echo "Environment created successfully!"
```

#### Step 3: Set Up Database
```bash
# Create PostgreSQL server (this will take 5-10 minutes)
echo "Creating PostgreSQL database..."
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name isi-archive-db-$(date +%s) \
  --location $LOCATION \
  --admin-user isiuser \
  --admin-password "SecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32 \
  --public-access 0.0.0.0

echo "Database created! Note down the server name for later."
```

### Phase 2: Application Deployment (Day 2)

#### Step 4: Build and Deploy Your Application
```bash
# Navigate to your project directory
cd /path/to/your/ISIArchive

# Build backend image
docker build -t isi-archive-backend:latest ./backend

# Build frontend image  
docker build -t isi-archive-frontend:latest ./frontend

# Test locally first (optional but recommended)
docker run -p 5001:5001 isi-archive-backend:latest
```

### Phase 3: Production Setup (Day 3)

#### Step 5: Configure Production Services
```bash
# Create all remaining services
./scripts/deploy-production.sh
```

### Troubleshooting Common Issues

#### Issue 1: "Subscription not found"
```bash
# List available subscriptions
az account list --output table

# Set the correct subscription
az account set --subscription "Your-Subscription-ID"
```

#### Issue 2: "Location not available"
```bash
# List available locations
az account list-locations --output table

# Choose a location near you
export LOCATION="your-preferred-location"
```

#### Issue 3: "Name already exists"
```bash
# Add timestamp to make names unique
export ACR_NAME="isiarchiveacr$(date +%s)"
export DB_NAME="isi-archive-db-$(date +%s)"
```

## Modified Application Files for Azure

### 1. Backend Dockerfile for Production

```dockerfile
# Multi-stage build for production
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine as production

RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### 2. Environment Variables for Azure

Create `azure-env-vars.sh`:

```bash
#!/bin/bash

# Database
export DATABASE_URL="postgresql://isiuser:YourSecurePassword123!@isi-archive-db.postgres.database.azure.com:5432/isi_archive?sslmode=require"

# Redis
export REDIS_URL="rediss://:$(az redis list-keys --resource-group $RESOURCE_GROUP --name isi-archive-redis --query primaryKey -o tsv)@isi-archive-redis.redis.cache.windows.net:6380"

# Azure Files
export AZURE_STORAGE_ACCOUNT_NAME="isiarchivestorage"
export AZURE_STORAGE_ACCOUNT_KEY="$(az storage account keys list --resource-group $RESOURCE_GROUP --account-name isiarchivestorage --query '[0].value' -o tsv)"
export AZURE_FILE_SHARE_NAME="documents"

# Application
export NODE_ENV="production"
export PORT="5001"
export CORS_ORIGIN="https://your-frontend-url.azurecontainerapps.io"

# Secrets from Key Vault
export JWT_SECRET="@Microsoft.KeyVault(VaultName=isi-archive-kv;SecretName=jwt-secret)"
export JWT_REFRESH_SECRET="@Microsoft.KeyVault(VaultName=isi-archive-kv;SecretName=jwt-refresh-secret)"
export SMTP_PASSWORD="@Microsoft.KeyVault(VaultName=isi-archive-kv;SecretName=smtp-password)"
```

### 3. Build and Push Images

```bash
# Build and push backend
docker build -t $ACR_SERVER/isi-archive-backend:latest ./backend
docker login $ACR_SERVER --username $ACR_USERNAME --password $ACR_PASSWORD
docker push $ACR_SERVER/isi-archive-backend:latest

# Build and push frontend
docker build -t $ACR_SERVER/isi-archive-frontend:latest ./frontend
docker push $ACR_SERVER/isi-archive-frontend:latest
```

### 4. Deploy Container Apps

```bash
# Deploy backend
az containerapp create \
  --name isi-archive-backend \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image $ACR_SERVER/isi-archive-backend:latest \
  --target-port 5001 \
  --ingress external \
  --registry-server $ACR_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --env-vars NODE_ENV=production PORT=5001 \
  --cpu 1.0 \
  --memory 2.0Gi \
  --min-replicas 1 \
  --max-replicas 10

# Deploy frontend
az containerapp create \
  --name isi-archive-frontend \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image $ACR_SERVER/isi-archive-frontend:latest \
  --target-port 80 \
  --ingress external \
  --registry-server $ACR_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --env-vars REACT_APP_API_URL=https://isi-archive-backend.azurecontainerapps.io/api \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 1 \
  --max-replicas 5
```

## Azure File Storage Options Comparison

| Feature | Azure Files | Azure Blob Storage | Azure NetApp Files |
|---------|-------------|-------------------|-------------------|
| **Protocol Support** | SMB, NFS, REST | REST API only | SMB, NFS |
| **File System** | Hierarchical | Flat (containers) | Hierarchical |
| **Identity Auth** | Azure AD, AD DS | Azure AD, RBAC | Azure AD, AD DS |
| **Performance** | Standard/Premium | Hot/Cool/Archive tiers | Ultra/Premium/Standard |
| **Use Case** | File shares, lift-and-shift | Object storage, analytics | High-performance workloads |
| **Cost** | Medium | Low (with tiers) | High |
| **Complexity** | Low | Medium | Medium |
| **Best For ISI Archive** | ✅ **Recommended** | ❌ Not ideal | ⚠️ Overkill |

## File Upload Options for Azure

### Option 1: Azure Files (Recommended for your use case)

Azure Files provides fully managed file shares with SMB/NFS protocol support, identity-based authentication, and familiar file system semantics.

**Benefits:**
- Native file system support with hierarchical structure
- Identity-based authentication with Azure AD
- SMB protocol support for easy mounting
- Familiar file operations (create, read, update, delete)
- Built-in backup and disaster recovery
- No need to change existing file handling logic

#### Implementation:

```bash
cd backend
npm install @azure/storage-file-share
```

Create `backend/src/services/azureFileService.ts`:

```typescript
import { ShareServiceClient, ShareFileClient } from '@azure/storage-file-share';
import { logger } from '../config/logger';
import fs from 'fs';
import path from 'path';

class AzureFileService {
  private shareServiceClient: ShareServiceClient;
  private shareName: string;

  constructor() {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
    this.shareName = process.env.AZURE_FILE_SHARE_NAME || 'documents';

    this.shareServiceClient = new ShareServiceClient(
      `https://${accountName}.file.core.windows.net`,
      { accountName, accountKey }
    );
  }

  async uploadFile(
    localFilePath: string,
    remoteFilePath: string,
    contentType: string
  ): Promise<string> {
    try {
      const shareClient = this.shareServiceClient.getShareClient(this.shareName);
      
      // Ensure directory structure exists
      const dirPath = path.dirname(remoteFilePath);
      await this.ensureDirectoryExists(shareClient, dirPath);
      
      // Upload file
      const fileClient = shareClient.getFileClient(remoteFilePath);
      const fileSize = fs.statSync(localFilePath).size;
      
      await fileClient.uploadFile(localFilePath, {
        fileHttpHeaders: {
          fileContentType: contentType
        }
      });

      logger.info(`File uploaded to Azure Files: ${remoteFilePath}`);
      return fileClient.url;
    } catch (error) {
      logger.error('Error uploading to Azure Files:', error);
      throw error;
    }
  }

  async deleteFile(remoteFilePath: string): Promise<void> {
    try {
      const shareClient = this.shareServiceClient.getShareClient(this.shareName);
      const fileClient = shareClient.getFileClient(remoteFilePath);
      await fileClient.delete();
      logger.info(`File deleted from Azure Files: ${remoteFilePath}`);
    } catch (error) {
      logger.error('Error deleting from Azure Files:', error);
      throw error;
    }
  }

  async getFileUrl(remoteFilePath: string): Promise<string> {
    const shareClient = this.shareServiceClient.getShareClient(this.shareName);
    const fileClient = shareClient.getFileClient(remoteFilePath);
    return fileClient.url;
  }

  private async ensureDirectoryExists(shareClient: any, dirPath: string): Promise<void> {
    if (dirPath === '.' || dirPath === '/') return;
    
    const parts = dirPath.split('/').filter(part => part.length > 0);
    let currentPath = '';
    
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const directoryClient = shareClient.getDirectoryClient(currentPath);
      
      try {
        await directoryClient.create();
      } catch (error: any) {
        if (error.statusCode !== 409) { // 409 = already exists
          throw error;
        }
      }
    }
  }
}

export const azureFileService = new AzureFileService();
```

### Option 2: Azure Blob Storage with Data Lake Gen2

For advanced scenarios requiring analytics and big data processing:

```bash
cd backend
npm install @azure/storage-blob @azure/storage-file-datalake
```

### Option 3: Hybrid Approach with Azure File Sync

For on-premises caching with cloud storage:

- Use Azure Files as primary storage
- Deploy Azure File Sync agent on Container Apps
- Cache frequently accessed files locally
- Automatic tiering to cloud storage

### Recommended Implementation for ISI Archive

Update your upload middleware to use Azure Files:

```typescript
// Add to existing upload.ts
import { azureFileService } from '../services/azureFileService';

export const uploadToAzureFiles = async (req: Request, res: any, next: any) => {
  try {
    if (!req.file) {
      return next();
    }

    const { niveau, filiere, semestre, matiere, categorie } = req.body;
    
    // Generate organized file path
    const remoteFilePath = `${niveau}/${filiere}/${semestre}/${matiere || 'pfe'}/${categorie}/${req.file.filename}`;
    
    // Upload to Azure Files
    const fileUrl = await azureFileService.uploadFile(
      req.file.path,
      remoteFilePath,
      req.file.mimetype
    );

    // Update file info
    req.file.path = fileUrl;
    req.file.destination = remoteFilePath;

    // Clean up local temp file
    fs.unlinkSync(req.file.path);

    next();
  } catch (error) {
    logger.error('Error uploading to Azure Files:', error);
    if (req.file) {
      cleanupUploadedFile(req.file.path);
    }
    res.status(500).json({
      success: false,
      error: 'Upload Error',
      message: 'Erreur lors du téléchargement vers Azure Files'
    });
  }
};
```

## CI/CD Pipeline with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure Container Apps

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AZURE_RESOURCE_GROUP: isi-archive-rg
  ACR_NAME: isiarchiveacr

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Login to ACR
      run: az acr login --name ${{ env.ACR_NAME }}
    
    - name: Build and push backend
      run: |
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/isi-archive-backend:${{ github.sha }} ./backend
        docker push ${{ env.ACR_NAME }}.azurecr.io/isi-archive-backend:${{ github.sha }}
    
    - name: Build and push frontend
      run: |
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/isi-archive-frontend:${{ github.sha }} ./frontend
        docker push ${{ env.ACR_NAME }}.azurecr.io/isi-archive-frontend:${{ github.sha }}
    
    - name: Deploy to Container Apps
      run: |
        az containerapp update \
          --name isi-archive-backend \
          --resource-group ${{ env.AZURE_RESOURCE_GROUP }} \
          --image ${{ env.ACR_NAME }}.azurecr.io/isi-archive-backend:${{ github.sha }}
        
        az containerapp update \
          --name isi-archive-frontend \
          --resource-group ${{ env.AZURE_RESOURCE_GROUP }} \
          --image ${{ env.ACR_NAME }}.azurecr.io/isi-archive-frontend:${{ github.sha }}
```

## Cost Optimization

### Development Environment
- Use Azure Container Apps with scale-to-zero
- Basic tier for PostgreSQL and Redis
- Standard_LRS storage

**Estimated monthly cost**: $50-100

### Production Environment
- Standard tier for database and cache
- Premium storage with geo-redundancy
- Application Gateway for SSL and load balancing

**Estimated monthly cost**: $200-500

## Security Considerations

1. **Network Security**
   - Use Virtual Network integration
   - Private endpoints for database and storage
   - Network Security Groups

2. **Identity and Access**
   - Managed Identity for Azure services
   - Key Vault for secrets
   - RBAC for resource access

3. **Application Security**
   - Container scanning in ACR
   - Security headers in nginx
   - Input validation and sanitization

## Monitoring and Logging

1. **Azure Monitor**
   - Application Insights for APM
   - Log Analytics for centralized logging
   - Custom dashboards and alerts

2. **Health Checks**
   - Container Apps health probes
   - Database connection monitoring
   - Storage availability checks

## Backup and Disaster Recovery

1. **Database Backups**
   - Automated PostgreSQL backups
   - Point-in-time recovery
   - Cross-region backup replication

2. **File Storage Backups**
   - Blob Storage geo-redundancy
   - Soft delete for accidental deletions
   - Version control for critical documents

## Next Steps

1. **Immediate**: Set up development environment
2. **Week 1**: Configure CI/CD pipeline
3. **Week 2**: Implement Azure Blob Storage integration
4. **Week 3**: Set up monitoring and alerts
5. **Week 4**: Production deployment and testing

This deployment strategy provides a scalable, secure, and cost-effective solution for your ISI Archive application on Azure, with proper handling of file uploads and all necessary infrastructure components. 