# Übergabe: „Der vertraute Griff – Rethink the Routine“

Stand: 04.10.2026. Diese Notiz richtet sich an die nächste Claude-Code-Sitzung (und an Menschen im Team).
Sie fasst Briefing, Entscheidungen, aktuellen Stand und den nächsten Plan (Weg 1) zusammen.

## 1. Briefing in Kurzform

**Format**
- Animierter Erklär-Kurzfilm für Ärzte im Kontext atopischer Dermatitis.
- Kunde aus der Pharmabranche, Marke Rinvoq.
- Länge ca. 90 s, 1920 × 1080, 30 fps.

**Botschaft**
- Was sich bewährt hat, gibt Sicherheit, und aus Sicherheit wird Routine.
- Routinen können dazu führen, dass bekannte Alternativen nicht neu geprüft werden.
- Die bisherige Entscheidung wird nicht abgewertet.
- Der Arzt ist kompetent und zugewandt. Sein Innehalten zeigt Professionalität.

**Metapher**
- Eine gespeicherte Navi-Route (Deep Teal 2, `#366B8F`, Dupilumab zugeordnet) steht für die vertraute Entscheidung.
- Die alternative Route ist Rinvoq-Gold (`#FFD100`). Sie ist vorhanden, wird erst übergangen und dann bewusst gewählt.
- Gleicher Start, gleiches Ziel, ähnliche Länge.
- Der Arzt wählt selbst, das Navi empfiehlt nichts.

**Verbote**
- Keine Überlegenheitsbehauptung.
- Keine Fahrzeiten, Kennzahlen oder Warnsymbole.
- Keine Wirkstoffnamen, keine Wirksamkeitsversprechen.
- Keine Hautsymptome, keine Heilungserzählung.
- Arzt und Auto bleiben neutral gefärbt, es gibt keine farbliche „Bekehrung“.
- Kein Voiceover. Der Film muss ohne Ton verständlich sein.

**Farben**
- Gold `#FFD100`, Charcoal `#25282A`, Weiß.
- Teal `#366B8F` ausschließlich für die vertraute Route.
- Plum entfällt.

**Texte (exakt)**
- „Was sich bewährt, / wird selbstverständlich.“
- „Passt der vertraute Weg / auch diesmal?“
- „Bewährte Wege geben Sicherheit. / Doch welcher passt wirklich zu diesem Patienten?“
- Schlusskarte: „Rethink the Routine“

**Abgestimmte Entscheidungen**
- Timing nach der Tabelle in `README.md` (1:30 min).
- Figuren: Arzt um die 45, mit Brille. Patientin Mitte 30.
- Der Arzt trägt im Auto den Kittel.
- Navi-Texte: „Gespeicherte Route“, „Bestätigen“, „Routen“.
- Der Bestätigen-Button ist in der Routine Charcoal und wird nach der bewussten Wahl Gold.
- Von der Praxis zum Auto führt ein Match Cut: Praxis-Türgriff → Autotürgriff.
- Pflichtangaben, Logo und Markenschriften fehlen vorerst. Das ist für den Entwurf so vereinbart.

## 2. Aktueller Stand

**Fertig, aber visuell zu rudimentär**
- Filmversion 1 ist komplett aus Canvas-Code erzeugt.
- Player: `index.html`. Video: `export/der-vertraute-griff.mp4`.
- Aufbau siehe `README.md`.

**Variante B abgelehnt**
- Programmatische SVG-Styleframes in `styleframes/`.
- Feedback der Nutzerin: „besser proportioniert, weniger simple Computergrafik, mehr wie ein gezeichnetes Erklärvideo“.

**Erkenntnis:** Code-generierte Formen erreichen keinen gezeichneten Illustrationslook. Dafür braucht es ein Bild-KI-Modell als „Illustrator“.

## 3. Plan: Weg 1 (KI-gestützt, Claude als Orchestrator)

Claude plant, schreibt Bildanweisungen, ruft die Dienste per API auf, prüft die Ergebnisse und montiert den Film im Code.

| Baustein | Dienst | Status |
|---|---|---|
| Bildgenerierung (Styleframes, Figurenblätter, Hintergründe, freigestellte Figuren) | Google AI Studio / Gemini API | Schlüssel wird von der Nutzerin angelegt |
| Musik und Geräusche | ElevenLabs API | Schlüssel wird angelegt; kommerziell nur mit bezahltem Tarif |
| 3D, optional (Auto, Kamerafahrten) | Blender (kostenlos, per `apt-get install blender` in der Umgebung) | kein Konto nötig |
| Video-KI | Google Veo | vorerst nicht – Figurenkonsistenz schwierig |
| Stimme | ElevenLabs | nicht nötig (kein Voiceover laut Konzept) |

