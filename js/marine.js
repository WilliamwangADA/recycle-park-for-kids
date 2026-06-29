/* ===========================================================================
   回收乐园 · 海洋渲染引擎（动画升级）
   提供：会摆尾游动的程序化鱼/水母、水下焦散光网、流动光柱、景深雾、暗角。
   重的模糊纹理预烘焙到离屏 canvas，每帧只做廉价 blit + 偏移，保证流畅。
   =========================================================================== */
window.Marine = (function () {
  let causT = null, rayT = null, cw = 0, ch = 0;

  function offscreen(w, h) { const c = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h }); c.width = w; c.height = h; return c; }

  /* 焦散光网纹理：可平铺的柔软亮斑网格 */
  function buildCaustics(size) {
    const c = offscreen(size, size), g = c.getContext('2d');
    g.clearRect(0, 0, size, size);
    g.globalCompositeOperation = 'lighter';
    const cells = 5, step = size / cells;
    for (let i = -1; i <= cells; i++) for (let j = -1; j <= cells; j++) {
      const x = (i + (j % 2 ? 0.5 : 0)) * step + (Math.sin(i * 3 + j) * step * 0.2);
      const y = (j + 0.5) * step + (Math.cos(i + j * 2) * step * 0.2);
      const r = step * (0.5 + 0.25 * Math.sin(i * 2 + j * 3));
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(255,255,255,0.9)'); rg.addColorStop(0.5, 'rgba(220,245,255,0.25)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    return c;
  }

  /* 一束柔光柱纹理（竖直，已模糊）*/
  function buildRay(w, h) {
    const c = offscreen(w, h), g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, 'rgba(225,250,255,0.55)'); grd.addColorStop(1, 'rgba(225,250,255,0)');
    g.fillStyle = grd; g.beginPath(); g.moveTo(w * 0.36, 0); g.lineTo(w * 0.64, 0); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    // 模糊
    try { const c2 = offscreen(w, h), g2 = c2.getContext('2d'); g2.filter = 'blur(' + Math.round(w * 0.12) + 'px)'; g2.drawImage(c, 0, 0); return c2; } catch (e) { return c; }
  }

  function init(W, H) { cw = W; ch = H; causT = buildCaustics(360); rayT = buildRay(Math.round(W * 0.22), H); }

  /* 流动光柱（叠加 'lighter'）*/
  function rays(ctx, W, H, t) {
    if (!rayT) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const rw = rayT.width;
    for (let i = 0; i < 4; i++) {
      const x = (i * 0.27 + 0.04) * W + Math.sin(t * 0.25 + i * 1.7) * W * 0.03 - rw / 2;
      ctx.globalAlpha = 0.10 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.6 + i));
      ctx.save(); ctx.translate(x + rw / 2, 0); ctx.rotate((i - 1.5) * 0.04); ctx.translate(-(x + rw / 2), 0);
      ctx.drawImage(rayT, x, -10, rw, H + 20); ctx.restore();
    }
    ctx.restore();
  }

  /* 焦散光：整屏铺纹理，两层不同速度/缩放，营造水下波光（叠加在场景之上）*/
  function caustics(ctx, W, H, t, alpha, comp) {
    if (!causT) return;
    ctx.save(); ctx.globalCompositeOperation = comp || 'overlay';
    const s = causT.width;
    const draw = (scale, dx, dy, a) => {
      ctx.globalAlpha = a; const tile = s * scale;
      const ox = (dx % tile) - tile, oy = (dy % tile) - tile;
      for (let x = ox; x < W; x += tile) for (let y = oy; y < H; y += tile) ctx.drawImage(causT, x, y, tile, tile);
    };
    draw(1.1, t * 22, t * 8, (alpha || 0.22));
    draw(0.7, -t * 14, t * 12, (alpha || 0.22) * 0.7);
    ctx.restore();
  }

  /* 景深雾 + 暗角 */
  function depthVignette(ctx, W, H) {
    ctx.save();
    const v = ctx.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.5, H * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(2,30,55,0.5)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  /* —— 会摆尾游动的鱼（头朝 +x；中心 0,0；按 size 缩放）—— */
  function fish(ctx, x, y, size, t, phase, opt) {
    opt = opt || {};
    const rx = size * 0.33, ry = size * 0.22;
    const sp = opt.scared ? 11 : 5.5;
    const amp = size * 0.05 * (opt.scared ? 1.7 : 1);
    const wob = Math.sin(t * sp + phase);
    ctx.save(); ctx.translate(x, y);
    if (opt.tilt) ctx.rotate(opt.tilt);
    const body = opt.body || ['#ff9ff3', '#e26fd0'], fin = opt.fin || '#f368e0';
    // 落影
    ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#001b2e'; ctx.beginPath(); ctx.ellipse(0, ry * 1.5, rx, ry * 0.4, 0, 0, 7); ctx.fill(); ctx.restore();

    // 尾鳍（随尾部摆动张合）
    const tdy = amp * 1.6 * wob, spread = size * 0.16 * (0.7 + 0.3 * Math.sin(t * sp + phase + 1));
    ctx.beginPath(); ctx.moveTo(-rx * 0.85, tdy * 0.4);
    ctx.quadraticCurveTo(-rx - size * 0.16, tdy - spread, -rx - size * 0.2, tdy - spread * 0.5);
    ctx.quadraticCurveTo(-rx - size * 0.1, tdy, -rx - size * 0.2, tdy + spread * 0.5);
    ctx.quadraticCurveTo(-rx - size * 0.16, tdy + spread, -rx * 0.85, tdy * 0.4);
    ctx.closePath(); ctx.fillStyle = fin; ctx.fill(); ctx.lineWidth = size * 0.025; ctx.strokeStyle = 'rgba(40,20,40,.55)'; ctx.stroke();

    // 背鳍
    ctx.beginPath(); ctx.moveTo(rx * 0.1, -ry * 0.9); ctx.quadraticCurveTo(-rx * 0.2, -ry * 1.7 - Math.max(0, wob) * size * 0.04, -rx * 0.5, -ry * 0.7); ctx.closePath(); ctx.fillStyle = fin; ctx.fill(); ctx.stroke();

    // 身体（沿脊柱摆动变形）
    const N = 28; ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = i / N * Math.PI * 2, px = Math.cos(a) * rx, py = Math.sin(a) * ry;
      const u = (rx - px) / (2 * rx);                          // 0 头 → 1 尾
      const dy = amp * Math.pow(u, 1.4) * Math.sin(t * sp + phase - u * 3.2);
      if (i === 0) ctx.moveTo(px, py + dy); else ctx.lineTo(px, py + dy);
    }
    ctx.closePath();
    const bg = ctx.createLinearGradient(0, -ry, 0, ry); bg.addColorStop(0, body[0]); bg.addColorStop(1, body[1]);
    ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = size * 0.03; ctx.strokeStyle = 'rgba(40,20,40,.6)'; ctx.stroke();

    // 高光带
    ctx.save(); ctx.clip(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(rx * 0.1, -ry * 0.4, rx * 0.7, ry * 0.35, 0, 0, 7); ctx.fill(); ctx.restore();

    // 胸鳍（拍动）
    const flap = 0.6 + 0.4 * Math.sin(t * sp + phase + 2);
    ctx.save(); ctx.translate(rx * 0.25, ry * 0.45); ctx.scale(1, flap);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-size * 0.12, size * 0.06, -size * 0.16, size * 0.16); ctx.quadraticCurveTo(-size * 0.04, size * 0.12, 0, 0); ctx.closePath();
    ctx.fillStyle = fin; ctx.globalAlpha = 0.92; ctx.fill(); ctx.restore();

    // 眼睛 + 嘴
    ctx.beginPath(); ctx.arc(rx * 0.58, -ry * 0.22, size * 0.06, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = size * 0.018; ctx.strokeStyle = 'rgba(40,20,40,.6)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(rx * 0.6, -ry * 0.18, size * 0.03, 0, 7); ctx.fillStyle = '#241016'; ctx.fill();
    ctx.beginPath(); ctx.arc(rx * 0.57, -ry * 0.3, size * 0.013, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(rx * 0.92, ry * 0.12, size * 0.07, opt.scared ? 0.2 : 0.9, opt.scared ? 1.6 : 2.2); ctx.lineWidth = size * 0.02; ctx.strokeStyle = 'rgba(40,20,40,.6)'; ctx.stroke();
    ctx.restore();
  }

  /* 漂浮水母（伞收缩 + 触须摆动）*/
  function jelly(ctx, x, y, size, t, phase) {
    ctx.save(); ctx.translate(x, y + Math.sin(t * 1.2 + phase) * size * 0.12);
    const pulse = 0.85 + 0.15 * Math.sin(t * 2 + phase);
    ctx.scale(1, pulse);
    const r = size * 0.5;
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.quadraticCurveTo(r, r * 0.5, 0, r * 0.45); ctx.quadraticCurveTo(-r, r * 0.5, -r, 0); ctx.closePath();
    const g = ctx.createLinearGradient(0, -r, 0, r * 0.5); g.addColorStop(0, 'rgba(210,170,255,0.9)'); g.addColorStop(1, 'rgba(150,110,235,0.65)');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = size * 0.03; ctx.strokeStyle = 'rgba(120,80,200,0.7)'; ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(x, y + Math.sin(t * 1.2 + phase) * size * 0.12);
    for (let i = -2; i <= 2; i++) { const tx = i * size * 0.12; ctx.beginPath(); ctx.moveTo(tx, r * 0.4 * pulse); ctx.quadraticCurveTo(tx + Math.sin(t * 3 + i + phase) * size * 0.1, r * 1.0, tx + Math.sin(t * 2 + i) * size * 0.06, r * 1.5); ctx.lineWidth = size * 0.025; ctx.strokeStyle = 'rgba(190,150,245,0.7)'; ctx.stroke(); }
    ctx.restore();
  }

  return { init, rays, caustics, depthVignette, fish, jelly };
})();
