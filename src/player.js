/* Vorschau-Player: Wiedergabe, Spulen, Ton, Vollbild, Echtzeit-Export (WebM/MediaRecorder).
   Die Bedienoberfläche liegt außerhalb des Canvas und erscheint nie im Film. */
(function () {
  const F = window.FILM;
  const cfg = F.config;
  const DUR = cfg.duration;
  const $ = (id) => document.getElementById(id);
  const canvas = $('film');
  const ctx = canvas.getContext('2d', { alpha: false });
  const params = new URLSearchParams(location.search);

  const state = { t: 0, playing: false, perf0: 0, t0: 0, recording: null, lastShot: -1 };

  const fmt = (t) => {
    const m = Math.floor(t / 60), s = t - m * 60;
    return String(m).padStart(2, '0') + ':' + s.toFixed(1).padStart(4, '0');
  };

  function draw() {
    F.renderFrame(ctx, state.t);
    $('tNow').textContent = fmt(state.t);
    if (!state.scrubbing) $('scrub').value = state.t;
    const sc = F.sceneAt(state.t);
    $('sceneLabel').textContent = sc ? sc.label : '';
  }

  function now() {
    const ft = state.audioOn ? F.audio.filmTime() : null;
    if (ft != null) return ft;
    return state.t0 + (performance.now() - state.perf0) / 1000;
  }

  function tick() {
    if (state.playing) {
      let t = now();
      if (t >= DUR) {
        t = DUR - 1 / cfg.fps / 2;
        state.t = t;
        draw();
        pause(true);
        if (state.recording) finishRecording();
        return requestAnimationFrame(tick);
      }
      state.t = Math.max(0, t);
      if (state.audioOn) F.audio.pump(state.t);
      draw();
    }
    requestAnimationFrame(tick);
  }

  function play() {
    if (state.t >= DUR - 0.05) state.t = 0;
    state.playing = true;
    state.t0 = state.t;
    state.perf0 = performance.now();
    document.body.classList.add('playing');
    $('btnPlay').setAttribute('aria-label', 'Pause');
    // Ton startet erst nach Nutzerinteraktion (dieser Aufruf kommt aus einem Klick/Tastendruck)
    try {
      state.audioOn = !!F.audio.start(state.t);
    } catch (e) {
      state.audioOn = false;
    }
  }
  function pause(atEnd) {
    state.playing = false;
    document.body.classList.remove('playing');
    $('btnPlay').setAttribute('aria-label', 'Abspielen');
    F.audio.stop();
    state.audioOn = false;
  }
  function seek(t) {
    state.t = Math.max(0, Math.min(DUR - 1e-3, t));
    if (state.playing) {
      state.t0 = state.t;
      state.perf0 = performance.now();
      try { state.audioOn = !!F.audio.start(state.t); } catch (e) { state.audioOn = false; }
    }
    draw();
  }

  /* --------------------------------------------------------- Bedienung */
  $('btnPlay').addEventListener('click', () => (state.playing ? pause() : play()));
  $('btnRestart').addEventListener('click', () => { seek(0); if (!state.playing) play(); });
  const scrub = $('scrub');
  scrub.max = DUR;
  scrub.step = 1 / cfg.fps;
  scrub.addEventListener('input', () => { state.scrubbing = true; seek(parseFloat(scrub.value)); });
  scrub.addEventListener('change', () => { state.scrubbing = false; });
  $('tDur').textContent = fmt(DUR);
  // Szenenmarken
  const marks = $('marks');
  cfg.scenes.forEach((s) => {
    const m = document.createElement('span');
    m.style.left = (s.start / DUR) * 100 + '%';
    m.title = s.label;
    marks.appendChild(m);
  });

  let muted = false;
  function setMute(m) {
    muted = m;
    F.audio.setMuted(m);
    $('btnMute').setAttribute('aria-pressed', String(m));
    $('muteLabel').textContent = m ? 'Ton aus' : 'Ton an';
  }
  $('btnMute').addEventListener('click', () => setMute(!muted));

  $('btnFull').addEventListener('click', () => {
    const st = $('stage');
    if (document.fullscreenElement) document.exitFullscreen();
    else if (st.requestFullscreen) st.requestFullscreen();
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
    if (state.recording) return;
    const step = e.shiftKey ? 5 : 1;
    switch (e.key) {
      case ' ': e.preventDefault(); state.playing ? pause() : play(); break;
      case 'ArrowRight': e.preventDefault(); seek(state.t + step); break;
      case 'ArrowLeft': e.preventDefault(); seek(state.t - step); break;
      case '.': seek(state.t + 1 / cfg.fps); break;
      case ',': seek(state.t - 1 / cfg.fps); break;
      case 'Home': seek(0); break;
      case 'm': case 'M': setMute(!muted); break;
      case 'f': case 'F': $('btnFull').click(); break;
    }
  });

  /* ------------------------------------------------ Echtzeit-Export */
  const status = $('status');
  function setStatus(msg, rec) {
    status.textContent = msg || '';
    status.classList.toggle('rec', !!rec);
  }
  function pickMime() {
    if (!window.MediaRecorder) return null;
    const list = [
      'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9',
      'video/webm;codecs=vp8', 'video/webm', 'video/mp4;codecs=avc1,mp4a', 'video/mp4',
    ];
    return list.find((m) => MediaRecorder.isTypeSupported(m)) || null;
  }
  function describe(mime) {
    const container = mime.startsWith('video/mp4') ? 'MP4' : 'WebM';
    const codecs = (mime.match(/codecs=([^;]+)/) || [])[1];
    return container + (codecs ? ' (' + codecs.replace(/,/g, ' + ') + ')' : '');
  }

  function startRecording() {
    if (!canvas.captureStream) return setStatus('Export nicht verfügbar: Dieser Browser unterstützt canvas.captureStream nicht.');
    const mime = pickMime();
    if (!mime) return setStatus('Export nicht verfügbar: MediaRecorder wird von diesem Browser nicht unterstützt.');
    pause();
    state.t = 0;
    draw();
    const vStream = canvas.captureStream(cfg.fps);
    const tracks = [...vStream.getVideoTracks()];
    let withAudio = false;
    try {
      const aStream = F.audio.recordStream();
      if (aStream && aStream.getAudioTracks().length) { tracks.push(...aStream.getAudioTracks()); withAudio = true; }
    } catch (e) {}
    const stream = new MediaStream(tracks);
    let rec;
    try {
      rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 16_000_000 });
    } catch (e) {
      return setStatus('Export fehlgeschlagen: ' + e.message);
    }
    const chunks = [];
    rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      F.audio.endRecordStream();
      const type = rec.mimeType || mime;
      const blob = new Blob(chunks, { type });
      const ext = type.startsWith('video/mp4') ? 'mp4' : 'webm';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'der-vertraute-griff.' + ext;
      document.body.appendChild(a);
      a.click();
      a.remove();
      const warn = state.recording && state.recording.hiddenDuring ? ' Hinweis: Der Tab war während der Aufnahme im Hintergrund – die Datei kann Lücken enthalten.' : '';
      setStatus(`Fertig: ${describe(type)}${withAudio ? ' mit Ton' : ' ohne Ton'}, ${(blob.size / 1048576).toFixed(1)} MB.${warn}`);
      state.recording = null;
      document.body.classList.remove('recording');
      $('btnExport').textContent = 'Export';
      $('btnExport').classList.remove('rec');
    };
    state.recording = { rec, mime, hiddenDuring: false };
    document.body.classList.add('recording');
    $('btnExport').textContent = 'Aufnahme abbrechen';
    $('btnExport').classList.add('rec');
    rec.start(500);
    // kurzer Vorlauf, damit der erste Frame sicher erfasst wird
    setTimeout(() => { if (state.recording) play(); }, 250);
    const upd = () => {
      if (!state.recording) return;
      setStatus(`Aufnahme läuft (${describe(mime)}): ${fmt(state.t)} / ${fmt(DUR)} – bitte Tab sichtbar lassen, nicht wechseln.`, true);
      requestAnimationFrame(upd);
    };
    upd();
  }
  function finishRecording() {
    const r = state.recording;
    if (!r) return;
    setTimeout(() => r.rec.state !== 'inactive' && r.rec.stop(), 400);
  }
  $('btnExport').addEventListener('click', () => {
    if (state.recording) {
      state.recording.cancelled = true;
      pause();
      state.recording.rec.onstop = () => { F.audio.endRecordStream(); state.recording = null; document.body.classList.remove('recording'); $('btnExport').textContent = 'Export'; $('btnExport').classList.remove('rec'); setStatus('Aufnahme abgebrochen.'); };
      state.recording.rec.stop();
      return;
    }
    startRecording();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.recording) state.recording.hiddenDuring = true;
  });

  /* ------------------------------------- Einzelbilder / Automatisierung */
  if (params.has('clean')) document.body.classList.add('clean');
  F.player = { seek, play, pause, get t() { return state.t; }, canvas, ctx };
  // Einzelbild zu festem Zeitpunkt: index.html?t=42.5 (optional &clean)
  const startT = params.has('t') ? parseFloat(params.get('t')) : 0;
  const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.all([ready, document.fonts ? document.fonts.load("700 40px 'FilmSans'") : null, document.fonts ? document.fonts.load("400 40px 'FilmSans'") : null, F.ki && F.ki.ready])
    .catch(() => {})
    .then(() => {
      state.t = isFinite(startT) ? startT : 0;
      draw();
      window.__filmReady = true;
      if (!params.has('render')) requestAnimationFrame(tick);
    });
})();
