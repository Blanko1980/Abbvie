import {Easing, interpolate} from 'remotion';
import timeline from './data/timeline.json';
import assets from './data/assets.json';

export const W = 1920;
export const H = 1080;

// Farbe hat genau eine Aufgabe: Teal = der bewährte Weg, Gold = der neue Weg. Alles andere neutral.
export const colors = {
  white: '#FFFFFF',
  charcoal: '#25282A',
  deepTeal2: '#366B8F',
  gold: '#FFD100',
  mapBg: '#F4F3F0',
  mapBlock: '#ECEAE6',
  street: '#FFFFFF',
  streetEdge: '#DCDAD5',
  muted: '#8C8E90',
  line: '#D9D7D3',
  coffee: '#6B3F22',
};

// TODO brand font: Markenschriften (Graphik / Neue Haas Grotesk) fehlen in /public/fonts – Ersatz Source Sans 3 (OFL)
export const sans = "'SourceSans3', 'Helvetica Neue', Arial, sans-serif";
// TODO brand font: Rinvoq-Handschrift fehlt – Ersatz Caveat (OFL)
export const script = "'Caveat', 'Segoe Script', cursive";

export const ease = {
  inOut: Easing.bezier(0.45, 0, 0.55, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.5, 0, 0.75, 0),
  // Innehalten: gleiche Kurve für Finger (S5) und Slip-Hand (S7)
  settle: Easing.bezier(0.2, 0.7, 0.2, 1),
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const lerp = (f: number, [a, b]: number[], [x, y]: number[], e?: (t: number) => number) =>
  interpolate(f, [a, b], [x, y], {...clamp, easing: e});

export const T = timeline;
export const A = assets as Record<string, any>;
export const scene = (id: string) => timeline.scenes.find((s) => s.id === id) as any;

// Innehalten (S5-Finger und S7-Hand identisch): eine einzige, sehr kleine Atembewegung über die Haltezeit
export const settleHold = (f: number, [a, b]: number[]) => (f < a || f >= b ? 0 : Math.sin(((f - a) / (b - a)) * Math.PI * 2));
