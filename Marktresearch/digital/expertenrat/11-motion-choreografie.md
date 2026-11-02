# 11 – Motion-Choreografie: Partitur für den Neuauftritt

**Stand:** 26.10.2026 · Rolle: Animationsexperte und Motion-Choreograf
**Ergänzt** `digital/02` (Techniken, Bibliotheken, Features F1–F10, Tokens) und `expertenrat/07` (Motion-Tokens 2.6). Was dort steht, wird hier nicht wiederholt. Dieses Papier legt fest, **wann was in welcher Reihenfolge, wie lange und mit welchem Gewicht** sich bewegt: die Partitur über die ganze Seite.
**Grundlage:** `digital/01, 02, 12, 13, 14`, `23-masterkonzept.md` Abschn. 4 (Positionierung „Haus für italienisches Wohnen am Bodensee … Café, nicht Lager“), Next.js 16.3.4-Doku `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`, installierte Pakete `motion` 12.43.0 und `lenis` 1.3.27, Code-Lektüre der Prototypen unter `src/components/Preview/{galerie,buehne}` und `src/app/[locale]/preview/*` (Abruf 26.10.2026: `/de/preview/galerie` liefert HTTP 200, `buehne` und `dreilaendereck` noch 404, weil die Seiten im Bau sind).

**Leitbild in einem Satz:** Die Seite bewegt sich wie ein Gastgeber, der Ihnen die Tür aufhält: ein ruhiger Auftakt, danach führt sie Sie, ohne zu drängen, und jede Ihrer Handlungen bekommt sofort eine leise Antwort.

---

## 1. Die wichtigsten Erkenntnisse für dieses Projekt

| # | Erkenntnis | Folge für Platzhirsch | Quelle |
|---|---|---|---|
| E1 | **Die meisten UI-Animationen gehören in 100–400 ms.** Einfache Rückmeldung ≈ 100 ms, große Zustandswechsel 200–300 ms, 400 ms nur für sehr große Wege. Ab 500 ms wirkt es zäh. Eintritte dürfen etwas länger dauern als Austritte (z. B. 300 ms rein, 200–250 ms raus). „Animationen sind viel häufiger zu lang als zu kurz.“ | Rückmeldungen (Hover, Fokus, Herz, Knopf) bleiben unter 200 ms. Länger (600–1600 ms) dauert nur **Atmosphäre**, die niemanden warten lässt: Bild-Drift, Scroll-Reveals, der Hero-Auftakt. Diese Trennung ist der Kern der Partitur (Abschn. 2.1). | NN/g, *Executing UX Animations: Duration and Motion Characteristics* (nngroup.com/articles/animation-duration) |
| E2 | **Je häufiger eine Animation vorkommt, desto kürzer und leiser muss sie sein.** Hover-Vorschauen brauchen eine kleine Verzögerung, damit beim Überfahren nicht alles aufblitzt. | Katalog mit 1.765 Produkten: Karten-Hover wird hunderte Male gesehen, also nur 1 Effekt pro Karte und 80 ms Hover-Intent-Verzögerung beim Zweitbild. Der Hero-Auftakt läuft nur einmal pro Sitzung. | NN/g (wie E1) |
| E3 | **Animation hilft nur, wenn sie eine Veränderung abbildet, die der Nutzer sonst selbst rekonstruieren müsste** (Kongruenz- und Erfassbarkeitsprinzip). Dekorative Animation bringt keinen Verständnisgewinn. | Bewegung bekommt eine Aufgabe: Herkunft zeigen (Karte → Produktseite), Ziel zeigen (Produkt → Auswahl-Zähler), Reihenfolge zeigen (Ablauf in Kapiteln). Bewegung ohne Aufgabe wird gestrichen. | Tversky, Morrison & Bétrancourt (2002): *Animation: can it facilitate?*, Int. J. Human-Computer Studies 57, 247–262 |
| E4 | **Objekt-Kontinuität:** Wenn sich ein Objekt sichtbar vom alten an den neuen Ort bewegt, statt hart zu wechseln, verlieren Nutzer seltener die Orientierung. **Staging** (mehrere Teilschritte nacheinander statt gleichzeitig) verbessert die Wahrnehmung. | Shared-Element-Morph Katalog → Produkt und Markenindex → Markenseite. Auf jeder Seite bewegt sich zur selben Zeit nur **eine** Hauptsache, die Nebenbewegungen folgen gestaffelt (Abschn. 2.2). | Chang & Ungar (1993): *Animation: From Cartoons to the User Interface*, UIST; Heer & Robertson (2007): *Animated Transitions in Statistical Data Graphics*, IEEE TVCG 13(6) |
| E5 | **Antwortzeiten:** Bis ca. 0,1 s wirkt eine Reaktion unmittelbar, bis 1 s bleibt der Gedankenfluss erhalten. Unter ca. 400 ms bleiben Nutzer produktiv bei der Sache („Doherty-Schwelle“). | Jede Eingabe zeigt innerhalb von **≤ 100 ms** eine sichtbare Reaktion (Pressed-State). Ein Seitenübergang dauert höchstens 450 ms. Spinner erscheinen erst nach 300 ms Wartezeit, damit sie nicht aufflackern. | Nielsen, *Response Times: The 3 Important Limits* (nngroup.com, nach Miller 1968 / Card et al. 1991); Doherty & Thadani (1982), IBM Systems Journal |
| E6 | **Wahrgenommene Wartezeit lässt sich formen:** Fortschrittsbalken, die zum Ende hin schneller werden, wirken kürzer als lineare. | Bei längeren Vorgängen (Anfrage mit Auswahl-PDF, späterer Konfigurator) beschleunigt der Fortschritt zum Ende hin (`cubic-bezier(0.55, 0, 1, 0.45)`). Ein falscher Fortschritt ist verboten (Abschn. 4). | Harrison, Amento, Kuznetsov & Bell (2007): *Rethinking the Progress Bar*, UIST |
| E7 | **Bewegungsempfindlichkeit ist kein Randthema:** Bei ca. **35 % der Erwachsenen ab 40** fanden sich Hinweise auf eine Störung des Gleichgewichtssystems, bei den 60- bis 69-Jährigen ist der Anteil deutlich höher. Parallax, Karussell-Autoplay und Scroll-Jacking können Schwindel, Übelkeit und Migräne auslösen. | Die Kernzielgruppe (vermögende Bauherren, Zweitwohnsitz-Käufer) ist überwiegend 40+. Großflächige Bewegung wird gedeckelt (Parallax ≤ 6 %, kein Zoom über 1,08 beim Scrollen, keine seitlichen Slides als Seitenübergang). WCAG 2.3.3 gilt als Pflicht, auch wenn es AAA ist. | Agrawal et al. (2009), *Arch. Intern. Med.* 169(10):938–944; NN/g (wie E1); W3C *Understanding SC 2.3.3 Animation from Interactions* |
| E8 | **Flüssig bleibt nur, was der Compositor allein rechnen kann.** `transform` und `opacity` laufen ohne Layout und Paint. Layout-Eigenschaften (Breite, Höhe, top/left) und Paint-Eigenschaften (Schatten, Farbe auf großen Flächen) kosten Frames. Pro Frame bleiben 16,7 ms bei 60 Hz und **8,3 ms bei 120 Hz** (iPhone Pro und iPad Pro mit ProMotion; die Schweizer Zielgruppe nutzt viele iPhones, siehe `02`). | Animiert werden nur `transform` und `opacity`. `clip-path` ist nur für Bild-Reveals erlaubt, auf höchstens 2 Elementen gleichzeitig. Schatten und Farben werden über die Deckkraft eines Pseudo-Elements überblendet, nicht direkt animiert. | web.dev, *How to create high-performance CSS animations* (web.dev/articles/animations-guide) |
| E9 | **Native Seitenübergänge sind jetzt browserübergreifend:** Same-Document View Transitions sind seit Firefox 144 (Okt. 2025) „Baseline newly available“, inkl. `view-transition-class` und `match-element`. React/Next 16 nutzen sie über `<ViewTransition>`. Die Next-Doku empfiehlt asymmetrische Zeiten (Austritt 150 ms, Eintritt 210 ms, Bewegung 400 ms) und einen Blur gegen Interpolationsartefakte. | Seitenübergänge sind das sichtbarste Premium-Signal und kosten 0 kB. Die Werte der Doku übernehmen wir als Basis und verfeinern sie je Routenpaar (Abschn. 2.4). | web.dev (16.10.2025): *Same-document view transitions are now Baseline Newly available*; Next-Doku `view-transitions.md` Z. 116–216 |
| E10 | **CSS Scroll-Driven Animations:** Chrome/Edge ab 115, Safari ab 26. In Firefox stabil laut Sekundärquellen weiterhin hinter einem Flag (Stand Juni 2026, [nicht offiziell verifiziert]). | Alle Scroll-Effekte werden als `@supports (animation-timeline: view())` aufgesetzt. In Firefox ist die Seite dann statisch und vollständig. Deshalb darf **kein Inhalt** von einer Scroll-Timeline abhängen. | developer.chrome.com, *Scroll-driven animations*; drweb.de, *CSS-Scroll-Animationen ohne JavaScript* |

