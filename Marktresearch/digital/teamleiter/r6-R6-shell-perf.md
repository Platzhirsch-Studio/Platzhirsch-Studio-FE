# R6-shell-perf: Bericht

**Stand:** 26.10.2026 · Branch `feature/neuauftritt` · nichts committet, kein Build im Repo, keine npm-Installation.
Rohdaten: `qa-screenshots/teamleiter/r6-shell-perf/` (vorher/nachher, Profile, A/B, Lighthouse, axe, Skripte) und `qa-screenshots/teamleiter/r6-R6-shell-perf/selbst/` (shoot.mjs).

## Nachbesserung nach QM-Feedback (Note 7/10)

Bezug: `qa-screenshots/teamleiter/r6-R6-shell-perf/feedback.md`. Prüfaufnahmen: `qa-screenshots/teamleiter/r6-R6-shell-perf/fix/`.

| Punkt | Status | Was |
|---|---|---|
| **P1 TBT** | **offen, nicht beim Paket** | Die Abnahme braucht die ruhige Schlussmessung durch R6-release (Lighthouse-TBT und perf.mjs, Median aus 3 Läufen) und die Budget-Entscheidung des Teamleiters (250 ms, Plan §„TBT-Budget“). Laut Monitor arbeitet R6-release noch. Damit diese Messung nicht verfälscht wird, habe ich in dieser Runde **keinen** Prod-Build und **keine** Messung gestartet. Umgesetzt ist der nächste Hebel aus dem Feedback: **Die Linklisten der Fußzeile kommen jetzt als Server-HTML** (`Reusable/Footer.js`, `linkItemsHtml`, Escaping über das gemeinsame `esc` aus `megaPanelHtml.js`), also 5 Spalten und die Regionen. Belege per Dev-SSR: Das Footer-Markup ist auf `/de`, `/de/kontakt` und `/en/contact` **zeichengleich** (61/61/44 Links). Im RSC-Payload stehen 47 `li`-Elemente weniger (`/de/kontakt` 61 → 14), und er ist pro Seite 4,5 KB kleiner. Die Client-Navigation läuft weiter über LinkDelegate (e2e r4-shell grün). **Für R6-release:** Liegt `/de/kontakt` auch bei ruhiger Messung über 530 ms, sind die weggefallenen Montserrat-Preloads einzeln gegenzuprüfen: `app/not-found.js` in der Prod-Kopie auf den alten Stand setzen und A/B messen. |
| P2 ConsentEmbed YouTube/Vimeo | **behoben** | Neue Tabelle `VIDEO_TEXTS` (youtube, vimeo × de/en/fr/it) mit Titel, Text und Knopf („YouTube-Video ist deaktiviert“ … „Video laden“). Der DE-Wortlaut für YouTube entspricht `YouTubeFacade.js`. Regel in `defaultEmbedTexts()`: Props zuerst. Ein Videodienst im globalen Katalog, erkennbar am vorhandenen `bannerTitle`, bekommt die Videotexte. Ein verschachtelter Provider wie in YouTubeFacade behält seine eigenen `embed*`-Texte. Google Maps bleibt unverändert. Die sha256-Prüfungen aus r4-recht und r3-shell sind grün. |
| P2 messages-r6-shell.json | **behoben** | R6-i18n hat `Shell.header.germanOnlyNote` in alle 4 Kataloge übernommen. Die Ersatztabelle in `shellLabels.js` und der Parameter `tShell` (navbar.js, Footer.js) sind entfernt, der Text steht jetzt nur in `src/messages`. Der Test vergleicht Katalog und Vorschlag. Der Hinweis in der JSON-Datei ist angepasst. |
| P2 global-error | **bekannte Lücke, dokumentiert** | Unverändert: Beim allerersten Serverfehler ohne Layout-CSS erscheinen die Ersatzschriften (Didot/Georgia bzw. System-Sans), danach die Hausschriften. Ein Font-Import kompiliert nur im Prod-Build und hat den Dev-Server lahmgelegt. Ihn nachzuholen gehört zu Next 16.4.2 (Ablaufblatt R6-release), nicht in diese Runde. |
| P2 Betriebsdisziplin | **eingehalten** | In dieser Runde gab es keine Font-Experimente und keine Builds. Dev-Server-Änderungen betrafen nur Footer, ConsentEmbed und shellLabels, der Server blieb durchgehend auf 200. Künftige Font-Versuche nur noch in einer Prod-Kopie. |

