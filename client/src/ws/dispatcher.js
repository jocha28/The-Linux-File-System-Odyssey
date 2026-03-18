import { on } from './socket.js';
import { MSG_TYPES } from '../utils/protocol.js';

/**
 * Branche les messages WebSocket sur les bons gestionnaires.
 * @param {{ fsGraph, cameraController, overlay, picker }} handlers
 */
export function setupDispatcher({ fsGraph, cameraController, overlay, picker }) {

  // Arbre du système de fichiers reçu (initial ou après cd)
  on(MSG_TYPES.FS_TREE, (payload) => {
    fsGraph.buildFromTree(payload.root);
    picker.setMeshes(fsGraph.getPickableMeshes());
    if (payload.cwd) overlay.setCwd(payload.cwd);
  });

  // Nouveau noeud créé (mkdir, touch…)
  on(MSG_TYPES.FS_ADD, (payload) => {
    fsGraph.addNode(payload.parent, payload.node);
    picker.setMeshes(fsGraph.getPickableMeshes());
  });

  // Noeud supprimé (rm, rmdir…)
  on(MSG_TYPES.FS_REMOVE, (payload) => {
    fsGraph.removeNode(payload.path);
    picker.setMeshes(fsGraph.getPickableMeshes());
  });

  // Permissions modifiées (chmod…)
  on(MSG_TYPES.FS_CHANGE, (payload) => {
    fsGraph.updateNode(payload.path, { mode: payload.mode });
  });

  // Changement de répertoire courant → vol de la caméra
  on(MSG_TYPES.CWD_CHANGE, (payload) => {
    overlay.setCwd(payload.path);
    cameraController.flyTo(payload.path, fsGraph.getGroup(payload.path));
  });
}
