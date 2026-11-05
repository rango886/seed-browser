// ── 场景 B：lib / 管道 / 跨站调研 / 原理 / 收尾 ──

// ══════════════════════ 第四幕：lib ══════════════════════

SCENES.tree = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    win(c, 200, 100, 800, 720, { title: '~/.rsf/lib/', color: rgba(C.green, .55) });
    const FILES = ['bilibili.com.js', 'zhihu.com.js', 'reddit.com.js', 'x.com.js', 'eastmoney.com.js',
      'arxiv.org.js', 'gov.cn.js', 'news.ycombinator.com.js', 'xueqiu.com.js'];
    const L = [{ t: 'lib/', c: C.cyan }];
    FILES.forEach(f => L.push({ t: '├── ' + f, c: C.text }));
    L.push({ t: '└── … 共 52 个站点', c: C.gray });
    outLines(c, 250, 190, 14, 46, L, s, .1, .1, {});

    // 右边拉开一个文件
    const ap = ss(1.2, 1.9, s);
    if (ap > 0) {
      c.save();
      c.globalAlpha *= ap;
      c.translate((1 - ap) * 90, 0);
      win(c, 1030, 100, 700, 720, { title: 'bilibili.com.js', color: rgba(C.cyan, .6) });
      const CODE = [
        { t: '/* 站点笔记（B 站）：评论接口的 oid 要用', c: C.greenD },
        { t: '   aid，不是 bvid。翻页要停 300ms。 */', c: C.greenD },
        { t: '', c: C.text },
        { t: '/** 视频评论。sort：hot 热门 / time 最新', c: C.greenD },
        { t: ' *  @example comments(\'BV1GJ411x7h7\', { limit: 20 }) */', c: C.greenD },
        { t: 'export async function comments(id, { limit = 50,', c: C.cyan },
        { t: '                                  sort = \'hot\' } = {}) {', c: C.cyan },
        { t: '  const tab = await rsf.tab(\'bilibili.com\')', c: C.text },
        { t: '  const v = await tab.fetch(', c: C.text },
        { t: '    `.../view?bvid=${id}`)', c: C.yellow },
        { t: '  ...', c: C.gray },
        { t: '  await rsf.sleep(300)   // 不被风控', c: C.gray },
        { t: '}', c: C.cyan },
      ];
      outLines(c, 1070, 178, 12, 38, CODE, s, 1.4, .12, {});
      c.restore();
    }
  },
  sfx: [[.1, 'blip', { f: 700, g: .07 }], [1.25, 'whoosh', { f0: 500, f1: 1600, d: .4, g: .1 }],
  [1.5, 'tick'], [1.7, 'tick'], [1.9, 'ding', { f: 880, g: .1 }]],
};

SCENES.sig = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    const ap = ss(.05, .6, s);
    c.save();
    c.globalAlpha *= ap;
    win(c, 150, 200, 1620, 300, { title: '函数签名', color: rgba(C.cyan, .55) });
    const parts = [
      ['export async function ', C.purple, '导出'],
      ['comments', C.cyan, '函数名'],
      ['(', C.text, ''],
      ['id', C.yellow, '字符串 ID'],
      [', { ', C.text, ''],
      ['limit', C.yellow, '数字'],
      [' = ', C.text, ''],
      ['50', C.orange, '默认值'],
      [', ', C.text, ''],
      ['sort', C.yellow, '枚举'],
      [' = ', C.text, ''],
      ['\'hot\'', C.greenL, '可选值'],
      [' } = {})', C.text, ''],
    ];
    let x = 200, y = 320;
    const cell = 19;
    parts.forEach(([str, col]) => {
      mt(c, str, x, y, cell, { color: col, weight: 500 });
      x += tw(str) * cell;
    });
    c.restore();

    // 拆解标注
    const NOTES = [
      ['数字 / 开关，从默认值就能看出来', C.yellow, 1.6, 300, 420],
      ['不用再单独声明 args 和 opts', C.greenL, 2.3, 380, 490],
      ['帮助信息就是从这行生成的', C.cyan, 3.0, 900, 420],
    ];
    NOTES.forEach(([t, col, d, nx, ny]) => {
      const a = ss(d, d + .4, s);
      if (a <= 0) return;
      c.save();
      c.globalAlpha *= a;
      c.strokeStyle = rgba(col, .7); c.lineWidth = 2; c.setLineDash([5, 5]);
      c.beginPath(); c.moveTo(nx + 300, ny - 40); c.lineTo(nx + 300, y - 20); c.stroke();
      c.setLineDash([]);
      c.font = FC(20, 600); c.fillStyle = col; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(t, nx, ny);
      c.restore();
    });

    // 底部：帮助信息
    const ap2 = ss(3.3, 3.9, s);
    c.save();
    c.globalAlpha *= ap2;
    win(c, 150, 590, 1620, 260, { title: 'rsf lib list bilibili.com  →  comments', color: rgba(C.green, .45) });
    mt(c, 'comments(id, { limit = 50, sort = \'hot\' } = {})  — 视频评论。', 200, 680, 15, { color: C.text });
    mt(c, 'sort：hot 热门 / time 最新', 200, 720, 15, { color: C.gray });
    mt(c, '@example comments(\'BV1GJ411x7h7\', { limit: 20 })', 200, 766, 15, { color: C.greenL });
    c.restore();
  },
  sfx: [[.1, 'whoosh', { f0: 400, f1: 1200, d: .4, g: .1 }],
  [1.6, 'blip', { f: 780, g: .12 }], [2.3, 'blip', { f: 940, g: .12 }], [3.0, 'blip', { f: 1120, g: .12 }],
  [3.4, 'ding', { f: 880, g: .12 }]],
};

SCENES.test = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    win(c, 140, 90, 1100, 760, { title: 'rsf lib test bilibili.com', color: rgba(C.green, .55) });
    drawCmd(c, typed('$ rsf lib test bilibili.com', s, .1, .5), 190, 170, 16);
    const FNS = ['search', 'comments', 'subtitles', 'summary', 'rank', 'user', 'video', 'dynamic',
      'favorite', 'history', 'follow', 'download', 'related', 'hot', 'popular', 'playurl', 'aid'];
    FNS.forEach((f, i) => {
      const d = .7 + i * .17;
      if (s < d) return;
      const ok = true;
      const y = 240 + i * 33;
      mt(c, '  ' + (ok ? '✓' : '✗'), 210, y, 14, { color: C.green, weight: 700 });
      mt(c, f, 210 + 3 * 14, y, 14, { color: C.text });
      mt(c, 'passed', 210 + 46 * 14, y, 14, { color: rgba(C.green, .55) });
      const a = clamp((s - d) * 5);
      c.save();
      c.globalAlpha *= a;
      c.strokeStyle = rgba(C.green, .5); c.lineWidth = 2;
      c.beginPath(); c.moveTo(210 + 25 * 14, y); c.lineTo(210 + 25 * 14 + 30 * a, y); c.stroke();
      c.restore();
    });
    // 总结
    const ap = ss(.7 + 17 * .17, .7 + 17 * .17 + .4, s);
    c.save();
    c.globalAlpha *= ap;
    win(c, 1290, 90, 490, 300, { title: '结果', color: rgba(C.green, .55) });
    c.font = F(70, 700); c.fillStyle = C.green; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = C.green; c.shadowBlur = 30;
    c.fillText('17', 1535, 210);
    c.font = F(22); c.fillStyle = C.greenL; c.shadowBlur = 0;
    c.fillText('passed', 1535, 268);
    c.font = F(15); c.fillStyle = C.gray;
    c.fillText('0 failed', 1535, 320);
    c.restore();
    // 底部说明
    c.save();
    c.globalAlpha *= ss(1.2, 1.7, s);
    win(c, 1290, 430, 490, 420, { title: '@example 是真跑的', color: rgba(C.gray, .5) });
    const L = [
      { t: '/** 视频评论', c: C.greenD },
      { t: ' *  @example comments(…, { limit: 20 }) */', c: C.greenD },
      { t: '', c: C.text },
      { t: '不能自动跑的加 @test skip，', c: C.text },
      { t: '要文件的加 @test file，', c: C.text },
      { t: '发帖删除这类不能自动跑。', c: C.text },
    ];
    outLines(c, 1330, 520, 12, 38, L, s, 1.5, .18, {});
    c.restore();
  },
  sfx: [[.1, 'enter'], [.7, 'ding', { f: 1320, g: .07 }],
  ...Array.from({ length: 17 }, (_, i) => [.7 + i * .17, 'tick', { f: 1400 + (i % 5) * 120 }]),
  [3.6, 'ding', { f: 660, g: .16 }], [3.65, 'impact', { g: .25, f: 200 }]],
};

