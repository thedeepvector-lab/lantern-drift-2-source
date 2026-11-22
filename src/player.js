// ---------------------------------------------------------------- player: Nib, the lamplighter who doesn't glow
const RUN = 150, GRAV = 1500, JUMP = 490;
const Player = {
  make(x, y) {
    return { x: x - 9, y: y - 26, w: 18, h: 26, vx: 0, vy: 0, onGround: false, face: 1, hasLantern: !!flag('lantern'), open: true, snuffed: 0,
      climb: false, coyote: 0, buffer: 0, dropT: 0, walkT: 0, swing: 0, swingV: 0, stepT: 0, glow: flag('glow') ? 1 : 0, land: 0, stun: 0 };
  },
  lit(p) { return p.hasLantern && p.open && p.snuffed <= 0; },
  lanternPos(p) {
    const cx = p.x + p.w / 2, by = p.y + p.h;
    return { x: cx + p.face * 15 + Math.sin(p.swing) * 9, y: by - 30 + Math.cos(p.swing) * 9 };
  },
  update(p, dt) {
    const free = !G.cut && p.stun <= 0;
    const ax = free ? (I.right ? 1 : 0) - (I.left ? 1 : 0) : 0;
    if (ax) p.face = ax;
    p.stun = Math.max(0, p.stun - dt); p.snuffed = Math.max(0, p.snuffed - dt); p.land = Math.max(0, p.land - dt * 4);
    // ladders and vines
    const cx = p.x + p.w / 2, tx = Math.floor(cx / TILE);
    const onLadder = tileAt(tx, Math.floor((p.y + p.h - 4) / TILE)) === 'H' || tileAt(tx, Math.floor((p.y + 4) / TILE)) === 'H';
    if (free && onLadder && (I.up || (I.down && !p.onGround)) && !p.climb) { p.climb = true; p.vy = 0; }
    if (p.climb) {
      if (!onLadder) p.climb = false;
      else {
        p.vy = free ? ((I.down ? 1 : 0) - (I.up ? 1 : 0)) * 100 : 0; p.vx = ax * 70;
        p.x += (tx * TILE + TILE / 2 - p.w / 2 - p.x) * Math.min(1, dt * 6) * (ax ? 0 : 1);
        if (free && I.jumpP) { p.climb = false; p.vy = -JUMP * 0.75; p.vx = ax * RUN; Sfx.jump(); }
      }
    }
    if (!p.climb) {
      const target = ax * RUN * (p.stun > 0 ? 0 : 1), k = p.onGround ? 14 : 8;
      p.vx += (target - p.vx) * Math.min(1, dt * k);
      // A jump that feels fair: gravity, plus two small kindnesses.
      p.vy = Math.min(p.vy + GRAV * dt, 760);
      // coyote time: you can still jump a moment after leaving a ledge
      p.coyote = p.onGround ? 0.1 : Math.max(0, p.coyote - dt);
      // jump buffer: press a little early and the jump still happens
      p.buffer = free && I.jumpP ? 0.12 : Math.max(0, p.buffer - dt);
      if (free && I.down && I.jumpP) { p.dropT = 0.22; p.buffer = 0; }   // down + jump drops through a ledge
      if (p.buffer > 0 && p.coyote > 0) {
        p.vy = -JUMP;
        p.buffer = 0; p.coyote = 0; p.onGround = false;
        Sfx.jump(); Fx.dust(cx, p.y + p.h, 5);
      }
      if (!I.jump && p.vy < -160 && free) p.vy = -160;   // let go early for a short hop
    }
    p.dropT = Math.max(0, p.dropT - dt); p.dropThrough = p.dropT > 0 || p.climb;
    const wasAir = !p.onGround, fallV = p.vy;
    moveBody(p, dt);
    if (p.climb) p.onGround = false;
    if (wasAir && p.onGround && fallV > 250) { Sfx.land(); p.land = 1; Fx.dust(cx, p.y + p.h, 6); }
    // feet
    if (p.onGround && Math.abs(p.vx) > 30) { p.walkT += dt * Math.abs(p.vx) / 14; p.stepT -= dt; if (p.stepT <= 0) { Sfx.foot(); p.stepT = 0.27; } }
    // lantern swings on its crook like a small pendulum
    p.swingV += (-p.swing * 60 - p.swingV * 5 - p.vx * 0.25) * dt; p.swing += p.swingV * dt; p.swing = clamp(p.swing, -1.1, 1.1);
    if (free && I.hoodP && p.hasLantern) { p.open = !p.open; Sfx.hood(p.open); if (G.lvl.def.onHood) G.lvl.def.onHood(p.open); }
    // hazards
    const fx = p.x + p.w / 2, fy = p.y + p.h - 2;
    if (!G.dying) {
      if (tileAt(Math.floor(fx / TILE), Math.floor(fy / TILE)) === '^') respawn('Thorns. A lit lamp caught you.');
      else if (inWater(fx, p.y + p.h * 0.5)) { Sfx.splash(); Fx.splash(fx, p.y + p.h * 0.5); respawn('The water is deep. Find another way across.'); }
      else if (p.y > G.lvl.h * TILE + 60) respawn();
    }
  },
  draw(p) {
    const cx = p.x + p.w / 2, by = p.y + p.h, f = p.face, t = G.t;
    const moving = p.onGround && Math.abs(p.vx) > 30, air = !p.onGround && !p.climb;
    const bob = moving ? Math.abs(Math.sin(p.walkT)) * 2.2 : Math.sin(t * 2.2) * 0.8;
    const sq = 1 + p.land * 0.18, st = air ? clamp(1 + Math.abs(p.vy) / 2200, 1, 1.18) : 1 / sq;
    ctx.save(); ctx.translate(cx, by); ctx.scale(f * sq / (air ? st : 1), st);
    // legs
    ctx.strokeStyle = '#1b1836'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const ph = p.walkT + i * Math.PI, lx = (i ? 3.5 : -3.5) + (moving ? Math.sin(ph) * 4 : 0), ly = moving ? -Math.max(0, Math.cos(ph)) * 3 : 0;
      ctx.beginPath(); ctx.moveTo(i ? 3 : -3, -7); ctx.lineTo(lx + (air ? (i ? 3 : -4) : 0), ly + (air ? -2 : 0)); ctx.stroke();
    }
    // scarf trails behind
    const sw = Math.sin(t * 5 + p.walkT) * 2 + clamp(-p.vx * f / 30, -6, 6);
    ctx.fillStyle = '#d9792b'; ctx.beginPath(); ctx.moveTo(-3, -17 - bob); ctx.quadraticCurveTo(-11 + sw, -15 - bob, -15 + sw, -9 - bob + Math.sin(t * 7) * 1.5); ctx.lineTo(-10 + sw, -13 - bob); ctx.closePath(); ctx.fill();
    // body: abdomen (the part that should glow, and doesn't), then thorax and head
    const gl = p.glow;
    if (gl > 0) { ctx.shadowColor = '#ffd98a'; ctx.shadowBlur = 16 * gl; }
    ctx.fillStyle = gl > 0 ? `rgb(${lerp(38, 255, gl) | 0},${lerp(33, 214, gl) | 0},${lerp(74, 130, gl) | 0})` : '#26214a';
    ctx.beginPath(); ctx.ellipse(-3, -9 - bob, 7.5, 6.5, -0.3, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#312a5e'; ctx.beginPath(); ctx.ellipse(1, -14 - bob, 6.5, 7.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a3270'; ctx.beginPath(); ctx.arc(3, -23 - bob, 7.2, 0, 7); ctx.fill();
    // face
    const blink = (t % 3.7) < 0.12 ? 0.15 : 1;
    ctx.fillStyle = '#f3ecd8'; ctx.beginPath(); ctx.ellipse(6, -23.5 - bob, 2.1, 2.6 * blink, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(1, -23.5 - bob, 1.7, 2.3 * blink, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1b1836'; ctx.beginPath(); ctx.arc(6.6, -23.2 - bob, 1, 0, 7); ctx.fill();
    // antennae
    ctx.strokeStyle = '#3a3270'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) { const a = Math.sin(t * 3 + i) * 1.5 - p.vx * f / 60; ctx.beginPath(); ctx.moveTo(1 + i * 3, -29 - bob); ctx.quadraticCurveTo(-1 + i * 4 + a, -36 - bob, -5 + i * 5 + a * 2, -38 - bob); ctx.stroke(); }
    // crook and lantern
    if (p.hasLantern) {
      ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2, -13 - bob); ctx.lineTo(13, -36); ctx.quadraticCurveTo(17, -41, 15, -30); ctx.stroke();
      ctx.restore();
      const lp = Player.lanternPos(p), on = Player.lit(p);
      ctx.save(); ctx.translate(lp.x, lp.y); ctx.rotate(-p.swing * 0.5);
      ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, -5); ctx.stroke();
      ctx.fillStyle = '#4a3b2a'; ctx.fillRect(-5, -6, 10, 2.5); ctx.fillRect(-5, 5, 10, 2);
      ctx.fillStyle = on ? '#ffd98a' : (p.snuffed > 0 ? '#3a3440' : '#5a4630'); ctx.fillRect(-4, -3.5, 8, 8.5);
      if (on) { ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.ellipse(0, 1.5, 1.8, 2.8 + Math.sin(t * 17) * 0.5, 0, 0, 7); ctx.fill(); }
      else if (!p.open) { ctx.fillStyle = '#2b2218'; ctx.fillRect(-4, -3.5, 8, 8.5); ctx.fillStyle = '#6b5236'; ctx.fillRect(-4, -0.5, 8, 1); }
      ctx.restore();
    } else ctx.restore();
  },
};
