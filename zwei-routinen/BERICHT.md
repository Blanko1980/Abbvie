# Bericht: „Zwei Routinen“

Stand: 09.10.2026 (Korrekturfassung 3). Bildmodell: `gemini-3-pro-image`. Es unterstützt Referenzbilder und Bildbearbeitung und war das aktuelle Bildmodell in der Modellliste des Schlüssels.

## Abnahme-Checkliste

- [x] **Formate:** `out/zwei-routinen.mp4` und `out/zwei-routinen-muted.mp4` existieren, beide 1920 × 1080, 30 fps, 2776 Frames (92,5 s), H.264. Die stumme Fassung hat keine Tonspur. Messwerte: siehe unten.
- [x] **Texte:** Jede deutsche Tafel stammt wörtlich aus `src/data/timeline.json`. Der Callout lautet „Rethink the Routine“. Hinweis: Abschnitt 5 des Briefings („Section 5“) lag nicht bei. Alle Texte sind deshalb Zeichen für Zeichen aus den Szenenbeschreibungen des Briefings übernommen.
- [x] **Keine Schrift in Bildern:** Kein generiertes Bild enthält Schrift, Zahlen oder Logos (Sichtprüfung `out/contact-sheet.png`). Der Farbleck-Check hat bei allen Bildern bestanden (Kontaktbogen: 44 Bilder bzw. Ebenen), Höchstwert Teal 0,18 % (Grenze 0,5 %), siehe `assets/processed/qa.json`.
- [x] **Teal und Gold** kommen nur auf Routenlinien (Karte und Routenkarten im Navi), Zetteln, Tafel-Unterstreichungen und dem Callout-Pinsel vor.
- [x] **Gold-Zettel in S7:** ist ab dem ersten sichtbaren Frame gold. Die Farbe ist eine Konstante und ändert sich nie.
- [x] **S2 und S6:** dieselbe Halle und dieselbe Kamera, der Kittel hängt beide Male an der Garderobe (B4c). In S2 kommt der Arzt in Alltagskleidung, reißt den Kittel im Laufen vom Haken und hastet weiter; in S6 hängt er die Jacke auf und zieht den Kittel in Ruhe an, seine Tasche steht neben der Pflanze (B4cb). Unterschiede sonst: Uhrzeit (08:55 / 08:43), Pose und Tempo.
- [x] **Beide Pausen** (S5: Finger über „Bestätigen“, S7: der Stift hält mitten im üblichen Rezept inne) dauern genau 30 Frames. In beiden bricht die eilige Musik ab (3 Frames), nach der Pause setzt die ruhige Musik ein (6 Frames). Gleiche Kurve (`settleHold`), gleiche Tonführung. Gemessen: rund −50 dBFS in beiden Pausen, nur Raumton.
- [x] **Match Cut S4:** Fingerspitze und Handmitte folgen derselben Bewegungskurve in Filmkoordinaten. Der Schnitt liegt auf der Spitzengeschwindigkeit (Mitte der S-Kurve). Richtung (links nach rechts, leicht abwärts), Tempo und Bildposition sind beim Schnitt also identisch.
- [x] **S7:** Der Arzt beginnt das übliche Rezept, hält inne (30 Frames, Musik bricht ab), legt den Stift bewusst ab, schaut die Patientin an, erklärt, sie reagiert – erst dann schiebt er ihr den Gold-Zettel zu.
- [x] **Hautstellen:** in jeder Patienteneinstellung sichtbar, auch in der letzten Einstellung von S7 (Hand von Patientin 4 nimmt den Gold-Zettel).
- [x] **Patienten:** drei deutlich verschiedene in S3 und S4 (Patient 1, 2, 3), dazu Patientin 4 in S7.
- [x] **Stumm-Prüfung:** `out/muted-contact-sheet.png` mit 24 gleichmäßig verteilten Frames der stummen Fassung. Lesbar sind: Routine, Eile, Innehalten an der Route, ruhigere Ankunft, Innehalten beim Zettel, Entscheidung.
- [x] **Ton:** kein Clipping (Spitze 0,84), Lautheit und True Peak siehe unten, keine Stimme. Die Musik ist 30 Frames vor Schluss ausgeblendet.
- [x] **prompts.json:** `assets/prompts.json` enthält Modell, Prompt, Referenzen und den gewählten Kandidaten jedes Bildes.
- [x] **Bericht:** Schriften-TODOs, Neuerzeugungen und Ausfälle stehen unten.

