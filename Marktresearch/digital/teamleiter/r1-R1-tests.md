# R1-tests: Playwright-Smoke- und Barrierefreiheitstests

Stand: 26.10.2026, Branch `feature/neuauftritt`. Nicht committet, nicht gepusht, nicht deployt. Es wurden keine Formulare abgeschickt.

## Nachbesserung nach Feedback (Note 7/10)

Bezug: `qa-screenshots/teamleiter/r1-R1-tests/feedback.md`. Kein neues Paket installiert.

| Punkt | Status | Umsetzung |
|---|---|---|
| P1 Header-Überlauf 375 px (Team 1) | **behoben durch Team 1** | Nachlauf a11y auf iPhone und Pixel: alle 8 Überlauf-Tests grün. |
| P2.1 Superlativ-Beugung | behoben | `gr(ö\|oe)(ß\|ss)te[nrms]?` (größte/-n/-r/-s/-m), `largest`, `biggest`. Neu: `führend…`/`Marktführer`/`leading`, „Nr. 1“, „der/die einzige … in Vorarlberg/am Bodensee/in Österreich“. Erlaubt: „führender (Design-)Marken“, „leading brands“, „mit größter Sorgfalt“, „le plus grand soin“. Mit Node gegen 15 Beispielsätze geprüft. |
| P2.2 Title/Meta/OG/JSON-LD | behoben | `headText()` in `helpers.js` liest `<title>`, Meta-Description, `og:*`/`twitter:*` und alle Textwerte im JSON-LD (inkl. `@graph`). Fundstellen tragen die Quelle (`[meta description]`, `[json-ld]`). |
| P2.3 veraltete Bekannt-Liste | behoben | Händler- und News-Übersicht-Einträge entfernt. `KNOWN` hat jetzt ein Muster (`match`): Nur genau die bekannte Formulierung wird fixme, jede andere Fundstelle ist rot. |
| P2.4 `/de/kuechen-vorarlberg` index | als Test hinterlegt | `PENDING_NOINDEX` in `seo.spec.js` (fixme, Team 5 / R1-seo). Zusätzlich neuer Test: Keine noindex-Seite darf in einer Sitemap stehen. |
| P2.5 kein Tablet-Projekt | behoben | Projekt `ipad` (iPad Pro 11, WebKit, 834 × 1194) für smoke. |
| P3 | erledigt | README: Unterschied `shoot.mjs` (393/412 px) und Playwright (375 px). Überlauf-Meldung nennt nur äußerste Elemente mit rechter Kante, ohne SVG-Innenleben. `@playwright/test` exakt `1.64.1` (package.json und Lockfile-Root, installierte Version unverändert). Skript `test:e2e:prod` (Standard `http://localhost:3100`, `next start -p 3100`). Offen: axe nach Cookie-Banner-Schließen. |

**Neu gefunden:** Die neue Sammelprüfung aller News-Artikel (`sitemap-news.xml`, 4 Sprachen) findet Superlative, die auf der News-Übersicht nicht sichtbar waren:
- „größte Minotti-Ausstellung Westösterreichs“ in `platzhirsch-home-living-grand-opening`
- „die größte im Umkreis von 500 Kilometern“ bzw. „largest within a 500-kilometer radius“, „la plus grande dans un rayon de 500 km“ und „la più grande nel raggio di 500 km“ in `platzhirsch-unsere-broschuere-2022-ist-da`

Diese Stellen stehen als fixme bei Team 6/7. „bis zu 60 %“ steht in keinem Artikel mehr.

