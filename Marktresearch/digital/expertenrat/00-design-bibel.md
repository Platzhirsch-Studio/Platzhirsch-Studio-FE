# 00 – Design-Bibel Platzhirsch Home Living

**Rolle:** Kreativdirektor des Neuauftritts · **Stand:** 26.10.2026 · **Status:** verbindlich für Gestaltung, Bau und Abnahme. Änderungen nur per Entscheidungsprotokoll (Abschnitt 16).

**Grundlage:** Expertenrat 01–19 (`digital/expertenrat/`), `digital/01` (Designsystem 2.0), `digital/02` (Motion), `digital/12`, `13`, `14`, `23-masterkonzept.md` Abschnitt 4. Die Quellen und Studien stehen in den Einzelberichten. Hier steht die Kurzform als Verweis `[EB nn]` auf den Expertenbericht. Gesichtet habe ich auch die drei Prototypen `src/app/[locale]/preview/{galerie,buehne,dreilaendereck}`. Alle drei liefern HTTP 200, gelesen habe ich nur den Code. Kontraste sind mit der WCAG-2.x-Formel nachgerechnet (Node, 26.10.2026), die OKLCH-Werte stammen aus der OKLab-Umrechnung.

**Wie man diese Bibel liest:** „Muss“ ist Abnahmekriterium. „Soll“ ist Standard, Abweichungen werden begründet. „Kann“ ist eine Option. Bei Widerspruch zwischen dieser Datei und einem Einzelbericht gilt diese Datei.

---

## 1. Markenkern und Leitidee

1. **Platzhirsch ist das Haus für italienisches Wohnen am Bodensee: Küche, Wohnen und Outdoor als ein Projekt, zum Festpreis in Euro oder Franken für vier Länder, mit abgesicherter Anzahlung.** [23, 4.1] *(GP: Der Teil „abgesicherte Anzahlung“ ist intern Ziel, öffentlich erst nach unterschriebenem Vertrag mit Bank oder Versicherer, siehe §11. Bis dahin endet der Satz nach „vier Länder“. „Italienisch“ beschreibt die Haltung, nicht jedes Produkt: Herkunft steht pro Produkt, siehe §14.)*
2. **Wir sind Gastgeber, nicht Händler.** Bei uns sitzen Sie im Café, nicht im Lager. Wir zeigen Status über Ort, Material, Projekte und Menschen, nicht über Logos, Gold oder Superlative (leiser Luxus, Han/Nunes/Drèze 2010) [EB 01, 06].
3. **Leitsatz für 3 Jahre: „Nehmen Sie Platz.“** Er deutet den lauten Namen als Einladung (Platz am Café-Tisch, Platz auf dem Sofa zur Sitzprobe, Platz an der Tafel) und steht für einen Ort, den nur Lochau hat: Licht vom See, drei Länder in Sichtweite [EB 18].

**Stimme:** Sie-Form, kurze Sätze, Fakten statt Adjektive, kein Ausrufezeichen. Wörter wie „Luxus“, „exklusiv“, „Traum“, „größte“ und „beste“ kommen nicht vor. Marken werden „gezeigt“ oder „geplant“, nie „offiziell vertreten“. Die einzige Ausnahme ist ClassiCon, dort ist der Status belegt [01, EB 01, 14].

---

## 2. Designprinzipien (8)

| # | Prinzip | Messbar als |
|---|---|---|
| P1 | **Gastgeber vor Katalog.** Zuerst kommen Haus, Café, Menschen und Projekte, die Marken sind der Beweis | Startseite: in den ersten 2 Viewports kein Markenlogo, mindestens 1 Gesicht und 1 Ortsbild |
| P2 | **Ein Gedanke pro Bildschirm.** Jeder Viewport hat 1 Bild, 1 Titel, höchstens 2 Sätze und 1 Handlung | Im ersten Viewport höchstens 3 visuelle Einheiten und 1 gefüllter Knopf [EB 04]. Der Header-Knopf „Termin“ ist dafür `secondary` (1 px Ink-Rahmen, gefüllt erst bei Hover/Fokus); die mobile CTA-Leiste erscheint erst, wenn der Inhalts-CTA aus dem Viewport ist (GP) |
| P3 | **Material statt Dekor.** Struktur entsteht durch Raster, Haarlinien, Papiertöne und Typografie | 0 Schatten außer auf schwebenden Ebenen, 0 Radien, Messing höchstens 2 % der Fläche |
| P4 | **Vertrautes Gerüst, eigene Inszenierung.** Logo, Menü und Termin stehen dort, wo man sie erwartet. Eigen sind Bildschnitt, Typo und Rhythmus (Hekkert 2003) [EB 04] | Logo oben links, Termin oben rechts, Navigation horizontal |
| P5 | **Konkret statt Behauptung.** Maße, Preisrahmen, Lieferzeit, Ansprechperson und Öffnungszeit stehen sichtbar auf der Seite | Jede Produktseite enthält Maßzeichnung, Preis oder Preisrahmen, Lieferspanne und eine Person [EB 17] |
| P6 | **Anfassen vorstellbar machen.** Makro im Streiflicht, Hand und Mensch fürs Maß, Muster nach Hause (Peck & Shu 2009) [EB 04, 19] | Pro Top-Produkt mindestens 3 Materialnahaufnahmen und 1 Maßstab-Bild |
| P7 | **Ruhe in Bewegung.** Rückmeldung kommt schnell, Atmosphäre langsam, und pro Moment gibt es genau eine Hauptbewegung [EB 11] | Rückmeldung ≤ 100 ms, Auftakt steht nach ≤ 1100 ms still |
| P8 | **Fair überzeugen.** Kein Druck, keine Tricks, alles ehrlich und rückgängig machbar (DSA Art. 25, UGP-RL Anh. I) [EB 02, 03, 14] | 0 Dark Patterns im Audit (K.-o.) |

---

## 3. Logo und Wortmarke

**Entscheidung: Konzept „Stangen“ [EB 06] ist die Primärrichtung, „Der Platz“ (Prototyp galerie) ist die Testalternative.**

- **Monogramm:** P und H teilen sich die Stämme. Diese wachsen nach oben als zwei Geweihstangen weiter, jede mit genau zwei Enden, die Enden gerundet. Es ist ein beschreibendes und stilisiertes Zeichen, und solche Zeichen wirken bei wenig bekannten Marken besser als abstrakte (Henderson & Cote 1998, Luffarelli et al. 2019) [EB 06]. Raster 12 × 15 Einheiten, Sprossen in 30° und 60°, Seitenverhältnis 1 : 1,25. Schutzraum entspricht der Höhe des P-Bauchs. Mindestgröße 16 px digital (Favicon-Fassung ohne Augsprosse) und 6 mm im Druck.
- **Wortmarke:** PLATZHIRSCH in Versalien, **gezeichnet als SVG-Pfad** und nicht als `<text>`. Basis ist Bodoni Moda 500 bei opsz 96, Sperrung etwa +180/1000 em, die Haarstriche verstärkt für Größen ab 20 px. Optional kommt eine TZ-Ligatur als schützbares Detail dazu.
- **Zusatzzeile:** HOME LIVING · LOCHAU AM BODENSEE, in Instrument Sans 500 und Versalien, mit +140/1000 em Sperrung, auf 28 % der Versalhöhe. Sie entfällt, wenn das Logo schmaler als 160 px ist.
- **Varianten:** horizontal (Header), gestapelt (Social, Schild), nur Wortmarke (mobil < 360 px, Fahrzeug), nur Monogramm (Favicon, Prägung, Etikett). Alle als `currentColor` mit `aria-label="Platzhirsch Home Living"`.
- **Farben:** Ink auf Paper, Paper auf Walnut, Messing nur als echte Folie oder Gravur auf Walnut oder Naturkarton. Am Bildschirm gibt es keine Verläufe, keinen Glanz und keinen Schatten.
- **Header-Maß:** Logo 28 px hoch auf dem Desktop, 20 px mobil (nur die Wortmarke).
- **Muss vor der Reinzeichnung:** eine Markenrecherche in EUIPO, DPMA, ÖPA und Swissreg, Klassen 20, 35, 37, 42 und 43, dazu eine Prüfung des Abstands zum Jägermeister-Hirsch. Das Wort „Platzhirsch“ allein ist kennzeichnungsschwach [EB 06].
- **Entscheidungstest:** Fünf-Sekunden-Test mit n ≥ 30, Stangen gegen Der Platz. Bestanden ist ein Entwurf, wenn mindestens 60 % ungestützt Hirsch oder Geweih nennen und der Wert für „modern“ bei mindestens 5,5 von 7 liegt [EB 06].
- **Verboten:** naturalistischer Hirschkopf, Trophäe, Symbol zwischen den Stangen, Edelweiß und Karomuster, Haarlinien unter 1,5 px bei Logogrößen unter 40 px.

---

## 4. Farbsystem

**Mengenregel je Bildschirm:** mindestens 85 % Neutraltöne. Höchstens 1 dunkle Fläche pro Seite (Walnut oder Ink-deep), höchstens 2 % Messing und höchstens 5 % Saisonfarbe, diese nur in Kampagnenmodulen. Gesättigte Farbe kommt aus den Produkten und nicht aus der Oberfläche (Hagtvedt & Brasel 2017) [EB 05].

### 4.1 Rohwerte (Ebene 1)

