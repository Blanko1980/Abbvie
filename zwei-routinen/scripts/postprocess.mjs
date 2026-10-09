#!/usr/bin/env node
// Nachbearbeitung der Gemini-Bilder → assets/processed + public/img (für Remotion).
//   - Hochskalieren auf mind. 2880 px lange Kante (Lanczos)
//   - plate:   Alpha per Flood-Fill vom Rand (Toleranz ≈ 8 zum Nachbarn, ≤ 30 zur Eckfarbe), 1 px weich, beschnitten
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
  {deck: ['A1', 'A2', 'A3', 'A4', 'A5', 'B4', 'B4c', 'B4cb', 'B5', 'B6', 'B6e', 'B7', 'B7e', 'DESK', 'C6C11', 'C13', 'C14', 'C15', 'D2']},
  {screen: 'B3'},
  {screen: 'B1'}, // Display der Kaffeemaschine
  {group: 'B2', base: 'B1', members: ['B2']},
  // rechter Arm des Arztes am Navi (zwei Zielpunkte), Magenta-Reste des Bildschirms fallen weg
  {group: 'C2', base: 'B3', members: ['C2a', 'C2b'], tight: true, dropMagenta: true, maskFile: true, extend: 700}, // Maske: scripts/arm-mask.py
  // Schlüssel und Tasche: dieselbe Greif-Hand zweimal freigestellt – über dem Bild mit Gegenstand (nur Hand, greift zu)
  // und über dem leeren Bild (Hand mit Gegenstand, hebt ab). Beim Umschalten sind die Pixel identisch.
  {group: 'C17', base: 'B6', members: ['C17a'], tight: true, extend: 300, maskFile: 'C17a-hand', dropGrey: true, despeckle: true},   // Masken: scripts/arm-mask.py
  {group: 'C17k', base: 'B6e', members: ['C17a'], rename: {C17a: 'C17ak'}, tight: true, extend: 300, maskFile: 'C17a'},
  {group: 'C18', base: 'B7', members: ['C18a'], tight: true, extend: 300},
  {group: 'C18k', base: 'B7e', members: ['C18a'], rename: {C18a: 'C18ak'}, tight: true, extend: 300, dropLight: true, despeckle: true},
  {group: 'C4w', base: 'B4', members: ['C4w', 'C4wb'], tight: true, inner: [5, 12], dropGreen: true, dropShadow: 1150},
  {group: 'C4', base: 'B4c', members: ['C4', 'C5']},
  {group: 'C15doc', base: 'C15', members: ['C10', 'C9'], split: [0, 0.5]},
  {group: 'C15pat', base: 'C15', members: ['C15b'], split: [0.5, 1]},
  // Hände am Tisch: KI-Schatten auf dem Holz entfernen (weicher Schatten im Code)
  {group: 'C8', base: 'DESK', members: ['C8'], tight: true, thresh: 9, woodChroma: true, handOnly: true, dropShadow: 0, despeckle: true, extend: 600}, // heller Ärmel vor hellem Grund
  {group: 'C12', base: 'DESK', members: ['C12'], tight: true, dropShadow: 0, despeckle: true, extend: 600},
  {group: 'C16', base: 'DESK', members: ['C16'], tight: true, dropShadow: 0, despeckle: true, extend: 600},
  // Block liegt still, nur die schreibende Hand bewegt sich
  {group: 'C7pad', base: 'DESK', members: ['C7b']},   // leerer Block, die Schrift entsteht im Code
  {group: 'C7d', base: 'C7b', members: ['C7d'], dropPaper: true},   // nicht eng: der abgelegte Stift ist eine eigene Insel   // Stift bewusst abgelegt (S7)
  // Praxis-Halle: digitale Wanduhr (Magenta-Anzeige, Ziffern im Code) und Sprechzeiten-Schild, als Ausschnitt über allen Hallenbildern
  {group: 'HALL', base: 'B4', members: ['B4d']},
  {group: 'C7', base: 'C7p', members: ['C7'], tight: true, maskFile: true, extend: 300}, // Maske: scripts/arm-mask.py
  // rennender Arzt (S2/S4) auf grauem Grund: saubere Kanten auch am weißen Kittel
  {plate: ['C3p', 'C3pb', 'C3q', 'C3qb', 'C3g']},
  {brush: 'D1'},
  // Tresen als Vordergrund-Ebene: der eilige Arzt läuft hinter ihm vorbei
  {front: 'COUNTER', from: 'B4', box: [2090, 820, 2880, 1607]},
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
  const out = await sharp(buf, {raw: {width: w, height: h, channels: 1}}).blur(sigma).extractChannel(0).raw().toBuffer();
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

