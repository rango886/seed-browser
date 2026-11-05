// ── 绘制原语：字符网格、ASCII 面板、字符雨、CRT 后期、HUD ──
const W = 1920, H = 1080;
// 用系统自带的等宽中文字体：汉字刚好 = 2 × ASCII（ratio 2.000），
// 好处是①中文不用逐字定位就能对齐 ②单一字体，没有 fallback 查找（性能差 2 倍）
const MONO = '"SimHei", "NSimSun", sans-serif';
const CJKF = '"SimHei", "Microsoft YaHei UI", sans-serif';
const _fc = new Map();
function fontOf(px, w = 400) {
  const k = Math.round(px) + '_' + w;
  let s = _fc.get(k);
  if (s === undefined) { s = w + ' ' + Math.round(px) + 'px ' + MONO; _fc.set(k, s); }
  return s;
}
function fontOfC(px, w = 400) {
  const k = 'c' + Math.round(px) + '_' + w;
  let s = _fc.get(k);
  if (s === undefined) { s = w + ' ' + Math.round(px) + 'px ' + CJKF; _fc.set(k, s); }
  return s;
}
const F = (px, w = 400) => fontOf(px, w);
const FC = (px, w = 400) => fontOfC(px, w);
function setF(c, f) { if (c.__f === f) return; c.__f = f; c.font = f; }

const C = {
  bg: '#03060a', ink: '#04080d',
  dim: '#16222c', gray: '#5b7387', text: '#b3cad9', white: '#f0f8ff',
  green: '#2bff9b', greenL: '#9dffd0', greenD: '#0d5c3c',
  cyan: '#4ce3ff', cyanD: '#0b4a5e',
  blue: '#7aa5ff', purple: '#b39dff', magenta: '#ff6fd8',
  yellow: '#ffd166', orange: '#ffa04d', red: '#ff5566', redD: '#5e1520',
};

// ── 数学 ──
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a));
const smooth = t => (t = clamp(t), t * t * (3 - 2 * t));
const ss = (a, b, v) => smooth(inv(a, b, v));
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = t => Math.pow(clamp(t), 3);
const easeInOut = t => (t = clamp(t)) < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t));
const backOut = t => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const pick = (arr, i) => arr[Math.floor(rnd(i) * arr.length) % arr.length];

// ── 字符宽度 ──
function isWide(p) {
  return (p >= 0x1100 && (p <= 0x115f || (p >= 0x2e80 && p <= 0xa4cf && p !== 0x303f) ||
    (p >= 0xac00 && p <= 0xd7a3) || (p >= 0xf900 && p <= 0xfaff) ||
    (p >= 0xfe30 && p <= 0xfe6f) || (p >= 0xff00 && p <= 0xff60) ||
    (p >= 0xffe0 && p <= 0xffe6))); 
}
function cw(ch) { return isWide(ch.charCodeAt(0)) ? 2 : 1; }
function tw(str) { let n = 0; for (let i = 0; i < str.length; i++) n += isWide(str.charCodeAt(i)) ? 2 : 1; return n; }
function fit(str, n) {
  let out = '', w = 0;
  for (let i = 0; i < str.length; i++) {
    const k = isWide(str.charCodeAt(i)) ? 2 : 1;
    if (w + k > n) return out + ' '.repeat(n - w);
    out += str[i]; w += k;
  }
  return out + ' '.repeat(n - w);
}

