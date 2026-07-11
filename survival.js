// =================================================================
// SURVIVAL SYSTEM — vida, fome, sede, fôlego
// =================================================================
import { EventBus } from './core.js';

export const Survival = {
  health: 100, maxHealth: 100,
  hunger: 100, maxHunger: 100,
  thirst: 100, maxThirst: 100,
  stamina: 100, maxStamina: 100,
  hungerDepletionPerSecond: 0.111,  // esvazia em ~1.5 dias (900s)
  thirstDepletionPerSecond: 0.167,  // esvazia em ~1 dia (600s)
  isDead: false,
  score: 0,
  daysSurvived: 0,
  damage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    EventBus.emit('survival:changed');
    if (this.health <= 0) EventBus.emit('player:died');
  },
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    EventBus.emit('survival:changed');
  },
  tick(dt) {
    if (this.isDead) return;
    this.hunger = Math.max(0, this.hunger - this.hungerDepletionPerSecond * dt);
    this.thirst = Math.max(0, this.thirst - this.thirstDepletionPerSecond * dt);
    // Morre lentamente por inanição/desidratação — ~5 min para matar do zero
    if (this.hunger <= 0 || this.thirst <= 0) this.damage(0.33 * dt);
    EventBus.emit('survival:changed');
  }
};

EventBus.on('player:died', () => { Survival.isDead = true; });