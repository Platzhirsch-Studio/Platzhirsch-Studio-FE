# Pinterest-Kanal Platzhirsch Home Living – Konzept und Startpaket

**Stand:** 29.10.2026 · **Team:** Pinterest-Stratege DACH, Art Director, Social-Texter · **Status:** Entwurf zur Freigabe durch den Inhaber (Entscheidung Nr. 14). **Nichts ist veröffentlicht.**
**Vorschau:** `/de/preview/pinterest` (nur Dev bzw. `FREIGABE_PREVIEW=1`, noindex) · **Daten:** `src/components/Preview/pinterest/data.js` (Boards, Pins, Plan, Checkliste: eine Quelle für Seite, Vorlage und Render-Skript) · **Pins:** `public/preview/pinterest/*.webp`

Verbindlich: Design-Bibel (`../../expertenrat/00-design-bibel.md`), Kern-USP (`../../features/usp-handzeichnung-designprozess.md`), Inhaber-Entscheidungen Nr. 7, 8, 11–14.

---

## 1. Ziele

| # | Ziel | Messbar als (nach 12 Wochen, Startannahme) |
|---|---|---|
| Z1 | **Inspiration in Termine verwandeln.** Pinterest-Nutzer planen lange voraus, deshalb holen wir sie in der Phase ab, in der Raum, Küche oder Pool noch eine Idee sind | Termin-/Beratungsanfragen mit Antwort „Pinterest“ auf die Frage „Wie haben Sie uns gefunden?“ |
| Z2 | **Verkehr auf die eigene Seite.** Jeder Pin verlinkt auf eine passende Seite (Ezarri-Welt, Arbeitsweise, Region, Hotel & Objekt) | ausgehende Klicks (Pinterest Analytics) |
| Z3 | **Den Kern-USP sichtbar machen:** „Von der Skizze zum Raum“ ist das Format, das kein Katalog-Händler zeigen kann | Saves und Klicks der Serie im Vergleich zu Standard-Pins |
| Z4 | **Ezarri als Vertragshändler regional verankern** (Pool & Spa am Bodensee, Arlberg, Ostschweiz) | Klicks auf `/de/ezarri/*`, Muster-/Konfigurator-Anfragen |
| Z5 | **Brücke zum Ideenboard der Website:** Pinterest-Nutzer sammeln bei uns weiter und hängen das Board an den Online-Termin | Ideenboards, die aus einem Pinterest-Klick entstehen (nur aggregiert, ohne Tracking: Quelle `?utm_source=pinterest` im Pin-Link, Auswertung nur mit Statistik-Einwilligung) |

Keine Zielzahlen für Follower. Follower sind auf Pinterest nachrangig, die Suche verteilt die Pins.

## 2. Zielgruppen

| Gruppe | Region | Anlass | Board-Einstieg | Ton |
|---|---|---|---|---|
| **Eigentümer am See** (Haus, Wohnung, Umbau) | Bregenz, Lochau, Lindau, Friedrichshafen, Konstanz | Neubau/Umbau, Wohnzimmer, Küche | Wohnen am Bodensee, Küche, Outdoor am See | Sie-Form, ruhig, konkret |
| **Vorarlberg/Rheintal** | Dornbirn, Feldkirch, Rheintal, Liechtenstein | Küche, Gesamtplanung, Bad | Küche, Pool & Spa, Skizze → Raum | Sachlich, Handwerk betonen |
| **Ostschweiz** | St. Gallen, Appenzell, Thurgau | Pool, Bad, Designermöbel ohne Umweg | Pool & Spa mit Ezarri, Wohnen am Bodensee | Preise in CHF nur auf Anfrage, Schweiz-Hinweise auf der Zielseite |
| **Arlberg & Ferienimmobilien** | Lech, Zürs, St. Anton, Montafon | Chalet, Ferienwohnung, Wellness | Chalet Arlberg, Hotel & Objekt | Saisonbezug (Nov/Dez, Apr) |
| **Hotel, Gastro, Bauträger** | DACH-Bodenseeraum | Spa, Lobby, Bar, Home-Staging | Hotel & Objekt, Pool & Spa | Fachlich, Ablauf und Gewerke |
| **Yacht** | Bodensee, international | Innenausbau Boot | Yacht-Interior | erst mit eigenen Fotos aktiv |

