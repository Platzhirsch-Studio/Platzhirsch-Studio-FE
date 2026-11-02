# 12 – Content & Brand-Storytelling: Bauplan „Der Gastgeber für italienisches Wohnen am Bodensee“

**Stand:** 26.10.2026 · Rolle: Content-Stratege und Texter Luxus-Interior
**Grundlage:** Code-Stand `main` (96e4f50), `src/messages/*.json`, Live-Abfrage der News-API des Backoffice am 26.10.2026, Marktresearch 00, 23 (Abschn. 1, 4, 9, 10), 25, digital/01, Next.js-Guides unter `node_modules/next/dist/docs/01-app/02-guides/` (`mdx.md`, `videos.md`, `json-ld.md`, `internationalization.md`).
**Regeln dieses Plans:** keine Änderung an `src/` oder `public/`. Keine Händler-Behauptung für Minotti und Poliform (nur ClassiCon ist belegt). Alles muss ein Team von ~5 Personen tragen können.

> Kennzeichnung: **[belegt]** = im Code, in der API oder auf der genannten Website geprüft. **[Schätzung]** = eigene Herleitung. **[prüfen]** = vor Umsetzung klären. Versionen und Bundle-Größen sind Richtwerte, vor dem Einbau mit `npm view <paket> version` und `@next/bundle-analyzer` prüfen.

---

## 1. Ist-Zustand im Code

### 1.1 Wo heute Texte entstehen

| Ort | Inhalt | Pflege | Befund |
|---|---|---|---|
| `src/messages/de.json` (+ `en`, `fr`, `it`, je ~52–58 kB) | UI-Texte, Startseite, Über uns, Benefits, Prozess, Newsletter, Footer, Slider | im Repo, Entwickler | Teilweise gut (Home, Benefits, `about.first_section`), teilweise falsche oder leere Texte (siehe 1.3) |
| Backoffice-Doctype **News** (`src/lib/api/fetchNewsData.js`, Endpunkt `platzhirsch_studio…doctype.news.api.news_data`) | 31 Beiträge mit Feldern `name1`, `beschreibung`, `artikel_table` (Bildstrecke mit Bildunterschrift), `keywords_*`, `metadata_description_*` in 4 Sprachen | Backoffice (kein Schreibzugang für uns) | siehe 1.2 |
| `src/app/[locale]/news/page.js`, `news/[title]/page.js`, `src/components/News`, `NewsItem` | Liste und Artikel, lokalisierte Pfade (`/it/notizie`, `/fr/nouvelles`), JSON-LD | Code | Technik solide, `datePublished` kommt aus `daten` |
| `src/app/[locale]/designermoebel-*`, `moebel-bodensee`, `kuechen-vorarlberg`, `interior-design-vorarlberg`, `wohnzimmer-einrichten-vorarlberg` + `src/components/Landing/landingPage.js` | Stadt- und Themen-Landingpages als `CONTENT`-Objekt im JS, nur `de` (andere Sprachen 404) | Code | Gutes Muster für Ratgeber ohne Backoffice. Texte bewusst allgemein |
| `src/app/[locale]/ueber-uns/{platzhirsch,team,presse,partner,marken}` | Über uns, Team, Presse (17 Magazintitel als Liste), Partner | Code + Backoffice | Presse nur Titel ohne Inhalt; Team aus Backoffice (`fetchTeam.js`) |
| Vernissage-Block (`Vernissage` in `de.json`, Event 04.09.2026) | Event-Teaser mit Popup | Code | Zeigt nach dem Termin weiter ein vergangenes Event [belegt: Datum 04.09.2026] |
| `src/app/llms.txt/route.js` | KI-Suche | Code | Händler-Behauptung bereits entfernt (25, Sprint 1) |
| Produkte (`src/app/[locale]/produkte`, `fetchAllProdukte.js`) | 1.765 Produkte, Texte aus Backoffice bzw. Marken-Import | Backoffice | Produkttexte sind meist Herstellertexte [prüfen: Duplicate Content] |
| Newsletter (`src/components/Newsletter/newsletter.js`, `src/app/api/newsletter_subscribe/route.js`) | Anmeldung → Frappe-Doctype `newsletter_website` | Backoffice | Kein sichtbarer Double-Opt-in im Proxy, kein Sprach-/Interessenfeld [prüfen im Backoffice] |
| `src/lib/analytics.js` | `trackEvent`, `trackLead`, `contact_click` | Code | Basis für Content-Attribution vorhanden; Content-Events fehlen noch |

### 1.2 Der News-Bereich (Live-API, 26.10.2026) [belegt]

- **31 Beiträge, 29 davon mit Datum 14.01.2025** – das ist erkennbar das Importdatum, nicht das Erscheinungsdatum. Google und KI-Suchen sehen damit „alles vom selben Tag“, und Inhalte von 2022 („MINOTTI – Wir präsentieren die neue 2022 Collection“, „Unsere Broschüre 2022 ist da“, „Öffnungszeiten Jahreswechsel 2023/2024“) wirken aktuell.
- **Länge:** `beschreibung` 129–1.605 Zeichen, also ca. 20–250 Wörter. Die Bildstrecken (`artikel_table`, gesamt ~28.000 Zeichen JSON) tragen Bildunterschriften, aber kaum Text. Für Ranking zu dünn.
- **Inhalt:** fast ausschließlich Markenporträts (ClassiCon, Rimadesio, Flos, Paola Lenti, Poliform Day/Night/Cucine, Minotti, Solpuri, Quasar) in Herstellersprache. Einziger guter Stil-Anker: das wörtliche Zitat von Inhaberin **Susanne Messmer** im ClassiCon-Beitrag – persönlich, regional, glaubwürdig. Davon braucht es mehr.
- **Übersetzungen** (`beschreibung_en/it/fr`) sind wörtliche Maschinenübersetzungen, inkl. Tippfehlern aus dem Original („Jeds Jahr“).
- **Keywords** (`keywords_de`) sind Keyword-Listen ohne Suchvolumen-Bezug („zeitgenössische Designer Möbel von ClassiCon …“).
- Der neueste echte Beitrag ist die Vernissage Kaja El Attar (19.08.2026), gepflegt von einem Mitarbeiter-Account – das Backoffice wird also redaktionell genutzt, aber selten.

### 1.3 Konkrete Textfehler in `src/messages/*.json` (sofort korrigierbar)

| Schlüssel | Problem | Vorschlag |
|---|---|---|
| `About.ourMissionDesc`, `About.yourVisionDesc` (alle 4 Sprachen) | Text einer **Werbeagentur**: „Markenidentitäten stärken“, „Brücke zwischen Design und Strategie“, „maßgeschneiderte Markenstrategien“. Falsche Branche | „Wir richten Häuser am Bodensee ein – vom einzelnen Sessel bis zum bezugsfertigen Zuhause. Sie sitzen dafür bei uns im Café, nicht im Lager.“ |
| `work.steps[*].description` | Dreimal derselbe Platzhaltertext („Wir messen Ihre Küche aus …“), Subtitle „Das Layout Ihrer Küche variiert von einem Design zum anderen.“ | Schlüssel scheint nicht verwendet [prüfen per Suche nach `useTranslations("work")`]; dann löschen, sonst neu texten |
| `Slider.minotti` | „Eleganz in architektonischer **Präzession**“ (Tippfehler, gemeint Präzision) | „Ruhe in architektonischer Präzision“ |
| `Slider.treca_paris` | „Schlafen wie Gott in Frankreich“, auf EN „Sleep like a god in France“ (Redewendung funktioniert nicht übersetzt) | DE behalten oder „Pariser Bettkultur seit 1935“ [Gründungsjahr prüfen]; EN „The Parisian art of sleep“ |
| `newsletter.intro2`, `reasons3` | „Rabatte und Aktionen“ – Discount-Ton passt nicht zu Premium | „Einladungen zu Abenden im Showroom, neue Stücke vor allen anderen, Ausstellungsstücke zuerst“ |
| `FeaturesSection` | gut strukturiert, aber Sprache formelhaft („Ihr Weg zum Trauminterieur“) | Gastgeber-Stimme (siehe 3.1) |
| `designermoebel-lindau/page.js`, `CONTENT.banner.alt` | Alt-Text „Terrasse mit **Meerblick**“ auf einer Bodensee-Seite (vermutlich Stockfoto) | Eigenes Foto am See, Alt „… mit Blick auf den Bodensee“ – nur wenn es stimmt |
| `presse.magazines` | 17 Titel ohne Medium, Datum, Link | je Eintrag: Medium, Ausgabe, Zitat, PDF/Link (Rechte prüfen) |
| `Vernissage` | vergangenes Event bleibt sichtbar | Ablaufdatum im Content-Objekt, danach Archiv/„Rückblick“ |

