# 08 – Bauplan SEO (technisch und Content)

**Stand:** 26.10.2026 · Rolle: SEO-Experte (technisch und Content) · Grundlage: Code im Repo (Next.js 16.3.4, next-intl 4.13.0), Live-Prüfung von platzhirsch.studio am 26.10.2026 mit curl/Node, Next-Doku in `node_modules/next/dist/docs/`, Berichte 00, 23 (Abschn. 1, 4, 9, 10), 25, `docs/seo-ux/02-implementation-report.md`
**Abgrenzung:** Google-Unternehmensprofil, Bewertungen und Citations stehen in [09-local-seo-reputation.md](09-local-seo-reputation.md). Dieser Bericht behandelt Website, Code und Inhalte.
**Regeln für alles hier:** keine Händler-Behauptung bei Minotti/Poliform, keine Herstellerbilder in neuen Formaten ohne Freigabe, Pflegeaufwand für ~5 Personen tragbar.

---

## 0. Kurzfassung

Die technische Basis ist besser als bei jedem regionalen Wettbewerber: 4 Sprachen mit hreflang, 7.164 Produkt-URLs in der Sitemap, JSON-LD-Graph, 308-Weiterleitungen der Alt-URLs. **Was fehlt, ist die Verbindung der Daten zu Suchanfragen.**
1. Die Markenseite Minotti verlinkt **kein einziges** der 487 Minotti-Produkte direkt. Es gibt nur Links auf `?marke=`-Filter, und die werden auf die Kategorie kanonisiert.
2. Es gibt **keine indexierbare Seite für „Minotti Sofa“** (Marke × Kategorie) und **keine Kollektions-Hubs für Minotti**: Das Backoffice hat für Minotti keine Collections, live existiert nur `/de/ueber-uns/marken/minotti`.
3. Produkttitel lauten `Lawrence – Minotti | …` ohne Produktart. Gesucht wird aber „Minotti Lawrence Sofa“.
4. Die Beschreibungstexte sind zum großen Teil Herstellertext. Geprüft am Beispiel Lawrence: Der zweite Absatz deckt sich fast wörtlich mit minotti.com/de/lawrence. Bei Modellsuchen gewinnt dann das Original.
5. **Live steht immer noch „Minotti Händler Vorarlberg“** im Title und „Händler in Vorarlberg“ in der Meta-Description (aus dem CMS). Die Korrektur im Code ist nicht committet und nicht deployt. Das ist ein **rechtliches Sofort-Thema**.

Alles davon ist **ohne Backoffice-Zugang** im Frontend lösbar. Blockiert sind nur Preise/Offer (Preisdaten und Herstellerfreigabe) und die Pflege der CMS-Meta-Texte. Für die Meta-Texte gibt es eine Code-Brücke (Abschnitt 4, F1).

---

## 1. Ist-Zustand im Code (mit Dateipfaden)

### 1.1 Metadaten, Canonical, hreflang

| Bereich | Datei | Befund | Bewertung |
|---|---|---|---|
| Metadaten-Builder | `src/lib/seo/pageMetadata.js` | `buildPageMetadata()` erzeugt canonical, hreflang (de, de-AT, de-CH, en, fr, fr-FR, fr-CH, it, it-IT, it-CH, x-default), OG und Twitter | gut |
| Host | `SITE_URL = https://platzhirsch.studio` | live: `www.` → 301 auf Apex, Apex `/` → 308 `/de`. Canonical-Host ist konsistent | gut |
| OG-Locale | `pageMetadata.js` `de_DE` vs. Markenseite `de_AT` | uneinheitlich (Backlog im Report 02) | klein |
| Produkt-Title | `src/lib/seo/shopSeoCopy.js` → `productTitle()` | `Name – Marke \| Platzhirsch Home Living`, **ohne Produktart und ohne Ort**; in allen 4 Sprachen gleich | **Hebel** |
| Kategorie-Title | `shopSeoCopy.js` → `categorySeo()` | DE: SISTRIX-Keywords („Designer Sofas in Vorarlberg – …“); EN/FR/IT generisch | gut (DE) |
| Markenseite | `src/app/[locale]/ueber-uns/marken/[title]/page.js` | Overrides ohne „Händler“ (lokal geändert, **nicht deployt**). Meta-Description kommt aus CMS `metadata_description_<locale>` und enthält live „Händler in Vorarlberg“. Eigener Canonical-Code statt `buildPageMetadata` | **rechtliches Risiko** |
| Kollektionen | `src/lib/marken/collectionPage.js` | Title `X Kollektion – Marke`, hreflang korrekt. Seiten gibt es nur, wenn das Backoffice Collections hat (Minotti: 0) | Lücke |
| Landingpages | `src/components/Landing/landingPage.js`, `src/app/[locale]/designermoebel-*/page.js` | nur DE, andere Sprachen 404, indexierbar, WebPage, Breadcrumb und FAQPage | ok, inhaltlich dünn |

### 1.2 Sitemaps und robots

| Datei | Befund live (26.10.2026) |
|---|---|
| `src/app/sitemap.xml/route.js` (Index) + `src/lib/seo/sitemapEntries.js` | 4 Teil-Sitemaps: static 53, marken 336, news 124, produkte 7.164 URLs. `lastmod` aus dem Backend, nicht `new Date()` (gut). Im Live-Index steht static/marken noch auf `2026-07-08`, weil der aktuelle Code nicht deployt ist |
| Produkt-Sitemap | 1.791 DE-URLs (4 × ≈1.790). **Keine `image:image`-Einträge**, obwohl Next 16 sie unterstützt (`docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`, Abschnitt „Image Sitemaps“) |
| `src/app/robots.js` | Suchbots: alles außer `/api/`. KI-Suchbots (OAI-SearchBot, PerplexityBot, Claude-SearchBot …) erlaubt mit `Crawl-delay: 2`. **Komplett gesperrt (`Disallow: /`) sind die Trainings-Bots GPTBot, ClaudeBot, Google-Extended, CCBot, Meta-ExternalAgent, Bytespider u. a.** Uneinheitlich: `Applebot-Extended` und `anthropic-ai` (ebenfalls Trainings-Tokens) stehen bei den erlaubten. `*`: `/*?*` gesperrt |
| `src/app/llms.txt/route.js` | spec-konform (H1, Summary, Links), Marken dynamisch. **Es fehlen** Kategorien, Landingpages, Ratgeber, Fakten (Öffnungszeiten, Lieferländer, Schweiz-Ablauf) und eine `llms-full.txt` |

### 1.3 JSON-LD (`src/lib/seo/structuredData.js`, `brandSchema.js`, Layout)

| Seite | Live-Typen | Lücke |
|---|---|---|
| alle | `Organization`+`FurnitureStore`, `WebSite`, `OpeningHoursSpecification`, `areaServed` AT/DE/CH/FL | `LocalBusiness`-Teile sind gut. Es fehlt `sameAs` zu Instagram/GBP-Profilen (prüfen) |
| Produkt | `Product` (name, description, bis zu 20 Bilder, brand, category, sku = Name), `BreadcrumbList` | **kein `offers`** (bewusst, weil keine Preise). Damit gibt es keine Rich-Snippets, und Search Console warnt. Kein `isRelatedTo`/`isVariantOf`, kein `ProductGroup`. Category live: **„Sofas Couches“** (roher Slug) |
| Kategorie/Hub | `CollectionPage` + `ItemList` | gut |
| Marke | `AboutPage` + `Brand` (`@id` je Marke, sameAs Hersteller) | gut; `ItemList` der Produkte fehlt |
| Kollektion | – | laut Report 02 noch kein JSON-LD |
| Landingpages | `WebPage`, `FAQPage`, `BreadcrumbList` | ok |

### 1.4 Produktseiten-Inhalt (`src/app/[locale]/produkte/[category]/[product]/page.js`)