---

## 2. Konkrete Vorgaben für den Neuauftritt

### 2.1 Zwei Zeitklassen und die Ergänzungs-Tokens

Die Tokens aus `02` und `07` (`--ease-quiet`, `--ease-quiet-inout`, `--duration-micro/ui/enter/morph/exit/slow`) bleiben. Neu sind **fünf Ergänzungen**, die für die Choreografie fehlen:

```css
@theme {
  /* Austritte: schnell weg, ohne Nachlauf */
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
  /* Atmosphäre (Bild-Drift, Ken Burns): weicher Start, sehr langes Ausrollen */
  --ease-drift: cubic-bezier(0.33, 0, 0.2, 1);
  /* Einzige erlaubte Mini-Federung, nur Merkliste-Herz und Zähler */
  --ease-pop: cubic-bezier(0.34, 1.4, 0.64, 1);
  /* Staffelung */
  --stagger-step: 60ms;      /* Abstand zwischen Elementen einer Gruppe */
  --stagger-max: 240ms;      /* Obergrenze für die ganze Gruppe (max. 5 Elemente) */
  --hover-intent: 80ms;      /* Verzögerung, bevor ein Zweitbild einblendet */
  --spinner-delay: 300ms;    /* Spinner erst nach dieser Wartezeit */
  --spinner-min: 600ms;      /* wenn er erscheint, mindestens so lange stehen lassen */
}
```

| Zeitklasse | Wofür | Dauer | Kurve | Regel |
|---|---|---|---|---|
| **Antwort** (blockiert den Nutzer gefühlt) | Hover-Farbe, Fokus, Pressed, Menü auf/zu, Filterchip, Herz | 80–280 ms | `--ease-quiet` rein, `--ease-exit` raus | Sichtbare Reaktion ≤ 100 ms nach Eingabe. Niemals länger als 280 ms. |
| **Atmosphäre** (läuft neben dem Nutzer her) | Hero-Drift, Bild-Settle beim Scrollen, Bild-Hover-Zoom | 600–2400 ms | `--ease-drift` oder `linear` auf Scroll-Timeline | Darf langsam sein, darf aber nie eine Handlung verzögern, nie den Klickbereich verschieben und nie Text verdecken. |

**Begründung:** Der Prototyp `galerie` nutzt für Bild-Hover 1200 ms (`.roomLink img`, `.card img`) und `buehne` für Hero-Text 1100 ms. Als Atmosphäre ist das in Ordnung. Die **Rückmeldung** auf dieselbe Geste (Unterstreichung, Pfeil, Farbe) muss aber parallel in ≤ 280 ms kommen, sonst wirkt die Seite träge (E1, E5).

### 2.2 Hierarchie der Bewegung (vier Ebenen)

