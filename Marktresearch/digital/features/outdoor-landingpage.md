# Feature: Landingpage /de/outdoor-gartenplanung

**Stand:** 26.10.2026 · Grundlage: `Marktresearch/30-geschaeftsfeld-outdoor-gartenplanung.md` (Abschnitt 3 Recht, 4.2 Saison, 6 Prozess, 8 Formulierungen)

## Umsetzung

- Route: `src/app/[locale]/outdoor-gartenplanung/page.js`. Nur `de`, `en`/`fr`/`it` liefern 404 (per curl geprüft). `robots: index, follow`, Canonical `https://platzhirsch.studio/de/outdoor-gartenplanung`.
- Layout: `src/components/Landing/Outdoor/OutdoorLanding.js`. Server-Komponente ohne Client-JS, eigene Bildsprache: Moosgrün, Kalkstein, Wasserblau, Abendlicht, dekorative Höhenlinien.
- Abschnitte: Hero, „Outdoor-Konzept aus einer Hand“, 7 Leistungen (jeweils mit der Angabe, wer ausführt), „Wir koordinieren Ihre Gewerke“ (Platzhirsch / Meisterbetriebe / befugter Baumeister), Saison-Zeitplan in 5 Schritten, Galerie, Marken, Pflege & Einlagerung, CTA „Gartenprojekt besprechen“ (Beratung und E-Mail), 7 FAQ.
- JSON-LD: WebPage, Service und FAQPage.
- Title: „Gartenplanung Vorarlberg & Outdoor-Planung am Bodensee | Platzhirsch Home Living“. Die Description enthält Terrassengestaltung, Outdoor-Planung, Gartenplanung durch Meisterbetriebe und Koordination.
- Marken (alle aus dem Sortiment, Markenseiten liefern 200): Minotti, Paola Lenti, Gloster, Solpuri, Tuuci, Umbrosa, Heatsail, Flos. Keine Händler-Aussage.
- Prüfung: `curl` liefert 200, `eslint` ohne Fehler.

## Wortwahl (nach Bericht 30, Abschnitt 8)

