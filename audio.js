// =================================================================
// AUDIO — sons sintéticos via Web Audio API (sem arquivos externos).
// =================================================================
export const AudioFX = {
  ctx: null,
  ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  gunshot() {
    const ctx = this.ensure(); const t = ctx.currentTime;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const noise = ctx.createBufferSource(); noise.buffer = buffer;
    const filter = ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 700;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start(t); noise.stop(t + 0.13);
  },
  axeSwing() {
    const ctx = this.ensure(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, t); osc.frequency.exponentialRampToValueAtTime(55, t + 0.15);
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.16, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.16);
  },
  zombieHit() {
    const ctx = this.ensure(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.type = 'square';
    osc.frequency.setValueAtTime(220, t); osc.frequency.exponentialRampToValueAtTime(75, t + 0.08);
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.14, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.1);
  },
  zombieGroan(distance) {
    const ctx = this.ensure(); const t = ctx.currentTime;
    const vol = THREE.MathUtils.clamp(1 - distance / 22, 0.08, 0.55) * 0.22;
    const osc = ctx.createOscillator(); osc.type = 'sawtooth';
    const baseFreq = 65 + Math.random() * 35;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.65, t + 0.55);
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 450;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, t); gain.gain.linearRampToValueAtTime(vol, t + 0.08); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.58);
  },
  playerHurt() {
    const ctx = this.ensure(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.22, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.27);
  },
  uiClick() {
    const ctx = this.ensure(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.07);
  }
};