| Token | HEX | OKLCH | Kontrast auf Paper / Stone |
|---|---|---|---|
| `paper` | `#faf8f4` | `oklch(98.0% 0.006 84.6)` | – |
| `bone` | `#f7f5f1` | `oklch(97.1% 0.006 84.6)` | – |
| `stone` | `#ece8e1` | `oklch(93.2% 0.010 81.8)` | – |
| `linen` | `#e6e1d8` | `oklch(91.1% 0.013 82.4)` | nur für Platzhalter und Skeleton |
| `stone-deep` | `#d8d2c8` | `oklch(86.6% 0.015 80.7)` | 8,30:1 als Text auf Walnut |
| `pebble` | `#8a8174` | `oklch(60.7% 0.022 77.2)` | 3,62 / 3,14 (Steuerelement-Rand ≥ 3:1) |
| `ink-soft` | `#5c636a` | `oklch(49.6% 0.014 248.1)` | 5,74 / 4,99 |
| `ink` | `#30373e` | `oklch(33.3% 0.016 248.3)` | 11,37 / 9,87 |
| `ink-deep` | `#1f252b` | `oklch(26.1% 0.014 248.4)` | 14,58 / 12,67 |
| `walnut` | `#3f3129` | `oklch(32.6% 0.025 51.3)` | Paper darauf 11,77 |
| `see` | `#4f6b68` | `oklch(50.5% 0.033 188.0)` | 5,45 / 4,73 |
| `brass-400` (Signatur) | `#d1b250` | `oklch(77.2% 0.122 91.7)` | **1,94 auf Paper, nie auf Hell.** Auf Walnut 6,06, auf Ink 5,85 |
| `brass-500` | `#9a7a2a` | `oklch(59.5% 0.104 86.4)` | 3,81 / 3,31, nur für Linien und Icons mit Funktion |
| `brass-700` | `#7a5f17` | `oklch(50.0% 0.093 86.8)` | 5,69 / 4,95, Akzenttext auf Hell |
| `error` | `#9b2c2c` | `oklch(46.5% 0.147 24.9)` | 7,10 / 6,16 |
| `success` | `#2f6b4a` | `oklch(47.8% 0.083 157.1)` | 5,96 / 5,18 |
| `notice` | `#8a5a00` | `oklch(50.8% 0.108 73.3)` | 5,59 / 4,85 |

Das sind 17 Tokens. Mit `linen` als reinem Bild-Platzhalter liegt die Ebene 1 innerhalb der Obergrenze von 16 plus 1 aus [EB 07].

### 4.2 Rollen (Ebene 2, nur diese Namen sind in Komponenten erlaubt)

| Rolle | Wert | Regel |
|---|---|---|
| `surface` | paper | Seitengrund, ersetzt `#ffffff` |
| `surface-raised` | bone | Produktkachel, Karten |
| `surface-band` | stone | ruhige Bänder |
| `surface-inverse` | walnut | **höchstens 1× pro Seite** (Haus und Café oder Footer). Geprüft per Playwright-Test über alle Seitentypen (`[data-surface="inverse"]` zählen), denn ein Lint sieht nur einzelne Dateien, nicht die fertige Seite (GP) |
| `text` | ink | Fließtext und Titel |
| `text-soft` | ink-soft | Meta, Designer, Breadcrumb |
| `text-accent` | brass-700 | Overline-Akzent, aktiver Link |
| `text-inverse` / `-soft` | paper / stone-deep | auf Walnut |
| `accent-on-dark` | brass-400 | Linie, Zähler und Fokus auf Dunkel |
| `line` / `line-strong` | ink 12 % / 24 % Alpha | Haarlinien, dekorativ |
| `line-control` | pebble | Feldränder, Checkboxen |
| `action` / `action-hover` | ink / ink-deep | Primärknopf mit Text in paper (11,37:1) |
| `focus` | ink auf Hell, brass-400 auf Dunkel | 2 px Ring plus 2 px Abstand plus 4 px Paper-Halo |

**Gold auf Hell ist gelöst:** Es gibt keinen Goldknopf mit weißer Schrift mehr (2,06:1), alle `text-[#d1b250]` auf Hell werden zu `brass-700`. Messing hat genau drei dekorative Orte: die 1-px-Linie über der Walnut-Fläche, den Unterstrich des aktiven Menüpunkts in `brass-500` und das Logo auf Dunkel [EB 05]. Dazu kommen nur funktionale Einsätze: `brass-400` als Fokusring und Zähler auf Dunkel, `brass-700` als `text-accent` (Overline, aktiver Link) auf Hell. Alle zählen in die 2-%-Grenze (GP).

### 4.3 Saisonfarben (nur Kampagnenmodule, ≤ 5 %)

Frühling Pfänder-Moos `#4f6b68`, Sommer Seeblau `#5b7f8c` (4,07:1, nur für Schrift ab 24 px), Herbst Torkel-Rost `#8c4f2e` (6,05:1), Winter Tanne `#2f4a3f` (9,11:1). Der Wechsel läuft über `--season`, abhängig vom Datum in der Zeitzone Europe/Vienna [EB 05].

### 4.4 Dark Mode

**Entscheidung: Zum Start gibt es keinen systemgesteuerten Dark Mode** (`color-scheme: light`). Der „dunkle Raum“ einer Seite ist die eine Walnut-Fläche. Die Tokens für den Abendmodus aus [EB 05] (Grund `#161513`, Text `#ece8e1`, 14,94:1) werden angelegt, aber erst ausgeliefert, wenn sie vollständig sind, inklusive Linen-Karten für Produkte (siehe Abschnitt 16, W4).

### 4.5 Kontrast-Pflicht

Text muss mindestens 4,5:1 erreichen (ab 24 px oder 18,7 px fett mindestens 3:1), Bedienelemente und Fokus mindestens 3:1. Farbe ist nie das einzige Merkmal. Statusmeldungen haben immer Icon und Text (SC 1.4.1). Text auf Bildern steht auf einem Verlauf `ink-deep` 0 → 55 % hinter dem Textblock. Die Messung erfolgt am hellsten Pixel unter der Schrift.

---

## 5. Typografie-System

| Rolle | Schrift | Lizenz | Regel |
|---|---|---|---|
| Display | **Bodoni Moda** (variabel, `opsz`, Gewicht 400–500) | SIL OFL 1.1 | **Nur ab 32 px.** `font-optical-sizing: auto`. Kursiv nur für Leitsatz und Zitate |
| Text und UI | **Instrument Sans** (variabel, Gewicht und Breite) | SIL OFL 1.1 | Alles unter 32 px. Ziffern als `tabular-nums` für Maße, Preise und Zeiten |
| Wortmarke | gezeichnet auf Basis Bodoni | eigene Reinzeichnung, die OFL erlaubt das | – |

Beide Schriften werden über `next/font` selbst gehostet, Abrufe bei Google gibt es nicht (LG München I, 3 O 17493/20). **Vorgeladen wird nur das Subset `latin`** (`subsets: ["latin"]`): ç und ë (Binni, Kosovo-Namen) liegen in U+00C0–00FF und sind darin enthalten. latin-ext bleibt per `unicode-range` verfügbar, wird aber nicht vorgeladen. Heute lädt `src/app/[locale]/layout.js` Bodoni mit latin + latin-ext vor (46 + 25 KB) und zusätzlich Montserrat (68 + 36 KB), also 4 Dateien und rund 175 KB (gemessen in `.next/static/media`, 26.10.2026). Höchstens 2 woff2-Dateien werden vorgeladen, zusammen ≤ 90 KB: Bodoni latin mit `opsz` 46 KB plus Instrument Sans latin ohne `wdth`-Achse. Die `wdth`-Achse kommt nur dazu, wenn sie wirklich genutzt wird und das Budget hält. Bodoni Kursiv wird nicht vorgeladen (GP). Es gibt maximal 2 Familien, eine dritte ist ausgeschlossen.

**Skala** (fluid zwischen 360 und 1440 px, `rem` plus `vw`, Maximum höchstens das 2,5-Fache des Minimums, damit 200 % Zoom funktioniert [EB 13]):

| Token | Wert | px | Zeilenhöhe | Laufweite | Schrift |
|---|---|---|---|---|---|
| `display-xl` | `clamp(3rem, 2rem + 4.44vw, 6rem)` | 48–96 | 1,02 | −0,01 em | Bodoni 400, nur Hero, 1× pro Seite |
| `display-l` | `clamp(2.5rem, 2rem + 2.22vw, 4rem)` | 40–64 | 1,05 | −0,005 em | Bodoni 400, H1 Unterseiten |
| `display-m` | `clamp(2rem, 1.75rem + 1.11vw, 2.75rem)` | 32–44 | 1,1 | 0 | Bodoni 500, H2 |
| `title` | `clamp(1.375rem, 1.29rem + 0.37vw, 1.625rem)` | 22–26 | 1,25 | 0 | Instrument 500, H3 |
| `lead` | `clamp(1.25rem, 1.21rem + 0.19vw, 1.375rem)` | 20–22 | 1,5 | 0 | Instrument 400 |
| `body` | `1.125rem` | **18** | 1,6 | 0 | Instrument 400, Zeilen höchstens 68 Zeichen (`--measure: 68ch`) |
| `ui` | `1rem` | 16 | 1,4 | 0,005 em | Instrument 500, Knöpfe, Navigation, Felder (≥ 16 px wegen iOS-Zoom) |
| `small` | `0.875rem` | 14 | 1,45 | 0,01 em | Meta, Fehlertext |
| `overline` | `0.75rem` | 12 | 1,3 | **0,14 em**, Versalien | Instrument 500. **Nur hier Versalien** |

Titel bekommen `text-wrap: balance`, Fließtext `text-wrap: pretty`. Dazu `hyphens: auto` mit `lang` je Locale. Zeilenmasken bei Animationen werden im Markup gesetzt (`<span class="line">`), Wörter und Buchstaben werden nie zerlegt.

---

## 6. Raster, Abstände, Radien, Ebenen

| Token | Mobil (< 768) | Tablet | Desktop (≥ 1280) |
|---|---|---|---|
| Spalten | 4 | 8 | 12 |
| `--space-gutter` (Seitenrand) | **20 px** | 48 px | 80 px |
| `--space-grid-gap` | 16 px | 24 px | 32 px |
| `--space-stack-s` (Overline zu Titel) | 8 px | 8 px | 12 px |
| `--space-stack-m` (Titel, Text, Handlung) | 24 px | 32 px | 40 px |
| `--space-section` | 96 px | 128 px | 176 px |
| `--container` / `--container-text` | 100 % | 100 % | 1440 px / 720 px |

