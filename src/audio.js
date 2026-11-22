// ---------------------------------------------------------------- audio: everything is synthesised, no files
const Sfx = {
  ac: null, out: null, verb: null, muted: false, bed: null, musicT: 0, mood: null, step: 0,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = this.ac;
    this.out = c.createGain(); this.out.gain.value = 0.8;
    const comp = c.createDynamicsCompressor(); this.out.connect(comp); comp.connect(c.destination);
    const d = c.createDelay(1); d.delayTime.value = 0.29; const fb = c.createGain(); fb.gain.value = 0.42;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1900;
    d.connect(lp); lp.connect(fb); fb.connect(d); d.connect(this.out);
    this.verb = c.createGain(); this.verb.gain.value = 0.5; this.verb.connect(d);
  },
  setMuted(m) { this.muted = m; if (this.out) this.out.gain.setTargetAtTime(m ? 0 : 0.8, this.ac.currentTime, 0.05); },
  tone(f, dur, vol = 0.1, type = 'sine', when = 0, slide = 0) {
    const c = this.ac; if (!c) return;
    const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.out); g.connect(this.verb); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol, freq, q = 1, type = 'bandpass', when = 0) {
    const c = this.ac; if (!c) return;
    const n = c.createBufferSource(), b = c.createBuffer(1, Math.max(1, c.sampleRate * dur | 0), c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    n.buffer = b; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = vol; n.connect(f); f.connect(g); g.connect(this.out); g.connect(this.verb); n.start(c.currentTime + when);
  },
  // named effects
  foot() { this.noise(0.06, 0.05, 500 + Math.random() * 300, 2); },
  jump() { this.tone(300, 0.14, 0.05, 'sine', 0, 260); },
  land() { this.noise(0.09, 0.08, 260, 1.5); },
  hood(open) { this.noise(0.05, 0.1, open ? 2600 : 1200, 4); this.tone(open ? 660 : 330, 0.12, 0.04, 'triangle'); },
  lamp() { [523, 659, 784].forEach((f, i) => this.tone(f, 1.4, 0.07, 'sine', i * 0.09)); },
  page() { this.noise(0.18, 0.06, 3000, 1); this.tone(988, 0.9, 0.04, 'sine', 0.05); },
  snuff() { this.noise(0.3, 0.14, 900, 0.8, 'lowpass'); this.tone(180, 0.3, 0.07, 'sawtooth', 0, -90); },
  hurt() { this.tone(160, 0.4, 0.1, 'sawtooth', 0, -80); this.noise(0.25, 0.1, 400, 1); },
  splash() { this.noise(0.5, 0.12, 900, 0.6); },
  clank() { this.tone(140, 0.2, 0.08, 'square'); this.noise(0.12, 0.08, 2400, 5); },
  alert() { this.tone(880, 0.12, 0.07, 'square'); this.tone(1175, 0.2, 0.07, 'square', 0.12); },
  mirror() { this.tone(1320, 0.5, 0.05, 'triangle'); this.noise(0.08, 0.06, 3200, 6); },
  bulb(i) { this.tone([392, 523, 659][i] || 440, 1.6, 0.12, 'triangle'); },
  sour() { this.tone(233, 0.8, 0.08, 'sawtooth'); this.tone(247, 0.8, 0.08, 'sawtooth'); },
  open() { [196, 262, 330, 392].forEach((f, i) => this.tone(f, 1.8, 0.07, 'triangle', i * 0.12)); this.noise(1.2, 0.07, 180, 0.7, 'lowpass'); },
  wing() { this.noise(0.35, 0.1, 300, 0.7, 'lowpass'); },
  roar() { this.tone(70, 1.4, 0.16, 'sawtooth', 0, -30); this.noise(1.2, 0.12, 240, 0.6, 'lowpass'); },
  blip(pitch = 1) { this.tone(420 * pitch + Math.random() * 40, 0.05, 0.035, 'triangle'); },
  swell() { [262, 330, 392, 523, 659, 784].forEach((f, i) => this.tone(f, 7, 0.07, 'triangle', i * 0.4)); },
  thunder() { this.noise(2.2, 0.2, 90, 0.5, 'lowpass'); },
  // ---- ambient bed + slow generative lullaby (C D E G A, "rising, one to five")
  setMood(m) {
    const c = this.ac; this.mood = m; if (!c) return;
    if (this.bed) { const old = this.bed; old.g.gain.setTargetAtTime(0, c.currentTime, 0.6); setTimeout(() => old.o.forEach(o => { try { o.stop(); } catch (e) {} }), 3000); this.bed = null; }
    if (!m) return;
    const g = c.createGain(); g.gain.value = 0; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = m.cut || 380;
    const os = m.drone.map((fr, i) => { const o = c.createOscillator(); o.type = i ? 'triangle' : 'sine'; o.frequency.value = fr; o.detune.value = i * 5; o.connect(f); o.start(); return o; });
    if (m.wind) { // looping filtered noise
      const n = c.createBufferSource(), b = c.createBuffer(1, c.sampleRate * 3, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      n.buffer = b; n.loop = true; const wf = c.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 500; wf.Q.value = 0.6; const wg = c.createGain(); wg.gain.value = m.wind;
      n.connect(wf); wf.connect(wg); wg.connect(g); n.start(); os.push(n);
    }
    f.connect(g); g.connect(this.out); g.gain.setTargetAtTime(0.085, c.currentTime, 1.5);
    this.bed = { g, o: os };
  },
  music(dt) {
    if (!this.ac || !this.mood || !this.mood.scale) return;
    this.musicT -= dt; if (this.musicT > 0) return;
    const m = this.mood, s = m.scale, pat = m.pattern || [0, 1, 2, 3, 4, 3, 2, 4];
    const n = pat[this.step++ % pat.length];
    if (n >= 0) { const f = m.root * Math.pow(2, s[n % s.length] / 12) * (n >= s.length ? 2 : 1); this.tone(f, 2.6, m.vol || 0.045, 'sine'); this.tone(f * 2, 1.2, (m.vol || 0.045) * 0.3, 'sine'); }
    this.musicT = (m.beat || 1.1) * (this.step % 4 === 0 ? 1.6 : 1);
  },
};
const MOODS = {
  hollow: { drone: [55, 82.4], scale: [0, 2, 4, 7, 9], root: 261.6, beat: 1.2 },
  dark:   { drone: [49, 73.4], scale: [0, 3, 5, 7, 10], root: 220, beat: 1.5, vol: 0.035 },
  roots:  { drone: [65.4, 98], scale: [0, 2, 3, 7, 9], root: 196, beat: 1.25 },
  works:  { drone: [46.2, 69.3], scale: [0, 2, 3, 7, 8], root: 174.6, beat: 1.4, vol: 0.04, cut: 300 },
  tower:  { drone: [51.9, 77.8], scale: [0, 2, 5, 7, 9], root: 207.6, beat: 1.3, wind: 0.02 },
  storm:  { drone: [41.2, 61.7], scale: [0, 1, 5, 7, 8], root: 164.8, beat: 0.55, vol: 0.05, wind: 0.07, pattern: [0, 0, 3, 0, 4, 0, 3, 2] },
  dawn:   { drone: [65.4, 98, 130.8], scale: [0, 2, 4, 7, 9], root: 261.6, beat: 0.9, vol: 0.06, cut: 900 },
};
