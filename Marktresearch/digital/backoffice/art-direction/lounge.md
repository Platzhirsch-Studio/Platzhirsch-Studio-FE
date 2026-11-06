# Art-Direction „Lounge“ – Platzhirsch Backoffice

**Stand:** 04.11.2026 · vierte Richtung, vom Inhaber selbst vorgegeben (fünf Referenzen in `referenzen/`, „nicht wegen den Farben, sondern von der Aufteilung und Gestaltung“), ergänzt um seinen Maßstab „so hochwertig wie Apple-Design und iPhone“.
**Vorschau (ohne Anmeldung, noindex):** `http://localhost:3100/entwurf/lounge` · `/anfragen` · `/kundenakte` · `/kassa` · `/packtisch` · `/kundendisplay?zustand=ruhe|einkauf|bezahlen|danke[&zahlart=bar]`
**Code:** `backoffice/src/app/entwurf/lounge/` (Routen + 6 CSS-Dateien) · `backoffice/src/components/Entwurf/Lounge/` (Bausteine, Daten, `shoot.mjs`) · Bilder `backoffice/public/entwurf/lounge/` (16 Kopien aus `public/Images`, unverändert)
**Screenshots:** `backoffice/qa-screenshots/entwurf-lounge/` (hell + dunkel; Desktop 1440×900 Vollseite, Kassa/Packtisch iPad quer 1180×820, Kundendisplay 1920×1080 und 820×1180). Neu erzeugen: `node src/components/Entwurf/Lounge/shoot.mjs [filter]` im Ordner `backoffice` (prüft Konsolenfehler, Ellipsen, Bild-Dubletten, Überlauf).

---

## 1. Leitidee

**Ein Showroom-Lounge-Tisch, auf dem die Arbeit liegt.** Ruhige, warm getönte Fläche (Kalk/Leinen), darauf schwebende Kacheln wie Objekte auf einem Travertin-Tisch – groß gerundet, ohne Rahmen, nur durch weiche Schatten getragen. Navigation leicht und am Rand (eine schwebende Symbolleiste, Pillen-Reiter), Inhalt in der Mitte mit viel Luft. Menschen und Räume sind sichtbar (Avatar-Reihen, Raum- und Produktbilder), Abläufe ebenfalls (Kundenreise als verbundene Stufen). Farbe ist Material, nicht Dekoration: Cognac-Leder, Salbei, Eiche, Messing – sparsam, höchstens zwei Akzentkacheln je Bildschirm.

Gegen die Ablehnung („billige Web-App, Amateure“) wirkt die Richtung über vier Hebel: (1) keine Rahmen und Linien als Gliederung, sondern Fläche + Schatten + Abstand; (2) eine einzige, konsequente Radien- und Abstandsskala; (3) große, leichte Typografie mit Tabellenziffern; (4) Bewegung mit Feder statt linearer Übergänge.

## 2. Bezug zu den fünf Referenzen

| Referenz | Was übernommen ist | Wo |
|---|---|---|
| **1 Sugar CRM – Customer Journeys** | Pillen-Reiter oben mit dunkler Aktiv-Pille; runde Symbolknöpfe (Suche, Glocke, Plus, Teilen, Kalender); Stufen-Spalten als gerundete Karten mit Personen-Avatar, Häkchen/Kalender je Schritt; Spalten durch Linien mit Knoten verbunden; dunkle Hervorhebung des aktuellen Schritts; Avatar-Reihe über dem Ablauf | Shell, Kundenakte „Kundenreise“ |
| **2 Praxis-Dashboard** | Leichte zweizeilige Begrüßung („Guten Morgen, / Lena“), daneben drei Zahlen inline mit Trennlinien; „Heute“-Spalte mit hervorgehobenem aktivem Termin (Avatar, Zeit, Knopf „Beratung starten“ + runder Nebenknopf) und kompakten Folgeterminen; „Braucht deine Antwort“-Kachel mit Zitatstrich und Avatar-Reihe; zwei getönte Kennzahl-Kacheln mit großer Zahl und rundem Pfeil-Knopf | Zentrale |
| **3 Inventory** | Vollflächige Akzentkacheln mit sehr großer Zahl; Produktbild in Tabellenzeilen; Pillen-Suchfeld + Filter als runde Knöpfe in einer Reihe | Zentrale, Kassa, Packtisch |
| **4 FlowERP** | Bento-Raster mit Kacheln unterschiedlicher Größe nach Wichtigkeit; Tabelle innerhalb einer Kachel mit luftigen Zeilen und weichen Status-Pillen; Diagramm-Kachel; Aktivitätsliste | Zentrale, Anfragen |
| **5 AeroLink** | Großes Hero-Bild mit Glas-Kacheln (backdrop-blur) darüber – Beträge, nächster Termin, Liefertermin; Aktionen als Glas-Pillen direkt auf dem Bild | Kundenakte |

