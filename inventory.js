// =================================================================
// INVENTORY SYSTEM — slots limitados, itens empilháveis
// =================================================================
import { EventBus } from './core.js';
import { ITEM_DEFS } from './items.js';

export const Inventory = {
  slots: new Array(16).fill(null),
  selectedIndex: 0,
  selectNext(dir) {
    this.selectedIndex = (this.selectedIndex + dir + this.slots.length) % this.slots.length;
    EventBus.emit('inventory:changed');
  },
  dropSelected(all) {
    const slot = this.slots[this.selectedIndex];
    if (!slot) return;
    const qty = all ? slot.qty : 1;
    slot.qty -= qty;
    if (slot.qty <= 0) this.slots[this.selectedIndex] = null;
    EventBus.emit('inventory:changed');
    // spawnWorldDrop é chamado pelo módulo que registra o handler
    EventBus.emit('inventory:drop', { id: slot.id, qty });
  },
  add(id, qty = 1) {
    const def = ITEM_DEFS[id];
    for (const slot of this.slots) {
      if (slot && slot.id === id && slot.qty < def.maxStack) {
        const room = def.maxStack - slot.qty;
        const used = Math.min(room, qty);
        slot.qty += used; qty -= used;
        if (qty <= 0) { EventBus.emit('inventory:changed'); return true; }
      }
    }
    while (qty > 0) {
      const emptyIdx = this.slots.findIndex(s => s === null);
      if (emptyIdx === -1) { EventBus.emit('inventory:full'); EventBus.emit('inventory:changed'); return false; }
      const amount = Math.min(def.maxStack, qty);
      this.slots[emptyIdx] = { id, qty: amount };
      qty -= amount;
    }
    EventBus.emit('inventory:changed');
    return true;
  },
  count(id) {
    return this.slots.reduce((sum, s) => sum + (s && s.id === id ? s.qty : 0), 0);
  },
  remove(id, qty = 1) {
    let remaining = qty;
    for (const slot of this.slots) {
      if (!slot || slot.id !== id || remaining <= 0) continue;
      const used = Math.min(slot.qty, remaining);
      slot.qty -= used; remaining -= used;
    }
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] && this.slots[i].qty <= 0) this.slots[i] = null;
    }
    EventBus.emit('inventory:changed');
    return remaining <= 0;
  }
};
