/* ===========================================================================
   回收乐园 · 程序化美术 v0.2（厚涂质感：垂直渐变 + 分层阴影 + 高光 + 柔描边）
   统一光照：光从左上来；底部加深、顶部高光、外描边略深。
   Sprites.draw(ctx,key,cx,cy,size,opts) 以中心绘制，单位坐标 100×100。
   放 assets/sprites/<key>.png 可无缝替换为贴图。
   =========================================================================== */
window.Sprites = (function () {
  const OUT = '#3c2f26';
  const imgs = {}, tried = {};
  function tryImg(k) { if (tried[k]) return imgs[k] || null; tried[k] = true; const im = new Image(); im.onload = () => imgs[k] = im; im.onerror = () => {}; im.src = 'assets/sprites/' + k + '.png'; return null; }

  /* ---------- 原语 ---------- */
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 7); g.closePath(); }
  function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 7); g.closePath(); }
  function fill(g, c) { g.fillStyle = c; g.fill(); }
  function stroke(g, w, c) { g.lineWidth = w; g.strokeStyle = c || OUT; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  // 垂直渐变（亮→暗）
  function vgrad(g, y0, y1, top, bot) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, top); gr.addColorStop(1, bot); return gr; }
  // 高光小白点
  function spec(g, x, y, r) { circ(g, x, y, r); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill(); }
  // 顶部弧形高光（厚涂感）
  function sheen(g, x, y, w, h, r) { g.save(); rr(g, x, y, w, h, r); g.clip(); ell(g, x + w * 0.32, y + h * 0.05, w * 0.5, h * 0.4); g.fillStyle = 'rgba(255,255,255,.28)'; g.fill(); g.restore(); }
  // 柔和落影（贴在物体底部）
  function shadow(g) { ell(g, 50, 90, 26, 7); g.fillStyle = 'rgba(0,0,0,.13)'; g.fill(); }
  // 一双可爱眼睛
  function eyes(g, x, y, s, look) {
    look = look || 0;
    circ(g, x - s, y, s * 0.92); fill(g, '#fff'); stroke(g, 1.6);
    circ(g, x + s, y, s * 0.92); fill(g, '#fff'); stroke(g, 1.6);
    circ(g, x - s + look, y + s * 0.12, s * 0.46); fill(g, '#241c16');
    circ(g, x + s + look, y + s * 0.12, s * 0.46); fill(g, '#241c16');
    spec(g, x - s + look - s * 0.15, y - s * 0.2, s * 0.18);
    spec(g, x + s + look - s * 0.15, y - s * 0.2, s * 0.18);
  }
  function blush(g, x, y, s) { circ(g, x - s * 2.1, y + s, s * 0.5); fill(g, 'rgba(255,130,130,.5)'); circ(g, x + s * 2.1, y + s, s * 0.5); fill(g, 'rgba(255,130,130,.5)'); }
  function smile(g, x, y, w) { g.beginPath(); g.arc(x, y, w, 0.2, Math.PI - 0.2); stroke(g, 2.4); }

  const F = {};

  /* ===================== 垃圾 ===================== */
  F.t_bottle = g => { shadow(g);
    rr(g, 37, 20, 26, 66, 12); fill(g, vgrad(g, 20, 86, '#bfeefc', '#5bb6e0')); stroke(g, 3);
    rr(g, 44, 9, 12, 16, 4); fill(g, '#2f8fcf'); stroke(g, 3);
    rr(g, 37, 46, 26, 13, 5); fill(g, 'rgba(255,255,255,.35)'); // 标签留白
    g.save(); rr(g, 37, 20, 26, 66, 12); g.clip(); rr(g, 40, 24, 7, 56, 4); fill(g, 'rgba(255,255,255,.5)'); g.restore(); };
  F.t_bag = g => { shadow(g);
    g.beginPath(); g.moveTo(28, 36); g.quadraticCurveTo(18, 82, 42, 87); g.quadraticCurveTo(50, 90, 58, 87); g.quadraticCurveTo(82, 82, 72, 36); g.closePath();
    fill(g, vgrad(g, 30, 88, '#f2fbff', '#cfeaf6')); stroke(g, 3);
    rr(g, 39, 22, 9, 17, 3); fill(g, '#eaf6ff'); stroke(g, 3); rr(g, 52, 22, 9, 17, 3); fill(g, '#eaf6ff'); stroke(g, 3);
    g.beginPath(); g.moveTo(40, 50); g.quadraticCurveTo(50, 60, 60, 50); stroke(g, 2); };
  F.t_cup = g => { shadow(g);
    g.beginPath(); g.moveTo(33, 32); g.lineTo(40, 84); g.quadraticCurveTo(50, 90, 60, 84); g.lineTo(67, 32); g.closePath();
    fill(g, vgrad(g, 32, 88, '#ffffff', '#e3e8ee')); stroke(g, 3);
    rr(g, 29, 26, 42, 10, 5); fill(g, '#ff6b6b'); stroke(g, 3);
    g.beginPath(); g.moveTo(50, 14); g.lineTo(50, 30); stroke(g, 3); ell(g, 50, 13, 4, 2); fill(g, '#ff6b6b'); };
  F.t_can = g => { shadow(g);
    rr(g, 35, 22, 30, 58, 9); fill(g, vgrad(g, 22, 80, '#ff8f8f', '#d94b4b')); stroke(g, 3);
    rr(g, 35, 40, 30, 15, 4); fill(g, 'rgba(255,255,255,.85)');
    rr(g, 33, 18, 34, 9, 5); fill(g, '#cfd6dd'); stroke(g, 3); circ(g, 50, 22, 3); fill(g, '#8a96a3');
    g.save(); rr(g, 35, 22, 30, 58, 9); g.clip(); rr(g, 38, 26, 6, 50, 3); fill(g, 'rgba(255,255,255,.4)'); g.restore(); };
  F.t_tin = g => { shadow(g);
    rr(g, 33, 26, 34, 50, 7); fill(g, vgrad(g, 26, 76, '#eef2f6', '#c2cad3')); stroke(g, 3);
    rr(g, 40, 40, 20, 22, 3); fill(g, '#ffb38a'); stroke(g, 2);
    rr(g, 33, 26, 34, 7, 5); fill(g, '#d8dee5'); };
  F.t_glass = g => { shadow(g);
    rr(g, 40, 22, 20, 62, 9); fill(g, vgrad(g, 22, 84, '#9af0d6', '#2fb98f')); stroke(g, 3);
    rr(g, 44, 10, 12, 14, 4); fill(g, '#0e9e76'); stroke(g, 3);
    rr(g, 38, 42, 24, 16, 5); fill(g, 'rgba(255,255,255,.4)');
    g.save(); rr(g, 40, 22, 20, 62, 9); g.clip(); rr(g, 43, 26, 5, 52, 3); fill(g, 'rgba(255,255,255,.55)'); g.restore(); };
  F.t_news = g => { shadow(g); g.save(); g.translate(50, 52); g.rotate(-0.1);
    rr(g, -32, -24, 64, 48, 3); fill(g, vgrad(g, -24, 24, '#f7f2e6', '#ded7c2')); stroke(g, 3);
    rr(g, -26, -18, 52, 7, 1); fill(g, '#a59a82');
    for (let i = 0; i < 4; i++) { rr(g, -26, -7 + i * 8, 24, 3, 1); fill(g, '#bdb39c'); rr(g, 2, -7 + i * 8, 24, 3, 1); fill(g, '#bdb39c'); } g.restore(); };
  F.t_box = g => { shadow(g);
    g.beginPath(); g.moveTo(26, 40); g.lineTo(50, 28); g.lineTo(74, 40); g.lineTo(74, 74); g.lineTo(50, 86); g.lineTo(26, 74); g.closePath();
    fill(g, '#d9a463'); stroke(g, 3);
    g.beginPath(); g.moveTo(50, 28); g.lineTo(74, 40); g.lineTo(74, 74); g.lineTo(50, 86); g.closePath(); fill(g, '#c08a4e');
    g.beginPath(); g.moveTo(26, 40); g.lineTo(50, 52); g.lineTo(50, 86); g.lineTo(26, 74); g.closePath(); fill(g, '#e6b277');
    g.beginPath(); g.moveTo(50, 28); g.lineTo(50, 52); stroke(g, 2); g.beginPath(); g.moveTo(26, 40); g.lineTo(50, 52); g.lineTo(74, 40); stroke(g, 2);
    rr(g, 44, 30, 12, 5, 1); fill(g, 'rgba(255,255,255,.4)'); };
  F.t_driftwood = g => { shadow(g); g.save(); g.translate(50, 52); g.rotate(-0.18);
    rr(g, -34, -10, 68, 20, 9); fill(g, vgrad(g, -10, 10, '#b98a5c', '#8a623d')); stroke(g, 3);
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 12, -8); g.quadraticCurveTo(i * 12 + 3, 0, i * 12, 8); stroke(g, 1.5, 'rgba(80,55,30,.5)'); }
    ell(g, 22, 0, 4, 6); fill(g, '#6b4a2c'); circ(g, 22, 0, 1.5); fill(g, '#4a3220'); g.restore(); };
  F.t_plank = g => { shadow(g); g.save(); g.translate(50, 50); g.rotate(0.12);
    rr(g, -34, -12, 68, 24, 4); fill(g, vgrad(g, -12, 12, '#d6a96a', '#b07f47')); stroke(g, 3);
    rr(g, -30, -8, 60, 4, 2); fill(g, 'rgba(255,255,255,.2)');
    circ(g, -22, 0, 2.5); fill(g, '#5e4126'); circ(g, 22, 0, 2.5); fill(g, '#5e4126'); g.restore(); };
  F.t_tire = g => { shadow(g);
    circ(g, 50, 52, 30); fill(g, vgrad(g, 22, 82, '#4a525c', '#262b31')); stroke(g, 3);
    circ(g, 50, 52, 15); fill(g, '#7d8893'); stroke(g, 2.5); circ(g, 50, 52, 7); fill(g, '#aeb8c2');
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; g.beginPath(); g.moveTo(50 + Math.cos(a) * 24, 52 + Math.sin(a) * 24); g.lineTo(50 + Math.cos(a) * 30, 52 + Math.sin(a) * 30); stroke(g, 3, '#1c2024'); } };
  F.t_boot = g => { shadow(g);
    g.beginPath(); g.moveTo(40, 24); g.lineTo(54, 24); g.lineTo(56, 58); g.lineTo(74, 62); g.quadraticCurveTo(80, 64, 80, 72); g.lineTo(38, 72); g.quadraticCurveTo(36, 50, 40, 24); g.closePath();
    fill(g, vgrad(g, 24, 72, '#6db5d8', '#3b87b3')); stroke(g, 3);
    rr(g, 37, 70, 45, 6, 3); fill(g, '#2c4a5c'); rr(g, 39, 26, 14, 6, 2); fill(g, 'rgba(255,255,255,.35)'); };
  F.t_banana = g => { shadow(g); g.save(); g.translate(50, 52); g.rotate(0.3);
    g.beginPath(); g.moveTo(-30, -8); g.quadraticCurveTo(-32, 28, 8, 32); g.quadraticCurveTo(36, 32, 32, 6); g.quadraticCurveTo(20, 20, -8, 18); g.quadraticCurveTo(-24, 16, -30, -8); g.closePath();
    fill(g, vgrad(g, -8, 32, '#ffe486', '#e8b94e')); stroke(g, 3);
    g.beginPath(); g.moveTo(-30, -8); g.quadraticCurveTo(-20, -22, -10, -20); stroke(g, 3); ell(g, -10, -20, 4, 3); fill(g, '#7a5a2c'); g.restore(); };
  F.t_apple = g => { shadow(g);
    circ(g, 50, 56, 22); fill(g, vgrad(g, 34, 78, '#fbf2e2', '#e7d6bd')); stroke(g, 3);
    g.beginPath(); g.arc(50, 56, 22, -2.5, -0.6); g.lineTo(50, 56); g.closePath(); fill(g, '#ff7b7b');
    g.beginPath(); g.moveTo(50, 34); g.lineTo(50, 24); stroke(g, 3); ell(g, 57, 25, 6, 3, -0.6); fill(g, '#2ec27e'); stroke(g, 2); };
  F.t_fishbone = g => { shadow(g);
    g.beginPath(); g.moveTo(28, 52); g.lineTo(70, 52); stroke(g, 3, '#cdd3da');
    for (let i = 0; i < 5; i++) { const x = 33 + i * 8; g.beginPath(); g.moveTo(x, 52); g.lineTo(x - 5, 41); g.moveTo(x, 52); g.lineTo(x - 5, 63); stroke(g, 2.6, '#cdd3da'); }
    circ(g, 74, 52, 8); fill(g, '#e6ebf0'); stroke(g, 3); circ(g, 76, 50, 2); fill(g, OUT); };
  F.t_battery = g => { shadow(g);
    rr(g, 38, 22, 24, 58, 6); fill(g, vgrad(g, 22, 80, '#ffd877', '#f0a93a')); stroke(g, 3);
    rr(g, 44, 16, 12, 8, 2); fill(g, '#9aa7b5'); stroke(g, 3);
    rr(g, 38, 22, 24, 26, 6); fill(g, '#e0392b'); g.save(); rr(g, 38, 22, 24, 58, 6); g.clip(); rr(g, 38, 44, 24, 5, 0); fill(g, 'rgba(0,0,0,.15)'); g.restore();
    g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+', 50, 35); g.fillStyle = OUT; g.fillText('–', 50, 66); };
  F.t_bulb = g => { shadow(g);
    circ(g, 50, 42, 22); fill(g, vgrad(g, 20, 64, '#fff6cf', '#ffe27a')); stroke(g, 3);
    rr(g, 42, 60, 16, 15, 3); fill(g, vgrad(g, 60, 75, '#b9c2cc', '#8c97a3')); stroke(g, 3);
    g.beginPath(); g.moveTo(43, 65); g.lineTo(57, 65); g.moveTo(43, 70); g.lineTo(57, 70); stroke(g, 1.6, '#5e6670');
    g.beginPath(); g.moveTo(45, 44); g.lineTo(50, 50); g.lineTo(55, 44); stroke(g, 2.4, '#e0a800'); spec(g, 43, 34, 4); };
  F.t_foam = g => { shadow(g);
    rr(g, 28, 32, 44, 38, 8); fill(g, vgrad(g, 32, 70, '#ffffff', '#e2e6ec')); stroke(g, 3);
    for (let i = 0; i < 8; i++) circ(g, 36 + (i % 4) * 11, 44 + Math.floor(i / 4) * 15, 4), fill(g, '#d4d9e0'); };

  /* ===================== 原料图标 ===================== */
  F.m_wood = g => { rr(g, 28, 50, 44, 16, 4); fill(g, vgrad(g, 50, 66, '#cf9a5e', '#a87740')); stroke(g, 3); ell(g, 28, 58, 5, 8); fill(g, '#e0b681'); stroke(g, 2.5); circ(g, 28, 58, 2.5); fill(g, '#7a5530');
    rr(g, 34, 36, 44, 16, 4); fill(g, vgrad(g, 36, 52, '#d9a96a', '#b3824a')); stroke(g, 3); ell(g, 34, 44, 5, 8); fill(g, '#e8c089'); stroke(g, 2.5); circ(g, 34, 44, 2.5); fill(g, '#7a5530'); };
  F.m_plastic = g => { for (let i = 0; i < 3; i++) { circ(g, 38 + i * 12, 58 - i * 5, 13); fill(g, vgrad(g, 44 - i * 5, 70 - i * 5, '#ffc078', '#f0902a')); stroke(g, 3); spec(g, 34 + i * 12, 51 - i * 5, 3.5); } };
  F.m_metal = g => { g.beginPath(); g.moveTo(30, 64); g.lineTo(38, 46); g.lineTo(70, 46); g.lineTo(70, 64); g.closePath(); fill(g, vgrad(g, 46, 64, '#c2cbd4', '#8794a1')); stroke(g, 3);
    g.beginPath(); g.moveTo(38, 46); g.lineTo(46, 36); g.lineTo(78, 36); g.lineTo(70, 46); g.closePath(); fill(g, '#dde3e9'); stroke(g, 3); };
  F.m_glass = g => { const c = ['#48dbfb', '#7bed9f', '#a8e6ff']; for (let i = 0; i < 7; i++) { circ(g, 36 + (i % 4) * 9, 50 + Math.floor(i / 4) * 9, 5.4); fill(g, c[i % 3]); stroke(g, 1.8); spec(g, 34 + (i % 4) * 9, 48 + Math.floor(i / 4) * 9, 1.6); } };
  F.m_paper = g => { g.save(); g.translate(50, 50); g.rotate(-0.08); rr(g, -16, -12, 32, 30, 4); fill(g, vgrad(g, -12, 18, '#e6c89a', '#cda06a')); stroke(g, 3); g.restore();
    g.save(); g.translate(52, 48); g.rotate(0.1); rr(g, -16, -14, 32, 30, 4); fill(g, vgrad(g, -14, 16, '#f0d8ac', '#d9b27e')); stroke(g, 3); g.restore(); };
  F.m_rubber = g => { circ(g, 50, 54, 24); fill(g, vgrad(g, 30, 78, '#5b646f', '#2c333b')); stroke(g, 3); circ(g, 50, 54, 11); fill(g, '#828d99'); stroke(g, 2); circ(g, 50, 54, 5); fill(g, '#aab3bd'); spec(g, 40, 42, 4); };

  /* ===================== 可造物品 ===================== */
  F.i_stool = g => { shadow(g); rr(g, 30, 42, 40, 13, 6); fill(g, vgrad(g, 42, 55, '#e8b067', '#c4884a')); stroke(g, 3); rr(g, 35, 55, 7, 24, 3); fill(g, '#a8753e'); stroke(g, 3); rr(g, 58, 55, 7, 24, 3); fill(g, '#a8753e'); stroke(g, 3); sheen(g, 30, 42, 40, 13, 6); };
  F.i_table = g => { shadow(g); rr(g, 24, 38, 52, 13, 6); fill(g, vgrad(g, 38, 51, '#f0bd7a', '#d29a52')); stroke(g, 3); rr(g, 29, 51, 7, 30, 3); fill(g, '#9aa7b5'); stroke(g, 3); rr(g, 64, 51, 7, 30, 3); fill(g, '#9aa7b5'); stroke(g, 3); sheen(g, 24, 38, 52, 13, 6); };
  F.i_cupware = g => { shadow(g); g.beginPath(); g.moveTo(36, 40); g.lineTo(40, 78); g.quadraticCurveTo(50, 84, 60, 78); g.lineTo(64, 40); g.closePath(); fill(g, vgrad(g, 40, 82, '#7fe6f7', '#2fc0dd')); stroke(g, 3); g.beginPath(); g.arc(66, 56, 11, -1.2, 1.2); stroke(g, 3.5, '#2fc0dd'); ell(g, 50, 41, 14, 4); fill(g, '#aef0fb'); stroke(g, 2.5); };
  F.i_planter = g => { shadow(g); g.beginPath(); g.moveTo(34, 54); g.lineTo(40, 80); g.lineTo(60, 80); g.lineTo(66, 54); g.closePath(); fill(g, vgrad(g, 54, 80, '#6fe0f2', '#34c6e0')); stroke(g, 3); rr(g, 32, 50, 36, 8, 3); fill(g, '#2aa9c4'); circ(g, 44, 44, 9); fill(g, '#2ec27e'); stroke(g, 2); circ(g, 57, 42, 10); fill(g, '#34d98e'); stroke(g, 2); circ(g, 50, 35, 8); fill(g, '#27ae60'); stroke(g, 2); };
  F.i_flowers = g => { shadow(g); const c = ['#ff6b9d', '#feca57', '#ff9ff3']; for (let i = 0; i < 3; i++) { const x = 36 + i * 14, y = 48 + (i % 2) * 10; g.beginPath(); g.moveTo(x, 82); g.lineTo(x, y); stroke(g, 3, '#2ec27e'); for (let k = 0; k < 5; k++) { const a = k * 1.257; circ(g, x + Math.cos(a) * 8, y + Math.sin(a) * 8, 6); fill(g, c[i]); stroke(g, 1.6); } circ(g, x, y, 4); fill(g, '#fff3a0'); } };
  F.i_tree = g => { shadow(g); rr(g, 45, 54, 10, 28, 4); fill(g, vgrad(g, 54, 82, '#b1834e', '#8a6336')); stroke(g, 3); circ(g, 50, 40, 21); fill(g, vgrad(g, 20, 60, '#48d98a', '#2a9d5c')); stroke(g, 3); circ(g, 36, 47, 13); fill(g, '#34c172'); stroke(g, 3); circ(g, 64, 47, 13); fill(g, '#34c172'); stroke(g, 3); spec(g, 44, 32, 5); };
  F.i_bench = g => { shadow(g); rr(g, 24, 50, 52, 9, 3); fill(g, vgrad(g, 50, 59, '#e8b067', '#c4884a')); stroke(g, 3); rr(g, 24, 37, 52, 8, 3); fill(g, '#eeb872'); stroke(g, 3); rr(g, 29, 59, 6, 20, 2); fill(g, '#a8753e'); stroke(g, 3); rr(g, 65, 59, 6, 20, 2); fill(g, '#a8753e'); stroke(g, 3); };
  F.i_campchair = g => { shadow(g); g.beginPath(); g.moveTo(34, 40); g.lineTo(40, 70); g.lineTo(60, 70); g.lineTo(66, 40); g.closePath(); fill(g, vgrad(g, 40, 70, '#ff7a7a', '#e0392b')); stroke(g, 3); g.beginPath(); g.moveTo(34, 40); g.lineTo(36, 82); g.moveTo(66, 40); g.lineTo(64, 82); g.moveTo(40, 70); g.lineTo(32, 82); g.moveTo(60, 70); g.lineTo(68, 82); stroke(g, 3, '#9aa7b5'); rr(g, 33, 38, 34, 5, 2); fill(g, '#c0302a'); };
  F.i_pinwheel = g => { shadow(g); rr(g, 48, 48, 5, 34, 2); fill(g, '#a8753e'); stroke(g, 3); const c = ['#ff6b6b', '#feca57', '#54a0ff', '#1dd1a1']; for (let i = 0; i < 4; i++) { g.save(); g.translate(50, 44); g.rotate(i * Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(20, -7); g.quadraticCurveTo(22, 0, 15, 7); g.closePath(); fill(g, c[i]); stroke(g, 2.4); g.restore(); } circ(g, 50, 44, 4); fill(g, '#fff'); stroke(g, 2); };
  F.i_lamp = g => { shadow(g); rr(g, 47, 38, 6, 44, 2); fill(g, vgrad(g, 38, 82, '#b9c2cc', '#8794a1')); stroke(g, 3); rr(g, 35, 80, 30, 6, 3); fill(g, '#6e7a86'); stroke(g, 3); g.beginPath(); g.moveTo(39, 40); g.quadraticCurveTo(50, 24, 61, 40); g.closePath(); fill(g, vgrad(g, 24, 40, '#fff0a8', '#ffd24d')); stroke(g, 3); circ(g, 50, 37, 5); fill(g, '#fff8d6'); };
  F.i_seesaw = g => { shadow(g); g.save(); g.translate(50, 54); g.rotate(-0.17); rr(g, -32, -5, 64, 10, 5); fill(g, vgrad(g, -5, 5, '#6fb4ff', '#3d7fe0')); stroke(g, 3); circ(g, -29, -1, 6); fill(g, '#ff6b6b'); stroke(g, 2); circ(g, 29, -1, 6); fill(g, '#feca57'); stroke(g, 2); g.restore(); g.beginPath(); g.moveTo(42, 80); g.lineTo(50, 56); g.lineTo(58, 80); g.closePath(); fill(g, '#9aa7b5'); stroke(g, 3); };
  F.i_swing = g => { shadow(g); g.beginPath(); g.moveTo(28, 80); g.lineTo(40, 28); g.lineTo(60, 28); g.lineTo(72, 80); stroke(g, 3.5, '#9aa7b5'); rr(g, 37, 26, 26, 5, 2); fill(g, '#a8753e'); stroke(g, 3); g.beginPath(); g.moveTo(44, 31); g.lineTo(44, 62); g.moveTo(56, 31); g.lineTo(56, 62); stroke(g, 2.4, '#3c2f26'); rr(g, 41, 62, 18, 6, 2); fill(g, '#ff6b6b'); stroke(g, 3); };
  F.i_slide = g => { shadow(g); g.beginPath(); g.moveTo(30, 82); g.lineTo(30, 40); g.lineTo(44, 40); stroke(g, 4.5, '#9aa7b5'); g.beginPath(); g.moveTo(44, 38); g.quadraticCurveTo(56, 44, 58, 64); g.quadraticCurveTo(60, 80, 76, 82); g.lineTo(76, 73); g.quadraticCurveTo(66, 71, 66, 60); g.quadraticCurveTo(66, 42, 48, 34); g.lineTo(30, 34); g.lineTo(30, 40); g.lineTo(46, 42); g.closePath(); fill(g, vgrad(g, 34, 82, '#ffe06b', '#f0b21f')); stroke(g, 3.5); rr(g, 26, 32, 22, 5, 2); fill(g, '#ee5253'); stroke(g, 3); };
  F.i_bike = g => { shadow(g); circ(g, 35, 64, 14); stroke(g, 4, '#2c333b'); circ(g, 35, 64, 5); fill(g, '#9aa7b5'); circ(g, 67, 64, 14); stroke(g, 4, '#2c333b'); circ(g, 67, 64, 5); fill(g, '#9aa7b5'); g.beginPath(); g.moveTo(35, 64); g.lineTo(50, 64); g.lineTo(59, 42); g.lineTo(67, 64); g.moveTo(50, 64); g.lineTo(44, 42); g.lineTo(59, 42); stroke(g, 3.5, '#ee5253'); g.beginPath(); g.moveTo(40, 42); g.lineTo(48, 42); stroke(g, 4, '#3c2f26'); rr(g, 56, 36, 12, 5, 2); fill(g, '#3c2f26'); };
  F.i_tent = g => { shadow(g); g.beginPath(); g.moveTo(50, 26); g.lineTo(24, 82); g.lineTo(76, 82); g.closePath(); fill(g, vgrad(g, 26, 82, '#ff8a8a', '#e0392b')); stroke(g, 3.5); g.beginPath(); g.moveTo(50, 26); g.lineTo(50, 82); stroke(g, 3); g.beginPath(); g.moveTo(50, 82); g.lineTo(41, 56); g.lineTo(59, 56); g.closePath(); fill(g, '#ffe0b0'); stroke(g, 3); g.beginPath(); g.moveTo(50, 22); g.lineTo(50, 26); stroke(g, 3); circ(g, 50, 20, 3.5); fill(g, '#feca57'); stroke(g, 2); };

  /* ===================== 访客 ===================== */
  F.v_cat = g => { shadow(g); circ(g, 50, 54, 23); fill(g, vgrad(g, 31, 77, '#ffc987', '#f3a955')); stroke(g, 3);
    g.beginPath(); g.moveTo(34, 40); g.lineTo(30, 24); g.lineTo(47, 35); g.closePath(); fill(g, '#f3a955'); stroke(g, 3); g.beginPath(); g.moveTo(66, 40); g.lineTo(70, 24); g.lineTo(53, 35); g.closePath(); fill(g, '#f3a955'); stroke(g, 3);
    eyes(g, 50, 52, 6); blush(g, 50, 52, 6); smile(g, 50, 60, 4); g.beginPath(); g.moveTo(50, 58); g.lineTo(50, 62); stroke(g, 2); };
  F.v_bunny = g => { shadow(g); circ(g, 50, 58, 22); fill(g, vgrad(g, 36, 80, '#ffffff', '#e8eaef')); stroke(g, 3); rr(g, 38, 18, 9, 30, 5); fill(g, '#fff'); stroke(g, 3); rr(g, 53, 18, 9, 30, 5); fill(g, '#fff'); stroke(g, 3); rr(g, 41, 24, 4, 18, 2); fill(g, '#ffb3c6'); rr(g, 56, 24, 4, 18, 2); fill(g, '#ffb3c6'); eyes(g, 50, 56, 6); blush(g, 50, 56, 6); smile(g, 50, 64, 3.5); };
  F.v_bird = g => { shadow(g); circ(g, 50, 56, 19); fill(g, vgrad(g, 37, 75, '#74b3ff', '#3d7fe0')); stroke(g, 3); circ(g, 50, 40, 14); fill(g, '#74b3ff'); stroke(g, 3); g.beginPath(); g.moveTo(64, 40); g.lineTo(77, 44); g.lineTo(64, 48); g.closePath(); fill(g, '#feca57'); stroke(g, 2.5); eyes(g, 50, 38, 4.2); g.beginPath(); g.moveTo(33, 56); g.quadraticCurveTo(22, 52, 29, 68); g.closePath(); fill(g, '#3576d6'); stroke(g, 2.5); };
  F.v_bear = g => { shadow(g); circ(g, 50, 56, 24); fill(g, vgrad(g, 32, 80, '#c79566', '#a3724a')); stroke(g, 3); circ(g, 34, 36, 10); fill(g, '#b9855c'); stroke(g, 3); circ(g, 66, 36, 10); fill(g, '#b9855c'); stroke(g, 3); ell(g, 50, 61, 12, 10); fill(g, '#ecd3b3'); stroke(g, 0); eyes(g, 50, 50, 6); blush(g, 50, 50, 6); circ(g, 50, 58, 3.5); fill(g, OUT); smile(g, 50, 62, 3.5); };
  F.v_kid = g => { shadow(g); circ(g, 50, 42, 16); fill(g, vgrad(g, 26, 58, '#ffe2c0', '#f3c79a')); stroke(g, 3); g.beginPath(); g.arc(50, 38, 17, Math.PI, 0); g.closePath(); fill(g, '#6d4c2f'); stroke(g, 3); rr(g, 37, 54, 26, 28, 9); fill(g, vgrad(g, 54, 82, '#ff8a8a', '#e0392b')); stroke(g, 3); eyes(g, 50, 42, 4.2); blush(g, 50, 42, 4.2); smile(g, 50, 48, 3.5); };
  F.v_fox = g => { shadow(g); circ(g, 50, 54, 22); fill(g, vgrad(g, 32, 76, '#ff9966', '#f5703a')); stroke(g, 3); g.beginPath(); g.moveTo(34, 38); g.lineTo(28, 20); g.lineTo(47, 33); g.closePath(); fill(g, '#f5703a'); stroke(g, 3); g.beginPath(); g.moveTo(66, 38); g.lineTo(72, 20); g.lineTo(53, 33); g.closePath(); fill(g, '#f5703a'); stroke(g, 3); g.beginPath(); g.arc(50, 60, 14, 0.15, Math.PI - 0.15); g.closePath(); fill(g, '#fff'); stroke(g, 0); eyes(g, 50, 50, 6); blush(g, 50, 50, 6); circ(g, 50, 58, 3); fill(g, OUT); };

  /* ===================== 海洋环境 / 生物 ===================== */
  F.fish = g => { ell(g, 48, 50, 26, 18); fill(g, vgrad(g, 32, 68, '#ff9ff3', '#e26fd0')); stroke(g, 3); g.beginPath(); g.moveTo(72, 50); g.lineTo(92, 36); g.quadraticCurveTo(86, 50, 92, 64); g.closePath(); fill(g, '#f368e0'); stroke(g, 3); g.beginPath(); g.moveTo(46, 34); g.quadraticCurveTo(52, 26, 58, 36); stroke(g, 2.5, '#d152bf'); circ(g, 38, 47, 5.5); fill(g, '#fff'); stroke(g, 2); circ(g, 37, 47, 2.6); fill(g, '#241c16'); smile(g, 32, 54, 4); };
  F.fish2 = g => { ell(g, 48, 50, 24, 17); fill(g, vgrad(g, 33, 67, '#7ee0a8', '#3bb878')); stroke(g, 3); g.beginPath(); g.moveTo(70, 50); g.lineTo(90, 38); g.quadraticCurveTo(84, 50, 90, 62); g.closePath(); fill(g, '#2fa869'); stroke(g, 3); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(40 + i * 9, 38); g.lineTo(40 + i * 9, 62); stroke(g, 1.6, 'rgba(20,90,50,.4)'); } circ(g, 38, 47, 5.5); fill(g, '#fff'); stroke(g, 2); circ(g, 37, 47, 2.6); fill(g, '#241c16'); };
  F.fish3 = g => { ell(g, 48, 50, 22, 20); fill(g, vgrad(g, 30, 70, '#ffd56b', '#f0a93a')); stroke(g, 3); g.beginPath(); g.moveTo(68, 50); g.lineTo(88, 40); g.quadraticCurveTo(83, 50, 88, 60); g.closePath(); fill(g, '#e8902a'); stroke(g, 3); circ(g, 40, 47, 6); fill(g, '#fff'); stroke(g, 2); circ(g, 39, 47, 2.8); fill(g, '#241c16'); smile(g, 35, 55, 4); };
  F.jelly = g => { g.beginPath(); g.arc(50, 44, 22, Math.PI, 0); g.quadraticCurveTo(72, 54, 50, 54); g.quadraticCurveTo(28, 54, 28, 44); g.closePath(); fill(g, vgrad(g, 22, 54, 'rgba(200,150,255,.85)', 'rgba(150,100,230,.7)')); stroke(g, 2.5, 'rgba(120,80,200,.8)'); for (let i = 0; i < 5; i++) { const x = 34 + i * 8; g.beginPath(); g.moveTo(x, 52); g.quadraticCurveTo(x + 4, 66, x, 78); stroke(g, 2, 'rgba(180,140,240,.7)'); } circ(g, 44, 42, 3); fill(g, '#fff'); circ(g, 56, 42, 3); fill(g, '#fff'); };
  F.coral = g => { g.beginPath(); g.moveTo(50, 90); g.lineTo(50, 50); g.moveTo(50, 60); g.lineTo(34, 44); g.moveTo(50, 66); g.lineTo(66, 48); g.moveTo(50, 56); g.lineTo(40, 36); g.moveTo(50, 56); g.lineTo(62, 34); stroke(g, 7, '#ff7e9d'); stroke(g, 3.5, '#ff9db4'); circ(g, 50, 50, 4); fill(g, '#ffb3c6'); circ(g, 34, 44, 4); fill(g, '#ffb3c6'); circ(g, 66, 48, 4); fill(g, '#ffb3c6'); circ(g, 40, 36, 4); fill(g, '#ffb3c6'); circ(g, 62, 34, 4); fill(g, '#ffb3c6'); };
  F.coral2 = g => { for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(50 + i * 12, 90); g.quadraticCurveTo(50 + i * 18, 50, 50 + i * 10, 30); stroke(g, 9, '#ffa94d'); stroke(g, 4.5, '#ffc078'); } };
  F.seaweed = g => { for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(50 + k * 9, 92); g.quadraticCurveTo(40 + k * 9, 60, 52 + k * 9, 40); g.quadraticCurveTo(60 + k * 9, 24, 50 + k * 9, 12); stroke(g, 6, '#2fa869'); stroke(g, 3, '#46c486'); } };
  F.rock = g => { g.beginPath(); g.moveTo(20, 86); g.quadraticCurveTo(14, 60, 36, 54); g.quadraticCurveTo(50, 40, 68, 52); g.quadraticCurveTo(88, 58, 82, 86); g.closePath(); fill(g, vgrad(g, 40, 86, '#8a96a3', '#5e6a77')); stroke(g, 3); ell(g, 40, 60, 8, 4, -0.4); fill(g, 'rgba(255,255,255,.18)'); };
  F.starfish = g => { g.save(); g.translate(50, 54); for (let i = 0; i < 5; i++) { g.rotate(6.283 / 5); g.beginPath(); g.moveTo(0, 0); g.lineTo(-9, -14); g.quadraticCurveTo(0, -30, 9, -14); g.closePath(); fill(g, vgrad(g, -30, 0, '#ffb24d', '#f08a2a')); stroke(g, 2.6); } g.restore(); circ(g, 50, 54, 6); fill(g, '#ffd07a'); for (let i = 0; i < 6; i++) circ(g, 50 + Math.cos(i) * 3, 54 + Math.sin(i) * 3, 1.2), fill(g, '#e0782a'); };
  F.shell = g => { g.beginPath(); g.moveTo(50, 84); g.quadraticCurveTo(18, 70, 30, 36); g.quadraticCurveTo(50, 18, 70, 36); g.quadraticCurveTo(82, 70, 50, 84); g.closePath(); fill(g, vgrad(g, 18, 84, '#ffd9e6', '#ff9fc0')); stroke(g, 3); for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(50, 80); g.quadraticCurveTo(50 + i * 14, 50, 50 + i * 8, 30); stroke(g, 2, 'rgba(220,120,160,.6)'); } };
  F.bubble = g => { circ(g, 50, 50, 30); fill(g, 'rgba(255,255,255,.22)'); stroke(g, 2, 'rgba(255,255,255,.5)'); spec(g, 40, 40, 8); };
  // 捞网（海里捞垃圾）
  F.net = g => { g.beginPath(); g.arc(50, 42, 26, 0.5, Math.PI - 0.5, true); g.closePath(); fill(g, 'rgba(255,255,255,.25)'); stroke(g, 3, '#d6c08a'); circ(g, 50, 42, 26); g.save(); g.clip(); for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(24 + i * 7, 16); g.lineTo(24 + i * 7, 70); g.moveTo(24, 24 + i * 6); g.lineTo(76, 24 + i * 6); stroke(g, 0.8, 'rgba(120,100,60,.4)'); } g.restore(); rr(g, 47, 60, 6, 30, 3); fill(g, '#c08a4e'); stroke(g, 2.5); };
  // 夹子（地面夹垃圾）—— 张开的钳口
  F.tongs = g => { g.save(); g.translate(50, 50); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, 24); g.lineTo(s * 6, -6); g.quadraticCurveTo(s * 20, -22, s * 12, -34); g.quadraticCurveTo(s * 8, -26, s * 4, -16); g.lineTo(s * 2, 8); stroke(g, 5, '#c0392b'); } circ(g, 0, 22, 4); fill(g, '#7f8c8d'); stroke(g, 2); g.restore(); };
  // 扫把（地面扫垃圾）
  F.broom = g => { g.save(); g.translate(50, 50); g.rotate(0.3); rr(g, -3, -34, 6, 44, 3); fill(g, '#b07a42'); stroke(g, 2.5); g.beginPath(); g.moveTo(-14, 12); g.lineTo(14, 12); g.lineTo(20, 34); g.lineTo(-20, 34); g.closePath(); fill(g, '#f0c450'); stroke(g, 2.5); for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 5, 14); g.lineTo(i * 6, 33); stroke(g, 1.5, 'rgba(150,100,40,.6)'); } g.restore(); };

  /* ---------- 对外 ---------- */
  function draw(ctx, key, cx, cy, size, opts) {
    opts = opts || {};
    const im = imgs[key] || tryImg(key);
    ctx.save();
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
    if (opts.rot) { ctx.translate(cx, cy); ctx.rotate(opts.rot); ctx.translate(-cx, -cy); }
    if (im) { ctx.drawImage(im, cx - size / 2, cy - size / 2, size, size); ctx.restore(); return; }
    ctx.translate(cx - size / 2, cy - size / 2); ctx.scale(size / 100, size / 100);
    const fn = F[key];
    if (fn) fn(ctx); else { rr(ctx, 20, 20, 60, 60, 12); fill(ctx, '#dfe6e9'); stroke(ctx, 3); }
    ctx.restore();
  }
  return { draw, has: k => !!F[k] };
})();
