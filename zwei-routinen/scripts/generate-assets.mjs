#!/usr/bin/env node
// Erzeugt die Standbilder über die Gemini API.
//   node scripts/generate-assets.mjs                 alle fehlenden Assets (Gruppe A zuerst)
//   node scripts/generate-assets.mjs --only C15      ein Asset neu erzeugen (neuer Kandidat)
//   node scripts/generate-assets.mjs --group A       nur eine Gruppe
//   node scripts/generate-assets.mjs --choose C15 2  Kandidat 2 als gültiges Bild festlegen
// Der Schlüssel kommt aus GEMINI_API_KEY und wird nie ausgegeben.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ASSETS, STYLE_PREFIX, EDIT_SUFFIX} from '../assets/asset-list.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GEN = path.join(ROOT, 'assets/gen');
const CAND = path.join(GEN, 'candidates');
const PROMPTS = path.join(ROOT, 'assets/prompts.json');
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image';
const IMAGE_SIZE = '2K';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };

fs.mkdirSync(CAND, {recursive: true});
const db = fs.existsSync(PROMPTS) ? JSON.parse(fs.readFileSync(PROMPTS, 'utf8')) : {};
db.model = MODEL;
db.imageSize = IMAGE_SIZE;
db.stylePrefix = STYLE_PREFIX;
db.editSuffix = EDIT_SUFFIX;
db.assets = db.assets || {};
const save = () => fs.writeFileSync(PROMPTS, JSON.stringify(db, null, 2) + '\n');

const chosenPath = (id) => path.join(GEN, `${id}.jpg`);

if (opt('--choose')) {
  const id = opt('--choose'), n = Number(args[args.indexOf('--choose') + 2]);
  const e = db.assets[id];
  const c = e.candidates.find((x) => x.n === n);
  fs.copyFileSync(path.join(ROOT, c.file), chosenPath(id));
  e.chosen = n;
  save();
  console.log(`${id}: Kandidat ${n} gewählt`);
  process.exit(0);
}

function mime(p) { return p.endsWith('.png') ? 'image/png' : 'image/jpeg'; }

async function generate(a) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY fehlt');
  let text, images = [];
  if (a.kind === 'edit') {
    images.push(chosenPath(a.base));
    images.push(...(a.refs || []).map((r) => path.join(ROOT, r)));
    text = `${a.prompt} ${EDIT_SUFFIX}`;
  } else {
    images.push(...(a.refs || []).map((r) => path.join(ROOT, r)));
    text = a.noStyle ? a.prompt : `${STYLE_PREFIX}\n\n${a.prompt}`;
  }
  for (const p of images) if (!fs.existsSync(p)) throw new Error(`Referenz fehlt: ${path.relative(ROOT, p)}`);
  const parts = images.map((p) => ({inline_data: {mime_type: mime(p), data: fs.readFileSync(p).toString('base64')}}));
  parts.push({text});
  const body = {
    contents: [{role: 'user', parts}],
    generationConfig: {responseModalities: ['IMAGE', 'TEXT'], imageConfig: {aspectRatio: a.aspect || '16:9', imageSize: IMAGE_SIZE}},
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': key}, body: JSON.stringify(body)});
    if (!res.ok) {
      const msg = (await res.text()).slice(0, 400);
      if ([429, 500, 503].includes(res.status) && attempt < 3) { await new Promise((r) => setTimeout(r, 10000 * attempt)); continue; }
      throw new Error(`HTTP ${res.status}: ${msg}`);
    }
    const data = await res.json();
    for (const c of data.candidates || []) for (const p of c.content?.parts || []) {
      const blob = p.inline_data || p.inlineData;
      if (blob && !p.thought) return {buf: Buffer.from(blob.data, 'base64'), text, images};
    }
    const reason = JSON.stringify(data).slice(0, 300);
    if (attempt === 3) throw new Error(`Kein Bild: ${reason}`);
  }
}

const order = {A: 0, B: 1, C: 2, D: 3};
let list = [...ASSETS].sort((x, y) => order[x.group] - order[y.group]);
if (opt('--group')) list = list.filter((a) => a.group === opt('--group'));
if (opt('--only')) list = list.filter((a) => a.id === opt('--only'));
const force = !!opt('--only');

// Abhängigkeiten: Bearbeitungen und Referenzen brauchen ihre Vorlagen → in Wellen parallel erzeugen
const pending = list.filter((a) => force || !fs.existsSync(chosenPath(a.id)));
const ready = (a) => [a.kind === 'edit' ? `assets/gen/${a.base}.jpg` : null, ...(a.refs || [])].filter(Boolean)
  .every((r) => fs.existsSync(path.join(ROOT, r)));
let failed = [];
while (pending.length) {
  const wave = pending.filter(ready);
  if (!wave.length) { failed.push(...pending.map((a) => `${a.id} (Vorlage fehlt)`)); break; }
  await Promise.all(wave.map(async (a) => {
    pending.splice(pending.indexOf(a), 1);
    try {
      const {buf, text, images} = await generate(a);
      const e = db.assets[a.id] || (db.assets[a.id] = {candidates: []});
      Object.assign(e, {group: a.group, kind: a.kind, prompt: text, base: a.base || null,
        references: images.map((p) => path.relative(ROOT, p)), aspect: a.aspect || '16:9', seed: null});
      const n = (e.candidates.at(-1)?.n || 0) + 1;
      const file = path.join(CAND, `${a.id}-c${n}.jpg`);
      fs.writeFileSync(file, buf);
      e.candidates.push({n, file: path.relative(ROOT, file), created: new Date().toISOString()});
      fs.copyFileSync(file, chosenPath(a.id));
      e.chosen = n;
      save();
      console.log(`${a.id}: Kandidat ${n} gespeichert`);
    } catch (err) {
      failed.push(`${a.id}: ${err.message}`);
      console.error(`${a.id}: FEHLER ${err.message}`);
    }
  }));
}
save();
if (failed.length) { console.error('Nicht erzeugt:\n' + failed.join('\n')); process.exitCode = 1; }
