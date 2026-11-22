// ---------------------------------------------------------------- draw: every character and object is drawn with code, no image files
const SYM = ['○', '△', '□'];
const Draw = {
  lumen(x, y, o = {}) {   // a firefly person. o: glow 0..1, asleep, old, face, col, s (scale), jar
    const t = G.t, f = o.face || 1, s = o.s || 1, sl = o.asleep ? 1 : 0, gl = (o.glow == null ? 1 : o.glow) * (1 - sl);
    const col = o.col || [255, 214, 130], bob = sl ? 0 : Math.sin(t * 2 + x) * 0.8;
    ctx.save(); ctx.translate(x, y); ctx.scale(f * s, s * (sl ? 0.82 : 1));
    ctx.strokeStyle = '#2a2440'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(-4, 0); ctx.moveTo(3, -7); ctx.lineTo(4, 0); ctx.stroke();
    if (gl > 0.02) { ctx.shadowColor = rgba(col, 1); ctx.shadowBlur = 14 * gl; }
    ctx.fillStyle = sl ? '#6e6c7c' : `rgb(${lerp(70, col[0], gl) | 0},${lerp(64, col[1], gl) | 0},${lerp(90, col[2], gl) | 0})`;
    ctx.beginPath(); ctx.ellipse(-4, -9 - bob, 8, 6.5, -0.3, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = sl ? 'rgba(200,200,215,0.35)' : 'rgba(220,230,255,0.4)'; ctx.beginPath(); ctx.ellipse(-6, -17 - bob, 9, 3.6, -0.5, 0, 7); ctx.fill();
    ctx.fillStyle = sl ? '#55536a' : (o.old ? '#4a4258' : '#3d3566'); ctx.beginPath(); ctx.ellipse(1, -14 - bob, 6.5, 7.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = sl ? '#62607a' : (o.old ? '#584f6a' : '#4a4080'); ctx.beginPath(); ctx.arc(3, -23 - bob + sl * 3, 7.2, 0, 7); ctx.fill();
    if (sl) { ctx.strokeStyle = '#2a2440'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(4, -20); ctx.lineTo(8, -20); ctx.moveTo(0, -20); ctx.lineTo(3, -20); ctx.stroke(); }
    else { const blink = ((t + x * 0.01) % 4.1) < 0.12 ? 0.15 : 1; ctx.fillStyle = '#f3ecd8'; ctx.beginPath(); ctx.ellipse(6, -23.5 - bob, 2, 2.5 * blink, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(1, -23.5 - bob, 1.6, 2.2 * blink, 0, 0, 7); ctx.fill(); }
    ctx.strokeStyle = sl ? '#62607a' : '#4a4080'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) { const a = sl || o.old ? 5 : Math.sin(t * 3 + i + x) * 1.5; ctx.beginPath(); ctx.moveTo(1 + i * 3, -29 - bob + sl * 3); ctx.quadraticCurveTo(-1 + i * 4, -36 - bob + a, -6 + i * 5 - (o.old ? 3 : 0), -37 - bob + a * 1.6 + sl * 3); ctx.stroke(); }
    if (o.jar) { ctx.fillStyle = 'rgba(200,230,240,0.25)'; ctx.strokeStyle = '#9db'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(8, -18, 11, 14, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = `rgba(255,214,130,${0.5 + 0.5 * o.jar})`; ctx.beginPath(); ctx.ellipse(13.5, -9, 2.5 * o.jar + 0.5, 4 * o.jar + 0.5 + Math.sin(t * 13) * 0.5, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  },
  fiddle(x, y, o = {}) {
    const t = G.t, play = o.play ? Math.sin(t * 9) * 5 : Math.sin(t * 1.4) * 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(o.face || -1, 1);
    ctx.strokeStyle = '#8a6f44'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(-20, -26); ctx.lineTo(-16, 0); ctx.stroke();           // big hind leg
    ctx.beginPath(); ctx.moveTo(2, -8); ctx.lineTo(4, 0); ctx.moveTo(8, -9); ctx.lineTo(11, 0); ctx.stroke();
    ctx.fillStyle = '#b8955c'; ctx.beginPath(); ctx.ellipse(-2, -11, 13, 6.5, 0.12, 0, 7); ctx.fill();
    ctx.fillStyle = '#9c7c48'; ctx.beginPath(); ctx.ellipse(-4, -14, 10, 3.5, 0.15, 0, 7); ctx.fill();
    ctx.fillStyle = '#c9a66a'; ctx.beginPath(); ctx.arc(12, -15, 6.5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#4a3a22'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(14, -15.5, 2, 0.2, Math.PI - 0.2); ctx.stroke();    // closed eye: he's blind
    ctx.strokeStyle = '#c9a66a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(14, -21); ctx.quadraticCurveTo(26, -42 + play, 40, -34 + play); ctx.moveTo(12, -21); ctx.quadraticCurveTo(18, -46 - play, 30, -48 - play); ctx.stroke();
    ctx.strokeStyle = '#e0c48a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6, -16); ctx.lineTo(8 + play, -24 - play * 0.6); ctx.stroke();   // bowing arm
    ctx.restore();
  },
  bot(x, y, dir, o = {}) {   // wardens and Brine share a body
    const t = G.t, br = o.brine, lens = o.lens || [255, 170, 80], bob = Math.sin(t * 3 + x) * 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.fillStyle = '#3d3a36'; ctx.beginPath(); ctx.arc(0, -8, 8, 0, 7); ctx.fill(); ctx.strokeStyle = '#8a7a5c'; ctx.lineWidth = 2;
    for (let k = 0; k < 4; k++) { const a = (o.roll || 0) + k * 1.57; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(Math.cos(a) * 7, -8 + Math.sin(a) * 7); ctx.stroke(); }
    ctx.fillStyle = br ? '#5d7470' : '#7a6844'; ctx.beginPath(); ctx.roundRect(-12, -46 + bob, 24, 32, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-12, -30 + bob, 24, 3); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-10, -44 + bob, 4, 26);
    if (br) { ctx.fillStyle = '#4f8a5a'; ctx.beginPath(); ctx.ellipse(-8, -45 + bob, 6, 3, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(7, -17 + bob, 5, 2.5, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = br ? '#6d8a86' : '#94804f'; ctx.beginPath(); ctx.arc(0, -52 + bob, 11, Math.PI, 0); ctx.lineTo(11, -46 + bob); ctx.lineTo(-11, -46 + bob); ctx.fill();
    ctx.fillStyle = '#1c1a18'; ctx.beginPath(); ctx.arc(5, -53 + bob, 5.5, 0, 7); ctx.fill();
    ctx.fillStyle = rgba(lens, 0.95); ctx.beginPath(); ctx.arc(5.5, -53 + bob, 3.4 + (o.alert ? 1 : 0), 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a7a5c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(8, -36 + bob); ctx.lineTo(20, -30 + bob - (o.reach || 0) * 22); ctx.stroke();
    ctx.fillStyle = '#5a5048'; ctx.beginPath(); ctx.moveTo(16, -30 + bob - (o.reach || 0) * 22); ctx.lineTo(26, -30 + bob - (o.reach || 0) * 22); ctx.lineTo(21, -40 + bob - (o.reach || 0) * 22); ctx.fill();   // the snuffer cup
    ctx.restore();
  },
  umbra(e) {
    const fl = Math.sin(e.flap), g = e.gold;
    const wc = [lerp(58, 255, g) | 0, lerp(48, 205, g) | 0, lerp(84, 120, g) | 0], bc = [lerp(34, 200, g) | 0, lerp(28, 150, g) | 0, lerp(52, 80, g) | 0];
    ctx.save(); ctx.translate(e.x, e.y);
    for (const s of [-1, 1]) {
      ctx.save(); ctx.scale(s, 1); ctx.rotate(-0.25 + fl * 0.45);
      ctx.fillStyle = rgba(wc, 0.95); ctx.beginPath(); ctx.moveTo(6, -6); ctx.bezierCurveTo(40, -70, 120, -70, 128, -14); ctx.bezierCurveTo(110, 6, 60, 14, 6, 8); ctx.fill();
      ctx.fillStyle = rgba(wc.map(v => v * 0.8 | 0), 0.95); ctx.beginPath(); ctx.moveTo(6, 6); ctx.bezierCurveTo(50, 20, 90, 40, 78, 66); ctx.bezierCurveTo(40, 62, 14, 40, 4, 14); ctx.fill();
      ctx.fillStyle = g > 0.5 ? 'rgba(255,250,220,0.9)' : 'rgba(230,220,255,0.85)'; ctx.beginPath(); ctx.arc(84, -26, 13, 0, 7); ctx.fill();
      ctx.fillStyle = g > 0.5 ? '#b8792a' : '#1a1428'; ctx.beginPath(); ctx.arc(84, -26, 7, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(120 - k * 8, -50 + k * 16); ctx.stroke(); }
      ctx.restore();
    }
    ctx.fillStyle = rgba(bc, 1); ctx.beginPath(); ctx.ellipse(0, 6, 13, 30, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0, -24, 12, 0, 7); ctx.fill();
    ctx.strokeStyle = rgba(wc, 1); ctx.lineWidth = 2.5; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 5, -33); ctx.quadraticCurveTo(s * 22, -62, s * 34, -52); ctx.stroke(); }
    ctx.restore();
  },
  // ---- things drawn behind characters
  back(e) {
    const t = G.t;
    switch (e.type) {
      case 'lamp': { ctx.strokeStyle = '#6d5a46'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x, e.y - 44); ctx.quadraticCurveTo(e.x, e.y - 54, e.x + 10, e.y - 52); ctx.stroke();
        ctx.fillStyle = '#3d342e'; ctx.fillRect(e.x + 4, e.y - 52, 13, 3); ctx.fillRect(e.x + 5, e.y - 34, 11, 2.5);
        ctx.fillStyle = e.lit ? rgba([255, 214, 130], e.lit) : 'rgba(90,76,60,0.9)'; ctx.fillRect(e.x + 6, e.y - 49, 9, 15); break; }
      case 'door': { const s = e.solid, h = s.h * (1 - e.open); ctx.fillStyle = '#4a4034'; ctx.fillRect(s.x, s.y, s.w, h); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(s.x, s.y, 3, h); ctx.strokeStyle = '#8a7a5c'; ctx.lineWidth = 2; for (let y = 10; y < h - 4; y += 22) { ctx.beginPath(); ctx.moveTo(s.x, s.y + y); ctx.lineTo(s.x + s.w, s.y + y); ctx.stroke(); } break; }
      case 'chalk': if (e.a > 0.02 && e.art) Draw.chalk(e); break;
      case 'exit': { const ok = Things.canAct(e, G.player); ctx.fillStyle = ok ? 'rgba(255,214,150,0.16)' : 'rgba(120,120,150,0.08)'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 30, 22, 34, 0, 0, 7); ctx.fill(); break; }
      case 'lure': { ctx.fillStyle = '#4a4640'; ctx.fillRect(e.x - 3, e.y + 14, 6, 34); ctx.fillStyle = '#6a6458'; ctx.beginPath(); ctx.roundRect(e.x - 13, e.y - 14, 26, 30, 5); ctx.fill(); ctx.fillStyle = e.lit ? '#ffe2a0' : '#2c2a28'; ctx.beginPath(); ctx.roundRect(e.x - 9, e.y - 10, 18, 22, 3); ctx.fill(); ctx.fillStyle = '#4a4640'; ctx.fillRect(e.x - 15, e.y - 18, 30, 5); break; }
      case 'brazier': { ctx.strokeStyle = '#5a5048'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(e.x - 10, e.y + 30); ctx.lineTo(e.x, e.y + 8); ctx.lineTo(e.x + 10, e.y + 30); ctx.stroke(); ctx.fillStyle = '#6a5c4c'; ctx.beginPath(); ctx.moveTo(e.x - 16, e.y - 2); ctx.lineTo(e.x + 16, e.y - 2); ctx.lineTo(e.x + 10, e.y + 10); ctx.lineTo(e.x - 10, e.y + 10); ctx.fill();
        if (e.lit) for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#ff9d3c', '#ffc35a', '#fff0b8'][k]; ctx.beginPath(); ctx.ellipse(e.x + Math.sin(t * 9 + k) * 2, e.y - 6 - k * 2, 9 - k * 2.6, 13 - k * 3 + Math.sin(t * 13 + k) * 2, 0, 0, 7); ctx.fill(); } break; }
    }
  },
  chalk(e) {
    const a = e.art; ctx.save(); ctx.translate(e.x, e.y); ctx.globalAlpha = e.a * 0.85; ctx.strokeStyle = ctx.fillStyle = '#e9e4d6'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.font = '600 15px "Cormorant Garamond", Georgia, serif'; ctx.textAlign = 'center';
    if (a.t === 'order') { a.seq.forEach((k, i) => { const x = (i - 1) * 34, h = [10, 26, 17][k]; ctx.beginPath(); ctx.ellipse(x, -h / 2, 6 + k * 1.5, h / 2, 0, 0, 7); ctx.stroke(); for (let d = 0; d <= i; d++) { ctx.beginPath(); ctx.arc(x - i * 3 + d * 6, 10, 1.6, 0, 7); ctx.fill(); } }); }
    else if (a.t === 'valves') { ctx.font = '22px sans-serif'; a.seq.forEach((k, i) => ctx.fillText(SYM[k], (i - 1) * 30, 4)); ctx.beginPath(); ctx.moveTo(-50, 14); ctx.lineTo(50, 14); ctx.stroke(); }
    else if (a.t === 'sun') { ctx.beginPath(); ctx.arc(0, -16, 12, 0, 7); ctx.stroke(); for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(Math.cos(k * 0.785) * 16, -16 + Math.sin(k * 0.785) * 16); ctx.lineTo(Math.cos(k * 0.785) * 23, -16 + Math.sin(k * 0.785) * 23); ctx.stroke(); } ctx.fillText(a.s || 'morning', 0, 22); }
    else if (a.t === 'tally') { for (let r = 0; r < a.rows; r++) { ctx.globalAlpha = e.a * 0.85 * (1 - r / (a.rows + 1)); for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.moveTo(-40 + k * 10, -30 + r * 14); ctx.lineTo(-40 + k * 10, -21 + r * 14); ctx.stroke(); } } ctx.globalAlpha = e.a * 0.85; if (a.s) ctx.fillText(a.s, 0, a.rows * 14 - 10); }
    else if (a.t === 'tower') { ctx.beginPath(); ctx.moveTo(-10, 20); ctx.lineTo(-7, -20); ctx.lineTo(7, -20); ctx.lineTo(10, 20); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -28, 9, 0, 7); ctx.stroke(); for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 2.1) * 5, -28 + Math.sin(k * 3.3) * 5, 1.3, 0, 7); ctx.fill(); } if (a.s) ctx.fillText(a.s, 0, 38); }
    else if (a.t === 'text') { a.s.split('|').forEach((ln, i) => ctx.fillText(ln, 0, i * 17)); }
    ctx.restore();
  },
  // ---- characters and active objects
  ent(e) {
    const t = G.t;
    switch (e.type) {
      case 'page': if (!e.got) { const b = Math.sin(t * 2.4 + e.x) * 3; ctx.save(); ctx.translate(e.x, e.y + b); ctx.rotate(Math.sin(t * 1.3) * 0.12); ctx.fillStyle = '#e9e1cc'; ctx.fillRect(-6, -8, 12, 15); ctx.fillStyle = '#a89c80'; for (let k = 0; k < 4; k++) ctx.fillRect(-4, -5 + k * 3, 8 - (k === 3 ? 3 : 0), 1); ctx.restore(); } break;
      case 'npc': if (!e.hidden) {
        const as = typeof e.asleep === 'function' ? e.asleep() : e.asleep;
        if (e.who === 'fiddle') Draw.fiddle(e.x, e.y, { play: e.play, face: e.face });
        else if (e.who === 'brine') Draw.bot(e.x, e.y, e.face || -1, { brine: true, lens: e.off ? [60, 80, 80] : [120, 230, 230] });
        else Draw.lumen(e.x, e.y, { face: e.face, glow: e.glow, asleep: as, old: e.old, col: e.col, s: e.s, jar: e.jar });
      } break;
      case 'cap': { const o = e.open, cx = e.x + e.w / 2; ctx.strokeStyle = '#3f6a66'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, e.y + 40); ctx.quadraticCurveTo(cx + 4, e.y + 20, cx, e.y + 6); ctx.stroke();
        ctx.fillStyle = `rgb(${lerp(40, 110, o) | 0},${lerp(84, 230, o) | 0},${lerp(88, 200, o) | 0})`; const w = lerp(8, e.w / 2 + 3, o); ctx.beginPath(); ctx.ellipse(cx, e.y + 5, w, lerp(9, 6, o), 0, Math.PI, 0); ctx.lineTo(cx + w, e.y + 7); ctx.lineTo(cx - w, e.y + 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx + (k - 1) * w * 0.5, e.y + 2, 1.5, 0, 7); ctx.fill(); } break; }
      case 'bulb': { const h = [16, 40, 27][e.idx], on = e.on; ctx.strokeStyle = '#4f7a55'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x, e.y - 8); ctx.stroke(); ctx.fillStyle = on ? '#bff5d8' : '#3d6a58'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 8 - h / 2, 8 + e.idx * 1.5 + Math.sin(t * 20) * on * 0.6, h / 2, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(e.x - 3, e.y - 10 - h * 0.6, 2, h * 0.18, 0, 0, 7); ctx.fill(); break; }
      case 'valve': { ctx.fillStyle = '#4a5560'; ctx.fillRect(e.x - 4, e.y, 8, 22); ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.pos * 2.094 - e.spin * 2.094); ctx.strokeStyle = '#b5553c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.stroke(); ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(k * 2.094) * 12, Math.sin(k * 2.094) * 12); ctx.stroke(); } ctx.restore();
        ctx.fillStyle = '#1a1e24'; ctx.beginPath(); ctx.roundRect(e.x - 11, e.y - 36, 22, 18, 4); ctx.fill(); ctx.fillStyle = '#e9e4d6'; ctx.font = '15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(SYM[e.pos], e.x, e.y - 22); break; }
      case 'mirror': { ctx.fillStyle = '#4a4640'; ctx.fillRect(e.x - 2, e.y, 4, 16); ctx.save(); ctx.translate(e.x, e.y); ctx.rotate((e.st ? 1 : -1) * 0.785 + e.turn * (e.st ? -1.57 : 1.57)); ctx.fillStyle = '#8a7a5c'; ctx.fillRect(-15, -3, 30, 6); ctx.fillStyle = '#d8ecf2'; ctx.fillRect(-13, -1.5, 26, 3); ctx.restore(); break; }
      case 'emitter': { ctx.fillStyle = '#5a5048'; ctx.beginPath(); ctx.roundRect(e.x - 12, e.y - 12, 24, 24, 5); ctx.fill(); ctx.fillStyle = e.on ? '#fff3c8' : '#2c2a28'; ctx.beginPath(); ctx.arc(e.x + e.dir[0] * 6, e.y + e.dir[1] * 6, 6, 0, 7); ctx.fill(); break; }
      case 'receptor': { ctx.fillStyle = '#3d3a44'; ctx.beginPath(); ctx.roundRect(e.x - 11, e.y - 11, 22, 22, 4); ctx.fill(); ctx.fillStyle = e.done ? '#bff0ff' : '#4a5a6a'; ctx.beginPath(); ctx.moveTo(e.x, e.y - 8); ctx.lineTo(e.x + 7, e.y); ctx.lineTo(e.x, e.y + 8); ctx.lineTo(e.x - 7, e.y); ctx.fill(); break; }
      case 'crank': { const a = e.done ? -0.9 : -0.2 + e.prog * -0.7; ctx.fillStyle = '#4a4640'; ctx.fillRect(e.x - 4, e.y - 40, 8, 40); ctx.save(); ctx.translate(e.x, e.y - 46); ctx.rotate(a); ctx.fillStyle = '#8a7a5c'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = e.done ? '#fff3c8' : '#b8ccd4'; ctx.beginPath(); ctx.ellipse(0, -1, 22, 6, 0, 0, 7); ctx.fill(); ctx.restore();
        if (e.busy) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - 20, e.y - 78, 40, 5); ctx.fillStyle = '#ffd98a'; ctx.fillRect(e.x - 20, e.y - 78, 40 * e.prog, 5); } break; }
      case 'snuff': { const awake = e.st !== 'roost', fl = awake ? Math.sin(e.flap) : -0.9; ctx.save(); ctx.translate(e.x, e.y); ctx.fillStyle = '#231d33';
        for (const s of [-1, 1]) { ctx.save(); ctx.scale(s, 1); ctx.rotate(awake ? fl * 0.7 : 1.1); ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(16, -14, 24, -2); ctx.quadraticCurveTo(14, 6, 2, 4); ctx.fill(); ctx.restore(); }
        ctx.beginPath(); ctx.ellipse(0, 2, 6, 8, 0, 0, 7); ctx.fill(); ctx.restore(); break; }
      case 'mire': if (e.st !== 'gone') { ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.dir, 1); if (e.st === 'leap') ctx.rotate(clamp(e.vy / 600, -1.2, 1.2) - 1.57 * 0);
        ctx.fillStyle = '#16262e'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 9, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-30, -8 + Math.sin(G.t * 8) * 4); ctx.lineTo(-30, 8 + Math.sin(G.t * 8) * 4); ctx.fill();
        ctx.strokeStyle = '#16262e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, -6); ctx.quadraticCurveTo(22, -22, 26, -12); ctx.stroke(); ctx.restore(); } break;
      case 'warden': Draw.bot(e.x, e.y, e.dir, { roll: e.roll, alert: e.st === 'alert' || e.st === 'chase', lens: e.st === 'chase' || e.st === 'alert' ? [255, 90, 70] : [255, 180, 90], reach: e.st === 'snuffing' ? 0.5 + Math.sin(e.t * 5) * 0.5 : 0 }); break;
      case 'umbra': Draw.umbra(e); break;
    }
  },
  light(e) {
    switch (e.type) {
      case 'lamp': if (e.lit) Light.add(e.x + 10, e.y - 42, 180 * e.lit, [255, 200, 120], e.lit, true, 'lamp' + e.idx + (e.lit >= 1 ? '' : G.t)); break;
      case 'npc': if (!e.hidden) { const as = typeof e.asleep === 'function' ? e.asleep() : e.asleep; if (e.who === 'brine') { if (!e.off) Light.add(e.x, e.y - 50, 80, [120, 230, 230], 0.7, false); } else if (e.who !== 'fiddle' && !as && (e.glow == null || e.glow > 0)) Light.add(e.x, e.y - 12, 90 * (e.glow == null ? 1 : e.glow) + (e.jar ? 110 * e.jar : 0), e.col || [255, 214, 130], 0.8, false); } break;
      case 'cap': if (e.open > 0.05) Light.add(e.x + e.w / 2, e.y, 70 * e.open, [120, 240, 210], 0.5 * e.open, false); break;
      case 'bulb': if (e.on) Light.add(e.x, e.y - 20, 120, [170, 255, 215], 0.8, false); break;
      case 'lure': if (e.lit) Light.add(e.x, e.y, 270, [255, 226, 160], 1, true, 'lure' + e.idx); break;
      case 'brazier': if (e.lit) Light.add(e.x, e.y - 8, 250 + Math.sin(G.t * 11) * 6, [255, 170, 80], 1, true); break;
      case 'receptor': if (e.done) Light.add(e.x, e.y, 90, [190, 240, 255], 0.7, false); break;
      case 'emitter': if (e.on) Light.add(e.x, e.y, 80, [255, 240, 200], 0.7, false); break;
      case 'warden': Light.add(e.x + e.dir * 80, e.y - 34, 120, [255, 170, 90], 0.5, false); Light.add(e.x, e.y - 40, 50, [255, 170, 90], 0.6, false); break;
      case 'mire': if (e.st !== 'gone') Light.add(e.x + e.dir * 14, e.y - 8, 34, [150, 255, 200], 0.6, false); break;
      case 'umbra': Light.add(e.x, e.y, 120 + e.gold * 260, e.gold > 0.3 ? [255, 214, 130] : [150, 130, 200], 0.45 + e.gold * 0.55, false); break;
      case 'crank': if (e.done) Light.add(e.x, e.y - 46, 110, [255, 240, 200], 0.8, false); break;
      case 'page': if (!e.got) Light.add(e.x, e.y, 40, [240, 230, 200], 0.6, false); break;
    }
  },
  // ---- eyes and flames that stay visible in total darkness
  glow(e) {
    const t = G.t;
    switch (e.type) {
      case 'snuff': if (e.st !== 'roost') { ctx.fillStyle = e.st === 'wake' ? '#fff' : '#ffb0b0'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(e.x + s * 2.6, e.y, 1.4, 0, 7); ctx.fill(); } } else { ctx.fillStyle = 'rgba(200,190,230,0.25)'; ctx.beginPath(); ctx.arc(e.x, e.y + 2, 1.2, 0, 7); ctx.fill(); } break;
      case 'mire': if (e.st !== 'gone') { ctx.fillStyle = e.chasing ? '#d8ffe8' : 'rgba(150,255,200,0.6)'; ctx.beginPath(); ctx.arc(e.x + e.dir * 12, e.y - 2, 1.8, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(e.x + e.dir * 26, e.y - 12, 2.2 + Math.sin(t * 6) * 0.6, 0, 7); ctx.fill(); } break;
      case 'warden': { const al = e.st === 'chase' || e.st === 'alert', col = al ? [255, 90, 70] : [255, 180, 90]; const g = ctx.createLinearGradient(e.x, 0, e.x + e.dir * 240, 0); g.addColorStop(0, rgba(col, 0.20)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(e.x + e.dir * 6, e.y - 53); ctx.lineTo(e.x + e.dir * 240, e.y - 100); ctx.lineTo(e.x + e.dir * 240, e.y + 4); ctx.fill();
        if (e.st === 'alert') { ctx.fillStyle = '#ff5a46'; ctx.font = '700 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', e.x, e.y - 72); } break; }
      case 'umbra': if (e.st === 'aim') { ctx.strokeStyle = `rgba(255,120,120,${0.3 + 0.3 * Math.sin(t * 20)})`; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); const p = G.player; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(p.x + 9, p.y + 13); ctx.stroke(); ctx.setLineDash([]); } break;
      case 'lamp': if (!e.lit && G.player.hasLantern) { ctx.fillStyle = `rgba(255,214,130,${0.25 + 0.15 * Math.sin(t * 3 + e.x)})`; ctx.beginPath(); ctx.arc(e.x + 10, e.y - 42, 2.5, 0, 7); ctx.fill(); } break;
    }
  },
  prompt(e) {
    const label = Things.label(e), x = e.x, y = e.y - (e.type === 'npc' ? 62 : e.type === 'crank' ? 96 : 66) + Math.sin(G.t * 4) * 2;
    ctx.font = '600 11px "IBM Plex Mono", monospace'; const w = ctx.measureText(label).width + 34;
    ctx.fillStyle = 'rgba(12,10,22,0.86)'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 11, w, 22, 11); ctx.fill();
    ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.roundRect(x - w / 2 + 4, y - 7, 16, 14, 4); ctx.fill();
    ctx.fillStyle = '#1b1208'; ctx.textAlign = 'center'; ctx.fillText('E', x - w / 2 + 12, y + 4);
    ctx.fillStyle = '#f1ebff'; ctx.textAlign = 'left'; ctx.fillText(label, x - w / 2 + 25, y + 4);
  },
};