**Vorgehen**
1. Setup testen: Jeden Schlüssel mit einer minimalen Anfrage prüfen. Schlüssel niemals ausgeben oder committen.
2. Stil-Referenzen der Nutzerin sichten (Links oder Screenshots, die sie mitbringt).
3. Zwei bis drei Styleframes und ein Figurenblatt (Arzt, Patientin, Hände) im gezeichneten Erklärvideo-Stil erzeugen. Varianten zeigen, Feedback einholen.
4. Nach der Look-Freigabe Bausteine erzeugen: Hintergründe und Figuren freigestellt in den benötigten Posen. Dabei auf Konsistenz achten (Referenzbild mitgeben).
5. Animation im bestehenden Timeline-Gerüst (`src/timeline.js`, `renderFrame(t)`) oder in Motion Canvas: Kamerafahrten, Parallax-Ebenen, dezente Bewegung.
6. Musik und Geräusche über ElevenLabs. Der synthetische Ton (`src/audio.js`) bleibt als Fallback.
7. Rendern mit `node tools/render.cjs video …` und Kontrollbilder prüfen.

## 4. Setup-Checkliste (erledigt die Nutzerin)

- [ ] Google AI Studio (aistudio.google.com): API-Schlüssel erstellen. Für Veo oder größere Mengen Abrechnung und Budget-Limit einrichten.
- [ ] ElevenLabs (elevenlabs.io): Profil → API Keys → Schlüssel erstellen.
- [ ] Claude-Umgebung (Umgebungsmenü in der Titelleiste der Sitzung → Edit), Umgebungsvariablen:
  - `GEMINI_API_KEY`
  - `ELEVENLABS_API_KEY`
- [ ] Network access auf „Custom“ stellen und die Paketmanager-Standardliste beibehalten. Erlaubte Domain hinzufügen: `api.elevenlabs.io`. Die Google-Hosts (`generativelanguage.googleapis.com`) waren bereits erreichbar.
- [ ] Neue Sitzung mit diesem Repository starten, denn nur neue Sitzungen sehen die Schlüssel.

## 5. Offene Punkte

- **Kundenfreigabe:** Darf KI-generiertes Bild- und Tonmaterial verwendet werden? Im kostenlosen Google-Kontingent können Eingaben zur Produktverbesserung genutzt werden. Keine vertraulichen Inhalte in Prompts.
- **Stil-Referenzen:** Liegen vor (Screenshots im Chat vom 04.10.). Maßstab ist der Detailgrad, keine 1:1-Kopie. Umgesetzt in `prompts/stil.txt`.
- **Markenschriften und Logo:** Graphik, Neue Haas Grotesk und Rinvoq-Handschrift kommen später.
- **Bekannte Schwächen von Version 1:** Siehe Abschlussbericht im Chat, unter anderem steife Figuren und die Überblendung statt Kamerafahrt in die Draufsicht.

## 6. Arbeitsweise und Repository

- Branch: `claude/sweet-hypatia-1nvimi` (enthält den Stand von `claude/busy-carson-3u6m58`). Committen und pushen, keinen Pull Request ohne Auftrag.
- Die Nutzerin hat keine GitHub-Erfahrung. Bei Bedarf Schritt für Schritt anleiten.
- Antworten auf Deutsch, knapp, mit klarer Empfehlung.

## 7. Fortschritt Weg 1 (Sitzung 04.10.2026, zweite Runde)

**Setup-Test**
- `GEMINI_API_KEY`: Der Schlüssel gilt. Alle Bildmodelle melden im kostenlosen Kontingent aber „limit: 0“ (HTTP 429). Bildgenerierung braucht Abrechnung im AI-Studio-Projekt. Ohne Abrechnung geht nichts.
- `ELEVENLABS_API_KEY`: Der Schlüssel gilt, ist aber eingeschränkt („missing the permission user_read“). Für Schritt 6 müssen mindestens die Berechtigungen für Sound Effects und Music freigegeben sein, am einfachsten alle Rechte.

**Stil-Referenzen der Nutzerin (Zusammenfassung)**
1. Semi-flaches 2D mit weichen Verläufen, Tiefenunschärfe, Lichtstimmung und natürlichen Proportionen. Das ist der angestrebte Detailgrad.
2. Klarer Flat-Vektorstil mit Konturen (E-Learning-Look).
3. Einfacher Flat-Stil. Das ist das untere Ende.

**Vorbereitet**
- `tools/gen_image.py`: Gemini-Bildaufruf mit Referenzbildern, Seitenverhältnis und Größe.
- `prompts/stil.txt`: Stilvorgaben, Farb- und Inhaltsregeln, Figurenbeschreibungen. Wird jedem Bild vorangestellt.
- `prompts/0x-*.txt`, `prompts/1x-*.txt`: Figurenblätter (Arzt, Patientin) und Styleframes (Morgen, Praxis, Auto; Auto zusätzlich in Stil B als Gegenprobe).
- `tools/gen_styleframes.sh [modell]`: erzeugt alles nach `ki-styleframes/`. Die Figurenblätter werden als Referenz an die Styleframes übergeben.
- Kosten laut Google: ca. 0,134 USD je Bild mit `gemini-3-pro-image` (1K und 2K kosten gleich). Ein Durchlauf (6 Bilder) kostet also unter 1 USD.