// Größte zusammenhängende Fläche (plus Teile in ihrem Umfeld) behalten – entfernt Krümel der KI-Bearbeitung
function largestComponent(mask, w, h) {
  const lab = new Int32Array(w * h);
  let best = 0, bestN = 0, cur = 0;
  const boxes = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || lab[i]) continue;
    cur++;
    let n = 0, x0 = w, y0 = h, x1 = 0, y1 = 0;
    const st = [i];
    lab[i] = cur;
    while (st.length) {
      const j = st.pop();
      n++;
      const x = j % w, y = (j / w) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const k of [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, j >= w ? j - w : -1, j < w * (h - 1) ? j + w : -1]) {
        if (k >= 0 && mask[k] && !lab[k]) { lab[k] = cur; st.push(k); }
      }
    }
    boxes[cur] = {x0, y0, x1, y1, n};
    if (n > bestN) { bestN = n; best = cur; }
  }
  const B = boxes[best];
  if (!B) return mask;
  const mx = (B.x1 - B.x0) * 0.08, my = (B.y1 - B.y0) * 0.08;
  const keepLab = new Uint8Array(cur + 1);
  for (let c = 1; c <= cur; c++) {
    const b = boxes[c];
    const inside = b.x0 >= B.x0 - mx && b.x1 <= B.x1 + mx && b.y0 >= B.y0 - my && b.y1 <= B.y1 + my;
    if (c === best || (inside && b.n > bestN * 0.02)) keepLab[c] = 1;
  }
  return Float32Array.from(lab, (l) => (l && keepLab[l] ? 1 : 0));
}

async function diffKeep(base, v, w, h, split, thresh = 22, woodChroma = false) {
  let d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const br = base.data[i * 3], bgc = base.data[i * 3 + 1], bb = base.data[i * 3 + 2];
    if (woodChroma && br - bb > 30) {
      // Holzfläche: nur Farbunterschiede zählen (Licht-/Helligkeitsänderungen der KI ignorieren)
      const vr = v.data[i * 3], vg = v.data[i * 3 + 1], vb = v.data[i * 3 + 2];
      d[i] = Math.max(Math.abs((br - bgc) - (vr - vg)), Math.abs((br + bgc - 2 * bb) - (vr + vg - 2 * vb)) / 2) / 255;
      continue;
    }
    d[i] = Math.max(Math.abs(base.data[i * 3] - v.data[i * 3]), Math.abs(base.data[i * 3 + 1] - v.data[i * 3 + 1]), Math.abs(base.data[i * 3 + 2] - v.data[i * 3 + 2])) / 255;
  }
  d = await blurMask(d, w, h, 1.5);
  const keep = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) if (d[i] > thresh / 255) keep[i] = 1;
  if (split) {
    const xa = Math.round(split[0] * w), xb = Math.round(split[1] * w);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < xa || x >= xb) keep[y * w + x] = 0;
  }
  return keep;
}