- Datenfelder aus dem Backoffice (`src/lib/shop/shopProducts.js`): Name, Marke, Designer, Kategorie, Beschreibung, mehr_beschreibung, Maße (`dimensions`), Material, Farbe, Gewicht, Bilder, `collection`. **Es gibt keine Felder für Preis, Lieferzeit, „in der Ausstellung“ oder Varianten.**
- Text: CMS-Beschreibung, Wiederholungen werden entfernt. Fallback-Satz: in einer Stichprobe von 30 DE-Produkten 0 Treffer, alle haben CMS-Text. **Viel davon ist Herstellertext.**
- H1 = nur Modellname („Lawrence“). Breadcrumb `Home / Produkte / Kategorie / Produkt`, **ohne Markenebene**.
- Interne Links: Markenseite, Kategorie, 3 verwandte Produkte (Endpoint `related_products`), Kollektions-Slider der Marke (für Minotti leer).
- Slugs: `path_field` aus dem Backoffice mit Import-Präfix der Kategorie: `sofas-lawrence`, und **`tables-connery` für ein Sofa**. Die Kategorie-Slugs sind englisch, auch in deutschen URLs (`/de/produkte/sofas-couches/…`, `/de/produkte/beds`).
- HTML-Größe: Produktseite 211 KB, Kategorie „Sofas“ 403 KB (RSC-Payload). Das ist akzeptabel, aber die Kategorie sollte man beobachten.

### 1.5 Marken-, Kategorie- und Landingpages

- **Markenseite Minotti live:** 413 Wörter, 0 direkte Produktlinks, 15 Links auf `…/kategorie?marke=minotti`. Diese Links sind Filter: Sie werden auf die Kategorie kanonisiert, für `*` per robots gesperrt und von Google meist ignoriert. **Die 487 Produkte bekommen von der stärksten Seite also keinen Linkfluss.**
- Die Marken-URL liegt unter `/ueber-uns/marken/…` („Über uns“). Die semantische Hierarchie ist schwach, das wird aber nicht umgebaut (308-Risiko kurz nach dem Relaunch). Ausgleich schaffen Breadcrumbs, interne Links und Hub-Seiten.
- Kategorieseiten: 144 SSR-Produktlinks („Sofas“), CollectionPage-Schema, Intro-Satz. **Es gibt kein Kategorie-Editorial** (Kaufberater-Absatz, FAQ).
- Landingpages (9, nur DE): je ca. 550 Wörter, FAQ, Markenkarten. Die Texte sind generisch und haben **0 Produktlinks**. St. Gallen enthält nichts Konkretes zu CHF, MWST oder Ablauf. Das ist ein mittleres Doorway-Risiko, wenn weitere Städte nach dem gleichen Muster dazukommen.

### 1.6 Bilder

- Produktbilder laufen über die Proxy-Route `src/app/cmx/[...path]/route.js` und dann `next/image`. Die Dateinamen sind gut (`minotti-lawrence-01.webp`). Alt-Text = „Marke Name“, in der Galerie sind Thumbnails `alt=""`.
- `next.config.js` setzt in prod `formats: ["image/webp","image/avif"]`. **Next wählt das erste passende Format, also liefert es praktisch nie AVIF aus.** Die Reihenfolge sollte umgedreht werden, wie in dev.
- LCP mobil 4–5 s (Report 02): Hero-Foto ohne Mobile-Crop.
- **Bildrechte:** Fast alle Produktbilder sind Herstellerbilder. Image-Sitemap und Google-Shopping-Feeds vergrößern ihre Reichweite. Erst die Freigabe klären, dann skalieren.

### 1.7 Rendering und Indexierbarkeit

- Die Seiten werden statisch vorgerendert (`generateStaticParams`) und per ISR aktualisiert (`revalidate` 3600, Revalidate-Routen `src/app/revalidate/*`). Title und Canonical stehen auch für OAI-SearchBot und PerplexityBot im `<head>` (live geprüft).
- Next 16 streamt Metadaten in den `<body>`, wenn eine Seite on demand gerendert wird. KI-Bots wie GPTBot, PerplexityBot und ClaudeBot stehen **nicht** in der Liste `HTML_LIMITED_BOT_UA_RE` (`node_modules/next/dist/shared/lib/router/utils/html-bots.js`). Für neu hinzukommende Produkte, die nicht vorgerendert sind, empfiehlt sich `htmlLimitedBots` (Doku: `generate-metadata.md` → „Streaming metadata“).
- Proxy `src/proxy.js` leitet unübersetzte Pfade per 308 auf die übersetzten.

---

## 2. Benchmark

### 2.1 Regionale Wettbewerber (live geprüft 26.10.2026)

| Wettbewerber | Seiten in der Sitemap | Produktseiten | Preise | hreflang | JSON-LD | Fazit |
|---|---|---|---|---|---|---|
| **Höttges** (hoettges.at, WordPress) | **9** (Start, News, Projekte, Brands, Kontakt, Team, Planung …) | keine | nein | 0 | Yoast-Standard | nur Brand-Liste, keine Markenseiten. Stark nur durch Verzeichnis-Links |
| **reiter design** (reiter.design) | 21 Seiten, 36 Projekte, 106 Posts | keine | nein | 0 | Yoast-Standard | Projekte und Blog: Content-Rückstand bei Projekten, bei Produkten nichts |
| **Dolce Vita / Designküche** (designkueche.at) | 30 | keine | nein | 0 | keins, keine Meta-Description | online fast unsichtbar |
| **Hutle** (hutle.com) | 25 | keine | nein | 0 | LocalBusiness | lokal ok, sonst dünn |
| **Gamma** (gamma.ch) | 85 Markenseiten, 7 Referenzen | keine | nein | 0 | WordPress-Standard | Markenseiten-Breite, kein Produkt-Long-Tail |
| **Fretz** (fretz.de, Concrete CMS) | 650, davon 584 „Sale“ | Sale-Seiten | (Sale) | 0 | keins | Stichprobe: Die Sale-URL aus der Sitemap liefert „Seite nicht gefunden“, die Sitemap ist also verwaist |
| **Seipp** (seipp.com, Shopware) | Shop | ja | **ja** (z. B. „1.856,00 €“ auf der Minotti-Seite) | 0 | – | einziger regionaler Shop mit Preisen; DE-Markt |
| **M-Studio** (m-studio.at) | 113 Portfolio, 186 Posts | nein | nein | 0 | LocalBusiness | Content-Maschine über Blog und Portfolio, rankt laut Report 02 für „minotti“ AT |
| Thöny (moebelthoeny.li) | Single-Page | nein | nein | 0 | – | – |
| Wohnhaus Widnau | Innenarchitektur-Seiten | nein | – | 0 | – | lokal SG |

**Ergebnis:** Kein regionaler Wettbewerber hat Modell-Produktseiten, Mehrsprachigkeit mit hreflang, Kollektions-Hubs, Ratgeber zu Kauffragen oder Product-Schema. Die Vertragshändler gewinnen nur über **Händlerverzeichnis-Links, Google-Bewertungen und Alter der Domain.** Mit Content und Technik ist der Abstand uneinholbar groß zu machen.

### 2.2 Was die Besten weltweit machen

| Vorbild | Gesehen | Übertragbar auf Platzhirsch |
|---|---|---|
| **Connox** (connox.com, Flos IC) | 17 hreflang, JSON-LD `ProductGroup` → `Product` + `Offer` + `OfferShippingDetails` + `ShippingDeliveryTime` + `MerchantReturnPolicy`; eine Seite für die ganze Modellreihe, Varianten per Parameter | **Kollektions-Hub = ProductGroup**; Offer erst mit Preisen |
| **RoyalDesign** (royaldesign.com/at) | `ProductGroup`, `Offer`, `AggregateRating`, Lieferzeit „1–2 Wochen“ im Snippet | Lieferzeit-Angabe als Text auch ohne Preis |
| **AmbienteDirect / Connox** (aus Erfahrung, nicht neu geprüft) | Magazin/Ratgeber, Designer-Seiten, Marke × Kategorie-Seiten („Flos Pendelleuchten“) | **Marke × Kategorie** und Designer-Seiten |
| **minotti.com / poliform.it** | 7–11 hreflang, Modellseiten pro Programm, Store-Locator | Original-Text ist die Konkurrenz für Modellsuchen → **eigener Mehrwert nötig** (Maße in cm, Ausstellung, Lieferung AT/DE/CH, Beratung) |
| **RH** (rh.com, Bot-Schutz 403) / **Conran Shop** | Galerie-/Store-Seiten mit Erlebnis; Conran: Organization + PostalAddress | Showroom als Ort mit Events (Café) – Event-Schema |

