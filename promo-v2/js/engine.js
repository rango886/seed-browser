// ── 引擎：WebAudio 精确调度 + rAF 渲染 + 字幕 ──
// 时间唯一的权威是 AudioContext.currentTime，渲染只是它的函数。
// 所以掉帧、120Hz/60Hz、暂停恢复，都不会让音画分离。

let AC = null, MASTER, VBUS, SBUS, BBUS, bufs = {}, origin = 0, started = false;
let live = [];           // 当前已调度的节点
const T = () => AC.currentTime - origin;

function b64buf(b64) {
  const bin = atob(b64), n = bin.length, u8 = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
  return u8.buffer;
}

async function initAudio() {
  AC = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'playback' });
  // resume() 在没有用户手势时会一直 pending，不能死等
  await Promise.race([AC.resume().catch(() => { }), new Promise(r => setTimeout(r, 400))]);
  MASTER = AC.createGain(); MASTER.gain.value = 0.9;
  const comp = AC.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 22; comp.ratio.value = 6;
  comp.attack.value = 0.004; comp.release.value = 0.22;
  MASTER.connect(comp); comp.connect(AC.destination);
  VBUS = AC.createGain(); VBUS.gain.value = 1.0; VBUS.connect(MASTER);
  SBUS = AC.createGain(); SBUS.gain.value = 0.42; SBUS.connect(MASTER);
  BBUS = AC.createGain(); BBUS.gain.value = 0.30; BBUS.connect(MASTER);

  const ids = TL.filter(b => b.audio).map(b => b.audio.id);
  await Promise.all(ids.map(async id => {
    try { bufs[id] = await AC.decodeAudioData(b64buf(AUDIO[id])); }
    catch (e) { console.warn('decode fail', id, e); }
  }));
  makeBGMLoops();
}

