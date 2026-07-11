// =================================================================
// PROPS — objetos ambientais decorativos (barris, caixas, carros, etc.)
// =================================================================
import { scene } from './scene.js';
import { terrainHeight, villageCenter, villageRadius, roadHalfWidth, regionType, WORLD_SIZE } from './world.js';

// --- UTILITÁRIOS ---
function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// =================================================================
// BARRIS ENFERRUJADOS com variedade visual
// =================================================================
export function makeBarrel(x, z) {
  const g = new THREE.Group();
  const variant = Math.floor(Math.random() * 4);
  // 0: enferrujado, 1: verde militar, 2: preto queimado, 3: azul industrial
  const colors = [0x6b3a20, 0x3a5a2a, 0x1a1816, 0x2a3a5a];
  const accents = [0x8a4a28, 0x4a7a3a, 0x2a2522, 0x3a4a7a];
  const mat = new THREE.MeshStandardMaterial({ color: colors[variant], flatShading: true, metalness: 0.35, roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.33, 0.88, 10), mat);
  body.position.y = 0.44;
  g.add(body);
  // Aro superior/inferior
  const rimMat = new THREE.MeshStandardMaterial({ color: accents[variant], flatShading: true, metalness: 0.5, roughness: 0.7 });
  for (const ry of [0.1, 0.77]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 4, 10), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = ry;
    g.add(rim);
  }
  // Tampa com detalhe
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 10), rimMat);
  lid.position.y = 0.9;
  g.add(lid);
  // Enferrujado tem manchas de oxidação
  if (variant === 0 && Math.random() < 0.6) {
    const rustSpot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 4, 4), new THREE.MeshStandardMaterial({ color: 0x9a5a1a, flatShading: true }));
    rustSpot.scale.set(1, 0.3, 1);
    rustSpot.position.set(rnd(-0.2, 0.2), rnd(0.3, 0.7), 0.34);
    g.add(rustSpot);
  }
  // Tombado ou de pé
  const tumbled = Math.random() < 0.2;
  g.position.set(x, terrainHeight(x, z) + (tumbled ? 0.35 : 0), z);
  if (tumbled) { g.rotation.z = Math.PI / 2 + rnd(-0.1, 0.1); g.rotation.y = rnd(0, Math.PI * 2); }
  else g.rotation.y = rnd(0, Math.PI * 2);
  return g;
}

// =================================================================
// CAIXAS DE MADEIRA / METAL
// =================================================================
export function makeCrate(x, z) {
  const g = new THREE.Group();
  const metal = Math.random() < 0.3;
  const mat = new THREE.MeshStandardMaterial({ color: metal ? 0x4a5a4a : 0x6b5636, flatShading: true, metalness: metal ? 0.4 : 0, roughness: 0.95 });
  const s = rnd(0.48, 0.75);
  const body = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), mat);
  body.position.y = s / 2 - 0.02; // leve enterramento para não flutuar no relevo
  g.add(body);
  // Ripas de madeira
  if (!metal) {
    const stripMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, flatShading: true });
    for (const axis of ['x', 'z']) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? s + 0.01 : 0.04, 0.04, axis === 'z' ? s + 0.01 : 0.04), stripMat);
      strip.position.y = s / 2;
      g.add(strip);
    }
  }
  g.position.set(x, terrainHeight(x, z), z);
  g.rotation.y = rnd(0, Math.PI * 2);
  return g;
}

