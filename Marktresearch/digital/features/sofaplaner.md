# Feature: Sofaplaner für Minotti-Modelle (Labs)

Stand: 28.10.2026 · Seite: `/de/labs/sofaplaner` (nur `de`, `noindex, nofollow`) · Direkteinstieg je Modell: `/de/labs/sofaplaner?m=<slug>` (z. B. `?m=connery`)

Der generische Modulplaner wurde auf die **echten Minotti-Modelle** umgebaut, nach den verbindlichen Anforderungen des Inhabers (`sofaplaner-anforderungen-inhaber.md`): vollständiger Bauteil-Katalog, aber geführt und einfach.

## Was gebaut ist
- **Katalog:** alle **90 Familien** aus `src/lib/sofaplaner/minotti/*.json`. Aus 4 726 Recherche-Einträgen werden nach der SX/DX-Aufteilung 6 285 Planer-Elemente. Davon sind 6 132 platzierbar, der Rest sind Kissen und Zubehör. 68 Familien sind modular, 22 haben eine feste Größe, 24 sind Outdoor. Die Maß-Vollständigkeit je Familie liegt bei 53–100 % (Median 81 %).
- **Geführter Ablauf in 6 Schritten:** Ein Stepper führt durch die Schritte, der Fokus springt auf den Schrittitel, mobil liegt „Zurück/Weiter“ als Leiste unten.
  1. **Modell:** große Karten mit Name, Designer, Jahr, Charakter in einem Satz, Draufsicht-Piktogramm einer Startform, Elementzahl und Maß-Vollständigkeit. Dazu Suche und die Filter *Alle / Modular / Feste Größe / Outdoor / Sofabett*.
  2. **Form:** Startvorschläge je Modell: Gerade, Ecke links, Ecke rechts, U-Form, mit Chaiselongue, mit Peninsula, Insel, Einzelsofa. Sie entstehen nur aus echten Elementen mit dem Andock-Algorithmus (329 Startformen über alle Familien, alle per Test gültig; Stand Feinschliff 28.10.2026). Die Beispiel-Kompositionen des Herstellers stehen als Liste darunter.
  3. **Anpassen:**
     - Elemente erscheinen als Kacheln mit Draufsicht-Piktogramm, deutschem Kurznamen, Maß und dem Hinweis „links oder rechts – passt sich an“, gruppiert nach Art.
     - Der Filter „Passt jetzt“ zeigt nur anschließbare Elemente. Alles andere ist ausgegraut mit Kurzbegründung, Antippen erklärt ausführlich.
     - Antippen dockt an, bevorzugt am ausgewählten Element, und wählt SX/DX selbst.
     - Drag & Drop geht aus der Palette (Desktop) und im Plan (Maus/Touch). Ein Magnet zieht an freie Anschlussseiten (grün gestrichelt).
     - Ungültige Züge werden beim Loslassen zurückgesetzt, mit Erklärung: Überlappung, Armlehne an Anschlussseite, andere Linie oder anderes Sitzmodul.
     - Der Inspector zeigt die Maße (B × T × H, Sitzhöhe, Sitztiefe) und fehlende Maße, dazu Drehen, Seite wechseln, Noch einmal und Entfernen.
  4. **Ausführung:** nur Optionen aus der Recherche-Datei.
     - Bezug als neutrale Materialfamilie, abgeleitet aus den Herstellerkategorien (z. B. Stoff, Leder, Samt, Nubuk, Outdoor), mit neutralen Farbtönen.
     - Bezugsart (fest/abnehmbar) und Bezugs-Ausführung.
     - Rücken (Mehrfachauswahl), Armlehne, Sockel/Füße (färbt den Sockel in 3D).
     - Kissen und Zubehör mit Anzahl, Polsterung als Info.
  5. **Im Raum prüfen:** Raum, Raster, Fenster mit Brüstung und Türen mit Schwenkbereich. Die Prüfliste umfasst Laufwege von 80–90 cm, den Türschwenk und Fenster gegen die **echte Elementhöhe**.
  6. **Übersicht:**
     - Klartext-Liste der Planung.
     - Aufklappbar darunter „Details für die Bestellung“: Stückliste mit Planer-Code, wo vorhanden Hersteller-Elementnummer, B/T/H/Sitzhöhe/Sitztiefe („fehlt“ markiert), Quellen-Links und was der Hersteller nicht veröffentlicht.
     - Merkliste, Teilen-Link und „Planung im Showroom besprechen“ mit Anfrage-Text, der **nicht gesendet** wird.
- **Einfach / Experte:** Schalter oben rechts (localStorage). Im Expertenmodus erscheint jedes Element einzeln (SX und DX getrennt), dazu Codes, Linienfilter und die Anschluss-Notizen aus der Recherche.
- **2D-Draufsicht:**
  - Maßstäblich. Rücken, Armlehnen und Sitzteilung sind schematisch, die Außenmaße stammen vom Hersteller.
  - Kurzlabels wie „Ecke“, „Ende L“, „Mitte“, „Chaiselongue R“.
  - Gesamtbemaßung B und T mit Endstrichen, Abstände des gewählten Elements zu Wand und Nachbar.
  - Gestrichelte Schraffur, wenn Breite, Tiefe oder Höhe fehlen.
- **3D-Vorschau:**
  - Prozedurale Volumen nach Breite, Tiefe, Gesamthöhe, Sitzhöhe und Armlehnenhöhe. Polster sind schematisch, keine Herstellerbilder, keine Texturen.
  - Stoff mit Sheen, Leder glatter, Sockel in der gewählten Finish-Familie.
  - Elemente ohne veröffentlichte Höhe oder Sitzhöhe erscheinen halbtransparent mit dem Median der Komposition, die Bildunterschrift weist darauf hin.
  - Lazy (`next/dynamic`, `ssr:false`), Fallbacks wie bisher (kein WebGL, Kontextverlust, Chunk-Fehler).
- **Preis:** `PRICE_CONFIG` ist leer, `placeholder: true`. Angezeigt wird „Richtpreis · Im Gespräch“ mit „Richtwert – vom Inhaber festzulegen“, ohne Beträge.

## Anschlussregeln (abgeleitet, im UI erklärt)
Minotti veröffentlicht keine Kombinationsmatrix. Der Planer leitet die Regeln aus dem Elementtyp ab (`src/lib/sofaplaner/geometry.js → topology`):

| Rolle | Elementarten (Recherche-Feld `art`) | Anschlussseiten (Blick von vorn) |
|---|---|---|
| Ende | endelement*, anbau-links/-rechts, chaise*, peninsula*, daybed-element mit Seite | SX: Abschluss links, Anschluss rechts · DX umgekehrt |
| Mitte | mittel*, element, sessel-mittel/-modul, verbindungstisch, back-to-back | beide Seiten |
| Ecke | ecke* | SX: Rücken oben+links, Anschluss rechts+vorn · DX gespiegelt |
| Frei | sofa, couch, sessel, daybed, ecksofa … | keine (frei stellbar) |
| Lose | hocker, bank, insel, tisch | keine, nur Überlappung/Abstand |
| Zubehör | kissen, kopfstütze, armlehne, zubehör | nicht im Grundriss, Menge in Schritt 4 |

- Zwei Elemente sind verbunden, wenn zwei **offene** Seiten bündig aneinanderliegen (mindestens 5 cm Kontakt, Toleranz 1 cm). Die Rückenkanten werden dabei ausgerichtet, an einer Ecke wird der Schenkel gedreht.
- **Blockiert:** eine offene Seite an Armlehne oder Rücken, verschiedene `linie`, verschiedenes `sitzmodul_cm`.
- **Hinweis:** unterschiedliche Tiefen bei geraden Elementen; gebogene oder geneigte Elemente (als Rechteck vereinfacht).
- **Offen:** Eine ungenutzte Anschlussseite ergibt den Hinweis „mit End-, Eck- oder Mittelelement abschließen“.
- Fehlt im Datensatz die Seite eines Endelements, gibt es beide Varianten, markiert als „Seite abgeleitet“ (592 Einträge).

