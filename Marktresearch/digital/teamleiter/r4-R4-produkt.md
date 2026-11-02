# R4-produkt – AP4-Rest: Downloads, Maßtabelle und JSON-LD, H1 mobil, Rohdaten ohne Superlative, Bildqualität, Kategorie-Aliase, Brotkrume

Stand: 26.10.2026 · Branch `feature/neuauftritt` · nicht committet · keine npm-Installation

## Ergebnis

| Punkt | Ergebnis |
|---|---|
| (1) Downloads | Die Zeilen von `pdf_produkte` haben die Form `{2d, 3d, katalog}`. Laut Erhebung über alle 1 765 Stücke haben 520 Stücke Downloads: 426 × 2d und 415 × Katalog, 3d ist bisher leer. Jede gefüllte Spalte wird ein Link über den `/cmx`-Proxy. Gehostet wird nichts, und es gibt nur PDF. Beschriftung: „Produktdatenblatt (PDF)“ bzw. „Katalog: ‹Dateiname› (PDF)“, ohne Doppel. Vorher wurde nur das erste PDF pro Zeile gezeigt, die Kataloge fehlten. Der Klick ruft `trackEvent("file_download", {file_name, file_extension, link_url, link_text, item_name})` auf (`ShopCatalog/downloadList.js`, Client-Blatt). Der Block „Downloads“ steht jetzt immer da, mit dem Sekundärknopf **„Planungsdaten anfragen“**. Er öffnet `/beratung?produkt=…`, das Formular beginnt mit „Anfrage zu: ‹Marke Modell› – Planungsdaten (Zeichnungen, CAD)“. |
| (2) Maße | Neu ist `src/lib/shop/dimensions.js`. Es liest nur **beschriftete** Werte, rund 20 Formate (W./D./H./SD./SH./AH., Width:/Height:, B/T/H, Ø, mm → cm, kg, Bauteil- und Größengruppen, „Nennmaß + n cm“, „71, 91 oder 121 cm“). Unbeschriftete Angaben („220 x 98 x 74 cm“), abgeschnittene und halb lesbare bleiben **Rohtext**. Die Tabelle ist ein `<table>` mit `th scope=row`, Gruppenzeilen und sr-only-Caption. Abdeckung: 448 von 961 Stücken mit Maßangabe bekommen eine Tabelle, 355 bekommen Maße im JSON-LD. Im JSON-LD steht `width/height/depth` als `QuantitativeValue` (CMT), nur wenn der Wert ohne Gruppe genau einmal vorkommt. `weight` (KGM) kommt aus der Maßangabe oder dem Gewichtsfeld. **Kein `offers`, keine Preise.** |
| (3) H1 mobil | Die Reihenfolge im DOM ist jetzt Overline/H1/Designer → Galerie → Primärknopf. Auf dem Desktop sitzt der Titel in Zeile 1 der rechten Spalte, die Aktionen stehen sticky in Zeile 2. Auf Handys entfallen die Thumbnails, der Abstand über dem Knopf ist enger. Android: H1 und Primärknopf stehen im ersten Bildschirm. iPhone: Die H1 steht oben, der Knopf liegt beim Erstbesuch knapp unter dem Cookie-Banner (ca. 560 px). |
| (4) Bildqualität | `STAGE_QUALITY` sinkt von 90 auf 75. Gemessen am Bildoptimierer bei w=1200 (`perf/bildgroessen.txt`): Flos 2097-18 AVIF 10,2 → 8,1 KB (−21 %), WebP 22,4 → 15,0 KB (−33 %). Silvaris 31,1 → 22,1 KB, Wendingen 26,7 → 17,2 KB. LCP mit `tools/qa/perf.mjs` gegen Dev :3000 (`perf/vorher-q90.json`, `perf/nachher-q75.json`): mobil 15,9 → 12,3 s und 12,7 → 10,9 s. **Die Dev-Werte sind laut Werkzeug nicht aussagekräftig** (TTFB 5–14 s durch Kompilieren). Die belastbare Prod-Messung gehört in den Schlusslauf von R4-release. |
| (5) Rohdaten | 37 Ersetzungsmuster an der Quelle, 120 Stellen in 4 Dateien. Es wurden alle 30 `check:claims`-Funde umgeschrieben, dazu die übrigen „perfect/finest/ultimate/the only one/most …“. **`check:claims` statisch: 0 Funde** (vorher 30). Der Render-Filter bleibt. Hinweis im Kopf von `staticShopProducts.js`: Wenn der Generator neu läuft, kommen die Funde zurück. |
| (6) Aliase | `permanentRedirect` (308) in `produkte/[category]/page.js` für `sofas`, `couches`, `armchairs`, `sideboards`, `chests`, `chaise-longues`, `lounge-furniture` und `loungers`. Regel: Ein Wortteil gilt nur, wenn er in genau einer Live-Kategorie vorkommt. `stools`, `daybeds`, `tables` und `chairs` bleiben 404. Kein Alias ist zugleich ein Marken-Slug. Per curl geprüft: DE/EN/FR/IT 308, `/de/produkte/stools` 404. |
| (7) IT | „Le offriamo consulenza su questo pezzo … per il Suo spazio“ (QM-Fix: siezt wie der übrige Shop) |
| (8) Brotkrume | Home › Produkte › Kategorie › **Marke Kategorie** › Stück, mit `brandCategoryHref` aus `src/lib/marken/brandCategory.js`. Die Funktion existiert dort schon, ein Fallback ist nicht nötig. Die Stufe erscheint nur bei einer **indexierbaren** Marke-×-Kategorie-Seite und steht sichtbar und im JSON-LD. Die Ziele liefern 200 (`/de/ueber-uns/marken/minotti/sofas-couches`, `/en/about-us/brands/eichholtz/lamps`). |

