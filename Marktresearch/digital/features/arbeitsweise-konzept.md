# Signature-Seite „Unsere Arbeitsweise – von der Handzeichnung zum Rendering“

**Rolle:** Creative Director und Markenstratege · **Stand:** 28.10.2026 · **Status:** Konzept für das Bauteam. Kein Code.
**Route:** `/[locale]/arbeitsweise` (DE zuerst, EN/FR/IT über den Vorschlag `arbeitsweise-messages-vorschlag.json`)
**Verbindliche Grundlagen:** `features/usp-handzeichnung-designprozess.md` (Kern-USP), `expertenrat/00-design-bibel.md`, `qa-screenshots/jury/00-jury-urteil.md`, `teamleiter/inhaber-entscheidungen.md` (Nr. 1 und 8), `recht/00-rechtspaket-uebersicht.md`.
**Zugehörig:** `features/usp-durchdringungsplan.md` (wo der USP sonst überall erscheint).

---

## 0. Kurzfassung

Die Seite erzählt einen Weg: **Ort → Hand → Modell → 3D → Rendering → Wirklichkeit.** Das gestalterische Rückgrat ist **eine einzige Linie**. Sie beginnt im Hero als Horizontlinie, wird zum Grundriss, richtet sich zu einem räumlichen Drahtmodell auf und kehrt am Ende als Horizontlinie zurück. Die Linie ist **reine Grafik**. Sie ist als „Schema“ beschriftet und wird nie als Haralds Zeichnung ausgegeben. Haralds echte Arbeit (Skizzen, Modelle, Renderings, Porträt) erscheint ausschließlich über die Bildslots aus `src/lib/arbeitsweise/media.js`. Bis zur Lieferung sind diese Slots gestaltete Platzhalter, klar als „Bild folgt“ gekennzeichnet und im Livegang unsichtbar.

Das eine dunkle Kapitel (Walnut) ist **„Vom Strich zum Raum“** (Schritte 5 und 6, 3D-Planung und Rendering). Dort wechselt die Linie in Messing auf Walnut und wird zum Drahtmodell. Das ist der Signature-Moment der Seite.

Ton: Gastgeber, Sie-Form, kurze Sätze, keine Superlative, kein Ausrufezeichen. Der Nutzen steht vor dem Stolz: nicht „wir zeichnen von Hand“, sondern „Sie sehen Ihren Raum, bevor etwas bestellt wird“.

---

## 1. Recherche: Wie Studios ihren Handwerks-Prozess zeigen

### 1.1 Beobachtungen

| Vorbild | Was sie zeigen | Was wir übernehmen | Was wir nicht übernehmen |
|---|---|---|---|
| **Studio KO** (Fournier/Marty, Paris/Marrakesch) | Olivier Marty beginnt mit Skizzen, „weil eine Idee erst durch die Zeichnung Form bekommt“. Karl Fournier arbeitet mit Worten. Dazu alte Handwerkstechniken und einfache Materialien (Monocle-Profil). | **Zwei Sprachen eines Projekts**: Wort (das Gespräch, die Notiz vor Ort) und Strich (die Zeichnung). Unsere Seite hat genau diese zwei Ebenen: Text erzählt, Bild beweist. | Den Mythos des einsamen Genies. Bei uns steht der Kunde im Mittelpunkt, nicht der Designer. |
| **Studio Piet Boon** (Amsterdam) | „Total concept“: vier Phasen von der vorläufigen und endgültigen Skizzenplanung über feste und lose Einrichtung bis zum Styling vor Ort. Jedes Projekt beginnt mit „Zuhören“ und einem ausführlichen Briefing. | **Nummerierte Phasen mit klarer Übergabe**, ein Ansprechpartner von der Skizze bis zum Einzug. | Die Fachsprache („Definitive Design“). Wir benennen Schritte so, wie Kunden sie erleben. |
| **Vincent Van Duysen** (Antwerpen) | Gestaltung „aus der Architektur heraus“: Raumbeziehungen statt Formen, Sinne, Licht und Textur im Zentrum, natürliche Materialien. | **Licht und Ort zuerst.** Unser Kapitel „Zeit vor Ort“ beschreibt Licht im Tagesverlauf, Klima und Wege, bevor ein Möbel genannt wird. | Reine Stimmungsbilder ohne Information. Jedes Kapitel bei uns sagt konkret, was passiert. |
| **Joseph Dirand** (Paris) | Sagt, Projekte erscheinen ihm „in Blitzen, bevor sie gezeichnet werden“. Er rahmt Volumen mit großer Präzision. Viel Leere, Symmetrie. | **Ruhe und Rahmen**: ein Gedanke pro Bildschirm (Bibel P2), große Ränder um jede Zeichnung, die Zeichnung als Bild mit Passepartout. | Die Inszenierung als unnahbare Marke. |
| **Zaha Hadid** (Serpentine 2016/17, LUMA Arles 2026) | Frühe Gemälde, kalligrafische Zeichnungen und Notizbücher als **eigener Wert**, „mehr als 100 Skizzen zur selben formalen Frage“. | **Die Zeichnung ist ein Werk, kein Zwischenschritt.** Wir zeigen Skizzen groß, unbeschnitten, mit Datum und Projektbezug, und erlauben das Blättern durch mehrere Varianten (die Suche ist sichtbar). | Ausstellungs-Pathos. Wir bleiben bei Wohnungen und Häusern am Bodensee. |
| **Bauträger-Modellbau** (Verkaufsbüros, Wettbewerbe) | Physische Modelle 1:50 oder 1:100 im Verkaufsbüro: ein gemeinsamer Bezugspunkt auf dem Tisch, sofort verständlich auch für Laien, mit Figuren für den Maßstab. Modelle zeigen Fehler, die am Bildschirm übersehen werden. | **Das Modell als gemeinsamer Tisch.** Text: „Man kann es anfassen und gemeinsam umstellen.“ Bildregel: Modell immer mit Hand oder Maßstabsfigur fotografieren (Bibel P6). | Hochglanz-Präsentationsmodelle. Haralds Modelle sind Arbeitsmodelle, das soll man sehen. |
| **Apple „Designed by Apple in California“** (2013) | Haltung statt Produkt, ein Satz als Signatur. Der Spot schnitt im Ace-Metrix-Test unter dem Branchenschnitt ab; Kritik: die Botschaft sprach über Apple statt über den Nutzen für Kunden. | **Eine kurze, wiederholbare Signaturzeile** für Kampagnen (siehe §3). | **Die Selbstbezogenheit.** Lehre für uns: Jede Aussage über Haralds Handwerk endet mit dem Nutzen für den Kunden („bevor etwas bestellt wird“, „damit es zu Ihrem Alltag passt“). |
| **Hermès** („Hearts and Crafts“, 2011; „Hermès in the Making“) | Lange Einstellungen auf Hände, Geräusche von Leder und Seide, Handwerker mit Namen. Die Menschen hinter den Dingen stehen im Mittelpunkt. | **Hände im Bild, Name und Rolle dazu.** Harald wird beim Zeichnen gezeigt, nicht posiert. Ein kurzer stummer Loop (8–12 s) vom Zeichnen ist das stärkste Einzelmotiv (Bibel §7). | Werkstatt-Romantik ohne Inhalt. |

