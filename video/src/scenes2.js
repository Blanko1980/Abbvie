'use strict';
/* Scenes 18–32 s: Bargeld -> Karte, Go -> KI, rosa Rezept -> E-Rezept */

// ================================================================ 18–23 s  BEZAHLEN
const CASH = { ax: 500, y0: 742, k: 4.6, cx: 740, rx: 104, ry: 28, th: 13 };
function stackH(t) {
  let h = 0;
  C.stack.forEach(c => { h += 34.04 * E.outBack(prog(t, c, c + 0.12), 2); });
  C.shrink.forEach(c => { h -= 17.5 * E.out3(prog(t, c, c + 0.1)); });
  return h;
}
const STACK_JIT = (() => { const r = rng(77); return Array.from({ length: 60 }, () => (r() - 0.5) * 9); })();
function coinBand(x, y, rx, ry, th) {
  ctx.beginPath(); ctx.moveTo(x + rx, y - th); ctx.lineTo(x + rx, y);
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI); ctx.lineTo(x - rx, y - th);
  ctx.ellipse(x, y - th, rx, ry, 0, Math.PI, 0, true); ctx.closePath();
}
function drawStack(h) {
  const { cx, y0, rx, ry, th } = CASH;
  const n = Math.max(0, Math.floor(h / th + 0.001));
  ctx.save(); ell(cx, y0 + 6, rx * 1.15, ry * 1.1); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill(); ctx.restore();
  const bandG = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
  bandG.addColorStop(0, '#9A6A12'); bandG.addColorStop(0.3, '#F3C653'); bandG.addColorStop(0.55, '#FFE592'); bandG.addColorStop(1, '#A87414');
  for (let k = 0; k < n; k++) {
    const x = cx + STACK_JIT[k], y = y0 - k * th;
    coinBand(x, y, rx, ry, th); ctx.fillStyle = bandG; ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,10,0.35)'; ctx.lineWidth = 1; ctx.stroke();
  }
  if (n > 0) {
    const x = cx + STACK_JIT[n - 1], y = y0 - n * th;
    const g = ctx.createRadialGradient(x - 30, y - 10, 4, x, y, rx * 1.1);
    g.addColorStop(0, '#FFF3B5'); g.addColorStop(0.6, '#F5C850'); g.addColorStop(1, '#C48A22');
    ell(x, y, rx, ry); ctx.fillStyle = g; ctx.fill();
    ell(x, y, rx * 0.76, ry * 0.76); ctx.strokeStyle = 'rgba(150,100,20,0.55)'; ctx.lineWidth = 2; ctx.stroke();
  }
}
function drawTerminal(t, x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
  const g = ctx.createLinearGradient(-120, -180, 120, 180); g.addColorStop(0, '#2E3550'); g.addColorStop(1, '#10142A');
  rr(-120, -185, 240, 370, 36); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  rr(-120, -185, 240, 370, 36); ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 2; ctx.stroke();
  const paid = clamp((t - C.paid) / 0.2);
  rr(-96, -160, 192, 220, 20); ctx.fillStyle = mix('#0B0F20', '#16C784', paid); ctx.fill();
  if (paid <= 0) {
    txt('Betrag', 0, -112, { size: 18, weight: 500, align: 'center', color: 'rgba(255,255,255,0.6)' });
    txt('12,90 €', 0, -68, { size: 40, weight: 800, align: 'center', color: '#FFFFFF' });
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      ctx.strokeStyle = rgba('#FFFFFF', 0.35 + 0.65 * bump(((t * 1.2) + k * 0.18) % 1, 0, 1));
      ctx.beginPath(); ctx.arc(-16, 5, 10 + k * 11, -0.7, 0.7); ctx.stroke();
    }
  } else {
    check(0, -62, 90, 11, '#FFFFFF', E.out3(prog(t, C.paid, C.paid + 0.3)));
    txt('Bezahlt', 0, 30, { size: 30, weight: 800, align: 'center', color: '#FFFFFF', alpha: paid });
  }
  for (let r = 0; r < 2; r++) { rr(-70, 92 + r * 34, 140, 6, 3); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill(); }
  ctx.restore();
}
function drawCard(x, y, rot, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 22;
  const g = ctx.createLinearGradient(-150, -95, 150, 95); g.addColorStop(0, '#7A5CFF'); g.addColorStop(0.55, '#3B7BFF'); g.addColorStop(1, '#14C8D6');
  rr(-150, -95, 300, 190, 20); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  ctx.save(); rr(-150, -95, 300, 190, 20); ctx.clip(); ctx.globalAlpha = 0.16; circ(110, -80, 120); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();
  const cg = ctx.createLinearGradient(-110, -30, -60, 10); cg.addColorStop(0, '#FFE7A0'); cg.addColorStop(1, '#C9A040');
  rr(-118, -34, 52, 40, 8); ctx.fillStyle = cg; ctx.fill();
  ctx.strokeStyle = 'rgba(120,90,20,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-118, -14); ctx.lineTo(-66, -14); ctx.moveTo(-92, -34); ctx.lineTo(-92, 6); ctx.stroke();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(96, -14, 8 + k * 8, -0.8, 0.8); ctx.stroke(); }
  txt('••••  2026', -118, 62, { size: 22, weight: 600, color: 'rgba(255,255,255,0.92)', ls: 2 });
  ctx.restore();
}

