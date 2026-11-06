# Art Direction · Richtung „Showroom“

Stand 04.11.2026 · Entwurf, nicht freigegeben · Live: `http://localhost:3100/entwurf/showroom` (+ `/anfragen`, `/kundenakte`, `/kassa`)
Code: `backoffice/src/app/entwurf/showroom/` (Routen + `showroom.css`), `backoffice/src/components/Entwurf/Showroom/`
Screenshots: `backoffice/qa-screenshots/entwurf-showroom/` (Skript `src/components/Entwurf/Showroom/shoot.mjs`)

## 1 · Leitidee

Das Backoffice soll sich anfühlen wie ein ruhiger Gang durch den eigenen Showroom: helle Flächen aus Licht und Papier, darauf Material in Form von Leder, Eiche, Travertin, Salbei und Seeblau, und überall die Projekte selbst als Bild. Die Software tritt zurück. Sie ordnet, zeigt den Tag, nennt eine Zahl immer mit ihrem Zusammenhang und lässt die Arbeit (Räume, Möbel, Kunden) die Bühne haben. Technisch heißt das: die Ruhe einer Apple-Systemapp und die Dichte von Linear, aber in der Wärme eines Einrichtungshauses der Oberklasse.

## 2 · Moodboard (Referenzen und was wir übernehmen)

| Referenz | Was wir übernehmen | Was nicht |
|---|---|---|
| **Apple Home / Freeform** | Frosted-Seitenleiste als schwebende Materialebene, große Rundungen, Kacheln mit Bildern, ruhige Hierarchie | Spielerische Farbkacheln |
| **Arc** | Seitenleiste als eigene „Scheibe“ neben dem Inhalt, Theme-Schalter als Teil der Hülle | Neon-Verläufe |
| **Things 3** | Typografische Ruhe, „Heute“ als Ausgangspunkt, Häkchen und Zustände ohne Lärm | Reine Listen ohne Bild |
| **Airbnb Host** | Bild steht für Objekt/Projekt, Status als weiche Fläche statt als Signalfarbe | Rosa Akzent |
| **Linear / Attio** | Listen mit zwei Zeilen und klarer Wichtigkeit (Name zuerst, ID nur im Detail), Vorschau-Panel, Tastaturkürzel | Kühle Grautöne |
| **Stripe Dashboard** | Kennzahl immer mit Vergleich und Satz, Diagramme dünn und zurückhaltend | Tabellen-Übermacht |
| **Bang & Olufsen, Minotti-Kataloge** | Großzügiger Weißraum, Serifen-Display, Materialfotos | Nur-Schwarz-Luxus |

## 3 · Farbtoken

Alle Token liegen als CSS-Variablen auf `.sr`. Dunkel greift bei `prefers-color-scheme: dark` (außer `data-theme="light"`) oder bei `data-theme="dark"`. Der dunkle Modus ist eigens gewählt und nicht automatisch umgekehrt: warmes Schwarz, Flächen etwas heller, Akzent aufgehellt.

### Rollen

| Token | Hell | Dunkel | Verwendung |
|---|---|---|---|
| `--canvas` | `#f4f3f0` (+ Lichtschein `#fbfaf8`) | `#121110` | Raum, Seitenhintergrund |
| `--pane` | `rgba(236,233,227,.72)` + Blur 24 | `rgba(30,28,25,.72)` | Seitenleiste, Warenkorb (Material) |
| `--surface` | `#ffffff` | `#1c1a18` | Blätter, Karten, Panel |
| `--surface-sunk` | `#f1efeb` | `#171614` | Zitat, Kanban-Spalte, Bildplatzhalter |
| `--fill / -2 / -3` | Braun-Schwarz 4,5 / 8 / 12 % | Creme 4,5 / 8 / 12 % | Hover, Segment-Hintergrund, Leerbalken |
| `--line / -2` | 8,5 / 14 % | 7,5 / 13 % | Haarlinien (sparsam) |
| `--text` | `#1f1c19` | `#f3efe9` | Primär |
| `--text-2` | `#5c564e` (6,5:1) | `#b8b0a5` (8,8:1) | Sekundär |
| `--text-3` | `#736c62` (4,7:1 auf Canvas) | `#9c958a` (5,9:1) | Meta, Zeiten |
| `--ink` | `#23201c` | `#f1ece4` | Primärknopf (Tinte); im Dunkeln Creme |
| `--accent` | `#8a4b26` Leder/Cognac | `#e0a77d` | Auswahl, Fokus, „jetzt“, Datenreihe 1 |
| `--accent-soft` | `#f5ebe3` | Cognac 13 % | ausgewählte Zeile, aktiver Schritt |

