import * as THREE from 'three';

// Cache des matériaux partagés — un matériau par combinaison couleur/emissive
const cache = new Map();

export function getMaterial(color, emissive = 0x000000, extra = {}) {
  const key = `${color}-${emissive}-${JSON.stringify(extra)}`;
  if (cache.has(key)) return cache.get(key);

  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.4,
    metalness: 0.3,
    roughness: 0.6,
    ...extra,
  });
  cache.set(key, mat);
  return mat;
}

export function disposeAllMaterials() {
  for (const mat of cache.values()) mat.dispose();
  cache.clear();
}