function sceneCash(t) {
  const tm = C.morphs[2];
  const e = ep(t, tm, tm + 0.6);
  bgUpgrade(t, tm, CASH.cx, 520);
  const { ax, y0, k, cx } = CASH;
  const ink = mix(P.ink, '#FFFFFF', e);
  const ap = ep(t, 18.1, 18.6, E.out3);
  // axis
  ctx.save(); ctx.globalAlpha = ap;
  ctx.strokeStyle = mix(P.ink, '#FFFFFF', e, 0.45); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ax, y0); ctx.lineTo(ax, y0 - 100 * k * ap); ctx.stroke();
  [0, 25, 50, 75, 100].forEach(v => {
    const y = y0 - v * k;
    ctx.beginPath(); ctx.moveTo(ax - 10, y); ctx.lineTo(ax, y); ctx.stroke();
    if (v % 50 === 0) txt(v + ' %', ax - 20, y + 7, { size: 20, weight: 500, align: 'right', color: mix(P.inkSoft, '#AEB6D8', e) });
  });
  ctx.beginPath(); ctx.moveTo(ax, y0); ctx.lineTo(ax + 520, y0); ctx.stroke();
  txt('Barzahlungen im Handel', ax - 20, y0 - 100 * k - 46, { size: 24, weight: 700, color: ink });
  txt('Anteil an allen Transaktionen', ax - 20, y0 - 100 * k - 18, { size: 18, weight: 500, color: mix(P.inkSoft, '#AEB6D8', e) });
  ctx.restore();

  const h = stackH(t);
  // ghost of 2017 after the drop
  const gh = ep(t, tm + 0.1, tm + 0.6);
  if (gh > 0) {
    const y = y0 - 74 * k;
    ctx.save(); ctx.globalAlpha = gh;
    ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ax, y); ctx.lineTo(cx + 160, y); ctx.stroke(); ctx.setLineDash([]);
    rr(cx - CASH.rx, y - 28, CASH.rx * 2, 28, 10); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke();
    txt('2017: 74 %', cx + 172, y + 8, { size: 24, weight: 700, color: 'rgba(255,255,255,0.6)' });
    ctx.restore();
  }
  drawStack(h);
  // popping coins (fly off as sparkles)
  C.shrink.forEach((c, i) => burst(t, c, cx, y0 - 340 + i * 17.5, { n: 7, seed: 30 + i, speed: 380, life: 0.55, size: 9, colors: ['#FFE592', '#F3C653', '#FFFFFF'], a0: -Math.PI * 0.9, spread: Math.PI * 0.8 }));
  // falling coins
  C.stack.forEach((c, i) => {
    const ts = c - 0.3;
    if (t < ts || t >= c) return;
    const p = prog(t, ts, c);
    drawCoin(cx + STACK_JIT[Math.min(59, Math.floor(i * 2.6))], lerp(-120, y0 - i * 34 - 26, E.in2(p)), CASH.rx * 0.98, Math.cos(p * 9 + i), 0);
  });
  // percentage label
  if (h > 2) {
    const pct = Math.round(h / k);
    const pop = bump(t, C.drawer, 0.35) + Math.max(0, wobble(t, tm + 0.55, 0.08, 4, 6));
    ctx.save(); ctx.translate(cx, y0 - h - 62); ctx.scale(1 + 0.12 * pop, 1 + 0.12 * pop);
    txt(pct + ' %', 0, 0, { size: 76, weight: 800, align: 'center', color: e > 0.5 ? P.cyan : P.ink });
    ctx.restore();
  }
  burst(t, C.drawer, cx, y0 - 340 - 80, { n: 14, seed: 12, speed: 320, life: 0.7, size: 10, colors: ['#F3C653', '#FFE592', '#FFFFFF'] });

  // terminal & contactless card (2023)
  if (t > C.terminalIn - 0.1) {
    const s = spring(t - C.terminalIn, 1.1, 5.5);
    const ty = lerp(1350, 560, s);
    drawTerminal(t, 1330, ty);
    const tapRing = prog(t, C.nfc, C.nfc + 0.8);
    if (tapRing > 0 && tapRing < 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let r = 0; r < 3; r++) { const q = clamp(tapRing * 1.4 - r * 0.2); if (q <= 0 || q >= 1) continue; circ(1330, ty - 210, 30 + q * 220); ctx.strokeStyle = rgba(P.cyan, 0.7 * (1 - q)); ctx.lineWidth = 4; ctx.stroke(); }
      ctx.restore();
    }
    if (t > C.cardSwoosh - 0.05) {
      const a = ep(t, C.cardSwoosh, C.nfc - 0.12, E.out3);
      const dn = E.in2(prog(t, C.nfc - 0.12, C.nfc));
      const up = E.out3(prog(t, C.nfc, C.nfc + 0.4));
      const x = lerp(1900, 1350, a), y = lerp(80, 300, a) + dn * 40 - up * 50;
      drawCard(x, y, lerp(0.9, -0.22, a) + dn * 0.05, 1);
    }
  }
  txt('Quelle: Deutsche Bundesbank, Studien zum Zahlungsverhalten in Deutschland 2017 und 2023', W - 60, H - 40,
    { size: 17, weight: 500, align: 'right', color: mix(P.inkSoft, '#9AA3C8', e), alpha: ep(t, 18.4, 18.9) });
  upgradeFX(t, tm, cx, 520, 9);
  capPair(t, '2017: 74 % bar bezahlt.', '2023: nur noch 51 %.', 18.4, tm, 20.25,
    { oldAccent: { '2017:': '#B8862B' }, newAccent: { '2023:': P.cyan, '51': P.cyan, '%.': P.cyan } });
}

