#!/usr/bin/env node
// Tonspur für „Zwei Routinen“: Musik (zwei akustische Stücke von ElevenLabs Music, public/audio/music),
// Geräusche (ElevenLabs aus public/audio/sfx, sonst Synthese), Raumton, Mischung auf ≈ −16 LUFS / ≤ −1 dBTP.
// Ausgabe: public/audio/mix.wav (48 kHz Stereo) und src/data/beats.json (Frame jedes Schlags) + Rasterprüfung.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TL = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/timeline.json'), 'utf8'));
const SR = 48000, FPS = TL.fps, DUR = TL.durationInFrames / FPS;
const N = Math.round(SR * DUR);
const BEAT = TL.beatFrames / FPS;            // 0,6 s bei 100 BPM
const fr = (f) => f / FPS;                   // Frame → Sekunden
const scene = (id) => TL.scenes.find((s) => s.id === id);

// ------------------------------------------------------------ Hilfen
let seed = 20261006;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const stem = () => [new Float32Array(N), new Float32Array(N)];
const add = (st, t0, buf, gain = 1, pan = 0) => {
  const i0 = Math.round(t0 * SR), gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < buf.length; i++) { const j = i0 + i; if (j < 0 || j >= N) continue; st[0][j] += buf[i] * gl; st[1][j] += buf[i] * gr; }
};

function tone(f, dur, {attack = 0.01, release = 0.3, type = 'sine', vib = 0} = {}) {
  const n = Math.round((dur + release) * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const ph = 2 * Math.PI * f * t + vib * Math.sin(2 * Math.PI * 4.5 * t);
    let v = Math.sin(ph);
    if (type === 'tri') v = (2 / Math.PI) * Math.asin(Math.sin(ph));
    if (type === 'soft') v = Math.sin(ph) * 0.8 + Math.sin(2 * ph) * 0.15 + Math.sin(3 * ph) * 0.05;
    const env = t < attack ? t / attack : t < dur ? 1 : Math.exp(-(t - dur) / (release / 4));
    out[i] = v * env;
  }
  return out;
}
function noiseBurst(dur, {hp = 0.6, decay = 0.02} = {}) {
  const n = Math.round(dur * SR), out = new Float32Array(n);
  let prev = 0, lp = 0;
  for (let i = 0; i < n; i++) {
    const w = rnd() * 2 - 1;
    const h = w - prev; prev = w;                   // Hochpass (Differenz)
    lp = lp * (1 - hp) + h * hp;
    out[i] = lp * Math.exp(-i / (SR * decay));
  }
  return out;
}

// ------------------------------------------------------------ Zeitachse aus timeline.json
const S4 = scene('S4'), S5 = scene('S5'), S7 = scene('S7');
const pauseS5 = S5.from + S5.navi.pause[0];                                  // Finger über „Bestätigen“
const notesS7 = S7.shots.find((s) => s.id === 'notes');
const pauseS7 = S7.from + notesS7.from + notesS7.pause[0];                   // Stift hält inne
const P = TL.pause;                                                          // 3 / 30 / 6
const pauses = [pauseS5, pauseS7].map((p) => ({duck: [p - P.duckIn, p], hold: [p, p + P.hold], rel: [p + P.hold, p + P.hold + P.release]}));
const gridEnd1 = pauses[0].duck[1], calm1 = pauses[0].rel[0];
const gridStart2 = S7.from, gridEnd2 = pauses[1].duck[1], calm2 = pauses[1].rel[0];
const fadeEnd = TL.durationInFrames - 30;