## Daten: was übernommen wird, was fehlt
- **Normalisierung:** `src/lib/sofaplaner/normalize.js` vereinheitlicht die unterschiedlichen Feldnamen der Recherche-Teams: `ausrichtung`/`seitenvarianten`/`seiten`/`ausfuehrung_seite`/`ausfuehrungen`, `code`/`id` und Optionslisten als Text, Liste oder Objekt. **Kein Maß wird erzeugt**, das prüft der Test „jede Zahl stammt 1:1 aus der Recherche-Datei“.
- **Namen:** Englische Herstellernamen ohne `name_de` bekommen einen deutschen Kurznamen aus einem Glossar, z. B. „Endelement mit Armlehne Low 152 cm“. Der Originalname steht in der Stückliste.
- **Fehlend** (im UI markiert mit „Maß im Showroom bestätigen“):
  - Sitztiefe bei 4 020 von 5 499 Sitzelementen
  - Breite oder Tiefe bei 27 Elementen; sie sind nicht platzierbar, die Kachel nennt den Grund
  - Höhen teilweise
  - Artikelnummern: Planer-Codes sind interne Schlüssel, Hersteller-Elementnummern gibt es nur, wo sie im Datenblatt stehen
  - Preise und Preisgruppen
  - Kombinationsmatrix
  - genaue Winkel und Radien gebogener Elemente
- **Yves:** `yves.json` (Yves, 220 Elemente) und `yves-sofa.json` (Yves Sofà, Variante mit geringerer Sitztiefe, 63 Elemente) sind laut Recherche zwei Produkte. Beide werden angeboten.
- **Rechte:** Das Feature verwendet **keine Herstellerbilder**. Kacheln, Karten und 3D sind generierte Draufsichten und Volumen, `bild_quelle`-URLs aus der Recherche werden nicht angezeigt. Ein Eintrag im Rechte-Register ist daher nicht nötig, Freistellungen von Minotti-Bildern gibt es hier nicht.
- **Marke:** Markennamen stehen nur beschreibend da („Minotti-Modell Connery“), ohne Händler- oder Lieferaussage. Ein Quellenhinweis verweist auf öffentliche Herstellerunterlagen.

## Dateien
| Datei | Zweck |
|---|---|
| `src/lib/sofaplaner/normalize.js` | Recherche-JSON → Planer-Familie (Rollen, Seiten, Maße, Optionen, Vollständigkeit, deutsche Kurznamen) |
| `src/lib/sofaplaner/geometry.js` | Footprint, Topologie, Andocken (`dockCandidate`, `findDock`, `snapDock`, `attachAt`), Verbindungsprüfung (`analyzeJoins`, `joinIssue`) |
| `src/lib/sofaplaner/templates.js` | Startformen je Familie, Platzierung im Raum, Thumbnails |
| `src/lib/sofaplaner/materials.js` | neutrale Materialfamilien und Farbtöne, Sockel-Finish für 3D |
| `src/lib/sofaplaner/minotti-data.js` | **generiert** (`tools/build-catalog-index.mjs`): statische Imports aller Familien-JSON und `minotti-covers.json` – Daten im Server-Bundle |
| `src/lib/sofaplaner/catalog.server.js` | `server-only`: normalisiert alle Familien (aus `minotti-data.js`) einmal pro Prozess, Index für die Modellwahl, Familie für den Browser (verkleinert) |
| `src/app/[locale]/labs/sofaplaner/page.js` | Seite, `?m=` (Modell), `?p=` (geteilter Plan), statische Tipps und Modellliste ohne JS |
| `src/app/[locale]/labs/sofaplaner/katalog/[slug]/route.js` | `GET` eine Familie als JSON für den Modellwechsel im Browser; 404 für unbekannte Slugs und andere Sprachen |
| `src/app/[locale]/labs/sofaplaner/teilen/route.js` | `POST` Plan → Token; prüft jetzt zusätzlich Familie und Elementcodes |
| `src/components/Labs/Sofaplaner/model.js` | Plan v2, Schema, Prüfungen, Stückliste, Anfrage-Text, Preis-Platzhalter |
| `src/components/Labs/Sofaplaner/Planner.js` | Client-Insel: Schritte, Zustand, Undo, Andocken, Raum |
| `ModelPicker.js`, `Palette.js`, `LookPanel.js`, `Summary.js`, `ResultPanel.js` | Schritte 1, 3, 4, 6 sowie Merkliste, Teilen und Anfrage |
| `PlanSvg.js`, `Glyph.js`, `Preview3D.js` | 2D-Draufsicht, Element-Piktogramme, 3D |
| `sofaplaner.module.css` | nur Rollen-Tokens aus `globals.css`, Radius 0, 44-px-Ziele |

## Datenmodell (Plan v2)
```js
{ v: 2, name, family: "connery", room: { w, d }, grid: 5|10|20,
  openings: [{ id, type: "window"|"door", wall, offset, width, sill }],
  items: [{ id, code, x, y, rot, w, d }],   // Mittelpunkt, rot 0/90/180/270, w/d aus dem Katalog
  look: { material, tone, back: [optId], arm, base, coverType, variant, cushions: [{ id, q }] } }
```
Beim Laden (Teilen-Link, Entwurf, Merkliste) setzt `resolvePlan` die Maße aus dem Katalog und entfernt unbekannte Codes. v1-Pläne mit generischen Modulen werden nicht mehr geladen.

## Tests und Selbstprüfung (27.10.2026)
- **Unit, neu:** `tests/unit/sofaplaner-minotti.test.mjs` mit 12 Tests:
  - alle Familien lesbar, Codes eindeutig, keine erfundenen Maße, SX/DX
  - Andocken gerade und an der Ecke
  - Konflikte: Armlehne an Anschluss, Linie, Sitzmodul
  - alle 317 Startformen gültig
  - Schema v2, `resolvePlan`, Anfrage-Text ohne Preise, deutsche Namen
- **Unit, angepasst:** `tests/unit/labs-sofaplaner.test.mjs` (7 Tests) läuft jetzt mit echten Connery-Elementen.
- **Unit, gesamt:** 784 von 785 grün. Der eine rote Test (`sitemap.test.mjs`, live) ist einzeln grün und lief unter Last in eine Zeitüberschreitung.
- **E2E, neu:** `tests/e2e/sofaplaner-minotti.spec.js` mit 8 Tests (desktop plus ein WebKit-iPhone-Lauf):
  - alle 90 Familien wählbar
  - ein Laie findet ein Ecksofa (Suche → Ecke links → Übersicht)
  - ungültige Kombination wird erklärt
  - Antippen dockt an
  - Drag & Drop mit Magnet und Zurücksetzen
  - Ausführung landet in der Stückliste
  - iPhone-Touch-Ablauf inklusive 3D, ohne Querscrollen
  - axe WCAG 2.2 AA in allen 6 Schritten ohne serious/critical
- **E2E, angepasst:** `tests/e2e/labs-sofaplaner.spec.js` (6 Tests), neu darin „3D schließen ist kein Kontextverlust“. Alle grün.
- **Screenshots:** `qa-screenshots/labs-ausbau/sofaplaner/selbst/` (`shoot.mjs`, `interact.mjs` für iPhone und Desktop, `extra.mjs` für Supermoon, Lars und Roger). Konsolenfehler: keine.
- **Behoben:** R3F löst beim Schließen der 3D-Ansicht `webglcontextlost` aus. Das wurde fälschlich als „vom Browser beendet“ gemeldet.

