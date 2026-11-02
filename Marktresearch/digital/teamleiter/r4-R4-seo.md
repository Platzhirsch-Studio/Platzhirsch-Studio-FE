# R4-seo: Sitemap mit importierten Produkten, llms/Schema-Abgleich, brandCategoryHref, hreflang- und Rich-Results-Prüfung, Marken-Restliste

Stand: 26.10.2026 · Branch `feature/neuauftritt` · nicht committet · Grundlage: runde-4-plan.md (R4-seo), r3-R3-marken-seo.md §5/§8, r3-R3-landing.md P2-3, release-check.md §3.5, redesign/marken.md, Abnahme Marken (Restliste), Feedback R3-marken-seo

## Ergebnis in Kürze

| Punkt | Ergebnis |
|---|---|
| (1) Importierte Produkte | Sie standen **schon vollständig** in `sitemap-produkte.xml`. Brand van Egmond 111/111, Treca 96/96 und Next125 13/13 sind im Backoffice „Produkte New“-Datensätze, also 220 × 4 = 880 URLs. Die IDs aus `src/lib/data/importedProducts/*` („bve-15“, „n125-3“, „treca-1“) sind **keine URLs**. Keine Route rendert diese Datei, deshalb liefern sie 404 und gehören nicht in die Sitemap. Die Lücke in release-check §3.5 ist damit ein Missverständnis. Die Aussage ist jetzt durch einen Kommentar in `sitemapEntries.js`, einen Live-Unit-Test und eine e2e-Prüfung abgesichert. Alle 220 DE-URLs liefern 200 und `index, follow` mit eigenem Canonical. |
| (2) llms Yacht | In `sitemap/extraPages.js` lautet die Zeile jetzt wortgleich wie das JSON-LD: „Aufmaß, Fertigung und Montage übernehmen Bootssattler und Werft; Platzhirsch koordiniert die Termine.“ Live in `/llms.txt` geprüft. |
| (3) Organization/LocalBusiness | Neues Modul `src/lib/seo/siteSchema.js` (Re-Export über `structuredData.js`). Es nimmt Adresse, Telefon, Geo, Social und Öffnungszeiten per Import aus `src/lib/site.js`. Die Markenliste läuft über `isVerifiedDealerBrand` aus `src/lib/legal/claims.js`: `brand` ist nur **ClassiCon**, die übrigen 16 Showroom-Marken stehen neutral unter `knowsAbout`. Keine Marke fällt weg. **Übergabe:** Das Layout gehört R4-shell-perf und muss das Inline-Objekt `siteSchema` in `src/app/[locale]/layout.js` durch `import { siteSchema } from "@/lib/seo/structuredData"` und `<JsonLd data={siteSchema()} />` ersetzen. Bis dahin liefert die Seite noch die alte Liste mit 17 `brand`-Einträgen. |
| (4) brandCategoryHref | `brandCategoryHref(brand, category, locale)` ist schon aus `src/lib/marken/brandCategory.js` exportiert und getestet. **Neu für die Brotkrume von R4-produkt:** `indexableBrandCategoryHref(categories, brand, category, locale)` (rein) und `getIndexableBrandCategoryHref(brandName, categoryKey, locale)` (Server, `brandCategoryLoader.js`). Beide liefern den Pfad nur, wenn die Kombination indexierbar ist, sonst `null`. Dann soll die Brotkrume auf die Markenseite verlinken. |
| (5) Skript-Prüfung | Neu: `src/lib/seo/audit/seoAudit.js` (reine Prüflogik) und `src/lib/seo/audit/crawl.mjs` (Crawler). Lauf gegen :3000 (Bericht `qa-screenshots/teamleiter/r4-seo/audit.json`): **8 083 Sitemap-URLs**, 0 doppelt, 0 lastmod-Fehler. **541 Seiten gecrawlt:** sitemap-static vollständig, je Sitemap eine DE-Stichprobe, alle hreflang-Ziele dieser Stichprobe und alle 220 importierten DE-URLs. Ergebnis: **0 noindex in einer Sitemap, 0 Canonical-Abweichungen, 2 607 hreflang-Paare reziprok mit 0 Fehlern, 0 hreflang-Ziele außerhalb der Sitemaps.** Rich Results: LocalBusiness 481/481, FAQPage 15/15, Product 270/270, BreadcrumbList 398/402 (Befund unten). Status: 60 URLs waren beim ersten Abruf nicht 200 (17 × 404, 43 × 500), bei der Einzel-Nachprüfung lieferten **alle 60 den Status 200** (Last auf dem Dev-Server, siehe Befund 2). Der Crawler prüft solche URLs jetzt automatisch nach (Phase 3, `transient`). |
| (6) Marken-Restliste | Graubalken und Bildreste habe ich auf Index, Minotti und Minotti × Sofas auf 4 Geräten geprüft: kein Graubalken. Der Hero steht im eigenen Format, „Brand van Egmond“ ist einzeilig. Offen bleiben nur Punkte im Backoffice oder in fremden Paketen (unten). |
| Kein SEO-Verlust | Die Baseline vor allen Änderungen liegt in `qa-screenshots/teamleiter/r4-seo/baseline/` (static 55, marken 752, news 112, produkte 7 164). Der Live-Test `r4-seo.test.mjs` vergleicht die Baseline mit dem aktuellen Stand: **0 URLs verloren**, keine doppelte `<loc>`. `DOCUMENTED_REMOVALS` ist leer. |

