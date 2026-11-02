# R3-marken-seo: Marke × Kategorie live, Backoffice-Prüfung, Sitemap-Schalter, Filter nach `src/lib/legal`, Marken-Restliste

Stand: 26.10.2026 · Branch `feature/neuauftritt` · nicht committet · Grundlage: runde-3-plan.md, r2-R2-seo.md §2/§5, r1-R1-seo.md §5, redesign/marken.md, Abnahme Marken (Restliste), QA-Feedback R2-seo, Next-Docs `dynamic-routes`, `not-found`, `permanentRedirect`, `generate-metadata`

## Ergebnis in Kürze

| Punkt | Ergebnis |
|---|---|
| (1) Route | `ueber-uns/marken/[title]/[collection]/page.js` löst in fester Reihenfolge auf: **Collection → Kategorie → eindeutiges Kurz-Alias (308) → 404**. Bei einer Kollision gewinnt die Collection. Robots: ab 3 Produkten `index, follow`, darunter, bei Kollision und bei Ausschluss `noindex, follow`. |
| (2) Backoffice | Alle 36 aktiven Marken nur lesend geprüft: 151 Kombinationen, 112 mit ≥ 3 Einträgen. **8 Kombinationen ausgeschlossen** (Liste unten), 1 Nicht-Produkt aus Zählung und Galerie genommen. **104 indexierbare Kombinationen × 4 Sprachen = 416 neue Sitemap-URLs.** |
| Sitemap-Schalter | `BRAND_CATEGORY_SITEMAP_ENABLED = true`. In der Sitemap stehen nur indexierbare Seiten. Alle 104 DE-URLs habe ich einzeln per fetch geprüft: Sie liefern 200 mit `index, follow`. Ein einzelner 500er bei Tuuci war ein Dev-Ausreißer, die Wiederholung lieferte 200. |
| llms.txt | Neuer Abschnitt „Marken nach Kategorie“: 6 Marken (Minotti, Poliform, Rimadesio, Paola Lenti, Flos, ClassiCon) mit je bis zu 4 größten indexierbaren Kategorien, also 21 Links. Die Links haben keine Zahlen und keine Claims, jeder steht auch in der Sitemap (Live-Test). |
| (3) Filter | Neu: `src/lib/legal/manufacturerText.js`. `MarkenItems/showroomText.js` ist nur noch ein Re-Export, damit die Produktseite unverändert läuft. ClassiCon bleibt über `claims.js` (`VERIFIED_DEALER_BRANDS`) ausgenommen. |
| (4) Sitemap-todo | Ist jetzt scharf und grün. R3-landing hat `regionRobots()` eingebaut, Sitemap und Robots stimmen bei allen 13 Regionsseiten überein. |
| (5) Restliste | Minotti-Story ohne Bild, „Brand van Egmond“ und Graubalken sind gelöst (Details unten). |
| Tests | 151/151 grün, 0 todo, inklusive der Live-Teile gegen localhost:3000. eslint auf alle eigenen Dateien: 0 Meldungen. `check:claims` meldet keinen neuen Fund in eigenen Dateien. |

## 1. Route

Datei: `src/app/[locale]/ueber-uns/marken/[title]/[collection]/page.js`. Die Route gilt für alle 4 Sprachen über `src/proxy.js`.

- **Reihenfolge:**
  1. `loadCollectionPage`
  2. `getBrandCategoryPageData`
  3. `getBrandCategoryAlias`, das `permanentRedirect` auslöst
  4. `notFound()`

  `generateMetadata` folgt derselben Reihenfolge. Beide Loader sind mit React `cache()` versehen.
- **Alias** (`findBrandCategoryAlias` in `src/lib/marken/brandCategory.js`):
  - Es zählt nur ein eindeutiges Präfix, zum Beispiel `sofas` → `sofas-couches` und `armchairs` → `armchairs-stools`.
  - Ist das Präfix mehrdeutig, etwa `garden`, oder unbekannt, folgt 404.
  - Grund für den Alias: Die Prüf-URLs `/…/minotti/sofas` aus dem Auftrag, die sonst 404 geliefert hätten.
- **Interne Links:** Die Kategorieliste der Markenseite (`markenitems.js`) verlinkt indexierbare Kombinationen auf die neue Seite. Die übrigen Kombinationen verlinken weiter auf `/produkte/<kat>?marke=`.

**curl-Nachweis** (localhost:3000):

