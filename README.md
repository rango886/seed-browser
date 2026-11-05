# seed-browser：让 AI agent 借你的浏览器上网

宣传片在 [`promo/index-single.html`](promo/index-single.html)，clone 下来双击就能看；懒得 clone 就点[在线版](https://raw.githack.com/rango886/seed-browser/main/promo/index-single.html)。

---

## 先说两个要点

**取数不经过模型。** 每条命令输出一行一条 JSON，可以互相串：

```bash
seed-browser call bilibili.com search 电影解说 --limit 5 | seed-browser call bilibili.com comments - --limit 3
```

中间那几百条评论在进程之间流，模型只看最后 3 条。工具调用那一套是每个结果都要回到模型上下文里，token 花在数据上；这里是模型只下指令，token 花在指令上。而且每段命令都是跑完就退的进程，状态在 daemon 里，串十段也不会把登录态和标签串丢。

**站点函数会腐烂。** 所以每个函数都带一个能真跑的 `@example`，`seed-browser lib test` 跑一遍就知道哪些失效了；网站改版会抛 `CHANGED`，agent 自己重新取数，顺手把那个函数改掉。

## 1. AI 上网，处处碰壁

你让 AI 帮你查一句话：“昨晚发的那个 xxx 模型，大家都怎么评价？”

它去 X，要登录。去知乎，弹验证码。Reddit 直接 403。好不容易打开一页，几十万字符的 HTML 灌进来，上下文当场爆掉。最后它只能跟你说：抱歉，我访问不了这些网站。

可这些网站，你浏览器里明明全都登录着。

seed-browser 干的事就一件：让 AI 借你的浏览器上网。

## 2. 装上之后

同一句话再问一遍。这回它借你的浏览器，同时去 X、Reddit、HN、知乎、B 站、V2EX 搜一圈，回来给你一份报告：哪儿在夸、哪儿在骂、跑分和实测哪里对不上，每条都带出处。

别的活也一样。查线上故障（“全挂了，是不是云服务出事了”）、看新手机口碑、查某只股票今天为什么涨停，都是一句话的事。

## 3. 原理：跟着一条命令走一遍

办法很土，不另起一个浏览器，借你平时用的那个。

比如 AI 想读一条知乎回答，它敲的就是这一条：

```bash
seed-browser read https://www.zhihu.com/question/xxxx -b
```

这条命令是这么走的：

```
 AI agent
  │  seed-browser read …（一次性进程，跑完就退出）
  ▼
 CLI ──RPC──▶ daemon（后台常驻，第一次用时自动启动）
                │  WebSocket
                ▼
              浏览器插件（装在你日常用的 Chrome / Edge / Vivaldi 里）
                │  chrome.debugger
                ▼
              你的浏览器里开一个后台标签，带着你的登录状态打开页面
```

1. CLI 把命令交给 daemon。
2. daemon 通过插件，在你的浏览器里开个后台标签，不抢你的焦点。
3. 页面在你的浏览器里加载，登录用的是你的，所以对网站来说，来的就是你本人。
4. daemon 把几十万字符的页面压成几行文字，交回 AI 手里。

要长期留着的东西全归 daemon 管：浏览器连接、开着的标签、元素编号、网络记录。CLI 是跑完就退的一次性进程，它退不退都不影响这些，下次按编号（`t5` 这种）还能把同一个标签要回来。

> 为什么非得插件：Chrome 136 之后，默认用户目录不吃 `--remote-debugging-port` 了，想复用日常浏览器的登录态就只能走插件。插件用 `chrome.debugger` 把 CDP 转出来，能力跟直连 CDP 一样。不想动自己的浏览器也行，`seed-browser browser launch` 起一个专用的（可以无头），两种模式对上层是同一套接口。

## 4. seed-browser read：一个网页讲了什么

这是最常用的命令。一个 B 站视频页，原始 HTML 二十三万字符，read 完两千字左右，该有的都在：

```
$ seed-browser read https://www.bilibili.com/video/BV1GJ411x7h7 -b
# 【官方 MV】Never Gonna Give You Up - Rick Astley
https://www.bilibili.com/video/BV1GJ411x7h7/
type: video · via: lib:bilibili.com · author: 索尼音乐中国 · published: 2019-12-31 23:43

video:
  bvid: BV1GJ411x7h7
  duration: 3:33
  up: 索尼音乐中国 (mid 486906719)
  stat: 播放 107145243 · 点赞 2951744 · 投币 1282325 · 收藏 1552657 · 评论 237317

分段（seed-browser read --section <id>）：
  - comments: 评论（237317 条，按热度）（按需加载）
  - related: 相关推荐（40 个）

这个网站有函数库 bilibili.com（seed-browser call bilibili.com <函数> [参数]）：
  search(keyword, { limit = 20, type = 'video', order = 'totalrank' } = {})  — 搜索视频
  comments(id, { limit = 50, sort = 'hot' } = {})  — 视频评论。sort：hot 热门 / time 最新
  subtitles(id, { lang = '', text = false } = {})  — 视频字幕，按时间一句一行
  summary(id)  — B 站官方的 AI 视频总结：摘要 + 带时间点的提纲
  … 共 17 个函数
```

标题、作者、播放数据、评论有多少条、怎么展开，一眼能看完。

长文章只关心其中几件事，就加 `--grep '关键词1|关键词2'`，它只给你命中的段落，还标出这段在全文的位置（`〔@6831〕`），想接着读就 `--offset 6831` 跳过去。

我觉得最有用的是结尾那几行：读完页面，它顺手告诉 AI 这个网站有哪些现成的函数，AI 不用猜下一步能干什么。

```bash
seed-browser read <网址>          # 后台开标签，读完关掉
seed-browser read -t t5 -b        # 读已打开的标签，只看概要和分段
seed-browser read -s comments     # 展开某一段
seed-browser read --grep '思考模式|测试集' -C 0
seed-browser read --offset 6000   # 接着往下读
```

提取顺序是这样：这个域名的函数库里有 `read` 就用它；没有就走通用提取，先把结构化数据（meta / JSON-LD / `__NEXT_DATA__`）挑出来，然后是正文（Readability → Markdown）、列表（识别重复结构）、大纲。

## 5. 站点函数库：`lib/<域名>.js`

每个网站的常用功能就是一个普通 JS 文件，导出几个 async 函数：

```js
/* 站点笔记（B 站）：评论接口的 oid 要用 aid，不是 bvid … */

/** 视频评论。sort：hot 热门 / time 最新
 *  @example comments('BV1GJ411x7h7', { limit: 20 }) */
export async function comments(id, { limit = 50, sort = 'hot' } = {}) {
  const tab = await seedBrowser.tab('bilibili.com')     // 复用你已登录的 B 站标签，没有就后台开一个
  const v = await tab.fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${id}`)
  …
  await seedBrowser.sleep(300)                          // 翻页之间停 300ms，不然会被风控
}
```

几句说明：

- 函数签名本身就是说明书。`limit = 50` 是数字，`full = false` 是开关，帮助信息从签名和注释生成，不用再声明一遍 args 和 opts。
- 注释里写的例子是真会跑的。`seed-browser lib test bilibili.com` 把每个 `@example` 执行一遍，告诉你哪些坏了。
- 站点笔记写在文件最开头：接口怎么调、哪里有坑（签名、风控码、字段什么意思）。`seed-browser lib list bilibili.com` 时会显示出来，踩过一次的坑不用踩第二次。
- 错误码是统一的：`NEED_LOGIN` / `BLOCKED` / `EMPTY` / `NOT_FOUND` / `CHANGED`，AI 看到 code 就知道该干什么。
- 找文件的顺序：`<项目>/.seed-browser/lib/` → `~/.seed-browser/lib/` → 仓库 `lib/`，先找完整域名，再找上一级。

```bash
seed-browser lib list                                   # 有哪些网站
seed-browser lib list bilibili.com                      # 签名、说明、例子、站点笔记
seed-browser lib test bilibili.com                      # 跑一遍 @example
seed-browser call bilibili.com comments BV1GJ411x7h7 --limit 20
```

内置 50 多个网站，装了就能用（`seed-browser lib list` 看全部，带登录要求标记）：

| 分类 | 网站 |
|---|---|
| 搜索 | `google.com`（含新闻、联想词、热搜、Trends）、`bing.com`、`duckduckgo.com`、`baidu.com` |
| 学术 / AI | `arxiv.org`、`semanticscholar.org`、`openreview.net`、`huggingface.co`、`aistudio.google.com` |
| 技术社区 | `news.ycombinator.com`、`reddit.com`、`github.com`、`stackoverflow.com`、`v2ex.com`、`linux.do`、`medium.com`、`x.com`、`lobste.rs`、`producthunt.com` |
| 视频 | `youtube.com`（含评论、字幕）、`bilibili.com`（含字幕、AI 总结、下载）、`douyin.com` |
| 中文资讯 / 社交 | `weibo.com`、`zhihu.com`、`xiaohongshu.com`、`toutiao.com`、`weixin.qq.com`、`36kr.com` |
| 外文新闻 / 参考 | `reuters.com`、`bloomberg.com`、`bbc.com`、`substack.com`、`wikipedia.org`、`archive.org` |
| 金融 | `xueqiu.com`、`eastmoney.com`、`sina.com.cn`、`10jqka.com.cn`、`tdx.com.cn`、`finance.yahoo.com`、`barchart.com`、`binance.com`、`coingecko.com` |
| 包和漏洞 | `npmjs.com`、`pypi.org`、`crates.io`、`nvd.nist.gov`、`osv.dev` |
| 政策 | `gov.cn`（国务院 / 部委文件列表、全文搜索、正文和附件） |

写函数库的细节见 [docs/lib.md](docs/lib.md)。

## 6. 亲手操作：没有接口的活，一页页去填

有些活没有接口，只能填表。比如发版上架，三个应用市场，三套不一样的表单，要填的资料散在 `release/v2.4` 文件夹里。AI 先把文件读一遍，然后开工。

先找标签、看页面。`seed-browser tab list` 找到你开着的三个后台，`seed-browser snapshot` 看一眼页面，每个输入框都带编号，哪些必填一眼就看得出来。

```
$ seed-browser snapshot -i -t t192
- textbox "* 版本号" [ref=e2]
- spinbutton "* 版本代码" [ref=e3]
- textbox "* 更新说明" [ref=e4]
- combobox "* 应用分类" [ref=e5]: 请选择 {options: 效率办公 | 学习教育 | 实用工具}
- button "* 应用截图（3–5 张）" [ref=e8]: 未选择任何文件
- button "提交审核" [ref=e11]
```

填就一条命令，传截图也是：

```bash
seed-browser fill e2=2.4.0 e3=240 e4=@更新说明.md e5=效率办公 -t t192
seed-browser upload e8 截图/01.png 截图/02.png 截图/03.png -t t192
```

它不瞎猜。按名字点“提交审核”，页面上有两个，它把候选都列出来，不替你挑：

```
✗ [AMBIGUOUS] getByRole('button', { name: "提交审核" }) 匹配到 2 个元素
  → 候选：
    1. button "提交审核"  (标题栏)
    2. button "提交审核"  (底部操作栏)
