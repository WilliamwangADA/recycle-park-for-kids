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

    // 底部固定栏遮罩（让卡片滚到此处被柔和遮住，固定 CTA 看起来是工具栏）
    const barY = G.H - bh - 26;
    const bgr = ctx.createLinearGradient(0, barY, 0, G.H);
    bgr.addColorStop(0, 'rgba(255,217,176,0)'); bgr.addColorStop(0.45, '#ffd9b0'); bgr.addColorStop(1, '#ffcf9f');
    ctx.fillStyle = bgr; ctx.fillRect(0, barY, G.W, G.H - barY);

    // 去布置按钮（固定底部）
    const bw = Math.min(G.W * 0.5, 320);
    const goP = { x: (G.W - bw) / 2, y: G.H - bh - 10, w: bw, h: bh, label: '🏡 去布置乐园', color: '#27ae60', fs: Math.round(bh * 0.34), onTap: () => Eng.go('park') };
    craft.buttons.push(goP); btn(ctx, goP);
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
  park.enter = function () { park.drag = null; park.trayScroll = 0; park._active = null; recomputePop(true); Audio2.voice('park_intro'); };

  function trayItems() { return Object.keys(DATA.ITEMS).filter(id => (G.save.built[id] || 0) > 0); }
  function groundTop() { return Math.max(46, G.H * 0.075) + 10 + G.H * 0.08; }   // topbar + 访客条
  function trayTop() { return G.H - G.H * 0.18; }

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

  park.down = function (x, y) {
    park._active = null;
    for (const b of (park.buttons || [])) if (hit(b, x, y)) { b.pressed = true; park._active = b; return; }
    // 1) 抓取已摆放的物品（从上层往下找）
    const gT = groundTop(), tT = trayTop();
    if (y > gT && y < tT) {
      for (let i = G.save.placed.length - 1; i >= 0; i--) {
        const p = G.save.placed[i], s = G.H * 0.12;
        if (Math.abs(x - p.x) < s * 0.5 && Math.abs(y - p.y) < s * 0.5) {
          park.drag = { kind: 'placed', idx: i, item: p.item, x, y }; return;
        }
      }
    }
    // 2) 从托盘抓新物品
    const tr = trayLayout();
    for (const t of tr) if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) {
      if ((G.save.built[t.id] || 0) > 0) { park.drag = { kind: 'tray', item: t.id, x, y }; }
      return;
    }
  };
  park.move = function (x, y) { if (park.drag) { park.drag.x = x; park.drag.y = y; } };
  park.up = function (x, y) {
    const a = park._active; (park.buttons || []).forEach(b => b.pressed = false);
    if (a && hit(a, x, y) && a.onTap) { Audio2.sfx('click'); a.onTap(); park._active = null; park.drag = null; return; }
    park._active = null;
    const dr = park.drag; park.drag = null; if (!dr) return;
    const gT = groundTop(), tT = trayTop();
    const onGround = y > gT && y < tT;
    const onTray = y >= tT;
    if (dr.kind === 'tray') {
      if (onGround) {
        G.save.built[dr.item]--; if (G.save.built[dr.item] <= 0) delete G.save.built[dr.item];
        G.save.placed.push({ item: dr.item, x: Math.max(40, Math.min(G.W - 40, x)), y: Math.max(gT + 30, Math.min(tT - 20, y)) });
        Audio2.sfx('place'); Eng.burst(x, y, '#feca57', 8); recomputePop(false);
      }
    } else if (dr.kind === 'placed') {
      const p = G.save.placed[dr.idx];
      if (onTray) {                                   // 拖回托盘 = 收回（材料退回成品）
        G.save.built[p.item] = (G.save.built[p.item] || 0) + 1;
        G.save.placed.splice(dr.idx, 1); Audio2.sfx('pop'); recomputePop(false);
      } else if (onGround) {
        p.x = Math.max(40, Math.min(G.W - 40, x)); p.y = Math.max(gT + 30, Math.min(tT - 20, y));
        Audio2.sfx('place'); Eng.persist();
      }
    }
  };

  function trayLayout() {
    const ids = trayItems(); const tT = trayTop(), h = G.H * 0.18 - 8;
    const iw = h * 0.92, gap = 10, pad = 12;
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

    // 已摆放物品（按 y 排序做前后遮挡）
    const placed = G.save.placed.map((p, i) => ({ p, i })).sort((a, b) => a.p.y - b.p.y);
    placed.forEach(({ p, i }) => {
      if (park.drag && park.drag.kind === 'placed' && park.drag.idx === i) return;
      // 影子
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + G.H * 0.05, G.H * 0.05, G.H * 0.018, 0, 0, 7); ctx.fill();
      Sprites.draw(ctx, DATA.ITEMS[p.item].sprite, p.x, p.y, G.H * 0.12);
    });

    // 顶部访客/人气条
    drawVisitorBar(ctx);

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

    // 正在拖拽的物品
    if (park.drag) Sprites.draw(ctx, DATA.ITEMS[park.drag.item].sprite, park.drag.x, park.drag.y, G.H * 0.14);

    // 提示
    if (ids.length > 0 && !park.drag) {
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.round(G.H * 0.026) + 'px "PingFang SC",sans-serif';
      ctx.fillText('把下面的东西拖到草地上摆好看～ 越漂亮来的小伙伴越多!', G.W / 2, tT - G.H * 0.02);
    }

    // 顶部按钮：造东西 / 返回
    const bw = Math.min(G.W * 0.32, 200), bh = Math.max(40, G.H * 0.07);
    const cb = { x: G.W - bw - 12, y: 12, w: bw, h: bh, label: '🔨 造东西', color: '#e67e22', fs: Math.round(bh * 0.32), onTap: () => Eng.openCraft() };
    park.buttons.push(cb); btn(ctx, cb);
    topNav(park, ctx);
  };

  function drawVisitorBar(ctx) {
    const s = Math.max(46, G.H * 0.075), pad = 10, y = 12, h = G.H * 0.075;
    const bx = pad + s + 60;   // 给左上返回键让位
    const bw = G.W - bx - (Math.min(G.W * 0.32, 200) + 24);
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
