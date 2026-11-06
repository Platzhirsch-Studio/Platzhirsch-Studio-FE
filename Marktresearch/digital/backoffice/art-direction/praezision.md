# Art Direction „Präzision“

Live-Entwurf: `http://localhost:3100/entwurf/praezision/` (Zentrale), `/anfragen`, `/kunde`, `/kassa`
Code: `backoffice/src/app/entwurf/praezision/`, `backoffice/src/components/Entwurf/Praezision/`
Screenshots: `backoffice/qa-screenshots/entwurf-praezision/`

## Leitidee

Das Backoffice ist ein Werkzeug für Profis. Es ist so ruhig und genau gebaut wie eine gute Schreinerarbeit: Man sieht keine Konstruktion, nur Fugen, die stimmen. Die Fläche bleibt fast farblos – zwölf warm-neutrale Graustufen –, damit Material, Kundennamen und Beträge die Hauptrolle spielen. Ein einziger Akzent in **Messing** zeigt, wo man gerade ist und was jetzt zählt. Dunkel ist kein Nachtmodus, sondern ein gleichwertiges zweites Hauptbild, wie ein abends beleuchteter Showroom.

## Moodboard (Referenzen und was wir davon nehmen)

| Referenz | Übernommen | Bewusst nicht übernommen |
|---|---|---|
| Linear (2024/25) | Seitenleiste auf dem Grund, Arbeitsfläche als eingesetztes Blatt; Statusringe, die den Fortschritt zeigen; Gruppenköpfe in Listen; Bedienung per Tastatur (J/K, C, ⌘K) | Lila Markenfarbe, Gaming-Dunkel |
| Vercel Dashboard | Kennzahlen als Streifen mit Haarlinien statt Kästen; Geist als Schrift; Primärknopf in Tinte | Kalte, rein graue Stufen |
| Raycast | Befehlspalette als Mittelpunkt, Glas nur für die oberste Ebene, Tastenkappen | Effekt-Verläufe |
| Stripe Dashboard | Beträge mit Kontext (Delta, Vergleich, Prognose); Betragsbalken bezahlt / offen | Sehr bunte Diagramme |
| Attio | Kundenakte: Kopf, Eigenschaften-Spalte rechts, Zeitleiste mit Eingabezeile | Tabellen-Overload |
| Apple Systemapps / Shopify POS 2025 | Kiosk mit großen Trefferflächen, ruhige Produktbilder, ein einziger dicker Bezahlknopf | Skeuomorphismus |
| Platzhirsch (Website, Showroom) | Bodoni-Wortmarke, Messing, warmes „Sand“-Grau, echte Raumbilder | Beige Fläche, Serifen im UI |

## Farbtoken

Zwölf Graustufen (warm-neutral, Basis Radix „Sand“), ein Akzent, Statustöne nur für Symbole.

| Token | Hell | Dunkel | Verwendung |
|---|---|---|---|
| `--g1 … --g12` | `#fdfdfc #f9f9f8 #f1f0ef #e9e8e6 #e2e1de #dad9d6 #cfceca #bcbbb5 #8d8d86 #82827c #63635e #21201c` | `#111110 #191918 #222221 #2a2a28 #31312e #3b3a37 #494844 #62605b #6f6d66 #7c7b74 #b5b3ad #eeeeec` | Stufen-Skala |
| `--bg` | `#f3f3f1` | `#0c0c0b` | Grund unter der Seitenleiste |
| `--panel` | `#ffffff` | `#141413` | Arbeitsfläche |
| `--panel-2` | `#f9f9f8` | `#191918` | Gruppenköpfe, Summenbereich |
| `--line` / `--line-2` | `#ebeae7` / `#dedcd8` | `#232322` / `#2f2f2d` | Haarlinie / Kante von Eingaben |
| `--hover` / `--active` | `rgba(33,32,28,.045)` / `.075` | `rgba(238,238,236,.045)` / `.08` | Zustandsflächen (nie Farbe) |
| `--text` | `#21201c` (16 : 1) | `#edece9` (15 : 1) | Primärtext |
| `--text-2` | `#63635e` (6,1 : 1) | `#b5b3ad` (8,9 : 1) | Sekundärtext |
| `--text-3` | `#686862` (5,4 : 1) | `#8f8d86` (5,3 : 1) | Metadaten, Achsen |
| `--acc` (Messing) | `#8f6c1d` | `#d9b65e` | Fokusring, aktiver Navigationspunkt, laufende Reihe, „jetzt“ |
| `--acc-text` / `--acc-soft` / `--acc-line` | `#7a5c14` / `#f7f0de` / `#e7d6a8` | `#e3c57a` / `#241f12` / `#4a3e1d` | Akzent-Chips (Eckdaten, Kundenkarte) |
| `--inv` / `--on-inv` | `#21201c` / `#fff` | `#edece9` / `#141413` | Primärknopf (Tinte, dunkel: Papier) |
| Statustöne | blau `#3e63dd`, violett `#8e4ec6`, messing `#b08a2e`, orange `#e5700b`, grün `#2b9a66`, rot `#dc3e42` | `#7090f0 #b07fe0 #d9b65e #f08a2c #3dbf84 #ff6369` | **nur** Punkt/Ring, Text bleibt neutral |