---

## 3. Konzept und Zielbild

**Leitbild: „Die Wissens- und Katalogautorität für italienisches Premium-Wohnen am Bodensee“.** Die Seite beantwortet jede Frage zwischen der Inspiration („Minotti Lawrence“) und dem Termin („Minotti Sofa ansehen Bodensee“) besser als der Hersteller (der nichts zur Region sagt) und besser als die Händler (die keine Produktseiten haben).

### 3.1 Keyword-Architektur (5 Ebenen)

| Ebene | Beispiele (DE / CH) | Seite (Ziel-URL) | Status |
|---|---|---|---|
| **1. Marke** | „minotti“ (AT ~500/Mon.), „poliform“ (AT ~350), „rimadesio“, „paola lenti“, „tuuci“ | `/de/ueber-uns/marken/minotti` | vorhanden, Inhalt + Links ausbauen |
| **2. Marke + Region** | „minotti vorarlberg“, „minotti bodensee“, „poliform st. gallen“, „minotti lindau“, „rimadesio österreich“ | **Markenseite** (Regionsabschnitt) – keine eigene Seite pro Stadt × Marke, außer Top-3-Kombis mit echtem Inhalt | Title vorhanden, Abschnitt fehlt |
| **3. Marke + Kategorie** | „minotti sofa“ (DE 450), „minotti outdoor“, „poliform kleiderschrank“, „poliform küche“, „flos pendelleuchte“, „paola lenti outdoor“ | **neu:** `/de/ueber-uns/marken/minotti/sofas` | fehlt |
| **4. Modell / Kollektion** | „minotti lawrence“, „minotti connery“, „poliform ventura“, „rimadesio velaris“, „minotti torii preis“ | **neu:** Kollektions-Hub `/de/ueber-uns/marken/minotti/lawrence` + Produktseiten | Produkte da, Hubs fehlen für Minotti |
| **5. Ratgeber / Kauffragen** | „was kostet ein minotti sofa“, „minotti lieferzeit“, „möbel aus österreich in die schweiz einführen“, „minotti oder b&b italia“, „outdoor möbel am see material“, „poliform küche preis“ | **neu:** `/de/ratgeber/<slug>` | fehlt |
| **6. Schweiz/FL** | „designermöbel st. gallen“, „möbel kaufen österreich schweiz mwst“, „minotti schweiz günstiger“, „offerte designmöbel“ | Schweiz-Hub `/de/einkaufen-aus-der-schweiz` + St. Gallen/Rheintal/Vaduz | St. Gallen vorhanden |
| **7. Generisch lokal** | „designermöbel vorarlberg“, „einrichtungshaus bodensee“, „küchenstudio vorarlberg“, „interior design vorarlberg“ | Startseite, Landingpages | vorhanden |

**Zuordnungsregel gegen Kannibalisierung:** eine Suchabsicht = eine URL. Marke+Region liegt auf der Markenseite, nicht auf der Stadtseite. Stadtseiten bedienen „Designermöbel + Stadt“. Produktseiten bedienen das konkrete Modellteil, der Kollektions-Hub die ganze Modellreihe („Lawrence“). Gepflegt wird das in einer Tabelle `src/lib/seo/keywordMap.js` (Keyword → kanonische URL), die auch die interne Verlinkung speist.

### 3.2 Seitentypen und Linkfluss (Zielbild)

```
Startseite
 ├─ Marken-Hub ─ Markenseite (Minotti) ──┬─ Marke × Kategorie (Minotti Sofas) ─┐
 │                                       ├─ Kollektion (Lawrence) ─────────────┼─► Produkt (Lawrence Sofa)
 │                                       └─ Regionsabschnitt + Ratgeber-Links  │       │
 ├─ Kategorie (Sofas) ── Marken-Facetten-Links (Minotti Sofas) ────────────────┘       │
 ├─ Ratgeber ─ verlinkt Produkte, Kollektionen, Termin ◄───────────────────────────────┘ (Produkt verlinkt „Ratgeber: Was kostet …“)
 └─ Regionen (Schweiz-Hub, St. Gallen, Lindau …) ─ verlinken Marken + Termin
```

---

## 4. Konkrete Features

Legende Aufwand: **S** ≤ 2 Tage, **M** 3–8 Tage, **L** > 8 Tage (1 Entwickler). „Sofort“ = ohne Backoffice-Zugang baubar.

### F1 – Claim-Guard und Deploy der Händler-Korrektur (P0, rechtlich)
- **Nutzen:** Es senkt das Abmahnrisiko (UWG) und schützt die Gespräche mit Minotti/Poliform. Die Suchbegriffe bleiben im Title.
- **Umsetzung:** (1) die lokal geänderte `marken/[title]/page.js` und `llms.txt/route.js` committen und deployen. (2) Neue Funktion `sanitizeClaims(text, brandSlug)` in `src/lib/seo/claimGuard.js`. Sie entfernt „Händler“, „autorisiert“, „offiziell“, „Vertragspartner“ aus CMS-Meta-Texten und Brand-Bios, solange die Marke nicht in einer Whitelist `VERIFIED_DEALER_BRANDS = ["classicon"]` steht. Angewendet wird sie in `marken/[title]/page.js` (description, og), `[collection]`, Produkt-Meta und `llms.txt`. (3) Build-Check `scripts/check-claims.mjs`: Er crawlt die Sitemap-Stichprobe und schlägt Alarm bei „Händler“.
- **Aufwand:** S · **Abhängigkeit:** keine (Backoffice-Pflege der Felder `metadata_description_*`, `dealers_title`/`dealers_description` später) · **Dateien:** `src/lib/seo/claimGuard.js` (neu), `marken/[title]/page.js`, `src/lib/marken/collectionPage.js`, `produkte/[category]/[product]/page.js`, `scripts/check-claims.mjs` (neu) · **Bibliotheken:** keine.