## QM-Runde 1: Fix (27.10.2026, `qa-screenshots/labs-ausbau/sofaplaner/feedback-1.md`)

Nachprüfung unter `qa-screenshots/labs-ausbau/sofaplaner/fix1/`: `shoot.mjs` (4 Geräte, Status 200, kein Querscrollen), `probe.mjs iphone|android` (Ablauf Modell → Übersicht per Touch), `desktop.mjs` (schwebende Auswahl-Leiste, Ausführung), Playwright-Läufe in `fix1/pw-results`.

| Punkt | Umsetzung |
|---|---|
| P1-1 Touch-Drag Android | `touch-action: none` auf dem ganzen `<svg>` (Schritte 2–5), nicht mehr nur auf den `<g>`-Kindern, die Chrome ignoriert. `pointercancel` setzt das Element zurück (`onDragCancel`). Neuer Test mit echten CDP-Touch-Events auf Pixel 7: Element bewegt sich um mehr als 40 cm, die Seite scrollt nicht. Ein echtes iPhone ist weiter ungeprüft. |
| P1-2 Mobiles Layout | Unter 1024 px: Stepper als sticky Leiste (52 px, Zahlen, aktueller Schritt mit Namen), Modell und Expertenmodus im „…“-Menü. Der Plan ist sticky darunter (SVG höchstens 32 svh, Kopf mit „2D/3D“, Status und Rückgängig). Der Schrittinhalt läuft direkt darunter, die Leiste „Zurück / Weiter: …“ ist unten sticky, über `--ph-consent-h` und der Safe Area. Beim Schrittwechsel bekommt die Überschrift den Fokus und rückt direkt unter den Plan, nie an den Seitenanfang. `--sp-cover` setzt `scroll-margin`, damit fokussierte Elemente nicht unter dem Plan liegen (WCAG 2.4.11). Blendet sich der Seitenkopf beim Scrollen aus, rücken Leiste und Plan nach oben. Hero mobil: ein Satz. |
| P1-3 Startform mit Konflikt | `fitTemplate` (model.js) probiert zuerst den üblichen Platz, dann andere Plätze an der Rückwand (der nächste zuerst), dann die ganze Gruppe zu den anderen Wänden gedreht. Die Anschlüsse bleiben dabei erhalten. Von den 317 Startformen im Standardraum stehen 307 ohne Fehler. 10 passen physisch nicht (breiter als 560 cm, oder der Schenkel reicht immer in den Türschwenk): Ihre Kachel trägt „Passt nicht in Ihren Raum (B × T)“ und eine gestrichelte Kontur. Wird sie trotzdem gewählt, erklärt ein Hinweis, was zu ändern ist. Der Startplan jeder Familie hat 0 Fehler. |
| P1-4 Raumeingabe | Leere oder ungültige Werte werden nicht übernommen. Es erscheint eine Inline-Meldung („Bitte 150–2 000 cm eingeben. Es gilt weiter …“) mit `aria-invalid` und `aria-describedby`, Esc stellt den alten Wert wieder her. `fitItemsToRoom` verschiebt das Sofa nur als Block und schiebt nie ein Element ins andere. Ist der Raum zu klein, gibt es den Konflikt „Sofa (294 cm) ist breiter als der Raum (150 cm).“ Jede Raumänderung, die das Sofa verschiebt, zeigt einen Toast mit „Rückgängig“. **Geänderter Test:** `labs-sofaplaner.test.mjs` erwartete bisher das Ineinanderschieben. Er prüft jetzt den Block mit Konflikt und keine Überlappung. |
| P2-1 Hinweis bleibt stehen | Der Hinweis wird gelöscht bei Schritt- oder Ansichtswechsel, Undo und jeder erfassten Änderung. Sonst verschwindet er nach 6 s, außer bei reduced motion. Er liegt als Overlay über dem Plan. |
| P2-2 Englische Optionen | `germanOptionLabel` und `OPTION_GLOSSARY` in normalize.js: „Optionales Rückenkissen 65 × 60 cm“, „Optionales Tablett …“, „Optionale Regenschutzhülle“ usw. Das Maß aus `masse` steht im Namen. Die ID bleibt gleich, gespeicherte Pläne gelten weiter. Der Herstellerbegriff (`labelEn`) erscheint nur im Expertenmodus. |
| P2-3 Rücken-Widerspruch | `src/lib/sofaplaner/options.js`: Die Grundart des Rückens ist eine Radiogruppe. Optionen wie Kopfstützen und Kissen sind Checkboxen unter „Zusätzlich zum Rücken“. Gilt eine Option nur für bestimmte Elemente (Klammer im Herstellertext), nennt der Planer diese Elemente. Ist keines davon im Plan, ist die Option ausgegraut. Beispiel Connery „Ohne Rücken (Bänke, Hocker)“: Ohne Hocker im Plan ist die Option gesperrt. |
| P2-4 Auswahl-Aktionen | Auf dem Desktop schwebt die Leiste direkt am Element, auf dem Handy unten im Plan, beide immer im Sichtbereich. Die Auswahl zeigt eine 4-px-Kontur in `--color-text`, einen hellen Halo und vier Griffpunkte. |
| P2-5 Modellkarten | Varianten einer Linie stehen auf einer Karte: 90 Modelle in 60 Linien, z. B. „Andersen · 8 Varianten“, jede Variante mit T × H. Neue Filter: Form (Ecke, U, Chaise, Insel), Tiefe, Höhe, Innen/Outdoor und Bauart, mobil eingeklappt. Auf der Karte stehen T × H (Median der Sitzelemente laut Hersteller, „–“ wenn nicht veröffentlicht) und die Breiten-Spanne. Mobil ist die erste Karte im ersten Bildschirm. |
| P2-6 Seitengewicht | Die Piktogramme der Karten werden erst im Sichtbereich gezeichnet (IntersectionObserver). Der Index ist schlanker: kein `kinds`, Piktogramme auf ganze cm gerundet. Die Liste „Alle 90 Modelle“ rendert erst beim Aufklappen (`FamilyList.js`), ihre Links sind mindestens 24 px hoch. Ergebnis: HTML im Dev von 583 KB auf 426 KB. Davon sind etwa 280 KB Grundgewicht jeder Seite (Messages, Layout), Vergleich `/de/impressum`: 279 KB. **Offen:** Messung nach `next build` und Lighthouse auf dem Preview-Build, weil im Repo nicht gebaut wird. |
| P2-7 Bezugskollektionen | `coverCollections` (normalize.js) übernimmt nur Kollektionsnamen, die die Recherche-Datei **dieser** Familie aus Minotti-Quellen zitiert: Aspen, Nabuk, Pelle Nature, Pelle Extra, Saddle-Hide, Coccodrillo, Pony/Zebra Look, Art Lifescape. Jeder Name steht mit Material, Kategorie und Quell-URL (minotti.com) da, ohne Bilder und ohne Farben. Bei Familien ohne Angabe steht „Namen der Bezugskollektionen für dieses Modell nicht veröffentlicht – im Showroom“. Minotti veröffentlicht keine vollständige Kollektionsliste je Modell; die Websuche ergab nur Pressetexte (z. B. minotti.com/en/2023-textile-and-leather-collectiona-haute-couture-project_2). |
| P3-1 | `?m=gibt-es-nicht` zeigt „Das Modell … wurde nicht gefunden. Bitte wählen Sie ein Modell aus der Liste.“ |
| P3-2 | `normalizeQuotes`: alle Modellnamen mit „…“. |
| P3-3 | `label` umschließt jeden Input, mindestens 44 px hoch (war schon so), deaktivierte Optionen ausgegraut. |
| P3-5 | Der Entwurfs-Banner ist sticky unter dem Kopf. |
| P3-6 | Der aktuelle Schritt zeigt mobil seinen Namen, die Überschrift „Schritt n von 6“. Ein „3/6“-Präfix passt bei 393 px nicht in die Leiste. |

