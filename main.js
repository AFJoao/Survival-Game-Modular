// =================================================================
// MAIN — ponto de entrada: orquestra todos os módulos e roda o loop
// =================================================================
import { EventBus, TickManager } from './core.js';
import { scene, camera, renderer, sun, hemiLight } from './scene.js';
import { AudioFX } from './audio.js';
import { WORLD_SIZE, terrainHeight } from './world.js';
import { Survival } from './survival.js';
import { Inventory } from './inventory.js';
import { ITEM_DEFS, pickupPool } from './items.js';
import { CombatState, equipWeapon, reloadPistol, updateCombat } from './combat.js';
import { weaponViewmodel, viewLight, updateViewmodel } from './viewmodel.js';
import { Player, updatePlayer, registerInputHandler } from './player.js';
import { resolveCollisions, updatePhysics, placedWalls, startTopple } from './physics.js';
import { resourceNodes } from './vegetation.js';
import { buildings, lootPoints, spawnLootAtPoint, LOOT_RESPAWN_SECONDS } from './buildings.js';
import { spawnWorldProps } from './props.js';
import { zombiePool, updateZombies, Spawn } from './zombies.js';

// Iniciar props do mundo (precisa de buildings já gerados)
spawnWorldProps(buildings);

// Viewmodel acoplado à câmera
camera.add(viewLight);
camera.add(weaponViewmodel);

// Ciclo dia/noite
const Day = {
  time: 0.25, dayNumber: 1,
  isNight: false, isBloodMoon: false, duration: 600
};

// ──────────────────────────────────────────────
// HUD — elementos do DOM
// ──────────────────────────────────────────────
const healthFillEl    = document.getElementById('healthFill');
const hungerFillEl    = document.getElementById('hungerFill');
const thirstFillEl    = document.getElementById('thirstFill');
const staminaFillEl   = document.getElementById('staminaFill');
const weaponNameEl    = document.getElementById('weaponName');
const ammoCountEl     = document.getElementById('ammoCount');
const ammoReserveEl   = document.getElementById('ammoReserve');
const hotbarEl        = document.getElementById('hotbar');
const interactPromptEl= document.getElementById('interactPrompt');
const dayPhaseEl      = document.getElementById('dayPhase');
const zombieCountEl   = document.getElementById('zombieCount');
const debugPanelEl    = document.getElementById('debugPanel');
const warningEl       = document.getElementById('warning');
const damageFlashEl   = document.getElementById('damageFlash');
const deathOverlayEl  = document.getElementById('deathOverlay');
const deathSummaryEl  = document.getElementById('deathSummary');
const respawnBtnEl    = document.getElementById('respawnBtn');
const damageDirEl     = document.getElementById('damageDir');

// ──────────────────────────────────────────────
// DANO — flash de tela e indicador direcional
// ──────────────────────────────────────────────
let damageFlashTimer = 0;
let damageDirAngle   = 0;
let damageDirTimer   = 0;

function flashDamage() {
  damageFlashTimer = 0.35;
  damageFlashEl.style.opacity = '1';
}
function registerDamageDirection(fromX, fromZ) {
  const dx = fromX - Player.x, dz = fromZ - Player.z;
  damageDirAngle = Math.atan2(dx, dz) - Player.yaw;
  damageDirTimer = 2.5;
  const wedge = damageDirEl.querySelector('.wedge');
  if (wedge) {
    damageDirEl.style.opacity = '1';
    damageDirEl.style.transform = `translate(-50%,-50%) rotate(${THREE.MathUtils.radToDeg(damageDirAngle)}deg)`;
  }
}

EventBus.on('zombie:topple', ({ mesh, yaw, onSettled }) => {
  startTopple(mesh, Math.sin(yaw), Math.cos(yaw), onSettled);
});

