# R2-seo: Marke × Kategorie als Seitenkomponente, Ratgeber und Landingpages an Sitemap und llms.txt

Stand: 26.10.2026 · Branch `feature/neuauftritt` · nicht committet · Grundlage: runde-2-plan.md (Schnittstelle „Marke × Kategorie“), r1-R1-seo.md §5, r1-R1-ratgeber.md, redesign/marken.md, redesign/fundament.md, Design-Bibel §10.2, Next-16-Guide `generate-metadata.md`

## Ergebnis in Kürze

| Punkt | Ergebnis |
|---|---|
| Seitenkomponente | `BrandCategoryPage` ist eine Server-Komponente ohne Client-JS. Sie nutzt nur `ui`-Bausteine im Stil der neuen Markenseiten und hat folgenden Aufbau: Kopf mit Text neben dem Bild, Faktenzeile, Galerie, weitere Kategorien, CTA-Band und Rechtshinweis. |
| Loader | `getBrandCategoryPageData(brand, category, locale)` liefert die Daten oder `null`, dann folgt ein 404. Die Daten kommen nur lesend aus dem Backoffice. `cache()` verhindert, dass Metadaten und Seite die Daten doppelt laden. |
| Metadaten | Ab 3 Produkten gilt `index,follow`. Darunter und bei einer Kollision mit einer Collection gilt `noindex,follow`. Canonical zeigt auf die Seite selbst, hreflang wie bei den Markenseiten (`hreflangLanguages`, inkl. x-default und -CH). |
| JSON-LD | Ein `@graph` mit CollectionPage, BreadcrumbList (4 Ebenen) und ItemList (absolute Produkt-URLs). |
| Einleitung | Besteht nur aus belegten Daten: Marke, Kategorie, Anzahl und der neutrale Satz zur Ausstellung in Lochau. Jeder Satz läuft durch `sanitizeClaims` und `findClaims` aus `src/lib/legal/claims.js`. |
| Vorschau | `/[locale]/preview/marke-kategorie/[brand]/[category]` ist nur in Dev aktiv oder mit `BRAND_CATEGORY_PREVIEW=1` bzw. `ERROR_PREVIEW=1`, sonst 404. Die Seite ist immer `noindex,nofollow` und hat weder Canonical noch hreflang. |
| Sitemap | `getBrandCategoryEntries()` ist eingebunden, aber hinter `BRAND_CATEGORY_SITEMAP_ENABLED = false`. Ratgeber kommen nur über `getIndexableRatgeber()` in die Sitemap. Diese Funktion liefert heute `[]`, deshalb ändert sich nichts. |
| llms.txt | Neu sind 4 `LANDING_PAGES`, die `passesDoorwayAudit()` bestehen: Küchen, Wohnzimmer, Interior Design und Möbel Bodensee. **Impressum und Datenschutz sind raus**, weil beide noindex sind. Ratgeber kommen nur über `getIndexableRatgeber()`. Die Formulierungen im Kopf sind entschärft: ohne „exklusive“, „Premium“ und „geführten“. |
| Kein SEO-Verlust | Die Sitemaps habe ich per curl vor und nach der Änderung verglichen. Die `<loc>`-Mengen sind identisch (static 55, marken 336, news 112, produkte 7164, Index 4), die Dateigrößen ebenfalls. `robots.txt` ist unverändert. |
| Tests | 4 Dateien mit 29 Tests, alle grün, live-Teile inklusive. Die bestehenden Tests in `sitemap.test.mjs` sind grün bis auf 1 todo aus R1 (Robots der Regionsseiten). eslint auf alle eigenen Dateien: 0 Meldungen. |

## 1. Dateien

