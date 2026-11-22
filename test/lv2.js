const { open } = require('./drv');
(async () => {
  const d = await open(); const log = (...a) => console.log(...a);
  await d.page.click('#newBtn'); await d.run(0.3, {});
  await d.page.evaluate(() => { __g.flag('lantern', 1); __g.flag('dark1', 1); __g.startChapter(2); });
  await d.run(4.5, {}); d.lvl = 2;
  await d.go(8); await d.act();
  await d.go(13); await d.talk(30); await d.shot('20-fiddle-voice');
  await d.hood(); log('hooded', (await d.state()).lit);
  await d.go(23.6); await d.hood(); await d.run(0.7, {}); await d.shot('21-chalk-lit');
  let s = await d.talk(20); await d.hood(); log('after chalk lit?', s.lit, s.flags);
  await d.run(1.0, {}); await d.shot('22-snuff');
  await d.go(39); await d.act(); await d.talk(60); await d.shot('23-fiddle');
  const tr = async (label) => { const s = await d.state(); const caps = await d.page.evaluate(() => __g.G.ents.filter(e => e.type === 'cap').map(c => +c.open.toFixed(1)).join(' ')); const sn = await d.page.evaluate(() => __g.G.ents.filter(e => e.type === 'snuff').map(c => c.st).join(',')); log(label, 'at', s.tx, s.ty, 'gr', s.ground, 'lit', s.lit, 'caps', caps, 'snuff', sn, s.dying ? 'DYING' : ''); };
  // glowcap pit
  s = await d.state(); if (!s.lit) await d.hood();
  await tr('pre'); await d.go(44.6); await d.run(0.6, {}); await tr('edge');
  await d.go(43); await d.act();
  await d.go(47.6, { jumps: [45.0] }); await tr('cap1'); await d.run(0.4, {}); await d.hood();
  await d.go(51.6, { jumps: [48.6] }); await d.hood(); await d.run(0.3, {}); await d.hood(); await tr('cap2 peeked');
  await d.go(55.6, { jumps: [52.6] }); await d.hood(); await d.run(0.3, {}); await d.hood(); await tr('cap3 peeked');
  await d.go(59.6, { jumps: [56.6] }); await tr('cap4');
  await d.go(63, { jumps: [60.6] });
  s = await d.state(); log('after pit', s.tx, s.ty, 'dying', s.dying, 'cp', s.cp);
  if ((await d.state()).tx < 60) { log('PIT FAILED'); await d.browser.close(); return; }
  await d.hood(); await d.go(64); await d.act(); await d.go(67); s = await d.talk(30); log('page1', s.pages);
  // high shelf with the cylinder, hooded
  await d.hood(); await d.go(83); await d.climb(-1, 11.9); await d.go(91, { max: 300 }); s = await d.talk(30); log('cylinder', s.pages, s.flags.includes('cylinder'), 'at', s.tx, s.ty);
  await d.shot('26-shelf');
  await d.go(96); await d.run(0.5, {});
  await d.go(99); s = await d.talk(40); await d.shot('27-glimpse'); log('glimpse done', s.tx);
  if (!(await d.state()).lit) await d.hood(); await d.go(103); await d.run(0.8, {}); await d.talk(20); await d.shot('28-tally');
  await d.go(107.3); await d.act(); s = await d.talk(60, 0); log('fiddle2', s.flags);
  for (const x of [116, 112, 120]) { await d.go(x); await d.act(); await d.run(0.3, {}); }
  await d.shot('29-bulbs'); await d.run(3.5, {});
  await d.go(130); await d.act(); await d.shot('30-door-open');
  await d.go(140); await d.climb(-1, 3.2); s = await d.state(); log('top', s.tx, s.ty);
  await d.act(); await d.run(6, {}); s = await d.state(); log('next', s.n, s.mode);
  log('errors', d.errors.slice(0, 5));
  d.done(); await d.browser.close();
})();
