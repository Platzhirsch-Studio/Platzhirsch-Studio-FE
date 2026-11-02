# Wow-Vision A: „Von Hand zum Raum“

**Rolle:** Creative Director Wow-Team · **Stand:** 28.10.2026 · **Status:** Vorschlag an den Inhaber, kein Code
**Grundlagen:** `features/usp-handzeichnung-designprozess.md` (Kern-USP), `expertenrat/00-design-bibel.md` (§2, §7, §8, §12, §13, §16 W12/W17), `qa-screenshots/jury/00-jury-urteil.md`, `teamleiter/inhaber-entscheidungen.md` (Nr. 8), heutiger Hero `src/components/Home/Hero.js` (Server-Komponente, 0 KB JS, Foto per `preload` + `<picture>`).

---

## 0. Leitidee in einem Satz

**Eine einzige Tuschelinie zeichnet vor den Augen des Besuchers den Raum, den er gleich als Foto sieht, faltet sich zum weißen Modell, bekommt Seelicht und wird deckungsgleich zum echten Showroom in Lochau. Der Besucher sieht in fünf Sekunden, wie bei Platzhirsch aus einer Zeichnung ein Raum wird.**

Arbeitstitel der Bewegung: **„Pause“** (Pauspapier). Die Zeichnung liegt wie ein Transparentpapier exakt auf dem Foto. Diese Deckungsgleichheit (Registrierung) ist der Kern des Effekts.

---

## 1. Recherche: was die stärksten Websites auszeichnet und was wir nicht kopieren

Stand der Recherche 28.10.2026 (Awwwards-Listings, eigene Kenntnis der Seiten). Bei den SOTY-Angaben zeigen die Awwwards-Listings die Kennzeichnung „Site of the Year“, in welcher Kategorie (Hauptpreis oder Developer) ist nicht in jedem Fall geprüft.

| Referenz | Was sie einzigartig macht | Was bei uns NICHT kopiert wird |
|---|---|---|
| **Igloo Inc** (abeto, SOTY-Kennzeichnung 2024, Developer) | Eine Echtzeit-3D-Welt aus Eis als eigenes Universum. Jeder Übergang ist eine Kamerafahrt, Ton und Partikel inklusive | Vollbild-WebGL als Einstieg, Ladebildschirm, scrollgetriebene Kamerafahrt. Bei uns kommt Text vor dem Effekt, und es gibt nie einen Loader |
| **Lando Norris** (OFF+BRAND, SOTY-Kennzeichnung 2025) | Die Person steht im Zentrum, Helm und Handschrift werden zum interaktiven Objekt, die Seite fühlt sich nach Persönlichkeit an | Fahrer-Ästhetik, Neon, Cursor-Spielereien. Übernommen wird nur das Prinzip: **ein Mensch und seine Hand** tragen die Marke |
| **Messenger** (abeto, SOTY-Kennzeichnung 2025) | Ein spielbarer Mini-Planet, Erzählung durch Interaktion | Spielmechanik, Figuren. Ein Möbelhaus für 45+ ist kein Spiel |
| **Lusion**, **Active Theory** (FWA-Dauergäste) | Shader-Bravour, Flüssigkeiten, Physik | Effekt als Selbstzweck. Laut Bibel W17 gibt es in Phase 1 kein WebGL im Einstieg |
| **Apple-Produktseiten** | Scroll-gekoppelte Videosequenzen, Produkt zerlegt sich, perfekte Typo | Scroll-Scrubbing mit gepinnten Abschnitten (das wäre Scroll-Hijacking), Videosequenz als Hero (W12). Übernommen wird die Disziplin: ein Gedanke pro Bildschirm |
| **Hermès** (hermes.com) | Handgezeichnete Illustrationen leben im Shop, Witz und Handwerk statt Hochglanz | Illustrationsstil, Figuren, Farbigkeit. Bei Hermès sind es Illustratoren. Bei uns ist die Linie die Planungslinie eines Designers, nicht Dekor |
| **Bottega Veneta** | Radikale Reduktion, Produkt als Skulptur, kaum Text, Mut zur Leere | Social-Verzicht und Text-Askese. Wir müssen Termin, Ort und Fakten zeigen (Bibel P5) |
| **Aesop** | Räume und Läden als Marke, Typo und Papierton, Ruhe | Fast identische Palette (Papier, Ink) bei uns schon vorhanden. Kein Aesop-Layout, kein Serifen-Zitat-Look |
| **Minotti, Poliform, B&B Italia, Vitra** | Große Herstellerfotos, Kollektionen, Video-Hero | Genau diese Sprache ist der Standard des Marktes: Katalogbild, Video, Logo. Das ist das, was „millionenfach“ vorkommt. Minotti-Bilder werden zudem nicht verändert, nicht überzeichnet und nicht beschnitten |
| **Architektur- und Visualisierungsbüros** | „Sketch to Render“-Schieberegler (Vorher/Nachher) | Den Schieberegler gibt es tausendfach. Unser Unterschied: keine zwei Bilder nebeneinander, sondern **eine** Linie, die in Echtzeit zum Raum wird und exakt auf dem Foto liegt |

