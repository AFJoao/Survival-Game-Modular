// =================================================================
// SCENE — cena Three.js, câmera, renderer e iluminação base.
// =================================================================
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7a9bb5);
scene.fog = new THREE.FogExp2(0x7a9bb5, 0.0038);

export const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 800);
scene.add(camera);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Luz hemisférica principal — céu frio, chão escuro
export const hemiLight = new THREE.HemisphereLight(0xc8ddf0, 0x2a2a1e, 0.7);
scene.add(hemiLight);

// Sol — luz direcional com sombras suaves
export const sun = new THREE.DirectionalLight(0xfff2d9, 1.1);
sun.position.set(40, 60, 20);
sun.castShadow = true;
sun.shadow.mapSize.width  = 1024;
sun.shadow.mapSize.height = 1024;
sun.shadow.camera.near    = 0.5;
sun.shadow.camera.far     = 200;
sun.shadow.camera.left    = -80;
sun.shadow.camera.right   = 80;
sun.shadow.camera.top     = 80;
sun.shadow.camera.bottom  = -80;
sun.shadow.bias           = -0.001;
scene.add(sun);

// Luz de preenchimento — tons azulados noturnos
export const fillLight = new THREE.HemisphereLight(0x2a3a5a, 0x080808, 0.22);
scene.add(fillLight);

// Lua — luz suave noturna
export const moonLight = new THREE.DirectionalLight(0x8899cc, 0.0);
moonLight.position.set(-40, 50, -20);
scene.add(moonLight);