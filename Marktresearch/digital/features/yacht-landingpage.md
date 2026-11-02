# Feature: Landingpage Yacht Interior (/de/yacht-interior)

**Stand:** 26.10.2026 · Grundlage: [29-geschaeftsfeld-yacht-interior.md](../../29-geschaeftsfeld-yacht-interior.md)

## Umsetzung

| Datei | Inhalt |
|---|---|
| `src/app/[locale]/yacht-interior/page.js` | Texte, Metadaten, nur Locale `de` (andere Locales: 404, geprüft `/en/yacht-interior` → 404) |
| `src/components/Landing/Yacht/YachtLanding.js` | Eigenes Layout (Server Component, kein Client-JS): Nachtblau (Wasser), Teak-Braun, Segeltuch-Weiß, Wellenkanten, „Lichtlinien“ auf dem Wasser, Kurslinie als Ablauf |

- Metadaten über `landingMetadata` (wie alle Landingpages): Title „Yacht Interior Bodensee & Bootspolster | Platzhirsch Home Living“, Description mit „Boot Inneneinrichtung“ und „Bootspolster“, `robots: index, follow`, Canonical `https://platzhirsch.studio/de/yacht-interior`.
- H1 „Yacht Interior am Bodensee“. JSON-LD: WebPage + BreadcrumbList + Service (areaServed Bodensee … Mittelmeer) + FAQPage (7 Fragen).
- Abschnitte: Hero · Intro · Leistungen (Deck & Cockpit, Salon, Kabinen, Bootshaus & Seegrundstück) · Bildband · Ablauf (Besichtigung an Bord, Planung, Muster, Umsetzung mit Werft und Sattler, Winterlager-Refit Nov–Feb) · Materialien · Marken · Aufgabenteilung (wir / Werft) · Einzugsgebiet (Bodensee, Mittelmeer) · CTA „Termin an Bord oder im Showroom“ (Beratung, E-Mail mit Betreff, Telefon) · FAQ.
- Geprüft: `curl` → 200 (`/de/yacht-interior`), 404 (`/en/yacht-interior`); `eslint` auf beiden Dateien ohne Befund. Kein Build (Vorgabe).

## Marken: Belegt nur, was auf der Seite steht

Websuche war ausgeschöpft, Belege per WebFetch der Herstellerseiten (26.10.2026):

| Marke | Aussage auf der Seite | Beleg |
|---|---|---|
| Tuuci | Hersteller entwickelt Schirme auch für Marine- und Yachting-Umgebungen | tuuci.com: „outdoor commercial, hospitality, residential, marine and yachting environments“; Habitat Marine nennt „marine grade components“ (Ocean Master MAX/M1, Shade Blade, Max Solanox). https://www.tuuci.com/ · https://www.tuuci.com/habitats/marine/ – **keine** Angabe zur Bootsbefestigung |
| Paola Lenti | Outdoor-Möbel, eigene Outdoor-Stoffe, Projekte im Bereich Yachting | https://www.paolalenti.it/en (Menüs „Outdoor Fabrics“, Projekte „Yachting“, Monaco Yacht Show 2026) |
| Minotti | Outdoor-Kollektion | https://www.minotti.com/en/outdoor – keine Marine-Aussage, daher nur unter „Bootshaus, Steg & Seeterrasse“ |
| Gloster | Outdoor-Möbel, Teak als zentrales Material | https://www.gloster.com/ – keine Marine-Aussage |
| Umbrosa | Sonnenschirme und Sonnensegel aus Belgien | https://www.umbrosa.be/ – keine Marine-/Windangaben |
| Heatsail | Wärme für die Terrasse | https://www.heatsail.com/ – Seite nennt Terrasse, keine IP-/Marine-Angaben |
| Solpuri | langlebige Outdoor-Möbel | https://www.solpuri.com/ – keine Marine-Aussage |

Nicht aufgenommen: Flos, Poliform, Rimadesio (keine belegte Outdoor-/Marine-Eignung für Bordeinsatz). Materialtexte (Teak, lösungsgefärbte Acrylstoffe, offenporiger Schaum, Edelstahl/Aluminium) bewusst allgemein, ohne „salzwasserfest“, „marine-zertifiziert“ oder „schwer entflammbar“.

## Bildwünsche (fehlen in `public/Images`)

Aktuell nur Outdoor-Terrassenbilder (`/Images/Outdoor/bannerImage1–5.jpg`, mit Meerblick, aber ohne Boot). Benötigt, jeweils mit schriftlicher Freigabe von Eigner/Werft bzw. Bildrechten des Herstellers:

1. **Hero:** Motorboot oder Segelyacht am Bodensee in Abendlicht, Cockpit mit hellen Polstern (Querformat ≥ 2400 px).
2. **Deck & Cockpit:** Detail Teakdeck mit Sonnenpolster und Kissen.
3. **Salon:** Innenraum einer Kajüte mit Polstern, Textilien, Leuchte.
4. **Kabine:** Koje mit Bettwäsche und Kissen.
5. **Bootshaus/Steg:** Bootshaus oder Seeterrasse mit Lounge und Schirm (eigenes Projekt oder Herstellerbild Paola Lenti/Gloster/Tuuci).
6. **Tuuci Marine:** Herstellerbild eines Ocean-Master-Schirms auf einer Yacht (Bildrechte anfragen).
7. **Muster:** Musterkoffer mit Stoffen, Teak, Schaum, Beschlägen auf dem Showroom-Tisch.
8. **Winterlager:** Boot in der Halle während des Refits (nur mit Freigabe der Werft).
9. **Mittelmeer:** Yacht vor Anker in einer Adria-Bucht.

