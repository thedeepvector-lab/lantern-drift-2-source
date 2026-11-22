// ---------------------------------------------------------------- ui: dialogue box, HUD, cards and menus live in the page, over the canvas
const $ = id => document.getElementById(id);
const Hud = {
  last: {},
  set(id, v) { if (this.last[id] !== v) { this.last[id] = v; $(id).textContent = v; } },
  flame(v) { const el = $('flame'); if (v == null) { if (!el.hidden) el.hidden = true; return; } if (el.hidden) el.hidden = false; $('flamebar').style.width = v.toFixed(0) + '%'; },
  sync() {
    const p = G.player; if (!p) return;
    this.set('lanternState', !p.hasLantern ? 'none' : p.snuffed > 0 ? 'out' : p.open ? 'lit' : 'hooded');
    $('lanternChip').dataset.s = !p.hasLantern ? 'none' : p.snuffed > 0 ? 'out' : p.open ? 'lit' : 'hooded';
    this.set('pageCount', Save.data.pages.length + ' / ' + PAGE_TOTAL);
    this.set('chapName', G.lvl.def.roman + ' · ' + G.lvl.def.title);
    const t = G.toast, el = $('toast');
    if (t && t.t > 0) { this.set('toast', t.text); el.classList.add('show'); } else el.classList.remove('show');
    $('bars').classList.toggle('on', G.cut && G.mode === 'play');
  },
};
const PAGE_TOTAL = LEVELS.reduce((n, l) => n + (l && l.pages ? l.pages.length : 0), 0);

