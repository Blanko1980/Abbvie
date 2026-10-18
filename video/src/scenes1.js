'use strict';
/* Scenes 0–18 s: Lockscreen 2016 -> Jahreszähler -> Glasbruch -> Kopfhörer -> Roaming */

// ================================================================ 0–8 s  OPEN
const NOTIFS = [
  { app: 'NACHRICHTEN', col: '#4CD964', title: 'Lisa', msg: 'Public Viewing heute? Bin dabei!' },
  { app: 'EM 2016', col: '#FF3B30', title: 'Viertelfinale', msg: 'Deutschland – Italien, 21:00 Uhr' },
  { app: 'SMS', col: '#34AADC', title: 'Mama', msg: 'Hast du mein Foto bekommen?' },
  { app: 'AKKU', col: '#F5B800', title: 'Batterie schwach', msg: 'Noch 20 % Batterieladung' },
];

function drawLock(t, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w * 0.4, y + h);
  g.addColorStop(0, '#2B5C9E'); g.addColorStop(0.5, '#7A4C9C'); g.addColorStop(1, '#E68065');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const r = rng(3);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) {
    const bx = x + r() * w, by = y + r() * h, br = 18 + r() * 55;
    glow(bx + Math.sin(t * 0.6 + i) * 5, by + Math.cos(t * 0.4 + i) * 4, br, i % 2 ? '#FFD2A6' : '#9AD0FF', 0.22 + r() * 0.2);
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(x, y, w, h);

  // status bar (2016 style)
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 5; i++) { circ(x + 12 + i * 9, y + 14, 3.2); i < 4 ? ctx.fill() : (ctx.lineWidth = 1, ctx.strokeStyle = '#fff', ctx.stroke()); }
  txt('Netz', x + 60, y + 18, { size: 12, weight: 400, fam: OLDUI });
  txt('20:16', x + w / 2, y + 18, { size: 12, weight: 700, fam: OLDUI, align: 'center' });
  txt('62 %', x + w - 44, y + 18, { size: 12, weight: 400, fam: OLDUI, align: 'right' });
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(x + w - 38, y + 9, 24, 11); ctx.fillRect(x + w - 36, y + 11, 13, 7); ctx.fillRect(x + w - 13, y + 12, 2, 5);

  txt('20:16', x + w / 2, y + 112, { size: 78, weight: 200, align: 'center', fam: TEXT });
  txt('Samstag, 2. Juli', x + w / 2, y + 142, { size: 17, weight: 400, align: 'center', fam: OLDUI });

  // notifications - newest on top
  const top = y + 172, rowH = 66;
  let panelH = 0;
  C.notifs.forEach(a => { panelH += clamp(spring(t - a, 1.5, 7), 0, 1.2) * rowH; });
  if (panelH > 1) { rr(x + 8, top - 4, w - 16, panelH + 4, 12); ctx.fillStyle = 'rgba(18,18,30,0.38)'; ctx.fill(); }
  NOTIFS.forEach((n, k) => {
    const a = C.notifs[k];
    if (t < a) return;
    let yy = top;
    for (let j = k + 1; j < NOTIFS.length; j++) yy += spring(t - C.notifs[j], 1.5, 7) * rowH;
    const s = spring(t - a, 1.8, 8);
    ctx.save();
    ctx.globalAlpha = clamp((t - a) / 0.12);
    ctx.translate(x + w / 2, yy + rowH / 2); ctx.scale(lerp(0.9, 1, s), lerp(0.9, 1, s)); ctx.translate(-(x + w / 2), -(yy + rowH / 2));
    rr(x + 18, yy + 10, 22, 22, 5); ctx.fillStyle = n.col; ctx.fill();
    rr(x + 23, yy + 16, 12, 9, 3); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
    txt(n.app, x + 48, yy + 26, { size: 11, weight: 700, fam: OLDUI, color: 'rgba(255,255,255,0.75)', ls: 0.5 });
    txt('jetzt', x + w - 20, yy + 26, { size: 11, weight: 400, fam: OLDUI, color: 'rgba(255,255,255,0.6)', align: 'right' });
    txt(n.title, x + 48, yy + 44, { size: 14, weight: 700, fam: OLDUI });
    txt(n.msg, x + 48, yy + 60, { size: 13.5, weight: 400, fam: OLDUI, color: 'rgba(255,255,255,0.9)' });
    if (k < NOTIFS.length - 1 || true) { ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x + 48, yy + rowH - 0.5, w - 64, 1); }
    ctx.restore();
  });

  // "slide to unlock" shimmer
  const sw = tw('›  Entsperren', 22, 400, OLDUI);
  const ux = x + w / 2 - sw / 2, uy = y + h - 34;
  const sp = ((t * 0.55) % 1.6) - 0.3;
  const sg = ctx.createLinearGradient(ux, 0, ux + sw, 0);
  sg.addColorStop(0, 'rgba(255,255,255,0.45)');
  sg.addColorStop(clamp(sp - 0.12), 'rgba(255,255,255,0.45)');
  sg.addColorStop(clamp(sp), 'rgba(255,255,255,1)');
  sg.addColorStop(clamp(sp + 0.12), 'rgba(255,255,255,0.45)');
  sg.addColorStop(1, 'rgba(255,255,255,0.45)');
  setFont(400, 22, OLDUI); ctx.textAlign = 'left'; ctx.fillStyle = sg; ctx.fillText('›  Entsperren', ux, uy);
}

