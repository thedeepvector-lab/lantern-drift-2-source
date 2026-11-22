const { open } = require('./drv');
(async () => {
  const d = await open();
  await d.shot('00-title');
  await d.page.click('#newBtn');
  await d.run(4.2, {});
  console.log('after card', await d.state());
  await d.run(2, {}); await d.shot('01-festival');
  const lines = [];
  // opening: advance until the press prompts, press three times, continue
  let s = await d.talk(90, 0, l => lines.push(l));
  console.log(lines.join('\n'));
  console.log('after opening', s);
  await d.shot('02-after-opening');
  await d.run(2.5, { right: true }); await d.shot('03-walking');
  console.log('walked', await d.state());
  console.log('errors', d.errors.slice(0, 6));
  await d.browser.close();
})();
