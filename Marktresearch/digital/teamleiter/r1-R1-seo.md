# R1-seo – Sitemap, llms.txt, Doorway-Audit, Marke × Kategorie, /api/image

Stand: 26.10.2026 · Branch `feature/neuauftritt` · nicht committet · Grundlage: Masterplan AP0 Nr. 3, AP5, AP6 Nr. 1

## Ergebnis in Kürze

| Punkt | Ergebnis |
|---|---|
| Doorway-Audit | 13 Regionsseiten gelesen. **6 bestehen** (≥ 4 eigene Fakten): Rheintal, Liechtenstein, Arlberg, Konstanz, Feldkirch, Appenzell. **7 bestehen nicht**: Bregenz, Dornbirn, Lindau, Friedrichshafen, St. Gallen, Kempten, Ravensburg. Robots-Einstellungen der Seiten **nicht** geändert (E15 = Inhaber). |
| Sitemap | Neue Registry `src/lib/seo/sitemap/extraPages.js`: `/yacht-interior` und die 6 bestandenen **neuen** Regionsseiten. Nur DE, ohne hreflang, `lastmod` = 2026-10-26 (Datei-Änderungsdatum, die Dateien sind untracked). In `getStaticEntries` eingebunden, ohne Dubletten zu `LANDING_PAGES`. |
| llms.txt | Neuer Abschnitt „Regionen und Leistungen“ mit denselben 7 Seiten, je eine sachliche Zeile. Händler-Fix im Kopf unverändert, 0 Treffer für „Händler“. |
| /api/image | Kein Aufrufer im Code (grep über `src`, `public`, `tools`, `next.config.js`). `src/app/api/image/route.js` gelöscht, `/api/image` aus allen drei `allow`-Listen in `robots.js` entfernt. Live: `/api/image?path=/api/method/ping` → **404**. Restliche robots-Regeln unverändert (E10). |
| Marke × Kategorie | `src/lib/marken/brandCategory.js` (reine Logik) und vorbereitete, **nicht eingebundene** Funktion `getBrandCategoryEntries()` in `src/lib/seo/sitemap/brandCategoryEntries.js`. |
| Tests | `node --test tests/unit/sitemap.test.mjs tests/unit/brandCategory.test.mjs`: 13 Tests, 12 grün und 1 Integrationstest übersprungen. Mit `SITEMAP_BASE=http://localhost:3000` laufen alle 7 Sitemap-Tests grün. `npx eslint` auf alle eigenen Dateien: 0 Meldungen. |

## 1. Doorway-Audit der 13 Regionsseiten

Gezählt werden nur Fakten, die auf **keiner anderen** Regionsseite stehen. Gemeinsame Bausteine zählen nicht, zum Beispiel Adresse, Öffnungszeiten, „EU-Binnenmarkt ohne Zoll“ (5 DE-Seiten), „8,1 % MWST + BAZG“ (4 CH-Seiten), „Selbstausfuhr über 75 €“ (3 Seiten), Architektenpläne mitbringen, das Café und „Lieferung klären wir persönlich“. Referenzen hat keine Seite.

