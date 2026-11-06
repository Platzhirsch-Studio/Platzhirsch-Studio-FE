# Jury-Urteil „Präzision“

Jury: Executive Creative Director, Produktdesign (Maßstab: Stripe, Linear, Apple)
Datum: 04.11.2026
Grundlage: alle 18 Screenshots in `backoffice/qa-screenshots/entwurf-praezision/`, `praezision.md`, `backoffice/src/app/entwurf/praezision/praezision.css`

---

## Urteil in einem Satz

Das ist eine **saubere, fleißige Linear-Kopie mit Messing-Tupfer**. Handwerklich ist sie auf dem Niveau eines guten Inhouse-Teams. Eine eigene Idee hat sie nicht. Für ein Luxus-Einrichtungshaus fehlt jede Spur von Material, Ruhe und Stolz. **So würde ich das nicht ohne Zögern präsentieren.** Der Kunde würde fragen: „Warum sieht unser Showroom-Werkzeug aus wie ein Bugtracker?“ Und er hätte recht.

**Note: 6 / 10**
(Handwerk 7, Eigenständigkeit 3, Markenpassung 4, Kiosk 7, Dunkelmodus 6)

Der Satz des Kunden „das sieht aus, als hätten das Amateure gemacht“ ist im Wortsinn falsch, denn die Ausführung ist nicht amateurhaft. In der Sache trifft er aber zu. Der Kunde sieht ein **Template**, keine Arbeit für *seine* Marke. Dazu kommen ein Dutzend Detailfehler (abgeschnittene Spalten, abgeschnittener Text, Regelbrüche gegen das eigene Leitbild), die den Eindruck „nicht fertig“ verstärken.

---

## Was stimmt (und bleiben muss)

- **Gerüst:** Seitenleiste auf dem Grund, ein eingesetztes Arbeitsblatt, Haarlinien statt Kartenwüste. Die Struktur ist klar, und die Navigation ist gut gruppiert (Verkauf / Betrieb / Objekte).
- **Beispieldaten:** realistisch, abwechslungsreich, mit regionalem Bezug (Lochau, Hard, Bregenz, Fußach). Das ist besser als bei 90 % aller Pitches.
- **Kennzahlen mit Vergleichsbasis** („vs. Okt. zum selben Tag“, „Angebot → Auftrag, 90 Tage“). Das ist Stripe-Niveau.
- **Statusringe mit Fortschritt** und Wort daneben, Filter-Chips im Satzbau, gespeicherte Ansichten mit Zählern.
- **Vorgangsleiste in der Kundenakte** (Anfrage → Service). Das ist die stärkste Einzelidee im Entwurf, verständlich in einer Sekunde.
- **Kassa:** Der mit Abstand beste Screen. Produktbilder bekommen Fläche, ein dicker Bezahlknopf mit Betrag, die Kopfzeile zeigt Gerät, Bon, TSE und Person. Hier spürt man zum ersten Mal, dass es um Möbel geht.
- **Bewegung im Code** ist diszipliniert: 120 ms Hover, 220 ms Panel, 180 ms Palette, `prefers-reduced-motion` greift global.

---

## Bewertung nach Kriterien

| Kriterium | Note | Kurzbefund |
|---|---|---|
| Hierarchie | 5 | Alles ist 13 px. H1 (20 px) ist *kleiner* als die Kennzahlen (24 px). Die Zentrale hat sechs gleich laute Module und keinen Einstieg. |
| Typografie | 6 | Geist ist korrekt gesetzt, aber generisch. Die Bodoni-Wortmarke ist mit ca. 15 px zu klein und zu dünn und wirkt wie eine Fallback-Serife. Initialen in Mikro-Avataren mit ca. 7 px sind unlesbar. |
| Rhythmus / Abstände | 6 | Das 4-px-Raster wird eingehalten, aber der Rhythmus ist monoton. Alle Abschnitte haben 32 px Abstand, nichts atmet oder verdichtet sich bewusst. |
| Farbe | 5 | Das Messing liest sich hell als **Senf/Oliv** (`#8f6c1d`) und dunkel als **Warn-Gelb** (`#d9b65e`). Der Verlauf unter der Umsatzlinie wirkt schmutzig-beige. |
| Detailtreue | 5 | Abgeschnittene Spalten (iPad), Text hinter fixierter Fußleiste, überlappende Avatare schneiden Initialen ab, Grauband endet vor dem Panelrand. Details unten. |
| Datenpräsentation | 7 | Inhaltlich stark. Formal hat das Diagramm keine Einheit an der Achse, eine Legende, die gestrichelt und durchgezogen nicht unterscheidet, und eine harte Kante, wo der Verlauf aufhört. |
| Bewegung | 7 | Im Code sauber, im Ausdruck nicht sichtbar. Es gibt keinen einzigen Moment, der Wertigkeit vermittelt. |
| Markenpassung Luxus | 3 | Außer in der Kassa gibt es keine Materialität, keine Bilder, keine Ruhe. Es ist ein SaaS-Look. |
| Dunkelmodus | 6 | Technisch korrekt, aber es ist „Linear-Dunkel“ und kein „abends beleuchteter Showroom“. Das Gelb dominiert. |
| Kiosk | 7 | Die Komposition ist sehr gut, aber die Trefferflächen verletzen die eigene Regel (≥ 44 px), siehe unten. |