- **8-px-Basis.** Tailwind `--spacing: 0.25rem` bleibt.
- **Asymmetrie ist Standard:** Text in den Spalten 2–6, Bild in 7–12 (oder umgekehrt). Zentriert wird pro Seite nur ein Element (Leitsatz oder Zitat).
- **Horizontlinie** (Signatur): 1 px Ink mit 24 % Alpha über die volle Containerbreite, gesetzt auf 38 % der Abschnittshöhe [EB 18]. Höchstens 1 pro Seite, sonst trennen Haarlinien mit 12 %.
- **Radien:** überall `0`. `--radius-pill` gibt es nur für den Auswahl-Zähler und Avatare.
- **Schatten:** genau einer, `--shadow-overlay: 0 24px 48px -12px rgb(31 37 43 / .18)`, nur für Mega-Menü, Modal, Sheet und Toast. Tailwind-Standardradien und -schatten werden per `initial` abgeschaltet [EB 07].
- **Z-Skala:** base 0, sticky 20, header 40, cta-bar 45, menu 50, overlay 60, toast 70.
- **Header:** 72 px auf dem Desktop (fest, wird nicht ausgeblendet), 56 px mobil. `scroll-padding-top: 88px; scroll-padding-bottom: 80px` [EB 14].
- **Trefferflächen:** mindestens 44 × 44 px für alle Bedienelemente, Abstand mindestens 8 px. Einzige Ausnahme sind Links im Fließtext, dort gilt WCAG 2.5.8 (≥ 24 px oder ausreichender Abstand) (GP, gleichlautend mit §14). Knöpfe sind 48 px hoch mobil und 52 px auf dem Desktop.
- **Bildformate (nur diese):** 21:9 Hero Desktop, 4:5 Hero mobil und Produkt, 3:2 Raum, 1:1 Material und Person, 9:16 Social. Jedes Medium bekommt eine `aspect-ratio`, damit CLS bei höchstens 0,05 bleibt.
- **Galerien:** höchstens 3 Spalten. Nach jeweils 6–9 Produkten folgt ein Raum- oder Materialbild über die volle Breite [EB 04]. Mindestens 40 % der Fläche bleiben frei.

---

## 7. Bildsprache „Seelicht“ und Shotliste

**Regeln:**
1. **Eigene Bilder an allen Schlüsselstellen.** Hero, Haus, Café, Team, Projekte und Regionsseiten zeigen nur eigene Fotos. Herstellerbilder werden nur mit schriftlicher Freigabe genutzt, unverändert (kein Zuschnitt gegen die Bedingungen, kein Ken-Burns), in getrennten Modulen und mit Credit [EB 19]. **Ohne Eintrag im Bildregister wird kein Bild verwendet.** Das Register hat die Spalten Datei, Quelle, Urheber, Lizenzumfang, Bearbeitung j/n, KI-Stufe und Einwilligung.
2. **Licht:** Tageslicht vom See. Der Hero-Kandidat Nr. 1 ist das Dämmerungsbild 15–35 min nach Sonnenuntergang, mit Flos-Leuchten auf 2.700 K. Kein HDR-Tonemapping, nicht weitwinkliger als 24 mm KB, Belichtungsreihe mit manuellem Blending.
3. **Look:** ein gemeinsames Preset. Weißabgleich zuerst neutral, danach höchstens +300 K wärmer, Sättigung −5 bis −15, Schwarzpunkt weich, Lichter ≤ 96 % L. **Materialbilder bleiben farbneutral**, mit ΔE2000 ≤ 3 gegenüber dem Muster (Leder und Stoff ≤ 2), Export als sRGB mit Profil [EB 05].
4. **Motivverhältnis pro Seite:** Raum zu Detail zu Mensch ungefähr 3 : 2 : 1. In jeder Raumtotale steht ein Kunstwerk mit Credit (Art Infusion, Hagtvedt & Patrick 2008) [EB 06]. Mindestens 1 von 5 Hero-Bildern zeigt See, Pfänder oder Dreiländerblick.
5. **Maßstab:** Zu jedem Ausstellungsstück gibt es ein Bild mit Mensch, denn laut Baymard schätzen 42 % die Größe aus den Bildern [EB 19].
6. **Gesichter:** Teamporträts mit direktem Blick auf Startseite, Termin- und Bestätigungsseite. In Szenen blickt die Person zum Produkt [EB 04].
7. **KI:** erlaubt sind Retusche und Outpainting mit IPTC-Kennzeichnung und Hinweis. Visualisierungen tragen ein sichtbares Etikett. **Generierte Räume, Menschen und Seeblicke sind verboten** (AI Act Art. 50, UWG). Stockfotos sind verboten, `images.unsplash.com` fliegt aus `next.config`.
8. **Gewichte:** LCP-Bild mobil ≤ 120 KB AVIF (828 w), Desktop ≤ 180 KB (1920 w). Für mobil gibt es ein eigenes 4:5-Foto per `<picture>` als Art Direction, keinen Ausschnitt.

**Shotliste, Kurzfassung (erstes Paket, 5 Tage) [EB 19]:**

| Tag | Inhalt | Pflichtmotive |
|---|---|---|
| 1 Haus | Showroom-Totale in 4 Tageslichtern aus fester Stativposition (Seelicht S01/S02), 6 Vignetten (Minotti, Poliform, Rimadesio, Flos, ClassiCon, Küche), Fassade, Durchblick Café → Showroom, 4 Maßstab-Bilder | 21:9 + 4:5 je Lichtstimmung |
| 2 Café und Menschen | Gastgeberin am Tresen mit Blick in die Kamera, Planung mit Mustern, Hände mit Tasse auf Steinplatte, Teamporträts auf Stone `#ece8e1` | 4:5, 3:2, 1:1 |
| 3 Material | 12 Materialien mit Hand im Streiflicht (Bouclé, Leder mit Naht, Samt, Leinen, Nussbaum, Eiche geräuchert, Binni-Marmor, Keramik, Messing, Rimadesio-Glas, Aluprofil, Outdoor-Gewebe), 6 Mechanik-Clips zu 6 s | 1:1 + 4:5, 9:16-Video |
| 4 Lieferung | echter Auftrag mit Einwilligung: Tragen, Steinplatte setzen, Kissen richten, Vorher und Nachher | 3:2, 9:16 |
| 5 Region | Outdoor-Terrasse am See im Abendlicht, Lochauer Ufer mit Pfänder und Lindau, Arlberg-Chalet, Weg nach Lochau | 21:9, 9:16 |

Jedes Shooting liefert mindestens 1 Totale, 3 Details, 1 Mensch, 1 Maßstab-Bild, je ein Bild in 21:9, 4:5 und 9:16 sowie 1 Loop von 8–12 s.

---

## 8. Motion-System

### 8.1 Tokens (verbindlich in `@theme`)

```css
--ease-quiet:       cubic-bezier(0.22, 1, 0.36, 1);   /* alles Eintretende */
--ease-quiet-inout: cubic-bezier(0.65, 0, 0.35, 1);   /* Morphs, Seitenwechsel */
--ease-exit:        cubic-bezier(0.4, 0, 1, 1);       /* Austritte */
--ease-drift:       cubic-bezier(0.33, 0, 0.2, 1);    /* Atmosphäre */
--ease-pop:         cubic-bezier(0.34, 1.4, 0.64, 1); /* NUR Auswahl-Herz und Zähler */
--duration-ack:   50ms;   /* erste sichtbare Reaktion (Ziel), Grenze 100 ms */
--duration-micro: 160ms;  /* Hover, Fokus, Herz */
--duration-swap:  240ms;  /* Stoff- oder Materialwechsel, Bild-Fade unter der Falz */
--duration-ui:    280ms;  /* Menüs, Chips, Panels, Formularschritt */
--duration-morph: 400ms;  /* Shared-Element, Obergrenze aller Übergänge 450 ms */
--duration-enter: 600ms;  /* Reveals */
--duration-exit:  180ms;
--duration-slow:  1200ms; /* Seelicht-Crossfade, einmal pro Besuch */
--stagger-step: 60ms; --stagger-max: 240ms; --hover-intent: 80ms;
--spinner-delay: 300ms; --spinner-min: 600ms;
```

### 8.2 Regeln

- **Zwei Zeitklassen [EB 11]:** Die Antwort auf eine Eingabe dauert 80–280 ms und zeigt sich spätestens nach 100 ms. Atmosphäre dauert 600–2400 ms, verzögert nie eine Handlung und verdeckt nie Text.
- **Vier Ebenen:** Raum (Seitenwechsel), Kapitel, Element und Rückmeldung. Pro Viewport läuft genau eine Hauptbewegung, die nächste startet frühestens 120 ms später.
- **Grenzen:** Text bewegt sich höchstens 24 px weit. Bilder skalieren höchstens auf 1,08, Parallax höchstens ±6 % und nur auf Vollbreiten-Bändern, Bildmasken öffnen höchstens 14 %. Gestaffelt wird in Gruppen von höchstens 5 Elementen.
- **Animiert werden nur** `transform` und `opacity`. Dazu kommen `clip-path` für Bild-Reveals (höchstens 2 gleichzeitig) und `filter: blur` nur im Morph. `will-change` steht nie dauerhaft im Code.
- **Seitenauftakt:** Header, Logo und Termin haben keine Eintrittsanimation. Das LCP-Bild ist sofort voll deckend und wird nicht eingeblendet. **Die H1 ist im ersten Frame nie vollständig versteckt**, die Maske startet höchstens bei `inset(0 0 35% 0)`. Alles Lesbare steht nach ≤ 1100 ms still, auf Unterseiten nach ≤ 700 ms.
- **Scroll:** **natives Scrollen, kein Lenis** (Abschnitt 16, W1). Scroll-Effekte nutzen nur CSS `animation-timeline: view()` hinter `@supports`. Ohne Unterstützung steht alles still und bleibt sichtbar. Texte werden beim Reveal nie unter 0,6 Deckkraft gesetzt.
- **Seitenübergänge (View Transitions, `<ViewTransition>` in Next 16):** Katalogbild zu Produktbild 400 ms `--ease-quiet-inout`. Markenname im Index zur H1 der Markenseite 420 ms. Alles andere: Austritt 150 ms, Eintritt 210 ms mit 8 px Hebung. Der Sprachwechsel läuft ohne Animation, seitliche Slides gibt es nicht (Ausnahme: Formularschritte ±16 px).
- **Zahlen** stehen von Anfang an mit dem Endwert im HTML. Erlaubt ist eine Ziffern-Walze pro Seite für belegte Fakten (900 ms). **Verboten** sind hochzählende Preise, Sterne, Lagerbestände und „x Personen sehen gerade“.
- **Shimmer-Skelette gibt es nicht.** Platzhalter ist eine stehende Fläche in `linen` oder der Dominanzfarbe des Bildes.

