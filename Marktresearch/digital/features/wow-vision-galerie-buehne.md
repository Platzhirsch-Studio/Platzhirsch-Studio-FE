# Wow-Vision C „Die Bühne“: Ausstellungseröffnung in Lochau

**Stand:** 28.10.2026 · **Rolle:** Creative Director, Wow-Team · **Status:** Vorschlag an den Inhaber, noch nicht freigegeben. Kein Code, nur das Konzept.
**Verbindliche Grundlagen:** Design-Bibel (`expertenrat/00-design-bibel.md`), Jury-Urteil (`qa-screenshots/jury/00-jury-urteil.md`), Inhaber-Entscheidungen (`teamleiter/inhaber-entscheidungen.md`), Kern-USP (`features/usp-handzeichnung-designprozess.md`), Bildrecht (`expertenrat/19-fotografie-bildsprache.md`).

---

## 0. Leitidee in einem Satz

**Die Startseite ist eine Vernissage in einer hellen Galerie am See: Die Kamera geht durch die Säle, ein Werk nach dem anderen bekommt Licht, und neben jedem Werk hängt ein Objektschild, auf dem nicht „Bitte nicht berühren“ steht, sondern „Bitte Platz nehmen.“**

Drei Dinge machen das zur Marke und nicht zum Effekt:
1. **Die Kamera bewegt sich, nicht das Werk.** Herstellerbilder (Minotti und andere) bleiben unverändert, ohne Zuschnitt, Zoom oder Ken Burns. Bewegung haben nur Wand, Licht, Schild, Schrift und Horizontlinie. So setzen wir die Rechtegrenze als Gestaltungsregel um, statt sie zu umgehen.
2. **Das Licht ist echt.** Wie im Bibel-Seelicht wählt der Server die Lichtstimmung nach der Uhrzeit in Lochau. Dazu kommt eine kleine, nachprüfbare Zeile wie „Heute in Lochau: Sonnenuntergang 16:58“, berechnet aus Datum und Koordinaten.
3. **Der Rundgang endet am Zeichentisch.** Ein dunkles Kapitel (Walnut, das eine erlaubte) zeigt Haralds Weg von der Handzeichnung über das Modell und das 3D-Modell zum Foto, und zwar nur mit echtem Material.

---

## 1. Recherche: Was die eindrucksvollsten Sites heute können und was wir nicht kopieren

### 1.1 Sichtung (Stand 28.10.2026)

**Awwwards, Sites of the Month 2025–2026.** Die Liste wurde am 28.10.2026 von awwwards.com abgerufen:

| Monat | Site | Studio |
|---|---|---|
| 09/2026 | Why Zero | Sindhur Dutta |
| 08/2026 | ERA Residence | The First The Last |
| 07/2026 | Lama Lama | Lama Lama |
| 06/2026 | Son Daven | The First The Last |
| 05/2026 | Floema | Bürocratik |
| 04/2026 | Oryzo AI | Lusion |
| 03/2026 | GQ & AP The Extraordinary Lab | Immersive Garden |
| 02/2026 | The Renaissance Edition | Shopify Design |
| 01/2026 | Bruno's Portfolio | Bruno Simon |
| 12/2025 | MindMarket | Louis Paquet |
| 10/2025 | Ponpon Mania | Patrick Heng |
| 09/2025 | Terminal Industries | REJOUICE |
| 08/2025 | Cartier Watches & Wonders 2025 | Immersive Garden |
| 07/2025 | Tracing Art | Resn |
| 06/2025 | Montfort | Immersive Garden |
| 05/2025 | Anime.js | Julian Garnier |
| 04/2025 | Navigate | Resn |
| 03/2025 | Siena Film Foundation | Niccolò Miranda |
| 02/2025 | Dropbox Brand | Daybreak Studio |
| 01/2025 | Immersive Garden | Immersive Garden |

**Site of the Year 2025:** Laut den Badges in den Awwwards-Listings tragen **Lando Norris (OFF+BRAND)** und **Messenger (abeto)** diese Auszeichnung. Beide haben dazu einen Developer Award. Eine offizielle Jury-Begründung habe ich nicht gefunden. DesignRush beschreibt die Lando-Norris-Site so: Im Hero folgen weiche, reaktive Formen dem Cursor, die Grafiksprache kommt vom Helm, es gibt Neon-Akzente und eine Trennung „On Track / Off Track“.