// ── 等宽对齐绘制（中英混排也对齐） ──
// 快路径：纯 ASCII 一次 fillText（能带 shadowBlur 而不爆）；
// 慢路径：含中文/高亮/渐隐时逐格绘制，且不逐字开模糊。
const HAS_CJK = /[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]/;
// 关键：每次 canvas draw call 都有固定开销（本机 ~0.3ms，显卡驱动导致），
// 所以文字必须整行一次 fillText，绝不能逐字。只有高亮/渐隐才降级分段。
function mt(c, str, x, y, cell, o = {}) {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0.01 || !str) return 0;
  const ga = c.globalAlpha;
  const baseA = ga * alpha;
  const col = o.color || C.text;
  setF(c, fontOf(cell * 1.95, o.weight || 400));
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.globalAlpha = baseA;
  c.fillStyle = col;
  const glow = o.glow | 0;

  // glow 用“加一圈描边”代替 shadowBlur： shadowBlur 是大面积模糊，
  // 在 canvas2d 上极贵（一次能吃掉十几毫秒），描边只要多一个 draw call
  if (glow) { c.strokeStyle = col; c.lineWidth = Math.max(0.5, glow / 16); }
  if (!o.hl && o.fade == null) {
    if (glow && !HAS_CJK.test(str)) c.strokeText(str, x, y);
    c.fillText(str, x, y);
  } else {
    // 分段：同色相邻字符合并成一段，每段一次 fillText
    const n = str.length;
    let i = 0, seg = '', segI = 0;
    const flushSeg = () => {
      if (!seg) return;
      if (glow && !HAS_CJK.test(seg)) c.strokeText(seg, x + segI * cell, y);
      c.fillText(seg, x + segI * cell, y);
      seg = '';
    };
    for (let k = 0; k < n; k++) {
      const code = str.charCodeAt(k), ch = str[k];
      const wide = isWide(code) ? 2 : 1;
      let cc = col, a = 1;
      if (o.hl) for (let h = 0; h < o.hl.length; h++) if (i >= o.hl[h].start && i < o.hl[h].end) cc = o.hl[h].color ?? cc;
      if (o.fade != null && i > o.fade) a = clamp(1 - (i - o.fade) / (o.fadeLen || 12));
      if (cc !== c.__segCol || a < .99) {
        flushSeg();
        if (c.__segCol !== cc) { c.fillStyle = cc; c.__segCol = cc; }
        c.globalAlpha = baseA * a;
        segI = i;
      }
      seg += ch;
      i += wide;
    }
    flushSeg();
    c.__segCol = null;
  }
  c.globalAlpha = ga;
  return tw(str) * cell;
}

function tx(c, str, x, y, px, o = {}) {
  const ga = c.globalAlpha;
  c.globalAlpha *= o.alpha ?? 1;
  setF(c, o.font || (o.cjk ? fontOfC(px, o.weight || 700) : fontOf(px, o.weight || 400)));
  c.textAlign = o.align || 'left';
  c.textBaseline = o.baseline || 'alphabetic';
  c.fillStyle = o.color || C.white;
  if (o.glow) { c.strokeStyle = c.fillStyle; c.lineWidth = Math.max(1, o.glow / 7); c.strokeText(str, x, y); }
  c.fillText(str, x, y);
  c.globalAlpha = ga;
}

function rgba(hex, a = 1) {
  const q = a >= 1 ? 100 : a <= 0 ? 0 : (a * 100) | 0;
  const k = hex + '|' + q;
  let s = _rgbaC.get(k);
  if (s === undefined) {
    const n = parseInt(hex.slice(1), 16);
    s = 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + (q / 100) + ')';
    _rgbaC.set(k, s);
  }
  return s;
}
const _rgbaC = new Map();

// ── ASCII 面板 ──
function panel(c, x, y, w, h, o = {}) {
  const col = o.color || C.greenD;
  c.save();
  if (o.fill) { c.fillStyle = o.fill; c.fillRect(x, y, w, h); }
  c.strokeStyle = col; c.lineWidth = o.lw || 2;
  c.strokeRect(x + .5, y + .5, w, h);
  if (o.glow) {   // 外发光：再加一圈粗描边，不用 shadowBlur
    c.globalAlpha *= .45;
    c.lineWidth = Math.max(2, o.glow / 6);
    c.strokeRect(x + .5, y + .5, w, h);
    c.globalAlpha /= .45;
    c.lineWidth = o.lw || 2;
  }
  if (o.title) {
    const cp = o.cell || 19;
    const w2 = tw(o.title) * cp + 26;
    c.fillStyle = o.fill || C.bg;
    c.fillRect(x + 22, y - 13, w2, 26);
    mt(c, o.title, x + 34, y + 1, cp, { color: o.titleColor || C.green, weight: 600 });
  }
  if (o.corner !== false) {
    c.fillStyle = col;
    c.font = F(24);
    c.textAlign = 'center'; c.textBaseline = 'middle';
  }
  c.restore();
  return { x, y, w, h };
}

