// ── 场景 A：开场钩子 / 痛点 / 转折 / read ──
const SCENES = {};

// 命令行着色：一段一段画，每段自己算宽度
const KW = /^(read|call|run|lib|test|list|snapshot|find|click|fill|eval|trace|browser|tab)$/;
function drawCmd(c, str, x, y, cell, o = {}) {
  let i = 0;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  for (const tok of str.split(/(\s+)/)) {
    let col = C.text;
    if (tok === '$') col = C.gray;
    else if (tok.startsWith('--')) col = C.purple;
    else if (tok.startsWith('-') && tok.length <= 2) col = C.purple;
    else if (tok === 'rsf') col = C.green;
    else if (KW.test(tok)) col = C.cyan;
    else if (/^https?:\/\//.test(tok)) col = C.yellow;
    else if (tok === '|' || tok === '>') col = C.magenta;
    else if (tok === '-') col = C.orange;
    mt(c, tok, x + i * cell, y, cell, { color: col, weight: 400 });
    i += [...tok].reduce((n, ch) => n + cw(ch), 0);
  }
  c.restore();
  return i * cell;
}

// 输出行：{t, c, bg, pre}
function outLines(c, x, y, cell, lh, arr, s, start, gap, o = {}) {
  arr.forEach((ln, i) => {
    const it = typeof ln === 'string' ? { t: ln } : ln;
    const st = start + i * gap;
    if (s < st) return;
    const ty = y + i * lh;
    if (ty > (o.ymax ?? H)) return;
    const shown = it.noType ? it.t : typed(it.t, s, st, Math.min(gap * .8, .55));
    if (!shown) return;
    if (it.bg) {
      c.save(); c.fillStyle = it.bg;
      c.fillRect(x - 8, ty - lh * .46, tw(shown) * cell + 16, lh * .92); c.restore();
    }
    if (it.pre) mt(c, it.pre, x, ty, cell, { color: it.preC || C.gray });
    mt(c, shown, x + (it.pre ? tw(it.pre) * cell : 0), ty, cell,
      { color: it.c || C.text, hl: it.hl, glow: it.glow, weight: it.w || 400, fade: it.fade });
  });
}

// 光标
function cursor(c, x, y, cell, s, col = C.green) {
  if (Math.floor(s * 2.4) % 2) return;
  c.save(); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 14;
  c.fillRect(x, y - cell * .55, cell * .55, cell * 1.1); c.restore();
}

// ══════════════════════ 冷开场 ══════════════════════

SCENES.boot = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .3, gap: 90, speed: 4 });
    rainField(c, s, { cell: 36, alpha: .09, col: C.greenD });
    const bl = Math.floor(s * 2.4) % 2 === 0;
    c.save();
    c.globalAlpha = bl ? .95 : .1;
    c.font = F(46); c.fillStyle = C.green; c.shadowColor = C.green; c.shadowBlur = 30;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('▌', W / 2, H / 2);
    c.restore();
  },
  sfx: [[0.05, 'blip', { f: 1740, d: .05, g: .07 }]],
};

SCENES.wall = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .22, gap: 70 });
    // 背景砖墙在砌
    c.save();
    c.font = F(22); c.textAlign = 'center'; c.textBaseline = 'middle';
    const rows = 9, cols = 8;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const idx = r * cols + k;
      const t0 = .1 + idx * .012;
      if (s < t0) continue;
      const a = Math.min(1, (s - t0) * 5) * .12;
      c.fillStyle = rgba(C.red, a);
      const off = (r % 2) * 60;
      c.fillText('▨', k * 240 + off + 90, r * 110 + 80);
    }
    c.restore();

    const CS = [
      { code: 'NEED_LOGIN', site: 'x.com', note: '要登录才能看', d: .12 },
      { code: 'BLOCKED', site: 'zhihu.com', note: '人机验证，过不去', d: .46 },
      { code: '403', site: 'reddit.com', note: '直接拒绝访问', d: .80 },
    ];
    const cw2 = 660, ch = 176;
    CS.forEach((k, i) => {
      const p = clamp((s - k.d) / .30);
      if (p <= 0) return;
      const bp = backOut(p);
      const x = W / 2 - cw2 / 2 + (i - 1) * 24;
      const y = 200 + i * 218 - (1 - bp) * 260;
      const rot = (i - 1) * .022 + (1 - bp) * (i - 1) * .12;
      c.save();
      c.translate(x + cw2 / 2, y + ch / 2);
      c.rotate(rot);
      c.scale(.94 + bp * .06, .94 + bp * .06);
      c.globalAlpha *= Math.min(1, p * 3);
      c.translate(-cw2 / 2, -ch / 2);
      const flash = 1 - clamp((s - k.d) / .22);
      panel(c, 0, 0, cw2, ch, {
        color: rgba(C.red, .55 + flash * .45), fill: 'rgba(20,4,7,.92)', lw: 3,
        glow: 26 + flash * 40,
      });
      c.fillStyle = rgba(C.red, .08 + flash * .25); c.fillRect(3, 3, cw2 - 6, ch - 6);
      mt(c, '✗', 34, 46, 20, { color: C.red, weight: 700, glow: 16 });
      mt(c, k.code, 34 + 2 * 20, 46, 20, { color: C.red, weight: 700, glow: 16 });
      mt(c, k.site, 34 + (2 + tw(k.code) + 1.6) * 20, 50, 14, { color: C.gray });
      mt(c, k.note, 34, 104, 20, { color: C.text });
      mt(c, '→ ' + (i === 0 ? '请用户去浏览器里登录' : i === 1 ? '请用户手动过验证码' : '没有下一步'), 34, 140, 17, { color: rgba(C.red, .8) });
      c.restore();
    });
    shake(c, 14 * (1 - clamp((s - .8) / .4)), Math.floor(s * 60));
  },
  sfx: [[0.12, 'impact', { g: .5, f: 110 }], [0.46, 'impact', { g: .6, f: 95 }], [0.80, 'impact', { g: .7, f: 80 }],
  [0.14, 'buzz', { f: 120 }], [0.48, 'buzz', { f: 104 }], [0.82, 'buzz', { f: 88 }]],
};

