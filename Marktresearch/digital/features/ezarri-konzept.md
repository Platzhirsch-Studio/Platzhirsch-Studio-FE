# Ezarri-Welt bei Platzhirsch – Konzept, Konfigurator, Gestaltung, SEO, Teamaufträge

Stand: 28.10.2026 · Rolle: Creative Director / UX-Lead · Status: verbindlich für Team A, B und C
Grundlagen: `ezarri-analyse.md` (Paritätsliste §14, Top 10 §15), `Herstellermaterial/Ezarri/00-INDEX.md`, `src/lib/ezarri/*.json`, Design-Bibel (`expertenrat/00-design-bibel.md`), Jury-Urteil, Rechtspaket, `inhaber-entscheidungen.md` Nr. 7 und Nr. 9.
Code-Grundlage (angelegt mit diesem Konzept, Tests `tests/unit/ezarri-basis.test.mjs`, 10/10 grün):

| Datei | Inhalt | rein / server-only |
|---|---|---|
| `src/lib/ezarri/config.js` | `EZARRI_PUBLIC = false`, `ezarriRobots()`, `ezarriRobotsUtility()`, `withEzarriRobots()`, `ezarriInSitemap()`, `ezarriInNavigation()`, `ezarriDealerClaimVisible()`, `ezarriPath()`, `EZARRI_LOCALES`, `ezarriCredit()` | rein |
| `src/lib/ezarri/facets.js` | Filter-Labels (Farbfamilie, Format, Einsatz, Wasserwirkung, Typ, Linie, Oberfläche), `parseFilters()` / `serializeFilters()` (URL-Zustand), `matchesReference()`, `matchesGallery()`, Farbnähe `colorDistance()` (CIELAB) | rein |
| `src/lib/ezarri/images.js` | `compactImage()`, `imageSources()` (AVIF/WebP 600/1600 für `<picture>`) | rein |
| `src/lib/ezarri/data.js` | Lese-API: Kollektionen, Referenzen (+ Karten, Index, Varianten, Spezialteile, Ähnliche), Galerie mit Paginierung, Konfigurator-Palette, Fugen, Patterns, Rezepte, Verpackung, Datenblätter, Rutschhemmung (normalisiert) | **server-only** |

---

## 0. Kurzfassung

- **Eine Welt unter `/de/ezarri`**, gebaut wie ein Wasser-Atlas: Einstieg über den **Ort** (Pool, Wellness, Bad, Küche, Fassade), dann **Wasserwirkung**, dann **Mosaik**. Ezarri sortiert nach Kollektion, wir nach dem Ergebnis, das der Kunde sehen will: „Welches Wasser bekomme ich?“
- **Vollsortiment**: 21 Kollektionen, 402 Referenzen, 1010 Galerie-Einträge, 201 Konfigurator-Mosaike, 7 Fugen, 20 Patterns, 18 Datenblätter. Jede Übernahme mit Quellenangabe.
- **Konfigurator „Becken“**: echtes Echtzeit-3D (R3F) mit eigenem Becken (Maße, Form, Treppe, Bank, Rinne), prozeduralem Mosaik-Shader pro Steinchen, echter Kaustik, Tageszeit und LED, bis 4 Referenzen mit Ziehanteilen, 3 Kanäle, Teilen-Link, Rückgängig, Mengen live, PDF ohne Lead-Gate, AR. Erste Ansicht ≤ 2 MB statt 42 MB. Ohne WebGL: 2D-Flächenvorschau mit denselben Funktionen außer 3D.
- **Ein Schalter** `EZARRI_PUBLIC` (heute `false`): noindex, nofollow, keine Sitemap, kein Menü, keine Händler-Aussage. Mit dem Deploy wird er `true` (Inhaber-Entscheidung Nr. 7).
- **Drei Teams** mit festen Dateigrenzen: A Welt und Sortiment, B 3D-Konfigurator, C Rechner, Custom Mix und Anfrage. Schnittstellen sind unten als Verträge festgelegt (§7.4).

---

## 1. Leitplanken

### 1.1 Rechte und Quellen
- Laut Inhaber ist Platzhirsch Ezarri-Vertragshändler. Ezarri erlaubt die Nutzung aller Website-Inhalte. Vertrag und Erlaubnis liegen laut Inhaber in den Firmenakten (Nr. 7).
- **Übernommen werden nur Inhalte:** Bilder, Produktdaten, Datenblätter, Kataloge und Videos (YouTube nur per `VideoFacade` nach Consent).
- **Eigene Arbeit sind:** Oberfläche, Texte, Code, Informationsarchitektur, 3D-Szenen und Shader. Nichts wird 1:1 nachgebaut.
  - Weder Ezarris Panoplia-Layout noch dessen Akkordeon-Abfolge noch dessen Texte.
  - `text_ezarri` und `beschreibung_en` sind nur Faktenquelle für eigene Sätze in `copy.js`.
- **Quellenangabe Pflicht:**
  - Jedes Ezarri-Bild bekommt eine Credit-Zeile `ezarriCredit("bild")` als `<figcaption>` oder Galerie-Fußzeile (14 px, `text-soft`).
  - Jede Datentabelle trägt „Daten: Ezarri, ezarri.com, Stand 28.10.2026“, jedes PDF „Datenblatt: Ezarri“.
- **Logo:** Das Ezarri-Logo erscheint nur als Markenlogo mit Namensnennung im Markenkopf der Startseite, nie als Siegel, Badge oder in unserem Header.
  - Datei: `public/ezarri/allgemein/` oder per SVG aus dem Pressebereich. Team A prüft, ob die Logo-Datei im Material liegt. Sonst steht der Name in Instrument Sans.
- **Herstellerbilder bleiben unverändert:** keine Retusche, keine Schrift im Bild, kein Ken-Burns. Zuschnitt gibt es nur per `object-fit: cover` auf die 5 Bibel-Formate.
- **Keine Preise.** Ezarris €-Stufen sind bewusst nicht erfasst. Es gibt den Preis „auf Anfrage“, keinen Preisfilter und keine erfundenen Referenzen oder Projekte.
  - Ezarri-Galeriebilder sind **Ezarri-Projekte**, nie „unsere Projekte“. Die Überschrift lautet „Projekte mit Ezarri-Mosaik“, mit Credit.

### 1.2 Schalter `EZARRI_PUBLIC` (src/lib/ezarri/config.js)
| | `false` (heute) | `true` (mit Deploy) |
|---|---|---|
| robots | `noindex, nofollow` (+ googleBot) über `ezarriRobots()` | `index, follow`. Hilfsseiten (Filter, Vergleich, geteilte Konfiguration, Bestätigung) `noindex, follow` über `ezarriRobotsUtility()` |
| Sitemap, `/llms.txt` | nicht enthalten (`ezarriInSitemap()`) | eigene Einträge |
| Hauptmenü, Startseite | nicht enthalten (`ezarriInNavigation()`). **Labs-Karte bleibt** (features.js, Test `labs-hub` erwartet `/ezarri`) | Menü „Outdoor“ → Teaser „Pool & Mosaik“, Startseiten-Teaser |
| Händler-Aussage | aus. Neutral: „Glasmosaik von Ezarri – Beratung und Muster in Lochau“ | „Ezarri-Vertragshändler für Vorarlberg, Bodensee und die Schweiz“ (`ezarriDealerClaimVisible()`) |
| Strukturdaten | ausgegeben (schadet bei noindex nicht) | ausgegeben |

Jede Seite unter `/ezarri/**` ruft in `generateMetadata` `withEzarriRobots(buildPageMetadata(…))` auf. Ein Unit-Test pro Team prüft das im Quelltext (`grep withEzarriRobots|ezarriRobots`).

