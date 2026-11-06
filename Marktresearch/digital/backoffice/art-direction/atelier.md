# Art Direction „Atelier“

Entwurf, live: http://localhost:3100/entwurf/atelier/ (Heute `/zentrale`, `/anfragen`, `/kunde`, `/kassa`)
Code: `backoffice/src/app/entwurf/atelier/` (Seiten, `atelier.css`, `layout.js`, `shoot.mjs`), `backoffice/src/components/Entwurf/Atelier/`
Screenshots: `backoffice/qa-screenshots/entwurf-atelier/` (hell + dunkel, 1440 und iPad 1180 × 820)

## Leitidee

Das Backoffice ist das Arbeitsbuch eines Interior-Studios und kein Formular. Es arbeitet mit Papierweiß, Haarlinien und viel Luft. Zahlen und Überschriften stehen in einer ruhigen Buchschrift, Räume und Materialien dienen als Ankerpunkte, und ein einziger Akzent in gebrannter Erde zeigt, was gerade wichtig ist. Die Oberfläche tritt zurück, damit Kunden, Projekte und Material im Vordergrund stehen. So spürt man dieselbe Haltung wie im Showroom in Lochau.

## Moodboard (Referenzen)

- **Vitra / Aesop (Web):** viel Weißraum, Bild als Raumgeber, Text in sachlicher Sans, Haarlinien statt Rahmen, warmes Off-White.
- **Notion Calendar:** Agenda mit „Jetzt“-Linie, farbige Termin-Stäbe statt Kästen, ruhige Dichte.
- **Linear:** gruppierte Listen mit Statuspunkt, Tastatur-Fokus, Vorschau-Panel, leere Zustände mit einem Satz statt Icon-Box.
- **Stripe Dashboard:** große Kennzahl mit Kontext (Vergleich, Ziel) und Sparkline darunter, Zahlen in Tabellenziffern.
- **Apple-Systemapps (Wallet, Kalender):** großzügige Touch-Ziele, Segmentschalter, eine klar hervorgehobene Hauptaktion.
- **Editorial-Print (Kunstbuch, Einrichtungsmagazin):** Serifen-Display, Kursiv-Zitat mit Linie, Bildstrecken in festen Proportionen.

## Farbtoken

Alle Werte stehen als CSS-Variablen auf `.at`. Dunkel wird über `prefers-color-scheme` gesetzt oder per Schalter (`data-at-theme`). Kontraste sind auf der Seitenfläche gemessen.

| Rolle | Hell | Dunkel | Kontrast hell / dunkel |
|---|---|---|---|
| `--at-paper` Seite | `#faf9f6` | `#141311` | – |
| `--at-raised` Panel, Kachel | `#ffffff` | `#1c1a17` | – |
| `--at-sunk` Hover, Mulde, Feld | `#f3f1ec` | `#1f1d1a` | – |
| `--at-sunk-2` gedrückt, Spur | `#ebe8e1` | `#2a2824` | – |
| `--at-ink` Text | `#1c1b18` | `#eeeae3` | 16,4 / 15,5 |
| `--at-ink-2` sekundär | `#55514a` | `#bbb4a8` | 7,5 / 9,0 |
| `--at-ink-3` tertiär (min. AA) | `#6e695f` | `#948d81` | 5,2 / 5,7 |
| `--at-ink-4` nur Deko | `#a29c91` | `#5f5a52` | nie für Text |
| `--at-rule` Haarlinie | `#e7e3db` | `#2a2824` | – |
| `--at-rule-2` betont, Eingaben | `#d5d0c6` | `#3a3732` | – |
| `--at-accent` gebrannte Erde | `#9a4528` | `#dd8a66` | 6,1 / 7,0 |
| `--at-accent-soft` Auswahl | `#f4e9e3` | `#2e1f18` | Akzent darauf 5,4 |
| `--at-pos` Moos | `#476341` | `#93b285` | 6,4 / 7,9 |
| `--at-warn` Ocker | `#8a6113` | `#d8ae5c` | 5,3 / 9,0 |
| `--at-neg` Ochsenblut | `#9c2f2c` | `#e3837b` | 7,0 / 6,9 |
| `--at-info` Schiefer | `#3f5469` | `#9db3c9` | 7,4 / 8,6 |
| Phasen-Rampe `--at-ph-1…5` | `#bfb7a8 / #9d9486 / #77705f / #4d4840 / #1c1b18` | `#5a554d / #7a746a / #9a9387 / #bdb6a9 / #eeeae3` | sequenziell, einfarbig, erste Stufe ≥ 1,9 : 1 auf Papier |
| `--at-bar` Monatsbalken | `#55514a` (ink-2) | `#948d81` (ink-3) | nie Tiefschwarz |
| `--at-pay` Bezahlknopf | `#9a4528` / Text `#ffffff` | `#b8603d` / Text `#fff7f2`, Hover `#c56a45` | 6,3 / 4,7 |
| `--at-plate` Produktmulde | `#f3f1ec` | `#ece8e1` mit `brightness(.72) saturate(.9)` | Fotos multipliziert |
| `--at-brass` Kundenkarte | `#b2965a` | `#b2965a` | nur 10-px-Swatch |