**Luxus- und Interior-Marken.** Hier stütze ich mich auf meine Kenntnis der Gattung. Neu nachgemessen habe ich nicht, bitte bei Bedarf prüfen:
- **Hermès:** Illustration, Humor und Handwerk als Erzählung. Gezeichnete Figuren sind Teil der Marke.
- **Bottega Veneta:** Logo-Verzicht, große Bildflächen und Stille. Status zeigt sich durch Weglassen.
- **Aesop:** textgeführtes Editorial, warme Papiertöne, Ladenarchitektur als Markenbeweis.
- **Apple:** Produktseiten mit scrollgesteuerten Bildsequenzen und einem großen Satz pro Viewport.
- **Minotti, B&B Italia, Poliform:** Kataloglogik mit Slidern und großen Pressebildern. Die Minotti-Site lädt laut Bibel W19 mit LCP 18,9 s.

### 1.2 Was diese Sites einzigartig macht (Muster)

| Muster | Beispiele | Was es leistet |
|---|---|---|
| **Eine Welt statt einer Seite** | Immersive Garden (Cartier, Montfort, GQ & AP), Bruno Simon, Lusion | Man betritt einen Raum und liest keine Seite. Die Kamera übernimmt die Navigation |
| **Ein grafisches Leitmotiv aus der Marke** | Lando Norris (Helm), Hermès (Zeichnung) | Jede Interaktion sieht aus wie die Marke |
| **Ein Satz, ein Bild, eine Bewegung** | Apple, Bottega Veneta | Wucht durch Reduktion |
| **Editorial als Haltung** | Aesop, Shopify „Renaissance Edition“ | Die Seite liest sich wie ein Magazin, nicht wie ein Shop |
| **Handwerk der Übergänge** | Resn, REJOUICE | Seitenwechsel werden zu Schnitten wie im Film |

### 1.3 Was wir NICHT kopieren (und warum)

| Nicht übernehmen | Grund |
|---|---|
| Preloader mit Prozentzähler, Intro vor dem Inhalt | Verletzt LCP ≤ 2,0 s und P7 und ist das bekannteste Awwwards-Klischee |
| Vollbild-WebGL-Welt als Startseite (Immersive-Garden-Typ) | Initial-JS sprengt das Budget von 150 KB, ohne WebGL bliebe nichts übrig, die Zielgruppe ist 45+ und mobil. Laut Bibel kommt `three` nie ins Initial-Bundle |
| Cursor-Blobs, Neon, Cursor-Spotlight (Lando-Norris-Typ) | Gehört einer fremden Marke, ist auf dem Handy wirkungslos und wirkt laut. Wir sind leiser Luxus (§1) |
| Gepinnte Scroll-Videosequenzen über mehrere Bildschirme (Apple-Typ) | Wirkt wie Scroll-Hijacking, ist schwer, und Herstellerfotos dürfen nicht animiert werden |
| Gezeichnete Figuren oder Illustrationswelt (Hermès-Typ) | Würde KI- oder Fremdzeichnungen nahelegen, die man für Haralds Hand halten könnte (UWG, USP-Regel). Bei uns ist die Hand echt oder sie fehlt |
| Ganzseitig schwarze Bühne mit Gold (Prototyp buehne) | Hat die Jury verworfen (B1 = 1, W5). Unsere Bühne ist eine **helle** Galerie |
| Logo-Verzicht bis zur Unkenntlichkeit (Bottega-Typ) | P4 verlangt ein vertrautes Gerüst: Logo oben links, Termin oben rechts |
| Aesop-Typografie und Aesop-Brauntöne | Die Palette liegt nah an unserer. Wir grenzen uns über Bodoni groß, Objektschilder und Licht ab, nicht über Farbe |

**Folgerung:** Wir übernehmen das Prinzip „eine Welt betreten“ mit der Kamera als Navigation, aber in HTML, CSS und Typografie und nicht in WebGL. Das Leitmotiv kommt aus unserer Sache: Galerie, Objektschild, Licht vom See und die Hand des Designers.

---

## 2. Das Bild der Seite

- **Raum:** Eine helle Galerie mit Wänden in `paper` und `bone`, Boden und Sockel in `stone` und einer durchlaufenden **Horizontlinie** (1 px Ink, 24 %). Die Linie ist Boden der Säle und Seeufer zugleich und zieht sich als **eine** Linie durch alle Säle (Nachtrag N4).
- **Werke:** Produkt- und Raumfotos hängen wie Bilder in einer Ausstellung, im Originalformat und unbeschnitten. Wenn das Format nicht passt, stehen sie auf `linen` im Passepartout. Das gilt für die Kataloglieferung aus `/cmx`, Minotti nur mit Freigabe-Eintrag im Bildregister.
- **Objektschild** (neue Komponente `card-exhibit`, Nachtrag N5): kleines Schild in Instrument Sans, tabellarische Ziffern, alles aus dem Backoffice:
  `Nº 03 · Minotti · Connery · Design Rodolfo Dordoni · Bouclé Écru · B 252 cm · Im Showroom Lochau`
  Letzte Zeile: **„Bitte Platz nehmen.“** Das ist ein Link zu „Probesitzen – Termin wählen“. Die Formel „Im Showroom Lochau“ erscheint nur, wenn das Backoffice das Stück als Ausstellungsstück führt.
