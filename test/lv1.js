const { open } = require('./drv');
(async () => {
  const d = await open();
  await d.page.click('#newBtn'); await d.run(4.2, {});
  await d.run(3, {}); await d.shot('01-festival');
  let s = await d.talk(90);
  await d.shot('02-after-opening');
  // walk right to the lamp (x=45), light it
  await d.go(45); await d.act(); await d.run(0.5, {}); console.log('lamp', (await d.state()).cp);
  await d.shot('03-lamp');
  await d.go(56, { jumps: [46.9, 50.9] }); await d.run(1.5, {}); s = await d.talk(20); await d.shot('04-chalk'); console.log('at chalk', s.tx, s.ty);
  await d.go(61); await d.climb(-1, 3.2);
  await d.shot('05-well'); console.log('top', await d.state());
  await d.tick({ act: true }); await d.run(6, {});
  s = await d.state(); console.log('next', s.n, s.mode, s.tx, s.ty);
  await d.run(1.5, {}); await d.shot('06-ch2');
  console.log('errors', d.errors.slice(0, 5));
  d.done(); await d.browser.close();
})();