// ================================================================ 23–28 s  KI
const GO_PRE = [[3, 3, 0], [9, 3, 1], [3, 9, 1], [9, 9, 0], [6, 6, 0], [7, 5, 1], [5, 7, 1], [4, 6, 0], [8, 4, 0], [10, 7, 1]];
const GO_NEW = [[6, 8, 0], [8, 6, 1], [7, 7, 0], [8, 8, 1]];
const BOARD = { x: 860, y: 452, S: 500, rot: -0.06 };
const WIN = { x: 960, y: 440, w: 1000, h: 540 };
const PROMPT = 'Mail ans Team: Meeting auf Donnerstag verschieben';
const MAIL = ['Hallo zusammen,', '', 'unser Meeting verschiebt sich auf Donnerstag, 10 Uhr.', 'Danke für eure Flexibilität!', '', 'Beste Grüße'];

function drawStone(x, y, r, white, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  ell(x + 3, y + 5, r, r * 0.9); ctx.fillStyle = 'rgba(40,20,0,0.35)'; ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  if (white) { g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.7, '#EDEBE6'); g.addColorStop(1, '#BDB8AE'); }
  else { g.addColorStop(0, '#6A6A70'); g.addColorStop(0.35, '#2A2A2E'); g.addColorStop(1, '#0C0C0E'); }
  circ(x, y, r); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
}
function goPos(i, j) { const S = BOARD.S, m = 34, c = (S - 2 * m) / 12; return [-S / 2 + m + i * c, -S / 2 + m + j * c]; }
function toBoard(p, rot) { const c = Math.cos(rot), s = Math.sin(rot); return [BOARD.x + p[0] * c - p[1] * s, BOARD.y + p[0] * s + p[1] * c]; }
function caretHome() { return [WIN.x - WIN.w / 2 + 96, WIN.y + WIN.h / 2 - 58]; }

function drawNewspaper(t) {
  const [a, b] = C.newspaper;
  const p = prog(t, a, b);
  if (p <= 0) return;
  const out = ep(t, C.morphs[3], C.morphs[3] + 0.35, E.in3);
  if (out >= 1) return;
  const q = E.out3(p);
  const x = lerp(1500, 1300, q) + out * 700, y = lerp(760, 470, q) + out * 300;
  const rot = lerp(Math.PI * 5, 0.07, q) + out * 0.8, s = lerp(0.08, 1, q) * (1 + wobble(t, b, 0.03, 5, 8));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.save(); ctx.shadowColor = 'rgba(60,40,10,0.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#F3EFE4'; ctx.fillRect(-210, -270, 420, 540); ctx.restore();
  const pg = ctx.createLinearGradient(-210, 0, 210, 0); pg.addColorStop(0, 'rgba(0,0,0,0.05)'); pg.addColorStop(0.5, 'rgba(0,0,0,0)'); pg.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = pg; ctx.fillRect(-210, -270, 420, 540);
  txt('DER ANZEIGER', 0, -218, { size: 44, weight: 700, fam: SERIF, color: '#1A1A1A', align: 'center', ls: 1 });
  ctx.fillStyle = '#1A1A1A'; ctx.fillRect(-190, -202, 380, 3); ctx.fillRect(-190, -178, 380, 1.2);
  txt('Mittwoch, 16. März 2016', -188, -185, { size: 12, weight: 400, fam: SERIF, color: '#333' });
  txt('Nr. 63 · 1,80 €', 188, -185, { size: 12, weight: 400, fam: SERIF, color: '#333', align: 'right' });
  txt('Computer schlägt', -188, -128, { size: 44, weight: 700, fam: SERIF, color: '#111' });
  txt('Go-Legende', -188, -80, { size: 44, weight: 700, fam: SERIF, color: '#111' });
  txt('Künstliche Intelligenz gewinnt 4:1 – die Fachwelt staunt', -188, -50, { size: 14.5, weight: 400, fam: SERIF, color: '#333' });
  const ig = ctx.createLinearGradient(0, -30, 0, 110); ig.addColorStop(0, '#B9B4A8'); ig.addColorStop(1, '#8F897C');
  ctx.fillStyle = ig; ctx.fillRect(-188, -32, 200, 140);
  ctx.strokeStyle = 'rgba(40,30,10,0.35)'; ctx.lineWidth = 1;
  for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(-170 + k * 24, -14); ctx.lineTo(-170 + k * 24, 92); ctx.moveTo(-170, -14 + k * 17.6); ctx.lineTo(-26, -14 + k * 17.6); ctx.stroke(); }
  [[-122, 21, 0], [-98, 39, 1], [-74, 21, 1], [-98, 4, 0]].forEach(s => { circ(s[0], s[1], 8); ctx.fillStyle = s[2] ? '#EEE' : '#222'; ctx.fill(); });
  const r = rng(13);
  ctx.fillStyle = 'rgba(40,40,40,0.38)';
  for (let k = 0; k < 9; k++) ctx.fillRect(26, -28 + k * 15.5, 160 - r() * 30, 5);
  for (let col = 0; col < 2; col++) for (let k = 0; k < 9; k++) ctx.fillRect(-188 + col * 194, 128 + k * 15.5, 182 - (k === 8 ? 80 : r() * 18), 5);
  ctx.restore();
}

