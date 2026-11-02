# Expertenrat 05: Farbe und Colorgrading

**Rolle:** Farbexperte und Colorist · **Stand:** 26.10.2026 · **Grundlage:** `digital/01`, `02`, `12`, `13`, `14`, `23-masterkonzept.md` Abschnitt 4, `src/app/globals.css`

**Hinweis zur Messung:** Alle Kontraste in dieser Datei habe ich mit der WCAG-2.x-Formel (relative Luminanz, sRGB) selbst nachgerechnet. Die OKLCH-Werte sind aus den HEX-Werten umgerechnet (Björn Ottosson, OKLab 2020). Das Skript liegt nicht im Repo. Wer nachprüfen will, nimmt https://webaim.org/resources/contrastchecker/ und https://oklch.com.

**Korrektur zum Bestand:** In `globals.css` und `digital/13` steht, `#7a5f17` habe auf Weiß „≈4,9:1“. Auf Weiß sind es aber **6,04:1**. Die 4,95:1 gelten auf `stone #ece8e1`. Ebenfalls nachgerechnet: `#d1b250` auf Weiß = **2,06:1** (die 2,05:1 aus Lighthouse sind gerundet), auf `paper #faf8f4` 1,94:1, auf `stone` 1,69:1.

**Prototypen:** `src/app/[locale]/preview/` gab es zum Zeitpunkt der Prüfung noch nicht (`/de/preview/galerie` liefert 404). Deshalb ist Abschnitt 5 als Prüfraster geschrieben.

---

## 1. Die wichtigsten Erkenntnisse

1. **Helligkeit und Sättigung wirken stärker als der Farbton.** In der Studie von Valdez und Mehrabian erklärt die Helligkeit vor allem, wie angenehm eine Farbe empfunden wird (Pleasure = 0,69 B + 0,22 S). Die Sättigung erklärt vor allem, wie stark sie aufregt (Arousal = −0,31 B + 0,60 S). Für das Projekt heißt das: Ruhe und Wertigkeit entstehen durch helle, wenig gesättigte Flächen. Der Farbton ist zweitrangig. Wilms und Oberfeld haben den starken Einfluss der Sättigung 2018 bestätigt.
   Quellen: Valdez & Mehrabian 1994, *J. Exp. Psychol.: General* 123(4), 394–409, https://pubmed.ncbi.nlm.nih.gov/7996122/ · Wilms & Oberfeld 2018, *Psychological Research* 82, 896–914, https://doi.org/10.1007/s00426-017-0880-8
2. **Farbe verschiebt die Markenpersönlichkeit messbar.** Farbton, Sättigung und Helligkeit sagen jeweils andere Dimensionen der Markenpersönlichkeit nach Aaker voraus. Hohe Sättigung steigert den Eindruck „aufregend“, also das Gegenteil von leiser Kompetenz. Black, Lila und gedämpfte Töne stehen eher für „sophistication“. Eine Luxus-Einrichtungsmarke braucht also gedämpfte Töne und eine starke Hell-Dunkel-Spannung, keine bunte Palette.
   Quellen: Labrecque & Milne 2012, *J. Acad. Mark. Sci.* 40, 711–727, https://doi.org/10.1007/s11747-010-0245-y · Labrecque, Patrick & Milne 2013, *Psychology & Marketing* 30(2), https://doi.org/10.1002/mar.20597
3. **Gesättigte Farbe lässt Objekte größer wirken und zieht die Aufmerksamkeit auf sich.** Das zeigen sechs Experimente von Hagtvedt und Brasel. Für die Website folgt daraus: Die Oberfläche bleibt achromatisch, damit die Farbe aus den Produkten kommt, also aus dem Bezug, dem Marmor und dem Messing. Eine gesättigte Fläche daneben würde das Produkt optisch kleiner machen.
   Quelle: Hagtvedt & Brasel 2017, *J. Consumer Research* 44(2), 396–413, https://doi.org/10.1093/jcr/ucx039