SCENES.onecmd = {
  draw(c, s) {
    const flash = 1 - clamp(s / .35);
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    if (flash > 0) { c.fillStyle = rgba(C.greenL, flash * .5); c.fillRect(0, 0, W, H); }
    bgGrid(c, s, { alpha: .18, gap: 90 });

    const cmd = '$ rsf read https://www.zhihu.com/question/658523713 -b';
    const t0 = .18, td = .52;
    const shown = typed(cmd, s, t0, td);
    drawCmd(c, shown, 150, 210, 15.6);
    if (s > t0 + td) {
      const bl = Math.floor(s * 2.5) % 2 === 0;
      if (bl) { c.fillStyle = C.green; c.fillRect(150 + tw(cmd) * 15.6 + 4, 196, 10, 30); }
    }
    if (s > .85) {
      const L = [
        { t: '# 如何评价新发布的推理模型？', c: C.white, w: 700 },
        { t: 'type: question · via: lib:zhihu.com · 关注 3,281 · 浏览 128.4 万', c: C.gray },
        { t: 'answer: 412 个回答', c: C.text },
        { t: '' },
        { t: '这个网站有函数库 zhihu.com（rsf call zhihu.com <函数> [参数]）：', c: C.green, w: 600 },
        { t: '  search(keyword, { limit = 20 } = {})        — 搜索', c: C.cyan },
        { t: '  answers(id, { limit = 20, sort = "default" } = {})  — 回答', c: C.cyan },
        { t: '  … 共 9 个函数', c: C.gray },
      ];
      outLines(c, 150, 276, 15, 40, L, s, 1.0, .13, {});
    }
    c.save();
    const g = c.createLinearGradient(0, 300, 0, 900);
    g.addColorStop(0, 'rgba(3,6,10,0)'); g.addColorStop(1, 'rgba(3,6,10,1)');
    c.fillStyle = g; c.fillRect(0, 620, W, 300);
    c.restore();
  },
  sfx: [[0.18, 'whoosh', { f0: 600, f1: 3000, d: .3, g: .14 }],
  [0.22, 'key'], [0.30, 'key'], [0.38, 'key'], [0.46, 'key'], [0.54, 'key'], [0.62, 'key'],
  [0.72, 'enter'], [1.0, 'ding', { f: 660, g: .12 }]],
};

SCENES.collapse = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .2, gap: 70 });
    const suck = ss(1.1, 2.0, s);
    // 左：字符洪水
    c.save();
    c.globalAlpha = 1 - suck * .9;
    c.translate(-suck * 260, 0);
    c.scale(1 - suck * .5, 1 - suck * .5);
    c.translate(W * .5 * suck, H * .5 * suck * .3);
    rainField(c, s, { cell: 20, alpha: .8 * (1 - suck), col: C.gray, head: C.text });
    c.restore();

    // 计数
    const v = 231447 - (231447 - 2140) * easeInOut(inv(.9, 1.8, s));
    c.save();
    c.font = F(74, 700); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = C.white; c.shadowColor = C.green; c.shadowBlur = 30;
    c.globalAlpha = ss(.15, .5, s) * (1 - ss(2.6, 3.1, s) * .3);
    c.fillText(counter(v), W / 2, 150);
    c.font = F(20); c.fillStyle = C.gray; c.shadowBlur = 0; c.globalAlpha *= .9;
    c.fillText('CHARACTERS', W / 2, 208);
    c.restore();

    // 漏斗
    const fy = 250, fs = 300;
    c.save();
    c.globalAlpha = ss(.3, .8, s);
    c.strokeStyle = rgba(C.green, .5); c.lineWidth = 2;
    c.beginPath();
    c.moveTo(W / 2 - fs / 2, fy); c.lineTo(W / 2 - 60, fy + fs * .5);
    c.lineTo(W / 2 - 60, fy + fs * .62); c.lineTo(W / 2 + 60, fy + fs * .62);
    c.lineTo(W / 2 + 60, fy + fs * .5); c.lineTo(W / 2 + fs / 2, fy);
    c.stroke();
    // 落下的字符
    for (let i = 0; i < 40; i++) {
      const ph = ((s * .7 + rnd(i)) % 1);
      const yy = fy + ph * fs * .5;
      const xx = W / 2 + (rnd(i * 3) - .5) * fs * (1 - ph) * .9;
      c.fillStyle = rgba(C.green, (1 - ph) * .5 * (1 - suck));
      c.font = F(16); c.textAlign = 'center';
      c.fillText(pick('01<>/{}[]#%', i + ph * 9), xx, yy);
    }
    c.restore();

    // 右：结构化输出
    const ap = ss(1.3, 2.0, s);
    if (ap > 0) {
      c.save();
      c.globalAlpha *= ap;
      c.translate(0, (1 - ap) * 60);
      const px = W / 2 + 160, pw = 660, py = 250, ph = 450;
      win(c, px, py, pw, ph, { title: 'read · 结构化提取', color: rgba(C.green, .7) });
      const L = [
        { t: 'title     如何评价新发布的推理模型？', c: C.white, w: 600 },
        { t: 'via       lib:zhihu.com  (最准)', c: C.gray },
        { t: 'author    深度思考研究所', c: C.text },
        { t: 'stat      关注 3,281 · 浏览 1,284,331', c: C.text },
        { t: 'section   answers   412 条（按需加载）', c: C.cyan },
        { t: 'section   related   相关推荐 20 个', c: C.cyan },
        { t: '' },
        { t: '# 正文：这一段真的有用', c: C.green, w: 600 },
      ];
      outLines(c, px + 34, py + 76, 14, 40, L, s, 2.0 + ap * .1, .10, {});
      c.restore();
    }
  },
  sfx: [[0.1, 'whoosh', { f0: 400, f1: 1200, d: .5, g: .1 }],
  [1.05, 'rise', { f0: 600, f1: 180 }], [2.0, 'bloop', { f: 300 }], [2.6, 'ding', { f: 720 }]],
};

SCENES.pipe = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .18, gap: 80 });
    const y = 470;
    const pts = [{ x: 90, y }, { x: 560, y }, { x: 740, y: y - 90 }, { x: 1180, y: y - 90 }, { x: 1360, y }, { x: 1560, y }];
    // 管道外壳
    c.save();
    c.strokeStyle = rgba(C.green, .1); c.lineWidth = 46; c.lineCap = 'round';
    c.beginPath(); c.moveTo(pts[0].x, y); pts.slice(1).forEach(p => c.lineTo(p.x, p.y)); c.stroke();
    c.restore();
    // 里面的 JSON
    flowLine(c, pts, s, { speed: 520, n: 30, color: C.cyan, lw: 2, track: .06, chars: '{}",:0123456789' });
    // 起点：搜索
    c.save();
    c.globalAlpha = ss(.05, .4, s);
    mt(c, 'rsf call bilibili.com search 电影解说', 96, 400, 15, { color: C.text });
    mt(c, '→ 5 个视频', 96, 430, 15, { color: C.gray });
    c.restore();

    // 终点窗口：只接住 3 条
    const ap = ss(1.6, 2.4, s);
    c.save();
    c.globalAlpha *= ap;
    win(c, 1330, 300, 520, 330, { title: 'model context', color: rgba(C.cyan, .7) });
    const L = [
      { t: '评论 1  "确实好用，脚本一把过"', c: C.greenL },
      { t: '评论 2  "跑分和实测差挺多"', c: C.greenL },
      { t: '评论 3  "等两周再说"', c: C.greenL },
    ];
    outLines(c, 1360, 380, 13, 44, L, s, 2.35, .16, {});
    mt(c, '↑ 只有 3 条', 1360, 570, 13, { color: C.gray });
    c.restore();

    // 被丢弃的
    c.save();
    c.globalAlpha = ss(1.2, 2.0, s) * .4;
    for (let i = 0; i < 24; i++) {
      const px = 700 + rnd(i) * 500, py = 610 + rnd(i + 9) * 240;
      c.fillStyle = rgba(C.cyan, .3);
      c.font = F(13); c.textAlign = 'center';
      c.fillText('{"text":"…评论…"}', px, py);
    }
    c.restore();
    c.save();
    c.globalAlpha = ss(1.8, 2.5, s);
    c.fillStyle = rgba(C.red, .9); c.font = F(22, 700); c.textAlign = 'center';
    c.fillText('✕ 其余 297 条，模型一条没看见', W / 2 + 200, 760);
    c.restore();
  },
  sfx: [[0.05, 'whoosh', { f0: 300, f1: 2400, d: .6, g: .16 }],
  [1.65, 'blip', { f: 880 }], [2.35, 'ding', { f: 660 }], [2.6, 'buzz', { f: 130, g: .5 }]],
};

