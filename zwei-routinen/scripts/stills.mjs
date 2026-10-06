#!/usr/bin/env node
// Kontrollbilder: node scripts/stills.mjs 0,120,333 [ordner]  → PNGs (einmal bündeln, dann je Frame rendern)
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frames = (process.argv[2] || '0').split(',').map(Number);
const out = path.resolve(ROOT, process.argv[3] || 'out/stills');
fs.mkdirSync(out, {recursive: true});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src/index.ts'), publicDir: path.join(ROOT, 'public')});
const composition = await selectComposition({serveUrl, id: 'ZweiRoutinen', browserExecutable});
for (const frame of frames) {
  const file = path.join(out, `f${String(frame).padStart(4, '0')}.png`);
  await renderStill({serveUrl, composition, frame, output: file, browserExecutable});
}
console.log(`${frames.length} Kontrollbilder → ${path.relative(ROOT, out)}`);
