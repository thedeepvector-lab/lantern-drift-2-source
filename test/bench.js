const { open } = require('./drv');
(async () => {
  const d = await open({ w: 1280, h: 720, dsf: 1.5, draw: true });
  await d.page.click('#newBtn'); await d.run(0.3, {});
  await d.page.evaluate(() => { __g.flag('lantern', 1); __g.flag('dark1', 1); __g.startChapter(3); });
  await d.page.evaluate(() => { window.__skipDraw = true; }); await d.run(4.5, {}); await d.page.evaluate(() => { window.__skipDraw = false; });
  const T = async (name, patch) => { if (patch) await d.page.evaluate(patch); let t = Date.now(); for (let i = 0; i < 25; i++) await d.tick({ right: true }); console.log(name, (Date.now() - t) / 25); };
  await T('base');
  await T('no water', () => { __g.Render.drawWater = () => {}; });
  await T('no light', () => { __g.Light.render = () => {}; });
  await T('no lightcast', () => { __g.Light.add = () => {}; });
  await T('no fog', () => { __g.Render.fog = document.createElement('canvas'); __g.Render.fog.width = 2; __g.Render.fog.height = 2; });
  await T('skip all', () => { window.__skipDraw = true; });
  await d.browser.close();
})();