// ------------------------------------------------------------ Musik: zwei akustische Stücke von ElevenLabs Music (scripts/fetch-music.mjs)
// routine: gehetzt, akustisch, gemessen 100,03 BPM, erster Schlag bei 0,012 s → Schläge liegen auf dem 9-Frame-Raster.
// calm: warm und ruhig (Klavier, Streicher, Gitarre), setzt nach jedem Innehalten mit seinem leisen Anfang ein.
const MUSICDIR = path.join(ROOT, 'public/audio/music');
function loadStereo(id) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(MUSICDIR, `${id}.mp3`), '-ac', '2', '-ar', String(SR), '-f', 'f32le', '-'], {maxBuffer: 1 << 30});
  const all = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  const n = all.length / 2, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = all[2 * i]; R[i] = all[2 * i + 1]; }
  return [L, R];
}
const ROUTINE = loadStereo('routine'), CALM = loadStereo('calm');
const ROUTINE_PHASE = 0.012;   // Sekunden bis zum ersten Schlag
// Ausschnitt [src, src + Dauer] des Stücks ab Film-Frame a bis b legen, mit weichen Rändern (Sekunden)
function place(st, tr, src, a, b, fadeIn = 0.02, fadeOut = 0.05) {
  const i0 = Math.round(fr(a) * SR), i1 = Math.round(fr(b) * SR), s0 = Math.round(src * SR);
  for (let i = i0; i < i1 && i < N; i++) {
    const k = s0 + (i - i0); if (k < 0 || k >= tr[0].length) continue;
    const t = (i - i0) / SR, r = (i1 - i) / SR;
    const g = Math.min(1, t / fadeIn, r / fadeOut);
    st[0][i] += tr[0][k] * g; st[1][i] += tr[1][k] * g;
  }
}
const grid = stem(), bass = stem(), calm = stem();
// gehetzt bis zum ersten Innehalten (Stück läuft vom ersten Schlag an), dann wieder ab S7 bis zum zweiten Innehalten
place(grid, ROUTINE, ROUTINE_PHASE, 0, gridEnd1, 0.01, fr(TL.pause.duckIn));
place(grid, ROUTINE, ROUTINE_PHASE + 24 * BEAT, gridStart2, gridEnd2, 0.3, fr(TL.pause.duckIn));
// ruhig nach den Pausen (leiser Anfang des Stücks), vor S7 ausblenden; am Ende bis zur Schlussblende
const CALM_IN = 1.7;
place(calm, CALM, CALM_IN, calm1, gridStart2, fr(TL.pause.release), 0.8);
place(calm, CALM, CALM_IN, calm2, fadeEnd, fr(TL.pause.release), 1.6);
const db40 = 0.01;
function envelope(st, fn) { for (let i = 0; i < N; i++) { const g = fn(i / SR * FPS); st[0][i] *= g; st[1][i] *= g; } }
const ramp = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));

// ------------------------------------------------------------ Raumton (bleibt auch im Innehalten)
const room = stem();
{ let a = 0, b = 0; for (let i = 0; i < N; i++) { a = a * 0.995 + (rnd() * 2 - 1) * 0.005; b = b * 0.995 + (rnd() * 2 - 1) * 0.005; room[0][i] = a * 0.06; room[1][i] = b * 0.06; } }

// ------------------------------------------------------------ Geräusche
const sfx = stem();
const SFXDIR = path.join(ROOT, 'public/audio/sfx');
const cache = {};
function load(id) {
  if (cache[id]) return cache[id];
  const file = path.join(SFXDIR, `${id}.mp3`);
  if (!fs.existsSync(file)) return (cache[id] = null);
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-']);
  const buf = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  // auf 1,5 s begrenzen, Spitze normalisieren, kurz ein-/ausblenden
  const n = Math.min(buf.length, Math.round(1.5 * SR));
  let pk = 1e-6; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(buf[i]));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = (buf[i] / pk) * Math.min(1, i / 120) * Math.min(1, (n - i) / 2400);
  return (cache[id] = out);
}
// Navi-Ton: weicher Zweiklang (E5 → A5, in der Tonart); Gold-Tipp eine Oktave tiefer und leiser
const ping = (oct = 0) => { const a = tone(mtof(76 + oct), 0.07, {release: 0.35}), b = tone(mtof(81 + oct), 0.1, {release: 0.5}), out = new Float32Array(a.length + Math.round(0.09 * SR) + b.length); out.set(a); for (let i = 0; i < b.length; i++) out[i + Math.round(0.09 * SR)] += b[i]; return out; };
const synth = {
  tick: () => noiseBurst(0.05, {hp: 0.8, decay: 0.006}), buckle: () => noiseBurst(0.06, {hp: 0.9, decay: 0.004}),
  clock: () => noiseBurst(0.03, {hp: 0.9, decay: 0.003}), keys: () => noiseBurst(0.4, {hp: 0.95, decay: 0.08}),
  pour: () => noiseBurst(1.4, {hp: 0.3, decay: 0.8}), steps: () => noiseBurst(1.2, {hp: 0.5, decay: 0.3}),
  stepsCalm: () => noiseBurst(1.2, {hp: 0.5, decay: 0.3}), coat: () => noiseBurst(0.8, {hp: 0.4, decay: 0.3}),
  pen: () => noiseBurst(0.6, {hp: 0.95, decay: 0.2}), slide: () => noiseBurst(0.7, {hp: 0.5, decay: 0.3}), rustle: () => noiseBurst(0.5, {hp: 0.7, decay: 0.2}),
};
const fx = (id, frame, gain = 1, pan = 0) => add(sfx, fr(frame), load(id) ?? synth[id](), gain, pan);
const fxPing = (frame, oct = 0, gain = 0.5) => add(sfx, fr(frame), ping(oct), gain);

