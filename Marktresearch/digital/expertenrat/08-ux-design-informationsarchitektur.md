# 08 – UX-Design und Informationsarchitektur (Expertenrat)

> Rolle: UX-Designer und Informationsarchitekt · Stand 26.10.2026
> Grundlage: `digital/01` (Design/IA), `02` (Motion), `05` (Beratung/Termin), `07` (E-Commerce), `12` (Content), `13` (Performance/A11y), `14` (Recht), `23-masterkonzept.md` Abschnitt 4, Code unter `src/` (nur gelesen).
> Prototypen `src/app/[locale]/preview/{galerie,buehne,dreilaendereck}`: Zum Zeitpunkt der Prüfung lieferte `/de/preview/galerie` noch HTTP 404. Es lagen nur Bausteine unter `src/components/Preview/galerie/` (Logo, content, fonts). Deshalb ist Abschnitt 5 als Bewertungsraster geschrieben, das man auf die fertigen Prototypen anwendet.
> Kennzeichnung: **[belegt]** = Primärquelle gelesen, **[sekundär]** = nur über Zusammenfassungen Dritter, **[Schätzung]** = fachliche Annahme, im Test zu prüfen.

---

## 1. Die 9 wichtigsten Erkenntnisse für dieses Projekt

| # | Erkenntnis | Was das für Platzhirsch heißt | Quelle |
|---|---|---|---|
| E1 | **Versteckte Navigation verschlechtert die Auffindbarkeit**, auf dem Desktop stärker als mobil. Am besten schnitten **Kombinationen** ab: einige Punkte sichtbar, der Rest hinter dem Menü. Bei der Seite mit Kombination nutzten 89 % der Aufgaben die Navigation, bei der Seite mit reinem Hamburger 44 %. Erster Navigationsklick nach 24 s statt 33 s. | Mobil die 3 wichtigsten Wege **sichtbar** lassen (Suche, Auswahl, Termin) und nicht alles ins ☰ packen. Desktop: **nie** ein Hamburger. | NN/g, Pernice & Budiu, „Hamburger Menus and Hidden Navigation Hurt UX Metrics“ und „Finding Navigation on Mobile“ (nngroup.com/articles/find-navigation-mobile-even-hamburger) [belegt] |
| E2 | **Mega-Menüs funktionieren**, wenn sie nach dem Denkmodell der Nutzer gruppiert sind (Card-Sorting) und sauber getimt werden: ca. **500 ms** Verweilzeit, bevor das Panel öffnet, Öffnen in ca. **100 ms**, Schließen erst nach ca. **500 ms** außerhalb von Menüpunkt und Panel, diagonaler Mauspfad bleibt offen. Jede Option nur einmal listen. Jeder Hauptpunkt verlinkt zusätzlich auf eine normale Übersichtsseite. | „Wohnen“, „Küche“, „Outdoor“, „Marken“ als Mega-Panels mit denselben Timings. Jeder Hauptpunkt hat eine echte Hub-Seite, die auch ohne JavaScript und für Screenreader funktioniert. | NN/g, „Mega Menus Work Well for Site Navigation“ (nngroup.com/articles/mega-menus-work-well) [belegt] |
| E3 | **Filter sind fast überall schwach.** 57 % der großen Shops bieten nicht alle fünf Kern-Filtertypen. 62 % erklären Fachfilter nicht (z. B. „Bezugskategorie“, „Sitztiefe“). 61 % heben wichtige Filter nicht hervor. 28 % zeigen keine Übersicht der aktiven Filter. 15 % erlauben keine Mehrfachauswahl innerhalb eines Filters (ODER-Logik). | Platzhirsch hat 1.765 Produkte und schon 7 Filtergruppen (`shopCatalog.js`: brand, category, indoorOutdoor, designer, subCategory, color, material). Was fehlt: **Maße, Verfügbarkeit („im Showroom“, „sofort lieferbar“), Preisrahmen**, Erklärungen und eine sichtbare Leiste mit den aktiven Filtern. | Baymard Institute, „Product Lists & Filtering UX Benchmark“ (baymard.com/blog/ecommerce-product-lists-report-and-benchmark) [belegt] |
| E4 | **Produktlisten:** 13 % der Shops bringen den Nutzer nach der Produktseite nicht an dieselbe Stelle der Liste zurück. 52 % laden eine falsche Standardzahl an Produkten. 38 % haben keine Filter für Informationen, die in der Kachel stehen. Bei visuell getriebenen Produkten fehlen auf 57 % der mobilen Listen die Farbmuster. | Scrollposition beim Zurück-Wischen erhalten. Das klappt nur mit **bfcache**, und der ist heute aus (Bericht 13, B1). Startmenge 24 Kacheln, danach „Weitere 24 laden“ mit Zähler statt Endlos-Scroll. Was in der Kachel steht (Marke, Designer, „im Showroom“), muss auch filterbar sein. | Baymard (wie E3) [belegt]; Bericht 13 B1 |
| E5 | **Suche:** 56 % der Shops haben eine „mittelmäßige oder schlechtere“ Suche. 69 % fangen Tippfehler in der Autovervollständigung schlecht ab. 46 % leiten nicht in passende Kategorien weiter. 15 % kennen keine Nicht-Produkt-Anfragen („Öffnungszeiten“, „Lieferung Schweiz“). 21 % haben mobil keinen Absende-Knopf neben dem Suchfeld. | Luxuskunden suchen nach **Marke + Modell** („minotti lawrence“), nach **Designer** („dordoni“), mit **Tippfehlern** („poliforme“, „rimadesio eclipse“) und nach **Service** („verzollung“, „samstag“). Die vorhandene Live-Suche (`/api/shop-search`, entprellt) braucht Tippfehler-Toleranz, Synonyme und Treffer aus Inhaltsseiten. | Baymard, „E-Commerce Search UX Benchmark 2026“ (baymard.com/blog/ecommerce-search-report-and-benchmark) [belegt] |
| E6 | **Kurze Formulare schließen häufiger ab.** Der durchschnittliche Checkout hat laut Baymard 11–15 Felder, nötig sind 7–8. Optionale Felder bremsen ebenfalls. 26 % aller Abbrüche gehen auf eine Pflicht-Registrierung zurück. | Die Produktanfrage (`AnfrageFormProduct.js`) verlangt heute Adresse, Stadt und UID. Ziel sind **höchstens 4 Pflichtfelder**: Name, E-Mail **oder** Telefon, Land, Anliegen. **Nie** ein Konto als Voraussetzung. | Baymard Checkout-Studien, zitiert über Shopify/WPForms-Zusammenfassungen [sekundär]; Bericht 05 F2 |
| E7 | **„Wunschliste“ kann sich gierig anfühlen.** Neutralere Wörter wie „Favoriten“ oder „Meine Liste“ wirken besser. Das Speichern muss ein einziger Tipp sein, ohne Anmeldung. | Das passt zu „**Ihre Auswahl**“ aus Bericht 01 F9 und Bericht 12. Bei Platzhirsch ist die Auswahl **kein** Warenkorb, sondern das Briefing für das Beratungsgespräch. | NN/g „Wishlist or Shopping Cart?“, zitiert über HostGator [sekundär]; Bericht 01 F9 |
| E8 | **Daumen und Zielgrößen:** WCAG 2.2 (2.5.8) verlangt mindestens **24 × 24 px**. Apple HIG empfiehlt **44 × 44 pt**, Material **48 × 48 dp**. Hoober (n = 1.333) hat beobachtet, dass 49 % der Nutzer das Handy einhändig bedienen und den Daumen benutzen. | Primäre Handlungen gehören mobil **unten** in die Daumenzone (Leiste „♡ Auswahl · Termin“). Alle Ziele haben mindestens 44 px, Breadcrumbs und Galerie-Punkte eingeschlossen. Laut Bericht 13 sind es heute 16–28 px. | W3C WCAG 2.2 SC 2.5.8; Apple HIG „Layout“; S. Hoober, UXmatters 2013 „How Do Users Really Hold Mobile Devices?“ [Fachwissen, Standardquellen] |
| E9 | **Dark Patterns sind in der EU verboten.** DSA Art. 25 untersagt Online-Schnittstellen, die Nutzer täuschen oder manipulieren. Die UGP-Richtlinie (Anhang I Nr. 7) verbietet falsche Behauptungen wie „nur heute verfügbar“. Fake-Knappheit, Countdowns und Confirmshaming sind damit ausgeschlossen. | Die IA darf **echte** Knappheit zeigen, und zwar nur als Fakt. Beispiel: „Ausstellungsstück, 1 Stück, in Lochau zu sehen“ ist wahr. Ein Countdown „Angebot endet in 02:14:33“ beim Atelierverkauf ist unzulässig, solange das Ende nicht echt ist. | VO (EU) 2022/2065 Art. 25; RL 2005/29/EG Anhang I; Bericht 14 |