### Materialpalette (Status- und Bereichsflächen)

| Material | Bedeutung | Fläche hell | Text hell | Punkt | Text dunkel |
|---|---|---|---|---|---|
| **Leder** | Neu, Aufmerksamkeit, Freigabe | `#f6ece4` | `#7a3f1c` (7,1:1) | `#a8643a` | `#ecb58e` |
| **Eiche** | Qualifiziert, Küche, Kundenkarte | `#f4eee3` | `#6a4e22` (6,7:1) | `#b08850` | `#dcc08f` |
| **Travertin** | Angebot, neutral-warm | `#f1ede6` | `#5c5144` (6,6:1) | `#b9a88d` | `#d6c8b2` |
| **Salbei** | Gewonnen, bezahlt, erledigt, Trend + | `#e9efe6` | `#3c5638` (7,0:1) | `#6f8a6a` | `#b4cbaf` |
| **See** (Bodensee) | Termin, Lieferung, Info | `#e4eceb` | `#2d4d49` (7,7:1) | `#4f6b68` | `#a9cbc6` |
| **Stein** | Verloren, inaktiv | `#efeeeb` | `#57534c` (6,6:1) | `#9a958d` | `#c4beb5` |
| **Rost** | Fehler, Verzug, Trend – | `#f8e8e2` | `#8b3420` (6,8:1) | `#c0583d` | `#f0a893` |

Status erscheint immer als **Punkt + Wort** auf getönter Fläche, nie allein über Farbe. Alle Textpaare erfüllen AA (≥ 4,5:1), gemessen.

## 4 · Typografie

- **UI: Inter** (Google, variabel, mit `opsz`-Achse). Begründung: Die optische Größenachse macht Inter bei 12–14 px so ruhig und dicht wie SF Pro und bei 20+ px straffer. Dazu kommen echte Tabellenziffern (`tabular-nums`) für Beträge und die Stilsätze `cv11/ss01/ss03` (einstöckiges a, ruhigere Ziffern). Instrument Sans von der Website ist schön, aber bei 12 px in dichten Listen zu weich und hat keine optischen Größen.
- **Display: Fraunces** mit `SOFT 100` (Google, variabel, `opsz`). Weiche, fast gedrechselte Serifen wirken wie Material zum Anfassen, also haptisch. Eingesetzt nur für Begrüßung, Seitentitel, Personennamen, große Beträge (Kennzahl, Kassa-Summe). So entsteht Showroom-Charakter, ohne dass die Arbeitsflächen unruhig werden.
- **Wortmarke: Bodoni Moda** (wie Website), Versalien mit 0,22 em Sperrung, nur Logo und Kundenkarten-Stufe.

| Stufe | Schrift | Größe / Zeile | Gewicht | Einsatz |
|---|---|---|---|---|
| Display 1 | Fraunces | 40 / 1,05, −0,02 em | 380 | Begrüßung, Seitentitel |
| Display 2 | Fraunces | 26–38 | 380 | Kundenname, Panel-Name |
| Zahl XL | Fraunces | 34–52, tnum | 380 | Kennzahl, Summe Kassa |
| Titel | Inter | 15–16 | 600 | Abschnittstitel |
| Text | Inter | 14 / 1,45 | 400–550 | Standard |
| Klein | Inter | 13 / 12,5 | 400–500 | Unterzeilen, Meta |
| Mikro | Inter | 11,5–12 | 500 | Chips, Achsen |

Keine VERSALIEN-Etiketten in der UI (außer Wortmarke). Labels stehen in Satzschreibung, sekundär gefärbt.

## 5 · Raster und Abstände

