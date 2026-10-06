/* Einstellungen. Jede Funktion: (ctx, lt, dur, p, t) – lt = lokale Zeit in der Einstellung.
   Jeder Zustand wird ausschließlich aus der Zeit berechnet (keine Fortschreibung). */
(function () {
  const F = (window.FILM = window.FILM || {});
  const U = F.u;
  const { TAU, clamp, lerp, seg, ease, kf, mix, shade, rgba, rr, fillRR, circle, fillEllipse, poly, blob, taper, rng } = U;
  const C = F.config.colors;
  const P = F.config.people;
  const W = F.config.width, H = F.config.height;
  const fig = F.fig, props = F.props;

  const dayOf = (p) => F.config.days[p.day != null ? p.day : 0];
  const sleeveOf = (p) => {
    if (p.mode === 'coat' || p.day === 0) return { sleeve: P.doctor.coat, sleeveShade: P.doctor.coatShade, coatCuff: true };
    const d = dayOf(p);
    return { sleeve: d.sweater, sleeveShade: d.sweaterShade };
  };
  const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  // Handgelenk so platzieren, dass ein lokaler Ankerpunkt der Hand auf target liegt
  function handAt(ctx, target, anchor, ang, s, o) {
    const ay = o.flip ? -anchor[1] : anchor[1];
    const [dx, dy] = rot(anchor[0] * s, ay * s, ang);
    fig.drawHandCU(ctx, target[0] - dx, target[1] - dy, ang, s, o);
  }
  const TIP = [210, -22], PINCH = [152, -14], GRIP = [120, 0];

  function grade(ctx, d) {
    if (!d || !d.grade) return;
    ctx.fillStyle = d.grade;
    ctx.fillRect(0, 0, W, H);
  }
  let vig = null;
  function vignette(ctx, a = 1) {
    if (!vig) {
      vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.22)');
    }
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  function rainOn(ctx, x, y, w, h, t, amt, seed = 5) {
    if (!amt) return;
    const r = rng(seed);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const px = x + r() * w, sp = 380 + r() * 260, len = 26 + r() * 30, ph = r() * h;
      const py = y + ((ph + t * sp) % (h + len)) - len;
      ctx.lineWidth = 1.5 + r() * 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 4, py + len);
      ctx.stroke();
    }
    // stehende Tropfen
    for (let i = 0; i < 40; i++) {
      circle(ctx, x + r() * w, y + r() * h, 2 + r() * 3.5, 'rgba(255,255,255,0.35)');
    }
    ctx.restore();
  }
  function skyWindow(ctx, x, y, w, h, d, t) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, d.sky);
    g.addColorStop(1, d.sky2);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    if (d.sun) {
      const sg = ctx.createRadialGradient(x + w * 0.75, y + h * 0.3, 10, x + w * 0.75, y + h * 0.3, w * 0.6);
      sg.addColorStop(0, `rgba(255,252,240,${0.75 * d.sun})`);
      sg.addColorStop(1, 'rgba(255,252,240,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(x, y, w, h);
    }
    rainOn(ctx, x, y, w, h, t, d.rain);
  }

  /* ================================================================ Tasse */
  function drawCup(ctx, cx, by, lift, tilt, level) {
    const top = by - 280;
    ctx.save();
    ctx.translate(cx, by + lift);
    ctx.rotate(tilt);
    ctx.translate(-cx, -by);
    // Henkel
    ctx.beginPath();
    ctx.ellipse(cx + 150, top + 125, 62, 76, 0, 0, TAU);
    ctx.ellipse(cx + 150, top + 125, 30, 44, 0, 0, TAU);
    ctx.fillStyle = '#E4E1DB';
    ctx.fill('evenodd');
    // Körper
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(cx - 126, top);
      ctx.bezierCurveTo(cx - 126, top + 150, cx - 118, by - 40, cx - 96, by - 6);
      ctx.quadraticCurveTo(cx, by + 14, cx + 96, by - 6);
      ctx.bezierCurveTo(cx + 118, by - 40, cx + 126, top + 150, cx + 126, top);
      ctx.closePath();
    };
    body();
    ctx.fillStyle = '#F8F7F4';
    ctx.fill();
    ctx.save();
    body();
    ctx.clip();
    ctx.fillStyle = '#E6E3DD';
    ctx.beginPath();
    ctx.ellipse(cx + 150, top + 150, 120, 260, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(cx - 92, top + 30, 16, 200);
    ctx.restore();
    // Rand + Kaffee
    fillEllipse(ctx, cx, top, 126, 30, '#FFFFFF');
    fillEllipse(ctx, cx, top + 2, 113, 24, '#E5E1DA');
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, top + 2, 113, 24, 0, 0, TAU);
    ctx.clip();
    const off = (1 - level) * 70;
    if (level > 0.02) {
      fillEllipse(ctx, cx, top + 4 + off, 113, 24, '#4B2F1F');
      fillEllipse(ctx, cx + 8, top + 2 + off, 82, 14, '#6E4630');
      fillEllipse(ctx, cx + 16, top + 1 + off, 40, 6, 'rgba(201,160,120,0.35)');
    }
    ctx.restore();
    ctx.restore();
  }

  function drawCarafe(ctx, sx, sy, ang, fillLvl) {
    // Lokal: Ausguss bei (0,0); aufrecht erstreckt sich der Körper nach rechts unten
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ang);
    const bodyPath = () => {
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(40, -14);
      ctx.lineTo(176, -14);
      ctx.lineTo(176, 30);
      ctx.bezierCurveTo(230, 70, 240, 140, 236, 260);
      ctx.quadraticCurveTo(232, 300, 196, 300);
      ctx.lineTo(56, 300);
      ctx.quadraticCurveTo(20, 300, 16, 260);
      ctx.bezierCurveTo(12, 140, 26, 70, 46, 30);
      ctx.closePath();
    };
    // Griff
    ctx.lineWidth = 22;
    ctx.strokeStyle = '#2C2F31';
    ctx.beginPath();
    ctx.moveTo(220, 70);
    ctx.bezierCurveTo(300, 70, 310, 230, 228, 240);
    ctx.stroke();
    bodyPath();
    ctx.fillStyle = 'rgba(225,232,235,0.55)';
    ctx.fill();
    // Flüssigkeit: Oberfläche bleibt waagerecht
    ctx.save();
    bodyPath();
    ctx.clip();
    ctx.rotate(-ang);
    const lvlY = lerp(260, 40, fillLvl);
    ctx.fillStyle = '#3E2618';
    ctx.fillRect(-400, lvlY, 900, 800);
    ctx.restore();
    // Kragen
    fillRR(ctx, 34, -22, 148, 46, 10, '#2C2F31');
    // Glanz
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    rr(ctx, 40, 70, 14, 170, 7);
    ctx.fill();
    bodyPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(80,90,96,0.35)';
    ctx.stroke();
    ctx.restore();
  }

  function kitchen(ctx, d, t) {
    ctx.fillStyle = d.wall;
    ctx.fillRect(0, 0, W, H);
    // Fenster
    const wx = 120, wy = 90, ww = 640, wh = 470;
    skyWindow(ctx, wx, wy, ww, wh, d, t);
    // entfernte Silhouetten (Bäume/Häuser) – unscharf angedeutet
    ctx.fillStyle = rgba(mix(d.sky, '#5B6560', 0.35), 0.5);
    blob(ctx, [[wx, wy + wh], [wx + 40, wy + 330], [wx + 140, wy + 300], [wx + 230, wy + 360], [wx + 260, wy + wh]], null);
    ctx.fill();
    ctx.fillStyle = rgba(mix(d.sky, '#5B6560', 0.25), 0.45);
    ctx.fillRect(wx + 380, wy + 300, 160, wh - 300);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 22;
    ctx.strokeRect(wx, wy, ww, wh);
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.stroke();
    // Lichtfleck an der Wand
    if (d.sun) {
      ctx.fillStyle = `rgba(255,250,236,${0.35 * d.sun})`;
      poly(ctx, [[900, 120], [1500, 120], [1700, 600], [1100, 600]], null);
      ctx.fill();
    }
    // Arbeitsplatte
    ctx.fillStyle = '#E3DDD3';
    ctx.fillRect(0, 640, W, 160);
    ctx.fillStyle = '#D4CCC0';
    ctx.fillRect(0, 800, W, 280);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0, 800, W, 4);
    // Hintergrundobjekte
    fillRR(ctx, 1450, 470, 150, 200, 20, mix(d.wall, '#B9B0A3', 0.55));
    fillRR(ctx, 1470, 430, 110, 50, 12, mix(d.wall, '#8A8076', 0.45));
    fillEllipse(ctx, 300, 640, 120, 16, 'rgba(0,0,0,0.05)');
    fillRR(ctx, 220, 520, 150, 120, 30, mix(d.wall, '#9C9387', 0.4));
    blob(ctx, [[210, 520], [260, 380], [300, 450], [350, 360], [380, 520]], mix(d.wall, '#7D8873', 0.45));
  }

  function shotCup(ctx, lt, dur, p, t) {
    const d = dayOf(p);
    kitchen(ctx, d, t);
    const cx = 900, by = 760;
    const S = sleeveOf(p);
    let lift = 0, tilt = 0, level = 0.86, handT = null, carafe = null, stream = null;
    if (p.mode === 'full') {
      level = kf(lt, [[0, 0.25], [1.35, 0.86, 'outQuad']]);
      const out = ease.inOutCubic(seg(lt, 1.15, 1.75));
      const ang = lerp(-0.95, -0.25, ease.inOutCubic(seg(lt, 1.1, 1.5)));
      carafe = { x: cx - 30 + out * 520, y: by - 470 - out * 380, ang, fill: lerp(0.52, 0.32, seg(lt, 0, 1.3)) };
      const sTop = seg(lt, 1.08, 1.32), sBot = seg(lt, 1.2, 1.4);
      if (lt < 1.4) stream = { top: sTop, bot: sBot };
      const reach = ease.inOutCubic(seg(lt, 1.55, 2.0));
      lift = kf(lt, [[2.0, 0], [2.32, -70, 'inOutCubic'], [2.42, -70], [2.72, 0, 'inOutQuad']]);
      tilt = kf(lt, [[2.0, 0], [2.32, -0.04], [2.72, 0]]);
      const hx = cx + 150, hy = by - 280 + 125;
      handT = { x: lerp(hx + 980, hx, reach), y: lerp(hy + 420, hy, reach) + lift, a: Math.PI + lerp(0.5, 0.1, reach) };
      const back = ease.inOutCubic(seg(lt, 2.75, 3.0));
      if (back > 0) { handT.x += back * 30; }
    } else {
      // Beat: Tasse wird abgesetzt (Hand hält den Henkel)
      const u = lt / dur;
      lift = kf(u, [[0, -64], [0.5, 0, 'inOutCubic']]);
      tilt = kf(u, [[0, -0.035], [0.5, 0]]);
      const hx = cx + 150, hy = by - 280 + 125;
      handT = { x: hx + ease.inOutCubic(seg(u, 0.65, 1)) * 18, y: hy + lift, a: Math.PI + 0.1 };
    }
    fillEllipse(ctx, cx + 30, by + 4, 160 + lift * 0.4, 20, `rgba(0,0,0,${0.12 + lift * 0.0008})`);
    drawCup(ctx, cx, by, lift, tilt, level);
    if (carafe) {
      if (stream) {
        const spX = carafe.x, spY = carafe.y;
        const tgX = cx - 6, tgY = by - 280 + 8;
        const y0 = lerp(spY, tgY, stream.top), y1 = lerp(spY, tgY, 1) ;
        if (stream.top < 1) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(spX - 6, spY + 4);
          ctx.quadraticCurveTo(spX - 20, (spY + tgY) / 2, tgX - 6, tgY);
          ctx.lineTo(tgX + 6, tgY);
          ctx.quadraticCurveTo(spX - 2, (spY + tgY) / 2, spX + 8, spY + 2);
          ctx.closePath();
          ctx.clip();
          ctx.fillStyle = '#4A2D1C';
          ctx.fillRect(0, y0, W, y1 - y0 + 10);
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.fillRect(spX - 14, y0, 4, y1 - y0);
          ctx.restore();
        }
      }
      drawCarafe(ctx, carafe.x, carafe.y, carafe.ang, carafe.fill);
    }
    if (handT) handAt(ctx, [handT.x, handT.y], GRIP, handT.a, 1.25, { pose: 'grip', flip: true, ...S });
    grade(ctx, d);
    vignette(ctx, 0.7);
  }

  /* ========================================================== Schlüssel */
  function drawKeyRing(ctx, x, y, swing, kind) {
    // (x,y) = Aufhängepunkt (Ring oben)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(swing);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#B8BCC0';
    ctx.beginPath();
    ctx.arc(0, 24, 22, 0, TAU);
    ctx.stroke();
    if (kind === 'car') {
      // Metallschlüssel
      ctx.save();
      ctx.translate(-8, 44);
      ctx.rotate(0.38);
      fillRR(ctx, -14, 0, 28, 34, 8, '#C9CCCF');
      poly(ctx, [[-6, 30], [6, 30], [6, 112], [2, 120], [-6, 112], [-6, 96], [-12, 92], [-6, 84], [-12, 76], [-6, 70]], '#C9CCCF');
      ctx.restore();
      // Fernbedienung
      ctx.save();
      ctx.translate(8, 44);
      ctx.rotate(-0.08);
      fillRR(ctx, -34, 0, 68, 116, 26, '#2A2D30');
      fillRR(ctx, -34, 0, 68, 18, 9, '#3A3E42');
      circle(ctx, 0, 46, 11, '#44484C');
      circle(ctx, 0, 80, 11, '#44484C');
      ctx.restore();
    } else if (kind === 'house') {
      ctx.save();
      ctx.translate(2, 44);
      ctx.rotate(-0.12);
      circle(ctx, 0, 14, 18, '#B49A6A');
      circle(ctx, 0, 14, 6, '#8E7A54');
      poly(ctx, [[-5, 28], [5, 28], [5, 104], [-5, 96], [-5, 86], [-11, 82], [-5, 76]], '#B49A6A');
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(0, 44);
      fillRR(ctx, -24, 0, 48, 70, 10, '#C2B8A6');
      circle(ctx, 0, 12, 6, '#8E8576');
      ctx.restore();
    }
    ctx.restore();
  }

  function shotKey(ctx, lt, dur, p, t) {
    const d = dayOf(p);
    ctx.fillStyle = d.wall;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(1.5, 1.5);
    ctx.translate(-930, -540);
    if (d.sun) {
      ctx.fillStyle = `rgba(255,250,236,${0.3 * d.sun})`;
      poly(ctx, [[-400, 140], [700, 60], [1000, 1300], [-400, 1300]], null);
      ctx.fill();
    }
    if (d.rain || !d.sun) {
      // weiches, diffuses Licht
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, rgba(d.sky2, 0.35));
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    // Schatten + Leiste
    fillRR(ctx, 560, 352, 800, 120, 16, 'rgba(0,0,0,0.08)');
    fillRR(ctx, 560, 330, 800, 120, 16, '#C8A77F');
    const r = rng(9);
    ctx.strokeStyle = 'rgba(120,86,50,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const yy = 345 + r() * 90;
      ctx.beginPath();
      ctx.moveTo(575, yy);
      ctx.bezierCurveTo(800, yy + (r() - 0.5) * 16, 1100, yy + (r() - 0.5) * 16, 1345, yy + (r() - 0.5) * 8);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(576, 334, 768, 5);
    // Haken
    const hooks = [680, 860, 1040, 1220];
    hooks.forEach((hx) => {
      circle(ctx, hx, 408, 12, '#7E8286');
      ctx.strokeStyle = '#8E9296';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx, 408);
      ctx.lineTo(hx, 462);
      ctx.quadraticCurveTo(hx, 478, hx + 14, 472);
      ctx.stroke();
    });

    const S = sleeveOf(p);
    // Bewegung
    let grab, liftP;
    if (p.mode === 'full') {
      grab = ease.inOutCubic(seg(lt, 0.0, 0.6));
      liftP = ease.inOutCubic(seg(lt, 0.72, 1.4));
    } else {
      const u = lt / dur;
      grab = 1;
      liftP = ease.inOutCubic(seg(u, 0.08, 0.8));
    }
    const sway = (k) => Math.sin(lt * 7 + k) * 0.06 * Math.exp(-Math.max(0, lt - (p.mode === 'full' ? 0.75 : 0.1)) * 2.5) * (liftP > 0 ? 1 : 0);
    drawKeyRing(ctx, 680, 466, sway(0), 'house');
    drawKeyRing(ctx, 1220, 466, sway(2), 'tag');
    const rest = [860, 466];
    const fob = [rest[0] + 8, rest[1] + 44 + 58];
    const liftOff = [liftP * 260, -liftP * 520];
    const pinch = [fob[0] + liftOff[0], fob[1] + liftOff[1]];
    drawKeyRing(ctx, rest[0] + liftOff[0], rest[1] + liftOff[1] - liftP * 6, -liftP * 0.12, 'car');
    const handA = -2.15 + liftP * 0.15;
    const appr = [lerp(pinch[0] + 520, pinch[0], grab), lerp(pinch[1] + 520, pinch[1], grab)];
    if (liftP < 1 || p.mode !== 'full') handAt(ctx, appr, PINCH, handA, 0.95, { pose: 'pinch', ...S });
    ctx.restore();
    grade(ctx, d);
    vignette(ctx, 0.7);
  }

  /* =============================================================== Tasche */
  function drawBag(ctx, x, y, a, s = 0.75) {
    // (x,y) = Griffpunkt oben
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.scale(s, s);
    ctx.lineWidth = 16;
    ctx.strokeStyle = '#6E523C';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-60, 70);
    ctx.quadraticCurveTo(0, -30, 60, 70);
    ctx.stroke();
    fillRR(ctx, -170, 60, 340, 230, 26, '#8B6A4E');
    fillRR(ctx, -170, 60, 340, 120, 26, '#7A5B42');
    fillRR(ctx, -28, 160, 56, 24, 6, '#B9A27E');
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    rr(ctx, -156, 74, 312, 202, 18);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function shotBag(ctx, lt, dur, p, t) {
    const d = dayOf({ day: 1 });
    ctx.fillStyle = d.wall;
    ctx.fillRect(0, 0, W, H);
    // Wandgliederung: Türrahmen rechts, Garderobe links
    ctx.fillStyle = mix(d.wall, '#FFFFFF', 0.5);
    ctx.fillRect(1600, 0, 320, H);
    ctx.fillStyle = mix(d.wall, '#C9BFB2', 0.4);
    ctx.fillRect(1580, 0, 22, H);
    fillRR(ctx, 90, 230, 420, 28, 8, '#C8A77F');
    [150, 260, 370, 480].forEach((x) => circle(ctx, x, 244, 8, '#7E8286'));
    const coatC = mix(d.wall, '#8E857B', 0.55);
    poly(ctx, [[262, 244], [228, 290], [190, 300], [180, 640], [350, 640], [340, 300], [300, 290]], coatC);
    ctx.strokeStyle = rgba('#000000', 0.08);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(265, 290);
    ctx.lineTo(265, 640);
    ctx.moveTo(196, 320);
    ctx.lineTo(200, 600);
    ctx.moveTo(334, 320);
    ctx.lineTo(330, 600);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,248,232,0.3)';
    poly(ctx, [[760, 0], [1160, 0], [1460, 1080], [960, 1080]], null);
    ctx.fill();
    // Sideboard (Hüfthöhe)
    fillRR(ctx, 900, 760, 640, 36, 8, '#C8A77F');
    ctx.fillStyle = '#B8966D';
    ctx.fillRect(920, 796, 600, 300);
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fillRect(920, 796, 600, 14);
    fillRR(ctx, 1380, 650, 90, 110, 12, mix(d.wall, '#9C9387', 0.45));

    const s = 0.98, fx = 700, fy = 1290;
    const reach = ease.inOutCubic(seg(lt, 0.05, 0.62));
    const liftP = ease.inOutCubic(seg(lt, 0.72, 1.2));
    const settle = ease.inOutCubic(seg(lt, 1.15, 1.75));
    const lean = 0.11 * reach * (1 - liftP) + 0.04 * liftP * (1 - settle);
    const hipX = 26 * reach * (1 - settle);
    // Griffpunkt der Tasche
    const rest = [1060, 760 - 217];
    const idleHand = [fx + 40 * s, fy - 455 * s];
    let grip;
    if (liftP <= 0) grip = rest;
    else grip = [lerp(rest[0], lerp(1000, idleHand[0] + 30, settle), liftP), lerp(rest[1], lerp(rest[1] - 25, idleHand[1] + 18, settle), liftP)];
    const hand = liftP > 0 ? grip : [lerp(idleHand[0], rest[0], reach), lerp(idleHand[1], rest[1], reach) - Math.sin(reach * Math.PI) * 40];
    const swing = liftP > 0 ? Math.sin((lt - 0.72) * 7) * 0.16 * Math.exp(-Math.max(0, lt - 0.72) * 2.4) : 0;
    const L = (wx, wy) => [(wx - fx) / s, (wy - fy) / s];
    const hl = L(hand[0] - 6, hand[1] - 16);
    const restBag = liftP <= 0;
    if (restBag) drawBag(ctx, rest[0], rest[1], 0);
    fig.drawPersonSide(ctx, fx, fy, s, 'doctor', {
      facing: 1, day: 1, outfit: 'sweater', lean, hipX,
      headYaw: 1.05, headPitch: 0.35 * reach * (1 - settle) + 0.05, smile: 0.15,
      feet: { near: [70, 0], far: [-40, 0] },
      nearHand: [hl[0], hl[1], 1, 0.5], nearGrip: reach > 0.9,
      beforeNearArm: restBag ? null : () => drawBag(ctx, grip[0], grip[1] + 4, swing),
    });
    grade(ctx, d);
    vignette(ctx, 0.7);
  }

  /* ============================================================ Autotür */
  function street(ctx, d, ox = 0) {
    const g = ctx.createLinearGradient(0, 0, 0, 600);
    g.addColorStop(0, d.sky);
    g.addColorStop(1, d.sky2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Hauswand + Hecke
    ctx.fillStyle = '#E3DDD4';
    ctx.fillRect(-200 + ox * 0.3, 120, 1300, 700);
    ctx.fillStyle = '#D5CEC3';
    ctx.fillRect(-200 + ox * 0.3, 120, 1300, 26);
    fillRR(ctx, 200 + ox * 0.3, 260, 260, 300, 6, '#C9CED0');
    fillRR(ctx, 620 + ox * 0.3, 260, 260, 300, 6, '#C9CED0');
    blob(ctx, [[-100 + ox * 0.5, 820], [200 + ox * 0.5, 610], [700 + ox * 0.5, 640], [1300 + ox * 0.5, 600], [2100 + ox * 0.5, 650], [2100, 820]], '#8E9A80');
    ctx.fillStyle = '#C9C5BE';
    ctx.fillRect(0, 780, W, 300);
    ctx.fillStyle = '#BDB8B0';
    ctx.fillRect(0, 780, W, 12);
  }

  function shotDoor(ctx, lt, dur, p, t) {
    const d = dayOf({ day: 1 });
    street(ctx, d);
    const cs = 1.1, cx = 1210, gy = 860;
    const open = kf(lt, [[0.35, 0], [1.0, 1, 'inOutCubic'], [1.55, 1], [2.15, 0, 'inQuad']]);
    const enter = ease.inOutCubic(seg(lt, 0.95, 1.6));
    const base = ctx.getTransform();
    const ds = 0.78;
    // Arzt: steht rechts der Tür, greift den Griff, steigt ein
    const doc = (inside) => {
      const fx = kf(lt, [[0.3, 1215], [0.85, 1085, 'inOutCubic'], [1.6, 990, 'inOutCubic']]), fy = lerp(gy + 60, gy + 20, enter);
      const hipH = lerp(520, 300, ease.inOutQuad(seg(lt, 1.15, 1.6)));
      const handleW = [cx - 112 * cs, gy - 342 * cs];
      const doorEdge = cx - cs * lerp(112, 532 - 510 * Math.cos(1.25), open);
      const L = (wx, wy) => [-(wx - fx) / ds, (wy - fy) / ds];
      const rel = ease.inOutCubic(seg(lt, 0.8, 1.05));
      const hv0 = L(lerp(handleW[0] + 140, doorEdge, ease.inOutCubic(seg(lt, 0, 0.35))), handleW[1]);
      const hv = lt < 1.05 ? [lerp(hv0[0], 30, rel), lerp(hv0[1], -470, rel)] : null;
      fig.drawPersonSide(ctx, fx, fy, ds * (1 - enter * 0.04), 'doctor', {
        facing: -1, day: 1, outfit: 'sweater', hipH,
        lean: lerp(0.04, 0.2, enter), headYaw: 1.1, headPitch: 0.1,
        feet: enter > 0.3 ? { near: [140, -40 * enter], far: [80, -30 * enter] }
          : (lt > 0.3 && lt < 0.9 ? (() => { const w = walkFeet((1215 - fx) / ds / 110, 60, 26); return { near: w.near, far: w.far }; })() : { near: [30, 0], far: [-40, 0] }),
        nearHand: hv ? [hv[0], hv[1], 1] : null, nearGrip: lt < 0.85,
      });
    };
    props.drawCarSide(ctx, cx, gy, cs, {
      flip: true, doorOpen: open,
      interior: (c) => { if (enter > 0.35) { c.save(); c.setTransform(base); doc(true); c.restore(); } },
      inside: (c) => {
        if (enter >= 1 || (lt > 1.6)) {
          c.save(); c.setTransform(base);
          fig.drawHead(c, 975, gy + 20 - (300 + 432) * 0.749, 0.749, 'doctor', { yaw: -1.1, pitch: 0.05 });
          c.restore();
        }
      },
    });
    if (enter <= 0.35) doc(false);
    grade(ctx, d);
    vignette(ctx, 0.6);
  }

  /* ================================================================ Gurt */
  function shotBelt(ctx, lt, dur, p, t) {
    const d = dayOf(p);
    const coat = p.mode === 'coat';
    ctx.fillStyle = '#1F2225';
    ctx.fillRect(0, 0, W, H);
    // Seitenfenster hinter dem Fahrer
    ctx.save();
    poly(ctx, [[140, 0], [1260, 0], [1200, 210], [140, 280]], null);
    ctx.clip();
    skyWindow(ctx, 140, 0, 1120, 300, d, t);
    ctx.fillStyle = rgba(mix(d.sky, '#56605A', 0.5), 0.45);
    ctx.fillRect(140, 170, 1120, 140);
    ctx.restore();
    ctx.fillStyle = '#2B2E31';
    ctx.fillRect(0, 0, 150, H);
    // Sitzlehne
    fillRR(ctx, 90, 120, 440, 1100, 100, '#30343A');
    fillRR(ctx, 440, 190, 80, 1000, 40, '#383C42');
    // Torso (Blick nach rechts), Pullover bzw. Kittel
    const top = coat ? P.doctor.coat : d.sweater;
    const topSh = coat ? P.doctor.coatShade : d.sweaterShade;
    const torso = [[250, -40], [760, -40], [930, 160], [990, 420], [960, 700], [880, 770], [330, 790], [270, 400]];
    blob(ctx, torso, mix(top, topSh, 0.35));
    ctx.save();
    blob(ctx, torso);
    ctx.clip();
    ctx.fillStyle = rgba('#000000', 0.07);
    ctx.fillRect(250, -40, 190, 900);
    if (coat) {
      poly(ctx, [[720, -40], [880, 90], [800, 470], [700, 300]], P.doctor.shirt);
      poly(ctx, [[700, -40], [770, -40], [720, 520], [640, 330]], P.doctor.coatShade);
      fillRR(ctx, 520, 330, 104, 48, 6, '#FFFFFF');
      ctx.fillStyle = '#9A9C9E';
      ctx.fillRect(536, 345, 60, 6);
      ctx.fillRect(536, 359, 38, 5);
    } else {
      // Bündchen
      ctx.strokeStyle = rgba('#000000', 0.12);
      ctx.lineWidth = 3;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.moveTo(300 + i * 70, 700);
        ctx.lineTo(296 + i * 70, 790);
        ctx.stroke();
      }
      ctx.fillStyle = rgba('#000000', 0.08);
      ctx.fillRect(250, 696, 800, 6);
    }
    ctx.restore();
    // Schoß
    blob(ctx, [[300, 760], [940, 730], [1560, 790], [1600, 1120], [300, 1120]], P.doctor.pants);
    ctx.fillStyle = rgba('#FFFFFF', 0.05);
    blob(ctx, [[600, 760], [1500, 790], [1500, 830], [600, 800]], null);
    ctx.fill();
    // Mittelkonsole
    poly(ctx, [[1230, 700], [1640, 660], [1900, 1120], [1260, 1120]], '#25282B');
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    poly(ctx, [[1230, 700], [1640, 660], [1650, 676], [1240, 716]], null);
    ctx.fill();

    const bx = 1330, by = 790, ba = 0.55;
    const ax = Math.cos(ba), ay = Math.sin(ba);
    const k = p.mode === 'full' || p.mode === 'coat' ? 1 : 0;
    let tip, ins, release;
    if (k) {
      tip = ease.inOutCubic(seg(lt, 0.0, 0.88));
      ins = ease.outBack(seg(lt, 0.9, 1.06));
      release = ease.inOutCubic(seg(lt, 1.12, 1.55));
    } else {
      const u = lt / dur;
      tip = lerp(0.7, 1, ease.inOutCubic(seg(u, 0, 0.42)));
      ins = ease.outBack(seg(u, 0.42, 0.58));
      release = ease.inOutCubic(seg(u, 0.68, 1));
    }
    const slot = [bx - ax * 92, by - ay * 92];
    const start = [880, 330];
    const tp = [lerp(start[0], slot[0], tip) + ax * ins * 50, lerp(start[1], slot[1], tip) + ay * ins * 50];
    const tAng = lerp(0.85, ba, tip);
    const plate = [tp[0] - Math.cos(tAng) * 64, tp[1] - Math.sin(tAng) * 64];
    const strap = (x1, y1, x2, y2) => {
      const nx = -(y2 - y1), ny = x2 - x1, nl = Math.hypot(nx, ny);
      ctx.lineCap = 'butt';
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 64;
      ctx.beginPath();
      ctx.moveTo(x1 + 8, y1 + 10);
      ctx.lineTo(x2 + 8, y2 + 10);
      ctx.stroke();
      ctx.strokeStyle = '#3B3F44';
      ctx.lineWidth = 60;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = rgba('#FFFFFF', 0.08);
      ctx.lineWidth = 2;
      for (const o of [-22, -8, 8, 22]) {
        ctx.beginPath();
        ctx.moveTo(x1 + (nx / nl) * o, y1 + (ny / nl) * o);
        ctx.lineTo(x2 + (nx / nl) * o, y2 + (ny / nl) * o);
        ctx.stroke();
      }
    };
    strap(330, -60, plate[0], plate[1]);
    strap(380, 1010, plate[0], plate[1]);
    // Zunge
    ctx.save();
    ctx.translate(tp[0], tp[1]);
    ctx.rotate(tAng);
    fillRR(ctx, -104, -42, 66, 84, 16, '#2A2D30');
    fillRR(ctx, -46, -25, 76, 50, 7, '#C6CACE');
    fillRR(ctx, -12, -8, 30, 16, 4, '#8E9397');
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(-42, -22, 66, 5);
    ctx.restore();
    // Gurtschloss
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(ba);
    fillRR(ctx, -92, -50, 190, 100, 20, '#1B1D1F');
    fillRR(ctx, -86, -42, 56, 84, 12, '#2D3134');
    fillRR(ctx, -72, -15, 28, 30, 7, '#84898D');
    fillRR(ctx, 92, -28, 220, 56, 16, '#1B1D1F');
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(-80, -46, 170, 4);
    ctx.restore();
    // Hand (von oben, steiler als das Gurtband – klar getrennt)
    const S = coat ? { sleeve: P.doctor.coat, sleeveShade: P.doctor.coatShade, coatCuff: true } : sleeveOf(p);
    const hAng = 1.2 - release * 0.15;
    const hp = [plate[0] - release * 70, plate[1] - release * 120];
    // weicher Schatten des Arms auf dem Körper
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.translate(18, 22);
    ctx.filter = 'blur(10px)';
    handAt(ctx, hp, PINCH, hAng, 1.3, { pose: 'pinch', silhouette: '#000000' });
    ctx.restore();
    handAt(ctx, hp, PINCH, hAng, 1.3, { pose: 'pinch', ...S });
    grade(ctx, d);
    vignette(ctx, 0.5);
  }

  /* ================================================================ Navi */
  const NX = 360, NY = 150;
  function dashboard(ctx, d, t) {
    // Windschutzscheibe oben
    ctx.save();
    ctx.beginPath();
    ctx.rect(-400, -400, W + 800, 540);
    ctx.clip();
    skyWindow(ctx, -400, -400, W + 800, 540, d, t);
    ctx.restore();
    const g = ctx.createLinearGradient(0, 80, 0, H);
    g.addColorStop(0, '#34383B');
    g.addColorStop(0.25, '#2A2D30');
    g.addColorStop(1, '#1E2023');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-400, 140);
    ctx.quadraticCurveTo(W / 2, 70, W + 400, 140);
    ctx.lineTo(W + 400, H + 400);
    ctx.lineTo(-400, H + 400);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-400, 141);
    ctx.quadraticCurveTo(W / 2, 71, W + 400, 141);
    ctx.stroke();
    // Lüftung
    [[560, 905], [1020, 905]].forEach(([x, y]) => {
      fillRR(ctx, x, y, 340, 86, 20, '#17191B');
      ctx.strokeStyle = '#2D3134';
      ctx.lineWidth = 6;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 18, y + i * 21.5);
        ctx.lineTo(x + 322, y + i * 21.5);
        ctx.stroke();
      }
    });
    // Rahmen
    fillRR(ctx, NX - 22, NY - 22, props.NAVI.w + 44, props.NAVI.h + 44, 30, '#0E1011');
  }

  // Zustand des Bildschirms + Fingerposition je Modus
  function naviState(p, lt, dur) {
    const cr = props.confirmRect();
    const cC = [cr.x + cr.w * 0.38, cr.y + cr.h * 0.5];
    const st = { on: 1, ambient: 1, title: 'saved', goldVis: 0 };
    let finger = null; // {tgt:[x,y] (Screen), lift: px, appear 0..1}
    const m = p.mode;
    if (m === 'morning') {
      // Erste Fahrt: nur die gespeicherte (lange) Route
      st.on = kf(lt, [[0, 0.4], [0.35, 1, 'outCubic']]);
      const app = ease.outCubic(seg(lt, 1.35, 2.15));
      const lift = kf(lt, [[2.15, 70], [2.42, 0, 'inOutQuad'], [2.56, 0], [2.95, 90, 'inOutCubic']]);
      st.press = lt > 2.42 && lt < 2.62 ? 1 : 0;
      st.btnAlpha = 1 - ease.inOutCubic(seg(lt, 2.75, 3.2));
      st.puck = { route: 'teal', u: ease.inOutSine(seg(lt, 2.8, 3.6)) * 0.035 };
      finger = { tgt: cC, lift, appear: app, exit: ease.inOutCubic(seg(lt, 2.95, 3.5)) };
    } else if (m === 'route') {
      st.on = ease.outCubic(seg(lt, 0, Math.min(0.3, dur * 0.4)));
    } else if (m === 'tap') {
      const t0 = dur * 0.42;
      st.press = lt > t0 && lt < t0 + 0.14 ? 1 : 0;
      finger = { tgt: cC, lift: kf(lt, [[0, 60], [t0, 0, 'inOutQuad'], [t0 + 0.12, 0], [dur, 50, 'inOutCubic']]), appear: 1 };
    } else if (m === 'dialog') {
      // Tag 4: Das Navi findet eine neue, kürzere Route – die Hand wählt routiniert die gespeicherte
      const tTap = 2.3;
      st.on = ease.outCubic(seg(lt, 0, 0.25));
      st.goldVis = ease.inOutCubic(seg(lt, 0.3, 0.75)) * (1 - ease.inOutCubic(seg(lt, tTap + 0.25, tTap + 0.65)));
      st.dialog = ease.inOutCubic(seg(lt, 0.35, 0.8)) * (1 - ease.inOutCubic(seg(lt, tTap + 0.2, tTap + 0.6)));
      st.dialogPress = lt > tTap && lt < tTap + 0.16 ? 1 : 0;
      st.puck = { route: 'teal', u: ease.inOutSine(seg(lt, tTap + 0.5, dur)) * 0.03 };
      const R = props.dialogRects();
      const tgt = [R.saved.x + R.saved.w * 0.42, R.saved.y + R.saved.h * 0.5];
      const lift = kf(lt, [[1.25, 160], [1.9, 70, 'outCubic'], [tTap, 0, 'inOutQuad'], [tTap + 0.15, 0], [tTap + 0.55, 110, 'inOutCubic']]);
      finger = { tgt, lift, appear: ease.outCubic(seg(lt, 1.2, 1.8)), exit: ease.inOutCubic(seg(lt, tTap + 0.35, dur - 0.05)) };
    } else if (m === 'approach') {
      // Mit Patientin: „Verfügbare Routen“, beide sichtbar, die gespeicherte ist vorausgewählt
      st.title = 'available';
      st.goldVis = 1;
      st.on = kf(lt, [[0, 0.3], [0.4, 1, 'outCubic']]);
      const app = ease.inOutCubic(seg(lt, 0.7, 2.0));
      finger = { tgt: cC, lift: lerp(220, 80, app), appear: ease.outCubic(seg(lt, 0.6, 1.3)) };
    } else if (m === 'hover') {
      st.title = 'available';
      st.goldVis = 1;
      const lift = kf(lt, [[0, 64], [0.8, 58], [1.9, 120, 'inOutSine'], [3, 124, 'inOutSine']]);
      finger = { tgt: cC, lift, appear: 1 };
    } else if (m === 'overview') {
      // Innehalten: Die Hand zieht sich zurück, beide Routen werden gleichwertig betrachtet
      st.title = 'available';
      st.goldVis = 1;
      st.eq = ease.inOutCubic(seg(lt, 0.9, 1.9));
      st.confirmDisabled = st.eq;
      const lift = kf(lt, [[0, 124], [1.2, 260, 'inOutCubic']]);
      finger = { tgt: cC, lift, appear: 1, exit: ease.inOutCubic(seg(lt, 0.6, 1.8)) };
    } else if (m === 'select') {
      st.title = 'available';
      st.goldVis = 1;
      st.eq = 1;
      const tealP = props.routePoint('teal', 0.42), goldP = props.routePoint('gold', 0.48);
      const tealP2 = props.routePoint('teal', 0.56);
      const tSel = 2.25, tConf = 3.85;
      st.sel = ease.inOutCubic(seg(lt, tSel + 0.05, tSel + 0.65));
      st.confirmDisabled = 1 - st.sel;
      st.confirmGold = st.sel;
      st.press = lt > tConf && lt < tConf + 0.16 ? 1 : 0;
      st.puck = { route: 'gold', u: ease.inOutSine(seg(lt, 4.4, 5.6)) * 0.06 };
      // Finger: prüfend über Teal, dann zu Gold, Auswahl, dann Bestätigen
      const path = [
        [0.0, [tealP[0] - 80, tealP[1] + 160]],
        [0.7, tealP],
        [1.3, tealP2, 'inOutSine'],
        [1.95, goldP, 'inOutCubic'],
        [2.9, goldP],
        [3.6, cC, 'inOutCubic'],
      ];
      const pos = kf(lt, path.map(([a, b, e]) => [a, b, e]));
      const lift = kf(lt, [[0, 200], [0.7, 90, 'outCubic'], [1.95, 80], [tSel, 0, 'inOutQuad'], [tSel + 0.16, 0], [2.7, 80, 'inOutCubic'], [3.55, 70], [tConf, 0, 'inOutQuad'], [tConf + 0.16, 0], [4.6, 120, 'inOutCubic']]);
      finger = { tgt: pos, lift, appear: ease.outCubic(seg(lt, 0, 0.6)), exit: ease.inOutCubic(seg(lt, 4.6, 5.4)) };
    }
    return { st, finger };
  }

  function shotNavi(ctx, lt, dur, p, t) {
    const d = dayOf(p);
    const { st, finger } = naviState(p, lt, dur);
    ctx.save();
    // Kamera
    let z = 1, fx = W / 2, fy = H / 2;
    if (p.mode === 'tap') {
      const cr = props.confirmRect();
      z = 1.85;
      fx = NX + cr.x + cr.w * 0.5;
      fy = NY + cr.y + cr.h * 0.5 - 60;
    } else if (p.mode === 'hover') {
      z = lerp(1.0, 1.06, ease.inOutSine(lt / dur));
      fx = W / 2 - 160;
      fy = H / 2 + 120;
    } else if (p.mode === 'route') {
      z = lerp(1.0, 1.025, lt / dur);
    }
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-fx, -fy);
    dashboard(ctx, d, t);
    ctx.save();
    ctx.translate(NX, NY);
    props.drawNavi(ctx, st);
    ctx.restore();
    if (finger && finger.appear > 0) {
      const ang = -0.62;
      const dir = [Math.cos(ang), Math.sin(ang)];
      const enter = (1 - finger.appear) * 520 + (finger.exit || 0) * 560;
      const lift = finger.lift + enter;
      const tgt = [NX + finger.tgt[0] - dir[0] * lift, NY + finger.tgt[1] - dir[1] * lift];
      const sc = 1.18 * (1 + Math.min(finger.lift, 200) / 1500);
      // weicher Schatten des Fingers auf dem Display
      if (finger.lift < 200 && !(finger.exit > 0.6)) {
        ctx.save();
        ctx.globalAlpha = 0.18 * (1 - finger.lift / 200) * finger.appear;
        fillEllipse(ctx, NX + finger.tgt[0] - 10 - finger.lift * 0.3, NY + finger.tgt[1] + 14 + finger.lift * 0.25, 30, 18, '#000000');
        ctx.restore();
      }
      handAt(ctx, tgt, TIP, ang, sc, { pose: 'point', ...sleeveOf(p) });
    }
    ctx.restore();
    grade(ctx, d);
    vignette(ctx, 0.55);
  }

  /* ============================================== Innenraum Frontansicht */
  function cabin(ctx, d, t, drawPeople) {
    // Heckscheibe + Innenraum
    ctx.fillStyle = '#1D2023';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    rr(ctx, 360, 150, 1200, 330, 60);
    ctx.clip();
    skyWindow(ctx, 360, 150, 1200, 330, d, t);
    ctx.fillStyle = rgba(mix(d.sky, '#6E7A70', 0.5), 0.55);
    blob(ctx, [[360, 480], [420, 360], [620, 330], [800, 380], [1000, 330], [1250, 350], [1560, 330], [1560, 480]], null);
    ctx.fill();
    ctx.restore();
    // Rückbank
    fillRR(ctx, 300, 420, 1320, 300, 60, '#2A2E32');
    // Kopfstützen + Lehnen
    const seat = (x) => {
      fillRR(ctx, x - 230, 470, 460, 600, 80, '#30353A');
      fillRR(ctx, x - 110, 300, 220, 170, 50, '#353A3F');
      ctx.fillStyle = '#26292D';
      ctx.fillRect(x - 40, 462, 18, 30);
      ctx.fillRect(x + 22, 462, 18, 30);
    };
    seat(560);
    seat(1360);
    drawPeople();
  }
  function cabinFront(ctx, d) {
    // Armaturenbrett
    ctx.fillStyle = '#25282B';
    ctx.beginPath();
    ctx.moveTo(0, 880);
    ctx.bezierCurveTo(500, 850, 1420, 850, W, 880);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 880);
    ctx.bezierCurveTo(500, 850, 1420, 850, W, 880);
    ctx.stroke();
    // Display-Rückseite
    fillRR(ctx, 790, 770, 340, 118, 14, '#141618');
    fillRR(ctx, 800, 780, 320, 8, 4, 'rgba(255,255,255,0.10)');
    // A-Säulen + Dachkante
    poly(ctx, [[0, 0], [250, 0], [70, H], [0, H]], '#16181A');
    poly(ctx, [[W, 0], [W - 250, 0], [W - 70, H], [W, H]], '#16181A');
    ctx.fillStyle = '#16181A';
    ctx.fillRect(0, 0, W, 70);
    // Glas
    const g = ctx.createLinearGradient(300, 0, 1500, 1080);
    g.addColorStop(0, 'rgba(255,255,255,0.0)');
    g.addColorStop(0.42, 'rgba(255,255,255,0.0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function shotCabin(ctx, lt, dur, p, t) {
    const d = dayOf({ day: 0 });
    const s = 1.12, py = 935;
    const patX = 560, docX = 1360;
    let dYaw, dPitch, pYaw, pPitch = 0, pSmile = 0.15, dSmile = 0.1, reach, dBlink = 0, pBlink = 0, gazeD = 0;
    if (p.mode === 'pause') {
      dYaw = kf(lt, [[0, -0.38], [0.75, -0.38], [1.25, -1.0, 'inOutCubic']]);
      dPitch = kf(lt, [[0, 0.75], [0.75, 0.7], [1.25, 0.08, 'inOutCubic']]);
      pYaw = kf(lt, [[0, 0.1], [1.35, 0.1], [1.85, 0.95, 'inOutCubic']]);
      pPitch = kf(lt, [[1.35, 0.1], [1.85, 0.05]]);
      reach = kf(lt, [[0, 0.75], [0.7, 0.96, 'outCubic'], [1.15, 1.0, 'outQuad'], [2.4, 1.0], [3.4, 0.9, 'inOutSine']]);
      pSmile = kf(lt, [[1.9, 0.12], [2.6, 0.35]]);
      dSmile = kf(lt, [[2.0, 0.08], [2.8, 0.25]]);
      dBlink = lt > 2.75 && lt < 2.87 ? 1 : 0;
    } else {
      dYaw = kf(lt, [[0, -0.38], [0.9, -0.38], [1.3, -1.0, 'inOutCubic'], [2.2, -1.0], [2.6, -0.38, 'inOutCubic']]);
      dPitch = kf(lt, [[0, 0.72], [0.9, 0.72], [1.3, 0.08, 'inOutCubic'], [2.2, 0.08], [2.6, 0.72, 'inOutCubic']]);
      pYaw = kf(lt, [[0, -0.15], [0.9, -0.15], [1.3, 0.95, 'inOutCubic']]);
      const nod = Math.sin(seg(lt, 1.55, 2.15) * Math.PI * 2) * 0.28;
      pPitch = kf(lt, [[0, 0.55], [0.9, 0.55], [1.3, 0.05]]) + Math.max(0, nod);
      pSmile = kf(lt, [[1.3, 0.2], [1.8, 0.4]]);
      dSmile = kf(lt, [[1.3, 0.1], [1.8, 0.3]]);
      reach = 0.9 + Math.sin(lt * 2.2) * 0.04 * (lt < 1.0 ? 1 : 0);
    }
    const toL = (wx, wy, x0) => [(wx - x0) / s, (wy - py) / s];
    const navi = [968, 752];
    const restR = toL(docX - 120, 990, docX);
    const tgtR = toL(lerp(docX - 160, navi[0], reach), lerp(990, navi[1] + 6, reach), docX);
    const z = p.mode === 'pause' ? lerp(1.18, 1.24, ease.inOutSine(lt / dur)) : 1.18;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-W / 2, -H / 2 + 40);
    cabin(ctx, d, t, () => {
      fig.drawPersonFront(ctx, patX, py, s, 'patient', {
        belt: 'passenger', headYaw: pYaw, headPitch: pPitch, smile: pSmile, blink: pBlink,
        rHand: toL(patX - 70, 1000, patX), lHand: toL(patX + 70, 1000, patX),
      });
      fig.drawPersonFront(ctx, docX, py, s, 'doctor', {
        outfit: 'coat', belt: 'driver', headYaw: dYaw, headPitch: dPitch, smile: dSmile, blink: dBlink,
        rHand: [tgtR[0], tgtR[1], 1, -0.2, 1 + reach * 0.12],
        lHand: toL(docX + 165, 850, docX),
        before: (c) => {},
      });
      props.drawWheelFront(ctx, docX, 905, 250, 0.6);
    });
    cabinFront(ctx, d);
    ctx.restore();
    grade(ctx, d);
    vignette(ctx, 0.6);
  }

  /* ============================================================= Praxis */
  function facade(ctx, t) {
    ctx.fillStyle = '#EDE9E2';
    ctx.fillRect(-400, -400, W + 800, 1330);
    // großes Fenster
    fillRR(ctx, 120, 250, 720, 590, 4, '#3A3E41');
    const g = ctx.createLinearGradient(0, 250, 0, 840);
    g.addColorStop(0, '#D8DEE0');
    g.addColorStop(1, '#C7CED1');
    ctx.fillStyle = g;
    ctx.fillRect(134, 264, 692, 562);
    ctx.fillStyle = '#3A3E41';
    ctx.fillRect(470, 264, 14, 562);
    poly(ctx, [[180, 826], [420, 264], [480, 264], [240, 826]], 'rgba(255,255,255,0.22)');
    poly(ctx, [[560, 826], [740, 264], [770, 264], [590, 826]], 'rgba(255,255,255,0.16)');
    // Schild ohne lesbaren Text
    fillRR(ctx, 925, 470, 70, 90, 4, '#FFFFFF');
    ctx.fillStyle = '#B9BBBD';
    ctx.fillRect(938, 492, 44, 6);
    ctx.fillRect(938, 508, 30, 5);
    ctx.fillRect(938, 522, 38, 5);
    // Vordach + Eingang
    fillRR(ctx, 1000, 200, 560, 34, 4, '#2E3134');
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    poly(ctx, [[1000, 234], [1560, 234], [1620, 420], [1060, 420]], null);
    ctx.fill();
    fillRR(ctx, 1060, 290, 440, 620, 4, '#2E3134');
    const g2 = ctx.createLinearGradient(0, 300, 0, 900);
    g2.addColorStop(0, '#D3DADD');
    g2.addColorStop(1, '#BCC5C9');
    ctx.fillStyle = g2;
    ctx.fillRect(1074, 304, 200, 592);
    ctx.fillRect(1286, 304, 200, 592);
    poly(ctx, [[1090, 896], [1200, 304], [1236, 304], [1126, 896]], 'rgba(255,255,255,0.2)');
    poly(ctx, [[1300, 896], [1410, 304], [1430, 304], [1320, 896]], 'rgba(255,255,255,0.15)');
    // Griffe
    fillRR(ctx, 1252, 520, 12, 170, 6, '#C9CDD0');
    fillRR(ctx, 1296, 520, 12, 170, 6, '#C9CDD0');
    // Pflanzkübel
    fillRR(ctx, 1620, 790, 220, 140, 6, '#3A3E41');
    blob(ctx, [[1610, 800], [1640, 660], [1700, 610], [1760, 640], [1830, 620], [1860, 720], [1850, 800]], '#7F8C71');
    blob(ctx, [[1660, 760], [1700, 680], [1760, 700], [1800, 760]], '#6E7B62');
    // Sockel + Gehweg
    ctx.fillStyle = '#D9D3CA';
    ctx.fillRect(-400, 900, W + 800, 30);
    ctx.fillStyle = '#DCD9D3';
    ctx.fillRect(-400, 930, W + 800, 600);
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 3;
    for (let i = -2; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 200, 930);
      ctx.lineTo(i * 200 - 120, 1400);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-400, 1010);
    ctx.lineTo(W + 400, 1010);
    ctx.stroke();
  }

  function walkFeet(ph, amp = 110, lift = 46) {
    const a = Math.sin(ph), b = Math.cos(ph);
    return {
      near: [a * amp, -Math.max(0, b) * lift, 0],
      far: [-a * amp, -Math.max(0, -b) * lift, 0],
      bob: Math.abs(Math.sin(ph)) * 12,
      arm: a,
    };
  }

  const PR = { patStop: 890, docX: 1160, gy: 960, pgy: 972, ps: 0.58, ds: 0.6 };
  function patientWalkX(lt) {
    return kf(lt, [[0, 220], [2.45, PR.patStop, 'outQuad']]);
  }
  function drawPatientWalking(ctx, x, gy, s, lt, moving, extra = {}) {
    const ph = (x / s) / 135;
    const wf = moving ? walkFeet(ph) : { near: [26, 0, 0], far: [-24, 0, 0], bob: 0, arm: 0 };
    const sh = [4, -840];
    return fig.drawPersonSide(ctx, x, gy, s, 'patient', Object.assign({
      facing: 1, feet: { near: wf.near, far: wf.far }, hipH: 520 - wf.bob,
      lean: moving ? 0.04 : 0,
      nearHand: [sh[0] + 20 + wf.arm * 70, sh[1] + 360, 1], farHand: [sh[0] - wf.arm * 70, sh[1] + 360, 1],
      headYaw: 1.1, smile: 0.2,
    }, extra));
  }

  function shotPractice(ctx, lt, dur, p, t) {
    facade(ctx, t);
    const x = patientWalkX(lt);
    const moving = lt < 2.4;
    // Arzt wartet, kleine Begrüßungsgeste
    const gest = ease.inOutCubic(seg(lt, 1.7, 2.3)) * (1 - ease.inOutCubic(seg(lt, 2.6, 3.0)));
    fig.drawPersonSide(ctx, PR.docX, PR.gy, PR.ds, 'doctor', {
      facing: -1, outfit: 'coat', headYaw: 1.1, smile: lerp(0.1, 0.4, seg(lt, 1.5, 2.3)),
      feet: { near: [24, 0], far: [-26, 0] },
      nearHand: gest > 0 ? [lerp(40, 150, gest), lerp(-480, -640, gest), 1, -0.3] : null,
    });
    drawPatientWalking(ctx, x, PR.pgy, PR.ps, lt, moving);
    grade(ctx, dayOf({ day: 0 }));
    vignette(ctx, 0.5);
  }

  function shotGreet(ctx, lt, dur, p, t) {
    const z = 1.9, cx = 1025, cy = 640;
    ctx.save();
    ctx.translate(W / 2, H / 2 + 20);
    ctx.scale(z, z);
    ctx.translate(-cx, -cy);
    facade(ctx, t);
    // Händedruck
    const ext = ease.inOutCubic(seg(lt, 0.2, 0.85)) * (1 - ease.inOutCubic(seg(lt, 2.1, 2.6)));
    const shake = Math.sin(seg(lt, 0.9, 1.9) * Math.PI * 4) * 9 * (lt > 0.9 && lt < 1.9 ? 1 : 0);
    const meet = [1025, 650 + shake];
    const pLoc = [(meet[0] - PR.patStop) / PR.ps, (meet[1] - PR.pgy) / PR.ps];
    const dLoc = [-(meet[0] - PR.docX) / PR.ds, (meet[1] - PR.gy) / PR.ds];
    const pIdle = [24, -480], dIdle = [24, -480];
    // Einladende Geste des Arztes nach dem Händedruck
    const inv = ease.inOutCubic(seg(lt, 2.5, 3.2)) * (1 - ease.inOutCubic(seg(lt, 3.6, 4.0)) * 0.3);
    const smileP = lerp(0.15, 0.55, seg(lt, 0.3, 1.0));
    const smileD = lerp(0.15, 0.5, seg(lt, 0.4, 1.1));
    const nodP = Math.sin(seg(lt, 1.0, 1.7) * Math.PI) * 0.18;
    const nodD = Math.sin(seg(lt, 1.2, 1.9) * Math.PI) * 0.15;
    fig.drawPersonSide(ctx, PR.patStop, PR.pgy, PR.ps, 'patient', {
      facing: 1, feet: { near: [26, 0], far: [-24, 0] },
      nearHand: ext > 0.01 ? [lerp(pIdle[0], pLoc[0], ext), lerp(pIdle[1], pLoc[1], ext), 1] : null,
      headYaw: 1.12, headPitch: nodP, smile: smileP, blink: lt > 3.1 && lt < 3.22 ? 1 : 0,
    });
    fig.drawPersonSide(ctx, PR.docX, PR.gy, PR.ds, 'doctor', {
      facing: -1, outfit: 'coat', feet: { near: [24, 0], far: [-26, 0] },
      nearHand: ext > 0.01 ? [lerp(dIdle[0], dLoc[0], ext), lerp(dIdle[1], dLoc[1], ext), 1] : null,
      farHand: inv > 0.01 ? [lerp(-10, -230, inv), lerp(-480, -560, inv), -1, 0.2] : null,
      headYaw: lerp(1.12, 0.7, inv), headPitch: nodD, smile: smileD, lean: -0.02 * inv,
    });
    ctx.restore();
    grade(ctx, dayOf({ day: 0 }));
    vignette(ctx, 0.55);
  }

  /* ======================================================= Türgriff Praxis */
  function shotHandle(ctx, lt, dur, p, t) {
    const pull = ease.inOutCubic(seg(lt, 0.5, 1.0)) * 50;
    ctx.fillStyle = '#EDE9E2';
    ctx.fillRect(0, 0, W, H);
    // Innen (durch Glas) – Praxisflur angedeutet
    const gx = 420 + pull;
    ctx.fillStyle = '#2E3134';
    ctx.fillRect(gx - 40, 0, 1000, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#DCE2E4');
    g.addColorStop(1, '#C5CDD0');
    ctx.fillStyle = g;
    ctx.fillRect(gx, 0, 880, H);
    ctx.fillStyle = 'rgba(240,238,232,0.6)';
    ctx.fillRect(gx + 80, 120, 260, 700);
    poly(ctx, [[gx + 100, H], [gx + 420, 0], [gx + 520, 0], [gx + 200, H]], 'rgba(255,255,255,0.22)');
    poly(ctx, [[gx + 560, H], [gx + 760, 0], [gx + 800, 0], [gx + 600, H]], 'rgba(255,255,255,0.14)');
    ctx.fillStyle = '#2E3134';
    ctx.fillRect(gx + 880, 0, 40, H);
    // Griffstange
    const hx = 1100 + pull;
    fillRR(ctx, hx - 50, 260, 50, 22, 6, '#A9AEB2');
    fillRR(ctx, hx - 50, 838, 50, 22, 6, '#A9AEB2');
    const hg = ctx.createLinearGradient(hx - 18, 0, hx + 18, 0);
    hg.addColorStop(0, '#9EA3A7');
    hg.addColorStop(0.45, '#E8EBED');
    hg.addColorStop(1, '#8D9296');
    ctx.fillStyle = hg;
    rr(ctx, hx - 18, 240, 36, 640, 18);
    ctx.fill();
    // Hand
    const reach = ease.inOutCubic(seg(lt, 0, 0.5));
    const target = [lerp(hx + 500, hx, reach), lerp(800, 560, reach)];
    handAt(ctx, target, GRIP, Math.PI + lerp(0.35, 0, reach), 1.5, { pose: 'grip', flip: true, sleeve: P.doctor.coat, sleeveShade: P.doctor.coatShade, coatCuff: true });
    grade(ctx, dayOf({ day: 0 }));
    vignette(ctx, 0.5);
  }

  /* ===================================================== Autotürgriff (Match Cut) */
  function shotCarHandle(ctx, lt, dur, p, t) {
    const pull = ease.inOutCubic(seg(lt, 0.05, 1.0));
    const dx = pull * 110, sc = 1 + pull * 0.05;
    // Innenraum hinter dem Spalt
    ctx.fillStyle = '#25282B';
    ctx.fillRect(0, 0, W, H);
    // hintere Tür (statisch)
    const body = (x0, x1) => {
      ctx.fillStyle = C.carBody;
      ctx.fillRect(x0, 0, x1 - x0, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.75, 'rgba(0,0,0,0.0)');
      g.addColorStop(1, 'rgba(0,0,0,0.16)');
      ctx.fillStyle = g;
      ctx.fillRect(x0, 0, x1 - x0, H);
      ctx.fillStyle = C.glass;
      ctx.fillRect(x0, 0, x1 - x0, 230);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      poly(ctx, [[x0 + 200, 230], [x0 + 420, 0], [x0 + 520, 0], [x0 + 300, 230]], null);
      ctx.fill();
      ctx.fillStyle = C.carLight;
      ctx.fillRect(x0, 230, x1 - x0, 14);
      ctx.fillStyle = C.carShade;
      ctx.fillRect(x0, 900, x1 - x0, 180);
    };
    body(-10, 600);
    // vordere Tür (bewegt sich, Scharnier rechts außerhalb des Bildes)
    ctx.save();
    ctx.translate(2400, 540);
    ctx.scale(sc, sc);
    ctx.translate(-2400 + dx, -540);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(612, 0, 26, H);
    body(630, 2600);
    // Griffmulde + Griff
    fillEllipse(ctx, 1150, 566, 150, 34, 'rgba(0,0,0,0.14)');
    fillRR(ctx, 1035, 542, 230, 38, 18, C.carShade);
    fillRR(ctx, 1035, 542, 230, 10, 5, 'rgba(255,255,255,0.2)');
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(600, 0);
    ctx.lineTo(600, H);
    ctx.stroke();
    // Hand bleibt am Griff (gleiche Lage wie im Praxis-Griff)
    const hx = 2400 + (1150 + dx - 2400) * sc;
    const hy = 540 + (561 - 540) * sc;
    handAt(ctx, [hx, hy], GRIP, Math.PI, 1.5 * sc, { pose: 'grip', flip: true, sleeve: P.doctor.coat, sleeveShade: P.doctor.coatShade, coatCuff: true });
    grade(ctx, dayOf({ day: 0 }));
    vignette(ctx, 0.5);
  }

  /* ===================================================== Einsteigen (Auto) */
  function shotBoarding(ctx, lt, dur, p, t) {
    const d = dayOf({ day: 0 });
    const cs = 0.9, cx = 860, gy = 930;
    const open = kf(lt, [[0.0, 0.42], [0.6, 1, 'outCubic'], [2.55, 1], [3.35, 0, 'inOutCubic']]);
    const k = Math.cos(open * 1.25);
    const edgeX = cx + cs * (532 - (532 - 112) * k);
    street(ctx, d);
    // Patientin
    const walkX = kf(lt, [[0, 420], [1.5, 975, 'outQuad']]);
    const sitP = ease.inOutCubic(seg(lt, 1.55, 2.4));
    const floorY = gy - 130 * cs;
    const drawPat = () => {
      if (sitP <= 0) {
        drawPatientWalking(ctx, walkX, gy + 22, PR.ps, lt, lt < 1.45, { headYaw: lt > 1.2 ? lerp(1.1, 0.75, seg(lt, 1.2, 1.5)) : 1.1, smile: 0.3 });
      } else {
        const sp = PR.ps * lerp(1, 0.94, sitP);
        fig.drawPersonSide(ctx, lerp(975, 958, sitP), lerp(gy + 22, floorY, sitP), sp, 'patient', {
          facing: 1, hipH: lerp(520, 185, sitP),
          feet: { near: [lerp(26, 310, sitP), 0], far: [lerp(-24, 270, sitP), 0] },
          lean: 0.18 * Math.sin(sitP * Math.PI) - 0.06 * sitP,
          nearHand: [lerp(40, 190, sitP), lerp(-480, -230, sitP), 1],
          farHand: [lerp(-20, 170, sitP), lerp(-480, -240, sitP), 1],
          headYaw: lerp(0.75, 1.12, sitP), smile: 0.3,
        });
      }
    };
    const base = ctx.getTransform();
    const inWorld = (c, fn) => { c.save(); c.setTransform(base); fn(); c.restore(); };
    props.drawCarSide(ctx, cx, gy, cs, {
      doorOpen: open,
      interior: (c) => { if (sitP > 0) inWorld(c, drawPat); },
      inside: open < 0.02 && sitP >= 1 ? (c) => inWorld(c, drawPat) : null,
    });
    if (sitP <= 0) drawPat();
    // Arzt hält die Tür auf
    const dX = kf(lt, [[0.0, 1215], [0.6, 1330, 'outCubic'], [2.55, 1330], [3.35, 1150, 'inOutCubic']]);
    const handW = [edgeX + 8, gy - 545 * cs];
    const L = [-(handW[0] - dX) / PR.ds, (handW[1] - PR.gy) / PR.ds];
    const walking = lt < 0.6 || (lt > 2.55 && lt < 3.35);
    const wf = walking ? walkFeet((dX / PR.ds) / 110, 60, 26) : { near: [24, 0, 0], far: [-26, 0, 0] };
    fig.drawPersonSide(ctx, dX, PR.gy, PR.ds, 'doctor', {
      facing: -1, outfit: 'coat', feet: { near: wf.near, far: wf.far },
      nearHand: lt < 3.4 ? [L[0], L[1], 1, 0] : (lt < 3.8 ? [lerp(L[0], 40, ease.inOutCubic(seg(lt, 3.4, 3.8))), lerp(L[1], -470, ease.inOutCubic(seg(lt, 3.4, 3.8))), 1] : null),
      nearGrip: lt < 3.4,
      headYaw: 1.1, headPitch: lt > 1.6 && lt < 2.6 ? 0.22 : 0.02, smile: 0.3,
    });
    grade(ctx, d);
    vignette(ctx, 0.5);
  }

  /* ========================================================= Losfahren */
  function shotDrive(ctx, lt, dur, p, t) {
    const d = dayOf({ day: 0 });
    const tt = Math.max(0, lt - 0.5);
    const disp = 0.5 * 150 * tt * tt; // sanftes Anfahren, kein Rennen
    const camX = disp * 0.8;
    const g = ctx.createLinearGradient(0, 0, 0, 700);
    g.addColorStop(0, d.sky);
    g.addColorStop(1, d.sky2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Praxisgebäude im Hintergrund (Parallaxe)
    ctx.save();
    ctx.translate(-camX * 0.45 - 260, 250);
    ctx.scale(0.62, 0.62);
    facade(ctx, t);
    ctx.restore();
    // Bäume
    ctx.save();
    ctx.translate(-camX * 0.75, 0);
    for (let i = 0; i < 6; i++) {
      const x = 1250 + i * 560;
      ctx.fillStyle = '#6F6A62';
      ctx.fillRect(x - 10, 560, 20, 270);
      blob(ctx, [[x - 120, 600], [x - 140, 470], [x - 60, 380], [x + 40, 360], [x + 130, 430], [x + 130, 580], [x, 640]], '#879479');
    }
    ctx.restore();
    // Straße
    ctx.fillStyle = '#D6D2CB';
    ctx.fillRect(0, 820, W, 34);
    ctx.fillStyle = '#AEADAA';
    ctx.fillRect(0, 854, W, 400);
    ctx.save();
    ctx.translate(-(camX % 320), 0);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = -1; i < 8; i++) ctx.fillRect(i * 320, 1010, 160, 10);
    ctx.restore();
    // Auto mit beiden Insassen (Fahrer dahinter, gedämpft)
    const cx = 760 + disp - camX, gy = 930, cs = 0.74;
    const hs = 0.68;
    props.drawCarSide(ctx, cx, gy, cs, {
      wheelRot: disp / (props.CAR.wheelR * cs),
      inside: (c) => {
        fig.drawHead(c, 300, -458, hs, 'doctor', { yaw: 1.15, pitch: 0.05, smile: 0.2 });
        c.fillStyle = 'rgba(40,45,50,0.45)';
        c.fillRect(0, -600, 600, 300);
        taper(c, 215, -360, 58, 240, -300, 64, P.patient.jacket);
        taper(c, 220, -405, 16, 222, -380, 16, P.patient.skinShade);
        fig.drawHead(c, 225, -440, hs, 'patient', { yaw: 1.15, smile: 0.3 });
      },
    });
    grade(ctx, d);
    vignette(ctx, 0.5);
  }

  /* ========================================================= Draufsicht */
  function shotAerial(ctx, lt, dur, p, t) {
    const mapS = 1.62, ox = (W - 1000 * mapS) / 2, oy = (H - 560 * mapS) / 2 + 10;
    const u = kf(lt, [[0, 0.02], [4.0, 0.3, 'inOutSine']]);
    const car = props.ROUTES.gold.at(u);
    const carW = [ox + car.x * mapS, oy + car.y * mapS];
    const zt = ease.inOutCubic(seg(lt, 0.0, 2.8));
    const z = lerp(2.1, 1, zt);
    const focus = [lerp(carW[0], W / 2, zt), lerp(carW[1], H / 2, zt)];
    ctx.fillStyle = C.mapBg;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-focus[0], -focus[1]);
    ctx.fillStyle = '#E8E5DF';
    ctx.fillRect(-W, -H, W * 3, H * 3);
    props.drawMapBase(ctx, mapS, mapS, ox, oy, { water: '#DCE1E4', park: '#DEE2D8', road: '#F6F5F2' });
    props.drawRoute(ctx, 'teal', mapS, mapS, ox, oy, { w: 14, casing: 3.5, contour: 1.0 });
    props.drawRoute(ctx, 'gold', mapS, mapS, ox, oy, { w: 20, casing: 3.5, contour: 3.6 });
    // Start (kleiner Ring) und Ziel
    const S = props.ROUTES.S, E = props.ROUTES.E;
    circle(ctx, ox + S[0] * mapS, oy + S[1] * mapS, 16, C.charcoal);
    circle(ctx, ox + S[0] * mapS, oy + S[1] * mapS, 8, '#FFFFFF');
    props.drawGoalPin(ctx, ox + E[0] * mapS, oy + E[1] * mapS + 4, 22);
    props.drawCarTop(ctx, carW[0], carW[1], car.ang, 0.5);
    ctx.restore();
  }

  /* ========================================================== Texte */
  function shotCard(ctx, lt, dur, p) {
    F.type.drawCard(ctx, p.key, p.theme, lt, dur);
  }
  function shotCallout(ctx, lt) {
    F.type.drawCallout(ctx, lt);
  }

  F.scenes = {
    cup: shotCup, key: shotKey, bag: shotBag, door: shotDoor, belt: shotBelt, navi: shotNavi,
    cabin: shotCabin, practice: shotPractice, greet: shotGreet, handle: shotHandle,
    boarding: shotBoarding, carhandle: shotCarHandle, drive: shotDrive, aerial: shotAerial, card: shotCard, callout: shotCallout,
  };
  F.scenes._naviState = naviState;
})();
