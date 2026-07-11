// =================================================================
// WORLD — terreno, regiões e constantes do mapa.
// =================================================================
import { scene } from './scene.js';

export const WORLD_SIZE = 460;
export const villageCenter = { x: -110, z: -90 };
export const villageRadius = 55;
export const roadHalfWidth = 5;

export function regionType(x, z) {
  if (Math.hypot(x - villageCenter.x, z - villageCenter.z) < villageRadius) return 'village';
  if (Math.abs(x) < roadHalfWidth) return 'road';
  return 'forest';
}

// noise leve para micro-variações no solo
function noise2(x, z) {
  return Math.sin(x * 0.37 + z * 0.19) * Math.cos(x * 0.13 - z * 0.41) * 0.5 + 0.5;
}

export function terrainHeight(x, z) {
  // Camadas de ondas — mais colinas e barrancos suaves
  let h = Math.sin(x * 0.018) * Math.cos(z * 0.021) * 4.2
        + Math.sin(x * 0.045 + z * 0.03) * 2.0
        + Math.sin(x * 0.11 - z * 0.14) * 0.8
        + Math.sin(x * 0.24 + z * 0.19) * 0.30
        + Math.sin(x * 0.52 - z * 0.47) * 0.10;  // micro-rugosidade

  // Suavizar ao longo da estrada
  const roadDist = Math.abs(x);
  if (roadDist < 16) h *= THREE.MathUtils.smoothstep(roadDist, 0, 16) * 0.85 + 0.15;

  // Suavizar na vila
  const vd = Math.hypot(x - villageCenter.x, z - villageCenter.z);
  if (vd < villageRadius + 10) h *= THREE.MathUtils.smoothstep(vd, 0, villageRadius + 10) * 0.7 + 0.3;

  return h;
}

// --- TERRENO — malha mais densa para capturar mais detalhe ---
const groundGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 140, 140);
groundGeo.rotateX(-Math.PI / 2);
const posAttr = groundGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i), z = posAttr.getZ(i);
  posAttr.setY(i, terrainHeight(x, z));
}
groundGeo.computeVertexNormals();

// Cores do solo — paleta mais rica com 6 tons
const cGreen  = new THREE.Color(0x4e5c38); // verde musgo escuro
const cGreen2 = new THREE.Color(0x5e6e42); // verde médio
const cDirt   = new THREE.Color(0x6e5e48); // terra marrom
const cDirt2  = new THREE.Color(0x7c6a52); // terra clara
const cAsh    = new THREE.Color(0x4a4840); // cinza-pó
const cRock   = new THREE.Color(0x787068); // pedra

const colorAttr = new Float32Array(posAttr.count * 3);
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i), z = posAttr.getZ(i), y = posAttr.getY(i);

  // Três camadas de padrão para variação orgânica
  const patch  = Math.sin(x * 0.020 + 3.1) * Math.cos(z * 0.023 - 1.2) * 0.5 + 0.5;
  const patch2 = Math.sin(x * 0.055 - z * 0.038) * 0.5 + 0.5;
  const grit   = noise2(x, z);
  const micro  = Math.sin(x * 0.18 + z * 0.22) * 0.5 + 0.5;

  // Mistura base verde → terra
  let mix = cGreen.clone().lerp(cGreen2, micro * 0.5);
  mix.lerp(cDirt,  patch  * 0.65);
  mix.lerp(cDirt2, patch2 * 0.30);
  mix.lerp(cAsh,   grit   * 0.22);

  // Topos de morro ficam mais rochosos
  const ridge = THREE.MathUtils.clamp((y - 1.8) / 2.5, 0, 1);
  mix.lerp(cRock, ridge * 0.55);

  // Área da vila um pouco mais seca/cinza
  const vd = Math.hypot(x - villageCenter.x, z - villageCenter.z);
  if (vd < villageRadius + 20) {
    const vf = 1 - THREE.MathUtils.smoothstep(vd, villageRadius * 0.5, villageRadius + 20);
    mix.lerp(cAsh, vf * 0.35);
  }

  // Variação sutil de brilho por vértice para quebrar chapado
  const bright = (Math.sin(x * 0.29 + z * 0.31) * 0.5 + 0.5) * 0.06 - 0.03;
  mix.r = THREE.MathUtils.clamp(mix.r + bright, 0, 1);
  mix.g = THREE.MathUtils.clamp(mix.g + bright, 0, 1);
  mix.b = THREE.MathUtils.clamp(mix.b + bright, 0, 1);

  colorAttr[i * 3]     = mix.r;
  colorAttr[i * 3 + 1] = mix.g;
  colorAttr[i * 3 + 2] = mix.b;
}
groundGeo.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));
const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({
  vertexColors: true, flatShading: true, roughness: 1, metalness: 0
}));
ground.receiveShadow = true;
scene.add(ground);