**Tests:** neu sind `tests/unit/sofaplaner-fix1.test.mjs` (7 Tests) und `tests/e2e/sofaplaner-mobil.spec.js` (5 Tests). Der Pixel-7-Test nutzt echte Touch-Events per CDP und prüft das mobile Layout und die Auswahl-Leiste im Sichtbereich. Die Desktop-Tests decken „Ecke rechts“, die Raumeingabe „50“ und ein leeres Feld, Hinweis und Schrittwechsel sowie die Rücken-Radiogruppe ab. Alle Sofaplaner-Unit-Tests (26) sind grün, ebenso die bestehenden E2E-Specs `sofaplaner-minotti` und `labs-sofaplaner`.

**Rechte:** keine Herstellerbilder verwendet, nur Namen und Maße mit Quelle. Am Rechte-Register ändert sich nichts.

## QM-Runde 2: Fix (27.10.2026, `qa-screenshots/labs-ausbau/sofaplaner/feedback-2.md`)

Nachprüfung unter `qa-screenshots/labs-ausbau/sofaplaner/fix2/`: `shoot.mjs` (4 Geräte, Status 200, kein Querscrollen) und `probe-fix2.mjs iphone|android|desktop` (Messwerte in `probe-*.json`, Screenshots `*-3d-nach-scroll.png`, `*-auswahl.png`, `*-ausfuehrung(-full).png`, `*-raum.png`, `*-zurueck.png`). Nicht-GET-Anfragen werden mit 503 beantwortet, es ging nichts ans Backoffice. Keine neuen npm-Pakete.

| Punkt | Umsetzung | Messung |
|---|---|---|
| P1-A 3D nach dem Scrollen | `Planner.js`: `sticky = step >= 2 && step <= 5` ist von der Ansicht entkoppelt, `stageSticky` und `data-sticky` hängen daran, `editing` (nur 2D) bleibt für die Bearbeitung. Mobil hat 3D die Höhe des Plans (`min(32svh, 300px)`), das Overlay „Zum Drehen antippen“ bleibt. | Canvas nach 1 500 px Scrollen und „3D“: oben bei 157 px (iPhone, Pixel 7), vorher −1 865 px. |
| P2-A Auswahlleiste | Die Leiste ist eine eigene Zeile außerhalb der Plan-Fläche: Desktop über dem Plan, mobil darunter im sticky Bereich. Solange sie sichtbar ist, wird der Plan nicht überdeckt. | Schnitt mit fremden `[data-id]`-Boxen: 0 auf allen drei Geräten (U-Form, Elemente 1–3). |
| P2-B Überschrift unter dem Plan | Das Scroll-Ziel wird nach dem Header-Übergang aus der tatsächlichen Unterkante aller `[data-sticky]` neu berechnet und bei Bedarf nachgezogen. | Abstand Überschrift zu Planende ≥ 13 px nach Weiter, nach Scroll + Weiter und nach Zurück (iPhone, Pixel 7). |
| P2-C Bezüge „alle Optionen“ | `src/lib/sofaplaner/covers.js` + `minotti-covers.json` (erzeugt von `src/lib/sofaplaner/tools/build-covers.mjs` aus den öffentlichen minotti.com-Produktseiten). Je Familie: Name, Material, Kategorie, Quell-URL und ein wörtlicher Beleg aus der Produktseite, keine Farben, keine Bilder. Markenweite Aussagen (Minotti-Newsseiten: Boston, Nabuk, Sattelleder, Outdoor-Stoffe, Kordel …) stehen getrennt unter „Weitere Materialien der Minotti-Kollektion“ mit „Markenweit laut Hersteller – Verfügbarkeit je Modell im Showroom bestätigen.“; Outdoor-Familien bekommen nur Outdoor-Materialien. Die vollständige Materialbibliothek („World of Materials“) liegt bei Minotti hinter dem Händler-Login und ist daher nicht erfasst. | 90 von 90 Familien mit mindestens einer Quelle, 84 mit Angaben der eigenen Produktseite, 41 mit benannter Kollektion (Aspen, Nabuk Lodge, Leder Kategorie Extra/Nature …). Ohne eigene Angabe (nur markenweit): Alison Iroko Nature, Orion Outdoor, Quadrado, Sandy, Tape Cord Outdoor, Torii Nest Outdoor. Connery: Aspen, Stoff, Leder + markenweit. |
| P2-D Länge „Ausführung“ | `LookPanel.js`: Optionsgruppen als `<details data-group>`, mobil und Tablet nur „Bezug“ offen, im Kopf die Kurzfassung der Wahl; Kissenliste mit „Alle n zeigen“. `Palette.js`: mobil die ersten Kacheln plus „Alle n zeigen“. Die Breitenweiche (< 1024 px) liefert `useNarrow()` in `storage.js`, Server-Render und Desktop: alle Gruppen offen. | Planer-Ende Schritt 4: 2 063 px (iPhone), 2 121 px (Pixel 7), vorher Seite 6 923 px. Die Gesamtseite (mit Tipps und Footer) ist 4 972 px. |
| P2-E Seitengewicht | unverändert offen: Nachweis HTML < 150 KB und LCP < 2,5 s braucht einen Preview-Build (im Repo wird nicht gebaut); ein echtes iPhone ebenfalls. | – |
| P3-C Hinweis frei stellbar | Der Hinweis sagt jetzt, dass Hocker und Daybeds an einen freien Platz gestellt werden. | |
| P3-F Raumeingabe | `inputMode="numeric"` und `step` am Feld. | |

**Nicht umgesetzt (P3):** P3-A „Passt nicht“-Form mit Direktaktion, P3-B Gruppe drehen, P3-D Druckvorschau der Karten, P3-E (Dev-HMR-Artefakt, auf Preview-Build prüfen).

**Tests:** neu `tests/unit/sofaplaner-fix2.test.mjs` (5 Tests, u. a. ≥ 80 Familien mit Quelle, jede Quelle auf minotti.com, keine Farbwerte, keine Dubletten) und `tests/e2e/sofaplaner-fix2.spec.js` (5 Tests: P1-A auf iPhone-WebKit und Pixel-7-Chromium, P2-A/B/D auf dem iPhone, P2-A und P2-C auf dem Desktop). Sofaplaner-Unit 31/31 grün. Sofaplaner-E2E 24 Tests: grün, zwei iPhone-WebKit-Läufe waren unter Last des geteilten Dev-Servers einmal rot (Hydrierung > 90 s bzw. React-Dev-Warnung/weitergereichte Backoffice-Timeouts des Servers) und im zweiten Lauf grün. Der P1-A-Test ignoriert vom Dev-Server weitergereichte Backoffice-Logs (`"src":"backoffice"`), sonst keine Konsolenfehler.

**Rechte:** keine Herstellerbilder, nur Materialnamen mit Quell-URL. Am Rechte-Register ändert sich nichts.

## Feinschliff Restliste QM-Abnahme (28.10.2026, `qa-screenshots/labs-ausbau/sofaplaner/abnahme.md`)

Selbstprüfung unter `qa-screenshots/feinschliff/sofaplaner/selbst/` (`shoot.mjs`, `probe-feinschliff.mjs iphone|desktop` mit `probe-*.json` und Screenshots). Nicht-GET-Anfragen werden mit 503 beantwortet, nichts ging ans Backoffice. Keine neuen npm-Pakete.

