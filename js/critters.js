/* ===========================================================================
   回收乐园 · 来访小动物（拟人化卡通角色）
   Critters.draw(ctx, id, x, yFeet, size, t, opts) — 以 (x,yFeet) 为脚下站立点，
   向上画一个会走/挥手问好的可爱拟人小动物（猫/兔/鸟/熊/狐狸/小朋友）。
   =========================================================================== */
window.Critters = (function () {
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 7); g.closePath(); }
  function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 7); g.closePath(); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function lg(g, x0, y0, x1, y1, a, b) { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; }
  function dark(hex, d) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) + d, g = ((n >> 8) & 255) + d, b = (n & 255) + d; r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b)); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }

  const SP = {
    cat: { body: '#f6a94e', belly: '#ffe6c4', ear: 'tri', tail: 'cat', nose: '#e36a90', innerEar: '#ffc6d6' },
    bunny: { body: '#f1ede9', belly: '#ffffff', ear: 'long', tail: 'puff', nose: '#f08bb0', innerEar: '#ffc9dd' },
    bird: { body: '#5cb6f2', belly: '#dff1ff', ear: 'crest', tail: 'bird', nose: '#ffb13b', innerEar: '#bfe3ff', wings: true },
    bear: { body: '#b9824f', belly: '#ecceA8', ear: 'round', tail: 'none', nose: '#5e3b22', innerEar: '#caa179' },
    fox: { body: '#f08c3e', belly: '#fdf3e7', ear: 'foxtri', tail: 'foxtail', nose: '#3b2a22', innerEar: '#fff', cheeks: true },
    kid: { human: true }
  };

  // 通用脸：大眼 + 腮红 + 微笑
  function face(g, cx, cy, hr, t, blinkOff) {
    const cyc = (t + (blinkOff || 0)) % 3.6, lid = cyc < 0.12 ? Math.sin(cyc / 0.12 * Math.PI) : 0, open = 1 - 0.9 * lid;
    g.fillStyle = 'rgba(255,150,170,.42)'; ell(g, cx - hr * 0.52, cy + hr * 0.28, hr * 0.2, hr * 0.13); g.fill(); ell(g, cx + hr * 0.52, cy + hr * 0.28, hr * 0.2, hr * 0.13); g.fill();
    for (const s of [-1, 1]) {
      const ex = cx + s * hr * 0.38, ey = cy + hr * 0.05;
      if (open < 0.25) { g.strokeStyle = '#3a3340'; g.lineWidth = hr * 0.06; g.lineCap = 'round'; g.beginPath(); g.arc(ex, ey, hr * 0.16, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
      else {
        g.save(); g.translate(ex, ey); g.scale(1, open);
        ell(g, 0, 0, hr * 0.17, hr * 0.22); g.fillStyle = '#fff'; g.fill();
        circ(g, 0, hr * 0.03, hr * 0.13); g.fillStyle = '#2c2230'; g.fill();
        circ(g, -hr * 0.05, -hr * 0.04, hr * 0.055); g.fillStyle = 'rgba(255,255,255,.95)'; g.fill();
        g.restore();
      }
    }
    // 微笑嘴
    g.strokeStyle = '#9a5a44'; g.lineWidth = hr * 0.05; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy + hr * 0.34, hr * 0.16, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
  }

  function drawTail(g, h, T, s) {
    const wag = Math.sin(T * 4) * 0.2;
    g.save(); g.translate(-0.16 * h, -0.34 * h); g.rotate(wag);
    if (s.tail === 'foxtail') { g.fillStyle = s.body; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-0.22 * h, 0.05 * h, -0.2 * h, -0.18 * h); g.quadraticCurveTo(-0.14 * h, -0.1 * h, 0, 0); g.fill(); g.fillStyle = '#fff'; ell(g, -0.18 * h, -0.14 * h, 0.05 * h, 0.06 * h, 0.5); g.fill(); }
    else if (s.tail === 'cat') { g.strokeStyle = s.body; g.lineWidth = 0.07 * h; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-0.2 * h, 0.02 * h, -0.16 * h, -0.2 * h); g.stroke(); }
    else if (s.tail === 'puff') { g.fillStyle = '#fff'; circ(g, -0.05 * h, 0.02 * h, 0.08 * h); g.fill(); }
    else if (s.tail === 'bird') { g.fillStyle = dark(s.body, -25); for (let i = -1; i <= 1; i++) { g.save(); g.rotate(i * 0.3); rr(g, -0.22 * h, -0.03 * h, 0.16 * h, 0.06 * h, 0.03 * h); g.fill(); g.restore(); } }
    g.restore();
  }

  function ears(g, cx, cy, hr, s) {
    if (s.ear === 'tri' || s.ear === 'foxtri') { const sp = s.ear === 'foxtri' ? 0.62 : 0.56, hgt = s.ear === 'foxtri' ? 1.1 : 0.85; for (const k of [-1, 1]) { g.fillStyle = s.body; g.beginPath(); g.moveTo(cx + k * hr * sp, cy - hr * 0.55); g.lineTo(cx + k * hr * (sp - 0.04), cy - hr * (0.55 + hgt)); g.lineTo(cx + k * hr * (sp + 0.42), cy - hr * 0.5); g.closePath(); g.fill(); g.fillStyle = s.ear === 'foxtri' ? '#3b2a22' : s.innerEar; g.beginPath(); g.moveTo(cx + k * hr * (sp + 0.02), cy - hr * (0.55 + hgt * 0.55)); g.lineTo(cx + k * hr * (sp + 0.04), cy - hr * (0.55 + hgt * 0.9)); g.lineTo(cx + k * hr * (sp + 0.28), cy - hr * 0.55); g.closePath(); g.fill(); } }
    else if (s.ear === 'long') { for (const k of [-1, 1]) { g.save(); g.translate(cx + k * hr * 0.36, cy - hr * 0.6); g.rotate(k * 0.18); g.fillStyle = s.body; ell(g, 0, -hr * 0.55, hr * 0.2, hr * 0.62); g.fill(); g.fillStyle = s.innerEar; ell(g, 0, -hr * 0.5, hr * 0.1, hr * 0.42); g.fill(); g.restore(); } }
    else if (s.ear === 'round') { for (const k of [-1, 1]) { g.fillStyle = s.body; circ(g, cx + k * hr * 0.66, cy - hr * 0.66, hr * 0.28); g.fill(); g.fillStyle = s.innerEar; circ(g, cx + k * hr * 0.66, cy - hr * 0.62, hr * 0.15); g.fill(); } }
    else if (s.ear === 'crest') { g.fillStyle = dark(s.body, 20); for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(cx + i * hr * 0.16, cy - hr * 0.7); g.quadraticCurveTo(cx + i * hr * 0.16 + i * hr * 0.1, cy - hr * 1.15, cx + i * hr * 0.16, cy - hr * 0.78); g.lineTo(cx + i * hr * 0.16 - hr * 0.08, cy - hr * 0.74); g.fill(); } }
  }

  function snout(g, cx, cy, hr, s, T) {
    if (s.body === '#b9824f' /*bear*/ || s.ear === 'round') { g.fillStyle = s.belly; ell(g, cx, cy + hr * 0.42, hr * 0.36, hr * 0.28); g.fill(); }
    if (s.ear === 'foxtri') { g.fillStyle = s.belly; g.beginPath(); g.moveTo(cx, cy + hr * 0.1); g.lineTo(cx - hr * 0.34, cy + hr * 0.62); g.lineTo(cx + hr * 0.34, cy + hr * 0.62); g.closePath(); g.fill(); }
    // 鼻
    if (s.ear === 'crest') { g.fillStyle = s.nose; g.beginPath(); g.moveTo(cx - hr * 0.16, cy + hr * 0.16); g.lineTo(cx + hr * 0.16, cy + hr * 0.16); g.lineTo(cx, cy + hr * 0.4); g.closePath(); g.fill(); }    // 鸟嘴
    else { g.fillStyle = s.nose; ell(g, cx, cy + hr * 0.3, hr * 0.11, hr * 0.08); g.fill(); }
    if (s.ear === 'tri') { g.strokeStyle = 'rgba(120,90,60,.5)'; g.lineWidth = hr * 0.025; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(cx + k * hr * 0.16, cy + hr * 0.32); g.lineTo(cx + k * hr * 0.66, cy + hr * 0.26); g.moveTo(cx + k * hr * 0.16, cy + hr * 0.38); g.lineTo(cx + k * hr * 0.62, cy + hr * 0.42); g.stroke(); } }   // 猫胡须
    if (s.ear === 'long') { g.fillStyle = '#fff'; rr(g, cx - hr * 0.1, cy + hr * 0.42, hr * 0.08, hr * 0.14, hr * 0.02); g.fill(); rr(g, cx + hr * 0.02, cy + hr * 0.42, hr * 0.08, hr * 0.14, hr * 0.02); g.fill(); }   // 兔门牙
  }

  function drawKid(g, h, T, wave) {
    const skin = '#ffd9b8', hair = '#7a4a28', shirt = '#ff8fab';
    // 腿
    g.fillStyle = '#5b6b8a'; rr(g, -0.1 * h, -0.2 * h, 0.08 * h, 0.2 * h, 0.03 * h); g.fill(); rr(g, 0.02 * h, -0.2 * h, 0.08 * h, 0.2 * h, 0.03 * h); g.fill();
    g.fillStyle = '#3a4763'; ell(g, -0.06 * h, -0.01 * h, 0.06 * h, 0.03 * h); g.fill(); ell(g, 0.06 * h, -0.01 * h, 0.06 * h, 0.03 * h); g.fill();
    // 身(背带裤/裙)
    g.fillStyle = shirt; rr(g, -0.16 * h, -0.52 * h, 0.32 * h, 0.34 * h, 0.1 * h); g.fill();
    g.fillStyle = dark(shirt, -28); rr(g, -0.12 * h, -0.36 * h, 0.24 * h, 0.18 * h, 0.06 * h); g.fill();
    // 手臂(右挥手)
    g.strokeStyle = skin; g.lineWidth = 0.07 * h; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-0.15 * h, -0.46 * h); g.lineTo(-0.22 * h, -0.32 * h); g.stroke();
    g.save(); g.translate(0.15 * h, -0.46 * h); g.rotate(-0.6 - Math.max(0, wave) * 0.5); g.beginPath(); g.moveTo(0, 0); g.lineTo(0.14 * h, 0); g.stroke(); circ(g, 0.16 * h, 0, 0.035 * h); g.fillStyle = skin; g.fill(); g.restore();
    // 头
    const cy = -0.72 * h, hr = 0.2 * h;
    g.fillStyle = skin; circ(g, 0, cy, hr); g.fill();
    g.fillStyle = hair; g.beginPath(); g.arc(0, cy, hr * 1.04, Math.PI * 1.04, Math.PI * 1.96); g.lineTo(hr * 0.7, cy - hr * 0.1); g.quadraticCurveTo(0, cy - hr * 0.5, -hr * 0.7, cy - hr * 0.1); g.closePath(); g.fill();
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * hr * 0.95, cy - hr * 0.2); g.quadraticCurveTo(k * hr * 1.15, cy + hr * 0.2, k * hr * 0.8, cy + hr * 0.35); g.lineTo(k * hr * 0.6, cy - hr * 0.1); g.fill(); }
    face(g, 0, cy, hr, T, 0.5);
  }

  function draw(ctx, id, x, yFeet, size, t, opts) {
    opts = opts || {};
    const h = size, T = (t || 0) + (opts.phase || 0), walk = Math.abs(Math.sin(T * 5)), bob = walk * h * 0.025, wave = Math.sin(T * 5);
    ctx.save(); ctx.translate(x, yFeet - bob);
    const s = SP[id] || SP.cat;
    if (s.human) { drawKid(ctx, h, T, wave); ctx.restore(); return; }
    drawTail(ctx, h, T, s);
    // 腿
    const lsw = Math.sin(T * 5) * h * 0.05;
    ctx.fillStyle = dark(s.body, -18);
    rr(ctx, -0.11 * h + lsw, -0.18 * h, 0.1 * h, 0.18 * h, 0.04 * h); ctx.fill();
    rr(ctx, 0.01 * h - lsw, -0.18 * h, 0.1 * h, 0.18 * h, 0.04 * h); ctx.fill();
    // 身体
    ctx.fillStyle = lg(ctx, 0, -0.58 * h, 0, -0.2 * h, s.body, dark(s.body, -22));
    ell(ctx, 0, -0.4 * h, 0.19 * h, 0.21 * h); ctx.fill();
    ctx.fillStyle = s.belly; ell(ctx, 0, -0.35 * h, 0.12 * h, 0.15 * h); ctx.fill();
    // 手臂 / 翅膀
    if (s.wings) { ctx.fillStyle = dark(s.body, -12); ell(ctx, -0.18 * h, -0.42 * h, 0.06 * h, 0.13 * h, 0.3); ctx.fill(); ctx.save(); ctx.translate(0.18 * h, -0.5 * h); ctx.rotate(-0.5 - Math.max(0, wave) * 0.6); ell(ctx, 0, 0.08 * h, 0.06 * h, 0.13 * h, -0.3); ctx.fill(); ctx.restore(); }
    else { ctx.strokeStyle = s.body; ctx.lineWidth = 0.07 * h; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-0.15 * h, -0.48 * h); ctx.lineTo(-0.2 * h, -0.34 * h); ctx.stroke(); ctx.save(); ctx.translate(0.15 * h, -0.5 * h); ctx.rotate(-0.7 - Math.max(0, wave) * 0.5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0.13 * h, 0); ctx.stroke(); ctx.fillStyle = s.body; circ(ctx, 0.15 * h, 0, 0.04 * h); ctx.fill(); ctx.restore(); }
    // 头
    const cy = -0.72 * h, hr = 0.2 * h;
    ears(ctx, 0, cy, hr, s);
    if (s.cheeks) { ctx.fillStyle = s.belly; circ(ctx, -hr * 0.55, cy + hr * 0.2, hr * 0.42); ctx.fill(); circ(ctx, hr * 0.55, cy + hr * 0.2, hr * 0.42); ctx.fill(); }
    ctx.fillStyle = lg(ctx, 0, cy - hr, 0, cy + hr, s.body, dark(s.body, -16)); circ(ctx, 0, cy, hr); ctx.fill();
    snout(ctx, 0, cy, hr, s, T);
    face(ctx, 0, cy, hr, T, (id.charCodeAt(0) % 7) * 0.3);
    ctx.restore();
  }

  return { draw };
})();
