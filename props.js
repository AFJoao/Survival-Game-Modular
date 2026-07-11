// =================================================================
// PROPS — objetos ambientais decorativos (barris, caixas, carros, etc.)
// =================================================================
import { scene } from './scene.js';
import { terrainHeight, villageCenter, villageRadius, roadHalfWidth, regionType, WORLD_SIZE } from './world.js';

export function makeBarrel(x, z) {
  const rusty = Math.random() < 0.5;
  const mat = new THREE.MeshStandardMaterial({ color: rusty ? 0x6b4530 : 0x3a5a3a, flatShading: true, metalness: 0.2, roughness: 0.8 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.85, 10), mat);
  barrel.position.set(x, terrainHeight(x, z) + 0.42, z);
  barrel.rotation.y = Math.random() * Math.PI;
  if (Math.random() < 0.15) { barrel.rotation.z = Math.PI / 2; barrel.position.y = terrainHeight(x, z) + 0.35; }
  return barrel;
}
export function makeCrate(x, z) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x6b5636, flatShading: true, roughness: 1 });
  const s = 0.5 + Math.random() * 0.25;
  const crate = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), mat);
  crate.position.set(x, terrainHeight(x, z) + s / 2, z);
  crate.rotation.y = Math.random() * Math.PI;
  return crate;
}
export function makePallet(x, z) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x7a6142, flatShading: true, roughness: 1 });
  const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 1.1), mat);
  pallet.position.set(x, terrainHeight(x, z) + 0.07, z);
  pallet.rotation.y = Math.random() * Math.PI;
  return pallet;
}
export function makeTire(x, z) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x201f1d, flatShading: true, roughness: 0.9 });
  const tire = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.14, 6, 10), mat);
  const standing = Math.random() < 0.5;
  tire.position.set(x, terrainHeight(x, z) + (standing ? 0.38 : 0.14), z);
  if (standing) tire.rotation.x = Math.PI / 2; else tire.rotation.set(Math.PI / 2, 0, Math.random() * Math.PI);
  tire.rotation.z += Math.random() * Math.PI;
  return tire;
}
export function makeBench(x, z) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x5a4a34, flatShading: true, roughness: 1 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.4), mat);
  seat.position.y = 0.42;
  g.add(seat);
  for (const sx of [-0.6, 0.6]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.36), mat);
    leg.position.set(sx, 0.21, 0);
    g.add(leg);
  }
  g.position.set(x, terrainHeight(x, z), z);
  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}
export function makeOutdoorTable(x, z) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x5a4a34, flatShading: true, roughness: 1 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.75), mat);
  top.position.y = 0.72;
  g.add(top);
  for (const [sx, sz] of [[-0.45, -0.28], [0.45, -0.28], [-0.45, 0.28], [0.45, 0.28]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.08), mat);
    leg.position.set(sx, 0.36, sz);
    g.add(leg);
  }
  for (const sx of [-0.75, 0.75]) {
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), mat);
    chair.position.set(sx, 0.25, 0);
    g.add(chair);
  }
  g.position.set(x, terrainHeight(x, z), z);
  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}
export function makeWaterTank(x, z) {
  const g = new THREE.Group();
  const legMat = new THREE.MeshStandardMaterial({ color: 0x3a3a38, flatShading: true, metalness: 0.4, roughness: 0.6 });
  const tankMat = new THREE.MeshStandardMaterial({ color: 0x4a6a5a, flatShading: true, roughness: 0.7 });
  const legH = 1.6;
  for (const [sx, sz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, legH, 5), legMat);
    leg.position.set(sx, legH / 2, sz);
    g.add(leg);
  }
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.3, 10), tankMat);
  tank.position.y = legH + 0.65;
  g.add(tank);
  g.position.set(x, terrainHeight(x, z), z);
  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}
export function makeGenerator(x, z) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x6b6a30, flatShading: true, roughness: 0.8, metalness: 0.2 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.55), mat);
  body.position.y = 0.4;
  g.add(body);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x2a2a28, flatShading: true }));
  tank.rotation.z = Math.PI / 2;
  tank.position.set(0.55, 0.55, 0);
  g.add(tank);
  g.position.set(x, terrainHeight(x, z), z);
  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}