- **Typografische Wucht:** Bodoni Moda als Saaltitel und große Werknummern (Nº 01–Nº 12) in `display-stage` (Nachtrag N1). Die Ziffern stehen auf einer eigenen Tiefenebene und gleiten beim Scrollen gegen das Werk. Das ist die „Kamera“.
- **Licht:** Eine warme Lichtfläche (Verlauf auf der **Wand**, nie auf dem Foto) fährt auf, wenn ein Werk in den Blick kommt. Die Farbe kommt aus einem neuen Token `light-warm`, einer Mischung aus paper und brass-400 mit sehr wenig Alpha (Nachtrag N6). Sie zählt nicht in die 2-%-Messinggrenze, weil sie kein Messing zeigt, sondern Licht. Den Kontrast messen wir trotzdem am hellsten Pixel.
- **Dreiländereck als Raum:** Der See-Saal ist der Raum zwischen drei Ufern. Lindau, Bregenz und Rorschach, dazu Vaduz als Ziel ohne Ufer, stehen als Wandbeschriftung in ihrer echten Himmelsrichtung von Lochau aus auf der Horizontlinie, mit Fahrzeit (ca., OSM/OSRM, Stand). Das baut auf Feature 4 (Dreiländer-Karte) auf und ersetzt es nicht.

---

## 3. Die ersten 8 Sekunden

Annahmen: Produktions-Build, mobiles Profil im Moto-G-/Pixel-7-Maßstab, warmer CDN-Cache. „t“ zählt ab Navigationsstart. Ein Hauptereignis pro Moment, mindestens 120 ms Abstand (Bibel §8.2).

### 3.1 Desktop (1440 × 900)

| t | Was man sieht | Was technisch passiert |
|---|---|---|
| 0,0–0,6 s | Weißer Bildschirm, dann sofort die fertige Galerie-Wand in `paper`. Header ohne Animation: Logo links, „Termin“ als `secondary` rechts | Server-HTML mit kritischem CSS kommt an. Bodoni latin (46 KB) und Instrument latin sind vorgeladen, Fallback-Metriken über next/font, damit beim Schrifttausch kein CLS entsteht |
| ≈ 0,6–1,2 s | **Linke Hälfte:** Overline „Einrichtungsstudio & Café · Lochau am Bodensee“. Darunter **H1 in Bodoni 120 px, drei Zeilen: „Italienisches / Wohnen am / Bodensee.“** Darunter klein die SEO-Zeile der bestehenden H1, Knopf „Termin wählen“ und Unterzeile. **Rechte Hälfte:** Werk Nº 01 im Rahmen, sofort voll deckend | **LCP-Element: die H1 (Text)** oder, falls größer, das preloadete Werk-Bild (AVIF ≤ 180 KB, `fetchpriority=high`). Beide sind ohne JS da. Ziel LCP ≤ 1,4 s Labor |
| 1,2–1,8 s | **„Das Licht geht an.“** Auf der Wand hinter Werk Nº 01 fährt die warme Lichtfläche von unten auf, als ob ein Strahler eingeschaltet würde (600 ms, `--ease-quiet`). Das Foto selbst bleibt unverändert | CSS-Keyframe nur auf `opacity` und `transform` einer Pseudo-Ebene. Startet erst, wenn die Schrift steht (CSS-Verzögerung, kein JS nötig) |
| 1,8–2,4 s | Die drei H1-Zeilen haben im ersten Frame bei 0,6 Deckkraft gestanden (Maske höchstens `inset(0 0 35% 0)`) und sind jetzt voll gesetzt. **Alles Lesbare steht still.** | §8.2: H1 nie ganz versteckt. Lesbares steht nach ≤ 1100 ms ab erstem Paint still |
| 2,4–3,6 s | **Die Horizontlinie zieht sich** auf 38 % der Hero-Höhe einmal von links nach rechts über die ganze Breite. Sie läuft unter dem Werk durch wie der Boden der Galerie (1200 ms, `--ease-drift`) | Einmalig zeitgesteuert statt scrollgetrieben (Nachtrag N2). Ohne Unterstützung oder bei Reduced Motion steht sie fertig da |
| 3,6–4,2 s | Neben dem Werk erscheint das **Objektschild Nº 01** (Fade 600 ms, 8 px Hebung): Marke, Modell, Designer, Material, Maß, „Im Showroom Lochau“, **„Bitte Platz nehmen.“** | Text steht von Anfang an im HTML (für Screenreader und ohne JS), nur die Sichtbarkeit wird animiert. Nie unter 0,6 Deckkraft |
| 4,2–8,0 s | **Ruhe.** Unten rechts eine einzige Zeile: „Heute in Lochau · Sonnenuntergang 16:58 · Café geöffnet bis 18:00“. Am rechten Rand ein schmaler **Saalplan** „01 Wohnen · 02 Küche · 03 See · 04 Werkstatt · 05 Café“ als echte Ankerlinks. Kein Pfeil hüpft, nichts blinkt | Die Zeile kommt aus einer gecachten Server-Komponente (`'use cache'`, 15 min) und derselben Öffnungszeiten-Quelle wie das JSON-LD. Die Sonnenzeit wird serverseitig aus Datum und Koordinaten berechnet, ohne neues Paket |

