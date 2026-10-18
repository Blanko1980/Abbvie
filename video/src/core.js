'use strict';
/* 10 Jahre Alltag – Route-Explainer
 * Core: math, colour, shapes, typography, backgrounds, shared FX.
 * Every frame is a pure function of time t (seconds) -> frames can be
 * rendered in any order and in parallel. */

const W = 1920, H = 1080, TAU = Math.PI * 2;
const C = TL.cues;
const canvas = document.getElementById('c');
let ctx = canvas.getContext('2d');
// real (playback) time; scenes run on story time t, ambient motion and grain on REAL_T
let REAL_T = 0;

const SANS = '"Inter Display", "Inter", "Liberation Sans", sans-serif';
const TEXT = '"Inter", "Liberation Sans", sans-serif';
const OLDUI = '"Liberation Sans", Arial, sans-serif';
const SERIF = '"Caladea", "Liberation Serif", Georgia, serif';

// ---------------------------------------------------------------- math
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  lin: x => x,
  in2: x => x * x,
  out2: x => 1 - (1 - x) * (1 - x),
  in3: x => x * x * x,
  out3: x => 1 - Math.pow(1 - x, 3),
  io3: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  out5: x => 1 - Math.pow(1 - x, 5),
  io5: x => x < .5 ? 16 * Math.pow(x, 5) : 1 - Math.pow(-2 * x + 2, 5) / 2,
  outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
  inExpo: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10),
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
};
const ep = (t, a, b, f = E.io3) => f(prog(t, a, b));
// damped spring 0 -> 1 (with overshoot)
function spring(dt, f = 1.4, z = 5.5) {
  if (dt <= 0) return 0;
  return 1 - Math.exp(-z * dt) * Math.cos(TAU * f * dt);
}
// 0 -> 1 -> 0 hump
function bump(t, t0, d) { const p = (t - t0) / d; return p < 0 || p > 1 ? 0 : Math.sin(Math.PI * p); }
// decaying wobble for impacts
function wobble(t, t0, amp, f = 9, z = 7) { const d = t - t0; return d < 0 ? 0 : amp * Math.exp(-z * d) * Math.sin(TAU * f * d); }

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }

// ---------------------------------------------------------------- colour
const _hx = {};
function hx(c) {
  if (_hx[c]) return _hx[c];
  const h = c.slice(1);
  return (_hx[c] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)));
}
const rgba = (c, a = 1) => { const [r, g, b] = hx(c); return `rgba(${r},${g},${b},${a})`; };
const mix = (a, b, t, al = 1) => {
  const A = hx(a), B = hx(b);
  return `rgba(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))},${al})`;
};

const P = {
  cream: '#F6F0E5', creamEdge: '#DCCFB8', ink: '#2A251F', inkSoft: '#7A6E5F',
  navy: '#121A45', navyEdge: '#050817', navyMid: '#1B2563',
  cyan: '#5CE6DA', violet: '#8C7DFF', pink: '#FF7AB8', warm: '#FFB36E', coral: '#FF7E67',
  white: '#FFFFFF', grey: '#9BA1AD', charcoal: '#16181D',
  green16: '#4CD964', blue16: '#007AFF', mint: '#3CF2A6',
  // RINVOQ brand (primary palette): gold + charcoal, plum only as accent
  gold: '#FFD100', char: '#25282A', plum: '#90124A', gold70: '#FFDF4D',
};