Sprache: Hauptkonto Deutsch. Board-Titel deutsch, englische Fassung in der Board-Beschreibung (zweiter Satz) und in der Vorschau – damit Lindau/Konstanz/St. Gallen und internationale Ferienhaus-Käufer gleichermaßen finden. Kein eigenes englisches Konto zum Start.

## 3. Keyword-Recherche (Quellen)

**Methode:** Pinterest ist eine visuelle Suchmaschine; Board-Titel, Board-Beschreibung, Pin-Titel, Pin-Beschreibung und Alt-Text werden für die Suche gelesen. Trends gelten bei Pinterest als Begriffe, deren Suchanfragen über ein halbes Jahr kontinuierlich steigen (Textilwirtschaft). Die Nutzerzahl für Deutschland liegt laut W&V bei rund 19 Mio. monatlich; Pinterest meldete im Q3 2025 weltweit 600 Mio. MAU, davon 150 Mio. in Europa (retail-news.de). Länderzahlen für Österreich und die Schweiz waren nicht öffentlich auffindbar.

**Trendsignale 2026 (Pinterest Predicts):** Abkehr vom neutralen Minimalismus hin zu ausdrucksstärkeren Räumen; „Extra Celestial“ (schimmernde, opalisierende Oberflächen) passt direkt zu Ezarri Iridescent/Iris; „Neo Deco“ (Chrom, Messing) zu Ezarri Gold/Metal. Galaxus ordnet „Neo Deco“ einem Hersteller zu, nicht Pinterest – deshalb nur als Stimmung nutzen, nicht als „Pinterest-Trend“ zitieren.

**Keyword-Hypothesen je Board** (vor dem Start in `trends.pinterest.com`, Region Deutschland/Österreich, nach Login prüfen; die Trends-Seite ist ohne Konto nicht abrufbar):

| Board | Deutsch | Englisch |
|---|---|---|
| Wohnen am Bodensee | Wohnzimmer Ideen modern, Einrichtung Bodensee, Sofa hell, Wohnzimmer gemütlich | living room ideas, lake house interior |
| Chalet Arlberg | Chalet Einrichtung, Chalet Stil modern, Alpenchic, Wellness zuhause | alpine chalet interior, modern chalet |
| Pool & Spa mit Ezarri | Pool Mosaik, Glasmosaik Pool, Hamam zuhause, Dampfbad, Bad Mosaik | pool mosaic tiles, home spa, steam room design |
| Küche | Küche mit Kochinsel, Küchenrückwand Ideen, Küche modern grifflos | kitchen island, kitchen backsplash ideas |
| Outdoor am See | Terrasse gestalten, Outdoor Lounge, Garten mit Pool | outdoor lounge, lakeside terrace |
| Yacht-Interior | Yacht Interior, Boot Einrichtung | yacht interior design |
| Hotel & Objekt | Hotel Interior, Hotel Spa, Ferienwohnung einrichten, Bar Design | hotel interior design, boutique hotel spa |
| Von der Skizze zum Raum | Raumplanung Skizze, Einrichtungsplanung, Interior Design Prozess, Handzeichnung Interior | interior design sketch, interior design process |

Ortsnamen (Bodensee, Vorarlberg, Arlberg, Lochau, St. Gallen) gehören in die Beschreibung, nicht in jeden Titel – Pinterest-Suchen sind meist ortlos, Ortsbezug hilft beim Klick auf die Regionsseite.

