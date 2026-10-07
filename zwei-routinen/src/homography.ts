// Projektive Abbildung Rechteck (w × h) → Viereck (TL, TR, BR, BL): für den Navi-Bildschirm in der Schulterperspektive.
export type Quad = number[][];

export const squareToQuad = (q: Quad) => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den, h = (dx1 * dy3 - dx3 * dy1) / den;
  return {a: x1 - x0 + g * x1, b: x3 - x0 + h * x3, c: x0, d: y1 - y0 + g * y1, e: y3 - y0 + h * y3, f: y0, g, h};
};

// Punkt (x, y) im Rechteck w × h → Punkt im Viereck
export const mapPoint = (q: Quad, w: number, h: number, x: number, y: number) => {
  const m = squareToQuad(q), u = x / w, v = y / h;
  const z = m.g * u + m.h * v + 1;
  return [(m.a * u + m.b * v + m.c) / z, (m.d * u + m.e * v + m.f) / z];
};

// CSS matrix3d für ein Element der Größe w × h (transform-origin 0 0)
export const matrix3d = (q: Quad, w: number, h: number) => {
  const m = squareToQuad(q);
  const M = [m.a / w, m.d / w, 0, m.g / w, m.b / h, m.e / h, 0, m.h / h, 0, 0, 1, 0, m.c, m.f, 0, 1];
  return `matrix3d(${M.join(',')})`;
};