SCENES.rot = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    const phase = s < 2.2 ? 0 : s < 4.0 ? 1 : 2;
    const col = phase === 0 ? C.green : phase === 1 ? C.red : C.green;
    win(c, 140, 110, 1100, 640, { title: 'rsf lib test bilibili.com', color: rgba(col, .55) });
    const FNS = [['search', 1], ['comments', phase === 1 ? 0 : 1], ['subtitles', 1], ['rank', 1], ['user', 1]];
    drawCmd(c, '$ rsf lib test bilibili.com', 190, 190, 16);
    FNS.forEach(([f, ok], i) => {
      const y = 270 + i * 46;
      mt(c, ok ? '✓' : '✗', 210, y, 16, { color: ok ? C.green : C.red, weight: 700 });
      mt(c, f, 210 + 3 * 16, y, 16, { color: C.text });
      if (!ok) {
        mt(c, '✗ [CHANGED] 接口结构变了', 210 + 23 * 16, y, 14, { color: C.red });
      } else {
        mt(c, 'passed', 210 + 23 * 16, y, 14, { color: rgba(C.green, .5) });
      }
    });
    // 错误块
    if (phase === 1) {
      const a = ss(2.2, 2.5, s);
      c.save();
      c.globalAlpha *= a;
      c.fillStyle = 'rgba(24,4,8,.9)'; c.fillRect(200, 520, 980, 180);
      c.strokeStyle = C.red; c.lineWidth = 2; c.strokeRect(200, 520, 980, 180);
      mt(c, '✗ [CHANGED] 评论接口返回结构变了', 230, 570, 15, { color: C.red });
      mt(c, '→ 用 rsf read 或 rsf run 现场取数，再修这个函数', 230, 620, 15, { color: C.gray });
      mt(c, '→ agent 现在就去修了', 230, 665, 15, { color: C.yellow });
      c.restore();
      shake(c, 10 * a, Math.floor(s * 60));
    }
    // agent 修复动作
    if (phase >= 1) {
      const ap = ss(2.9, 3.3, s);
      c.save();
      c.globalAlpha *= ap;
      win(c, 1290, 110, 490, 640, { title: 'agent 现场修', color: rgba(C.yellow, .5) });
      const L = [
        { t: '1 · rsf eval 看页面数据', c: C.text },
        { t: '   "window.__INITIAL_STATE__"', c: C.blue },
        { t: '2 · 发现 replies 改名了', c: C.text },
        { t: '3 · 改 lib/bilibili.com.js', c: C.text },
        { t: '4 · rsf lib test 再跑一遍', c: C.text },
        { t: '', c: C.text },
        { t: '第 4 步：', c: C.gray },
        { t: '✓ comments   passed', c: C.green, w: 600 },
      ];
      outLines(c, 1330, 200, 13, 46, L, s, 2.9, .28, {});
      c.restore();
    }
    // 绿钩回来
    if (phase === 2) {
      const a = ss(4.0, 4.3, s);
      c.save();
      c.globalAlpha *= a;
      c.strokeStyle = C.green; c.lineWidth = 3; c.shadowColor = C.green; c.shadowBlur = 24;
      c.strokeRect(196, 430, 990, 70);
      c.restore();
    }
  },
  sfx: [[.1, 'enter'], [2.2, 'buzz', { f: 74, d: .4, g: .4 }], [2.25, 'glitch'],
  [2.9, 'tick'], [3.2, 'tick'], [3.5, 'tick'], [4.0, 'ding', { f: 990, g: .18 }]],
};

SCENES.codes = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    const CODES = [
      ['NEED_LOGIN', '没登录 / 登录过期', '请用户去浏览器里登录', C.red],
      ['BLOCKED', '验证码、风控、太频繁', '停一停，请用户手动过', C.orange],
      ['EMPTY', '跑通了，但没结果', '换关键词、放宽条件', C.yellow],
      ['NOT_FOUND', '帖子、用户、视频不存在', '检查参数', C.blue],
      ['CHANGED', '网站改版了', '现场取数，修函数', C.magenta],
    ];
    CODES.forEach(([code, what, next, col], i) => {
      const d = .15 + i * .42;
      const p = clamp((s - d) / .4);
      if (p <= 0) return;
      const y = 130 + i * 148;
      c.save();
      c.globalAlpha *= Math.min(1, p * 2.5);
      c.translate((1 - backOut(p)) * -70, 0);
      c.strokeStyle = rgba(col, .6); c.lineWidth = 2;
      if (p < 1) { c.shadowColor = col; c.shadowBlur = 30 * (1 - p); }
      c.strokeRect(180, y, 1560, 122);
      c.shadowBlur = 0;
      c.fillStyle = rgba(col, .06); c.fillRect(180, y, 1560, 122);
      c.fillStyle = rgba(col, .8); c.fillRect(180, y, 6, 122);
      mt(c, '✗ [' + code + ']', 220, y + 40, 18, { color: col, weight: 700 });
      c.font = FC(22, 500); c.fillStyle = C.text; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(what, 220, y + 88);
      c.font = F(18); c.fillStyle = rgba(col, .85);
      c.fillText('→ ' + next, 900, y + 62);
      c.restore();
    });
    c.save();
    c.globalAlpha *= ss(2.6, 3.1, s);
    mt(c, 'AI 看到 code，就知道下一步该干什么', 180, 880, 19, { color: C.greenL, glow: 8 });
    c.restore();
  },
  sfx: [[.15, 'blip', { f: 560, g: .12 }], [.57, 'blip', { f: 660, g: .12 }],
  [.99, 'blip', { f: 760, g: .12 }], [1.41, 'blip', { f: 880, g: .12 }], [1.83, 'blip', { f: 1020, g: .12 }],
  [2.7, 'ding', { f: 880, g: .12 }]],
};

SCENES.note = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    win(c, 260, 120, 1400, 700, { title: 'lib/xueqiu.com.js', color: rgba(C.green, .55) });
    const CODE = [
      { t: '/* 站点笔记（雪球）：', c: C.green, w: 700 },
      { t: '', c: C.text },
      { t: ' *  接口：stock.xueqiu.com/v5/stock/quote.json', c: C.greenD },
      { t: ' *  cookie 要带 xq_a_token，没登录只能取 3 条', c: C.greenD },
      { t: ' *  翻页参数 page 从 1 开始，不是 0', c: C.greenD },
      { t: ' *  K 线返回的 column 字段是自己描述自己的', c: C.greenD },
      { t: ' *  坑：连续请求超过 20 次会 400，停 500ms', c: C.orange },
      { t: ' *  "amount" 单位是元，"volume" 单位是股', c: C.greenD },
      { t: ' */', c: C.green, w: 700 },
      { t: '', c: C.text },
      { t: 'export async function quote(symbol) { … }', c: C.cyan },
    ];
    outLines(c, 320, 210, 14, 44, CODE, s, .2, .11, {});
    // 右侧：这条笔记会在 lib list 里显示
    const ap = ss(1.6, 2.2, s);
    c.save();
    c.globalAlpha *= ap;
    win(c, 260, 700, 1400, 170, { title: 'rsf lib list xueqiu.com', color: rgba(C.yellow, .5) });
    mt(c, '站点笔记  接口怎么调、哪里有坑 —— 踩过一次的坑不用再踩', 320, 780, 15, { color: C.yellow });
    mt(c, 'quote(symbol)  — 实时行情   @example quote("SH600519")', 320, 836, 15, { color: C.text });
    c.restore();
  },
  sfx: [[.2, 'whoosh', { f0: 600, f1: 1600, d: .4, g: .08 }],
  [1.6, 'blip', { f: 880, g: .1 }], [2.1, 'ding', { f: 700, g: .1 }]],
};

// ══════════════════════ 第五幕：管道 ══════════════════════

SCENES.split = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    const p = ss(.2, 1.2, s);
    // 中缝
    c.save();
    c.strokeStyle = rgba(C.gray, .3); c.lineWidth = 2;
    c.beginPath(); c.moveTo(W / 2, 130 + (1 - p) * 400); c.lineTo(W / 2, 880); c.stroke();
    c.restore();
    // 左：旧做法
    c.save();
    c.globalAlpha *= ss(.3, .9, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(26, 700); c.fillStyle = rgba(C.red, .85);
    c.fillText('工具调用', W / 4, 170);
    // 数据全进模型
    for (let i = 0; i < 26; i++) {
      const ph = ((s * .5 + i * .09) % 1);
      const x = lerp(120, W / 2 - 200, ph), y = lerp(300 + rnd(i) * 60, 420, ph);
      c.fillStyle = rgba(C.red, .45 * (1 - ph * .3));
      c.font = F(14); c.textAlign = 'left';
      c.fillText('{"text":"…原始数据…"}', x, y);
    }
    c.restore();
    // 右：管道
    c.save();
    c.globalAlpha *= ss(.6, 1.2, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(26, 700); c.fillStyle = rgba(C.green, .9);
    c.fillText('管道', W * .75, 170);
    c.restore();
    c.save();
    c.globalAlpha *= ss(.8, 1.4, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(40, 700); c.fillStyle = C.white; c.shadowColor = C.green; c.shadowBlur = 24;
    c.fillText('取数，不经过模型', W / 2, 800);
    c.restore();
  },
  sfx: [[.2, 'whoosh', { f0: 300, f1: 2000, d: .7, g: .14 }], [.9, 'impact', { g: .3, f: 150 }]],
};

SCENES.tokens = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .1, gap: 84 });
    const px = 560, py = 130, pw = 800, ph = 620;
    win(c, px, py, pw, ph, { title: 'model context', color: rgba(C.red, .6) });
    const fill = clamp((s - .3) / 2.4);
    // 灌数据
    c.save();
    c.beginPath(); c.rect(px + 2, py + 48, pw - 4, (ph - 50) * fill); c.clip();
    for (let i = 0; i < 46; i++) {
      const yy = py + 70 + i * 22;
      c.fillStyle = rgba(C.red, .05 + rnd(i) * .07);
      c.fillRect(px + 4, yy, pw - 8, 18);
      mt(c, pick(['{"text":"评论正文…","user":"u_' + i + '"}', '{"title":"帖子标题…","score":' + (i * 7 % 99) + '}', '<div class="x">原始 HTML 片段…</div>'], i), px + 20, yy + 9, 8.4, { color: rgba(C.text, .45) });
    }
    c.restore();
    // token 计数
    const tk = Math.round(340 + (128000 - 340) * easeOut(fill));
    c.save();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(58, 700); c.fillStyle = fill > .92 ? C.red : C.white;
    c.shadowColor = C.red; c.shadowBlur = 24 * fill;
    c.fillText(counter(tk), W / 2, 810);
    c.font = F(19); c.fillStyle = C.gray; c.shadowBlur = 0;
    c.fillText('tokens  /  128,000', W / 2, 856);
    c.restore();
    // 爆
    if (s > 2.7) {
      const a = ss(2.7, 3.1, s);
      c.save();
      c.globalAlpha *= a;
      c.fillStyle = 'rgba(30,3,7,.95)'; c.fillRect(0, 0, W, H);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = F(72, 700); c.fillStyle = C.red; c.shadowColor = C.red; c.shadowBlur = 40;
      c.fillText('CONTEXT OVERFLOW', W / 2, 470);
      c.font = F(24); c.fillStyle = C.gray; c.shadowBlur = 0;
      c.fillText('五份原始结果，把上下文吃干净了', W / 2, 550);
      c.restore();
      shake(c, 20 * a, Math.floor(s * 80));
    }
  },
  sfx: [[.3, 'whoosh', { f0: 200, f1: 1600, d: 2.2, g: .1 }],
  [1.0, 'tick'], [1.6, 'tick'], [2.2, 'tick'],
  [2.7, 'buzz', { f: 58, d: .5, g: .45 }], [2.72, 'impact', { g: .5, f: 70 }]],
};

