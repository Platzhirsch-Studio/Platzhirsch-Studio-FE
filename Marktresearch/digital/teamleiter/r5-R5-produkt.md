# R5-produkt: Neutrales Bild statt Fremdfoto, Timeout ≠ 404, Brotkrume, iPhone SE, Galerie-TBT

Stand: 26.10.2026 · Branch `feature/neuauftritt` · nicht committet · keine npm-Installation

## Ergebnis

| Punkt | Ergebnis |
|---|---|
| (1) P1 Fremdfoto | **Behoben.** Erhebung per Skript (nur GET, `qa-screenshots/teamleiter/r5-produkt/count-missing-images.mjs`): **152** aktive Stücke ohne Bild, nicht 124. Davon BvE 111 und Next125 13, dazu 28 weitere: Quasar 13, Minotti 4, Flos 4, Poliform 3, Rimadesio 2, ClassiCon 1, Umbrosa 1. **Vorher** (`fehlende-bilder-vorher.json`): Alle 59 Seiten, die unter Last antworteten, zeigten `fallback-banner.jpg` (Outdoor-Sessel), og:image war das Raumfoto. **Nachher** (`fehlende-bilder-nachher.json`): 150 von 152 mit 200, **0 Fremdfotos, 150 mit neutraler Fläche, 150 mit neutralem OG-Bild, 0 JSON-LD-`image`**. Die 2 übrigen lieferten unter Last einmal 500 und bei der Nachprüfung 200 (siehe P2). Umsetzung: `ShopCatalog/noPhoto.js` (Linie im Token `brass-500`, Fläche `linen`, Hinweis als echter Text, auf der Bühne zusätzlich die Wortmarke), Bühne 3:2, Katalog-Kachel und Kacheln „Das könnte Ihnen gefallen“. OG: neue statische Route `/{locale}/produkte/kein-foto.png`, 1200 × 630, 4 Sprachen, angesehen. Text in `messages-r5-produkt.json`, gelesen über `t.has` mit Fallback in `src/lib/shop/noPhoto.js`. Keine Hersteller-URLs. |
| (2) P2 Timeout ≠ 404 | **Behoben.** Neu ist `src/lib/api/produktDetail.js` (pur, testbar). Live geprüft: Ein unbekannter `path_field` liefert 200 `{}`. `{}`, eine leere message oder 404 ergeben `null` → `notFound()`. Timeout, Netzfehler, 5xx, sonstige 4xx, kaputtes JSON oder eine fremde Nutzlast werfen `BackofficeError` → `error.js`, 500. Gecacht wird nichts: Next legt nur 200 in den Data-Cache (`patch-fetch.js:696`), der In-Flight-Dedupe verwirft Fehlschläge, ISR behält die letzte gute Seite. `generateMetadata` und die Seite werfen gleich. Katalog, Sitemap, Suche und Verwandte behalten `getMessage` mit Fallback `[]` (Test 6). `/sitemap-produkte.xml` 200 mit 7 164 `<loc>`, ein unbekanntes Produkt 404, Katalogseiten 200. Beleg unter Last: 2 Seiten mit einmal 500 statt falschem 404. |
| (3) Brotkrume | `getIndexableBrandCategoryHref(detail.marken, categoryKey, locale)` wird nur importiert. Die eigene Kopie der Regel (`buildBrandCategories`/`withoutNonProducts`) und der zusätzliche Marken-Fetch sind entfernt. Live: „Brand van Egmond Leuchten“, „Minotti Sofas & Couches“, sichtbar und im BreadcrumbList. |
| (4) iPhone SE | **Behoben.** Auf Telefonen unter 600 px Höhe ist die Bühne auf 18svh begrenzt und die einzeilige Brotkrume ausgeblendet. Sie bleibt im JSON-LD, die Links zu Marke und Kategorie stehen in der Overline. Gemessen (`r5-produkt/iphone-se.json`, Screenshots `iphone-se/`), Knopf-Unterkante gegen Banner-Oberkante: 375 × 667 bei 470–517 px gegen ≥ 522, 375 × 568 bei 353–386 px gegen ≥ 423 (DE/IT, 2097-18, ARTHUR, Riley). Vorher bei 568: 442–489 gegen 423, also verdeckt. |
| (5) Galerie-TBT | Embla ist von der Bühne entfernt, stattdessen natives Scroll-Snap. Der Zähler läuft über `onScroll`. Die Lightbox ist ein eigener Chunk (`productLightbox.js`, `next/dynamic`, `ssr:false`), wird bei Hover/Fokus vorgeladen und erst beim Öffnen gemountet. Die Thumbnails erscheinen ab sm nach `requestIdleCallback`, die Höhe ist reserviert. Fokus-Rückgabe, Zoom und reduced motion funktionieren wie vorher (e2e). Die **Messung im Prod-Lauf wird bei R5-release angefordert**: TBT `/de/produkte/lamps` und `/de/produkte/lamps/lamps-2097-18`, mobil, vorher 379 ms. |

## Prüfung