### 1.2 Was die Forschung dazu sagt (Kurzbelege, zur Einordnung)

- **Sichtbare Arbeit erhöht den wahrgenommenen Wert** (Effort-Heuristik, Kruger et al. 2004; „Operational Transparency“, Buell & Norton 2011). Wer den Prozess sieht, schätzt das Ergebnis höher und vertraut mehr. Daraus folgt: Prozess in Schritten zeigen, nicht nur Ergebnisse.
- **Mitgestalten bindet** (IKEA-Effekt, Norton/Mochon/Ariely 2012). Das Modell, „das man gemeinsam umstellt“, und die Online-Planer als Einstieg zahlen genau darauf ein.
- **Handgemachtes wird als „mit Liebe gemacht“ gelesen** (Fuchs/Schreier/van Osselaer 2015, „The Handmade Effect“). Das gilt nur, solange es echt ist. Ein KI-„Handstrich“ würde den Effekt umkehren und ist zudem irreführend (UWG, AI Act Art. 50).
- Die Studien sind Verweise aus der Fachliteratur (Kruger et al., J. Exp. Soc. Psych. 2004; Buell & Norton, Management Science 2011; Norton/Mochon/Ariely, J. Consumer Psych. 2012; Fuchs/Schreier/van Osselaer, J. Marketing 2015) und in dieser Runde nicht neu nachgelesen. Auf der Seite selbst werden **keine** Studien zitiert.

### 1.3 Quellen der Recherche (28.10.2026)

- Monocle: Studio KO – https://monocle.com/design/architecture/studio-ko-architects-simple-materials-instinct/
- Studio Piet Boon, Arbeitsweise: https://pietboon.com/?p=21077 · https://pietboon.com/about-studio-piet-boon/
- Van Duysen, Designerprofile: https://www.kvadrat.dk/en/designers/vincent-van-duysen · https://www.viccarbe.com/designer/vincent-van-duysen/
- Joseph Dirand, Profil: https://www.businessoffashion.com/amp/community/people/joseph-dirand
- Zaha Hadid, Serpentine und LUMA: https://www.serpentinegalleries.org/whats-on/zaha-hadid-there-should-be-no-end-experimentation/ · https://www.designboom.com/architecture/exhibition-rare-paintings-archives-zaha-hadid-ten-years-passing-luma-arles-hans-ulrich-obrist/
- Modellbau: https://mcaslan.co.uk/Insight-Thinking-by-making · https://www.theglobeandmail.com/canada/british-columbia/article-models-make-architecture-visions-real
- Apple 2013: https://appleinsider.com/articles/13/06/27/designed-by-apple-in-california-ads-rank-poorly-in-consumer-survey · https://timcalkins.com/2013/07/apples-new-campaign/
- Hermès: https://madmuseum.org/node/567 · https://www.hermes.cn/cn/en/content/333168-a-house-of-artisans-and-human-values/

---

## 2. Leitidee und Positionierung

**Ein Satz für das Team:** Bei Platzhirsch entsteht eine Einrichtung zuerst am Ort und auf Papier, dann im Modell und erst danach am Bildschirm. Sie sehen Ihren Raum, bevor etwas bestellt wird.

**Abgrenzung (intern, nicht auf die Seite schreiben):** Händler zeigen Kataloge. Online-Planer zeigen Vorlagen. Platzhirsch zeigt **Ihre** Räume, von Hand gedacht.

**Drei Beweisarten**, die die Seite durchgehend trägt:
1. **Ort:** Zeit vor Ort, Licht, Klima, Wege (Text, später Fotos vom Termin vor Ort).
2. **Hand:** Skizze und Modell (nur echtes Material von Harald).
3. **Präzision:** 3D-Plan mit Maßen, Rendering vor der Bestellung, Kundenportal (Screens aus dem echten Portal, Renderings aus echten Projekten).

---

## 3. Signaturzeilen

| Verwendung | Vorschlag | Begründung |
|---|---|---|
| **Leitmotiv laut Inhaber** | „Von Hand gezeichnet. Digital perfektioniert.“ | Inhaber-Vorschlag. „perfektioniert“ ist nah an einer Superlativ-Behauptung (Bibel §1 Stimme). |
| **Empfehlung Kampagne** | „Von Hand gezeichnet. Im Raum gebaut.“ | Zwei Fakten, kein Werturteil. Hand und Raum (Modell, Wirklichkeit) als Klammer. |
| Alternative | „Erst der Stift. Dann der Raum.“ | Kürzer, für Social und Plakat. |
| Alternative | „Gezeichnet für Sie. Gebaut für Ihr Leben.“ | Nutzen voran, schließt an „Designs, die leben“ an. |
| **Seitenmotto** | „Designs, die leben.“ | Inhaber-Wort, steht als Bodoni-Kursivzeile am Seitenende (einziger zentrierter Satz der Seite, Bibel §6). |

Die Werbetexter entscheiden (USP-Doku). Die Seite selbst nutzt das Leitmotiv **nicht** als H1, sondern nur im Abschluss.

---

## 4. Dramaturgie der Seite

### 4.1 Gesamtablauf (mobil zuerst)

