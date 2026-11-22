// ---------------------------------------------------------------- render: backgrounds, tiles, water, fog, and the frame itself
const THEME = {
  hollow: { sky: ['#0c0919', '#1c1335'], rock: [40, 30, 66], hi: [96, 76, 140], top: [122, 98, 170], fog: [130, 105, 200], tint: [5, 3, 14], amb: 0.72, brick: false, mote: [200, 170, 255] },
  roots:  { sky: ['#07110f', '#10241f'], rock: [38, 44, 40], hi: [70, 96, 78], top: [88, 140, 96], fog: [90, 170, 140], tint: [2, 7, 6], amb: 0.74, brick: false, mote: [160, 240, 190] },
  works:  { sky: ['#080d14', '#141f2c'], rock: [44, 50, 60], hi: [86, 98, 112], top: [120, 104, 84], fog: [100, 140, 180], tint: [2, 5, 9], amb: 0.74, brick: true, mote: [170, 200, 230] },
  tower:  { sky: ['#0a0c16', '#1a1d30'], rock: [58, 56, 68], hi: [104, 102, 120], top: [130, 126, 144], fog: [150, 160, 200], tint: [4, 5, 11], amb: 0.72, brick: true, mote: [220, 220, 240] },
  lamp:   { sky: ['#05060d', '#141826'], rock: [52, 52, 64], hi: [100, 100, 118], top: [128, 126, 142], fog: [160, 170, 210], tint: [4, 5, 11], amb: 0.7, brick: true, mote: [230, 230, 250] },
};
const Render = {
  layer: null, K: 1, bgFar: null, bgMid: null, fog: null, motes: [],
  worldTransform(c, k) {
    const z = SC * G.cam.zoom * k, sh = G.cam.shake;
    const ox = sh ? (Math.random() - 0.5) * sh : 0, oy = sh ? (Math.random() - 0.5) * sh : 0;
    c.setTransform(z, 0, 0, z, cv.width * k / 2 - (G.cam.x + ox) * z, cv.height * k / 2 - (G.cam.y + oy) * z);
  },
  buildLevel(L) {
    const th = THEME[L.def.theme], r = rng(L.n * 131 + 7);
    const K = this.K = Math.min(2, Math.sqrt(14e6 / (L.w * TILE * L.h * TILE)));
    const c = this.layer = document.createElement('canvas'); c.width = Math.ceil(L.w * TILE * K); c.height = Math.ceil(L.h * TILE * K);
    const g = c.getContext('2d'); g.scale(K, K);
    const S = (x, y) => SOLID[tileAt(x, y)];
    const shade = (col, k) => `rgb(${col.map(v => clamp(v * k, 0, 255) | 0).join(',')})`;
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      const t = L.tiles[y][x], px = x * TILE, py = y * TILE;
      if (t === '#') {
        const depth = (S(x, y - 1) ? 1 : 0) + (S(x, y + 1) ? 1 : 0) + (S(x - 1, y) ? 1 : 0) + (S(x + 1, y) ? 1 : 0);
        g.fillStyle = shade(th.rock, depth === 4 ? 0.6 + r() * 0.03 : 0.94 + r() * 0.12); g.fillRect(px, py, TILE + 0.5, TILE + 0.5);
        if (th.brick && depth < 4) { g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 1; for (let k = 0; k < 2; k++) { const yy = py + k * 16 + 0.5; g.beginPath(); g.moveTo(px, yy); g.lineTo(px + TILE, yy); g.moveTo(px + (k ? 8 : 24), yy); g.lineTo(px + (k ? 8 : 24), yy + 16); g.stroke(); } }
        else for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`; g.fillRect(px + r() * 26, py + r() * 26, 3 + r() * 6, 2 + r() * 4); }
        if (!S(x, y - 1)) { g.fillStyle = shade(th.top, 1); g.fillRect(px, py, TILE + 0.5, 4); g.fillStyle = shade(th.top, 0.7); g.fillRect(px, py + 4, TILE + 0.5, 2);
          if (!th.brick) for (let k = 0; k < 3; k++) if (r() < 0.6) { const tx = px + 3 + r() * 26; g.strokeStyle = shade(th.top, 1.15); g.lineWidth = 1.4; g.beginPath(); g.moveTo(tx, py); g.quadraticCurveTo(tx + (r() - 0.5) * 6, py - 5, tx + (r() - 0.5) * 9, py - 6 - r() * 5); g.stroke(); } }
        if (!S(x - 1, y)) { g.fillStyle = shade(th.hi, 0.9); g.fillRect(px, py, 2, TILE); }
        if (!S(x + 1, y)) { g.fillStyle = shade(th.rock, 0.5); g.fillRect(px + TILE - 2, py, 2, TILE); }
        if (!S(x, y + 1)) { g.fillStyle = shade(th.rock, 0.45); g.fillRect(px, py + TILE - 3, TILE + 0.5, 3);
          if (!th.brick && r() < 0.45 && tileAt(x, y + 1) === ' ') { const hh = 8 + r() * 22, tx = px + 6 + r() * 20; g.fillStyle = shade(th.rock, 0.8); g.beginPath(); g.moveTo(tx - 5, py + TILE); g.lineTo(tx + 5, py + TILE); g.lineTo(tx + (r() - 0.5) * 3, py + TILE + hh); g.fill(); }
          if (L.def.theme === 'roots' && r() < 0.3 && tileAt(x, y + 1) === ' ') { g.strokeStyle = 'rgba(96,150,104,0.7)'; g.lineWidth = 1.5; const len = 20 + r() * 60, tx = px + 8 + r() * 16; g.beginPath(); g.moveTo(tx, py + TILE); g.bezierCurveTo(tx + 6, py + TILE + len * 0.4, tx - 6, py + TILE + len * 0.7, tx + 2, py + TILE + len); g.stroke(); }
          if (th.brick && r() < 0.12 && tileAt(x, y + 1) === ' ') { g.strokeStyle = 'rgba(120,128,140,0.7)'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(px + 16, py + TILE); g.lineTo(px + 16, py + TILE + 30 + r() * 50); g.stroke(); g.setLineDash([]); } }
      } else if (t === '=') {
        g.fillStyle = L.def.theme === 'roots' ? '#5a4a34' : '#6a5a48'; g.fillRect(px, py, TILE + 0.5, 7); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(px, py, TILE + 0.5, 2);
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(px, py + 7, TILE + 0.5, 2); g.fillRect(px + 15, py, 1, 7);
      } else if (t === 'H') {
        if (L.def.theme === 'roots' || L.def.theme === 'hollow') { g.strokeStyle = '#4f7a55'; g.lineWidth = 3; g.beginPath(); g.moveTo(px + 16, py); g.bezierCurveTo(px + 22, py + 10, px + 10, py + 22, px + 16, py + TILE); g.stroke();
          g.fillStyle = '#6fa873'; for (let k = 0; k < 2; k++) { g.beginPath(); g.ellipse(px + (k ? 22 : 10), py + 8 + k * 14, 5, 2.5, k ? 0.5 : -0.5, 0, 7); g.fill(); } }
        else { g.strokeStyle = '#7d705e'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px + 8, py); g.lineTo(px + 8, py + TILE); g.moveTo(px + 24, py); g.lineTo(px + 24, py + TILE); g.stroke(); g.lineWidth = 2; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(px + 8, py + 5 + k * 11); g.lineTo(px + 24, py + 5 + k * 11); g.stroke(); } }
      } else if (t === '^') {
        g.fillStyle = L.def.theme === 'roots' ? '#7a3f52' : '#8a8f9a';
        for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(px + k * 8, py + TILE); g.lineTo(px + k * 8 + 4, py + 12 + r() * 6); g.lineTo(px + k * 8 + 8, py + TILE); g.fill(); }
      }
    }
    this.buildBackdrop(L.def.theme, L.n);
    // drifting fog texture
    if (!this.fog) { const f = this.fog = document.createElement('canvas'); f.width = 512; f.height = 256; const fg = f.getContext('2d'), fr = rng(99);
      for (let i = 0; i < 46; i++) { const x = fr() * 512, y = fr() * 256, rad = 40 + fr() * 70; for (const ox of [-512, 0, 512]) { const gr = fg.createRadialGradient(x + ox, y, 0, x + ox, y, rad); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); fg.fillStyle = gr; fg.fillRect(x + ox - rad, y - rad, rad * 2, rad * 2); } } }
    this.motes = Array.from({ length: 46 }, () => ({ x: Math.random() * 1200, y: Math.random() * VH, s: 0.8 + Math.random() * 1.6, v: 4 + Math.random() * 10, p: Math.random() * 6 }));
  },
  buildBackdrop(theme, n) {
    const th = THEME[theme], r = rng(n * 53 + 1), mk = () => { const c = document.createElement('canvas'); c.width = 1600; c.height = 540; return c; };
    const far = this.bgFar = mk(), mid = this.bgMid = mk(), f = far.getContext('2d'), m = mid.getContext('2d');
    const col = (k, a) => `rgba(${th.rock.map(v => v * k | 0).join(',')},${a})`;
    if (theme === 'hollow' || theme === 'roots') {
      for (let i = 0; i < 26; i++) { const x = r() * 1600, w = 30 + r() * 90, h = 60 + r() * 220; f.fillStyle = col(0.55, 0.9); f.beginPath(); f.moveTo(x - w / 2, 0); f.lineTo(x + w / 2, 0); f.lineTo(x + (r() - 0.5) * 10, h); f.fill(); f.beginPath(); f.moveTo(x - w / 2 + 40, 540); f.lineTo(x + w / 2 + 40, 540); f.lineTo(x + 40, 540 - h * 0.7); f.fill(); }
      if (theme === 'hollow') for (let i = 0; i < 40; i++) { const x = r() * 1600, y = 150 + r() * 260; const gr = f.createRadialGradient(x, y, 0, x, y, 14); gr.addColorStop(0, 'rgba(255,200,120,0.5)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); f.fillStyle = gr; f.fillRect(x - 14, y - 14, 28, 28); }
      if (theme === 'roots') { f.strokeStyle = col(0.75, 0.9); f.lineCap = 'round'; for (let i = 0; i < 14; i++) { f.lineWidth = 14 + r() * 40; const x = r() * 1600; f.beginPath(); f.moveTo(x, -20); f.bezierCurveTo(x + 200 * (r() - 0.5), 180, x + 300 * (r() - 0.5), 360, x + 400 * (r() - 0.5), 560); f.stroke(); } }
      for (let i = 0; i < 16; i++) { const x = r() * 1600, w = 50 + r() * 120, h = 100 + r() * 260; m.fillStyle = col(0.4, 0.95); m.beginPath(); m.moveTo(x - w / 2, 0); m.lineTo(x + w / 2, 0); m.lineTo(x, h); m.fill(); }
      if (theme === 'roots') { m.strokeStyle = col(0.5, 0.95); m.lineCap = 'round'; for (let i = 0; i < 22; i++) { m.lineWidth = 3 + r() * 8; const x = r() * 1600, len = 80 + r() * 300; m.beginPath(); m.moveTo(x, -10); m.bezierCurveTo(x + 30, len * 0.3, x - 30, len * 0.7, x + 10, len); m.stroke(); } }
    } else if (theme === 'works') {
      for (let i = 0; i < 9; i++) { const x = i * 180 + r() * 40; f.fillStyle = col(0.6, 0.9); f.fillRect(x, 120, 26, 420); f.beginPath(); f.arc(x + 103, 150, 90, Math.PI, 0); f.lineTo(x + 193, 120); f.lineTo(x + 13, 120); f.fill(); }
      for (let i = 0; i < 6; i++) { const x = r() * 1600, y = 260 + r() * 120, w = 90 + r() * 80; f.fillStyle = col(0.72, 0.9); f.beginPath(); f.roundRect(x, y, w, 300, 30); f.fill(); f.fillStyle = col(0.5, 0.9); f.fillRect(x + 10, y + 40, w - 20, 5); }
      m.strokeStyle = col(0.42, 0.95); for (let i = 0; i < 10; i++) { m.lineWidth = 8 + r() * 14; const y = 40 + r() * 460; m.beginPath(); m.moveTo(-10, y); m.lineTo(1610, y + (r() - 0.5) * 30); m.stroke(); }
      for (let i = 0; i < 7; i++) { const x = r() * 1600, y = 100 + r() * 300, rad = 30 + r() * 50; m.lineWidth = 9; m.beginPath(); m.arc(x, y, rad, 0, 7); m.stroke(); for (let k = 0; k < 8; k++) { m.beginPath(); m.moveTo(x, y); m.lineTo(x + Math.cos(k * 0.785) * rad, y + Math.sin(k * 0.785) * rad); m.lineWidth = 3; m.stroke(); } }
    } else {
      f.fillStyle = col(0.5, 0.95); f.fillRect(0, 0, 1600, 540);
      f.strokeStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < 540; y += 22) { f.beginPath(); f.moveTo(0, y); f.lineTo(1600, y); f.stroke(); for (let x = (y / 22 % 2) * 30; x < 1600; x += 60) { f.beginPath(); f.moveTo(x, y); f.lineTo(x, y + 22); f.stroke(); } }
      for (let i = 0; i < 5; i++) { const x = 160 + i * 320, gr = f.createLinearGradient(0, 120, 0, 400); gr.addColorStop(0, '#1a2440'); gr.addColorStop(1, '#0b0f1e'); f.fillStyle = gr; f.beginPath(); f.moveTo(x - 50, 400); f.lineTo(x - 50, 190); f.arc(x, 190, 50, Math.PI, 0); f.lineTo(x + 50, 400); f.fill();
        f.fillStyle = 'rgba(200,210,255,0.5)'; for (let k = 0; k < 9; k++) f.fillRect(x - 40 + r() * 80, 160 + r() * 200, 1.5, 1.5); f.strokeStyle = col(0.3, 1); f.lineWidth = 5; f.beginPath(); f.moveTo(x, 140); f.lineTo(x, 400); f.moveTo(x - 50, 270); f.lineTo(x + 50, 270); f.stroke(); }
      m.strokeStyle = col(0.36, 0.95); m.lineWidth = 16; for (let i = 0; i < 6; i++) { const x = i * 300 + r() * 60; m.beginPath(); m.moveTo(x, 560); m.lineTo(x + 260, 300 - r() * 100); m.stroke(); m.lineWidth = 8; m.beginPath(); m.moveTo(x + 130, 0); m.lineTo(x + 130, 540); m.stroke(); m.lineWidth = 16; }
    }
  },
  frame() {
    const L = G.lvl, def = L.def, th = THEME[def.theme], c = G.cam, p = G.player;
    // ---- sky and parallax (screen space)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, cv.height); sky.addColorStop(0, th.sky[0]); sky.addColorStop(1, th.sky[1]); ctx.fillStyle = sky; ctx.fillRect(0, 0, cv.width, cv.height);
    if (def.drawSky) { ctx.setTransform(SC, 0, 0, SC, 0, 0); def.drawSky(ctx, VW, VH); }
    else for (const [img, k, a] of [[this.bgFar, 0.18, 0.9], [this.bgMid, 0.42, 0.9]]) {
      ctx.setTransform(SC, 0, 0, SC, 0, 0); ctx.globalAlpha = a;
      const off = -((c.x * k) % 1600), oy = -(c.y - L.h * TILE / 2) * k * 0.3;
      for (let x = off - 1600; x < VW; x += 1600) ctx.drawImage(img, x, oy);
      ctx.globalAlpha = 1;
    }
    // ---- world
    this.worldTransform(ctx, 1);
    def.draw && def.draw('back');
    ctx.drawImage(this.layer, 0, 0, L.w * TILE, L.h * TILE);
    for (const e of G.ents) Draw.back(e);
    def.draw && def.draw('mid');
    for (const e of G.ents) Draw.ent(e);
    Player.draw(p);
    Fx.draw(false);
    this.drawWater();
    // motes and fog sit in the air, so they only show where light reaches
    ctx.fillStyle = rgba(th.mote, 0.5);
    const vx0 = c.x - VW / 2 / c.zoom, vy0 = c.y - VH / 2 / c.zoom;
    for (const m of this.motes) { const x = vx0 + ((m.x - c.x * 0.6 + Math.sin(G.t * 0.4 + m.p) * 14) % 1200 + 1200) % 1200 - 100, y = vy0 + ((m.y - G.t * m.v) % VH + VH) % VH; ctx.beginPath(); ctx.arc(x, y, m.s, 0, 7); ctx.fill(); }
    ctx.globalCompositeOperation = 'screen';
    for (const [k, sp, a] of [[0.7, 9, 0.2], [1.15, -14, 0.13]]) {
      ctx.globalAlpha = a * (def.fog == null ? 1 : def.fog);
      const fw = 1024, fh = 512, ox = -(((c.x * k + G.t * sp) % fw) + fw) % fw, oy = -(((c.y * k * 0.5) % fh) + fh) % fh;
      for (let x = ox; x < VW / c.zoom + fw; x += fw) for (let y = oy; y < VH / c.zoom + fh; y += fh) ctx.drawImage(this.fog, vx0 + x, vy0 + y, fw, fh);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    def.draw && def.draw('front');
    // ---- lights
    Light.begin();
    const lp = Player.lanternPos(p), lit = Player.lit(p);
    if (lit) Light.add(lp.x, lp.y, 255 + Math.sin(G.t * 9) * 3, [255, 190, 110], 1);
    else Light.add(p.x + p.w / 2, p.y + 8, 118, [140, 130, 220], 0.62, false);   // Nib was born dark: she sees a little without any light
    if (p.glow > 0) Light.add(p.x + p.w / 2, p.y + 14, 150 * p.glow, [255, 214, 130], p.glow, false);
    for (const e of G.ents) Draw.light(e);
    for (const b of G.beams || []) for (let i = 1; i < b.length; i++) { const [x0, y0] = b[i - 1], [x1, y1] = b[i], n = Math.ceil(dist(x0, y0, x1, y1) / 56); for (let k = 0; k <= n; k++) Light.add(lerp(x0, x1, k / n), lerp(y0, y1, k / n), 74, [255, 240, 200], 0.6, false); }
    for (const l of def.lights ? def.lights() : []) Light.add(l.x, l.y, l.r, l.col, l.k == null ? 1 : l.k, l.shadow !== false, l.key);
    const amb = def.ambient ? def.ambient() : th.amb;
    Light.render(amb, th.tint);
    // ---- things that shine through the dark
    this.worldTransform(ctx, 1);
    ctx.globalCompositeOperation = 'lighter'; Fx.draw(true);
    for (const b of G.beams || []) { for (const [w, a] of [[9, 0.12], [4, 0.3], [1.5, 0.9]]) { ctx.strokeStyle = `rgba(255,244,210,${a})`; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(b[0][0], b[0][1]); for (let i = 1; i < b.length; i++) ctx.lineTo(b[i][0], b[i][1]); ctx.stroke(); } }
    for (const ry of def.rays ? def.rays() : []) { const g = ctx.createLinearGradient(ry.x, ry.y, ry.x + ry.dx, ry.y + ry.h); g.addColorStop(0, rgba(ry.col, ry.a)); g.addColorStop(1, rgba(ry.col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ry.x - ry.w / 2, ry.y); ctx.lineTo(ry.x + ry.w / 2, ry.y); ctx.lineTo(ry.x + ry.dx + ry.w * 1.3, ry.y + ry.h); ctx.lineTo(ry.x + ry.dx - ry.w * 1.3, ry.y + ry.h); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    for (const e of G.ents) Draw.glow(e);
    def.draw && def.draw('glow');
    if (G.prompt && !G.cut) Draw.prompt(G.prompt);
    // fade
    if (G.fade > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(4,3,9,${G.fade})`; ctx.fillRect(0, 0, cv.width, cv.height); }
  },
  drawWater() {
    for (const w of G.water) {
      const s = w.surf(); if (w.drain >= 0.98) continue;
      const g = ctx.createLinearGradient(0, s, 0, w.y + w.h); g.addColorStop(0, 'rgba(60,150,170,0.42)'); g.addColorStop(1, 'rgba(14,40,70,0.82)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w.x, w.y + w.h); ctx.lineTo(w.x, s);
      for (let x = 0; x <= w.w; x += 8) ctx.lineTo(w.x + x, s + Math.sin(x * 0.08 + G.t * 2.2) * 1.6 + Math.sin(x * 0.021 - G.t * 1.3) * 1.4);
      ctx.lineTo(w.x + w.w, w.y + w.h); ctx.fill();
      // reflection: the picture above the surface, flipped and rippled, drawn back into the water
      const T = ctx.getTransform(), sx = T.a, dev = (x, y) => [x * T.a + T.e, y * T.d + T.f];
      const [x0, y0] = dev(w.x, s), [x1] = dev(w.x + w.w, s), hpx = Math.min(70 * sx, y0);
      if (x1 > 0 && x0 < cv.width && y0 > 0 && y0 < cv.height + hpx) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.3;
        const cx0 = Math.max(0, x0), cw = Math.min(cv.width, x1) - cx0, strip = Math.max(2, Math.round(3 * sx));
        // copy the band above the surface once (reading the canvas back strip by strip is slow), then draw from the copy
        const R = this.refl || (this.refl = document.createElement('canvas')), top = Math.max(0, Math.floor(y0 - hpx)), bh = Math.ceil(y0) - top;
        if (cw > 0 && bh > 0) {
          if (R.width < cw || R.height < bh) { R.width = Math.ceil(cw); R.height = Math.ceil(bh); }
          const rc = R.getContext('2d'); rc.clearRect(0, 0, R.width, R.height); rc.drawImage(cv, cx0, top, cw, bh, 0, 0, cw, bh);
          for (let i = 0; i < hpx; i += strip) { const off = Math.sin(i * 0.25 + G.t * 3) * 2.5 * sx * (i / hpx + 0.3), sy = y0 - i - strip - top; if (sy < 0) break; ctx.drawImage(R, 0, sy, cw, strip, cx0 + off, y0 + i, cw, strip); }
        }
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(190,235,245,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath();
      for (let x = 0; x <= w.w; x += 8) { const y = s + Math.sin(x * 0.08 + G.t * 2.2) * 1.6 + Math.sin(x * 0.021 - G.t * 1.3) * 1.4; x ? ctx.lineTo(w.x + x, y) : ctx.moveTo(w.x + x, y); } ctx.stroke();
    }
  },
};