function drawOldPhone(t) {
  const w = 360, h = 740, r = 54;
  ctx.save();
  ctx.shadowColor = 'rgba(70,45,20,0.35)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
  rr(-w / 2, -h / 2, w, h, r); ctx.fillStyle = '#18181A'; ctx.fill();
  ctx.restore();
  const bg = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  bg.addColorStop(0, '#3A3A3E'); bg.addColorStop(0.08, '#1B1B1E'); bg.addColorStop(0.92, '#1B1B1E'); bg.addColorStop(1, '#3A3A3E');
  rr(-w / 2, -h / 2, w, h, r); ctx.fillStyle = bg; ctx.fill();
  rr(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, r - 3); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2; ctx.stroke();
  rr(-38, -h / 2 + 42, 76, 8, 4); ctx.fillStyle = '#2E2E33'; ctx.fill();
  circ(-66, -h / 2 + 46, 6); ctx.fillStyle = '#26262B'; ctx.fill();
  circ(-66, -h / 2 + 46, 2.5); ctx.fillStyle = '#3B4A6B'; ctx.fill();
  const sx = -158, sy = -h / 2 + 86, sw = 316, sh = 562;
  ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); drawLock(t, sx, sy, sw, sh); ctx.restore();
  circ(0, h / 2 - 47, 29); ctx.strokeStyle = '#3A3A40'; ctx.lineWidth = 3; ctx.stroke();
  rr(-9, h / 2 - 56, 18, 18, 4); ctx.strokeStyle = '#46464C'; ctx.lineWidth = 1.5; ctx.stroke();
  // glass reflection
  const rg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  rg.addColorStop(0, 'rgba(255,255,255,0.10)'); rg.addColorStop(0.45, 'rgba(255,255,255,0.02)'); rg.addColorStop(0.46, 'rgba(255,255,255,0)');
  rr(-w / 2, -h / 2, w, h, r); ctx.fillStyle = rg; ctx.fill();
}

// rolling-digit year counter. n = 0..10 (2016..2026), continuous
function odometer(n, x, y, size, color) {
  setFont(900, size); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const cw = ctx.measureText('0').width * 0.98;
  const u = 6 + n;
  const ds = [2, 0, 1 + clamp(u - 9, 0, 1), u % 10];
  ds.forEach((d, i) => {
    const cx = x + cw * (i + 0.5);
    const b = Math.floor(d + 1e-6), f = d - b;
    ctx.save(); ctx.beginPath(); ctx.rect(cx - cw / 2 - 4, y - size * 0.86, cw + 8, size * 1.04); ctx.clip();
    ctx.fillStyle = color;
    ctx.fillText(String(((b % 10) + 10) % 10), cx, y - f * size * 1.02);
    if (f > 0.001) ctx.fillText(String((b + 1) % 10), cx, y + (1 - f) * size * 1.02);
    ctx.restore();
  });
  return cw * 4;
}
function counterN(t) {
  let n = 0;
  C.ticks.forEach((a, i) => {
    const gap = i + 1 < C.ticks.length ? C.ticks[i + 1] - a : 0.25;
    n += E.outBack(prog(t, a, a + Math.min(0.16, gap * 0.85)), 1.3);
  });
  return n;
}

