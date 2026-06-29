/* ===========================================================================
   场景：回收造物 / 装饰乐园 / 帐篷内部（乐园与帐篷共用一套摆放引擎）
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
      if (y > G.H || y + ch < top) return;            // 视口裁剪
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
     共用：人气结算（乐园 + 帐篷内 都算）/ 访客条 / Ada 公主
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
  // Ada 公主：整个乐园和帐篷的主人
  function drawAda(ctx, x, y, size) {
    const t = G.t, bob = Math.sin(t * 2) * size * 0.05;
    ctx.fillStyle = 'rgba(255,228,120,.95)';
    for (let i = 0; i < 3; i++) { const a = t * 1.6 + i * 2.1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * size * 0.55, y - size * 0.25 + Math.sin(a) * size * 0.3, size * 0.04, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(x, y + size * 0.42, size * 0.3, size * 0.1, 0, 0, 7); ctx.fill();
    Sprites.draw(ctx, 'ada', x, y + bob, size);
    const lw = size * 0.82, lh = size * 0.2, lx = x - lw / 2, ly = y + size * 0.44;
    rr(ctx, lx, ly, lw, lh, lh * 0.5); ctx.fillStyle = '#fff6fb'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#e84393'; ctx.stroke();
    ctx.fillStyle = '#e84393'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(lh * 0.62) + 'px "PingFang SC",sans-serif';
    ctx.fillText('👑 Ada 公主', x, ly + lh / 2 + 1);
  }

  /* =======================================================================
     背景：乐园草地 / 帐篷内部
     ======================================================================= */
  function parkBg(ctx, gT, tT) {
    Eng.bg(ctx, '#bdeaff', '#e9ffd6');
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(G.W * 0.88, G.H * 0.12, G.H * 0.05, 0, 7); ctx.fill();
    ctx.fillStyle = '#a8e063'; ctx.fillRect(0, gT, G.W, tT - gT);
    ctx.fillStyle = '#f0d9a8'; ctx.beginPath();
    ctx.moveTo(G.W * 0.5 - 40, tT); ctx.quadraticCurveTo(G.W * 0.5, (gT + tT) / 2, G.W * 0.3, gT);
    ctx.lineTo(G.W * 0.3 + 50, gT); ctx.quadraticCurveTo(G.W * 0.5 + 50, (gT + tT) / 2, G.W * 0.5 + 40, tT); ctx.fill();
  }
  function tentBg(ctx, gT, tT) {
    const g = ctx.createLinearGradient(0, 0, 0, G.H); g.addColorStop(0, '#ffe9c7'); g.addColorStop(1, '#eebd86');
    ctx.fillStyle = g; ctx.fillRect(0, 0, G.W, G.H);
    const peakY = gT - G.H * 0.02;
    // 帐篷布条纹
    for (let i = 0; i <= 10; i++) { const fx = G.W * (0.06 + i * 0.088); ctx.globalAlpha = 0.16; ctx.strokeStyle = i % 2 ? '#e8915a' : '#fff0d6'; ctx.lineWidth = G.W * 0.05; ctx.beginPath(); ctx.moveTo(G.W * 0.5, peakY); ctx.lineTo(fx, tT); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // 骨架
    ctx.strokeStyle = 'rgba(150,95,50,.55)'; ctx.lineWidth = Math.max(6, G.H * 0.012);
    ctx.beginPath(); ctx.moveTo(G.W * 0.5, peakY); ctx.lineTo(G.W * 0.06, tT); ctx.moveTo(G.W * 0.5, peakY); ctx.lineTo(G.W * 0.94, tT); ctx.stroke();
    // 地板 + 圆地毯
    ctx.fillStyle = '#c8a064'; ctx.fillRect(0, tT - G.H * 0.14, G.W, G.H * 0.14);
    ctx.fillStyle = '#df7a7a'; ctx.beginPath(); ctx.ellipse(G.W * 0.5, tT - G.H * 0.05, G.W * 0.3, G.H * 0.055, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f0a0a0'; ctx.beginPath(); ctx.ellipse(G.W * 0.5, tT - G.H * 0.05, G.W * 0.21, G.H * 0.038, 0, 0, 7); ctx.fill();
    // 吊灯 + 暖光
    ctx.strokeStyle = 'rgba(120,80,40,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(G.W * 0.5, peakY); ctx.lineTo(G.W * 0.5, gT + G.H * 0.04); ctx.stroke();
    ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(G.W * 0.5, gT + G.H * 0.05, G.H * 0.022, 0, 7); ctx.fill();
    const rg = ctx.createRadialGradient(G.W * 0.5, gT + G.H * 0.05, 0, G.W * 0.5, gT + G.H * 0.05, G.H * 0.45);
    rg.addColorStop(0, 'rgba(255,240,180,.4)'); rg.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, G.W, G.H);
  }

  /* =======================================================================
     摆放引擎工厂：乐园 / 帐篷内部 共用
     ======================================================================= */
  function makePlacement(opts) {
    const S = { buttons: [] };
    const listArr = () => G.save[opts.listKey];
    function trayItems() { return Object.keys(DATA.ITEMS).filter(id => (G.save.built[id] || 0) > 0); }
    function groundTop() { return Math.max(46, G.H * 0.075) + 10 + G.H * 0.08; }
    function trayTop() { return G.H - G.H * 0.18; }
    function baseS() { return G.H * 0.135; }
    function dispS(item) { const it = DATA.ITEMS[item]; return baseS() * (it && it.scale ? it.scale : 1); }
    function dsp(p) { return dispS(p.item) * (p.base ? 1.35 : 1); }
    function surfaceTopY(p) { return p.y - dispS(p.item) * 0.16; }
    function childrenOf(id) { return listArr().filter(c => c.onId === id); }
    function ensureBase() {
      if (!opts.base || listArr().some(p => p.base)) return;
      const gT = groundTop(), tT = trayTop();
      listArr().unshift({ id: G.save.placeSeq++, item: 'tent', base: true, x: G.W * 0.5, y: (gT + tT) * 0.5 + (tT - gT) * 0.1 });
      Eng.persist();
    }
    function pickPlaced(x, y) {
      const arr = listArr().slice().sort((a, b) => (b.onId ? 1 : 0) - (a.onId ? 1 : 0) || b.y - a.y);
      for (const p of arr) { const s = dsp(p) * 0.45; if (Math.abs(x - p.x) < s && Math.abs(y - p.y) < s) return p; }
      return null;
    }
    function surfaceAt(x, y, self) {
      let best = null;
      listArr().forEach(p => {
        if (p === self || !DATA.ITEMS[p.item].surface) return;
        const w = dispS(p.item) * 0.5, ty = surfaceTopY(p);
        if (Math.abs(x - p.x) < w && y > ty - dispS(p.item) * 0.4 && y < p.y + dispS(p.item) * 0.2) { if (!best || p.y > best.y) best = p; }
      });
      return best;
    }
    function trashZone() { const r = Math.max(44, G.H * 0.07); return { x: G.W / 2 - r * 1.6, y: groundTop() + 6, w: r * 3.2, h: r, r }; }
    function trayLayout() {
      const ids = trayItems(); const tT = trayTop(), h = G.H * 0.18 - 8, iw = h * 0.92, gap = 10, pad = 12;
      S.trayMax = Math.max(0, pad * 2 + ids.length * (iw + gap) - G.W);
      return ids.map((id, i) => ({ id, x: pad + i * (iw + gap) + S.trayScroll, y: tT + 4, w: iw, h: h - 8 }));
    }

    S.enter = function () { S.drag = null; S.trayScroll = 0; S.trayMax = 0; S._active = null; S.trayDrag = null; ensureBase(); recomputePop(true); Audio2.voice(opts.voice); };
    S.wheel = function (dy) { S.trayScroll = Math.min(0, Math.max(-S.trayMax, S.trayScroll - dy)); };

    S.down = function (x, y) {
      S._active = null; S.trayDrag = null;
      for (const b of (S.buttons || [])) if (hit(b, x, y)) { b.pressed = true; S._active = b; return; }
      const gT = groundTop(), tT = trayTop();
      if (y > gT && y < tT) {
        const p = pickPlaced(x, y);
        if (p) { S.drag = { kind: 'placed', p, item: p.item, dx: x - p.x, dy: y - p.y, x, y, sx: x, sy: y }; Audio2.sfx('pop'); return; }
      }
      if (y >= tT) {
        for (const t of trayLayout()) if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) {
          if ((G.save.built[t.id] || 0) > 0) S.drag = { kind: 'tray', item: t.id, x, y };
          return;
        }
        S.trayDrag = { sx: x, base: S.trayScroll };
      }
    };
    S.move = function (x, y) {
      if (S.trayDrag) { S.trayScroll = Math.min(0, Math.max(-S.trayMax, S.trayDrag.base + (x - S.trayDrag.sx))); return; }
      if (!S.drag) return;
      S.drag.x = x; S.drag.y = y;
      if (S.drag.kind === 'placed') {
        const p = S.drag.p, gT = groundTop(), tT = trayTop();
        p.x = Math.max(30, Math.min(G.W - 30, x - S.drag.dx));
        p.y = Math.max(gT + 30, Math.min(tT - 20, y - S.drag.dy));
      }
    };
    S.up = function (x, y) {
      const a = S._active; (S.buttons || []).forEach(b => b.pressed = false);
      if (a && hit(a, x, y) && a.onTap) { Audio2.sfx('click'); a.onTap(); S._active = null; S.drag = null; S.trayDrag = null; return; }
      S._active = null; S.trayDrag = null;
      const dr = S.drag; S.drag = null; if (!dr) return;
      const gT = groundTop(), tT = trayTop(), onGround = y > gT && y < tT, onTray = y >= tT;
      const tz = trashZone(), onTrash = x > tz.x && x < tz.x + tz.w && y > tz.y - 10 && y < tz.y + tz.h + 10;

      if (dr.kind === 'tray') {
        if (onGround) {
          const it = DATA.ITEMS[dr.item];
          const px = Math.max(30, Math.min(G.W - 30, x)), py = Math.max(gT + 30, Math.min(tT - 20, y));
          const entry = { id: G.save.placeSeq++, item: dr.item, x: px, y: py };
          if (it.onTop) { const surf = surfaceAt(x, y, null); if (surf) { entry.onId = surf.id; entry.offx = Math.max(-dispS(surf.item) * 0.28, Math.min(dispS(surf.item) * 0.28, x - surf.x)); } }
          G.save.built[dr.item]--; if (G.save.built[dr.item] <= 0) delete G.save.built[dr.item];
          listArr().push(entry);
          Audio2.sfx(entry.onId ? 'good' : 'place'); Eng.burst(px, py, '#feca57', 8); recomputePop(false);
        }
      } else if (dr.kind === 'placed') {
        const p = dr.p, moved = Math.hypot(x - dr.sx, y - dr.sy);
        if (p.base && opts.onBaseTap && moved < 14) { opts.onBaseTap(); return; }   // 轻点帐篷=进去
        if (p.base && (onTrash || onTray)) {
          p.y = Math.max(gT + 40, Math.min(tT - 30, p.y));
          Audio2.sfx('bad'); Eng.floatText(G.W / 2, gT + 60, '🏕️ 帐篷是乐园的家，拆不掉哦~', '#e67e22'); Eng.persist();
        } else if (onTrash || onTray) {
          childrenOf(p.id).forEach(c => { c.onId = null; });
          G.save.built[p.item] = (G.save.built[p.item] || 0) + 1;
          listArr().splice(listArr().indexOf(p), 1);
          Audio2.sfx('pop'); Eng.floatText(x, y - 20, '收回了 ' + DATA.ITEMS[p.item].name, '#ff7675'); recomputePop(false);
        } else if (onGround) {
          p.onId = null; delete p.offx;
          if (DATA.ITEMS[p.item].onTop) { const surf = surfaceAt(x, y, p); if (surf) { p.onId = surf.id; p.offx = Math.max(-dispS(surf.item) * 0.28, Math.min(dispS(surf.item) * 0.28, x - surf.x)); Audio2.sfx('good'); } }
          Audio2.sfx('place'); Eng.persist(); recomputePop(true);
        }
      }
    };

    S.draw = function (ctx) {
      S.buttons = [];
      const gT = groundTop(), tT = trayTop();
      opts.bg(ctx, gT, tT);

      // 访客（仅乐园）
      if (opts.showVisitors) {
        DATA.VISITORS.filter(v => G.save.visitors[v.id]).forEach((v, i) => {
          const t = G.t * 0.3 + i * 1.7, x = G.W * 0.5 + Math.cos(t) * G.W * 0.32, y = (gT + tT) / 2 + Math.sin(t * 1.3) * (tT - gT) * 0.32;
          Sprites.draw(ctx, v.sprite, x, y - Math.abs(Math.sin(G.t * 4 + i)) * 6, G.H * 0.1);
        });
      }

      // 子物吸附到台面
      listArr().forEach(c => { if (c.onId) { const par = listArr().find(p => p.id === c.onId); if (!par) c.onId = null; else { c.x = par.x + (c.offx || 0); c.y = surfaceTopY(par) - dispS(c.item) * 0.18; } } });
      const roots = listArr().filter(p => !p.onId).sort((a, b) => a.y - b.y);
      const order = [];
      roots.forEach(r => { order.push(r); childrenOf(r.id).sort((a, b) => a.x - b.x).forEach(c => order.push(c)); });
      order.forEach(p => {
        const ds = dsp(p), dragging = S.drag && S.drag.kind === 'placed' && S.drag.p === p;
        if (p.base) {
          ctx.fillStyle = 'rgba(120,90,50,.18)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + ds * 0.42, ds * 0.62, ds * 0.22, 0, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(214,189,140,.55)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + ds * 0.42, ds * 0.5, ds * 0.17, 0, 0, 7); ctx.fill();
        }
        if (!p.onId) { ctx.fillStyle = 'rgba(0,0,0,' + (dragging ? .22 : .14) + ')'; ctx.beginPath(); ctx.ellipse(p.x, p.y + ds * 0.4, ds * 0.32, ds * 0.12, 0, 0, 7); ctx.fill(); }
        if (dragging) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.32)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; }
        Sprites.draw(ctx, DATA.ITEMS[p.item].sprite, p.x, p.y - (dragging ? ds * 0.08 : 0), ds * (dragging ? 1.08 : 1));
        if (dragging) ctx.restore();
        if (p.base) {                                   // 招牌 + 进入提示
          ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 2;
          const lw = ds * 0.62, lh = ds * 0.16, lx = p.x - lw / 2, ly = p.y + ds * 0.5;
          rr(ctx, lx, ly, lw, lh, lh * 0.4); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#e67e22'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(lh * 0.62) + 'px "PingFang SC",sans-serif';
          ctx.fillText('🚪 点我进帐篷', p.x, ly + lh / 2);
        }
      });
      // 叠放高亮
      if (S.drag && DATA.ITEMS[S.drag.item].onTop) {
        const surf = surfaceAt(S.drag.x, S.drag.y, S.drag.kind === 'placed' ? S.drag.p : null);
        if (surf) { ctx.save(); ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 3; ctx.setLineDash([9, 6]); const w = dispS(surf.item) * 0.5; ctx.strokeRect(surf.x - w, surfaceTopY(surf) - 7, w * 2, 14); ctx.restore(); }
      }

      // Ada 公主
      if (opts.ada === 'park') { const base = listArr().find(p => p.base); const ax = base ? base.x - dsp(base) * 0.62 : G.W * 0.3, ay = base ? base.y + dsp(base) * 0.12 : (gT + tT) / 2; drawAda(ctx, ax, ay, G.H * 0.12); }
      else if (opts.ada === 'tent') { drawAda(ctx, G.W * 0.5, tT - G.H * 0.085, G.H * 0.15); }

      // 顶部条 / 删除区
      if (opts.showVisitors) drawVisitorBar(ctx);
      else { ctx.fillStyle = '#b06a30'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(G.H * 0.04) + 'px "PingFang SC",sans-serif'; ctx.fillText('🏕️ Ada 公主的小帐篷', G.W / 2, gT - G.H * 0.025); }

      if (S.drag && S.drag.kind === 'placed' && !S.drag.p.base) {
        const tz = trashZone(), hot = S.drag.x > tz.x && S.drag.x < tz.x + tz.w && S.drag.y > tz.y - 10 && S.drag.y < tz.y + tz.h + 10;
        rr(ctx, tz.x, tz.y, tz.w, tz.h, tz.h * 0.4); ctx.fillStyle = hot ? 'rgba(231,76,60,.96)' : 'rgba(231,76,60,.72)'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.setLineDash(hot ? [] : [7, 5]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(tz.h * 0.36) + 'px "PingFang SC",sans-serif';
        ctx.fillText('🗑 ' + (hot ? '松手删除!' : '拖到这里删除'), tz.x + tz.w / 2, tz.y + tz.h / 2);
      }

      // 托盘
      rr(ctx, 6, tT, G.W - 12, G.H * 0.18 - 6, 16); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();
      const ids = trayItems();
      if (ids.length === 0) {
        ctx.fillStyle = '#7f8c8d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(G.H * 0.03) + 'px "PingFang SC",sans-serif';
        ctx.fillText('还没有造好的东西～ 先去「造东西」吧', G.W / 2, tT + G.H * 0.09);
      } else {
        trayLayout().forEach(t => {
          rr(ctx, t.x, t.y, t.w, t.h, 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#27ae60'; ctx.stroke();
          Sprites.draw(ctx, DATA.ITEMS[t.id].sprite, t.x + t.w / 2, t.y + t.h * 0.42, t.w * 0.62);
          ctx.fillStyle = '#27ae60'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(t.w * 0.18) + 'px "PingFang SC",sans-serif';
          ctx.fillText(DATA.ITEMS[t.id].name + ' ×' + (G.save.built[t.id] || 0), t.x + t.w / 2, t.y + t.h * 0.85);
        });
      }
      if (S.drag && S.drag.kind === 'tray') {
        const ds = dispS(S.drag.item); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.32)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
        Sprites.draw(ctx, DATA.ITEMS[S.drag.item].sprite, S.drag.x, S.drag.y, ds * 1.05); ctx.restore();
      }
      if (S.trayMax > 4 && !S.drag) { ctx.fillStyle = 'rgba(39,174,96,.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(G.H * 0.022) + 'px "PingFang SC",sans-serif'; ctx.fillText('← 左右滑动看更多 →', G.W / 2, tT + G.H * 0.005); }
      if (ids.length > 0 && !S.drag) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(G.H * 0.025) + 'px "PingFang SC",sans-serif'; ctx.fillText(opts.hint, G.W / 2, tT - G.H * 0.022); }

      // 顶部导航按钮
      const bw = Math.min(G.W * 0.2, 156), bh = Math.max(40, G.H * 0.07);
      opts.nav(S, ctx, bw, bh);
      topNav(S, ctx, opts.back);
    };
    return S;
  }

  /* —— 乐园 —— */
  const park = makePlacement({
    listKey: 'placed', voice: 'park_intro', base: true, showVisitors: true, ada: 'park', bg: parkBg,
    hint: '拖到草地摆放 · 杯子茶壶可放桌上 · 拖住已摆好的可移动或删除 · 点帐篷进去玩',
    onBaseTap: () => { Audio2.sfx('place'); Eng.go('tent'); },
    nav: (S, ctx, bw, bh) => {
      const ob = { x: G.W - bw * 2 - 22, y: 12, w: bw, h: bh, label: '🌊 去大海', color: '#2e86de', fs: Math.round(bh * 0.3), onTap: () => Eng.go('ocean', DATA.LEVELS[0]) };
      const cb = { x: G.W - bw - 12, y: 12, w: bw, h: bh, label: '🔨 造东西', color: '#e67e22', fs: Math.round(bh * 0.3), onTap: () => Eng.openCraft() };
      S.buttons.push(ob, cb); btn(ctx, ob); btn(ctx, cb);
    },
  });

  /* —— 帐篷内部 —— */
  const tent = makePlacement({
    listKey: 'tentPlaced', voice: 'tent_intro', base: false, showVisitors: false, ada: 'tent', bg: tentBg,
    hint: '把东西拖进帐篷布置 Ada 的家 · 杯子茶壶可放桌上 · 拖住可移动或删除',
    back: () => Eng.go('park'),
    nav: (S, ctx, bw, bh) => {
      const ob = { x: G.W - bw * 2 - 22, y: 12, w: bw, h: bh, label: '🌳 出帐篷', color: '#27ae60', fs: Math.round(bh * 0.3), onTap: () => Eng.go('park') };
      const cb = { x: G.W - bw - 12, y: 12, w: bw, h: bh, label: '🔨 造东西', color: '#e67e22', fs: Math.round(bh * 0.3), onTap: () => Eng.openCraft() };
      S.buttons.push(ob, cb); btn(ctx, ob); btn(ctx, cb);
    },
  });

  G.scenes.craft = craft; G.scenes.park = park; G.scenes.tent = tent;
})();