| Ebene | Was | Beispiele | Max. Weg | Gleichzeitig im Viewport |
|---|---|---|---|---|
| **B1 Raum** | Seitenwechsel, Hero-Auftakt, Lightbox öffnen | Morph Karte → Produktbild | ganzer Viewport | **genau 1** |
| **B2 Kapitel** | Abschnitt betritt die Bühne | Bild-Maske öffnet, Story-Bild wechselt | 8–14 % Maske, Scale 1,06 → 1 | **max. 1** (B2 startet nicht, solange B1 läuft) |
| **B3 Element** | Text, Karten, Fakten in einem Kapitel | Titelzeilen, 4 Raumkacheln | 12–32 px | max. 5, gestaffelt mit 60 ms |
| **B4 Rückmeldung** | Antwort auf Eingabe | Herz, Unterstreichung, Knopf | 2–4 px oder nur Farbe/Deckkraft | beliebig (jeweils nur 1 pro Eingabe) |

**Regeln:**
1. **Eine Hauptsache pro Moment.** Bewegen sich zwei Ebenen gleichzeitig, wird die untere um mindestens 120 ms versetzt (Staging, E4).
2. **Gewicht folgt der Größe.** Große Flächen bewegen sich langsamer und kürzer, kleine schneller. Ein Vollbildbild wird nie mehr als 1,08 skaliert, ein Icon darf 4 px wandern.
3. **Richtung hat Bedeutung:** nach oben = Ankunft/Neues, nach rechts = vorwärts in der Hierarchie, nach links = zurück. Keine Richtung ohne Bedeutung, also auch kein Hereinfliegen von der Seite als Deko.
4. **Text bewegt sich weniger als Bild.** Text maximal 24 px (bzw. 0,4 em bei Display-Schrift), Bilder dürfen maskiert werden, Text nur zeilenweise.

### 2.3 Partitur Seitenaufbau (Startseite, Erstbesuch)

Zeit 0 = erster Paint. Alle Werte sind CSS-Animationen ohne JS (laufen auch vor der Hydration).

| t (ms) | Element | Bewegung | Dauer | Kurve |
|---|---|---|---|---|
| 0 | Hero-Bild (LCP) | **sofort voll deckend**, nur `scale(1.04) → 1` (Desktop). Auf dem Handy keine Bewegung (Render-Delay, `13`). | 1600 | `--ease-drift` |
| 0 | Header, Logo, Termin-Knopf | **keine** Eintrittsanimation. Navigation ist ab Frame 1 bedienbar. | – | – |
| 80 | Overline „LOCHAU · BODENSEE“ | `opacity 0 → 1`, `translateY(8px) → 0` | 500 | `--ease-quiet` |
| 140 | H1 Zeile 1 | `translateY(0.35em) → 0`, Zeilenmaske (siehe 2.6). Mit **Prüfpunkt LCP**, s. u. | 700 | `--ease-quiet` |
| 200 | H1 Zeile 2 | wie Zeile 1 | 700 | `--ease-quiet` |
| 320 | Lead-Satz | `opacity 0.4 → 1`, `translateY(12px) → 0` | 600 | `--ease-quiet` |
| 400 | Primär-CTA „Termin im Showroom“ + Textlink | `opacity 0.4 → 1`, `translateY(8px) → 0`. Klickbar ab 0 ms (kein `pointer-events: none`). | 500 | `--ease-quiet` |
| ≈ 1000 | **Auftakt abgeschlossen** | Grenze: alles Lesbare steht nach **≤ 1100 ms** still. | | |
| 2400 | Scroll-Hinweis (Linie) | einmal `scaleY 0 → 1`, danach stehend. Stoppt beim ersten Scroll. Höchstens 2 Durchläufe. | 1200 | `--ease-quiet` |

- **Wiederkehrer:** Bei weiteren Seitenaufrufen in derselben Sitzung entfällt die Text-Staffelung. Ein Server-Attribut ist nicht nötig: Die Partitur läuft nur bei harter Navigation (Erstaufruf). Client-Navigationen bekommen stattdessen den Seitenübergang (2.4).
- **LCP-Regel:** LCP-Kandidaten sind auf Desktop das Hero-Bild und auf dem Handy oft die H1. Sie starten **nie** mit `opacity: 0` und sind nie vollständig maskiert. Der Prototyp `galerie` (`galLine`: `clip-path: inset(0 0 100% 0)`) und `buehne` (`rise`: dasselbe) verstecken die H1 im ersten Frame vollständig. Mit Lighthouse auf dem Handy prüfen, ob das LCP dadurch auf das Ende der Animation rutscht. Falls ja, Maske auf `inset(0 0 35% 0)` als Startwert begrenzen oder auf dem Handy nur `translateY` verwenden.
- **Unterseiten** (Marke, Produkt, Stadt): Auftakt verkürzt auf Overline (0 ms) → H1 (80 ms) → Rest (160 ms), jeweils 500 ms. Ende ≤ 700 ms.

### 2.4 Seitenübergänge (View Transitions) je Routenpaar

Basis aus der Next-Doku: Austritt 150 ms, Eintritt 210 ms (startet nach dem Austritt), Bewegung 400 ms. Header verankert (`viewTransitionName: 'site-header'`), `::view-transition { pointer-events: none; }`. **Obergrenze aller Übergänge: 450 ms.**