**Prüfung Fix:** Unit `r6-shell-perf` 10/10, zusammen mit r3-shell, r4-shell, r5-shell-seo, r4-i18n, r4-recht, r5-content und r6-i18n **81/81**. ESLint 0. e2e (desktop) r6-shell-perf, r3-shell, r4-shell und r4-recht-consent **31/31** gegen dev. shoot.mjs `fix/`: 7 URLs × 4 Geräte = 28 Aufnahmen, alle 200 (`/wp-login.php` 404 wie gewollt), 0 Überlauf. Die einzige Konsolenmeldung ist die erwartete 404-Ressource. Angesehen: `/de/kontakt` Desktop ganz (Fußzeile mit Spalten und Regionen unverändert), `/de` iPhone, 404 iPhone (Bodoni/Instrument).

**Geändert im Fix:** `src/components/Reusable/Footer.js`, `src/components/Navbar/{megaPanelHtml,shellLabels,navbar}.js`, `src/components/Cookies/ConsentEmbed.js`, `tests/unit/r6-shell-perf.test.mjs`, `Marktresearch/digital/teamleiter/messages-r6-shell.json` (nur Hinweis).

## Ergebnis je Auftrag

| # | Auftrag | Status | Beleg |
|---|---|---|---|
| 1 | TBT Hülle ≤ 200 ms | **nicht erreicht, nicht belegbar.** Drei Maßnahmen umgesetzt, eine verworfen (siehe unten) | perf.mjs (mobil, gedrosselt, Median aus 3 Läufen), nachher: `/de` **294 ms** (vorher 325), `/de/kontakt` **562 ms** (vorher 530). Die Maschine lief dabei mit 95–100 % CPU, weil 8 Pakete parallel arbeiteten. Im ruhigen R5-Lauf hatte `/de` 214 ms. |
| 2 | Sprachumschalter DE-only | **erledigt** | `shellNav.js`: Projekte, Schweiz-Hub (`einkaufen-aus-der-schweiz`), `gutscheine`, `gutscheinbedingungen` und `atelierverkauf` fehlten in der Liste. EN/FR/IT führen dort jetzt auf `/en`, `/fr` und `/it`. Neu ist ein sichtbarer Hinweis in Kopf-Liste, Mobilmenü und Fußzeile: „Diese Seite gibt es nur auf Deutsch. Die anderen Sprachen führen zur Startseite.“ Die Links bleiben echte Links mit `hreflang`. Ein Unit-Test durchsucht `src/app/[locale]/*/page.js` und schlägt fehl, sobald eine neue DE-only-Seite in der Liste fehlt. Die hreflang-Angaben der Seiten sind unverändert (der e2e-Test vergleicht sie vorher und nachher). |
| 3 | Globale 404 und global-error in Hausschriften | **404 erledigt, global-error teilweise** | Neue Font-Definitionsdatei `Reusable/fonts.js` (Muster aus der next/font-Doku). `[locale]/layout.js` und `app/not-found.js` nutzen dieselben Dateien. `/wp-login.php` zeigt jetzt Bodoni und Instrument Sans (Screenshots, e2e prüft per `document.fonts`). Nebeneffekt: Die alte 404 lud Montserrat mit `preload`, und weil die Root-404 in jedem Seitenbaum steckt, wurden auf **jeder Seite** 2 Montserrat-Dateien vorgeladen (68 + 35 KB). Diese Preloads fallen weg, statt 4 werden 2 Schriften vorgeladen. Ohne `cookies()`/`headers()`, Logscan 0 × static-to-dynamic. |
| 4 | FadeInView, Merkliste, ConsentEmbed | **erledigt** | `Reusable/FadeInView.js` ist gelöscht (grep vorher: 0 Importe, nur Kommentare und der Testfall). Der Testfall in `tests/unit/r4-shell.test.mjs` ist entfernt; die Prüfung der Reveal-CSS (reduced motion und „Ruhige Ansicht“) übernimmt `r6-shell-perf.test.mjs`. **Merkliste:** Hero mit `quality: 75` statt 50 (60–65 ist in `images.qualities` nicht erlaubt), über `singlePageSlider` → `PageHeader`. **ConsentEmbed:** neue Props `title`, `text`, `label` und `icon`. Ohne Angabe bleiben die bisherigen `Cookies.embed*`-Texte und die Stecknadel. `service="youtube"` (bzw. vimeo) bekommt standardmäßig ein Play-Symbol statt des Kartensymbols. Banner-Texte, Cookie-Name und Cookie-Format sind unverändert (r4-recht sha256 grün). |
| 5 | A11y | **grün** | Lighthouse 12.8.2 A11y auf `/de` (Prod-Build): **100 mobil, 100 desktop**, 0 Befunde. axe (wcag2a/aa, 21a/aa, 22aa) mobil und desktop auf `/de`, `/de/kontakt`, `/de/ratgeber`, `/de/merkliste` und `/wp-login.php` sowie mit offener Sprachliste: **0 Verstöße**. reduced motion: keine neue Bewegung. Die Sprachliste ist ohne Animation. |

