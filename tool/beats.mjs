// 全片分镜表。narr = 旁白，sub = 字幕关键词，lead/tail = 配音前后留白，odd = 纯视觉 beat 的固定时长
// 时间轴由 gen.mjs 根据 TTS 实测时长算出，绝不手写秒数。

export const BEATS = [
  // ===== 冷开场：三个钩子，不解释 =====
  { id: 'h0', act: 'hook', v: 'boot', dur: 1.6,
    narr: '', sub: [] },

  { id: 'h1', act: 'hook', v: 'wall',
    narr: 'AI 想上网查点东西，第一件事就是碰壁。',
    sub: ['AI 上网，处处碰壁'], lead: 0.35, tail: 1.1 },

  { id: 'h2', act: 'hook', v: 'onecmd',
    narr: '换一条命令。',
    sub: ['换一条命令'], lead: 0.15, tail: 1.4 },

  { id: 'h3', act: 'hook', v: 'collapse',
    narr: '二十三万字符的网页，压成两千字。',
    sub: ['231,447 字符 → 2,140 字'], lead: 0.25, tail: 1.2 },

  { id: 'h4', act: 'hook', v: 'pipe',
    narr: '三百条评论在管道里飞驰而过，模型只看见三条。',
    sub: ['300 条流过', '3 条留下'], lead: 0.25, tail: 1.3 },

  { id: 'h5', act: 'hook', v: 'title', dur: 3.0,
    narr: '', sub: [] },

  // ===== 第一幕：痛 =====
  { id: 'p1', act: 'pain', v: 'ask',
    narr: '你让 AI 帮你查一句话，昨晚发的那个新模型，大家都怎么评价？',
    sub: ['你让 AI 查一句话', '那个新模型，大家都怎么评价？'], lead: 0.5, tail: 0.9 },

  { id: 'p2', act: 'pain', v: 'brick',
    narr: '它去 X，要登录。去知乎，弹验证码。Reddit 直接给个四零三。',
    sub: ['X 要登录', '知乎验证码', 'Reddit 403'], lead: 0.4, tail: 1.1 },

  { id: 'p3', act: 'pain', v: 'flood',
    narr: '好不容易打开一页，几十万字符的网页灌进来，上下文当场爆掉。',
    sub: ['几十万字符灌进来', '上下文当场爆掉'], lead: 0.4, tail: 1.1 },

  { id: 'p4', act: 'pain', v: 'sorry',
    narr: '最后它只能跟你说，抱歉，我访问不了这些网站。',
    sub: ['「抱歉，我访问不了这些网站」'], lead: 0.4, tail: 1.4 },

  { id: 'p5', act: 'pain', v: 'behind',
    narr: '可这些网站，你浏览器里明明全都登录着。',
    sub: ['这些网站', '你浏览器里明明全都登录着'], lead: 0.5, tail: 1.6 },

  // ===== 第二幕：一句话 =====
  { id: 's1', act: 'turn', v: 'surf',
    narr: 'Recursurf 就干一件事，让 AI 借你的浏览器上网。',
    sub: ['让 AI 借你的浏览器上网'], lead: 0.4, tail: 1.4 },

  { id: 's2', act: 'turn', v: 'six',
    narr: '同一句话再问一遍。这回它同时去 X、Reddit、Hacker News、知乎、B 站、V2EX 搜一圈。',
    sub: ['同一句话再问一遍', '六个站，同时搜'], lead: 0.35, tail: 1.3 },

  { id: 's3', act: 'turn', v: 'report',
    narr: '回来给你一份报告，哪儿在夸，哪儿在骂，跑分和实测哪里对不上，每条都带出处。',
    sub: ['哪儿在夸', '哪儿在骂', '每条都带出处'], lead: 0.35, tail: 1.3 },

  { id: 's4', act: 'turn', v: 'scenes',
    narr: '查线上故障，看新手机口碑，查某只股票今天为什么涨停，都是一句话的事。',
    sub: ['故障 / 口碑 / 涨停', '都是一句话的事'], lead: 0.3, tail: 1.2 },

  // ===== 第三幕：rsf read =====
  { id: 'r1', act: 'read', v: 'cmd',
    narr: '先说最常用的那条命令，rsf read。',
    sub: ['rsf read'], lead: 0.35, tail: 0.9 },

  { id: 'r2', act: 'read', v: 'squeeze',
    narr: '一个 B 站视频页，原始网页二十三万字符，读完之后两千字左右，该有的都在。',
    sub: ['231,447 字符', '→ 2,140 字'], lead: 0.35, tail: 1.2 },

  { id: 'r3', act: 'read', v: 'cards',
    narr: '标题、作者、播放数据、评论有多少条、怎么展开，一眼能看完。',
    sub: ['标题 / 作者 / 数据', '评论数 / 怎么展开'], lead: 0.3, tail: 1.1 },

  { id: 'r4', act: 'read', v: 'grep',
    narr: '长文章你只关心其中几件事，就加个 grep，它只给你命中的段落。',
    sub: ['--grep', '只给命中的段落'], lead: 0.35, tail: 1.1 },

  { id: 'r5', act: 'read', v: 'offset',
    narr: '每段前面那个位置编号，是它在全文里的坐标。想接着读，就从那儿跳过去。',
    sub: ['〔@6831〕= 全文坐标', '--offset 6831 接着读'], lead: 0.35, tail: 1.2 },

  { id: 'r6', act: 'read', v: 'libhint',
    narr: '我觉得最有用的是结尾那几行。读完页面，它顺手告诉你，这个网站有哪些现成的函数。',
    sub: ['最有用的是结尾那几行', '这个网站有哪些现成函数'], lead: 0.4, tail: 1.5 },

  { id: 'r7', act: 'read', v: 'noguess',
    narr: 'AI 不用猜下一步能干什么。',
    sub: ['AI 不用猜下一步'], lead: 0.2, tail: 1.3 },

  // ===== 第四幕：lib 函数库 =====
  { id: 'l1', act: 'lib', v: 'tree',
    narr: '这些函数就是普通的 JS 文件，一个网站一个，放在 lib 目录下。',
    sub: ['lib/<域名>.js'], lead: 0.35, tail: 1.1 },

  { id: 'l2', act: 'lib', v: 'sig',
    narr: '函数签名本身，就是说明书。',
    sub: ['函数签名即说明书'], lead: 0.3, tail: 1.5 },

  { id: 'l3', act: 'lib', v: 'test',
    narr: '注释里写的例子，是真会跑的。跑一遍 lib test，就知道哪些函数坏了。',
    sub: ['@example 真会跑', 'lib test'], lead: 0.3, tail: 1.4 },

  { id: 'l4', act: 'lib', v: 'rot',
    narr: '网站改版了呢？函数会抛一个 CHANGED。agent 当场重新取数，顺手把那个函数改掉。',
    sub: ['网站改版 → CHANGED', 'agent 自己修好'], lead: 0.35, tail: 1.4 },

  { id: 'l5', act: 'lib', v: 'codes',
    narr: '错误码是统一的：要登录、被拦、空了、改版了。AI 看到那个 code，就知道下一步该干什么。',
    sub: ['NEED_LOGIN / BLOCKED', 'EMPTY / CHANGED'], lead: 0.35, tail: 1.3 },

  { id: 'l6', act: 'lib', v: 'note',
    narr: '文件开头还有站点笔记，接口怎么调，哪里有坑。踩过一次的坑，不用踩第二次。',
    sub: ['站点笔记', '踩过的坑，不用再踩'], lead: 0.3, tail: 1.3 },

  // ===== 第五幕：管道 =====
  { id: 'c1', act: 'pipe', v: 'split',
    narr: '接下来是更关键的一件事：取数，不经过模型。',
    sub: ['取数，不经过模型'], lead: 0.4, tail: 1.2 },

  { id: 'c2', act: 'pipe', v: 'tokens',
    narr: '现在常见的做法是工具调用，每调一次，结果都回到模型上下文里。',
    sub: ['工具调用', '结果全回上下文'], lead: 0.3, tail: 1.2 },

  { id: 'c3', act: 'pipe', v: 'tokens2',
    narr: '你要取五个站的评论做交叉分析，就是五份原始结果全灌进去。token 全花在数据上。',
    sub: ['五份原始结果全灌进去', 'token 花在数据上'], lead: 0.3, tail: 1.2 },

  { id: 'c4', act: 'pipe', v: 'flow',
    narr: '管道不是。中间数据在进程之间流，模型只看见最后那一小段。',
    sub: ['中间数据在进程之间流', '模型只看见最后一小段'], lead: 0.3, tail: 1.2 },

  { id: 'c5', act: 'pipe', v: 'cmdpipe',
    narr: '搜五个视频，评论一条条通过管道，模型只发了一次命令，只看见三条评论。',
    sub: ['一次命令', '只看见三条'], lead: 0.3, tail: 1.3 },

  { id: 'c6', act: 'pipe', v: 'count',
    narr: 'token 花在指令上，不是花在数据上。',
    sub: ['token 花在指令上'], lead: 0.3, tail: 1.4 },

  { id: 'c7', act: 'pipe', v: 'daemon',
    narr: '能这么串，是因为每条命令都是跑完就退的进程，状态都在后台的 daemon 里。串十段也不会把登录态和标签串丢。',
    sub: ['一次性进程', '状态在 daemon 里'], lead: 0.35, tail: 1.4 },

  // ===== 第六幕：跨站调研 =====
  { id: 'x1', act: 'research', v: 'rewind',
    narr: '现在把开头那件事，慢放一遍。',
    sub: ['把开头那件事，慢放一遍'], lead: 0.4, tail: 1.3 },

  { id: 'x2', act: 'research', v: 'spread',
    narr: '第一步，广撒网。六个网站同时搜，一个站挂了不影响别的。结果规整成同一种格式。',
    sub: ['① 广撒网', '六站并行，一挂不影响其他'], lead: 0.35, tail: 1.3 },

  { id: 'x3', act: 'research', v: 'skip',
    narr: 'B 站搜出来一堆上一代模型的旧视频，看一眼标题就跳过。',
    sub: ['旧视频，看一眼跳过'], lead: 0.3, tail: 1.2 },

  { id: 'x4', act: 'research', v: 'dig',
    narr: '第二步，挑着深挖。搜索结果里总混着跑题的帖子，按标题挑出真正相关的几条，拉评论，拉正文。',
    sub: ['② 挑着深挖', '只拉真正相关的那几条'], lead: 0.35, tail: 1.3 },

  { id: 'x5', act: 'research', v: 'conflict',
    narr: '评论区里说法正好相反：有人说吊打一切，有人说是在刷榜。',
    sub: ['「吊打一切」', '「就是在刷榜」'], lead: 0.3, tail: 1.4 },

  { id: 'x6', act: 'research', v: 'primary',
    narr: '第三步，一手资料。官方技术报告、公开榜单、网友的独立复测。',
    sub: ['③ 一手资料', '报告 / 榜单 / 独立复测'], lead: 0.3, tail: 1.2 },

  { id: 'x7', act: 'research', v: 'final',
    narr: '第四步，写报告。矛盾的说法摆在一起，每一条都带出处。',
    sub: ['④ 写报告', '矛盾说法并列，每条带出处'], lead: 0.3, tail: 1.4 },

  { id: 'x8', act: 'research', v: 'files',
    narr: '中间结果全写进文件，哪一步都能单独重跑，上下文也不会被撑爆。',
    sub: ['中间结果落盘', '哪一步都能单独重跑'], lead: 0.3, tail: 1.4 },

  // ===== 第七幕：原理 =====
  { id: 'y1', act: 'how', v: 'start',
    narr: '最后简单说一下它是怎么做到的。办法很土：不另起一个浏览器，借你平时用的那个。',
    sub: ['不另起浏览器', '借你平时用的那个'], lead: 0.4, tail: 1.1 },

  { id: 'y2', act: 'how', v: 'cli',
    narr: '你敲一条命令，这条命令是个一次性进程，跑完就退。它把活交给后台常驻的 daemon。',
    sub: ['CLI 一次性进程', '→ daemon 常驻'], lead: 0.3, tail: 1.2 },

  { id: 'y3', act: 'how', v: 'plugin',
    narr: 'daemon 通过浏览器插件，在你浏览器里开一个后台标签，不抢你的焦点。登录用的是你的，所以对网站来说，来的就是你本人。',
    sub: ['插件 → chrome.debugger', '后台标签，带着你的登录'], lead: 0.3, tail: 1.4 },

  { id: 'y4', act: 'how', v: 'back',
    narr: '页面加载完，daemon 把它压成几行文字，交回 AI 手里。',
    sub: ['压成几行，交回 AI'], lead: 0.3, tail: 1.2 },

  { id: 'y5', act: 'how', v: 'why',
    narr: '为什么非得插件？因为 Chrome 一百三十六之后，默认用户目录不吃远程调试端口了。想复用日常浏览器的登录态，只能走插件。',
    sub: ['Chrome 136+ 只能走插件'], lead: 0.3, tail: 1.3 },

  { id: 'y6', act: 'how', v: 'keep',
    narr: '要长期留着的东西全归 daemon 管。CLI 退不退都不影响，下次按编号，还能把同一个标签要回来。',
    sub: ['标签 t5 跨进程保留'], lead: 0.3, tail: 1.3 },

  // ===== 收尾 =====
  { id: 'z1', act: 'end', v: 'grow',
    narr: '一个网站从陌生到熟悉，大概是这么个过程。',
    sub: ['越用越熟'], lead: 0.35, tail: 1.3 },

  { id: 'z2', act: 'end', v: 'grow2',
    narr: '摸通的网站存成函数，做过的流程存成脚本。用得越多，它越熟这个互联网。',
    sub: ['用得越多，越熟这个互联网'], lead: 0.3, tail: 1.5 },

  { id: 'z3', act: 'end', v: 'endcard', dur: 6.0,
    narr: 'Recursurf。让 AI 借你的浏览器上网。', sub: ['让 AI 借你的浏览器上网'], lead: 0.5, tail: 2.2 },
];
