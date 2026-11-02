# Prototyp „Dreiländereck“: Design-Richtung für den Neuauftritt

**Stand:** 26.10.2026 · Klickbarer Prototyp im laufenden Next.js-16-Projekt, nicht indexiert (`robots: noindex, nofollow`), nur Locale `de` (en/fr/it → 404).

| Screen | URL (lokal) |
|---|---|
| Startseite | http://localhost:3000/de/preview/dreilaendereck |
| Markenseite Minotti | http://localhost:3000/de/preview/dreilaendereck/marken/minotti |
| Produktseite (Minotti Lawrence, Live-Daten) | http://localhost:3000/de/preview/dreilaendereck/produkt/sofas-lawrence |
| Logo, Farben, Schrift | http://localhost:3000/de/preview/dreilaendereck/logo |

Die Produktroute funktioniert für **jedes aktive Minotti-Produkt** (`/produkt/<path_field>`, z. B. `sofas-andersen`). Andere Marken und unbekannte Slugs liefern 404.

---

## 1. Designidee

**„Gastgeber am See“.** Platzhirsch tritt nicht als Möbelportal auf, sondern als Haus, in das man eingeladen wird: Ausstellung, Café, Abende, Küche als Treffpunkt. Die Marken dienen als Beleg für Qualität und stehen nicht im Vordergrund. Die Lage im Dreiländereck wird ein eigenes Thema mit Karte und Fahrzeiten, statt nur in einer Adresszeile zu stehen.

Referenzen und was übernommen wurde:
- **Soho Home:** warme Papiertöne, Antiqua mit Charakter, Kursiv für den zweiten Gedanken einer Überschrift.
- **Conran Shop:** typografische Markenliste statt Logo-Raster, ruhige Raster, Haarlinien.
- **Ett Hem:** Wohnzimmer-Gefühl, Einladungen und Abende als Teil der Marke, persönliche Ansprache.

Leitplanken aus Bauplan 01/02 sind eingehalten: Pro Bildschirm ein Gedanke, nur eine dunkle Fläche pro Seite (die „Abende“), eckige Formen, Haarlinien statt Schatten, Sie-Form, keine Superlative, keine Händler-Behauptung.

## 2. Logo- und Wortmarken-Konzept „Vier Enden“

Inline-SVG in `src/components/Preview/dreilaendereck/Logo.js` (`Logo` inline/stacked, `LogoMark`):
- **Bildmarke:** Eine halbe Abendsonne steht auf dem Horizont. Darunter liegen zwei kürzer werdende Wellenlinien (der Bodensee), darüber ein Geweih mit genau **vier Enden**, je eines für Österreich, Deutschland, die Schweiz und Liechtenstein. Linienzeichnung mit runden Enden, Farbe über `currentColor`.
- **Wortmarke:** „Platzhirsch“ in Fraunces (SOFT 100), darunter „HOME LIVING · LOCHAU“ in Instrument Sans, gesperrt.
- Varianten auf der Logo-Seite: quer (Header, E-Mail), gestapelt (Footer, Einladung), Bildmarke allein (Favicon, Stempel, Tasse im Café).
- Offen: Die Wortmarke ist heute als SVG-`<text>` gesetzt und hängt deshalb von der Webschrift ab. Für die Reinzeichnung muss sie in Pfade umgewandelt und gekernt werden, außerdem fehlt ein Test der Mindestgröße für das Favicon (16 px).

## 3. Farben („Bodensee-Licht“)

| Name | Token | Hex | Rolle | Kontrast |
|---|---|---|---|---|
| Kalk | `--dl-paper` | `#f7f2ea` | Seitenhintergrund | – |
| Leinen | `--dl-linen` | `#efe7da` | ruhige Bänder | – |
| Sand | `--dl-sand` | `#e4d8c5` | Termin-Band, Platzhalter | – |
| Ton | `--dl-clay` | `#cdb89b` | Linien, Illustration | – |
| See | `--dl-lake` | `#36596a` | Fokusring, Links, Karte | 6,74 : 1 auf Kalk |
| Ziegel | `--dl-brick` | `#a0502e` | einziger gefüllter Button | 5,70 : 1 mit Weiß |
| Tinte | `--dl-ink` | `#2a2622` | Text | 13,47 : 1 auf Kalk |
| Tinte weich | `--dl-ink-soft` | `#5f564c` | Sekundärtext | 6,45 / 5,86 / 5,11 : 1 auf Kalk / Leinen / Sand |
| Espresso | `--dl-espresso` | `#2b2420` | eine dunkle Fläche: Abende | Sekundärtext `#cdbfae` 8,47 : 1 |

