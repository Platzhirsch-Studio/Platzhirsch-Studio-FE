# Jury: Backoffice-Richtung „Atelier“

Juror: Executive Creative Director, Produktdesign
Grundlage: alle 19 Screenshots in `backoffice/qa-screenshots/entwurf-atelier/` (hell/dunkel, 1440 und iPad 1180), `atelier.md`, Stichprobe in `atelier.css` und `components/Entwurf/Atelier/data.js`
Datum: 04.11.2026

## Urteil

**Note: 6,5 / 10. Nicht ohne Zögern präsentierbar.**

Das Fundament stimmt. Die Token sind sauber, Newsreader und Geist passen gut zusammen, die Daten sind glaubwürdig (keine 12 × „Max Mustermann“), und die Liste mit Vorschau-Panel, die Kundenakte mit Vorgangsleiste und der Monatsbalken mit Vorjahresstrich sind fachlich richtig gedacht. Das ist kein Amateur-Entwurf, sondern ein ordentliches Template-Niveau, etwa „gutes Tailwind-UI mit Serif“.

Agenturniveau ist es trotzdem nicht. Ein Kunde wie Linear oder Stripe würde in den ersten 30 Sekunden diese Dinge sehen:

1. **Platzhalter, die wie Platzhalter aussehen.** In der Kassa sind 8 von 12 Kacheln Farbflächen mit einem kursiven Wort („Merino“, „Stahl“, „Erle“). Der „Eames House Bird, Erle schwarz“ wird als *hellbeige* Fläche gezeigt. Im Panel heißen Anhänge `wohnraum` und `sofa-lounge` (Dateinamen in Kleinschrift), und die dritte Kachel ist ein graues Feld mit Dokument-Icon.
2. **Kanten, die nicht fluchten.** Kopfleiste und Inhalt stehen auf verschiedenen linken Kanten, die Vorgangsleiste läuft über den letzten Punkt hinaus, auf der Übersicht stehen Titel mitten unter dem Bild.
3. **Uneinheitliche Hierarchie.** Abschnittsköpfe sind auf „Heute“ Newsreader 22 und in der Kundenakte Geist 14 fett. Unter den Kennzahlen stehen zweimal Linien und zweimal Balken, ohne Regel dahinter.
4. **Zu viel Schwere an den falschen Stellen.** Die schwarzen Balken im Auftragseingang sind die dunkelste Fläche der ganzen Zentrale, und der Bezahlknopf im Dunkelmodus wirkt lachsfarben-pastellig.

Diese Fehler sind einzeln klein. Zusammen ergeben sie genau den Eindruck, den der Inhaber beschreibt: „wie von Amateuren gemacht“. Das liegt nicht an der Richtung, sondern an fehlender Detailarbeit im letzten Schritt.

## Bewertung nach Kriterien

