import { connect }          from './ws/socket.js';
import { setupDispatcher }  from './ws/dispatcher.js';
import { SceneManager }     from './scene/SceneManager.js';
import { CameraController } from './scene/CameraController.js';
import { FsGraph }          from './scene/FsGraph.js';
import { Terminal }         from './terminal/Terminal.js';
import { TerminalBridge }   from './terminal/TerminalBridge.js';
import { Overlay }          from './ui/Overlay.js';
import { Picker }           from './ui/Picker.js';

// ── 1. Scène Three.js ──────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const sceneMgr  = new SceneManager(container);

// ── 2. Graphe du système de fichiers (objets 3D) ───────────────────────────
const fsGraph = new FsGraph(sceneMgr.scene);

// ── 3. Contrôleur de caméra ────────────────────────────────────────────────
const camCtrl = new CameraController(sceneMgr.camera, sceneMgr.controls);

// ── 4. Interface (HUD + tooltip) ───────────────────────────────────────────
const overlay = new Overlay();

// ── 5. Raycasting (survol/clic) ────────────────────────────────────────────
const picker = new Picker(sceneMgr.camera, sceneMgr.domElement, overlay);

// ── 6. Terminal xterm.js ───────────────────────────────────────────────────
const terminal = new Terminal('terminal');

// ── 7. WebSocket ───────────────────────────────────────────────────────────
connect((status) => {
  overlay.setConnectionStatus(status);
  if (status === 'connected') {
    // Envoyer les dimensions du terminal après connexion
    setTimeout(() => terminal.focus(), 200);
  }
});

// Pont terminal <-> WebSocket (PTY)
new TerminalBridge(terminal);

// Dispatcher des messages entrants
setupDispatcher({ fsGraph, cameraController: camCtrl, overlay, picker });

// ── 8. Boucle de rendu ─────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  camCtrl.update();  // animation de vol
  picker.update();   // raycasting sur mouvement souris
  sceneMgr.render(); // rendu Three.js
}
animate();
