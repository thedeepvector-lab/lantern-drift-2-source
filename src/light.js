// ---------------------------------------------------------------- lighting: a darkness layer with ray-cast holes, so walls cast real shadows
const Light = {
  cvs: document.createElement('canvas'), d: null, list: [], statics: [], RAYS: 96,
  resize() { this.cvs.width = Math.ceil(cv.width / 2); this.cvs.height = Math.ceil(cv.height / 2); this.d = this.cvs.getContext('2d'); },
  // Walk rays out from (x, y) until each one hits a wall. The end points outline the light.
  cast(x, y, r) {
    const pts = [];
    for (let i = 0; i < this.RAYS; i++) {
      const a = i / this.RAYS * Math.PI * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      let d = 0;
      // step 6 px at a time; +9 at the end so the wall face itself is lit
      while (d < r) { d += 6; if (solidAt(x + dx * d, y + dy * d)) { d += 9; break; } }
      d = Math.min(d, r);
      pts.push(x + dx * d, y + dy * d);
    }
    return pts;
  },
  buildStatic() { this.statics = []; },
  begin() { this.list.length = 0; },
  // col: [r,g,b]; k: strength 0..1; shadow: cast against walls (cached for lights that never move)
  add(x, y, r, col, k = 1, shadow = true, cacheKey = null) {
    if (k <= 0.01 || r < 4) return;
    const c = G.cam; if (x + r < c.x - VW / 2 / c.zoom - 40 || x - r > c.x + VW / 2 / c.zoom + 40 || y + r < c.y - VH / 2 / c.zoom - 40 || y - r > c.y + VH / 2 / c.zoom + 40) return;
    let poly = null;
    if (shadow) {
      if (cacheKey) { const s = this.statics[cacheKey]; if (s && s.r === r) poly = s.p; else { poly = this.cast(x, y, r); this.statics[cacheKey] = { r, p: poly }; } }
      else poly = this.cast(x, y, r);
    }
    this.list.push({ x, y, r, col, k, poly });
  },
  invalidate() { this.statics = []; },
  render(ambient, tint) {
    const d = this.d, w = this.cvs.width, h = this.cvs.height;
    d.setTransform(1, 0, 0, 1, 0, 0); d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, w, h); d.fillStyle = rgba(tint, ambient); d.fillRect(0, 0, w, h);
    Render.worldTransform(d, 0.5);
    d.globalCompositeOperation = 'destination-out';
    for (const L of this.list) {
      const g = d.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
      g.addColorStop(0, `rgba(0,0,0,${L.k})`); g.addColorStop(0.5, `rgba(0,0,0,${L.k * 0.72})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g; d.beginPath();
      if (L.poly) { d.moveTo(L.poly[0], L.poly[1]); for (let i = 2; i < L.poly.length; i += 2) d.lineTo(L.poly[i], L.poly[i + 1]); d.closePath(); }
      else d.arc(L.x, L.y, L.r, 0, 7);
      d.fill();
    }
    d.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.cvs, 0, 0, cv.width, cv.height);
    // warm colour where light lands
    Render.worldTransform(ctx, 1); ctx.globalCompositeOperation = 'lighter';
    for (const L of this.list) {
      const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r * 0.8);
      g.addColorStop(0, rgba(L.col, 0.30 * L.k)); g.addColorStop(1, rgba(L.col, 0));
      ctx.fillStyle = g; ctx.beginPath();
      if (L.poly) { ctx.moveTo(L.poly[0], L.poly[1]); for (let i = 2; i < L.poly.length; i += 2) ctx.lineTo(L.poly[i], L.poly[i + 1]); ctx.closePath(); }
      else ctx.arc(L.x, L.y, L.r * 0.8, 0, 7);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  },
};
