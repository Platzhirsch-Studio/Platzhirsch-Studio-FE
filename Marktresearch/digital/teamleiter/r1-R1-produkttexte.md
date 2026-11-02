# R1-produkttexte – Lokale Datenquelle für geprüfte Produkttexte

Stand: 26.10.2026 (Nachbesserung nach QM-Feedback 8/10 eingearbeitet, siehe Abschnitt 0) · Branch `feature/neuauftritt` · nicht committet · Grundlage: Masterplan AP4 Nr. 3 (Long-Tail), Runde-1-Plan

## 0. Nachbesserung nach QM-Feedback (alle 4 P2 behoben)

| P2 | Behebung | Nachweis |
|---|---|---|
| 1 Freigaben gehen beim Build verloren | Neues Modul `src/lib/productCopy/approvals.js` (`carryApprovals`, `approvalFingerprint`). `build.mjs` liest die bestehende `de.json` und übernimmt `approved: true` samt `approvedBy`/`approvedAt`, solange der veröffentlichte Text (Marke, Name, Pfad, Meta, H1, Absätze, Fakten, FAQ, Keywords) unverändert ist. Hat sich der Text geändert, wird die Freigabe widerrufen und laut gemeldet (`FREIGABE WIDERRUFEN …`), denn eine Freigabe gilt nur für den gelesenen Text. Ist die alte Datei unlesbar, bricht der Build ab, statt Freigaben still zu verwerfen. | Test 12. Ende-zu-Ende: Arco freigegeben, Taccia freigegeben und Text geändert, dann Build. Ergebnis: Arco bleibt `true` (mit `approvedBy`/`approvedAt`), Taccia wird auf `false` gesetzt und gemeldet. Danach wurde die Originaldatei zurückgespielt. |
| 2 254-KB-JSON im Browser-Bundle | Neue Fassade `src/lib/productCopy/server.js` mit `import "server-only"` (in Next 16 eingebaut, keine Installation nötig). App-Code importiert **nur** `@/lib/productCopy/server`. Ein Import aus einer Client-Komponente bricht dann den Build ab. `index.js` bleibt nur für Node-Tests und Werkzeuge. | Test 14 durchsucht ganz `src/`: kein Import außer über `/server` und keiner in einer `"use client"`-Datei. **Turbopack verifiziert:** Eine temporäre Route `/api/r1-productcopy-probe` mit Import aus `@/lib/productCopy/server` lieferte HTTP 200 und `{"keys":62,"published":null,"resolved":null,…}`. `import … with { type: "json" }` und `server-only` laufen also im Dev-Server. Die Route wurde sofort wieder gelöscht. |
| 3 FAQ-JSON-LD nur bei sichtbarer FAQ | `buildFaqJsonLd(copy, pageUrl, { faqVisible: true })`. Ohne `faqVisible: true` oder ohne Freigabe kommt `null` zurück, verstecktes Markup ist damit technisch ausgeschlossen. Als **Pflicht** in der Einbau-Anleitung (4.4). | Test 10 |
| 4 Canonical beim Slug-Fallback | Neue Funktion `resolveProductCopy(cat, slug, locale)`. Sie liefert `{ copy, matchedBy, canonicalPath, staleCatalogPath }`. `canonicalPath` wird **immer** aus den Live-Parametern gebaut, also aus dem 308-Ziel, nie aus `copy.catalog.path`. `metadataOverride` setzt nie `alternates`. Pflicht in der Einbau-Anleitung (4.1). | Test 13 mit Superquadra: Wird die Kategorie `coffee-tables` im Backoffice auf `dining-tables` korrigiert, ergibt sich `matchedBy: "productSlug"` und Canonical `/produkte/dining-tables/tables-superquadra-tables`. |

