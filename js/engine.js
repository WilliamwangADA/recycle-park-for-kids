/* ===========================================================================
   回收乐园 · 引擎核心：画布 / 主循环 / 场景管理 / 输入 / 存档 / 特效 / UI 工具
   =========================================================================== */
window.Game = (function () {
  const G = {
    canvas: null, ctx: null, W: 0, H: 0, dpr: 1,
    scene: null, scenes: {}, t: 0, last: 0,
    fx: [],          // 粒子 / 漂浮文字
    pointer: { x: 0, y: 0, down: false },
    save: null,
  };

  /* ---------- 存档 ---------- */
  const SAVE_KEY = 'recycle_park_v1', BAK_KEY = 'recycle_park_v1_bak';
  function defaultSave() {
    return {
      ver: 2,                // 存档版本（升级时只增不破坏）
      bag: {},               // 捡到未分类的垃圾 {trashId: count}
      mats: {},              // 材料 {matId: count}
      built: {},             // 已造物品 {itemId: count}
      placed: [],            // 乐园里摆放 [{id, item, x, y, onId?, rot?, homeId?}]
      tentPlaced: [],        // 旧版帐篷布置（已迁移到 homes['1'].rooms.living）
      homes: { '1': { style: 0, rooms: { living: [], bedroom: [], kitchen: [], bathroom: [] } } }, // 每顶帐篷=一个家，各有风格+4房间
      homeSeq: 2,            // 新帐篷家 id 自增
      weather: 0,            // (旧)乐园天气，已由 season 取代
      season: 1,             // 乐园季节 0春 1夏 2秋 3冬
      night: false,          // 乐园昼夜
      adaPos: {},            // Ada 公主位置 {park:{x,y}, tent:{x,y}}（可拖动+自己溜达）
      placeSeq: 1,           // 摆放项唯一 id 自增
      stars: 0,              // 分类星星（货币之一，给造物提示用）
      cleared: {},           // 已通关的关卡 {levelId:true}（解锁下一关）
      popularity: 0,         // 人气
      visitors: {},          // 已吸引来的访客
      seen: false,           // 是否看过开场
    };
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
  // 深度补默认：新版新增字段自动补齐，旧存档里已有的数据(已造/已摆放等)原样保留
  function fillDefaults(save, def) {
    for (const k in def) {
      if (save[k] === undefined || save[k] === null) save[k] = clone(def[k]);
      else if (isObj(def[k]) && isObj(save[k])) fillDefaults(save[k], def[k]);
    }
    return save;
  }
  function load() {
    let parsed = null;
    try { const raw = localStorage.getItem(SAVE_KEY); if (raw) parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    if (!parsed) { try { const b = localStorage.getItem(BAK_KEY); if (b) parsed = JSON.parse(b); } catch (e) {} }   // 主存档损坏 → 用备份恢复
    G.save = parsed || defaultSave();
    fillDefaults(G.save, defaultSave());   // 深度补齐新字段，保留旧数据
    // homes 结构 + 旧 tentPlaced 迁移到 1 号家客厅
    if (!G.save.homes) G.save.homes = { '1': { style: 0, rooms: { living: [], bedroom: [], kitchen: [], bathroom: [] } } };
    if (!G.save.homes['1']) G.save.homes['1'] = { style: 0, rooms: { living: [], bedroom: [], kitchen: [], bathroom: [] } };
    if (G.save.tentPlaced && G.save.tentPlaced.length && !G.save.tentMig) { G.save.homes['1'].rooms.living = G.save.homes['1'].rooms.living.concat(G.save.tentPlaced); G.save.tentPlaced = []; G.save.tentMig = true; }
    G.save.placed.forEach(p => { if (p.base && !p.homeId) p.homeId = '1'; });
    // 给所有摆放项补 id
    let mx = 0, all = G.save.placed.slice();
    for (const hid in G.save.homes) for (const rm in G.save.homes[hid].rooms) all = all.concat(G.save.homes[hid].rooms[rm]);
    all.forEach(p => { if (!p.id) p.id = G.save.placeSeq++; mx = Math.max(mx, p.id); });
    if (G.save.placeSeq <= mx) G.save.placeSeq = mx + 1;
    G.save.ver = defaultSave().ver;
    // 备份本次加载到的有效存档（万一以后写坏了可回退）
    try { localStorage.setItem(BAK_KEY, JSON.stringify(G.save)); } catch (e) {}
  }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) {} }
  function resetSave() { G.save = defaultSave(); persist(); }
  // 存档导出/导入（让用户手动备份、换设备也能带走进度）
  function exportSave() { try { return btoa(unescape(encodeURIComponent(JSON.stringify(G.save)))); } catch (e) { return ''; } }
  function importSave(code) {
    try {
      const obj = JSON.parse(decodeURIComponent(escape(atob((code || '').trim()))));
      if (!isObj(obj) || (!obj.built && !obj.placed && !obj.mats && !obj.homes)) return false;
      G.save = fillDefaults(obj, defaultSave()); persist();
      try { localStorage.setItem(BAK_KEY, JSON.stringify(G.save)); } catch (e) {}
      return true;
    } catch (e) { return false; }
  }

  /* ---------- 画布 ---------- */
  function resize() {
    G.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    G.W = window.innerWidth; G.H = window.innerHeight;
    G.canvas.width = G.W * G.dpr; G.canvas.height = G.H * G.dpr;
    G.canvas.style.width = G.W + 'px'; G.canvas.style.height = G.H + 'px';
    G.ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    if (G.scene && G.scene.resize) G.scene.resize();
  }

  /* ---------- 场景切换 ---------- */
  function go(name, arg) {
    if (G.scene && G.scene.exit) G.scene.exit();
    G.cur = name;
    G.scene = G.scenes[name];
    G.fx = [];
    if (G.scene && G.scene.enter) G.scene.enter(arg);
  }
  // 随时打开建造页（记住从哪来，造完返回）
  function openCraft() { if (G.cur !== 'craft') G.returnTo = G.cur; go('craft'); }

  /* ---------- 主循环 ---------- */
  function frame(ts) {
    const dt = Math.min(0.05, (ts - G.last) / 1000 || 0);
    G.last = ts; G.t += dt;
    const ctx = G.ctx;
    ctx.clearRect(0, 0, G.W, G.H);                 // 每帧清屏，避免切场景残留
    if (G.scene) { if (G.scene.update) G.scene.update(dt); if (G.scene.draw) G.scene.draw(ctx); }
    drawFx(ctx, dt);
    requestAnimationFrame(frame);
  }

  /* ---------- 特效：星星迸发 + 漂浮文字 ---------- */
  function burst(x, y, color, n) {
    n = n || 10;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, s = 60 + Math.random() * 120;
      G.fx.push({ type: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.8, age: 0, color: color || '#feca57', r: 3 + Math.random() * 4 });
    }
  }
  function floatText(x, y, text, color) {
    G.fx.push({ type: 't', x, y, text, color: color || '#fff', life: 1.1, age: 0 });
  }
  function drawFx(ctx, dt) {
    for (let i = G.fx.length - 1; i >= 0; i--) {
      const f = G.fx[i]; f.age += dt;
      if (f.age >= f.life) { G.fx.splice(i, 1); continue; }
      const k = 1 - f.age / f.life;
      if (f.type === 'p') {
        f.vy += 260 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
        ctx.globalAlpha = k; ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        f.y -= 40 * dt;
        ctx.globalAlpha = k; ctx.fillStyle = f.color;
        ctx.font = 'bold ' + Math.round(G.H * 0.045) + 'px "PingFang SC",sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.35)';
        ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y);
        ctx.globalAlpha = 1;
      }
    }
  }

  /* ---------- 输入 ---------- */
  function pos(e) {
    const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    const r = G.canvas.getBoundingClientRect();
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  }
  function touchDist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
  function touchAng(t) { return Math.atan2(t[1].clientY - t[0].clientY, t[1].clientX - t[0].clientX); }
  function touchMid(t) { const r = G.canvas.getBoundingClientRect(); return { x: (t[0].clientX + t[1].clientX) / 2 - r.left, y: (t[0].clientY + t[1].clientY) / 2 - r.top }; }
  function onDown(e) {
    e.preventDefault(); Audio2.unlock();
    if (e.touches && e.touches.length >= 2) {                 // 双指 → 缩放/旋转，取消单指拖动
      G._pinch = { d: touchDist(e.touches), a: touchAng(e.touches), m: touchMid(e.touches) };
      if (G.scene && G.scene.cancelDrag) G.scene.cancelDrag();
      return;
    }
    const p = pos(e); G.pointer.x = p.x; G.pointer.y = p.y; G.pointer.down = true;
    if (G.scene && G.scene.down) G.scene.down(p.x, p.y);
  }
  function onMove(e) {
    if (G._pinch && e.touches && e.touches.length >= 2) {
      const d = touchDist(e.touches), ang = touchAng(e.touches), m = touchMid(e.touches), f = d / (G._pinch.d || d);
      let da = ang - G._pinch.a; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
      if (G.scene && G.scene.onPinch) G.scene.onPinch(f, m.x, m.y, da);
      G._pinch.d = d; G._pinch.a = ang; G._pinch.m = m; G.pointer.x = m.x; G.pointer.y = m.y;
      return;
    }
    const p = pos(e); G.pointer.x = p.x; G.pointer.y = p.y;
    if (G.scene && G.scene.move) G.scene.move(p.x, p.y);
  }
  function onUp(e) {
    if (G._pinch) { if (!e.touches || e.touches.length < 2) { G._pinch = null; if (G.scene && G.scene.onPinchEnd) G.scene.onPinchEnd(); } G.pointer.down = false; return; }
    const p = pos(e); G.pointer.down = false;
    if (G.scene && G.scene.up) G.scene.up(p.x, p.y);
  }

  /* ---------- UI 工具：可点按钮（画布内）---------- */
  function lighten(hex, amt) { if (!hex || hex[0] !== '#') return hex; const n = parseInt(hex.slice(1), 16); let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt; r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b)); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }
  function softShadow(ctx, cx, cy, rx, ry, a) { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); g.addColorStop(0, 'rgba(20,24,40,' + (a == null ? .22 : a) + ')'); g.addColorStop(0.7, 'rgba(20,24,40,' + (a == null ? .12 : a * 0.5) + ')'); g.addColorStop(1, 'rgba(20,24,40,0)'); ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 7); ctx.fill(); ctx.restore(); }
  function drawButton(ctx, b) {
    // b: {x,y,w,h,label,color,sprite,r,pressed,disabled}
    const r = b.r != null ? b.r : Math.min(b.w, b.h) * 0.3;
    ctx.save();
    const dy = b.pressed ? 3 : 0, base = b.disabled ? '#c2c6cc' : (b.color || '#ff9f43');
    // 柔和投影
    ctx.save(); ctx.shadowColor = 'rgba(18,20,40,.3)'; ctx.shadowBlur = b.pressed ? 4 : 11; ctx.shadowOffsetY = b.pressed ? 2 : 5;
    roundRect(ctx, b.x, b.y + dy, b.w, b.h, r); ctx.fillStyle = base; ctx.fill(); ctx.restore();
    // 渐变体（亮顶→暗底）
    const g = ctx.createLinearGradient(0, b.y + dy, 0, b.y + dy + b.h);
    g.addColorStop(0, lighten(base, 30)); g.addColorStop(0.55, base); g.addColorStop(1, lighten(base, -16));
    roundRect(ctx, b.x, b.y + dy, b.w, b.h, r); ctx.fillStyle = g; ctx.fill();
    // 顶部玻璃高光
    ctx.save(); roundRect(ctx, b.x, b.y + dy, b.w, b.h, r); ctx.clip(); roundRect(ctx, b.x + b.w * 0.05, b.y + dy + b.h * 0.08, b.w * 0.9, b.h * 0.42, r * 0.7); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fill(); ctx.restore();
    // 内浅描边 + 外深描边
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.45)'; roundRect(ctx, b.x + 1.2, b.y + dy + 1.2, b.w - 2.4, b.h - 2.4, Math.max(1, r - 1)); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = lighten(base, -36); roundRect(ctx, b.x, b.y + dy, b.w, b.h, r); ctx.stroke();
    if (b.sprite) Sprites.draw(ctx, b.sprite, b.x + b.h * 0.5, b.y + b.h * 0.5 + dy, b.h * 0.7);
    if (b.label) {
      ctx.fillStyle = b.disabled ? '#7a7d82' : (b.text || '#fff');
      ctx.font = 'bold ' + (b.fs || Math.round(b.h * 0.4)) + 'px "PingFang SC",sans-serif';
      ctx.textAlign = b.sprite ? 'left' : 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(0,0,0,.22)';
      const tx = b.sprite ? b.x + b.h : b.x + b.w / 2, ty = b.y + b.h / 2 + dy;
      ctx.strokeText(b.label, tx, ty); ctx.fillText(b.label, tx, ty);
    }
    ctx.restore();
  }
  function inBtn(b, x, y) { return !b.disabled && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* 背景渐变工具 */
  function bg(ctx, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, 0, G.H);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
  }

  /* 顶部原料计分牌（6 种材料 + 星星），返回底部 y */
  function topBar(ctx, y) {
    const pad = 10, h = Math.max(44, G.H * 0.072); y = y == null ? pad : y;
    ctx.save();
    // 外壳（柔影 + 玻璃渐变 + 顶部高光）
    ctx.save(); ctx.shadowColor = 'rgba(20,30,60,.22)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4; roundRect(ctx, pad, y, G.W - pad * 2, h, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
    roundRect(ctx, pad, y, G.W - pad * 2, h, 16);
    const gr = ctx.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, 'rgba(255,255,255,.97)'); gr.addColorStop(1, 'rgba(232,242,250,.94)');
    ctx.fillStyle = gr; ctx.fill();
    ctx.save(); roundRect(ctx, pad, y, G.W - pad * 2, h, 16); ctx.clip(); roundRect(ctx, pad + 4, y + 3, G.W - pad * 2 - 8, h * 0.4, 12); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill(); ctx.restore();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(120,150,180,.25)'; roundRect(ctx, pad, y, G.W - pad * 2, h, 16); ctx.stroke();
    const mats = DATA.MATERIALS, keys = Object.keys(mats);
    const starW = h * 1.5;
    const cell = (G.W - pad * 2 - starW) / keys.length;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    keys.forEach((k, i) => {
      const cx = pad + i * cell + 6;
      // pill
      roundRect(ctx, cx, y + h * 0.16, cell - 6, h * 0.68, h * 0.34);
      ctx.fillStyle = (G.save.mats[k] || 0) > 0 ? '#fff' : 'rgba(255,255,255,.5)'; ctx.fill();
      Sprites.draw(ctx, mats[k].icon, cx + h * 0.36, y + h / 2, h * 0.62);
      ctx.fillStyle = '#43342b';
      ctx.font = 'bold ' + Math.round(h * 0.36) + 'px "PingFang SC",sans-serif';
      ctx.fillText((G.save.mats[k] || 0), cx + h * 0.7, y + h / 2 + 1);
    });
    ctx.textAlign = 'right'; ctx.fillStyle = '#f0a500';
    ctx.font = 'bold ' + Math.round(h * 0.4) + 'px "PingFang SC",sans-serif';
    ctx.fillText('⭐' + G.save.stars, G.W - pad - 12, y + h / 2 + 1);
    ctx.restore();
    return y + h;
  }

  /* ---------- 启动 ---------- */
  function init() {
    G.canvas = document.getElementById('game');
    G.ctx = G.canvas.getContext('2d');
    load(); resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', function () { setTimeout(resize, 200); setTimeout(resize, 500); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    const c = G.canvas;
    c.addEventListener('mousedown', onDown); c.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    c.addEventListener('touchstart', onDown, { passive: false }); c.addEventListener('touchmove', onMove, { passive: false }); c.addEventListener('touchend', onUp);
    c.addEventListener('wheel', e => { if (G.scene && G.scene.wheel) { e.preventDefault(); G.scene.wheel(e.deltaY); } }, { passive: false });
    go('menu');
    requestAnimationFrame(t => { G.last = t; requestAnimationFrame(frame); });
  }

  return {
    G, init, go, openCraft, persist, resetSave, exportSave, importSave,
    burst, floatText, drawButton, inBtn, roundRect, bg, topBar, softShadow, lighten,
    // 便捷：给材料/星星等
    addMat(k, n) { G.save.mats[k] = (G.save.mats[k] || 0) + n; },
  };
})();
