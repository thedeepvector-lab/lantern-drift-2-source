// ---------------------------------------------------------------- levels: maps are carved from solid rock, then the story is attached
function carveMap(w, h, ops) {
  const g = Array.from({ length: h }, () => Array(w).fill('#'));
  for (const [op, a, b, c, d, e] of ops) {
    if (op === 'carve') for (let y = b; y < b + d; y++) for (let x = a; x < a + c; x++) g[y][x] = ' ';
    else if (op === 'fill') for (let y = b; y < b + d; y++) for (let x = a; x < a + c; x++) g[y][x] = '#';
    else if (op === 'rect') for (let y = c; y < c + e; y++) for (let x = b; x < b + d; x++) g[y][x] = a;      // ['rect', ch, x, y, w, h]
    else if (op === 'put') g[c][b] = a;                                                                       // ['put', ch, x, y]
  }
  return g.map(r => r.join(''));
}
const say = (w, t) => Dialog.say(w, t);
const npc = i => G.ents.filter(e => e.type === 'npc')[i];
const T = TILE;
function bigLamp(x, fy, k, broken) {   // the Heartlamp below, and the Great Lens above, are the same shape on purpose
  const t = G.t; ctx.save(); ctx.translate(x, fy);
  ctx.fillStyle = '#3a3340'; ctx.fillRect(-46, -14, 92, 14); ctx.fillRect(-36, -26, 72, 12);
  ctx.strokeStyle = '#8a7a5c'; ctx.lineWidth = 4; ctx.fillStyle = `rgba(${lerp(40, 255, k) | 0},${lerp(44, 220, k) | 0},${lerp(60, 150, k) | 0},${0.35 + k * 0.5})`;
  ctx.beginPath(); ctx.moveTo(-30, -26); ctx.bezierCurveTo(-52, -70, -40, -128, 0, -140); ctx.bezierCurveTo(40, -128, 52, -70, 30, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(138,122,92,0.8)'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 12, -26); ctx.quadraticCurveTo(i * 20, -86, i * 5, -138); ctx.stroke(); }
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.ellipse(0, -26 - i * 28, 42 - i * 4, 5, 0, 0, 7); ctx.stroke(); }
  if (broken) { ctx.strokeStyle = '#1a1622'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-8, -138); ctx.lineTo(4, -104); ctx.lineTo(-12, -84); ctx.lineTo(8, -60); ctx.lineTo(-2, -36); ctx.stroke(); ctx.beginPath(); ctx.moveTo(4, -104); ctx.lineTo(26, -92); ctx.stroke(); }
  if (k > 0.05) { ctx.fillStyle = `rgba(255,246,214,${k})`; ctx.beginPath(); ctx.ellipse(0, -70, Math.max(0.5, 9 * k + Math.sin(t * 9) * 1.2), 26 * k, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#4a4252'; ctx.beginPath(); ctx.moveTo(-12, -140); ctx.lineTo(12, -140); ctx.lineTo(0, -156); ctx.fill();
  ctx.restore();
}
function playLullaby() { [262, 294, 330, 392, 440, 392, 330, 392].forEach((f, i) => Sfx.tone(f, 1.6, 0.1, 'triangle', i * 0.42)); }

const LEVELS = [null,
// =========================================================================================== I · Hollowmere, Unlit
{ roman: 'I', title: 'Hollowmere, Unlit', epi: 'On the night everyone was looking at the light, the light went out.', theme: 'hollow', mood: 'hollow', exitLabel: 'Climb the Well',
  map: carveMap(70, 24, [['carve', 1, 4, 68, 12], ['fill', 48, 15, 20, 1], ['fill', 52, 14, 16, 1], ['carve', 60, 1, 3, 3],
    ['rect', 'H', 61, 2, 1, 12], ['put', 'P', 6, 15], ['put', 'N', 14, 15], ['put', 'N', 22, 15], ['put', 'N', 26, 15], ['put', 'N', 31, 15], ['put', 'N', 35, 15], ['put', 'N', 39, 15],
    ['put', 'L', 45, 15], ['put', 'c', 56, 13], ['put', 'X', 61, 2], ['put', '1', 43, 15]]),
  heart: 1, hx: 30 * T + 16, fy: 16 * T,
  npcs: [
    { who: 'kid', s: 0.8, col: [255, 190, 150], glow: 0.5, face: 1, talk: async () => { await say('nib', flag('dark1') ? 'Tansy? Tansy, wake up.' : 'Nice lantern, Tansy.'); if (flag('dark1')) await say('nib', 'Out cold. Her glow’s gone grey, like in Sorrel’s stories.'); else await say('kid', 'It’s only little. Mum says everyone’s is a bit littler now.'); } },
    { who: 'sorrel', old: true, glow: 0.7, face: -1, talk: async () => { if (flag('dark1')) { await say('nib', 'I’ll bring it back, Sorrel. Then you can tell me it didn’t matter.'); } else await say('sorrel', 'Go on, love. Stand by the Heartlamp with the others.'); } },
    { who: 'lumen', glow: 0.6, face: 1 }, { who: 'wick', old: true, glow: 0.45, face: 1, hidden: true, jar: 1 }, { who: 'lumen', glow: 0.5, face: -1 }, { who: 'lumen', glow: 0.35, face: -1, s: 0.9 },
  ],
  chalk: [{ t: 'sun', s: 'morning' }],
  setup(L) { this.heart = flag('dark1') ? 0 : 1; if (flag('dark1')) G.ents.forEach(e => { if (e.type === 'npc') e.asleep = true; }); },
  enter(L, resumed) { if (!flag('dark1')) cutscene(() => this.opening()); },
  async opening() {
    const p = G.player, S = npc(1), K = npc(0), W = npc(3), fy = this.fy;
    p.x = 24.5 * T; p.face = 1; look(this.hx - 60, fy - 46, 1.2);
    await wait(1.6);
    await say('sorrel', 'The Festival of the First Lantern. Every child lights one from their own glow, the way Wick did the morning he woke us.');
    await say('kid', 'Me first! Me first!');
    K.lantern = 1; Sfx.lamp(); Fx.spark(K.x + 10, K.y - 30, 12); await wait(0.9);
    await say('sorrel', 'Lovely, Tansy. Now, Nib. Your turn, love.');
    for (let i = 0; i < 3; i++) { await Dialog.press(i ? 'Try again' : 'Light your lantern'); Sfx.noise(0.12, 0.08, 1800, 3); Fx.spark(p.x + 20, p.y - 6, 4, [160, 150, 190]); await wait(0.45); }
    await say('nib', '…');
    await say('sorrel', 'Hold it up anyway. It doesn’t matter if it lights.');
    await say('nib', 'It matters a little.');
    look(this.hx, fy - 60, 1.3); await wait(0.8);
    for (let i = 0; i < 5; i++) { this.heart = 0.35 + (i % 2) * 0.5; Sfx.noise(0.1, 0.07, 700, 2); await wait(0.22); }
    this.heart = 0; flag('dark1', 1); Sfx.snuff(); Sfx.thunder(); G.cam.shake = 14; Sfx.setMood(MOODS.dark);
    W.hidden = false; W.x = this.hx + 30; await wait(0.7);
    look(46 * T, fy - 50, 1.05);
    for (let t = 0; t < 2.4; t += 0.016) { W.x += 250 * 0.016; if (W.x > 61 * T) { W.y -= 260 * 0.016; W.x = 61 * T + 16; } await wait(0.016); }
    W.hidden = true;
    look(this.hx - 20, fy - 46, 1.2);
    for (const i of [0, 2, 4, 5]) { npc(i).asleep = true; npc(i).lantern = 0; Sfx.tone(300 - i * 20, 0.5, 0.04, 'sine', 0, -120); await wait(0.5); }
    await say('sorrel', 'The Heartflame. Someone’s taken it up the Well. I can feel it going out of me.');
    await say('nib', 'Sorrel? Everyone’s gone grey. Why am I still awake?');
    await say('sorrel', 'Oh, love. Because you’ve no light for it to take.');
    await say('sorrel', 'Here. My lantern. It’s the last one lit. Go after it, Nib. You’re the only one who can.');
    S.asleep = true; p.hasLantern = true; flag('lantern', 1); Sfx.hood(true); await wait(1.1);
    await say('nib', 'Fine. The one Lumen who can’t glow, off to rescue the light. Nobody laugh.');
    Save.write(); toast('Move with ← → or A D · Jump with Space · E to interact', 7);
  },
  triggers: { 1() { if (!flag('toldLamp')) toast('Wayside lamps keep your place. Stand by one and press E to light it.', 6); } },
  onChalk() { cutscene(async () => { await say('nib', 'The little ones draw morning as a great lantern in the sky. Nobody here has ever seen one.'); }); },
  lights() { const o = [], h = this.heart; if (h > 0) { o.push({ x: this.hx, y: this.fy - 80, r: 520, col: [255, 214, 140], k: h * 0.92, key: 'heart' }); for (let i = 0; i < 20; i++) o.push({ x: (4 + i * 2.1) * T, y: 7.2 * T, r: 70 - i * 2, col: [255, 200, 120], k: (1 - i * 0.04) * h, shadow: false }); }
    const K = npc(0); if (K && K.lantern) o.push({ x: K.x + 10, y: K.y - 26, r: 70, col: [255, 190, 130], k: 0.8, shadow: false }); return o; },
  rays() { return [{ x: 61.5 * T, y: 1 * T, w: 30, dx: -30, h: 420, col: [150, 170, 255], a: 0.10 }]; },
  draw(layer) {
    if (layer === 'back') { // festival lanterns on a string: each family's is dimmer than the last
      ctx.strokeStyle = 'rgba(120,100,150,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 20; i++) { const x = (4 + i * 2.1) * T, y = 6.4 * T + Math.sin(i * 1.3) * 6; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      for (let i = 0; i < 20; i++) { const x = (4 + i * 2.1) * T, y = 6.4 * T + Math.sin(i * 1.3) * 6 + Math.sin(G.t * 1.5 + i) * 1.5, k = (1 - i * 0.042) * this.heart; ctx.fillStyle = '#3d342e'; ctx.fillRect(x - 5, y, 10, 3); ctx.fillStyle = `rgba(${lerp(70, 255, k) | 0},${lerp(60, 205, k) | 0},${lerp(60, 120, k) | 0},1)`; ctx.fillRect(x - 4, y + 3, 8, 11); }
      bigLamp(this.hx, this.fy, this.heart, false);
    }
    if (layer === 'mid') { const K = npc(0); if (K) { ctx.fillStyle = K.lantern ? '#ffd0a0' : '#5a4630'; ctx.fillRect(K.x + 7, K.y - 30, 7, 9); } }
  },
},
// =========================================================================================== II · The Root Cellar
{ roman: 'II', title: 'The Root Cellar', epi: 'Things up here hunt the light. She has none to hunt.', theme: 'roots', mood: 'roots', exitLabel: 'Climb on',
  map: carveMap(150, 26, [['carve', 1, 6, 148, 11], ['fill', 12, 6, 24, 4], ['fill', 126, 6, 1, 8], ['fill', 52, 6, 5, 4], ['carve', 46, 17, 16, 4], ['rect', '^', 46, 20, 16, 1],
    ['fill', 84, 12, 10, 1], ['rect', 'H', 83, 11, 1, 6], ['carve', 139, 1, 3, 5], ['rect', 'H', 140, 2, 1, 15],
    ['put', 'P', 4, 16], ['put', 'L', 8, 16], ['put', '1', 12, 16], ['put', 'S', 18, 10], ['put', 'c', 24, 16], ['put', 'S', 27, 10], ['put', 'N', 40, 16], ['put', 'L', 43, 16],
    ['put', 'g', 47, 16], ['put', 'g', 48, 16], ['put', 'g', 51, 16], ['put', 'g', 52, 16], ['put', 'g', 55, 16], ['put', 'g', 56, 16], ['put', 'g', 59, 16], ['put', 'g', 60, 16], ['put', 'S', 54, 10],
    ['put', 'L', 64, 16], ['put', 'q', 67, 16], ['put', 'S', 89, 6], ['put', 'q', 91, 11], ['put', '2', 98, 16], ['put', 'c', 103, 16], ['put', 'N', 108, 16],
    ['put', 'b', 112, 16], ['put', 'b', 116, 16], ['put', 'b', 120, 16], ['put', 'N', 122, 16], ['put', 'D', 126, 16], ['put', 'L', 130, 16], ['put', 'X', 140, 2]]),
  order: [1, 0, 2], prog: 0,
  pages: [
    ['Keeper’s journal · a torn page', 'The cellar keeps them cool in summer. They cluster in the roots like a second sky. I come down at dusk and sing, and they follow me up the stair. I have stopped feeling foolish about it.\n— M.'],
    ['A brass cylinder', 'Pinned all over, like the inside of a music box. Scratched on the rim:\n“Dusk song. For the flies. — M.”\nYou know this tune. Everyone in Hollowmere knows this tune.', async () => { flag('cylinder', 1); await say('nib', 'That’s our lullaby. What’s it doing on a human thing?'); }],
  ],
  chalk: [{ t: 'order', seq: [1, 0, 2] }, { t: 'tally', rows: 4, s: 'each row fainter' }],
  npcs: [
    { who: 'fiddle', face: -1, async talk(e) {
        if (!flag('metFiddle')) { flag('metFiddle', 1);
          await say('fiddle', 'There you are. Loud feet, quiet lantern. Good. You learn.');
          await say('nib', 'You’re a cricket.'); await say('fiddle', 'And you’re a Lumen with no light. I can hear the gap where the hum should be.');
          await say('nib', 'Everyone can, apparently.'); await say('fiddle', 'Up here, that’s the only sensible kind to be. The Snuffs can’t find you. Hood that lantern and you’re nobody at all.');
          await say('fiddle', 'Something bright went through an hour ago. Wheezing. Smelled of lamp oil and regret.');
          await say('fiddle', 'The first ones through here left chalk for their children. It only shows in lantern light. Mind what’s sleeping above it.');
        } else await say('fiddle', 'Light to see. Dark to live. Glowcaps open for a lit lantern and stay open a few breaths after.');
      } },
    { who: 'fiddle', face: -1, async talk(e) {
        if (flag('fiddleAsked')) { await say('fiddle', flag('fiddleAlly') ? 'Tall, small, middle. Sing it right and the roots let go.' : 'The door wants ringing in the old order. Read the chalk, back under the roost.'); return; }
        await say('fiddle', 'You took your time. The Root Door only opens to the old song, rung on those three bulbs.');
        await say('fiddle', 'I’d sing it for you, but mine’s got a hole in the middle. Forty winters I’ve been one phrase short.');
        if (flag('cylinder')) {
          const c = await Dialog.choose('nib', 'The keeper’s cylinder has the whole tune on it. It’s also the only proof I’ve got for home.', ['Give Fiddle the cylinder', 'Keep it as proof']);
          flag('fiddleAsked', 1);
          if (c === 0) { flag('fiddleAlly', 1); await say('nib', 'Here. I think this is the rest of your song.'); e.play = true; playLullaby(); await wait(3.6); e.play = false;
            await say('fiddle', '…There’s the middle. Oh, there it is.'); await say('fiddle', 'If you ever need a loud friend, little dark one, I’ll hear you. I hear everything.'); }
          else { await say('nib', 'Sorry. They won’t believe me without it.'); await say('fiddle', 'Suit yourself. Proof’s heavy to carry, though.'); }
        } else await say('fiddle', 'Something on the high shelf back there rattles like the missing bit. I can’t climb any more.');
      } },
    { who: 'wick', old: true, glow: 0.4, hidden: true, jar: 0.9, face: 1 },
  ],
  setup(L) { if (flag('rootDoor')) after(0.1, () => Things.door(0, true)); },
  triggers: {
    1() { cutscene(async () => { await say('fiddle', 'Stop. You’re loud for something so dark.'); await say('nib', 'Who’s there?'); await say('fiddle', 'Shut that lantern. The Snuffs have ears in their eyes.'); toast('Q or Shift: hood your lantern. Hooded, you’re hard to see, and so is everything else.', 7); }); },
    2() { cutscene(async () => { const W = npc(2); W.hidden = false; W.x = 110 * T; look(112 * T, 17 * T - 46, 1.3); await wait(0.6);
        for (let t = 0; t < 2.2; t += 0.016) { W.x += 120 * 0.016; await wait(0.016); } W.hidden = true;
        await say('nib', 'That jar. That limp.'); await say('nib', 'That’s Wick.'); await say('nib', 'He woke everyone once. Why would he put us all back to sleep?'); }); },
  },
  onChalk(e) { if (e.idx === 0) cutscene(async () => { await say('nib', 'Three shapes. Tall, then small, then middle. And dots, counting one, two, three.'); });
    else cutscene(async () => { await say('nib', 'Tally marks. Families. Every row scratched a little fainter than the one before.'); }); },
  onBulb(e) {
    if (flag('rootDoor')) return;
    if (e.idx === this.order[this.prog]) { e.on = 1; Sfx.bulb(e.idx); this.prog++; if (this.prog === 3) { flag('rootDoor', 1); after(0.9, () => { Things.door(0, true); toast('The roots let go of the door.'); }); } }
    else { this.prog = 0; G.ents.forEach(b => { if (b.type === 'bulb') b.on = 0; }); Sfx.sour(); toast('Wrong order. The bulbs go quiet.'); }
  },
},
// =========================================================================================== III · The Drowned Works
{ roman: 'III', title: 'The Drowned Works', epi: 'Somebody very large built this. Somebody very small was kept in it.', theme: 'works', mood: 'works', exitLabel: 'Take the lift',
  map: carveMap(160, 26, [['carve', 1, 5, 158, 12], ['carve', 14, 17, 21, 3], ['rect', 'w', 14, 17, 21, 3],
    ['rect', '=', 16, 16, 2, 1], ['rect', '=', 20, 16, 2, 1], ['rect', '=', 24, 16, 2, 1], ['rect', '=', 28, 16, 2, 1], ['rect', '=', 32, 16, 2, 1],
    ['rect', '=', 48, 13, 11, 1], ['rect', 'H', 47, 12, 1, 5],
    ['carve', 104, 17, 21, 3], ['fill', 119, 19, 6, 1], ['fill', 121, 18, 4, 1], ['rect', 'w', 104, 17, 15, 3], ['rect', 'w', 119, 17, 2, 2], ['rect', 'w', 121, 17, 4, 1],
    ['rect', '=', 130, 13, 7, 1], ['rect', '=', 139, 13, 8, 1], ['rect', 'H', 129, 12, 1, 5], ['rect', 'H', 147, 12, 1, 5],
    ['put', 'P', 4, 16], ['put', 'L', 7, 16], ['put', '1', 11, 16], ['put', 'U', 12, 16], ['put', 'M', 24, 18], ['put', 'q', 38, 16], ['put', 'L', 41, 16],
    ['put', 'U', 45, 16], ['put', 'c', 52, 16], ['put', 'W', 62, 16], ['put', 'c', 67, 16], ['put', 'L', 81, 16], ['put', 'N', 85, 16],
    ['put', 'v', 94, 16], ['put', 'v', 97, 16], ['put', 'v', 100, 16], ['put', 'M', 110, 18], ['put', 'q', 111, 19], ['put', 'W', 138, 16], ['put', 'L', 152, 16], ['put', 'X', 156, 16]]),
  code: [1, 0, 2], wardens: [{ a: 49, b: 76 }, { a: 128, b: 148 }],
  pages: [
    ['Keeper’s journal · the jar racks', 'Hatching room, third week. Two hundred new flies, each no bigger than a lentil, each with its own small lamp. I keep them in the jars until their light steadies, then carry them up to the lens to join the others.\nThe wardens think I fuss. The wardens are made of clockwork.\n— M.'],
    ['Keeper’s journal · the desk under the water', 'They do not make light. I was wrong about that for years. They hold it. Every dawn they crowd the east glass and drink the sun, and every night they give it back to the ships.\nA fly kept from the morning goes dim in a season. So I never keep them from the morning.\n— M.', async () => { await say('nib', 'They hold it. They don’t make it.'); await say('nib', '…We’ve been underground for a very long time.'); }],
  ],
  chalk: [{ t: 'text', s: 'KEEP THE LAMPS LIT|— M.' }, { t: 'valves', seq: [1, 0, 2] }],
  npcs: [
    { who: 'brine', face: -1, async talk(e) {
        if (!flag('metBrine')) { flag('metBrine', 1);
          await say('brine', 'Night nine thousand and four. Lamp: unlit. Keeper: expected.');
          await say('nib', 'You’re one of those things. You’re not chasing me.');
          await say('brine', 'This unit’s wheel is seized. Chasing: unavailable. Also, you are not a lamp.');
          await say('nib', 'No. I’ve noticed.');
          await say('brine', 'Query. Are you one of the keeper’s flies? You are unlit. Flies are lit.');
          await say('nib', 'What do you mean, the keeper’s flies?');
          await say('brine', 'The Great Lamp of Greywater burned no oil. The keeper raised lumen-flies in the lens. Four thousand, two hundred and six. They were the lamp.');
          await say('nib', 'We were… a lamp. We were somebody’s lamp.');
          await say('brine', 'Then the Long Night. Lens: shattered. Flies: fled down the well. Keeper: went after them. Keeper: expected back.');
          await say('brine', 'The drain valves follow the keeper’s marks. She chalked them where she stood, past the patrol. Dry the basin and the lift will run.');
        } else await say('brine', G.water[1].drained ? 'Basin: dry. Lift: ready. This unit will ride up with you.' : 'Three valves. The keeper’s marks are on the wall the patrol walks past. A lit lamp will keep a warden busy.');
      } },
  ],
  triggers: { 1() { cutscene(async () => { await say('nib', 'Something’s moving under the water. It turns when my lantern turns.'); toast('Big lamps draw things that love light. Light one, and they go to it instead of you.', 7); }); } },
  onChalk(e) { if (e.idx === 1) cutscene(async () => { await say('nib', 'Triangle, circle, square. The keeper’s valve settings.'); }); },
  onValve() {
    const v = G.ents.filter(e => e.type === 'valve'); if (G.water[1].drained) return;
    if (v.every((e, i) => e.pos === this.code[i])) { G.water[1].drained = true; flag('drained', 1); Sfx.open(); G.cam.shake = 8; toast('Deep in the works, something groans. The basin is draining.'); }
  },
  setup(L) { if (flag('drained')) { G.water[1].drained = true; G.water[1].drain = 1; } },
  tick(dt) { const w = G.water[1]; if (w.drained && w.drain < 1) { w.drain = Math.min(1, w.drain + dt * 0.22); if (Math.random() < dt * 20) Fx.add({ x: w.x + Math.random() * w.w, y: w.surf(), vy: -30, life: 0.6, size: 1.5, col: [170, 220, 235] }); } },
  rays() { return [{ x: 60 * T, y: 5 * T, w: 40, dx: 60, h: 360, col: [140, 180, 220], a: 0.05 }, { x: 112 * T, y: 5 * T, w: 50, dx: -50, h: 420, col: [140, 180, 220], a: 0.06 }]; },
  draw(layer) { if (layer === 'back') { ctx.fillStyle = 'rgba(160,200,210,0.10)'; ctx.strokeStyle = 'rgba(160,200,210,0.3)'; ctx.lineWidth = 1; for (let i = 0; i < 9; i++) { const x = (36 + i * 0.9) * T, y = 14.6 * T; ctx.beginPath(); ctx.roundRect(x, y, 16, 22, 4); ctx.fill(); ctx.stroke(); } ctx.fillStyle = '#3a3a40'; ctx.fillRect(35.6 * T, 15.3 * T + 10, 9 * T, 4); } },
},
// =========================================================================================== IV · The Lighthouse Stair
{ roman: 'IV', title: 'The Lighthouse Stair', epi: 'He wasn’t stealing it. He was running.', theme: 'tower', mood: 'tower', exitLabel: 'Climb to the lamp',
  map: carveMap(120, 28, [['carve', 1, 7, 118, 12], ['fill', 60, 17, 59, 2], ['fill', 59, 18, 1, 1], ['fill', 30, 7, 1, 9], ['fill', 92, 7, 1, 7], ['rect', '=', 39, 14, 4, 1], ['rect', 'H', 39, 13, 1, 6],
    ['rect', '=', 70, 11, 17, 1], ['rect', 'H', 69, 10, 1, 7],
    ['put', 'P', 4, 18], ['put', 'L', 7, 18], ['put', 'N', 11, 18], ['put', 'e', 14, 17], ['put', 'm', 24, 17], ['put', 'r', 24, 8], ['put', 'D', 30, 18], ['put', 'q', 33, 18], ['put', 'c', 35, 18],
    ['put', 'U', 37, 18], ['put', 'W', 50, 18], ['put', 'L', 63, 16], ['put', 'e', 66, 15], ['put', 'm', 72, 15], ['put', 'm', 72, 9], ['put', 'm', 84, 9], ['put', 'r', 84, 13],
    ['put', 'D', 92, 16], ['put', 'L', 96, 16], ['put', 'c', 98, 16], ['put', 'N', 102, 16], ['put', 'N', 105, 16], ['put', 'X', 114, 16]]),
  emitters: [[1, 0], [1, 0]], mirrorStart: [1, 1, 1, 0], wardens: [{ a: 44, b: 58 }],
  pages: [['Keeper’s journal · the last page', 'It came out of the dusk tonight, wide as the gallery. Not angry. Hungry. It has been circling for a week, drinking what spills from the lens.\nThe glass is cracking. The flies are frightened. If the lamp goes, I will open the well and send them down into the rock, where it is dark and nothing will look for them.\nI will come for you when it is morning. I promise.\n— M.']],
  chalk: [{ t: 'tower', s: 'our light' }, { t: 'tally', rows: 5, s: '9,004 nights' }],
  npcs: [
    { who: 'brine', face: 1, async talk() { await say('brine', 'Keeper’s light-locks. A beam must reach the eye above the door. Mirrors turn. This unit supplies the beam.'); await say('nib', 'And if a warden sees me?'); await say('brine', 'Wardens tend lamps. Light the big one. They will go to it. They always go to it.'); } },
    { who: 'wick', old: true, glow: 0.3, face: -1, jar: 0.7, s: 1.05, async talk(e) { await LEVELS[4].wickScene(e); } },
    { who: 'brine', face: -1, hidden: true },
  ],
  setup(L) { G.ents.forEach(e => { if (e.type === 'emitter') e.on = true; }); if (flag('lock1')) after(0.1, () => Things.door(0, true)); if (flag('lock2')) after(0.1, () => Things.door(1, true)); },
  onReceptor(r) { flag('lock' + (r.idx + 1), 1); after(0.5, () => { Things.door(r.idx, true); toast(r.idx ? 'The second lock opens. Someone is breathing on the other side.' : 'The light-lock opens.'); }); },
  onChalk(e) { if (e.idx === 0) cutscene(async () => { await say('nib', 'A lighthouse, full of little dots. “Our light.” A child drew this. A human child.'); });
    else cutscene(async () => { await say('nib', 'Nine thousand and four scratches. Brine has been counting every night since.'); }); },
  canExit() { return !!flag('wickTold'); },
  async wickScene(e) {
    if (flag('wickTold')) { await say('wick', 'Go on up. I’ll be right behind you. Brine has promised not to drop me.'); return; }
    const B = npc(2);
    look(e.x - 30, e.y - 40, 1.4);
    await say('nib', 'Wick.'); await say('wick', 'Nib. Of course it’s you. You’re the only one who could have stayed awake.');
    await say('nib', 'You took the Heartflame. Everyone’s grey. Sorrel’s grey. You stole it!');
    await say('wick', 'I wasn’t stealing it, little one. I was running. There isn’t any more where this came from.');
    await say('wick', 'When I woke them, we shared one light between all of us. Shared, Nib. Not made. Nobody down there has ever made light.');
    await say('wick', 'Every hatchling since has been a little dimmer than the last. I’ve watched it for sixty years and said nothing.');
    await say('nib', 'Then why was I born with none?'); await wait(0.6);
    await say('wick', 'Because we’d spent it.'); await say('wick', 'You’re not broken, Nib. You’re just last.');
    await wait(0.8); await say('nib', '…All my life they were so gentle with me. I thought it was pity.'); await say('wick', 'It was guilt. Mine, mostly.');
    await say('wick', 'The lullaby says the morning is on its way. I thought, if morning is a place, I’ll carry the flame there and ask for more. Silly old fly.');
    await say('nib', 'It’s not silly. The keeper wrote it down. We don’t make light. We hold it. It comes from the sun.');
    await say('wick', 'Then it’s up there. And I can’t climb another step.');
    B.hidden = false; B.x = e.x + 150; for (let t = 0; t < 1.4; t += 0.016) { B.x -= 40 * 0.016; await wait(0.016); }
    await say('brine', 'Carrying: available. One fly, elderly. One flame, small.');
    await say('brine', 'Query, repeated. When is the keeper coming back?');
    const c = await Dialog.choose('nib', 'Maren promised to come back in the morning. That was nine thousand nights ago.', ['Tell Brine the truth', 'Let it keep waiting']);
    if (c === 0) { flag('brineTruth', 1); await say('nib', 'She isn’t, Brine. She’s been gone longer than anyone alive. I’m sorry.'); await wait(0.7); await say('brine', '…Logged.'); await say('brine', 'Then this unit has one duty left. See the lamp lit. After that: no entries.'); }
    else { await say('nib', 'In the morning, Brine. She said in the morning.'); await say('brine', 'Logged. Morning: expected. This unit will be ready.'); }
    await say('wick', 'Something’s up there, Nib. It comes for any flame. It will see me. It will see Brine’s eye.');
    await say('wick', 'It won’t see you.');
    await say('nib', 'The one Lumen who can’t glow.'); await say('wick', 'The one Lumen it can’t find.');
    flag('wickTold', 1); Save.write(); toast('The way up is open.');
  },
  rays() { return [{ x: 20 * T, y: 7 * T, w: 26, dx: 70, h: 330, col: [150, 170, 230], a: 0.07 }, { x: 78 * T, y: 7 * T, w: 26, dx: -60, h: 300, col: [150, 170, 230], a: 0.07 }, { x: 108 * T, y: 7 * T, w: 30, dx: 40, h: 300, col: [150, 170, 230], a: 0.08 }]; },
},
// =========================================================================================== V · The Lamp Room
{ roman: 'V', title: 'The Lamp Room', epi: 'The morning’s on its way.', theme: 'lamp', mood: 'tower', fog: 0.4,
  map: carveMap(60, 24, [
    ['carve', 1, 0, 58, 16],                                             // the room itself
    ['rect', '=', 27, 11, 7, 1], ['rect', 'H', 26, 10, 1, 6],            // a platform, and the ladder up to it
    ['put', 'P', 4, 15], ['put', 'L', 7, 15], ['put', '1', 9, 15],       // Nib, a wayside lamp, a story trigger
    ['put', 'N', 10, 15], ['put', 'N', 13, 15], ['put', 'N', 50, 15],    // Brine, Wick, Fiddle
    ['put', 'B', 18, 15], ['put', 'B', 46, 15],                          // two braziers
    ['put', 'k', 22, 15], ['put', 'k', 30, 10], ['put', 'k', 40, 15],    // three sun-mirror cranks
    ['put', 'O', 30, 6],                                                 // Umbra
  ]),
  flame: 100, cranksLive: false, lens: { x: 30 * T + 16, y: 16 * T }, flamePos: { x: 13 * T + 16, y: 16 * T }, dawn: 0, lightning: 0,
  npcs: [
    { who: 'brine', face: 1 }, { who: 'wick', old: true, glow: 0.3, face: 1, jar: 0.7 }, { who: 'fiddle', face: -1, hidden: true },
  ],
  setup(L) { this.flame = 100; this.cranksLive = false; this.dawn = 0; G.sky = 0; },
  ambient() { return lerp(0.7, 0.0, ease(this.dawn)); },
  tick(dt) {
    this.lightning = Math.max(0, this.lightning - dt * 2.5);
    if (this.dawn < 0.2 && Math.random() < dt * 0.12) { this.lightning = 1; Sfx.thunder(); }
    const W = npc(1); if (W) W.jar = 0.15 + 0.6 * this.flame / 100;
    if (this.cranksLive) this.flame = Math.min(100, this.flame + dt * 1.5);
    Hud.flame(this.cranksLive ? this.flame : null);
  },
  triggers: { 1() { cutscene(() => LEVELS[5].arrive()); } },
  async arrive() {
    const U = G.ents.find(e => e.type === 'umbra'), F = npc(2);
    look(20 * T, 12.6 * T, 1.0); await wait(1.0);
    await say('wick', 'There’s the lens. What’s left of it. It looks like the Heartlamp.'); await say('nib', 'The Heartlamp looks like it. We built a copy of home and forgot what it was a copy of.');
    await say('brine', 'Sun-mirrors: three. Seized since the Long Night. Turn all three east and first light will fill the lens.');
    await say('brine', 'First light in: not long.');
    look(U.x, U.y + 40, 0.9); Sfx.roar(); G.cam.shake = 10; await wait(1.4);
    await say('wick', 'There it is. The Gloam.'); await say('nib', 'It’s looking at your jar.');
    await say('wick', 'Then it will come for the jar. Light a brazier and it will go there instead, for a while. Like the wardens. Like everything.');
    await say('nib', 'And while it’s busy, the dark one turns the mirrors.'); await say('wick', 'Go on, Nib. Nobody’s laughing.');
    if (flag('fiddleAlly')) { F.hidden = false; F.play = true; playLullaby(); await say('fiddle', 'I heard a storm with a hole in it. Thought it wanted a tune.'); toast('Fiddle is playing the whole lullaby. Umbra lingers longer at the braziers.', 6); }
    Sfx.setMood(MOODS.storm); this.cranksLive = true; U.st = 'hunt';
    toast('Turn the three sun-mirrors. Keep Umbra off the Heartflame: light a brazier, or be the light yourself.', 8);
  },
  onCrank(e) { const n = G.ents.filter(c => c.type === 'crank' && c.done).length; if (n < 3) toast(['', 'One mirror faces east.', 'Two. The horizon is going grey.'][n]); else cutscene(() => this.sunrise()); },
  onFlameOut() { this.flame = 55; respawn('The Heartflame guttered. Wick shields it with his hands. Try again: keep a brazier lit.'); const U = G.ents.find(e => e.type === 'umbra'); U.st = 'hunt'; U.x = U.hx; U.y = U.hy; },
  async sunrise() {
    const U = G.ents.find(e => e.type === 'umbra'), p = G.player, W = npc(1), B = npc(0);
    this.cranksLive = false; U.st = 'calm'; Sfx.setMood(null); look(this.lens.x, 11.5 * T, 0.85); await wait(1.2);
    Sfx.swell(); for (let t = 0; t < 6; t += 0.016) { this.dawn = Math.min(1, t / 6); G.sky = this.dawn; await wait(0.016); }
    Sfx.setMood(MOODS.dawn); await wait(1.0);
    await say('nib', 'It’s not attacking.'); await say('wick', 'It’s eating. Look at it. It was never angry. It was starving, same as us.');
    look(p.x, p.y - 6, 1.6); for (let t = 0; t < 2.5; t += 0.016) { p.glow = Math.min(1, t / 2.5); await wait(0.016); } flag('glow', 1); Sfx.lamp();
    await say('nib', '…Wick. Wick, look at me.'); await say('wick', 'I’m looking, little one.');
    await say('nib', 'I’m warm. Is this what it feels like? All the time?'); await say('wick', 'All the time.');
    look(W.x, W.y - 36, 1.5); await say('wick', 'So that’s what they were singing about.'); await wait(0.6);
    for (let t = 0; t < 2; t += 0.016) { W.glow = 0.3 * (1 - t / 2); this.flame = 100 * (1 - t / 2); await wait(0.016); } W.asleep = true; W.jar = 0;
    await wait(1.0); await say('nib', 'Wick?'); await wait(0.8); await say('nib', '…Morning, Wick.');
    if (flag('brineTruth')) { await say('brine', 'Lamp: lit. Duty: complete. No further entries.'); B.off = true; Sfx.tone(220, 1.5, 0.06, 'sine', 0, -150); await wait(1.0); }
    else { await say('brine', 'Lamp: lit. Morning: confirmed. Keeper: expected. This unit will polish the glass.'); }
    look(this.lens.x, 12 * T, 1.0);
    const c = await Dialog.choose('nib', 'The Well is right there. Hollowmere is still asleep at the bottom of it.', ['Carry the morning down', 'Call them up']);
    Save.data.done = true; const id = c === 0 ? 'down' : 'up'; if (!Save.data.endings.includes(id)) Save.data.endings.push(id); Save.write();
    await Epilogue.run(id);
  },
  lights() { const o = [{ x: this.flamePos.x + 12, y: this.flamePos.y - 14, r: 60 + this.flame * 1.3, col: [255, 214, 140], k: 0.9, shadow: false }]; if (this.lightning > 0) o.push({ x: 30 * T, y: 4 * T, r: 1400, col: [200, 210, 255], k: this.lightning * 0.8, shadow: false }); if (this.dawn > 0) o.push({ x: this.lens.x, y: this.lens.y - 80, r: 300 + 900 * this.dawn, col: [255, 220, 150], k: this.dawn, shadow: false }); return o; },
  rays() { return this.dawn > 0.05 ? [{ x: 58 * T, y: 9 * T, w: 30, dx: -28 * T, h: 60, col: [255, 226, 160], a: 0.25 * this.dawn }, { x: this.lens.x, y: this.lens.y - 90, w: 40, dx: -12 * T, h: 6 * T, col: [255, 226, 160], a: 0.2 * this.dawn }] : []; },
  drawSky(c, w, h) {
    const d = ease(this.dawn), t = G.t, hz = h * 0.7;
    const g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, `rgb(${lerp(6, 70, d) | 0},${lerp(8, 110, d) | 0},${lerp(18, 190, d) | 0})`); g.addColorStop(0.7, `rgb(${lerp(16, 250, d) | 0},${lerp(20, 170, d) | 0},${lerp(36, 130, d) | 0})`); g.addColorStop(1, `rgb(${lerp(20, 255, d) | 0},${lerp(24, 214, d) | 0},${lerp(40, 150, d) | 0})`);
    c.fillStyle = g; c.fillRect(0, 0, w, hz);
    if (this.lightning > 0) { c.fillStyle = `rgba(210,220,255,${this.lightning * 0.5})`; c.fillRect(0, 0, w, h); }
    if (d > 0.02) { const sx = w * 0.82, sy = hz - d * 70; const sg = c.createRadialGradient(sx, sy, 0, sx, sy, 260); sg.addColorStop(0, `rgba(255,244,200,${d})`); sg.addColorStop(0.12, `rgba(255,220,140,${d * 0.8})`); sg.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = sg; c.fillRect(0, 0, w, hz); }
    const r = rng(11); for (let i = 0; i < 16; i++) { const x = ((r() * 1600 + t * (6 + r() * 10)) % (w + 500)) - 250, y = 20 + r() * hz * 0.7, cw = 160 + r() * 240; c.fillStyle = `rgba(${lerp(26, 255, d) | 0},${lerp(28, 190, d) | 0},${lerp(44, 170, d) | 0},${lerp(0.75, 0.35, d)})`; c.beginPath(); c.ellipse(x, y, cw, 26 + r() * 26, 0, 0, 7); c.fill(); }
    const sea = c.createLinearGradient(0, hz, 0, h); sea.addColorStop(0, `rgb(${lerp(14, 230, d) | 0},${lerp(22, 160, d) | 0},${lerp(36, 130, d) | 0})`); sea.addColorStop(1, `rgb(${lerp(6, 40, d) | 0},${lerp(10, 70, d) | 0},${lerp(20, 110, d) | 0})`); c.fillStyle = sea; c.fillRect(0, hz, w, h - hz);
    c.strokeStyle = `rgba(255,255,255,${0.06 + d * 0.2})`; c.lineWidth = 1.5; for (let i = 0; i < 26; i++) { const y = hz + 6 + i * i * 0.28, x = (r() * w + t * (10 + i)) % w; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30 + i * 3, y); c.stroke(); }
    if (d < 0.6) { c.strokeStyle = `rgba(170,190,230,${0.28 * (1 - d / 0.6)})`; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 90; i++) { const x = (r() * (w + 200) + t * 260) % (w + 200) - 100, y = (r() * h + t * 900) % h; c.moveTo(x, y); c.lineTo(x - 7, y + 22); } c.stroke(); }
  },
  draw(layer) {
    if (layer === 'back') { bigLamp(this.lens.x, this.lens.y, this.dawn, true);
      ctx.strokeStyle = '#4a4a58'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(T, 14.2 * T); ctx.lineTo(59 * T, 14.2 * T); ctx.stroke(); for (let x = 1; x < 59; x += 2) { ctx.beginPath(); ctx.moveTo(x * T, 14.2 * T); ctx.lineTo(x * T, 16 * T); ctx.stroke(); } }
  },
},
];