Keine erfundenen Projektbilder; Renderings nur mit Kennzeichnung.

## Offene Punkte

1. **Go-live-Bedingung:** Die Seite ist laut Vorgabe indexierbar. Laut Bericht 29 (Abschnitt 8) sollte sie aber erst öffentlich verlinkt/beworben werden, wenn **mindestens ein Sattler-Partner und eine Werft schriftlich zugesagt** haben – die Seite sagt „mit Bootssattlern und Werften aus der Region“. Bis dahin ggf. `index: false` in `landingMetadata` setzen.
2. **„Bauleitung“ (Wunsch des Inhabers):** Der Wunsch, die Bauleitung für Subgewerke im Garten- und Landschaftsbau zu übernehmen, ist auf der Seite als „Wir koordinieren die beteiligten Fachbetriebe“ formuliert. Das Wort „Bauleitung“ wurde bewusst weggelassen, bis per **GISA-Auszug und WKO Vorarlberg** geklärt ist, ob die Gewerbeberechtigung das deckt (Gärtner § 94 Z 24 GewO reglementiert; ergänzende Leistungen nach § 32 Abs. 1a GewO max. 30 % Jahresumsatz bzw. 15 % je Auftrag bei reglementierten Gewerben; Baumeister-Vorbehalte). Quelle: https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10007517&Paragraf=32 – **keine Rechtsberatung, Prüfung durch WKO/Anwalt.** Nach Freigabe: Leistungstext „Bootshaus & Seegrundstück“ und FAQ 6 in `page.js` anpassen.
3. **Eigene Seite Outdoor- und Gartenplanung:** Der Inhaber-Wunsch (Outdoorplanung, Möbel mit Gartenplanung, Koordination Gartenbau) verdient eine eigene Landingpage (z. B. `/de/outdoor-gartenplanung-bodensee`); die Yacht-Seite verweist bisher nur im Text darauf. Danach von der Yacht-Seite verlinken.
4. **Registrierung in `src/lib/content/landingPages.js`** (nicht meine Datei, nicht geändert): Ohne Eintrag fehlt die Seite in Sitemap, Footer und Regions-Block, und der Sprachumschalter führt auf `/en/yacht-interior` (404). Eintrag z. B. `{ slug: "yacht-interior", label: "Yacht Interior Bodensee", teaser: "Deck, Salon, Kabinen und Bootshaus gestalten.", lastModified: "2026-10-26" }` – vorher klären, ob die Seite im Footer der Regionen erscheinen soll.
5. **Hersteller schriftlich anfragen:** Tuuci (Bootsbefestigung, Vertrieb AT/CH, Europa-Lieferung der Marine-Modelle), Paola Lenti (Freigabe an Bord, Datenblätter), Minotti/Gloster (Bordeinsatz, Gewährleistung bei Salz/UV). Erst danach Formulierungen ggf. schärfen.
6. **Datenblätter Entflammbarkeit/Gewicht** für Stoffe und Schaum (EN ISO 9094:2022, ISO 12952 / EN 1021) vor dem ersten Angebot einholen; Text verspricht „Angaben zu Gewicht, Pflege und Materialeigenschaften mit dem Angebot“.
7. **Betriebshaftpflicht** um Tätigkeits- und Obhutsschäden an Booten erweitern (Makler), bevor Termine an Bord stattfinden.
8. **Mittelmeer:** Lieferung/Montage vor Ort ist bewusst offen formuliert („klären wir individuell“); Logistikpartner und Steuer/Rechnung bei Lieferung nach HR/IT klären.
9. **Beratungsformular:** CTA führt auf `/de/beratung`; dort gibt es (noch) kein Thema „Boot/Yacht“. Optional Vorauswahl per Query-Parameter ergänzen (Datei des Beratungs-Agenten).
10. **Echte Referenzen:** Erst nach Pilotprojekten im Winterlager 2026/27 und mit schriftlicher Freigabe der Eigner eine Referenz-Sektion ergänzen.


## Stand Runde 3 (26.10.2026)

- Der Hero bleibt ohne Foto, bis ein eigenes, freigegebenes Bootsbild vorliegt (`released: false` in `imagery.js`).
- #3/#8 erledigt: Die Leistung „Bootshaus & Seegrundstück“ verlinkt `/de/outdoor-gartenplanung`.
- #1 teilweise erledigt: Der sichtbare Text behauptet keine bestehenden Partner mehr. Die schriftliche Zusage von Sattler und Werft fehlt weiter. JSON-LD und `extraPages.js` enthalten noch „mit Bootssattlern und Werften aus der Region“.
