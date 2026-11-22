// ---------------------------------------------------------------- main: the loop that ties it together
function updateCamera(dt) {
  const c = G.cam, p = G.player, L = G.lvl;
  let tx = p.x + p.w / 2 + p.face * 46, ty = p.y - (Dialog.cur ? 14 : 62);   // lift the view while someone is talking, so the box never hides them
  if (c.tx != null) { tx = c.tx; ty = c.ty; }
  c.zoom += (c.tz - c.zoom) * Math.min(1, dt * 2.2);
  const hw = VW / 2 / c.zoom, hh = VH / 2 / c.zoom, W = L.w * TILE, H = L.h * TILE;
  tx = W > hw * 2 ? clamp(tx, hw, W - hw) : W / 2; ty = H > hh * 2 ? clamp(ty, hh, H - hh) : H / 2;
  const k = Math.min(1, dt * (c.tx != null ? 2.4 : 4.5));
  c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
  c.shake = c.shake > 0.3 && !reduceMotion ? c.shake * Math.pow(0.02, dt) : 0;
}
function update(dt) {
  stepFade(dt);
  if (G.mode === 'card') { G.cardT -= dt; if (G.cardT <= 0 && G.cardDone) { const d = G.cardDone; G.cardDone = null; d(); } return; }
  if (G.mode !== 'play') return;
  if (I.pauseP && !G.cut) { G.paused = !G.paused; $('pause').hidden = !G.paused; }
  if (I.journalP && !G.cut && !G.paused) Ui.journal(true);
  if (G.paused) return;
  G.t += dt;
  stepTimers(dt);
  Dialog.update(dt);
  Player.update(G.player, dt);
  Things.update(dt);
  Enemies.update(dt);
  Fx.update(dt);
  G.lvl.def.tick && G.lvl.def.tick(dt);
  if (G.toast) G.toast.t -= dt;
  updateCamera(dt);
  Sfx.music(dt);
}
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  pollInput();
  try {
    update(dt);
    if (G.lvl) { if (!window.__skipDraw) Render.frame(); Hud.sync(); }
    else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#07060d'; ctx.fillRect(0, 0, cv.width, cv.height); }
    Ui.sync();
  } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
resize(); Light.resize(); Ui.title();
requestAnimationFrame(frame);
// hooks for the automated playtest
window.__g = { G, Save, flag, Dialog, startChapter, LEVELS, Player, Things, npc, respawn, Sfx, Render, Light, Draw, Fx };
