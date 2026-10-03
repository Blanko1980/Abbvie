/* Figuren: konsistente, wiederverwendbare Zeichenfunktionen.
   - drawHead: Kopf mit Blickrichtung (yaw), Neigung (pitch), Lächeln, Lidschlag
   - drawHandCU: Hand in Nahaufnahme (Zeigen, Greifen, Halten, Kneifen) mit Unterarm/Ärmel
   - drawPersonSide: ganze Figur in Seitenansicht (Gelenkmodell, IK für Arme/Beine)
   - drawPersonFront: Oberkörper in Frontansicht (sitzend im Auto)
*/
(function () {
  const F = (window.FILM = window.FILM || {});
  const { TAU, clamp, lerp, mix, shade, rgba, fillEllipse, ellipse, circle, taper, ik2, blob, rr } = F.u;

  /* ---------------------------------------------------------------- Kopf */
  // Lokale Einheiten: rx=54, ry=64. yaw in rad: + = Blick nach rechts.
  function drawHead(ctx, x, y, s, who, o = {}) {
    const st = F.config.people[who];
    const yaw = o.yaw || 0, pitch = o.pitch || 0;
    const smile = o.smile || 0, blink = o.blink || 0, gaze = o.gaze || 0;
    const RX = 54, RY = 64;
    const sy = Math.sin(yaw), cy = Math.cos(yaw);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.rotate(o.tilt || 0);

    const headPath = () => {
      ctx.beginPath();
      ctx.ellipse(0, 0, RX, RY, 0, 0, TAU);
      ctx.moveTo(sy * RX * 0.2 + RX * 0.7, RY * 0.35);
      ctx.ellipse(sy * RX * 0.2, RY * 0.32, RX * 0.72, RY * 0.66, 0, 0, TAU);
    };

    // Haar hinten (Patientin: Lockenvolumen + Dutt)
    if (who === 'patient') {
      const r = F.u.rng(77);
      const bx = -sy * RX * 0.55, by = -RY * 0.78;
      circle(ctx, bx, by, 34, st.hair);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU;
        circle(ctx, bx + Math.cos(a) * 24, by + Math.sin(a) * 22, 15 + r() * 5, st.hair);
      }
      for (let i = 0; i < 16; i++) {
        const a = -Math.PI * 0.95 + (i / 15) * Math.PI * 1.3 - sy * 0.5;
        const rr_ = 58 + r() * 6;
        circle(ctx, Math.cos(a) * rr_ * 0.98 - sy * 8, Math.sin(a) * rr_ * 0.95 - 4, 17 + r() * 6, st.hair);
      }
    }

    // Grundform Haut
    headPath();
    ctx.fillStyle = st.skin;
    ctx.fill();

    // Haare + Gesicht (Gesichtsfeld als Ellipse, die mit yaw nach vorn wandert)
    const fx = sy * RX * 0.42, fy = RY * 0.2;
    const frx = RX * (0.62 + 0.18 * cy), fry = RY * 0.86;
    ctx.save();
    headPath();
    ctx.clip();
    if (who === 'doctor') {
      ctx.fillStyle = st.hair;
      ctx.beginPath();
      ctx.ellipse(-sy * 4, -6, RX + 3, RY + 2, 0, 0, TAU);
      ctx.fill();
      // graue Schläfen (dezent, nur über den Ohren)
      [yaw - Math.PI * 0.42, yaw + Math.PI * 0.42].forEach((a) => {
        if (Math.cos(a) < 0.05) return;
        fillEllipse(ctx, Math.sin(a) * RX * 0.86, -4, 9 + 4 * Math.cos(a), 20, mix(st.hair, st.hairGrey, 0.75));
      });
    } else {
      ctx.fillStyle = st.hair;
      ctx.fillRect(-RX - 10, -RY - 10, RX * 2 + 20, RY * 2 + 20);
    }
    fillEllipse(ctx, fx, fy + (who === 'patient' ? 4 : 0), frx, fry, st.skin);
    // Kinn/Kiefer sicher in Haut
    fillEllipse(ctx, sy * RX * 0.22, RY * 0.4, RX * 0.62, RY * 0.56, st.skin);
    // dezente Formschattierung zur Rückseite
    ctx.fillStyle = rgba(st.skinShade, 0.35);
    ctx.beginPath();
    ctx.ellipse(-sy * RX * 0.9 - RX * 0.25, RY * 0.15, RX * 0.5, RY * 0.9, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Patientin: Stirnlocken-Kontur über dem Gesicht
    if (who === 'patient') {
      const r = F.u.rng(31);
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * 0.85 + (i / 6) * Math.PI * 0.7 + sy * 0.55;
        circle(ctx, Math.cos(a) * 52, Math.sin(a) * 58 - 2, 13 + r() * 4, st.hair);
      }
    }

    // Ohren
    [yaw - Math.PI / 2, yaw + Math.PI / 2].forEach((a) => {
      const c = Math.cos(a);
      if (c < -0.15) return;
      const ex = Math.sin(a) * RX * 0.93;
      const w = 9 + 5 * clamp(c);
      fillEllipse(ctx, ex, 6, w, 15, st.skin);
      fillEllipse(ctx, ex, 7, w * 0.45, 8, rgba(st.skinShade, 0.8));
    });

    // Gesichtszüge
    const fy0 = pitch * 12;
    const eyeY = 2 + fy0;
    const eyes = [];
    [-0.43, 0.43].forEach((off) => {
      const a = yaw + off;
      const c = Math.cos(a);
      if (c < 0.12) return;
      eyes.push({ x: Math.sin(a) * RX * 0.92, c });
    });
    // Brauen
    ctx.strokeStyle = who === 'doctor' ? mix(st.hair, st.hairGrey, 0.3) : st.hair;
    ctx.lineCap = 'round';
    eyes.forEach((e) => {
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      const w = 11 * Math.max(0.45, e.c);
      ctx.moveTo(e.x - w, eyeY - 17 + smile * -1);
      ctx.quadraticCurveTo(e.x, eyeY - 21 - smile * 1.5, e.x + w, eyeY - 18);
      ctx.stroke();
    });
    // Augen
    eyes.forEach((e) => {
      const rxE = 5.2 * Math.max(0.5, e.c);
      const ryE = 6.2 * (1 - blink * 0.9) * (1 - smile * 0.25);
      fillEllipse(ctx, e.x + gaze * 2.5, eyeY, rxE, Math.max(0.8, ryE), '#2A2421');
      if (blink < 0.5) circle(ctx, e.x + gaze * 2.5 + 1.5, eyeY - 2, 1.4, 'rgba(255,255,255,0.7)');
    });
    // Nase
    const nA = yaw;
    const nx = Math.sin(nA) * RX * 0.97;
    if (Math.abs(sy) > 0.35) {
      const tip = Math.sin(nA) * RX * (1.0 + 0.16 * Math.abs(sy));
      ctx.fillStyle = st.skin;
      ctx.beginPath();
      ctx.moveTo(nx - Math.sign(sy) * 6, eyeY + 2);
      ctx.quadraticCurveTo(tip + Math.sign(sy) * 4, eyeY + 22, tip, eyeY + 25);
      ctx.lineTo(nx - Math.sign(sy) * 4, eyeY + 27);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = rgba(st.skinLine, 0.55);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(nx + sy * 3, eyeY + 8);
    ctx.quadraticCurveTo(nx + sy * 9, eyeY + 20, nx + sy * 1, eyeY + 25);
    ctx.stroke();
    // Mund
    const mA = yaw;
    const mx = Math.sin(mA) * RX * 0.86;
    const mw = 13 * Math.max(0.35, cy);
    ctx.strokeStyle = st.skinLine;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(mx - mw, eyeY + 40);
    ctx.quadraticCurveTo(mx, eyeY + 43 + smile * 6, mx + mw, eyeY + 40 - smile * 1.5);
    ctx.stroke();

    // Brille
    if (st.glasses) {
      ctx.strokeStyle = '#2E2A27';
      ctx.lineWidth = 3;
      eyes.forEach((e) => {
        const w = 15 * Math.max(0.45, e.c);
        rr(ctx, e.x - w, eyeY - 10, w * 2, 19, 7 * Math.max(0.5, e.c));
        ctx.stroke();
      });
      if (eyes.length === 2) {
        const a = eyes[0], b = eyes[1];
        const wa = 15 * Math.max(0.45, a.c), wb = 15 * Math.max(0.45, b.c);
        ctx.beginPath();
        ctx.moveTo(a.x + wa, eyeY - 3);
        ctx.quadraticCurveTo((a.x + b.x) / 2, eyeY - 8, b.x - wb, eyeY - 3);
        ctx.stroke();
      }
      // Bügel zum sichtbaren Ohr
      if (eyes.length && Math.abs(sy) > 0.25) {
        const e = sy > 0 ? eyes[0] : eyes[eyes.length - 1];
        const w = 15 * Math.max(0.45, e.c);
        const earX = Math.sin(yaw - Math.sign(sy) * Math.PI / 2) * RX * 0.9;
        ctx.beginPath();
        ctx.moveTo(e.x - Math.sign(sy) * w, eyeY - 6);
        ctx.lineTo(earX, eyeY - 4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ------------------------------------------------- Hand (Nahaufnahme) */
  // (x,y) = Handgelenk. ang = Richtung zu den Fingerspitzen. flip = Daumen unten statt oben.
  function drawHandCU(ctx, x, y, ang, s, o = {}) {
    const st = F.config.people[o.who || 'doctor'];
    const pose = o.pose || 'relaxed';
    const sil = o.silhouette;
    const skin = sil || st.skin, sh = sil || st.skinShade;
    const sleeve = sil || o.sleeve || '#888', sleeveSh = sil || o.sleeveShade || shade(sleeve, -0.15);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(s, s * (o.flip ? -1 : 1));

    // Unterarm + Ärmel (nach hinten aus dem Bild)
    const back = o.arm || 900;
    taper(ctx, -back, 6, 50, 0, 0, 33, sh);
    taper(ctx, -back, 0, 50, 0, -2, 32, skin);
    if (o.sleeve || sil) {
      const cuff = o.cuff != null ? o.cuff : -95;
      taper(ctx, -back, 4, 64, cuff, 2, 52, sleeveSh);
      taper(ctx, -back, 0, 63, cuff, -1, 50, sleeve);
      if (o.coatCuff && !sil) {
        ctx.strokeStyle = rgba('#000000', 0.08);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cuff - 26, -48);
        ctx.lineTo(cuff - 26, 50);
        ctx.stroke();
      }
    }

    const fingerTip = (x1, y1, x2, y2, r1, r2) => {
      taper(ctx, x1, y1 + 3, r1, x2, y2 + 3, r2, sh);
      taper(ctx, x1, y1, r1, x2, y2, r2, skin);
    };
    // Handfläche/Handrücken
    const palm = () => {
      ctx.beginPath();
      ctx.moveTo(-6, -30);
      ctx.bezierCurveTo(30, -42, 80, -42, 100, -30);
      ctx.bezierCurveTo(114, -14, 114, 18, 100, 34);
      ctx.bezierCurveTo(70, 44, 26, 42, -6, 30);
      ctx.closePath();
    };
    ctx.save();
    ctx.translate(0, 5);
    palm();
    ctx.fillStyle = sh;
    ctx.fill();
    ctx.restore();
    palm();
    ctx.fillStyle = skin;
    ctx.fill();

    if (pose === 'point') {
      // gekrümmte Finger (Knöchel) + gestreckter Zeigefinger + Daumen
      fingerTip(96, 4, 132, 14, 15, 12);
      fingerTip(92, 20, 124, 32, 14, 11);
      fingerTip(84, 33, 112, 44, 12, 10);
      fingerTip(132, 14, 118, 30, 12, 10);
      fingerTip(124, 32, 110, 44, 11, 9);
      fingerTip(92, -18, 196, -22, 15, 12.5);
      if (!sil) {
        ctx.fillStyle = rgba('#FFFFFF', 0.35);
        rr(ctx, 176, -30, 17, 12, 5);
        ctx.fill();
      }
      fingerTip(28, -30, 80, -46, 17, 13);
    } else if (pose === 'grip') {
      // geschlossene Faust um einen Griff (Objekt liegt bei ca. x=120)
      fingerTip(98, -22, 138, -18, 15, 13);
      fingerTip(100, -4, 142, 2, 15, 13);
      fingerTip(98, 14, 138, 20, 14, 12);
      fingerTip(92, 31, 128, 36, 12, 11);
      fingerTip(138, -18, 132, 4, 13, 11);
      fingerTip(142, 2, 134, 22, 13, 11);
      fingerTip(138, 20, 128, 38, 12, 10);
      fingerTip(30, -32, 104, -40, 17, 13);
      ctx.strokeStyle = rgba(st.skinLine, 0.25);
      ctx.lineWidth = 2.5;
      [-12, 6, 24].forEach((yy) => {
        ctx.beginPath();
        ctx.moveTo(108, yy);
        ctx.lineTo(136, yy + 4);
        ctx.stroke();
      });
    } else if (pose === 'pinch') {
      fingerTip(96, 0, 150, 6, 15, 12);
      fingerTip(150, 6, 158, 24, 12, 10);
      fingerTip(92, 18, 138, 26, 14, 11);
      fingerTip(138, 26, 140, 42, 11, 9);
      fingerTip(84, 32, 120, 42, 12, 10);
      fingerTip(96, -18, 158, -14, 15, 12);
      fingerTip(30, -30, 150, -34, 17, 13);
    } else {
      // entspannt, leicht gekrümmte Finger
      fingerTip(96, -18, 168, -14, 15, 12);
      fingerTip(98, -2, 176, 4, 15, 12);
      fingerTip(96, 14, 168, 20, 14, 11.5);
      fingerTip(90, 29, 152, 36, 12, 10);
      fingerTip(30, -30, 92, -50, 17, 13);
    }
    ctx.restore();
  }

  /* ----------------------------------------------- Seitenansicht (ganz) */
  // Lokale Einheiten: Boden y=0, Körpergröße ≈ 1015. facing: 1 = rechts, -1 = links.
  const DIM = { hip: 520, shoulder: 320, upper: 196, fore: 182, thigh: 250, shin: 248 };

  function outfitColors(who, outfit, day) {
    const P = F.config.people;
    if (who === 'doctor') {
      if (outfit === 'coat') return { top: P.doctor.coat, topSh: P.doctor.coatShade, sleeve: P.doctor.coat, sleeveSh: P.doctor.coatShade };
      const d = F.config.days[day || 1];
      return { top: d.sweater, topSh: d.sweaterShade, sleeve: d.sweater, sleeveSh: d.sweaterShade };
    }
    return { top: P.patient.jacket, topSh: P.patient.jacketShade, sleeve: P.patient.jacket, sleeveSh: P.patient.jacketShade };
  }

  function mitten(ctx, wx, wy, ang, s, skin, sh, grip) {
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(ang);
    taper(ctx, 0, 3, 19, grip ? 30 : 46, 4, grip ? 21 : 15, sh);
    taper(ctx, 0, 0, 19, grip ? 30 : 46, 0, grip ? 21 : 15, skin);
    taper(ctx, 6, -12, 8, 26, -22, 7, skin);
    ctx.restore();
  }

  function drawPersonSide(ctx, x, y, s, who, p) {
    const st = F.config.people[who];
    const facing = p.facing || 1;
    const col = outfitColors(who, p.outfit, p.day);
    const outer = ctx.getTransform();
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * facing, s);

    const hipY = -(p.hipH != null ? p.hipH : DIM.hip);
    const hipX = p.hipX || 0;
    const lean = p.lean || 0;
    const T = (lx, ly) => {
      // Torso-lokal -> Figurkoordinaten (um Hüfte rotiert)
      const c = Math.cos(lean), sn = Math.sin(lean);
      return [hipX + lx * c - ly * sn, hipY + lx * sn + ly * c];
    };
    const sh = T(4, -DIM.shoulder);
    const neckTop = T(16, -372);
    const headC = T(22 + (p.headFwd || 0), -432);

    const legs = p.feet || { near: [24, 0], far: [-20, 0] };
    const drawLeg = (foot, dark) => {
      const hp = [hipX, hipY + 6];
      const k = ik2(hp[0], hp[1], foot[0], foot[1] - 34, DIM.thigh, DIM.shin, 1); // Knie nach vorn
      const pc = dark ? shade(who === 'doctor' ? st.pants : st.pants, -0.18) : st.pants;
      taper(ctx, hp[0], hp[1], 56, k.ex, k.ey, 40, pc);
      taper(ctx, k.ex, k.ey, 40, k.wx, k.wy, 30, pc);
      // Schuh
      ctx.save();
      ctx.translate(k.wx, k.wy + 4);
      ctx.rotate(foot[2] || 0);
      rr(ctx, -30, -8, 118, 40, 18);
      ctx.fillStyle = dark ? shade(st.shoes, -0.2) : st.shoes;
      ctx.fill();
      ctx.restore();
    };

    const shoulderW = [sh[0], sh[1]];
    const handDefault = (dx) => [sh[0] + 14 + dx, sh[1] + 362];
    const drawArm = (target, dark, grip) => {
      const tg = target || handDefault(dark ? -12 : 6);
      const k = ik2(shoulderW[0], shoulderW[1], tg[0], tg[1], DIM.upper, DIM.fore, -(tg[2] != null ? tg[2] : 1)); // Ellbogen nach unten/hinten
      const sc = dark ? col.sleeveSh : col.sleeve;
      taper(ctx, shoulderW[0], shoulderW[1], 40, k.ex, k.ey, 31, sc);
      taper(ctx, k.ex, k.ey, 31, k.wx, k.wy, 25, sc);
      const ang = Math.atan2(k.wy - k.ey, k.wx - k.ex) + (tg[3] || 0);
      mitten(ctx, k.wx + Math.cos(ang) * 6, k.wy + Math.sin(ang) * 6, ang, 1, dark ? st.skinShade : st.skin, st.skinShade, grip);
      return { wx: k.wx, wy: k.wy, ang };
    };

    // hinterer Arm & hinteres Bein
    const farArm = p.farHide ? null : drawArm(p.farHand, true, p.farGrip);
    drawLeg(legs.far, true);
    drawLeg(legs.near, false);

    // Torso
    const tor = [
      [-60, -332], [-56, -240], [-58, -120], [-62, 0], [-44, 44], [58, 44], [66, 0],
      [58, -110], [70, -215], [62, -300], [34, -350], [-24, -352],
    ].map(([a, b]) => T(a, b));
    // Hals
    taper(ctx, ...T(4, -330), 30, neckTop[0], neckTop[1], 26, st.skinShade);
    blob(ctx, tor, col.top);
    if (p.outfit === 'coat' || who === 'patient') {
      // Mantel-/Kittelschoß
      const skirtLen = who === 'doctor' ? 300 : 250;
      const sk = [T(-64, -40), T(70, -40), T(84 + (p.skirtSwing || 0), skirtLen), T(-74 + (p.skirtSwing || 0), skirtLen)];
      F.u.poly(ctx, sk, col.top);
      ctx.strokeStyle = rgba('#000000', 0.08);
      ctx.lineWidth = 3;
      ctx.beginPath();
      const a1 = T(48, -300), a2 = T(64, skirtLen - 6);
      ctx.moveTo(a1[0], a1[1]);
      ctx.lineTo(a2[0], a2[1]);
      ctx.stroke();
    }
    if (who === 'doctor' && p.outfit === 'coat') {
      // Kragen + Namensschild (ohne lesbaren Namen)
      const c1 = T(56, -300), c2 = T(28, -350), c3 = T(40, -250);
      F.u.poly(ctx, [c2, c1, c3], st.shirt);
      const b = T(28, -236);
      ctx.save();
      ctx.translate(b[0], b[1]);
      ctx.rotate(lean);
      rr(ctx, -4, -6, 34, 18, 3);
      ctx.fillStyle = st.badge;
      ctx.fill();
      ctx.fillStyle = '#9A9C9E';
      ctx.fillRect(2, -1, 22, 3);
      ctx.fillRect(2, 5, 14, 2.5);
      ctx.restore();
    }
    if (who === 'doctor' && p.outfit !== 'coat') {
      // Rundhals-Kontur des Pullovers
      ctx.strokeStyle = rgba('#000000', 0.12);
      ctx.lineWidth = 4;
      ctx.beginPath();
      const a = T(-8, -350), b = T(46, -330);
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(...T(30, -318), b[0], b[1]);
      ctx.stroke();
    }
    if (who === 'patient') {
      // heller Kragen/Top
      F.u.poly(ctx, [T(20, -352), T(58, -318), T(36, -280)], st.top);
    }

    // Tasche (an Schulter / in Hand) – optional vom Aufrufer gezeichnet
    if (p.beforeNearArm) {
      // in Weltkoordinaten (vor der Figur-Transformation)
      ctx.save();
      ctx.setTransform(outer);
      p.beforeNearArm(ctx);
      ctx.restore();
    }

    const nearArm = p.nearHide ? null : drawArm(p.nearHand, false, p.nearGrip);

    // Kopf (in Figurkoordinaten; yaw + = Blick nach vorn in Laufrichtung)
    ctx.save();
    ctx.translate(headC[0], headC[1]);
    drawHead(ctx, 0, 0, 1, who, {
      yaw: p.headYaw != null ? p.headYaw : 1.15,
      pitch: p.headPitch || 0, smile: p.smile || 0, blink: p.blink || 0, gaze: p.gaze || 0,
      tilt: p.headTilt || 0,
    });
    ctx.restore();
    ctx.restore();

    // Rückgabe Weltkoordinaten der Hände
    const toW = (pt) => pt && [x + pt.wx * s * facing, y + pt.wy * s, pt.ang];
    return { near: toW(nearArm), far: toW(farArm) };
  }

  /* --------------------------------------- Frontansicht (sitzend, Oberkörper) */
  // (x,y) = Sitzhöhe Hüftmitte. Personen-links = Bild-rechts.
  function drawPersonFront(ctx, x, y, s, who, p) {
    const st = F.config.people[who];
    const col = outfitColors(who, p.outfit, p.day);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const shY = -318;
    const shL = [118, shY], shR = [-118, shY]; // L = Personen-links (Bild rechts)
    const UP = 190, FO = 176;

    const arm = (side, target, dark, front) => {
      const sp = side === 'L' ? shL : shR;
      const tg = target || [sp[0] * 0.62, -40];
      const bend = side === 'L' ? 1 : -1; // Ellbogen nach außen
      const k = ik2(sp[0], sp[1] + 12, tg[0], tg[1], UP, FO, tg[2] != null ? tg[2] : bend);
      const sc = dark ? col.sleeveSh : col.sleeve;
      taper(ctx, sp[0], sp[1] + 12, 44, k.ex, k.ey, 33, sc);
      taper(ctx, k.ex, k.ey, 33, k.wx, k.wy, 27 * (tg[4] || 1), sc);
      const ang = Math.atan2(k.wy - k.ey, k.wx - k.ex);
      const hs = tg[4] || 1;
      ctx.save();
      ctx.translate(k.wx, k.wy);
      ctx.rotate(ang + (tg[3] || 0));
      ctx.scale(hs, hs);
      taper(ctx, 0, 3, 22, 44, 4, 19, st.skinShade);
      taper(ctx, 0, 0, 22, 44, 0, 19, st.skin);
      taper(ctx, 8, side === 'L' ? 14 : -14, 9, 30, side === 'L' ? 26 : -26, 8, st.skin);
      ctx.restore();
      return [x + k.wx * s, y + k.wy * s];
    };

    // Hinterer Sitz/Kopfstütze wird von der Szene gezeichnet.
    // Torso
    const tor = [[-122, shY + 8], [-96, shY - 16], [96, shY - 16], [122, shY + 8], [104, -120], [96, 40], [-96, 40], [-104, -120]];
    taper(ctx, 0, -330, 32, 0, -392, 28, st.skinShade);
    blob(ctx, tor, col.top);
    if (who === 'doctor' && p.outfit === 'coat') {
      // Hemd-V + Revers
      F.u.poly(ctx, [[-40, shY - 14], [40, shY - 14], [0, -200]], st.shirt);
      ctx.fillStyle = st.coatShade;
      F.u.poly(ctx, [[-46, shY - 14], [-4, -196], [-30, -150], [-66, shY + 30]], st.coatShade);
      F.u.poly(ctx, [[46, shY - 14], [4, -196], [30, -150], [66, shY + 30]], st.coatShade);
      F.u.poly(ctx, [[-42, shY - 16], [-2, -200], [-22, -160], [-58, shY + 26]], st.coat);
      F.u.poly(ctx, [[42, shY - 16], [2, -200], [22, -160], [58, shY + 26]], st.coat);
      // Namensschild
      rr(ctx, 54, -236, 46, 22, 3);
      ctx.fillStyle = st.badge;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#9A9C9E';
      ctx.fillRect(61, -230, 28, 3.5);
      ctx.fillRect(61, -222, 18, 3);
      // Mittellinie
      ctx.strokeStyle = rgba('#000000', 0.08);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-2, -196);
      ctx.lineTo(-6, 40);
      ctx.stroke();
    } else if (who === 'patient') {
      F.u.poly(ctx, [[-44, shY - 14], [44, shY - 14], [0, -236]], st.top);
      F.u.poly(ctx, [[-48, shY - 14], [-6, -232], [-34, -170], [-72, shY + 30]], col.topSh);
      F.u.poly(ctx, [[48, shY - 14], [6, -232], [34, -170], [72, shY + 30]], col.topSh);
    }
    // Gurt
    if (p.belt) {
      const d = p.belt === 'driver' ? 1 : -1; // driver: von Personen-links-Schulter (Bild rechts)
      ctx.strokeStyle = '#3B3F43';
      ctx.lineWidth = 30;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(d * 128, shY + 4);
      ctx.lineTo(-d * 92, 10);
      ctx.stroke();
      ctx.strokeStyle = rgba('#FFFFFF', 0.07);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(d * 128, shY - 4);
      ctx.lineTo(-d * 92, 2);
      ctx.stroke();
    }

    const hands = {};
    if (p.before) p.before(ctx);
    hands.R = arm('R', p.rHand, false);
    hands.L = arm('L', p.lHand, false);
    if (p.after) p.after(ctx);

    drawHead(ctx, 0, -448, 1, who, {
      yaw: p.headYaw || 0, pitch: p.headPitch || 0, smile: p.smile || 0,
      blink: p.blink || 0, gaze: p.gaze || 0, tilt: p.headTilt || 0,
    });
    ctx.restore();
    return hands;
  }

  F.fig = { drawHead, drawHandCU, drawPersonSide, drawPersonFront, outfitColors, DIM };
})();