Neu:
- `src/components/BrandCategory/BrandCategoryPage.js` (Server-Komponente, `basePath`-Prop für Vorschau-Links)
- `src/lib/marken/brandCategoryLoader.js` (server-only: `getBrandCategoryPageData`, `generateBrandCategoryMetadata`, `getBrandCategoryTranslator`)
- `src/lib/marken/brandCategoryPage.js` (rein: `buildBrandCategoryIntro`, `buildBrandCategoryMetadata`, `buildBrandCategoryJsonLd`, `brandCategoryRobots`, `brandCategoryUrl`)
- `src/lib/marken/brandCategoryCopy.js` (Locale-Modul DE/EN/FR/IT, Namespace `brandCategory`, ICU-Plural, `makeBrandCategoryTr`: Messages zuerst, sonst Modul)
- `src/lib/seo/sitemap/brandCategorySitemap.js` (Schalter + reine `toBrandCategoryEntries`)
- `src/lib/seo/sitemap/ratgeber.js` (`toRatgeberEntries`, `ratgeberLlmsSection`, nur `freigegeben: true`)
- `src/lib/seo/llms.js` (reiner Aufbau von /llms.txt)
- `src/app/[locale]/preview/marke-kategorie/[brand]/[category]/page.js`
- `tests/unit/brandCategoryPage.test.mjs`, `tests/unit/sitemap-r2.test.mjs`, `tests/unit/llms.test.mjs`
- `Marktresearch/digital/teamleiter/messages-r2-seo.json` (31 Schlüssel × 4 Sprachen, identisch mit dem Modul, per Test geprüft)

Geändert:
- `src/lib/seo/sitemapEntries.js` (Ratgeber-Block in `getStaticEntries`, Schalterblock in `getBrandEntries`)
- `src/lib/seo/sitemap/brandCategoryEntries.js` (nutzt jetzt `toBrandCategoryEntries`)
- `src/app/llms.txt/route.js` (baut über `buildLlmsTxt`)

Unverändert: `robots.js`, alle `sitemap*.xml/route.js`.

## 2. Einbau-Anleitung für Runde 3: `ueber-uns/marken/[title]/[collection]/page.js`

Reihenfolge: **zuerst die Collection, dann die Kategorie, sonst 404.** Hat eine Kategorie denselben Slug wie eine Collection derselben Marke, gewinnt die Collection. `buildBrandCategories` markiert solche Fälle als `collision`. Sie sind nie indexierbar und kommen nicht in die Sitemap, die Kategorie-Seite ist dann schlicht nicht erreichbar. Heute gibt es keine Kollision, weil `get_collections` für die geprüften Marken leer ist.

```js
import { notFound } from "next/navigation";
import CollectionDetail from "@/components/MarkenItems/collectionDetail";
import BrandCategoryPage from "@/components/BrandCategory/BrandCategoryPage";
import { loadCollectionPage, buildCollectionMetadata } from "@/lib/marken/collectionPage";
import { getBrandCategoryPageData, generateBrandCategoryMetadata } from "@/lib/marken/brandCategoryLoader";

export async function generateMetadata({ params }) {
  const { locale, title, collection } = await params;
  if (await loadCollectionPage(title, collection, locale)) return buildCollectionMetadata(locale, title, collection);
  return generateBrandCategoryMetadata(title, collection, locale);
}

export default async function CollectionPage({ params }) {
  const { locale, title, collection } = await params;
  const data = await loadCollectionPage(title, collection, locale);
  if (data) return <CollectionDetail marke={data.marke} collection={data.collection} products={data.products} otherCollections={data.otherCollections} locale={locale} />;
  const bc = await getBrandCategoryPageData(title, collection, locale); // null → 404
  if (!bc) notFound();
  return <BrandCategoryPage data={bc} locale={locale} />;
}
```

