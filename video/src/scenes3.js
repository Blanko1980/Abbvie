'use strict';
/* Scenes 32–60 s: Freeze -> Neurodermitis 2016 / 2017 / heute -> Raster -> Endcard */

// ================================================================ 32–35 s  FREEZE
function sceneFreeze(t) {
  const img = frozen('rx', () => sceneRx(C.freeze - 0.004));
  ctx.fillStyle = P.charcoal; ctx.fillRect(0, 0, W, H);
  const g = ep(t, C.freeze, C.freeze + 0.9, E.out3);
  const z = lerp(1, 0.9, ep(t, C.freeze, 35.0, E.out3));
  const fade = lerp(1, 0.22, ep(t, C.freeze + 0.5, C.freeze + 1.6));
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  ctx.globalAlpha = fade;
  ctx.filter = `grayscale(${g.toFixed(3)}) brightness(${lerp(1, 0.75, g).toFixed(3)})`;
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';
  ctx.restore();
  // "freeze" frame flash and subtle frost lines at the border
  const fl = Math.pow(1 - prog(t, C.freeze, C.freeze + 0.25), 2);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${0.25 * fl})`; ctx.fillRect(0, 0, W, H); }
  caption('Und in der Neurodermitis-Therapie?', W / 2, 560, t, 32.75, { size: 76, weight: 700, color: '#F2F3F5', align: 'center', stagger: 0.09, dur: 0.8, tout: 34.55, accent: { 'Neurodermitis-Therapie?': '#FFFFFF' } });
  const ul = ep(t, 33.5, 34.1, E.io3) * (1 - ep(t, 34.5, 34.8));
  if (ul > 0) {
    const w = tw('Neurodermitis-Therapie?', 76, 700);
    const x1 = W / 2 + tw('Und in der Neurodermitis-Therapie?', 76, 700) / 2 - w;
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(x1, 586, w * ul, 5);
  }
}

// ================================================================ 35–50 s  NEURODERMITIS
const FIG = { x: 830, gy: 780, s: 1.1 };
const SK = '#E9B996', SKD = '#C98E6B';
const COL = { top16: '#666C78', top16d: '#555B66', pants16: '#434955', shirt: '#F3F5FA', shorts: '#FFD100', shoe: '#1E2230', hair: '#3B2A22' };
const ARM1 = 92, ARM2 = 88, LEG1 = 88, LEG2 = 86;

function ik(S, T, l1, l2, bend) {
  let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy) || 1;
  const mx = l1 + l2 - 0.5;
  if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
  const a = Math.atan2(dy, dx), c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), al = Math.acos(c);
  const E1 = [S[0] + Math.cos(a + bend * al) * l1, S[1] + Math.sin(a + bend * al) * l1];
  return [S, E1, [S[0] + dx, S[1] + dy]];
}
function scratchEnv(t) {
  let amp = 0, eng = 0;
  for (const [a, b, g] of C.scratch) {
    const e = ep(t, a - 0.35, a, E.io3) * (1 - ep(t, b, b + 0.35, E.io3));
    eng = Math.max(eng, e); amp = Math.max(amp, e * g);
  }
  return [eng, amp, TAU * C.scratchFreq * (t - C.scratch[0][0])];
}
function figure(t) {
  const joy = ep(t, C.clothes - 0.05, C.clothes + 0.6, E.out3);
  const y17 = ep(t, 40.7, 41.4);
  const hp = prog(t, C.clothes - 0.08, C.clothes + 0.42);
  const hop = Math.sin(Math.PI * hp) * 46;
  const beat = t > 45 ? Math.abs(Math.sin(TAU * (REAL_T - 58))) * 7 : 0;   // on the music's beat
  const breathe = Math.sin(t * 2.3) * 2.2;
  const hunch = lerp(lerp(16, 10, y17), -4, joy);
  const pelvis = [0, -180 - hop - beat * 0.6 + breathe * 0.3];
  const chest = [pelvis[0] + lerp(4, 0, joy), pelvis[1] - 160 + hunch + breathe];
  const tilt = lerp(lerp(0.2, -0.12, y17), -0.04 + Math.sin(t * 3) * 0.03 * joy, joy);
  const head = [chest[0] + lerp(10, 0, joy) + lerp(0, 6, y17) * (1 - joy), chest[1] - 70 + hunch * 0.35];
  const shL = [chest[0] - 50, chest[1] + 6], shR = [chest[0] + 50, chest[1] + 6];
  const hipL = [pelvis[0] - 24, pelvis[1]], hipR = [pelvis[0] + 24, pelvis[1]];
  const lift = hop * 0.8;
  const footL = [-40 - 16 * joy, -12 - lift], footR = [40 + 16 * joy, -12 - lift];
  const legL = ik(hipL, footL, LEG1, LEG2, 1), legR = ik(hipR, footR, LEG1, LEG2, -1);
  const [eng, amp, ph] = scratchEnv(t);
  const handA16 = [chest[0] + 34, chest[1] + 108];
  const sway = Math.sin(TAU * (REAL_T - 58) * 0.5) * 14 * joy;
  const handA = [lerp(handA16[0], chest[0] - 150 + sway, joy), lerp(handA16[1], chest[1] - 168, joy)];
  const armA = ik(shL, handA, ARM1, ARM2, 1);
  const u = 0.52 + 0.3 * Math.sin(ph) * amp;
  const onArm = [lerp(armA[1][0], armA[2][0], u), lerp(armA[1][1], armA[2][1], u) - 11 + Math.cos(ph * 2) * 3 * amp];
  const rest = [chest[0] + 70, chest[1] + 162];
  let handB = [lerp(rest[0], onArm[0], eng), lerp(rest[1], onArm[1], eng)];
  handB = [lerp(handB[0], chest[0] + 150 + sway, joy), lerp(handB[1], chest[1] - 168, joy)];
  const armB = ik(shR, handB, ARM1, ARM2, -1);
  const torso = [[shL[0] - 12, shL[1] - 10], [shR[0] + 12, shR[1] - 10], [hipR[0] + 12, hipR[1] + 6], [hipL[0] - 12, hipL[1] + 6]];
  return { joy, y17, pelvis, chest, head, tilt, legL, legR, armA, armB, torso, amp, eng, ph };
}
const PATCHES = (() => {
  const r = rng(321), out = [];
  for (let i = 0; i < 10; i++) out.push({ limb: 'armA', u: 0.6 + r() * 0.36, v: (r() - 0.5) * 16, r: 5 + r() * 6, dot: i === 4 });
  for (let i = 0; i < 2; i++) out.push({ limb: 'armB', u: 0.82 + r() * 0.12, v: (r() - 0.5) * 12, r: 4 + r() * 4 });
  [[-25, 12, 7], [24, 16, 6], [-8, 33, 5], [30, -2, 4]].forEach(p => out.push({ limb: 'head', x: p[0], y: p[1], r: p[2] }));
  for (const lg of ['legL', 'legR']) for (let i = 0; i < 3; i++) out.push({ limb: lg, u: 0.55 + r() * 0.35, v: (r() - 0.5) * 16, r: 5 + r() * 5 });
  out.forEach(p => { p.seed = Math.floor(r() * 1000); });
  return out;
})();
function severity(t, dot) {
  const base = lerp(1, 0.62, ep(t, 41.0, 41.7));
  const heal = ep(t, C.clothes + 0.25, C.clothes + 1.7, E.io3);
  return dot ? lerp(base, 0.4, heal) : base * (1 - heal);
}
function limbPoint(pts, u, v) {
  const p = pointAt(pts, u), q = pointAt(pts, clamp(u + 0.02, 0, 1)), a = Math.atan2(q[1] - p[1], q[0] - p[0]);
  return [p[0] - Math.sin(a) * v, p[1] + Math.cos(a) * v];
}
function drawPatch(x, y, r, sev, seed) {
  if (sev <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.6);
  g.addColorStop(0, `rgba(205,52,70,${0.85 * sev})`); g.addColorStop(0.55, `rgba(220,80,90,${0.45 * sev})`); g.addColorStop(1, 'rgba(220,80,90,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r * 1.6, y - r * 1.6, r * 3.2, r * 3.2);
  const rr_ = rng(seed);
  ctx.fillStyle = `rgba(170,30,50,${0.6 * sev})`;
  for (let k = 0; k < 3; k++) { circ(x + (rr_() - 0.5) * r, y + (rr_() - 0.5) * r, 1.2 + rr_() * 1.5); ctx.fill(); }
}
function limb(pts, skinW, sleeve, sleeveW, col) {
  strokePoly(pts, skinW, SK);
  if (sleeve > 0) strokePoly(subPoly(pts, 0, sleeve), sleeveW, col);
}
function drawFigure(t, f) {
  const long = t < C.clothes;
  const sev = (dot) => severity(t, dot);
  // legs
  [f.legL, f.legR].forEach((lg, i) => {
    limb(lg, 26, long ? 0.97 : 0.4, long ? 40 : 38, long ? COL.pants16 : COL.shorts);
    const a = lg[2];
    ctx.save(); ctx.translate(a[0], a[1]); ell(i ? 14 : -14, 6, 26, 12); ctx.fillStyle = COL.shoe; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(i ? -10 : -38, 14, 48, 3); ctx.restore();
  });
  // torso
  const tp = f.torso;
  ctx.beginPath(); tp.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
  ctx.fillStyle = long ? COL.top16 : COL.shirt; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 22; ctx.lineJoin = 'round'; ctx.fill(); ctx.stroke();
  if (!long) {
    // shorts waistband
    const p = f.pelvis; rr(p[0] - 50, p[1] - 14, 100, 30, 10); ctx.fillStyle = COL.shorts; ctx.fill();
    // little logo-free graphic on the shirt
    ctx.fillStyle = P.gold; sparkle(f.chest[0] + 22, f.chest[1] + 44, 11, 0); ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(f.chest[0], f.chest[1] + 10); ctx.lineTo(f.pelvis[0], f.pelvis[1] - 10); ctx.stroke();
  }
  // neck + collar
  strokePoly([f.chest, [f.head[0], f.head[1] + 20]], 22, SK);
  if (long) { rr(f.chest[0] - 30, f.chest[1] - 40, 60, 48, 14); ctx.fillStyle = COL.top16d; ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(f.chest[0], f.chest[1] - 10, 22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.strokeStyle = '#D9DDE6'; ctx.lineWidth = 5; ctx.stroke(); }
  // head
  ctx.save(); ctx.translate(f.head[0], f.head[1]); ctx.rotate(f.tilt);
  circ(0, 0, 42); ctx.fillStyle = SK; ctx.fill();
  ctx.save(); circ(0, 0, 42); ctx.clip(); ell(-2, -30, 52, 30); ctx.fillStyle = COL.hair; ctx.fill(); ell(-30, -8, 14, 26); ctx.fill(); ctx.restore();
  const blink = (bump(t, 37.2, 0.14) + bump(t, 47.8, 0.14)) > 0.5 ? 0.15 : 1;
  ctx.fillStyle = '#2A2230';
  ell(-14, 4, 3.8, 3.8 * blink); ctx.fill(); ell(14, 4, 3.8, 3.8 * blink); ctx.fill();
  ctx.strokeStyle = '#3B2A22'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  const bw = f.joy;
  ctx.beginPath(); ctx.moveTo(-22, lerp(-7, -12, bw)); ctx.lineTo(-7, lerp(-12, -14, bw)); ctx.moveTo(22, lerp(-7, -12, bw)); ctx.lineTo(7, lerp(-12, -14, bw)); ctx.stroke();
  ctx.lineWidth = 3.2; ctx.beginPath();
  if (f.joy < 0.5) ctx.arc(0, 30, 9, 1.2 * Math.PI, 1.8 * Math.PI); else ctx.arc(0, 12, 13, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();
  PATCHES.filter(p => p.limb === 'head').forEach(p => drawPatch(p.x, p.y, p.r, sev(false), p.seed));
  ctx.restore();
  PATCHES.filter(p => p.limb === 'legL' || p.limb === 'legR').forEach(p => { if (long) return; const q = limbPoint(f[p.limb], p.u, p.v * 0.6); drawPatch(q[0], q[1], p.r, sev(false), p.seed); });
  // arms (B in front: it scratches A)
  limb(f.armA, 22, long ? 0.55 : 0.28, 34, long ? COL.top16 : COL.shirt);
  circ(f.armA[2][0], f.armA[2][1], 13); ctx.fillStyle = SK; ctx.fill();
  PATCHES.filter(p => p.limb === 'armA').forEach(p => {
    const q = limbPoint(f.armA, p.u, p.v * 0.55);
    drawPatch(q[0], q[1], p.dot ? lerp(p.r, 3.2, ep(t, C.clothes + 0.2, C.clothes + 1.6)) : p.r, sev(p.dot), p.seed);
  });
  // itch marks
  if (f.amp > 0.05) {
    ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${0.55 * f.amp})`; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    const c = limbPoint(f.armA, 0.72, 0), r = rng(Math.floor(t * 9));
    for (let k = 0; k < 3; k++) {
      const a = -Math.PI / 2 + (k - 1) * 0.7 + (r() - 0.5) * 0.3, d0 = 30 + r() * 10;
      ctx.beginPath();
      for (let s = 0; s < 5; s++) { const d = d0 + s * 7, o = (s % 2 ? 4 : -4); ctx.lineTo(c[0] + Math.cos(a) * d - Math.sin(a) * o, c[1] + Math.sin(a) * d + Math.cos(a) * o); }
      ctx.stroke();
    }
    ctx.restore();
  }
  limb(f.armB, 22, long ? 0.94 : 0.28, 34, long ? COL.top16 : COL.shirt);
  circ(f.armB[2][0], f.armB[2][1], 13); ctx.fillStyle = SK; ctx.fill();
  PATCHES.filter(p => p.limb === 'armB').forEach(p => { const q = limbPoint(f.armB, p.u, p.v * 0.5); drawPatch(q[0], q[1], p.r, sev(false), p.seed); });
}
let _pieces = null;
function clothesPieces() {
  if (_pieces) return _pieces;
  const f = figure(C.clothes - 0.001), r = rng(55);
  const mk = (pts, w, col) => ({ pts, w, col });
  _pieces = [
    mk(subPoly(f.armA, 0.27, 0.55), 34, COL.top16), mk(subPoly(f.armB, 0.27, 0.94), 34, COL.top16),
    mk(subPoly(f.legL, 0.39, 0.97), 40, COL.pants16), mk(subPoly(f.legR, 0.39, 0.97), 40, COL.pants16),
    { poly: f.torso, col: COL.top16 }, { rect: [f.chest[0] - 30, f.chest[1] - 40, 60, 48], col: COL.top16d },
  ];
  _pieces.forEach(p => {
    const pts = p.pts || p.poly || [[p.rect[0] + 30, p.rect[1] + 24]];
    p.c = [pts.reduce((a, q) => a + q[0], 0) / pts.length, pts.reduce((a, q) => a + q[1], 0) / pts.length];
    p.v = [(p.c[0] - f.chest[0]) * 3.2 + (r() - 0.5) * 300, -500 - r() * 450];
    p.w0 = (r() - 0.5) * 12;
  });
  return _pieces;
}
function drawPieces(t) {
  const dt = t - C.clothes;
  if (dt < 0 || dt > 1.1) return;
  clothesPieces().forEach(p => {
    const a = 1 - prog(dt, 0.35, 0.95);
    ctx.save(); ctx.globalAlpha = a;
    ctx.translate(p.c[0] + p.v[0] * dt, p.c[1] + p.v[1] * dt + 1300 * dt * dt); ctx.rotate(p.w0 * dt); const s = 1 - dt * 0.3; ctx.scale(s, s);
    ctx.translate(-p.c[0], -p.c[1]);
    if (p.pts) strokePoly(p.pts, p.w, p.col);
    else if (p.poly) { ctx.beginPath(); p.poly.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fillStyle = p.col; ctx.strokeStyle = p.col; ctx.lineWidth = 22; ctx.lineJoin = 'round'; ctx.fill(); ctx.stroke(); }
    else { rr(p.rect[0], p.rect[1], p.rect[2], p.rect[3], 14); ctx.fillStyle = p.col; ctx.fill(); }
    ctx.restore();
  });
}

