// ---------------------------------------------------------------- things: particles, dialogue, and everything Nib can touch
const Fx = {
  ps: [],
  add(o) { if (this.ps.length < 500) this.ps.push(Object.assign({ vx: 0, vy: 0, g: 0, life: 1, max: 1, size: 2, col: [255, 230, 170], add: false }, o, { max: o.life || 1 })); },
  dust(x, y, n) { for (let i = 0; i < n; i++) this.add({ x, y, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 30, life: 0.4 + Math.random() * 0.3, size: 2 + Math.random() * 2, col: [150, 140, 170] }); },
  splash(x, y) { for (let i = 0; i < 16; i++) this.add({ x, y, vx: (Math.random() - 0.5) * 160, vy: -80 - Math.random() * 170, g: 600, life: 0.7, size: 2, col: [150, 210, 230] }); },
  spark(x, y, n, col = [255, 220, 150]) { for (let i = 0; i < n; i++) { const a = Math.random() * 7, s = 20 + Math.random() * 90; this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, g: 60, life: 0.5 + Math.random() * 0.7, size: 1.5 + Math.random() * 1.5, col, add: true }); } },
  update(dt) { for (let i = this.ps.length - 1; i >= 0; i--) { const p = this.ps[i]; p.life -= dt; if (p.life <= 0) { this.ps.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; } },
  draw(additive) {
    for (const p of this.ps) { if (!!p.add !== additive) continue; ctx.fillStyle = rgba(p.col, Math.min(1, p.life / p.max * 1.5) * (p.a || 0.8)); ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill(); }
  },
};

// ---- dialogue: a line types itself out; act advances. Scenes are plain async functions.
const CAST = {
  nib: { name: 'Nib', col: [150, 135, 255], pitch: 1.25 }, sorrel: { name: 'Sorrel', col: [255, 200, 120], pitch: 0.95 },
  wick: { name: 'Wick', col: [255, 214, 140], pitch: 0.7 }, fiddle: { name: 'Fiddle', col: [200, 170, 110], pitch: 1.6 },
  brine: { name: 'Brine', col: [120, 220, 220], pitch: 0.55 }, kid: { name: 'Tansy', col: [255, 190, 150], pitch: 1.5 },
  maren: { name: 'Maren’s journal', col: [230, 220, 200], pitch: 1 }, none: { name: '', col: [200, 200, 210], pitch: 1 },
};
const Dialog = {
  cur: null, log: [],
  clear() { if (this.cur && this.cur.res) this.cur.res(0); this.cur = null; },
  say(who, text) { return new Promise(res => { this.cur = { kind: 'say', who, text, n: 0, t: 0, res }; }); },
  choose(who, text, options) { return new Promise(res => { this.cur = { kind: 'choice', who, text, options, n: 0, t: 0, sel: 0, res }; }); },
  press(label) { return new Promise(res => { this.cur = { kind: 'press', who: 'none', text: label, n: 999, t: 0, res }; }); },
  page(title, text) { return new Promise(res => { this.cur = { kind: 'page', who: 'maren', title, text, n: 0, t: 0, res }; }); },
  update(dt) {
    const c = this.cur; if (!c) return;
    c.t += dt;
    const before = Math.floor(c.n);
    c.n = Math.min(c.text.length, c.n + dt * (c.kind === 'page' ? 60 : 38));
    if (Math.floor(c.n) > before && Math.floor(c.n) % 3 === 0 && c.text[Math.floor(c.n) - 1] !== ' ') Sfx.blip(CAST[c.who].pitch);
    const done = c.n >= c.text.length;
    if (c.kind === 'choice' && done) {
      if (I.jumpP || tappedDir(-1)) c.sel = (c.sel + c.options.length - 1) % c.options.length;
      if (tappedDir(1)) c.sel = (c.sel + 1) % c.options.length;
      if (window.__in && window.__in.pick != null) c.sel = window.__in.pick;
    }
    if (I.actP && c.t > 0.15) {
      if (!done) { c.n = c.text.length; return; }
      this.cur = null; c.res(c.kind === 'choice' ? c.sel : 0);
    }
  },
};
let dirPrev = 0;
function tappedDir(d) { const now = (I.down || I.right ? 1 : 0) - (I.up || I.left ? 1 : 0); const hit = now === d && dirPrev !== d; if (d === 1) dirPrev = now; return hit; }

// run a story scene with the player's controls locked and the camera free to move
async function cutscene(fn) {
  if (G.cut) return; G.cut = true;
  try { await fn(); } catch (e) { console.error(e); }
  G.cut = false; G.cam.tx = null; G.cam.tz = 1;
}
const look = (x, y, z = 1.25) => { G.cam.tx = x; G.cam.ty = y; G.cam.tz = z; };