| Kriterium | Note | Kurzbegründung |
|---|---|---|
| Hierarchie | 6 | Die Begrüßung und die Kennzahlen funktionieren. Darunter wird alles gleich laut: Agenda, Aufgaben, Chart, Phasen und Aktivität stehen als fünf gleichwertige Blöcke untereinander. Die Kundenakte wechselt das Kopfsystem. |
| Typografie | 7 | Die Paarung ist gut, Tabellenziffern sind konsequent. Abzüge: die Wortmarke „Platzhirsch“ zeigt sichtbar eine Lücke zwischen „s“ und „ch“ (Tracking 0,02em auf Bodoni), Initialen in Avataren mit 8–9 px sind unlesbar, und das Zitat im Panel hat 5 Zeilen Kursiv-Serif, was beim zweiten Lesen ermüdet. |
| Rhythmus / Abstände | 6 | Die Abschnitte haben genug Luft, aber oben auf der Zentrale liegen ca. 50 px totes Weiß über dem Text, weil Bild und Text verschieden ausgerichtet sind. Auf dem iPad wird alles einspaltig gestapelt (2.950 px Seitenhöhe), obwohl 1.116 px Breite vorhanden sind. |
| Farbe | 7 | Das Papierweiß ist warm und nicht matschig, der Akzent ist sparsam. Brüche: Die Spaltenköpfe der Tafel nutzen vier Statusfarben, „Angebot offen“ ist ockerfarbener Text, und das Gold-Badge der Kundenkarte ist eine senfgelbe Pille, die billig wirkt. |
| Detailtreue | 5 | Siehe Pflichtänderungen 1–8. Das ist der Hauptgrund für die Note. |
| Datenpräsentation | 7 | Der Monatsbalken ist vorbildlich, die Kennzahlen haben Kontext, und die Gruppensummen in der Liste sind gut. Abzüge: die Mini-Charts sind ohne Regel gemischt, das erste Phasensegment (`#dcd6ca` auf `#faf9f6`, ca. 1,3 : 1) ist fast unsichtbar, und die Phasen-Zählwerte schweben in Serif 22 mitten in der Zeile. |
| Bewegung | 7 | Der Code ist sauber: eine einheitliche Kurve, `reduced-motion` wird beachtet, das Panel gleitet, die Pulse sind dezent. Abzug für `transition: all` am Segmentschalter (`atelier.css:302`) und für das Blinken bei „Scanner bereit“, das neben Geld zu nervös wirkt. In den Screenshots ist die Bewegung nicht prüfbar. |
| Markenpassung | 7 | Echte Raumbilder als Anker sind richtig, und der Satz mit verlinkten Kunden statt Schnellaktionen ist eine gute Idee. Die Kassa verliert die Marke: Farbkacheln mit Kursivwort sehen wie ein Webshop-Platzhalter aus, nicht wie ein Showroom. |
| Dunkelmodus | 6 | Liste, Tafel und Akte sind gut. Abzüge: Die hellen Materialkacheln der Kassa (Erle, Feige, Merino) werden nicht gedimmt und leuchten als größte Flächen. Der Bezahlknopf ist `#dd8a66` mit dunkler Schrift und wirkt pastellig. Die Chartbalken in Hellbeige dominieren die Zentrale. „−60,85 €“ ist im Dunkelmodus grün, im Hellmodus neutral. |
| Kiosk | 6 | Die Touch-Ziele stimmen (Pillen 44, Bezahlen 64, Scan 56). Abzüge: Die Produktmeta ist 13 px groß, Namen 14–15 px, gegen die eigene Vorgabe von 15–17 px. Die Mengen-Badges sind schwarze Kreise auf dem Foto, und die unterste Kachelreihe ist hart abgeschnitten, ohne Verlauf oder Abstand. |

## Pflichtänderungen

Die Reihenfolge entspricht der Wirkung. 1–8 sind Bedingung für eine Präsentation.

### 1. Kassa: keine Farbflächen als Produktbild
- **Ort:** `/entwurf/atelier/kassa`, Produktraster und Warenkorb, Daten in `components/Entwurf/Atelier/data.js` (`mat: [...]`).
- **Problem:** 8 von 12 Kacheln sind Verlaufsflächen mit Kursivwort. Das ist das deutlichste Amateur-Signal im ganzen Entwurf. „Eames House Bird · Erle schwarz“ wird hellbeige gezeigt, Name und Bild widersprechen sich.
- **Lösung:** Jede Kachel bekommt ein echtes, freigestelltes Produktfoto auf `--at-sunk` (Hell `#f3f1ec`, Dunkel `#1f1d1a`), Seitenverhältnis 1 : 1, `object-fit: contain`, Innenabstand 12 %. Wo kein Foto da ist, gibt es kein Kursivwort, sondern Marke und Name zentriert in Geist 13/18 `ink-3` auf `--at-sunk` und einen 10-px-Materialpunkt unten links. Die Farbe des Materialpunkts muss zum Text passen (Erle schwarz = `#2a2622`).

### 2. Gemeinsame linke Kante für Kopfleiste und Inhalt
- **Ort:** alle Desktopseiten. Die Kopfleiste beginnt bei x = 269/280 („Heute“, „Vertrieb > Anfragen“), Inhalt und H1 bei x = 285/296.
- **Problem:** 16 px Versatz zwischen Breadcrumb und Seitentitel. Das sieht man sofort, wenn man es einmal gesehen hat.
- **Lösung:** Kopfleiste und Inhalt bekommen dasselbe `padding-inline: 48px` innerhalb derselben `max-width: 1240px`-Spalte. Breadcrumb, H1, Tabellenkopf und erste Textspalte stehen auf einer Kante.