**Zusatz aus dem eigenen Bestand (Bericht 01, 13, 23):**
- „Marken“ ist der **stärkste Suchcluster**, steckt aber heute unter „Über uns“ (Bericht 01, 1.2).
- Der Header ist **ca. 190 px** hoch. Bei Luxusmarken sind es 64–80 px.
- Die Sprache wird mit Flaggen gewählt. Das ist fachlich falsch, denn Sprache ist nicht Land. Für Schweizer Kunden ist es doppelt falsch: Ein Schweizer spricht Deutsch, braucht aber CHF.
- Kein Wettbewerber im Umkreis zeigt **Preise und Kalender zusammen** (23, 4.2 Nr. 4). Diese Lücke ist der größte UX-Hebel.

---

## 2. Konkrete Vorgaben für den Neuauftritt

### 2.1 Seitenstruktur (Sitemap, Zielbild)

Grundsatz: **Raum zuerst, Marke als Abkürzung, Beweis (Projekte) vor Behauptung.** Höchstens 7 Punkte in der Hauptnavigation, alle als echte Hub-Seiten.

```
Ebene 0   PLATZHIRSCH  Wohnen  Küche  Schlafen  Outdoor  Marken  Projekte  Das Haus   ⌕  ♡ Auswahl (3)  DE ▾  [ Termin ]

/de/wohnen                     Hub: Sofas · Sessel · Esstische · Stühle · Couchtische · Regale & Sideboards · Teppiche · Licht
/de/wohnen/sofas               Kategorie (Katalog, filterbar)        ← heute /de/produkte/[category]  (301-Weiterleitung)
/de/wohnen/sofas/minotti-lawrence   Produkt                          ← heute /de/produkte/[category]/[product]
/de/kueche                     Hub: Poliform/Varenna · Steinküche (Binni) · Planung in 5 Schritten · Küchen-Projekte · Planungstermin
/de/kueche/steinkueche         eigene Linie „leistbar“ mit Preisrahmen ab … (sobald belegt)
/de/schlafen                   Hub: Betten · Nachttische · Kleiderschränke & Ankleiden (Rimadesio, Poliform) · Matratzen (Treca)
/de/outdoor                    Hub: Lounge · Essen · Liegen · Sonnenschirme (Tuuci, Umbrosa) · Paola Lenti · Wintereinlagerung
/de/marken                     A–Z, typografisch, Filter „im Showroom zu sehen“ / „Wohnen / Küche / Outdoor / Licht“
/de/marken/minotti             Markenwelt (ersetzt /ueber-uns/marken/[title], 301)
/de/ausstellungsstuecke        Atelierverkauf: echte Preise, Stückzahl 1, Reservieren (Bericht 07, F2)
/de/projekte                   Referenzen, Filter: Typologie (Villa · Wohnung · Chalet · Hotel · Büro) × Land
/de/projekte/[slug]
/de/ratgeber                   Hub, 6 Rubriken (Bericht 12, 3.3)
/de/ratgeber/[slug]
/de/beratung                   Ein Eingang mit vier Türen: Showroom · Video · Hausbesuch · Rückruf (Bericht 05)
/de/beratung/termin            Kalender (nach Klick bzw. Consent geladen)
/de/fuer-architekten           Zielgruppenseite (Programm, Muster, CAD/BIM-Downloads, Ansprechpartner)
/de/fuer-hotels                Zielgruppenseite (ÖHT-fähig planen, Objektreferenzen, Outdoor + Einlagerung)
/de/einkaufen-schweiz-liechtenstein   Ablauf, CHF, Verzollung, Montage (Bericht 14, F7)
/de/das-haus                   Showroom & Café · Öffnungszeiten · Anfahrt · Team · Veranstaltungen · Journal
/de/auswahl                    Merkliste („Ihre Auswahl“)            ← heute /de/merkliste (301)
/de/designermoebel-[ort]       Regionsseiten (bleiben, verlinkt aus Footer und „Das Haus“)
```