Danach in derselben Änderung:
1. In `src/lib/seo/sitemap/brandCategorySitemap.js` `BRAND_CATEGORY_SITEMAP_ENABLED = true` setzen. Den Test „switch is OFF“ in `tests/unit/sitemap-r2.test.mjs` auf `true` drehen und den Live-Test anpassen.
2. Die messages aus `messages-r2-seo.json` übernehmen (i18n-Paket). Das Modul greift so lange als Fallback.
3. Optional (Paket Marken): Die Kategorieliste der Markenseite (`catalogHref` in `brandData.js`) für indexierbare Kombinationen auf `brandCategoryHref` umstellen. Das bringt interne Links auf die neuen Seiten.
4. Nachprüfen per curl: `/de/ueber-uns/marken/minotti/sofas-couches` liefert 200 mit `index, follow`, `/de/ueber-uns/marken/minotti/mirrors` liefert 200 mit `noindex, follow`, ein unbekannter Slug liefert 404. Bestehende Collection-URLs, etwa `/de/ueber-uns/marken/alonpi/alonpi-heritage`, liefern unverändert die Collection.

## 3. Prüfung

- **Vorschau per curl:** Minotti/sofas-couches liefert auf DE und EN 200, `noindex, nofollow`, keinen Canonical und als H1 „Sofas & Couches von Minotti“ bzw. „Minotti Sofas & Couches“. Der Hinweisstreifen meldet „robots dort: index, follow · 62 aktive Produkte“. Minotti/mirrors (2 Produkte) meldet „noindex, follow“. Ein unbekannter Slug oder eine unbekannte Marke liefert 404.
- **Sitemap vorher und nachher:** Beide Male habe ich alle 5 Dateien per curl abgerufen. Die `<loc>`-Mengen sind sortiert verglichen identisch, die Größen ebenfalls.
- **noindex-Kontrolle:** Alle 57 URLs aus `/llms.txt` und alle 55 aus `/sitemap-static.xml` liefern 200 mit `index, follow` und einem Canonical auf sich selbst. Vorher standen in llms.txt 2 noindex-Seiten, Impressum und Datenschutz.
- **Screenshots:** `qa-screenshots/teamleiter/r2-R2-seo/selbst/` (3 URLs × iPhone, Android, iPad und Desktop, alle 200, kein horizontaler Überlauf). Nach dem ersten Lauf habe ich nachgebessert:
  - Das Hero-Bild (Herstellerbild, Querformat) steht jetzt im Format 3:2 statt 4:5. Vorher gab es große Leerflächen.
  - Auf dem Handy steht die H1 vor dem Bild.
  - Die ersten 24 Modelle sind sichtbar, die übrigen liegen in `<details>` „Alle 55 Modelle zeigen“ und bleiben im HTML. Die Desktop-Seite ist dadurch 9.013 statt 15.540 px lang.
  - Leere Kacheln im Full-Page-Bild kommen vom Lazy-Loading der Aufnahme, nicht von der Seite.
  - Konsolenmeldungen gab es nur im ersten Lauf: „Router action dispatched before initialization“ (Dev/HMR).
- **Tests:** `node --test tests/unit/brandCategory.test.mjs tests/unit/brandCategoryPage.test.mjs tests/unit/sitemap-r2.test.mjs tests/unit/llms.test.mjs` ergibt 29/29. `tests/unit/sitemap.test.mjs` ergibt 10 grün und 1 todo.

## 4. Zahlen und Formulierungen

- **Eine Zahl auf der Seite (QA P2-2, behoben):** Einleitung, Faktenzeile, Meta-Description, Galerie-Kopf, Details-Button und ItemList nennen jetzt alle die Modellzahl der Galerie (Minotti Sofas: „55 Modelle“, `brandCategoryModelCount()`). Auch die Zahlen bei „Weitere Kategorien“ sind Modellzahlen. Die Zahl der Katalogeinträge (62) entscheidet nur intern über die Indexierbarkeit und steht nur im Dev-Hinweisstreifen der Vorschau.
- **Kategorie-Namen** kommen aus `get_all_kategorien_api` (`name_de/en/fr/it`), die URL bleibt beim englischen Slug.
- **Keine Aussage** darüber, welche Stücke in der Ausstellung stehen. Es gibt nur die Formel „Minotti in unserer Ausstellung in Lochau“ (Eyebrow im CTA-Band) und „Beratung … in Lochau“.