### 3. Vorgangsleiste: Linie endet am letzten Punkt
- **Ort:** `/entwurf/atelier/kunde`, Vorgangsleiste (hell und dunkel, Desktop und iPad).
- **Problem:** Die Punkte stehen linksbündig in fünf Spalten, die Linie läuft aber über die volle Breite. Nach „Service“ hängen 213 px Linie ins Leere.
- **Lösung:** Die Linie geht von der Mitte des ersten bis zur Mitte des letzten Punkts: `left: 6px; right: calc(20% - 6px)`. Alternativ sitzt der letzte Punkt rechtsbündig mit rechtsbündigem Text. Der Fortschrittsteil endet genau am aktuellen Punkt plus Anteil (2/4 Teile = 50 % der Strecke bis „Service“), mit einer Beschriftung „2 von 4“ direkt am Ende des Strichs.

### 4. Ein Kopfsystem für alle Abschnitte
- **Ort:** Kundenakte, rechte Spalte („Beträge“, „Bezüge“, „Im Auftrag“) gegenüber „Heute“, „Wartet auf Sie“ und „Auftragseingang“ auf der Zentrale.
- **Problem:** Zwei Hierarchiesysteme in einem Produkt: Newsreader 22 und Geist 14/560.
- **Lösung:** Hauptspalten-Abschnitte nutzen H2 Newsreader 22/28. Seitenspalten-Abschnitte nutzen überall Geist 13/18, Gewicht 560, `ink-2`, 12 px Abstand zur Haarlinie. Das wird so in `atelier.md` festgeschrieben und auf allen vier Seiten durchgezogen. Die Zentrale („Wartet auf Sie“, „Im Studio“) ist dann ebenfalls Seitenspalte.

### 5. Kennzahlen: eine Mini-Chart-Regel
- **Ort:** Zentrale, Kennzahlenreihe.
- **Problem:** Umsatz und offene Angebote zeigen eine Linie, Auftragseingang und Anfragen zeigen Balken. Der letzte Balken bei „Neue Anfragen“ ist ein 32 × 30 px großer Block in Akzent, die schwerste Fläche der Reihe.
- **Lösung:** Werte (€) bekommen eine Linie 1,5 px mit 7 % Fläche, Zählungen (Stück) bekommen Balken. Alle Charts haben eine einheitliche Höhe von 32 px, Balkenbreite 6 px, Abstand 3 px, letzter Balken Akzent bei 100 % Deckkraft und alle anderen `ink-4`. Der Auftragseingang (€) wird zur Linie. Alle vier Kennzahlen haben dasselbe Innen-Padding links (24 px, auch die erste Spalte).

### 6. Auftragseingang: Balken entschweren
- **Ort:** Zentrale, Monatsbalken (hell: `ink` fast schwarz; dunkel: Hellbeige).
- **Problem:** Elf schwarze Balken von 24 px Breite sind die dunkelste Masse der Seite. Sie sind schwerer als die Begrüßung und ziehen den Blick vom Inhalt weg. Nur „276“ ist beschriftet, ohne erkennbaren Grund.
- **Lösung:** Hell `#55514a` (`ink-2`), dunkel `#948d81` (`ink-3`), Breite 18 px, Radius oben 2 px. Der laufende Monat bleibt im Akzent. Statt des Maximums wird der Jahreswert direkt beschriftet („2,14 Mio. · +12 % ggü. Vorjahr“) in der Kopfzeile des Charts. Dezember bekommt eine gestrichelte Zielmarke statt eines einsamen Vorjahresstrichs.

### 7. Panel-Anhänge wie echte Dokumente
- **Ort:** `/entwurf/atelier/anfragen`, Vorschau-Panel, „Anhänge“.
- **Problem:** Die Beschriftungen `wohnraum` und `sofa-lounge` sind Dateinamen in Kleinschrift. Die PDF-Kachel ist ein leeres graues Feld mit Icon, „Grundrisse_OG1-OG3…“ wird abgeschnitten.
- **Lösung:** Die Beschriftungen werden zu Inhalt in Satzbau: „Lobby Bestand“, „Zimmer 214 Bestand“. Die PDF-Kachel zeigt eine Miniatur der ersten Seite (Grundriss, `--at-sunk`-Hintergrund, 1 px `rule`), darunter „Grundrisse OG 1–3“ und `ink-3` „PDF · 3 Seiten“ in Geist 12/16. Text wird mit zwei Zeilen und `line-clamp` statt Ellipse nach 20 Zeichen gesetzt.