### 1.4 Was fehlt komplett
- **Ratgeber** (Kauffragen, Preise, Schweiz-Import, Materialien) – keine Route.
- **Referenzprojekte** – keine Route (digital/01, F7 plant das Template; dieser Plan liefert Format und Texte).
- **Video** – kein Video im Repo, kein `VideoObject`.
- **Homestories / Kundenporträts, Designer-/Marken-Interviews** – nicht vorhanden.
- **Autorenprofile** (E-E-A-T: wer schreibt, warum ist er kompetent) – nicht vorhanden.
- **Redaktionsprozess** (Freigabe, Faktencheck, Termine) – nicht vorhanden.

---

## 2. Benchmark

### 2.1 Was die Besten weltweit machen

| Vorbild | Was sie tun | Was wir übernehmen |
|---|---|---|
| **Minotti** (minotti.com, geprüft 26.10.2026) | Navigation mit *Projects*, *Video gallery*, *Catalogues*, *News*, *Scenes of Living*, *Advertising Campaign*. Starke Bildwelt, kaum Text | Bildwelt nicht kopieren (Rechte!), aber Gliederung: Projekte + Video + „Szenen“. Unsere Szenen sind echte Räume am See |
| **Poliform** (poliform.it) | *Projects* (z. B. Robuchon Monaco), *MAGAZINE 2026* als PDF-Katalog, Stylebook, YouTube-Kanal | Projekt-Format mit Ort und Typologie; jährliches „Platzhirsch Jahrbuch“ erst später |
| **Connox** (connox.at) | Bereich *Inspiration* mit Rubriken *Stories, How-tos, Styles, Trends, Topics, Geschenke*; Titel wie „Design Deep Dive: Was macht die Tolomeo zum Designklassiker?“, „Weihnachtstrends 2026“, „Layering im Interior Design“ | Rubrikenlogik und „Deep Dive“-Format für Ikonen (Lawrence, Connery, Eileen Gray), aber mit Showroom-Beweis statt Shopping |
| **RH** (rh.com, blockiert Abruf; Fachkenntnis) | „Sourcebooks“, Gallery-Erlebnis mit Restaurant, Hospitality als Marke | Café + Showroom als Bühne: „Platzhirsch Tafel“ als Contentformat |
| **The Conran Shop** (theconranshop.com) | Startseite ohne Journal, dafür *Meet Our Designers*, *Product Reviews*, *Award Winning Designs* | Designer-Porträts als kurze Module auf Marken- und Produktseiten |
| **AmbienteDirect** | Magazin/Ratgeber nicht auffindbar beim Abruf (404) – Online-Händler setzen auf Kataloggröße | Nicht kopieren: im Preis- und Sortimentskampf verlieren wir; wir gewinnen mit Ort, Beratung, Projekten |

**Muster der Besten:** (1) wenige, wiedererkennbare Formate statt „Blog“; (2) echte Räume und Menschen; (3) jedes Stück Content führt zu Produkt und Termin; (4) Video kurz, ohne Ton verständlich, mit Untertiteln.

### 2.2 Was die regionalen Wettbewerber (nicht) haben

| Wettbewerber | Content heute | Lücke für Platzhirsch |
|---|---|---|
| **Höttges** (hoettges.at, geprüft 26.10.2026) | Kein Blog, kein Ratgeber, keine Videos, kein Newsletter, keine Events auf der Website. Projektbilder ohne redaktionelle Beiträge, Moodboards im Prozess erwähnt, Sommer-Sale-Banner. Nur Deutsch | Jede Ratgeber- und Projektseite ist konkurrenzlos. Höttges hat Status, wir haben Geschichten |
| **reiter design** (reiter-design.at war beim Abruf nicht erreichbar, DNS-Fehler; Bewertung nach Bericht 20) | Starke Markenbreite, Instagram 6.005 | Italienische Tiefe, Küche, See, Café als Erzählraum |
| **Dolce Vita Feldkirch** | online fast unsichtbar (23, 4.3) | – (Partner, nicht Gegner) |
| **Hutle, Fretz, Gamma** | Hutle: Tischlerei-Kompetenz; Fretz: wirbt um Schweizer; Gamma: Online-Termin (20) | Schweiz-Ratgeber mit echten Zahlen (Bericht 18) schlägt alle |
| **Aufschnaiter/Wetscher** (Tirol, Benchmark Größe) | Instagram 24.000 bzw. 5.201 (20) | Vorbild für Reels-Frequenz |

**Fazit:** In der Region gibt es **kein einziges Ratgeber-Programm** und keine Video-Serie eines Premium-Einrichters. Wer 6 Monate konsequent veröffentlicht, besetzt das Feld.

---

## 3. Konzept / Zielbild

### 3.1 Markenstimme „Der Gastgeber“

**Kern:** Platzhirsch spricht wie ein Gastgeber, der viel weiß und es nicht vorführt. Italienisches Wohnen, alemannische Bodenhaftung, Blick über drei Grenzen.

| Wir sind | Wir sind nicht |
|---|---|
| **gastfreundlich**: „Kommen Sie auf einen Kaffee vorbei, wir legen die Stoffe schon bereit.“ | servil, Ausrufezeichen, „Lassen Sie sich begeistern!“ |
| **kundig und konkret**: Maße, Materialien, Lieferzeit, ehrliche Preisrahmen | vage („höchste Qualität“, „zeitlos elegant“, „einzigartig“) |
| **regional**: Pfänder, Lindau, Rheintal, Föhn, Seeluft, Bregenzerwälder Handwerk | austauschbar „in Ihrer Nähe“ |
| **italienisch im Geschmack**: Materialkultur, Familienunternehmen, Mailand im April | italienische Floskeln, „Dolce Vita“ (ist auch ein Wettbewerbername) |
| **ruhig**: kurze Sätze, viel Weißraum, ein Gedanke pro Absatz | Werbesprech, Superlative, „Traum…“ |
| **ehrlich**: „Diese Marke zeigen wir in Lochau“ | „Offizieller/autorisierter Händler“ (außer ClassiCon) |

**Drei Sätze, die alles tragen (Claims zum Testen):**
1. „Italienisch wohnen. Am Bodensee zuhause.“
2. „Bei uns sitzen Sie im Café, nicht im Lager.“ (aus 23, 4.1)
3. „Ein Ansprechpartner. Drei Länder. Ein Zuhause.“

**Wortliste (Redaktions-Glossar, verbindlich):**
- *Showroom in Lochau* (nicht „Store“, nicht „Filiale“) · *Ausstellungsstück* (nicht „B-Ware“, nicht „Abverkauf“) · *Ihre Auswahl* (statt Warenkorb/Merkliste in Texten) · *Termin* · *bezugsfertig*.
- Markenbezug **erlaubt**: „Minotti-Ausstellung in Lochau“, „Minotti im Showroom erleben“, „wir beraten zu Minotti“. **Verboten**: „Minotti-Händler“, „Vertragshändler“, „autorisiert“, „offizieller Partner“ (Ausnahme ClassiCon, belegt). [Rechtlich vor Veröffentlichung von Anwalt prüfen lassen.]
- Schweiz-Texte: *Offerte*, *Stockwerkeigentum*, *Schreiner*, *MWST*, kein „ß“ in de-CH-Fassungen.
- Anrede **Sie**, auf Instagram und im Newsletter-Betreff darf es wärmer sein, bleibt aber „Sie“.

