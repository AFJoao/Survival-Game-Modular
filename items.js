// =================================================================
// ITEMS — definição de itens e pool de pickups
// =================================================================
import { ObjectPool } from './core.js';
import { scene } from './scene.js';
import { terrainHeight } from './world.js';

export const ITEM_DEFS = {
  wood:        { name: 'Madeira',   color: 0x8a6a42, maxStack: 50, key: null, icon:
    `<svg viewBox="0 0 24 24"><rect x="2" y="9" width="20" height="6" rx="1.5" fill="#a9764a" stroke="#5f3d20" stroke-width="1"/><ellipse cx="3.2" cy="12" rx="1.6" ry="3" fill="#c99a68" stroke="#5f3d20" stroke-width="0.8"/><ellipse cx="20.8" cy="12" rx="1.6" ry="3" fill="#c99a68" stroke="#5f3d20" stroke-width="0.8"/><path d="M6 9v6M10 9v6M14 9v6M18 9v6" stroke="#5f3d20" stroke-width="0.8" opacity="0.6"/></svg>` },
  stone:       { name: 'Pedra',     color: 0x8a8a82, maxStack: 50, key: null, icon:
    `<svg viewBox="0 0 24 24"><path d="M4 14 L7 6 L14 4 L20 8 L21 15 L16 20 L8 19 Z" fill="#9c9c94" stroke="#5a5a54" stroke-width="1" stroke-linejoin="round"/><path d="M7 6 L12 11 L14 4 M4 14 L12 11 L8 19 M21 15 L12 11 L16 20" stroke="#6f6f68" stroke-width="0.8" fill="none" opacity="0.7"/></svg>` },
  food:        { name: 'Comida',    color: 0xefb31a, maxStack: 10, key: 'F', icon:
    `<svg viewBox="0 0 24 24"><path d="M12 3c-3.5 3-5 6-5 9a5 5 0 0 0 10 0c0-1.6-.7-2.8-1.6-4 .2 1.4-.5 2-1.1 1.6.9-2.4-.4-4.6-2.3-6.6z" fill="#e8631f" stroke="#a8410f" stroke-width="0.8"/><path d="M12 6c1.2 1.6 1.8 3 1.8 4.4A3.8 3.8 0 0 1 12 14a3.8 3.8 0 0 1-1.8-3.6c0-1.4.6-2.8 1.8-4.4z" fill="#f5a83c"/><rect x="11.3" y="1.2" width="1.4" height="2.6" rx="0.6" fill="#5a8a3a"/></svg>` },
  water:       { name: 'Água',      color: 0x3a8fd8, maxStack: 10, key: 'G', icon:
    `<svg viewBox="0 0 24 24"><path d="M12 2c3.5 5 6.5 8.8 6.5 12.3A6.5 6.5 0 1 1 5.5 14.3C5.5 10.8 8.5 7 12 2z" fill="#4fa3e8" stroke="#1f5c96" stroke-width="0.9"/><ellipse cx="9.8" cy="14" rx="1.6" ry="2.4" fill="#a8d8f8" opacity="0.7"/></svg>` },
  bandage:     { name: 'Bandagem',  color: 0xe8e2d6, maxStack: 5, key: 'H', icon:
    `<svg viewBox="0 0 24 24"><rect x="3" y="8.5" width="18" height="7" rx="3.5" fill="#e9e2d4" stroke="#a89e88" stroke-width="1" transform="rotate(-20 12 12)"/><circle cx="9.3" cy="14.6" r="2.6" fill="#f5f0e6" stroke="#c94a3a" stroke-width="0.9" transform="rotate(-20 12 12)"/><path d="M8.2 13.5 h2.2 M9.3 12.4 v2.2" stroke="#c94a3a" stroke-width="0.9" transform="rotate(-20 12 12)"/></svg>` },
  ammo_pistol: { name: 'Munição',   color: 0x33342e, maxStack: 60, key: 'R', icon:
    `<svg viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><rect x="9" y="2" width="6" height="14" rx="1.5" fill="#d4b23a" stroke="#5a4a12" stroke-width="0.8"/><rect x="9" y="14" width="6" height="6" fill="#c94a2e" stroke="#5a1e0f" stroke-width="0.8"/><rect x="10" y="3" width="4" height="7" fill="#e8c85a" opacity="0.7"/></g></svg>` },
  axe:         { name: 'Machado',   color: 0x9a5a2a, maxStack: 1, key: '2', icon:
    `<svg viewBox="0 0 24 24"><rect x="10.6" y="4" width="1.8" height="17" rx="0.8" fill="#a9764a" stroke="#5f3d20" stroke-width="0.6" transform="rotate(20 12 12)"/><path d="M11 2 C8 2 5 4 4.5 7 C6.5 8.4 9.5 8.6 12 7 C13 5 12.5 3 11 2z" fill="#c7c9cf" stroke="#54565c" stroke-width="0.9" transform="rotate(20 12 12)"/></svg>` }
};

// Pool de marcadores de loot (octaedros flutuantes)
export const pickupPool = new ObjectPool(
  () => {
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 0),
      new THREE.MeshStandardMaterial({ flatShading: true, emissiveIntensity: 0.35 })
    );
    scene.add(mesh);
    return { mesh, itemId: null };
  },
  (obj, x, z, itemId) => {
    obj.itemId = itemId;
    const def = ITEM_DEFS[itemId];
    obj.mesh.material.color.setHex(def.color);
    obj.mesh.material.emissive.setHex(def.color);
    obj.mesh.position.set(x, terrainHeight(x, z) + 0.6, z);
    obj.mesh.visible = true;
  }
);

// Expõe ITEM_DEFS globalmente para módulos que ainda não importam (ex: inventory.js usa ITEM_DEFS)
