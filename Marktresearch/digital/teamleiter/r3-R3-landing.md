# R3-landing – Landing- und Regionsseiten

**Stand:** 26.10.2026 · Branch `feature/neuauftritt` (nichts committet) · Grundlage: `runde-3-plan.md`, `r1-R1-seo.md` (Doorway-Audit), `src/lib/seo/sitemap/doorwayAudit.js` (nur gelesen), `redesign/landingpages.md`, `r2-R2-qualitaetsnetz.md` §4, Feature-Dokus Yacht/Outdoor, `inhaber-entscheidungen.md`.

## 1. Robots nach Doorway-Audit

`landingMetadata()` in `src/components/Landing/landingPage.js` setzt für jeden `/designermoebel-*`-Pfad die Robots aus `regionRobots(path)`. Damit gilt für alle 13 Regionsseiten eine einzige Regel, dieselbe wie für Sitemap und `/llms.txt`. Ein übergebenes `index: false` hat weiter Vorrang. Ich habe keine Fakten ergänzt und keine Zählung im Audit geändert.

Robots laut curl gegen `localhost:3000`:

| Seite | eigene Fakten | robots | Sitemap |
|---|---|---|---|
| rheintal, liechtenstein, arlberg | 5 | index, follow | ja |
| konstanz, feldkirch, appenzell | 4 | index, follow | ja |
| ravensburg | 3 | **noindex, follow** | nein |
| kempten | 2 | **noindex, follow** | nein |
| lindau, friedrichshafen, st-gallen, dornbirn, bregenz | 1 | **noindex, follow** | nein |

Robots und Sitemap decken sich. Der Live-Test in `sitemap.test.mjs` („robots meta matches the doorway audit“) läuft jetzt grün, ist aber noch als `todo` markiert.

- **An R3-marken-seo:** `todo` entfernen und den Test scharf schalten.
- Die Seiten bleiben über Footer und Startseite verlinkt (`follow`).
- Zurück in den Index kommen sie nur mit echten eigenen Fakten (Inhaber-Entscheidung E15).

## 2. `/de/kuechen-vorarlberg` (PENDING_NOINDEX)

**Befund:** Die Seite war nie noindex. `PENDING_NOINDEX` stützte sich allein auf den Code-Kommentar „Kept noindex until the copy is final“. Dieser Grund ist weggefallen:

- Der Copy-Fix P1-3 aus der Integration ist live (`00-integration.md` §5).
- Der Inhaber hat die Texte bestätigt (Entscheidung #3).

**Entscheidung:** Die Seite bleibt `index, follow` und bleibt in `sitemap-static.xml`. Ich habe den Kommentar korrigiert, ein Indexverlust entsteht nicht.

**An R3-release:** Den Eintrag `PENDING_NOINDEX["/de/kuechen-vorarlberg"]` in `tests/e2e/seo.spec.js` löschen. Das verlangt der Kommentar dort für den Fall, dass die Seite indexiert bleibt.

## 3. Superlative und Leistungsversprechen

- **`wohnzimmer-einrichten-vorarlberg`:** „führender Marken“ → „internationaler Marken“. Das war der einzige Fund von `check:claims` in den Paketdateien, jetzt sind es 0.
- **`designermoebel-bregenz`:** „Premium-Marken“ ersetzt, in der Meta durch „internationale Marken“, im Benefit durch „Internationale Designmarken an einem Ort“.
- **`interior-design-vorarlberg`:** „perfekt in die Architektur integriert“ → „passgenau …“.
- **Lieferzusagen:** Unbedingte Zusagen stehen nach Inhaber-Entscheidung #3 jetzt auf „auf Wunsch“.
  - Betroffen sind Benefits und FAQ in Küche, Wohnzimmer, Interior Design, Möbel Bodensee, Bregenz und Dornbirn sowie die Meta von Bregenz.
  - Dadurch ändert sich der Text der FAQPage-Antworten. Struktur, URL und Canonical bleiben unverändert.
- **`lastModified`:** In `landingPages.js` für diese 6 Seiten auf 2026-10-26 gesetzt.
- **Küchenmarken im Teaser:** Der Teaser nennt „next125 und Schüller“, die Seite selbst „Poliform und next125“. Welche Küchen tatsächlich ausgestellt sind, ist nicht bestätigt (UWG-Audit H9). Ich habe daher nichts geändert, im Code einen Kommentar gesetzt und die Frage an den Inhaber notiert.

## 4. Restliste Yacht und Outdoor

| Punkt | Ergebnis |
|---|---|
| Hero-Platzhalter (beide) | Das Hero-Foto war ein Stellvertreter ohne dokumentierte Freigabe und ohne Bezug zum Thema (kein Boot, kein Garten am See). `imagery.js` markiert es jetzt mit `released: false`. `heroImage()` liefert dann `show: false`, und `LandingHero` zeigt den Hero ohne Foto (nur Typografie). So erscheint kein fremdes Bild ohne Freigabe. `primaryImageOfPage` im JSON-LD bleibt laut Vorgabe unverändert. Sobald das eigene Foto aus dem Shooting vorliegt: `src` tauschen und `released` entfernen. |
| Yacht #3/#8: Link zu Outdoor | Die Leistung „Bootshaus & Seegrundstück“ verlinkt jetzt `/de/outdoor-gartenplanung` (`LinkArrow`). Der Linktext `landing.outdoorLink` steht in `messages-r3-landing.json`, mit deutschem Fallback in `parts.js`. |
| Yacht #1: Partner nicht zugesagt | Der sichtbare Text behauptet keine Partnerschaft mehr. „Zusammen mit Bootssattlern und Werften aus der Region“ → „Aufmaß, Fertigung und Montage übernehmen Bootssattler und Werft“. „Gartenplanung mit Partnern“ → „mit Fachbetrieben“. Die alte Formulierung steht noch in der Service-Beschreibung im JSON-LD und in der `llms`-Zeile von `extraPages.js` (fremde Datei). |
| Yacht #4 / Outdoor #7: Eintrag in `landingPages.js` | Nicht eingetragen, weil die rechtliche Prüfung noch fehlt. Yacht steht über `extraPages.js` in der Sitemap, Outdoor ist noindex. |
| Outdoor #2: Pflege und Einlagerung | Stand schon auf „auf Anfrage“, keine Änderung nötig. |
| Offen (Inhaber/Recht) | Yacht #2, #5–#7, #9, #10. Outdoor #1 (Partnerverträge), #3 (3D-Visualisierung: Werkzeug offen, Text unverändert, Seite noindex), #4–#6, #9, #10. |

## 5. Prüfung

- **Screenshots:** `node tools/qa/shoot.mjs` → `qa-screenshots/teamleiter/r3-R3-landing/selbst`, 8 Seiten × iPhone/Android/iPad/Desktop.
  - Alle Seiten lieferten 200, außer Bregenz und Wohnzimmer auf Desktop (500). Ursache war ein fremder Kompilierfehler in `src/lib/seo/llms.js:107`, an dem R3-marken-seo gerade arbeitete.
  - Nachlauf in `selbst/nachlauf`: 12 × 200.
  - Die Hydration- und Router-Meldungen stammen aus Client-Komponenten anderer Pakete. Die Landing-Seiten rendern nur Server-Komponenten.
  - Bilder angesehen: Yacht und Outdoor zeigen den Hero ohne Foto, der Knopf liegt im ersten Viewport. Der Outdoor-Link ist sichtbar, Bregenz ist unverändert.
- **Unit-Tests:** `tests/unit/r3-landing.test.mjs` 9 von 9 grün, darunter die Live-Robots aller 13 Regionsseiten und `index, follow` für die Küche. `sitemap.test.mjs`: keine roten Tests.
- **`npm run check:claims`:** 0 Funde in den Paketdateien. Die übrigen Funde liegen in Produktdaten und Messages anderer Pakete.
- **`npx eslint`** auf alle Paketdateien und den Test: 0 Meldungen.

## 6. Fragen an den Inhaber

1. Welche Küchen stehen tatsächlich im Showroom: Poliform, next125, Schüller?
2. Bregenz und Dornbirn sind jetzt noindex. Gibt es echte eigene Fakten (Referenzprojekte, Anfahrt, Lieferweg), mit denen sie das Audit bestehen?
3. Yacht: Haben Sattler und Werft die Zusammenarbeit schriftlich zugesagt?
4. Eigene Hero-Fotos für Yacht und Outdoor (Shotliste Tag 5).

## 7. Nachbesserung nach QM-Feedback (8/10)

Grundlage: `qa-screenshots/teamleiter/r3-R3-landing/feedback.md`.

| Punkt | Ergebnis |
|---|---|
| **P2-1** Küchenseite: unbestätigte Showroom-Aussagen | Entschärft, die Seite bleibt `index, follow` (kein SEO-Verlust). „im Original“ ist jetzt „anhand von Mustern“. Der Schritt heißt „Beratung in Lochau“. Die FAQ „Kann ich die Küchen … im Showroom ansehen? – Ja“ lautet jetzt „Kann ich Fronten und Materialien vor der Planung vergleichen?“, mit dem Zusatz „Ob und welche Küchen gerade in der Ausstellung stehen, sagen wir Ihnen bei der Terminvereinbarung“. Der Showroom-Text nennt keine ausgestellten Küchen mehr. Poliform und next125 erscheinen nur noch als Marken, mit denen geplant wird (Eyebrow „Küchenmarken in der Planung“). Beide sind im Produktkatalog. Die Meta ist neu (142 Zeichen). Der Teaser in `landingPages.js` nennt jetzt dieselben Marken wie die Seite (Schüller entfernt). |
| **P2-2** Hero-Fotos Küchen und Kempten | In `imagery.js` mit `released: false` eingetragen, genau wie Yacht und Outdoor. Der Hero erscheint dadurch ohne Foto. Im JSON-LD bleibt `primaryImageOfPage` unverändert. Offen beim Inhaber: Freigabe für Intro- und Galeriebilder der Küchenseite (`bannerImageKuche2/3`, `Poliform-Kitchen.jpg`). Das sind ebenfalls Herstellerbilder. |
| **P2-3** Partner-Formulierung | Yacht JSON-LD `Service.description`: „in Zusammenarbeit mit Bootssattlern und Werften“ ersetzt durch „Aufmaß, Fertigung und Montage übernehmen Bootssattler und Werft; Platzhirsch koordiniert die Termine.“ **An R3-release (fremde Dateien):** In `src/lib/seo/sitemap/extraPages.js` die `llms`-Zeile („umgesetzt mit Bootssattlern und Werften aus der Region“) gleich formulieren. Die Organization-`brand`-Liste in `structuredData.js` mit dem Händler-Filter abgleichen. |
| P3-1 Meta-Längen | Küchen 142, Bregenz 154, Kempten 156 Zeichen. Die Titles von Kempten („Designermöbel für Kempten & Allgäu“) und Outdoor („Gartenplanung & Outdoor Bodensee“) haben samt Suffix jetzt höchstens 60 Zeichen. |
| P3-2 leerer Hero auf dem Desktop | Ohne Foto zeigt `LandingHero` jetzt eine ruhige Materialfläche: ein Steinton, der unten ins Seeblau übergeht, mit Horizontkante. Sie ist dekorativ (`aria-hidden`), nur ab `lg` sichtbar, Höhe 144 px. Gilt für Yacht, Outdoor, Küchen und Kempten. |
| P3-3 Konsolenfehler | Trat einmal auf (Yacht/iPhone, „state update … not mounted“ und abgebrochener Request), wie im QM-Bericht. Er stammt aus einer Client-Komponente außerhalb des Pakets und wird im Release-Build gegengeprüft (R3-release). |
| P3-4 Footer-Regionen | Fremde Datei (`Footer.js`). Hinweis an R1/R3-release. |

**Prüfung:**
- `node --test tests/unit/r3-landing.test.mjs`: 12/12 grün. Neu sind die Tests zu Küchen-Claims, Meta-Längen und Yacht-JSON-LD, dazu die Hero-Liste mit Küchen und Kempten.
- `check:claims`: 0 Funde in den Paketdateien.
- `eslint`: 0 Meldungen.
- Screenshots in `qa-screenshots/teamleiter/r3-R3-landing/fix`: 5 Seiten × 4 Geräte, alle 200, kein Überlauf. Angesehen: Küchen- und Outdoor-Desktop mit Materialfläche, Kempten-iPhone als kompakter Text-Hero.

Frage 1 an den Inhaber bleibt offen. Erst wenn bestätigt ist, welche Küchen ausgestellt sind, kann die Seite wieder „im Showroom ansehen“ sagen.
