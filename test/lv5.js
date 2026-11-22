const { open } = require('./drv');
(async () => {
  const d = await open(); const log = (...a) => console.log(...a);
  const ally = process.argv[3] === 'ally', pick = +(process.argv[2] || 0);
  await d.page.click('#newBtn'); await d.run(0.3, {});
  await d.page.evaluate(a => { __g.flag('lantern', 1); __g.flag('dark1', 1); __g.flag('metBrine', 1); __g.flag('wickTold', 1); if (a) { __g.flag('fiddleAlly', 1); __g.flag('brineTruth', 1); } __g.startChapter(5); }, ally);
  await d.run(4.5, {}); d.lvl = 5;
  const q = () => d.page.evaluate(() => { const G = __g.G, U = G.ents.find(e => e.type === 'umbra'), L = __g.LEVELS[5]; return { u: U.st, ux: Math.round(U.x / 32), flame: Math.round(L.flame), cr: G.ents.filter(e => e.type === 'crank').map(c => c.done ? 1 : +c.prog.toFixed(2)), bz: G.ents.filter(e => e.type === 'brazier').map(b => b.lit ? 1 : 0), dawn: +L.dawn.toFixed(2) }; });
  let s;
  await d.go(7); await d.act(); await d.go(9.2, { noTalk: true }); await d.run(3, {}); await d.shot('51-arrive');
  s = await d.talk(120); log('arrived', JSON.stringify(await q())); await d.shot('52-hunt');
  const lightBrazier = async tx => { await d.go(tx - 0.5); let st = await d.state(); if (!st.lit) await d.hood(); for (let i = 0; i < 200; i++) { await d.act(); const z = await q(); if (z.bz.some(b => b)) break; await d.run(0.3, {}); } await d.hood(); };
  const crank = async (tx, idx) => { await d.go(tx - 0.4, { tol: 6 }); for (let i = 0; i < 40; i++) { await d.act(); await d.run(2.6, {}); const z = await q(); if (z.cr[idx] === 1) return true; if ((await d.state()).cut) return true; } return false; };
  await lightBrazier(18); log('b1', JSON.stringify(await q())); await d.run(1.5, {}); await d.shot('53-brazier');
  log('crank0', await crank(22, 0), JSON.stringify(await q()));
  await lightBrazier(46); log('b2', JSON.stringify(await q()));
  log('crank2', await crank(40, 2), JSON.stringify(await q())); await d.shot('54-two');
  await d.go(26); await d.climb(-1, 10.95); log('plat', (await d.state()).ty);
  log('crank1', await crank(30, 1), JSON.stringify(await q()));
  await d.run(4, {}); await d.shot('55-dawn1'); await d.run(5, {}); await d.shot('56-dawn2');
  const lines = [];
  for (let i = 0; i < 400; i++) { s = await d.state(); const epi = await d.page.evaluate(() => !document.getElementById('epi').hidden); if (epi) break; if (s.dlg && s.dlg.kind === 'choose' && s.dlg.done) await d.shot('57-choice'); if (s.dlg && s.dlg.done) { lines.push(s.dlg.who + ': ' + s.dlg.text); if (process.env.REC) await d.run(Math.min(2.6, Math.max(0.9, (s.dlg.len || 40) * 0.035)), {}); await d.tick({ act: true, pick }); await d.tick({}); } else await d.run(0.2, s.dlg ? { act: true } : {}); if (i === 60) await d.shot('57-glow'); }
  log(lines.join('\n')); log(JSON.stringify(await q()));
  await d.run(3, {}); await d.shot('58-epi' + pick);
  log('epi text:', await d.page.evaluate(() => document.getElementById('epi').innerText.slice(0, 900)));
  for (let i = 0; i < 60; i++) { await d.run(process.env.REC ? 3.2 : 2, {}); await d.tick({ act: true }); await d.tick({}); const t = await d.page.evaluate(() => !document.getElementById('title').hidden); if (t) { log('back at title after', i); break; } }
  await d.shot('59-title-after');
  log('save', await d.page.evaluate(() => JSON.stringify(__g.Save.data).slice(0, 300)));
  log('errors', d.errors.slice(0, 5));
  d.done(); await d.browser.close();
})();