| Punkt | Umsetzung |
|---|---|
| P3-A „Passt nicht“-Form | `Planner.js → chooseTemplate`: Eine Form, die nicht in den Raum passt, wird nicht mehr sofort gesetzt. Unter der Kachel erscheint eine Auswahl (Fokus auf den ersten Knopf): **„Raum auf B × T cm anpassen“** (kleinster Raum in 10-cm-Schritten, in dem die Form ohne Konflikt steht, `model.js → roomForTemplate`, Fenster/Türen werden mit `fitOpenings` angepasst, Meldung mit „Rückgängig“), **„Trotzdem übernehmen“** (bisheriges Verhalten mit Erklärung) und „Andere Form wählen“. Alle 10 im Standardraum unpassenden Formen bekommen einen Raumvorschlag (570–650 × 440 cm). |
| P3-B Drehen einer angedockten Ecke | `model.js → joinedGroup` sammelt alle über Anschlüsse verbundenen Elemente, `rotateItems` dreht die Gruppe um 90° um ihre Mitte und hält sie als Block im Raum. Ein freies Einzelstück dreht weiter allein. Entsteht durch das Drehen ein harter Konflikt (Wand, Türschwenk, anderes Stück), rückt `settleGroup` den Block an die nächste freie Stelle im 10-cm-Raster. Die Meldung lautet dann „Sofa als Ganzes gedreht und frei gestellt.“ und bietet „Rückgängig“. Gibt es keine freie Stelle, nennt die Meldung den Konflikt. Test: 4 × 90° ohne verlorenen Anschluss. Messung iPhone und Desktop (Connery „Ecke rechts“): vorher „Passt“, nachher „Passt“. |
| P3-D Leere Modellkarten | `ModelPicker.js → LazyThumb`: Bis die Karte sichtbar ist, steht ein neutraler Platzhalter (Eck-Silhouette, CSS, serverseitig gerendert). Vor dem Drucken (`beforeprint`) werden alle Piktogramme gezeichnet. |
| P3-G Maß überlappt Bildunterschrift (iPhone) | `PlanSvg.js`: Liegt die Breitenmaßlinie außerhalb des Raums und würde ihre Pille die Bildunterschrift „Sofa gesamt B × T cm“ berühren, wird nur die Linie mit Endstrichen gezeichnet, die Zahl steht in der Bildunterschrift. Schmale, hochkant stehende Elemente werden entlang der langen Seite beschriftet (gedreht). Würde eine Beschriftung auf dem Bildschirm kleiner als 9 px, entfällt sie. Den Namen tragen dann die Auswahlleiste und der zugängliche Name. Messung iPhone (Chromium-Emulation, Connery „Ecke rechts“): keine Überlappung, Pille „B“ ausgeblendet, sichtbare Beschriftung 9,2 px. Desktop: Pille „B 294“ sichtbar, Beschriftungen 13 px. |
| P3-H „Ausführung SX“ und doppeltes Maß | `model.js`: `sideLabel` spricht Klartext („Ecke links/rechts“, „Abschluss links/rechts“, „Ausführung links/rechts“), `plainLabel` entfernt ein angehängtes Maß aus dem Herstellernamen, wo das Maß ohnehin daneben steht (Übersicht, Kacheln, Auswahlleiste, Anfrage-Text). SX/DX steht nur noch in „Details für die Bestellung“ (z. B. „Ecke links (SX)“) und im Expertenmodus. Der Knopf heißt immer „Seite wechseln“. |
| Ecksofa für mehr Modelle (Inhaber 3) | `templates.js`: Hat die Ecke eine andere Tiefe oder kein Sitzmodul wie die Endelemente des Systems, werden die übrigen rechteckigen Ecken der Familie versucht. Neu mit „Ecke links/rechts“: Allen, Bezier, Bezier Cord Outdoor, Daniels, Lawrence, Vivienne (33 statt 27 Familien). Unterschiedliche Tiefen sind im Planer ein Hinweis „im Showroom bestätigen“, kein Konflikt. Ohne Eck-Startform bleiben Florida und Horizonte (gebogene/geneigte Ecken), Goodman (Ecke ohne veröffentlichte Tiefe) und Quadrado (keine Endelemente); deren Ecken sind in „Anpassen“ wählbar. |
| Ladefehler Runde 2 (P3-E) | Untersucht (`qa2/interaktion/iphone.log`): `ChunkLoadError` für `src_components_Concierge_launcher_module_*.css`, geladen von `Concierge/Launcher.js` (`next/dynamic`) über das globale Layout, nicht vom Sofaplaner. Danach griff die globale Fehlergrenze. Ursache ist ein Dev/HMR-Artefakt: Ein paralleler Workflow hatte die Concierge-Dateien neu kompiliert, die CSS-Chunk-URL war veraltet. Der Sofaplaner selbst lädt nur `Preview3D` dynamisch, abgesichert durch `SceneBoundary`. Zuständig ist das Concierge-Team: `Launcher` mit einer eigenen Fehlergrenze umschließen, damit ein fehlender Chunk nicht die ganze Seite trifft. Gegenprobe auf dem Preview-Build bleibt offen. Beobachtung am 28.10.: Ein beschädigtes `.next/dev/prerender-manifest.json` (Schreibkonflikt im geteilten Dev-Server, 21 Zeichen doppelt angehängt) ließ alle Seiten mit 500 antworten. Es wurde auf gültiges JSON gekürzt. Das ist ein reines Dev-Artefakt. |
| Deployment Modelldaten | `catalog.server.js` liest nicht mehr per `fs` (`readdirSync` auf `process.cwd()`, das Output File Tracing nicht sicher erfasst). Die 90 Recherchedateien und `minotti-covers.json` kommen per statischem Import aus `src/lib/sofaplaner/minotti-data.js`. Das ist eine **generierte** Datei, erzeugt mit `node src/lib/sofaplaner/tools/build-catalog-index.mjs` nach jeder neuen oder umbenannten Familiendatei. Damit sind die Daten in den Server-Chunks der drei Sofaplaner-Routen gebündelt. `outputFileTracingIncludes` in `next.config.js` ist **nicht** nötig. Der Unit-Test schlägt fehl, wenn der Index veraltet ist. Eine Gegenprobe mit `next build` steht noch aus (im Repo wird nicht gebaut). Die Daten belasten nur den Server, nicht das Browser-Bundle (`server-only`). |

**Inhaber-Anforderungen geprüft** (`sofaplaner-anforderungen-inhaber.md`):
- **Alle Familien wählbar:** 90/90 im Index, jede mit Startform und Startplan ohne Fehler (Unit-Test).
- **Laie findet ein Ecksofa in unter 2 Minuten:** Der Ablauf Suche → Modellkarte → „Ecke links“ → 4 × Weiter → Übersicht braucht 7 Bedienschritte (Messung: `probe-*.json`, Feld `daniels`). Automatisiert dauerte das auf dem Desktop 20 s und auf dem iPhone 103 s. Die iPhone-Zeit enthält zwei Neuversuche, weil der Katalogabruf auf dem geteilten, ausgelasteten Dev-Server länger als 20 s brauchte. Ein echter Test mit Laien steht aus. Eine Eck-Startform haben alle 33 Familien mit rechteckiger Ecke und Endelementen.
- **Ungültige Kombinationen erklärt:** ausgegraute Kacheln mit Kurzbegründung, beim Antippen eine ausführliche Erklärung (E2E bestand bereits). Neu: Eine unpassende Form erklärt, was fehlt, und bietet die Lösung an (P3-A).
- **Keine Codes in der Hauptansicht:** SX/DX steht nur noch in den Bestell-Details und im Expertenmodus (P3-H).

