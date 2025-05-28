# Projet SIS - Système d'Information de Santé

Ce projet est composé d'un backend Symfony et de plusieurs frontends Next.js pour différents rôles (patient, médecin, administrateur, etc.). Il s'agit d'une solution complète pour la gestion des informations de santé dans un environnement hospitalier.

## Architecture détaillée

L'application est composée des services suivants :

- **Backend** : API Symfony exposée sur le port 8000
  - Gère toute la logique métier et l'accès aux données
  - Fournit des API RESTful pour les différents frontends
  - Intègre la sécurité via JWT et Keycloak

- **Frontend Patient** : Application Next.js exposée sur le port 3000
  - Interface utilisateur pour les patients
  - Permet la prise de rendez-vous, la consultation des dossiers médicaux, etc.

- **Frontend Doctor** : Application Next.js exposée sur le port 3001
  - Interface utilisateur pour les médecins
  - Gestion des rendez-vous, consultation et mise à jour des dossiers patients
  - Prescription médicale et suivi des traitements

- **Frontend Admin** : Application Next.js exposée sur le port 3002
  - Interface d'administration générale du système
  - Gestion des utilisateurs, des rôles et des permissions

- **Frontend Admin Hospital** : Application Next.js exposée sur le port 3003
  - Administration spécifique aux établissements hospitaliers
  - Gestion des ressources, des services et du personnel

- **Frontend Agent Accueil** : Application Next.js exposée sur le port 3004
  - Interface pour les agents d'accueil
  - Gestion des arrivées de patients et orientation

- **Frontend Urgence** : Application Next.js exposée sur le port 3005
  - Interface dédiée aux services d'urgence
  - Triage des patients et gestion des priorités

- **Database** : Base de données MySQL exposée sur le port 3306
  - Stockage persistant de toutes les données de l'application
  - Optimisée pour les requêtes médicales et la gestion des dossiers patients

- **Keycloak** : Service d'authentification exposé sur le port 8080
  - Gestion centralisée de l'authentification et des autorisations
  - Support de l'authentification unique (SSO) pour tous les services
  - Intégration avec des fournisseurs d'identité externes

- **Minio** : Service de stockage d'objets exposé sur les ports 9000 (API) et 9001 (Console)
  - Stockage des fichiers (images médicales, documents, etc.)
  - Compatible avec l'API S3 d'Amazon

- **Mailer** : Service de mail pour le développement exposé sur les ports 1025 (SMTP) et 8025 (Interface web)
  - Capture et affiche les emails envoyés par l'application en environnement de développement
  - Permet de tester les fonctionnalités d'envoi d'email sans serveur SMTP réel

## Flux de données et interactions entre services

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|  Frontends     +---->+    Backend     +---->+    Database    |
|  (Next.js)     |     |   (Symfony)    |     |    (MySQL)     |
|                |     |                |     |                |
+-------+--------+     +--------+-------+     +----------------+
        |                       |
        |                       |
        v                       v
+----------------+     +----------------+
|                |     |                |
|    Keycloak    |     |     Minio      |
| (Auth Service) |     | (Object Store) |
|                |     |                |
+----------------+     +----------------+
```

## Prérequis

- Docker (version 20.10.0 ou supérieure)
- Docker Compose (version 2.0.0 ou supérieure)
- Au moins 8 Go de RAM disponible pour l'ensemble des services
- Au moins 10 Go d'espace disque libre

## Installation

1. Clonez le dépôt :

```bash
git clone <url-du-repo>
cd <nom-du-repo>
```

2. Configurez les variables d'environnement (optionnel) :

Le fichier `.env` à la racine du projet contient les variables d'environnement par défaut. Vous pouvez les modifier selon vos besoins.

```bash
# Exemple de personnalisation
cp .env .env.local
# Modifiez .env.local selon vos besoins
```

3. Démarrez les services :

```bash
docker-compose up -d
```

Le démarrage initial peut prendre plusieurs minutes car Docker doit télécharger toutes les images nécessaires et construire les conteneurs.

4. Vérifiez que tous les services sont démarrés correctement :

```bash
docker-compose ps
```

5. Accédez aux différentes applications :

- Backend : http://localhost:8000
- Frontend Patient : http://localhost:3000
- Frontend Doctor : http://localhost:3001
- Frontend Admin : http://localhost:3002
- Frontend Admin Hospital : http://localhost:3003
- Frontend Agent Accueil : http://localhost:3004
- Frontend Urgence : http://localhost:3005
- Keycloak : http://localhost:8080
  - Utilisateur par défaut : `admin`
  - Mot de passe par défaut : `admin`
- Minio Console : http://localhost:9001
  - Utilisateur par défaut : `minioadmin`
  - Mot de passe par défaut : `minioadmin`
- Mailpit : http://localhost:8025

## Initialisation de la base de données

Pour initialiser la base de données, exécutez les commandes suivantes :

```bash
# Création de la base de données si elle n'existe pas
docker-compose exec backend php bin/console doctrine:database:create --if-not-exists

