# Jury · Richtung „Showroom“

Stand 04.11.2026 · Jury-Rolle: Executive Creative Director (Produktdesign, Kunden wie Stripe, Linear, Apple)
Grundlage: alle 24 Screenshots in `backoffice/qa-screenshots/entwurf-showroom/`, `art-direction/showroom.md`, Stichproben in `src/app/entwurf/showroom/showroom.css`

## Urteil

**Note: 6 / 10. Ohne Zögern als Agenturarbeit präsentieren: nein.**

Die Richtung stimmt: warme Materialpalette, Bild als Objekt, „Zahl + Vergleich + Satz“, der Tagesablauf und die Kundenakte mit Vorgangsleiste sind gute Ideen. Ausgeführt wirkt das Ganze aber wie ein sehr gutes Dribbble-Template und nicht wie ein Produkt. Den Ausschlag geben keine großen Fehler, sondern viele kleine. Abgeschnittener Text ist überall, Spaltenraster wechseln von Abschnitt zu Abschnitt, Kartenhöhen enden ungleich, um jede Fläche liegt eine Karte, Bilder wiederholen sich, der Kiosk ist halb leer, und Filter widersprechen den angezeigten Daten. Ein Kunde wie Linear sieht so etwas in drei Sekunden. Genau das ist mit „sieht aus, als hätten es Amateure gemacht“ gemeint: Die Idee ist professionell, die Detailtreue nicht.

## Bewertung nach Kriterien