// ──────────────────────────────────────────────
// TECLAS de atalho — registrar no player
// ──────────────────────────────────────────────
registerInputHandler('1', () => { equipWeapon('pistol'); AudioFX.uiClick(); });
registerInputHandler('2', () => { equipWeapon('axe');    AudioFX.uiClick(); });
registerInputHandler('r', () => reloadPistol());
registerInputHandler('e', handleInteract);
registerInputHandler('f', () => useConsumable('food'));
registerInputHandler('g', () => useConsumable('water'));
registerInputHandler('h', () => useConsumable('bandage'));
registerInputHandler('f5', (e) => { e.preventDefault(); saveGame(); });
registerInputHandler('f9', (e) => { e.preventDefault(); loadGame(); });

function useConsumable(id) {
  if (!Inventory.remove(id, 1)) return;
  if (id === 'food')    { Survival.hunger = Math.min(Survival.maxHunger, Survival.hunger + 30); AudioFX.uiClick(); }
  if (id === 'water')   { Survival.thirst = Math.min(Survival.maxThirst, Survival.thirst + 35); AudioFX.uiClick(); }
  if (id === 'bandage') { Survival.heal(25); AudioFX.uiClick(); }
  EventBus.emit('survival:changed');
}

// ──────────────────────────────────────────────
// INTERAÇÃO — coletar loot e recursos
// ──────────────────────────────────────────────
const INTERACT_RADIUS = 3.2;
let nearestInteractable = null;

function handleInteract() {
  if (!nearestInteractable) return;
  const t = nearestInteractable;
  if (t.type === 'loot' && t.point.available) {
    Inventory.add(t.point.itemId, 1);
    t.point.available = false;
    t.point.cooldown = LOOT_RESPAWN_SECONDS;
    if (t.point.marker) { pickupPool.release(t.point.marker); t.point.marker = null; }
    AudioFX.uiClick();
  } else if (t.type === 'resource') {
    const node = t.node;
    if (node.amount <= 0) return;
    node.amount--;
    Inventory.add(node.type, 1);
    AudioFX.axeSwing();
    if (node.amount <= 0 && node.mesh) {
      node.mesh.visible = false;
      setTimeout(() => { node.amount = 3; if (node.mesh) node.mesh.visible = true; }, 60000);
    }
  }
}

// ──────────────────────────────────────────────
// COLOCAR PAREDES (crafting básico)
// ──────────────────────────────────────────────
registerInputHandler('b', () => {
  if (Inventory.count('wood') < 4) { showWarning('Precisa de 4 madeiras!'); return; }
  Inventory.remove('wood', 4);
  const fwd = { x: -Math.sin(Player.yaw), z: -Math.cos(Player.yaw) };
  const wx = Player.x + fwd.x * 2.5, wz = Player.z + fwd.z * 2.5;
  const wallGeo = new THREE.BoxGeometry(2, 2.4, 0.2);
  const wallMat = new THREE.MeshStandardMaterial({ color:0x7a5a38, flatShading:true, roughness:1 });
  const wallMesh = new THREE.Mesh(wallGeo, wallMat);
  wallMesh.position.set(wx, terrainHeight(wx,wz)+1.2, wz);
  wallMesh.rotation.y = Player.yaw;
  scene.add(wallMesh);
  placedWalls.push(wallMesh);
  AudioFX.uiClick();
});

// ──────────────────────────────────────────────
// SALVAR / CARREGAR
// ──────────────────────────────────────────────
function saveGame() {
  const data = {
    player: { x: Player.x, z: Player.z, yaw: Player.yaw },
    survival: { health: Survival.health, hunger: Survival.hunger, thirst: Survival.thirst, stamina: Survival.stamina },
    inventory: Inventory.slots,
    day: { time: Day.time, dayNumber: Day.dayNumber },
    combat: { pistolAmmo: CombatState.pistol.magAmmo, axeDurability: CombatState.axe.durability }
  };
  localStorage.setItem('survivalSave', JSON.stringify(data));
  showToast('Jogo salvo!');
}
function loadGame() {
  const raw = localStorage.getItem('survivalSave');
  if (!raw) { showWarning('Nenhum save encontrado.'); return; }
  const d = JSON.parse(raw);
  Player.x = d.player.x; Player.z = d.player.z; Player.yaw = d.player.yaw;
  Object.assign(Survival, d.survival);
  Inventory.slots = d.inventory;
  Day.time = d.day.time; Day.dayNumber = d.day.dayNumber;
  CombatState.pistol.magAmmo   = d.combat.pistolAmmo;
  CombatState.axe.durability   = d.combat.axeDurability;
  EventBus.emit('survival:changed');
  EventBus.emit('inventory:changed');
  EventBus.emit('weapon:changed');
  showToast('Jogo carregado!');
}