### F2 – Produktseiten als Long-Tail-Maschine (Titel, H1, Mehrwert-Block, FAQ)
- **Nutzen:** Das ist der größte Ranking-Hebel. Rund 1.790 Modelle mal 4 Sprachen ergeben ca. 7.100 Einstiegsseiten für Modellsuchen, bei denen kein Händler eine Seite hat.
- **Umsetzung:**
  1. **Title-Formel** (in `shopSeoCopy.js` → `productTitle({name, brand, typeSingular, locale})`): DE `Minotti Lawrence Sofa – Ausstellung am Bodensee | Platzhirsch`, EN `Minotti Lawrence Sofa – Showroom Lake Constance | Platzhirsch`, IT `Divano Minotti Lawrence – Showroom Lago di Costanza | Platzhirsch`. Dazu eine neue Map `CATEGORY_SINGULAR` je Sprache (`sofas-couches` → Sofa/sofa/canapé/divano; `beds` → Bett …) in `src/lib/seo/productCategories.js`. CMS-Titel gewinnen weiterhin, laufen aber durch den Claim-Guard.
  2. **H1** `Minotti Lawrence Sofa` (Marke als verlinkte Eyebrow bleibt).
  3. **Mehrwert-Block „Bei Platzhirsch“**, aus Daten generiert und damit einzigartig je Produkt: Maße als Tabelle in cm (aus `parseDimensions`), Material/Bezug, Designer mit Link zur Designer-Seite, Kollektion mit Link zum Hub (F4), „Weitere Teile der Serie“, Lieferung und Montage AT/DE/CH/FL (Fakten aus `src/lib/site.js`), Link zum Ratgeber „Was kostet …“ und „Lieferzeiten“, Termin-CTA mit `?produkt=`.
  4. **Produkt-FAQ (3 Fragen, Templates mit Daten):** „Kann ich {Modell} in Lochau ansehen?“ (ehrlich: „Teile der Kollektion …, bitte Termin, wir prüfen, welche Ausführung ausgestellt ist“, solange es kein Ausstellungs-Flag gibt), „Liefern Sie {Modell} in die Schweiz?“, „Welche Maße hat {Modell}?“. Ausgegeben als sichtbarer Text plus `FAQPage`. FAQ-Rich-Results zeigt Google seit 2023 kaum noch, aber für AI Overviews und LLMs zählt der Text.
  5. **Eigentext statt Herstelleranteil:** Für die Top-300-Produkte (nach Suchvolumen und Marke) je 120–200 Wörter Eigentext, offline vorgeschrieben mit lokalem LLM auf der NVIDIA-GPU (siehe F12), redaktionell geprüft und als JSON im Repo gespeichert (`src/lib/content/productCopy/{de,en,fr,it}.json`, Schlüssel `path_field`). Den Herstellertext kürzen: nur den ersten Absatz zeigen, den Rest hinter „Herstellerbeschreibung“ einklappen. So bleibt er im DOM, ist aber nicht der Kern der Seite.
  6. **Schema:** `category` mit dem lokalisierten Label statt „Sofas Couches“; `isRelatedTo`/`isSimilarTo` für verwandte Produkte; `isVariantOf` → ProductGroup des Kollektions-Hubs (F4); `sku` = Backoffice-ID; `additionalProperty` für Maße. Breite/Höhe/Tiefe als `width`/`height`/`depth` (QuantitativeValue, `unitCode: "CMT"`).
  7. **Breadcrumb mit Marke:** `Home › Produkte › Sofas › Minotti Sofas › Lawrence` (der Minotti-Sofas-Link zielt auf F3).
- **Aufwand:** M (Punkte 1–4, 6, 7) + L laufend (5: ca. 1–2 Wochen Redaktion für 300 Produkte × DE, Übersetzungen per LLM + Stichprobe) · **Abhängigkeiten:** keine für 1–4, 6, 7. Für ehrliche Aussagen zu „in der Ausstellung“ braucht es eine Liste der Ausstellungsstücke vom Team (als Repo-JSON oder Google Sheet, siehe F6) · **Dateien:** `src/app/[locale]/produkte/[category]/[product]/page.js`, `src/lib/seo/shopSeoCopy.js`, `src/lib/seo/productCategories.js`, `src/lib/seo/structuredData.js`, neu `src/components/ShopCatalog/productFacts.js`, `src/components/ShopCatalog/productFaq.js`, `src/lib/content/productCopy/*.json`, Übersetzungen in `src/messages/*.json` · **Bibliotheken:** `schema-dts` 2.1.0 (Apache-2.0, nur Typen, **0 KB Bundle**) für typsichere JSON-LD-Builder (JSDoc), optional.

### F3 – Marke × Kategorie-Seiten („Minotti Sofas“, „Poliform Kleiderschränke“)
- **Nutzen:** Das bedient Ebene 3 der Keyword-Architektur („minotti sofa“ DE 450/Monat, dazu „poliform küche“, „paola lenti outdoor“, „flos pendelleuchte“). Gleichzeitig ist es die fehlende Link-Brücke Marke → Produkt.
- **Umsetzung:** Die bestehende Route `src/app/[locale]/ueber-uns/marken/[title]/[collection]/page.js` erweitern. Ist das Segment ein lokalisierter Kategorie-Slug der Marke (Map `BRAND_CATEGORY_SLUGS`: DE `sofas`, `betten`, `esstische`, `outdoor`, `kleiderschraenke`, `kuechen`, `leuchten`; EN `sofas`, `beds`…; IT `divani`, `letti`…), rendert die Route die Marke × Kategorie-Seite. **Vorrang hat eine echte Collection**; beim Build wird geprüft, dass es keine Kollision gibt. Inhalt: H1 „Minotti Sofas“, 150–250 Wörter Einleitung (Repo-JSON, nur für die Top-25-Kombis; sonst generierter Satz mit Anzahl, Designer und Kollektionen), SSR-Produktgitter (alle, kein Load-more für Bots), Links zu den Kollektionen, FAQ, CTA. Schema `CollectionPage` + `ItemList` + `Brand` @id. Indexierbar nur ab ≥ 3 Produkten, sonst `noindex,follow`. Die Markenseite und die Kategorieseite verlinken die neuen URLs **statt `?marke=`**; die Kategorie bekommt einen Block „Nach Marke: Minotti Sofas · Poliform Sofas …“.
- **Aufwand:** M · **Abhängigkeiten:** keine (Daten aus `fetchProdukteNewByMarke`, `fetchKategorienByMarke`) · **Dateien:** `[title]/[collection]/page.js` (+ en/fr/it-Wrapper, falls vorhanden), neu `src/lib/marken/brandCategoryPage.js`, `src/lib/seo/brandCategorySlugs.js`, `src/components/MarkenItems/markenitems.js` (Links), `src/app/[locale]/produkte/[category]/page.js` (Marken-Links), `src/lib/seo/sitemapEntries.js` (getBrandEntries), `src/utils/routing.js` · **Bibliotheken:** keine.

### F4 – Kollektions-Hubs aus Produktnamen ableiten (Minotti ohne Backoffice-Collections)
- **Nutzen:** Das bedient Ebene 4 („minotti lawrence“, „connery“, „torii“, „poliform ventura“): eine starke Seite pro Modellreihe statt 5 schwacher Varianten-Seiten. Das entspricht dem `ProductGroup`-Modell von Connox und RoyalDesign.
- **Umsetzung:** `deriveFamilies(products)` in `src/lib/marken/families.js`: normalisiert `cleanProductName()` und gruppiert über das erste Namens-Token bzw. ein bekanntes Präfix („Lawrence“, „Lawrence Seating System“ → `lawrence`). Eine Ausnahmenliste im Repo (`src/lib/content/familyOverrides.json`) korrigiert Fehlgriffe, die Pflege ist minimal. Hubs ab ≥ 2 Produkten; eine echte Backoffice-Collection hat immer Vorrang. Die Route ist dieselbe wie F3 (`[collection]`-Segment), die Reihenfolge der Auflösung: Collection → Kategorie → Familie → 404. Inhalt: H1 „Minotti Lawrence – Sofas, Sessel & Elemente“, alle Teile, Designer, Jahr (falls vorhanden), Maße-Übersicht (Breiten-Spanne aus den Produktdaten), Eigentext (Top-50-Familien, Repo-JSON), FAQ („Was kostet Lawrence?“ → Ratgeber, solange keine Preise da sind). Schema `ProductGroup` (`productGroupID`, `hasVariant` → Produkt-@ids, `variesBy` nur wenn belegbar) + `BreadcrumbList`.
- **Aufwand:** M · **Abhängigkeiten:** keine · **Dateien:** neu `src/lib/marken/families.js`, `src/lib/content/familyOverrides.json`; `src/lib/marken/collectionPage.js`, `[title]/[collection]/page.js`, `structuredData.js` (`productGroupSchema`), `sitemapEntries.js`, Produktseite (Link „Alle Teile der Serie Lawrence“) · **Bibliotheken:** keine.