// =================================================================
// PALLETS — empilhados ou caídos
// =================================================================
export function makePallet(x, z) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x7a6142, flatShading: true, roughness: 1 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x5a4530, flatShading: true, roughness: 1 });
  // Base do pallet com tábuas
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 1.1), mat);
  base.position.y = 0.04;
  g.add(base);
  for (let i = -1; i <= 1; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.05, 0.12), darkMat);
    plank.position.set(0, 0.10, i * 0.35);
    g.add(plank);
  }
  // Às vezes tem caixas ou barril em cima
  if (Math.random() < 0.45) {
    const stack = Math.floor(rnd(1, 3));
    for (let i = 0; i < stack; i++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(rnd(0.3, 0.5), rnd(0.28, 0.42), rnd(0.3, 0.45)), new THREE.MeshStandardMaterial({ color: pick([0x6b5636, 0x4a5a4a, 0x5a4030]), flatShading: true }));
      box.position.set(rnd(-0.25, 0.25), 0.14 + i * 0.38, rnd(-0.2, 0.2));
      box.rotation.y = rnd(0, Math.PI * 2);
      g.add(box);
    }
  }
  const fallen = Math.random() < 0.15;
  g.position.set(x, terrainHeight(x, z) + (fallen ? 0.48 : 0), z);
  if (fallen) g.rotation.z = Math.PI / 2;
  g.rotation.y = rnd(0, Math.PI * 2);
  return g;
}

// =================================================================
// PNEU
// =================================================================
export function makeTire(x, z) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x201f1d, flatShading: true, roughness: 0.9 });
  const tire = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.14, 6, 10), mat);
  const standing = Math.random() < 0.5;
  tire.position.set(x, terrainHeight(x, z) + (standing ? 0.38 : 0.10), z);
  if (standing) tire.rotation.x = Math.PI / 2;
  else tire.rotation.set(Math.PI / 2, 0, rnd(0, Math.PI));
  tire.rotation.z += rnd(0, Math.PI);
  return tire;
}

// =================================================================
// BANCO (abandonado, deitado ou de pé)
// =================================================================
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
  const fallen = Math.random() < 0.4;
  g.position.set(x, terrainHeight(x, z) + (fallen ? 0.2 : 0), z);
  if (fallen) g.rotation.z = Math.PI / 2 + rnd(-0.2, 0.2);
  g.rotation.y = rnd(0, Math.PI * 2);
  return g;
}

// =================================================================
// MESA EXTERNA
// =================================================================
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
  g.rotation.y = rnd(0, Math.PI * 2);
  return g;
}

// =================================================================
// CAIXA D'ÁGUA
// =================================================================
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
  g.rotation.y = rnd(0, Math.PI * 2);
  return g;
}

// =================================================================
// GERADOR
// =================================================================
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
  g.rotation.y = rnd(0, Math.PI * 2);
  return g;
}

// =================================================================
// CARROS DESTRUÍDOS — alta variedade visual
// =================================================================
const CAR_VARIANTS = [
  { name: 'sedan',   chassis: [1.9, 0.5, 4.2], cabin: [1.7, 0.55, 2.1], cabinZ: -0.2 },
  { name: 'pickup',  chassis: [2.0, 0.55, 4.6], cabin: [1.85, 0.6, 1.8], cabinZ: -0.8 },
  { name: 'suv',     chassis: [2.0, 0.6, 4.0], cabin: [1.9, 0.75, 2.6], cabinZ: 0.0 },
  { name: 'van',     chassis: [2.1, 0.65, 4.8], cabin: [2.0, 0.85, 3.4], cabinZ: 0.2 },
  { name: 'compact', chassis: [1.7, 0.45, 3.6], cabin: [1.6, 0.5, 1.9], cabinZ: -0.1 },
];
const CAR_BODY_COLORS = [
  0x6b3a20, 0x3a4a55, 0x5a5a4a, 0x4a3a3a, 0x2a3a2a,
  0x7a6a50, 0x4a2a2a, 0x5a5060, 0x3a4a3a, 0x6a5a3a,
];