**Regeln:**
1. **Klicktiefe:** Jedes Produkt ist von der Startseite in **≤ 3 Klicks** erreichbar (Wohnen → Sofas → Produkt). Jeder Ratgeber-Artikel braucht **≤ 2 Klicks** ab Hub. Messung per Crawl (Screaming Frog oder ein eigenes Skript), Abbruchgrenze 4.
2. **Polyhierarchie:** Ein Produkt hat **eine** kanonische URL (Raum/Kategorie). Es erscheint aber auch auf der Markenseite, in Projekten („Im Projekt verwendet“) und im Ratgeber. Nie zwei URLs für dasselbe Produkt.
3. **Schlafen wird Hauptpunkt** und hängt nicht mehr unter Wohnen. Gründe: Ankleiden (Rimadesio, Poliform) und Treca sind margenstarke Gesamtprojekte, und Bauherren planen Schlafzimmer als eigenen Raum. Licht bleibt unter Wohnen, mit einem Querverweis in jedem Hub. Damit stehen **7 Hauptpunkte** in der Leiste. Das ist die Obergrenze.
4. **Ausstellungsstücke stehen nicht in der Hauptleiste.** Sie erscheinen als Mega-Menü-Teaser in Wohnen und Outdoor, als Filter „Sofort verfügbar“ in jedem Katalog und im Footer. Der Grund: Ein Abverkauf in der ersten Ebene verwässert die Luxuspositionierung (Bericht 12: „Ausstellungsstück“ statt „Abverkauf“).
5. **Ratgeber steht nicht in der Hauptleiste.** Er ist erreichbar über „Das Haus“ → Journal & Ratgeber, über die Suche, über Kontextlinks auf Kategorie- und Produktseiten („Wie tief sollte ein Sofa sein? →“) und über den Footer. Der Ratgeber gewinnt über Google und nicht über das Menü.
6. **Zielgruppen-Einstiege (Architekten, Hotels, Schweiz)** liegen nicht in der Hauptleiste. Sie stehen in einer **Zeile im Footer** („Für Architekten · Für Hotels & Objekte · Einkaufen aus der Schweiz & Liechtenstein“), im Panel „Das Haus“ und als Eintrag im Beratungs-Einstieg („Ich bin … Privat / Architekt / Hotel / Bauträger“).
7. **URLs auf Deutsch, sprechend, ohne IDs.** In jeder Sprache steht dieselbe Struktur (`/en/living/sofas`, `/fr/salon/canapes`, `/it/living/divani`), mit hreflang.

### 2.2 Navigation

| Element | Vorgabe | Messbar |
|---|---|---|
| Header Desktop | **72 px** hoch, Papierton `#faf8f4`, unten eine Haarlinie 1 px in `rgba(48,55,62,.12)`. Beim Scrollen nach unten **bleibt er stehen** (kein Ausblenden, um Desktop-Nutzer nicht zu irritieren) | Höhe ≤ 72 px; `scroll-padding-top: 5rem` |
| Header mobil | **56 px**: Logo links, rechts ⌕, ♡ mit Zähler, ☰. Beim Herunterscrollen blendet er aus, beim ersten Hochscrollen um 8 px oder mehr wieder ein (Dauer 280 ms, `--ease-quiet`) | Höhe ≤ 56 px |
| Primärknopf | Einzig gefüllter Knopf im Header: **„Termin“** (Ink `#30373e`, Text Paper, `rounded-none`, 40 px hoch, ≥ 44 px Trefferfläche) | 1 gefüllter Knopf |
| Mega-Menü | Öffnet beim Hover nach **300–500 ms Verweilzeit** (Start mit 400 ms), Einblenden in 160 ms, Schließen nach **400 ms** außerhalb, Toleranz für den diagonalen Mauspfad. Mit Tastatur: Enter/Space öffnet, Esc schließt, Pfeiltasten wechseln die Spalte. Touch auf Tablet: erster Tipp öffnet das Panel, der Link „Alle Sofas →“ im Panel führt weiter | Ablauf im Usability-Test: 0 Fehlöffnungen bei 10 Mausbewegungen über die Leiste |
| Inhalt Mega-Panel | **3–4 Spalten** mit jeweils **höchstens 8 Einträgen**, Zahl der Produkte grau dahinter („Sofas 212“). Rechts **ein** Bild im Format 4:5 mit einem Teaser: „Neu im Showroom“ oder „Ausstellungsstück“. Unten der Link „Alle Wohnen →“ | ≤ 32 Links pro Panel |
| Marken-Panel | Alphabetisch in 3 Spalten, nur Namen in Bodoni 20 px. Ein Kreis-Symbol ● markiert „im Showroom zu sehen“, mit Legende. Darunter „Alle 36 Marken →“. **Keine Logos** (Bericht 14 F2: Logo wirkt wie ein Siegel) | – |
| Mobil-Menü | **Vollbild-Overlay**, Ebenen schieben horizontal (280 ms). Einträge in Bodoni 28–32 px, Zeilenhöhe ≥ 56 px. Oben ein Suchfeld (immer sichtbar), unten fest „Termin buchen“ und „Anrufen +43 …“. Zurück-Pfeil mit Ebenenname („‹ Wohnen“) | Ziele ≥ 44 px |
| Breadcrumbs | Ab Ebene 2 (`Wohnen / Sofas / Lawrence`), 14 px, Trefferfläche ≥ 24 px hoch (WCAG 2.5.8), mobil nur die **Elternebene** („‹ Sofas“) | – |
| Sprache und Währung | **Zwei getrennte Wahlen**: Sprache „DE · EN · FR · IT“ als Text ohne Flaggen. Region bzw. Währung „Österreich · Deutschland · Schweiz (CHF) · Liechtenstein (CHF)“ steht im Footer und im Auswahl-Flow. Für Besucher aus CH (IP oder `Accept-Language: de-CH`) erscheint **einmalig** eine dezente Zeile: „Sie sehen Preise in Euro. In Franken anzeigen?“, ohne Modal | Kein Flaggen-Icon |
| Footer | 4 Spalten: Sortiment · Das Haus · Für Profis (Architekten, Hotels, Bauträger) · Service (Lieferung AT/DE/CH/FL, Anzahlung abgesichert, Finanzierung, Pflege). Darunter Öffnungszeiten **mit dem heutigen Tag hervorgehoben** („Heute, Sa: 10–17 Uhr“), Adresse, Regionslinks | – |

### 2.3 Nutzerwege für 5 Personas

Für jede Persona gilt eine Zielvorgabe: **erste sinnvolle Handlung in ≤ 3 Klicks bzw. ≤ 60 s im Test.**