// 窗口（标题只画一次）
function win(c, x, y, w, h, o = {}) {
  const col = o.color || C.greenD;
  const { title, titleColor } = o;
  panel(c, x, y, w, h, { color: col, fill: o.fill || 'rgba(4,10,14,.94)', lw: 2 });
  c.save();
  for (let i = 0; i < 3; i++) {
    c.fillStyle = [C.red, C.yellow, C.green][i];
    c.globalAlpha *= .9;
    c.beginPath(); c.arc(x + 26 + i * 22, y + 25, 5.5, 0, 7); c.fill();
  }
  if (title) {
    c.globalAlpha = 1;
    c.font = F(18, 400);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = titleColor || C.green;
    c.fillText(title, x + w / 2, y + 25);
  }
  c.restore();
}

// ── 打字机 ──
function typed(str, s, start, dur) {
  if (s <= start) return '';
  if (s >= start + dur) return str;
  return str.slice(0, Math.floor(str.length * clamp((s - start) / dur)));
}

// ── 背景：一格 fillRect + 四角刻度（网格线交给 CSS 层，省一次全屏 drawImage） ──
function bgGrid(c, s, o = {}) {
  c.fillStyle = o.bg || C.bg;
  c.fillRect(0, 0, W, H);
  const a = o.alpha ?? .5, col = o.col || C.green;
  c.strokeStyle = rgba(col, .34 * a);
  c.lineWidth = 2;
  const m = 44, L = 24;
  c.beginPath();
  c.moveTo(m, m + L); c.lineTo(m, m); c.lineTo(m + L, m);
  c.moveTo(W - m - L, m); c.lineTo(W - m, m); c.lineTo(W - m, m + L);
  c.moveTo(m, H - m - L); c.lineTo(m, H - m); c.lineTo(m + L, H - m);
  c.moveTo(W - m - L, H - m); c.lineTo(W - m, H - m); c.lineTo(W - m, H - m - L);
  c.stroke();
}

// ── 字符雨（离屏缓存，每 70ms 刷新一次，像终端那样跳变） ──
const RAINCH = '01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ<>/\\[]{}=+*#$%&@│─┌┐└┘▚▞░▒▓';
let _rainCan = null, _rainT = -9, _rainKey = '';
function rainInto(g, s, o) {
  const cell = o.cell || 26, cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
  g.clearRect(0, 0, W, H);
  g.font = F(cell * 1.2, 400);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < cols; i++) {
    const seed = rnd(i * 3.13);
    const x = i * cell + cell / 2;
    const speed = 110 + seed * 280;
    const head = ((s * speed + seed * 3000) % (rows * cell + 340)) / cell;
    const len = 8 + Math.floor(rnd(i * 7.7) * 20);
    for (let j = 0; j < len; j++) {
      const r = head - j;
      if (r < 0 || r > rows) continue;
      const y = r * cell + cell / 2;
      const ch = RAINCH[Math.floor(rnd(i * 31.7 + Math.floor(r * 1.7) + Math.floor(s * 9) * 0.017) * RAINCH.length) % RAINCH.length];
      const t = 1 - j / len;
      g.fillStyle = j === 0 ? rgba(o.head || C.greenL, .95) : rgba(o.col || C.green, t * t * .62);
      g.fillText(ch, x, y);
    }
  }
}
function rainField(c, s, o = {}) {
  const key = (o.cell || 26) + '|' + (o.col || '') + '|' + (o.head || '');
  if (!_rainCan || _rainKey !== key) {
    _rainCan = document.createElement('canvas');
    _rainCan.width = W; _rainCan.height = H;
    _rainKey = key; _rainT = -9;
  }
  const qt = Math.floor(s * 14) / 14;
  if (qt !== _rainT) { _rainT = qt; rainInto(_rainCan.getContext('2d'), qt, o); }
  c.save();
  c.globalAlpha *= (o.alpha ?? .8);
  c.drawImage(_rainCan, 0, 0);
  c.restore();
}

