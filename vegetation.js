// =================================================================
// VEGETATION — árvores, pedras, arbustos, grama instanciada
// =================================================================
import { scene } from './scene.js';
import { TickManager } from './core.js';
import { terrainHeight, regionType, WORLD_SIZE } from './world.js';

export const resourceNodes = [];

function makeTree(x, z) {
  const tree = new THREE.Group();
  const dead = Math.random() < 0.28;
  const trunkColor = dead ? 0x3a332c : 0x6b4a30;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.35, 2.2, 6),
    new THREE.MeshStandardMaterial({ color: trunkColor, flatShading: true })
  );
  trunk.position.y = 1.1;
  tree.add(trunk);
  if (dead) {
    for (let i = 0; i < 3; i++) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.09, 1.0 + Math.random() * 0.6, 4),
        new THREE.MeshStandardMaterial({ color: trunkColor, flatShading: true })
      );
      branch.position.set(0, 2.1 + i * 0.25, 0);
      branch.rotation.z = (Math.random() - 0.5) * 1.4;
      branch.rotation.y = Math.random() * Math.PI;
      tree.add(branch);
    }
  } else {
    const leafColor = new THREE.Color(0x3a4a30).offsetHSL(0, 0, (Math.random() - 0.5) * 0.12);
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 3.2, 7),
      new THREE.MeshStandardMaterial({ color: leafColor, flatShading: true })
    );
    leaves.position.y = 3.4;
    tree.add(leaves);
  }
  tree.position.set(x, terrainHeight(x, z), z);
  tree.rotation.y = Math.random() * Math.PI * 2;
  const s = 0.75 + Math.random() * 0.65;
  tree.scale.setScalar(s);
  return tree;
}

function makeRock(x, z) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.6, 0),
    new THREE.MeshStandardMaterial({ color: 0x83807a, flatShading: true })
  );
  rock.position.set(x, terrainHeight(x, z) + 0.2, z);
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  return rock;
}

function makeBigRock(x, z) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x76726a, flatShading: true, roughness: 1 });
  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const s = 0.9 + Math.random() * 1.1;
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat);
    boulder.position.set((Math.random() - 0.5) * 1.4, s * 0.5, (Math.random() - 0.5) * 1.4);
    boulder.rotation.set(Math.random(), Math.random(), Math.random());
    g.add(boulder);
  }
  g.position.set(x, terrainHeight(x, z), z);
  return g;
}

export function makeBush(x, z) {
  const bush = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: Math.random() < 0.5 ? 0x585f3f : 0x4f4a38, flatShading: true });
  const clumps = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < clumps; i++) {
    const s = 0.28 + Math.random() * 0.22;
    const clump = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat);
    clump.position.set((Math.random() - 0.5) * 0.4, s * 0.6, (Math.random() - 0.5) * 0.4);
    bush.add(clump);
  }
  bush.position.set(x, terrainHeight(x, z), z);
  bush.rotation.y = Math.random() * Math.PI * 2;
  return bush;
}

function makeDryScrub(x, z) {
  const scrub = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x9a8a4a).offsetHSL(0, 0, (Math.random() - 0.5) * 0.15),
    flatShading: true
  });
  const blades = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < blades; i++) {
    const h = 0.35 + Math.random() * 0.35;
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05, h, 3), mat);
    blade.position.set((Math.random() - 0.5) * 0.3, h / 2, (Math.random() - 0.5) * 0.3);
    blade.rotation.z = (Math.random() - 0.5) * 0.5;
    scrub.add(blade);
  }
  scrub.position.set(x, terrainHeight(x, z), z);
  return scrub;
}

function makeFallenLog(x, z) {
  const log = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x5a4530, flatShading: true, roughness: 1 });
  const len = 2.2 + Math.random() * 2.2;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2 + Math.random() * 0.12, 0.24 + Math.random() * 0.12, len, 6),
    mat
  );
  trunk.rotation.z = Math.PI / 2;
  trunk.position.y = 0.24;
  log.add(trunk);
  if (Math.random() < 0.5) {
    const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.5, 4), mat);
    stub.position.set(len * 0.3, 0.4, 0);
    stub.rotation.z = 0.6;
    log.add(stub);
  }
  log.position.set(x, terrainHeight(x, z), z);
  log.rotation.y = Math.random() * Math.PI * 2;
  return log;
}

export function makeDebrisPile(x, z) {
  const pile = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x54524a, flatShading: true });
  const rustMat = new THREE.MeshStandardMaterial({ color: 0x6b4530, flatShading: true, roughness: 1 });
  const chunks = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < chunks; i++) {
    const w = 0.3 + Math.random() * 0.5, h = 0.2 + Math.random() * 0.3, d = 0.3 + Math.random() * 0.5;
    const chunk = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Math.random() < 0.3 ? rustMat : mat);
    chunk.position.set((Math.random() - 0.5) * 0.9, h / 2, (Math.random() - 0.5) * 0.9);
    chunk.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
    pile.add(chunk);
  }
  pile.position.set(x, terrainHeight(x, z), z);
  return pile;
}