**Quellen (abgerufen 29.10.2026):**
- Pinterest Hilfe, Website beanspruchen (HTML-Tag, HTML-Datei, DNS-TXT; Profilbild bei Pins von der Seite, Statistik): https://help.pinterest.com/en/business/article/claim-your-website
- Pinterest Developers, Rich Pins (Open Graph/Schema.org, Vorrang Produkt vor Artikel, Opt-out-Tag): https://developers.pinterest.com/docs/rich-pins/overview/
- Yoast, Rich Pins und Verifizierungs-Tag: https://yoast.com/help/how-to-get-pinterest-rich-pins/
- Pinterest Create-Blog DE, Predicts 2026: https://create.pinterest.com/de/blog/2026-pinterest-predicts-trends-and-content-ideas/
- Pinterest Newsroom DE, Frühlings-Trendreport 2026: https://newsroom.pinterest.com/de/news/spring-trend-report-2026/
- W&V, Pinterest Trends 2026 (19 Mio. Nutzer DE): https://www.wuv.de/themen/media/nostalgie-kohlsuppe-und-chaos-chic-das-sind-die-pinterest-trends-2026
- Stylist, Pinterest Predicts Interiors 2026: https://www.stylist.co.uk/home/pinterest-predicts-interiors-trends-2026/1044089
- retail-news.de, Pinterest Q3 2025: https://retail-news.de/pinterest-q3-2025-rekordzahlen/
- Textilwirtschaft, Interior-Trends auf Pinterest (Trend-Definition): https://www.textilwirtschaft.de/fashion-management/wohntrends-die-top-interior-trends-auf-pinterest-156328
- Linearity, Pinterest-Formate 2026 (2:3, 1000 × 1500; Idea Pins seit 2023 im Standard-Pin aufgegangen): https://www.linearity.io/templates/pinterest-size-guide
- Galaxus, Wohntrends 2026 (Herkunft „Neo Deco“): https://www.galaxus.at/de/page/zirkus-fuer-dein-zuhause-manege-frei-fuer-die-wohntrends-2026-40838

## 4. Board-Struktur (Titel und Beschreibung, SEO)

Reihenfolge im Profil = Reihenfolge unten. Boards ohne freigegebene Bilder (Yacht, zunächst Skizze → Raum) bleiben **geheim**, bis der erste echte Pin drin ist – keine leeren Boards im Profil.

| # | Titel DE | Titel EN | Beschreibung DE (≤ 500 Zeichen) | Ziel-Seite |
|---|---|---|---|---|
| 1 | Wohnen am Bodensee | Living at Lake Constance | Wohnzimmer, Esszimmer und Schlafzimmer am Bodensee: Einrichtungsideen aus unserem Studio in Lochau, zwischen Bregenz und Lindau. Sofas, Licht und Materialien, geplant für Räume mit Seelicht. | `/de/moebel-bodensee` |
| 2 | Chalet Arlberg | Alpine Chalet Interiors · Arlberg | Chalet einrichten am Arlberg, in Lech, Zürs und St. Anton: Holz, Stein und warme Stoffe, Wellness im Haus, Ideen für Ferienwohnung und Hauptwohnsitz. | `/de/designermoebel-arlberg` |
| 3 | Pool & Spa mit Ezarri | Pool & Spa · Ezarri Glass Mosaic | Pool, Hamam, Dampfbad und Bad mit Glasmosaik von Ezarri. Farben, Muster und eigene Mischungen, geplant von Platzhirsch in Lochau am Bodensee, Muster im Showroom. | `/de/ezarri/pool` |
| 4 | Küche | Kitchen Design | Küchenplanung in Vorarlberg und am Bodensee: Kochinsel, Rückwand, Materialien und Licht. Von der Handzeichnung bis zur fertigen Küche. | `/de/kuechen-vorarlberg` |
| 5 | Outdoor am See | Lakeside Outdoor Living | Terrasse, Garten und Lounge am Wasser: Outdoor-Möbel, Schatten und Pool, geplant für das Klima am Bodensee. Winterlager und Pflege auf Anfrage. | `/de/outdoor-gartenplanung` |
| 6 | Yacht-Interior | Yacht Interior | Einrichtung für Yacht und Boot: Stoffe, Leuchten und Möbel für wenig Platz und viel Bewegung. Eigene Projekte folgen. | `/de/yacht-interior` |
| 7 | Hotel & Objekt | Hotel & Hospitality Interiors | Einrichtung für Hotel, Gastronomie, Chalet-Vermietung und Verkaufsräume: Lobby, Spa, Bar und Zimmer, mit Planung, auf Wunsch mit Lieferung und Montage. | `/de/hotel-objekt` |
| 8 | Von der Skizze zum Raum | From Sketch to Room | So entsteht ein Raum bei Platzhirsch: Harald Menghin zeichnet von Hand, baut ein Modell, danach folgen 3D-Planung, fotorealistisches Rendering und die Umsetzung. | `/de/arbeitsweise` |