Materialfarben (`--at-mat-*`) sind Muster aus der Ausstellung, zum Beispiel Eiche `#a9855a`, Bouclé `#d8cdbd`, Messing `#b2965a`, Navy `#2f3e52` und Nuss `#7a5a40`. Sie kennzeichnen nur einen Bereich oder ein Material, sie tragen nie einen Status und färben keinen Text.

Im Dunkelmodus werden Bilder mit `brightness(.88) saturate(.92)` gedimmt, damit Fotos nicht stärker leuchten als der Text.

## Typografie

- **Newsreader** (Google, variable Achse `opsz` 6–72): Überschriften, große Kennzahlen, Beträge in der Kassa und das Kundenzitat (kursiv). Die Schrift hat die Wärme einer Buchschrift, die optische Größe hält sie bei 44 px straff, und sie hat Versalziffern. Damit wirkt sie luxuriös, ohne den Didone-Kontrast der Bodoni, der bei Zahlen flimmert.
- **Geist** (Google): die gesamte Oberfläche. Die Schrift ist neutral und präzise, die Tabellenziffern bleiben auch bei 12–13 px ruhig. Sie wirkt zeitgemäßer und technischer als Instrument Sans, das für Fließtext auf der Website bleibt.
- **Bodoni Moda**: nur für die Wortmarke „Platzhirsch“, genau wie auf der Website. So bleibt die Marke wiedererkennbar.

| Stufe | Schrift | Größe / Zeile | Schnitt |
|---|---|---|---|
| Begrüßung | Newsreader | 48 / 54 | 340, −0,025em |
| Display (Kennzahl) | Newsreader | 44 / 48 | 350, Tabellenziffern |
| H1 | Newsreader | 34 / 40 | 380 |
| H2 (Abschnitt) | Newsreader | 22 / 28 | 420 |
| Zitat | Newsreader aufrecht | 16 / 24 | 400 |
| Seitenspalten-Kopf | Geist | 13 / 18 | 560, ink-2 |
| H3 / Hervorhebung | Geist | 14 / 20 | 540–560 |
| Text | Geist | 14 / 20 | 400 |
| Klein | Geist | 13 / 18 | 400 |
| Mikro | Geist | 12 / 16 | 400 |

Regeln: Es gibt keine Etiketten in VERSALIEN. Beschriftungen stehen im Satzbau und werden über die Farbe `ink-3` gestuft. Zahlen haben immer `tabular-nums lining-nums`. Die Dokumentnummer ist nie die lauteste Spalte, laut sind der Name und der Wunsch.

## Raster und Abstände

- 4-px-Basis mit den Stufen 4 / 8 / 12 / 16 / 24 / 32 / 40 / 56 / 64. Zwischen Abschnitten liegen 56 px Luft und keine Kartenränder.
- Desktop 1440: Seitenleiste 248 px (Papier, Haarlinie rechts), Inhalt maximal 1240 px mit 48 px Rand.
- Zentrale: Kopf zweispaltig (Text | Bild 360 px), darunter Kennzahlen in 4 Spalten mit Linie in Tintenstärke oben und Haarlinien als Trenner, dann 2 Spalten im Verhältnis 1,25 : 1.
- Liste mit Vorschau: Spalten `1fr | 400px`. Das Panel reicht bis zum Bildschirmrand und klebt unter der Kopfleiste.
- Kundenakte: Kopf `1fr | 360px` mit Projektbild, Vorgangsleiste über 5 Spalten, Inhalt `1fr | 340px`.
- iPad (< 1280 px): Die Seitenleiste wird zur 64-px-Leiste mit Symbolen, Kennzahlen stehen 2 × 2, Spalten stapeln sich, das Panel ist 360 px breit und Nebenspalten (Quelle, Zuständig) fallen weg.

