# Expertenrat 14: HTML-Semantik und Barrierefreiheit

**Rolle:** HTML- und Barrierefreiheits-Spezialist · **Stand:** 26.10.2026 · **Grundlage:** `digital/01`, `02`, `12`, `13` (Abschnitt 1.3, 3.3, F7), `14` (F10), `23-masterkonzept.md` Abschnitt 4, `expertenrat/05-farbexperte.md` (Farb-Tokens), Code der Prototypen unter `src/app/[locale]/preview/` und `src/components/Preview/`.

**Geprüfter Stand der Prototypen (26.10.2026, `curl` gegen `localhost:3000`):** `/de/preview/galerie` liefert 200. `/de/preview/buehne` und `/de/preview/dreilaendereck` liefern 404. Bühne hat nur Unterseiten (`logo`, `marken`, `produkt`) und eine Shell, für Dreiländereck gibt es bisher nur Komponenten. Die Befunde in Abschnitt 5.3 stammen aus dem Code und dem gerenderten HTML von „Galerie“ sowie aus dem Code der Bühne-Shell.

---

## 1. Die wichtigsten Erkenntnisse

1. **Fast alle Websites scheitern an denselben sechs Fehlern, und alle sechs lassen sich mit HTML beheben.** Die WebAIM Million 2026 (Daten vom Februar 2026) findet auf **95,9 %** der Startseiten automatisch erkennbare WCAG-Fehler, im Schnitt **56,1** pro Seite. Die häufigsten: zu wenig Kontrast (83,9 %), fehlende Alt-Texte (53,1 %), Eingabefelder ohne Label (51 %), leere Links (46,3 %), leere Buttons (30,6 %) und eine fehlende Sprachangabe (13,5 %). Wer diese sechs Fehler vermeidet, steht schon vor 95 % des Marktes. Die Live-Site hat heute drei davon: Gold-Kontrast 2,05:1, fehlende sichtbare Labels im Kontaktformular und Fehler, die nicht am Feld angesagt werden (`digital/13` 1.3).
   Quelle: https://webaim.org/projects/million/

2. **Mehr ARIA geht mit mehr Fehlern einher.** In derselben Studie haben Seiten mit ARIA im Schnitt 59,1 Fehler, Seiten ohne ARIA 42. WebAIM sagt selbst, dass ARIA nicht zwingend die Ursache ist, weil solche Seiten meist komplexer sind. Die erste ARIA-Regel des W3C lautet: Wo es ein natives HTML-Element gibt, nimmt man dieses. Für Platzhirsch heißt das: `<button>`, `<dialog>`, `popover`, `<details>`, `<fieldset>` und `<label>` zuerst, ARIA nur dort, wo HTML nichts bietet (Live-Regionen, `aria-current`, `aria-describedby`).
   Quellen: https://webaim.org/projects/million/ · W3C, Using ARIA, „First Rule“, https://www.w3.org/TR/using-aria/#rule1

3. **Die Rechtslage verlangt WCAG 2.1 AA, sobald es eine Kasse gibt. Das sinnvolle Ziel ist WCAG 2.2 AA.** BaFG (AT) und BFSG (DE) gelten seit 28.06.2025 für Verbraucherverträge im elektronischen Geschäftsverkehr. Erfasst sind also Shop, Gutschein-Kauf und eine verbindliche Terminbuchung, eine reine Anfrage meist nicht. Kleinstunternehmen mit weniger als 10 Beschäftigten **und** höchstens 2 Mio. € Umsatz oder Bilanzsumme sind ausgenommen. Die harmonisierte Norm EN 301 549 verweist auf WCAG 2.1 AA. WCAG 2.2 bringt neun neue Kriterien dazu, sechs davon auf A/AA: 2.4.11 Fokus nicht verdeckt, 2.5.7 Ziehbewegungen, 2.5.8 Zielgröße 24 px, 3.2.6 Hilfe immer am gleichen Ort, 3.3.7 keine doppelte Eingabe, 3.3.8 Anmeldung ohne Rätsel. Für die Schweiz gilt das BehiG nur für Bundesstellen, private Websites trifft es nicht direkt. CH-Kunden profitieren trotzdem.
   Quellen: `digital/14` F10 · W3C WCAG 2.2, https://www.w3.org/TR/WCAG22/ · What's new in WCAG 2.2, https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ · ETSI EN 301 549 V3.2.1

4. **Die Zielgruppe ist älter, als die Gestaltung oft annimmt.** Vermögende Bauherren, Käufer von Zweitwohnungen und Hoteliers sind überwiegend 45 bis 70 Jahre alt. Ab etwa 45 lässt die Nahsicht nach (Presbyopie). Die Kontrastempfindlichkeit sinkt mit dem Alter deutlich, und die Feinmotorik auf Touch-Geräten nimmt ab. Die Nielsen Norman Group fand, dass Nutzer über 65 bei Websites rund 43 % langsamer sind als 21- bis 55-Jährige. Häufige Ursachen sind kleine Schrift, zu wenig Kontrast und kleine Klickflächen. Graue 11-px-Labels in Versalien auf Leinen, wie sie im Luxus-Design üblich sind, treffen also genau die Kunden, die am meisten kaufen.
   Quellen: NN/g, Usability for Senior Citizens, https://www.nngroup.com/articles/usability-for-senior-citizens/ · Owsley 2011, Aging and vision, *Vision Research* 51(13), https://doi.org/10.1016/j.visres.2010.09.004

5. **Bei Formularen bringen Labels und Fehlermeldungen am meisten.** Platzhalter als einzige Beschriftung verschwinden beim Tippen, haben meist zu wenig Kontrast und werden oft für bereits ausgefüllte Werte gehalten. NN/g rät deshalb klar davon ab. Baymard misst seit Jahren, dass unklare Fehlermeldungen und unnötige Felder die häufigsten Abbruchgründe sind. Für die Fehlerseite empfiehlt das GOV.UK Design System eine Zusammenfassung oben, die den Fokus erhält, Links zu jedem fehlerhaften Feld und den Fehlertext direkt am Feld. Dieses Muster ist in Tests mit Tausenden Nutzern belegt.
   Quellen: NN/g, Placeholders in Form Fields Are Harmful, https://www.nngroup.com/articles/form-design-placeholders/ · GOV.UK Design System, Error summary, https://design-system.service.gov.uk/components/error-summary/ · Baymard Institute, Checkout Usability, https://baymard.com/research/checkout-usability

6. **Native Dialoge und Popover sind heute die robustere Wahl.** `<dialog>` mit `showModal()` setzt den Rest der Seite automatisch auf `inert`, schließt mit Esc, legt den Inhalt in die oberste Ebene und gibt den Fokus beim Schließen zurück. `popover` ist seit 2024 Baseline und eignet sich für nicht modale Ebenen wie Menüs und Infokästen, sperrt den Rest der Seite aber **nicht**. Die Attribute `command` und `commandfor` am `<button>` öffnen Dialoge ohne JavaScript, sind laut MDN aber nicht überall gleich gut unterstützt. Vor dem Einsatz also die Kompatibilitätstabelle prüfen und `showModal()` als Fallback vorsehen. Für einen Vollbild-Menü-Layer folgt daraus: **modal = `<dialog>`**, nicht `popover`.
   Quellen: MDN `<dialog>`, https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog · MDN Popover API, https://developer.mozilla.org/en-US/docs/Web/API/Popover_API · MDN `<button>` (command/commandfor), https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button