const SHARDS = (() => {
  const r = rng(99), cx = 960, cy = 440, NA = 12;
  const radii = [0, 80, 190, 360, 600, 950, 1700];
  const V = radii.map((R, i) => Array.from({ length: NA }, (_, a) => {
    const ang = (a + (r() - 0.5) * 0.6) / NA * TAU + 0.2;
    const q = i === 0 ? 0 : R * (0.82 + r() * 0.36);
    return [cx + Math.cos(ang) * q, cy + Math.sin(ang) * q];
  }));
  const shards = [], edges = [];
  for (let i = 0; i < radii.length - 1; i++) for (let a = 0; a < NA; a++) {
    const b = (a + 1) % NA;
    const A = V[i][a], B = V[i][b], Cc = V[i + 1][b], D = V[i + 1][a];
    edges.push({ ring: i, p: A, q: D, radial: true });
    if (i > 0) edges.push({ ring: i + 0.45, p: A, q: B });
    let polys;
    if (i === 0) polys = [[A, Cc, D]];
    else if (r() < 0.5) { polys = [[A, B, Cc], [A, Cc, D]]; edges.push({ ring: i + 0.7, p: A, q: Cc }); }
    else { polys = [[A, B, D], [B, Cc, D]]; edges.push({ ring: i + 0.7, p: B, q: D }); }
    for (const pts of polys) {
      const c = [(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3];
      const dx = c[0] - cx, dy = c[1] - cy, d = Math.hypot(dx, dy) || 1;
      shards.push({ pts, c, dir: [dx / d, dy / d], sp: 700 + r() * 900 - Math.min(d, 900) * 0.35, rot: (r() - 0.5) * 7, zs: 0.2 + r() * 1.1 });
    }
  }
  return { shards, edges, cx, cy };
})();

function drawCracks(t) {
  let s = 0;
  C.cracks.forEach(a => { s += 2 * ep(t, a, a + 0.1, E.out3); });
  if (s <= 0) return;
  ctx.save(); ctx.lineCap = 'round';
  for (const e of SHARDS.edges) {
    const f = clamp(s - e.ring);
    if (f <= 0) continue;
    const q = e.radial ? [lerp(e.p[0], e.q[0], f), lerp(e.p[1], e.q[1], f)] : e.q;
    const a = e.radial ? 1 : f;
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.moveTo(e.p[0] + 1.5, e.p[1] + 1.5); ctx.lineTo(q[0] + 1.5, q[1] + 1.5);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(e.p[0], e.p[1]); ctx.lineTo(q[0], q[1]);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.8; ctx.stroke();
  }
  ctx.globalAlpha = 1;
  glow(SHARDS.cx, SHARDS.cy, 120, '#FFFFFF', 0.5 * clamp(s / 2));
  ctx.restore();
}

function sceneOpen(t) {
  const d = ep(t, 4.85, 6.0);
  bgOld(t);
  if (d > 0) { ctx.save(); ctx.globalAlpha = d; bgNew(t); ctx.restore(); }
  const [sx, sy] = shake(t, C.ticks[9], 6, 0.3);
  const [kx, ky] = shake(t, C.cracks[0], 10, 0.25), [kx2, ky2] = shake(t, C.cracks[2], 14, 0.3);
  ctx.save(); ctx.translate(sx + kx + kx2, sy + ky + ky2);

  // phone: springs in, then is pushed away by time
  const sIn = spring(t - C.phoneIn, 0.95, 5.0);
  const out = ep(t, 4.9, 6.1, E.in3);
  if (out < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - out;
    ctx.translate(1300 + out * 520, 540 + (1 - sIn) * 1000);
    ctx.rotate(lerp(0.12, 0, sIn) + out * 0.35);
    const s = 1.1 * (1 - out * 0.25); ctx.scale(s, s);
    drawOldPhone(t);
    ctx.restore();
  }

  // the year itself is the counter
  const n = counterN(t);
  const mv = ep(t, 5.0, 6.1, E.io5);
  const size = 230;
  setFont(900, size); const w4 = ctx.measureText('0').width * 0.98 * 4;
  const k = lerp(1, 1.42, mv);
  const land = spring(t - C.ticks[9], 2.2, 6) - (t > C.ticks[9] ? 1 : 0);
  const kk = k * (1 + 0.06 * land);
  const gx = lerp(150, 960 - w4 * kk / 2, mv), gy = lerp(520, 585, mv);
  const appear = E.out5(prog(t, 0.45, 1.15));
  ctx.save();
  ctx.translate(gx, gy + (1 - appear) * 60); ctx.scale(kk, kk);
  ctx.globalAlpha = appear;
  const col = mix(P.ink, '#FFFFFF', d);
  const pulse = bump(t, C.ticks[9], 0.9);
  if (pulse > 0) { ctx.shadowColor = rgba(P.cyan, 0.9); ctx.shadowBlur = 50 * pulse; }
  odometer(n, 0, 0, size, col);
  ctx.shadowBlur = 0;
  if (t > C.ticks[9]) {
    // cyan sheen sweeping over the landed "2026" (the gradient is the text fill, so it stays inside the glyphs)
    const sp = prog(t, C.ticks[9], C.ticks[9] + 0.7);
    if (sp < 1) {
      const cx = lerp(-300, w4 + 300, sp);
      const g = ctx.createLinearGradient(cx - 120, 0, cx + 120, 0);
      g.addColorStop(0, 'rgba(92,230,218,0)'); g.addColorStop(0.5, 'rgba(92,230,218,0.95)'); g.addColorStop(1, 'rgba(92,230,218,0)');
      odometer(n, 0, 0, size, g);
    }
  }
  const dot = 1 - ep(t, 4.85, 5.2);
  if (dot > 0) { ctx.globalAlpha = appear * dot; setFont(900, size); ctx.textAlign = 'left'; ctx.fillStyle = P.cyan; ctx.fillText('.', w4 + 6, 0); }
  ctx.restore();

  caption('Fühlt sich an wie gestern.', 156, 640, t, 1.35, { size: 62, weight: 600, color: P.ink, tout: 4.75 });
  caption('Ist aber zehn Jahre her.', 960, 800, t, 6.25, { size: 66, weight: 700, color: '#FFFFFF', align: 'center', accent: { zehn: P.cyan } });
  ctx.restore();
  drawCracks(t);
}

function drawShards(t) {
  const dt = t - C.shatter;
  if (dt < 0 || dt > 0.95) return;
  const img = frozen('open', () => sceneOpen(C.shatter - 0.004));
  // white flash
  ctx.save(); ctx.fillStyle = `rgba(255,255,255,${0.75 * Math.pow(1 - prog(dt, 0, 0.3), 2)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  for (const s of SHARDS.shards) {
    const a = 1 - prog(dt, 0.3 + s.zs * 0.15, 0.85);
    if (a <= 0) continue;
    const tt = dt * (dt < 0.03 ? 0.3 : 1);
    const px = s.c[0] + s.dir[0] * s.sp * tt, py = s.c[1] + s.dir[1] * s.sp * tt + 1500 * tt * tt;
    const sc = 1 + tt * s.zs;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(px, py); ctx.rotate(s.rot * tt); ctx.scale(sc, sc); ctx.translate(-s.c[0], -s.c[1]);
    ctx.beginPath(); ctx.moveTo(s.pts[0][0], s.pts[0][1]); ctx.lineTo(s.pts[1][0], s.pts[1][1]); ctx.lineTo(s.pts[2][0], s.pts[2][1]); ctx.closePath();
    ctx.save(); ctx.clip(); ctx.drawImage(img, 0, 0); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
}

// ================================================================ 8–13 s  KOPFHÖRER
const TANGLE = (() => {
  const r = rng(42), cx = 960, cy = 440;
  const pt = (R) => { const a = r() * TAU, d = Math.sqrt(r()) * R; return [cx + Math.cos(a) * d * 1.3, cy + Math.sin(a) * d * 0.85]; };
  const jack = [[640, 720], [700, 668]];
  for (let i = 0; i < 12; i++) jack.push(pt(230));
  const Y = pt(50); jack.push(Y);
  const L = [Y]; for (let i = 0; i < 7; i++) L.push(pt(230)); L.push([760, 230]);
  const R = [Y]; for (let i = 0; i < 7; i++) R.push(pt(230)); R.push([1170, 250]);
  return { strands: [jack, L, R], cx, cy };
})();

function tanglePts(t) {
  let s = 1 - 0.66 * ep(t, 8.25, 9.85, E.io3);
  C.knotPulls.forEach(a => { s -= 0.05 * clamp(spring(t - a, 3, 9)); });
  s = lerp(s, 0.05, E.in3(prog(t, 9.82, C.pop)));
  const rot = 0.55 * ep(t, 8.2, C.pop);
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const { cx, cy } = TANGLE;
  return TANGLE.strands.map((st, si) => st.map((p, i) => {
    const dx = (p[0] - cx) * s, dy = (p[1] - cy) * s;
    const wig = (1 - s) * 16 + 3;
    return [cx + dx * cs - dy * sn + noise1(t * 2.6 + i * 1.7 + si * 9) * wig,
      cy + dx * sn + dy * cs + noise1(t * 2.2 + i * 2.3 + si * 5) * wig];
  }));
}
function segPath(pts, i) {
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
  ctx.beginPath(); ctx.moveTo(p1[0], p1[1]);
  ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
}
function drawTangle(t) {
  const st = tanglePts(t);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.translate(0, 12);
  st.forEach(s => { ctx.beginPath(); spline(s); ctx.strokeStyle = 'rgba(100,75,40,0.14)'; ctx.lineWidth = 16; ctx.stroke(); });
  ctx.translate(0, -12);
  st.forEach(s => {
    for (let i = 0; i < s.length - 1; i++) {
      segPath(s, i); ctx.strokeStyle = '#9C9890'; ctx.lineWidth = 12; ctx.stroke();
      for (const j of [i - 1, i]) { if (j < 0) continue; segPath(s, j); ctx.strokeStyle = '#FBFAF7'; ctx.lineWidth = 8; ctx.stroke(); }
    }
  });
  // old in-ear buds at the cable ends + jack
  const ends = [st[1][st[1].length - 1], st[2][st[2].length - 1]];
  ends.forEach((e, i) => {
    const prev = st[i + 1][st[i + 1].length - 2];
    const a = Math.atan2(e[1] - prev[1], e[0] - prev[0]);
    ctx.save(); ctx.translate(e[0], e[1]); ctx.rotate(a);
    rr(-6, -9, 26, 18, 8); ctx.fillStyle = '#ECEAE5'; ctx.fill(); ctx.strokeStyle = '#9C9890'; ctx.lineWidth = 2; ctx.stroke();
    ell(26, 0, 13, 16); ctx.fillStyle = '#F7F6F2'; ctx.fill(); ctx.stroke();
    ell(30, 0, 5, 9); ctx.fillStyle = '#B9B5AC'; ctx.fill();
    ctx.restore();
  });
  const j0 = st[0][0], j1 = st[0][1], ja = Math.atan2(j0[1] - j1[1], j0[0] - j1[0]);
  ctx.save(); ctx.translate(j0[0], j0[1]); ctx.rotate(ja);
  rr(-6, -10, 34, 20, 6); ctx.fillStyle = '#F2F0EB'; ctx.fill(); ctx.strokeStyle = '#9C9890'; ctx.lineWidth = 2; ctx.stroke();
  const mg = ctx.createLinearGradient(0, -5, 0, 5); mg.addColorStop(0, '#E8E8E8'); mg.addColorStop(0.5, '#9A9A9A'); mg.addColorStop(1, '#D0D0D0');
  rr(28, -4.5, 34, 9, 4); ctx.fillStyle = mg; ctx.fill();
  ctx.fillStyle = '#555'; ctx.fillRect(40, -4.5, 2, 9); ctx.fillRect(50, -4.5, 2, 9);
  ctx.restore();
  ctx.restore();
}

function drawBud(x, y, sc, rot, flip) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc * flip, sc);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 14;
  const sg = ctx.createLinearGradient(-12, 0, 12, 0);
  sg.addColorStop(0, '#C9CFDA'); sg.addColorStop(0.35, '#FFFFFF'); sg.addColorStop(1, '#D6DBE4');
  rr(-12, 4, 24, 96, 12); ctx.fillStyle = sg; ctx.fill();
  ctx.restore();
  const hg = ctx.createRadialGradient(-12, -12, 4, 0, 0, 40);
  hg.addColorStop(0, '#FFFFFF'); hg.addColorStop(0.7, '#EEF1F6'); hg.addColorStop(1, '#C3C9D4');
  ell(0, 0, 38, 33); ctx.fillStyle = hg; ctx.fill();
  ell(17, 0, 10, 15, -0.2); ctx.fillStyle = '#2E3340'; ctx.fill();
  ell(17, 0, 6, 10, -0.2); ctx.fillStyle = '#3F4656'; ctx.fill();
  ell(-14, -14, 10, 5, -0.6); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  rr(-4, 82, 8, 14, 4); ctx.fillStyle = '#AEB5C2'; ctx.fill();
  ctx.restore();
}

function caseGeom(t) {
  const sIn = spring(t - C.caseIn, 1.1, 5.5);
  const y = lerp(1250, 640, sIn) + Math.sin((t - 11.8) * 2.2) * 6 * clamp((t - 11.8) * 2);
  const close = ep(t, C.lidClose - 0.18, C.lidClose, E.in3);
  return { x: 960, y, close };
}
function drawCaseBody(g) {
  ctx.save(); ctx.translate(g.x, g.y);
  ctx.save(); ctx.beginPath(); ctx.rect(-200, -30, 400, 200); ctx.clip();
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
  const bg = ctx.createLinearGradient(-160, 0, 160, 0);
  bg.addColorStop(0, '#C8CED9'); bg.addColorStop(0.3, '#FFFFFF'); bg.addColorStop(0.75, '#EEF1F6'); bg.addColorStop(1, '#BFC6D2');
  rr(-165, -105, 330, 210, 84); ctx.fillStyle = bg; ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(120,130,150,0.55)'; ctx.fillRect(-160, -31, 320, 2);
  const led = clamp((tNow - C.led) / 0.15);
  if (led > 0) { glow(0, 30, 50, P.mint, 0.7 * led); }
  circ(0, 30, 4.5); ctx.fillStyle = led > 0 ? mix('#9AA3B2', P.mint, led) : '#9AA3B2'; ctx.fill();
  ctx.restore();
}
function drawCaseLid(g) {
  ctx.save(); ctx.translate(g.x, g.y);
  const lift = (1 - g.close);
  ctx.translate(0, -30); ctx.rotate(-0.22 * lift); ctx.translate(0, 30 - 120 * lift);
  ctx.save(); ctx.beginPath(); ctx.rect(-200, -140, 400, 110); ctx.clip();
  const bg = ctx.createLinearGradient(-160, 0, 160, 0);
  bg.addColorStop(0, '#C8CED9'); bg.addColorStop(0.3, '#FFFFFF'); bg.addColorStop(0.75, '#F1F3F7'); bg.addColorStop(1, '#BFC6D2');
  rr(-165, -105, 330, 210, 84); ctx.fillStyle = bg; ctx.fill();
  ctx.restore();
  ctx.restore();
}
function drawCaseInner(g) {
  ctx.save(); ctx.translate(g.x, g.y);
  rr(-150, -44, 300, 30, 15); ctx.fillStyle = '#DDE1E8'; ctx.fill();
  ell(-58, -30, 32, 9); ctx.fillStyle = '#AEB5C2'; ctx.fill();
  ell(58, -30, 32, 9); ctx.fill();
  ctx.restore();
}
let tNow = 0;

function sceneEarbuds(t) {
  tNow = t;
  bgUpgrade(t, C.pop, 960, 440);
  if (t < C.pop) drawTangle(t);
  else {
    const g = caseGeom(t);
    const pop = spring(t - C.pop, 1.6, 6);
    const hov = [[800, 300], [1120, 300]];
    const slots = [[902, g.y - 66], [1018, g.y - 66]];
    const buds = [0, 1].map(i => {
      const sp = spring(t - C.pop - 0.08, 1.2, 5.5);
      let x = lerp(960, hov[i][0], sp), y = lerp(440, hov[i][1], sp) + Math.sin(t * 3 + i * 2) * 8;
      let rot = (i ? 0.45 : -0.45) + Math.sin(t * 2 + i) * 0.06;
      const c = C.budClicks[i], f = E.in3(prog(t, c - 0.32, c));
      x = lerp(x, slots[i][0], f); y = lerp(y, slots[i][1], f); rot = lerp(rot, i ? 0.08 : -0.08, f);
      const snap = t > c ? wobble(t, c, 4, 14, 14) : 0;
      return { x, y: y + snap, rot, sc: pop * 0.95, flip: i ? -1 : 1 };
    });
    const closing = t > C.lidClose - 0.2;
    if (t > C.caseIn - 0.05) { if (!closing) drawCaseLid(g); drawCaseInner(g); }
    buds.forEach(b => drawBud(b.x, b.y, b.sc, b.rot, b.flip));
    if (t > C.caseIn - 0.05) { drawCaseBody(g); if (closing) drawCaseLid(g); }
    if (t > C.lidClose) {
      const [lx, ly] = [960, g.y + 30];
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(960, g.y + 150, 260, P.cyan, 0.12 * clamp((t - C.lidClose) * 2));
      ctx.restore();
      burst(t, C.led, lx, ly, { n: 12, seed: 4, speed: 260, life: 0.7, size: 9, colors: [P.mint, '#FFFFFF'] });
    }
    burst(t, C.pop, 960, 440, { n: 20, seed: 8, speed: 700, life: 0.6, size: 8, colors: ['#FFFFFF', '#EDEAE2'] });
  }
  upgradeFX(t, C.pop, 960, 440, 3);
  capPair(t, 'Kopfhörer entknoten.', 'Einsetzen. Fertig.', 8.45, C.pop, 10.35, { newAccent: { 'Fertig.': P.cyan } });
}

// ================================================================ 13–18 s  ROAMING
const EUROPE = [
  // mainland incl. Scandinavia (lon, lat)
  [[-5.6, 36.0], [-6.3, 36.5], [-7.4, 37.2], [-8.9, 37.0], [-8.8, 38.5], [-9.5, 38.8], [-8.8, 40.2], [-8.7, 41.2], [-8.9, 42.4], [-9.3, 42.9], [-8.4, 43.4], [-7.0, 43.6], [-5.7, 43.6], [-3.8, 43.5], [-2.0, 43.4], [-1.5, 43.6], [-1.2, 44.6], [-1.2, 46.2], [-2.2, 47.2], [-3.2, 47.6], [-4.7, 48.4], [-3.5, 48.8], [-2.0, 48.7], [-1.6, 49.7], [-0.2, 49.3], [0.1, 49.6], [1.4, 50.2], [1.9, 51.0], [2.9, 51.2], [3.6, 51.4], [4.0, 52.0], [4.6, 52.6], [4.8, 53.0], [5.6, 53.4], [7.0, 53.5], [8.6, 53.9], [8.6, 55.0], [8.2, 55.6], [8.1, 56.6], [8.6, 57.1], [10.6, 57.7], [10.4, 56.5], [10.9, 56.2], [10.2, 55.5], [9.9, 54.8], [10.9, 54.2], [12.1, 54.2], [13.6, 54.3], [14.3, 53.9], [16.0, 54.3], [17.6, 54.8], [18.7, 54.4], [19.6, 54.4], [21.1, 55.3], [21.1, 56.4], [21.6, 57.4], [22.6, 57.7], [24.1, 57.0], [24.4, 58.3], [23.5, 58.6], [23.4, 59.2], [24.7, 59.5], [26.5, 59.6], [28.0, 59.5], [30.2, 59.9],
    [28.7, 60.6], [27.0, 60.5], [25.0, 60.2], [23.0, 59.9], [22.3, 60.4], [21.4, 61.0], [21.5, 62.3], [21.3, 63.1], [22.5, 63.8], [24.5, 64.8], [25.4, 65.1], [24.6, 65.8], [22.4, 65.8], [21.3, 64.7], [20.3, 63.8], [19.0, 63.4], [17.8, 62.5], [17.3, 61.6], [17.2, 60.7], [18.4, 60.2], [18.9, 59.5], [17.9, 58.9], [16.7, 58.4], [16.6, 57.6], [16.4, 56.7], [15.6, 56.2], [14.2, 55.4], [12.9, 55.4], [12.6, 56.1], [11.9, 57.5], [11.2, 58.9], [10.6, 59.9], [10.2, 59.0], [9.0, 58.5], [8.0, 58.1], [6.6, 58.1], [5.6, 58.9], [5.0, 60.0], [5.0, 61.2], [5.4, 62.0], [6.4, 62.6], [8.0, 63.2], [9.8, 63.9], [11.0, 64.8], [12.4, 65.9], [13.6, 66.9], [14.6, 67.8], [16.0, 68.6], [17.8, 69.4], [19.5, 69.9], [21.6, 70.3], [23.7, 70.8], [25.8, 71.1], [28.2, 71.0], [30.5, 70.4], [31.5, 69.8],
    [33.0, 68.8], [36.0, 67.5], [40.5, 66.5], [41.0, 60.0], [41.0, 50.0], [39.8, 47.2], [38.2, 47.0], [36.5, 45.3], [35.0, 45.3], [33.4, 44.5], [32.5, 45.4], [33.6, 46.1], [31.6, 46.6], [30.7, 46.4], [29.7, 45.2], [28.7, 44.3], [28.0, 43.4], [27.5, 42.5], [28.0, 41.9], [29.0, 41.2], [28.2, 41.0], [26.6, 40.4], [26.2, 40.9], [25.0, 40.9], [23.9, 40.5], [22.9, 40.5], [23.6, 39.9], [22.8, 39.4], [23.3, 38.6], [24.0, 38.2], [23.7, 37.8], [22.9, 37.5], [23.1, 36.5], [22.4, 36.4], [21.7, 36.9], [21.1, 37.8], [21.6, 38.3], [20.7, 39.1], [20.1, 39.7], [19.4, 40.5], [19.5, 41.4], [19.0, 42.0], [18.4, 42.5], [17.1, 43.1], [16.0, 43.5], [15.2, 44.2], [14.5, 45.2], [13.6, 45.6], [12.3, 45.4], [12.4, 44.5], [13.6, 43.5], [14.2, 42.4], [15.4, 41.9], [16.2, 41.8], [17.2, 41.0], [18.5, 40.1], [18.0, 39.9], [17.0, 40.5], [16.5, 39.7], [17.1, 39.0], [16.5, 38.4], [15.7, 37.9], [15.7, 38.7], [16.1, 39.4], [15.5, 40.1], [14.8, 40.6], [14.0, 40.8], [13.0, 41.3], [11.7, 42.1], [10.5, 42.9], [10.2, 43.9], [8.8, 44.4], [7.5, 43.8], [6.2, 43.1], [4.6, 43.4], [3.2, 43.1], [3.1, 42.4], [3.2, 41.9], [2.2, 41.4], [0.9, 41.0], [0.2, 40.2], [-0.3, 39.5], [0.2, 38.8], [-0.6, 38.2], [-0.8, 37.6], [-1.9, 36.9], [-2.9, 36.7], [-4.4, 36.7], [-5.2, 36.4]],
  // Great Britain
  [[-5.7, 50.0], [-4.2, 50.4], [-3.0, 50.7], [-1.0, 50.8], [1.3, 51.1], [1.4, 51.4], [0.9, 51.8], [1.7, 52.6], [0.4, 52.9], [0.2, 53.5], [-0.4, 54.5], [-1.5, 55.2], [-2.0, 56.0], [-2.8, 56.4], [-1.8, 57.5], [-3.1, 58.6], [-5.0, 58.6], [-5.7, 57.6], [-5.6, 56.6], [-5.6, 55.4], [-4.9, 54.8], [-3.4, 54.9], [-3.6, 54.2], [-3.0, 53.7], [-3.1, 53.3], [-4.6, 53.3], [-4.2, 52.4], [-5.2, 51.8], [-4.2, 51.6], [-3.0, 51.4], [-4.3, 51.2], [-5.5, 50.2]],
  // Ireland
  [[-6.0, 52.2], [-6.2, 53.3], [-6.0, 54.0], [-5.6, 54.6], [-6.2, 55.2], [-7.4, 55.3], [-8.5, 54.6], [-10.0, 54.2], [-10.0, 53.4], [-9.2, 53.1], [-10.3, 52.1], [-9.6, 51.5], [-8.0, 51.8]],
  // Sicily, Sardinia, Corsica, Zealand, Crete, Cyprus
  [[12.4, 37.8], [13.4, 38.2], [15.6, 38.3], [15.1, 37.3], [15.1, 36.7], [14.3, 37.0], [12.6, 37.6]],
  [[8.2, 40.9], [9.2, 41.2], [9.8, 40.5], [9.6, 39.2], [9.0, 39.0], [8.4, 39.0], [8.4, 40.0]],
  [[9.4, 43.0], [9.6, 42.0], [9.2, 41.4], [8.6, 41.8], [8.6, 42.4]],
  [[12.5, 56.0], [12.6, 55.5], [12.0, 55.0], [11.0, 55.3], [11.2, 55.8], [12.0, 56.1]],
  [[23.5, 35.5], [24.2, 35.6], [26.3, 35.3], [26.0, 35.0], [24.0, 35.2]],
  [[32.3, 35.0], [32.9, 35.4], [34.6, 35.7], [33.9, 35.0], [33.0, 34.6]],
];
const CAPITALS = [
  [13.4, 52.5], [2.35, 48.86], [-3.7, 40.4], [-9.14, 38.72], [12.5, 41.9], [16.37, 48.2], [4.35, 50.85], [4.9, 52.37],
  [6.13, 49.6], [12.57, 55.68], [18.07, 59.33], [24.94, 60.17], [24.75, 59.44], [24.1, 56.95], [25.28, 54.69], [21.0, 52.23],
  [14.42, 50.08], [17.1, 48.15], [19.04, 47.5], [14.5, 46.05], [15.98, 45.81], [26.1, 44.43], [23.32, 42.7], [23.73, 37.98],
  [14.51, 35.9], [33.36, 35.17], [-6.26, 53.35], [10.75, 59.91],
];
const MAPK = 17, MAPC = [960, 432];
const proj = (lon, lat) => [MAPC[0] + (lon - 12) * MAPK * 0.616, MAPC[1] - (lat - 52) * MAPK];
function inPoly(x, y, poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) ins = !ins;
  }
  return ins;
}
const MAP = (() => {
  const polys = EUROPE.map(p => p.map(q => proj(q[0], q[1])));
  const caps = CAPITALS.map(c => proj(c[0], c[1]));
  const dots = [];
  for (let y = 90; y < 760; y += 12) for (let x = 600; x < 1360; x += 12) {
    const xx = x + ((y / 12) % 2) * 6;
    if (polys.some(p => inPoly(xx, y, p))) {
      let dn = 1e9; caps.forEach(c => { dn = Math.min(dn, Math.hypot(c[0] - xx, c[1] - y)); });
      dots.push([xx, y, dn < 95 ? 1 : 0.35, Math.hypot(xx - caps[0][0], y - caps[0][1])]);
    }
  }
  return { dots, caps };
})();

function drawToggle(x, y, on, s = 1) {
  const w = 102 * s, h = 62 * s;
  rr(x, y, w, h, h / 2); ctx.fillStyle = mix('#FFFFFF', P.green16, on); ctx.fill();
  ctx.strokeStyle = mix('#E1E1E6', P.green16, on); ctx.lineWidth = 3 * s; ctx.stroke();
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8 * s; ctx.shadowOffsetY = 3 * s;
  circ(x + h / 2 + (w - h) * on, y + h / 2, h / 2 - 3 * s); ctx.fillStyle = '#FFFFFF'; ctx.fill();
  ctx.restore();
}
function drawCoin(x, y, r, tilt, rot = 0) {
  const at = Math.abs(tilt), ry = r * Math.max(0.14, at);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ell(0, (1 - at) * 7 + 2, r, ry); ctx.fillStyle = '#9C6F18'; ctx.fill();
  const g = ctx.createRadialGradient(-r * 0.3, -ry * 0.4, 2, 0, 0, r * 1.1);
  g.addColorStop(0, '#FFF0A8'); g.addColorStop(0.5, '#F2C14E'); g.addColorStop(1, '#C48A22');
  ell(0, 0, r, ry); ctx.fillStyle = g; ctx.fill();
  ell(0, 0, r * 0.74, ry * 0.74); ctx.strokeStyle = 'rgba(150,100,20,0.6)'; ctx.lineWidth = 2; ctx.stroke();
  if (at > 0.35) {
    ctx.save(); ctx.scale(1, ry / r); setFont(800, r * 0.95); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(140,92,15,0.85)'; ctx.fillText('€', 0, r * 0.06); ctx.restore();
  }
  ctx.restore();
}
const ROAM_COINS = (() => { const r = rng(21); return C.coins.map((c, i) => ({ c, x: 640 + r() * 640, rest: 0.25 + r() * 0.15, rot: (r() - 0.5) * 0.5, spin: 6 + r() * 8, y: 742 - r() * 26, cap: 1 + ((i * 5) % (CAPITALS.length - 1)) })); })();

function sceneRoaming(t) {
  const tm = C.morphs[1];
  bgUpgrade(t, tm, 960, 430);
  const cardOut = ep(t, tm, tm + 0.35, E.in3);
  const cardIn = spring(t - 13.15, 1.2, 6);
  if (cardOut < 1) {
    ctx.save();
    ctx.globalAlpha = (1 - cardOut) * clamp(cardIn * 1.5);
    ctx.translate(960, 400 + (1 - cardIn) * 120); const s = lerp(1, 0.7, cardOut); ctx.scale(s, s);
    ctx.save(); ctx.shadowColor = 'rgba(80,60,30,0.25)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
    rr(-330, -190, 660, 380, 20); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.roundRect(-330, -190, 660, 380, 20); ctx.clip();
    ctx.fillStyle = '#F7F7F7'; ctx.fillRect(-330, -190, 660, 78);
    ctx.fillStyle = '#D9D9DE'; ctx.fillRect(-330, -112, 660, 1.5);
    txt('‹ Einstellungen', -306, -142, { size: 24, weight: 400, fam: OLDUI, color: P.blue16 });
    txt('Mobiles Netz', 0, -142, { size: 26, weight: 700, fam: OLDUI, color: '#111', align: 'center' });
    txt('Mobile Daten', -300, -48, { size: 28, weight: 400, fam: OLDUI, color: '#111' });
    drawToggle(186, -84, 1);
    ctx.fillStyle = '#E2E2E6'; ctx.fillRect(-300, -6, 600, 1.5);
    txt('Datenroaming', -300, 54, { size: 28, weight: 400, fam: OLDUI, color: '#111' });
    const on = 1 - clamp(spring(t - C.toggle, 2.2, 9));
    drawToggle(186, 18, clamp(on, -0.08, 1.08));
    const tp = prog(t, C.tap, C.tap + 0.45);
    if (tp > 0 && tp < 1) { circ(237, 49, 20 + 70 * E.out3(tp)); ctx.fillStyle = `rgba(0,0,0,${0.18 * (1 - tp)})`; ctx.fill(); }
    ctx.fillStyle = '#EFEFF4'; ctx.fillRect(-330, 100, 660, 90);
    txt('Datenroaming deaktivieren, um hohe Gebühren', -300, 136, { size: 20, weight: 400, fam: OLDUI, color: '#8E8E93' });
    txt('im Ausland zu vermeiden.', -300, 164, { size: 20, weight: 400, fam: OLDUI, color: '#8E8E93' });
    ctx.restore();
    ctx.restore();
  }

  // the map (2026)
  if (t > tm - 0.05) {
    const R = (t - tm - 0.1) * 1100;
    const fade = ep(t, tm, tm + 0.4);
    const ber = MAP.caps[0];
    ctx.save();
    for (const d of MAP.dots) {
      const lit = clamp((R - d[3]) / 120);
      const front = Math.max(0, 1 - Math.abs(R - d[3]) / 60);
      ctx.globalAlpha = fade * (0.16 + 0.6 * lit * d[2] + 0.5 * front * d[2]);
      ctx.fillStyle = front > 0.2 ? '#FFFFFF' : (lit > 0 && d[2] > 0.5 ? P.cyan : '#7F8BC2');
      ctx.fillRect(d[0] - 2.2, d[1] - 2.2, 4.4, 4.4);
    }
    ctx.restore();
    // arcs from Berlin
    MAP.caps.forEach((c, i) => {
      if (i === 0) return;
      const a0 = tm + 0.25 + Math.hypot(c[0] - ber[0], c[1] - ber[1]) / 1400;
      const p = ep(t, a0, a0 + 0.45, E.out3);
      if (p <= 0) return;
      const mx = (ber[0] + c[0]) / 2, my = (ber[1] + c[1]) / 2 - Math.hypot(c[0] - ber[0], c[1] - ber[1]) * 0.28;
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const u = k / 24 * p, x = (1 - u) * (1 - u) * ber[0] + 2 * (1 - u) * u * mx + u * u * c[0], y = (1 - u) * (1 - u) * ber[1] + 2 * (1 - u) * u * my + u * u * c[1];
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = rgba(P.cyan, 0.5); ctx.lineWidth = 1.6; ctx.stroke();
      if (p >= 1) {
        const pulse = bump(t, a0 + 0.45, 0.6);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(c[0], c[1], 26 + 20 * pulse, P.cyan, 0.5 + 0.4 * pulse); ctx.restore();
        circ(c[0], c[1], 4); ctx.fillStyle = '#FFFFFF'; ctx.fill();
        if (pulse > 0) { circ(c[0], c[1], 6 + 26 * (1 - pulse)); ctx.strokeStyle = rgba('#FFFFFF', 0.5 * pulse); ctx.lineWidth = 1.5; ctx.stroke(); }
      }
    });
    // home node
    const hp = spring(t - tm - 0.1, 1.6, 6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ber[0], ber[1], 70 * hp, P.violet, 0.8); ctx.restore();
    circ(ber[0], ber[1], 9 * hp); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    // badge
    const bp = spring(t - tm - 0.55, 1.5, 6);
    if (bp > 0) {
      ctx.save(); ctx.translate(1480, 300); ctx.scale(bp, bp);
      rr(-170, -46, 340, 92, 46); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill(); ctx.strokeStyle = rgba(P.cyan, 0.6); ctx.lineWidth = 2; ctx.stroke();
      txt('Roaming-Aufpreis', -130, -6, { size: 20, weight: 600, color: 'rgba(255,255,255,0.75)' });
      txt('0,00 €', -130, 28, { size: 34, weight: 800, color: P.cyan });
      ctx.lineWidth = 3; ctx.strokeStyle = '#FFFFFF';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(110, 18, 10 + k * 11, -Math.PI * 0.75, -Math.PI * 0.25); ctx.globalAlpha = 0.4 + 0.6 * bump((t * 1.5 + k * 0.2) % 1, 0, 1); ctx.stroke(); }
      ctx.globalAlpha = 1; circ(110, 18, 4); ctx.fillStyle = '#FFFFFF'; ctx.fill();
      ctx.restore();
    }
  }

  // coins: rain down after the toggle, fly into the capitals after the morph
  ROAM_COINS.forEach((k, i) => {
    const fall = 0.55, ts = k.c - fall;
    if (t < ts) return;
    const fp = prog(t, ts, k.c);
    let x = k.x, y = lerp(-120, k.y, E.in2(fp)), tilt = Math.cos((t - ts) * k.spin), rot = k.rot;
    if (t > k.c) { y = k.y - Math.abs(wobble(t, k.c, 22, 3, 9)); tilt = lerp(k.rest, 0.3, 0.5); }
    const fl = ep(t, tm + i * 0.025, tm + 0.55 + i * 0.025, E.io3);
    let r = 34;
    if (fl > 0) {
      const tg = MAP.caps[k.cap];
      x = lerp(x, tg[0], fl); y = lerp(y, tg[1], fl) - Math.sin(fl * Math.PI) * 160; r = lerp(34, 4, fl);
      if (fl >= 1) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(x, y, 50 * fl, P.cyan, 0.8 * fl); ctx.restore();
    }
    drawCoin(x, y, r, tilt, rot);
  });

  upgradeFX(t, tm, 960, 430, 5);
  capPair(t, 'Roaming aus, sonst teuer.', 'Seit 2017: surfen wie zu Hause.', 13.45, tm, 16.25, { newAccent: { Seit: P.cyan, '2017:': P.cyan } });
}