const JUMP = { xs: [1190, 1630], top: 190, L: [642, 522, 300] };
function barY(t) {
  const [a1, b1] = C.barRise1, [a2, b2] = C.barRise2;
  let y = lerp(JUMP.L[0], JUMP.L[1], E.in2(prog(t, a1, b1)));
  y = lerp(y, JUMP.L[2], E.in2(prog(t, a2, b2)));
  return y + wobble(t, b1, 10, 6, 7) + wobble(t, b2, 16, 5, 6);
}
function drawJump(t) {
  if (t < C.barIn - 0.05) return;
  const grow = clamp(spring(t - C.barIn, 1.0, 6), 0, 1.04);
  const gy = FIG.gy, heute = ep(t, C.clothes, C.clothes + 0.5);
  JUMP.xs.forEach(x => {
    const h = (gy - JUMP.top) * grow;
    rr(x - 40, gy - 10, 80, 14, 7); ctx.fillStyle = mix('#5A5F6B', '#D9DCE0', heute); ctx.fill();
    const g = ctx.createLinearGradient(x - 8, 0, x + 8, 0); g.addColorStop(0, '#8E94A2'); g.addColorStop(0.5, '#F2F4F8'); g.addColorStop(1, '#9AA0AE');
    rr(x - 8, gy - h, 16, h, 5); ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = 'rgba(30,34,44,0.5)';
    for (let y = gy - 40; y > gy - h + 10; y -= 40) ctx.fillRect(x - 8, y, 8, 2);
  });
  const by = barY(t), ba = ep(t, C.barIn + 0.15, C.barIn + 0.45);
  // level marks
  const marks = [['2016', JUMP.L[0], C.barIn + 0.3], ['2017', JUMP.L[1], C.barRise1[1]], ['Heute', JUMP.L[2], C.barRise2[1]]];
  marks.forEach(([s, y, a], i) => {
    const v = ep(t, a, a + 0.3);
    if (v <= 0) return;
    ctx.globalAlpha = v;
    ctx.fillStyle = i === 2 ? P.gold : 'rgba(255,255,255,0.5)'; ctx.fillRect(JUMP.xs[0] - 36, y - 1.5, 22, 3);
    txt(s, JUMP.xs[0] - 46, y + 8, { size: 24, weight: 700, align: 'right', color: i === 2 ? P.gold : 'rgba(255,255,255,0.6)' });
    ctx.globalAlpha = 1;
  });
  ctx.save(); ctx.globalAlpha = ba;
  const yy = by - (1 - ba) * 40;
  const x0 = JUMP.xs[0] - 14, len = JUMP.xs[1] - JUMP.xs[0] + 28, n = 10;
  // the bar is neutral until "heute" - then it is painted over with the gold RINVOQ brush
  const paint = ep(t, C.barRise2[1] - 0.02, C.barRise2[1] + 0.5, E.out3);
  ctx.save(); ctx.globalAlpha *= 1 - paint * 0.85;
  for (let k = 0; k < n; k++) {
    rr(x0 + k * len / n, yy - 8, len / n + 0.5, 16, k === 0 ? [8, 0, 0, 8] : k === n - 1 ? [0, 8, 8, 0] : 0);
    ctx.fillStyle = k % 2 ? '#F5F7FA' : '#7C828C'; ctx.fill();
  }
  ctx.restore();
  if (paint > 0) brush(Array.from({ length: 24 }, (_, i) => [x0 - 16 + (len + 40) * i / 23, yy + Math.sin(i * 0.5) * 1.5]), 30, P.gold, paint, 31);
  const fl = bump(t, C.barRise1[1], 0.5) + bump(t, C.barRise2[1], 0.7);
  if (fl > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(heute > 0 ? P.gold : '#FFFFFF', 0.45 * fl); ctx.fillRect(x0 - 10, yy - 18, len + 20, 36); }
  ctx.globalCompositeOperation = 'source-over';
  txt('MESSLATTE', (JUMP.xs[0] + JUMP.xs[1]) / 2, yy - 22, { size: 16, weight: 700, align: 'center', ls: 4, color: 'rgba(255,255,255,0.55)' });
  ctx.restore();
  const labels = ['Keine Läsionen.', 'Kaum Juckreiz.', 'Volle Lebensqualität.'];
  C.chips.forEach((c, i) => {
    const s = spring(t - c, 1.5, 6);
    if (s <= 0) return;
    const cx = (JUMP.xs[0] + JUMP.xs[1]) / 2, cy = 392 + i * 76;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.globalAlpha = clamp((t - c) / 0.15);
    rr(-195, -30, 390, 60, 30); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; ctx.stroke();
    // brand icon style: white line circle + gold brush check
    circ(-160, 0, 18); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.6; ctx.stroke();
    brush([[-170, -1], [-162, 9], [-156, 2], [-146, -14], [-140, -24]], 9, P.gold, E.out3(prog(t, c + 0.05, c + 0.35)), 95 + i, { bristles: 9, taper: 0.6 });
    txt(labels[i], -128, 10, { size: 26, weight: 700, color: '#FFFFFF' });
    ctx.restore();
    burst(t, c, cx - 160, cy, { n: 10, seed: 90 + i, speed: 260, life: 0.6, size: 8, colors: [P.gold, '#FFFFFF', P.gold70] });
  });
}
function bgHeute(t) {
  bgBrand(t, FIG.x, 450, 0.16);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const fx = FIG.x, fy = 450;
  glow(fx, fy, 520, P.gold, 0.14);
  ctx.translate(fx, fy); ctx.rotate(REAL_T * 0.05);
  for (let k = 0; k < 14; k++) {
    ctx.rotate(TAU / 14);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1500, -70); ctx.lineTo(1500, 70); ctx.closePath();
    ctx.fillStyle = 'rgba(255,209,0,0.022)'; ctx.fill();
  }
  ctx.restore();
}
// big gold brush halo painted around the figure at the "heute" moment
function brushHalo(t) {
  const p = ep(t, C.clothes - 0.04, C.clothes + 0.7, E.out3);
  if (p <= 0) return;
  const cx = FIG.x, cy = 470, R = 330;
  const g = ctx.createLinearGradient(0, cy - R, 0, cy + R);
  g.addColorStop(0, P.gold); g.addColorStop(0.62, P.gold); g.addColorStop(1, P.plum);
  ctx.save(); ctx.globalAlpha = 0.95;
  brush(arcPts(cx, cy, R, R * 0.98, -0.32 * Math.PI, -1.62 * Math.PI, 72), 64, g, p, 404, { taper: 0.75 });
  ctx.restore();
}
function sceneAD(t) {
  bgUpgrade(t, C.barRise2[1], FIG.x, 470, bgGrey, bgHeute);
  ctx.save(); ctx.globalAlpha = 0.5 * (1 - ep(t, 44, 44.6)); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, FIG.gy + 4, W, H); ctx.restore();
  if (t > C.clothes) {
    // light motes rising in the "heute" world
    const a = ep(t, C.clothes, C.clothes + 1.0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) {
      const sp = 40 + hash(i + 7) * 90, x = hash(i) * W + Math.sin(t * 0.8 + i) * 20;
      const y = H + 60 - ((REAL_T - 58.06) * sp + hash(i + 3) * (H + 120)) % (H + 120);
      glow(x, y, 10 + hash(i + 11) * 18, i % 3 ? P.gold : '#FFFFFF', 0.3 * a);
    }
    ctx.restore();
  }
  brushHalo(t);
  drawJump(t);
  const f = figure(t);
  const [sx, sy] = shake(t, C.barRise2[1], 10, 0.4);
  ctx.save(); ctx.translate(FIG.x + sx, FIG.gy + sy); ctx.scale(FIG.s, FIG.s);
  ell(0, 2, 120 - f.joy * 10, 16); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
  drawFigure(t, f);
  drawPieces(t);
  ctx.restore();
  const fl = Math.pow(1 - prog(t, C.clothes, C.clothes + 0.5), 2) * (t >= C.clothes ? 1 : 0);
  if (fl > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(FIG.x, 520, 420, '#FFFFFF', 0.6 * fl); ctx.restore(); }
  upgradeFX(t, C.barRise2[1], FIG.x, 470, 23, FX_BRAND);

  // captions
  const m1 = ep(t, 40.5, 40.95);
  ctx.save(); ctx.translate(CAP_X, lerp(892, 806, m1)); const s1 = lerp(1, 0.55, m1); ctx.scale(s1, s1);
  caption('2016: Behandeln, ohne gezielt\nEntzündungssignale zu blockieren.', 0, 0, t, 35.7,
    { size: 56, weight: 700, lh: 64, color: '#E6E8EC', alpha: lerp(1, 0.6, m1), tout: 44.1, accent: { '2016:': '#F09A8A' } });
  ctx.restore();
  caption('2017: Die Messlatte steigt.', CAP_X, 958, t, 40.6, { size: 64, weight: 750, color: '#FFFFFF', tout: 44.1, accent: { '2017:': '#C9CDD3' } });
  caption('Heute: nahezu vollständige\nKrankheitsinaktivität erreichbar.', CAP_X, 888, t, 44.45, { size: 64, weight: 750, lh: 70, color: '#FFFFFF', tout: 49.75, accent: { 'Heute:': P.gold } });
}