| Von → Nach | Art | Werte | Hinweis |
|---|---|---|---|
| **Katalog/Kategorie → Produkt** | Shared-Element-Morph Kartenbild → Hauptbild der Galerie | 400 ms `--ease-quiet-inout`, Keyframe `filter: blur(0) → blur(3px) @ 50 % → blur(0)`. Übriger Inhalt: Austritt 150 ms `opacity`, Eintritt 210 ms + `translateY(8px)`. | Nur mit Prefetch. Fällt die Seite in ein Suspense-Fallback, gibt es keinen Morph (Doku Z. 112). |
| **Produkt → zurück zum Katalog** | Morph rückwärts, Liste kommt `translateY(-8px) → 0` | wie oben, `nav-back` | Scroll-Position der Liste bleibt nativ erhalten. |
| **Markenindex → Markenseite** | **Typografischer Morph:** der Bodoni-Name aus der Liste wird zur H1 | 420 ms `--ease-quiet-inout`, `name="brand-<slug>"` auf dem Namen (nicht dem Logo) | Zeigt „Marke als Haltung“ statt Logowand und ist kein Händler-Siegel. |
| **Journal-Liste → Artikel** | Morph Titelbild | 400 ms | Text kommt 120 ms später (Staging). |
| **Projektkachel → Projekt** | Morph Titelbild + Fakten-Zeile blendet 60 ms gestaffelt ein | 400 ms + 4 × 60 ms | |
| **Alle übrigen Navigationen** | Crossfade mit kleiner Hebung | Austritt 150 ms `--ease-exit` `opacity 1 → 0`; Eintritt 210 ms `opacity` + 300 ms `translateY(8px) → 0` `--ease-quiet` | **Keine** seitlichen Slides (E7). |
| **Sprachwechsel DE/EN/FR/IT** | **keine** Animation | 0 ms | Gleicher Inhalt in anderer Sprache. Eine Bewegung würde „neue Seite“ vortäuschen. |
| **Filter im Katalog** (gleiche Route) | Karten ordnen sich um (`view-transition-name: match-element`, `view-transition-class: card`) | 300 ms `--ease-quiet-inout`; neue Karten `opacity` 200 ms | Ab > 24 sichtbaren Karten keinen Umordnungs-Morph mehr, sondern Crossfade (Kosten für Snapshots). |
| **Anfrage-Schritte** (Auswahl → Kontakt → Bestätigung) | `<ViewTransition key={step}>`, Inhalt `translateX(16px)` vorwärts / `-16px` zurück | 280 ms | Hier ist eine seitliche Richtung erlaubt, weil der Weg nur 16 px beträgt und eine Bedeutung hat (Schritt vor/zurück). |
| **Thumbnail → Lightbox** | Morph Bild → Vollbild, Hintergrund `opacity 0 → 0.96` | 350 ms öffnen, 220 ms schließen | Schließen per Wisch: Bild folgt dem Finger 1:1 (`motion` `drag="y"`), ab 120 px oder 0,5 px/ms Geschwindigkeit schließen, sonst in 200 ms zurückfedern. |
| **Produkt → Auswahl (Merkliste)** | **„Ins Haus legen“:** Miniatur fliegt in den Header-Zähler | 450 ms `--ease-quiet-inout`, Zähler danach Pop 1 → 1,12 → 1 in 240 ms `--ease-pop` | `document.startViewTransition` mit temporärem `view-transition-name` auf Bild und Zähler. Fallback ohne Unterstützung: nur Zähler-Pop. |

**Reduced Motion** (Rezept aus der Doku): `::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation-duration: 0s; }`. Ausnahme: Seiten-Crossfade 120 ms `opacity` bleibt erlaubt (Orientierung ohne Bewegung).

### 2.5 Scroll-Choreografie

| Baustein | Timeline | Range | Bewegung | Grenzwerte |
|---|---|---|---|---|
| Text-Reveal (B3) | `view()` | `entry 10% entry 60%` | `translateY(24px) → 0` | **Kein** `opacity` unter 0,6 (Kontrast-Audits, Inhalt sichtbar). |
| Bild-Reveal (B2) | `view()` | `entry 0% cover 30%` | `clip-path: inset(10% 0 0 0) → inset(0)` + Bild `scale(1.06) → 1` | Maske max. 14 % (der Prototyp `galerie` nutzt 18 %, `buehne` 14 %/8 %; **≤ 14 %** reicht und lässt das Motiv früher erkennen). Scale max. 1,08 (`buehne` `maskZoom` 1,15 ist zu groß, E7). |
| Parallax (nur Vollbreiten-Bänder) | `view()` | `cover 0% cover 100%` | `translateY(-4%) → 4%` bei `scale(1.08)` | Max. **±6 %** Weg, max. 1 Parallax-Element pro Viewport, nie auf Text. (`buehne` `parallaxY`: ±6 % bei Scale 1,14, auf 1,08 senken.) |
| Hero-Ausgang | `view()` auf dem Hero | `exit 0% exit 100%` | Bild `translateY(0 → 8%)`; Text-Deckkraft nicht unter 0,4 | Nur Desktop, `motion-safe`. |
| Header beim Scrollen | `scroll(root)` | `0 120px` | Hintergrund-Ebene (`::before`) `opacity 0 → 1`, Haarlinie `opacity 0 → 1` | **Keine** Höhenänderung (Layout). Der Header bleibt sichtbar und wird nicht ausgeblendet (Termin-Knopf). |
| Story-Kapitel (sticky, F6 in `02`) | `view-timeline` je Textschritt | `contain 0% contain 100%` | Bildwechsel per `opacity` 0 → 1 innerhalb der mittleren 20 % des Schritts | Crossfade-Zone 20 %, kein Bild „springt“. 3–5 Schritte, nie mehr. |
| Lesefortschritt (Journal) | `scroll(root)` | ganze Seite | `scaleX(0 → 1)`, 1 px Goldlinie | `aria-hidden`. |

**Stagger auf Scroll:** Gruppen (z. B. 4 Raumkacheln) bekommen dieselbe Range, aber `animation-delay` ist auf Scroll-Timelines wirkungslos. Gestaffelt wird über versetzte Ranges: Kachel n startet bei `entry calc(10% + n * 6%)`.

**Lenis:** Der Prototyp `buehne` lädt Lenis (`lerp: 0.11`) nur bei feinem Zeiger, nicht bei Reduced Motion und erst nach `requestIdleCallback`. Das ist die sauberste mögliche Variante. Für die Produktion gilt trotzdem die Entscheidung aus `02`/`07`: **natives Scrollen**. Lenis kommt nur in Frage, wenn ein A/B-Test über ≥ 2 Wochen zeigt, dass (a) die INP-p75 auf Desktop ≤ 150 ms bleibt, (b) Anker, Tastatur (Leertaste, Bild ab) und `position: sticky` fehlerfrei funktionieren und (c) die Termin-Klickrate nicht sinkt. Ohne diesen Beleg wird Lenis nicht eingesetzt, denn Lenis lässt die Seite „nachlaufen“, und das widerspricht dem Gefühl „ruhig und präzise“.

### 2.6 Bild-Reveals, Text- und Zahlen-Animation

**Bild laden (kein Weißblitz):**
- Platzhalter = Dominanzfarbe bzw. `--color-linen` (`02` F7). Unterhalb der Falz blendet das fertige Bild in **240 ms** `opacity` ein (Klasse nach `onLoad`, nur für Bilder, die beim Paint noch nicht geladen waren). Das LCP-Bild bekommt nie ein Fade-in.
- **Keine Shimmer-Skelette.** Endlos laufende Glanzstreifen sind Bewegung ohne Aufgabe und wirken nach Software statt nach Atelier. Eine stehende Farbfläche reicht.

