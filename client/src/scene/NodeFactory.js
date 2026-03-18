import * as THREE from 'three';
import { getMaterial } from './materials.js';
import { getPermissionProps } from '../utils/permissions.js';

// Géométries réutilisables
const GEO = {
  root:    new THREE.SphereGeometry(1.4, 32, 32),
  dir:     (r) => new THREE.IcosahedronGeometry(r, 1),
  file:    new THREE.BoxGeometry(0.28, 0.28, 0.28),
  exec:    new THREE.ConeGeometry(0.18, 0.44, 6),
  symlink: new THREE.TorusGeometry(0.18, 0.055, 8, 18),
};

// Cache de géométries de dossiers indexées par rayon arrondi
const dirGeoCache = new Map();

function getDirGeo(childCount) {
  const r = Math.max(0.28, Math.min(1.1, 0.28 + Math.log(childCount + 2) * 0.18));
  const key = r.toFixed(2);
  if (!dirGeoCache.has(key)) dirGeoCache.set(key, new THREE.IcosahedronGeometry(r, 1));
  return dirGeoCache.get(key);
}

/**
 * Crée un Mesh Three.js représentant un noeud du système de fichiers.
 * @param {object} node - { name, path, type, mode, size, children }
 */
export function createNodeMesh(node) {
  const isRoot    = node.path === '/' || (node.name === '/' && node.type === 'dir');
  const isDir     = node.type === 'dir';
  const isSymlink = node.type === 'symlink';
  const ownerExec = (node.mode & 0o100) !== 0;

  let geometry, color, emissive;

  if (isRoot) {
    geometry = GEO.root;
    color    = 0xffdd88;
    emissive = 0x332200;
  } else if (isDir) {
    geometry = getDirGeo(node.children?.length ?? 0);
    color    = 0x4488ff;
    emissive = 0x000c22;
  } else if (isSymlink) {
    geometry = GEO.symlink;
    color    = 0xff88aa;
    emissive = 0x110008;
  } else if (ownerExec) {
    geometry = GEO.exec;
    const p  = getPermissionProps(node.mode);
    color    = p.color;
    emissive = p.emissive;
  } else {
    geometry = GEO.file;
    const p  = getPermissionProps(node.mode);
    color    = p.color;
    emissive = p.emissive;
  }

  const mesh = new THREE.Mesh(geometry, getMaterial(color, emissive));
  mesh.castShadow    = true;
  mesh.receiveShadow = true;
  mesh.userData      = { fsNode: node };
  return mesh;
}

/**
 * Crée un sprite texte au-dessus d'un noeud.
 */
export function createLabel(text) {
  const canvas  = document.createElement('canvas');
  canvas.width  = 256;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.font      = 'bold 18px "Courier New", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000';
  ctx.shadowBlur  = 4;
  ctx.fillText(text.slice(0, 22), 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85 });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.6, 0.36, 1);
  sprite.userData.isLabel = true;
  return sprite;
}

/**
 * Hauteur approximative du mesh pour positionner le label au-dessus.
 */
export function meshHeight(node) {
  if (node.path === '/' || (node.name === '/' && node.type === 'dir')) return 1.6;
  if (node.type === 'dir') return 0.5;
  return 0.2;
}