SCENES.title = {
  draw(c, s) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 900);
    g.addColorStop(0, rgba(C.green, .1)); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    bgGrid(c, s, { alpha: .25, gap: 64 });

    const rev = clamp((s - .12) / .9);
    const cell = 36;
    blockText(c, 'RSF', (W - blockWidth('RSF', cell)) / 2, 268, cell, s,
      { reveal: rev, color: C.green });
    // 副标题
    c.save();
    const a2 = ss(.75, 1.2, s);
    c.globalAlpha *= a2;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(52, 700); c.fillStyle = C.white; c.shadowColor = C.green; c.shadowBlur = 22;
    c.fillText('Recursurf', W / 2, 636);
    c.font = FC(38, 700); c.fillStyle = C.greenL; c.shadowBlur = 14;
    c.fillText('让 AI 借你的浏览器上网', W / 2, 706);
    c.font = F(22); c.fillStyle = C.gray; c.shadowBlur = 0;
    c.globalAlpha *= ss(1.2, 1.7, s);
    c.fillText('rsf  ·  browser access for agents', W / 2, 776);
    c.restore();

    // 扫描线扫过
    scanBeam(c, s, { col: C.green, alpha: .12, speed: .5 });
    shake(c, 22 * (1 - clamp(s / .5)), 7);
  },
  sfx: [[0.15, 'impact', { g: .75, f: 90 }], [0.5, 'rise', { f0: 220, f1: 880, d: .4, g: .08 }],
  [0.78, 'ding', { f: 440, g: .16 }], [1.25, 'blip', { f: 1320, g: .1 }],
  [0.02, 'whoosh', { f0: 200, f1: 3000, d: .8, g: .2 }]],
};

// ══════════════════════ 第一幕：痛 ══════════════════════

SCENES.ask = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .18, gap: 80 });
    win(c, 200, 150, 1520, 480, { title: 'terminal' });
    mt(c, '$ 查一下昨晚发的那个新模型，大家都怎么评价', 238, 230, 16, { color: C.white });
    const blink = Math.floor(s * 2.4) % 2 === 0;
    if (blink) { c.fillStyle = C.green; c.fillRect(238 + 16 * 47, 216, 11, 30); }
    if (s > 2.2) {
      const ph = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
      const k = Math.floor(s * 10) % ph.length;
      mt(c, ph[k] + ' 正在访问 x.com …', 238, 300, 15, { color: C.gray });
      mt(c, '⠋ 连接中', 238, 342, 15, { color: rgba(C.gray, .5) });
      bar(c, 238, 400, 500, 12, ss(2.2, 4.2, s), { color: C.gray, track: C.gray });
    }
    if (s > 3.4) {
      mt(c, '⚠ 请求被拒绝：需要登录', 238, 470, 15, { color: C.red });
    }
  },
  sfx: [[0.2, 'key'], [0.9, 'blip', { f: 900, g: .08 }], [2.2, 'tick'], [2.5, 'tick'], [2.8, 'tick'], [3.4, 'buzz', { f: 100 }]],
};

SCENES.brick = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .16, gap: 80 });
    const SITES = [
      { n: 'x.com', e: 'X', d: .1, msg: 'NEED_LOGIN' },
      { n: 'zhihu.com', e: '知', d: .5, msg: 'BLOCKED' },
      { n: 'reddit.com', e: 'R', d: .9, msg: '403' },
    ];
    SITES.forEach((st, i) => {
      const x = 130 + i * 570, y = 150, w = 520, h = 640;
      c.save();
      c.globalAlpha *= ss(st.d - .3, st.d, s);
      win(c, x, y, w, h, { title: st.n, color: rgba(C.gray, .8) });
      c.restore();
      // 站点内容被砖墙盖住
      const p = ss(st.d, st.d + .75, s);
      c.save();
      c.beginPath(); c.rect(x + 2, y + 44, w - 4, (h - 46) * p); c.clip();
      c.font = F(30); c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let r = 0; r < 12; r++) {
        const off = (r % 2) * 32;
        for (let k = 0; k < 7; k++) {
          const bx = x + 10 + k * 76 + off, by = y + 50 + r * 40;
          if (bx > x + w - 20) continue;
          const flash = clamp((s - st.d - (r + k) * .03) * 6);
          if (flash <= 0) continue;
          c.fillStyle = rgba(C.red, .10 + flash * .16);
          c.fillRect(bx, by, 68, 34);
          c.strokeStyle = rgba(C.red, .5 * flash); c.lineWidth = 1.5;
          c.strokeRect(bx, by, 68, 34);
        }
      }
      c.restore();
      // 错误标识
      const ap = ss(st.d + .55, st.d + .8, s);
      if (ap > 0) {
        c.save(); c.globalAlpha *= ap;
        c.fillStyle = 'rgba(8,2,4,.9)'; c.fillRect(x + 60, y + 250, w - 120, 90);
        c.strokeStyle = C.red; c.lineWidth = 3; c.strokeRect(x + 60, y + 250, w - 120, 90);
        mt(c, '✗ ' + st.msg, x + 100, y + 296, 24, { color: C.red, weight: 700, glow: 14 });
        c.restore();
      }
    });
    shake(c, 10 * (1 - clamp((s - .9) / .5)), Math.floor(s * 60));
  },
  sfx: [[0.1, 'impact', { g: .4, f: 140 }], [0.5, 'impact', { g: .5, f: 120 }], [0.9, 'impact', { g: .55, f: 110 }],
  [1.0, 'buzz', { f: 90 }], [1.6, 'buzz', { f: 80 }], [2.1, 'buzz', { f: 70 }]],
};