- Unit `tests/unit/r5-produkt.test.mjs`: **13/13 grün**, mit gemocktem `backofficeFetch` (gefunden / nicht gefunden / Timeout / Netz / 5xx / 4xx / JSON) und echtem `backofficeFetch` mit `fetchImpl` (Timeout plus Retry, 503 × 2, `{}`). Dazu r3/r4-produkt und productCopy **43/43**. Gesamtsuite: 596 von 612. Die roten Tests sind Live-Tests gegen den ausgelasteten Dev-Server und Fremdpakete (Karriere, Shell, Regionen, Sitemap), keiner betrifft die Produktdateien.
- e2e `tests/e2e/r5-produkt.spec.js` (desktop, eigener SE-Kontext): **4/4 grün**.
- `npx eslint` auf alle eigenen Dateien: 0. `npm run check:claims`: 0 Verstöße.
- shoot.mjs auf 4 Geräten, Bilder angesehen: `qa-screenshots/teamleiter/r5-R5-produkt/selbst/` (/de/produkte, lamps, sofas-couches, IT lamps: 16 × 200) und `qa-screenshots/teamleiter/r5-produkt/produkt/` (ARTHUR DE/IT, 2097-18 DE/IT, Riley: 20 × 200). Kacheln ohne Foto (Taraxacum, Randoo) sind neutral. 2 Dev-Meldungen auf dem iPhone (Hydration, „Router action before initialization“), zweimal nachgestellt, nicht reproduzierbar.
- Betrieb: Zwischendurch lieferte :3000 überall 500, weil `.next/dev/prerender-manifest.json` beschädigt war (bekannt aus R4). Nach dem Neuschreiben durch den Dev-Server lief alles wieder.

## Dateien

Neu: `src/lib/api/produktDetail.js`, `src/lib/shop/noPhoto.js`, `src/components/ShopCatalog/{noPhoto,productLightbox}.js`, `src/app/[locale]/produkte/kein-foto.png/route.js`, `tests/unit/r5-produkt.test.mjs`, `tests/e2e/r5-produkt.spec.js`, `Marktresearch/digital/teamleiter/messages-r5-produkt.json`, `qa-screenshots/teamleiter/r5-produkt/**`.
Geändert: `src/lib/api/fetchAllProdukte.js`, `src/app/[locale]/produkte/[category]/[product]/page.js`, `src/components/ShopCatalog/{productGallery,catalogTile,shopCatalog}.js`, `Marktresearch/digital/redesign/{katalog,produkte}.md`.

## Offene Punkte

1. **R5-release:** TBT/LCP im Prod-Lauf messen (lamps, 2097-18). Die Route `kein-foto.png` beim Build prüfen (statisch, 4 PNG).
2. **Integrator R6:** `messages-r5-produkt.json` (`shop.atelier.noPhoto`) übernehmen.
3. **Hinweis:** Die Vorschauseiten (`preview/buehne|galerie|dreilaendereck`, fremde Dateien) bekommen bei einem Backoffice-Fehler jetzt `error.js` statt 404. Die Startseiten-Leiste fängt den Fehler weiter selbst ab.
4. **R5-i18n** hat den IT-Satz der Produktseite auf „tu“ umgestellt und `r4-produkt.test.mjs` angepasst (Plan-konform, grün).
5. **Backoffice:** Bilder für 152 Stücke nach Bildfreigabe.

## Nachbesserung nach Teamleiter-Feedback (Note 8/10)

| Punkt | Ergebnis |
|---|---|
| P2-1 axe `scrollable-region-focusable` | **Behoben** in `src/components/ShopCatalog/productGallery.js`. Bei mehreren Fotos hat die Scroll-Bühne `tabIndex=0`, `role="region"` und `aria-label` („Bilder von {Name}“, vorhandener Schlüssel `shop.atelier.galleryLabel`, kein neuer Text). Der äußere Karussell-Container ist dann `role="group"` mit `aria-roledescription="carousel"`, damit es keine zwei Regionen mit gleichem Namen gibt. Bei nur einem Foto bleibt alles wie vorher (äußere Region, kein Scroll-Bereich). Pfeiltasten auf der fokussierten Bühne rufen `preventDefault()` auf, so blättert ein Tastendruck genau ein Bild weiter. Der Fokusring kommt aus der globalen `[tabindex]:focus-visible`-Regel. Ein Fokus auf der Bühne lädt die Lightbox vor. |
| P2-2 TBT-Messung Prod | **Offen, bei R5-release.** Kein `npm run build` im Repo erlaubt. Vorher 379 ms mobil. |

Prüfung:
- e2e `tests/e2e/r5-produkt.spec.js`: neuer Test „Galerie-Bühne per Tastatur erreichbar“. Er prüft Tab-Fokus, ArrowRight → „Bild 2 von 4“, scrollLeft = 1 Bild und axe (wcag2a/aa/21aa/22aa, `main`) mit 0 `scrollable-region-focusable` und 0 serious/critical. **5/5 grün.**
- Unit `tests/unit/r5-produkt.test.mjs` **13/13**, eslint 0.
- shoot.mjs `qa-screenshots/teamleiter/r5-R5-produkt/fix/`: 2097-18 DE/EN und ARTHUR IT auf 4 Geräten, 12 × 200, 0 Konsolenfehler, kein horizontaler Überlauf. Bilder angesehen (iPhone DE, Desktop EN): Die Galerie ist unverändert, der Knopf liegt über dem Banner.
- Den Timeout-Fall habe ich weiterhin nur per Unit-Test geprüft (gemockter Timeout → `BackofficeError`), nicht live.