// ================================================================ 50–55 s  RASTER
const TILES = ['Smartphone', 'Kopfhörer', 'Mobiles Internet', 'Bezahlen', 'Künstliche Intelligenz', 'Rezept', 'Neurodermitis-Therapie'];
function tilePos(i) {
  const w = 330, h = 230, g = 34;
  if (i < 4) return [249 + i * (w + g) + w / 2, 160 + h / 2];
  return [432 + (i - 4) * (w + g) + w / 2, 160 + h + g + h / 2];
}
function miniFig(x, y, s, joy) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const top = joy ? COL.shirt : COL.top16, legs = joy ? COL.shorts : COL.pants16;
  strokePoly([[-12, 20], [-16, 52]], 10, joy ? SK : legs); strokePoly([[12, 20], [16, 52]], 10, joy ? SK : legs);
  if (joy) { strokePoly([[-12, 20], [-14, 32]], 12, legs); strokePoly([[12, 20], [14, 32]], 12, legs); }
  rr(-20, -22, 40, 46, 10); ctx.fillStyle = top; ctx.fill();
  if (joy) { strokePoly([[-18, -16], [-38, -46]], 9, SK); strokePoly([[18, -16], [38, -46]], 9, SK); strokePoly([[-18, -16], [-24, -26]], 12, top); strokePoly([[18, -16], [24, -26]], 12, top); }
  else { strokePoly([[-18, -14], [-26, 10], [6, 8]], 9, top); strokePoly([[18, -14], [22, 6], [0, 2]], 9, top); circ(4, 8, 5); ctx.fillStyle = SK; ctx.fill(); }
  circ(0, -40, 16); ctx.fillStyle = SK; ctx.fill();
  if (!joy) { rr(-12, -28, 24, 12, 5); ctx.fillStyle = COL.top16d; ctx.fill(); [[-6, -44], [7, -36], [-9, 6]].forEach(p => drawPatch(p[0], p[1], 4, 1, 3)); }
  ctx.restore();
}
function icon(i, side, x, y) {
  ctx.save(); ctx.translate(x, y);
  const old = side === 0;
  switch (i) {
    case 0:
      if (old) { rr(-30, -54, 60, 108, 12); ctx.fillStyle = '#1C1C1E'; ctx.fill(); rr(-24, -40, 48, 72, 2); ctx.fillStyle = '#5E7FB8'; ctx.fill(); circ(0, 44, 5); ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.stroke(); }
      else { rr(-30, -56, 60, 112, 16); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3.5; ctx.stroke(); rr(-10, -46, 20, 6, 3); ctx.fillStyle = '#FFFFFF'; ctx.fill(); brush([[-16, 22], [-2, 10], [16, -10]], 12, P.gold, 1, 71, { bristles: 10 }); }
      break;
    case 1:
      if (old) { ctx.beginPath(); spline([[-40, 40], [-10, 10], [20, 30], [10, -10], [-20, 0], [0, -30], [30, -20], [20, -50]]); ctx.strokeStyle = '#9C9890'; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; ctx.stroke(); circ(20, -50, 9); ctx.fillStyle = '#F2F0EB'; ctx.fill(); }
      else { drawBud(-26, -10, 0.55, -0.3, 1); drawBud(26, -10, 0.55, 0.3, -1); }
      break;
    case 2:
      if (old) { drawToggle(-50, -42, 0, 0.7); drawCoin(20, 30, 26, 0.6); }
      else { circ(0, 0, 44); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.stroke(); ell(0, 0, 19, 44); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(44, 0); ctx.moveTo(-38, -22); ctx.lineTo(38, -22); ctx.moveTo(-38, 22); ctx.lineTo(38, 22); ctx.stroke(); brush(arcPts(0, 0, 54, 54, 0.55 * Math.PI, 1.05 * Math.PI, 16), 10, P.gold, 1, 72, { bristles: 9 }); }
      break;
    case 3:
      if (old) { [0, 1, 2, 3].forEach(k => { coinBand(0, 40 - k * 13, 46, 13, 13); ctx.fillStyle = k % 2 ? '#E8B640' : '#F5C850'; ctx.fill(); }); ell(0, -12, 46, 13); ctx.fillStyle = '#FFE592'; ctx.fill(); }
      else { ctx.rotate(-0.12); rr(-52, -34, 104, 68, 10); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.stroke(); brush([[-50, -6], [50, -8]], 12, P.gold, 1, 73, { bristles: 10 }); ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(24, 16, 5 + k * 6, -0.8, 0.8); ctx.stroke(); } }
      break;
    case 4:
      if (old) { ctx.fillStyle = '#D9A85E'; ctx.fillRect(-50, -40, 100, 80); drawStone(-14, -6, 16, false); drawStone(16, -6, 16, true); drawStone(2, 20, 16, false); }
      else { sparkle(-6, 4, 42, 0); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke(); ctx.fillStyle = P.gold; sparkle(34, -30, 15, 0); ctx.fill(); }
      break;
    case 5:
      if (old) { ctx.rotate(-0.08); ctx.fillStyle = '#F9DCE2'; ctx.fillRect(-56, -38, 112, 76); txt('Rp.', -48, 6, { size: 18, weight: 700, fam: SERIF, color: '#C9475F' }); strokePoly([[-12, 0], [40, -2]], 2, '#2A3E8F'); strokePoly([[-12, 16], [30, 16]], 2, '#2A3E8F'); }
      else { rr(-48, -48, 96, 96, 10); ctx.fillStyle = '#FFFFFF'; ctx.fill(); const q = 84 / 25; for (let j = 0; j < 25; j++) for (let k = 0; k < 25; k++) if (QR[j][k]) { ctx.fillStyle = P.char; ctx.fillRect(-42 + k * q, -42 + j * q, q + 0.3, q + 0.3); } }
      break;
    case 6: if (!old) brush([[-44, 60], [0, 57], [44, 60]], 10, P.gold, 1, 74, { bristles: 9 }); miniFig(0, 6, 1, !old); break;
  }
  ctx.restore();
}
function sceneGrid(t) {
  bgBrand(t, W / 2, 420, 0.07);
  const push = lerp(1, 1.05, ep(t, 54.0, 55.0, E.in3));
  ctx.save(); ctx.translate(W / 2, 420); ctx.scale(push, push); ctx.translate(-W / 2, -420);
  TILES.forEach((name, i) => {
    const [x, y] = tilePos(i);
    const s = spring(t - (C.gridIn + i * 0.06), 1.3, 6);
    if (s <= 0) return;
    const f = C.flips[i], p = prog(t, f, f + 0.34), q = E.io3(p);
    const sx = Math.abs(Math.cos(Math.PI * q)), side = q < 0.5 ? 0 : 1, lift = Math.sin(Math.PI * q);
    const last = i === 6;
    ctx.save(); ctx.translate(x, y - lift * 16); ctx.scale(s * (1 + 0.06 * lift) * Math.max(0.02, sx), s * (1 + 0.06 * lift));
    if (side === 1 && last) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, 0, 330, P.gold, 0.32 * (0.6 + 0.4 * bump(t, f + 0.2, 0.8))); ctx.restore(); }
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18 + lift * 20;
    rr(-165, -115, 330, 230, 24); ctx.fillStyle = side ? '#33373B' : P.cream; ctx.fill(); ctx.restore();
    if (side) {
      rr(-165, -115, 330, 230, 24); ctx.strokeStyle = last ? P.gold : 'rgba(255,255,255,0.22)'; ctx.lineWidth = last ? 4 : 2; ctx.stroke();
    }
    // shading across the flip
    icon(i, side, 0, -14);
    txt(side ? (last ? 'HEUTE' : '2026') : '2016', -140, -82, { size: 20, weight: 800, color: side ? (last ? P.gold : 'rgba(255,255,255,0.8)') : P.ink, ls: 2 });
    txt(name, 0, 96, { size: 20, weight: 600, align: 'center', color: side ? 'rgba(255,255,255,0.85)' : P.inkSoft });
    if (sx < 0.9) { ctx.fillStyle = `rgba(0,0,0,${0.35 * (1 - sx)})`; rr(-165, -115, 330, 230, 24); ctx.fill(); }
    ctx.restore();
    if (p > 0.45 && p < 1) burst(t, f + 0.15, x, y, { n: 12, seed: 200 + i, speed: 420, life: 0.55, size: 8, colors: last ? [P.gold, '#FFFFFF', P.gold70, P.plum] : [P.gold, '#FFFFFF', P.gold70] });
  });
  ctx.restore();
  const m = ep(t, C.flips[6] - 0.1, C.flips[6] + 0.35);
  ctx.save(); ctx.translate(CAP_X, lerp(CAP_Y, CAP_Y - 92, m)); const s = lerp(1, 0.6, m); ctx.scale(s, s);
  caption('Was 2016 Standard war, ist heute überholt.', 0, 0, t, 50.3, { size: 64, weight: 750, color: '#FFFFFF', alpha: lerp(1, 0.7, m), accent: { '2016': P.gold } });
  ctx.restore();
  caption('Auch in der Therapie.', CAP_X, CAP_Y, t, C.flips[6] + 0.12, { size: 68, weight: 800, color: '#FFFFFF', accent: { 'Therapie.': P.gold } });
}