**Prüfung nach Fix:**
- `node --test tests/unit/productCopy.test.mjs`: **14/14 grün**. `npx eslint src/lib/productCopy tests/unit/productCopy.test.mjs`: 0 Meldungen.
- `node src/lib/productCopy/build.mjs`: 62 Einträge. Freigaben: 0 übernommen, 0 widerrufen. In `de.json` hat sich gegenüber vorher nur das `note`-Feld geändert.
- **Live-Prüfung aller 62 Katalog-URLs** (nachgeholt): Im ersten Lauf lieferten 57 HTTP 200 und 5 HTTP 500 (Arco, Taccia, Snoopy, Toio, E1027). Ursache war der Dev-Server, der gerade fremde Dateien neu kompilierte (u. a. `produkte/[category]/[product]/page.js:526` „Expression expected“ und `fehlerseite-global.preview/probe/fonts.js`). Beim erneuten Abruf lieferten alle 5 HTTP 200, damit sind **62/62 = 200**. Auf keiner Seite steht Recherchetext (Abgleich mit dem ersten Absatz jedes Eintrags), weil nichts freigegeben ist.
- Screenshots `qa-screenshots/teamleiter/r1-R1-produkttexte/fix/` (`/de/produkte`, Arco, Superquadra): 11 von 12 Aufnahmen auf iPhone, Android, iPad und Desktop mit HTTP 200. Bei Android lief Superquadra in einen `networkidle`-Timeout (Dev-Server-Last). Gesichtet: Die Produktseiten sind unverändert im neuen Design, es gibt keinen Recherchetext und keine Händler-Behauptung. Die Konsolenfehler stammen aus fremden Paketen (siehe oben, dazu „Router action dispatched before initialization“ im Dev-Modus).

## Ergebnis in Kürze

| Punkt | Ergebnis |
|---|---|
| Zuordnung | **62 von 62** Recherche-Einträgen einer echten Katalog-URL zugeordnet, **0 weggelassen**. 61 Recherche-URLs liefern direkt HTTP 200, der Seitentitel passt zum Produkt. 1 URL korrigiert: Superquadra-Tisch `dining-tables/…` antwortet mit 308 auf `coffee-tables/tables-superquadra-tables`. |
| Daten | `src/content/productCopy/de.json`: 62 Einträge mit 182 Absätzen, 234 Fakten (jeweils mit https-Quelle) und 178 FAQ. Alle Einträge haben `approved: false`. |
| Gefiltert | 70 Absätze bzw. Sätze, 78 Fakten, 8 FAQ und 4 Keywords entfernt. Details in Abschnitt 3. Kein Meta-Feld war zu lang, gekürzt wurde deshalb nichts. |
| API | App-Code nur über `src/lib/productCopy/server.js` (server-only). `getProductCopy(categorySlug, productSlug, locale)` liefert nur bei `de` und `approved === true` Daten, sonst `null`. Dazu `resolveProductCopy()` (mit `canonicalPath`), `getProductCopyDraft()`, `listProductCopyKeys()`, `buildFaqJsonLd()` (nur mit `faqVisible: true`) und `metadataOverride()`. |
| Tests | `node --test tests/unit/productCopy.test.mjs`: 14 von 14 grün (nach Nachbesserung). Gesamtlauf `node --test tests/unit/*.test.mjs`: 134 Tests, 133 grün, 1 übersprungen (Sitemap-Integration, gehört R1-seo), 0 rot. |
| Lint | `npx eslint src/lib/productCopy tests/unit/productCopy.test.mjs`: 0 Meldungen. |
| Seite | Produktseiten-Code **nicht** angefasst. Bisher gibt es keinen Import der neuen Module, die Website verhält sich also unverändert. |

## 1. Dateien

| Datei | Inhalt |
|---|---|
| `src/content/productCopy/de.json` | Generierte Daten: `{ version, locale, generatedFrom, generatedAt, note, entries[] }` |
| `src/lib/productCopy/sanitize.js` | Filterregeln als reine Funktionen: Marker, Händler, Superlative, Preise, Lieferzeiten, Bilddaten, Kürzen |
| `src/lib/productCopy/build.mjs` | Generator: `node src/lib/productCopy/build.mjs [--check] [--report <datei>]`. Mit `--check` wird jede Katalog-URL gegen localhost:3000 geprüft und bei einer Antwort ungleich 200 abgebrochen. |
| `src/lib/productCopy/core.js` | Store mit eingespeisten Daten (`createProductCopyStore` mit `get`/`resolve`/`draft`), `buildFaqJsonLd`, `metadataOverride`. Ohne Abhängigkeiten. |
| `src/lib/productCopy/index.js` | API ohne Next-Abhängigkeit (für Node-Tests/Werkzeuge), lädt `de.json` per `import … with { type: "json" }` |
| `src/lib/productCopy/server.js` | **Einziger Import für App-Code**: `import "server-only"` und Re-Export der API |
| `src/lib/productCopy/approvals.js` | Übernahme der Freigaben beim Build (`carryApprovals`, `approvalFingerprint`) |
| `tests/unit/productCopy.test.mjs` | 14 Tests |

**Eintragsform** (Schlüssel = `<kategorieSlug>/<produktSlug>` wie in der URL):