**Die Wow-Wirkung entsteht hier nicht durch einen Effekt, sondern durch ein Bild, das man so noch nicht gesehen hat:** riesige Bodoni-Schrift, ein einziges gerahmtes Werk mit Museumsschild und Licht, das „angeht“. Es wirkt wie das Aufschlagen eines großformatigen Magazins.

### 3.2 Handy (390 × 844)

| t | Was man sieht | Technik |
|---|---|---|
| 0,0–0,6 s | Header 56 px mit Wortmarke 20 px und Menü | Server-HTML |
| ≈ 0,6–1,3 s | Overline, darunter **H1 Bodoni 48 px auf vier Zeilen** („Italienisches / Wohnen / am / Bodensee.“), Knopf „Termin wählen“ und Unterzeile. Darunter, angeschnitten durch die Falz, der obere Teil von **Werk Nº 01 im 4:5-Rahmen**, damit im ersten Viewport ein Bild steht (Jury P0-5) | LCP ist die H1. Bild-Preload 4:5 AVIF ≤ 120 KB per `<picture>`, mobil eine eigene Datei statt eines Ausschnitts. Herstellerbilder im Originalformat mit Passepartout |
| 1,3–1,9 s | Das Licht geht hinter dem angeschnittenen Werk an (600 ms) | CSS |
| 1,9–3,1 s | Die Horizontlinie zieht sich unter dem Knopf über die volle Breite (1200 ms) | CSS, einmalig |
| 3,1–8,0 s | Ruhe. Beim ersten Wischen erscheint mit dem Werk das Objektschild **unter** dem Bild (nicht daneben), mit „Bitte Platz nehmen.“ in 44 px Trefferhöhe. Die mobile CTA-Leiste erscheint erst, wenn „Termin wählen“ aus dem Viewport ist | `animation-timeline: view()` hinter `@supports`, sonst steht alles still |

Mobil gibt es **keine Parallax-Ebene der Werknummern** (Akku, Ruhe). Die Kamera-Bewegung reduziert sich dort auf Licht und Schild.

---

## 4. Was beim Scrollen folgt: der Rundgang

Natives Scrollen, kein Lenis, kein Pinning über mehr als einen Bildschirm, kein Einrasten. Jeder Saal ist ein normaler Abschnitt. „Kamera“ bedeutet: Die Ebenen Wand, Werknummer, Schild und Linie bewegen sich unterschiedlich schnell, gesteuert von CSS-Scroll-Timelines und innerhalb der Bibel-Grenzen (Parallax ±6 %, Text ≤ 24 px). Werke bewegen sich nie.