SCENES.tokens2 = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .1, gap: 84 });
    win(c, 420, 120, 1080, 560, { title: 'model context', color: rgba(C.red, .7) });
    // 五个站的数据炸弹往里塞
    for (let i = 0; i < 5; i++) {
      const d = .15 + i * .34;
      const p = clamp((s - d) / .4);
      if (p <= 0) continue;
      const x = 200 + i * 340, y = 40;
      c.save();
      c.globalAlpha *= (1 - p) * .9;
      c.translate(x, lerp(y, 400, easeIn(p)));
      c.fillStyle = rgba(C.red, .7);
      c.font = F(15); c.textAlign = 'center';
      c.fillText('[' + ['HN', 'Reddit', '知乎', 'B站', 'X'][i] + '] 8,400 条', 0, 0);
      c.restore();
    }
    // 框里的内容
    const fill = clamp((s - .2) / 2.2);
    c.save();
    c.beginPath(); c.rect(422, 166, 1076, 512 * fill); c.clip();
    for (let i = 0; i < 40; i++) {
      const yy = 180 + i * 19;
      c.fillStyle = rgba(C.red, .06);
      c.fillRect(424, yy, 1072, 15);
      mt(c, '{"raw":"…原始结果…"}', 440, yy + 8, 7.5, { color: rgba(C.text, .4) });
    }
    c.restore();
    // 计数
    const tk = Math.round(3400 + (128000 - 3400) * easeOut(fill));
    c.save();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(64, 700); c.fillStyle = fill > .9 ? C.red : C.white;
    c.shadowColor = C.red; c.shadowBlur = 24 * fill;
    c.fillText(counter(tk), W / 2, 760);
    c.font = FC(22); c.fillStyle = C.gray; c.shadowBlur = 0;
    c.fillText('token 全花在数据上', W / 2, 812);
    c.restore();
  },
  sfx: [[.15, 'bloop', { f: 300 }], [.49, 'bloop', { f: 340 }], [.83, 'bloop', { f: 380 }],
  [1.17, 'bloop', { f: 420 }], [1.51, 'bloop', { f: 460 }],
  [2.5, 'buzz', { f: 66, d: .4, g: .3 }]],
};

SCENES.flow = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .1, gap: 84 });
    const pts = [{ x: 110, y: 470 }, { x: 520, y: 470 }, { x: 700, y: 380 }, { x: 1100, y: 380 }, { x: 1280, y: 470 }, { x: 1440, y: 470 }];
    c.save();
    c.strokeStyle = rgba(C.green, .1); c.lineWidth = 52; c.lineCap = 'round';
    c.beginPath(); c.moveTo(pts[0].x, 470); pts.slice(1).forEach(p => c.lineTo(p.x, p.y)); c.stroke();
    c.restore();
    flowLine(c, pts, s, { speed: 560, n: 34, color: C.cyan, lw: 2, track: .05, chars: '{}",:0123456789' });
    // 进程节点
    ['search', 'comments', 'table'].forEach((n, i) => {
      const x = [470, 890, 1520][i], y = [470, 380, 470][i];
      const ap = ss(.2 + i * .2, .5 + i * .2, s);
      c.save();
      c.globalAlpha *= ap;
      c.strokeStyle = rgba(C.green, .7); c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, 54, 0, 7); c.stroke();
      c.fillStyle = 'rgba(4,12,10,.95)'; c.fill();
      mt(c, n, x - tw(n) * 6, y, 12, { color: C.greenL });
      mt(c, 'pid ' + (4210 + i), x - 26, y + 78, 10, { color: C.gray });
      c.restore();
    });
    // 模型窗口
    const ap = ss(1.6, 2.2, s);
    c.save();
    c.globalAlpha *= ap;
    win(c, 1180, 620, 620, 250, { title: 'model context', color: rgba(C.green, .6) });
    mt(c, '$ 一条命令', 1215, 700, 14, { color: C.gray });
    outLines(c, 1215, 750, 12, 34, [
      { t: '评论 1  "脚本一把过"', c: C.greenL },
      { t: '评论 2  "跑分和实测差挺多"', c: C.greenL },
      { t: '评论 3  "等两周再说"', c: C.greenL },
    ], s, 1.9, .2, {});
    mt(c, '↑ 只有这一小段进了上下文', 1215, 838, 12, { color: C.gray });
    c.restore();
  },
  sfx: [[.1, 'whoosh', { f0: 300, f1: 2600, d: .8, g: .16 }],
  [1.7, 'blip', { f: 900, g: .1 }], [2.1, 'ding', { f: 780, g: .1 }]],
};

SCENES.cmdpipe = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .1, gap: 84 });
    win(c, 100, 170, 1720, 240, { title: '一条命令，两段', color: rgba(C.green, .5) });
    const c1 = '$ rsf call bilibili.com search 电影解说 --limit 5';
    const c2 = '    | rsf call bilibili.com comments - --limit 3';
    drawCmd(c, typed(c1, s, .1, .7), 150, 270, 17);
    if (s > .95) drawCmd(c, typed(c2, s, .95, .7), 150, 330, 17);
    // 管道里跑的
    const flowPts = [{ x: 150, y: 560 }, { x: 900, y: 560 }, { x: 1120, y: 620 }, { x: 1700, y: 620 }];
    c.save();
    c.strokeStyle = rgba(C.cyan, .08); c.lineWidth = 40;
    c.beginPath(); c.moveTo(150, 560); c.lineTo(900, 560); c.lineTo(1120, 620); c.lineTo(1700, 620); c.stroke();
    c.restore();
    flowLine(c, flowPts, s, { speed: 700, n: 40, color: C.cyan, track: .05, chars: '{"text":' });
    // 5 个视频 → 300 条评论 → 3 条
    const stages = [
      ['5', '视频', 150, 640, 1.3],
      ['300', '条评论', 830, 640, 1.9],
      ['3', '条进上下文', 1500, 700, 2.5],
    ];
    stages.forEach(([n, l, x, y, d]) => {
      const ap = ss(d, d + .4, s);
      if (ap <= 0) return;
      c.save();
      c.globalAlpha *= ap;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = F(46, 700); c.fillStyle = C.white; c.shadowColor = C.green; c.shadowBlur = 20;
      c.fillText(n, x, y);
      c.font = FC(16); c.fillStyle = C.gray; c.shadowBlur = 0;
      c.fillText(l, x, y + 44);
      c.restore();
    });
    // 模型只看到最后
    c.save();
    c.globalAlpha *= ss(2.6, 3.1, s);
    win(c, 1180, 760, 640, 120, { title: 'model 看到的', color: rgba(C.green, .5) });
    mt(c, '3 条评论  ·  一次命令  ·  340 tokens', 1220, 830, 15, { color: C.greenL });
    c.restore();
  },
  sfx: [[.1, 'key'], [.2, 'key'], [.3, 'key'], [.4, 'key'], [.5, 'key'], [.6, 'key'], [.7, 'key'],
  [.9, 'enter'], [1.0, 'key'], [1.1, 'key'], [1.2, 'key'], [1.3, 'key'], [1.4, 'key'], [1.5, 'key'],
  [1.65, 'whoosh', { f0: 400, f1: 3000, d: .6, g: .14 }],
  [2.5, 'ding', { f: 880, g: .14 }], [2.7, 'blip', { f: 1200, g: .1 }]],
};