```json
{
  "key": "sofas-couches/sofas-hamilton",
  "categorySlug": "sofas-couches",
  "productSlug": "sofas-hamilton",
  "approved": false,
  "brand": "Minotti",
  "productName": "Hamilton",
  "manufacturerUrl": "https://www.minotti.com/de/hamilton",
  "source": { "file": "Marktresearch/content/produkte/minotti-sofas.json", "researchedAt": "2026-10-26" },
  "catalog": { "path": "/produkte/sofas-couches/sofas-hamilton", "checkedAt": "2026-10-26" },
  "meta": { "title": "…", "description": "…" },
  "h1": "…",
  "paragraphs": ["…"],
  "facts": [{ "key": "designer", "label": "Designer", "value": "…", "source": "https://…" }],
  "faq": [{ "question": "…", "answer": "…" }],
  "keywords": ["…"]
}
```

`meta.title`, `meta.description` und `h1` fehlen bzw. sind leer, wenn sie einen Filter nicht bestanden haben. Heute bestehen alle 62 Einträge.

**Lookup:** Zuerst wird der genaue Schlüssel gesucht. Gibt es keinen Treffer, wird über den Produkt-Slug gesucht, denn der ist der eindeutige `path_field` des Datensatzes. Ändert das Backoffice die Kategorie eines Produkts, findet die Produktseite ihren Text also weiterhin.

## 2. Filterregeln (umgesetzt in `sanitize.js`, alle getestet)

| Regel | Wirkung |
|---|---|
| `[prüfen…]`, „nicht angegeben“, „unklar“ | Der **ganze** Absatz, Fakt bzw. FAQ-Eintrag fällt weg. Bei Fakten gilt das auch, wenn der Marker im internen `hinweis` steht. |
| Wert aus Bilddateinamen oder Bildunterschrift, Hinweise wie „mit Datenblatt abgleichen“ | Der Satz bzw. der Fakt fällt weg (unbelegt). |
| Fakt ohne `quelle` oder mit Quelle, die keine reine https-URL ist | Der Fakt fällt weg. Beispiel: Mondrian „Materialien“ mit der Quelle „… ; Katalogtext Platzhirsch“. |
| Händler, offiziell, autorisiert, Vertrags-, Vertriebs- oder Exklusivpartner, Flagship | Der Satz fällt weg. Im Datenbestand gab es keinen Treffer. Der Test prüft das zusätzlich mit dem Claim-Guard `findClaims` aus R1-legal. |
| Superlative und Bibel-Verbotswörter (größte, beste/am besten, führend, einzigartig, weltweit, Luxus, exklusiv, Traum, Nr. 1 …) | Der Satz bzw. das FAQ fällt weg, Keywords werden einzeln gestrichen. Die Regel ist bewusst streng, deshalb fallen auch „am besten“ als Ratschlag und „der größte Teil“ weg. |
| Preise (€, EUR, CHF, Preis, Aufpreis, kostet, Rabatt …) | Der Satz bzw. das FAQ fällt weg. Bei Fakten wird nur der betroffene `;`-Abschnitt entfernt. „Preisgruppen“ (Stoffkategorien) bleibt stehen. |
| Lieferzeit-Versprechen | Der Satz fällt weg. Im Datenbestand gab es keinen Treffer. |
| Meta-Länge | `meta_title` ≤ 60 und `meta_description` ≤ 155 Zeichen, sonst wird an einer Wortgrenze gekürzt. Heute war das nirgends nötig. |
| FAQ-Quellen | FAQ-Antworten haben im Recherche-Format kein eigenes `quelle`-Feld. Sie bleiben stehen, wenn sie keinen Marker enthalten. Als Beleg gilt `manufacturerUrl` des Eintrags. Bei der Freigabe gegenlesen. |
| `hinweis` | Wird nie übernommen, weil es eine interne Recherche-Notiz ist. |

## 3. Was entfernt wurde

| Grund | Absätze/Sätze | Fakten | FAQ | Keywords |
|---|---|---|---|---|
| Marker `[prüfen]` usw. | 66 Absätze | 56 + 18 leere „Jahr/Maße“-Werte | 1 | – |
| Bilddaten/unbelegt | 2 Sätze | 3 | – | – |
| Quelle fehlt bzw. keine reine URL | – | 1 | – | – |
| Superlativ/Verbotswort | 1 Satz | – | 3 | 4 (Luxusbett ×2, Luxusmatratze, „Kleiderschrank Luxus“) |
| Preis | 1 Satz | 1 Teilwert (Superquadra „Kabeldurchlässe gegen Aufpreis“) | 4 | – |

