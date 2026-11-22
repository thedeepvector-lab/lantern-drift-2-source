const { open } = require('./drv'); const fs = require('fs');
(async () => {
  const d = await open({ w: 1920, h: 1080, dpr: 2 / 3, draw: true });
  await d.page.click('#newBtn'); await d.run(0.3, {});
  await d.page.evaluate(() => { __g.flag('lantern', 1); __g.flag('dark1', 1); __g.startChapter(3); });
  await d.run(5, {});
  const cdp = await d.page.context().newCDPSession(d.page);
  let t = Date.now(); for (let i = 0; i < 25; i++) { await d.tick({ right: true }); const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 86, optimizeForSpeed: true }); fs.writeFileSync('/tmp/claude-0/-home-claude/b6cc9fd6-7216-5662-b1b4-510910ed8f05/scratchpad/c.jpg', Buffer.from(r.data, 'base64')); } console.log('cdp fast', (Date.now() - t) / 25);
  t = Date.now(); for (let i = 0; i < 25; i++) { await d.tick({ right: true }); await d.page.screenshot({ path: '/tmp/claude-0/-home-claude/b6cc9fd6-7216-5662-b1b4-510910ed8f05/scratchpad/b.jpg', type: 'jpeg', quality: 86 }); } console.log('pw', (Date.now() - t) / 25);
  await d.browser.close();
})();