// --- ESTRADA — asfalto desgastado com mais detalhe ---
// Base do asfalto — tom irregular, não cinza uniforme
// Estrada com segmentos mais densos para seguir o terreno corretamente
const roadGeo = new THREE.PlaneGeometry(roadHalfWidth * 2, WORLD_SIZE, 4, 120);
roadGeo.rotateX(-Math.PI / 2);

// Deformar vértices da estrada para seguir o terreno (como o chão faz)
const roadPosAttr = roadGeo.attributes.position;
const roadColor = new Float32Array(roadPosAttr.count * 3);
const cAsphalt  = new THREE.Color(0x38383c);
const cAsphalt2 = new THREE.Color(0x2e2e32);
const cAsphaltW = new THREE.Color(0x484850); // desgaste claro
for (let i = 0; i < roadPosAttr.count; i++) {
  const x = roadPosAttr.getX(i), z = roadPosAttr.getZ(i);
  // Elevar cada vértice da estrada ao terreno + pequena sobressaliência
  roadPosAttr.setY(i, terrainHeight(x, z) + 0.05);
  const wear = Math.sin(z * 0.08 + x * 0.22) * 0.5 + 0.5;
  const stain = Math.sin(z * 0.031 - 1.1) * Math.cos(x * 0.18) * 0.5 + 0.5;
  const c = cAsphalt.clone().lerp(cAsphalt2, wear * 0.45).lerp(cAsphaltW, stain * 0.18);
  roadColor[i * 3] = c.r; roadColor[i * 3 + 1] = c.g; roadColor[i * 3 + 2] = c.b;
}
roadPosAttr.needsUpdate = true;
roadGeo.computeVertexNormals();
roadGeo.setAttribute('color', new THREE.BufferAttribute(roadColor, 3));
const road = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({
  vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0
}));
road.receiveShadow = true;
scene.add(road);

// Acostamento — também segue o terreno
const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x5a5244, flatShading: true, roughness: 1 });
for (const side of [-1, 1]) {
  const sGeo = new THREE.PlaneGeometry(2.8, WORLD_SIZE, 1, 60);
  sGeo.rotateX(-Math.PI / 2);
  const sPosAttr = sGeo.attributes.position;
  const sx0 = side * (roadHalfWidth + 1.4);
  for (let i = 0; i < sPosAttr.count; i++) {
    const sz = sPosAttr.getZ(i);
    sPosAttr.setY(i, terrainHeight(sx0, sz) + 0.04);
  }
  sPosAttr.needsUpdate = true;
  sGeo.computeVertexNormals();
  const shoulder = new THREE.Mesh(sGeo, shoulderMat);
  shoulder.position.set(sx0, 0, 0);
  scene.add(shoulder);
}

// Rachaduras — mais e variadas
const crackMat = new THREE.MeshStandardMaterial({ color: 0x1e1e20, flatShading: true });
for (let i = 0; i < 48; i++) {
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.96;
  const isLong = Math.random() < 0.35;
  const w = isLong ? 0.05 + Math.random() * 0.07 : 0.08 + Math.random() * 0.12;
  const l = isLong
    ? roadHalfWidth * (1.2 + Math.random() * 0.8)
    : roadHalfWidth * (0.3 + Math.random() * 0.5);
  const crack = new THREE.Mesh(new THREE.PlaneGeometry(w, l), crackMat);
  crack.rotation.x = -Math.PI / 2;
  crack.rotation.z = (Math.random() - 0.5) * (isLong ? 0.4 : 1.4);
  crack.position.set((Math.random() - 0.5) * roadHalfWidth * 1.5, 0.06, z);
  scene.add(crack);
}

