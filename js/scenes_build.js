/* ===========================================================================
   场景：回收造物 / 装饰乐园 / 帐篷内部（多帐篷·多房间）
   世界摆放引擎：相机平移+缩放、双指旋转物品、昼夜/天气、河里小鸭小鱼、
   每顶帐篷=一个家(各有风格)，进去有 客厅/卧室/厨房/厕所 四个房间可布置。
   =========================================================================== */
(function () {
  const Eng = window.Game, G = Eng.G;
  const rr = Eng.roundRect, btn = Eng.drawButton, hit = Eng.inBtn;

  function canAfford(cost) { for (const k in cost) if ((G.save.mats[k] || 0) < cost[k]) return false; return true; }

  function topNav(scene, ctx, onBack) {
    const s = Math.max(40, G.H * 0.07), pad = 12;
    const b = { x: pad, y: pad, w: s, h: s, label: '◀', color: '#ff7675', fs: Math.round(s * 0.5), onTap: onBack || (() => Eng.go('menu')) };
    scene.buttons.push(b); btn(ctx, b);
  }

  /* =======================================================================
     场景：回收造物
     ======================================================================= */
  const craft = {};
  craft.scrollY = 0; craft._active = null; craft.dragScroll = null;
  craft.enter = function () { craft.scrollY = 0; Audio2.voice('craft_intro'); };
  craft.down = function (x, y) {
    craft._active = null; craft.dragScroll = { y, sy: craft.scrollY, moved: 0 };
    for (const b of craft.buttons) if (hit(b, x, y)) { b.pressed = true; craft._active = b; break; }
  };
  craft.move = function (x, y) {
    if (craft.dragScroll) {
      const dy = y - craft.dragScroll.y; craft.dragScroll.moved += Math.abs(dy);
      if (craft.dragScroll.moved > 8) { craft.scrollY = clampScroll(craft.dragScroll.sy + dy); if (craft._active) craft._active.pressed = false, craft._active = null; }
    }
  };
  craft.up = function (x, y) {
    const a = craft._active; craft.buttons.forEach(b => b.pressed = false); craft.dragScroll = null;
    if (a && hit(a, x, y) && a.onTap) { Audio2.sfx('click'); a.onTap(); }
    craft._active = null;
  };
  let craftMaxScroll = 0;
  function clampScroll(v) { return Math.max(-craftMaxScroll, Math.min(0, v)); }
  craft.wheel = function (dy) { craft.scrollY = clampScroll(craft.scrollY - dy); };
  craft.draw = function (ctx) {
    craft.buttons = [];
    Eng.bg(ctx, '#fff3d6', '#ffd9b0');
    const top = Eng.topBar(ctx);
    ctx.save(); ctx.beginPath(); ctx.rect(0, top + 4, G.W, G.H - top - 4); ctx.clip();

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + Math.round(G.H * 0.038) + 'px "PingFang SC",sans-serif';
    ctx.fillStyle = '#e67e22';
    const titleY = top + G.H * 0.05 + craft.scrollY;
    ctx.fillText('🔨 用回收材料造东西', G.W / 2, titleY);

    const items = Object.entries(DATA.ITEMS);
    const cols = G.W < 520 ? 2 : (G.W < 800 ? 3 : 4);
    const pad = 14, gap = 12;
    const cw = (G.W - pad * 2 - gap * (cols - 1)) / cols, ch = cw * 1.12;
    const startY = top + G.H * 0.09;
    items.forEach(([id, it], i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = pad + col * (cw + gap), y = startY + row * (ch + gap) + craft.scrollY;
      if (y > G.H || y + ch < top) return;
      const ok = canAfford(it.cost), built = G.save.built[id] || 0;
      Eng.softShadow(ctx, x + cw / 2, y + ch + 2, cw * 0.46, ch * 0.07, 0.16);
      const cardg = ctx.createLinearGradient(0, y, 0, y + ch); cardg.addColorStop(0, ok ? '#ffffff' : '#ededed'); cardg.addColorStop(1, ok ? '#fff6e6' : '#e4e4e4');
      rr(ctx, x, y, cw, ch, 16); ctx.fillStyle = cardg; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = ok ? '#f6b73c' : '#cfcfcf'; ctx.stroke();
      ctx.globalAlpha = ok ? 1 : 0.5;
      Sprites.draw(ctx, it.sprite, x + cw / 2, y + ch * 0.32, cw * 0.5);
      ctx.globalAlpha = 1;
      ctx.fillStyle = ok ? '#2d3436' : '#999'; ctx.textAlign = 'center';
      ctx.font = 'bold ' + Math.round(cw * 0.15) + 'px "PingFang SC",sans-serif';
      ctx.fillText(it.name + (built ? ' ×' + built : ''), x + cw / 2, y + ch * 0.6);
      const costs = Object.entries(it.cost); const iw = cw * 0.2;
      let tw = costs.length * iw, cx = x + cw / 2 - tw / 2 + iw / 2;
      costs.forEach(([m, n]) => {
        Sprites.draw(ctx, DATA.MATERIALS[m].icon, cx, y + ch * 0.74, iw * 0.95);
        ctx.fillStyle = (G.save.mats[m] || 0) >= n ? '#2d3436' : '#e74c3c';
        ctx.font = 'bold ' + Math.round(cw * 0.11) + 'px "PingFang SC",sans-serif';
        ctx.fillText('×' + n, cx + iw * 0.05, y + ch * 0.86);
        cx += iw;
      });
      const bw = cw * 0.7, bh = ch * 0.16, bx = x + (cw - bw) / 2, by = y + ch - bh - 6;
      const b = { x: bx, y: by, w: bw, h: bh, label: ok ? '做!' : '材料不够', color: ok ? '#27ae60' : '#bbb', disabled: !ok, fs: Math.round(bh * 0.55),
        onTap: () => doCraft(id, it, x + cw / 2, y + ch * 0.32) };
      craft.buttons.push(b); btn(ctx, b);
    });
    const rows = Math.ceil(items.length / cols);
    const bh = G.H * 0.09;
    craftMaxScroll = Math.max(0, startY + rows * (ch + gap) + bh + 30 - G.H);
    ctx.restore();

    if (craftMaxScroll > 4) {
      const trackY = top + 10, trackH = G.H - top - bh - 50, tx = G.W - 8;
      ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(180,140,90,.22)';
      ctx.beginPath(); ctx.moveTo(tx, trackY); ctx.lineTo(tx, trackY + trackH); ctx.stroke();
      const frac = -craft.scrollY / craftMaxScroll, thumbH = Math.max(40, trackH * 0.35);
      const thy = trackY + frac * (trackH - thumbH);
      ctx.strokeStyle = '#e6913a'; ctx.beginPath(); ctx.moveTo(tx, thy); ctx.lineTo(tx, thy + thumbH); ctx.stroke();
      if (frac < 0.9) { ctx.fillStyle = 'rgba(230,126,34,.8)'; ctx.textAlign = 'center'; ctx.font = 'bold ' + Math.round(G.H * 0.026) + 'px "PingFang SC",sans-serif'; ctx.fillText('↓ 下滑看更多 ↓', G.W / 2, G.H - bh - 40); }
    }

    const barY = G.H - bh - 26;
    const bgr = ctx.createLinearGradient(0, barY, 0, G.H);
    bgr.addColorStop(0, 'rgba(255,217,176,0)'); bgr.addColorStop(0.45, '#ffd9b0'); bgr.addColorStop(1, '#ffcf9f');
    ctx.fillStyle = bgr; ctx.fillRect(0, barY, G.W, G.H - barY);

    const ngap = 12, bw = Math.min(G.W * 0.4, 300), sx = (G.W - (bw * 2 + ngap)) / 2, byb = G.H - bh - 10;
    const goO = { x: sx, y: byb, w: bw, h: bh, label: '🌊 去大海', color: '#2e86de', fs: Math.round(bh * 0.34), onTap: () => Eng.go('ocean', DATA.LEVELS[0]) };
    const goP = { x: sx + bw + ngap, y: byb, w: bw, h: bh, label: '🏡 去布置乐园', color: '#27ae60', fs: Math.round(bh * 0.34), onTap: () => Eng.go('park') };
    craft.buttons.push(goO, goP); btn(ctx, goO); btn(ctx, goP);
    const rt = G.returnTo || 'menu';
    const lbl = rt === 'ocean' ? '◀ 回大海' : (rt === 'park' ? '◀ 回乐园' : (rt === 'tent' ? '◀ 回帐篷' : '◀'));
    const s = Math.max(40, G.H * 0.07);
    const back = { x: 12, y: 12, w: rt === 'menu' ? s : s * 2.6, h: s, label: lbl, color: '#ff7675', fs: Math.round(s * 0.4), onTap: () => Eng.go(rt) };
    craft.buttons.push(back); btn(ctx, back);
  };
  function doCraft(id, it, fxX, fxY) {
    if (!canAfford(it.cost)) { Audio2.voice('need_mat'); return; }
    for (const k in it.cost) G.save.mats[k] -= it.cost[k];
    G.save.built[id] = (G.save.built[id] || 0) + 1;
    Eng.persist(); Audio2.sfx('build'); Eng.burst(fxX, fxY, '#feca57', 16);
    Eng.floatText(fxX, fxY - 20, '造好了 ' + it.name + '!', '#27ae60');
    Audio2.voice('built');
  }

  /* =======================================================================
     共用：人气结算 / 访客条 / Ada 公主
     ======================================================================= */
  function recomputePop(silent) {
    let pop = 0;
    G.save.placed.forEach(p => { pop += (DATA.ITEMS[p.item] ? DATA.ITEMS[p.item].charm : 0); });
    for (const hid in G.save.homes) for (const rm in G.save.homes[hid].rooms) G.save.homes[hid].rooms[rm].forEach(p => { pop += (DATA.ITEMS[p.item] ? DATA.ITEMS[p.item].charm : 0); });
    G.save.popularity = pop;
    DATA.VISITORS.forEach(v => {
      if (pop >= v.need && !G.save.visitors[v.id]) {
        G.save.visitors[v.id] = true;
        if (!silent) { Audio2.sfx('visitor'); Eng.floatText(G.W / 2, G.H * 0.3, v.name + '来玩啦! 🎉', '#27ae60'); Audio2.voice('visitor'); }
      }
    });
    Eng.persist();
  }
  function VISBAR_RIGHT() { return Math.min(G.W * 0.2, 156) * 2 + 34; }
  function drawVisitorBar(ctx) {
    const s = Math.max(46, G.H * 0.075), pad = 10, y = 12, h = G.H * 0.075;
    const bx = pad + s * 3 + 24;
    const bw = G.W - bx - VISBAR_RIGHT();
    rr(ctx, bx, y, Math.max(120, bw), h, 14); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + Math.round(h * 0.42) + 'px "PingFang SC",sans-serif'; ctx.fillStyle = '#e67e22';
    ctx.fillText('🌟人气 ' + G.save.popularity, bx + 12, y + h / 2);
    let vx = bx + 12 + h * 2.4;
    DATA.VISITORS.forEach(v => {
      const has = G.save.visitors[v.id];
      ctx.globalAlpha = has ? 1 : 0.35; Sprites.draw(ctx, v.sprite, vx + h * 0.4, y + h / 2, h * 0.8); ctx.globalAlpha = 1;
      if (!has) { ctx.fillStyle = '#888'; ctx.font = 'bold ' + Math.round(h * 0.3) + 'px "PingFang SC",sans-serif'; ctx.fillText(v.need, vx + h * 0.4, y + h * 0.82); }
      vx += h * 0.95;
    });
  }
  function drawAda(ctx, x, y, size, face, hop) {
    const t = G.t, bob = Math.sin(t * 2) * size * 0.05;
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(x, y + size * 0.42, size * 0.3, size * 0.1, 0, 0, 7); ctx.fill();
    ctx.save();
    if (face === -1) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    if (window.Princess) Princess.draw(ctx, x, y + bob - (hop || 0), size, t, {});
    else Sprites.draw(ctx, 'ada', x, y + bob - (hop || 0), size);
    ctx.restore();
    const lw = size * 0.82, lh = size * 0.2, lx = x - lw / 2, ly = y + size * 0.44;
    rr(ctx, lx, ly, lw, lh, lh * 0.5); ctx.fillStyle = '#fff6fb'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#e84393'; ctx.stroke();
    ctx.fillStyle = '#e84393'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(lh * 0.62) + 'px "PingFang SC",sans-serif';
    ctx.fillText('👑 Ada 公主', x, ly + lh / 2 + 1);
  }
  // 公主所在位置：从天而降的飘雪（冰雪公主光环）
  function drawAdaSnow(ctx, x, y, size, t) {
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.92)';
    for (let i = 0; i < 18; i++) {
      const seed = i * 0.61803, fall = (t * 0.13 + seed) % 1;
      const fx = x + ((seed * 7.3 % 1.8) - 0.9) * size + Math.sin(t * 1.2 + i) * size * 0.05;
      const fy = y - size * 0.85 + fall * size * 1.5;
      const a = Math.sin(fall * Math.PI);
      ctx.globalAlpha = 0.85 * a; ctx.beginPath(); ctx.arc(fx, fy, size * 0.018 * (0.7 + (i % 3) * 0.3), 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  // 夜空烟花
  function drawFireworks(ctx, S) {
    (S.fw || []).forEach(p => {
      if (p.type === 'rocket') { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + 22); ctx.stroke(); }
      else { const k = 1 - p.age / p.life; ctx.save(); ctx.globalAlpha = Math.max(0, k); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 5 * k + 1.5, 0, 7); ctx.fill(); ctx.restore(); }
    });
  }

  /* =======================================================================
     世界背景：乐园(昼夜/天气/河流小鸭小鱼) / 帐篷房间(风格+功能)
     ======================================================================= */
  function cloud2(ctx, x, y, r) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.arc(x + r, y + r * 0.2, r * 0.8, 0, 7); ctx.arc(x - r, y + r * 0.2, r * 0.8, 0, 7); ctx.fill(); }
  function flower(ctx, x, y, r, c) { for (let k = 0; k < 5; k++) { const a = k * 1.2566; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.72, 0, 7); ctx.fillStyle = c; ctx.fill(); } ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, 7); ctx.fillStyle = '#fff3a0'; ctx.fill(); }
  function grassTuft(ctx, x, y, h) { ctx.strokeStyle = '#4ca64c'; ctx.lineWidth = h * 0.16; ctx.lineCap = 'round'; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * h * 0.18, y); ctx.quadraticCurveTo(x + k * h * 0.42, y - h * 0.7, x + k * h * 0.55, y - h); ctx.stroke(); } }

  const SEASON_SKY = [['#bfe8ff', '#e9f8ec'], ['#9fd8ff', '#dff6ec'], ['#d6e6ee', '#f4ead4'], ['#cfe0ea', '#eef4f6']];
  const SEASON_GRASS = [['#bfe86a', '#8fcf52'], ['#a6e36a', '#79c047'], ['#d8c46a', '#b89a48'], ['#e3eef0', '#c3d6dc']];
  const SEASON_HILL = ['#9ad27a', '#9ad27a', '#c4ab58', '#d3e4e8'];
  // —— AI 背景图懒加载（放 assets/sprites/park_bg.png / room_<房间>.png 自动启用）——
  let PARK_IMG = null, _parkTried = false;
  function parkImg() { if (_parkTried) return PARK_IMG; _parkTried = true; if (typeof Image === 'undefined') return null; const im = new Image(); im.onload = () => PARK_IMG = im; im.onerror = () => {}; im.src = 'assets/sprites/park_bg.png'; return null; }
  const ROOM_IMG = {}, _roomTried = {};
  function roomImg(room) { if (_roomTried[room]) return ROOM_IMG[room] || null; _roomTried[room] = true; if (typeof Image === 'undefined') return null; const im = new Image(); im.onload = () => ROOM_IMG[room] = im; im.onerror = () => {}; im.src = 'assets/sprites/room_' + room + '.png'; return null; }
  function drawRiverLife(ctx, S) {
    (S.river || []).forEach(d => { const yy = d.y + Math.sin(d.ph * 2) * 6; ctx.save(); ctx.translate(d.x, yy); if (d.vx < 0) ctx.scale(-1, 1); if (d.kind === 'duck') Sprites.draw(ctx, 'c_duck', 0, 0, 72); else if (window.Marine) Marine.fish(ctx, 0, 0, 52, G.t, d.ph, { body: d.col, fin: d.fin }); ctx.restore(); });
  }
  function drawParkRiver(ctx, WW, WH, night) {
    const rw = WH * 0.11; ctx.lineCap = 'round';
    ctx.strokeStyle = night ? '#2a5578' : '#62bce4'; ctx.lineWidth = rw;
    ctx.beginPath(); for (let x = -80; x <= WW + 80; x += WW / 30) { const y = WH * 0.5 + Math.sin(x / WW * 6.283) * WH * 0.12; x <= -80 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = rw * 0.16;
    ctx.beginPath(); for (let x = -80; x <= WW + 80; x += WW / 30) { const y = WH * 0.5 + Math.sin(x / WW * 6.283) * WH * 0.12 - rw * 0.28; x <= -80 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  }
  function drawLake(ctx, l, night, t) {
    const cx = l.cx, cy = l.cy, rx = l.rx, ry = l.ry;
    ctx.fillStyle = night ? '#3a5a44' : '#8ec06e'; ctx.beginPath(); ctx.ellipse(cx, cy, rx + 22, ry + 22, 0, 0, 7); ctx.fill();          // 草岸
    ctx.fillStyle = night ? '#57795f' : '#e3d29a'; ctx.beginPath(); ctx.ellipse(cx, cy, rx + 11, ry + 11, 0, 0, 7); ctx.fill();          // 沙滩
    const wg = ctx.createRadialGradient(cx, cy - ry * 0.3, ry * 0.2, cx, cy, rx * 1.1);
    if (night) { wg.addColorStop(0, '#2f5578'); wg.addColorStop(1, '#193a58'); } else { wg.addColorStop(0, '#9fe0f4'); wg.addColorStop(1, '#3f9ad2'); }
    ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = Math.max(2, ry * 0.028);
    for (let i = 0; i < 4; i++) { const yy = cy - ry * 0.5 + i * ry * 0.32; ctx.beginPath(); ctx.ellipse(cx + Math.sin(t * 0.5 + i) * rx * 0.08, yy, rx * (0.55 - i * 0.09), ry * 0.05, 0, 0, 7); ctx.stroke(); }
    ctx.fillStyle = night ? '#2e5a3e' : '#37b06f'; for (let i = 0; i < 4; i++) { const a = i * 1.7 + cx * 0.01, lx = cx + Math.cos(a) * rx * 0.55, ly = cy + Math.sin(a) * ry * 0.55; ctx.beginPath(); ctx.ellipse(lx, ly, ry * 0.13, ry * 0.11, 0, 0, 7); ctx.fill(); }   // 睡莲
    ctx.restore();
  }
  function parkWorldBg(ctx, WW, WH, S) {
    const night = G.save.night, season = (G.save.season | 0) % 4;
    // 俯视大花园：整片草地 + 多个湖泊水域 + 装饰
    const GR = SEASON_GRASS[season], im = WW * 0.085, iy = WH * 0.12;
    // 底层：环绕整个地图的水
    const wg = ctx.createLinearGradient(0, 0, 0, WH); if (night) { wg.addColorStop(0, '#1f4763'); wg.addColorStop(1, '#16374f'); } else { wg.addColorStop(0, '#7fd0ee'); wg.addColorStop(1, '#4aa8d8'); }
    ctx.fillStyle = wg; ctx.fillRect(0, 0, WW, WH);
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 6; for (let i = 0; i < 80; i++) { const x = (i * 373) % WW, y = (i * 547) % WH; if (x < im || x > WW - im || y < iy || y > WH - iy) { ctx.beginPath(); ctx.ellipse(x + Math.sin(G.t * 0.5 + i) * 8, y, 42, 11, 0, 0, 7); ctx.stroke(); } }
    // 沙滩岸
    ctx.fillStyle = night ? '#57795f' : '#e7d59c'; rr(ctx, im - 24, iy - 24, WW - 2 * im + 48, WH - 2 * iy + 48, 150); ctx.fill();
    // 草地岛
    const gg = ctx.createLinearGradient(0, iy, 0, WH - iy); if (night) { gg.addColorStop(0, '#3f6b47'); gg.addColorStop(1, '#2b4d33'); } else { gg.addColorStop(0, GR[0]); gg.addColorStop(1, GR[1]); }
    rr(ctx, im, iy, WW - 2 * im, WH - 2 * iy, 130); ctx.fillStyle = gg; ctx.fill();
    ctx.save(); rr(ctx, im, iy, WW - 2 * im, WH - 2 * iy, 130); ctx.clip();
    ctx.fillStyle = night ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.06)'; for (let i = 0; i < 150; i++) { const x = (i * 337.7) % WW, y = (i * 521.3) % WH; ctx.beginPath(); ctx.ellipse(x, y, 70, 34, 0, 0, 7); ctx.fill(); }
    drawParkRiver(ctx, WW, WH, night);
    ctx.restore();
    drawRiverLife(ctx, S);
    (S.ambient || []).forEach(a => { if (a.kind === 'flower') flower(ctx, a.x, a.y, a.r, a.c); else if (a.kind === 'grass') grassTuft(ctx, a.x, a.y, a.h); else { ctx.fillStyle = '#9aa7b5'; ctx.beginPath(); ctx.ellipse(a.x, a.y, a.r, a.r * 0.7, 0, 0, 7); ctx.fill(); } });
    if (!night) { if (season === 3) { ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 130; i++) { const x = (i * 231) % WW, y = (i * 97) % WH; ctx.beginPath(); ctx.ellipse(x, y, 30, 12, 0, 0, 7); ctx.fill(); } } else { const tint = ['rgba(255,120,175,.08)', null, 'rgba(235,150,50,.12)', null][season]; if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, WW, WH); } } }
    else { ctx.fillStyle = 'rgba(16,24,52,.42)'; ctx.fillRect(0, 0, WW, WH); ctx.fillStyle = '#fdf6c0'; ctx.beginPath(); ctx.arc(WW * 0.9, WH * 0.09, WH * 0.03, 0, 7); ctx.fill(); }
    return;
    // eslint-disable-next-line
    const sky = ctx.createLinearGradient(0, 0, 0, WH * 0.44);
    if (night) { sky.addColorStop(0, '#16223f'); sky.addColorStop(1, '#33456a'); }
    else { sky.addColorStop(0, SEASON_SKY[season][0]); sky.addColorStop(1, SEASON_SKY[season][1]); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WW, WH * 0.44);
    if (night) {
      ctx.fillStyle = '#fdf6c0'; ctx.beginPath(); ctx.arc(WW * 0.82, WH * 0.1, WH * 0.045, 0, 7); ctx.fill();
      ctx.fillStyle = '#1a2742'; ctx.beginPath(); ctx.arc(WW * 0.835, WH * 0.088, WH * 0.04, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; for (let i = 0; i < 46; i++) { const x = (i * 167.3) % WW, y = (i * 51.7) % (WH * 0.4); ctx.globalAlpha = 0.4 + 0.5 * Math.abs(Math.sin(G.t * 1.5 + i)); ctx.fillRect(x, y, 2.4, 2.4); } ctx.globalAlpha = 1;
    } else { ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(WW * 0.82, WH * 0.1, WH * 0.05, 0, 7); ctx.fill(); }
    for (let i = 0; i < 3; i++) cloud2(ctx, (WW * (0.14 + i * 0.22) + Math.sin(G.t * 0.08 + i) * 30) % WW, WH * (0.08 + (i % 2) * 0.05), WH * 0.032);
    ctx.fillStyle = night ? '#3c5a48' : SEASON_HILL[season]; for (let i = 0; i < 5; i++) { const cx = WW * (0.08 + i * 0.22); ctx.beginPath(); ctx.moveTo(cx - WW * 0.16, WH * 0.44); ctx.quadraticCurveTo(cx, WH * 0.44 - WH * 0.14, cx + WW * 0.16, WH * 0.44); ctx.fill(); }
    const gr = ctx.createLinearGradient(0, WH * 0.42, 0, WH); if (night) { gr.addColorStop(0, '#4f8a4a'); gr.addColorStop(1, '#356030'); } else { gr.addColorStop(0, SEASON_GRASS[season][0]); gr.addColorStop(1, SEASON_GRASS[season][1]); } ctx.fillStyle = gr; ctx.fillRect(0, WH * 0.42, WW, WH * 0.58);
    if (season === 3 && !night) { ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 42; i++) { const x = (i * 231) % WW, y = WH * 0.46 + (i * 97) % (WH * 0.48); ctx.beginPath(); ctx.ellipse(x, y, 28, 11, 0, 0, 7); ctx.fill(); } }
    // 河流
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = night ? '#3a6b8a' : '#6fc3e8'; ctx.lineWidth = WH * 0.075; ctx.beginPath(); ctx.moveTo(-30, riverY); ctx.bezierCurveTo(WW * 0.28, riverY - WH * 0.07, WW * 0.5, riverY + WH * 0.13, WW * 0.74, riverY); ctx.lineTo(WW + 30, riverY + WH * 0.05); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = WH * 0.013; ctx.beginPath(); ctx.moveTo(-30, riverY - WH * 0.02); ctx.bezierCurveTo(WW * 0.28, riverY - WH * 0.09, WW * 0.5, riverY + WH * 0.11, WW * 0.74, riverY - WH * 0.02); ctx.lineTo(WW + 30, riverY + WH * 0.03); ctx.stroke();
    ctx.restore();
    // 河里小鸭/小鱼
    (S.river || []).forEach(d => { const yy = d.y + Math.sin(d.ph * 2) * 6; if (d.kind === 'duck') { ctx.save(); ctx.translate(d.x, yy); if (d.vx < 0) ctx.scale(-1, 1); Sprites.draw(ctx, 'c_duck', 0, 0, 72); ctx.restore(); } else if (window.Marine) { ctx.save(); ctx.translate(d.x, yy); if (d.vx < 0) ctx.scale(-1, 1); Marine.fish(ctx, 0, 0, 52, G.t, d.ph, { body: d.col, fin: d.fin }); ctx.restore(); } });
    // 小路
    ctx.strokeStyle = night ? '#9c895f' : '#f0d9a8'; ctx.lineWidth = WH * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(WW * 0.5, WH); ctx.quadraticCurveTo(WW * 0.42, WH * 0.62, WW * 0.56, WH * 0.46); ctx.stroke();
    // 花草石
    (S.ambient || []).forEach(a => { if (a.kind === 'flower') flower(ctx, a.x, a.y, a.r, a.c); else if (a.kind === 'grass') grassTuft(ctx, a.x, a.y, a.h); else { ctx.fillStyle = '#9aa7b5'; ctx.beginPath(); ctx.ellipse(a.x, a.y, a.r, a.r * 0.7, 0, 0, 7); ctx.fill(); } });
    if (night) { ctx.fillStyle = 'rgba(20,30,60,.3)'; ctx.fillRect(0, 0, WW, WH); }
  }

  const HOME_STYLES = [
    { wall: ['#ffe9c7', '#eebd86'], floor: ['#caa066', '#a87f48'], accent: '#df7a7a' },
    { wall: ['#ffe0ec', '#ffc1d8'], floor: ['#e7c08a', '#cfa066'], accent: '#ff9fc0' },
    { wall: ['#dff0ff', '#bcdcf5'], floor: ['#cdb89a', '#a89372'], accent: '#7fc7f0' },
    { wall: ['#e8f6df', '#c7ebbf'], floor: ['#d2b07a', '#b48f54'], accent: '#7fd99a' },
  ];
  // —— 房间内置家具（厚涂质感）——
  function rbox(ctx, x, y, w, h, r, c1, c2) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2); rr(ctx, x, y, w, h, r); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(2, w * 0.008); ctx.strokeStyle = 'rgba(60,40,25,.35)'; ctx.stroke(); }
  function rwin(ctx, x, y, w, h) { rbox(ctx, x - w / 2, y, w, h, 8, '#bfe9ff', '#8fd0f5'); ctx.fillStyle = '#fff6b8'; ctx.beginPath(); ctx.arc(x + w * 0.22, y + h * 0.3, h * 0.16, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.moveTo(x - w / 2, y + h / 2); ctx.lineTo(x + w / 2, y + h / 2); ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = '#cdb089'; rr(ctx, x - w / 2, y, w, h, 8); ctx.stroke(); }
  function rpic(ctx, x, y, w, h, col) { rbox(ctx, x - w / 2, y, w, h, 4, '#fff', '#f0f0f0'); ctx.lineWidth = 5; ctx.strokeStyle = '#b98a5c'; rr(ctx, x - w / 2, y, w, h, 4); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y + h * 0.5, h * 0.24, 0, 7); ctx.fill(); }
  function rrug(ctx, cx, cy, rw, rh, c1, c2) { ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(cx, cy, rw, rh, 0, 0, 7); ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(cx, cy, rw * 0.72, rh * 0.72, 0, 0, 7); ctx.fill(); ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(cx, cy, rw * 0.44, rh * 0.44, 0, 0, 7); ctx.fill(); }

  function tentRoomBg(ctx, WW, WH, S) {
    const home = G.save.homes[S.homeId] || G.save.homes['1'], st = HOME_STYLES[(home.style || 0) % HOME_STYLES.length], room = S.room || 'living', fY = WH * 0.6;
    const _rimg = ROOM_IMG[room] || roomImg(room);
    if (_rimg) { ctx.drawImage(_rimg, 0, 0, WW, WH); return; }   // AI 房间背景图（空房间，不预置家具）
    // 无图时：简洁的墙 + 地板，不放任何家具（玩家自己摆）
    const wg = ctx.createLinearGradient(0, 0, 0, fY); wg.addColorStop(0, st.wall[0]); wg.addColorStop(1, st.wall[1]); ctx.fillStyle = wg; ctx.fillRect(0, 0, WW, fY);
    const fg = ctx.createLinearGradient(0, fY, 0, WH); fg.addColorStop(0, st.floor[0]); fg.addColorStop(1, st.floor[1]); ctx.fillStyle = fg; ctx.fillRect(0, fY, WW, WH - fY);
    ctx.fillStyle = 'rgba(120,80,40,.3)'; ctx.fillRect(0, fY - 10, WW, 10);
    return;

    if (room === 'living') {
      rwin(ctx, WW * 0.5, fY - WH * 0.34, WW * 0.22, WH * 0.2);
      rpic(ctx, WW * 0.24, fY - WH * 0.32, WW * 0.07, WH * 0.1, '#ffb6c1'); rpic(ctx, WW * 0.76, fY - WH * 0.32, WW * 0.07, WH * 0.1, '#7fc7f0');
      rrug(ctx, WW * 0.5, fY + (WH - fY) * 0.55, WW * 0.3, WH * 0.12, st.accent, '#fff1f1');
      const sx = WW * 0.22, sw = WW * 0.26, sb = fY + WH * 0.05, sh = WH * 0.12;
      rbox(ctx, sx - sw / 2, sb - sh, sw, sh * 0.7, 14, '#ff9f7a', '#e8714a');
      rbox(ctx, sx - sw / 2, sb - sh * 0.55, sw, sh * 0.6, 16, '#ffb699', '#f08a64');
      rbox(ctx, sx - sw / 2 - sw * 0.05, sb - sh * 0.7, sw * 0.12, sh * 0.8, 8, '#ff9f7a', '#e8714a'); rbox(ctx, sx + sw / 2 - sw * 0.07, sb - sh * 0.7, sw * 0.12, sh * 0.8, 8, '#ff9f7a', '#e8714a');
      const tx = WW * 0.76, tw = WW * 0.2;
      rbox(ctx, tx - tw / 2, fY + WH * 0.02, tw, WH * 0.05, 6, '#b98a5c', '#9c6b3f');
      rbox(ctx, tx - tw * 0.42, fY - WH * 0.13, tw * 0.84, WH * 0.13, 8, '#3a3f47', '#23262b');
      ctx.fillStyle = '#7fd2ff'; rr(ctx, tx - tw * 0.36, fY - WH * 0.115, tw * 0.72, WH * 0.1, 4); ctx.fill();
      const bx = WW * 0.93, bw = WW * 0.09, bh = WH * 0.26; rbox(ctx, bx - bw / 2, fY - bh, bw, bh, 6, '#c8965e', '#a8753e');
      const bc = ['#ff6b6b', '#54a0ff', '#1dd1a1', '#feca57', '#ff9ff3']; for (let r2 = 0; r2 < 4; r2++) { const sy = fY - bh + WH * 0.02 + r2 * (bh / 4); for (let b = 0; b < 5; b++) { ctx.fillStyle = bc[(r2 + b) % 5]; ctx.fillRect(bx - bw / 2 + 6 + b * (bw - 12) / 5, sy, (bw - 12) / 5 - 2, bh / 4 - WH * 0.018); } }
      ctx.strokeStyle = '#9aa7b5'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(WW * 0.06, fY + WH * 0.06); ctx.lineTo(WW * 0.06, fY - WH * 0.16); ctx.stroke(); rbox(ctx, WW * 0.06 - WW * 0.035, fY - WH * 0.2, WW * 0.07, WH * 0.05, 6, '#fff3b0', '#ffd86b');
    } else if (room === 'bedroom') {
      ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 14; i++) { const x = (i * 173.7) % WW, y = (i * 71.3) % (fY * 0.6); ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); }
      rwin(ctx, WW * 0.82, fY - WH * 0.34, WW * 0.18, WH * 0.2);
      rrug(ctx, WW * 0.32, fY + (WH - fY) * 0.62, WW * 0.26, WH * 0.1, '#a6d8ff', '#e6f4ff');
      const bx = WW * 0.27, bw = WW * 0.34, bb = fY + WH * 0.07, bh = WH * 0.1;
      rbox(ctx, bx - bw / 2, bb - bh - WH * 0.13, bw * 0.18, WH * 0.19, 8, '#c8965e', '#a8753e');
      rbox(ctx, bx - bw / 2, bb - bh, bw, bh, 8, '#b98a5c', '#9c6b3f');
      rbox(ctx, bx - bw / 2 + bw * 0.04, bb - bh - WH * 0.03, bw * 0.94, WH * 0.05, 10, '#ffd9e6', '#ff9fc0');
      rbox(ctx, bx - bw / 2 + bw * 0.06, bb - bh - WH * 0.058, bw * 0.22, WH * 0.04, 8, '#fff', '#eef2f7');
      const nx = WW * 0.5; rbox(ctx, nx - WW * 0.04, fY - WH * 0.02, WW * 0.08, WH * 0.08, 6, '#c8965e', '#a8753e'); rbox(ctx, nx - WW * 0.025, fY - WH * 0.075, WW * 0.05, WH * 0.055, 6, '#fff3b0', '#ffd86b');
      const wx = WW * 0.86, ww = WW * 0.16, wh = WH * 0.3; rbox(ctx, wx - ww / 2, fY - wh, ww, wh, 8, '#d6a96a', '#b3824a'); ctx.strokeStyle = 'rgba(80,50,20,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx, fY - wh + 8); ctx.lineTo(wx, fY - 8); ctx.stroke(); ctx.fillStyle = '#5e4126'; ctx.beginPath(); ctx.arc(wx - ww * 0.08, fY - wh * 0.5, 6, 0, 7); ctx.arc(wx + ww * 0.08, fY - wh * 0.5, 6, 0, 7); ctx.fill();
    } else if (room === 'kitchen') {
      const tg = ctx.createLinearGradient(0, 0, 0, fY); tg.addColorStop(0, '#eaf3f7'); tg.addColorStop(1, '#d4e4ea'); ctx.fillStyle = tg; ctx.fillRect(0, fY * 0.32, WW, fY - fY * 0.32);
      ctx.strokeStyle = 'rgba(150,175,190,.5)'; ctx.lineWidth = 2; for (let yy = fY * 0.32; yy < fY; yy += WH * 0.045) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(WW, yy); ctx.stroke(); } for (let xx = 0; xx <= WW; xx += WW * 0.045) { ctx.beginPath(); ctx.moveTo(xx, fY * 0.32); ctx.lineTo(xx, fY); ctx.stroke(); }
      rwin(ctx, WW * 0.5, fY - WH * 0.36, WW * 0.16, WH * 0.16);
      rbox(ctx, WW * 0.06, fY - WH * 0.34, WW * 0.34, WH * 0.1, 6, '#ffd9a8', '#e9b878'); rbox(ctx, WW * 0.62, fY - WH * 0.34, WW * 0.3, WH * 0.1, 6, '#ffd9a8', '#e9b878');
      const cy = fY - WH * 0.04; rbox(ctx, 0, cy, WW, WH * 0.13, 0, '#ffe2b8', '#e6b878');
      ctx.fillStyle = '#cfd8df'; ctx.fillRect(0, cy - WH * 0.014, WW, WH * 0.018);
      ctx.strokeStyle = 'rgba(120,80,40,.35)'; ctx.lineWidth = 2; for (let xx = WW * 0.08; xx < WW; xx += WW * 0.12) { ctx.beginPath(); ctx.moveTo(xx, cy); ctx.lineTo(xx, fY + WH * 0.09); ctx.stroke(); ctx.fillStyle = '#9c6b3f'; ctx.fillRect(xx - WW * 0.012, cy + WH * 0.02, WW * 0.024, 6); }
      ctx.fillStyle = '#b9c2cc'; rr(ctx, WW * 0.16, cy - WH * 0.008, WW * 0.1, WH * 0.032, 4); ctx.fill(); ctx.strokeStyle = '#9aa7b5'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(WW * 0.21, cy - WH * 0.008); ctx.lineTo(WW * 0.21, cy - WH * 0.05); ctx.quadraticCurveTo(WW * 0.21, cy - WH * 0.066, WW * 0.2, cy - WH * 0.06); ctx.stroke();
      const stx = WW * 0.42; ctx.fillStyle = '#3a3f47'; rr(ctx, stx, cy - WH * 0.012, WW * 0.16, WH * 0.026, 4); ctx.fill(); ctx.fillStyle = '#1b1e22'; for (let a = 0; a < 4; a++) { ctx.beginPath(); ctx.arc(stx + WW * 0.03 + (a % 2) * WW * 0.08, cy - WH * 0.002 + Math.floor(a / 2) * WH * 0.012, WW * 0.018, 0, 7); ctx.fill(); }
      const rx = WW * 0.93, rw = WW * 0.12, rh = WH * 0.34; rbox(ctx, rx - rw / 2, fY - rh, rw, rh, 10, '#eef3f7', '#cdd8df'); ctx.strokeStyle = 'rgba(120,140,160,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rx - rw / 2 + 6, fY - rh * 0.62); ctx.lineTo(rx + rw / 2 - 6, fY - rh * 0.62); ctx.stroke(); ctx.fillStyle = '#9aa7b5'; ctx.fillRect(rx + rw * 0.26, fY - rh * 0.55, 6, rh * 0.3); ctx.fillRect(rx + rw * 0.26, fY - rh * 0.9, 6, rh * 0.22);
    } else if (room === 'bathroom') {
      const bgt = ctx.createLinearGradient(0, 0, 0, fY); bgt.addColorStop(0, '#dff1fb'); bgt.addColorStop(1, '#c3e2f0'); ctx.fillStyle = bgt; ctx.fillRect(0, 0, WW, fY);
      ctx.strokeStyle = 'rgba(150,190,215,.55)'; ctx.lineWidth = 2; for (let xx = 0; xx <= WW; xx += WW * 0.05) { ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx, fY); ctx.stroke(); } for (let yy = 0; yy <= fY; yy += WH * 0.05) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(WW, yy); ctx.stroke(); }
      ctx.fillStyle = '#eef8fc'; ctx.fillRect(0, fY, WW, WH - fY);
      rwin(ctx, WW * 0.5, fY - WH * 0.36, WW * 0.14, WH * 0.14);
      const bx = WW * 0.76, bw = WW * 0.26; rbox(ctx, bx - bw / 2, fY - WH * 0.02, bw, WH * 0.12, 24, '#ffffff', '#dceaf2'); ctx.fillStyle = '#bfe4f5'; rr(ctx, bx - bw / 2 + bw * 0.06, fY - WH * 0.005, bw * 0.88, WH * 0.05, 18); ctx.fill(); ctx.strokeStyle = '#9aa7b5'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(bx + bw / 2 - bw * 0.06, fY - WH * 0.02); ctx.lineTo(bx + bw / 2 - bw * 0.06, fY - WH * 0.07); ctx.stroke();
      const tx = WW * 0.18; rbox(ctx, tx - WW * 0.055, fY - WH * 0.14, WW * 0.11, WH * 0.1, 10, '#fff', '#e6eef3'); rbox(ctx, tx - WW * 0.05, fY - WH * 0.05, WW * 0.1, WH * 0.11, 10, '#fff', '#dfeaf0'); ctx.fillStyle = '#cfe0e8'; ctx.beginPath(); ctx.ellipse(tx, fY - WH * 0.05, WW * 0.045, WH * 0.022, 0, 0, 7); ctx.fill();
      const sx = WW * 0.44; rbox(ctx, sx - WW * 0.06, fY - WH * 0.05, WW * 0.12, WH * 0.1, 8, '#e8eef3', '#c8d6de'); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(sx, fY - WH * 0.05, WW * 0.04, WH * 0.016, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#bfe9ff'; ctx.beginPath(); ctx.arc(sx, fY - WH * 0.2, WW * 0.05, 0, 7); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#cdb089'; ctx.stroke();
      ctx.strokeStyle = '#cdb089'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(WW * 0.62, fY - WH * 0.22); ctx.lineTo(WW * 0.72, fY - WH * 0.22); ctx.stroke(); rbox(ctx, WW * 0.64, fY - WH * 0.21, WW * 0.06, WH * 0.08, 4, '#ffd0d0', '#ff9fb0');
    }
    const rg = ctx.createRadialGradient(WW * 0.5, WH * 0.2, 0, WW * 0.5, WH * 0.2, WH * 0.62); rg.addColorStop(0, 'rgba(255,242,190,.25)'); rg.addColorStop(1, 'rgba(255,242,190,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, WW, WH);
  }

  /* =======================================================================
     世界摆放引擎
     ======================================================================= */
  function makePlacement(opts) {
    const S = { buttons: [], cam: { s: 1, x: 0, y: 0 }, homeId: '1', room: 'living' };
    const WW = opts.worldW, WH = opts.worldH;
    const listArr = () => (opts.listArr ? opts.listArr(S) : G.save[opts.listKey]);
    function isHome(p) { return !!(p.base || (DATA.ITEMS[p.item] && DATA.ITEMS[p.item].home)); }
    function trayItems() { return Object.keys(DATA.ITEMS).filter(id => (G.save.built[id] || 0) > 0); }
    function groundTop() { return Math.max(46, G.H * 0.075) + 10 + G.H * 0.08; }
    function trayTop() { return G.H - G.H * 0.18; }
    function vTop() { return groundTop(); }
    function vBot() { return trayTop(); }
    function baseS() { return 150; }
    function dispS(item) { const it = DATA.ITEMS[item]; return baseS() * (it && it.scale ? it.scale : 1); }
    function dsp(p) { return dispS(p.item) * (p.base ? 1.35 : 1); }
    function surfaceTopY(p) { return p.y - dispS(p.item) * 0.16; }
    function childrenOf(id) { return listArr().filter(c => c.onId === id); }

    function sMin() { return Math.max(G.W / WW, (vBot() - vTop()) / WH); }
    function clampCam() { S.cam.s = Math.max(sMin(), Math.min(sMin() * 3.4, S.cam.s)); const s = S.cam.s; S.cam.x = Math.max(G.W - WW * s, Math.min(0, S.cam.x)); S.cam.y = Math.max(vBot() - WH * s, Math.min(vTop(), S.cam.y)); }
    function s2w(x, y) { return { x: (x - S.cam.x) / S.cam.s, y: (y - S.cam.y) / S.cam.s }; }
    function zoomAt(sx, sy, f) { const w = s2w(sx, sy); S.cam.s = Math.max(sMin(), Math.min(sMin() * 3.4, S.cam.s * f)); S.cam.x = sx - w.x * S.cam.s; S.cam.y = sy - w.y * S.cam.s; clampCam(); }
    function homePos() { const base = listArr().find(p => p.base); return base ? { x: base.x, y: base.y } : { x: WW / 2, y: WH * 0.6 }; }
    function centerCam() { S.cam.s = sMin(); const h = { x: WW / 2, y: WH / 2 }; S.cam.x = G.W / 2 - h.x * S.cam.s; S.cam.y = (vTop() + vBot()) / 2 - h.y * S.cam.s; clampCam(); }

    function ensureBase() { if (!opts.base || listArr().some(p => p.base)) return; listArr().unshift({ id: G.save.placeSeq++, item: 'tent', base: true, homeId: '1', x: WW / 2, y: WH * 0.6 }); Eng.persist(); }
    function migrate() {
      if (opts.listArr) return;
      if (!G.save.mig) G.save.mig = {};
      if (G.save.mig[opts.listKey]) return;
      const ox = G.W / 2, oy = (groundTop() + trayTop()) / 2;
      listArr().forEach(p => { p.x = WW / 2 + (p.x - ox) * 1.5; p.y = WH * 0.6 + (p.y - oy) * 1.5; });
      if (opts.ada && G.save.adaPos[opts.ada]) { const a = G.save.adaPos[opts.ada]; a.x = WW / 2 + (a.x - ox) * 1.5; a.y = WH * 0.6 + (a.y - oy) * 1.5; }
      G.save.mig[opts.listKey] = true; Eng.persist();
    }
    function pickPlaced(wx, wy) {
      const arr = listArr().slice().sort((a, b) => (b.onId ? 1 : 0) - (a.onId ? 1 : 0) || b.y - a.y);
      for (const p of arr) { const s = dsp(p) * 0.45; if (Math.abs(wx - p.x) < s && Math.abs(wy - p.y) < s) return p; }
      return null;
    }
    function surfaceAt(wx, wy, self) {
      let best = null;
      listArr().forEach(p => { if (p === self || !DATA.ITEMS[p.item].surface) return; const w = dispS(p.item) * 0.5, ty = surfaceTopY(p); if (Math.abs(wx - p.x) < w && wy > ty - dispS(p.item) * 0.4 && wy < p.y + dispS(p.item) * 0.2) { if (!best || p.y > best.y) best = p; } });
      return best;
    }
    function clampWorld(p) { p.x = Math.max(40, Math.min(WW - 40, p.x)); p.y = Math.max(WH * (opts.rooms ? 0.5 : 0.05), Math.min(WH * (opts.rooms ? 1 : 0.97) - 40, p.y)); }
    function inWater(x, y) { if (!S.water) return false; const im = WW * 0.085, iy = WH * 0.12; if (x < im || x > WW - im || y < iy || y > WH - iy) return true; const rc = WH * 0.5 + Math.sin(x / WW * 6.283) * WH * 0.12; return Math.abs(y - rc) < WH * 0.058; }
    function trashZone() { const r = Math.max(44, G.H * 0.07); return { x: G.W / 2 - r * 1.6, y: groundTop() + 6, w: r * 3.2, h: r, r }; }
    function trayLayout() { const ids = trayItems(); const tT = trayTop(), h = G.H * 0.18 - 8, iw = h * 0.92, gap = 10, pad = 12; S.trayMax = Math.max(0, pad * 2 + ids.length * (iw + gap) - G.W); return ids.map((id, i) => ({ id, x: pad + i * (iw + gap) + S.trayScroll, y: tT + 4, w: iw, h: h - 8 })); }

    function adaSize() { return opts.ada === 'tent' ? 210 : 150; }
    function adaHome() { if (opts.ada === 'park') { const base = listArr().find(p => p.base); return base ? { x: base.x - dsp(base) * 0.62, y: base.y + dsp(base) * 0.12 } : { x: WW * 0.4, y: WH * 0.6 }; } return { x: WW * 0.5, y: WH * 0.74 }; }
    function initAda() { if (!opts.ada) return; const sv = G.save.adaPos[opts.ada], h = adaHome(), ix = sv ? sv.x : h.x, iy = sv ? sv.y : h.y; S.ada = { x: ix, y: iy, tx: ix, ty: iy, face: 1, wt: 2, moving: false }; }
    function genAmbient() { S.ambient = []; if (opts.rooms) return; const cols = ['#ff6b9d', '#feca57', '#ff9ff3', '#ffffff', '#ff7979']; for (let i = 0; i < 220; i++) { const x = 30 + Math.random() * (WW - 60), y = WH * 0.04 + Math.random() * (WH * 0.92), t = Math.random(); if (inWater(x, y)) continue; if (t < 0.5) S.ambient.push({ kind: 'grass', x, y, h: 16 + Math.random() * 18 }); else if (t < 0.85) S.ambient.push({ kind: 'flower', x, y, r: 7 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0] }); else S.ambient.push({ kind: 'rock', x, y, r: 9 + Math.random() * 11 }); } }
    function initRiver() {
      S.water = true;
      S.river = []; const fc = [['#ff9ff3', '#e26fd0'], '#f368e0'], gc = [['#7ee0a8', '#3bb878'], '#2fa869'], oc = [['#ffd56b', '#f0a93a'], '#e8902a']; const fish = [fc, gc, oc];
      const ry = x => WH * 0.5 + Math.sin(x / WW * 6.283) * WH * 0.12;
      for (let i = 0; i < 6; i++) { const x = WW * (0.16 + Math.random() * 0.68); S.river.push({ kind: 'duck', x, y: ry(x), vx: (Math.random() < .5 ? 1 : -1) * (16 + Math.random() * 12), ph: Math.random() * 6 }); }
      for (let i = 0; i < 9; i++) { const x = WW * (0.16 + Math.random() * 0.68), c = fish[i % 3]; S.river.push({ kind: 'fish', x, y: ry(x), vx: (Math.random() < .5 ? 1 : -1) * (14 + Math.random() * 14), ph: Math.random() * 6, col: c[0], fin: c[1] }); }
    }

    S.enter = function (arg) {
      if (opts.rooms) { S.homeId = (arg && arg.homeId) || S.homeId || '1'; if (!G.save.homes[S.homeId]) G.save.homes[S.homeId] = { style: 0, rooms: { living: [], bedroom: [], kitchen: [], bathroom: [] } }; S.room = (arg && arg.room) || 'living'; }
      S.drag = null; S.pan = null; S.trayScroll = 0; S.trayMax = 0; S._active = null; S.trayDrag = null; S.rotTarget = null; S._pinchInit = false; S.wparts = []; S.fw = []; S.fwT = 1.5;
      migrate(); ensureBase(); if (opts.river) initRiver(); genAmbient(); initAda(); centerCam(); recomputePop(true); Audio2.voice(opts.voice);
    };
    S.setRoom = function (rm) { if (S.room === rm) return; S.room = rm; S.drag = null; S.pan = null; S.rotTarget = null; centerCam(); Audio2.sfx('click'); };
    S.resize = function () { clampCam(); };
    S.cancelDrag = function () { S.drag = null; S.pan = null; S.trayDrag = null; S._pinchInit = false; };
    S.wheel = function (dy) { zoomAt(G.pointer.x, G.pointer.y, dy < 0 ? 1.12 : 0.9); };
    S.onPinch = function (factor, cx, cy, da) {
      if (!S._pinchInit) { const w = s2w(cx, cy); const p = pickPlaced(w.x, w.y); S.rotTarget = (p && !p.base) ? p : null; S._pinchInit = true; }
      if (S.rotTarget) { S.rotTarget.rot = (S.rotTarget.rot || 0) + da; }
      else zoomAt(cx, cy, factor);
    };
    S.onPinchEnd = function () { S._pinchInit = false; if (S.rotTarget) { Eng.persist(); S.rotTarget = null; } };
    S.update = function (dt) {
      if (opts.ada && S.ada) S.ada.moving = false;            // 公主停在原地，不再自由走动
      if (opts.river && S.river) S.river.forEach(d => { d.ph += dt; d.x += d.vx * dt; if (d.x < WW * 0.13 || d.x > WW * 0.87) d.vx = -d.vx; d.y = WH * 0.5 + Math.sin(d.x / WW * 6.283) * WH * 0.12; });
      if (opts.weather) {                                     // 季节飘落：春花瓣 / 秋落叶 / 冬雪
        const sp = ['petal', 'none', 'leaf', 'snow'][(G.save.season | 0) % 4];
        if (sp !== 'none') {
          const n = Math.ceil((sp === 'snow' ? 22 : sp === 'petal' ? 16 : 14) * dt);
          for (let k = 0; k < n; k++) S.wparts.push({ x: Math.random() * G.W, y: vTop() - 6, vy: sp === 'snow' ? 130 : sp === 'petal' ? 95 : 115, r: 2 + Math.random() * 2.5, kind: sp, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 4, ph: Math.random() * 6.28 });
          for (let i = S.wparts.length - 1; i >= 0; i--) { const p = S.wparts[i]; p.y += p.vy * dt; p.x += Math.sin((p.y + p.ph) * 0.04) * 24 * dt; p.rot += p.vr * dt; if (p.y > vBot()) S.wparts.splice(i, 1); }
        } else if (S.wparts.length) S.wparts.length = 0;
      }
      if (opts.fireworks && G.save.night) {                   // 夜空烟花（屏幕坐标，永远可见）
        const vt = vTop(), vb = vBot(), vh = vb - vt;
        S.fwT -= dt;
        if (S.fwT <= 0) { S.fwT = 0.9 + Math.random() * 1.8; const cols = ['#ff6b6b', '#feca57', '#54a0ff', '#1dd1a1', '#ff9ff3', '#fff7a0']; S.fw.push({ type: 'rocket', x: G.W * (0.12 + Math.random() * 0.76), y: vb - 8, vy: -(vh * 1.25 + Math.random() * vh * 0.35), ay: vh * 1.6, color: cols[(Math.random() * cols.length) | 0] }); }
        for (let i = S.fw.length - 1; i >= 0; i--) { const p = S.fw[i];
          if (p.type === 'rocket') { p.y += p.vy * dt; p.vy += p.ay * dt; if (p.vy >= -vh * 0.08) { const N = 28; for (let q = 0; q < N; q++) { const a2 = q / N * 6.283, sp2 = vh * (0.35 + Math.random() * 0.25); S.fw.push({ type: 'spark', x: p.x, y: p.y, vx: Math.cos(a2) * sp2, vy: Math.sin(a2) * sp2, age: 0, life: 1 + Math.random() * 0.6, color: p.color }); } S.fw.splice(i, 1); Audio2.sfx('star'); } }
          else { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += vh * 0.55 * dt; if (p.age > p.life) S.fw.splice(i, 1); }
        }
      } else if (opts.fireworks && S.fw && S.fw.length) S.fw.length = 0;
    };

    S.down = function (x, y) {
      S._active = null; S.trayDrag = null; S.pan = null;
      for (const b of (S.buttons || [])) if (hit(b, x, y)) { b.pressed = true; S._active = b; return; }
      if (y > vTop() && y < vBot()) {
        const w = s2w(x, y);
        if (opts.ada && S.ada) { const sz = adaSize(); if (Math.abs(w.x - S.ada.x) < sz * 0.34 && w.y > S.ada.y - sz * 0.55 && w.y < S.ada.y + sz * 0.5) { S.drag = { kind: 'ada', dx: w.x - S.ada.x, dy: w.y - S.ada.y, scrX: x, scrY: y }; Audio2.sfx('pop'); return; } }
        const p = pickPlaced(w.x, w.y);
        if (p) { S.drag = { kind: 'placed', p, item: p.item, dx: w.x - p.x, dy: w.y - p.y, scrX: x, scrY: y, sx: x, sy: y, ox: p.x, oy: p.y }; Audio2.sfx('pop'); return; }
        S.pan = { x, y, camx: S.cam.x, camy: S.cam.y }; return;
      }
      if (y >= trayTop()) {                                // 托盘：先记下(可能是横滑滚动，也可能向上拖取物)
        let item = null;
        for (const t of trayLayout()) if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) { if ((G.save.built[t.id] || 0) > 0) item = t.id; break; }
        S.trayDrag = { sx: x, sy: y, base: S.trayScroll, item: item, mode: null };
      }
    };
    S.move = function (x, y) {
      if (S.pan) { S.cam.x = S.pan.camx + (x - S.pan.x); S.cam.y = S.pan.camy + (y - S.pan.y); clampCam(); return; }
      if (S.trayDrag) {                                     // 横滑=滚动托盘; 向上拖=把物品拿出来摆放
        const td = S.trayDrag, dx = x - td.sx, dy = y - td.sy;
        if (td.mode === null) {
          if (Math.abs(dx) > 8 && Math.abs(dx) >= Math.abs(dy)) td.mode = 'scroll';
          else if (dy < -12 && td.item) { S.trayDrag = null; S.drag = { kind: 'tray', item: td.item, scrX: x, scrY: y }; }
        }
        if (S.trayDrag) { if (S.trayDrag.mode === 'scroll') S.trayScroll = Math.min(0, Math.max(-S.trayMax, td.base + dx)); return; }
      }
      if (!S.drag) return;
      S.drag.scrX = x; S.drag.scrY = y;
      const w = s2w(x, y);
      if (S.drag.kind === 'ada') { const nx = w.x - S.drag.dx, ny = w.y - S.drag.dy; if (Math.abs(nx - S.ada.x) > 1) S.ada.face = nx > S.ada.x ? 1 : -1; S.ada.x = Math.max(60, Math.min(WW - 60, nx)); S.ada.y = Math.max(WH * 0.44, Math.min(WH - 50, ny)); return; }
      if (S.drag.kind === 'placed') { const p = S.drag.p; p.x = w.x - S.drag.dx; p.y = w.y - S.drag.dy; clampWorld(p); }
    };
    S.up = function (x, y) {
      const a = S._active; (S.buttons || []).forEach(b => b.pressed = false);
      if (a && hit(a, x, y) && a.onTap) { Audio2.sfx('click'); a.onTap(); S.cancelDrag(); return; }
      S._active = null;
      if (S.pan) { S.pan = null; return; }
      S.trayDrag = null;
      const dr = S.drag; S.drag = null; if (!dr) return;
      if (dr.kind === 'ada') { G.save.adaPos[opts.ada] = { x: S.ada.x, y: S.ada.y }; S.ada.tx = S.ada.x; S.ada.ty = S.ada.y; S.ada.wt = 2.5; Audio2.sfx('place'); Eng.persist(); return; }
      const onTray = y >= trayTop();
      const tz = trashZone(), onTrash = x > tz.x && x < tz.x + tz.w && y > tz.y - 10 && y < tz.y + tz.h + 10;
      const inWorld = y > vTop() && y < vBot();
      const w = s2w(x, y);
      if (dr.kind === 'tray') {
        if (inWorld) {
          const it = DATA.ITEMS[dr.item];
          if (opts.river && inWater(w.x, w.y) && !it.water) { Audio2.sfx('bad'); Eng.floatText(x, y - 20, '这个不能放水里哦~', '#ff7675'); return; }
          const entry = { id: G.save.placeSeq++, item: dr.item, x: w.x, y: w.y, rot: 0 }; clampWorld(entry);
          if (it.home) { entry.homeId = String(G.save.homeSeq++); G.save.homes[entry.homeId] = { style: (G.save.homeSeq) % HOME_STYLES.length, rooms: { living: [], bedroom: [], kitchen: [], bathroom: [] } }; Eng.floatText(w.x * S.cam.s + S.cam.x, w.y * S.cam.s + S.cam.y - 30, '新帐篷! 点进去布置🏠', '#e67e22'); }
          if (it.onTop) { const surf = surfaceAt(w.x, w.y, null); if (surf) { entry.onId = surf.id; entry.offx = Math.max(-dispS(surf.item) * 0.28, Math.min(dispS(surf.item) * 0.28, w.x - surf.x)); } }
          G.save.built[dr.item]--; if (G.save.built[dr.item] <= 0) delete G.save.built[dr.item];
          listArr().push(entry); Audio2.sfx(entry.onId ? 'good' : 'place'); recomputePop(false);
        }
      } else if (dr.kind === 'placed') {
        const p = dr.p, moved = Math.hypot(x - dr.sx, y - dr.sy);
        if (isHome(p) && moved < 14) { Audio2.sfx('place'); Eng.go('tent', { homeId: p.homeId || '1', room: 'living' }); return; }   // 轻点帐篷=进去
        if (!isHome(p) && moved < 12 && !onTrash && !onTray) { p.flip = -(p.flip || 1); Audio2.sfx('click'); Eng.floatText(x, y - 24, '↔ 换个方向', '#3aa0e0'); Eng.persist(); return; }   // 轻点物品=左右翻转朝向
        if (p.base && (onTrash || onTray)) { Audio2.sfx('bad'); Eng.floatText(G.W / 2, vTop() + 60, '🏕️ 这是 Ada 的家，拆不掉哦~', '#e67e22'); Eng.persist(); }
        else if (onTrash || onTray) { childrenOf(p.id).forEach(c => { c.onId = null; }); if (isHome(p) && p.homeId) delete G.save.homes[p.homeId]; G.save.built[p.item] = (G.save.built[p.item] || 0) + 1; listArr().splice(listArr().indexOf(p), 1); Audio2.sfx('pop'); Eng.floatText(x, y - 20, '收回了 ' + DATA.ITEMS[p.item].name, '#ff7675'); recomputePop(false); }
        else if (inWorld) {
          if (opts.river && inWater(p.x, p.y) && !DATA.ITEMS[p.item].water) { p.x = dr.ox; p.y = dr.oy; clampWorld(p); Audio2.sfx('bad'); Eng.floatText(x, y - 20, '这个不能放水里哦~', '#ff7675'); return; }
          p.onId = null; delete p.offx; if (DATA.ITEMS[p.item].onTop) { const surf = surfaceAt(w.x, w.y, p); if (surf) { p.onId = surf.id; p.offx = Math.max(-dispS(surf.item) * 0.28, Math.min(dispS(surf.item) * 0.28, w.x - surf.x)); Audio2.sfx('good'); } } Audio2.sfx('place'); Eng.persist(); recomputePop(true);
        }
      }
    };

    S.draw = function (ctx) {
      S.buttons = [];
      const vt = vTop(), vb = vBot();
      ctx.fillStyle = opts.rooms ? '#efe6d8' : '#dff1ff';   // 铺满整屏，视口外不露上一个场景
      ctx.fillRect(0, 0, G.W, G.H);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, vt, G.W, vb - vt); ctx.clip();
      ctx.translate(S.cam.x, S.cam.y); ctx.scale(S.cam.s, S.cam.s);
      opts.bg(ctx, WW, WH, S);
      if (opts.showVisitors) DATA.VISITORS.filter(v => G.save.visitors[v.id]).forEach((v, i) => {
        const t = G.t * 0.08 + i * 1.7;                         // 走得慢一些
        if (v.id === 'bird') {                                  // 小鸟：飞在天空（山头上方）
          const x = WW * 0.5 + Math.cos(t * 0.9) * WW * 0.3, y = WH * 0.3 + Math.sin(t * 1.7) * WH * 0.06, sz = 72;
          if (window.Critters) Critters.draw(ctx, 'bird', x, y, sz, G.t, { fly: true, phase: i * 0.6 });
          else Sprites.draw(ctx, v.sprite, x, y - sz * 0.4, sz * 0.6);
        } else {                                                // 其它动物：地面草地上走（更小、更慢）
          const x = WW * 0.5 + Math.cos(t) * WW * 0.32, yf = WH * 0.74 + Math.sin(t * 1.3) * WH * 0.14, sz = 82;
          Eng.softShadow(ctx, x, yf, sz * 0.22, sz * 0.06, 0.26);
          if (window.Critters) Critters.draw(ctx, v.id, x, yf, sz, G.t, { phase: i * 0.6 });
          else Sprites.draw(ctx, v.sprite, x, yf - sz * 0.4, sz * 0.6);
        }
      });
      listArr().forEach(c => { if (c.onId) { const par = listArr().find(p => p.id === c.onId); if (!par) c.onId = null; else { c.x = par.x + (c.offx || 0); c.y = surfaceTopY(par) - dispS(c.item) * 0.18; } } });
      const roots = listArr().filter(p => !p.onId).sort((a, b) => a.y - b.y), order = [];
      roots.forEach(r => { order.push(r); childrenOf(r.id).sort((a, b) => a.x - b.x).forEach(c => order.push(c)); });
      order.forEach(p => {
        const ds = dsp(p), home = isHome(p), dragging = S.drag && S.drag.kind === 'placed' && S.drag.p === p;
        if (home) { ctx.fillStyle = 'rgba(120,90,50,.18)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + ds * 0.42, ds * 0.62, ds * 0.22, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(214,189,140,.5)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + ds * 0.42, ds * 0.5, ds * 0.17, 0, 0, 7); ctx.fill(); }
        if (!p.onId) Eng.softShadow(ctx, p.x, p.y + ds * 0.42, ds * 0.34, ds * 0.13, dragging ? .26 : .18);
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = ds * 0.05; ctx.shadowOffsetY = ds * 0.04;
        Sprites.draw(ctx, DATA.ITEMS[p.item].sprite, p.x, p.y - (dragging ? ds * 0.08 : 0), ds * (dragging ? 1.08 : 1), { rot: p.rot || 0, flip: p.flip || 1 });
        ctx.restore();
        if (home) { ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 2; const lw = ds * 0.66, lh = ds * 0.16, lx = p.x - lw / 2, ly = p.y + ds * 0.5; rr(ctx, lx, ly, lw, lh, lh * 0.4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e67e22'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(lh * 0.6) + 'px "PingFang SC",sans-serif'; ctx.fillText('🚪 点我进去', p.x, ly + lh / 2); }
      });
      if (S.drag && S.drag.item && DATA.ITEMS[S.drag.item] && DATA.ITEMS[S.drag.item].onTop) { const wp = s2w(S.drag.scrX, S.drag.scrY); const surf = surfaceAt(wp.x, wp.y, S.drag.kind === 'placed' ? S.drag.p : null); if (surf) { ctx.save(); ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 3; ctx.setLineDash([9, 6]); const w2 = dispS(surf.item) * 0.5; ctx.strokeRect(surf.x - w2, surfaceTopY(surf) - 7, w2 * 2, 14); ctx.restore(); } }
      if (opts.ada && S.ada) { const sz = adaSize(), dragging = S.drag && S.drag.kind === 'ada'; const hop = dragging ? Math.abs(Math.sin(G.t * 9)) * sz * 0.05 : 0; drawAda(ctx, S.ada.x, S.ada.y, sz, S.ada.face, hop); drawAdaSnow(ctx, S.ada.x, S.ada.y, sz, G.t); }
      ctx.restore();

      if (opts.afterDraw) opts.afterDraw(ctx, S);

      // —— 屏幕 UI ——
      if (opts.showVisitors) drawVisitorBar(ctx);
      if (opts.rooms) {                                   // 房间标签
        const rooms = [['living', '客厅'], ['bedroom', '卧室'], ['kitchen', '厨房'], ['bathroom', '厕所']];
        const th = Math.max(36, G.H * 0.058), tw = Math.min(G.W * 0.13, 118), gap = 6, totalW = rooms.length * (tw + gap) - gap, sx2 = (G.W - totalW) / 2, ty = vt - th - 6;
        rooms.forEach((r, i) => { const cur = S.room === r[0]; const b = { x: sx2 + i * (tw + gap), y: ty, w: tw, h: th, label: r[1], color: cur ? '#e67e22' : '#caa06a', fs: Math.round(th * 0.42), onTap: () => S.setRoom(r[0]) }; S.buttons.push(b); btn(ctx, b); });
      }
      if (S.drag && S.drag.kind === 'placed' && !S.drag.p.base) {
        const tz = trashZone(), hot = S.drag.scrX > tz.x && S.drag.scrX < tz.x + tz.w && S.drag.scrY > tz.y - 10 && S.drag.scrY < tz.y + tz.h + 10;
        rr(ctx, tz.x, tz.y, tz.w, tz.h, tz.h * 0.4); ctx.fillStyle = hot ? 'rgba(231,76,60,.96)' : 'rgba(231,76,60,.72)'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.setLineDash(hot ? [] : [7, 5]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(tz.h * 0.36) + 'px "PingFang SC",sans-serif';
        ctx.fillText('🗑 ' + (hot ? '松手删除!' : '拖到这里删除'), tz.x + tz.w / 2, tz.y + tz.h / 2);
      }
      rr(ctx, 6, trayTop(), G.W - 12, G.H * 0.18 - 6, 16); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();
      const ids = trayItems();
      if (ids.length === 0) { ctx.fillStyle = '#7f8c8d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(G.H * 0.03) + 'px "PingFang SC",sans-serif'; ctx.fillText('还没有造好的东西～ 先去「造东西」吧', G.W / 2, trayTop() + G.H * 0.09); }
      else { trayLayout().forEach(t => { rr(ctx, t.x, t.y, t.w, t.h, 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#27ae60'; ctx.stroke(); Sprites.draw(ctx, DATA.ITEMS[t.id].sprite, t.x + t.w / 2, t.y + t.h * 0.42, t.w * 0.62); ctx.fillStyle = '#27ae60'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(t.w * 0.18) + 'px "PingFang SC",sans-serif'; ctx.fillText(DATA.ITEMS[t.id].name + ' ×' + (G.save.built[t.id] || 0), t.x + t.w / 2, t.y + t.h * 0.85); }); }
      if (S.drag && S.drag.kind === 'tray') { const gsz = baseS() * (DATA.ITEMS[S.drag.item].scale || 1) * S.cam.s * 1.05; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.32)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; Sprites.draw(ctx, DATA.ITEMS[S.drag.item].sprite, S.drag.scrX, S.drag.scrY, gsz); ctx.restore(); }
      if (S.trayMax > 4 && !S.drag) { ctx.fillStyle = 'rgba(39,174,96,.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(G.H * 0.022) + 'px "PingFang SC",sans-serif'; ctx.fillText('← 左右滑动看更多 →', G.W / 2, trayTop() + G.H * 0.005); }
      if (!S.drag && !S.pan) { ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(G.H * 0.022) + 'px "PingFang SC",sans-serif'; ctx.fillText(opts.hint, G.W / 2, trayTop() - G.H * 0.02); }

      const bw = Math.min(G.W * 0.2, 156), bh = Math.max(40, G.H * 0.07);
      opts.nav(S, ctx, bw, bh);
      topNav(S, ctx, opts.back);
    };
    return S;
  }

  /* —— 乐园 —— */
  const park = makePlacement({
    listKey: 'placed', voice: 'park_intro', base: true, showVisitors: true, ada: 'park', bg: parkWorldBg, worldW: 5200, worldH: 3000, river: true, weather: true, fireworks: true,
    hint: '拖空地平移 · 双指缩放 · 轻点物品换方向 · 双指转 · 拖到🗑删除 · 点帐篷进去',
    afterDraw: (ctx, S) => {
      const vt = Math.max(46, G.H * 0.075) + 10 + G.H * 0.08, vb = G.H - G.H * 0.18;
      ctx.save(); ctx.beginPath(); ctx.rect(0, vt, G.W, vb - vt); ctx.clip();
      // 夜空烟花
      if (G.save.night && S.fw) S.fw.forEach(p => {
        if (p.type === 'rocket') { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + 15); ctx.stroke(); }
        else { const k = 1 - p.age / p.life; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.max(0, k); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 7 * k + 2, 0, 7); ctx.fill(); ctx.restore(); }
      });
      // 季节飘落
      if (S.wparts) S.wparts.forEach(p => {
        if (p.kind === 'snow') { ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
        else if (p.kind === 'petal') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = 'rgba(255,170,205,.92)'; ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.5, p.r * 0.8, 0, 0, 7); ctx.fill(); ctx.restore(); }
        else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = ['#e08a3a', '#d9a93a', '#c96a3a'][(p.ph * 3 | 0) % 3]; ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.6, p.r * 0.7, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(120,70,30,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-p.r * 1.4, 0); ctx.lineTo(p.r * 1.4, 0); ctx.stroke(); ctx.restore(); }
      });
      ctx.restore();
    },
    nav: (S, ctx, bw, bh) => {
      const ob = { x: G.W - bw * 2 - 22, y: 12, w: bw, h: bh, label: '🌊 去大海', color: '#2e86de', fs: Math.round(bh * 0.3), onTap: () => Eng.go('ocean', DATA.LEVELS[0]) };
      const cb = { x: G.W - bw - 12, y: 12, w: bw, h: bh, label: '🔨 造东西', color: '#e67e22', fs: Math.round(bh * 0.3), onTap: () => Eng.openCraft() };
      S.buttons.push(ob, cb); btn(ctx, ob); btn(ctx, cb);
      const s = Math.max(40, G.H * 0.07), by = (G.H - G.H * 0.18) - s - 8;
      const nb = { x: 12, y: by, w: s, h: s, label: G.save.night ? '🌙' : '☀️', color: '#7e8cc4', fs: Math.round(s * 0.45), onTap: () => { G.save.night = !G.save.night; Eng.persist(); } };
      const sl = ['🌸', '🌻', '🍂', '⛄'], sb = { x: 12 + s + 8, y: by, w: s, h: s, label: sl[(G.save.season | 0) % 4], color: '#6fb87a', fs: Math.round(s * 0.45), onTap: () => { G.save.season = ((G.save.season | 0) + 1) % 4; Eng.persist(); Eng.floatText(G.W / 2, G.H * 0.4, ['🌸 春天来啦', '🌻 夏天到啦', '🍂 秋天到啦', '⛄ 冬天到啦'][G.save.season], '#27ae60'); } };
      S.buttons.push(nb, sb); btn(ctx, nb); btn(ctx, sb);
    },
  });

  /* —— 帐篷内部（多房间）—— */
  const tent = makePlacement({
    voice: 'tent_intro', ada: 'tent', bg: tentRoomBg, worldW: 2000, worldH: 1300, rooms: true,
    listArr: (S) => { const h = G.save.homes[S.homeId] || G.save.homes['1']; if (!h.rooms[S.room]) h.rooms[S.room] = []; return h.rooms[S.room]; },
    hint: '拖空地平移 · 双指缩放 · 轻点物品换方向 · 上面切换房间 · 拖东西进来 · 拖到🗑收回',
    back: () => Eng.go('park'),
    nav: (S, ctx, bw, bh) => {
      const ob = { x: G.W - bw * 2 - 22, y: 12, w: bw, h: bh, label: '🌳 出帐篷', color: '#27ae60', fs: Math.round(bh * 0.3), onTap: () => Eng.go('park') };
      const cb = { x: G.W - bw - 12, y: 12, w: bw, h: bh, label: '🔨 造东西', color: '#e67e22', fs: Math.round(bh * 0.3), onTap: () => Eng.openCraft() };
      S.buttons.push(ob, cb); btn(ctx, ob); btn(ctx, cb);
    },
  });

  G.scenes.craft = craft; G.scenes.park = park; G.scenes.tent = tent;
})();