### F5 – Ratgeber-Bereich (Kauffragen, KI-Zitierfähigkeit)
- **Nutzen:** Ratgeber bedienen Ebene 5. Diese Fragen beantwortet heute niemand in der Region, und sie sind ideal für AI Overviews, ChatGPT und Perplexity, die Fakten mit Quelle zitieren. Laut Bericht 25 sind erste Plätze in 2–4 Monaten realistisch.
- **Umsetzung:** MDX-Dateien im Repo, keine CMS-Abhängigkeit. Route `src/app/[locale]/ratgeber/page.js` + `[slug]/page.js`, Inhalte `src/content/ratgeber/<slug>.<locale>.mdx` mit Frontmatter (title, description, updated, author, faq[], relatedProducts[], relatedBrands[]). Schema `Article` (author = echte Person aus dem Team mit `Person`-Seite, `dateModified`) + `FAQPage` + `BreadcrumbList`. Jede Seite beginnt mit einer **Antwort-Box (40–60 Wörter)**, die die Frage direkt beantwortet; das Format bevorzugen KI-Snippets. Danach Tabelle, Details, Produkt-Karten (SSR) und Termin-CTA. Ratgeber werden in `llms.txt` und in der Sitemap `sitemap-ratgeber.xml` ergänzt.
  - **Erste 8 Themen:** (1) Was kostet ein Minotti-Sofa? (Preisspannen nur mit belegbarer Quelle oder als „Richtwerte auf Anfrage“) (2) Was kostet eine Poliform-Küche? (3) Möbel in Österreich kaufen, in die Schweiz liefern: MWST 8,1 %, Verzollung, Ablauf (Bericht 18; Hinweis: Die Schweiz hat am 1.1.2024 die Industriezölle abgeschafft, vor Veröffentlichung mit dem Zollspediteur verifizieren) (4) Liechtenstein: Einkauf und Lieferung (5) Lieferzeiten italienischer Designmöbel (6) Minotti oder B&B Italia? Vergleich ohne Abwertung (7) Outdoor-Möbel am See: Teak, Aluminium, Seil, Stoffe (Tuuci, Paola Lenti) (8) Sofa-Bezüge: Stoff oder Leder, Pflege.
- **Aufwand:** M für das Gerüst, danach S pro Artikel (Entwurf LLM + 1–2 h Redaktion) · **Abhängigkeiten:** Fakten von Steuerberater und Spediteur (Schweiz), Preisspannen vom Inhaber · **Dateien:** neu `src/app/[locale]/ratgeber/**`, `src/content/ratgeber/*.mdx`, `mdx-components.js` (Pflicht für `@next/mdx` im App Router), `next.config.js` (`pageExtensions`, withMDX), `src/utils/routing.js` (`ROUTES.ratgeber` = /ratgeber, /guides, /guides, /guide), `src/proxy.js`, `sitemapEntries.js`, `llms.txt/route.js`, Footer/Nav · **Bibliotheken:** `@next/mdx` **16.3.4** (MIT, an die installierte Next-Version koppeln; die neueste ist 16.4.3), `@mdx-js/loader` 3.1.1 + `@mdx-js/react` 3.1.1 (MIT, Build-Zeit; Runtime ca. 1 KB), `remark-gfm` 4.0.1 (Tabellen, MIT, Build-Zeit), `rehype-slug` 6.0.0 (Anker, MIT, Build-Zeit), `gray-matter` 4.0.3 (MIT, Frontmatter, nur Server) **oder** Frontmatter als `export const meta` (ohne Abhängigkeit). Alles Server-/Build-seitig, also ca. 0 KB zusätzliches Client-JS.

### F6 – Preise und Offer-Schema (stufenweise)
- **Nutzen:** Preis-Snippets und kostenlose Shopping-Listings (Merchant Center). Kein Wettbewerber in AT/CH/FL zeigt Preise (nur Seipp in DE). Das bringt höhere CTR und qualifiziertere Anfragen.
- **Stufe A, sofort ohne Backoffice: Atelierverkauf/Ausstellungsstücke.** Die Daten kommen aus einem **Google Sheet** (vom Team gepflegt, als CSV veröffentlicht) oder einer Repo-JSON. Abruf per `fetch` mit `revalidate: 3600`, Validierung mit zod. Eine neue Seite `/de/atelierverkauf` plus Detailseiten mit echtem Preis. Schema `Product` + `Offer` (`price`, `priceCurrency: EUR`, `availability: InStock`, `itemCondition` je nach Zustand, `hasMerchantReturnPolicy`, `shippingDetails`). Bei Fernabsatz an Verbraucher ist das Widerrufsrecht zu beachten, die AGB legt der Anwalt fest.
- **Stufe B: „ab“-Preise für Hauptmodelle** aus demselben Sheet (Schlüssel `path_field` oder Familie). Schema `AggregateOffer` mit `lowPrice` auf Kollektions-Hub und Produkt. Preisangaben inkl. USt nach PrAG (AT) bzw. PAngV (DE). **Vorher klären, was Minotti und Poliform erlauben** (UVP-Politik, Online-Preisangaben).
- **Stufe C: Preisfeld im Backoffice** (Frappe) ersetzt das Sheet. Merchant-Center-Feed `/feeds/merchant.xml`.
- Bis dahin: **kein Fake-Offer** (kein `price: 0`, kein „Preis auf Anfrage“ als Offer). Google verlangt `price`, sonst gibt es Fehler in Search Console.
- **Aufwand:** A: M, B: S (nach A), C: M (blockiert) · **Abhängigkeiten:** Inventur und Preise der Ausstellungsstücke (Team), Herstellerfreigabe (B), Backoffice-Zugang (C), Bildrechte für Shopping (A: **eigene Fotos der Ausstellungsstücke**, das ist kein Problem) · **Dateien:** neu `src/lib/api/fetchPriceSheet.js`, `src/lib/seo/offerSchema.js`, `src/app/[locale]/atelierverkauf/**`, `src/app/feeds/merchant.xml/route.js` (C); `structuredData.js`, Produktseite, `sitemapEntries.js` · **Bibliotheken:** `zod` 4.6.7 (MIT, nur serverseitig, 0 KB Client) für die Validierung der Sheet-Daten; CSV-Parsing mit ca. 20 Zeilen Eigencode (keine Abhängigkeit nötig).

### F7 – Regionsseiten ohne Doorway-Risiko (Hub and Spoke, wenige, echte Fakten)
- **Nutzen:** Bedient „Designermöbel + Stadt“ und den Schweiz/FL-Markt (Ebene 6). Das ist der größte Geschäftshebel laut Masterkonzept 7.1.
- **Regeln (gegen Doorways):** höchstens **8 Regionsseiten** (vorhanden 5 Städte plus Bodensee/Vorarlberg; neu **Schweiz-Hub**, **Liechtenstein/Vaduz**, **Rheintal SG**; Feldkirch nur mit eigenem Inhalt). Jede Seite braucht **mindestens 4 regionsspezifische Fakten**, die auf keiner anderen Seite stehen: Fahrzeit und Route, Steuer- und Lieferablauf für das Land, Referenzprojekt(e) aus der Gegend mit Foto (eigene Fotos), regionale Ansprechperson, passende Marken mit Begründung, regionale Begriffe (CH: „Offerte“, „Schreiner“, „Stockwerkeigentum“). **Marke × Stadt nur für maximal 3 Kombis** (z. B. „Minotti Lindau“), und nur, wenn es echte Lindauer Referenzen gibt; sonst gehört das als Abschnitt auf die Markenseite.
- **Schweiz-Hub `/de/einkaufen-aus-der-schweiz`:** CHF-Rechner als kleine Client-Insel (Nettopreis EUR → CHF zum Tageskurs, + 8,1 % MWST, + Abfertigungspauschale, Lieferung). Die Formel steht in `src/lib/ch/calc.js`, der Kurs kommt per Server-Fetch von der EZB (`eurofxref-daily.xml`, kostenlos, tägliche Revalidierung). Wege A und B aus Bericht 18, Ablauf in 5 Schritten mit `HowTo`-ähnlichem Aufbau (kein HowTo-Rich-Result mehr), FAQ, Termin-CTA. Sprache de-CH (ss statt ß), zusätzlich FR- und IT-Versionen für die Romandie/das Tessin erst später.
- **Landingpages aufwerten:** 6–12 SSR-Produktlinks und Links zu Marke × Kategorie je Seite; Referenzen; konkrete Fakten statt Allgemeinplätzen. `LANDING_PAGES` wird um `region`, `country`, `facts[]` erweitert.
- **Aufwand:** M (Hub + Rechner), S pro Regionsseite · **Abhängigkeiten:** Fakten Steuer/Zoll (Steuerberater, Spediteur), Referenzfotos (Team), CHF-Festpreis-Prozess (Masterkonzept 7.1) · **Dateien:** neu `src/app/[locale]/einkaufen-aus-der-schweiz/page.js`, `src/app/[locale]/designermoebel-liechtenstein/page.js`, `src/app/[locale]/designermoebel-rheintal/page.js`, `src/components/Landing/chfCalculator.js` (Client, ca. 3 KB), `src/lib/ch/calc.js`, `src/lib/api/fetchEcbRate.js`; `src/lib/content/landingPages.js`, `src/components/Landing/landingPage.js` · **Bibliotheken:** keine (`fast-xml-parser` 5.11.2, MIT, nur Server, wäre für den EZB-Kurs optional; eine Regex reicht).

