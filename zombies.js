// =================================================================
// ZUMBIS — mesh humanóide de baixo-poli + pool + IA com LOD
// =================================================================
import { EventBus, ObjectPool } from './core.js';
import { scene } from './scene.js';
import { terrainHeight, WORLD_SIZE } from './world.js';
import { AudioFX } from './audio.js';
import { Survival } from './survival.js';
import { Inventory } from './inventory.js';
import { resolveCollisions } from './physics.js';
import { registerDamageZombie, setZombiePool } from './combat.js';

// --- Mesh humanóide ---
function makeHumanoidMesh(color) {
  const group = new THREE.Group();
  const mat     = new THREE.MeshStandardMaterial({ color, flatShading:true });
  const skinMat = new THREE.MeshStandardMaterial({ color:0x6b7a5a, flatShading:true });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.4,1.0,6), mat);
  body.position.y = 1.1; group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32,8,6), skinMat);
  head.position.y = 1.85; group.add(head);
  const armGeo = new THREE.CylinderGeometry(0.1,0.1,0.75,5);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.5,1.15,0); armL.geometry.translate(0,-0.37,0); group.add(armL);
  const armR = armL.clone(); armR.position.x = 0.5; group.add(armR);
  const legGeo = new THREE.CylinderGeometry(0.13,0.13,0.85,5);
  const legMat = new THREE.MeshStandardMaterial({ color:0x2b2b3a, flatShading:true });
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.18,0.6,0); legL.geometry.translate(0,-0.42,0); group.add(legL);
  const legR = legL.clone(); legR.position.x = 0.18; group.add(legR);
  group.userData.limbs = { armL, armR, legL, legR };
  group.userData.body  = body;
  return group;
}

// --- Pool ---
export const zombiePool = new ObjectPool(
  () => {
    const mesh = makeHumanoidMesh(0x4a6b3a);
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, walkTime: Math.random()*10 };
  },
  (obj, x, z) => {
    obj.x = x; obj.z = z; obj.yaw = Math.random()*Math.PI*2;
    obj.speedWander = 1.1; obj.speedChase = 3.4;
    obj.sightRadius = 14; obj.hearingRadius = 22; obj.attackRadius = 1.4;
    obj.hp = 3; obj.hitCooldown = 0; obj.hitFlash = 0;
    obj.state = 'wander'; obj.alertUntil = 0;
    obj.patrolRoute = pickPatrolRoute(x,z);
    obj.patrolIndex = 0; obj.patrolPauseTimer = 0;
    obj.groanTimer = 1 + Math.random()*4;
    obj.mesh.position.set(x, terrainHeight(x,z), z);
    obj.mesh.visible = true;
    obj.mesh.userData.body.material.emissive.setHex(0x000000);
  }
);

setZombiePool(zombiePool);

// --- Dano ---
function damageZombie(zb, amount) {
  zb.hp -= amount; zb.hitFlash = 0.15;
  AudioFX.zombieHit();
  if (zb.hp <= 0) killZombie(zb);
}
registerDamageZombie(damageZombie);

function killZombie(zb) {
  zb.state = 'dead';
  EventBus.emit('zombie:died', zb);
  EventBus.emit('zombie:topple', { mesh: zb.mesh, yaw: zb.yaw, onSettled: () => {
    setTimeout(() => zombiePool.release(zb), 4000);
  }});
  if (Math.random() < 0.45) Inventory.add('food', 1);
}

function pickPatrolRoute(x, z) {
  const count = 3 + Math.floor(Math.random()*2);
  const route = [];
  const baseAngle = Math.random()*Math.PI*2;
  for (let i=0; i<count; i++) {
    const angle = baseAngle + (i/count)*Math.PI*2 + (Math.random()-0.5)*0.5;
    const dist  = 6 + Math.random()*10;
    route.push({ x: x+Math.cos(angle)*dist, z: z+Math.sin(angle)*dist });
  }
  return route;
}

// --- IA ---
const NEAR_RADIUS = 26;

export function updateZombies(dt, playerX, playerZ, dayIsBloodMoon, flashDamageFn, registerDamageDirectionFn) {
  for (const zb of zombiePool.active) {
    const dist = Math.hypot(playerX-zb.x, playerZ-zb.z);
    updateZombieAI(zb, dt, dist < NEAR_RADIUS, playerX, playerZ, dayIsBloodMoon, flashDamageFn, registerDamageDirectionFn);
  }
}