function sceneAI(t) {
  const tm = C.morphs[3];
  bgUpgrade(t, tm, BOARD.x, BOARD.y);
  const m = ep(t, tm + 0.05, tm + 0.55, E.io3);
  const inP = spring(t - 23.1, 1.1, 6);
  const rot = lerp(BOARD.rot, 0, m);
  const bx = lerp(BOARD.x, WIN.x, m), by = lerp(BOARD.y, WIN.y, m) + (1 - inP) * 700;
  const bw = lerp(BOARD.S, WIN.w, m), bh = lerp(BOARD.S, WIN.h, m), br = lerp(8, 28, m);

  // board / window body
  ctx.save(); ctx.translate(bx, by); ctx.rotate(rot);
  ctx.save(); ctx.shadowColor = m < 0.5 ? 'rgba(70,40,10,0.35)' : 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26;
  rr(-bw / 2, -bh / 2, bw, bh, br); ctx.fillStyle = mix('#D9A85E', '#0E1430', m, lerp(1, 0.82, m)); ctx.fill(); ctx.restore();
  if (m < 1) {
    ctx.save(); rr(-bw / 2, -bh / 2, bw, bh, br); ctx.clip(); ctx.globalAlpha = 1 - m;
    const wg = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2); wg.addColorStop(0, '#E8BE78'); wg.addColorStop(1, '#C48B45');
    ctx.fillStyle = wg; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeStyle = 'rgba(120,70,20,0.12)'; ctx.lineWidth = 2;
    for (let k = 0; k < 24; k++) { ctx.beginPath(); const y = -bh / 2 + k * bh / 24; ctx.moveTo(-bw / 2, y); for (let x = -bw / 2; x <= bw / 2; x += 25) ctx.lineTo(x, y + Math.sin(x * 0.02 + k) * 6); ctx.stroke(); }
    ctx.globalAlpha = (1 - m) * (1 - m);
    ctx.strokeStyle = 'rgba(40,20,0,0.75)'; ctx.lineWidth = 1.6;
    for (let k = 0; k < 13; k++) {
      const a = goPos(k, 0), b = goPos(k, 12), c = goPos(0, k), d = goPos(12, k);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
    }
    [[3, 3], [9, 3], [3, 9], [9, 9], [6, 6]].forEach(s => { const p = goPos(s[0], s[1]); circ(p[0], p[1], 4); ctx.fillStyle = 'rgba(40,20,0,0.8)'; ctx.fill(); });
    ctx.restore();
  }
  if (m > 0) {
    rr(-bw / 2, -bh / 2, bw, bh, br);
    const sg = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0); sg.addColorStop(0, rgba(P.cyan, 0.7 * m)); sg.addColorStop(1, rgba(P.violet, 0.7 * m));
    ctx.strokeStyle = sg; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();

  // window content
  const cm = ep(t, tm + 0.3, tm + 0.6);
  let caret = caretHome(), caretOn = t > tm + 0.42;
  if (cm > 0) {
    const x0 = WIN.x - WIN.w / 2, y0 = WIN.y - WIN.h / 2;
    ctx.save(); ctx.globalAlpha = cm;
    ['#FF6B6B', '#FFC857', '#3CF2A6'].forEach((c, i) => { circ(x0 + 34 + i * 24, y0 + 30, 7); ctx.fillStyle = rgba(c, 0.85); ctx.fill(); });
    txt('Neue E-Mail', WIN.x, y0 + 37, { size: 20, weight: 600, align: 'center', color: 'rgba(255,255,255,0.6)' });
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x0, y0 + 58, WIN.w, 1.5);
    txt('An:', x0 + 40, y0 + 102, { size: 22, weight: 500, color: 'rgba(255,255,255,0.5)', fam: TEXT });
    rr(x0 + 92, y0 + 78, 190, 34, 17); ctx.fillStyle = rgba(P.violet, 0.3); ctx.fill();
    txt('Team Marketing', x0 + 108, y0 + 102, { size: 20, weight: 600, color: '#FFFFFF', fam: TEXT });
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x0 + 40, y0 + 126, WIN.w - 80, 1.5);
    txt('Betreff:', x0 + 40, y0 + 160, { size: 22, weight: 500, color: 'rgba(255,255,255,0.5)', fam: TEXT });
    const [s0, s1] = C.stream;
    const sub = 'Neuer Termin: Donnerstag, 10 Uhr';
    const sp = prog(t, s0, s1);
    txt(sub.slice(0, Math.floor(sub.length * clamp(sp * 3))), x0 + 128, y0 + 160, { size: 22, weight: 600, color: '#FFFFFF', fam: TEXT });
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x0 + 40, y0 + 184, WIN.w - 80, 1.5);
    // streamed body
    const total = MAIL.join('\n').length;
    let left = Math.floor(total * sp), ly = y0 + 232;
    MAIL.forEach(line => {
      if (left < 0) return;
      const shown = line.slice(0, Math.max(0, left));
      txt(shown, x0 + 40, ly, { size: 26, weight: 400, color: 'rgba(255,255,255,0.92)', fam: TEXT });
      if (sp > 0 && left <= line.length && left >= 0) caret = [x0 + 44 + tw(shown, 26, 400, TEXT), ly - 9];
      left -= line.length + 1; ly += 38;
    });
    if (sp > 0) {
      const lp = spring(t - s0 + 0.05, 1.5, 6);
      ctx.save(); ctx.translate(x0 + WIN.w - 150, y0 + 222); ctx.scale(lp, lp);
      rr(-70, -22, 160, 36, 18); ctx.fillStyle = rgba(P.cyan, 0.14); ctx.fill();
      ctx.fillStyle = P.cyan; sparkle(-48, -4, 11, t * 2); ctx.fill();
      txt('KI-Entwurf', -30, 3, { size: 17, weight: 700, color: P.cyan });
      ctx.restore();
    }
    // prompt bar
    const px = x0 + 40, py = y0 + WIN.h - 92, pw = WIN.w - 80;
    rr(px, py, pw, 64, 32); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
    const pg = ctx.createLinearGradient(px, 0, px + pw, 0); pg.addColorStop(0, rgba(P.cyan, 0.8)); pg.addColorStop(1, rgba(P.violet, 0.8));
    ctx.strokeStyle = pg; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = P.cyan; sparkle(px + 32, py + 32, 13, t * 1.5); ctx.fill();
    const kp = prog(t, C.keys[0], C.keys[C.keys.length - 1] + 0.04);
    const ptxt = PROMPT.slice(0, Math.floor(PROMPT.length * kp));
    const sent = t > C.enter;
    txt(ptxt, px + 58, py + 41, { size: 23, weight: 500, color: sent ? 'rgba(255,255,255,0.45)' : '#FFFFFF', fam: TEXT });
    if (!sent && t > C.keys[0]) caret = [px + 62 + tw(ptxt, 23, 500, TEXT), py + 32];
    const bp = bump(t, C.enter, 0.3);
    circ(px + pw - 32, py + 32, 22 * (1 + 0.2 * bp)); ctx.fillStyle = sent ? P.cyan : 'rgba(255,255,255,0.18)'; ctx.fill();
    ctx.strokeStyle = sent ? '#0B1233' : '#FFFFFF'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px + pw - 32, py + 42); ctx.lineTo(px + pw - 32, py + 22); ctx.moveTo(px + pw - 40, py + 30); ctx.lineTo(px + pw - 32, py + 22); ctx.lineTo(px + pw - 24, py + 30); ctx.stroke();
    ctx.restore();
  }
  burst(t, C.enter + 0.03, WIN.x - WIN.w / 2 + 70, WIN.y - WIN.h / 2 + 230, { n: 16, seed: 41, speed: 300, life: 0.8, size: 9 });

  // stones: placed one by one, later fly into the caret
  const stones = GO_PRE.map(s => [...s, 23.0]).concat(GO_NEW.map((s, i) => [...s, C.stones[i]]));
  stones.forEach((s, i) => {
    const pre = i < GO_PRE.length;
    const appear = pre ? clamp(inP * 1.2) : E.out3(prog(t, s[3] - 0.08, s[3]));
    if (appear <= 0) return;
    const p0 = toBoard(goPos(s[0], s[1]), BOARD.rot);
    let x = p0[0], y = p0[1] + (1 - inP) * 700;
    const drop = pre ? 1 : appear;
    const f = ep(t, tm + i * 0.018, tm + 0.42 + i * 0.018, E.in3);
    if (f >= 1) return;
    const hc = caretHome();
    if (f > 0) {
      x = lerp(x, hc[0], f); y = lerp(y, hc[1], f) - Math.sin(f * Math.PI) * 120;
      const w = lerp(33, 5, f), h = lerp(33, 34, f);
      ctx.save(); ctx.globalCompositeOperation = f > 0.5 ? 'lighter' : 'source-over';
      rr(x - w / 2, y - h / 2, w, h, w / 2); ctx.fillStyle = s[2] ? mix('#F2F0EB', P.cyan, f) : mix('#1A1A1E', P.violet, f); ctx.fill();
      ctx.restore();
      return;
    }
    const sc = lerp(1.5, 1, drop);
    ctx.save(); ctx.globalAlpha = Math.min(1, drop * 2);
    drawStone(x, y - (1 - drop) * 30, 16.5 * sc, s[2]);
    ctx.restore();
  });
  // caret (stones become the cursor)
  if (caretOn) {
    const typing = (t > C.keys[0] && t < C.enter) || (t > C.stream[0] && t < C.stream[1]);
    const blink = typing || Math.floor(t * 2.4) % 2 === 0;
    if (blink) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(caret[0], caret[1], 30, P.cyan, 0.5); ctx.restore();
      const g = ctx.createLinearGradient(0, caret[1] - 17, 0, caret[1] + 17); g.addColorStop(0, P.cyan); g.addColorStop(1, P.violet);
      rr(caret[0] - 2, caret[1] - 17, 4, 34, 2); ctx.fillStyle = g; ctx.fill();
    }
  }
  drawNewspaper(t);
  upgradeFX(t, tm, BOARD.x, BOARD.y, 13);
  capPair(t, 'Über KI staunen.', 'KI um Hilfe bitten.', 23.45, tm, 26.2, { newAccent: { KI: P.cyan } });
}