SCENES.count = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .1, gap: 84 });
    const left = 0, right = 0;
    // 左：旧
    c.save();
    c.globalAlpha *= ss(.05, .6, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(24, 700); c.fillStyle = rgba(C.red, .8);
    c.fillText('工具调用', W / 4, 200);
    const a = Math.round(lerp(0, 128000, easeOut(ss(.2, 1.4, s))));
    c.font = F(96, 700); c.fillStyle = C.red;
    c.shadowColor = C.red; c.shadowBlur = 30;
    c.fillText(counter(a), W / 4, 400);
    c.font = FC(20); c.fillStyle = C.gray; c.shadowBlur = 0;
    c.fillText('token 花在数据上', W / 4, 500);
    c.restore();
    // 右：新
    c.save();
    c.globalAlpha *= ss(.9, 1.5, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(24, 700); c.fillStyle = rgba(C.green, .9);
    c.fillText('管道', W * .75, 200);
    const b = Math.round(lerp(0, 340, easeOut(ss(1.1, 2.0, s))));
    c.font = F(96, 700); c.fillStyle = C.green;
    c.shadowColor = C.green; c.shadowBlur = 30;
    c.fillText(counter(b), W * .75, 400);
    c.font = FC(20); c.fillStyle = C.gray; c.shadowBlur = 0;
    c.fillText('token 花在指令上', W * .75, 500);
    c.restore();
    // 中缝
    c.save();
    c.globalAlpha *= ss(.3, 1.0, s);
    c.strokeStyle = rgba(C.gray, .35); c.lineWidth = 2;
    c.beginPath(); c.moveTo(W / 2, 180); c.lineTo(W / 2, 540); c.stroke();
    c.restore();
    // 倍数
    c.save();
    c.globalAlpha *= ss(2.0, 2.6, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(60, 700); c.fillStyle = C.yellow;
    c.shadowColor = C.yellow; c.shadowBlur = 30;
    c.fillText('376×', W / 2, 680);
    c.font = FC(22); c.fillStyle = C.gray; c.shadowBlur = 0;
    c.fillText('同样的调研，同样的结论', W / 2, 740);
    c.restore();
  },
  sfx: [[.1, 'rise', { f0: 200, f1: 1200, d: 1.4, g: .08 }],
  [1.1, 'blip', { f: 990, g: .1 }], [2.0, 'impact', { g: .4, f: 160 }], [2.05, 'ding', { f: 1320, g: .16 }]],
};

SCENES.daemon = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .1, gap: 84 });
    // 上面：一串一次性进程
    const p = ss(.2, 1.4, s);
    for (let i = 0; i < 10; i++) {
      const x = 100 + i * 178;
      const life = Math.sin(((s * .9 + i * .35) % 2) * Math.PI);
      const on = Math.max(0, life);
      c.save();
      c.globalAlpha *= on * p;
      c.strokeStyle = rgba(C.cyan, .8); c.lineWidth = 2;
      c.strokeRect(x, 210, 150, 76);
      c.fillStyle = rgba(C.cyan, .08); c.fillRect(x, 210, 150, 76);
      mt(c, 'rsf #' + (i + 1), x + 30, 240, 12, { color: C.cyan });
      mt(c, 'exit', x + 34, 268, 11, { color: C.gray });
      c.restore();
      // 箭头向下
      if (i < 9) {
        c.save();
        c.globalAlpha *= .3 * p;
        c.strokeStyle = C.gray; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(x + 158, 248); c.lineTo(x + 178, 248); c.stroke();
        c.restore();
      }
    }
    // 下面：daemon 常驻
    const ap = ss(.9, 1.6, s);
    c.save();
    c.globalAlpha *= ap;
    c.strokeStyle = rgba(C.green, .8); c.lineWidth = 3;
    c.shadowColor = C.green; c.shadowBlur = 30;
    c.strokeRect(100, 470, 1720, 190);
    c.shadowBlur = 0;
    c.fillStyle = rgba(C.green, .05); c.fillRect(100, 470, 1720, 190);
    mt(c, 'daemon', 140, 530, 26, { color: C.green, weight: 700, glow: 18 });
    mt(c, '常驻', 336, 530, 17, { color: C.gray });
    // 持有的东西
    ['浏览器连接', '打开的标签 t5 t9 t12', '元素编号', '网络记录', '登录态'].forEach((t, i) => {
      const x = 140 + 200 * i;
      const a2 = ss(2.0 + i * .12, 2.3 + i * .12, s);
      c.save();
      c.globalAlpha *= a2;
      c.strokeStyle = rgba(C.green, .4); c.lineWidth = 1.5;
      c.strokeRect(x, 560, 180, 60);
      mt(c, t, x + (tw(t) < 16 ? 20 : 8), 590, 10.5, { color: C.greenL });
      c.restore();
    });
    c.restore();
    // 说明
    c.save();
    c.globalAlpha *= ss(2.6, 3.2, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(34, 700); c.fillStyle = C.white;
    c.fillText('进程退一百次，状态一次都不丢', W / 2, 780);
    c.restore();
  },
  sfx: [...Array.from({ length: 10 }, (_, i) => [.3 + i * .14, 'tick', { f: 700 + i * 60 }]),
  [1.0, 'impact', { g: .35, f: 120 }], [1.05, 'ding', { f: 660, g: .1 }],
  [2.0, 'blip', { f: 900 }], [2.12, 'blip', { f: 980 }], [2.24, 'blip', { f: 1060 }],
  [2.36, 'blip', { f: 1140 }], [2.48, 'blip', { f: 1220 }],
  [2.7, 'ding', { f: 880, g: .14 }]],
};

// ══════════════════════ 第六幕：跨站调研 ══════════════════════

SCENES.rewind = {
  draw(c, s) {
    const p = ss(0, 1.2, s);
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    // 倒带的横线
    c.save();
    c.globalAlpha = (1 - p * .7) * .55;
    for (let i = 0; i < 70; i++) {
      const yy = rnd(i) * H;
      const xx = W - ((s * (1600 + rnd(i) * 2000) + rnd(i + 5) * W) % (W + 800));
      c.fillStyle = rgba(C.green, .1 + rnd(i * 2) * .35);
      c.fillRect(xx, yy, 80 + rnd(i * 3) * 300, 2);
    }
    c.restore();
    // REC 标识
    c.save();
    c.globalAlpha *= (1 - p * .5);
    c.font = F(22, 700); c.fillStyle = C.red;
    const bl = Math.floor(s * 3) % 2;
    if (bl) { c.beginPath(); c.arc(140, 120, 9, 0, 7); c.fill(); }
    c.fillStyle = C.red; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('REWIND', 166, 120);
    // 时间码
    c.fillStyle = C.gray; c.font = F(22);
    const tc = (7.2 - s * 1.8).toFixed(2);
    c.fillText('00:' + tc.padStart(5, '0'), 300, 120);
    c.restore();
    // 标题回来
    c.save();
    c.globalAlpha *= ss(.8, 1.5, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(56, 700); c.fillStyle = C.white; c.shadowColor = C.green; c.shadowBlur = 30;
    c.fillText('把开头那件事，慢放一遍', W / 2, 500);
    c.restore();
    // VHS 条纹
    c.save();
    for (let i = 0; i < 5; i++) {
      const yy = ((s * 300 + i * 220) % (H + 100)) - 50;
      c.fillStyle = rgba(C.green, .04);
      c.fillRect(0, yy, W, 18 + rnd(i) * 26);
    }
    c.restore();
  },
  sfx: [[0, 'whoosh', { f0: 3000, f1: 250, d: .9, g: .18 }],
  [0.15, 'glitch'], [1.0, 'impact', { g: .35, f: 130 }]],
};

SCENES.spread = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .14, gap: 76 });
    const cx = W / 2, cy = 430, R = 340;
    const SITES = ['Hacker News', 'Reddit', '知乎', 'B 站', 'X', 'Google'];
    // 星图连线
    const ap0 = ss(.05, .6, s);
    c.save();
    c.globalAlpha *= ap0;
    c.strokeStyle = rgba(C.green, .1); c.lineWidth = 1;
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
      const a1 = -Math.PI / 2 + i * Math.PI / 3, a2 = -Math.PI / 2 + j * Math.PI / 3;
      c.beginPath();
      c.moveTo(cx + Math.cos(a1) * R * 1.2, cy + Math.sin(a1) * R * .76);
      c.lineTo(cx + Math.cos(a2) * R * 1.2, cy + Math.sin(a2) * R * .76);
      c.stroke();
    }
    c.restore();

    SITES.forEach((n, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 3;
      const x = cx + Math.cos(a) * R * 1.2, y = cy + Math.sin(a) * R * .76;
      const d = .25 + i * .1;
      const lit = ss(d, d + .25, s);
      c.save();
      c.globalAlpha *= ss(d - .15, d, s);
      c.strokeStyle = rgba(lit > .5 ? C.green : C.gray, .85); c.lineWidth = 2;
      if (lit > .5) { c.shadowColor = C.green; c.shadowBlur = 20; }
      c.beginPath(); c.arc(x, y, 46, 0, 7); c.stroke();
      c.shadowBlur = 0;
      c.fillStyle = rgba(C.green, lit * .12); c.fill();
      mt(c, n, x - tw(n) * 6, y, 12, { color: lit > .5 ? C.greenL : C.gray });
      c.restore();
      // 飞出的查询
      for (let k = 0; k < 2; k++) {
        const ph = ((s * .8 + k * .5 + i * .13) % 1);
        if (ph > .8) continue;
        const px = lerp(x, cx, ph), py = lerp(y, cy, ph);
        c.fillStyle = rgba(C.cyan, .8 * (1 - ph));
        c.fillRect(px - 2, py - 2, 5, 5);
      }
    });
    // 中心
    c.save();
    c.globalAlpha *= ss(.4, 1.0, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(20, 700); c.fillStyle = C.white;
    c.fillText('6 站并行', cx, cy - 16);
    c.font = F(13); c.fillStyle = C.greenL;
    c.fillText('Promise.allSettled', cx, cy + 16);
    c.restore();

    // 结果表
    const ap = ss(1.5, 2.3, s);
    if (ap > 0) {
      c.save();
      c.globalAlpha *= ap;
      c.translate(0, (1 - ap) * 40);
      win(c, 190, 640, 1540, 230, { title: 'research/posts.json', color: rgba(C.green, .5) });
      const ROWS = [
        ['✓', 'hacker news', '34 条', '2.1s', C.green],
        ['✓', 'reddit', '28 条', '3.4s', C.green],
        ['✓', '知乎', '19 条', '2.8s', C.green],
        ['✓', 'bilibili', '41 条', '1.9s', C.green],
        ['✓', 'x.com', '12 条', '4.7s', C.green],
        ['✗', 'google', 'BLOCKED → 自动换 bing', '5.2s', C.orange],
      ];
      ROWS.forEach((r, i) => {
        const a2 = ss(1.7 + i * .1, 2.0 + i * .1, s);
        c.save(); c.globalAlpha *= a2;
        const y = 700 + i * 27;
        mt(c, r[0], 230, y, 11, { color: r[4] });
        mt(c, fit(r[1], 14), 260, y, 11, { color: C.text });
        mt(c, r[2], 460, y, 11, { color: r[4] === C.green ? C.greenL : C.orange });
        mt(c, r[3], 900, y, 11, { color: C.gray });
        c.restore();
      });
      c.restore();
    }
  },
  sfx: [[.25, 'blip', { f: 660, g: .1 }], [.35, 'blip', { f: 740, g: .1 }], [.45, 'blip', { f: 830, g: .1 }],
  [.55, 'blip', { f: 930, g: .1 }], [.65, 'blip', { f: 1040, g: .1 }], [.75, 'blip', { f: 1170, g: .1 }],
  [1.6, 'whoosh', { f0: 600, f1: 1800, d: .4, g: .1 }],
  [1.8, 'tick'], [2.0, 'tick'], [2.2, 'tick'], [2.4, 'tick'], [2.6, 'tick'],
  [2.8, 'buzz', { f: 300, g: .2 }], [2.95, 'ding', { f: 880, g: .1 }]],
};

