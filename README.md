# Der vertraute Griff – Rethink the Routine

Animationsfilm (Entwurf, ca. 90 s, 1920 × 1080, 30 fps) im gezeichneten Erklärvideo-Stil.
Die Illustrationen sind KI-generiert (Google Gemini, Stil C, siehe `ki-styleframes/`).
Animation, Kamera, Navi-Grafik, Texte und Klänge entstehen im Code: HTML5 Canvas 2D und Web Audio API.
Es gibt kein CDN und keinen Build-Schritt. Die Bilder sind in `assets/ki/bilder.js` eingebettet.

## Starten

`index.html` direkt im Browser öffnen (Chrome, Edge oder Firefox). Ein Server ist nicht nötig.
Falls ein Browser lokale Dateien blockiert, startet ein einfacher Server so:

```bash
npx serve .        # oder: python3 -m http.server
```

**Bedienung** (außerhalb der Filmfläche):

| Aktion | Bedienung |
|---|---|
| Abspielen/Pause | Leertaste |
| Neustart | Pos1 |
| Springen | ←/→ (1 s), Umschalt + ←/→ (5 s), `,` und `.` (einzelner Frame) |
| Ton an/aus | M |
| Vollbild | F |
| Freies Springen | Zeitleiste mit Szenenmarken |

Der Ton startet erst nach dem ersten Klick auf Abspielen.
Der Film ist auch ohne Ton vollständig verständlich.

**Einzelbild zu einem festen Zeitpunkt:** `index.html?t=47.5`.
Mit `&clean` wird nur die Filmfläche ohne Bedienelemente gezeigt.

## Fertiges Video

`export/der-vertraute-griff.mp4`: H.264 + AAC, 1920 × 1080, 30 fps, 90 s.
Das Video wurde lokal Bild für Bild gerendert, nicht in Echtzeit aufgenommen.
Neu erzeugen lässt es sich mit dem optionalen Render-Werkzeug. Es setzt Playwright mit Chromium sowie ffmpeg voraus:

```bash
node tools/render.cjs video export/der-vertraute-griff.mp4   # MP4 inkl. offline gerendertem Ton
node tools/render.cjs stills 12.5,47,88 qa                   # PNG-Kontrollbilder
node tools/render.cjs audio export/tonspur.wav               # nur Tonspur
```

## Export im Browser

Die Schaltfläche **Export** nimmt den Film in Echtzeit auf (`canvas.captureStream` + `MediaRecorder`, mit Web-Audio-Ton).
Der Player prüft zur Laufzeit, welche Formate der Browser unterstützt, und benennt das tatsächlich erzeugte Format.
In Chrome, Edge und Firefox ist das WebM (VP9/VP8 + Opus).
MP4 entsteht nur, wenn der Browser es selbst anbietet (z. B. Safari).

- Die Aufnahme startet immer bei 00:00 und dauert 90 s.
- Während der Aufnahme den Tab sichtbar lassen. Im Hintergrund drosselt der Browser die Bildrate.
- War der Tab während der Aufnahme im Hintergrund, weist der Status nach dem Export darauf hin.
- Für eine bildgenaue Datei das Render-Werkzeug oben verwenden.

## Aufbau

| Datei | Inhalt |
|---|---|
| `src/config.js` | **Zentrale Konfiguration:** Texte, Farben, Szenen- und Einstellungs-Timing, Tagesvarianten, Audio-Parameter |
| `src/timeline.js` | `renderFrame(t)`: Jeder Bildzustand ergibt sich ausschließlich aus der Zeit. Dazu Überblendungen und Abblenden |
| `src/scenes.js` | Alle Einstellungen (Morgenroutine, Praxis, Auto, Navi, Draufsicht …) |
| `src/figures.js` | Figuren: Kopf mit Blickrichtung, Hände in Nahaufnahme, Gelenkmodell mit IK für Arme und Beine |
| `src/props.js` | Navi-Bildschirm, Routen-Geometrie, Auto seitlich und von oben |
| `src/typography.js` | Texttafeln, deterministischer Pinselstrich, Schlusskarte |
| `src/audio.js` | Synthetische Musik und Geräusche: live (mit Springen) und offline (für den Video-Export) |
| `src/player.js` | Vorschau-Player und Echtzeit-Export |
| `src/ki.js` | KI-Bausteine: ersetzt die Szenen-Zeichnungen durch gezeichnete Platten und Pose-Ebenen, animiert sie (Pose-zu-Pose, Kamera, Hand, Räder) |
| `assets/ki/` | `roh/` = KI-Rohbilder, `meta.js` = Koordinaten, `bilder.js` = eingebettete Bilddaten |
| `prompts/` | Stilvorgaben (`stil.txt`, `stil-c.txt`) und Bildanweisungen aller Bausteine |
| `tools/` | `gen_image.py` (Gemini-Aufruf), `ki_prepare.py` (Aufbereitung), `ki_align.py` (Passgenauigkeit), `render.cjs` (Video) |