## Messwerte

| Datei | Video | Ton |
|---|---|---|
| `out/zwei-routinen.mp4` | H.264, 1920 × 1080, 30 fps, 2776 Frames | AAC 48 kHz Stereo, −15,9 LUFS integriert, True Peak −1,4 dB |
| `out/zwei-routinen-muted.mp4` | H.264, 1920 × 1080, 30 fps, 2776 Frames | keine Tonspur |

Zusätzlich gemessen:
- Geräusche liegen 6,5 dB über dem Musikbett.
- In beiden Pausen sinkt der Pegel auf etwa −50 dBFS (nur Raumton), davor liegt er bei −23 bis −27 dBFS.
- In den letzten 30 Frames ist nur noch Raumton zu hören.

## Markenschriften (TODO brand font)

- `src/theme.ts` → `sans`: Source Sans 3 (OFL) ersetzt die Markenschriften (Graphik / Neue Haas Grotesk) für Tafeln, Navi und Uhr.
- `src/theme.ts` → `script`: Caveat (OFL) ersetzt die Rinvoq-Handschrift im Callout.
- `public/fonts` war leer. Die Ersatzschriften liegen lokal dort, damit das Rendern ohne Netz funktioniert.

## Neu erzeugte Bilder

| Asset | Grund |
|---|---|
| B3 | Korrektur: Blick über die Schulter des Arztes, damit er den Bildschirm sieht (vorher zeigte der Bildschirm von ihm weg). Der Gurt-Puls liegt jetzt auf dem Gurt über seiner Schulter; C1 entfällt. |
| B1, B2 | Korrektur: Tasse steht direkt unter dem Auslauf, Display als Magenta-Fläche (im Code ersetzt: Tassen-Symbol und Fortschrittsbalken). |
| C17 | Korrektur: Schlüsselbrett mit drei kräftigen Metallhaken statt Schale. |
| C7 | Korrektur: schreibende Hand kommt von links (Arztseite), damit die Achse stimmt. |
| C4wb | Korrektur: Jacke bleibt in beiden Schrittphasen über dem Arm. |
| B4c, C4, C5 | Korrektur: Kittel hängt schon vor der Ankunft an der Garderobe (B4c); C4 und C5 sind Bearbeitungen davon. |
| C14 | Kandidat 1 verworfen: Comic-Bewegungsstriche neben dem Kopf. |
| D2 | Erster Versuch von Gemini abgelehnt (`IMAGE_RECITATION`), mit umformuliertem Prompt erzeugt. |

**Ausgefallene Bilder:** keine.

## Bewusste Abweichungen vom Briefing

1. **Stil:** Die Nutzerin hat ausdrücklich „im gleichen Stil“ wie der erste NAVI-Film verlangt. Das ist Stil C: flache Vektorflächen ohne Konturen, weiche Verläufe. Das Briefing beschreibt dagegen gleichmäßige Charcoal-Konturen; diese Variante war im ersten Film abgelehnt worden. Die Farbregeln des Briefings gelten unverändert: neutrale, helle Welt, kein Teal oder Gold in Bildern. Die Stilreferenzen liegen in `assets/reference/`.
2. **Figuren in Räumen** (C4, C5, C4w, C6/C11, C9, C10, C13–C16, C7, C8, C12, C17a, C18a, C2a, C2b) sind keine Platten auf Weiß. Sie sind KI-Bearbeitungen des leeren Raums und werden per Differenzmaske (oder GrabCut) freigestellt. Nur so passen Perspektive, Maßstab und Licht exakt. Nur der rennende Arzt (C3p/C3pb) ist eine Platte, auf flachem Grau, weil der weiße Kittel vor der weißen Wand sonst Löcher bekommt.
3. **B3:** Blick über die Schulter des Fahrers (Arzt links im Vordergrund), der Navi-Bildschirm ist ihm zugewandt. Der Bildschirm wurde als Magenta-Fläche erzeugt (exakt erkennbar) und im Code perspektivisch ersetzt, statt als dunkles Rechteck.
4. **Auflösung:** Gemini liefert in 2K (2752 px), danach wird auf 2880 px hochskaliert. 4K hätte Kosten und Repository-Größe etwa vervierfacht. Für 115 % Kamerafahrt reicht 2880 px.
5. **Zusätzliche Bilder:** C3pb, C4w und C4wb (zweite Schrittphase bzw. ruhiger Gang), damit Gehen nicht als Gleiten wirkt. Dazu DESK (leerer Tisch in Nahaufnahme) als Grundlage für Zettel, Hände und Notizen, C7p (Block ohne Hand), B4c/B4cb (Kittel bzw. Tasche an der Garderobe), B6e/B7e (Schlüsselbrett bzw. Bank ohne Gegenstand).
6. **Raster:** Alle Schnitte in S1–S4 liegen auf dem 9-Frame-Raster (Achtel bei 100 BPM), geprüft von `build-audio.mjs`. Die Szenengrenzen sind durch die längeren Einstellungen verschoben (S2 ab 378, S3 ab 585, S4 ab 882, S5 ab 1590).
7. **Länge:** 91,5 s statt 80 s. Die Nutzerin hat längere Einstellungen bei den Folgetagen und am Morgen gewünscht und eine größere Gesamtlänge ausdrücklich erlaubt. Die Patienten-Einstellungen in S4 dauern 36 Frames.
8. **Der Arzt** trägt Brille und Bartschatten, übernommen aus den Stilreferenzen des ersten Films. Das Briefing verlangt beides nicht, schließt es aber auch nicht aus.
9. **Farbe der gespeicherten Route:** `#366B8F` (deepTeal2) laut diesem Briefing. Im ersten Film wurde sie zuletzt auf `#1D7D7E` geändert.

