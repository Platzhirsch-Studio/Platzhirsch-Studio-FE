# R6-produkt-perf: Katalog und Produktseite, Baubericht nach Fix

Stand: 26.10.2026 · Branch feature/neuauftritt (nicht committet) · Antwort auf `qa-screenshots/teamleiter/r6-R6-produkt-perf/feedback.md` (Note 5/10)

## Behoben

### P1-1 Inhalt außerhalb von `<main>` und ohne JS unsichtbar
Ursache: Die angeblich „nie suspendierenden“ `<Suspense fallback={null}>`-Hüllen werden von React 19 trotzdem ausgelagert, weil die Grenzen groß sind. Dadurch landet der Inhalt in `<div hidden id="S:0">` hinter `</main>` und wird erst per Inline-Skript eingesetzt.
Fix: Alle Suspense-Hüllen sind entfernt (Import und Grenze), Kommentar ersetzt in:
- `src/app/[locale]/produkte/page.js`
- `src/app/[locale]/produkte/[category]/page.js`
- `src/app/[locale]/produkte/[category]/[product]/page.js` (beide Grenzen)
- `src/components/MarkenItems/markenitems.js`
- `src/components/BrandCategory/BrandCategoryPage.js`

Unit-Test 3c prüft jetzt das Gegenteil: Keine dieser Dateien enthält Suspense. Test 4 prüft `<ShopCatalog>` direkt in der Seite.

Ohne-JS-Messung im Prod-Build (`r6-produkt-perf/nojs.mjs`, Playwright, JS aus). Werte als Text in main / sichtbare Links in main / H1:

| Seite | vorher (A) | nach Fix (B) |
|---|---|---|
| /de/ueber-uns/marken/minotti | 2919 / 44 / Minotti | 2919 / 44 / Minotti |
| /de/produkte/lamps | 1497 / 29 / Leuchten | 1497 / 29 / Leuchten |
| /it/prodotti | 1326 / 40 | 1326 / 40 / „Catalogo prodotti“ |
| /de/produkte | 1296 / 40 | 1296 / 40 |
| Produkt lamps-2097-18 | 3176 / 20 | 3176 / 20 |
| Minotti × sofas-couches | 1671 / 79 | 1671 / 79 |

Auf keiner Seite gibt es noch ein `div[hidden][id^=S:]`. Im Server-HTML von /de/produkte/lamps stehen in `<main>` 24 Produkt-Links und kein `B:0`. Damit ist der SEO-Stand wieder gleich wie vorher, und der Katalog behält alle Verbesserungen dieser Runde.

### P2
- Dieser Baubericht liegt jetzt vor.
- Prod-Kopie `C:/Users/admin.local/Documents/ph-prod-r6-produkt`: Nach dem Messen habe ich beide Server (:3162/:3163) beendet. Die Junction ist per `rmdir` entfernt, und `node_modules/next` im Repo ist geprüft und intakt. Danach habe ich die Kopie gelöscht.
- `qa-screenshots/teamleiter/r6-produkt-perf/e2e-results/`: Die alten Fehlläufe sind gelöscht. Der neue Lauf ist grün, `.last-run.json` steht auf „passed“.

## Tests

- Unit `tests/unit/r6-produkt.test.mjs`: 13/13 grün.
- E2E `tests/e2e/r6-produkt.spec.js` (Dev, 1 Worker, ohne Retry): **13/13 grün**. Darunter ist auch „Katalog: Server-HTML mit 24 Produkt-Links“, der vorher rot war.
- ESLint auf allen Paketordnern: 0 Meldungen.
- `shoot.mjs` → `qa-screenshots/teamleiter/r6-R6-produkt-perf/fix/`: 5 URLs × 4 Geräte. Alle liefern 200, ohne Überlauf, ohne Konsolenfehler und ohne fehlgeschlagene Requests. Bei der Sichtprüfung (Minotti iPhone, Lamps Desktop, Produkt Android, IT-Hub iPad) sind Hero/H1, Filterleiste, Kacheln, Galerie, Termin-CTA und „Catalogo prodotti“ in Ordnung.

## P1-2 TBT: Messung, Profil, Ursache

Prod-Build der Kopie mit `SERVER=https://backoffice.platzhirsch.studio`. A = Build vor der Runde (`.next-vorher`), B = Build nach dem Fix. Gemessen mit `ab.mjs`: Pixel 7, 4× CPU, 1,6 Mbit/s, 150 ms RTT, abwechselnd A/B, Median aus 5. Rohdaten in `r6-produkt-perf/ab-fix.json`.

| Seite | TBT A | TBT B | LCP A → B |
|---|---|---|---|
| /de/produkte/lamps | 418 | **265** | 1968 → 1520 |
| Produkt lamps-2097-18 | 298 | 302 | 1888 → 1476 |
| /de/produkte | 221 | 217 | 1604 → 1560 |
| Minotti | 234 | 224 | 2024 → 1516 |
| Vergleich /de/impressum (reine Textseite, nicht im Paket) | 312 | 327 | 1588 → 1468 |

Mit dem Fix ist der Rückschritt aus der QA-Messung (Produkt 1028, Hub 475, Minotti 645) verschwunden. B ist überall besser als A oder gleich. Beim Katalog spart B 37 % TBT, beim LCP überall 0,05 bis 0,5 s. CLS ist 0.

**Das Ziel ≤ 200 ms ist nicht erreicht. Mit Paket-Dateien allein ist es auch nicht erreichbar.** Selbst die Impressum-Seite ohne Katalog-Code liegt mit 312–327 ms höher als alle Katalogseiten. Die Profile stehen in `r6-produkt-perf/trace-fix-*.txt`. Die langen Tasks sind auf allen Seiten gleich aufgebaut:

1. Erster Style/Layout/Paint: 75–170 ms UpdateLayoutTree plus 130–210 ms Layout/Paint. Das kommt von globalem CSS und der DOM-Größe der Shell.
2. Die EvaluateScript-Phase von `0x7nqxs5zszlv.js` (235 KB, React-DOM plus Next-Runtime mit `hydrateRoot`) dauert 230–320 ms. Darin steckt die Hydration der gesamten Shell (Navigation, Cookie-Banner, Footer).
3. Nur beim Katalog kommt noch ein Hydrations-Task der Kachelliste dazu (~60–200 ms, `FunctionCall O`, stark schwankend).

Die Teile 1 und 2 sind Shell-Kosten. Sie liegen in `layout.js`, `client-layout.js`, Navbar, Cookie-Banner und `globals.css` und gehören zu R6-shell-perf, nicht zu diesem Paket. Wenn die Shell auf ≤ 150 ms kommt, liegen die Katalogseiten mit dem heutigen Paketstand voraussichtlich im Budget.

## Offen

- TBT ≤ 200 ms (siehe oben): an Shell-Paket übergeben.
- P3 „marchi premium / Premium-Marken“ im Hub-Lead: Abgleich mit dem Claims-Check steht noch aus (Text in `src/lib/seo/shopSeoCopy`, nicht in meinen Dateien).
- P3 Dev-Plakette über „Alle akzeptieren“: betrifft nur Dev.

## Werkzeuge (in `qa-screenshots/teamleiter/r6-produkt-perf/`)
`rebuild.sh`, `ab.mjs`, `trace.mjs`, `profile.mjs`, `nojs.mjs` (neu), `ab-fix.json`, `ab-floor.json`, `trace-fix-*.txt`, `build-nachher.log`, `e2e-results/`.
