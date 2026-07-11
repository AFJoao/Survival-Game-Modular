// =================================================================
// BUILDINGS — edifícios exploráveis (vila + ruínas isoladas)
// =================================================================
import { scene } from './scene.js';
import { terrainHeight, villageCenter, villageRadius, roadHalfWidth, WORLD_SIZE } from './world.js';
import { pickupPool, ITEM_DEFS } from './items.js';

const LOOT_TABLE = ['food', 'water', 'bandage', 'ammo_pistol', 'wood', 'stone'];
export const LOOT_RESPAWN_SECONDS = 90;

export const buildings = [];
export const lootPoints = [];

export function spawnLootAtPoint(point) {
  point.itemId = LOOT_TABLE[Math.floor(Math.random() * LOOT_TABLE.length)];
  point.available = true;
  point.cooldown = 0;
  const marker = pickupPool.acquire(point.x, point.z, point.itemId);
  point.marker = marker;
}

export function makeBuilding(x, z, w, d, h, color, opts = {}) {
  const group = new THREE.Group();
  const baseColor = new THREE.Color(color);
  const jitter = (Math.random() - 0.5) * 0.08;
  baseColor.offsetHSL(0, 0, jitter);
  const wallMat = new THREE.MeshStandardMaterial({ color: baseColor, flatShading: true, roughness: 0.95 });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  walls.position.y = h / 2;
  const roofColor = new THREE.Color(0x6b4a3a).offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(w, d) * 0.75, h * 0.55 + Math.random() * 0.3, 4),
    new THREE.MeshStandardMaterial({ color: roofColor, flatShading: true, roughness: 1 })
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = h + (h * 0.55 + 0.15) * 0.5;
  group.add(walls, roof);

  const doorMat = new THREE.MeshStandardMaterial({ color: 0x2e2216, flatShading: true, roughness: 1 });
  const doorW = 0.95, doorH = Math.max(2.2, h * 0.75);
  const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.08), doorMat);
  door.position.set(0, doorH / 2, d / 2 + 0.02);
  group.add(door);
  const step = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.5, 0.16, 0.5), new THREE.MeshStandardMaterial({ color: 0x8a857a, flatShading: true }));
  step.position.set(0, 0.08, d / 2 + 0.35);
  group.add(step);
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(doorW + 1.4, 1.6), new THREE.MeshStandardMaterial({ color: 0x716c60, flatShading: true, roughness: 1 }));
  walk.rotation.x = -Math.PI / 2;
  walk.position.set(0, 0.03, d / 2 + 1.1);
  group.add(walk);

  const glassMat = new THREE.MeshStandardMaterial({ color: 0x8fae9a, flatShading: true, emissive: 0x1a2a20, emissiveIntensity: 0.15, roughness: 0.4 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a3228, flatShading: true });
  function addWindow(lx, lz, faceZ) {
    if (Math.random() < 0.15) return;
    const win = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.65), glassMat);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.73, 0.05), frameMat);
    win.add(frame);
    glass.position.z = faceZ > 0 ? 0.03 : -0.03;
    if (faceZ === 0) glass.rotation.y = Math.PI / 2;
    win.add(glass);
    win.position.set(lx, h * 0.58, lz);
    if (faceZ === 0) win.rotation.y = Math.PI / 2;
    group.add(win);
  }
  addWindow(-w / 4, d / 2 + 0.02, 1);
  addWindow(w / 4, d / 2 + 0.02, 1);
  addWindow(w / 2 + 0.02, 0, 0);
  addWindow(-(w / 2 + 0.02), 0, 0);

  group.rotation.y = opts.forceYaw ?? (Math.random() < 0.5 ? 0 : Math.PI / 2 + (Math.random() - 0.5) * 0.15);

  if (opts.withInterior) {
    const furnMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, flatShading: true, roughness: 1 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.6), furnMat);
    table.position.set(-w / 4, 0.225, -d / 5);
    group.add(table);
    for (let cx = -1; cx <= 1; cx += 2) {
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.32), furnMat);
      chair.position.set(-w / 4 + cx * 0.55, 0.2, -d / 5);
      group.add(chair);
    }
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.3, w * 0.55), new THREE.MeshStandardMaterial({ color: 0x453522, flatShading: true }));
    shelf.position.set(w / 2 - 0.2, 0.65, 0);
    group.add(shelf);
    if (Math.random() < 0.6) {
      const bed = new THREE.Group();
      const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 1.8), new THREE.MeshStandardMaterial({ color: 0x4a3a28, flatShading: true }));
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.16, 1.7), new THREE.MeshStandardMaterial({ color: 0x8a8570, flatShading: true }));
      mattress.position.y = 0.22;
      bed.add(bedFrame, mattress);
      bed.position.set(-(w / 2 - 0.55), 0.14, d / 4);
      group.add(bed);
    }
    for (let i = 0; i < 2; i++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), new THREE.MeshStandardMaterial({ color: 0x6b5638, flatShading: true }));
      box.position.set(w / 4 + (Math.random() - 0.5) * 0.6, 0.175, d / 4 + (Math.random() - 0.5) * 0.6);
      box.rotation.y = Math.random();
      group.add(box);
    }
  }

  // Amostra o terreno nos 4 cantos + centro e usa o mínimo,
  // assim o prédio "afunda" no ponto mais alto em vez de flutuar.
  const halfW = w / 2, halfD = d / 2;
  const corners = [
    terrainHeight(x - halfW, z - halfD),
    terrainHeight(x + halfW, z - halfD),
    terrainHeight(x - halfW, z + halfD),
    terrainHeight(x + halfW, z + halfD),
    terrainHeight(x, z),
  ];
  const y = Math.min(...corners);
  group.position.set(x, y, z);
  scene.add(group);

  const building = { mesh: group, x, z, w, d, radius: Math.max(w, d) / 2 + 0.6, lootPoints: [] };
  const lootCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < lootCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(w, d) / 2 + 1.4;
    const lx = x + Math.cos(angle) * dist, lz = z + Math.sin(angle) * dist;
    const point = { x: lx, z: lz, building, available: false, cooldown: 0, marker: null, itemId: null };
    spawnLootAtPoint(point);
    building.lootPoints.push(point);
    lootPoints.push(point);
  }
  buildings.push(building);
  return building;
}