## Befunde für andere Pakete

1. **R4-produkt (P1): falsches Platzhalterbild.** 124 importierte Produkte haben im Backoffice **kein Bild** (`bild_anhangen: []`), nämlich Brand van Egmond 111 und Next125 13. Die Produktseite zeigt dann ein fremdes Ersatzfoto: Bei der Deckenleuchte „ARTHUR“ ist das ein Outdoor-Sessel (`selbst-nachlauf/de-produkte-lamps-lamps-arthur-ceiling-lamp-round--desktop.png`). Das ist irreführend. Vorschlag: neutrale Fläche ohne Motiv. Die Seiten bleiben in der Sitemap, weil sie 200 und `index` liefern und echte Texte haben. Bilder kommen erst nach Bildfreigabe ins Backoffice, die Hersteller-URLs in `importedProducts/brandVanEgmond.js` sind keine Freigabe.
2. **R4-produkt (P2): 404 bei Backoffice-Timeout.** Die Produktseite ruft `notFound()` auf, wenn `fetchProduktNewByPathField` wegen Timeout `null` liefert. Unter Last lieferten 17 Sitemap-URLs einmal 404, bei der Wiederholung 200. Im Produktivbetrieb kann ein Crawler so einen echten 404 sehen. Vorschlag: Fehler und „nicht gefunden“ unterscheiden, also bei einem Fehler 500 bzw. einen Retry auslösen, nicht `notFound()`.
3. **R4-shell-perf: Breadcrumb ohne `item`.** `UberUns/PageHeader.js` gibt auf `/…/ueber-uns/platzhirsch` (4 Sprachen) die mittlere Stufe „Über uns“ ohne URL aus. Google verlangt dort ein `item`. Vorschlag: die Stufe weglassen oder auf die Seite selbst verlinken.
4. **R4-shell-perf: Layout auf `siteSchema()` umstellen** (siehe (3)).
5. **R4-release:** `check-claims --live` sollte die Stichprobe aus `crawl.mjs` übernehmen (`spreadSample` über `sitemap-produkte`). Für den Schlusslauf gegen `next start` eignet sich `node src/lib/seo/audit/crawl.mjs --base=http://localhost:3100 --all --imported`.
6. **Dev-Konsole (fremd):** Einmalig traten auf: „Element type is invalid … Lazy“ in `Reusable/Footer.js:253` (`FooterGroupsOpen`, während einer Bearbeitung durch R4-shell-perf), Hydration-Warnungen und „state update … not mounted“. In der Nachprüfung mit Playwright auf Pixel 7 und iPhone 15 Pro ergab sich auf Marken und Minotti × Sofas **0 Fehler**.

