/* Web-Audio: dezente, synthetisch erzeugte Musik + abstrahierte Geräusche.
   Alle Ereignisse liegen als deterministische Liste (Filmzeit) vor und werden
   - live (AudioContext, mit Spulen/Springen) oder
   - offline (OfflineAudioContext, für den Video-Export) geplant. */
(function () {
  const F = (window.FILM = window.FILM || {});
  const cfg = F.config;
  const A = cfg.audio;
  const DUR = cfg.duration;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ------------------------------------------------------ Ereignisliste */
  function buildEvents() {
    const ev = [];
    const beat = 60 / A.bpm; // 0,5 s
    const bar = beat * 4; // 2 s
    const R = F.u.rng(2024);

    // Harmonien (MIDI)
    const CH = {
      F: { bass: 41, notes: [57, 60, 64, 67] }, // Fmaj9
      Dm: { bass: 38, notes: [53, 57, 60, 64] }, // Dm9
      Bb: { bass: 46, notes: [57, 62, 65, 69] }, // Bbmaj7
      Csus: { bass: 48, notes: [55, 60, 62, 65] }, // C9sus4
      FA: { bass: 45, notes: [57, 60, 64, 67] }, // F/A
      Gm: { bass: 43, notes: [55, 58, 62, 65] }, // Gm7
      C: { bass: 48, notes: [55, 60, 64, 67] }, // C(add9)
      Fadd: { bass: 41, notes: [60, 65, 67, 69] }, // Fadd9 (Schluss)
    };
    // Abschnitte: [start, end, Progression, Pluck-Dichte, Pad-Gain, Muster]
    const sections = [
      [0, 14, ['F', 'Dm', 'Bb', 'Csus'], 2, 1.0, 'a'],
      [14, 19, ['F', 'Dm', 'Bb', 'Csus'], 4, 1.0, 'a'],
      [19, 22.5, ['F', 'Dm', 'Bb', 'Csus'], 4, 1.0, 'a'],
      [22.5, 25, ['F', 'Dm', 'Bb', 'Csus'], 4, 1.0, 'a'],
      [25, 30, ['Bb', 'Csus'], 1, 0.9, 'a'],
      [30, 43, ['Bb', 'FA', 'Gm', 'Csus'], 2, 0.95, 'b'],
      [43, 47.6, ['F', 'Dm', 'Bb', 'Csus'], 4, 0.9, 'a'],
      [47.6, 59, ['Dm'], 0, 0.35, '-'],
      [59, 67.6, ['Bb', 'Gm'], 1, 0.6, 'b'],
      [67.6, 71, ['Dm', 'Bb'], 2, 0.85, 'c'],
      [71, 78, ['F', 'C', 'Dm', 'Bb'], 3, 0.9, 'c'],
      [78, 85, ['Bb', 'Csus', 'Dm', 'Csus'], 1, 0.8, 'c'],
      [85, DUR, ['Fadd'], 1, 0.85, 'end'],
    ];
    const chordLen = 4 * beat * 2; // 4 s
    sections.forEach(([s0, s1, prog, dens, padG, pat], si) => {
      // Pads: Akkordwechsel alle 4 s, ab Abschnittsbeginn
      let ci = 0;
      for (let t = s0; t < s1 - 0.01; t += chordLen, ci++) {
        const ch = CH[prog[ci % prog.length]];
        const d = Math.min(chordLen, s1 - t);
        const fadeOut = s1 >= DUR - 0.01;
        ev.push({ t, type: 'pad', d: fadeOut ? DUR - t : d + 0.6, notes: ch.notes, g: padG, end: fadeOut });
        if (pat !== '-') ev.push({ t, type: 'bass', d: fadeOut ? DUR - t : d, f: mtof(ch.bass), g: padG * (pat === 'end' ? 0.8 : 1) });
        // Plucks
        if (dens > 0) {
          const step = bar / (dens * 2); // dens 1 → Halbe, 2 → Viertel, 4 → Achtel
          const motif = pat === 'c' ? [3, 1, 2, 0, 3, 2, 1, 2] : pat === 'b' ? [0, 2, 1, 3, 2, 1] : [0, 1, 2, 3, 2, 1];
          let k = 0;
          const qStart = Math.ceil((t - 1e-6) / step) * step;
          for (let tt = qStart; tt < t + d - 0.01; tt += step, k++) {
            const n = ch.notes[motif[k % motif.length]] + (pat === 'c' ? 12 : 12);
            const accent = Math.abs((tt / beat) % 2) < 0.01 ? 1 : 0.72;
            ev.push({ t: tt, type: 'pluck', f: mtof(n), g: accent * (dens >= 4 ? 0.8 : 1) * (0.9 + R() * 0.1) });
          }
        }
      }
    });
    // Rhythmische Verdichtung der Montage: weicher Puls + feine Ticks
    for (let t = 14; t < 24 - 0.01; t += beat) ev.push({ t, type: 'pulse', g: t < 19 ? 0.6 : t < 22.5 ? 0.8 : 1 });
    for (let t = 19; t < 24 - 0.01; t += beat / 2) ev.push({ t, type: 'tick', g: t < 22.5 ? 0.5 : 0.8 });
    for (let t = 43; t < 47.6 - 0.01; t += beat) ev.push({ t, type: 'pulse', g: 0.6 });
    // Leichter Puls in der Fahrt (Variation)
    for (let t = 71.5; t < 78 - 0.01; t += beat * 2) ev.push({ t, type: 'pulse', g: 0.35 });

    // Geräusche aus den Einstellungen ableiten
    cfg.shots.forEach((s) => {
      const d = s.end - s.start, p = s.p || {};
      const at = (x, type, extra) => ev.push(Object.assign({ t: s.start + x, type }, extra || {}));
      switch (s.draw) {
        case 'cup':
          if (p.mode === 'full') { at(0, 'pour', { d: 1.35 }); at(2.72, 'clink'); } else at(0.5 * d, 'clink');
          break;
        case 'key':
          at(p.mode === 'full' ? 0.72 : 0.08 * d, 'jingle');
          break;
        case 'bag': at(0.72, 'rustle'); break;
        case 'door': at(0.36, 'latch'); at(2.15, 'thud'); break;
        case 'belt': at(p.mode === 'full' || p.mode === 'coat' ? 1.0 : 0.5 * d, 'belt'); break;
        case 'navi':
          if (p.mode === 'morning') at(2.42, 'tap');
          if (p.mode === 'tap') at(0.42 * d, 'tap');
          if (p.mode === 'dialog') { at(0.45, 'select'); at(2.3, 'tap'); }
          if (p.mode === 'select') { at(2.25, 'select'); at(3.85, 'tap'); }
          break;
        case 'handle': at(0.62, 'latch', { g: 0.6 }); break;
        case 'boarding': at(0.12, 'latch'); at(4.35, 'thud'); break;
        case 'drive': at(0.4, 'engine', { d: 5.5 }); break;
      }
    });
    ev.sort((a, b) => a.t - b.t);
    return ev;
  }

  /* ------------------------------------------------------------ Stimmen */
  function noiseBuffer(ctx) {
    if (ctx.__noise) return ctx.__noise;
    const len = ctx.sampleRate * 2;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = b.getChannelData(0);
    const r = F.u.rng(99);
    for (let i = 0; i < len; i++) ch[i] = r() * 2 - 1;
    ctx.__noise = b;
    return b;
  }
  // Hüllkurve ohne Klicks: immer von 0 aus, immer auf 0 zurück
  function env(g, t0, a, peak, hold, rel) {
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    if (hold > 0) g.gain.setValueAtTime(peak, t0 + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + hold + rel);
    g.gain.linearRampToValueAtTime(0, t0 + a + hold + rel + 0.02);
    return t0 + a + hold + rel + 0.05;
  }

  function play(ctx, out, e, when, offset) {
    // offset > 0: Ereignis lief bereits (Springen) – nur lange Klänge werden nachgeholt
    const nb = noiseBuffer(ctx);
    const musicG = A.musicGain, sfxG = A.sfxGain;
    const osc = (type, f, detune = 0) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = detune;
      return o;
    };
    const noise = (t0, d) => {
      const s = ctx.createBufferSource();
      s.buffer = nb;
      s.loop = true;
      s.start(t0, (e.t * 7.3) % 1.5);
      s.stop(t0 + d + 0.1);
      return s;
    };
    switch (e.type) {
      case 'pad': {
        const d = e.d - offset;
        if (d < 0.3) return;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1100;
        lp.Q.value = 0.4;
        const g = ctx.createGain();
        lp.connect(g);
        g.connect(out);
        const att = offset > 0 ? 0.3 : 1.4;
        const peak = 0.045 * e.g * musicG;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(peak, when + att);
        const relStart = Math.max(when + att + 0.05, when + d - (e.end ? 2.2 : 1.0));
        g.gain.setValueAtTime(peak, relStart);
        g.gain.linearRampToValueAtTime(0, when + d + (e.end ? 0 : 0.4));
        e.notes.forEach((n, i) => {
          [-5, 5].forEach((dt) => {
            const o = osc(i % 2 ? 'sine' : 'triangle', mtof(n), dt);
            o.connect(lp);
            o.start(when);
            o.stop(when + d + 0.6);
          });
        });
        break;
      }
      case 'bass': {
        const d = e.d - offset;
        if (d < 0.3) return;
        const g = ctx.createGain();
        g.connect(out);
        const o = osc('sine', e.f);
        o.connect(g);
        const peak = 0.07 * e.g * musicG;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(peak, when + (offset > 0 ? 0.2 : 0.5));
        g.gain.setValueAtTime(peak, Math.max(when + 0.6, when + d - 0.8));
        g.gain.linearRampToValueAtTime(0, when + d + 0.2);
        o.start(when);
        o.stop(when + d + 0.3);
        break;
      }
      case 'pluck': {
        if (offset > 0.05) return;
        const g = ctx.createGain();
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2600;
        g.connect(lp);
        lp.connect(out);
        const end = env(g, when, 0.006, 0.05 * e.g * musicG, 0, 0.9);
        [[1, 1], [2, 0.25], [3.98, 0.06]].forEach(([m, a]) => {
          const og = ctx.createGain();
          og.gain.value = a;
          const o = osc('sine', e.f * m);
          o.connect(og);
          og.connect(g);
          o.start(when);
          o.stop(end);
        });
        break;
      }
      case 'pulse': {
        if (offset > 0.05) return;
        const g = ctx.createGain();
        g.connect(out);
        const o = osc('sine', 90);
        o.frequency.setValueAtTime(92, when);
        o.frequency.exponentialRampToValueAtTime(48, when + 0.16);
        o.connect(g);
        const end = env(g, when, 0.008, 0.16 * e.g * musicG, 0, 0.32);
        o.start(when);
        o.stop(end);
        break;
      }
      case 'tick': {
        if (offset > 0.05) return;
        const g = ctx.createGain();
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 6500;
        hp.connect(g);
        g.connect(out);
        const end = env(g, when, 0.002, 0.018 * e.g * musicG, 0, 0.05);
        noise(when, end - when).connect(hp);
        break;
      }
      case 'pour': {
        const d = e.d - offset;
        if (d < 0.2) return;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1100;
        bp.Q.value = 0.8;
        const g = ctx.createGain();
        bp.connect(g);
        g.connect(out);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(0.03 * sfxG, when + 0.08);
        g.gain.setValueAtTime(0.03 * sfxG, when + d - 0.25);
        g.gain.linearRampToValueAtTime(0, when + d);
        noise(when, d).connect(bp);
        break;
      }
      case 'clink': {
        if (offset > 0.05) return;
        const g = ctx.createGain();
        g.connect(out);
        [[2350, 0.035, 0.32], [3710, 0.018, 0.22], [5200, 0.006, 0.12], [190, 0.06, 0.09]].forEach(([f, a, r]) => {
          const og = ctx.createGain();
          og.connect(g);
          const o = osc('sine', f);
          o.connect(og);
          const end = env(og, when, 0.002, a * sfxG, 0, r);
          o.start(when);
          o.stop(end);
        });
        g.gain.value = 1;
        break;
      }
      case 'jingle': {
        if (offset > 0.05) return;
        const r = F.u.rng(Math.floor(e.t * 100));
        for (let i = 0; i < 6; i++) {
          const tt = when + i * 0.035 + r() * 0.03;
          const og = ctx.createGain();
          og.connect(out);
          const o = osc('sine', 3200 + r() * 2600);
          o.connect(og);
          const end = env(og, tt, 0.002, (0.012 + r() * 0.01) * sfxG, 0, 0.14 + r() * 0.1);
          o.start(tt);
          o.stop(end);
        }
        break;
      }
      case 'rustle': {
        if (offset > 0.05) return;
        const lp = ctx.createBiquadFilter();
        lp.type = 'bandpass';
        lp.frequency.value = 700;
        lp.Q.value = 0.6;
        const g = ctx.createGain();
        lp.connect(g);
        g.connect(out);
        const end = env(g, when, 0.06, 0.03 * sfxG, 0.1, 0.25);
        noise(when, end - when).connect(lp);
        break;
      }
      case 'latch': {
        if (offset > 0.05) return;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2200;
        bp.Q.value = 2;
        const g = ctx.createGain();
        bp.connect(g);
        g.connect(out);
        const end = env(g, when, 0.002, 0.05 * (e.g || 1) * sfxG, 0, 0.06);
        noise(when, end - when).connect(bp);
        break;
      }
      case 'thud': {
        if (offset > 0.05) return;
        const g = ctx.createGain();
        g.connect(out);
        const o = osc('sine', 72);
        o.frequency.setValueAtTime(80, when);
        o.frequency.exponentialRampToValueAtTime(45, when + 0.2);
        o.connect(g);
        const end = env(g, when, 0.004, 0.17 * sfxG, 0, 0.26);
        o.start(when);
        o.stop(end);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 400;
        const g2 = ctx.createGain();
        lp.connect(g2);
        g2.connect(out);
        const end2 = env(g2, when, 0.003, 0.06 * sfxG, 0, 0.14);
        noise(when, end2 - when).connect(lp);
        break;
      }
      case 'belt': {
        if (offset > 0.05) return;
        [0, 0.045].forEach((dt, i) => {
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = i ? 3400 : 2600;
          bp.Q.value = 3;
          const g = ctx.createGain();
          bp.connect(g);
          g.connect(out);
          const end = env(g, when + dt, 0.001, (i ? 0.06 : 0.04) * sfxG, 0, 0.045);
          noise(when + dt, end - when - dt).connect(bp);
        });
        break;
      }
      case 'tap':
      case 'select': {
        if (offset > 0.05) return;
        const notes = e.type === 'select' ? [[79, 0], [84, 0.07]] : [[84, 0]];
        notes.forEach(([m, dt]) => {
          const g = ctx.createGain();
          g.connect(out);
          const o = osc('sine', mtof(m));
          o.connect(g);
          const end = env(g, when + dt, 0.008, 0.02 * sfxG, 0, 0.22);
          o.start(when + dt);
          o.stop(end);
        });
        break;
      }
      case 'engine': {
        const d = e.d - offset;
        if (d < 0.3) return;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 160;
        const g = ctx.createGain();
        lp.connect(g);
        g.connect(out);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(0.07 * sfxG, when + 1.4);
        g.gain.linearRampToValueAtTime(0.05 * sfxG, when + d - 1.5);
        g.gain.linearRampToValueAtTime(0, when + d);
        noise(when, d).connect(lp);
        break;
      }
    }
  }

  function makeChain(ctx, dest) {
    const bus = ctx.createGain();
    bus.gain.value = 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
    const master = ctx.createGain();
    master.gain.value = A.masterGain;
    bus.connect(comp);
    comp.connect(master);
    master.connect(dest);
    return { bus, comp, master };
  }

  /* -------------------------------------------------------- Live-Engine */
  const live = {
    ctx: null, events: null, session: null, muted: false, out: null, recDest: null,
  };
  function ensureCtx() {
    if (!live.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      live.ctx = new AC({ latencyHint: 'playback' });
      live.out = live.ctx.createGain();
      live.out.gain.value = live.muted ? 0 : 1;
      live.out.connect(live.ctx.destination);
      live.events = buildEvents();
    }
    return live.ctx;
  }
  function stopSession() {
    const s = live.session;
    if (!s) return;
    const ctx = live.ctx;
    const now = ctx.currentTime;
    s.chain.bus.gain.cancelScheduledValues(now);
    s.chain.bus.gain.setValueAtTime(s.chain.bus.gain.value, now);
    s.chain.bus.gain.linearRampToValueAtTime(0, now + 0.06);
    const m = s.chain.master;
    setTimeout(() => { try { m.disconnect(); } catch (e) {} }, 200);
    live.session = null;
  }
  // Start ab Filmzeit t0; liefert Abbildung Filmzeit <-> Audiozeit
  function start(t0) {
    const ctx = ensureCtx();
    if (!ctx) return null;
    if (ctx.state === 'suspended') ctx.resume();
    stopSession();
    const chain = makeChain(ctx, live.out);
    if (live.recDest) chain.master.connect(live.recDest);
    const a0 = ctx.currentTime + 0.08;
    const s = { chain, a0, t0, cursor: t0 - 1e-4 };
    // Bereits laufende lange Klänge nachholen
    live.events.forEach((e) => {
      if (e.d && e.t < t0 && e.t + e.d > t0 + 0.3) play(ctx, chain.bus, e, a0, t0 - e.t);
    });
    live.session = s;
    pump(t0);
    return s;
  }
  // Vorausplanung (Fenster ~0,6 s) – vom Player pro Frame aufgerufen
  function pump(filmNow) {
    const s = live.session;
    if (!s) return;
    const horizon = filmNow + 0.6;
    for (const e of live.events) {
      if (e.t <= s.cursor) continue;
      if (e.t > horizon) break;
      play(live.ctx, s.chain.bus, e, s.a0 + (e.t - s.t0), 0);
    }
    s.cursor = Math.max(s.cursor, horizon);
  }
  function filmTime() {
    const s = live.session;
    if (!s) return null;
    return s.t0 + (live.ctx.currentTime - s.a0);
  }
  function setMuted(m) {
    live.muted = m;
    if (live.out) {
      const now = live.ctx.currentTime;
      live.out.gain.cancelScheduledValues(now);
      live.out.gain.setValueAtTime(live.out.gain.value, now);
      live.out.gain.linearRampToValueAtTime(m ? 0 : 1, now + 0.08);
    }
  }
  function recordStream() {
    const ctx = ensureCtx();
    if (!ctx || !ctx.createMediaStreamDestination) return null;
    live.recDest = ctx.createMediaStreamDestination();
    return live.recDest.stream;
  }
  function endRecordStream() {
    live.recDest = null;
  }

  /* ------------------------------------------------------ Offline-Render */
  async function renderOffline(sr = 48000) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const ctx = new OAC(2, Math.ceil(sr * DUR), sr);
    const chain = makeChain(ctx, ctx.destination);
    buildEvents().forEach((e) => play(ctx, chain.bus, e, e.t, 0));
    const buf = await ctx.startRendering();
    return buf;
  }
  function toWav(buf) {
    const nCh = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
    const data = new DataView(new ArrayBuffer(44 + len * nCh * 2));
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); data.setUint32(4, 36 + len * nCh * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
    data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, nCh, true);
    data.setUint32(24, sr, true); data.setUint32(28, sr * nCh * 2, true); data.setUint16(32, nCh * 2, true);
    data.setUint16(34, 16, true); ws(36, 'data'); data.setUint32(40, len * nCh * 2, true);
    const chans = [];
    for (let c = 0; c < nCh; c++) chans.push(buf.getChannelData(c));
    let o = 44, peak = 0;
    for (let i = 0; i < len; i++) for (let c = 0; c < nCh; c++) {
      const v = Math.max(-1, Math.min(1, chans[c][i]));
      peak = Math.max(peak, Math.abs(v));
      data.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      o += 2;
    }
    return { bytes: new Uint8Array(data.buffer), peak };
  }

  F.audio = { buildEvents, start, stop: stopSession, pump, filmTime, setMuted, ensureCtx, recordStream, endRecordStream, renderOffline, toWav, live };
})();