async function maskFrom(keep, w, h, g) {
  // Rauschen weg (Öffnen ≈ Blur + hohe Schwelle), bei bewegten Ebenen nur die Figur, dann wachsen + weich
  let k = await blurMask(keep, w, h, 2);
  k = k.map((v) => (v > 0.6 ? 1 : 0));
  if (g.tight) k = largestComponent(k, w, h);
  k = await dilate(k, w, h, g.tight ? 2 : 26);
  const alpha = await blurMask(k, w, h, g.tight ? 1.2 : 14);
  if (g.split) {
    const xa = Math.round(g.split[0] * w), xb = Math.round(g.split[1] * w);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < xa || x >= xb) alpha[y * w + x] = 0;
  }
  return alpha;
}

function colorMatch(base, v, w, h, crop) {
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
  return data;
}

// Pose-Ebenen: statische Gruppen teilen eine Maske (saubere Überblendung),
// bewegte Ebenen (tight) bekommen je eine eigene, enge Maske nur um die Figur.
async function group(g) {
  const base = await load(g.base);
  const vars = {};
  for (const id of g.members) { const v = await load(id); if (v) vars[id] = v; }
  if (!base || !Object.keys(vars).length) return;
  const {w, h} = base;
  meta[g.group] = {base: g.base, pose: {}};
  let shared = null;
  if (!g.tight) {
    const keep = new Float32Array(w * h);
    for (const v of Object.values(vars)) { const k = await diffKeep(base, v, w, h, g.split, g.thresh, g.woodChroma); for (let i = 0; i < w * h; i++) if (k[i]) keep[i] = 1; }
    shared = await maskFrom(keep, w, h, g);
  }
  for (const [id, v] of Object.entries(vars)) {
    let alpha = g.maskFile
      ? await blurMask(Float32Array.from(await sharp(path.join(ROOT, 'assets/masks', `${typeof g.maskFile === 'string' ? g.maskFile : id}.png`)).resize(w, h).greyscale().raw().toBuffer(), (x) => x / 255), w, h, 1)
      : shared || await maskFrom(await diffKeep(base, v, w, h, g.split, g.thresh, g.woodChroma), w, h, g);
    if (g.inner) {
      // Innerhalb der Figur: Pixel, die dem Hintergrund (fast) gleichen, durchsichtig machen –
      // sonst wandern Hintergrundstücke aus Lücken (zwischen Arm und Körper) mit der bewegten Figur mit
      const [lo, hi] = g.inner;
      let d = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) {
        d[i] = Math.max(Math.abs(base.data[i * 3] - v.data[i * 3]), Math.abs(base.data[i * 3 + 1] - v.data[i * 3 + 1]), Math.abs(base.data[i * 3 + 2] - v.data[i * 3 + 2]));
      }
      d = await blurMask(d.map((x) => x / 255), w, h, 1);
      alpha = alpha.map((a, i) => a * Math.min(1, Math.max(0, (d[i] * 255 - lo) / (hi - lo))));
    }
    const ramp = (x) => Math.min(1, Math.max(0, x));
    if (g.dropGreen) {
      // Pflanzenreste aus dem Hintergrund entfernen (die Figur trägt kein Grün)
      alpha = alpha.map((a, i) => { const r = v.data[i * 3], gg = v.data[i * 3 + 1], b = v.data[i * 3 + 2]; return a * (1 - ramp((gg - Math.max(r, b) - 4) / 10)); });
    }
    if (g.dropShadow != null) {
      // Bodenschatten der KI entfernen (unterhalb der Linie: nur abgedunkelter Boden ohne Farbänderung);
      // der Schatten wird im Code als weiche Ellipse gezeichnet und läuft sauber mit
      const yMin = g.dropShadow;
      alpha = alpha.map((a, i) => {
        if (a <= 0 || i / w < yMin) return a;
        const br = base.data[i * 3], bg2 = base.data[i * 3 + 1], bb = base.data[i * 3 + 2];
        const vr = v.data[i * 3], vg = v.data[i * 3 + 1], vb = v.data[i * 3 + 2];
        const dl = (br + bg2 + bb - vr - vg - vb) / 3;                       // Abdunklung
        const dc = Math.abs((br - bg2) - (vr - vg)) + Math.abs((bg2 - bb) - (vg - vb));
        // am Tisch (yMin 0) nur Schatten auf Holz, nie auf hellem Grund oder Ärmel
        const shadow = dl > -4 && dl < 60 && dc < 14 && Math.max(vr, vg, vb) > 120 && (yMin > 0 || br - bb > 25);
        const dust = yMin > 0 && Math.max(vr, vg, vb) > 180 && Math.max(vr, vg, vb) - Math.min(vr, vg, vb) < 25; // heller Staub am Boden
        return shadow || dust ? 0 : a;
      });
      // verbliebene Sprenkel unter der Linie: kleine Inseln (< 1500 px) entfernen
      const seen = new Uint8Array(w * h);
      for (let s0 = yMin * w; s0 < w * h; s0++) {
        if (seen[s0] || alpha[s0] < 0.05) continue;
        const comp = [s0]; seen[s0] = 1;
        for (let k = 0; k < comp.length; k++) {
          const i = comp[k], x = i % w;
          for (const j of [i - 1, i + 1, i - w, i + w]) {
            if (j < yMin * w || j >= w * h || seen[j] || alpha[j] < 0.05) continue;
            if ((j === i - 1 && x === 0) || (j === i + 1 && x === w - 1)) continue;
            seen[j] = 1; comp.push(j);
          }
        }
        if (comp.length < 1500) for (const i of comp) alpha[i] = 0;
      }
    }
    if (g.dropGrey) {
      // grauer Wandschatten neben der Hand wandert sonst als Balken mit
      // nur Haut (warm) und dunkler Ärmel bleiben
      alpha = alpha.map((a, i) => { const r = v.data[i * 3], gg = v.data[i * 3 + 1], b = v.data[i * 3 + 2]; return r - b > 28 || Math.max(r, gg, b) < 110 ? a : 0; });
    }
    if (g.dropPaper) {
      // weißes Papier (Block) gehört nicht zur Ebene, sonst verdeckt es die Schrift
      alpha = alpha.map((a, i) => { const r = v.data[i * 3], gg = v.data[i * 3 + 1], b = v.data[i * 3 + 2]; return Math.min(r, gg, b) > 234 && Math.max(r, gg, b) - Math.min(r, gg, b) < 14 ? 0 : a; });
    }
    if (g.dropLight) {
      // Hand (Haut), Ärmel und Tasche (dunkel) bleiben; helle, ungesättigte Reste (Bankkante, Wand) fallen weg
      alpha = alpha.map((a, i) => { const r = v.data[i * 3], gg = v.data[i * 3 + 1], b = v.data[i * 3 + 2]; return Math.max(r, gg, b) > 150 && r - b < 35 ? 0 : a; });
      // unter der Unterkante der Tasche (je Spalte das tiefste dunkle Pixel) liegt nur noch Schatten auf der Bank
      for (let x = 0; x < w; x++) {
        let low = -1;
        for (let y = h - 1; y >= 0; y--) { const i = y * w + x; if (alpha[i] > 0.5 && Math.max(v.data[i * 3], v.data[i * 3 + 1], v.data[i * 3 + 2]) < 110) { low = y; break; } }
        if (low >= 0) for (let y = low + 3; y < h; y++) alpha[y * w + x] = 0;
      }
    }
    if (g.dropMagenta) {
      // Bildschirmfläche (Magenta) und rosa Säume entfernen, Rest entsättigen
      alpha = alpha.map((a, i) => { const r = v.data[i * 3], gg = v.data[i * 3 + 1], b = v.data[i * 3 + 2]; return a * (1 - ramp((Math.min(r, b) - gg - 40) / 50)); });
      for (let i = 0; i < w * h; i++) if (alpha[i] > 0 && v.data[i * 3 + 2] > v.data[i * 3 + 1] + 8) v.data[i * 3 + 2] = v.data[i * 3 + 1] + 8;
    }
    if (g.handOnly) {
      // Nur Haut, heller Ärmel und dunkle Manschette behalten – heller Tisch-Saum unter den Fingern fällt weg
      alpha = alpha.map((a, i) => {
        const r = v.data[i * 3], gg = v.data[i * 3 + 1], b = v.data[i * 3 + 2];
        const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), sat = mx ? (mx - mn) / mx : 0;
        const skin = ramp((r - gg - 30) / 12);
        const sleeve = ramp((0.14 - sat) / 0.05);
        const cuff = ramp((0.45 - mx / 255) / 0.1);
        return a * Math.max(skin, sleeve, cuff);
      });
      alpha = await blurMask(alpha, w, h, 0.8);
    }
    if (g.despeckle) {
      // vereinzelte Krümel (Holzmaserung) an den Kanten entfernen: nur dichte Bereiche bleiben
      const b = await blurMask(alpha, w, h, 3);
      alpha = alpha.map((a, i) => a * ramp((b[i] - 0.3) / 0.3));
    }
    const crop = bbox(alpha, w, h);
    const data = colorMatch(base, v, w, h, crop);
    let {out, cw, ch} = rgba(data, alpha, w, h, crop);
    let px = crop.x0, py = crop.y0;
    if (g.extend) {
      // Ärmel, die am Bildrand enden, über den Rand hinaus verlängern (Randpixel fortsetzen),
      // damit beim Verschieben der Ebene keine Schnittkante ins Bild kommt
      const e = {left: crop.x0 === 0 ? g.extend : 0, right: crop.x1 >= w ? g.extend : 0, top: crop.y0 === 0 ? g.extend : 0, bottom: crop.y1 >= h ? g.extend : 0};
      const r = await sharp(out, {raw: {width: cw, height: ch, channels: 4}}).extend({...e, extendWith: 'copy'}).raw().toBuffer({resolveWithObject: true});
      out = r.data; cw = r.info.width; ch = r.info.height; px -= e.left; py -= e.top;
    }
    const name = g.rename?.[id] ?? id; // dasselbe Bild über einem anderen Grundbild → eigener Name
    await savePng(out, cw, ch, `${name}.png`);
    meta[g.group].pose[name] = {src: `img/${name}.webp`, x: px, y: py, w: cw, h: ch};
    await saveJpg({data, w, h}, `${name}-voll.jpg`); // Vollbild für Kontaktbogen
    check(name, {data, w, h});
  }
}

