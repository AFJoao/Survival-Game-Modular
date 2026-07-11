// =================================================================
// VIEWMODEL — armas presas à câmera + animações (bob, recuo, golpe)
// =================================================================
import { scene, camera } from './scene.js';

export const viewLight = new THREE.PointLight(0xfff2d6, 0.5, 4);
viewLight.position.set(0.3, 0.1, 0.2);

function makePistolModel() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x2b2c2e, flatShading: true, metalness: 0.3, roughness: 0.5 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x1c1712, flatShading: true });
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.075, 0.32), metal);
  slide.position.set(0, 0.06, -0.05);
  g.add(slide);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8), metal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.065, -0.26);
  g.add(barrel);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.16), metal);
  body.position.set(0, 0.015, 0.03);
  g.add(body);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.16, 0.08), grip);
  handle.position.set(0, -0.09, 0.09);
  handle.rotation.x = 0.28;
  g.add(handle);
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.05, 0.02), metal);
  trigger.position.set(0, -0.02, 0.0);
  g.add(trigger);
  g.userData.slide = slide;
  return g;
}

function makeAxeModel() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a30, flatShading: true });
  const iron = new THREE.MeshStandardMaterial({ color: 0x7a7a78, flatShading: true, metalness: 0.4, roughness: 0.5 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.62, 6), wood);
  handle.position.set(0, -0.05, 0);
  g.add(handle);
  const headBase = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.05), iron);
  headBase.position.set(0, 0.29, 0);
  g.add(headBase);
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.16, 4), iron);
  blade.rotation.z = Math.PI / 2;
  blade.rotation.y = Math.PI / 4;
  blade.position.set(-0.1, 0.29, 0);
  blade.scale.set(1, 1, 0.45);
  g.add(blade);
  return g;
}

export const weaponViewmodel = new THREE.Group();

export const pistolModel = makePistolModel();
pistolModel.position.set(0.24, -0.22, -0.42);
pistolModel.rotation.set(0, 0.05, 0);
weaponViewmodel.add(pistolModel);

export const axeModel = makeAxeModel();
axeModel.position.set(0.27, -0.28, -0.42);
axeModel.rotation.set(0.15, 0.3, -0.35);
axeModel.visible = false;
weaponViewmodel.add(axeModel);

export const ViewmodelFX = {
  bobTime: 0,
  recoil: 0,
  swing: 0,
  swinging: false,
  basePos: { pistol: pistolModel.position.clone(), axe: axeModel.position.clone() },
  baseRot: { pistol: pistolModel.rotation.clone(), axe: axeModel.rotation.clone() }
};

export function triggerRecoil() { ViewmodelFX.recoil = 1; }
export function triggerSwing() { ViewmodelFX.swing = 0; ViewmodelFX.swinging = true; }

// updateViewmodel é chamado pelo loop principal com referências a Combat, Player, Survival
export function updateViewmodel(dt, isMoving, equipped, playerGrounded, playerRunning, survivalDead, axeCooldown) {
  const model = equipped === 'pistol' ? pistolModel : axeModel;
  const basePos = ViewmodelFX.basePos[equipped];
  const baseRot = ViewmodelFX.baseRot[equipped];

  if (isMoving && playerGrounded && !survivalDead) {
    ViewmodelFX.bobTime += dt * (playerRunning ? 11 : 7);
  } else {
    ViewmodelFX.bobTime += dt * 2.2;
  }
  const bobX = Math.sin(ViewmodelFX.bobTime) * (isMoving ? 0.018 : 0.004);
  const bobY = Math.abs(Math.cos(ViewmodelFX.bobTime)) * (isMoving ? 0.014 : 0.003);

  model.position.set(basePos.x + bobX, basePos.y + bobY, basePos.z);
  model.rotation.set(baseRot.x, baseRot.y, baseRot.z);

  if (equipped === 'pistol') {
    if (ViewmodelFX.recoil > 0) {
      ViewmodelFX.recoil = Math.max(0, ViewmodelFX.recoil - dt * 6.5);
      const k = ViewmodelFX.recoil;
      model.position.z += k * 0.09;
      model.position.y += k * 0.02;
      model.rotation.x -= k * 0.35;
      if (pistolModel.userData.slide) pistolModel.userData.slide.position.z = -0.05 + k * 0.05;
    } else if (pistolModel.userData.slide) {
      pistolModel.userData.slide.position.z = -0.05;
    }
  } else {
    if (ViewmodelFX.swinging) {
      ViewmodelFX.swing += dt * (1 / axeCooldown) * 1.05;
      if (ViewmodelFX.swing >= 1) { ViewmodelFX.swing = 1; ViewmodelFX.swinging = false; }
      const t = ViewmodelFX.swing;
      const chop = t < 0.35 ? (t / 0.35) : Math.max(0, 1 - (t - 0.35) / 0.65);
      model.rotation.x -= chop * 0.9;
      model.rotation.z += chop * 0.25;
      model.position.z -= chop * 0.14;
      model.position.y -= chop * 0.06;
    }
  }

  weaponViewmodel.position.set(0, 0, 0);
}
