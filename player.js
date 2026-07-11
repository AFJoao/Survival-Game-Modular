// =================================================================
// PLAYER CONTROLLER — FPS: andar, correr, agachar, pular, olhar
// =================================================================
import { EventBus } from './core.js';
import { camera, renderer } from './scene.js';
import { WORLD_SIZE, terrainHeight } from './world.js';
import { Survival } from './survival.js';
import { AudioFX } from './audio.js';
import { Inventory } from './inventory.js';

export const PLAYER_RADIUS = 0.4;
const EYE_HEIGHT_STAND = 1.7;
const EYE_HEIGHT_CROUCH = 1.05;

export const Player = {
  x: 0, z: 0, yVel: 0, grounded: true,
  yaw: 0, pitch: 0,
  crouching: false,
  running: false,
  isMoving: false,
  eyeHeight: EYE_HEIGHT_STAND,
  speedWalk: 4.4,
  speedRun: 7.6,
  speedCrouch: 2.2,
  jumpForce: 5.2,
};

export const keys = {};
const blockerEl = document.getElementById('blocker');
const startBtn = document.getElementById('startBtn');
const pauseMenuEl = document.getElementById('pauseMenu');
const resumeBtn = document.getElementById('resumeBtn');
const sensSliderEl = document.getElementById('sensSlider');
const sensValueEl = document.getElementById('sensValue');

let gameStarted = false;
let mouseSensitivity = 1;

// Callbacks registrados externamente para ações de input
const inputHandlers = {};
export function registerInputHandler(key, fn) { inputHandlers[key] = fn; }

startBtn.addEventListener('click', () => { AudioFX.ensure(); renderer.domElement.requestPointerLock(); });
resumeBtn.addEventListener('click', () => { AudioFX.uiClick(); renderer.domElement.requestPointerLock(); });
sensSliderEl.addEventListener('input', () => {
  mouseSensitivity = parseFloat(sensSliderEl.value);
  sensValueEl.textContent = mouseSensitivity.toFixed(1) + 'x';
});

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  if (locked) {
    gameStarted = true;
    blockerEl.style.display = 'none';
    pauseMenuEl.style.display = 'none';
  } else if (!Survival.isDead) {
    if (gameStarted) pauseMenuEl.style.display = 'flex';
    else blockerEl.style.display = 'flex';
  }
});

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (inputHandlers[k]) inputHandlers[k](e);
  if (k === 'q') Inventory.dropSelected(e.shiftKey);
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

window.addEventListener('mousemove', e => {
  if (document.pointerLockElement !== renderer.domElement) return;
  const s = 0.0022 * mouseSensitivity;
  Player.yaw -= e.movementX * s;
  Player.pitch = Math.max(-1.35, Math.min(1.35, Player.pitch - e.movementY * s));
});

renderer.domElement.addEventListener('mousedown', e => {
  if (e.button === 0 && document.pointerLockElement === renderer.domElement) {
    EventBus.emit('player:attack');
  }
});

renderer.domElement.addEventListener('wheel', e => {
  if (document.pointerLockElement !== renderer.domElement) return;
  e.preventDefault();
  Inventory.selectNext(e.deltaY > 0 ? 1 : -1);
}, { passive: false });

export function updatePlayer(dt, resolveCollisionsFn) {
  if (Survival.isDead) return;

  Player.crouching = !!keys['control'];
  Player.running = !!keys['shift'] && !Player.crouching && Survival.stamina > 2;

  const targetEye = Player.crouching ? EYE_HEIGHT_CROUCH : EYE_HEIGHT_STAND;
  Player.eyeHeight = THREE.MathUtils.lerp(Player.eyeHeight, targetEye, 0.15);

  let speed = Player.crouching ? Player.speedCrouch : (Player.running ? Player.speedRun : Player.speedWalk);
  const forward = { x: -Math.sin(Player.yaw), z: -Math.cos(Player.yaw) };
  const right = { x: Math.sin(Player.yaw + Math.PI / 2), z: Math.cos(Player.yaw + Math.PI / 2) };

  let mx = 0, mz = 0;
  if (keys['w']) { mx += forward.x; mz += forward.z; }
  if (keys['s']) { mx -= forward.x; mz -= forward.z; }
  if (keys['d']) { mx += right.x; mz += right.z; }
  if (keys['a']) { mx -= right.x; mz -= right.z; }
  const moveLen = Math.hypot(mx, mz);
  Player.isMoving = moveLen > 0.001;
  if (Player.isMoving) { mx /= moveLen; mz /= moveLen; }

  Player.x += mx * speed * dt;
  Player.z += mz * speed * dt;
  const half = WORLD_SIZE / 2 - 2;
  Player.x = Math.max(-half, Math.min(half, Player.x));
  Player.z = Math.max(-half, Math.min(half, Player.z));

  const playerPos = { x: Player.x, z: Player.z };
  resolveCollisionsFn(playerPos, PLAYER_RADIUS, true);
  Player.x = playerPos.x; Player.z = playerPos.z;

  const groundY = terrainHeight(Player.x, Player.z);
  if (keys[' '] && Player.grounded) { Player.yVel = Player.jumpForce; Player.grounded = false; }
  Player.yVel -= 14 * dt;
  let feetY = (camera.position.y - Player.eyeHeight) + Player.yVel * dt;
  if (feetY <= groundY) { feetY = groundY; Player.yVel = 0; Player.grounded = true; }
  else Player.grounded = false;

  camera.position.set(Player.x, feetY + Player.eyeHeight, Player.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = Player.yaw;
  camera.rotation.x = Player.pitch;

  if (Player.running && Player.isMoving) Survival.stamina = Math.max(0, Survival.stamina - 16 * dt);
  else Survival.stamina = Math.min(Survival.maxStamina, Survival.stamina + 10 * dt);

  if (Player.running && Player.isMoving) {
    Survival.hunger = Math.max(0, Survival.hunger - 0.4 * dt);
    Survival.thirst = Math.max(0, Survival.thirst - 0.5 * dt);
  }
}
