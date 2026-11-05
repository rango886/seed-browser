// 生成旁白音频 + 时间轴。
// 顺序是刻意的：先配音、量出真实时长，再让动画去适配，绝不反过来。
import { BEATS } from './beats.mjs';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'promo-v2', 'audio');
const RAW = path.join(OUT, 'raw');
const CACHE = path.join(OUT, '_cache.json');
const AC = 'V:/software/AI/audio-cpp';
const FFMPEG = 'V:/software/Tools/ffmpeg/bin/ffmpeg.exe';
const FFPROBE = 'V:/software/Tools/ffmpeg/bin/ffprobe.exe';

const REF = '大家好，今天的训练也要全力以赴哦。记住，无论是跑步还是学习，保持良好的节奏最重要。让我们一起朝着梦想奔跑吧！相信只要努力，一定能创造属于自己的记录。加油！';

fs.mkdirSync(RAW, { recursive: true });
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

const dur = (f) => parseFloat(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim());

const jobs = BEATS.filter(b => b.narr && b.narr.trim());
let made = 0;
for (const b of jobs) {
  const key = crypto.createHash('sha1').update(b.narr).digest('hex').slice(0, 12);
  const raw = path.join(RAW, `${b.id}.wav`);
  if (cache[b.id] === key && fs.existsSync(raw)) continue;
  process.stdout.write(`tts ${b.id} … `);
  const r = spawnSync(path.join(AC, 'audiocpp_cli.exe'), [
    '--task', 'tts', '--family', 'omnivoice',
    '--model', 'models\\OmniVoice-GGUF', '--backend', 'cuda', '--language', 'zh',
    '--voice-ref', 'manbo_ref.wav',
    '--request-option', `reference_text=${REF}`,
    '--request-option', 'speed=1.04',
    '--text', b.narr, '--out', raw,
  ], { cwd: AC, encoding: 'utf8' });
  if (!fs.existsSync(raw)) { console.error('FAILED\n' + r.stdout + r.stderr); process.exit(1); }
  cache[b.id] = key;
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  console.log('ok');
  made++;
}
console.log(`\n生成 ${made} 条，缓存 ${jobs.length - made} 条\n`);

// 去首尾静音 + 转 mp3（内联用）
const lens = {};
for (const b of jobs) {
  const raw = path.join(RAW, `${b.id}.wav`);
  const clean = path.join(OUT, `${b.id}.wav`);
  const mp3 = path.join(OUT, `${b.id}.mp3`);
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-i', raw,
    '-af', 'silenceremove=start_periods=1:start_silence=0.03:start_threshold=-45dB:stop_periods=-1:stop_silence=0.06:stop_threshold=-45dB',
    '-ac', '1', '-ar', '24000', clean]);
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-i', clean, '-ac', '1', '-ar', '24000', '-b:a', '64k', mp3]);
  lens[b.id] = +dur(clean).toFixed(3);
}

// —— 时间轴：配音说了多久，这一拍就有多长 ——
let t = 0;
const TL = [];
for (const b of BEATS) {
  const a = lens[b.id] ?? 0;
  const has = a > 0;
  const lead = b.lead ?? 0.35, tail = b.tail ?? 1.0;
  const d = has ? lead + a + tail : b.dur;
  const t0 = t, t1 = t + d;

  // 字幕在配音区间内按字数分配（念到哪儿，字幕就跟着到哪儿）
  const subs = [];
  if (b.sub?.length && has) {
    const ws = b.sub.map(s => s.replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '').length || 1);
    const sum = ws.reduce((x, y) => x + y, 0);
    let c = t0 + lead;
    b.sub.forEach((text, i) => {
      const seg = (a * ws[i]) / sum;
      subs.push({ text, t0: c, t1: c + seg });
      c += seg;
    });
  } else if (b.sub?.length) {
    b.sub.forEach((text, i) => {
      const seg = d / b.sub.length;
      subs.push({ text, t0: t0 + i * seg, t1: t0 + (i + 1) * seg });
    });
  }

  TL.push({ id: b.id, act: b.act, v: b.v, t0: +t0.toFixed(3), t1: +t1.toFixed(3),
    audio: has ? { id: b.id, at: +(t0 + lead).toFixed(3), dur: a } : null, subs });
  t = t1;
}

fs.writeFileSync(path.join(ROOT, 'promo-v2', 'timeline.js'),
  'window.TL=' + JSON.stringify(TL.map(x => ({ ...x, subs: x.subs.map(s => ({ ...s, t0: +s.t0.toFixed(3), t1: +s.t1.toFixed(3) })) }))) + ';\n' +
  'window.TOTAL=' + t.toFixed(3) + ';\n');

// 对照表，方便人工核对节奏
console.log('id     start  dur   audio   字幕');
for (const x of TL) {
  const m = Math.floor(x.t0 / 60), s = (x.t0 % 60).toFixed(1).padStart(4, '0');
  console.log(`${x.id.padEnd(5)} ${m}:${s}  ${(x.t1 - x.t0).toFixed(2).padStart(5)}  ${(x.audio?.dur ?? 0).toFixed(2).padStart(5)}  ${x.subs.map(y => y.text).join(' | ')}`);
}
console.log(`\n总时长 ${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}  （${TL.length} 拍）`);
