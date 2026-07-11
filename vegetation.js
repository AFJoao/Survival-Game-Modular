// =================================================================
// VEGETATION — árvores, pedras, arbustos, grama instanciada
// =================================================================
import { scene } from './scene.js';
import { TickManager } from './core.js';
import { terrainHeight, regionType, WORLD_SIZE, roadHalfWidth, villageCenter, villageRadius } from './world.js';

export const resourceNodes = [];

function makeTree(x, z) {
  const tree = new THREE.Group();
  const dead    = Math.random() < 0.28;
  const burned  = !dead && Math.random() < 0.12;
  const pine    = !dead && !burned && Math.random() < 0.55; // pinheiro vs folhosa
  const small   = Math.random() < 0.25;

  // Cor do tronco varia: seco, queimado ou vivo
  const trunkColor = dead   ? 0x3a332c
                   : burned ? 0x1e1a16
                   :          new THREE.Color(0x6b4a30).offsetHSL(0, 0, (Math.random() - 0.5) * 0.1).getHex();

  const trunkH = small ? 1.4 + Math.random() * 0.6 : 2.0 + Math.random() * 1.0;
  const trunkR = small ? 0.15 + Math.random() * 0.08 : 0.22 + Math.random() * 0.12;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkR * 0.7, trunkR, trunkH, 6),
    new THREE.MeshStandardMaterial({ color: trunkColor, flatShading: true, roughness: 1 })
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  tree.add(trunk);

  if (dead || burned) {
    // Galhos secos — quantidade e ângulo variados
    const branchCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < branchCount; i++) {
      const blen = 0.6 + Math.random() * 0.9;
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.07, blen, 4),
        new THREE.MeshStandardMaterial({ color: burned ? 0x111010 : trunkColor, flatShading: true, roughness: 1 })
      );
      branch.position.set(0, trunkH * (0.55 + i * 0.12), 0);
      branch.rotation.z = (Math.random() - 0.5) * 1.6;
      branch.rotation.y = (i / branchCount) * Math.PI * 2 + Math.random() * 0.5;
      branch.castShadow = true;
      tree.add(branch);
    }
  } else if (pine) {
    // Pinheiro — camadas de cone
    const layers = small ? 2 : 2 + Math.floor(Math.random() * 2);
    const leafColor = new THREE.Color(burned ? 0x1a1a12 : 0x2e4028)
      .offsetHSL(0, 0, (Math.random() - 0.5) * 0.14);
    for (let l = 0; l < layers; l++) {
      const radius = (1.2 - l * 0.2) * (small ? 0.7 : 1.0) + Math.random() * 0.3;
      const height = radius * 2.0;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 7),
        new THREE.MeshStandardMaterial({ color: leafColor, flatShading: true, roughness: 1 })
      );
      cone.position.y = trunkH + l * (height * 0.55);
      cone.castShadow = true;
      tree.add(cone);
    }
  } else {
    // Folhosa — copa arredondada com variação
    const leafColor = new THREE.Color(0x3c5230).offsetHSL(0, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.15);
    const blobCount = 1 + Math.floor(Math.random() * 2);
    for (let b = 0; b < blobCount; b++) {
      const cr = (1.1 + Math.random() * 0.6) * (small ? 0.65 : 1.0);
      const leaves = new THREE.Mesh(
        new THREE.DodecahedronGeometry(cr, 0),
        new THREE.MeshStandardMaterial({ color: leafColor, flatShading: true, roughness: 1 })
      );
      leaves.position.set(
        (Math.random() - 0.5) * 0.5,
        trunkH + cr * 0.7 + b * 0.4,
        (Math.random() - 0.5) * 0.5
      );
      leaves.castShadow = true;
      tree.add(leaves);
    }
  }

  tree.position.set(x, terrainHeight(x, z), z);
  tree.rotation.y = Math.random() * Math.PI * 2;
  // Inclinação leve — árvores raramente crescem perfeitamente retas
  tree.rotation.z = (Math.random() - 0.5) * 0.06;
  const s = small ? 0.55 + Math.random() * 0.35 : 0.80 + Math.random() * 0.70;
  tree.scale.setScalar(s);
  return tree;
}

