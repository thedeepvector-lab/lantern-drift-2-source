const { open } = require('./drv');
(async () => {
  const d = await open({ w: 400, h: 800, draw: true });
  await d.run(0.5, {});
  await d.page.click('#newBtn'); await d.run(0.3, {});
  await d.page.evaluate(() => { __g.flag('lantern', 1); __g.flag('dark1', 1); __g.startChapter(2); document.body.classList.add('is-touch'); });
  await d.run(5, {});
  await d.page.screenshot({ path: 'test/shots/p-a.jpg', type: 'jpeg', quality: 80 });
  await d.go(12.5, { noTalk: true }); await d.run(1.5, {});
  await d.page.screenshot({ path: 'test/shots/p-play.jpg', type: 'jpeg', quality: 80 });
  console.log(JSON.stringify(await d.state()), await d.page.evaluate(() => [document.documentElement.scrollWidth, innerWidth, document.getElementById('c').width, document.getElementById('c').height, getComputedStyle(document.body).backgroundColor]), d.errors);
  await d.browser.close();
})();