### F8 – Markenseiten zur stärksten Seite der Region machen
- **Nutzen:** Ebene 1 und 2 („minotti“, „minotti vorarlberg“) mit internem Linkfluss in den Katalog.
- **Umsetzung:** (1) SSR-Liste der Top-24-Produkte und aller Kollektionen bzw. Familien (F4) und Marke × Kategorie-Links (F3) direkt auf der Markenseite. (2) Eigentext 300–500 Wörter je Top-Marke und Sprache (Minotti, Poliform, Rimadesio, Paola Lenti, Tuuci, Flos, Tréca, ClassiCon), als Repo-JSON `src/lib/content/brandCopy.json`, solange kein Backoffice-Zugang besteht: was in Lochau zu sehen ist, Planungsleistung, Lieferung AT/DE/CH/FL, **neutral: „Minotti-Ausstellung in Lochau“**. (3) Regionsabschnitt „Für Vorarlberg, Bodensee, Ostschweiz und Liechtenstein“. (4) `ItemList` der Produkte im JSON-LD. (5) Bei ClassiCon (belegter Händler): „Offizieller ClassiCon-Händler“ inklusive Link zum Locator.
- **Aufwand:** M · **Abhängigkeiten:** keine; den Text liefert das Team (Redaktion) · **Dateien:** `src/components/MarkenItems/markenitems.js` (falls Client: Produktliste als Server-Komponente davor rendern), `marken/[title]/page.js`, neu `src/lib/content/brandCopy.json` · **Bibliotheken:** keine.

### F9 – Technische Hygiene (schnelle Gewinne)
| # | Änderung | Datei | Aufwand |
|---|---|---|---|
| a | AVIF zuerst: `formats: ["image/avif","image/webp"]` auch in prodConfig | `next.config.js` | S |
| b | `htmlLimitedBots`: Default-Liste + `GPTBot\|OAI-SearchBot\|ChatGPT-User\|PerplexityBot\|ClaudeBot\|Claude-SearchBot\|Bytespider\|Amazonbot`, damit on-demand gerenderte Seiten Metadaten im `<head>` haben | `next.config.js` | S |
| c | Live-Bug „Sofas Couches“ als Kategorie-Label/Schema: nach dem Deploy prüfen (der Code-Fix über `fetchKategorien` existiert) | Produktseite | S |
| d | Galerie-Thumbnails: `alt` = „Minotti Lawrence – Ansicht 2“ statt `""` (sie sind klickbar, also nicht dekorativ) | `src/components/ShopCatalog/productGallery.js` | S |
| e | Product-Schema: höchstens 5 Bilder statt 20 (Payload) | `structuredData.js` | S |
| f | OG-Locale und `inLanguage` vereinheitlichen (`de_AT`) | `pageMetadata.js`, `structuredData.js`, Markenseite | S |
| g | Markenseite auf `buildPageMetadata` umstellen (eine Canonical-Logik) | `marken/[title]/page.js` | S |
| h | Kollektionsseiten mit JSON-LD (`CollectionPage`/`ProductGroup`) | `collectionPage.js` | S |
| i | Image-Sitemap **nur für eigene Fotos** (Showroom, Referenzen, Atelierverkauf); Herstellerbilder erst nach Freigabe | `sitemapEntries.js` (`toUrlsetXml` um `image:image` erweitern) | S |
| j | Hero-LCP: Mobile-Crop via `<picture>`/`getImageProps()` (Next 16 Art Direction, `docs/01-app/03-api-reference/02-components/image.md`), `fetchPriority="high"` | `src/components/Home/Hero.js` | S |
| k | Organization-JSON-LD: `sameAs` (Instagram, Facebook, GBP-URL), Adresse nach Entscheidung Hausnummer 9/11 überall gleich | `src/app/[locale]/layout.js`, `src/lib/site.js` | S |
| l | robots: Entscheidung KI-Training (siehe F10) | `src/app/robots.js` | S |

### F10 – KI-Suche (AI Overviews, ChatGPT, Perplexity, Gemini) und llms.txt
- **Nutzen:** Kaufberatung läuft zunehmend über KI-Antworten. Zitiert werden Seiten mit klaren Fakten, Entitäten und Struktur. Die Händler sind hier nicht vorbereitet.
- **Umsetzung:**
  1. **llms.txt ausbauen**: Abschnitte Kategorien, Ratgeber, Regionen, „Fakten“ (Adresse, Öffnungszeiten, Lieferländer, Sprachen, Schweiz-Ablauf in 3 Sätzen, ausdrücklich **ohne Händler-Behauptung**). Neu **`/llms-full.txt`**: Markdown-Export der Ratgeber und Markenseiten-Eigentexte. Zusätzlich eine Markdown-Variante der Kernseiten unter `/{locale}/…/index.md` erst später, falls die Nachfrage messbar wird.
  2. **Robots-Entscheidung:** AI Overviews und AI Mode nutzen **Googlebot**, `Google-Extended` steuert nur Gemini-Training und Grounding. Empfehlung: `Google-Extended`, `GPTBot`, `ClaudeBot`, `Applebot-Extended` für HTML-Seiten **erlauben**. Die Inhalte sind Katalog und Marketing; Präsenz in Modellwissen bringt Markenbekanntheit. `/cmx/` und `/_next/image` für diese Trainingsbots sperren, als Kompromiss für die Bildrechte. Das muss der Inhaber entscheiden.
  3. **Antwortformat** auf Ratgeber, Marken- und Kollektionsseiten: Frage als H2, Antwort im ersten Satz, Fakten als Tabelle, Datum „aktualisiert am“, Autor mit Person-Schema (E-E-A-T).
  4. **Entitäten:** konsistente `@id`s (Organization, Brand, ProductGroup, Product, Person), `sameAs` zu Wikidata, falls ein Eintrag für Platzhirsch angelegt wird (Wikidata-Item ist S und kostenlos, mit Belegen).
  5. **Monitoring:** monatlich 30 Prompts („Wo kann ich Minotti am Bodensee ansehen?“, „Minotti Sofa Preis Österreich“) in ChatGPT, Perplexity und Google AI Mode; die Nennung von Platzhirsch wird in einer Tabelle protokolliert.
- **Aufwand:** S (1, 2), laufend (3–5) · **Abhängigkeiten:** Inhaberentscheidung zu robots · **Dateien:** `src/app/llms.txt/route.js`, neu `src/app/llms-full.txt/route.js`, `src/app/robots.js` · **Bibliotheken:** keine.