Fast jeder vierte Absatz („Ob X in der Ausstellung in Lochau steht [prüfen] …“) fällt dadurch komplett weg. Für ihn gilt: Sobald der Inhaber bestätigt, welche Stücke wirklich ausgestellt sind, kann man je Produkt einen geprüften Satz ergänzen.

Entfernte FAQ: Arco „Wie schwer …“ (der größte Teil), West und Supermoon „höher bestellen“ (Aufpreis), Superquadra „Konferenztisch“ (Aufpreis), Munch „am besten“, Westside „Was kostet …“, Bristol „Wie weich …“ (am besten), dazu 1 FAQ mit Marker.

## 4. Einbau-Anleitung für Runde 2 (Produktseite)

Datei: `src/app/[locale]/produkte/[category]/[product]/page.js`. Sie gehört heute dem Neuauftritt-Team, der Einbau erfolgt deshalb in Runde 2.

**0. Import (Pflicht: nur Server)**

```js
import { resolveProductCopy, buildFaqJsonLd, metadataOverride } from "@/lib/productCopy/server";
```

- Nur in Server-Komponenten, `generateMetadata` und Route-Handlern verwenden. **Nie** in einer `"use client"`-Datei. Client-Komponenten bekommen nur die fertigen Strings als Props (`server-only` bricht sonst den Build ab, Test 14 schlägt fehl).
- Nie `@/lib/productCopy` (index.js) oder die JSON direkt importieren.
- `with { type: "json" }` plus `server-only` sind unter Turbopack verifiziert (Probe-Route, HTTP 200, siehe Abschnitt 0).

**1. Metadaten-Override, nur wenn approved.** In `generateMetadata` nach dem Laden von `detail`:

```js
// erst NACH dem Kategorie-Redirect-Check (generateSlug(product.categoryKey) === categorySlug),
// mit den Live-Parametern der Seite
const resolved = resolveProductCopy(categorySlug, productSlug, locale); // null außer de + approved
const copy = resolved?.copy ?? null;
const override = metadataOverride(copy);                                // {} wenn nicht approved
return buildPageMetadata({
  locale,
  pathByLocale: productsPathByLocale(categorySlug, productSlug),
  title: override.title || productMetaTitle(detail, product, locale),
  description: override.description || productMetaDescription(detail, product, locale),
  …
});
```

- `meta.title` enthält bereits „| Platzhirsch“. Stand 26.10. hat das Layout kein `title.template`, und `buildPageMetadata` übergibt den Titel unverändert. Es gibt also keine Dopplung. Kommt im Neuauftritt ein Template dazu, `title: { absolute: override.title }` verwenden.
- **Pflicht Canonical:** Canonical und hreflang kommen weiter aus `productsPathByLocale(categorySlug, productSlug)`, also aus der Live-URL. Wurde der Text über den Produkt-Slug gefunden (`resolved.matchedBy === "productSlug"`, `resolved.staleCatalogPath === true`, z. B. Superquadra nach einer Kategoriekorrektur), zeigt der Canonical auf das 308-Ziel, also `resolved.canonicalPath`. **Nie** `copy.catalog.path` als Canonical, Link oder Sitemap-Eintrag verwenden. `metadataOverride` liefert bewusst keine `alternates`.
- hreflang und canonical bleiben sonst unverändert. EN, FR und IT bekommen keinen Override, weil `getProductCopy` für sie `null` liefert. Das bedeutet keinen SEO-Verlust.

**2. Textblock.** In `ShopProductPage` die Kopie einmal laden, und zwar nach dem Redirect-Check: `const copy = resolveProductCopy(categorySlug, productSlug, locale)?.copy ?? null`.
- `descriptionParagraphs`: Ist `copy` gesetzt, `copy.paragraphs` verwenden. Andernfalls bleibt die heutige Logik aus CMS-Text bzw. Fallback. Die Recherche-Texte sind ausführlicher und belegt, der CMS-Text ist meist eine kurze Herstellerzeile.
- `h1`: **nicht** gegen `copy.h1` tauschen. Die H1 bleibt der Produktname, so wie es die Design-Bibel und der Rest des Katalogs vorsehen. `copy.h1` kann man als Untertitel bzw. Lead unter der H1 nutzen, als `<p>` und nicht als zweite Überschrift.

**3. Faktentabelle mit Quelle.** Unter dem Textblock bzw. im Tab „Materialien und Pflege“ als eigene Sektion:

```jsx
{copy?.facts?.length > 0 && (
  <section aria-labelledby="fakten-titel">
    <h2 id="fakten-titel">Fakten laut Hersteller</h2>
    <dl>
      {copy.facts.map((f) => (
        <div key={f.key}>
          <dt>{f.label}</dt>
          <dd>{f.value} <a href={f.source} target="_blank" rel="noopener noreferrer">Quelle<span className="sr-only">: {copy.brand}, neues Fenster</span></a></dd>
        </div>
      ))}
    </dl>
  </section>
)}
```

- Als `<dl>` umsetzen, nicht als Layout-Tabelle. Jede Zeile bekommt einen Quellen-Link (WCAG 2.2 AA: Linkzweck aus dem Kontext erkennbar, Hinweis auf neues Fenster für Screenreader).
- Mit `materialsFields` aus dem Backoffice gibt es keine Dopplung, weil die Fakten eine eigene Sektion bilden. Eine Zusammenführung entscheidet das Neuauftritt-Team.
- Maße aus `facts` (Schlüssel `masse`) **nicht** in `parseDimensions` einspeisen, denn das sind Freitexte.

**4. FAQ plus FAQPage-JSON-LD. PFLICHT: JSON-LD nur, wenn genau diese FAQ sichtbar auf der Seite gerendert wird.** Sonst verstößt das Markup gegen die Google-Richtlinien für strukturierte Daten (SEO-Risiko). Das ist technisch erzwungen: `buildFaqJsonLd` liefert ohne `{ faqVisible: true }` immer `null`. `faqVisible` nur auf `true` setzen, wenn derselbe Render-Zweig die `<section>` unten ausgibt (gleiche Bedingung `showFaq`, nicht per CSS versteckt, nicht in einem Tab, der standardmäßig nicht im DOM steht).

```jsx
{copy?.faq?.length > 0 && (
  <section aria-labelledby="faq-titel">
    <h2 id="faq-titel">Häufige Fragen zu {copy.productName}</h2>
    {copy.faq.map((f) => (
      <details key={f.question}><summary>{f.question}</summary><p>{f.answer}</p></details>
    ))}
  </section>
)}
```

Bei `structuredData` den Knoten anhängen. `graph()` filtert `null` heraus:

```js
const structuredData = graph(
  productSchema({ … }),
  breadcrumbList([…], `${pageUrl}#breadcrumb`),
  buildFaqJsonLd(copy, pageUrl, { faqVisible: showFaq })  // showFaq = copy?.faq?.length > 0, dieselbe Bedingung wie beim Rendern
);
```

`<details>` und `<summary>` sind per Tastatur bedienbar und brauchen kein JavaScript. Die Animation ist nur mit `motion-safe:` erlaubt (reduced motion).

**5. Freigabe.** In `de.json` beim Eintrag `"approved": true` setzen, wenn der Inhaber den Text gelesen hat (Frage 7 an den Inhaber). Erst dann erscheint der Text auf der Seite. Optional `"approvedBy"` und `"approvedAt"` dazuschreiben. Sinnvoll ist eine Freigabe pro Marke. Ein neuer Lauf von `build.mjs` **behält** Freigaben bei unverändertem Text. Hat sich der Text eines Eintrags geändert, wird seine Freigabe widerrufen und in der Konsole als `FREIGABE WIDERRUFEN` gemeldet. Dieser Eintrag muss dann neu gelesen und freigegeben werden.

**6. Vorschau.** `getProductCopyDraft(cat, slug)` liefert den Entwurf auch ohne Freigabe. Gedacht für `/[locale]/preview` (noindex) oder zum Gegenlesen. Nie auf der öffentlichen Seite verwenden.

**7. Abnahme in Runde 2:** `node --test tests/unit/productCopy.test.mjs`. Für einen freigegebenen Eintrag: `curl` der Produktseite, dann sind sichtbare FAQ, JSON-LD `FAQPage` und `<title>` aus `meta.title` zu prüfen. Für einen nicht freigegebenen Eintrag muss die Seite unverändert bleiben.

## 5. Zugeordnete URLs (alle 62)

Geprüft am 26.10.2026 per `curl` gegen http://localhost:3000. Der `<title>` der Seite wurde mit dem Produktnamen verglichen. Spalte „entfernt“ = Absätze bzw. Sätze / Fakten / FAQ.

| # | Produkt | Katalog-URL | Absätze | Fakten | FAQ | entfernt |
|---|---|---|---|---|---|---|
| 1 | Flos Arco | `/de/produkte/lamps/lamps-arco` | 3 | 7 | 2 | 1/0/1 |
| 2 | Flos Taccia | `/de/produkte/lamps/lamps-taccia` | 3 | 6 | 3 | 1/0/0 |
| 3 | Flos Snoopy | `/de/produkte/lamps/lamps-snoopy` | 3 | 6 | 3 | 1/0/0 |
| 4 | Flos Toio Led | `/de/produkte/lamps/lamps-toio-led` | 3 | 5 | 3 | 1/1/0 |
| 5 | ClassiCon Adjustable Table E1027 | `/de/produkte/side-tables/side-tables-adjustable-table-e1027` | 3 | 6 | 3 | 1/1/0 |
| 6 | ClassiCon Bibendum Armchair | `/de/produkte/armchairs-stools/armchairs-stools-bibendum-armchair` | 3 | 7 | 3 | 1/0/0 |
| 7 | ClassiCon Day Bed | `/de/produkte/chaise-longues-daybeds/chaise-longues-daybeds-day-bed` | 3 | 6 | 3 | 1/0/0 |
| 8 | ClassiCon Bell Side Table | `/de/produkte/side-tables/side-tables-bell-side-table` | 3 | 5 | 3 | 1/1/0 |
| 9 | Tréca Bett Adonis | `/de/produkte/beds/beds-bett-adonis` | 3 | 4 | 3 | 1/1/0 |
| 10 | Tréca Kopfteil Versailles | `/de/produkte/beds/beds-kopfteil-versailles` | 3 | 3 | 3 | 1/2/0 |
| 11 | Tréca Matratze Impérial Pullman | `/de/produkte/beds/beds-matratze-imperial-pullman` | 3 | 4 | 3 | 2/2/0 |
| 12 | Tréca Liegesystem Paris Istanbul | `/de/produkte/beds/beds-liegesystem-paris-istanbul` | 3 | 4 | 3 | 1/2/0 |
| 13 | Tuuci Bleau Sun Lounge | `/de/produkte/sun-loungers/sun-loungers-bleau-sun-lounge` | 3 | 4 | 3 | 1/2/0 |
| 14 | Tuuci Bleau Lounge Chair | `/de/produkte/lounge-furniture-daybeds/lounge-furniture-daybeds-bleau-lounge-chair` | 3 | 3 | 3 | 1/2/0 |
| 15 | Umbrosa Paraflex | `/de/produkte/parasols/parasols-paraflex` | 3 | 7 | 3 | 1/0/0 |
| 16 | Umbrosa Eclipsum PX | `/de/produkte/parasols/parasols-eclipsum-px` | 3 | 4 | 3 | 1/2/0 |
| 17 | Minotti Connery | `/de/produkte/sofas-couches/tables-connery` | 3 | 3 | 3 | 1/1/0 |
| 18 | Minotti Hamilton | `/de/produkte/sofas-couches/sofas-hamilton` | 3 | 4 | 3 | 1/0/0 |
| 19 | Minotti Lawrence | `/de/produkte/sofas-couches/sofas-lawrence` | 3 | 3 | 3 | 1/1/0 |
| 20 | Minotti Daniels | `/de/produkte/sofas-couches/sofas-daniels` | 3 | 3 | 3 | 1/1/0 |
| 21 | Minotti Horizonte | `/de/produkte/sofas-couches/tables-horizonte-tables` | 3 | 3 | 3 | 1/1/0 |
| 22 | Minotti Goodman | `/de/produkte/sofas-couches/sofas-goodman` | 3 | 2 | 3 | 1/2/0 |
| 23 | Minotti West | `/de/produkte/sofas-couches/sofas-west-sofas` | 3 | 3 | 2 | 1/1/1 |
| 24 | Minotti Yves | `/de/produkte/sofas-couches/sofas-yves` | 3 | 2 | 3 | 1/2/0 |
| 25 | Minotti Roger | `/de/produkte/sofas-couches/sofas-roger-sofas` | 3 | 3 | 3 | 1/1/0 |
| 26 | Minotti Supermoon | `/de/produkte/sofas-couches/produkt-supermoon-variant` | 3 | 3 | 2 | 1/1/1 |
| 27 | Minotti Saki | `/de/produkte/sofas-couches/sofas-saki-sofas` | 3 | 3 | 3 | 1/1/0 |
| 28 | Minotti Alexander | `/de/produkte/sofas-couches/tables-alexander` | 3 | 3 | 3 | 1/1/0 |
| 29 | Minotti Torii | `/de/produkte/armchairs-stools/armchairs-torii` | 3 | 2 | 3 | 1/2/0 |
| 30 | Minotti Twiggy | `/de/produkte/armchairs-stools/armchairs-twiggy-armchairs` | 3 | 3 | 3 | 1/1/0 |
| 31 | Minotti Lido | `/de/produkte/armchairs-stools/armchairs-lido-armchairs` | 3 | 2 | 3 | 1/2/0 |
| 32 | Minotti Linha Fina | `/de/produkte/dining-tables/tables-linha-fina` | 3 | 4 | 3 | 1/1/0 |
| 33 | Minotti Morgan | `/de/produkte/dining-tables/tables-morgan` | 3 | 3 | 2 | 1/2/1 |
| 34 | Minotti Van Dyck | `/de/produkte/dining-tables/tables-van-dyck` | 3 | 3 | 3 | 1/2/0 |
| 35 | Minotti Bellagio "Dining" Wood | `/de/produkte/dining-tables/dining-tables-bellagio-dining-wood` | 3 | 3 | 3 | 1/2/0 |
| 36 | Minotti Superquadra Tisch | `/de/produkte/coffee-tables/tables-superquadra-tables` | 3 | 3 | 2 | 3/2/1 |
| 37 | Minotti Fynn Tisch | `/de/produkte/dining-tables/tables-fynn-tables` | 3 | 4 | 3 | 1/1/0 |
| 38 | Minotti Supermoon Coffee Table | `/de/produkte/coffee-tables/side-tables-supermoon-coffee-table` | 3 | 4 | 3 | 1/1/0 |
| 39 | Minotti Yves Coffee Table | `/de/produkte/coffee-tables/side-tables-yves-coffee-table` | 3 | 3 | 3 | 2/2/0 |
| 40 | Minotti Huber | `/de/produkte/coffee-tables/tables-huber` | 3 | 3 | 3 | 1/2/0 |
| 41 | Minotti Kirk "Wood" | `/de/produkte/dining-tables/tables-kirk-wood` | 2 | 3 | 3 | 2/2/0 |
| 42 | Minotti Munch | `/de/produkte/coffee-tables/tables-munch` | 2 | 2 | 2 | 2/3/1 |
| 43 | Minotti Lido Couch- und Beistelltische | `/de/produkte/side-tables/side-tables-lido-side-tables` | 2 | 3 | 3 | 2/2/0 |
| 44 | Minotti Pilotis | `/de/produkte/side-tables/produkt-pilotis` | 3 | 3 | 3 | 1/2/0 |
| 45 | Minotti Calder "Bronze" | `/de/produkte/side-tables/side-tables-calder-bronze` | 2 | 3 | 3 | 2/2/0 |
| 46 | Minotti Taiko | `/de/produkte/side-tables/side-tables-taiko` | 3 | 3 | 3 | 1/2/0 |
| 47 | Poliform Westside Sofa | `/de/produkte/sofas-couches/sofas-couches-westside-sofa` | 3 | 4 | 2 | 1/1/1 |
| 48 | Poliform Bristol | `/de/produkte/sofas-couches/dining-chairs-bristol` | 3 | 4 | 2 | 1/1/1 |
| 49 | Poliform Mondrian Sofa | `/de/produkte/sofas-couches/sofas-couches-mondrian-sofa` | 3 | 2 | 3 | 1/3/0 |
| 50 | Poliform Senzafine Kleiderschrank | `/de/produkte/wardrobes/wardrobes-senzafine-wardrobe` | 3 | 4 | 3 | 1/1/0 |
| 51 | Poliform Ubik | `/de/produkte/wardrobes/wardrobes-ubik` | 3 | 4 | 3 | 1/1/0 |
| 52 | Poliform Dream | `/de/produkte/beds/beds-dream` | 3 | 4 | 3 | 1/1/0 |
| 53 | Poliform Onda Bett | `/de/produkte/beds/beds-onda-bed` | 3 | 4 | 3 | 1/1/0 |
| 54 | Poliform Jacqueline | `/de/produkte/beds/beds-jacqueline` | 3 | 4 | 3 | 1/1/0 |
| 55 | Rimadesio Cover | `/de/produkte/wardrobes/wardrobes-cover` | 3 | 4 | 3 | 1/1/0 |
| 56 | Rimadesio Dress bold | `/de/produkte/wardrobes/wardrobes-dress-bold` | 3 | 4 | 3 | 1/1/0 |
| 57 | Rimadesio Hedon | `/de/produkte/wardrobes/wardrobes-hedon` | 3 | 5 | 3 | 1/0/0 |
| 58 | Rimadesio Zenit Bücherregal | `/de/produkte/shelves/shelves-zenit-bucherregale` | 3 | 4 | 3 | 1/1/0 |
| 59 | Rimadesio Abacus living | `/de/produkte/shelves/shelves-abacus-living` | 3 | 5 | 3 | 1/0/0 |
| 60 | Rimadesio Self Plan | `/de/produkte/shelves/shelves-self-plan` | 3 | 4 | 3 | 1/1/0 |
| 61 | Rimadesio Sixty | `/de/produkte/shelves/shelves-sixty` | 3 | 4 | 3 | 1/1/0 |
| 62 | Rimadesio Wind | `/de/produkte/shelves/shelves-wind` | 3 | 4 | 3 | 1/1/0 |

## 6. Selbstprüfung

- `node src/lib/productCopy/build.mjs`: 62 Einträge, nicht zugeordnet 0.
- `node --test tests/unit/productCopy.test.mjs`: 11/11 grün. Geprüft werden: kein `[prüfen]`, „nicht angegeben“ oder „unklar“ im Rohtext; „Händler“ nur bei ClassiCon, zusätzlich der Claim-Guard `findClaims` (0 Treffer); kein Superlativ, Preis, keine Lieferzeit und keine Bilddaten-Angabe; Schlüssel und Produkt-Slugs eindeutig, auch im Rohtext gezählt; jede Quelle https; Meta-Längen; `getProductCopy` liefert ohne Freigabe `null`, auch für `en`, `fr` und `it`; Fallback über den Produkt-Slug; FAQPage-JSON-LD; Metadaten-Override.
- `npx eslint src/lib/productCopy tests/unit/productCopy.test.mjs`: 0 Meldungen.
- `node tools/qa/shoot.mjs …/qa-screenshots/teamleiter/r1-R1-produkttexte/selbst http://localhost:3000/de/produkte`: iPhone, iPad und Desktop liefern 200 ohne horizontalen Überlauf. Bei Android kam es zum Timeout (networkidle, der Dev-Server war ausgelastet). Desktop meldet 15 Konsolenfehler aus `src/lib/forms/guard.js` („Export ipFromHeaders doesn't exist“), die R1-formulare gerade umbaut. Beides stammt nicht aus diesem Paket, denn es ändert keine Seite.
- Beobachtung beim ersten URL-Lauf: Alle Produktseiten lieferten kurz HTTP 500, und `/api/shop-search` meldete „Can't resolve '@/lib/api/fetchKategorien'“. Ursache war ein laufender Umbau von `src/lib/api` (R1-plattform). Wenige Minuten später lieferten alle Seiten wieder 200, die Tabelle oben stammt aus diesem zweiten Lauf.