**Befund:** Die Awwwards-Spitze gewinnt mit eigener Welt plus Echtzeit-3D, bezahlt das aber mit Ladezeit, Loadern und Scroll-Kontrolle. Die Luxusmarken gewinnen mit Ruhe und Bild. Niemand im Einrichtungsmarkt verbindet beides so, dass der **Planungsprozess selbst** der Wow-Moment ist und die Seite trotzdem in 2 s steht.

---

## 2. Die ersten 8 Sekunden

**Grundsatz:** Alles Lesbare (Overline, H1, Lead, Knopf „Termin wählen“, Infozeile) kommt fertig im Server-HTML und steht im ersten Frame. Die Sequenz läuft nur in der Bildbühne daneben (Desktop) bzw. darunter (Handy). Sie ist **Atmosphäre** (Bibel §8.2), blockiert nie eine Handlung und verdeckt nie Text. **Bewegung endet spätestens bei 5,0 s**, danach steht alles still (WCAG 2.2.2 verlangt dann keinen Pause-Knopf, wir bieten trotzdem „Ruhig stellen“ und „Noch einmal“).

### 2.1 Desktop (1440 × 900, Bühne rechts, 6 Spalten, festes Seitenverhältnis)

| Zeit | Was der Besucher sieht | Was technisch passiert |
|---|---|---|
| **0,0 s** | Papierton `paper`. Links stehen Overline, H1 „Italienisches Wohnen am Bodensee.“, Lead, Knopf. Rechts eine leere Papierfläche mit feinem Raster aus 4 % Ink, wie Zeichenkarton | HTML aus dem statischen Shell. Das Hero-Foto ist vorgeladen und **liegt bereits voll deckend gemalt** unter einer Papier-Ebene („Pause“). LCP-Element ist damit das Foto oder die H1, gemalt im ersten Frame |
| **0,2 – 1,4 s** | Eine einzige Linie setzt unten links an (Bodenkante), läuft wie mit Fineliner gezogen die Fluchtlinien des Raums ab: Boden, Wandkante, Fensteröffnung zum See, dann mit einem Schwung die Kontur des Sofas. Leichte Strichstärken-Schwankung, Ink `#30373e` | Inline-SVG, 30–60 Pfade, `stroke-dashoffset` per CSS-Keyframes, `pathLength="1"`. Die Pfade sind über das echte Foto nachgezeichnet, deshalb liegen sie auf dem Pixel richtig. 0 KB JS |
| **1,4 – 2,4 s** | Die Linien werden räumlich: Wände und Boden schieben sich als weiße Kartonflächen mit dünner Kante aus der Zeichnung, wie ein Bauträgermodell aus Finnpappe. Das Sofa wird ein schlichter weißer Block | SVG-Polygone in `bone`/`stone`, Füllung per `opacity` und `transform` (scaleY aus der Grundlinie, Ursprung an der Kante), höchstens 5 Gruppen gestaffelt à 60 ms |
| **2,4 – 3,4 s** | Seelicht fällt ein: ein warmes Lichtband wandert vom Seefenster schräg über Modellboden und Wand, die Kartonflächen bekommen Licht- und Schattenseite | Eine Verlaufsebene (`linear-gradient`, warm 2.700 K-Anmutung, max. 10 % Deckkraft) wird per `transform: translateX` geschoben. Kein Shader |
| **3,4 – 4,6 s** | Material: Fläche für Fläche löst sich das Modell auf und gibt das echte Foto frei, zuerst der Boden, dann die Wände, zuletzt das Sofa im echten Stoff. Die Kanten der Freigabe sind exakt die gezeichneten Linien | `clip-path: polygon()` auf der Papier-Ebene (nicht auf dem Foto), höchstens 2 Masken gleichzeitig (Bibel §8.2). Das Foto selbst wird nie skaliert, nie eingeblendet, nie verändert |
| **4,6 – 5,0 s** | Die Linien bleiben einen Atemzug als Haarlinie auf dem Foto liegen und ziehen sich dann bis auf eine zurück: die Horizontlinie | Pfade auf 12 % Deckkraft, dann auf 0. Die eine verbleibende Linie ist die „Horizontlinie“ der Seite (Bibel §6, höchstens 1 pro Seite) |
| **5,0 – 8,0 s** | Stillstand. Unter der Bühne erscheint ohne Bewegung die Zeile **„Linie · Modell · Licht · Raum“** als vier kleine Schalter und die Bildzeile „Foto: Showroom Lochau · Linie: abstrahierte Grafik“. Beim Hover über das Foto zeigt eine runde Lupe (Ø 180 px) die Zeichnung darunter: „durch das Pauspapier sehen“ | Insel ≤ 4 KB: Schalter springen in einen der vier Zustände (Klick, Tastatur, `aria-pressed`), „Noch einmal“ spielt die Sequenz neu. Lupe nur bei `pointer: fine`, per `mask-image` mit CSS-Variablen; ohne Lupe gibt es den Schalter „Zeichnung zeigen“ |

