// 每个测试都带一个变化的"活跃标记"，避免 Chrome 把静止页面降到 1fps
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'promo-v2', 'shot');
const PORT = 9700 + Math.floor(Math.random() * 90);
const BASE = `file:///${path.join(ROOT, 'promo-v2', 'dev.html').replace(/\\/g, '/')}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const args = [`--remote-debugging-port=${PORT}`, '--window-size=1600,900', '--window-position=40,40',
  '--hide-scrollbars', '--user-data-dir=' + path.join(OUT, '.probe3'),
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
    sleep(20000).then(() => ({ result: { value: 'TIMEOUT' } })),
  ]);
  if (r?.exceptionDetails) return 'ERR ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text).split('\n')[0];
  return r?.result?.value;
};

const KICK = `const K=c=>{c.fillStyle='#0f0';c.fillRect(1800,1000,((performance.now()/8)%40)+10,10)};`;
const BODY = {
  'kicker only':        `K(c)`,
  'kicker+bgGrid':      `K(c); bgGrid(c,0,{})`,
  'kicker+strokeRect':  `K(c); c.strokeStyle='#0f0'; c.lineWidth=2; c.strokeRect(100,100,900,600)`,
  'kicker+arc x3':      `K(c); for(let i=0;i<3;i++){c.beginPath();c.arc(300+i*60,300,6,0,7);c.fillStyle='#0f0';c.fill()}`,
  'kicker+mt ascii 40': `K(c); for(let i=0;i<40;i++)mt(c,'rsf lib test bilibili.com',200,60+i*22,11,{})`,
  'kicker+mt cjk 20':   `K(c); for(let i=0;i<20;i++)mt(c,'这个网站有函数库 bilibili.com',200,60+i*22,11,{})`,
  'kicker+mt ascii glow':`K(c); for(let i=0;i<40;i++)mt(c,'rsf lib test bilibili.com',200,60+i*22,11,{glow:12})`,
  'kicker+win panel':   `K(c); win(c,100,100,900,600,{title:'rsf lib test bilibili.com'})`,
  'kicker+ROT scene':   `K(c); SCENES.rot.draw(c,3.9,{t0:121.1,t1:127.7},.6,125)`,
  'kicker+CLIP then rot':`K(c); c.save();c.beginPath();c.rect(0,0,1920,1080);c.clip();SCENES.rot.draw(c,3.9,{t0:121.1,t1:127.7},.6,125);c.restore()`,
  'kicker+ALPHA then rot':`K(c); c.save();c.globalAlpha=0.999;SCENES.rot.draw(c,3.9,{t0:121.1,t1:127.7},.6,125);c.restore()`,
  'kicker+SCALE then rot':`K(c); c.save();c.translate(960,540);c.scale(1,1);c.translate(-960,-540);SCENES.rot.draw(c,3.9,{t0:121.1,t1:127.7},.6,125);c.restore()`,
};

console.log('探针                              fps');
for (const [name, body] of Object.entries(BODY)) {
  const expr = `(async()=>{
    window.__TESTDRAW = new Function('c','s','b','u','t', ${JSON.stringify(KICK + body)});
    window.__render(125);
    let n=0; const t0=performance.now();
    const r = await new Promise(res=>{const f=()=>{n++;if(performance.now()-t0<1400)requestAnimationFrame(f);else res(+(n/1.4).toFixed(1))};requestAnimationFrame(f)});
    return r;
  })()`;
  console.log(`${name.padEnd(24)} ${await ev(expr)}`);
}

ws.close(); chrome.kill(); process.exit(0);
