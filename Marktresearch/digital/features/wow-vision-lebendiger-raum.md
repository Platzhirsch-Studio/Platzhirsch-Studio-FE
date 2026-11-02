# Wow-Vision B: „Der lebendige Raum“

**Rolle:** Creative Director Wow-Team · **Stand:** 28.10.2026 · **Status:** Vorschlag an den Inhaber, kein Code
**Bindung:** Design-Bibel (00), Jury-Urteil, Inhaber-Entscheidungen, USP Handzeichnung. Wo diese Vision von der Bibel abweicht, ist das unter „Nachträge zur Bibel“ (Abschnitt 9) begründet.

---

## 0. Leitidee in einem Satz

**Die Startseite ist kein Bild vom Showroom, sondern ein Fenster hinein: Sie zeigt das Haus in Lochau im Licht, das dort gerade herrscht, mit echten Fotos, echtem Sonnenstand und echtem Wetter. Wer sich bewegt oder etwas berührt, bekommt vom Raum eine Antwort.**

Arbeitstitel nach außen gibt es keinen. Der Besucher soll nichts erklärt bekommen. Er soll merken, dass das Licht stimmt.

---

## 1. Recherche: Was heute beeindruckt und was wir nicht kopieren

### 1.1 Die Referenzen

| Referenz | Was sie einzigartig macht | Was wir **nicht** übernehmen |
|---|---|---|
| **Lando Norris** (OFF+BRAND, Awwwards SOTY 2025) | Eine Person wird als Marke in 3D, Typo und Bewegung inszeniert. Stark durch Haltung und Tempo | Rennsport-Tempo, Vollbild-WebGL als Bühne, Ladebildschirm, eigener Cursor |
| **Messenger** (abeto, SOTY 2025) und **Igloo Inc** (abeto, SOTY 2024) | Eigene Echtzeit-3D-Welten mit eigenen Werkzeugen (Volumen-Exporter, Fluid-Simulation) und Fokus auf kurzer Ladezeit | Eine **erfundene** Welt. Bei uns muss die Welt echt sein. Spielmechanik und Navigation als Rätsel |
| **Hermès 2026** (Neuauftritt Januar 2026, Illustrationen von Lina Merad, danach animierte Papier-Illustrationen von Sarah Martinon und Armand Béraud) | Eine Luxusmarke setzt bewusst auf Handarbeit statt KI: Jede Rubrik hat eine eigene, von Hand gemachte Illustration | Den illustrativen, verspielten Stil. Das ist **die engste Verwandtschaft zu unserem USP** und deshalb die größte Kopiergefahr. Haralds Zeichnungen sind Arbeitsdokumente (Grundriss, Perspektive), keine Deko-Illustrationen. Wir zeigen sie nur echt und nur als Teil eines Projekts |
| **Archviz-Tageslicht-Demos** (z. B. „Time of Day Adjustment“, 3D WebGPU ArchiViz, Awwwards-Element) | Die Tageszeit steuert das Licht in einer 3D-Szene | Es ist ein **gerenderter** Raum, braucht starke GPU, und das Licht ist erfunden. Wir schieben echte Fotos, keine Renderings |
| **Floema** (Bürocratik, SOTM Mai 2026, Kategorie Architektur) und **Tecnoarreda** (Honorable Mention 07/2026, Interior) | Ruhige, editoriale Innenarchitektur-Auftritte mit GSAP-Feinarbeit | Sie stehen für den Standard der Branche: dunkle Paletten, Bildmasken, Text-Reveals. Diese Mittel kennt der Markt schon |
| **Apple-Produktseiten** | Scroll treibt Bildsequenzen an, Text und Bild im Gleichtakt | Lange gepinnte Abschnitte, bei denen man scrollt und nichts weitergeht. Das grenzt an Scroll-Hijacking |
| **Aesop** (Website von Pollen) | Architektur und Material der Läden werden zur Erzählung, mit sehr ruhiger Typo | Den Aesop-Ton als Vorlage. Wir sind Gastgeber mit Café, nicht Apotheke |
| **Minotti, B&B, Poliform, Molteni** | Video-Heroes und Kataloge, die nach Marke aussehen | Video als Hero (W12) und Ladezeiten wie bei Minotti (LCP 18,9 s laut Bibel) |

### 1.2 Was alle Preisträger gemeinsam haben, und warum wir anders gewinnen

Die Awwwards-Sieger beeindrucken mit **Aufwand**: eigene 3D-Welten, Ladebildschirme, sechsstellige Budgets. Der Besucher staunt über die Agentur.

Unser Besucher soll über **den Ort** staunen. Das Wow entsteht nicht durch Technik, die man sieht. Es entsteht durch einen Moment des Erkennens: *„Moment – das ist ja jetzt da drüben so hell.“* Das ist kein Effekt, sondern ein Beweis. Unsere Haltung ist leiser Luxus (Bibel §1.2): Der Wow-Moment darf nicht laut sein. Er muss **wahr** sein.