- 4-px-Grundraster; übliche Schritte 4 / 8 / 12 / 14 / 18 / 22 / 28 / 40.
- Desktop 1440: schwebende Seitenleiste 256 px (10 px Abstand zum Rand), Inhalt mit 40 px Rand, keine feste Maximalbreite. Zentrale-Raster 1,55 : 1, Kundenakte 1fr + 360 px, Liste 1fr + 400 px Vorschau.
- iPad (< 1280): Seitenleiste wird zur Icon-Schiene (76 px) mit Monogramm „P“, 24 px Rand, Projekte in 2 Spalten (16 : 9), Spalten mit geringer Priorität (Budget) fallen weg.
- < 1024: Vorschau wird zum schwebenden Sheet (rechts, 12 px vom Rand), alle Raster einspaltig.
- Sticky-Kopfzeile 64 px mit Verlauf statt harter Kante.

## 6 · Flächen, Linien, Schatten

- **Drei Material-Ebenen**: Raum (Canvas), Scheibe (`--pane`, Frost-Blur 24 px, Sättigung 160 %), Blatt (`--surface`). Dazu **Sheet/Dialog** mit `--sh-3`.
- Schatten statt Rahmen: `--sh-1` (1-px-Kontur 5 % + 2-px-Schatten), `--sh-2` (+ weicher Fall 28 px), `--sh-3` (Panel, 64 px). Im Dunkeln Kontur aus Creme 6–8 % plus tiefer Schwarzschatten.
- Radien: 8 (klein) · 10 (Nav, Steuerelemente) · 14 (Zeilen, Kacheln innen) · 20 (Blätter, Produktkacheln) · 28 (Cover, Dialog) · Pille 999 (Knöpfe, Chips, Suche).
- Haarlinien nur, wo Inhalte gleicher Art aufeinander folgen (Listenzeilen, Beträge). Keine umrandeten Kästen um Abschnitte: Abschnitte entstehen durch Weißraum und Titel.
- Bilder: `object-fit: cover`, Radius der Kachel, Text darauf nur mit Verlauf (unten 45–55 % Schwarzbraun) oder als Glas-Chip.

## 7 · Ikonografie

- lucide-react, Strichstärke 1,7 (Nav, Listen) bzw. 1,8–2,2 (kleine Status-Icons, Plus/Minus). 16–18 px in der UI, 20–21 px im Kiosk.
- Icons stehen nie allein: immer mit Label oder `aria-label`/`title`.
- Bereichs-Icons (Sofa, Kochmütze, Badewanne, Schiff, Tanne, Koffer) geben Anfragen eine sofort lesbare „Art“, ohne Farbe zu verbrauchen.
- Icon-Behälter: 30–36 px, Radius 9–11, getönt in der Materialfarbe der Bedeutung.

## 8 · Datenvisualisierung

- Eine Datenreihe trägt den Akzent (Cognac), der Vergleich (Vorjahr) liegt als Geisterbalken (`--viz-ghost`) dahinter. Es gibt keine zweite Y-Achse und keine Zahlen an jedem Balken. Die Legende ist bei zwei Reihen immer da.
- Balken 62 % breit, oben 4 px gerundet; der laufende Monat ist zu 55 % transparent und als „läuft“ markiert.
- Hover/Fokus auf jedem Balken zeigt einen Tooltip mit Monat, Wert und Vorjahr (tastaturfokussierbar).
- Sparkline 2 px mit weicher Fläche (18 % → 0) und Endpunkt mit Flächenring.
- Anteile als segmentierter Meter (2-px-Fugen) in Materialfarben, mit Legende und Werten in Textfarbe.
- **Kennzahl = Zahl + Vergleich + Satz.** Beispiel: „96.400 € · +10,8 % · nach 4 von 21 Verkaufstagen, Vorjahr 87.000 €“.

## 9 · Bewegung

| Token | Wert | Einsatz |
|---|---|---|
| `--t-fast` | 140 ms | Hover, Farben, Druck |
| `--t-med` | 260 ms | Panel-Einblendung, Karten heben sich, Tab-Unterstrich |
| `--t-slow` | 420 ms | Seiteneintritt, Balken wachsen, Bezahl-Sheet |
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | Standard |
| `--ease-spring` | `cubic-bezier(.34,1.32,.64,1)` | Kiosk-Tippen, Mengen-Badge, Sheet |

