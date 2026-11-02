# Ezarri Team C: Mosaik-Rechner, Custom Mix, Anfrage

Stand: 28.10.2026 · Branch `feature/neuauftritt` · Konzept: `ezarri-konzept.md` §7.3/§7.4
Alles hängt am Schalter `EZARRI_PUBLIC` (`src/lib/ezarri/config.js`, heute `false` → noindex, nofollow).

## Seiten

| URL | Inhalt | robots |
|---|---|---|
| `/de/ezarri/rechner` | Mosaik-Rechner | ohne Query: `ezarriRobots()`, mit Query: `utility` |
| `/de/ezarri/custom-mix` | Mischpult „Eigene Mischung“ | wie oben |
| `/de/ezarri/anfrage` | Muster, Beratung, Angebot | immer `utility` (nie Index) |

Alle drei: nur `de` (`ezarriLocaleEnabled` → `notFound()`), Metadaten über `ezarriMetadata()` (Team A, hreflang nur de/de-AT/de-CH/x-default) plus `withEzarriRobots()`. Seitenkopf über `PageHead` (Team A), lokale Navigation aus `ezarri/layout.js`.

## 1. Mosaik-Rechner

**Formeln** (`src/lib/ezarri/rechner/flaechen.js`, `core.js`), alle mit Formeltext in der Oberfläche („So ist gerechnet“):

| Teil | Formel |
|---|---|
| Boden | Rechteck L·B · L-Form L·B − Aussparung · rund/oval π·L/2·B/2 · frei: Fläche laut Plan |
| Wände | Rechteck 2·L·Ø + B·(flach + tief) (= Ezarris (2L+2B)·Ø, wenn Ø = Mittelwert) · sonst Umfang·Ø (Ellipse nach Ramanujan) |
| Ø-Tiefe | automatisch (flach + tief)/2, eigener Wert möglich (Knick im Boden) |
| Treppe gerade/Ecke | Tritt- und Setzstufen ersetzen verdeckte Boden-/Wandfläche → nur freie Wangen: Seiten · a·h·n(n+1)/2 (Vollbreite = 0) |
| Römische Treppe | Nische π·r²/2 + Setzstufen Σπ·rᵢ·h − Wandöffnung B·n·h |
| Sitzbank | 2 Wangen · Sitztiefe · Höhe über Boden |
| Überlaufrinne / Infinity | Länge · Abwicklung (Annahme 0,4 m / 0,9 m, änderbar) |
| Verschnitt | netto · (1 + Marge/100), auf 2 Stellen |
| Kartons | aufrunden auf volle Kartons (in cm² gerechnet, kein Binärfehler) |
| Corner / Cove (lfm) | Beckenkopf + Stufenkanten + Sitzkante / Boden-Wand-Kante + senkrechte Innenecken · Ø |

**Ezarri-Faktoren** (aus dem Skript `form_calculator()` auf ezarri.com/de/mosaik-rechner, gelesen 28.10.2026): Kleber 2,5 kg/m²; Fuge 1,2 (25 mm), 0,7 (50 mm), 0,9 (Zweig „36“, bei uns **Annahme Hexa**); Filze und Schwämme 1 je 5 m², Litonet 1 je 8 m², übrige Werkzeuge je 1. Verpackung aus den Produktdaten: 25 mm 2 m²/Karton, 13 Blätter, 96 m²/Palette, 9,4 kg/m²; 50 mm 1,45 / 10 / 69,6 / 13,4; Hexa 1,75 / 12 / 84 / 9,58. JointPoint® ist kein Zusatzmaterial → „Blätter mit JointPoint®“.

**Prüfwert** (Unit-Test): 10 × 5 m, 1/2 m, 10 % → 95 m² netto → 104,5 → **106 m², 53 Kartons, 265 kg Kleber, 127 kg Fuge**. Ein zweiter Test prüft Ezarris Rundungsformel (25 und 50 mm, 24 Kombinationen).

**Verhältnis zu Ezarris Formel:** gleiche Faktoren und Rundung, aber die Stirnwände rechnen mit ihrer echten Tiefe. Ohne eigene Ø-Tiefe kommt dasselbe heraus wie bei Ezarri. Mit eigener Ø-Tiefe weicht das Ergebnis ab (10 × 5, 1/2, Ø 1,2: Ezarri 96 m², wir 98 m²). Der Rechner zeigt dann einen Hinweis. Deshalb nie „1:1 wie Ezarri“ schreiben.