7. **Gute Semantik ist zugleich Suchmaschinenoptimierung.** Google verlangt, dass strukturierte Daten nur zeigen, was auch sichtbar auf der Seite steht. Daten, die nur im JSON-LD auftauchen, gelten als Spam-Risiko. Google liest für Bilder Alt-Text, Dateinamen und umgebenden Text. Eine saubere Überschriften-Hierarchie und `<nav>`/`<main>` helfen Crawlern und Sprachassistenten. Ein Alt-Text wie „Minotti Andersen Sofa, Bezug Leinen Sand, Gestell Eiche“ erfüllt WCAG 1.1.1 und wirkt gleichzeitig als Long-Tail-Signal für die Bildersuche.
   Quellen: Google Search Central, General structured data guidelines, https://developers.google.com/search/docs/appearance/structured-data/sd-policies · Google Image SEO best practices, https://developers.google.com/search/docs/appearance/google-images

8. **Bewegung braucht einen Ausschalter.** WCAG 2.2.2 verlangt einen Pause-Knopf für alles, was sich länger als 5 s bewegt. 2.3.3 (AAA, aber Best Practice) verlangt, dass Animationen, die durch Interaktion ausgelöst werden, abschaltbar sind. Für Nutzer mit vestibulären Störungen lösen Parallax und Scroll-Hijacking Schwindel aus. `prefers-reduced-motion` ist das Mindeste, ein sichtbarer Pause-Knopf am Hero-Video ist Pflicht. Die Prototypen sind hier schon gut: Animation nur unter `no-preference`, Lenis nur bei `pointer: fine` und ohne Reduced Motion.
   Quellen: WCAG 2.2 SC 2.2.2, 2.3.3, https://www.w3.org/TR/WCAG22/ · Web.dev, prefers-reduced-motion, https://web.dev/articles/prefers-reduced-motion

9. **Automatische Tests finden nur etwa ein Drittel der Probleme.** Laut Deque deckt axe-core im Schnitt rund 57 % der Fehler**fälle** ab (nach Häufigkeit gewichtet), nach Erfolgskriterien gezählt deutlich weniger. Fokus-Reihenfolge, Sinn von Alt-Texten, verständliche Fehlertexte und Tastatur-Fallen bei Dialogen findet nur ein Mensch. Deshalb braucht es zusätzlich einen manuellen Tastatur- und Screenreader-Durchlauf (NVDA + Firefox, VoiceOver + Safari iOS) vor jedem Release.
   Quelle: Deque, Automated testing study, https://www.deque.com/automated-accessibility-testing-coverage/

---

## 2. Vorgaben für den Neuauftritt (verbindlich, messbar)

### 2.1 Seitengerüst und Landmarks

| Regel | Umsetzung für Platzhirsch | Messung |
|---|---|---|
| Genau ein `<header>` (banner), ein `<main>`, ein `<footer>` (contentinfo) pro Seite, **auf oberster Ebene** | Kopf und Fuß des Neuauftritts sitzen in `app/[locale]/layout.js` **neben** `<main id="main">`, nicht darin. Ein `<header>` innerhalb von `<main>` ist **kein** Banner-Landmark mehr | Firefox Accessibility Inspector oder Chrome DevTools „Accessibility tree“: genau 1× banner, 1× main, 1× contentinfo |
| `<nav>` mit eindeutigem Namen, wenn es mehrere gibt | `aria-label="Hauptnavigation"`, `"Fußzeile"`, `"Brotkrumen"`, `"Sprache"`. „Hauptnavigation, Navigation“ in der Ansage ist im Deutschen üblich und verständlich. Wichtig ist nur, dass kein Name doppelt vorkommt | Landmark-Liste in NVDA (Taste D) ohne doppelte Namen |
| Skip-Link als **erstes** fokussierbares Element | `<a href="#main" class="skip">Zum Inhalt springen</a>`, beim Fokus sichtbar, ≥ 44 × 44 px, Kontrast ≥ 4,5:1. Ziel ist `<main id="main" tabindex="-1">` | Tab einmal nach dem Laden: Skip-Link erscheint oben links |
| `<html lang>` pro Locale, Sprachwechsel im Text auszeichnen | `lang="de-AT"` (oder `de`), `fr`, `it`, `en`. Italienische Produktnamen in deutschem Text **nicht** auszeichnen (Eigennamen), ganze italienische Zitate (Designer-Zitat Rodolfo Dordoni) mit `<blockquote lang="it">` | Screenreader spricht das Zitat mit italienischer Stimme |
| `<section>` nur mit Überschrift | Jede `<section>` hat `aria-labelledby` auf ihre `<h2>`. Ohne Überschrift `<div>` nehmen | axe-Regel `landmark-unique`, manuelle Prüfung |
| `<address>` nur für Kontaktdaten des Studios | Footer: Hafenstraße / Lochau mit `<address>` (macht Galerie richtig) | – |
| Öffnungszeiten als `<dl>` oder Tabelle | `<dl><dt>Mo–Fr</dt><dd><time datetime="09:00">9:00</time>–<time datetime="18:00">18:00</time></dd>…</dl>` | Stimmt mit `openingHoursSpecification` im JSON-LD überein |
| Seitentitel eindeutig | Muster `<Seite> – <Bereich> | Platzhirsch Lochau`, z. B. „Andersen Sofa von Minotti – Wohnen | Platzhirsch Lochau“. Höchstens 60 Zeichen | Kein Titel doppelt in der Sitemap (Skript) |
| Route-Wechsel ansagen | Next.js App Router hat einen eingebauten Route-Announcer (liest `document.title` vor, sonst die erste `<h1>`). Dafür sorgen, dass beide pro Seite eindeutig sind. **Keinen** eigenen Announcer zusätzlich bauen, sonst wird doppelt angesagt | VoiceOver beim Klick auf einen Menüpunkt: neuer Seitentitel wird angesagt |

### 2.2 Überschriften

- **Genau eine `<h1>` pro Seite**, sichtbar und inhaltlich: Auf der Startseite ist das der Positionierungssatz (z. B. „Italienisches Wohnen am Bodensee“), **nicht** das Logo. Auf Produktseiten: „Andersen“ plus Untertitel „Sofa von Minotti“ im selben `<h1>` oder als `<p>` direkt darunter.
- **Keine Ebene überspringen** (h2 → h4 ist verboten). Größe und Ebene sind getrennt: Eine kleine Versal-Zeile über der Überschrift („Marken“, „Dreiländer-Service“) ist ein `<p class="overline">`, **keine** Überschrift. Ein großes Zitat ist ein `<blockquote>` mit `<p>`, **keine** `<h2>`.
- **Die Überschriften allein müssen die Seite erzählen.** Test: In NVDA mit „H“ durchspringen. Die Folge soll lauten: „Italienisches Wohnen am Bodensee – Unsere Marken – Räume – Showroom und Café – Dreiländer-Service – Termin vereinbaren“. Kunstüberschriften wie „Stille.“ oder „Mehr als Möbel“ gehen nur, wenn darunter eine verständliche Unterzeile steht.
- **Footer-Spaltentitel** sind `<h2>` (Bühne macht das richtig) oder einfache `<p>`. In jedem Fall einheitlich auf allen Seiten.
- **Karten** (Raum, Produkt, Ratgeber): Die Kartenüberschrift ist `<h3>` und **steckt im Link**, damit der Linktext gleich dem Titel ist. Die ganze Karte klickbar zu machen geht mit `a::after { content:""; position:absolute; inset:0 }` (Pseudo-Content-Muster). Den ganzen Kartenblock in `<a>` zu verpacken ist zu vermeiden, weil der Screenreader dann alles in einem Atemzug vorliest.