// ── 音效合成（无素材，全程序化） ──
const N = (dur) => {
  const b = AC.createBuffer(1, Math.ceil(AC.sampleRate * dur), AC.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
};
function env(g, at, a, d, peak) {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + a);
  g.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
}
const SFX = {
  key(at, o = {}) {  // 键盘敲击
    const s = AC.createBufferSource(), b = N(.045), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = b; f.type = 'bandpass'; f.frequency.value = 2100 + Math.random() * 1400; f.Q.value = 1.6;
    env(g, at, .001, .035, .5 * (o.g ?? 1));
    s.connect(f); f.connect(g); g.connect(SBUS); s.start(at);
    const o2 = AC.createOscillator(), g2 = AC.createGain();
    o2.type = 'square'; o2.frequency.setValueAtTime(180 + Math.random() * 90, at);
    env(g2, at, .001, .02, .06); o2.connect(g2); g2.connect(SBUS); o2.start(at); o2.stop(at + .05);
  },
  enter(at, o = {}) {
    const s = AC.createBufferSource(), b = N(.12), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = b; f.type = 'lowpass'; f.frequency.value = 900;
    env(g, at, .002, .1, .5 * (o.g ?? 1));
    s.connect(f); f.connect(g); g.connect(SBUS); s.start(at);
    const o2 = AC.createOscillator(), g2 = AC.createGain();
    o2.frequency.setValueAtTime(220, at); o2.frequency.exponentialRampToValueAtTime(70, at + .14);
    env(g2, at, .002, .13, .22); o2.connect(g2); g2.connect(SBUS); o2.start(at); o2.stop(at + .18);
  },
  blip(at, o = {}) {
    const s = AC.createOscillator(), g = AC.createGain();
    s.type = o.type || 'triangle'; s.frequency.value = o.f || 1320;
    env(g, at, .002, o.d ?? .07, o.g ?? .16);
    s.connect(g); g.connect(SBUS); s.start(at); s.stop(at + .2);
  },
  ding(at, o = {}) {  // 绿勾
    const f = o.f || 880;
    [1, 1.5, 2.25].forEach((m, i) => {
      const s = AC.createOscillator(), g = AC.createGain();
      s.type = 'sine'; s.frequency.value = f * m;
      env(g, at + i * .006, .004, .28 - i * .07, (o.g ?? .16) / (1 + i * 1.3));
      s.connect(g); g.connect(SBUS); s.start(at); s.stop(at + .45);
    });
  },
  buzz(at, o = {}) {  // 错误
    const s = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter();
    s.type = 'sawtooth'; s.frequency.value = o.f || 92;
    f.type = 'lowpass'; f.frequency.value = 700;
    env(g, at, .006, o.d ?? .22, .19);
    s.connect(f); f.connect(g); g.connect(SBUS); s.start(at); s.stop(at + .35);
  },
  whoosh(at, o = {}) {  // 转场
    const s = AC.createBufferSource(), b = N(.9), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = b; f.type = 'bandpass'; f.Q.value = 2.4;
    f.frequency.setValueAtTime(o.f0 || 320, at);
    f.frequency.exponentialRampToValueAtTime(o.f1 || 4200, at + (o.d ?? .55));
    env(g, at, .05, (o.d ?? .55), o.g ?? .2);
    s.connect(f); f.connect(g); g.connect(SBUS); s.start(at); s.stop(at + 1);
  },
  impact(at, o = {}) {
    const s = AC.createOscillator(), g = AC.createGain();
    s.type = 'sine'; s.frequency.setValueAtTime(o.f || 120, at);
    s.frequency.exponentialRampToValueAtTime(34, at + .5);
    env(g, at, .003, o.d ?? .7, o.g ?? .6);
    s.connect(g); g.connect(SBUS); s.start(at); s.stop(at + 1);
    const s2 = AC.createBufferSource(), b = N(.5), g2 = AC.createGain();
    s2.buffer = b; env(g2, at, .002, .35, .18); s2.connect(g2); g2.connect(SBUS); s2.start(at);
  },
  tick(at, o = {}) { SFX.blip(at, { f: o.f || 2400, d: .03, g: .07, type: 'sine' }); },
  rise(at, o = {}) {
    const s = AC.createOscillator(), g = AC.createGain();
    s.type = 'triangle'; s.frequency.setValueAtTime(o.f0 || 220, at);
    s.frequency.exponentialRampToValueAtTime(o.f1 || 1760, at + (o.d ?? .8));
    env(g, at, .04, (o.d ?? .8), o.g ?? .12);
    s.connect(g); g.connect(SBUS); s.start(at); s.stop(at + 1.2);
  },
  glitch(at, o = {}) {
    for (let i = 0; i < 6; i++) {
      const t = at + i * .035;
      const s = AC.createOscillator(), g = AC.createGain();
      s.type = 'square'; s.frequency.value = 300 + Math.random() * 2200;
      env(g, t, .001, .025, .06); s.connect(g); g.connect(SBUS); s.start(t); s.stop(t + .05);
    }
  },
  bloop(at, o = {}) {
    const s = AC.createOscillator(), g = AC.createGain();
    s.type = 'sine'; s.frequency.setValueAtTime(o.f || 400, at);
    s.frequency.exponentialRampToValueAtTime((o.f || 400) * 2.6, at + .1);
    env(g, at, .004, .16, o.g ?? .13); s.connect(g); g.connect(SBUS); s.start(at); s.stop(at + .3);
  },
};

// ── BGM：四条分层 loop，按段落淡入淡出 ──
const BGM = { pad: null, arp: null, bass: null, drum: null, nodes: [] };
const BPM = 100, BEAT = 60 / BPM, LOOP = BEAT * 32;   // 8 小节