Alle Werte wurden nach WCAG 2.x berechnet. Jede Text-/Hintergrund-Kombination liegt über 4,5 : 1.

## 4. Typografie

- **Display:** **Fraunces** (OFL 1.1, variabel, Achsen `SOFT` und `opsz`) mit Gewicht ca. 380 und weichen Serifen. Kursiv dient für den zweiten Gedanken einer Überschrift („Ein Haus zum Wohnen, *mitten im Dreiländereck.*“). Gegenüber Bodoni wirkt sie wärmer und gastlicher, und sie bricht auch in kleineren Größen nicht weg.
- **Text/UI:** **Instrument Sans** (OFL 1.1, variabel), wie in Bauplan 01 empfohlen. Fließtext 17 px, Zeilenhöhe 1,6.
- Versalien stehen nur in Overlines (12 px, 0,16 em). Für Zeiten, Maße und Fahrzeiten gilt `tabular-nums`.
- Beide Schriften kommen über `next/font/google` (selbst gehostet, `display: swap`) und werden **nur im Prototyp** geladen (`fonts.js`), global ändert sich nichts.

## 5. Animationen (nach Bauplan 02)

| Effekt | Technik | JS | Reduced Motion |
|---|---|---|---|
| Hero-Text gleitet beim Laden 28 px hoch (gestaffelt 0–240 ms, 800 ms, `cubic-bezier(.22,1,.36,1)`) | CSS-Keyframes, nur `transform` | 0 kB | aus |
| Abschnitts-Reveals (`.reveal`) | `animation-timeline: view()` in `@supports`, nur `transform`, nie `opacity: 0` | 0 kB | aus; ohne Browser-Support statisch sichtbar |
| Bild-Masken (`.mask`): `clip-path` 14 % → 0 plus Bild-Scale 1,06 → 1 | Scroll-Timeline | 0 kB | aus |
| Fahrrouten zeichnen sich auf der Karte | `stroke-dashoffset` über Scroll-Timeline, `pathLength=1` | 0 kB | Routen sofort sichtbar |
| Hover/Fokus Stadt → Route hervorgehoben (Karte **und** Liste) | `:has()` mit generiertem `<style>` | 0 kB | nur Farbe/Deckkraft |
| Markenliste: Hover/Fokus zeigt Markenbild rechts | `:has()` + `display:none → block` (Bild lazy, lädt erst bei Bedarf) | 0 kB | ohne Versatz |
| Raumkacheln/Produktkarten: Zoom 1,03–1,04 | `transition` auf `transform` | 0 kB | aus |
| Produktgalerie | Embla 8.6 (Client-Insel), Pfeile, Thumbnails, Zähler mit `aria-live` | einzige JS-Insel | Embla `duration: 0` |

Das LCP-Bild (Hero) wird nie animiert und mit `preload` geladen (das in Next 16 neue Prop statt `priority`). Lenis bleibt bewusst ungenutzt, wie in Bauplan 02 begründet. `motion` wird ebenfalls nicht gebraucht.

## 6. Screens und Inhalt

**Startseite:** (1) Hero, geteilt: Text links, Ausstellungsfoto rechts mit warmem „Abendlicht“-Verlauf, darunter eine Infozeile mit Öffnungszeiten, Adresse und Telefon. (2) „Wir sind Gastgeber, bevor wir Einrichter sind“ mit vier Versprechen. (3) Räume: Wohnen, Küche, Outdoor (auf dem Handy wischbar per CSS-Scroll-Snap). (4) Küche als Treffpunkt. (5) Markenwelt: typografische Liste mit 12 Marken, Herkunft und Gründungsjahr live aus dem Marken-Doctype, Hover-Bild. (6) Showroom & Café: Fakten, Öffnungszeiten, ehrliche Foto-Platzhalter. (7) Abende im Haus: Rückblick auf die Vernissage Kaja El Attar am 04.09.2026 (echt) und zwei klar markierte Beispielformate mit „Termin folgt“. (8) Dreiländer-Service: SVG-Karte mit echten Koordinaten, 8 Städte mit Fahrzeiten, 4 Länderkarten. (9) Termin-CTA mit 4 Schritten. (10) Eigener Footer.

