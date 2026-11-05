// 图元级性能探针：同一套管线，只换一个绘制动作，比 fps。
// node tool/probe.mjs [--headed]
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'promo-v2', 'shot');
const PORT = 9500 + Math.floor(Math.random() * 300);
const BASE = `file:///${path.join(ROOT, 'promo-v2', 'dev.html').replace(/\\/g, '/')}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const args = [`--remote-debugging-port=${PORT}`, '--window-size=1600,900', '--window-position=40,40',
  '--hide-scrollbars', '--user-data-dir=' + path.join(OUT, '.probe'),
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--mute-audio', 'about:blank'];
if (!process.argv.includes('--headed')) args.unshift('--headless=new');
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', args, { stdio: 'ignore' });

let targets = null;
for (let i = 0; i < 80; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch { }
  await sleep(150);
}
const ws = new WebSocket((targets.find(t => t.type === 'page') || targets[0]).webSocketDebuggerUrl);
await new Promise(r => ws.on('open', r));
let mid = 0; const pending = new Map();
ws.on('message', d => { const m = JSON.parse(d.toString()); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(res => { const i = ++mid; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: BASE + '?t=125' });
await sleep(2200);

const evalJS = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, timeout: 60000 });
  if (r?.exceptionDetails) return { err: r.exceptionDetails.exception?.description || r.exceptionDetails.text };
  return r?.result?.value;
};

const CASES = {
  'empty':            `()=>{}`,
  'fillRect 400x300': `c=>{c.fillStyle='#123';c.fillRect(0,0,400,300)}`,
  'fullscreen fill':  `c=>{c.fillStyle='#123';c.fillRect(0,0,1920,1080)}`,
  'strokeRect':       `c=>{c.strokeStyle='#0f0';c.lineWidth=2;c.strokeRect(100,100,600,400)}`,
  'mt ascii 12':      `c=>{for(let i=0;i<12;i++)mt(c,'rsf lib test bilibili.com',200,100+i*30,13,{})}`,
  'mt ascii+glow':    `c=>{for(let i=0;i<12;i++)mt(c,'rsf lib test bilibili.com',200,100+i*30,13,{glow:12})}`,
  'mt cjk 12':        `c=>{for(let i=0;i<12;i++)mt(c,'这个网站有函数库 bilibili.com',200,100+i*30,13,{})}`,
  'mt cjk+glow':      `c=>{for(let i=0;i<12;i++)mt(c,'这个网站有函数库 bilibili.com',200,100+i*30,13,{glow:12})}`,
  'shadowBlur rect':  `c=>{c.shadowColor='#0f0';c.shadowBlur=20;c.fillStyle='#0f0';c.fillRect(100,100,200,100);c.shadowBlur=0}`,
  'bgGrid':           `c=>bgGrid(c,0,{})`,
  'rainField':        `c=>rainField(c,0.5,{cell:26})`,
  'clip+fill':        `c=>{c.save();c.beginPath();c.rect(0,0,1920,1080);c.clip();c.fillStyle='#123';c.fillRect(0,0,400,300);c.restore()}`,
  'globalAlpha fill': `c=>{c.save();c.globalAlpha=0.5;c.fillStyle='#123';c.fillRect(0,0,400,300);c.restore()}`,
  'scale(1.1) fill':  `c=>{c.save();c.translate(960,540);c.scale(1.1,1.1);c.translate(-960,-540);c.fillStyle='#123';c.fillRect(0,0,400,300);c.restore()}`,
  'globalAlpha .8 p1':`c=>{c.save();c.globalAlpha=0.8;c.fillStyle='#123';c.fillRect(0,0,400,300);c.restore()}`,
};

const fpsExpr = (body) => `(async()=>{
  window.__TESTDRAW = eval(${JSON.stringify(body)});
  window.__render(125);
  const r = await new Promise(res=>{let n=0;const t0=performance.now();
    const f=()=>{n++;if(performance.now()-t0<1500)requestAnimationFrame(f);else res(+(n/1.5).toFixed(1))};
    requestAnimationFrame(f)});
  return r;
})()`;

console.log('探针                     fps');
for (const [name, body] of Object.entries(CASES)) {
  const r = await evalJS(fpsExpr(body));
  console.log(`${name.padEnd(22)} ${typeof r === 'number' ? r.toFixed(1) : JSON.stringify(r).slice(0, 160)}`);
}

await evalJS('window.__TESTDRAW=null');
ws.close(); chrome.kill(); process.exit(0);