| Persona | Einstieg (typisch) | Kernfrage | Weg (Soll) | Ziel-Handlung | Was der Weg zeigen muss |
|---|---|---|---|---|---|
| **P1 Bauherr** (Neubau Villa, 45–60 J., Vorarlberg/Allgäu, Budget 80–300 T€ für Einrichtung, plant 6–12 Monate vor Einzug) | Google „Küche und Wohnen planen Vorarlberg“, Stadtseite, Empfehlung des Architekten | „Machen die das ganze Haus, und kann ich mich darauf verlassen?“ | Startseite → Teaser „Ein Haus, ein Projekt“ → **Projekte** (Filter Villa) → Projektseite → „Ihr Projekt besprechen“ → Beratung: **Planungstermin 120 min**, Upload Grundriss | Termin mit Grundriss | Projekte mit Fakten (Fläche, Leistungen, Zeitraum), „Anzahlung abgesichert“, ein Ansprechpartner mit Gesicht, Ablauf in 5 Schritten mit Wochenangaben |
| **P2 Paar mit Wohnung** (Kauf ETW Lindau/Bregenz, 32–45 J., 1–2 Räume, preisbewusst im Premium) | Instagram, Google „Minotti Sofa Preis“, „Steinküche“ | „Was kostet das ungefähr, und passt es in 4 × 5 m?“ | Kategorie Sofas → Filter **Breite ≤ 240 cm**, „im Showroom“ → 3 Stück ♡ → **Auswahl** → „Auswahl im Showroom ansehen“ → Samstagstermin | Samstagstermin mit vorausgefüllter Auswahl | Preisrahmen („ab … €“), Maße in jeder Kachel auf Wunsch, Samstagsslots, Café als Einladung, Steinküche mit Preisrahmen |
| **P3 Architekt / Innenarchitekt** (Büro Vorarlberg/Ostschweiz, arbeitet für Bauherren, will schnell Daten) | Direkt „/de/marken/rimadesio“, Newsletter, Lochauer Gespräche | „Bekomme ich Daten, Muster und einen schnellen Ansprechpartner?“ | Footer oder Beratung „Ich bin Architekt“ → **Für Architekten** → Produkt → Abschnitt **Downloads** (Datenblatt, CAD/3D, wenn freigegeben) → „Muster anfordern“ / „Projekt anmelden“ | Muster bzw. Projektanmeldung, Direktdurchwahl | Downloads ohne Anmeldung, wenn der Hersteller sie öffentlich bereitstellt; Projektschutz und Konditionen nur im Gespräch. **Keine** Konto-Pflicht |
| **P4 Hotelier** (Arlberg, Bregenzerwald, Bodensee, 20–120 Zimmer, Umbau in der Zwischensaison) | Google „Hotel Einrichtung Outdoor Arlberg“, Messe, Empfehlung | „Schafft ihr Termin und Menge, und hilft die ÖHT-Förderung?“ | **Für Hotels** → Objektreferenzen → Abschnitt „ÖHT-fähig planen“ (Antrag **vor** Projektbeginn) → Outdoor + Wintereinlagerung → **Objektanfrage** (Zimmerzahl, Bereiche, Zeitfenster Zwischensaison) | Rückruf in 2 h oder Videotermin 45 min | Zeitplan mit Zwischensaison, Objektreferenzen, Einlagerung, ein Projektleiter, keine Produktpreise nötig |
| **P5 Schweizer Kunde** (St. Gallen, Rheintal, FL, Zweitwohnsitz, 40–65 J.) | Google „Minotti günstiger Österreich“, „Möbel Österreich in die Schweiz liefern“ | „Was zahle ich in Franken **alles inklusive**, und wer montiert?“ | **Einkaufen aus der Schweiz & Liechtenstein** → Ablauf in 4 Schritten (Offerte → Ausfuhr → Verzollung → Montage) → **CHF-Kostenschätzung** (Rechner, als „unverbindlich“ gekennzeichnet) → Videoberatung mit Rundgang oder Samstagstermin | Videotermin oder Offerte | de-CH-Wörter („Offerte“, „MWST“, kein „ß“), CHF inkl. 8,1 % MWST, Fahrzeit „St. Gallen – Lochau 40 min“ [prüfen], Montagepartner in der CH |

**Persona-Regel für die IA:** Auf Startseite und Beratungsseite steht eine **unaufdringliche Weiche**: „Ich plane … ein ganzes Haus · eine Wohnung · ein Hotel/Objekt · als Architekt“. Sie ist ein Link-Set in einer Zeile, **kein** Pop-up und kein Quiz-Zwang. Zwei Klicks bringen jede Persona auf ihre Seite.

### 2.4 Katalog: Suche und Filter

**Suche**
- Mobil ist das Suchfeld **im Menü-Overlay immer offen**. Auf dem Desktop öffnet ⌕ einen Dialog oben mit voller Breite. Das Tastenkürzel `/` fokussiert die Suche.
- Autovervollständigung **nach 2 Zeichen**, Entprellung **150 ms**, Antwort in **≤ 300 ms** (p75). Ergebnisse in Gruppen: **Marken** (max. 3) · **Kategorien** (max. 3, „Sofas von Minotti“) · **Produkte** (max. 6, mit Bild 4:5 in 48 px) · **Seiten & Ratgeber** (max. 3, z. B. „Öffnungszeiten“, „Lieferung Schweiz“).
- **Tippfehler-Toleranz** (Levenshtein ≤ 1 bei Wörtern ab 4 Zeichen, ≤ 2 ab 8 Zeichen) und eine **Synonymliste**, gepflegt als JSON. Beispiele: Couch → Sofa, Ecksofa → Sofa mit Eckelement, Lounge → Outdoor-Lounge, Schrank → Kleiderschrank/Ankleide, „Platte“ → Steinplatte, „verzollung“ → Seite Schweiz, „samstag“ → Öffnungszeiten.
- Genaue Treffer auf Marke oder Kategorie („minotti“, „sofas“) führen **direkt** auf die Marken- bzw. Kategorieseite, mit Hinweis „Alle Treffer für ‚minotti‘ anzeigen“.
- **Kein „0 Treffer“-Sackgasse:** Die Nullseite zeigt die korrigierte Schreibweise, 3 ähnliche Kategorien und „Wir finden es für Sie: Anfrage in 1 Satz“ (Textfeld + E-Mail). Das ist das stärkste Luxusmuster: der Mensch als Suchmaschine.
- Messung: Suchbegriffe ohne Treffer wöchentlich auswerten (GA4-Ereignis `search` mit `results=0`, nur nach Consent).