SCENES.flood = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 80, col: C.red });
    win(c, 560, 120, 800, 760, { title: 'context window', color: rgba(C.gray, .8) });
    // 灌进来的 HTML
    const fill = clamp((s - .3) / 2.6);
    const lines = Math.floor(fill * 34);
    c.save();
    c.beginPath(); c.rect(562, 166, 796, 712 * fill); c.clip();
    for (let i = 0; i < lines; i++) {
      const yy = 190 + i * 21;
      const str = i < 3 ? pick(['<!DOCTYPE html><html><head>', '<meta charset="utf-8">', '<script id="__NEXT_DATA__">'], i)
        : pick(['<div class="feed-item"><a href="/p/', '<span class="rank">', '<script>window.__INITIAL_STATE__=', 'data-v-3f2a1b9c', '{"comment_id":', '<svg viewBox="0 0 24 24">'], i * 7 + Math.floor(s / 2));
      mt(c, str + '…', 586, yy, 9, { color: rgba(C.text, .5) });
    }
    c.restore();
    // 溢出
    if (s > 2.6) {
      const e = ss(2.6, 3.3, s);
      c.save();
      c.globalAlpha *= e;
      c.fillStyle = 'rgba(30,4,8,.94)'; c.fillRect(562, 600, 796, 180);
      c.strokeStyle = C.red; c.lineWidth = 3; c.strokeRect(562, 600, 796, 180);
      mt(c, '✗ CONTEXT_OVERFLOW', 596, 660, 26, { color: C.red, weight: 700, glow: 20 });
      mt(c, '已用 128,000 / 128,000 tokens', 596, 712, 15, { color: C.gray });
      c.restore();
    }
    bar(c, 596, 840, 730, 14, fill, { color: fill >= 1 ? C.red : C.green, track: C.gray });
    shake(c, 16 * (s > 2.6 ? 1 - clamp((s - 2.6) / .5) : 0), Math.floor(s * 70));
  },
  sfx: [[0.3, 'whoosh', { f0: 200, f1: 900, d: 2.2, g: .1 }], [2.6, 'buzz', { f: 60, d: .5, g: .35 }],
  [2.65, 'glitch']],
};

SCENES.sorry = {
  draw(c, s) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const dim = 1 - ss(2.4, 3.2, s) * .55;
    c.save();
    c.globalAlpha = dim;
    win(c, 460, 330, 1000, 260, { title: 'agent', color: rgba(C.gray, .7) });
    const ap = ss(.2, 1.4, s);
    c.globalAlpha *= ap;
    mt(c, '抱歉，我访问不了这些网站。', 510, 470, 20, { color: rgba(C.gray, .95), fade: 40 });
    c.restore();
    if (s > 2.4) {
      c.save();
      c.globalAlpha *= ss(2.5, 3.2, s);
      mt(c, '……', 510, 530, 18, { color: rgba(C.gray, .4) });
      c.restore();
    }
    rainField(c, s, { cell: 40, alpha: .05, col: C.gray });
  },
  sfx: [[0.2, 'blip', { f: 420, d: .1, g: .1 }], [0.5, 'blip', { f: 400, d: .1, g: .08 }],
  [2.4, 'buzz', { f: 55, d: .6, g: .3 }]],
};

SCENES.behind = {
  draw(c, s) {
    const zoom = lerp(1.55, 1.0, easeOut(ss(.1, 2.4, s)));
    bgGrid(c, s, { alpha: .16, gap: 80 });
    c.save();
    c.translate(W / 2, 470); c.scale(zoom, zoom); c.translate(-W / 2, -470);
    // 挡住 AI 的墙（前景，暗）
    c.fillStyle = 'rgba(10,6,8,.5)';
    c.fillRect(-400, 780, W + 800, 500);
    // 后面亮着的浏览器
    const bx = 380, by = 120, bw = 1160, bh = 640;
    c.save();
    c.shadowColor = rgba(C.green, .5); c.shadowBlur = 70;
    panel(c, bx, by, bw, bh, { color: rgba(C.green, .55), fill: 'rgba(4,14,10,.96)', lw: 3 });
    c.restore();
    // 标签栏
    const TABS = ['x.com', 'reddit.com', 'zhihu.com', 'bilibili.com', 'v2ex.com', 'news.ycombinator.com'];
    TABS.forEach((tb, i) => {
      const tx0 = bx + 24 + i * 188;
      const lit = ss(.5 + i * .12, .8 + i * .12, s);
      c.save();
      c.fillStyle = rgba(C.green, .06 + lit * .12);
      c.fillRect(tx0, by + 14, 178, 46);
      c.fillStyle = rgba(C.green, .2 + lit * .5);
      c.fillRect(tx0, by + 58, 178 * lit, 2);
      mt(c, tb.length > 12 ? tb.slice(0, 11) + '…' : tb, tx0 + 12, by + 38, 10.5, { color: rgba(lit > .5 ? C.greenL : C.gray, .9) });
      // 绿点 = 已登录
      c.globalAlpha *= lit;
      c.fillStyle = C.green; c.shadowColor = C.green; c.shadowBlur = 12;
      c.beginPath(); c.arc(tx0 + 164, by + 38, 5, 0, 7); c.fill();
      c.restore();
    });
    // 页面内容（模糊的亮块）
    c.save();
    c.globalAlpha = ss(1.0, 1.8, s) * .8;
    for (let i = 0; i < 22; i++) {
      const yy = by + 100 + i * 22;
      c.fillStyle = rgba(C.green, .06 + rnd(i) * .1);
      c.fillRect(bx + 40, yy, 500 + rnd(i * 3) * 560, 9);
    }
    c.restore();
    c.restore();

    // AI 的窗口（前面，被墙挡住，暗）
    c.save();
    c.globalAlpha *= .55;
    win(c, 700, 640, 540, 230, { title: 'AI agent', color: rgba(C.gray, .5) });
    mt(c, '✗ 访问不了', 740, 760, 16, { color: rgba(C.red, .8) });
    c.restore();

    // "你明明登录着" 标注
    const ap = ss(2.0, 2.6, s);
    c.save(); c.globalAlpha *= ap;
    c.strokeStyle = rgba(C.green, .8); c.lineWidth = 2;
    c.setLineDash([8, 8]);
    c.beginPath(); c.moveTo(960, 320); c.lineTo(960, 260); c.stroke();
    c.setLineDash([]);
    mt(c, '← 全是你已登录的标签', 620, 240, 18, { color: C.greenL, glow: 10 });
    c.restore();
  },
  sfx: [[0.1, 'whoosh', { f0: 700, f1: 200, d: 1.8, g: .14 }],
  [1.4, 'blip', { f: 990, g: .07 }], [1.9, 'blip', { f: 1180, g: .07 }],
  [2.2, 'ding', { f: 880, g: .12 }]],
};

// ══════════════════════ 第二幕：转折 ══════════════════════