**Vorher/Nachher (Beispiel `About.ourMissionDesc`):**
- *Vorher:* „…kreative und durchdachte Lösungen zu entwickeln, die Markenidentitäten stärken…“
- *Nachher:* „Wir richten Häuser und Wohnungen am Bodensee ein. Sofa, Küche, Terrasse – geplant als ein Projekt, geliefert und montiert von unserem Team. Und bevor wir über Stoffe sprechen, gibt es einen Espresso.“

### 3.2 Die fünf Erzählsäulen

| Säule | Inhalt | Beweis (woher kommt das Material?) | Ziel |
|---|---|---|---|
| **1. Der Ort** | Showroom + Café, Lochau zwischen Pfänder und See, fünf Minuten vor Lindau | eigene Fotos, Video, Events | Besuche, Maps-Ranking |
| **2. Das Wissen** | Ratgeber: Preise, Materialien, Planung, Schweiz-Import | Fachwissen des Teams, Bericht 18 | Ranking Long Tail, KI-Suche |
| **3. Die Projekte** | Referenzen: Villa am See, Penthouse Lindau, Chalet Lech, Hotel-Lounge | eigene Fotos, Kundenfreigabe | Hotel-/Bauträger-Leads, Backlinks |
| **4. Die Menschen** | Team, Montage-Crew, Kundinnen, Architekten, Künstler (Vernissagen) | Interviews, Porträts | Vertrauen (E-E-A-T), Social |
| **5. Die Herkunft** | Italienische Manufakturen, Salone del Mobile, Materialkunde | Reiseberichte, eigene Fotos in Mailand/Meda/Brianza | Markenbegehren, Saison-Anlässe |

### 3.3 Inhaltsarchitektur (Zielbild)

```
/[locale]/ratgeber                    Hub (Rubriken: Kaufen & Preise · Planung · Material & Pflege · Schweiz & Liechtenstein · Outdoor am See · Küche)
/[locale]/ratgeber/[slug]             Artikel (MDX im Repo)
/[locale]/projekte                    Übersicht mit Typologie-Filter (Template aus digital/01, F7)
/[locale]/projekte/[slug]             Projekt
/[locale]/journal                     „Aus dem Haus“: Homestories, Events, Salone, Menschen (ersetzt langfristig /news)
/[locale]/journal/[slug]
/[locale]/news …                      bleibt bestehen (Backoffice), 301 einzelner Altbeiträge nach Bereinigung
/[locale]/ueber-uns/team/[person]     Autorenprofile (E-E-A-T)
```
Bewusste Entscheidung: **Ratgeber, Projekte und Journal entstehen als MDX-Dateien im Repo** – damit sofort baubar, ohne Backoffice-Zugang, versioniert, mit Code-Review als Freigabeprozess. Wenn später Schreibzugang zum Backoffice besteht, kann das Journal in einen Frappe-Doctype wandern; Ratgeber bleiben im Repo (selten geändert, hoher Qualitätsanspruch).

---

## 4. Konkrete Features

Legende Aufwand: **S** ≤ 3 Personentage, **M** 1–3 Wochen, **L** > 3 Wochen (Code + Redaktion getrennt angegeben).

### C1 – Markenstimme & Textreparatur (Brand Book + `messages/*.json`)
- **Nutzen:** Erster Eindruck und Conversion: heute steht auf „Über uns“ ein Agenturtext. Konsistente Stimme erhöht Vertrauen und Verweildauer; korrigierte Alt-Texte helfen der Bildersuche. Grundlage für alle KI-Prompts (C10).
- **Aufwand:** S (Code), S–M (Text, 4 Sprachen).
- **Abhängigkeiten:** Freigabe Inhaberin; IT/FR durch Muttersprachler gegenlesen.
- **Dateien:** `src/messages/{de,en,fr,it}.json` (About, Slider, newsletter, FeaturesSection, ggf. `work` löschen); `src/app/[locale]/designermoebel-lindau/page.js` (Alt-Text). Neu: `docs/content/brand-voice.md` (Stimme, Glossar, Verbotsliste), `docs/content/glossary.json` (maschinenlesbar für Lint, C10).
- **Bibliotheken:** keine.

### C2 – Ratgeber-Programm (30 Themen, MDX)
- **Nutzen:** Größter Ranking-Hebel ohne Backoffice (25, H5): Kauffragen beantwortet in der Region niemand. Jeder Artikel verlinkt auf Produkte, Marke, Stadtseite und Termin. Zitierfähig für KI-Suche (llms.txt, klare Fakten).
- **Aufwand:** M (Code: Route, Template, Hub, JSON-LD, Sitemap), Redaktion 1–2 Artikel/Woche à 4–8 h inkl. Fotos und Freigabe.
- **Abhängigkeiten:** Preisangaben nur als **Preisrahmen** mit Datum und Quelle („Stand 11/2026, Richtwert aus unseren Angeboten“) – keine UVP-Listen ohne Klärung mit Herstellern (25, H2). Schweiz-Inhalte vom Steuerberater gegenlesen (Bericht 18). Eigene Fotos.
- **Neue Dateien:**
  - `src/app/[locale]/ratgeber/page.js`, `src/app/[locale]/ratgeber/[slug]/page.js` (`generateStaticParams`, `dynamicParams = false` laut `mdx.md`, „Using dynamic imports“)
  - `src/content/ratgeber/de/*.mdx` (+ `en/`, später andere)
  - `src/content/schema.js` (Frontmatter-Validierung: Titel, Beschreibung, Autor, `reviewedBy`, `updatedAt`, `sources[]`, `relatedProducts[]`, `relatedBrands[]`, `regions[]`)
  - `src/mdx-components.js` (Pflicht im App Router laut `mdx.md`): Komponenten `<Fakt>`, `<Preisrahmen>`, `<ProduktKarte slug>`, `<TerminCTA>`, `<Hinweis>`, `<FAQ>`
  - `src/components/Ratgeber/*`
  - Ergänzung `src/app/sitemap-static.xml/route.js` bzw. neue `sitemap-ratgeber.xml`, `src/app/llms.txt/route.js` (Ratgeber-Liste)
  - `next.config.js` → MDX-Plugin. **Achtung:** `remark`/`rehype`-Plugins sind ESM-only und brauchen `next.config.mjs` oder unter Turbopack Plugin-Namen als String mit serialisierbaren Optionen (`mdx.md`, „Using Plugins with Turbopack“). Die heutige `next.config.js` ist CommonJS mit `next-intl/plugin` – Umstellung auf `.mjs` einplanen und testen.
- **JSON-LD:** `Article` (author mit `Person` und Link auf Autorenprofil, `dateModified`), `BreadcrumbList`. `FAQPage` nur dort, wo echte Fragen stehen (Rich Results zeigt Google seit 2023 nur noch für wenige Seitentypen, für KI-Suche bleibt es nützlich [eigene Kenntnis, prüfen]). Kein `HowTo` (Rich Result eingestellt).
- **Bibliotheken:**

| Paket | Version | Lizenz | Client-Bundle | Zweck |
|---|---|---|---|---|
| `@next/mdx` | passend zu `next` 16.2.x | MIT | 0 kB (Build-Zeit, Server Components) | MDX-Kompilierung |
| `@mdx-js/loader`, `@mdx-js/react` | 3.1.x | MIT | `@mdx-js/react` ~1 kB, nur wenn Provider nötig | laut Next-Guide Pflicht-Abhängigkeiten |
| `remark-gfm` | 4.0.x | MIT | 0 kB (Build) | Tabellen in Ratgebern (Preis-, Materialvergleich) |
| `remark-frontmatter` + `remark-mdx-frontmatter` | 5.0.x / 5.x | MIT | 0 kB | Frontmatter (von `@next/mdx` nicht unterstützt, `mdx.md` Abschn. Frontmatter). Alternativ `export const meta = {…}` in der MDX-Datei – **ohne Plugin, empfohlen für den Start** |
| `zod` | 4.x | MIT | 0 kB (nur Build/Server) | Validierung der Metadaten, Build bricht bei fehlendem `reviewedBy` ab |
| Alternative: `velite` | 0.2.x | MIT | 0 kB | Content-Collections mit Schema + Bildverarbeitung, falls das Team viel Content anlegt; zusätzliche Abhängigkeit, daher 2. Wahl |

