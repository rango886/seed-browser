// 打包：把时间轴、音频（base64）、渲染代码全部塞进一个 index.html，双击就能看。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const P = (...a) => path.join(ROOT, 'promo-v2', ...a);

const tpl = fs.readFileSync(P('template.html'), 'utf8');
const tl = fs.readFileSync(P('timeline.js'), 'utf8');
const audioDir = P('audio');
const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));

let total = 0;
const AUD = files.map(f => {
  const buf = fs.readFileSync(path.join(audioDir, f));
  total += buf.length;
  return JSON.stringify(f.replace('.mp3', '')) + ':' + JSON.stringify(buf.toString('base64'));
}).join(',\n');

const SCRIPTS = ['gfx.js', 'scenes-a.js', 'scenes-b.js', 'engine.js']
  .map(f => fs.readFileSync(P('js', f), 'utf8')).join('\n');

const inline = [
  '<script>', tl, '</script>',
  '<script>window.AUDIO={', AUD, '};</script>',
  '<script>', SCRIPTS, '</script>',
  '<script>boot();</script>',
].join('\n');

const out = tpl.split('<!--INJECT:SCRIPTS-->').join(inline);
fs.writeFileSync(P('index.html'), out);

// 开发版：外部引用，改一行不用重新打包
const dev = tpl.split('<!--INJECT:SCRIPTS-->').join([
  '<script src="timeline.js"></script>',
  '<script>window.AUDIO={', AUD, '};</script>',
  '<script src="js/gfx.js"></script>',
  '<script src="js/scenes-a.js"></script>',
  '<script src="js/scenes-b.js"></script>',
  '<script src="js/engine.js"></script>',
  '<script>boot();</script>',
].join('\n'));
fs.writeFileSync(P('dev.html'), dev);

console.log(`index.html  ${(fs.statSync(P('index.html')).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`  音频 ${files.length} 条 / ${(total / 1024 / 1024).toFixed(2)} MB → base64 ${(total * 1.37 / 1024 / 1024).toFixed(2)} MB`);
console.log(`  dev.html 同步生成`);
