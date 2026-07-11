// =================================================================
// PONTOS DE INTERESSE — locais temáticos espalhados pela floresta
// =================================================================
import { scene } from './scene.js';
import { terrainHeight, villageCenter, villageRadius, roadHalfWidth, WORLD_SIZE } from './world.js';
import { makeDebrisPile } from './vegetation.js';
import { makeAbandonedCar, makeBarrel, makeCrate } from './props.js';

const dummy = new THREE.Object3D();

function buildGasStation(x, z) {
  const g = new THREE.Group();
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xb84a3a, flatShading: true, roughness: 0.8 });
  const poleMat   = new THREE.MeshStandardMaterial({ color: 0x4a4a48, flatShading: true, metalness: 0.3 });
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 4), canopyMat);
  canopy.position.y = 3.4; g.add(canopy);
  for (const [px, pz] of [[-2.6,-1.6],[2.6,-1.6],[-2.6,1.6],[2.6,1.6]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,3.4,6), poleMat);
    pole.position.set(px,1.7,pz); g.add(pole);
  }
  const pumpMat = new THREE.MeshStandardMaterial({ color:0x8a8a86, flatShading:true, roughness:0.6 });
  for (const px of [-1,1]) {
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.6,1.3,0.5), pumpMat);
    pump.position.set(px*1.1,0.65,0); g.add(pump);
  }
  const kiosk = new THREE.Mesh(new THREE.BoxGeometry(3,2.6,2.4),
    new THREE.MeshStandardMaterial({ color:0x8f8272, flatShading:true }));
  kiosk.position.set(0,1.3,-3.6); g.add(kiosk);
  g.add(makeDebrisPile(1.5, 0));
  g.add(makeAbandonedCar(3.5, 0));
  g.position.set(x, terrainHeight(x,z), z);
  return g;
}

function buildEnergyTower(x, z) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color:0x5a5a54, flatShading:true, metalness:0.4, roughness:0.6 });
  const h = 11;
  for (const [lx,lz] of [[-1.4,-1.4],[1.4,-1.4],[-1.4,1.4],[1.4,1.4]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.16,h,4), mat);
    leg.position.set(lx*0.35, h/2, lz*0.35);
    leg.rotation.x = (lz>0?-1:1)*0.09;
    leg.rotation.z = (lx>0?-1:1)*0.09;
    g.add(leg);
  }
  for (let i=1; i<=3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.8-i*0.55,0.05,4,4), mat);
    ring.rotation.x = Math.PI/2; ring.rotation.z = Math.PI/4;
    ring.position.y = i*(h/4); g.add(ring);
  }
  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(3.2,0.12,0.12), mat);
  crossbar.position.y = h+0.3; g.add(crossbar);
  g.position.set(x, terrainHeight(x,z), z);
  return g;
}

function buildCamp(x, z) {
  const g = new THREE.Group();
  const tentMat = new THREE.MeshStandardMaterial({ color:0x4a5a42, flatShading:true, roughness:1 });
  const tent = new THREE.Mesh(new THREE.ConeGeometry(1.3,1.6,4), tentMat);
  tent.rotation.y = Math.PI/4; tent.position.set(-1.5,0.8,0); g.add(tent);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55,0.08,6,10),
    new THREE.MeshStandardMaterial({ color:0x3a3a38, flatShading:true }));
  ring.rotation.x = Math.PI/2; ring.position.set(1,0.08,0.5); g.add(ring);
  const logsMat = new THREE.MeshStandardMaterial({ color:0x3a2c1e, flatShading:true });
  for (let i=0; i<4; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,0.7,5), logsMat);
    log.rotation.z = Math.PI/2; log.rotation.y = (i/4)*Math.PI;
    log.position.set(1,0.1,0.5); g.add(log);
  }
  const c1 = makeCrate(0,0); c1.position.set(2.2,-0.5,0); g.add(c1);
  const c2 = makeCrate(0,0); c2.position.set(2.6, 0.3,0); g.add(c2);
  const b1 = makeBarrel(0,0); b1.position.set(-2.5,terrainHeight(x,z)+0.42,1.5); g.add(b1);
  g.position.set(x, terrainHeight(x,z), z);
  return g;
}