### C3 – Referenzprojekte-Format (Inhalt zu digital/01, F7)
- **Nutzen:** Stärkstes Argument für Hotels, Bauträger, Ferienimmobilien (23, Abschn. 8, 10.5); Seiten, die Architekten und Partner verlinken (25, H7); **Bilder, die uns gehören** (löst einen Teil des Bildrechte-Problems).
- **Aufwand:** M (Template ist in digital/01 geplant); Redaktion je Projekt 1–2 Tage inkl. Fotoshooting-Tag.
- **Abhängigkeiten:** schriftliche Einwilligung Bauherr (Fotos, Ort, Zitat; Vorlage vom Anwalt), Architekt nennen und verlinken (Freigabe), Fotograf mit **vollem Nutzungsrecht** (Web, Social, Print, Presse, unbefristet).
- **Format „Projekt“ (fester Aufbau, max. 600 Wörter):**
  1. Titel nach Muster *Ort + Typologie + Haltung*: „Penthouse in Lindau – Wohnen mit dem See als Bild“
  2. Faktenzeile: Ort (ggf. „Westallgäu“ statt Adresse), Typologie, Fläche, Leistungen (Küche · Wohnen · Outdoor · Licht), Zeitraum, Architekt
  3. **Die Ausgangslage** (2–3 Sätze, Stimme des Bauherrn)
  4. **Unsere Lösung** (3 Absätze, je ein Raum, je eine Entscheidung mit Begründung: „Wir haben das Sofa um 20 cm schmaler bestellt, damit die Schiebetür ganz aufgeht“)
  5. **Im Projekt** – verlinkte Produkte (Produktseiten, Long-Tail)
  6. Zitat Bauherr oder Architekt
  7. „Von der ersten Skizze bis zur Montage: 14 Wochen“ + Termin-CTA
- **Dateien:** `src/content/projekte/de/*.mdx`, Bilder lokal optimiert in `public/projekte/…` (Bildpipeline C9). JSON-LD: `CreativeWork`/`Article` mit `about`, `locationCreated`, `contributor` (Architekt).
- **Bibliotheken:** wie C2; Galerie aus digital/01 (`embla-carousel-react` 8.6.x, MIT, ~7 kB gz).
- **Ziel:** 6 Projekte bis April 2027 (1/Monat), davon mindestens 1 Hotel/Gastro (z. B. Bergrestaurant am Pfänder, sofern Partner zustimmt [prüfen]).

### C4 – Journal „Aus dem Haus“ + Homestories
- **Nutzen:** Frische Signale, Social-Material, Newsletter-Futter; Homestories sind die emotionale Variante der Referenz (Menschen statt Projektdaten).
- **Aufwand:** S (Code: nutzt C2-Template), Redaktion 2 Beiträge/Monat.
- **Formate:**
  - **Homestory „Zu Gast bei …“** (6–8 Bilder, 500–800 Wörter, Interview mit 5 festen Fragen: Lieblingsplatz, das Stück mit Geschichte, was Sie anders machen würden, Morgenritual, Blick aus dem Fenster). Auch anonym („Ein Haus über dem Rheintal“).
  - **„Am Tisch“**: Rückblick Platzhirsch Tafel / Kochabend mit Rezept des Abends (Rezept + Küche + Tischkultur = Küchen-Offensive).
  - **„Aus Mailand“**: Salone del Mobile (April), Werksbesuche – eigene Fotos, eigene Einschätzung, nicht Pressetext.
  - **„Menschen“**: Montage-Crew, Polsterer, Künstler der Vernissage, Architekt der Region.
  - **Vernissagen** (heute im News-Bereich) wandern hierher, mit Ablaufdatum für Teaser.
- **Dateien:** `src/app/[locale]/journal/{page,[slug]/page}.js`, `src/content/journal/de/*.mdx`. Bestehenden Vernissage-Block (`src/components/Home/…`, Schlüssel `Vernissage`) über `endsAt` steuern.
- **Abhängigkeiten:** Einwilligungen; kein Backoffice.

### C5 – Video- & Reels-Programm
- **Nutzen:** Instagram-Ziel 3.000 Follower bis M12 (23, Abschn. 9); Videos auf Produkt-, Projekt- und Showroom-Seiten erhöhen Verweildauer und Terminquote; `VideoObject` für Google-Videosuche.
- **Aufwand:** S (Code: Video-Komponente), M laufend (Produktion 2–3 h/Woche).
- **Vier Serien (wiederkehrend, gleicher Look):**

| Serie | Inhalt | Länge | Takt | Ort auf Website |
|---|---|---|---|---|
| **„Ein Stück, eine Minute“** | Ein Möbel im Showroom: Hand über den Stoff, Sitzprobe, ein Detail, ein Satz Beratung („Lawrence gibt es auch 10 cm tiefer“) | 30–60 s, hochkant | wöchentlich | Produktseite |
| **„Im Café“** | Morgenlicht, Espresso, Gäste, Stoffmuster am Tisch – Atmosphäre ohne Verkauf | 15–30 s | 2×/Monat | Showroom-/Café-Seite |
| **„Platzhirsch Tafel“** | Kochabend in der Live-Küche: Mise en place, Gäste, Küche im Einsatz (Bora, Poliform Cucine) | 60–90 s + 3-min-Version | monatlich ab Küche fertig | Küchen-Seite, Journal |
| **„Unterwegs“** | Lieferung & Montage: Kran am See, Montage-Crew, Abdecken, Übergabe – Zeitraffer + 3 O-Töne | 45–60 s | 1–2×/Monat | Benefits, Schweiz-Seite (Verzollung zeigen!) |

- **Regeln:** Ohne Ton verständlich (eingebrannte Untertitel in Reels, `<track>`-Untertitel auf der Website laut `videos.md`); erste Sekunde zeigt Material oder Licht, nie ein Logo; keine Marken-Werbefilme ohne Lizenz einbinden; Musik nur lizenzfrei bzw. aus Instagram-Bibliothek (gilt nicht für die Website).
- **Website-Technik:** Eigene MP4/WebM (H.264 + AV1) mit `preload="none"` und Poster-Bild (`videos.md`), oder YouTube nur über Klick-Fassade nach Consent (Consent Mode v2 existiert in `src/components/Cookies`).
- **Dateien neu:** `src/components/Video/InlineVideo.js` (Server-Komponente, Poster, Untertitel), `src/components/Video/YouTubeFacade.js` (optional). JSON-LD `VideoObject` (Name, Thumbnail, Upload-Datum, Dauer, `contentUrl`).
- **Bibliotheken:**

| Paket/Tool | Version | Lizenz | Größe | Zweck |
|---|---|---|---|---|
| natives `<video>` | – | – | 0 kB | Standard, empfohlen |
| `lite-youtube-embed` | 0.3.x | Apache-2.0 | ~3 kB gz | YouTube-Fassade, erst nach Klick + Consent |
| Hosting: Bunny Stream oder Cloudflare Stream | SaaS | proprietär | – | HLS-Streaming bei vielen/größeren Videos [Kosten prüfen; Bunny mit EU-Rechenzentren] |
| `ffmpeg` mit NVENC (lokale NVIDIA-GPU) | 7.x | LGPL/GPL (Build-abhängig) | lokal | Transkodierung H.264/AV1, Poster-Frames |
| `faster-whisper` (lokale GPU) | 1.x | MIT | lokal | Untertitel DE automatisch, dann manuell korrigieren; Übersetzung EN/IT/FR als Rohfassung |
| DaVinci Resolve (Gratisversion) / CapCut | – | proprietär | lokal | Schnitt; Vorlagen für alle Serien |

