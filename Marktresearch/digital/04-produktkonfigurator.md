# 04 – Bauplan Produktkonfigurator (Sofas, Schränke, Outdoor-Schirme)

**Stand:** 26.10.2026 · Rolle: Konfigurator-Konzept · Grundlage: Website-Code (Next.js 16.2, React 19.2, Tailwind 4, next-intl 4), Live-API backoffice.platzhirsch.studio (abgefragt am 26.10.2026), Berichte 00, 13, 15, 20, 23 (Abschn. 1, 4, 9, 10), 25, Web-Recherche
**Kurzfassung:** Kein 3D-Konfigurator jetzt. Stattdessen ein **„Planer“ in 2D (Draufsicht/Ansicht als eigene SVG-Zeichnung)**, der aus jeder Konfiguration eine **qualifizierte Anfrage** macht. Das passt zur Vorgabe im Masterkonzept (Abschn. 9: „Nicht jetzt: eigener 3D/AR-Konfigurator“), umgeht das Bildrechte-Problem vollständig und ist zu großen Teilen **ohne Backoffice-Zugang** baubar. 3D kommt nur über Herstellerdaten oder Roomle, und erst, wenn eine Marke das liefert.

> Leitplanken aus dem Geschäftskontext: keine Händler-Behauptungen (kein „offizieller Minotti-Konfigurator“, kein „autorisierter Händler“), keine Herstellerbilder ohne Freigabe als Konfigurator-Ebenen, Pflegeaufwand für ein Team von ~5 Personen minimal, jede Konfiguration endet in Merkliste/Anfrage (kein Online-Kauf von Neuware).

---

## 1. Ist-Zustand im Code

### 1.1 Was es schon gibt (und wiederverwendet wird)