Ausdrücklich **nicht** übernommen: die Farben der Referenzen (Blau, Gelb, Orange, Grün) und deren Fotos von Personen.

Positiver Ausgangspunkt aus den vom Inhaber genannten Bildschirmen der anderen Entwürfe (Showroom-Kundenakte, Showroom-Kassa, Präzision-Kassa dunkel): großes Projektbild mit Aktionen, Kundenreise mit aktuellem Schritt, Zeitleiste mit Bildern/Belegen, Beträge-Karte mit Zahlungsbalken, größte Positionen mit Produktbild, Bezüge; Kassa mit Bildkacheln + runden Plus-Knöpfen, Warenkorb rechts mit Kunde oben und großem Bezahlknopf, Statuszeile mit Bereit/Uhr/Bediener, Zahlart-Auswahl. Die Lounge hebt das über schwebende Bento-Kacheln, verbundene Stufen, Material/Unschärfe, Squircles und Federbewegung eine Stufe an.

## 3. Token

Alle Token in `lounge.css` unter `.lg`; dunkel über `prefers-color-scheme` oder `[data-theme="dark"]`, `[data-theme="light"]` erzwingt hell. Dunkel ist eigens gewählt (nicht invertiert): Fläche fast schwarz mit warmem Schimmer, Kacheln eine Stufe heller, Aktiv-Pille wird hell.

| Rolle | Hell | Dunkel |
|---|---|---|
| Fläche (Kalk) | `#ebe7e0` + zwei weiche Licht-Verläufe (Leinen/Travertin) | `#121416` + Eiche-/Salbei-Schimmer 7–10 % |
| Kachel | `#fbfaf8` | `#1b1e21` |
| Kachel 2 (eingelassen) | `#f4f1ec` | `#222629` |
| Kachel 3 | `#ebe7e0` | `#2a2e32` |
| Material (Leiste, Kopf, Sheets) | `rgba(250,248,245,.72)` + blur 32 + saturate 180 % + 0,5-px-Lichtkante | `rgba(30,33,36,.66)` + Lichtkante 8 % |
| Text (Tinte) | `#30373e` | `#efebe5` |
| Text 2 | `#5b626a` (AA 5,9:1) | `#b1b4b8` |
| Text 3 | `#6a7077` (AA ≥ 4,5:1 auf Kachel) | `#969a9f` |
| Aktiv-Pille / Primärknopf | `#30373e` auf `#f8f5f0` | `#efebe5` auf `#1a1d20` |
| Fokus | Cognac `#8f5230` | `#e2a77f` |

**Materialpalette (Akzente, sparsam):** Cognac-Leder `#8f5230` · Eiche `#b08850` · Salbei `#6f8a6a` · Messing `#b8975a` · See `#4f6b68` · Nuss `#6b4a33` · Travertin `#cdbfa8`. Jede als weiche Status-Pille (Fläche/Schrift/Punkt, hell und dunkel eigene Stufen) und als Avatar-Verlauf (zwei Stufen desselben Materials, dunkle Initialen, AA).
**Akzentkacheln:** Cognac (Verlauf `#9a5a36→#844a29`, Schrift `#fbf2ea`) und Salbei hell (`#e2e9dc→#d4dfcd`, Schrift `#2b3a2a`) bzw. Salbei dunkel (`#34412f→#2a3527`). Max. 2 je Bildschirm.
**Diagramm:** eine Reihe = eine Farbe (Tinte), Hervorhebung des Bezugsmonats in Tinte, Rest 16 % Tinte, laufender Monat schraffiert; kein Doppelachsen-Diagramm; Tooltip je Balken (Hover/Fokus), Werte als `aria-label`.