function makeBGMLoops() {
  const sr = 48000, len = Math.ceil(sr * LOOP);
  const build = async (fn) => {
    const oc = new OfflineAudioContext(2, len, sr);
    fn(oc);
    return await oc.startRendering();
  };
  // 和弦：Am - F - C - G，每 2 小节
  const CH = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]];
  const chordAt = (b) => CH[Math.floor(b / 8) % 4];

  build(oc => {
    const g = oc.createGain(); g.gain.value = .085; g.connect(oc.destination);
    for (let b = 0; b < 32; b += 8) {
      const ch = chordAt(b);
      ch.forEach((f, i) => {
        const o = oc.createOscillator(), gg = oc.createGain();
        o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = f * (i === 0 ? .5 : 1);
        o.detune.value = (i - 1) * 6;
        const t0 = b * BEAT;
        gg.gain.setValueAtTime(.0001, t0);
        gg.gain.linearRampToValueAtTime(.5, t0 + 1.6);
        gg.gain.linearRampToValueAtTime(.0001, t0 + 8 * BEAT);
        o.connect(gg); gg.connect(g); o.start(t0); o.stop(t0 + 8 * BEAT + .1);
      });
    }
  }).then(b => BGM.pad = b);

  build(oc => {
    const g = oc.createGain(); g.gain.value = .055; g.connect(oc.destination);
    const f = oc.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600; f.connect(g);
    for (let i = 0; i < 32 * 4; i++) {
      const b = Math.floor(i / 4), step = i % 4;
      if (step === 0 && b % 2 === 1) continue;
      const ch = chordAt(b);
      const f0 = ch[[0, 1, 2, 1][step]] * 2;
      const t0 = i * BEAT / 4 + (step === 1 ? .012 : 0);
      const o = oc.createOscillator(), gg = oc.createGain();
      o.type = 'square'; o.frequency.value = f0;
      gg.gain.setValueAtTime(.0001, t0);
      gg.gain.exponentialRampToValueAtTime(.32, t0 + .008);
      gg.gain.exponentialRampToValueAtTime(.0001, t0 + .17);
      o.connect(gg); gg.connect(f); o.start(t0); o.stop(t0 + .25);
    }
  }).then(b => BGM.arp = b);

  build(oc => {
    const g = oc.createGain(); g.gain.value = .16; g.connect(oc.destination);
    for (let i = 0; i < 32 * 2; i++) {
      const t0 = i * BEAT / 2;
      const root = chordAt(Math.floor(i / 4))[0] / 4;
      const o = oc.createOscillator(), gg = oc.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(root * 2, t0);
      o.frequency.exponentialRampToValueAtTime(root, t0 + .11);
      gg.gain.setValueAtTime(.0001, t0);
      gg.gain.exponentialRampToValueAtTime(.6, t0 + .01);
      gg.gain.exponentialRampToValueAtTime(.0001, t0 + .3);
      o.connect(gg); gg.connect(g); o.start(t0); o.stop(t0 + .4);
    }
  }).then(b => BGM.bass = b);

  build(oc => {
    const g = oc.createGain(); g.gain.value = .12; g.connect(oc.destination);
    const noise = (dur) => { const b = oc.createBuffer(1, Math.ceil(oc.sampleRate * dur), oc.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
    const nb = noise(1);
    for (let b = 0; b < 32; b++) {
      // kick
      [0, 2].forEach(k => {
        const t0 = (b * 4 + k) * BEAT / 4 + (k ? .5 : 0);
        const o = oc.createOscillator(), gg = oc.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(150, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + .12);
        gg.gain.setValueAtTime(.9, t0); gg.gain.exponentialRampToValueAtTime(.0001, t0 + .28);
        o.connect(gg); gg.connect(g); o.start(t0); o.stop(t0 + .35);
      });
      // hat：8 分
      for (let k = 0; k < 8; k++) {
        const t0 = (b * 8 + k) * BEAT / 8;
        const s = oc.createBufferSource(), gg = oc.createGain(), f = oc.createBiquadFilter();
        s.buffer = nb; f.type = 'highpass'; f.frequency.value = 7200;
        gg.gain.setValueAtTime(k % 2 ? .06 : .12, t0);
        gg.gain.exponentialRampToValueAtTime(.0001, t0 + .05);
        s.connect(f); f.connect(gg); gg.connect(g); s.start(t0); s.stop(t0 + .08);
      }
      // snare
      [2].forEach(k => {
        const t0 = (b * 4 + k) * BEAT / 4;
        const s = oc.createBufferSource(), gg = oc.createGain(), f = oc.createBiquadFilter();
        s.buffer = nb; f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = .8;
        gg.gain.setValueAtTime(.28, t0); gg.gain.exponentialRampToValueAtTime(.0001, t0 + .16);
        s.connect(f); f.connect(gg); gg.connect(g); s.start(t0); s.stop(t0 + .2);
      });
    }
  }).then(b => BGM.drum = b);
}

// BGM 段落：哪个时间哪些层多大
const BGM_CUES = [
  // [t, pad,  arp,  bass, drum]
  [0, .9, 0, 0, 0],
  [19, 1.0, 0, 0, 0],
  [45, 1.0, .5, 0, 0],
  [63, .9, .8, .35, 0],
  [106, .85, .9, .7, .5],
  [160, .8, 1.0, .85, .8],
  [211, .85, .95, .9, .85],
  [276, .9, .7, .6, .4],
  [288, .6, .2, .2, 0],
];

function schedBGM(from) {
  const layers = ['pad', 'arp', 'bass', 'drum'];
  layers.forEach((name, li) => {
    const buf = BGM[name]; if (!buf) return;
    const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
    const g = AC.createGain(); g.gain.value = 0.0001;
    src.connect(g); g.connect(BBUS);
    const at = Math.max(origin + (from || 0), AC.currentTime + .02);
    src.start(at, ((from || 0) % LOOP));
    live.push(src);
    // 用 cue 表逐步改变该层音量
    const gainOf = (t) => {
      let v = BGM_CUES[0][1 + li];
      for (const c of BGM_CUES) if (c[0] <= t) v = c[1 + li];
      return v * v * v;
    };
    let prev = null;
    for (const c of BGM_CUES) {
      if (c[0] < (from || 0) - 1) continue;
      const v = Math.max(0.0001, gainOf(c[0]));
      const tt = origin + c[0];
      if (tt > AC.currentTime) g.gain.setTargetAtTime(v, tt, .35);
      prev = v;
    }
    if (prev == null) g.gain.value = Math.max(.0001, gainOf(from || 0));
  });
}

// ── 全部音轨调度 ──
let lastT = 0;
function scheduleAll(from) {
  live.forEach(n => { try { n.stop(0); } catch { } });
  live = [];
  const now = AC.currentTime;
  const at = origin + from;
  // 旁白
  for (const b of TL) {
    if (!b.audio) continue;
    const st = origin + b.audio.at;
    if (st < now - .05) continue;
    const src = AC.createBufferSource(), buf = bufs[b.audio.id];
    if (!buf) continue;
    src.buffer = buf;
    const g = AC.createGain(); g.gain.value = 1;
    src.connect(g); g.connect(VBUS);
    src.start(st); live.push(src);
  }
  // 音效
  for (const b of TL) {
    const sc = SCENES[b.v];
    if (!sc?.sfx) continue;
    for (const [dt, kind, o] of sc.sfx) {
      const st = origin + b.t0 + dt;
      if (st < now - .05) continue;
      if (SFX[kind]) { try { SFX[kind](st, o || {}); } catch { } }
    }
  }
  schedBGM(from);
}

function playFrom(t) {
  origin = AC.currentTime + 0.06 - t;
  scheduleAll(t);
  lastT = t;
  if (AC.state === 'suspended') AC.resume();
}

// ── 渲染 ──
let cv, c, MAIN, OFF, cur = 0, dpr = 1;
let hover = { x: -999, y: -999 }, mouseIn = false;

function beatIndexAt(t) {
  for (let i = 0; i < TL.length; i++) if (t < TL[i].t1) return i;
  return TL.length - 1;
}

function drawSubs(t) {
  const b = TL[cur];
  if (!b?.subs?.length) return;
  for (const s of b.subs) {
    if (t < s.t0 - .05 || t > s.t1 + .14) continue;
    const a = Math.min(ss(s.t0, s.t0 + .15, t), 1 - ss(s.t1 - .1, s.t1 + .07, t));
    if (a <= .01) continue;
    c.save();
    c.globalAlpha = a;
    c.font = FC(46, 700);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(s.text).width;
    const x0 = W / 2 - w / 2 - 52, y0 = 942;
    // 底槽：硬边 + 左右渐隐，保证任何画面上都读得清
    c.fillStyle = 'rgba(2,5,9,.88)';
    c.fillRect(x0, y0, w + 104, 66);
    c.fillStyle = rgba(C.green, .5);
    c.fillRect(x0, y0, 3, 66);
    c.fillRect(x0 + w + 101, y0, 3, 66);
    c.globalAlpha = a * .6;
    c.fillStyle = rgba(C.green, .5);
    c.fillRect(x0, y0, w + 104, 1.5);
    c.fillRect(x0, y0 + 64.5, w + 104, 1.5);
    c.globalAlpha = a;
    c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 6;
    c.fillStyle = C.white;
    c.fillText(s.text, W / 2, 976);
    c.restore();
  }
}

// 渲染分辨率倍率：canvas 内部的绘制像素，CSS 再拉到全屏。
// canvas2d 每帧提交成本跟像素量正相关，降一档能换不少帧数。
const RS = 1;
const debugMode = /[?&]debug/.test(location.search);
const SKIP = { scene: false, post: false, hud: false, subs: false };
window.SKIP = SKIP;
window.__diag = function (t = 125, n = 8) {
  const run = () => { renderAt(t); c.getImageData(0, 0, 1, 1); };
  const meas = () => { const t0 = performance.now(); for (let i = 0; i < n; i++) run(); return +((performance.now() - t0) / n).toFixed(2); };
  const out = {};
  SKIP.scene = SKIP.post = SKIP.hud = SKIP.subs = false; meas();
  out.all = meas();
  SKIP.post = true; out.noPost = meas(); SKIP.post = false;
  SKIP.scene = true; out.noScene = meas(); SKIP.scene = false;
  SKIP.post = SKIP.scene = true; out.neither = meas();
  SKIP.scene = SKIP.post = false;
  return out;
};
let holdT = (() => { const m = location.search.match(/[?&]t=([\d.]+)/); return m ? parseFloat(m[1]) : null; })();
// 调试入口：定格到某一刻并立即重绘（截图/性能基准用）
window.__render = (v) => { holdT = v; renderAt(v); };
window.__setHold = (v) => { holdT = v; };
window.__t = () => (started ? +T().toFixed(2) : -1);

function frame() {
  const t = holdT != null ? holdT : (started ? T() : 0);
  if (started && !holdT && t > TOTAL + 1.2) { showEnd(); }
  renderAt(t);
  requestAnimationFrame(frame);
}

function renderAt(t) {
  cur = beatIndexAt(Math.min(t, TOTAL - .01));
  const b = TL[cur];
  c.save();
  c.setTransform(RS, 0, 0, RS, 0, 0);
  c.clearRect(0, 0, W, H);

  const sc = SCENES[b.v];
  const s = t - b.t0;
  const u = clamp(s / (b.t1 - b.t0));

  const enter = easeOutExpo(inv(0, 0.42, s));
  const exitp = cur === TL.length - 1 ? 1 : easeOutExpo(inv(0, 0.30, b.t1 - t));
  const a = Math.min(enter, exitp);
  const zoom = 1 + (1 - enter) * 0.10 + (1 - exitp) * 0.07;
  const dy = (1 - enter) * 46 - (1 - exitp) * 30;

  c.save();
  c.beginPath(); c.rect(0, 0, W, H); c.clip();
  c.translate(W / 2, H / 2); c.scale(zoom, zoom); c.globalAlpha = a;
  c.translate(-W / 2, -H / 2 + dy);
  if (window.__TESTDRAW) window.__TESTDRAW(c, s, b, u, t);
  else if (sc && !SKIP.scene) sc.draw(c, s, b, u, t);
  c.restore();

  // CRT 扫描线/噪点/暗角已全部交给 CSS 层（#crt），canvas 里零全屏操作
  if (!SKIP.hud) hud(c, t, cur, b.act);
  if (!SKIP.subs) drawSubs(t);

  if (debugMode) drawDebug(t, b, s);
  c.restore();
}

// 统计每帧绘制调用次数
window.__count = function (t) {
  const names = ['fillText', 'fillRect', 'strokeRect', 'stroke', 'fill', 'drawImage', 'arc']; 
  const saved = {}; const n = {};
  for (const nm of names) {
    saved[nm] = CanvasRenderingContext2D.prototype[nm];
    n[nm] = 0;
    CanvasRenderingContext2D.prototype[nm] = function (...a) { n[nm]++; return saved[nm].apply(this, a); };
  }
  for (const nm of names) n[nm] = 0;
  renderAt(t);
  for (const nm of names) CanvasRenderingContext2D.prototype[nm] = saved[nm];
  return { total: Object.values(n).reduce((a, b) => a + b, 0), ...n };
};

// 真实帧率：连续跑 n 毫秒，数 rAF 回调（含渲染）
window.__fps = function (ms = 2500, at = null) {
  if (at != null) holdT = at;
  return new Promise(res => {
    let n = 0; const t0 = performance.now();
    const tick = () => {
      n++;
      const el = performance.now() - t0;
      if (el < ms) requestAnimationFrame(tick);
      else res({ fps: +(n / (el / 1000)).toFixed(1), frames: n, ms: +el.toFixed(0) });
    };
    requestAnimationFrame(tick);
  });
};

// 性能基准：遍历全片，报每段平均帧耗时
window.__bench = function (step = 0.08) {
  const buckets = {};
  const t0 = performance.now();
  for (let t = 0; t < TOTAL; t += step) {
    const bi = beatIndexAt(Math.min(t, TOTAL - .01));
    const st = performance.now();
    renderAt(t);
    c.getImageData(0, 0, 1, 1);   // 强制同步，把光栅化算进去
    const dt = performance.now() - st;
    const k = TL[bi].v;
    (buckets[k] ||= []).push(dt);
  }
  const out = [];
  let sum = 0, cnt = 0;
  for (const k in buckets) {
    const arr = buckets[k].sort((a, b) => a - b);
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    sum += avg * arr.length; cnt += arr.length;
    out.push({ v: k, avg: +avg.toFixed(2), p95: +arr[Math.floor(arr.length * .95)].toFixed(2), max: +arr[arr.length - 1].toFixed(2) });
  }
  out.sort((a, b) => b.avg - a.avg);
  return { frames: cnt, totalMs: +(performance.now() - t0).toFixed(0), avg: +(sum / cnt).toFixed(2), worst: out.slice(0, 12), all: out };
};

function drawDebug(t, b, s) {
  c.save();
  c.font = F(18); c.textBaseline = 'top';
  c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, 560, 90);
  c.fillStyle = '#0f0';
  c.fillText(`${b.id}  ${b.v}   t=${t.toFixed(2)}  s=${s.toFixed(2)}  fps~${fpsAvg.toFixed(0)}`, 12, 10);
  c.fillText(`总长 ${TOTAL.toFixed(1)}s  第${cur + 1}/${TL.length}拍`, 12, 36);
  c.fillText(`render ${msAvg.toFixed(1)}ms`, 12, 62);
  c.strokeStyle = 'rgba(255,80,80,.5)'; c.lineWidth = 2;
  c.strokeRect(0, 916, W, H - 916);
  c.restore();
}

