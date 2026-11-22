const { open } = require('./drv');
(async () => {
  const d = await open(); const log = (...a) => console.log(...a);
  await d.page.click('#newBtn'); await d.run(0.3, {});
  await d.page.evaluate(() => { __g.flag('lantern', 1); __g.flag('dark1', 1); __g.startChapter(3); });
  await d.run(4.5, {}); d.lvl = 3;
  await d.go(11.4); await d.talk(30); await d.go(11.6); await d.act(); await d.run(1.2, {});
  let hold = 0, used = false;
  for (let i = 0; i < 70; i++) { const s = await d.state(); const inp = { right: true }; if (!used && Math.abs(s.tx - 13.3) < 0.3 && s.ground) { hold = 11; used = true; } if (hold > 0) { inp.jump = true; hold--; } await d.tick(inp);
    const m = await d.page.evaluate(() => { const e = __g.G.ents.find(e => e.type === 'mire'); const p = __g.G.player; return [e.st, (e.x / 32).toFixed(1), Math.round(e.y), 'vy', Math.round(p.vy), 'stun', p.stun.toFixed(2)]; });
    if (i % 2 === 0) log(i, s.tx, s.ty, s.ground, s.dying, s.lit, m.join(' ')); }
  await d.browser.close();
})();