## 5. Offene Punkte

1. **Runde 3:** Route anschließen und Schalter umlegen (Abschnitt 2), Messages übernehmen.
2. **Backoffice-Kategorien prüfen**, bevor der Schalter umgelegt wird (aus R1): z. B. Rimadesio `armchairs-stools`, Minotti `decor`. Sonst entstehen dünne oder falsche indexierte Seiten.
3. **Ratgeber:** Freigabe pro Artikel (`reviewedBy`, `freigegeben: true`). Sitemap und llms.txt nehmen die Artikel dann ohne weitere Änderung auf, den Hub ebenso.
4. **llms.txt (QA P2-3, behoben):** „Lieferung und Montage in ganz Österreich“ ist ersetzt durch „Lieferung und Montage auf Anfrage“. Ein Liefergebiet nennen wir erst nach Bestätigung durch die Geschäftsführung. „über 35 Marken“ ist durch 36 aktive Marken im Backoffice gedeckt.
5. **Aus R1, nicht dieses Paket:** Regionsseiten unter dem Audit stehen noch auf `index` (Regionen-Paket, `regionRobots`). Der Cookie-Banner sagt „ein gutes Nutzererlebnis“, das ist jetzt ohne Superlativ und in Ordnung.
6. Der Hinweisstreifen der Vorschau ist bewusst nur deutsch. Er ist dev-only und nie öffentlich.

## 6. Nachbesserung nach QA (Note 8/10)

Feedback: `qa-screenshots/teamleiter/r2-R2-seo/feedback.md`. Prüfung: `qa-screenshots/teamleiter/r2-R2-seo/fix/` (DE/EN × iPhone, Android, iPad, Desktop: 8 × 200, kein Überlauf, keine Konsolenfehler).

| Punkt | Stand |
|---|---|
| P2-1 Meta-Title „Ausstellung Lochau“ | **Behoben.** DE „– Beratung in Lochau“, EN „– Advice in Lochau“, FR „– Conseil à Lochau“, IT „– Consulenza a Lochau“, in `brandCategoryCopy.js` und `messages-r2-seo.json`. Live-Title: „Minotti Sofas & Couches – Beratung in Lochau | Platzhirsch“. |
| P2-2 „62 Stücke“ / „55 Modelle“ | **Behoben.** Sichtbar und in der Meta-Description nur noch „55 Modelle“ (Texte in allen 4 Sprachen von Stück/piece/pièce/pezzo auf Modell/model/modèle/modello umgestellt). Robots bleibt an der Eintragszahl. |
| P2-3 llms.txt „ganz Österreich“ | **Behoben.** „Lieferung und Montage auf Anfrage“; per curl auf `/llms.txt` geprüft. |
| P3-2 Bildunterschrift am Hero | **Behoben.** „Bild: Minotti“ (Schlüssel `imageCredit`, 4 Sprachen) wie auf der Markenseite. |
| P3-1 Graubalken im 3:2-Rahmen | Offen. `contain` bleibt, weil Herstellerbilder teils Freisteller sind und `cover` sie beschneiden würde. Lösung in Runde 3: Fokuspunkt oder Bildformat aus dem Backoffice. |
| P3-3 Slug `tables-alexander` unter Sofas | Offen, Backoffice-Bereinigung (offener Punkt 2). |
| P3-4 Landstraße 9 im globalen JSON-LD | Offen, Entscheidung beim Beirat (Firmenbuch: 11), nicht dieses Paket. |

**Tests:** `brandCategory`, `brandCategoryPage`, `llms`, `sitemap`, `sitemap-r2` ergeben 30 grün und 1 todo (Regionen-Robots, Regionen-Paket). Neu: Regressionstests für Titel ohne Ausstellung, eine Zahl in der Meta-Description und llms.txt ohne Liefergebiet.
