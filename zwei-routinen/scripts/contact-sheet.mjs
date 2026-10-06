#!/usr/bin/env node
// Kontaktbogen aller freigegebenen Standbilder (assets/gen/<id>.jpg) → out/contact-sheet.png
//   node scripts/contact-sheet.mjs [ausgabe.png] [--frames video.mp4 24]  (zweite Form: Einzelbilder eines Videos)
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {ASSETS} from '../assets/asset-list.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const out = path.join(ROOT, args[0] && !args[0].startsWith('--') ? args[0] : 'out/contact-sheet.png');
fs.mkdirSync(path.dirname(out), {recursive: true});

let tiles = [];
const fi = args.indexOf('--frames');
if (fi >= 0) {
  // Gleichmäßig verteilte Einzelbilder eines Videos (Stumm-Prüfung)
  const video = path.join(ROOT, args[fi + 1]);
  const n = Number(args[fi + 2] || 24);
  const frames = parseInt(execFileSync('ffprobe', ['-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', video]).toString().trim(), 10);
  const tmp = fs.mkdtempSync(path.join(ROOT, 'out/.frames-'));
  for (let k = 0; k < n; k++) {
    const f = Math.round((k + 0.5) * frames / n);
    const file = path.join(tmp, `f${String(f).padStart(4, '0')}.png`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', `select=eq(n\\,${f})`, '-vframes', '1', file]);
    tiles.push({file, label: `Frame ${f}`});
  }
} else {
  tiles = ASSETS.map((a) => ({file: path.join(ROOT, 'assets/gen', `${a.id}.jpg`), label: a.id})).filter((t) => fs.existsSync(t.file));
}

const W = 480, H = 270, LH = 30, cols = 6;
const rows = Math.ceil(tiles.length / cols);
const comps = [];
for (let i = 0; i < tiles.length; i++) {
  const x = (i % cols) * W, y = Math.floor(i / cols) * (H + LH);
  const img = await sharp(tiles[i].file).resize(W, H, {fit: 'contain', background: '#ffffff'}).toBuffer();
  comps.push({input: img, left: x, top: y + LH});
  const svg = `<svg width="${W}" height="${LH}"><text x="8" y="21" font-family="sans-serif" font-size="18" font-weight="700" fill="#25282A">${tiles[i].label}</text></svg>`;
  comps.push({input: Buffer.from(svg), left: x, top: y});
}
await sharp({create: {width: cols * W, height: rows * (H + LH), channels: 3, background: '#ffffff'}}).composite(comps).png().toFile(out);
if (fi >= 0) fs.rmSync(path.dirname(tiles[0].file), {recursive: true, force: true});
console.log(`Kontaktbogen (${tiles.length} Bilder) → ${path.relative(ROOT, out)}`);