Englische Kurzbeschreibungen stehen in `data.js` (`beschreibungEn`) und werden als zweiter Absatz angehängt. „Ezarri-Vertragshändler“ ist laut Entscheidung Nr. 7 erlaubt; auf Pinterest nur mit dem Wortlaut aus `src/lib/legal/claims.js` („Platzhirsch Home Living ist Vertragshändler von Ezarri.“), im Code nie frei formuliert (ESLint-Regel). Andere Marken werden nie als „offiziell vertreten“ bezeichnet.

**Board-Cover:** eigener Pin des Boards (kein Herstellerbild). Yacht und Skizze → Raum: Platzhalter bis zum echten Material; im Profil geheim.

## 5. Pin-Formate

| Format | Maß | Einsatz | Hinweis |
|---|---|---|---|
| **Standard-Pin** | 2:3, **1000 × 1500 px** | Hauptformat, alle Boards | länger als 1:2,1 wird im Feed abgeschnitten |
| **Karussell** | 2–5 Bilder, je 2:3 | Serie Skizze → Raum, Ezarri-Farbreihen | gleiche Perspektive, gleiche Typo |
| **Video-Pin** | 2:3 (1000 × 1500) oder 9:16 (1080 × 1920), 6–15 s | Serie, Material-Clips aus Shotliste Tag 3 | ohne Ton verständlich, erste 2 s zeigen den Raum |
| ~~Idea Pin~~ | – | – | **Gibt es seit 2023 nicht mehr als eigenes Format**, ist im Standard-Pin (mehrseitig/Video) aufgegangen. Wir planen deshalb Karussell und Video statt „Idea Pins“ |

**Gestaltung (Art Director, nach Design-Bibel):**
- Zwei Vorlagen: **„Band“** (Bild oben, Papierband `paper` unten mit Overline in `brass-700`, Titel in Bodoni 68 px, Fußzeile Monogramm + Wortmarke + „Bild: Quelle“) und **„Voll“** (Vollbild, Text auf `ink-deep`-Verlauf 0 → 82 %, Overline in `brass-400` – Messing nur auf Dunkel). Text nie direkt auf dem Bild (§4.5).
- Bodoni nur ab 32 px (Titel), alles Kleinere Instrument Sans; Versalien nur in der Overline (§5). Keine Rahmen, keine Radien, kein Schatten, kein Glanz.
- Titel ≤ 40 Zeichen, Sie-Form oder Nominalstil, kein Ausrufezeichen, keine Superlative („Luxus“, „exklusiv“, „Traum“, „beste“ verboten, §1).
- Quellenangabe auf jedem Pin („Bild: Ezarri“, „Bild: Platzhirsch“, bei Harald „Zeichnung: Harald Menghin“).
- Visualisierungen tragen auf dem Pin das Wort „Visualisierung“.

**Pin-Text (Social-Texter):** Pin-Titel = Titel auf dem Bild (bis 100 Zeichen, Suchbegriff vorn). Beschreibung 1–3 Sätze: Was zu sehen ist (Material, Kollektion), wofür es passt, wo man es sieht („im Showroom Lochau“). Alt-Text beschreibt das Bild sachlich. Link mit `?utm_source=pinterest&utm_medium=social&utm_campaign=<board>` – ausgewertet nur bei Statistik-Einwilligung.

## 6. Serie „Von der Skizze zum Raum“ (Ablauf)