### 8. Übersicht: Titel bündig zum Bild
- **Ort:** `/entwurf/atelier/` (Startseite des Entwurfs).
- **Problem:** „01 Heute“ steht bei x = 388, das Bild beginnt bei x = 228. Die Titel stehen mittig unter einem linksbündigen Bild, die Unterzeile rechtsbündig. Drei Ausrichtungen in einer Zeile.
- **Lösung:** Nummer und Titel stehen linksbündig auf der Bildkante (x = 228), die Unterzeile rechtsbündig auf der Grundlinie des Titels. Der Abstand zum Bild beträgt 16 px und zur Haarlinie 16 px.

### 9. Wortmarke korrekt setzen
- **Ort:** Seitenleiste und Kassa-Kopf, `atelier.css:169` (`.at-mark b`, `letter-spacing: 0.02em`).
- **Problem:** In jedem Screenshot steht sichtbar „Platzhirs ch“.
- **Lösung:** Die Wortmarke wird als SVG von der Website übernommen (keine Live-Schrift), Höhe 18 px. Falls die Schrift bleibt: `letter-spacing: 0`, `font-kerning: normal`, `font-feature-settings: "kern" 1, "liga" 1` und im Browser prüfen. „Studio“ steht auf derselben Grundlinie (aktuell 2 px tiefer).

### 10. Dunkelmodus Kassa
- **Ort:** `/entwurf/atelier/kassa` dunkel.
- **Problem:** Der Bezahlknopf `#dd8a66` mit dunkler Schrift wirkt pastellig, und die hellen Material- oder Fotokacheln werden nicht gedimmt. „Kundenkarte −60,85 €“ ist grün, im Hellmodus nicht.
- **Lösung:** Der Bezahlknopf wird dunkel `#b8603d` mit Text `#fff7f2` (Kontrast ≥ 4,6 : 1) gesetzt, Hover `#c56a45`. Alle Kacheln bekommen im Dunkelmodus `filter: brightness(.82) saturate(.9)`, wie die Bilder. Rabattzeilen sind in beiden Modi `ink-2`, nie Statusfarbe.

### 11. Phasen: sichtbare Rampe, ruhige Zahlen
- **Ort:** Zentrale, „Vorgänge nach Phase“.
- **Problem:** Das Segment „Anfrage“ (`#dcd6ca`) hat auf Papier etwa 1,3 : 1 Kontrast und verschwindet. Die Zählwerte in Newsreader 22 stehen bei x ≈ 675 mitten in der Zeile, getrennt von Wert und Label.
- **Lösung:** Die Rampe beginnt bei `#bfb7a8`, die Stufen sind `#bfb7a8 / #9d9486 / #77705f / #4d4840 / #1c1b18`, mit 2 px Lücke. Die Zeilen sind ein Raster `16px 1fr 48px 140px`: Swatch, Label, Anzahl (Geist 14/560, Tabellenziffern, rechtsbündig), Wert `ink-3` rechtsbündig. Die Serif bleibt für die Kennzahlen reserviert.

### 12. Avatare lesbar
- **Ort:** Agenda (Teilnehmer), „Im Studio“, Panel „Zuständig“.
- **Problem:** Die Kreise haben 18–22 px mit 8–9 px Initialen. Das ist unlesbar, und auf Papier sieht man nur graue Punkte.
- **Lösung:** Mindestens 24 px mit Geist 10/600. Stapel überlappen um −6 px mit einem 2-px-Ring in `--at-paper`. Höchstens 3 sichtbar, dann „+1“.

### 13. iPad: zwei Spalten behalten
- **Ort:** `01-zentrale-ipad`, `03-kunde-ipad`.
- **Problem:** Bei 1.180 px wird alles einspaltig. „Wartet auf Sie“ spannt 713 px, die Beträge stehen weit von der Aufgabe entfernt. Die Bildunterschrift bricht in „Haus am Pfänderhang ·“ / „Esszimmer“ und „Teil 3 in KW“ / „47“ um.
- **Lösung:** Unter 1.280 px bleiben „Heute“ und „Wartet auf Sie“ zweispaltig im Verhältnis `1fr 1fr` mit 32 px Spaltenabstand. Unter 900 px wird gestapelt. Die Bildunterschrift steht zweizeilig: Titel oben, „Esszimmer · Teil 3, KW 47“ darunter, beide mit `white-space: nowrap; text-overflow: ellipsis`. Die Projektpunkte in der Icon-Leiste bekommen einen Tooltip oder fallen weg. Punkte ohne Beschriftung haben keine Bedeutung.

