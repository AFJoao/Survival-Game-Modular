// =================================================================
// ZUMBIS — GLB polyart pack + pool + IA com LOD
// =================================================================
import { EventBus, ObjectPool } from './core.js';
import { scene } from './scene.js';
import { terrainHeight, WORLD_SIZE, regionType, villageCenter, villageRadius, roadHalfWidth } from './world.js';
import { AudioFX } from './audio.js';
import { Survival } from './survival.js';
import { Inventory } from './inventory.js';
import { resolveCollisions } from './physics.js';
import { registerDamageZombie, setZombiePool } from './combat.js';

// =================================================================
// CARREGADOR GLB
// =================================================================

// Cada variante corresponde ao nó rig_CharRoot* que contém mesh + skeleton.
// Os nós lpFemale/lpMale_zombie_* são grupos-pai vazios sem geometria.
const RIG_ROOT_NAMES = [
  'rig_CharRoot',    // lpFemale_zombie_A
  'rig_CharRoot001', // lpFemale_zombie_B
  'rig_CharRoot002', // lpFemale_zombie_C
  'rig_CharRoot003', // lpFemale_zombie_D
  'rig_CharRoot004', // lpFemale_zombie_E
  'rig_CharRoot005', // lpMale_zombie_A
  'rig_CharRoot006', // lpMale_zombie_B
  'rig_CharRoot007', // lpMale_zombie_C
  'rig_CharRoot008', // lpMale_zombie_D
  'rig_CharRoot009', // lpMale_zombie_E
];

let variantRoots = [];  // Object3D de cada rig (original, fica fora da cena)
let variantClips = [];  // AnimationClip filtrado por rig
let glbReady = false;

export const glbLoaded = new Promise((resolve) => {
  const loader = new THREE.GLTFLoader();
  loader.load(
    'polyart_zombies_with_animations_free_pack.glb',
    (gltf) => {
      // O pack exportado em cm — escala global 0.01 para converter para metros
      const SCALE = 0.01;

      for (const rigName of RIG_ROOT_NAMES) {
        const rigNode = findByName(gltf.scene, rigName);
        if (!rigNode) {
          console.warn(`[GLB] rig não encontrado: ${rigName}`);
          variantRoots.push(null);
          variantClips.push(null);
          continue;
        }

        // Coleta nomes de todos os nós deste rig para filtrar tracks
        const rigNodeNames = new Set();
        rigNode.traverse((n) => rigNodeNames.add(n.name));

        // Filtra o clipe para este rig (cada rig tem seus próprios bone names únicos)
        const srcClip = gltf.animations[0];
        const filteredTracks = srcClip.tracks.filter((t) => {
          const nodeName = t.name.slice(0, t.name.indexOf('.'));
          return rigNodeNames.has(nodeName);
        });
        const clip = new THREE.AnimationClip(rigName, srcClip.duration, filteredTracks);

        // Retira o rig da cena original para usá-lo como template de clone
        // (SkeletonUtils.clone precisa do objeto mas não precisa estar na cena)
        rigNode.parent?.remove(rigNode);

        // Aplica escala corretiva — o pack foi exportado em centímetros
        rigNode.scale.setScalar(SCALE);
        // Zera position herdada do exportador (cada rig estava deslocado na cena)
        rigNode.position.set(0, 0, 0);
        rigNode.updateMatrixWorld(true);

        variantRoots.push(rigNode);
        variantClips.push(clip);
      }

      glbReady = true;
      console.log(`[GLB] pack carregado: ${variantRoots.filter(Boolean).length} variantes`);
      resolve();
    },
    undefined,
    (err) => {
      console.error('[GLB] falha ao carregar:', err);
      resolve();
    }
  );
});

function findByName(root, name) {
  if (root.name === name) return root;
  for (const child of root.children) {
    const r = findByName(child, name);
    if (r) return r;
  }
  return null;
}

// =================================================================
// CLONE — cria instância independente de uma variante
// =================================================================

