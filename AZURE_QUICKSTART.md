# ISI Archive - Azure for Students Deployment Quick Start Guide

## 🚀 Complete Student Guide to Deploy ISI Archive on Azure

This guide will take you from zero to a fully deployed ISI Archive application on Azure using your Azure for Students account.

## ⏱️ Time Required
- **Account Setup**: 10 minutes (already done!)
- **Infrastructure Deployment**: 30-45 minutes
- **Application Deployment**: 20-30 minutes
- **Total**: ~1 hour

## 💰 Cost Estimate (Azure for Students)
- **Free Tier**: $100 credit that renews annually
- **After Free Tier**: ~$70-95/month (with student discounts)
- **Development**: ~$20-40/month (likely covered by your annual credit!)
- **No credit card required** for signup

## 🎓 Azure for Students Benefits

### What You Get:
- ✅ **$100 annual credit** (renews each year you're a student)
- ✅ **No credit card required**
- ✅ **Student-only free services**
- ✅ **Extended free tier limits**
- ✅ **Access to developer tools**
- ✅ **Learning resources and tutorials**

### Perfect for Academic Projects:
- Host your ISI Archive project for free
- Learn cloud technologies
- Build your portfolio
- No financial risk

## 📋 Prerequisites

- ✅ Azure for Students account (you already have this!)
- ✅ Academic email address
- ✅ A computer with internet access

## Step 1: Verify Your Azure for Students Account (5 minutes)

### 1.1 Check Your Account Status
1. Go to [https://portal.azure.com](https://portal.azure.com)
2. Sign in with your academic email
3. Check that you see "Azure for Students" in your subscription
4. Verify you have $100 in credits

### 1.2 Understand Your Benefits
- Your $100 credit renews annually as long as you're a student
- Many services have extended free tiers for students
- No automatic charges when credits run out

## Step 2: Install Azure CLI (10 minutes)

### For macOS (your system):
```bash
# Install using Homebrew (recommended)
brew install azure-cli

# Or using curl
curl -L https://aka.ms/InstallAzureCli | bash
```

### For Linux:
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### For Windows:
Download and run the installer from: https://aka.ms/installazurecliwindows

### Verify Installation:
```bash
az version
```

## Step 3: Login to Azure (5 minutes)

```bash
# This will open a browser window
az login

# Verify you're logged in and see your student subscription
az account show

# You should see something like "Azure for Students"
az account list --output table
```

## Step 4: Deploy Infrastructure (30-45 minutes)

### 4.1 Download and Run the Deployment Script
```bash
# Navigate to your ISI Archive project
cd /path/to/your/ISIArchive

# Make the script executable
chmod +x deploy-to-azure.sh

# Run the deployment script
./deploy-to-azure.sh
```

### 4.2 Student-Optimized Configuration
The script automatically uses student-friendly settings:
- ✅ Basic tier services (within free limits)
- ✅ Minimal resource allocation
- ✅ Cost-optimized configurations
- ✅ Development-focused setup

### 4.3 What Gets Created (All Student-Friendly):
- **Resource Group**: Free container for all resources
- **PostgreSQL Database**: B1ms tier (750 hours/month free)
- **Redis Cache**: C0 Basic (250MB free)
- **Azure Files**: 5GB free storage
- **Container Registry**: Basic tier
- **Key Vault**: Free tier
- **Container Apps**: Within free compute limits

### 4.4 Monitor Your Spending
```bash
# Check your current credit usage
az consumption usage list --output table

# Set up a budget alert (recommended)
az consumption budget create \
  --budget-name "Student-Budget" \
  --amount 50 \
  --time-grain Monthly \
  --category Cost
```

## Step 5: Configure Your Application (15 minutes)

### 5.1 Update Environment Variables
After the script completes, you'll have an `azure-env-config.txt` file:

```bash
# View your configuration
cat azure-env-config.txt
```

### 5.2 Update Your Backend .env File
```bash
# Copy the template
cp backend/.env.example backend/.env.azure

# Edit with your Azure values
nano backend/.env.azure
```

## Step 6: Deploy Your Application (20-30 minutes)

### 6.1 Build and Push Docker Images
```bash
# Get your container registry name from azure-env-config.txt
ACR_NAME="your-acr-name"

# Login to your container registry
az acr login --name $ACR_NAME

# Build and push backend
docker build -t $ACR_NAME.azurecr.io/isi-archive-backend:latest ./backend
docker push $ACR_NAME.azurecr.io/isi-archive-backend:latest

# Build and push frontend
docker build -t $ACR_NAME.azurecr.io/isi-archive-frontend:latest ./frontend
docker push $ACR_NAME.azurecr.io/isi-archive-frontend:latest
```

### 6.2 Deploy Container Apps (Student-Optimized)
```bash
# Get values from your config file
RESOURCE_GROUP="isi-archive-rg"
ENVIRONMENT="isi-archive-env"

# Deploy backend (minimal resources for students)
az containerapp create \
  --name isi-archive-backend \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image $ACR_NAME.azurecr.io/isi-archive-backend:latest \
  --target-port 5001 \
  --ingress external \
  --registry-server $ACR_NAME.azurecr.io \
  --env-vars NODE_ENV=production \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 0 \
  --max-replicas 2

# Deploy frontend (minimal resources)
az containerapp create \
  --name isi-archive-frontend \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image $ACR_NAME.azurecr.io/isi-archive-frontend:latest \
  --target-port 80 \
  --ingress external \
  --registry-server $ACR_NAME.azurecr.io \
  --cpu 0.25 \
  --memory 0.5Gi \
  --min-replicas 0 \
  --max-replicas 2
```

## Step 7: Test Your Deployment (10 minutes)

### 7.1 Get Your Application URLs
```bash
# Get backend URL
az containerapp show \
  --name isi-archive-backend \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn

# Get frontend URL
az containerapp show \
  --name isi-archive-frontend \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn
```

### 7.2 Test Your Application
1. Open the frontend URL in your browser
2. Register a new account
3. Test file upload functionality
4. Share with classmates and professors!

## 🎉 Congratulations!

Your ISI Archive application is now running on Azure with your student account!

## 📊 Student-Specific Monitoring

### Track Your Credits
```bash
# Check remaining credits
az consumption usage list --output table

# View detailed billing
az consumption usage list --start-date 2024-01-01 --end-date 2024-12-31
```

### Azure Portal Student Dashboard
Visit [https://portal.azure.com](https://portal.azure.com) to:
- Monitor your $100 annual credit usage
- View application metrics
- Access student learning resources
- Manage your academic projects

## 🎓 Academic Benefits

### For Your Studies:
- **Portfolio Project**: Showcase cloud deployment skills
- **Learning Experience**: Hands-on Azure experience
- **Resume Builder**: Real cloud project experience
- **Collaboration**: Share with classmates and professors

### For Your Career:
- **Cloud Skills**: Azure experience for job applications
- **DevOps Knowledge**: Container deployment experience
- **Full-Stack Deployment**: End-to-end project management

## 💡 Student Tips

### Maximize Your Credits:
1. **Use scale-to-zero**: Container Apps scale down when not used
2. **Monitor regularly**: Check usage weekly
3. **Optimize resources**: Start small, scale as needed
4. **Learn continuously**: Use Azure learning resources

### Academic Use Cases:
- **Class Projects**: Deploy assignments and demos
- **Research**: Host data analysis applications
- **Collaboration**: Share projects with study groups
- **Presentations**: Live demos for professors

## 🔧 Student-Specific Troubleshooting

### "Credits Running Low"
```bash
# Check current usage
az consumption usage list --output table

# Optimize resources
az containerapp update --name isi-archive-backend --min-replicas 0
az containerapp update --name isi-archive-frontend --min-replicas 0
```

### "Need More Resources"
- Contact Azure for Students support
- Consider upgrading specific services only
- Use free tier services when possible

## 🆘 Student Support

- **Azure for Students Support**: [https://azure.microsoft.com/en-us/free/students/](https://azure.microsoft.com/en-us/free/students/)
- **Microsoft Learn**: Free learning paths for students
- **Student Developer Community**: Connect with other student developers
- **Academic Support**: Contact your institution's IT department

## 🧹 Cleanup (End of Semester)

When your project is complete:
```bash
# Delete everything to stop any charges
az group delete --name isi-archive-rg --yes --no-wait
```

**Note**: This preserves your $100 credit for future projects!

## 🚀 Next Academic Projects

With your Azure for Students account, you can:
- Deploy multiple projects throughout the year
- Experiment with different Azure services
- Build a portfolio of cloud applications
- Learn industry-standard deployment practices

Your $100 annual credit should easily cover multiple academic projects! 