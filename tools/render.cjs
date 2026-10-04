#!/usr/bin/env node
/* Lokales Render-Werkzeug (optional). Nutzt einen lokal installierten Headless-Chromium
   über Playwright und ffmpeg. Erzeugt bildgenau (nicht in Echtzeit):
     node tools/render.cjs stills 0,5.5,12.3 [ausgabeordner]   → PNG-Kontrollbilder
     node tools/render.cjs video [datei.mp4] [--crf 18] [--from s --to s] → MP4 (H.264 + AAC), 30 fps
     node tools/render.cjs audio [datei.wav]                     → nur Tonspur (WAV)
   Der Film selbst benötigt dieses Werkzeug nicht – index.html läuft direkt im Browser. */
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try {
    const root = execSync('npm root -g').toString().trim();
    return require(path.join(root, 'playwright'));
  } catch (e) {
    console.error('Playwright nicht gefunden. Installation: npm i -D playwright');
    process.exit(1);
  }
}

const ROOT = path.resolve(__dirname, '..');
const url = (q) => 'file://' + path.join(ROOT, 'index.html') + '?clean&render' + (q || '');

async function openPage() {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url());
  await page.waitForFunction(() => window.__filmReady === true, null, { timeout: 30000 });
  return { browser, page, errors };
}

async function frameData(page, t, type = 'image/png', q = 1) {
  const b64 = await page.evaluate(([t, type, q]) => {
    const F = window.FILM;
    F.renderFrame(F.player.ctx, t);
    return F.player.canvas.toDataURL(type, q).split(',')[1];
  }, [t, type, q]);
  return Buffer.from(b64, 'base64');
}

async function stills(times, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const { browser, page, errors } = await openPage();
  for (const t of times) {
    const buf = await frameData(page, t);
    const name = 't' + t.toFixed(2).padStart(6, '0') + '.png';
    fs.writeFileSync(path.join(outDir, name), buf);
  }
  await browser.close();
  if (errors.length) { console.error('Laufzeitfehler:\n' + errors.join('\n')); process.exitCode = 2; }
  console.log(`${times.length} Kontrollbilder → ${outDir}`);
}

async function audioWav(page, file) {
  const res = await page.evaluate(async () => {
    const F = window.FILM;
    const buf = await F.audio.renderOffline(48000);
    const { bytes, peak } = F.audio.toWav(buf);
    let s = '';
    const CH = 0x8000;
    for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return { b64: btoa(s), peak };
  });
  fs.writeFileSync(file, Buffer.from(res.b64, 'base64'));
  return res.peak;
}

async function video(out, crf, from = 0, to = null) {
  const { browser, page, errors } = await openPage();
  const fps = await page.evaluate(() => window.FILM.config.fps);
  const dur = await page.evaluate(() => window.FILM.config.duration);
  const tmpWav = out.replace(/\.mp4$/, '') + '.audio.wav';
  const peak = await audioWav(page, tmpWav);
  console.log('Tonspur gerendert, Spitzenpegel', peak.toFixed(3));
  const end = to == null ? dur : Math.min(to, dur);
  const f0 = Math.round(from * fps);
  const n = Math.round(end * fps) - f0;
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-ss', String(f0 / fps), '-i', tmpWav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p',
    '-tune', 'animation', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await frameData(page, (f0 + i) / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`Frame ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  fs.unlinkSync(tmpWav);
  if (errors.length) { console.error('Laufzeitfehler:\n' + errors.join('\n')); process.exitCode = 2; }
  console.log('Video →', out);
}

(async () => {
  const [mode, a, b] = process.argv.slice(2);
  if (mode === 'stills') {
    const times = (a || '0').split(',').map(Number);
    await stills(times, b || path.join(ROOT, 'qa'));
  } else if (mode === 'video') {
    const crfIdx = process.argv.indexOf('--crf');
    const crf = crfIdx > 0 ? Number(process.argv[crfIdx + 1]) : 18;
    const opt = (k) => { const i = process.argv.indexOf(k); return i > 0 ? Number(process.argv[i + 1]) : null; };
    await video(a && !a.startsWith('--') ? a : path.join(ROOT, 'export', 'der-vertraute-griff.mp4'), crf, opt('--from') || 0, opt('--to'));
  } else if (mode === 'audio') {
    const { browser, page } = await openPage();
    const peak = await audioWav(page, a || path.join(ROOT, 'export', 'tonspur.wav'));
    await browser.close();
    console.log('Ton → WAV, Spitzenpegel', peak.toFixed(3));
  } else {
    console.log('Aufruf: node tools/render.cjs stills|video|audio …');
  }
})();