| Saal | Inhalt | Die eine Hauptbewegung | Bibel-Bezug |
|---|---|---|---|
| **Saal 01 Wohnen** | 3 Werke nacheinander (Sofa, Tisch, Leuchte), asymmetrisch gehängt in den Spalten 2–6 und 8–12. Saaltitel Bodoni groß | Jedes Werk bekommt **Licht**, wenn es zu 20 % sichtbar ist. Die Werknummer gleitet gegen das Bild (Kamera-Schwenk) | §6 Asymmetrie, §10.2 vier Räume |
| **Saal 02 Küche** | Ein Werk über die volle Breite (eigenes oder freigegebenes Küchenfoto). Herkunft steht auf dem Schild (Binni nie als „italienisch“) | **Kamerafahrt:** Die Wand mit dem Saaltitel bleibt zurück, das Bild kommt näher. Das Bild selbst skaliert nicht, nur der Passepartout-Rand wird schmaler (≤ 14 %) | §14 Herkunft, §8.2 Masken ≤ 14 % |
| **Saal 03 See / Draußen** | Die Horizontlinie wird zum Ufer. Die Namen Lindau (DE), Bregenz (AT) und Rorschach (CH) stehen in ihrer Himmelsrichtung, jeweils mit Fahrzeit „ca.“, Lieferweg und Währung (EUR/CHF). Dazu ein Outdoor-Werk | Die Ortsnamen erscheinen gestaffelt (3 Elemente, 60 ms). Antippen zeigt Fahrzeit und Lieferweg **sofort** (Feature 4) | Feature 4, C6, OSM/ODbL-Hinweis |
| **Saal 04 Werkstatt (das eine dunkle Kapitel, Walnut)** | **Haralds Zeichentisch.** Ein Projekt in **vier Zuständen:** Handzeichnung → Modell → 3D → fertiges Foto. Vier gleich große Rahmen nebeneinander (Desktop) oder als Scroll-Snap-Folge mit Zähler „2 / 4“ (Handy). Darunter die 7 Schritte des Prozesses als Linkzeile zur Seite „Unsere Arbeitsweise“ | Beim Scrollen wird der jeweils mittlere Zustand **beleuchtet**, die anderen treten zurück. Zusätzlich Knöpfe „Skizze · Modell · 3D · Foto“ für Tastatur und Wischen (WCAG 2.5.7). Die einzige Messinglinie liegt über der Walnut-Fläche | USP-Pflicht „dunkles Kapitel“, §4.2 Walnut 1×, nur echtes Material |
| **Saal 05 Café** | Porträt der Gastgeberin mit direktem Blick, „Erst ein Kaffee. Dann das Sofa.“, Öffnungszeiten | Keine eigene Bewegung, nur Licht. Hier darf der Haus-Loop laufen (Poster, nach `load`, Pause) | P1 Gesicht, W12 Video nur unten |
| **Ausgang** | Bodoni-Zeile **„Nehmen Sie Platz. Wir nehmen uns Zeit.“** und „Termin wählen“ mit Unterzeile. TrustBlock im Viewport davor | Die Horizontlinie endet hier, an der Bühnenkante | W15, C3 |

**Übergang Werk → Produkt („Werk öffnen“):** Ein Klick auf ein Werk öffnet die Produktseite mit der Bibel-View-Transition (Katalogbild → Produktbild, 400 ms). Das Werk „kommt von der Wand in die Hand“. Das Bild wird dabei nur als Ganzes verschoben und skaliert, nicht beschnitten oder verändert. Ob das bei Minotti von der Freigabe gedeckt ist, prüft das Rechtsteam (siehe Risiken).

**Ausstellungskatalog:** Das ♡ auf jedem Objektschild legt das Werk in „Ihre Auswahl“. Die Auswahlseite heißt im Ton dieser Richtung „Ihr Ausstellungskatalog“, als PDF zum Mitnehmen in den Termin (Feature 3, C5). Das ist ein Vorschlag, die Werbetexter entscheiden.

---

## 5. Technik: wie LCP ≤ 2,0 s erreichbar bleibt

**Grundsatz: Server-HTML ist der fertige Ausstellungsraum, die Effekte sind nur die Beleuchtung.** Ohne CSS-Animationen, ohne JS und ohne WebGL ist die Seite vollständig, lesbar und verkauft.

