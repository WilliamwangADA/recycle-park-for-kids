/* ===========================================================================
   场景 1/2/3：主菜单 / 大海捡垃圾 / 垃圾分类
   =========================================================================== */
(function () {
  const Eng = window.Game, G = Eng.G;
  const rr = Eng.roundRect, btn = Eng.drawButton, hit = Eng.inBtn;

  /* 通用：处理一组按钮的点击（down 标记，up 触发）*/
  function makeBtnLayer(scene) {
    scene.buttons = [];
    scene._active = null;
    scene.down = function (x, y) {
      scene._active = null;
      for (const b of scene.buttons) if (hit(b, x, y)) { b.pressed = true; scene._active = b; break; }
      if (scene._downExtra) scene._downExtra(x, y);
    };
    scene.up = function (x, y) {
      const a = scene._active;
      scene.buttons.forEach(b => b.pressed = false);
      if (a && hit(a, x, y) && a.onTap) { Audio2.sfx('click'); a.onTap(); }
      scene._active = null;
      if (scene._upExtra) scene._upExtra(x, y);
    };
    scene.move = function (x, y) {
      if (scene._moveExtra) scene._moveExtra(x, y);
      if (scene._active && !hit(scene._active, x, y)) scene._active.pressed = false;
    };
  }

  /* 顶部返回按钮 + 静音按钮（多个场景复用，注册进 scene.buttons）*/
  function topNav(scene, ctx, opts) {
    opts = opts || {};
    const s = Math.max(40, G.H * 0.07), pad = 12;
    if (!opts.noBack) {
      const b = { x: pad, y: pad, w: s, h: s, label: '◀', color: '#ff7675', fs: Math.round(s * 0.5), onTap: opts.onBack || (() => Eng.go('menu')) };
      scene.buttons.push(b); btn(ctx, b);
    }
    const m = { x: G.W - pad - s, y: pad, w: s, h: s, label: Audio2.isMuted() ? '🔇' : '🔊', color: '#74b9ff', fs: Math.round(s * 0.45), onTap: () => { Audio2.setMuted(!Audio2.isMuted()); m.label = Audio2.isMuted() ? '🔇' : '🔊'; } };
    scene.buttons.push(m); btn(ctx, m);
  }

  function totalBag() { let n = 0; for (const k in G.save.bag) n += G.save.bag[k]; return n; }

  /* =======================================================================
     场景：主菜单 / 关卡选择
     ======================================================================= */
  const menu = {};
  makeBtnLayer(menu);
  menu.enter = function () {
    if (!G.save.seen) { Audio2.voice('welcome'); G.save.seen = true; Eng.persist(); }
    else Audio2.voice('menu');
  };
  menu.draw = function (ctx) {
    menu.buttons = [];
    Eng.bg(ctx, '#aee9ff', '#d6f7e6');
    // 太阳 + 云
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(G.W * 0.84, G.H * 0.16, G.H * 0.07, 0, 7); ctx.fill();
    cloud(ctx, G.W * 0.2, G.H * 0.14, G.H * 0.05);
    cloud(ctx, G.W * 0.55, G.H * 0.1, G.H * 0.04);
    // 草地
    ctx.fillStyle = '#9be86b'; ctx.beginPath();
    ctx.moveTo(0, G.H * 0.7); ctx.quadraticCurveTo(G.W * 0.5, G.H * 0.64, G.W, G.H * 0.7); ctx.lineTo(G.W, G.H); ctx.lineTo(0, G.H); ctx.fill();
    // 标题
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + Math.round(G.H * 0.085) + 'px "PingFang SC",sans-serif';
    ctx.lineWidth = 8; ctx.strokeStyle = '#2e7d32'; ctx.fillStyle = '#fff';
    ctx.strokeText('回收乐园', G.W / 2, G.H * 0.18); ctx.fillText('回收乐园', G.W / 2, G.H * 0.18);
    ctx.font = 'bold ' + Math.round(G.H * 0.034) + 'px "PingFang SC",sans-serif';
    ctx.fillStyle = '#3a7d3a'; ctx.lineWidth = 0;
    ctx.fillText('捡垃圾 · 分一分 · 变材料 · 造乐园', G.W / 2, G.H * 0.28);

    // 主按钮：去大海
    const bw = Math.min(G.W * 0.7, 460), bh = G.H * 0.13;
    const go = { x: (G.W - bw) / 2, y: G.H * 0.36, w: bw, h: bh, label: '🌊 去大海捡垃圾', color: '#2e86de', fs: Math.round(bh * 0.34), onTap: () => Eng.go('dive', DATA.LEVELS[0]) };
    menu.buttons.push(go); btn(ctx, go);

    // 关卡小卡（其余锁定）
    const cards = DATA.LEVELS, cw = Math.min(G.W * 0.92, 700);
    const n = cards.length, gap = 8, iw = (cw - gap * (n - 1)) / n, ih = iw * 1.1;
    const sx = (G.W - cw) / 2, sy = G.H * 0.53;
    cards.forEach((lv, i) => {
      const x = sx + i * (iw + gap);
      rr(ctx, x, sy, iw, ih, 12);
      ctx.fillStyle = lv.unlocked ? '#fff' : 'rgba(255,255,255,.5)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = lv.unlocked ? '#2e86de' : '#b2bec3'; ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = lv.unlocked ? '#2d3436' : '#9aa';
      ctx.font = 'bold ' + Math.round(iw * 0.26) + 'px "PingFang SC",sans-serif';
      ctx.fillText(lv.unlocked ? '🌊' : '🔒', x + iw / 2, sy + ih * 0.4);
      ctx.font = 'bold ' + Math.round(iw * 0.2) + 'px "PingFang SC",sans-serif';
      ctx.fillText(lv.name, x + iw / 2, sy + ih * 0.78);
      if (lv.unlocked) menu.buttons.push({ x, y: sy, w: iw, h: ih, onTap: () => Eng.go('dive', lv) });
    });
    ctx.textAlign = 'center';
    ctx.font = 'bold ' + Math.round(G.H * 0.024) + 'px "PingFang SC",sans-serif';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText('更多地方马上就来啦～', G.W / 2, sy + ih + G.H * 0.03);

    // 底部：造东西 / 我的乐园
    const fbw = Math.min(G.W * 0.42, 280), fbh = G.H * 0.1, fy = G.H * 0.84;
    const c = { x: G.W / 2 - fbw - 8, y: fy, w: fbw, h: fbh, label: '🔨 造东西', color: '#e67e22', fs: Math.round(fbh * 0.32), onTap: () => Eng.go('craft') };
    const p = { x: G.W / 2 + 8, y: fy, w: fbw, h: fbh, label: '🏡 我的乐园', color: '#27ae60', fs: Math.round(fbh * 0.32), onTap: () => Eng.go('park') };
    menu.buttons.push(c, p); btn(ctx, c); btn(ctx, p);

    topNav(menu, ctx, { noBack: true });
  };

  /* =======================================================================
     场景：大海捡垃圾（潜水员戴夫式）
     ======================================================================= */
  const dive = {};
  makeBtnLayer(dive);
  dive.enter = function (lv) {
    dive.lv = lv || DATA.LEVELS[0];
    dive.diver = { x: G.W / 2, y: G.H / 2, tx: G.W / 2, ty: G.H / 2, face: 1 };
    dive.items = [];
    dive.fish = [];
    dive.bubbles = [];
    dive.collected = 0;
    // 撒垃圾
    const pool = dive.lv.trash, count = 14;
    for (let i = 0; i < count; i++) {
      const id = pool[Math.floor(Math.random() * pool.length)];
      dive.items.push({ id, x: 60 + Math.random() * (G.W - 120), y: G.H * 0.32 + Math.random() * (G.H * 0.55), ph: Math.random() * 6.28, gone: false, s: G.H * 0.075 });
    }
    for (let i = 0; i < 5; i++) dive.fish.push({ x: Math.random() * G.W, y: G.H * 0.3 + Math.random() * G.H * 0.5, vx: (Math.random() < .5 ? 1 : -1) * (30 + Math.random() * 30), ph: Math.random() * 6.28 });
    Audio2.sfx('splash'); Audio2.voice('dive_start');
  };
  dive._downExtra = function (x, y) { dive.diver.tx = x; dive.diver.ty = y; };
  dive._moveExtra = function (x, y) { if (G.pointer.down) { dive.diver.tx = x; dive.diver.ty = y; } };
  dive.update = function (dt) {
    const d = dive.diver;
    if (d.tx - d.x > 2) d.face = 1; else if (d.x - d.tx > 2) d.face = -1;
    d.x += (d.tx - d.x) * Math.min(1, dt * 6);
    d.y += (d.ty - d.y) * Math.min(1, dt * 6);
    // 收集
    const reach = G.H * 0.07;
    dive.items.forEach(it => {
      if (it.gone) return;
      it.ph += dt;
      const bx = it.x, by = it.y + Math.sin(it.ph) * 5;
      if (Math.hypot(bx - d.x, by - d.y) < reach + it.s * 0.4) {
        it.gone = true; dive.collected++;
        G.save.bag[it.id] = (G.save.bag[it.id] || 0) + 1;
        Audio2.sfx('collect'); Eng.burst(bx, by, '#7bed9f', 8);
        for (let k = 0; k < 3; k++) dive.bubbles.push({ x: bx, y: by, vy: -40 - Math.random() * 40, r: 4 + Math.random() * 6, age: 0 });
      }
    });
    dive.fish.forEach(f => { f.x += f.vx * dt; f.ph += dt; if (f.x < -40) f.x = G.W + 40; if (f.x > G.W + 40) f.x = -40; });
    for (let i = dive.bubbles.length - 1; i >= 0; i--) { const b = dive.bubbles[i]; b.y += b.vy * dt; b.age += dt; if (b.age > 1.5) dive.bubbles.splice(i, 1); }
    // 偶发气泡
    if (Math.random() < dt * 2) dive.bubbles.push({ x: Math.random() * G.W, y: G.H, vy: -30 - Math.random() * 30, r: 3 + Math.random() * 5, age: 0 });
  };
  dive.draw = function (ctx) {
    dive.buttons = [];
    Eng.bg(ctx, '#2ba3d4', '#0a4f78');
    // 光柱
    ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) { const x = G.W * (0.15 + i * 0.22); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x + 160, G.H); ctx.lineTo(x + 100, G.H); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // 沙地
    ctx.fillStyle = '#e9d8a6'; ctx.beginPath(); ctx.moveTo(0, G.H * 0.9); ctx.quadraticCurveTo(G.W * 0.5, G.H * 0.85, G.W, G.H * 0.9); ctx.lineTo(G.W, G.H); ctx.lineTo(0, G.H); ctx.fill();
    // 装饰鱼
    dive.fish.forEach(f => { ctx.save(); ctx.translate(f.x, f.y + Math.sin(f.ph) * 6); if (f.vx < 0) ctx.scale(-1, 1); Sprites.draw(ctx, 'fish', 0, 0, G.H * 0.08); ctx.restore(); });
    // 气泡
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    dive.bubbles.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); });
    // 垃圾
    dive.items.forEach(it => { if (it.gone) return; Sprites.draw(ctx, DATA.TRASH[it.id].sprite, it.x, it.y + Math.sin(it.ph) * 5, it.s); });
    // 潜水员
    const d = dive.diver; ctx.save(); ctx.translate(d.x, d.y); ctx.scale(d.face, 1); Sprites.draw(ctx, 'diver', 0, 0, G.H * 0.13); ctx.restore();

    // HUD：背包计数
    const remain = dive.items.filter(i => !i.gone).length;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + Math.round(G.H * 0.04) + 'px "PingFang SC",sans-serif';
    rr(ctx, G.W / 2 - 110, 14, 220, G.H * 0.07, 16); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();
    ctx.fillStyle = '#0a4f78'; ctx.fillText('🎒 捡到 ' + dive.collected + ' 个', G.W / 2, 14 + G.H * 0.035);

    // 完成按钮
    const bw = Math.min(G.W * 0.6, 380), bh = G.H * 0.1;
    const done = { x: (G.W - bw) / 2, y: G.H - bh - 16, w: bw, h: bh, color: remain === 0 ? '#27ae60' : '#f39c12', fs: Math.round(bh * 0.36), label: remain === 0 ? '✅ 全捡完啦！去分类' : ('上岸分类 (' + dive.collected + ')'), onTap: () => { if (dive.collected > 0) Eng.go('sort'); else Audio2.voice('need_more'); } };
    dive.buttons.push(done); btn(ctx, done);
    topNav(dive, ctx);
  };

  /* =======================================================================
     场景：垃圾分类（拖进对应的桶）
     ======================================================================= */
  const sort = {};
  makeBtnLayer(sort);
  sort.enter = function () {
    sort.queue = [];
    for (const id in G.save.bag) for (let i = 0; i < G.save.bag[id]; i++) sort.queue.push(id);
    shuffle(sort.queue);
    sort.cur = null; sort.drag = null; sort.shakeT = 0;
    sort.done = sort.queue.length === 0;
    sort.gained = {};  // 本次产出材料统计
    nextItem();
    Audio2.voice('sort_intro');
  };
  function nextItem() {
    if (sort.queue.length === 0) { sort.cur = null; sort.done = true; Audio2.voice('sort_done'); return; }
    const id = sort.queue.shift();
    sort.cur = { id, x: G.W / 2, y: G.H * 0.3, hx: G.W / 2, hy: G.H * 0.3 };
  }
  function binRects() {
    const n = DATA.BINS.length, pad = 10, gap = 10;
    const w = (G.W - pad * 2 - gap * (n - 1)) / n, h = G.H * 0.26, y = G.H - h - 12;
    return DATA.BINS.map((b, i) => ({ bin: b, x: pad + i * (w + gap), y, w, h }));
  }
  sort._downExtra = function (x, y) {
    if (sort.cur) {
      const s = G.H * 0.12;
      if (Math.abs(x - sort.cur.x) < s && Math.abs(y - sort.cur.y) < s) sort.drag = { dx: x - sort.cur.x, dy: y - sort.cur.y };
    }
  };
  sort._moveExtra = function (x, y) { if (sort.drag && sort.cur) { sort.cur.x = x - sort.drag.dx; sort.cur.y = y - sort.drag.dy; } };
  sort._upExtra = function (x, y) {
    if (!sort.drag || !sort.cur) { sort.drag = null; return; }
    sort.drag = null;
    const r = binRects().find(r => x >= r.x && x <= r.x + r.w && y >= r.y - 20 && y <= r.y + r.h);
    if (!r) { sort.cur.x = G.W / 2; sort.cur.y = G.H * 0.3; return; }   // 没投进桶，弹回
    const t = DATA.TRASH[sort.cur.id];
    if (t.bin === r.bin.id) {                                          // 分对
      Audio2.sfx('good'); G.save.bag[sort.cur.id]--; if (G.save.bag[sort.cur.id] <= 0) delete G.save.bag[sort.cur.id];
      G.save.stars++;
      Eng.burst(r.x + r.w / 2, r.y, r.bin.color, 12);
      if (t.yield) {
        Eng.addMat(t.yield, 1); sort.gained[t.yield] = (sort.gained[t.yield] || 0) + 1;
        Eng.floatText(r.x + r.w / 2, r.y - 10, '+1 ' + DATA.MATERIALS[t.yield].name, DATA.MATERIALS[t.yield].color);
        Audio2.voice('got_mat');
      } else { Eng.floatText(r.x + r.w / 2, r.y - 10, '处理好啦!', '#fff'); Audio2.voice('right'); }
      Eng.persist(); nextItem();
    } else {                                                           // 分错
      Audio2.sfx('bad'); sort.shakeT = 0.5; sort.cur.x = G.W / 2; sort.cur.y = G.H * 0.3;
      Eng.floatText(G.W / 2, G.H * 0.25, '不对哦，再想想~', '#ff7675'); Audio2.voice('wrong');
    }
  };
  sort.update = function (dt) { if (sort.shakeT > 0) sort.shakeT -= dt; };
  sort.draw = function (ctx) {
    sort.buttons = [];
    Eng.bg(ctx, '#fff6e0', '#ffe2c2');
    // 标题
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + Math.round(G.H * 0.045) + 'px "PingFang SC",sans-serif';
    ctx.fillStyle = '#e67e22';
    ctx.fillText('把垃圾放进对的桶里', G.W / 2, G.H * 0.1);
    ctx.font = 'bold ' + Math.round(G.H * 0.028) + 'px "PingFang SC",sans-serif';
    ctx.fillStyle = '#b3692a';
    ctx.fillText('还剩 ' + (sort.queue.length + (sort.cur ? 1 : 0)) + ' 个', G.W / 2, G.H * 0.155);

    // 垃圾桶
    binRects().forEach(r => {
      rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.fillStyle = r.bin.color; ctx.fill();
      rr(ctx, r.x, r.y, r.w, r.h * 0.22, 12); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill();
      // 盖子
      rr(ctx, r.x - 4, r.y - 14, r.w + 8, 18, 8); ctx.fillStyle = shadeColor(r.bin.color, -20); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.font = 'bold ' + Math.round(r.w * 0.17) + 'px "PingFang SC",sans-serif';
      ctx.fillText(r.bin.name, r.x + r.w / 2, r.y + r.h * 0.55);
      ctx.font = 'bold ' + Math.round(r.w * 0.095) + 'px "PingFang SC",sans-serif';
      ctx.globalAlpha = 0.9; ctx.fillText(r.bin.tip, r.x + r.w / 2, r.y + r.h * 0.78); ctx.globalAlpha = 1;
    });

    // 当前垃圾
    if (sort.cur) {
      const sh = sort.shakeT > 0 ? Math.sin(sort.shakeT * 50) * 8 : 0;
      const t = DATA.TRASH[sort.cur.id];
      ctx.font = 'bold ' + Math.round(G.H * 0.03) + 'px "PingFang SC",sans-serif';
      ctx.fillStyle = '#2d3436'; ctx.fillText(t.name, sort.cur.x + sh, sort.cur.y - G.H * 0.08);
      Sprites.draw(ctx, t.sprite, sort.cur.x + sh, sort.cur.y, G.H * 0.16);
    } else if (sort.done) {
      ctx.fillStyle = '#27ae60'; ctx.font = 'bold ' + Math.round(G.H * 0.05) + 'px "PingFang SC",sans-serif';
      ctx.fillText('🎉 全部分类好啦！', G.W / 2, G.H * 0.32);
      const bw = Math.min(G.W * 0.6, 360), bh = G.H * 0.1;
      const b = { x: (G.W - bw) / 2, y: G.H * 0.4, w: bw, h: bh, label: '🔨 去造东西', color: '#e67e22', fs: Math.round(bh * 0.34), onTap: () => Eng.go('craft') };
      sort.buttons.push(b); btn(ctx, b);
    }
    topNav(sort, ctx);
  };

  /* ---------- 小工具 ---------- */
  function cloud(ctx, x, y, r) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.arc(x + r, y + r * 0.2, r * 0.8, 0, 7); ctx.arc(x - r, y + r * 0.2, r * 0.8, 0, 7); ctx.fill(); }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
  function shadeColor(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  G.scenes.menu = menu; G.scenes.dive = dive; G.scenes.sort = sort;
})();
