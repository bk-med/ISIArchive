#!/bin/bash

# Script de vérification du déploiement ISI Archive
# Teste tous les services déployés

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

# Demander les URLs de déploiement
print_title "🔍 Vérification du déploiement ISI Archive"

read -p "🌐 URL Frontend Vercel (ex: https://isiarchive.vercel.app): " FRONTEND_URL
read -p "🔧 URL Backend Railway (ex: https://isiarchive-backend-production.up.railway.app): " BACKEND_URL

echo

# Vérifier le frontend
print_status "Vérification du frontend..."
if curl -s --head "$FRONTEND_URL" | head -n 1 | grep -q "200 OK"; then
    print_success "✅ Frontend accessible sur $FRONTEND_URL"
else
    print_error "❌ Frontend non accessible"
fi

# Vérifier le backend
print_status "Vérification du backend..."
if curl -s --head "$BACKEND_URL/health" | head -n 1 | grep -q "200 OK"; then
    print_success "✅ Backend accessible sur $BACKEND_URL"
else
    print_error "❌ Backend non accessible"
fi

# Vérifier l'API
print_status "Test de l'API backend..."
API_RESPONSE=$(curl -s "$BACKEND_URL/api/health" || echo "ERROR")
if [[ "$API_RESPONSE" == *"healthy"* ]]; then
    print_success "✅ API backend fonctionnelle"
else
    print_warning "⚠️  API backend non réponse ou non configurée"
fi

echo
print_title "📋 Résumé du déploiement"

echo "🌐 Frontend: $FRONTEND_URL"
echo "🔧 Backend: $BACKEND_URL" 
echo "🔗 API: $BACKEND_URL/api"

echo
print_status "🎯 Prochaines étapes:"
echo "  1. Testez l'inscription d'un utilisateur"
echo "  2. Testez l'upload d'un document"
echo "  3. Vérifiez les fonctionnalités de recherche"

echo
print_success "🎉 Déploiement terminé ! Votre ISI Archive est en ligne !" 