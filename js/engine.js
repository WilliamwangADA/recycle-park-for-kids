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
  const SAVE_KEY = 'recycle_park_v1';
  function defaultSave() {
    return {
      bag: {},               // 捡到未分类的垃圾 {trashId: count}
      mats: {},              // 材料 {matId: count}
      built: {},             // 已造物品 {itemId: count}
      placed: [],            // 乐园里摆放 [{id, item, x, y, onId?}]
      tentPlaced: [],        // 帐篷内布置 [{id, item, x, y, onId?}]
      placeSeq: 1,           // 摆放项唯一 id 自增
      stars: 0,              // 分类星星（货币之一，给造物提示用）
      popularity: 0,         // 人气
      visitors: {},          // 已吸引来的访客
      seen: false,           // 是否看过开场
    };
  }
  function load() {
    try { G.save = JSON.parse(localStorage.getItem(SAVE_KEY)) || defaultSave(); }
    catch (e) { G.save = defaultSave(); }
    // 补字段（向后兼容）
    const d = defaultSave();
    for (const k in d) if (G.save[k] == null) G.save[k] = d[k];
    // 给旧存档的摆放项补 id
    let mx = 0;
    G.save.placed.concat(G.save.tentPlaced).forEach(p => { if (!p.id) p.id = G.save.placeSeq++; mx = Math.max(mx, p.id); });
    if (G.save.placeSeq <= mx) G.save.placeSeq = mx + 1;
  }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) {} }
  function resetSave() { G.save = defaultSave(); persist(); }

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
  function onDown(e) {
    e.preventDefault(); Audio2.unlock();
    const p = pos(e); G.pointer.x = p.x; G.pointer.y = p.y; G.pointer.down = true;
    if (G.scene && G.scene.down) G.scene.down(p.x, p.y);
  }
  function onMove(e) {
    const p = pos(e); G.pointer.x = p.x; G.pointer.y = p.y;
    if (G.scene && G.scene.move) G.scene.move(p.x, p.y);
  }
  function onUp(e) {
    const p = pos(e); G.pointer.down = false;
    if (G.scene && G.scene.up) G.scene.up(p.x, p.y);
  }

  /* ---------- UI 工具：可点按钮（画布内）---------- */
  // btns: 数组缓存当前帧按钮，hit() 命中检测
  function drawButton(ctx, b) {
    // b: {x,y,w,h,label,color,sprite,r,pressed,disabled}
    const r = b.r != null ? b.r : Math.min(b.w, b.h) * 0.28;
    ctx.save();
    const dy = b.pressed ? 3 : 0;
    // 底部阴影
    roundRect(ctx, b.x, b.y + 5, b.w, b.h, r); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fill();
    roundRect(ctx, b.x, b.y + dy, b.w, b.h, r);
    ctx.fillStyle = b.disabled ? '#c8c8c8' : (b.color || '#ff9f43'); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.stroke();
    if (b.sprite) Sprites.draw(ctx, b.sprite, b.x + b.h * 0.5, b.y + b.h * 0.5 + dy, b.h * 0.7);
    if (b.label) {
      ctx.fillStyle = b.disabled ? '#888' : (b.text || '#fff');
      ctx.font = 'bold ' + (b.fs || Math.round(b.h * 0.4)) + 'px "PingFang SC",sans-serif';
      ctx.textAlign = b.sprite ? 'left' : 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.18)';
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
    // 外壳
    roundRect(ctx, pad, y, G.W - pad * 2, h, 14);
    const gr = ctx.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, 'rgba(255,255,255,.94)'); gr.addColorStop(1, 'rgba(236,244,250,.92)');
    ctx.fillStyle = gr; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.stroke();
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
    const c = G.canvas;
    c.addEventListener('mousedown', onDown); c.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    c.addEventListener('touchstart', onDown, { passive: false }); c.addEventListener('touchmove', onMove, { passive: false }); c.addEventListener('touchend', onUp);
    c.addEventListener('wheel', e => { if (G.scene && G.scene.wheel) { e.preventDefault(); G.scene.wheel(e.deltaY); } }, { passive: false });
    go('menu');
    requestAnimationFrame(t => { G.last = t; requestAnimationFrame(frame); });
  }

  return {
    G, init, go, openCraft, persist, resetSave,
    burst, floatText, drawButton, inBtn, roundRect, bg, topBar,
    // 便捷：给材料/星星等
    addMat(k, n) { G.save.mats[k] = (G.save.mats[k] || 0) + n; },
  };
})();
