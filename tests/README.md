# Tests

## Überblick

| Befehl | Was |
|---|---|
| `npm test` | Unit-Tests (`tests/unit`), **offline**: Live-Teile laufen nur mit ausdrücklich gesetzter `SITEMAP_BASE` (oder `QA_BASE`), z. B. `SITEMAP_BASE=http://localhost:3101 npm test` gegen die Prod-Kopie (R5-Fix P1). Build-Artefakt-Prüfung der Marken-Routen: `PRERENDER_MANIFEST=../platzhirsch-prodtest/.next/prerender-manifest.json` (`r9-p1-prerender-manifest.test.mjs`). |
| `npm run test:e2e` | Playwright gegen einen **laufenden** Server (Standard `http://localhost:3000`, sonst `BASE_URL=… npm run test:e2e`). Startet selbst keinen Server. |
| `npm run test:e2e:prod` | Dieselben Tests gegen einen Produktions-Server auf `http://localhost:3100`, der schon läuft. `BASE_URL` hat immer Vorrang. **Nie im Repo bauen.** Den Server baut und startet `npm run check:prod` (siehe unten). |
| `npm run check:prod -- --label=<name>` | Produktions-Prüfung (`tools/qa/prod-check.mjs`, R3-release). Ablauf: Kopie außerhalb des Repos, `node_modules` als Junction, `turbopack.root` nur in der Kopie, `next build`, `next start -p 3100`, Volllauf aller Specs, `check-claims --live`, `check-nap`, LCP/CLS/TBT. Danach werden Server und Junction (`rmdir`) sicher abgebaut. Ergebnis: `qa-screenshots/teamleiter/r4-release/<name>/summary.md` (anderer Ordner mit `--round=`). Teillauf: `--steps=start,tests --specs="upload.spec.js"`. Seit R4 zusätzlich: `manifest` (vorgerenderte Routen aus `prerender-manifest.json`, Seiten, die dynamisch bleiben müssen), `probe` (Status und Sicherheits-Header fester URLs, alle Ratgeber-Artikel, globale 404), `logscan` („static to dynamic“, NoFallbackError im Server-Log), TTFB in `perf`, Produktseiten-Stichprobe (60 aus `sitemap-produkte` + je 10 der importierten Marken) im Claim-Check. `--isolated --npm="install --save-exact …"` testet eine Paketänderung in einer Kopie mit eigenem `node_modules` (`npm ci`, keine Junction). |
| `npm run check:perf -- --base=http://localhost:3100` | Nur LCP/CLS/TBT (`tools/qa/perf.mjs`), mobil gedrosselt und Desktop, Median aus 3 Läufen |
| `npm run test:smoke` | Nur die Smoke-Specs: `smoke`, `content`, `event`, `errors` |
| `npm run test:a11y` | Nur `a11y.spec.js` |
| `npm run test:unit` | Unit-Tests mit `node --test "tests/unit/**/*.test.mjs"` (Node 24, ohne Zusatzpaket). Hinweis: `node --test tests/unit` (Ordner) bricht unter Node 24 mit `Cannot find module` ab, daher das Glob-Muster. |
| `npm run check:claims` | Claim-Prüfung im Quelltext (`tools/checks/check-claims.mjs`, Paket R1-legal) |
| `npm run check:nap` | Prüfung von Name, Adresse und Telefon (`tools/checks/check-nap.mjs`, Paket R1-legal) |
| `npm run check:facts` | Faktencheck-Gate (`tools/content/check-facts.mjs --strict`, R6-release): Exit 1, sobald eine Zahl in `src/messages/*.json` keinen Beleg in `tools/content/facts.json` hat. Läuft auch in `check:prod` (Schritt `facts`) und in der CI (Schritt 2b) |

Berichte: `qa-screenshots/teamleiter/tests-report/index.html` (HTML) und Artefakte von fehlgeschlagenen Tests (Screenshot, Trace) in `qa-screenshots/teamleiter/tests-results/`. Beide liegen außerhalb des Repos, weil `qa-screenshots/` in `.gitignore` steht.

Einzelne Specs: `npx playwright test smoke.spec.js --project=desktop`. Fehlgeschlagene erneut ausführen: `npx playwright test --last-failed`.

`@playwright/test` (1.64.1) und `@axe-core/playwright` (4.13.0) sind exakt gepinnt.

## Projekte

