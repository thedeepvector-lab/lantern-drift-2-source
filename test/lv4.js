const { open } = require('./drv');
(async () => {
  const d = await open(); const log = (...a) => console.log(...a);
  await d.page.click('#newBtn'); await d.run(0.3, {});
  await d.page.evaluate(() => { __g.flag('lantern', 1); __g.flag('dark1', 1); __g.flag('metBrine', 1); __g.startChapter(4); });
  await d.run(4.5, {}); d.lvl = 4;
  const ward = i => d.page.evaluate(i => { const w = __g.G.ents.filter(e => e.type === 'warden')[i]; return { x: +(w.x / 32).toFixed(1), st: w.st, dir: w.dir }; }, i);
  const fl = k => d.page.evaluate(k => !!__g.flag(k), k);
  const waitFor = async (fn, max = 60, keys = {}) => { for (let i = 0; i < max * 30; i++) { if (await fn()) return true; await d.tick(keys); } log('WAIT TIMEOUT'); return false; };
  let s;
  await d.go(7); await d.act(); await d.go(10.2); await d.act(); s = await d.talk(40); await d.shot('41-brine');
  await d.go(23.4); await d.shot('42-beam-before');
  for (let i = 0; i < 3 && !(await fl('lock1')); i++) { await d.act(); await d.run(1.2, {}); }
  log('lock1', await fl('lock1')); await d.run(1.5, {}); await d.shot('43-lock1');
  await d.go(33); s = await d.talk(40); log('page', s.pages, s.tx);
  await d.go(35); await d.run(0.8, {}); s = await d.talk(20); await d.shot('44-chalk');
  await d.go(35.5); await d.hood(); await waitFor(async () => { const w = await ward(0); return w.dir === 1 && w.x > 50; }, 90); await d.hood(); await d.go(36.6); await d.act(); await d.run(0.5, {}); log('lure lit; warden', await ward(0));
  await d.hood(); await d.go(39); await d.climb(-1, 13.95); await d.go(41);
  await waitFor(async () => (await ward(0)).st === 'snuffing', 80); log('warden', await ward(0)); await d.shot('45-warden-lure');
  await d.go(43.5); await d.go(57.2, {}); s = await d.state(); log('past warden', s.tx, s.ty, 'dying', s.dying, 'cp', s.cp);
  await d.go(63, { jumps: [57.9, 59.5] }); s = await d.state(); log('on step', s.tx, s.ty); await d.act(); s = await d.state(); log('cp', s.cp, 'lit', s.lit);
  if (!s.lit) await d.hood();
  // puzzle 2
  const mir = () => d.page.evaluate(() => __g.G.ents.filter(e => e.type === 'mirror').map(m => [Math.round(m.x / 32), Math.round(m.y / 32), m.dir !== undefined ? m.dir : m.st]));
  log('mirrors', JSON.stringify(await mir()));
  await d.shot('46-puzzle2');
  const tryAt = async () => { await d.act(); await d.run(1.0, {}); return fl('lock2'); };
  await d.go(71.4); await tryAt(); 
  await d.go(69); await d.climb(-1, 10.95); await d.go(72); log('on catwalk', (await d.state()).ty);
  let ok = await fl('lock2');
  for (let a = 0; a < 2 && !ok; a++) { await d.go(72.4); if (a) ok = await tryAt(); for (let b = 0; b < 2 && !ok; b++) { await d.go(83.6); ok = await tryAt(); } }
  log('lock2', ok, JSON.stringify(await mir())); await d.shot('47-lock2');
  await d.go(88); await d.go(96, {}); s = await d.state(); log('at', s.tx, s.ty); await d.act();
  await d.go(98); await d.run(0.8, {}); await d.talk(20);
  await d.go(101); await d.act(); await d.run(1, {}); await d.shot('48-wick');
  const lines = []; s = await d.talk(200, +(process.argv[2] || 0), t => lines.push(t)); log('wick lines', lines.length, 'told', await fl('wickTold'), 'truth', await fl('brineTruth'));
  await d.shot('49-after-wick');
  await d.go(114); await d.act(); await d.run(6, {}); s = await d.state(); log('next', s.n, s.mode);
  log('errors', d.errors.slice(0, 5));
  d.done(); await d.browser.close();
})();
