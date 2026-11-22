// Headless driver: steps the game on a fake clock so runs are exact and repeatable.
const { chromium } = require('playwright');
const fs = require('fs');
const FONT = '/root/fonts/node_modules/@fontsource/';
const css = `
@font-face{font-family:"Fraunces";font-weight:400;src:url(file://${FONT}fraunces/files/fraunces-latin-400-normal.woff2)}
@font-face{font-family:"Fraunces";font-weight:600;src:url(file://${FONT}fraunces/files/fraunces-latin-600-normal.woff2)}
@font-face{font-family:"Fraunces";font-weight:900;src:url(file://${FONT}fraunces/files/fraunces-latin-900-normal.woff2)}
@font-face{font-family:"Cormorant Garamond";font-style:italic;font-weight:500;src:url(file://${FONT}cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2)}
@font-face{font-family:"Cormorant Garamond";font-style:italic;font-weight:600;src:url(file://${FONT}cormorant-garamond/files/cormorant-garamond-latin-600-italic.woff2)}
@font-face{font-family:"IBM Plex Mono";font-weight:400;src:url(file://${FONT}ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2)}
@font-face{font-family:"IBM Plex Mono";font-weight:600;src:url(file://${FONT}ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2)}`;
async function open(opts = {}) {
  const browser = await chromium.launch();
  const REC = process.env.REC; if (REC) { opts.w = 1920; opts.h = 1080; opts.dpr = 2 / 3; opts.draw = true; fs.mkdirSync(REC, { recursive: true }); }
  const page = await browser.newPage({ viewport: { width: opts.w || 1280, height: opts.h || 720 }, deviceScaleFactor: opts.dsf || 1 });
  if (opts.dpr) await page.addInitScript(v => { window.__dpr = v; }, opts.dpr);
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
  await page.clock.install({ time: new Date('2026-11-15T08:00:00') });
  await page.goto('file:///home/claude/ld2/dist/index.html');
  await page.clock.pauseAt(new Date('2026-11-15T08:00:01'));
  await page.clock.runFor(300);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  if (!opts.draw) await page.evaluate(() => { window.__skipDraw = true; });
  const cdp = REC ? await page.context().newCDPSession(page) : null;
  let acc = 0; const meta = []; let label = '';
  const d = { browser, page, errors, frame: 0, meta, done() { if (REC) fs.writeFileSync(REC + '/meta.json', JSON.stringify(meta)); },
    async tick(input) {   // one 30 fps frame with the given input held
      if (input !== undefined) await page.evaluate(i => { window.__in = i; }, input);
      acc += 1000 / 30; const s = Math.round(acc); acc -= s; await page.clock.runFor(s); d.frame++;
      if (REC && !d.norec) { const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, optimizeForSpeed: true }); fs.writeFileSync(`${REC}/${String(meta.length).padStart(5, '0')}.jpg`, Buffer.from(r.data, 'base64')); const st = await page.evaluate(() => { const { G, Dialog } = __g; const p = G.player; return { n: G.n, mode: G.mode, cut: !!G.cut, tx: p ? +((p.x + 9) / 32).toFixed(1) : 0, who: Dialog.cur ? Dialog.cur.who || Dialog.cur.kind : '' }; }); st.l = label; label = ''; meta.push(st); if (meta.length % 300 === 0) fs.writeFileSync(REC + '/meta.json', JSON.stringify(meta)); }
    },
    async run(sec, input) { const n = Math.round(sec * 30); for (let i = 0; i < n; i++) await d.tick(i === 0 ? input : undefined); },
    state() { return page.evaluate(() => { const { G, Dialog, Save, Player } = __g; const p = G.player; return { n: G.n, mode: G.mode, cut: G.cut, x: p ? Math.round(p.x + 9) : 0, y: p ? Math.round(p.y + 26) : 0, tx: p ? +((p.x + 9) / 32).toFixed(1) : 0, ty: p ? +((p.y + 26) / 32).toFixed(1) : 0, ground: p && p.onGround, lit: p && Player.lit(p), dlg: Dialog.cur ? { kind: Dialog.cur.kind, who: Dialog.cur.who, text: Dialog.cur.text.slice(0, 50), len: Dialog.cur.text.length, done: Dialog.cur.n >= Dialog.cur.text.length } : null, cp: G.cpIndex, dying: !!G.dying, toast: G.toast && G.toast.t > 0 ? G.toast.text.slice(0, 60) : null, pages: Save.data.pages.length, flags: Object.keys(Save.data.flags).join(',') }; }); },
    async shot(name) { if (REC) { label = name; return; } await page.evaluate(() => { window.__skipDraw = false; }); await page.clock.runFor(34); await page.screenshot({ path: `/home/claude/ld2/test/shots/${name}.jpg`, type: 'jpeg', quality: 82 }); await page.evaluate(() => { window.__skipDraw = true; }); },
    shotOld(name) { return page.screenshot({ path: `/home/claude/ld2/test/shots/${name}.jpg`, type: 'jpeg', quality: 82 }); },
    // walk to tile x; jumps: tile xs where a jump starts (held for a full-height jump); stops early if a scene starts
    async go(tx, o = {}) {
      let hold = 0, used = new Set();
      for (let i = 0; i < (o.max || 1200); i++) {
        const s = await d.state();
        if (s.dlg || s.cut) { if (o.noTalk) return s; await d.talk(60, o.pick || 0); continue; }
        if (s.n !== d.lvl && d.lvl) return s;
        const dx = tx * 32 + 16 - s.x;
        if (Math.abs(dx) < (o.tol || 8)) { await d.tick(Object.assign({}, o.keys)); return s; }
        const inp = Object.assign({ right: dx > 0, left: dx < 0 }, o.keys);
        for (const j of o.jumps || []) if (!used.has(j) && Math.abs(s.tx - j) < 0.3 && s.ground) { hold = o.hold || 11; used.add(j); }
        if (hold > 0) { inp.jump = true; hold--; }
        await d.tick(inp);
      }
      console.log('GO TIMEOUT ->', tx, JSON.stringify(await d.state()).slice(0, 160));
    },
    async climb(dir, untilTy, max = 300) { for (let i = 0; i < max; i++) { await d.tick(dir < 0 ? { up: true } : { down: true }); const s = await d.state(); if (dir < 0 ? s.ty <= untilTy : s.ty >= untilTy) return s; } console.log('CLIMB TIMEOUT', await d.state()); },
    async act() { await d.tick({ act: true }); await d.tick({}); },
    async hood() { await d.tick({ hood: true }); await d.tick({}); },
    // advance any dialogue; pick = choice index for choices
    async talk(maxSec = 60, pick = 0, log) {
      for (let i = 0; i < maxSec * 30; i++) {
        const s = await d.state();
        if (!s.cut && !s.dlg) return s;
        if (s.dlg && s.dlg.done) { if (log) log(s.dlg.who + ': ' + s.dlg.text); if (REC) await d.run(Math.min(2.4, Math.max(0.7, (s.dlg.len || 40) * 0.03)), {}); await d.tick({ act: true, pick }); await d.tick({}); }
        else if (s.dlg) { await d.tick({ act: true }); await d.tick({}); }
        else await d.tick({});
      }
      return d.state();
    },
  };
  return d;
}
module.exports = { open };