### C6 – Fotostil & Bildrechte-Programm
- **Nutzen:** Eigene Bilder sind Voraussetzung für Projekte, Ratgeber, Google-Profil (25, H3: 50+ Fotos) und Pinterest; senken das Rechte-Risiko bei Herstellerbildern.
- **Aufwand:** S (Leitfaden), M (erste Shootings).
- **Fotostil „Seelicht“:**
  - **Licht:** natürliches Tageslicht, Morgen oder später Nachmittag; keine Blitzoptik; Föhn-Tage für Fernsicht nutzen.
  - **Farbe:** warm-neutral, leicht entsättigt, Schwarzpunkt weich; keine HDR-Optik. Ein gemeinsames LUT/Lightroom-Preset für alle.
  - **Komposition:** viel Luft, Möbel nie angeschnitten bei Hero-Bildern; Bildpaare (Totale + Detail); Hände und Menschen erlaubt, aber unscharf/von hinten, wenn keine Model-Freigabe.
  - **Requisiten:** wenig, echt, regional (Bergkäse, Wälder Keramik, Bücher, Blumen der Saison) – keine Plastikdeko.
  - **Pflichtmotive je Shooting:** 1 Totale, 3 Details (Naht, Material, Mechanik), 1 Mensch im Raum, 1 Hochformat 9:16, 1 Querformat 16:9, 1 Quadrat.
  - **Dateinamen & Alt-Text:** `ort-raum-marke-modell-nr.jpg`; Alt beschreibt, was zu sehen ist, ohne Keyword-Stapel.
- **Bildrechte:** Tabelle `docs/content/bildrechte.csv` (Bild, Quelle, Lizenz, Ablauf, Freigabe). Herstellerbilder nur mit schriftlicher Freigabe des Herstellers/Agenten; bis dahin auf Marken- und Produktseiten bevorzugt eigene Showroom-Fotos (Produkt-Import enthält heute Hosts wie `www.treca-paris.com`, `www.next125.com`, `images.unsplash.com` laut `next.config.js` [belegt] – Unsplash-Bilder als „Projekt“ wären irreführend, nur als Stimmungsbild).
- **Lokale GPU (nur eigene Fotos):** `sharp` (Apache-2.0, in Next enthalten) für AVIF/WebP-Batch; Real-ESRGAN (BSD-3-Clause) nur für leichte Hochskalierung eigener Bilder; **keine KI-generierten Räume als echte Projekte** (Täuschung, UWG).

### C7 – Newsletter-Programm „Post aus Lochau“
- **Nutzen:** Eigener Kanal ohne Algorithmus; Bestandskunden sind die wichtigste Quelle für Nachfassen, Atelierverkauf und Events (23, Abschn. 5, Nr. 1, 2, 6). Messbar über `sign_up` (bereits in `analytics.js`) und UTM.
- **Aufwand:** S (Vorlage), laufend 4 h/Monat.
- **Abhängigkeiten:** **Double-Opt-in** und Abmeldelink (DSGVO, § 174 TKG 2021 in AT, § 7 UWG in DE) – im Frappe-Doctype `newsletter_website` nicht sichtbar [prüfen, braucht Backoffice]. Versandtool: Frappe hat ein Newsletter-/E-Mail-Kampagnen-Modul [prüfen]; sonst Brevo (EU, proprietär). Sprachfeld bei der Anmeldung ergänzen (heute nur E-Mail) – Code-seitig in `newsletter.js` + `route.js` vorbereitbar, Feld im Backoffice nötig.
- **Rhythmus:** monatlich, erster Donnerstag, 18 Uhr (Abendlektüre); zusätzlich max. 4 Einladungs-Mails pro Jahr.
- **Feste Gliederung (max. 5 Blöcke, kurzer Text, ein großes Bild):**
  1. **Brief der Gastgeberin** (Susanne Messmer, 80 Wörter, persönlich, Saison/Ort)
  2. **Ein Raum** (neues Projekt oder Homestory)
  3. **Ein Stück** (Ausstellungsstück oder Neuheit mit Ratgeber-Link)
  4. **Am Tisch** (Termin: Tafel, Vernissage, langer Donnerstag)
  5. **Gut zu wissen** (ein Ratgeber, z. B. Pflege vor dem Winter)
- **Segmente (sobald Felder da sind):** Privat AT / DE / CH-FL, Architekten & Planer, Hotels & Bauträger. Architekten-Variante quartalsweise mit Materialneuheiten und Muster-Service.
- **Bibliotheken (falls Mails im Repo gebaut werden):** `@react-email/components` 0.x (MIT, nur Server/Build) für HTML-Vorlagen; sonst Editor des Versandtools.

### C8 – Mehrsprachige Content-Strategie
- **Nutzen:** Ressourcen dorthin, wo Käufer sind. Vier Sprachen gleich zu pflegen kann ein 5er-Team nicht.
- **Aufwand:** S (Entscheidung + hreflang-Regeln), M (de-CH-Varianten).

| Markt/Sprache | Lohnt sich? | Was genau | Begründung |
|---|---|---|---|
| **de-AT** (Basis, `de`) | **ja, 100 %** | alles | Heimatmarkt, Vorarlberg/Tirol |
| **de-DE** | **ja, ohne eigene Sprachversion** | Stadtseiten Lindau/Friedrichshafen/Ravensburg/Kempten (`inLanguage: "de-DE"` ist schon gesetzt [belegt]), Ratgeber „Kaufen in Österreich, Lieferung nach Deutschland“ | Sprache identisch; separate de-DE-Kopien wären Duplikate. Unterschiede (Rechnung, MwSt.) in eigenen Artikeln |
| **de-CH** | **ja, gezielt 8–12 Seiten** | Schweiz-Seite + CHF-Rechner, 4–5 Schweiz-Ratgeber, St. Gallen/Rheintal/Vaduz-Seiten, mit „ss“, CHF, Offerte, MWST 8,1 % | Größter Wert pro Kunde (23, 4.2 Nr. 5). hreflang `de-CH` nur für Seiten mit echter Variante, sonst `de` |
| **en** | **ja, schlank** | Startseite, Showroom/Café, Projekte (Hotel, Second Home), 5 Ratgeber (Buying in Austria, Swiss import, Second-home service Arlberg) | Internationale Zweitwohnungskäufer (Lech, Montafon), Expats in FL/CH, Hotelbetreiber. Produktseiten bleiben übersetzt wie heute |
| **it** | **teilweise** | Marken- und Produktseiten (vorhanden), „Aus Mailand“-Beiträge, keine Ratgeber | Wenig Käufer in der Region; aber italienische Marken und Agenten lesen mit – Seriosität gegenüber Minotti/Poliform beim Händlergespräch |
| **fr** | **nein für neuen Content** | nur bestehende Seiten pflegen; Ratgeber/Journal nicht übersetzen, für neue Content-Typen keine fr-Route anlegen | Romandie außerhalb Einzugsgebiet. Auf Ratgeber-Seiten hreflang nur für vorhandene Sprachen |

- **Regeln:** Übersetzungen nie 1:1 maschinell veröffentlichen (heute Problem in News, siehe 1.2); **Transkreation** mit Glossar (C10), Muttersprachler-Review für en/it. Sprachumschalter: Masterkonzept meldet „angezeigt wird nur Deutsch“ (23, Abschn. 9, Website Nr. 5) – mit UX-Agent (digital/01) klären.
- **Dateien:** `src/content/*/{de,de-ch,en,it}/`, Ergänzung `src/lib/seo/pageMetadata.js` (`hreflangLanguages` pro Seite aus vorhandenen Sprachdateien statt fester Liste). de-CH als **Inhaltsvariante innerhalb `de`** (Pfad `/de/schweiz/...`) statt neuer next-intl-Locale – kein Routing-Umbau nötig [Architekturentscheid, mit Next-Guide `internationalization.md` und next-intl-Routing abgleichen].

