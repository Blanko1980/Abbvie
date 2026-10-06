# Bericht: „Zwei Routinen“

Stand: 06.10.2026. Bildmodell: `gemini-3-pro-image`. Es unterstützt Referenzbilder und Bildbearbeitung und war das aktuelle Bildmodell in der Modellliste des Schlüssels.

## Abnahme-Checkliste

- [x] **Formate:** `out/zwei-routinen.mp4` und `out/zwei-routinen-muted.mp4` existieren, beide 1920 × 1080, 30 fps, 2400 Frames, H.264. Die stumme Fassung hat keine Tonspur. Messwerte: siehe unten.
- [x] **Texte:** Jede deutsche Tafel stammt wörtlich aus `src/data/timeline.json`. Der Callout lautet „Rethink the Routine“. Hinweis: Abschnitt 5 des Briefings („Section 5“) lag nicht bei. Alle Texte sind deshalb Zeichen für Zeichen aus den Szenenbeschreibungen des Briefings übernommen.
- [x] **Keine Schrift in Bildern:** Kein generiertes Bild enthält Schrift, Zahlen oder Logos (Sichtprüfung `out/contact-sheet.png`). Der Farbleck-Check hat bei allen 34 Bildern bestanden, Höchstwert Teal 0,18 % (Grenze 0,5 %), siehe `assets/processed/qa.json`.
- [x] **Teal und Gold** kommen nur auf Routenlinien (Karte und Routenkarten im Navi), Zetteln, Tafel-Unterstreichungen und dem Callout-Pinsel vor.
- [x] **Gold-Zettel in S7:** ist ab dem ersten sichtbaren Frame gold. Die Farbe ist eine Konstante und ändert sich nie.
- [x] **S2 und S6:** dieselbe Platte B4, dieselbe Kamera (feststehend, Zoom 1,0). Unterschiede: nur Uhr (08:55 / 08:43), Pose und Tempo.
- [x] **Beide Pausen** (S5 Frame 120, S7 Frame 135) dauern genau 30 Frames. Gleiche Kurve (`settleHold`), gleiche Ton-Absenkung: 3 Frames auf −40 dB, 30 Frames halten, 6 Frames Rückkehr. Gemessen: rund −50 dBFS in beiden Pausen, nur Raumton.
- [x] **Match Cut S4:** Fingerspitze und Handmitte folgen derselben Bewegungskurve in Filmkoordinaten. Der Schnitt liegt auf der Spitzengeschwindigkeit (Mitte der S-Kurve). Richtung (links nach rechts, leicht abwärts), Tempo und Bildposition sind beim Schnitt also identisch.
- [x] **S7:** Zwischen Pausenende (Frame 165) und Übergabe (Frame 275) liegen 110 Frames Begegnung: Blick, Erklären, Reaktion.
- [x] **Hautstellen:** in jeder Patienteneinstellung sichtbar, auch in der letzten Einstellung von S7 (Hand von Patientin 4 nimmt den Gold-Zettel).
- [x] **Patienten:** drei deutlich verschiedene in S3 und S4 (Patient 1, 2, 3), dazu Patientin 4 in S7.
- [x] **Stumm-Prüfung:** `out/muted-contact-sheet.png` mit 24 gleichmäßig verteilten Frames der stummen Fassung. Lesbar sind: Routine, Eile, Innehalten an der Route, ruhigere Ankunft, Innehalten beim Zettel, Entscheidung.
- [x] **Ton:** kein Clipping (Spitze 0,84), Lautheit und True Peak siehe unten, keine Stimme. Die Musik ist bis Frame 2370 ausgeblendet.
- [x] **prompts.json:** `assets/prompts.json` enthält Modell, Prompt, Referenzen und den gewählten Kandidaten jedes Bildes.
- [x] **Bericht:** Schriften-TODOs, Neuerzeugungen und Ausfälle stehen unten.

## Messwerte

| Datei | Video | Ton |
|---|---|---|
| `out/zwei-routinen.mp4` (24 MB) | H.264, 1920 × 1080, 30 fps, 2400 Frames | AAC 48 kHz Stereo, −16,0 LUFS integriert, Spitze −1,3 dB |
| `out/zwei-routinen-muted.mp4` (21 MB) | H.264, 1920 × 1080, 30 fps, 2400 Frames | keine Tonspur |