// --- Vento ---
const windSwayers = [];
export function registerSway(obj, amount = 0.05) {
  windSwayers.push({ obj, phase: Math.random() * Math.PI * 2, speed: 0.6 + Math.random() * 0.5, amount });
}
TickManager.register('high', (dt) => {
  const t = performance.now() / 1000;
  for (const s of windSwayers) {
    s.obj.rotation.z = Math.sin(t * s.speed + s.phase) * s.amount;
  }
});

// --- Spawn de vegetação ---
for (let i = 0; i < 170; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  if (regionType(x, z) !== 'forest') continue;
  const mesh = makeTree(x, z);
  scene.add(mesh);
  resourceNodes.push({ type: 'wood', mesh, x, z, amount: 3 });
}
for (let i = 0; i < 60; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  if (regionType(x, z) !== 'forest') continue;
  const mesh = makeRock(x, z);
  scene.add(mesh);
  resourceNodes.push({ type: 'stone', mesh, x, z, amount: 3 });
}
for (let i = 0; i < 340; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  if (regionType(x, z) === 'road') continue;
  const bush = makeBush(x, z);
  scene.add(bush);
  if (Math.random() < 0.4) registerSway(bush, 0.04 + Math.random() * 0.05);
}
for (let i = 0; i < 260; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  if (regionType(x, z) === 'road') continue;
  const scrub = makeDryScrub(x, z);
  scene.add(scrub);
  registerSway(scrub, 0.08 + Math.random() * 0.07);
}
for (let i = 0; i < 35; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.92;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.92;
  if (regionType(x, z) !== 'forest') continue;
  scene.add(makeFallenLog(x, z));
}
for (let i = 0; i < 14; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
  if (regionType(x, z) !== 'forest') continue;
  scene.add(makeBigRock(x, z));
}
for (let i = 0; i < 18; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
  scene.add(makeDebrisPile(x, z));
}

// --- Grama instanciada ---
const GRASS_COUNT = 5000;
const grassGeo = new THREE.ConeGeometry(0.06, 0.4, 3);
grassGeo.translate(0, 0.2, 0);
const grassMat = new THREE.MeshStandardMaterial({ color: 0x707a4a, flatShading: true, roughness: 1 });
const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, GRASS_COUNT);
grassMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(GRASS_COUNT * 3), 3);
const dummy = new THREE.Object3D();
const grassBaseColor = new THREE.Color(0x707a4a);
let grassPlaced = 0;
for (let i = 0; i < GRASS_COUNT * 2 && grassPlaced < GRASS_COUNT; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.96;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.96;
  if (regionType(x, z) === 'road') continue;
  dummy.position.set(x, terrainHeight(x, z), z);
  dummy.rotation.y = Math.random() * Math.PI * 2;
  const s = 0.6 + Math.random() * 0.9;
  dummy.scale.set(s, s * (0.7 + Math.random() * 0.6), s);
  dummy.updateMatrix();
  grassMesh.setMatrixAt(grassPlaced, dummy.matrix);
  const c = grassBaseColor.clone().offsetHSL((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.18);
  grassMesh.setColorAt(grassPlaced, c);
  grassPlaced++;
}
grassMesh.count = grassPlaced;
grassMesh.instanceMatrix.needsUpdate = true;
scene.add(grassMesh);

// --- Pedrinhas instanciadas ---
const PEBBLE_COUNT = 900;
const pebbleGeo = new THREE.DodecahedronGeometry(0.14, 0);
const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x8a867c, flatShading: true, roughness: 1 });
const pebbleMesh = new THREE.InstancedMesh(pebbleGeo, pebbleMat, PEBBLE_COUNT);
let pebblePlaced = 0;
for (let i = 0; i < PEBBLE_COUNT * 2 && pebblePlaced < PEBBLE_COUNT; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.96;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.96;
  if (regionType(x, z) === 'road') continue;
  dummy.position.set(x, terrainHeight(x, z) + 0.05, z);
  dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  const s = 0.5 + Math.random() * 1.1;
  dummy.scale.setScalar(s);
  dummy.updateMatrix();
  pebbleMesh.setMatrixAt(pebblePlaced, dummy.matrix);
  pebblePlaced++;
}
pebbleMesh.count = pebblePlaced;
pebbleMesh.instanceMatrix.needsUpdate = true;
scene.add(pebbleMesh);