SCENES.skip = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    win(c, 200, 110, 1520, 640, { title: 'bilibili 搜索结果', color: rgba(C.gray, .6) });
    const ROWS = [
      ['上一代模型 4 bit 量化实测', '2024-03', 1],
      ['新发布的这个到底行不行？', '2024-09', 0],
      ['旧模型微调教程合集', '2023-11', 1],
      ['跑了 200 个 case 的真实感受', '2024-09', 0],
      ['两年前的跑分横评', '2023-06', 1],
    ];
    ROWS.forEach((r, i) => {
      const d = .15 + i * .32;
      const ap = ss(d, d + .3, s);
      if (ap <= 0) return;
      const skip = r[2];
      const y = 220 + i * 96;
      c.save();
      c.globalAlpha *= ap * (skip ? .35 : 1);
      if (skip) {
        c.strokeStyle = rgba(C.red, .8); c.lineWidth = 2;
        c.beginPath();
        c.moveTo(250, y); c.lineTo(250 + tw(r[0]) * 13, y);
        c.stroke();
      }
      mt(c, r[0], 250, y, 13, { color: skip ? C.gray : C.white });
      mt(c, r[1], 250 + 30 * 13, y, 13, { color: C.gray });
      c.restore();
      if (skip) {
        const a2 = ss(d + .35, d + .6, s);
        c.save();
        c.globalAlpha *= a2;
        mt(c, '← 上一代，跳过', 250 + 36 * 13, y, 12, { color: rgba(C.red, .9) });
        c.restore();
      }
    });
    c.save();
    c.globalAlpha *= ss(2.2, 2.8, s);
    mt(c, '✓ 按标题一眼筛掉 3 条，剩下 2 条再深挖', 250, 800, 16, { color: C.greenL });
    c.restore();
  },
  sfx: [[.15, 'tick'], [.47, 'tick'], [.47, 'buzz', { f: 200, g: .12 }],
  [.79, 'tick'], [1.11, 'tick'], [1.11, 'buzz', { f: 190, g: .12 }],
  [1.43, 'tick'], [1.43, 'buzz', { f: 180, g: .12 }],
  [2.3, 'ding', { f: 880, g: .12 }]],
};

SCENES.dig = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    win(c, 130, 100, 1660, 300, { title: 'rsf run -f step2.js 0,31,60,80', color: rgba(C.green, .55) });
    drawCmd(c, typed('$ rsf run -f step2.js 0,31,60,80', s, .1, .5), 180, 180, 15);
    const ap = ss(.7, 1.2, s);
    const IDX = ['0', '31', '60', '80'];
    IDX.forEach((n, i) => {
      const a2 = ss(.8 + i * .18, 1.1 + i * .18, s);
      if (a2 <= 0) return;
      const x = 180 + i * 200;
      c.save();
      c.globalAlpha *= a2;
      c.strokeStyle = rgba(C.green, .8); c.lineWidth = 2;
      c.strokeRect(x, 260, 170, 90);
      c.fillStyle = rgba(C.green, .1); c.fillRect(x, 260, 170, 90);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = F(36, 700); c.fillStyle = C.greenL;
      c.fillText(n, x + 85, 300);
      c.font = F(12); c.fillStyle = C.gray;
      c.fillText('第几条', x + 85, 332);
      c.restore();
    });
    // 拉回来的 thread
    const ap2 = ss(1.6, 2.2, s);
    if (ap2 > 0) {
      c.save();
      c.globalAlpha *= ap2;
      win(c, 130, 450, 1660, 400, { title: 'research/threads.json', color: rgba(C.cyan, .55) });
      const L = [
        { t: 'threads:', c: C.cyan },
        { t: '  - site: "news.ycombinator.com"   评论 128 条  → 取 40 条', c: C.text },
        { t: '  - site: "reddit.com"             评论 232 条  → 取 40 条', c: C.text },
        { t: '  - site: "zhihu.com"               回答  74 条  → 取 12 条', c: C.text },
        { t: '  - site: "bilibili.com"           评论 419 条  → 取 30 条', c: C.text },
        { t: '', c: C.text },
        { t: '  并发 3 个 · 失败的站只记一行 ✗，其余照常', c: C.gray },
      ];
      outLines(c, 180, 540, 13.5, 44, L, s, 1.75, .16, {});
      c.restore();
    }
  },
  sfx: [[.1, 'key'], [.2, 'key'], [.3, 'key'], [.4, 'key'], [.5, 'key'], [.65, 'enter'],
  [.8, 'blip', { f: 700 }], [.98, 'blip', { f: 780 }], [1.16, 'blip', { f: 860 }], [1.34, 'blip', { f: 940 }],
  [1.7, 'whoosh', { f0: 500, f1: 1600, d: .4, g: .1 }],
  [1.9, 'ding', { f: 720, g: .1 }]],
};

SCENES.conflict = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    const p = easeOut(ss(.2, 1.2, s));
    // 两句话对撞
    c.save();
    c.globalAlpha *= ss(.1, .6, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(64, 700);
    const off = (1 - p) * 400;
    c.fillStyle = C.green; c.shadowColor = C.green; c.shadowBlur = 30;
    c.fillText('「吊打一切」', W / 4 - off, 260);
    c.fillStyle = C.red; c.shadowColor = C.red; c.shadowBlur = 30;
    c.fillText('「就是在刷榜」', W * .75 + off, 260);
    c.restore();
    // 中缝火花
    if (p > .6) {
      c.save();
      c.globalAlpha *= ss(.7, 1.0, s);
      for (let i = 0; i < 30; i++) {
        const a = rnd(i) * 6.28, r = rnd(i + 3) * 120 * (0.5 + Math.sin(s * 6 + i) * .5);
        c.fillStyle = rgba(i % 2 ? C.green : C.red, .8);
        c.fillRect(W / 2 + Math.cos(a) * r, 260 + Math.sin(a) * r * .6, 4, 4);
      }
      c.restore();
    }
    // 依据
    const ap = ss(1.4, 2.0, s);
    if (ap > 0) {
      c.save();
      c.globalAlpha *= ap;
      const BOX = (x, title, col, lines) => {
        c.strokeStyle = rgba(col, .55); c.lineWidth = 2;
        c.strokeRect(x, 420, 720, 340);
        c.fillStyle = rgba(col, .05); c.fillRect(x, 420, 720, 340);
        mt(c, title, x + 30, 470, 15, { color: col, weight: 700 });
        lines.forEach((l, i) => mt(c, l, x + 30, 530 + i * 40, 12, { color: C.text }));
      };
      BOX(180, '来源：HN #4128  ·  点赞 892', C.green, [
        '「两周没睡好，值。跑分不骗人。」',
        '「长上下文检索也快了 3 倍。」',
        '—— 但没提具体测试环境',
      ]);
      BOX(1020, '来源：r/LocalLLaMA  ·  点赞 1.2k', C.red, [
        '「跑分是挑过的，我复测只有 71。」',
        '「92.4 那个数是单轮，不是真实场景。」',
        '—— 附了复现脚本',
      ]);
      c.restore();
    }
    // 并列
    c.save();
    c.globalAlpha *= ss(2.5, 3.0, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(26, 700); c.fillStyle = C.yellow;
    c.fillText('两个都留，写清楚各自的前提', W / 2, 820);
    c.restore();
  },
  sfx: [[.2, 'whoosh', { f0: 600, f1: 200, d: .6, g: .14 }],
  [.8, 'impact', { g: .35, f: 200 }], [.82, 'glitch'],
  [1.5, 'blip', { f: 660 }], [1.8, 'blip', { f: 560 }],
  [2.6, 'ding', { f: 880, g: .12 }]],
};