SCENES.surf = {
  draw(c, s) {
    // 镜头穿过那扇绿窗
    const p = easeInOut(ss(.2, 2.2, s));
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    c.save();
    c.translate(W / 2, H / 2); c.scale(1 + p * 2.6, 1 + p * 2.6); c.translate(-W / 2, -H / 2);
    c.globalAlpha = 1 - p * .85;
    rainField(c, s, { cell: 22, alpha: .5, col: C.green, head: C.greenL });
    c.restore();
    // 冲过去的横线
    c.save();
    c.globalAlpha = (1 - p) * .6;
    for (let i = 0; i < 60; i++) {
      const yy = rnd(i) * H;
      const xx = ((s * (900 + rnd(i) * 1400) + rnd(i + 5) * W) % (W + 700)) - 350;
      c.fillStyle = rgba(C.green, .1 + rnd(i * 2) * .3);
      c.fillRect(xx, yy, 60 + rnd(i * 3) * 220, 2);
    }
    c.restore();
    const ap = ss(1.7, 2.5, s);
    c.save();
    c.globalAlpha *= ap;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(66, 700); c.fillStyle = C.white;
    c.shadowColor = C.green; c.shadowBlur = 36;
    c.fillText('它借你的浏览器', W / 2, 460);
    c.font = F(24); c.fillStyle = C.greenL; c.shadowBlur = 12;
    c.fillText('browser as a tool, not a wall', W / 2, 528);
    c.restore();
    if (p > .3) {
      c.fillStyle = rgba(C.greenL, (1 - p) * .18);
      c.fillRect(0, 0, W, H);
    }
  },
  sfx: [[0.2, 'whoosh', { f0: 180, f1: 5200, d: 1.6, g: .22 }], [1.75, 'impact', { g: .5, f: 70 }]],
};

SCENES.six = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .2, gap: 76 });
    const cx = W / 2, cy = 470, R = 320;
    const SITES = [
      { n: 'x.com', e: 'X' }, { n: 'reddit.com', e: 'R' }, { n: 'Hacker News', e: 'Y' },
      { n: '知乎', e: '知' }, { n: 'B 站', e: 'B' }, { n: 'V2EX', e: 'V' },
    ];
    // 中心：AI
    const ap = ss(.1, .7, s);
    c.save();
    c.globalAlpha *= ap;
    c.strokeStyle = rgba(C.green, .35); c.lineWidth = 2;
    c.beginPath(); c.arc(cx, cy, 132, 0, 7); c.stroke();
    c.beginPath(); c.arc(cx, cy, 108, 0, 7); c.stroke();
    c.font = F(26, 700); c.fillStyle = C.white; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = C.green; c.shadowBlur = 22;
    c.fillText('AI agent', cx, cy - 10);
    c.font = F(15); c.fillStyle = C.greenL; c.shadowBlur = 0;
    c.fillText('Promise.allSettled', cx, cy + 26);
    c.restore();

    SITES.forEach((st, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 3;
      const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * .78;
      const lit = ss(.35 + i * .16, .7 + i * .16, s);
      // 连线
      if (lit > 0) {
        c.save();
        c.setLineDash([10, 12]); c.lineDashOffset = -s * 90;
        c.strokeStyle = rgba(C.green, .35 * lit); c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(x, y); c.lineTo(cx, cy); c.stroke();
        c.restore();
        // 飞回的包
        for (let k = 0; k < 3; k++) {
          const ph = ((s * .9 + k / 3 + i * .17) % 1);
          if (ph > lit) continue;
          const px = lerp(x, cx, ph), py = lerp(y, cy, ph);
          c.fillStyle = rgba(C.greenL, .9 * (1 - ph * .5));
          c.fillRect(px - 3, py - 3, 6, 6);
        }
      }
      c.save();
      c.globalAlpha *= ss(.25 + i * .1, .5 + i * .1, s);
      const r = 58;
      c.strokeStyle = rgba(lit > .5 ? C.green : C.gray, .8); c.lineWidth = 2.5;
      if (lit > .5) { c.shadowColor = C.green; c.shadowBlur = 24 * lit; }
      c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
      c.shadowBlur = 0;
      c.fillStyle = rgba(C.green, .06 + lit * .1); c.fill();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = FC(30, 700); c.fillStyle = lit > .5 ? C.greenL : C.gray;
      c.fillText(st.e, x, y - 4);
      c.font = FC(14); c.fillStyle = rgba(C.text, .8);
      c.fillText(st.n, x, y + 30);
      c.restore();
    });
    // 状态
    c.save();
    c.globalAlpha *= ss(1.6, 2.2, s);
    mt(c, '✓ 6/6 来源返回   ·   ✓ 一处失败不影响其他', W / 2 - 270, 806, 17, { color: C.greenL });
    c.restore();
  },
  sfx: [[0.3, 'rise', { f0: 330, f1: 880, d: .6, g: .1 }],
  ...[0, 1, 2, 3, 4, 5].map(i => [.4 + i * .17, 'blip', { f: 660 + i * 130, g: .13 }]),
  [1.75, 'ding', { f: 990, g: .12 }]],
};

SCENES.report = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .16, gap: 80 });
    const px = 250, py = 110, pw = 1420, ph = 730;
    const ap = ss(.05, .7, s);
    c.save();
    c.globalAlpha *= ap;
    win(c, px, py, pw, ph, { title: 'research report.md', color: rgba(C.green, .7) });
    const L = [
      { t: '# 新模型到底行不行：六站交叉调研', c: C.white, w: 700 },
      { t: '' },
      { t: '## 一句话结论', c: C.green, w: 600 },
      { t: '能用在生产，但别信跑分。推理类任务实测提升明显，', c: C.text },
      { t: '长上下文检索基本没变。', c: C.text },
      { t: '' },
      { t: '## 哪儿在夸  ·  4 处', c: C.green, w: 600 },
      { t: '  [1] HN 评论区：「两周没睡好，值」           ↗ hn?id=4128', c: C.text },
      { t: '  [2] 知乎高赞：「第一次见模型自己会停」     ↗ zhihu?q=658', c: C.text },
      { t: '' },
      { t: '## 哪儿在骂  ·  3 处', c: C.red, w: 600 },
      { t: '  [3] r/LocalLLaMA：「跑分是挑过的」        ↗ reddit?id=9f2', c: C.text },
      { t: '' },
      { t: '## 跑分和实测哪里对不上', c: C.yellow, w: 600 },
      { t: '  官方 longbench 92.4 → 网友独立复测 71.0   ↗ arxiv?2409', c: C.text },
    ];
    outLines(c, px + 40, py + 74, 13.2, 40, L, s, .5, .16, {});
    c.restore();
    // 出处徽章
    c.save();
    c.globalAlpha *= ss(2.4, 3.0, s);
    ['HN', '知乎', 'Reddit', 'B 站', 'arXiv', 'X'].forEach((b, i) => {
      const bx = 250 + i * 214, by = 862;
      c.strokeStyle = rgba(C.green, .45); c.lineWidth = 1.5;
      c.strokeRect(bx, by, 190, 44);
      c.fillStyle = rgba(C.green, .08); c.fillRect(bx, by, 190, 44);
      mt(c, '✓ ' + b, bx + 54, by + 23, 15, { color: C.greenL });
    });
    c.restore();
  },
  sfx: [[0.1, 'whoosh', { f0: 500, f1: 1800, d: .5, g: .12 }],
  [.6, 'blip', { f: 700, g: .06 }], [1.1, 'blip', { f: 820, g: .06 }], [1.7, 'blip', { f: 940, g: .06 }],
  [2.5, 'ding', { f: 880, g: .14 }]],
};