function cloneVariant(variantIndex) {
  const src = variantRoots[variantIndex];
  if (!src) return makeFallbackMesh();

  const clone = THREE.SkeletonUtils.clone(src);

  // Clona materiais para controle individual de emissive
  const skinnedMeshes = [];
  clone.traverse((n) => {
    if (n.isSkinnedMesh) {
      n.material = n.material.clone();
      n.castShadow = true;
      skinnedMeshes.push(n);
    }
  });

  // O rig_CharRoot tem rotation [-0.7071,0,0,0.7071] = -90 graus no X
  // (conversão Z-up->Y-up feita pelo Sketchfab). Essa rotação precisa ser
  // preservada no clone. Para controlar apenas o yaw (Y) por fora sem
  // sobrescrever a rotação interna, envolvemos o clone num pivot group.
  const pivot = new THREE.Group();
  pivot.add(clone);
  pivot.userData.skinnedMeshes = skinnedMeshes;
  return pivot;
}

// Fallback procedural (caso o GLB falhe)
function makeFallbackMesh() {
  const group = new THREE.Group();
  const mat     = new THREE.MeshStandardMaterial({ color: 0x4a6b3a, flatShading: true });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x6b7a5a, flatShading: true });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 1.0, 6), mat);
  body.position.y = 1.1; group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), skinMat);
  head.position.y = 1.85; group.add(head);
  const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.75, 5);
  const armL = new THREE.Mesh(armGeo.clone(), skinMat);
  armL.position.set(-0.5, 1.15, 0); armL.geometry.translate(0, -0.37, 0); group.add(armL);
  const armR = armL.clone(); armR.position.x = 0.5; group.add(armR);
  const legGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.85, 5);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2b2b3a, flatShading: true });
  const legL = new THREE.Mesh(legGeo.clone(), legMat);
  legL.position.set(-0.18, 0.6, 0); legL.geometry.translate(0, -0.42, 0); group.add(legL);
  const legR = legL.clone(); legR.position.x = 0.18; group.add(legR);
  group.userData.limbs = { armL, armR, legL, legR };
  group.userData.body  = body;
  group.userData.isFallback = true;
  return group;
}

// =================================================================
// POOL
// =================================================================

export const zombiePool = new ObjectPool(
  () => {
    // factory — chamada sempre após glbReady (Spawn bloqueia antes)
    const variantIndex = Math.floor(Math.random() * RIG_ROOT_NAMES.length);
    const pivot = cloneVariant(variantIndex); // pivot > clone(rig)
    pivot.visible = false;
    scene.add(pivot);

    let mixer = null, action = null;
    if (!pivot.userData.isFallback) {
      // O AnimationMixer precisa apontar para o clone interno (filho do pivot)
      // que contém os bones — não para o pivot em si.
      const rigClone = pivot.children[0];
      mixer = new THREE.AnimationMixer(rigClone);
      const clip = variantClips[variantIndex];
      if (clip) {
        action = mixer.clipAction(clip);
        action.time = Math.random() * clip.duration;
        action.play();
      }
    }

    return { mesh: pivot, mixer, action, walkTime: Math.random() * 10, variantIndex };
  },

  (obj, x, z) => {
    obj.x = x; obj.z = z; obj.yaw = Math.random() * Math.PI * 2;
    obj.speedWander = 1.1; obj.speedChase = 3.4;
    obj.sightRadius = 14; obj.hearingRadius = 22; obj.attackRadius = 1.4;
    obj.hp = 3; obj.hitCooldown = 0; obj.hitFlash = 0;
    obj.state = 'wander'; obj.alertUntil = 0;
    obj.patrolRoute = pickPatrolRoute(x, z);
    obj.patrolIndex = 0; obj.patrolPauseTimer = 0;
    obj.groanTimer = 1 + Math.random() * 4;

    // Reseta rotação do pivot (pode ter ficado na posição de tombamento)
    obj.mesh.rotation.set(0, obj.yaw, 0);

    obj.mesh.position.set(x, terrainHeight(x, z), z);
    obj.mesh.visible = true;
    setEmissive(obj.mesh, 0x000000);
    if (obj.action) {
      // Reset completo: para, reposiciona em frame aleatório e reinicia
      obj.action.stop();
      obj.action.reset();
      obj.action.time = Math.random() * (variantClips[obj.variantIndex]?.duration ?? 7.3);
      obj.action.paused = false;
      obj.mixer.timeScale = 0.75;
      obj.action.play();
    }
  }
);

setZombiePool(zombiePool);