export function makeAbandonedCar(x, z) {
  const g = new THREE.Group();
  const variant = pick(CAR_VARIANTS);
  const bodyColor = pick(CAR_BODY_COLORS);
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, flatShading: true, roughness: 0.92, metalness: 0.18 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a18, flatShading: true });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(...variant.chassis), bodyMat);
  chassis.position.y = 0.55;
  g.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(...variant.cabin), bodyMat);
  cabin.position.set(0, 0.55 + variant.chassis[1] / 2 + variant.cabin[1] / 2 - 0.05, variant.cabinZ);
  g.add(cabin);

  // Janelas (vidros quebrados ou ausentes)
  const hasGlass = Math.random() < 0.5;
  if (hasGlass) {
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x7aabaa, flatShading: true, transparent: true, opacity: 0.55, roughness: 0.2 });
    const wW = variant.cabin[0] * 0.7, wH = variant.cabin[1] * 0.55;
    for (const fz of [variant.cabin[2] / 2 + 0.01, -(variant.cabin[2] / 2 + 0.01)]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(wW, wH), glassMat);
      win.position.set(0, cabin.position.y + 0.05, fz);
      if (fz < 0) win.rotation.y = Math.PI;
      g.add(win);
    }
  }

  // Rodas — algumas podem estar faltando (flat/missing)
  for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const missingWheel = Math.random() < 0.2;
    if (!missingWheel) {
      const flatTire = Math.random() < 0.35;
      const wheelR = flatTire ? 0.28 : 0.38;
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(wheelR, wheelR, 0.3, 8), darkMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, flatTire ? 0.22 : 0.38, wz);
      g.add(wheel);
      if (flatTire) {
        const flatDeform = new THREE.Mesh(new THREE.CylinderGeometry(wheelR + 0.08, wheelR + 0.04, 0.1, 8), darkMat);
        flatDeform.position.set(wx, 0.1, wz);
        g.add(flatDeform);
      }
    }
  }

  // Ferrugem / dano — marcas de oxidação no capô ou portas
  const rustPatches = Math.floor(rnd(1, 4));
  const rustMat = new THREE.MeshStandardMaterial({ color: 0x8a4218, flatShading: true, roughness: 1 });
  for (let i = 0; i < rustPatches; i++) {
    const patch = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.12, 0.3), 4, 3), rustMat);
    patch.scale.set(1, 0.15, 1);
    const side = pick([-1, 1]);
    patch.position.set(side * rnd(0.3, 0.9), rnd(0.6, 1.1), rnd(-1.8, 1.8));
    g.add(patch);
  }

  // Detalhes: para-choque caído, capô aberto
  if (Math.random() < 0.4) {
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(variant.chassis[0] * 0.9, 0.12, 0.25), new THREE.MeshStandardMaterial({ color: 0x2a2a28, flatShading: true }));
    const bSide = Math.random() < 0.5;
    bumper.position.set(rnd(-0.3, 0.3), 0.25, bSide ? variant.chassis[2] / 2 + 0.5 : -(variant.chassis[2] / 2 + 0.5));
    bumper.rotation.x = rnd(-0.5, 0.5);
    g.add(bumper);
  }
  if (Math.random() < 0.3) {
    const hood = new THREE.Mesh(new THREE.BoxGeometry(variant.chassis[0] * 0.85, 0.06, variant.chassis[2] * 0.32), bodyMat);
    hood.position.set(0, 0.82, variant.chassis[2] / 2 - 0.3);
    hood.rotation.x = rnd(0.4, 0.8); // capô aberto
    g.add(hood);
  }

  g.position.set(x, terrainHeight(x, z), z);
  // Ângulos variados: alguns na estrada, alguns batidos/tombados
  const crashed = Math.random() < 0.2;
  g.rotation.y = rnd(0, Math.PI * 2);
  if (crashed) g.rotation.z = rnd(0.04, 0.12) * (Math.random() < 0.5 ? 1 : -1);
  return g;
}

// =================================================================
// CERCA — quebrada, tombada ou de pé
// =================================================================
export function makeFenceSegment(x, z, angle) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x5a4a34, flatShading: true, roughness: 1 });
  const broken = Math.random() < 0.55;
  const tumbled = broken && Math.random() < 0.4;
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.1, 5), mat);
  postL.position.set(-0.9, 0.55, 0);
  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.1, 5), mat);
  postR.position.set(0.9, 0.55, 0);
  if (broken && !tumbled) postR.rotation.z = rnd(-0.6, 0.6);
  g.add(postL, postR);
  const railCount = broken ? (Math.random() < 0.5 ? 1 : 2) : 2;
  for (let i = 0; i < railCount; i++) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.09, 0.04), mat);
    rail.position.set(0, 0.5 + i * 0.35, 0);
    if (broken) rail.rotation.z = rnd(-0.2, 0.2);
    g.add(rail);
  }
  g.position.set(x, terrainHeight(x, z), z);
  g.rotation.y = angle;
  if (tumbled) g.rotation.x = Math.PI / 2 + rnd(-0.15, 0.15);
  return g;
}