### 1.3 Händler-Aussage und Claim-Prüfung
- Der Claim-Check (`src/lib/legal/claims.js`, `tools/checks/check-claims.mjs`) lässt Händler-Wörter nur für `classicon` zu. `tests/unit/claims.test.mjs` prüft genau `["classicon"]`.
- Deshalb gilt: **Die Händler-Aussage steht ausschließlich in `src/lib/ezarri/copy.js` (Konstante `DEALER_CLAIM`)** und wird nur bei `ezarriDealerClaimVisible()` gerendert.
- **Integration (Teamleiter, siehe §7.5):**
  - `ezarri` kommt in `VERIFIED_DEALER_BRANDS` und `CLAIM_REGISTER`, mit `evidenceUrl` = Ezarri-Händlersuche, sobald Platzhirsch dort gelistet ist. Bis dahin steht der interne Beleg „Händlervertrag, Firmenakten, Inhaber 28.10.2026“ im Feld `note`.
  - `"Ezarri"` kommt in `KNOWN_BRANDS`.
  - `claims.test.mjs` und `r3-marken-legal.test.mjs` werden im selben Schritt angepasst.
  - `brandSlugFromUrl` muss `/ezarri/**` der Marke `ezarri` zuordnen.
- Vor dieser Integration darf `EZARRI_PUBLIC` nicht auf `true`.

### 1.4 Sprache
- Phase 1 gibt es nur Deutsch (`EZARRI_LOCALES = ["de"]`), andere Locales liefern `notFound()`, wie bei Outdoor und Yacht.
- Texte stehen in `src/lib/ezarri/copy.js` (Team A). Für en/fr/it sammeln alle Teams Vorschläge in `Marktresearch/digital/features/ezarri-messages-vorschlag.json`: Schlüssel `ezarri.<team>.<bereich>.<key>`, je `de`, `en`, `fr`, `it`.
- Phase 2: fr-CH und it-CH für den Schweizer Pool-Markt (Tessin, Romandie) sind der wertvollste Schritt nach Deutsch.
- Stimme laut Bibel: Sie-Form, Fakten statt Adjektive. Keine Superlative („einzigartig“, „beste“), kein „Luxus“.
  - Ezarri-Aussagen wie „bis zu 25 % schneller verlegt“ nur als Herstellerangabe: „laut Ezarri“.
  - Umweltangaben nur konkret und belegt („100 % recyceltes Glas laut Datenblatt, ISO 14021“), keine pauschale „Nachhaltigkeit“ (EmpCo, Rechtspaket Nr. 14).

---

## 2. Informationsarchitektur `/[locale]/ezarri`

```
/de/ezarri                                Startseite der Mosaik-Welt (A)
├── /pool  /wellness  /bad  /kueche  /fassade   Einsatz-Welten (A), indexierbar
├── /wasser                               Wasserwirkung: 6 Wasserfarben nebeneinander (A)
├── /kollektionen                         alle 21 Kollektionen nach Linie (A)
│   └── /kollektionen/[kollektion]        Kollektionsseite (A); Custom-Kollektionen → Dienstleistungsseiten
├── /mosaike                              Mosaik-Übersicht mit Filtern (A), ?farbfamilie=…&seite=…
│   ├── /mosaike/[referenz]               Mosaik-Detailseite = Ezarri-„Referenz“ (A), 402 Seiten
│   └── /mosaike/vergleich?ids=a,b,c      Vergleich bis 4 (A), noindex
├── /galerie                              Projekte mit Ezarri-Mosaik, Filter + ?seite= (A)
├── /technik                              Technik-Hub (A)
│   ├── /technik/jointpoint
│   ├── /technik/verlegung                5 Beckentypen × 9 Schritte
│   ├── /technik/pflege                   8 Themen
│   ├── /technik/fragen                   FAQ (18, eigene Antworten)
│   └── /technik/downloads                18 Datenblätter, ISO 9001, ISO 14021, Garantie, Kataloge auf Anfrage
├── /konfigurator                         3D-Konfigurator (B), ?k=<Zustand>
├── /rechner                              Mosaik-Rechner (C), ?k= übernimmt Becken aus B
├── /custom-mix                           Mischpult 2D + Pixel-/Druckmotiv (C)
│   ├── /custom-mix/pixel                 Pixel-Mosaik aus eigenem Bild, im Browser (C)
│   └── /custom-mix/motive                Standard Printed/Pixel, Patterns, Fading out (C, Daten aus A)
└── /anfrage                              Muster- und Beratungsanfrage (C), ?ref=…&k=…
    └── /anfrage/danke                    Bestätigung inline (C), noindex
```

**Warum so:**
- **Einsatz vor Kollektion:** Ezarri startet bei 14 Serien. Der Bauherr denkt aber „Pool“ oder „Dusche“. Die Einsatz-Welten sind zugleich die indexierbaren Landeseiten für die Keywords aus §6, statt dünner Filter-URLs.
- **`/wasser` als eigenes Kapitel:** Die Wasserwirkung ist bei Ezarri ein unbeschrifteter Farbfilter. Bei uns ist sie die zentrale Kaufentscheidung, also bekommt sie ein eigenes Kapitel mit Fotobeleg.
- **„Referenz“ heißt bei Ezarri Produkt.** Damit es keine Verwechslung mit Projekt-Referenzen gibt, heißen die Detailseiten bei uns **Mosaik-Detailseiten** (`/mosaike/[referenz]`). „Referenz“ bleibt nur als Datenbegriff.
- **Safe-, Corner- und Cove-Datensätze** haben eigene Detailseiten, weil sie eigene Codes haben. Sie sind aber `noindex, follow` mit canonical auf das Basis-Mosaik (§6.3) und werden auf der Basisseite im Abschnitt „Ausführungen“ gezeigt.
- **Verknüpfung mit Platzhirsch:**
  - Jede Einsatz-Welt Pool, Wellness und Fassade endet mit dem Band „Pool, Terrasse und Garten als ein Projekt“ → `/de/outdoor-gartenplanung`. Dort stehen die Gewerke-Regeln (befugte Fachbetriebe, keine Bauleitung als eigene Leistung).
  - Bad und Küche verlinken auf `/de/kuechen-vorarlberg` und `/de/interior-design-vorarlberg`.
  - Der Handzeichnungs-USP (Nr. 8) erscheint als Prozessband „Erst die Skizze, dann das Becken“. Nur echtes Material: Platzhalter bleibt leer, bis Harald Menghin eine echte Poolskizze liefert. Keine KI-Skizze.
- **Navigation:** Hauptmenü bleibt bei 7 Punkten (Bibel §10.1), Ezarri bekommt keinen eigenen Hauptpunkt.
  - Mega-Menü „Outdoor“ zeigt den Teaser „Pool & Glasmosaik“, Mega-Menü „Marken“ den Eintrag Ezarri.
  - Die Footer-Spalte „Planen“ verlinkt Konfigurator und Rechner, nur bei `ezarriInNavigation()`.

**Lokale Navigation** in der Ezarri-Welt: Unterleiste unter dem Header (sticky z 20, 48 px) mit den Einträgen Welten · Mosaike · Galerie · Konfigurator · Rechner · Technik und rechts „Muster anfragen“ (secondary). Mobil wird daraus eine horizontale Scroll-Leiste mit Scroll-Snap, ohne Hamburger im Hamburger.

---

## 3. Seitentypen (Team A, außer Konfigurator, Rechner, Custom Mix, Anfrage)

### 3.1 Startseite `/ezarri`
1. **Hero „Wasserlinie“:** Ezarri-Poolbild 21:9 (Desktop) bzw. 4:5 (mobil, `<picture>` Art Direction) mit Credit. H1 „Glasmosaik für Pool, Bad und Wellness“. Lead mit 2 Sätzen, darunter 1 Primärknopf „Becken gestalten“ (→ Konfigurator) mit der Unterzeile „3D im Browser · ohne Anmeldung“ und sekundär „Muster anfragen“.
   - LCP ist das AVIF-Bild in 600 bzw. 1600 px. Gemessene Größe ≤ 120 KB mobil, sonst die nächstkleinere Variante.