**Filter (Kategorieseite)**
- **Horizontale Filterleiste** über dem Raster statt einer Sidebar (Bericht 01, F6). Die **4 wichtigsten** Filter sind sichtbar, der Rest steckt unter „Alle Filter (7)“.
  - Reihenfolge Wohnen: **Marke · Verfügbarkeit · Breite · Material**, dahinter Designer · Farbe · Unterkategorie · Preisrahmen (sobald Feld vorhanden).
  - Reihenfolge Outdoor: **Marke · Einsatz (Lounge/Essen/Liegen/Schirm) · Material (wetterfest) · Verfügbarkeit**.
  - Reihenfolge Küche: kein Produktfilter, sondern Hub mit **Linien** (Poliform/Varenna, Steinküche Binni) und Projekten.
- **Neue Filter** (Backoffice-Felder, bis dahin ausgeblendet):
  - Verfügbarkeit: „Im Showroom Lochau zu sehen“, „Ausstellungsstück sofort verfügbar“, „Lieferzeit bis 8 Wochen“.
  - Maße: Breite, Tiefe, Sitzhöhe, als Bereichsregler **und** als Zahleneingabe in cm.
  - Preisrahmen: Stufen (bis 5.000 € · 5–10 T€ · 10–20 T€ · über 20 T€), keine Schieberegler-Pseudogenauigkeit.
- **ODER innerhalb, UND zwischen** Filtergruppen (Minotti **oder** Poliform, **und** Leder). Optionen mit 0 Treffern werden ausgegraut, nicht entfernt, wenn sie gewählt sind (so macht es `shopCatalog.js` bereits).
- **Leiste der aktiven Filter** direkt über dem Raster: Chips „Minotti ×“, „Leder ×“, „Alle zurücksetzen“, dazu der Zähler „38 Stücke“ (Luxus-Wort statt „Produkte“).
- **Fachfilter erklären:** Ein ⓘ öffnet einen Popover mit 1 Satz (z. B. „Bezugskategorie: Preisgruppe des Stoffs. A ist günstiger, Leder L3 ist am teuersten.“).
- **Filter im URL-Zustand** (`?marke=minotti&material=leder`). Teilbar, Zurück-Taste funktioniert. Indexierbar sind nur Kombinationen mit einer Facette (Marke × Kategorie), alle anderen bekommen `noindex,follow` und canonical auf die Kategorie.
- Mobil: „Filter (2)“ und „Sortieren“ stehen als zwei gleich breite Knöpfe über dem Raster und bleiben beim Scrollen am oberen Rand haften. Die Filter öffnen als **Bottom-Sheet** (natives `<dialog>`, 85 % Höhe) mit dem Knopf **„38 Stücke anzeigen“**. Die Ergebnisse aktualisieren erst beim Bestätigen, nicht bei jedem Tipp. Das verhindert Springen und hält INP niedrig.
- Sortierung: **Empfohlen** (Standard, redaktionell: Showroom-Stücke und Neuheiten zuerst, gemischt nach Marke), Neuheiten, Preis auf/ab (erst mit Preisfeld), A–Z. **Nicht** „Beliebtheit/Bestseller“, solange keine echten Daten da sind.
- **Startmenge 24**, dann „Weitere 24 Stücke laden (noch 188)“. Nach der Produktseite stellt die Zurück-Taste die **exakte Scrollposition** wieder her (bfcache aktivieren oder Position in `sessionStorage` sichern).
- **Kachel:** Bild 4:5, **auf mobilen Geräten zweites Bild per Wischen**, Overline Marke, Name 17 px, eine Zusatzzeile nach Wahl (Designer **oder** „● im Showroom“ **oder** „ab 8.940 €“), ♡ immer sichtbar mobil (44 × 44 px). Auf dem Desktop erscheint ♡ beim Hover **und** beim Tastaturfokus.

### 2.5 Mobile-First (verbindliche Werte)

| Thema | Vorgabe |
|---|---|
| Basisbreite | Entwurf beginnt bei **360 px** (häufigste Android-Breite) und wird bei 390/430/768/1024/1440 geprüft. Seitenränder 20–24 px |
| Daumenzone | Primäre Handlung in den unteren 25 % des Bildschirms. **Kontextuelle untere Leiste**, 64 px + `env(safe-area-inset-bottom)`: Katalog „Filter · Sortieren“ (oben haftend), Produkt „♡ · Beratung zu Lawrence“, Auswahl „Termin mit Auswahl buchen“, sonst „Anrufen · Termin“ |
| Kollisionen | Die untere Leiste **erscheint erst**, wenn der Consent-Banner beantwortet ist, und verschwindet, sobald die Tastatur offen ist. `scroll-padding-bottom: 80px` (WCAG 2.4.11) |
| Ziele | ≥ 44 × 44 px, Abstand ≥ 8 px |
| Schrift | Fließtext 17 px, Zeilenhöhe 1,6. Eingabefelder **16 px** oder mehr, sonst zoomt iOS beim Fokus |
| Formulare | `inputmode`/`autocomplete` korrekt (`tel`, `email`, `postal-code`, `country`), sichtbare Labels über dem Feld, Fehler direkt am Feld (`aria-describedby`) |
| Galerie | Volle Breite, Wischen, Zähler „1/6“, Pinch-Zoom in der Lightbox, kein Autoplay |
| Telefon | `tel:`-Link. Öffnungszeiten-Logik: Außerhalb der Zeiten wird statt „Anrufen“ der Knopf „Rückruf morgen ab 9 Uhr“ gezeigt |
| Leistung | LCP ≤ 2,0 s, INP ≤ 150 ms, CLS ≤ 0,05 (p75 mobil, Bericht 13) |

### 2.6 Auswahl (Merkliste) und Anfrage-Flow

