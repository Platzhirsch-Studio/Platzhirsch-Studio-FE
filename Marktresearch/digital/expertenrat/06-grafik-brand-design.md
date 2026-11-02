# 06 – Grafik- und Brand-Design: Logo, Typografie, Bildsprache, Anwendungen

**Stand:** 26.10.2026 · Rolle: Grafikdesigner / Brand-Designer · Expertenrat Neuauftritt Platzhirsch Home Living
**Grundlagen:** `digital/01` (Designsystem 2.0), `02` (Motion), `12` (Stimme „Der Gastgeber“, Fotostil „Seelicht“), `13` (Performance/A11y), `14` (Recht), `23` Abschnitt 4 (Positionierung). Gesichtet: aktuelles Logo `public/Images/Navbar/Logo.png` (goldener, naturalistischer Hirschkopf zwischen PLATZ und HIRSCH, Versalien-Serife) und der Galerie-Prototyp `src/components/Preview/galerie/{Logo.js,fonts.js}` (Logo-Konzept „Der Platz“, Cormorant Garamond + Instrument Sans). Die Routen `src/app/[locale]/preview/*` existierten zum Zeitpunkt der Prüfung noch nicht, `localhost:3000` antwortete nicht.
**Kontrastwerte** in diesem Papier sind mit der WCAG-2.x-Formel nachgerechnet (Node-Skript, 26.10.2026).

---

## 1. Die wichtigsten Erkenntnisse für dieses Projekt

**E1 – Der Name ist laut, also muss die Gestaltung leise sein.**
„Platzhirsch“ heißt umgangssprachlich „der Dominante am Ort“. Das ist einprägsam, kann aber nach Angeberei klingen und passt damit schlecht zur Stimme „Gastgeber, nicht Händler“ (12, 3.1). Die Lösung liegt im Kontrast: ein selbstbewusster Name in sehr zurückhaltender Form, mit Versalien, viel Luft, ohne Gold-Effekte und ohne Trophäe. Das ist dieselbe Logik, mit der Bottega Veneta oder Aesop arbeiten (01, 2.1). Die Bildmarke darf den Hirsch zeigen, aber nicht als Jagdtrophäe, sondern als Zeichen: Geweih als Linie, als Struktur, als Wachstum.

