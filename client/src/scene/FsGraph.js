import * as THREE from 'three';
import { createNodeMesh, createLabel, meshHeight } from './NodeFactory.js';

const LEVEL_SPACING = 5;   // distance entre niveaux de profondeur
const TWEEN_MS      = 500; // durée animation apparition/disparition

export class FsGraph {
  constructor(scene) {
    this.scene     = scene;
    this.groups    = new Map(); // path -> THREE.Group
    this.meshes    = [];        // liste plate pour le raycasting
    this.rootGroup = null;
  }

  // ─── Construction initiale depuis l'arbre JSON ─────────────────────────────

  buildFromTree(rootNode) {
    this._clear();

    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this._buildNode(rootNode, this.rootGroup, 0, 0, 1);
  }

  /**
   * Place récursivement les noeuds dans la scène.
   * Chaque noeud est un THREE.Group enfant de son parent.
   * Sa position est exprimée dans le repère local du parent.
   */
  _buildNode(node, parentGroup, depth, siblingIndex, siblingCount) {
    const group = new THREE.Group();
    parentGroup.add(group);
    this.groups.set(node.path, group);

    // ── Position ──
    if (depth === 0) {
      group.position.set(0, 0, 0);
    } else {
      const angleStep = (2 * Math.PI) / Math.max(1, siblingCount);
      const angle     = siblingIndex * angleStep;
      const r         = LEVEL_SPACING;
      // Légère variation en Y pour éviter que tout soit dans un plan plat
      const yOffset   = Math.sin(siblingIndex * 1.3 + depth) * 0.8;
      group.position.set(
        Math.cos(angle) * r,
        yOffset,
        Math.sin(angle) * r,
      );
    }

    // ── Mesh ──
    const mesh = createNodeMesh(node);
    group.add(mesh);
    this.meshes.push(mesh);

    // ── Label ──
    const label = createLabel(node.name);
    label.position.set(0, meshHeight(node) + 0.35, 0);
    group.add(label);

    // ── Ligne vers le parent ──
    if (depth > 0) {
      this._addEdge(group.position.clone(), parentGroup);
    }

    // ── Enfants ──
    const children = node.children ?? [];
    children.forEach((child, i) => {
      this._buildNode(child, group, depth + 1, i, children.length);
    });
  }

  // ─── Mises à jour en temps réel ────────────────────────────────────────────

  addNode(parentPath, nodeData) {
    const parentGroup = this.groups.get(parentPath);
    if (!parentGroup) return;

    const group = new THREE.Group();
    group.position.set(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 4,
    );
    parentGroup.add(group);
    this.groups.set(nodeData.path, group);

    const mesh = createNodeMesh(nodeData);
    mesh.scale.setScalar(0);
    group.add(mesh);
    this.meshes.push(mesh);

    const label = createLabel(nodeData.name);
    label.position.set(0, meshHeight(nodeData) + 0.35, 0);
    group.add(label);

    this._addEdge(group.position.clone(), parentGroup);
    this._tweenScale(mesh, 0, 1, TWEEN_MS);
  }

  removeNode(nodePath) {
    const group = this.groups.get(nodePath);
    if (!group) return;

    const mesh = group.children.find(c => c.isMesh);
    const finish = () => {
      group.parent?.remove(group);
      this._disposeGroup(group);
      this.groups.delete(nodePath);
      this.meshes = this.meshes.filter(m => m !== mesh);
    };

    if (mesh) {
      this._tweenScale(mesh, 1, 0, TWEEN_MS * 0.6, finish);
    } else {
      finish();
    }
  }

  updateNode(nodePath, { mode }) {
    const group = this.groups.get(nodePath);
    if (!group || !mode) return;
    const mesh = group.children.find(c => c.isMesh);
    if (mesh?.userData?.fsNode) mesh.userData.fsNode.mode = mode;
  }

  // ─── Accesseurs ────────────────────────────────────────────────────────────

  getGroup(path) { return this.groups.get(path) ?? null; }
  getPickableMeshes() { return this.meshes; }

  // ─── Internals ─────────────────────────────────────────────────────────────

  _addEdge(childLocalPos, parentGroup) {
    const points  = [new THREE.Vector3(0, 0, 0), childLocalPos];
    const geo     = new THREE.BufferGeometry().setFromPoints(points);
    const mat     = new THREE.LineBasicMaterial({
      color: 0x1a4a2a,
      transparent: true,
      opacity: 0.35,
    });
    parentGroup.add(new THREE.Line(geo, mat));
  }

  _clear() {
    if (this.rootGroup) {
      this._disposeGroup(this.rootGroup);
      this.scene.remove(this.rootGroup);
      this.rootGroup = null;
    }
    this.groups.clear();
    this.meshes = [];
  }

  _disposeGroup(group) {
    group.traverse((obj) => {
      if (obj.isLine) {
        obj.geometry.dispose();
        obj.material.dispose();
      }
      if (obj.isSprite && obj.material?.map) {
        obj.material.map.dispose();
        obj.material.dispose();
      }
      if (obj.isMesh) {
        // La géométrie partagée (GEO.*) ne se dispose pas ici
        // Les matériaux sont dans le cache — pas de dispose individuel
      }
    });
  }

  _tweenScale(mesh, from, to, duration, onDone) {
    const start = performance.now();
    const step  = (now) => {
      const raw    = Math.min((now - start) / duration, 1);
      const eased  = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw;
      mesh.scale.setScalar(from + (to - from) * eased);
      if (raw < 1) {
        requestAnimationFrame(step);
      } else if (onDone) {
        onDone();
      }
    };
    requestAnimationFrame(step);
  }
}
