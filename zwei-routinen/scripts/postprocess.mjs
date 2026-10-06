#!/usr/bin/env node
// Nachbearbeitung der Gemini-Bilder → assets/processed + public/img (für Remotion).
//   - Hochskalieren auf mind. 2880 px lange Kante (Lanczos)
//   - plate:   Alpha per Flood-Fill vom Rand (Toleranz ≈ 8 zu Weiß), 1 px weich, beschnitten
//   - overlay: KI-Bearbeitung eines Grundbilds → nur die veränderten Bereiche als weich maskierte Ebene
//              (gemeinsame Maske je Gruppe, damit Posen sauber ineinander überblenden)
//   - brush:   Grauer Pinselstrich → Alpha aus Helligkeit (Code färbt ihn Gold)
//   - Farbleck-Check: Teal (195–215°, S > 35 %) bzw. Gold (45–55°, S > 80 %) auf > 0,5 % der Nicht-Haut-Pixel → Fehler
// Ergebnis: src/data/assets.json (Positionen, Größen) und assets/processed/qa.json
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GEN = path.join(ROOT, 'assets/gen');
const OUT = path.join(ROOT, 'assets/processed');
const PUB = OUT; // public/img ist ein Verweis auf assets/processed
const LONG = 2880;
fs.mkdirSync(OUT, {recursive: true});
fs.mkdirSync(PUB, {recursive: true});

// ------------------------------------------------------------ Verarbeitungsplan
// deck: deckendes Bild. plate: Flood-Fill. group: Pose-Ebenen über einem Grundbild (base),
// tight = enge Maske für Ebenen, die im Code bewegt werden. screen: Magenta-Bildschirm ausstanzen.
const PLAN = [
  {deck: ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B4', 'B5', 'DESK', 'C6C11', 'C13', 'C14', 'C15', 'D2']},
  {screen: 'B3'},
  {group: 'B2', base: 'B1', members: ['B2']},
  {group: 'C1', base: 'B3', members: ['C1']},
  {group: 'C3', base: 'B4', members: ['C3', 'C3b'], tight: true},
  {group: 'C4w', base: 'B4', members: ['C4w', 'C4wb'], tight: true},
  {group: 'C4', base: 'B4', members: ['C4', 'C5']},
  {group: 'C15doc', base: 'C15', members: ['C10', 'C9'], split: [0, 0.5]},
  {group: 'C15pat', base: 'C15', members: ['C15b'], split: [0.5, 1]},
  {group: 'C8', base: 'DESK', members: ['C8'], tight: true},
  {group: 'C12', base: 'DESK', members: ['C12'], tight: true},
  {group: 'C16', base: 'DESK', members: ['C16'], tight: true},
  {group: 'C7', base: 'DESK', members: ['C7']},
  {plate: ['C2', 'C17', 'C18']},
  {brush: 'D1'},
];

// ------------------------------------------------------------ Bildhilfen
async function load(id) {
  const file = path.join(GEN, `${id}.jpg`);
  if (!fs.existsSync(file)) return null;
  const img = sharp(file).removeAlpha();
  const m = await img.metadata();
  const s = LONG / Math.max(m.width, m.height);
  const w = Math.round(m.width * Math.max(1, s)), h = Math.round(m.height * Math.max(1, s));
  const {data} = await img.resize(w, h, {kernel: 'lanczos3'}).raw().toBuffer({resolveWithObject: true});
  return {data, w, h};
}
const saveJpg = (im, name) => sharp(im.data, {raw: {width: im.w, height: im.h, channels: 3}}).jpeg({quality: 90}).toFile(path.join(PUB, name));
function rgba(rgb, alpha, w, h, crop) {
  const {x0, y0, x1, y1} = crop || {x0: 0, y0: 0, x1: w, y1: h};
  const cw = x1 - x0, ch = y1 - y0;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const si = (y + y0) * w + (x + x0), di = (y * cw + x) * 4;
    out[di] = rgb[si * 3]; out[di + 1] = rgb[si * 3 + 1]; out[di + 2] = rgb[si * 3 + 2];
    out[di + 3] = Math.round(alpha[si] * 255);
  }
  return {out, cw, ch};
}
const savePng = (buf, w, h, name) => sharp(buf, {raw: {width: w, height: h, channels: 4}}).webp({quality: 90, alphaQuality: 100}).toFile(path.join(PUB, name.replace(/\.png$/, '.webp')));
function bbox(alpha, w, h, thr = 0.004, pad = 2) {
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (alpha[y * w + x] > thr) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return {x0: Math.max(0, x0 - pad), y0: Math.max(0, y0 - pad), x1: Math.min(w, x1 + 1 + pad), y1: Math.min(h, y1 + 1 + pad)};
}
// Maske weichzeichnen (sharp-Blur auf Graustufen)
async function blurMask(mask, w, h, sigma) {
  if (sigma < 0.3) return mask;
  const buf = Buffer.from(mask.map((v) => Math.round(v * 255)));
  const out = await sharp(buf, {raw: {width: w, height: h, channels: 1}}).blur(sigma).raw().toBuffer();
  return Float32Array.from(out, (v) => v / 255);
}
// Dilatation ≈ Weichzeichnen + niedrige Schwelle
async function dilate(mask, w, h, r) {
  const b = await blurMask(mask, w, h, r / 2);
  return b.map((v) => (v > 0.02 ? 1 : 0));
}