**Markenseite Minotti:** Vollbild-Hero (Markenbild aus dem Backoffice), eine Faktenzeile (Herkunft, Gründung, Gründer und Produktanzahl im Katalog, alles live), eigener Story-Text, das CMS-Feld `desing_approach_de` als Zitat, Kategorien-Chips mit echten Zählern, 8 kuratierte Sofas, die auf die Prototyp-Produktseiten verlinken, ein Showroom-CTA mit Platzhalter für eigene Fotos, FAQ (`<details>`) und ein rechtlicher Hinweis „zeigt und plant mit Möbeln von Minotti“.

**Produktseite Lawrence:** Embla-Galerie (12 von 20 Bildern) mit Thumbnails und eine Spalte rechts, die beim Scrollen stehen bleibt (sticky). Sie enthält Marke und Kategorie, H1, Preis „auf Anfrage“, „Ausstellung bitte vorab anfragen“, Lieferung AT/DE/CH/FL nach Absprache, eine Beratungs-CTA, einen Merklisten-Link zur heutigen Produktseite und eine Ansprechpartner-Box. Darunter folgen Beschreibung und Ausführungen (CMS-HTML, mit dem vorhandenen `sanitizeCmsHtml` bereinigt), Lieferung in vier Länder, ein Quellenhinweis und „Mehr von Minotti“ (`fetchRelatedProdukteNew`).

## 7. Technik und Bibliotheken

- Dateien: `src/app/[locale]/preview/dreilaendereck/{layout,page}.js`, `marken/minotti/page.js`, `produkt/[slug]/page.js`, `logo/page.js` sowie `src/components/Preview/dreilaendereck/{Shell,Logo,DreilaenderMap,Gallery,content,data,fonts}.js` und `dl.module.css`.
- **Nur Server Components**, außer `Gallery.js` (Client, Embla). Das mobile Menü ist ein natives `<details>`.
- Daten kommen nur lesend über vorhandene Funktionen: `fetchRawMarkenData`, `fetchProdukteNewByMarke`, `fetchProduktNewByPathField`, `fetchRelatedProdukteNew` und `toShopProductDetail`. Fehler werden abgefangen.
- Bibliotheken: `embla-carousel-react` 8.6.0 (Galerie), `lucide-react` (Icons), `next/image` (AVIF/WebP, `sizes`, lazy), `next/font` (Fraunces, Instrument Sans). **Nicht** verwendet werden motion, lenis und react-icons.
- Die Seitenhülle der heutigen Website (Navbar, Footer, mobile CTA-Leiste) wird auf Preview-Seiten per CSS ausgeblendet (`body:has(.root) > header|footer|div.fixed.bottom-0.grid`). Der Cookie-Hinweis bleibt. `globals.css` und bestehende Komponenten bleiben unverändert.
- Barrierefreiheit: Skip-Link, Landmarken und `aria-labelledby` je Sektion, Alt-Texte, die nichts behaupten, was das Bild nicht zeigt, und ein sichtbarer Fokusring (See-Blau). Alle Interaktionen funktionieren mit Tastatur (Karte: SVG-Links). Die Karte hat `title`/`desc`, Platzhalter tragen `role="img"` mit Label. ESLint meldet für alle Prototyp-Dateien keine Fehler.

## 8. Performance-Messung (curl gegen den Dev-Server, 26.10.2026)

| Seite | HTML roh | HTML gzip | CSS gzip | JS gzip (alle Chunks, **Dev-Build**) | `<img>` im HTML |
|---|---|---|---|---|---|
| Startseite | 266,9 kB | 54,9 kB | 26,6 kB | 1.546,6 kB | 27 |
| Minotti | 197,3 kB | 43,9 kB | 26,6 kB | 1.546,6 kB | 18 |
| Lawrence | 224,5 kB | 47,9 kB | 26,6 kB | 1.564,2 kB | 35 |
| Logo | 169,3 kB | 40,1 kB | 26,6 kB | 1.546,7 kB | 7 |