### 2.2 Handy (390 × 844, Reihenfolge wie heute: Overline → H1 → Knopf → Bühne 4:5 → Lead → Infozeile)

| Zeit | Was der Besucher sieht | Unterschied zum Desktop |
|---|---|---|
| **0,0 s** | H1, Knopf „Termin wählen“ und der obere Teil der Bühne stehen im ersten Viewport. Bühne zeigt Zeichenkarton | Eigenes 4:5-Foto per `<picture>` (Bibel §7.8), ≤ 120 KB AVIF, vorgeladen |
| **0,2 – 1,2 s** | Linie zeichnet den Raum, nur 15–25 Pfade (weniger Details, kräftigerer Strich 1,5 px) | Kürzer, weniger Pfade, damit das Hauptthread-Budget klein bleibt. Start erst, wenn die Bühne ≥ 50 % sichtbar ist (bei 844 px Höhe sofort) |
| **1,2 – 2,0 s** | Modell faltet sich auf (3 Flächengruppen) | |
| **2,0 – 2,8 s** | Seelicht-Band | |
| **2,8 – 4,0 s** | Foto wird freigegeben, Boden → Wände → Möbel | |
| **4,0 – 8,0 s** | Stillstand, eine Horizontlinie bleibt. Die vier Zustände als Wischleiste unter dem Bild (Scroll-Snap, 44 px Trefferfläche), keine Lupe | Statt Lupe ein Tipp auf das Bild: Zeichnung ein/aus |

**Bei reduzierter Bewegung** (System oder Schalter „Ruhige Ansicht“, Bibel §8.4): Es steht sofort das fertige Foto mit der einen Horizontlinie da. Die vier Zustände bleiben als Schalter erhalten und zeigen je ein Standbild (Linie, Modell, Licht, Raum), Wechsel nur per `opacity` in 150 ms. Damit ist die Geschichte vollständig erzählt, nur ohne Bewegung.

**Ohne JS:** Die CSS-Sequenz läuft trotzdem, die Schalter fehlen, die Bildzeile steht da. **Ohne WebGL:** nichts fehlt, denn Phase 1 nutzt kein WebGL.

---

## 3. Was beim Scrollen folgt