Alle Text-Paarungen erfüllen WCAG AA (axe-Prüfung hell und dunkel ohne Befund, Skript `_qa/axe.mjs`).

## Typografie

- **UI: Geist** (Google Fonts, `next/font/google`). Begründung: für dichte Werkzeug-Oberflächen bei 12–13 px gezeichnet, offene Formen, ruhige Ziffern mit Tabellenziffern (`tnum`), enge, aber nicht gequetschte Laufweite. Instrument Sans (Website) ist bei 13 px zu breit und zu expressiv für Tabellen; Inter Tight wäre die Alternative, wirkt aber generischer.
- **Geist Mono**: nur für Belegnummern (`AB-0412`) und Tastenkappen – Nummern werden dadurch leise statt laut.
- **Bodoni Moda**: ausschließlich Wortmarke „Platzhirsch“ und das „P“-Signet. Nie in Überschriften der Anwendung.

| Stufe | Größe / Zeile | Gewicht | Einsatz |
|---|---|---|---|
| Display | 28 / 36 | 600, −2,5 % | Kassa-Gesamtsumme |
| H1 | 20 / 28 (Akte 22) | 600, −1,8 % | Seitentitel, Kundenname |
| Kennzahl | 24 / 32 | 600, −2 % | Kennzahl-Streifen |
| H2 | 13 / 20 | 600 | Abschnittsköpfe |
| Body | 13 / 20 | 400 / 500 | alles |
| Meta | 12 / 16 | 400 / 500 | Unterzeilen, Achsen, Chips |
| Mikro | 11 / 16 | 500 / 600 | Tastenkappen, Diagrammachsen |

Keine VERSALIEN-Etiketten. Satzanfang groß, sonst Kleinschreibung nach Duden.

## Raster und Abstände

- 4-px-Grundraster; alle Höhen sind Vielfache von 4: Knopf 28, Navigationszeile 28, Tabellenzeile 44, Gruppenkopf 36, Kopfzeile 48, Kiosk-Treffer 56.
- Abstände: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40. Innerhalb von Komponenten 8–12, zwischen Abschnitten 32.
- Desktop 1440: Seitenleiste 240, Arbeitsfläche mit 8 px Luft rundum, Inhalt 32 px Innenrand, Zwei-Spalten-Raster 7 : 5 mit 40 px Spalt.
- iPad (≤ 1279): Seitenleiste als 56-px-Symbolleiste, Vorschau-Panel 340, Spalten werden ausgeblendet statt gequetscht.

## Flächen, Linien, Schatten

- Genau **eine** erhöhte Fläche pro Ansicht: das Arbeitsblatt (`--sh-panel`, Radius 12). Darin keine Karten – Gliederung nur über Haarlinien und Weißraum.
- Haarlinie 1 px `--line`; Trennlinien in Listen sind um 8 px eingerückt und verschwinden beim Hover.
- Radien: 4 (Kappen, Tags) · 6 (Knöpfe, Navigation) · 8 (Kalenderblatt, Zahlarten) · 12 (Blätter) · 14 (Befehlspalette) · rund (Avatare, Chips, Mengenwähler).
- Schatten nur für Ebenen: Blatt, Popover/Tooltip, Befehlspalette. Glas (`backdrop-filter`) nur für die Kopfzeile beim Scrollen und das Hinzufügen-Symbol auf Produktbildern.
- Dunkel: Kanten tragen die Form (1 px weiß 5,5 %), plus 1 px Innenlicht oben.