2. **Weiche „Wo soll das Wasser leben?“:** 5 Einsatz-Kacheln (Pool, Wellness, Bad, Küche, Fassade), je ein 1:1-Bild mit Name und Anzahl passender Mosaike aus `facetCounts`.
3. **Wasserwirkung:** 6 Fotostreifen nebeneinander, von Himmelblau bis Bergsee, je mit 3 passenden Mosaiken. Interaktion: Tippen zeigt die Mosaike, Link → `/mosaike?wasser=…`. Das ist **der** Signature-Moment der Startseite (§5.3).
4. **Kollektionen typografisch:** Premium, Classic und Individuell als Liste, Name in Bodoni ab 32 px, Formate und Oberfläche als Faktenzeile. Bild nur bei Hover/Fokus. Bibel `card-brand`: kein Logo-Raster.
5. **Konfigurator-Teaser:** Standbild (Poster) des 3D-Beckens mit 3 Mischungen als Umschalter. Gerendert wird nur das Poster, kein WebGL auf der Startseite.
6. **Technik kurz:** JointPoint, Verlegung, Pflege, Downloads als 4 Zeilen mit LinkArrow.
7. **Ezarri-Markenkopf:** Ezarri-Logo mit Namensnennung, Herkunft „Ezarri, Spanien, Glasmosaik aus recyceltem Glas (laut Ezarri)“ und Händler-Aussage nur bei `EZARRI_PUBLIC`.
8. **Gastgeber-Band (Walnut, die eine dunkle Fläche):** „Muster ansehen im Showroom-Café in Lochau“ mit Porträt der Ansprechperson und `OpeningLine`. Daneben die Dreiländer-Zeile „Lieferung nach AT, DE, CH, FL. Für die Schweiz: Ausfuhr und Verzollung, siehe Einkaufen aus der Schweiz“.
   - **[Inhaber klären]** Gibt es Ezarri-Muster bzw. eine Mustertafel im Showroom? Ohne Bestätigung lautet der Satz „Muster bestellen wir für Ihren Termin“.
9. Schluss mit Leitsatz „Nehmen Sie Platz.“ und Termin (1×).

### 3.2 Einsatz-Welten `/pool`, `/wellness`, `/bad`, `/kueche`, `/fassade`
- Eigene Einleitung je Welt: Was ist bei diesem Einsatz zu beachten? Pool: Epoxidfuge RG, Rutschhemmung an Treppe und Rand, Corner/Cove an Kanten. Bad: Duschboden rutschhemmend, Fugenbreite.
- Kuratierte 9 Mosaike („ausgewählt von [Person]“), danach 1 Klick zur gefilterten Übersicht `/mosaike?einsatz=…`.
- Galerie-Auszug mit 6 Bildern, gefiltert nach Einsatz.
- Abschluss-Band zur Verknüpfung mit Platzhirsch (§2).
- **Fassade:** Datenbasis ist `einsatz: wand-innen-aussen` (385 Referenzen) laut Datenblatt „Cladding“. Ezarri hat keine Fassaden-Galerie. Deshalb gibt es keine Fassadenprojekte als Bild, sondern Datenblatt-Fakten und den Hinweis „Planung mit Ihrem Fassadenbauer“.

### 3.3 Kollektionsseite `/kollektionen/[kollektion]` (21)
- Kopf: Name (H1, Bodoni), Linie, Formate, Oberfläche, Faktenzeile aus dem Datenblatt (Wasseraufnahme, PEI, Mohs, Chemikalien) als `FactList` (`dl`, tabular).
- Raster aller Referenzen der Kollektion (Basis-Mosaike zuerst, Safe/Corner/Cove gruppiert), Kartenformat 1:1. Nach 9 Kacheln folgt ein Vollbreiten-Anwendungsbild.
- Datenblatt-Download (Ezarri-URL, Hinweis „englisch“) und Link „Im Konfigurator öffnen“ mit Serie vorgefiltert (`/konfigurator?serie=…`).
- **Custom-Kollektionen** (Custom Mix, Custom Printed, Custom Pixel, Patterns, Fading out, Standard Printed/Pixel) sind Dienstleistungen. Ihre Seite leitet auf die Werkzeuge von Team C (`/custom-mix…`) und zeigt die Motive aus den Daten.
- **Nicht mehr online** (Topping, Vulcano): keine eigene Seite, nur im Download-Bereich als „Datenblatt älterer Kollektionen“.

### 3.4 Mosaik-Übersicht `/mosaike` mit Filtern und Vergleich
- **Filter** (URL-Zustand über `facets.parseFilters` / `serializeFilters`):
  - Sichtbar: Einsatz, Wasserwirkung, Farbfamilie, Format.
  - Im `FilterSheet`: Kollektion, Linie, **Farbe** (Farbwähler, Ähnlichkeit per ΔE ≤ 28 auf `konfigurator.farbe_hex`, Sortierung nach Nähe), Typ, Rutschhemmend (`safe=1`), Spezialteile vorhanden (`spezial=1`), Oberfläche, Suche nach Name oder Code.
  - Das ist die vollständige Liste aus dem Auftrag: Farbe, Farbfamilie, Format, Kollektion, Einsatz, rutschhemmend, Spezialteile, Wasserwirkung.
- **Technik:** Die Server-Seite rendert das gefilterte Ergebnis aus `searchParams`. Das funktioniert ohne JS, Paginierung über echte Links `?seite=2` (wie `src/lib/shop/catalogQuery.js`, 24 pro Schritt).
  - Die Filter-Insel (`src/components/Ezarri/Katalog/FilterIsland.js`) bekommt `getReferenceIndex()` als Prop: 402 Karten, gemessen 14,8 KB gzip. Sie filtert im Browser sofort (≤ 100 ms) und schreibt den Zustand per `history.replaceState` in die URL.
  - Ergebniszahl mit `aria-live="polite"`, „Weitere 24 laden“ ohne Endlos-Scroll.
- **Leere Treffer:** `EmptyState` mit „Ähnliche Farbe finden“ (lockert ΔE auf 40) und „Wir suchen es für Sie“ (→ Anfrage).
- **Vergleich:** Auf jeder Karte gibt es „Vergleichen“ (`aria-pressed`) für bis zu 4 Mosaike. Die Leiste unten zeigt „Vergleich (3)“, die Seite `/mosaike/vergleich?ids=…` zeigt eine Tabelle.
  - Zeilen: Bild, Kollektion, Format(e), Oberfläche, Wasserwirkung, Rutschhemmung A/B/C (normalisiert über `getSlipResistance`), Spezialteile, Blatt, Steine pro Blatt, m² pro Karton, kg/m², Einsatz, mischbar.
  - Unterschiede werden hervorgehoben, nicht nur per Farbe, sondern mit Symbol und Text.
  - Aktionen: „Diese Mischung im Konfigurator“ (wenn alle mischbar), „Muster aller anfragen“.
- **Merken (♡):** Merkliste über den bestehenden Mechanismus (`toWishlistItem`-Form mit `href: /ezarri/mosaike/<id>`), ohne Konto.

### 3.5 Mosaik-Detailseite `/mosaike/[referenz]` (402, `generateStaticParams` aus `getReferenceIds()`)
Aufbau nach Bibel „Atelier“:
- **Links:** Galerie 1:1 Mosaik-Nahaufnahme, dazu Anwendungsbilder 3:2 aus `getGalleryForReference()`, jeweils mit Credit.
- **Rechts:** Overline „Ezarri · Kollektion“, H1 Name, Code, Linie.
  - „Preis auf Anfrage“ als `PriceTag on-request`.
  - **Ausführungen** (`getVariants`): Format 25/50/Hexa, Safe, Corner, Cove als `SwatchGroup`-Links auf die jeweilige Seite.
  - **Maße** als Zeichnung: SVG-Blatt mit Steinraster (`masse.blatt_cm`, `steine_pro_blatt`, `stein_mm`, Fuge 1,1 mm), bei 375 px lesbar.
  - Facts: Dicke, Oberfläche, Rutschhemmung, Einsatz, Wasserwirkung, Fugenempfehlung, Verpackung (Blatt/Karton, m²/Karton, m²/Palette, kg/m²).
