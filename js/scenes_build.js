/* ===========================================================================
   场景 4/5：回收造物 / 装饰乐园
   =========================================================================== */
(function () {
  const Eng = window.Game, G = Eng.G;
  const rr = Eng.roundRect, btn = Eng.drawButton, hit = Eng.inBtn;

  function canAfford(cost) { for (const k in cost) if ((G.save.mats[k] || 0) < cost[k]) return false; return true; }

  /* 复用 collect 里的导航逻辑：这里各自实现一份精简版 */
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
      // 配方
      const costs = Object.entries(it.cost); const iw = cw * 0.2;
      let tw = costs.length * iw, cx = x + cw / 2 - tw / 2 + iw / 2;
      costs.forEach(([m, n]) => {
        Sprites.draw(ctx, DATA.MATERIALS[m].icon, cx, y + ch * 0.74, iw * 0.95);
        ctx.fillStyle = (G.save.mats[m] || 0) >= n ? '#2d3436' : '#e74c3c';
        ctx.font = 'bold ' + Math.round(cw * 0.11) + 'px "PingFang SC",sans-serif';
        ctx.fillText('×' + n, cx + iw * 0.05, y + ch * 0.86);
        cx += iw;
      });
      // 造按钮
      const bw = cw * 0.7, bh = ch * 0.16, bx = x + (cw - bw) / 2, by = y + ch - bh - 6;
      const b = { x: bx, y: by, w: bw, h: bh, label: ok ? '做!' : '材料不够', color: ok ? '#27ae60' : '#bbb', disabled: !ok, fs: Math.round(bh * 0.55),
        onTap: () => doCraft(id, it, x + cw / 2, y + ch * 0.32) };
      craft.buttons.push(b); btn(ctx, b);
    });
    const rows = Math.ceil(items.length / cols);
    const bh = G.H * 0.09;
    craftMaxScroll = Math.max(0, startY + rows * (ch + gap) + bh + 30 - G.H);  // 给底部固定栏留出滚动余量
    ctx.restore();

    // 滚动条 + 下滑提示
    if (craftMaxScroll > 4) {
      const trackY = top + 10, trackH = G.H - top - bh - 50, tx = G.W - 8;
      ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(180,140,90,.22)';
      ctx.beginPath(); ctx.moveTo(tx, trackY); ctx.lineTo(tx, trackY + trackH); ctx.stroke();
      const frac = -craft.scrollY / craftMaxScroll, thumbH = Math.max(40, trackH * 0.35);
      const thy = trackY + frac * (trackH - thumbH);
      ctx.strokeStyle = '#e6913a'; ctx.beginPath(); ctx.moveTo(tx, thy); ctx.lineTo(tx, thy + thumbH); ctx.stroke();
      if (frac < 0.85) { ctx.fillStyle = 'rgba(230,126,34,.8)'; ctx.textAlign = 'center'; ctx.font = 'bold ' + Math.round(G.H * 0.026) + 'px "PingFang SC",sans-serif'; ctx.fillText('↓ 下滑看更多 ↓', G.W / 2, G.H - bh - 40); }
    }

    // 底部固定栏遮罩（让卡片滚到此处被柔和遮住，固定 CTA 看起来是工具栏）
    const barY = G.H - bh - 26;
    const bgr = ctx.createLinearGradient(0, barY, 0, G.H);
    bgr.addColorStop(0, 'rgba(255,217,176,0)'); bgr.addColorStop(0.45, '#ffd9b0'); bgr.addColorStop(1, '#ffcf9f');
    ctx.fillStyle = bgr; ctx.fillRect(0, barY, G.W, G.H - barY);

    // 底部固定栏：去大海收集 / 去布置乐园（两个直达入口，避免被困）
    const ngap = 12, bw = Math.min(G.W * 0.4, 300), sx = (G.W - (bw * 2 + ngap)) / 2, byb = G.H - bh - 10;
    const goO = { x: sx, y: byb, w: bw, h: bh, label: '🌊 去大海', color: '#2e86de', fs: Math.round(bh * 0.34), onTap: () => Eng.go('ocean', DATA.LEVELS[0]) };
    const goP = { x: sx + bw + ngap, y: byb, w: bw, h: bh, label: '🏡 去布置乐园', color: '#27ae60', fs: Math.round(bh * 0.34), onTap: () => Eng.go('park') };
    craft.buttons.push(goO, goP); btn(ctx, goO); btn(ctx, goP);
    // 返回：回到来时的场景（大海/乐园/菜单）
    const rt = G.returnTo || 'menu';
    const lbl = rt === 'ocean' ? '◀ 回大海' : (rt === 'park' ? '◀ 回乐园' : '◀');
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
     场景：装饰乐园（摆放类）
     ======================================================================= */
  const park = {};
  park.enter = function () { park.drag = null; park.trayScroll = 0; park.trayMax = 0; park._active = null; park.trayDrag = null; recomputePop(true); Audio2.voice('park_intro'); };

  function trayItems() { return Object.keys(DATA.ITEMS).filter(id => (G.save.built[id] || 0) > 0); }
  function groundTop() { return Math.max(46, G.H * 0.075) + 10 + G.H * 0.08; }   // topbar + 访客条
  function trayTop() { return G.H - G.H * 0.18; }
  function baseS() { return G.H * 0.135; }                                       // scale=1 的基准像素
  function dispS(item) { const it = DATA.ITEMS[item]; return baseS() * (it && it.scale ? it.scale : 1); }
  function surfaceTopY(p) { return p.y - dispS(p.item) * 0.16; }                  // 台面顶部 y
  function childrenOf(id) { return G.save.placed.filter(c => c.onId === id); }

  function recomputePop(silent) {
    let pop = 0; G.save.placed.forEach(p => { pop += (DATA.ITEMS[p.item] ? DATA.ITEMS[p.item].charm : 0); });
    G.save.popularity = pop;
    DATA.VISITORS.forEach(v => {
      if (pop >= v.need && !G.save.visitors[v.id]) {
        G.save.visitors[v.id] = true;
        if (!silent) { Audio2.sfx('visitor'); Eng.floatText(G.W / 2, G.H * 0.3, v.name + '来玩啦! 🎉', '#27ae60'); Audio2.voice('visitor'); }
      }
    });
    Eng.persist();
  }

  // 找最上层命中的已摆放物品（小物/子物优先）
  function pickPlaced(x, y) {
    const list = G.save.placed.slice().sort((a, b) => (b.onId ? 1 : 0) - (a.onId ? 1 : 0) || b.y - a.y);
    for (const p of list) { const s = dispS(p.item) * 0.45; if (Math.abs(x - p.x) < s && Math.abs(y - p.y) < s) return p; }
    return null;
  }
  // 找 (x,y) 下方可叠放的台面物品（排除自己）
  function surfaceAt(x, y, self) {
    let best = null;
    G.save.placed.forEach(p => {
      if (p === self || !DATA.ITEMS[p.item].surface) return;
      const w = dispS(p.item) * 0.5, ty = surfaceTopY(p);
      if (Math.abs(x - p.x) < w && y > ty - dispS(p.item) * 0.4 && y < p.y + dispS(p.item) * 0.2) { if (!best || p.y > best.y) best = p; }
    });
    return best;
  }
  function trashZone() { const r = Math.max(44, G.H * 0.07); return { x: G.W / 2 - r * 1.6, y: groundTop() + 6, w: r * 3.2, h: r, r }; }

  park.wheel = function (dy) { park.trayScroll = Math.min(0, Math.max(-park.trayMax, park.trayScroll - dy)); };

  park.down = function (x, y) {
    park._active = null; park.trayDrag = null;
    for (const b of (park.buttons || [])) if (hit(b, x, y)) { b.pressed = true; park._active = b; return; }
    const gT = groundTop(), tT = trayTop();
    // 1) 抓取已摆放的物品
    if (y > gT && y < tT) {
      const p = pickPlaced(x, y);
      if (p) { park.drag = { kind: 'placed', p, item: p.item, dx: x - p.x, dy: y - p.y, x, y }; Audio2.sfx('pop'); return; }
    }
    // 2) 托盘：点物品=取新物；点空白=横向滚动托盘
    if (y >= tT) {
      const tr = trayLayout();
      for (const t of tr) if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) {
        if ((G.save.built[t.id] || 0) > 0) park.drag = { kind: 'tray', item: t.id, x, y };
        return;
      }
      park.trayDrag = { sx: x, base: park.trayScroll };
    }
  };
  park.move = function (x, y) {
    if (park.trayDrag) { park.trayScroll = Math.min(0, Math.max(-park.trayMax, park.trayDrag.base + (x - park.trayDrag.sx))); return; }
    if (!park.drag) return;
    park.drag.x = x; park.drag.y = y;
    if (park.drag.kind === 'placed') {                 // 实时移动，子物跟随
      const p = park.drag.p, gT = groundTop(), tT = trayTop();
      p.x = Math.max(30, Math.min(G.W - 30, x - park.drag.dx));
      p.y = Math.max(gT + 30, Math.min(tT - 20, y - park.drag.dy));
    }
  };
  park.up = function (x, y) {
    const a = park._active; (park.buttons || []).forEach(b => b.pressed = false);
    if (a && hit(a, x, y) && a.onTap) { Audio2.sfx('click'); a.onTap(); park._active = null; park.drag = null; park.trayDrag = null; return; }
    park._active = null; park.trayDrag = null;
    const dr = park.drag; park.drag = null; if (!dr) return;
    const gT = groundTop(), tT = trayTop(), onGround = y > gT && y < tT, onTray = y >= tT;
    const tz = trashZone(), onTrash = x > tz.x && x < tz.x + tz.w && y > tz.y - 10 && y < tz.y + tz.h + 10;

    if (dr.kind === 'tray') {
      if (onGround) {
        const it = DATA.ITEMS[dr.item];
        const px = Math.max(30, Math.min(G.W - 30, x)), py = Math.max(gT + 30, Math.min(tT - 20, y));
        const entry = { id: G.save.placeSeq++, item: dr.item, x: px, y: py };
        if (it.onTop) { const surf = surfaceAt(x, y, null); if (surf) { entry.onId = surf.id; entry.offx = Math.max(-dispS(surf.item) * 0.28, Math.min(dispS(surf.item) * 0.28, x - surf.x)); } }
        G.save.built[dr.item]--; if (G.save.built[dr.item] <= 0) delete G.save.built[dr.item];
        G.save.placed.push(entry);
        Audio2.sfx(entry.onId ? 'good' : 'place'); Eng.burst(px, py, '#feca57', 8); recomputePop(false);
      }
    } else if (dr.kind === 'placed') {
      const p = dr.p;
      if (onTrash || onTray) {                          // 删除/收回该物品(退回库存)，子物落到地面
        childrenOf(p.id).forEach(c => { c.onId = null; });
        G.save.built[p.item] = (G.save.built[p.item] || 0) + 1;
        G.save.placed = G.save.placed.filter(o => o !== p);
        Audio2.sfx('pop'); Eng.floatText(x, y - 20, '收回了 ' + DATA.ITEMS[p.item].name, '#ff7675'); recomputePop(false);
      } else if (onGround) {                            // 落下：小物可吸附到台面
        p.onId = null; delete p.offx;
        if (DATA.ITEMS[p.item].onTop) { const surf = surfaceAt(x, y, p); if (surf) { p.onId = surf.id; p.offx = Math.max(-dispS(surf.item) * 0.28, Math.min(dispS(surf.item) * 0.28, x - surf.x)); Audio2.sfx('good'); } }
        Audio2.sfx('place'); Eng.persist(); recomputePop(true);
      }
    }
  };

  function trayLayout() {
    const ids = trayItems(); const tT = trayTop(), h = G.H * 0.18 - 8;
    const iw = h * 0.92, gap = 10, pad = 12;
    park.trayMax = Math.max(0, pad * 2 + ids.length * (iw + gap) - G.W);
    return ids.map((id, i) => ({ id, x: pad + i * (iw + gap) + park.trayScroll, y: tT + 4, w: iw, h: h - 8 }));
  }

  park.draw = function (ctx) {
    park.buttons = [];
    // 天空 + 草地
    Eng.bg(ctx, '#bdeaff', '#e9ffd6');
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(G.W * 0.88, G.H * 0.12, G.H * 0.05, 0, 7); ctx.fill();
    const gT = groundTop(), tT = trayTop();
    ctx.fillStyle = '#a8e063'; ctx.fillRect(0, gT, G.W, tT - gT);
    // 小路
    ctx.fillStyle = '#f0d9a8'; ctx.beginPath();
    ctx.moveTo(G.W * 0.5 - 40, tT); ctx.quadraticCurveTo(G.W * 0.5, (gT + tT) / 2, G.W * 0.3, gT);
    ctx.lineTo(G.W * 0.3 + 50, gT); ctx.quadraticCurveTo(G.W * 0.5 + 50, (gT + tT) / 2, G.W * 0.5 + 40, tT); ctx.fill();

    // 访客（按人气出现，绕场漫步）
    const vis = DATA.VISITORS.filter(v => G.save.visitors[v.id]);
    vis.forEach((v, i) => {
      const t = G.t * 0.3 + i * 1.7;
      const x = G.W * 0.5 + Math.cos(t) * G.W * 0.32;
      const y = (gT + tT) / 2 + Math.sin(t * 1.3) * (tT - gT) * 0.32;
      Sprites.draw(ctx, v.sprite, x, y - Math.abs(Math.sin(G.t * 4 + i)) * 6, G.H * 0.1);
    });

    // —— 已摆放物品：台面先画、小物叠其上；按 y 景深排序；按 scale 显示相对大小 ——
    G.save.placed.forEach(c => {                       // 子物实时吸附到台面
      if (c.onId) { const par = G.save.placed.find(p => p.id === c.onId); if (!par) c.onId = null; else { c.x = par.x + (c.offx || 0); c.y = surfaceTopY(par) - dispS(c.item) * 0.18; } }
    });
    const roots = G.save.placed.filter(p => !p.onId).sort((a, b) => a.y - b.y);
    const order = [];
    roots.forEach(r => { order.push(r); childrenOf(r.id).sort((a, b) => a.x - b.x).forEach(c => order.push(c)); });
    order.forEach(p => {
      const ds = dispS(p.item), dragging = park.drag && park.drag.kind === 'placed' && park.drag.p === p;
      if (!p.onId) { ctx.fillStyle = 'rgba(0,0,0,' + (dragging ? .22 : .14) + ')'; ctx.beginPath(); ctx.ellipse(p.x, p.y + ds * 0.4, ds * 0.32, ds * 0.12, 0, 0, 7); ctx.fill(); }
      if (dragging) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.32)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; }
      Sprites.draw(ctx, DATA.ITEMS[p.item].sprite, p.x, p.y - (dragging ? ds * 0.08 : 0), ds * (dragging ? 1.08 : 1));
      if (dragging) ctx.restore();
    });
    // 拖小物时高亮可叠放的台面
    if (park.drag && DATA.ITEMS[park.drag.item].onTop) {
      const surf = surfaceAt(park.drag.x, park.drag.y, park.drag.kind === 'placed' ? park.drag.p : null);
      if (surf) { ctx.save(); ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 3; ctx.setLineDash([9, 6]); const w = dispS(surf.item) * 0.5; ctx.strokeRect(surf.x - w, surfaceTopY(surf) - 7, w * 2, 14); ctx.restore(); }
    }

    // 顶部访客/人气条
    drawVisitorBar(ctx);

    // 删除区（拖动已摆放物时出现）
    if (park.drag && park.drag.kind === 'placed') {
      const tz = trashZone(), hot = park.drag.x > tz.x && park.drag.x < tz.x + tz.w && park.drag.y > tz.y - 10 && park.drag.y < tz.y + tz.h + 10;
      rr(ctx, tz.x, tz.y, tz.w, tz.h, tz.h * 0.4); ctx.fillStyle = hot ? 'rgba(231,76,60,.96)' : 'rgba(231,76,60,.72)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.setLineDash(hot ? [] : [7, 5]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(tz.h * 0.36) + 'px "PingFang SC",sans-serif';
      ctx.fillText('🗑 ' + (hot ? '松手删除!' : '拖到这里删除'), tz.x + tz.w / 2, tz.y + tz.h / 2);
    }

    // 托盘背景
    rr(ctx, 6, tT, G.W - 12, G.H * 0.18 - 6, 16); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();
    const ids = trayItems();
    if (ids.length === 0) {
      ctx.fillStyle = '#7f8c8d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.round(G.H * 0.03) + 'px "PingFang SC",sans-serif';
      ctx.fillText('还没有造好的东西～ 先去「造东西」吧', G.W / 2, tT + G.H * 0.09);
    } else {
      trayLayout().forEach(t => {
        rr(ctx, t.x, t.y, t.w, t.h, 12); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#27ae60'; ctx.stroke();
        Sprites.draw(ctx, DATA.ITEMS[t.id].sprite, t.x + t.w / 2, t.y + t.h * 0.42, t.w * 0.62);
        ctx.fillStyle = '#27ae60'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold ' + Math.round(t.w * 0.18) + 'px "PingFang SC",sans-serif';
        ctx.fillText(DATA.ITEMS[t.id].name + ' ×' + (G.save.built[t.id] || 0), t.x + t.w / 2, t.y + t.h * 0.85);
      });
    }

    // 从托盘拖出的新物品 ghost（已摆放物已在上方实时绘制）
    if (park.drag && park.drag.kind === 'tray') {
      const ds = dispS(park.drag.item);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.32)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
      Sprites.draw(ctx, DATA.ITEMS[park.drag.item].sprite, park.drag.x, park.drag.y, ds * 1.05);
      ctx.restore();
    }
    // 托盘可左右滑动提示
    if (park.trayMax > 4 && !park.drag) { ctx.fillStyle = 'rgba(39,174,96,.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(G.H * 0.022) + 'px "PingFang SC",sans-serif'; ctx.fillText('← 左右滑动看更多 →', G.W / 2, tT + G.H * 0.005); }

    // 提示
    if (ids.length > 0 && !park.drag) {
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.round(G.H * 0.025) + 'px "PingFang SC",sans-serif';
      ctx.fillText('拖到草地摆放 · 杯子茶壶可放桌上 · 拖住已摆好的东西可移动或删除', G.W / 2, tT - G.H * 0.022);
    }

    // 顶部按钮：去大海收集 / 造东西 / 返回（互相直达，避免被困）
    const bw = Math.min(G.W * 0.2, 156), bh = Math.max(40, G.H * 0.07);
    const ob = { x: G.W - bw * 2 - 22, y: 12, w: bw, h: bh, label: '🌊 去大海', color: '#2e86de', fs: Math.round(bh * 0.3), onTap: () => Eng.go('ocean', DATA.LEVELS[0]) };
    const cb = { x: G.W - bw - 12, y: 12, w: bw, h: bh, label: '🔨 造东西', color: '#e67e22', fs: Math.round(bh * 0.3), onTap: () => Eng.openCraft() };
    park.buttons.push(ob, cb); btn(ctx, ob); btn(ctx, cb);
    topNav(park, ctx);
  };

  function VISBAR_RIGHT() { return Math.min(G.W * 0.2, 156) * 2 + 34; }
  function drawVisitorBar(ctx) {
    const s = Math.max(46, G.H * 0.075), pad = 10, y = 12, h = G.H * 0.075;
    const bx = pad + s + 60;   // 给左上返回键让位
    const bw = G.W - bx - VISBAR_RIGHT();
    rr(ctx, bx, y, Math.max(120, bw), h, 14); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + Math.round(h * 0.42) + 'px "PingFang SC",sans-serif';
    ctx.fillStyle = '#e67e22';
    ctx.fillText('🌟人气 ' + G.save.popularity, bx + 12, y + h / 2);
    // 访客头像（已来彩色，未来灰色+所需人气）
    let vx = bx + 12 + h * 2.4;
    DATA.VISITORS.forEach(v => {
      const has = G.save.visitors[v.id];
      ctx.globalAlpha = has ? 1 : 0.35;
      Sprites.draw(ctx, v.sprite, vx + h * 0.4, y + h / 2, h * 0.8);
      ctx.globalAlpha = 1;
      if (!has) { ctx.fillStyle = '#888'; ctx.font = 'bold ' + Math.round(h * 0.3) + 'px "PingFang SC",sans-serif'; ctx.fillText(v.need, vx + h * 0.4, y + h * 0.82); }
      vx += h * 0.95;
    });
  }

  G.scenes.craft = craft; G.scenes.park = park;
})();
