// ---------------------------------------------------------------- world: tile map, collision, level loading
const G = { lvl: null, n: 0, t: 0, ents: [], solids: [], water: [], player: null, cam: { x: 0, y: 0, zoom: 1, tx: null, ty: null, tz: 1, shake: 0 },
  cut: false, mode: 'title', fade: 1, fadeDir: -1, fadeCb: null, toast: null, cpIndex: 0, sky: 0 };

const SOLID = { '#': 1 };
function tileAt(tx, ty) { const L = G.lvl; if (ty < 0) return ' '; if (tx < 0 || tx >= L.w || ty >= L.h) return '#'; return L.tiles[ty][tx]; }
function solidAt(px, py) {
  if (SOLID[tileAt(Math.floor(px / TILE), Math.floor(py / TILE))]) return true;
  for (const s of G.solids) if (s.on && px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h) return true;
  return false;
}
function rectHitsSolid(x, y, w, h) {
  const x0 = Math.floor(x / TILE), x1 = Math.floor((x + w - 0.01) / TILE), y0 = Math.floor(y / TILE), y1 = Math.floor((y + h - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (SOLID[tileAt(tx, ty)]) return true;
  for (const s of G.solids) if (s.on && x < s.x + s.w && x + w > s.x && y < s.y + s.h && y + h > s.y) return true;
  return false;
}
// move a body one axis at a time, so it slides along walls and floors
function moveBody(b, dt) {
  let dx = b.vx * dt, dy = b.vy * dt;
  b.hitWall = false;
  if (dx) {
    const step = Math.sign(dx) * Math.min(Math.abs(dx), 8); let left = Math.abs(dx);
    while (left > 0) { const s = Math.sign(dx) * Math.min(left, 8); if (rectHitsSolid(b.x + s, b.y, b.w, b.h)) { b.vx = 0; b.hitWall = true; break; } b.x += s; left -= Math.abs(s); }
  }
  const wasGround = b.onGround; b.onGround = false;
  if (dy) {
    let left = Math.abs(dy);
    while (left > 0) {
      const s = Math.sign(dy) * Math.min(left, 8);
      let blocked = rectHitsSolid(b.x, b.y + s, b.w, b.h);
      // one-way platforms: only when falling onto them from above
      if (!blocked && s > 0 && !b.dropThrough) {
        const footNow = b.y + b.h, footNext = footNow + s;
        const ty = Math.ceil((footNow - 0.01) / TILE), edge = ty * TILE;   // the next tile row boundary below the feet
        let landY = null;
        if (edge <= footNext + 0.001)
          for (let tx = Math.floor(b.x / TILE); tx <= Math.floor((b.x + b.w - 0.01) / TILE); tx++) if (tileAt(tx, ty) === '=') landY = edge;
        for (const p of G.ents) if (p.plat && p.open > 0.6 && b.x + b.w > p.x && b.x < p.x + p.w && footNow <= p.y + 0.01 && footNext >= p.y) landY = p.y;
        if (landY != null) { b.y = landY - b.h; b.onGround = true; b.vy = 0; break; }
      }
      if (blocked) { if (s > 0) b.onGround = true; b.vy = 0; break; }
      b.y += s; left -= Math.abs(s);
    }
  } else if (wasGround) { b.onGround = rectHitsSolid(b.x, b.y + 1, b.w, b.h); }
}
function los(ax, ay, bx, by) {
  const d = dist(ax, ay, bx, by), n = Math.ceil(d / 10);
  for (let i = 1; i < n; i++) { const t = i / n; if (solidAt(lerp(ax, bx, t), lerp(ay, by, t))) return false; }
  return true;
}
function inWater(x, y) {
  for (const w of G.water) if (x >= w.x && x < w.x + w.w && y > w.surf() + 8 && y < w.y + w.h) return w;
  return null;
}

function loadLevel(n, fromSave) {
  const def = LEVELS[n], L = { def, n, w: def.map[0].length, h: def.map.length, tiles: def.map.map(r => r.split('')), marks: {} };
  for (const r of def.map) if (r.length !== L.w) console.error('level ' + n + ' row width mismatch', r.length, L.w);
  G.lvl = L; G.n = n; G.ents = []; G.solids = []; G.water = []; G.t = 0; G.cut = false; G.toast = null;
  timers.length = 0; Dialog.clear();
  const mark = {}; // letter -> list of tile coords, sorted left to right
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    const c = L.tiles[y][x];
    if ('#=H^w '.includes(c)) continue;
    (mark[c] = mark[c] || []).push({ tx: x, ty: y, x: x * TILE + TILE / 2, y: y * TILE + TILE });
    L.tiles[y][x] = (def.map[y][x - 1] === 'w' || def.map[y][x + 1] === 'w') ? 'w' : ' ';   // a marker placed in water stays water
  }
  for (const k in mark) mark[k].sort((a, b) => a.x - b.x || a.y - b.y);
  L.marks = mark;
  // water regions: runs of 'w' columns that share a surface row
  const seen = {};
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    if (L.tiles[y][x] !== 'w' || seen[x + ',' + y] || tileAt(x, y - 1) === 'w') continue;
    let x1 = x; while (x1 + 1 < L.w && L.tiles[y][x1 + 1] === 'w' && tileAt(x1 + 1, y - 1) !== 'w') x1++;
    let y1 = y; while (y1 + 1 < L.h && L.tiles[y1 + 1][x] === 'w') y1++;
    for (let yy = y; yy <= y1; yy++) for (let xx = x; xx <= x1; xx++) seen[xx + ',' + yy] = 1;
    const w = { x: x * TILE, y: y * TILE, w: (x1 - x + 1) * TILE, h: (y1 - y + 1) * TILE, drain: 0, drained: false, id: G.water.length };
    w.surf = () => w.y + 8 + w.drain * (w.h - 4);
    G.water.push(w);
  }
  Things.spawn(L, mark);
  def.setup && def.setup(L, mark);
  // player start: checkpoint from a save, else 'P'
  const lamps = G.ents.filter(e => e.type === 'lamp');
  let sx = mark.P[0].x, sy = mark.P[0].y;
  G.cpIndex = -1;
  if (fromSave != null && lamps[fromSave]) { const l = lamps[fromSave]; l.lit = 1; sx = l.x; sy = l.y; G.cpIndex = fromSave; for (let i = 0; i < fromSave; i++) lamps[i].lit = 1; }
  G.player = Player.make(sx, sy);
  G.cam.x = sx; G.cam.y = sy - 60; G.cam.tx = null; G.cam.zoom = G.cam.tz = 1;
  Render.buildLevel(L);
  Light.buildStatic();
  Sfx.setMood(MOODS[def.mood]);
  Save.data.chapter = n; Save.data.cp = fromSave != null ? fromSave : null; Save.write();
  def.enter && def.enter(L, fromSave != null);
}

function respawn(why) {
  if (G.dying) return; G.dying = true; Sfx.hurt(); G.cam.shake = 10;
  fadeTo(() => {
    const lamps = G.ents.filter(e => e.type === 'lamp'), p = G.player;
    const l = lamps[G.cpIndex], m = G.lvl.marks.P[0];
    p.x = (l ? l.x : m.x) - p.w / 2; p.y = (l ? l.y : m.y) - p.h; p.vx = p.vy = 0; p.snuffed = 0; p.climb = false;
    for (const e of G.ents) e.reset && e.reset();
    G.dying = false; if (why) toast(why);
  }, 3);
}
function fadeTo(cb, speed = 1.6) { G.fadeDir = speed; G.fadeCb = cb; }
function stepFade(dt) {
  if (G.fadeDir > 0) { G.fade = Math.min(1, G.fade + dt * G.fadeDir); if (G.fade >= 1) { const cb = G.fadeCb; G.fadeCb = null; G.fadeDir = -1.4; cb && cb(); } }
  else if (G.fadeDir < 0) { G.fade = Math.max(0, G.fade + dt * G.fadeDir); if (G.fade <= 0) G.fadeDir = 0; }
}
function toast(text, sec = 3.6) { G.toast = { text, t: sec, max: sec }; }
