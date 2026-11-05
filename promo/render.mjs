// 把 index.html 逐帧渲染成视频（显卡加速：Chrome 用 GPU 画 canvas，ffmpeg 用 NVENC 编码）
// 用法：node render.mjs [--w 2560 --h 1440 --fps 60 --workers 8 --codec h264|hevc|av1 --cq 18 --from 0 --to 秒 --out out/recursurf_1440p.mp4]
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const A = { w: 2560, h: 1440, fps: 60, workers: 8, codec: 'h264', cq: 18, from: 0, to: null, out: 'out/recursurf_1440p.mp4', chrome: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }
for (let i = 2; i < process.argv.length; i += 2) {
  const k = process.argv[i].replace(/^--/, ''), v = process.argv[i + 1]
  A[k] = typeof A[k] === 'number' || k === 'to' ? parseFloat(v) : v
}
const OUT = path.resolve(ROOT, A.out), TMP = path.join(path.dirname(OUT), '_tmp')
fs.mkdirSync(TMP, { recursive: true })
const URL_ = pathToFileURL(path.join(ROOT, 'index.html')).href + '?render'
const ENC = { h264: 'h264_nvenc', hevc: 'hevc_nvenc', av1: 'av1_nvenc' }[A.codec]
const WARM = 30   // 每段开头多画几帧不录，让"余辉"效果进入稳定状态

const browser = await chromium.launch({
  executablePath: A.chrome, headless: true,
  args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--autoplay-policy=no-user-gesture-required'],
})

async function openPage() {
  const page = await browser.newPage({ viewport: { width: A.w, height: A.h }, deviceScaleFactor: 1 })
  page.on('pageerror', e => console.error('[page]', e.message))
  await page.goto(URL_)
  await page.waitForFunction(() => document.title === 'CAPTURE')
  await page.evaluate(async () => {
    await document.fonts.ready
    const st = document.createElement('style')
    st.textContent = '* { transition: none !important; } #progress { opacity: .55 !important; }'
    document.head.appendChild(st)
    // 字幕：原版用 setTimeout + CSS 过渡淡入淡出，这里改成按时间算透明度（逐帧确定）
    const C = TL.cues, zh = $('sub-zh'), en = $('sub-en')
    const endOf = i => { const c = C[i], n = C[i + 1]; return c.t + c.dur + (n ? Math.min(.6, Math.max(0, n.t - (c.t + c.dur) - .05)) : .6) }
    function subAt(t) {
      let fade = null
      for (let i = 0; i < C.length; i++) {
        const s = C[i].t - .05, e = endOf(i)
        if (t >= s && t < e) {
          const contiguous = i > 0 && endOf(i - 1) >= s - .02
          const d = t - s
          if (d < .09) return contiguous ? [C[i - 1], 1 - d / .18] : [C[i], 0]
          return [C[i], contiguous ? Math.min(1, .5 + (d - .09) / .09 * .5) : Math.min(1, (d - .09) / .18)]
        }
        if (t >= e && t < e + .18) fade = [C[i], 1 - (t - e) / .18]
      }
      return fade || [null, 0]
    }
    const anims = () => document.getAnimations()
    window.__frame = (t, draw = true) => {
      R.t = t
      render(ctx, t, cv, bloom)
      if (!draw) return
      hud(t)
      const [c, op] = subAt(t)
      if (c) { if (zh.textContent !== c.zh) { zh.textContent = c.zh; en.textContent = c.en } }
      zh.style.opacity = en.style.opacity = c ? op : 0
      zh.classList.remove('hide'); en.classList.remove('hide')
      for (const a of anims()) { a.pause(); a.currentTime = t * 1000 }   // 录制灯闪烁、CRT 闪烁也跟着时间轴走
    }
  })
  return page
}