- **Aktionen:**
  - Primär „Muster anfragen“ (→ `/anfrage?ref=<id>&art=muster`).
  - Sekundär „Im Konfigurator ansehen“ (`/konfigurator?m=<konf-id>`, nur wenn `imKonfigurator`) und „Menge berechnen“ (`/rechner?ref=<id>`).
  - Dazu ♡ und Vergleichen.
- **Darunter:**
  - „Der Satz der Beraterin“: eigener Text, leer bis geliefert, kein Platzhaltertext live.
  - Datenblatt, Ähnliche (`getSimilar`), „Passt zu“: gleiche Kollektion, andere Wasserwirkung.
  - Verlegehinweis-Link nach Typ (Pool → Verlegung).
- **Daten-Lücken** (`unsicher`) werden ehrlich gezeigt („Format laut Ezarri nicht angegeben“), nie aufgefüllt.

### 3.6 Galerie `/galerie`
- Filter wie Ezarri, aber mit Textlabels: Einsatz, Wasserfarbe, Kollektion, Farbfamilie, Format, Safe, Corner/Cove.
- Raster mit höchstens 3 Spalten, `?seite=` mit 24 pro Seite (`getGallery`), Lightbox als `<dialog>` mit Scroll-Snap.
- Jedes Bild verlinkt sein Mosaik: „Dieses Mosaik: Washes 25 →“.
- Videos (13) nur als `VideoFacade` mit Consent, Poster aus dem Mosaikbild.
- Bildtext immer „Projekt mit Ezarri-Mosaik · Bild: Ezarri“. Nie Ort oder Kunde erfinden.
- Performance: Ezarri lädt 48 MB, bei uns sind es pro Seite 24 × 600-px-AVIF (≈ 1,5–2,5 MB), `loading="lazy"` ab Bild 4.

### 3.7 Technik `/technik/**`
- **JointPoint:** Erklärgrafik als eigenes SVG (punktuelle Verklebung gegen Papier/Netz). Herstellerangaben mit „laut Ezarri“.
- **Verlegung:** Wahl des Beckentyps (Beton, verzinkter Stahl, Polystyrol, Polypropylen, Polyester) als RadioCard, dann 9 Schritte als `Stepper` mit nummerierter Liste, ohne JS komplett lesbar (`<ol>`).
  - Werte aus Ezarri: Restfeuchte < 3 %, Kleber ≥ C2TE, 6-mm-Zahnkelle, Epoxidfuge RG, 24 h.
  - Hinweis: „Die Verlegung übernimmt ein Fliesenleger-Fachbetrieb.“ Das ist keine eigene Leistung (Gewerbe-Regeln wie Outdoor).
- **Pflege:** 8 Themen als `<details>`, eigene Texte.
- **Fragen:** 18 Fragen, eigene Antworten. „Privatkunden kaufen über Händler“ wird zur Antwort „So kaufen Sie Ezarri-Mosaik bei uns“.
- **Downloads:** Liste aus `getDatasheets()` plus ISO 9001, ISO 14021 und Garantie. Die PDFs liegen heute unter `Herstellermaterial/Ezarri/pdf/` und **nicht** unter `public/`.
  - Phase 1: Link auf die Ezarri-URL mit Quellenangabe.
  - Phase 2: lokale Kopie unter `public/ezarri/pdf/`, wenn der Inhaber es will.
  - Kataloge (8) gibt es nur nach Login bei Ezarri, deshalb „Katalog anfragen“ (→ Anfrage).
- **Rechner** ist Team C, der Technik-Hub verlinkt ihn.

---

## 4. Konfigurator „Becken“ (Team B) – besser als Ezarri

### 4.1 Parität (vollständig, jede Zeile aus `ezarri-analyse.md` §14 und §1.3)
| Ezarri | Bei uns | Abnahme |
|---|---|---|
| 3 Einstiege: eigener Mix, Ezarri-Referenz, Pattern | Start-Blatt mit 3 Karten als `radiogroup`: „Ein Mosaik“, „Eigene Mischung“, „Muster/Pattern“. Dazu „Fertige Ezarri-Mischung“ (Rezepte) als vierte Karte | Tastatur, 1 Tap mobil |
| Panoplia mit Filter Sammlung, Farbe, Format | Bottom-Sheet (`<dialog>`) mit Suche, Farbfamilie, Serie, Format, „nur mischbar“, virtuelle Liste mit 201 Einträgen, Thumbnails mit Alt-Text | ≤ 100 ms Filter |
| Mischung bis 4 Referenzen, Prozent-Slider plus Zahlenfeld, `mezclable` | Bis 4 (`MAX_MIX`). **Anteilsband**: eine Leiste mit ziehbaren Grenzen plus Zahlenfeld plus ±-Knöpfe (WCAG 2.5.7). Nicht mischbare Mosaike lassen sich nur allein wählen, mit Erklärung statt stummem Sperren | Summe immer 100 |
| Rezepte fertiger Mischungen (`cf_mosaico`/`percent`) | `parseRecipe()`: 57 Rezepte als „Ezarri-Mischungen“ ladbar und dann veränderbar | |
| Kanäle bis 3 (`esCanal`) | Bahnmarkierung, Randstreifen, Treppenkante. Je Kanal Mosaik, Breite und Lage (Boden-Bahnen, Wasserlinie, Stufen) | |
| 7 Fugenfarben | 7 Fugen (`getGrouts`) als Swatches mit Name. Live im Shader | |
| Format 25/50/Hexa | Umschalter. Der Shader wechselt Raster und Steinmaß (24,7 / 50,7 / Hexa 33,4 mm) | |
| Spezialteile Corner, Cove | Schalter „Kanten mit Corner“, „Hohlkehle mit Cove“. Die Geometrie zeigt sie an Beckenrand und Bodenkehle, die Mengen gehen in lfm an den Rechner | |
| Fotoszenen mit ≥ 2 Kameras | 5 Kamerapunkte je Szene (Übersicht, Treppe, Wasserlinie, Unterwasser, Vogel). Dazu „Fotoansicht“: passende Ezarri-Fotos des gewählten Mosaiks | |
| 3D-Becken, Orbit, Zoom | R3F, Orbit/Zoom per Maus, Touch, Tastatur (Pfeile, +/−) | |
| Wasser bewegt, ruhig, leer | Alle 3 bedienbar (bei Ezarri totgelegt) | |
| AR | `<model-viewer>` nach Klick, GLB live aus der aktuellen Szene exportiert (`GLTFExporter`), Maße = eigene Maße. iOS: USDZ automatisch durch model-viewer | iPhone, Pixel |
| Neu starten | „Neu beginnen“ mit Rückfrage. Dazu Rückgängig/Wiederholen (Strg+Z) | |
| PDF-Datenblatt | „Blatt drucken/PDF“: Druckseite mit Rendering, Rezept, Fuge, Format, Maße, Mengen, QR zum Teilen-Link (`qrcode`, installiert), Quellenangabe. **Ohne Lead-Gate** | |
| Angebot anfordern (m², Zusatzprodukte, Profil) | Übergabe an `/anfrage?k=…` (Team C). Mengen und Zusatzprodukte (Kleber, Fuge, Corner/Cove, Werkzeug) sind vorbefüllt, Profil optional | 4 Pflichtfelder |

### 4.2 Die stärksten Verbesserungen (Reihenfolge = Bau-Reihenfolge)
1. **Eigenes Becken statt 8 × 4 m:**
   - Länge 2–25 m, Breite 1,5–12 m, Tiefe flach/tief 0,8–2,5 m mit stufenloser Schräge.
   - Formen: Rechteck, Rechteck mit runden Enden, L-Form, Ecken mit Radius.
   - Treppe: römisch, Ecktreppe, Vollbreite, keine. Dazu Sitzbank.
   - Rand: Skimmer, Überlauf (Finnische Rinne), Infinity-Kante.
   - Weitere Szenen: **Whirlpool**, **Dusche/Bad** (Wand plus Boden, Maße), **Küchenrückwand** (Fläche). Damit deckt der Konfigurator alle Einsatz-Welten ab.
   - Geometrie parametrisch in `src/lib/ezarri/konfigurator/geometry.js`. Dieselbe Funktion liefert die Flächen in m² und die Kanten in lfm für den Rechner (Vertrag §7.4).