## 7. Offene Punkte

1. **Freigabe (Inhaber-Frage 7):** Wer setzt `approved: true`? Bis dahin zeigt die Website nichts davon an.
2. **Superquadra-Tisch:** Laut Hersteller und Recherche ist er ein Esstisch (250–400 cm), im Backoffice steht er unter `coffee-tables`. Im Backoffice die Kategorie korrigieren. Der Text wird dank Slug-Fallback trotzdem gefunden.
3. **Servicesätze gegenlesen:** Einige Absätze versprechen Leistungen, zum Beispiel „Muster zeigen wir Ihnen bei der Beratung in Lochau“ (Bibendum) oder „besorgen Stoff- und Ledermuster“. Vor der Freigabe bestätigen.
4. **„Ikone des 20. Jahrhunderts“** (E1027) ist kein Superlativ und bleibt deshalb stehen. Bei der Freigabe entscheiden.
5. **Ausstellungs-Sätze:** Rund 60 der 66 wegen Marker entfernten Absätze sind solche „Ob X in der Ausstellung steht [prüfen]“-Absätze. Wenn eine Liste der ausgestellten Stücke vorliegt, je Produkt einen belegten Satz ergänzen (Formel der Bibel: „in unserer Ausstellung in Lochau“).
6. **Fehlende Fakten:** Jahr (meist nicht auf der Herstellerseite) und Maße bei Munch, Lido, Huber, Kirk, Calder, Taiko, Yves Coffee Table, Superquadra (Tiefe), Mondrian, Ubik, Wind und Self Plan aus den Datenblättern nachtragen, danach `build.mjs` neu laufen lassen. Freigaben bleiben erhalten, nur Einträge mit geändertem Text verlieren ihre Freigabe (siehe 4.5).
7. **Andere Sprachen:** Bewusst nur DE. EN, FR und IT bekommen erst nach einer Übersetzung eigene Dateien (`en.json` usw.) und einen Store in `index.js`.