### 8.3 Signature-Momente (höchstens 1 gestalteter Höhepunkt pro Seite)

| Moment | Wo | Werte |
|---|---|---|
| **Seelicht** | Hero der Startseite | Das Bild zur Ortszeit in Lochau wählt der Server (vier Fenster: 06–11, 11–16, 16–20, 20–06 Uhr). Kein Fade, kein Zoom beim Laden. Wechselt das Zeitfenster bei offener Seite, gibt es höchstens einmal pro Besuch einen Crossfade über 1200 ms |
| **Horizontlinie** | einmal pro Seite | zeichnet sich per `clip-path` von links nach rechts, scrollgetrieben über `animation-range: entry 20% cover 45%` mit `--ease-quiet` (eine Scroll-Animation hat keine Dauer in ms). Ohne `@supports` steht die Linie fertig da. Fallback mit 800 ms nur per IntersectionObserver, falls gewünscht (GP) |
| **Ins Haus legen** | Produkt zu „Ihre Auswahl“ | Miniatur fliegt in 450 ms in den Header-Zähler, danach Pop 1 → 1,12 → 1 in 240 ms |
| **Typografischer Morph** | Markenindex zur Markenseite | 420 ms |
| **Tischkarte** | Terminbestätigung | Name und Foto der Beraterin, die Frage „Was dürfen wir Ihnen hinstellen?“ und Häkchen-Strich 400 ms (Peak-End) [EB 18] |

### 8.4 Reduced Motion

Gilt bei `prefers-reduced-motion: reduce` **und** bei einem eigenen Schalter „Ruhige Ansicht“ im Footer (`data-motion="reduced"`, Speicherung per `localStorage` in try/catch). Wege, Skalierungen, Parallax, Drift, Flug, Walze, Autoplay und Video entfallen. Seiten-Crossfades dauern ≤ 120 ms, Menü und Lightbox nur noch per `opacity` in 150 ms. Farbwechsel, Fokus und Häkchen bleiben (WCAG 2.3.3 Best Practice, 2.2.2 Pause für alles, was länger als 5 s läuft).

---

## 9. Komponentenliste

Ablage: `components/ui/*` für Primitive, `components/patterns/*` für zusammengesetzte Bausteine, `components/islands/*` für alles mit `'use client'` (Lint-Regel). Jede Komponente steht im Styleguide `/[locale]/styleguide` (noindex) mit diesen Zuständen: ruhend, Hover, Fokus, aktiv, deaktiviert, lädt, Fehler [EB 07].

| Gruppe | Komponenten | Kernvorgaben |
|---|---|---|
| Aktion | `Button` (primary, secondary, quiet, on-dark, icon), `Link` (inline, nav, overline) | **Höchstens 1 Primärknopf pro Ansicht.** Primär ist eine Ink-Fläche mit Paper-Text. Jeder Knopf mit Pfeil hat eine Unterzeile für Dauer und Kosten, wo es passt |
| Struktur | `Header`, `MegaMenu` (Disclosure, kein `role="menu"`), `MobileMenu` (`<dialog>`), `Footer`, `Breadcrumb`, `SkipLink`, `Section` (paper, band, inverse), `Overline`, `Hairline`, `Horizon` | Mega-Menü öffnet nach 300 ms Verweilen oder sofort per Klick, schließt nach 400 ms außerhalb, Esc schließt und setzt den Fokus zurück |
| Karten | `card-editorial`, `card-project`, `card-brand` (Name in Bodoni ab 32 px, sonst Instrument; Herkunft, kein Logo), `card-person`, `card-event` | Kein Rahmen, kein Schatten. Die ganze Karte ist ein Link über `::after` |
| Produkt | `ProductTile`, `PriceTag` (on-request, from, fixed, reduced, chf), `Gallery` (Scroll-Snap, „1 / 6“), `Lightbox` (`<dialog>` auf Paper), `SwatchGroup` (`radiogroup`, 44 px), `DimensionDrawing` (SVG je Variante), `FitCheck` („Passt es durch?“), `BuiltToStay` (Nachbezug, Ersatzteile, Pflege), `AdvisorNote` („Der Satz der Beraterin“), `FactList` (`dl`, tabular) | Badges nur aus Backoffice-Daten: „Im Showroom Lochau“, „Ausstellungsstück“, „Neu“. Kein „Nur noch 1“, kein „Beliebt“ |
| Katalog | `FilterBar` (4 sichtbar: Marke, Verfügbarkeit, Breite, Material), `FilterSheet` (mobil, `<dialog>` mit „38 Stücke anzeigen“), `ActiveFilters`, `Sort`, `Pagination` („Weitere 24 laden“ plus echte `?page=`-Links), `EmptyState` („Wir finden es für Sie“) | Filterzustand steht in der URL, Ergebniszahl mit `aria-live="polite"` |
| Auswahl | `SelectionHeart` (`aria-pressed`), `SelectionCounter`, `SelectionPage` (teilen per Link, PDF) | Ohne Konto. Speichert nur IDs und lässt sich per Link teilen |
| Formular | `TextField`, `TextArea`, `Select`, `Checkbox`, `RadioCard`, `DateSlot`, `Consent`, `ErrorSummary`, `Stepper` („Schritt 2 von 3“) | Sichtbares Label über dem Feld, Feld 52 px hoch, 16 px Schrift. Validierung beim Verlassen des Feldes. Honeypot statt CAPTCHA |
| Rückmeldung | `Toast` (`role="status"`, 5 s, pausiert bei Hover), `Notice` (info, success, error, notice), `InlineConfirmation` | Wichtige Bestätigungen erscheinen inline mit nächstem Schritt, nie nur als Toast |
| Vertrauen | `TrustBlock` („So kaufen Sie bei uns sicher“), `ProcessTimeline`, `CrossBorderSteps` (4 Schritte CH und FL), `ReviewList` (ab 20 echten Bewertungen) | siehe Abschnitt 11 |
| Ort | `SeelichtHero`, `OpeningLine` (heute geöffnet bis …, aus **einer** Datenquelle), `DreilaenderMap` (SVG), `MapFacade`, `VideoFacade` | Google Maps erst nach Klick und Consent |
| Insel | `StyleFinder`, `MaterialPlay`, `Hotspots`, `TourFacade`, `Concierge` (KI, Labs) | jede Insel ≤ 10 KB gzip im Initial-Bundle. Der KI-Concierge sagt im ersten Satz und am Eingabefeld sichtbar, dass eine KI antwortet (AI Act Art. 50 Abs. 1, gilt seit 02.08.2026), nennt keine verbindlichen Preise oder Lieferzusagen und bietet jederzeit „Mit einem Menschen sprechen“ (GP) |

---

## 10. Seitentypen und Nutzerwege

### 10.1 Informationsarchitektur

```
PLATZHIRSCH   Wohnen  Küche  Schlafen  Outdoor  Marken  Projekte  Das Haus     ⌕  ♡ Auswahl (3)  DE·EN·FR·IT  [ Termin ]
```

7 Hauptpunkte sind die Obergrenze. „Termin“ ist der einzige hervorgehobene Knopf im Header, gesetzt als `secondary` mit Rahmen (siehe P2), damit pro Ansicht nur der Inhalts-CTA gefüllt ist. Sprache ohne Flaggen, Region und Währung getrennt im Footer. Ratgeber, Ausstellungsstücke und Zielgruppen-Seiten erreicht man über Mega-Menü-Teaser, den Footer und die Suche [EB 08]. Jedes Produkt ist in höchstens 3 Klicks erreichbar und hat genau eine URL. **Die URLs bleiben bei der Migration erhalten oder bekommen eine 301-Weiterleitung, mit eingefrorener Basislinie und Playwright-Vergleich** [EB 15].

### 10.2 Seitentypen

| Typ | Pflichtaufbau |
|---|---|
| **Startseite** | Seelicht-Hero mit H1 „Italienisches Wohnen am Bodensee.“, Lead, Knopf „Termin wählen“ und Unterzeile „60 Minuten · kostenlos · auch samstags · Espresso inklusive“, dazu die Live-Zeile mit Öffnungszeit. Danach die Weiche „Ich plane … ein ganzes Haus · eine Wohnung · ein Hotel · als Architekt“ (eine Linkzeile). Dann 4 Räume, das Haus mit Café (Walnut-Fläche, Porträt der Gastgeberin), Projekte (3), Marken typografisch, Dreiländer-Service (Karte), TrustBlock und zum Schluss „Nehmen Sie Platz.“ mit Termin |
| **Raum-Hub** (Wohnen, Küche …) | Kurator-Einstieg mit 6–12 Stücken, ausgewählt und begründet von einer Person mit Namen und Foto, dazu Einstiege nach Lebenslage. Der volle Katalog ist 1 Klick entfernt [EB 03] |
| **Katalog** | Filterleiste, Raster mit höchstens 3 Spalten, nach 6–9 Kacheln ein Vollbreiten-Bild. 24 Stücke pro Ladeschritt, die Scrollposition bleibt erhalten |
| **Produkt („Atelier“)** | Galerie 4:5 und Makros. Rechts: Overline Marke, H1 Modell, Designer, Preis oder Preisrahmen mit Ausführung und Datum, Lieferspanne mit Datum, Maßzeichnung (bei 375 px ohne Zoom lesbar), Sitzmaße, „Passt es durch?“, Swatches nur mit echtem Foto, `BuiltToStay`, „Der Satz der Beraterin“, Ansprechperson. Aktionen: Primärknopf „Beratung zu diesem Stück“, sekundär „Muster anfordern“ und ♡ [EB 17] |
| **Marke** | Name als H1 per Morph, Herkunft (Ort und Jahr), Raumbilder aus Lochau, Stücke im Showroom, Formel „Minotti in unserer Ausstellung in Lochau“. **Kein** Händlersiegel |
| **Projekt** | Hero, Faktenzeile (Ort, Typologie, m², Leistungen, Dauer), Aufgabe und Lösung, „Im Projekt verwendet“, Zitat nur mit schriftlicher Freigabe |
| **Das Haus** | Showroom, Café, Team mit Gesichtern, Öffnungszeiten als `<dl>` mit hervorgehobenem heutigen Tag, Anfahrt, Veranstaltungen |
| **Beratung / Termin** | 4 Türen: Showroom, Video, Hausbesuch, Rückruf. Termintypen Probesitzen, Planung 120 min und Paartermin samstags |
| **Schweiz & Liechtenstein** | 4 Schritte (Offerte, Ausfuhr, Verzollung, Montage), CHF-Festpreis inklusive MWST 8,1 %, Zoll, Lieferung und Montage, aufgeschlüsselt mit Kurs und Datum, de-CH-Wörter (Offerte, MWST, kein ß) |
| **Regionsseiten** `designermoebel-*` | Fahrzeit, Währung, Lieferweg, nächstes Referenzprojekt, Ortsbild. Keine Textkopie zwischen den Regionsseiten |
| **Ihre Auswahl** | Liste, teilen, PDF, dann drei gleich gewichtete Wege: Showroom-Termin mit Auswahl, Video, Angebot |
| **Bestätigung** | Inline: Datum, Beraterin mit Foto, „Wir melden uns bis …“, Kalenderdatei, Getränkefrage |