## Ikonografie

- lucide-react, 16 px in Navigation, 14 px in Knöpfen und Eigenschaften, 12 px in Chips; Strich 1,75 (Standard 2 wirkt bei 13 px zu fett – wird über die Größe ausgeglichen).
- Symbole sind in `--text-3`; der aktive Navigationspunkt ist das einzige Symbol in Messing.
- Status ist ein **Ring**, der sich mit dem Fortschritt füllt (Neu: gestrichelt → Gewonnen: voll). Farbe nur im Ring, Wort daneben – nie Farbe allein.

## Datenvisualisierung

- Kennzahlen als Streifen: Etikett (Satzschreibung), Wert, Sparkline (neutral, auf Hover Messing), Delta mit Pfeil und **Vergleichsbasis** im Klartext.
- Linien: laufendes Jahr 2 px Messing mit 14 %-Verlauf darunter, Vorjahr 1,5 px Grau gestrichelt, Prognose gepunktet mit hohlem Marker. Eine Achse, Direktbeschriftung am Linienende plus Legende, Fadenkreuz-Tooltip, verborgene Tabelle für Screenreader.
- Mengen über Stufen (Pipeline): ein gestapelter Balken in einer Farbfamilie (Grau hell → dunkel → Messing für „Auftrag“), 2 px Fuge zwischen Segmenten.
- Geld-Fortschritt: Balken bezahlt (Tinte) / offen (Messing).
- Kein Tortendiagramm, keine Doppelachse, keine Regenbogenpaletten.

## Bewegung

| Ereignis | Dauer | Kurve |
|---|---|---|
| Hover-Flächen, Farben | 120 ms | `cubic-bezier(.2,0,0,1)` |
| Vorschau-Panel | 220 ms, 12 px von rechts + Einblenden | `cubic-bezier(.16,1,.3,1)` |
| Befehlspalette | 180 ms, −4 px + 98,5 % → 100 % | ease-out |
| Produktbild Hover | 400 ms, Zoom 3 % | ease-out |
| „Läuft“-Punkt | 2 s Puls | — |

`prefers-reduced-motion: reduce` setzt alle Dauern auf 1 ms. Nichts bewegt sich ohne Anlass.

## Komponentenbeispiele (im Entwurf umgesetzt)

- **Seitenleiste**: Wortmarke, Suchfeld mit ⌘K, Gruppen „Verkauf / Betrieb / Objekte“, Zähler in Tabellenziffern, aktiver Punkt als weißes Plättchen mit Messing-Symbol.
- **Befehlspalette** (⌘K, `?palette=1`): Gruppen Vorschläge / Kunden / Vorgänge / Navigation, Tastenkürzel rechts, ↑↓ ↵ Esc.
- **Tabelle Anfragen**: Gruppen nach Status, Avatar (Firmen eckig, Personen rund), Name + Anliegen zweizeilig, Bereich als Tag, Volumen rechtsbündig, Zuständig als Avatar, Eingang relativ. Die Belegnummer steht leise in Mono im Panel – nicht als lauteste Spalte.
- **Gespeicherte Ansichten** als Reiter mit Zählern, **Filter-Chips** im Satzbau „Status · ist nicht · Verloren, Spam ×“.
- **Vorschau-Panel**: Kopf mit J/K-Navigation, Nachricht, Eckdaten als Messing-Chips, Eigenschaften-Liste, Verlauf, fixierte Aktionen.
- **Vorgangsleiste**: fünf Segmente Anfrage → Planung → Auftrag → Lieferung → Service; fertig = Tinte, aktiv = Messing mit Füllgrad, offen = Grau; Datum und Kerninfo darunter.
- **Zeitleiste**: Eingabezeile oben (N), Ereignisse mit Symbolkreis, Renderings als Vorschaubilder, Handzeichnung als schraffierter Platzhalter.
- **Kassa**: Scanfeld 56 px, Kategorien als Pillen, Produkte 1 : 1 mit „im Korb“-Marke, Kundenkarte mit Stufenplakette, Mengenwähler 32 px, Zahlarten 56 px, Bezahlknopf 56 px mit Betrag.