| Seite | Fahrzeit | Steuer-/Lieferablauf | Regionale Begriffe | Passende Marken (eigene Begründung) | Referenz | **Eigene Fakten** | Ergebnis |
|---|---|---|---|---|---|---|---|
| Rheintal (CH) | rund 30 min über Au–Lustenau oder St. Margrethen–Höchst | Zollstellen Höchst und Hohenems/Diepoldsau mit Zeiten · Wertfreigrenze CHF 150 · Montage-Meldepflicht oder Schreiner aus der Region | Widnau, Heerbrugg, Altstätten | Leuchten = einfachster Fall für die Rückerstattung | – | **5** | besteht |
| Liechtenstein | rund 40 min, A14 oder A13 | Schweizer Zoll- und MWST-Gebiet · Zollstelle Tisis/Schaanwald · EWR-Meldeverfahren ohne 8-Tage-Frist | Vaduz, Schaan, Unterland | – | – | **5** | besteht |
| Arlberg | Lech rund 75–90 min | Planung vor der Wintersaison · Zufahrt je nach Jahreszeit | Lech, Zürs, Warth, St. Anton, Chalet, Vermietung | Terrasse am Berg: Paola Lenti, Tuuci, Umbrosa | – | **5** | besteht |
| Konstanz | rund 1 h | Mit Möbeln im Auto übers deutsche Ufer (keine Zollgrenze) | keine Brücke, Fähre Konstanz–Meersburg, westlicher Bodensee | – | – | **4** | besteht |
| Feldkirch | rund 35 km, A14 | Kauf innerhalb Österreichs, österreichische Rechnung | Rankweil, Götzis, Frastanz, Walgau · Zug über Bregenz | – | – | **4** | besteht |
| Appenzell (CH) | rund 30–45 min | (Ablauf weitgehend wie Rheintal) | Appenzellerland, Ausserrhoden, Innerrhoden | Marken nach Haustyp: Holzhaus, niedrige Räume, Dachschrägen · Lift- und Treppenhausmasse | – | **4** | knapp bestanden |
| Ravensburg (DE) | rund 35–45 min | (wie Konstanz/Kempten) | Schussental, Oberschwaben · Bahn über Friedrichshafen und Lindau | – | – | **3** | besteht nicht |
| Kempten (DE) | rund 50 min über Lindau | (wie Konstanz/Ravensburg) | Oberallgäu, Westallgäu | – | – | **2** | besteht nicht |
| Lindau (DE) | „wenige Kilometer“, grenzt an Bayern | (Textbaustein wie Friedrichshafen) | – | – | – | **1** | besteht nicht |
| Friedrichshafen (DE) | rund 30 km am Ufer | (Textbaustein wie Lindau) | – | – | – | **1** | besteht nicht |
| St. Gallen (CH) | – | (8,1 % und BAZG wie die anderen CH-Seiten) | Ostschweiz | – | – | **1** | besteht nicht |
| Dornbirn | – | – | – | Tom Dixon (nur hier) | – | **1** | besteht nicht |
| Bregenz | „wenige Minuten vom Zentrum“ | – | – | – | – | **1** | besteht nicht |

**Empfehlung für höchstens 8 indexierte Seiten (Entscheidung E15 liegt beim Inhaber):**

1. **Jetzt indexieren** (6): Rheintal, Liechtenstein, Arlberg, Konstanz, Feldkirch, Appenzell. Das sind genau die Seiten in der Sitemap.
2. **Zwei freie Plätze** für Bregenz und Lindau. Sie haben die stärkste Nähe zu Lochau, bestehen die Regel heute aber nicht. Vorher je 3 eigene Fakten ergänzen, etwa Bus- oder Radweg, Ortsteile und eine echte Referenz.
3. **Auf `noindex,follow` setzen**, bis Fakten da sind: Dornbirn, Friedrichshafen, St. Gallen, Kempten, Ravensburg. St. Gallen geht im geplanten Schweiz-Hub auf.
4. **Widerspruch zur Vorschlagsliste in E15** (Masterplan Z. 425): E15 bevorzugt Liechtenstein, Rheintal, St. Gallen, Lindau, Bregenz, Dornbirn, Friedrichshafen und Feldkirch. Nach dem Audit bestehen davon nur 3 die 4-Fakten-Regel, Arlberg, Konstanz und Appenzell dagegen schon. Der Inhaber muss entscheiden.
5. Appenzell und Rheintal überschneiden sich stark, besonders bei Steuer und Einfuhr. Darum gilt Appenzell nur als knapp bestanden.
6. Auf der Lindau-Seite steht noch der Alt-Text „Meerblick“ (Masterplan AP6 Nr. 1). Das ist nicht meine Datei.