SCENES.primary = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    const SRC = [
      { n: 'arxiv.org', t: '官方技术报告', d: 'longbench 92.4', a: '→ 单轮设置', c: C.cyan, i: 0 },
      { n: '公开榜单', t: '第三方排名', d: '#2 / 18', a: '→ 综合分', c: C.green, i: 1 },
      { n: '独立复测', t: '网友脚本', d: '71.0', a: '→ 多轮真实场景', c: C.yellow, i: 2 },
    ];
    SRC.forEach((sr, i) => {
      const d = .15 + i * .5;
      const p = backOut(clamp((s - d) / .45));
      if (p <= 0) return;
      const x = 150 + i * 560;
      c.save();
      c.globalAlpha *= clamp((s - d) / .3);
      c.translate(0, (1 - p) * 80);
      c.strokeStyle = rgba(sr.c, .6); c.lineWidth = 2;
      c.strokeRect(x, 200, 500, 420);
      c.fillStyle = rgba(sr.c, .06); c.fillRect(x, 200, 500, 420);
      c.fillStyle = rgba(sr.c, .8); c.fillRect(x, 200, 500, 4);
      mt(c, sr.n, x + 34, 260, 16, { color: sr.c, weight: 700, glow: 10 });
      c.font = FC(22, 500); c.fillStyle = C.text; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(sr.t, x + 34, 320);
      c.font = F(46, 700); c.fillStyle = C.white;
      c.fillText(sr.d, x + 34, 420);
      c.font = FC(18, 400); c.fillStyle = C.gray;
      c.fillText(sr.a, x + 34, 500);
      c.restore();
    });
    c.save();
    c.globalAlpha *= ss(1.8, 2.4, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(30, 700); c.fillStyle = C.white;
    c.fillText('数字对不上，是因为前提不一样', W / 2, 730);
    c.font = FC(20, 400); c.fillStyle = C.gray;
    c.fillText('报告里把三个都列出来，让读的人自己判断', W / 2, 790);
    c.restore();
  },
  sfx: [[.15, 'bloop', { f: 400 }], [.65, 'bloop', { f: 480 }], [1.15, 'bloop', { f: 560 }],
  [1.9, 'impact', { g: .3, f: 220 }], [2.0, 'ding', { f: 780, g: .12 }]],
};

SCENES.final = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .1, gap: 84 });
    const px = 200, py = 90, pw = 1520, ph = 760;
    win(c, px, py, pw, ph, { title: 'research/report.md', color: rgba(C.green, .6) });
    const L = [
      { t: '# 新模型能不能上生产：六站交叉调研', c: C.white, w: 700 },
      { t: '', c: C.text },
      { t: '## 结论', c: C.green, w: 600 },
      { t: '能用。推理类任务提升确实明显，长上下文检索基本没变。', c: C.text },
      { t: '', c: C.text },
      { t: '## 争议 1：跑分 92.4 到底算不算数', c: C.yellow, w: 600 },
      { t: '  正方：官方单轮 longbench 92.4       ↗ arxiv 2409.xxxxx', c: C.text },
      { t: '  反方：社区复测 71.0（多轮真实场景）  ↗ github/…/repro', c: C.text },
      { t: '  → 差异来自轮次设置，两边都成立', c: C.greenL },
      { t: '', c: C.text },
      { t: '## 争议 2：会不会自己停下来', c: C.yellow, w: 600 },
      { t: '  正方：「第一次见模型自己会停」       ↗ zhihu/q/658', c: C.text },
      { t: '  反方：「长任务里还是会绕圈」         ↗ reddit/9f2', c: C.text },
      { t: '  → 争议未解，两边都在实测', c: C.orange },
      { t: '', c: C.text },
      { t: '## 出处', c: C.gray },
    ];
    outLines(c, px + 44, py + 76, 13, 40, L, s, .2, .28, {});
    // 锁定的出处
    const ap = ss(2.2, 2.8, s);
    c.save();
    c.globalAlpha *= ap;
    c.strokeStyle = C.green; c.lineWidth = 2; c.setLineDash([6, 6]);
    c.strokeRect(px + 30, py + 76 + 5 * 40 - 20, pw - 60, 200);
    c.setLineDash([]);
    c.restore();
  },
  sfx: [[.2, 'whoosh', { f0: 400, f1: 1500, d: .4, g: .08 }],
  [.6, 'blip', { f: 700, g: .06 }], [1.2, 'blip', { f: 800, g: .06 }], [1.8, 'blip', { f: 900, g: .06 }],
  [2.3, 'ding', { f: 990, g: .12 }]],
};

SCENES.files = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    const FILES = [
      ['posts.json', '1,284 条 · 6 站', .1],
      ['threads.json', '332 条 · 12 帖', .55],
      ['sources.json', '18 个一手来源', 1.0],
      ['report.md', '最后那版', 1.45],
    ];
    FILES.forEach(([f, d, dl]) => {
      const p = backOut(clamp((s - dl) / .45));
      if (p <= 0) return;
      const x = 210 + Math.random() * 0;
      const y = 180 + FILES.indexOf(FILES.find(z => z[0] === f)) * 150;
      const yy = 180 + FILES.findIndex(z => z[0] === f) * 150;
      c.save();
      c.globalAlpha *= clamp((s - dl) / .3);
      c.translate((1 - p) * -60, (1 - p) * -30);
      c.strokeStyle = rgba(C.green, .5); c.lineWidth = 2;
      c.strokeRect(210, yy, 620, 110);
      c.fillStyle = rgba(C.green, .06); c.fillRect(210, yy, 620, 110);
      mt(c, '▸ ' + f, 240, yy + 40, 16, { color: C.cyan });
      mt(c, d, 240, yy + 74, 13, { color: C.gray });
      // 重跑箭头
      const a2 = ss(dl + .4, dl + .7, s);
      c.globalAlpha *= a2;
      mt(c, '↻ 可单独重跑', 640, yy + 40, 12, { color: rgba(C.yellow, .9) });
      c.restore();
    });
    // 右侧：上下文
    const ap = ss(1.8, 2.4, s);
    c.save();
    c.globalAlpha *= ap;
    win(c, 960, 180, 760, 590, { title: 'model context', color: rgba(C.green, .6) });
    mt(c, '$ 每一步只回一行摘要', 1000, 270, 14, { color: C.gray });
    outLines(c, 1000, 330, 12.5, 44, [
      { t: '✓ step1  6 站搜索完成  → posts.json', c: C.greenL },
      { t: '✓ step2  拉了 4 帖  → threads.json', c: C.greenL },
      { t: '✓ step3  3 个一手来源  → sources.json', c: C.greenL },
      { t: '✓ step4  报告写好了  → report.md', c: C.greenL },
      { t: '', c: C.text },
      { t: '↑ 中间那几万条评论，一条没进上下文', c: C.gray },
    ], s, 2.0, .22, {});
    c.restore();
    c.save();
    c.globalAlpha *= ss(3.0, 3.6, s);
    mt(c, '哪一步都能单独重跑', 210, 800, 20, { color: C.white, glow: 10 });
    c.restore();
  },
  sfx: [[.1, 'bloop', { f: 300 }], [.55, 'bloop', { f: 360 }], [1.0, 'bloop', { f: 420 }], [1.45, 'bloop', { f: 480 }],
  [2.0, 'tick'], [2.22, 'tick'], [2.44, 'tick'], [2.66, 'tick'],
  [3.1, 'ding', { f: 880, g: .14 }]],
};

// ══════════════════════ 第七幕：原理 ══════════════════════

const HOW = { items: [
  { k: 'agent', label: 'AI agent', sub: '', c: C.white },
  { k: 'cli', label: 'CLI', sub: '一次性进程', c: C.cyan },
  { k: 'daemon', label: 'daemon', sub: '后台常驻', c: C.green },
  { k: 'ext', label: '浏览器插件', sub: 'WebSocket', c: C.purple },
  { k: 'tab', label: '你的标签', sub: '带着登录', c: C.greenL },
] };
function howBox(c, i, s, appear, opts = {}) {
  const it = HOW.items[i];
  const w = opts.w || 250, h = opts.h || 118;
  const x = 130 + i * 338, y = opts.y || 380;
  const p = clamp((s - appear) / .5);
  if (p <= 0) return null;
  const bp = backOut(p);
  c.save();
  c.globalAlpha *= Math.min(1, p * 2);
  c.translate(x + w / 2, y + h / 2);
  c.scale(.86 + bp * .14, .86 + bp * .14);
  c.globalAlpha *= .4 + bp * .6;
  c.translate(-w / 2, -h / 2);
  c.strokeStyle = rgba(it.c, .75); c.lineWidth = 2.5;
  if (p < 1) { c.shadowColor = it.c; c.shadowBlur = 34 * (1 - p); }
  c.strokeRect(0, 0, w, h);
  c.shadowBlur = 0;
  c.fillStyle = rgba(it.c, .07); c.fillRect(0, 0, w, h);
  c.fillStyle = rgba(it.c, .8); c.fillRect(0, 0, w, 3);
  mt(c, fmtLabel(it.label), 18, 46, 14, { color: it.c, weight: 700 });
  if (it.sub) mt(c, it.sub, 18, 82, 10.5, { color: C.gray });
  c.restore();
  return { x, y, w, h };
}
function fmtLabel(s) { return s; }
// 箭头
function howArrow(c, i, s, appear, label) {
  const x0 = 130 + i * 338 + 250, x1 = 130 + (i + 1) * 338;
  const y = 380 + 59;
  const p = clamp((s - appear) / .4);
  if (p <= 0) return;
  c.save();
  c.globalAlpha *= p;
  c.strokeStyle = rgba(C.gray, .7); c.lineWidth = 2;
  const mx = lerp(x0 + 6, x1 - 6, easeOut(p));
  c.beginPath(); c.moveTo(x0 + 6, y); c.lineTo(mx, y); c.stroke();
  if (p >= 1) {
    c.beginPath(); c.moveTo(x1 - 16, y - 7); c.lineTo(x1 - 4, y); c.lineTo(x1 - 16, y + 7);
    c.fillStyle = rgba(C.gray, .8); c.fill();
  }
  if (label) mt(c, label, x0 + 12, y - 26, 9.5, { color: rgba(C.text, .7) });
  c.restore();
}