### 10.3 Kernwege (Zielwerte im Test)

| Persona | Weg | Ziel |
|---|---|---|
| Bauherr | Start → Projekte → Projekt → „Ihr Projekt besprechen“ → Planungstermin mit Grundriss | ≤ 3 Klicks bis zur ersten Handlung |
| Paar mit Wohnung | Sofas → Filter Breite ≤ 240 → 3 × ♡ → Auswahl → Samstagstermin mit Auswahl | ≤ 2:30 min |
| Architekt | Footer „Für Architekten“ → Produkt → Downloads → Muster | Downloads ohne Login |
| Hotelier | Für Hotels → Referenzen → ÖHT-fähig planen → Objektanfrage | Rückruf in 2 h |
| Schweizer Kunde | Schweiz-Seite → CHF-Schätzung → Videotermin | Preis in CHF in ≤ 2 Klicks sichtbar |

**Termin:** 3 Schritte (Art, Zeit, Kontakt) in höchstens 90 s und 4 Klicks. Die nächsten 3 freien Zeiten stehen sofort da, Samstag oben. Pflichtfelder: 3 für Termin oder Rückruf (Name, E-Mail oder Telefon, Zeit), 4 für eine Anfrage. Das Budget wird nur freiwillig als Spanne abgefragt, „noch offen“ steht zuerst [EB 02, 08].

---

## 11. Verkaufs- und Vertrauensarchitektur (ohne Dark Patterns)

| Hebel | Umsetzung | Beleg |
|---|---|---|
| **TrustBlock „So kaufen Sie bei uns sicher“** | Probesitzen und Muster, Plan vor der Bestellung (unterschriebene Zeichnung), Festpreis in EUR und CHF, eine feste Ansprechperson. **„Anzahlung abgesichert“ erst, wenn der Vertrag mit Bank oder Versicherer steht.** Steht höchstens 1 Viewport von jedem Termin- oder Anfrage-Knopf im Inhalt entfernt (der Header-Knopf zählt nicht) und vollständig auf der Terminseite | 3 regionale Insolvenzen [23; EB 01] |
| **Ehrliche Preise** | „ab“ nennt eine bestellbare Ausführung mit Pflichtzusätzen und Datum. Bei Modulsofas und Küchen eine Spanne mit 3 echten Beispielprojekten. Runde Preise, nie ,99. `reduced` nur mit 30-Tage-Tiefstpreis (PAngV) | [EB 03, 07] |
| **CHF als Festpreis** | Währung nach Region, sichtbar umschaltbar, alles enthalten und aufgeschlüsselt. Kein „10 % sparen“ als Werbung | [EB 03] |
| **Kuratieren** | 6–12 Stücke pro Kategorie, von Menschen begründet, und Einstiege nach Lebenslage | Chernev et al. 2015 [EB 03] |
| **Funktionales Alibi** | Block „Gebaut, um zu bleiben“ mit Nachbezug, Ersatzteilen und Pflege | Keinan/Kivetz/Netzer 2016 [EB 01] |
| **Paare und lange Entscheidungen** | Auswahl ohne Konto, mit Link teilen, PDF, Termin für zwei, Projektzeitachse | [EB 01, 08] |
| **Echte Vorleistung** | Musterpost (bis 6 Muster, kostenlos, **Versand** innerhalb von 2 Werktagen; die Zustellzeit nach CH und FL wird wegen Zoll nur als gemessene Spanne genannt), vorbereitete Muster zum Termin | Cialdini, Reziprozität ethisch [EB 02, 17] |
| **Tempo** | Rückruf ≤ 2 h **innerhalb der Öffnungszeiten** (öffentlich nur so formuliert und nur, wenn die Quote im Monat ≥ 90 % liegt), Ziel unter 1 h. Angebot in 5 Werktagen, immer persönlich erklärt. Erinnerungen 48 h und 3 h vor dem Termin | Oldroyd, HBR 2011 [EB 02] |
| **Einwände vorab** | Lieferzeit als Wochenplan, Kasten „Was normal ist“, Reaktionszeit bei Reklamationen | [EB 17] |
| **Bewertungen** | Erst ab 20 echten Google-Bewertungen. Sortiert nach Datum, mit Prüfhinweis und Antworten des Hauses. Die QR-Karte bekommen alle Kunden, Gating gibt es nicht | UWG Anh. Nr. 23b/c [EB 03, 14] |
| **Echte Knappheit** | Nur echte Zähler mit Stand-Zeit (Tafel-Plätze, eine reservierte Steinplatte) | UGP-RL Anh. I Nr. 7 |

**Verboten (K.-o.):** Countdown, falsche Knappheit oder Nachfrage („3 sehen sich das an“), Confirmshaming, vorangekreuzte Einwilligungen, versteckte Kosten, Modal beim Seitenaufruf, Exit-Intent, Newsletter-Overlay. Dazu ein Cookie-Banner, bei dem „Ablehnen“ nicht gleich prominent ist, Review-Gating, Herstellerlogos als Siegel und „offizieller/autorisierter Händler“ außer bei ClassiCon.

---

## 12. Interaktive Signature-Features (5)

| # | Feature | Was | Aufwand | JS-Budget |
|---|---|---|---|---|
| 1 | **Seelicht-Hero** | Dieselbe Vignette in 4 Tageslichtern, die der Server nach der Uhrzeit in Lochau auswählt, dazu die Live-Zeile mit Öffnungszeit aus einer Quelle (dieselbe wie im JSON-LD). Ein Link „Seelicht ansehen“ zeigt alle 4 nebeneinander. **Technik (GP):** Die Hero-Komponente ist `'use cache'` mit `cacheLife({ stale: 300, revalidate: 900 })`, damit das LCP-Bild im statischen Shell liegt und höchstens 15 min falsch ist. Eine dynamische Auswahl pro Anfrage (`connection()`) würde das Bild aus dem Shell in den Stream schieben und das LCP verschlechtern. Die Live-Zeile ist dieselbe gecachte Komponente oder eine Inline-Funktion < 1 KB | S–M: 1 Shooting-Tag + 2–3 Entwicklertage, 2–4 Shootings pro Jahr | 0 KB (Crossfade bei offener Seite nur als „Kann“, ≤ 1 KB) |
| 2 | **Material-Spiel und Steinbibliothek** | 6–12 Swatches mit echten Variantenfotos (Crossfade 240 ms), Makro bei Doppeltipp, Streiflicht per CSS-Gradient. Für Binni-Stein: Licht-Regler mit 3 Stufen und jede Platte mit Nummer, Charge und Maß, „14 Tage unverbindlich reservieren“. Endet mit „Muster zum Termin bereitlegen“ | M: 2–3 Wochen plus Fotos | ≤ 10 KB |
| 3 | **Ihre Auswahl und QR im Showroom** | ♡ ohne Konto, teilbar, PDF. QR an jedem Ausstellungsstück (≥ 20 mm) führt auf `/de/s/<code>`. Die Auswahl geht mit Einwilligung zum Termin mit | S–M | ≤ 6 KB (`useSyncExternalStore`) |
| 4 | **Dreiländer-Karte** | eigene SVG-Karte (Natural Earth, zur Build-Zeit berechnet, ≤ 25 KB). Region antippen: Fahrzeit, Währung und Lieferweg erscheinen sofort (≤ 100 ms), die Route nach Lochau zeichnet sich parallel in 900 ms als Atmosphäre. Inhalte zusätzlich als Liste. Routen und Fahrzeiten aus OpenStreetMap/OSRM mit Hinweis „© OpenStreetMap-Mitwirkende“ (ODbL), nicht aus Google-Maps-Daten (Nutzungsbedingungen); Fahrzeiten als „ca.“ mit Stand (GP) | M: 1–2 Wochen | 0–3 KB |
| 5 | **Stil-Finder** | 5 Bildfragen (höchstens 7), jeweils mit „Weiß ich nicht“. Nach 60–90 s ein Moodboard aus 9 Kacheln unter eigenem Link, ohne E-Mail vorab. Funktioniert ohne JS als Formular | M: 2 Wochen plus Bildauswahl | ≤ 6 KB |

**Später (Phase 2, nur mit Beleg):** 360°-Rundgang aus eigenen Panoramen (Viewer erst nach Klick), Hotspots „Shop the Room“, AR für Sonnenschirme und Flos mit `<model-viewer>` nach Klick und mit Herstellerfreigabe, ein Streiflicht-Shader mit `ogl` (≤ 18 KB) nur in der Makro-Ansicht [EB 10, 12]. Ohne messbaren Termingewinn wird nichts davon gebaut.

---

## 13. Technische Leitplanken und Performance-Budget