**Headline-Masken:**
- Zeilenweise, Zeilen im Markup gesetzt (`<span class="line">`), keine Zerlegung in Wörter oder Buchstaben (Screenreader, 4 Sprachen, Silbentrennung; siehe `02` F7).
- Werte: `translateY(0.35em) → 0`, Maske `inset(0 0 100% 0) → inset(0 0 -0.2em 0)` (Unterlängen nicht abschneiden), 700 ms, Zeilenabstand 60 ms. Nur für Display-Schrift ≥ 40 px und höchstens **1 Headline pro Kapitel**. Fließtext wird nie maskiert.

**Zahlen:**
- Grundsatz: Zahlen sind Fakten. Sie stehen **im HTML von Anfang an mit dem Endwert** (SEO, Screenreader, kein JS nötig).
- Erlaubt ist **ein** Zahlen-Moment pro Seite, für echte, belegte Werte (z. B. Fakten-Zeile der Markenseite „Gründung 1948“, Haus-Seite „800 m²“, Lieferzeit „10–14 Wochen“). Technik: **Ziffern-Walze** (jede Ziffer ist eine Spalte 0–9, `translateY(-n × 1em)`, `overflow: clip`) mit `tabular-nums`. Das läuft nur über `transform` und ist kompositorfähig. 900 ms `cubic-bezier(0.16, 1, 0.3, 1)`, Ziffern von rechts nach links 40 ms versetzt, einmalig beim ersten Sichtkontakt.
- **Verboten:** hochzählende Preise, hochzählende Bewertungen/Sterne, hochzählende Lagerbestände oder „x Personen sehen gerade“ (Abschn. 4). Unter Reduced Motion steht die Zahl einfach da.

### 2.7 Mikro-Interaktionen (Werte je Baustein)

| Baustein | Auslöser | Bewegung | Dauer / Kurve |
|---|---|---|---|
| Textlink | Hover, `:focus-visible` | Unterstreichung `scaleX(0 → 1)` von links, `transform-origin: left`; Verlassen: `scaleX → 0` nach rechts (`origin: right`) | 220 ms rein `--ease-quiet` / 160 ms raus `--ease-exit` |
| Primärknopf (Ink-Fläche) | Hover | Pseudo-Element `opacity 0 → 1` (hellerer Ink-Ton), Pfeil `translateX(4px)` | 200 ms |
| Primärknopf | `:active` | `scale(0.98)` | 80 ms rein, 160 ms raus |
| Produktkarte | Hover (nach 80 ms Intent) | Zweitbild `opacity 0 → 1`; Erstbild `scale(1 → 1.03)`; Marke/Name unverändert | Zweitbild 400 ms `--ease-quiet`; Scale 900 ms `--ease-drift` |
| Produktkarte | Verlassen | Zweitbild `opacity → 0` | 240 ms `--ease-exit` |
| Merkliste-Herz | Klick | Füllung von unten (`clip-path` auf Füll-Ebene), Herz `scale 1 → 1.12 → 1` | 240 ms `--ease-pop`; Entfernen: nur Füllung zurück, 160 ms, ohne Pop |
| Header-Zähler „Auswahl“ | Zahl ändert sich | Ziffern-Walze 1 Schritt + `scale 1 → 1.12 → 1` | 240 ms `--ease-pop`; `aria-live="polite"` |
| Mega-Menü | Hover 120 ms Intent / Klick | Panel `opacity` + `translateY(-8px → 0)`, Spalten 40 ms gestaffelt; Vorschaubild Crossfade | öffnen 280 ms, schließen 180 ms, Schließ-Verzögerung 200 ms (Maus darf kurz das Panel verlassen) |
| Mobiles Menü (Vollbild von unten) | Tippen | Overlay `translateY(100% → 0)`; Einträge 40 ms gestaffelt `translateY(16px)` | 360 ms `--ease-quiet-inout`; schließen 240 ms |
| Akkordeon (FAQ, Produktabschnitte) | Klick | Inhalt `opacity` + `translateY(-4px)`; Höhe über `interpolate-size: allow-keywords` (nur Chromium) bzw. sofort | 240 ms; Chevron `rotate(180deg)` 200 ms |
| Formularfeld | Fokus | Haarlinie unten `scaleX` 0 → 1 in Ink | 180 ms |
| Formularfehler | Absenden mit Fehler | Rahmen in Fehlerfarbe, Feld `translateX` 2 × 3 px | 240 ms gesamt, nur `motion-safe`; Fokus springt zur Fehlerzusammenfassung |
| Absenden | Klick | Pressed sofort; Spinner erst nach 300 ms, mindestens 600 ms sichtbar; dann Häkchen (SVG-Strich, 400 ms) | `role="status"` meldet das Ergebnis |
| Galerie (Embla) | Wischen | 1:1 am Finger, Ausrollen nativ; Zähler „2/6“ ohne Animation | Pfeil-Klick 400 ms `--ease-quiet-inout` |
| Bild in Lightbox | Doppeltipp / Pinch | Zoom auf 2× um den Tippunkt | 280 ms |
| Cookie-Banner | Erscheinen | `translateY(16px) → 0` + `opacity`, **nach** dem Hero-Auftakt (ab 1200 ms) | 280 ms; schließen 180 ms |

### 2.8 Reduced Motion: Übersetzungstabelle

`prefers-reduced-motion: reduce` heißt nicht „alles aus“, sondern **Bewegung durch Deckkraft ersetzen** (WCAG 2.3.3, Apple HIG Motion).

| Normal | Reduced Motion |
|---|---|
| Hero-Drift, Ken Burns, Parallax, Bild-Settle | entfällt, Bild steht |
| Text-/Bild-Reveals beim Scrollen | entfällt, Inhalt steht |
| Seiten-Morph und Slide | Crossfade 120 ms oder 0 ms |
| Merkliste-Flug | entfällt, Zähler wechselt mit 120 ms Crossfade |
| Hover-Zoom | entfällt; Zweitbild-Crossfade 150 ms bleibt |
| Menü/Lightbox | nur `opacity` 150 ms |
| Ziffern-Walze | Endwert sofort |
| Marquee, Autoplay, Video | aus (statisches Raster bzw. Poster) |
| Unterstreichung, Farbwechsel, Fokus | bleiben (≤ 150 ms) |