**Läufe (26.10.2026, Dev-Server):**
- legal + seo, Desktop: 152 bestanden, 2 übersprungen (ClassiCon und `kuechen-vorarlberg`-fixme), 1 rot, 1 flaky. Rot war der News-Superlativ, er ist inzwischen als bekannt eingetragen (Nachlauf: 3 grün, 1 fixme). Flaky waren kurzzeitige 500er auf News-Artikeln im Dev-Server, beim Retry grün.
- smoke auf iPad/iPhone/Pixel und a11y auf iPhone/Pixel: 63 bestanden, 5 übersprungen (axe auf iPhone, Kontakt-Kontrast fixme), 1 flaky. Flaky: iPhone `/de/designermoebel-lindau` mit „Can't perform a React state update on a component that hasn't mounted yet“.
- `shoot.mjs` (`qa-screenshots/teamleiter/r1-R1-tests/fix`): `/de`, `/de/kuechen-vorarlberg` und `/de/news` liefern auf allen 4 Geräten 200. iPad `kuechen-vorarlberg` zeigt denselben React-Fehler. Die Screenshots sind sauber, der Header passt auf iPhone.

**Offen für andere Teams:** Der React-State-Fehler tritt sporadisch auf WebKit auf (iPad/iPhone, wechselnde Seiten, also vermutlich im globalen Layout, Cookie-Banner oder Header). Zuständig sind Team 1/2. Die Tests erfassen ihn, das Retry verdeckt ihn aber als „flaky“. Weiter offen: News-Superlative (Team 6/7), noindex `kuechen-vorarlberg` (Team 5), Kontrast Kontakt.

## Ergebnis in Kürze

Das Qualitätsnetz steht: 4 Specs mit insgesamt 228 Testfällen in 3 Geräteprojekten (iPhone/WebKit, Pixel/Chromium, Desktop 1440). Es läuft gegen den laufenden Dev-Server und meldet echte Mängel. Beim letzten Volllauf hat es eine neue Regression im Header gefunden: Auf 375 px ist die Seite 14 px zu breit.

## Installation

- `npm install -D -E @axe-core/playwright@4.13.0` (veröffentlicht am 11.08.2026). Die Abhängigkeit `axe-core` springt dabei von 4.12.1 auf 4.13.0 (veröffentlicht am 05.08.2026, also älter als 14 Tage). Der Grund: `@axe-core/playwright` verlangt `~4.13.0`, und `eslint-plugin-jsx-a11y` (`^4.10.0`) ist damit zufrieden.
- Sonst hat sich in `package.json` und `package-lock.json` nichts verschoben. Geprüft per Diff gegen eine Sicherung: Hinzu kamen nur die devDependency und die 4 Skripte, im Lockfile 17 Zeilen hinzu und 3 geändert.

## Dateien

- `playwright.config.js`: `baseURL` aus `BASE_URL` oder `http://localhost:3000`, kein `webServer`, 2 Worker, 1 Retry. Reporter list und html nach `qa-screenshots/teamleiter/tests-report`, Artefakte nach `qa-screenshots/teamleiter/tests-results`. Die Telefonprojekte führen nur smoke und a11y aus, die übrigen Specs laufen einmal im Desktop-Projekt.
- `tests/e2e/global-setup.js`: Wartet bis zu 3 min, bis `/de` mit 200 antwortet.
- `tests/e2e/helpers.js`: Seitenlisten, Sammler für Konsolenfehler, `settle` (networkidle mit Obergrenze), HTML→Text, Sitemap-Helfer.
- `tests/e2e/smoke.spec.js`, `seo.spec.js`, `legal.spec.js`, `a11y.spec.js`
- `tests/README.md`: Bedienung, Projekte, Specs, Liste der bekannten Befunde (fixme)
- `package.json`: Skripte `test:e2e`, `test:unit`, `check:claims`, `check:nap`

Echte Testseiten (per curl ermittelt): Kategorie `/de/produkte/lamps`, Produkt `/de/produkte/lamps/lamps-2097-18`.

## Läufe gegen den Dev-Server