let fpsAvg = 60, msAvg = 0, lastF = performance.now();
function loop() {
  const now = performance.now();
  const dt = now - lastF; lastF = now;
  fpsAvg = lerp(fpsAvg, 1000 / Math.max(dt, .1), .06);
  const t0 = performance.now();
  frame();
  msAvg = lerp(msAvg, performance.now() - t0, .1);
  requestAnimationFrame(loop);
}

// ── 启动 UI ──
const veil = document.getElementById('veil');
function showEnd() {
  started = false;
  document.getElementById('endveil').style.opacity = '1';
  document.getElementById('endveil').style.pointerEvents = 'auto';
}

async function boot() {
  cv = document.getElementById('cv');
  cv.width = Math.round(W * RS); cv.height = Math.round(H * RS);
  MAIN = cv.getContext('2d', { alpha: false });
  OFF = document.createElement('canvas');
  OFF.width = W; OFF.height = H;
  c = MAIN;
  hookCtx(c);
  requestAnimationFrame(loop);

  if (holdT != null) { veil.style.display = 'none'; }

  const startBtn = document.getElementById('start');
  const start = async () => {
    if (started) return;
    startBtn.textContent = '准备中…';
    try {
      if (!AC) await initAudio();
      await Promise.race([AC.resume(), new Promise(r => setTimeout(r, 300))]);
      veil.classList.add('gone');
      document.getElementById('endveil').style.opacity = 0;
      document.getElementById('endveil').style.pointerEvents = 'none';
      started = true;
      playFrom(0);
    } catch (e) {
      startBtn.textContent = '启动出错：' + (e && e.message ? e.message : e);
      console.error(e);
    }
  };
  startBtn.addEventListener('click', start);
  veil.addEventListener('click', start);
  addEventListener('keydown', e => {
    if (!started && (e.code === 'Space' || e.code === 'Enter')) { start(); e.preventDefault(); return; }
    if (e.code === 'Space') { togglePause(); e.preventDefault(); }
    if (e.code === 'ArrowRight') { playFrom(clamp(T() + 5, 0, TOTAL - .2)); }
    if (e.code === 'ArrowLeft') { playFrom(clamp(T() - 5, 0, TOTAL - .2)); }
    if (e.code === 'KeyR') { playFrom(0); }
    if (e.code === 'KeyF') { document.documentElement.requestFullscreen?.(); }
  });
  c.addEventListener('click', () => { if (started && !holdT) togglePause(); });
}

