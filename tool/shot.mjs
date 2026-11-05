// 定格截图：node tool/shot.mjs 2.5 9.5 18 …
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'promo-v2', 'shot');
fs.mkdirSync(OUT, { recursive: true });

const times = process.argv.slice(2).length ? process.argv.slice(2).map(Number)
  : [2.5, 9.5, 18, 27, 52, 100, 125, 148];

const html = process.argv.includes('--index') ? 'index.html' : 'dev.html';
for (const t of times) {
  const url = `file:///${path.join(ROOT, 'promo-v2', html).replace(/\\/g, '/')}?t=${t}${process.argv.includes('--debug') ? '&debug=1' : ''}`;
  const file = path.join(OUT, `t${String(t).replace('.', '_')}.png`);
  spawnSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--screenshot=${file}`, '--window-size=1920,1080',
    '--virtual-time-budget=3500', '--user-data-dir=' + path.join(OUT, '.ch' + Date.now() + t),
    '--disk-cache-size=1', '--incognito',
    url,
  ], { stdio: 'ignore' });
  const ok = fs.existsSync(file);
  console.log(ok ? `✓ ${t}s` : `✗ ${t}s`);
}