// =================================================================
// CARRINHO DE SUPERMERCADO
// =================================================================
export function makeShoppingCart(x, z) {
  const g = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x8a9a9a, flatShading: true, metalness: 0.5, roughness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2a28, flatShading: true });
  // Corpo (grade)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.48, 0.9), new THREE.MeshStandardMaterial({ color: 0x7a8a8a, wireframe: true }));
  body.position.y = 0.9;
  g.add(body);
  // Estrutura sólida lateral
  for (const sx of [-0.29, 0.29]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.92), metalMat);
    side.position.set(sx, 0.9, 0);
    g.add(side);
  }
  // Cabo
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.05), metalMat);
  handle.position.set(0, 1.18, -0.48);
  g.add(handle);
  // Rodas
  for (const [wx, wz] of [[-0.22, 0.38], [0.22, 0.38], [-0.22, -0.38], [0.22, -0.38]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 6), darkMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, 0.62, wz);
    g.add(wheel);
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 4), metalMat);
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, 0.62, wz);
    g.add(axle);
  }
  // Tombado?
  const fallen = Math.random() < 0.45;
  g.position.set(x, terrainHeight(x, z) + (fallen ? 0.22 : 0), z);
  if (fallen) { g.rotation.z = Math.PI / 2 + rnd(-0.1, 0.1); g.rotation.y = rnd(0, Math.PI * 2); }
  else g.rotation.y = rnd(0, Math.PI * 2);
  return g;
}

// =================================================================
// BICICLETA
// =================================================================
export function makeBicycle(x, z) {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: pick([0x3a3a7a, 0x7a3a3a, 0x2a2a2a, 0x4a7a4a, 0x8a7a3a]), flatShading: true, metalness: 0.4, roughness: 0.7 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a18, flatShading: true });
  // Rodas
  for (const wz of [-0.5, 0.5]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 5, 10), darkMat);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(0, 0.32, wz);
    g.add(wheel);
    // Raios
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 4), frameMat);
    spoke.position.set(0, 0.32, wz);
    spoke.rotation.z = Math.PI / 2;
    g.add(spoke);
  }
  // Quadro
  const frameBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 5), frameMat);
  frameBar.rotation.x = Math.PI / 2;
  frameBar.position.set(0, 0.55, 0);
  g.add(frameBar);
  const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 5), frameMat);
  topTube.rotation.x = Math.PI / 2;
  topTube.position.set(0, 0.78, 0);
  g.add(topTube);
  // Guidão
  const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.04), frameMat);
  handlebar.position.set(0, 0.92, 0.48);
  g.add(handlebar);
  // Selim
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.1), frameMat);
  seat.position.set(0, 0.88, -0.3);
  g.add(seat);

  const fallen = Math.random() < 0.6;
  g.position.set(x, terrainHeight(x, z) + (fallen ? 0.12 : 0), z);
  g.rotation.y = rnd(0, Math.PI * 2);
  if (fallen) g.rotation.z = rnd(0.2, 0.5) * (Math.random() < 0.5 ? 1 : -1);
  return g;
}