### C9 – Content-Infrastruktur: Autoren, Aktualität, Verlinkung, Messung
- **Nutzen:** E-E-A-T (Erfahrung, Expertise) und interne Verlinkung entscheiden, ob Ratgeber ranken; Messung zeigt, welche Inhalte Anfragen bringen.
- **Aufwand:** M.
- **Bestandteile:**
  - **Autorenprofile** `src/app/[locale]/ueber-uns/team/[person]/page.js` (bzw. Erweiterung der Team-Seite): Foto, Rolle, Jahre Erfahrung, Schwerpunkte, Markenschulungen (nur belegte). JSON-LD `Person`.
  - **„Geprüft von … am …“** sichtbar unter jedem Ratgeber; `updatedAt` in Sitemap (`lastmod`, Muster aus Commit 78c9ea5).
  - **Auto-Verlinkung:** `<ProduktKarte slug>` zieht Produkte zur Build-Zeit aus `fetchAllProdukte.js` (bestehende API, lesend); Marken-Erwähnungen verlinken auf `/ueber-uns/marken/[title]`; jede Produkt- und Markenseite bekommt Block „Passende Ratgeber“ (Rückverlinkung aus Frontmatter `relatedBrands`).
  - **Content-Events** in `src/lib/analytics.js`: `content_view` (Typ, Rubrik), `content_cta_click` (Ziel: Termin/Produkt), `video_play`. Lead-Formulare erhalten `content_source` (letzter gelesener Ratgeber) – damit Anfrage → Artikel zuordenbar.
  - **News-Bereinigung (Backoffice nötig):** richtige `daten` setzen, 2022/2023-Beiträge als „Archiv“ kennzeichnen oder 301 auf aktuelle Markenseite, Tippfehler korrigieren. Ohne Zugang: Liste mit Soll-Daten und Texten an das Backoffice-Team liefern.
- **Bibliotheken:** keine neuen (Bildpipeline mit `sharp` als Node-Skript `scripts/optimize-images.mjs`).

### C10 – KI-gestützte Produktion mit Qualitätskontrolle („Redaktion mit Netz“)
- **Nutzen:** 30 Ratgeber + 6 Projekte + Newsletter in 6 Monaten sind für 5 Personen nur mit KI-Unterstützung machbar – aber Google wertet massenhaft erzeugte, nutzlose Seiten als „Scaled Content Abuse“ ab, und falsche Fakten (Preise, Status, Zoll) sind rechtlich gefährlich.
- **Aufwand:** M (Aufbau), danach spart es ca. 50 % Schreibzeit [Schätzung].
- **Prozess (7 Schritte, jeder Artikel):**
  1. **Briefing (Mensch, 15 min):** Suchintention, Leserfrage, 3 Fakten aus eigener Erfahrung („Was sagen Sie Kunden am Tisch?“), Fotos.
  2. **Interview statt Prompt:** 10-min-Sprachmemo des Beraters → `faster-whisper` lokal transkribiert. *Das ist die Quelle der Einzigartigkeit.*
  3. **Entwurf (KI):** LLM bekommt Brand-Voice-Dokument, Glossar, Transkript, Faktenblatt `src/content/facts.json` (Adresse, Öffnungszeiten, Marken im Showroom, Händlerstatus, MWST-Sätze, Lieferzonen) – **und die Anweisung, nur diese Fakten zu verwenden und Lücken als `[[PRÜFEN: …]]` zu markieren**. Empfohlen: Claude (aktuelles Modell, API) oder ein lokales Modell auf der NVIDIA-GPU für Rohübersetzungen (Llama/Qwen über Ollama, Lizenzen je Modell prüfen) – lokal bleiben Kundendaten im Haus.
  4. **Automatische Prüfung (CI, `npm run lint:content`):**
     - **Vale** 3.x (MIT, CLI) mit eigener Stil-Regel `Platzhirsch`: Verbotsliste (*autorisiert, offizieller Händler, Vertragshändler* außer bei ClassiCon, *einzigartig, zeitlos elegant, Traum…, in der heutigen schnelllebigen Zeit, eintauchen, Welt von*), Satzlänge > 25 Wörter, Passiv-Häufung, Ausrufezeichen.
     - **LanguageTool** (LGPL-2.1, selbst gehostet per Docker) für Rechtschreibung DE/DE-CH/EN/IT.
     - **Fakten-Check-Skript** `scripts/check-facts.mjs`: findet Zahlen, Preise, Prozent, Datumsangaben und Markennamen im Text und verlangt dafür einen Eintrag in `sources[]` des Frontmatters; blockiert offene `[[PRÜFEN]]`.
     - **Schema-Check** (`zod`): `author`, `reviewedBy`, `updatedAt`, `sources` Pflicht.
  5. **Fachliche Freigabe (Mensch):** Berater prüft Inhalt, bei Schweiz/Zoll/Recht Steuerberater bzw. Anwalt; Name landet in `reviewedBy`.
  6. **Redaktion (Mensch):** ein eigener Gedanke, ein eigenes Foto, ein konkretes Beispiel aus Lochau pro Artikel – ohne diese drei keine Veröffentlichung („3-E-Regel“: Erlebnis, Ein Foto, Echtes Beispiel).
  7. **Veröffentlichen per Pull Request** (Vier-Augen-Prinzip, Vercel-/Preview-Link), danach Monitoring in Search Console nach 30/90 Tagen.
- **Kennzeichnung:** KI ist Werkzeug, Verantwortung trägt der Autor – keine Kennzeichnungspflicht für redigierte Texte nach heutigem Stand, aber **keine KI-Bilder als echte Räume** und Kennzeichnung bei KI-Visualisierungen (AI Act Art. 50, Transparenzpflichten ab 02.08.2026 [prüfen mit Anwalt]).
- **Neue Dateien:** `docs/content/brand-voice.md`, `docs/content/prompt-ratgeber.md`, `docs/content/prompt-projekt.md`, `.vale.ini`, `styles/Platzhirsch/*.yml`, `src/content/facts.json`, `scripts/check-facts.mjs`, `package.json`-Script `lint:content`.
- **Bibliotheken/Tools:**

| Tool | Version | Lizenz | Ort | Zweck |
|---|---|---|---|---|
| Vale | 3.x | MIT | CLI/CI | Stil-Lint mit eigenen Regeln |
| LanguageTool Server | 6.x | LGPL-2.1 | Docker lokal | Rechtschreibung/Grammatik 4 Sprachen |
| `faster-whisper` | 1.x | MIT | lokale GPU | Interviews und Video-Untertitel |
| Ollama + offenes Modell | aktuell | MIT (Ollama), Modell-Lizenz je Modell | lokale GPU | Rohübersetzung, Zusammenfassungen ohne Datenabfluss |
| Claude API (`@anthropic-ai/sdk`, nur Skript, nicht im Website-Bundle) | aktuell | MIT (SDK), Nutzung kostenpflichtig | Skript | Entwürfe, Transkreation mit Glossar |
| DeepL API (Alternative für Übersetzung) | – | proprietär | SaaS | Glossar-Funktion für Markennamen |

---

## 4a. Das Ratgeber-Programm: 30 Themen

Suchintention: **K** = kommerziell/Kaufvorbereitung, **T** = transaktional nah (Termin), **I** = informativ, **L** = lokal. Priorität **A** (Nov–Jan), **B** (Feb–Mär), **C** (Apr+). Volumen ist nicht gemessen – vor Start mit Search Console, Google Ads Keyword Planner oder Sistrix/Ahrefs prüfen [prüfen].