export function makeAbandonedCar(x, z) {
  const g = new THREE.Group();
  const bodyColor = [0x6b3a30, 0x3a4a55, 0x5a5a4a, 0x4a3a3a][Math.floor(Math.random() * 4)];
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, flatShading: true, roughness: 0.9, metalness: 0.15 });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 4.2), bodyMat);
  chassis.position.y = 0.55;
  g.add(chassis);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.1), bodyMat);
  cabin.position.set(0, 1.05, -0.2);
  g.add(cabin);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a18, flatShading: true });
  for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 8), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.38, wz);
    g.add(wheel);
  }
  g.position.set(x, terrainHeight(x, z), z);
  g.rotation.y = Math.random() * Math.PI * 2 + (Math.random() < 0.3 ? (Math.random() - 0.5) * 0.5 : 0);
  return g;
}
export function makeFenceSegment(x, z, angle) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x5a4a34, flatShading: true, roughness: 1 });
  const broken = Math.random() < 0.35;
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.1, 5), mat);
  postL.position.set(-0.9, 0.55, 0);
  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.1, 5), mat);
  postR.position.set(0.9, 0.55, 0);
  if (broken) postR.rotation.z = (Math.random() - 0.5) * 0.9;
  g.add(postL, postR);
  const railCount = broken ? (Math.random() < 0.5 ? 1 : 2) : 2;
  for (let i = 0; i < railCount; i++) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.09, 0.04), mat);
    rail.position.set(0, 0.5 + i * 0.35, 0);
    if (broken) rail.rotation.z = (Math.random() - 0.5) * 0.25;
    g.add(rail);
  }
  g.position.set(x, terrainHeight(x, z), z);
  g.rotation.y = angle;
  return g;
}

// Espalhamento de props — chamado após buildings ser inicializado
export function spawnWorldProps(buildings) {
  for (const b of buildings) {
    const propCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < propCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = b.radius + 0.8 + Math.random() * 1.6;
      const px = b.x + Math.cos(angle) * dist, pz = b.z + Math.sin(angle) * dist;
      const roll = Math.random();
      const prop = roll < 0.4 ? makeBarrel(px, pz) : roll < 0.7 ? makeCrate(px, pz) : makePallet(px, pz);
      scene.add(prop);
    }
  }
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (villageRadius - 30);
    const x = villageCenter.x + Math.cos(angle) * dist, z = villageCenter.z + Math.sin(angle) * dist;
    scene.add(Math.random() < 0.5 ? makeBench(x, z) : makeOutdoorTable(x, z));
  }
  for (let i = 0; i < 4; i++) {
    const b = buildings[Math.floor(Math.random() * 9)];
    if (!b) continue;
    const angle = Math.random() * Math.PI * 2;
    const px = b.x + Math.cos(angle) * (b.radius + 1.5), pz = b.z + Math.sin(angle) * (b.radius + 1.5);
    scene.add(Math.random() < 0.5 ? makeWaterTank(px, pz) : makeGenerator(px, pz));
  }
  for (let i = 0; i < 22; i++) {
    const x = (Math.random() - 0.5) * WORLD_SIZE * 0.85;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 0.85;
    const rt = regionType(x, z);
    if (rt === 'road') continue;
    if (Math.hypot(x, z - 0) > 0 && (Math.abs(x) < roadHalfWidth + 12 || rt === 'village') && Math.random() < 0.7) {
      scene.add(makeTire(x, z));
    }
  }
  for (let i = 0; i < 5; i++) {
    const z = -WORLD_SIZE / 2 + 40 + i * (WORLD_SIZE / 5) + (Math.random() - 0.5) * 30;
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (roadHalfWidth + 2.2 + Math.random() * 2);
    scene.add(makeAbandonedCar(x, z));
  }
  const fenceGaps = new Set([2, 7, 13]);
  const fenceSegCount = 18;
  for (let i = 0; i < fenceSegCount; i++) {
    if (fenceGaps.has(i)) continue;
    const angle = (i / fenceSegCount) * Math.PI * 2;
    const x = villageCenter.x + Math.cos(angle) * (villageRadius + 4);
    const z = villageCenter.z + Math.sin(angle) * (villageRadius + 4);
    scene.add(makeFenceSegment(x, z, angle + Math.PI / 2));
  }
}