Natives Scrollen, kein Pinnen, kein Scroll-Scrubbing. Scroll-Effekte nur mit CSS `animation-timeline: view()` hinter `@supports`. Ohne Unterstützung steht alles sichtbar da.

1. **Die Linie wird zum Faden der Seite.** Die verbleibende Horizontlinie aus dem Hero ist im nächsten Abschnitt der Anfang einer Haarlinie, die sich beim Scrollen von links nach rechts zeichnet (Signature „Horizontlinie“, Bibel §8.3). Optisch läuft die Linie aus dem Hero weiter, technisch sind es zwei Elemente.
2. **Das dunkle Kapitel „Von der Handzeichnung zum Raum“** (die eine Walnut-Fläche der Seite, wie im USP-Papier gefordert): die 7 Prozessschritte als Kette. Jeder Schritt hat ein Bildfeld, und in jedem Feld zeichnet sich beim Eintritt in den Viewport ein kleines Liniensymbol (Gespräch, Ortstermin mit Sonnenbahn, Handzeichnung, Modell, 3D, Rendering, Einzug), 600 ms, in `brass-400` auf Walnut. Die Bildfelder füllen sich mit **echtem Material von Harald**, sobald es geliefert ist (Skizze, Modellfoto, Rendering, Foto der Umsetzung desselben Projekts). Bis dahin stehen dort im Entwicklungsstand markierte Platzhalter „Bild folgt“, im Livegang keine.
3. **„Ein Projekt, vier Zustände“:** ein Vollbreiten-Band mit demselben Projekt als Skizze, Modell, Rendering und Foto, umschaltbar mit denselben vier Schaltern wie im Hero („Linie · Modell · Licht · Raum“). So wiederholt sich das Bedienmuster des Einstiegs mit echtem Material. Der Hero zeigt die Idee abstrakt, dieser Abschnitt den Beweis.
4. **Harald beim Zeichnen:** Porträt mit Hand und Stift (Shotliste ergänzen), Zitat nur mit Freigabe, darunter „Online starten – Harald zeichnet Ihr Konzept anschließend von Hand“ als Brücke zu Küchen- und Sofaplaner.
5. Danach die übrigen Startseiten-Abschnitte der anderen Teams (Räume, Haus und Café, Projekte, Marken, Dreiländer, TrustBlock, „Nehmen Sie Platz.“). Das Wow-Team fasst diese nicht an.

---

## 4. Technik: wie das mit LCP ≤ 2,0 s mobil machbar ist

**Reihenfolge der Auslieferung**

1. **Statischer Shell (Server-HTML):** H1, Lead, Knopf, Infozeile, `<picture>` mit Foto (vorgeladen per `preload` mit `fetchPriority: "high"`, so wie der heutige Hero), darüber die Papier-Ebene und das **inline-SVG** der Zeichnung. Kein Client-Code ist für den ersten Frame nötig.
2. **CSS-Animation** startet mit dem ersten Paint. Die gesamte Sequenz ist CSS (Keyframes auf `stroke-dashoffset`, `transform`, `opacity`, `clip-path`). Das läuft auf dem Compositor bzw. ist billig und braucht kein Hydration.
3. **Insel `WowHeroControls`** (`'use client'`, ≤ 4 KB gzip) hydriert danach: vier Zustands-Schalter, „Noch einmal“, „Zeichnung zeigen“, Lupe. Fehlt sie, ist nichts kaputt.
4. **Optional, Phase 2:** `three` / `@react-three/fiber` nur nach Klick auf „Modell drehen“, per dynamischem Import, nie im Initial-Bundle (Bibel §13). Inhalt wäre das **echte 3D-Planungsmodell** eines Projekts von Harald (glTF, Draco), nicht ein erfundenes.

**Warum das LCP sicher ist**