| Bereich | Muss |
|---|---|
| Architektur | Server Components zuerst. `'use client'` nur unter `components/islands/`. Ausnahmen, die Next selbst verlangt: `error.js`, `global-error.js` und Formular-Komponenten direkt neben ihrer Route (z. B. `adventsabend/AdventsabendForm.js`) (GP). Heute macht `ClientLayout` die ganze Site zum Client, das wird aufgelöst [EB 15] |
| Bibliotheken | **Zuerst nativ:** Lightbox-Wisch per CSS Scroll-Snap, Bottom-Sheet per `<dialog>` und CSS (0 KB). `motion` nur, wenn das nicht reicht, und dann als `m` + `LazyMotion` mit **asynchron geladenen** Features (`features={() => import(...)}`): Grundlast ca. 4,6 KB, `domAnimation` +15 KB, Ziehen braucht `domMax` (+25 KB) und darf deshalb nie im Initial-Bundle liegen (GP). `embla` nur für echte Karussells (ohne Autoplay). `lenis` wird entfernt (heute nur in `Preview/buehne/SmoothScroll.js`). `react-slick` + `slick-carousel` (4 Dateien, eigene Schrift) werden durch embla ersetzt, `react-icons` durch `lucide-react` (ISC), damit es nur 1 Karussell und 1 Icon-Satz gibt (GP). `three`, `@react-three/*` und `model-viewer` nie im Initial-Bundle |
| CSS | Tokens nur aus `@theme` (3 Ebenen), Hex-Literale und `bg-[#…]` in Komponenten verboten (Lint, heute ca. 590). Cascade-Layer: reset, vendor, theme, base, components, brand, utilities, overrides. Container Queries für Karten, `svh` statt `vh`, logische Eigenschaften [EB 13] |
| Browserziel | browserslist Chrome/Edge 111, Safari/iOS 16.4, Firefox 128. Next 16 verlangt Chrome/Edge/Firefox 111 und Safari 16.4 (`docs/01-app/02-guides/upgrading/version-16.md`), Firefox 128 kommt von Tailwind 4 (GP). Die heutige browserslist in `package.json` (Chrome 90, Safari 15) wird angepasst. Neue Features nur hinter `@supports` |
| Daten | ein Frappe-Client mit Timeout, zod-Schemas und `'use cache'` mit Tags. **Voraussetzung (GP):** `cacheComponents: true` in `next.config.js`, das ist heute nicht gesetzt. Damit wird PPR Standard, die 26 Dateien mit `export const revalidate/dynamic` müssen migriert werden (`guides/migrating-to-cache-components`), und besuchte Routen bleiben per `<Activity>` versteckt gemountet, also müssen `<dialog>` und Menüs beim Routenwechsel schließen. Aufwand: 3–5 Entwicklertage, eigener Release. Fällt das Backend aus, gibt es die letzte gute Version und nie eine leere Seite mit Status 200 |
| Betrieb | Releases mit Rollback in < 60 s. Prototypen nur auf Staging (Passwort, `X-Robots-Tag: noindex`) und nicht im Produktions-Build. Weil `preview/` und `labs/` heute unter `src/app` liegen, braucht es dafür einen Schalter, z. B. `notFound()` im Layout, wenn `process.env.SHOW_PREVIEW !== "1"` (GP). `/api/image` wird gelöscht. CSP zuerst 14 Tage im Report-Only-Modus [EB 16] |

**Budgets.** Die CI bricht bei Überschreitung der **Laborwerte** ab (Lighthouse CI, Moto-G-Profil, 3 Läufe, Median; `size-limit` für JS). Felddaten (p75 mobil) kann keine CI messen. Sie werden monatlich aus `web-vitals` und, falls die Website genug Zugriffe hat, aus CrUX geprüft. Bei wenigen Hundert Messungen pro Monat nach Consent gilt der Feldwert nur als Trend (GP). `size-limit` und `@lhci/cli` sind noch nicht installiert.

| Kennzahl | Ziel | Harte Grenze |
|---|---|---|
| LCP | ≤ 2,0 s | 2,5 s |
| INP | ≤ 150 ms | 200 ms |
| CLS | ≤ 0,05 | 0,1 |
| JS initial (gzip) | Ratgeber ≤ 130 KB · Startseite ≤ 150 KB · Produkt ≤ 170 KB · Konfigurator ≤ 230 KB | +10 % |
| JS je Signature-Insel im Initial-Bundle | ≤ 10 KB | – |
| LCP-Bild | ≤ 120 KB mobil, ≤ 180 KB Desktop (AVIF) | 250 KB |
| Fonts | ≤ 2 Dateien vorgeladen, ≤ 90 KB | – |
| Video | 8–12 s Loop, ≤ 1,2 MB Handy, ≤ 2,5 MB Desktop, `preload="none"`, Start erst nach `load`, nie als Hero-LCP | – |
| Lighthouse A11y | ≥ 95, axe 0 Fehler der Stufen serious und critical | – |

Gemessen wird mit `size-limit`, Lighthouse CI und `web-vitals` im Feld (nur nach Consent über `src/lib/analytics.js`).

---

## 14. Barrierefreiheit und Recht

**Barrierefreiheit (Ziel WCAG 2.2 AA; EAA bzw. BaFG in AT und BFSG in DE gelten seit 28.06.2025 für Dienstleistungen im elektronischen Geschäftsverkehr, also sobald Verbraucher online einen Vertrag schließen können: Kasse, Gutscheine, Atelierverkauf. Kleinstunternehmen (< 10 Beschäftigte **und** Jahresumsatz oder Bilanzsumme ≤ 2 Mio. €) sind bei Dienstleistungen ausgenommen; das prüft der Steuerberater. Das Ziel AA gilt trotzdem. Mit dem Shop-Start ist eine Barrierefreiheitserklärung bzw. Information zur Barrierefreiheit Pflicht, verlinkt im Footer (GP)):**
- Pro Seite genau 1 `<header>`, 1 `<main id="main">` und 1 `<footer>` auf oberster Ebene, dazu ein Skip-Link als erstes fokussierbares Element und genau eine sichtbare `<h1>` mit dem Inhalt der Seite, nicht dem Logo [EB 14].
- Modale Ebenen sind `<dialog>` mit `showModal()`. Akkordeons sind `<details>`. Ein `role="menu"` gibt es nicht. Das Popover-Vollbildmenü der Galerie wird zu `<dialog>`.
- Fokusring zweifarbig, auf jeder Fläche mindestens 3:1. Der Fokus wird nie verdeckt (scroll-padding 88/80 px). Ziele mindestens 24 px, primäre Ziele 44 px. Fließtext 18 px.
- Formulare: sichtbares Label, `autocomplete`, Fehler am Feld (`aria-invalid`, `aria-describedby`) plus eine Zusammenfassung, die den Fokus bekommt. Kein automatisches Weiterspringen (Ausnahme Stil-Finder: Weiter nach 350 ms, aber mit Zurück und Überspringen). Kein CAPTCHA.
- Jede Ziehgeste lässt sich auch per Knopf ausführen (2.5.7). Videos haben Pause, Untertitel und Transkript. Alt-Texte folgen dem Muster Marke, Modell, Material, in 4 Sprachen.
- Zusätzlich gibt es den Schalter „Ruhige Ansicht“: Bewegung aus, Schrift +12,5 %, Text mindestens 7:1.

**Recht [Bericht 14]:**
- Marken: „in unserer Ausstellung“ statt Händler-Formeln, kein Logo als Siegel, Ausnahme ClassiCon (belegt).
- Bilder: Herstellerbilder nur mit Freigabe (EuGH C-161/17 *Renckhoff*). Keine Nachbauten von Designermöbeln in 3D ohne Lizenz (EuGH *Mio/konektra*).
- Preise: PAngV und PrAG, Gesamtpreis inklusive MwSt., Rabatt nur mit 30-Tage-Tiefstpreis. Maßanfertigung ohne Widerrufsrecht klar erklären (EuGH C-529/19).
- Consent: Consent Mode v2. Tracking, Clarity und Maps erst nach Einwilligung. „Ablehnen“ gleichwertig auf der ersten Ebene. Schriften selbst gehostet.
- Uploads (Grundriss, Fotos): EXIF- und GPS-Daten entfernen, Löschfrist nennen.
- Bewertungen: keine Belohnung ohne Offenlegung, kein Gating, Prüfhinweis.
- KI: Kennzeichnung nach AI Act Art. 50, keine generierten Räume als Projekte. KI-Concierge (Labs): Hinweis „Sie schreiben mit einer KI“ vor der ersten Eingabe (Art. 50 Abs. 1), Auftragsverarbeitungsvertrag mit dem Anbieter und Drittlandtransfer in der Datenschutzerklärung, keine Gesundheits- oder Finanzdaten abfragen (GP).
- Herkunft: Jedes Produkt nennt das Herstellungsland. Die Binni-Küchenlinie wird nie als „italienisch“ bezeichnet oder in einem Modul mit „Italienisches Wohnen“ ohne Herkunftsangabe gezeigt (Irreführung über die geografische Herkunft, § 5 Abs. 1 Nr. 1 dUWG, § 2 öUWG) (GP).
- Finanzierung: „0 %“-Werbung nur mit repräsentativem Beispiel (§ 17 PAngV DE, § 5 VKrG AT) (GP).
- Marke: Weder Unionsmarke noch Swissreg schützen in Liechtenstein. Für FL braucht es eine eigene Anmeldung beim Amt für Volkswirtschaft oder eine Madrid-Benennung LI (GP).
- Kontrolle der Ausnahme „ruhige Ansicht ≥ 7:1“: `text-soft` (4,99 auf Stone) und `text-accent` (5,69) werden dort auf `ink` umgestellt (GP).
- Dark Patterns: DSA Art. 25, UGP-RL Anh. I und UWG. Für die Abnahme ist das ein K.-o.-Kriterium.

---

## 15. Bewertungsraster für die drei Prototypen

**Skala je Kriterium:** 1 = fehlt oder verstößt · 2 = schwach · 3 = solide · 4 = gut · 5 = vorbildlich und direkt übernehmbar. **Punkte = Note × Gewicht.** Die Summe der Gewichte ist 59, das Maximum liegt bei **295 Punkten**.