## 4. Radien, Schatten, Raster

- **Radien nach Hierarchie:** Fenster/Hero 32 · Kachel 28 · Karte 20 · eingelassene Karte = Kachel − Innenabstand (28 − 8 = 20) · Zeile/Feld 14–16 · Knopf/Feld 12 bzw. rund · Pille/Rundknopf 999. Progressive Verbesserung `corner-shape: superellipse(1.35)` für Kacheln, Hero, Panels, Kassa-Karten (kontinuierliche Rundung, wo der Browser es kann).
- **Schatten (hell):** Kachel `0 0 0 .5px` Kontur 6 % · `0 1px 2px` 4 % · `0 8px 24px` 5 % · `0 24px 64px` 6 % (warmes Braun statt Schwarz). Hover/Lift und Float jeweils eine Stufe tiefer. Dunkel: zusätzlich 0,5-px-Innenlichtkante oben, Schatten in Schwarz 22–42 %.
- **Raster:** 4/8 px ohne Ausnahme. Desktop: schwebende Leiste 72 breit, 16 vom Rand; Inhalt ab 120 px, rechts 32; 12 Spalten, Gutter 24. Kopfzeile 88 hoch (sticky, wird beim Scrollen zu Material). Kassa/Packtisch: Rand 12–16, Gap 12–16, Kopf als schwebende Pille 64.
- **Haarlinien:** `--hair` = 1 px, auf Retina 0,5 px (`@media (min-resolution: 2dppx)`).

## 5. Typografie

- **UI:** auf Apple-Geräten SF Pro (`-apple-system, BlinkMacSystemFont`), sonst **Inter** mit optischer Größe (`opsz`) über `next/font`. Begründung: Inter ist die nächste freie Verwandte von SF (gleiche Proportionen, Display-Schnitt ab ~28 px, saubere Tabellenziffern `tnum`, Stil-Sets `cv11/ss01/ss03` für ruhigere Ziffern und Buchstaben). Instrument Sans (Website) bleibt der Website vorbehalten; sie ist bei 300 zu dünn konturiert und hat keine optischen Größen für die große leichte Begrüßung.
- **Wortmarke:** PLATZHIRSCH in **Bodoni Moda**, 500, gesperrt 0,3 em – einzige Serifenstelle. Monogramm „P“ in Bodoni im Kreis oben in der Leiste.
- **Skala:** Begrüßung 56/60 · 300 (Name 400) · Large Title 34/40 · 600 · Hero-Titel 48/52 · 600 · Title 22/28 · 600 · Kachel-Titel 17/24 · 600 · Body 15/22 · Caption 13/18 · Klein 12/16. Tracking −0,035 em bei 56, −0,022 bei 34, −0,012 bei 17. Kennzahlen 34 · 400 bzw. Akzentzahl 64 · 300. Alle Zahlen `tabular-nums`. Höchstens drei Größen je Kachel.

## 6. Komponenten