async function plate(id) {
  const im = await load(id);
  if (!im) return;
  const {data, w, h} = im;
  // Flood-Fill vom Rand: Toleranz 8 zum Nachbarpixel (folgt weichen Hintergrund-Verläufen und Vignetten),
  // nur helle Pixel (Grund ist weiß bis hellgrau) gehören zum Hintergrund
  const bg = new Uint8Array(w * h);
  // Grundfarbe aus den vier Ecken (weiß oder flaches Grau)
  const ref = [0, 0, 0];
  for (const [cx, cy] of [[0, 0], [w - 10, 0], [0, h - 10], [w - 10, h - 10]]) for (let y = cy; y < cy + 10; y++) for (let x = cx; x < cx + 10; x++) for (let c = 0; c < 3; c++) ref[c] += data[(y * w + x) * 3 + c] / 400;
  const bright = (i) => Math.max(Math.abs(data[i * 3] - ref[0]), Math.abs(data[i * 3 + 1] - ref[1]), Math.abs(data[i * 3 + 2] - ref[2])) <= 30;
  const close = (i, j) => Math.max(Math.abs(data[i * 3] - data[j * 3]), Math.abs(data[i * 3 + 1] - data[j * 3 + 1]), Math.abs(data[i * 3 + 2] - data[j * 3 + 2])) <= 8;
  const stack = [];
  for (let x = 0; x < w; x++) for (const i of [x, (h - 1) * w + x]) if (bright(i)) { bg[i] = 1; stack.push(i); }
  for (let y = 0; y < h; y++) for (const i of [y * w, y * w + w - 1]) if (bright(i) && !bg[i]) { bg[i] = 1; stack.push(i); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i < w * (h - 1) ? i + w : -1]) {
      if (j >= 0 && !bg[j] && bright(j) && close(i, j)) { bg[j] = 1; stack.push(j); }
    }
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

