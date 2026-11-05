// 针对 fillText 的细粒度探针
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'promo-v2', 'shot');
const PORT = 9800 + Math.floor(Math.random() * 150);
const BASE = `file:///${path.join(ROOT, 'promo-v2', 'dev.html').replace(/\\/g, '/')}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const args = [`--remote-debugging-port=${PORT}`, '--window-size=1600,900', '--window-position=40,40',
  '--hide-scrollbars', '--user-data-dir=' + path.join(OUT, '.probe2'),
  '--disable-background-timer-throttling', '--mute-audio', 'about:blank'];
if (!process.argv.includes('--headed')) args.unshift('--headless=new');
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', args, { stdio: 'ignore' });
let targets = null;
for (let i = 0; i < 80; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch { } await sleep(150); }
const ws = new WebSocket((targets.find(t => t.type === 'page') || targets[0]).webSocketDebuggerUrl);
await new Promise(r => ws.on('open', r));
let mid = 0; const pending = new Map();
ws.on('message', d => { const m = JSON.parse(d.toString()); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(res => { const i = ++mid; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: BASE + '?t=125' });
await sleep(2200);

const ev = async (expr) => {
  const r = await Promise.race([
    send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }),
    sleep(15000).then(() => ({ result: { value: 'TIMEOUT' } })),
  ]);
  if (r?.exceptionDetails) return 'ERR: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text).split('\n')[0];
  return r?.result?.value;
};

const FPS = `const fps=()=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<1200)requestAnimationFrame(f);else r(+(n/1.2).toFixed(1))};requestAnimationFrame(f)});`;

const cases = [
  ['baseline', `SKIP.scene=SKIP.hud=SKIP.subs=true; window.__TESTDRAW=null;`],
  ['12x fillText same', `SKIP.scene=true;SKIP.hud=true;SKIP.subs=true;window.__TESTDRAW=(c)=>{c.font='400 20px "Cascadia Mono", monospace';c.fillStyle='#0f0';for(let i=0;i<12;i++)c.fillText('rsf lib test bilibili.com',200,100+i*30)};`],
  ['12x fillText align', `window.__TESTDRAW=(c)=>{c.font='400 20px "Cascadia Mono", monospace';c.fillStyle='#0f0';c.textAlign='left';c.textBaseline='middle';for(let i=0;i<12;i++)c.fillText('rsf lib test bilibili.com',200,100+i*30)};`],
  ['12x save/restore', `window.__TESTDRAW=(c)=>{for(let i=0;i<12;i++){c.save();c.restore()}};`],
  ['12x fontset only', `window.__TESTDRAW=(c)=>{for(let i=0;i<12;i++){c.font='400 20px "Cascadia Mono", monospace'}};`],
  ['12x cjk fillText', `window.__TESTDRAW=(c)=>{c.font='400 20px "Microsoft YaHei UI","Microsoft YaHei","PingFang SC",sans-serif';c.fillStyle='#0f0';for(let i=0;i<12;i++)c.fillText('这个网站有函数库 bilibili.com',200,100+i*30)};`],
  ['12x cjk perchar', `window.__TESTDRAW=(c)=>{c.font='400 20px "Microsoft YaHei UI", sans-serif';c.fillStyle='#0f0';c.textAlign='center';c.textBaseline='middle';const s2='这个网站有函数库 bilibili.com';for(let i=0;i<12;i++)for(let k=0;k<s2.length;k++)c.fillText(s2[k],200+k*13,100+i*30)};`],
  ['12x cjk fontfits', `window.__TESTDRAW=(c)=>{c.font='400 20px sans-serif';c.fillStyle='#0f0';for(let i=0;i<12;i++)c.fillText('这个网站有函数库 bilibili.com',200,100+i*30)};`],
  ['1x huge fillText', `window.__TESTDRAW=(c)=>{c.font='700 120px "Cascadia Mono", monospace';c.fillStyle='#0f0';c.fillText('RSF RECURSURF',100,400)};`],
];

console.log('探针                          fps');
for (const [name, setup] of cases) {
  const r = await ev(`(async()=>{${FPS} eval(${JSON.stringify(setup)}); window.__render(125); return await fps();})()`);
  console.log(`${name.padEnd(28)} ${r}`);
}

console.log('\nsave/restore 平衡：');
const bal = await ev(`(()=>{let s=0,r=0;const _s=CanvasRenderingContext2D.prototype.save,_r=CanvasRenderingContext2D.prototype.restore;
CanvasRenderingContext2D.prototype.save=function(){s++;return _s.call(this)};
CanvasRenderingContext2D.prototype.restore=function(){r++;return _r.call(this)};
window.__TESTDRAW=null;SKIP.scene=false;SKIP.hud=false;SKIP.subs=false;
window.__render(125);window.__render(4);window.__render(15);
CanvasRenderingContext2D.prototype.save=_s;CanvasRenderingContext2D.prototype.restore=_r;
return {save:s,restore:r,diff:s-r}})()`);
console.log(bal);

ws.close(); chrome.kill(); process.exit(0);