## Prüfung

- `node --test tests/unit/productCopy.test.mjs tests/unit/r3-produkt.test.mjs tests/unit/r4-produkt.test.mjs`: **41/41 grün** (12 neue in `r4-produkt`). R3-Test 10 ist angepasst: Er erwartet jetzt Rohdaten ohne Fund statt „Quelle unverändert“.
- `npx eslint` auf alle eigenen Dateien: 0 Fehler, 0 Warnungen.
- `node tools/checks/check-claims.mjs`: 0 Verstöße (dealer 0, superlative 0), 13 per Allowlist freigegeben.
- Rich-Results (Struktur): `node qa-screenshots/teamleiter/r4-produkt/validate-jsonld.mjs` → **8/8 ohne Fehler**, 4 Sprachen (`jsonld-report.json`). Geprüft werden Product (name/url/image/Brand, QuantitativeValue mit Einheit, kein offers/Preis) und BreadcrumbList (ListItem, Positionen, item-URLs). Hinweis: Ohne offers/review/aggregateRating zeigt Google kein Produkt-Snippet. Das ist so gewollt und auch vorher nicht anders gewesen.
- Screenshots (angesehen), 4 Geräte: Pflicht-URLs unter `qa-screenshots/teamleiter/r4-R4-produkt/selbst/`, 24/24 HTTP 200. Funktionsseiten unter `qa-screenshots/teamleiter/r4-produkt/produkt/` (Silvaris, Wendingen, Riley, IT 2097-18). Abschnitte Maße/Downloads unter `…/abschnitte/`. Einzelne Konsolenmeldungen auf Katalogseiten (Hydration bzw. „state update before mount“) wechseln von Lauf zu Lauf. Es sind Dev-/HMR-Zwischenstände paralleler Pakete (Navbar, Katalog unverändert). Im Nachlauf `selbst/recheck/` blieb noch 1 Dev-Hinweis.

## Dateien

