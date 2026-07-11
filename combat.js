// =================================================================
// COMBAT SYSTEM — pistola (munição/recarga) e machado (durabilidade)
// =================================================================
import { EventBus, ObjectPool } from './core.js';
import { scene, camera } from './scene.js';
import { AudioFX } from './audio.js';
import { Inventory } from './inventory.js';
import { Survival } from './survival.js';
import { triggerRecoil, triggerSwing, pistolModel, axeModel } from './viewmodel.js';

export const CombatState = {
  equipped: 'pistol',
  pistol: { magSize: 8, magAmmo: 8, damage: 30, cooldown: 0.28, timer: 0, range: 60 },
  axe: { durability: 60, maxDurability: 60, damage: 34, cooldown: 0.55, timer: 0, range: 2.6 }
};

// Callbacks para dano a zombies — registrado pelo módulo de zumbis
let damageZombieFn = null;
export function registerDamageZombie(fn) { damageZombieFn = fn; }

// Referência ao pool de zumbis ativos — atribuída pelo spawn manager
let zombiePoolRef = null;
export function setZombiePool(pool) { zombiePoolRef = pool; }

export function equipWeapon(name) {
  CombatState.equipped = name;
  pistolModel.visible = name === 'pistol';
  axeModel.visible = name === 'axe';
  EventBus.emit('weapon:changed');
}

export function useEquippedWeapon() {
  if (Survival.isDead) return;
  if (CombatState.equipped === 'pistol') firePistol();
  else swingAxe();
}

const raycaster = new THREE.Raycaster();

function firePistol() {
  const p = CombatState.pistol;
  if (p.timer > 0) return;
  if (p.magAmmo <= 0) { reloadPistol(); return; }
  p.timer = p.cooldown;
  p.magAmmo--;
  EventBus.emit('weapon:changed');
  EventBus.emit('sound:gunshot', { x: camera.position.x, z: camera.position.z });
  AudioFX.gunshot();

  raycaster.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));
  let closest = null, closestDist = p.range, closestPoint = null;
  const torsoPoint = new THREE.Vector3();

  if (zombiePoolRef) {
    for (const zb of zombiePoolRef.active) {
      if (zb.state === 'dead') continue;
      torsoPoint.set(zb.mesh.position.x, zb.mesh.position.y + 1.15, zb.mesh.position.z);
      const hit = raycaster.ray.distanceSqToPoint(torsoPoint);
      if (hit < 1.1) {
        const dist = camera.position.distanceTo(torsoPoint);
        if (dist < closestDist) { closest = zb; closestDist = dist; closestPoint = torsoPoint.clone(); }
      }
    }
  }

  spawnTracer(camera.position, closestPoint || camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(p.range)));
  if (closest && damageZombieFn) damageZombieFn(closest, p.damage);
  triggerRecoil();
}

export function reloadPistol() {
  const p = CombatState.pistol;
  if (p.magAmmo >= p.magSize) return;
  const needed = p.magSize - p.magAmmo;
  const have = Inventory.count('ammo_pistol');
  const used = Math.min(needed, have);
  if (used <= 0) return;
  Inventory.remove('ammo_pistol', used);
  p.magAmmo += used;
  EventBus.emit('weapon:changed');
}

function swingAxe() {
  const a = CombatState.axe;
  if (a.timer > 0 || a.durability <= 0) return;
  a.timer = a.cooldown;
  triggerSwing();
  AudioFX.axeSwing();
  const fwd = camera.getWorldDirection(new THREE.Vector3());
  let target = null, bestDist = a.range;
  const torsoPoint = new THREE.Vector3();

  if (zombiePoolRef) {
    for (const zb of zombiePoolRef.active) {
      if (zb.state === 'dead') continue;
      torsoPoint.set(zb.mesh.position.x, zb.mesh.position.y + 1.15, zb.mesh.position.z);
      const dist = camera.position.distanceTo(torsoPoint);
      if (dist > bestDist) continue;
      const dir = torsoPoint.clone().sub(camera.position).normalize();
      if (dir.dot(fwd) > 0.6) { target = zb; bestDist = dist; }
    }
  }

  a.durability = Math.max(0, a.durability - 1);
  EventBus.emit('weapon:changed');
  if (target && damageZombieFn) damageZombieFn(target, a.damage);
}

// Pool de traçadores
const tracerPool = new ObjectPool(
  () => { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 4), new THREE.MeshBasicMaterial({ color: 0xfff4c2, transparent: true, opacity: 0.9 })); scene.add(mesh); return { mesh, life: 0 }; },
  (obj, from, to) => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const dist = from.distanceTo(to);
    obj.mesh.position.copy(mid);
    obj.mesh.scale.set(1, dist, 1);
    obj.mesh.lookAt(to);
    obj.mesh.rotateX(Math.PI / 2);
    obj.mesh.visible = true;
    obj.life = 0.06;
  }
);
const activeTracers = [];
function spawnTracer(from, to) { const t = tracerPool.acquire(from, to); activeTracers.push(t); }

export function updateCombat(dt) {
  if (CombatState.pistol.timer > 0) CombatState.pistol.timer = Math.max(0, CombatState.pistol.timer - dt);
  if (CombatState.axe.timer > 0) CombatState.axe.timer = Math.max(0, CombatState.axe.timer - dt);
  for (let i = activeTracers.length - 1; i >= 0; i--) {
    const t = activeTracers[i];
    t.life -= dt;
    if (t.life <= 0) { tracerPool.release(t); activeTracers.splice(i, 1); }
  }
}

// Registrar atalhos de teclado de combate
EventBus.on('player:attack', () => useEquippedWeapon());