// ------------------------------------------------------------ Farbleck-Check
function hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let hh = 0;
  if (d > 0) hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(hh * 60 + 360) % 360, mx ? d / mx : 0, mx];
}
const isSkin = (h, s, v) => h <= 50 && s >= 0.15 && s <= 0.75 && v >= 0.2;
function leakCheck(data, w, h, alpha) {
  let n = 0, teal = 0, gold = 0;
  for (let i = 0; i < w * h; i += 2) { // jedes zweite Pixel genügt
    if (alpha && alpha[i] < 0.5) continue;
    const [hh, s, v] = hsv(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
    if (isSkin(hh, s, v)) continue;
    n++;
    if (v > 0.15 && hh >= 195 && hh <= 215 && s > 0.35) teal++;
    if (v > 0.15 && hh >= 45 && hh <= 55 && s > 0.8) gold++;
  }
  return {teal: (teal / n) * 100, gold: (gold / n) * 100, ok: teal / n <= 0.005 && gold / n <= 0.005};
}

// ------------------------------------------------------------ Verarbeitung
const meta = {};
const qa = {};
const check = (id, im, alpha) => { qa[id] = leakCheck(im.data, im.w, im.h, alpha); };

async function deck(id) {
  const im = await load(id);
  if (!im) return;
  await saveJpg(im, `${id}.jpg`);
  meta[id] = {src: `img/${id}.jpg`, w: im.w, h: im.h};
  check(id, im);
}

async function screen(id) {
  const im = await load(id);
  if (!im) return;
  const {data, w, h} = im;
  // Magenta-Anteil → Alpha 0 (Bildschirm wird im Code eingesetzt)
  const alpha = new Float32Array(w * h);
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const m = Math.min(r, b) - g;
    const bg = Math.min(1, Math.max(0, (m - 60) / 140));
    alpha[i] = 1 - bg;
    if (bg > 0.5) { const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  // Trapez: Kanten in 20 % / 80 % Höhe messen, auf Ober-/Unterkante extrapolieren
  const ext = (y) => { let a = -1, b = -1; for (let x = 0; x < w; x++) if (alpha[y * w + x] < 0.5) { if (a < 0) a = x; b = x; } return [a, b + 1]; };
  const ya = Math.round(y0 + (y1 - y0) * 0.2), yb = Math.round(y0 + (y1 - y0) * 0.8);
  const [la, ra] = ext(ya), [lb, rb] = ext(yb);
  const L = (y) => la + (lb - la) * (y - ya) / (yb - ya), R = (y) => ra + (rb - ra) * (y - ya) / (yb - ya);
  const quad = [[L(y0), y0], [R(y0), y0], [R(y1), y1], [L(y1), y1]].map(([x, y]) => [Math.round(x * 10) / 10, y]);
  // Bildschirmfläche dunkel füllen, damit auch die Vorschau (JPG) sauber ist
  const rgb = Buffer.from(data);
  for (let i = 0; i < w * h; i++) if (alpha[i] < 1) {
    const a = alpha[i];
    for (let c = 0; c < 3; c++) {
      const col = a > 0.01 ? (data[i * 3 + c] - (1 - a) * [255, 0, 255][c]) / a : 0;
      rgb[i * 3 + c] = Math.round(Math.max(0, Math.min(255, col)) * a + 22 * (1 - a));
    }
  }
  const {out} = rgba(rgb, alpha, w, h);
  await savePng(out, w, h, `${id}.png`);
  await saveJpg({data: rgb, w, h}, `${id}.jpg`);
  meta[id] = {src: `img/${id}.webp`, preview: `img/${id}.jpg`, w, h, quad};
  check(id, {data: rgb, w, h}, alpha);
}

async function group(g) {
  const base = await load(g.base);
  const vars = {};
  for (const id of g.members) { const v = await load(id); if (v) vars[id] = v; }
  if (!base || !Object.keys(vars).length) return;
  const {w, h} = base;
  // Differenz (max. Kanal), leicht geglättet, Schwelle
  let keep = new Float32Array(w * h);
  for (const v of Object.values(vars)) {
    let d = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      d[i] = Math.max(Math.abs(base.data[i * 3] - v.data[i * 3]), Math.abs(base.data[i * 3 + 1] - v.data[i * 3 + 1]), Math.abs(base.data[i * 3 + 2] - v.data[i * 3 + 2])) / 255;
    }
    d = await blurMask(d, w, h, 1.5);
    for (let i = 0; i < w * h; i++) if (d[i] > 22 / 255) keep[i] = 1;
  }
  if (g.split) {
    const xa = Math.round(g.split[0] * w), xb = Math.round(g.split[1] * w);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < xa || x >= xb) keep[y * w + x] = 0;
  }
  // Rauschen weg (Öffnen ≈ Erosion+Dilatation über Blur), dann wachsen lassen und weich machen
  let k = await blurMask(keep, w, h, 2);
  k = k.map((v) => (v > 0.6 ? 1 : 0));
  k = await dilate(k, w, h, g.tight ? 6 : 26);
  const alpha = await blurMask(k, w, h, g.tight ? 2 : 14);
  if (g.split) {
    const xa = Math.round(g.split[0] * w), xb = Math.round(g.split[1] * w);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < xa || x >= xb) alpha[y * w + x] = 0;
  }
  const crop = bbox(alpha, w, h);
  meta[g.group] = {base: g.base, x: crop.x0, y: crop.y0, w: crop.x1 - crop.x0, h: crop.y1 - crop.y0, pose: {}};
  for (const [id, v] of Object.entries(vars)) {
    // Farbe/Kontrast an das Grundbild angleichen (unveränderte Pixel im Ebenenbereich)
    const data = Buffer.from(v.data);
    for (let c = 0; c < 3; c++) {
      let sx = 0, sy = 0, sxx = 0, sxy = 0, n = 0;
      for (let y = crop.y0; y < crop.y1; y += 2) for (let x = crop.x0; x < crop.x1; x += 2) {
        const i = y * w + x;
        const dd = Math.abs(base.data[i * 3 + c] - v.data[i * 3 + c]);
        if (dd < 14) { const a = v.data[i * 3 + c], b = base.data[i * 3 + c]; sx += a; sy += b; sxx += a * a; sxy += a * b; n++; }
      }
      if (n > 500) {
        const va = sxx / n - (sx / n) ** 2;
        if (va > 16) {
          const gain = Math.min(1.25, Math.max(0.8, (sxy / n - (sx / n) * (sy / n)) / va));
          const off = sy / n - gain * (sx / n);
          for (let i = 0; i < w * h; i++) data[i * 3 + c] = Math.max(0, Math.min(255, Math.round(v.data[i * 3 + c] * gain + off)));
        }
      }
    }
    const {out, cw, ch} = rgba(data, alpha, w, h, crop);
    await savePng(out, cw, ch, `${id}.png`);
    meta[g.group].pose[id] = `img/${id}.webp`;
    await saveJpg({data, w, h}, `${id}-voll.jpg`); // Vollbild für Kontaktbogen
    check(id, {data, w, h});
  }
}

