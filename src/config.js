/* =========================================================================
   Der vertraute Griff – Rethink the Routine
   Zentrale Konfiguration: Texte, Farben, Timing, Audio.
   Alle Zeiten in Sekunden. Der Film ist rein deterministisch:
   jeder Bildzustand ergibt sich ausschließlich aus der Zeit t.
   ========================================================================= */
(function () {
  const F = (window.FILM = window.FILM || {});

  F.config = {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 90,
    safe: 90, // Mindest-Außenabstand für Texte (px)

    font: "'FilmSans', 'Helvetica Neue', Helvetica, Arial, sans-serif",

    colors: {
      gold: '#FFD100', // Rinvoq Gold – alternative Route, Callout
      charcoal: '#25282A', // Rinvoq Charcoal
      white: '#FFFFFF',
      teal: '#366B8F', // Deep Teal 2 – vertraute (gespeicherte) Route
      plum: '#90124A', // optional – in diesem Film bewusst nicht verwendet

      // Neutrale Welt (Figuren, Auto, Räume)
      paper: '#F4F2EE',
      mapBg: '#F3F1EC',
      mapLand: '#E9E6E0',
      mapPark: '#E4E6DE',
      mapWater: '#DFE3E6',
      ink: '#25282A',
      dash: '#2B2E30',
      dashLight: '#3A3E41',
      seat: '#33373A',
      carBody: '#B8B5AF',
      carShade: '#8F8C86',
      carLight: '#D3D0CA',
      glass: '#3B4146',
    },

    // Figuren – bewusst neutral, keiner Produktfarbe zugeordnet
    people: {
      doctor: {
        skin: '#E3B692', skinShade: '#C99772', skinLine: '#9E6F50',
        hair: '#4E4239', hairGrey: '#A39A91', glasses: true,
        coat: '#F1F1EE', coatShade: '#D6D7D3', shirt: '#CBCFD1',
        pants: '#4A4C50', shoes: '#2C2D2F',
        badge: '#FFFFFF',
      },
      patient: {
        skin: '#8E5D3E', skinShade: '#744830', skinLine: '#4F2F1E',
        hair: '#1E1916', jacket: '#6E7256', jacketShade: '#585C44',
        top: '#D9CFC0', pants: '#3A3936', shoes: '#5A4636',
      },
    },

    // Tagesvarianten der Morgenroutine (Licht, Wetter, Kleidung)
    days: {
      0: { sky: '#E8ECEE', sky2: '#F5F6F6', wall: '#F2F0EC', grade: 'rgba(255,248,235,0.04)', sweater: '#CBBCA3', sweaterShade: '#B2A288', rain: 0, sun: 0.5 },
      1: { sky: '#F6E4CB', sky2: '#FBF2E6', wall: '#F3EEE7', grade: 'rgba(255,196,140,0.07)', sweater: '#CBBCA3', sweaterShade: '#B2A288', rain: 0, sun: 0.7 },
      2: { sky: '#D8DCDF', sky2: '#E7E9EA', wall: '#EDEDEB', grade: 'rgba(120,138,155,0.07)', sweater: '#7F7B76', sweaterShade: '#6A6661', rain: 0, sun: 0 },
      3: { sky: '#C3C9CE', sky2: '#D5DADD', wall: '#E9E9E7', grade: 'rgba(100,118,135,0.09)', sweater: '#9D8369', sweaterShade: '#866D55', rain: 1, sun: 0 },
      4: { sky: '#E6EEF2', sky2: '#F6F8F9', wall: '#F4F2EE', grade: 'rgba(255,240,215,0.05)', sweater: '#5F5C58', sweaterShade: '#4D4A47', rain: 0, sun: 1 },
    },

    texts: {
      card1: ['Was sich bewährt,', 'wird selbstverständlich.'],
      card2: ['Passt der vertraute Weg', 'auch diesmal?'],
      final: {
        lead: ['Bewährte Wege geben Sicherheit.'],
        main: ['Doch welcher passt wirklich', 'zu diesem Patienten?'],
      },
      callout: { line1: 'Rethink', line2: 'the Routine' },
      navi: {
        saved: 'Gespeicherte Route',
        confirm: 'Bestätigen',
        routes: 'Routen',
      },
    },

    /* Szenen (für Zeitleiste/README) */
    scenes: [
      { id: 'morgen', label: 'Der vertraute Morgen', start: 0, end: 14 },
      { id: 'montage', label: 'Wiederholung wird Routine', start: 14, end: 25 },
      { id: 'card1', label: 'Texttafel 1', start: 25, end: 30 },
      { id: 'patient', label: 'Der konkrete Patient', start: 30, end: 43 },
      { id: 'griff', label: 'Der automatische Griff', start: 43, end: 53 },
      { id: 'card2', label: 'Die Frage', start: 53, end: 59 },
      { id: 'auswahl', label: 'Bewusste Auswahl', start: 59, end: 71 },
      { id: 'fahrt', label: 'Gemeinsam losfahren', start: 71, end: 78 },
      { id: 'final', label: 'Schlussgedanke', start: 78, end: 85 },
      { id: 'callout', label: 'Rethink the Routine', start: 85, end: 90 },
    ],

    /* Einstellungen. fade = Überblendung (s) aus der vorherigen Einstellung;
       dip = Abblende über diese Farbe (für Übergänge mit Texttafeln). */
    shots: [
      // 00:00–00:14 Der vertraute Morgen
      { start: 0.0, end: 3.0, draw: 'cup', p: { day: 1, mode: 'full' } },
      { start: 3.0, end: 4.6, draw: 'key', p: { day: 1, mode: 'full' } },
      { start: 4.6, end: 6.4, draw: 'bag', p: { day: 1 } },
      { start: 6.4, end: 8.8, draw: 'door', p: { day: 1 } },
      { start: 8.8, end: 10.4, draw: 'belt', p: { day: 1, mode: 'full' } },
      { start: 10.4, end: 14.0, draw: 'navi', p: { day: 1, mode: 'morning' } },

      // 00:14–00:25 Wiederholung – Tag 2 (1,0 s), Tag 3 (0,7 s), Tag 4 (0,5 s)
      { start: 14.0, end: 15.0, draw: 'cup', p: { day: 2, mode: 'beat' } },
      { start: 15.0, end: 16.0, draw: 'key', p: { day: 2, mode: 'beat' } },
      { start: 16.0, end: 17.0, draw: 'belt', p: { day: 2, mode: 'beat' } },
      { start: 17.0, end: 18.0, draw: 'navi', p: { day: 2, mode: 'route' } },
      { start: 18.0, end: 19.0, draw: 'navi', p: { day: 2, mode: 'tap' } },
      { start: 19.0, end: 19.7, draw: 'cup', p: { day: 3, mode: 'beat' } },
      { start: 19.7, end: 20.4, draw: 'key', p: { day: 3, mode: 'beat' } },
      { start: 20.4, end: 21.1, draw: 'belt', p: { day: 3, mode: 'beat' } },
      { start: 21.1, end: 21.8, draw: 'navi', p: { day: 3, mode: 'route' } },
      { start: 21.8, end: 22.5, draw: 'navi', p: { day: 3, mode: 'tap' } },
      { start: 22.5, end: 23.0, draw: 'cup', p: { day: 4, mode: 'beat' } },
      { start: 23.0, end: 23.5, draw: 'key', p: { day: 4, mode: 'beat' } },
      { start: 23.5, end: 24.0, draw: 'belt', p: { day: 4, mode: 'beat' } },
      { start: 24.0, end: 24.5, draw: 'navi', p: { day: 4, mode: 'route' } },
      { start: 24.5, end: 25.0, draw: 'navi', p: { day: 4, mode: 'tap' } },

      // 00:25–00:30 Texttafel 1
      { start: 25.0, end: 30.0, draw: 'card', p: { key: 'card1', theme: 'light' } },

      // 00:30–00:43 Der konkrete Patient
      { start: 30.0, end: 33.0, draw: 'practice', p: {}, fade: 0.7, dip: '#FFFFFF' },
      { start: 33.0, end: 37.0, draw: 'greet', p: {} },
      { start: 37.0, end: 38.0, draw: 'handle', p: {} },
      { start: 38.0, end: 39.0, draw: 'carhandle', p: {} },
      { start: 39.0, end: 43.0, draw: 'boarding', p: {} },

      // 00:43–00:53 Der automatische Griff
      { start: 43.0, end: 44.6, draw: 'belt', p: { day: 0, mode: 'coat' } },
      { start: 44.6, end: 46.6, draw: 'navi', p: { day: 0, mode: 'approach' } },
      { start: 46.6, end: 50.0, draw: 'cabin', p: { mode: 'pause' } },
      { start: 50.0, end: 53.0, draw: 'navi', p: { day: 0, mode: 'hover' } },

      // 00:53–00:59 Die Frage
      { start: 53.0, end: 59.0, draw: 'card', p: { key: 'card2', theme: 'dark' }, fade: 0.9, dip: '#25282A' },

      // 00:59–01:11 Bewusste Auswahl
      { start: 59.0, end: 62.4, draw: 'navi', p: { day: 0, mode: 'overview' }, fade: 0.7, dip: '#25282A' },
      { start: 62.4, end: 65.4, draw: 'cabin', p: { mode: 'consider' } },
      { start: 65.4, end: 71.0, draw: 'navi', p: { day: 0, mode: 'select' } },

      // 01:11–01:18 Gemeinsam losfahren
      { start: 71.0, end: 74.0, draw: 'drive', p: {} },
      { start: 74.0, end: 78.0, draw: 'aerial', p: {}, fade: 0.8 },

      // 01:18–01:25 Schlussgedanke
      { start: 78.0, end: 85.0, draw: 'card', p: { key: 'final', theme: 'light' }, fade: 0.7, dip: '#FFFFFF' },

      // 01:25–01:30 Marken-Callout
      { start: 85.0, end: 90.0, draw: 'callout', p: {}, fade: 0.6, dip: '#25282A' },
    ],

    audio: {
      masterGain: 1.5,
      bpm: 120,
      musicGain: 0.5,
      sfxGain: 0.55,
      // Ereignisse der Geräusche (Sekunden) – werden aus den Einstellungen abgeleitet,
      // hier nur globale Parameter.
      duckPause: { start: 47.6, end: 59.0 }, // musikalische Zurücknahme beim Innehalten
      variationFrom: 67.6, // leichte Variation nach der bewussten Auswahl
    },
  };
})();
