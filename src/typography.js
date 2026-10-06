/* Texttafeln, deterministischer Pinselstrich, Schlusskarte. */
(function () {
  const F = (window.FILM = window.FILM || {});
  const { clamp, lerp, ease, seg, rng, setFont, rgba } = F.u;
  const C = F.config.colors;
  const W = F.config.width, H = F.config.height;

  // Text erscheint komplett und gemeinsam (kurze Einblendung, kein Schreibmaschinen-Effekt)
  // Startet bereits sichtbar, damit beim harten Schnitt kein leerer Frame entsteht.
  function appear(lt, dur = 0.32) {
    return 0.4 + 0.6 * ease.outCubic(seg(lt, 0, dur));
  }

  function drawCard(ctx, key, theme, lt, dur, opts = {}) {
    const T = F.config.texts;
    const dark = theme === 'dark';
    ctx.fillStyle = dark ? C.charcoal : C.white;
    ctx.fillRect(0, 0, W, H);
    const fg = opts.color ? C[opts.color] : dark ? C.white : C.charcoal;
    // Schlussgedanke erscheint sofort; Übergänge zwischen Einstellungen übernimmt die Timeline.
    const a = key === 'final' ? 1 : appear(lt);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = fg;
    const rise = (1 - a) * 12;
    if (key === 'final') {
      const lead = T.final.lead, main = T.final.main;
      const sLead = 62, sMain = 84, lh = 1.16;
      const blockH = sLead * lh + 46 + main.length * sMain * lh;
      let y = H / 2 - blockH / 2 + sLead + rise;
      setFont(ctx, sLead, 400, -0.5);
      ctx.fillStyle = rgba(fg, 0.82);
      lead.forEach((l) => { ctx.fillText(l, W / 2, y); y += sLead * lh; });
      // kurzer Gold-Akzent als ruhige Trennung
      ctx.fillStyle = C.gold;
      ctx.fillRect(W / 2 - 36, y - 14, 72, 8);
      y += 46 + sMain * 0.18;
      setFont(ctx, sMain, 700, -1.5);
      ctx.fillStyle = fg;
      main.forEach((l) => { ctx.fillText(l, W / 2, y + sMain * 0.75); y += sMain * lh; });
    } else {
      const lines = T[key];
      const size = 88, lh = 1.14;
      setFont(ctx, size, 700, -1.6);
      const blockH = lines.length * size * lh;
      let y = H / 2 - blockH / 2 + size * 0.8 + rise;
      lines.forEach((l) => { ctx.fillText(l, W / 2, y); y += size * lh; });
    }
    ctx.restore();
  }

  /* Pinselstrich: unregelmäßiges Polygon + wenige Texturspuren (deterministisch).
     reveal 0..1 enthüllt den Strich von links nach rechts. */
  function brushStroke(ctx, x0, y0, len, thick, seed, reveal, color) {
    const r = rng(seed);
    const N = 60;
    const top = [], bot = [];
    const wob = [r() * 6, r() * 6, r() * 6];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = x0 + u * len;
      // Dickenprofil: kräftiger Ansatz, leichtes Auslaufen
      const prof = Math.min(1, u / 0.05) * (u > 0.82 ? 1 - Math.pow((u - 0.82) / 0.18, 1.6) * 0.7 : 1);
      const th = thick * (0.86 + 0.14 * Math.sin(u * 7 + wob[0])) * Math.max(0.2, prof);
      const cy = y0 + Math.sin(u * 3.1 + wob[1]) * thick * 0.06 - u * thick * 0.12;
      top.push([x + (r() - 0.5) * 3, cy - th / 2 + (r() - 0.5) * thick * 0.05]);
      bot.push([x + (r() - 0.5) * 3, cy + th / 2 + (r() - 0.5) * thick * 0.07]);
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 - thick, y0 - thick * 2, (len + thick * 2) * clamp(reveal) + thick * 0.2, thick * 4);
    ctx.clip();
    ctx.beginPath();
    // runder Ansatz
    ctx.moveTo(top[0][0], top[0][1]);
    top.forEach((p) => ctx.lineTo(p[0], p[1]));
    // ausfransendes Ende
    const e = top[N], eb = bot[N];
    ctx.lineTo(e[0] + thick * 0.18, (e[1] + eb[1]) / 2 - thick * 0.12);
    ctx.lineTo(e[0] + thick * 0.05, (e[1] + eb[1]) / 2);
    ctx.lineTo(eb[0] + thick * 0.22, (e[1] + eb[1]) / 2 + thick * 0.16);
    for (let i = N; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
    ctx.quadraticCurveTo(x0 - thick * 0.22, y0, top[0][0], top[0][1]);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    // Texturspuren (trockene Borsten) in Hintergrundfarbe
    ctx.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < 5; k++) {
      const yy = y0 + (r() - 0.5) * thick * 0.7;
      const xs = x0 + len * (0.84 + r() * 0.07);
      const xe = x0 + len * (1.02 + r() * 0.04);
      ctx.lineWidth = 1.5 + r() * 2.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.beginPath();
      ctx.moveTo(xs, yy - (xs - x0) * 0.012);
      ctx.lineTo(xe, yy - (xe - x0) * 0.012 + (r() - 0.5) * 4);
      ctx.stroke();
    }
    ctx.restore();
    // Feine Borstenausläufer
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 - thick, y0 - thick * 2, (len + thick * 2) * clamp(reveal), thick * 4);
    ctx.clip();
    ctx.strokeStyle = color;
    for (let k = 0; k < 4; k++) {
      const yy = y0 + (r() - 0.3) * thick * 0.6 - len * 0.11 * (thick / len);
      ctx.lineWidth = 2 + r() * 2;
      ctx.beginPath();
      const xs = x0 + len * 0.96;
      ctx.moveTo(xs, yy - thick * 0.1);
      ctx.lineTo(xs + thick * (0.25 + r() * 0.3), yy - thick * 0.12 + (r() - 0.5) * 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCallout(ctx, lt) {
    const T = F.config.texts.callout;
    ctx.fillStyle = C.charcoal;
    ctx.fillRect(0, 0, W, H);
    const s1 = 152, s2 = 122;
    setFont(ctx, s1, 700, -3);
    const w1 = ctx.measureText(T.line1).width;
    setFont(ctx, s2, 700, -2.2);
    const w2 = ctx.measureText(T.line2).width;
    const off = 150; // Staffelung
    const blockW = Math.max(w1 + 170, off + w2);
    const bx = (W - blockW) / 2;
    const y1 = H / 2 - 30, y2 = H / 2 + 128;

    // Pinselstrich hinter „Rethink“, leicht ansteigend
    const rev = ease.outCubic(seg(lt, 0.15, 0.85));
    ctx.save();
    ctx.translate(bx - 34, y1 - s1 * 0.34);
    ctx.rotate(-0.045);
    brushStroke(ctx, 0, 0, w1 + 200, s1 * 1.04, 1207, rev, C.gold);
    ctx.restore();

    const a1 = ease.outCubic(seg(lt, 0.4, 0.8));
    const a2 = ease.outCubic(seg(lt, 0.6, 1.0));
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = a1;
    ctx.translate(bx, y1);
    ctx.rotate(-0.045);
    setFont(ctx, s1, 700, -3);
    ctx.fillStyle = C.charcoal;
    ctx.fillText(T.line1, 0, (1 - a1) * 10);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = a2;
    setFont(ctx, s2, 700, -2.2);
    ctx.fillStyle = C.white;
    ctx.textAlign = 'left';
    ctx.fillText(T.line2, bx + off, y2 + (1 - a2) * 10);
    ctx.restore();
  }

  F.type = { drawCard, drawCallout, brushStroke };
})();