```
 ♡ auf Kachel/Produkt  →  Toast unten (3 s, mit Fokus erreichbar): „Zu Ihrer Auswahl hinzugefügt · Auswahl ansehen“
                         Zähler im Header ♡ 3 zählt hoch (160 ms, keine Hüpf-Animation)
          │
 /de/auswahl  „Ihre Auswahl (3)“
   ├ Liste: Bild 4:5 · Marke · Name · Notizfeld „Bezug, Farbe, Maß?“ · entfernen
   ├ Gruppiert nach Raum (Wohnen / Schlafen / Outdoor), wenn > 4 Stück
   ├ Teilen: Link kopieren (Auswahl im URL kodiert, ohne Konto) · „Als PDF mitnehmen“ (später)
   └ Drei nächste Schritte, gleich gewichtet:
       [ Im Showroom ansehen → Termin ]   [ Videoberatung → Termin ]   [ Angebot anfragen → Formular ]
                                                                          │
 Formular (ein Schritt, ≤ 4 Pflichtfelder):  Name · E-Mail oder Telefon · Land (AT/DE/CH/FL) · Wie dürfen wir uns melden?
   optional aufklappbar: Zeitrahmen · Raum/Projekt · Nachricht
   Datenschutzhinweis unter dem Knopf (Art. 13 DSGVO), keine Pflicht-Checkbox
   Knopf: „Auswahl senden“
          │
 Danke-Seite (bleibt stehen, kein Reset nach 5 s):
   „Danke, Frau Huber. Anna Meier meldet sich bis morgen 12 Uhr.“ (echte SLA, Mo–Sa)
   Nächster Schritt: [ Gleich Termin wählen ]  · Route zum Showroom · WhatsApp
```

Regeln:
- Speichern **ohne Konto** im Browser. Teilbar über einen Link. Kunden-Konto erst, wenn es echten Mehrwert hat (Angebote, Bestellungen), und nie als Pflicht.
- Die Auswahl wird beim Absenden **mitgeschickt** (Produkt-IDs + Notizen) und im Termin **vorausgefüllt** (`?auswahl=` an den Kalender).
- „Leere Auswahl“-Seite: 3 Einstiege (Sofas, Outdoor, Projekte) und der Satz „Merken Sie Stücke mit ♡, wir bereiten sie für Ihren Besuch vor.“
- Ausstellungsstücke bekommen in der Auswahl den Zusatz „Unikat, Verfügbarkeit bestätigen wir innerhalb von 24 h“. Das ist **echte** Information, keine Druckmache.

### 2.7 Terminbuchung

- **Ein Eingang `/de/beratung`** mit 4 Karten. Jede Karte nennt Dauer, Ort und Zielgruppe:
  - Showroom 60 min (Wohnen/Outdoor)
  - Planungstermin Küche/Gesamtprojekt 120 min
  - Video mit Live-Rundgang 30–45 min (CH/FL/DE)
  - Rückruf 15 min
  - Hausbesuch nur nach Erstkontakt (Bericht 05)
- **Ablauf in 3 Schritten** mit sichtbarem Fortschritt „1 Art · 2 Zeit · 3 Kontakt“. Kein automatisches Weiterspringen (WCAG 3.2.2). Zurück ist immer möglich.
- Zeitwahl: zuerst die **nächsten 3 freien Slots** als Knöpfe („Sa 31.10., 10:00“), dann „Weitere Termine“ mit Wochenansicht. **Samstag und Donnerstagabend** stehen sichtbar oben, sobald sie angeboten werden.
- Zeitzone und Ort werden immer angezeigt („Lochau, MEZ · Parkplatz vor dem Haus“).
- Kontakt im Schritt 3: Name, E-Mail, Telefon optional, Land. Vorausgefüllt aus Auswahl/Produkt (`?produkt=`).
- **Bestätigung sofort** auf dem Bildschirm und per E-Mail, mit Kalenderdatei (.ics), Anfahrt, Name und Foto des Beraters und „Was Sie mitbringen können: Grundriss, Fotos, Stoffmuster“. Umbuchen und Absagen funktionieren per Link mit 1 Klick, ohne Begründungspflicht.
- Datenschutz: Der Kalender des Drittanbieters lädt **erst nach Klick bzw. Consent**. Bis dahin steht eine Fassade mit dem Knopf „Kalender laden“ und der Alternative „Wunschtermin per Formular“ da (Bericht 14, F8).
- Ziel: **Buchung in ≤ 90 s** und ≤ 6 Interaktionen mobil (im Test messen).

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

| # | Idee | Warum es niemand in der Region hat | Aufwand |
|---|---|---|---|
| I1 | **„Ihre Auswahl liegt bereit“:** Wer einen Termin mit Auswahl bucht, bekommt die Bestätigung mit Foto: „Wir stellen Lawrence in Leder Pelle Soft bereit. Ihr Espresso auch.“ Die Auswahl wird zum Gastgeber-Ritual | Merkliste + Kalender + Café zusammen bietet kein Wettbewerber (23, 4.2 Nr. 1 und 4) | S–M (Prozess + Mail-Vorlage) |
| I2 | **Maß-Filter „Passt in meinen Raum“:** Breite, Tiefe und Durchgang eingeben, der Katalog zeigt nur Stücke, die passen, mit Hinweis „inkl. 70 cm Laufweg“ | Kein Premium-Händler im Umkreis filtert nach Maßen [Schätzung, Stichprobe Höttges/reiter/Fretz] | M (Felder vorhanden: `dimensionDiagram.js` hat Maße) |
| I3 | **„Im Showroom zu sehen“ als Live-Filter** und auf der Karte im Haus: Wo steht das Stück? („Erdgeschoss, Café-Vignette“) | Händler zeigen Marken, nicht, **welches Stück** man heute anfassen kann | M (Backoffice-Flag) |
| I4 | **Dreiländer-Schalter** für Region und Währung statt Flaggen: Inhalt, Preise, Lieferwege und Wortwahl (Offerte/Angebot) passen sich an | Fretz wirbt um Schweizer, hat aber keinen CHF-Preis und keine Verzollung (23, 4.3) | M |
| I5 | **Projekt → Produkt-Brücke:** In jedem Referenzprojekt sind die Stücke auf dem Bild antippbar („Shop the Room“, mit Hotspot-Punkt) und kommen per ♡ in die Auswahl | Höttges zeigt Projekte, aber ohne Verbindung zum Sortiment | M (Bericht 02, F10) |
| I6 | **Null-Treffer-Concierge:** Eine Suche ohne Treffer führt zu „Wir finden es für Sie“ mit Antwortversprechen | Gängig im Luxushandel international, regional nicht vorhanden [Schätzung] | S |
| I7 | **„Ich bin Architekt“-Modus:** Ein Schalter in der Beratung zeigt Downloads, Lieferzeiten und Direktdurchwahl zuerst, ganz ohne Login | Architekten bekommen heute überall dieselbe Endkunden-Seite | S–M |
| I8 | **Öffnungszeiten, die mitdenken:** „Heute bis 17 Uhr geöffnet · Café bis 16:30 · Sie sind in 9 min da (Lindau)“, Distanz nur nach Standortfreigabe | Höttges ist samstags zu. Die Info selbst ist das Argument, ohne Vergleichswerbung (Bericht 14, F2) | S |
| I9 | **Teilbare Auswahl für Paare:** Link schicken, der Partner ergänzt ♡, beide Auswahlen werden zusammengeführt. Ohne Konto | Paar-Entscheidungen sind der Normalfall bei P2. Kein Händler unterstützt das | M |

