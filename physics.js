// =================================================================
// PHYSICS — colisão em círculos XZ e física leve (topple, debris)
// =================================================================
import { scene } from './scene.js';
import { terrainHeight } from './world.js';

export const WALL_RADIUS = 1.05;
export const placedWalls = [];

export function pushOutOfCircle(pos, ox, oz, oradius, eradius) {
  const dx = pos.x - ox, dz = pos.z - oz;
  const dist = Math.hypot(dx, dz);
  const minDist = oradius + eradius;
  if (dist < minDist && dist > 0.0001) {
    const push = minDist - dist;
    pos.x += (dx / dist) * push;
    pos.z += (dz / dist) * push;
  }
}

export function resolveCollisions(pos, entityRadius, includeResources, resourceNodes, buildings) {
  if (includeResources) {
    for (const node of resourceNodes) {
      if (node.amount <= 0) continue;
      const r = node.type === 'wood' ? 0.42 : 0.55;
      pushOutOfCircle(pos, node.x, node.z, r, entityRadius);
    }
    for (const b of buildings) pushOutOfCircle(pos, b.x, b.z, b.radius, entityRadius);
  }
  for (const wall of placedWalls) pushOutOfCircle(pos, wall.position.x, wall.position.z, WALL_RADIUS, entityRadius);
}

export const toppleObjects = [];
export const debrisObjects = [];
const GRAVITY = 9.8;

export function startTopple(mesh, impulseDirX, impulseDirZ, onSettled) {
  const len = Math.hypot(impulseDirX, impulseDirZ) || 1;
  toppleObjects.push({ mesh, axisX: impulseDirZ / len, axisZ: -impulseDirX / len, angle: 0, angVel: 0.3 + Math.random() * 0.4, onSettled, settled: false });
}

export function spawnDebris(x, y, z, color, count) {
  for (let i = 0; i < count; i++) {
    const size = 0.15 + Math.random() * 0.22;
    const geo = Math.random() < 0.5 ? new THREE.BoxGeometry(size, size, size) : new THREE.DodecahedronGeometry(size * 0.6, 0);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, flatShading: true }));
    mesh.position.set(x, y + 0.3, z);
    scene.add(mesh);
    debrisObjects.push({ mesh, vx: (Math.random() - 0.5) * 3.2, vy: 2.2 + Math.random() * 2.6, vz: (Math.random() - 0.5) * 3.2, rx: (Math.random() - 0.5) * 8, ry: (Math.random() - 0.5) * 8, rz: (Math.random() - 0.5) * 8, life: 5 + Math.random() * 3 });
  }
}

export function updatePhysics(dt) {
  for (const t of toppleObjects) {
    if (t.settled) continue;
    if (t.angle < Math.PI / 2) {
      t.angVel += 1.4 * dt;
      t.angle = Math.min(Math.PI / 2, t.angle + t.angVel * dt);
      t.mesh.rotation.set(0, t.mesh.rotation.y, 0);
      t.mesh.rotateOnWorldAxis(new THREE.Vector3(t.axisX, 0, t.axisZ).normalize(), t.angle);
    } else {
      t.settled = true;
      if (t.onSettled) t.onSettled();
    }
  }
  for (let i = debrisObjects.length - 1; i >= 0; i--) {
    const d = debrisObjects[i];
    d.vy -= GRAVITY * dt;
    d.mesh.position.x += d.vx * dt; d.mesh.position.y += d.vy * dt; d.mesh.position.z += d.vz * dt;
    d.mesh.rotation.x += d.rx * dt; d.mesh.rotation.y += d.ry * dt; d.mesh.rotation.z += d.rz * dt;
    const groundY = terrainHeight(d.mesh.position.x, d.mesh.position.z) + 0.1;
    if (d.mesh.position.y <= groundY) {
      d.mesh.position.y = groundY; d.vy *= -0.3; d.vx *= 0.6; d.vz *= 0.6;
      if (Math.abs(d.vy) < 0.4) d.vy = 0;
    }
    d.life -= dt;
    if (d.life <= 0) { scene.remove(d.mesh); debrisObjects.splice(i, 1); }
  }
}