## Korrekturen 07.10.2026

| Zeit | Korrektur |
|---|---|
| 0:01 | Zwei dünne Kaffeestrahlen kommen aus den Ausläufen und enden auf der Kaffeeoberfläche. Farbe brauner (`colors.coffee` `#6B3F22`). Das Display zeigt Tassen-Symbol und Fortschrittsbalken. |
| 0:02 | Schlüsselbrett mit Haken (C17 neu). |
| 0:06 | Über-die-Schulter-Blick (B3 neu), der Navi-Bildschirm ist dem Arzt zugewandt. Die Navi-Oberfläche wird per Homografie perspektivisch in den Bildschirm gelegt. Die Hand kommt von links unten. |
| 0:07 | Kopfzeile „Gespeicherte Routen“. Die Gold-Route ist bis 0:45 nirgends sichtbar. |
| ab 0:45 | Gespeicherte Route, unten 35 min. Nach dem Innehalten erscheint das Pop-up „Neue Route gefunden“ und erstmals die Gold-Route mit 23 min. Die Chips „Gestern/Heute“ entfallen. |
| 0:15 | KI-Bodenschatten und Staub aus den Gehfiguren entfernt. Der Schatten ist jetzt eine weiche Ellipse im Code, die mitläuft. |
| 0:24 | Schreibende Hand von links (Arzt sitzt links, Patienten rechts) – gilt für alle Patientenszenen. |
| ab 0:54 | Der Arzt läuft vorwärts nach rechts. Die Jacke bleibt in jedem Schritt über dem Arm. |
| 1:00 | Der weiße Kittel hängt von Anfang an an der Garderobe. Überblendung zum Haken auf 4 Frames verkürzt. |

## Korrekturen 08.10.2026 (Korrekturfassung 2)

| Stelle | Korrektur |
|---|---|
| Schlüssel, Tasche | Neue Szenen in der Wohnung mit unscharfem Hintergrund wie bei der Kaffeemaschine (B6 Schlüsselbrett, B7 Bank an der Tür). Brett und Bank bleiben stehen, nur Hand und Gegenstand bewegen sich. Vorher hob sich das ganze Schlüsselbrett mit. |
| Navi-Karte | Neues Straßennetz (Querstraßen, Längsstraßen, eine Diagonale). Die Teal-Route (35 min) läuft unten herum über Straßen, die Gold-Route (23 min) über die Diagonale. Beide folgen nur Straßen. |
| Navi-Hand | Rechter Arm des Arztes, aus der Schulterperspektive richtig herum, mit Ärmel aus dem Körper (C2a: Bestätigen, C2b: Bildmitte). Freigestellt mit GrabCut (`scripts/arm-mask.py`). |
| Navi-Pop-up | Das Pop-up „Neue Route gefunden“ blendet aus, sobald die Gold-Route gezeichnet ist, und gibt die Karte frei. |
| Praxis-Uhr | Die Plakette sitzt jetzt über der Uhr. Dort läuft keine Figur vorbei. |
| Kittel beim Laufen | Rennender Arzt neu, auf flachem Grau erzeugt und freigestellt (C3p/C3pb). Kittel ohne Löcher, beide Arme im Ärmel, Laufrichtung nach rechts. |
| Kittel doppelt | In S2/S4 trägt er den Kittel. Deshalb zeigen diese Einstellungen die Halle ohne Kittel an der Garderobe. |
| Tasche in S6 | Die Tasche verschwand an der Garderobe. Jetzt steht sie neben der Pflanze (B4cb). |
| Gang S6 | Größe und Fußlinie gehen genau in die Haken-Pose über (aus den Bildern gemessen). Vorher lief er vor dem Tresen. |
| Schreiben | Der Block liegt still (C7p), nur die Hand schreibt in kleinen Schleifen. Der weiße Ärmel ist ohne Löcher freigestellt. |
| Handschatten | KI-Schatten auf dem Tisch entfernt. Weicher Code-Schatten, der mit der Höhe der Hand weiter und weicher wird. |
| Schnittfolge | Tage 2 und 3 sowie der Morgen in S5 haben längere Einstellungen (27–45 statt 9–27 Frames). Die leere Halle am Ende von S2 ist kürzer. Gesamtlänge 91,5 s statt 80 s. |
| S7 | Innehalten direkt nach dem Schreiben, dann Blick, Erklären, Reaktion, dann Gold-Zettel. |

