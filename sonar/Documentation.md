# Documentation SonarQube Docker

## Prérequis

- Docker Desktop installé sur votre machine

## Étapes de configuration

### 1. Lancer SonarQube avec Docker

Utilisez le fichier `docker-compose.yml` pour lancer SonarQube et PostgreSQL :

```bash
cd sonar
docker-compose up -d
```


Cela lancera deux conteneurs :
- `sonarqube_db` (PostgreSQL)
- `sonarqube` (SonarQube)

### 2. Vérifier les conteneurs

Vérifiez que les conteneurs sont en cours d'exécution.


### 3. Accéder à l'interface SonarQube

Ouvrez votre navigateur web à l'adresse :

```
http://localhost:9000
```


### 4. Créer un token d'accès

Pour créer un token d'accès :

1. Connectez-vous à l'interface SonarQube avec l'utilisateur par défaut :
   - Username: `admin`
   - Password: `admin`

2. Crée un projet local

   ![Alt text](/sonar/local_project.png)

3. utilliser la config global

   ![Alt text](/sonar/setting.png)

4. analyse de methode chosir en local
   ![Alt text](/sonar/method.png)

5. Donnez un nom au token et cliquez sur `Generate`

6. Copiez le token généré

### 5. Configurer le fichier sonar-project.properties

Modifiez le fichier `sonar-project.properties` avec vos informations :

```properties
# exemple
sonar.projectKey=backend
sonar.projectName=backend
sonar.projectVersion=1.0

# Chemin vers le code source
sonar.sources=.

# Configuration du serveur SonarQube
sonar.host.url=http://sonarqube:9000
sonar.login=your_token_here # Remplacez par le token généré
```

### 6. Lancer le scanner

Utilisez la commande suivante pour lancer le scanner au root du repo :

```bash
docker run --rm --network=sonarnet -v "/path/to/your/project:/usr/src" sonarsource/sonar-scanner-cli
```

Assurez-vous que le chemin du projet est correct (PWD dans votre console)