| Lauf | Dauer | Ergebnis |
|---|---|---|
| 1 (05:52) | 20 min 19 s | 174 bestanden, 33 fehlgeschlagen, 2 flaky, 19 übersprungen. Fast alle Fehler kamen aus der Umgebung: Der Dev-Server lieferte 500 bzw. Build-Fehler-Overlays, weil andere Teams Dateien halb gespeichert hatten (`Upload/ConsentText`, `forms/guard.js`, `Labs/Kuechenplaner/planState.js`, `ShopCatalog/wishlistHeart.js`, `Kuechenplaner.module.css`, `[category]/page.js`). |
| 2 (nach Härtung) | 20 min 50 s | **205 bestanden, 9 fehlgeschlagen, 3 flaky, 11 übersprungen bzw. fixme.** 8 der 9 Fehler sind **echt**: 375-px-Überlauf. 1 Fehler war ein Fehlalarm (FR „entreprises agréées“), die Regel ist inzwischen angepasst. Die 3 flaky Tests waren Konsolenfehler aus Build-Fehlern anderer Teams, beim Retry grün. |
| Nachlauf legal.spec | 2 min 48 s | 113 bestanden. 6 Fehlschläge nur wegen kurzzeitiger 500er auf `/de/kontakt` und `/de/beratung`, beim erneuten Lauf grün. |

Härtung nach Lauf 1: global-setup wartet auf einen gesunden Server, axe schließt das Dev-Overlay `nextjs-portal` aus, die FR/IT-Superlativregel erfasst keine Komparative mehr (Hinweis „texte plus grand“ in der Ansicht „Affichage calme“), und „agréé“ allein zählt nicht mehr als Händler-Behauptung.

## Befunde

1. **Neu und echt:** Horizontaler Überlauf bei 375 px auf `/de`, `/de/produkte`, Produktseite und `/de/kontakt` (iPhone und Pixel). Ursache ist die Aktionsgruppe im Header (`div.flex.items-center.gap-1.md:gap-2` mit Button `min-h-11 min-w-11 … pl-2`), deren rechte Kante bei 389 px liegt. Zuständig ist **Team 1 (Header)**. Lauf 1 war hier noch grün, der Fehler kam also mit dem Neuauftritt.
2. **axe:** `/de`, `/de/produkte` und die Produktseite haben keine serious/critical-Befunde. `/de/kontakt` hat `color-contrast` (serious, 4 Knoten, Gold `#d1b250`), als bekannt eingetragen und fixme.
3. **Claims:** Die Händler-Floskel „Ihr (offizieller) X Händler in Vorarlberg“ stand morgens auf allen 21 DE-Markenseiten. Inzwischen ist sie auf Minotti und auf den übrigen Markenseiten weg, die Tests sind grün (Team 3). Offen sind die News: „größte Minotti-Ausstellung“, „largest within 500 km“ und „bis zu 60 %“. Diese Punkte stehen als fixme bei Team 6/7 und laufen trotzdem mit.
4. **SEO:** Alle Kernseiten haben 1 H1, einen title, ein absolutes canonical, vollständiges hreflang (mehrsprachige Seiten) und parsebares JSON-LD. Labs, Portal, Preview und Adventsabend sind noindex. Die Sitemaps sind wohlgeformt (Index plus 4 Teil-Sitemaps, rund 7.700 URLs), die 20 Stichproben liefern 200.
5. Nebenbefund: `/de/kuechen-vorarlberg` ist laut Kommentar im Code „noindex until the copy is final“, liefert aber `index, follow`. Entscheidung bei Team 5 bzw. R1-seo.

## Offene Punkte

- Grüne Läufe brauchen einen Dev-Server ohne halb gespeicherte Dateien. Für Abnahmen besser gegen `next start` laufen lassen (`BASE_URL=…`), sobald der Integrator gebaut hat.
- Laufzeit rund 21 min im Dev-Server (Kompilierung, 2 Worker). Gegen einen Produktions-Build ist mit deutlich weniger zu rechnen.
- `check:claims` und `check:nap` verweisen auf Skripte von R1-legal.
- Einträge in `KNOWN` bzw. `KNOWN_AXE` löschen, sobald sie behoben sind (die Händler-Einträge für die Markenseiten sind schon jetzt erledigt).
