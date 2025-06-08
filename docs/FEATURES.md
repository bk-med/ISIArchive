# ISI Archive - Documentation des Fonctionnalités

## Aperçu
ISI Archive est une plateforme centralisée de gestion de documents pour les étudiants et professeurs d'ISI Tunis, permettant de partager et d'accéder aux documents académiques incluant les cours, TDs, TPs, examens et corrections.

## Phase 1 : Fondation & Authentification (DONE)

### Authentification & Autorisation (RBAC)
- **Connexion/Déconnexion**: Système d'authentification sécurisé
- **Contrôle d'Accès Basé sur les Rôles**: Trois rôles utilisateur (Étudiant, Professeur, Admin)
- **Gestion de Session**: Authentification JWT avec tokens de rafraîchissement
- **Sécurité des Mots de Passe**: Stockage et validation cryptés

### Gestion des Utilisateurs
- **Création d'Utilisateurs par Admin**: Seuls les admins peuvent créer de nouveaux utilisateurs
- **Gestion de Profil**: Informations de profil de base et attribution de rôles
- **Gestion du Statut**: États utilisateur actif/inactif

### Modèles de Données de Base
- **Structure Académique**: Niveaux (L1-L3, M1-M2, 1ING-3ING)
- **Gestion des Filières**: Création et gestion des filières contrôlées par l'admin
- **Système de Semestres**: Attribution automatique des semestres selon le niveau
- **Gestion des Matières**: Création et attribution des cours contrôlées par l'admin
- **Attribution Professeur-Matières**: Les admins assignent plusieurs matières à chaque professeur

## Phase 2 : Système de Gestion de Documents (DONE)

### Téléchargement & Stockage de Documents
- **Système de Téléchargement**: Support des formats PDF, DOC, DOCX
- **Catégories de Documents**: Cours, TD, TP, Examens, Corrections
- **Organisation des Fichiers**: Stockage structuré par filière/semestre/matière
- **Métadonnées**: Titre, description, date de téléchargement, professeur

### Contrôle d'Accès aux Documents
- **Accès Lecture Seule Étudiants**: Voir uniquement les documents de leur niveau/filière actuel
- **Gestion Documents Professeurs**: Télécharger/modifier/supprimer documents pour toutes leurs matières assignées
- **Règles de Visibilité**: Restrictions d'accès basées sur le niveau

### Affichage des Documents
- **Liste de Documents**: Organisée par catégorie et matière
- **Fonctionnalité de Recherche**: Recherche par titre, matière ou type
- **Aperçu de Documents**: Visualisation PDF dans le navigateur
- **Fonctionnalité de Téléchargement**: Téléchargements sécurisés

## Phase 3 : Fonctionnalités Interactives

### Système de Commentaires
- **Commentaires sur Documents**: Section de commentaires publique sous chaque document
- **Publication de Questions**: Les étudiants peuvent poser des questions sur les documents
- **Système de Réponses**: Réponses en fil de discussion des étudiants et professeurs
- **Modération**: Outils de modération de base pour contenu inapproprié

### Fonctionnalités Professeurs
- **Gestion Multi-Matières**: Les professeurs gèrent les documents pour toutes leurs matières assignées par l'admin
- **Tableau de Bord Centralisé**: Vue d'ensemble de toutes les matières assignées
- **Gestion des Corrections**: Téléchargement optionnel de corrections pour examens/TDs/TPs
- **Réponse aux Questions**: Les professeurs peuvent répondre aux questions des étudiants sur tous leurs documents
- **Analytiques par Matière**: Voir les statistiques de téléchargement et d'engagement pour chaque matière

## Phase 4 : Fonctionnalités Académiques Avancées

### Système PFE (Projet de Fin d'Études)
- **Gestion Documents PFE par Admin**: Les admins téléchargent les PFE d'anciens étudiants pour vitrine
- **Accès Semestres Terminaux**: Disponible uniquement pour S6 (L3, 3ING) et S4 (M2)
- **Vitrine Alumni**: Documents PFE d'anciens diplômés mis en valeur par l'administration
- **Système d'Affichage PFE**: Section dédiée pour parcourir les projets exemplaires
- **Métadonnées PFE**: Année de diplôme, filière, titre du projet, résumé

### Recherche & Filtrage Avancés
- **Filtres Avancés**: Filtrer par année, professeur, type de document
- **Système d'Étiquettes**: Étiquetage des documents pour meilleure organisation
- **Système de Favoris**: Les étudiants peuvent marquer des documents importants
- **Activité Récente**: Suivre les documents récemment consultés

## Phase 5 : Gestion des Données & Récupération

### Gestion des Suppressions & Historique
- **Système d'Historique 30 Jours**: Suppression douce avec période de récupération de 30 jours
- **Récupération de Données**: Capacité admin de restaurer filières/matières supprimées
- **Nettoyage Automatique**: Suppression permanente après 30 jours
- **Piste d'Audit**: Suivre toutes les activités de suppression