`src/app/[locale]/produkte/[category]/[product]/page.js`, `src/components/ShopCatalog/{productInfoTabs,productGallery,productActions,dimensionDiagram,copy}.js`, `src/components/ShopCatalog/downloadList.js` (neu), `src/lib/shop/{dimensions,downloads}.js` (neu), `src/lib/shop/categoryAliases.js`, `src/lib/data/staticShopProducts.js`, `src/lib/data/importedProducts/{brandVanEgmond,treca,next125}.js`, `tests/unit/r4-produkt.test.mjs` (neu), `tests/unit/r3-produkt.test.mjs`, `Marktresearch/digital/teamleiter/messages-r4-produkt.json` (neu, 4 Sprachen, Fallback `R4_ATELIER` in `copy.js`), `Marktresearch/digital/redesign/{katalog,produkte}.md`, `qa-screenshots/teamleiter/r4-produkt/**`.

## Offene Punkte

1. **R4-release:** LCP vorher/nachher im Prod-Lauf messen (Produktseite Flos 2097-18).
2. **R7/Backoffice:** Maßangaben vereinheitlichen. 183 × „N x N x N cm“ ohne Reihenfolge und 176 Texte ohne Zahl ergeben keine Tabelle. Einige Treca- und Leuchten-Angaben sind mit „…“ abgeschnitten.
3. **GA4:** Wenn die erweiterte Messung „Datei-Downloads“ aktiv ist, wird `file_download` doppelt gezählt. Dann eine der beiden Quellen abschalten (R4-leads/Betrieb).
4. **IT-Ton:** Der vorgegebene Satz „Ti offriamo …“ duzt (auch „il tuo spazio“), die übrige IT-Shop-Kopie siezt („Lei“). Das sollte R4-i18n entscheiden.
5. `messages-r4-produkt.json` in Runde 5 übernehmen.
6. Fällt `sofas` wegen neuer Kategorien `corner-/sleeper-/leather-sofas` weg, wird der Unit-Test rot. So ist es gewollt.

## QM-Fix nach Feedback (26.10.2026, `qa-screenshots/teamleiter/r4-R4-produkt/feedback.md`, Note 8/10)