// 给 ctx 的属性 setter 做值缓存：canvas 每次赋 fillStyle/globalAlpha/font
// 都要重新解析，逐字绘制时这就是几百次解析/帧。
const HOOKED = ['fillStyle', 'strokeStyle', 'font', 'globalAlpha', 'textAlign', 'textBaseline',
  'lineWidth', 'shadowBlur', 'shadowColor', 'lineCap', 'lineJoin'];
function hookCtx(c) {
  const proto = Object.getPrototypeOf(c);
  const cache = Object.create(null);
  for (const name of HOOKED) {
    const d = Object.getOwnPropertyDescriptor(proto, name);
    if (!d || !d.set) continue;
    Object.defineProperty(c, name, {
      configurable: true, enumerable: false,
      get() { return d.get.call(this); },
      set(v) {
        if (cache[name] === v) return;
        cache[name] = v;
        d.set.call(this, v);
      },
    });
  }
  const _r = proto.restore;
  c.restore = function () {
    this.__f = '';
    for (const k in cache) cache[k] = undefined;   // restore 后状态未知，全清
    _r.call(this);
  };
  const _s = proto.save;
  c.save = function () { _s.call(this); };
  // shadowBlur 是 canvas 里最贵的操作（大面积高斯模糊），但全片 ~60 处 
  // 用法都是为了“荧光感”。直接屏蔽，荧光改用 gfx 里的粗描边实现。
  Object.defineProperty(c, 'shadowBlur', {
    configurable: true, enumerable: false,
    get() { return 0; }, set(_v) { },
  });
  Object.defineProperty(c, 'shadowColor', {
    configurable: true, enumerable: false,
    get() { return 'rgba(0,0,0,0)'; }, set(_v) { },
  });
}
let paused = false;
function togglePause() {
  if (!AC) return;
  if (AC.state === 'running') { AC.suspend(); paused = true; }
  else { AC.resume(); paused = false; }
}
