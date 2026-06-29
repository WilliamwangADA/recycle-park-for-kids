/* ===========================================================================
   回收乐园 · 冰雪公主 Ada（原创角色，埃莎风格）
   Princess.draw(ctx, x, y, size, t, opts) —— 以 (x,y) 为身体竖直中心绘制，
   整体约高 size。全部用 G.t 驱动动画：呼吸浮动 / 麻花辫裙摆摇曳 / 眨眼 /
   皇冠宝石闪 / 飘雪与闪光粒子。自带绘制 helper，不依赖 sprites.js。
   未来把 assets/sprites/ada_art.png（AI 插画）放进去会自动改用贴图。
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

  /* —— 小 helper —— */
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 7); g.closePath(); }
  function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 7); g.closePath(); }
  function lg(g, x0, y0, x1, y1, c0, c1, cm) { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, c0); if (cm) gr.addColorStop(0.5, cm); gr.addColorStop(1, c1); return gr; }

  function star4(g, x, y, r, a) {
    g.save(); g.globalAlpha = a; g.translate(x, y);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, r * 1.6); rg.addColorStop(0, 'rgba(235,250,255,1)'); rg.addColorStop(1, 'rgba(150,210,255,0)');
    g.fillStyle = rg; circ(g, 0, 0, r * 1.6); g.fill();
    g.fillStyle = 'rgba(255,255,255,.95)';
    g.beginPath(); g.moveTo(0, -r * 2); g.lineTo(r * 0.4, 0); g.lineTo(0, r * 2); g.lineTo(-r * 0.4, 0); g.closePath();
    g.moveTo(-r * 2, 0); g.lineTo(0, r * 0.4); g.lineTo(r * 2, 0); g.lineTo(0, -r * 0.4); g.closePath(); g.fill();
    g.restore();
  }
  function snowflake(g, x, y, r, a, rot) {
    g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot);
    g.strokeStyle = 'rgba(232,248,255,1)'; g.lineWidth = r * 0.22; g.lineCap = 'round';
    for (let k = 0; k < 6; k++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r); g.moveTo(0, -r * 0.6); g.lineTo(r * 0.3, -r * 0.85); g.moveTo(0, -r * 0.6); g.lineTo(-r * 0.3, -r * 0.85); g.stroke(); }
    g.restore();
  }

  function draw(ctx, x, y, size, t, opts) {
    opts = opts || {};
    const img = override || tryOverride();
    if (img) { ctx.save(); ctx.drawImage(img, x - size / 2, y - size / 2, size, size); ctx.restore(); return; }

    const u = size, T = t || 0;
    const float = Math.sin(T * 1.6), sway = Math.sin(T * 1.1), sway2 = Math.sin(T * 1.1 + 0.9), shimmer = (T * 0.35) % 1;

    /* ---------- Layer 8 背景外的粒子（飘雪在最上，闪光也最上；这里先画身体）---------- */
    ctx.save(); ctx.translate(x, y);

    // Layer 0 冰霜光晕
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7 + 0.3 * Math.sin(T * 0.9);
    const aura = ctx.createRadialGradient(0, -0.05 * u, 0, 0, -0.05 * u, 0.62 * u);
    aura.addColorStop(0, 'rgba(190,230,255,.30)'); aura.addColorStop(0.45, 'rgba(190,230,255,.10)'); aura.addColorStop(1, 'rgba(190,230,255,0)');
    ctx.fillStyle = aura; ctx.fillRect(-0.7 * u, -0.7 * u, 1.4 * u, 1.4 * u); ctx.restore();

    // 全身一起轻浮
    ctx.save(); ctx.translate(0, float * u * 0.022);

    // Layer 1 半透明披风
    ctx.beginPath(); ctx.moveTo(-0.16 * u, -0.22 * u); ctx.lineTo(0.16 * u, -0.22 * u);
    ctx.lineTo(0.34 * u + sway * u * 0.03, 0.46 * u);
    for (let i = 8; i >= 0; i--) { const px = (-0.34 + i / 8 * 0.68) * u + sway * u * 0.03; const py = 0.46 * u + Math.sin(T * 1.4 + i * 0.6) * u * 0.02; ctx.lineTo(px, py); }
    ctx.closePath();
    ctx.fillStyle = lg(ctx, 0, -0.22 * u, 0, 0.46 * u, 'rgba(225,245,255,.55)', 'rgba(170,210,255,.15)'); ctx.fill();

    // Layer 2 裙身（钟形 + 下摆波浪）
    function gownPath() {
      ctx.beginPath();
      ctx.moveTo(-0.14 * u, -0.22 * u);
      ctx.quadraticCurveTo(-0.11 * u, -0.05 * u, -0.095 * u, -0.02 * u);     // 收腰
      ctx.quadraticCurveTo(-0.2 * u, 0.25 * u, -0.30 * u, 0.48 * u);          // 左下摆
      for (let i = 0; i <= 10; i++) { const px = (-0.30 + i / 10 * 0.60) * u + sway2 * u * 0.02; const py = 0.48 * u + Math.sin(T * 1.5 + i * 0.7) * u * 0.018; ctx.lineTo(px, py); }
      ctx.quadraticCurveTo(0.2 * u, 0.25 * u, 0.095 * u, -0.02 * u);
      ctx.quadraticCurveTo(0.11 * u, -0.05 * u, 0.14 * u, -0.22 * u);
      ctx.closePath();
    }
    gownPath();
    ctx.fillStyle = lg(ctx, 0, -0.22 * u, 0, 0.48 * u, '#dff3ff', '#5fa8ee', '#9fd0ff'); ctx.fill();
    ctx.lineWidth = u * 0.012; ctx.strokeStyle = 'rgba(120,170,220,.6)'; ctx.stroke();

    // Layer 3 裙面流光（裁剪到裙身）
    ctx.save(); gownPath(); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    const bx = (-0.5 + shimmer * 1.5) * u;
    ctx.save(); ctx.transform(1, 0, -0.25, 1, 0, 0);
    ctx.fillStyle = lg(ctx, bx - 0.09 * u, 0, bx + 0.09 * u, 0, 'rgba(255,255,255,0)', 'rgba(255,255,255,0)', 'rgba(255,255,255,.5)');
    ctx.fillRect(bx - 0.12 * u, -0.25 * u, 0.24 * u, 0.8 * u); ctx.restore();
    ctx.restore();
    // 裙上雪花纹
    ctx.globalCompositeOperation = 'source-over';
    [[-0.1, 0.28], [0.08, 0.34], [0.0, 0.2]].forEach((p, i) => { snowflake(ctx, p[0] * u, p[1] * u, 0.035 * u, 0.5 + 0.3 * Math.sin(T * 2 + i), 0.2); });

    // Layer 4 后发 + 脖子
    ctx.fillStyle = lg(ctx, 0, -0.5 * u, 0, -0.15 * u, '#fdfdff', '#e6eefc');
    ell(ctx, -0.12 * u, -0.30 * u, 0.075 * u, 0.16 * u, -0.15); ctx.fill();
    ell(ctx, 0.12 * u, -0.30 * u, 0.075 * u, 0.16 * u, 0.15); ctx.fill();
    ctx.fillStyle = lg(ctx, 0, -0.3 * u, 0, -0.2 * u, '#ffe3cf', '#ffd2b8');
    ctx.beginPath(); ctx.moveTo(-0.05 * u, -0.30 * u); ctx.lineTo(0.05 * u, -0.30 * u); ctx.lineTo(0.045 * u, -0.21 * u); ctx.lineTo(-0.045 * u, -0.21 * u); ctx.closePath(); ctx.fill();

    // 刘海/前发顶
    ctx.fillStyle = lg(ctx, 0, -0.5 * u, 0, -0.33 * u, '#ffffff', '#e9f0fb');
    ctx.beginPath(); ctx.arc(0, -0.36 * u, 0.135 * u, Math.PI * 1.04, Math.PI * 1.96); ctx.closePath(); ctx.fill();

    // Layer 5 脸
    ctx.save(); ctx.rotate(Math.sin(T * 0.7) * 0.02);
    const hx = 0, hy = -0.36 * u, hr = 0.115 * u;
    const skin = ctx.createRadialGradient(hx - 0.04 * u, hy - 0.04 * u, 0, hx, hy, hr * 1.15);
    skin.addColorStop(0, '#fff0e6'); skin.addColorStop(1, '#ffd9c0');
    circ(ctx, hx, hy, hr); ctx.fillStyle = skin; ctx.fill();
    // 腮红
    ctx.fillStyle = 'rgba(255,150,170,.35)'; ell(ctx, hx - 0.05 * u, hy + 0.03 * u, 0.028 * u, 0.020 * u); ctx.fill(); ell(ctx, hx + 0.05 * u, hy + 0.03 * u, 0.028 * u, 0.020 * u); ctx.fill();
    // 眨眼
    const cyc = T % 4, lid = cyc < 0.14 ? Math.sin(cyc / 0.14 * Math.PI) : 0, eyeOpen = 1 - 0.92 * lid;
    for (const sgn of [-1, 1]) {
      const ex = hx + sgn * 0.045 * u, ey = hy + 0.005 * u;
      if (eyeOpen < 0.25) {                       // 闭眼睫毛弧
        ctx.strokeStyle = '#3a4a5a'; ctx.lineWidth = u * 0.008; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(ex, ey, 0.03 * u, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      } else {
        ctx.save(); ctx.translate(ex, ey); ctx.scale(1, eyeOpen);
        ell(ctx, 0, 0, 0.026 * u, 0.032 * u); ctx.fillStyle = '#fff'; ctx.fill();
        const iris = ctx.createRadialGradient(0, 0.004 * u, 0, 0, 0.004 * u, 0.02 * u); iris.addColorStop(0, '#bfe6ff'); iris.addColorStop(1, '#4f9fe0');
        circ(ctx, 0, 0.006 * u, 0.019 * u); ctx.fillStyle = iris; ctx.fill();
        circ(ctx, 0, 0.008 * u, 0.009 * u); ctx.fillStyle = '#23364a'; ctx.fill();
        circ(ctx, -0.006 * u, -0.002 * u, 0.005 * u); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fill();
        ctx.restore();
        // 上眼线 + 睫毛
        ctx.strokeStyle = '#3a4a5a'; ctx.lineWidth = u * 0.006; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(ex, ey, 0.030 * u, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        for (let l = 0; l < 3; l++) { const la = Math.PI * (1.15 + l * 0.28); ctx.beginPath(); ctx.moveTo(ex + Math.cos(la) * 0.03 * u, ey + Math.sin(la) * 0.03 * u); ctx.lineTo(ex + Math.cos(la) * 0.045 * u, ey + Math.sin(la) * 0.045 * u); ctx.stroke(); }
      }
      // 眉
      ctx.strokeStyle = 'rgba(180,160,140,.75)'; ctx.lineWidth = u * 0.006;
      ctx.beginPath(); ctx.arc(ex, ey - 0.005 * u, 0.034 * u, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    }
    // 鼻 + 嘴
    ctx.strokeStyle = 'rgba(210,150,120,.5)'; ctx.lineWidth = u * 0.006; ctx.beginPath(); ctx.moveTo(hx, hy + 0.03 * u); ctx.lineTo(hx - 0.006 * u, hy + 0.045 * u); ctx.stroke();
    ctx.strokeStyle = '#d56b6b'; ctx.lineWidth = u * 0.008; ctx.beginPath(); ctx.moveTo(hx - 0.022 * u, hy + 0.062 * u); ctx.quadraticCurveTo(hx, hy + 0.082 * u, hx + 0.022 * u, hy + 0.062 * u); ctx.stroke();
    ctx.fillStyle = 'rgba(230,120,130,.4)'; ctx.beginPath(); ctx.moveTo(hx - 0.018 * u, hy + 0.064 * u); ctx.quadraticCurveTo(hx, hy + 0.078 * u, hx + 0.018 * u, hy + 0.064 * u); ctx.quadraticCurveTo(hx, hy + 0.07 * u, hx - 0.018 * u, hy + 0.064 * u); ctx.fill();
    ctx.restore(); // 头微转

    // Layer 6 皇冠
    ctx.save(); ctx.translate(0, -0.45 * u);
    ctx.fillStyle = lg(ctx, 0, -0.07 * u, 0, 0, '#eaf7ff', '#bfe0ff'); ctx.strokeStyle = 'rgba(150,190,230,.85)'; ctx.lineWidth = u * 0.008;
    const spikes = [-0.072, -0.04, 0, 0.04, 0.072], hgt = [0.035, 0.052, 0.072, 0.052, 0.035];
    ctx.beginPath(); ctx.moveTo(-0.085 * u, 0.01 * u);
    spikes.forEach((sx, i) => { ctx.lineTo(sx * u - 0.018 * u, 0.01 * u); ctx.lineTo(sx * u, -hgt[i] * u); ctx.lineTo(sx * u + 0.018 * u, 0.01 * u); });
    ctx.lineTo(0.085 * u, 0.01 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
    // 中央蓝宝石
    const gem = ctx.createRadialGradient(0, -0.01 * u, 0, 0, -0.01 * u, 0.02 * u); gem.addColorStop(0, '#cdeeff'); gem.addColorStop(1, '#2f7fd8');
    ctx.beginPath(); ctx.moveTo(0, -0.035 * u); ctx.lineTo(0.018 * u, -0.01 * u); ctx.lineTo(0, 0.018 * u); ctx.lineTo(-0.018 * u, -0.01 * u); ctx.closePath(); ctx.fillStyle = gem; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = u * 0.005; ctx.stroke();
    circ(ctx, -0.005 * u, -0.016 * u, 0.004 * u); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
    star4(ctx, 0, -0.01 * u, 0.012 * u, 0.5 + 0.5 * Math.sin(T * 3));
    ctx.restore();

    // Layer 7 垂落麻花辫（搭左肩，裙身前）
    ctx.save();
    const N = 10;
    let prevx = -0.10 * u, prevy = -0.40 * u;
    for (let i = 1; i <= N; i++) {
      const f = i / N;
      const xo = Math.sin(T * 1.2 + i * 0.5) * u * 0.03 * f;
      const px = (-0.10 - f * 0.10) * u + xo;
      const py = (-0.40 + f * 0.52) * u;
      const r = (0.05 - f * 0.038) * u;
      const col = i / N;
      ctx.fillStyle = 'rgb(' + Math.round(253 - col * 29) + ',' + Math.round(253 - col * 20) + ',' + Math.round(255 - col * 8) + ')';
      circ(ctx, px, py, r); ctx.fill();
      ctx.strokeStyle = 'rgba(200,210,230,.6)'; ctx.lineWidth = r * 0.5;
      ctx.beginPath(); ctx.moveTo(px - r * 0.7, py - r * 0.3); ctx.lineTo(px + r * 0.7, py + r * 0.3); ctx.stroke();
      circ(ctx, px - r * 0.3, py - r * 0.4, r * 0.22); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill();
      prevx = px; prevy = py;
    }
    // 发带
    ctx.fillStyle = '#7fc7f0'; circ(ctx, prevx, prevy - 0.01 * u, 0.018 * u); ctx.fill(); ctx.strokeStyle = 'rgba(90,160,210,.8)'; ctx.lineWidth = u * 0.005; ctx.stroke();
    ctx.restore();

    ctx.restore(); // float

    // Layer 8 闪光星 + 飘雪（最上，additive）
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const base = hash(i) * 6.28, rad = (0.42 + 0.16 * hash(i + 9)) * u, spd = 0.4 + 0.5 * hash(i + 3), a = T * spd + base;
      star4(ctx, Math.cos(a) * rad, -0.05 * u + Math.sin(a) * rad * 0.7, (0.012 + 0.01 * hash(i + 5)) * u, 0.4 + 0.6 * Math.abs(Math.sin(T * 2.5 + i)));
    }
    for (let i = 0; i < 9; i++) {
      const px = (hash(i) * 1.2 - 0.6) * u + Math.sin(T * 0.5 + i) * u * 0.04;
      const fall = (T * (0.03 + 0.02 * hash(i + 7)) + hash(i + 2)) % 1;
      const py = (-0.55 + fall * 1.05) * u, fade = Math.sin(fall * Math.PI), r = (0.012 + 0.01 * hash(i + 4)) * u;
      snowflake(ctx, px, py, r, 0.5 * fade, T * 0.6 + i);
    }
    ctx.restore();

    ctx.restore(); // translate to (x,y)
  }

  return { draw };
})();