4. **Farbwirkung hängt vom Kontext ab und lässt sich nicht als feste Formel anwenden.** Der Übersichtsartikel von Elliot und Maier warnt vor Pauschalregeln wie „Blau = Vertrauen“, weil viele Effekte schwach oder schlecht repliziert sind. Deshalb begründe ich die Palette mit Material, Ort und Kontrast, nicht mit Farb-Esoterik, und lasse wichtige Entscheidungen im A/B-Test prüfen.
   Quelle: Elliot & Maier 2014, *Annual Review of Psychology* 65, 95–120, https://doi.org/10.1146/annurev-psych-010213-115035
5. **Ein einzelner Goldton kann nicht alle Aufgaben erfüllen.** `#d1b250` hat eine OKLCH-Helligkeit von 77 %. Auf allen hellen Flächen der Marke liegt er unter 3:1, auf dunklen Flächen dagegen sehr gut (5,85:1 auf Ink, 8,86:1 auf Night). Die Lösung ist eine **Messing-Skala mit fester Rollenverteilung**: Für Text auf hellen Flächen braucht es einen Ton mit L ≤ 54 %, für Linien und Icons L ≤ 60 %, und der Signaturton gehört auf dunkle Flächen. WCAG 2.2 verlangt 4,5:1 für Text (SC 1.4.3) und 3:1 für Bedienelemente und Fokus (SC 1.4.11). Ab dem 28.06.2025 gelten diese Werte über den European Accessibility Act und das BaFG bzw. BFSG verbindlich für den E-Commerce.
   Quelle: W3C WCAG 2.2, https://www.w3.org/TR/WCAG22/