| # | Kapitel | Fläche | Inhalt | Hauptbewegung (genau eine) | Handlung |
|---|---|---|---|---|---|
| K0 | **Auftakt** | `surface` (Paper) | Overline, H1, Lead, Primärknopf, Textlink zur Schrittübersicht. Kein Bild als LCP, die H1 ist das LCP-Element. | Horizontlinie zeichnet sich (clip-path, scrollgetrieben) | „Termin wählen“ (primär), „Die sieben Schritte“ (Anker) |
| K1 | **Haltung** | `surface` | 3 kurze Absätze: Wir sind Designer. Wir nehmen uns Zeit. Hand und Bildschirm gehören zusammen. | keine (Reveal ≤ 24 px) | – |
| K2 | **Die sieben Schritte im Überblick** | `band` (Stone) | Nummerierte Liste 01–07 als Inhaltsverzeichnis mit Ankern. Desktop: eine Zeile mit 7 Stationen auf der Linie. Mobil: vertikale Liste. | Stationspunkte erscheinen gestaffelt (5er-Gruppen, 60 ms) | jeder Schritt ist ein Anker |
| K3 | **Zeit vor Ort** (Schritte 01 und 02) | `surface` | Kennenlernen im Café oder bei Ihnen, dann der Termin vor Ort. Liste „Was wir vor Ort ansehen“. Bildslot `vorOrt` (3:2). | Linie wird zum Sonnenbogen über einem Raumumriss (Licht im Tagesverlauf), rein grafisch | „Termin vor Ort anfragen“ (sekundär) |
| K4 | **Von Hand** (Schritte 03 und 04) | `surface` | Handzeichnung und Modell. Bildslots `handzeichnung` (4:5 oder 3:2) und `modell` (1:1, mit Hand im Bild). | Linie zeichnet einen Grundriss, dieser kippt in die Isometrie und die Wände richten sich auf | – |
| K5 | **Vom Strich zum Raum** (Schritte 05 und 06), **das dunkle Kapitel** | `inverse` (Walnut), 1-px-Messinglinie oben | 3D-Planung mit Maßen, Produkten und Materialien; fotorealistisches Rendering vor der Bestellung; Feedback im Kundenportal, auch per Sprachnachricht. Bildslots `planung3d` (3:2) und `rendering` (21:9 Desktop, 4:5 mobil). | **Signature-Moment:** das Drahtmodell bekommt Raster und Maßketten in `brass-400`, dann blendet der Rendering-Slot darüber ein (opacity) | – |
| K6 | **Wirklichkeit** (Schritt 07) | `surface` | Lieferung, Montage auf Wunsch, Koordination der Gewerke, Begleitung bis zum Einzug. Bildslot `umsetzung` (3:2). | Linie kehrt als Horizontlinie zurück (gleiche Linie wie K0, kein zweites Horizon-Element: gleiche Komponente, eine Instanz pro Seite, siehe §5.5) | – |
| K7 | **Harald** | `band` | Porträt-Slot `portrait` (1:1 oder 4:5, Harald beim Zeichnen), Name, Rolle (Vorschlag „Designer & Zeichner“, Inhaber bestätigt), 3 Sätze. Optional Video-Loop `portraitLoop` (stumm, mit Pause-Knopf). | keine | „Mit Harald einen Termin vereinbaren“ (Textlink, nur wenn Inhaber zustimmt; sonst „Termin wählen“) |
| K8 | **Ein Projekt, fünf Bilder** (Vorher-Nachher-Kette) | `surface` | Eine Kette eines echten Projekts: Vorher, Skizze, Modell, Rendering, Umsetzung. Faktenzeile (Region, Typologie, m², Dauer) nur mit echten Daten. | Bildwechsel per Auswahl (Crossfade 240 ms) | Textlink „Weitere Projekte“ (nur wenn `/projekte` echte Projekte hat) |
| K9 | **Online starten – Harald zeichnet weiter** | `band` | Brücke zu Küchenplaner, Sofaplaner, Stil-Finder: drei Karten, jeweils „Was Sie online tun“ und „Was danach im Studio passiert“. | keine | je Karte ein Textlink zum Planer |
| K10 | **Fragen** | `surface` | 8 Fragen als `<details>`. Gleicher Inhalt im FAQPage-JSON-LD. | keine | – |
| K11 | **Abschluss** | `band` | „Designs, die leben.“ (Bodoni kursiv, zentriert), ein Satz, Primärknopf mit Unterzeile, TrustBlock-Verweis. | keine | „Termin wählen“ (primär) |

**Regeln, die das Raster einhält:**
- Genau **eine** Walnut-Fläche (K5). Footer bleibt hell. Der Playwright-Test zu `[data-surface="inverse"]` (Bibel §4.2) gilt auch hier.
- Genau **ein** gefüllter Knopf pro Viewport. Der Primärknopf steht nur in K0 und K11.
- Pro Viewport **eine** Hauptbewegung. Die Linie ist in jedem Kapitel diese eine Bewegung; Bilder werden in diesen Kapiteln nicht zusätzlich animiert (nur sofort sichtbar oder per opacity-Reveal ohne Bewegung).
- Asymmetrie: Text in Spalten 2–6, Bild/Grafik in 7–12, Kapitel für Kapitel abwechselnd. K5 kehrt die Seite um (Grafik links, Text rechts).
- Mobil: kein Sticky. Jedes Kapitel ist Text → Grafik (1:1, max. 320 px hoch) → Bildslot. Die Schritt-Nummer steht als Overline über jedem Titel („Schritt 03 von 07“).

### 4.2 Scroll-Erzählung auf dem Desktop (ab 1024 px)

- K3 bis K6 bilden **eine Werkstrecke**. Links (Spalten 1–5) steht eine Sticky-Spalte (`position: sticky; top: 88px`) mit der Grafik „Die Linie“ und einer leisen Stationsanzeige „03 / 07“ (`tabular-nums`, `text-soft`). Rechts (Spalten 7–12) laufen die Schritte als normale Blöcke mit Bildslots.
- Der Zustand der Grafik hängt am jeweils sichtbaren Schritt: jeder Schrittblock steuert per `animation-timeline: view()` die zugehörige Phase (CSS, hinter `@supports (animation-timeline: view())`). Ohne Unterstützung zeigt die Sticky-Spalte pro Schritt das fertige Standbild (siehe §5.4).
- In K5 wechselt die Fläche auf Walnut. Die Sticky-Grafik endet an der Kapitelgrenze und beginnt in K5 neu (zwei Instanzen derselben Grafik mit eigenem Zustand; die Messinglinie gilt nur auf Dunkel, Bibel §4.2).
- Die Stationsanzeige ist `aria-hidden`. Für Screenreader trägt jeder Schritt seine Nummer im Titel („Schritt 3: Handzeichnung“, visuell als Overline).
- Ankernavigation aus K2: `scroll-padding-top: 88px` sorgt dafür, dass Titel nicht unter dem Header liegen.

---

## 5. Motion-Konzept „Die Linie“

### 5.1 Idee

Eine durchgehende 1-px-Linie erzählt den Prozess als **abstrakte Grafik**: Horizont → Raumumriss mit Sonnenbogen → Grundriss → isometrischer Raum → Drahtmodell mit Maßketten → zurück zum Horizont. Sie zeigt das *Prinzip* „vom Strich zum Raum“. Sie ist **keine** Skizze und imitiert keinen Handstrich (kein Zittern, keine Bleistift-Textur, keine Handschrift-Schrift). So bleibt jede Verwechslung mit Haralds Arbeit ausgeschlossen.

**Kennzeichnung:** Unter jeder Grafik steht klein `small`/`text-soft`: „Schema“. Die Grafiken sind `aria-hidden="true"` und `role="presentation"`; die Inhalte stehen im Text. Kein Alt-Text, der „Zeichnung“ oder „Skizze“ sagt.

### 5.2 Phasen