```

操作完还会告诉你发生了什么。换成编号点，返回值直接说弹了确认框、页面跳走了：

```
$ seed-browser click e11 -t t192
ok: true
changes:
  url: https://dev.xinghe-store.com/…/review/XH-20261013-0042
  navigated: soft
  dialogs:
    - "confirm: 确认提交审核？… (accepted)"
```

编号过期它会提醒。三步向导点完“下一步”，旧编号就作废了，它让 AI 重新 snapshot，而不是点错地方：

```
✗ [STALE_REF] 编号 e1 无效：当前页面还没有 snapshot，或页面已经跳转
  → 先执行 `seed-browser snapshot` 获取新编号
```

每个错误都带错误码和下一步该做什么（`→` 后面那行）。这些输出其实是写给 AI 看的。

其它给 AI 准备的细节：

- 目标元素四种写法：编号 `e15`、CSS 选择器（能穿透 open shadow DOM）、`getByRole(...)` / `getByLabel(...)` / `getByText(...)`。
- 页面局部重绘之后，旧编号会按“角色 + 名字 + 第几个”自动重新找，结果里会注明“重新定位过”。
- 带点击事件的 div / li 在 snapshot 里显示成 `clickable`，也有编号；canvas、地图这类用 `mouse click x y`。
- 点之前会检查有没有被遮罩挡住，挡了就直接说是谁挡的（`COVERED`）。
- `upload` 的目标可以是“点了会弹选文件窗口”的按钮；`click --download` 会等下载完成，返回文件路径。

### 录下来，写成脚本

整个过程可以用 trace 录：点了哪、填了什么、最后提交给了哪个接口。

```bash
seed-browser trace start publish --goal "拾光笔记上架：三家应用市场"
# … snapshot / fill / upload / click（AI 操作，或者你自己在浏览器里点一遍）
seed-browser trace stop          # 自动生成调查报告 ~/.seed-browser/traces/publish/report.md
```

报告里有操作时间线、每一步触发了哪些接口、数据来自哪个接口的哪个字段、签名和翻页参数从哪来。AI 照着报告写成 `publish.js`，下次发版一条命令三家一起填完：

```bash
seed-browser run -f publish.js release/v2.5
```

详见 [docs/trace.md](docs/trace.md)。

## 7. 组合：函数能串起来用

函数和函数之间可以用管道接。B 站搜出来的视频一行一条，直接流进下一个函数，评论就出来了：

```bash
seed-browser call bilibili.com search "xxx模型 实测" --limit 2 | seed-browser call bilibili.com comments - --limit 3 -o table
seed-browser call bilibili.com rank 知识 --limit 10 | seed-browser call bilibili.com video - -o csv > 知识区.csv
```

这里我想说一下为什么把它做成管道：走管道，数据就不经过模型。

现在常见的做法是工具调用那一种，每调一次，结果都回到模型上下文里。你要取 5 个站的评论做交叉分析，就是 5 份原始结果全灌进上下文，token 全花在数据上。

管道不是。中间数据在进程之间流，模型只看到最后那一小段：

```bash
seed-browser call bilibili.com search 电影解说 --limit 5 | seed-browser call bilibili.com comments - --limit 3
```

这条命令模型只发了一次，B 站返回的几百条评论它一条没看见，只看见 3 条。token 花在指令上，不是花在数据上。

能这么串，是因为每段命令都是跑完就退的一次性进程，状态都在 daemon 里，串十段也不会把登录态和标签串丢。每一步的结果还能落成文件，想重跑哪一步就重跑哪一步。

要更自由的组合，就用 `seed-browser run` 写几行 JS，几个网站随便拼：

```bash
seed-browser run 'await seedBrowser.tabs()'
seed-browser run 'const t = await seedBrowser.tab("zhihu.com"); return t.fetch("https://www.zhihu.com/api/v4/me")'
seed-browser run -f step1.js
```

代码按 ES 模块执行，能顶层 `await`、能 `import node:fs`，`return` 的值会打印出来；结果太大就写到 `~/.seed-browser/out/`，只打印摘要和路径。全局有个 `seedBrowser`：

```js
seedBrowser.tab('t5') / seedBrowser.tab('zhihu.com')    seedBrowser.open(url)    seedBrowser.tabs()    seedBrowser.read(url)    seedBrowser.lib('reddit.com').search('x')
tab.eval(fn) tab.fetch(url) tab.click(目标) tab.fill(目标, 文字) tab.snapshot() tab.waitResponse(...) …
for await (const res of tab.collect('/api/search', { more: () => tab.scroll() })) { … }   // 带签名的接口：让网站自己发请求，接住返回
```

## 8. 跨站调研：把开头那件事慢放一遍

回到开头那个问题，AI 是这么一步步查清楚的：

1. 广撒网：6 个网站同时搜（`Promise.allSettled`，一个站挂了不影响别的），结果规整成同一种格式。B 站搜出来一堆上一代模型的旧视频，看一眼标题就跳过。
2. 深挖讨论：说法正好相反，有人说吊打一切，有人说是在刷榜。
3. 查一手资料：官方技术报告、公开榜单、网友的独立复测。
4. 写报告：矛盾的说法摆在一起，每一条都带出处。

中间结果全写进文件（`posts.json`、`threads.json` 这些），哪一步都能单独重跑，上下文也不会被撑爆。完整示例见 [skill/seed-browser/examples/cross-site-research](skill/seed-browser/examples/cross-site-research)。

## 9. 越用越熟

一个网站从陌生到熟悉，大概是这么个过程：

```
seed-browser read 看一眼 → seed-browser run 里试（tab.eval 看页面数据、seed-browser net log 找接口、tab.fetch 调一下）
             → 试通了存成 ~/.seed-browser/lib/<域名>.js → 以后 seed-browser call / seedBrowser.lib() 直接用