Zusätzlich gibt es einen **eigenen Schalter „Bewegung reduzieren“** im Footer (setzt `data-motion="reduced"` auf `<html>`, gespeichert per `localStorage` mit try/catch). Viele Nutzer kennen die Systemeinstellung nicht. Alle Regeln oben greifen bei `@media (prefers-reduced-motion: reduce)` **oder** `[data-motion="reduced"]`.

### 2.9 Performance-Budget für Bewegung

| Kennzahl | Grenze | Messung |
|---|---|---|
| Animierte Eigenschaften | nur `transform`, `opacity`; `clip-path` nur für Bild-Reveals (max. 2 gleichzeitig); `filter: blur` nur im Morph (≤ 400 ms) | DevTools → Rendering → *Paint flashing* zeigt beim Scrollen keine grünen Flächen außer Bildladen |
| Gleichzeitig laufende Animationen | ≤ 8 im Viewport | DevTools → *Animations*-Panel |
| `will-change` | nie dauerhaft im CSS; nur per `:hover`/`:focus-within` am Eltern-Element oder für die Dauer einer Animation | Suche im CSS nach `will-change` |
| Große Compositing-Layer | ≤ 3 vollflächige gleichzeitig. Ein Vollbild-Layer auf einem iPhone 15 Pro (1179 × 2556 px × 4 Byte) belegt ca. **12 MB** GPU-Speicher. | DevTools → *Layers* |
| Frame-Zeit | p95 ≤ 8,3 ms während Morph und Scroll auf einem MacBook mit 120 Hz; keine Long Animation Frames > 50 ms beim Seitenwechsel | Performance-Panel, LoAF-API |
| INP | p75 ≤ 150 ms (wie `02`) | `web-vitals` im Feld |
| CLS durch Bewegung | 0 (Transform verschiebt kein Layout) | Lighthouse |
| JS für Motion | CSS + View Transitions 0 kB; `motion` 12 nur als `LazyMotion` + `m` in Lightbox-Wisch und Bottom-Sheet, per `next/dynamic` | Bundle-Analyzer |
| Lange Seiten | Abschnitte unterhalb der Falz mit `content-visibility: auto` + `contain-intrinsic-size: auto 800px`; Karten mit `contain: layout paint` | – |
| Schatten | nie `box-shadow` animieren; Schatten liegt auf `::after` und blendet über `opacity` | Code-Review |

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

Keiner der Wettbewerber (Höttges: Elementor + Swiper; Fretz: GSAP + Lenis + AOS; Gamma: GSAP + Flickity; teo jakob: Barba-Fades; siehe `02` Abschn. 2) hat eine dieser Ideen umgesetzt.

1. **„Vom Stück zum Raum“ – der durchgehende Morph.** Katalogkarte → Produktbild → in der Lightbox → zurück. Das Bild verlässt nie den Bildschirm. Bei Fretz und Höttges ist jeder Klick ein harter Schnitt mit Ladeweiß.
2. **„Ins Haus legen“.** Ein Produkt fliegt beim Merken als kleine Miniatur in den Zähler „Ihre Auswahl“ (450 ms). Damit sieht man sofort, wohin das Stück gegangen ist (E3). Es ist das digitale Gegenstück zum Showroom-Moment „das legen wir Ihnen zur Seite“.
3. **Typografischer Marken-Morph.** Im Markenindex stehen die Namen in Bodoni. Beim Klick wird „Minotti“ zur H1 der Markenseite. Das wirkt editorial wie ein Magazin, ganz ohne Logowand und ohne Händler-Siegel.
4. **Tageslicht-Partitur für das Café.** Das Hero-Motiv „Showroom & Café“ zeigt je nach Ortszeit Lochau ein anderes eigenes Foto (Morgen, Mittag, Abendlicht, 3 Motive), Wechsel nur beim Laden, ohne Animation. Dazu „Heute bis 18:00 geöffnet“ als **stehender** Text ohne Puls. Das ist Atmosphäre, kein Druck.
5. **Maßzeichnung, die sich selbst zeichnet.** Auf der Produktseite zeichnen sich die Maßlinien der vorhandenen `dimensionDiagram`-Grafik einmal in 600 ms (SVG-Strich, kleine Fläche). Die Zahlen stehen **sofort** da. Wirkt wie ein Architektenplan und spricht die Zielgruppe Architekten direkt an.
6. **Stoff-Fächer.** Materialmuster (Bouclé, Leder, Eiche) liegen als gestapelter Fächer. Hover/Tippen fächert sie auf (`rotate` −6° bis +6°, 40 ms gestaffelt, 280 ms). Ein Tippen öffnet die Detailaufnahme per Morph. Das ist haptisch wie der Musterkoffer im Showroom.
7. **„Dreiländer-Weg“ als Scroll-Kapitel.** Auf den Stadt- und Schweiz-Seiten zeichnet sich beim Scrollen eine feine Linie von Lochau zum Zielort (z. B. St. Gallen, Vaduz, Lindau). Die Kapitel „Planung → Festpreis CHF → Verzollung → Montage“ setzen sich daran ab (`scroll()`-Timeline, `scaleX`/`stroke` auf kleinem SVG). Das macht die Alleinstellung 5 (Dreiländer-Festpreis) sichtbar statt als Bullet-Liste.
8. **Schneller als die Konkurrenz, messbar.** Die Choreografie kostet ca. 0 kB JS. Ein öffentlich sichtbarer Wert wird nicht behauptet, intern wird aber per PageSpeed/CrUX gegen hoettges.at, fretz.de und gamma.ch verglichen (`02` F9). Premium-Motion mit besserer INP als ein GSAP-Auftritt ist der eigentliche Vorsprung.
9. **Ruhe als Signal.** Der Header animiert sich nie, das Logo „atmet“ nicht, und es gibt keinen Preloader. Bei Luxusmarken wie Bottega Veneta wirkt diese Stille souverän, während viele Regionalauftritte mit AOS-Fade-ups überladen wirken.