| Phase | Kapitel | Grafik | Technik (nur `transform`, `opacity`, `clip-path`, Bibel §8.2) |
|---|---|---|---|
| P0 Horizont | K0 | gerade Linie über die Containerbreite auf 38 % der Abschnittshöhe | `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)`, `animation-range: entry 20% cover 45%`, `--ease-quiet` |
| P1 Ort | K3 | Linie knickt zu einem rechteckigen Raumumriss mit Fensterlücke; darüber ein Bogen (Sonnenlauf) mit 3 Punkten (Morgen, Mittag, Abend) | Segmente werden nacheinander per `clip-path` aufgedeckt (je Segment ein eigenes Element). Die 3 Punkte erscheinen per `opacity` |
| P2 Hand | K4, Schritt 03 | Grundriss: Wände, eine Tür mit Schwenkbogen, ein Sofa-Rechteck, ein Tisch-Kreis | wie P1, Segment für Segment; Gruppen ≤ 5 Elemente, 60 ms Staffel |
| P3 Modell | K4, Schritt 04 | derselbe Grundriss kippt in die Isometrie, die Wände wachsen nach oben | Grundriss-Gruppe: `transform: rotateX(60deg) rotateZ(-45deg)` von 0 auf 1 interpoliert (CSS 3D auf einem HTML-Container mit `perspective: none`, also orthogonal). Wände: `scaleY(0 → 1)` mit `transform-origin: bottom`. Linienstärke bleibt 1 px (`vector-effect: non-scaling-stroke`) |
| P4 Drahtmodell | K5, Schritt 05 | Raumkörper als Drahtmodell, Bodenraster 50-cm-Teilung, zwei Maßketten mit Endstrichen; Farbe `brass-400` auf Walnut | Raster und Maßketten per `clip-path`-Reveal; Zahlen der Maßketten stehen von Anfang an fest im SVG (keine hochzählenden Zahlen, Bibel §8.2) und sind Platzhalterwerte ohne Projektbezug („3,60 m“, „4,80 m“, Schema) |
| P5 Rendering | K5, Schritt 06 | Drahtmodell tritt zurück, der Rendering-Slot liegt darüber | Drahtmodell `opacity 1 → 0.24`, Bildslot `opacity 0 → 1` (Crossfade, Dauer an Scroll gebunden; Text bleibt ≥ 0,6 Deckkraft). **Die Grafik wird nie selbst „fotorealistisch“** – kein Shader, kein generiertes Bild |
| P6 Wirklichkeit | K6 | Linie fällt zurück in die Horizontale | `scaleY` der Wände 1 → 0, Isometrie 1 → 0; Endzustand = Horizontlinie |

### 5.3 Werte

- Dauer bei Nicht-Scroll-Fallback (IntersectionObserver, optional): `--duration-enter` 600 ms je Phase, P0 800 ms (Bibel §8.3). Alles Lesbare steht nach ≤ 700 ms still (Unterseite).
- Easing: `--ease-quiet` für Eintreten, `--ease-quiet-inout` für den Kipp-Morph P3/P6.
- Linien: `line-strong` (Ink 24 %) auf Hell, `brass-400` auf Walnut. Messing-Anteil der Fläche liegt bei 1-px-Linien weit unter 2 %.
- Kein Parallax, kein Scroll-Jacking, kein Lenis (Bibel W1), natives Scrollen.
- Bildslots: nicht skaliert, nicht verschoben. Erlaubt ist ein `clip-path`-Reveal mit max. 14 % (höchstens 2 gleichzeitig) – auf dieser Seite **nicht** genutzt, um die Linie als einzige Hauptbewegung zu halten.

### 5.4 Reduced Motion und Fallback

- Bei `prefers-reduced-motion: reduce` oder `data-motion="reduced"`: jede Grafik zeigt sofort ihren **Endzustand** der Phase (z. B. K4 zeigt Grundriss und Isometrie nebeneinander als zwei kleine Standbilder). Keine Morphs, kein Crossfade (Rendering-Slot sofort voll sichtbar).
- Ohne `animation-timeline`-Unterstützung (Firefox ohne Flag, ältere Safari): gleiches Bild wie Reduced Motion. Nichts bleibt unsichtbar.
- Video-Loop von Harald (falls geliefert): `preload="none"`, Start erst nach `load` und nur bei Motion erlaubt, sichtbarer Pause-Knopf (WCAG 2.2.2), Poster aus dem Porträt.

### 5.5 Technik und Budget

- **Reines Inline-SVG + CSS, 0 KB JavaScript.** Gesamtgröße aller Linien-SVGs ≤ 6 KB gzip. Server Component, keine Insel nötig.
- Bewusst **kein three.js / R3F** auf dieser Seite: Ein echtes 3D-Modell würde wie ein Rendering wirken (Verwechslungsgefahr mit Haralds Arbeit), kostet 150+ KB und gefährdet LCP ≤ 2,0 s. Die Isometrie per CSS-Transform reicht für die Aussage.
- Horizontlinie: Die Bibel erlaubt eine Horizontlinie pro Seite. P0 und P6 sind **dieselbe Komponente `Horizon`** am Anfang; P6 ist der Endzustand der Linie in der Werkstrecke, kein zweites `Horizon`. Bauteam: `Horizon` nur in K0 setzen, P6 als Teil der Grafik „Die Linie“.
- Ein Signature-Moment pro Seite (Bibel §8.3): Das ist P4/P5 im dunklen Kapitel. Die anderen Phasen sind ruhige Kapitelbewegungen.

---

## 6. Bildslots, Platzhalter und `src/lib/arbeitsweise/media.js`

### 6.1 Regel

Alle Bilder der Seite kommen aus **einer** Datei `src/lib/arbeitsweise/media.js`. Jeder Slot ist entweder `null` oder ein Objekt. Echte Bilder werden später nur dort eingetragen; keine Komponente kennt einen Bildpfad.

### 6.2 Vorgeschlagene Slots (Schema, kein Code)

| Schlüssel | Schritt / Kapitel | Format | Inhalt (nur echtes Material) |
|---|---|---|---|
| `kennenlernen` | 01 | 3:2 | Gespräch im Café oder am Tisch mit Mustern (Personen nur mit Einwilligung) |
| `vorOrt` | 02 | 3:2 | Harald oder Team beim Aufmaß, Raum mit Tageslicht, Notizbuch (ohne Adresse, ohne Hausfront) |
| `handzeichnung` | 03 | 4:5 oder 3:2 | Scan einer Skizze (Grundriss, Perspektive oder Stimmung) |
| `handzeichnungVarianten` | 03 | 1:1, 3–6 Stück | weitere Skizzen desselben Raums (zeigt die Suche) |
| `modell` | 04 | 1:1 | Modellfoto mit Hand oder Maßstabsfigur |
| `planung3d` | 05 | 3:2 | Screenshot der 3D-Planung mit Maßen (Software-Oberfläche erlaubt) |
| `rendering` | 06 | 21:9 + 4:5 | fotorealistisches Rendering desselben Projekts |
| `portal` | 06 | 4:5 | Screenshot Kundenportal mit Feedback (Testdaten, keine Kundennamen) |
| `umsetzung` | 07 | 3:2 | Foto des fertigen Raums |
| `portrait` | K7 | 1:1 und 4:5 | Harald beim Zeichnen, Blick auf das Blatt; zweites Motiv mit Blick in die Kamera |
| `portraitLoop` | K7 | 4:5, 8–12 s | stummer Loop: Hand mit Stift auf Papier |
| `kette` | K8 | 3:2, 5 Bilder | `vorher`, `skizze`, `modell`, `rendering`, `umsetzung` desselben Projekts, plus `fakten` (Region, Typologie, m², Dauer) |

Felder je Bild: `src`, `alt` (DE, EN/FR/IT folgen), `width`, `height`, `ratio`, `credit` (z. B. „Handzeichnung: Harald Menghin“), `datum` (Monat/Jahr), `projekt` (interne ID), `einwilligung` (Verweis ins Bildregister), `kiStufe` („keine“ für Skizze und Modell; bei Renderings ehrliche Angabe der Werkzeuge, siehe §10), `typ` (`skizze`, `modell`, `rendering`, `foto`, `screenshot`).

### 6.3 Verhalten