| URL | Status | robots / Ziel |
|---|---|---|
| `/de/ueber-uns/marken/minotti/sofas-couches` | 200 | `index, follow`, Canonical auf sich selbst |
| `/de/ueber-uns/marken/minotti/sofas` | 308 | → `/de/ueber-uns/marken/minotti/sofas-couches` |
| `/en/about-us/brands/minotti/sofas` | 308 | → `/en/about-us/brands/minotti/sofas-couches` |
| `/de/ueber-uns/marken/minotti/mirrors` (2 Produkte) | 200 | `noindex, follow` |
| `/de/ueber-uns/marken/101-copenhagen/lamps` (ausgeschlossen) | 200 | `noindex, follow` |
| `/de/ueber-uns/marken/minotti/xyz` | 404 | `noindex` |
| `/de/ueber-uns/marken/alonpi/alonpi-heritage` (Collection) | 200 | `index, follow`, unverändert |
| `/de/ueber-uns/marken/minotti` | 200 | `index, follow`, unverändert |

## 2. Backoffice-Prüfung (nur lesend)

- **Quelle:** `get_produkte_by_marke_api`, `get_collections`, `get_all_kategorien_api` auf backoffice.platzhirsch.studio, 36 Marken, 1.765 Einträge.
- **Ablage:** Die Ausschlussliste steht mit Grund und Datum in `src/lib/marken/brandCategoryAudit.js`.
- **Wirkung:** `buildBrandCategories` liest die Liste. Robots, Sitemap, llms.txt und interne Links entscheiden deshalb gleich.

**Ausgeschlossen** (Seite bleibt erreichbar, aber noindex und nicht in der Sitemap):

| Marke | Kategorie | Einträge | Grund |
|---|---|---|---|
| 101 Copenhagen | lamps | 20 | eine Familie (Drop Chandelier in Farben/Größen + Deckenplatte) |
| 101 Copenhagen | decor | 20 | Baburu Bowl/Brick Candle Holder in Farben + Brand Book |
| 101 Copenhagen | dining-chairs | 6 | 2 Modelle |
| 101 Copenhagen | armchairs-stools | 4 | 1 Modell |
| 101 Copenhagen | kitchen-accessories | 4 | Buttermesser, Stäbchenhalter, Tasse |
| 101 Copenhagen | side-tables | 3 | 1 Modell |
| 101 Copenhagen | small-furniture | 3 | 2 Modelle |
| Rimadesio | rugs | 3 | genau an der Schwelle, Teppich-Zuordnung fraglich |

**Nicht-Produkt:** Der Eintrag `kitchen-the-modern-kitchen-in-a-period-property` (Next125) ist ein Referenzbeitrag. Er zählt nicht und erscheint nicht in der Galerie. Next125 Küchen bleibt mit 12 Einträgen indexierbar.

**Geprüft und belassen:**

- **Minotti decor (24):** Plaids, Kissen und Tabletts, die Kategorie stimmt.
- **Rimadesio armchairs-stools (6):** Die Sitzmöbel Ascot, Sinua, Nest und Wabi sind plausibel.
- **Treca beds (80):** Bettsystem mit Kopfteilen, Füßen und Matratzen.
- **Minotti sofas-couches:** Die Kategorie stimmt. `tables-alexander`, `tables-coupe-tables`, `tables-tape-tables` und weitere sind Sofas mit falschem **Produkt-Slug-Präfix** und Namenszusatz „(Tables)“. Das betrifft die Produkt-URLs, nicht die Kombination. Bereinigung im Backoffice: siehe offene Punkte.

## 3. Filter in `src/lib/legal`

`src/lib/legal/manufacturerText.js` ist ein reines Modul und mit Node testbar. Es exportiert:

- `sanitizeManufacturerText(text, { brand })`: Entfernt Superlative, Händler- und Liefersätze satzweise in DE, EN, FR und IT. Bei ClassiCon bleiben die Händlersätze stehen.
- `cleanProse(text, { allowDealer, dropDelivery })`, `leadProse`, `cleanCraftEntries`, `resolveShowroomText`, `hasVoiceViolation`, `hasDealerWording`, `hasDeliveryClaim`, `auditManufacturerText` (liefert den Grund je Satz), `isVerifiedDealer`, `sentences`, `NEUTRAL_TEXT`.

Was sich gegenüber vorher ändert:

- `hasVoiceViolation` erkennt jetzt auch die Superlative des Claim-Guards, etwa einzigartig, größte, unique, Nr. 1, le plus grand und unico. Feste Wendungen wie „pièce unique“ und „pezzo unico“ bleiben erlaubt.
- Die Liefer- und Verfügbarkeitsmuster stammen aus der Produktseite und sind auf 4 Sprachen erweitert. Die Markenseite wendet sie im Hero-Lead und in der Meta- und JSON-LD-Beschreibung an.

