# 🚀 Guide Complet de Déploiement - ISI Archive

## 📋 **Vue d'ensemble**

Votre application **ISI Archive** sera déployée sur une stack moderne et **100% gratuite** :

| Service | Rôle | Plateforme | Coût |
|---------|------|------------|------|
| 🌐 **Frontend** | Interface utilisateur | Vercel | GRATUIT |
| 🔧 **Backend** | API et logique métier | Railway | GRATUIT |
| 🗄️ **Base de données** | PostgreSQL | Supabase | GRATUIT |
| 📁 **Stockage fichiers** | Documents/images | Cloudinary | GRATUIT |

---

## 🎯 **Étape 1 : Préparer GitHub Repository**

### 1.1 Créer le repository sur GitHub

1. Allez sur [github.com](https://github.com)
2. Connectez-vous avec votre compte : **sidibemoro677@gmail.com**
3. Créez un nouveau repository public : **ISIArchive**
4. Initialisez-le sans README (nous avons déjà les fichiers)

### 1.2 Pousser votre code

```bash
# Dans votre répertoire ISIArchive
git init
git add .
git commit -m "Initial commit - ISI Archive"
git remote add origin https://github.com/[votre-username]/ISIArchive.git
git branch -M main
git push -u origin main
```

---

## 🗄️ **Étape 2 : Configurer Supabase (Base de données)**

### 2.1 Créer le projet Supabase

1. 🌐 Allez sur [supabase.com](https://supabase.com)
2. 🔑 Cliquez "Sign in with GitHub"
3. 🆕 Cliquez "New project"
4. 📝 Remplissez :
   - **Name** : `isi-archive-db`
   - **Database Password** : `ISIArchive2024!` (notez-le)
   - **Region** : Europe (West) 
5. ⏳ Attendez ~2 minutes (création de la DB)

### 2.2 Récupérer l'URL de connexion

1. 🔗 Allez dans **Settings** > **Database**
2. 📋 Copiez l'**URI** qui ressemble à :
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```
3. ⚠️ Remplacez `[PASSWORD]` par `ISIArchive2024!`

### 2.3 Configurer le schéma

1. 📊 Allez dans **SQL Editor**
2. 🔧 Votre schéma Prisma sera appliqué depuis le backend plus tard

---

## 📁 **Étape 3 : Configurer Cloudinary (Stockage)**

### 3.1 Créer le compte Cloudinary

1. 🌐 Allez sur [cloudinary.com](https://cloudinary.com)
2. 📧 Inscrivez-vous avec : **sidibemoro677@gmail.com**
3. ✅ Vérifiez votre email
4. 🏷️ Choisissez le plan **Free** (25GB gratuit)

### 3.2 Récupérer les clés API

1. 🔑 Allez dans **Dashboard**
2. 📋 Notez ces 3 valeurs :
   - **Cloud Name** : `djxxxxxx` 
   - **API Key** : `123456789012345`
   - **API Secret** : `AbCdEfGhIjKlMnOpQrSt` (cliquez "Reveal")

---

## 🔧 **Étape 4 : Déployer le Backend (Railway)**

### 4.1 Créer le projet Railway

1. 🌐 Allez sur [railway.app](https://railway.app)
2. 🔑 Cliquez "Login with GitHub"
3. 🆕 Cliquez "New Project"
4. 📦 Sélectionnez "Deploy from GitHub repo"
5. 🎯 Choisissez votre repository **ISIArchive**
6. 📁 Sélectionnez le dossier **`backend`**

### 4.2 Configurer les variables d'environnement

1. ⚙️ Allez dans **Variables**
2. ➕ Ajoutez ces variables :

```bash
NODE_ENV=production
PORT=8000
DATABASE_URL=postgresql://postgres:ISIArchive2024!@db.[PROJECT-ID].supabase.co:5432/postgres
JWT_SECRET=ISI2024_Super_Secret_Key_Backend_Production
JWT_REFRESH_SECRET=ISI2024_Refresh_Token_Secret_Key_Production
CLOUDINARY_CLOUD_NAME=[votre-cloud-name]
CLOUDINARY_API_KEY=[votre-api-key]
CLOUDINARY_API_SECRET=[votre-api-secret]
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SERVICE=gmail
SMTP_MAIL=sidibemoro677@gmail.com
SMTP_PASSWORD=[votre-mot-de-passe-app-gmail]
DASHBOARD_URL=https://isi-archive.vercel.app
```

### 4.3 Déploiement automatique

1. ⚡ Railway détecte automatiquement Node.js
2. 🔨 Il build automatiquement avec `npm install` et `npm run build`
3. 🚀 Le déploiement prend ~3-5 minutes
4. 📝 Notez l'URL générée : `https://[nom-aleatoire].railway.app`

---

## 🌐 **Étape 5 : Déployer le Frontend (Vercel)**

### 5.1 Créer le projet Vercel

1. 🌐 Allez sur [vercel.com](https://vercel.com)
2. 🔑 Cliquez "Continue with GitHub"
3. 📦 Cliquez "Import" sur votre repository **ISIArchive**
4. 📁 Configurez :
   - **Framework Preset** : Create React App
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build`
   - **Output Directory** : `build`

### 5.2 Configurer les variables d'environnement

1. ⚙️ Avant de déployer, ajoutez ces variables :

```bash
REACT_APP_API_URL=https://[votre-backend].railway.app/api
REACT_APP_ENVIRONMENT=production
```

### 5.3 Déployer

1. 🚀 Cliquez "Deploy"
2. ⏳ Attendez ~2-3 minutes
3. 🎉 Votre frontend sera disponible sur : `https://isi-archive.vercel.app`

---

## 🔄 **Étape 6 : Mise à jour des URLs croisées**

### 6.1 Mettre à jour le backend

1. 🔧 Dans Railway (Variables du backend), mettez à jour :
   ```bash
   DASHBOARD_URL=https://isi-archive.vercel.app
   ```

### 6.2 Mettre à jour le frontend

1. 🌐 Dans Vercel (Variables du frontend), mettez à jour :
   ```bash
   REACT_APP_API_URL=https://[votre-backend].railway.app/api
   ```

---

## 🗄️ **Étape 7 : Initialiser la base de données**

### 7.1 Migrations Prisma

Le backend Railway exécutera automatiquement :
```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

### 7.2 Vérifier la base de données

1. 📊 Dans Supabase, allez dans **Table Editor**
2. ✅ Vous devriez voir toutes vos tables créées
3. 👥 Les comptes de test devraient être présents

---

## ✅ **Étape 8 : Tester l'application**

### 8.1 Accéder à l'application

🌐 **URL Frontend** : `https://isi-archive.vercel.app`

### 8.2 Comptes de test

```bash
👑 Admin : admin@isi.tn / admin123
👨‍🏫 Professeur : prof.cs@isi.tn / prof123
👨‍🎓 Étudiant : etudiant.l1@isi.tn / etudiant123
```

### 8.3 Fonctionnalités à tester

- ✅ Connexion/inscription
- ✅ Upload de documents 
- ✅ Système de commentaires
- ✅ Gestion des rôles
- ✅ Recherche et filtres

---

## 🔧 **Maintenance et Monitoring**

### Surveillance des services

| Service | Dashboard | Monitoring |
|---------|-----------|------------|
| **Railway** | [railway.app/dashboard](https://railway.app/dashboard) | Logs temps réel |
| **Vercel** | [vercel.com/dashboard](https://vercel.com/dashboard) | Analytics et logs |
| **Supabase** | [app.supabase.com](https://app.supabase.com) | DB monitoring |
| **Cloudinary** | [cloudinary.com/console](https://cloudinary.com/console) | Usage stockage |

### Limites à surveiller

- 🚦 **Railway** : 512MB RAM, 1GB stockage
- 🚦 **Vercel** : 100GB bandwidth/mois
- 🚦 **Supabase** : 500MB DB, 2 projets max
- 🚦 **Cloudinary** : 25GB stockage, 25k transformations/mois

---

## 🎉 **Résumé**

✅ **Architecture déployée** :
- Frontend React sur Vercel (CDN global)
- Backend Node.js sur Railway (Europe)
- Base PostgreSQL sur Supabase (Europe) 
- Stockage fichiers sur Cloudinary (global)

✅ **Coût total** : **0€/mois** (tiers gratuits)

✅ **Performance** : Excellente (CDN + optimisations)

✅ **Scalabilité** : Passage facile aux tiers payants

---

## 🆘 **Support et Dépannage**

### Erreurs communes

1. **CORS Error** : Vérifiez les URLs dans les variables d'environnement
2. **Database Connection** : Vérifiez l'URL Supabase dans Railway
3. **Upload Failed** : Vérifiez les clés Cloudinary

### Logs et debugging

- **Backend** : Railway Dashboard > Logs
- **Frontend** : Vercel Dashboard > Functions > Logs
- **Database** : Supabase Dashboard > Logs

---

🎯 **Votre ISI Archive est maintenant déployé et accessible mondialement !** 