- Seiteneintritt: Abschnitte steigen 6 px gestaffelt (40 ms) ein.
- Vorschau-Panel gleitet beim Wechsel 12 px von rechts ein, Zeilen-Auswahl setzt einen Leder-Balken links.
- Karten heben sich beim Hover um 1–3 px (Schatten wächst), Bilder zoomen in 900 ms um 4–5 %.
- Kiosk: Kachel drückt auf 96,5 %, Mengen-Badge „ploppt“ (Feder), Terminal-Welle als Wartezustand.
- „Jetzt“-Punkt pulsiert ruhig (2,4 s).
- `prefers-reduced-motion`: alle Animationen und Übergänge auf 1 ms, kein Bildzoom.

## 10 · Komponentenbeispiele (im Entwurf umgesetzt)

- **Tagesablauf**: Zeit (tnum), Dauer, Bildkachel 76 × 56, Titel, Ort und Material-Chip. Der laufende Termin bekommt eine Leder-Fläche und „Jetzt · noch 32 Min.“, vergangene Termine sind auf 62 % gedimmt.
- **Wartet auf dich**: getöntes Icon, Aufgabe, Kontext und eine Verb-Aktion („Prüfen“, „Anrufen“). Ersetzt die Schnellaktionen-Leiste.
- **Projektkachel**: Bild 4 : 3, Phase als Glas-Chip, 5-Stufen-Fortschritt, Team-Avatare, Summe.
- **Anfragezeile**: Avatar mit Materialton, Name fett, Firma grau; darunter Bereichs-Icon, Thema und Quelle als Umriss-Tag. Rechts Budget, Status-Chip und relative Zeit. Die Nummer erscheint nur im Panel.
- **Vorschau-Panel**: Bild-Kopf mit Verlauf, Status + Referenz, Name in Fraunces, Original-Nachricht als Zitat, 4 Fakten, 2 Hauptaktionen, Mini-Verlauf.
- **Vorgangsleiste**: 5 Schritte Anfrage → Planung → Auftrag → Lieferung → Service; erledigt in Salbei mit Häkchen, aktiv als Leder-Fläche mit „läuft“, kommend leer.
- **Zeitleiste**: Tagesgruppen, runde Knoten mit Bedeutungston, Karten mit Bildreihen (Renderings) oder Dateien (PDF-Chip).
- **Beträge**: großer Betrag, Zahlungsplan als segmentierter Balken (bezahlt/fällig/offen) und Zeilen mit tnum.
- **Kundenkarte (Kassa)**: Leder-Verlauf mit feiner Maserung, Stufe in Bodoni-Versalien, Punkte und Fortschritt zur nächsten Stufe.
- **Bezahl-Sheet**: Betrag in 52 px, 4 Zahlarten als große Kacheln, Terminal-Status in See-Fläche.

## 11 · Do / Don't

**Do**
- Projekte und Produkte zeigen: ein echtes Bild schlägt jedes Icon.
- Jede Zahl mit Vergleich und Satz versehen.
- Name vor Nummer, Verb vor Substantiv („Termin vorschlagen“).
- Status = Punkt + Wort auf Materialton.
- Weißraum trennt Abschnitte, Schatten trennen Ebenen.
- Fraunces sparsam einsetzen, nur für Momente (Name, Gruß, Summe).

**Don't**
- Kein dunkler Seitenleisten-Block, keine beige Vollfläche als Arbeitsgrund.
- Keine Reihe gleich großer umrandeter Kennzahl-Kästen, keine VERSALIEN-Labels.
- Keine Karte um jede Fläche, keine leeren Riesen-Boxen (Leerzustand = ein Satz + eine Aktion).
- Keine Signalfarben (Bootstrap-Blau/-Grün), keine Regenbogen-Diagramme.
- Keine Testdaten mit identischen Namen: Präsentationen nur mit abwechslungsreichen, fiktiven Daten.

## 12 · Übertragung

**Kiosk (iPad quer 1180 × 820)**: ohne Seitenleiste, Zwei-Spalten-App (Sortiment | Warenkorb als Frost-Scheibe 400 px). Tippziele mindestens 40 px (Kategorien), Kacheln mindestens 140 px, Bezahlen 60 px. Ein Scan-/Suchfeld (52 px) steht immer oben. Bildkacheln mit Lagerbestand als Glas-Chip, Artikel ohne Foto bekommen eine Materialtonkachel mit großem Linien-Icon und Gutscheine eine Mini-Kundenkarte. Feder-Bewegungen geben haptisches Feedback. Hell/Dunkel ist für Abendverkäufe am Gerät umschaltbar.