---

## Pflichtänderungen (vor jeder Präsentation)

### A. Marke: weg vom Template

1. **Messing neu mischen** (überall, `praezision.css` Zeile 21 / 73 / 95)
   Problem: Hell wirkt das Messing wie Senf, dunkel wie eine Warnfarbe.
   Lösung: hell `--acc: #8a6a32` (5,0 : 1 auf Weiß), `--acc-text: #75592a`, `--acc-soft: #f6efe3`, `--acc-line: #e3d3b6`; dunkel `--acc: #c9a96e` (ca. 8 : 1 auf `#141413`), `--acc-text: #d6bb88`, `--acc-soft: #221d14`, `--acc-line: #463a26`. Den Flächenverlauf unter der Umsatzlinie von 14 % auf **8 %** senken und nach unten auf 0 auslaufen lassen.

2. **Wortmarke ernst nehmen** (Seitenleiste oben links)
   Problem: „Platzhirsch“ hat ca. 15 px in Bodoni, dünn und neben dem gleich lauten „Lochau“. Die Marke verschwindet.
   Lösung: Bodoni Moda 500 mit 18/24 px und −1 % Laufweite. „Lochau“ als Standortumschalter darunter in 12 px `--text-3` mit Chevron statt rechts daneben. Die Höhe des Markenblocks beträgt 56 px.

3. **Ein Markenmoment pro Ansicht** (Zentrale, Kundenakte)
   Problem: Kein einziges Raum- oder Produktbild außerhalb der Kassa. Für ein Haus, das Minotti verkauft, ist das fahrlässig.
   Lösung: In der Zentrale ersetzt die Begrüßung einen 160 px hohen Kopf mit dem Raumbild des aktuell laufenden Projekts (Hotel Lindwurm) als Hintergrund, abgedunkelt mit `linear-gradient(90deg, var(--panel) 38%, transparent)`. In der Kundenakte wird der graue „JO“-Kreis (48 px) durch die **Projektvorschau** ersetzt: Rendering 64 × 64, Radius 8. Initialen nur, wenn kein Bild vorhanden ist.

### B. Hierarchie und Typografie

4. **Typo-Skala spreizen** (alle Seiten)
   Problem: H1 20 px < Kennzahl 24 px, alles andere 13 px. Die Seite ist flach.
   Lösung: H1 der Seiten auf **26/32, 600, −2 %**, Kundenname in der Akte auf **28/36**. Kennzahlen bleiben 24/32, aber mit Gewicht **500**. H2 auf **14/20, 600**. Metazeilen auf 12 px `--text-3` fest, keine Ausnahmen mit 13 px grau.

5. **Mikro-Avatare** (Termine, Tabelle „Zuständig“, Board, Aktivität)
   Problem: 16-px-Kreise mit Zwei-Buchstaben-Initialen bei ca. 7 px sind unlesbar. Bei „LI MS“ (Zentrale 11:00) schneidet der zweite Avatar den ersten ab.
   Lösung: Mindestens **20 px**, Initialen 9 px / 600 / +2 %, Überlappung −6 px mit 2-px-Ring in `--panel`. Bei mehr als zwei Personen „+n“.

6. **Zentrale: einen Einstieg schaffen**
   Problem: Termine, To-dos, Umsatz, Pipeline, Lieferung, Aktivität und Warnkarte sind gleich laut. Das Auge findet keinen Anfang.
   Lösung: Die Warnung „Seit 26 Stunden ohne Antwort“ gehört **nach oben** direkt unter die Begrüßung, als einzeilige Leiste (44 px, `--acc-soft`, Messing-Ring-Symbol, Knopf rechts). „Aktivität im Haus“ wandert auf eine eigene Seite oder wird auf 3 Zeilen gekürzt.