| Projekt | Gerät | Specs |
|---|---|---|
| `iphone` | iPhone 15 Pro (WebKit, 393 px) | smoke, a11y |
| `pixel` | Pixel 7 (Chromium, 412 px) | smoke, a11y |
| `ipad` | iPad Pro 11 (WebKit, 834 × 1194) | smoke |
| `desktop` | Desktop Chrome 1440 × 900 | alle |

`content`, `event` und `errors` prüfen Serverantworten und laufen nur im Projekt `desktop`. Die Labs-Tests in `smoke.spec.js` prüfen Status und robots einmal (Desktop) und den 375-px-Überlauf auf iPhone und Pixel.

Einstellungen: 2 Worker, 1 Retry, großzügige Timeouts (Test 180 s, Navigation 120 s), weil Seiten im Dev-Server beim ersten Aufruf kompilieren. Es gibt keine festen Wartezeiten. Gewartet wird auf `load` und, mit Obergrenze, auf `networkidle`. `tests/e2e/global-setup.js` wartet vor dem Start bis zu 3 min, bis `/de` mit 200 antwortet. Formulare werden nie abgeschickt.

**Unterschied zu `tools/qa/shoot.mjs`:** Das Prüfwerkzeug misst den Überlauf nur in den Gerätebreiten 393 px (iPhone 15 Pro) und 412 px (Pixel 7). Der Playwright-Test prüft zusätzlich **375 px** (iPhone SE/mini, kleine Android-Geräte). Meldet `shoot.mjs` grün und Playwright rot, ist das kein Widerspruch: Der Fehler tritt nur zwischen 375 und 392 px auf.

## Specs (`tests/e2e/`)

Formulare werden nie abgeschickt: Tests mit Formularen rufen `blockFormSends(page)` aus `helpers.js` auf. Damit wird jeder Nicht-GET-Request an `/api/**` per `page.route` mit 503 beantwortet und protokolliert.

Neu in Runde 2 (`helpers.js` nur additiv erweitert): `LABS_PAGES`, `dismissCookieBanner`, `blockFormSends`, `robotsDirectives`, `jsonLdNodes`, `measureOverflow`.

- **smoke.spec.js**: Die 20 Kernseiten (`CORE_PAGES` in `helpers.js`, darunter eine echte Kategorie `/de/produkte/lamps` und ein echtes Produkt `/de/produkte/lamps/lamps-2097-18`, seit R2-Fix auch `/de/ratgeber`, `/de/adventsabend` und `/de/bewerten`) liefern 200 und erzeugen keine Konsolenfehler, auf iPhone, Pixel, iPad und Desktop.
- **seo.spec.js**: genau eine H1, `title`, genau ein absolutes `canonical`, hreflang `de/en/fr/it/x-default` auf mehrsprachigen Seiten, alle JSON-LD-Blöcke parsebar. `noindex` auf `/de/leistungen/*`, `/de/portal` und `/de/preview/*`. `/de/adventsabend` ist `noindex`, solange das Event-Schema keine Uhrzeit hat. Offene noindex-Entscheidungen stehen in `PENDING_NOINDEX` (fixme). Keine `noindex`-Seite darf in einer Sitemap stehen. Der Sitemap-Index und alle Teil-Sitemaps sind wohlgeformt (XML-Parser des Browsers), haben absolute URLs und gültige `lastmod`. 20 gleichmäßig verteilte Stichproben-URLs, auf den Testserver umgeschrieben, liefern 200 ohne Weiterleitung.
- **legal.spec.js**: Prüft das serverseitige HTML, und zwar den sichtbaren Text **und** `<title>`, Meta-Description, Open-Graph-/Twitter-Tags sowie alle Textwerte im JSON-LD (`headText` in `helpers.js`; Fundstellen tragen die Quelle, z. B. `[meta description]` oder `[json-ld]`). Regeln:
  - Händler-Behauptungen: `Händler`, `offiziell…` und `autorisiert…`, dazu die EN/FR/IT-Entsprechungen. Ausnahmen sind ClassiCon sowie „Offizielle Website“, „Site officiel“, „Sito ufficiale“ und „offizielle Eröffnung“.
  - Superlative in allen Formen: `größte`, `größten`, `größter`, `größtes`, `größtem`, `largest`, `biggest`, `le plus grand`, `il più grande`. Dazu Selbstbeschreibungen als `führend`/`Marktführer`/`leading`, „Nr. 1“ und „der/die einzige … in Vorarlberg/am Bodensee/in Österreich“. Erlaubt sind „führender (Design-)Marken“ bzw. „leading brands“ (das beschreibt die Marken, nicht Platzhirsch) und „mit größter Sorgfalt/Präzision/Maßgenauigkeit“.
  - `abgesicherte Anzahlung`.
  - Rabatt-Werbung „bis zu X %“.

  Geprüft werden die Kernseiten, die News-Übersicht in 4 Sprachen, Minotti in EN/FR/IT, weitere Landingpages, **alle** DE-Markenseiten aus `sitemap-marken.xml` und **alle** News-Artikel in 4 Sprachen aus `sitemap-news.xml`.