## Flächen, Linien, Schatten

- **Linie statt Kasten.** Abschnitte werden durch eine Haarlinie unter der Überschrift gegliedert, Zeilen durch Haarlinien. Kennzahlen liegen nie in Kästen.
- **Erhöhte Fläche nur, wenn etwas schwebt oder angefasst wird:** Vorschau-Panel, Karten der Tafel und Kassa-Kacheln (`raised` mit 1 px Innenlinie und `shadow-1`, beim Hover `shadow-2`).
- **Mulde (`sunk`)** für Suche, Segmentschalter, Dokument-Chips und den Hinweis „Nächster Schritt“.
- Radien: 6 px (Bedienelemente), 10 px (Bilder, Karten), 14 px (Kiosk). Pillen gibt es nur für Filter, Kategorien und Stufen.
- Schatten hell: `0 1px 2px / 0 8px 24px -6px`, warm getönt mit `rgba(28,27,24,…)`. Dunkel ersetzt den Schatten durch eine 1-px-Lichtkante.

## Ikonografie

- lucide-react mit 16 px und Strichstärke 1,6, im Kiosk 18–22 px mit 1,5. Die Farbe ist `ink-3`, nur das aktive Navigationselement bekommt den Akzent.
- Symbole stehen nur dort, wo sie das Erkennen beschleunigen (Navigation, Kontaktzeile, Zahlart). Zu Überschriften kommen keine Symbole.
- Bereiche zeigen ein Material-Swatch (10 px, Radius 3) statt eines Symbols. Projekte in der Seitenleiste haben einen Materialpunkt.

## Datenvisualisierung

- **Kennzahl = Zahl + Kontext + Verlauf:** Label im Satzbau, Display-Zahl, Delta mit Pfeil (Moos oder Ocker plus Text, nie Farbe allein), Vergleichsbasis, Sparkline (Linie 1,5 px mit 7-%-Fläche im Akzent oder dünne Balken, letzter Wert im Akzent).
- **Monatsbalken:** eine Serie in Tinte, das Vorjahr als 2-px-Strich, der laufende Monat im Akzent und direkt beschriftet. Es gibt eine Achse, ein gestricheltes Raster und eine Legende. Ein Tooltip erscheint beim Hover oder Fokus, für Screenreader liegt eine Tabelle dabei.
- **Phasen:** ein gestapelter Balken in einer einfarbigen Rampe hell → dunkel (geordnete Phasen), 2 px Lücke, Legende als Zeilen mit Anzahl und Wert.
- **Zahlungsplan:** dünner Meter (4 px) mit den Teilen bezahlt (Tinte), fällig (Akzent) und offen (Mulde) und einer Legende mit Beträgen.

## Bewegung

- Dauern: 120 ms (Hover, Farbe), 200 ms (Karten-Hebung), 320 ms (Panel), 700–900 ms (Bild-Zoom 1,025–1,04 beim Hover, sehr ruhig). Kurve `cubic-bezier(.22,1,.36,1)`.
- Das Vorschau-Panel gleitet beim ersten Öffnen 16 px herein, beim Wechsel blendet der Inhalt mit 4 px Versatz um (`key`-Wechsel).
- Status-Momente: Der aktuelle Schritt der Vorgangsleiste atmet (2,4 s), eine neue Warenkorbzeile blendet ein. „Scanner bereit“ steht still – neben Geld blinkt nichts.
- `prefers-reduced-motion: reduce` schaltet Animationen ab und setzt Übergänge auf ca. 0 ms. Ortswechsel stehen nur in `no-preference`.
- Fokus: 2 px Papier-Abstand plus 2 px Akzent-Ring auf allen Bedienelementen, auch auf Tabellenzeilen (Enter oder Leertaste öffnet die Vorschau).

## Komponentenbeispiele

