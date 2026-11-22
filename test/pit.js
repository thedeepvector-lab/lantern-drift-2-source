const { open } = require('./drv');
(async () => {
  const d = await open(); const log = (...a) => console.log(...a);
  await d.page.click('#newBtn'); await d.run(0.3, {});
  await d.page.evaluate(() => { __g.flag('lantern', 1); __g.flag('dark1', 1); __g.flag('metFiddle', 1); __g.startChapter(2); });
  await d.run(4.5, {}); d.lvl = 2;
  await d.page.evaluate(() => { const p = __g.G.player; p.x = 43 * 32; p.y = 17 * 32 - 26; });
  const t0 = Date.now();
  const tr = async (label) => { const s = await d.state(); const caps = await d.page.evaluate(() => __g.G.ents.filter(e => e.type === 'cap').map(c => +c.open.toFixed(1)).join(' ')); const sn = await d.page.evaluate(() => __g.G.ents.filter(e => e.type === 'snuff').map(c => c.st).join(',')); log(label, 'at', s.tx, s.ty, 'gr', s.ground, 'lit', s.lit, 'caps', caps, 'snuff', sn, s.dying ? 'DYING' : ''); };
  await d.go(44.6); await d.run(0.6, {}); await tr('edge');
  await d.go(47.6, { jumps: [45.0] }); await tr('cap1'); await d.run(0.35, {}); await tr('cap1+');
  await d.go(51.6, { jumps: [48.6] }); await tr('cap2');
  log('ms per tick', ((Date.now() - t0) / d.frame).toFixed(1));
  await d.browser.close();
})();
