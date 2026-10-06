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
    } else if (p.mode === 'dialog') {
      // näher heran, damit der Dialogtext gut lesbar ist
      z = lerp(1.02, 1.14, ease.inOutSine(Math.min(1, lt / 1.2)));
      fy = H / 2 + 70;
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

  // ------------------------------------------------------------ Allgemein: Posen-Fahrplan
  // seq: [[Zeit, Pose|null, Überblenddauer], …]; null = Grundbild. cam: {z:[von,bis], f:[x,y] (Quellpixel)}
  function poseShot(ctx, m, lt, dur, seq, cam, d, vig = 0.55, extra) {
    const cv = cover(m);
    let i = 0;
    for (let k = 0; k < seq.length; k++) if (lt >= seq[k][0]) i = k;
    const [t0, cur, fade = 0.25] = seq[i];
    const prev = i > 0 ? seq[i - 1][1] : null;
    const a = ease.inOutSine(seg(lt, t0, t0 + fade));
    const z = lerp(cam.z[0], cam.z[1], ease.inOutSine(Math.min(1, lt / dur)));
    const fs = cam.f2 ? [lerp(cam.f[0], cam.f2[0], ease.inOutSine(Math.min(1, lt / dur))), lerp(cam.f[1], cam.f2[1], ease.inOutSine(Math.min(1, lt / dur)))] : cam.f;
    const f = fs ? [cv.ox + fs[0] * cv.s, cv.oy + fs[1] * cv.s] : [W / 2, H / 2];
    ctx.save();
    camera(ctx, z, f[0], f[1], cv, m);
    ctx.drawImage(img[m.src], cv.ox, cv.oy, m.w * cv.s, m.h * cv.s);
    if (cur) {
      if (prev && prev !== cur) layer(ctx, m.pose[prev], cv, 1);
      layer(ctx, m.pose[cur], cv, a);
    } else if (prev) {
      layer(ctx, m.pose[prev], cv, 1 - a);
    }
    if (extra) extra(ctx, cv, { cur, prev, a });
    ctx.restore();
    finish(ctx, d, vig);
  }
  const daySeq = (p, full, beat) => (p.mode === 'full' || p.mode === 'coat' || !p.mode ? full : beat);

  // Kaffeedampf (Code): weiche, aufsteigende Schwaden über der Tasse
  function steam(ctx, cv, x, y, t, amt) {
    if (amt <= 0) return;
    ctx.save();
    ctx.filter = 'blur(10px)';
    ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const ph = t * 0.55 + k * 0.33;
      const u = ph % 1;
      const bx = cv.ox + (x + (k - 1) * 70) * cv.s, by = cv.oy + y * cv.s;
      ctx.globalAlpha = amt * 0.55 * Math.sin(Math.PI * u);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 26 * cv.s * 1.4;
      ctx.beginPath();
      for (let j = 0; j <= 12; j++) {
        const v = j / 12;
        const yy = by - (u * 160 + v * 260) * cv.s;
        const xx = bx + Math.sin(v * 5 + t * 1.7 + k * 2) * 26 * cv.s * (0.4 + v);
        j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Tasse: Hand greift (Pose-Überblendung), dann heben Hand und Tasse gemeinsam ab (echte Bewegung:
  // eng maskierte Ebene „Hand + Tasse“ über der leeren Arbeitsplatte)
  function shotCup(ctx, lt, dur, p, t) {
    const m = META.cup, ml = META.cupLift;
    const cv = cover(m);
    const full = p.mode === 'full';
    const grab = full ? ease.inOutSine(seg(lt, 1.45, 1.73)) : 1;
    // Hubhöhe in Quellpixeln (negativ = nach oben)
    const lift = full
      ? kf(lt, [[2.0, 0], [2.36, -120, 'inOutCubic'], [2.46, -120], [2.8, 0, 'inOutQuad']])
      : kf(lt / dur, [[0, -110], [0.5, 0, 'inOutCubic']]);
    const cam = full ? { z: [1.0, 1.07] } : { z: [1.04, 1.06] };
    const z = lerp(cam.z[0], cam.z[1], ease.inOutSine(Math.min(1, lt / dur)));
    ctx.save();
    camera(ctx, z, cv.ox + 1150 * cv.s, cv.oy + 900 * cv.s, cv, m);
    if (grab < 1 || (full && lt < 2.0)) {
      ctx.drawImage(img[m.src], cv.ox, cv.oy, m.w * cv.s, m.h * cv.s);
      layer(ctx, m.pose.greifen, cv, grab);
      steam(ctx, cv, 820, 840, t, full ? (1 - grab) * Math.min(1, lt / 0.4) : 0);
    } else {
      ctx.drawImage(img[ml.src], cv.ox, cv.oy, ml.w * cv.s, ml.h * cv.s);
      const o = ml.pose.greifen;
      ctx.drawImage(img[o.src], cv.ox + o.x * cv.s, cv.oy + (o.y + lift) * cv.s, o.w * cv.s, o.h * cv.s);
    }
    ctx.restore();
    finish(ctx, dayOf(p), 0.6);
  }
  function shotKey(ctx, lt, dur, p, t) {
    const seq = daySeq(p,
      [[0, null], [0.45, 'greifen', 0.22], [1.0, 'leer', 0.25]],
      [[0, 'greifen'], [dur * 0.55, 'leer', Math.min(0.2, dur * 0.3)]]);
    poseShot(ctx, META.key, lt, dur, seq, { z: [1.32, 1.38], f: [1390, 930] }, dayOf(p), 0.6);
  }
  function shotBag(ctx, lt, dur, p, t) {
    poseShot(ctx, META.bag, lt, dur, [[0, null], [0.7, 'tragen', 0.18]], { z: [1.04, 1.1], f: [1500, 820] }, dayOf({ day: 1 }), 0.5);
  }
  function shotDoor(ctx, lt, dur, p, t) {
    poseShot(ctx, META.door, lt, dur, [[0, null], [1.0, 'einsteigen', 0.2]], { z: [1.12, 1.2], f: [1950, 1150] }, dayOf({ day: 1 }), 0.5);
  }
  function shotBelt(ctx, lt, dur, p, t) {
    const m = p.mode === 'coat' ? META.beltCoat : META.belt;
    const seq = daySeq(p, [[0, null], [0.7, 'zu', 0.25]], [[0, null], [dur * 0.4, 'zu', Math.min(0.2, dur * 0.3)]]);
    poseShot(ctx, m, lt, dur, seq, { z: [1.0, 1.05], f: [1376, 900] }, dayOf(p), 0.55);
  }

  // ------------------------------------------------------------ Praxis
  const day0 = () => dayOf({ day: 0 });
  function shotPractice(ctx, lt, dur) {
    poseShot(ctx, META.practice, lt, dur, [[0, null], [1.2, 'tuer', 0.4]], { z: [1.0, 1.08], f: [1500, 820] }, day0(), 0.5);
  }
  function shotGreet(ctx, lt, dur) {
    poseShot(ctx, META.greet, lt, dur, [[0, null], [1.7, 'hand', 0.25]], { z: [1.04, 1.1], f: [1250, 760] }, day0(), 0.5);
  }
  function shotHandle(ctx, lt, dur) {
    poseShot(ctx, META.handle, lt, dur, [[0, null], [0.35, 'griff', 0.14]], { z: [1.02, 1.05], f: [1700, 800] }, day0(), 0.5);
  }
  function shotCarHandle(ctx, lt, dur) {
    // Match Cut: Hand liegt exakt wie im Praxisbild; kleiner Kamerazug nach rechts = Tür wird aufgezogen
    // danach dreht sich die Hand in zwei Stufen in den waagerechten Autotürgriff
    poseShot(ctx, META.carhandle, lt, dur, [[0, null], [0.28, 'mitte', 0.12], [0.5, 'ende', 0.12]], { z: [1.05, 1.07], f: [1700, 800], f2: [1780, 790] }, day0(), 0.5);
  }
  function shotBoarding(ctx, lt, dur) {
    poseShot(ctx, META.boarding, lt, dur, [[0, null], [1.8, 'sitzt', 0.22]], { z: [1.04, 1.1], f: [1376, 900] }, day0(), 0.5);
  }

  // ------------------------------------------------------------ Losfahren
  function shotDrive(ctx, lt, dur) {
    const m = META.drive;
    const tt = Math.max(0, lt - 0.5);
    const disp = 0.5 * 150 * tt * tt; // sanftes Anfahren, kein Rennen
    const camX = disp * 0.8;
    // Kulisse: bildhoch, scrollt mit der Kamera nach links
    const bs = H / m.bg.h;
    const bw = m.bg.w * bs;
    const bx = -Math.min(camX * 0.9, bw - W);
    ctx.drawImage(img[m.bg.src], bx, 0, bw, H);
    // Auto
    const c = m.car;
    const cs = 980 / c.w;
    const cx = 470 + disp - camX, gy = 1018; // gy = Unterkante der Reifen
    const top = gy - (c.wheels[0].y + c.wheels[0].r) * cs;
    const bob = Math.sin(lt * 9) * 0.8 * Math.min(1, tt);
    // weicher Schatten
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.filter = 'blur(14px)';
    ctx.fillStyle = '#2A2C2E';
    ctx.beginPath();
    ctx.ellipse(cx + c.w * cs * 0.5, gy - 4, c.w * cs * 0.48, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(img[c.src], cx, top + bob, c.w * cs, c.h * cs);
    // Räder drehen: Felge kreisförmig ausschneiden und um die Radmitte rotieren
    const rot = disp / (c.wheels[0].r * cs);
    c.wheels.forEach((wh) => {
      const wx = cx + wh.x * cs, wy = top + wh.y * cs;
      ctx.save();
      ctx.beginPath();
      ctx.arc(wx, wy, wh.r * cs * 0.7, 0, Math.PI * 2);
      ctx.clip();
      ctx.translate(wx, wy);
      ctx.rotate(rot);
      ctx.drawImage(img[c.src], -wh.x * cs, -wh.y * cs, c.w * cs, c.h * cs);
      ctx.restore();
    });
    finish(ctx, day0(), 0.5);
  }

  // ------------------------------------------------------------ Einhängen
  const orig = {};
  ['navi', 'cabin', 'cup', 'key', 'bag', 'door', 'belt', 'practice', 'greet', 'handle', 'carhandle', 'boarding', 'drive'].forEach((k) => (orig[k] = F.scenes[k]));
  const use = (name, fn) => (ctx, lt, dur, p, t) => (F.ki.active ? fn : orig[name])(ctx, lt, dur, p, t);
  F.scenes.navi = use('navi', shotNavi);
  F.scenes.cabin = use('cabin', shotCabin);
  const opt = (name, fn, key) => (META[key] ? (F.scenes[name] = use(name, fn)) : null);
  opt('cup', shotCup, 'cup');
  opt('key', shotKey, 'key');
  opt('bag', shotBag, 'bag');
  opt('door', shotDoor, 'door');
  opt('practice', shotPractice, 'practice');
  opt('greet', shotGreet, 'greet');
  opt('handle', shotHandle, 'handle');
  opt('carhandle', shotCarHandle, 'carhandle');
  opt('boarding', shotBoarding, 'boarding');
  opt('drive', shotDrive, 'drive');
  // Draufsicht: Karte und Routen bleiben Code-Grafik, nur das Auto wird das gezeichnete Auto von oben
  if (META.carTop) {
    const origTop = F.props.drawCarTop;
    F.props.drawCarTop = (ctx, x, y, ang, sc) => {
      if (!F.ki.active) return origTop(ctx, x, y, ang, sc);
      const m = META.carTop, L = 150 * sc, k = L / m.w;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = '#000';
      ctx.filter = 'blur(4px)';
      ctx.beginPath();
      ctx.ellipse(3, 4, L * 0.5, m.h * k * 0.46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.drawImage(img[m.src], -L / 2, -m.h * k / 2, L, m.h * k);
      ctx.restore();
    };
  }
  if (META.belt && META.beltCoat) F.scenes.belt = use('belt', shotBelt);
  if (!META.cupLift) F.scenes.cup = orig.cup;
})();