async function plate(id) {
  const im = await load(id);
  if (!im) return;
  const {data, w, h} = im;
  // Flood-Fill vom Rand: Pixel nahe Weiß (Toleranz 8) und verbunden mit dem Rand → Hintergrund
  const bg = new Uint8Array(w * h);
  const near = (i) => 255 - Math.min(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) <= 8;
  const stack = [];
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || !near(i)) continue;
    bg[i] = 1;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < w * (h - 1)) stack.push(i + w);
  }
  let alpha = Float32Array.from(bg, (v) => 1 - v);
  alpha = await blurMask(alpha, w, h, 1); // 1 px Kante
  const crop = bbox(alpha, w, h, 0.02, 2);
  const {out, cw, ch} = rgba(data, alpha, w, h, crop);
  await savePng(out, cw, ch, `${id}.png`);
  meta[id] = {src: `img/${id}.webp`, w: cw, h: ch, full: {w, h, x: crop.x0, y: crop.y0}};
  await saveJpg(im, `${id}-voll.jpg`);
  check(id, im, alpha);
}

async function brush(id) {
  const im = await load(id);
  if (!im) return;
  const {data, w, h} = im;
  const alpha = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const l = (data[i * 3] + data[i * 3 + 1] + data[i * 3 + 2]) / 3;
    alpha[i] = Math.max(0, Math.min(1, (245 - l) / (245 - 128)));
  }
  const crop = bbox(alpha, w, h, 0.05, 4);
  const white = Buffer.alloc(w * h * 3, 255);
  const {out, cw, ch} = rgba(white, alpha, w, h, crop);
  await savePng(out, cw, ch, `${id}.png`);
  meta[id] = {src: `img/${id}.webp`, w: cw, h: ch};
  await saveJpg(im, `${id}-voll.jpg`);
  check(id, im);
}

for (const step of PLAN) {
  if (step.deck) for (const id of step.deck) await deck(id);
  if (step.screen) await screen(step.screen);
  if (step.group) await group(step);
  if (step.plate) for (const id of step.plate) await plate(id);
  if (step.brush) await brush(step.brush);
}

fs.mkdirSync(path.join(ROOT, 'src/data'), {recursive: true});
fs.writeFileSync(path.join(ROOT, 'src/data/assets.json'), JSON.stringify(meta, null, 1) + '\n');
fs.writeFileSync(path.join(OUT, 'qa.json'), JSON.stringify(qa, null, 1) + '\n');
const bad = Object.entries(qa).filter(([, r]) => !r.ok);
for (const [id, r] of Object.entries(qa)) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${id.padEnd(6)} Teal ${r.teal.toFixed(2)} %  Gold ${r.gold.toFixed(2)} %`);
if (bad.length) { console.error('Farbleck-Check nicht bestanden: ' + bad.map(([id]) => id).join(', ')); process.exitCode = 1; }