function makeRock(x, z) {
  // Variação de cor entre pedras
  const rockColors = [0x83807a, 0x78746e, 0x8e8a82, 0x6e6b65];
  const col = rockColors[Math.floor(Math.random() * rockColors.length)];
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.45 + Math.random() * 0.65, 0),
    new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: 1 })
  );
  rock.position.set(x, terrainHeight(x, z) + 0.05, z);
  rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

function makeBigRock(x, z) {
  const g = new THREE.Group();
  const colBase = new THREE.Color(0x76726a).offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
  const mat = new THREE.MeshStandardMaterial({ color: colBase, flatShading: true, roughness: 1 });
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const s = 0.8 + Math.random() * 1.3;
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat);
    boulder.position.set((Math.random() - 0.5) * 1.6, s * 0.30, (Math.random() - 0.5) * 1.6);
    boulder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    g.add(boulder);
  }
  g.position.set(x, terrainHeight(x, z), z);
  return g;
}

export function makeBush(x, z) {
  const bush = new THREE.Group();
  // Paleta de arbustos mais variada
  const bushColors = [0x555f3c, 0x4a5532, 0x4f4a38, 0x5c5240, 0x485038];
  const col = bushColors[Math.floor(Math.random() * bushColors.length)];
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(col).offsetHSL(0, 0, (Math.random() - 0.5) * 0.08),
    flatShading: true, roughness: 1
  });
  const clumps = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < clumps; i++) {
    const s = 0.22 + Math.random() * 0.28;
    const clump = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat);
    clump.position.set((Math.random() - 0.5) * 0.5, s * 0.55, (Math.random() - 0.5) * 0.5);
    clump.castShadow = true;
    bush.add(clump);
  }
  bush.position.set(x, terrainHeight(x, z), z);
  bush.rotation.y = Math.random() * Math.PI * 2;
  return bush;
}

function makeDryScrub(x, z) {
  const scrub = new THREE.Group();
  // Paleta seca — amarelo-palha, cinza-verde, ocre
  const scrubColors = [0x9a8a4a, 0x8a7c42, 0x7a7252, 0x8c8058, 0xa09050];
  const col = scrubColors[Math.floor(Math.random() * scrubColors.length)];
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(col).offsetHSL(0, 0, (Math.random() - 0.5) * 0.12),
    flatShading: true, roughness: 1
  });
  const blades = 4 + Math.floor(Math.random() * 4);
  for (let i = 0; i < blades; i++) {
    const h = 0.28 + Math.random() * 0.42;
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.04, h, 3), mat);
    blade.position.set((Math.random() - 0.5) * 0.38, h / 2, (Math.random() - 0.5) * 0.38);
    blade.rotation.z = (Math.random() - 0.5) * 0.55;
    blade.rotation.y = Math.random() * Math.PI * 2;
    scrub.add(blade);
  }
  scrub.position.set(x, terrainHeight(x, z), z);
  return scrub;
}

function makeFallenLog(x, z) {
  const log = new THREE.Group();
  // Troncos podres têm tons mais esverdeados/escuros
  const logColors = [0x5a4530, 0x4e3c28, 0x3e3422, 0x5c4838];
  const col = logColors[Math.floor(Math.random() * logColors.length)];
  const mat = new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: 1 });
  const len = 2.0 + Math.random() * 2.8;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 + Math.random() * 0.14, 0.22 + Math.random() * 0.14, len, 6),
    mat
  );
  trunk.rotation.z = Math.PI / 2;
  trunk.position.y = 0.14;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  log.add(trunk);
  // Galhos ocasionais no tronco caído
  if (Math.random() < 0.6) {
    const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.4 + Math.random() * 0.5, 4), mat);
    stub.position.set((Math.random() - 0.5) * len * 0.5, 0.20, 0);
    stub.rotation.z = 0.5 + Math.random() * 0.4;
    log.add(stub);
  }
  log.position.set(x, terrainHeight(x, z), z);
  log.rotation.y = Math.random() * Math.PI * 2;
  return log;
}