## TBT: Messung und Maßnahmen

**Werkzeug:** zwei eigene Prod-Kopien außerhalb des Repos. `../ph-prod-r6-shell` (vorher) lief auf Port 3166, `../ph-prod-r6-shell-neu` (nachher) auf Port 3167. Gebaut wurde nach dem Muster von `prod-check.mjs` (robocopy, Junction, turbopack.root-Wrapper). Danach habe ich die Server beendet und beide Junctions mit `rmdir` entfernt. Das Repo-node_modules ist unversehrt.

**Profil (vorher, Trace je Long Task, `trace.mjs`/`cpu-tbt.mjs`):** Der TBT von `/de` und `/de/kontakt` hat drei Quellen:
1. **Erstes Layout des HTML (vor FCP), etwa 40 %:** ein Task mit Layout und Style. Die Hausschriften machen davon etwa 30 % aus (A/B mit Systemschrift, `css-ab.mjs`). `text-rendering`, `text-wrap`, `:has()`, `opsz` und Scroll-Timeline haben keinen messbaren Anteil.
2. **Auswertung von react-dom und Start der Hydration, etwa 30 %:** ein Task mit `EvaluateScript` des Framework-Chunks. Ihn bestimmen Next und React, nicht die Hülle.
3. **Hydration und Nacharbeit, etwa 30 %:** 50–160 ms lange React-Tasks. Dazu kommt ein Style-Recalc nach dem Einblenden der Consent-Leiste, weil `--ph-consent-h` auf `<html>` gesetzt wird.

**Umgesetzt:**
- **Mega-Menü als Server-HTML** (`Navbar/megaPanelHtml.js`, `DesktopNav.js`). Die Panels hatten etwa 270 DOM-Knoten und 72 Links auf jeder Seite, das ist ein Drittel des DOM von `/de/kontakt`, und unter 1280 px sind sie unsichtbar. Sie kommen jetzt als ein HTML-String pro Raum. Das Markup ist byte-gleich (Vergleich der SSR-Ausgabe), die Links bleiben für Crawler im HTML. React erzeugt und hydriert pro Panel nur noch 1 Element. `aria-current` setzt ein Effekt aus `data-nav-path`, auch nach einem Routenwechsel (geprüft im Prod-Build: Öffnen, Esc mit Fokus zurück, Client-Navigation).
- **Consent-Leiste nach Leerlauf** (`client-layout.js`, `requestIdleCallback`, spätestens nach 1,5 s). Der Chunk-Download startet weiter früh. Komponente, Texte, Knopfnamen und Cookie sind unverändert. Die Leiste erscheint dadurch etwas später, auf Screenshots direkt nach `load` fehlt sie.
- **Montserrat-Preload weg** (siehe Punkt 3): 103 KB weniger auf jeder Seite.

**Verworfen:** `content-visibility: auto` für Fußzeile und Startseiten-Abschnitte. Die Ganzseiten-Screenshots (shoot.mjs, Jury) zeigten die Abschnitte leer, deshalb habe ich es zurückgebaut.

**A/B verschränkt** (`ab.mjs`, Läufe abwechselnd A und B, gleiche Last): nachher **höher** (`/de` +325 ms, `/de/kontakt` +165 ms Wand-TBT). Der Vergleich ist aber nicht sauber, weil die neue Kopie auch die Änderungen anderer Pakete seit 16:16 enthält (kontakt, messages, ShopCatalog, Portal …). Der Trace zeigt, wo der Unterschied liegt: Das **erste Layout** ist schwerer (294 → 409 ms). Die Script- und Hydrations-Tasks sind gleich geblieben. Am wahrscheinlichsten ist ein Nebeneffekt der wegfallenden Montserrat-Preloads: Die Hausschriften sind jetzt schon vor dem ersten Layout da. Ohne die Konkurrenz um Bandbreite fällt das teurere Shaping deshalb ins erste Layout statt in einen späteren Font-Swap. Lighthouse zählt diesen Task vor FCP nicht zu TBT, `perf.mjs` dagegen zählt alle Long Tasks. Im selben Lauf sank das LCP mobil auf `/de` von 2056 auf **1700 ms**.

**Fazit:** Unter dieser Last ist ≤ 200 ms weder erreichbar noch belegbar. Nach Plan §„TBT-Budget“ entscheidet der Teamleiter, ob für die Hülle 250 ms gelten. Verbindlich ist die ruhige Schlussmessung von R6-release.

## Prüfung