---

## 4. Was man auf keinen Fall tun darf

**Dark Patterns über Bewegung (EU-rechtlich unzulässig und markenschädlich):**
- Keine pulsierenden oder blinkenden Hinweise wie „Nur noch 1 verfügbar“, „3 Personen sehen sich das an“, laufende Countdowns oder Ticker „gerade angefragt in Zürich“. Das sind Fake-Knappheit und Zeitdruck (UGP-Richtlinie 2005/29/EG Anh. I Nr. 7; § 2 UWG AT bzw. § 5 UWG DE; Gestaltung der Oberfläche: DSA Art. 25, siehe `14`).
- Keine Animation, die den „Ablehnen“- oder „Nur notwendige“-Knopf im Cookie-Banner schwächer oder später erscheinen lässt als „Alle akzeptieren“. Beide erscheinen gleichzeitig, gleich groß und mit gleicher Bewegung.
- Kein wackelnder, hüpfender oder pulsierender Termin-Knopf. Aufmerksamkeit entsteht durch Platzierung und Kontrast, nicht durch Zappeln.
- Kein künstlich verzögerter Fortschrittsbalken, der Aufwand vortäuscht, und keine Animation, die Kosten oder Bedingungen erst nach dem Klick aufklappt.
- Kein „Exit-Intent“-Overlay, das beim Verlassen ins Bild fliegt.

**Barrierefreiheit und Gesundheit:**
- Nichts, das mehr als 3-mal pro Sekunde blitzt (WCAG 2.3.1).
- Kein Autoplay > 5 s ohne sichtbaren Pause-Knopf (WCAG 2.2.2; betrifft Markenband, Video und Karussell).
- Kein Scroll-Jacking, kein erzwungenes Einrasten (`scroll-snap-type: y mandatory` auf der Seite), keine horizontalen Scroll-Strecken, die das vertikale Scrollen kapern.
- Keine Inhalte, die erst durch Scrollen oder JS sichtbar werden (Firefox, Crawler, Hydration-Fehler).
- Keine Maske über Fließtext, keine Buchstaben-für-Buchstaben-Animation, keine „Typewriter“-Effekte.

**Technik und Marke:**
- Keine Animation von `width`, `height`, `top`, `left`, `margin`, `box-shadow` oder `background-position` auf großen Flächen.
- Kein Custom Cursor, kein magnetischer Knopf, kein WebGL-Verzerrungseffekt, kein Preloader-Intro (siehe `02`).
- Keine Federn mit sichtbarem Überschwingen außer `--ease-pop` am Herz und Zähler (max. 1,12).
- Keine animierten Herstellerlogos, keine Logowand, die sich dreht oder „einläuft“, keine Einblendungen wie „offizieller Partner“ (nur ClassiCon ist belegt).
- Keine Hersteller-Kampagnenbilder in Ken-Burns-Zoom oder mit Masken-Zuschnitt ohne Freigabe. Veränderung ist bei Minotti untersagt (`01`, `14`). Bewegte Bild-Effekte nur auf eigenem Material.
- Keine Sonderanimation, die es nur auf einer Seite gibt (Pflege für ein 5-Personen-Team).

---

## 5. Prüf-Checkliste für die drei Prototypen

**Skala je Kriterium:** 0 = fehlt oder verstößt · 1 = schwach · 2 = solide · 3 = vorbildlich. **Gewicht** multipliziert die Punkte. Maximal **90 Punkte**. **K.-o.-Kriterien** (mit ✖ markiert) führen bei 0 Punkten zur Nachbesserungspflicht, egal wie hoch die Summe ist.

| # | Kriterium | Gewicht | Prüfmethode | 3 Punkte, wenn … |
|---|---|---|---|---|
| M1 ✖ | **Reduced Motion** wirkt vollständig (System + eigener Schalter) | 3 | DevTools → Rendering → `prefers-reduced-motion: reduce`, Seite komplett durchscrollen und navigieren | Keine Bewegung außer Crossfades ≤ 150 ms, kein Inhalt fehlt, Video/Marquee stehen |
| M2 ✖ | **Inhalt nie versteckt** (ohne JS, ohne Scroll-Timeline) | 3 | JS aus + Firefox stabil; `curl` des HTML auf Text prüfen | Alle Texte und Bilder sichtbar, LCP-Element nie `opacity: 0` oder voll maskiert |
| M3 ✖ | **Keine Dark Patterns in Bewegung** (Abschn. 4) | 3 | Sichtprüfung Cookie-Banner, CTAs, Zahlen | Nichts pulsiert, zählt Druck hoch oder versteckt Ablehnen |
| M4 | **Zeitklassen eingehalten**: Rückmeldung ≤ 280 ms, Auftakt Ende ≤ 1100 ms, Übergänge ≤ 450 ms | 2 | DevTools *Animations*-Panel, Werte im CSS | Alle Werte im Rahmen, Tokens statt Hartwerte |
| M5 | **Hierarchie / Staging**: eine Hauptsache pro Moment, Stagger ≤ 240 ms | 2 | Bildschirmaufnahme mit 0,25× abspielen | Nie zwei B1/B2-Bewegungen gleichzeitig |
| M6 | **Easing-Disziplin**: höchstens die 5 Kurven aus 2.1 + `02`, kein `linear` außer Scroll-Timelines | 1 | Suche nach `cubic-bezier`, `ease`, `linear` im CSS | Nur Token-Kurven |
| M7 | **Wege und Größen**: Scale ≤ 1,08 beim Scrollen, Parallax ≤ ±6 %, Text ≤ 24 px, Masken ≤ 14 % | 2 | CSS-Keyframes lesen | Alle Grenzen eingehalten |
| M8 | **Seitenübergänge**: Header verankert, Morph Karte → Produkt bzw. Marke, kein Slide, Sprache ohne Übergang | 3 | Chrome + Safari 26, Klickpfad Start → Kategorie → Produkt → zurück | Morph spielt mit Prefetch, `pointer-events` frei |
| M9 | **Mikro-Interaktionen**: Hover und `:focus-visible` gleichwertig, Pressed ≤ 100 ms, Touch ohne Hover-Abhängigkeit | 2 | Tastatur-Durchgang (Tab), iPhone-Test | Jede Aktion hat sichtbare, gleiche Rückmeldung per Maus, Tastatur und Touch |
| M10 | **Compositor-only**: nur `transform`/`opacity` (+ `clip-path` erlaubt begrenzt) | 3 | Paint flashing, Layers-Panel, Suche nach `will-change` | Keine Paint-Flächen beim Scrollen, `will-change` nicht dauerhaft |
| M11 | **Performance im Labor**: Lighthouse mobil LCP ≤ 2,0 s, CLS ≤ 0,05, TBT ≤ 150 ms | 3 | `lhci` / Lighthouse 12, 3 Läufe, Median | Alle drei Werte erreicht |
| M12 | **Native Scroll**: kein Scroll-Jacking; falls Lenis: nur feiner Zeiger, aus bei Reduced Motion, Anker/Tastatur/sticky intakt | 2 | Leertaste, Bild ab, Ankerlink, Trackpad, Touch | Natives Scrollen oder Lenis-Bedingungen aus 2.5 vollständig erfüllt |
| M13 | **Bildaufbau**: Farbplatzhalter, kein Weißblitz, kein Shimmer, LCP-Bild ohne Fade | 1 | Netzwerk auf „Slow 4G“ drosseln | Ruhiger Aufbau, nichts blinkt |
| M14 | **Markengefühl**: Bewegung wirkt „Gastgeber, ruhig, präzise“, nicht „Agentur-Showreel“ | 3 | 5-Sekunden-Test mit 5 Personen aus der Zielgruppe 40+: „Welche 3 Wörter beschreiben das Gefühl?“ | ≥ 4 von 5 nennen ruhig/hochwertig/einladend o. ä., niemand nennt hektisch/verspielt |
| M15 | **Aufgabe jeder Animation**: Herkunft, Ziel, Reihenfolge oder Rückmeldung erkennbar | 1 | Liste aller Animationen mit Zweck erstellen | Keine Animation ohne Zweck |