2. **Echtes Material pro Steinchen:**
   - Prozeduraler Mosaik-Shader (`onBeforeCompile` auf `MeshPhysicalMaterial`): Zell-ID aus UV und Steinmaß, Hash → kumulative Anteile → Mosaik-Index.
   - Palette als `DataTexture` mit maximal 4 + 3 Einträgen: Farbe, Rauheit aus `glanz`, Metallic aus `reflexion`, Iridescence/Perlmutt bei Finish „nacar“, Spiegel bei „espejo“, Nachleuchten bei Fosfo.
   - Pro Stein ±3 % Farbstreuung (Glas ist nie einfarbig), Fase als prozedurale Normale, Fuge in Fugenfarbe.
   - Ezarri nimmt Glanz und Iridescence vom dominanten Mosaik. Bei uns hat jedes Steinchen seine eigenen Werte.
   - Für 57 Mosaike ohne Hex misst Team B die Farbe einmalig aus den Vorschaubildern (`tools/ezarri/palette.mjs` mit sharp → `src/lib/ezarri/konfigurator/measured-colors.json`) und dokumentiert das.
3. **Wasser, das wie Wasser wirkt:**
   - Prozedurale Kaustik (animiertes Voronoi/Worley im Boden- und Wandshader, projiziert nach Sonnenrichtung) statt 10 gebackener Lightmaps.
   - Tiefenabhängige Absorption (Beer-Lambert pro Fragment aus der Beckentiefe): flach heller und türkiser, tief satter.
   - Fresnel-Reflexion an der Oberfläche, Wasseroberfläche mit 2 Normal-Layern in Bewegung.
   - Zustände bewegt, ruhig und leer.
   - Die **Wasserwirkung als Ergebnis** steht als Text daneben, aus Ezarris Wasserfarbe-Zuordnung („laut Ezarri: türkisblau“).
4. **Licht:** Tageszeit-Regler (Morgen, Mittag, Abend, Nacht) bewegt die Sonne, Himmel als Verlauf ohne HDRI-Download. Unterwasser-LED weiß oder farbig (3 Positionen). Das „Seelicht“ der Marke wird hier zum Pool-Licht.
5. **Mengen live:** Die Fußleiste zeigt „ca. 106 m² · 54 Kartons · Corner 28 lfm“ aus `geometry.js` und dem Rechner-Kern von Team C. Der Link „Genau berechnen“ führt in den Rechner mit denselben Maßen.
6. **Teilen, Merken, Rückgängig:**
   - Der ganze Zustand steht kompakt im Parameter `?k=` (versioniertes base64url-JSON, ≤ 600 Zeichen).
   - Er wird beim Neuladen wiederhergestellt und ist als Link teilbar.
   - Undo-Stapel mit 50 Schritten. Speichern in der Merkliste als „Becken-Entwurf“.
7. **Vergleich A/B:** Zwei Mischungen nebeneinander, mobil per Umschalter, mit Trennlinie zum Ziehen und Knöpfen.
8. **Mobil zuerst:**
   - Bühne oben 4:5 (`svh`), Steuerung als Bottom-Sheet mit 3 Rasthöhen.
   - Trefferflächen ≥ 44 px, kein Element außerhalb der Daumenzone. Ezarris „+“ war auf Pixel 7 nicht treffbar.
9. **Barrierefreiheit:**
   - Jede Einstellung ist ein DOM-Steuerelement, die Canvas ist `aria-hidden`.
   - Eine Zusammenfassung mit `aria-live` sagt etwa „Becken 10 × 5 m, Mischung Niebla 2502-A 70 %, Zen Dune 30 %, Fuge Bianco Assoluto“.
   - Reduced Motion: Wasser ruhig, keine Kamerafahrt, Kaustik steht.
10. **Datenschutz:** kein Tracker, kein Drittanbieter-Render, kein iframe. Analytics nur nach Consent über `src/lib/analytics.js`.

**Phase 2 (nicht im ersten Bau, im Konzept vorgesehen):**
- **Fotomontage:** eigenes Poolfoto hochladen, 4 Eckpunkte setzen, Homographie, Mosaik einblenden. Alles nur im Browser, kein Upload zum Server, EXIF wird verworfen.
- Vorher/Nachher-Regler.
- Die Ordner dafür heißen `foto-montage/`, **nicht** `upload/`, weil `upload/` für ein anderes Team reserviert ist.

### 4.3 Technik und Budget
- **Insel-Schnitt:**
  - `src/components/Ezarri/Konfigurator/Konfigurator.js` (`'use client'`) enthält alle DOM-Steuerelemente und den Zustand (`useReducer` plus `state.js`).
  - `Stage3D.js` wird per `next/dynamic` mit `ssr: false` geladen. `three`, `@react-three/fiber` und `@react-three/drei` liegen **nur** im Lazy-Chunk.
  - `model-viewer` lädt erst beim AR-Knopf.
- **Ladeablauf:**
  1. Server rendert das Poster (vorgerenderte AVIF-Standbilder je Szene, mobil/desktop, ≤ 120 KB). Das ist das LCP.
  2. Danach kommen DOM-Steuerelemente und die 2D-Vorschau.
  3. 3D startet auf Desktop ≥ 1024 px ohne Save-Data bei Sichtbarkeit, sonst per Knopf „In 3D ansehen“. Das ist das Muster der Werfthalle, das sich in der Yacht-Abnahme bewährt hat.
- **Budget:**
  - JS initial ≤ 230 KB gzip (Bibel: Konfigurator).
  - 3D-Chunk ≤ 250 KB gzip, Erstansicht gesamt ≤ 2 MB. Ezarri: 42 MB.
  - Keine Texturen > 256 KB. Mosaike sind prozedural, Thumbs als 600er-AVIF nur in der Auswahl.
- **Render:**
  - `frameloop="demand"`. Bei Wasser „bewegt“ läuft ein Loop mit 30 fps, der stoppt, wenn der Tab im Hintergrund ist oder die Bühne außerhalb des Viewports liegt.
  - Fester dpr (Touch 1,25, sonst 1,5). Das ist eine Lehre aus Yacht: dpr-Wechsel leerte die Bühne in WebKit.
  - Keine Shadow-Maps, < 60 k Dreiecke.
- **Ohne WebGL / bei Kontextverlust:**
  - **2D-Flächenvorschau** (Canvas 2D) zeigt dieselbe Mischung als Mosaikfläche mit Fuge und Format, plus Kanäle als Streifen und Wasserfarbe als Lasur.
  - Alles außer Orbit, Licht und AR funktioniert weiter: Mengen, Teilen, PDF, Anfrage.
  - Dieselbe 2D-Vorschau nutzt Team C im Custom-Mix-Mischpult (Vertrag §7.4).
- **Tests:**
  - Unit: Mischlogik (Summe 100, mischbar-Regel, Rezepte), `state.js` (Codec hin und zurück, Versionierung, Grenzwerte), `geometry.js` (Flächen 10 × 5 × 1/2 m gegen Ezarris Beispiel 106 m² mit 10 % Marge).
  - E2E: Laden ohne WebGL (`--disable-gpu`), Tastaturbedienung, 375 px ohne Querscroll, `?k=` wiederherstellen, kein three-Chunk im Initial-Bundle (Muster `r4-ci-bundle-budget`).

---

## 5. Gestaltung: Wasser als Thema, Bibel als Gesetz

### 5.1 Grundhaltung
Wasser ist das Thema, aber nicht die Oberflächenfarbe:
- Die UI bleibt Paper, Stone und Ink (≥ 85 % Neutraltöne). **Die Farbe kommt aus dem Mosaik und dem Wasser in den Bildern** (Bibel §4: „Gesättigte Farbe kommt aus den Produkten“).
- Kein Blau-Theme, keine Wellen-Ornamente, keine Glas-Glanzeffekte auf Knöpfen.