## 2. Sitemap: neue Seiten

Prüfung per curl am 26.10.2026 auf dem Dev-Server:

| URL | HTTP | robots | canonical | in Sitemap |
|---|---|---|---|---|
| /de/yacht-interior | 200 | index, follow | selbst | ja |
| /de/designermoebel-liechtenstein | 200 | index, follow | selbst | ja |
| /de/designermoebel-rheintal | 200 (beim ersten Aufruf 500 wegen Dev-Kompilierung, danach 2× 200) | index, follow | selbst | ja |
| /de/designermoebel-arlberg | 200 | index, follow | selbst | ja |
| /de/designermoebel-konstanz | 200 | index, follow | selbst | ja |
| /de/designermoebel-feldkirch | 200 | index, follow | selbst | ja |
| /de/designermoebel-appenzell | 200 | index, follow | selbst | ja |
| /de/designermoebel-kempten | 200 | index, follow | selbst | **nein** (Audit 2) |
| /de/designermoebel-ravensburg | 200 | index, follow | selbst | **nein** (Audit 3) |
| /de/outdoor-gartenplanung | 200 | **noindex, follow** | selbst | **nein** (Rechtsprüfung offen) |

- `lastModified` ist überall 2026-10-26. Die Seiten sind untracked und haben deshalb kein git-Datum. Es zählt das Änderungsdatum der Datei. Wer den Text einer Seite ändert, setzt das Datum in `extraPages.js` neu. `new Date()` wird nirgends verwendet.
- Wandert eine Seite später nach `LANDING_PAGES`, überspringt `getStaticEntries` sie in `EXTRA_PAGES` automatisch. Ein Test prüft, dass keine Seite in beiden Listen steht.
- Die XML-Serialisierung liegt jetzt im reinen Modul `src/lib/seo/sitemap/xml.js`, damit sie testbar ist. `sitemapEntries.js` exportiert sie unverändert weiter, die Routen blieben unberührt.

**Integrationsprüfung (live, localhost:3000):**

- `/sitemap.xml` ist der Index mit 4 Teil-Sitemaps. Alle liefern 200, das XML ist wohlgeformt (Test und Browser-Baumansicht).
- `<loc>`-Anzahl: static 60, marken 336, news 124, produkte 7164. **Keine doppelte `<loc>` über alle 4 Dateien.** Jede neue URL steht genau einmal drin.
- `<lastmod>` von `/sitemap-static.xml` im Index ist 2026-10-26.
- `SITEMAP_BASE=http://localhost:3000 node --test tests/unit/sitemap.test.mjs`: 7 von 7 grün.

## 3. llms.txt

Neuer Abschnitt `## Regionen und Leistungen` zwischen „Marken“ und „Optional“. Er wird aus derselben Registry erzeugt und ist statisch, hängt also nicht vom Backoffice ab. Ein Test schließt in diesen Zeilen Händler-, Partner- und Superlativ-Wörter aus. Der Kopf mit „Ausstellung und Beratung für über 35 internationale Premium-Marken“ bleibt unverändert. Das Backoffice listet 36 aktive Marken.

## 4. /api/image

- grep nach `api/image` im ganzen Repo: Treffer nur in `robots.js` und in Markdown-Berichten, kein Aufrufer im Code.
- `src/app/api/image/route.js` ist gelöscht, eine Sicherungskopie liegt im Scratchpad der Sitzung. Der Ordner wurde entfernt.
- `robots.txt` live: `Allow: /` (Suchmaschinen und KI-Antwortdienste), `Allow: /_next/image` + `Allow: /` (`*`). Kein `/api/image` mehr. `Disallow: /api/` bleibt, die Trainingsbot-Sperre bleibt unverändert (E10).

## 5. Marke × Kategorie (vorbereitet für Runde 2)