function setEmissive(meshGroup, hex) {
  if (meshGroup.userData.isFallback) {
    meshGroup.userData.body?.material.emissive.setHex(hex);
    return;
  }
  for (const m of (meshGroup.userData.skinnedMeshes ?? [])) {
    if (m.material?.emissive) m.material.emissive.setHex(hex);
  }
}

// =================================================================
// DANO
// =================================================================

function damageZombie(zb, amount) {
  zb.hp -= amount; zb.hitFlash = 0.15;
  AudioFX.zombieHit();
  if (zb.hp <= 0) killZombie(zb);
}
registerDamageZombie(damageZombie);

function killZombie(zb) {
  zb.state = 'dead';
  if (zb.action) zb.action.stop();
  EventBus.emit('zombie:died', zb);
  EventBus.emit('zombie:topple', { mesh: zb.mesh, yaw: zb.yaw, onSettled: () => {
    setTimeout(() => zombiePool.release(zb), 4000);
  }});
  if (Math.random() < 0.45) Inventory.add('food', 1);
}

function pickPatrolRoute(x, z) {
  const count = 3 + Math.floor(Math.random() * 2);
  const route = [];
  const baseAngle = Math.random() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist  = 6 + Math.random() * 10;
    route.push({ x: x + Math.cos(angle) * dist, z: z + Math.sin(angle) * dist });
  }
  return route;
}

// =================================================================
// IA
// =================================================================

const NEAR_RADIUS = 26;

export function updateZombies(dt, playerX, playerZ, dayIsBloodMoon, flashDamageFn, registerDamageDirectionFn) {
  for (const zb of zombiePool.active) {
    const dist = Math.hypot(playerX - zb.x, playerZ - zb.z);
    updateZombieAI(zb, dt, dist < NEAR_RADIUS, playerX, playerZ, dayIsBloodMoon, flashDamageFn, registerDamageDirectionFn);
  }
}

function updateZombieAI(zb, dt, fullDetail, playerX, playerZ, dayIsBloodMoon, flashDamageFn, registerDamageDirFn) {
  if (zb.state === 'dead') return;

  const distToPlayer = Math.hypot(playerX - zb.x, playerZ - zb.z);
  const alerted = zb.alertUntil > performance.now() / 1000;
  const canSense = distToPlayer < zb.sightRadius || alerted;
  zb.state = canSense ? 'chase' : 'wander';

  let targetX, targetZ, speed;
  if (zb.state === 'chase') {
    targetX = playerX; targetZ = playerZ; speed = zb.speedChase;
  } else if (zb.patrolPauseTimer > 0) {
    zb.patrolPauseTimer -= dt; targetX = zb.x; targetZ = zb.z; speed = 0;
  } else {
    const wp = zb.patrolRoute[zb.patrolIndex];
    if (Math.hypot(wp.x - zb.x, wp.z - zb.z) < 1.5) {
      zb.patrolIndex = (zb.patrolIndex + 1) % zb.patrolRoute.length;
      zb.patrolPauseTimer = 1.2 + Math.random() * 2.5;
    }
    const cur = zb.patrolRoute[zb.patrolIndex];
    targetX = cur.x; targetZ = cur.z; speed = zb.speedWander;
  }

  const dx = targetX - zb.x, dz = targetZ - zb.z;
  const distToTarget = Math.hypot(dx, dz);
  if (distToTarget > 0.05) {
    zb.yaw = Math.atan2(dx, dz);
    zb.x += (dx / distToTarget) * speed * dt;
    zb.z += (dz / distToTarget) * speed * dt;
  }

  if (fullDetail) {
    const pos = { x: zb.x, z: zb.z };
    resolveCollisions(pos, 0.42, false, [], []);
    zb.x = pos.x; zb.z = pos.z;
  }

  zb.mesh.position.set(zb.x, terrainHeight(zb.x, zb.z), zb.z);
  zb.mesh.rotation.y = zb.yaw;

  // Animação — pausa quando parado para evitar slide sem movimento
  if (zb.mixer && zb.action) {
    if (speed === 0) {
      // Zumbi parado: pausa a animação
      if (zb.action.isRunning()) zb.action.paused = true;
    } else {
      // Zumbi em movimento: retoma e ajusta velocidade
      zb.action.paused = false;
      zb.mixer.timeScale = zb.state === 'chase' ? 1.0 : 0.75;
    }
    zb.mixer.update(dt);
  } else if (zb.mesh.userData.isFallback && fullDetail) {
    zb.walkTime += dt * (zb.state === 'chase' ? 10 : 6);
    const swing = Math.sin(zb.walkTime) * 0.6;
    const l = zb.mesh.userData.limbs;
    if (l) { l.legL.rotation.x = swing; l.legR.rotation.x = -swing; l.armL.rotation.x = -swing; l.armR.rotation.x = swing; }
  }

  if (zb.hitCooldown > 0) zb.hitCooldown -= dt;
  if (distToPlayer < zb.attackRadius && zb.hitCooldown <= 0) {
    zb.hitCooldown = 1.2;
    Survival.damage(15);
    if (flashDamageFn) flashDamageFn();
    if (registerDamageDirFn) registerDamageDirFn(zb.x, zb.z);
    AudioFX.playerHurt();
  }

  if (zb.hitFlash > 0) zb.hitFlash -= dt;
  setEmissive(zb.mesh, zb.hitFlash > 0 ? 0xffffff : (dayIsBloodMoon ? 0x8a1010 : 0x000000));

  if (fullDetail) {
    zb.groanTimer -= dt;
    if (zb.groanTimer <= 0) {
      zb.groanTimer = zb.state === 'chase' ? (3 + Math.random() * 3) : (6 + Math.random() * 6);
      if (distToPlayer < 22) AudioFX.zombieGroan(distToPlayer);
    }
  }
}