| Komponente | Beschreibung |
|---|---|
| **Schwebende Leiste** | Material-Kapsel, Radius 36; Icons (lucide 20, Strich 1,75) in 48-px-Kreisen; aktiv = gefüllter Tinte-Kreis mit Schatten; Hinweis-Punkt für neue Einträge; Tooltip-Pille gleitet mit Feder ein; unten Hell/Dunkel + eigener Avatar |
| **Pillen-Reiter** | Unterbereiche des aktiven Bereichs, Material-Kapsel, aktive Pille Tinte |
| **Rundknopf** | 44 (40 in Kacheln), Kachel-Fläche + Knopfschatten; Badge rund in Cognac mit Flächenring |
| **Pfeil-Knopf „öffnen“** | 44, Tinte (auf Cognac weiß), unten rechts in Kacheln; dreht 45° beim Kachel-Hover (Feder) |
| **Kachel** | Radius 28, Innenabstand 24 (20 bei dichten Kacheln), Kopf: Titel 17 + Unterzeile 13 links, Werkzeuge rechts; Fuß mit Avatar-Reihe links + Pfeil rechts |
| **Akzentkachel** | Material-Ton vollflächig, Bezeichnung oben, kurzer Satz, sehr große Zahl unten links |
| **Avatar / Avatar-Reihe** | Initialen-Kreis im Materialverlauf; Reihe überlappt 18 %, Ring in Kachelfarbe, Zähler „+n“ in Tinte |
| **Status-Pille** | 28 hoch, Punkt + Wort, weiche Materialfläche – nie Farbe allein |
| **Segmented Control** | iOS-Vorbild: Kapsel 8 % Tinte, gleitender Indikator (Feder auf `transform` + Breite), Zähler gedimmt |
| **Suche** | Pillenfeld 40/48, Fokus = 2-px-Ring; Filter als runder Knopf daneben |
| **Tabelle in Kachel** | Zeilen 72–80 hoch, Haarlinie oben, Hover = ganze Zeile als gerundete Fläche; Auswahl = Fläche + 3-px-Tinte-Kante links |
| **Vorschau-Panel** | schwebende Karte rechts, sticky, Bild mit Glas-Chips und Glas-Schließknopf, Aktionskreise (Anrufen/E-Mail/Termin/Mehr), Wunsch-Karte, Fakten 2-spaltig, Mini-Kundenreise, Primärknopf + Pfeil; gleitet mit Feder ein |
| **Hero mit Glas-Kacheln** | Bild 440 hoch, Verlaufs-Abdunklung nur links/unten, Titel weiß 48; Glasplatte rechts unten mit 2×2 Glas-Kacheln (blur 28, saturate 180) |
| **Kundenreise** | 7 Stufen-Karten auf eingelassener Fläche; Schritt = Avatar oder „+“-Kreis, Status-Symbol (Doppelhaken / Uhr / Kalender), Text 13/600, Datum 12; aktueller Schritt als Tinte-Karte, aktuelle Stufe mit 1,5-px-Tinte-Kontur; Verbindungen als SVG-Bezier mit Knoten (gemessen per ResizeObserver), offen = gestrichelt; Stufenname unter der Spalte, erledigt mit Häkchen |
| **Zeitleiste** | Symbolkreis in Materialfläche, Titel + Uhrzeit, Text/Zitat, Beleg-Chip (PDF), Bildreihe 4:3 mit Radius 16, Urheber klein mit Avatar |
| **Beträge** | große Zahl 40/400, Zahlungsbalken in drei Segmenten (bezahlt Salbei · fällig Eiche · später Linie), Liste mit Punkt |
| **Kundenkarte** | **ohne Geldwert**: Stufen-Chip (Platzhirsch · Plus · Privé) in Cognac/Bodoni-Monogramm, Leistungsvorteile als Chips (Lieferung frei, Pflege-Service, Vorab-Zugang Event); Einlösung als Hinweiszeile „steht am Bon · inklusive“, keine Punkte, kein Rabatt, kein Guthaben |
| **Sheet** | Material blur 40, Griff 40×5, gleitet mit Feder von unten; Häkchen zeichnet sich (stroke-dashoffset); iOS-Schalter darin |
| **iOS-Schalter** | 51×31, Daumen 27 mit Doppelschatten, Feder; gedrückt verbreitert sich der Daumen |

## 7. Bildschirme

