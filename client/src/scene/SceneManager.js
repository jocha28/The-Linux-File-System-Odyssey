import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this._init();
    this._addLights();
    this._addStarfield();
    this._bindResize();
  }

  _init() {
    // ── Scène ──
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000510, 0.012);

    // ── Renderer ──
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled  = true;
    this.renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace   = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // ── Caméra ──
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      600,
    );
    this.camera.position.set(0, 12, 24);
    this.camera.lookAt(0, 0, 0);

    // ── Contrôles orbitaux ──
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping  = true;
    this.controls.dampingFactor  = 0.07;
    this.controls.minDistance    = 1.5;
    this.controls.maxDistance    = 250;
    this.controls.screenSpacePanning = true;
  }

  _addLights() {
    // Lumière ambiante froide
    this.scene.add(new THREE.AmbientLight(0x112233, 0.6));

    // Soleil principal
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(25, 35, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(1024);
    this.scene.add(sun);

    // Lumière de remplissage bleutée
    const fill = new THREE.PointLight(0x0044ff, 0.6, 120);
    fill.position.set(-25, -15, -30);
    this.scene.add(fill);

    // Lumière d'accent verte (thème UI)
    const accent = new THREE.PointLight(0x00ff88, 0.35, 80);
    accent.position.set(0, 25, 0);
    this.scene.add(accent);
  }

  _addStarfield() {
    const N   = 6000;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 500;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color:       0xffffff,
      size:        0.18,
      transparent: true,
      opacity:     0.75,
      sizeAttenuation: true,
    });

    this.scene.add(new THREE.Points(geo, mat));
  }

  _bindResize() {
    const onResize = () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize);

    // Observer la hauteur du terminal si elle change
    const termContainer = document.getElementById('terminal-container');
    if (termContainer && window.ResizeObserver) {
      new ResizeObserver(onResize).observe(termContainer);
    }
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  get domElement() { return this.renderer.domElement; }
}