### 5.2 Gestaltungsmittel (alle tokenkonform)
- **Wasserlinie statt Horizontlinie:**
  - Die eine Signatur-Linie pro Seite (§6 Horizon) sitzt in der Ezarri-Welt als „Wasserlinie“ auf 38 % der Abschnittshöhe.
  - Darüber steht das Bild über Wasser, darunter die Mosaik-Nahaufnahme. Die Linie ist 1 px `line-strong`, die Komponente `Horizon` wird wiederverwendet.
- **Das Steinraster als Ordnung:**
  - Karten und Bildflächen folgen dem 8-px-Raster. Mosaikbilder stehen immer 1:1 (Format „Material“).
  - Im Hintergrund gibt es nirgends ein Mosaikmuster als Dekor (P3 „Material statt Dekor“).
- **`see`-Token** (`#4f6b68`, 5,45:1) ist der einzige Akzent für Wasser-Bezüge, z. B. die Overline „Wasserwirkung“ und der aktive Filter-Chip. Er wird nicht flächig eingesetzt.
- **Muster-Punkte:** Farbfamilien und Fugen als 24-px-Swatch mit Textlabel. Die Hex-Werte in `facets.js` sind Daten, kein Styling-Hex in Komponenten (Lint). Swatches bekommen die Farbe per `style={{"--swatch": hex}}`.
- **Typografie:** wie Bibel. Kollektionsnamen in Bodoni ab 32 px, Codes in Instrument `tabular-nums`.
- **Bilder:** Ezarri-Bilder in eigenen Modulen mit Credit. Für das Gastgeber-Band und die Prozessskizze nur eigene Fotos (Shotliste-Ergänzung: Mustertafel im Showroom, Hände mit Mosaikblatt im Streiflicht am Café-Tisch, Pfänder-Licht auf Glas).

### 5.3 Motion
- **Signature „Lichtnetz“ (1× pro Seite, nur Startseite und Einsatz-Welten):** Über dem Mosaikbild der Wasserwirkung-Sektion wandert eine CSS-Kaustik.
  - Umsetzung: zwei überlagerte SVG-Turbulenz-Masken, nur `transform`/`opacity`, Deckkraft ≤ 0,18.
  - Atmosphäre über 2400 ms im Loop, pausiert nach 5 s ohne Interaktion bzw. mit Pause-Knopf (WCAG 2.2.2).
  - Bei Reduced Motion oder „Ruhige Ansicht“ steht sie still.
- **Rückmeldung:** Filter ≤ 100 ms, Mosaikwechsel im Konfigurator 240 ms (`--duration-swap`). Kamerafahrten 400 ms (`--duration-morph`), bei Reduced Motion Schnitt statt Fahrt.
- Keine Scroll-Hijacks, kein Lenis, kein Autoplay-Video.

### 5.4 Abnahme Gestaltung (für alle Teams)
- 1 H1, 1 Primärknopf pro Ansicht, 1 Walnut-Fläche pro Seite, 0 Radien, 0 Schatten außer Sheet und Dialog.
- Text ≥ 4,5:1, auf Bildern mit Verlauf ink-deep 0 → 55 %.
- 375/393/412 px ohne Querscroll.
- axe ohne serious/critical.
- Prüfwerkzeug: `node tools/qa/shoot.mjs qa-screenshots/ezarri/<team> <urls>`.

---

## 6. SEO-Plan (wirksam erst mit `EZARRI_PUBLIC = true`)

### 6.1 Keyword-Cluster und Zielseiten
| Cluster | Beispiele | Zielseite |
|---|---|---|
| Marke + Region | ezarri österreich, ezarri vorarlberg, ezarri händler schweiz, ezarri mosaik kaufen | `/ezarri` (Brand-Hub). „händler“ steht nur bei geprüftem Claim im Title |
| Glasmosaik Pool regional | glasmosaik pool vorarlberg, poolmosaik bodensee, pool fliesen mosaik schweiz, glasmosaik pool st. gallen | `/ezarri/pool` (eine Seite, Regionen im Text und in der Dreiländer-Zeile, **keine** Doorway-Seiten je Ort) |
| Einsatz | mosaik dusche rutschfest, glasmosaik bad, mosaik küchenrückwand, glasmosaik fassade | `/ezarri/bad`, `/kueche`, `/fassade`, `/wellness` |
| Wasserfarbe (Informations-Intent) | welche poolfarbe wirkt türkis, poolfliesen farbe wasser, pool wie bergsee | `/ezarri/wasser` |
| Kollektion / Produkt | ezarri niebla, ezarri zen dune, ezarri gea basalt, 2502-a ezarri | `/kollektionen/[k]`, `/mosaike/[r]` |
| Werkzeug | pool mosaik rechner, wie viel mosaik pool, pool mosaik konfigurator | `/ezarri/rechner`, `/ezarri/konfigurator` |
| Technik | jointpoint ezarri, glasmosaik pool verlegen, epoxidfuge pool | `/technik/**` |

Titel-Muster:
- Hub: „Ezarri Glasmosaik in Vorarlberg & am Bodensee | Platzhirsch“.
- Mosaik: „Ezarri {Name} – {Kollektion}, {Format} | Platzhirsch Lochau“.
- Description: Fakten (Format, Oberfläche, Wasserwirkung) plus „Muster und Beratung in Lochau“, ≤ 160 Zeichen (`toMetaDescription`).

### 6.2 Strukturdaten (JSON-LD, Muster `src/components/Reusable/JsonLd`)
- **Brand** `@id https://platzhirsch.studio/#brand/ezarri`:
  - Gleicher Knoten wie Markenseiten (`brandNodeId("ezarri")`), `sameAs` = ezarri.com, `logo` nur wenn die Datei vorliegt.
- **Product** je Mosaik-Detailseite:
  - Felder: `name`, `sku` = Code, `brand` → Brand-@id, `material` „Glas (recycelt, laut Ezarri)“, `color`, `image` (Ezarri-URLs mit unserem Pfad), `category` „Glasmosaik“, `additionalProperty` (Format, Stein mm, Dicke, Rutschhemmung, Oberfläche).
  - **Kein `offers`** (kein Preis, nichts erfinden). Damit gibt es kein Rich Result, die Entity ist aber sauber. Keine `aggregateRating`.
- **CollectionPage + ItemList** für Kollektionen, Übersicht und Einsatz-Welten.
- **ImageGallery** für die Galerie, mit `creditText` „Ezarri“ und `copyrightHolder` Ezarri je Bild.
- **BreadcrumbList** überall (`src/lib/seo/breadcrumbs.js`).
- **WebApplication** für Konfigurator und Rechner (`applicationCategory` DesignApplication, `offers` price 0 nur als „kostenlos nutzbar“ – **[prüfen]**: lieber weglassen, wenn unsicher).
- **FAQPage** auf `/technik/fragen`: zulässig, aber seit 2023 ohne Rich Result für Händler. Wird nur wegen Klarheit ausgegeben.
- Kein HowTo (von Google eingestellt). Verlegung als `Article`.
- Store-Bezug: Die Organisation (siteSchema) bekommt bei `EZARRI_PUBLIC` `brand: {@id ezarri}` nur, wenn der Claim im Register steht.

### 6.3 Indexierung, canonical, hreflang
- **Indexierbar** (bei `true`):
  - Hub, 5 Einsatz-Welten, `/wasser`, Kollektionen-Index und 14 Produktkollektionen.
  - Die Dienstleistungs-Kollektionen leiten in `/custom-mix…` (indexierbar).
  - Basis-Mosaike (typ `mosaik`, 281), Galerie Seite 1, Technik-Seiten, Konfigurator, Rechner, Custom Mix.
- **`noindex, follow`:**
  - Filter-URLs (`?` außer `seite`), Galerie ab Seite 2 (canonical selbst, `noindex, follow` – Paginierung bleibt crawlbar).
  - Vergleich, `?k=`-Zustände, Anfrage und Danke.
  - Safe/Corner/Cove-Detailseiten (canonical → Basis-Mosaik, wenn `getVariants` es kennt, sonst selbst).