**Erster Bilddurchlauf (Abrechnung aktiv, Kunde hat KI-Material freigegeben)**
- Ergebnisse in `ki-styleframes/`, Vergleich in `00-uebersicht.jpg`. Kosten bisher unter 2 USD.
- Die Figuren bleiben über die Bilder hinweg sehr konsistent, wenn die Figurenblätter als Referenz mitgehen.
- Stil A (12): gezeichnet mit Konturen, weich schattiert. Das Modell setzt Konturen, obwohl der Prompt sie nicht verlangt.
- Stil B (13): klarer Flat-Stil wie Referenz 2.
- Stil C (16): Vektor ohne Konturen, mit Verläufen und Unschärfe. Kommt Referenz 1 am nächsten. Funktioniert nur ohne Figurenblätter als Referenz, denn mit ihnen übernimmt das Modell deren Konturen. Für Konsistenz in Stil C braucht es deshalb neue Figurenblätter in Stil C.
- `15-…-3d-zufall`: Der Stil-C-Versuch mit Referenz ist ungewollt im 3D-Look gelandet. Er wird nur als Option gezeigt.
- Bekannte Kleinigkeiten: winzige Schrift auf der Kaffeemaschine (10), grünes Notausgangsschild (11), Hände auf dem Patientinnen-Blatt hellhäutig (02). Das wird beim Bausteine-Erzeugen korrigiert.
- Die API liefert JPEG. Bilder werden deshalb als `.jpg` gespeichert.

**Stilentscheidung: Stil C** (Nutzerin, 04.10.2026)
- `prompts/stil-c.txt` wird nach `prompts/stil.txt` angehängt und hat Vorrang.
- Neue Figurenblätter `c01-…` (Arzt) und `c02-…` (Patientin). Die Patientin brauchte zwei Anläufe. Erst mit dem Arzt-Blatt als Stil- und Layoutreferenz und dem Auto-Bild als Identitätsreferenz passte es.
- Styleframes in Stil C: `c10-…-morgen`, `c11-…-praxis`, `16-…-auto-stilC2`. Übersicht: `c00-uebersicht-stil-c.jpg`.
- **Referenz-Regel für alle weiteren Bilder:** Figurenblätter c01 und c02 plus ein Stil-C-Szenenbild (16) mitgeben. Die alten Blätter 01 und 02 nicht mehr verwenden, sonst kommen Konturen zurück.
- Kleinigkeit: Die Glaswände in c11 haben einen leichten Blaustich. Bei Bausteinen auf neutrales Grau achten.

**ElevenLabs:** Nach Rechte-Erweiterung funktionieren Sound Effects (Test: HTTP 200, MP3). `/v1/user` und `/v1/models` bleiben gesperrt, das ist ohne Belang.

**Schritt 4 – Testsequenz (Pilot) fertig:** Navi-Einstellungen (alle Modi) und Innenraum „Innehalten/Abwägen“ laufen mit KI-Bausteinen. Test-Video: `export/test-ki-innehalten.mp4` (00:43–01:11).

**Verfahren (bewährt, so weiter machen)**
1. **Platte** erzeugen: `prompts/stil.txt` + `prompts/stil-c.txt` + Shot-Prompt, Referenzen c01, c02 und ein Stil-C-Bild.
2. **Pose-Varianten** per KI-Bearbeitung derselben Platte („Keep EVERYTHING identical … change ONLY …“). Ergebnis liegt pixelgenau (Versatz 0 px, geprüft mit `tools/ki_align.py`).
   Achtung: Frisuren driften. Im Prompt ausdrücklich festhalten.
3. **Freistellen** über Magenta-Hintergrund (#FF00FF). Bildschirme als Magenta-Fläche erzeugen, dann wird die Grafik im Code eingesetzt (Trapez-Entzerrung in `src/ki.js`).
4. `python3 tools/ki_prepare.py`: macht aus `assets/ki/roh/` die Filmdateien, schneidet veränderte Bereiche als weich maskierte Ebenen aus und schreibt `assets/ki/meta.js` (Koordinaten) sowie `assets/ki/bilder.js` (eingebettete Bilddaten, nötig, weil `file://`-Bilder den Canvas für Export und Render sperren).
5. `src/ki.js` ersetzt einzelne Szenen-Funktionen, sobald alle Bilder geladen sind. Mit `index.html?code` sieht man die alte Code-Version.
6. Animationsprinzip: Pose-zu-Pose (gehaltene Zeichnungen, kurze Überblendungen von 0,3 s), dazu durchgehende Kamerabewegung. Die Hand ist eine freigestellte Ebene und wird frei bewegt.
- Render-Werkzeug kann Ausschnitte: `node tools/render.cjs video datei.mp4 --from 43 --to 71`.
- Prompts der Bausteine: `prompts/bausteine/`.

**Nächster Schritt:** Feedback zur Testsequenz einholen, dann die übrigen Einstellungen nach demselben Verfahren umstellen (Morgen: Tasse, Schlüssel, Tasche, Autotür, Gurt; Praxis: Außen, Begrüßung, Türgriff, Autotürgriff, Einsteigen; Losfahren, Draufsicht). Danach Ton (ElevenLabs).