---

## 4. Was man auf keinen Fall tun darf

1. **Keine Dark Patterns:** keine falsche Knappheit („nur noch 2!“ bei Bestellware), keine Countdowns ohne echtes Ende, keine vorangekreuzten Newsletter-Häkchen, kein Confirmshaming („Nein danke, ich mag keine schönen Möbel“), kein Abbrechen-Knopf, der schwerer zu finden ist als Zustimmen (DSA Art. 25, UGP-RL Anhang I, UWG). Im Consent-Banner wiegt „Ablehnen“ visuell genauso viel wie „Akzeptieren“.
2. **Keine Händler-Behauptungen in der IA:** keine Menüpunkte, Labels, URLs oder Filterwerte wie „Offizieller Minotti-Händler“, „Minotti Store“ oder „Partner“ (Ausnahme ClassiCon, belegt). Erlaubt sind z. B. „Minotti in Lochau“ und „im Showroom zu sehen“ (Bericht 14, F2).
3. **Kein Hamburger-Menü auf dem Desktop** und keine Navigation, die nur als Icon existiert (E1).
4. **Keine Pflicht-Registrierung** für Auswahl, Anfrage, Downloads oder Termin (E6).
5. **Kein Pop-up beim Seitenaufruf** (Newsletter, Rabatt, Persona-Quiz). Ein Newsletter-Angebot erscheint frühestens im Footer oder nach einer abgeschlossenen Aktion.
6. **Kein Scroll-Hijacking und keine Endlos-Scroll ohne Footer:** Footer mit Öffnungszeiten und Rechtslinks muss erreichbar bleiben. Lenis nur, wenn natives Scrollverhalten, Anker und Tastatur unverändert bleiben (Bericht 02 rät ab).
7. **Keine Filter, die die Seite bei jedem Tipp neu laden** und dabei springen. Auf Mobil: sammeln, dann bestätigen.
8. **Keine Flaggen für Sprachen** und keine automatische Weiterleitung nach IP ohne Rückweg.
9. **Keine Sackgassen:** keine leeren Kategorien (Filter „0“ ausblenden), keine 0-Treffer-Seite ohne Ausweg, keine Danke-Seite ohne nächsten Schritt.
10. **Keine zwei Wahrheiten:** dasselbe Produkt nicht unter zwei URLs. Merkliste nicht einmal „Warenkorb“, einmal „Merkliste“, einmal „Auswahl“ nennen, das Wort ist überall **„Auswahl“**.
11. **Keine Formulare mit Platzhalter statt Label** und keine Felder für Adresse oder UID vor dem ersten Gespräch.
12. **Keine Bildschirme, auf denen Kontakt und Termin fehlen:** Jede Seite hat mindestens einen Weg zu Termin, Anruf oder Anfrage. Erlaubt ist er dezent, nicht als dauerblinkender Knopf.

---

## 5. Prüf-Checkliste für die drei Prototypen (galerie, buehne, dreilaendereck)

**Bewertung je Kriterium:** 0 = fehlt/kaputt · 1 = vorhanden, mit deutlichen Mängeln · 2 = gut · 3 = vorbildlich (besser als jeder Wettbewerber). Gewicht in Klammern. **Maximal 3 × Summe der Gewichte = 150 Punkte.** Ausschluss-Kriterien (K.o.) setzen den Prototyp unabhängig von den Punkten auf „überarbeiten“.

### A. Informationsarchitektur (Gewicht 12)
| # | Kriterium | Prüfung | G |
|---|---|---|---|
| A1 | Hauptnavigation ≤ 7 Punkte, Raum zuerst, Marken und Projekte auf Ebene 1 | Sichtprüfung Desktop | 2 |
| A2 | Jedes Produkt ≤ 3 Klicks ab Startseite | Klickpfad zu 3 Zufallsprodukten | 2 |
| A3 | Jeder Hauptpunkt hat eine eigene Hub-Seite, die ohne JS erreichbar ist | JS aus, Links klicken | 2 |
| A4 | Ausstellungsstücke, Ratgeber, Architekten, Hotels und Schweiz sind ≤ 2 Klicks erreichbar | Pfade zählen | 2 |
| A5 | Begriffe einheitlich („Auswahl“, „Ausstellungsstück“, „Showroom in Lochau“), keine Händler-Claims | Textsuche im Prototyp | 2 |
| A6 | Breadcrumbs ab Ebene 2, mobil verkürzt | Sichtprüfung | 2 |

### B. Navigation und Header (Gewicht 10)
| # | Kriterium | Prüfung | G |
|---|---|---|---|
| B1 | Header ≤ 72 px Desktop / ≤ 56 px mobil, 1 gefüllter Knopf („Termin“) | DevTools messen | 2 |
| B2 | Mega-Menü: Öffnen nach 300–500 ms, Schließen nach ≈ 400 ms, Diagonalpfad, Esc schließt, Tastatur bedienbar | 10 Mausbewegungen, Tab/Enter/Esc | 3 |
| B3 | Mobil-Menü Vollbild, Suche sichtbar, Ziele ≥ 44 px, Termin/Anruf unten | Messung 390 px | 3 |
| B4 | Sprache ohne Flaggen, Region/Währung getrennt, CH-Hinweis ohne Modal | Sichtprüfung | 2 |

### C. Suche und Filter (Gewicht 10)
| # | Kriterium | Prüfung | G |
|---|---|---|---|
| C1 | Autovervollständigung gruppiert (Marken · Kategorien · Produkte · Seiten), ≤ 300 ms | Eingabe „mino“, „sofa“, „verzollung“ | 2 |
| C2 | Tippfehler und Synonyme („poliforme“, „couch“) liefern Treffer, 0-Treffer-Seite mit Ausweg | 5 Testbegriffe | 2 |
| C3 | Max. 4 sichtbare Filter, aktive Filter als Chips mit „Alle zurücksetzen“, ODER-Logik je Gruppe | 3 Filter kombinieren | 2 |
| C4 | Mobil Bottom-Sheet mit „X Stücke anzeigen“, Filter im URL-Zustand | Teilen-Link öffnen | 2 |
| C5 | Zurück von der Produktseite stellt die Scrollposition her | Kachel 30 öffnen, zurück | 2 |

