/* Zentrale, deterministische Timeline: renderFrame(timeInSeconds). */
(function () {
  const F = (window.FILM = window.FILM || {});
  const cfg = F.config;
  const shots = cfg.shots;
  let buffer = null;

  function shotIndexAt(t) {
    for (let i = shots.length - 1; i >= 0; i--) if (t >= shots[i].start) return i;
    return 0;
  }

  function drawShot(ctx, i, t) {
    const s = shots[i];
    const fn = F.scenes[s.draw];
    const dur = s.end - s.start;
    const lt = Math.max(0, t - s.start);
    ctx.save();
    // Zustand vollständig zurücksetzen – keine Abhängigkeit vom vorherigen Frame
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.setLineDash([]);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    fn(ctx, Math.min(lt, dur + 2), dur, s.p || {}, t);
    ctx.restore();
  }

  function renderFrame(ctx, t) {
    const W = cfg.width, H = cfg.height;
    t = Math.max(0, Math.min(t, cfg.duration - 1e-6));
    const i = shotIndexAt(t);
    const s = shots[i];
    const lt = t - s.start;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (s.fade && s.dip && lt < s.fade && i > 0) {
      // Abblende: vorherige Einstellung -> Farbe -> aktuelle Einstellung
      const h = s.fade / 2;
      const first = lt < h;
      drawShot(ctx, first ? i - 1 : i, t);
      ctx.globalAlpha = F.u.ease.inOutSine(first ? lt / h : 1 - (lt - h) / h);
      ctx.fillStyle = s.dip;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    } else if (s.fade && lt < s.fade && i > 0) {
      // Überblendung: vorherige Einstellung (weiterlaufend) + aktuelle mit Alpha
      drawShot(ctx, i - 1, t);
      if (!buffer) {
        buffer = document.createElement('canvas');
        buffer.width = W;
        buffer.height = H;
      }
      const b = buffer.getContext('2d');
      b.setTransform(1, 0, 0, 1, 0, 0);
      b.clearRect(0, 0, W, H);
      drawShot(b, i, t);
      ctx.globalAlpha = F.u.ease.inOutSine(lt / s.fade);
      ctx.drawImage(buffer, 0, 0);
      ctx.globalAlpha = 1;
    } else {
      drawShot(ctx, i, t);
    }
    ctx.restore();
    return i;
  }

  function sceneAt(t) {
    return cfg.scenes.find((s) => t >= s.start && t < s.end) || cfg.scenes[cfg.scenes.length - 1];
  }

  F.renderFrame = renderFrame;
  F.shotIndexAt = shotIndexAt;
  F.sceneAt = sceneAt;
  F.duration = cfg.duration;
})();
