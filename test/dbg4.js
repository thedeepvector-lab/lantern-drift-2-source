// Why can't the bot turn the first mirror? Measure it instead of guessing.
const { open } = require('./drv');
(async () => {
  const d = await open();
  await d.page.click('#newBtn'); await d.run(0.3, {});
  await d.page.evaluate(() => { __g.flag('lantern', 1); __g.flag('dark1', 1); __g.flag('metBrine', 1); __g.startChapter(4); });
  await d.run(4.5, {}); d.lvl = 4;
  await d.go(23.4);
  const r = await d.page.evaluate(() => {
    const G = __g.G, p = G.player, m = G.ents.find(e => e.type === 'mirror');
    const nib = { x: Math.round(p.x + p.w / 2), y: Math.round(p.y + p.h / 2) }, mir = { x: m.x, y: m.y - 14 };
    const dist = Math.hypot(nib.x - mir.x, nib.y - mir.y);
    return { mir, nib, dist: +dist.toFixed(1), range: m.range };
  });
  console.log('mirror ', r.mir); console.log('nib    ', r.nib);
  console.log('dist   ', r.dist, '    range', r.range, '    can reach:', r.dist < r.range);
  await d.browser.close();
})();
