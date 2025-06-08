# 🚀 Guide Déploiement Complet - ISI Archive

## 📋 **Récapitulatif du projet**
- 🌐 **Frontend** : React TypeScript + Tailwind CSS
- 🔧 **Backend** : Node.js Express TypeScript + Prisma
- 🗄️ **Base de données** : PostgreSQL (Supabase)
- 📁 **Stockage** : Cloudinary
- 🚀 **Déploiement** : Vercel + Railway

---

## 🗄️ **ÉTAPE 1 : Supabase (Base de données)**

### 1.1 Créer le compte Supabase
1. 🌐 Allez sur [supabase.com](https://supabase.com)
2. 🔑 Connectez-vous avec GitHub en utilisant : **sidibemoro677@gmail.com**
3. ➕ Cliquez sur **"New project"**
4. 📝 Remplissez :
   - **Name** : `isi-archive`
   - **Database Password** : `IsiArchive2024!`
   - **Region** : `West Europe (eu-west-1)`
5. ⏳ Attendez la création (2-3 minutes)

### 1.2 Obtenir les informations de connexion
1. 📊 Dans votre projet Supabase, allez dans **Settings > Database**
2. 📋 Copiez ces informations :
   ```
   Host: [VOTRE_HOST].supabase.co
   Database name: postgres
   Port: 5432
   User: postgres
   Password: IsiArchive2024!
   ```

### 1.3 Obtenir l'URL de connexion complète
Dans **Settings > Database**, section **Connection string**, copiez :
```
DATABASE_URL=postgresql://postgres:IsiArchive2024!@[HOST]:5432/postgres
```

---

## 🔧 **ÉTAPE 2 : Railway (Backend)**

### 2.1 Créer le compte Railway
1. 🌐 Allez sur [railway.app](https://railway.app)
2. 🔑 Connectez-vous avec GitHub : **sidibemoro677@gmail.com**
3. ➕ Cliquez sur **"New Project"**
4. 📂 Sélectionnez **"Deploy from GitHub repo"**
5. 🔍 Sélectionnez votre repository : **ISIArchive**

### 2.2 Configuration du déploiement
1. 📁 Railway détecte automatiquement le backend
2. ⚙️ Dans **Settings**, configurez :
   - **Root Directory** : `backend`
   - **Build Command** : `npm run build`
   - **Start Command** : `npm start`

### 2.3 Variables d'environnement
Dans **Variables**, ajoutez :
```
DATABASE_URL=postgresql://postgres:IsiArchive2024!@[SUPABASE_HOST]:5432/postgres
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret_here_2024
CLOUDINARY_CLOUD_NAME=[À_CONFIGURER_ÉTAPE_4]
CLOUDINARY_API_KEY=[À_CONFIGURER_ÉTAPE_4]
CLOUDINARY_API_SECRET=[À_CONFIGURER_ÉTAPE_4]
FRONTEND_URL=[À_CONFIGURER_ÉTAPE_3]
```

### 2.4 Obtenir l'URL du backend
Après déploiement, Railway vous donnera une URL comme :
```
https://isiarchive-backend-production.up.railway.app
```

---

## 📁 **ÉTAPE 3 : Cloudinary (Stockage de fichiers)**

### 3.1 Créer le compte Cloudinary
1. 🌐 Allez sur [cloudinary.com](https://cloudinary.com)
2. 📝 Inscription avec : **sidibemoro677@gmail.com**
3. ✅ Validez votre email

### 3.2 Obtenir les clés API
1. 📊 Dans votre Dashboard Cloudinary
2. 📋 Copiez ces informations :
   ```
   Cloud Name: [VOTRE_CLOUD_NAME]
   API Key: [VOTRE_API_KEY]
   API Secret: [VOTRE_API_SECRET]
   ```

### 3.3 Mettre à jour Railway
Retournez dans Railway > Variables et mettez à jour :
```
CLOUDINARY_CLOUD_NAME=[VOTRE_CLOUD_NAME]
CLOUDINARY_API_KEY=[VOTRE_API_KEY]
CLOUDINARY_API_SECRET=[VOTRE_API_SECRET]
```

---

## 🌐 **ÉTAPE 4 : Vercel (Frontend)**

### 4.1 Créer le compte Vercel
1. 🌐 Allez sur [vercel.com](https://vercel.com)
2. 🔑 Connectez-vous avec GitHub : **sidibemoro677@gmail.com**
3. ➕ Cliquez sur **"New Project"**
4. 📂 Sélectionnez votre repository : **ISIArchive**

### 4.2 Configuration du déploiement
1. ⚙️ Framework Preset : **Create React App**
2. 📁 Root Directory : `frontend`
3. 📦 Build Command : `npm run build`
4. 📂 Output Directory : `build`

### 4.3 Variables d'environnement
Dans **Settings > Environment Variables**, ajoutez :
```
REACT_APP_API_URL=https://isiarchive-backend-production.up.railway.app
REACT_APP_CLOUDINARY_CLOUD_NAME=[VOTRE_CLOUD_NAME]
```

### 4.4 Obtenir l'URL du frontend
Vercel vous donnera une URL comme :
```
https://isiarchive.vercel.app
```

### 4.5 Mettre à jour Railway avec l'URL frontend
Retournez dans Railway > Variables et mettez à jour :
```
FRONTEND_URL=https://isiarchive.vercel.app
```

---

## 🎯 **ÉTAPE 5 : Configuration finale**

### 5.1 Initialiser la base de données
1. 🔧 Dans Railway, le déploiement va automatiquement :
   - Installer les dépendances
   - Exécuter `npx prisma generate`
   - Exécuter `npx prisma db push`
   - Créer les tables dans Supabase

### 5.2 Vérifier le déploiement
1. ✅ Backend : `https://[VOTRE-BACKEND].railway.app/health`
2. ✅ Frontend : `https://[VOTRE-FRONTEND].vercel.app`

---

## 🎉 **URLS FINALES**

Une fois tous les déploiements terminés, vous aurez :

### 🌐 **Application principale**
```
https://isiarchive.vercel.app
```

### 🔧 **API Backend**
```
https://isiarchive-backend-production.up.railway.app
```

### 🗄️ **Base de données (Admin Supabase)**
```
https://app.supabase.com/project/[PROJECT_ID]
```

### 📁 **Stockage fichiers (Cloudinary)**
```
https://cloudinary.com/console
```

---

## 🛠️ **Commandes utiles**

### Pour redéployer après modifications :
```bash
# Pousser les changements
git add .
git commit -m "Update: nouvelle fonctionnalité"
git push origin main

# Vercel et Railway redéploient automatiquement !
```

### Pour voir les logs :
- **Railway** : Section "Deployments" > Logs
- **Vercel** : Section "Functions" > Logs

---

## 📞 **Support et dépannage**

Si vous rencontrez des problèmes :
1. 🔍 Vérifiez les logs dans Railway et Vercel
2. 🌐 Testez l'API backend directement
3. 🗄️ Vérifiez la connexion à Supabase
4. 📁 Testez l'upload Cloudinary 