```

摸通的网站存成函数，做过的流程存成脚本，用得越多它越熟这个互联网。

---

## 安装

需要 Node 22.18+（直接运行 `.ts`），推荐 Node 24。

```bash
npm install
npm link            # 之后就能直接用 seed-browser（或者 node bin/seed-browser.js）
```

连你日常用的浏览器（推荐这个）：打开 `chrome://extensions` → 开“开发者模式” → “加载已解压的扩展程序” → 选 `extension/` 目录。想同时连多个浏览器或多个 profile，在插件设置里给它们各起个名字。升级 seed-browser 之后记得回扩展页点一下“重新加载”。

不想动自己的浏览器，就用专用的：

```bash
seed-browser browser launch            # 独立 profile，存在 ~/.seed-browser/profiles/seed-browser，登录一次就一直在
seed-browser browser launch ci --headless
```

接到 AI agent 上：把 [`skill/seed-browser/`](skill/seed-browser/SKILL.md) 扔进你 agent 的 skills 目录（Claude Code、pi 这些认 SKILL.md 的都行），它遇到要上网的活就自己会用 `seed-browser`。

## 命令一览

`seed-browser help` 看全部，`seed-browser <命令> --help` 看详情。所有命令都支持 `-t <标签>` 和 `-o text|json|yaml|jsonl|csv|table`。