1. **Einstieg hinter `NEXT_PUBLIC_WOW_HERO`:** Der Schalter steht in `src/components/Home/Hero.js` inline. Dev-Default ist an, Produktion erst nach Inhaber-Freigabe. Der alte Hero bleibt als Fallback. Neue Bausteine liegen ausschließlich in `src/components/Wow/**` und `src/lib/wow/**`.
2. **Server Components zuerst, 0 KB JS für den Auftakt:** Licht, Linie und Schild-Einblendung sind reine CSS-Keyframes. Saal-Effekte laufen über `animation-timeline: view()` hinter `@supports`. Browser ohne Unterstützung zeigen den Endzustand.
3. **LCP-Kandidat bewusst wählen:** Die H1 in Bodoni ist im ersten Paint da. Bodoni latin wird vorgeladen (eine Datei, 46 KB), Instrument latin als zweite (≤ 90 KB zusammen). `next/font` setzt die Fallback-Metriken, damit der Schrifttausch keinen CLS erzeugt. Ist das Werk-Bild größer als die H1, wird es LCP. Deshalb wird es immer **preloadet** (`<link rel=preload>` je Medienabfrage, `fetchpriority=high`, AVIF ≤ 120 KB mobil, ≤ 180 KB Desktop), wie es der aktuelle Hero schon macht.
4. **Keine Animation am LCP-Element:** Die H1 steht im ersten Frame mindestens zu 65 % sichtbar, das Werk-Bild ist sofort voll deckend. Animiert werden nur Geschwister-Ebenen (Licht, Linie, Schild).
5. **CLS < 0,05:** Jeder Rahmen hat eine feste `aspect-ratio`. Schild und Lichtfläche sind reserviert (absolute Ebenen), die Live-Zeile hat eine feste Höhe. Die Saalplan-Insel verändert kein Layout.
6. **Eine Mini-Insel (≤ 3 KB):** Nur der aktive Zustand des Saalplans (`aria-current` per IntersectionObserver) und die Knöpfe im Werkstatt-Saal brauchen JS. Erst nach `load` hydriert. Kein `motion` nötig, bei Bedarf höchstens `LazyMotion` mit asynchronen Features.
7. **Seelicht und Sonnenzeit:** Eine gecachte Server-Komponente (`'use cache'`, `cacheLife` stale 300 / revalidate 900, Bibel §12.1) wählt eine von vier Lichtstimmungen als CSS-Variable und rechnet die Sonnenzeit in `src/lib/wow/` (bekannte astronomische Formel, ohne Paket). Voraussetzung `cacheComponents` (§13), bis dahin statisch mit Revalidierung.
8. **WebGL nur als Zugabe, nie als Bedingung:** Phase 1 hat kein WebGL (W17). Für Phase 2 ist ein optionaler „Modell“-Zustand im Werkstatt-Saal denkbar: Haralds echtes Raummodell als fotogrammetrisches 3D-Objekt aus echten Fotos, gerechnet auf der lokalen GPU-Pipeline. Er lädt erst nach Klick auf „Modell drehen“ (dynamischer Import von R3F/drei) mit Poster als Fallback. Ohne WebGL bleibt das Foto des Modells.
9. **Reduced Motion und „Ruhige Ansicht“ vollwertig:** Alles steht im Endzustand. Das Licht ist an, die Linie gezogen, die Schilder sind sichtbar, die Werknummern stehen. Es gibt kein Video-Autoplay, Übergänge dauern ≤ 120 ms. Der Inhalt bleibt identisch.
10. **Prüfung:** Playwright-Videos (`recordVideo`) und Bildfolgen der ersten 8 s auf Desktop und Handy. Tests unter `tests/**/wow*` prüfen: LCP-Element ist H1 oder preloadetes Bild, CLS < 0,05 per PerformanceObserver, `[data-surface="inverse"]` genau einmal, Reduced Motion zeigt den Endzustand, Tastaturweg durch Saalplan und Werkstatt-Knöpfe, ohne JS lesbar. Gemessen wird am Dev-Server nur relativ. Die harte Messung erfolgt im Produktions-Build durch das zuständige Team, nicht durch uns mit `npm run build` im Repo.

---

## 6. Benötigtes Material

| # | Material | Quelle | Status | Ohne Material |
|---|---|---|---|---|
| M1 | **Werk Nº 01** für den Hero: eigenes Showroom-Foto in 4:5 und 3:2 oder 21:9, Seelicht-Stimmung | Shooting Tag 1 (§7) | fehlt, heute `aboutHome.jpg` | `aboutHome.jpg` als Werk im Rahmen, ehrlich als Showroom-Bild |
| M2 | 6–9 weitere Werke (Wohnen, Küche, Outdoor) | Katalog `/cmx` mit Bildregister-Eintrag. Minotti nur mit Freigabe und unverändert | teilweise | nur Werke mit Freigabe-Eintrag, sonst eigene Fotos |
| M3 | Objektschild-Daten: Marke, Modell, Designer, Material, Maß, Herkunftsland, „im Showroom“ ja/nein | Backoffice (Frappe) | vorhanden, „im Showroom“ prüfen | Zeile „Im Showroom Lochau“ entfällt |
| M4 | **Vier-Zustände-Kette eines echten Projekts:** Haralds Skizze (Scan), Modellfoto, 3D-Rendering, Foto der Umsetzung, mit Kunden-Einwilligung oder anonymisiert | Inhaber, Harald | **fehlt (Inhaber-Lieferung steht aus)** | Werkstatt-Saal zeigt die 7 Schritte typografisch und Harald selbst (Porträt). Keine Platzhalterbilder im Livegang, keine KI-Skizzen |
| M5 | Porträt Harald am Zeichentisch | Shooting | fehlt | Saal ohne Porträt, nur Text und Prozess |
| M6 | Porträt der Gastgeberin, Café-Bild | Shooting Tag 2 | fehlt | bestehende Vernissage-Bilder mit Register-Eintrag |
| M7 | Fahrzeiten Lindau, Bregenz, Rorschach, Vaduz | OSM/OSRM mit Stand | im Feature 4 | Saal 03 ohne Zeiten, nur Namen und Währung |
| M8 | Verifizierte Koordinaten Showroom (Bibel §16 offen) | Inhaber oder Vermessung | offen | keine Koordinaten-Overline, Sonnenzeit auf Lochau-Ortsmitte gerechnet und so bezeichnet |
| M9 | Optional Phase 2: 40–80 Fotos von Haralds echtem Modell rundum | Harald | fehlt | entfällt |
| M10 | Texte DE/EN/FR/IT (Saaltitel, Schildformel, „Bitte Platz nehmen.“) | Vorschlag in `features/wow-messages-vorschlag.json` | separat zu liefern | – |