### C. Detailtreue (das, was „amateurhaft“ wirkt)

7. **iPad-Tabelle Anfragen: abgeschnittene Spalte**
   Problem: Die Spalte „Eingang“ zeigt nur noch „v…“, „g…“, „2…“, und die grauen Gruppenköpfe enden bei x = 740, die Tabelle aber bei 832. Das ist ein sichtbarer Layoutfehler.
   Lösung: Bei ≤ 1279 px wird „Eingang“ ausgeblendet und als 12-px-Meta in die zweite Zeile unter den Namen gesetzt („Salon & Eignerkabine · vor 41 Min“). Gruppenkopf `width: 100%` der Tabelle, nicht der Spalten.

8. **Vorschau-Panel: Text unter der fixierten Fußleiste** (Anfragen, Desktop)
   Problem: „Sophie Amann hat an Lena zugewiesen“ wird mitten in der Zeile von den Aktionsknöpfen abgeschnitten.
   Lösung: Fußleiste mit `border-top: 1px solid var(--line)` und einer Maske über dem Scrollbereich: `mask-image: linear-gradient(to bottom, #000 calc(100% - 24px), transparent)`. Dazu `padding-bottom: 80px` für den Inhalt.

9. **Befehlspalette: Hintergrund scheint durch** (`1b-befehlspalette--hell/dunkel.png`)
   Problem: Im Screenshot sind „4 Termine …“, „38 %“ und „Angebot freigeben“ hinter den Einträgen lesbar. Entweder wurde während der 180-ms-Einblendung fotografiert (QA-Fehler), oder das Glas trägt nicht. Die letzte Zeile „ANG-0415“ wird ohne Auslauf von der Fußzeile abgeschnitten.
   Lösung: `--glass-strong` hell `rgba(255,255,255,.985)`, dunkel `rgba(22,22,21,.985)`. Scrim hell `rgba(33,32,28,.18)`, dunkel `rgba(0,0,0,.55)` (heute ist der helle Scrim *aufhellend*, damit hebt sich die Palette nicht ab). Liste mit `max-height: 360px` und 16-px-Auslaufmaske. QA-Screenshots erst nach `animationend` aufnehmen.

10. **Umsatzdiagramm** (Zentrale)
    Problem: Die Achse 0–300 hat keine Einheit. Die Legende „— 2026 — 2025“ zeigt zwei gleiche Striche. Der Flächenverlauf endet bei „Okt“ mit einer harten senkrechten Kante. Direktbeschriftung und Legende sind doppelt.
    Lösung: Achsentitel „Tsd. €“ in 11 px über der Y-Achse. Die Legende entfällt, die Direktbeschriftung am Linienende reicht. Vorjahr 1,5 px `--g8` mit `stroke-dasharray: 3 3`. Den Flächenverlauf bis zur Prognose weiterführen, ab Okt mit 50 % Deckkraft. Y-Achsenbeschriftung bündig mit der Titelkante (x = Inhaltsrand).

11. **Eigene Regel „eine erhöhte Fläche, keine Karten“ wird gebrochen**
    Problem: Warnkarte (Zentrale), Datumskacheln „Do 5.“ (Lieferung), Vorgangsleiste in der Akte, Board-Karten und Zahlart-Kacheln sind alle umrandete Kästen in unterschiedlichen Radien (8 / 10 / 12).
    Lösung: Datumskacheln ohne Rahmen, nur Wochentag 11 px `--text-3` über Tag 15 px 600. Die Vorgangsleiste ohne Kasten, nur Haarlinie oben und unten. Board-Karten sind erlaubt (Ausnahme dokumentieren), dann aber einheitlich Radius 8, Innenabstand 12, ohne Schatten, nur `0 0 0 1px var(--line)`.

12. **Redundante Statusspalte** (Anfragen, Liste)
    Problem: Die Gruppierung nach Status und die Spalte „Status“ sagen zweimal dasselbe.
    Lösung: Die Spalte „Status“ entfällt, solange nach Status gruppiert wird. Die frei werdenden ca. 140 px gehen an „Anfrage“.

13. **Rätsel-Symbole auf Board-Karten**
    Problem: Telefon, Globus, Brief und Handschlag stehen ohne Erklärung neben dem Betrag.
    Lösung: Entweder weglassen oder als Text-Meta „über Empfehlung“ in 12 px. Eine Karte hat höchstens drei Informationen: Name, Anliegen, Betrag plus Avatar.