### 2.3 Links und Buttons

| Regel | Beispiel | Prüfwert |
|---|---|---|
| Ein Link führt woanders hin, ein Button löst etwas aus | „Termin vereinbaren“ → `<a href="/de/termin">`. „Merken“ → `<button type="button" aria-pressed="false">` | Kein `<div onClick>`, kein `<a>` ohne `href` (ESLint `jsx-a11y/anchor-is-valid` auf `error`) |
| Linktext ohne Kontext verständlich | Statt „Mehr erfahren“: „Alle Minotti-Modelle ansehen“. Wenn das Design kurz bleiben muss: `Mehr<span class="sr-only"> über Minotti</span>` | NVDA-Linkliste (Insert+F7): kein Text doppelt mit verschiedenen Zielen |
| Sichtbarer Text ist Teil des zugänglichen Namens (SC 2.5.3) | Button zeigt „Menü“ → Name „Menü“, **nicht** `aria-label="Navigation öffnen"`. Logo-Link: `aria-label="Platzhirsch Home Living, Startseite"` | Sprachsteuerung („Klick Menü“) funktioniert |
| Externe Links und neue Tabs ansagen | `target="_blank"` nur für Google Maps und Instagram, mit `<span class="sr-only">(öffnet in neuem Tab)</span>` und Pfeil-Icon `aria-hidden="true"` (Bühne macht das richtig, Galerie beim „Route planen“-Link nicht) | – |
| Telefon und E-Mail als echte Links | `<a href="tel:+43557446255">+43 5574 46255</a>`, mit Ländervorwahl, weil CH/DE/FL-Kunden anrufen | – |
| Icon-Buttons haben einen Namen | `<button aria-label="Bild 2 von 7">`, SVG mit `aria-hidden="true" focusable="false"` | axe `button-name` = 0 |
| Toggle-Zustände | Merkliste `aria-pressed`, Akkordeon über `<details>`, Menü über `aria-expanded` (bei `popovertarget`/`commandfor` setzt der Browser den Zustand selbst) | – |

### 2.4 Tastatur und Fokus

- **Fokusring auf allen Flächen ≥ 3:1** (SC 1.4.11, 2.4.13 AAA als Ziel): zweifarbig, damit er auf Paper, Stone, Walnut und auf Fotos funktioniert:
  ```css
  :focus-visible {
    outline: 2px solid var(--color-ink);        /* #30373e, 11,37:1 auf Paper */
    outline-offset: 2px;
    box-shadow: 0 0 0 4px var(--color-paper);   /* heller Rand für dunkle Flächen und Fotos */
  }
  .dark :focus-visible { outline-color: var(--color-paper); box-shadow: 0 0 0 4px var(--color-walnut); }
  ```
  `outline: none` ohne Ersatz ist verboten (Lint-Regel auf CSS: `stylelint` `declaration-property-value-disallowed-list` für `outline: none|0`).
- **Fokus wird nie verdeckt (SC 2.4.11):** Fixierter Header 72 px (mobil 60 px), eventuell eine mobile CTA-Leiste 64 px. Daher `html { scroll-padding-top: 88px; scroll-padding-bottom: 80px; }`. Cookie-Banner nicht modal unten mit maximal 30 % der Viewport-Höhe, oder als `<dialog>` modal beim ersten Besuch.
- **Tab-Reihenfolge = visuelle Reihenfolge.** Kein `tabindex` > 0. CSS `order`, `grid-area` oder `flex-direction: row-reverse` dürfen die Lesereihenfolge nicht umdrehen. Bei Bühne liegt die Navigation im DOM **vor** dem Logo, obwohl das Logo optisch in der Mitte steht. Das ist zulässig, solange die Reihenfolge links-Mitte-rechts gleich bleibt.
- **Keine Tastaturfalle (SC 2.1.2).** Ausnahme: der modale Dialog, und den erledigt `showModal()` nativ.
- **Lenis und Smooth Scroll:** Anker-Links und `Tab` müssen weiter scrollen, und `Bild↓`/Leertaste dürfen nicht abgefangen werden. Bühne startet Lenis nur bei `pointer: fine` und ohne Reduced Motion. Das ist richtig so beibehalten.
- **Horizontale Galerien (embla):** Pfeil-Buttons `<button>` mit Namen „Vorheriges Bild“/„Nächstes Bild“, ≥ 44 × 44 px. Die Folien sind `<ul>`/`<li>` mit `aria-roledescription="Folie"` und `aria-label="3 von 7"` nach dem APG-Carousel-Muster. Die nicht sichtbaren Folien bekommen `inert`, damit Tab nicht in unsichtbare Links springt. **Kein Autoplay.** Wenn doch, dann mit Pause-Knopf als erstem Element und Stopp bei Fokus.
- **Ziehen hat eine Alternative (SC 2.5.7):** Vorher/Nachher-Slider (Raumplaner, Stoffwahl) und Kartenausschnitt (Dreiländer-Karte) zusätzlich mit Buttons oder `<input type="range">` bedienbar.

### 2.5 Zielgrößen und Lesbarkeit

| Element | Mindestmaß | Begründung |
|---|---|---|
| Alle Bedienelemente | **24 × 24 px** (SC 2.5.8, Pflicht) | WCAG 2.2 |
| Primäre Touch-Ziele (CTA, Menü, Galerie-Pfeile, Formularfelder) | **44 × 44 px**, Formularfelder **48 px** hoch | Apple HIG 44 pt, Material 48 dp, ältere Zielgruppe |
| Brotkrumen, Footer-Links | 24 px Höhe, Abstand ≥ 8 px | heute ~16 px |
| Fließtext | **≥ 18 px** (1.125 rem), Zeilenhöhe 1,55–1,65, 60–75 Zeichen pro Zeile | Presbyopie, Lesekomfort |
| Kleinster Text (Bildunterschrift, Overline) | **≥ 14 px**, Versalien nur mit `letter-spacing` ≥ 0,08 em und Kontrast ≥ 4,5:1 (Ash `#6b665f` auf Paper = 5,36:1) | Gängige Luxus-Overlines in 11 px Hellgrau fallen durch |
| Text-Abstände (SC 1.4.12) | Layout hält 1,5 Zeilenhöhe, 0,12 em Buchstabenabstand und 2 em Absatzabstand aus, ohne abzuschneiden | Bookmarklet „Text Spacing“ |
| Zoom (SC 1.4.4 / 1.4.10) | 200 % ohne Verlust, 400 % (320 CSS-px) ohne horizontales Scrollen. Keine `height` in px auf Textcontainern. Schriftgrößen in `rem`, `clamp()` mit rem-Anteil (z. B. `clamp(2.25rem, 1.6rem + 3vw, 4.5rem)`), sonst skaliert der Browser-Zoom nicht mit | Chrome auf 400 % bei 1280 px Breite |
| Kontrast | Text ≥ 4,5:1, große Schrift (≥ 24 px oder ≥ 18,66 px fett) ≥ 3:1, Feldrahmen und Icons ≥ 3:1. Werte aus `expertenrat/05`: Ink auf Paper 11,37:1, Pebble `#8a8174` als Feldrahmen 3,62:1, Sand `#ddd6ca` **nur** dekorativ | Text auf Fotos nur mit Scrim, Kontrast an der hellsten Stelle messen |

