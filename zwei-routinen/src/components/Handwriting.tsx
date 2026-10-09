import React from 'react';
import {colors} from '../theme';
import {mapPoint, matrix3d, Quad} from '../homography';

// Handschrift auf dem Block (C7b): unleserliche, schreibschriftartige Wörter in Block-Koordinaten (0..1), perspektivisch
// über die vier Ecken des Blocks gelegt. Die Stiftspitze folgt genau dem Ende der Linie.
export const PAD: Quad = [[694, 859], [1706, 844], [1799, 1028], [769, 1028]];   // Ecken des Blocks in DESK/C7b (Quellpixel)
const C = 1000;                                                                  // Zeichenfläche (Block-Einheiten × 1000)

type Pt = [number, number];
// Der Block liegt quer vor dem Arzt (er sitzt links): Die Zeilen laufen im Bild von unten nach oben, die Buchstaben sind
// um 90° gedreht (Oberlängen zeigen nach links, zum Arzt hin), neue Zeilen beginnen rechts daneben.
// Gerechnet wird in Block-Pixeln (Breite ≈ 1000 px, Tiefe ≈ 180 px) und dann in Block-Koordinaten (0..1) umgerechnet.
const PW = 1000, PD = 180;
const word = (x0: number, y0: number, len: number, seed: number): Pt[] => {
  // Schreibschrift als Schleifenlinie (Zykloide) entlang der Grundlinie nach oben: Buchstaben ≈ 12 px breit, 13–19 px hoch
  const pitch = 12, K = (2 * Math.PI * len) / pitch, n = Math.round(K * 10), pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, k = t * K, letter = Math.floor(k / (2 * Math.PI));
    const r = Math.sin(seed * 7.1 + letter * 2.3), tall = r > 0.75 ? 2.1 : r < -0.85 ? -1.4 : 1;
    const vary = Math.abs(Math.sin(letter * 1.7 + seed)), loop = 3.5 + 5 * vary;
    const hgt = (12 + 6 * vary) * (tall > 0 ? tall : 1), drop = tall < 0 ? 18 * Math.max(0, -Math.cos(k)) : 0;
    const s = t * len - Math.sin(k) * loop, h = hgt * (1 - Math.cos(k)) / 2 - drop + Math.sin(t * 2.5 + seed) * 1.5;
    pts.push([(x0 - h) / PW, (y0 - s) / PD]);   // Grundlinie nach oben (−y), Buchstabenhöhe nach links (−x)
  }
  return pts;
};
// Zeilen: Start unten (vorne), drei Wörter nach oben, nächste Zeile 40 px weiter rechts
export const LINES = (x0: number) => {
  const words: Pt[][] = [];
  [[40, 30, 36], [34, 42, 26], [44, 30, 32]].forEach((lens, li) => {
    let y = 166;
    lens.forEach((l, wi) => { words.push(word(x0 + li * 40, y, l, li * 7 + wi * 3 + 1)); y -= l + 11; });
  });
  return words;
};

// Fortschritt p (0..1 der gesamten Tinte) → sichtbare Teile je Wort und aktuelle Stiftposition (Block-Koordinaten)
const lenOf = (w: Pt[]) => w.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - w[i - 1][0], p[1] - w[i - 1][1]) : 0), 0);
export const inkState = (words: Pt[][], p: number) => {
  const lens = words.map(lenOf), total = lens.reduce((a, b) => a + b, 0);
  let rest = Math.max(0, Math.min(1, p)) * total, tip: Pt = words[0][0];
  const shown = lens.map((L, i) => {
    if (rest <= 0) return 0;
    const take = Math.min(L, rest); rest -= take;
    // Stiftspitze am Ende des sichtbaren Stücks
    let acc = 0; const w = words[i];
    for (let k = 1; k < w.length; k++) {
      const s = Math.hypot(w[k][0] - w[k - 1][0], w[k][1] - w[k - 1][1]);
      if (acc + s >= take) { const r = (take - acc) / s; tip = [w[k - 1][0] + (w[k][0] - w[k - 1][0]) * r, w[k - 1][1] + (w[k][1] - w[k - 1][1]) * r]; break; }
      acc += s; tip = w[k];
    }
    return take / L;
  });
  return {shown, tip};
};
export const padToSrc = (u: number, v: number) => mapPoint(PAD, 1, 1, u, v);

export const Handwriting: React.FC<{words: Pt[][]; shown: number[]}> = ({words, shown}) => (
  <svg width={C} height={C} viewBox={`0 0 ${C} ${C}`} style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: matrix3d(PAD, C, C), overflow: 'visible'}}>
    {words.map((w, i) => shown[i] > 0 ? (
      <path key={i} d={'M' + w.map(([u, v]) => `${(u * C).toFixed(1)} ${(v * C).toFixed(1)}`).join(' L')} pathLength={1}
        fill="none" stroke={colors.charcoal} strokeOpacity={0.9} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${shown[i]} 1`} />
    ) : null)}
  </svg>
);