Importe:

- `markenitems.js` und `brandData.js` importieren direkt aus `@/lib/legal/manufacturerText`.
- `showroomText.js` exportiert dieselben Funktionen weiter. Das alte `hasDealerClaim` ist dort ein Alias für `hasDealerWording`.
- **Für R3-produkt:** Am besten `sanitizeManufacturerText(text, { brand: marke.name1 })` aus `@/lib/legal/manufacturerText` verwenden. Das ersetzt `cleanProse` und die eigene `AVAILABILITY_CLAIM`-Regex.

## 4. Sitemap und Robots der Regionsseiten

- Das todo in `tests/unit/sitemap.test.mjs` ist entfernt. Der Test läuft jetzt und ist grün: Kempten, Bregenz, Ravensburg und weitere stehen auf `noindex, follow`, Rheintal und Konstanz auf `index, follow`.
- `sitemap-r2.test.mjs`: Der Schalter-Test erwartet jetzt `true`. Der Live-Test prüft, dass Minotti Sofas in 4 Sprachen gelistet ist und `minotti/mirrors` nicht.
- **Sitemaps per curl:**
  - unverändert: static 55, news 112, produkte 7164
  - marken: 336 → **752** (+416 = 104 × 4), keine doppelte `<loc>`
  - Index: 200
- `robots.txt` ist unverändert, 200.

## 5. Restliste

1. **Minotti-Story ohne Bild:** Der Text steht bündig auf den Spalten 1–7, das Zitat rechts auf den Spalten 9–12 als Gegengewicht. Der Abschnitt hat `py-12 md:py-16` statt `md:py-section`. Belegt in `selbst/minotti--desktop--story.png`. Mit Storybild, etwa bei ClassiCon, bleibt das Layout unverändert.
2. **„Brand van Egmond“:** Namen mit mehr als 14 Zeichen werden ab `sm` in 32 px gesetzt, das Minimum von `display-m`. Auf iPad und Desktop steht der Name jetzt einzeilig und auf derselben Grundlinie (`selbst/de-ueber-uns-marken--ipad.png`).
3. **Graubalken:** Das Hero-Bild der Marke × Kategorie-Seite steht jetzt im eigenen Seitenverhältnis (per `probeImageSize`, geklemmt auf 4:5 bis 16:9) auf `linen` statt in einem festen 3:2-Rahmen. Gewählt wird das erste Querformat unter den ersten 4 Bildern. Ein Bildnachweis ist vorhanden.

## 6. Prüfung

- **shoot.mjs:** `qa-screenshots/teamleiter/r3-R3-marken-seo/selbst/`, 8 URLs × iPhone, Android, iPad und Desktop. Alle liefern 200, keine hat horizontalen Überlauf. Die Bilder habe ich angesehen.
  - 2 Konsolenmeldungen auf dem iPad („Can't perform a React state update on a component that hasn't mounted yet“), bei `minotti/sofas` und bei der Collection.
  - Die Seiten dieses Pakets sind Server-Komponenten ohne eigenes Client-JS. Die Meldung ist identisch mit Abnahme-Restliste 3 und kommt aus einer fremden Client-Komponente (Header oder Cookie-Banner).
- **Tests:** `node --test tests/unit/r3-marken-seo.test.mjs tests/unit/r3-marken-legal.test.mjs tests/unit/brandCategory*.test.mjs tests/unit/sitemap*.test.mjs tests/unit/llms.test.mjs tests/unit/claims*.test.mjs tests/unit/nap.test.mjs tests/unit/productCopy.test.mjs` ergibt **151/151**.
- **eslint:** Alle eigenen Pfade, 0 Meldungen.
- **Messages:** Es gibt keine neuen sichtbaren Texte. `messages-r3-marken.json` ist deshalb leer und nur mit einem Hinweis versehen. Die Texte der Seite stehen in `messages-r2-seo.json` (`brandCategory`).

## 7. Dateien

- **Neu:**
  - `src/lib/legal/manufacturerText.js`
  - `src/lib/marken/brandCategoryAudit.js`
  - `tests/unit/r3-marken-seo.test.mjs`
  - `tests/unit/r3-marken-legal.test.mjs`
  - `Marktresearch/digital/teamleiter/messages-r3-marken.json`