**Mischung (QM P1-1):** Ist eine Mischung gesetzt (`?m=`), wird jedes Mosaik einzeln auf volle Kartons gerundet. Bestellmenge ist dann die **Summe der Einzelkartons**. m², Blätter, Paletten, Gewicht, Kleber, Fuge und Werkzeug werden daraus neu berechnet (`kartonsUngemischt`, `mehrKartonsDurchMischung`). Der Satz „Jedes Mosaik auf volle Kartons gerundet: +n Kartons gegenüber ungemischt“ steht unter dem Ergebnis. Beispiel 64/7/4/25 %: 34 + 4 + 3 + 14 = 55 Kartons, 110 m².

**Mehr als Ezarri:** 4 Formen, Treppe, Bank, Rinne, Ø automatisch, Kartons/Blätter/Paletten/Gewicht, Corner/Cove, SVG-Skizze (Grundriss + Längsschnitt), Formel je Teil, URL-Zustand (Teilen/Neuladen), Übergabe an Anfrage (m² + Maße) und Custom Mix, Aufteilung der Kartons nach Mischung (`?m=`), Übernahme aus dem Konfigurator (`?k=`).

URL: Kurzschlüssel in `url.js` (`fo,f,l,b,la,ba,fa,fu,ek,tf,tt,tm,mg,bo,wa,tr,tb,st,au,sg,bl,bt,bw,ri,rl,ra,sp,m`), nur Abweichungen vom Standard.

## 2. Custom Mix

- 90 mischbare Mosaike (Ezarri-Regel `mischbar`), bis 4 (`MAX_MIX`), Summe immer 100 (größter Rest), je mind. 1 %.
- Anteil per Regler, Zahlenfeld und ±-Knöpfen (WCAG 2.5.7), Anteilsband als Leiste.
- Auswahl im `<dialog>` mit Suche, Serie, Farbe; fertige Ezarri-Mischungen (Rezepte, deren Teile mischbar sind) als Startpunkt.
- Vorschau auf `<canvas>` (`flaeche2d.js`): exakte Stückzahlen, mit festem Startwert gemischt (Mulberry32 + Fisher-Yates), 25/50/Hexa, 7 Fugen, Ausschnitt 0,5/1/2 m, trocken/unter Wasser (statische Lasur, keine Animation → reduced motion unkritisch). Canvas `aria-hidden`, Text-Zusammenfassung `aria-live`.
- **Töne je Mosaik** (`tones.json`, 12 KB): mit `build-tones.mjs` aus Ezarris Konfigurator-Vorschaubildern gemessen (k-means in CIELAB, Fugen-Cluster verworfen), bis 4 Töne mit Gewicht. Grund: 57 Mosaike haben keinen Hex-Wert, die übrigen nur Shader-Grundfarben. Neu erzeugen: `node src/lib/ezarri/rechner/build-tones.mjs`.
- Teilen-Link: `?m=37-70.38-30&fu=1&f=50&s=4711&w=1`. Übergabe an den Rechner (`?m=`, `f`) und an die Anfrage (`ref`, `m`, `fu`, `f`).
- **Referenz im richtigen Format (QM P1-2):** `configurator.json → referenz` zeigt bei 23 von 90 mischbaren Mosaiken auf die 50-mm-Referenz, zum Beispiel `2521-b-50`. `palette.server.js referenzFuerFormat()` / `referencesForMix(mix, format)` lösen deshalb über die Format-Varianten der Referenz auf: 25 → `2521-b`, 50 → `-50`, hexa → `-hexa`. Fehlt die Variante, wird 25 mm genommen. Jedes Paletten-Mosaik trägt `refs` je Format. In 20 Fällen bietet der Konfigurator 50 mm an, der Katalog hat aber keine 50-mm-Referenz (z. B. 2512-C, 2508-A, Azur). Dann wird die 25-mm-Referenz angefragt, und die Anfrage nennt „Format 50 mm“ als eigene Zeile. **An Team A/B:** Die Datenlücke steht hier, `configurator.json` bleibt unverändert.
- **Formate:** Ezarri schreibt „Hexa“. Das wird jetzt auf `hexa` normalisiert, vorher war Hexa im Mischpult nie wählbar. Gesperrte Formate nennen ihren Grund, z. B. „50 mm gibt es nicht für Blue Iridescent.“ (P2-7).
- **Bild speichern / Drucken (QM P1-3, Parität zu „Datei herunterladen“):** `CustomMix/mischExport.js` erzeugt ein PNG mit 1600 px Breite: die Fläche mit demselben Startwert wie die Vorschau, darunter ein Textstreifen mit Rezept (Name, Serie, Code, %), Fuge, Format, Ausschnitt, Ansicht, Teilen-URL, „Daten und Bilder: Ezarri, ezarri.com, Stand 28.10.2026“, Farbhinweis und Adresse. Ohne Lead-Gate. „Drucken“ liefert ein A4 über `@media print` (Portal an `<body>`) mit QR-Code zum Teilen-Link. `qrcode` ist installiert und wird erst beim Klick geladen. **An Team B:** Das PDF-Datenblatt im Konfigurator sollte dieselbe Reihenfolge der Angaben nutzen.
- **Suche (P2-6):** Durchsucht werden Name, Serie, Code, Farbfamilie (deutsch, mit Alltagswörtern wie „türkis“) und Finish (glänzend, Perlmutt/Iridescent, Spiegel). Mehrere Wörter werden mit UND verknüpft. Fertige Mischungen erscheinen als eigene Treffer zum Laden. Nicht mischbare fertige Mosaike wie „Mojito“ erscheinen mit Link zur Mosaik-Seite (`getFesteMosaike()`). Bei 0 Treffern gibt es „Filter zurücksetzen“.
- **Bedienung:** Nach dem Schließen des Dialogs geht der Fokus zurück auf „Mosaik hinzufügen“, bei 4 Mosaiken auf die Überschrift „Mischung“ (P2-2). Mobil erscheint beim Mischen oben rechts eine kleine Vorschau (96 px) mit Summe (P2-3). Sie wird über einen IntersectionObserver eingeblendet, ohne Animation bei reduced motion. Vorschaubilder zeigen den gemessenen Hauptton als Platzhalter (P3-4). „Iridiscent“ (Ezarri-Tippfehler) wird angezeigt als „Iridescent“, Codes bleiben unverändert (P3-3).
- `mischung.js` hat dieselben Namen wie Team Bs Vertrag (`normalizeMix`, `canMix`, `cellAssignment`). Team B hat `mix.js`/`preview2d.js` noch nicht geliefert; Umstellung ist ein Import-Tausch.