export function makeDebrisPile(x, z) {
  const pile = new THREE.Group();
  const mat     = new THREE.MeshStandardMaterial({ color: 0x54524a, flatShading: true });
  const rustMat = new THREE.MeshStandardMaterial({ color: 0x6b4530, flatShading: true, roughness: 1 });
  const chunks = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < chunks; i++) {
    const w = 0.28 + Math.random() * 0.55, h = 0.18 + Math.random() * 0.32, d = 0.28 + Math.random() * 0.55;
    const chunk = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Math.random() < 0.3 ? rustMat : mat);
    chunk.position.set((Math.random() - 0.5) * 1.0, h / 2, (Math.random() - 0.5) * 1.0);
    chunk.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
    chunk.castShadow = true;
    pile.add(chunk);
  }
  pile.position.set(x, terrainHeight(x, z), z);
  return pile;
}

// --- Vento ---
const windSwayers = [];
export function registerSway(obj, amount = 0.05) {
  windSwayers.push({ obj, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 0.6, amount });
}
TickManager.register('high', (dt) => {
  const t = performance.now() / 1000;
  for (const s of windSwayers) {
    s.obj.rotation.z = Math.sin(t * s.speed + s.phase) * s.amount;
    // leve movimento no eixo X para mais naturalidade
    s.obj.rotation.x = Math.sin(t * s.speed * 0.7 + s.phase + 1.2) * s.amount * 0.4;
  }
});

// --- Helpers de exclusão ---
// Buffer ao redor da estrada e da vila para impedir vegetação invasora
const ROAD_CLEAR  = roadHalfWidth + 7;   // margem de limpeza além do asfalto
const VILLAGE_CLEAR = villageRadius + 6; // margem ao redor da vila

function tooCloseToRoad(x)   { return Math.abs(x) < ROAD_CLEAR; }
function tooCloseToVillage(x, z) {
  return Math.hypot(x - villageCenter.x, z - villageCenter.z) < VILLAGE_CLEAR;
}
function clearOfAll(x, z) {
  return !tooCloseToRoad(x) && !tooCloseToVillage(x, z);
}

// --- Spawn de vegetação ---

// Árvores — exclusão total perto de estrada e vila
for (let i = 0; i < 220; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  if (regionType(x, z) !== 'forest') continue;
  if (!clearOfAll(x, z)) continue;
  const mesh = makeTree(x, z);
  scene.add(mesh);
  resourceNodes.push({ type: 'wood', mesh, x, z, amount: 3 });
}

// Pedras menores
for (let i = 0; i < 80; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  if (regionType(x, z) !== 'forest') continue;
  if (!clearOfAll(x, z)) continue;
  const mesh = makeRock(x, z);
  scene.add(mesh);
  resourceNodes.push({ type: 'stone', mesh, x, z, amount: 3 });
}

// Arbustos — buffer menor, podem ficar perto mas não na rua
for (let i = 0; i < 380; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  if (tooCloseToRoad(x)) continue;
  if (regionType(x, z) === 'road') continue;
  const bush = makeBush(x, z);
  scene.add(bush);
  if (Math.random() < 0.5) registerSway(bush, 0.03 + Math.random() * 0.04);
}

// Capim seco / scrubs — buffer menor
for (let i = 0; i < 300; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.94;
  if (tooCloseToRoad(x)) continue;
  if (regionType(x, z) === 'road') continue;
  const scrub = makeDryScrub(x, z);
  scene.add(scrub);
  registerSway(scrub, 0.07 + Math.random() * 0.08);
}