## Do / Don't

| Do | Don't |
|---|---|
| Eine erhöhte Fläche, Gliederung durch Linien und Luft | Jede Fläche als umrandete Karte |
| Kennzahlen mit Vergleich, Trend und Zeitraum | Sechs gleich große Kästen mit VERSALIEN |
| Messing sparsam: Fokus, aktiv, jetzt, laufend | Messing als Flächenfarbe oder für Statusbedeutung |
| Status = Ring + Wort | Bunte Pillen mit farbigem Text |
| Tastenhinweise neben Aktionen | Schnellaktionen-Knopfreihe |
| Nummern in Mono, leise | Nummer als lauteste Spalte |
| Abwechslungsreiche, realistische Beispieldaten | 12 × „Laura Muster“ |
| Dunkel mit eigenen Stufen | Invertierte Farben |

## Übertragung

- **Kiosk (Kassa, Montage, Packtisch)**: gleiche Token, aber Grundgröße 16 px für Eingaben, Treffer ≥ 44 px (Standard 56), keine Hover-Abhängigkeit, Produktbilder dürfen Fläche einnehmen. Dunkel bevorzugt im Showroom am Abend. Kopfzeile zeigt Gerät, Bon, TSE-Status, Person.
- **iPhone**: Seitenleiste wird Tab-Leiste unten (Zentrale, Anfragen, Kunden, Suche, Mehr); Befehlspalette ist die Suche. Tabellen werden zu zweizeiligen Listen (Avatar · Name/Anliegen · Betrag); das Vorschau-Panel wird zum Vollbild-Blatt mit Wischen nach unten zum Schließen. Kennzahlen-Streifen 2 × 2.
- **Druck (Angebot, Auftragsbestätigung, Lieferschein)**: Weiß, Tinte `#21201c`, Haarlinien 0,25 pt `#dedcd8`, Geist 9/13 pt, Belegnummer Geist Mono, Wortmarke Bodoni oben links, Messing nur für eine Linie unter dem Kopf und für die Gesamtsumme. Positionsbilder 20 × 20 mm, Beträge in Tabellenziffern rechtsbündig.

---

## Nach Jury (04.11.2026, Note 6 → Überarbeitung)

Grundlage: `praezision-jury.md`. Alle 20 Pflichtänderungen sind umgesetzt. Dazu kommen die vier Punkte aus „Was eine 9 bräuchte“. **Die Werte in diesem Abschnitt ersetzen die älteren Angaben weiter oben.**

### Die Signatur: die Fuge
„Schreinerarbeit, nur Fugen“ ist jetzt im Bild zu sehen und nicht mehr nur im Text. Jede Gliederung ist eine 1-px-Haarlinie. Das **aktive** Element sitzt als **2-px-Messing-Zapfen** auf dieser Linie:
- **Navigation**: eine senkrechte Haarlinie trägt die Einträge, die aktive Seite hat einen 2 × 16 px großen Messing-Zapfen (220 ms Wachsen) und keine Pille.
- **Reiter / Ansichten**: 2-px-Messing auf der Unterkante (Einblendung über scaleX, 220 ms).
- **Liste**: Die gewählte Zeile hat 2 px Messing am linken Rand.
- **Vorgangsleiste**: eine Linie mit Punkten. Der erledigte Teil ist Tinte, an der Position „jetzt“ steht ein senkrechter Messing-Zapfen (2 × 14 px).
- **Abschnittsköpfe**: Haarlinie mit einem 16-px-Anschlag in Tinte links. So entsteht der Rhythmus, an dem man die Richtung auch im Thumbnail erkennt.