---

## 7. Risiken und Gegenmaßnahmen

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| **Kern-Material M4 kommt spät** | Der stärkste Moment (Hand → Foto) fehlt, der Rundgang endet ohne Höhepunkt | Werkstatt-Saal so bauen, dass er mit 0 bis 4 Zuständen funktioniert. Freigabe des Livegangs erst mit mindestens Skizze und Foto. Lieferung beim Inhaber als P0 anmahnen |
| **Galerie wirkt kühl, „nicht anfassen“** | Widerspricht Gastgeber (P1) und Anfassen (P6) | Umkehrung auf jedem Schild: „Bitte Platz nehmen.“ Café-Saal, Gesichter, Licht warm. Im Fünf-Sekunden-Test „einladend“ abfragen |
| **Herstellerbild-Rechte** | Abmahnung oder Freigabe-Entzug (Renckhoff, Minotti-Bedingungen) | „Die Kamera bewegt sich, nicht das Werk“ als feste Regel. Nur Bilder mit Register-Eintrag. Die View-Transition des Bildes vor dem Livegang rechtlich prüfen, sonst Crossfade |
| **LCP verschiebt sich auf das Bild** | LCP > 2,0 s mobil bei langsamer Verbindung | Bild immer preloaden und im Budget halten. Im Test prüfen, welches Element LCP ist. Notfalls Werk mobil unter die Falz, dann ist die H1 sicher LCP |
| **Riesen-Bodoni und 200 % Zoom, lange Wörter** | Umbrüche, Überlauf bei 360 px | `display-stage` höchstens 2,5-fach (48–120 px), `text-wrap: balance`, Silbentrennung je Locale. Französisch und Italienisch testen („Italien“ und „Bodensee“ sind lange Zeilen) |
| **Scroll-Timelines in Safari und Firefox uneinheitlich** | Effekte fehlen | Endzustand ist der Standard, Effekte nur per `@supports`. Kein Inhalt hängt an der Animation |
| **„Zu viel Kunst, zu wenig Verkauf“** | Weniger Termine | CTA im ersten Viewport, auf jedem Schild ein Termin-Link, TrustBlock vor dem Ausgang. Termin-Quote messen und gegen den alten Hero A/B-testen (Schalter erlaubt das) |
| **Mehrere Bewegungen gleichzeitig** | Unruhe, P7 verletzt | Choreografie-Tabelle aus Abschnitt 3 als Testfall. Video-Bildfolge prüft, dass nie zwei Hauptbewegungen überlappen |
| **Zielkonflikt mit der Bibel** | Abnahme scheitert | Abweichungen nur als Nachtrag N1–N7 (Abschnitt 9), Entscheidung durch den Kreativdirektor der Bibel |
| **Parallelteams an der Startseite** | Doppelte Kapitel (Räume, Haus & Café, Dreiländer) | Die Säle sind eine Inszenierung, kein Ersatz. Wow-Team liefert Hero und Rahmenkomponenten, Inhalte der Abschnitte bleiben bei den Teams. Abstimmung, bevor Säle über den Hero hinaus gebaut werden |

---

## 8. Warum das noch niemand im Markt hat

Das ist meine Einschätzung aus der Sichtung der Benchmarks in Bibel §15 (Höttges, reiter, Fretz, Gamma, Minotti) und der Awwwards-Liste oben. Eine öffentliche Aussage wie „als Erste“ machen wir daraus **nicht**, das wäre ein Superlativ.

1. **Händler- und Studio-Sites** zeigen Kataloge: Slider mit Pressebildern, die 200 andere Händler auch haben. Niemand behandelt das einzelne Stück wie ein Werk mit Schild, Maß, Standort und Einladung zum Probesitzen.
2. **Die Awwwards-Spitze** baut WebGL-Welten für Uhren, Rennfahrer und Agenturen. Die sind schwer, langsam für 45+ auf dem Handy und haben nichts mit einem echten Ort zu tun. Unsere Welt ist echt: echtes Licht nach Ortszeit, echte Ufer, echte Fahrzeiten.
3. **Herstellerseiten dürfen** nicht von „Bitte Platz nehmen“ sprechen. Sie haben keinen Showroom mit Café am See, keinen Designer, der von Hand zeichnet, und kein Dreiländereck.
4. **Die Rechtegrenze als Stil:** Weil Herstellerbilder unberührt bleiben müssen, bewegt sich bei uns der Raum um das Bild. Das kopiert man nicht einfach, weil es eine Haltung voraussetzt: Kurator statt Katalog.
5. **Der Rundgang endet bei einem Menschen**, bei Haralds Hand, und nicht bei einem Warenkorb.