// ================================================================ 55–60 s  ENDCARD (RINVOQ)
const LOGO = (() => { const im = new Image(); im.src = window.RINVOQ_LOGO; return im; })();
const LOGO_ICON_W = 124;   // width of the brush icon inside the logo image (px)
function drawLogo(t, cx, cy, sc, t0) {
  if (!LOGO.complete || !LOGO.naturalWidth) return;
  const w = LOGO.naturalWidth, h = LOGO.naturalHeight;
  const x0 = cx - w * sc / 2, y0 = cy - h * sc / 2;
  // the icon is revealed like a brush being swept round, the wordmark wipes in after it
  const pi = ep(t, t0, t0 + 0.75, E.io3);
  if (pi > 0) {
    const icx = x0 + 60 * sc, icy = y0 + 80 * sc, a0 = -0.38 * Math.PI;
    ctx.save(); ctx.beginPath(); ctx.moveTo(icx, icy); ctx.arc(icx, icy, 140 * sc, a0, a0 - TAU * pi, true); ctx.closePath(); ctx.clip();
    ctx.drawImage(LOGO, 0, 0, LOGO_ICON_W, h, x0, y0, LOGO_ICON_W * sc, h * sc);
    ctx.restore();
  }
  const pw = ep(t, t0 + 0.35, t0 + 1.0, E.out3);
  if (pw > 0) {
    const ww = (w - LOGO_ICON_W) * sc;
    ctx.save(); ctx.beginPath(); ctx.rect(x0 + LOGO_ICON_W * sc, y0 - 10, ww * pw + 2, h * sc + 20); ctx.clip();
    ctx.globalAlpha = pw;
    ctx.drawImage(LOGO, LOGO_ICON_W, 0, w - LOGO_ICON_W, h, x0 + LOGO_ICON_W * sc + (1 - pw) * 30, y0, ww, h * sc);
    ctx.restore();
  }
}
function sceneEnd(t) {
  bgBrand(t, 1500, 560, 0.09);
  const h = C.endHit;
  ctx.save(); ctx.translate(0, 100);
  // giant faded year in the back
  ctx.save(); ctx.globalAlpha = 0.035 * ep(t, h, h + 1); setFont(900, 520); ctx.textAlign = 'right'; ctx.fillStyle = '#FFFFFF';
  ctx.fillText('2026', W + 30 - (REAL_T - 72) * 12, 760); ctx.restore();
  txt('ROUTE', 156, 352, { size: 24, weight: 800, ls: 8, color: P.gold, alpha: ep(t, h + 0.1, h + 0.5) });
  brush([[154, 374], [196, 372], [238, 373]], 8, P.gold, ep(t, h + 0.12, h + 0.6, E.out3), 61, { bristles: 9 });
  caption('10 Jahre Alltag.', 150, 500, t, h + 0.2, { size: 136, weight: 850, color: '#FFFFFF', stagger: 0.08, dur: 0.8 });
  caption('Warum bei 2016 stehen bleiben?', 154, 600, t, h + 0.85, { size: 58, weight: 500, color: 'rgba(255,255,255,0.88)', accent: { '2016': P.gold } });
  const ul = ep(t, h + 1.5, h + 2.0, E.io3);
  if (ul > 0) {
    const x = 154 + tw('Warum bei ', 58, 500), w = tw('2016', 58, 500);
    brush([[x - 4, 624], [x + w / 2, 621], [x + w + 8, 623]], 11, P.gold, ul, 62, { bristles: 11 });
  }
  // ten-year timeline recap
  const ty = 760, x0 = 156, x1 = 1100, lp = ep(t, h + 1.0, h + 2.2, E.io3);
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x0, ty - 1, (x1 - x0) * lp, 2);
  txt('2016', x0, ty + 40, { size: 20, weight: 700, color: 'rgba(255,255,255,0.55)', alpha: lp });
  txt('2026', x1, ty + 40, { size: 20, weight: 700, align: 'right', color: P.gold, alpha: ep(t, h + 2.0, h + 2.4) });
  for (let i = 0; i < 7; i++) {
    const x = lerp(x0 + 40, x1 - 40, i / 6), a = h + 1.2 + i * 0.14, s = spring(t - a, 1.6, 6);
    if (s <= 0) continue;
    if (i === 6) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(x, ty, 34 * s, P.gold, 0.55); ctx.restore(); }
    circ(x, ty, (i === 6 ? 8 : 5.5) * s); ctx.fillStyle = i === 6 ? P.gold : '#FFFFFF'; ctx.fill();
  }
  const dp = ep(t, h + 1.2, h + 2.3, E.io3);
  if (dp > 0 && dp < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(lerp(x0, x1, dp), ty, 40, P.gold, 0.6); ctx.restore(); }
  drawLogo(t, 1530, 470, 1.3, h + 1.5);
  ctx.restore();
  // hit flash
  const fl = Math.pow(1 - prog(t, h, h + 0.45), 3);
  if (fl > 0 && t >= h) { ctx.fillStyle = `rgba(255,255,255,${0.45 * fl})`; ctx.fillRect(0, 0, W, H); }
}
