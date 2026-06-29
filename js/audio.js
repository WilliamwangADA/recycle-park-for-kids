/* ===========================================================================
   回收乐园 · 音频（WebAudio 程序音效 + edge-tts 预生成语音 MP3）
   voice 文件放在 audio/<key>.mp3，由 gen_voice.py 生成。
   =========================================================================== */
window.Audio2 = (function () {
  let ctx = null;
  let muted = false;
  const voiceCache = {};
  let lastVoice = null;

  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* 单个音符 */
  function tone(freq, dur, type, vol, when) {
    const c = ac(); if (!c || muted) return;
    const t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol == null ? 0.18 : vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  const SFX = {
    pop:    () => tone(660, 0.12, 'triangle', 0.2),
    collect:() => { tone(523, 0.08, 'sine', 0.18); tone(784, 0.12, 'sine', 0.16, 0.06); },
    good:   () => { [523, 659, 784].forEach((f, i) => tone(f, 0.15, 'triangle', 0.18, i * 0.08)); },
    bad:    () => { tone(220, 0.18, 'sawtooth', 0.12); tone(180, 0.2, 'sawtooth', 0.1, 0.08); },
    build:  () => { [392, 523, 659, 880].forEach((f, i) => tone(f, 0.16, 'square', 0.13, i * 0.07)); },
    place:  () => tone(440, 0.1, 'sine', 0.16),
    star:   () => { [659, 880, 1047].forEach((f, i) => tone(f, 0.18, 'sine', 0.15, i * 0.09)); },
    visitor:() => { [523, 587, 659, 784].forEach((f, i) => tone(f, 0.2, 'triangle', 0.16, i * 0.1)); },
    click:  () => tone(520, 0.06, 'square', 0.12),
    splash: () => { tone(300, 0.2, 'sine', 0.14); tone(200, 0.25, 'sine', 0.1, 0.05); },
  };
  function sfx(name) { (SFX[name] || SFX.pop)(); }

  /* 语音：播放 audio/<key>.mp3（同一时刻只放一句，避免重叠）*/
  function voice(key) {
    if (muted || !key) return;
    if (lastVoice) { try { lastVoice.pause(); } catch (e) {} }
    let a = voiceCache[key];
    if (!a) { a = new Audio('audio/' + key + '.mp3'); a.preload = 'auto'; voiceCache[key] = a; }
    try { a.currentTime = 0; const p = a.play(); if (p) p.catch(() => {}); lastVoice = a; } catch (e) {}
  }

  function setMuted(m) { muted = m; if (m && lastVoice) { try { lastVoice.pause(); } catch (e) {} } }
  function isMuted() { return muted; }
  function unlock() { ac(); }   // 首次用户交互时调用，解锁音频

  return { sfx, voice, setMuted, isMuted, unlock };
})();