### F11 – Messung (Voraussetzung für Priorisierung)
- Search Console (Domain-Property `platzhirsch.studio`) und Bing Webmaster: Sitemap einreichen, Berichte „Seite mit Weiterleitung“, „Gecrawlt – nicht indexiert“ (Signal für dünne Produktseiten). Die GSC-Daten **wöchentlich in ein Sheet exportieren** (Looker Studio, kostenlos).
- GA4 Key Events: `generate_lead` existiert bereits in `src/lib/analytics.js`. Ergänzen um `select_content` (Marke × Kategorie, Familie), `view_item` (Produkt mit `item_brand`) und Ratgeber-Scrolltiefe.
- Lighthouse CI in einer GitHub Action auf 6 Vorlagen-URLs: `@lhci/cli` 0.15.1 (Apache-2.0, nur Dev/CI). Linkprüfung: `linkinator` 8.1.0 (MIT, Dev) als monatlicher Lauf gegen die Sitemap.
- Rank-Tracking 50 Kernbegriffe AT/DE/CH (z. B. SISTRIX ist schon im Einsatz).
- **Aufwand:** S · **Abhängigkeit:** Zugang zu Search Console · **Dateien:** `.github/workflows/lhci.yml` (neu), `lighthouserc.json` (neu), `src/lib/analytics.js`.

### F12 – Content-Fabrik mit lokaler GPU (wenig Pflege, viel Eigentext)
- **Nutzen:** Ein 5-Personen-Team schreibt keine 1.790 × 4 Texte von Hand. Mit dem Katalog als strukturierter Quelle und einem lokalen Modell entstehen Entwürfe; der Mensch prüft nur noch.
- **Umsetzung:** Skript `scripts/content/draft-product-copy.mjs`: Es liest Produkte über die bestehenden API-Fetcher (oder JSON-Export), erstellt einen Prompt mit **nur belegten Feldern** (Maße, Material, Designer, Kollektion, Kategorie) und dem Verbot von Händler-, Preis- und Verfügbarkeitsaussagen und schreibt Entwürfe nach `src/lib/content/productCopy/drafts/`. Eine Freigabe-Liste (`approved: true`) entscheidet, was live geht. Modell lokal via **Ollama** (z. B. Qwen3 14B oder Llama 3.x 8B in Q4 bei 12–16 GB VRAM). Es fallen keine API-Kosten an, und die Daten verlassen das Haus nicht. Übersetzung DE → EN/FR/IT mit demselben Modell, Stichproben durch Muttersprachler.
- **Qualitätsregeln:** keine erfundenen Fakten (Prompt + Prüfung: Jede Zahl im Text muss im Quellfeld stehen, automatisch per Regex), höchstens 30 % Überschneidung mit dem Herstellertext (Shingle-Vergleich im Skript), Kennzeichnung „Platzhirsch-Redaktion“.
- **Aufwand:** M (Skript) + laufend · **Abhängigkeiten:** GPU-PC, Ollama-Installation · **Dateien:** neu `scripts/content/*.mjs` (außerhalb `src/`) · **Bibliotheken:** `ollama` 0.6.4 (MIT, nur Skript, kein Bundle), `p-limit` 7.3.3 (MIT, Skript). Die Abstimmung mit [06-ki-raumplaner-gpu.md](06-ki-raumplaner-gpu.md) betrifft dieselbe GPU.

### F13 – Optional / später
- **Saubere Produkt-Slugs** (`minotti-lawrence-sofa` statt `sofas-lawrence`, `tables-connery` ist für ein Sofa sogar irreführend): als Alias-Schicht mit 308 machbar. **Jetzt nicht**: Kurz nach dem Relaunch wäre ein zweiter URL-Wechsel riskanter als der kleine Keyword-Vorteil in der URL. Neu entscheiden, wenn die GSC-Daten nach 3 Monaten stabil sind.
- **Designer-Seiten** (Rodolfo Dordoni, Vincenzo De Cotiis, Michael Anastassiades): `/de/designer/<slug>`, aus dem Feld `designer` generiert, ab ≥ 3 Produkten. Aufwand S–M.
- **Referenzprojekte als eigene Seiten** (Backlink-Magnet für Architekten und Hotels, vgl. reiter/m-studio): braucht Fotos und Freigaben der Kunden.
- **Event-Schema** für Adventsabend und Vernissagen (Café-Alleinstellung).
- **de-CH-Varianten** der Top-10-Seiten nur, wenn Inhalt und Preise (CHF) wirklich abweichen; sonst bleibt `de-CH` → de-Seite wie heute.

---

## 5. Risiken

| Risiko | Wo | Gegenmaßnahme |
|---|---|---|
| **UWG / Händler-Behauptung** | live: Title und Meta-Description Minotti („Händler“) | F1 sofort deployen, Claim-Guard, Build-Check |
| **Doorway Pages** | neue Regionsseiten, Marke × Stadt | höchstens 8 Regionsseiten, ≥ 4 einzigartige Fakten, Marke × Stadt höchstens 3 und nur mit Referenzen |
| **Thin / Duplicate Content** | Marke × Kategorie mit 1–2 Produkten, Familien-Hubs, Herstellertext | Indexierung erst ab Schwellen (≥ 3 bzw. ≥ 2), Eigentext-Programm F2/F12, Herstellertext einklappen |
| **Kannibalisierung** | Markenseite vs. Marke × Region vs. Stadtseite; Familie vs. Produkt | Keyword-Map (eine Absicht = eine URL), unterschiedliche H1 und Title-Muster |
| **Bildrechte** | Herstellerbilder in Image-Sitemap, Merchant Center, KI-Training | Image-Sitemap und Shopping nur mit eigenen Fotos oder nach Freigabe; `/cmx/` für Trainingsbots sperren |
| **Preisangaben** | Offer, „ab“-Preise | PrAG/PAngV: inkl. USt, korrekt und aktuell (Sheet mit Datum), Herstellerfreigabe; kein Fake-Offer |
| **KI-Halluzinationen im Eigentext** | F12 | Zahlenprüfung gegen Quellfelder, menschliche Freigabe, keine Aussagen zu Preis oder Verfügbarkeit |
| **Performance** | Marke × Kategorie mit großen Gittern, RSC-Payload | SSR-Gitter mit `next/image` und `sizes`, Payload-Budget 300 KB HTML, LHCI-Grenzwerte |
| **Build-Zeit** | +Familien, +Marke × Kategorie, +Ratgeber × 4 Sprachen (heute 7.560 statische Seiten, ca. 2 min) | neue Seiten per ISR (`dynamicParams`, `revalidate`) statt alles vorzurendern; nur die Top-N in `generateStaticParams` |
| **Pflegeaufwand** | Texte in Repo-JSON statt Backoffice | ein Ordner `src/lib/content/`, ein Sheet für Preise und Ausstellungsstücke; später ins Backoffice migrieren |
| **Route-Kollision** | `[collection]`-Segment für Collection, Kategorie und Familie | feste Auflösungsreihenfolge, Build-Check auf doppelte Slugs pro Marke |

---

## 6. Priorisierte Reihenfolge

### 6.1 SOFORT baubar (ohne Backoffice-Zugang)

| Prio | Feature | Aufwand | Erwarteter Effekt |
|---|---|---|---|
| 1 | **F1** Claim-Guard + Deploy der Händler-Korrektur | S | rechtliche Sicherheit, Voraussetzung für alles |
| 2 | **F9** a, b, c, d, e, f, g, h, k (technische Hygiene) | S (gesamt ca. 3 Tage) | sauberere Signale, AVIF, KI-Bots |
| 3 | **F3** Marke × Kategorie-Seiten + Links statt `?marke=` | M | Ranking „minotti sofa“ u. Ä., Linkfluss in 1.790 Produkte |
| 4 | **F2** Produkt-Title/H1/Mehrwert-Block/FAQ/Schema/Breadcrumb (Teile 1–4, 6, 7) | M | Long-Tail auf ca. 7.100 URLs, höhere CTR |
| 5 | **F4** Kollektions-Hubs (abgeleitete Familien) | M | Modellsuchen („minotti lawrence“) |
| 6 | **F8** Markenseiten mit Produktliste und Eigentext | M | Ebene 1 und 2 |
| 7 | **F5** Ratgeber-Gerüst + erste 3 Artikel (Schweiz, Lieferzeiten, Outdoor-Material) | M | schnelle erste Plätze, KI-Zitate |
| 8 | **F10** llms.txt/llms-full.txt, robots-Entscheidung | S | KI-Sichtbarkeit |
| 9 | **F11** Messung (LHCI, GSC-Export, Events) | S | Steuerung |
| 10 | **F12** Content-Fabrik (Skript), danach F2 Teil 5 laufend | M + laufend | Eigentext in der Breite |
| 11 | **F7** Schweiz-Hub mit CHF-Rechner + FL + Rheintal | M | größter Geschäftshebel; die Fakten liefern Steuerberater und Spediteur (keine Backoffice-Abhängigkeit) |
| 12 | **F6 A** Atelierverkauf mit echten Preisen (Sheet) | M | Liquidität laut Masterkonzept + erste Offer-Snippets |