Zusätzlich gemessen:
- Geräusche liegen 7,3 dB über dem Musikbett.
- In beiden Pausen sinkt der Pegel auf etwa −50 dBFS (nur Raumton), davor liegt er bei −23 bis −27 dBFS.
- Nach Frame 2370 ist nur noch Raumton zu hören (−46 dBFS).

## Markenschriften (TODO brand font)

- `src/theme.ts` → `sans`: Source Sans 3 (OFL) ersetzt die Markenschriften (Graphik / Neue Haas Grotesk) für Tafeln, Navi und Uhr.
- `src/theme.ts` → `script`: Caveat (OFL) ersetzt die Rinvoq-Handschrift im Callout.
- `public/fonts` war leer. Die Ersatzschriften liegen lokal dort, damit das Rendern ohne Netz funktioniert.

## Neu erzeugte Bilder

| Asset | Grund |
|---|---|
| B3 | Kandidat 1 verworfen: Bildschirm zu klein und zu schräg für eine lesbare Navi-Oberfläche. |
| C1 | Folgt aus B3 (Bearbeitung des neuen B3). |
| C14 | Kandidat 1 verworfen: Comic-Bewegungsstriche neben dem Kopf. |
| D2 | Erster Versuch von Gemini abgelehnt (`IMAGE_RECITATION`), mit umformuliertem Prompt erzeugt. |

**Ausgefallene Bilder:** keine.

## Bewusste Abweichungen vom Briefing

1. **Stil:** Die Nutzerin hat ausdrücklich „im gleichen Stil“ wie der erste NAVI-Film verlangt. Das ist Stil C: flache Vektorflächen ohne Konturen, weiche Verläufe. Das Briefing beschreibt dagegen gleichmäßige Charcoal-Konturen; diese Variante war im ersten Film abgelehnt worden. Die Farbregeln des Briefings gelten unverändert: neutrale, helle Welt, kein Teal oder Gold in Bildern. Die Stilreferenzen liegen in `assets/reference/`.
2. **Figuren in Räumen** (C1, C3–C5, C6/C11, C9, C10, C13–C16, C7, C8, C12) sind keine Platten auf Weiß. Sie sind KI-Bearbeitungen des leeren Raums und werden per Differenzmaske freigestellt. Nur so passen Perspektive, Maßstab und Licht exakt, besonders bei S2/S6 auf B4. Die Weiß-Platten mit Flood-Fill werden für C2, C17 und C18 genutzt, wie beschrieben.
3. **B3:** Blick durch die Windschutzscheibe statt vom Beifahrersitz, damit der Navi-Bildschirm groß und fast frontal ist. Der Bildschirm wurde als Magenta-Fläche erzeugt (exakt erkennbar) und im Code ersetzt, statt als dunkles Rechteck.
4. **Auflösung:** Gemini liefert in 2K (2752 px), danach wird auf 2880 px hochskaliert. 4K hätte Kosten und Repository-Größe etwa vervierfacht. Für 115 % Kamerafahrt reicht 2880 px.
5. **Zusätzliche Bilder:** C3b, C4w und C4wb (zweite Schrittphase bzw. ruhiger Gang), damit Gehen nicht als Gleiten wirkt. Dazu DESK (leerer Tisch in Nahaufnahme) als Grundlage für Zettel, Hände und Notizen.
6. **Raster:** Die Briefing-Frames 75/195/140/260/320 sind auf das 9-Frame-Raster gerundet (72/198/135/252/324). Die Grenze S2/S3 liegt bei Frame 603 statt 600. Alle 36 Schnitte in S1–S4 liegen auf Schlag oder Achtel, geprüft von `build-audio.mjs`.
7. **Blickkontakt-Einstellungen in S4:** 18 statt 10–12 Frames. Damit bleiben sie auf dem Raster und der Blickkontakt ist lesbar.
8. **Der Arzt** trägt Brille und Bartschatten, übernommen aus den Stilreferenzen des ersten Films. Das Briefing verlangt beides nicht, schließt es aber auch nicht aus.
9. **Farbe der gespeicherten Route:** `#366B8F` (deepTeal2) laut diesem Briefing. Im ersten Film wurde sie zuletzt auf `#1D7D7E` geändert.