| Kriterium | Note | Kurzbefund |
|---|---|---|
| Hierarchie | 6 | Begrüßung und Tag sind klar. Danach haben alle Abschnitte dasselbe Gewicht, und die Kundenakte stapelt 7 Karten gleich laut. |
| Typografie | 5 | Es sind drei Familien (Bodoni, Fraunces SOFT, Inter). Fraunces SOFT wirkt gemütlich-redaktionell, nicht nach Minotti/B&O. Die Bodoni-Wortmarke zerfällt bei 14–15 px (Haarstriche brechen, „H“ liest sich wie „II“). |
| Rhythmus/Abstände | 5 | Spaltenbreiten springen (Zentrale oben 654/422, unten 538/538). Kartenunterkanten liegen nicht auf einer Linie (Dein Tag 613 vs. Wartet 577; Liste 917 vs. Panel 945; Aktivität 1880 vs. Showroom 1848). |
| Farbe | 7 | Die Palette ist stark, Leder als Akzent trägt. Die Kundenkarte „Eiche“ ist aber im Leder-Verlauf gefärbt, Bedeutung und Material passen also nicht zusammen. |
| Detailtreue | 4 | Durchgehend Ellipsen in einer 1440er-Liste, abgeschnittene Avatar-Initialen in Stapeln, Silbentrennung „7- / teilig“, Telefonnummer bricht um, Lichtkante unter Projektbildern im Dunkeln, Zahlenformat uneinheitlich („1 240 Punkte“ vs. „1.290,00 €“). |
| Datenpräsentation | 6 | Das Prinzip „Zahl + Satz“ ist sehr gut. Die Vorjahres-Geisterbalken sind unsichtbar (Hell und Dunkel), die Y-Achse hat keinen Bezugswert, und der Meter im Dunkeln wirkt lachsfarben-oliv. |
| Bewegung | 7 | Die Tokens sind sauber (140/260/420, Feder) und reduced-motion ist bedacht. Im Standbild ist nichts davon sichtbar zu prüfen, eine Abwertung gibt es dafür nicht. Ein Risiko: Gestaffeltes Einsteigen auf jeder Seite wird im Arbeitsalltag lästig. |
| Markenpassung | 6 | Bilder und Wärme stimmen. Fraunces, Pillen-Chips überall und der Avatar mit Kupferverlauf ziehen das Ganze Richtung Lifestyle-App statt Einrichtungshaus der Oberklasse. |
| Dunkelmodus | 6 | Warmes Schwarz ist gut gewählt. Alle Kartenflächen sind aber fast gleich dunkel (#1c1a18 auf #121110), Ebenen sind kaum zu lesen, die Avatare versinken und die Akzentbalken wirken pfirsichfarben. |
| Kiosk | 5 | Die Anlage stimmt (Zweispalter, Suche oben, Bezahlen 60 px). Rund die Hälfte der sichtbaren Kacheln sind aber leere Platzhalter mit kleinem Linien-Icon, der Plus-Knopf hat 30 px (eigene Vorgabe: mindestens 40), die Kategorien werden auf dem iPad ohne Fade abgeschnitten („Duft &“), und die Preiszeilen springen je nach Namenslänge. |

## Pflichtänderungen (vor jeder Präsentation)

### A · Raster und Kanten

1. **Zentrale, Spaltenraster.** Problem: Oben ist das Raster 1,55 : 1, unten (Aktivität/Showroom) 1 : 1, deshalb laufen die Kanten bei x=834/862 und x=950/978 auseinander. Lösung: Ein 12-Spalten-Raster mit 24 px Gutter für alle Abschnitte. Oben 7 | 5, unten ebenfalls 7 | 5, Projekte 4 × 3.
2. **Gleiche Unterkanten.** Problem: Nebeneinanderliegende Karten enden auf unterschiedlicher Höhe (Zentrale oben 613/577, unten 1880/1848, Anfragen-Liste 917 vs. Panel 945). Lösung: `align-items: stretch` im Raster und Karten mit `height: 100%`. In „Wartet auf dich“ die 4 Zeilen mit `flex: 1` verteilen, oder einen fünften Eintrag bzw. einen Fuß („Alle 12 Aufgaben →“) ergänzen. Das Panel als `position: sticky; top: 80px; max-height: calc(100vh - 96px)` mit internem Scroll bauen.
3. **Kopfzeile Zentrale.** Problem: Die Knöpfe „Termin / Neue Anfrage“ hängen an der Unterkante des Absatzes und haben keinen Bezug zur Überschrift. Lösung: Die Knöpfe auf die Grundlinie von „Guten Morgen, Lena.“ setzen (gleiche Flex-Zeile, `align-items: last baseline`), den Absatz darunter auf `max-width: 62ch`.

### B · Text und Detailtreue

4. **Anfragen-Liste, Ellipsen.** Problem: Bei 1440 px sind 7 von 10 Zeilen abgeschnitten („Ingrid Sauter, Dire…“, „Mas…“), weil die Liste nur rund 680 px hat. Lösung: Die Zeile 1 nur aus Name plus Ort bilden und die Firmen-Rolle in Zeile 2 verschieben. Die Spalte Budget auf 96 px fix (rechtsbündig, tnum), Status auf 112 px, Eingang auf 72 px. Das Panel bei < 1536 px von 400 auf 360 px reduzieren. Ziel ist null Ellipsen im Präsentationsdatensatz.
5. **Avatar-Stapel.** Problem: Die Initialen sind im Stapel abgeschnitten („MC“, „DW“ in den Projektkacheln). Lösung: 24 px Durchmesser, Überlappung −6 px statt rund −10 px, ein 2-px-Ring in `--surface`, Initialen 10 px/600 mit `letter-spacing: 0`.
6. **Zahlenformat.** Problem: „1 240 Punkte“ steht neben „1.290,00 €“. Lösung: Überall `Intl.NumberFormat('de-AT')`, also „1.240 Punkte“. Beträge in Listen ohne „,00“, wenn ganzzahlig (Kassa ausgenommen).
7. **Umbrüche.** Problem: „Outdoor-Lounge, 7- / teilig“, „+43 664 218 30 / 77“, „Bregenz- / Vorkloster“ (iPad). Lösung: `hyphens: manual`, Telefonnummer und Ort mit `white-space: nowrap`, die Faktenspalten im Panel auf `grid-template-columns: 1fr 1fr` mit `minmax(0,1fr)` plus Ellipse nur als Notfall. In „Größte Positionen“ den Titel auf 1 Zeile mit Zusatz in Zeile 2 begrenzen.
8. **Projektkacheln im Dunkeln.** Problem: 1 px helle Kante zwischen Bild und Karteninhalt, und die Bildecke oben rechts ist unsauber (Hell, Kachel 1). Lösung: Bild in einen Container mit `overflow: hidden; border-radius: 20px 20px 0 0`, Bild auf `display: block` (Inline-Lücke) und Höhe auf ganze Pixel.
9. **„Wartet auf dich“, Aktionen.** Problem: Reiner Text rechts mit wechselnder Breite, „Kunden info.“ wirkt wie abgeschnitten. Lösung: Ghost-Button (Höhe 32, Padding 0 12, `--fill` beim Hover, Radius 999) mit fester Mindestbreite 96 px. Das Label in „Informieren“ ändern (Verb vor Substantiv, wie in eurer eigenen Regel).
10. **Wortmarke.** Problem: Bodoni Moda bei 14–15 px, die Haarstriche zerfallen („PLATZHIRSCII“ im Kassa-Kopf). Lösung: Die Wortmarke als SVG vom Website-Logo einsetzen, oder Bodoni Moda mit `opsz` 28 bei mindestens 17 px und Gewicht 600 verwenden.

### C · Typografie und Marke

11. **Display-Schrift.** Problem: Fraunces SOFT 100 liest sich weich-redaktionell (Kochbuch/Newsletter) und konkurriert mit der Bodoni-Wortmarke, damit sind es drei Stimmen. Lösung: Entweder Fraunces mit `SOFT 0, WONK 0`, opsz 72, Gewicht 300 und −0,025 em (straffer, näher an Didone), oder Display ganz auf Inter Display 600 / −0,03 em und Serif nur in der Wortmarke. Vor der Präsentation beide Varianten am Kundenakte-Kopf zeigen.
12. **Avatar Kundenakte.** Problem: 104 px Kupferverlauf mit weißen Fraunces-Initialen wirkt wie ein Profilbild von 2015 und ist das lauteste Element der Seite. Lösung: 88 px, Fläche `--surface-sunk`, Initialen in `--text-2`, Ring 4 px `--canvas`. Wenn ein Kundenfoto oder Projektbild vorhanden ist, dieses verwenden.
13. **Kundenkarte „Eiche“.** Problem: Das Material heißt Eiche, die Fläche ist aber Leder/Cognac. Lösung: Jede Stufe bekommt ihren Materialton (Eiche `#b08850 → #8a6a3a`, Nussbaum `#6b4a33 → #4a3222`, Leder nur für die höchste Stufe), Maserung 6 % Deckkraft.

### D · Kartensuppe und Hierarchie

14. **Kundenakte, Zeitleiste.** Problem: Jeder Eintrag ist eine Karte mit Schatten, rechts kommen drei weitere Karten dazu, insgesamt 8 gleichlaute Kästen, und das verstößt gegen die eigene Regel „keine Karte um jede Fläche“. Der letzte Eintrag hat dagegen keine Karte, ein Bruch. Lösung: Zeitleisteneinträge ohne Karte (nur Titel 14/600, Text 14/400, Haarlinie zwischen Tagen), nur Medien (Renderings, PDF) mit Radius 14. Rechts nur „Beträge“ als Blatt, „Größte Positionen“ und „Bezüge“ als Abschnitte ohne Hintergrund, mit 40 px Abstand.
15. **Renderings-Reihe.** Problem: Drei Bilder mit unterschiedlicher Breite (255/183/182). Lösung: `grid-template-columns: repeat(3, 1fr)`, `aspect-ratio: 4/3` und einheitlicher Radius 10.
16. **Vorgangsleiste.** Problem: Die Verbinder beginnen hinter dem Label statt zwischen den Knoten, im aktiven Schritt bleibt ein 10-px-Stummel, und die Unterzeilen brechen ungleich. Lösung: Die Knoten (28 px) auf einer gemeinsamen Linie bei y = Mitte des Knotens, der Verbinder als durchgehender 1-px-Strich hinter den Knoten (`--line-2`, erledigt in Salbei). Labels und Unterzeile darunter zentriert unter den Knoten, Unterzeile auf `max-width: 18ch`, und die aktive Fläche ohne eigene Box, nur Knoten in Leder plus „läuft“.
17. **Cover-Aktionen.** Problem: Die Glas-Chips „Anrufen / E-Mail“ auf dem unruhigen Bild sind schwer lesbar. Lösung: Unteren Verlauf auf dem Cover (0 → 55 % `#1f1c19`, untere 45 %), Chips `rgba(20,18,16,.55)` + Blur 16, Text 13/600 weiß.

### E · Daten

18. **Umsatz-Balken.** Problem: Die Vorjahres-Geisterbalken sind praktisch unsichtbar, die Legende verspricht einen Vergleich, den man nicht sieht. Es gibt keinen Bezugswert. Lösung: Ghost hell `rgba(31,28,25,.14)`, dunkel `rgba(243,239,233,.16)`, 62 % Breite, um 20 % nach links versetzt hinter dem aktuellen Balken. Zwei Gitterlinien (50 und 100 Tsd.) in `--line` mit Wert links in 11,5 px `--text-3`. Den Monat mit dem Maximalwert direkt beschriften.
19. **Meter im Dunkeln.** Problem: Die aufgehellten Materialtöne wirken lachs/oliv/mint. Lösung: Im Dunkeln die Punktfarben der hellen Palette nehmen, um 8 % aufgehellt, nicht die Textfarben (`#b9774d`, `#c09a62`, `#7f9a7a`, `#5f7d7a`).
20. **Filter muss stimmen.** Problem: Der Chip „Team Wohnen“ ist aktiv, die Liste zeigt aber Küche, Bad, Kanzlei und Yacht. Lösung: Den Präsentationsfilter entfernen, oder die Daten so filtern, dass er stimmt. Ein sichtbar falscher Filter kostet die gesamte Glaubwürdigkeit.
21. **Wiederholte Bilder.** Problem: Dasselbe Sichtbeton-Bild steht auf zwei Tafelkarten (Moosbrugger, Kalb), dazu im Showroom-Teaser und in der Kassa. Das Esstischbild erscheint dreimal. Lösung: Für die Präsentation mindestens 16 verschiedene Motive, kein Bild doppelt pro Bildschirm.
22. **Tafel „Hinzufügen“.** Problem: Das Icon zeigt „Person hinzufügen“, gemeint ist „Anfrage hinzufügen“. Lösung: `Plus` 16 px und Label „Anfrage“, als Ghost-Zeile mit gestrichelter 1-px-Kontur `--line-2`, Radius 14, Höhe 40.

### F · Dunkelmodus

23. **Ebenen.** Problem: Canvas `#121110` und Surface `#1c1a18` liegen zu nah beieinander, die Karten verschwimmen, weil Schatten im Dunkeln nicht tragen. Lösung: Surface `#211e1b`, Kontur `inset 0 0 0 1px rgba(243,239,233,.07)` plus oberer Lichtrand `inset 0 1px 0 rgba(243,239,233,.05)`, Pane `rgba(36,33,29,.78)`.
24. **Avatare und Chips im Dunkeln.** Problem: Die Materialflächen der Avatare sind bei rund 13 % kaum sichtbar. Lösung: Fläche 22 % Materialton, Initialen in der dunklen Textfarbe der Palette.

### G · Kiosk

25. **Platzhalterkacheln.** Problem: 6 von 12 sichtbaren Kacheln sind Verlaufsfläche mit einem 32-px-Linien-Icon und wirken unfertig. Lösung: Für die Präsentation nur Artikel mit Foto zeigen. Für Artikel ohne Foto ein Freisteller auf `--surface-sunk` oder ein Materialfoto (Stoffmuster, Duftflakon), das Icon 56 px mit Strichstärke 1,25 und darunter die Materialangabe als Text.
26. **Tippziele.** Problem: Der Plus-Knopf auf der Kachel hat 30 px (`.sr-prod__add`), Mengen-Stepper und × im Warenkorb rund 28 px. Lösung: Plus 44 × 44, Stepper-Segmente 44 × 40, und die ganze Kachel tippbar machen (das tut sie schon). Das Plus ist dann nur Hinweis.
27. **Kachelraster.** Problem: Auf dem iPad bricht der Titel zweizeilig um, dadurch springen die Preiszeilen (y=420 vs. 411). Lösung: Titel `-webkit-line-clamp: 2` mit fester Höhe `2 × 20 px` und den Preis an der Kachel-Unterkante verankern.
28. **Kategorien.** Problem: Auf dem iPad hart abgeschnitten („Duft &“). Lösung: Maskenverlauf rechts 32 px (`mask-image: linear-gradient(90deg,#000 calc(100% - 32px),transparent)`) und `scroll-snap`, oder Kategorien als zweite Zeile.
29. **Auswahlzustand.** Problem: Der 2-px-Lederrahmen um ausgewählte Kacheln ist laut und konkurriert mit dem Mengen-Badge. Lösung: Nur das Badge plus `box-shadow: 0 0 0 2px var(--accent-soft)`, kein harter Rahmen.
30. **Bezahl-Sheet.** Problem: „Zahlung bestätigen“ bei Kartenzahlung ist ein Widerspruch, das Terminal bestätigt selbst. Das Signal „|||“ ist unklar. Lösung: Bei Karte/Wallet den Primärknopf weglassen und den Terminal-Status als Hauptzustand zeigen (Welle animiert, „Warte auf Karte …“). Den Primärknopf nur bei Bar („Rückgeld berechnen“) und Rechnung („Rechnung erstellen“).

## Was bleiben soll

- Tagesablauf mit Bild, „Jetzt · noch 32 Min.“ und gedimmter Vergangenheit, das stärkste Element.
- „Zahl + Vergleich + Satz“ bei den Kennzahlen.
- Vorschau-Panel mit Original-Nachricht als Zitat und zwei Verb-Aktionen.
- Kundenakte mit Vorgangsleiste als Konzept, Beträge mit Zahlungsplan-Meter.
- Materialpalette mit gemessenen Kontrasten und Status als Punkt + Wort.
- Kassa-Aufbau (Suche oben, Frost-Warenkorb, Summe groß, Bezahlen 60 px).

## Fazit

Konzept 8, Ausführung 5. Die Richtung ist präsentierbar, der Stand nicht. Mit den Punkten A, B, D, E20/21 und G25/26 (etwa 2–3 Tage) erreicht der Entwurf eine 8. Erst dann würde ich ihn ohne Zögern vor einen Kunden legen.