## 3. Anfrage

**Komponenten** (`src/components/Ezarri/Anfrage/`):
- `AnfrageLink.js` (server-sicher): `anfrageHref({art, refs, k, m, fu, f, m2, rechner, projekt, quelle})` → `/ezarri/anfrage?art=…&ref=a,b&k=…&m=…&fu=…&f=…&m2=…&r=…`; `<AnfrageLink …>` = Button mit diesem Link. Props im Dateikopf.
- `AnfrageForm.js` (Client): Props `art, referenzen[{id,code,name}], m2, projektart, k, m, rechner, quelle, kontext[], headingLevel, idPrefix, endpoint, musterLink, onSuccess` (Details im Dateikopf). Für Konfigurator/Katalog direkt einbettbar (z. B. im Sheet mit `headingLevel={3}`, eigenem `idPrefix`). Chips holt der Server mit `getReferenceChips(ids)` (`palette.server.js`).

Pflicht: Art (Muster/Beratung/Angebot), Name, E-Mail **oder** Telefon, Einwilligung. Optional: Mosaike (≤ 6, entfernbar), m², Projekt, Profil, Zeitraum, Ort, Land, Nachricht. Formular-Vertrag wie alle Lead-Formulare (Honeypot, `_t`, Fehler am Feld + Zusammenfassung, Bestätigung inline mit Fokus). Kein „Muster kostenlos“ (offen beim Inhaber).

**API** `POST /api/ezarri/anfrage` (`route.js` → `handler.js`): gleiche Herkunft → `guardForm` (5 Sendungen / 20 Versuche je IP in 10 min, 12 KB, Honeypot, Zeitfalle, zod-Allowlist aus `schema.js`, jitless für die CSP) → Referenzen auflösen → Versand.