Ein Projekt pro Folge, alle drei bis vier Wochen. Material **nur von Harald** (Lieferung 30.10.2026), Kunden-Einwilligung bzw. anonymisiert, keine KI-Skizzen und keine erzeugten Modellfotos (USP-Regeln, UWG).

| Schritt | Material | Format |
|---|---|---|
| 1 Kennenlernen | Foto im Showroom/Café (eigenes Shooting) | Einzel-Pin |
| 2 Vor Ort | Licht im Raum, Notizbuch, Maßband (mit Einwilligung) | Einzel-Pin |
| 3 Handzeichnung | Scan der Skizze (300 dpi, Papierton nicht wegretuschieren) | Karussell 1 · Video 0–4 s |
| 4 Modell | Foto des Raummodells, Draufsicht + Detail | Karussell 2 · Video 4–8 s |
| 5 3D-Planung | Screenshot mit sichtbaren Maßen | Karussell 3 |
| 6 Rendering | als „Visualisierung“ beschriftet | Karussell 4 · Video 8–11 s |
| 7 Fertiger Raum | Foto, gleiche Perspektive wie Skizze | Karussell 5 · Video 11–15 s |

**Ablauf je Folge:** (1) Harald wählt ein Projekt und holt die Einwilligung ein, (2) Team scannt/fotografiert, (3) Art Director setzt Karussell + Video (Zuschnitt/Upscaling mit der GPU-Pipeline, Typo-Overlay, **keine generativen Inhalte**), (4) Texter schreibt Pin-Texte, (5) Inhaber gibt frei, (6) Veröffentlichung Di/Do, (7) Einzelschritte als eigene Pins in den Folgewochen. Schluss-Tafel des Videos: „Von Hand gezeichnet. Digital geplant.“ (Leitmotiv-Vorschlag, Werbetexter feilen.)

## 7. Redaktionsplan (12 Wochen, 3–5 Pins/Woche)

Start nach Freigabe (Annahme Mo 16.11.2026). Vollständige Tabelle mit Pin-Zuordnung: Vorschau-Seite, Abschnitt „Redaktionsplan“ (Quelle `PLAN` in `data.js`).

| KW | ab | Thema | Pins | Status |
|---|---|---|---|---|
| 47 | 16.11. | Start: Profil, Boards, Ezarri Pool & Spa | 4 | bereit |
| 48 | 23.11. | Küche + erste Skizze | 3 | teilweise Slot |
| 49 | 30.11. | Chalet Arlberg zum Saisonstart | 4 | teilweise Slot |
| 50 | 07.12. | Serie Skizze → Raum, Folge 1 | 4 | Slot (Harald) |
| 51 | 14.12. | Bad & Hamam für die Winterplanung | 3 | bereit |
| 1 | 04.01. | Hotel & Objekt, Bar und Spa | 3 | bereit |
| 2 | 11.01. | Wohnen am Bodensee, Winterlicht | 4 | Slot (Shooting) |
| 3 | 18.01. | Serie, Folge 2 | 4 | Slot (Harald) |
| 4 | 25.01. | Küche, Planung im Showroom | 3 | teilweise Slot |
| 5 | 01.02. | Pool-Planung für den Sommer | 4 | bereit |
| 6 | 08.02. | Outdoor am See, Vorschau Frühling | 3 | teilweise Slot |
| 7 | 15.02. | Serie, Folge 3 + Rückblick | 4 | Slot (Harald) |

Pause KW 52/53 (Feiertage). Rhythmus Di/Do/Sa, in starken Wochen zusätzlich Mo/Fr. Aufwand im Team: etwa 1 Stunde pro Woche zum Einplanen (Pinterest-eigene Planung, kein Drittanbieter-Tool nötig), Erstellung neuer Pins 20–30 min je Pin aus der Vorlage.

## 8. Kennzahlen

| Kennzahl | Quelle | Rhythmus |
|---|---|---|
| Ausgehende Klicks auf platzhirsch.studio | Pinterest Analytics (nach Domain-Bestätigung) | wöchentlich |
| Saves | Pinterest Analytics | wöchentlich |
| Impressionen je Board und je Format (Standard/Karussell/Video) | Pinterest Analytics | monatlich |
| Anfragen mit Quelle Pinterest | Frage im Termin-/Kontaktformular, Frappe | monatlich |
| Ideenboards mit Pinterest-Bezug | aggregiert, nur mit Statistik-Einwilligung | monatlich |