// ---------------------------------------------------------------- shapes
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function circ(x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }
function ell(x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); }
function star4(x, y, r, rot = 0, inner = 0.26) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + i * Math.PI / 4, q = i % 2 === 0 ? r : r * inner;
    ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
  }
  ctx.closePath();
}
// smooth sparkle (concave four-point star like a modern "AI" glyph)
function sparkle(x, y, r, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = rot + i * Math.PI / 2, b = a + Math.PI / 2;
    const p1 = [x + Math.cos(a) * r, y + Math.sin(a) * r], p2 = [x + Math.cos(b) * r, y + Math.sin(b) * r];
    if (i === 0) ctx.moveTo(p1[0], p1[1]);
    ctx.quadraticCurveTo(x, y, p2[0], p2[1]);
  }
  ctx.closePath();
}
function glow(x, y, r, color, a) {
  if (a <= 0 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(0.45, rgba(color, a * 0.35));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
}
function check(x, y, s, lw, color, p = 1) {
  // animated check mark, p = draw progress
  const pts = [[-0.42, 0.02], [-0.12, 0.32], [0.45, -0.3]];
  const l1 = Math.hypot(0.3, 0.3), l2 = Math.hypot(0.57, 0.62), L = (l1 + l2) * p;
  ctx.beginPath(); ctx.moveTo(x + pts[0][0] * s, y + pts[0][1] * s);
  if (L <= l1) { const f = L / l1; ctx.lineTo(x + lerp(pts[0][0], pts[1][0], f) * s, y + lerp(pts[0][1], pts[1][1], f) * s); }
  else {
    ctx.lineTo(x + pts[1][0] * s, y + pts[1][1] * s);
    const f = (L - l1) / l2; ctx.lineTo(x + lerp(pts[1][0], pts[2][0], f) * s, y + lerp(pts[1][1], pts[2][1], f) * s);
  }
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
// Catmull-Rom spline through points
function spline(pts, move = true) {
  if (move) ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
}
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
// sub-polyline between fractions f0..f1 of total length
function subPoly(pts, f0, f1) {
  const L = polyLen(pts), a = f0 * L, b = f1 * L, out = [];
  let acc = 0;
  const at = (i, d) => { const s = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) || 1, f = d / s; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; };
  for (let i = 0; i < pts.length - 1; i++) {
    const s = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    const s0 = acc, s1 = acc + s;
    if (s1 >= a && s0 <= b) {
      if (!out.length) out.push(at(i, Math.max(0, a - s0)));
      if (s1 <= b) out.push(pts[i + 1]); else { out.push(at(i, b - s0)); break; }
    }
    acc = s1;
  }
  return out;
}
function pointAt(pts, f) { const s = subPoly(pts, 0, clamp(f, 0.0001, 1)); return s[s.length - 1]; }
function strokePoly(pts, w, color, cap = 'round') {
  if (pts.length < 2) return;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineCap = cap; ctx.lineJoin = 'round'; ctx.stroke();
}

// ---------------------------------------------------------------- canvases
function mkCanvas(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const OFF = [mkCanvas(), mkCanvas()];
function withCtx(cv, fn) {
  const prev = ctx;
  ctx = cv.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.save(); fn(); ctx.restore();
  ctx = prev;
}
const _frozen = {};
function frozen(key, fn) { if (!_frozen[key]) { const c = mkCanvas(); withCtx(c, fn); _frozen[key] = c; } return _frozen[key]; }

// ---------------------------------------------------------------- typography
function setFont(w, s, fam = SANS) { ctx.font = `${w} ${s}px ${fam}`; }
function txt(s, x, y, o = {}) {
  setFont(o.weight || 600, o.size || 32, o.fam || SANS);
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  ctx.letterSpacing = (o.ls || 0) + 'px';
  ctx.fillStyle = o.color || '#fff';
  const a0 = ctx.globalAlpha;
  if (o.alpha !== undefined) ctx.globalAlpha = a0 * o.alpha;
  ctx.fillText(s, x, y);
  ctx.globalAlpha = a0;
  ctx.letterSpacing = '0px';
}
function tw(s, size, weight = 600, fam = SANS, ls = 0) {
  setFont(weight, size, fam); ctx.letterSpacing = ls + 'px';
  const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w;
}

/* Kinetic caption: words rise out of a mask, staggered.
 * o: size, weight, color, accent{word:color}, lh, stagger, dur, tout, align, alpha, strike(0..1), strikeColor */
function caption(str, x, y, t, tin, o = {}) {
  const size = o.size || 66, weight = o.weight || 700, lh = o.lh || size * 1.14;
  const stg = o.stagger ?? 0.055, dur = o.dur || 0.62, tout = o.tout ?? 1e9;
  setFont(weight, size);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.letterSpacing = (o.ls || 0) + 'px';
  const sp = ctx.measureText(' ').width;
  const lines = str.split('\n');
  let wi = 0;
  const a0 = ctx.globalAlpha;
  lines.forEach((line, li) => {
    const words = line.split(' ');
    const ly = y + li * lh;
    const ws = words.map(w => ctx.measureText(w).width);
    const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    const x0 = cx;
    ctx.save();
    ctx.beginPath(); ctx.rect(cx - 60, ly - size * 1.02, total + 120, size * 1.36); ctx.clip();
    words.forEach((w, i) => {
      const a = tin + wi * stg;
      const p = E.out5(prog(t, a, a + dur));
      const q = E.in3(prog(t, tout + wi * stg * 0.5, tout + wi * stg * 0.5 + 0.38));
      if (p > 0 && q < 1) {
        ctx.globalAlpha = a0 * (o.alpha ?? 1) * Math.min(1, p * 1.4) * (1 - q);
        ctx.fillStyle = (o.accent && o.accent[w]) || o.color || '#fff';
        ctx.fillText(w, cx, ly + (1 - p) * size * 1.05 - q * size * 1.05);
      }
      cx += ws[i] + sp; wi++;
    });
    ctx.restore();
    if (o.strike > 0) {
      ctx.globalAlpha = a0 * (o.alpha ?? 1);
      ctx.beginPath(); ctx.moveTo(x0 - 6, ly - size * 0.33); ctx.lineTo(x0 - 6 + (total + 12) * o.strike, ly - size * 0.33);
      ctx.lineWidth = Math.max(3, size * 0.075); ctx.lineCap = 'round'; ctx.strokeStyle = o.strikeColor || P.cyan; ctx.stroke();
    }
  });
  ctx.globalAlpha = a0;
  ctx.letterSpacing = '0px';
}

/* Old/new caption pair used by every "upgrade" scene. */
const CAP_X = 150, CAP_Y = 958;
function capPair(t, oldStr, newStr, tOld, tMorph, tNew, o = {}) {
  const e = ep(t, tMorph, tMorph + 0.6);
  const m = E.io3(prog(t, tMorph + 0.05, tMorph + 0.5));
  ctx.save();
  ctx.translate(CAP_X, lerp(CAP_Y, CAP_Y - 92, m));
  const s = lerp(1, 0.56, m); ctx.scale(s, s);
  caption(oldStr, 0, 0, t, tOld, {
    size: 68, weight: 700, color: mix(P.ink, '#C9CFE6', e), alpha: lerp(1, 0.75, m),
    strike: E.io3(prog(t, tMorph + 0.15, tMorph + 0.55)), strikeColor: P.cyan, tout: o.tout, accent: o.oldAccent,
  });
  ctx.restore();
  caption(newStr, CAP_X, CAP_Y, t, tNew, { size: 68, weight: 750, color: '#FFFFFF', accent: o.newAccent, tout: o.tout });
}

// ---------------------------------------------------------------- backgrounds
function bgOld(t) {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.4, 80, W * 0.5, H * 0.5, 1250);
  g.addColorStop(0, '#FBF7EF'); g.addColorStop(0.55, P.cream); g.addColorStop(1, P.creamEdge);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // faint paper fibres
  ctx.save(); ctx.globalAlpha = 0.05; ctx.strokeStyle = '#8A7350'; ctx.lineWidth = 1;
  const r = rng(5);
  for (let i = 0; i < 26; i++) {
    const y = r() * H, x = r() * W, l = 200 + r() * 500;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + l * .3, y + 10, x + l * .6, y - 10, x + l, y + 4); ctx.stroke();
  }
  ctx.restore();
}
function bgNew(t, warm = 0) {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 50, W * 0.5, H * 0.5, 1300);
  g.addColorStop(0, P.navyMid); g.addColorStop(0.55, P.navy); g.addColorStop(1, P.navyEdge);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const r = REAL_T;
  glow(W * 0.22 + Math.sin(r * 0.37) * 140, H * 0.25 + Math.cos(r * 0.29) * 90, 720, P.violet, 0.18);
  glow(W * 0.82 + Math.cos(r * 0.31) * 160, H * 0.7 + Math.sin(r * 0.41) * 80, 760, '#22B8C9', 0.15);
  glow(W * 0.6 + Math.sin(r * 0.23 + 2) * 200, H * 0.1, 520, P.pink, 0.07);
  if (warm > 0) glow(W * 0.4, H * 0.45, 900, P.warm, 0.25 * warm);
  ctx.restore();
  // fine dot grid = "digital"
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.045)';
  for (let y = 30; y < H; y += 44) for (let x = 30 + ((y / 44) % 2) * 22; x < W; x += 44) ctx.fillRect(x, y, 2, 2);
  ctx.restore();
}
// RINVOQ world: bold charcoal, lit with a little gold
function bgBrand(t, goldX = W * 0.5, goldY = H * 0.45, gold = 0.12) {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 60, W * 0.5, H * 0.5, 1300);
  g.addColorStop(0, '#2C3033'); g.addColorStop(0.6, P.char); g.addColorStop(1, '#1A1C1E');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (gold > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(goldX + Math.sin(REAL_T * 0.3) * 40, goldY, 900, P.gold, gold); ctx.restore(); }
}
function bgGrey(t) {
  const g = ctx.createRadialGradient(W * 0.45, H * 0.45, 60, W * 0.5, H * 0.5, 1250);
  g.addColorStop(0, '#3A3D44'); g.addColorStop(0.6, '#24262B'); g.addColorStop(1, '#121317');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// Old world, with the new world spreading from (cx,cy) as a circle after tm.
function bgUpgrade(t, tm, cx, cy, oldFn = bgOld, newFn = bgNew) {
  const p = prog(t, tm, tm + 1.0);
  if (p <= 0) return oldFn(t);
  if (p >= 1) return newFn(t);
  oldFn(t);
  ctx.save(); circ(cx, cy, E.out3(p) * 2300); ctx.clip(); newFn(t); ctx.restore();
}
// Ring + sparkle burst that sells every "upgrade"
const FX_NEW = { ring: P.cyan, inner: P.violet, burst: null };
const FX_BRAND = { ring: P.gold, inner: P.plum, burst: [P.gold, '#FFFFFF', P.gold70, P.gold] };
function upgradeFX(t, tm, cx, cy, seed = 1, pal = FX_NEW) {
  const p = prog(t, tm, tm + 1.0);
  if (p <= 0 || p >= 1) return;
  const R = E.out3(p) * 2300;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 70 * (1 - p) + 2; ctx.strokeStyle = rgba(pal.ring, 0.22 * (1 - p)); circ(cx, cy, R); ctx.stroke();
  ctx.lineWidth = 5 * (1 - p) + 1; ctx.strokeStyle = rgba('#FFFFFF', 0.85 * (1 - p)); circ(cx, cy, R); ctx.stroke();
  ctx.lineWidth = 22 * (1 - p); ctx.strokeStyle = rgba(pal.inner, 0.3 * (1 - p)); circ(cx, cy, R * 0.93); ctx.stroke();
  glow(cx, cy, 260 + 200 * p, '#FFFFFF', 0.55 * Math.pow(1 - p, 3));
  ctx.restore();
  burst(t, tm, cx, cy, { n: 34, seed, speed: 1100, life: 0.9, size: 14, colors: pal.burst || undefined });
}
/* Dry-brush stroke along a polyline - the RINVOQ brush element.
 * p = paint progress 0..1; color may be a CSS colour or a canvas gradient. */
function brush(pts, w, color, p = 1, seed = 1, o = {}) {
  if (p <= 0 || pts.length < 2) return;
  const r = rng(seed), nb = o.bristles || Math.max(12, Math.round(w / 2));
  const nrm = pts.map((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  });
  const taper = o.taper ?? 0.45;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const a0 = ctx.globalAlpha;
  for (let k = 0; k < nb; k++) {
    const off = (k / (nb - 1) - 0.5) * w, edge = Math.abs(off) / (w / 2);
    const s0 = r() * 0.06 * (0.3 + edge), e0 = 1 - r() * (0.03 + 0.32 * edge * edge);
    const wob = r() * 1000, alpha = 0.55 + 0.45 * r(), lw = (w / nb) * (1.5 + r() * 1.3);
    const line = pts.map((q, i) => {
      const u = i / (pts.length - 1);
      const tp = lerp(1 - taper, 1, Math.sin(Math.PI * clamp(0.08 + u * 0.92)));
      const j = noise1(wob + i * 0.4) * w * 0.04;
      return [q[0] + nrm[i][0] * (off * tp + j), q[1] + nrm[i][1] * (off * tp + j)];
    });
    const end = Math.min(e0, p);
    if (end <= s0) continue;
    ctx.globalAlpha = a0 * alpha * (o.alpha ?? 1);
    if (r() < 0.22 * edge + 0.05) {   // dry streak: a gap in this bristle
      const g0 = 0.35 + r() * 0.4, g1 = g0 + 0.05 + r() * 0.12;
      if (end > s0) strokePoly(subPoly(line, s0, Math.min(end, g0)), lw, color);
      if (end > g1) strokePoly(subPoly(line, g1, end), lw, color);
    } else strokePoly(subPoly(line, s0, end), lw, color);
  }
  ctx.globalAlpha = a0;
  ctx.restore();
}
function arcPts(cx, cy, rx, ry, a0, a1, n = 48) {
  return Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
}
function burst(t, t0, cx, cy, o = {}) {
  const n = o.n || 28, life = o.life || 0.8, speed = o.speed || 500, size = o.size || 10;
  const colors = o.colors || [P.cyan, P.violet, '#FFFFFF', P.pink];
  const p = (t - t0) / life;
  if (p < 0 || p > 1) return;
  const r = rng(o.seed || 1);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = (o.a0 ?? 0) + r() * (o.spread ?? TAU), s = speed * (0.35 + r() * 0.85), sz = size * (0.45 + r()), rot = r() * 3;
    const d = s * life * E.out3(p);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d + (o.gravity || 0) * Math.pow(p * life, 2);
    ctx.globalAlpha = Math.pow(1 - p, 1.4);
    ctx.fillStyle = colors[i % colors.length];
    star4(x, y, sz * (1 - p * 0.6), rot + p * 3); ctx.fill();
  }
  ctx.restore();
}
function shake(t, t0, amp, dur = 0.35) {
  const p = prog(t, t0, t0 + dur);
  if (p <= 0 || p >= 1) return [0, 0];
  const k = amp * Math.pow(1 - p, 2);
  return [noise1(t * 60) * k, noise1(t * 60 + 50) * k];
}

// ---------------------------------------------------------------- film finish
const GRAIN = (() => {
  const c = mkCanvas(256, 256), g = c.getContext('2d'), id = g.createImageData(256, 256), r = rng(7);
  for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0); return c;
})();
function grain(t, a) {
  if (a <= 0) return;
  const f = Math.floor(REAL_T * 24), r = rng(f + 11);
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat');
  ctx.translate(-Math.floor(r() * 256), -Math.floor(r() * 256));
  ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}
const VIGNETTE = (() => {
  const c = mkCanvas(), g = c.getContext('2d');
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.42)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H); return c;
})();
