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
    ctx.lineWidth = 8; ctx.strokeStyle = '#2e7d32'; ctx.fillStyle = '#fff';
    ctx.strokeText('回收乐园', G.W / 2, G.H * 0.18); ctx.fillText('回收乐园', G.W / 2, G.H * 0.18);
    ctx.font = 'bold ' + Math.round(G.H * 0.032) + 'px "PingFang SC",sans-serif'; ctx.fillStyle = '#3a7d3a';
    ctx.fillText('捡垃圾 · 分一分 · 变材料 · 造乐园', G.W / 2, G.H * 0.28);

    const bw = Math.min(G.W * 0.7, 460), bh = G.H * 0.13;
    const go = { x: (G.W - bw) / 2, y: G.H * 0.36, w: bw, h: bh, label: '🌊 去大海清理', color: '#2e86de', fs: Math.round(bh * 0.34), onTap: () => Eng.go('ocean', DATA.LEVELS[0]) };
    menu.buttons.push(go); btn(ctx, go);

    const cards = DATA.LEVELS, cw = Math.min(G.W * 0.92, 720), n = cards.length, gap = 8;
    const iw = (cw - gap * (n - 1)) / n, ih = iw * 1.1, sx = (G.W - cw) / 2, sy = G.H * 0.53;
    cards.forEach((lv, i) => {
      const x = sx + i * (iw + gap);
      rr(ctx, x, sy, iw, ih, 12); ctx.fillStyle = lv.unlocked ? '#fff' : 'rgba(255,255,255,.5)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = lv.unlocked ? '#2e86de' : '#b2bec3'; ctx.stroke();
      ctx.fillStyle = lv.unlocked ? '#2d3436' : '#9aa'; ctx.font = 'bold ' + Math.round(iw * 0.26) + 'px "PingFang SC",sans-serif';
      ctx.fillText(lv.unlocked ? '🌊' : '🔒', x + iw / 2, sy + ih * 0.4);
      ctx.font = 'bold ' + Math.round(iw * 0.2) + 'px "PingFang SC",sans-serif';
      ctx.fillText(lv.name, x + iw / 2, sy + ih * 0.78);
      if (lv.unlocked) menu.buttons.push({ x, y: sy, w: iw, h: ih, onTap: () => Eng.go('ocean', lv) });
    });
    ctx.font = 'bold ' + Math.round(G.H * 0.024) + 'px "PingFang SC",sans-serif'; ctx.fillStyle = '#7f8c8d';
    ctx.fillText('更多地方马上就来啦～', G.W / 2, sy + ih + G.H * 0.03);

    const fbw = Math.min(G.W * 0.42, 280), fbh = G.H * 0.1, fy = G.H * 0.84;
    const c = { x: G.W / 2 - fbw - 8, y: fy, w: fbw, h: fbh, label: '🔨 造东西', color: '#e67e22', fs: Math.round(fbh * 0.32), onTap: () => Eng.go('craft') };
    const p = { x: G.W / 2 + 8, y: fy, w: fbw, h: fbh, label: '🏡 我的乐园', color: '#27ae60', fs: Math.round(fbh * 0.32), onTap: () => Eng.go('park') };
    menu.buttons.push(c, p); btn(ctx, c); btn(ctx, p);
    muteBtn(menu, ctx);
  };

  /* ============================ 大海 ============================ */
  const ocean = {}; btnLayer(ocean);
  const FISH_COLORS = [
    { body: ['#ff9ff3', '#e26fd0'], fin: '#f368e0' },
    { body: ['#7ee0a8', '#3bb878'], fin: '#2fa869' },
    { body: ['#ffd56b', '#f0a93a'], fin: '#e8902a' },
    { body: ['#7fc7ff', '#3d8fe0'], fin: '#2f7fd0' },
    { body: ['#ff8a8a', '#e85b5b'], fin: '#d94b4b' },
  ];
  ocean.enter = function (lv) {
    ocean.lv = lv || DATA.LEVELS[0];
    Marine.init(G.W, G.H);
    seabed();             // 海床装饰（固定）
    spawnTrash(16);
    ocean.fish = []; for (let i = 0; i < 7; i++) ocean.fish.push(newFish());
    ocean.jellies = []; for (let i = 0; i < 2; i++) ocean.jellies.push({ x: Math.random() * G.W, y: waterTop() + 40 + Math.random() * 120, s: G.H * (0.07 + Math.random() * 0.03), vx: (Math.random() - .5) * 8, vy: -4 - Math.random() * 4, ph: Math.random() * 6.28 });
    ocean.plankton = []; for (let i = 0; i < 46; i++) ocean.plankton.push({ x: Math.random() * G.W, y: Math.random() * G.H, r: 0.6 + Math.random() * 1.8, vy: -3 - Math.random() * 6, ph: Math.random() * 6.28 });
    ocean.bubbles = []; ocean.ripples = []; ocean.binAnim = {}; ocean.drag = null; ocean.shakeT = 0; ocean.trailT = 0;
    Audio2.sfx('splash'); Audio2.voice('ocean_intro');
  };
  ocean.resize = function () { Marine.init(G.W, G.H); seabed(); };
  function waterTop() { return Math.max(44, G.H * 0.072) + 10 + Math.max(40, G.H * 0.066) + 12; } // 计分牌 + 控制行
  function binH() { return G.H * 0.135; }
  function binsTop() { return G.H - binH() - 8; }
  function sandTop() { return binsTop() - G.H * 0.04; }

  function spawnTrash(count) {
    ocean.items = [];
    const pool = ocean.lv.trash, top = waterTop() + 20, bot = sandTop() - 20;
    for (let i = 0; i < count; i++) {
      ocean.items.push({ id: pick(pool), x: 50 + Math.random() * (G.W - 100), y: top + Math.random() * (bot - top),
        vx: (Math.random() - .5) * 14, vy: (Math.random() - .5) * 10, ph: Math.random() * 6.28, s: G.H * 0.115, ang: (Math.random() - .5) * 0.35, va: (Math.random() - .5) * 0.2 });
    }
  }
  function newFish() {
    const dir = Math.random() < .5 ? 1 : -1;
    return { x: Math.random() * G.W, y: waterTop() + 30 + Math.random() * (sandTop() - waterTop() - 60),
      vx: dir * (24 + Math.random() * 26), vy: 0, sp: G.H * (0.085 + Math.random() * 0.04), col: pick(FISH_COLORS), ph: Math.random() * 6.28, scared: 0, happy: 0 };
  }
  function seabed() {
    const decals = ['coral', 'coral2', 'seaweed', 'rock', 'starfish', 'shell'];
    ocean.decor = [];
    const n = 9;
    for (let i = 0; i < n; i++) ocean.decor.push({ k: pick(decals), x: (i + 0.5) / n * G.W + (Math.random() - .5) * 30, s: G.H * (0.09 + Math.random() * 0.05), ph: Math.random() * 6.28 });
  }

  function binRects() {
    const n = DATA.BINS.length, pad = 8, gap = 8, w = (G.W - pad * 2 - gap * (n - 1)) / n, h = binH(), y = binsTop();
    return DATA.BINS.map((b, i) => ({ bin: b, x: pad + i * (w + gap), y, w, h }));
  }

  ocean._down = function (x, y) {
    for (let i = ocean.items.length - 1; i >= 0; i--) {
      const it = ocean.items[i], r = it.s * 0.55;
      if (Math.abs(x - it.x) < r && Math.abs(y - it.y) < r) { ocean.drag = { it, i, dx: x - it.x, dy: y - it.y }; ocean.items.splice(i, 1); ocean.items.push(it); Audio2.sfx('pop'); return; }
    }
  };
  ocean._move = function (x, y) { if (ocean.drag) { ocean.drag.it.x = x - ocean.drag.dx; ocean.drag.it.y = y - ocean.drag.dy; ocean.drag.it.va = 0; ocean.drag.it.ang *= 0.8; } };
  ocean._up = function (x, y) {
    const d = ocean.drag; ocean.drag = null; if (!d) return;
    const r = binRects().find(r => x >= r.x && x <= r.x + r.w && y >= r.y - 24);
    if (!r) { d.it.vx = (Math.random() - .5) * 20; d.it.vy = -10; return; }   // 没投进，松手继续漂
    const t = DATA.TRASH[d.it.id];
    if (t.bin === r.bin.id) {
      Audio2.sfx('good'); G.save.stars++;
      Eng.burst(r.x + r.w / 2, r.y, r.bin.color, 14);
      ocean.binAnim[r.bin.id] = 0.5;                                  // 开盖吞垃圾
      ocean.ripples.push({ x: r.x + r.w / 2, y: r.y, age: 0, max: 0.6, col: r.bin.color });
      ocean.items = ocean.items.filter(o => o !== d.it);
      if (t.yield) { Eng.addMat(t.yield, 1); Eng.floatText(r.x + r.w / 2, r.y - 12, '+1 ' + DATA.MATERIALS[t.yield].name, DATA.MATERIALS[t.yield].color); Audio2.voice('got_mat'); }
      else { Eng.floatText(r.x + r.w / 2, r.y - 12, '处理好啦!', '#fff'); Audio2.voice('right'); }
      // 附近小鱼开心地游过
      ocean.fish.forEach(f => { if (Math.abs(f.x - (r.x + r.w / 2)) < 200) f.happy = 1; });
      Eng.persist();
    } else {
      Audio2.sfx('bad'); ocean.shakeT = 0.45; d.it.vy = -30; d.it.vx = (Math.random() - .5) * 30;
      Eng.floatText(x, y - 20, '不是这个桶哦~', '#ff7675'); Audio2.voice('wrong');
    }
  };

  ocean.update = function (dt) {
    if (ocean.shakeT > 0) ocean.shakeT -= dt;
    const top = waterTop() + 10, bot = sandTop() - 6;
    // 垃圾漂浮
    ocean.items.forEach(it => {
      if (ocean.drag && ocean.drag.it === it) return;
      it.ph += dt; it.x += it.vx * dt; it.y += it.vy * dt + Math.sin(it.ph) * 4 * dt; it.ang += it.va * dt;
      it.vx *= 0.99; it.vy *= 0.99;
      if (it.x < 40) { it.x = 40; it.vx = Math.abs(it.vx); } if (it.x > G.W - 40) { it.x = G.W - 40; it.vx = -Math.abs(it.vx); }
      if (it.y < top) { it.y = top; it.vy = Math.abs(it.vy); } if (it.y > bot) { it.y = bot; it.vy = -Math.abs(it.vy); }
    });
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
    // 水母漂浮
    const top2 = waterTop() + 10;
    ocean.jellies.forEach(j => { j.ph += dt; j.x += j.vx * dt; j.y += j.vy * dt; if (j.y < top2) j.vy = Math.abs(j.vy); if (j.y > sandTop() - 60) j.vy = -Math.abs(j.vy); if (j.x < -40) j.x = G.W + 40; if (j.x > G.W + 40) j.x = -40; });
    // 浮游 + 气泡
    ocean.plankton.forEach(p => { p.y += p.vy * dt; p.x += Math.sin(p.ph += dt) * 6 * dt; if (p.y < waterTop()) { p.y = G.H; p.x = Math.random() * G.W; } });
    if (Math.random() < dt * 3) ocean.bubbles.push({ x: Math.random() * G.W, y: G.H, vy: -28 - Math.random() * 34, r: 3 + Math.random() * 6, age: 0, wob: Math.random() * 6.28 });
    // 拖拽时垃圾尾随气泡
    if (ocean.drag && (ocean.trailT -= dt) <= 0) { ocean.trailT = 0.09; ocean.bubbles.push({ x: ocean.drag.it.x + (Math.random() - .5) * 20, y: ocean.drag.it.y, vy: -40 - Math.random() * 30, r: 2 + Math.random() * 4, age: 0, wob: Math.random() * 6.28 }); }
    for (let i = ocean.bubbles.length - 1; i >= 0; i--) { const b = ocean.bubbles[i]; b.y += b.vy * dt; b.x += Math.sin((b.wob += dt * 4)) * 8 * dt; b.age += dt; if (b.age > 3) ocean.bubbles.splice(i, 1); }
    // 涟漪 + 分类箱开盖动画
    for (let i = ocean.ripples.length - 1; i >= 0; i--) { ocean.ripples[i].age += dt; if (ocean.ripples[i].age > ocean.ripples[i].max) ocean.ripples.splice(i, 1); }
    for (const k in ocean.binAnim) { ocean.binAnim[k] -= dt; if (ocean.binAnim[k] <= 0) delete ocean.binAnim[k]; }
  };

  ocean.draw = function (ctx) {
    ocean.buttons = [];
    const t = G.t, sh = ocean.shakeT > 0 ? Math.sin(ocean.shakeT * 60) * 5 : 0;
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
    // 垃圾（白色光晕托底，让图标在水里清晰跳出 + 拖拽放大发光）
    ocean.items.forEach(it => {
      const drag = ocean.drag && ocean.drag.it === it;
      const iy = it.y + (drag ? 0 : Math.sin(it.ph) * 4), sz = it.s * (drag ? 1.2 : 1);
      // 柔光晕
      const hg = ctx.createRadialGradient(it.x + sh, iy, 0, it.x + sh, iy, sz * 0.62);
      hg.addColorStop(0, 'rgba(255,255,255,.5)'); hg.addColorStop(0.6, 'rgba(255,255,255,.18)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(it.x + sh, iy, sz * 0.62, 0, 7); ctx.fill();
      // 落影
      ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#012238'; ctx.beginPath(); ctx.ellipse(it.x + sh, iy + sz * 0.42, sz * 0.32, sz * 0.12, 0, 0, 7); ctx.fill(); ctx.restore();
      if (drag) { ctx.save(); ctx.shadowColor = 'rgba(255,245,150,.95)'; ctx.shadowBlur = 26; }
      Sprites.draw(ctx, DATA.TRASH[it.id].sprite, it.x + sh, iy, sz, { rot: drag ? Math.sin(t * 8) * 0.06 : it.ang });
      if (drag) ctx.restore();
    });
    // 拖拽：抄网
    if (ocean.drag) Sprites.draw(ctx, 'net', ocean.drag.it.x, ocean.drag.it.y + ocean.drag.it.s * 0.5, ocean.drag.it.s * 1.25, { alpha: 0.92 });
    // 全屏水波焦散（统一光感，叠在场景之上）
    Marine.caustics(ctx, G.W, G.H, t, 0.16, 'overlay');
    // 景深暗角
    Marine.depthVignette(ctx, G.W, G.H);

    // 涟漪
    ocean.ripples.forEach(rp => { const k = rp.age / rp.max; ctx.save(); ctx.globalAlpha = (1 - k) * 0.8; ctx.lineWidth = 4 * (1 - k) + 1; ctx.strokeStyle = lighten(rp.col, 40); ctx.beginPath(); ctx.ellipse(rp.x, rp.y, 10 + k * 60, (10 + k * 60) * 0.4, 0, 0, 7); ctx.stroke(); ctx.restore(); });

    // 分类箱（带开盖吞垃圾动画）
    binRects().forEach(r => {
      const grd = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); grd.addColorStop(0, lighten(r.bin.color, 22)); grd.addColorStop(1, lighten(r.bin.color, -8));
      rr(ctx, r.x, r.y + 4, r.w, r.h, 14); ctx.fillStyle = 'rgba(0,30,50,.25)'; ctx.fill();          // 投影
      rr(ctx, r.x, r.y, r.w, r.h, 14); ctx.fillStyle = grd; ctx.fill();
      rr(ctx, r.x + r.w * 0.08, r.y + r.h * 0.12, r.w * 0.3, r.h * 0.6, 8); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fill();   // 高光
      // 盖子（命中时翻开）
      const open = ocean.binAnim[r.bin.id] ? Math.sin((1 - ocean.binAnim[r.bin.id] / 0.5) * Math.PI) : 0;
      ctx.save(); ctx.translate(r.x - 4, r.y - 6); ctx.rotate(-open * 0.7); rr(ctx, 0, -7, r.w + 8, 16, 8); ctx.fillStyle = lighten(r.bin.color, -22); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.round(r.w * 0.16) + 'px "PingFang SC",sans-serif';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.strokeText(r.bin.name, r.x + r.w / 2, r.y + r.h * 0.42); ctx.fillText(r.bin.name, r.x + r.w / 2, r.y + r.h * 0.42);
      ctx.font = 'bold ' + Math.round(r.w * 0.09) + 'px "PingFang SC",sans-serif'; ctx.globalAlpha = 0.92;
      ctx.fillText(r.bin.tip, r.x + r.w / 2, r.y + r.h * 0.72); ctx.globalAlpha = 1;
    });

    // 计分牌
    const top = Eng.topBar(ctx);
    // 控制行：返回 / 刷新 / 建造
    const by = top + 6, bh = Math.max(40, G.H * 0.066);
    const back = { x: 10, y: by, w: bh * 1.4, h: bh, label: '◀', color: '#ff7675', fs: Math.round(bh * 0.5), onTap: () => Eng.go('menu') };
    const mute = { x: 10 + bh * 1.4 + 8, y: by, w: bh * 1.4, h: bh, label: Audio2.isMuted() ? '🔇' : '🔊', color: '#74b9ff', fs: Math.round(bh * 0.42), onTap: () => { Audio2.setMuted(!Audio2.isMuted()); mute.label = Audio2.isMuted() ? '🔇' : '🔊'; } };
    const refresh = { x: G.W - 10 - (bh * 4.6) - 8 - bh * 3.2, y: by, w: bh * 3.2, h: bh, label: '🔄 刷新海域', color: '#48a0d8', fs: Math.round(bh * 0.34), onTap: () => { spawnTrash(16); Audio2.sfx('splash'); Eng.floatText(G.W / 2, G.H * 0.3, '又漂来好多垃圾!', '#fff'); } };
    const build = { x: G.W - 10 - bh * 4.6, y: by, w: bh * 4.6, h: bh, label: '🔨 建造乐园', color: '#27ae60', fs: Math.round(bh * 0.34), onTap: () => Eng.openCraft() };
    ocean.buttons.push(back, mute, refresh, build); btn(ctx, back); btn(ctx, mute); btn(ctx, refresh); btn(ctx, build);

    // 剩余提示
    if (ocean.items.length === 0) { ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold ' + Math.round(G.H * 0.04) + 'px "PingFang SC",sans-serif'; ctx.fillText('海里干净啦! 点「刷新海域」再清理，或去「建造乐园」', G.W / 2, (waterTop() + sandTop()) / 2); }
  };

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