- **content.spec.js**: Ratgeber. Der Hub und alle Artikel aus `src/content/ratgeber/*.md` liefern 200 und haben genau eine H1. `robots` folgt der Freigabe: `noindex`, solange `freigegeben: true` fehlt (Hub: solange kein Artikel freigegeben ist). Im HTML (Text und Payload) darf kein Redaktions-Marker stehen (`[prüfen: …]`, `[… eintragen]`). `/en|fr|it/ratgeber` liefern 404.
- **event.spec.js**: `/de/adventsabend` und `/de/bewerten` liefern 200, sind `noindex`, haben eine H1, andere Sprachen 404. Adventsabend: kein schema.org-`Event` ohne Uhrzeit im `startDate`; ohne Event muss die Seite `noindex` sein; Anmeldeformular mit Name, E-Mail und Personen, alle sichtbaren Felder beschriftet; leeres Absenden markiert Pflichtfelder (`aria-invalid`) und löst keinen Request aus. Bewerten hat kein Formular (bewusst, kein „Review Gating“): geprüft werden der Link „Auf Google bewerten“, der E-Mail-Weg und der Link zur Kontaktseite, und dass vor dem Google-Link kein Formular steht.
- **errors.spec.js**: `/{de,en,fr,it}/preview/fehler` liefert 500 und `noindex`, die übersetzte H1 erhält den Fokus, Header und Footer bleiben, kein technischer Fehlertext ist sichtbar. Im Produktions-Build ohne `ERROR_PREVIEW=1` ist die Vorschau 404, dann werden diese Tests übersprungen. Unbekannte URL: 404, `noindex`, eine H1.
- **smoke.spec.js / Labs**: alle 7 Labs-Seiten (`LABS_PAGES`) liefern auf `/de` 200 und auf `/en` 404, sind `noindex` und haben bei 375 px keinen horizontalen Überlauf.
- **a11y.spec.js**: axe (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`) auf `/de`, `/de/produkte`, der Produktseite und `/de/kontakt` (Pixel und Desktop, Cookie-Banner offen). **Zweiter axe-Lauf nach dem Schließen des Cookie-Banners** („Weiter ohne Einwilligung“) auf iPhone (WebKit), Pixel (Chromium) und Desktop, auf denselben Seiten plus `/de/ratgeber`, `/de/adventsabend` und `/de/bewerten`. Der Test prüft auch, dass das Banner beim ersten Besuch erscheint und danach verschwunden ist. Der Test schlägt bei `serious` und `critical` fehl. Das Dev-Overlay `nextjs-portal` ist ausgenommen. Außerdem wird geprüft:
  - `prefers-reduced-motion: reduce`: Nach dem Laden darf auf `/de` keine CSS-Animation oder -Transition mehr laufen.
  - 375 px: kein horizontaler Überlauf auf denselben 4 Seiten (iPhone und Pixel). Die Fehlermeldung nennt nur die äußersten überstehenden Elemente samt rechter Kante, ohne SVG-Innenleben.

## Produktions-Prüfung (Runde 3)

`playwright.config.js` liest zusätzlich `PW_REPORT_DIR`, `PW_OUTPUT_DIR`, `PW_JSON_REPORT` (JSON-Reporter) und `PW_WORKERS`. So legt `check:prod` jeden Lauf in einem eigenen Ordner ab. Ohne diese Variablen gilt alles wie bisher. Seit dem R5-release-Fix setzt `check:prod` außerdem `COMMERCE_PREVIEW_EXPECT=off`. Dann lässt die Config den Block „Vorschau /de/preview/commerce“ in `r5-commerce.spec.js` aus, denn die Vorschau ist in Produktion ohne `COMMERCE_PREVIEW=1` absichtlich 404. Die Probe prüft genau diese 404. Mit `check:prod -- --commerce-preview` startet der Server mit Schalter, und die Vorschau-Tests laufen mit. Gegen Dev (ohne Variable) laufen sie immer.

R6-release: Dasselbe gilt für das Freigabe-Cockpit `/de/preview/freigaben` mit `--freigabe-preview` (Server mit `FREIGABE_PREVIEW=1`, Tests mit `FREIGABE_PREVIEW_EXPECT=on`, Probe 200 statt 404). `check-claims --live` prüft die Vorschauseiten nur mit `--commerce-preview` bzw. `--freigabe-preview` (oder den gleichnamigen Umgebungsvariablen = 1); `check:prod` reicht die Flags durch. Die Probe verlangt für jede /cmx-404 `Cache-Control: no-store` (die Route setzt den Header selbst). `tests/unit/r6-release.test.mjs` sichert die Release-Punkte der Runde 6 (framer-motion exakt, check:facts, ESLint-Tor auf error, /cmx-404, Vorschau-Schalter, Schweiz-Locator, Abnahme-Liste).

Unterschiede gegen `next start`, die die Specs berücksichtigen:
- **Upload:** Der Server braucht `UPLOAD_TOKEN_SECRET` (mindestens 32 Zeichen, derselbe Wert für Playwright) und `UPLOAD_PUBLIC_BASE_URL=<BASE_URL>`. Sonst zeigt der Link auf die Live-Site.
- **Concierge:** In Produktion ohne Schlüssel ist der Status „unavailable“, die Mock-Tests überspringen sich.
- **Küchenplaner:** Ohne `NEXT_PUBLIC_LABS_PLANER_SENDEN=1` beim Build zeigt der Planer den Hinweis „noch in der Testphase“. Der Testmodus-Test akzeptiert ihn, die zwei Fehlerpfad-Tests überspringen sich. In jedem Fall geht kein Request raus.
- **Fehler-Vorschau:** Ohne `ERROR_PREVIEW=1` beim Build ist sie 404 (Option `--error-preview`).

Ergebnisse: `Marktresearch/digital/teamleiter/release-check.md`.

## Bekannte Befunde (fixme)

Bekannte Verstöße stehen im Code (`KNOWN` in `legal.spec.js`, `KNOWN_AXE` in `a11y.spec.js`, `PENDING_NOINDEX` in `seo.spec.js`). Diese Tests **laufen trotzdem**. Solange die Fundstelle besteht, enden sie als *fixme*, und die Fundstellen hängen als Annotation im HTML-Bericht. Ist die Fundstelle behoben, wird der Test grün. Dann den Eintrag löschen. Jede Fundstelle, die nicht in der Liste steht, lässt den Test fehlschlagen. Ein `KNOWN`-Eintrag in `legal.spec.js` hat zusätzlich ein Muster (`match`): Nur Fundstellen, die darauf passen, gelten als bekannt.

### Claims (Stand 26.10.2026, Runde 3)

`KNOWN` in `legal.spec.js` ist leer. Die News-Superlative der Artikel `platzhirsch-home-living-grand-opening` und `platzhirsch-unsere-broschuere-2022-ist-da` sind entschärft (Lauf 2 gegen `next start` grün, auf dem Dev-Server per curl bestätigt). Jeder neue Händler-, Superlativ-, Anzahlungs- oder Rabatt-Fund lässt den Lauf rot werden.

### noindex (Stand 26.10.2026)

| Seite | Befund | Zuständig |
|---|---|---|
| `/de/kuechen-vorarlberg` | Laut Code-Kommentar „Kept noindex until the copy is final“, ausgeliefert wird `index, follow`, die Seite steht in `sitemap-static.xml`. | Team 5 / R1-seo: entweder `noindex` setzen und aus der Sitemap nehmen, oder Eintrag löschen und Kommentar korrigieren. |

### A11y (axe, Stand 26.10.2026, Runde 2)

`KNOWN_AXE` ist leer. Der Kontrastbefund auf `/de/kontakt` ist behoben (Pixel und Desktop mit Banner, iPhone, Pixel und Desktop ohne Banner grün). Alle 7 Seiten des Laufs nach dem Schließen des Cookie-Banners sind ohne serious/critical-Befund.

## Laufergebnisse

Siehe `Marktresearch/digital/teamleiter/r1-R1-tests.md` und `Marktresearch/digital/teamleiter/r2-R2-qualitaetsnetz.md`.