// ================================================================ 28–32 s  REZEPT
const PAPER_W = 600, PAPER_H = 420;
function scribble(x0, y0, len, seed, hgt = 14) {
  const r = rng(seed), pts = [];
  let x = x0, k = 0;
  while (x < x0 + len) {
    const lw = 10 + r() * 14, hh = hgt * (0.5 + r() * 0.8), loops = 1 + Math.floor(r() * 2);
    for (let u = 0; u <= 1; u += 0.08) {
      const a = u * TAU * loops;
      pts.push([x + u * lw + Math.sin(a) * 3.5, y0 - Math.abs(Math.sin(a / 2)) * hh + Math.cos(a) * 2 + Math.sin(k * 0.7) * 1.5]);
    }
    x += lw + (r() < 0.18 ? 12 : 1.5); k++;
  }
  return pts;
}
const SCRIBBLES = [scribble(96, 106, 200, 1, 12), scribble(400, 106, 80, 2, 11), scribble(84, 252, 300, 3, 16), scribble(84, 294, 250, 4, 16), scribble(84, 336, 150, 5, 14)];
const STAMP = (() => {
  const c = mkCanvas(300, 130);
  withCtx(c, () => {
    const ink = '#2C46A8';
    ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(6, 6, 288, 118); ctx.lineWidth = 1.2; ctx.strokeRect(12, 12, 276, 106);
    txt('Praxis Dr. med. A. Muster', 150, 42, { size: 20, weight: 700, fam: OLDUI, color: ink, align: 'center' });
    txt('Fachärztin für Dermatologie', 150, 66, { size: 15, weight: 400, fam: OLDUI, color: ink, align: 'center' });
    txt('Musterstraße 1 · 12345 Musterstadt', 150, 88, { size: 13, weight: 400, fam: OLDUI, color: ink, align: 'center' });
    txt('BSNR 123456789', 150, 108, { size: 12, weight: 400, fam: OLDUI, color: ink, align: 'center' });
    ctx.globalCompositeOperation = 'destination-out';
    const r = rng(17);
    for (let i = 0; i < 900; i++) { ctx.globalAlpha = r() * 0.8; ctx.fillRect(r() * 300, r() * 130, 1 + r() * 3, 1 + r() * 2); }
  });
  return c;
})();
function drawPaper(scrib, stampP) {
  const red = '#C9475F', pale = 'rgba(201,71,95,0.35)';
  ctx.fillStyle = '#F9DCE2'; ctx.fillRect(0, 0, PAPER_W, PAPER_H);
  ctx.save(); ctx.globalAlpha = 0.18; ctx.strokeStyle = '#E79AAA'; ctx.lineWidth = 1;
  for (let k = -20; k < 40; k++) { ctx.beginPath(); ctx.moveTo(k * 22, 0); ctx.lineTo(k * 22 + 200, PAPER_H); ctx.stroke(); }
  ctx.restore();
  const lab = (s, x, y, sz = 10) => txt(s, x, y, { size: sz, weight: 400, fam: OLDUI, color: red });
  ctx.strokeStyle = pale; ctx.lineWidth = 1.2;
  ['Gebühr frei', 'Geb.-pfl.', 'noctu', 'Sonstige', 'Unfall'].forEach((s, i) => {
    ctx.strokeRect(12, 24 + i * 24, 13, 13); lab(s, 30, 35 + i * 24, 9);
  });
  ctx.strokeStyle = '#2A3E8F'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(14, 50); ctx.lineTo(23, 59); ctx.moveTo(23, 50); ctx.lineTo(14, 59); ctx.stroke();
  ctx.strokeStyle = pale; ctx.lineWidth = 1.2;
  lab('Krankenkasse bzw. Kostenträger', 90, 22); ctx.strokeRect(86, 26, 300, 30);
  txt('AOK  MUSTERLAND', 96, 47, { size: 15, weight: 400, fam: '"Liberation Mono", monospace', color: '#222' });
  lab('Name, Vorname des Versicherten', 90, 72); lab('geb. am', 400, 72);
  ctx.strokeRect(86, 76, 300, 40); ctx.strokeRect(392, 76, 110, 40);
  lab('Kostenträgerkennung', 90, 132); lab('Versicherten-Nr.', 250, 132); lab('Status', 410, 132);
  ctx.strokeRect(86, 136, 156, 26); ctx.strokeRect(246, 136, 156, 26); ctx.strokeRect(406, 136, 96, 26);
  txt('101234567   A123456789   1000001', 94, 155, { size: 14, weight: 400, fam: '"Liberation Mono", monospace', color: '#222' });
  lab('Betriebsstätten-Nr.', 90, 178); lab('Arzt-Nr.', 250, 178); lab('Datum', 410, 178);
  ctx.strokeRect(86, 182, 156, 26); ctx.strokeRect(246, 182, 156, 26); ctx.strokeRect(406, 182, 96, 26);
  txt('123456789   987654321   02.07.16', 94, 201, { size: 14, weight: 400, fam: '"Liberation Mono", monospace', color: '#222' });
  ctx.strokeRect(520, 26, 66, 182); lab('Apotheke', 524, 40, 9);
  txt('Rp.', 14, 252, { size: 30, weight: 700, fam: SERIF, color: red });
  lab('(Bitte Leerräume durchstreichen)', 14, 270, 8.5);
  ctx.strokeRect(400, 300, 186, 108); lab('Unterschrift des Arztes', 410, 404, 9);
  txt('Muster 16', 586, 414, { size: 9, weight: 400, fam: OLDUI, color: red, align: 'right' });
  // handwriting
  let L = 0; const tot = SCRIBBLES.reduce((a, s) => a + polyLen(s), 0) + 260;
  SCRIBBLES.forEach(s => {
    const len = polyLen(s), f = clamp((scrib * tot - L) / len);
    if (f > 0) strokePoly(subPoly(s, 0, f), 2.4, '#2A3E8F');
    L += len;
  });
  const zf = clamp((scrib * tot - L) / 260);
  if (zf > 0) strokePoly(subPoly([[250, 336], [380, 330], [100, 372], [380, 366]], 0, zf), 2, '#2A3E8F');
  if (stampP > 0) {
    ctx.save(); ctx.translate(493, 350); ctx.rotate(-0.1); ctx.globalAlpha = stampP * 0.92;
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(STAMP, -150 * 0.62, -65 * 0.62, 300 * 0.62, 130 * 0.62); ctx.restore();
  }
}
const PAPER_IMG = (() => { const c = mkCanvas(PAPER_W, PAPER_H); withCtx(c, () => drawPaper(1, 1)); return c; })();
const QR = (() => {
  const N = 25, r = rng(2024), q = Array.from({ length: N }, () => Array.from({ length: N }, () => r() < 0.5 ? 1 : 0));
  const finder = (ox, oy) => { for (let y = -1; y < 8; y++) for (let x = -1; x < 8; x++) { const X = ox + x, Y = oy + y; if (X < 0 || Y < 0 || X >= N || Y >= N) continue; const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3)); q[Y][X] = (ring === 3 || ring <= 1) ? 1 : 0; } };
  finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
  for (let i = 8; i < N - 8; i++) { q[6][i] = i % 2 === 0 ? 1 : 0; q[i][6] = i % 2 === 0 ? 1 : 0; }
  for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) { const ring = Math.max(Math.abs(x), Math.abs(y)); q[18 + y][18 + x] = ring === 1 ? 0 : 1; }
  return q;
})();
const RX = { px: 960, py: 440, rot: -0.035, qx: 960, qy: 430, qs: 300, ps: 1.38 };

