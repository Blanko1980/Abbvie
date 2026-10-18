#!/usr/bin/env node
/* Renders the canvas animation frame-by-frame in headless Chromium and pipes
 * the frames into ffmpeg.
 *
 *   node render.cjs --stills 0.6,9.2,15        -> out/stills/*.png
 *   node render.cjs [--fps 60] [--workers 3]   -> out/video_silent.mp4
 */
'use strict';
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function loadPlaywright() {
  try { return require('playwright'); } catch (_) {
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}
const { chromium } = loadPlaywright();

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const ROOT = __dirname;
const OUT = path.join(ROOT, 'out');
const FPS = parseInt(arg('fps', '60'), 10);
const WORKERS = parseInt(arg('workers', '3'), 10);
const TLJ = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'timeline.js'), 'utf8').split('window.TL =').pop().trim().replace(/;$/, ''));
const DURATION = parseFloat(arg('duration', String(TLJ.length)));
const URL = 'file://' + path.join(ROOT, 'index.html') + '?render=1';

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 1; });
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(URL);
  await page.evaluate(() => window.ready);
  return page;
}
async function grab(page, t) {
  const b64 = await page.evaluate(tt => { window.renderFrame(tt); return document.getElementById('c').toDataURL('image/png').slice(22); }, t);
  return Buffer.from(b64, 'base64');
}

async function stills(list) {
  const dir = path.join(OUT, 'stills');
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const page = await openPage(browser);
  for (const t of list) {
    const t0 = Date.now();
    fs.writeFileSync(path.join(dir, `f_${t.toFixed(2).padStart(6, '0')}.png`), await grab(page, t));
    console.log(`t=${t}s  ${Date.now() - t0} ms`);
  }
  await browser.close();
}

function ffmpeg(outFile) {
  const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  return p;
}
async function worker(browser, id, f0, f1) {
  const page = await openPage(browser);
  const seg = path.join(OUT, `.seg_${id}.mp4`);
  const ff = ffmpeg(seg);
  const done = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    const buf = await grab(page, f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 120 === 0) console.log(`[w${id}] frame ${f}/${f1}  ${((Date.now() - t0) / Math.max(1, f - f0)).toFixed(0)} ms/frame`);
  }
  ff.stdin.end();
  await done;
  await page.close();
  return seg;
}
async function video() {
  fs.mkdirSync(OUT, { recursive: true });
  const total = Math.round(DURATION * FPS);
  const browser = await chromium.launch();
  const per = Math.ceil(total / WORKERS);
  const segs = await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(browser, i, i * per, Math.min(total, (i + 1) * per))));
  await browser.close();
  const list = path.join(OUT, '.segs.txt');
  fs.writeFileSync(list, segs.map(s => `file '${s}'`).join('\n'));
  execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${list}" -c copy "${path.join(OUT, 'video_silent.mp4')}"`);
  segs.forEach(s => fs.unlinkSync(s)); fs.unlinkSync(list);
  console.log('wrote out/video_silent.mp4');
}

(async () => {
  const s = arg('stills');
  if (s) await stills(s.split(',').map(Number));
  else await video();
})().catch(e => { console.error(e); process.exit(1); });