6. **Dark Mode heißt nicht Schwarz und Weiß.** Material Design empfiehlt ein dunkles Grau (#121212) statt Schwarz und entsättigte Akzentfarben, weil reines Weiß auf Schwarz bei Astigmatismus überstrahlt und gesättigte Töne auf Dunkel flimmern. Für Platzhirsch passt ein warmes Nachtgrau (L ≈ 20 %, Farbton 85°) besser als das kühle `night #0f1624`, das blaustichig ist (Farbton 263°).
   Quelle: Material Design, Dark theme, https://m2.material.io/design/color/dark-theme.html
7. **Next.js 16 wandelt jedes Bild in sRGB um und entfernt das Farbprofil.** `image-optimizer.js` ruft sharp 0.35.4 nur mit `.rotate()`, `.resize()` und `.avif()/.webp()/.jpeg()` auf, ohne `keepIccProfile()`. Laut sharp-Dokumentation wird die Ausgabe dann standardmäßig „in den geräteunabhängigen sRGB-Farbraum konvertiert“ und das ICC-Profil gelöscht. Display-P3-Master werden also korrekt nach sRGB abgebildet, der erweiterte Farbumfang geht dabei aber verloren. Bilder ohne Profil (oft Backoffice- oder Herstellerbilder) gelten als sRGB.
   Quellen: `node_modules/next/dist/server/image-optimizer.js` Z. 874–904 · https://sharp.pixelplumbing.com/api-output
8. **Display P3 lohnt sich nur gezielt.** Laut WebKit decken P3-Displays etwa 25 % mehr Farben ab als sRGB. Das betrifft fast alle iPhones und Macs, und genau diese Geräte nutzt die Zielgruppe überdurchschnittlich. Der Gewinn zeigt sich bei Messing, Kupfer, Terrakotta und gesättigten Stoffen von Paola Lenti. CSS kann P3 über `oklch()` und `@media (color-gamut: p3)` ansprechen.
   Quellen: https://webkit.org/blog/10042/wide-gamut-color-in-css-with-display-p3/ · CSS Color 4, https://www.w3.org/TR/css-color-4/
9. **Falsch dargestellte Farben sind auch ein rechtliches Risiko.** Weicht die Produktfarbe im Bild stark ab, kann das nach UWG irreführen (siehe `digital/14`, Z. 308). Außerdem führt es zu Reklamationen bei Bezügen, wo die Lieferzeiten bei 10 bis 14 Wochen liegen. Farbtreue gehört deshalb zur Fotoproduktion und ist keine Geschmacksfrage.

---

## 2. Vorgaben für den Neuauftritt

### 2.1 Grundsatz „Material, nicht Marketingfarbe“

Die Palette leitet sich aus dem Ort und dem Showroom ab: Kalkstein und Papier, Seegrau, Walnuss und Messing (Rimadesio-Profile, Flos-Leuchten). Verteilung der Flächen auf jeder Seite: **≥ 85 % Neutraltöne, ≤ 10 % eine dunkle Fläche (Ink oder Walnut), ≤ 2 % Messing, ≤ 5 % Saisonfarbe** (nur in Kampagnenmodulen). Das deckt sich mit `digital/01`, Regel Z. 91.

### 2.2 Farbsystem (Tokens für `@theme`)

**Neutraltöne (Hellmodus)**

| Token | HEX | OKLCH | Rolle | Kontrast (nachgerechnet) |
|---|---|---|---|---|
| `--color-paper` | `#faf8f4` | `oklch(98.0% 0.006 84.6)` | Seitenhintergrund, ersetzt `#ffffff` | Ink darauf 11,37:1 |
| `--color-bone` | `#f7f5f1` | `oklch(97.1% 0.006 84.6)` | Sekundärfläche, Produktkachel | Ink 11,07:1 |
| `--color-stone` | `#ece8e1` | `oklch(93.2% 0.010 81.8)` | ruhige Bänder | Ink 9,87:1 |
| `--color-linen` | `#e6e1d8` | `oklch(91.1% 0.013 82.4)` | Bildplatzhalter, Skeleton | – |
| `--color-sand` | `#ddd6ca` | `oklch(87.8% 0.018 81.3)` | **nur dekorative** Haarlinien | 1,36:1 auf Paper, also nie als Feldrahmen |
| `--color-pebble` | `#8a8174` | `oklch(60.7% 0.022 77.2)` | Rahmen von Eingabefeldern, Checkboxen, Trennlinien mit Funktion | 3,62:1 auf Paper, 3,14:1 auf Stone (≥ 3:1, SC 1.4.11) |
| `--color-ash` | `#6b665f` | `oklch(51.3% 0.013 76.5)` | Sekundärtext, Bildunterschriften, Metadaten | 5,36:1 auf Paper, 4,66:1 auf Stone |
| `--color-ink` | `#30373e` | `oklch(33.3% 0.016 248.3)` | **Primärfarbe**: Text, Primärbutton, Logo | 11,37:1 auf Paper |
| `--color-ink-deep` | `#1f252b` | `oklch(26.1% 0.014 248.4)` | Hover des Primärbuttons, Footer | Paper darauf 14,58:1 |

Fließtext wechselt von `#171717` zu **Ink `#30373e`**. Ink ist ein kühles Seegrau auf warmem Papier. Diese Spannung aus warm und kalt wirkt edel, und 11,37:1 erfüllt AAA.

**Primärfarbe und Sekundärfarben**

| Token | HEX | OKLCH | Rolle | Kontrast |
|---|---|---|---|---|
| Primär `--color-ink` | `#30373e` | s. o. | Marke, Buttons, Text | – |
| `--color-walnut` | `#3f3129` | `oklch(32.6% 0.025 51.3)` | einziger dunkler Abschnitt (Showroom/Café, Footer) | Paper darauf 11,77:1, Messing 6,06:1 |
| `--color-see` (neu, Bodensee-Grün) | `#4f6b68` | `oklch(50.5% 0.033 188.0)` | Sekundärakzent: Region, Outdoor, Info-Hinweise | 5,45:1 auf Paper, Paper darauf 5,45:1 |
| `--color-see-deep` | `#3e5754` | `oklch(43.6% 0.031 186.9)` | Hover, Text auf Stone | 6,38:1 auf Stone |

**Messing-Skala (ersetzt das eine Gold `#d1b250`)**

| Token | HEX | OKLCH | Erlaubt auf | Nicht erlaubt | Kontrast |
|---|---|---|---|---|---|
| `--color-brass-200` | `#e2cc86` | `oklch(84.8% 0.092 92.6)` | Hover und aktiver Zustand auf Dunkel, Dark-Mode-Akzent | jede helle Fläche | 7,59:1 Ink, 11,48:1 Night-warm |
| `--color-brass-400` = **Signatur** | `#d1b250` | `oklch(77.2% 0.122 91.7)` | Text, Linien und Fokusring **auf Ink, Walnut oder Night** sowie Fläche mit Ink-Text | Text oder Linie auf Paper, Bone oder Stone | 5,85:1 Ink, 6,06:1 Walnut, 8,86:1 Night-warm, Ink-Text darauf 5,85:1 |
| `--color-brass-500` | `#9a7a2a` | `oklch(59.5% 0.104 86.4)` | Linien mit Funktion und Icons auf Hell (Unterstrich aktiver Menüpunkt, Merklisten-Herz) | Fließtext | 3,81:1 Paper, 3,31:1 Stone |
| `--color-brass-700` (bisher `gold-text`) | `#7a5f17` | `oklch(50.0% 0.093 86.8)` | Overlines, Markennamen und kleine Akzenttexte auf Hell | Dunkle Flächen | 6,04:1 Weiß, 5,69:1 Paper, 4,95:1 Stone |
| `--color-brass-800` | `#5f4a12` | `oklch(42.0% 0.076 87.2)` | Akzenttext auf Linen oder Sand | – | 6,95:1 Stone |

**P3-Aufwertung (nur Messing, progressive):**
```css
@media (color-gamut: p3) {
  :root { --color-brass-400: oklch(77% 0.14 88); --color-brass-200: oklch(85% 0.105 90); }
}
```
Der Ton bleibt gleich, die Helligkeit auch, das Messing wirkt auf iPhone und Mac nur metallischer. Weil L konstant bleibt, ändern sich die Kontraste nicht nennenswert. Vor dem Release mit dem Kontrastprüfer der Chrome DevTools in P3 gegenprüfen.

**Statusfarben (gedämpft, keine Signalfarben):** Fehler `#9b2c2c` (`oklch(46.5% 0.147 24.9)`, 7,10:1 auf Paper, 6,16:1 auf Stone) und Erfolg `#3e5754` (7,34:1 auf Paper), immer zusammen mit Icon und Text, nie nur über die Farbe (SC 1.4.1).

### 2.3 Wie das Gold-Problem gelöst wird

1. **Kein goldener Flächenbutton mit weißer Schrift mehr** (56 Stellen `bg-[#d1b250]`, 2,06:1). Der Primärbutton ist Ink mit Paper-Text (11,37:1), `rounded-none`, Hover `ink-deep`. Ein Sekundärbutton hat einen 1-px-Rahmen in Ink und Ink-Text.
2. **Alle 151 Stellen `text-[#d1b250]` auf Hell** werden zu `text-brass-700`. Ausnahme: Gold steht auf einem dunklen Abschnitt, dann bleibt `brass-400`.
3. **Fokusring zweifarbig und auf jedem Grund sichtbar:** `outline: 2px solid var(--color-ink); outline-offset: 2px; box-shadow: 0 0 0 4px var(--color-paper)`. Auf dunklen Abschnitten `outline-color: var(--color-brass-400)` (5,85 bis 8,86:1). Das erfüllt SC 1.4.11 und nähert sich SC 2.4.13 (AAA).
4. **Gold bekommt einen festen Ort.** Erstens als 1-px-Messinglinie über dem dunklen Showroom-Abschnitt. Zweitens als Unterstrich des aktiven Menüpunkts (`brass-500`, 2 px). Drittens im Logo auf dunklem Grund. Sonst nirgends. Seltenheit ist ein Luxussignal, Gold überall wirkt wie ein Discounter.
5. **Lint-Regel:** Klassen `-[#d1b250]` und `-[#30373e]` werden verboten. Es gelten nur noch Tokens (heute 296 bzw. 291 Hex-Literale laut `digital/01`).

### 2.4 Dark Mode („Abendmodus“)

- **Aktivierung:** automatisch über `prefers-color-scheme: dark`, dazu ein Umschalter im Footer. Kein eigener Schalter im Header, weil er die Navigation unruhig macht.
- **Tokens:**

| Token | HEX | OKLCH | Kontrast |
|---|---|---|---|
| `--bg` | `#161513` | `oklch(19.6% 0.004 84.6)` | – |
| `--surface` | `#201e1b` | `oklch(23.6% 0.006 78.2)` | Text 13,62:1 |
| `--surface-2` | `#2a2724` | `oklch(27.5% 0.007 67.5)` | Text 12,16:1 |
| `--line` | `#3a3632` | `oklch(33.6% 0.009 67.5)` | dekorativ |
| `--text` | `#ece8e1` (Stone) | – | 14,94:1 auf `--bg` (kein reines Weiß, gegen Überstrahlen) |
| `--text-muted` | `#a39b8f` | `oklch(69.3% 0.020 78.2)` | 6,64:1 auf `--bg`, 5,40:1 auf `--surface-2` |
| `--accent` | `#d1b250` / P3 s. o. | – | 8,86:1 |
| `--see` (Dark) | `#9fb5b2` | `oklch(75.5% 0.025 186.7)` | 8,45:1 |

- **Höhe wird über Helligkeit gezeigt, nicht über Schatten:** pro Ebene etwa +4 % L (19,6 → 23,6 → 27,5).
- **Produktbilder:** Freigestellte Produkte auf weißem oder Bone-Hintergrund würden auf Dunkel wie Leuchtkästen wirken. Deshalb bekommen Produktkacheln im Dark Mode eine **Linen-Karte** (`#e6e1d8`, Bild mit `filter: none`, nie invertieren oder abdunkeln). Raumbilder laufen randlos. Logo und Marken-Logos als SVG mit `currentColor`.
- Der Abendmodus muss vollständig ausgearbeitet sein, sonst wird er nicht ausgeliefert. Ein halbfertiger Dark Mode schadet mehr, als er nützt.

### 2.5 Farbtreue der Produkt- und Raumfotos

| Schritt | Vorgabe |
|---|---|
| Aufnahme | RAW, X-Rite/Calibrite ColorChecker Passport im ersten Bild jeder Lichtsituation. Kamera-Profil (DCP/ICC) aus diesem Chart erzeugen |
| Weißabgleich | Per Graukarte auf neutral setzen (Showroom-Mischlicht 2.700–4.000 K). Raumstimmung kommt erst danach über ein Preset, höchstens um den Eindruck von +300 K wärmer. **Detailbilder von Bezug, Leder, Stein, Holz und Metall bleiben neutral.** |
| Farbabweichung | Material- und Musterbilder ΔE2000 ≤ 3 gegenüber dem physischen Muster unter D50 (ISO 3664 Normlicht, alternativ Tageslicht 5.000 K). Ziel ≤ 2 bei Leder und Stoff. Stichprobe 10 % je Shooting |
| Master | 16-bit ProPhoto RGB oder Display P3 TIFF im Archiv |
| Auslieferung | Export als **sRGB IEC61966-2.1 mit eingebettetem Profil**, weil Next 16/sharp sowieso nach sRGB wandelt. So ist die Konvertierung deterministisch und kontrolliert, statt der Automatik überlassen. Herstellerbilder in CMYK oder Adobe RGB vor dem Upload einmal sauber nach sRGB wandeln |
| P3 (optional) | Nur für 3 bis 5 Hero-Bilder mit Messing oder Kupfer: AVIF/JPEG in P3 mit Profil, ausgeliefert über `<picture>` mit `media="(color-gamut: p3)"` und `unoptimized`. Vorher LCP-Kosten messen (Ziel LCP ≤ 2,5 s, `digital/13`) |
| Bildschirm | Retusche-Monitor kalibriert auf D65, 120 cd/m², Gamma 2,2. Abnahme zusätzlich auf einem iPhone (P3) und einem Standard-Office-Display (sRGB) |
| Konsistenz | Ein gemeinsamer Look (LUT oder Preset) für alle eigenen Fotos: Schwarzpunkt weich, Lichter ≤ 96 % L, Sättigung −5 bis −10, kein HDR-Look (vgl. `digital/12`, Z. 240). Bildplatzhalter in Dominanzfarbe (`digital/02`, F7) |
| Kennzeichnung | Bei jedem Bezugsmuster der Hinweis „Farbwiedergabe am Bildschirm unverbindlich, Originalmuster im Showroom oder kostenlos per Post“ (UWG-Absicherung und Anlass für eine Anfrage) |

### 2.6 Saisonfarben

Saisonfarben erscheinen nur in Kampagnenmodulen (Startseiten-Band, Newsletter, Landingpage), insgesamt höchstens 5 % der Fläche. Die Saison zeigt sich **vor allem in der Bildsprache** (Licht, Pflanzen, Textilien), weniger in der UI.

| Saison | Name | Fläche | Text darauf | Kontrast | Dark-Variante |
|---|---|---|---|---|---|
| März–Mai | Pfänder-Moos (Frühling, Neuheiten vom Salone) | `#4f6b68` | Paper | 5,45:1 | `#8fb3a2` (7,94:1 auf `#161513`) |
| Juni–Aug | Seeblau (Outdoor: Tuuci, Umbrosa, Paola Lenti) | `#5b7f8c` | Paper | **4,07:1, nur große Schrift ≥ 24 px** oder als Hintergrund für Bilder | `#8fb0bb` (7,90:1) |
| Sep–Nov | Torkel-Rost (Herbst, Leder, Wolle) | `#8c4f2e` | Paper | 6,05:1 | `#c98a63` (6,34:1) |
| Dez–Feb | Tanne (Advent, Firmengeschenke, Adventsabend) | `#2f4a3f` | Paper / Messing `#d1b250` | 9,11:1 / 4,69:1 | Fläche bleibt, Text Stone |

Wechsel per CSS-Variable `--season` in `layout.js`, nach Datum (Zeitzone Europe/Vienna). Der Wechsel ist sanft und nicht mit Countdowns oder Druck verbunden.

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

1. **„Farbe, die stimmt“ als Versprechen.** Jedes Material- und Bezugsbild ist gegen das Originalmuster gemessen (ΔE ≤ 3), mit dem Vermerk „farbgeprüft im Showroom Lochau“. Dazu kostenlose Originalmuster per Post nach AT, DE, CH und FL. Keiner der Wettbewerber (Höttges, reiter, Fretz, Gamma) bietet das nach meiner Kenntnis an [nicht verifiziert]. Es ist ein Vertrauensargument, kein Dekor, und erzeugt nebenbei Leads.
2. **Materialbibliothek mit OKLCH-Farbfamilien.** Der Filter „Farbe“ in der Kategorie arbeitet mit 10 Farbfamilien, die aus OKLCH-Werten der Bezüge berechnet sind (Greige, Sand, Cognac, Salbei …), statt mit „Grau, Braun, Blau“. Dazu „passt zu“-Vorschläge über OKLCH-Abstände, z. B. ΔH ≤ 20° für eine Ton-in-Ton-Kombination.
3. **Seelicht-Grading.** Der Hero zeigt dasselbe Showroom-Motiv in vier echt fotografierten Lichtstimmungen (Morgen 5.600 K, Mittag, Abend 3.200 K, Nacht mit Leuchten von Flos). Welche erscheint, hängt von der Ortszeit in Lochau ab. Es ist ein statisches Bild, gewechselt wird nur beim Laden, ohne Animation. Das zeigt den Ort und den Gastgeber, kostet keine Ladezeit und bleibt unter Reduced Motion unverändert.
4. **Abendmodus mit Lichtkasten-Karten.** Ein durchgestalteter Dark Mode mit warmem Nachtgrau und Messing wirkt wie der Showroom am langen Donnerstag. Das hat kein regionaler Wettbewerber.
5. **Messing statt Gold als Markenmaterial.** Die Farbe wird als Material erzählt: Rimadesio-Profile, Flos-Leuchten, die Messingtafel am Eingang. Im Logo kann Messing auf Dunkel mit einem P3-Ton erscheinen, der auf Apple-Geräten metallischer wirkt als jedes sRGB-Gold der Konkurrenz.
6. **Saisonwelt aus dem Dreiländereck.** Pfänder-Moos, Seeblau, Torkel-Rost und Tanne sind Namen, die nur hier funktionieren. Sie ziehen sich durch Newsletter, Café-Karte und Schaufenster und machen den Auftritt über alle Kanäle hinweg wiedererkennbar.

---

## 4. Was man auf keinen Fall tun darf

- `#d1b250` (oder jedes Gold mit L > 60 %) als Text, Rahmen oder Fokusring auf hellem Grund verwenden (≤ 2,06:1, Verstoß gegen SC 1.4.3/1.4.11).
- Weißen Text auf Gold setzen (2,06:1).
- Gold-Verläufe, Glanzeffekte oder „Luxus-Goldfolie“ als Textur einsetzen. Das wirkt billig und konkurriert mit den Produkten.
- Gesättigte UI-Farben (OKLCH-Chroma > 0,10 bei Flächen > 2 %) neben Produktbildern. Sie verschieben den Größen- und Farbeindruck (Hagtvedt & Brasel 2017).
- Die Farbe als einziges Unterscheidungsmerkmal nutzen (Fehler, Pflichtfeld, Verfügbarkeit). Verstoß gegen SC 1.4.1.
- Rote oder orange Knappheits- und Countdown-Signale („Nur noch 2!“, tickende Uhren). Das sind Dark Patterns (DSA Art. 25, UGP-Richtlinie Anhang I Nr. 7) und schaden der Marke.
- Den Cookie-Banner farblich manipulieren: „Ablehnen“ muss **gleich prominent** sein wie „Akzeptieren“, also dieselbe Größe, dasselbe Gewicht und gleicher Kontrast (beide Ink-Rahmen oder beide Ink-Fläche) (`digital/14`, Z. 293).
- Produktfotos „schöner“ graden als das Original (mehr Sättigung, wärmere Bezüge). Das ist irreführend nach UWG und führt zu Reklamationen.
- Herstellerbilder farblich verändern. Minotti und andere untersagen Veränderungen in ihren Bildbedingungen (`digital/01`, Z. 208).
- Reines Schwarz `#000` oder reines Weiß `#fff` als großflächige Paarung, auch nicht im Dark Mode.
- Den Dark Mode über `filter: invert()` oder einen automatischen Browser-Dark-Mode umsetzen. Immer `color-scheme` setzen und eigene Tokens nutzen.
- Hex-Literale in Komponenten schreiben. Nur Tokens verwenden.

---

## 5. Prüf-Checkliste für die drei Prototypen (`galerie`, `buehne`, `dreilaendereck`)

Skala je Kriterium: **0** = nicht erfüllt · **1** = teilweise · **2** = erfüllt · **3** = vorbildlich. Pflichtkriterien (P) zählen doppelt.

| # | Kriterium | Prüfmethode | P |
|---|---|---|---|
| 1 | Fließtext ≥ 4,5:1, Ziel ≥ 7:1 auf allen Flächen | axe DevTools, WebAIM-Prüfer, Stichprobe 10 Textstellen | P |
| 2 | Kein `#d1b250` oder vergleichbar helles Gold als Text oder Linie auf Hell | `grep -E "d1b250\|gold\]" src/app/[locale]/preview` plus Sichtprüfung | P |
| 3 | Fokusring auf hellen **und** dunklen Abschnitten ≥ 3:1 und mindestens 2 px | per Tab durchgehen | P |
| 4 | Bedienelemente (Feldrahmen, Checkbox, Slider-Pfeile) ≥ 3:1 | Messen gegen den Hintergrund | P |
| 5 | Farbe nie als einziges Signal (Fehler, Status, aktiver Filter) | Graustufen-Ansicht (DevTools Rendering → achromatopsia) | P |
| 6 | Flächenanteile: ≥ 85 % neutral, ≤ 1 dunkle Fläche, Messing ≤ 2 % | Screenshot der ganzen Seite, Farbanalyse (z. B. Photoshop-Histogramm/ImageMagick) | |
| 7 | Nur Tokens, keine Hex-Literale im Prototyp-Code | `grep -cE "#[0-9a-fA-F]{6}"` in den Komponenten | |
| 8 | Produktbilder ohne Farbverfälschung (kein Overlay, keine Filter, kein `mix-blend` auf Produkten) | Code und Sichtprüfung gegen das Original | P |
| 9 | Weißabgleich und Look der eigenen Fotos einheitlich (Graupunkt neutral, keine Mischstiche) | Pipette auf einer Neutralfläche: a\*, b\* in Lab innerhalb ±3 | |
| 10 | Messing wirkt als Material: an wenigen, festen Orten, auf Dunkel brillant | Sichtprüfung durch zwei Personen | |
| 11 | Dark Mode: vorhanden **und** vollständig (alle Flächen, Formulare, Bilder, Logos) oder bewusst weggelassen und `color-scheme: light` gesetzt | OS auf Dunkel stellen | P |
| 12 | Dark Mode: kein reines Schwarz und Weiß, Akzente entsättigt, Produktkarten nicht als „Leuchtkasten“ | Sichtprüfung, Kontrast messen | |
| 13 | Saisonfarbe nur im Modul, Kontrast eingehalten, kein Druckelement | Datum simulieren (`?season=`), messen | |
| 14 | Keine farblich manipulierten Entscheidungen (Cookie-Banner, Newsletter-Ablehnen gleich prominent) | Sichtprüfung, Kontrastvergleich beider Knöpfe | P |
| 15 | P3-Darstellung: auf dem iPhone kein Farbsprung zwischen CSS-Messing und Messing im Bild, keine Banding-Verläufe | iPhone und sRGB-Monitor nebeneinander | |
| 16 | Markenwirkung: ruhig, hochwertig, regional verankert, unterscheidet sich klar von Höttges, reiter, Fretz und Gamma (Blindtest: 5 Personen ordnen die Screenshots zu, Zielwort „hochwertig“ ≥ 4/5) | Kurzer 5-Sekunden-Test, Semantisches Differential mit 7 Stufen | |

**Auswertung:** Pflichtkriterien (1, 2, 3, 4, 5, 8, 11, 14) zählen doppelt. Höchstwert also 8 × 6 + 8 × 3 = **72 Punkte**. Freigabe ab **52 Punkten** (≈ 72 %) und nur, wenn kein Pflichtkriterium mit 0 bewertet ist. Bei Gleichstand entscheidet Kriterium 16.

---

### Quellen (gesammelt)

- Valdez, P. & Mehrabian, A. (1994): Effects of color on emotions. *J. Exp. Psychol.: General* 123(4), 394–409. https://pubmed.ncbi.nlm.nih.gov/7996122/
- Wilms, L. & Oberfeld, D. (2018): Color and emotion: effects of hue, saturation, and brightness. *Psychological Research* 82, 896–914. https://doi.org/10.1007/s00426-017-0880-8
- Labrecque, L. I. & Milne, G. R. (2012): Exciting red and competent blue. *J. Acad. Mark. Sci.* 40, 711–727. https://doi.org/10.1007/s11747-010-0245-y
- Labrecque, L. I., Patrick, V. M. & Milne, G. R. (2013): The marketers' prismatic palette. *Psychology & Marketing* 30(2), 187–202. https://doi.org/10.1002/mar.20597
- Hagtvedt, H. & Brasel, S. A. (2017): Color saturation increases perceived product size. *J. Consumer Research* 44(2), 396–413. https://doi.org/10.1093/jcr/ucx039
- Elliot, A. J. & Maier, M. A. (2014): Color psychology. *Annual Review of Psychology* 65, 95–120. https://doi.org/10.1146/annurev-psych-010213-115035
- W3C (2023): WCAG 2.2, SC 1.4.1, 1.4.3, 1.4.6, 1.4.11, 2.4.11, 2.4.13. https://www.w3.org/TR/WCAG22/
- W3C: CSS Color Module Level 4 (oklch, display-p3, color-gamut). https://www.w3.org/TR/css-color-4/
- WebKit: Wide Gamut Color in CSS with Display-P3. https://webkit.org/blog/10042/wide-gamut-color-in-css-with-display-p3/
- Material Design: Dark theme. https://m2.material.io/design/color/dark-theme.html
- sharp: Output options (sRGB-Standard, keepIccProfile). https://sharp.pixelplumbing.com/api-output
- ISO 3664:2009: Viewing conditions – Graphic technology and photography (D50).
- Ottosson, B. (2020): A perceptual color space for image processing (OKLab). https://bottosson.github.io/posts/oklab/
- EU 2019/882 (European Accessibility Act), umgesetzt im BaFG (AT) und BFSG (DE), anwendbar ab 28.06.2025. DSA (EU 2022/2065) Art. 25. UGP-Richtlinie 2005/29/EG Anhang I.