### 1.3 Verbotsliste (aus der Recherche abgeleitet)

Preloader und Ladebalken. Eigener Cursor, magnetische Knöpfe. Lenis und Smooth-Scroll. Buchstaben-Splitting. Körnungs- und Rausch-Overlays. Gerenderte Möbel von Designerstücken in 3D ohne Lizenz (Mio/konektra). KI-generierte Räume, Skizzen oder Seeblicke. Musik oder Ton mit Autoplay. Vollbild-WebGL im Hero. Getönte oder sonst veränderte Herstellerbilder (Minotti: keine Veränderung).

---

## 2. Die vier Bausteine

1. **Seelicht live:** Der Hero zeigt das Showroom-Foto aus einer echten Tagesreihe (Stativ, eine Position, Aufnahmen vom Morgen bis in die Nacht). Gewählt wird das Bild, das zur aktuellen Uhrzeit in Lochau passt. Das ist die Bibel-Idee „Seelicht“ (§12.1), konsequent zu Ende gedacht: kontinuierlich statt 4 Fenster, Sonnenstand statt Uhrzeit-Block, auf Wunsch mit dem Wetter.
2. **Licht auf dem Papier:** Dasselbe Licht fällt auch auf die Seite. Auf der Papierfläche (`surface`) neben dem Foto liegt ein weiches Lichtfeld aus dem Fenster, mit dem Faltenwurf der Vorhänge (die Vorhänge sieht man auf dem echten Showroom-Foto). Winkel, Länge und Wärme folgen dem Sonnenstand in Lochau. Am Abend wird daraus ein warmer Lampenschein, nachts ein gedämpftes Papier. **Nur reines CSS, keine Bilddatei, keine Tönung von Fotos.**
3. **Der Raum antwortet:** Es gibt genau drei Antworten, keine Spielerei:
   - Fokus oder Hover auf „Termin wählen“: Der leere Sessel vorn im Bild bekommt Licht. Das ist **„Nehmen Sie Platz.“ ohne Worte**, denn der freie Platz gehört Ihnen.
   - Lichtregler am Foto („Jetzt · Morgen · Mittag · Abend · Nacht“): Der Besucher kann den Tag selbst durchgehen, als Wechsel zwischen echten Fotos.
   - Im Kapitel Material: Licht mit Finger, Maus oder Pfeiltasten über echte Materialproben führen (Abschnitt 4.3).
4. **Der Raum atmet, einmal:** Kurz nach dem Laden nimmt der Raum **einmal** das aktuelle Licht an, wie ein Atemzug, mit einem Crossfade von Foto und Lichtfeld. Danach ruht er und bewegt sich nur noch, wenn der Besucher etwas tut. Kein Dauerloop, also auch kein Konflikt mit WCAG 2.2.2.

---

## 3. Die ersten 8 Sekunden

Annahmen: Desktop 1440 × 900 mit Kabel, Handy Moto-G-Klasse 390 × 844 über langsames 4G (Lighthouse-Profil). Besuch am Mittwoch um 16:40 Uhr Ortszeit Lochau, klarer Himmel, die Sonne steht tief im Südwesten.

### 3.1 Desktop

| Zeit | Was der Besucher sieht | Was technisch passiert |
|---|---|---|
| **0,0–0,3 s** | Noch nichts | HTML kommt aus dem statischen Shell. Ein Inline-Skript im Hero (< 1 KB) berechnet die Ortszeit in Europe/Vienna und den Sonnenstand für Lochau und setzt CSS-Variablen am Hero |
| **0,3–0,6 s** | **Erster Frame:** Papierfläche, darauf schräg das warme Lichtfeld des Nachmittags, das über Overline und H1 fällt. Overline „Lochau am Bodensee · 16:40 · Nachmittagslicht“. H1 „Italienisches Wohnen am Bodensee.“, Lead, „Termin wählen“. Rechts der Bildrahmen in der Dominanzfarbe des Fotos | Die Schriften sind vorgeladen. Das Lichtfeld ist ein CSS-Verlauf mit Maske und braucht 0 Netzwerk. Die Position ist fix, Layout-Werte ändern sich nicht, CLS 0 |
| **0,6–1,2 s** | Das Showroom-Foto steht da, sofort voll deckend (W12). **LCP** | Vorgeladenes AVIF (Basisbild der Reihe, ≤ 180 KB) |
| **1,2–1,8 s** | Ruhe. Der Besucher liest die H1 | `load`. Danach lädt im Leerlauf das zeitpassende Foto der Tagesreihe (≤ 180 KB) und die Insel (≤ 10 KB gzip) |
| **1,8–4,2 s** | **Der Atemzug:** Das Foto nimmt das Licht von 16:40 an. Die Sonne steht flacher, die Vorhänge leuchten, der Boden wird wärmer. Gleichzeitig zieht das Lichtfeld auf dem Papier um wenige Pixel nach und wird eine Spur wärmer. Eine einzige Bewegung, 2400 ms, `--ease-drift` | Zweites `<img>` gleicher Größe über dem LCP-Bild, Opacity 0 → 1. Lichtfeld: `transform` und `opacity`. Läuft nur einmal pro Besuch |
| **4,2–6,0 s** | Stillstand. Unter dem Foto erscheint dezent der Lichtregler (Opacity, 280 ms): „◐ Jetzt · Morgen · Mittag · Abend · Nacht“ | `radiogroup`, mit Tastatur bedienbar, 44 px Ziele |
| **6,0–8,0 s** | Bewegt der Besucher die Maus zu „Termin wählen“, wird es auf dem leeren Sessel vorn im Bild heller (240 ms). Verlässt er den Knopf, geht das Licht zurück | Crossfade auf eine echte Aufnahme „Sessel mit Licht“ aus dem Shooting. Gilt für Hover **und** Tastaturfokus |