SCENES.scenes = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .18, gap: 80 });
    const CASES = [
      { q: '全挂了，是不是云服务出事了', a: 'statuspage + HN + 供应商公告', t: 0 },
      { q: '这台新手机口碑怎么样', a: '知乎 + B 站 + 小红书 + Reddit', t: 1 },
      { q: '这票今天为什么涨停', a: '东财快讯 + 公告 + 雪球讨论', t: 2 },
    ];
    CASES.forEach((cs, i) => {
      const d = .1 + i * 1.4;
      const p = backOut(clamp((s - d) / .45));
      if (p <= 0) return;
      const y = 200 + i * 220;
      c.save();
      c.globalAlpha *= clamp((s - d) / .3);
      c.translate((1 - p) * -120, 0);
      // 问句
      c.font = FC(38, 700); c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillStyle = C.white; c.shadowColor = C.green; c.shadowBlur = 14;
      c.fillText('「' + cs.q + '」', 300, y);
      c.shadowBlur = 0;
      // 箭头 + 站点
      c.font = F(22); c.fillStyle = C.gray;
      c.fillText('→', 300 + measureCJK(c, '「' + cs.q + '」', 38, 700) + 26, y);
      let sx = 300 + measureCJK(c, '「' + cs.q + '」', 38, 700) + 70;
      cs.a.split(' + ').forEach((sn, k) => {
        const ap2 = ss(d + .3 + k * .12, d + .5 + k * .12, s);
        c.globalAlpha *= ap2;
        c.font = FC(22, 500); c.fillStyle = C.greenL;
        c.fillText(sn, sx, y);
        const w = measureCJK(c, sn, 22, 500);
        if (k < cs.a.split(' + ').length - 1) {
          c.fillStyle = C.gray; c.fillText(' + ', sx + w, y);
        }
        c.globalAlpha /= (ap2 || 1);
        sx += w + measureCJK(c, ' + ', 22, 500);
      });
      c.restore();
    });
  },
  sfx: [[.1, 'blip', { f: 660, g: .1 }], [1.5, 'blip', { f: 740, g: .1 }], [2.9, 'blip', { f: 830, g: .1 }],
  [3.4, 'ding', { f: 990, g: .1 }]],
};
function measureCJK(c, str, px, w) {
  c.save(); c.font = FC(px, w); const m = c.measureText(str).width; c.restore(); return m;
}

// ══════════════════════ 第三幕：rsf read ══════════════════════

SCENES.cmd = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .14, gap: 84 });
    const cmd = '$ rsf read https://www.bilibili.com/video/BV1GJ411x7h7 -b';
    win(c, 140, 280, 1640, 300, { title: 'rsf', color: rgba(C.green, .6) });
    const shown = typed(cmd, s, .15, .7);
    drawCmd(c, shown, 190, 380, 18);
    if (s > .85) {
      const bl = Math.floor(s * 2.5) % 2;
      if (bl) { c.fillStyle = C.green; c.fillRect(190, 362, 12, 34); }
      mt(c, '→ 借你自己的浏览器，后台开标签，读完关掉', 190, 460, 16, { color: C.gray });
    }
    // 大字标
    c.save();
    c.font = F(140, 700); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.globalAlpha = ss(.9, 1.4, s) * .07;
    c.fillStyle = C.green;
    c.fillText('READ', W / 2, 760);
    c.restore();
  },
  sfx: [[.15, 'key'], [.25, 'key'], [.35, 'key'], [.45, 'key'], [.55, 'key'], [.65, 'key'],
  [.8, 'enter'], [1.0, 'blip', { f: 880, g: .1 }]],
};

SCENES.squeeze = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 80 });
    const p = ss(.2, 2.2, s);
    // 原始 HTML 塌缩
    c.save();
    c.globalAlpha = 1 - p * .88;
    c.translate(W / 2, 400); c.scale(1 - p * .55, 1 - p * .55); c.translate(-W / 2, -400);
    for (let i = 0; i < 96; i++) {
      const yy = 118 + (i % 48) * 15;
      const xx = 70 + Math.floor(i / 48) * 620;
      mt(c, pick(['<div class="bili-video-card"><a href=', '<script>window.__playinfo__=', '{"code":0,"data":{"aid":', '<span class="bili-video-card__info--tit">', '<li class="video-page-card-small" data-idx='], i * 5), xx, yy, 7.5, { color: rgba(C.gray, .55) });
    }
    c.restore();

    // 漏斗
    c.save();
    c.globalAlpha = ss(.6, 1.2, s) * (1 - ss(2.4, 3, s) * .5);
    c.strokeStyle = rgba(C.green, .45); c.lineWidth = 2;
    const fx = W / 2, fy0 = 430, fy1 = 560, w0 = 620, w1 = 130;
    c.beginPath();
    c.moveTo(fx - w0 / 2, fy0); c.lineTo(fx - w1 / 2, fy1);
    c.lineTo(fx + w1 / 2, fy1); c.lineTo(fx + w0 / 2, fy0);
    c.stroke();
    c.restore();

    // 压缩计数
    c.save();
    const v = lerp(231447, 2140, easeInOut(ss(.6, 2.1, s)));
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(58, 700); c.fillStyle = C.white; c.shadowColor = C.green; c.shadowBlur = 26;
    c.globalAlpha *= ss(.3, .8, s);
    c.fillText(counter(v), W / 2, 630);
    c.font = F(16); c.fillStyle = C.gray; c.shadowBlur = 0;
    c.fillText('字符', W / 2 + 150, 640);
    c.restore();

    // 结果面板
    const ap = ss(2.0, 2.7, s);
    if (ap > 0) {
      c.save();
      c.globalAlpha *= ap;
      c.translate(0, (1 - ap) * 50);
      win(c, 260, 700, 1400, 190, { title: '# 【官方 MV】Never Gonna Give You Up - Rick Astley', color: rgba(C.green, .6) });
      mt(c, 'type: video · via: lib:bilibili.com · up: 索尼音乐中国 · 播放 107,145,243 · 评论 237,317', 300, 780, 13, { color: C.text });
      mt(c, '分段：comments（按需加载）  related（40 个）', 300, 822, 13, { color: C.cyan });
      mt(c, '✓ 该有的都在', 300, 862, 13, { color: C.greenL });
      c.restore();
    }
  },
  sfx: [[.2, 'whoosh', { f0: 2000, f1: 300, d: 1.6, g: .14 }],
  [.6, 'rise', { f0: 140, f1: 520, d: 1.4, g: .08 }],
  [2.05, 'bloop', { f: 260 }], [2.5, 'ding', { f: 760 }]],
};

