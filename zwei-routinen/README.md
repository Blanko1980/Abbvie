# Zwei Routinen

Alternative Fassung des NAVI-Films: 91,5 s, 1920 × 1080, 30 fps (2744 Frames), H.264, ohne Voiceover.
Die Standbilder stammen aus der Gemini-Bild-API. Animation, Timing, Navi-Oberfläche, Uhr, Zettel, Texttafeln und Ton entstehen im Code (Remotion).

## Ergebnisse

| Datei | Inhalt |
|---|---|
| `out/zwei-routinen.mp4` | Film mit Ton |
| `out/zwei-routinen-muted.mp4` | Derselbe Film ohne Tonspur |
| `out/contact-sheet.png` | Alle freigegebenen Standbilder |
| `out/muted-contact-sheet.png` | 24 gleichmäßig verteilte Frames der stummen Fassung (Stumm-Prüfung) |
| `assets/prompts.json` | Modell, Prompt, Referenzbilder und gewählter Kandidat jedes Bildes |
| `BERICHT.md` | Abnahme-Checkliste, Abweichungen, TODOs |

## Befehle

```bash
npm install
node scripts/generate-assets.mjs            # fehlende Bilder erzeugen (--only <id> erzeugt eines neu, --choose <id> <n> wählt Kandidat)
python3 scripts/arm-mask.py                 # Masken für Ärmel, die dem Hintergrund gleichen (C2a, C2b, C7; braucht opencv)
node scripts/postprocess.mjs                # Hochskalieren, Freistellen, Farbleck-Check → assets/processed, src/data/assets.json
node scripts/fetch-sfx.mjs                  # Geräusche von ElevenLabs (nur fehlende)
node scripts/build-audio.mjs                # Tonspur → public/audio/mix.wav, beats.json, Rasterprüfung
node scripts/contact-sheet.mjs              # Kontaktbogen
npx remotion studio                         # Vorschau
npx remotion render ZweiRoutinen out/zwei-routinen.mp4 --codec=h264 --crf=18
npx remotion render ZweiRoutinen out/zwei-routinen-muted.mp4 --codec=h264 --crf=18 --muted
node scripts/stills.mjs 0,333,1440          # einzelne Kontrollbilder
```

Schlüssel kommen aus `GEMINI_API_KEY` und `ELEVENLABS_API_KEY` und werden nie ausgegeben oder committet.
`remotion.config.ts` nutzt den vorinstallierten Headless-Chromium der Umgebung.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/data/timeline.json` | Alle Frame-Nummern und Texte. Szenen lesen nur hieraus, nichts ist in den Szenen fest verdrahtet |
| `src/theme.ts` | Farben, Schriften (`// TODO brand font`), Easing |
| `src/scenes/S1–S8.tsx` | Die acht Szenen |
| `src/components/` | `NaviScreen` (SVG), `ClockBadge`, `Slip`, `TextPanel`, `Callout`, `ParallaxImage`, `Shots` (wiederverwendete Einstellungen) |
| `assets/asset-list.mjs` | Alle Bild-Prompts, das Stilpräfix und die Referenzen |
| `assets/gen/` | Gewählte Gemini-Bilder, `candidates/` alle Kandidaten |
| `assets/processed/` | Aufbereitete Bilder (über `public/img` eingebunden) |
| `assets/reference/` | Stilreferenzen aus dem ersten NAVI-Film (Stil C) |
| `public/audio/` | `mix.wav` und `sfx/` (ElevenLabs) |

## Verfahren

- **Figuren in Räumen** (Auto, Eingangshalle, Behandlungsraum, Tisch) entstehen als KI-Bearbeitung des leeren Raums. Sie liegen damit pixelgenau darauf und werden per Differenzmaske freigestellt. Bewegte Ebenen bekommen eine enge Maske nur um die Figur.
- **Einzelplatten** (rennender Arzt C3p/C3pb) entstehen auf flachem Grau und werden per Flood-Fill vom Rand freigestellt.
- **Arme**, deren Ärmel dem Hintergrund gleicht (Navi-Arm, Kittelärmel beim Schreiben), werden per GrabCut entlang der Armachse freigestellt (`scripts/arm-mask.py`).
- **Farbleck-Check:** Jedes Bild wird auf Teal (195–215°, S > 35 %) und Gold (45–55°, S > 80 %) geprüft. Mehr als 0,5 % der Nicht-Haut-Pixel führen zum Fehler.
- **Ton:** Raster mit 100 BPM. Beide Pausen (S5 und S7) haben dieselbe Hüllkurve: 3 Frames Absenkung auf −40 dB, 30 Frames halten, 6 Frames Rückkehr.