SCENES.start = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    const ap = ss(.1, .6, s);
    c.save();
    c.globalAlpha *= ap;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(40, 700); c.fillStyle = C.white;
    c.fillText('它是怎么做到的', W / 2, 180);
    c.restore();
    howBox(c, 0, s, .3, { y: 380 });
    howBox(c, 4, s, 1.1, { y: 380 });
    // 中间的空白 + 问号
    const q = ss(1.6, 2.1, s);
    c.save();
    c.globalAlpha *= q * (1 - ss(3.4, 3.9, s) * .7);
    c.font = F(88, 700); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = rgba(C.gray, .35);
    c.fillText('?', W / 2, 440);
    c.restore();
    // 大标题
    c.save();
    c.globalAlpha *= ss(3.0, 3.6, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(44, 700); c.fillStyle = C.greenL;
    c.shadowColor = C.green; c.shadowBlur = 22;
    c.fillText('不另起一个浏览器', W / 2, 700);
    c.font = FC(28, 500); c.fillStyle = C.text; c.shadowBlur = 0;
    c.fillText('借你平时用的那个', W / 2, 766);
    c.restore();
  },
  sfx: [[.3, 'bloop', { f: 340 }], [1.1, 'bloop', { f: 420 }],
  [1.7, 'buzz', { f: 200, g: .2 }], [3.1, 'impact', { g: .3, f: 180 }]],
};

SCENES.cli = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    howBox(c, 0, s, 0, {});
    howBox(c, 4, s, 0, {});
    howBox(c, 1, s, .2, {});
    howArrow(c, 0, s, .7, 'rsf read …');
    // 终端的活
    c.save();
    c.globalAlpha *= ss(1.4, 2.0, s);
    mt(c, '跑完就退，不留痕', 130 + 338 + 20, 540, 12, { color: C.gray });
    c.restore();
    // daemon 出现
    howBox(c, 2, s, 2.4, {});
    howArrow(c, 1, s, 2.9, 'RPC');
    // 高亮 CLI
    const pulseA = .5 + .5 * Math.sin(s * 4);
    c.save();
    c.globalAlpha *= ss(2.6, 3.2, s) * pulseA;
    c.strokeStyle = C.cyan; c.lineWidth = 3; c.shadowColor = C.cyan; c.shadowBlur = 30;
    c.strokeRect(130 + 338 - 8, 372, 266, 134);
    c.restore();
    c.save();
    c.globalAlpha *= ss(3.2, 3.8, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(30, 700); c.fillStyle = C.white;
    c.fillText('状态全在 daemon，进程退不退都不影响', W / 2, 700);
    c.restore();
  },
  sfx: [[0, 'blip', { f: 600 }], [.2, 'blip', { f: 700 }], [.72, 'whoosh', { f0: 400, f1: 1800, d: .4, g: .1 }],
  [2.4, 'bloop', { f: 280 }], [2.5, 'impact', { g: .3, f: 130 }], [2.95, 'enter'],
  [3.3, 'ding', { f: 880, g: .1 }]],
};

SCENES.plugin = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    [0, 1, 2].forEach(i => howBox(c, i, s, 0, {}));
    howArrow(c, 0, s, 0, '');
    howArrow(c, 1, s, 0, 'RPC');
    howBox(c, 3, s, .2, {});
    howArrow(c, 2, s, .7, 'WebSocket');
    howBox(c, 4, s, 1.4, {});
    howArrow(c, 3, s, 1.9, 'chrome.debugger');
    // 标签里加载页面
    c.save();
    c.globalAlpha *= ss(2.4, 3.0, s);
    const tx = 130 + 4 * 338, ty = 380, tw2 = 250, th = 118;
    for (let i = 0; i < 6; i++) {
      const a2 = ss(2.5 + i * .12, 2.8 + i * .12, s);
      c.globalAlpha *= (i === 0 ? 1 : a2);
      c.fillStyle = rgba(C.green, .1);
      c.fillRect(tx + 10, ty + 12 + i * 16, tw2 - 20, 11);
    }
    c.restore();
    // 前台不受打扰
    c.save();
    c.globalAlpha *= ss(3.2, 3.8, s);
    win(c, 480, 620, 960, 210, { title: '你正在用的标签（不服打扰）', color: rgba(C.gray, .5) });
    mt(c, '焦点还在你手上，标签在后台悄悄开', 520, 710, 15, { color: C.text });
    mt(c, '登录用的是你的 cookie → 对网站来说，来的就是你本人', 520, 770, 15, { color: C.greenL });
    c.restore();
    // 高亮标签框
    const pulseA = .5 + .5 * Math.sin(s * 4);
    c.save();
    c.globalAlpha *= ss(2.9, 3.4, s) * pulseA;
    c.strokeStyle = C.greenL; c.lineWidth = 3; c.shadowColor = C.green; c.shadowBlur = 30;
    c.strokeRect(130 + 4 * 338 - 8, 372, 266, 134);
    c.restore();
  },
  sfx: [[.2, 'bloop', { f: 400 }], [.7, 'whoosh', { f0: 500, f1: 2200, d: .5, g: .1 }],
  [1.4, 'bloop', { f: 500 }], [1.95, 'enter'], [2.5, 'rise', { f0: 300, f1: 900, d: .6, g: .08 }],
  [3.3, 'ding', { f: 990, g: .12 }]],
};

SCENES.back = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    [0, 1, 2, 3, 4].forEach(i => howBox(c, i, s, -1, {}));
    [0, 1, 2, 3].forEach(i => howArrow(c, i, s, -1, ''));
    // 反向回流
    const pts = [];
    for (let i = 4; i >= 0; i--) pts.push({ x: 130 + i * 338 + 125, y: 380 + 59 });
    flowLine(c, pts, s, { speed: 380, n: 22, color: C.greenL, lw: 2, track: .04, chars: '01ab…' });
    // 压扁的动作
    c.save();
    c.globalAlpha *= ss(.4, 1.0, s);
    const bw = lerp(700, 260, easeOut(ss(.8, 2.0, s)));
    c.fillStyle = rgba(C.green, .1); c.fillRect(W / 2 - bw / 2, 560, bw, 90);
    c.strokeStyle = rgba(C.green, .6); c.lineWidth = 2;
    c.strokeRect(W / 2 - bw / 2, 560, bw, 90);
    mt(c, '几十万字符 → 几行文字', W / 2 - 120, 605, 14, { color: C.greenL });
    c.restore();
    c.save();
    c.globalAlpha *= ss(2.0, 2.6, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(34, 700); c.fillStyle = C.white;
    c.fillText('交回 AI 手里', W / 2, 760);
    c.restore();
  },
  sfx: [[0, 'whoosh', { f0: 1600, f1: 300, d: .8, g: .14 }],
  [.9, 'rise', { f0: 800, f1: 260, d: .9, g: .08 }],
  [2.1, 'ding', { f: 880, g: .12 }]],
};

SCENES.why = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .1, gap: 84 });
    // 老办法被划掉
    const ap = ss(.1, .6, s);
    c.save();
    c.globalAlpha *= ap;
    win(c, 180, 130, 700, 260, { title: '老办法', color: rgba(C.gray, .5) });
    mt(c, 'chrome --remote-debugging-port=9222', 220, 240, 14, { color: rgba(C.text, .6) });
    mt(c, '接上你日常浏览器的登录态', 220, 290, 14, { color: rgba(C.text, .6) });
    c.restore();
    const xp = ss(1.0, 1.6, s);
    if (xp > 0) {
      c.save();
      c.globalAlpha *= xp;
      c.strokeStyle = C.red; c.lineWidth = 6; c.shadowColor = C.red; c.shadowBlur = 24;
      c.beginPath(); c.moveTo(210, 200); c.lineTo(210 + 640 * xp, 200 + 180 * xp); c.stroke();
      c.restore();
    }
    // Chrome 136
    c.save();
    c.globalAlpha *= ss(1.4, 2.0, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(64, 700); c.fillStyle = C.red;
    c.shadowColor = C.red; c.shadowBlur = 28;
    c.fillText('Chrome 136+', W / 2 + 500, 250);
    c.font = FC(24, 500); c.fillStyle = C.gray; c.shadowBlur = 0;
    c.fillText('默认用户目录不再吃远程调试端口', W / 2 + 500, 310);
    c.restore();
    // 新办法
    const ap2 = ss(2.2, 2.9, s);
    c.save();
    c.globalAlpha *= ap2;
    win(c, 180, 480, 1560, 300, { title: '只能走插件', color: rgba(C.green, .6) });
    mt(c, '插件用 chrome.debugger 把 CDP 转出来', 220, 590, 16, { color: C.text });
    mt(c, '能力跟直连 CDP 一样', 220, 645, 16, { color: C.greenL });
    mt(c, '不想动自己的浏览器 → rsf browser launch 起一个专用的', 220, 700, 16, { color: C.gray });
    c.restore();
    const pulseA = .5 + .5 * Math.sin(s * 4);
    c.save();
    c.globalAlpha *= ap2 * pulseA;
    c.strokeStyle = C.green; c.lineWidth = 3; c.shadowColor = C.green; c.shadowBlur = 30;
    c.strokeRect(170, 470, 1580, 320);
    c.restore();
  },
  sfx: [[.1, 'blip', { f: 500 }], [1.05, 'buzz', { f: 90, d: .3, g: .3 }],
  [1.45, 'impact', { g: .35, f: 110 }], [2.3, 'rise', { f0: 330, f1: 880, d: .5, g: .1 }],
  [2.9, 'ding', { f: 880, g: .12 }]],
};