- **Geändert:**
  - `src/app/[locale]/ueber-uns/marken/[title]/[collection]/page.js`
  - `src/components/MarkenItems/{showroomText,brandData,markenitems}.js`
  - `src/components/MarkenClient/Marken.js`
  - `src/components/BrandCategory/BrandCategoryPage.js`
  - `src/lib/marken/{brandCategory,brandCategoryLoader,brandCategoryPage}.js`
  - `src/lib/seo/sitemap/{brandCategorySitemap,brandCategoryEntries}.js`
  - `src/lib/seo/llms.js`
  - `src/app/llms.txt/route.js`
  - `tests/unit/{sitemap,sitemap-r2}.test.mjs`
  - `Marktresearch/digital/redesign/marken.md` (§8)
- **Unverändert:** `robots.js`, die `sitemap*.xml`-Routen und `src/lib/content/brands.js`.

## 8. Offene Punkte

1. **Backoffice (Shop-Team):**
   - Produkt-Slugs mit falschem Präfix korrigieren, zum Beispiel `tables-alexander` bei einem Sofa. Dabei 301-Weiterleitungen für die Produkt-URLs anlegen (R3-produkt bzw. `legacyProductRedirects`).
   - Die Namenszusätze „(Tables)“ und „(Variant)“ entfernen.
   - Klären, ob es Rimadesio-Teppiche gibt.
   - Den Next125-Referenzbeitrag als eigenen Inhaltstyp anlegen statt als Produkt.
   - Danach die Ausschlussliste anpassen.
2. **R3-produkt:** Auf `sanitizeManufacturerText` umstellen (siehe §3). Der Re-Export bleibt bis dahin bestehen.
3. **R3-i18n / Runde 4:** `messages-r2-seo.json` übernehmen (`brandCategory`). Bis dahin greift die Rückfallebene im Modul.
4. **Fremd:** Die iPad-Konsolenmeldung aus der Client-Shell. „Antoniolupi“ in `displayBrandName`: Die Datei gehört mir, die Schreibweise ist aber eine Inhaltsentscheidung, deshalb unverändert.

## Nachbesserung nach QA-Feedback (26.10.2026)

Ausgangslage: Note 9/10, keine P1/P2 (`qa-screenshots/teamleiter/r3-R3-marken-seo/feedback.md`). Folgende P3 habe ich in eigenen Dateien behoben:

| P3 | Status | Änderung |
|---|---|---|
| 3 Doppelte Überschrift H1/H2 | behoben | Galerie-H2 nutzt neuen Schlüssel `brandCategory.piecesTitle` („Alle Stücke“ / „All pieces“ / „Toutes les pièces“ / „Tutti i pezzi“) in `src/lib/marken/brandCategoryCopy.js`, `BrandCategoryPage.js`. Für den Integrator in `messages-r3-marken.json`. Bis zum Merge greift der Fallback aus dem Modul. |
| 2 Live-Test instabil (500) | behoben | `tests/unit/r3-marken-seo.test.mjs`: Live-Helfer `get()` wiederholt einen 5xx einmal nach 2 s. |
| 1 Doppelter 308 auf EN | offen | Der erste Sprung (`/en/ueber-uns/…` → `/en/about-us/…`) kommt aus `src/proxy.js` (nicht mein Paket). Vorschlag an den Integrator: Proxy übersetzt den Pfad und löst Kurz-Aliase in einem Schritt auf. |
| 4 Bézier unter „Sessel & Hocker“ | offen | Backoffice-Pflege, gehört zu den offenen Backoffice-Punkten. |
| 5 R3-produkt → `sanitizeManufacturerText` | offen | Fremdes Paket. `showroomText.js` re-exportiert weiterhin, die Produktseite ist dadurch schon gefiltert. |

**Tests:** `brandCategoryPage.test.mjs` prüft jetzt r2- und r3-Messages zusammen gegen das Modul. 137/137 grün (r3-marken*, brandCategory*, sitemap*, llms*, claims*, nap*), inklusive der Live-Teile. eslint auf geänderte Dateien: 0 Meldungen.

**Prüfwerkzeug** (`qa-screenshots/teamleiter/r3-marken-seo/fix/`): 4 URLs (Minotti × Sofas DE/EN, Minotti, ClassiCon) × 4 Geräte, alle 200 und ohne horizontalen Überlauf. Eine einmalige Dev-Warnung von React („state update on a component that hasn't mounted“) trat nur auf ClassiCon/iPhone auf. Der Nachlauf in `fix-classicon/` ergab auf allen 4 Geräten 0 Fehler. In den Screenshots ist die H2 jetzt „Alle Stücke“. Die EN-Seite und der ClassiCon-Kopf sind sauber.