Das Erkennen kommt meist zwischen 2 und 5 Sekunden: Die Seite hat das Licht verändert, ohne dass jemand geklickt hat, und die Uhrzeit in der Overline stimmt. Wer dann den Regler auf „Nacht“ stellt, sieht denselben Raum mit den Flos-Leuchten an und dem See schwarz hinter den Vorhängen (je nach Lage). Das ist der Moment, den man weitererzählt.

### 3.2 Handy

| Zeit | Was der Besucher sieht | Was technisch passiert |
|---|---|---|
| **0,0–0,9 s** | Nichts bzw. die weiße Seite des Browsers | HTML im langsamen 4G-Profil |
| **0,9–1,3 s** | **Erster Frame:** Overline „Lochau · 16:40 · Nachmittagslicht“, H1, „Termin wählen“. Das Lichtfeld fällt schräg über den oberen Bildschirmrand, so als läge das Handy auf einem Tisch am Fenster | Inline-Skript und CSS wie am Desktop. **LCP-Kandidat ist die H1** (Text, Server-HTML) |
| **1,3–1,9 s** | Das Foto erscheint unter den Knöpfen (eigenes 4:5- bzw. 3:2-Motiv per Art Direction), sofort deckend | Vorgeladene 750/1080-w-Variante, ≤ 40 KB AVIF. Ist es größer als die H1-Fläche, wird es LCP, Ziel ≤ 1,9 s |
| **1,9–2,5 s** | Ruhe | `load`. Das zeitpassende Foto wird **nur** geladen, wenn das Bild im Viewport ist, `Save-Data` aus ist und `effectiveType` mindestens 4g meldet |
| **2,5–4,9 s** | **Der Atemzug** wie am Desktop. Bei schwacher Verbindung bleibt nur das CSS-Lichtfeld (0 KB) | wie oben |
| **4,9–8,0 s** | Unter dem Foto steht der Lichtregler als waagerechte Chips. **Wischen über das Foto** wechselt die Tageszeit (die Chips machen dasselbe, WCAG 2.5.7). Die mobile CTA-Leiste kommt erst, wenn „Termin wählen“ aus dem Viewport ist (P2) | Pointer-Events mit horizontaler Schwelle, `touch-action: pan-y`: vertikales Scrollen bleibt nativ |

Auf dem Handy gibt es kein Hover. Den Sessel-Moment bekommt der Besucher dort beim **Antippen** von „Termin wählen“: Während der Übergang zur Terminseite läuft (≤ 400 ms, View Transition), leuchtet der Sessel auf. Der Moment taucht dann im Schluss-Kapitel wieder auf (Abschnitt 4.5).

### 3.3 Ohne JS, ohne WebGL, mit Reduced Motion

- **Ohne JS:** Foto und H1 sind da. Das Lichtfeld erscheint in einer neutralen Tagesvariante (Standardwerte im CSS). Die Overline zeigt den Ort, aber keine Uhrzeit. Der Regler fehlt. Nichts ist kaputt.
- **Ohne WebGL:** Betrifft nur das Material-Kapitel (4.3). Alles im Hero läuft ohne WebGL.
- **Reduced Motion oder „Ruhige Ansicht“:** Kein Atemzug. Das Lichtfeld steht still in der richtigen Stellung. Der Regler wechselt die Fotos ohne Übergang (≤ 120 ms Opacity). Der Sessel bekommt sein Licht ohne Animation. Die Uhrzeit-Wirkung bleibt vollständig erhalten, denn sie hängt nicht an Bewegung.