// Ereignisse (absolute Frames), aus timeline.json abgeleitet
const S1 = scene('S1'), S2 = scene('S2'), S3 = scene('S3'), S6 = scene('S6'), S8 = scene('S8');
const sh = (s, id) => s.shots.find((x) => x.id === id);
fx('pour', S1.from + sh(S1, 'cup').pour[0], 0.55);
fx('tick', S1.from + sh(S1, 'cup').to - 4, 0.5);
fx('keys', S1.from + sh(S1, 'keys').from + 3, 0.6, 0.2);
fx('buckle', S1.from + sh(S1, 'belt').click, 0.7);
fxPing(S1.from + sh(S1, 'navi').tap);
fx('clock', S2.from + 2, 0.35);
fx('steps', S2.from + S2.run.from, 0.65);
fx('coat', S2.from + S2.grab[0], 0.45);
const notesS3 = sh(S3, 'notes'), slipS3 = sh(S3, 'slip');
fx('pen', S3.from + notesS3.from + 4, 0.45);
fx('slide', S3.from + slipS3.from + slipS3.push[0] + 4, 0.5);
fx('slide', S3.from + slipS3.from + slipS3.takeOut[0], 0.35);
for (const d of S4.days) for (const [id, a, b] of d.shots) {
  const f = S4.from + a;
  if (id === 'cup') fx('tick', f + 6, 0.4);
  if (id === 'keys') fx('keys', f, 0.45, 0.2);
  if (id === 'navi') fxPing(f + Math.round((b - a) * 0.5));
  if (id === 'clock') fx('clock', f, 0.3);
  if (id === 'coat') fx('coat', f, 0.35);
  if (id === 'notes') fx('pen', f, 0.35);
  if (id === 'slip') fx('slide', f + 2, 0.4);
}
fx('slide', S4.from + S4.matchCut.cut, 0.45);
for (const [id, a] of S5.shots) {
  const f = S5.from + a;
  if (id === 'cup') fx('tick', f + 6, 0.35);
  if (id === 'keys') fx('keys', f + 2, 0.4, 0.2);
  if (id === 'belt') fx('buckle', f + 12, 0.5);
}
fxPing(S5.from + S5.navi.tap, -12, 0.3);                                    // Gold: eine Oktave tiefer, leiser
fx('clock', S6.from + 2, 0.35);
fx('stepsCalm', S6.from + S6.walk.from, 0.5);
fx('coat', S6.from + S6.coat[0], 0.45);
const p7 = sh(S7, 'push'), t7 = sh(S7, 'take');
fx('pen', S7.from + notesS7.from + 2, 0.4);
fx('tick', S7.from + notesS7.from + notesS7.penDown[1] - 3, 0.35);                // Stift wird abgelegt
fx('slide', S7.from + p7.from + 2, 0.45);
fx('rustle', S7.from + t7.from + 10, 0.3);
fx('rustle', TL.durationInFrames - 8, 0.35);                               // letztes Papiergeräusch
// Geräusche halten sich an das Innehalten: dort keine Ereignisse (Dämpfung wie Musik)
envelope(sfx, (f) => {
  for (const p of pauses) if (f >= p.duck[0] && f < p.rel[1]) return f < p.duck[1] ? 1 - (1 - db40) * ramp(f, ...p.duck) : f < p.hold[1] ? db40 : Math.max(db40, ramp(f, ...p.rel));
  return 1;
});
// S7: im Innehalten wird hörbar (nicht sichtbar) das alte Rezept zerknüllt – nach der Dämpfung eingefügt, damit es in der Stille steht
add(sfx, fr(pauseS7 + 6), load('crumple') ?? synth.rustle(), 0.35, 0.25);