| Zustand | Vorschau/Staging | Produktion (Livegang) |
|---|---|---|
| Slot = Objekt | Bild mit Credit-Zeile | Bild mit Credit-Zeile |
| Slot = `null` | **Gestalteter Platzhalter:** Fläche `linen` im exakten Seitenverhältnis, 1-px-Rahmen `line`, oben links Overline „BILD FOLGT“, darunter `small`: „Handzeichnung von Harald Menghin, Schritt 03“ (Art des fehlenden Materials). Kein Icon-Kitsch, kein Shimmer (Bibel §8.2). `data-placeholder="arbeitsweise"` für Tests | **Kein Platzhalter sichtbar** (USP-Regel). Der Slot entfällt, das Kapitel zeigt nur Text und die Schema-Grafik; das Layout bleibt asymmetrisch (Grafik übernimmt die Bildspalte) |

- Rendering-Slot im Livegang `null`: Das dunkle Kapitel bleibt mit Drahtmodell (P4) stehen, P5 entfällt. Text sagt dann nicht „Sehen Sie hier“, sondern bleibt allgemein (siehe Texte §7, Variante ohne Bild).
- K8 (Kette) erscheint im Livegang **nur**, wenn alle fünf Bilder eines Projekts vorliegen. K7 (Harald) erscheint im Livegang mit Initialen-Kachel (wie `PortraitTile` der Team-Seite), wenn kein Porträt da ist – Text bleibt.
- **Empfehlung Livegang der Seite:** erst, wenn mindestens `handzeichnung`, `modell`, `rendering` und `portrait` echt vorliegen. Vorher `noindex` und nicht in Navigation/Sitemap. Entscheidung beim Inhaber (§11).

### 6.4 Tests (für das Bauteam, unter `tests/`)

- Seite liefert 200 in `de`, Titel und H1 wie §8.
- Genau 1 `[data-surface="inverse"]`, genau 1 `<h1>`, 1 `<main>`.
- In Produktion 0 Elemente `[data-placeholder]` (Test gegen `media.js` mit allen Slots `null`: Seite rendert ohne Fehler und ohne „Bild folgt“).
- Kein Bild aus den Slots `handzeichnung`, `modell`, `rendering` ohne `credit` und `einwilligung` (Unit-Test auf `media.js`).
- Reduced Motion: Alle Grafiken sind im Endzustand sichtbar (Screenshot-Vergleich mit `reducedMotion: "reduce"`).
- FAQ-Inhalt sichtbar = FAQ-JSON-LD (gleiche Fragen, gleiche Reihenfolge).
- axe: 0 Fehler serious/critical; Fokus auf Walnut mit `brass-400`-Ring.

---

## 7. Texte DE (komplett, Gastgeber-Ton)

> Ohne Superlative, ohne Ausrufezeichen, ohne erfundene Projekte, Zahlen oder Zitate. `[Inhaber]` = vom Inhaber zu bestätigen.

### K0 Auftakt
- **Overline:** UNSERE ARBEITSWEISE
- **H1:** Von der Handzeichnung zum Rendering.
- **Lead:** Wir lernen Ihre Räume kennen, bevor wir planen. Harald Menghin zeichnet Ihr Konzept von Hand und baut ein Modell. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.
- **Primärknopf:** Termin wählen
- **Unterzeile:** 60 Minuten · kostenlos · im Showroom mit Café oder bei Ihnen `[Inhaber: Dauer und „kostenlos“ wie Bibel §10.2 bestätigen]`
- **Textlink:** Die sieben Schritte ansehen

### K1 Haltung
- **Overline:** WAS UNS AUSMACHT
- **H2:** Wir sind Designer. Wir nehmen uns Zeit.
- **Absatz 1:** Eine Einrichtung beginnt bei uns nicht im Katalog, sondern bei Ihnen: bei Ihren Räumen, Ihrem Licht und Ihrem Alltag.
- **Absatz 2:** Darum kommen wir zu Ihnen. Wenn Ihr Projekt es braucht, bleiben wir auch ein, zwei Tage vor Ort.
- **Absatz 3:** Was wir dort sehen, zeichnet Harald Menghin von Hand. Aus der Zeichnung wird ein Modell, aus dem Modell eine exakte 3D-Planung. So bleibt der erste Gedanke bis zum fertigen Raum erhalten.

### K2 Die sieben Schritte (Übersicht)
- **Overline:** SO ENTSTEHT IHR RAUM
- **H2:** Sieben Schritte, eine Ansprechperson.
- **Liste:**
  1. Kennenlernen
  2. Vor Ort
  3. Handzeichnung
  4. Modell
  5. 3D-Planung
  6. Rendering
  7. Umsetzung
- **Hinweis darunter (`small`):** Nicht jedes Projekt braucht jeden Schritt in voller Länge. Was sinnvoll ist, besprechen wir im ersten Termin.

### K3 Zeit vor Ort
- **Overline:** SCHRITT 01 UND 02
- **H2:** Zuerst schauen wir uns um.
- **Schritt 01 – Kennenlernen.** Wir sprechen im Showroom in Lochau, gern bei einem Kaffee im Café, oder bei Ihnen zu Hause. Sie erzählen, wie Sie wohnen und was sich ändern soll. Grundrisse, Fotos und Maße helfen, sind aber keine Voraussetzung.
- **Schritt 02 – Vor Ort.** Ein Raum ist mehr als sein Grundriss. Wir sehen uns an, wie das Licht im Laufe des Tages wandert, wie sich der Raum im Sommer und im Winter anfühlt und welche Wege Sie täglich gehen. Wenn Ihr Projekt es braucht, bleiben wir auch ein, zwei Tage.
- **Liste „Was wir vor Ort ansehen“:**
  - Licht am Morgen, am Mittag und am Abend
  - Klima, Sonne, Wind und Ausblick
  - Wege, Türen und Durchgänge
  - Was bleibt: Möbel, Bilder, Erinnerungsstücke
  - Wie Sie leben: Kochen, Gäste, Kinder, Ruhe
- **Sekundärknopf:** Termin vor Ort anfragen
- **Unterzeile:** Ob und in welchem Umfang wir vor Ort arbeiten, besprechen wir mit Ihnen vorab. `[Inhaber: keine Preisangabe bis zur Entscheidung]`
- **Bildunterschrift `vorOrt` (wenn Bild da):** Aufmaß vor Ort. [Monat Jahr]

### K4 Von Hand
- **Overline:** SCHRITT 03 UND 04
- **H2:** Der erste Entwurf entsteht auf Papier.
- **Schritt 03 – Handzeichnung.** Harald Menghin skizziert Grundriss, Perspektiven und Stimmungen von Hand. Auf Papier lassen sich Varianten schnell vergleichen, und Sie sehen früh, wohin die Reise geht. Die Zeichnung zeigt nicht jedes Detail, aber die Idee.
- **Schritt 04 – Modell.** Dann baut Harald ein Raummodell im Maßstab, so wie man es von Architekten und Bauträgern kennt. Sie können es anfassen, von allen Seiten ansehen und gemeinsam mit uns umstellen. Viele Fragen klären sich am Tisch schneller als am Bildschirm.
- **Bildunterschriften:** „Handzeichnung: Harald Menghin, [Monat Jahr]“ · „Arbeitsmodell im Maßstab [1:xx], [Monat Jahr]“
- **Grafik-Beschriftung:** Schema