| Punkt | Status | Umsetzung |
|---|---|---|
| P1 Betrieb (`.next/dev/prerender-manifest.json`) | nicht Paket | Kein zweiter Dev-Prozess, kein Build im Repo. Der Fix-Lauf auf :3000 brachte 24/24 × 200. |
| P2-1 iPhone: Knopf unter dem Cookie-Banner | **behoben** | Nur für Telefone (`< sm`): Die Brotkrume ist einzeilig (Eltern-Stufe › Stück, `crumbs.slice(-2)`). Die volle Brotkrume steht ab sm und bleibt komplett im BreadcrumbList-JSON-LD. Der Abstand oben ist kleiner (pt-2/pt-3, gap-3). Die Bühne bleibt 3:2, ist aber auf `max-h-[28svh]` begrenzt. Die Bildsteuerung hat mt-1. Gemessen mit Playwright und Banner: iPhone 15 Pro, Knopf 453–501 px, Banner ab 506 px (DE) bzw. 527 px (IT). Vorher lag der Knopf bei 584 px. Pixel 7: Knopf 503–551 px, Banner ab 686 px. iPad und Desktop sind unverändert. Einschränkung: Auf dem iPhone SE (568 px) liegt der Knopf weiter unter dem Banner. |
| P2-2 Maßtabelle 448/961 | **teilweise, Datenproblem** | Neu erhoben (`qa-screenshots/teamleiter/r4-produkt/masse-abdeckung.json`, 1 765 Stücke, nur GET): 961 Stücke haben ein Maßfeld, 785 davon mit Zahl. 450 bekommen eine Tabelle, 355 Maße im JSON-LD. Von den 335 Rohtexten sind 294 **ohne Achsen**: 183 × „N x N x N cm“, 48 × „N x N cm“, 36 × „Ø N x N cm“, 27 × Zoll. Dazu kommen abgeschnittene Texte („…“). Eine Zuordnung zu B/T/H wäre erfunden, deshalb bleibt der Parser streng. **Riley hat im Backoffice kein Maßfeld**, 2097-18 nur „67 x 51 cm“. Neu: Zu jedem Rohtext erscheint der Hinweis `atelier.dimensionsUnlabelled` (4 Sprachen), z. B. „Der Hersteller nennt diese Maße ohne Zuordnung zu Breite, Tiefe oder Höhe. Wir klären die Angaben gern für Sie im Studio.“ (deckt auch P3-5 ab). Die Formatliste für die Backoffice-Pflege (R7) steht in der JSON. |
| P2-3 Texte nicht in `src/messages` | **offen, Übergabe** | `src/messages/*` gehört nicht zu diesem Paket. `messages-r4-produkt.json` ist aktualisiert (newTab, dimensionsUnlabelled). Der Fallback `R4_ATELIER` in `copy.js` enthält alle Schlüssel in allen 4 Sprachen, sichtbar fehlt also nichts in FR/IT. Die Übernahme macht R4-i18n bzw. der Integrator. |
| P2-4 IT duzt | **behoben im Paket** | Produktseiten-Fallback: „Le offriamo … il Suo spazio“. Test 12/14 prüft das. **Übergabe:** In `src/messages/it.json` (nicht Paketdatei) duzen noch `shop.atelier.ctaPrimary` („scegli un appuntamento“), `ctaNote` („per il tuo ambiente“) und `interlude3` („il tuo ambiente“), außerdem `Marken.introShowroom` („Ti offriamo“, von r3/r4-i18n-Tests so festgeschrieben). Diese überschreiben den siezenden Fallback in `copy.js`. Entscheidung und Änderung: R4-i18n. |
| P3-1 doppeltes „PDF“ im Linknamen | behoben | `newTab` lautet „öffnet in neuem Tab“ (4 Sprachen). Der Name ist jetzt „Produktdatenblatt (PDF) (öffnet in neuem Tab)“. |
| P3-2 „Katalog: ClassiCon katalog“ | behoben | `readableName` entfernt das Wort Katalog/Catalog… aus dem Dateinamen und schreibt den ersten Buchstaben groß. Ergebnis: „Katalog: ClassiCon (PDF)“. |
| P3-3 GA4-Doppelzählung | offen (Betrieb/R4-leads) | unverändert |
| P3-4 LCP Prod | offen (R4-release) | unverändert |
| P3-5 Rohtext-Hinweis | behoben | siehe P2-2 |

Prüfung nach dem Fix:
- `node --test tests/unit/productCopy.test.mjs tests/unit/r3-produkt.test.mjs tests/unit/r4-produkt.test.mjs`: **43/43 grün**, mit den neuen Tests 13 und 14.
- ESLint auf die geänderten Dateien: 0 Funde.
- `node tools/qa/shoot.mjs qa-screenshots/teamleiter/r4-R4-produkt/fix …` mit 6 URLs (2097-18 DE/IT, Riley, Wendingen, /de/produkte, /de/produkte/sofas-couches) auf 4 Geräten: 24/24 × 200, kein Überlauf, 0 Konsolenfehler. Die Screenshots habe ich angesehen.
- Im gerenderten HTML geprüft: Der Hinweis „ohne Zuordnung“ steht bei 2097-18, „Katalog: ClassiCon (PDF)“ und „(öffnet in neuem Tab)“ stehen bei Wendingen.

Geänderte Dateien in dieser Runde: `src/app/[locale]/produkte/[category]/[product]/page.js`, `src/components/ShopCatalog/{productGallery,copy}.js`, `src/lib/shop/downloads.js`, `tests/unit/r4-produkt.test.mjs`, `Marktresearch/digital/teamleiter/messages-r4-produkt.json`, `qa-screenshots/teamleiter/r4-produkt/masse-abdeckung.json` (neu).