function drawNewPhone(t, a) {
  ctx.save(); ctx.globalAlpha = a;
  const x = 960, y = 452, w = 400, h = 770;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 30;
  rr(x - w / 2, y - h / 2, w, h, 62); ctx.fillStyle = '#1C2033'; ctx.fill(); ctx.restore();
  rr(x - w / 2 + 8, y - h / 2 + 8, w - 16, h - 16, 54); ctx.fillStyle = '#0B0F1F'; ctx.fill();
  rr(x - w / 2, y - h / 2, w, h, 62); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.stroke();
  rr(x - 52, y - h / 2 + 24, 104, 30, 15); ctx.fillStyle = '#000'; ctx.fill();
  txt('E-Rezept', x - 150, y - h / 2 + 108, { size: 32, weight: 800, color: '#FFFFFF' });
  txt('1 Verordnung · Dermatologie', x - 150, y - h / 2 + 140, { size: 17, weight: 500, color: 'rgba(255,255,255,0.55)' });
  rr(RX.qx - 170, RX.qy - 170, 340, 340, 26); ctx.fillStyle = '#FFFFFF'; ctx.fill();
  const done = clamp((t - C.scan[1]) / 0.15);
  txt(done > 0 ? 'Eingelöst in Ihrer Apotheke' : 'Code in der Apotheke scannen', x, RX.qy + 212, { size: 18, weight: 600, align: 'center', color: done > 0 ? P.mint : 'rgba(255,255,255,0.7)' });
  rr(x - 150, y + h / 2 - 104, 300, 58, 29);
  const bg = ctx.createLinearGradient(x - 150, 0, x + 150, 0); bg.addColorStop(0, P.cyan); bg.addColorStop(1, P.violet);
  ctx.fillStyle = bg; ctx.fill();
  txt('Einlösen', x, y + h / 2 - 66, { size: 22, weight: 800, align: 'center', color: '#0B1233' });
  rr(x - 60, y + h / 2 - 22, 120, 5, 3); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
  ctx.restore();
}