### K5 Vom Strich zum Raum (dunkles Kapitel)
- **Overline:** SCHRITT 05 UND 06
- **H2:** Dann wird es genau.
- **Schritt 05 – 3D-Planung.** Wir übertragen Zeichnung und Modell in eine digitale Planung mit exakten Maßen, den ausgewählten Produkten und Materialien. Jetzt zeigt sich, ob jede Tür aufgeht, jede Schublade Platz hat und jedes Sofa durch das Treppenhaus passt.
- **Schritt 06 – Fotorealistisches Rendering.** Aus der Planung entsteht ein fotorealistisches Bild Ihres Raums. So sehen Sie, wie Stoffe, Holz und Licht zusammenwirken, bevor etwas bestellt wird. Ihre Rückmeldung geben Sie im Gespräch oder im Kundenportal, auch per Sprachnachricht.
- **Satz unter dem Rendering (Pflicht, Kennzeichnung):** Visualisierung aus der Planung, kein Foto.
- **Variante ohne Rendering-Bild (Livegang mit `rendering = null`):** Der zweite Satz von Schritt 06 bleibt, Bildunterschrift entfällt.
- **Grafik-Beschriftung:** Schema

### K6 Wirklichkeit
- **Overline:** SCHRITT 07
- **H2:** Bis Sie eingezogen sind.
- **Text:** Wir bestellen, koordinieren die Lieferung und auf Wunsch die Montage. Wenn mehrere Gewerke beteiligt sind, stimmen wir die Termine ab. Und wir bleiben Ihre Ansprechperson, bis alles steht, wie es gezeichnet war.
- **Bildunterschrift `umsetzung`:** Der fertige Raum. [Region, Monat Jahr]

### K7 Harald
- **Overline:** DER ZEICHNER
- **H2:** Harald Menghin
- **Rolle:** Designer & Zeichner `[Inhaber: Titel bestätigen]`
- **Text:** Harald denkt mit dem Stift. Bevor er am Bildschirm plant, zeichnet er, oft mehrere Varianten desselben Raums. Dann baut er das Modell, an dem Sie mit uns gemeinsam weiterarbeiten. Bei uns begleitet er Ihr Projekt von der ersten Skizze bis zur Planung. `[Inhaber: letzten Satz bestätigen, bevor er online geht]`
- **Textlink:** Das ganze Team kennenlernen → `/ueber-uns/team`
- **Platzhalter-Kachel (ohne Porträt):** Initialen „HM“ auf Stone.
- **Alt-Text-Muster Porträt:** „Harald Menghin zeichnet am Tisch im Showroom in Lochau“ (nur, wenn das Bild das zeigt).

### K8 Ein Projekt, fünf Bilder
- **Overline:** VOM ERSTEN STRICH ZUM FERTIGEN RAUM
- **H2:** Ein Projekt, Schritt für Schritt.
- **Text:** So sah ein Raum vor der Planung aus, so hat Harald ihn gezeichnet, so stand er im Modell, so in der Visualisierung und so heute.
- **Auswahl (Radiogruppe, 44 px Ziele):** Vorher · Skizze · Modell · Rendering · Heute
- **Faktenzeile (`dl`, nur echte Daten):** Region · Typologie · Fläche · Dauer `[aus dem Projekt]`
- **Hinweis:** Veröffentlicht mit Einverständnis der Bauherrschaft. `[nur mit schriftlicher Einwilligung]`
- **Textlink:** Weitere Projekte ansehen (nur bei echten Projekten)

### K9 Online starten – Harald zeichnet weiter
- **Overline:** ONLINE BEGINNEN
- **H2:** Online starten. Harald zeichnet weiter.
- **Lead:** Sie möchten erst einmal selbst ausprobieren? Unsere Online-Planer sind ein guter Anfang. Wenn Sie danach mit uns planen, nimmt Harald Ihr Ergebnis mit an den Zeichentisch.
- **Karte Küchenplaner:** *Online:* Grundriss, Zeilen und Geräte in 3D anlegen. *Danach im Studio:* Harald zeichnet Ihre Küche von Hand weiter, wir prüfen Maße und Anschlüsse vor Ort. → „Küche online planen“
- **Karte Sofaplaner:** *Online:* Modell, Module und Bezug zusammenstellen. *Danach im Studio:* Probesitzen in Lochau, und wir zeichnen, wie das Sofa in Ihrem Raum steht. → „Sofa zusammenstellen“
- **Karte Stil-Finder:** *Online:* in fünf Bildfragen Ihren Stil finden. *Danach im Studio:* Ihr Ergebnis wird zur ersten Skizze für Ihre Räume. → „Stil finden“
- **Hinweis (`small`):** Die Online-Planer sind unverbindlich und ersetzen keine Planung vor Ort.
- Links erscheinen nur, wenn der jeweilige Planer öffentlich geschaltet ist (`src/lib/features.js`). Sonst entfällt die Karte.

### K10 Fragen (sichtbar und als FAQPage-JSON-LD)
1. **Zeichnet Harald wirklich jedes Konzept von Hand?**
   Ja, die Einrichtungskonzepte beginnen bei uns mit einer Handzeichnung. Wie viele Skizzen und ob ein Modell sinnvoll ist, hängt vom Projekt ab. Das besprechen wir im ersten Termin. `[Inhaber: Umfang bestätigen]`
2. **Wozu ein Modell, wenn es 3D-Renderings gibt?**
   Ein Modell kann man in die Hand nehmen und gemeinsam umstellen. Viele Fragen zu Proportionen und Wegen lassen sich so schneller klären. Die 3D-Planung folgt danach und macht alles maßgenau.
3. **Kommen Sie zu mir nach Hause?**
   Ja. Wir sehen uns Ihre Räume vor Ort an, in Vorarlberg, am Bodensee und in den Nachbarregionen. Wenn Ihr Projekt es braucht, bleiben wir auch ein, zwei Tage, um Licht, Klima und Abläufe kennenzulernen. `[Inhaber: Gebiet bestätigen]`
4. **Was kostet die Planung mit Handzeichnung und Modell?**
   Das hängt vom Umfang ab. Im ersten Termin besprechen wir, was Ihr Projekt braucht, und Sie erhalten danach eine klare Aufstellung, bevor Kosten entstehen. `[Inhaber: Preismodell; bis dahin keine Zahl]`
5. **Wann sehe ich, wie mein Raum aussehen wird?**
   Schon die Handzeichnung zeigt die Idee. Mit dem fotorealistischen Rendering sehen Sie Ihren Raum mit Materialien und Licht, bevor etwas bestellt wird.
6. **Kann ich Änderungen einbringen?**
   Ja, in jedem Schritt. Am Modell, im Gespräch oder im Kundenportal, auch per Sprachnachricht.
7. **Ich habe schon im Küchen- oder Sofaplaner geplant. Fange ich dann von vorne an?**
   Nein. Bringen Sie Ihr Ergebnis mit oder senden Sie uns den Link. Wir planen von dort aus weiter, und Harald zeichnet Ihr Konzept von Hand weiter.