Einordnung:
- Die JS-Werte gelten für den **Dev-Modus** (unminifiziert, mit React-DevTools- und HMR-Code). Sie taugen nur für den Vergleich der Seiten untereinander. Der Prototyp selbst fügt auf Start-, Marken- und Logo-Seite **0 kB** JS hinzu. Nur die Produktseite bringt die Galerie mit, im Dev-Modus +17,6 kB, in Produktion laut Bauplan 02 ca. 7 kB gzip für Embla. Damit liegt sie im Budget von ≤ 10 kB Motion-JS.
- Der große Grundsockel kommt aus der Seitenhülle der heutigen Website (Navbar, Cookie, Warenkorb-Context), die auch ausgeblendet weiterhin geladen wird. Im echten Neuauftritt fällt sie weg.
- Ein großer Teil des HTML sind RSC-Payloads (Dev). Echte Lighthouse-/CWV-Werte lassen sich erst nach `next build` messen, und den durften wir hier nicht starten.
- Bilder: Alle laufen über `next/image` mit `sizes`. Nur das Hero-Bild hat `preload`, der Rest ist lazy. Die Vorschaubilder der Markenliste werden erst bei Hover geladen.

## 9. Offene Punkte

1. **Eigene Fotos fehlen:** Café, Team/Ansprechpartner und Minotti-Stücke in der Ausstellung sind ehrlich als „Foto folgt“ markiert. Bei Hero und Showroom (`Home/aboutHome.jpg`, `secondAboutHome.jpg`) ist zu prüfen, ob es wirklich Aufnahmen aus Lochau sind. Die Bildunterschrift lautet deshalb neutral „Blick in die Ausstellung“.
2. **Bildrechte:** Raum-, Küchen- und Outdoorbilder aus `public/Images` sowie die Produktbilder (`/cmx`) sind Herstellermaterial, zum Teil mit Wasserzeichen („Copyright Minotti SpA“). Vor einer Veröffentlichung braucht es eine Freigabe je Bild.
3. **Fahrzeiten sind Richtwerte:** Lindau, Dornbirn und Schaan stammen aus Marktresearch 19/23, St. Gallen, Ravensburg und Kempten aus den heutigen Regionsseiten. Friedrichshafen und Bregenz sind Schätzungen. Vor dem Livegang alle mit einem Routenplaner prüfen.
4. **Café:** Öffnungszeiten, Angebot und Name des Cafés sind nicht belegt und werden deshalb nicht genannt.
5. **Abende:** „Ein Abend in der Küche“ und „Langer Donnerstag“ sind als *Beispielformat · Termin folgt* gekennzeichnet. Echte Termine liefert der Inhaber.
6. **Dreiländer-Service:** Der Text sagt nur zu, was heute gilt (AT: Lieferung und Montage; DE/CH/FL: individuell klären). Festpreis in EUR/CHF und abgesicherte Anzahlung aus dem Masterkonzept kommen erst, wenn der Service steht.
7. **Fund im Backoffice (wichtig):** Das Marken-Feld `dealers_description_de` für Minotti enthält „Platzhirsch Studio ist Ihr **offizieller Minotti Händler** in Vorarlberg“. Die **heutige Live-Seite** `/de/ueber-uns/marken/minotti` zeigt diesen Satz an (`src/components/MarkenItems/markenitems.js:116`). Das verstößt gegen die Regel „keine Händler-Behauptung“. Der Prototyp nutzt das Feld bewusst nicht. Der Text im Backoffice sollte korrigiert werden.
8. **Produktdaten:** `designer` ist bei Lawrence leer (bleibt ausgeblendet), Preis, Ausstellungsstatus und Lieferzeit gibt es nicht als Backoffice-Felder. Das Layout hält die Zeilen bereit.
9. **Logo:** Wortmarke in Pfade umwandeln, Favicon-Test, Varianten einfarbig und für Prägung.
10. **Seitenhülle:** Das Ausblenden der alten Navbar und des alten Footers per CSS ist nur eine Lösung für den Prototyp. Im Neuauftritt gehören Header und Footer aus `Shell.js` in `client-layout.js`.