- **Canonical** ist immer ohne Query, außer `?seite=n` auf sich selbst.
- **hreflang:**
  - Phase 1 nur `de`, `de-AT`, `de-CH`, `x-default` → deutsche URL, keine Verweise auf 404-Locales. Lehre aus Commit 6de7c13: FR/IT-hreflang auf 404.
  - Team A baut dafür einen kleinen Wrapper um `hreflangLanguages`, der nur aktive Locales ausgibt.
  - Phase 2 die volle Liste aus `pageMetadata.js`.
- **Sitemap:**
  - Neue Datei `src/lib/ezarri/sitemap.js` (Team A) mit `getEzarriEntries()`. Sie liefert `[]`, wenn `!ezarriInSitemap()`.
  - `lastmod` = `DATA_STAND` bzw. das Datum der Seitenänderung, nie `new Date()`.
  - Einbindung als eigene `sitemap-ezarri.xml` macht der Teamleiter (§7.5).
- **`/llms.txt`:** eine Faktenzeile je Hauptseite, keine Händler-Aussage ohne Registereintrag.
- **Bilder:** Dateinamen sind sprechend (Ezarri-Namen), Alt-Text nach dem Muster „Ezarri {Name}, Glasmosaik {Format}, {Oberfläche}“ bzw. bei Anwendung „Pool mit Ezarri {Name}, {Wasserwirkung}“.
- **Doorway-Schutz:** Keine Seiten nach dem Muster „Glasmosaik {Ort}“. Regionen stehen in Text, Strukturdaten (`areaServed`) und Regionsseiten (Verlinkung von `designermoebel-st-gallen` usw. auf `/ezarri/pool` als Abschnitt, Teamleiter).

---

## 7. Teams, Dateigrenzen, Verträge

### 7.1 Team A „Ezarri-Welt & Sortiment“
**Schreibt:**
- `src/app/[locale]/ezarri/**` **außer** `konfigurator/`, `rechner/`, `custom-mix/`, `anfrage/`. Darin auch `layout.js` der Ezarri-Welt für die lokale Navigation. Kein eigenes `<main>`, das liefert das Root-Layout; vorher die Struktur prüfen.
- `src/components/Ezarri/Katalog/**` (Karten, FilterIsland, FilterSheet, ActiveFilters, Vergleich, Galerie, Lightbox, Maßzeichnung, FactList-Varianten, Hero, Wasserwirkung, Lichtnetz, LocalNav, Credit)
- `src/lib/ezarri/config.js`, `copy.js`, `data.js`, `facets.js`, `images.js`, `sitemap.js`, `schema.js` (JSON-LD-Builder)
- `tests/unit/ezarri-a-*.test.mjs`, `tests/e2e/ezarri-a-*.spec.js`

**Liefert:**
- Alle Seiten aus §2/§3 außer B/C, SEO aus §6.
- Den gemeinsamen Ezarri-Seitenrahmen: Komponente `EzarriShell` oder `layout.js` mit LocalNav, Credit-Fußnote und Schluss-CTA. Die anderen Teams nutzen ihn.
- `copy.js` mit allen deutschen Texten der Welt inklusive `DEALER_CLAIM` und `NEUTRAL_CLAIM`.
- Rechtschreib- und Claim-Prüfung: `npm run check:claims` muss grün bleiben.
- Datenpflege:
  - Rutschhemmung normalisiert (erledigt in `getSlipResistance`).
  - `wasserfarbe` als Liste (erledigt in den Karten).
  - Fehlende Formate oder Farben werden als Lücke gezeigt.

**Reihenfolge:**
1. `layout.js` + LocalNav + Hub
2. `/mosaike` + Detail
3. Kollektionen
4. Galerie
5. Einsatz-Welten + `/wasser`
6. Technik
7. Vergleich
8. SEO/Sitemap

### 7.2 Team B „3D-Konfigurator“
**Schreibt:**
- `src/app/[locale]/ezarri/konfigurator/**` (page.js, Druckansicht `blatt/page.js`, Poster-Assets)
- `src/components/Ezarri/Konfigurator/**`
- `src/lib/ezarri/konfigurator/**`:
  - `state.js` (Zustand, Reducer, `?k=`-Codec, Versionierung)
  - `mix.js` (Mischregeln, Zuteilung pro Zelle, deterministischer Seed)
  - `geometry.js` (Becken, Szenen, Flächen m², Kanten lfm)
  - `preview2d.js` (Canvas-2D-Renderer, auch für C)
  - `measured-colors.json`
  - `shader/*`
- `public/ezarri/konfigurator-poster/**`, `tools/ezarri/**` (Palette messen, Poster rendern)
- `tests/unit/ezarri-b-*.test.mjs`, `tests/e2e/ezarri-b-*.spec.js`

**Liest:** `data.js` (`getConfiguratorPalette`, `getGrouts`, `getPatterns`, `parseRecipe`, `MAX_MIX`), `config.js`, `facets.js`, `images.js`, `src/lib/ezarri/rechner/core.js` (von C).

**Liefert:** Alles aus §4. **Zuerst** (Tag 1–2, damit C starten kann): `state.js` mit festem Schema, `mix.js` und `preview2d.js` als reine Module mit Tests.

### 7.3 Team C „Rechner, Custom Mix & Anfrage“
**Schreibt:**
- `src/app/[locale]/ezarri/rechner/**`, `src/app/[locale]/ezarri/custom-mix/**`, `src/app/[locale]/ezarri/anfrage/**`
- `src/components/Ezarri/Rechner/**`, `src/components/Ezarri/CustomMix/**`, `src/components/Ezarri/Anfrage/**`
- `src/lib/ezarri/rechner/**`: `core.js` mit der reinen Mengenformel, `zusatz.js` mit Kleber, Fuge und Werkzeug
- `src/app/api/ezarri/**`
- `tests/unit/ezarri-c-*.test.mjs`, `tests/e2e/ezarri-c-*.spec.js`

**Liefert:**
- **Rechner:**
  - Alle Ezarri-Eingaben: Format, L, B, Tiefe max/min/Ø, Marge.
  - **Dazu:** Ø-Tiefe automatisch, Formen aus `geometry.js` (Treppe, Bank, Rinne, runde Enden).
  - Ergebnis: m², Kartons je Format (aus `getPackaging`), Paletten, Gewicht, Kleber (Ezarri-Faktor ≈ 2,5 kg/m²) und Fuge (≈ 1,2 kg/m²) als Herstellerangabe, Corner/Cove in lfm.
  - Skizze der Flächen als SVG, Übergabe „In den Konfigurator“ und „Angebot anfragen“.
  - **Prüfwert:** 10 × 5 m, Tiefe 2/1/1,5 m, 10 % Marge → 106 m², 265 kg Kleber, 127 kg Fuge (Ezarri-Beispiel).
- **Custom Mix:**
  - 2D-Mischpult mit `mix.js` und `preview2d.js` von B, ohne 3D.
  - Dienstleistungsseiten Custom Mix, Custom Printed, Custom Pixel, Patterns, Fading out, Standard Printed/Pixel mit Motiven aus `data.js`.
  - **Pixel-Generator** im Browser: Bild wählen per `<input type=file>`, nur lokal, Canvas, Quantisierung auf die 25-mm-Palette (`getConfiguratorPalette`), Größe in m, Steine pro Farbe, Vorschau, „Anfragen“ mit Parametern ohne Bild-Upload.
  - Ordnername `pixel/`, nie `upload/`.
  - **Fading out:** Verlauf über die Beckentiefe als 2D-Vorschau, die 4 Ezarri-Verläufe aus den Daten.