- **Bauleitung kommt nur als Leistung Dritter vor:** „Bauleitung, wo nötig, durch einen befugten Baumeister“. Dazu eine FAQ „Übernehmen Sie auch die Bauleitung? – Nicht selbst …“. Der Wunsch, die Bauleitung für die Subgewerke selbst zu übernehmen, ist **mit dem heutigen Handelsgewerbe nicht abgedeckt**: Planen, Leiten und Bauaufsicht gehören zum Baumeister (§ 99 Abs 1 Z 1, 2 und 5 GewO), Gartenplanung und Gartenbau zum Gärtner (§ 94 Z 24 GewO). Quelle: [RIS § 99 GewO](https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10007517&Paragraf=99), [RIS § 94 GewO](https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10007517&Paragraf=94). Die Texte erst ändern, wenn eine Gewerbeberechtigung (Modell B) oder ein Feststellungsbescheid nach § 348 GewO vorliegt.
- „Gartenplanung“ steht im Titel als Suchbegriff. Im Text wird sie immer dem Meisterbetrieb zugeordnet („Den Gartenplan erstellt ein Meisterbetrieb …“).
- Nicht verwendet: „Generalunternehmer“, „Gartenplaner“, „Landschaftsarchitektur“, „wir bauen Ihren Pool“, „Behördenwege übernehmen“ (in der FAQ ausdrücklich verneint), Preise, Referenzen, Kundenstimmen, „Nr. 1“.
- FAQ Bewilligung: „Pool, Stützmauer, offene Pergola in Vorarlberg in der Regel anzeigepflichtig“ nach § 19 lit e BauG ([RIS](https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=LrVbg&Gesetzesnummer=20000734&Paragraf=19)), Uferschutz nach § 24 GNL ([gesetzefinden](https://gesetzefinden.at/landesrecht/landesgesetze/lvb20000466/para-24)). Formuliert als „in der Regel“ und „im Einzelfall“.

> **Vor Veröffentlichung bzw. Indexierung:** Alle Texte von einer Anwältin oder einem Anwalt für Gewerbe- und Baurecht und von der WKO Vorarlberg (Gewerberecht) prüfen lassen. Die Seite ist laut Auftrag auf `index` gestellt. Falls die Prüfung noch aussteht, wird empfohlen, sie vorerst mit `index: false` in `landingMetadata` zu schalten.

## Offene Punkte

1. **Partner unter Vertrag?** Die Seite verspricht Meisterbetriebe aus dem Garten- und Landschaftsbau, einen befugten Baumeister, Elektriker und Installateure. Laut Bericht 30 (5.2) ist noch **kein Partner kontaktiert oder vertraglich gebunden**. Vor dem Go-live mindestens einen Landschaftsgärtnermeister und einen Baumeister unter Vertrag nehmen (Rahmenvertrag, BauKG-Koordinator beim Partner). Erst danach „unsere Partner-Meisterbetriebe“ schreiben, bis dahin bleibt es beim neutralen „Meisterbetriebe“.
2. **Pflege- und Einlagerungsservice:** Die Seite und eine FAQ bieten den Service an. Laut Bericht 30 (Schritt 10) ist er erst als Pilot mit Partnerlager geplant. Lager, Ablauf und Preise (Schätzung: Basic 690 €, Plus 1.490 €) festlegen oder den Text auf „auf Anfrage“ abschwächen.
3. **3D-Visualisierung:** Das Werkzeug ist noch offen (Empfehlung: SketchUp + Enscape). Vor dem Go-live klären, ob die Leistung schon erbracht werden kann.
4. **Outdoor-Küche:** Es wird bewusst kein Hersteller genannt. Ob die Binni-Steinlinie frostbeständig und für außen geeignet ist, ist nicht geprüft (Bericht 26/30). Nach der Prüfung kann Binni ergänzt werden.
5. **Flos Outdoor:** Die Aussage „darunter Modelle für den Außenbereich“ ist allgemein gehalten. Prüfen, welche Outdoor-Leuchten tatsächlich bezogen werden können.
6. **Lieferzeiten:** Die Seite sagt nur „oft mehrere Wochen“. Konkrete Wochen (Bericht 30: 8–16 Wochen) erst nach Bestätigung durch die Hersteller nennen.
7. **Nicht in `src/lib/content/landingPages.js` eingetragen** (gemeinsame Datei, nicht im Auftrag). Damit fehlen Sitemap, Footer- und Regionenlinks sowie die Behandlung im Sprachumschalter. Nachtragen mit `slug: "outdoor-gartenplanung"` und `lastModified: "2026-10-26"`, sobald die rechtliche Prüfung durch ist. Dasselbe gilt für `yacht-interior`.
8. **Interne Verlinkung:** Die Seite `/de/yacht-interior` verweist textlich auf „unsere Outdoor- und Gartenplanung“, verlinkt aber nicht. Optional einen Link ergänzen.
9. **Formular:** Der CTA führt auf `/de/beratung` und per Mail (Betreff „Gartenprojekt besprechen“). Ein eigener Outdoor-Fragebogen (Grundstück, Fotos, Zeitpunkt, Budget) nach Bericht 30 (Schritt 1) ist offen.
10. **Fallstudien:** Echte Projekte erst nach Umsetzung und mit schriftlicher Freigabe der Kunden zeigen.

## Bildwünsche

Vorhanden sind nur `public/Images/Outdoor/bannerImage1–5.jpg`: Terrassen und Lounges, eher mediterran mit Meerblick und Pinien. Alle fünf werden verwendet (Hero 3, Galerie 5/2/1, CTA 4). Einige davon nutzen auch `designermoebel-lindau` und `yacht-interior`. Bildrechte und Herkunft (Herstellerbilder?) prüfen.

| # | Motiv | Einsatz | Hinweis |
|---|---|---|---|
| 1 | Garten am Bodensee in der Abenddämmerung, Terrasse mit Lounge und Licht, See im Hintergrund | Hero (ersetzt bannerImage3) | Querformat ≥ 2400 px. Eigenes Shooting oder lizenziertes Bild, kein Fremdprojekt als eigene Referenz ausgeben |
| 2 | Terrasse aus Naturstein mit Esstisch, Bepflanzung in Gräsern | Leistung Terrassengestaltung, Galerie | – |
| 3 | Outdoor-Küche aus Stein bzw. Edelstahl mit Grill im Garten | Leistung Outdoor-Küche | Herstellerbild nur mit Nutzungsrecht |
| 4 | Großer Sonnenschirm (Tuuci oder Umbrosa) über Pool oder Lounge | Leistung Beschattung | Pressebilder der Hersteller anfragen |
| 5 | Garten bei Nacht mit Weg-, Pflanzen- und Tischlicht, Heatsail-Heizstrahler | Leistung Licht, CTA | – |
| 6 | Pflanzung bzw. Gartenplan auf dem Tisch, Moodboard mit Stoff- und Steinmustern | Konzept und Bemusterung | Im Showroom fotografieren |
| 7 | Outdoor-Fläche im Showroom Lochau | Abschnitt Showroom | Eigenes Foto |
| 8 | Polster und Schirme beim Einlagern bzw. Abdecken | Pflege & Einlagerung | Eigenes Foto, sobald der Service läuft |
| 9 | Echte Projektfotos | Fallstudien | Erst nach Freigabe |


## Stand Runde 3 (26.10.2026)

- Der Hero bleibt ohne Foto, bis eine eigene Seeterrasse fotografiert ist (`released: false` in `imagery.js`).
- #2: Pflege und Einlagerung stand bereits auf „auf Anfrage“.
- #8: Die Yacht-Seite verlinkt jetzt hierher.
- #3: 3D-Visualisierung ist offen (Inhaber). Die Seite bleibt noindex bis zur rechtlichen Prüfung.