**Schalter Versand** (`src/app/api/ezarri/anfrage/versand.js`):
- `EZARRI_ANFRAGE_BACKOFFICE = false` (Code-Konstante). Backoffice nur, wenn `true` **und** `NODE_ENV=production` **und** nicht `EZARRI_ANFRAGE_DRY_RUN=1`.
- Sonst Dry-Run, aber **nur außerhalb der Produktion** oder mit `EZARRI_ANFRAGE_DRY_RUN=1`: Die Anfrage wird als Datei in `.data/ezarri/outbox/<zeit>-<id>.json` abgelegt (gitignored), Antwort `{success:true, dryRun:true, id}`, das Formular zeigt „Testbetrieb“.
- **Produktion ohne Backoffice-Schalter (QM P1-4):** Antwort 503 `{success:false, code:"unavailable"}`. Es wird nichts abgelegt. Das Formular zeigt „Online-Anfragen sind gerade nicht möglich“ mit Telefon- und E-Mail-Link des Studios. Eine nur lokal gespeicherte Anfrage erscheint nie als Erfolg.
- **Freischaltung hängt an zwei Schaltern:** `EZARRI_PUBLIC` (config.js) darf erst auf `true` gesetzt werden, wenn `EZARRI_ANFRAGE_BACKOFFICE` (versand.js) `true` ist. Wird das nicht eingehalten, schlägt `tests/unit/ezarri-rechner-qm1.test.mjs` fehl (`freischaltungZulaessig`).
- **Fuge, Format, Zubehör (QM P2-5):** Das Schema kennt `fuge` ("1"–"7"), `format` (25/50/hexa) und `zubehoer` {kleber kg, fuge kg, werkzeug Paket, corner lfm, cove lfm}. Bei „Angebot“ gibt es das aufklappbare Feld „Zubehör mit anbieten“ mit Checkboxen und änderbaren Mengen, vorbelegt aus dem Rechner. Die Kontextzeile lautet z. B. „Fuge: Grigio Ardesia 130 · Format 25 mm“. `anfrageText()` rechnet die Mengen auf dem Server aus dem Rechner-Zustand nach: m², Kartons je Mosaik, Mehrkartons durch Mischung, Kleber, Fuge, Gewicht, Paletten, Corner/Cove-lfm. Dazu kommen das gewünschte Zubehör und absolute Links (`https://platzhirsch.studio/de/…`).
- Vorbereiteter Produktionsweg: `create_anfrage` (wie `/api/beratung_anfrage`), Zuordnung `toBackofficePayload()`. Bei Backoffice-Fehler wird die Anfrage zusätzlich im Postausgang abgelegt und ehrlich als Fehler gemeldet.

## Dateien

- `src/app/[locale]/ezarri/{rechner,custom-mix,anfrage}/page.js`
- `src/components/Ezarri/Rechner/{RechnerApp,PoolSkizze}.js`, `CustomMix/{CustomMixApp,MosaikFlaeche}.js`, `Anfrage/{AnfrageForm,AnfrageLink}.js`
- `src/lib/ezarri/rechner/{core,flaechen,url,mischung,flaeche2d,copy}.js`, `palette.server.js`, `tones.json`, `build-tones.mjs`
- `src/app/api/ezarri/anfrage/{route,handler,schema,versand}.js`
- `src/components/Ezarri/CustomMix/mischExport.js` (PNG/A4/QR)
- Tests: `tests/unit/ezarri-rechner.test.mjs` (19), `tests/unit/ezarri-rechner-qm1.test.mjs` (7, QM-Runde 1), `tests/e2e/ezarri-rechner.spec.js` (Desktop, inkl. axe), `tests/e2e/ezarri-rechner-iphone.spec.js` (WebKit), `tests/e2e/ezarri-rechner-qm1.spec.js` (QM-Runde 1, Desktop und Handy-Maße inkl. axe mobil), `tests/e2e/ezarri-rechner-qm2.spec.js` (QM-Runde 2: Mini-Vorschau und verdeckter Fokus auf 393 px, 412 px und 1440 px)
- Übersetzungsvorschläge: `ezarri-messages-vorschlag.json` (`ezarri.c.*`, 38 Schlüssel)
- Keine neuen npm-Pakete (`qrcode` war schon installiert).

## Offen