| Baustein | Datei | Stand | Bedeutung für den Konfigurator |
|---|---|---|---|
| Produktdetailseite | `src/app/[locale]/produkte/[category]/[product]/page.js` (462 Z.) | Server Component, ISR über `fetchProduktNewByPathField`, JSON-LD `Product` ohne `Offer` | Einstiegspunkt: Button „Zusammenstellung planen“ und ein nachgeladener Planer-Abschnitt |
| Produktdaten-Mapping | `src/lib/shop/shopProducts.js` → `toShopProductDetail()` | liefert `images`, `descriptionParagraphs`, `dimensionsRaw`, `materialRaw`, `colorRaw`, `weightRaw` | Für Konfiguratoren zu dünn, siehe 1.2 |
| Maßzeichnung | `src/components/ShopCatalog/dimensionDiagram.js` | schematische SVG-Maßskizze (Rechteck/Kreis) aus dem `dimensions`-String | **Vorbild und Keimzelle** für die 2D-Vorschau: gleiche Bildsprache (Linien #30373e, Bemaßung #d1b250) |
| Merkliste | `src/context/CartContext.js`, `src/lib/shop/wishlistItem.js`, `src/components/ShopCatalog/productActions.js`, `wishlistHeart.js` | localStorage-Key `cart`, Eintrag `{id, name, image, category, kategories, url_slug, href, produkte_id, quantity}` | Muss ein Feld `configuration` bekommen. **Achtung:** `generateCartItemId()` = `id-name-category` – zwei Konfigurationen desselben Sofas würden als Duplikat abgewiesen |
| Merkliste-Seite | `src/app/[locale]/merkliste`, `src/components/CartPage/CartPage.js` | Liste + Anfrageformular | Zeigt künftig die Konfigurationszusammenfassung und die Mini-Zeichnung |
| Anfrageformular | `src/components/AnfrageFormProduct/AnfrageFormProduct.js` | sendet `produkte: [produkte_id…]` und Freitext `anfrage_beschreibung` | **Schlüsselstelle:** Die Konfiguration kann **heute schon** ohne Backoffice-Änderung als strukturierter Text in `anfrage_beschreibung` mitgeschickt werden |
| Anfrage-API | `src/app/api/anfrage_produkt/route.js` | Proxy auf `…anfrage_produkt.api.create_anfrage`, Pflichtfelder geprüft | Hier wird die Konfiguration serverseitig geprüft (zod) und in den Freitext gerendert |
| Tracking | `src/lib/analytics.js` (`trackEvent`, `trackLead`) | GA4 über Consent Mode v2, `generate_lead` mit `form` | Neue Events `configurator_start/step/complete`, Lead mit `form: "konfigurator"` |
| Filterstammdaten | `src/lib/api/fetchFarben.js` (Farbe mit `hex_code`, 4 Sprachen), `fetchMaterialien.js` | Frappe-Doctypes `Produkte Farbe`, `Produkte Material` | Farbnamen + Hex für Stoff-Platzhalter wiederverwendbar |
| Kollektionen | `src/lib/api/fetchCollections.js`, `src/lib/marken/collectionPage.js` | Kollektionen je Marke | Konfigurator-Familie ↔ Kollektion verknüpfen |
| Routing | `src/utils/routing.js` (`ROUTES`), `src/proxy.js` (Next 16: `middleware` heißt jetzt `proxy`, siehe `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`) | übersetzte Pfade je Sprache | Neue Route „Planer“ muss in `ROUTES` und in die `pathnames`-Tabelle/Regex in `proxy.js` |
| Abhängigkeiten | `package.json` | nur next, react, next-intl, lucide-react, react-slick … – **keine 3D-/Canvas-/State-Bibliothek** | Bundle ist schlank; das soll so bleiben |

### 1.2 Was die Daten heute hergeben (Live-API, 26.10.2026)

| Marke | Produkte im Katalog | Relevante Kategorien | Konfigurator-relevante Daten im Backoffice |
|---|---|---|---|
| Minotti | 487 | `sofas-couches` 62, `armchairs-stools` 96, … | Beispiel **Lawrence** (`sofas-lawrence`): 20 Bilder, sehr gute Texte in 4 Sprachen, aber `additional_information: []`, `pdf_produkte: []`, `designer: null`. **Keine Elemente, keine Maße, keine Stoffe, keine Preise.** |
| Poliform | 103 | `wardrobes`: Senzafine Wardrobe, Senzafine Walk-in, Ubik, Lexington Night System; 15 Sofas (Westside, Bellport, Mondrian …) | dito, nur Bilder + Texte |
| Rimadesio | 63 | `wardrobes`: Cover, Cover Freestanding, Cover Open, Dress Bold, Hedon, Zenit | dito |
| Umbrosa | 16 | `parasols`: Icarus, Versa, Eclipsum, Nano, Paraflex, Spectra, Infina, Ingenua, Nata, Umbrosa Bases | dito |
| Tuuci | 15 | nur Bleau/Brickell-Sitzmöbel und Liegen | **Kein einziger Tuuci-Schirm im Katalog** – vor einem Schirm-Planer müssen die Schirme (Ocean Master, Bay Master, Plantation) erst angelegt werden |

**Folgerung:** Der Katalog ist ein Bild-und-Text-Katalog. Alles, was einen Konfigurator ausmacht (Elemente mit Breite/Tiefe, Verbindungsregeln, Bezugsgruppen, Fußvarianten, Preisgruppen), fehlt und muss **außerhalb des Backoffice** gepflegt werden, solange es keinen Schreibzugang gibt. Der Vorschlag unten legt diese Daten als versionierte Konfigurationsdateien im Repo ab und plant einen späteren Umzug in einen Frappe-Doctype.

### 1.3 Was der Hersteller frei liefert (Beispiel Minotti Lawrence, minotti.com)
- 6 vorgeplante Kompositionen („LAWRENCE 01–06“) mit Elementliste und PDF.
- Elementtypen: Element mit 1 Armlehne (hoch/niedrig, mehrere Breiten), Mittelelement (mehrere Breiten), Eckelement, Sofa, Ecksofa, Couch, Chaiselongue; Variante „Clan“ mit Ottomane, abnehmbarer Rücken-/Armlehne; Lendenkissen, Zierkissen.
- 2D-DWG und Revit-BIM (RFA) zum Download; **kein** Online-Konfigurator, **keine** Stoffauswahl, **kein** Preis, nur Store-Locator.
- Poliform: technische Kataloge als PDF (z. B. `Poliform_Night_Systems_Technical_SENZAFINE_2026.pdf`), Planung läuft über den Händler (Aufmaß, Ansichten, 3D-Renderings). **Kein Self-Service-Konfigurator.**

Das ist die eigentliche Chance: **Die Hersteller planen selbst nicht online.** Ein guter Planer, der Elementlisten und Maße der Hersteller übersichtlich und spielbar macht, gibt es im Premium-Segment der Region nicht.

---

## 2. Benchmark

### 2.1 Die Besten weltweit

| Anbieter | Was sie machen | Technik | Was wir übernehmen |
|---|---|---|---|
| **USM Haller** | Offizieller 3D-Konfigurator mit Live-UVP, Konfigurations-ID, DWG-Export, Weitergabe an Händler („teilen Sie Ihre Configuration ID“) | eigenes 3D | **Konfigurations-ID/Share-Link** als Währung zwischen Kunde und Verkäufer; Live-Preisrahmen |
| **Roche Bobois Mah Jong 3D** | App (iOS/Android) zum Bauen aus Kissen, Stoffe von Gaultier/Kenzo/Missoni, AR, Projekte speichern; Website-Hinweis „nicht alle Farben online sichtbar – im Showroom prüfen“ | native App, 3D/AR | ehrlicher Farbhinweis, Speichern/Teilen; App ist für uns zu teuer |
| **Vitra (Soft Modular, Tyde u. a.)** | Konfiguratoren mit Modulen/Bezügen, Händler-Weitergabe | 3D | Modul-Logik, Händlerübergabe (Seite war für den Abruf gesperrt, Details nicht verifiziert) |
| **Bolia** | bis zu 5 Stoffmuster gratis, nach Hause oder in den Store; persönliches Angebot mit Mustern; Fertigung 8–10 Wochen | Shop + Store | **Stoffmuster-Bestellung als Lead-Magnet** |
| **Sofacompany, Hay, onehouse** | Sofa-Konfigurator in wenigen Schritten (Modell → Größe/Module → Stoff → Füße), Stoffmuster, Lieferzeit | 2D-Fotolayer oder 3D | 3–4-Schritte-Ablauf, Lieferzeit im Ergebnis |
| **Scandic Sofa (Fallstudie AR-range)** | Modularsofa bewusst **ohne 3D**: isometrisches Raster, fertige Module platzieren, Live-Preis, Set mit einem Klick in den Warenkorb | 2D | **Beleg, dass 2D für Modulsofas reicht** |
| **Threekit** | Enterprise-3D/CPQ, inzwischen „AI Sales Agent“; Preise individuell, Drittschätzung 50–150 T$/Jahr | 3D-SaaS | zu groß für uns |
| **Zakeke** | 3D/AR-Konfigurator-SaaS für Shopify/WooCommerce, ab ca. 30–150 $/Monat (Quellen uneinheitlich) | 3D-SaaS | nur sinnvoll mit eigenen 3D-Modellen, die wir nicht haben |
| **Roomle (Linz, AT)** | Rubens-Konfigurator (3D, AR im Browser, Raumplaner), white label; Preise inoffiziell 850–1.450 €/Monat (Drittquelle), anderswo „ab 100–140 €/Monat“ für den Viewer. Roomle hält **keine Preise**, Preise kommen aus dem eigenen Shop/Backend | iframe + `@roomle/embedding-lib`, Callback `onRequestProduct(configurationId, image, partlist, price, labels, configuration)` | **Integrationsoption, siehe 2.3** |

### 2.2 Regionale Wettbewerber (geprüft 26.10.2026)

| Wettbewerber | Konfigurator | Preise | Merkliste/Anfrage | Bemerkung |
|---|---|---|---|---|
| **Höttges** (hoettges.at) | nein | nein | nein, „Termin“ = mailto | kein Produktkatalog online |
| **reiter design** (reiter.design) | nur **USM-Konfigurator** (Hersteller-Tool) | nein | Produktsuche, Sale | kein eigener Planer |
| **Bihler** (Ravensburg) | USM-/Montana-Konfiguratoren (Hersteller) | – | – | Skandi/Office (Bericht 20) |
| Dolce Vita, Hutle, Thöny, Gamma, Fretz | in den Berichten 16/20 kein Konfigurator belegt | nein | – | Gamma/Fretz mit Online-Termin |

**Lücke:** Niemand in der Region bietet für Minotti, Poliform, Rimadesio oder Outdoor-Schirme eine Planungs- oder Konfigurationshilfe. Wo es Konfiguratoren gibt, sind es eingebettete Hersteller-Tools (USM, Montana). Ein eigener, markenübergreifender Planer ist ein echtes Alleinstellungsmerkmal und erzeugt Inhalte, die Google und KI-Suchen gut auswerten können („Minotti Lawrence Elemente und Maße“, „Poliform Senzafine Kleiderschrank planen“).

### 2.3 Roomle als Integrationsoption: Bewertung

| Kriterium | Bewertung |
|---|---|
| Nähe | Linz, Österreich, deutschsprachig, DSGVO-Raum |
| Inhalte | Roomle lebt davon, dass **Hersteller** ihre Produkte mit Logik und 3D anlegen (Beispiele: Biohort, ADA Möbelwerke). Für Minotti, Poliform, Rimadesio, Tuuci, Umbrosa wurde **kein Roomle-Content gefunden**. Ohne Hersteller-Content müsste Platzhirsch jedes Produkt selbst modellieren lassen (5-stellige Beträge pro Familie, und ohne Lizenz der Marke rechtlich heikel) |
| Kosten | inoffiziell 850–1.450 €/Monat für Konfigurator-Pläne + Projektaufwand; für 5 Leute nur bei messbarem Lead-Effekt vertretbar |
| Technik | gut: iframe-Einbettung, `@roomle/embedding-lib` 8.2.1 (MIT, ca. 130 kB entpackt, lädt eigentliche Engine im iframe), `onRequestProduct` liefert Konfigurations-ID, Bild, Stückliste → passt 1:1 in unsere Merkliste |
| Performance | iframe mit WebGL; nur auf Klick laden, nie im ersten Seitenaufbau |

**Empfehlung:** Roomle **nicht** als Grundlage, sondern als **Adapter** einplanen. Konkreter Schritt (Aufwand 1 Mail + 1 Termin): Roomle fragen, (a) welche der 36 geführten Marken Rubens-Content haben und ob Händler ihn lizenzieren dürfen, (b) Händlerpreis ohne Eigenmodellierung. Der eigene Planer bekommt ein Feld `provider` (`"platzhirsch-2d" | "roomle" | "hersteller-link"`), damit eine Roomle-Konfiguration später dieselbe Merkliste und dieselbe Anfrage nutzt.

---

## 3. Konzept und Zielbild

### 3.1 Grundidee: „Planen statt Konfigurieren“
Premium-Kunden kaufen ein Minotti-Sofa nicht per Klick. Sie wollen wissen: **Passt es in meinen Raum? Welche Elemente gibt es? Was kostet so etwas ungefähr? Kann ich die Stoffe sehen?** Der Planer beantwortet genau das und übergibt dann an den Menschen (Termin, Muster, Aufmaß). Erfolg wird nicht in Online-Umsatz gemessen, sondern in **qualifizierten Anfragen mit Konfiguration** (Ziel: Abschlussquote deutlich über der einer leeren Kontaktanfrage).

### 3.2 Drei Planer, ein Kern

| Planer | Vorschau | Eingaben | Ergebnis |
|---|---|---|---|
| **Sofa-Planer** (Minotti, Poliform, später Living Divani, Treca-Betten analog) | **Draufsicht (Grundriss) als SVG**, maßstäblich, optional im eigenen Raumrechteck mit Türen/Fenstern; Elemente als eigene Vektorformen, eingefärbt mit dem gewählten Bezug | Modell → Form (gerade, L, U, Insel) oder Vorlage (Herstellerkomposition 01–06) → Elemente tauschen/hinzufügen → Bezugsart (Stoff/Leder) und Farbe → Füße/Gestell → Kissen | Elementliste mit Maßen, Gesamtbreite/-tiefe, Preisrahmen „ab“, Lieferzeit-Rahmen, Share-Link, PDF-Merkblatt |
| **Schrank-Planer** (Poliform Senzafine/Ubik, Rimadesio Cover/Zenit/Dress) | **Frontansicht (Aufriss) als SVG** mit Nischenmaß, Rastermodulen, Türart; zweite Ansicht „innen“ mit Böden/Schubladen/Stangen | Nische (B×H×T, Dachschräge ja/nein) → System → Türart (Flügel, Schiebe, offen, begehbar) → Front-Oberfläche/Glas → Innenausstattung | Modulvorschlag, „Aufmaß-Termin anfragen“ als Haupt-CTA |
| **Schirm-Finder** (Umbrosa sofort, Tuuci nach Katalogpflege) | **Draufsicht Schattenfläche** über Tischgruppe/Liegen, Seitenansicht Masthöhe | Einsatz (Privat/Hotel/Gastro), zu beschattende Fläche oder Tisch für N Personen, Form (rund/quadratisch/rechteckig), Mittelmast oder Ampel, Befestigung (Bodenhülse, Plattenfuß, Wand), Bespannungsfarbe, Gestellfarbe, Extras (LED, Heizung, Schutzhülle, Motor) | Modellvorschlag, Windhinweis, Wintereinlagerung als Service-Option, Hotel-Frühbucher-Hinweis |

**Gemeinsamer Kern** (einmal gebaut, dreimal genutzt):
1. **Konfigurationsschema** je Produktfamilie (Elemente, Maße, Regeln, Optionen, Preisanker) als JSON-artige JS-Datei, validiert mit zod.
2. **Zustandsmodell** im Browser, im URL-Parameter gespeichert (teilbar, rückholbar, ohne Server).
3. **SVG-Renderer** (Draufsicht/Aufriss) im Stil von `dimensionDiagram.js`.
4. **Zusammenfassung** (Elementliste, Maße, Preisrahmen) – identisch auf Seite, Merkliste, PDF und in der Anfrage.
5. **Übergabe** an Merkliste und Anfrage (`anfrage_beschreibung` heute, eigenes Feld später).

### 3.3 Warum 2D statt 3D

| | 2D-Planer (eigene SVG-Zeichnung) | 2D-Fotolayer (Sofacompany-Stil) | 3D/AR (Roomle, three.js) |
|---|---|---|---|
| Bildrechte | **keine** – eigene Zeichnung aus Maßangaben (Fakten) | braucht freigestellte Herstellerfotos pro Element×Stoff → ohne Freigabe nicht machbar | braucht 3D-Modelle; Herstellermodelle (Revit/DWG) unterliegen deren Nutzungsbedingungen, Eigenmodellierung berührt Design-/Urheberrecht |
| Datenaufwand | Elementliste + Maße je Familie (½–1 Tag pro Familie) | hunderte Bildebenen pro Familie | 3D-Modell + Materialien je Element |
| Bundle | ~0 kB Zusatzbibliothek (SVG + React) | klein | 150–250 kB gzip + Modelle (MB) |
| Aussagekraft für Premium | hoch für „passt es?“, gering für „wie sieht es aus?“ – das zeigen die 20 Produktfotos und der Showroom | hoch | hoch, aber Uncanny-Valley-Risiko bei Stoffen |
| Pflege | gering | hoch | hoch |

Der Look entsteht durch die Kombination: **Galerie (wie es aussieht) + Planer (ob es passt) + Muster/Showroom (wie es sich anfühlt).**

### 3.4 Preisrahmen „ab“ ohne Preisfeld
- Stufe 0 (sofort): **kein Betrag**, sondern „Preis auf Anfrage – Richtpreis in 24 h“ und ein Preisklassen-Hinweis (z. B. „Sofaprogramme dieser Kategorie liegen typischerweise im fünfstelligen Bereich“) nur dort, wo der Inhaber das freigibt.
- Stufe 1 (nach Freigabe der Hersteller zur Preisangabe, siehe Bericht 25 H2): `abPreis` je Familie und optional je Element im Repo-Schema, Ergebnis als **Rahmen** („ab 14.900 € · je nach Bezug bis ca. 24.000 €“) aus Elementpreisen × Preisgruppe des Bezugs. Kennzeichnung „unverbindlicher Richtpreis inkl. MwSt., zzgl. Lieferung/Montage“. CHF-Anzeige über den späteren Schweiz-Rechner (H6).
- Stufe 2 (mit Backoffice-Zugang): Preise aus Frappe, Pflege durch das Verkaufsteam; dann auch `Offer`/`AggregateOffer` mit `lowPrice` im JSON-LD.
- **Nie**: einen Preis zeigen, der einen Rabatt unter UVP verspricht, oder Preisangaben, die der Hersteller untersagt.

---

## 4. Konkrete Features

Legende Aufwand: **S** ≤ 3 Personentage · **M** 1–3 Wochen · **L** > 3 Wochen (eine erfahrene Entwicklerin/ein Entwickler).

### F1 – Konfigurations-Kern: Schema, URL-Zustand, Merkliste mit Konfiguration
- **Nutzen:** Grundlage für alles. Allein schon die „Merkliste mit Konfiguration“ hebt die Qualität jeder Anfrage. Teilbarer Link (Partner, Architektin, Ehepartner) bringt Rückkehrer.
- **Aufwand:** M
- **Abhängigkeiten:** keine (Backoffice nicht nötig).
- **Dateien neu:**
  - `src/lib/configurator/schema.js` – zod-Schemata für Familie und Konfiguration
  - `src/lib/configurator/families/` – je Familie eine Datei, z. B. `minotti-lawrence.js`, `poliform-senzafine.js`, `umbrosa-icarus.js`
  - `src/lib/configurator/encode.js` – Konfiguration ↔ kompakter URL-String (`?k=…`), Versionsfeld `v`
  - `src/lib/configurator/summary.js` – Elementliste, Gesamtmaße, Preisrahmen, Klartext für die Anfrage (4 Sprachen über next-intl)
- **Dateien geändert:**
  - `src/context/CartContext.js` – `generateCartItemId()` um einen Hash der Konfiguration erweitern; `configuration` im Eintrag erlauben; alte Einträge bleiben gültig
  - `src/lib/shop/wishlistItem.js` – `toConfiguredWishlistItem(product, configuration)`
  - `src/components/CartPage/CartPage.js` – Zusammenfassung + Mini-SVG je konfiguriertem Eintrag, Link „weiter bearbeiten“
  - `src/messages/{de,en,fr,it}.json` – Namespace `configurator`
- **Datenform (Beispiel):**
  ```js
  // src/lib/configurator/families/minotti-lawrence.js
  export default {
    id: "minotti-lawrence", v: 1, kind: "sofa",
    brand: "Minotti", productPathFields: ["sofas-lawrence", "produkt-lawrence-clan"],
    source: { label: "Minotti Lawrence, technisches Datenblatt", checkedAt: "2026-10-26" },
    elements: [ { key: "arm-l-high-196", label: { de: "Element mit Armlehne links, hoch" }, w: 196, d: 104, arm: "left" }, /* … */ ],
    rules: { connect: [["arm-l-*", "center-*"], ["center-*", "corner-*"]] },
    presets: [ { key: "01", elements: ["arm-l-high-196", "corner-…", "arm-r-…"] } ],
    covers: { groups: ["Stoff A", "Stoff B", "Leder Cervo"], colorsFrom: "farben" },
    feet: [ { key: "black-nickel", label: { de: "Black Nickel" } } ],
    price: null // Stufe 1: { from: 14900, currency: "EUR", byGroup: { … } }
  };
  ```
  Die Maße oben sind **Platzhalter**; echte Werte kommen aus dem technischen Datenblatt der Marke.
- **Bibliotheken:**
  | Paket | Version | Lizenz | Größe (gzip, ca.) | Wofür |
  |---|---|---|---|---|
  | `zod` | 4.6.7 | MIT | ~13 kB voll, `zod/mini` ~2–3 kB; **nur serverseitig/zur Build-Zeit** nötig → 0 kB im Client möglich | Schema-Prüfung der Familien und eingehender Anfragen |
  | `lz-string` | 1.5.0 | MIT | ~2 kB | Konfiguration kompakt in die URL |
  | `nuqs` (optional) | 2.10.2 | MIT | ~5 kB | typisierter URL-State in Client Components; alternativ eigener 30-Zeilen-Hook mit `useSearchParams` |
  | `zustand` (optional) | 5.0.16 | MIT | ~1 kB | nur falls der Planer-State über viele Komponenten geteilt wird; sonst `useReducer` |

  Kein neues UI-Framework, Icons weiter aus `lucide-react`.

### F2 – Sofa-Planer 2D (Minotti und Poliform, MVP mit 3–5 Familien)
- **Nutzen:** Ranking: neue, einzigartige Inhalte („Elemente, Maße, Kompositionen“) auf den meistgesuchten Modellen; Verweildauer. Umsatz: Sofas sind der Kern von Minotti (62 Sofa-Produkte); eine Anfrage mit Elementliste ist fast schon ein Angebot.
- **Aufwand:** M (Renderer + UI), danach **S pro weiterer Familie** (Datenerfassung ½–1 Tag).
- **Abhängigkeiten:** technische Datenblätter der Marken (öffentlich als PDF/DWG verfügbar, Maße sind Fakten); Bildrechte **nicht** nötig; Stoffnamen der Kollektion (öffentlich) – Stofffotos nur mit Freigabe oder eigene Fotos der Musterbücher im Showroom.
- **Funktionen MVP:** Vorlage wählen (Herstellerkompositionen) → Elemente tauschen (gleiche Position, andere Breite) → links/rechts spiegeln → Raumrechteck eingeben (optional) → Bezug wählen (Farbfläche mit Hex aus `fetchFarben`, Hinweis „Farbwiedergabe unverbindlich“) → Füße/Gestell → Ergebnis.
  - Bewusst **kein Drag & Drop** im MVP (mobil schwierig, Barrierefreiheit). Bedienung über „+ Element links/rechts“, Tauschen per Auswahlliste, Tastatur bedienbar. Drag & Drop später mit `@use-gesture/react` 10.3.1 (MIT, ~10 kB) möglich.
- **Dateien neu:**
  - `src/components/Configurator/SofaPlanner.js` (Client Component)
  - `src/components/Configurator/PlanView.js` (SVG-Draufsicht, erweitert die Bildsprache von `dimensionDiagram.js`)
  - `src/components/Configurator/OptionGroup.js`, `Summary.js`, `ShareButton.js`
  - `src/app/[locale]/produkte/[category]/[product]/planen/page.js` **oder** Abschnitt auf der Produktseite (Empfehlung unten)
- **Dateien geändert:** Produktseite `…/[product]/page.js` – Button „Zusammenstellung planen“ in `productActions.js`, wenn für `path_field` eine Familie existiert; `src/utils/routing.js` + `src/proxy.js` für den übersetzten Pfad (`/planen`, `/plan`, `/planifier`, `/progetta`).
- **Einbau-Empfehlung (Next 16):** Planer als eigene Unterseite je Produkt (`…/[product]/planen`), Server Component rendert die Elementliste und die Herstellerkompositionen als **statisches HTML** (indexierbar), die interaktive Insel wird per `next/dynamic` nachgeladen (siehe `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`; Hinweis dort: Code-Splitting greift nur, wenn eine Client Component dynamisch importiert). `searchParams` ist in Next 16 ein **Promise** (`await searchParams`, siehe `03-api-reference/03-file-conventions/page.md`). Parametervarianten (`?k=…`) bekommen `canonical` auf die Planer-Grundseite.
- **Bibliotheken:** keine zusätzlichen (SVG + React). Optional `motion` 14.6.0 (MIT, ~5 kB mit `LazyMotion`/`m`) für weiche Übergänge – verzichtbar.

### F3 – Konfigurierte Anfrage, Stoffmuster und Termin (Lead-Strecke)
- **Nutzen:** Direkt umsatzwirksam. Drei Abschlüsse am Ende jeder Konfiguration: **„Richtpreis anfragen“**, **„Stoffmuster bestellen/im Showroom ansehen“** (Bolia-Prinzip, bis 5 Muster), **„Termin vereinbaren“**. Bei Schränken: **„Aufmaß anfragen“**.
- **Aufwand:** S (heute, über Freitext) → M (mit eigenem Backoffice-Feld).
- **Abhängigkeiten:** heute keine; später Backoffice-Felder (siehe Abschnitt 6).
- **Umsetzung sofort:** `AnfrageFormProduct.js` hängt pro konfiguriertem Merklisten-Eintrag einen Klartextblock an `anfrage_beschreibung` an:
  ```
  [Konfiguration 1] Minotti Lawrence · Vorlage 03 · Gesamt 342 × 196 cm
  Elemente: Armlehne links hoch 196 · Eckelement 104 · Chaiselongue rechts 104×176
  Bezug: Leder Cervo, Farbe Cognac · Füße: Black Nickel · Muster gewünscht: ja
  Link: https://www.platzhirsch.studio/de/produkte/sofas-couches/sofas-lawrence/planen?k=…
  ```
  Die Route `src/app/api/anfrage_produkt/route.js` prüft die übergebene Konfiguration mit zod gegen das Familienschema und baut den Text serverseitig (kein Vertrauen in Client-Text, Längenbegrenzung). Der Link öffnet für das Verkaufsteam exakt dieselbe Zeichnung.
- **Tracking:** `trackEvent("configurator_start", { family })`, `configurator_complete`, `trackLead("konfigurator", { family, elements, has_room })`, `sample_request` – GA4 bleibt über Consent Mode v2 abgesichert.
- **Dateien geändert:** `AnfrageFormProduct.js`, `api/anfrage_produkt/route.js`, `CartPage.js`, `src/lib/analytics.js` (Helfer `trackConfigurator`).

### F4 – Merkblatt als PDF und Share-Bild
- **Nutzen:** Der Kunde nimmt seine Planung mit (Partner, Architekt). Jede geteilte Planung trägt Logo, Adresse Lochau, Showroom-Hinweis → Wiederkehr und Empfehlung. Share-Vorschaubild (WhatsApp/Mail) zeigt die Zeichnung statt eines Herstellerfotos.
- **Aufwand:** S–M
- **Abhängigkeiten:** keine.
- **Umsetzung:**
  - PDF: **Druckansicht** mit `@media print` (0 kB, sofort) als MVP. Wenn ein „echtes“ PDF gewünscht ist: Route Handler `src/app/api/konfiguration/pdf/route.js` mit `@react-pdf/renderer` 4.9.0 (MIT) **nur serverseitig** – die Bibliothek ist groß (mehrere 100 kB) und darf nie in den Client-Bundle.
  - Share-Bild: `opengraph-image.js` in der Planer-Route mit `ImageResponse` aus `next/og` (eingebaut, kein Paket) zeichnet die Draufsicht aus dem `k`-Parameter (Metadaten-Doku: `01-app/01-getting-started/14-metadata-and-og-images.md`).
  - Mini-Vorschau in Merkliste: dieselbe `PlanView`-Komponente, kein Rasterbild nötig. Falls doch ein PNG gebraucht wird: `html-to-image` 1.11.13 (MIT, ~5 kB).

### F5 – Schrank-Planer 2D (Poliform Senzafine/Ubik, Rimadesio Cover/Zenit)
- **Nutzen:** Schränke werden immer nach Aufmaß verkauft – der Planer ist ein **Aufmaß-Termin-Generator** mit hohem Auftragswert. Keyword-Chance „Poliform Kleiderschrank planen“, „begehbarer Kleiderschrank Vorarlberg“. Rimadesio hat in der Region keinen gelisteten Händler (Bericht 00) – Inhaltsvorsprung.
- **Aufwand:** M (eigener Renderer „Aufriss“, Rasterlogik), danach S je System.
- **Abhängigkeiten:** Rastermaße, Höhen, Türtypen aus den technischen Katalogen (öffentlich, z. B. Poliform Senzafine Technical 2026); Oberflächen als Namen + Farbfläche. Echte Preise kaum sinnvoll (zu variantenreich) → nur „Richtpreis nach Aufmaß“.
- **Dateien neu:** `src/components/Configurator/WardrobePlanner.js`, `ElevationView.js`, Familien `poliform-senzafine.js`, `poliform-ubik.js`, `rimadesio-cover.js`, `rimadesio-zenit.js`.
- **Funktionen:** Nische eingeben → System schlägt Modulaufteilung vor (Breiten gemäß Raster, Restmaß als Passblende) → Türart → Front → Innenausstattung pro Modul → Ergebnis mit Maßkette.
- **Bibliotheken:** keine zusätzlichen.

### F6 – Schirm-Finder (Umbrosa sofort, Tuuci nach Katalogpflege)
- **Nutzen:** Türöffner fürs Hotel- und Gastrogeschäft (Bericht 00: Outdoor-Frühbucher für 160 Hotels ab 4★). Ein Finder „Schatten für 8 Personen / 3 Liegen“ ist für Hoteliers praktischer als ein Katalog. Kombi mit Wintereinlagerung als Service.
- **Aufwand:** S–M (Formelrechner + einfache Draufsicht/Seitenansicht).
- **Abhängigkeiten:** Größen/Formen/Befestigungen je Modell aus Herstellerunterlagen; **Tuuci-Schirme fehlen im Katalog** (nur Bleau/Brickell-Möbel) → erst anlegen (Backoffice) oder Finder zunächst nur mit Umbrosa (16 Schirme vorhanden). Windlast-Angaben nur aus Herstellerunterlagen übernehmen, nie selbst berechnen.
- **Dateien neu:** `src/components/Configurator/ParasolFinder.js`, `ShadeView.js`, Familien `umbrosa-*.js`; Einstieg auch von der Kategorie `parasols`.

### F7 – Planer-Hubseiten und „Kompositionen“ als SEO-Inhalt
- **Nutzen:** Ranking. Je Familie eine indexierbare Seite mit Elementliste, Maßen, Herstellerkompositionen als eigene Zeichnungen, FAQ („Wie tief ist Lawrence?“, „Welche Ecklösungen gibt es?“), interne Links zu Produkt, Kollektion, Stadtseiten, Termin. Zusätzlich Hubs „Sofa planen“, „Kleiderschrank planen“, „Sonnenschirm finden“ in 4 Sprachen.
- **Aufwand:** S je Hub (Inhalte kommen aus F1-Daten).
- **Abhängigkeiten:** keine; Texte in eigenen Worten (keine Herstellertexte kopieren).
- **Dateien:** neue Seiten unter `src/app/[locale]/` (z. B. `sofa-planen`), Eintrag in die Sitemap (`src/app/sitemap-static.xml/`, Planer-Seiten je Produkt in `src/app/sitemap-produkte.xml/`) und `src/app/llms.txt/route.js`; JSON-LD `HowTo`/`FAQPage` nur wo inhaltlich echt (Google zeigt FAQ-Rich-Results kaum noch, für KI-Suche trotzdem nützlich).
- **Wichtig:** Keine Formulierung „offizieller Minotti-Konfigurator“. Neutrale Überschrift: „Minotti Lawrence planen – Elemente, Maße, Kompositionen“ plus Hinweis „unabhängiger Planer von Platzhirsch Home Living, Angaben ohne Gewähr, maßgeblich ist das Angebot“.

### F8 – Preisrahmen „ab“ (Stufe 1)
- **Nutzen:** Laut Bericht 25 zeigt kein Wettbewerber Preise; ein Rahmen filtert ungeeignete Anfragen und stärkt Vertrauen. Grundlage für `Offer` im JSON-LD (Preis-Snippets).
- **Aufwand:** S (Code), Pflege laufend.
- **Abhängigkeiten:** **Freigabe der Hersteller** zur Preisangabe, interne Preisliste, Entscheidung des Inhabers. Ohne Backoffice-Preisfeld: `price` im Repo-Schema (Pflege durch Entwicklung, 1×/Jahr zur Preislistenänderung). Danach Umzug ins Backoffice.
- **Dateien:** `src/lib/configurator/summary.js` (Berechnung), `src/lib/seo/structuredData.js` (`productSchema` um `offers` mit `AggregateOffer`/`lowPrice` erweitern, nur wenn Preis gesetzt).

### F9 – Hersteller-Konfigurationen und Roomle als Adapter (später)
- **Nutzen:** Für Marken mit eigenem Tool (z. B. USM, Montana – sofern geführt) oder Roomle-Content: Konfigurations-ID/Link in die Merkliste übernehmen, statt Kunden auf fremde Seiten zu verlieren.
- **Aufwand:** S (Feld „Link/ID einer Hersteller-Konfiguration“ in der Anfrage) · M (Roomle-Einbettung pro Marke).
- **Abhängigkeiten:** Roomle-Vertrag und Hersteller-Content; Consent (Roomle-iframe lädt Drittinhalte → erst nach Klick und mit Hinweis, ggf. Consent-Kategorie).
- **Dateien neu:** `src/components/Configurator/RoomleEmbed.js` (Client, `next/dynamic` mit `ssr: false`, lädt `@roomle/embedding-lib` 8.2.1, MIT; `onRequestProduct` → `addToCart({...configuration, provider: "roomle", configurationId})`).

### F10 – 3D/AR (Moonshot, nur mit Herstellerdaten)
- **Nutzen:** Wow-Effekt; AR „im eigenen Raum“ für Leuchten (Flos), Beistelltische, Schirme.
- **Aufwand:** L
- **Abhängigkeiten:** schriftliche Freigabe der Marke für 3D-Darstellung, glTF-Modelle (vom Hersteller oder aus Roomle), Optimierung.
- **Bibliotheken (falls je selbst gebaut):**
  | Paket | Version | Lizenz | Größe (gzip, ca.) | Bemerkung |
  |---|---|---|---|---|
  | `@google/model-viewer` | 4.4.0 | Apache-2.0 | ~250 kB (bringt three.js mit) | einfachste Lösung für Einzelobjekte + AR (Quick Look/Scene Viewer), Web Component |
  | `three` | 0.186.1 | MIT | ~150–180 kB je nach Tree-Shaking | Basis |
  | `@react-three/fiber` | 9.8.2 | MIT | ~40–50 kB | React-19-kompatibel |
  | `@react-three/drei` | 10.7.9 | MIT | modulweise | Helfer (Environment, ContactShadows) |
  | `@gltf-transform/cli` | 4.5.1 | MIT | Build-Werkzeug, 0 kB im Client | Modelle komprimieren (Draco/Meshopt, KTX2) |
- **Lokale NVIDIA-GPU:** sinnvoll für (a) Blender/Cycles-Renderings **eigener** Showroom-Szenen bzw. lizenzierter Modelle als Standbilder, (b) Texturkompression/Batch-Optimierung mit gltf-transform, (c) Experimente mit KI-Umfärbung **eigener** Showroom-Fotos (Stoffwechsel als „Visualisierung“ gekennzeichnet). Nicht: Herstellerdesigns nachmodellieren und veröffentlichen.

### F11 – Pflege ohne Entwickler (später)
- **Nutzen:** Damit das Team (5 Personen) Familien selbst pflegt.
- **Aufwand:** M
- **Abhängigkeiten:** **Backoffice-Schreibzugang**: Frappe-Doctypes `Konfigurator Familie` (Kopf, Produktlink, Preisanker), Child-Table `Konfigurator Element` (Key, Label 4-sprachig, B, T, H, Typ, Preis), `Konfigurator Option` (Bezugsgruppe, Fuß, Front …), API `get_konfigurator_familie?path_field=`. Bis dahin pflegt die Entwicklung die Repo-Dateien; Umzug ist reiner Datenexport, weil das zod-Schema gleich bleibt.
- **Dateien neu:** `src/lib/api/fetchKonfigurator.js` (gleiches Muster wie `fetchFarben.js`, `revalidate: 3600`, Tag `konfigurator`), Fallback auf Repo-Daten.

---

## 5. Risiken

### 5.1 Performance
| Risiko | Gegenmaßnahme |
|---|---|
| Planer-JS verlangsamt die Produktseite (LCP, INP) | Planer nur auf eigener Unterseite oder per `next/dynamic` nach Klick; Ziel **< 30 kB gzip** für den gesamten Planer (nur SVG + React). Mit `next build` + Bundle-Analyse prüfen |
| 3D/iframe (Roomle, model-viewer) frisst mobil Akku und Daten | nie automatisch laden, Poster-Bild + Button „3D ansehen“, eigene Consent-Abfrage |
| Viele URL-Varianten (`?k=`) erzeugen Duplicate Content/Crawl-Budget | `canonical` auf Grundseite, `robots` Meta `noindex` für Varianten, keine Variantenlinks in der Sitemap |
| `generateCartItemId` mit Konfiguration bricht alte Merklisten | abwärtskompatibel: ohne `configuration` gleiche ID wie heute |

### 5.2 Recht
| Risiko | Gegenmaßnahme |
|---|---|
| Irreführung: „offizieller Konfigurator“, Händler-Eindruck | neutrale Benennung „Planer von Platzhirsch“, Hinweis „unabhängig, ohne Gewähr“, kein Hersteller-Logo im Planer-Kopf |
| Bildrechte | Planer zeigt **nur eigene Vektorzeichnungen**; Stofffotos nur eigene Aufnahmen der Musterbücher oder mit Freigabe; Herstellerkompositionen werden nachgezeichnet (Maße/Anordnung sind Fakten), nicht deren PDF-Grafik übernommen |
| Nutzungsbedingungen der Hersteller-Downloads (DWG/Revit) | DWG nur als Maßquelle lesen, nicht veröffentlichen oder in 3D umwandeln ohne Freigabe |
| Preisangaben (PAngV/AT-Preisauszeichnung, UWG) | „ab“-Preise klar als unverbindliche Richtpreise inkl. MwSt. kennzeichnen; Hersteller-Freigabe vor Veröffentlichung |
| Falsche Maße → Kunde plant falsch | Quelle + Prüfdatum je Familie (`source.checkedAt`), Hinweis „verbindlich ist das Aufmaß/Angebot“; jährlicher Abgleich mit neuem Katalog |
| Datenschutz: Raummaße/Konfiguration personenbezogen? | nur in URL/localStorage beim Nutzer, Übertragung erst mit der Anfrage (bestehende Datenschutzerklärung um „Konfiguration“ ergänzen) |
| Tuuci/Umbrosa Windlast, Befestigung | nur Herstellerangaben zitieren, keine eigene Statik |

### 5.3 Pflege
| Risiko | Gegenmaßnahme |
|---|---|
| Familien veralten (neue Elemente, Kollektionsjahr) | MVP auf 3–5 Familien begrenzen; Pflegetermin 1×/Jahr nach Salone/Kataloglaunch; Prüfdatum sichtbar |
| Niemand bearbeitet die Konfigurations-Anfragen schneller als normale | Ziel „Richtpreis in 24 h“ nur versprechen, wenn das Verkaufsteam zustimmt; Konfigurations-Link macht die Bearbeitung schneller (kein Rückfragen) |
| Daten im Repo statt Backoffice | bewusst als Übergang; zod-Schema = späterer Doctype |

---

## 6. Priorisierte Reihenfolge

### 6.1 Sofort baubar (ohne Backoffice-Zugang, ohne Hersteller-Freigabe)

| Prio | Feature | Aufwand | Ergebnis nach | Datenbedarf |
|---|---|---|---|---|
| 1 | **F1 Kern** (Schema, URL-State, Merkliste mit Konfiguration, ID-Fix in `CartContext`) | M | ~1,5 Wochen | – |
| 2 | **F3 Konfigurierte Anfrage über `anfrage_beschreibung`** + Tracking + CTA „Stoffmuster“ | S | +3 Tage | – |
| 3 | **F2 Sofa-Planer** mit **Minotti Lawrence, Minotti Connery/Hamilton (o. ä. Top-Suchmodelle), Poliform Westside** | M | +2 Wochen | Maße aus öffentlichen Datenblättern (½–1 Tag je Familie) |
| 4 | **F4 Druckansicht + OG-Bild** | S | +2 Tage | – |
| 5 | **F7 Planer-Seiten** als SEO-Inhalte (Elemente, Maße, Kompositionen, FAQ) | S je Seite | parallel | eigene Texte |
| 6 | **F6 Schirm-Finder nur Umbrosa** (16 Schirme im Katalog) | S–M | +1 Woche | Umbrosa-Datenblätter |
| 7 | **F5 Schrank-Planer** Poliform Senzafine + Rimadesio Cover | M | +2 Wochen | technische Kataloge |

**MVP (Vorschlag, ca. 5–6 Wochen für eine Person):** Prio 1–4 mit **3 Sofa-Familien**, Merkliste mit Konfiguration, Anfrage mit Konfigurations-Link, Stoffmuster-CTA, GA4-Events. Erfolgskriterium nach 8 Wochen: Anteil Anfragen mit Konfiguration, Zahl Musteranfragen, Termine aus Planer-Anfragen. Nur wenn die Zahlen tragen, folgen Schränke und Schirme.

### 6.2 Blockiert oder abhängig

| Feature | Blockiert durch | Wer löst es |
|---|---|---|
| F8 Preisrahmen „ab“ mit Betrag, `Offer` im JSON-LD | Hersteller-Freigabe zur Preisangabe, interne Preisliste, Inhaber-Entscheidung; dauerhaft: **Preisfeld im Backoffice** | Inhaber, Verkauf, Backoffice-Dienstleister |
| Eigenes Konfigurationsfeld in der Anfrage (statt Freitext), Auswertung im Backoffice | Doctype `Anfrage Produkt` um `konfiguration` (JSON) und `konfiguration_link` erweitern | Backoffice-Zugang |
| F11 Pflege durch das Team | Doctypes `Konfigurator Familie/Element/Option` + API | Backoffice-Zugang |
| F6 mit Tuuci | Tuuci-Schirme im Katalog anlegen (heute 0) | Backoffice-Pflege |
| Stofffotos / Fotolayer-Vorschau | Bildfreigabe der Marken oder eigene Musterfotos | Inhaber / Fotografie im Showroom |
| F9 Roomle | Roomle-Angebot, Hersteller-Content für geführte Marken | Anfrage bei Roomle (sofort möglich, kostet nichts) |
| F10 3D/AR | schriftliche 3D-Freigabe der Marke, glTF-Modelle; laut Masterkonzept „nicht jetzt“ | frühestens 2027/28 |

### 6.3 Nicht tun
- Kein eigener 3D-Nachbau von Minotti-/Poliform-Designs.
- Kein „In den Warenkorb“ für konfigurierte Neuware (Merkliste/Anfrage bleibt das Modell).
- Keine Konfiguratoren für alle 1.765 Produkte – nur dort, wo Modularität echte Fragen auslöst (Sofasysteme, Schranksysteme, Schirme).

---

## Quellen
- Live-API: `backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.produkte_new.api.get_produkte_by_marke_api` und `get_produkt_by_path_field_api?path_field=sofas-lawrence` (26.10.2026)
- [Minotti Lawrence](https://www.minotti.com/en/lawrence) – Kompositionen 01–06, DWG/Revit, kein Konfigurator
- [Poliform Senzafine Technical 2026 (PDF)](https://s3.poliform.it/2026/03/Poliform_Night_Systems_Technical_SENZAFINE_2026.pdf), [Space Furniture: The Modern Wardrobe](https://www.spacefurniture.com.sg/blogs/journal/the-modern-wardrobe)
- [Roomle Rubens Preis-Management](https://www.roomle.com/en/documentation/rubens-price-management), [Roomle Doku Request-Product-Event](https://docs.roomle.com/rubens/rubens-products/rubens-configurator/integration/listen-to-events/request-a-product.md), [Setup](https://docs.roomle.com/rubens/rubens-products/rubens-configurator/integration/setup-the-configurator.md), [softwarefinder: Roomle-Preise](https://softwarefinder.com/design-software/roomle), [Capterra Roomle](https://www.capterra.com/p/164020/Roomle/), [ki-syndikat: Roomle](https://www.ki-syndikat.de/tools/roomle/)
- [Capterra Zakeke Pricing](https://www.capterra.com/p/162400/Zakeke/pricing/), [framesixty: 3D-Konfigurator Kosten](https://framesixty.com/3d-configurator/), [Gartner Threekit](https://www.gartner.com/reviews/product/threekit-710618874)
- [Roche Bobois Mah Jong 3D](https://www.roche-bobois.com/en-US/the-mah-jong-3d-application/mag-092021-3.html), [USM custom configuration](https://uk.usm.com/products/usm-configuration-24337132), [Utility Design: USM Buying Guide](https://www.utilitydesign.co.uk/blog/usm-haller-buying-guide/), [Bolia Stores](https://www.bolia.com/en/this-is-us/stores/), [onehouse Sofa-Konfigurator](https://onehouse.de/en/pages/sofa-konfigurator), [AR-range Scandic Sofa](https://ar-range.app/case-studies/scandic-sofa)
- [Tuuci FAQ Optionen](https://www.tuuci.com/faq/what-options-and-upgrades-are-available-for-my-parasol/)
- [hoettges.at](https://www.hoettges.at), [reiter.design](https://reiter.design) (beide abgerufen 26.10.2026), Bericht 20
- npm-Registry (Versionen/Lizenzen, abgefragt 26.10.2026); Bundle-Größen sind gerundete Erfahrungswerte (gzip) und vor Einbau mit `next build` zu messen
- Next.js-Doku im Projekt: `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`, `03-api-reference/03-file-conventions/page.md`, `…/proxy.md`, `01-getting-started/14-metadata-and-og-images.md`