SCENES.cards = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .14, gap: 84 });
    const px = 200, py = 120, pw = 1520, ph = 730;
    win(c, px, py, pw, ph, { title: 'read 输出 · bilibili.com', color: rgba(C.green, .55) });
    const L = [
      { t: '# 【官方 MV】Never Gonna Give You Up - Rick Astley', c: C.white, w: 700, tag: 1 },
      { t: 'https://www.bilibili.com/video/BV1GJ411x7h7/', c: C.blue },
      { t: 'type: video · via: lib:bilibili.com · author: 索尼音乐中国 · published: 2019-12-31 23:43', c: C.gray, tag: 2 },
      { t: '' },
      { t: 'video:', c: C.green, w: 600, tag: 3 },
      { t: '  bvid: BV1GJ411x7h7', c: C.text, tag: 3 },
      { t: '  duration: 3:33', c: C.text, tag: 3 },
      { t: '  up: 索尼音乐中国 (mid 486906719)', c: C.text, tag: 3 },
      { t: '  stat: 播放 107,145,243 · 点赞 2,951,744 · 投币 1,282,325 · 评论 237,317', c: C.text, tag: 3 },
      { t: '' },
      { t: '分段（rsf read --section <id>）：', c: C.cyan, w: 600, tag: 4 },
      { t: '  - comments: 评论（237,317 条，按热度）（按需加载）', c: C.text, tag: 4 },
      { t: '  - related:  相关推荐（40 个）', c: C.text, tag: 4 },
    ];
    outLines(c, px + 46, py + 84, 14, 42, L, s, .2, .34, {});
    // 标注块
    const NOTES = [[1, '标题', .5], [3, '来源 / 作者 / 时间', 1.2], [5, '结构化字段', 1.9], [10, '有哪些分段，怎么展开', 2.6]];
    NOTES.forEach(([li, txt, d]) => {
      const ap = ss(d, d + .45, s);
      if (ap <= 0) return;
      const y = py + 84 + li * 42;
      c.save(); c.globalAlpha *= ap * .95;
      c.strokeStyle = rgba(C.yellow, .8); c.lineWidth = 2;
      const x0 = px + pw - 300;
      c.beginPath(); c.moveTo(px + 40, y); c.lineTo(x0 - 14, y); c.stroke();
      c.textAlign = 'right'; c.font = FC(19, 600); c.fillStyle = C.yellow;
      c.fillText(txt, x0 + 260, y + 6);
      c.restore();
    });
  },
  sfx: [[.4, 'tick'], [1.0, 'tick'], [1.7, 'tick'], [2.4, 'tick'], [3.0, 'ding', { f: 880, g: .1 }]],
};

SCENES.grep = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    const cmd = '$ rsf read https://example.com/post --grep "思考模式|测试集|延迟"';
    win(c, 120, 96, 1680, 780, { title: 'rsf read --grep', color: rgba(C.green, .55) });
    drawCmd(c, typed(cmd, s, .1, .55), 168, 168, 15);
    // 全文缩略带
    const ap = ss(.5, 1.0, s);
    c.save();
    c.globalAlpha *= ap;
    const bx = 168, by = 236, bw = 1584;
    for (let i = 0; i < 150; i++) {
      const xx = bx + i * (bw / 150);
      const hit = [22, 61, 97].some(k => Math.abs(i - k) < 3);
      c.fillStyle = hit ? rgba(C.green, .9) : rgba(C.gray, .3);
      c.fillRect(xx, by, bw / 150 * .7, hit ? 24 : 14);
    }
    c.font = F(14); c.fillStyle = C.gray; c.textAlign = 'center';
    c.fillText('全文 231,447 字符', bx + bw / 2, by + 52);
    c.restore();

    // 命中块
    const BLOCKS = [
      { at: '〔@6831〕', txt: '…作者提到自己开了「思考模式」，把延迟从 3.2 秒压到 1.1 秒，测试集上反而涨了 2 个点…', d: 1.2 },
      { at: '〔@15902〕', txt: '…官方给的测试集是挑过的，社区复测的数字要低一截，这点值得注意…', d: 1.9 },
      { at: '〔@21477〕', txt: '…延迟是这代最明显的改善，尤其是长上下文的时候…', d: 2.6 },
    ];
    BLOCKS.forEach((b, i) => {
      const ap2 = ss(b.d, b.d + .45, s);
      if (ap2 <= 0) return;
      const y = 330 + i * 176;
      c.save();
      c.globalAlpha *= ap2;
      c.translate((1 - ap2) * -40, 0);
      c.fillStyle = rgba(C.green, .05); c.fillRect(168, y - 34, 1584, 148);
      c.fillStyle = rgba(C.green, .6); c.fillRect(168, y - 34, 3, 148);
      mt(c, b.at, 200, y, 14, { color: C.green, weight: 600 });
      // 正文按格宽折行
      wrapCJK(c, b.txt, 200, y + 40, 14.5, 1500, C.text);
      c.restore();
    });
    c.save();
    c.globalAlpha *= ss(2.9, 3.4, s);
    mt(c, '✓ 3 处命中，其余 228,000 字符没进上下文', 168, 822, 15, { color: C.greenL });
    c.restore();
  },
  sfx: [[.1, 'whoosh', { f0: 900, f1: 2600, d: .4, g: .1 }],
  [.3, 'key'], [.4, 'key'], [.5, 'key'], [.6, 'key'], [.7, 'key'],
  [1.2, 'blip', { f: 1180, g: .11 }], [1.9, 'blip', { f: 1320, g: .11 }], [2.6, 'blip', { f: 1480, g: .11 }],
  [3.1, 'ding', { f: 990, g: .1 }]],
};

// 按格宽自动折行
function wrapCJK(c, str, x, y, cell, maxw, color) {
  c.save(); c.font = FC(cell / .58, 500); c.textAlign = 'left'; c.textBaseline = 'middle';
  let line = '', lw = 0, ly = y;
  for (const ch of str) {
    const w = c.measureText(ch).width;
    if (lw + w > maxw) { c.fillStyle = color; c.fillText(line, x, ly); line = ''; lw = 0; ly += cell * 1.9; }
    line += ch; lw += w;
  }
  if (line) { c.fillStyle = color; c.fillText(line, x, ly); }
  c.restore();
  return ly;
}

SCENES.offset = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    win(c, 140, 110, 1640, 560, { title: 'rsf read --offset', color: rgba(C.green, .55) });
    // 文本带子横向滑动
    const slide = easeInOut(ss(.4, 2.4, s)) * 900;
    c.save();
    c.beginPath(); c.rect(180, 190, 1560, 420); c.clip();
    for (let i = 0; i < 8; i++) {
      const yy = 220 + i * 46;
      const xx = 200 - slide;
      mt(c, fitLeft('…' + '正文内容正文内容正文内容正文内容正文内容正文内容正文内容正文内容', 90), xx, yy, 11, { color: rgba(C.gray, .45) });
    }
    c.restore();
    // 定位标记
    const ap = ss(1.0, 1.5, s);
    c.save();
    c.globalAlpha *= ap;
    const mx = lerp(1400, 700, easeOut(ss(1.0, 2.2, s)));
    c.strokeStyle = C.green; c.lineWidth = 2; c.setLineDash([6, 6]); c.lineDashOffset = -s * 40;
    c.beginPath(); c.moveTo(mx, 200); c.lineTo(mx, 600); c.stroke();
    c.setLineDash([]);
    c.fillStyle = rgba(C.green, .12); c.fillRect(mx - 4, 200, 8, 400);
    mt(c, '〔@6831〕', mx + 16, 190, 16, { color: C.green, weight: 700, glow: 12 });
    c.restore();
    // 命令
    const ap2 = ss(2.0, 2.5, s);
    c.save();
    c.globalAlpha *= ap2;
    win(c, 140, 690, 1640, 190, { title: '接着往下读', color: rgba(C.green, .5) });
    drawCmd(c, '$ rsf read -t t5 --offset 6831', 190, 770, 17);
    mt(c, '↑ 从这里继续，不用重新读全文', 190, 832, 15, { color: C.gray });
    c.restore();
  },
  sfx: [[.4, 'whoosh', { f0: 1600, f1: 400, d: 1.6, g: .1 }],
  [1.0, 'blip', { f: 1320, g: .12 }], [2.1, 'enter'], [2.4, 'bloop', { f: 330 }]],
};
function fitLeft(s, n) { let o = '', w = 0; for (const ch of s) { const k = cw(ch); if (w + k > n) break; o += ch; w += k; } return o; }