---

## 9. Vorgeschlagene Nachträge zur Design-Bibel (Abschnitt 16, zur Entscheidung)

| # | Thema | Bibel heute | Vorschlag | Begründung |
|---|---|---|---|---|
| N1 | Hero-Schriftgröße | `display-xl` 48–96 px | Neu `display-stage` 48–120 px (Faktor 2,5, zoomfest), **nur** auf der Startseite und 1× pro Seite. Werknummern Nº im selben Token | Die typografische Wucht ist der Wow. 120 px auf 1440 px bleibt innerhalb der Zoomregel aus §5 |
| N2 | Horizontlinie im Hero | scrollgetrieben (`animation-range`) | im Hero einmal zeitgesteuert (1200 ms, `--ease-drift`) nach dem Lichtauftakt, danach in den Sälen scrollgetrieben | Der Hero wird nicht gescrollt, sonst wäre die Signatur im ersten Viewport unsichtbar. Atmosphäre ≤ 2400 ms nach §8.2 |
| N3 | Signature-Moment | höchstens 1 pro Seite (Seelicht) | „Vernissage“ ist der eine Signature-Moment der Startseite. Seelicht geht als Lichtregie darin auf | keine zwei Höhepunkte |
| N4 | Horizontlinie pro Seite | höchstens 1 | bleibt 1: **eine** durchlaufende Linie als Boden aller Säle, mit Unterbrechungen nur an Werken | Ein Motiv statt vieler Trenner, keine zusätzliche Linie |
| N5 | Komponente | – | `card-exhibit` (Objektschild) in `components/patterns`, Felder nur aus dem Backoffice, Schlusszeile „Bitte Platz nehmen.“ als Link | P5 (konkret) und P6 (anfassen) in einem Baustein, auch auf Raum-Hubs nutzbar |
| N6 | Farbtoken | 17 Rohwerte | Rolle `light-warm` (abgeleitet aus paper und brass-400, niedrige Alpha), nur als Lichtfläche auf Wänden, nie auf Fotos, nie hinter Text unter 4,5:1 | Licht ist Material (P3), nicht Dekor. Kein Gold als Fläche |
| N7 | Motion-Regel für Fremdbilder | „kein Ken Burns“ (§7.1) | ausdrücklich ergänzen: **„Bei Herstellerbildern bewegt sich der Raum, nicht das Bild“**: keine Skalierung, kein Schnitt, keine Maske im Bild, nur Rahmen, Wand und Licht | macht die Rechte-Regel umsetzbar und zur Gestaltungsidee |

**Unverändert eingehalten:** H1 „Italienisches Wohnen am Bodensee.“ (W15), hell mit einem Walnut-Kapitel (W5), kein Lenis (W1), kein Hero-Zoom oder Hero-Video (W12), Phase 1 ohne WebGL (W17), ein gefüllter Knopf pro Viewport (P2), Reduced Motion und „Ruhige Ansicht“ (§8.4), Händler-Aussagen nur ClassiCon und Ezarri.

---

## 10. Nächste Schritte (Vorschlag)

1. Freigabe der Leitidee und der Nachträge N1–N7 durch den Inhaber und den Bibel-Verantwortlichen.
2. Wow-Team baut den Hero „Vernissage“ hinter `NEXT_PUBLIC_WOW_HERO`, mit Werk Nº 01 aus vorhandenem Material und Objektschild aus dem Backoffice. Prüfung mit Video-Bildfolgen (Desktop und Handy, mit und ohne Reduced Motion, ohne JS).
3. Inhaber liefert M4 und M5. Danach Bau des Werkstatt-Saals in Abstimmung mit dem Team, das das USP-Kapitel der Startseite verantwortet.
4. Fünf-Sekunden-Test (n = 60) Vernissage gegen den heutigen Hero: verstanden, wo und was, „einladend“, Unterscheidbarkeit im Blindtest.

*Quellen der Recherche: awwwards.com/websites/sites_of_the_month/ (abgerufen 28.10.2026), Awwwards-Listings mit SOTY-2025-Badges, designrush.com/best-designs/websites/lando-norris-website-design. Luxusmarken aus eigener Kenntnis, nicht neu vermessen.*