1. **Inhaber:** Musterbedingungen (kostenlos? Anzahl? Versand), Ansprechperson für die Bestätigung, Freigabe des Backoffice-Schalters.
2. **Backoffice-Team:** `create_anfrage` verlangt heute E-Mail **und** Telefon; die Ezarri-Anfrage braucht nur eins → leeres Feld akzeptieren oder eigener Doctype „Ezarri-Anfrage“. Vorher Schalter nicht umlegen.
3. **Team B:** `state.js`/`mix.js`/`preview2d.js`/`geometry.areas()` fehlen noch. `fromKonfigurator()` liest das Schema v1 aus dem Vertrag; Formen „runde Enden/Eckradius“ rechnet der Rechner als Rechteck (Hinweis wird angezeigt). Link „Im Konfigurator ansehen“ erst einbauen, wenn `/ezarri/konfigurator` existiert.
4. **Annahmen zum Prüfen:** Fugenfaktor Hexa 0,9 kg/m² (Ezarris Zweig „36“); Rinnen-Abwicklung 0,4/0,9 m; Ezarri nennt keine Sackgrößen für Kleber/Fuge, daher nur kg.
5. **Nicht gebaut** (Konzept §7.3, Phase 2): `/custom-mix/pixel` (Pixel-Bild-Generator), `/custom-mix/motive` (Printed/Patterns/Fading out), `/anfrage/danke` als eigene Seite (Bestätigung ist inline).
6. **Concierge-Team (P2-4):** Der Concierge-Knopf verdeckt in Custom Mix mobil „Neu mischen“ und am Desktop die Skizze im Ergebnis-Panel. Bitte `bottom` so wählen, dass der Knopf über der Leiste sitzt und nicht über Bedienelementen, oder `/ezarri/rechner|custom-mix` in `hiddenOn` aufnehmen (`src/components/Concierge/flags.js`, nicht unser Bereich). Belege: `qa-screenshots/ezarri/rechner/qa1/`.
7. **Team A (P3-7):** „Muster anfragen“ in der Ezarri-Unternavigation (`Welt/LocalNav.js`) verliert den Zustand von Rechner und Mischung. Vorschlag: Auf `/ezarri/rechner` und `/ezarri/custom-mix` auf den Anfrage-Link mit Zustand verweisen.
8. **P3-5:** Den React-Hinweis „state update on a component that hasn't mounted“ (Android, custom-mix) konnte ich nicht nachstellen. Die Zeichnung setzt den Zustand nur im rAF nach dem Mount. Ein einmaliger Hydration-Fehler beim Screenshot-Lauf trat bei erneuten Läufen (rechner, custom-mix) nicht wieder auf. Er kam vermutlich vom Neu-Kompilieren während der Änderungen.

## QM-Runde 1 (feedback-1.md), umgesetzt 28.10.2026

P1-1 Mengen mit Mischung · P1-2 Referenz im Format · P1-3 Bild speichern + A4 mit QR · P1-4 Freischalt-Sperre + 503 „unavailable“ · P2-1 Rechenweg mobil als Liste, Tabelle ab sm als fokussierbare Region · P2-2 Fokus nach dem Dialog · P2-3 Mini-Vorschau mobil · P2-4 Rechner-Leiste trägt `data-cta="primary"`, damit die Termin-Leiste (MobileCtaBar) ausweicht. Es gibt keine doppelte Leiste mehr, ohne Änderung an `client-layout.js`. Für den Concierge siehe Offen Nr. 6 · P2-5 Fuge/Format/Zubehör/Mengen · P2-6 Suche · P2-7 Format-Grund · P3-1 Hinweis bei eigener Ø-Tiefe und Doku-Wortlaut · P3-2 Hinweis „Werte getauscht“ (gab es schon) · P3-3 Iridescent · P3-4 Platzhalterfarbe · P3-6 Abstand mobil (`gap-stack-m`). Screenshots: `qa-screenshots/ezarri/rechner/fix1/`. Tests: Unit 26/26 grün (19 + 7). E2E (PW_WORKERS=1): `ezarri-rechner-qm1.spec.js` 5/5, `ezarri-rechner.spec.js` und `-iphone` 11/11. Erwartung zum Anfrage-Link um `f=` ergänzt, zwei Läufe waren durch die Serverlast flaky. Fremd-rot und nicht von uns: `ezarri-konfigurator` (457 statt 402 Referenzen), `messages-feinschliff`/`upload`.

## QM-Runde 2 (feedback-2.md), umgesetzt 28.10.2026