| # | Kriterium (Disziplin) | Prüfung | Gew. |
|---|---|---|---|
| **A** | **Marke und Wirkung** | | |
| A1 | Leiser Luxus und Stimme: kein Gold-Prunk, keine Superlative, kein Ausrufezeichen, Gastgeber-Ton [01, 06, 18] | Textaudit, Pixelzählung Messing ≤ 2 % | 3 |
| A2 | 5-Sekunden-Test: ≥ 80 % wissen, was angeboten wird und wo [04, 09] | n = 60 online | 3 |
| A3 | Eigenständigkeit: im Blindtest von Höttges, reiter, Fretz, Gamma und Minotti unterscheidbar (≥ 8 von 10) [06, 19] | Screenshots ohne Logo | 3 |
| A4 | Logo: Pfade, lesbar bei 16 und 20 px, Hirsch erkennbar und modern [06] | Code, Test | 2 |
| A5 | Leitidee und Signature-Moment (Seelicht, Horizontlinie, „Nehmen Sie Platz.“ höchstens 1×) [18] | Sichtprüfung | 2 |
| **B** | **Visuelles System** | | |
| B1 | Farben: Tokens aus §4, höchstens 1 dunkle Fläche, 0 Hex in Komponenten [05, 07, 13] | Code, Screenshot | 2 |
| B2 | Typo: 2 Familien, Serife ≥ 32 px, Body 18 px, 68 Zeichen, Versalien nur in Overlines [06, 07] | DevTools | 2 |
| B3 | Raster und Weißraum: Asymmetrie, Section ≥ 160 px Desktop, ≥ 40 % frei, 0 Radien, 0 Schatten [04, 07] | Messen | 2 |
| B4 | Bildsprache und Rechte: eigene Fotos an Schlüsselstellen, Register, nur 5 Formate, Art Direction mobil [19] | Register, DevTools | 3 |
| **C** | **UX und Verkauf** | | |
| C1 | IA: ≤ 7 Hauptpunkte, Raum zuerst, 1 gefüllter Knopf, Mega-Menü per Tastatur [08] | Tree-Test, Tastatur | 3 |
| C2 | Termin-Weg: Raum → Produkt → Termin in ≤ 4 Klicks und 90 s, 3 Pflichtfelder, nächste freie Zeiten sichtbar [02, 08] | Aufgabentest | 3 |
| C3 | TrustBlock ≤ 1 Viewport neben jedem CTA, mit Unterzeile Dauer und Kosten [01, 02] | Sichtprüfung | 2 |
| C4 | Produktseite: Maßzeichnung, Sitzmaße, Preis oder Preisrahmen mit Ausführung, Lieferspanne, Alibi, Ansprechperson, Muster [17] | Checkliste | 3 |
| C5 | Ihre Auswahl ohne Konto, teilbar, mit Übergabe an den Termin [01, 03, 08] | Funktionstest | 2 |
| C6 | Dreiländer: CHF inklusive allem, 4 Schritte, de-CH-Wörter, Karte oder Fahrzeiten [03, 08, 10] | Sichtprüfung | 2 |
| C7 | Mobil: Daumenzone, CTA-Leiste 64 px, ≥ 44 px Ziele, Filter-Sheet [08] | 360 und 390 px | 2 |
| **D** | **Motion und Interaktion** | | |
| D1 | Motion-Regeln: Rückmeldung ≤ 100 ms, Auftakt ≤ 1100 ms, Scale ≤ 1,08, Parallax ±6 %, Maske ≤ 14 %, H1 nie ganz versteckt, kein Lenis [02, 11, 13] | DevTools Animations | 2 |
| D2 | Reduced Motion plus Footer-Schalter, Übersetzungstabelle §8.4 vollständig [11, 14] | `emulateMedia` | 2 |
| D3 | Qualität eines Signature-Features (Material, Karte, Auswahl-Flug, Stil-Finder) [10] | Gerätematrix | 1 |
| **E** | **Technik** | | |
| E1 | Web Vitals: LCP ≤ 2,0 s, INP ≤ 150 ms, CLS ≤ 0,05 (Labor, Moto G Power) [13, 16] | LHCI | 3 |
| E2 | Server-first, Inseln dynamisch, JS im Budget, ohne JS lesbar [15] | Analyzer, JS aus | 2 |
| E3 | CSS-Qualität: Layer, Container Queries, `svh`, kein `!important` außerhalb der overrides [13] | Code-Review | 1 |
| **F** | **Barrierefreiheit und Recht** | | |
| F1 | Semantik und Tastatur: Landmarks oben, 1 H1, `<dialog>`, Fokusführung, Formulare [14] | axe, NVDA, Tab | 3 |
| F2 | **Kontrast (K.-o.):** Text ≥ 4,5:1, UI und Fokus ≥ 3:1, kein Gold-Text auf Hell [05] | Kontrastprüfer | 3 |
| F3 | **Fairness und Recht (K.-o.):** 0 Dark Patterns, 0 Händler-Behauptungen, Consent korrekt, keine KI- oder Fremdbilder als eigene Projekte [01, 03, 14, 19] | Audit | 3 |

**Auswertung:** ≥ 236 Punkte (80 %) ergibt den Leitentwurf. 177–235 heißt überarbeiten, unter 177 wird der Entwurf verworfen. **K.-o.:** Note 1 bei F2, F3 oder C2 bedeutet Ausschluss vom Nutzertest bis zur Behebung. Gewonnen hat nicht ein Prototyp als Ganzes: Der Sieger liefert das Gerüst, die besten Bausteine der anderen werden übernommen.

**Vorbefund aus dem Code (26.10.2026, noch ohne Messung):**

| | galerie | buehne | dreilaendereck |
|---|---|---|---|
| Charakter | hell, editorial, ruhig | dunkel, filmisch, Bühne | warm, regional, Karte |
| Typo | Cormorant Garamond + Instrument Sans (Serife ab 28 px statt 32) | **Bodoni Moda + Instrument Sans** (entspricht §5) | Fraunces + Instrument Sans |
| Farbe | eigene Papiertöne, Text `#57514a` 7,08:1 | ganze Seite Nacht `#0e0d0c`: verstößt gegen „1 dunkle Fläche“, Gold auf Nacht 9,43:1 korrekt | eigene Palette, Ziegel `#a0502e` 5,12:1, See `#36596a` 6,74:1, nicht tokenkonform |
| Motion | H1-Maske `inset(0 0 100% 0)` versteckt die H1 im ersten Frame, Hover 1200 ms als Atmosphäre ok, Bildmaske `galMask` öffnet 18 % statt höchstens 14 % (GP) | Scroll-Timelines vorbildlich hinter `@supports`, aber `maskZoom` 1,15, Parallax-Scale 1,14 und Hero-Zeilen ganz versteckt, **Lenis** | Reveal 800 ms ohne `opacity: 0`, Zoom 1,06, im Rahmen |
| Struktur | server-first, Menü als `popover` (Fokus läuft dahinter) | Shell mit Header und Footer, H1 „Bühne frei“ ist ein Wortspiel | Server-only, `<details>`, **Dreiländer-Karte als SVG** (Feature 4) |
| Bilder | Fremdmaterial (Zypressen, Meer) und Minotti ohne Freigabe-Nachweis | Herstellermaterial | teils eigenes Material (Vernissage), Rest prüfen |
| Händler-Claims | keine | keine | keine |
| Erwartung | 190–215 | 170–200 | 195–220 |

Diese Spannen sind meine Schätzung aus dem Code und ersetzen den Test nicht. **Absehbare Synthese:** das helle, ruhige Gerüst der Galerie, die Bodoni-Typo und die Scroll-Technik der Bühne (ohne Lenis und mit gekappten Werten) und die Dreiländer-Karte samt regionaler Wärme des Dreiländerecks, alles auf die Tokens aus §4.

---

## 16. Widersprüche zwischen den Experten und meine Entscheidung