function updateZombieAI(zb, dt, fullDetail, playerX, playerZ, dayIsBloodMoon, flashDamageFn, registerDamageDirFn) {
  if (zb.state === 'dead') return;
  const distToPlayer = Math.hypot(playerX-zb.x, playerZ-zb.z);
  const alerted = zb.alertUntil > performance.now()/1000;
  const canSense = distToPlayer < zb.sightRadius || alerted;
  zb.state = canSense ? 'chase' : 'wander';

  let targetX, targetZ, speed;
  if (zb.state === 'chase') { targetX = playerX; targetZ = playerZ; speed = zb.speedChase; }
  else if (zb.patrolPauseTimer > 0) { zb.patrolPauseTimer -= dt; targetX = zb.x; targetZ = zb.z; speed = 0; }
  else {
    const wp = zb.patrolRoute[zb.patrolIndex];
    if (Math.hypot(wp.x-zb.x, wp.z-zb.z) < 1.5) {
      zb.patrolIndex = (zb.patrolIndex+1) % zb.patrolRoute.length;
      zb.patrolPauseTimer = 1.2 + Math.random()*2.5;
    }
    const cur = zb.patrolRoute[zb.patrolIndex];
    targetX = cur.x; targetZ = cur.z; speed = zb.speedWander;
  }

  const dx = targetX-zb.x, dz = targetZ-zb.z;
  const distToTarget = Math.hypot(dx,dz);
  if (distToTarget > 0.05) {
    zb.yaw = Math.atan2(dx,dz);
    zb.x += (dx/distToTarget)*speed*dt;
    zb.z += (dz/distToTarget)*speed*dt;
  }
  if (fullDetail) {
    const pos = { x:zb.x, z:zb.z };
    resolveCollisions(pos, 0.42, false, [], []);
    zb.x = pos.x; zb.z = pos.z;
  }
  zb.mesh.position.set(zb.x, terrainHeight(zb.x,zb.z), zb.z);
  zb.mesh.rotation.y = zb.yaw;

  if (fullDetail) {
    zb.walkTime += dt*(zb.state==='chase'?10:6);
    const swing = Math.sin(zb.walkTime)*0.6;
    const l = zb.mesh.userData.limbs;
    l.legL.rotation.x =  swing; l.legR.rotation.x = -swing;
    l.armL.rotation.x = -swing; l.armR.rotation.x =  swing;
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
  zb.mesh.userData.body.material.emissive.setHex(
    zb.hitFlash > 0 ? 0xffffff : (dayIsBloodMoon ? 0x8a1010 : 0x000000)
  );
  if (fullDetail) {
    zb.groanTimer -= dt;
    if (zb.groanTimer <= 0) {
      zb.groanTimer = zb.state==='chase' ? (3+Math.random()*3) : (6+Math.random()*6);
      if (distToPlayer < 22) AudioFX.zombieGroan(distToPlayer);
    }
  }
}

// =================================================================
// SPAWN MANAGER — zona limpa + spawn inicial denso
// =================================================================
const ZOMBIE_CAP = 80;

// Raio mínimo de spawn: zumbis NÃO nascem dentro deste raio ao redor do player.
// Quando o player "limpa" uma área e fica parado, esse raio protege a zona limpa.
const CLEAN_RADIUS     = 35;  // dentro disso: nunca spawna
const SPAWN_RADIUS_MAX = 80;  // fora disso: também não spawna (muito longe)

// Intervalos de spawn (segundos entre lotes)
const SPAWN_INTERVAL_DAY   = 6;
const SPAWN_INTERVAL_NIGHT = 3;
const SPAWN_INTERVAL_BLOOD = 1.2;

// Tamanho dos lotes
const BATCH_DAY   = [2, 4];  // [min, max]
const BATCH_NIGHT = [3, 6];
const BATCH_BLOOD = [5, 9];

function randBetween(min, max) { return min + Math.floor(Math.random()*(max-min+1)); }

// Tenta encontrar uma posição válida de spawn:
// fora do raio limpo, dentro do raio máximo, sem sobrepor outro zumbi.
function pickSpawnPos(playerX, playerZ) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const angle = Math.random()*Math.PI*2;
    const dist  = CLEAN_RADIUS + Math.random()*(SPAWN_RADIUS_MAX - CLEAN_RADIUS);
    const sx = playerX + Math.cos(angle)*dist;
    const sz = playerZ + Math.sin(angle)*dist;
    // manter dentro do mundo
    const half = WORLD_SIZE/2 - 5;
    if (Math.abs(sx) > half || Math.abs(sz) > half) continue;
    // não sobrepor zumbi existente
    let tooClose = false;
    for (const zb of zombiePool.active) {
      if (Math.hypot(zb.x-sx, zb.z-sz) < 2.5) { tooClose = true; break; }
    }
    if (!tooClose) return { x: sx, z: sz };
  }
  return null; // falhou — tenta no próximo tick
}

export const Spawn = {
  timer: 0,
  initialized: false,

  // Preenche o mundo com zumbis espalhados no início,
  // todos fora do raio limpo inicial do player (que começa em 0,0).
  init(playerX, playerZ) {
    const initialCount = 55;
    for (let i = 0; i < initialCount; i++) {
      const pos = pickSpawnPos(playerX, playerZ);
      if (pos) zombiePool.acquire(pos.x, pos.z);
    }
    this.initialized = true;
  },

  update(dt, playerX, playerZ, isNight, isBloodMoon) {
    // Spawn inicial no primeiro frame
    if (!this.initialized) { this.init(playerX, playerZ); return; }

    const interval = isBloodMoon ? SPAWN_INTERVAL_BLOOD
                   : isNight     ? SPAWN_INTERVAL_NIGHT
                   :               SPAWN_INTERVAL_DAY;
    this.timer += dt;
    if (this.timer < interval || zombiePool.activeCount >= ZOMBIE_CAP) return;
    this.timer = 0;

    const [bMin, bMax] = isBloodMoon ? BATCH_BLOOD : isNight ? BATCH_NIGHT : BATCH_DAY;
    const count = randBetween(bMin, bMax);
    for (let i = 0; i < count && zombiePool.activeCount < ZOMBIE_CAP; i++) {
      const pos = pickSpawnPos(playerX, playerZ);
      if (pos) zombiePool.acquire(pos.x, pos.z);
    }
  },

  despawnZombie(zb) { zombiePool.release(zb); }
};

// Escuta disparo → alerta zumbis próximos
EventBus.on('sound:gunshot', ({ x, z }) => {
  for (const zb of zombiePool.active) {
    if (zb.state === 'dead') continue;
    if (Math.hypot(zb.x-x, zb.z-z) < zb.hearingRadius) {
      zb.alertUntil = performance.now()/1000 + 6;
    }
  }
});