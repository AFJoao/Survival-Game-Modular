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

export function terrainHeight(x, z) {
  let h = Math.sin(x * 0.018) * Math.cos(z * 0.021) * 3.4
        + Math.sin(x * 0.045 + z * 0.03) * 1.5
        + Math.sin(x * 0.11 - z * 0.14) * 0.5
        + Math.sin(x * 0.24 + z * 0.19) * 0.18;

  const roadDist = Math.abs(x);
  if (roadDist < 16) h *= THREE.MathUtils.smoothstep(roadDist, 0, 16) * 0.85 + 0.15;

  const vd = Math.hypot(x - villageCenter.x, z - villageCenter.z);
  if (vd < villageRadius + 10) h *= THREE.MathUtils.smoothstep(vd, 0, villageRadius + 10) * 0.7 + 0.3;

  return h;
}

// --- TERRENO ---
const groundGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 110, 110);
groundGeo.rotateX(-Math.PI / 2);
const posAttr = groundGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i), z = posAttr.getZ(i);
  posAttr.setY(i, terrainHeight(x, z));
}
groundGeo.computeVertexNormals();
const colorAttr = new Float32Array(posAttr.count * 3);
const cGreen = new THREE.Color(0x545f42), cDirt = new THREE.Color(0x6b5f47), cAsh = new THREE.Color(0x4a473e), cRock = new THREE.Color(0x76726a);
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i), z = posAttr.getZ(i), y = posAttr.getY(i);
  const patch = Math.sin(x * 0.02 + 3) * Math.cos(z * 0.023 - 1) * 0.5 + 0.5;
  const grit = Math.sin(x * 0.07 - z * 0.05) * 0.5 + 0.5;
  const mix = cGreen.clone().lerp(cDirt, patch * 0.7).lerp(cAsh, grit * 0.25);
  const ridge = THREE.MathUtils.clamp((y - 1.6) / 2.2, 0, 1);
  mix.lerp(cRock, ridge * 0.5);
  colorAttr[i * 3] = mix.r; colorAttr[i * 3 + 1] = mix.g; colorAttr[i * 3 + 2] = mix.b;
}
groundGeo.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));
const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
scene.add(ground);

// --- ESTRADA ---
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(roadHalfWidth * 2, WORLD_SIZE, 1, 20),
  new THREE.MeshStandardMaterial({ color: 0x3a3a3d, flatShading: true })
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.05;
scene.add(road);

const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x5f5748, flatShading: true, roughness: 1 });
for (const side of [-1, 1]) {
  const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(2.2, WORLD_SIZE), shoulderMat);
  shoulder.rotation.x = -Math.PI / 2;
  shoulder.position.set(side * (roadHalfWidth + 1), 0.04, 0);
  scene.add(shoulder);
}

const crackMat = new THREE.MeshStandardMaterial({ color: 0x232325, flatShading: true });
for (let i = 0; i < 26; i++) {
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.96;
  const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.08 + Math.random() * 0.1, roadHalfWidth * (0.7 + Math.random() * 0.6)), crackMat);
  crack.rotation.x = -Math.PI / 2;
  crack.rotation.z = (Math.random() - 0.5) * 1.1;
  crack.position.set((Math.random() - 0.5) * roadHalfWidth * 1.2, 0.06, z);
  scene.add(crack);
}

// Funções de placa e poste (precisam de makeBush de vegetation, mas para evitar
// dependência circular exportamos os dados e vegetation.js chama ao inicializar)
export function makeRoadSign(x, z) {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x6a6a62, flatShading: true, metalness: 0.3, roughness: 0.6 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.2, 5), poleMat);
  pole.position.y = 1.1;
  g.add(pole);
  const plateColors = [0xb8482f, 0xc9a324, 0x3a6b8f];
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.04), new THREE.MeshStandardMaterial({ color: plateColors[Math.floor(Math.random() * plateColors.length)], flatShading: true, roughness: 0.7 }));
  plate.position.y = 2.05;
  plate.rotation.y = Math.random() * 0.5 - 0.25;
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
  g.add(pole);
  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), woodMat);
  crossbar.position.y = 5.5;
  g.add(crossbar);
  g.rotation.z = (Math.random() - 0.5) * (Math.random() < 0.3 ? 0.35 : 0.05);
  g.position.set(x, terrainHeight(x, z), z);
  return g;
}

for (let i = 0; i < 10; i++) {
  const z = -WORLD_SIZE / 2 + 20 + i * (WORLD_SIZE / 10);
  const side = i % 2 === 0 ? -1 : 1;
  scene.add(makeRoadSign(side * (roadHalfWidth + 1.6), z + (Math.random() - 0.5) * 8));
}
for (let i = 0; i < 8; i++) {
  const z = -WORLD_SIZE / 2 + 30 + i * (WORLD_SIZE / 8);
  scene.add(makeUtilityPole(-(roadHalfWidth + 3.2), z + (Math.random() - 0.5) * 10));
}
