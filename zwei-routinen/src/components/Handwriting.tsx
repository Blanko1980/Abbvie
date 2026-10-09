import React from 'react';
import {colors} from '../theme';
import {mapPoint, matrix3d, Quad} from '../homography';

// Handschrift auf dem Block (C7b): unleserliche, schreibschriftartige Wörter in Block-Koordinaten (0..1), perspektivisch
// über die vier Ecken des Blocks gelegt. Die Stiftspitze folgt genau dem Ende der Linie.
export const PAD: Quad = [[694, 859], [1706, 844], [1799, 1028], [769, 1028]];   // Ecken des Blocks in DESK/C7b (Quellpixel)
const C = 1000;                                                                  // Zeichenfläche (Block-Einheiten × 1000)

type Pt = [number, number];
// Wörter einer Zeile: Schleifen nach oben, unterschiedliche Längen, Lücken dazwischen
const word = (u0: number, len: number, v: number, seed: number): Pt[] => {
  // Schreibschrift als Schleifenlinie (Zykloide): kleine Bögen von etwa 12 px Breite und 15 px Höhe, die waagerecht
  // nach rechts laufen; einzelne Ober- und Unterlängen. Block-Koordinaten: u ≈ 1000 px breit, v ≈ 180 px tief.
  const pitch = 0.013, K = (2 * Math.PI * len) / pitch, n = Math.round(K * 10), pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, k = t * K, letter = Math.floor(k / (2 * Math.PI));
    const r = Math.sin(seed * 7.1 + letter * 2.3), tall = r > 0.75 ? 2.1 : r < -0.85 ? -1.4 : 1;
    const vary = Math.abs(Math.sin(letter * 1.7 + seed)), loop = 0.0035 + 0.005 * vary;
    const hgt = (0.065 + 0.03 * vary) * (tall > 0 ? tall : 1), drop = tall < 0 ? 0.11 * Math.max(0, -Math.cos(k)) : 0;
    pts.push([u0 + t * len - Math.sin(k) * loop, v - hgt * (1 - Math.cos(k)) / 2 + drop + Math.sin(t * 2.5 + seed) * 0.01]);
  }
  return pts;
};
export const LINES = (v0: number, u0: number, width: number) => {
  const words: Pt[][] = [];
  [[0.22, 0.18, 0.3], [0.16, 0.26, 0.2], [0.27, 0.14, 0.24]].forEach((lens, li) => {
    let u = u0 + (li === 0 ? 0 : 0.02 * li);
    lens.forEach((l, wi) => { const len = l * width; words.push(word(u, len, v0 + li * 0.22, li * 7 + wi * 3 + 1)); u += len + 0.04; });
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