## Restliste Marken: Stand

| Punkt | Stand |
|---|---|
| 1 Story ohne Bild, 2 „Brand van Egmond“, Graubalken | erledigt (R3), in R4 auf 4 Geräten bestätigt |
| 10 Layout-JSON-LD „exklusiv“ | im Layout nicht mehr vorhanden. `siteSchema()` ist neutral, der Claim-Test (`findClaims`) ist leer. |
| 4 Mobile-Hero, H1 unter dem ersten Bildschirm | Auf der Kombi-Seite steht die H1 auf dem iPhone im ersten Bildschirm. Auf der Markenseite liegt das Bild weiter vor der H1. Das ist eine Designentscheidung, Rückfrage an die Design-Jury. |
| 5 Ton „Minotti live“, „perfekte Proportionen“ | Die Texte stehen im Backoffice (`beschreibung`/`metadata_description`). Laut Auftrag gibt es keinen Backoffice-Eingriff, deshalb auf der CMS-Liste. |
| 7 Produktbilder, 11 Storybilder | Bildregister und Shotliste |
| 8 Fynn, P3-4 Bézier, `tables-alexander`, Rimadesio-Teppiche | Backoffice-Pflege |
| 6 „Antoniolupi“ | Inhaltsentscheidung (`displayBrandName`, fremd) |

## Prüfung

- **Unit:** `node --test tests/unit/r4-seo.test.mjs tests/unit/r3-marken-seo.test.mjs tests/unit/r3-marken-legal.test.mjs tests/unit/brandCategory*.test.mjs tests/unit/sitemap*.test.mjs tests/unit/llms.test.mjs tests/unit/r3-landing.test.mjs` ergibt **84/84 grün**, inklusive der Live-Teile („Kein SEO-Verlust“ und „Importierte Kataloge“).
- **e2e:** `tests/e2e/r4-seo.spec.js` (nur desktop) prüft importierte Produkte, 3 hreflang-Cluster, Rich Results der 4 Typen und die llms-Zeile. Wegen der Last auf dem geteilten Dev-Server habe ich den Lauf nicht gestartet. Das Paket gehört in den Teillauf von R4-release (`--specs=r4-seo`). Die gleiche Logik ist durch den Crawler-Lauf oben belegt.
- **eslint:** alle eigenen Pfade, 0 Meldungen. `npm run check:claims`: 0 Verstöße.
- **shoot.mjs:** `qa-screenshots/teamleiter/r4-R4-seo/selbst/` mit den 6 Auftrags-URLs × 4 Geräten. Dazu der Nachlauf `selbst-nachlauf/` für Marken, Minotti × Sofas und ein BvE-Produkt. Im ersten Lauf gab es 2 Timeouts (Last) und 1 Footer-Fehler (fremd). Im Nachlauf lieferten alle 12 Aufnahmen 200, ohne horizontalen Überlauf. `sitemap-produkte.xml` (1 MB) lässt sich auf dem Desktop nicht als Bild aufnehmen (Chromium-Grenze), auf den 3 anderen Geräten schon.

## Dateien

- **Neu:** `src/lib/seo/siteSchema.js`, `src/lib/seo/audit/{seoAudit.js,crawl.mjs,package.json}`, `tests/unit/r4-seo.test.mjs`, `tests/e2e/r4-seo.spec.js`, `qa-screenshots/teamleiter/r4-seo/{baseline/,audit.json,audit.log}`
- **Geändert:** `src/lib/seo/sitemap/extraPages.js` (Yacht-llms), `src/lib/seo/structuredData.js` (Re-Export), `src/lib/seo/sitemapEntries.js` (nur Kommentar), `src/lib/marken/brandCategory.js` (`indexableBrandCategoryHref`), `src/lib/marken/brandCategoryLoader.js` (`getIndexableBrandCategoryHref`), `Marktresearch/digital/redesign/marken.md` (§9)
- **Unverändert:** alle `sitemap*.xml`-Routen, `robots.js`, `llms.txt/route.js` und die Marken-Komponenten. Keine neuen sichtbaren Texte, deshalb keine `messages-r4-seo.json`.