- **LCP-Kandidat ist das vorgeladene Foto**, das ab dem ersten Frame voll deckend gemalt ist. Die Papier-Ebene darüber ist ein eigenes Element ohne Bild und ohne Text, also selbst kein LCP-Kandidat. Chrome misst die Bildzeit beim Malen, Überdeckung durch andere Elemente wird nicht abgezogen. Das Foto wird nie mit `opacity: 0` gestartet, denn unsichtbare Bilder zählen nicht und würden das LCP nach hinten schieben.
- **Rückfall, falls eine Browserversion Überdeckung künftig berücksichtigt:** Auf dem Handy ist die H1 (Bodoni, `display-l`) im ersten Viewport das zweitgrößte Element und steht sofort. Wir messen beide Fälle und legen notfalls fest, dass die Bühne mobil kleiner als der H1-Block ist, damit die H1 das LCP-Element wird.
- **Gewichte:** Foto mobil ≤ 120 KB AVIF (heute ca. 9–16 KB), SVG inline ≤ 12 KB gzip (Pfade auf 1 Dezimalstelle gerundet), CSS der Sequenz ≤ 3 KB. Schriften wie gehabt ≤ 2 Dateien vorgeladen.
- **CLS < 0,05:** Bühne mit festem `aspect-ratio` (4:5 mobil, Desktop feste Höhe wie heute `min-h-[34rem]`), SVG mit `viewBox` identisch zum Foto, Schalterzeile mit reservierter Höhe im Server-HTML.
- **INP:** keine Arbeit im Hauptthread während der Sequenz, Schalter reagieren in ≤ 100 ms.
- **Messung:** Playwright-Video (`recordVideo`) und Bildfolgen der 8 Sekunden auf Desktop und Handy, dazu LCP/CLS per `PerformanceObserver` im Test (`tests/**/wow*`, `PW_WORKERS=1`). Für den Produktions-Maßstab gilt die CI bzw. ein getrennter Build außerhalb des Repo-Ordners, da im Repo kein `npm run build` laufen darf. Drosselung: 4× CPU, „Slow 4G“.

**Wie die Zeichnung entsteht (Phase A, ohne Harald-Material)**

- Ein Designer zeichnet die Fluchtlinien und Konturen des **eigenen** Showroom-Fotos von Hand als Vektor nach (Illustrator/Figma, Ebene über dem Foto, 30–60 Pfade, Zeichenreihenfolge = Animationsreihenfolge). Export als SVG nach `public/wow/` bzw. als Pfaddaten in `src/lib/wow/`.
- Ein Node-Skript (sharp, kein Python) prüft beim Build die Deckung: gleiche Abmessungen von `viewBox` und Foto, Pfade innerhalb der Bildfläche.
- Die Linie wird ausdrücklich als **abstrahierte Grafik** gekennzeichnet, nicht als Skizze von Harald.

**Phase B, sobald Harald liefert: die echte Hand**

- Harald zeichnet die Showroom-Ansicht einmal auf einem Stift-Tablett. Eine kleine interne Aufnahmeseite speichert jeden Strich mit Druck und Zeitstempel als JSON.
- Die Seite spielt dann **seine echten Striche in seinem echten Tempo** ab (zeitlich auf 1,2 s gestaucht, Reihenfolge original). Bildzeile: „Linie: Harald Menghin, aufgezeichnet am …“.
- Das ist echtes Material, keine KI, und es ist der Moment, den es so im Markt nicht gibt: Der Besucher sieht die Hand des Designers zeichnen, bevor er überhaupt scrollt.

---

## 5. Benötigtes Material

| # | Material | Von wem | Pflicht für |
|---|---|---|---|
| 1 | **Ein eigenes Showroom-Foto** mit klarer Raumperspektive (Boden, zwei Wände, Fenster zum See, ein Sofa oder Tisch als Hauptobjekt), 21:9 Desktop und 4:5 Handy aus **derselben Stativposition**, Bildregister-Eintrag | Fotograf, Shotliste Tag 1 | Phase A |
| 2 | Freigabe, welches Produkt im Foto steht. Empfehlung: ein ClassiCon-Stück oder eigenes Möbel im eigenen Foto. Minotti im eigenen Showroom-Foto ist möglich, aber kein Herstellerbild überzeichnen, keine Freistellung von Minotti-Bildern | Inhaber | Phase A |
| 3 | Vektor-Nachzeichnung des Fotos (siehe §4) | Wow-Team / Designer | Phase A |
| 4 | Aufgezeichnete Tablet-Zeichnung von Harald (dieselbe Ansicht) und seine Einwilligung zur Veröffentlichung | Harald Menghin | Phase B |
| 5 | Ein Projekt als Kette: Skizze, Modellfoto, Rendering, Foto der Umsetzung, mit Kundeneinwilligung oder anonymisiert | Inhaber / Harald | Kapitel „Ein Projekt, vier Zustände“ |
| 6 | Porträt von Harald beim Zeichnen und am Modell | Fotograf | Kapitel Prozess |
| 7 | Optional: echtes 3D-Planungsmodell eines Projekts (Export glTF) | Harald | Phase 2 „Modell drehen“ |
| 8 | Haralds Titel (Vorschlag „Designer & Zeichner“) | Inhaber | Bildzeile |