- `npx eslint` auf alle Paketdateien, Tests und Spec: 0 Befunde.
- Unit: `r6-shell-perf` 8/8, zusammen mit r3-shell, r4-shell, r5-shell-seo, r4-i18n und r4-recht (sha256-Snapshot) **62/62**.
- e2e `tests/e2e/r6-shell-perf.spec.js`, 9 Tests: grün gegen den Prod-Build (:3167) und gegen dev, zusammen mit den Regressionen `r3-shell` und `r4-recht-consent` **27/27** (desktop-Projekt).
- shoot.mjs `selbst/`: 7 URLs × 4 Geräte = 28 Aufnahmen. `/wp-login.php` liefert wie gewollt 404, alle anderen 200, kein Überlauf. Konsolenmeldungen: die erwartete 404-Ressource und 1 × „Router action dispatched before initialization“ auf iPhone `/de`. Die zweite ist eine reine Dev-Meldung beim ersten Laden; im Prod-Build traten keine Fehler auf (Mega-Menü-Probe). Angesehen habe ich: 404 Desktop und iPhone (Bodoni/Instrument), Merkliste Desktop (schärferes Bild), `/de` iPhone, die Ratgeber-Sprachliste Desktop mit Hinweis (`nachher/ratgeber-sprachliste-desktop.png`) und das offene Mega-Menü.
- Logscan: 0 × static-to-dynamic. Die Routentabelle ist gleich bis auf `/[locale]/preview/freigaben` (ƒ, fremdes Paket).
- Gzip-Größe: Das HTML der Seiten wird durch die Panel-Strings um etwa 3,5 KB größer. Dagegen fallen 103 KB Schrift-Preload weg.

## Geänderte und neue Dateien

- `src/app/[locale]/layout.js` (Schriften aus fonts.js), `src/app/[locale]/client-layout.js` (Consent nach Leerlauf), `src/app/not-found.js` (Hausschriften), `src/app/global-error.js` (Kommentar, FONT_VARS dokumentiert), `src/app/globals.css` (nur Kommentar)
- **neu** `src/components/Reusable/fonts.js`, **neu** `src/components/Navbar/megaPanelHtml.js`
- `src/components/Navbar/{DesktopNav,navbar,LanguageSwitcher,shellLabels,shellNav}.js`, `src/components/Reusable/{Footer,singlePageSlider}.js`, `src/components/Cookies/ConsentEmbed.js`, `src/app/[locale]/merkliste/page.js`
- **gelöscht** `src/components/Reusable/FadeInView.js`; dazu den Testfall aus `tests/unit/r4-shell.test.mjs` entfernt (ausdrücklich Teil des Auftrags „samt Testfall“; die Datei steht sonst nicht auf meiner Liste)
- **neu** `tests/unit/r6-shell-perf.test.mjs`, `tests/e2e/r6-shell-perf.spec.js`, `Marktresearch/digital/teamleiter/messages-r6-shell.json`
- Mess-Skripte: `qa-screenshots/teamleiter/r6-shell-perf/{profile,trace,cpu-tbt,css-ab,ab,flight,dom,dom-parts,axe,megamenu}.mjs`

## Offene Punkte

1. **TBT ≤ 200 ms** ist nicht belegt (siehe oben). Schlussmessung durch R6-release auf ruhiger Maschine. Bleibt der Wert über 200, entscheidet der Teamleiter über ein Budget von 250 ms. Weitere Hebel liegen außerhalb der Hülle, zum Beispiel die Größe des Framework-Chunks. Innerhalb der Hülle wären es die Fußzeilen-Linkgruppen (221 Knoten) als Server-HTML wie beim Mega-Menü.
2. **global-error.js:** Ein Import der Schriftobjekte aus `fonts.js` kompiliert im Prod-Build. Auf dem gemeinsamen Dev-Server führte er aber zu einem 500 für alle Seiten, deshalb habe ich ihn sofort zurückgenommen. Die Datei setzt jetzt `--font-bodoni`/`--font-instrument` auf die echten @font-face-Namen von next/font („Bodoni Moda“, „Instrument Sans“). Damit greifen die Hausschriften, sobald deren @font-face im Dokument ist. Beim allerersten Serverfehler ohne Layout-CSS bleiben die Ersatzschriften.
3. **messages-r6-shell.json** (`Shell.header.germanOnlyNote`, 4 Sprachen) muss R6-i18n übernehmen. Bis dahin greift die gleichlautende Ersatztabelle in `shellLabels.js` (t.has).
4. `YouTubeFacade.js` (fremd) kann jetzt `icon`/`title`/`text`/`label` direkt an ConsentEmbed geben, statt einen eigenen NextIntlClientProvider zu verschachteln.
5. Hinweis an die Integration: Während dieser Runde war der gemeinsame Dev-Server zweimal kurz nicht erreichbar (500, jeweils unter 1 min), ausgelöst durch meine Font-Experimente. Beide Male habe ich die Änderung sofort zurückgenommen.