// ── 后期：扫描线 + 噪点 + 弱暗角 ──
let _noise = null, _scan = null, _vig = null, _pat = null;
function makeNoise() {
  const n = document.createElement('canvas'); n.width = n.height = 256;
  const g = n.getContext('2d'), d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0); return n;
}
function makeScan() {
  const n = document.createElement('canvas'); n.width = W; n.height = H;
  const g = n.getContext('2d');
  g.fillStyle = '#000';
  for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1.5);
  return n;
}
function makeVig() {
  const n = document.createElement('canvas'); n.width = W; n.height = H;
  const g = n.getContext('2d');
  const rg = g.createRadialGradient(W / 2, H / 2, H * .55, W / 2, H / 2, H * 1.15);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.72)');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  return n;
}
function post(c, s, o = {}) {
  if (!_noise) { _noise = makeNoise(); _scan = makeScan(); _vig = makeVig(); _pat = c.createPattern(_noise, 'repeat'); }
  c.save();
  c.globalAlpha = o.scan ?? .30;
  c.drawImage(_scan, 0, 0, W, H);
  c.globalAlpha = o.noise ?? .05;
  c.fillStyle = _pat;
  c.fillRect(0, 0, W, H);
  c.globalAlpha = o.vig ?? .85;
  c.drawImage(_vig, 0, 0);
  c.restore();
}

function scanBeam(c, s, o = {}) {  const p = (s * (o.speed || .28)) % 1.6;
  if (p > 1) return;
  const y = p * H;
  const g = c.createLinearGradient(0, y - 90, 0, y + 90);
  g.addColorStop(0, rgba(o.col || C.green, 0));
  g.addColorStop(.5, rgba(o.col || C.green, o.alpha ?? .1));
  g.addColorStop(1, rgba(o.col || C.green, 0));
  c.fillStyle = g; c.fillRect(0, y - 90, W, 180);
}

// ── 字符块 LOGO（实心方块，比 █ 更"重"） ──
const GLYPH = {
  'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  'I': ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
function blockWidth(text, cell) { return text.length * 6 * cell; }
function blockText(c, text, x, y, cell, s, o = {}) {
  const order = [];
  let gx = 0;
  for (const ch of text) {
    const g = GLYPH[ch] || GLYPH[' '];
    for (let r = 0; r < 7; r++) for (let k = 0; k < 5; k++)
      if (g[r][k] === '1') order.push([gx + k, r]);
    gx += 6;
  }
  const total = order.length;
  const rev = o.reveal ?? 1;
  const gap = o.gap ?? 1.5;
  c.save();
  const col = o.color || C.green;
  // 两遍：先大一圈的低透明度块当翍光（不用 shadowBlur，那是大坑），再上实块
  for (let pass = 0; pass < 2; pass++) {
    const pad = pass === 0 ? 4 : 0;
    c.shadowBlur = 0;
    for (let i = 0; i < total; i++) {
      const th = i / total;
      if (th > rev) break;
      const [cx, cy] = order[i];
      const lit = clamp((rev - th) * 7, 0, 1);
      if (pass === 0) {
        c.fillStyle = rgba(col, lit * .16);
        c.fillRect(x + cx * cell - pad, y + cy * cell - pad, cell - gap + pad * 2, cell - gap + pad * 2);
      } else {
        c.fillStyle = rgba(col, .12 + lit * .88);
        c.fillRect(x + cx * cell, y + cy * cell, cell - gap, cell - gap);
      }
    }
  }
  c.restore();
  return gx * cell;
}

// ── 数据流管道 ──
function polyLen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y); return L; }
function polyAt(p, d) {
  for (let i = 1; i < p.length; i++) {
    const L = Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
    if (d <= L) { const t = L ? d / L : 0; return { x: lerp(p[i - 1].x, p[i].x, t), y: lerp(p[i - 1].y, p[i].y, t) }; }
    d -= L;
  }
  return p[p.length - 1];
}
function flowLine(c, pts, s, o = {}) {
  const col = o.col || C.green;
  c.save();
  c.strokeStyle = rgba(col, o.track ?? .18);
  c.lineWidth = o.lw || 3;
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
  c.stroke();
  const n = o.n ?? 26;
  const total = polyLen(pts);
  c.font = F(o.fs || 20);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const d = ((s * (o.speed || 320) + i * (total / n)) % total + total) % total;
    const pt = polyAt(pts, d);
    const t = i / n;
    c.fillStyle = rgba(i === 0 && o.head ? o.head : col, (.2 + t * .8) * (o.alpha ?? 1));
    if (o.chars) c.fillText(o.chars[(i + Math.floor(s * 20)) % o.chars.length], pt.x, pt.y);
    else c.fillRect(pt.x - 3, pt.y - 3, 6, 6);
  }
  c.restore();
}