// ---------- 1. 音频：用 OfflineAudioContext 一次性离线合成（旁白 + BGM + 音效） ----------
async function renderAudio(total) {
  const page = await openPage()
  const bytes = await page.evaluate(async total => {
    // 一次把几万个节点全排进一个 OfflineAudioContext 会极慢（每个节点每个渲染块都要过一遍），
    // 所以切成 10 秒一块，每块往前多算 6 秒（预卷），让长音、回声、压缩器状态接上，再把预卷切掉
    const SR = 48000, CHUNK = 10, PRE = 6, n = Math.ceil(total * SR)
    const L = new Float32Array(n), Rr = new Float32Array(n)
    let decoded = null
    for (let a = 0; a < total; a += CHUNK) {
      const b = Math.min(total, a + CHUNK), s0 = Math.max(0, a - PRE)
      const oc = new OfflineAudioContext(2, Math.round((b - s0) * SR), SR)
      auInit(oc); AU.live.clear()
      if (!decoded) { await auLoad(); decoded = AU.buf } else AU.buf = decoded
      AU.t0 = 0; AU.base = s0; AU.playing = true          // atime(t) = t - s0
      for (const c of TL.cues) {
        if (c.t >= b || c.t + c.dur <= s0) continue
        if (c.t >= s0) voStart(c)
        else { const src = oc.createBufferSource(); src.buffer = AU.buf[c.id]; src.connect(AU.vo); src.start(0, s0 - c.t) }
      }
      for (const s of TL.sfx) if (s.t >= s0 && s.t < b) SFX[s.name] && SFX[s.name](s.t - s0, s.o)
      for (let i = Math.ceil(s0 / STEP); i * STEP < b; i++) musicStep(i, i * STEP - s0)
      let last = -1   // 有旁白时压低音乐（和 auTick 里一样的规则）
      for (let f = Math.round(s0 * 60); f / 60 < b; f++) {
        const t = f / 60, speaking = TL.cues.some(c => t > c.t - .15 && t < c.t + c.dur + .1)
        const v = musicLevel(t) * (speaking ? .32 : 1) * .5
        if (v !== last) { AU.music.gain.setTargetAtTime(v, t - s0, .12); last = v }
      }
      const buf = await oc.startRendering()
      const skip = Math.round((a - s0) * SR), off = Math.round(a * SR)
      const cl = buf.getChannelData(0).subarray(skip), cr = buf.getChannelData(1).subarray(skip)
      const m = Math.min(cl.length, n - off)
      L.set(cl.subarray(0, m), off); Rr.set(cr.subarray(0, m), off)
    }
    const out = new DataView(new ArrayBuffer(44 + n * 4)), w = (o, s) => [...s].forEach((ch, i) => out.setUint8(o + i, ch.charCodeAt(0)))
    w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true)
    out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, SR, true); out.setUint32(28, SR * 4, true)
    out.setUint16(32, 4, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 4, true)
    for (let i = 0; i < n; i++) {
      out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true)
      out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, Rr[i])) * 32767, true)
    }
    window.__wav = new Uint8Array(out.buffer)
    return window.__wav.length
  }, total)
  const parts = [], CH = 4 << 20
  for (let o = 0; o < bytes; o += CH) {
    parts.push(Buffer.from(await page.evaluate(([o, CH]) => {
      const a = window.__wav.subarray(o, o + CH); let s = ''
      for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000))
      return btoa(s)
    }, [o, CH]), 'base64'))
  }
  await page.close()
  const f = path.join(TMP, 'audio.wav'); fs.writeFileSync(f, Buffer.concat(parts)); return f
}

// ---------- 2. 画面：几个标签页并行，各渲染一段，直接管道喂给 NVENC ----------
async function renderSegment(idx, f0, f1, progress) {
  const page = await openPage(), cdp = await page.context().newCDPSession(page)
  const seg = path.join(TMP, `seg${idx}.mp4`)
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(A.fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', ENC, '-preset', 'p6', '-tune', 'hq', '-rc', 'vbr', '-cq', String(A.cq), '-b:v', '0', '-maxrate', '80M', '-bufsize', '160M',
    '-bf', '0', '-g', String(A.fps * 2), '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', seg],
    { stdio: ['pipe', 'inherit', 'inherit'] })
  const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))))
  for (let f = Math.max(0, f0 - WARM); f < f0; f++) await page.evaluate(t => __frame(t, false), f / A.fps)
  for (let f = f0; f < f1; f++) {
    await page.evaluate(t => __frame(t), f / A.fps)
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95, optimizeForSpeed: true })
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r))
    progress()
  }
  ff.stdin.end(); await done; await page.close()
  return seg
}

const probe = await openPage()
const total = await probe.evaluate(() => TL.total)
const err = await probe.evaluate(() => window.__err || '')
await probe.close()
if (err) console.warn('页面报错：', err)
const t0 = Math.max(0, A.from), t1 = Math.min(total, A.to ?? total)
const F0 = Math.round(t0 * A.fps), F1 = Math.round(t1 * A.fps), N = F1 - F0
console.log(`全片 ${total.toFixed(2)}s，渲染 ${t0}–${t1.toFixed(2)}s，${A.w}x${A.h}@${A.fps}，${N} 帧，${A.workers} 路并行，编码 ${ENC}`)

const T = Date.now()
const audioP = renderAudio(total).then(f => { console.log(`\n音频合成完成 ${((Date.now() - T) / 1000).toFixed(1)}s`); return f })
let doneN = 0
const tick = () => {
  doneN++
  if (doneN % 30 === 0 || doneN === N) {
    const el = (Date.now() - T) / 1000, sp = doneN / el
    process.stdout.write(`\r画面 ${doneN}/${N}  ${sp.toFixed(1)} fps  剩余约 ${((N - doneN) / sp / 60).toFixed(1)} 分钟   `)
  }
}
const W = Math.max(1, Math.min(A.workers, Math.ceil(N / 60)))
const segs = await Promise.all(Array.from({ length: W }, (_, i) =>
  renderSegment(i, F0 + Math.floor(N * i / W), F0 + Math.floor(N * (i + 1) / W), tick)))
const wav = await audioP
await browser.close()

// ---------- 3. 拼接 + 混入音频 ----------
const list = path.join(TMP, 'list.txt')
fs.writeFileSync(list, segs.map(s => `file '${s.replace(/\\/g, '/')}'`).join('\n'))
await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
  '-ss', String(t0), '-t', String(t1 - t0), '-i', wav,
  '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', OUT],
  { stdio: 'inherit' }).on('close', c => c === 0 ? res() : rej(new Error('mux exit ' + c))))
fs.rmSync(TMP, { recursive: true, force: true })
console.log(`\n完成：${OUT}  （${((Date.now() - T) / 60000).toFixed(1)} 分钟）`)
