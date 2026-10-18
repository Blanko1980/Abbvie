'use strict';
/* Master compositor: scene routing, whip-pans, year chip, film finish.
 * window.renderFrame(t) is the deterministic entry point used by render.mjs. */

const SCENES = [
  [0, 8, sceneOpen], [8, 13, sceneEarbuds], [13, 18, sceneRoaming], [18, 23, sceneCash], [23, 28, sceneAI],
  [28, 32, sceneRx], [32, 35, sceneFreeze], [35, 50, sceneAD], [50, 55, sceneGrid], [55, 1e9, sceneEnd],
];
const sceneAt = t => { for (const s of SCENES) if (t < s[1]) return s[2]; return sceneEnd; };
const PAN = 0.25;

// year chip: [time, year, topic, style]  style 0 = 2016 (paper), 1 = 2026 (neon), 2 = muted
const CHIPS = [
  [8, '2016', 'KOPFHÖRER', 0], [10, '2026', 'KOPFHÖRER', 1],
  [13, '2016', 'MOBILES INTERNET', 0], [16, '2026', 'MOBILES INTERNET', 1],
  [18, '2017', 'BEZAHLEN', 0], [20, '2023', 'BEZAHLEN', 1],
  [23, '2016', 'KÜNSTLICHE INTELLIGENZ', 0], [26, '2026', 'KÜNSTLICHE INTELLIGENZ', 1],
  [28, '2016', 'REZEPT', 0], [30, '2026', 'REZEPT', 1],
  [32, null],
  [35.3, '2016', 'NEURODERMITIS-THERAPIE', 2], [40.75, '2017', 'NEURODERMITIS-THERAPIE', 2], [44, 'HEUTE', 'NEURODERMITIS-THERAPIE', 3],
  [49.8, null],
];
const CHIP_STYLE = [
  { fill: '#2A251F', text: '#F6F0E5', topic: '#2A251F' },
  { fill: '#5CE6DA', text: '#0B1233', topic: '#FFFFFF' },
  { fill: '#4A4E57', text: '#E3E5EA', topic: '#C8CBD2' },
  { fill: '#FFB36E', text: '#2A1608', topic: '#FFFFFF' },
];
function chip(t) {
  let i = -1;
  for (let k = 0; k < CHIPS.length; k++) if (t >= CHIPS[k][0]) i = k;
  if (i < 0) return;
  const cur = CHIPS[i], prev = i > 0 ? CHIPS[i - 1] : [0, null], dt = t - cur[0];
  let vis = 1, A = prev, B = cur;
  if (!cur[1]) { if (!prev[1]) return; vis = 1 - E.in3(prog(dt, 0, 0.25)); B = prev; }
  else if (!prev[1]) { vis = E.out3(prog(dt, 0, 0.35)); A = cur; }
  if (vis <= 0) return;
  const k = E.io3(prog(dt, 0, 0.42));
  const sa = CHIP_STYLE[A[3]], sb = CHIP_STYLE[B[3]];
  const x = 150, y = 74, h = 50;
  const wA = tw(A[1], 26, 800, SANS, 1) + 40, wB = tw(B[1], 26, 800, SANS, 1) + 40, w = lerp(wA, wB, k);
  ctx.save(); ctx.globalAlpha = vis;
  ctx.translate(0, (1 - vis) * -20);
  rr(x, y, w, h, h / 2); ctx.fillStyle = mix(sa.fill, sb.fill, k); ctx.fill();
  ctx.save(); rr(x, y, w, h, h / 2); ctx.clip();
  if (A[1] !== B[1]) {
    txt(A[1], x + w / 2, y + 35 - k * 50, { size: 26, weight: 800, align: 'center', color: sa.text, ls: 1 });
    txt(B[1], x + w / 2, y + 35 + (1 - k) * 50, { size: 26, weight: 800, align: 'center', color: sb.text, ls: 1 });
  } else txt(B[1], x + w / 2, y + 35, { size: 26, weight: 800, align: 'center', color: sb.text, ls: 1 });
  ctx.restore();
  const tx = x + w + 20;
  if (A[2] !== B[2]) {
    txt(A[2], tx, y + 33, { size: 18, weight: 700, ls: 3, color: sa.topic, alpha: 0.75 * (1 - k) });
    txt(B[2], tx, y + 33, { size: 18, weight: 700, ls: 3, color: sb.topic, alpha: 0.75 * k });
  } else txt(B[2], tx, y + 33, { size: 18, weight: 700, ls: 3, color: mix(sa.topic, sb.topic, k), alpha: 0.75 });
  ctx.restore();
}

