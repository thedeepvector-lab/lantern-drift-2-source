// ---------------------------------------------------------------- core: canvas, input, helpers, save
const TILE = 32, VH = 540;
const cv = document.getElementById('c'); let ctx = cv.getContext('2d');
const stage = document.getElementById('stage');
let VW = 960, SC = 1, DPR = 1;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function resize() {
  DPR = window.__dpr || Math.min(2, window.devicePixelRatio || 1);   // __dpr: fixed scale for the capture rig
  const w = stage.clientWidth, h = stage.clientHeight;
  cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
  SC = cv.height / VH; VW = cv.width / SC;
  if (typeof Light !== 'undefined') Light.resize();
}
addEventListener('resize', resize);

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// ---- input: keyboard, touch buttons, and a test hook (window.__in)
const held = {}, tapped = {};
const KEYMAP = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
  ' ': 'jump', z: 'jump', e: 'act', enter: 'act', x: 'act', q: 'hood', shift: 'hood', f: 'hood', escape: 'pause', p: 'pause', j: 'journal' };
addEventListener('keydown', e => {
  const k = KEYMAP[e.key.toLowerCase()]; if (!k) return;
  if (!held[k]) tapped[k] = true; held[k] = true;
  if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();
});
addEventListener('keyup', e => { const k = KEYMAP[e.key.toLowerCase()]; if (k) held[k] = false; });
addEventListener('blur', () => { for (const k in held) held[k] = false; });
const I = { left: false, right: false, up: false, down: false, jump: false, jumpP: false, actP: false, hoodP: false, pauseP: false, journalP: false };
let botPrev = {};
function pollInput() {
  const b = window.__in || {};
  for (const k of ['left', 'right', 'up', 'down', 'jump']) I[k] = !!(held[k] || b[k]);
  I.jumpP = !!(tapped.jump || tapped.up && false || (b.jump && !botPrev.jump));
  I.actP = !!(tapped.act || (b.act && !botPrev.act));
  I.hoodP = !!(tapped.hood || (b.hood && !botPrev.hood));
  I.pauseP = !!tapped.pause; I.journalP = !!tapped.journal;
  botPrev = Object.assign({}, b);
  for (const k in tapped) tapped[k] = false;
}
// touch buttons (shown only on touch devices)
document.querySelectorAll('[data-k]').forEach(el => {
  const k = el.dataset.k;
  const on = e => { e.preventDefault(); if (!held[k]) tapped[k] = true; held[k] = true; };
  const off = e => { e.preventDefault(); held[k] = false; };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
});
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') document.body.classList.add('is-touch'); }, { once: false });

// ---- save (best effort: storage can be unavailable)
const SAVE_KEY = 'lantern-drift-2-v1';
const Save = {
  data: { chapter: 1, cp: null, flags: {}, pages: [], done: false, endings: [] },
  load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && typeof s === 'object') this.data = Object.assign(this.data, s); } catch (e) {} },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) {} },
  reset() { this.data = { chapter: 1, cp: null, flags: {}, pages: [], done: false, endings: this.data.endings || [] }; this.write(); },
};
Save.load();
const flag = (k, v) => { if (v === undefined) return Save.data.flags[k]; Save.data.flags[k] = v; };

// ---- game-time timers (not setTimeout, so pausing and tests stay exact)
const timers = [];
function after(sec, fn) { timers.push({ t: sec, fn }); }
const wait = sec => new Promise(res => after(sec, res));
function stepTimers(dt) {
  for (let i = timers.length - 1; i >= 0; i--) { const t = timers[i]; t.t -= dt; if (t.t <= 0) { timers.splice(i, 1); t.fn(); } }
}