**iPhone (390)**: Seitenleiste wird zur Tab-Leiste unten (Zentrale, Anfragen, Kunden, Kalender, Mehr) auf `--pane`. Zentrale zeigt nur „Dein Tag“ und „Wartet auf dich“, die Kennzahlen werden zu einer horizontal wischbaren Reihe. Listen behalten die Zweizeilen-Zeile und verlieren Budget/Status-Spalte (Status als Punkt vor dem Namen). Die Vorschau öffnet als Sheet von unten (Radius 28, Griff). Die Kundenakte stapelt Cover (16 : 9), Kopf, Vorgangsleiste (horizontal scrollbar) und Tabs als Segment.

**Druck (A4, Angebot/Lieferschein/Kundenakte)**: Weißes Papier, keine Schatten, keine Flächen außer Materialtönen in 10 % für Status. Die Wortmarke steht in Bodoni oben links, Kundenname und Summe in Fraunces, alles Übrige in Inter 9,5/13 pt mit tnum für Beträge. Projektbilder bleiben als Streifen im Kopf (max. 45 mm), Haarlinien 0,5 pt in `#d8d2c8`. Die Vorgangsleiste wird als Textzeile mit Häkchen gedruckt. Statusfarbe wird zusätzlich mit Text gedruckt (schwarz-weiß-tauglich).

---

## Nach Jury (04.11.2026, Note 6 → Überarbeitung)

Alle 30 Pflichtänderungen aus `showroom-jury.md` sind umgesetzt. Die Abschnitte oben gelten weiter. Wo sie dem Folgenden widersprechen, gilt dieser Abschnitt.

### Was sich grundsätzlich geändert hat

- **Ein Raster für alles.** 12 Spalten, Gutter 24 px (iPad 20), Abschnittsabstand 48 px (iPad 40). Die Zentrale ist durchgehend **7 | 5**: Tag/Aufgaben, Umsatz/Angebote+Besuche, Aktivität/Showroom. Projekte laufen 4 × 3. Die Kundenakte ist 8 | 4. Nebeneinanderliegende Flächen strecken sich (`align-items: stretch`, Karte `flex: 1`) und enden auf einer Unterkante.
- **Weniger Karten.** Karten gibt es nur noch, wo etwas angefasst wird (Tag, Aufgaben, Projekte, Liste, Panel, Beträge). Die Kennzahlen stehen offen auf dem Grund, getrennt durch Haarlinien an den Rasterfugen. Die Zeitleiste der Kundenakte besteht nur aus Text, Knoten und Haarlinien zwischen den Tagen. „Größte Positionen“ und „Bezüge“ sind Abschnitte ohne Fläche, 40 px Abstand. Die Seitenleiste ist kein schwebendes Glas mehr, sondern eine ruhige Fläche (`--side`) mit Haarlinie. Damit gilt Abschnitt 12 für den Kiosk sinngemäß: Der Warenkorb ist eine ruhige `--side`-Fläche statt Frost.
- **Status = Punkt + Wort, keine Pille.** Pillen bleiben nur für Knöpfe und Filter. Phasen auf Fotos sind dunkles Glas (`rgba(20,18,16,.55)` + Blur 16, Radius 8, 12/600 weiß).
- **Zwei Stimmen.** Die Wortmarke ist jetzt die **SVG-Kontur des Website-Logos** (Bodoni Moda 500 / opsz 96 als Pfad, Strich 0,9 Einheiten), in der schmalen Leiste das Monogramm. Für den Druck gilt dasselbe: Wortmarke als Kontur, nie als gesetzte Schrift. Display bleibt Fraunces, aber straff: `SOFT 0, WONK 0, opsz 72`, Gewicht 300, −0,025 em. Vergleichsvariante Inter 600 / −0,03 em per `?display=sans` (Screenshots `3-kundenakte--desktop--hell--kopf-serif.png` / `--kopf-sans.png`). Empfehlung: Serif. Sie trägt den Didone-Ton der Marke, ohne mit der Wortmarke zu konkurrieren, weil diese keine Schrift mehr ist.
- **Ein Bild höchstens einmal pro Bildschirm.** Das Skript prüft es automatisch. Ausnahme ist der Warenkorb, dessen Miniatur denselben Artikel zeigt wie die Kachel. Rahmen des Auftrags waren höchstens 12 kopierte Bilder, darum keine 16 Motive. Die Verteilung steht als Kommentar in `daten.js`.
- **Null Ellipsen im Präsentationsdatensatz.** `shoot.mjs` meldet abgeschnittenen Text (Ellipse und Zeilenbegrenzung) für alle 16 Ansichten. Stand: keine.