**Textvorschläge** (gehören in `features/wow-messages-vorschlag.json`, Stimme nach Bibel §1, Sie-Form, keine Superlative):
- Schalter: „Linie“, „Modell“, „Licht“, „Raum“; „Noch einmal“; „Zeichnung zeigen“ / „Zeichnung ausblenden“.
- Bildzeile Phase A: „Foto: Showroom Lochau. Linie: abstrahierte Grafik.“
- Bildzeile Phase B: „Linie: Harald Menghin, von Hand gezeichnet.“
- Unterzeile der Bühne (optional, eine Zeile): „Bei uns beginnt jeder Raum mit einer Linie.“
- `aria-label` der Bühne: „Animation: Eine Linie zeichnet den Showroom, wird zum Modell und dann zum Foto.“ Das Foto behält seinen Alt-Text.

---

## 6. Risiken und Gegenmittel

| Risiko | Wirkung | Gegenmittel |
|---|---|---|
| Ungenaue Deckung von Linie und Foto | Der Effekt wirkt billig | Nachzeichnung am Originalfoto, gleiche `viewBox`, Build-Prüfung, Sichtprüfung per Bildfolge bei 375, 768, 1440 px |
| Verwechslung abstrakter Linie mit Haralds Werk | Irreführung (UWG), Vertrauensschaden | Bildzeile „abstrahierte Grafik“ bis Phase B. Keine Formulierung „Haralds Skizze“ ohne echtes Material |
| Bibel-Abweichung W12 (Hero-Foto steht still) | Konflikt mit verbindlicher Regel | Das Foto selbst bleibt still, voll deckend und unverändert. Bewegt wird nur die Ebene darüber. Nachtrag W22 unten |
| Bibel P7 (Auftakt nach ≤ 1100 ms still) | Konflikt | Alles **Lesbare** steht nach 0 ms still. Die Bühne ist Atmosphäre (600–2400 ms je Phase), Gesamtdauer ≤ 5 s. Nachtrag W23 unten |
| LCP-Messung ändert sich (Überdeckung) | LCP > 2 s | Rückfall H1 als LCP (§4), beide Fälle im Test |
| Schwache Handys ruckeln bei `clip-path` | Unruhiger Eindruck | Mobil weniger Pfade, max. 2 Masken gleichzeitig, `@media (update: slow)` und `prefers-reduced-data` → fertiges Standbild |
| Wiederholungsbesuch: die Animation nervt | Abnutzung | Sequenz einmal pro Sitzung (`sessionStorage` in try/catch), danach Standbild mit „Noch einmal“ |
| Andere Teams ändern Hero-Umfeld parallel | Merge-Konflikte | Wow-Code nur in `src/components/Wow/**`, in `Hero.js` nur der Schalter `NEXT_PUBLIC_WOW_HERO`, alter Hero bleibt Fallback |
| Effekt wirkt wie „Agentur-Showreel“ (Bibel W1) | Leiser Luxus geht verloren | Eine Farbe (Ink), eine Linie, Papierton, kein Ton, keine Partikel, kein Cursor-Effekt außer der Lupe |
| Material von Harald kommt spät | Prozesskapitel leer | Hero funktioniert vollständig ohne Harald-Material. Prozesskapitel geht nur mit echtem Material live, sonst ohne Bildfelder |

---

## 7. Warum das noch niemand im Markt hat