---

## 4. Was beim Scrollen folgt

Prinzip: **Die Seite ist ein Tag im Haus.** Natives Scrollen, keine gepinnten Endlos-Abschnitte. Scroll-Effekte nur per `animation-timeline: view()` hinter `@supports`, ohne Unterstützung steht alles fertig da (§8.2). Die Kapitel 4.1, 4.3 und 4.5 gehören dem Wow-Team. Die übrigen Startseiten-Abschnitte bauen andere Teams, die hier gezeigte Reihenfolge ist ein Vorschlag zur Abstimmung.

### 4.1 Hero verlassen: Das Licht geht mit

Beim Herausscrollen aus dem Hero wandert das Lichtfeld auf dem Papier in Scrollrichtung mit (höchstens ±6 %, Bibel-Parallaxgrenze) und streift die Horizontlinie (Bibel §8.3), die sich darunter zeichnet. Das ist die Verbindung zur Bibel-Signatur und keine zweite Hauptbewegung.

### 4.2 Weiche und Räume (andere Teams)

Die Lichtvariablen gelten nur im Hero. Die Räume darunter bleiben ruhig auf Papier, damit Produkte farbtreu bleiben (Materialbilder ΔE ≤ 3, §7.3).

### 4.3 „Unter dem Licht“: Material berühren (Wow-Team)

Ein Kapitel mit 6–8 echten Materialproben aus dem Haus: Bouclé, Leder mit Naht, Nussbaum, Eiche geräuchert, Marmor bzw. Binni-Stein (Herkunft angeben, §14), **Ezarri-Glasmosaik** (Händlerstatus belegt), Messing, Leinen.

- Jede Probe ist mit **Reflectance Transformation Imaging (RTI)** aufgenommen: dieselbe Probe, 36–48 Fotos mit Licht aus verschiedenen Richtungen. Daraus wird pro Pixel berechnet, wie die Oberfläche auf Licht reagiert. Das Verfahren stammt aus der Museumsdokumentation (Münzen, Inschriften). Es zeigt **echte Oberflächen**, nichts ist erfunden oder gerendert.
- Der Besucher führt das Licht mit Finger oder Maus über die Probe. Das Bouclé wirft Schatten in die Schlingen, die Glasmosaik-Steine von Ezarri blitzen einzeln auf, die Naht im Leder wird plastisch. Hier passiert, was der Showroom im Netz bisher nicht konnte: **Anfassen vorstellbar machen** (Bibel P6, Peck & Shu 2009).
- Ohne Eingabe steht das Licht dort, wo die Sonne in Lochau gerade steht. Das ist dieselbe Uhr wie im Hero.
- **Tastatur:** Die Probe ist fokussierbar, die Pfeiltasten bewegen das Licht, dazu kommen Knöpfe „Licht von links · oben · rechts · flach“ (2.5.7). Unter jeder Probe steht eine Zeile Text: Material, Herkunft, „im Showroom zum Anfassen“ und „Muster zum Termin bereitlegen“ (Bibel-Feature 2).
- **Ohne WebGL oder mit Reduced Motion:** 3 echte Fotos pro Probe mit Licht von links, oben und flach, umschaltbar per Knopf, mit Crossfade 240 ms bzw. ohne Übergang.

### 4.4 „Von der Linie zum Raum“: der USP (gemeinsam mit dem USP-Kapitel)

Eine Kette aus **einem echten Projekt**: Handzeichnung, Modell, 3D-Planung, Rendering, Foto der Umsetzung. Beim Scrollen schiebt sich jede Stufe deckungsgleich über die vorige. Die Perspektivlinien der Zeichnung laufen auf denselben Fluchtpunkt zu wie das Foto am Ende. Die Linie wird zum Raum.

- **Bis Haralds Material da ist:** abstrakte Konstruktionslinien (Fluchtlinien, Achsen, Maßketten) als SVG, die sich per `stroke-dashoffset` scrollgetrieben zeichnen, klar als Grafik erkennbar und nie als Haralds Zeichnung ausgegeben. Daneben die markierten Platzhalter „Bild folgt“ nach USP-Regel. Vor dem Livegang kein Platzhalter sichtbar.
- Haralds Name steht neben der echten Zeichnung, mit Rolle nach Inhaber-Bestätigung.
- `three`/R3F nur, falls später ein **echtes** Modell gescannt wird (Fotogrammetrie des Kartonmodells, nicht des Designermöbels). Dann ausschließlich nach Klick auf „Modell drehen“ und nie im Initial-Bundle (§13).

### 4.5 Schluss: „Nehmen Sie Platz.“ (Peak-End, gemeinsam mit dem Schluss-CTA)

