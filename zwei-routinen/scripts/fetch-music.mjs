#!/usr/bin/env node
// Holt die zwei Musikstücke von ElevenLabs Music (nur fehlende, --force erzeugt neu). Schlüssel aus ELEVENLABS_API_KEY, wird nie ausgegeben.
//   routine: etwas gehetzt, akustisch, 100 BPM (Schnitte liegen auf dem 9-Frame-Raster)
//   calm:    entspannt, warm, akustisch – nach dem Innehalten und bei der Rinvoq-Lösung
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'public/audio/music');
export const MUSIC = {
  routine: {
    seconds: 64,
    prompt: 'Instrumental underscore for a calm, premium healthcare explainer film. Exactly 100 BPM, steady tempo from the first beat, A minor. A busy, slightly hurried everyday routine: tight plucked acoustic guitar ostinato in eighth notes, pizzicato strings, warm upright bass, soft brushed snare and a light shaker, gentle forward drive and mild restlessness. Organic acoustic instruments only, warm and human, unobtrusive under picture. No synthesizers, no electronic drums, no video-game sounds, no vocals. Starts directly on the beat, no long intro.',
  },
  calm: {
    seconds: 48,
    prompt: 'Instrumental underscore for a calm, premium healthcare explainer film. Relaxed and warm, about 80 BPM, C major. Soft felt piano with gentle sustained strings and a little fingerpicked acoustic guitar, open and hopeful, a feeling of relief and having time again. Organic acoustic instruments only, no drums, no synthesizers, no video-game sounds, no vocals. Begins softly, gentle ending.',
  },
};

const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.log('Kein ELEVENLABS_API_KEY – keine Musik geholt.'); process.exit(0); }
fs.mkdirSync(DIR, {recursive: true});
for (const [id, m] of Object.entries(MUSIC)) {
  const file = path.join(DIR, `${id}.mp3`);
  if (fs.existsSync(file) && !process.argv.includes('--force')) continue;
  const res = await fetch('https://api.elevenlabs.io/v1/music', {
    method: 'POST', headers: {'xi-api-key': key, 'Content-Type': 'application/json'},
    body: JSON.stringify({prompt: m.prompt, music_length_ms: m.seconds * 1000}),
  });
  if (!res.ok) { console.error(`${id}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`); process.exitCode = 1; continue; }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(`${id}: gespeichert`);
}
fs.writeFileSync(path.join(DIR, 'prompts.json'), JSON.stringify(MUSIC, null, 2) + '\n');