Nach 12 Wochen: Boards mit schwacher Wirkung zusammenlegen, Format mit den meisten Klicks pro Pin ausbauen. **Pinterest-Tag (Conversion-Messung)** erst später, nur mit Marketing-Einwilligung im Cookie-Banner und Ergänzung der Datenschutzerklärung durch die Kanzlei.

## 9. Rechte-Regeln (verbindlich)

1. **Erlaubt auf Pinterest:** eigene Fotos mit geklärten Rechten (Bildregister `Marktresearch/recht/bildrechte.csv` + Inhaber-Entscheidung), **Haralds Material** (mit Kunden-Einwilligung bzw. anonymisiert), **Ezarri-Bilder** (Vertragshändler, schriftliche Nutzungserlaubnis laut Entscheidung Nr. 7; Quelle „Ezarri“ auf jedem Pin).
2. **Verboten auf Pinterest:** Minotti-, Poliform- und Custom-Line-Bilder (die Freigaben gelten für Sofaplaner bzw. Yacht-Seite, nicht für Pinterest), alle übrigen Herstellerbilder ohne schriftliche Pinterest-Freigabe, Stockfotos, KI-erzeugte Räume, Menschen oder Seeblicke.
3. **Stand Bildregister 29.10.2026:** alle 1.274 Einträge in `bildrechte.csv` haben `freigabe = offen`. Geklärt sind nur **Ezarri** (Nr. 7) und **aboutHome.jpg** (Nr. 11, „Rechte am Foto“). aboutHome.jpg wird im Startpaket als Pin p16 gezeigt; **der Inhaber bestätigt vor Veröffentlichung, dass die Rechte auch Pinterest umfassen.** Alles andere wartet auf das eigene Shooting (Shotliste Bibel §7) bzw. Haralds Material.
4. **Bearbeitung:** nur Zuschnitt, KI-gestützte Hochskalierung (Real-ESRGAN, lokal, keine hinzugefügten Motive; ein GAN ergänzt Bilddetails, darum der Vermerk) und Typo-Overlay. Bearbeitung steht in den EXIF-Daten jeder Basis (`ImageDescription`, `Copyright`, `Software`) und in der Pin-Liste. Generative Inhalte werden nicht verwendet; falls je doch (z. B. Outpainting), sichtbar kennzeichnen (Bibel §7, AI Act Art. 50).
5. **Ezarri-Inhalte sind keine eigenen Projekte.** Pin-Texte sagen „Inspiration“, „Idee für …“ oder nennen die Kollektion – nie „unser Projekt“.
6. **Website-Merken-Link** (Teil A) blendet sich bei nicht freigegebenen Bildern selbst aus (`src/lib/pinterest/rights.js`); dieselbe Regel gilt für das Team beim manuellen Pinnen.
7. **Personen:** nur mit schriftlicher Einwilligung; Kundenräume nur mit Einwilligung oder ohne erkennbare Details (Adresse, Fotos, Dokumente).

## 10. Arbeitsablauf für das Team

1. **Bild wählen** – nur aus den freigegebenen Quellen (§9). Unsicher → nicht pinnen, beim Inhaber nachfragen.
2. **Basis erzeugen** – Original in einen Ordner kopieren, mit der GPU-Pipeline 2× hochskalieren, auf 1000 × 1500 zuschneiden:
   ```powershell
   $T = "C:\Users\admin.local\Documents\platzhirsch-gpu-tools"
   & $T\.venv\Scripts\python.exe -I $T\scripts\hochskalieren.py QUELLEN HOCH --faktor 2 --fp16 --format png
   node Marktresearch/digital/marketing/pinterest/werkzeug/basis-zuschnitt.mjs HOCH
   ```
   (Eintrag mit `id`, `basis`, `fokus`, Titel, Texten in `src/components/Preview/pinterest/data.js` anlegen.)
