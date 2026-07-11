// =================================================================
// SCENE — cena Three.js, câmera, renderer e iluminação base.
// =================================================================
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8d9088);
scene.fog = new THREE.FogExp2(0x8d9088, 0.0052);

export const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 600);
scene.add(camera);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = false;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

export const hemiLight = new THREE.HemisphereLight(0x9aa08f, 0x2c2a22, 0.75);
scene.add(hemiLight);

export const sun = new THREE.DirectionalLight(0xd8c99a, 0.85);
sun.position.set(40, 60, 20);
scene.add(sun);

export const fillLight = new THREE.HemisphereLight(0x3a4a5a, 0x0a0a08, 0.18);
scene.add(fillLight);
