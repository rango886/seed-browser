// CDP 驱动器：一个 Chrome 实例，反复定格 → 截图，或跑性能基准。
// 用法：
//   node tool/cdp.mjs shot 1.1 4.3 10.5 ...
//   node tool/cdp.mjs bench
//   node tool/cdp.mjs eval "TL.length"
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'promo-v2', 'shot');
fs.mkdirSync(OUT, { recursive: true });

const PORT = 9333 + Math.floor(Math.random() * 200);
const HTML = process.argv.includes('--index') ? 'index.html' : 'dev.html';
const BASE = `file:///${path.join(ROOT, 'promo-v2', HTML).replace(/\\/g, '/')}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const HEADED = process.argv.includes('--headed');
const chromeArgs = [
  `--remote-debugging-port=${PORT}`,
  '--window-size=1600,900',
  '--window-position=40,40',
  '--hide-scrollbars',
  '--user-data-dir=' + path.join(OUT, '.cdp'),
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--allow-file-access-from-files',
  '--mute-audio',
  'about:blank',
];
if (!HEADED) chromeArgs.unshift('--headless=new');
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', chromeArgs, { stdio: 'ignore' });

let targets = null;
for (let i = 0; i < 80; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch { }
  await sleep(150);
}
const page = targets.find(t => t.type === 'page') || targets[0];
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.on('open', r));

let mid = 0;
const pending = new Map();
ws.on('message', d => {
  const m = JSON.parse(d.toString());
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise(res => { const i = ++mid; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: BASE + '?t=0' });
await sleep(2200);

const mode = process.argv[2] || 'shot';
const args = process.argv.slice(3);

if (mode === 'bench') {
  const r = await send('Runtime.evaluate', { expression: 'JSON.stringify(__bench(0.1))', returnByValue: true });
  const v = r?.result?.value;
  if (!v) { console.error('bench failed', JSON.stringify(r).slice(0, 400)); }
  else {
    const o = JSON.parse(v);
    console.log(`\n平均 ${o.avg}ms/帧   共 ${o.frames} 帧   总耗时 ${o.totalMs}ms`);
    console.log(`${o.avg < 8.3 ? '✓ 120Hz 够用' : o.avg < 16.6 ? '△ 只能 60Hz' : '✗ 会掉帧'}\n`);
    console.log('最慢的场景：');
    for (const x of o.worst) console.log(`  ${x.v.padEnd(10)} avg ${String(x.avg).padStart(6)}ms   p95 ${String(x.p95).padStart(6)}   max ${String(x.max).padStart(7)}`);
    console.log('\n全部：');
    for (const x of o.all) console.log(`  ${x.v.padEnd(10)} ${String(x.avg).padStart(6)}ms`);
  }
} else if (mode === 'eval') {
  const fileArg = args.find(a => a.startsWith('--file='));
  const expr = fileArg ? fs.readFileSync(fileArg.slice(7), 'utf8')
    : args.filter(a => !a.startsWith('--')).join(' ');
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  console.log(JSON.stringify(r?.result?.value ?? r, null, 1));
} else {
  const times = args.filter(a => !a.startsWith('--')).map(Number);
  const t0 = Date.now();
  for (const t of times) {
    await send('Runtime.evaluate', { expression: `__render(${t})` });
    await sleep(90);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    if (shot?.data) {
      const f = path.join(OUT, `t${String(t).replace('.', '_')}.png`);
      fs.writeFileSync(f, Buffer.from(shot.data, 'base64'));
      process.stdout.write('.');
    } else process.stdout.write('x');
  }
  console.log(`\n${times.length} 张，用时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

ws.close();
chrome.kill();
process.exit(0);