// ──────────────────────────────────────────────
// MORTE e RESPAWN
// ──────────────────────────────────────────────
EventBus.on('player:died', () => {
  document.exitPointerLock();
  deathSummaryEl.textContent = `Sobreviveu ${Day.dayNumber} dia(s) — Pontuação: ${Survival.score}`;
  deathOverlayEl.style.display = 'flex';
});
respawnBtnEl.addEventListener('click', () => {
  location.reload();
});

// ──────────────────────────────────────────────
// TOAST e WARNING
// ──────────────────────────────────────────────
const saveToastEl = document.getElementById('saveToast');
function showToast(msg) {
  saveToastEl.textContent = msg;
  saveToastEl.style.opacity = '1';
  setTimeout(() => saveToastEl.style.opacity = '0', 2200);
}
let warningTimer = 0;
function showWarning(msg) {
  warningEl.textContent = msg;
  warningEl.style.display = 'block';
  warningTimer = 3;
}

// ──────────────────────────────────────────────
// ATUALIZAR HUD
// ──────────────────────────────────────────────
function updateHUD() {
  healthFillEl.style.width  = (Survival.health  / Survival.maxHealth  * 100) + '%';
  hungerFillEl.style.width  = (Survival.hunger  / Survival.maxHunger  * 100) + '%';
  thirstFillEl.style.width  = (Survival.thirst  / Survival.maxThirst  * 100) + '%';
  staminaFillEl.style.width = (Survival.stamina / Survival.maxStamina * 100) + '%';

  const p = CombatState.pistol, a = CombatState.axe;
  if (CombatState.equipped === 'pistol') {
    weaponNameEl.textContent  = 'Pistola';
    ammoCountEl.textContent   = p.magAmmo;
    ammoReserveEl.textContent = 'reserva: ' + Inventory.count('ammo_pistol');
  } else {
    weaponNameEl.textContent  = 'Machado';
    ammoCountEl.textContent   = a.durability + '/' + a.maxDurability;
    ammoReserveEl.textContent = '';
  }

  // Hotbar
  hotbarEl.innerHTML = '';
  for (let i = 0; i < Inventory.slots.length; i++) {
    const slot = Inventory.slots[i];
    const div = document.createElement('div');
    div.className = 'slot' + (i === Inventory.selectedIndex ? ' selected' : '');
    if (slot) {
      const def = ITEM_DEFS[slot.id];
      div.innerHTML = `<div class="swatch">${def.icon}</div><span class="qty">${slot.qty > 1 ? slot.qty : ''}</span>`;
      if (def.key) div.innerHTML += `<span class="keyBadge">${def.key}</span>`;
    }
    hotbarEl.appendChild(div);
  }

  zombieCountEl.textContent = zombiePool.activeCount;
  const phase = Day.time < 0.25 ? 'Manhã' : Day.time < 0.5 ? 'Tarde' : Day.time < 0.75 ? 'Noite' : 'Madrugada';
  dayPhaseEl.textContent = `${Day.isBloodMoon?'🔴 ':''}Dia ${Day.dayNumber} — ${phase}`;
  debugPanelEl.textContent = `x:${Player.x.toFixed(1)} z:${Player.z.toFixed(1)} | FPS:${Math.round(1/lastDt)}`;
}