**Auswertung:** ≥ 75 Punkte = produktionsreif · 60–74 = gut, gezielt nachbessern · < 60 oder ein K.-o.-Kriterium mit 0 = Überarbeitung vor jeder Entscheidung.

**Vorbefund aus dem Code (26.10.2026, Prototypen noch im Bau, nicht abschließend bewertet):**
- `galerie`: Tokens aus `02` korrekt übernommen, Menü mit `allow-discrete`, Reduced-Motion-Gate vorhanden. **Prüfen:** H1-Zeilenmaske startet bei `inset(0 0 100% 0)` (M2/LCP), Bild-Maske 18 % (M7 → 14 %), Hero-Zoom 2400 ms (für Atmosphäre ok, auf dem Handy abschalten).
- `buehne`: alle Scroll-Effekte hinter `@supports` + `no-preference`, Lenis vorbildlich eingeschränkt (M12 erfüllbar). **Prüfen:** `maskZoom` 1,15 und `parallaxY` mit Scale 1,14 (M7, E7), `rise` versteckt die H1 im ersten Frame (M2), Text-Reveal 3 rem = 48 px (M7 → 24 px), Scroll-Hinweis mit 3 Durchläufen (ok, ≤ 3).
- `dreilaendereck`: Seite noch nicht abrufbar (404), Bewertung folgt.

---

### Quellen
- NN/g: *Executing UX Animations: Duration and Motion Characteristics* – https://www.nngroup.com/articles/animation-duration/ (abgerufen 26.10.2026)
- NN/g: *Response Times: The 3 Important Limits* – https://www.nngroup.com/articles/response-times-3-important-limits/
- Doherty, W. J. & Thadani, A. J. (1982): *The Economic Value of Rapid Response Time*, IBM Systems Journal
- Tversky, B., Morrison, J. B. & Bétrancourt, M. (2002): *Animation: can it facilitate?* Int. J. Human-Computer Studies 57, 247–262
- Chang, B.-W. & Ungar, D. (1993): *Animation: From Cartoons to the User Interface*, Proc. UIST '93
- Heer, J. & Robertson, G. (2007): *Animated Transitions in Statistical Data Graphics*, IEEE TVCG 13(6)
- Harrison, C., Amento, B., Kuznetsov, S. & Bell, R. (2007): *Rethinking the Progress Bar*, Proc. UIST '07
- Agrawal, Y. et al. (2009): *Disorders of Balance and Vestibular Function in US Adults*, Arch. Intern. Med. 169(10):938–944 – https://pmc.ncbi.nlm.nih.gov/articles/PMC4069154/ (Folgeübersicht), https://www.sciencedaily.com/releases/2009/05/090525173447.htm
- W3C: *Understanding SC 2.3.3 Animation from Interactions*, *SC 2.2.2 Pause, Stop, Hide*, *SC 2.3.1 Three Flashes* – https://www.w3.org/WAI/WCAG22/Understanding/
- web.dev: *How to create high-performance CSS animations* – https://web.dev/articles/animations-guide
- web.dev (16.10.2025): *Same-document view transitions are now Baseline Newly available* – https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available
- Chrome for Developers: *Cross-document view transitions* – https://developer.chrome.com/docs/web-platform/view-transitions/cross-document ; *Scroll-driven animations* – https://developer.chrome.com/articles/scroll-driven-animations
- drweb.de: *CSS-Scroll-Animationen ohne JavaScript* – https://www.drweb.de/css-scroll-animationen-ohne-javascript/ (Firefox-Status, Sekundärquelle)
- Material Design 3, Easing-Tokens (Emphasized Decelerate `cubic-bezier(0.05, 0.7, 0.1, 1)`, über Sekundärquelle geprüft) – zum Vergleich; Platzhirsch nutzt bewusst die ruhigere `--ease-quiet`
- Apple Human Interface Guidelines: *Motion* – https://developer.apple.com/design/human-interface-guidelines/motion
- Next.js 16.3.4 Doku lokal: `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` (Asymmetrie 150/210/400 ms, Morph-Bedingungen, Reduced-Motion-Rezept)
- Recht: Richtlinie 2005/29/EG (UGP) Anh. I; Verordnung (EU) 2022/2065 (DSA) Art. 25; vertiefend `digital/14`