1. **Zentrale** – Prinzip 7 + Bento: Begrüßung leicht 56 px mit drei Zahlen; „Heute“-Spalte (aktiver Termin Familie Brändle, Knopf „Beratung starten“, vier Folgetermine); „Braucht deine Antwort“; zwei Akzentkacheln (Cognac „7 neue Anfragen“, Salbei „4 Montagen“); Pipeline mit drei Kennzahlen und Stufenbalken; Umsatz-Balken (Okt hervorgehoben, Nov schraffiert); Projekte-Tabelle mit Bildern, Stufen-Pillen, Avatar-Reihen, Fortschritt; Aktivität.
2. **Anfragen** – Seitenkopf mit Large Title + zwei Kennzahlen + Primärknopf; Segmented Control (Alle/Neu/Beratung/Angebot/Ruhend mit Zählern), Pillen-Suche, Bereich/Berater-Pillen, runder Filter; Tabelle in Kachel mit Bild, Kunde, Bereich, Kanal, Budget, Eingang, Berater-Avatar, Status; Vorschau rechts als schwebende Karte.
3. **Kundenakte/Projekt** – Kopf mit rundem Zurück-Knopf + Pfad + Kundenkarten-Stufe; Hero „Haus am See“ mit Glas-Kacheln (Auftragswert, Bezahlt mit Balken, Nächster Termin mit Avatar, Lieferung KW 49) und Glas-Aktionen; Segmented Tabs; **Kundenreise** als Herzstück (Anfrage → Beratung & Aufmaß → Planung → Angebot & Auftrag → Bestellung & Lieferung → Montage & Abnahme → Service); darunter Verlauf, Beträge, Größte Positionen, Bezüge.
4. **Kassa** (iPad quer) – Statuszeile als Material-Kapsel (Kassa 1, Bon, Bereit, Uhr, Bediener, Belege, Hell/Dunkel, Sperren); Scan-/Suchfeld; runde Kategorien-Kacheln 60 px; Produktkacheln mit Freisteller auf Leinen-Grund, Lager-Chip, Korb-Zähler (Feder-Pop), runder Plus-Knopf; Warenkorb als schwebende Karte rechts (Kundin + Stufe, Vorteils-Chips, Positionen mit Stepper, Summe, Vorteil als Bon-Hinweis, Zahlart-Segment, Bezahlen 64 px). Bezahlt-Sheet mit gezeichnetem Häkchen, E-Mail-Schalter, „Nächster Kunde“.
5. **Packtisch** (nach JTL-Prinzip, `33-referenz-jtl-packtisch.md`) – Segment Paket/Sperrgut; großes Scanfeld (grüner Ring = bereit, rot + Schütteln = Fehler) + Mengenfeld + Fortschrittsring „4 von 6 Positionen · 10/13 Stück“; links Auftragskopf (Quelle, Nummer, Versandart, Adresse, Packhinweise als Banner); Mitte Positionen mit Bild, EAN, Ist/Soll groß, Status in Farbe **+ Text + Symbol** (Vollständig salbei · aktiv mit Ring und „Gerade +1“ · ohne Barcode messing mit „Bestätigen“ · offen); erledigte rutschen nach unten; Fehlscan als roter Banner mit „Fehlerton“-Hinweis; rechts Pakete/Packstücke (Packmittel-Segment, Gewicht manuell mit Plausibilität, weiteres Paket, Versand/Übergabe); unten „Problem: Fehlt/Falsch/Beschädigt“, Zurückstellen, Lieferschein, Etikett · LetMeShip (Sperrgut: Packstück-Etikett), **ein** Abschluss-Knopf „Paket abschließen“ bzw. „An Tour übergeben“ (gesperrt mit Restangabe, bis alles erfasst ist).
6. **Kundendisplay** – siehe §10.

## 8. Bewegung (Apple-Qualität)

- **Federn:** zwei aus der Feder-Differentialgleichung berechnete `linear()`-Kurven (ζ 0,72 Antwort 0,42 s für Knöpfe/Indikatoren/Panels; ζ 0,9 für Einblenden). Nur `transform`/`opacity` animiert (Ausnahme Breite des Segment-Indikators).
- Kachel-Hover hebt 2 px + tieferer Schatten; Pfeil dreht 45°; Drücken skaliert 0,94–0,97 und federt zurück (Feedback < 100 ms, 80 ms Eindrückdauer).
- Bento-Kacheln, Reise-Spalten, Produktkacheln staffeln 25–30 ms; Balken wachsen aus der Grundlinie; Zahlen zählen beim Erscheinen hoch.
- Vorschau-Panel, Warenkorb und Sheets gleiten mit Feder ein; Häkchen zeichnet sich nach 220 ms.
- `prefers-reduced-motion`: alle Animationen auf 1 ms, Zahlen sofort final, Häkchen gezeichnet, Ruhebild ohne Überblenden.

## 9. Apple-Qualität – Umsetzung der acht Vorgaben