- **Begrüßung:** Datum und Wetter als Mikro-Zeile, „Guten Morgen, Lena.“ in Newsreader 48, darunter ein Satz mit verlinkten Kunden statt Schnellaktionen-Knöpfen. Rechts das Projekt der Woche als Bild mit Bildunterschrift.
- **Agenda:** Zeit und Dauer, ein Farbstab (Akzent = Kundentermin, Grau = intern), eine „Jetzt“-Linie mit Uhrzeit-Pille, vergangene Termine auf 55 %.
- **Wartet auf Sie:** runder Abhak-Kreis, Aufgabe, Bezug, Herkunft, Betrag rechts in Tabellenziffern.
- **Gruppierte Liste:** Gruppenzeile mit Statuspunkt, Anzahl und Summe. Die Zeile zeigt Name (fett) mit Wunsch darunter, Bereich-Tag mit Material, Budget rechtsbündig, Quelle, Eingang relativ und Avatar. Die gewählte Zeile hat eine Akzentfläche und einen 2-px-Akzentstrich links.
- **Vorschau-Panel:** Status und Nummer (leise), Name in Serif, Kundenzitat kursiv mit Akzentlinie, Definitionsliste mit Haarlinien, Anhänge als Bildstreifen, Kasten „Nächster Schritt“ mit einer Hauptaktion.
- **Vorgangsleiste:** fünf Punkte auf einer Linie. Erledigt = Tinte gefüllt, aktuell = Akzent mit Halo, künftig = hohl. Darunter stehen Datum und Beleg mit Betrag.
- **Zeitleiste:** Tagesgruppen als Mikro-Zeile, Ereignis fett, Person leise, Zeit rechts. Belege als Mulden-Chip, Planungsbilder als Strecke (1,4 : 1 : 1).
- **Kassa:** Scanfeld (56 px), Kategorie-Pillen (44 px), Produktkacheln mit Foto oder Materialmuster, Warenkorb mit Mengen-Pille (36 × 32), Summe in Serif 40 px, Zahlart als Dreier-Segment, Bezahlknopf 64 px im Akzent mit Betrag.

## Do / Don't

| Do | Don't |
|---|---|
| Haarlinien, Weißraum, eine Linie in Tintenstärke über den Kennzahlen | Jede Fläche als umrandete Karte |
| Ein Akzent (gebrannte Erde) für „jetzt / wichtig / ausgewählt“ | Mehrere bunte Statusfarben als Flächen-Badges |
| Name und Wunsch laut, Nummer leise | Dokumentnummer als erste und lauteste Spalte |
| Kennzahl mit Vergleich, Ziel und Verlauf | Sechs gleich große Kästen mit VERSALIEN-Label |
| Echte Raum- und Materialbilder als Anker | Leere Riesen-Boxen mit Icon |
| Satz mit Links („zwei Angebote warten …“) | Knopfreihe „Schnellaktionen“ |
| Abwechslungsreiche, glaubwürdige Daten | 12 × derselbe Testname |
| Helle, leichte Seitenleiste auf Papier | Dunkler, schwerer Seitenleisten-Block |
| Warmes Papierweiß `#faf9f6` | Beiger Matsch-Hintergrund |

## Übertragung

- **Kiosk (iPad quer, Kassa, Packtisch, Montage):** gleiche Token, Touch-Ziele ≥ 44 px (Hauptaktion 64 px), Radius 14, Text 15–17 px, keine Hover-Abhängigkeit. Die Serif ist nur für Beträge und Summen da. Kopfleiste mit Ort, Verbindung, Uhrzeit und Kassier. Im Kiosk gibt es keine Seitenleiste.
- **iPhone (Außendienst, Montage, Inhaber unterwegs):** eine Spalte, Navigation als Leiste unten (Heute, Anfragen, Kunden, Suche). Begrüßung und Agenda zuerst, Kennzahlen als waagrecht wischbare Reihe mit je einer Zahl. Das Vorschau-Panel wird zum Sheet von unten. Die Zeitleiste bleibt unverändert, Bilder laufen in voller Breite.
- **Druck (Angebot, Auftragsbestätigung, Lieferschein, Montageprotokoll):** Papierweiß wird zu Reinweiß. Newsreader für Titel und Summen, Geist 9–10 pt für Positionen, Haarlinien 0,25 pt statt Tabellenrastern. Der Akzent erscheint nur bei der Gesamtsumme oder Fälligkeit. Wortmarke Bodoni oben links, Projektbild optional auf dem Deckblatt des Angebots. Keine Flächenfarben, damit der Druck auch in Schwarzweiß funktioniert.