### 2.6 Bilder und Art Direction

- **Alt-Text-Regeln, nach Bildtyp:**

  | Bildtyp | `alt` | Beispiel |
  |---|---|---|
  | Produktbild (Hauptbild) | Marke, Modell, Material/Farbe, ohne „Bild von“ | `alt="Minotti Andersen Sofa, Bezug Leinen in Sand, Sockel Eiche"` |
  | Weitere Produktansichten | Was die Ansicht zusätzlich zeigt | `alt="Andersen, Detail der Steppnaht an der Armlehne"` |
  | Raum- und Stimmungsbild mit Aussage | Was man sieht und was es zeigt, ≤ 150 Zeichen | `alt="Wohnraum mit Seeblick in Lochau: helles Sofa, Kamin, Fensterfront zum Bodensee"` |
  | Rein dekorativ (Textur, Marmor-Ausschnitt, Linien) | `alt=""` und am besten als CSS-Hintergrund | – |
  | Bild im Link, das den Link allein trägt | Ziel des Links | `alt="Minotti – zur Markenseite"` |
  | Bild **und** Text im selben Link | `alt=""`, der Text trägt den Namen (sonst doppelte Ansage) | Raumkarte „Wohnen“ |
  | Logos von Marken | Markenname | `alt="Poliform"` |
  | Grundriss, Planskizze, Diagramm | Kurzer Alt-Text plus ausführliche Beschreibung im Text oder `<figcaption>` | „Grundriss Küche 4,20 × 3,10 m, Insel mittig …“ |
  | Text im Bild | vermeiden. Wenn nötig, den Text wörtlich in `alt` | – |

  Alt-Texte kommen pro Sprache aus dem Backoffice (Feld `alt_de`, `alt_fr`, `alt_it`, `alt_en`). Fallback ist **nicht** der Dateiname, sondern „Marke Modell“ aus den Produktdaten. Heute gibt es in der Live-Site Alt-Texte wie „Indoor“ (gesehen im Footer-HTML der Galerie-Seite), die zu ungenau sind.