// --- Gerar vila ---
const VILLAGE_PALETTE = [0x8a7a63, 0x7a6f5a, 0x8f8272, 0x6e6355, 0x9a8a6a];
for (let i = 0; i < 9; i++) {
  const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.3;
  const dist = 14 + Math.random() * (villageRadius - 24);
  const x = villageCenter.x + Math.cos(angle) * dist;
  const z = villageCenter.z + Math.sin(angle) * dist;
  const color = VILLAGE_PALETTE[Math.floor(Math.random() * VILLAGE_PALETTE.length)];
  makeBuilding(x, z, 5 + Math.random() * 2, 5 + Math.random() * 2, 3 + Math.random() * 1.2, color, { withInterior: true });
}

// --- Ruínas isoladas ---
const RUIN_PALETTE = [0x5f584a, 0x54503f, 0x625848, 0x494439];
for (let i = 0; i < 5; i++) {
  let x, z;
  do {
    x = (Math.random() - 0.5) * WORLD_SIZE * 0.85;
    z = (Math.random() - 0.5) * WORLD_SIZE * 0.85;
  } while (Math.hypot(x - villageCenter.x, z - villageCenter.z) < villageRadius + 20 || Math.abs(x) < roadHalfWidth + 6);
  const color = RUIN_PALETTE[Math.floor(Math.random() * RUIN_PALETTE.length)];
  makeBuilding(x, z, 4 + Math.random() * 2, 4 + Math.random() * 2, 2.4 + Math.random() * 1, color, { withInterior: Math.random() < 0.4 });
}