### Farbe (neu)
| Token | Hell | Dunkel |
|---|---|---|
| `--bg` | `#f3f2ef` | `#0d0c0a` (warm) |
| `--panel` | `#ffffff` | `#15130f` (warm) + Innenlicht `inset 0 1px 0 rgba(255,236,200,.06)` |
| `--line` / `--line-2` | `#ebe9e5` / `#dddad4` | `#26221c` / `#332e26` |
| `--text` / `-2` / `-3` | `#1f1d1a` / `#605c55` / `#6a665e` | `#eeeae2` / `#b8b1a4` / `#968e80` |
| `--acc` (Messing) | `#8a6a32` (5,0 : 1) | `#c9a96e` (ca. 8 : 1) |
| `--acc-text` | `#75592a` | `#d6bb88` |
| `--acc-soft` / `--acc-line` | `#f6efe3` / `#e3d3b6` | `#221d14` / `#463a26` |
| Bezahlknopf | Tinte `#1f1d1a` | **Messing `#c9a96e`, Text `#1a1608`** (der einzige Ort mit Messing als Fläche) |
| Bestand knapp | Punkt 6 px `#f08a2c`, Text `--text-3` | identisch |
| Status „Termin“ | Petrol `#2c7c84` | `#5fb3ba` |
| Glas Palette / Scrim | `rgba(255,255,255,.985)` / `rgba(33,32,28,.18)` | `rgba(22,22,21,.985)` / `rgba(0,0,0,.55)` |

Messing hat keine Statusbedeutung mehr („Termin vereinbart“ und „Montage KW 46“ sind jetzt Petrol). Der Umsatzverlauf hat 8 % Deckkraft und läuft nach unten auf 0 aus.

### Typografie (neu)
| Rolle | Wert |
|---|---|
| Wortmarke | Bodoni Moda 500, 18/24, −1 %; darunter „Lochau ⌄“ 12 px `--text-3` als Standortumschalter; Markenblock 56 px |
| Kundenname (Akte) | 28/36, 600, −2,2 % |
| Seiten-H1 | 26/32, 600, −2 % |
| Kennzahl / Betrag groß | 24/32, **500**, Tabellenziffern |
| H2 | 14/20, 600 |
| Fließtext / UI | 13/20 Geist |
| Meta | 12/16 `--text-3`, ohne Ausnahme |
| Initialen | ≥ 20-px-Avatar, 9 px / 600 / +2 %, Überlappung −6 px mit 2-px-Ring, ab drei Personen „+n“ |
| Abschluss-Moment | Bodoni Moda 500, 44/52 |

### Material als Daten
- **Zentrale**: Ein 160 px hoher Kopf zeigt das Raumbild des laufenden Projekts (Hotel Lindwurm, Seeterrasse). Es läuft über `linear-gradient(90deg, var(--panel) 38%, …, transparent)` in das Blatt aus und trägt rechts unten eine Glas-Beschriftung.
- **Anfragen**: Statt Initialen zeigt die Zeile das Material, das der Kunde mitgeschickt hat (Generalplan, Grundriss, Story-Screenshot). Initialen erscheinen nur, wenn kein Anhang da ist. Das Vorschau-Panel zeigt den Anhang groß (148 px) mit Beschriftung, das Board zeigt ihn als 88-px-Streifen.
- **Kundenakte**: Die 64 × 64 große Projektvorschau (Rendering, r 8) ersetzt den Initialenkreis.

### Der eine Moment mit Würde
Bezahlen in der Kassa öffnet einen ruhigen Vollbild-Übergang: 400 ms Einblendung, das Raumbild skaliert in 1,6 s von 1,06 auf 1, darüber kommen „Vielen Dank, Frau Brunner“ in Bodoni, ein Fugen-Strich mit Messing-Punkt, der Betrag, Punkte und Abholhinweis. Danach folgen drei Knöpfe (Beleg drucken / per E-Mail / Neuer Verkauf). Mehr Inszenierung gibt es nirgends. Vorführung: `/kassa?abschluss=1`.