8. **Planen Sie auch Hotels, Ferienwohnungen oder Boote?**
   Ja. Der Ablauf ist derselbe, vom Termin vor Ort bis zur Umsetzung. Für Yacht-Interieur und Outdoor gibt es eigene Seiten mit den Besonderheiten. `[nur verlinken, wenn die Seiten indexierbar sind]`

### K11 Abschluss
- **Zeile (Bodoni kursiv, zentriert):** Designs, die leben.
- **Text:** Erzählen Sie uns von Ihren Räumen. Wir hören zu, sehen sie uns an und beginnen mit dem ersten Strich.
- **Primärknopf:** Termin wählen
- **Unterzeile:** 60 Minuten · kostenlos · auch samstags `[wie K0]`
- **Textlink:** So kaufen Sie bei uns sicher → TrustBlock (Bibel §11)

### Kleintexte
- Platzhalter: „BILD FOLGT“ + Art: „Handzeichnung von Harald Menghin“, „Foto des Modells“, „3D-Planung“, „Rendering“, „Foto der Umsetzung“, „Porträt Harald Menghin“, „Termin vor Ort“.
- Grafik: „Schema“.
- Breadcrumb: Home › Das Haus › Arbeitsweise.
- Stationsanzeige: „Schritt 03 von 07“.

---

## 8. SEO

| Element | Vorschlag DE |
|---|---|
| **URL** | `/de/arbeitsweise` · EN `/en/approach` · FR `/fr/demarche` · IT `/it/metodo` (über `ROUTES` in `src/utils/routing.js` und die Slug-Liste in `src/proxy.js`; solange EN/FR/IT nicht übersetzt sind, nur DE und `hreflang` nur DE + x-default) |
| **Title** (≤ 60 Z.) | Von der Handzeichnung zum Rendering · Platzhirsch (49) |
| **Alternativ-Title** | Einrichtungsplanung mit Handzeichnung · Platzhirsch (50) |
| **Meta Description** (≤ 155 Z.) | Wir sehen uns Ihre Räume vor Ort an, Harald Menghin zeichnet von Hand und baut ein Modell. Dann 3D-Planung und Rendering. Showroom in Lochau am Bodensee. (153) |
| **H1** | Von der Handzeichnung zum Rendering. |
| **H2-Reihe** | Wir sind Designer. Wir nehmen uns Zeit. · Sieben Schritte, eine Ansprechperson. · Zuerst schauen wir uns um. · Der erste Entwurf entsteht auf Papier. · Dann wird es genau. · Bis Sie eingezogen sind. · Harald Menghin · Ein Projekt, Schritt für Schritt. · Online starten. Harald zeichnet weiter. · Fragen zur Arbeitsweise |
| **Keywords (primär)** | Einrichtungsplanung mit Handzeichnung · Interior Designer Vorarlberg · Raumkonzept Modell |
| **Keywords (sekundär)** | Einrichtungskonzept von Hand gezeichnet · Innenarchitektur Bodensee Modellbau · 3D-Einrichtungsplanung Vorarlberg · fotorealistisches Rendering Einrichtung · Einrichtungsberatung vor Ort · Interior Design Lochau Bregenz |
| **Open Graph** | Titel wie Title, Bild = `rendering` oder `handzeichnung` aus `media.js` (1200 × 630), bis dahin das bestehende OG-Standardbild (kein Platzhalter als OG-Bild) |
| **Interne Links hin** | siehe Durchdringungsplan (Startseite, Interior Design, Beratung, Küchen, Regionen, Team, Planer, Footer, Mega-Menü „Leistungen“ und „Das Haus“) |
| **Interne Links weg** | `/beratung`, `/ueber-uns/team`, Planer, `/interior-design-vorarlberg`, `/kuechen-vorarlberg`, `/projekte` |
| **Sitemap / llms.txt** | Eintrag in `src/lib/seo/sitemap/extraPages.js` erst mit `index: true`. llms-Zeile: „Arbeitsweise von Platzhirsch: Termin vor Ort, Handzeichnung und Raummodell von Harald Menghin, danach 3D-Planung und fotorealistisches Rendering vor der Bestellung.“ |
| **Robots** | `noindex` bis die Mindest-Bilder vorliegen (§6.3), danach `index, follow` |

### JSON-LD (über `src/components/Reusable/JsonLd`)

- **WebPage** mit `@id` `https://platzhirsch.studio/de/arbeitsweise#webpage`, `name` = H1, `inLanguage: de-AT`, `isPartOf` = `WEBSITE_ID`, `about` = `ORGANIZATION_ID`, `breadcrumb` (Home › Das Haus › Arbeitsweise), `primaryImageOfPage` erst mit echtem Bild.
- **FAQPage** mit genau den 8 sichtbaren Fragen aus K10 (gleicher Wortlaut). Hinweis: Google zeigt FAQ-Rich-Results seit 2023 nur noch für wenige Seitentypen; das Markup dient Verständnis und KI-Suche, nicht dem Snippet.
- **Person** `Harald Menghin` (`jobTitle` erst nach Bestätigung, `worksFor` = `ORGANIZATION_ID`, `image` nur mit echtem Porträt).
- **Kein `HowTo`** (Rich Result abgeschafft, und die Seite ist keine Anleitung). Kein `Review`, kein `AggregateRating`.

---

## 9. Barrierefreiheit und Performance

- H1 als LCP-Element (Text), kein Hero-Bild nötig. Ziel LCP ≤ 2,0 s mobil; Seite ist statisch (Server Component, Text aus `src/lib/arbeitsweise/copy.js` bzw. messages).
- Bildslots mit festem `aspect-ratio` (CLS ≤ 0,05), `next/image`, AVIF, `sizes` passend zur Spalte, alle unter der Falz `loading="lazy"`.
- Skizzen-Scans: hoher Kontrast nötig, wenn Text in der Skizze steht (Beschriftungen von Harald sind nicht als Text lesbar → die Bildunterschrift sagt, was die Skizze zeigt; der Alt-Text beschreibt Inhalt, nicht „Skizze“ allein: z. B. „Handzeichnung eines Wohnraums mit Sofa vor dem Fenster und Esstisch zum Garten“).
- Kette (K8): `role="radiogroup"` mit Pfeiltasten, ohne JS als einfache Liste mit allen fünf Bildern untereinander.
- Text auf Walnut: `text-inverse` (Paper, 11,77:1) und `text-inverse-soft` (Stone-deep, 8,30:1); Fokus `brass-400`.
- Schalter „Ruhige Ansicht“ wirkt wie Reduced Motion (§5.4).

---

## 10. Recht und Ehrlichkeit (Kurzcheck)