- **Anfrage:**
  - Ein Formular für Muster, Beratung und Angebot, Art per RadioCard.
  - 4 Pflichtfelder: Name, E-Mail oder Telefon, Art, Einwilligung zur Kontaktaufnahme.
  - Optional: Ort/Land, Profil (Privat, Architekt, Bauunternehmen, Pool- oder Fliesenfachbetrieb, Hotel), Projektzeitraum, m².
  - Bis 6 Muster-Referenzen als Chips, vorbefüllt aus `?ref=` oder `?k=`.
  - Mit Honeypot, `_t` und Formular-Vertrag (`src/lib/forms/client.js`, `guard.js`, `forward.js`). Das zod-Schema liegt in `src/app/api/ezarri/anfrage/schema.js` (rein, auch vom Formular importierbar).
  - Die API `src/app/api/ezarri/anfrage/route.js` leitet wie die bestehenden Anfrage-Routen weiter.
  - **Im Dev und in Tests wird nie echt abgesendet.** Der Schalter `EZARRI_ANFRAGE_DRY_RUN` gilt außer in Produktion: Die Route antwortet mit `{success:true, dryRun:true}`, ohne Backoffice-Aufruf. E2E-Tests fangen den Request per `page.route` ab.
  - Bestätigung inline mit Ansprechperson und nächstem Schritt.
  - „Muster kostenlos“ steht **nicht** im Text, solange der Inhaber es nicht bestätigt: **[Inhaber klären: Musterbedingungen Ezarri]**.

### 7.4 Verträge zwischen den Teams (Schnittstellen, nicht brechen)
1. **Konfig-Zustand** (B → A, C):
   - Code: `src/lib/ezarri/konfigurator/state.js`.
   - Exporte: `encodeState(state) → string`, `decodeState(string) → state | null` und `DEFAULT_STATE`.
   - Schema v1: `{v:1, szene:"pool"|"whirlpool"|"bad"|"kueche", becken:{form, l, b, tFlach, tTief, treppe, bank, rand}, format:"25"|"50"|"hexa", mix:[{id, anteil}], kanaele:[{id, lage, breite}], fuge:id, spezial:{corner:bool, cove:bool}, wasser:"bewegt"|"ruhig"|"leer", zeit, led}`.
   - Felder dürfen nur dazukommen. Bei einer Umbenennung wird `v` erhöht und der alte Decoder bleibt.
2. **Flächen** (B → C):
   - `geometry.areas(becken) → {boden, waende:[…], treppe, bank, gesamt, kantenLfm:{corner, cove}}` in m².
   - Die Werte sind identisch mit der 3D-Geometrie.
3. **Mengen** (C → B, A):
   - `rechner/core.js`: `quantities({flaechen, margeProzent, packaging}) → {m2, kartons, paletten, kgMosaik, kgKleber, kgFuge, lfmCorner, lfmCove}`.
   - Das Modul ist rein, ohne React.
4. **Mischung und 2D-Vorschau** (B → C):
   - `mix.js`: `normalizeMix`, `canMix`, `cellAssignment(seed, mix, w, h)`.
   - `preview2d.js`: `drawMosaic(ctx, {mix, palette, format, fuge, kanaele, wasser})`.
5. **Anfrage-Einstieg** (C → A, B):
   - URL `/ezarri/anfrage?art=muster|beratung|angebot&ref=id1,id2&k=<state>`.
   - Komponente `src/components/Ezarri/Anfrage/AnfrageLink.js` (Server-sicher) baut den Link.
6. **Seitenrahmen und Credit** (A → B, C):
   - `src/components/Ezarri/Katalog/EzarriShell.js` bzw. `layout.js`, `Credit.js`, `LocalNav.js`.
   - B und C rendern innerhalb dieses Layouts. `copy.js` ist für B und C nur lesbar, eigene Texte legen sie in eigene `copy.js` ihres Ordners (`src/lib/ezarri/konfigurator/copy.js`, `src/lib/ezarri/rechner/copy.js`).
7. **Metadaten:** Jede Seite aller Teams nutzt `withEzarriRobots()` und `ezarriLocaleEnabled()` (sonst `notFound()`).

### 7.5 Integrationsliste für den Teamleiter (fremde Dateien, kein Team schreibt dort)
| Datei | Änderung | Wann |
|---|---|---|
| `src/lib/legal/claims.js` + `tests/unit/claims.test.mjs` + `r3-marken-legal.test.mjs` | `ezarri` in `VERIFIED_DEALER_BRANDS`/`CLAIM_REGISTER`, `"Ezarri"` in `KNOWN_BRANDS`, `/ezarri/**` → brandSlug `ezarri` | vor `EZARRI_PUBLIC = true` |
| `src/lib/features.js` | Eintrag `ezarri`: `status` „aufbau“ → „beta“/„live“, `note` entfernen. Menü-Sichtbarkeit zusätzlich an `ezarriInNavigation()` koppeln, die Labs-Karte bleibt | wenn Hub steht |
| `src/components/Navbar/shellNav.js` | `"ezarri"` in `GERMAN_ONLY_FIRST_SEGMENTS`. Sonst bricht `tests/unit/r6-shell-perf.test.mjs`, sobald `src/app/[locale]/ezarri/page.js` mit `locale !== "de" … notFound()` existiert. Der Sprachumschalter würde außerdem auf /en/ezarri (404) zeigen | **sofort mit Team A Schritt 1** |
| Navbar/Mega-Menü, Footer | Teaser „Pool & Glasmosaik“ unter Outdoor, Ezarri unter Marken | mit `true` |
| `src/lib/seo/sitemapEntries.js`, `src/app/sitemap.xml/route.js` | `sitemap-ezarri.xml` mit `getEzarriEntries()` | mit `true` |
| `src/app/llms.txt/route.js` | Ezarri-Zeilen | mit `true` |
| `src/messages/*.json` | Übernahme aus `ezarri-messages-vorschlag.json` | Phase 2 |
| `outdoor-gartenplanung`, Regionsseiten | Rückverlinkung „Pool mit Glasmosaik“ | mit `true` |
| `.gitignore` / Deploy | `public/ezarri` ≈ 550 MB prüfen (Vercel-/Hosting-Limit), ggf. CDN oder nur genutzte Bilder ausliefern | vor Deploy |

### 7.6 Gemeinsame Regeln
- Keine Dateien in Ordnern mit den Namen `upload`, `Upload`, `concierge`, `yacht`, `stilfinder`, `kuechenplaner`, `sofaplaner`, `ar-viewer` usw. (TABU-Liste).
- `client-layout.js` und `[locale]/layout.js` bleiben unberührt.
- Neue npm-Pakete nur mit exakter Version, ≥ 14 Tage alt, mit Begründung in der Team-Doku. Ziel: keines nötig, alles ist installiert (three, R3F, drei, model-viewer, zod, qrcode, motion, embla, lucide, sharp).
- Vor dem Code die Next-16-Guides in `node_modules/next/dist/docs/` lesen: generate-metadata, dynamic imports, Route Handlers, `searchParams` als Promise.
- Ein Dev-Server (localhost:3000), kein `npm run build` im Repo, Playwright mit `PW_WORKERS=1`. Unit-Tests grün halten (`npm run test:unit`), eigene Tests ergänzen.
- Jedes Team schreibt seine Doku als `Marktresearch/digital/features/ezarri-team-{a,b,c}.md` mit Stand, Dateien, Tests und offenen Punkten.

---

## 8. Offene Punkte (Inhaber)
1. **Ezarri-Händlersuche:** Ist Platzhirsch dort gelistet? Das ist der Beleg-Link für das Claim-Register. Sonst gilt der interne Beleg.
2. **Muster:** Bedingungen der Musteranfrage (kostenlos? wie viele? Versand von Ezarri direkt oder über Lochau?) und ob es Muster im Showroom gibt.
3. **Kataloge (8):** über das Händlerkonto bei Ezarri besorgen (Login), dann `/technik/downloads`.
4. **Ezarri-Logo-Datei** und Nutzungsform (Pressebereich).
5. **Ansprechperson Ezarri** in Lochau (Name, Foto) für Beraterinnen-Satz und Bestätigung.
6. **Lieferweg in die Schweiz** für Mosaik (direkt ab Spanien oder über AT): bestimmt den CH-Text.
7. **`public/ezarri` mit 550 MB:** Hosting-Grenze vor dem Deploy klären.
