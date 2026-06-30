/* ===========================================================================
   场景：主菜单 / 大海（v0.2 玩法：拖漂浮垃圾进分类箱 → 原料计分牌）
   =========================================================================== */
(function () {
  const Eng = window.Game, G = Eng.G;
  const rr = Eng.roundRect, btn = Eng.drawButton, hit = Eng.inBtn;

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* 通用按钮层（down 记录、up 触发，自定义 _extra）*/
  function btnLayer(scene) {
    scene.buttons = []; scene._act = null;
    scene.down = function (x, y) { scene._act = null; for (const b of scene.buttons) if (hit(b, x, y)) { b.pressed = true; scene._act = b; return; } if (scene._down) scene._down(x, y); };
    scene.move = function (x, y) { if (scene._act && !hit(scene._act, x, y)) scene._act.pressed = false; if (scene._move) scene._move(x, y); };
    scene.up = function (x, y) { const a = scene._act; scene.buttons.forEach(b => b.pressed = false); scene._act = null; if (a && hit(a, x, y) && a.onTap) { Audio2.sfx('click'); a.onTap(); return; } if (scene._up) scene._up(x, y); };
  }

  /* ============================ 主菜单 ============================ */
  const menu = {}; btnLayer(menu);
  menu.enter = function () { if (!G.save.seen) { Audio2.voice('welcome'); G.save.seen = true; Eng.persist(); } else Audio2.voice('menu'); };
  menu.draw = function (ctx) {
    menu.buttons = [];
    Eng.bg(ctx, '#aee9ff', '#d9f7ea');
    ctx.fillStyle = '#ffe066'; circF(ctx, G.W * 0.84, G.H * 0.16, G.H * 0.07);
    cloud(ctx, G.W * 0.2, G.H * 0.14, G.H * 0.05); cloud(ctx, G.W * 0.55, G.H * 0.1, G.H * 0.04);
    ctx.fillStyle = '#9be86b'; ctx.beginPath(); ctx.moveTo(0, G.H * 0.7); ctx.quadraticCurveTo(G.W * 0.5, G.H * 0.64, G.W, G.H * 0.7); ctx.lineTo(G.W, G.H); ctx.lineTo(0, G.H); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + Math.round(G.H * 0.085) + 'px "PingFang SC",sans-serif';
    ctx.save(); ctx.shadowColor = 'rgba(20,80,30,.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
    ctx.lineWidth = 10; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2e7d32'; ctx.strokeText('回收乐园', G.W / 2, G.H * 0.18); ctx.restore();
    const tg = ctx.createLinearGradient(0, G.H * 0.12, 0, G.H * 0.225); tg.addColorStop(0, '#ffffff'); tg.addColorStop(1, '#cdf0c4'); ctx.fillStyle = tg;
    ctx.fillText('回收乐园', G.W / 2, G.H * 0.18);
    ctx.font = 'bold ' + Math.round(G.H * 0.032) + 'px "PingFang SC",sans-serif'; ctx.fillStyle = '#3a7d3a';
    ctx.fillText('捡垃圾 · 分一分 · 变材料 · 造乐园', G.W / 2, G.H * 0.28);

    const bw = Math.min(G.W * 0.7, 460), bh = G.H * 0.13;
    const go = { x: (G.W - bw) / 2, y: G.H * 0.36, w: bw, h: bh, label: '🌊 去大海清理', color: '#2e86de', fs: Math.round(bh * 0.34), onTap: () => Eng.go('ocean', DATA.LEVELS[0]) };
    menu.buttons.push(go); btn(ctx, go);

    const cards = DATA.LEVELS, cw = Math.min(G.W * 0.92, 720), n = cards.length, gap = 8;
    const iw = (cw - gap * (n - 1)) / n, ih = iw * 1.1, sx = (G.W - cw) / 2, sy = G.H * 0.53;
    cards.forEach((lv, i) => {
      const x = sx + i * (iw + gap), un = lvUnlocked(i), done = !!G.save.cleared[lv.id];
      Eng.softShadow(ctx, x + iw / 2, sy + ih + 3, iw * 0.46, ih * 0.1, 0.2);
      const cg = ctx.createLinearGradient(0, sy, 0, sy + ih); cg.addColorStop(0, un ? '#ffffff' : 'rgba(255,255,255,.6)'); cg.addColorStop(1, un ? '#eef6ff' : 'rgba(240,244,248,.5)');
      rr(ctx, x, sy, iw, ih, 14); ctx.fillStyle = cg; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = done ? '#27ae60' : (un ? '#5aa8ec' : '#c2cad3'); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = un ? '#2d3436' : '#9aa'; ctx.font = 'bold ' + Math.round(iw * 0.3) + 'px "PingFang SC",sans-serif';
      ctx.fillText(un ? lv.icon : '🔒', x + iw / 2, sy + ih * 0.46);
      ctx.font = 'bold ' + Math.round(iw * 0.2) + 'px "PingFang SC",sans-serif';
      ctx.fillText(lv.name, x + iw / 2, sy + ih * 0.82);
      if (done) { ctx.font = 'bold ' + Math.round(iw * 0.26) + 'px sans-serif'; ctx.fillText('✅', x + iw * 0.8, sy + ih * 0.26); }
      if (un) menu.buttons.push({ x, y: sy, w: iw, h: ih, onTap: () => Eng.go('ocean', lv) });
    });
    ctx.font = 'bold ' + Math.round(G.H * 0.024) + 'px "PingFang SC",sans-serif'; ctx.fillStyle = '#3a7d3a';
    ctx.fillText('点一个地方去清理吧～', G.W / 2, sy + ih + G.H * 0.03);

    const fbw = Math.min(G.W * 0.42, 280), fbh = G.H * 0.1, fy = G.H * 0.84;
    const c = { x: G.W / 2 - fbw - 8, y: fy, w: fbw, h: fbh, label: '🔨 造东西', color: '#e67e22', fs: Math.round(fbh * 0.32), onTap: () => Eng.openCraft() };
    const p = { x: G.W / 2 + 8, y: fy, w: fbw, h: fbh, label: '🏡 我的乐园', color: '#27ae60', fs: Math.round(fbh * 0.32), onTap: () => Eng.go('park') };
    menu.buttons.push(c, p); btn(ctx, c); btn(ctx, p);
    const ss = Math.max(40, G.H * 0.07);
    const sv = { x: 12, y: 12, w: ss, h: ss, label: '💾', color: '#a29bfe', fs: Math.round(ss * 0.45), onTap: saveMenu };
    menu.buttons.push(sv); btn(ctx, sv);
    muteBtn(menu, ctx);
  };
  function saveMenu() {
    const code = Eng.exportSave();
    if (typeof prompt !== 'function') return;
    const v = prompt('【存档备份】复制下面这串字符就能保存你的进度；\n要恢复进度，就把之前保存的存档码粘贴进来，再按「确定」：', code);
    if (v != null && v.trim() && v.trim() !== code) {
      if (Eng.importSave(v)) { Audio2.sfx('star'); Eng.go('menu'); Eng.floatText(G.W / 2, G.H * 0.5, '✅ 存档已恢复!', '#27ae60'); }
      else Eng.floatText(G.W / 2, G.H * 0.5, '存档码不对哦~', '#ff7675');
    }
  }

  /* ============================ 大海 ============================ */
  const ocean = {}; btnLayer(ocean);
  const FISH_COLORS = [
    { body: ['#ff9ff3', '#e26fd0'], fin: '#f368e0' },
    { body: ['#7ee0a8', '#3bb878'], fin: '#2fa869' },
    { body: ['#ffd56b', '#f0a93a'], fin: '#e8902a' },
    { body: ['#7fc7ff', '#3d8fe0'], fin: '#2f7fd0' },
    { body: ['#ff8a8a', '#e85b5b'], fin: '#d94b4b' },
  ];
  /* 各关卡主题（ocean 走水下渲染；其余走陆地渲染）*/
  const THEMES = {
    ocean:  { water: true },
    park:   { sky: ['#bfe8ff', '#e3f8df'], ground: ['#a6e36a', '#7cc24a'], decor: ['i_tree', 'd_bush', 'i_flowers', 'i_bench', 'i_tree', 'd_bush'], critters: ['c_butterfly', 'v_bird', 'c_squirrel'], particle: 'leaf' },
    town:   { sky: ['#cfe9ff', '#eef3f8'], ground: ['#c2cdd8', '#9aa7b5'], decor: ['d_house', 'i_lamp', 'i_mailbox', 'd_building', 'd_house'], critters: ['c_dove', 'v_cat'], particle: 'dust' },
    school: { indoor: true, ground: ['#caa06a', '#a87f48'], decor: [], critters: [], particle: 'dust' },
    forest: { sky: ['#bfe6d6', '#dff3df'], ground: ['#7fbf57', '#5a9a3c'], decor: ['d_pine', 'i_tree', 'd_mushroom', 'd_pine', 'd_bush', 'd_pine'], critters: ['c_deer', 'v_bunny', 'c_butterfly'], particle: 'leaf' },
    mount:  { sky: ['#cfe6f5', '#eaf3fb'], ground: ['#b7b0a0', '#8d8474'], decor: ['d_mountain', 'd_pine', 'd_rock', 'd_pine', 'd_mountain'], critters: ['c_goat', 'c_dove'], particle: 'snow' },
    city:   { sky: ['#cfe2f2', '#e6edf3'], ground: ['#b0b8c2', '#878f99'], decor: ['d_building', 'd_building', 'i_lamp', 'd_house', 'd_building'], critters: ['c_dove'], particle: 'dust' },
  };

  ocean.enter = function (lv) {
    ocean.lv = lv || DATA.LEVELS[0];
    ocean.theme = ocean.lv.theme; ocean.cfg = THEMES[ocean.theme] || THEMES.park; ocean.water = !!ocean.cfg.water;
    if (ocean.water) Marine.init(G.W, G.H);
    setupDecor();
    spawnTrash(16);
    ocean.fish = []; ocean.jellies = []; ocean.plankton = []; ocean.critters = []; ocean.parts = [];
    if (ocean.water) {
      for (let i = 0; i < 7; i++) ocean.fish.push(newFish());
      for (let i = 0; i < 2; i++) ocean.jellies.push({ x: Math.random() * G.W, y: waterTop() + 40 + Math.random() * 120, s: G.H * (0.07 + Math.random() * 0.03), vx: (Math.random() - .5) * 8, vy: -4 - Math.random() * 4, ph: Math.random() * 6.28 });
      for (let i = 0; i < 46; i++) ocean.plankton.push({ x: Math.random() * G.W, y: Math.random() * G.H, r: 0.6 + Math.random() * 1.8, vy: -3 - Math.random() * 6, ph: Math.random() * 6.28 });
    } else if (ocean.cfg.critters.length) {
      for (let i = 0; i < 6; i++) ocean.critters.push(newCritter());
    }
    ocean.bubbles = []; ocean.ripples = []; ocean.binAnim = {}; ocean.drag = null; ocean.shakeT = 0; ocean.trailT = 0;
    ocean.tool = ocean.lv.tool || 'net'; ocean.scoopT = 0; ocean.droplets = []; ocean.combo = 0; ocean.comboT = 0;
    ocean.justCleared = false; ocean.firstClear = false; ocean.nextLv = null;
    Audio2.sfx('splash'); Audio2.voice(ocean.water ? 'ocean_intro' : 'land_intro');
  };
  ocean.resize = function () { if (ocean.water) Marine.init(G.W, G.H); setupDecor(); };
  function waterTop() { return Math.max(44, G.H * 0.072) + 10 + Math.max(40, G.H * 0.066) + 12; } // 计分牌 + 控制行
  function binH() { return G.H * 0.135; }
  function binsTop() { return G.H - binH() - 8; }
  function sandTop() { return binsTop() - G.H * 0.04; }

  function spawnTrash(count) {
    ocean.items = [];
    const pool = ocean.lv.trash, top = waterTop() + 20, bot = sandTop() - 16;
    for (let i = 0; i < count; i++) {
      const s = G.H * 0.115, it = { id: pick(pool), x: 50 + Math.random() * (G.W - 100), s, ph: Math.random() * 6.28 };
      if (ocean.water) {                                  // 水里漂浮
        it.y = top + Math.random() * (bot - top); it.vx = (Math.random() - .5) * 14; it.vy = (Math.random() - .5) * 10; it.ang = (Math.random() - .5) * 0.35; it.va = (Math.random() - .5) * 0.2;
      } else {                                            // 陆地：躺在地上
        it.rest = sandTop() - s * 0.16 - Math.random() * G.H * 0.015;
        it.y = it.rest; it.vx = (Math.random() - .5) * 6; it.vy = 0; it.ang = (Math.random() - .5) * 0.5; it.va = 0; it.spin = (Math.random() - .5) * 0.2;
      }
      ocean.items.push(it);
    }
  }
  function newFish() {
    const dir = Math.random() < .5 ? 1 : -1;
    return { x: Math.random() * G.W, y: waterTop() + 30 + Math.random() * (sandTop() - waterTop() - 60),
      vx: dir * (24 + Math.random() * 26), vy: 0, sp: G.H * (0.085 + Math.random() * 0.04), col: pick(FISH_COLORS), ph: Math.random() * 6.28, scared: 0, happy: 0 };
  }
  function newCritter() {
    const k = pick(ocean.cfg.critters), dir = Math.random() < .5 ? 1 : -1;
    const fly = (k === 'c_butterfly' || k === 'c_dove' || k === 'v_bird');
    const top = waterTop() + 30, bot = sandTop() - 8;
    return { k, x: Math.random() * G.W, fly, y: fly ? top + Math.random() * (bot - top) * 0.6 : bot - Math.random() * G.H * 0.04,
      vx: dir * (18 + Math.random() * 26), sp: G.H * (0.06 + Math.random() * 0.04), ph: Math.random() * 6.28, scared: 0, happy: 0 };
  }
  function setupDecor() {
    ocean.decor = [];
    if (ocean.water) { const decals = ['coral', 'coral2', 'seaweed', 'rock', 'starfish', 'shell'], n = 9; for (let i = 0; i < n; i++) ocean.decor.push({ k: pick(decals), x: (i + 0.5) / n * G.W + (Math.random() - .5) * 30, s: G.H * (0.09 + Math.random() * 0.05), ph: Math.random() * 6.28 }); return; }
    const list = ocean.cfg.decor, n = list.length;
    for (let i = 0; i < n; i++) { const big = /d_building|d_mountain|d_school|d_pine|i_tree/.test(list[i]); ocean.decor.push({ k: list[i], x: (i + 0.5) / n * G.W + (Math.random() - .5) * 40, s: G.H * (big ? 0.2 + Math.random() * 0.06 : 0.12 + Math.random() * 0.04), ph: Math.random() * 6.28 }); }
  }

  function binRects() {
    const n = DATA.BINS.length, pad = 8, gap = 8, w = (G.W - pad * 2 - gap * (n - 1)) / n, h = binH(), y = binsTop();
    return DATA.BINS.map((b, i) => ({ bin: b, x: pad + i * (w + gap), y, w, h }));
  }
  function lvUnlocked(idx) { return idx === 0 || !!G.save.cleared[DATA.LEVELS[idx - 1].id]; }
  function completeLevel() {
    const idx = DATA.LEVELS.findIndex(l => l.id === ocean.lv.id);
    ocean.nextLv = DATA.LEVELS[idx + 1] || null;
    ocean.firstClear = !G.save.cleared[ocean.lv.id];
    G.save.cleared[ocean.lv.id] = true;
    if (ocean.firstClear) { G.save.stars += 5; for (const k in DATA.MATERIALS) Eng.addMat(k, 1); }
    else G.save.stars += 2;
    Eng.persist(); ocean.justCleared = true;
    Eng.burst(G.W / 2, G.H * 0.4, '#ffd34d', 26); Audio2.sfx('star'); Audio2.voice('level_clear');
  }

  /* 陆地：小动物被垃圾惊扰 + 飘落粒子（叶/尘/雪）*/
  function updateLand(dt, top, bot) {
    ocean.critters.forEach(c => {
      c.ph += dt; let near = false;
      ocean.items.forEach(it => { const dx = c.x - it.x, dy = c.y - it.y; if (dx * dx + dy * dy < 9000) { near = true; c.vx += (dx > 0 ? 16 : -16) * dt; } });
      c.scared = near ? Math.min(1, c.scared + dt * 3) : Math.max(0, c.scared - dt * 2);
      const spd = (near ? 1.7 : 1) * c.sp;
      c.x += c.vx * dt * (near ? 1.4 : 1);
      if (c.vx > 0) c.vx = Math.min(c.vx, spd); else c.vx = Math.max(c.vx, -spd);
      if (Math.abs(c.vx) < spd * 0.5) c.vx += (c.vx >= 0 ? 1 : -1) * spd * dt;
      if (c.x < -70) c.x = G.W + 70; if (c.x > G.W + 70) c.x = -70;
      if (c.happy) c.happy = Math.max(0, c.happy - dt);
    });
    const kind = ocean.cfg.particle, rate = kind === 'dust' ? 4 : 2.4;
    if (Math.random() < dt * rate) ocean.parts.push({ x: Math.random() * G.W, y: top - 10, vx: (Math.random() - .5) * 20, vy: (kind === 'dust' ? 6 : 14) + Math.random() * 16, r: kind === 'dust' ? 1.5 + Math.random() * 2 : 5 + Math.random() * 5, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 3, age: 0, life: 6, kind });
    for (let i = ocean.parts.length - 1; i >= 0; i--) { const p = ocean.parts[i]; p.age += dt; p.x += p.vx * dt + Math.sin(p.age * 2) * 10 * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > bot + 12 || p.age > p.life) ocean.parts.splice(i, 1); }
  }

  function drawLandEnv(ctx, t) {
    const c = ocean.cfg, st = sandTop();
    if (c.indoor) { drawClassroomBg(ctx, st); }
    else {
      // 天空
      const sg = ctx.createLinearGradient(0, 0, 0, st); sg.addColorStop(0, c.sky[0]); sg.addColorStop(1, c.sky[1]); ctx.fillStyle = sg; ctx.fillRect(0, 0, G.W, st);
      // 太阳 + 云
      ctx.fillStyle = 'rgba(255,238,150,.9)'; ctx.beginPath(); ctx.arc(G.W * 0.84, waterTop() + G.H * 0.04, G.H * 0.045, 0, 7); ctx.fill();
      cloud(ctx, G.W * 0.2, waterTop() + G.H * 0.03, G.H * 0.028); cloud(ctx, G.W * 0.56, waterTop() + G.H * 0.06, G.H * 0.024);
      // 地面
      const gg = ctx.createLinearGradient(0, st, 0, G.H); gg.addColorStop(0, c.ground[0]); gg.addColorStop(1, c.ground[1]);
      ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(0, st); for (let x = 0; x <= G.W; x += 40) ctx.lineTo(x, st + Math.sin(x * 0.04 + 1) * 4); ctx.lineTo(G.W, G.H); ctx.lineTo(0, G.H); ctx.fill();
      // 装饰（树/楼/山，立在地面线）
      ocean.decor.forEach(d => { ctx.save(); ctx.globalAlpha = 1; const dy = st - d.s * 0.34; Sprites.draw(ctx, d.k, d.x, dy, d.s, { rot: Math.sin(t * 0.6 + d.ph) * 0.015 }); ctx.restore(); });
    }
    // 小动物
    ocean.critters.forEach(c2 => {
      const flip = c2.vx < 0 ? -1 : 1, sz = G.H * 0.085 * (c2.scared > 0.3 ? 1.06 : 1);
      ctx.save(); ctx.translate(c2.x, c2.y + (c2.fly ? Math.sin(c2.ph * 3) * 4 : 0)); ctx.scale(flip, 1); Sprites.draw(ctx, c2.k, 0, 0, sz); ctx.restore();
      if (c2.scared > 0.5) { ctx.fillStyle = '#e74c3c'; ctx.font = 'bold ' + Math.round(G.H * 0.04) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', c2.x + (flip < 0 ? 14 : -14), c2.y - G.H * 0.05); }
    });
    // 飘落粒子
    ocean.parts.forEach(p => {
      const a = Math.min(1, p.age * 2) * (1 - Math.max(0, (p.age - p.life + 1)));
      if (p.kind === 'leaf') Sprites.draw(ctx, 'c_leaf', p.x, p.y, p.r * 3, { rot: p.rot, alpha: a });
      else { ctx.save(); ctx.globalAlpha = a * (p.kind === 'snow' ? 0.9 : 0.5); ctx.fillStyle = p.kind === 'snow' ? '#fff' : '#cdbfa0'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); ctx.restore(); }
    });
  }

  /* 学校：室内教室 */
  function drawClassroomBg(ctx, st) {
    const wt = waterTop();
    // 墙
    const wg = ctx.createLinearGradient(0, 0, 0, st); wg.addColorStop(0, '#fdf3d8'); wg.addColorStop(1, '#f1e1bb'); ctx.fillStyle = wg; ctx.fillRect(0, 0, G.W, st);
    // 木地板
    const fg = ctx.createLinearGradient(0, st, 0, G.H); fg.addColorStop(0, '#d4aa6c'); fg.addColorStop(1, '#b3884a'); ctx.fillStyle = fg; ctx.fillRect(0, st, G.W, G.H - st);
    ctx.strokeStyle = 'rgba(120,80,40,.22)'; ctx.lineWidth = 2; for (let i = 1; i < 6; i++) { const y = st + i / 6 * (G.H - st); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(G.W, y); ctx.stroke(); }
    ctx.fillStyle = '#caa066'; ctx.fillRect(0, st - 8, G.W, 8);     // 踢脚线
    // 黑板
    const bx = G.W * 0.16, bw = G.W * 0.4, by = wt + G.H * 0.02, bh = st - by - G.H * 0.18;
    rr(ctx, bx - 9, by - 9, bw + 18, bh + 18, 8); ctx.fillStyle = '#9c6b3f'; ctx.fill();
    rr(ctx, bx, by, bw, bh, 5); ctx.fillStyle = '#2f5d4a'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + Math.round(bh * 0.3) + 'px "Comic Sans MS","PingFang SC",sans-serif';
    ctx.fillText('A B C', bx + bw * 0.1, by + bh * 0.34); ctx.fillText('1 2 3  ♥', bx + bw * 0.1, by + bh * 0.72);
    // 窗户 + 窗外阳光
    const wx = G.W * 0.68, wy = wt + G.H * 0.02, ww = G.W * 0.2, wh = st - wy - G.H * 0.22;
    rr(ctx, wx, wy, ww, wh, 6); ctx.fillStyle = '#aee3ff'; ctx.fill();
    ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.arc(wx + ww * 0.72, wy + wh * 0.32, wh * 0.16, 0, 7); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#cdb089'; rr(ctx, wx, wy, ww, wh, 6); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    // 时钟
    const cx = G.W * 0.6, cy = wt + G.H * 0.055, cr = G.H * 0.045;
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#8a96a3'; ctx.stroke();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - cr * 0.6); ctx.moveTo(cx, cy); ctx.lineTo(cx + cr * 0.5, cy + cr * 0.1); ctx.stroke();
    // 课桌
    const dy = st - G.H * 0.015;
    for (let i = 0; i < 3; i++) drawDesk(ctx, G.W * (0.2 + i * 0.3), dy, G.H * 0.12);
  }
  function drawDesk(ctx, x, y, s) {
    ctx.fillStyle = '#9aa7b5'; ctx.fillRect(x - s * 0.5, y - s * 0.3, s * 0.1, s * 0.55); ctx.fillRect(x + s * 0.4, y - s * 0.3, s * 0.1, s * 0.55);
    ctx.fillStyle = '#e6b97a'; rr(ctx, x - s * 0.62, y - s * 0.5, s * 1.24, s * 0.24, 5); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#a87a40'; ctx.stroke();
  }

  ocean._down = function (x, y) {
    if (y < waterTop() || y > sandTop()) return;        // 只在水里挥网
    ocean.scoopT = 0.3; Audio2.sfx('splash');           // 挥网动画 + swoosh
    const R = G.H * 0.085;                               // 网口捕捉半径(略宽松；但垃圾在漂=要瞄准=技巧)
    let best = null, bd = 1e9, bi = -1;
    for (let i = 0; i < ocean.items.length; i++) { const it = ocean.items[i]; const d = Math.hypot(x - it.x, y - it.y); if (d < R && d < bd) { bd = d; best = it; bi = i; } }
    if (best) {
      ocean.drag = { it: best, dx: x - best.x, dy: y - best.y };
      ocean.items.splice(bi, 1); ocean.items.push(best);
      Audio2.sfx('collect');
      ocean.combo++; ocean.comboT = 1.3;
      if (ocean.water) { for (let k = 0; k < 6; k++) ocean.droplets.push({ x: best.x + (Math.random() - .5) * best.s, y: best.y, vx: (Math.random() - .5) * 70, vy: -30 - Math.random() * 50, age: 0 }); }
      else Eng.burst(best.x, best.y, '#e7d3a0', 7);
      if (ocean.combo >= 3) Eng.floatText(x, y - best.s * 0.6, (ocean.water ? '连捞 ×' : '连捡 ×') + ocean.combo + '! 好准!', '#ffe066');
    } else { ocean.combo = 0; }                          // 挥空，断连击（技巧）
  };
  ocean._move = function (x, y) { if (ocean.drag) { ocean.drag.it.x = x - ocean.drag.dx; ocean.drag.it.y = y - ocean.drag.dy; ocean.drag.it.va = 0; ocean.drag.it.ang *= 0.8; } };
  ocean._up = function (x, y) {
    const d = ocean.drag; ocean.drag = null; if (!d) return;
    const r = binRects().find(r => x >= r.x && x <= r.x + r.w && y >= r.y - 24);
    if (!r) { d.it.vx = (Math.random() - .5) * 20; d.it.vy = ocean.water ? -10 : -120; return; }   // 没投进：水里继续漂 / 陆地抛回落地
    const t = DATA.TRASH[d.it.id];
    if (t.bin === r.bin.id) {
      Audio2.sfx('good'); G.save.stars++;
      Eng.burst(r.x + r.w / 2, r.y, r.bin.color, 14);
      ocean.binAnim[r.bin.id] = 0.5;                                  // 开盖吞垃圾
      ocean.ripples.push({ x: r.x + r.w / 2, y: r.y, age: 0, max: 0.6, col: r.bin.color });
      ocean.items = ocean.items.filter(o => o !== d.it);
      if (t.yield) { Eng.addMat(t.yield, 1); Eng.floatText(r.x + r.w / 2, r.y - 12, '+1 ' + DATA.MATERIALS[t.yield].name, DATA.MATERIALS[t.yield].color); Audio2.voice('got_mat'); }
      else { Eng.floatText(r.x + r.w / 2, r.y - 12, '处理好啦!', '#fff'); Audio2.voice('right'); }
      // 附近的小生灵开心地经过
      (ocean.water ? ocean.fish : ocean.critters).forEach(c => { if (Math.abs(c.x - (r.x + r.w / 2)) < 200) c.happy = 1; });
      Eng.persist();
      if (ocean.items.length === 0 && !ocean.justCleared) completeLevel();   // 全清理完=通关
    } else {
      Audio2.sfx('bad'); ocean.shakeT = 0.45; d.it.vy = -30; d.it.vx = (Math.random() - .5) * 30;
      Eng.floatText(x, y - 20, '不是这个桶哦~', '#ff7675'); Audio2.voice('wrong');
    }
  };

  ocean.update = function (dt) {
    if (ocean.shakeT > 0) ocean.shakeT -= dt;
    const top = waterTop() + 10, bot = sandTop() - 6;
    // 垃圾：水里漂浮 / 陆地躺地上（重力）
    ocean.items.forEach(it => {
      if (ocean.drag && ocean.drag.it === it) return;
      it.ph += dt;
      if (ocean.water) {
        it.x += it.vx * dt; it.y += it.vy * dt + Math.sin(it.ph) * 4 * dt; it.ang += it.va * dt;
        it.vx *= 0.99; it.vy *= 0.99;
        if (it.x < 40) { it.x = 40; it.vx = Math.abs(it.vx); } if (it.x > G.W - 40) { it.x = G.W - 40; it.vx = -Math.abs(it.vx); }
        if (it.y < top) { it.y = top; it.vy = Math.abs(it.vy); } if (it.y > bot) { it.y = bot; it.vy = -Math.abs(it.vy); }
      } else {
        it.vy += 900 * dt; it.y += it.vy * dt; it.x += it.vx * dt; it.vx *= 0.96;
        if (it.y >= it.rest) { it.y = it.rest; it.vy = 0; it.vx *= 0.8; it.ang += (0 - it.ang) * Math.min(1, dt * 5); }
        else { it.ang += (it.spin || 0) * dt; }
        if (it.x < 40) { it.x = 40; it.vx = Math.abs(it.vx) * 0.4; } if (it.x > G.W - 40) { it.x = G.W - 40; it.vx = -Math.abs(it.vx) * 0.4; }
      }
    });
    if (ocean.water) {
      // 小鱼：躲避垃圾（被垃圾干扰）
      ocean.fish.forEach(f => {
        f.ph += dt; let steer = 0, near = false;
        ocean.items.forEach(it => { const dx = f.x - it.x, dy = f.y - it.y, d2 = dx * dx + dy * dy; if (d2 < 9000) { near = true; steer += dy / (Math.abs(dx) + 20) * 0.5; f.vx += (dx > 0 ? 12 : -12) * dt; } });
        f.scared = near ? Math.min(1, f.scared + dt * 3) : Math.max(0, f.scared - dt * 2);
        f.vy += (steer * 30 - f.vy) * dt * 2 + Math.sin(f.ph * 2) * 6 * dt;
        const spd = (near ? 1.5 : 1) * f.sp;
        f.x += f.vx * dt * (near ? 1.6 : 1); f.y += f.vy * dt;
        if (f.vx > 0) f.vx = Math.min(f.vx, spd); else f.vx = Math.max(f.vx, -spd);
        if (Math.abs(f.vx) < spd * 0.6) f.vx += (f.vx >= 0 ? 1 : -1) * spd * dt;
        if (f.y < top) { f.y = top; f.vy = Math.abs(f.vy); } if (f.y > bot) { f.y = bot; f.vy = -Math.abs(f.vy); }
        if (f.x < -60) { f.x = G.W + 60; } if (f.x > G.W + 60) { f.x = -60; }
        if (f.happy) f.happy = Math.max(0, f.happy - dt);
      });
      const top2 = waterTop() + 10;
      ocean.jellies.forEach(j => { j.ph += dt; j.x += j.vx * dt; j.y += j.vy * dt; if (j.y < top2) j.vy = Math.abs(j.vy); if (j.y > sandTop() - 60) j.vy = -Math.abs(j.vy); if (j.x < -40) j.x = G.W + 40; if (j.x > G.W + 40) j.x = -40; });
      ocean.plankton.forEach(p => { p.y += p.vy * dt; p.x += Math.sin(p.ph += dt) * 6 * dt; if (p.y < waterTop()) { p.y = G.H; p.x = Math.random() * G.W; } });
      if (Math.random() < dt * 3) ocean.bubbles.push({ x: Math.random() * G.W, y: G.H, vy: -28 - Math.random() * 34, r: 3 + Math.random() * 6, age: 0, wob: Math.random() * 6.28 });
      if (ocean.drag && (ocean.trailT -= dt) <= 0) { ocean.trailT = 0.09; ocean.bubbles.push({ x: ocean.drag.it.x + (Math.random() - .5) * 20, y: ocean.drag.it.y, vy: -40 - Math.random() * 30, r: 2 + Math.random() * 4, age: 0, wob: Math.random() * 6.28 }); }
      for (let i = ocean.bubbles.length - 1; i >= 0; i--) { const b = ocean.bubbles[i]; b.y += b.vy * dt; b.x += Math.sin((b.wob += dt * 4)) * 8 * dt; b.age += dt; if (b.age > 3) ocean.bubbles.splice(i, 1); }
    } else {
      updateLand(dt, top, bot);
    }
    // 涟漪 + 分类箱开盖动画
    for (let i = ocean.ripples.length - 1; i >= 0; i--) { ocean.ripples[i].age += dt; if (ocean.ripples[i].age > ocean.ripples[i].max) ocean.ripples.splice(i, 1); }
    for (const k in ocean.binAnim) { ocean.binAnim[k] -= dt; if (ocean.binAnim[k] <= 0) delete ocean.binAnim[k]; }
    // 工具挥动动画 / 连击 / 网中滴水
    if (ocean.scoopT > 0) ocean.scoopT -= dt;
    if (ocean.comboT > 0) { ocean.comboT -= dt; if (ocean.comboT <= 0) ocean.combo = 0; }
    if (ocean.drag && Math.random() < dt * 9) ocean.droplets.push({ x: ocean.drag.it.x + (Math.random() - .5) * ocean.drag.it.s * 0.6, y: ocean.drag.it.y + ocean.drag.it.s * 0.3, vx: (Math.random() - .5) * 10, vy: 18, age: 0 });
    for (let i = ocean.droplets.length - 1; i >= 0; i--) { const d = ocean.droplets[i]; d.age += dt; d.vy += 420 * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.age > 0.75) ocean.droplets.splice(i, 1); }
  };

  ocean.draw = function (ctx) {
    ocean.buttons = [];
    const t = G.t, sh = ocean.shakeT > 0 ? Math.sin(ocean.shakeT * 60) * 5 : 0;
    if (!ocean.water) { drawLandEnv(ctx, t); ocean.drawEnvDone = true; } else { ocean.drawEnvDone = false;
    // 水体渐变（更通透的层次）
    const wg = ctx.createLinearGradient(0, 0, 0, G.H);
    wg.addColorStop(0, '#56c2e8'); wg.addColorStop(0.35, '#2a93c8'); wg.addColorStop(0.7, '#15709f'); wg.addColorStop(1, '#083f63');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, G.W, G.H);
    // 流动光柱（叠加发光）
    Marine.rays(ctx, G.W, G.H, t);
    // 远景珊瑚剪影（视差，柔化）
    ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#0a4a72';
    for (let i = 0; i < 6; i++) { const x = (i + 0.5) / 6 * G.W + Math.sin(t * 0.15 + i) * 8; ctx.beginPath(); ctx.moveTo(x - 46, sandTop()); ctx.quadraticCurveTo(x, sandTop() - G.H * 0.18, x + 46, sandTop()); ctx.fill(); } ctx.restore();
    // 海床沙地（带光影）
    const sg = ctx.createLinearGradient(0, sandTop(), 0, G.H); sg.addColorStop(0, '#f6e7b6'); sg.addColorStop(1, '#d2b677');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(0, sandTop() + 6); for (let x = 0; x <= G.W; x += 40) ctx.lineTo(x, sandTop() + Math.sin(x * 0.05 + 1) * 5); ctx.lineTo(G.W, G.H); ctx.lineTo(0, G.H); ctx.fill();
    // 海床焦散光斑
    ctx.save(); ctx.beginPath(); ctx.rect(0, sandTop(), G.W, G.H - sandTop()); ctx.clip(); Marine.caustics(ctx, G.W, G.H, t, 0.5, 'lighter'); ctx.restore();
    // 海床装饰
    ocean.decor.forEach(d => { Sprites.draw(ctx, d.k, d.x, sandTop() + 4 - d.s * 0.32, d.s, { rot: Math.sin(t * 0.6 + d.ph) * 0.05 }); });
    // 水母（在鱼之后更靠前？这里放中景）
    ocean.jellies.forEach(j => Marine.jelly(ctx, j.x, j.y, j.s, t, j.ph));
    // 浮游粒子
    ctx.fillStyle = 'rgba(230,250,255,.4)'; ocean.plankton.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); });
    // 小鱼（程序化摆尾游动）
    ocean.fish.forEach(f => {
      const flip = f.vx < 0 ? -1 : 1, tilt = Math.max(-0.3, Math.min(0.3, f.vy * 0.012));
      ctx.save(); ctx.translate(f.x, f.y); ctx.scale(flip, 1);
      Marine.fish(ctx, 0, 0, f.sp * (f.scared > 0.3 ? 1.06 : 1), t, f.ph, { scared: f.scared > 0.4, tilt: tilt * flip, body: f.col.body, fin: f.col.fin });
      ctx.restore();
      if (f.scared > 0.5) { ctx.fillStyle = '#fff5b0'; ctx.font = 'bold ' + Math.round(f.sp * 0.55) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', f.x + (f.vx < 0 ? 16 : -16), f.y - f.sp * 0.6); }
    });
    // 气泡（带高光）
    ocean.bubbles.forEach(b => { const a = 0.35 * (1 - b.age / 3); ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fillStyle = 'rgba(220,245,255,' + a + ')'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,' + (a + 0.15) + ')'; ctx.stroke(); ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, 7); ctx.fillStyle = 'rgba(255,255,255,' + (a + 0.25) + ')'; ctx.fill(); });
    } // end water env
    // 垃圾（白色光晕托底，让图标清晰跳出 + 拖拽放大发光）
    ocean.items.forEach(it => {
      const drag = ocean.drag && ocean.drag.it === it;
      const iy = it.y + ((drag || !ocean.water) ? 0 : Math.sin(it.ph) * 4), sz = it.s * (drag ? 1.2 : 1);
      // 柔光晕
      const hg = ctx.createRadialGradient(it.x + sh, iy, 0, it.x + sh, iy, sz * 0.62);
      hg.addColorStop(0, 'rgba(255,255,255,.5)'); hg.addColorStop(0.6, 'rgba(255,255,255,.18)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(it.x + sh, iy, sz * 0.62, 0, 7); ctx.fill();
      // 接触柔影
      Eng.softShadow(ctx, it.x + sh, iy + sz * 0.42, sz * 0.32, sz * 0.13, 0.22);
      ctx.save();
      if (drag) { ctx.shadowColor = 'rgba(255,245,150,.95)'; ctx.shadowBlur = 26; }
      else { ctx.shadowColor = 'rgba(0,18,38,.34)'; ctx.shadowBlur = sz * 0.06; ctx.shadowOffsetY = sz * 0.04; }
      Sprites.draw(ctx, DATA.TRASH[it.id].sprite, it.x + sh, iy, sz, { rot: drag ? Math.sin(t * 8) * 0.06 : it.ang });
      ctx.restore();
    });
    // 工具（捞网/夹子/扫把）+ 挥动捞起动画
    const scoop = ocean.scoopT > 0 ? Math.sin((1 - ocean.scoopT / 0.3) * Math.PI) : 0;   // 0→1→0
    if (ocean.drag) {                                   // 兜住垃圾
      const it = ocean.drag.it; ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(0.18 + scoop * 0.25);
      Sprites.draw(ctx, ocean.tool, 0, it.s * 0.32, it.s * 1.55, { alpha: 0.95 }); ctx.restore();
    } else if (G.pointer.down && G.pointer.y > waterTop() && G.pointer.y < sandTop()) {  // 挥空中的网
      ctx.save(); ctx.translate(G.pointer.x, G.pointer.y); ctx.rotate(0.5 - scoop * 0.7);
      Sprites.draw(ctx, ocean.tool, 0, 0, G.H * 0.12 * (1 + scoop * 0.18), { alpha: 0.9 }); ctx.restore();
    }
    // 水滴
    ctx.fillStyle = 'rgba(205,242,255,.85)';
    ocean.droplets.forEach(d => { ctx.save(); ctx.globalAlpha = 0.85 * (1 - d.age / 0.75); ctx.beginPath(); ctx.ellipse(d.x, d.y, 2.4, 4, 0, 0, 7); ctx.fillStyle = 'rgba(205,242,255,.9)'; ctx.fill(); ctx.restore(); });
    if (ocean.water) {
      // 全屏水波焦散（统一光感，叠在场景之上）
      Marine.caustics(ctx, G.W, G.H, t, 0.16, 'overlay');
      // 景深暗角
      Marine.depthVignette(ctx, G.W, G.H);
    } else {
      // 陆地：柔和暗角 + 顶部光，增加层次
      const tl = ctx.createLinearGradient(0, waterTop(), 0, sandTop()); tl.addColorStop(0, 'rgba(255,255,255,.06)'); tl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = tl; ctx.fillRect(0, 0, G.W, sandTop());
      const v = ctx.createRadialGradient(G.W / 2, G.H * 0.42, G.H * 0.32, G.W / 2, G.H * 0.5, G.H * 0.9); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(25,18,8,.26)'); ctx.fillStyle = v; ctx.fillRect(0, 0, G.W, G.H);
    }

    // 涟漪
    ocean.ripples.forEach(rp => { const k = rp.age / rp.max; ctx.save(); ctx.globalAlpha = (1 - k) * 0.8; ctx.lineWidth = 4 * (1 - k) + 1; ctx.strokeStyle = lighten(rp.col, 40); ctx.beginPath(); ctx.ellipse(rp.x, rp.y, 10 + k * 60, (10 + k * 60) * 0.4, 0, 0, 7); ctx.stroke(); ctx.restore(); });

    // 分类箱（立体光泽 + 开口 + 名牌 + 开盖吞垃圾动画）
    binRects().forEach(r => {
      const c = r.bin.color, open = ocean.binAnim[r.bin.id] ? Math.sin((1 - ocean.binAnim[r.bin.id] / 0.5) * Math.PI) : 0;
      Eng.softShadow(ctx, r.x + r.w / 2, r.y + r.h + 5, r.w * 0.5, r.h * 0.12, 0.3);
      const grd = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); grd.addColorStop(0, lighten(c, 26)); grd.addColorStop(0.5, c); grd.addColorStop(1, lighten(c, -22));
      rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.fillStyle = grd; ctx.fill();
      ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.clip();
      rr(ctx, r.x + r.w * 0.12, r.y + r.h * 0.05, r.w * 0.76, r.h * 0.18, 10); ctx.fillStyle = lighten(c, -42); ctx.fill();   // 开口深槽
      const gl = ctx.createLinearGradient(r.x, 0, r.x + r.w * 0.45, 0); gl.addColorStop(0, 'rgba(255,255,255,.34)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(r.x, r.y, r.w * 0.45, r.h);   // 左高光
      ctx.strokeStyle = lighten(c, -14); ctx.lineWidth = 2; for (let i = 1; i < 4; i++) { const x = r.x + r.w * i / 4; ctx.beginPath(); ctx.moveTo(x, r.y + r.h * 0.3); ctx.lineTo(x, r.y + r.h * 0.92); ctx.stroke(); }   // 竖纹
      ctx.restore();
      ctx.lineWidth = 2; ctx.strokeStyle = lighten(c, -30); rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.stroke();
      // 盖子（命中翻开）
      ctx.save(); ctx.translate(r.x - 4, r.y - 6); ctx.rotate(-open * 0.7); const lg2 = ctx.createLinearGradient(0, -8, 0, 10); lg2.addColorStop(0, lighten(c, 12)); lg2.addColorStop(1, lighten(c, -26)); rr(ctx, 0, -8, r.w + 8, 18, 9); ctx.fillStyle = lg2; ctx.fill(); rr(ctx, (r.w + 8) / 2 - r.w * 0.06, -6, r.w * 0.12, 5, 3); ctx.fillStyle = lighten(c, -34); ctx.fill(); ctx.restore();
      // 分类大图标（白圆牌衬底，一眼看懂往哪扔）
      const cxm = r.x + r.w / 2, iy = r.y + r.h * 0.37, ir = r.w * 0.19;
      ctx.beginPath(); ctx.arc(cxm, iy, ir, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = Math.round(r.w * 0.25) + 'px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
      ctx.fillText(r.bin.icon || '🗑️', cxm, iy + r.w * 0.012);
      // 名牌
      const ph = r.h * 0.2, py = r.y + r.h * 0.63; rr(ctx, r.x + r.w * 0.08, py, r.w * 0.84, ph, ph * 0.42); ctx.fillStyle = lighten(c, -30); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(r.w * 0.15) + 'px "PingFang SC",sans-serif';
      ctx.fillText(r.bin.name, cxm, py + ph * 0.54);
      ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font = 'bold ' + Math.round(r.w * 0.07) + 'px "PingFang SC",sans-serif';
      ctx.fillText(r.bin.tip, cxm, r.y + r.h * 0.9);
    });

    // 计分牌
    const top = Eng.topBar(ctx);
    // 控制行：返回 / 刷新 / 建造
    const by = top + 6, bh = Math.max(40, G.H * 0.066);
    const back = { x: 10, y: by, w: bh * 1.4, h: bh, label: '◀', color: '#ff7675', fs: Math.round(bh * 0.5), onTap: () => Eng.go('menu') };
    const mute = { x: 10 + bh * 1.4 + 8, y: by, w: bh * 1.4, h: bh, label: Audio2.isMuted() ? '🔇' : '🔊', color: '#74b9ff', fs: Math.round(bh * 0.42), onTap: () => { Audio2.setMuted(!Audio2.isMuted()); mute.label = Audio2.isMuted() ? '🔇' : '🔊'; } };
    const refresh = { x: G.W - 10 - (bh * 4.6) - 8 - bh * 3.2, y: by, w: bh * 3.2, h: bh, label: ocean.water ? '🔄 刷新海域' : '🔄 刷新场地', color: '#48a0d8', fs: Math.round(bh * 0.34), onTap: () => { ocean.justCleared = false; spawnTrash(16); Audio2.sfx('splash'); Eng.floatText(G.W / 2, G.H * 0.3, ocean.water ? '又漂来好多垃圾!' : '又出现好多垃圾!', '#fff'); } };
    const build = { x: G.W - 10 - bh * 4.6, y: by, w: bh * 4.6, h: bh, label: '🔨 建造乐园', color: '#27ae60', fs: Math.round(bh * 0.34), onTap: () => Eng.openCraft() };
    ocean.buttons.push(back, mute, refresh, build); btn(ctx, back); btn(ctx, mute); btn(ctx, refresh); btn(ctx, build);

    // 通关结算面板
    if (ocean.justCleared) drawClearPanel(ctx);
  };

  function drawClearPanel(ctx) {
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, G.W, G.H); ctx.restore();
    const pw = Math.min(G.W * 0.78, 580), ph = Math.min(G.H * 0.6, 420), px = (G.W - pw) / 2, py = (G.H - ph) / 2;
    rr(ctx, px, py, pw, ph, 26); ctx.fillStyle = '#fffef7'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#ffd34d'; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#27ae60'; ctx.font = 'bold ' + Math.round(ph * 0.13) + 'px "PingFang SC",sans-serif';
    ctx.fillText('🎉 ' + ocean.lv.name + '清理干净啦!', G.W / 2, py + ph * 0.2);
    ctx.fillStyle = '#e67e22'; ctx.font = 'bold ' + Math.round(ph * 0.075) + 'px "PingFang SC",sans-serif';
    ctx.fillText(ocean.firstClear ? '⭐ +5   每种材料 +1' : '⭐ +2   又干净啦!', G.W / 2, py + ph * 0.38);
    if (ocean.firstClear && ocean.nextLv) { ctx.fillStyle = '#2e86de'; ctx.font = 'bold ' + Math.round(ph * 0.065) + 'px "PingFang SC",sans-serif'; ctx.fillText('🔓 解锁新地点：' + ocean.nextLv.name + ' ' + ocean.nextLv.icon, G.W / 2, py + ph * 0.5); }
    const bw = pw * 0.42, bh2 = ph * 0.16, gap = pw * 0.04, by2 = py + ph * 0.62;
    if (ocean.nextLv) {
      const nb = { x: G.W / 2 - bw - gap / 2, y: by2, w: bw, h: bh2, label: '➡️ 去' + ocean.nextLv.name, color: '#2e86de', fs: Math.round(bh2 * 0.34), onTap: () => Eng.go('ocean', ocean.nextLv) };
      const rb = { x: G.W / 2 + gap / 2, y: by2, w: bw, h: bh2, label: '🔄 再清理', color: '#27ae60', fs: Math.round(bh2 * 0.34), onTap: () => { ocean.justCleared = false; spawnTrash(16); } };
      ocean.buttons.push(nb, rb); btn(ctx, nb); btn(ctx, rb);
    } else {
      const rb = { x: G.W / 2 - bw / 2, y: by2, w: bw, h: bh2, label: '🔄 再清理', color: '#27ae60', fs: Math.round(bh2 * 0.34), onTap: () => { ocean.justCleared = false; spawnTrash(16); } };
      ocean.buttons.push(rb); btn(ctx, rb);
    }
    const mb = { x: G.W / 2 - bw / 2, y: by2 + bh2 + gap, w: bw, h: bh2, label: '🏠 回菜单', color: '#ff9f43', fs: Math.round(bh2 * 0.34), onTap: () => Eng.go('menu') };
    ocean.buttons.push(mb); btn(ctx, mb);
  }

  /* ---------- 小工具 ---------- */
  function muteBtn(scene, ctx, hidden) {
    const s = Math.max(38, G.H * 0.06), pad = 10;
    const m = { x: G.W - pad - s, y: hidden ? G.H - s - pad : pad, w: s, h: s, label: Audio2.isMuted() ? '🔇' : '🔊', color: '#74b9ff', fs: Math.round(s * 0.45), onTap: () => { Audio2.setMuted(!Audio2.isMuted()); m.label = Audio2.isMuted() ? '🔇' : '🔊'; } };
    if (hidden) { /* 大海里把静音放右下角，避免和顶栏冲突 */ }
    scene.buttons.push(m); btn(ctx, m);
  }
  function circF(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  function cloud(ctx, x, y, r) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.arc(x + r, y + r * 0.2, r * 0.8, 0, 7); ctx.arc(x - r, y + r * 0.2, r * 0.8, 0, 7); ctx.fill(); }
  function lighten(hex, amt) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt; r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b)); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }

  G.scenes.menu = menu; G.scenes.ocean = ocean;
})();