**E2 – Vorhandene Wiedererkennung nicht wegwerfen, sondern übersetzen.**
Nach Romaniuk (Ehrenberg-Bass) entsteht der Wert eines Markenelements aus *Bekanntheit × Einzigartigkeit*, und Marketer überschätzen regelmäßig, wie bekannt ihre Elemente sind, während sie die Einzigartigkeit unterschätzen ([Marketing Week](https://www.marketingweek.com/marketers-judgement-strength-brand-assets-rarely-accurate/), [marketingscience.info](https://marketingscience.info/brands-need-distinctive-assets/)). Heute bekannt sind drei Dinge: **das Wort PLATZHIRSCH in Versalien, der Hirsch und Gold.** Der Neuauftritt behält alle drei, übersetzt sie aber: Der Hirsch wird zur Geweih-Linie, Gold wird zu Messing als Material (Schild, Prägung, Folie) statt zu einer Bildschirmfarbe für Text. Ein harter Bruch würde die lokale Bekanntheit am See und in Lindau verschenken.

**E3 – Ein gegenständliches, aber stilisiertes Zeichen ist besser als ein abstraktes.**
Henderson & Cote (1998, *Journal of Marketing*, 195 Logos): Für Wiedererkennung und ein professionelles Image sollten Logos **„natürlich“ (gegenständlich erkennbar), sehr harmonisch und mittelmäßig komplex** sein ([Kurzfassung, PDF](https://newion.uwinnipeg.ca/~ssingh5/Lm/logo-guide.pdf); international bestätigt in Chile, [Olavarrieta & Friedmann 2007](https://repositorio.uchile.cl/handle/2250/140229)). Luffarelli, Mukesh & Mahmood (2019, *JMR* 56(5), 597 Logos, 6 Studien): **Beschreibende Logos**, die erkennen lassen, worum es geht, verbessern Markenbewertung, Kaufabsicht und Performance über wahrgenommene Authentizität. Der Effekt ist bei **wenig bekannten Marken am stärksten** ([Westminster Research](https://westminsterresearch.westminster.ac.uk/item/qqv8q/let-the-logo-do-the-talking-the-influence-of-logo-descriptiveness-on-brand-equity)). Platzhirsch ist außerhalb von Lochau und Lindau kaum bekannt (CH, FL, Allgäu). **Folgerung:** Das Geweih soll als Geweih erkennbar bleiben. Ein rein abstraktes Monogramm ohne Hirschbezug wäre die schwächere Wahl. Ein naturalistischer Kopf mit Fell und Augen wäre zu viel Detail und zu rustikal.

**E4 – Die Form des Zeichens wirkt auf Produktattribute.**
Jiang, Gorn, Galli & Chattopadhyay (2016, *Journal of Consumer Research* 42(5), 5 Experimente): Ein rundes Logo lässt das Produkt bequemer und das Unternehmen zugewandter wirken, ein eckiges eher härter und haltbarer ([PolyU, Volltext](https://ira.lib.polyu.edu.hk/handle/10397/64985), [APS](https://www.psychologicalscience.org/news/minds-business/the-shape-of-a-logo-has-a-powerful-impact-on-consumers120911.html)). Platzhirsch verkauft beides: Sofas (Komfort) und Küchen aus Stein (Dauer). **Folgerung:** Die Geweihlinien enden weich und gerundet (Komfort, Gastgeber). Rahmen, Raster und Buttons bleiben eckig (`rounded-none`, Präzision, Dauer). Das passt zu 01 („Minotti, Poliform und BV sind eckig“).

**E5 – Serifen steigern wahrgenommenen Luxus, Grotesk sorgt für Lesbarkeit.**
Eine italienische Studie (2024) mit echten und erfundenen Markennamen fand, dass Serifen die Luxuswahrnehmung erhöhen, vor allem in den Dimensionen „Opulenz“ und „Elitismus“ nach Heine ([Marketing Trends Congress 2024, PDF](https://archives.marketing-trends-congress.com/2024/pages/PDF/133.pdf)). Eine Studie aus dem chinesischen Luxusmodemarkt (2022) fand dagegen nur einen kleinen Effekt der Serife ([IDEAS/RePEc](https://ideas.repec.org/a/jfr/jbar11/v11y2022i2p9.html)). **Folgerung:** Die Serife trägt die Marke, also Wortmarke und Display-Titel. Die Grotesk trägt Information, also Text, UI, Maße und Preise. So wird es auch im Bestand geplant (01, 3.2).

**E6 – Bodoni ist die italienische Schrift schlechthin, eine Geschichte, die keiner der Wettbewerber erzählt.**
Giambattista Bodoni arbeitete in Parma. Bodoni Moda (Owen Earl, indestructible type*, SIL OFL 1.1, variabel mit Gewicht und optischer Größe) ist **bereits im Projekt geladen** ([Google Fonts](https://fonts.google.com/specimen/Bodoni+Moda/about)). „Italienisches Wohnen am Bodensee“ (23, 4.1) bekommt damit eine typografische Herkunft, die man im Journal erzählen kann („Warum unsere Titel aus Parma kommen“). Der Nachteil ist bekannt: Unter 32 px brechen die Haarstriche weg (01). Das löst eine strenge Größenregel (V8).

**E7 – Kunst überträgt Luxus auf Produkte.**
Hagtvedt & Patrick (2008, *JMR* 45, „Art Infusion“): Bildende Kunst auf Verpackung, in Werbung oder am Produkt erhöht die Luxuswahrnehmung und die Bewertung. Das gilt unabhängig vom Motiv und vor allem bei hedonischen Produkten wie Möbeln ([SSRN](https://papers.ssrn.com/abstract=2086795), [UGA](https://news.uga.edu/art-infusion-effect/)). Platzhirsch hat mit Vernissagen im Showroom (12, Säule 4) echte Kunst im Raum. **Folgerung:** Kunst bewusst in der Bildsprache einsetzen (Bild an der Wand, Skulptur auf dem Sideboard, mit Credit des Künstlers), außerdem eine jährliche Künstleredition der Lieferkarte (Idee I4).

**E8 – Der Wortbestandteil „Platzhirsch“ ist kennzeichnungsschwach und wird oft genutzt.**
In Gastronomie und Handel gibt es zahlreiche Betriebe mit dem Namen „Platzhirsch“. Eine Recherche fand keinen eindeutigen Registereintrag in Klasse 20 (Möbel) [nicht verifiziert, Websuche ohne Treffer, kein Registerauszug]. **Folgerung:** Unterscheidungskraft entsteht über **Bildmarke + Zusatz „Home Living“ + konsistentes Gesamtbild**, nicht über das Wort allein. Vor der Reinzeichnung braucht es eine Recherche in EUIPO-eSearch, DPMA, ÖPA und Swissreg in den Klassen 20 (Möbel), 35 (Handel), 37 (Montage), 42 (Innenarchitektur) und 43 (Café), dazu eine Anmeldung als Wort-Bild-Marke (EU + CH) durch einen Markenanwalt. Ausdrücklich zu prüfen ist der Abstand zum Jägermeister-Hirsch (Hirschkopf mit Kreuz), denn ein frontaler Hirschkopf mit Symbol zwischen den Stangen liegt gefährlich nah.

**E9 – Selbst gehostete Schriften sind Pflicht, Gold auf Hell ist nicht barrierefrei.**
Fonts laufen bereits über `next/font`, also ohne Abruf bei Google (LG München I, 3 O 17493/20; 14, 1.1). Gold `#d1b250` hat auf Papier `#faf8f4` nur **1,94 : 1** (gemessen) und ist damit als Text und als Fokusring ungeeignet (WCAG 1.4.3/1.4.11; 13, 1.3). Auf Walnuss `#3f3129` erreicht dasselbe Gold dagegen **6,06 : 1**. Gold gehört also auf Dunkel oder ins Material, aber nie als Text auf Hell.

---

## 2. Konkrete Vorgaben für den Neuauftritt

### 2.1 Logo-System

**Empfohlenes Konzept: „Stangen“ (Wortmarke + Geweih-Monogramm)**

```
  Primärlogo (horizontal)                    Monogramm (Bildmarke)

  ⟋⟍  P L A T Z H I R S C H                    ╲ │ │ ╱
  ⟋⟍  ─────────────────────                     ╲│ │╱
      HOME LIVING · LOCHAU                       P─H
                                                 │ │
```

- **Monogramm „PH-Stangen“:** Zwei senkrechte Stämme, nämlich der Stamm des **P** und der rechte Stamm des **H**, wachsen nach oben als zwei Geweihstangen weiter. Jede Stange hat **genau zwei Enden** (Augsprosse + Krone, insgesamt also ein „Achter“-Bild ohne Zählerei). Den Querbalken des H bildet die Bauchlinie des P, das ergibt die Ligatur P+H. Das Zeichen wird aus der Strichstärke der Wortmarke abgeleitet: Stämme = Grundstrich der Versal-Serife, Sprossen = 60 % davon, Enden gerundet (E4).
  - Seitenverhältnis 1 : 1,25 (hochformatig, passt ins 4:5-Bildformat der Website).
  - Konstruktion auf einem **12 × 15-Einheiten-Raster**, Sprossenwinkel 30° und 60° (keine freien Kurven).
  - Schutzraum: **Höhe des P-Bauchs** (= 3 Einheiten) auf allen Seiten.
  - Mindestgröße digital **16 px Höhe** (Favicon: vereinfachte Fassung ohne Augsprosse, nur 2 Stämme + 2 Enden), Druck **6 mm**.
- **Wortmarke:** PLATZHIRSCH in Versalien, **gezeichnet, nicht gesetzt**. Grundlage ist eine Didone- oder Übergangs-Antiqua (Bodoni Moda 500 bei opsz 96 als Skizze). Die Wortmarke wird als Pfad (SVG `path`) reingezeichnet, mit optisch ausgeglichenen Abständen (Sperrung ca. **+180/1000 em**) und mit verkürzten Haarstrichen, damit sie ab 18 px Höhe noch trägt. Optional eine feine Verbindung zwischen T und Z (Ligatur „TZ“) als eigenes, schützbares Detail.
- **Zusatzzeile:** HOME LIVING · LOCHAU AM BODENSEE in der Grotesk, Versalien, 500, Sperrung +140/1000 em, Höhe = **28 % der Versalhöhe** der Wortmarke. Ab einer Logobreite unter 160 px entfällt sie.
- **Varianten (als SVG-Pfade, `currentColor`):**
  1. horizontal (Monogramm links, Wortmarke rechts), Standard für Header und Briefpapier
  2. gestapelt (Monogramm über Wortmarke), für Social, Schild und Visitenkarte
  3. nur Wortmarke, für Header mobil unter 360 px und für Fahrzeuge
  4. nur Monogramm, für Favicon, Avatar, Prägung, Tassen und Stoffetikett
- **Farbversionen:** Ink auf Papier, Papier auf Walnuss, Messing (Folie/Gravur) auf Walnuss oder Naturkarton. **Keine** Goldverläufe, kein Schatten und kein Glanzeffekt auf dem Bildschirm.

**Alternativen, die mitgetestet werden sollten:**

| Konzept | Beschreibung | Stärke | Schwäche |
|---|---|---|---|
| **A „Stangen“** (empfohlen) | PH-Ligatur, die als Geweih nach oben wächst | Beschreibend (E3), schützbar, wirkt als Monogramm auf Textil/Prägung | Erfordert saubere Reinzeichnung |
| **B „Der Platz“** (Galerie-Prototyp) | Quadrat mit zwei Geweih-Haarlinien, Garamond-Wortmarke | Ruhig, „Raum“-Metapher | Haarlinien 1–1,25 px brechen unter 32 px weg; Quadrat als Rahmen ist generisch; Wortmarke als `<text>` mit `textLength` gesetzt (siehe 4.) |
| **C „Wortmarke pur“** | Nur PLATZHIRSCH mit TZ-Ligatur, Hirsch nur als Ornament in Sonderanwendungen | Maximal reduziert (BV-Logik) | Verschenkt den Hirsch als bekanntes Element (E2) und Beschreibungskraft in CH/FL (E3) |

**Test vor der Entscheidung:** Je Konzept 5-Sekunden-Test (n ≥ 30, je zur Hälfte Bestandskunden und Neukunden aus CH/DE) mit drei Fragen: „Woran erinnern Sie sich?“ (ungestützt, Romaniuk), „Was verkauft diese Firma vermutlich?“ (Beschreibungskraft) und eine Skala von „rustikal“ bis „modern“ (1–7). Ziel ist **≥ 60 % ungestützte Nennung „Hirsch/Geweih“** und ein Wert von **≥ 5,5 auf „modern“**.

### 2.2 Farbe (aufbauend auf 01, mit gemessenen Kontrasten)

| Token | Hex | Rolle | Kontrast auf Papier `#faf8f4` |
|---|---|---|---|
| `paper` | `#faf8f4` | Seitenhintergrund | – |
| `stone` | `#ece8e1` | ruhige Bänder | – |
| `ink` | `#30373e` | Text, Logo, Linien | **11,37 : 1** |
| `walnut` | `#3f3129` | eine dunkle Fläche pro Seite, Fahrzeug, Schild | **11,77 : 1** (Papier auf Walnuss) |
| `muted` (neu) | `#6b6f73` | Bildunterschriften, Metadaten | 4,77 : 1 (AA ab 14 px) |
| `see` (neu, optional) | `#4f6268` | Karten, Dreiländer-Grafiken, Infografik | 6,04 : 1 |
| `gold-text` | `#7a5f17` | kleine Akzenttexte auf Hell | 5,69 : 1 (auf Stone 4,95) |
| `gold` / **Messing** | `#d1b250` | **nur auf Walnuss/Ink** (6,06 bzw. 5,85 : 1), Fokusring auf Dunkel, Folie und Gravur im Druck | 1,94 : 1 → **nie** Text/Fokus auf Hell |

- Mengenregel je Bildschirm: **ca. 70 % Papier/Stone, 20 % Bild, 8 % Ink, ≤ 2 % Messing.**
- Druck: Ink ≈ **Pantone 433 C**-Nähe und Walnuss ≈ **Pantone 4625 C**-Nähe als Ausgangspunkt. Die endgültigen Werte werden **am Andruck auf dem gewählten Papier abgestimmt** und nicht per Umrechnung übernommen [Referenzwerte nicht farbmetrisch geprüft]. Messing = Heißfolie (z. B. Kurz Luxor Gold matt) statt CMYK-Gold.
- Fokusring: auf Hell **2 px Ink + 2 px Abstand** (11,37 : 1), auf Dunkel 2 px Messing.

### 2.3 Typografie-System

| Rolle | Empfehlung (frei) | Lizenz | Alternative lizenziert (Preis beim Anbieter prüfen) |
|---|---|---|---|
| Wortmarke | **gezeichnet** (Basis Bodoni Moda) | eigene Reinzeichnung; OFL erlaubt Logos aus OFL-Schriften | Auftragszeichnung durch Schriftgestalter |
| Display (Titel ≥ 32 px) | **Bodoni Moda**, Gewicht 400–500, `font-optical-sizing: auto` | SIL OFL 1.1 | Canela (Commercial Type), GT Super (Grilli Type) |
| Text/UI | **Instrument Sans**, variabel (Gewicht, Breite) | SIL OFL 1.1 ([Google Fonts](https://fonts.google.com/specimen/Instrument%2BSans/about)) | Söhne (Klim), Suisse Int'l (Swiss Typefaces, mit Schweiz-Bezug) |
| Zahlen/Maße | Instrument Sans mit `tabular-nums` | – | – |

**Begründung gegen Cormorant Garamond (Galerie-Prototyp):** Cormorant ist schön, aber sehr fein und wirkt französisch-literarisch. Bodoni erzählt Italien (E6), ist bereits geladen (0 kB zusätzlich) und passt zur Positionierung. Cormorant bleibt Rückfalloption, falls der A/B-Test Bodoni als zu kühl ausweist.

**Skala (fluid, `clamp`, 8-px-Rhythmus, aus 01 übernommen und präzisiert):**

| Stufe | Schrift | Größe mobil → Desktop | Zeilenhöhe | Laufweite |
|---|---|---|---|---|
| Display XL | Bodoni 400 | 48 → 96 px | 1,02 | −0,01 em |
| Display L | Bodoni 400 | 40 → 64 px | 1,05 | −0,005 em |
| Display M | Bodoni 500 | 32 → 44 px | 1,1 | 0 |
| Titel | Instrument Sans 500 | 22 → 26 px | 1,25 | −0,005 em |
| Text | Instrument Sans 400 | 17 → 18 px | 1,6 | 0, max. 68 Zeichen |
| Klein | Instrument Sans 400 | 14 px | 1,5 | +0,005 em |
| Overline | Instrument Sans 500, VERSALIEN | 12 px | 1,3 | +0,14 em |

- **Höchstens 2 Familien** im ganzen System. Kursiv nur bei Bodoni für Zitate von Bauherren.
- Font-Budget: **≤ 2 woff2-Dateien vorgeladen, ≤ 90 kB gesamt** (Subset latin + latin-ext für ç, ë bei Binni/Kosovo-Namen und de-CH).
- Druck nutzt dieselben Schriften (OFL erlaubt Druck und Einbettung).

### 2.4 Layout-Raster

- **Web:** 12 Spalten, Container 1440 px, Ränder 24/48/80 px, **Spaltenabstand 16/24/32 px** (mobil/Tablet/Desktop), Sektionsabstand 96 px mobil, 160–200 px Desktop (01).
- **Asymmetrie-Regel:** Titel in Spalte 2–6, Bild in 7–12 oder 1–8. Pro Seite höchstens **ein** zentriertes Element (Zitat).
- **Haarlinie** 1 px Ink 12 % als einziges Trennelement. Keine Schatten, keine Rundungen.
- **Bildformate:** 4:5 Produkt, 3:2 Raum, 16:9 und 21:9 Hero, 9:16 Reels. Andere Formate sind nicht zulässig.
- **Druck:** Satzspiegel auf einem 6-Spalten-Raster, 5-mm-Grundlinienraster, Außenrand ≥ 10 % der kurzen Seite.

### 2.5 Bildsprache („Seelicht“, aus 12 präzisiert)

- **Licht:** Tageslicht, Morgen oder ab 16 Uhr; Weißabgleich **5200–5600 K**, keine Blitzanmutung.
- **Bearbeitung (gemeinsames Preset):** Sättigung −10 bis −15, Schwarzpunkt angehoben auf ca. RGB 18–22, Lichter −20, Klarheit max. +5, Körnung 0–5 (nicht künstlich alt).
- **Motivverhältnis je Seite:** Raum (Totale) : Detail (Material/Naht/Stein) : Mensch (Hände, Rücken, Café) ≈ **3 : 2 : 1**.
- **Kunst im Bild** (E7): In jeder Raumtotale steht oder hängt ein Kunstwerk mit Credit (Künstler, Titel, Galerie), möglichst von Vernissage-Künstlern.
- **Ort sichtbar machen:** mindestens 1 von 5 Hero-Bildern mit See, Pfänder oder Dreiländer-Blick. Das kann Höttges (Dornbirn) nicht.
- **Hirsch in Bildern:** nur als Spur, also Geweih als Garderobe im Chalet-Projekt, Hirschleder-Detail (Treca, Minotti-Leder). **Keine** Hirschfotos, keine Trophäen, kein Wild.
- **Verboten:** Stockfotos, KI-Räume als Referenz (UWG, 01/14), Herstellerbilder ohne schriftliche Freigabe (14, R11), HDR, Weitwinkel unter 24 mm KB-äquivalent in Wohnräumen (verzerrt Möbelproportionen).

### 2.6 Ikonografie

- Basis: **Phosphor Icons, Gewicht „Light“** (MIT), alternativ Lucide (ISC). **Keine** gemischten Sets.
- Raster 24 × 24 px, Strich **1,25 px** (passt zur Haarlinie), Linienenden **rund** (E4, Komfort), Ecken eckig, 2 px Innenabstand.
- **12 eigene Leistungs-Icons** im selben Raster: Wohnen, Küche, Outdoor, Licht, Planung, Lieferung, Montage, Café, Termin, CHF/Dreiländer, Anzahlung abgesichert, Einlagerung. Das Geweih-Monogramm wird **nicht** als Icon missbraucht.
- Icons nie allein: immer mit Textlabel (Zielgröße ≥ 24 × 24 px, WCAG 2.5.8; Klickfläche 44 px).

### 2.7 Anwendungen

| Anwendung | Vorgabe |
|---|---|
| **Website-Header** | 72 px Desktop / 56 px mobil, Logo-Variante 1 mit **28 px Höhe** (mobil Variante 3, 20 px), als Inline-SVG mit `aria-label`, ohne Zusatzzeile |
| **Favicon/App** | Monogramm vereinfacht, Papier auf Walnuss, `icon.svg` + 180 px Apple-Touch + 512 px Manifest |
| **Social** | Avatar: Monogramm Papier auf Walnuss, Zeichen = **62 % des Kreisdurchmessers** (sicher im Kreis-Crop). Feed 1080 × 1350 (4:5), Text höchstens als Overline + 1 Bodoni-Zeile; Story-Vorlagen mit 250 px Schutzrand oben/unten |
| **Visitenkarte** | 85 × 55 mm, Naturpapier 600–700 g/m² (z. B. Gmund Cotton), Vorderseite nur Monogramm als Blindprägung oder Messingfolie auf Walnuss-farbigem Karton; Rückseite Name (Bodoni 11 pt), Funktion, Telefon, E-Mail (Instrument Sans 7,5 pt), Adresse und Öffnungszeiten inkl. **Samstag** |
| **QR-Karte (Bewertung/Lieferung)** | A6 (148 × 105 mm), Vorderseite Kunstwerk der Jahresedition (I4), Rückseite handschriftliche Zeile + QR **≥ 25 × 25 mm**, Ruhezone ≥ **4 Module** (ISO/IEC 18004), Fehlerkorrektur M, **Ink auf Papier** (kein Messing, kein Logo im Code, damit er sicher scannt), kurze sichtbare URL `platzhirsch.studio/bewerten` darunter. Text neutral formuliert, ohne Gegenleistung für Bewertungen (14, F11) |
| **Lieferwagen** | Walnuss-Lackierung oder -Folie; Seite: nur Wortmarke (Variante 3), **Versalhöhe 80–100 mm**, Messing- oder Papierfolie; Heck: Monogramm + URL + Telefon. **Keine** Möbelbilder und keine Markennamen der Hersteller. Zusätzlich ein **neutrales Fahrzeug/Magnetschild-Option** für Kunden, die diskrete Lieferung wünschen (Zweitwohnsitz Arlberg, Villen) |
| **Showroom-Fassade** | Wortmarke als Einzelbuchstaben aus gebürstetem Messing, hinterleuchtet (3000 K). Faustregel Lesbarkeit: ca. **2,5 cm Versalhöhe je 9 m Leseabstand** (USSC-Legibility-Index, Größenordnung; vor Ort mit Mock-up prüfen) → von der Landstraße (ca. 25–30 m) **≥ 10 cm**, empfohlen 25–30 cm wegen Fahrgeschwindigkeit [Leseabstand vor Ort zu messen] |
| **Showroom innen** | Produktschilder 100 × 60 mm, Messing graviert oder Papier auf Stone-Halter: Marke (Overline), Modell (Bodoni 18 pt), Designer, Maße (tabular), **Preis oder Preisrahmen** (PAngV/PrAG konform, 14, F4), QR zur Produktseite (≥ 15 mm). Café: Tassen und Untersetzer mit Monogramm, keine Werbetexte |
| **E-Mail/Newsletter** | Logo als PNG @2x mit Alt-Text, Systemschrift-Fallback (Georgia/Arial), da Webfonts in Outlook fehlen |

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

**I1 – „Abwurfstangen“: Das Logo wächst jedes Jahr nach.**
Ein Hirsch wirft sein Geweih jedes Jahr ab (Februar/März) und schiebt ein neues. Das ist eine Metapher für die neue Kollektion nach dem Salone del Mobile im April. Das Monogramm bleibt in der Form konstant, erscheint aber jedes Jahr in einer **Jahresedition**: andere Materialumsetzung (Messing gebürstet, Nussholz-Intarsie, Steinrelief aus der Binni-Manufaktur, Keramik eines Wälder Töpfers). Das ergibt Plakat, Postkarte und Journal-Beitrag „Das Geweih 2027“. Kein Wettbewerber hat eine Bildmarke mit eingebauter Geschichte.

**I2 – Markenwand als Typografie statt Logowand.**
Statt fremder Logos (rechtlich heikel, 14, F2) zeigt die Website eine **typografische Liste** in Bodoni: Name, Herkunftsort (Meda, Brianza; Cabiate; Giussano), Gründungsjahr. Das wirkt wie ein Ausstellungskatalog. Höttges und reiter zeigen Logoreihen, Platzhirsch zeigt Kultur.

**I3 – Dreiländer-Koordinate als Signatur.**
`47°31′ N · 9°45′ E` [vor Verwendung exakt auf die Adresse prüfen] als feine Overline in Footer, auf Visitenkarte, Lieferkarte und Fassade. Dazu eine **Dreiländer-Linienkarte** im Ink-/See-Ton (AT, DE, CH, FL als Haarlinien um den See, Lochau als Punkt). Das macht Alleinstellung 2 und 5 (23, 4.2) ohne Text sichtbar.

**I4 – Künstleredition der Liefer- und QR-Karte.**
Jedes Jahr gestaltet ein Künstler der Vernissagen die Vorderseite der A6-Lieferkarte (nummeriert, Auflage 500). Art Infusion (E7) wirkt direkt beim Kunden zuhause, im Moment der höchsten Zufriedenheit.

**I5 – Material-Typografie.**
Hero-Titel nicht nur am Bildschirm: Für Kampagnen werden Wörter real gefertigt und fotografiert, etwa „Stein“ als Gravur in einer Binni-Küchenplatte oder „Wohnen“ als Prägung in Minotti-Leder (nur mit Freigabe). Echte Fotos statt Effekte, was ruhig, haptisch und nicht kopierbar ist.

**I6 – Ein eigenes Produktschild-System als Druck- und Web-Baustein.**
Das Messingschild im Showroom und die Produktkarte online folgen **demselben Layout** (Overline Marke, Bodoni Modell, Maße, Preisrahmen). Wer online gesucht hat, erkennt das Stück im Laden wieder. Kein Wettbewerber verbindet Laden und Website so.

**I7 – Diskretion als Service.**
„Auf Wunsch liefern wir neutral.“ Neutrales Fahrzeug, neutrale Verpackung. Für vermögende Kunden und Zweitwohnsitze ist das ein echter Wert, und als Gestaltungsentscheidung ist es ungewöhnlich ehrlich.

---

## 4. Was man auf keinen Fall tun darf

1. **Kein naturalistischer Hirschkopf**, keine Trophäe, kein Hirsch mit Kreuz oder Symbol zwischen den Stangen (Jägermeister-Nähe, E8), kein Fell, keine Augen, kein Röhren, keine Jagdmotive, kein Alpen-Folklore-Ornament (Edelweiß, Karomuster).
2. **Kein Gold als Text oder Fläche auf Hell** (1,94 : 1), keine Goldverläufe, Glanz- oder Metall-Effekte am Bildschirm, keine Goldbalken unter Titeln (01).
3. **Keine Herstellerlogos als Siegel**, keine Formulierungen „offizieller/autorisierter Händler“ (Ausnahme ClassiCon, belegt) – auch nicht auf Fahrzeug, Schild oder Visitenkarte.
4. **Keine Wortmarke als Live-Text.** Der Galerie-Prototyp setzt PLATZHIRSCH als SVG-`<text>` mit `textLength="230"` und `lengthAdjust="spacing"`. Dadurch hängt das Logo vom Laden der Webschrift ab: Beim Fallback auf Georgia ändern sich Form und Abstände, und der Screenreader liest „P L A T Z…“ je nach Umsetzung unterschiedlich. Logos immer als **Pfade** reinzeichnen.
5. **Keine Haarlinien unter 1,5 px im Logo**, wenn das Logo unter 40 px Höhe dargestellt wird. Haarlinien unter 1 Gerätepixel verschwinden (Galerie-Prototyp: Strich 1–1,25 px bei 48er-viewBox).
6. **Keine dritte Schriftfamilie**, kein Montserrat in Versalien als Fließtext, kein Bodoni unter 32 px.
7. **Keine Stockfotos und keine KI-generierten Räume als Referenz**, keine Herstellerbilder ohne schriftliche Freigabe.
8. **Keine Dark Patterns in der Gestaltung:** keine roten „Nur noch 1“-Badges, keine Countdown-Banner, keine optisch versteckte Ablehnen-Schaltfläche im Cookie-Banner (gleichwertige Gestaltung von „Akzeptieren“ und „Ablehnen“), kein Confirmshaming-Text („Nein, ich will kein schönes Zuhause“). Neben der Rechtslage (DSA Art. 25, UGP-Richtlinie/UWG) beschädigt das jede Luxusmarke.
9. **Kein Logo-Wechsel ohne Übergang.** Alte Elemente (Schild, Fahrzeug, Google-Profil, Instagram-Avatar) werden in einem Zug innerhalb von 4 Wochen getauscht, damit keine zwei Logos lange parallel laufen.
10. **Keine Reinzeichnung, Anmeldung oder Druckfreigabe ohne Markenrecherche** durch einen Anwalt (E8).

---

## 5. Prüf-Checkliste für die drei Prototypen (galerie, buehne, dreilaendereck)

**Skala je Kriterium:** 0 = fehlt/verstößt · 1 = schwach · 2 = solide · 3 = vorbildlich. **Gewicht** in Klammern. Höchstwert = 3 × Summe der Gewichte = **3 × 30 = 90 Punkte**.

| # | Kriterium | Messung | Gewicht |
|---|---|---|---|
| B1 | **Hirsch erkennbar, aber modern** | 5-Sek.-Test: ≥ 60 % nennen Hirsch/Geweih ungestützt; „modern“ ≥ 5,5/7 | 3 |
| B2 | **Logo technisch sauber** | SVG als Pfade, `currentColor`, `aria-label`; lesbar bei 16 px (Monogramm) und 20 px (Wortmarke); keine Haarlinie < 1,5 px bei kleinen Größen | 2 |
| B3 | **Kontinuität zum Bestand** | Versalien-Wortmarke, Hirsch und Messing/Gold-Bezug erhalten (E2) | 2 |
| B4 | **Zwei Schriften, klare Rollen** | Max. 2 Familien, Serife nur ≥ 32 px, Text 17–18 px / 1,6 / ≤ 68 Zeichen, Versalien nur in Overlines | 2 |
| B5 | **Kontrast** | Alle Texte ≥ 4,5 : 1 (groß ≥ 3 : 1), Fokus ≥ 3 : 1; kein Gold-Text auf Hell | 3 |
| B6 | **Farbmenge** | ≤ 1 dunkle Fläche pro Seite, Messing ≤ 2 % der Fläche (Screenshot-Pixelzählung) | 1 |
| B7 | **Raster und Weißraum** | 12 Spalten, Ränder 24/48/80, Sektionsabstand ≥ 160 px Desktop, Asymmetrie, keine Schatten/Rundungen | 2 |
| B8 | **Bildsprache** | Nur die 4 Formate; einheitliches Grading; Ort (See/Pfänder) sichtbar; keine Stock-/KI-Räume; Herkunft jedes Bildes dokumentiert | 3 |
| B9 | **Kunst und Kultur im Bild** | Mindestens 1 Kunstwerk mit Credit je Hauptseite (E7) | 1 |
| B10 | **Ikonografie** | Ein Set, 24 px, 1,25 px Strich, immer mit Label | 1 |
| B11 | **Marken rechtssicher gezeigt** | Keine Herstellerlogos als Siegel, keine Händler-Formeln | 3 |
| B12 | **Keine Dark Patterns** | Kein Fake-Mangel, Countdown, Confirmshaming; Cookie-Ablehnen gleichwertig | 3 |
| B13 | **Übertragbarkeit auf Print/Raum** | Prototyp-Elemente (Logo, Schrift, Farbe) funktionieren auf Visitenkarte, QR-Karte, Fahrzeug, Schild – bei Mock-up geprüft | 2 |
| B14 | **Eigenständigkeit** | Neben Höttges, reiter, Fretz, Gamma: Logo und Seite ohne Namen eindeutig zuordenbar (Blindtest mit 10 Personen, ≥ 8 korrekt) | 2 |
| | **Summe der Gewichte** | | **30** |

**Bewertung:** ≥ 72 Punkte (80 %) = umsetzungsreif · 54–71 = überarbeiten · < 54 = verwerfen.
**K.-o.-Kriterien** (unabhängig von Punkten): B5 = 0, B11 = 0 oder B12 = 0 → Prototyp nicht freigeben.

**Vorbefund Galerie-Prototyp (nur Code von `Logo.js` und `fonts.js` gelesen, Seite noch nicht gerendert):** B2 schwach (Wortmarke als `<text>` mit `textLength`, Haarlinien 1–1,25 px), B3 solide (Versalien, Geweih), B4 offen (Cormorant ≥ 28 px vorgesehen statt ≥ 32 px). Die übrigen Kriterien sind erst nach dem Rendern bewertbar.

---

## Quellen

- Henderson, P. W. & Cote, J. A. (1998): Guidelines for Selecting or Modifying Logos. *Journal of Marketing* 62(2). [Kurzfassung (PDF)](https://newion.uwinnipeg.ca/~ssingh5/Lm/logo-guide.pdf) · Validierung: [Olavarrieta & Friedmann, Universidad de Chile](https://repositorio.uchile.cl/handle/2250/140229)
- Luffarelli, J., Mukesh, M. & Mahmood, A. (2019): Let the Logo Do the Talking. *Journal of Marketing Research* 56(5), 862–878. [Westminster Research](https://westminsterresearch.westminster.ac.uk/item/qqv8q/let-the-logo-do-the-talking-the-influence-of-logo-descriptiveness-on-brand-equity)
- Jiang, Y., Gorn, G. J., Galli, M. & Chattopadhyay, A. (2016): Does Your Company Have the Right Logo? *Journal of Consumer Research* 42(5), 709–726. [PolyU-Repositorium](https://ira.lib.polyu.edu.hk/handle/10397/64985) · [APS-Zusammenfassung](https://www.psychologicalscience.org/news/minds-business/the-shape-of-a-logo-has-a-powerful-impact-on-consumers120911.html)
- Hagtvedt, H. & Patrick, V. M. (2008): Art Infusion. *Journal of Marketing Research* 45(3). [SSRN](https://papers.ssrn.com/abstract=2086795) · [UGA News](https://news.uga.edu/art-infusion-effect/)
- Romaniuk, J.: Building Distinctive Brand Assets (Ehrenberg-Bass). [marketingscience.info](https://marketingscience.info/brands-need-distinctive-assets/) · [Marketing Week](https://www.marketingweek.com/marketers-judgement-strength-brand-assets-rarely-accurate/)
- Serifen und Luxuswahrnehmung: [Marketing Trends Congress 2024 (PDF)](https://archives.marketing-trends-congress.com/2024/pages/PDF/133.pdf) · [Journal of Business and Retail Management Research 2022 (RePEc)](https://ideas.repec.org/a/jfr/jbar11/v11y2022i2p9.html)
- Schriften: [Bodoni Moda – Google Fonts](https://fonts.google.com/specimen/Bodoni+Moda/about) · [Instrument Sans – Google Fonts](https://fonts.google.com/specimen/Instrument%2BSans/about) (beide SIL OFL 1.1)
- QR-Code: ISO/IEC 18004:2015 (Ruhezone 4 Module). Beschilderung: United States Sign Council, Legibility Index (Faustwert, vor Ort prüfen).
- Intern: `Marktresearch/digital/01, 02, 12, 13, 14`, `Marktresearch/23-masterkonzept.md` Abschnitt 4.