**API** (`src/lib/marken/brandCategory.js`, reine Logik, nur relative Imports):

- `buildBrandCategories(products, collections)` liefert je Marke `{ brand, brandSlug, total, categories: [{ key, slug, count, indexable, collision, href, lastModified }] }`. Gezählt werden nur aktive Produkte mit `path_field` und `kategories`, jedes `path_field` einmal. Der Slug entsteht wie bei den Produkt-URLs mit `generateSlug(kategories.toLowerCase())`. Es gilt `indexable = count >= 3 && !collision`.
- `collision` bedeutet: Der Kategorie-Slug ist gleich einem Collection-Slug derselben Marke. Die Route `[title]/[collection]` löst zuerst Collections auf, die Kategorie wäre dann nie erreichbar. `collections` kann `{ [Marke]: [{ name }] }` oder ein flaches Array mit `marken` sein.
- `brandCategoryHref(brand, category, locale = "de")` liefert zum Beispiel `/ueber-uns/marken/minotti/sofas-couches`, auf Englisch `/about-us/brands/…`. Ohne Locale-Präfix, wie `collectionPath`.
- `getBrandCategoryEntries()` in `src/lib/seo/sitemap/brandCategoryEntries.js` ist **nicht eingebunden**. Die Route löst heute nur Collections auf, Kategorie-URLs liefern deshalb noch 404. Einbinden erst zusammen mit der Routen-Erweiterung in Runde 2.

**Übersicht mit echten Backoffice-Daten** (nur lesend: `get_produkte_by_marke_api`, `get_collections` auf backoffice.platzhirsch.studio, 26.10.2026):

| Marke | Produkte | Kategorien | indexierbar (≥ 3) | Indexierbare Kategorien (Anzahl) | Unter 3 → noindex | Collections / Kollisionen |
|---|---|---|---|---|---|---|
| Minotti | 487 | 18 | 16 | armchairs-stools (96), side-tables (85), sofas-couches (62), rugs (34), dining-chairs (29), dining-tables (29), decor (24), beds (23), sideboards-chests (23), coffee-tables (20), small-furniture (20), night-tables (12), shelves (11), bedwear (8), chaise-longues-daybeds (4), kitchen-accessories (4) | mirrors (2), lamps (1) | 0 / 0 |
| Poliform | 103 | 12 | 11 | armchairs-stools (17), sofas-couches (14), beds (12), dining-chairs (12), dining-tables (11), kitchen (9), coffee-tables (8), sideboards-chests (7), lounge-furniture-daybeds (5), wardrobes (4), shelves (3) | chaise-longues-daybeds (1) | 0 / 0 |
| Paola Lenti | 100 | 14 | 9 | lounge-furniture-daybeds (30), garden-tables (14), rugs (14), sofas-couches (8), armchairs-stools (7), garden-chairs (6), side-tables (5), sun-loungers (5), dining-chairs (3) | beds (2), dining-tables (2), parasols (2), chaise-longues-daybeds (1), small-furniture (1) | 0 / 0 |
| Rimadesio | 63 | 14 | 10 | shelves (11), sideboards-chests (8), armchairs-stools (6), small-furniture (6), wardrobes (6), coffee-tables (5), dining-tables (5), dining-chairs (4), display-cabinets (4), rugs (3) | night-tables (2), lamps (1), mirrors (1), tv-low-units (1) | 0 / 0 |
| ClassiCon | 126 | 15 | 13 | side-tables (28), armchairs-stools (14), rugs (14), coffee-tables (13), lamps (10), dining-chairs (7), mirrors (7), small-furniture (7), decor (6), dining-tables (6), bar-stools (5), sofas-couches (4), chaise-longues-daybeds (3) | garden-tables (1), shelves (1) | 0 / 0 |

Damit gibt es 59 indexierbare Kombinationen bei diesen 5 Marken, in 4 Sprachen sind das 236 URLs. Auffälligkeiten für Runde 2:

- `get_collections` liefert für alle 5 Marken eine **leere Liste**, und kein Produkt hat ein `collection`-Feld. Kollisionen gibt es heute deshalb keine, die Prüfung greift erst, wenn Collections gepflegt sind.
- Die Kategorie-Schlüssel sind englische Slugs, zum Beispiel `armchairs-stools`. Die deutschen Seitentitel brauchen die Übersetzung aus `CATEGORY_I18N` (`src/lib/seo/productCategories.js`), die deutsche URL bleibt aber englisch, wie bei `/produkte/<kategorie>`.
- Einige Zuordnungen im Backoffice wirken fraglich, etwa Rimadesio mit `armchairs-stools` (6) und `rugs` (3) oder Minotti mit `decor` (24). Vor dem Livegang sollte das Team die Kategorien prüfen, sonst entstehen dünne oder falsche Seiten.

## 6. Tests und Prüfungen

- `node --test tests/unit/brandCategory.test.mjs`: 6 grün (Zählung, Filter, Dubletten, Kollision in beiden Eingabeformen, Sortierung, Hrefs in 4 Sprachen).
- `node --test tests/unit/sitemap.test.mjs`: 6 grün und 1 übersprungen. Geprüft werden wohlgeformtes XML, Escaping, lastmod, Index, Registry ohne Dubletten und ohne Überschneidung mit `LANDING_PAGES`, Fakten ≥ 4 je Regionsseite und Wortliste. Mit `SITEMAP_BASE` läuft zusätzlich der Live-Test, der alle 4 Sitemaps holt, die Wohlgeformtheit prüft und doppelte `<loc>` sucht.
- `npx eslint` auf alle eigenen Dateien: sauber.
- Screenshots: `qa-screenshots/teamleiter/r1-R1-seo/selbst/` (6 URLs × iPhone, Android, iPad und Desktop, alle 200, kein horizontaler Überlauf). Die Desktop-Aufnahme von `/de/yacht-interior` meldet 243 Konsolenfehler „Router action dispatched before initialization“. Das ist ein Dev-/HMR-Effekt, solange parallel Dateien geändert werden, und liegt nicht in R1-seo-Dateien.

## Dateien

- neu: `src/lib/seo/sitemap/extraPages.js`, `src/lib/seo/sitemap/xml.js`, `src/lib/seo/sitemap/brandCategoryEntries.js`, `src/lib/marken/brandCategory.js`, `tests/unit/sitemap.test.mjs`, `tests/unit/brandCategory.test.mjs`
- geändert: `src/lib/seo/sitemapEntries.js`, `src/app/llms.txt/route.js`, `src/app/robots.js`
- gelöscht: `src/app/api/image/route.js`

## Offene Punkte

1. **E15 (Inhaber):** Welche Regionsseiten werden indexiert? Das Audit empfiehlt eine andere Auswahl als die Liste in E15 (siehe Abschnitt 1). Kempten und Ravensburg stehen heute auf `index`, sind aber nicht in der Sitemap. Sie sollten auf `noindex,follow` gesetzt oder mit Fakten ergänzt werden. Zuständig ist das Regionen-Paket (AP6).
2. Die 9 bestehenden `LANDING_PAGES` fehlen in `llms.txt`. Sie gehören dort nur hinein, wenn sie das Audit bestehen.
3. Runde 2: `[collection]`-Route um Kategorie-Slugs erweitern, danach `getBrandCategoryEntries()` in `getBrandEntries()` einbinden und die Backoffice-Kategorien bereinigen lassen.
4. Kein npm-Skript für die Tests vorhanden (`package.json` gehört nicht zum Paket). Aufruf: `node --test tests/unit/`.
5. Außerhalb des Pakets gesehen: Der Cookie-Banner sagt „das beste Nutzererlebnis“. Das ist ein Superlativ und gehört zu Team 7.