- **`next/image` richtig nutzen (Next 16):** Das LCP-Bild bekommt `preload` bzw. `fetchPriority="high"`, **nie** `loading="lazy"`. `priority` ist in Next 16 veraltet (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`). `sizes` ist bei `fill` Pflicht und muss dem Layout entsprechen. Galerie macht das richtig: `(min-width: 1024px) 30vw, 100vw`.
- **Art Direction:** Wenn sich der Bildausschnitt mobil ändert (Hero quer 16:9 → hoch 4:5), nicht per CSS `object-position` raten, sondern `<picture>` mit `getImageProps()` (Next-Doku „Art Direction“) und zwei Quellen:
  ```jsx
  const common = { alt: "Wohnraum mit Seeblick …", sizes: "100vw" };
  const { props: { srcSet: desktop } } = getImageProps({ ...common, src: "/hero-16x9.jpg", width: 2400, height: 1350, fetchPriority: "high" });
  const { props: { srcSet: mobile, ...rest } } = getImageProps({ ...common, src: "/hero-4x5.jpg", width: 1080, height: 1350, fetchPriority: "high" });
  <picture>
    <source media="(min-width: 768px)" srcSet={desktop} />
    <source srcSet={mobile} />
    <img {...rest} style={{ width: "100%", height: "auto" }} />
  </picture>
  ```
- **`width`/`height` oder `aspect-ratio` immer setzen** → CLS ≤ 0,05.
- **`<figure>`/`<figcaption>`** nur, wenn eine sichtbare Bildunterschrift existiert (z. B. „Projekt Villa am Pfänder, Lochau 2025, Planung Platzhirsch“). Die Unterschrift ersetzt den Alt-Text nicht.
- **Bildrechte:** Herstellerbilder nur mit Freigabe (`digital/14` F3). Das ist kein A11y-Thema, gehört aber in dieselbe Bild-Pipeline (Register-Feld neben `alt`).

### 2.7 Video und Audio

| Regel | Umsetzung |
|---|---|
| Hintergrund-/Hero-Video ohne Ton | `<video muted playsinline loop poster="…" aria-hidden="true">`, **kein** `autoplay`, wenn `prefers-reduced-motion: reduce`. Bei Laufzeit > 5 s **sichtbarer Pause-Button** (SC 2.2.2): `<button aria-pressed="false">Video anhalten</button>`, ≥ 44 px, immer sichtbar, nicht nur bei Hover |
| Video mit Sprache (Werkstattfilm Binni, Interview, Rundgang) | Untertitel als `<track kind="captions" srclang="de" label="Deutsch" default>`, dazu FR/IT/EN als WebVTT. Untertitel **nicht** in das Video brennen. Transkript als aufklappbares `<details>` unter dem Video (SEO-Bonus) |
| Audiodeskription (SC 1.2.5 AA) | Bei reinen Bildfilmen mit wichtiger Information (z. B. „So entsteht die Steinplatte“): Sprecher beschreibt Handlung bereits im Ton, oder Textfassung daneben |
| YouTube/Vimeo | Fassade mit Vorschaubild und `<button>Video abspielen (YouTube, lädt Daten von Google)</button>`, erst nach Klick laden. Das hilft bei Consent, Performance und Tastaturbedienung. `<iframe title="Werkstattfilm Binni, 2:40 Min.">` |
| Kein Blitzen | Nie mehr als 3 Blitze pro Sekunde (SC 2.3.1), auch nicht bei Schnitt-Montagen |

### 2.8 Formulare (Termin, Anfrage, Beratung, Newsletter, Adventsabend)

**Grundmuster für jedes Feld:**
```html
<div class="field">
  <label for="f-email">E-Mail-Adresse</label>
  <p id="f-email-hint" class="hint">Wir antworten innerhalb eines Werktags.</p>
  <input id="f-email" name="email" type="email" autocomplete="email" inputmode="email"
         required aria-describedby="f-email-hint f-email-error" aria-invalid="false" />
  <p id="f-email-error" class="error" hidden></p>
</div>
```

| Regel | Wert |
|---|---|
| Sichtbares `<label>` über dem Feld, nie nur Platzhalter oder `aria-label` | 100 % der Felder (heute 20 Labels für 32 Inputs) |
| Pflichtfelder | Optionale Felder markieren („optional“) statt Sterne an jedem Feld. `required` im HTML, Hinweis im Label-Text, nicht nur farbig |
| `autocomplete` für persönliche Daten (SC 1.3.5) | `given-name`, `family-name`, `email`, `tel`, `postal-code`, `address-level2`, `country-name`, `organization` (Architekten, Hotels) |
| Passende Typen | `type="email"`, `type="tel"`, `type="date"` nur, wenn der native Picker reicht. Für Termine besser Slot-Buttons in einer `<fieldset>`/`<legend>`-Gruppe als Radio-Buttons |
| Gruppen | `<fieldset><legend>Was planen Sie?</legend>` mit Checkboxen „Wohnen, Küche, Schlafen, Outdoor, Komplettprojekt“, `<legend>Lieferland</legend>` mit AT/DE/CH/FL |
| Validierung | Beim Absenden, nicht bei jedem Tastendruck. Danach Feldfehler „live“ beim Verlassen (`blur`). `novalidate` am `<form>`, wenn eigene Meldungen. Dann **müssen** eigene Meldungen jedes native Verhalten ersetzen |
| Fehlermeldung | Konkret und mit Lösung: „Bitte geben Sie eine E-Mail-Adresse mit @ ein, z. B. name@beispiel.ch“, nicht „Ungültige Eingabe“. Am Feld (`aria-describedby`, `aria-invalid="true"`) **und** in einer Zusammenfassung oben: `<div role="alert" tabindex="-1">` mit Überschrift „2 Angaben fehlen“ und Links zu den Feldern, Fokus darauf setzen |
| Erfolg | Danke-Seite oder Inhalt ersetzen, Fokus auf die neue `<h1>`/`<h2>` „Danke, Frau Müller. Wir melden uns bis morgen 12 Uhr.“, `document.title` anpassen. Kein Toast, der nach 3 s verschwindet |
| Mehrschrittige Beratung | Kein automatisches Weiterspringen (SC 3.2.2, heute 500 ms im `BeratungClient`). „Weiter“-Button, Schrittanzeige „Schritt 2 von 4“ als Text, Zurück ohne Datenverlust, bereits eingegebene Daten nicht erneut abfragen (SC 3.3.7) |
| Zeitlimits | Keine. Sitzung verliert nichts (Entwurf in `sessionStorage`, mit try/catch) |
| Spam-Schutz | Honeypot + Rate-Limit serverseitig, **kein** Bild-CAPTCHA, kein Rätsel (SC 3.3.8). Honeypot-Feld mit `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"` und visuell versteckt |
| Datenschutz-Hinweis | Als Text mit Link direkt über dem Senden-Button, keine vorangekreuzte Checkbox (DSGVO, `digital/14` F1). Newsletter-Einwilligung als eigene, nicht vorangekreuzte Checkbox |
| Button-Text | Was passiert: „Termin anfragen“, „Anmeldung absenden“, nicht „Senden“ |
| Länge | Termin-Anfrage ≤ 5 Pflichtfelder (Name, E-Mail oder Telefon, Wunschtermin, Thema, Land). Alles andere optional |

### 2.9 Dialoge, Popover, Menüs, Akkordeons

| Muster | Element | Regeln |
|---|---|---|
| Vollbild-Menü mobil | `<dialog>` mit `showModal()` (oder `<button commandfor="menu" command="show-modal">` mit Fallback) | Rest der Seite automatisch `inert`, Esc schließt, Fokus kehrt zum „Menü“-Button zurück. Erster Fokus auf „Schließen“ oder den ersten Link. `<dialog aria-labelledby="menu-title">` mit sichtbarem oder `sr-only`-Titel „Menü“. Hintergrund nicht scrollen: `body:has(dialog[open]) { overflow: hidden }` |
| Mega-Menü Desktop | `<nav>` mit `<button aria-expanded>` je Hauptpunkt und darunter `<ul>` mit Links, **kein** `role="menu"` (ARIA-Menüs sind für Anwendungsmenüs, nicht Website-Navigation, APG „Disclosure Navigation“). Öffnen bei Klick/Enter, **nicht** nur bei Hover. Esc schließt und fokussiert den Button |
| Infokasten, Stoffmuster-Info, „Was heißt Festpreis CHF?“ | `popover="auto"` oder `popover="hint"` mit `<button popovertarget>` | Nicht modal, Light-Dismiss. Für Tooltips mit wichtigem Inhalt lieber sichtbar im Text |
| Produkt-Zoom, Galerie-Lightbox | `<dialog>` modal | Pfeil-Tasten für Bildwechsel zusätzlich zu Buttons, Bildzähler „3 von 7“ als Text, Esc schließt |
| FAQ, Maße, Lieferbedingungen | `<details><summary>` | Funktioniert ohne JS, wird von Google gelesen. `name="faq"` für exklusives Akkordeon nur, wenn gewünscht. FAQ-Inhalt muss im HTML stehen (auch zu), sonst kein `FAQPage`-Schema |
| Cookie-Consent | `<dialog>` modal beim ersten Besuch **oder** nicht modale Leiste unten, die nichts verdeckt | „Ablehnen“ gleich groß und gleich kontrastreich wie „Akzeptieren“ (DSGVO + kein Dark Pattern), Fokus startet im Dialog, Tastatur ok |
| Bestätigung „Zur Merkliste hinzugefügt“ | Live-Region `<p role="status" aria-live="polite">` (dauerhaft im DOM, Inhalt tauschen) | Kein Fokusraub, mindestens 5 s sichtbar oder bis zur Schließung |

### 2.10 Bewegung (Abgleich mit `digital/02`)

- Jede Animation nur innerhalb `@media (prefers-reduced-motion: no-preference)`. Unter `reduce`: Überblendung ≤ 150 ms oder gar keine Animation, kein Parallax, kein Lenis, kein Video-Autoplay.
- **Inhalt ist ohne JS und ohne Animation sichtbar.** Kein `opacity: 0` als Ausgangszustand im Server-HTML (das macht `FadeInView` heute). Scroll-Reveal nur mit CSS `animation-timeline: view()` und `@supports`. Ohne Unterstützung bleibt der Inhalt einfach sichtbar.
- View Transitions bei Seitenwechsel ≤ 300 ms. Unter `reduce` aus (`@media (prefers-reduced-motion: reduce) { ::view-transition-group(*) { animation: none } }`).
- Kein Scroll-Hijacking: Ein Mausrad-Schritt scrollt immer noch, keine Abschnitte, die einrasten (`scroll-snap-type: y mandatory` auf der Seite ist verboten, auf horizontalen Galerien `x mandatory` erlaubt).

### 2.11 Strukturierte Daten im Zusammenspiel mit HTML

| Seite | Schema | Sichtbare Entsprechung (Pflicht) |
|---|---|---|
| Alle | `Organization` + `FurnitureStore` (Subtyp von `Store`/`LocalBusiness`) mit `@id` `https://…/#studio` | Name, Adresse, Telefon im Footer in `<address>` |
| Startseite, Kontakt | `openingHoursSpecification`, `geo`, `hasMap` | Öffnungszeiten-`<dl>` mit denselben Zeiten |
| Café | `CafeOrCoffeeShop` als `department` des Studios | Café-Abschnitt mit Zeiten |
| Produktseite | `Product` mit `brand` (`Brand`), `material`, `image`, später `offers` mit `price`, `priceCurrency` EUR/CHF | Gleicher Preis, gleicher Name als `<h1>`, gleiche Materialangabe sichtbar (`digital/14` F4: Preisangaben müssen mit der Seite übereinstimmen) |
| Brotkrumen | `BreadcrumbList` | `<nav aria-label="Brotkrumen"><ol>` mit `aria-current="page"` am letzten Eintrag |
| FAQ, Ratgeber | `FAQPage` nur, wo echte FAQ sichtbar sind, `Article` mit `author`, `datePublished` | `<article>`, `<time datetime>`, Autor als sichtbarer Text |
| Veranstaltungen (Adventsabend, Lochauer Gespräche) | `Event` mit `location`, `startDate`, `eventAttendanceMode`, `isAccessibleForFree` | Datum in `<time datetime="2026-12-04T18:00+01:00">` |
| Video | `VideoObject` mit `transcript` (oder Transkript sichtbar) | Transkript in `<details>` |
| Regionsseiten (Arlberg, Rheintal …) | `areaServed` am Studio, **kein** Fake-`LocalBusiness` pro Ort (Google-Richtlinie für Doorway Pages) | Ehrlicher Text „Wir liefern und montieren in …“ |

**Barrierefreiheit im Schema selbst:** `accessibilityFeature`/`accessibilitySummary` (schema.org) für Videos und Artikel setzen („captions“, „transcript“, „alternativeText“). Google nutzt es heute nicht für Rankings, es ist aber maschinenlesbar und günstig. Für das Studio `amenityFeature` „Rollstuhlgerechter Eingang“, **nur wenn das stimmt** (vor Ort messen: Schwelle ≤ 2 cm, Türbreite ≥ 90 cm, Parkplatz).

**Keine Händler-Behauptungen im Schema:** `brand` am Produkt ist in Ordnung, aber kein `"authorizedDealer"`, kein „offizieller Partner“ in `description`, solange es nicht schriftlich belegt ist (`digital/14` F2). In der Galerie-Seite stehen heute 17× `"@type":"Brand"` (aus dem Live-Layout). Prüfen, dass dort nur bestätigte Marken stehen.

### 2.12 Mehrsprachigkeit (DE/FR/IT/EN)

- `hreflang` plus sichtbarer Sprachwechsler als `<nav aria-label="Sprache">` mit Links. Jeder Link hat `lang` und `hreflang` und zeigt den Namen in der Zielsprache: „Deutsch“, „Français“, „Italiano“, „English“. **Keine Flaggen als einzige Kennzeichnung** (Flagge = Land, nicht Sprache. Die Live-Site zeigt heute Flaggen mit `alt=""`). Aktuelle Sprache mit `aria-current="true"`.
- Alt-Texte, Untertitel, Fehlermeldungen und die Barrierefreiheitserklärung in allen vier Sprachen.
- Preise: `<data value="12900">12.900 €</data>`, CHF mit `lang="de-CH"` formatiert („CHF 12'900.–“), Währung nie nur als Symbol vorlesen lassen, wenn zwei Währungen auf einer Seite stehen.

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

Die regionalen Wettbewerber liegen bei Lighthouse-A11y zwischen 88 (reiter design) und 100 (Dolce Vita, Fretz), Höttges hat 90, Minotti selbst 72 (`digital/13` 2.1). Ein 100er-Score allein hebt Platzhirsch also nicht ab. Abheben kann es sich durch **erlebbar** gute Bedienung:

1. **„Ruhige Ansicht“-Schalter im Footer und im Menü:** Mit einem `<button aria-pressed>` lassen sich Bewegung (Video, Parallax, Lenis) ausschalten, die Schrift um 12,5 % vergrößern und der Kontrast auf AAA heben (Text ≥ 7:1). Die Einstellung wird in `localStorage` gespeichert (mit try/catch) und als `data-calm` auf `<html>` gesetzt. **Kein** Overlay-Widget von Drittanbietern wie accessiBe oder UserWay: Die sind fehleranfällig, rechtlich wirkungslos (FTC-Vergleich accessiBe 2025: 1 Mio. USD wegen irreführender Werbung) und Screenreader-Nutzer lehnen sie ab. Die Funktion ist für alle da, die älter werden, und wird als Komfort beworben: „Lieber in Ruhe ansehen?“.
2. **Produktdaten als echte Tabellen:** Maße, Varianten, Stoffe und Lieferzeit als `<table>` mit `<caption>` und `<th scope>`, Maße in cm **und** im Text („B 280 × T 105 × H 72 cm“). Konfigurator-Ergebnisse als Liste zum Ausdrucken. Wettbewerber zeigen Maße als Bild-PDF. Für Architekten ist das ein echter Vorteil, und Google sowie KI-Suchen können die Daten lesen.
3. **Video-Rundgang durch den Showroom mit Untertiteln in 4 Sprachen, Audiodeskription und Transkript.** Kein Wettbewerber in der Region hat Untertitel. Das Transkript ist gleichzeitig der beste Long-Form-SEO-Text für „Minotti Showroom Bodensee“.
4. **Termin-Buchung, die man per Tastatur in unter 60 Sekunden schafft.** Slots als Radio-Buttons in einer Gruppe pro Tag, ohne Kalender-Widget. Bestätigung mit `.ics`-Download und eigener URL. Gamma und Fretz nutzen eingebettete Drittanbieter-Kalender in iframes ohne Titel. Mit einer stoppuhrgemessenen Aufgabe im Usability-Test (`expertenrat/09`) lässt sich der Vorsprung belegen.
5. **Barrierefreiheit des Ortes, nicht nur der Website.** Eine Seite „Ihr Besuch“ mit gemessenen Angaben: Parkplätze (Anzahl, davon breit), Stufen, Türbreite, WC, Sitzgelegenheiten im Café, Hunde willkommen, Ruhezeiten im Showroom (z. B. Dienstag 9–11 Uhr ohne Café-Betrieb). Fotos des Eingangs mit Alt-Text. Hoteliers und ältere Kunden fragen das ohnehin, und das passt zur Positionierung „Gastgeberort“ (Masterkonzept 4.2 Nr. 1).
6. **Barrierefreiheitserklärung als Visitenkarte statt Pflichttext:** Konformitätsstand, letzte Prüfung (Datum, wer, womit), bekannte Mängel mit Termin für die Behebung, Kontakt mit Antwortzeit ≤ 2 Werktage, Hinweis auf die Schlichtungsstelle (AT: Sozialministeriumservice). Platzhirsch kann sie veröffentlichen, auch wenn die Kleinstunternehmen-Ausnahme gilt. Das wirkt wie ein Qualitätssiegel ohne Siegel.
7. **Seiten funktionieren ohne JavaScript.** Navigation über `<details>`/`<dialog>` mit Progressive Enhancement, Formulare als Server Actions mit echtem `<form action>`. Das ist robust bei schwachem Netz am Arlberg, und Crawler sowie KI-Agenten sehen alles. Bühne setzt das mit dem `<details>`-Menü schon um.
8. **Druckversion für Projekte:** `@media print` für Produkt- und Merklisten-Seiten (ohne Navigation, mit Maßen, Material, QR-Code zur Seite). Architekten und Bauherren drucken für Besprechungen. Die Wettbewerber haben das nicht.

---

## 4. Was man auf keinen Fall tun darf

1. **Kein Overlay-Plugin** (accessiBe, UserWay, EqualWeb …) als „Lösung“. Es behebt die Ursachen nicht, stört Screenreader und schützt nicht vor Klagen. In den USA werden laut UsableNet jedes Jahr Hunderte Websites mit Overlay verklagt.
2. **Keine Platzhalter statt Labels**, keine grauen Labels unter 4,5:1, keine Fehlermeldung nur in Rot.
3. **Keine Gold-Schrift `#d1b250` auf hellem Grund** (2,06:1 auf Weiß). Gold nur auf Walnut/Ink oder als dekorative Linie neben Text, der den Kontrast schon erfüllt (`expertenrat/05`).
4. **Kein `outline: none`** ohne gleichwertigen Ersatz, kein Fokus, der nur über die Farbe des Textes sichtbar wird.
5. **Kein `role="menu"`, `role="application"`, `aria-hidden` auf fokussierbaren Elementen, kein `tabindex` > 0**, keine `<div>`-Buttons.
6. **Kein Autoplay mit Ton, kein Karussell mit Autoplay ohne Pause**, keine Inhalte, die nur bei Hover erscheinen (Touch und Tastatur kommen nicht ran, SC 1.4.13).
7. **Kein `popover` als modaler Vollbild-Layer** (der Rest bleibt per Tab erreichbar). Kein selbstgebauter Fokus-Trap, wenn `<dialog>` das kann.
8. **Kein Text in Bildern** (Hero-Claims, Preisetiketten, Öffnungszeiten als Grafik), kein Logo-Link ohne Namen, keine Bilder mit Alt-Text = Dateiname („IMG_4711“).
9. **Keine strukturierten Daten für Unsichtbares** (Bewertungen, die nicht auf der Seite stehen, erfundene Öffnungszeiten, `LocalBusiness` an Orten ohne Filiale, „authorized dealer“ ohne Vertrag).
10. **Keine Dark Patterns in a11y-Gestalt:** „Ablehnen“ als kleiner grauer Link, Abmelden nur per Mail, „Nein, ich mag kein schönes Wohnen“ (Confirmshaming), versteckter Schließen-Knopf im Newsletter-Popup. In der EU unzulässig (DSA Art. 25, UGP-Richtlinie Anhang I, DSGVO Art. 7) und für eine Luxusmarke rufschädigend.
11. **Kein Newsletter-Popup, das beim Laden Fokus stiehlt** oder nach 3 Sekunden erscheint (SC 3.2.1 / 2.2.1 und Nutzerfrust). Wenn überhaupt, dann am Ende eines Artikels inline.
12. **Kein Scroll-Hijacking, kein `scroll-snap` vertikal auf ganzer Seite, kein Parallax unter Reduced Motion.**
13. **Kein Header, keine Footer innerhalb von `<main>`, keine zwei `<main>`, keine doppelten IDs** (das passiert leicht, wenn Prototyp-Shells im Live-Layout stecken, siehe 5.3).

---

## 5. Prüf-Checkliste für die drei Prototypen

### 5.1 Ablauf (pro Prototyp ca. 90 Minuten)

1. **Automatisch (10 min):** `npx @axe-core/cli http://localhost:3000/de/preview/<name> --tags wcag2a,wcag2aa,wcag21aa,wcag22aa` und Lighthouse mobil (Accessibility). HTML-Validator (`https://validator.w3.org/nu/` mit dem `curl`-Ergebnis) für doppelte IDs und falsche Verschachtelung.
2. **Struktur (10 min):** HeadingsMap-Erweiterung oder Firefox-A11y-Inspector: Landmarks, Überschriften, Seitentitel.
3. **Tastatur (20 min):** Nur mit Tab, Shift+Tab, Enter, Leertaste, Esc, Pfeiltasten: Skip-Link → Menü öffnen/schließen → Marke wählen → Termin-Formular leer absenden → ausfüllen → absenden.
4. **Screenreader (25 min):** NVDA 2025.x + Firefox (Windows) und VoiceOver + Safari (iPhone): Überschriften-Liste, Linkliste, Formularfehler, Menü-Dialog, Bildbeschreibungen.
5. **Zoom und Anpassung (10 min):** 200 %, 400 % bei 1280 px, Text-Spacing-Bookmarklet, Windows-Kontrastmodus (`forced-colors: active`).
6. **Bewegung (5 min):** Betriebssystem auf „Bewegung reduzieren“, Seite neu laden. Gibt es noch Bewegung? Pause-Knopf am Video?
7. **Mobil mit Touch (10 min):** iPhone SE (375 px) und ein Android-Gerät. Treffen der Ziele mit dem Daumen, keine horizontale Scrollleiste, CTA-Leiste verdeckt nichts.

### 5.2 Kriterien und Punkteskala

Jedes Kriterium bekommt **0–3 Punkte**: 0 = fehlt oder blockiert (K.-o. für BaFG-relevante Bereiche), 1 = vorhanden mit deutlichen Mängeln, 2 = erfüllt WCAG 2.2 AA, 3 = erfüllt und darüber hinaus vorbildlich (Beispiel in Klammern). Gewicht ×2 bei den mit **(G)** markierten Kriterien.

| # | Kriterium | 2 Punkte, wenn … | 3 Punkte, wenn … |
|---|---|---|---|
| 1 | **(G) Landmarks** | genau 1 banner, 1 main, 1 contentinfo auf oberster Ebene, alle `nav` benannt | zusätzlich Skip-Link auf `#main` mit Fokus auf `main` |
| 2 | **(G) Überschriften** | eine `<h1>`, keine Sprünge, Overlines/Zitate keine Überschriften | Überschriften-Liste erzählt die Seite verständlich |
| 3 | Seitentitel & Sprache | eindeutiger `<title>`, `lang` korrekt | fremdsprachige Zitate mit `lang` |
| 4 | **(G) Kontrast** | Text ≥ 4,5:1, UI ≥ 3:1, auch auf Fotos | Fließtext ≥ 7:1 (AAA) |
| 5 | **(G) Tastatur** | alles erreichbar und bedienbar, Reihenfolge logisch, keine Falle | Pfeiltasten in Galerie/Lightbox, Esc überall |
| 6 | **(G) Fokus sichtbar & nicht verdeckt** | Ring ≥ 3:1 auf allen Flächen, `scroll-padding` oben/unten | zweifarbiger Ring, auch auf Fotos sichtbar (2.4.13 AAA) |
| 7 | **(G) Dialoge & Menüs** | modal = `<dialog>` mit `inert`-Hintergrund, Esc, Fokus-Rückgabe | funktioniert ohne JS (`<details>` oder `commandfor`) |
| 8 | Links & Buttons | jeder hat einen Namen, Text ohne Kontext verständlich, Link vs. Button korrekt | neue Tabs angekündigt, Karten mit Pseudo-Content-Klickfläche |
| 9 | Zielgrößen | alles ≥ 24 px (2.5.8) | primäre Ziele ≥ 44 px, Formularfelder 48 px |
| 10 | **(G) Bilder** | jedes `<img>` hat sinnvolles oder leeres `alt`, LCP-Bild nicht lazy | Art Direction mobil per `<picture>`, Alt-Texte mit Marke/Material |
| 11 | Video & Bewegung | Reduced Motion schaltet Bewegung aus, Video > 5 s pausierbar | Untertitel + Transkript, Inhalt ohne JS sichtbar (kein `opacity:0` im SSR) |
| 12 | **(G) Formulare** | sichtbare Labels, `autocomplete`, Fehler am Feld + Zusammenfassung, kein Auto-Weiter | Fehlertexte mit Beispiel, Erfolg mit Fokus und neuer Überschrift, Termin in < 60 s per Tastatur |
| 13 | Zoom & Reflow | 400 % ohne horizontales Scrollen, Text-Spacing ok | Schrift skaliert per `rem`, `forced-colors` sauber |
| 14 | Strukturierte Daten | gültig (Rich Results Test), deckt sich mit sichtbarem Inhalt | `@id`-Graph, `BreadcrumbList` mit sichtbarer Nav, keine Händler-Behauptung |
| 15 | Mehrsprachigkeit | Sprachwechsler mit Namen statt Flaggen | `hreflang` + `lang` am Link + `aria-current` |
| 16 | Keine Dark Patterns | Ablehnen = Akzeptieren, kein Fokusraub, kein Countdown | „Ruhige Ansicht“ oder vergleichbare Komfortfunktion |
| 17 | Robustheit | HTML-Validator ohne Fehler bei IDs/Verschachtelung, axe 0 serious/critical | Kern-Inhalt und Navigation ohne JS nutzbar |

**Maximum:** 17 Kriterien, davon 8 mit Gewicht 2 → (9 × 3) + (8 × 6) = **75 Punkte**.
**Bewertung:** ≥ 60 vorbildlich, 48–59 launchfähig nach WCAG 2.2 AA, 35–47 Nacharbeit nötig, < 35 oder eine 0 bei einem (G)-Kriterium → nicht launchfähig.

### 5.3 Erste Befunde aus dem Code (26.10.2026)

| Prototyp | Befund | Kriterium | Korrektur |
|---|---|---|---|
| Alle | Die Prototyp-Shells stecken im Live-Layout. Ihr `<header>` und `<footer>` liegen **innerhalb** von `<main id="main">` (gerendertes HTML der Galerie: `<main id="main">` → `<header class="galerie…header">` → … → `<footer class="galerie…footer">`). Damit sind sie keine Banner-/Contentinfo-Landmarks. Der Live-Header und -Footer werden per `:has([data-galerie])` nur per CSS versteckt, liegen aber weiter im DOM (Gewicht, doppelte Daten) | 1, 17 | Für den Neuauftritt eigenes Root-Layout pro Variante (Route Group `(galerie)/layout.js`), damit Header/Main/Footer Geschwister sind. Für die Vorschau reicht ein Hinweis |
| Galerie | Skip-Link vorhanden und richtig (erstes Element, Ziel `#galerie-main` mit `tabIndex={-1}`) | 1 | – (gut) |
| Galerie | Mobiles Vollbild-Menü ist `popover="auto"` mit `role="dialog"`. Ein Popover sperrt den Hintergrund nicht, Tab kann hinter das Vollbild-Menü in unsichtbare Links laufen | 7 | `<dialog>` + `showModal()` (oder `command="show-modal"`). `role="dialog"` und `aria-haspopup` entfallen dann |
| Galerie | Intro-Abschnitt hat ein Zitat als `<h2 id="intro-title" class="quote">` | 2 | `<blockquote>`, die Section bekommt eine `sr-only`-`<h2>` oder wird `<div>` |
| Galerie | „Route planen“ (`target="_blank"`) ohne Hinweis auf neuen Tab | 8 | `<span class="sr-only">(öffnet Google Maps in neuem Tab)</span>` |
| Galerie | Hero-Bild mit gutem Alt-Text und `fetchPriority="high"`, `sizes` passend | 10 | – (gut) |
| Galerie | Länderkürzel `aria-hidden`, Ländername als `<h3>`. Richtig, solange der Name sichtbar ist | 2 | – |
| Galerie | Fokus `2px solid var(--bronze)`, Offset 4 px. Kontrast der Bronze auf allen Flächen prüfen (Stone, Dark) | 6 | Zweifarbiger Ring wie in 2.4 |
| Bühne | Kein Skip-Link in der Shell | 1 | Ergänzen |
| Bühne | Mobiles Menü als `<details>` funktioniert ohne JS. Esc schließt `<details>` aber nicht, und der Panel-Inhalt ist nicht modal. Wenn das Panel den Bildschirm füllt, wird es zur Falle für die Orientierung | 7 | Bei kleinem Dropdown so lassen und Esc-Handler ergänzen, bei Vollbild `<dialog>` |
| Bühne | `<summary aria-label="Menü öffnen">` mit sichtbarem Text „Menü“: Der Name weicht vom sichtbaren Text ab (SC 2.5.3 verlangt nur, dass er ihn enthält, „Menü öffnen“ enthält „Menü“ → zulässig). `aria-label` aber entbehrlich | 8 | Entfernen, Icon bleibt `aria-hidden` |
| Bühne | Zwei `<nav>` mit Namen „Hauptnavigation (Prototyp)“ und „Hauptnavigation mobil (Prototyp)“, eine davon per CSS versteckt | 1 | In Ordnung, solange `display:none` die jeweils andere aus dem A11y-Baum nimmt |
| Bühne | Externer Instagram-Link mit `sr-only`-Hinweis „(öffnet in neuem Tab)“ und Icon `aria-hidden` | 8 | – (gut) |
| Bühne | `PLATZHIRSCH` als großer Footer-Schriftzug mit `aria-hidden="true"` | 3 | – (gut, dekorativ) |
| Bühne | Lenis nur bei `pointer: fine`, nie unter Reduced Motion, per dynamischem Import nach Idle | 11 | – (gut) |
| Bühne, Dreiländereck | `/de/preview/buehne` und `/de/preview/dreilaendereck` liefern 404 (keine `page.js` auf Startebene) | – | Nach Fertigstellung mit 5.2 neu prüfen |
| Alle | Fremde Bild-Alt-Texte aus dem Live-Footer („Indoor“, Flaggen mit `alt=""` als einziges Merkmal des Sprachwechslers) | 10, 15 | Gilt für den Live-Code, im Neuauftritt nach 2.6 und 2.12 lösen |

---

## Anhang: Entwickler-Prüfliste (vor jedem Merge)

- [ ] `eslint-plugin-jsx-a11y` Regeln auf `error` (u. a. `alt-text`, `anchor-is-valid`, `label-has-associated-control`, `no-noninteractive-tabindex`, `no-autofocus`, `no-redundant-roles`, `control-has-associated-label`)
- [ ] Playwright + `@axe-core/playwright` auf Startseite, Marke, Produkt, Termin (inkl. Fehlerzustand), Menü offen, Consent offen: 0 serious/critical
- [ ] Lighthouse CI Accessibility ≥ 95 (Ziel 100)
- [ ] Neue Komponente: Tastatur-Test dokumentiert (Tab-Reihenfolge, Esc, Fokus-Rückgabe)
- [ ] Neues Bild: `alt` in DE/FR/IT/EN gepflegt oder bewusst `alt=""`, `sizes` gesetzt, LCP-Kandidat nicht lazy
- [ ] Neues Video: Untertitel-Datei, Pause-Knopf, `poster`, Reduced Motion
- [ ] Neues Formularfeld: `<label for>`, `autocomplete`, `aria-describedby` für Hinweis und Fehler, Fehlertext mit Lösung
- [ ] Neue Animation: nur unter `prefers-reduced-motion: no-preference`, ≤ 450 ms, nur `transform`/`opacity`, Inhalt ohne Animation sichtbar
- [ ] Neues JSON-LD: Inhalt sichtbar auf der Seite, Rich Results Test grün, keine Händler-Behauptung
- [ ] Neue Farbe: Kontrast gegen jede Fläche, auf der sie vorkommt, im Token-Kommentar notiert
- [ ] Vor Release: manueller Durchlauf NVDA + Firefox und VoiceOver iOS, 400 % Zoom, `forced-colors`
- [ ] Quartalsweise: Barrierefreiheitserklärung aktualisiert (Datum, offene Mängel)
