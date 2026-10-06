/* Requisiten: Routen-Geometrie, Navi-Bildschirm, Auto (seitlich/oben), Lenkrad. */
(function () {
  const F = (window.FILM = window.FILM || {});
  const { TAU, clamp, lerp, mix, shade, rgba, rr, fillRR, circle, fillEllipse, makePath, setFont, blob, poly, ease } = F.u;
  const C = F.config.colors;

  /* ------------------------------------------------------------- Routen */
  // Kartenraum 1000 × 560. Gleicher Start, gleiches Ziel.
  // Gespeicherte Route (Dupixent-Farbe): unten/rechts, deutlich länger. Neue Route (Gold): oben/links, kürzer.
  const S = [130, 455], E = [870, 112];
  const ROUTES = {
    // Gespeicherte Route (Dupixent-Farbe): lang, unten entlang und am rechten Rand hinauf
    teal: makePath([
      [S, [250, 560], [560, 555], [730, 500]],
      [[730, 500], [920, 440], [985, 360], [965, 240]],
      [[965, 240], [958, 170], [930, 118], E],
    ]),
    // Neue Route (Rinvoq-Gold): direkter und kürzer
    gold: makePath([
      [S, [270, 330], [560, 190], E],
    ]),
    S, E,
  };

  // Dezente, organische Kartenflächen (kein Raster)
  function drawMapBase(ctx, sx, sy, ox, oy, o = {}) {
    const P = (x, y) => [ox + x * sx, oy + y * sy];
    ctx.save();
    // Wasserlauf
    ctx.strokeStyle = o.water || C.mapWater;
    ctx.lineWidth = 46 * sx;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(...P(-60, 300));
    ctx.bezierCurveTo(...P(200, 330), ...P(330, 250), ...P(520, 300));
    ctx.bezierCurveTo(...P(700, 350), ...P(820, 420), ...P(1080, 380));
    ctx.stroke();
    // Parkflächen
    blob(ctx, [P(520, 380), P(610, 395), P(640, 450), P(570, 500), P(480, 470), P(470, 410)], o.park || C.mapPark);
    blob(ctx, [P(560, 40), P(690, 30), P(720, 110), P(640, 140), P(560, 120)], o.park || C.mapPark);
    blob(ctx, [P(40, 60), P(160, 50), P(190, 140), P(110, 190), P(30, 150)], o.park || C.mapPark);
    // Nebenstraßen (geschwungen, kein Raster)
    ctx.strokeStyle = o.road || '#FFFFFF';
    ctx.lineWidth = 9 * sx;
    const roads = [
      [[-40, 520], [200, 560], [300, 420], [460, 560]],
      [[260, -20], [300, 120], [240, 260], [330, 600]],
      [[700, -20], [640, 120], [920, 200], [1060, 160]],
      [[860, 600], [900, 460], [980, 300], [1060, 300]],
      [[-40, 230], [120, 230], [200, 120], [380, 60]],
    ];
    roads.forEach((r) => {
      ctx.beginPath();
      ctx.moveTo(...P(...r[0]));
      ctx.bezierCurveTo(...P(...r[1]), ...P(...r[2]), ...P(...r[3]));
      ctx.stroke();
    });
    ctx.restore();
  }

  // Eine Route zeichnen (Kartenraum-Einheiten): Kern w, weiße Kante casing, dunkle Kontur contour.
  function drawRoute(ctx, key, sx, sy, ox, oy, o) {
    const path = ROUTES[key];
    const color = key === 'teal' ? C.teal : C.gold;
    const w = o.w * sx, cas = (o.casing || 0) * sx, con = (o.contour || 0) * sx;
    ctx.save();
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (con > 0) {
      path.trace(ctx, sx, sy, ox, oy);
      ctx.strokeStyle = C.charcoal;
      ctx.lineWidth = w + 2 * (cas + con);
      ctx.stroke();
    }
    if (cas > 0) {
      path.trace(ctx, sx, sy, ox, oy);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = w + 2 * cas;
      ctx.stroke();
    }
    path.trace(ctx, sx, sy, ox, oy);
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.stroke();
    ctx.restore();
  }

  function drawStartPuck(ctx, x, y, r, ang) {
    circle(ctx, x, y + r * 0.12, r * 1.08, 'rgba(0,0,0,0.12)');
    circle(ctx, x, y, r, '#FFFFFF');
    circle(ctx, x, y, r * 0.72, C.charcoal);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang || 0);
    poly(ctx, [[r * 0.42, 0], [-r * 0.3, -r * 0.3], [-r * 0.14, 0], [-r * 0.3, r * 0.3]], '#FFFFFF');
    ctx.restore();
  }
  function drawGoalPin(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    fillEllipse(ctx, 0, 0, r * 0.7, r * 0.22, 'rgba(0,0,0,0.15)');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-r * 0.25, -r * 0.6, -r, -r * 1.1, -r, -r * 1.75);
    ctx.arc(0, -r * 1.75, r, Math.PI, 0);
    ctx.bezierCurveTo(r, -r * 1.1, r * 0.25, -r * 0.6, 0, 0);
    ctx.fillStyle = C.charcoal;
    ctx.fill();
    circle(ctx, 0, -r * 1.75, r * 0.42, '#FFFFFF');
    ctx.restore();
  }

  /* --------------------------------------------------- Navi-Bildschirm */
  // Zustand s: on, ov (Übersicht 0..1), goldVis (0..1), sel (Gold gewählt 0..1),
  // press (Bestätigen gedrückt 0..1), routesPress, confirmGold, confirmDisabled,
  // puck: {route, u}, ambient (Lichtreflex)
  const NAVI = { w: 1200, h: 680, header: 104, footer: 126, sheet: 250 };
  function confirmRect() {
    return { x: 40, y: NAVI.h - NAVI.footer + 19, w: 392, h: 88 };
  }
  function routesRect() {
    return { x: 462, y: NAVI.h - NAVI.footer + 27, w: 226, h: 72 };
  }
  // Schaltflächen im Dialog „Neue Route gefunden“ (bei voll ausgefahrenem Dialog)
  function sheetButtons() {
    const y = NAVI.h - 108;
    return {
      saved: { x: 40, y, w: 548, h: 84 },
      fresh: { x: 612, y, w: 548, h: 84 },
    };
  }
  function mapXform(sheet = 0) {
    const top = NAVI.header;
    const bottom = NAVI.h - lerp(NAVI.footer, NAVI.sheet, ease.inOutCubic(clamp(sheet)));
    const sx = 1.1, sy = ((bottom - top) / 560) * 0.96;
    return { sx, sy, ox: (NAVI.w - 1000 * sx) / 2, oy: top + 6 };
  }
  // Screen-Koordinaten eines Routenpunkts (für Fingerziele)
  function routePoint(key, u, sheet = 0) {
    const m = mapXform(sheet);
    const p = ROUTES[key].at(u);
    return [m.ox + p.x * m.sx, m.oy + p.y * m.sy];
  }

  function pill(ctx, r, fill, stroke, label, color, size, press, swatch) {
    ctx.save();
    const sc = 1 - (press || 0) * 0.035;
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
    ctx.scale(sc, sc);
    rr(ctx, -r.w / 2, -r.h / 2, r.w, r.h, r.h / 2);
    ctx.fillStyle = mix(fill, '#000000', (press || 0) * 0.16);
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
    setFont(ctx, size, 700, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    const tw = ctx.measureText(label).width;
    const off = swatch ? 22 : 0;
    ctx.fillText(label, off, 3);
    if (swatch) {
      ctx.lineCap = 'round';
      ctx.lineWidth = 10;
      ctx.strokeStyle = swatch;
      ctx.beginPath();
      ctx.moveTo(-tw / 2 + off - 46, 2);
      ctx.lineTo(-tw / 2 + off - 20, 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* Navi-Bildschirm. Zustand s:
     on (0..1), mode ('saved' | 'available'), showGold (0..1), sel (0 = gespeicherte Route gewählt, 1 = goldene),
     sheet (Dialog „Neue Route gefunden“ 0..1), pressSaved / pressNew, press (Bestätigen), btnAlpha,
     puck {route, u}, ambient */
  function drawNavi(ctx, s) {
    const W = NAVI.w, H = NAVI.h;
    const C2 = F.config.colors;
    const on = s.on != null ? s.on : 1;
    const mode = s.mode || 'saved';
    const sel = s.sel || 0, showGold = s.showGold || 0, sheet = s.sheet || 0;
    ctx.save();
    rr(ctx, 0, 0, W, H, 18);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#121416';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = on;
    ctx.fillStyle = '#E7E4DE';
    ctx.fillRect(0, 0, W, H);

    const m = mapXform(sheet);
    drawMapBase(ctx, m.sx, m.sy, m.ox, m.oy, { water: '#D6DBDE', park: '#DCDFD5', road: '#F7F6F3' });

    // Routen
    let tealO, goldO;
    if (mode === 'available') {
      tealO = { w: 14 + (1 - sel) * 5, casing: 3.5, contour: 1 + (1 - sel) * 2.6 };
      goldO = { w: 14 + sel * 5, casing: 3.5, contour: 1 + sel * 2.6 };
    } else {
      tealO = { w: 17, casing: 3.5, contour: 0 };
      goldO = { w: 13, casing: 3.5, contour: 1.2, alpha: showGold };
    }
    const drawGold = mode === 'available' || showGold > 0.001;
    if (sel > 0.5) {
      drawRoute(ctx, 'teal', m.sx, m.sy, m.ox, m.oy, tealO);
      if (drawGold) drawRoute(ctx, 'gold', m.sx, m.sy, m.ox, m.oy, goldO);
    } else {
      if (drawGold) drawRoute(ctx, 'gold', m.sx, m.sy, m.ox, m.oy, goldO);
      drawRoute(ctx, 'teal', m.sx, m.sy, m.ox, m.oy, tealO);
    }

    // Start & Ziel
    const sp = [m.ox + S[0] * m.sx, m.oy + S[1] * m.sy];
    const ep = [m.ox + E[0] * m.sx, m.oy + E[1] * m.sy];
    drawGoalPin(ctx, ep[0], ep[1] + 4, 20);
    if (s.puck) {
      const p = ROUTES[s.puck.route].at(s.puck.u);
      drawStartPuck(ctx, m.ox + p.x * m.sx, m.oy + p.y * m.sy, 25, p.ang);
    } else drawStartPuck(ctx, sp[0], sp[1], 25, -0.5);

    // Kopfzeile
    const T = F.config.texts.navi;
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.fillRect(0, 0, W, NAVI.header);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, NAVI.header, W, 2);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const hy = NAVI.header / 2 + 2;
    setFont(ctx, 46, 700, -0.3);
    ctx.fillStyle = C.charcoal;
    if (mode === 'available') {
      // Symbol: zwei Linien
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.strokeStyle = C.charcoal;
      ctx.beginPath();
      ctx.moveTo(44, hy + 18);
      ctx.bezierCurveTo(50, hy - 14, 62, hy - 18, 78, hy - 18);
      ctx.moveTo(44, hy + 18);
      ctx.bezierCurveTo(62, hy + 22, 72, hy + 12, 78, hy - 2);
      ctx.stroke();
      ctx.fillText(T.available, 100, hy);
    } else {
      poly(ctx, [[46, hy - 24], [72, hy - 24], [72, hy + 24], [59, hy + 13], [46, hy + 24]], C.charcoal);
      ctx.fillText(T.saved, 96, hy);
    }

    // Fußleiste: Bestätigen (+ reduzierte Routenübersicht im gespeicherten Zustand)
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.fillRect(0, H - NAVI.footer, W, NAVI.footer);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, H - NAVI.footer - 2, W, 2);
    if (mode === 'saved') {
      const rb = routesRect();
      ctx.save();
      rr(ctx, rb.x, rb.y, rb.w, rb.h, rb.h / 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = C.charcoal;
      ctx.stroke();
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(rb.x + 30, rb.y + 50);
      ctx.bezierCurveTo(rb.x + 36, rb.y + 24, rb.x + 50, rb.y + 22, rb.x + 66, rb.y + 22);
      ctx.moveTo(rb.x + 30, rb.y + 50);
      ctx.bezierCurveTo(rb.x + 46, rb.y + 52, rb.x + 58, rb.y + 46, rb.x + 66, rb.y + 34);
      ctx.stroke();
      setFont(ctx, 36, 700, 0);
      ctx.fillStyle = C.charcoal;
      ctx.fillText(T.routes, rb.x + 84, rb.y + rb.h / 2 + 2);
      ctx.restore();
    }
    const btnFade = s.btnAlpha != null ? s.btnAlpha : 1;
    if (btnFade > 0) {
      ctx.save();
      ctx.globalAlpha = on * btnFade;
      const cg = s.confirmGold || 0;
      pill(ctx, confirmRect(), mix(C.charcoal, C.gold, cg), null, T.confirm, mix('#FFFFFF', C.charcoal, cg), 42, s.press);
      ctx.restore();
    }

    // Dialog „Neue Route gefunden“ (fährt von unten ein)
    if (sheet > 0) {
      const e = ease.inOutCubic(clamp(sheet));
      const top = H - NAVI.sheet * e;
      ctx.save();
      ctx.translate(0, H - NAVI.sheet - top < 0 ? top - (H - NAVI.sheet) : 0);
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      ctx.fillRect(0, H - NAVI.sheet - 8, W, 8);
      rr(ctx, 0, H - NAVI.sheet, W, NAVI.sheet + 30, 22);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      setFont(ctx, 38, 700, -0.3);
      ctx.fillStyle = C.charcoal;
      ctx.fillText(T.dialogTitle, 40, H - NAVI.sheet + 58);
      setFont(ctx, 34, 400, 0);
      ctx.fillStyle = '#4A4D50';
      ctx.fillText(T.dialogQuestion, 40, H - NAVI.sheet + 104);
      const b = sheetButtons();
      pill(ctx, b.saved, C.charcoal, null, T.useSaved, '#FFFFFF', 29, s.pressSaved, C2.teal);
      pill(ctx, b.fresh, '#FFFFFF', C.charcoal, T.useNew, C.charcoal, 29, s.pressNew, C.gold);
      ctx.restore();
    }
    ctx.restore(); // clip

    // Displayrahmen & Glanz
    rr(ctx, 0, 0, W, H, 18);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.stroke();
    if (s.ambient) {
      ctx.save();
      rr(ctx, 0, 0, W, H, 18);
      ctx.clip();
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, `rgba(255,255,255,${0.07 * s.ambient})`);
      g.addColorStop(0.45, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    ctx.restore();
  }

  /* ---------------------------------------------------- Auto seitlich */
  // Lokal: nach rechts gerichtet, Boden y=0, Länge ≈ 1640.
  const CAR = {
    wheelR: 148, wheelF: 545, wheelB: -520,
    body: [
      [-820, -150], [-830, -300], [-800, -390], [-640, -560], [-560, -590], [140, -590],
      [300, -560], [520, -400], [760, -360], [830, -300], [835, -170], [800, -110], [-800, -110],
    ],
    // Türen (Fensterlinie y≈-382)
    frontDoor: [[22, -580], [270, -575], [500, -392], [540, -330], [530, -120], [22, -120]],
    rearDoor: [[-500, -580], [12, -580], [12, -120], [-440, -120], [-470, -300], [-520, -392]],
  };

  function wheel(ctx, x, rot) {
    const r = CAR.wheelR;
    circle(ctx, x, -r, r, '#1F2224');
    circle(ctx, x, -r, r * 0.62, '#8E9093');
    circle(ctx, x, -r, r * 0.52, '#6E7073');
    ctx.save();
    ctx.translate(x, -r);
    ctx.rotate(rot);
    ctx.fillStyle = '#A9ABAE';
    for (let i = 0; i < 5; i++) {
      ctx.rotate(TAU / 5);
      rr(ctx, -9, -r * 0.56, 18, r * 0.46, 8);
      ctx.fill();
    }
    ctx.restore();
    circle(ctx, x, -r, r * 0.14, '#4A4C4F');
  }

  // o: { doorOpen (0..1 vordere Tür), interior: fn(ctx) zeichnet Insasse in der Öffnung,
  //      inside: fn(ctx) Insasse hinter Fenster, wheelRot, door: 'front' }
  function drawCarSide(ctx, x, y, s, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * (o.flip ? -1 : 1), s);
    // Schatten
    fillEllipse(ctx, 0, -6, 900, 34, 'rgba(0,0,0,0.13)');
    // Karosserie
    blob(ctx, CAR.body.map((p) => p), C.carBody);
    // Untere Flanke dunkler
    ctx.save();
    blob(ctx, CAR.body);
    ctx.clip();
    ctx.fillStyle = C.carShade;
    ctx.fillRect(-900, -230, 1800, 140);
    ctx.fillStyle = rgba('#FFFFFF', 0.22);
    ctx.fillRect(-900, -420, 1800, 18);
    ctx.restore();
    // Fensterfläche
    const win = [[-600, -392], [-520, -548], [130, -556], [290, -530], [470, -392]];
    poly(ctx, win, C.glass);
    // Insassen hinter Glas
    if (o.inside) {
      ctx.save();
      poly(ctx, win);
      ctx.clip();
      o.inside(ctx);
      ctx.restore();
    }
    // Glas-Reflex
    ctx.save();
    poly(ctx, win);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    poly(ctx, [[-200, -560], [-60, -560], [-260, -380], [-400, -380]], 'rgba(255,255,255,0.10)');
    poly(ctx, [[260, -560], [320, -560], [140, -380], [80, -380]], 'rgba(255,255,255,0.07)');
    ctx.restore();
    // Säulen
    ctx.fillStyle = C.carShade;
    rr(ctx, 4, -560, 22, 172, 6);
    ctx.fill();
    rr(ctx, -530, -552, 18, 162, 6);
    ctx.fill();
    // Radkästen
    circle(ctx, CAR.wheelF, -CAR.wheelR, CAR.wheelR + 20, shade(C.carShade, -0.25));
    circle(ctx, CAR.wheelB, -CAR.wheelR, CAR.wheelR + 20, shade(C.carShade, -0.25));
    wheel(ctx, CAR.wheelF, o.wheelRot || 0);
    wheel(ctx, CAR.wheelB, o.wheelRot || 0);
    // Lichter
    fillRR(ctx, 770, -350, 60, 26, 10, '#EDEBE6');
    fillRR(ctx, -828, -372, 30, 46, 8, '#8F5C55');
    // Spiegel
    blob(ctx, [[430, -420], [492, -432], [500, -396], [440, -386]], C.carShade);

    // Hintere Tür: Fuge + Griff
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-470, -390);
    ctx.lineTo(-450, -125);
    ctx.stroke();
    fillRR(ctx, -170, -350, 84, 16, 7, C.carShade);

    // Vordere Tür
    const open = clamp(o.doorOpen || 0);
    const hingeX = 532;
    const dPts = CAR.frontDoor;
    if (open > 0) {
      // Öffnung: Innenraum
      poly(ctx, dPts, '#2B2E31');
      // Sitz (Profil): Lehne hinten, Sitzfläche nach vorn, Lenkrad angedeutet
      ctx.save();
      poly(ctx, CAR.frontDoor);
      ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(0, -600, 600, 220);
      ctx.save();
      ctx.translate(130, -250);
      ctx.rotate(-0.2);
      fillRR(ctx, -60, -300, 112, 320, 40, '#3B3F44');
      fillRR(ctx, -50, -380, 90, 80, 26, '#40454A');
      ctx.restore();
      fillRR(ctx, 70, -300, 330, 90, 36, '#3B3F44');
      ctx.lineWidth = 22;
      ctx.strokeStyle = '#1A1C1E';
      ctx.beginPath();
      ctx.ellipse(470, -400, 30, 110, -0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (o.interior) o.interior(ctx);
    }
    // Türblatt (dreht um vordere Kante; projizierte Breite schrumpft)
    const k = Math.cos(open * 1.25);
    ctx.save();
    ctx.translate(hingeX, 0);
    ctx.scale(k, 1);
    ctx.translate(-hingeX, 0);
    if (open > 0) {
      // Türinnenseite (Dicke) sichtbar
      const inner = dPts.map(([px, py]) => [px - 26 * (1 - k) / Math.max(k, 0.2), py + 6]);
      poly(ctx, inner, '#4A4E52');
    }
    poly(ctx, dPts, open > 0 ? shade(C.carBody, 0.04 * open) : C.carBody);
    ctx.save();
    poly(ctx, dPts);
    ctx.clip();
    ctx.fillStyle = C.carShade;
    ctx.fillRect(0, -230, 600, 120);
    ctx.fillStyle = rgba('#FFFFFF', 0.22);
    ctx.fillRect(0, -420, 600, 18);
    // Fenster in der Tür
    const dw = [[40, -392], [40, -556], [130, -556], [290, -530], [470, -392]];
    poly(ctx, dw, C.glass);
    if (o.inside && !o.interiorOnly) {
      ctx.save();
      poly(ctx, dw);
      ctx.clip();
      o.inside(ctx);
      ctx.restore();
    }
    poly(ctx, [[260, -560], [320, -560], [140, -380], [80, -380]], 'rgba(255,255,255,0.08)');
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 3;
    poly(ctx, dPts);
    ctx.stroke();
    // Griff
    fillRR(ctx, 70, -350, 84, 16, 7, C.carShade);
    ctx.restore();
    ctx.restore();
    return { handle: [x + (o.flip ? -1 : 1) * s * lerp(112, hingeX, 1 - k) , y - 342 * s] };
  }

  /* ------------------------------------------------------ Auto von oben */
  function drawCarTop(ctx, x, y, ang, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(s, s);
    rr(ctx, -66, -30, 136, 66, 22);
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fill();
    fillRR(ctx, -70, -34, 140, 68, 22, C.carBody);
    fillRR(ctx, -30, -27, 70, 54, 14, C.carLight);
    fillRR(ctx, 22, -26, 22, 52, 8, C.glass);
    fillRR(ctx, -52, -24, 16, 48, 6, C.glass);
    fillRR(ctx, 58, -26, 8, 12, 3, '#F4F2EC');
    fillRR(ctx, 58, 14, 8, 12, 3, '#F4F2EC');
    ctx.restore();
  }

  /* ----------------------------------------------------------- Lenkrad */
  function drawWheelFront(ctx, x, y, r, tilt) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = r * 0.16;
    ctx.strokeStyle = '#1D1F21';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * (tilt || 0.62), 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#1D1F21';
    ctx.fillRect(-r * 0.9, -r * 0.05, r * 1.8, r * 0.12);
    fillEllipse(ctx, 0, r * 0.06, r * 0.3, r * 0.22, '#26292B');
    ctx.restore();
  }

  F.props = {
    ROUTES, NAVI, drawMapBase, drawRoute, drawStartPuck, drawGoalPin,
    drawNavi, confirmRect, routesRect, sheetButtons, routePoint, mapXform,
    CAR, drawCarSide, drawCarTop, drawWheelFront,
  };
})();