## Nachbesserung nach QM-Feedback (26.10.2026, Note vorher 8/10)

| Punkt | Status | Was |
|---|---|---|
| P2.1 Doorway-Regel | **im SEO-Teil behoben** | Neue Quelle `src/lib/seo/sitemap/doorwayAudit.js` (`REGION_AUDIT`, `MIN_OWN_FACTS = 4`, `passesDoorwayAudit()`, `regionRobots()`). `getStaticEntries` lässt jetzt auch `LANDING_PAGES`-Regionsseiten unter 4 Fakten weg. Live: `/sitemap-static.xml` 60 → 55 `<loc>`, nur noch Rheintal, Liechtenstein, Arlberg, Konstanz, Feldkirch, Appenzell. Bregenz, Dornbirn, Lindau, Friedrichshafen und St. Gallen sind raus. Kein Seiteninhalt und keine Robots-Angabe geändert, die Seiten bleiben erreichbar und verlinkt. |
| P2.1 Robots | **offen, Übergabe an Regionen-Paket (AP6)** | Die 7 Seiten unter der Regel stehen noch auf `index, follow`. `landingMetadata` in `src/components/Landing/landingPage.js` soll `robots: regionRobots(path)` setzen. Der Live-Test meldet das als `todo`. E15 (Inhaber) kann das Ergebnis nur über echte zusätzliche Fakten und eine höhere Zahl in `REGION_AUDIT` ändern. |
| P2.2 Kontrast Regionen-Template | **nicht meine Datei, offen zur Prüfung** | Im aktuellen Live-HTML von `/de/designermoebel-rheintal` gibt es die Klassen `text-[#d1b250]/70` und `bg-[#30373e]` nicht mehr, das Template wurde umgebaut. Eine axe-Nachprüfung durch das zuständige Team steht aus. |
| P2.3 Hero Yacht | **offen, Team 5** | `/de/yacht-interior` nutzt weiter `/Images/Outdoor/bannerImage5.jpg` (Pinien, Meer). Der Screenshot `fix/de-yacht-interior--iphone.png` belegt das. |
| P3.2 Kommentar | behoben | `extraPages.js` verweist jetzt auf `tests/unit/sitemap.test.mjs`. |
| P3.3 Live-Test still übersprungen | behoben | `SITEMAP_BASE` hat den Standardwert `http://localhost:3000`. Übersprungen wird nur, wenn der Server nicht erreichbar ist, dann mit Warnung. |
| P3.4 lastModified | behoben | Ein Test prüft, dass `lastModified` in `EXTRA_PAGES` nicht älter ist als die zugehörige `page.js` (Datum des letzten git-Commits, sonst mtime). |

**Tests:** `node --test tests/unit/sitemap.test.mjs tests/unit/brandCategory.test.mjs`: 17 Tests, 16 grün, 1 todo (Robots, siehe oben). Neu sind: Audit deckt alle 13 Regionsordner ab, `facts` passt zum Audit, Live-Sitemap listet Regionsseiten genau dann, wenn sie das Audit bestehen, lastModified ≥ Dateidatum. eslint auf alle eigenen Dateien: 0 Meldungen.

**Prüfwerkzeug:** `qa-screenshots/teamleiter/r1-R1-seo/fix/`. Der Dev-Server lieferte zeitweise 500, weil andere Teams gerade parallel an Dateien arbeiteten: `markenitems.js` fand `./brandData` nicht, in `produkte/[category]/page.js` stand ein Syntaxfehler, `global-error.js` hatte einen Fehler beim Font-Loader. Keiner davon liegt in R1-seo-Dateien. Sobald der Server stabil lief: Rheintal und `/sitemap-static.xml` auf allen 4 Geräten 200. Auf dem iPhone meldet Rheintal horizontalen Überlauf, auf Android ist der Header-Button „Termin“ angeschnitten. Das ist der neue Header von Team 1, nicht SEO.