## Nach Jury (04.11.2026, Ausgangsnote 6,5)

Alle 17 Pflichtänderungen und alle fünf Empfehlungen sind umgesetzt. Die neuen Regeln gelten ab sofort und gehen den älteren Abschnitten oben vor, wo sie sich widersprechen.

**Neue Regeln**

1. **Eine Kante.** Kopfleiste und Inhalt stehen in derselben Spalte (`max-width 1240`, `padding-inline 48`, iPad 32). Brotkrumen, H1, Tabellenkopf und erste Textspalte fluchten. Tabellenzeilen bluten 12 px nach links aus, damit Hover-Flächen Luft haben, der Text aber auf der Kante steht. Mit offenem Vorschau-Panel wird die Kopfleiste ebenfalls breit.
2. **Zwei Kopfebenen, überall.** Hauptspalte = H2 Newsreader 22/28 mit Haarlinie. Seitenspalte (Zentrale „Wartet auf Sie“, „Im Studio“, Kundenakte „Beträge“, „Bezüge“, „Im Auftrag“, Panel „Anhänge“) = Geist 13/18, 560, `ink-2`, Zahl in `ink-3`, 12 px bis zur Haarlinie. Hauptspalte zu Seitenspalte 1,55 : 1.
3. **Eine Chartregel.** Euro-Werte = Linie 1,5 px `ink-2` mit 7 % Fläche und Akzentpunkt am Ende. Stückzahlen = Balken 6 px, Abstand 3 px, `ink-4`, letzter Balken im Akzent. Alle Mini-Charts sind 32 px hoch und unten bündig. Jede Kennzahl hat 24 px Innenkante und eine Haarlinie links, auch die erste.
4. **Monatsbalken entschwert.** 18 px breit, Radius oben 2 px, `--at-bar` (hell ink-2, dunkel ink-3). Das Vorjahr ist ein hohler Ring (3,25 px) statt eines Strichs, er ist auf Balken und Papier lesbar. Der Dezember zeigt eine gestrichelte Zielsäule „Ziel 240“. Der Jahreswert steht in der Kopfzeile („2,14 Mio. € ↗ 12 % ggü. Vorjahr“) und es gibt keine Einzelbeschriftung des Maximums mehr.
5. **Status ohne Farbsalat.** Statustext ist immer `ink` (540), der Punkt kommt aus der Phasen-Rampe, nur „Neu“ trägt den Akzent. Das gilt in der Liste, auf der Tafel und im Panel.
6. **Tafel ohne Zufallsbilder.** Karten haben keine Fotos. Stattdessen gibt es oben einen 4-px-Materialstreifen in der Bereichsfarbe, Name mit Avatar, Wunsch in `ink-2` und eine Fußzeile mit Bereich und Budget hinter einer Haarlinie (keine Ellipsen).
7. **Avatare.** Mindestens 24 px, Initialen Geist 10/600. In Stapeln 28 px, −6 px Überlappung, 2-px-Papierring, höchstens drei plus „+n“. Systemereignisse (Angebot geöffnet, Zahlung, Webanfrage) zeigen ein Symbol in der Mulde statt erfundener Initialen.
8. **Anhänge sind Inhalte.** Titel im Satzbau („Lobby Bestand“, „Zimmer 214 Bestand“, „Grundrisse OG 1–3“), darunter Art und Umfang in `ink-3` („PDF · 3 Seiten“), zwei Zeilen mit `line-clamp`. PDFs zeigen eine Grundriss-Miniatur in Haarlinien auf der Mulde mit 1-px-Rand.
9. **Wortmarke.** Bodoni Moda ohne Sperrung, `font-kerning: normal`, `"kern" 1, "liga" 1`, optische Größe fest auf `opsz 28` (die automatische kleine optische Größe hat die Lücke „s|ch“ verursacht). „Studio“ steht auf derselben Grundlinie. In der 64-px-Leiste steht ein Bodoni-„P“.
10. **Kopfleiste.** Auf jeder Seite in derselben Reihenfolge: Brotkrumen · Suche „Suchen ⌘K“ (32 px) · Glocke · „Neu ▾“ (primär, 32 px). Der Themenschalter liegt im Benutzermenü (Seitenleiste unten, in der Kassa oben rechts), zusammen mit Einstellungen und Abmelden.
11. **Kundenkarte.** Keine Pille, kein Icon: 10-px-Messing-Swatch `#b2965a` (Radius 3) mit Text 13/18 `ink-2` („Kundenkarte Gold · 4.860 Punkte“). Die Kundennummer wandert aus der Kopfleiste in diese Zeile.
12. **Vorgangsleiste.** Die Spur läuft genau von Mitte erstem bis Mitte letztem Punkt (80 % der Breite). Der Fortschritt endet bei aktuellem Punkt plus Anteil (Lieferung 2 von 4 Teilen = 70 %) mit einer kleinen Akzentmarke und der Beschriftung „2 von 4 Teilen“ direkt darüber.
13. **Zeitleiste.** Die Linie wird pro Eintrag gezeichnet und endet exakt am letzten Punkt. Tagesgruppen sind Seitenkopf-Typo mit kleinem Quadrat, „Sommer“ heißt jetzt „Juni – Juli“.
14. **Agenda.** Vergangenes wird nicht mehr über Deckkraft gedimmt, sondern über Text `ink-3` und Stab `ink-4` (AA bleibt erhalten). „Im Studio“ hat höchstens einen fetten Lauf pro Zeile.
15. **iPad.** Unter 1280 px bleiben Kennzahlen vierspaltig (Display 34 px) und alle Paare zweispaltig `1fr 1fr` mit 32 px Abstand. Erst unter 900 px wird gestapelt. Bildunterschriften sind zweizeilig (Titel, darunter „Esszimmer · Teil 3, KW 47“) mit `nowrap` und Ellipse. Projektpunkte entfallen in der Symbolleiste.