# Exécution des migrations
docker-compose exec backend php bin/console doctrine:migrations:migrate --no-interaction

# (Optionnel) Chargement des données de test
docker-compose exec backend php bin/console doctrine:fixtures:load --no-interaction
```

## Configuration de Keycloak

Pour configurer Keycloak pour l'authentification :

1. Connectez-vous à l'interface d'administration de Keycloak (http://localhost:8080)
2. Créez un nouveau realm nommé `sis`
3. Créez un client pour chaque frontend avec les redirections appropriées
4. Configurez les rôles et les utilisateurs selon vos besoins

## Configuration de Minio

Pour configurer Minio pour le stockage d'objets :

1. Connectez-vous à l'interface d'administration de Minio (http://localhost:9001)
2. Créez un nouveau bucket nommé `sis`
3. Configurez les politiques d'accès selon vos besoins

## Arrêt des services

Pour arrêter tous les services :

```bash
docker-compose down
```

Pour arrêter les services et supprimer les volumes (attention, cela supprimera toutes les données) :

```bash
docker-compose down -v
```

## Développement

Pour travailler sur un service spécifique, vous pouvez le démarrer individuellement :

```bash
docker-compose up -d backend
```

Pour voir les logs d'un service :

```bash
docker-compose logs -f backend
```

Pour exécuter des commandes dans un conteneur :

```bash
docker-compose exec backend bash
```

### Rechargement à chaud (Hot Reload)

Les frontends Next.js sont configurés avec le rechargement à chaud, ce qui signifie que les modifications apportées au code sont automatiquement reflétées dans le navigateur sans avoir à redémarrer le service.

Pour le backend Symfony, vous pouvez utiliser le serveur de développement intégré :

```bash
docker-compose exec backend php bin/console server:start
```

## Troubleshooting

### Problèmes de connexion à la base de données

Si le backend ne parvient pas à se connecter à la base de données, assurez-vous que :

1. Le service `database` est bien démarré : `docker-compose ps database`
2. Les variables d'environnement sont correctement configurées dans le fichier `.env`
3. Le port 3306 n'est pas déjà utilisé par un autre service sur votre machine

### Problèmes d'authentification avec Keycloak

Si vous rencontrez des problèmes d'authentification :

1. Vérifiez que Keycloak est correctement démarré : `docker-compose ps keycloak`
2. Assurez-vous que les variables d'environnement liées à Keycloak sont correctement configurées
3. Vérifiez les logs de Keycloak : `docker-compose logs keycloak`
4. Assurez-vous que les redirections URI sont correctement configurées dans les clients Keycloak

### Problèmes de stockage avec Minio

Si vous rencontrez des problèmes avec Minio :

1. Vérifiez que Minio est correctement démarré : `docker-compose ps minio`
2. Assurez-vous que les variables d'environnement liées à Minio sont correctement configurées
3. Vérifiez que le bucket `sis` existe et est accessible
4. Vérifiez les logs de Minio : `docker-compose logs minio`

### Problèmes de performance

Si vous rencontrez des problèmes de performance :

1. Assurez-vous que votre machine dispose de suffisamment de ressources (CPU, RAM, espace disque)
2. Augmentez les ressources allouées à Docker dans les paramètres de Docker Desktop
3. Démarrez uniquement les services dont vous avez besoin pour votre développement

## Contribution

Pour contribuer au projet :

1. Créez une branche pour votre fonctionnalité : `git checkout -b feature/ma-fonctionnalite`
2. Committez vos changements : `git commit -m 'Ajout de ma fonctionnalité'`
3. Poussez votre branche : `git push origin feature/ma-fonctionnalite`
4. Créez une Pull Request

## Licence

Ce projet est sous licence [MIT](LICENSE).