1. **Material & Tiefe:** Leiste, Reiter, Kopfzeile (ab 8 px Scroll), Kassa-Statuszeile, Sheets, Ruhebild-Panel aus durchscheinendem Material (`blur(32–40px) saturate(180%)`, 0,5-px-Lichtkante oben); Inhalte laufen sichtbar darunter durch. Schatten mehrlagig 1/8/24/64.
2. **Formen:** Radien nach Hierarchie 32/28/20/12/rund, verschachtelt = außen − Innenabstand; `corner-shape: superellipse()` als progressive Verbesserung.
3. **Typografie wie SF:** System-Schrift zuerst, sonst Inter mit `opsz`; enge Skala, negatives Tracking bei großen Größen, `tabular-nums` überall, Gewichte 300/400/500/600, max. 3 Größen je Kachel.
4. **Bewegung mit Physik:** siehe §8.
5. **iOS-Bedienelemente:** Segmented Control mit gleitendem Indikator (Anfragen, Akte, Kassa-Zahlart, Packmittel, Auftrag), iOS-Schalter, Sheet mit Griff, Suchfeld als Pille, runde Badges, Ziele ≥ 44 (Kassa/Packtisch 44–64).
6. **Präzision:** 4/8-Raster, lucide mit Strich 1,75 in 16/20/24, Haarlinien 0,5 px auf Retina, eine gestufte Neutralskala aus Tinte (8/14 % Linie, 5/8 % Füllung).
7. **Ruhe & Fokus:** je Bildschirm eine Hauptaktion in Tinte (Neue Anfrage · Beratung vereinbaren · Termin · Bezahlen · Paket abschließen); Farbe nur mit Bedeutung (Status, Material der Kundenkarte, zwei Akzentkacheln).
8. **Gefühl:** Kacheln erscheinen ohne Springen an fester Stelle (Raster steht vor dem Inhalt; Skeletons in exakter Kachelform sind für die Bauphase vorgesehen: gleiche Radien, `tile-2`-Fläche, 1,2-s-Schimmer, bei reduzierter Bewegung statisch); Druck-Feedback sofort; Erfolgsmoment = gezeichnetes Häkchen.

Gegencheck „gehört das in eine Apple-System-App?“: Kalender/Home-Anmutung erreicht über Material-Leiste, Segment-Indikator, Sheet mit Griff, große leichte Titel; bewusst **nicht** kopiert: SF-Symbole, Systemblau, iOS-Listen-Optik.

## 10. Kundendisplay (zweiter Bildschirm der Kassa)

Ausgerichtet nach `10-konzept-kassa.md` (§2.1 Route, §9 Zustände, K26, R10):

| Zustand | Inhalt |
|---|---|
| **ruhe** | Raum-/Produktbilder überblenden langsam (24-s-Zyklus, leichtes Driften); Material-Panel mit Bodoni-Wortmarke, „Schön, dass Sie da sind.“, Hinweis Kundenkarte (Leistungsvorteile) und nächstes Event |
| **einkauf** | „Guten Tag“ (ohne Namen), letzte 6 Positionen mit Bild, Menge × Preis, Betrag 28+ px; neueste Zeile federt herein und trägt Salbei-Ring; rechts Kundenkarte **nur Stufe** („Kundenkarte erkannt · Platzhirsch Plus“) + eingelöste/verfügbare Leistungsvorteile, Zwischensumme, Gutschein-Abzug, enthaltene USt, Gesamt in Tinte-Fläche ≥ 64 px |
| **bezahlen** | Betrag 138 px; Karte: „Bitte Karte oder Telefon an das Terminal halten“ mit pulsierendem Kontaktlos-Symbol; bar: Gegeben / Rückgeld als zwei Karten |
| **danke** | Häkchen zeichnet sich, „Vielen Dank“, Rückgeld (bar) bzw. Kartenzahlung, Vorteil-Hinweis, QR für den digitalen Beleg (Platzhaltermuster im Entwurf) – **ohne Namen** |

Maßeinheit skaliert mit der Fläche (`--u`, 1920 → 19,2 px), lesbar auf 1,5 m; keine Bedienelemente.
**Bauphase:** Route laut Konzept `/kassa/display?kasse=K1` (eigenes Layout ohne Kopf, Gerätebindung). Kopplung: gleiches Gerät über `BroadcastChannel("ph-kassa-K1")`, zweites Gerät über den SSE-Proxy des Fundaments (`/api/kassa/display`, Kassen-ID, Rückfall Polling 2 s); ohne Verbindung Ruhebild + „Anzeige pausiert“. Datensparsam: keine Kontaktdaten, Standard ohne Namen (`kundendisplay_anrede` aus · Vorname · Name, nie Anrede).
**Abweichungen vom Konzept:** (a) Konzept nennt Instrument Sans für die Gesamtzahl – Lounge nutzt Inter/SF wie das übrige Backoffice-Lounge; (b) Konzept-Zustand „Beleg“ (QR nur bei Druckfehler) ist hier in „danke“ integriert und immer sichtbar – Entscheidung offen; (c) Ruhebild zeigt zusätzlich Kundenkarten-/Event-Hinweis (Konzept: nur `kundendisplay_text`) – als Inhalt von `kundendisplay_text` abbildbar; (d) Anzeige der Kundenkarten-**Stufe** ohne Namen ist eine Ergänzung (Konzept schweigt dazu); (e) Dank-Dauer 8 s und Training-Band nicht dargestellt.