| # | Thema | Positionen | **Entscheidung** | Begründung |
|---|---|---|---|---|
| W1 | Smooth Scroll (Lenis) | Kein Lenis: 02, 07, 10, 11, 13, 18. Tolerieren mit Bedingungen: 04, 14, 15 (buehne) | **Kein Lenis in Produktion,** das Paket wird entfernt | INP-Risiko, Pflege, Konflikt mit Shader und Sticky. Wirkt wie ein Agentur-Showreel, Fretz nutzt es. Ruhe entsteht aus Gestaltung, nicht aus Nachlauf |
| W2 | Display-Serife | Bodoni (01, 06, 07), Cormorant (galerie), Fraunces (dreilaendereck) | **Bodoni Moda**, nur ab 32 px | Italienische Herkunft (Parma) als erzählbare Geschichte, schon geladen (0 KB extra), passt zur Positionierung. Cormorant ist sehr fein und wirkt französisch, Fraunces weich und eher skandinavisch-modisch. Rückfall auf Cormorant nur, wenn der A/B-Test Bodoni als „kühl“ ausweist |
| W3 | Logo | „Stangen“ PH-Geweih (06) gegen „Der Platz“ (galerie, 18) | **Stangen primär**, Der Platz testen | Beschreibende Zeichen wirken stärker bei geringer Bekanntheit (CH, FL). Die Platz-Idee lebt im Leitsatz weiter. Haarlinien-Quadrat ist generisch und bricht unter 32 px |
| W4 | Dark Mode | Abendmodus über System (05) gegen keinen Dark Mode (07) | **Zum Start nein,** Tokens vorbereiten, Auslieferung erst wenn vollständig | Stoff- und Holzfarben sollen nicht vom Betriebssystem abhängen, ein halbfertiger Dark Mode schadet (05 selbst). Die Walnut-Fläche liefert das Abendgefühl |
| W5 | Ganze Seite dunkel (buehne) | buehne gegen „1 dunkle Fläche“ (01, 05, 07) | **Hell mit 1 dunklem Kapitel** | Weißraum ist ein Preishebel (Sevilla/Townsend 2016), dunkle Ganzseiten senken die Lesbarkeit für 45+. Die Bühne-Stimmung bleibt als Abendkapitel Haus und Café |
| W6 | Hauptnavigation | 6 Punkte (01, 07), 7 mit Schlafen (08), höchstens 5 (04) | **7 Punkte mit Schlafen** | Ankleiden und Treca sind margenstarke Projekte. Im Tree-Test der Runde 1 prüfen: liegt Schlafen unter 5 % der Klicks, wandert es unter Wohnen |
| W7 | Mobiler Header beim Scrollen | bleibt (07), blendet aus (08) | **Desktop bleibt, mobil blendet aus** und kommt beim Hochscrollen um 8 px oder mehr zurück | Mobil liegt der Termin in der unteren CTA-Leiste, so bleibt Bildfläche frei. Auf dem Desktop ist Platz genug |
| W8 | Seitenrand mobil | 24 px (01, 06), 16 px (07, 13), 20–24 px (08) | **20 px** | Kompromiss aus Bildbreite und Ruhe, mobil 335 px nutzbar bei 375 px Breite |
| W9 | Fließtextgröße | 17 px (01, 07, 08), mindestens 18 px (14) | **18 px** | Zielgruppe 45+, Lesbarkeit vor Dichte. UI 16 px |
| W10 | Sekundärtext, Feldrand, See | `#6b665f` / `#6b6f73` / `#5c636a` · `#8a8174` / `#8f8a82` · `#4f6b68` / `#4f6268` | **`#5c636a`**, **`#8a8174`**, **`#4f6b68`** | Höchster Kontrast. `#8f8a82` fällt auf Stone unter 3:1, `#8a8174` bleibt bei 3,14 |
| W11 | Erfolgsfarbe, Fehlerfarbe | `#3e5754` (05) / `#2f6b4a` (07) · `#9b2c2c` / `#9b2c24` | **`#2f6b4a`**, **`#9b2c2c`** | Grün unterscheidet sich klar vom See-Akzent und bleibt gedämpft |
| W12 | Hero-Bewegung | Scale 1,04 → 1 in 1600 ms erlaubt (11), Hero nie animiert (18), Video-Hero (02 F5, 12) | **Seelicht-Foto steht still**, kein Zoom und kein Video im Hero | Das Foto ist der Beweis des Ortes und das LCP. Ein Video-Loop darf weiter unten im Kapitel Haus laufen (Poster, nach `load`, Pause-Knopf) |
| W13 | Mega-Menü-Verzögerung | 300 ms (07), 400 ms (08), 120 ms Intent (11) | **300 ms Hover, sofort per Klick, 400 ms schließen** | NN/g-Korridor 300–500 ms. Geübte Nutzer und Tablet bekommen Klick oder Tipp |
| W14 | Pflichtfelder | 3/4 (02), 4 (03, 08, 17), 5 (07) | **Termin 3, Anfrage 4** | Jedes weitere Pflichtfeld kostet Abschlüsse. Wohnort und Land werden optional erfragt |
| W15 | Leitsatz-Platz | Hero-Overline (18) gegen H1 mit Positionierung (14) | **H1 = „Italienisches Wohnen am Bodensee.“** Der Leitsatz „Nehmen Sie Platz.“ steht als Bodoni-Zeile im Schluss-CTA, höchstens 1× pro Seite | SEO und Screenreader brauchen den Inhalt in der H1. Der Leitsatz am Seitenende gestaltet das Ende im Sinne von Peak-End |
| W16 | CTA-Wort | „Termin wählen“ (02, 18), „Termin vereinbaren“ (07) | Header **„Termin“**, im Inhalt **„Termin wählen“** | „Wählen“ betont die Kontrolle beim Kunden und das Ende des Hin- und Herschreibens |
| W17 | WebGL | ogl-Effekte, Seenebel 820 ms (12), keine WebGL-Effekte (02) | **Phase 1 ohne WebGL.** Phase 2 Streiflicht-Shader nur in der Makro-Ansicht, **kein Seenebel-Übergang** | 820 ms überschreitet die Grenze von 450 ms für Übergänge. Die CSS-Lösung deckt 80 % der Wirkung ab |
| W18 | JS-Budget | 150/170 KB pro Seitentyp (15), ≤ 170 KB pauschal (16), ≤ 10 KB für Motion (02) | **Werte pro Seitentyp aus 15**, plus ≤ 10 KB pro Insel | Strenger ist besser. Die Werte werden im ersten CI-Lauf kalibriert |
| W19 | LCP-Ziel | 2,0 s (02, 16, 18, 19), 2,3 s (15) | **Ziel 2,0 s, Grenze 2,5 s** | Google-„gut“ ist die harte Grenze, 2,0 s ist der Abstand zur Konkurrenz (Minotti: 18,9 s) |
| W20 | Display XL mobil | 56 px (01, 07), 48 px (06) | **48 px** | Lange deutsche Wörter bei 360 px, Verhältnis 2,0 ≤ 2,5 bleibt zoomfest |
| W21 | Fokusring | Ink (07), brass-700 (13), Ink plus Paper-Halo (05) | **Ink 2 px, Abstand 2 px, Halo 4 px Paper; Messing auf Dunkel** | Auf jedem Grund sichtbar, 11,37:1 |

**Offene Punkte, die niemand im Expertenrat entscheiden kann:** Vertrag für die Absicherung der Anzahlung (ohne Vertrag kein Claim). Bildfreigaben der Hersteller. Markenrecherche zum Logo. Prüfung der Showroom-Adresse: Das Masterkonzept (23) nennt „Landstraße 9/11, 6911 Lochau“, Impressum und Datenschutz „Landstraße 9“ (Risiko R8, § 5 ECG). Die ladungsfähige Anschrift muss die Geschäftsführung bestätigen. Die Koordinaten für die Overline-Signatur (47°31′ N · 9°45′ E) sind noch zu verifizieren.

---

*Ende der Design-Bibel. Nächster Schritt: das Raster aus §15 auf alle drei Prototypen anwenden (Messung statt Code-Schätzung), danach Fünf-Sekunden-Test und Logo-Test (n = 60 bzw. 30) und die Entscheidung über das Gerüst.*

---

## 17. Änderungen der Gegenprüfung (26.10.2026)

Prüfer: Gegenprüfung aus Sicht Senior-Engineer, Markenberatung und Recht (Bericht `20-gegenpruefung.md`). Alle Stellen im Text tragen die Marke **(GP)**. Nachgerechnet: alle Kontrastwerte aus §4.1 (WCAG-2.x-Formel, Node) stimmen, die Gewichtssumme in §15 (59 / 295 / 236 / 177) stimmt.

| # | Stelle | Fehler | Korrektur |
|---|---|---|---|
| G1 | §1.1 | „abgesicherte Anzahlung“ stand als Tatsache im Markenkern, §11 erlaubt sie erst nach Vertrag. Nach Masterkonzept liegt die Eigenmittelquote bei ca. −91 %, eine unbelegte Absicherung wäre irreführend (§ 2 öUWG, § 5 dUWG) | Claim bis zum Vertrag streichen, Herkunft „italienisch“ eingeschränkt |
| G2 | P2 / §10.1 / §9 | Header-„Termin“ gefüllt **und** Hero-„Termin wählen“ gefüllt ergab 2 Primärknöpfe im ersten Viewport | Header-Knopf `secondary`, CTA-Leiste mobil erst nach dem Hero |
| G3 | §4.2 | „Messing hat genau drei Orte“ widersprach `text-accent` = brass-700 und Fokus/Zähler in brass-400 | drei dekorative plus definierte funktionale Einsätze |
| G4 | §5 | latin-ext für ç/ë ist unnötig (beide in latin). Mit latin-ext lädt next/font 2 Dateien pro Familie vor, also 4 statt 2, und reißt das 90-KB-Budget (heute gemessen: 4 Dateien, rund 175 KB) | nur `latin` vorladen, `wdth` nur bei Bedarf |
| G5 | §5 Skala | `display-l`, `display-m`, `title` und `lead` erreichten Min/Max nicht bei 360/1440 px (z. B. `title` nur 25 px statt 26 px) | Formeln neu berechnet |
| G6 | §6 / §14 | 44 px gegen 24 px Mindestziel | 44 px für Bedienelemente, 24 px nur für Fließtext-Links |
| G7 | §8.3 | Scrollgetriebene Horizontlinie mit „800 ms“ | `animation-range` statt Dauer |
| G8 | §12.1 | Seelicht „0 KB“ und Auswahl pro Anfrage passen nicht zu `'use cache'`/PPR (LCP-Bild fiele aus dem Shell) | gecachte Komponente, Revalidierung alle 15 min, Crossfade nur als „Kann“ |
| G9 | §12.4 | Information erst nach 900 ms Routenanimation widersprach Rückmeldung ≤ 100 ms. Lizenz der Routendaten fehlte | Text sofort, Route parallel, OSM/ODbL-Hinweis |
| G10 | §13 Daten | `'use cache'` ohne `cacheComponents: true` funktioniert in Next 16 nicht, die Migration fehlte im Plan | Voraussetzung, Migrationsaufwand, `<Activity>`-Folgen |
| G11 | §13 Browser | Firefox 128 als Next-16-Forderung falsch zugeordnet (Next: 111, Tailwind 4: 128) | korrigiert |
| G12 | §13 Budgets | „Feld-p75, CI bricht ab“ ist technisch nicht möglich | CI auf Laborwerte, Feld monatlich als Trend |
| G13 | §13 Bibliotheken | `LazyMotion` für Wischen braucht `domMax` (+25 KB) und sprengt das 10-KB-Insel-Budget, wenn es nicht asynchron lädt. Zwei Karussell- und zwei Icon-Bibliotheken | native Lösung zuerst, Features async, slick und react-icons raus |
| G14 | §13 Architektur | „`'use client'` nur unter islands“ ist für `error.js`/`global-error.js` nicht einhaltbar | Ausnahmen benannt |
| G15 | §4.2 | „Lint“ für 1 Walnut-Fläche pro Seite ist nicht umsetzbar | Playwright-Test |
| G16 | §11 | „2 Werktage nach CH und FL“ ist mit Zoll nicht garantierbar, „Rückruf ≤ 2 h“ ohne Zeitfenster ist eine überprüfbare Zusage | Versand statt Zustellung, Rückruf innerhalb der Öffnungszeiten |
| G17 | §14 | fehlten: KI-Concierge (Art. 50 Abs. 1), Herkunft Binni, 0-%-Finanzierung, Markenschutz in FL, Barrierefreiheitserklärung, Kleinstunternehmen-Ausnahme | ergänzt |
| G18 | §15 Vorbefund | Galerie-Bildmaske 18 % > 14 % nicht erwähnt | ergänzt |
| G19 | §16 offene Punkte | Adresse: Masterkonzept nennt Landstraße 9/11 | aktualisiert |

**Nicht geändert, aber zur Entscheidung (siehe Bericht 20, Abschnitt 2):** Umfang für ein Team von ca. 5 Personen. Phase 1 trägt nur die Signature-Features 1, 3 und 4. Material-Spiel/Steinbibliothek (2) und Stil-Finder (5) kommen erst in Phase 2, wenn die Plattendaten von Binni im Backoffice gepflegt sind.
