// 用真实输入事件启动，验证音频时钟是否推进（只能用真手势解除 autoplay 限制）
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'promo-v2', 'shot');
const PORT = 9400 + Math.floor(Math.random() * 90);
const BASE = `file:///${path.join(ROOT, 'promo-v2', process.argv.includes('--index') ? 'index.html' : 'dev.html').replace(/\\/g, '/')}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const args = [`--remote-debugging-port=${PORT}`, '--window-size=1920,1080', '--window-position=30,30',
  '--hide-scrollbars', '--user-data-dir=' + path.join(OUT, '.play'),
  '--autoplay-policy=no-user-gesture-required',
  '--disable-background-timer-throttling', '--mute-audio', 'about:blank'];
if (!process.argv.includes('--headed')) args.unshift('--headless=new');
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', args, { stdio: 'ignore' });
let targets = null;
for (let i = 0; i < 80; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch { } await sleep(150); }
const ws = new WebSocket((targets.find(t => t.type === 'page') || targets[0]).webSocketDebuggerUrl);
await new Promise(r => ws.on('open', r));
let mid = 0; const pending = new Map();
ws.on('message', d => { const m = JSON.parse(d.toString()); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); } });
const send = (m, p = {}) => new Promise(res => { const i = ++mid; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: BASE });
await sleep(2500);
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;

const r = await ev(`(()=>{const b=document.getElementById('start').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 });

const tracks = [];
for (let i = 0; i < 8; i++) {
  await sleep(1000);
  tracks.push(await ev('window.__t ? window.__t() : "na"'));
}
console.log('时间轴推进:', tracks.join('  '));
const st = await ev(`(()=>{const a=document.getElementById('cv');return {veil:document.getElementById('veil').classList.contains('gone'), w:a.width}})()`);
console.log('状态:', JSON.stringify(st));

// 截两张，看画面有没有变
for (const [i, wait] of [[0, 0], [1, 10]]) {
  await sleep(1000 + wait * 100);
}
const shot = await send('Page.captureScreenshot', { format: 'png' });
if (shot?.data) { (await import('node:fs')).writeFileSync(path.join(OUT, 'play.png'), Buffer.from(shot.data, 'base64')); console.log('截图 play.png'); }

ws.close(); chrome.kill(); process.exit(0);
