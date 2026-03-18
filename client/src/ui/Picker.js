import * as THREE from 'three';
import { getModeString, formatSize, getPermissionProps } from '../utils/permissions.js';

export class Picker {
  constructor(camera, domElement, overlay) {
    this.camera     = camera;
    this.domElement = domElement;
    this.overlay    = overlay;

    this.raycaster  = new THREE.Raycaster();
    this.mouse      = new THREE.Vector2(-9999, -9999);
    this.meshes     = [];
    this.hovered    = null;
    this._dirty     = false;
    this._lastEvt   = null;

    this._bind();
  }

  setMeshes(meshes) { this.meshes = meshes; }

  _bind() {
    this.domElement.addEventListener('mousemove', (e) => {
      const rect   = this.domElement.getBoundingClientRect();
      this.mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      this._lastEvt = e;
      this._dirty   = true;
    });

    this.domElement.addEventListener('mouseleave', () => {
      this._clearHover();
      this.overlay.hideTooltip();
    });

    this.domElement.addEventListener('click', () => {
      if (this.hovered) {
        const node = this.hovered.userData?.fsNode;
        if (node) console.log('[Picker] Sélectionné:', node.path);
      }
    });
  }

  update() {
    if (!this._dirty || !this.meshes.length) return;
    this._dirty = false;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.meshes, false);

    if (hits.length > 0) {
      const mesh = hits[0].object;
      if (mesh !== this.hovered) {
        this._clearHover();
        this.hovered = mesh;
        mesh.scale.multiplyScalar(1.3);
      }

      const node = mesh.userData?.fsNode;
      if (node && this._lastEvt) {
        const typeStr = { dir: 'Dossier', symlink: 'Lien symbolique', file: 'Fichier' }[node.type] ?? 'Fichier';
        const perms   = getPermissionProps(node.mode);
        this.overlay.showTooltip(
          this._lastEvt.clientX,
          this._lastEvt.clientY,
          `<strong>${node.name}</strong><br>
           Type : ${typeStr}<br>
           Chemin : <span style="color:#88ffcc">${node.path}</span><br>
           Permissions : ${getModeString(node.mode)} — <em>${perms.label}</em><br>
           Taille : ${formatSize(node.size)}`,
        );
      }
    } else {
      this._clearHover();
      this.overlay.hideTooltip();
    }
  }

  _clearHover() {
    if (this.hovered) {
      this.hovered.scale.divideScalar(1.3);
      this.hovered = null;
    }
  }
}
