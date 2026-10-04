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
- **Stil-Referenzen:** Noch ausstehend.
- **Markenschriften und Logo:** Graphik, Neue Haas Grotesk und Rinvoq-Handschrift kommen später.
- **Bekannte Schwächen von Version 1:** Siehe Abschlussbericht im Chat, unter anderem steife Figuren und die Überblendung statt Kamerafahrt in die Draufsicht.

## 6. Arbeitsweise und Repository

- Branch: `claude/busy-carson-3u6m58`. Committen und pushen, keinen Pull Request ohne Auftrag.
- Die Nutzerin hat keine GitHub-Erfahrung. Bei Bedarf Schritt für Schritt anleiten.
- Antworten auf Deutsch, knapp, mit klarer Empfehlung.
