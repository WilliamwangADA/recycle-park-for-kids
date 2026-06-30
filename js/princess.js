/* ===========================================================================
   回收乐园 · 冰雪公主 Ada（原创角色，神似《冰雪奇缘》爱莎，规避版权）
   设计要点(参考爱莎冰雪女王造型)：铂金长发单边法式麻花辫搭左肩 + 雪花发带、
   露肩冰蓝水晶裙 + 半透明浅蓝袖、拖地雪花薄纱披风、大蓝眼睛 + 淡紫眼影。
   Princess.draw(ctx, x, y, size, t, opts) 以 (x,y) 为身体竖直中心绘制，约高 size。
   放 assets/sprites/ada_art.png（AI 插画）会自动改用贴图。
   =========================================================================== */
window.Princess = (function () {
  function hash(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  let override = null, tried = false;
  function tryOverride() {
    if (tried) return override;
    tried = true;
    if (typeof Image === 'undefined') return null;
    const im = new Image(); im.onload = () => { override = im; }; im.onerror = () => {};
    im.src = 'assets/sprites/ada_art.png';
    return null;
  }

  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 7); g.closePath(); }
  function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 7); g.closePath(); }
  function lg(g, x0, y0, x1, y1, c0, c1, cm) { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, c0); if (cm) gr.addColorStop(0.5, cm); gr.addColorStop(1, c1); return gr; }
  function rg(g, x, y, r, c0, c1) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; }

  function star4(g, x, y, r, a) {
    g.save(); g.globalAlpha = a; g.translate(x, y);
    g.fillStyle = rg(g, 0, 0, r * 1.7, 'rgba(235,250,255,1)', 'rgba(150,210,255,0)'); circ(g, 0, 0, r * 1.7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.95)';
    g.beginPath(); g.moveTo(0, -r * 2); g.lineTo(r * 0.4, 0); g.lineTo(0, r * 2); g.lineTo(-r * 0.4, 0); g.closePath();
    g.moveTo(-r * 2, 0); g.lineTo(0, r * 0.4); g.lineTo(r * 2, 0); g.lineTo(0, -r * 0.4); g.closePath(); g.fill();
    g.restore();
  }
  function snowflake(g, x, y, r, a, rot) {
    g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot || 0);
    g.strokeStyle = 'rgba(232,248,255,1)'; g.lineWidth = r * 0.22; g.lineCap = 'round';
    for (let k = 0; k < 6; k++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r); g.moveTo(0, -r * 0.6); g.lineTo(r * 0.3, -r * 0.85); g.moveTo(0, -r * 0.6); g.lineTo(-r * 0.3, -r * 0.85); g.stroke(); }
    g.restore();
  }
  // 沿长度渐变的发束（铂金）
  function plat(g, i, n) { const f = i / n, r = Math.round(255 - f * 8), gg = Math.round(250 - f * 22), b = Math.round(240 - f * 28); return 'rgb(' + r + ',' + gg + ',' + b + ')'; }

  function draw(ctx, x, y, size, t, opts) {
    opts = opts || {};
    const img = override || tryOverride();
    if (img) { ctx.save(); ctx.drawImage(img, x - size / 2, y - size / 2, size, size); ctx.restore(); return; }

    const u = size, T = t || 0;
    const float = Math.sin(T * 1.6), sway = Math.sin(T * 1.1), sway2 = Math.sin(T * 1.1 + 0.9);
    const PLAT0 = '#fffefb', PLAT1 = '#e8e2d2';          // 铂金浅→深
    const ICE0 = '#eaf7ff', ICE1 = '#6db8ee', ICEM = '#a9dbff'; // 冰蓝裙

    ctx.save(); ctx.translate(x, y);

    // ── Layer 0：冰霜光晕 ──
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(T * 0.9);
    ctx.fillStyle = rg(ctx, 0, -0.05 * u, 0.66 * u, 'rgba(190,230,255,.32)', 'rgba(190,230,255,0)'); ctx.fillRect(-0.72 * u, -0.72 * u, 1.44 * u, 1.44 * u); ctx.restore();

    ctx.save(); ctx.translate(0, float * u * 0.02);

    // ── Layer 1：拖地雪花薄纱披风（身后）──
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-0.14 * u, -0.2 * u); ctx.lineTo(0.14 * u, -0.2 * u);
    ctx.lineTo(0.4 * u + sway * u * 0.04, 0.52 * u);
    for (let i = 8; i >= 0; i--) { const px = (-0.4 + i / 8 * 0.8) * u + sway * u * 0.04; const py = 0.52 * u + Math.sin(T * 1.4 + i * 0.6) * u * 0.025; ctx.lineTo(px, py); }
    ctx.closePath();
    ctx.fillStyle = lg(ctx, 0, -0.2 * u, 0, 0.52 * u, 'rgba(214,240,255,.5)', 'rgba(150,200,250,.12)'); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = u * 0.006; ctx.stroke();
    for (let i = 0; i < 5; i++) snowflake(ctx, (-0.26 + (i % 3) * 0.26) * u + sway * u * 0.04, (0.1 + Math.floor(i / 3) * 0.24 + (i % 2) * 0.08) * u, u * 0.035, 0.6, T * 0.3 + i);
    ctx.restore();

    // ── Layer 2：裙身（露肩冰蓝水晶裙 + 钟形长裙）──
    function skirt() {
      ctx.beginPath();
      ctx.moveTo(-0.16 * u, -0.16 * u);                  // 左肩口
      ctx.quadraticCurveTo(-0.1 * u, -0.02 * u, -0.085 * u, 0.0 * u);
      ctx.quadraticCurveTo(-0.22 * u, 0.26 * u, -0.32 * u, 0.5 * u);  // 左下摆
      for (let i = 0; i <= 10; i++) { const px = (-0.32 + i / 10 * 0.64) * u + sway2 * u * 0.02; const py = 0.5 * u + Math.sin(T * 1.5 + i * 0.7) * u * 0.016; ctx.lineTo(px, py); }
      ctx.quadraticCurveTo(0.22 * u, 0.26 * u, 0.085 * u, 0.0 * u);
      ctx.quadraticCurveTo(0.1 * u, -0.02 * u, 0.16 * u, -0.16 * u);
      ctx.closePath();
    }
    skirt();
    ctx.fillStyle = lg(ctx, 0, -0.16 * u, 0, 0.5 * u, ICE0, ICE1, ICEM); ctx.fill();
    ctx.lineWidth = u * 0.01; ctx.strokeStyle = 'rgba(120,180,225,.55)'; ctx.stroke();
    // 水晶切面高光 + 雪花
    ctx.save(); skirt(); ctx.clip();
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(-0.04 * u, 0.0 * u); ctx.lineTo(0.04 * u, 0.0 * u); ctx.lineTo(0.1 * u, 0.5 * u); ctx.lineTo(-0.1 * u, 0.5 * u); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 4; i++) snowflake(ctx, (-0.12 + (i % 2) * 0.18) * u, (0.18 + Math.floor(i / 2) * 0.2) * u, u * 0.03, 0.55, 0.2);
    ctx.restore();

    // ── Layer 3：手臂 + 半透明浅蓝袖 ──
    for (const s of [-1, 1]) {
      ctx.fillStyle = lg(ctx, 0, -0.16 * u, 0, 0.06 * u, '#ffe6d2', '#ffd2b8');
      ell(ctx, s * 0.17 * u, -0.02 * u, 0.035 * u, 0.12 * u, s * 0.18); ctx.fill();   // 手臂(肤)
      ctx.fillStyle = 'rgba(205,235,255,.5)';                                          // 半透明袖
      ell(ctx, s * 0.18 * u, -0.1 * u, 0.05 * u, 0.08 * u, s * 0.2); ctx.fill();
      ctx.strokeStyle = 'rgba(150,200,235,.5)'; ctx.lineWidth = u * 0.005; ctx.stroke();
    }

    // ── Layer 4：露肩 + 脖子 + 后发 ──
    // 后发(脑后一团框住脸 + 右侧柔顺垂落，不外翘)
    ctx.fillStyle = lg(ctx, 0, -0.5 * u, 0, 0.04 * u, PLAT0, PLAT1);
    ctx.beginPath();
    ctx.moveTo(-0.112 * u, -0.44 * u);
    ctx.quadraticCurveTo(-0.182 * u, -0.2 * u, -0.112 * u, 0.04 * u);
    ctx.quadraticCurveTo(0, 0.09 * u, 0.112 * u, 0.04 * u);
    ctx.quadraticCurveTo(0.196 * u - sway * u * 0.02, -0.16 * u, 0.128 * u, -0.44 * u);
    ctx.quadraticCurveTo(0, -0.5 * u, -0.112 * u, -0.44 * u);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0.1 * u, -0.32 * u); ctx.quadraticCurveTo(0.225 * u - sway * u * 0.02, -0.04 * u, 0.12 * u, 0.16 * u); ctx.quadraticCurveTo(0.11 * u, -0.04 * u, 0.085 * u, -0.28 * u); ctx.closePath(); ctx.fill();   // 右侧垂肩发缕
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ell(ctx, 0.075 * u, -0.18 * u, 0.028 * u, 0.12 * u, 0.1); ctx.fill();
    // 露肩 + 脖
    ctx.fillStyle = lg(ctx, 0, -0.28 * u, 0, -0.14 * u, '#ffe6d2', '#ffceb2');
    ctx.beginPath(); ctx.moveTo(-0.05 * u, -0.3 * u); ctx.lineTo(0.05 * u, -0.3 * u); ctx.lineTo(0.06 * u, -0.2 * u); ctx.quadraticCurveTo(0, -0.17 * u, -0.06 * u, -0.2 * u); ctx.closePath(); ctx.fill();   // 脖+肩
    // 裙领口(冰蓝心形领)
    ctx.fillStyle = ICEM; ctx.beginPath(); ctx.moveTo(-0.16 * u, -0.16 * u); ctx.quadraticCurveTo(-0.05 * u, -0.13 * u, 0, -0.16 * u); ctx.quadraticCurveTo(0.05 * u, -0.13 * u, 0.16 * u, -0.16 * u); ctx.quadraticCurveTo(0.1 * u, -0.05 * u, 0, -0.05 * u); ctx.quadraticCurveTo(-0.1 * u, -0.05 * u, -0.16 * u, -0.16 * u); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = u * 0.005; ctx.stroke();

    // ── Layer 5：脸 ──
    ctx.save(); ctx.rotate(Math.sin(T * 0.7) * 0.015);
    const hx = 0, hy = -0.36 * u, hr = 0.118 * u;
    ell(ctx, hx, hy + hr * 0.08, hr, hr * 1.06, 0); ctx.fillStyle = rg(ctx, hx - 0.04 * u, hy - 0.04 * u, hr * 1.2, '#fff2e8', '#ffd9c2'); ctx.fill();
    // 腮红
    ctx.fillStyle = 'rgba(255,150,170,.4)'; ell(ctx, hx - 0.055 * u, hy + 0.03 * u, 0.03 * u, 0.02 * u); ctx.fill(); ell(ctx, hx + 0.055 * u, hy + 0.03 * u, 0.03 * u, 0.02 * u); ctx.fill();
    // 眨眼
    const cyc = T % 4.2, lid = cyc < 0.14 ? Math.sin(cyc / 0.14 * Math.PI) : 0, eyeOpen = 1 - 0.92 * lid;
    for (const sgn of [-1, 1]) {
      const ex = hx + sgn * 0.044 * u, ey = hy + 0.015 * u;
      // 淡紫眼影(浅)
      ctx.fillStyle = 'rgba(180,162,224,.2)'; ell(ctx, ex, ey - 0.024 * u, 0.034 * u, 0.014 * u, sgn * 0.2); ctx.fill();
      if (eyeOpen < 0.25) { ctx.strokeStyle = '#3a3346'; ctx.lineWidth = u * 0.009; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ex, ey, 0.032 * u, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
      else {
        ctx.save(); ctx.translate(ex, ey); ctx.scale(1, eyeOpen);
        ell(ctx, 0, 0, 0.032 * u, 0.04 * u); ctx.fillStyle = '#fff'; ctx.fill();           // 大眼白
        const iris = rg(ctx, 0, 0.005 * u, 0.026 * u, '#cdeeff', '#3f86d8');
        circ(ctx, 0, 0.006 * u, 0.024 * u); ctx.fillStyle = iris; ctx.fill();
        circ(ctx, 0, 0.006 * u, 0.024 * u); ctx.lineWidth = u * 0.004; ctx.strokeStyle = 'rgba(60,110,170,.6)'; ctx.stroke();
        circ(ctx, 0, 0.008 * u, 0.012 * u); ctx.fillStyle = '#23364a'; ctx.fill();          // 瞳孔
        circ(ctx, -0.008 * u, -0.004 * u, 0.008 * u); ctx.fillStyle = 'rgba(255,255,255,.98)'; ctx.fill();  // 高光
        circ(ctx, 0.007 * u, 0.014 * u, 0.004 * u); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill();
        ctx.restore();
        // 上眼线(细) + 外眼角弯睫毛
        ctx.strokeStyle = '#3a3040'; ctx.lineWidth = u * 0.0062; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ex, ey, 0.033 * u, Math.PI * 1.12, Math.PI * 1.9); ctx.stroke();
        for (let l = 0; l < 2; l++) { const la = Math.PI * (sgn > 0 ? (1.84 - l * 0.15) : (1.16 + l * 0.15)); const bx = ex + Math.cos(la) * 0.032 * u, by = ey + Math.sin(la) * 0.032 * u; ctx.lineWidth = u * 0.005; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + sgn * 0.006 * u, by - 0.012 * u, bx + sgn * 0.016 * u, by - 0.016 * u); ctx.stroke(); }
      }
      // 眉(细、浅、高)
      ctx.strokeStyle = 'rgba(206,184,152,.6)'; ctx.lineWidth = u * 0.0055; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ex, ey - 0.032 * u, 0.026 * u, Math.PI * 1.26, Math.PI * 1.74); ctx.stroke();
    }
    // 鼻 + 嘴(上下唇)
    ctx.strokeStyle = 'rgba(210,150,120,.45)'; ctx.lineWidth = u * 0.005; ctx.beginPath(); ctx.moveTo(hx + 0.004 * u, hy + 0.03 * u); ctx.lineTo(hx - 0.006 * u, hy + 0.046 * u); ctx.stroke();
    ctx.fillStyle = '#e06a86'; ctx.beginPath(); ctx.moveTo(hx - 0.024 * u, hy + 0.066 * u); ctx.quadraticCurveTo(hx, hy + 0.058 * u, hx + 0.024 * u, hy + 0.066 * u); ctx.quadraticCurveTo(hx, hy + 0.088 * u, hx - 0.024 * u, hy + 0.066 * u); ctx.fill();
    ctx.strokeStyle = '#c44e6a'; ctx.lineWidth = u * 0.004; ctx.beginPath(); ctx.moveTo(hx - 0.024 * u, hy + 0.066 * u); ctx.quadraticCurveTo(hx, hy + 0.07 * u, hx + 0.024 * u, hy + 0.066 * u); ctx.stroke();
    // 刘海(中分柔顺斜扫，盖住额头收到眉上)
    ctx.fillStyle = lg(ctx, 0, hy - hr * 1.25, 0, hy, PLAT0, '#ece4d4');
    ctx.beginPath();
    ctx.moveTo(-hr * 1.05, hy + hr * 0.06);
    ctx.quadraticCurveTo(-hr * 1.2, hy - hr * 0.95, -hr * 0.15, hy - hr * 1.16);
    ctx.quadraticCurveTo(hr * 0.4, hy - hr * 1.27, hr * 0.96, hy - hr * 0.9);
    ctx.quadraticCurveTo(hr * 1.2, hy - hr * 0.52, hr * 1.05, hy + hr * 0.06);
    ctx.quadraticCurveTo(hr * 0.78, hy - hr * 0.36, hr * 0.42, hy - hr * 0.2);    // 右下缘
    ctx.quadraticCurveTo(hr * 0.2, hy - hr * 0.62, hr * 0.02, hy - hr * 0.2);     // 中分尖
    ctx.quadraticCurveTo(-hr * 0.24, hy - hr * 0.5, -hr * 0.54, hy - hr * 0.22);  // 左一缕
    ctx.quadraticCurveTo(-hr * 0.84, hy - hr * 0.4, -hr * 1.05, hy + hr * 0.06);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(ctx, -hr * 0.25, hy - hr * 0.85, hr * 0.55, hr * 0.16, -0.15); ctx.fill();   // 发顶柔光
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = u * 0.004; ctx.beginPath(); ctx.moveTo(-hr * 0.1, hy - hr * 1.02); ctx.quadraticCurveTo(-hr * 0.5, hy - hr * 0.65, -hr * 0.72, hy - hr * 0.18); ctx.stroke();
    ctx.restore();

    // ── Layer 6：雪花发带 + 单边法式麻花辫(搭左肩) ──
    // 发带 + 雪花饰
    ctx.fillStyle = '#bfe6ff'; ell(ctx, -hr * 0.85, hy - hr * 0.5, hr * 0.28, hr * 0.16, -0.4); ctx.fill();
    star4(ctx, -hr * 1.0, hy - hr * 0.55, u * 0.016, 0.6 + 0.4 * Math.sin(T * 3));
    // 麻花辫
    ctx.save();
    const N = 16; let tipx = -0.1 * u, tipy = -0.4 * u;
    for (let i = 1; i <= N; i++) {
      const f = i / N, xo = Math.sin(T * 1.1 + i * 0.45) * u * 0.03 * f;
      const px = (-0.1 - f * 0.06) * u + xo, py = (-0.4 + f * 0.74) * u, r = (0.058 - f * 0.04) * u;
      ctx.fillStyle = plat(ctx, i, N); circ(ctx, px, py, r); ctx.fill();
      ctx.strokeStyle = 'rgba(180,170,150,.5)'; ctx.lineWidth = r * 0.5; ctx.lineCap = 'round';
      const dir = i % 2 ? 1 : -1; ctx.beginPath(); ctx.moveTo(px - r * 0.78, py - r * 0.36 * dir); ctx.lineTo(px + r * 0.78, py + r * 0.36 * dir); ctx.stroke();
      circ(ctx, px - r * 0.32, py - r * 0.42, r * 0.24); ctx.fillStyle = 'rgba(255,255,250,.85)'; ctx.fill();
      tipx = px; tipy = py;
    }
    ctx.strokeStyle = 'rgba(210,200,180,.85)'; ctx.lineWidth = u * 0.01; ctx.lineCap = 'round';
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(tipx, tipy + 0.01 * u); ctx.quadraticCurveTo(tipx + k * 0.025 * u, tipy + 0.05 * u, tipx + k * 0.04 * u, tipy + 0.08 * u); ctx.stroke(); }
    ctx.fillStyle = '#9fd6f5'; circ(ctx, tipx, tipy - 0.005 * u, 0.02 * u); ctx.fill();
    ctx.restore();

    ctx.restore(); // float

    // ── Layer 7：闪光 + 飘雪 ──
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const base = hash(i) * 6.28, rad = (0.42 + 0.16 * hash(i + 9)) * u, spd = 0.4 + 0.5 * hash(i + 3), a = T * spd + base; star4(ctx, Math.cos(a) * rad, -0.05 * u + Math.sin(a) * rad * 0.7, (0.012 + 0.01 * hash(i + 5)) * u, 0.4 + 0.6 * Math.abs(Math.sin(T * 2.5 + i))); }
    for (let i = 0; i < 8; i++) { const px = (hash(i) * 1.2 - 0.6) * u + Math.sin(T * 0.5 + i) * u * 0.04; const fall = (T * (0.03 + 0.02 * hash(i + 7)) + hash(i + 2)) % 1; const py = (-0.55 + fall * 1.05) * u, fade = Math.sin(fall * Math.PI), r = (0.012 + 0.01 * hash(i + 4)) * u; snowflake(ctx, px, py, r, 0.5 * fade, T * 0.6 + i); }
    ctx.restore();

    ctx.restore();
  }

  return { draw };
})();