function bar(c, x, y, w, h, p, o = {}) {
  c.save();
  c.fillStyle = rgba(o.track || C.green, .12);
  c.fillRect(x, y, w, h);
  c.fillStyle = o.color || C.green;
  c.fillRect(x, y, w * clamp(p), h);
  c.strokeStyle = rgba(o.color || C.green, .5);
  c.lineWidth = 1.5;
  c.strokeRect(x - .5, y - .5, w + 1, h + 1);
  if (o.ticks) {
    c.strokeStyle = rgba(o.color || C.green, .3);
    c.beginPath();
    for (let i = 1; i < o.ticks; i++) { const xx = x + w * i / o.ticks; c.moveTo(xx, y); c.lineTo(xx, y + h); }
    c.stroke();
  }
  c.restore();
}

const counter = v => Math.round(v).toLocaleString('en-US');
function shake(c, amt, seed) {
  if (amt <= 0.2) return;
  c.translate((rnd(seed) - .5) * amt, (rnd(seed + 3.7) - .5) * amt);
}

// ── 全片 HUD：录像机 OSD，加密度也加"MV 感" ──
const ACTS = [
  ['hook', '00  COLD OPEN'], ['pain', '01  处处碰壁'], ['turn', '02  借浏览器'],
  ['read', '03  rsf read'], ['lib', '04  函数库'], ['pipe', '05  管道'],
  ['research', '06  跨站调研'], ['how', '07  原理'], ['end', '08  尾声'],
];
function hud(c, t, bi, act) {
  const idx = ACTS.findIndex(a => a[0] === act);
  const name = idx >= 0 ? ACTS[idx][1] : '';
  const tc = (v) => {
    const m = Math.floor(v / 60), s2 = Math.floor(v % 60), f = Math.floor((v % 1) * 24);
    return String(m).padStart(2, '0') + ':' + String(s2).padStart(2, '0') + ':' + String(f).padStart(2, '0');
  };
  c.save();
  c.globalAlpha = .55;
  mt(c, '● REC', 56, 40, 12, { color: Math.floor(t * 2) % 2 ? C.red : rgba(C.red, .3) });
  mt(c, 'RSF_v2.0', 160, 40, 12, { color: rgba(C.gray, .9) });
  mt(c, 'ACT ' + name, W - 56 - tw('ACT ' + name) * 12, 40, 12, { color: rgba(C.greenL, .8) });
  mt(c, tc(t) + '  ·  ' + String(bi + 1).padStart(2, '0') + '/' + TL.length, 56, H - 40, 12, { color: rgba(C.gray, .9) });
  // 右下的电平条
  const bx = W - 300;
  for (let i = 0; i < 9; i++) {
    const hgt = 6 + Math.abs(Math.sin(t * 3.1 + i * .9)) * 22;
    c.fillStyle = rgba(i > 6 ? C.yellow : C.green, .5);
    c.fillRect(bx + i * 9, H - 40 - hgt / 2, 5, hgt);
  }
  c.restore();
}
