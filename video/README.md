# 10 Jahre Alltag – Route-Explainer (AbbVie · Rinvoq AD, intern)

Animationsfilm, ca. 60 s, 1920×1080 bei 60 fps, Stereo-Ton (AAC). Kein Voice-over: Die Geschichte läuft über On-Screen-Text, Sound und Musik.

**Ergebnis:** `out/10-jahre-alltag.mp4`

Alles ist Code, es gibt keine Stock-Assets, Samples oder Bilddateien:

- **Bild:** Canvas-2D-Animation (`src/*.js`). Jedes Frame ist eine reine Funktion der Zeit `t` und wird in headless Chromium Frame für Frame gerendert.
- **Ton:** Musik und Sounddesign werden in `src/soundtrack.py` mit NumPy/SciPy synthetisiert. Dazu gehören Marimba, Plucks, Supersaws, 808, Drums, Vocal-Chops, Klavier sowie Glasbruch, Münzen, Stempel, Scanner-Beep, Kratzen usw. Hall und Mastering sind ebenfalls Code.
- **Sync:** Bild und Ton lesen dieselbe Cue-Liste `src/timeline.js`. Wenn ein Timing dort verschoben wird, passen sich Animation und Sound automatisch an.

## Ablauf

| Zeit | Bild | Text | Sound |
|---|---|---|---|
| 0–5 s | 2016er-Smartphone, Lockscreen 20:16, Benachrichtigungen (EM-Viertelfinale, „Public Viewing?“) | **2016.** Fühlt sich an wie gestern. | In D-Moll gestimmte Notification-Plings, Tropical-House-Marimba setzt ein |
| 5–8 s | Die Jahreszahl wird zum Zählwerk 2016 → 2026, Display bekommt Risse und zerspringt | Ist aber zehn Jahre her. | Zählwerk-Ticks, Snare-Roll, Riser, Glas-Risse, Glasbruch und Impact zum Drop |
| 8–13 s | Kabelsalat zieht sich zum Knoten zusammen, ploppt zu Earbuds, die magnetisch in die Ladeschale klicken | Kopfhörer entknoten. → Einsetzen. Fertig. | Kabelrascheln, Pop, Magnet-Klicks, Deckel, LED-Ding |
| 13–18 s | iOS-2016-Einstellungen, Toggle „Datenroaming“ auf AUS, Münzregen. Die Münzen fliegen in eine leuchtende Europakarte | Roaming aus, sonst teuer. → Seit 2017: surfen wie zu Hause. | Toggle-Klick, Münzklimpern, Daten-Chime |
| 18–23 s | Münzstapel wächst auf 74 %, schrumpft auf 51 %, Karte tippt aufs Terminal | 2017: 74 % bar bezahlt. → 2023: nur noch 51 %. | Münzen in aufsteigender Tonhöhe, Kassen-„Ka-Ching“, NFC-Beep |
| 23–28 s | Go-Brett und Zeitung „Computer schlägt Go-Legende“. Die Steine werden zum Cursor, eine KI schreibt eine Mail | Über KI staunen. → KI um Hilfe bitten. | Stein-Klack, Zeitungs-Spin, Tippen, Sparkle |
| 28–32 s | Rosa Rezept (Muster 16) mit Handschrift und Stempel, zerfällt in Pixel und wird zum QR-Code im Handy | Rosa Zettel. → E-Rezept: seit 2024 Standard. | Papier, Stift, Stempel-Thump, Scanner-Beep |
| 32–35 s | Alles friert ein, die Farbe weicht | Und in der Neurodermitis-Therapie? | Musik bricht ab, Freeze-Impact, Raumton |
| 35–40 s | Figur in langer Kleidung mit hochgestelltem Kragen kratzt sich, gerötete Hautstellen | 2016: Behandeln, ohne gezielt Entzündungssignale zu blockieren. | Kratzgeräusch synchron zur Hand, Musik „hinter der Wand“ (Lowpass) |
| 40–44 s | Die Messlatte erscheint und steigt | 2017: Die Messlatte steigt. | Latten-Thunk, der Filter öffnet sich, Build-up und Riser |
| 44–50 s | Die Latte schnellt auf „Heute“, die Kleidung fliegt weg (T-Shirt, Shorts), Hautstellen verblassen bis auf einen kleinen Punkt | Heute: nahezu vollständige Krankheitsinaktivität erreichbar. + Chips: Keine Läsionen. Kaum Juckreiz. Volle Lebensqualität. | Großer Swell in F-Dur, Stoff-Whoosh, Chip-Chimes |
| 50–55 s | Raster aus 7 Kacheln, die im Takt von 2016 auf 2026 kippen | Was 2016 Standard war, ist heute überholt. → Auch in der Therapie. | Flip-Klicks auf jedem Beat |
| 55–60 s | Endcard mit Zeitstrahl 2016–2026 und Logo-Platzhalter | Route: 10 Jahre Alltag. Warum bei 2016 stehen bleiben? | Final Hit, Schlussakkord, Ausklang |

**Bildsprache.** Jede Szene startet in einer „2016-Welt“: Papier-Creme, flache UI, Filmkorn. Beim Upgrade breitet sich die „2026-Welt“ als Ring vom Objekt aus: Dark Mode, Glow, Glas. Die Jahres-Pille oben links rollt dabei mit.

**Musik.** 120 BPM, D-Moll/F-Dur. Sie startet als 2016-Tropical-House (Marimba, Snaps, Shaker). Mit jedem Upgrade kommt eine modernere Ebene dazu: Hi-Hats, 808, Arpeggio, Supersaw-Stabs, Vocal-Chops, Future-Bass-Wobble. Beim Freeze bricht die Musik ab, im AD-Teil ist sie gedämpft, ab der Messlatte folgen Build-up und großer Swell.

## Anpassungen gegenüber dem Briefing

- **„Quaddeln“** stehen eher für Urtikaria. Gezeigt werden deshalb gerötete, ekzematöse Hautstellen.
- **Bargeld:** Die Zahlen sind konkretisiert als „Anteil an allen Transaktionen“. Die Quelle (Deutsche Bundesbank, Zahlungsverhaltensstudien 2017/2023) steht klein im Bild.
- **KI-Szene:** Die Zeitungsschlagzeile bezieht sich auf AlphaGo vs. Lee Sedol, 4:1 im März 2016. Die Zeitung ist fiktiv („Der Anzeiger“).
- **Rezept:** Praxisstempel und Kassendaten sind Platzhalter („Dr. med. A. Muster“).
- **Neutral:** Es kommen keine Marken- oder Produktlogos vor. Geräte und Apps sind generisch gestaltet.

## Bauen und Vorschau

```bash
./build.sh                         # komplett: Ton + Frames + Mux -> out/10-jahre-alltag.mp4 (~8 min)
node render.cjs --stills 9,16.7    # einzelne Standbilder -> out/stills/
python3 src/soundtrack.py x.wav    # nur Ton
npx http-server . -p 8080          # Live-Vorschau mit Ton: http://localhost:8080 (Klick = Play/Pause)
```

Voraussetzungen: Node 18+ mit Playwright/Chromium, Python 3 mit NumPy und SciPy, ffmpeg.
