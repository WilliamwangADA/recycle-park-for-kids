/* ===========================================================================
   场景：回收造物 / 装饰乐园 / 帐篷内部
   乐园与帐篷共用一套「世界摆放引擎」：支持相机平移(拖动)+缩放(双指/滚轮)，
   更大的世界、天空/河流/花草、Ada 公主可拖放、帐篷更大更多布置元素。
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
      rr(ctx, x, y, cw, ch, 16); ctx.fillStyle = ok ? '#ffffff' : '#ececec'; ctx.fill();
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
      if (frac < 0.85) { ctx.fillStyle = 'rgba(230,126,34,.8)'; ctx.textAlign = 'center'; ctx.font = 'bold ' + Math.round(G.H * 0.026) + 'px "PingFang SC",sans-serif'; ctx.fillText('↓ 下滑看更多 ↓', G.W / 2, G.H - bh - 40); }
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
    G.save.placed.concat(G.save.tentPlaced).forEach(p => { pop += (DATA.ITEMS[p.item] ? DATA.ITEMS[p.item].charm : 0); });
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
    const bx = pad + s + 60;
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

  /* =======================================================================
     世界背景：乐园(天空/远山/草地/河流/花草) / 帐篷内部(更大更多元素)
     ======================================================================= */
  function cloud2(ctx, x, y, r) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.arc(x + r, y + r * 0.2, r * 0.8, 0, 7); ctx.arc(x - r, y + r * 0.2, r * 0.8, 0, 7); ctx.fill(); }
  function flower(ctx, x, y, r, c) { for (let k = 0; k < 5; k++) { const a = k * 1.2566; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.72, 0, 7); ctx.fillStyle = c; ctx.fill(); } ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, 7); ctx.fillStyle = '#fff3a0'; ctx.fill(); }
  function grassTuft(ctx, x, y, h) { ctx.strokeStyle = '#4ca64c'; ctx.lineWidth = h * 0.16; ctx.lineCap = 'round'; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * h * 0.18, y); ctx.quadraticCurveTo(x + k * h * 0.42, y - h * 0.7, x + k * h * 0.55, y - h); ctx.stroke(); } }

  function parkWorldBg(ctx, WW, WH, S) {
    const sky = ctx.createLinearGradient(0, 0, 0, WH * 0.44); sky.addColorStop(0, '#9fd8ff'); sky.addColorStop(1, '#dff6ec'); ctx.fillStyle = sky; ctx.fillRect(0, 0, WW, WH * 0.44);
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(WW * 0.82, WH * 0.1, WH * 0.05, 0, 7); ctx.fill();
    cloud2(ctx, WW * 0.18, WH * 0.1, WH * 0.035); cloud2(ctx, WW * 0.46, WH * 0.07, WH * 0.03); cloud2(ctx, WW * 0.66, WH * 0.13, WH * 0.028);
    ctx.fillStyle = '#9ad27a'; for (let i = 0; i < 5; i++) { const cx = WW * (0.08 + i * 0.22); ctx.beginPath(); ctx.moveTo(cx - WW * 0.16, WH * 0.44); ctx.quadraticCurveTo(cx, WH * 0.44 - WH * 0.14, cx + WW * 0.16, WH * 0.44); ctx.fill(); }
    const gr = ctx.createLinearGradient(0, WH * 0.42, 0, WH); gr.addColorStop(0, '#a6e36a'); gr.addColorStop(1, '#79c047'); ctx.fillStyle = gr; ctx.fillRect(0, WH * 0.42, WW, WH * 0.58);
    // 河流(蜿蜒) + 高光
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#6fc3e8'; ctx.lineWidth = WH * 0.075; ctx.beginPath(); ctx.moveTo(-30, WH * 0.62); ctx.bezierCurveTo(WW * 0.28, WH * 0.54, WW * 0.5, WH * 0.8, WW * 0.74, WH * 0.66); ctx.lineTo(WW + 30, WH * 0.72); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = WH * 0.014; ctx.beginPath(); ctx.moveTo(-30, WH * 0.6); ctx.bezierCurveTo(WW * 0.28, WH * 0.52, WW * 0.5, WH * 0.78, WW * 0.74, WH * 0.64); ctx.lineTo(WW + 30, WH * 0.7); ctx.stroke();
    ctx.restore();
    // 小路
    ctx.strokeStyle = '#f0d9a8'; ctx.lineWidth = WH * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(WW * 0.5, WH); ctx.quadraticCurveTo(WW * 0.42, WH * 0.62, WW * 0.56, WH * 0.46); ctx.stroke();
    // 花草石散点
    (S.ambient || []).forEach(a => { if (a.kind === 'flower') flower(ctx, a.x, a.y, a.r, a.c); else if (a.kind === 'grass') grassTuft(ctx, a.x, a.y, a.h); else { ctx.fillStyle = '#9aa7b5'; ctx.beginPath(); ctx.ellipse(a.x, a.y, a.r, a.r * 0.7, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(a.x - a.r * 0.3, a.y - a.r * 0.25, a.r * 0.4, a.r * 0.25, 0, 0, 7); ctx.fill(); } });
  }

  function tentWorldBg(ctx, WW, WH) {
    const g = ctx.createLinearGradient(0, 0, 0, WH); g.addColorStop(0, '#ffe9c7'); g.addColorStop(1, '#eebd86'); ctx.fillStyle = g; ctx.fillRect(0, 0, WW, WH);
    const peakX = WW / 2, peakY = WH * 0.03, floorY = WH * 0.62;
    for (let i = 0; i <= 16; i++) { const fx = WW * (0.03 + i * 0.0588); ctx.globalAlpha = 0.15; ctx.strokeStyle = i % 2 ? '#e8915a' : '#fff0d6'; ctx.lineWidth = WW * 0.036; ctx.beginPath(); ctx.moveTo(peakX, peakY); ctx.lineTo(fx, floorY); ctx.stroke(); } ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(150,95,50,.5)'; ctx.lineWidth = WH * 0.012; ctx.beginPath(); ctx.moveTo(peakX, peakY); ctx.lineTo(WW * 0.02, floorY); ctx.moveTo(peakX, peakY); ctx.lineTo(WW * 0.98, floorY); ctx.stroke();
    // 彩灯串
    ctx.strokeStyle = 'rgba(120,80,40,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(WW * 0.1, WH * 0.15); ctx.quadraticCurveTo(WW * 0.5, WH * 0.25, WW * 0.9, WH * 0.15); ctx.stroke();
    const lc = ['#ff6b6b', '#feca57', '#54a0ff', '#1dd1a1', '#ff9ff3']; for (let i = 0; i <= 12; i++) { const t = i / 12, x = WW * 0.1 + WW * 0.8 * t, y = WH * 0.15 + Math.sin(t * Math.PI) * WH * 0.1; ctx.beginPath(); ctx.arc(x, y, WH * 0.013, 0, 7); ctx.fillStyle = lc[i % lc.length]; ctx.fill(); }
    // 窗户 + 阳光
    [WW * 0.15, WW * 0.85].forEach(wx => { const wy = WH * 0.34, ww = WW * 0.12, wh = WH * 0.17; rr(ctx, wx - ww / 2, wy, ww, wh, 8); ctx.fillStyle = '#aee3ff'; ctx.fill(); ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.arc(wx + ww * 0.2, wy + wh * 0.3, wh * 0.16, 0, 7); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#cdb089'; rr(ctx, wx - ww / 2, wy, ww, wh, 8); ctx.stroke(); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + wh); ctx.moveTo(wx - ww / 2, wy + wh / 2); ctx.lineTo(wx + ww / 2, wy + wh / 2); ctx.stroke(); });
    // 挂画
    [WW * 0.34, WW * 0.66].forEach((px, i) => { const py = WH * 0.32, pw = WW * 0.08, ph = WH * 0.11; rr(ctx, px - pw / 2, py, pw, ph, 5); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#b98a5c'; ctx.stroke(); ctx.fillStyle = i ? '#7fc7f0' : '#ffb6c1'; ctx.beginPath(); ctx.arc(px, py + ph * 0.5, ph * 0.22, 0, 7); ctx.fill(); });
    // 木地板
    const fg = ctx.createLinearGradient(0, floorY, 0, WH); fg.addColorStop(0, '#caa066'); fg.addColorStop(1, '#a87f48'); ctx.fillStyle = fg; ctx.fillRect(0, floorY, WW, WH - floorY);
    ctx.strokeStyle = 'rgba(120,80,40,.2)'; ctx.lineWidth = 2; for (let i = 1; i < 7; i++) { const y = floorY + i / 7 * (WH - floorY); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WW, y); ctx.stroke(); }
    // 大圆地毯
    ctx.fillStyle = '#df7a7a'; ctx.beginPath(); ctx.ellipse(WW * 0.5, WH * 0.8, WW * 0.32, WH * 0.13, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f0a0a0'; ctx.beginPath(); ctx.ellipse(WW * 0.5, WH * 0.8, WW * 0.24, WH * 0.095, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd0d0'; ctx.beginPath(); ctx.ellipse(WW * 0.5, WH * 0.8, WW * 0.15, WH * 0.06, 0, 0, 7); ctx.fill();
    // 两侧盆栽
    [WW * 0.07, WW * 0.93].forEach(px => { const py = WH * 0.64; ctx.fillStyle = '#c0794a'; rr(ctx, px - WW * 0.02, py, WW * 0.04, WH * 0.06, 4); ctx.fill(); ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.arc(px, py - WH * 0.02, WW * 0.03, 0, 7); ctx.fill(); ctx.fillStyle = '#27ae60'; ctx.beginPath(); ctx.arc(px - WW * 0.018, py - WH * 0.005, WW * 0.018, 0, 7); ctx.fill(); });
    const rg = ctx.createRadialGradient(WW * 0.5, WH * 0.2, 0, WW * 0.5, WH * 0.2, WH * 0.6); rg.addColorStop(0, 'rgba(255,240,180,.32)'); rg.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, WW, WH);
  }

  /* =======================================================================
     世界摆放引擎：乐园 / 帐篷 共用（相机平移 + 缩放）
     ======================================================================= */
  function makePlacement(opts) {
    const S = { buttons: [], cam: { s: 1, x: 0, y: 0 } };
    const WW = opts.worldW, WH = opts.worldH;
    const listArr = () => G.save[opts.listKey];
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
    function centerCam() { S.cam.s = sMin() * 1.7; const h = homePos(); S.cam.x = G.W / 2 - h.x * S.cam.s; S.cam.y = (vTop() + vBot()) / 2 - h.y * S.cam.s; clampCam(); }

    function ensureBase() { if (!opts.base || listArr().some(p => p.base)) return; listArr().unshift({ id: G.save.placeSeq++, item: 'tent', base: true, x: WW / 2, y: WH * 0.6 }); Eng.persist(); }
    function migrate() {
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
    function clampWorld(p) { p.x = Math.max(40, Math.min(WW - 40, p.x)); p.y = Math.max(WH * (opts.indoor ? 0.5 : 0.42), Math.min(WH - 40, p.y)); }
    function trashZone() { const r = Math.max(44, G.H * 0.07); return { x: G.W / 2 - r * 1.6, y: groundTop() + 6, w: r * 3.2, h: r, r }; }
    function trayLayout() { const ids = trayItems(); const tT = trayTop(), h = G.H * 0.18 - 8, iw = h * 0.92, gap = 10, pad = 12; S.trayMax = Math.max(0, pad * 2 + ids.length * (iw + gap) - G.W); return ids.map((id, i) => ({ id, x: pad + i * (iw + gap) + S.trayScroll, y: tT + 4, w: iw, h: h - 8 })); }

    function adaSize() { return opts.ada === 'tent' ? 210 : 150; }
    function adaHome() { if (opts.ada === 'park') { const base = listArr().find(p => p.base); return base ? { x: base.x - dsp(base) * 0.62, y: base.y + dsp(base) * 0.12 } : { x: WW * 0.4, y: WH * 0.6 }; } return { x: WW * 0.5, y: WH * 0.72 }; }
    function initAda() { if (!opts.ada) return; const sv = G.save.adaPos[opts.ada], h = adaHome(), ix = sv ? sv.x : h.x, iy = sv ? sv.y : h.y; S.ada = { x: ix, y: iy, tx: ix, ty: iy, face: 1, wt: 2, moving: false }; }
    function genAmbient() { S.ambient = []; if (opts.indoor) return; const cols = ['#ff6b9d', '#feca57', '#ff9ff3', '#ffffff', '#ff7979']; for (let i = 0; i < 70; i++) { const x = 30 + Math.random() * (WW - 60), y = WH * 0.46 + Math.random() * (WH * 0.5), t = Math.random(); if (t < 0.5) S.ambient.push({ kind: 'grass', x, y, h: 16 + Math.random() * 16 }); else if (t < 0.85) S.ambient.push({ kind: 'flower', x, y, r: 7 + Math.random() * 5, c: cols[(Math.random() * cols.length) | 0] }); else S.ambient.push({ kind: 'rock', x, y, r: 9 + Math.random() * 10 }); } }

    S.enter = function () { S.drag = null; S.pan = null; S.trayScroll = 0; S.trayMax = 0; S._active = null; S.trayDrag = null; migrate(); ensureBase(); genAmbient(); initAda(); centerCam(); recomputePop(true); Audio2.voice(opts.voice); };
    S.resize = function () { clampCam(); };
    S.cancelDrag = function () { S.drag = null; S.pan = null; S.trayDrag = null; };
    S.wheel = function (dy) { zoomAt(G.pointer.x, G.pointer.y, dy < 0 ? 1.12 : 0.9); };
    S.onPinch = function (factor, cx, cy) { zoomAt(cx, cy, factor); };
    S.update = function (dt) {
      if (!opts.ada || !S.ada) return;
      const a = S.ada;
      if (S.drag && S.drag.kind === 'ada') { a.moving = false; return; }
      a.wt -= dt;
      if (a.wt <= 0) { a.tx = WW * 0.15 + Math.random() * WW * 0.7; a.ty = WH * (opts.indoor ? 0.58 : 0.5) + Math.random() * WH * 0.36; a.wt = 2.5 + Math.random() * 3.5; }
      const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
      if (d > 4) { const step = Math.min(d, 150 * dt); a.x += dx / d * step; a.y += dy / d * step; if (Math.abs(dx) > 1) a.face = dx > 0 ? 1 : -1; a.moving = true; } else a.moving = false;
    };

    S.down = function (x, y) {
      S._active = null; S.trayDrag = null; S.pan = null;
      for (const b of (S.buttons || [])) if (hit(b, x, y)) { b.pressed = true; S._active = b; return; }
      if (y > vTop() && y < vBot()) {
        const w = s2w(x, y);
        if (opts.ada && S.ada) { const sz = adaSize(); if (Math.abs(w.x - S.ada.x) < sz * 0.34 && w.y > S.ada.y - sz * 0.55 && w.y < S.ada.y + sz * 0.5) { S.drag = { kind: 'ada', dx: w.x - S.ada.x, dy: w.y - S.ada.y, scrX: x, scrY: y }; Audio2.sfx('pop'); return; } }
        const p = pickPlaced(w.x, w.y);
        if (p) { S.drag = { kind: 'placed', p, item: p.item, dx: w.x - p.x, dy: w.y - p.y, scrX: x, scrY: y, sx: x, sy: y }; Audio2.sfx('pop'); return; }
        S.pan = { x, y, camx: S.cam.x, camy: S.cam.y }; return;
      }
      if (y >= trayTop()) {
        for (const t of trayLayout()) if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) { if ((G.save.built[t.id] || 0) > 0) S.drag = { kind: 'tray', item: t.id, scrX: x, scrY: y }; return; }
        S.trayDrag = { sx: x, base: S.trayScroll };
      }
    };
    S.move = function (x, y) {
      if (S.pan) { S.cam.x = S.pan.camx + (x - S.pan.x); S.cam.y = S.pan.camy + (y - S.pan.y); clampCam(); return; }
      if (S.trayDrag) { S.trayScroll = Math.min(0, Math.max(-S.trayMax, S.trayDrag.base + (x - S.trayDrag.sx))); return; }
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
          const entry = { id: G.save.placeSeq++, item: dr.item, x: w.x, y: w.y }; clampWorld(entry);
          if (it.onTop) { const surf = surfaceAt(w.x, w.y, null); if (surf) { entry.onId = surf.id; entry.offx = Math.max(-dispS(surf.item) * 0.28, Math.min(dispS(surf.item) * 0.28, w.x - surf.x)); } }
          G.save.built[dr.item]--; if (G.save.built[dr.item] <= 0) delete G.save.built[dr.item];
          listArr().push(entry); Audio2.sfx(entry.onId ? 'good' : 'place'); recomputePop(false);
        }
      } else if (dr.kind === 'placed') {
        const p = dr.p, moved = Math.hypot(x - dr.sx, y - dr.sy);
        if (p.base && opts.onBaseTap && moved < 14) { opts.onBaseTap(); return; }
        if (p.base && (onTrash || onTray)) { Audio2.sfx('bad'); Eng.floatText(G.W / 2, vTop() + 60, '🏕️ 帐篷是乐园的家，拆不掉哦~', '#e67e22'); Eng.persist(); }
        else if (onTrash || onTray) { childrenOf(p.id).forEach(c => { c.onId = null; }); G.save.built[p.item] = (G.save.built[p.item] || 0) + 1; listArr().splice(listArr().indexOf(p), 1); Audio2.sfx('pop'); Eng.floatText(x, y - 20, '收回了 ' + DATA.ITEMS[p.item].name, '#ff7675'); recomputePop(false); }
        else if (inWorld) { p.onId = null; delete p.offx; if (DATA.ITEMS[p.item].onTop) { const surf = surfaceAt(w.x, w.y, p); if (surf) { p.onId = surf.id; p.offx = Math.max(-dispS(surf.item) * 0.28, Math.min(dispS(surf.item) * 0.28, w.x - surf.x)); Audio2.sfx('good'); } } Audio2.sfx('place'); Eng.persist(); recomputePop(true); }
      }
    };

    S.draw = function (ctx) {
      S.buttons = [];
      const vt = vTop(), vb = vBot();
      // —— 世界层（相机变换 + 裁剪）——
      ctx.save();
      ctx.beginPath(); ctx.rect(0, vt, G.W, vb - vt); ctx.clip();
      ctx.translate(S.cam.x, S.cam.y); ctx.scale(S.cam.s, S.cam.s);
      opts.bg(ctx, WW, WH, S);
      if (opts.showVisitors) DATA.VISITORS.filter(v => G.save.visitors[v.id]).forEach((v, i) => { const t = G.t * 0.25 + i * 1.7, x = WW * 0.5 + Math.cos(t) * WW * 0.3, y = WH * 0.62 + Math.sin(t * 1.3) * WH * 0.28; Sprites.draw(ctx, v.sprite, x, y - Math.abs(Math.sin(G.t * 4 + i)) * 8, 110); });
      listArr().forEach(c => { if (c.onId) { const par = listArr().find(p => p.id === c.onId); if (!par) c.onId = null; else { c.x = par.x + (c.offx || 0); c.y = surfaceTopY(par) - dispS(c.item) * 0.18; } } });
      const roots = listArr().filter(p => !p.onId).sort((a, b) => a.y - b.y), order = [];
      roots.forEach(r => { order.push(r); childrenOf(r.id).sort((a, b) => a.x - b.x).forEach(c => order.push(c)); });
      order.forEach(p => {
        const ds = dsp(p), dragging = S.drag && S.drag.kind === 'placed' && S.drag.p === p;
        if (p.base) { ctx.fillStyle = 'rgba(120,90,50,.18)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + ds * 0.42, ds * 0.62, ds * 0.22, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(214,189,140,.55)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + ds * 0.42, ds * 0.5, ds * 0.17, 0, 0, 7); ctx.fill(); }
        if (!p.onId) { ctx.fillStyle = 'rgba(0,0,0,' + (dragging ? .22 : .14) + ')'; ctx.beginPath(); ctx.ellipse(p.x, p.y + ds * 0.4, ds * 0.32, ds * 0.12, 0, 0, 7); ctx.fill(); }
        Sprites.draw(ctx, DATA.ITEMS[p.item].sprite, p.x, p.y - (dragging ? ds * 0.08 : 0), ds * (dragging ? 1.08 : 1));
        if (p.base) { ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 2; const lw = ds * 0.62, lh = ds * 0.16, lx = p.x - lw / 2, ly = p.y + ds * 0.5; rr(ctx, lx, ly, lw, lh, lh * 0.4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e67e22'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(lh * 0.62) + 'px "PingFang SC",sans-serif'; ctx.fillText('🚪 点我进帐篷', p.x, ly + lh / 2); }
      });
      if (S.drag && S.drag.item && DATA.ITEMS[S.drag.item] && DATA.ITEMS[S.drag.item].onTop) { const wp = s2w(S.drag.scrX, S.drag.scrY); const surf = surfaceAt(wp.x, wp.y, S.drag.kind === 'placed' ? S.drag.p : null); if (surf) { ctx.save(); ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 3; ctx.setLineDash([9, 6]); const w = dispS(surf.item) * 0.5; ctx.strokeRect(surf.x - w, surfaceTopY(surf) - 7, w * 2, 14); ctx.restore(); } }
      if (opts.ada && S.ada) { const sz = adaSize(), dragging = S.drag && S.drag.kind === 'ada'; const hop = (S.ada.moving || dragging) ? Math.abs(Math.sin(G.t * 9)) * sz * 0.05 : 0; drawAda(ctx, S.ada.x, S.ada.y, sz, S.ada.face, hop); }
      ctx.restore();

      // —— 屏幕 UI 层 ——
      if (opts.showVisitors) drawVisitorBar(ctx);
      else { ctx.fillStyle = '#b06a30'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(G.H * 0.04) + 'px "PingFang SC",sans-serif'; ctx.fillText('🏕️ Ada 公主的小帐篷', G.W / 2, vTop() - G.H * 0.025); }
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
      if (!S.drag && !S.pan) { ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(G.H * 0.023) + 'px "PingFang SC",sans-serif'; ctx.fillText(opts.hint, G.W / 2, trayTop() - G.H * 0.02); }

      const bw = Math.min(G.W * 0.2, 156), bh = Math.max(40, G.H * 0.07);
      opts.nav(S, ctx, bw, bh);
      topNav(S, ctx, opts.back);
    };
    return S;
  }

  /* —— 乐园 —— */
  const park = makePlacement({
    listKey: 'placed', voice: 'park_intro', base: true, showVisitors: true, ada: 'park', bg: parkWorldBg, worldW: 2600, worldH: 1500,
    hint: '拖空地平移 · 双指/滚轮缩放 · 拖物品摆放(可叠桌上) · 拖到🗑删除 · 点帐篷进去',
    onBaseTap: () => { Audio2.sfx('place'); Eng.go('tent'); },
    nav: (S, ctx, bw, bh) => {
      const ob = { x: G.W - bw * 2 - 22, y: 12, w: bw, h: bh, label: '🌊 去大海', color: '#2e86de', fs: Math.round(bh * 0.3), onTap: () => Eng.go('ocean', DATA.LEVELS[0]) };
      const cb = { x: G.W - bw - 12, y: 12, w: bw, h: bh, label: '🔨 造东西', color: '#e67e22', fs: Math.round(bh * 0.3), onTap: () => Eng.openCraft() };
      S.buttons.push(ob, cb); btn(ctx, ob); btn(ctx, cb);
    },
  });

  /* —— 帐篷内部 —— */
  const tent = makePlacement({
    listKey: 'tentPlaced', voice: 'tent_intro', base: false, showVisitors: false, ada: 'tent', bg: tentWorldBg, worldW: 2000, worldH: 1300, indoor: true,
    hint: '拖空地平移 · 双指/滚轮缩放 · 把东西拖进来布置 Ada 的家 · 拖到🗑收回',
    back: () => Eng.go('park'),
    nav: (S, ctx, bw, bh) => {
      const ob = { x: G.W - bw * 2 - 22, y: 12, w: bw, h: bh, label: '🌳 出帐篷', color: '#27ae60', fs: Math.round(bh * 0.3), onTap: () => Eng.go('park') };
      const cb = { x: G.W - bw - 12, y: 12, w: bw, h: bh, label: '🔨 造东西', color: '#e67e22', fs: Math.round(bh * 0.3), onTap: () => Eng.openCraft() };
      S.buttons.push(ob, cb); btn(ctx, ob); btn(ctx, cb);
    },
  });

  G.scenes.craft = craft; G.scenes.park = park; G.scenes.tent = tent;
})();