function grainAmount(t) {
  if (t < 4.9) return 0.09;
  if (t >= 32 && t < 44) return 0.08;
  for (const [s, e] of [[8, 10], [13, 16], [18, 20], [23, 26], [28, 30]]) if (t >= s && t < e) return 0.08;
  return 0.04;
}

function drawFrame(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const pan = C.pans.find(b => Math.abs(t - b) < PAN);
  if (pan !== undefined) {
    const p = E.io3(prog(t, pan - PAN, pan + PAN));
    withCtx(OFF[0], () => sceneAt(pan - 0.001)(t));
    withCtx(OFF[1], () => sceneAt(pan + 0.001)(t));
    const blur = Math.sin(Math.PI * p) * 14;
    ctx.filter = blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : 'none';
    ctx.drawImage(OFF[0], -p * W, 0);
    ctx.drawImage(OFF[1], (1 - p) * W, 0);
    ctx.filter = 'none';
  } else if (t >= C.shatter && t < C.shatter + 0.95) {
    sceneEarbuds(t); drawShards(t);
  } else if (t >= 34.55 && t < 35.05) {
    sceneAD(t);
    withCtx(OFF[0], () => sceneFreeze(t));
    ctx.globalAlpha = 1 - E.io3(prog(t, 34.55, 35.05)); ctx.drawImage(OFF[0], 0, 0); ctx.globalAlpha = 1;
  } else sceneAt(t)(t);

  chip(t);
  grain(t, grainAmount(t));
  ctx.drawImage(VIGNETTE, 0, 0);
  const fin = 1 - prog(t, 0, 0.35), fout = prog(t, C.fadeOut[0], C.fadeOut[1]);
  const black = Math.max(fin, E.in2(fout));
  if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${black})`; ctx.fillRect(0, 0, W, H); }
}

const FONTS = ['900 50px "Inter Display"', '850 50px "Inter Display"', '800 50px "Inter Display"', '750 50px "Inter Display"', '700 50px "Inter Display"',
  '600 50px "Inter Display"', '500 50px "Inter Display"', '200 50px "Inter"', '400 50px "Inter"', '500 50px "Inter"', '600 50px "Inter"',
  '400 50px "Liberation Sans"', '700 50px "Liberation Sans"', '700 50px "Caladea"', '400 50px "Caladea"', '400 50px "Liberation Mono"'];
window.ready = Promise.all(FONTS.map(f => document.fonts.load(f).catch(() => null))).then(() => true);
window.renderFrame = t => { drawFrame(t); return true; };

// ---------------------------------------------------------------- live preview (open index.html via a local web server)
if (!/render/.test(location.search)) {
  window.ready.then(() => {
    const audio = new Audio('out/soundtrack.m4a');
    const hint = document.getElementById('hint');
    let playing = false;
    const loop = () => { drawFrame(Math.min(TL.duration, audio.currentTime)); if (playing) requestAnimationFrame(loop); };
    const params = new URLSearchParams(location.search);
    drawFrame(parseFloat(params.get('t') || '0.6'));
    document.body.addEventListener('click', () => {
      if (playing) { audio.pause(); playing = false; return; }
      if (audio.ended) audio.currentTime = 0;
      audio.play(); playing = true; if (hint) hint.style.display = 'none'; loop();
    });
    audio.addEventListener('ended', () => { playing = false; });
  });
}