| 分类 | 命令 |
|---|---|
| 浏览器 | `browser list / launch / connect / disconnect` |
| 标签 | `tab list / open / use / close / activate / current`，标签组 `group list / create / update / ungroup`（插件模式） |
| 看页面 | `read [网址]`、`snapshot`、`find`、`shot`、`eval`、`console`、`dialogs`、`cookies` |
| 操作 | `goto back forward reload click fill type press select check uncheck hover scroll upload drag wait` |
| 按坐标 / 按住键 | `mouse click / move / down / up / wheel / drag`、`key down / up` |
| 函数库 / 脚本 | `run`、`call`、`lib list`、`lib test` |
| 注入 / 网络 | `inject add / list / rm`、`net log / show / wait / clear`、`net route add / list / rm` |
| 录制 | `trace start / mark / add / stop / list / digest / show / find / rm` |
| 其它 | `cdp <method> [json]`（直接发 CDP，逃生通道） |

## 目录

```
bin/seed-browser.js               入口
src/cli/                命令解析、输出格式、seed-browser run（run.ts）、seed-browser call / lib list（call.ts）、lib test（libtest.ts）
src/sdk/                全局 seedBrowser 对象和 Tab 类（index.ts）、函数库加载和签名解析（lib.ts）
src/daemon/             daemon：注册表、会话、snapshot、元素定位（locate.ts）、操作、read
src/daemon/drivers/     插件驱动 / CDP 驱动
src/inject/extract.js   注入页面的通用提取器
src/daemon/trace.ts     trace 录制
src/trace/digest.ts     调查报告：去噪、归纳、数据溯源、参数溯源
extension/              浏览器插件（MV3）
lib/                    内置函数库（_ 开头的是共享代码）
skill/seed-browser/         给 AI agent 用的 skill（SKILL.md + 跨站调研示例）
promo/                  宣传片（HTML + 合成旁白），index-single.html 是单文件版
docs/                   设计文档、函数库和 trace 的详细说明
test/                   端到端测试（npm test）
```

## 测试

```bash
npm test     # 启动本地测试站点 + 无头 Chrome，跑端到端测试
```

## 还没做的

- 跨域 iframe（OOPIF）的 snapshot 和点击。要先实测插件模式下 `chrome.debugger` 能不能往子 session 发命令，Vivaldi 上也要试。
- 后台标签防降速。现在 seed-browser 后台开的标签会打开 `Emulation.setFocusEmulationEnabled`（`SEED_BROWSER_NO_FOCUS_EMULATION=1` 关掉），在懒加载页面上效果怎么样还要实测，必要时再加 `Page.setWebLifecycleState`。
- 写操作确认、标签归属和借用、按域名的隐私策略，标签编号跨重启不变。

设计思路见 [docs/design.md](docs/design.md)。