### D. Personas-Wege (Gewicht 10, Test mit je 1–2 Personen oder strukturiertem Walkthrough)
| # | Aufgabe | Ziel | G |
|---|---|---|---|
| D1 | P1 Bauherr: „Finden Sie ein Villa-Projekt und vereinbaren Sie einen Planungstermin.“ | ≤ 4 Klicks, ≤ 90 s | 2 |
| D2 | P2 Paar: „Finden Sie ein Sofa unter 240 cm Breite, das im Showroom steht, und merken Sie es.“ | ≤ 5 Interaktionen | 2 |
| D3 | P3 Architekt: „Finden Sie das Datenblatt eines Rimadesio-Schranks.“ | ≤ 3 Klicks, ohne Login | 2 |
| D4 | P4 Hotelier: „Finden Sie heraus, ob Platzhirsch Hotels ausstattet und wie man anfragt.“ | ≤ 2 Klicks bis zur Hotelseite | 2 |
| D5 | P5 Schweizer: „Was kostet ein Sofa ungefähr in CHF inkl. Lieferung, und wer montiert?“ | Antwort in ≤ 60 s auffindbar | 2 |

### E. Auswahl, Anfrage, Termin (Gewicht 10)
| # | Kriterium | Prüfung | G |
|---|---|---|---|
| E1 | ♡ mit 1 Tipp, Rückmeldung (Toast + Zähler), ohne Konto, Auswahl teilbar | Test mobil | 2 |
| E2 | Anfrage ≤ 4 Pflichtfelder, sichtbare Labels, Fehler am Feld, Datenschutzhinweis | Felder zählen, Fehler provozieren | 3 |
| E3 | Termin in 3 Schritten, nächste 3 Slots sofort, kein Auto-Weiter, Bestätigung mit .ics | Durchlauf mit Stoppuhr ≤ 90 s | 3 |
| E4 | Danke-Seite mit Name, Antwortzeit und nächstem Schritt | Sichtprüfung | 2 |

### F. Mobile und Barrierefreiheit (Gewicht 8)
| # | Kriterium | Prüfung | G |
|---|---|---|---|
| F1 | Kein horizontales Scrollen bei 360 px, Ränder ≥ 20 px | DevTools 360 px | 2 |
| F2 | Ziele ≥ 44 px (mind. 24 px WCAG), Eingabefelder ≥ 16 px Schrift | Messung | 2 |
| F3 | Untere Leiste kontextuell, keine Kollision mit Consent/Tastatur, Fokus nicht verdeckt | Test iOS/Android-Emulation | 2 |
| F4 | axe ohne kritische Fehler, Kontrast ≥ 4,5:1 Text / ≥ 3:1 Fokus, `prefers-reduced-motion` respektiert | `@axe-core`, OS-Einstellung | 2 |

### K.o.-Kriterien (jedes einzelne = „überarbeiten“)
- [ ] Dark Pattern vorhanden (Fake-Knappheit, Countdown, Confirmshaming, vorangekreuzte Einwilligung)
- [ ] Händler-Behauptung für eine Marke ohne Beleg
- [ ] Inhalt nur mit JavaScript sichtbar (`opacity:0` vor Hydration) oder Navigation ohne Tastaturbedienung
- [ ] Pflicht-Registrierung irgendwo im Anfrage- oder Terminweg
- [ ] Mobil LCP > 2,5 s oder CLS > 0,1 (Lighthouse mobil, Prototyp-Route)

### Auswertung
| Punkte (von 150) | Urteil |
|---|---|
| ≥ 125 | Bereit für den Ausbau |
| 100–124 | Gute Basis, Mängel in den schwächsten 2 Bereichen beheben |
| 75–99 | Teile übernehmen (bester Bereich je Prototyp), Rest neu |
| < 75 | Verwerfen |

**Empfehlung zum Verfahren:** Alle drei Prototypen von **2 Personen unabhängig** bewerten lassen und den Mittelwert bilden. Weichen die beiden um mehr als 1 Punkt je Kriterium ab, wird das Kriterium gemeinsam besprochen. Die Persona-Aufgaben (D) mit **mindestens 5 echten Testpersonen** prüfen: Kunden aus dem Café, ein Architekt, ein Schweizer Bestandskunde. Laut Nielsen deckt diese Zahl die Mehrheit der Usability-Probleme ab (NN/g, „Why You Only Need to Test with 5 Users“). Am Ende entsteht kein Sieger-Prototyp, sondern eine **Kombination**: je Bereich A–F der Prototyp mit der höchsten Punktzahl.

---

## Quellen
- NN/g, Pernice/Budiu: „Hamburger Menus and Hidden Navigation Hurt UX Metrics“ / „Finding Navigation on Mobile“ – https://www.nngroup.com/articles/find-navigation-mobile-even-hamburger/ (abgerufen 26.10.2026)
- NN/g: „Mega Menus Work Well for Site Navigation“ – https://www.nngroup.com/articles/mega-menus-work-well/ (abgerufen 26.10.2026)
- Baymard Institute: „Product Lists & Filtering UX Benchmark“ – https://baymard.com/blog/ecommerce-product-lists-report-and-benchmark (abgerufen 26.10.2026)
- Baymard Institute: „E-Commerce Search UX Benchmark“ – https://baymard.com/blog/ecommerce-search-report-and-benchmark (abgerufen 26.10.2026)
- Baymard Checkout-Feldzahlen und Abbruchgründe, zitiert u. a. über https://wpforms.com/online-form-statistics-facts/ und https://shopify.co.nz/enterprise/faster-checkout-process [sekundär, Primärbericht hinter Bezahlschranke]
- NN/g „Wishlist or Shopping Cart?“, zitiert über https://www.hostgator.com/blog/ [sekundär]
- NN/g, J. Nielsen: „Why You Only Need to Test with 5 Users“ – https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/
- W3C: WCAG 2.2, SC 2.5.8 Target Size (Minimum), 2.4.11 Focus Not Obscured, 3.2.2 On Input – https://www.w3.org/TR/WCAG22/
- Apple Human Interface Guidelines (44 pt), Google Material Design (48 dp)
- S. Hoober: „How Do Users Really Hold Mobile Devices?“, UXmatters, 2013
- VO (EU) 2022/2065 (Digital Services Act), Art. 25; RL 2005/29/EG (UGP), Anhang I
- Interne Berichte: `Marktresearch/digital/01, 02, 05, 07, 12, 13, 14`, `Marktresearch/23-masterkonzept.md` Abschnitt 4