### 6.2 Blockiert oder abhängig

| Feature | Blocker | Brücke bis dahin |
|---|---|---|
| F6 B „ab“-Preise | Herstellerfreigabe Minotti/Poliform, Preise vom Inhaber | Ratgeber „Was kostet …“ mit Spannen „auf Anfrage“ |
| F6 C Preisfeld + Merchant-Feed | Backoffice-Schreibzugang (Frappe-Feld `preis`, `in_ausstellung`, `lieferzeit`) | Google Sheet (F6 A/B) |
| „In der Ausstellung“-Angabe je Produkt | Ausstellungs-Flag im Backoffice | Liste der Ausstellungsstücke im Sheet |
| CMS-Meta-Texte bereinigen (`metadata_description_*`, `dealers_*`) | Backoffice-Zugang | Claim-Guard F1 filtert im Frontend |
| Image-Sitemap/Shopping mit Herstellerbildern | Bildrechte der Marken | nur eigene Fotos |
| Referenzprojekt-Seiten, Regionsfakten | Fotos und Kundenfreigaben, Steuer-/Zollfakten | generische, aber korrekte Aussagen |
| Händler-Formulierung „Händler“ | Vertrag + Verzeichniseintrag | „Ausstellung in Lochau“ |

### 6.3 Liste der Code-Änderungen (Kompakt)

1. `src/lib/seo/claimGuard.js` (neu) → eingebunden in `marken/[title]/page.js`, `src/lib/marken/collectionPage.js`, `produkte/[category]/[product]/page.js`, `src/app/llms.txt/route.js`
2. `src/lib/seo/shopSeoCopy.js`: `productTitle()` mit Produktart + Ort, je Sprache; `src/lib/seo/productCategories.js`: `CATEGORY_SINGULAR`
3. `src/app/[locale]/produkte/[category]/[product]/page.js`: H1 Marke + Modell + Art, Breadcrumb mit Marke × Kategorie, Mehrwert-Block, FAQ, Familien-Link
4. `src/components/ShopCatalog/productFacts.js`, `productFaq.js` (neu)
5. `src/lib/seo/structuredData.js`: `productSchema` (Maße, Label, ≤ 5 Bilder, `isVariantOf`), `productGroupSchema`, `faqSchema`, `articleSchema`, `offerSchema` (später)
6. `src/app/[locale]/ueber-uns/marken/[title]/[collection]/page.js` + `src/lib/marken/brandCategoryPage.js`, `families.js`, `src/lib/seo/brandCategorySlugs.js` (neu): Auflösung Collection → Kategorie → Familie
7. `src/components/MarkenItems/markenitems.js` + `marken/[title]/page.js`: SSR-Produktliste, Links auf Marke × Kategorie, `buildPageMetadata`, Eigentext aus `src/lib/content/brandCopy.json`
8. `src/app/[locale]/produkte/[category]/page.js`: Block „Nach Marke“
9. `src/lib/seo/sitemapEntries.js`: Marke × Kategorie, Familien, Ratgeber, Regionsseiten; `image:image` für eigene Fotos
10. `src/app/[locale]/ratgeber/**`, `src/content/ratgeber/*.mdx`, `mdx-components.js`, `next.config.js` (withMDX, `pageExtensions`), `src/utils/routing.js`, `src/proxy.js`
11. `next.config.js`: AVIF zuerst in prod, `htmlLimitedBots`
12. `src/app/robots.js`: Trainingsbots erlauben, `/cmx/` für sie sperren (nach Entscheidung)
13. `src/app/llms.txt/route.js` ausbauen, `src/app/llms-full.txt/route.js` (neu)
14. `src/app/[locale]/einkaufen-aus-der-schweiz/page.js`, `designermoebel-liechtenstein`, `designermoebel-rheintal`, `src/components/Landing/chfCalculator.js`, `src/lib/ch/calc.js`, `src/lib/api/fetchEcbRate.js`; `src/lib/content/landingPages.js` erweitern
15. `src/lib/api/fetchPriceSheet.js`, `src/app/[locale]/atelierverkauf/**`
16. `src/app/[locale]/layout.js`: Organization `sameAs`; OG-Locale vereinheitlichen
17. `scripts/check-claims.mjs`, `scripts/content/draft-product-copy.mjs`, `.github/workflows/lhci.yml`, `lighthouserc.json`

### 6.4 Bibliotheken (Übersicht)

| Paket | Version | Lizenz | Bundle (Client) | Zweck |
|---|---|---|---|---|
| `@next/mdx` | 16.3.4 (= installierte Next-Version) | MIT | 0 KB (Build) | Ratgeber in MDX |
| `@mdx-js/loader` / `@mdx-js/react` | 3.1.1 | MIT | ca. 1 KB | MDX-Kompilierung/Provider |
| `remark-gfm` | 4.0.1 | MIT | 0 KB (Build) | Tabellen in Ratgebern |
| `rehype-slug` | 6.0.0 | MIT | 0 KB (Build) | Anker-IDs |
| `gray-matter` (optional) | 4.0.3 | MIT | 0 KB (Server) | Frontmatter |
| `schema-dts` (optional) | 2.1.0 | Apache-2.0 | 0 KB (nur Typen) | typsichere JSON-LD |
| `zod` | 4.6.7 | MIT | 0 KB (nur Server) | Validierung Preis-Sheet |
| `ollama` | 0.6.4 | MIT | – (Skript) | lokale Textentwürfe |
| `p-limit` | 7.3.3 | MIT | – (Skript) | parallele Skriptläufe |
| `@lhci/cli` | 0.15.1 | Apache-2.0 | – (CI) | Lighthouse CI |
| `linkinator` | 8.1.0 | MIT | – (Dev) | Linkprüfung |

Kein Paket landet im Client-Bundle außer dem MDX-Provider. Next 16 bringt Sitemaps, robots, Metadaten, OG-Bilder (`ImageResponse`) und `next/image` mit. **`next-sitemap` oder `next-seo` werden nicht gebraucht.**

---

## Quellen (Auswahl, geprüft 26.10.2026)

- Live-Prüfung: `https://platzhirsch.studio/{robots.txt, sitemap.xml, sitemap-*.xml, llms.txt, de/ueber-uns/marken/minotti, de/produkte/sofas-couches/sofas-lawrence, de/produkte/sofas-couches, de/designermoebel-st-gallen}`
- Wettbewerber: hoettges.at (+ `/sitemap_index.xml`), reiter.design, designkueche.at, hutle.com, gamma.ch, fretz.de, seipp.com/marken/minotti/, m-studio.at, moebelthoeny.li, wohnhauswidnau.ch
- Benchmark: [connox.com Flos IC](https://www.connox.com/categories/lighting/pendant-luminaires/flos-ic-pendant-lamp.html), [royaldesign.com/at IC Lights S1](https://royaldesign.com/at/ic-lights-s1-pendant?p=130000), [minotti.com/de/lawrence](https://www.minotti.com/de/lawrence), poliform.it/de, conranshop.co.uk
- Next.js 16 Doku (lokal): `01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`, `…/robots.md`, `04-functions/generate-metadata.md` (Streaming Metadata, htmlLimitedBots), `02-guides/json-ld.md`, `02-components/image.md`
- npm-Registry (Versionen/Lizenzen per `npm view`, 26.10.2026)
