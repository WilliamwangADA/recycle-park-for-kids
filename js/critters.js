/* ===========================================================================
   回收乐园 · 来访小动物（自然形态·蹲坐的可爱小动物；小鸟会飞）
   Critters.draw(ctx, id, x, yBottom, size, t, opts) — 以 (x,yBottom) 为着地点，
   向上画一只小巧可爱的小动物（自然形态：圆头+圆身+耳朵+尾巴+小爪，会眨眼/摇尾）。
   opts.fly=true 时为飞行姿态（小鸟）。
   =========================================================================== */
window.Critters = (function () {
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 7); g.closePath(); }
  function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 7); g.closePath(); }
  function lg(g, x0, y0, x1, y1, a, b) { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; }
  function dk(hex, d) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) + d, g = ((n >> 8) & 255) + d, b = (n & 255) + d; r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b)); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }

  const SP = {
    cat: { body: '#f6a94e', belly: '#ffe8c8', nose: '#e36a90', inner: '#ffc6d6' },
    bunny: { body: '#f3efeb', belly: '#ffffff', nose: '#f08bb0', inner: '#ffc9dd' },
    bird: { body: '#5cb6f2', belly: '#e2f2ff', beak: '#ffb13b', inner: '#bfe3ff' },
    bear: { body: '#b9824f', belly: '#eccea8', nose: '#5e3b22', inner: '#caa179' },
    fox: { body: '#f08c3e', belly: '#fdf3e7', nose: '#3b2a22', inner: '#ffffff' }
  };

  // 通用萌脸：大眼 + 高光 + 腮红 + 微笑
  function face(g, cx, cy, hr, t, blinkOff) {
    const cyc = (t + (blinkOff || 0)) % 3.4, lid = cyc < 0.12 ? Math.sin(cyc / 0.12 * Math.PI) : 0, open = 1 - 0.9 * lid;
    g.fillStyle = 'rgba(255,150,170,.4)'; ell(g, cx - hr * 0.5, cy + hr * 0.24, hr * 0.18, hr * 0.12); g.fill(); ell(g, cx + hr * 0.5, cy + hr * 0.24, hr * 0.18, hr * 0.12); g.fill();
    for (const s of [-1, 1]) {
      const ex = cx + s * hr * 0.34, ey = cy - hr * 0.02;
      if (open < 0.25) { g.strokeStyle = '#3a3340'; g.lineWidth = hr * 0.06; g.lineCap = 'round'; g.beginPath(); g.arc(ex, ey, hr * 0.16, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
      else {
        g.save(); g.translate(ex, ey); g.scale(1, open);
        ell(g, 0, 0, hr * 0.16, hr * 0.21); g.fillStyle = '#2c2230'; g.fill();
        circ(g, -hr * 0.05, -hr * 0.06, hr * 0.06); g.fillStyle = 'rgba(255,255,255,.95)'; g.fill();
        circ(g, hr * 0.04, hr * 0.06, hr * 0.03); g.fillStyle = 'rgba(255,255,255,.7)'; g.fill();
        g.restore();
      }
    }
  }

  // ── 地面小动物（蹲坐自然形态）──
  function drawGround(g, id, h, T) {
    const s = SP[id] || SP.cat, breathe = 1 + Math.sin(T * 2.2) * 0.02, wag = Math.sin(T * 3.5);
    const hx = 0, hy = -0.62 * h, hr = 0.3 * h;

    // 尾巴（身后）
    g.save();
    if (id === 'fox') { g.translate(-0.2 * h, -0.24 * h); g.rotate(wag * 0.18); g.fillStyle = s.body; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-0.28 * h, -0.04 * h, -0.22 * h, -0.28 * h); g.quadraticCurveTo(-0.12 * h, -0.12 * h, 0.02 * h, -0.02 * h); g.fill(); g.fillStyle = '#fff'; ell(g, -0.2 * h, -0.24 * h, 0.06 * h, 0.07 * h, 0.5); g.fill(); }
    else if (id === 'cat') { g.translate(0.22 * h, -0.22 * h); g.rotate(wag * 0.2); g.strokeStyle = s.body; g.lineWidth = 0.09 * h; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(0.2 * h, -0.02 * h, 0.14 * h, -0.26 * h); g.stroke(); }
    else if (id === 'bunny') { g.translate(0.2 * h, -0.06 * h); g.fillStyle = '#fff'; circ(g, 0, 0, 0.09 * h); g.fill(); }
    else if (id === 'bear') { g.translate(0.2 * h, -0.12 * h); g.fillStyle = dk(s.body, -14); circ(g, 0, 0, 0.06 * h); g.fill(); }
    g.restore();

    // 后腿/坐垫
    g.fillStyle = dk(s.body, -16); ell(g, -0.17 * h, -0.06 * h, 0.13 * h, 0.09 * h); g.fill(); ell(g, 0.17 * h, -0.06 * h, 0.13 * h, 0.09 * h); g.fill();
    // 身体（蹲坐圆胖）
    g.fillStyle = lg(g, 0, -0.5 * h, 0, 0, s.body, dk(s.body, -20));
    ell(g, 0, -0.3 * h, 0.28 * h * breathe, 0.3 * h); g.fill();
    g.fillStyle = s.belly; ell(g, 0, -0.22 * h, 0.17 * h, 0.2 * h); g.fill();
    // 前爪
    g.fillStyle = s.belly; ell(g, -0.1 * h, -0.02 * h, 0.075 * h, 0.05 * h); g.fill(); ell(g, 0.1 * h, -0.02 * h, 0.075 * h, 0.05 * h); g.fill();

    // 耳朵（头后）
    if (id === 'cat' || id === 'fox') { const tip = id === 'fox' ? 1.15 : 0.9; for (const k of [-1, 1]) { g.fillStyle = s.body; g.beginPath(); g.moveTo(hx + k * hr * 0.5, hy - hr * 0.55); g.lineTo(hx + k * hr * 0.46, hy - hr * (0.55 + tip)); g.lineTo(hx + k * hr * 0.98, hy - hr * 0.45); g.closePath(); g.fill(); g.fillStyle = id === 'fox' ? '#3b2a22' : s.inner; g.beginPath(); g.moveTo(hx + k * hr * 0.54, hy - hr * (0.55 + tip * 0.5)); g.lineTo(hx + k * hr * 0.5, hy - hr * (0.55 + tip * 0.85)); g.lineTo(hx + k * hr * 0.8, hy - hr * 0.5); g.closePath(); g.fill(); } }
    else if (id === 'bunny') { for (const k of [-1, 1]) { g.save(); g.translate(hx + k * hr * 0.34, hy - hr * 0.5); g.rotate(k * 0.16 + Math.sin(T * 2 + k) * 0.05); g.fillStyle = s.body; ell(g, 0, -hr * 0.6, hr * 0.19, hr * 0.66); g.fill(); g.fillStyle = s.inner; ell(g, 0, -hr * 0.55, hr * 0.1, hr * 0.46); g.fill(); g.restore(); } }
    else if (id === 'bear') { for (const k of [-1, 1]) { g.fillStyle = s.body; circ(g, hx + k * hr * 0.66, hy - hr * 0.62, hr * 0.28); g.fill(); g.fillStyle = s.inner; circ(g, hx + k * hr * 0.66, hy - hr * 0.58, hr * 0.15); g.fill(); } }

    // 头
    g.fillStyle = lg(g, 0, hy - hr, 0, hy + hr, s.body, dk(s.body, -14)); circ(g, hx, hy, hr); g.fill();
    // 口鼻区
    if (id === 'bear' || id === 'fox') { g.fillStyle = s.belly; if (id === 'fox') { g.beginPath(); g.moveTo(hx, hy + hr * 0.05); g.lineTo(hx - hr * 0.32, hy + hr * 0.6); g.lineTo(hx + hr * 0.32, hy + hr * 0.6); g.closePath(); g.fill(); } else { ell(g, hx, hy + hr * 0.4, hr * 0.34, hr * 0.26); g.fill(); } }
    // 鼻
    g.fillStyle = s.nose; ell(g, hx, hy + hr * 0.3, hr * 0.1, hr * 0.075); g.fill();
    // 嘴
    g.strokeStyle = id === 'bear' ? '#7a5233' : '#a86a4a'; g.lineWidth = hr * 0.045; g.lineCap = 'round';
    g.beginPath(); g.moveTo(hx, hy + hr * 0.36); g.lineTo(hx, hy + hr * 0.46); g.moveTo(hx, hy + hr * 0.46); g.quadraticCurveTo(hx - hr * 0.12, hy + hr * 0.54, hx - hr * 0.18, hy + hr * 0.44); g.moveTo(hx, hy + hr * 0.46); g.quadraticCurveTo(hx + hr * 0.12, hy + hr * 0.54, hx + hr * 0.18, hy + hr * 0.44); g.stroke();
    // 胡须（猫）
    if (id === 'cat') { g.strokeStyle = 'rgba(120,90,60,.45)'; g.lineWidth = hr * 0.02; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(hx + k * hr * 0.14, hy + hr * 0.28); g.lineTo(hx + k * hr * 0.62, hy + hr * 0.2); g.moveTo(hx + k * hr * 0.14, hy + hr * 0.34); g.lineTo(hx + k * hr * 0.6, hy + hr * 0.4); g.stroke(); } }
    // 门牙（兔）
    if (id === 'bunny') { g.fillStyle = '#fff'; g.fillRect(hx - hr * 0.09, hy + hr * 0.4, hr * 0.075, hr * 0.14); g.fillRect(hx + hr * 0.015, hy + hr * 0.4, hr * 0.075, hr * 0.14); }

    face(g, hx, hy - hr * 0.05, hr, T, (id.charCodeAt(0) % 6) * 0.4);
  }

  // ── 小鸟（飞行姿态）──
  function drawBird(g, h, T) {
    const s = SP.bird, flap = Math.sin(T * 9), hx = 0, hy = -0.4 * h;
    // 尾羽
    g.fillStyle = dk(s.body, -20); g.save(); g.translate(-0.16 * h, -0.22 * h); g.rotate(0.4); for (let i = -1; i <= 1; i++) { g.save(); g.rotate(i * 0.22); g.beginPath(); g.moveTo(0, 0); g.lineTo(-0.16 * h, -0.03 * h); g.lineTo(-0.16 * h, 0.03 * h); g.closePath(); g.fill(); g.restore(); } g.restore();
    // 左翅（远）
    g.fillStyle = dk(s.body, -14); g.save(); g.translate(-0.14 * h, hy + 0.06 * h); g.rotate(-0.5 - flap * 0.5); ell(g, -0.14 * h, 0, 0.16 * h, 0.07 * h); g.fill(); g.restore();
    // 身
    g.fillStyle = lg(g, 0, hy - 0.28 * h, 0, 0.02 * h, s.body, dk(s.body, -16)); ell(g, hx, hy, 0.25 * h, 0.3 * h); g.fill();
    g.fillStyle = s.belly; ell(g, hx, hy + 0.06 * h, 0.15 * h, 0.19 * h); g.fill();
    // 冠羽
    g.fillStyle = dk(s.body, 16); for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(hx + i * 0.06 * h, hy - 0.26 * h); g.quadraticCurveTo(hx + i * 0.06 * h + i * 0.04 * h, hy - 0.42 * h, hx + i * 0.06 * h, hy - 0.28 * h); g.lineTo(hx + i * 0.06 * h - 0.03 * h, hy - 0.26 * h); g.fill(); }
    // 喙
    g.fillStyle = s.beak; g.beginPath(); g.moveTo(hx - 0.06 * h, hy - 0.02 * h); g.lineTo(hx + 0.06 * h, hy - 0.02 * h); g.lineTo(hx, hy + 0.1 * h); g.closePath(); g.fill();
    // 小脚
    g.strokeStyle = s.beak; g.lineWidth = 0.02 * h; g.lineCap = 'round'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(hx + k * 0.05 * h, hy + 0.28 * h); g.lineTo(hx + k * 0.05 * h, hy + 0.34 * h); g.stroke(); }
    face(g, hx, hy - 0.06 * h, 0.24 * h, T, 1.1);
    // 右翅（近，挥动）
    g.fillStyle = s.body; g.save(); g.translate(0.14 * h, hy + 0.06 * h); g.rotate(0.5 + flap * 0.5); ell(g, 0.14 * h, 0, 0.17 * h, 0.075 * h); g.fill(); ell(g, 0.14 * h, 0, 0.1 * h, 0.05 * h); g.fillStyle = s.inner; g.fill(); g.restore();
  }

  // ── 小朋友（小小的可爱人类小孩）──
  function drawKid(g, h, T) {
    const skin = '#ffd9b8', hair = '#7a4a28', dress = '#ff8fab', bob = Math.abs(Math.sin(T * 4)) * 0.02 * h;
    g.save(); g.translate(0, -bob);
    // 腿
    g.fillStyle = '#6a7ba0'; g.fillRect(-0.09 * h, -0.16 * h, 0.07 * h, 0.16 * h); g.fillRect(0.02 * h, -0.16 * h, 0.07 * h, 0.16 * h);
    g.fillStyle = '#3a4763'; ell(g, -0.055 * h, -0.005 * h, 0.055 * h, 0.03 * h); g.fill(); ell(g, 0.055 * h, -0.005 * h, 0.055 * h, 0.03 * h); g.fill();
    // 连衣裙
    g.fillStyle = dress; g.beginPath(); g.moveTo(-0.1 * h, -0.16 * h); g.lineTo(0.1 * h, -0.16 * h); g.lineTo(0.15 * h, -0.42 * h); g.quadraticCurveTo(0, -0.5 * h, -0.15 * h, -0.42 * h); g.closePath(); g.fill();
    // 手臂
    g.strokeStyle = skin; g.lineWidth = 0.055 * h; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-0.12 * h, -0.4 * h); g.lineTo(-0.18 * h, -0.28 * h); g.stroke();
    g.save(); g.translate(0.12 * h, -0.4 * h); g.rotate(-0.7 - Math.max(0, Math.sin(T * 4)) * 0.5); g.beginPath(); g.moveTo(0, 0); g.lineTo(0.12 * h, 0); g.stroke(); circ(g, 0.14 * h, 0, 0.03 * h); g.fillStyle = skin; g.fill(); g.restore();
    // 头
    const hy = -0.62 * h, hr = 0.19 * h;
    g.fillStyle = skin; circ(g, 0, hy, hr); g.fill();
    g.fillStyle = hair; g.beginPath(); g.arc(0, hy, hr * 1.05, Math.PI, 0); g.quadraticCurveTo(hr * 0.9, hy + hr * 0.3, hr * 0.7, hy + hr * 0.15); g.quadraticCurveTo(0, hy - hr * 0.3, -hr * 0.7, hy + hr * 0.15); g.quadraticCurveTo(-hr * 0.9, hy + hr * 0.3, -hr * 1.05, hy); g.fill();
    for (const k of [-1, 1]) { g.beginPath(); circ(g, k * hr * 0.95, hy - hr * 0.05, hr * 0.28); g.fill(); }   // 双丸子/鬓发
    face(g, 0, hy, hr, T, 0.5);
    g.restore();
  }

  function draw(ctx, id, x, yBottom, size, t, opts) {
    opts = opts || {};
    const h = size, T = (t || 0) + (opts.phase || 0);
    ctx.save(); ctx.translate(x, yBottom);
    if (opts.fly || id === 'bird') { ctx.translate(0, Math.sin(T * 2) * h * 0.04); drawBird(ctx, h, T); }
    else if (id === 'kid') drawKid(ctx, h, T);
    else drawGround(ctx, id, h, T);
    ctx.restore();
  }

  return { draw };
})();
