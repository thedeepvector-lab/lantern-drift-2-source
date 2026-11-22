// ---------------------------------------------------------------- enemies: each one wants light, in its own way
const Enemies = {
  spawn(L, mark) {
    const def = L.def, add = e => { G.ents.push(e); return e; };
    (mark.S || []).forEach(m => add({ type: 'snuff', hx: m.x, hy: m.y - TILE + 10, x: m.x, y: m.y - TILE + 10, st: 'roost', t: 0, flap: Math.random() * 6,
      reset() { this.x = this.hx; this.y = this.hy; this.st = 'roost'; this.t = 0; } }));
    (mark.M || []).forEach(m => { const w = G.water.find(w => m.x >= w.x && m.x < w.x + w.w && m.y > w.y) || G.water[0];
      add({ type: 'mire', w, x: m.x, y: w.surf() + 26, hx: m.x, st: 'swim', t: Math.random() * 5, cool: 0, vy: 0, dir: 1, reset() { this.st = 'swim'; this.x = this.hx; this.cool = 1; } }); });
    (mark.W || []).forEach((m, i) => { const r = (def.wardens || [])[i] || {};
      add({ type: 'warden', x: m.x, y: m.y, hx: m.x, a: (r.a != null ? r.a : m.tx - 5) * TILE, b: (r.b != null ? r.b : m.tx + 5) * TILE + TILE, dir: 1, st: 'patrol', t: 0, roll: 0, seen: 0,
        reset() { this.x = this.hx; this.st = 'patrol'; this.t = 0; this.lamp = null; } }); });
    (mark.O || []).forEach(m => add({ type: 'umbra', x: m.x, y: m.y - 120, hx: m.x, hy: m.y - 150, st: 'wait', t: 0, flap: 0, gold: 0, tx: m.x, ty: m.y - 150, cool: 2, vx: 0, vy: 0 }));
  },
  update(dt) {
    const p = G.player, lit = Player.lit(p), lp = Player.lanternPos(p), pcx = p.x + p.w / 2, pcy = p.y + p.h / 2;
    for (const e of G.ents) {
      if (e.type === 'snuff') this.snuff(e, dt, p, lit, lp);
      else if (e.type === 'mire') this.mire(e, dt, p, lit, lp, pcx, pcy);
      else if (e.type === 'warden') this.warden(e, dt, p, lit, pcx, pcy);
      else if (e.type === 'umbra') this.umbra(e, dt, p, lit, lp, pcx, pcy);
    }
  },
  // Snuff: sleeps on the ceiling. A lit lantern in view wakes it; it dives and puts the lantern out. Hooded, you're invisible to it.
  snuff(e, dt, p, lit, lp) {
    e.t += dt; e.flap += dt * (e.st === 'roost' ? 2 : 22);
    const d = dist(e.x, e.y, lp.x, lp.y);
    if (e.st === 'roost') {
      // it only wakes for a lit lantern it can actually see
      const seen = lit && d < 250 && los(e.x, e.y + 6, lp.x, lp.y);
      if (seen && !G.cut) { e.st = 'wake'; e.t = 0; Sfx.wing(); }
    }
    else if (e.st === 'wake') { if (e.t > 0.45) { e.st = 'dive'; e.t = 0; e.gx = lp.x; e.gy = lp.y; } }
    else if (e.st === 'dive') {
      if (lit) { e.gx = lp.x; e.gy = lp.y; }           // keeps homing only while it can see the light
      const dd = dist(e.x, e.y, e.gx, e.gy) || 1; e.x += (e.gx - e.x) / dd * 330 * dt; e.y += (e.gy - e.y) / dd * 330 * dt;
      if (lit && d < 16) { p.snuffed = 2.8; p.stun = 0.25; p.vx = Math.sign(p.x - e.x || 1) * 120; Sfx.snuff(); Fx.spark(lp.x, lp.y, 10, [180, 170, 200]); G.cam.shake = 6; e.st = 'back'; if (!flag('toldSnuff')) { flag('toldSnuff', 1); toast('A Snuff put your lantern out. It will catch again in a moment. Hooded, they can’t see you.'); } }
      else if (dd < 10 || e.t > 1.8) e.st = 'back';
    } else { const dd = dist(e.x, e.y, e.hx, e.hy); if (dd < 6) { e.st = 'roost'; e.x = e.hx; e.y = e.hy; } else { e.x += (e.hx - e.x) / dd * 170 * dt; e.y += (e.hy - e.y) / dd * 170 * dt; } }
  },
  // Mireling: follows light along under the surface and leaps at it. A lit lure lamp draws it away.
  mire(e, dt, p, lit, lp, pcx, pcy) {
    const w = e.w, surf = w.surf(); e.t += dt; e.cool = Math.max(0, e.cool - dt);
    if (w.drain > 0.5) { e.st = 'gone'; return; }
    if (e.st === 'swim') {
      let tx = e.hx + Math.sin(e.t * 0.5) * Math.min(90, w.w / 3), chasing = false;
      const lure = G.ents.find(l => l.type === 'lure' && l.lit && Math.abs(l.x - (w.x + w.w / 2)) < w.w / 2 + 200);
      if (lure) { tx = lure.x; chasing = true; }
      else if (lit && lp.x > w.x - 60 && lp.x < w.x + w.w + 60 && lp.y < surf + 20 && lp.y > surf - 170) { tx = lp.x; chasing = true; }
      tx = clamp(tx, w.x + 22, w.x + w.w - 22);
      const dx = tx - e.x; e.dir = Math.sign(dx) || e.dir; e.x += clamp(dx, -1, 1) * (chasing ? 130 : 45) * dt * Math.min(1, Math.abs(dx) / 6);
      e.y = surf + 24 + Math.sin(e.t * 2) * 3; e.chasing = chasing;
      if (!lure && lit && !G.cut && e.cool <= 0 && Math.abs(lp.x - e.x) < 30 && lp.y > surf - 150) { e.st = 'leap'; e.vy = -Math.sqrt(2 * 1100 * Math.max(60, surf - lp.y + 30)); Sfx.splash(); Fx.splash(e.x, surf); }
    } else if (e.st === 'leap') {
      e.vy += 1100 * dt; e.y += e.vy * dt;
      if (dist(e.x, e.y, pcx, pcy) < 24 && !G.dying) respawn('Something in the water wanted your light. Try crossing hooded.');
      if (e.y > surf + 24 && e.vy > 0) { e.st = 'swim'; e.cool = 1.4; Fx.splash(e.x, surf); Sfx.splash(); }
    }
  },
  // Warden: clockwork patrol. Sees a lit lantern from far off, a hooded one only up close. Leaves its post to snuff any big lamp left burning.
  warden(e, dt, p, lit, pcx, pcy) {
    e.t += dt; const dx = pcx - e.x, dy = pcy - (e.y - 26);
    const facing = Math.sign(dx) === e.dir, sees = !G.cut && facing && Math.abs(dy) < 58 && Math.abs(dx) < (lit ? 240 : 66) && los(e.x, e.y - 40, pcx, pcy);
    const walk = (speed) => { const nx = e.x + e.dir * speed * dt; if (solidAt(nx + e.dir * 14, e.y - 20) || !solidAt(nx + e.dir * 10, e.y + 6)) return false; e.x = nx; e.roll += speed * dt / 9; return true; };
    if (e.st === 'patrol' || e.st === 'tend' || e.st === 'snuffing') {
      if (sees && (e.st === 'patrol' || Math.abs(dx) < 70)) { e.st = 'alert'; e.t = 0; Sfx.alert(); return; }
    }
    if (e.st === 'patrol') {
      const lure = G.ents.find(l => l.type === 'lure' && l.lit && Math.abs(l.x - e.x) < 460 && Math.abs(l.y + 46 - e.y) < 50);
      if (lure) { e.st = 'tend'; e.lamp = lure; return; }
      if (e.x > e.b) e.dir = -1; else if (e.x < e.a) e.dir = 1;
      if (!walk(55)) e.dir *= -1;
    } else if (e.st === 'tend') {
      e.dir = Math.sign(e.lamp.x - e.x) || 1;
      if (Math.abs(e.lamp.x - e.x) < 22) { e.st = 'snuffing'; e.t = 0; } else if (!walk(95)) { e.st = 'patrol'; }
    } else if (e.st === 'snuffing') {
      if (e.t > 4.5) { e.lamp.lit = 0; Sfx.snuff(); e.st = 'patrol'; e.lamp = null; }
    } else if (e.st === 'alert') {
      e.dir = Math.sign(dx) || e.dir; if (e.t > 0.5) { e.st = 'chase'; e.t = 0; e.lost = 0; }
    } else if (e.st === 'chase') {
      e.dir = Math.sign(dx) || e.dir; walk(205);
      const visible = Math.abs(dy) < 70 && Math.abs(dx) < 300 && (lit || Math.abs(dx) < 90) && los(e.x, e.y - 40, pcx, pcy);
      e.lost = visible ? 0 : e.lost + dt;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 44 && !G.dying) { respawn('A warden put you out and carried you back to the last lamp.'); e.st = 'patrol'; }
      else if (e.lost > 1.3) e.st = 'patrol';
    }
  },
  // Umbra: the great dusk-moth. Goes to the brightest thing: a lit brazier, then a lit lantern, then the Heartflame itself.
  umbra(e, dt, p, lit, lp, pcx, pcy) {
    const def = G.lvl.def; e.t += dt; e.flap += dt * (e.st === 'swoop' ? 16 : 9); e.cool = Math.max(0, e.cool - dt);
    const fly = (tx, ty, sp) => { const d = dist(e.x, e.y, tx, ty) || 1; const s = Math.min(sp * dt, d); e.x += (tx - e.x) / d * s; e.y += (ty - e.y) / d * s; return d < 12; };
    if (Math.random() < dt * 14) Fx.add({ x: e.x + (Math.random() - 0.5) * 120, y: e.y + 20, vy: 30, vx: (Math.random() - 0.5) * 20, life: 1.4, size: 1.5, col: e.gold > 0.5 ? [255, 220, 150] : [170, 150, 200], a: 0.5 });
    if (e.st === 'wait' || e.st === 'calm') { e.y = e.hy + Math.sin(e.t * 1.3) * 10; if (e.st === 'calm') { e.gold = Math.min(1, e.gold + dt * 0.5); fly(def.lens.x, def.lens.y - 90, 60); } return; }
    const done = G.ents.filter(c => c.type === 'crank' && c.done).length;
    const brz = G.ents.filter(b => b.type === 'brazier' && b.lit).sort((a, b) => dist(e.x, e.y, a.x, a.y) - dist(e.x, e.y, b.x, b.y))[0];
    if (e.st === 'hunt') {
      if (brz) { e.st = 'tobrazier'; e.target = brz; }
      else if (lit && e.cool <= 0) { e.st = 'aim'; e.t = 0; Sfx.wing(); }
      else if (!lit) { e.st = 'toflame'; }
      else fly(e.hx + Math.sin(e.t * 0.7) * 260, e.hy + Math.sin(e.t * 1.1) * 30, 150);
    } else if (e.st === 'tobrazier') {
      if (!e.target.lit) { e.st = 'hunt'; return; }
      if (fly(e.target.x, e.target.y - 50, 230)) { e.st = 'batter'; e.t = 0; }
    } else if (e.st === 'batter') {
      e.x = e.target.x + Math.sin(e.t * 9) * 16; e.y = e.target.y - 50 + Math.cos(e.t * 7) * 8;
      if (Math.random() < dt * 6) Fx.spark(e.target.x, e.target.y, 2);
      const hold = (flag('fiddleAlly') ? 8.5 : 6) - done * 0.8;
      if (e.t > hold) { e.target.lit = 0; e.target.cool = 5; Sfx.snuff(); e.st = 'hunt'; e.cool = 1.2; }
    } else if (e.st === 'aim') {
      fly(clamp(pcx - Math.sign(pcx - e.x || 1) * 200, 80, G.lvl.w * TILE - 80), pcy - 150, 200);
      if (brz) { e.st = 'tobrazier'; e.target = brz; } else if (!lit) e.st = 'hunt';
      else if (e.t > 1.0) { e.st = 'swoop'; e.t = 0; const d = dist(e.x, e.y, pcx, pcy) || 1; e.vx = (pcx - e.x) / d * 440; e.vy = (pcy - e.y) / d * 440; Sfx.roar(); }
    } else if (e.st === 'swoop') {
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (dist(e.x, e.y, pcx, pcy) < 40 && p.stun <= 0) { p.snuffed = 3; p.stun = 0.5; p.vx = Math.sign(e.vx || 1) * 260; p.vy = -220; Sfx.snuff(); G.cam.shake = 12; Fx.spark(pcx, pcy, 14, [190, 170, 220]); }
      if (e.t > 0.9) { e.st = 'hunt'; e.cool = 2.2; }
    } else if (e.st === 'toflame') {
      if (brz) { e.st = 'tobrazier'; e.target = brz; return; }
      if (lit && e.cool <= 0) { e.st = 'aim'; e.t = 0; Sfx.wing(); return; }
      const f = def.flamePos; const at = fly(f.x + Math.sin(e.t * 8) * 14, f.y - 46, 190);
      if (dist(e.x, e.y, f.x, f.y - 46) < 40) { def.flame = Math.max(0, def.flame - 9 * dt); if (Math.random() < dt * 5) Fx.spark(f.x, f.y - 10, 2); if (def.flame <= 0 && !G.dying) def.onFlameOut(); }
    }
  },
};