Das Abendbild der Tagesreihe, aber nicht als großes Vollbild, sondern als Ausschnitt: der leere Sessel aus dem Hero, jetzt mit seinem Licht. Darunter in Bodoni „Nehmen Sie Platz. Wir nehmen uns Zeit.“ (W15, einmal pro Seite) und „Termin wählen“ mit der Unterzeile. Der Besucher hat den Sessel am Anfang gesehen. Am Ende steht er für ihn bereit. Diese Klammer vom ersten Bild zum letzten Satz ist der Grund, warum die Seite als Erlebnis im Gedächtnis bleibt.

---

## 5. Technik: Wie das mit LCP ≤ 2,0 s funktioniert

**Grundsatz: Das LCP gehört dem Server, die Magie kommt danach.** Alles, was den Wow-Effekt erzeugt, steht entweder schon im ersten Frame als CSS ohne Netzwerk oder kommt erst nach `load`.

| Schicht | Inhalt | Zeitpunkt | Gewicht |
|---|---|---|---|
| **0 Server-HTML** | H1, Lead, CTA, Infozeile, `<picture>` mit Basisbild, beides mit `preload` und `fetchPriority="high"` wie im heutigen `Hero.js` | erster Byte | 0 KB JS |
| **1 Inline-Licht** | Inline-Skript direkt im Hero-Markup: Ortszeit über `Intl.DateTimeFormat` mit `timeZone: "Europe/Vienna"`, Sonnenhöhe und Azimut nach dem vereinfachten NOAA-Verfahren (eigene Funktion, ca. 40 Zeilen, **kein neues Paket**), Ergebnis als `--sun-alt`, `--sun-az`, `--light-warmth`, `data-tod` am Hero | vor dem ersten Paint | < 1 KB |
| **2 Insel „Licht“** | `'use client'` unter `src/components/Wow/`, dynamisch geladen: nachladen des passenden Fotos, Atemzug, Regler, Sessel-Licht, Wischen | `requestIdleCallback` nach `load` | ≤ 10 KB gzip, kein motion nötig (CSS-Übergänge reichen) |
| **3 Wetter (optional)** | Bewölkung in Lochau über einen eigenen Route-Handler, serverseitig 15 min gecacht. Bewölkt bedeutet weiches, diffuses Lichtfeld und die Bildreihe „bedeckt“ | nach Schicht 2 | < 1 KB Antwort |
| **4 Material-RTI** | Eigener kleiner WebGL2-Shader **ohne Bibliothek** (≈ 4–6 KB), Koeffizienten-Texturen je Probe | erst wenn das Kapitel 1 Viewport entfernt ist (IntersectionObserver), nicht bei `Save-Data` | ≈ 150–250 KB je Probe, nur bei Bedarf |

**Wichtige Detailentscheidungen**

