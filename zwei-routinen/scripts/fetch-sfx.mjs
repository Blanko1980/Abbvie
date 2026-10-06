#!/usr/bin/env node
// Holt die Geräusche von ElevenLabs (nur fehlende). Schlüssel aus ELEVENLABS_API_KEY, wird nie ausgegeben.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SFX} from './sfx-list.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'public/audio/sfx');
const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.log('Kein ELEVENLABS_API_KEY – Geräusche werden synthetisiert.'); process.exit(0); }
fs.mkdirSync(DIR, {recursive: true});
const log = {};
for (const [id, s] of Object.entries(SFX)) {
  const file = path.join(DIR, `${id}.mp3`);
  if (fs.existsSync(file) && !process.argv.includes('--force')) continue;
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST', headers: {'xi-api-key': key, 'Content-Type': 'application/json'},
    body: JSON.stringify({text: s.text, duration_seconds: s.seconds, prompt_influence: 0.6}),
  });
  if (!res.ok) { console.error(`${id}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`); continue; }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  log[id] = s;
  console.log(`${id}: gespeichert`);
}
fs.writeFileSync(path.join(DIR, 'prompts.json'), JSON.stringify(SFX, null, 2) + '\n');