**Tests:** neu `tests/unit/sofaplaner-feinschliff.test.mjs` (6 Tests: Deployment-Index, 90 Familien, Ecksofa, P3-A, P3-B, P3-H). `sofaplaner-fix1.test.mjs` zählt jetzt 329 Startformen. Die E2E-Tests mit Connery „U-Form“ wählen in der neuen Auswahl „Trotzdem übernehmen“. Stand der Läufe: Sofaplaner-Unit-Tests 37/37 grün, ESLint ohne Befund. Die beiden geänderten E2E-Tests (P2-A Desktop, „ungültige Kombination“) liefen einzeln grün, Letzterer erst im zweiten Versuch. Der Gesamtlauf `npx playwright test sofaplaner` brach unter der Last des geteilten Dev-Servers nach 17/24 Tests am Zeitlimit ab. Die Fehler dort waren durchweg `page.goto`-Zeitüberschreitungen (> 120 s) bzw. ein 3D-Canvas, das nicht rechtzeitig lud, keine fehlgeschlagenen Prüfungen. Bei ruhigem Server sollte der Lauf wiederholt werden.

## Restliste fix2 nach QM-Feedback (28.10.2026, `qa-screenshots/feinschliff/sofaplaner/feedback.md`)

Selbstprüfung unter `qa-screenshots/feinschliff/sofaplaner/fix2/` (`probe-fix.mjs iphone|desktop` mit `probe-fix-*.json` und Screenshots, `probe-rsc-hmr.mjs` für P2-3). Nicht-GET-Anfragen werden mit 503 beantwortet, nichts ging ans Backoffice. Keine neuen npm-Pakete.

| Punkt | Umsetzung |
|---|---|
| P2-1 Fokus nach „Andere Form wählen“ (WCAG 2.4.3) | `Planner.js → focusTile/closeNofit`: Nach „Andere Form wählen“, „Trotzdem übernehmen“ und „Raum … anpassen“ liegt der Fokus wieder auf der auslösenden Formkachel (`[data-form]`). E2E-Schritt in `sofaplaner-minotti.spec.js` prüft `document.activeElement`. Messung iPhone und Desktop: alle drei Knöpfe → `button[data-form=u]`. |
| P2-2 Eck-Startformen mit „2 Hinweise“ | (1) `model.js → mergeChecks`: gleiche Hinweise (Stufe, Art, Text) werden einmal gezeigt, mit „(an n Stellen)“ und allen betroffenen Elementen. (2) `geometry.js → joinIssue`: Tiefenunterschied bis `DEPTH_TOLERANCE` = 5 cm ist ein neutraler „Hinweis“ ohne Zählung (Daniels 102/105 cm). (3) Ist die Ecke tiefer als die Schenkel (L-förmige Ecke, als Rechteck vereinfacht, Schenkeltiefe nicht veröffentlicht), ist das ein „Hinweis: … Anschluss im Showroom bestätigen“ statt „Prüfen“; eine flachere Ecke bleibt „Prüfen“. `templates.js`: Die Eck-Startform trägt dann „– Kombination im Showroom bestätigen“ (`confirm`). **Quelle:** Keine Recherche-Datei zeigt diese Kombination in einer offiziellen Minotti-Anordnung: Allen (`allen.json → beispiel_kompositionen` Arrangement 01–04 zeigen nur `ALL-CORNEROPEN-168x218` mit 173er-End- bzw. 218er-Elementen, nicht `ALL-CORNER-168` mit `ALL-END-193`), Bezier, Bezier Cord Outdoor und Vivienne (keine Beispielkompositionen erfasst). Deshalb Showroom-Hinweis statt Weglassen. (4) Unit-Test: alle 66 Eck-Startformen ergeben 0 Hinweise der Stufe `warn`, die Ausnahmeliste mit Showroom-Hinweis ist genau Allen, Bezier, Bezier Cord Outdoor, Vivienne. |
| P2-3 E2E rot: „Router action dispatched before initialization“ | **Quelle geklärt, nicht Sofaplaner.** Reproduziert mit `fix2/probe-rsc-hmr.mjs`: Kommt eine Server-Component-Änderung (HMR `serverComponentChanges`) an, solange die Seite noch hydriert, ruft Nexts Dev-HMR-Client `processMessage → publicAppRouterInstance.hmrRefresh() → dispatchAppRouterAction` auf, bevor der App-Router initialisiert ist (`node_modules/next/dist/client/dev/hot-reloader/app/hot-reloader-app.js`, `use-action-queue.js`). Auslöser sind Server-Datei-Änderungen paralleler Workflows auf dem geteilten Dev-Server, daher zufällig und in 54 QA-Berichten aller Teams (Concierge, Ezarri, Kundenportal, Header/Footer …). Nur Dev, im Produktions-Build gibt es keinen HMR-Client. `data-hydrated` ist nicht die Ursache: Der Fehler fällt schon vor der Hydrierung. **Ticket an den Integrator.** Test: `tests/e2e/sofaplaner-errors.js → collectSofaplanerErrors` nimmt genau diese Meldung aus, und nur wenn der Stack `hmrRefresh` und `processMessage` enthält. Entfernen, sobald die Tests gegen den Preview-Build laufen. |
| P3-1 Grund bei „Form passt nicht“ | `model.js → nofitReason` (aus den Konfliktarten von `fitTemplate`): z. B. „U-Form passt nicht in Ihren Raum (560 × 440 cm). Die Form selbst misst 480 × 400 cm, passt aber nicht, weil vor der Tür ein Schwenkbereich von 90 × 90 cm frei bleiben muss – an jeder passenden Wand stünde ein Element darin. Ab 570 × 440 cm passt die Form ohne Konflikt.“ Ist die Form größer als der Raum, steht das so da. |
| P3-2 SX/DX im Seitenhinweis | `page.js`: „Endelemente gibt es mit Armlehne links oder rechts …“, ohne Codes. Unit-Test sichert das ab. |
| P3-3 Rückgängig-Meldung verdeckt den Plan (iPhone) | `sofaplaner.module.css` (≤ 1023 px): Die Meldung steht fest über der Leiste „Zurück / Weiter“ (`--sp-nav-h`, gemessen in `Planner.js`), nicht mehr im Plan. Messung iPhone: Meldung verdeckt weder Plan noch Leiste. Desktop unverändert. |
| P3-4 Kompakter Plan zu klein (iPhone) | Der Plan hat mobil eine feste Höhe (`--sp-fill: 1`), `PlanSvg.js` füllt diese Fläche: Ränder in Bildschirm-Pixeln, Beschriftungen 11,5 px, Raum mittig in voller Breite. Bei ausgewähltem Element stehen die Gesamtmaße nur in der Bildunterschrift, damit die Abstandsmaße Platz haben. Messung iPhone 15 Pro (Chromium): Raum 210 × 165 px statt rund 115 × 90 px, mit Auswahlleiste 133 × 105 px; Beschriftungen 14 px Zeilenhöhe statt 9 px, keine Überlappung. Ein Knopf „Plan vergrößern“ (Vollbild mit Pinch-Zoom) ist nicht umgesetzt. |
| P3-6 Prozess | Zur Kenntnis: Gemeinsame Build-Artefakte (`.next/…`) werden nicht mehr von Hand geändert, sondern dem Integrator gemeldet. In dieser Runde wurde nichts außerhalb der eigenen Dateien geändert (die Probes ändern kurzzeitig nur die eigenen Dateien `labs/sofaplaner/page.js` und `Sofaplaner/Glyph.js` und stellen sie wieder her). |

**Tests:** neu sind `tests/unit/sofaplaner-restliste.test.mjs` (6 Tests) und `tests/e2e/sofaplaner-errors.js`. In `sofaplaner-minotti.spec.js` kamen Prüfungen für Fokus und Begründung dazu. Alle Sofaplaner-Unit-Tests sind grün (43/43), ESLint meldet nichts, axe zeigt 0 Verstöße (iPhone, Desktop). E2E `labs-sofaplaner`, `sofaplaner-minotti`, `sofaplaner-mobil` und `sofaplaner-fix2` mit `PW_WORKERS=1`: **24/24 grün in 7,4 min, ohne Wiederholung** (`fix2/e2e.log`, `fix2/e2e.json`). Weiter offen sind der Preview-Build mit Lighthouse (Integrator), ein echtes iPhone und ein Test mit Laien.