const Ui = {
  lastKey: '', pc: null,
  portrait(who) {
    const c = $('portrait'), g = c.getContext('2d'), main = ctx;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
    const col = CAST[who].col; const bg = g.createRadialGradient(48, 44, 4, 48, 48, 52); bg.addColorStop(0, rgba(col, 0.35)); bg.addColorStop(1, rgba(col, 0.04)); g.fillStyle = bg; g.fillRect(0, 0, 96, 96);
    ctx = g; g.setTransform(3, 0, 0, 3, 0, 0);
    if (who === 'nib') { const p = G.player; Player.draw({ x: 16 - 9 - 3, y: 38 - 26, w: 18, h: 26, vx: 0, vy: 0, onGround: true, face: 1, hasLantern: false, walkT: 0, swing: 0, land: 0, glow: p ? p.glow : 0, open: true, snuffed: 0 }); }
    else if (who === 'fiddle') { g.setTransform(2.6, 0, 0, 2.6, 0, 0); Draw.fiddle(14, 34, { face: 1 }); }
    else if (who === 'brine') { g.setTransform(2.4, 0, 0, 2.4, 0, 0); Draw.bot(18, 70, 1, { brine: true, lens: [120, 230, 230] }); }
    else if (who === 'maren') { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#e9e1cc'; g.fillRect(26, 18, 44, 58); g.fillStyle = '#a89c80'; for (let k = 0; k < 7; k++) g.fillRect(32, 28 + k * 6, 32 - (k === 6 ? 12 : 0), 2); }
    else Draw.lumen(13, 37, { face: 1, old: who === 'wick' || who === 'sorrel', glow: who === 'wick' ? 0.35 : 0.8, s: who === 'kid' ? 0.85 : 1, col: CAST[who].col });
    ctx = main;
  },
  sync() {
    const c = Dialog.cur, box = $('dlg'), pg = $('pagecard'), pr = $('press');
    box.hidden = !(c && (c.kind === 'say' || c.kind === 'choice')); pg.hidden = !(c && c.kind === 'page'); pr.hidden = !(c && c.kind === 'press');
    if (!c) { this.lastKey = ''; return; }
    if (c.kind === 'press') { $('pressLabel').textContent = c.text; return; }
    const shown = c.text.slice(0, Math.floor(c.n)), done = c.n >= c.text.length;
    if (c.kind === 'page') { $('pageTitle').textContent = c.title; $('pageText').textContent = shown; $('pageHint').style.opacity = done ? 1 : 0; return; }
    const key = c.who + '|' + c.text;
    if (key !== this.lastKey) { this.lastKey = key; this.portrait(c.who); $('dlgName').textContent = CAST[c.who].name; $('dlgName').style.color = rgba(CAST[c.who].col, 1); $('choices').innerHTML = ''; this.selShown = -1; }
    $('dlgText').textContent = shown;
    $('dlgHint').style.opacity = done && c.kind === 'say' ? 1 : 0;
    const ch = $('choices');
    if (c.kind === 'choice' && done) {
      if (!ch.children.length) c.options.forEach((o, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = o; b.addEventListener('click', () => { c.sel = i; tapped.act = true; }); ch.appendChild(b); });
      if (this.selShown !== c.sel) { this.selShown = c.sel; [...ch.children].forEach((b, i) => b.classList.toggle('sel', i === c.sel)); }
    }
  },
  card(def, done) {
    $('chNum').textContent = 'Chapter ' + def.roman; $('chTitle').textContent = def.title; $('chEpi').textContent = def.epi;
    const el = $('chcard'); el.classList.add('show'); G.cardT = 3.4; G.cardDone = () => { el.classList.remove('show'); done(); };
  },
  journal(open) {
    const el = $('journal'); if (!open) { el.hidden = true; G.paused = false; return; }
    const body = $('journalBody'); body.innerHTML = '';
    LEVELS.forEach((l, n) => { if (!l || !l.pages) return; l.pages.forEach((pg, i) => { const got = Save.data.pages.includes(n + ':' + i), d = document.createElement('div'); d.className = 'entry' + (got ? '' : ' missing');
      const h = document.createElement('h3'); h.textContent = got ? pg[0] : 'Chapter ' + l.roman + ' · not found yet'; d.appendChild(h); if (got) { const p = document.createElement('p'); p.textContent = pg[1]; d.appendChild(p); } body.appendChild(d); }); });
    el.hidden = false; G.paused = true; $('closeJournal').focus();
  },
  title() {
    G.mode = 'title'; $('title').hidden = false; $('hud').hidden = true; Sfx.setMood(null);
    const has = Save.data.chapter > 1 || Save.data.cp != null || flag('dark1');
    $('continueBtn').hidden = !has; $('continueBtn').textContent = 'Continue · Chapter ' + (LEVELS[Save.data.chapter] || LEVELS[1]).roman;
    $('newBtn').textContent = has ? 'New game' : 'Begin';
    $('endNote').textContent = Save.data.endings.length ? 'Endings found: ' + Save.data.endings.length + ' of 2' : '';
  },
};
function startChapter(n, cp) {
  $('title').hidden = true; $('hud').hidden = false; G.mode = 'card'; G.fade = 1; G.fadeDir = 0;
  loadLevel(n, cp);
  Ui.card(LEVELS[n], () => { G.mode = 'play'; G.fadeDir = -1.2; });
}
const Epilogue = {
  async run(id) {
    const L = [];
    if (id === 'down') { L.push('Nib left the three mirrors turned east.'); L.push('Every dawn since, one beam falls down the Well and into the Heartlamp. Hollowmere wakes with it. Nobody there has gone grey again.'); }
    else { L.push('Nib rang the keeper’s bell down the Well until her arms shook.'); L.push('They came up blinking, one family at a time, into a sky none of them had a word for. Hollowmere is quiet now. Someone leaves a lantern at the Well on festival night.'); }
    L.push(flag('fiddleAlly') ? 'Fiddle moved into the lamp room. He says the acoustics are terrible. He plays the whole lullaby at dusk, middle and all.' : 'Down in the Root Cellar, a cricket still plays a song with a hole in it. In Hollowmere, a small brass cylinder sits on a shelf, proving everything.');
    L.push(flag('brineTruth') ? 'Brine stands in the east window where it stopped. The children polish it on festival night.' : 'Brine polishes the lens each morning and asks when the keeper is coming. Nib always gives the same answer. In the morning.');
    L.push('Wick is buried where the first light lands.');
    L.push('The great moth comes at dusk and leaves at dawn, full. Nobody calls it the Gloam any more.');
    L.push('On festival night the children line up with their lanterns. Nib goes first now.\nShe lights it from her own glow.');
    const el = $('epi'), tx = $('epiText'); el.hidden = false; el.classList.add('show');
    for (const line of L) { tx.classList.remove('in'); await wait(0.5); tx.textContent = line; tx.classList.add('in'); await wait(1.0); await Dialog.press('Continue'); }
    tx.classList.remove('in'); await wait(0.6);
    $('epiEnd').hidden = false; $('epiStats').textContent = `Ending: ${id === 'down' ? 'Carry the Morning Down' : 'Call Them Up'} · Journal pages: ${Save.data.pages.length} of ${PAGE_TOTAL} · Endings found: ${Save.data.endings.length} of 2`;
    tx.textContent = '';
    await Dialog.press('Back to the title');
    el.classList.remove('show'); el.hidden = true; $('epiEnd').hidden = true;
    const keep = Save.data.endings; Save.reset(); Save.data.endings = keep; Save.write(); G.cut = false; Ui.title();
  },
};
// buttons
$('newBtn').addEventListener('click', () => { Sfx.init(); const keep = Save.data.endings; Save.reset(); Save.data.endings = keep; startChapter(1); });
$('continueBtn').addEventListener('click', () => { Sfx.init(); startChapter(Save.data.chapter || 1, Save.data.cp); });
$('journalBtn').addEventListener('click', () => Ui.journal(true));
$('closeJournal').addEventListener('click', () => Ui.journal(false));
$('muteBtn').addEventListener('click', () => { Sfx.setMuted(!Sfx.muted); $('muteBtn').textContent = Sfx.muted ? 'Sound off' : 'Sound on'; });
$('resumeBtn').addEventListener('click', () => { $('pause').hidden = true; G.paused = false; });
$('quitBtn').addEventListener('click', () => { $('pause').hidden = true; G.paused = false; Ui.title(); });
$('chcard').addEventListener('pointerdown', () => { if (G.cardT > 0.4) G.cardT = Math.min(G.cardT, 0.01); });
$('dlg').addEventListener('pointerdown', e => { if (!e.target.closest('button')) tapped.act = true; });
$('pagecard').addEventListener('pointerdown', () => { tapped.act = true; });
$('press').addEventListener('pointerdown', () => { tapped.act = true; });
$('epi').addEventListener('pointerdown', () => { tapped.act = true; });