## Offene Punkte

1. R4-shell-perf: Layout auf `siteSchema()` umstellen und die Breadcrumb in `PageHeader` korrigieren.
2. R4-produkt: Ersatzbild bei Produkten ohne Bild, `notFound()` bei Timeout, Brotkrume über `getIndexableBrandCategoryHref`.
3. Backoffice: Bilder für 124 BvE-/Next125-Produkte (nach Bildfreigabe), CMS-Texte (Ton), Kategoriezuordnungen.
4. Product-JSON-LD hat bewusst kein `offers` und keine Bewertungen. Ein Produkt-Snippet bei Google ist damit nicht möglich (Warnung im Bericht, kein Fehler). Eine Änderung wäre eine Inhaber-Entscheidung (Preise).

## Nachbesserung nach QM-Feedback (26.10.2026)

Grundlage: `qa-screenshots/teamleiter/r4-R4-seo/feedback.md` (Note 8/10, P1 keine, P2 1–4)

| P2 | Stand |
|---|---|
| 4 e2e `r4-seo.spec.js` nicht gelaufen | **Behoben.** Beim ersten Lauf fielen alle 6 Tests durch, und zwar wegen eines Fehlers in der Spec selbst: Ein `test.skip()`-Callback bekommt nur Fixtures, kein `testInfo`, deshalb führte `info.project` zu einem TypeError. Die Projektprüfung steht jetzt in `test.beforeEach(({}, testInfo) => test.skip(…))`. Zusätzlich prüfen „Rich Results“ und „llms.txt“ jetzt ausdrücklich auf Status 200. Vorher hätte eine 500-Antwort des geteilten Dev-Servers als „FAQPage fehlt“ gegolten, so geschehen im zweiten Lauf, als der Dev-Server kurzzeitig auf allen Seiten 500 lieferte. Lauf nach der Erholung: `npx playwright test tests/e2e/r4-seo.spec.js --project=desktop`, **6/6 grün** (31 s, 1 Worker). Bericht: `qa-screenshots/teamleiter/r4-seo/e2e-report/`. Der Teillauf in R4-release bleibt als Gegenprüfung gegen `next start` sinnvoll. |
| 1 Organization-Schema mit 17 `brand` | **Offen, fremdes Paket (R4-shell-perf).** Live gegengeprüft: `/de` liefert weiterhin 17 `Brand`-Einträge. `src/app/[locale]/layout.js` Zeile 65/240 nutzt noch das Inline-Objekt. Die Umstellung bleibt unverändert: `import { siteSchema } from "@/lib/seo/structuredData"` und `<JsonLd data={siteSchema()} />`. |
| 2 404 bei Backoffice-Timeout | Offen, R4-produkt (unverändert übergeben). |
| 3 Fremdes Ersatzfoto bei 124 Produkten | Offen, R4-produkt (unverändert übergeben). |

**Nachprüfung**
- shoot.mjs `qa-screenshots/teamleiter/r4-R4-seo/fix/`: Marken, Minotti, Minotti × Sofas, EN Minotti, `llms.txt` und `sitemap.xml` auf 4 Geräten. Alle 24 Aufnahmen liefern 200, ohne horizontalen Überlauf. Die Screenshots habe ich angesehen: Index, Kombi-Seite und EN-Markenseite sind sauber, der Bildnachweis ist vorhanden, kein Graubalken. 1 Konsolenfehler auf dem iPad (Minotti × Sofas): „Router action dispatched before initialization“, derselbe Dev-Race wie P3-6.
- Unit: `r4-seo`, `brandCategory*`, `sitemap*` und `llms` ergeben **54/54 grün**. eslint auf die Spec: 0 Meldungen.
