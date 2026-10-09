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
  // Block-Koordinaten: u = Breite (≈ 1000 px), v = Tiefe (≈ 180 px) – deshalb sind die Ausschläge in v deutlich größer
  const pts: Pt[] = [], n = Math.round(len * 260);
  for (let i = 0; i <= n; i++) {
    const t = i / n, k = t * len * 80 + seed;
    const hump = (1 - Math.cos(k)) / 2, tall = Math.sin(seed * 2.3 + t * 9) > 0.6 ? 1.8 : 1;
    pts.push([u0 + t * len - Math.sin(k) * 0.007, v - hump * 0.07 * tall]);
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
        fill="none" stroke={colors.charcoal} strokeOpacity={0.9} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${shown[i]} 1`} />
    ) : null)}
  </svg>
);