## 11. Do / Don't

| Do | Don't |
|---|---|
| Gliedern über Fläche, Schatten, Abstand | Rahmen und Linien als Hauptgliederung |
| Eine Hauptaktion in Tinte je Bildschirm | Mehrere gleich laute Primärknöpfe |
| Max. 2 Akzentkacheln, Materialtöne | Ampelfarben, Systemblau, Verläufe als Dekor |
| Status immer Punkt/Symbol + Wort | Farbe allein |
| Zahlen `tabular-nums`, große Zahlen leicht | Fette Riesenzahlen, proportionale Ziffern in Spalten |
| Bilder echter Räume/Produkte aus dem Sortiment | Stock-Fotos von Personen, Avatare mit Gesichtern |
| Radien aus der Skala, verschachtelt rechnen | Beliebige Radien, gleicher Radius innen wie außen |
| Federbewegung auf transform/opacity | Lineare Übergänge, Layout-Animationen, Springen |
| Kundenkarte = Stufe + Leistungsvorteile | Punkte, Prozente, Guthaben |

## 12. Übertragung

- **Kiosk (Kassa/Packtisch, iPad quer):** keine Leiste, stattdessen schwebende Statuszeile; Ziele 44–64; keine Hover-Abhängigkeit (Kassa-Konzept: keine Hover-Effekte – Lounge-Hover sind nur Zusatz); Kategorien als runde Kacheln, Hauptknopf 64 hoch unten rechts.
- **iPhone:** Leiste wird zur schwebenden Tab-Kapsel unten (5 Kreise, Material), Pillen-Reiter als horizontal scrollbares Segment; Bento wird einspaltig in der Reihenfolge Heute → Wartet → Akzentkacheln (2 nebeneinander) → Projekte als Karten statt Tabelle; Kundenreise als vertikale Stufenliste mit Knotenlinie links; Vorschau-Panel wird Sheet mit Griff; Begrüßung 34/300.
- **Druck (Angebot, Lieferschein, Bon):** Wortmarke Bodoni gesperrt oben; Inter 9–10 pt, Tabellenziffern; keine Schatten/Unschärfe – Kacheln werden zu Feldern mit 0,5-pt-Linie und Radius 3 mm; Akzentfarbe nur Cognac für Summenlinie; Kundenkarten-Vorteile als Zeile „Vorteil … eingelöst“ ohne Betrag; Status als Wort.

## 13. Selbstkritik nach Iterationen

Drei Durchgänge (Zentrale → alle Bildschirme hell → dunkel/Kassa/Packtisch/Display), jeweils neben die Referenzen gelegt. Korrigiert: Avatar-Überlappung (Initialen abgeschnitten), leere Pipeline-Kachel (Kennzahlenreihe ergänzt), Zahlformat (de-DE statt Leerzeichen-Tausender), Hero-Glasplatte (unfertige „Kachel hinzufügen“ entfernt, 2×2), Tabellenumbrüche, Vorteilsposition in der Kassa (als Bon-Hinweis statt verdeckter Zeile), Produktbilder im Dunkelmodus gedämpft, Kundendisplay-Summenkarte kompakt. Urteil: Wertigkeit, Luft und Rhythmus auf Augenhöhe mit Praxis-Dashboard, FlowERP und AeroLink; die Kundenreise erreicht die Sugar-CRM-Anmutung mit echten Platzhirsch-Stufen. Offene Punkte für die Bauphase: echte Skeletons, Kontextmenü mit Unschärfe, iPhone-Fassung, Messung der Kontraste im laufenden Build mit axe.