## Offene Punkte
- **Kombinationsregeln bestätigen:** Die Regeln sind aus den Elementtypen abgeleitet. Vor dem Live-Betrieb stichprobenartig mit Minotti-Unterlagen (Händlerportal, Arrangements) oder im Showroom prüfen, vor allem die SX/DX-Konvention (592 abgeleitete Seiten) und Ecken mit SX/DX.
- **Gebogene und geneigte Elemente** (Supermoon, Bezier, Goodman, Lars …) sind als Rechteck vereinfacht, weil Winkel und Radien in den Quellen fehlen.
- **Sitztiefe** fehlt bei 73 % der Sitzelemente. Abhilfe: Recherche-Teams oder Messung im Showroom.
- **Preise:** `PRICE_CONFIG.elements` je Code, erst nach Freigabe durch den Inhaber.
- **Seitengewicht (QM R2 P2-E, offen):** nach QM-Fix 417–426 KB HTML im Dev (Grundgewicht jeder Seite rund 280 KB). Für das Ziel unter 150 KB nach `next build` fehlt der Nachweis per Lighthouse auf dem Preview-Build. Möglicher nächster Schritt: Familie (`?m=`) erst im Browser laden.
- **Deployment:** erledigt (28.10.2026). Die Modelldaten sind statisch gebündelt (`minotti-data.js`), `outputFileTracingIncludes` ist nicht nötig. Nach einem Preview-Build die Route `/de/labs/sofaplaner/katalog/connery` gegenprüfen.
- **Weiterhin offen:** echter Einfinger-Drag und 3D-Umschalten auf einem iOS-Gerät, QM R2 P3-E (Preview-Build), Wandöffnungen in 3D, Rate-Limiter über mehrere Instanzen.

---

## Historie: generischer Modulplaner (Runden 1–5, bis 26.10.2026)
Die folgenden Abschnitte beschreiben den Vorgänger mit generischen Modulen. Geometrie, Raum- und Öffnungslogik, Teilen, Fehlerfälle und Barrierefreiheit wurden übernommen. Module, Bezug und Sitzkomfort sind durch die Minotti-Daten ersetzt.

## QA-Runde 1 – Korrekturen (2026-10-26)
Grundlage: `qa-screenshots/sofaplaner/feedback-runde1.md` (Note 6/10). Nachprüfung: `qa-screenshots/sofaplaner/fix/` (shoot.mjs + `verify.mjs`).
- **P1.1 H1 verdeckt:** Seiten-Wrapper `.page` (CSS-Modul) mit 112 px mobil / 212 px ab 1024 px (Header 81 / 165 px). Gemessen: H1 bei 241 px, Header bei 165 px.
- **P1.2 Sticky:** `top: 140px` (Header nach dem Scrollen 125 px). Sticky nur, wenn die Fläche ins Fenster passt (≥1280×760 oder ≥1024×860), Zeichnung `max-height: calc(100dvh - 440px)`. Gemessen 1440×900: Umschalter bei 140, Modul-Leiste endet bei 880 px.
- **P1.3 3D:** eigenes Kamera-Rig richtet sich auf die Bounding Box des Sofas aus und berücksichtigt das Seitenverhältnis (Hochformat passt). `RoundedBox`-Polster je Sitzplatz, Rückenkissen, dunkle Sockelfuge, `ContactShadows`, warmes Hemisphere-/Key-Licht, Leder glatter, Boden heller als die Wände.
- **P2.4** Kontur entfernt, Beschriftung auf eigener Plakette in Stofffarbe, Schriftfarbe nach WCAG-Luminanz (`isLightColor`). Sehr helle Stoffe bekommen eine dunklere Modulkontur.
- **P2.5** Maßstab per `ResizeObserver`, Schriftgrößen werden ausgeglichen (mind. 12–14 px). Pillenbreite folgt der Textlänge. Rand (PAD) wächst mit.
- **P2.6** Maßlinien laufen nur im freien Abschnitt bis zum nächsten Modul oder zur Wand. Die Pille entfällt, wenn sie nicht hineinpasst. Andere Modul-Labels werden bei Auswahl gedimmt.
- **P2.7** 44 px für Umschalter, Chips, Farben und Radios. Checkbox 22 px in einem 44 px hohen Label, Datenschutz-Link mit größerer Trefferfläche.
- **P2.8** Nach Entf/Entfernen geht der Fokus auf das nächste Modul (sonst auf die Modul-Leiste). Escape hebt die Auswahl auf, der Fokus bleibt.
- **P2.9** `fitOpenings` passt Fenster und Türen an die Wandlänge an oder entfernt sie (mit Ansage). Das gilt beim Ändern des Raums, beim Bearbeiten einer Öffnung und beim Laden: `planSchema` transformiert mit (Teilen-Route, Entwurf, Merkliste).
- **P2.10** 3D mobil `min(52vh, 380px)`. Auf Touch-Geräten ist das Canvas zunächst „geparkt“: Ein Overlay mit `touch-action: pan-y` lässt die Seite scrollen, „Zum Drehen antippen“ aktiviert die Steuerung, „Fertig“ parkt sie wieder. Die Bildunterschrift steht in einem eigenen Streifen.
- **P2.11** Vorlagen als Streifen über der Zeichnung, Statuszeile (Maß · Plätze · Prüfstatus) direkt darunter (< 1024 px). Die Module liegen als horizontaler Scroll-Strip mit Snap. Die Vorlagen sind nicht mehr im Panel, der Planname steht jetzt bei „Merkliste, Teilen & Anfrage“.
- **P2.12** Akkordeons ohne Browser-Pfeil, mit `ChevronDown` (dreht sich, bei reduced motion ohne Animation), Titel in Bodoni, Padding 20–22 px. Modul-Karten mit SVG-Piktogramm in Draufsicht, Kurzname (`card`) und Maß in zwei Zeilen.
- **P2.13** Fehler stehen je Feld direkt darunter (`aria-invalid`, `aria-describedby`), der Fokus springt auf das erste fehlerhafte Feld. Sammelmeldung mit `role="alert"` über dem Button.
- **P3 erledigt:** `setPointerCapture` in try/catch (15). Neue Module landen neben dem Sofa an der Wand, nie in der U-Innenfläche oder im Türschwenk (16). Plakette verhindert, dass Trennlinien durchs Label laufen (17). Nach dem Drehen rastet das Modul an eine Wand innerhalb von 15 cm ein (18). Hinweis „keine persönlichen Daten“ am Plannamen (19). Fenster und Türen in 3D (20, vereinfacht). Rate-Limit für `teilen` (22, teilweise).
- **Hydration:** Der Standardplan nutzt jetzt feste IDs (`d1…`), denn `data-id` am Modul hatte mit `Date.now()`-IDs einen Hydration-Mismatch ausgelöst.

## Test
- `curl -o /dev/null -w "%{http_code}" http://localhost:3000/de/labs/sofaplaner` → 200; `/en/labs/sofaplaner` → 404.
- `curl -X POST …/de/labs/sofaplaner/teilen -d '{"plan":{…}}'` → `{token,url}`; ungültiger Plan → 400; ungültiges Token → Hinweis „nicht gefunden“.
- Playwright (375 px Touch und 1366 px): kein horizontales Scrollen, Drag/Rotate/Tastatur, 3D-Canvas rendert (SwiftShader), Anfrage-Validierung und Payload-Vorschau – ohne Konsolenfehler.