## KI-Bausteine neu erzeugen

```bash
export GEMINI_API_KEY=…                     # nie committen
python3 tools/gen_image.py --prompt-file p.txt --out assets/ki/roh/x.jpg --ref vorlage.jpg
python3 tools/ki_prepare.py                 # Rohbilder → assets/ki (meta.js, bilder.js)
node tools/render.cjs video export/der-vertraute-griff.mp4
```

Die frühere, rein programmatische Version ist weiterhin abrufbar: `index.html?code`.

Pose-Varianten sind KI-Bearbeitungen desselben Grundbilds und liegen pixelgenau darauf. `tools/ki_prepare.py` schneidet nur die veränderten Bereiche als weich maskierte Ebenen aus, die im Film überblendet werden.
Zufallswerte (Pinseltextur, Regen, Schlüsselklang) sind deterministisch geseedet.
Es gibt keine frameabhängigen Fortschreibungen und keine `setTimeout`-Animationsketten.

## Timing

| Zeit | Szene |
|---|---|
| 00:00–00:14 | Der vertraute Morgen |
| 00:14–00:25 | Wiederholung wird Routine (Tag 2–4, Schnitte von 1,0 s über 0,7 s auf 0,5 s) |
| 00:25–00:30 | „Was sich bewährt, wird selbstverständlich.“ |
| 00:30–00:43 | Der konkrete Patient (Match Cut: Praxis-Türgriff → Autotürgriff) |
| 00:43–00:53 | Der automatische Griff |
| 00:53–00:59 | „Passt der vertraute Weg auch diesmal?“ |
| 00:59–01:11 | Bewusste Auswahl |
| 01:11–01:18 | Gemeinsam losfahren |
| 01:18–01:25 | Schlussgedanke |
| 01:25–01:30 | „Rethink the Routine“ |

## Farben und Markenregeln

- **Rinvoq Gold** `#FFD100`: alternative Route, Bestätigen-Button nach der bewussten Wahl, Schlusskarte
- **Charcoal** `#25282A` und **Weiß**: Hintergründe
- **Deep Teal 2** `#366B8F`: ausschließlich für die vertraute (gespeicherte) Route
- **Plum**: bewusst nicht verwendet
- **Figuren und Auto:** neutral, keiner Produktfarbe zugeordnet

Beide Routen haben denselben Start und dasselbe Ziel bei nahezu gleicher Länge (Kartenraum: 899 zu 906 Einheiten).
Sie sind zusätzlich über ihre Lage unterscheidbar: Teal verläuft unten rechts, Gold oben links.

## Schrift-Ersatz

Graphik, Neue Haas Grotesk Display und die Rinvoq-Handschrift lagen nicht vor.
Als Ersatz dient **Liberation Sans** (Regular/Bold, SIL Open Font License, siehe `assets/fonts/`).
Sie ist in `styles/fonts.css` eingebettet, damit der Film auf jedem Rechner identisch aussieht.
Es handelt sich ausdrücklich **nicht** um eine Reproduktion der Markenschriften.
Den Callout bildet ein kräftiger Schriftsatz mit leichter Staffelung und programmatisch erzeugtem Gold-Pinselstrich.
Eine Pseudo-Handschrift ist bewusst nicht verwendet.
Die Markenschriften lassen sich später in `styles/fonts.css` und `F.config.font` austauschen.

## Status

Dies ist ein Entwurf. Pflichtangaben, Logo und Freigabenummer sind vereinbarungsgemäß noch nicht enthalten.