// Troncos caídos
for (let i = 0; i < 40; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.92;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.92;
  if (regionType(x, z) !== 'forest') continue;
  if (!clearOfAll(x, z)) continue;
  scene.add(makeFallenLog(x, z));
}

// Rochas grandes
for (let i = 0; i < 18; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.90;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.90;
  if (regionType(x, z) !== 'forest') continue;
  if (!clearOfAll(x, z)) continue;
  scene.add(makeBigRock(x, z));
}

// Entulho — fora da rua e da vila
for (let i = 0; i < 14; i++) {
  const x = (Math.random() - 0.5) * WORLD_SIZE * 0.90;
  const z = (Math.random() - 0.5) * WORLD_SIZE * 0.90;
  if (tooCloseToRoad(x)) continue;
  if (tooCloseToVillage(x, z)) continue;
  scene.add(makeDebrisPile(x, z));
}

// --- Grama instanciada — duas camadas de tamanho ---
const GRASS_COUNT = 6500;
const grassGeo  = new THREE.ConeGeometry(0.055, 0.38, 3);
grassGeo.translate(0, 0.19, 0);
const grassGeo2 = new THREE.ConeGeometry(0.04, 0.22, 3);
grassGeo2.translate(0, 0.11, 0);

// Paleta de grama — varia entre verde vivo, seco e acinzentado
const grassPalette = [
  new THREE.Color(0x6a7848),
  new THREE.Color(0x5e6e3c),
  new THREE.Color(0x7a8450),
  new THREE.Color(0x888058),
  new THREE.Color(0x9a9060),
  new THREE.Color(0x585840),
];

function spawnGrass(geo, count, heightScale) {
  const mat  = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const d = new THREE.Object3D();
  let placed = 0;
  for (let i = 0; i < count * 2 && placed < count; i++) {
    const x = (Math.random() - 0.5) * WORLD_SIZE * 0.96;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 0.96;
    if (regionType(x, z) === 'road') continue;
    d.position.set(x, terrainHeight(x, z), z);
    d.rotation.y = Math.random() * Math.PI * 2;
    const s = 0.55 + Math.random() * 1.0;
    d.scale.set(s, s * heightScale * (0.65 + Math.random() * 0.7), s);
    d.updateMatrix();
    mesh.setMatrixAt(placed, d.matrix);
    const col = grassPalette[Math.floor(Math.random() * grassPalette.length)]
      .clone().offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.12);
    mesh.setColorAt(placed, col);
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
}

spawnGrass(grassGeo,  GRASS_COUNT,        1.0);  // grama alta
spawnGrass(grassGeo2, Math.floor(GRASS_COUNT * 0.6), 0.7);  // grama curta

// --- Pedrinhas instanciadas — dois tamanhos e paleta variada ---
const pebblePalette = [0x8a867c, 0x7e7a72, 0x948e86, 0x6e6c66, 0xa09890];

function spawnPebbles(size, count) {
  const geo  = new THREE.DodecahedronGeometry(size, 0);
  const mat  = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const d = new THREE.Object3D();
  let placed = 0;
  for (let i = 0; i < count * 2 && placed < count; i++) {
    const x = (Math.random() - 0.5) * WORLD_SIZE * 0.96;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 0.96;
    if (regionType(x, z) === 'road') continue;
    d.position.set(x, terrainHeight(x, z) + size * 0.15, z);
    d.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    const s = 0.45 + Math.random() * 1.2;
    d.scale.setScalar(s);
    d.updateMatrix();
    mesh.setMatrixAt(placed, d.matrix);
    const col = new THREE.Color(pebblePalette[Math.floor(Math.random() * pebblePalette.length)])
      .offsetHSL(0, 0, (Math.random() - 0.5) * 0.10);
    mesh.setColorAt(placed, col);
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

spawnPebbles(0.14, 900);   // pedrinhas pequenas
spawnPebbles(0.24, 350);   // pedras médias