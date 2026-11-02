# Paket „Startseite“ – Neuauftritt

**Stand:** 26.10.2026 · **Branch:** feature/neuauftritt (nicht committet) · **Grundlage:** Design-Bibel `expertenrat/00-design-bibel.md` (§1, §2, §4–§8, §10.2, §11, §12, §16, §17), Jury-Urteil `qa-screenshots/jury/00-jury-urteil.md` (§3, §5), Fundament `redesign/fundament.md`.

## 1. Aufbau der Seite (`/de`, `/en`, `/fr`, `/it`)

| # | Abschnitt | Fläche | Herkunft / Regel |
|---|---|---|---|
| 1 | **Hero**: Overline „Einrichtungsstudio & Café · Lochau am Bodensee“, **H1** „Italienisches Wohnen am Bodensee.“ + (in derselben H1, sichtbar) die bisherige SEO-H1 „Designermöbel, Küchen & Interior Design in Vorarlberg“, Lead, **ein** Primärknopf „Termin wählen“, Link „Showroom & Café“ (#haus), Infozeile Öffnungszeiten · Adresse · Telefon | paper | Bibel §10.2, W12, W15, W16; Jury 3.1/3.2. Eigenes Showroom-Foto, `preload` (nicht `priority`), steht still, kein Fade/Zoom. Text neben dem Bild statt darauf → Ink auf Paper 11,37:1 |
| 2 | **Gastgeber**: „Wir sind Gastgeber, bevor wir Einrichter sind.“ + 4 Versprechen; einzige **Horizontlinie** | paper | Bibel §1.2; Jury 3.1 (Dreiländereck) |
| 3 | **Räume** Wohnen / Küche / Schlafen / Outdoor (4:5, versetzt) | stone | Bibel §10.1 „Raum zuerst“; hell statt Bühne-Kapitel |
| 4 | **Kuratierte Auswahl**: 6 echte Katalogstücke (Poliform Westside Soft, ClassiCon Volkshaus Lounge Chair, Flos Taraxacum 88, Poliform Yume, ClassiCon Bell Side Table, Paola Lenti Welcome Outdoor Sofa), Herstellerbilder **unbeschnitten** auf Linen, Designer als Meta | paper | Bibel §11 Kuratieren; Jury 3.1 |
| 5 | **Showroom & Café**: „Erst ein Kaffee. Dann das Sofa.“, Öffnungszeiten, Adresse, Route, Anrufen | **walnut (1×)** | Bibel W5; Jury 3.3 |
| 6 | **Marken als Schriftliste** (Bodoni ≥ 32 px, Herkunft, kein Logo), „Marken in unserer Ausstellung“, „zeigen und planen“, Hinweis Markenrechte | paper | Bibel §9 card-brand, §14; Jury 3.4 |
| 7 | **Dreiländer-Service**: schematische SVG-Karte (aus Prototyp kopiert, ohne Fahrzeiten), AT/DE/CH/FL-Karten, auf `/de` alle Regions-Landingpages (vorher `RegionLinks`) | stone | Bibel §12.4; Jury 3.1 |
| 8 | **Leistungen**: Küchenplanung, Interior Design, Outdoor-Planung, Yacht-Interior (Links) | paper | Jury P1.15 |
| 9 | **SEO-Text + FAQ** (`homeSeo`, unverändert) als `<details>` | bone | FAQPage-JSON-LD bleibt synchron |
| 10 | **Neuigkeiten & Ratgeber**: 3 News; Ratgeber automatisch, sobald `getIndexableRatgeber()` Artikel liefert (heute leer) | paper | Ratgeber-Regel „nur freigegebene“ |
| 11 | **Schluss-CTA**: Leitsatz „Nehmen Sie Platz.“ (1×, einziges zentriertes Element), „Wir nehmen uns Zeit.“, „Termin wählen“ + Telefon | stone | Bibel W15; Jury 3.3 |

Alles Server Components, 0 KB eigenes Client-JS (vorher: 4 Client-Komponenten inkl. Wishlist-Herz, Marquee, FadeInView-Kaskaden).

## 2. SEO – nichts verloren

- URL, `generateMetadata` (Title, Description, Canonical, hreflang, robots, OG/Twitter) und JSON-LD (WebPage, FAQPage) **unverändert**.
- Genau 1 H1; die alte H1 (`Slider.headline`, je Sprache) steht weiter sichtbar in der H1, ergänzt um die Bibel-Zeile.
- Interne Links: 12 Markenseiten (vorher Logo-Wand + Hero), 4 Kategorien + Küchenseite, 6 Produktseiten, alle 9 Regions-Landingpages (DE), 4 Leistungsseiten, News. Wegfall: 6 Kategorie-Kacheln → ersetzt durch Räume + „Alle Produkte“.
- SEO-Text und FAQ unverändert im HTML.
- Leistungsseiten gibt es nur auf Deutsch: in EN/FR/IT Link auf die deutsche Seite mit `hreflang="de"` und sichtbarem Hinweis „Seite auf Deutsch“ (kein 404).

## 3. Dateien

| Datei | Änderung |
|---|---|
| `src/app/[locale]/page.js` | nur Imports, Datenabruf (3 statt 6 Fetches) und Komposition |
| `src/components/Home/copy.js` | **neu** – alle Texte DE/EN/FR/IT + `getHomeT()` (t.has → Fallback) |
| `src/components/Home/SectionIntro.js` | **neu** – asymmetrischer Abschnittskopf |
| `src/components/Home/Hero.js` | neu geschrieben |
| `src/components/Home/Rooms.js`, `HouseCafe.js`, `BrandList.js`, `DreilaenderService.js`, `DreilaenderMap.js`, `Services.js`, `Journal.js`, `ClosingCta.js` | **neu** |
| `src/components/Home/SeoIntro.js` | auf Bausteine umgestellt (Inhalt gleich) |
| `src/components/ProuductSectionHome/ProuductSectionHome.js` | jetzt `CuratedSelection` (Server, kuratierte Liste, Fallback Minotti) |
| `src/components/WhyChooseUsSectionHome/WhyChooseUsSectionHome.js` | jetzt `HostPromises` (Server) |
| gelöscht: `Home/about.js`, `blog.js`, `BrandWall.js`, `CategoryTiles.js`, `RegionLinks.js`, `ShowroomCta.js` | nirgends sonst importiert (geprüft) |
| `Marktresearch/digital/redesign/messages-startseite.json` | Textvorschlag Namespace `HomePage`, 100 Schlüssel × 4 Sprachen, aus `copy.js` erzeugt |
| `qa-screenshots/neuauftritt/startseite/selbsttest/` | `shoot.mjs`-Aufnahmen + Abschnittsbilder Desktop (`abschnitt-d-*`) und 375 px (`abschnitt-m-*`) |

`Home/vernissagePopup.js` bleibt unverändert (wird von `client-layout.js` genutzt).

## 4. Prüfung

- `/de`, `/en`, `/fr`, `/it` → 200. `shoot.mjs`: 4 Geräte 200, 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein Überlauf.
- 375 px: kein Überlauf in `<main>`; H1 bei 128–345 px, Bild 369–619 px, also im ersten Viewport. 1 × `data-surface="inverse"`.
- Alle kleinen Linkflächen sind „stretched links“ (ganze Karte klickbar) oder ≥ 44 px.
- ESLint (eigene Dateien): 0 Fehler, 0 Warnungen.
- Während des Tests brachen fremde Dateien zeitweise den Dev-Build (`produkte/[category]/[product]/page.js`, `fehlerseite-global.preview/probe`) – nicht aus diesem Paket.

## 5. Offene Punkte

1. **Texte übernehmen:** `messages-startseite.json` → `src/messages/*.json` (Paket „Recht & Texte“). Bis dahin greifen die Fallbacks aus `copy.js`; danach kann `HOME_COPY` als Fallback bleiben oder entfallen.
2. **Seelicht:** heute ein Bild (`/Images/Home/aboutHome.jpg`, eigenes Showroom-Foto). Nach dem Shooting 4 Lichtstimmungen + eigenes 4:5-Mobilbild per `getImageProps`/`<picture>`; Auswahl in einer gecachten Komponente (setzt `cacheComponents` voraus, Bibel §13).
3. **Unterzeile am CTA:** „60 Minuten · kostenlos · Espresso inklusive“ ist **nicht** bestätigt (Jury-Frage 4) – heute steht nur „Im Showroom in Lochau oder bei Ihnen zu Hause, auch samstags.“ Nach Bestätigung ersetzen.
4. **Café-Öffnungszeiten** unbekannt (Jury-Frage 10) – nur Showroom-Zeiten genannt. Öffnungszeiten liegen doppelt (`layout.js` JSON-LD, `Navbar.hours`, `copy.js`) → in `lib/site.js` zusammenführen.
5. **Fahrzeiten** auf der Karte bewusst weggelassen, bis OSM/OSRM-Werte mit Stand vorliegen (Bibel §12.4). Kartenbeschriftung ist mobil sehr klein (Inhalt steht zusätzlich in der Liste).
6. **TrustBlock / Termin-Modul** (P0.2): Termin-CTAs zeigen weiter auf `/beratung`; nach Fertigstellung des Terminmoduls nur `ROUTES.beratung` bzw. Ziel tauschen.
7. **Weiche „Ich plane …“** (Bibel §10.2) und **Projekte (3)** fehlen – es gibt keine Zielseiten/keine belegten Projekte.
8. **Gastgeberin-Porträt** im Kapitel Haus fehlt (P1, Gesicht in den ersten 2 Viewports) – Foto + Einwilligung nötig.
9. **Footer** ist heute dunkel (`bg-ink-deep`, fremdes Paket): zusammen mit der Walnut-Fläche sind es 2 dunkle Flächen, bis die Hülle den Footer hell macht (Jury 3.3).
10. **„Ihre Auswahl“**: das alte Wishlist-Herz an den Produktkacheln ist entfallen; wieder einbauen, sobald die Auswahl-Insel (Signature-Feature 3) existiert.
11. **CMS-Inhalte** `second_content`, `below_products`, `above_footer` der Homepage werden nicht mehr gerendert (Metadaten aus dem CMS weiterhin).
12. Kuratierte Auswahl ist eine feste Liste in `CURATED` (inkl. Bildindex); fällt ein Stück weg, füllt Minotti auf. Später ins Backoffice („Startseite-Auswahl“) verlagern, Begründung durch eine Person ergänzen (Bibel §11).

## 6. Benötigte Bilder (Shotliste §7)

| Stelle | heute | benötigt |
|---|---|---|
| Hero | `Images/Home/aboutHome.jpg` (Showroom Lochau) | Seelicht S01/S02 in 4 Tageslichtern, 21:9 + 4:5 |
| Showroom & Café | `Images/Home/secondAboutHome.jpg` | Café/Tresen mit Gastgeberin, Durchblick Café → Showroom |
| Wohnen | `Images/Wohnen/bannerImage4.jpg` (Minotti-Kampagne, **Meerblick im Hintergrund**) | eigene Vignette Wohnen |
| Küche | `Images/Home/slider/poliform-kueche-kochinsel.webp` | eigene Küchen-Vignette |
| Schlafen | `Images/Home/slider/poliform-schlafzimmer-bett.webp` | eigene Vignette Schlafen (Tréca/Poliform) |
| Outdoor | `Images/Outdoor/bannerImage1.jpg` (Minotti-Kampagne) | Terrasse am See im Abendlicht |
| Kuratierte Auswahl | Herstellerbilder aus dem Backoffice | Freigabe je Hersteller im Bildregister |

Alle Herstellerbilder brauchen den Freigabe-Nachweis im Bildregister (Bibel §7.1). Bewusst **nicht** verwendet: `orionMinoti.jpg`/`minotti-sofa-wohnzimmer.webp` (Skyline), `Outdoor/bannerImage3–5` (Zypressen, Meer).

## 7. Runde 2 – QM-Feedback umgesetzt (26.10.2026)

Grundlage: `qa-screenshots/neuauftritt/startseite/feedback.md`. Prüfaufnahmen und Messwerte: `qa-screenshots/neuauftritt/startseite/fix/` (shoot.mjs plus eigene Aufnahmen bei DPR 1 und 1,25 sowie 375×667).

**P1**
- **P1-1 Handlung im ersten Mobil-Viewport** (`Hero.js`): Die DOM-Reihenfolge entspricht jetzt der Mobil-Reihenfolge: Overline, H1, Knöpfe, Foto, Lead, Infozeile. Die Overline steht mobil einzeilig (neuer Schlüssel `hero.eyebrowShort`, „Lochau am Bodensee“), die H1 nutzt mobil `display-l` und ab `lg` `display-xl`. Messung: „Termin wählen“ endet bei y = 372 (375×667) bzw. y = 373 (iPhone 15 Pro, 393×659).
- **P1-2 Bodoni bei DPR 1** (`page.js`): Auf der Seite gilt für `.font-display` und `.font-display-italic` ein fester Wert `font-variation-settings: "opsz" 28`. Gegenprobe bei DPR 1 und 1,25: „für“, „Wir“ und das Komma sind sauber (`fix/dpr1-*.png`, `fix/dpr125-*.png`). **Offen für Fundament:** Den Wert in die Typo-Tokens (`globals.css`) übernehmen. Danach kann der Wrapper in `page.js` entfallen.
- **P1-3 Überlauf bei 375 px:** Der Fehler lag im Header (fremdes Paket). Neu gemessen: `scrollWidth` = 375. Er ist inzwischen behoben.

**P2**
- **P2-1 Produktkacheln:** `mix-blend-multiply` war schon gesetzt. Die Poliform-Bilder haben aber einen Grund von #f8f8f8 statt Weiß. Für Westside Soft und Yume hebt `lift: true` den Grund deshalb per `brightness(1.03)` auf Weiß.
- **P2-2 „W“:** Die neue Hilfsfunktion `Home/kern.js` (`kernDisplay`) kernt ein „W“ am Wortanfang um −0,07 em nach. Sie greift in der H1, in `SectionIntro` und im Schluss-CTA. Der Textinhalt bleibt unverändert.
- **P2-3 Schluss-CTA** (`ClosingCta.js`): Oben steht die Overline „Termin“. Darunter folgt **eine** H2 mit „Nehmen Sie Platz.“ (kursiv, `display-l`) und „Wir nehmen uns Zeit.“ (aufrecht, `display-m`), danach Text und Knöpfe. `CTABand` wird hier nicht mehr verwendet.
- **P2-4 Mobile Länge:**
  - Räume und Neuigkeiten stehen als Scroll-Snap-Reihe (78 vw, ohne JS).
  - Gastgeber-Versprechen, Länderkarten und Marken stehen mobil zweispaltig.
  - Die Regions-Teaser sind erst ab `sm` sichtbar und bleiben im HTML.
  - Ergebnis: iPhone vorher 17 870 px, jetzt 17 019 px. Das Ziel von unter 13 000 px ist nicht erreicht: Header und Footer allein messen etwa 3 400 px (fremdes Paket), dazu kommen SEO-Text und FAQ mit etwa 1 800 px, die bewusst erhalten bleiben. Desktop: 13 478 px.
- **P2-5 Infozeile Desktop:** Die Infozeile steht kompakt in der linken Spalte unter den Knöpfen, bei y = 774–852 auf 1440×900. Die Samstagszeile (`hero.ctaNote`) ist gestrichen.

**P3**
- **Umgesetzt:**
  - P3-1: Leerzeichen zwischen den H1-Spans.
  - P3-2: typografischer Apostroph in allen FR/IT-Texten von `copy.js`.
  - P3-3: Tag-/Zeit-Paare mit `nowrap`.
  - P3-4: „next125“ wird klein geschrieben.
  - P3-5: News-Teaser werden am Wortende gekürzt.
  - P3-8: Linktexte lauten „Mehr zur Küchenplanung“ usw. (`services.*.link`).
  - P3-9: Kartenbeschriftungen mobil mindestens 12 px.
  - P3-10: „wenige Minuten“ steht nur noch im Intro.
  - P3-11: Die Overline heißt jetzt „Unser Versprechen“.
  - P3-13: Unter der Auswahl steht eine Zeile mit 7 Kategorie-Links. Die Beschriftungen kommen aus `ProductsMenu`.
- **Geprüft ohne Änderung:** P3-14. `::after` von `.ph-stretched` deckt die ganze Kachel ab, weil das `article` mit `relative` der Bezugsrahmen ist.
- **Offen:**
  - P3-6: CMS-Titel in Versalien (Backoffice).
  - P3-7: beobachten.
  - P3-9: Kontur aus OSM-Daten.
  - P3-12: Markenzahl und Anrede in `homeSeo.js` (Recht & Texte).
  - P3-15: AVIF-Hänger im Dev-Server.
  - P3-16: LCP auf dem Produktions-Build messen.

**Texte:** `messages-startseite.json` ist aus `copy.js` neu erzeugt (105 Schlüssel × 4 Sprachen).
- Neu: `hero.eyebrowShort`, `selection.categories`, `services.{kitchen,interior,outdoor,yacht}.link`.
- Entfallen: `hero.ctaNote`.
- Geändert: `host.eyebrow`, `region.countries.de.text`, FR/IT-Apostrophe.

**Prüfung:**
- ESLint ist für alle Paketdateien sauber.
- shoot.mjs: Status 200 auf allen Geräten, kein Überlauf.
- Auf dem iPhone gibt es 1 Konsolenwarnung: „Can't perform a React state update on a component that hasn't mounted yet“. Sie stammt aus einer Client-Komponente; die Startseite enthält nur Server Components, vermutlich Header oder Cookie-Banner. Bitte an die Integration weitergeben.

## 8. Runde 3 – R3-startseite (26.10.2026)

Bericht: `Marktresearch/digital/teamleiter/r3-R3-startseite.md`. Messskripte und Aufnahmen: `qa-screenshots/teamleiter/r3-startseite/`, shoot.mjs: `qa-screenshots/teamleiter/r3-R3-startseite/selbst/`.

- **A3 Seitenlänge mobil:** iPhone `/de` von 17 080 px auf **12 792 px** (Android 12 741, EN 11 561, FR 11 605, IT 11 584). Footer (3 413 px, fremdes Paket) unverändert. Kein Inhalt entfernt, alles bleibt im HTML.
  - Abschnittsabstand mobil 40 px statt 96 px (`Home/row.js` → `SECTION_Y`), ab `sm` das Token.
  - Scroll-Reihen mit sichtbarer Bedienung (`Home/ScrollRow.js`, kleine Client-Insel: Zurück/Weiter 44 px, Zähler „2 von 4“, `aria-controls`, an den Enden `aria-disabled`, bei reduzierter Bewegung ohne Smooth-Scroll) für Räume (3:2 mobil), Auswahl (quadratisch mobil), Leistungen und Neuigkeiten (Teaser 120 statt 160 Zeichen).
  - SEO-Text: mobil erster Absatz auf 4 Zeilen gekürzt, Rest per „Weiterlesen“ (`Home/MoreText.js`, `aria-expanded`); ab `sm` alles sichtbar. FAQ startet geschlossen (Antworten im HTML und im FAQPage-JSON-LD).
  - Regionslinks mobil zweispaltig ohne Pfeil und Teaser, Hero-Infozeile zweispaltig, Showroom-Foto unter `lg` 3:2.
- **LCP mobil:** Hero per `getImageProps` + `<picture>`: unter 640 px genau eine Quelle 750 w, q50 (9,4 KB AVIF statt 41,6 KB bei 1200 w/q75), ab 640 px die responsive Quelle q75. Zwei medienbezogene Preloads (`react-dom` `preload`), `fetchPriority="high"`, CLS 0.
- **Fallback:** `HOME_COPY` entfernt (alle 105 Schlüssel in allen 4 Sprachen per Skript belegt). Nur neue R3-Texte in `Home/pendingCopy.js` = `teamleiter/messages-r3-startseite.json`.
- **H1** „Italienisches Wohnen am Bodensee.“ unverändert.
- **A1** (Showroom-Foto): Im Dev liefern 640/750/828 sofort (0,08 bis 0,9 s). Im Produktions-Build ist es laut Integration bestätigt. **A2** (`hyphens-manual` in der H1) war schon umgesetzt.

### 8.1 Nachbesserung nach QA (Note 8/10)

Bericht: `Marktresearch/digital/teamleiter/r3-R3-startseite.md` (Abschnitt „Nachbesserung“), Aufnahmen `qa-screenshots/teamleiter/r3-R3-startseite/fix/`.

- **Höhenpuffer (P2-2):** Hauptinhalt `/de` iPhone von 9 321 auf 9 154 px. Gesamt 12 624 px nach der Cookie-Entscheidung, 12 777 px mit Cookie-Leiste (vorher 12 945). Dafür steht die lange SEO-H2 mobil in der Rolle `title` (Instrument, 22 px), etwas engere Abstände bei Showroom und Dreiländer-Service, Neuigkeiten-Teaser mobil auf 3 Zeilen (Text vollständig im HTML). Footer-Ticket an Team 1.
- **Hero (P3-1):** mobil `750 w 1x, 1080 w 2x`, q50 (16,2 KB AVIF auf Retina). Nie 1200/1920 auf dem Phone.
- **Reihen (P3-2/P3-3):** Die Knöpfe sagen die Position über eine `role="status"`-Region an („2 von 4“). Kommt eine Reihe in die Nähe des Bildschirms, laden ihre Bilder sofort und nicht mehr lazy.