SCENES.keep = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .1, gap: 84 });
    // 左：CLI 生灭
    c.save();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(22, 700); c.fillStyle = C.gray;
    c.fillText('CLI', 340, 160);
    c.restore();
    for (let k = 0; k < 3; k++) {
      const cyc = 1.5;
      const ph = ((s + k * .5) % cyc) / cyc;
      const on = ph < .55 ? Math.sin(ph / .55 * Math.PI) : 0;
      c.save();
      c.globalAlpha *= on;
      c.strokeStyle = rgba(C.cyan, .8); c.lineWidth = 2;
      c.strokeRect(200, 220 + k * 140, 280, 110);
      c.fillStyle = rgba(C.cyan, .08); c.fillRect(200, 220 + k * 140, 280, 110);
      mt(c, 'rsf tab open', 240, 258 + k * 140, 12, { color: C.cyan });
      mt(c, 'exit 0', 240, 296 + k * 140, 12, { color: C.gray });
      c.restore();
    }
    // 右：daemon 里的标签一直在
    c.save();
    c.globalAlpha *= ss(.5, 1.1, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(22, 700); c.fillStyle = C.greenL;
    c.fillText('daemon 里的标签', 1280, 160);
    c.restore();
    const tabs = [['t5', 'B 站', C.green], ['t9', '知乎', C.cyan], ['t12', '雪球', C.yellow]];
    tabs.forEach(([id, nm, col], i) => {
      const ap = ss(.8 + i * .2, 1.1 + i * .2, s);
      if (ap <= 0) return;
      const y = 230 + i * 140;
      c.save();
      c.globalAlpha *= ap;
      c.strokeStyle = rgba(col, .75); c.lineWidth = 2;
      c.strokeRect(1050, y, 620, 110);
      c.fillStyle = rgba(col, .07); c.fillRect(1050, y, 620, 110);
      mt(c, id, 1090, y + 44, 18, { color: col, weight: 700, glow: 12 });
      mt(c, nm, 1090 + 120, y + 44, 16, { color: C.text });
      mt(c, '带着登录 · 元素编号 · 网络记录', 1090, y + 82, 11, { color: C.gray });
      // 生命线
      c.strokeStyle = rgba(col, .3); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(1050 - 30, y - 30); c.lineTo(1050 - 30, y + 116 + 40); c.stroke();
      c.restore();
    });
    c.save();
    c.globalAlpha *= ss(2.4, 3.0, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(30, 700); c.fillStyle = C.white;
    c.fillText('下次按编号，还是那个标签', W / 2, 800);
    c.restore();
  },
  sfx: [[.2, 'blip', { f: 700 }], [.7, 'blip', { f: 620 }], [1.2, 'blip', { f: 700 }],
  [.9, 'ding', { f: 880, g: .08 }], [1.1, 'ding', { f: 990, g: .08 }], [1.3, 'ding', { f: 1100, g: .08 }],
  [2.5, 'ding', { f: 880, g: .12 }]],
};

// ══════════════════════ 收尾 ══════════════════════

SCENES.grow = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 84 });
    const STEPS = [
      ['rsf read 看一眼', '陌生', .2, C.gray],
      ['rsf run 里试', '摸接口', 1.1, C.cyan],
      ['存成 ~/.rsf/lib', '以后直接用', 2.0, C.green],
    ];
    STEPS.forEach(([t, sub, d, col], i) => {
      const a = ss(d, d + .45, s);
      if (a <= 0) return;
      const x = 220 + i * 540;
      c.save();
      c.globalAlpha *= a;
      c.translate((1 - a) * 50, 0);
      c.strokeStyle = rgba(col, .6); c.lineWidth = 2.5;
      c.strokeRect(x, 260, 460, 200);
      c.fillStyle = rgba(col, .06); c.fillRect(x, 260, 460, 200);
      mt(c, '0' + (i + 1), x + 30, 310, 15, { color: col, weight: 700 });
      mt(c, t, x + 30, 370, 14, { color: C.white, weight: 600 });
      mt(c, sub, x + 30, 410, 12, { color: C.gray });
      c.restore();
      if (i < 2) {
        const a2 = ss(d + .5, d + .8, s);
        c.save();
        c.globalAlpha *= a2;
        c.strokeStyle = rgba(C.gray, .6); c.lineWidth = 2;
        c.beginPath(); c.moveTo(x + 470, 360); c.lineTo(x + 530, 360); c.stroke();
        c.beginPath(); c.moveTo(x + 518, 353); c.lineTo(x + 530, 360); c.lineTo(x + 518, 367); c.fill();
        c.restore();
      }
    });
    c.save();
    c.globalAlpha *= ss(2.6, 3.2, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(28, 500); c.fillStyle = C.greenL;
    c.fillText('一个网站从陌生到熟悉，就是这么个过程', W / 2, 620);
    c.restore();
  },
  sfx: [[.2, 'bloop', { f: 340 }], [1.1, 'bloop', { f: 420 }], [2.0, 'bloop', { f: 520 }],
  [2.6, 'ding', { f: 880, g: .12 }]],
};

SCENES.grow2 = {
  draw(c, s) {
    bgGrid(c, s, { alpha: .12, gap: 76 });
    // 站点星网
    const NODES = 26;
    const pos = [];
    for (let i = 0; i < NODES; i++) {
      const a = i * 2.399, r = 90 + Math.sqrt(i) * 118;
      pos.push({ x: W / 2 + Math.cos(a) * r * 1.7, y: 430 + Math.sin(a) * r * .92, i });
    }
    c.save();
    for (let i = 0; i < NODES; i++) for (let j = i + 1; j < NODES; j++) {
      const d = Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y);
      if (d > 220) continue;
      const a = ss(1.0 + i * .04, 1.3 + i * .04, s) * (1 - d / 220) * .5;
      if (a <= 0.01) continue;
      c.strokeStyle = rgba(C.green, a); c.lineWidth = 1;
      c.beginPath(); c.moveTo(pos[i].x, pos[i].y); c.lineTo(pos[j].x, pos[j].y); c.stroke();
    }
    c.restore();
    pos.forEach((p, i) => {
      const a = ss(i * .05, i * .05 + .3, s);
      if (a <= 0) return;
      const r = 5 + rnd(i) * 4;
      c.save();
      c.globalAlpha *= a;
      c.fillStyle = rnd(i * 3) > .6 ? C.greenL : C.green;
      if (rnd(i * 5) > .7) { c.shadowColor = C.green; c.shadowBlur = 14; }
      c.beginPath(); c.arc(p.x, p.y, r, 0, 7); c.fill();
      c.restore();
    });
    // 文件飞进 lib
    for (let k = 0; k < 8; k++) {
      const ph = ((s * .45 + k * .18) % 1);
      const x = W / 2 + Math.cos(k * 2.4) * 700 * (1 - ph);
      const y = 430 + Math.sin(k * 2.4) * 340 * (1 - ph);
      c.save();
      c.globalAlpha *= (1 - ph) * .8;
      c.fillStyle = rgba(C.cyan, .8);
      c.font = F(13); c.textAlign = 'center';
      c.fillText(['zhihu.js', 'x.js', 'gov.js', 'yf.js', 'tdx.js', 'osv.js', 'sub.js', 'lob.js'][k], x, y);
      c.restore();
    }
    c.save();
    c.globalAlpha *= ss(2.0, 2.6, s);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(38, 700); c.fillStyle = C.white;
    c.shadowColor = C.green; c.shadowBlur = 26;
    c.fillText('用得越多，它越熟这个互联网', W / 2, 800);
    c.restore();
  },
  sfx: [...Array.from({ length: 26 }, (_, i) => [i * .05, 'tick', { f: 800 + i * 40 }]),
  [1.0, 'rise', { f0: 260, f1: 1040, d: 1.4, g: .08 }],
  [2.2, 'ding', { f: 880, g: .14 }], [2.25, 'impact', { g: .3, f: 150 }]],
};

SCENES.endcard = {
  draw(c, s) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, 420, 60, W / 2, 420, 900);
    g.addColorStop(0, rgba(C.green, .12)); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    bgGrid(c, s, { alpha: .2, gap: 64 });
    rainField(c, s, { cell: 40, alpha: .06, col: C.greenD });

    const rev = clamp((s - .1) / .8);
    blockText(c, 'RSF', W / 2 - 3 * 34 * 6 / 2 * .5, 300, 34, s, { reveal: rev, color: C.green });

    c.save();
    const a1 = ss(.6, 1.1, s);
    c.globalAlpha *= a1;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = FC(34, 700); c.fillStyle = C.greenL;
    c.shadowColor = C.green; c.shadowBlur = 18;
    c.fillText('让 AI 借你的浏览器上网', W / 2, 600);
    c.restore();

    const a2 = ss(1.4, 2.0, s);
    c.save();
    c.globalAlpha *= a2;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(22); c.fillStyle = C.text;
    c.fillText('Recursurf  ·  52 个网站的函数库  ·  借你已登录的浏览器', W / 2, 680);
    c.restore();

    const a3 = ss(2.2, 2.8, s);
    c.save();
    c.globalAlpha *= a3;
    c.strokeStyle = rgba(C.green, .4); c.lineWidth = 1.5;
    c.strokeRect(W / 2 - 330, 740, 660, 66);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(24); c.fillStyle = C.greenL;
    c.fillText('$ npm install -g recursurf', W / 2, 774);
    c.restore();

    const a4 = ss(2.9, 3.5, s);
    c.save();
    c.globalAlpha *= a4;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(18); c.fillStyle = C.gray;
    c.fillText('rsf read <网址>   ·   rsf call <域名> <函数>   ·   rsf run -f 脚本.js', W / 2, 850);
    c.restore();

    scanBeam(c, s, { col: C.green, alpha: .1, speed: .35 });
    if (s < .3) shake(c, 20 * (1 - s / .3), 11);
  },
  sfx: [[0.1, 'impact', { g: .6, f: 100 }], [.6, 'ding', { f: 440, g: .14 }],
  [1.4, 'blip', { f: 880, g: .08 }], [2.2, 'blip', { f: 990, g: .08 }],
  [2.25, 'enter'], [3.0, 'blip', { f: 660, g: .06 }]],
};