## Runde 2 – Restpunkte, Fehlerfälle, Performance (26.10.2026)

| Restpunkt | Umsetzung |
|---|---|
| 1 Überlappung nach „Raum kleiner, dann größer“ | `model.js → fitItemsToRoom`: Passt das Sofa noch, wird es als Block verschoben, es entsteht keine neue Überlappung. Nur wenn es größer ist als der Raum, wird jedes Modul einzeln eingepasst. Die Überlappung ist dann ein echter Konflikt und wird angezeigt. `Planner.js` merkt sich die Aufstellung vor der Anpassung (`roomMemo`). Beim Vergrößern kehrt sie zurück. Bei alten Entwürfen ohne Merker löst `separateItems` die Überlappung auf. Auch das Laden geteilter Pläne nutzt `fitItemsToRoom`. Der gespeicherte Entwurf ist danach überlappungsfrei (e2e). |
| 2 Aufräumen alter Teilen-Pläne | `server/retention.js` und `store.js`: Ein Link gilt `SOFAPLANER_TTL_DAYS` Tage (Standard 180, erlaubt 1–730). Abgelaufene Pläne werden nicht mehr geladen. Beim Speichern wird höchstens alle 6 h aufgeräumt: Abgelaufene und die ältesten Pläne über 5000 Dateien werden gelöscht. Die Teilen-Route nimmt die Client-Adresse jetzt aus `LABS_IP_HEADER` bzw. dem letzten X-Forwarded-For-Eintrag. Der erste Eintrag kann frei gesetzt werden und wird nicht mehr genutzt. Offen: ein gemeinsamer Rate-Limiter (Redis). |
| 3 Statuszeile mobil | Trenner per CSS, kein Punkt mehr vor dem Badge: „Sofa 340 × 260 cm · 6 Plätze [Passt]“. |
| 4 Palette | Verlauf an der Kante, an der es weitergeht. Bei Mausbedienung zusätzlich ein Pfeil, der um 320 px scrollt. Der Pfeil ist aria-hidden, weil Tastatur und Touch alle Karten direkt erreichen. Bei reduced motion ohne Animation. |
| 5 3D-Ausschnitt Desktop | `CameraRig` passt Breite und Höhe getrennt ein statt über eine Hüllkugel, weil die Ansicht aus 31° Höhe verkürzt ist. Das L-Sofa nimmt jetzt ca. 65–70 % der Breite ein, auf dem iPhone bleibt es vollständig im Bild. |
| Kopfabstand | Der Header ist jetzt sticky und Teil des Seitenflusses. Abstand 40/56/64 px wie bei PageHeader (vorher 112/212 px). Die Sticky-Planungsfläche sitzt bei `--header-h + 16px`, die Zeichnung ist 40 px höher. |

**Fehlerfälle**
- **Kein WebGL:** Hinweis, die 2D-Ansicht bleibt (e2e).
- **Kontextverlust:** zurück zu 2D mit „Die 3D-Vorschau wurde vom Browser beendet“ und dem Knopf „3D erneut öffnen“ (e2e).
- **Chunk-Abbruch:** `SceneBoundary` (aus `Labs/Kuechenplaner/SceneBoundary.js`) zeigt dasselbe mit „konnte nicht geladen werden“.
- **Langsames Netz:** Der Ladehinweis sagt, dass die 2D-Ansicht nutzbar bleibt.
- **Reduced motion:** ohne Fehler.

**Lazy Loading und Chunk-Größen** (Dev, unminifiziert)
- Beim ersten Laden ist three nicht enthalten.
- Erst „3D-Vorschau“ lädt 5 Chunks nach, zusammen 3,93 MB (gzip 631 KB):

| Chunk | Größe |
|---|---|
| `three_core` | 1,98 MB |
| fiber | 0,97 MB |
| `three_module` | 0,85 MB |
| `Preview3D` | 43 KB |

**Tests**
- `tests/unit/labs-sofaplaner.test.mjs`: 7 Tests
- `tests/e2e/labs-sofaplaner.spec.js`: 5 Tests (desktop)
- Screenshots: `qa-screenshots/sofaplaner/r2/interaktion/`

**React-Warnung:** Sie trat auch beim Sofaplaner einmal auf dem iPhone auf, ohne dass 3D geladen war. Ursache ist der HMR-Refresh des Next-Dev-Servers (Details in `kuechenplaner.md`, Runde 2).

**Offen:**
- Echtes Ziehen mit einem Finger auf einem iOS-Gerät
- Armlehnen-Varianten
- Wandöffnungen in 3D
- Rate-Limiter über mehrere Instanzen

## Runde 2 – Fix nach QM-Feedback (26.10.2026)

Details stehen in `kuechenplaner.md` unter „Runde 2 – Fix nach QM-Feedback“. Dort finden sich auch der Entwurf für den Abschnitt der Datenschutzerklärung und die Liste der Env-Variablen.

- **P2-1:** `pricesPublic()` in `model.js`. Solange `PRICE_CONFIG.placeholder` gesetzt ist, zeigt die Summary-Karte „Richtpreis · Im Gespräch“ statt „ca. 4 600 EUR“ und keinen Klammertext. Der Seitenhinweis wurde entsprechend angepasst.
- **P2-2:** Der Seitenhinweis verweist nicht mehr auf den fehlenden Abschnitt. Die Einwilligung nennt „Teilen-Links speichern nur den Plan und gelten 180 Tage“. `POST /de/labs/sofaplaner/teilen` antwortet im Produktions-Build mit 503, solange `NEXT_PUBLIC_LABS_PLANER_SENDEN=1` oder Redis fehlt. Die Anfrage wird weiterhin nie gesendet.
- **P2-3:** Die Teilen-Route nutzt den gemeinsamen Limiter `Labs/Kuechenplaner/server/rateLimit.js` (Redis per REST, Ersatz im Arbeitsspeicher). Die IP kommt aus `LABS_IP_HEADER`.

## Runde 4 (Paket R4-portal-labs, 26.10.2026)

- **Fehlerfälle:** „Teilen-Link erstellen“ mit 15 s Zeitlimit. Offline erscheint „Keine Internetverbindung …“, bei Zeitüberschreitung „Die Antwort hat zu lange gedauert …“ statt des englischen Browsertexts „Failed to fetch“ (`Labs/net.js`). Ungültiger Plan-Code `?p=…` → 200 mit Standardplan; `POST /de/labs/sofaplaner/teilen` mit ungültigem Plan → 400. Belege: `qa-screenshots/teamleiter/r4-portal-labs/errors/`.
- **Bundle:** zod über `../zod.js` (siehe dreilaender-rechner.md, Runde 4); 3D-Vorschau war bereits dynamisch.

## Runde 5 (Paket R5-portal-labs, 26.10.2026): kein eval mehr (CSP)

- Ursache des CSP-Funds `unsafe-eval` (R4-release, `csp-console.json`): zod 4 prüft beim ersten Objekt-Parse per `new Function("")`, ob der JIT-Pfad erlaubt ist. Der Fehler wird abgefangen, der Browser meldet aber trotzdem einen Verstoß. `Labs/zod.js` setzt jetzt `config({ jitless: true })`. Damit entfällt die Probe, und das Prüfergebnis bleibt gleich. Das gilt für alle Labs-Schemas im Browser.
- Beleg: Prod-Build mit eigenem Report-Only-Header ohne `unsafe-eval`: **0 Verstöße** auf allen 7 Labs-Seiten, auch mit `?p=garbage!!` (`qa-screenshots/teamleiter/r5-portal-labs/prod-csp/`).
- Netzfehler-Texte über `Labs.net.*` (`netTexts(t)`), Fallback Deutsch.