function sceneRx(t) {
  const tm = C.morphs[4];
  bgUpgrade(t, tm, RX.px, RX.py);
  const sIn = spring(t - (C.paperIn - 0.1), 1.0, 5.5);
  const [k0, k1] = C.scribble;
  const scrib = prog(t, k0, k1);
  const sp = prog(t, C.stamp - 0.2, C.stamp);
  const [shx, shy] = shake(t, C.stamp, 12, 0.35);

  if (t < tm) {
    ctx.save(); ctx.translate(RX.px + shx, RX.py + (1 - sIn) * 900 + shy); ctx.rotate(RX.rot + (1 - sIn) * 0.25); ctx.scale(RX.ps, RX.ps);
    ctx.save(); ctx.shadowColor = 'rgba(90,50,40,0.3)'; ctx.shadowBlur = 45; ctx.shadowOffsetY = 20;
    ctx.fillStyle = '#F9DCE2'; ctx.fillRect(-PAPER_W / 2, -PAPER_H / 2, PAPER_W, PAPER_H); ctx.restore();
    ctx.translate(-PAPER_W / 2, -PAPER_H / 2);
    drawPaper(scrib, t >= C.stamp ? 1 : 0);
    // pen nib
    if (scrib > 0 && scrib < 1) {
      let L = 0; const tot = SCRIBBLES.reduce((a, s) => a + polyLen(s), 0) + 260; let pos = null;
      for (const s of SCRIBBLES) { const len = polyLen(s); const f = (scrib * tot - L) / len; if (f > 0 && f <= 1) pos = pointAt(s, f); L += len; }
      if (pos) { ctx.save(); ctx.translate(pos[0], pos[1]); ctx.rotate(-0.6); rr(-5, -120, 12, 118, 5); ctx.fillStyle = '#1E2A5A'; ctx.fill(); ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(7, -4); ctx.lineTo(1, 6); ctx.closePath(); ctx.fillStyle = '#C9A040'; ctx.fill(); ctx.restore(); }
    }
    // stamp descending
    if (sp > 0 && t < C.stamp + 0.25) {
      const lift = t < C.stamp ? 1 - E.in3(sp) : E.out3(prog(t, C.stamp + 0.05, C.stamp + 0.25));
      ctx.save(); ctx.translate(493, 350 - lift * 160); ctx.rotate(-0.1); const s = 1 + lift * 0.35; ctx.scale(s, s);
      ctx.globalAlpha = clamp(1 - prog(t, C.stamp + 0.1, C.stamp + 0.25));
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 20 * lift;
      rr(-100, -46, 200, 92, 10); ctx.fillStyle = '#3A2A20'; ctx.fill();
      rr(-36, -150, 72, 110, 30); ctx.fillStyle = '#5A3E2E'; ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  } else {
    const pf = ep(t, tm + 0.2, tm + 0.6);
    ctx.save(); ctx.translate(960, 452); const s = lerp(1.08, 1, pf); ctx.scale(s, s); ctx.translate(-960, -452);
    drawNewPhone(t, pf);
    ctx.restore();
    // pixel morph: paper cells -> QR modules
    const N = 25, cw = PAPER_W / N, ch = PAPER_H / N, qc = RX.qs / N, ps = RX.ps;
    const cs = Math.cos(RX.rot), sn = Math.sin(RX.rot);
    const r = rng(5);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const d = Math.hypot(i - 12, j - 12) / 17 * 0.32 + r() * 0.08;
      const q = E.io3(prog(t, tm + d, tm + d + 0.42));
      const lx = ((i + 0.5) * cw - PAPER_W / 2) * ps, ly = ((j + 0.5) * ch - PAPER_H / 2) * ps;
      const sx = RX.px + lx * cs - ly * sn, sy = RX.py + lx * sn + ly * cs;
      const dx = RX.qx - RX.qs / 2 + (i + 0.5) * qc, dy = RX.qy - RX.qs / 2 + (j + 0.5) * qc;
      const x = lerp(sx, dx, q), y = lerp(sy, dy, q) - Math.sin(q * Math.PI) * 40;
      const w = lerp(cw * ps, qc, q) + 0.7, h = lerp(ch * ps, qc, q) + 0.7;
      const c2 = prog(q, 0.35, 0.9);
      ctx.save(); ctx.translate(x, y); ctx.rotate(lerp(RX.rot, 0, q) + Math.sin(q * Math.PI) * (r() - 0.5) * 1.2);
      if (c2 < 1) ctx.drawImage(PAPER_IMG, i * cw, j * ch, cw, ch, -w / 2, -h / 2, w, h);
      if (c2 > 0) { ctx.globalAlpha = c2; ctx.fillStyle = QR[j][i] ? '#0B1233' : '#FFFFFF'; ctx.fillRect(-w / 2, -h / 2, w, h); }
      ctx.restore();
    }
    // scan
    const [a, b] = C.scan;
    const scp = prog(t, a, b);
    if (scp > 0 && scp < 1) {
      const y = RX.qy - 160 + scp * 320;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, y - 60, 0, y); g.addColorStop(0, rgba(P.mint, 0)); g.addColorStop(1, rgba(P.mint, 0.35));
      ctx.fillStyle = g; ctx.fillRect(RX.qx - 168, y - 60, 336, 60);
      ctx.fillStyle = P.mint; ctx.fillRect(RX.qx - 175, y - 2, 350, 4);
      ctx.restore();
    }
    const done = prog(t, b, b + 0.2);
    if (done > 0) {
      rr(RX.qx - 170, RX.qy - 170, 340, 340, 26); ctx.strokeStyle = rgba(P.mint, done * (0.6 + 0.4 * bump(t, b, 0.5))); ctx.lineWidth = 6; ctx.stroke();
      const cp = spring(t - C.check, 1.6, 6);
      ctx.save(); ctx.translate(RX.qx + 160, RX.qy - 160); ctx.scale(cp, cp);
      circ(0, 0, 36); ctx.fillStyle = P.mint; ctx.fill();
      check(0, 2, 44, 7, '#0B1233', E.out3(prog(t, C.check + 0.05, C.check + 0.35)));
      ctx.restore();
      burst(t, C.check, RX.qx + 160, RX.qy - 160, { n: 16, seed: 77, speed: 360, life: 0.7, size: 9, colors: [P.mint, '#FFFFFF', P.cyan] });
    }
  }
  upgradeFX(t, tm, RX.px, RX.py, 17);
  capPair(t, 'Rosa Zettel.', 'E-Rezept: seit 2024 Standard.', 28.4, tm, 30.2, { newAccent: { 'E-Rezept:': P.cyan } });
}