**Kassa**

- **Produktbild:** echte, freigestellte Herstellerfotos (Flos Bellhop, Kähler Hammershøi, Cire Trudon, Tom Dixon Melt und Stone, Zalto Bordeaux und Axium) als unveränderte Kopien. Sie stehen 1 : 1 mit `contain`, 12 % Innenabstand und `mix-blend-mode: multiply` auf `--at-plate`, damit der weiße Studiogrund im Papierton aufgeht. Artikel ohne Foto zeigen Marke und Namen zentriert in Geist 13/18 und einen 10-px-Materialpunkt unten links, dessen Farbe zum Material passt (Erle schwarz `#2a2622`). Es gibt kein Kursivwort und keine Verlaufsfläche mehr.
- **Typo:** Name 16/22 (560), Meta 14/20 `ink-3` (in der Kachel nur Marke und ein Merkmal, damit nichts abgeschnitten wird), Preis Newsreader 20/24. Im Warenkorb sind Name und Meta gleich groß, Beträge stehen in Serif 20.
- **Menge:** eine Pille „2 im Korb“ in der Preiszeile (24 px, `accent-soft` mit Akzenttext) statt eines schwarzen Kreises auf dem Foto.
- **Raster:** 24 px Luft unten und ein 32-px-Verlauf zu Papier, die Kategorien laufen rechts weich aus.
- **Dunkel:** Die Mulden werden mit `brightness(.72) saturate(.9)` gedimmt, bleiben aber als Gruppe ruhig. Der Bezahlknopf ist `#b8603d` mit `#fff7f2` (4,7 : 1), Hover `#c56a45`. Der Rabatt steht in beiden Modi in `ink-2`.
- „Scanner bereit“ blinkt nicht mehr.

**Bildbudget (12):** 5 Raumbilder (Esszimmer, Wohnraum, Küche Eiche, Sofa-Lounge, Leuchten) für Anker, Anhänge, Zeitleiste und Aktivität, dazu 7 freigestellte Produktfotos für die Kassa. Die Übersichtskachel „Kassa“ zeigt ein Produkt auf der Mulde und kein Raumbild.

**Selbstprüfung nach der Überarbeitung:** Alle 9 Ansichten wurden hell und dunkel neu fotografiert (`backoffice/qa-screenshots/entwurf-atelier/`). Die Wortmarke wurde zusätzlich in dreifacher Vergrößerung geprüft. Offen bleiben die Punkte, die die Jury selbst außerhalb des Entwurfs sieht: eigenes Produktfoto-Material im Platzhirsch-Licht und ein echter Test an der Theke.
