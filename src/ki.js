/* KI-Bausteine (Weg 1): gezeichnete Platten und Ebenen aus assets/ki, im Code animiert.
   Fehlen die Bilder (oder ist ?code gesetzt), bleiben die bisherigen Code-Zeichnungen aktiv. */
(function () {
  const F = (window.FILM = window.FILM || {});
  const META = window.FILM_KI;
  const W = F.config.width, H = F.config.height;
  const { ease, lerp, seg, kf } = F.u;
  const params = new URLSearchParams(location.search);
  const img = {};
  F.ki = { img, ready: Promise.resolve(), active: false };
  if (!META || params.has('code')) return;

  // ------------------------------------------------------------ Laden
  const srcs = [];
  (function collect(o) {
    for (const k in o) {
      const v = o[k];
      if (v && typeof v === 'object') collect(v);
      else if (k === 'src') srcs.push(v);
    }
  })(META);
  F.ki.ready = Promise.all(srcs.map((s) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { img[s] = im; res(); };
    im.onerror = () => { console.error('KI-Bild fehlt: ' + s); res(); };
    im.src = (window.FILM_KI_DATA && window.FILM_KI_DATA[s]) || s;
  }))).then(() => { F.ki.active = srcs.every((s) => img[s]); });

  // ------------------------------------------------------------ Hilfen
  // Platte bildfüllend (cover) zeichnen; liefert die Abbildung Quelle → Film
  function cover(m) {
    const s = Math.max(W / m.w, H / m.h);
    return { s, ox: (W - m.w * s) / 2, oy: (H - m.h * s) / 2 };
  }
  // Kamera: Zoom z auf Punkt (fx, fy); bleibt innerhalb der Platte cv
  function camera(ctx, z, fx, fy, cv, m) {
    if (cv) {
      const hw = W / 2 / z, hh = H / 2 / z;
      const x0 = cv.ox, x1 = cv.ox + m.w * cv.s, y0 = cv.oy, y1 = cv.oy + m.h * cv.s;
      fx = Math.min(Math.max(fx, x0 + hw), x1 - hw);
      fy = Math.min(Math.max(fy, y0 + hh), y1 - hh);
    }
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-fx, -fy);
  }
  function layer(ctx, o, cv, alpha) {
    if (alpha <= 0) return;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(img[o.src], cv.ox + o.x * cv.s, cv.oy + o.y * cv.s, o.w * cv.s, o.h * cv.s);
    ctx.globalAlpha = 1;
  }
  let vig = null;
  function finish(ctx, d, v = 0.5) {
    if (d && d.grade) { ctx.fillStyle = d.grade; ctx.fillRect(0, 0, W, H); }
    if (!vig) {
      vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.22)');
    }
    ctx.globalAlpha = v;
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  const dayOf = (p) => F.config.days[p.day != null ? p.day : 0];

  // ------------------------------------------------------------ Navi
  const NAVI = { w: 1200, h: 680 };
  let uiBuf = null;
  // Navi-Grafik in das Bildschirm-Trapez der Platte zerren (zeilenweise Streifen)
  function drawScreen(ctx, st, cv) {
    const q = META.navi.quad.map(([x, y]) => [cv.ox + x * cv.s, cv.oy + y * cv.s]);
    if (!uiBuf) { uiBuf = document.createElement('canvas'); uiBuf.width = NAVI.w; uiBuf.height = NAVI.h; }
    const b = uiBuf.getContext('2d');
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.clearRect(0, 0, NAVI.w, NAVI.h);
    b.fillStyle = '#16181A';
    b.fillRect(0, 0, NAVI.w, NAVI.h);
    F.props.drawNavi(b, st);
    const [tl, tr, br, bl] = q;
    const top = tl[1], bot = bl[1], n = 136;
    for (let i = 0; i < n; i++) {
      const v0 = i / n, v1 = (i + 1) / n;
      const y0 = lerp(top, bot, v0), y1 = lerp(top, bot, v1);
      const xl = lerp(tl[0], bl[0], (v0 + v1) / 2), xr = lerp(tr[0], br[0], (v0 + v1) / 2);
      ctx.drawImage(uiBuf, 0, v0 * NAVI.h, NAVI.w, NAVI.h / n + 0.5, xl, y0, xr - xl, y1 - y0 + 0.6);
    }
    // Glas: weicher Lichtschimmer von oben
    const g = ctx.createLinearGradient(tl[0], top, br[0], bot);
    g.addColorStop(0, 'rgba(255,250,240,0.10)');
    g.addColorStop(0.35, 'rgba(255,250,240,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0.06)');
    ctx.fillStyle = g;
    ctx.beginPath();
    q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    return q;
  }
  // Bildschirmpunkt (Navi-Koordinaten) → Filmkoordinaten im Trapez
  function screenPt(q, x, y) {
    const u = x / NAVI.w, v = y / NAVI.h;
    const [tl, tr, br, bl] = q;
    const xl = lerp(tl[0], bl[0], v), xr = lerp(tr[0], br[0], v);
    return [lerp(xl, xr, u), lerp(tl[1], bl[1], v)];
  }

  function shotNavi(ctx, lt, dur, p, t) {
    const d = dayOf(p);
    const { st, finger } = F.scenes._naviState(p, lt, dur);
    const cv = cover(META.navi);
    const sq = META.navi.screen;
    const scr = (x, y) => [cv.ox + (sq.x + (x / NAVI.w) * sq.w) * cv.s, cv.oy + (sq.y + (y / NAVI.h) * sq.h) * cv.s];
    ctx.save();
    let z = 1, fx = W / 2, fy = H / 2;
    if (p.mode === 'tap') {
      const cr = F.props.confirmRect();
      [fx, fy] = scr(cr.x + cr.w * 0.5, cr.y + cr.h * 0.5 - 60);
      z = 1.7;
    } else if (p.mode === 'hover') {
      z = lerp(1.0, 1.07, ease.inOutSine(lt / dur));
      fx = W / 2 - 120; fy = H / 2 + 90;
    } else if (p.mode === 'route') {
      z = lerp(1.0, 1.03, lt / dur);
    } else {
      z = lerp(1.0, 1.02, ease.inOutSine(Math.min(1, lt / Math.max(dur, 0.1))));
    }
    camera(ctx, z, fx, fy, cv, META.navi);
    // 1) Bildschirm-Grafik, 2) Platte mit ausgestanztem Bildschirm darüber
    const q = drawScreen(ctx, st, cv);
    ctx.drawImage(img[META.navi.src], cv.ox, cv.oy, META.navi.w * cv.s, META.navi.h * cv.s);
    // 3) Hand
    const hm = p.mode === 'morning' || (p.day && p.day > 0) ? META.handSweater || META.handCoat : META.handCoat;
    if (finger && finger.appear > 0 && hm) {
      const ang = -0.62;
      const dir = [Math.cos(ang), Math.sin(ang)];
      const enter = (1 - finger.appear) * 620 + (finger.exit || 0) * 680;
      const lift = finger.lift + enter;
      const tp = screenPt(q, finger.tgt[0], finger.tgt[1]);
      const tip = [tp[0] - dir[0] * lift, tp[1] - dir[1] * lift];
      // Schatten der Fingerspitze auf dem Display
      if (finger.lift < 200 && !(finger.exit > 0.6)) {
        ctx.save();
        ctx.globalAlpha = 0.22 * (1 - finger.lift / 200) * finger.appear;
        ctx.fillStyle = '#000';
        ctx.filter = 'blur(6px)';
        ctx.beginPath();
        ctx.ellipse(tp[0] - 8 - finger.lift * 0.3, tp[1] + 12 + finger.lift * 0.25, 26, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      const hs = 0.5 * (1 + Math.min(finger.lift, 200) / 1400);
      ctx.save();
      ctx.translate(tip[0], tip[1]);
      ctx.rotate(ang - hm.angle);
      ctx.scale(hs, hs);
      ctx.drawImage(img[hm.src], -hm.tip[0], -hm.tip[1]);
      ctx.restore();
    }
    ctx.restore();
    finish(ctx, d, 0.55);
  }

  // ------------------------------------------------------------ Innenraum (Frontansicht)
  // Pose-zu-Pose: Grundbild (Arzt schaut aufs Navi, Patientin nach vorn), darüber je Figur
  // Pose-Ebenen mit gemeinsamer Maske: mitte (Zwischenpose) → b (Blickkontakt).
  // pose: 0 = Grundbild, 1 = Zwischenpose, 2 = Endpose (stufenlos, je Stufe weich überblendet)
  function poses(ctx, g, cv, pose, extra) {
    if (pose <= 0) return;
    layer(ctx, g.mitte, cv, Math.min(1, pose));
    if (pose > 1) layer(ctx, g.b, cv, pose - 1);
    if (extra) layer(ctx, extra, cv, 1);
  }
  function shotCabin(ctx, lt, dur, p, t) {
    const m = META.cabin;
    const cv = cover(m);
    // Übergang über zwei Stufen; a..b = Gesamtdauer, Zwischenpose wird kurz gehalten
    const twoStep = (a, b, hold = 0.12) => {
      const h = (b - a - hold) / 2;
      return ease.inOutSine(seg(lt, a, a + h)) + ease.inOutSine(seg(lt, a + h + hold, b));
    };
    let doc, pat, blink = false, z;
    if (p.mode === 'pause') {
      doc = twoStep(0.75, 1.21, 0.14); // deutlich vom Navi aufschauen (kurze Wechsel: großer Weg des Kopfes)
      pat = twoStep(1.45, 2.25, 0.16); // Patientin wendet sich ruhig zu
      blink = lt > 2.8 && lt < 2.92;
      z = lerp(1.06, 1.13, ease.inOutSine(lt / dur));
    } else {
      doc = twoStep(0.8, 1.26, 0.14) - twoStep(2.15, 2.61, 0.14);
      pat = twoStep(0.85, 1.65, 0.16);
      z = lerp(1.08, 1.1, lt / dur);
    }
    ctx.save();
    camera(ctx, z, W / 2, H / 2 + 20, cv, m);
    ctx.drawImage(img[m.src], cv.ox, cv.oy, m.w * cv.s, m.h * cv.s);
    poses(ctx, m.pat, cv, pat);
    poses(ctx, m.doc, cv, doc, blink && doc >= 2 ? m.doc.blinzeln : null);
    ctx.restore();
    finish(ctx, dayOf({ day: 0 }), 0.6);
  }

  // ------------------------------------------------------------ Einhängen
  const orig = { navi: F.scenes.navi, cabin: F.scenes.cabin };
  const use = (name, fn) => (ctx, lt, dur, p, t) => (F.ki.active ? fn : orig[name])(ctx, lt, dur, p, t);
  F.scenes.navi = use('navi', shotNavi);
  F.scenes.cabin = use('cabin', shotCabin);
})();