### 14. Tafel: gleichmäßige Karten, ein Akzent
- **Ort:** `02b-anfragen-tafel`.
- **Problem:** Nur die erste Karte jeder Spalte hat ein Bild, deshalb wirkt das Raster zufällig. Die Spaltenköpfe haben vier Punktfarben, und „Angebot offen“ ist Ockertext.
- **Lösung:** Entweder bekommen alle Karten ein Bild in 16 : 9 (wenn eines vorhanden ist) oder keine. Empfohlen: kein Bild auf der Tafel, stattdessen ein 4-px-Materialstreifen oben in der Bereichsfarbe. Die Köpfe stehen in `ink` mit der Phasen-Rampe als Punkt (geordnet, einfarbig), der Akzent ist nur für „Neu“.

### 15. Kundenkarte Gold entwerten
- **Ort:** Kundenakte, Kopf.
- **Problem:** Die senfgelbe Pille mit Check-Icon wirkt wie ein Bonusprogramm im Drogeriemarkt.
- **Lösung:** Text in `ink-2`, 13/18, davor ein 10-px-Swatch Messing `#b2965a` mit Radius 3: „Kundenkarte Gold · 4.860 Punkte“. Keine Fläche und kein Icon.

### 16. Kiosk-Typografie auf Vorgabe heben
- **Ort:** Kassa, Produktkacheln und Warenkorb.
- **Problem:** Die Meta-Zeile ist 13 px, der Name 14–15 px. Die eigene Regel verlangt 15–17 px, weil an der Kassa aus 60–80 cm Abstand gelesen wird.
- **Lösung:** Name 16/22 mit Gewicht 560, Meta 14/20 `ink-3`, Preis Newsreader 20/24. Die Mengen-Badges stehen nicht mehr als schwarzer Kreis auf dem Foto, sondern als Pille unten rechts in der Kachel, 24 px hoch, `--at-accent-soft` mit Akzenttext. Das Raster bekommt unten 24 px Innenabstand und einen 32-px-Verlauf zu `--at-paper`, damit die abgeschnittene Reihe beabsichtigt aussieht.

### 17. Kopfleiste aufräumen
- **Ort:** alle Seiten, rechts oben.
- **Problem:** Der Dreifach-Themenschalter (hell/System/dunkel) ist Entwicklerwerkzeug in der Hauptleiste. Auf der Zentrale steht „+ Neu“ ohne Fläche neben der Glocke, auf den anderen Seiten fehlt es.
- **Lösung:** Der Themenschalter wandert ins Benutzermenü (Seitenleiste unten). Die Kopfleiste enthält auf jeder Seite nur Breadcrumb, Suche (⌘K), Glocke und „Neu“, alle in derselben Reihenfolge und 32 px hoch.

## Empfehlenswert (nicht Pflicht)

- Zentrale-Kopf: Text und Bild oben bündig ausrichten (beide `align-self: start`), der Datum-Wetter-Zeile 0 px Versatz geben. Damit fallen ca. 50 px totes Weiß weg.
- Agenda: Vergangene Termine nicht auf 55 % Deckkraft setzen, sondern Text in `ink-3` und Stab in `ink-4`, damit AA erhalten bleibt.
- „Im Studio“: Höchstens ein fetter Lauf pro Zeile (Person **oder** Objekt), sonst wird die Liste fleckig.
- Zeitleiste: Die vertikale Linie endet am letzten Punkt und nicht 40 px darunter. Die Gruppe „Sommer“ wird zu „Juni – Juli“.
- `atelier.css:302`: `transition: all` ersetzen durch `background, color, box-shadow`.

## Fazit für die Präsentation

Die Richtung trägt und sollte gewählt werden. Der Abstand zu „Agenturarbeit“ liegt aber nicht in Konzept oder Token, sondern in rund zwei Tagen konsequenter Detailarbeit: echte Produktbilder, eine linke Kante, ein Kopfsystem, eine Chartregel, eine korrekt gesetzte Wortmarke. Mit den Pflichtänderungen 1–8 erwarte ich eine 8, mit allen siebzehn eine 8,5. Darüber hinaus kommt man nur mit eigenem Produktfoto-Material für die Kassa und einem echten Kiosk-Test an der Theke.
