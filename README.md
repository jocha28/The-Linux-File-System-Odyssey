# 🌌 The Linux File-System Odyssey

> Explorez le système de fichiers Linux comme une galaxie en 3D — en temps réel, depuis votre navigateur.

![Statut](https://img.shields.io/badge/statut-actif-brightgreen?style=flat-square)
![Licence](https://img.shields.io/badge/licence-MIT-blue?style=flat-square)

---

## Technologies

### Frontend
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![xterm.js](https://img.shields.io/badge/xterm.js-000000?style=for-the-badge&logo=windowsterminal&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

### Système
![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)
![Bash](https://img.shields.io/badge/Bash-4EAA25?style=for-the-badge&logo=gnubash&logoColor=white)

---

## Concept

**The Linux File-System Odyssey** transforme l'arborescence Linux en un espace 3D interactif.
Chaque commande tapée dans le terminal intégré a un effet visuel immédiat dans la scène :

- `cd /etc` → la caméra **vole** vers le nœud `/etc`
- `mkdir projet` → un **nouveau nœud apparaît** en 3D avec une animation
- `chmod 755 script.sh` → la **couleur de l'objet change** selon les permissions
- `rm -rf dossier` → le nœud **implosse et disparaît**

L'idée est de rendre concrets les concepts théoriques du système de fichiers Linux : arborescence, permissions, types de fichiers, navigation.

---

## Représentation visuelle

| Élément Linux | Forme 3D | Couleur |
|---|---|---|
| Répertoire | Icosaèdre (taille ∝ nombre d'enfants) | Bleu |
| Fichier standard | Cube | Vert (rw), Rouge (r) |
| Fichier exécutable | Cône | Cyan |
| Lien symbolique | Tore | Rose |
| Fichier setuid/setgid | Cube | Magenta |
| Racine `/` | Grande sphère lumineuse | Or |

### Code couleur des permissions

| Permissions | Couleur |
|---|---|
| Lecture + Écriture (`rw-`) | 🟢 Vert |
| Exécutable (`rwx`) | 🔵 Cyan |
| Lecture seule (`r--`) | 🔴 Rouge |
| Écriture seule (`-w-`) | 🟠 Orange |
| Setuid / Setgid | 🟣 Magenta |

---

## Architecture

```
The Linux File-System Odyssey/
├── package.json                  ← Scripts racine (concurrently)
│
├── server/                       ← Backend Node.js
│   ├── index.js                  ← Serveur HTTP + WebSocket (port 3001)
│   ├── protocol.js               ← Types de messages partagés
│   ├── fs-scanner.js             ← Scan récursif du système de fichiers
│   ├── fs-watcher.js             ← Surveillance en temps réel (chokidar)
│   └── pty-manager.js            ← Terminal bash réel (node-pty)
│
└── client/                       ← Frontend Vite + Three.js
    ├── vite.config.js            ← Proxy WebSocket vers le backend
    ├── index.html                ← Interface (canvas 3D + terminal)
    └── src/
        ├── main.js               ← Point d'entrée
        ├── ws/
        │   ├── socket.js         ← WebSocket avec reconnexion auto
        │   └── dispatcher.js     ← Routage des messages entrants
        ├── scene/
        │   ├── SceneManager.js   ← Renderer, caméra, lumières, étoiles
        │   ├── CameraController.js ← Animation de vol vers un nœud
        │   ├── FsGraph.js        ← Graphe 3D miroir de l'arborescence
        │   ├── NodeFactory.js    ← Création des meshes par type de fichier
        │   └── materials.js      ← Cache des matériaux Three.js
        ├── terminal/
        │   ├── Terminal.js       ← Instance xterm.js
        │   └── TerminalBridge.js ← Pont terminal ↔ WebSocket PTY
        ├── ui/
        │   ├── Overlay.js        ← HUD (chemin courant, statut connexion)
        │   └── Picker.js         ← Raycasting (survol et tooltip)
        └── utils/
            ├── protocol.js       ← Types de messages (côté client)
            └── permissions.js    ← Décodage des bits de mode Unix
```

---

## Fonctionnement technique

### Pont Terminal → 3D

Le serveur spawn un vrai shell `bash` via **node-pty**. Après chaque commande, bash exécute silencieusement `PROMPT_COMMAND` qui envoie le répertoire courant au serveur via une sentinelle `::CWD::`. Le serveur intercepte cette sentinelle, émet un message `CWD_CHANGE` via WebSocket, et le client anime la caméra vers le nœud correspondant.

```
Utilisateur tape "cd /etc"
        │
        ▼
   xterm.js (navigateur)
        │  WebSocket PTY_INPUT
        ▼
   node-pty → bash --norc
        │  PROMPT_COMMAND déclenché
        │  printf "\n::CWD::/etc\n"
        ▼
   Serveur détecte ::CWD::
        │  WebSocket CWD_CHANGE + FS_TREE
        ▼
   Three.js : caméra vole vers /etc
```

### Surveillance du système de fichiers

**chokidar** surveille le répertoire courant (profondeur 3). Chaque événement (`add`, `addDir`, `unlink`, `change`) est traduit en message WebSocket (`FS_ADD`, `FS_REMOVE`, `FS_CHANGE`) et appliqué en temps réel sur le graphe 3D.

### Graphe 3D

Le graphe est une hiérarchie de `THREE.Group` qui reflète exactement l'arborescence Linux. Chaque nœud est positionné en coordonnées polaires par rapport à son parent (rayon fixe, angle calculé selon l'index parmi les frères). Les arêtes entre nœuds sont des `THREE.Line`.

---

## Installation

### Prérequis

- Node.js ≥ 18
- Python 3, `make`, `g++` (requis pour la compilation native de `node-pty`)

```bash
# Sur Ubuntu/Debian
sudo apt install python3 make g++
```

### Cloner et installer

```bash
git clone https://github.com/jocha28/The-Linux-File-System-Odyssey.git
cd The-Linux-File-System-Odyssey

# Installer toutes les dépendances
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

---

## Lancement

```bash
npm run dev
```

| Service | URL |
|---|---|
| Interface 3D | http://localhost:5173 |
| Serveur WebSocket | ws://localhost:3001/ws |

---

## Commandes disponibles dans le terminal

Toutes les commandes bash standard fonctionnent. Les suivantes ont un effet visuel direct :

```bash
cd /etc            # La caméra vole vers le nœud /etc
mkdir mon_dossier  # Un nouveau nœud apparaît en 3D
touch fichier.txt  # Un nouveau cube apparaît
rm fichier.txt     # Le nœud disparaît avec une animation
chmod 755 script   # La couleur du nœud se met à jour
ls -la             # Affichage dans le terminal (sans effet 3D)
```

---

## Lien avec le cours Linux

Ce projet couvre les concepts fondamentaux du cours OpenClassrooms "Les bases de Linux" :

| Concept du cours | Implémentation dans le projet |
|---|---|
| Arborescence Linux (`/bin`, `/etc`, `/home`…) | Visualisée comme une galaxie 3D avec hiérarchie de nœuds |
| Navigation (`cd`, `ls`) | `cd` anime la caméra, `ls` affiche dans le terminal intégré |
| Permissions (`chmod`, `rwxr-xr-x`) | Couleur et forme des objets 3D selon les bits de mode Unix |
| Gestion de fichiers (`mkdir`, `touch`, `rm`) | Création/suppression de nœuds 3D en temps réel |
| Terminal Linux | Terminal bash réel embarqué dans l'interface web |
| Ligne de commande | Toutes les commandes s'exécutent sur un vrai shell Linux |

---

## Auteur

Projet académique réalisé dans le cadre du cours **"Les bases de Linux"** sur OpenClassrooms, combinant la découverte du système de fichiers Linux avec la bibliothèque de rendu 3D **Three.js**.