// ──────────────────────────────────────────────
// ATUALIZAR INTERACTABLES (zona de pickup/recurso)
// ──────────────────────────────────────────────
function updateInteractables() {
  nearestInteractable = null;
  let bestDist = INTERACT_RADIUS;

  for (const point of lootPoints) {
    if (!point.available) continue;
    const d = Math.hypot(Player.x - point.x, Player.z - point.z);
    if (d < bestDist) { bestDist = d; nearestInteractable = { type:'loot', point }; }
  }
  for (const node of resourceNodes) {
    if (node.amount <= 0) continue;
    const d = Math.hypot(Player.x - node.x, Player.z - node.z);
    if (d < bestDist) { bestDist = d; nearestInteractable = { type:'resource', node }; }
  }
  if (nearestInteractable) {
    const label = nearestInteractable.type === 'loot'
      ? `[E] Coletar ${ITEM_DEFS[nearestInteractable.point.itemId].name}`
      : `[E] Coletar ${nearestInteractable.node.type === 'wood' ? 'Madeira' : 'Pedra'}`;
    interactPromptEl.textContent = label;
    interactPromptEl.style.display = 'block';
  } else {
    interactPromptEl.style.display = 'none';
  }
}

// ──────────────────────────────────────────────
// CICLO DIA/NOITE
// ──────────────────────────────────────────────
function updateDayNight(dt) {
  Day.time += dt / Day.duration;
  if (Day.time >= 1) {
    Day.time -= 1;
    Day.dayNumber++;
    Survival.daysSurvived++;
    Survival.score += 100;
    Day.isBloodMoon = Math.random() < 0.2;
  }
  Day.isNight = Day.time > 0.5;
  const sunAngle = Day.time * Math.PI * 2;
  sun.position.set(Math.cos(sunAngle)*60, Math.sin(sunAngle)*60, 20);
  const dayBrightness = Math.max(0, Math.sin(sunAngle));
  hemiLight.intensity = 0.25 + dayBrightness * 0.5;
  sun.intensity = dayBrightness * 0.85;
  const skyColor = new THREE.Color().setHSL(0.58, 0.35, 0.18 + dayBrightness * 0.42);
  if (Day.isBloodMoon && Day.isNight) skyColor.setHSL(0.02, 0.5, 0.12);
  renderer.setClearColor(skyColor);
  scene.fog.color.copy(skyColor);
}

// ──────────────────────────────────────────────
// LOOT RESPAWN
// ──────────────────────────────────────────────
TickManager.register('low', (dt) => {
  for (const point of lootPoints) {
    if (point.available) continue;
    point.cooldown -= dt;
    if (point.cooldown <= 0) spawnLootAtPoint(point);
  }
});

// ──────────────────────────────────────────────
// LOOP PRINCIPAL
// ──────────────────────────────────────────────
let lastTime = performance.now();
let lastDt = 0.016;

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now; lastDt = dt;

  if (Survival.isDead) return;

  TickManager.update(dt);
  updatePlayer(dt, (pos, rad, includeRes) =>
    resolveCollisions(pos, rad, includeRes, resourceNodes, buildings));

  Survival.tick(dt);
  updateDayNight(dt);
  Spawn.update(dt, Player.x, Player.z, Day.isNight, Day.isBloodMoon);
  updateZombies(dt, Player.x, Player.z, Day.isBloodMoon, flashDamage, registerDamageDirection);
  updateCombat(dt);
  updatePhysics(dt);
  updateInteractables();

  // Viewmodel
  updateViewmodel(dt, Player.isMoving, CombatState.equipped,
    Player.grounded, Player.running, Survival.isDead, CombatState.axe.cooldown);

  // Flash de dano
  if (damageFlashTimer > 0) {
    damageFlashTimer -= dt;
    damageFlashEl.style.opacity = (damageFlashTimer / 0.35).toFixed(2);
    if (damageFlashTimer <= 0) damageFlashEl.style.opacity = '0';
  }
  // Indicador de dano direcional
  if (damageDirTimer > 0) {
    damageDirTimer -= dt;
    damageDirEl.style.opacity = (damageDirTimer / 2.5).toFixed(2);
    if (damageDirTimer <= 0) damageDirEl.style.opacity = '0';
  }
  // Warning
  if (warningTimer > 0) {
    warningTimer -= dt;
    if (warningTimer <= 0) warningEl.style.display = 'none';
  }
  if (Survival.hunger < 15 || Survival.thirst < 15) showWarning('Estou com fome e sede!');

  updateHUD();
  renderer.render(scene, camera);
}

animate();