- **P2-1 Mini-Vorschau:** Die Messung läuft jetzt mit Scroll-, Resize- und Fokus-Listener (rAF) statt mit dem IntersectionObserver auf dem Canvas. Die Mini-Vorschau erscheint, wenn die Mischung im Blick ist und **von der Mosaikfläche unter 15 %** unter dem Header sichtbar sind. Sie sitzt nie über der Vorschau-Sektion: `top = max(Header + 12 px, Unterkante section[aria-labelledby=cm-vorschau] + 12 px)`. Ist darunter kein Platz mehr oder liegt ein fokussiertes Element unter ihr (2.4.11), wird sie ausgeblendet. **Abweichung von der Anweisung:** Die vorgeschlagene Schwelle „< 15 % der ganzen Sektion“ hätte auf dem Pixel bei zentriertem erstem Regler nicht ausgelöst, weil dann noch rund 40 % der Sektion (Knöpfe, Hinweise) sichtbar sind. Das hätte dem verlangten E2E widersprochen. Gemessen wird deshalb die Fläche, und die Überdeckung wird über die Position ausgeschlossen. Die Mini-Vorschau zeigt nur noch „100 %“ statt „Summe 100 %“ und ist damit niedriger.
- **P2-2 Fixe Leisten:** Die Sektion „Mischung“ trägt `data-cta="primary"`. Die MobileCtaBar weicht damit aus, solange die Mischung sichtbar ist, wie beim Rechner. Alle Buttons, Inputs und Links der Mischung, des Rechner-Formulars und des Anfrage-Formulars bekommen `scroll-mb-24`. Dazu kommt `fokusFrei()` am Wurzelknoten von Custom Mix: Liegt ein fokussiertes Element nach `elementFromPoint` unter einer fixen Ebene (Concierge, Leiste), wird es mit `scrollIntoView({block:"nearest"})` über die Leisten geholt (scroll-margin, reduced motion beachtet). Damit ist auch der Desktop-Fall mit dem Concierge-Knopf bei Tastaturbedienung gelöst. Bei Maus oder Touch bleibt die Überdeckung am Desktop Sache des Concierge-Teams (Offen Nr. 6).
- **P3 umgesetzt:** 1 Export-Text „Ansicht: Unter Wasser“ (ohne `toLowerCase`) · 2 Code nur, wenn er sich von Name bzw. Serie + Name unterscheidet (`codeZusatz`) · 3 schmales geschütztes Leerzeichen (U+202F) vor %, m², kg, kg/m², lfm in Rechner, Custom Mix und `flaecheText` · 7 `qrcode` wird bei Hover oder Fokus auf „Drucken“ vorgeladen.
- **P3 offen:** 4 Suche „türkis“ nach Hue sortieren und 5 Format-Wörter in der Suche (beides im eigenen Bereich, Phase 2, kein Fehler). 6 Hinweis zur 50-mm-Datenlücke braucht die Abstimmung mit Team B über die Formulierung und Lieferbarkeit.
- **An den Teamleiter:** Den Menülink „Ezarri Glasmosaik“ (`src/lib/features.js`, `NEXT_PUBLIC_FEATURE_EZARRI`) zusätzlich an `EZARRI_PUBLIC` koppeln. Der Kommentar in `features.js` Z. 179–181 behauptet eine „schriftliche“ Erlaubnis, die es noch nicht gibt. Beides liegt nicht im Bereich von Team C.
- Screenshots: `qa-screenshots/ezarri/rechner/fix2/` (Mini-Vorschau und Tab auf das letzte Feld; iPhone, Pixel, Desktop).

## Prüfstand 28.10.2026

- Unit: `tests/unit/ezarri-rechner.test.mjs` 19/19 grün (inkl. Prüfwert 106 m² / 265 kg / 127 kg, Route-Dry-Run in Temp-Postausgang, Rate-Limit 5/10 min).
- E2E (PW_WORKERS=1): alle 11 Tests grün (Desktop inkl. axe ohne serious/critical auf allen drei Seiten, 404 in en/fr/it; iPhone WebKit: Rechner, Custom Mix, Anfrage). Wegen des stark ausgelasteten Dev-Servers in mehreren Teilläufen; die Specs setzen die Cookie-Einwilligung vorab und laden mit Wiederholung (`open()`).
- Screenshots: `qa-screenshots/ezarri/rechner/selbst/` (iPhone, Pixel, iPad, Desktop), kein Querscroll.
- Hinweis Unit-Suite: `tests/unit/messages-feinschliff.test.mjs` verlangt, dass jede `features/*messages*.json` schon in `src/messages` übernommen ist. Die vorgegebene Datei `ezarri-messages-vorschlag.json` (alle Ezarri-Teams) ist das bewusst noch nicht (Phase 2) → der Test ist rot, wie schon vorher wegen `arbeitsweise-messages-vorschlag.json`. Entscheidung Teamleiter: Ezarri-Vorschlag im Test ausnehmen oder Phase-2-Übernahme.
