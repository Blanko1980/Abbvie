/* Mathe, Easing, deterministischer Zufall, Keyframes, Formen, Pfade. */
(function () {
  const F = (window.FILM = window.FILM || {});
  const TAU = Math.PI * 2;

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const smooth = (t) => t * t * (3 - 2 * t);

  const ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outSine: (t) => Math.sin((t * Math.PI) / 2),
    outBack: (t) => {
      const c1 = 1.2, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
  };

  /* Keyframes: keys = [[zeit, wert, easeName?], ...]; Easing gilt für das Segment,
     das an diesem Key endet. Werte: Zahl oder Array von Zahlen. */
  function kf(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    const last = keys[keys.length - 1];
    if (t >= last[0]) return last[1];
    for (let i = 1; i < keys.length; i++) {
      const k1 = keys[i];
      if (t <= k1[0]) {
        const k0 = keys[i - 1];
        const e = ease[k1[2] || 'inOutCubic'];
        const u = e((t - k0[0]) / (k1[0] - k0[0] || 1));
        if (Array.isArray(k0[1])) return k0[1].map((v, j) => lerp(v, k1[1][j], u));
        return lerp(k0[1], k1[1], u);
      }
    }
    return last[1];
  }

  /* Deterministischer Zufall (mulberry32) */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Farben */
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    const r = A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))));
    return '#' + r.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  function rgba(hex, a) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }
  const shade = (hex, amt) => (amt < 0 ? mix(hex, '#000000', -amt) : mix(hex, '#FFFFFF', amt));

  /* Formen */
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fillRR(ctx, x, y, w, h, r, color) {
    rr(ctx, x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function ellipse(ctx, x, y, rx, ry, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU);
  }
  function fillEllipse(ctx, x, y, rx, ry, color, rot = 0) {
    ellipse(ctx, x, y, rx, ry, rot);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function circle(ctx, x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0, r), 0, TAU);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function poly(ctx, pts, color, close = true) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (close) ctx.closePath();
    if (color) {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  /* Weiche Polygonform durch Punkte (quadratische Glättung) */
  function blob(ctx, pts, color) {
    const n = pts.length;
    ctx.beginPath();
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let m = mid(pts[n - 1], pts[0]);
    ctx.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      const mm = mid(p, q);
      ctx.quadraticCurveTo(p[0], p[1], mm[0], mm[1]);
    }
    ctx.closePath();
    if (color) {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  /* Konvexe Hülle zweier Kreise – sich verjüngendes Gliedmaßensegment */
  function taper(ctx, x1, y1, r1, x2, y2, r2, color) {
    const dx = x2 - x1, dy = y2 - y1;
    const d = Math.hypot(dx, dy);
    ctx.beginPath();
    if (d <= Math.abs(r1 - r2) + 0.01) {
      const big = r1 > r2 ? [x1, y1, r1] : [x2, y2, r2];
      ctx.arc(big[0], big[1], big[2], 0, TAU);
    } else {
      const a = Math.atan2(dy, dx);
      const phi = Math.acos(clamp((r1 - r2) / d, -1, 1));
      ctx.arc(x1, y1, r1, a + phi, a + TAU - phi, false);
      ctx.arc(x2, y2, r2, a - phi, a + phi, false);
      ctx.closePath();
    }
    if (color) {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  /* Zwei-Gelenk-IK: liefert Ellenbogen/Knie. bend = +1/-1 wählt die Beugerichtung. */
  function ik2(sx, sy, tx, ty, l1, l2, bend) {
    let dx = tx - sx, dy = ty - sy;
    let d = Math.hypot(dx, dy);
    const maxD = (l1 + l2) * 0.999;
    const minD = Math.abs(l1 - l2) + 1;
    if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
    if (d < minD) { const k = minD / (d || 1); dx *= k; dy *= k; d = minD; }
    const a = Math.atan2(dy, dx);
    const cosB = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
    const b = Math.acos(cosB) * bend;
    return {
      ex: sx + Math.cos(a - b) * l1, ey: sy + Math.sin(a - b) * l1,
      wx: sx + dx, wy: sy + dy,
    };
  }

  /* Pfad aus kubischen Bézier-Segmenten mit Bogenlängen-Parametrisierung */
  function makePath(segs, samples = 80) {
    const pts = [];
    segs.forEach((s, si) => {
      const [p0, c1, c2, p1] = s;
      for (let i = si === 0 ? 0 : 1; i <= samples; i++) {
        const t = i / samples, mt = 1 - t;
        const x = mt * mt * mt * p0[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t * t * t * p1[0];
        const y = mt * mt * mt * p0[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t * t * t * p1[1];
        pts.push([x, y]);
      }
    });
    const len = [0];
    for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = len[len.length - 1];
    function at(u) {
      const d = clamp(u) * total;
      let lo = 0, hi = len.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (len[m] < d) lo = m; else hi = m; }
      const k = (d - len[lo]) / (len[hi] - len[lo] || 1);
      const x = lerp(pts[lo][0], pts[hi][0], k), y = lerp(pts[lo][1], pts[hi][1], k);
      const ang = Math.atan2(pts[hi][1] - pts[lo][1], pts[hi][0] - pts[lo][0]);
      return { x, y, ang };
    }
    function trace(ctx, sx = 1, sy = 1, ox = 0, oy = 0, u0 = 0, u1 = 1) {
      ctx.beginPath();
      const n = pts.length;
      const i0 = Math.floor(u0 * (n - 1)), i1 = Math.ceil(u1 * (n - 1));
      for (let i = i0; i <= i1; i++) {
        const p = pts[i];
        if (i === i0) ctx.moveTo(ox + p[0] * sx, oy + p[1] * sy);
        else ctx.lineTo(ox + p[0] * sx, oy + p[1] * sy);
      }
    }
    return { pts, total, at, trace };
  }

  /* Text mit Laufweite */
  function setFont(ctx, size, weight = 700, spacing = 0) {
    ctx.font = `${weight} ${size}px ${F.config.font}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = spacing + 'px';
  }

  F.u = {
    TAU, clamp, lerp, seg, smooth, ease, kf, rng, mix, rgba, shade, hexToRgb,
    rr, fillRR, ellipse, fillEllipse, circle, poly, blob, taper, ik2, makePath, setFont,
  };
})();
