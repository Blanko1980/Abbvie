# Der vertraute Griff – Rethink the Routine

Ein vollständig programmatisch erzeugter Animationsfilm (Entwurf, Fassung 2, 92,5 s, 1920 × 1080, 30 fps).
Alle Bilder, Figuren, Bewegungen, Texte und Klänge entstehen im Code: HTML5 Canvas 2D und Web Audio API.
Es gibt keine externen Assets, kein CDN und keinen Build-Schritt.

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

`export/der-vertraute-griff.mp4`: H.264 + AAC, 1920 × 1080, 30 fps, 92,5 s.
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

- Die Aufnahme startet immer bei 00:00 und dauert 92,5 s.
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

Zufallswerte (Pinseltextur, Regen, Schlüsselklang) sind deterministisch geseedet.
Es gibt keine frameabhängigen Fortschreibungen und keine `setTimeout`-Animationsketten.

## Timing

Das vollständige Drehbuch mit allen Änderungen der Fassung 2 steht in [SKRIPT.md](SKRIPT.md).

| Zeit | Szene |
|---|---|
| 00:00–00:14 | Der vertraute Morgen (Navi zeigt nur die gespeicherte Route) |
| 00:14–00:27,5 | Wiederholung wird Routine. Tag 2–4, dann der Dialog „Neue Route gefunden“, die Hand wählt die gespeicherte Route |
| 00:27,5–00:32,5 | „Was sich bewährt, wird selbstverständlich.“ (Schrift in Dupixent-Farbe) |
| 00:32,5–00:45,5 | Der konkrete Patient (Match Cut: Praxis-Türgriff → Autotürgriff, Hand dreht sich) |
| 00:45,5–00:55,5 | Der automatische Griff („Verfügbare Routen“) |
| 00:55,5–01:01,5 | „Passt der vertraute Weg auch diesmal?“ |
| 01:01,5–01:13,5 | Bewusste Auswahl |
| 01:13,5–01:20,5 | Gemeinsam losfahren |
| 01:20,5–01:27,5 | „Bewährte Wege geben Sicherheit. Doch welcher passt wirklich?“ |
| 01:27,5–01:32,5 | „Rethink the Routine“ |

## Farben und Markenregeln

- **Rinvoq Gold** `#FFD100`: alternative Route, Bestätigen-Button nach der bewussten Wahl, Schlusskarte
- **Charcoal** `#25282A` und **Weiß**: Hintergründe
- **Dupixent-Farbe** `#1D7D7E`: gespeicherte (vertraute) Route und Schrift der ersten Texttafel
- **Plum**: bewusst nicht verwendet
- **Figuren und Auto:** neutral, keiner Produktfarbe zugeordnet

Beide Routen haben denselben Start und dasselbe Ziel.
Die gespeicherte Route ist deutlich länger: 1184 zu 822 Einheiten im Kartenraum.
Sie sind auch über ihre Lage unterscheidbar: die gespeicherte verläuft unten rechts, die goldene oben links.

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