// ------------------------------------------------------------ Mischung
const mix = stem();
const MUS = 0.55, SFX = 1.0;  // Geräusche ≈ 6–8 dB über dem Musikbett (Feinabgleich unten gemessen)
for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) {
  mix[c][i] = (grid[c][i] + bass[c][i] + calm[c][i]) * MUS + sfx[c][i] * SFX + room[c][i];
}
// Pegelverhältnis Geräusche ↔ Musikbett (RMS über aktive Bereiche, in dB)
{
  const rms = (st, gate) => { let sum = 0, n = 0; for (let i = 0; i < N; i += 4) { const v = (Math.abs(st[0][i]) + Math.abs(st[1][i])) / 2; if (v > gate) { sum += v * v; n++; } } return Math.sqrt(sum / Math.max(1, n)); };
  const musRms = rms([grid[0].map((v, i) => (v + bass[0][i] + calm[0][i]) * MUS), grid[1].map((v, i) => (v + bass[1][i] + calm[1][i]) * MUS)], 1e-4);
  const sfxRms = rms([sfx[0].map((v) => v * SFX), sfx[1].map((v) => v * SFX)], 0.02);
  console.log(`Geräusche über Musikbett: ${(20 * Math.log10(sfxRms / musRms)).toFixed(1)} dB`);
}
// sanfte Ein-/Ausblendung an den Rändern
for (let i = 0; i < 2400; i++) { const g = i / 2400; mix[0][i] *= g; mix[1][i] *= g; mix[0][N - 1 - i] *= g; mix[1][N - 1 - i] *= g; }

function writeWav(file, st) {
  const n = st[0].length, buf = Buffer.alloc(44 + n * 8);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 8, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(3, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 8, 28); buf.writeUInt16LE(8, 32); buf.writeUInt16LE(32, 34); buf.write('data', 36); buf.writeUInt32LE(n * 8, 40);
  for (let i = 0; i < n; i++) { buf.writeFloatLE(st[0][i], 44 + i * 8); buf.writeFloatLE(st[1][i], 48 + i * 8); }
  fs.writeFileSync(file, buf);
}
const tmp = path.join(ROOT, 'out/.audio-raw.wav');
fs.mkdirSync(path.dirname(tmp), {recursive: true});
writeWav(tmp, mix);
// Lautheit: zweistufiges loudnorm auf −16 LUFS integriert, True Peak ≤ −1 dBTP (Ziel −1,5 als Reserve)
const stderrOf = (args) => spawnSync('ffmpeg', args, {encoding: 'utf8', maxBuffer: 1 << 26}).stderr;
const firstRaw = stderrOf(['-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']);
const first = JSON.parse(firstRaw.slice(firstRaw.lastIndexOf('{'), firstRaw.lastIndexOf('}') + 1));
const out = path.join(ROOT, 'public/audio/mix.wav');
stderrOf(['-hide_banner', '-y', '-i', tmp, '-af',
  `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${first.input_i}:measured_TP=${first.input_tp}:measured_LRA=${first.input_lra}:measured_thresh=${first.input_thresh}:offset=${first.target_offset}:linear=true:print_format=json`,
  '-ar', String(SR), '-c:a', 'pcm_s24le', out]);
fs.rmSync(tmp);
const check = stderrOf(['-hide_banner', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
const I = check.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop(), TP = check.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop();
console.log(`Mischung → public/audio/mix.wav  (${I}, True ${TP})`);

// ------------------------------------------------------------ Raster: beats.json + Prüfung der Schnitte in S1–S4
const beats = [];
for (let f = 0; f < TL.durationInFrames; f += TL.beatFrames) beats.push(f);
fs.writeFileSync(path.join(ROOT, 'src/data/beats.json'), JSON.stringify({bpm: TL.bpm, beatFrames: TL.beatFrames, eighthFrames: TL.beatFrames / 2, beats}, null, 0) + '\n');
const cuts = [];
for (const s of TL.scenes.filter((x) => ['S1', 'S2', 'S3', 'S4'].includes(x.id))) {
  cuts.push(s.from);
  for (const x of s.shots ?? []) cuts.push(s.from + x.from);
  for (const d of s.days ?? []) for (const [, a] of d.shots) cuts.push(s.from + a);
  if (s.matchCut) cuts.push(s.from + s.matchCut.from, s.from + s.matchCut.cut, s.from + s.panel.from);
}
const off = cuts.filter((c) => c % (TL.beatFrames / 2) !== 0);
console.log(off.length ? `Schnitte außerhalb des Rasters: ${off.join(', ')}` : `Alle ${cuts.length} Schnitte in S1–S4 liegen auf Schlag oder Achtel.`);
if (off.length) process.exitCode = 1;