SCENES.libhint = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .14, gap: 84 });
    const lift = easeInOut(ss(1.2, 3.4, s));
    c.save();
    c.translate(0, -lift * 26);
    win(c, 120, 74, 1680, 640, { title: 'rsf read 输出末尾 · bilibili.com', color: rgba(C.green, .6) });
    // 上面几行：不是重点
    const L = [
      { t: '分段（rsf read --section <id>）：', c: C.cyan },
      { t: '  - comments: 评论（237,317 条，按热度）（按需加载）', c: C.text },
      { t: '  - related:  相关推荐（40 个）', c: C.text },
    ];
    c.save();
    c.globalAlpha *= 1 - lift * .45;
    outLines(c, 168, 156, 13, 42, L, s, .1, .25, {});
    c.restore();

    // 高亮区
    const hp = ss(1.2, 1.8, s);
    if (hp > 0) {
      c.save();
      c.globalAlpha *= hp;
      const hy = 288, hh = 372;
      c.fillStyle = rgba(C.green, .07); c.fillRect(148, hy, 1624, hh);
      c.fillStyle = rgba(C.green, .85); c.fillRect(148, hy, 4, hh);
      c.strokeStyle = rgba(C.green, .55); c.lineWidth = 2;
      c.strokeRect(148, hy, 1624, hh);
      c.restore();

      mt(c, '这个网站有函数库 bilibili.com（rsf call bilibili.com <函数> [参数]）：', 176, hy + 44, 14, { color: C.green, weight: 600, glow: 14 });

      const FNS = [
        ['search', 'search(keyword, { limit = 20, type = \'video\', order = \'totalrank\' } = {})', '搜索视频'],
        ['comments', 'comments(id, { limit = 50, sort = \'hot\' } = {})', '评论。sort：hot / time'],
        ['subtitles', 'subtitles(id, { lang = \'\', text = false } = {})', '字幕，按时间一句一行'],
        ['summary', 'summary(id)', 'B 站官方 AI 视频总结'],
      ];
      const COL = 88;   // 注释列（格）
      FNS.forEach(([name, sig, note], i) => {
        const ap = ss(1.7 + i * .22, 2.1 + i * .22, s);
        if (ap <= 0) return;
        const y = hy + 104 + i * 52;
        c.save();
        c.globalAlpha *= ap;
        c.translate((1 - ap) * -30, 0);
        mt(c, fit(sig, COL - 4), 176, y, 12.5, { color: C.cyan });
        mt(c, '— ' + note, 176 + COL * 12.5, y, 12.5, { color: C.gray });
        c.restore();
      });
      const ap5 = ss(2.7, 3.1, s);
      c.save(); c.globalAlpha *= ap5;
      mt(c, '… 共 17 个函数', 176, hy + 104 + 4 * 52, 12.5, { color: C.gray });
      c.restore();
    }
    c.restore();

    // 强调框
    if (s > 2.8) {
      const ap = ss(2.8, 3.2, s) * (1 - ss(4.8, 5.3, s) * .5);
      c.save();
      c.globalAlpha *= ap;
      c.strokeStyle = C.green; c.lineWidth = 3; c.shadowColor = C.green; c.shadowBlur = 28;
      c.strokeRect(140, 282, 1640, 384);
      c.restore();
    }
    // 底部结论
    c.save();
    c.globalAlpha *= ss(3.0, 3.6, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(20); c.fillStyle = C.gray;
    c.fillText('rsf read 的末尾，就是这个网站的函数清单', W / 2, 762);
    c.font = FC(40, 700); c.fillStyle = C.white;
    c.shadowColor = C.green; c.shadowBlur = 22;
    c.fillText('下一步能干什么，写好了放在你手里', W / 2, 826);
    c.restore();
  },
  sfx: [[.1, 'whoosh', { f0: 400, f1: 1400, d: .4, g: .1 }],
  [1.5, 'rise', { f0: 330, f1: 660, d: .8, g: .08 }],
  [1.9, 'blip', { f: 880, g: .12 }], [2.12, 'blip', { f: 990, g: .12 }],
  [2.34, 'blip', { f: 1100, g: .12 }], [2.56, 'blip', { f: 1240, g: .12 }],
  [3.0, 'ding', { f: 1320, g: .16 }], [3.05, 'impact', { g: .3, f: 180 }]],
};

SCENES.noguess = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .14, gap: 84 });
    const p = ss(0, .9, s);
    // 大问号淡出
    c.save();
    c.globalAlpha *= (1 - p);
    c.translate(W / 2, 460); c.scale(1 + p * .4, 1 + p * .4); c.translate(-W / 2, -460);
    c.font = F(300, 700); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = rgba(C.gray, .25);
    c.fillText('?', W / 2, 460);
    c.restore();
    // 被函数列表取代
    const ap = ss(.4, 1.1, s);
    c.save();
    c.globalAlpha *= ap;
    ['search', 'comments', 'subtitles', 'summary', 'rank', 'user', 'video', 'subtitle'].forEach((f, i) => {
      const a2 = ss(.5 + i * .07, .8 + i * .07, s);
      c.save();
      c.globalAlpha *= a2;
      const x = 320 + (i % 4) * 320, y = 340 + Math.floor(i / 4) * 150;
      c.strokeStyle = rgba(C.cyan, .55); c.lineWidth = 2;
      c.strokeRect(x, y, 280, 110);
      c.fillStyle = rgba(C.cyan, .07); c.fillRect(x, y, 280, 110);
      mt(c, f + '()', x + 24, y + 55, 16, { color: C.cyan });
      c.restore();
    });
    c.restore();
    c.save();
    c.globalAlpha *= ss(1.4, 1.9, s);
    mt(c, '✓ 下一页能干什么，输出里写着', 320, 730, 20, { color: C.greenL, glow: 10 });
    c.restore();
  },
  sfx: [[.05, 'buzz', { f: 140, g: .3 }], [.45, 'rise', { f0: 200, f1: 900, d: .5, g: .1 }],
  ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => [.5 + i * .07, 'tick', { f: 900 + i * 80 }]),
  [1.5, 'ding', { f: 990, g: .12 }]],
};