// Manchas escuras de óleo/umidade
const stainMat = new THREE.MeshStandardMaterial({ color: 0x252528, flatShading: true, transparent: true, opacity: 0.45, depthWrite: false });
for (let i = 0; i < 18; i++) {
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.92;
  const stain = new THREE.Mesh(
    new THREE.CircleGeometry(0.4 + Math.random() * 0.7, 6),
    stainMat
  );
  stain.rotation.x = -Math.PI / 2;
  stain.position.set((Math.random() - 0.5) * roadHalfWidth * 1.8, 0.07, z);
  scene.add(stain);
}

// Vegetação invadindo as bordas da estrada
const edgeGrassMat = new THREE.MeshStandardMaterial({ color: 0x4a5535, flatShading: true });
const edgeGrassGeo = new THREE.ConeGeometry(0.07, 0.32, 3);
const edgeGrassMesh = new THREE.InstancedMesh(edgeGrassGeo, edgeGrassMat, 600);
const dummyE = new THREE.Object3D();
let eg = 0;
for (let i = 0; i < 1200 && eg < 600; i++) {
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.95;
  const side = Math.random() < 0.5 ? -1 : 1;
  const offset = roadHalfWidth * (0.85 + Math.random() * 0.4);
  dummyE.position.set(side * offset, 0.07, z);
  dummyE.rotation.y = Math.random() * Math.PI * 2;
  dummyE.scale.set(1, 0.6 + Math.random() * 0.8, 1);
  dummyE.updateMatrix();
  edgeGrassMesh.setMatrixAt(eg, dummyE.matrix);
  eg++;
}
edgeGrassMesh.count = eg;
edgeGrassMesh.instanceMatrix.needsUpdate = true;
scene.add(edgeGrassMesh);

// Funções de placa e poste
export function makeRoadSign(x, z) {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x6a6a62, flatShading: true, metalness: 0.3, roughness: 0.6 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.2, 5), poleMat);
  pole.position.y = 1.1;
  pole.castShadow = true;
  g.add(pole);
  const plateColors = [0xb8482f, 0xc9a324, 0x3a6b8f];
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.04), new THREE.MeshStandardMaterial({ color: plateColors[Math.floor(Math.random() * plateColors.length)], flatShading: true, roughness: 0.7 }));
  plate.position.y = 2.05;
  plate.rotation.y = Math.random() * 0.5 - 0.25;
  plate.castShadow = true;
  g.add(plate);
  g.rotation.z = (Math.random() - 0.5) * 0.12;
  g.position.set(x, terrainHeight(x, z), z);
  return g;
}

export function makeUtilityPole(x, z) {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3a28, flatShading: true, roughness: 1 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 6, 6), woodMat);
  pole.position.y = 3;
  pole.castShadow = true;
  g.add(pole);
  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), woodMat);
  crossbar.position.y = 5.5;
  g.add(crossbar);
  // fios caídos ocasionais
  if (Math.random() < 0.35) {
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x222222, flatShading: true });
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.5 + Math.random() * 2, 3), wireMat);
    wire.position.set(0.4, 4.8, 0);
    wire.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    g.add(wire);
  }
  // Inclinação leve — nunca cai no campo de visão do jogador
  g.rotation.z = (Math.random() - 0.5) * (Math.random() < 0.3 ? 0.08 : 0.02);
  g.position.set(x, terrainHeight(x, z), z);
  return g;
}

for (let i = 0; i < 10; i++) {
  const z = -WORLD_SIZE / 2 + 20 + i * (WORLD_SIZE / 10);
  const side = i % 2 === 0 ? -1 : 1;
  scene.add(makeRoadSign(side * (roadHalfWidth + 1.6), z + (Math.random() - 0.5) * 8));
}
// Postes começam 80u à frente do spawn para não aparecerem na tela inicial
for (let i = 0; i < 8; i++) {
  const z = -WORLD_SIZE / 2 + 80 + i * ((WORLD_SIZE - 80) / 8);
  scene.add(makeUtilityPole(-(roadHalfWidth + 3.2), z + (Math.random() - 0.5) * 10));
}