14. **Mengenspalte in der Kundenakte**
    Problem: „1ד steht 280 px vom Produktnamen entfernt mitten im Nichts.
    Lösung: Menge rechtsbündig direkt vor den Betrag setzen (Spalte 48 px), Betrag 120 px, Status 120 px. Der Name bekommt den Rest.

### D. Dunkelmodus

15. **Messing-Text als Warnung** (Kassa dunkel: „2 lagernd“, „1 lagernd“)
    Problem: Der Akzent trägt hier eine Statusbedeutung („knapp“), was das eigene Leitbild ausdrücklich verbietet.
    Lösung: Knappen Bestand mit einem 6-px-Punkt in Orange (`#f08a2c`) markieren, der Text bleibt `--text-3`. Hell und dunkel identisch.

16. **Showroom statt Bugtracker**
    Problem: Dunkel ist reines Linear-Grau, nichts erinnert an Abendlicht.
    Lösung: `--bg: #0d0c0a`, `--panel: #15130f` (leicht warm statt neutral). Innenlicht oben auf dem Blatt `inset 0 1px 0 rgba(255,236,200,.06)`. Der Bezahlknopf dunkel nicht in Papier-Grau, sondern in Messing `#c9a96e` mit Text `#1a1608`. Das ist der *eine* Ort, an dem Messing Fläche sein darf.

### E. Kiosk

17. **Trefferflächen unter Mindestmaß** (Kassa)
    Problem: Der „+“-Knopf auf Produktbildern misst 32 px, Kategorie-Pillen 36 px, der Mengenwähler 32 px. Das eigene Leitbild verlangt mindestens 44 px.
    Lösung: „+“ auf **44 px** (Symbol 18 px), Pillen auf **44 px** Höhe mit 16 px Schrift, Mengenwähler auf **44 px** Höhe mit Knöpfen von 44 × 44. Alternativ wird die ganze Produktkachel zur Trefferfläche, das „+“ ist dann nur Hinweis.

18. **Ausgewählte Zahlart** (Kassa hell)
    Problem: „Karte“ hat eine Messing-Fläche und einen Messing-Rahmen. Das ist Messing als Fläche und konkurriert mit dem Bezahlknopf.
    Lösung: Ausgewählt = 2 px Ring in `--text`, Fläche `--panel`, Symbol `--text`. Messing nur beim Fokus.

19. **Kundenkarten-Plakette**
    Problem: Das 14 × 10-px-Grauviereck neben „Silber“ wirkt wie ein kaputtes Bild.
    Lösung: Ein echter Kartenmini mit 20 × 13 px, Radius 2, Verlauf Silber `#d9d9d6 → #a9a9a4` bzw. Gold `#d8c08a → #a9884a` und 1 px Innenlinie.

20. **Bezahlknopf-Text**
    Problem: „Kartenzahlung starten · 7.323,50 €“ hat vor dem Mittelpunkt einen doppelten Zwischenraum.
    Lösung: Betrag als eigenes Element rechts, Knopf `justify-content: space-between; padding: 0 24px`, Betrag in Tabellenziffern 18 px.

---

## Was eine 9 bräuchte

- **Eine eigene Signatur**, die man in einem Thumbnail wiedererkennt, ohne das Logo zu sehen. Vorschlag: die **Fuge**. Jede Gliederung ist eine 1-px-Linie mit 2 px Messing-Endpunkt am aktiven Element (Navigation, Tabelle, Vorgangsleiste). Das übersetzt „Schreinerarbeit, nur Fugen“ aus dem Leitbild endlich ins Bild. Heute steht der Satz nur im Text.
- **Materialbilder als Daten**: Positionen, Anfragen und Kundenakten zeigen Stoff, Holz oder Rendering statt Initialen.
- **Ein einziger Moment mit Würde**: Beim Abschluss eines Auftrags erscheint ein ruhiger Vollbild-Übergang (400 ms) mit Raumbild und Betrag. Ein Moment, nicht mehr.
- **QA wie eine Agentur**: Screenshots erst nach dem Ende der Animationen, jede Ansicht bei 1440, 1180 und 1024, keine abgeschnittene Zeile, kein Text unter einer Fußleiste.

## Präsentierbar?

**Nein, nicht ohne Zögern.** Nach den Pflichtänderungen 1–11 und 17 ist es eine solide 7,5, die man präsentieren kann. Für eine Agenturarbeit, auf die man stolz ist, fehlt die eigene Idee aus Abschnitt „Was eine 9 bräuchte“.