- **Nur echtes Material** (USP-Regel, UWG, AI Act Art. 50). Keine KI-Skizzen, keine generierten Modellfotos, keine generierten Räume. Die Schema-Grafik heißt „Schema“, nie „Skizze“.
- **Renderings sind Visualisierungen** und tragen das sichtbare Etikett „Visualisierung aus der Planung, kein Foto“ (Bibel §7.7). Werden beim Rendern KI-Werkzeuge genutzt (z. B. KI-Upscaling, generierte Bildteile), wird das zusätzlich angegeben (`kiStufe` in `media.js`) [anwaltlich prüfen, ob Art. 50 Abs. 4 greift].
- **Designermöbel in 3D:** Für veröffentlichte Renderings nur 3D-Modelle der Hersteller oder lizenzierte Modelle verwenden, keine eigenen Nachbauten geschützter Möbel (Bibel §14, EuGH *Mio/konektra*). Bei Herstellerprodukten in Renderings: Bildfreigabe ins Bildregister.
- **Urheber- und Nutzungsrechte:** Harald ist Urheber der Skizzen und Modelle. Schriftliche Einräumung der Nutzungsrechte an die Gesellschaft (Web, Social, Print, Ads, zeitlich unbegrenzt) und Namensnennung „Handzeichnung: Harald Menghin“ [anwaltlich prüfen, je nachdem ob Harald Gesellschafter, Angestellter oder freier Mitarbeiter ist].
- **Kunden:** Schriftliche Einwilligung für jedes Projekt (Bilder der Wohnung, Grundriss, Region). Keine Adressen, keine erkennbaren Hausfassaden, keine Personen, keine Familienfotos, keine Kunstwerke Dritter ohne Freigabe. Grundrisse privater Häuser leicht verfremden oder spiegeln (Sicherheit) – bei Skizzen ist das meist schon gegeben.
- **„Ein, zwei Tage vor Ort“** nur als „wenn Ihr Projekt es braucht“, kein Preis, keine pauschale Zusage (USP-Regel).
- **„kostenlos“** beim Termin nur, wenn das so gilt (Bibel §10.2) [Inhaber].

---

## 11. Benötigtes Material von Harald (Lieferliste)

### 11.1 Bilder

| # | Motiv | Anzahl | Format / Technik | Hinweise |
|---|---|---|---|---|
| M1 | **Handzeichnungen** (Grundriss, Perspektive, Stimmung) | mind. 12, ideal 20, aus mind. 4 Projekten | Scan 600 dpi, TIFF oder PNG, sRGB, ganze Seite mit Papierrand (nicht beschneiden); zusätzlich Foto bei Streiflicht für die Materialwirkung | pro Blatt: Projekt-ID, Monat/Jahr, Raum, was gezeigt wird; Kundennamen und Adressen auf dem Blatt abdecken |
| M2 | **Varianten-Serie** desselben Raums | 1 Serie mit 3–6 Blättern | wie M1 | zeigt „die Suche“ (K4) |
| M3 | **Modelle** | mind. 6 Fotos aus 2–3 Projekten | RAW + JPG, mind. 4000 px lange Kante, Tageslicht von der Seite, neutraler Grund (Stone `#ece8e1` oder Holztisch), je Modell: Totale, Detail, mit Hand, mit Maßstabsfigur | Maßstab notieren (1:20, 1:25, 1:50) |
| M4 | **3D-Planung** | 3–4 Screenshots | PNG, mind. 2560 px Breite | mit Maßen, ohne Kundendaten in Titelleisten |
| M5 | **Renderings** | 6–8 aus 3–4 Projekten | PNG/TIFF, mind. 3840 × 1646 (21:9) **und** 1600 × 2000 (4:5) aus derselben Kamera | Angabe Software und ob KI-Werkzeuge genutzt wurden; Herstellermodelle mit Lizenz |
| M6 | **Fotos der Umsetzung** | zu jedem Rendering 1–2 | RAW, gleiche Kamerapostion wie das Rendering, Bibel-Look „Seelicht“ (§7) | bevorzugt vom Fotografen des Shootings |
| M7 | **Vorher-Nachher-Kette** | mind. 1 Projekt komplett, ideal 3 | Vorher-Foto, Skizze, Modell, Rendering, Umsetzung, alle 3:2 möglich, gleiche Blickrichtung wo machbar | Fakten: Region, Typologie, m², Dauer in Wochen |
| M8 | **Porträt Harald** | 3 Motive | (a) beim Zeichnen, Blick auf das Blatt, 4:5; (b) Blick in die Kamera, 1:1, Grund Stone; (c) Hände mit Stift, Makro 1:1 | Fotograf mit Bibel-Preset, kein Studioblitz-Look |
| M9 | **Video-Loop** | 1–2 | 8–12 s, 4:5 und 9:16, 25 fps, ohne Ton, Hand zeichnet eine Linie | ≤ 1,2 MB mobil nach Encoding |
| M10 | **Vor Ort** | 3–4 | 3:2, Aufmaß, Notizbuch, Licht im Raum | ohne Adresse, ohne Fassade, ohne Kunden im Bild (oder mit Einwilligung) |

### 11.2 Texte und Angaben

- Bestätigter Titel/Rolle von Harald (Vorschlag „Designer & Zeichner“) und 2–3 Sätze in eigenen Worten (Ausbildung, seit wann bei Platzhirsch) – nur echte Angaben.
- Welche Werkzeuge (Papier, Stifte, Modellbaumaterial, 3D-Software, Render-Software). Hilft für ehrliche Bildunterschriften.
- Ob ein Termin direkt „mit Harald“ buchbar sein soll.

### 11.3 Einwilligungen und Rechte

| Dokument | Von wem | Inhalt |
|---|---|---|
| Nutzungsrechte-Einräumung | Harald Menghin | Skizzen, Modelle, Renderings, Porträts: Web, Social, Print, Ads, ohne zeitliche Begrenzung, Namensnennung |
| Projekt-Einwilligung | jede Bauherrschaft | Veröffentlichung von Skizze, Modell, Rendering, Fotos; Region statt Adresse; Widerruf für die Zukunft möglich; keine Personen |
| Porträt-Einwilligung | Harald, ggf. weitere Teammitglieder im Bild | Bildnisschutz (§ 78 UrhG AT), Nutzungszwecke |
| Bildfreigabe Hersteller | Marken in Renderings/Fotos | soweit Herstellerbilder oder -modelle sichtbar sind; Eintrag ins Bildregister |
| Fotograf-Lizenz | Fotograf | Nutzungsumfang wie oben, Namensnennung |

Alle Einträge ins Bildregister (Spalten laut Bibel §7.1: Datei, Quelle, Urheber, Lizenzumfang, Bearbeitung j/n, KI-Stufe, Einwilligung).

---

## 12. Offene Entscheidungen für den Inhaber

1. Leitmotiv: „Digital perfektioniert“ (Inhaber) oder „Im Raum gebaut“ (Empfehlung).
2. Haralds Titel und ob er als Termin-Ansprechperson genannt wird.
3. Ist die Handzeichnung bei **jedem** Planungsauftrag dabei oder ab einem Umfang? (FAQ 1 und Planer-Brücke hängen daran.)
4. Vor-Ort-Tage: ab welchem Projekt, kostenpflichtig oder nicht. Bis dahin kein Preis.
5. Livegang der Seite erst mit Mindest-Material (§6.3) oder vorher ohne Bilder mit nur Schema-Grafik.
6. Startseite: Bleibt das dunkle Kapitel bei „Haus & Café“ (Inhaber-Entscheidung Nr. 1) und der USP kommt als helles Kapitel? Empfehlung: ja, siehe Durchdringungsplan §1.