1. **Der Prozess ist der Effekt.** Hersteller und Händler zeigen das Ergebnis (Foto, Video). Architekten zeigen Vorher/Nachher-Schieberegler. Niemand zeigt die **Entstehung** als eine fortlaufende Linie, die exakt im echten Raum landet. Das ist nur glaubwürdig für ein Haus, in dem tatsächlich von Hand gezeichnet und im Modell gebaut wird, und genau das ist der Kern-USP.
2. **Handwerk und Hightech in einem Bild.** Die Linie ist Hand, die Registrierung auf dem Pixel ist Technik. Der Besucher spürt beides, ohne dass es erklärt wird.
3. **Wow ohne Wartezeit.** Die Awwwards-Spitze erkauft den Wow mit Loader und WebGL. Hier steht die Seite sofort, und die Sequenz ist reines HTML/CSS. Das ist schwer zu kopieren, weil es Präzisionsarbeit am eigenen Foto ist, keine Bibliothek.
4. **Phase B ist nicht kopierbar.** Die aufgezeichneten Striche eines namentlich genannten Designers sind ein Original. Ein Mitbewerber müsste selbst von Hand zeichnen, um das nachzumachen.

---

## 8. Vorgeschlagene Nachträge zur Design-Bibel (§16)

| # | Thema | Vorschlag | Begründung |
|---|---|---|---|
| **W22** | Hero-Bewegung (ergänzt W12) | Das Hero-Foto bleibt still, voll deckend, unskaliert und unverändert. **Erlaubt** ist eine einmalige Zeichen-Sequenz auf einer Ebene **über** dem Foto (Linie, Modell, Licht, Freigabe per `clip-path`), ≤ 5 s, nur CSS, einmal pro Sitzung, mit vier Zustands-Schaltern und vollwertigem Reduced-Motion-Standbild | Der Kern-USP (Inhaber-Entscheidung 8) braucht einen Beweis im ersten Viewport. Das Foto bleibt Beweis des Ortes und LCP, die Bewegung zeigt den Prozess |
| **W23** | Auftakt-Ruhe (präzisiert P7) | „Alles Lesbare steht nach ≤ 1100 ms still“ gilt für Text und Bedienelemente. Eine reine Bildbühne darf als Signature-Moment bis 5 s laufen, wenn sie Text weder bewegt noch verdeckt | WCAG 2.2.2 ist bei ≤ 5 s erfüllt, Handlungen sind ab 0 ms möglich |
| **W24** | Signature-Momente (§8.3) | Neuer Eintrag „Von Hand zum Raum“ als einziger Höhepunkt der Startseite. Die „Horizontlinie“ der Startseite ist das Ende dieser Sequenz und zählt nicht als zweiter Höhepunkt | Bibel erlaubt höchstens 1 Höhepunkt pro Seite |
| **W25** | WebGL (ergänzt W17) | Phase 1 bleibt ohne WebGL. Phase 2 „Modell drehen“ mit echtem 3D-Planungsmodell nur nach Klick, dynamisch geladen | Echtes Material, kein Initial-Bundle |

---

## 9. Abnahmekriterien für den Bau (Vorschlag)

- LCP ≤ 2,0 s mobil (4× CPU, Slow 4G, Produktions-Build außerhalb des Repos bzw. CI), CLS < 0,05, INP ≤ 150 ms.
- Initial-JS der Wow-Insel ≤ 4 KB gzip, `three` nicht im Initial-Bundle.
- Reduced Motion und „Ruhige Ansicht“: Standbild sofort, vier Zustände per Schalter erreichbar.
- Tastatur: alle Schalter fokussierbar, sichtbarer Fokus (Bibel W21), `aria-pressed`, Reihenfolge nach H1 und Termin-Knopf.
- Ohne JS und ohne WebGL: Sequenz läuft per CSS bzw. Endzustand steht, kein leerer Bereich.
- Playwright-Video Desktop 1440 × 900 und Handy 390 × 844 zeigt Deckung von Linie und Foto bei jeder Phase.
- Bildzeile vorhanden, keine Aussage, die die abstrakte Linie Harald zuschreibt.
- 5-Sekunden-Test (Bibel §3, n ≥ 30): mindestens 60 % nennen ungestützt „zeichnen/planen/Designer“ als Angebot.
