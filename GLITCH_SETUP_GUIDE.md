# 🚀 Guide de Configuration Glitch - 5 Minutes

## Étape 1 : Créer un Compte Glitch (Gratuit)

1. Allez sur **https://glitch.com**
2. Cliquez sur **"Sign In"** en haut à droite
3. Connectez-vous avec GitHub, Facebook, ou Email
4. C'est gratuit, aucune carte de crédit requise ! ✅

---

## Étape 2 : Créer un Nouveau Projet

1. Une fois connecté, cliquez sur **"New Project"** en haut à droite
2. Sélectionnez **"glitch-hello-node"** (projet Node.js de base)
3. Glitch va créer un projet avec un nom aléatoire comme `amber-scented-tree`

---

## Étape 3 : Remplacer le Code

### 3A. Ouvrir `server.js`
- Dans la liste des fichiers à gauche, cliquez sur **`server.js`**

### 3B. Supprimer tout le contenu
- Sélectionnez tout (Ctrl+A ou Cmd+A)
- Supprimez tout

### 3C. Copier le nouveau code
- Ouvrez le fichier **`server.js`** de ce projet
- Copiez TOUT le contenu (173 lignes)
- Collez dans le `server.js` de Glitch

### 3D. Sauvegarder
- Glitch sauvegarde automatiquement ! ✅

---

## Étape 4 : Mettre à Jour package.json

### 4A. Ouvrir `package.json`
- Dans la liste des fichiers, cliquez sur **`package.json`**

### 4B. Remplacer le contenu
- Ouvrez le fichier **`glitch-package.json`** de ce projet
- Copiez tout le contenu
- Remplacez le contenu de `package.json` sur Glitch

### 4C. Attendre l'installation
- En bas, vous verrez **"Installing packages..."**
- Attendez que ça finisse (15-30 secondes)
- Vous verrez **"Packages installed"** ✅

---

## Étape 5 : Récupérer Votre URL

### 5A. Trouver l'URL du projet
- En haut à gauche, vous verrez le nom de votre projet (ex: `amber-scented-tree`)
- Cliquez sur **"Share"** en haut à droite
- Copiez l'URL **"Live Site"** qui ressemble à :
  ```
  https://amber-scented-tree.glitch.me
  ```

### 5B. Tester le serveur
- Ouvrez cette URL dans un nouvel onglet
- Vous devriez voir un JSON :
  ```json
  {
    "status": "online",
    "server": "Tom vs Jerry Multiplayer Server",
    "activeRooms": 0,
    "totalPlayers": 0,
    "uptime": 12.5
  }
  ```
- Si vous voyez ça, **LE SERVEUR FONCTIONNE !** 🎉

---

## Étape 6 : Configurer le Jeu

### 6A. Copier votre URL Glitch
- Exemple : `https://amber-scented-tree.glitch.me`

### 6B. Dans Gambo AI
- Dites-moi simplement : "Mon URL Glitch est https://votre-projet.glitch.me"
- Je mettrai à jour automatiquement le code du jeu pour utiliser votre serveur !

---

## ✅ Vérification Finale

Votre serveur Glitch doit :
- ✅ Afficher un JSON quand vous visitez l'URL
- ✅ Avoir `"status": "online"`
- ✅ Avoir installé les packages (express, socket.io)

---

## 🎮 Test du Multijoueur

Une fois configuré :

1. **Ouvrez le jeu dans le navigateur 1**
   - Cliquez "ONLINE MULTIPLAYER"
   - Vous devriez voir "✅ Connected!"
   - Cliquez "CREATE ROOM"
   - Notez le code (ex: "XYZW")

2. **Ouvrez le jeu dans le navigateur 2** (ou sur un autre appareil)
   - Cliquez "ONLINE MULTIPLAYER"
   - Cliquez "JOIN ROOM"
   - Entrez le code "XYZW"
   - Vous rejoignez la partie !

3. **Jouez ensemble !** 🎉

---

## 🆘 Problèmes Courants

### "Connection timeout"
- **Solution 1** : Visitez l'URL Glitch dans un navigateur pour "réveiller" le serveur
- **Solution 2** : Attendez 30 secondes et réessayez
- **Solution 3** : Vérifiez que les packages sont bien installés

### "Room not found"
- Le code est sensible à la casse (ABC ≠ abc)
- Les salles expirent après 30 minutes d'inactivité
- Assurez-vous que les deux joueurs utilisent le même serveur

### Le serveur s'endort
- Glitch gratuit met les projets en veille après 5 minutes d'inactivité
- Visitez l'URL pour le réveiller
- Pour éviter ça, utilisez un service comme UptimeRobot (gratuit) pour ping le serveur

---

## 💡 Astuces

### Voir les salles actives
- Visitez : `https://votre-projet.glitch.me/rooms`
- Vous verrez la liste des salles en cours

### Logs en temps réel
- Sur Glitch, cliquez sur **"Tools"** → **"Logs"**
- Vous verrez les connexions et créations de salles en direct

### Renommer le projet
- Cliquez sur le nom du projet en haut à gauche
- Changez-le (ex: `tom-jerry-game-server`)
- L'URL change automatiquement

---

## 📞 Besoin d'Aide ?

Dites-moi simplement où vous êtes bloqué :
- "Je suis à l'étape X"
- "J'ai une erreur Y"
- "Ça ne marche pas"

Je vous aiderai immédiatement ! 😊

---

**Temps estimé total : 5 minutes** ⏱️
**Coût : 0€** 💰
**Difficulté : Facile** ⭐

Bonne chance ! 🚀