// ---- interactable things
const Things = {
  spawn(L, mark) {
    const def = L.def, add = e => { G.ents.push(e); return e; };
    (mark.L || []).forEach((m, i) => add({ type: 'lamp', x: m.x, y: m.y, lit: 0, idx: i, range: 36 }));
    (mark.q || []).forEach((m, i) => add({ type: 'page', x: m.x, y: m.y - 14, idx: i, got: Save.data.pages.includes(L.n + ':' + i) }));
    (mark.N || []).forEach((m, i) => add(Object.assign({ type: 'npc', x: m.x, y: m.y, idx: i, range: 46, face: -1 }, def.npcs[i])));
    (mark.g || []).forEach(m => add({ type: 'cap', plat: true, x: m.tx * TILE - 4, y: m.ty * TILE + 8, w: TILE + 8, open: 0, hold: 0 }));
    (mark.b || []).forEach((m, i) => add({ type: 'bulb', x: m.x, y: m.y, idx: i, on: 0, range: 34 }));
    (mark.v || []).forEach((m, i) => add({ type: 'valve', x: m.x, y: m.y - 22, idx: i, pos: 0, spin: 0, range: 36 }));
    (mark.m || []).forEach((m, i) => add({
      type: 'mirror', x: m.x, y: m.y - 16, tx: m.tx, ty: m.ty, idx: i,
      st: (def.mirrorStart || [])[i] || 0, range: 64, turn: 0,
    }));
    (mark.e || []).forEach((m, i) => add({ type: 'emitter', x: m.x, y: m.y - 16, tx: m.tx, ty: m.ty, idx: i, dir: def.emitters[i], on: false }));
    (mark.r || []).forEach((m, i) => add({ type: 'receptor', x: m.x, y: m.y - 16, tx: m.tx, ty: m.ty, idx: i, hit: 0, done: false }));
    (mark.D || []).forEach((m, i) => { const s = { x: m.tx * TILE + 6, y: (m.ty - 2) * TILE, w: TILE - 12, h: TILE * 3, on: true }; G.solids.push(s); add({ type: 'door', x: m.x, y: m.y, idx: i, solid: s, open: 0, want: 0 }); });
    (mark.U || []).forEach((m, i) => add({ type: 'lure', x: m.x, y: m.y - 46, idx: i, lit: 0, range: 66 }));
    (mark.c || []).forEach((m, i) => add({ type: 'chalk', x: m.x, y: m.y - 30, idx: i, a: 0, art: (def.chalk || [])[i] }));
    (mark.X || []).forEach(m => add({ type: 'exit', x: m.x, y: m.y, range: 30 }));
    (mark.k || []).forEach((m, i) => add({ type: 'crank', x: m.x, y: m.y, idx: i, done: false, prog: 0, range: 40 }));
    (mark.B || []).forEach((m, i) => add({ type: 'brazier', x: m.x, y: m.y - 30, idx: i, lit: 0, range: 44, cool: 0 }));
    for (let d = 1; d <= 9; d++) (mark[d] || []).forEach(m => add({ type: 'trigger', x: m.x, y: m.y, id: d, fired: false }));
    Enemies.spawn(L, mark);
  },
  door(i, open) { const d = G.ents.filter(e => e.type === 'door')[i]; if (d && d.want !== (open ? 1 : 0)) { d.want = open ? 1 : 0; Sfx.open(); G.cam.shake = 5; } },
  canAct(e, p) {
    switch (e.type) {
      case 'lamp': return !e.lit && p.hasLantern && p.snuffed <= 0;
      case 'npc': return !!e.talk && !e.hidden;
      case 'bulb': case 'valve': case 'mirror': return !e.locked;
      case 'lure': case 'brazier': return p.hasLantern && p.snuffed <= 0 && !e.lit && !(e.cool > 0);
      case 'crank': return !e.done && G.lvl.def.cranksLive;
      case 'exit': return !G.lvl.def.canExit || G.lvl.def.canExit();
    }
    return false;
  },
  label(e) { return { lamp: 'Light', npc: 'Talk', bulb: 'Ring', valve: 'Turn', mirror: 'Turn', lure: 'Light', brazier: 'Light', crank: 'Turn (hold still)', exit: G.lvl.def.exitLabel || 'Go on' }[e.type]; },
  act(e, p) {
    const def = G.lvl.def;
    switch (e.type) {
      case 'lamp': e.lit = 0.01; G.cpIndex = e.idx; Save.data.cp = e.idx; Save.write(); Sfx.lamp(); Fx.spark(e.x, e.y - 40, 14);
        if (!flag('toldLamp')) { flag('toldLamp', 1); toast('Wayside lamp lit. If something goes wrong, you’ll wake up here.'); } break;
      case 'npc': cutscene(() => e.talk(e)); break;
      case 'bulb': def.onBulb(e); break;
      case 'valve': e.pos = (e.pos + 1) % 3; e.spin = 1; Sfx.clank(); def.onValve && def.onValve(); break;
      case 'mirror': e.st = 1 - e.st; e.turn = 1; Sfx.mirror(); break;
      case 'lure': case 'brazier': e.lit = 1; e.burn = 0; Sfx.lamp(); Fx.spark(e.x, e.y, 16); break;
      case 'crank': e.busy = true; break;
      case 'exit': def.onExit ? def.onExit() : nextChapter(); break;
    }
  },
  update(dt) {
    const p = G.player, def = G.lvl.def, pcx = p.x + p.w / 2, pcy = p.y + p.h / 2, lit = Player.lit(p), lp = Player.lanternPos(p);
    let best = null, bd = 1e9;
    for (const e of G.ents) {
      const d = dist(pcx, pcy, e.x, e.y - 14);
      switch (e.type) {
        case 'lamp': if (e.lit > 0 && e.lit < 1) e.lit = Math.min(1, e.lit + dt * 1.5); break;
        case 'page':
          if (!e.got && d < 26 && !G.cut) { e.got = true; Save.data.pages.push(G.n + ':' + e.idx); Save.write(); Sfx.page(); const pg = def.pages[e.idx]; cutscene(async () => { await Dialog.page(pg[0], pg[1]); pg[2] && await pg[2](); }); }
          break;
        case 'cap': {
          const near = lit && dist(lp.x, lp.y, e.x + e.w / 2, e.y) < 170;
          if (near) e.hold = 3.2; else e.hold = Math.max(0, e.hold - dt);
          const want = e.hold > 0 ? 1 : 0; e.open += (want - e.open) * Math.min(1, dt * (want ? 5 : 3));
          break; }
        case 'bulb': e.on = Math.max(0, e.on - dt * 0.0); break;
        case 'valve': e.spin = Math.max(0, e.spin - dt * 2.5); break;
        case 'mirror': e.turn = Math.max(0, e.turn - dt * 4); break;
        case 'door': e.open += (e.want - e.open) * Math.min(1, dt * 1.6); e.solid.on = e.open < 0.6; break;
        case 'chalk': { const want = lit && dist(lp.x, lp.y, e.x, e.y) < 150 ? 1 : 0; e.a += (want - e.a) * Math.min(1, dt * (want ? 2.2 : 1.2)); if (e.a > 0.6 && !e.seen) { e.seen = true; def.onChalk && def.onChalk(e); } break; }
        case 'lure': if (e.lit) e.burn = (e.burn || 0) + dt; break;
        case 'brazier': e.cool = Math.max(0, (e.cool || 0) - dt); break;
        case 'crank':
          if (e.busy) {
            if (d > 44 || p.stun > 0 || Math.abs(p.vx) > 40) { e.busy = false; e.prog = Math.max(0, e.prog - 0.15); }
            else { e.prog += dt / 2.2; if (Math.random() < dt * 10) Sfx.noise(0.04, 0.05, 1500, 6); if (e.prog >= 1) { e.done = true; e.busy = false; Sfx.mirror(); Sfx.open(); def.onCrank(e); } }
          }
          break;
        case 'trigger': if (!e.fired && !G.cut && Math.abs(pcx - e.x) < 20 && Math.abs(pcy - (e.y - 16)) < 110) { e.fired = true; def.triggers[e.id] && def.triggers[e.id](e); } break;
        case 'receptor': e.hit = Math.max(0, e.hit - dt * 3); break;
      }
      if (!G.cut && e.range && d < e.range && d < bd && this.canAct(e, p)) { best = e; bd = d; }
    }
    G.prompt = best;
    if (best && I.actP && !G.cut && !Dialog.cur) this.act(best, p);
    this.traceBeams(dt);
  },
  // light beams: follow each emitter cell by cell, bouncing off mirrors, until a wall or a receptor
  traceBeams(dt) {
    G.beams = [];
    const mirrors = {}, recs = {};
    for (const e of G.ents) { if (e.type === 'mirror') mirrors[e.tx + ',' + e.ty] = e; if (e.type === 'receptor') recs[e.tx + ',' + e.ty] = e; }
    for (const em of G.ents) {
      if (em.type !== 'emitter' || !em.on) continue;
      let x = em.tx, y = em.ty, [dx, dy] = em.dir; const pts = [[em.x, em.y]];
      for (let i = 0; i < 80; i++) {
        x += dx; y += dy;
        const cx = x * TILE + TILE / 2, cy = y * TILE + TILE / 2;
        if (SOLID[tileAt(x, y)] || solidAt(cx, cy)) { pts.push([cx - dx * TILE / 2, cy - dy * TILE / 2]); break; }
        const r = recs[x + ',' + y]; if (r) { pts.push([cx, cy]); r.hit = 1; if (!r.done) { r.done = true; G.lvl.def.onReceptor && G.lvl.def.onReceptor(r); } break; }
        const m = mirrors[x + ',' + y];
        if (m) {
          pts.push([cx, cy]);
          if (m.st === 0) [dx, dy] = [-dy, -dx];   // a '/' mirror: swap and flip
          else [dx, dy] = [dy, dx];                // a '\' mirror: just swap
        }
        if (i === 79) pts.push([cx, cy]);
      }
      G.beams.push(pts);
    }
  },
};
function nextChapter() {
  if (G.leaving) return; G.leaving = true;
  fadeTo(() => { G.leaving = false; Save.data.cp = null; startChapter(G.n + 1); });
}