**Neue Bilder:** B4cb, B6, B6e, B7o (verworfen als Grundlage, Ausschnitt verschob sich beim Entfernen), B7e, B7, C17a, C18a, C2a, C2b, C7p, C3p, C3pb.
**Entfallen:** C2, C17, C18 (Platten auf Weiß), C3/C3b (Raumbearbeitungen mit Kittel-Löchern), C1.
**Fehlversuche:** Hintergrund per Bearbeitung durch Magenta ersetzen (C3m usw.): Gemini färbte nur die Decke. Tasche entfernen (B7e aus B7o): Ausschnitt verschob sich, deshalb umgekehrt aufgebaut (leere Bank → Tasche hinzufügen).

## Korrekturen 09.10.2026 (Korrekturfassung 3)

| Stelle | Korrektur |
|---|---|
| Musik | Neu: zwei akustische Stücke von ElevenLabs Music (`scripts/fetch-music.mjs`, `public/audio/music`). „routine“: gezupfte Gitarre, Pizzicato-Streicher, Kontrabass, Besen – leicht gehetzt, gemessen 100,03 BPM, die Schnitte liegen weiter auf dem Raster. „calm“: Klavier, Streicher, Gitarre – entspannt. Keine Synthesizer. Die eilige Musik bricht in beiden Pausen ab, danach setzt die ruhige ein. |
| Schlüssel | Hand per GrabCut freigestellt (kein durchsichtiger Finger mehr), Haken bleibt am Brett, Schlüsselring wird beim Abheben geschlossen nachgezeichnet. |
| Navi | Die diagonale Straße gibt es erst, wenn das Navi die neue Route findet. Die Gold-Route führt direkt über sie zum Ziel (rund 30 % kürzer als Teal). |
| Praxis-Uhr | Keine Einblendung mehr: digitale Wanduhr (08:55 / 08:43) und ein Schild „Sprechstunde ab 9:00 Uhr“ an der Wand (Bearbeitung B4d, Anzeige und Text im Code). |
| Schreiben | Leerer Block (C7b), die Schrift entsteht im Code perspektivisch auf dem Block, die Stiftspitze sitzt immer am Linienende. Sichtbar wird sie hinter der Stiftspitze, beim Zeilenwechsel und nach dem Ablegen des Stifts. |
| Zettel | Liegen jetzt perspektivisch richtig auf der Tischplatte (Homografie der Platte). |
| Patient Tag 3 | Hautstellen aufgehellt (aschgrau-violett), nicht mehr in der Farbe der Haare (C14 aus C14o). |
| Eilige Ankunft | Der Arzt kommt in Alltagskleidung (Jacke), der Kittel hängt an der Garderobe. Er reißt ihn im Laufen vom Haken und hastet mit dem Kittel in der Hand hinter dem Tresen weiter (C3p/C3pb/C3g/C3q/C3qb, Tresen als Vordergrund). Erst bei der neuen Route hängt er die Jacke auf und zieht den Kittel in Ruhe an. |
| Innehalten S7 | Schreiben → Innehalten (Musik bricht ab) → Stift bewusst ablegen (C7d) → Blick zur Patientin mit ruhiger Musik. |