| # | Arbeitstitel | Rubrik | Intention | Prio | Ziel-Verlinkung | Abhängigkeit |
|---|---|---|---|---|---|---|
| 1 | Was kostet ein Minotti-Sofa? Preisrahmen, Faktoren, Lieferzeit | Kaufen & Preise | K | **A** | Minotti-Produkte (487), Termin | Preisrahmen aus eigenen Angeboten, Datum |
| 2 | Möbel in Österreich kaufen, in die Schweiz liefern: MWST, Zoll, Ablauf | Schweiz & FL | K/T | **A** | Schweiz-Seite, CHF-Rechner | Steuerberater-Review (Bericht 18) |
| 3 | Einrichten in Liechtenstein: Lieferung, Montage, Steuern | Schweiz & FL | K/L | **A** | Vaduz-Seite | Bericht 18 |
| 4 | Was kostet eine Poliform-Küche? Von der Planung bis zur Montage | Küche | K | **A** | Poliform Cucine, Küchen-Seite | Preisrahmen |
| 5 | Lieferzeiten italienischer Designmöbel – warum 8–16 Wochen und wie man plant | Kaufen & Preise | I/K | **A** | Produktseiten | Angaben je Marke vom Team |
| 6 | Ausstellungsstücke kaufen: Was ist ein Showroom-Stück, worauf achten? | Kaufen & Preise | T | **A** | Atelierverkauf-Seite | Atelierverkauf startet (23, Abschn. 5) |
| 7 | Geschenkgutschein für Design: wie lange gültig in Österreich? | Kaufen & Preise | T | **A** | Gutschein-Shop | Gutschein-Produkt |
| 8 | Firmengeschenke mit Stil – Ideen aus dem Showroom (für Unternehmen in Vorarlberg, FL, Ostschweiz) | Kaufen & Preise | T | **A** | Firmengeschenk-Landingpage | Sortiment (Bericht 10) |
| 9 | Minotti oder B&B Italia? Ein ehrlicher Vergleich aus dem Showroom | Kaufen & Preise | K | **A** | Minotti-Produkte | nur faire, belegbare Aussagen |
| 10 | Designermöbel aus Österreich nach Deutschland: Rechnung, MwSt., Lieferung | Kaufen & Preise | K/L | **A** | Lindau-, Friedrichshafen-Seite | Steuerberater |
| 11 | Sofa-Bezug wählen: Leder, Bouclé, Leinen – was hält am Bodensee mit Kindern und Hund? | Material & Pflege | I/K | B | Sofa-Kategorie | eigene Materialtests |
| 12 | Outdoor-Möbel am See: Welches Material verträgt Feuchtigkeit, Föhn und Sonne? | Outdoor am See | K | B | Tuuci, Paola Lenti, Minotti Outdoor | – |
| 13 | Sonnenschirm für Terrasse und Seeufer: Windlast, Größe, Fundament (Tuuci, Umbrosa) | Outdoor am See | K | B | Tuuci, Umbrosa | Herstellerdaten zitieren |
| 14 | Outdoor-Möbel richtig einwintern – und unser Einlagerungsservice | Outdoor am See | I/T | **A** (Okt/Nov) | Service-Seite | Service definiert (23, Abschn. 5, Nr. 7) |
| 15 | Wohnzimmer planen: Abstände, Sofagröße, Couchtischhöhe – die Maße, die wir täglich nennen | Planung | I | B | Wohnzimmer-Landingpage | – |
| 16 | Begehbarer Kleiderschrank planen: Maße, Licht, Systeme (Poliform, Rimadesio) | Planung | K | B | Poliform Night, Rimadesio | – |
| 17 | Rimadesio: Glas und Aluminium im Wohnraum – wo es passt, wo nicht | Material & Pflege | K | B | Rimadesio-Seite | – |
| 18 | Licht planen im Wohnraum: drei Ebenen, ein Beispiel aus Lochau (Flos) | Planung | I/K | B | Flos | eigenes Projektfoto |
| 19 | Die Wohnküche mit Kochinsel: Planung, Abzug, Abstände | Küche | K | B | Küchen-Seite, Bora | – |
| 20 | Küche in der Schweiz aus Österreich: Normen, Geräte, Montage | Schweiz & FL | K | B | Schweiz-Seite | Bericht 17 (Normen) |
| 21 | Ferienwohnung am Arlberg bezugsfertig einrichten: Ablauf, Budget, Zeitplan | Planung | K/T | B | Second-Home-Service | Service-Angebot (23, 10.5) |
| 22 | Einrichten mit dem Architekten: wie die Zusammenarbeit mit uns abläuft | Planung | I/T | B | Architekten-Seite | Architekten-Programm |
| 23 | Hotel-Lounge einrichten: Objektqualität, Brandschutz, Outdoor | Planung | K | C | Hotel-Seite | Objekt-Konditionen |
| 24 | Ein Designklassiker erklärt: Eileen Gray Adjustable Table (ClassiCon) | Material & Pflege | I | B | ClassiCon (offiziell gelistet) | Bildfreigabe ClassiCon |
| 25 | Leder pflegen: was wir Kunden nach der Lieferung mitgeben | Material & Pflege | I | C | Produktseiten | – |
| 26 | Bett und Matratze: Treca Paris erklärt (Federkern, Härtegrade, Probeliegen) | Material & Pflege | K | C | Treca | Herstellerdaten |
| 27 | Teppich unter dem Sofa: Größe, Material, Pflege | Planung | I | C | Teppich-Kategorie | – |
| 28 | Salone del Mobile 2027: was wir in Mailand gesehen haben | (Journal-Crossover) | I | C (April) | Neuheiten | Reise |
| 29 | Nachhaltig einrichten: Langlebigkeit, Aufarbeitung, Circle-Inzahlungnahme | Material & Pflege | I/K | C | Circle-Seite | Circle-Pilot (23, 10.3) |
| 30 | Finanzierung und abgesicherte Anzahlung: so funktioniert es bei uns | Kaufen & Preise | T | C (sobald Angebot steht) | Termin | Bankangebot (23, 10.1); rechtlich prüfen |

**Artikelvorlage Ratgeber (Pflicht):** Antwort in den ersten 2 Sätzen (für KI-Suche und Snippet) → „Kurz gesagt“-Box mit 3 Fakten → Hauptteil mit Zwischenüberschriften als Fragen → eigenes Beispiel aus Lochau → Tabelle (Vergleich/Preisrahmen) → „Im Showroom ansehen“ mit 3–6 Produktkarten → FAQ (3–5) → Autor + „geprüft am“ → Termin-CTA. Länge 900–1.800 Wörter, so lang wie nötig.

---

## 4b. Content-Kalender 6 Monate (Nov 2026 – Apr 2027)

Takt: 1–2 Ratgeber/Woche (gesamt ~30), 1 Projekt/Monat, 2 Journal-Beiträge/Monat, 1 Newsletter/Monat, Reels 2–3/Woche, Google-Profil-Beitrag wöchentlich.

| Monat | Anlass (aus 23) | Ratgeber (Nr.) | Projekt / Journal | Video/Reels-Schwerpunkt | Newsletter |
|---|---|---|---|---|---|
| **Nov 2026** | Adventsabend Do 26.11.; Firmengeschenke; Outdoor einwintern; Samstag bis 17 Uhr (Test ab KW 46) | 14, 7, 8, 2, 1, 6 | Journal: „Ein Abend im Advent“ (Vorbericht + Rückblick); Projekt 1 (bestes vorhandenes Fotomaterial) | „Im Café“ Advent; „Unterwegs“ Einlagerung | 05.11.: Einladung Adventsabend + Gutscheine |
| **Dez 2026** | Weihnachten, Gutscheine, Jahreswechsel-Öffnungszeiten | 3, 10, 5, 9 | Journal: „Menschen: unsere Montage-Crew“; Homestory 1 | „Ein Stück, eine Minute“ Geschenkideen | 03.12.: Geschenke & Gutscheine, Öffnungszeiten |
| **Jan 2027** | Atelierverkauf (Ausstellungsstücke), Circle-Pilot, Planungssaison | 4, 15, 11, 16 | Projekt 2; Journal: „Was 2027 bei uns neu ist“ | Atelierstücke, je 1 Reel pro Stück | 07.01.: Ausstellungsstücke zuerst für Abonnenten |
| **Feb 2027** | „Platzhirsch Lounge“ ab Februar; Outdoor-Frühbucher Hotels; Bausaison-Planung | 12, 13, 19, 22 | Projekt 3 (Outdoor/Terrasse); Journal: erste Tafel | „Platzhirsch Tafel“ Pilot | 04.02.: Outdoor-Saison planen + Lounge |
| **Mär 2027** | Outdoor-Saison, Schweiz-Offensive, Küchen | 20, 21, 17, 18, 24 | Projekt 4 (Küche); Homestory 2 | „Unterwegs“ Lieferung in die Schweiz | 04.03.: Schweiz & FL – so einfach geht es |
| **Apr 2027** | Salone del Mobile (Mailand, Datum prüfen), Ostern, Outdoor-Start | 28, 23, 25, 26, 27, 29 | Projekt 5 + 6; Journal: „Aus Mailand“ | Live-Stories aus Mailand, Neuheiten | 01.04.: Vorschau Salone; 29.04.: Neuheiten im Showroom |

**Wochenroutine (Rollen im 5er-Team):**
- *Redaktionsleitung (0,3 FTE)*: Kalender, Briefings, Freigaben, Newsletter.
- *Berater (je 1 h/Woche)*: Sprachmemo zu einem Thema, Fachprüfung.
- *Social/Foto (0,3 FTE, intern oder Werkstudent)*: Reels, Google-Profil, Shootings.
- *Entwickler (anfangs M, dann 2 h/Woche)*: PR-Review, Lint, Veröffentlichen.
- *Inhaberin*: Brief im Newsletter, 1 Zitat pro Monat, Gastgeberin bei Events.