// =================================================================
// SPAWN MANAGER
// =================================================================

const ZOMBIE_CAP = 80;
const CLEAN_RADIUS     = 35;   // mínimo do player
const SPAWN_RADIUS_MAX = 90;   // máximo do player

// Densidade por zona (probabilidade relativa de spawnar nela)
// Estrada/vila têm muito mais zumbis que floresta
const ZONE_WEIGHTS = { village: 4, road: 3, forest: 1 };

// Quanto da área de spawn cobre estrada/vila — biased
const ROAD_SPAWN_WIDTH  = roadHalfWidth * 3.5;  // spawna mais perto da estrada
const VILLAGE_SPAWN_BIAS = villageRadius * 1.5;  // inclui periferia da vila

const SPAWN_INTERVAL_DAY   = 7;
const SPAWN_INTERVAL_NIGHT = 3;
const SPAWN_INTERVAL_BLOOD = 1.2;
const BATCH_DAY   = [1, 3];   // dia: poucos por vez
const BATCH_NIGHT = [3, 6];
const BATCH_BLOOD = [5, 9];

function randBetween(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

// Retorna o peso de spawn de uma posição baseado na zona
function zoneSpawnWeight(x, z) {
  const region = regionType(x, z);
  // Também considera proximidade da estrada/vila para zonas vizinhas
  const distVillage = Math.hypot(x - villageCenter.x, z - villageCenter.z);
  const distRoad = Math.abs(x);
  if (distVillage < VILLAGE_SPAWN_BIAS) return ZONE_WEIGHTS.village;
  if (distRoad < ROAD_SPAWN_WIDTH)      return ZONE_WEIGHTS.road;
  return ZONE_WEIGHTS.forest;
}

// Chance de aceitar uma posição baseado no peso da zona
function acceptByZone(x, z) {
  const w = zoneSpawnWeight(x, z);
  // Normalizar: floresta=1/4, estrada=3/4, vila=4/4
  return Math.random() < (w / ZONE_WEIGHTS.village);
}

function pickSpawnPos(playerX, playerZ, preferZone = null) {
  for (let attempt = 0; attempt < 20; attempt++) {
    let sx, sz;

    // A cada tentativa, sorteamos baseado na zona preferida ou aleatória
    if (preferZone === 'village' && Math.random() < 0.7) {
      // Spawn dentro/em volta da vila
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.random() * VILLAGE_SPAWN_BIAS;
      sx = villageCenter.x + Math.cos(angle) * dist;
      sz = villageCenter.z + Math.sin(angle) * dist;
    } else if (preferZone === 'road' && Math.random() < 0.7) {
      // Spawn ao longo da estrada
      sx = (Math.random() - 0.5) * ROAD_SPAWN_WIDTH * 2;
      sz = playerZ + (Math.random() - 0.5) * SPAWN_RADIUS_MAX * 2;
    } else {
      // Spawn aleatório em anel ao redor do player
      const angle = Math.random() * Math.PI * 2;
      const dist  = CLEAN_RADIUS + Math.random() * (SPAWN_RADIUS_MAX - CLEAN_RADIUS);
      sx = playerX + Math.cos(angle) * dist;
      sz = playerZ + Math.sin(angle) * dist;
    }

    // Deve estar dentro do mundo e longe do player
    const half = WORLD_SIZE / 2 - 5;
    if (Math.abs(sx) > half || Math.abs(sz) > half) continue;
    const distPlayer = Math.hypot(playerX - sx, playerZ - sz);
    if (distPlayer < CLEAN_RADIUS || distPlayer > SPAWN_RADIUS_MAX * 1.4) continue;

    // Rejeita se muito perto de outro zumbi
    let tooClose = false;
    for (const zb of zombiePool.active) {
      if (Math.hypot(zb.x - sx, zb.z - sz) < 2.5) { tooClose = true; break; }
    }
    if (tooClose) continue;

    return { x: sx, z: sz };
  }
  return null;
}

// Distribui zumbis iniciais por zonas com densidades corretas
function spawnInitialZombies(playerX, playerZ) {
  const totalTarget = 40;
  // Vila: ~45%, Estrada: ~35%, Floresta: ~20%
  const byZone = [
    { zone: 'village', count: Math.round(totalTarget * 0.45) },
    { zone: 'road',    count: Math.round(totalTarget * 0.35) },
    { zone: 'forest',  count: Math.round(totalTarget * 0.20) },
  ];

  for (const { zone, count } of byZone) {
    let spawned = 0;
    for (let i = 0; i < count * 4 && spawned < count; i++) {
      const pos = pickSpawnPos(playerX, playerZ, zone);
      if (pos) { zombiePool.acquire(pos.x, pos.z); spawned++; }
    }
  }
}

export const Spawn = {
  timer: 0,
  initialized: false,
  // Controla área já limpa e quando pode repovoar (chave = chunk key)
  clearedZones: new Map(),

  init(playerX, playerZ) {
    spawnInitialZombies(playerX, playerZ);
    this.initialized = true;
  },

  update(dt, playerX, playerZ, isNight, isBloodMoon) {
    if (!glbReady) return;
    if (!this.initialized) { this.init(playerX, playerZ); return; }

    const interval = isBloodMoon ? SPAWN_INTERVAL_BLOOD
                   : isNight     ? SPAWN_INTERVAL_NIGHT
                   :               SPAWN_INTERVAL_DAY;
    this.timer += dt;
    if (this.timer < interval || zombiePool.activeCount >= ZOMBIE_CAP) return;
    this.timer = 0;

    const [bMin, bMax] = isBloodMoon ? BATCH_BLOOD : isNight ? BATCH_NIGHT : BATCH_DAY;
    const count = randBetween(bMin, bMax);

    // Decide zona de spawn baseada na zona atual do player e aleatoriedade
    const playerRegion = regionType(playerX, playerZ);
    const zoneChoices = ['village', 'road', 'forest'];
    // Pesa mais para vila/estrada
    const zoneWeightArr = [ZONE_WEIGHTS.village, ZONE_WEIGHTS.road, ZONE_WEIGHTS.forest];
    const totalW = zoneWeightArr.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalW;
    let preferZone = 'forest';
    for (let i = 0; i < zoneChoices.length; i++) {
      r -= zoneWeightArr[i];
      if (r <= 0) { preferZone = zoneChoices[i]; break; }
    }

    for (let i = 0; i < count && zombiePool.activeCount < ZOMBIE_CAP; i++) {
      const pos = pickSpawnPos(playerX, playerZ, preferZone);
      if (pos) zombiePool.acquire(pos.x, pos.z);
    }
  },

  despawnZombie(zb) { zombiePool.release(zb); }
};

EventBus.on('sound:gunshot', ({ x, z }) => {
  for (const zb of zombiePool.active) {
    if (zb.state === 'dead') continue;
    if (Math.hypot(zb.x - x, zb.z - z) < zb.hearingRadius) {
      zb.alertUntil = performance.now() / 1000 + 6;
    }
  }
});