### Hierarchie und Detail
- Zentrale: Die Hinweisleiste (44 px, `--acc-soft`, Messing-Ring mit Ping) steht direkt unter dem Kopf. Die Aktivität ist auf 3 Zeilen gekürzt und heißt „Zuletzt im Haus“ (Link „Alle Aktivitäten“). Kennzahlen haben beim Hover eine Tinten-Fuge an der Oberkante.
- Diagramm: Der Achsentitel „Tsd. €“ steht bündig mit dem Inhaltsrand, es gibt keine Legende, nur eine Direktbeschriftung. Das Vorjahr ist 1,5 px, 3/3 gestrichelt. Die Fläche läuft bis zur Prognose, ab Okt. mit 50 %. Die Linie zeichnet sich in 1,1 s ein. Die viewBox folgt der echten Breite (ResizeObserver), deshalb bleibt die Achsenschrift auf jedem Gerät 11 px.
- Anfragen: Die Liste ist ein Raster statt einer Tabelle, Gruppenköpfe reichen immer über die volle Breite und zeigen rechts die Summe. Die Statusspalte entfällt bei Gruppierung nach Status. Bei ≤ 1279 px entfallen „Bereich“ und „Eingang“, der Eingang steht dann als Meta in Zeile 2 („… · vor 41 Min“).
- Vorschau-Panel: Der Inhalt scrollt in einem eigenen Bereich mit 24-px-Auslaufmaske und 80 px Endabstand. Die Fußleiste mit Haarlinie liegt außerhalb, deshalb steht kein Text mehr darunter.
- Befehlspalette: Glas bei .985, die Liste ist höchstens 360 px hoch und hat eine 16-px-Auslaufmaske. Ohne Suchbegriff erscheinen nur drei Gruppen, so wird nichts mitten in der Zeile abgeschnitten.
- Karten-Verbot: Datumskacheln, Warnkarte und Vorgangskasten sind entfallen. **Dokumentierte Ausnahme**: Board-Karten mit r 8, Innenabstand 12, ohne Schatten, nur `0 0 0 1px var(--line)`, höchstens drei Informationen (Bild optional · Name/Anliegen · Betrag + Avatar). Die Quellen-Symbole sind entfallen.
- Kundenakte: Die Positionen haben Spaltenköpfe. Die Menge (48 px) steht rechtsbündig direkt vor dem Betrag (120) und dem Stand (120). Weitere Vorgänge sind zweizeilig (Titel / Nummer · Stand).

### Kiosk
Alle Trefferflächen sind ≥ 44 px: „+“ 44 px mit 18-px-Symbol (nur Hinweis, die ganze Kachel ist die Trefferfläche), Kategorien 44 px mit 16 px Schrift, Mengenwähler 44 px mit Knöpfen 44 × 44, Kopfzeilen-Knöpfe 44. Die gewählte Zahlart hat einen 2-px-Ring in Tinte auf `--panel`, Messing nur beim Fokus. Die Kundenkarten-Plakette ist eine echte Mini-Karte (20 × 13, r 2, Verlauf Silber `#d9d9d6 → #a9a9a4` / Gold `#d8c08a → #a9884a`, 1 px Innenlinie). Im Bezahlknopf steht das Wort links und der Betrag als eigenes Element rechts (`space-between`, 18 px Tabellenziffern). Das Artikelraster läuft unten mit einer 28-px-Maske aus.

### QA wie eine Agentur
- `_qa/screens.mjs` nimmt erst auf, wenn alle endlichen Animationen beendet sind (`getAnimations().finished`, Endlos-Pulse ausgenommen). Es nimmt jede Ansicht bei **1440, 1180 und 1024** auf, hell und dunkel, dazu Palette, Board und Abschluss (28 Bilder).
- Alle Bilder sind durchgesehen: keine abgeschnittene Spalte, kein Text unter einer Fußleiste, keine Ellipse in Hinweis, Aufgaben oder Aktivität (diese Zeilen umbrechen jetzt).
- axe-core (hell + dunkel, alle 4 Screens) zeigt keine Verstöße, Kontrast AA eingehalten.
- Bilder: 12 lokale Kopien in `backoffice/public/entwurf/praezision/`, unverändert, neu sind `minotti-patio.jpg` und `minotti-navetta42-heck.jpg`.

### Do / Don't (Ergänzung)
| Do | Don't |
|---|---|
| Aktiv = Messing-Zapfen auf der Haarlinie | Aktiv = weiße Pille mit Schatten |
| Kundenmaterial zeigen (Rendering, Stoff, Plan) | Initialen, wenn es ein Bild gibt |
| Eine Hinweisleiste oben | Warnkarte irgendwo in der Spalte |
| Ein Abschluss-Moment pro Vorgang | Konfetti, Toasts mit Animation, Sounds |
| Zeilen umbrechen lassen | Ellipsen bei Informationen, die man lesen muss |
