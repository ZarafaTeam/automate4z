# Guide Utilisateur - a4z

## 📚 Table des matières

1. [Introduction](#introduction)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Configuration initiale](#configuration-initiale)
5. [Documentation des actions](#documentation-des-actions)
6. [Interface utilisateur web](#interface-utilisateur-web)
7. [Premiers pas](#premiers-pas)
8. [Utilisation avancée](#utilisation-avancée)
9. [Résolution des problèmes](#résolution-des-problèmes)

## Introduction

a4z est un outil en ligne de commande (CLI) conçu pour automatiser l'exécution de workflows YAML, que ce soit localement ou en interaction avec des mainframes IBM z/OS. Cet outil est particulièrement utile pour :

- Automatiser des tâches répétitives
- Gérer des workflows complexes
- Interagir avec des systèmes mainframe
- Standardiser les processus d'automatisation

## Prérequis

Avant d'utiliser a4z, assurez-vous d'avoir installé :

- Node.js (version 14 ou supérieure)
- npm ou pnpm (gestionnaire de paquets)
- Un éditeur de texte pour modifier les fichiers YAML
- Accès aux systèmes mainframe (si nécessaire)

## Installation

1. **Installation globale** :

   ```bash
   npm install -g a4z
   ```

2. **Vérification de l'installation** :
   ```bash
   a4z --version
   ```

## Configuration initiale

La commande `init` permet de configurer les connexions aux mainframes z/OS. Cette étape est essentielle pour utiliser les fonctionnalités d'interaction avec les mainframes.

```bash
a4z init
```

Cette commande vous guidera à travers plusieurs options :

1. **Ajouter une connexion** :

   - Définir un nom pour la connexion (ex: DEV, PROD)
   - Choisir le type de connexion :
     - **Zowe** : Utilise un profil Zowe existant
     - **Basic** : Configuration manuelle (hostname, port, utilisateur, mot de passe)

2. **Modifier une connexion** :

   - Mettre à jour les paramètres d'une connexion existante

3. **Supprimer une connexion** :

   - Retirer une connexion de la configuration

4. **Définir la connexion par défaut** :
   - Choisir quelle connexion sera utilisée par défaut

Les informations sensibles (identifiants, mots de passe) sont stockées de manière sécurisée dans le gestionnaire de mots de passe du système.

## Documentation des actions

La commande `doc` permet d'accéder à la documentation des actions disponibles dans a4z. Elle peut être utilisée de deux manières :

1. **Liste de toutes les actions disponibles** :

   ```bash
   a4z doc
   ```

   Cette commande affiche la liste complète des actions disponibles avec une brève description de chacune.

2. **Documentation détaillée d'une action spécifique** :
   ```bash
   a4z doc <nom-de-l-action>
   ```
   Par exemple :
   ```bash
   a4z doc local.eval
   ```
   Cette commande affiche les informations détaillées de l'action, incluant :
   - Description complète
   - Paramètres d'entrée (obligatoires et optionnels)
   - Paramètres de sortie
   - Exemples d'utilisation

La documentation est formatée pour une lecture facile dans le terminal, avec une mise en forme colorée pour une meilleure lisibilité.

## Interface utilisateur web

a4z propose une interface utilisateur web moderne et intuitive pour gérer vos workflows. Pour la lancer, utilisez la commande :

```bash
a4z ui [options]
```

**Options disponibles** :

- `--dir <chemin>` : Spécifie le répertoire contenant les workflows (par défaut : répertoire courant)

L'interface web offre plusieurs fonctionnalités :

1. **Gestion des workflows**

   - Visualisation de la liste des workflows
   - Édition en temps réel
   - Exécution des workflows
   - Surveillance de l'état d'avancement

2. **Interface moderne**
   - Design responsive
   - Thème clair/sombre
   - Navigation intuitive
   - Documentation intégrée

Lorsque vous lancez la commande, le serveur démarre sur le port 3000 et ouvre automatiquement votre navigateur par défaut à l'adresse `http://localhost:3000`.

## Premiers pas

### Création de votre premier workflow

1. Créez un fichier `mon-workflow.yaml` :

   ```yaml
   env:
     message: "Bonjour"

   steps:
     - name: afficher-message
       action: local.eval
       with:
         expression: "env.message + ' le monde!'"
   ```

2. Exécutez le workflow :
   ```bash
   a4z run mon-workflow.yaml
   ```

### Structure de base d'un workflow

Chaque workflow est composé de :

- **env** : Variables d'environnement
- **steps** : Liste des étapes à exécuter
  - **name** : Nom de l'étape
  - **action** : Type d'action à exécuter
  - **with** : Paramètres de l'action
  - **if** (optionnel) : Condition d'exécution
  - **output** (optionnel) : Capture des résultats

## Utilisation avancée

### Variables d'environnement

Vous pouvez injecter des variables de plusieurs façons :

1. Dans le fichier YAML :

   ```yaml
   env:
     DB_HOST: "localhost"
     DB_PORT: 5432
   ```

2. Via la ligne de commande :
   ```bash
   a4z run workflow.yaml --env DB_HOST=prod-server --env DB_PORT=6000
   ```

### Boucles et conditions

Exemple de boucle :

```yaml
- name: traiter-utilisateurs
  action: control.for-each
  with:
    items:
      - { id: 1, nom: "Alice" }
      - { id: 2, nom: "Bob" }
  steps:
    - name: saluer
      action: local.eval
      with:
        expression: "'Bonjour ' + item.nom"
```

### Plugins

1. **Installation d'un plugin** :

   ```bash
   a4z add-plugin mon-plugin.zip
   ```

2. **Liste des plugins** :

   ```bash
   a4z list-plugins
   ```

3. **Suppression d'un plugin** :
   ```bash
   a4z remove-plugin nom-du-plugin
   ```

## Résolution des problèmes

### Problèmes courants

1. **Erreur de syntaxe YAML**

   - Vérifiez l'indentation
   - Utilisez un validateur YAML
   - Assurez-vous que les guillemets sont correctement fermés

2. **Échec de connexion mainframe**

   - Vérifiez vos identifiants
   - Assurez-vous que le VPN est actif
   - Vérifiez les paramètres de connexion

3. **Plugin non trouvé**
   - Vérifiez que le plugin est correctement installé
   - Relancez a4z
   - Consultez les logs pour plus de détails

### Logs et débogage

Pour activer les logs détaillés :

```bash
a4z run workflow.yaml --debug
```

### Support

Pour obtenir de l'aide :

1. Consultez la documentation sur GitHub
2. Ouvrez une issue sur le repository
3. Contactez l'équipe de support

## 🔍 Astuces et bonnes pratiques

1. **Organisation des workflows**

   - Divisez les grands workflows en sous-workflows
   - Utilisez des noms descriptifs
   - Commentez les étapes complexes

2. **Sécurité**

   - Ne stockez jamais de secrets dans les fichiers YAML
   - Utilisez des variables d'environnement pour les informations sensibles
   - Vérifiez les permissions des fichiers

3. **Performance**
   - Évitez les boucles inutiles
   - Utilisez le cache quand c'est possible
   - Parallélisez les tâches indépendantes

---

Pour plus d'informations, consultez la [documentation officielle](README.md) ou contactez l'équipe de support.