// =================================================================
// MÓVEIS JOGADOS (sofá, geladeira, cadeira)
// =================================================================
export function makeFurniture(x, z) {
  const type = Math.floor(rnd(0, 3));
  const g = new THREE.Group();
  if (type === 0) {
    // Sofá
    const fabMat = new THREE.MeshStandardMaterial({ color: pick([0x6a5a4a, 0x4a5a6a, 0x5a4a5a, 0x7a6a5a]), flatShading: true, roughness: 1 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.38, 0.75), fabMat);
    base.position.y = 0.35;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.48, 0.18), fabMat);
    back.position.set(0, 0.72, -0.28);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.75), fabMat);
    armL.position.set(-0.72, 0.63, 0);
    const armR = armL.clone();
    armR.position.x = 0.72;
    g.add(base, back, armL, armR);
  } else if (type === 1) {
    // Geladeira tombada
    const fridgeMat = new THREE.MeshStandardMaterial({ color: pick([0xc0bfba, 0x9aadaa, 0x8a8a8a]), flatShading: true, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.65, 0.65), fridgeMat);
    body.position.y = 0.83;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.6, 0.06), new THREE.MeshStandardMaterial({ color: 0xb0b0a8, flatShading: true }));
    door.position.set(0, 0.82, 0.36);
    g.add(body, door);
  } else {
    // Cadeira/poltrona
    const mat = new THREE.MeshStandardMaterial({ color: pick([0x6a5030, 0x4a4a5a, 0x7a6a50]), flatShading: true, roughness: 1 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.5), mat);
    seat.position.y = 0.48;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.08), mat);
    back.position.set(0, 0.78, -0.22);
    for (const [lx, lz] of [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.48, 4), mat);
      leg.position.set(lx, 0.24, lz);
      g.add(leg);
    }
    g.add(seat, back);
  }
  const fallen = Math.random() < 0.55;
  g.position.set(x, terrainHeight(x, z) + (fallen ? 0.18 : 0), z);
  g.rotation.y = rnd(0, Math.PI * 2);
  if (fallen) g.rotation.z = rnd(0.3, 1.2) * (Math.random() < 0.5 ? 1 : -1);
  return g;
}

// =================================================================
// CENA DE FUGA — agrupamento narrativo
// =================================================================
function spawnFlightScene(cx, cz) {
  // Um carro destruído como ponto focal
  const car = makeAbandonedCar(cx, cz);
  scene.add(car);
  // Ao redor: malas, caixas, roupas espalhadas
  const itemCount = 3 + Math.floor(rnd(0, 4));
  for (let i = 0; i < itemCount; i++) {
    const angle = rnd(0, Math.PI * 2);
    const dist = rnd(1.5, 4.5);
    const px = cx + Math.cos(angle) * dist;
    const pz = cz + Math.sin(angle) * dist;
    const roll = Math.random();
    let prop;
    if (roll < 0.30) prop = makeBarrel(px, pz);
    else if (roll < 0.55) prop = makeCrate(px, pz);
    else if (roll < 0.72) prop = makePallet(px, pz);
    else prop = makeFurniture(px, pz);
    scene.add(prop);
  }
  // Pneus soltos
  const tireCount = Math.floor(rnd(1, 3));
  for (let i = 0; i < tireCount; i++) {
    const angle = rnd(0, Math.PI * 2);
    scene.add(makeTire(cx + Math.cos(angle) * rnd(2, 6), cz + Math.sin(angle) * rnd(2, 6)));
  }
}

// =================================================================
// CENA DE BLOQUEIO DE ESTRADA
// =================================================================
function spawnRoadblock(cx, cz) {
  // 2-3 carros enfileirados bloqueando a estrada
  const carCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < carCount; i++) {
    const offsetX = (i - 1) * rnd(2.2, 3.0) + rnd(-0.5, 0.5);
    const c = makeAbandonedCar(cx + offsetX, cz + rnd(-0.5, 0.5));
    scene.add(c);
  }
  // Barris como barricada
  const barrelCount = 3 + Math.floor(rnd(0, 4));
  for (let i = 0; i < barrelCount; i++) {
    const bx = cx + rnd(-3, 3);
    const bz = cz + rnd(-1.5, 1.5);
    scene.add(makeBarrel(bx, bz));
  }
  // Bicicleta largada na cena — chance reduzida
  if (Math.random() < 0.35) scene.add(makeBicycle(cx + rnd(-3, 3), cz + rnd(-2, 2)));
}