### Umsetzung je Pflichtpunkt (Kurzform)

| Nr. | Umsetzung |
|---|---|
| 1–2 | `.sr-grid` mit 12 Spalten, Spans 7/5/3/8/4, gleiche Unterkanten. Die Anfragen-Seite füllt den Viewport (`.sr-main--fill`). Liste und Panel scrollen intern und enden gemeinsam 24 px über dem Rand. |
| 3 | Kopfzeile `align-items: last baseline`, Knöpfe auf der Grundlinie von „Guten Morgen“, Absatz `max-width: 62ch`. |
| 4 | Zeile 1 Name + Ort, Zeile 2 Icon + Anliegen. Spalten 96 / 112 / 72, Budget als Zahl mit Einheit im Spaltenkopf („Budget, Tsd. €“). Panel 360 px (iPad 340). |
| 5 | Stapel 26 px, Überlappung −3 px, Ring 2 px `--surface`, 9,5 px/600. Bei 24/−6 überdeckte der Ring weiterhin den zweiten Buchstaben (gemessen bei 3×). |
| 6 | `zahl()`/`euro()`/`kasse()` in `daten.js`. Gruppierung mit Punkt auch bei vier Stellen („1.240 Punkte“). `de-AT` liefert im ICU ein schmales Leerzeichen, darum `de-DE`-Gruppierung. Listen ohne „,00“, Kassa mit Cent. |
| 7 | `hyphens: manual`, Telefon und Ort `nowrap`, Fakten als Definitionsliste (92 px | Wert), das Thema darf umbrechen. Positionen: Titel einzeilig, Zusatz in Zeile 2. |
| 8 | Bildcontainer `overflow: hidden`, Radius oben, ganze Pixelhöhen (172/150), `img { display:block }`, Bildausschnitt `object-position: 50% 78%`. |
| 9 | Ghost-Knopf 32 hoch, 0 12, min. 96, Radius 999, Kontur `--line-2`, Hover `--fill-2`. „Informieren“. Fuß „Alle 12 Aufgaben →“. |
| 10 | SVG-Wortmarke (Seitenleiste 15 px, Kassa 15 px, Gutschein 7 px). |
| 11 | Fraunces straff (s. o.), Vergleich per `?display=sans`. |
| 12 | Avatar 88 px, `--surface-sunk`, Initialen `--text-2` 28/600, Ring 4 px `--canvas`. |
| 13 | Stufen als Materialtöne: Eiche `#c4a06a → #b08850 → #a07e4a` mit Tinte `#20170b` (aus AA-Gründen eine Stufe heller als der Jury-Wert; dunkle Schrift erreicht so ≥ 4,6 : 1), Nussbaum `#6b4a33 → #4a3222` mit heller Schrift, Leder nur für die höchste Stufe und den Gutschein. Maserung 6 %. In der Kundenakte steht die Stufe als Materialmuster plus Wort statt als Chip. |
| 14 | Zeitleiste ohne Karten (Titel 14/600, Text 14/400, Zitat mit 2-px-Linie), Haarlinie zwischen Tagen, nur Medien (Renderings, PDF) mit Radius. |
| 15 | Renderings `repeat(3, 1fr)`, `aspect-ratio: 4/3`, Radius 10. |
| 16 | Knoten 28 px auf einer Schiene von Knotenmitte zu Knotenmitte (10 % bis 90 %), erledigt in Salbei. Labels zentriert, Unterzeile immer genau zwei Zeilen (`nowrap` je Zeile). Aktiver Schritt ohne Box: Lederknoten mit Ring + „läuft“. |
| 17 | Cover-Verlauf unten 55 % `#1f1c19`, oben 28 % für die Bildunterschriften. Glas-Chips `rgba(20,18,16,.55)` + Blur 16, 13/600 weiß. |
| 18 | Skala 0–300 Tsd. €, Gitter bei 100 und 200 mit Werten links (11,5 px `--text-3`); die Jury nannte 50/100, die Daten liegen aber bei 96–264 Tsd. Vorjahr 62 % breit, nach links versetzt hinter dem aktuellen Balken (hell `rgba(31,28,25,.14)`, dunkel `rgba(243,239,233,.16)`). Maximum „264“ beschriftet, laufender Monat schraffiert. |
| 19 | Dunkle Punktfarben: Leder `#b9774d`, Eiche `#c09a62`, Salbei `#7f9a7a`, See `#6f8f8b` (`#5f7d7a` lag auf `#211e1b` unter 3 : 1). |
| 20 | Aktiver Präsentationsfilter entfernt. Bereich, Quelle und Berater sind neutrale Auswahlknöpfe. |
| 21 | Siehe oben: jedes Motiv höchstens einmal pro Bildschirm. Das Skript prüft das. |
| 22 | Tafel-Fuß: Plus 16 + „Anfrage“, 40 hoch, gestrichelt `--line-2`, Radius 14. |
| 23 | Dunkel: Surface `#211e1b`, Kontur `inset 0 0 0 1px rgba(243,239,233,.07)` + Lichtkante `inset 0 1px 0 rgba(243,239,233,.05)`, Pane `rgba(36,33,29,.78)`. |
| 24 | Avatare dunkel: Materialfläche 22 %, Initialen in der hellen Materialschrift der Dunkelpalette. |
| 25 | „Beliebt“ zeigt genau 2 × 4 Kacheln ohne Scrollen auf dem iPad: 6 Fotos, Gutschein, 1 Materialkachel (Icon 56 px, Strich 1,25, Materialangabe als Text auf `--surface-sunk`). |
| 26 | Plus 44 × 44 (nur Hinweis, die ganze Kachel ist tippbar), Stepper-Segmente 44 × 40, alle Kopf-Iconknöpfe 44. |
| 27 | Titel 2 Zeilen mit fester Höhe 40 px, Preis an der Unterkante verankert. |
| 28 | Kategorien mit Maske (40 px Auslauf) und `scroll-snap`. |
| 29 | Auswahl nur Badge + Ring `0 0 0 3px var(--accent-ring)`. |
| 30 | Karte/Wallet: kein Primärknopf. Hauptzustand „Warte auf Karte …“ mit animierten Ringen, Hinweis „Das Terminal bestätigt die Zahlung selbst“, „Abbrechen“. Bar: Schnellbeträge + „Rückgeld berechnen“. Rechnung: Adresse + „Rechnung erstellen“. |

