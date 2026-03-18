import * as THREE from 'three';

const TWEEN_DURATION = 900; // ms

export class CameraController {
  constructor(camera, controls) {
    this.camera   = camera;
    this.controls = controls;
    this._tween   = null;
  }

  /**
   * Anime la caméra pour se focaliser sur le group Three.js du noeud cible.
   * @param {string} path
   * @param {THREE.Group|null} group
   */
  flyTo(path, group) {
    if (!group) return;

    const target = new THREE.Vector3();
    group.getWorldPosition(target);

    // Caméra se place légèrement derrière et au-dessus du noeud
    const offset = new THREE.Vector3(0, 3, 9);
    const dest   = target.clone().add(offset);

    this._tween = {
      fromCam:    this.camera.position.clone(),
      toCam:      dest,
      fromTarget: this.controls.target.clone(),
      toTarget:   target,
      start:      performance.now(),
    };
  }

  /**
   * À appeler dans la boucle d'animation.
   */
  update() {
    if (!this._tween) return;

    const now = performance.now();
    let t = (now - this._tween.start) / TWEEN_DURATION;
    if (t >= 1) { t = 1; this._tween = null; }

    // Ease in-out cubic
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    this.camera.position.lerpVectors(this._tween.fromCam,    this._tween.toCam,    e);
    this.controls.target.lerpVectors(this._tween.fromTarget, this._tween.toTarget, e);
    this.controls.update();
  }
}