3. **Typo setzen** – Dev-Server läuft, dann `node Marktresearch/digital/marketing/pinterest/werkzeug/render-pins.mjs [id …]` → `public/preview/pinterest/<id>.webp` (1000 × 1500) und `<id>-600.webp`. Die Vorlage liegt unter `/de/preview/pinterest/vorlage?pin=<id>`.
4. **Text** – Titel, Beschreibung, Alt-Text, Link mit UTM; Prüfliste: keine Superlative, kein Preis, Quelle genannt, Sie-Form.
5. **Freigabe** – Inhaber sieht die Vorschau-Seite und gibt die Woche frei.
6. **Planen** – in Pinterest (Unternehmenskonto) für Di/Do/Sa einplanen. Ein Pin pro Bild und Board; nicht dasselbe Bild in kurzer Folge erneut pinnen.
7. **Auswerten** – monatlich Kennzahlen (§8) in einer Zeile pro Board notieren, Plan der nächsten 4 Wochen anpassen.

## 11. Startpaket (Stand dieser Lieferung)

- **19 Beispiel-Pins** (`public/preview/pinterest/`): 15 aus Ezarri-Bildern, 1 eigenes Foto (Showroom Lochau, Rechte-Bestätigung für Pinterest offen), 3 Slots „Von der Skizze zum Raum“ für Haralds Material.
- **8 Boards** mit Titel, Beschreibung DE/EN, Cover und Ziel-Seite.
- **Redaktionsplan** 12 Wochen, Kennzahlen, Checkliste für den Inhaber (Vorschau-Seite).
- **Werkzeug:** `werkzeug/basis-zuschnitt.mjs`, `werkzeug/render-pins.mjs`, Vorlage `/de/preview/pinterest/vorlage`.

## 12. Checkliste für den Inhaber (vor dem ersten Pin)

1. Pinterest-**Unternehmenskonto** mit Firmen-Mail anlegen (Name „Platzhirsch Home Living“, Monogramm als Profilbild, Standort Lochau).
2. **Domain bestätigen:** Pinterest → Einstellungen → Konto beanspruchen → Website → HTML-Tag. Den Inhalt (`content`) als Umgebungsvariable `PINTEREST_DOMAIN_VERIFY` im Deploy setzen; die Website gibt dann `<meta name="p:domain_verify" content="…">` aus (leer = kein Tag; Umsetzung Teil A).
3. **Rich Pins** mit einer Produkt- und einer Ratgeber-URL im Rich-Pins-Validator prüfen (Open Graph/Produkt-Strukturdaten sind vorhanden). Ob Pinterest zusätzlich eine Freischaltung verlangt, ist in den Quellen widersprüchlich – nach der Domain-Bestätigung im Konto prüfen.
4. **Bildrechte** bestätigen: aboutHome.jpg auch für Pinterest (Umfang inkl. Pinterest, keine Herstellerstücke als Hauptmotiv, Register auf „frei“; bis dahin ist p16 und der Website-Merken-Link gesperrt); Liste weiterer eigener Fotos für Pinterest freigeben.
4a. **Ezarri** per Mail bestätigen lassen, dass die Erlaubnis (Nr. 7) auch Social Media/Pinterest abdeckt und wie die Quelle zu nennen ist. Ablage Firmenakten, Eintrag Bildregister. Vorher keine Ezarri-Pins hochladen.
4b. **Impressum und Offenlegung im Profil:** Info-Text bzw. Website-Feld mit Link „Impressum: platzhirsch.studio/de/impressum“ (§ 5 ECG, § 14 UGB, § 25 MedienG).
5. **Haralds Material** (30.10.): Skizzen, Modellfotos, Porträt, 2–3 Projektketten mit Einwilligung.
6. **Pinterest-Tag** erst später, nur mit Marketing-Einwilligung und Kanzlei-Ergänzung der Datenschutzerklärung.
7. **Zuständigkeit:** wer pinnt, wer gibt frei, wer beantwortet Kommentare/Nachrichten.