- **Kein Tönen von Fotos.** Licht im Foto kommt nur aus echten Aufnahmen. CSS-Licht liegt ausschließlich auf der Papierfläche. So bleibt auch jedes Herstellermotiv unverändert (Minotti-Regel), und wir behaupten nie ein Licht, das es nicht gab.
- **Kontrast unter Licht:** Das Lichtfeld darf die Papierfläche nur zwischen `stone` (#ece8e1) und knapp über `paper` verschieben. Damit hat `text-soft` im ungünstigsten Fall 4,99:1 und `text` mindestens 9,87:1 (Werte aus Bibel §4.1). Ein Playwright-Test misst das für alle Tageszeiten am hellsten und dunkelsten Pixel unter der Schrift (§4.5).
- **LCP-Risiko Crossfade:** Das zweite Bild hat dieselbe Größe wie das LCP-Bild und startet bei Opacity 0. Chrome meldet einen neuen LCP-Kandidaten nur, wenn er größer ist. Das muss trotzdem gemessen werden (PerformanceObserver im Playwright-Test). Fällt es durch, startet der Crossfade erst nach der ersten Nutzereingabe oder nach 3 s, denn ab der ersten Eingabe meldet Chrome kein LCP mehr.
- **Später besser (Variante A):** Der Server wählt das Foto direkt nach der Uhrzeit (Bibel §12.1, `'use cache'` und 15 min). Dann ist schon das LCP-Bild das richtige und der Atemzug passt nur noch die Feinheit an. Das setzt `cacheComponents: true` voraus, das in `next.config.js` heute nicht gesetzt ist. Das ist eine Entscheidung für den Seiten- und Infrastruktur-Verantwortlichen, nicht für das Wow-Team. Bis dahin gilt Variante B (Basisbild und Crossfade nach `load`).
- **Hydration:** Das Inline-Skript setzt Attribute am Hero-Element, bevor React hydratisiert. Das Element bekommt `suppressHydrationWarning`, sonst meldet React eine Abweichung. CSP: Skript per Hash freigeben (die Bibel plant CSP zuerst im Report-Only-Modus).
- **Schalter:** `NEXT_PUBLIC_WOW_HERO` in `Hero.js`. Im Dev ist er standardmäßig an, in Produktion erst nach Freigabe des Inhabers. Ist er aus, rendert der heutige Hero unverändert.
- **Akku und INP:** Keine `requestAnimationFrame`-Schleife im Leerlauf. Der RTI-Shader zeichnet nur bei Eingabe. `visibilitychange` pausiert alles. Die Uhrzeit wird einmal pro Minute aktualisiert, ohne `aria-live`.
- **Bildgewichte:** Tagesreihe 24 Frames je Format und Wetterlage, AVIF, mobil ≤ 120 KB (meist 30–60 KB), Desktop ≤ 180 KB. Geladen wird nur der aktuelle Frame. Die Nachbarn kommen erst dazu, wenn der Besucher den Regler berührt.
- **Messung:** `node tools/qa/shoot.mjs` für jede Tageszeit (Uhrzeit per Playwright `clock` simuliert), Videoaufnahme der ersten 8 s mit `recordVideo`, Lighthouse-Profil Moto G, CLS- und LCP-Observer im Test `tests/**/wow*`, axe mit 0 serious/critical.

---

## 6. Benötigtes Material

| # | Material | Umfang | Wer | Ohne dieses Material |
|---|---|---|---|---|
| M1 | **Tagesreihe Showroom** | 2 feste Stativpositionen (21:9 Desktop, 4:5 Handy) gleichzeitig, manuelle Belichtung, **fester Weißabgleich** (z. B. 5200 K), Aufnahme alle 15 min vom Sonnenaufgang bis 2 h nach Sonnenuntergang. Einmal klarer Tag, einmal bedeckt. Abends Flos-Leuchten auf 2700 K | Fotograf, 2 Tage, kann mit Shooting-Tag 1 der Bibel kombiniert werden | Nur das vorhandene Foto `aboutHome.jpg` und das CSS-Lichtfeld. Der Atemzug entfällt, der Regler auch. Die Seite ist dann gut, aber nicht „lebendig“ |
| M2 | **Sessel-Licht** | Dieselbe Position wie M1, einmal mit einer warmen Leuchte bzw. einem Lichtkegel auf dem vorderen leeren Sessel, zur Tages- und zur Abendzeit | gleiches Shooting, 30 min | Sessel-Moment entfällt |
| M3 | **Fenster- und Lagedaten** | Ausrichtung der Showroom-Fassade (Kompass), Fenstermaße, Lage der Vorhänge, geprüfte Koordinaten (Bibel: 47°31′ N · 9°45′ E noch offen). **Klären: Sieht man vom Showroom aus den See?** | Inhaber, 1 h vor Ort | Lichtfeld nur nach Sonnenhöhe, nicht nach dem echten Fenster |
| M4 | **RTI-Aufnahmen** | 6–8 Materialproben, je 36–48 Aufnahmen mit wanderndem Blitz und Chromkugel (H-RTI) oder einer kleinen selbstgebauten Kuppel, Kamera auf Stativ | Fotograf, 1 Tag, Equipment ca. ein Tagessatz | Material-Kapitel mit 3 Fotos pro Probe (Fallback) |
| M5 | **Haralds Projektkette** | Ein Projekt komplett: Skizzen-Scan (600 dpi), Modellfoto, 3D-Planung, Rendering, Foto der Umsetzung, dazu die Einwilligung des Kunden bzw. anonymisiert | Inhaber und Harald | Abstrakte Linien und markierte Platzhalter (nicht livefähig) |
| M6 | **Öffnungszeiten Café** | Eine Quelle für Showroom und Café | Inhaber | Live-Zeile nennt nur den Showroom |
| M7 | **Freigaben** | Bildregister-Einträge für alle Frames, Hinweis „Fotos: Platzhirsch, Lochau“. Bei Minotti im eigenen Foto: Abstimmung, ob die Darstellung im Lichtwechsel unbedenklich ist (keine Bearbeitung, nur echte Aufnahmen) | Inhaber, Recht | – |

Die Pipeline in `platzhirsch-gpu-tools` hilft bei der Nacharbeit, aber nicht beim Erzeugen. Mit ffmpeg wird aus der Tagesreihe die AVIF-Serie und eine Kontrollvideo-Vorschau. Die RTI-Koeffizienten berechnet ein Node-Skript (Fit nach der kleinsten Fehlerquadrat-Methode pro Pixel, kein Python). **Kein Upscaling** der Materialbilder, denn erfundene Details sind hier genau das Falsche (gpu-pipeline §7).

---

## 7. Texte (Vorschlag, Deutsch; für `wow-messages-vorschlag.json`)

- Overline: „Lochau am Bodensee · {Uhrzeit} · {Lichtname}“
- Lichtnamen: Morgenlicht · Vormittagslicht · Mittagslicht · Nachmittagslicht · Abendlicht · Blaue Stunde · Nacht · bedeckter Himmel
- Regler: Beschriftung „Licht im Showroom“, Optionen „Jetzt · Morgen · Mittag · Abend · Nacht“
- Hinweis unter dem Regler, klein: „Echte Aufnahmen aus unserem Showroom, aufgenommen im Lauf eines Tages.“
- Material-Kapitel: Titel „Unter dem Licht.“, Lead „Führen Sie das Licht über die Oberfläche. Im Showroom liegen alle Proben zum Anfassen bereit.“, Bedienhinweis „Ziehen, tippen oder Pfeiltasten.“
- Schluss: „Nehmen Sie Platz. Wir nehmen uns Zeit.“ (bestehend)

Kein „einzigartig“, „exklusiv“ oder Ähnliches. Kein Ausrufezeichen. Die Uhrzeit ist immer Lochau-Zeit, auch für Besucher aus anderen Zeitzonen. Das ist Absicht: „Bei uns ist es gerade 16:40.“

---

## 8. Risiken

| Risiko | Wirkung | Gegenmittel |
|---|---|---|
| **Shooting fehlt oder verzögert sich** | Ohne Tagesreihe bleibt nur das CSS-Lichtfeld. Der Kern des Wow fehlt | Shooting M1/M2 vor allem anderen buchen. Bis dahin bleibt der Schalter in Produktion aus |
| Kein Seeblick aus dem Showroom | „Licht vom Bodensee“ wäre übertrieben | Texte sprechen von „Licht in Lochau“, nicht vom See, solange M3 offen ist |
| Licht wird als Spielerei gelesen (Jury MB, PS) | Weniger Termine statt mehr | CTA steht unverändert im ersten Viewport. Pro Moment nur 1 Bewegung. A/B-Test Wow-Hero gegen heutigen Hero, Zielgröße: Klicks auf „Termin wählen“ |
| LCP-Rückfall durch Crossfade | E1 verfehlt | Messen. Rückfallebene: Crossfade erst nach erster Eingabe |
| Kontrast unter Lichtfeld | F2 K.-o. | Helligkeit hart begrenzt, Test für alle Tageszeiten |
| Wetterdaten | Lizenz- und Ausfallrisiko | Open-Meteo ist kostenlos nur für nicht-kommerzielle Nutzung. Stattdessen GeoSphere Austria (offene Daten, Lizenz CC BY 4.0 vor Nutzung prüfen) oder ganz ohne Wetter starten. Bei Ausfall gilt das Modell für klaren Himmel |
| Minotti-Stücke im eigenen Foto | Rechtefrage beim Lichtwechsel | Nur echte, unbearbeitete Aufnahmen, keine Tönung. Abstimmung im Bildregister |
| RTI-Aufwand | Erste Aufnahmen gelingen nicht sauber | Pilot mit 2 Proben (Bouclé, Ezarri). Erst wenn sie gut aussehen, alle aufnehmen |
| Mehrere Teams an der Startseite | Konflikte | Wow-Team arbeitet nur in seinen Dateien. Lichtvariablen gelten nur im Hero-Container |
| Pflege | Licht und Saison passen nach einem Umbau des Showrooms nicht mehr | Tagesreihe nach jedem größeren Umbau neu aufnehmen (1 Tag), Sommer- und Winterreihe als Ziel |

---

## 9. Nachträge zur Bibel (Vorschlag, Entscheidung beim Inhaber bzw. Kreativdirektor)

| # | Stelle | Vorschlag | Begründung |
|---|---|---|---|
| N1 | §12.1 Seelicht | Statt 4 Zeitfenstern eine **Tagesreihe** aus 24 echten Frames, Auswahl nach Sonnenstand, optional nach Wetter. Ein Atemzug (Crossfade 2400 ms) **einmal pro Besuch auch beim Laden**, nicht nur beim Wechsel des Zeitfensters | Erst das kontinuierliche, echte Licht erzeugt den Moment des Erkennens. Die Dauer bleibt in der Atmosphäre-Klasse (§8.2: 600–2400 ms), das LCP bleibt unberührt |
| N2 | P3 / §6 Schatten | Ausnahme **„Seelicht-Fläche“**: ein CSS-Lichtfeld auf der Papierfläche, nur im Hero der Startseite, Helligkeit zwischen `stone` und `paper` | Es ist Licht und kein UI-Schatten, kein Dekor ohne Bedeutung. Es zeigt den Ort |
| N3 | §7.3 Weißabgleich | Für die Tagesreihe ein **fester** Weißabgleich über alle Frames | Sonst wird das Abendlicht weggerechnet. Materialbilder bleiben neutral wie bisher |
| N4 | W17 WebGL | Den RTI-Shader im Material-Kapitel schon in Phase 1 zulassen, als Spezialfall der erlaubten „Makro-Ansicht“, eigener Code ohne `ogl` (≤ 6 KB) | Die Bibel erlaubt Streiflicht-Shader in der Makro-Ansicht bereits für Phase 2. RTI ist dasselbe, nur mit echten Messdaten statt eines simulierten Lichts |
| N5 | W12 Hero-Bewegung | Das LCP-Bild bleibt still. Wechsel nur zu anderen **echten** Aufnahmen derselben Position, beim Atemzug und auf Eingabe | Der Geist von W12 (Foto als Beweis, kein Zoom, kein Video) bleibt erhalten |
| N6 | §8.3 Signature-Momente | „Leerer Sessel“ als Klammer zwischen Hero und Schluss-CTA. Der Satz „Nehmen Sie Platz.“ steht weiter nur einmal am Schluss (W15) | Peak-End: Der Satz wird am Ende eingelöst, nachdem das Bild ihn am Anfang ohne Worte angekündigt hat |

---

## 10. Warum das noch niemand im Markt hat

In unserer Stichprobe (Awwwards-Sieger 2024–2026, Hermès, Aesop, die großen italienischen Möbelmarken, regionale Wettbewerber laut Bibel: Höttges, reiter, Fretz, Gamma) haben wir das nicht gefunden. Das ist eine Recherche-Aussage, kein Werbeversprechen. Es gibt dafür drei Gründe:

1. **Die Preisträger erfinden Welten.** Messenger, Igloo und Lando Norris bauen synthetische 3D-Räume. Das kostet Ladezeit und hat mit einem echten Ort nichts zu tun. Ein Einrichtungshaus hat aber genau das, was diese Agenturen simulieren: einen echten Raum mit echtem Licht.
2. **Die Möbelmarken zeigen Kataloge.** Minotti, Poliform & Co. haben keinen einzelnen Ort, den sie zeigen könnten. Sie sind global. Platzhirsch hat einen Ort, ein Café und einen Seehorizont. Den Lichtwechsel eines bestimmten Raums kann nur zeigen, wer diesen Raum hat.
3. **Echtheit ist teuer, aber nicht mit Geld.** Eine Tagesreihe braucht einen Fotografen, ein Stativ und Geduld. RTI braucht einen Tag mit Blitz und Kugel. Das kostet kaum mehr als ein normales Shooting, setzt aber voraus, dass man **vor Ort** ist und sich **Zeit nimmt**. Das ist genau der USP: Harald verbringt Zeit vor Ort, um Licht, Klima und Raum kennenzulernen. Die Website tut dasselbe. Sie zeigt nicht nur, *dass* Platzhirsch auf Licht achtet. Sie beweist es in der ersten Sekunde.

Hermès hat 2026 gezeigt, dass Luxus im KI-Zeitalter durch nachweisbar menschliche Arbeit glänzt. Unsere Antwort ist nicht die Illustration, sondern **Licht, das wirklich da war**, und eine Zeichnung, die wirklich zu einem Raum wurde.

---

### Quellen der Recherche

- [Awwwards-Listing mit SOTY-2025-Badges (Lando Norris, Messenger)](https://www.awwwards.com/websites/%23e2de00/?page=5)
- [abeto auf Awwwards (Messenger, Igloo Inc)](https://www.awwwards.com/abeto/) · [Igloo Inc Case Study](https://awwwards.com/igloo-inc-case-study.html)
- [Awwwards Sites of the Month (Floema, Mai 2026)](https://www.awwwards.com/websites/sites_of_the_month/)
- [Tecnoarreda Interior Design, Honorable Mention 07/2026](https://www.awwwards.com/sites/tecnoarreda-interior-design)
- [Time of Day Adjustment – 3D WebGPU ArchiViz](https://www.awwwards.com/inspiration/time-of-day-adjustment-3d-webgpu-archiviz)
- [Domus: Hermès launches a different kind of website (01/2026)](https://domusweb.it/en/news/2026/01/07/herms-new-website.html) · [nss magazine: Hermès, Illustration statt KI](https://www.nssmag.com/en/fashion/46500/hermes-artist-website-illustration-ai) · [Highsnobiety](https://www.highsnobiety.com/p/hermes-ai-illustration/)
- [The Stable: Aesop shows what it's made of (Pollen)](https://www.thestable.com.au/aesop-shows-what-its-made-of/)

Hinweis: Die Awwwards-Zuordnungen stammen teils aus Listenseiten und sind vor einer öffentlichen Verwendung auf den offiziellen Gewinnerseiten zu bestätigen.