function buildMarketStalls(x, z) {
  const g = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color:0x5a4a34, flatShading:true });
  const clothColors = [0x8a3a30,0x3a5a4a,0x6a5a2a];
  for (let s=0; s<3; s++) {
    const stall = new THREE.Group();
    for (const [px,pz] of [[-0.8,-0.6],[0.8,-0.6],[-0.8,0.6],[0.8,0.6]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.7,4), postMat);
      post.position.set(px,0.85,pz); stall.add(post);
    }
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(1.8,0.08,1.4),
      new THREE.MeshStandardMaterial({ color:clothColors[s%clothColors.length], flatShading:true }));
    cloth.position.y = 1.7; stall.add(cloth);
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.7,1.1), postMat);
    table.position.y = 0.35; stall.add(table);
    stall.position.set((s-1)*2.6,0,0); g.add(stall);
  }
  const dp = makeDebrisPile(0,0); dp.position.set(0,-2.2,0); g.add(dp);
  g.position.set(x, terrainHeight(x,z), z);
  return g;
}

// --- Horizonte ---
const HORIZON_TREE_COUNT = 500;
const horizonTreeGeo = new THREE.ConeGeometry(3.2,7,5);
horizonTreeGeo.translate(0,3.5,0);
const horizonTrees = new THREE.InstancedMesh(horizonTreeGeo,
  new THREE.MeshStandardMaterial({ color:0x3f4a3a, flatShading:true, fog:true }), HORIZON_TREE_COUNT);
for (let i=0; i<HORIZON_TREE_COUNT; i++) {
  const angle = (i/HORIZON_TREE_COUNT)*Math.PI*2 + Math.random()*0.05;
  const radius = WORLD_SIZE/2 + 15 + Math.random()*45;
  dummy.position.set(Math.cos(angle)*radius, 0, Math.sin(angle)*radius);
  dummy.rotation.y = Math.random()*Math.PI*2;
  const s = 0.8+Math.random()*1.6; dummy.scale.set(s, s*(0.8+Math.random()*0.8), s);
  dummy.updateMatrix(); horizonTrees.setMatrixAt(i, dummy.matrix);
}
horizonTrees.instanceMatrix.needsUpdate = true;
scene.add(horizonTrees);

const mountainMat = new THREE.MeshStandardMaterial({ color:0x6f7a80, flatShading:true, fog:true });
for (let i=0; i<9; i++) {
  const angle = (i/9)*Math.PI*2 + Math.random()*0.2;
  const radius = WORLD_SIZE/2 + 70 + Math.random()*60;
  const h = 30 + Math.random()*40;
  const mountain = new THREE.Mesh(new THREE.ConeGeometry(40+Math.random()*30,h,5), mountainMat);
  mountain.position.set(Math.cos(angle)*radius, h*0.25, Math.sin(angle)*radius);
  mountain.rotation.y = Math.random()*Math.PI;
  scene.add(mountain);
}

// --- Spawn dos POIs ---
const poiSpots = [];
function pickForestSpot(minDist) {
  let x, z, tries = 0;
  do {
    x = (Math.random()-0.5)*WORLD_SIZE*0.82;
    z = (Math.random()-0.5)*WORLD_SIZE*0.82;
    tries++;
  } while ((Math.hypot(x-villageCenter.x,z-villageCenter.z)<minDist ||
            Math.abs(x)<roadHalfWidth+10 ||
            poiSpots.some(p=>Math.hypot(p.x-x,p.z-z)<40)) && tries<60);
  poiSpots.push({x,z}); return {x,z};
}

const minD = villageRadius+30;
const s1=pickForestSpot(minD); scene.add(buildGasStation(s1.x,s1.z));
const s2=pickForestSpot(minD); scene.add(buildEnergyTower(s2.x,s2.z));
const s3=pickForestSpot(minD); scene.add(buildCamp(s3.x,s3.z));
const s4=pickForestSpot(minD); scene.add(buildMarketStalls(s4.x,s4.z));