---

## 5. Risiken

| Risiko | Art | Wirkung | Gegenmaßnahme |
|---|---|---|---|
| Händler-Behauptung in Texten oder KI-Entwürfen | Recht (UWG, Markenrecht) | Abmahnung, gefährdet Verhandlung mit Minotti/Poliform | Verbotsliste in Vale (CI blockiert), Glossar, Freigabe; nur ClassiCon als „offiziell“ |
| Herstellerbilder ohne Freigabe | Recht (Urheberrecht) | Abmahnung, Löschung | `bildrechte.csv`, eigene Fotos (C6), Anfrage an Marken-Agenten |
| Falsche Preise/Zoll-/MWST-Angaben | Recht/Vertrauen | Haftung, Kundenärger | Preisrahmen mit Datum, `sources[]`, Steuerberater-Review, `check-facts.mjs` |
| Massenhaft KI-Text, dünne Stadt-/Ratgeberseiten | SEO (Scaled Content Abuse, Doorway) | Rankingverlust ganzer Domain | 3-E-Regel, max. 2 Ratgeber/Woche, Interview als Quelle, Qualität vor Menge |
| Personen-/Kundenbilder ohne Einwilligung | Recht (DSGVO, Recht am eigenen Bild) | Abmahnung | Einwilligungsvorlage, Anonymisierung von Ort/Adresse |
| Newsletter ohne Double-Opt-in | Recht (TKG/UWG) | Strafe, Spam-Einstufung | Backoffice prüfen, sonst Versandtool mit DOI |
| Video/YouTube lädt vor Consent | Recht (DSGVO) / Performance | Bußgeldrisiko, LCP | Klick-Fassade, eigene MP4 mit `preload="none"`, Poster |
| Bundle-/Ladezeit durch Content-Komponenten | Performance | schlechtere Core Web Vitals | MDX als Server Components (0 kB), Galerien dynamisch laden, keine Animationsbibliotheken |
| `next.config` auf `.mjs` umstellen | Technik | Build-Bruch (next-intl-Plugin) | eigener Branch, Plugins zuerst ohne remark (Metadaten per `export const meta`) |
| Redaktion schläft nach 6 Wochen ein | Pflege | veralteter Content (wie News 2022) | fester Wochenslot, Kalender, Ablaufdaten (`reviewDue`) mit monatlichem Report „fällige Artikel“ |
| Übersetzungen fehlerhaft (wie News heute) | Qualität/Marke | unseriös gegenüber IT-Marken | weniger Sprachen, Transkreation, Muttersprachler-Review |
| AI Act Transparenzpflichten | Recht | Kennzeichnungspflicht bei KI-Bildern/Deepfakes | keine KI-Bilder als echte Räume; Visualisierungen kennzeichnen [Anwalt] |

---

## 6. Priorisierte Reihenfolge

### Sofort baubar (ohne Backoffice-Zugang)

| # | Paket | Aufwand | Woche |
|---|---|---|---|
| 1 | **C1** Textreparatur `messages/*.json` + Brand-Voice-Dokument + Glossar | S | KW 44 |
| 2 | **C2** Ratgeber-Infrastruktur (MDX, Template, Hub, JSON-LD, Sitemap, llms.txt) | M | KW 44–46 |
| 3 | **C10** Qualitätskette (Vale-Regeln, `facts.json`, `check-facts.mjs`, Prompt-Vorlagen, Whisper lokal) | M | parallel KW 45–46 |
| 4 | Erste 6 Ratgeber der Prio A (14, 7, 8, 1, 6, 2) | Redaktion | ab KW 46 |
| 5 | **C3/C4** Projekt- und Journal-Inhalte im MDX-Template (Template-Code aus digital/01, F7) | M | KW 47–50 |
| 6 | **C5** Video-Komponente + erste Serie „Ein Stück, eine Minute“ | S + laufend | ab KW 47 |
| 7 | **C6** Fotostil-Leitfaden, Shooting-Plan, `bildrechte.csv` | S | KW 45 |
| 8 | **C9** Autorenprofile, Content-Events in `analytics.js`, „Passende Ratgeber“-Block auf Marken-/Produktseiten | M | KW 48–51 |
| 9 | **C8** de-CH-Varianten der Schweiz-Seiten (zusammen mit 25, H6) | M | Jan 2027 |
| 10 | Newsletter-Vorlage und erster Versand über das bestehende Tool | S | 05.11.2026 |

### Blockiert oder abhängig

| Paket | Blockiert durch |
|---|---|
| News-Bereinigung (Daten, Archiv, Tippfehler, Übersetzungen) | Schreibzugang Backoffice (Liste kann sofort vorbereitet werden) |
| Newsletter-Segmente, Sprachfeld, Double-Opt-in-Prüfung | Backoffice-Felder im Doctype `newsletter_website` |
| Ratgeber mit konkreten Preisen / `Offer` | Preisfeld im Backoffice + Klärung mit Herstellern (25, H2) |
| Produkttexte statt Herstellertexte (1.765 Seiten) | Backoffice-Zugang; danach KI-Kette C10 auf Produkte anwenden |
| Herstellerbilder in Ratgebern/Journal | Bildfreigaben der Marken |
| Projekte | Kunden-Einwilligungen, Fotograf |
| „Platzhirsch Tafel“-Videos | Live-Küche fertig (23, Abschn. 9) |
| Ratgeber 30 (Finanzierung, abgesicherte Anzahlung) | Bankangebot und Rechtsprüfung (23, 10.1) |
| Formulierungen zu Minotti/Poliform über „Ausstellung“ hinaus | Händlerstatus (Gate 0, 00 Abschn. 4) |

### Bibliotheks-Übersicht (dieser Plan)

| Paket/Tool | Version | Lizenz | Client-Größe | Status |
|---|---|---|---|---|
| `@next/mdx` | = `next` 16.2.x | MIT | 0 kB | empfohlen |
| `@mdx-js/loader`, `@mdx-js/react` | 3.1.x | MIT | ≤ 1 kB | empfohlen (Pflicht laut Guide) |
| `remark-gfm` | 4.0.x | MIT | 0 kB | empfohlen |
| `remark-frontmatter`, `remark-mdx-frontmatter` | 5.0.x / 5.x | MIT | 0 kB | optional (Start mit `export const meta`) |
| `zod` | 4.x | MIT | 0 kB (Server/Build) | empfohlen |
| `velite` | 0.2.x | MIT | 0 kB | Alternative |
| `lite-youtube-embed` | 0.3.x | Apache-2.0 | ~3 kB | optional |
| `embla-carousel-react` | 8.6.x | MIT | ~7 kB | aus digital/01 |
| `@react-email/components` | 0.x | MIT | 0 kB (Server) | optional |
| Vale | 3.x | MIT | CLI | empfohlen |
| LanguageTool Server | 6.x | LGPL-2.1 | Docker | empfohlen |
| `faster-whisper` | 1.x | MIT | lokale GPU | empfohlen |
| ffmpeg (NVENC) | 7.x | LGPL/GPL | lokal | empfohlen |
| Ollama | aktuell | MIT (+ Modell-Lizenz) | lokale GPU | optional |
| `sharp` | in Next enthalten | Apache-2.0 | Build | empfohlen |

---
*Quellen dieser Prüfung (26.10.2026):* hoettges.at (kein Blog/Ratgeber/Video/Newsletter, nur Deutsch), minotti.com/en (Projects, Video gallery, Catalogues, News, Scenes of Living), poliform.it/en (Projects, MAGAZINE 2026, YouTube), connox.at (Inspiration: Stories, How-tos, Styles, Trends, Topics, Geschenke), theconranshop.com (Meet Our Designers, Product Reviews). reiter-design.at nicht erreichbar (DNS), ambientedirect.com/de/magazin 404, rh.com nicht abgefragt (laut digital/01 blockiert). Live-API: `backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.news.api.news_data`.
