/* ===========================================================================
   回收乐园 · 程序化美术（可爱厚涂卡通风，参考潜水员戴夫的圆润配色）
   Sprites.draw(ctx, key, cx, cy, size, opts) —— 以 (cx,cy) 为中心、size 为边长绘制。
   每个 sprite 在 100×100 的单位坐标里绘制（中心约 50,50）。
   若 assets/sprites/<key>.png 存在，会优先用图片（preload 后），否则用程序绘制，
   这样以后可以无缝换成 AI 生成的贴图。
   =========================================================================== */
window.Sprites = (function () {
  const OUT = '#43342b';            // 统一描边色
  const imgs = {};                  // key -> HTMLImageElement (加载成功)
  const tried = {};

  /* 尝试懒加载 PNG（成功后下次用图片）。失败静默回退程序绘制。 */
  function tryImg(key) {
    if (tried[key]) return imgs[key] || null;
    tried[key] = true;
    const im = new Image();
    im.onload = () => { imgs[key] = im; };
    im.onerror = () => {};
    im.src = 'assets/sprites/' + key + '.png';
    return null;
  }

  /* ---------- 绘制原语 ---------- */
  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 7); g.closePath(); }
  function fill(g, c) { g.fillStyle = c; g.fill(); }
  function line(g, w, c) { g.lineWidth = w; g.strokeStyle = c || OUT; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  function shade(g, x, y, w, h, r, base, hi) {           // 圆角块 + 高光
    rr(g, x, y, w, h, r); fill(g, base); line(g, 3);
    rr(g, x + w * 0.12, y + h * 0.1, w * 0.3, h * 0.55, r * 0.6); fill(g, hi);
  }
  // 一对可爱大眼睛 + 腮红
  function face(g, x, y, s, opt) {
    opt = opt || {};
    circ(g, x - s, y, s * 0.9); fill(g, '#fff'); line(g, 2);
    circ(g, x + s, y, s * 0.9); fill(g, '#fff'); line(g, 2);
    circ(g, x - s + s * 0.2, y + s * 0.15, s * 0.45); fill(g, '#2b2b2b');
    circ(g, x + s + s * 0.2, y + s * 0.15, s * 0.45); fill(g, '#2b2b2b');
    circ(g, x - s + s * 0.05, y - s * 0.2, s * 0.18); fill(g, '#fff');
    circ(g, x + s + s * 0.05, y - s * 0.2, s * 0.18); fill(g, '#fff');
    if (opt.blush !== false) {
      circ(g, x - s * 2, y + s * 0.9, s * 0.45); fill(g, 'rgba(255,140,140,.55)');
      circ(g, x + s * 2, y + s * 0.9, s * 0.45); fill(g, 'rgba(255,140,140,.55)');
    }
    if (opt.smile) {
      g.beginPath(); g.arc(x, y + s * 1.2, s * 0.9, 0.15, Math.PI - 0.15); line(g, 2.5);
    }
  }

  /* ---------- 垃圾 ---------- */
  const F = {};
  F.t_bottle = g => { shade(g, 38, 22, 24, 64, 11, '#74c7ec', '#bfe9fb'); rr(g, 44, 10, 12, 16, 4); fill(g, '#3b8fd4'); line(g, 3); rr(g, 36, 44, 28, 16, 5); fill(g, 'rgba(255,255,255,.35)'); };
  F.t_bag = g => { g.beginPath(); g.moveTo(28, 34); g.quadraticCurveTo(20, 80, 40, 86); g.quadraticCurveTo(50, 90, 60, 86); g.quadraticCurveTo(80, 80, 72, 34); g.closePath(); fill(g, '#eaf6ff'); line(g, 3); rr(g, 40, 22, 8, 16, 3); fill(g, '#eaf6ff'); line(g, 3); rr(g, 52, 22, 8, 16, 3); fill(g, '#eaf6ff'); line(g, 3); };
  F.t_cup = g => { g.beginPath(); g.moveTo(34, 32); g.lineTo(40, 84); g.quadraticCurveTo(50, 90, 60, 84); g.lineTo(66, 32); g.closePath(); fill(g, '#fff'); line(g, 3); rr(g, 30, 26, 40, 9, 4); fill(g, '#ff6b6b'); line(g, 3); g.beginPath(); g.moveTo(50, 16); g.lineTo(50, 30); line(g, 3); };
  F.t_can = g => { shade(g, 36, 24, 28, 56, 8, '#ff7675', '#ffb3b3'); rr(g, 36, 38, 28, 14, 4); fill(g, '#f5f5f5'); line(g, 0); rr(g, 34, 20, 32, 8, 5); fill(g, '#b2bec3'); line(g, 3); };
  F.t_tin = g => { shade(g, 34, 28, 32, 50, 6, '#dfe6e9', '#fff'); rr(g, 40, 40, 20, 22, 3); fill(g, '#fab1a0'); line(g, 0); line(g, 3); };
  F.t_glass = g => { shade(g, 40, 24, 20, 60, 9, '#55efc4', '#c8fff0'); rr(g, 44, 12, 12, 14, 4); fill(g, '#00b894'); line(g, 3); rr(g, 38, 40, 24, 18, 5); fill(g, '#74b9ff'); line(g, 0); };
  F.t_news = g => { g.save(); g.translate(50, 50); g.rotate(-0.12); rr(g, -30, -22, 60, 44, 3); fill(g, '#f1ece1'); line(g, 3); for (let i = 0; i < 4; i++) { rr(g, -24, -14 + i * 9, 48, 4, 2); fill(g, '#b9b09c'); } g.restore(); };
  F.t_box = g => { g.beginPath(); g.moveTo(26, 38); g.lineTo(50, 26); g.lineTo(74, 38); g.lineTo(74, 74); g.lineTo(50, 86); g.lineTo(26, 74); g.closePath(); fill(g, '#d6a96a'); line(g, 3); g.beginPath(); g.moveTo(50, 26); g.lineTo(50, 86); line(g, 2); g.beginPath(); g.moveTo(26, 38); g.lineTo(50, 50); g.lineTo(74, 38); line(g, 2); };
  F.t_banana = g => { g.save(); g.translate(50, 52); g.rotate(0.3); g.beginPath(); g.moveTo(-28, -6); g.quadraticCurveTo(-30, 26, 6, 30); g.quadraticCurveTo(34, 30, 30, 6); g.quadraticCurveTo(20, 18, -6, 16); g.quadraticCurveTo(-22, 14, -28, -6); g.closePath(); fill(g, '#ffe08a'); line(g, 3); g.beginPath(); g.moveTo(-28, -6); g.quadraticCurveTo(-18, -20, -10, -18); line(g, 3); g.restore(); };
  F.t_apple = g => { circ(g, 50, 56, 22); fill(g, '#f8efe0'); line(g, 3); g.beginPath(); g.arc(50, 56, 22, -2.4, -0.7); g.lineTo(50, 56); fill(g, '#ff7675'); g.beginPath(); g.moveTo(50, 34); g.lineTo(50, 24); line(g, 3); circ(g, 56, 26, 4); fill(g, '#27ae60'); };
  F.t_fishbone = g => { g.beginPath(); g.moveTo(26, 50); g.lineTo(70, 50); line(g, 3); for (let i = 0; i < 5; i++) { const x = 32 + i * 8; g.beginPath(); g.moveTo(x, 50); g.lineTo(x - 5, 40); g.moveTo(x, 50); g.lineTo(x - 5, 60); line(g, 2.5); } circ(g, 74, 50, 7); fill(g, '#dfe6e9'); line(g, 3); circ(g, 76, 48, 2); fill(g, OUT); };
  F.t_battery = g => { shade(g, 38, 24, 24, 56, 5, '#ffd166', '#ffe6a8'); rr(g, 44, 18, 12, 8, 2); fill(g, '#b2bec3'); line(g, 3); g.font = 'bold 22px sans-serif'; g.fillStyle = OUT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+', 50, 44); g.fillText('-', 50, 64); };
  F.t_bulb = g => { circ(g, 50, 44, 22); fill(g, '#ffeaa7'); line(g, 3); rr(g, 42, 60, 16, 14, 3); fill(g, '#b2bec3'); line(g, 3); g.beginPath(); g.moveTo(44, 64); g.lineTo(56, 64); g.moveTo(44, 69); g.lineTo(56, 69); line(g, 2); g.beginPath(); g.moveTo(46, 44); g.lineTo(50, 50); g.lineTo(54, 44); line(g, 2.5); };
  F.t_foam = g => { rr(g, 30, 34, 40, 34, 6); fill(g, '#f5f6fa'); line(g, 3); for (let i = 0; i < 6; i++) circ(g, 38 + (i % 3) * 12, 44 + Math.floor(i / 3) * 14, 3), fill(g, '#dcdde1'); };

  /* ---------- 材料 ---------- */
  F.m_plastic = g => { for (let i = 0; i < 3; i++) circ(g, 38 + i * 12, 56 - i * 4, 13), fill(g, '#ff9f43'), line(g, 3), circ(g, 35 + i * 12, 52 - i * 4, 4), fill(g, '#ffd9a8'); };
  F.m_metal = g => { g.beginPath(); g.moveTo(30, 64); g.lineTo(38, 44); g.lineTo(70, 44); g.lineTo(70, 64); g.closePath(); fill(g, '#a4b0be'); line(g, 3); g.beginPath(); g.moveTo(38, 44); g.lineTo(46, 36); g.lineTo(78, 36); g.lineTo(70, 44); fill(g, '#ced6e0'); line(g, 3); };
  F.m_glass = g => { for (let i = 0; i < 7; i++) { circ(g, 36 + (i % 4) * 9, 50 + Math.floor(i / 4) * 9, 5); fill(g, ['#48dbfb','#7bed9f','#a8e6ff'][i % 3]); line(g, 2); } };
  F.m_paper = g => { rr(g, 34, 38, 32, 30, 5); fill(g, '#d6a96a'); line(g, 3); rr(g, 40, 30, 32, 30, 5); fill(g, '#e8c89a'); line(g, 3); };
  F.m_compost = g => { g.beginPath(); g.arc(50, 60, 22, Math.PI, 0); g.closePath(); fill(g, '#8d6e3a'); line(g, 3); circ(g, 42, 54, 4); fill(g, '#5e4322'); circ(g, 56, 56, 5); fill(g, '#5e4322'); g.beginPath(); g.moveTo(50, 50); g.quadraticCurveTo(54, 36, 64, 36); line(g, 3); circ(g, 64, 34, 5); fill(g, '#27ae60'); };

  /* ---------- 可造物品 ---------- */
  F.i_stool = g => { rr(g, 32, 44, 36, 12, 5); fill(g, '#ff9f43'); line(g, 3); rr(g, 36, 56, 7, 22, 3); fill(g, '#e08e2e'); line(g, 3); rr(g, 57, 56, 7, 22, 3); fill(g, '#e08e2e'); line(g, 3); };
  F.i_table = g => { rr(g, 26, 40, 48, 12, 5); fill(g, '#ffbe76'); line(g, 3); rr(g, 30, 52, 7, 28, 3); fill(g, '#a4b0be'); line(g, 3); rr(g, 63, 52, 7, 28, 3); fill(g, '#a4b0be'); line(g, 3); };
  F.i_cupware = g => { g.beginPath(); g.moveTo(36, 40); g.lineTo(40, 76); g.quadraticCurveTo(50, 82, 60, 76); g.lineTo(64, 40); g.closePath(); fill(g, '#48dbfb'); line(g, 3); g.beginPath(); g.arc(66, 56, 10, -1.2, 1.2); line(g, 3); };
  F.i_planter = g => { g.beginPath(); g.moveTo(34, 54); g.lineTo(40, 80); g.lineTo(60, 80); g.lineTo(66, 54); g.closePath(); fill(g, '#48dbfb'); line(g, 3); circ(g, 44, 44, 8); fill(g, '#27ae60'); circ(g, 56, 42, 9); fill(g, '#2ecc71'); circ(g, 50, 36, 7); fill(g, '#27ae60'); };
  F.i_flowers = g => { for (let i = 0; i < 3; i++) { const x = 38 + i * 12, y = 50 + (i % 2) * 8; g.beginPath(); g.moveTo(x, 80); g.lineTo(x, y); line(g, 3); for (let k = 0; k < 5; k++) { const a = k * 1.25; circ(g, x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5); fill(g, ['#ff6b9d','#feca57','#ff9ff3'][i]); } circ(g, x, y, 4); fill(g, '#fff3a0'); } };
  F.i_tree = g => { rr(g, 46, 56, 8, 26, 3); fill(g, '#a07a4a'); line(g, 3); circ(g, 50, 42, 20); fill(g, '#2ecc71'); line(g, 3); circ(g, 38, 48, 13); fill(g, '#27ae60'); line(g, 3); circ(g, 62, 48, 13); fill(g, '#27ae60'); line(g, 3); };
  F.i_bench = g => { rr(g, 26, 50, 48, 9, 3); fill(g, '#ff9f43'); line(g, 3); rr(g, 26, 38, 48, 8, 3); fill(g, '#ffbe76'); line(g, 3); rr(g, 30, 58, 6, 20, 2); fill(g, '#d6a96a'); line(g, 3); rr(g, 64, 58, 6, 20, 2); fill(g, '#d6a96a'); line(g, 3); };
  F.i_campchair = g => { g.beginPath(); g.moveTo(34, 40); g.lineTo(40, 70); g.lineTo(60, 70); g.lineTo(66, 40); fill(g, '#ee5253'); line(g, 3); g.beginPath(); g.moveTo(34, 40); g.lineTo(36, 80); g.moveTo(66, 40); g.lineTo(64, 80); g.moveTo(40, 70); g.lineTo(34, 80); g.moveTo(60, 70); g.lineTo(66, 80); line(g, 3); };
  F.i_pinwheel = g => { rr(g, 48, 50, 5, 32, 2); fill(g, '#a07a4a'); line(g, 3); const cols = ['#ff6b6b','#feca57','#54a0ff','#1dd1a1']; for (let i = 0; i < 4; i++) { g.save(); g.translate(50, 46); g.rotate(i * Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(18, -6); g.lineTo(14, 6); g.closePath(); fill(g, cols[i]); line(g, 2.5); g.restore(); } circ(g, 50, 46, 4); fill(g, '#fff'); line(g, 2); };
  F.i_lamp = g => { rr(g, 47, 40, 6, 42, 2); fill(g, '#a4b0be'); line(g, 3); rr(g, 36, 78, 28, 6, 3); fill(g, '#7f8c8d'); line(g, 3); g.beginPath(); g.moveTo(40, 40); g.quadraticCurveTo(50, 26, 60, 40); g.closePath(); fill(g, '#feca57'); line(g, 3); circ(g, 50, 38, 5); fill(g, '#fff3a0'); };
  F.i_seesaw = g => { g.save(); g.translate(50, 56); g.rotate(-0.16); rr(g, -30, -4, 60, 9, 4); fill(g, '#54a0ff'); line(g, 3); circ(g, -28, 0, 6); fill(g, '#ff6b6b'); line(g, 2); circ(g, 28, 0, 6); fill(g, '#feca57'); line(g, 2); g.restore(); g.beginPath(); g.moveTo(42, 78); g.lineTo(50, 56); g.lineTo(58, 78); fill(g, '#a4b0be'); line(g, 3); };
  F.i_swing = g => { g.beginPath(); g.moveTo(30, 78); g.lineTo(40, 30); g.lineTo(60, 30); g.lineTo(70, 78); line(g, 3); rr(g, 38, 28, 24, 5, 2); fill(g, '#a07a4a'); line(g, 3); g.beginPath(); g.moveTo(44, 33); g.lineTo(44, 62); g.moveTo(56, 33); g.lineTo(56, 62); line(g, 2.5); rr(g, 41, 62, 18, 6, 2); fill(g, '#ff6b6b'); line(g, 3); };
  F.i_slide = g => { g.beginPath(); g.moveTo(30, 80); g.lineTo(30, 40); g.lineTo(44, 40); line(g, 4); g.beginPath(); g.moveTo(44, 40); g.quadraticCurveTo(54, 44, 56, 64); g.quadraticCurveTo(58, 78, 74, 80); g.lineTo(74, 72); g.quadraticCurveTo(64, 70, 64, 60); g.quadraticCurveTo(64, 42, 48, 34); g.lineTo(30, 34); g.lineTo(30, 40); g.closePath(); fill(g, '#feca57'); line(g, 3.5); rr(g, 26, 34, 22, 5, 2); fill(g, '#ee5253'); line(g, 3); };
  F.i_bike = g => { circ(g, 36, 64, 13); line(g, 3.5); circ(g, 66, 64, 13); line(g, 3.5); g.beginPath(); g.moveTo(36, 64); g.lineTo(50, 64); g.lineTo(58, 44); g.lineTo(66, 64); g.moveTo(50, 64); g.lineTo(44, 44); g.lineTo(58, 44); line(g, 3.5); g.strokeStyle = '#ee5253'; g.beginPath(); g.moveTo(40, 44); g.lineTo(48, 44); line(g, 4); rr(g, 56, 38, 12, 5, 2); fill(g, '#43342b'); };
  F.i_tent = g => { g.beginPath(); g.moveTo(50, 26); g.lineTo(26, 80); g.lineTo(74, 80); g.closePath(); fill(g, '#ff6b6b'); line(g, 3.5); g.beginPath(); g.moveTo(50, 26); g.lineTo(50, 80); line(g, 3); g.beginPath(); g.moveTo(50, 80); g.lineTo(42, 56); g.lineTo(58, 56); g.closePath(); fill(g, '#ffd9a8'); line(g, 3); g.beginPath(); g.moveTo(50, 22); g.lineTo(50, 26); line(g, 3); circ(g, 50, 20, 3); fill(g, '#feca57'); };

  /* ---------- 访客（小动物 / 小朋友）---------- */
  F.v_cat = g => { circ(g, 50, 54, 24); fill(g, '#ffb86b'); line(g, 3); g.beginPath(); g.moveTo(34, 40); g.lineTo(30, 24); g.lineTo(46, 34); fill(g, '#ffb86b'); line(g, 3); g.beginPath(); g.moveTo(66, 40); g.lineTo(70, 24); g.lineTo(54, 34); fill(g, '#ffb86b'); line(g, 3); face(g, 50, 52, 6, { smile: true }); g.beginPath(); g.moveTo(50, 60); g.lineTo(50, 64); line(g, 2); };
  F.v_bunny = g => { circ(g, 50, 58, 22); fill(g, '#fff'); line(g, 3); rr(g, 38, 18, 9, 30, 5); fill(g, '#fff'); line(g, 3); rr(g, 53, 18, 9, 30, 5); fill(g, '#fff'); line(g, 3); rr(g, 41, 24, 4, 18, 2); fill(g, '#ffb3c6'); rr(g, 56, 24, 4, 18, 2); fill(g, '#ffb3c6'); face(g, 50, 56, 6, { smile: true }); };
  F.v_bird = g => { circ(g, 50, 56, 20); fill(g, '#54a0ff'); line(g, 3); circ(g, 50, 40, 14); fill(g, '#54a0ff'); line(g, 3); g.beginPath(); g.moveTo(64, 40); g.lineTo(76, 44); g.lineTo(64, 48); closePathFill(g, '#feca57'); face(g, 50, 38, 4, { blush: false }); g.beginPath(); g.moveTo(34, 56); g.quadraticCurveTo(24, 52, 30, 66); fill(g, '#3b82f6'); line(g, 2); };
  F.v_bear = g => { circ(g, 50, 56, 24); fill(g, '#b9855c'); line(g, 3); circ(g, 34, 36, 10); fill(g, '#b9855c'); line(g, 3); circ(g, 66, 36, 10); fill(g, '#b9855c'); line(g, 3); circ(g, 50, 60, 11); fill(g, '#e6c9a8'); line(g, 0); face(g, 50, 52, 6, { smile: true }); circ(g, 50, 58, 3); fill(g, OUT); };
  F.v_kid = g => { circ(g, 50, 40, 16); fill(g, '#ffe0bd'); line(g, 3); g.beginPath(); g.arc(50, 36, 17, Math.PI, 0); fill(g, '#6d4c2f'); line(g, 3); rr(g, 38, 52, 24, 26, 8); fill(g, '#ff6b6b'); line(g, 3); face(g, 50, 40, 4, { smile: true }); };
  F.v_fox = g => { circ(g, 50, 54, 22); fill(g, '#ff7f50'); line(g, 3); g.beginPath(); g.moveTo(34, 38); g.lineTo(28, 20); g.lineTo(46, 32); fill(g, '#ff7f50'); line(g, 3); g.beginPath(); g.moveTo(66, 38); g.lineTo(72, 20); g.lineTo(54, 32); fill(g, '#ff7f50'); line(g, 3); g.beginPath(); g.arc(50, 60, 14, 0.2, Math.PI - 0.2); fill(g, '#fff'); line(g, 0); face(g, 50, 50, 6, { smile: true }); g.beginPath(); g.moveTo(50, 58); g.lineTo(50, 62); line(g, 2); };

  /* ---------- 主角潜水员 & 海洋装饰 ---------- */
  F.diver = g => { rr(g, 34, 40, 32, 38, 14); fill(g, '#1dd1a1'); line(g, 3); circ(g, 50, 36, 18); fill(g, '#ffe0bd'); line(g, 3); circ(g, 50, 34, 16); fill(g, 'rgba(140,220,255,.35)'); line(g, 2); circ(g, 44, 34, 6); fill(g, '#fff'); line(g, 2); circ(g, 56, 34, 6); fill(g, '#fff'); line(g, 2); circ(g, 45, 35, 2.5); fill(g, '#2b2b2b'); circ(g, 57, 35, 2.5); fill(g, '#2b2b2b'); rr(g, 38, 50, 6, 22, 3); fill(g, '#10ac84'); rr(g, 56, 50, 6, 22, 3); fill(g, '#10ac84'); rr(g, 60, 22, 10, 16, 4); fill(g, '#feca57'); line(g, 2); };
  F.bubble = g => { circ(g, 50, 50, 30); fill(g, 'rgba(255,255,255,.35)'); line(g, 2); circ(g, 40, 40, 9); fill(g, 'rgba(255,255,255,.6)'); };
  F.fish = g => { g.beginPath(); g.ellipse(50, 50, 26, 18, 0, 0, 7); fill(g, '#ff9ff3'); line(g, 3); g.beginPath(); g.moveTo(74, 50); g.lineTo(90, 38); g.lineTo(90, 62); closePathFill(g, '#f368e0'); circ(g, 40, 46, 5); fill(g, '#fff'); line(g, 2); circ(g, 39, 46, 2.5); fill(g, '#2b2b2b'); };

  function closePathFill(g, c) { g.closePath(); fill(g, c); line(g, 3); }

  /* ---------- 对外接口 ---------- */
  function draw(ctx, key, cx, cy, size, opts) {
    opts = opts || {};
    const im = imgs[key] || tryImg(key);
    ctx.save();
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
    if (im) {
      ctx.drawImage(im, cx - size / 2, cy - size / 2, size, size);
      ctx.restore(); return;
    }
    ctx.translate(cx - size / 2, cy - size / 2);
    ctx.scale(size / 100, size / 100);
    const fn = F[key];
    if (fn) fn(ctx);
    else { rr(ctx, 20, 20, 60, 60, 12); fill(ctx, '#dfe6e9'); line(ctx, 3); }
    ctx.restore();
  }

  return { draw, has: k => !!F[k] };
})();