### Weitere Korrekturen aus eigener Sichtung

- Gestaffeltes Einsteigen ersetzt durch eine einzige Einblendung von 200 ms (Risiko „lästig im Alltag“ aus der Jury).
- Vergangene Termine: Zeit und Titel in `--text-3`, Bild entsättigt, statt die ganze Zeile auf 62 % Deckkraft zu setzen (Kontrast bleibt AA).
- Suche auf dem iPad mit Kurztext „Suchen …“, damit nichts abgeschnitten wird.
- Seitenleiste läuft im ganzseitigen Screenshot durch (Hintergrund am App-Raster statt nur an der klebenden Leiste).
- Warenkorb-Titel dürfen zweizeilig werden statt abgeschnitten zu werden. Der Treuehinweis ist auf eine Zeile gekürzt.

### Token-Änderungen (Auszug)

| Token | Hell | Dunkel |
|---|---|---|
| `--side` | `#efeeea` | `#161513` |
| `--surface` | `#ffffff` | `#211e1b` |
| `--accent` | `#8a4b26` | `#d09670` |
| `--accent-ring` | `rgba(138,75,38,.28)` | `rgba(208,150,112,.34)` |
| `--viz-1` | `#8a4b26` | `#b9774d` |
| `--viz-ghost` | `rgba(31,28,25,.14)` | `rgba(243,239,233,.16)` |
| `--sh-sheet` | Ring 6 % + 2-px- und 24-px-Schatten | Kontur 7 % + Lichtkante 5 % |

### Prüfstand

- Screenshots: `backoffice/qa-screenshots/entwurf-showroom/` (16 Hauptansichten plus Tafel, Bezahlen Karte/Bar, Kopfvergleich Serif/Sans).
- Automatisch: `node src/components/Entwurf/Showroom/shoot.mjs` (aus `backoffice/`). Ergebnis: keine Konsolenfehler, keine Ellipsen, keine Bild-Dubletten.