// Vordergrund aus einem Plattenbild ausschneiden (Holzfarbe im Kasten), z. B. der Tresen in der Halle
async function front(st) {
  const im = await load(st.from);
  if (!im) return;
  const {data, w, h} = im, [bx0, by0, bx1, by1] = st.box;
  let alpha = new Float32Array(w * h);
  for (let y = by0; y < Math.min(by1, h); y++) for (let x = bx0; x < Math.min(bx1, w); x++) {
    const i = y * w + x, r = data[i * 3], b = data[i * 3 + 2];
    alpha[i] = Math.min(1, Math.max(0, (r - b - 18) / 12));
  }
  alpha = await blurMask(alpha, w, h, 1.5);
  alpha = alpha.map((a) => Math.min(1, Math.max(0, (a - 0.3) / 0.4)));
  const crop = bbox(alpha, w, h);
  const {out, cw, ch} = rgba(data, alpha, w, h, crop);
  await savePng(out, cw, ch, `${st.front}.png`);
  meta[st.front] = {src: `img/${st.front}.webp`, x: crop.x0, y: crop.y0, w: cw, h: ch};
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
  if (step.plate?.includes('C3p') && meta.C3p) {
    // Rennender Arzt (Alltagskleidung) als Pose-Gruppen in B4-Koordinaten, alle Platten deckungsgleich:
    // Größe und Fußlinie an der Tür (Höhe 836, Fuß 1400). C3 ohne Kittel, C3c mit Kittel in der Hand, C3g greift den Kittel.
    const k = 836 / meta.C3p.h, X0 = 1104 - (meta.C3p.full.x + meta.C3p.w / 2) * k, Y0 = 1400 - (meta.C3p.full.y + meta.C3p.h) * k;
    const pose = (id) => ({src: meta[id].src, x: Math.round(X0 + meta[id].full.x * k), y: Math.round(Y0 + meta[id].full.y * k), w: Math.round(meta[id].w * k), h: Math.round(meta[id].h * k)});
    meta.C3 = {base: 'B4', pose: {C3p: pose('C3p'), C3pb: pose('C3pb')}};
    meta.C3c = {base: 'B4', pose: {C3q: pose('C3q'), C3qb: pose('C3qb')}};
    meta.C3g = {base: 'B4', pose: {C3g: pose('C3g')}};
    meta.C3feet = {feet: Math.round(Y0 + (meta.C3p.full.y + meta.C3p.h) * k)};
  }
  if (step.brush) await brush(step.brush);
  if (step.front) await front(step);
}

fs.mkdirSync(path.join(ROOT, 'src/data'), {recursive: true});
fs.writeFileSync(path.join(ROOT, 'src/data/assets.json'), JSON.stringify(meta, null, 1) + '\n');
fs.writeFileSync(path.join(OUT, 'qa.json'), JSON.stringify(qa, null, 1) + '\n');
const bad = Object.entries(qa).filter(([, r]) => !r.ok);
for (const [id, r] of Object.entries(qa)) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${id.padEnd(6)} Teal ${r.teal.toFixed(2)} %  Gold ${r.gold.toFixed(2)} %`);
if (bad.length) { console.error('Farbleck-Check nicht bestanden: ' + bad.map(([id]) => id).join(', ')); process.exitCode = 1; }