// =================================================================
// ESPALHAMENTO GERAL DE PROPS — chamado após buildings ser inicializado
// =================================================================
export function spawnWorldProps(buildings) {
  // Cenas narrativas de fuga ao longo da estrada — mínimo 80u do spawn (z=0)
  const flightSceneCount = 3;
  for (let i = 0; i < flightSceneCount; i++) {
    const z = 80 + i * (WORLD_SIZE / 4) + rnd(-15, 15);
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (roadHalfWidth + rnd(3, 7));
    spawnFlightScene(x, z);
  }
  // Bloqueios de estrada — também longe do spawn
  const roadblockCount = 2;
  for (let i = 0; i < roadblockCount; i++) {
    const z = 150 + i * (WORLD_SIZE / 3) + rnd(-20, 20);
    spawnRoadblock(0, z);
  }

  // Props ao redor de buildings — máximo 2 por prédio, sem carrinhos de super
  for (const b of buildings) {
    const propCount = 1 + Math.floor(rnd(0, 2)); // era 2–5, agora 1–2
    for (let i = 0; i < propCount; i++) {
      const angle = rnd(0, Math.PI * 2);
      const dist = b.radius + 0.8 + rnd(0, 1.5);
      const px = b.x + Math.cos(angle) * dist;
      const pz = b.z + Math.sin(angle) * dist;
      const roll = Math.random();
      let prop;
      // Sem carrinhos de supermercado nos prédios; só itens que fazem sentido
      if (roll < 0.30) prop = makeBarrel(px, pz);
      else if (roll < 0.52) prop = makeCrate(px, pz);
      else if (roll < 0.66) prop = makePallet(px, pz);
      else if (roll < 0.78) prop = makeTire(px, pz);
      else if (roll < 0.88) prop = makeFurniture(px, pz);
      else prop = makeBicycle(px, pz); // no máx 1 bicicleta por prédio via chance
      scene.add(prop);
    }
    // Cercas tombadas — só em ~30% dos prédios, max 2 segmentos
    if (Math.random() < 0.30) {
      const fenceCount = 1 + Math.floor(rnd(0, 2));
      for (let i = 0; i < fenceCount; i++) {
        const fa = rnd(0, Math.PI * 2);
        const fd = b.radius + rnd(0.5, 1.5);
        scene.add(makeFenceSegment(b.x + Math.cos(fa) * fd, b.z + Math.sin(fa) * fd, fa + Math.PI / 2));
      }
    }
  }

  // Móveis e utensílios espalhados na vila — reduzido para 3
  for (let i = 0; i < 3; i++) {
    const angle = rnd(0, Math.PI * 2);
    const dist = rnd(6, villageRadius - 12);
    const x = villageCenter.x + Math.cos(angle) * dist;
    const z = villageCenter.z + Math.sin(angle) * dist;
    const roll = Math.random();
    scene.add(roll < 0.5 ? makeBench(x, z) : makeOutdoorTable(x, z));
  }

  // Bicicletas — apenas 2 em toda a vila (era 5)
  for (let i = 0; i < 2; i++) {
    const angle = rnd(0, Math.PI * 2);
    const dist = rnd(8, villageRadius - 10);
    scene.add(makeBicycle(
      villageCenter.x + Math.cos(angle) * dist,
      villageCenter.z + Math.sin(angle) * dist
    ));
  }

  // Infraestrutura: 1 caixa d'água e 1 gerador (era 4 objetos)
  for (let i = 0; i < 2; i++) {
    const b = buildings[Math.floor(rnd(0, Math.min(9, buildings.length)))];
    if (!b) continue;
    const angle = rnd(0, Math.PI * 2);
    const px = b.x + Math.cos(angle) * (b.radius + 1.5);
    const pz = b.z + Math.sin(angle) * (b.radius + 1.5);
    scene.add(i === 0 ? makeWaterTank(px, pz) : makeGenerator(px, pz));
  }

  // Pneus espalhados pelo mundo — reduzido de 30 para 12
  for (let i = 0; i < 12; i++) {
    const x = (Math.random() - 0.5) * WORLD_SIZE * 0.85;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 0.85;
    const rt = regionType(x, z);
    if (rt === 'road') continue;
    scene.add(makeTire(x, z));
  }

  // Cerca ao redor da vila
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