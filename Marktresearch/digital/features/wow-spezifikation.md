# Wow-Spezifikation: Einstieg „Pause“ (Von Hand zum Raum)

**Rolle:** Wow-Jury (Vorsitz: Awwwards-Juror, Luxus-Markenchef, Performance-Ingenieur) · **Stand:** 28.10.2026 · **Status:** verbindliche Bauvorlage für das Wow-Team. Die Freigabe für die Produktion gibt der Inhaber.
**Grundlagen:** `wow-vision-hand-zu-raum.md` (A), `wow-vision-lebendiger-raum.md` (B), `wow-vision-galerie-buehne.md` (C), Design-Bibel `expertenrat/00-design-bibel.md`, Jury-Urteil `qa-screenshots/jury/00-jury-urteil.md`, `teamleiter/inhaber-entscheidungen.md` (Nr. 8), `features/usp-handzeichnung-designprozess.md`, heutiger `src/components/Home/Hero.js`.

---

## 0. Urteil der Jury

**Gewählt wird Vision A „Von Hand zum Raum“. Sie wird verschlankt und bekommt genau ein Element aus B. Von C bleibt eine Regel.**

| Vision | Stärke | Warum sie nicht trägt bzw. was übernommen wird |
|---|---|---|
| **A Hand zu Raum** | Der Kern-USP (Inhaber-Entscheidung 8) wird selbst zum Wow. Der Mechanismus ist neu: Die Linie liegt deckungsgleich auf dem echten Foto. Ab sofort baubar mit dem vorhandenen eigenen Showroom-Foto, 0 KB Pflicht-JS, kein WebGL | **Basis.** Gestrichen werden: Phase-2-WebGL im Einstieg, das „rote Faden“-Scrollkapitel (gehört anderen Teams) und die `clip-path`-Freigabe (ersetzt durch Opacity je Fläche, weniger Bibel-Abweichung) |
| **B Lebendiger Raum** | Der stärkste Gedanke im Sinne von Peak-End: der **leere Sessel** als wortloses „Nehmen Sie Platz.“ | Der ganze Wow hängt an einem nicht gebuchten Shooting (Tagesreihe), an einer ungeklärten Wetterlizenz, an RTI und an der offenen Frage nach dem Seeblick. Dazu kommt ein LCP-Risiko durch den Crossfade. **Übernommen:** der Sessel als Antwort auf „Termin wählen“, aber als Linie und ohne Fototausch. Die Tagesreihe kommt später als reine Bildauswahl (Seelicht, Bibel §12.1) und ohne eigenen Effekt |
| **C Galerie-Bühne** | Starke Haltung für Katalog-Abschnitte (Objektschild) | Der Einstieg wäre ein sehr schönes Magazin, aber nichts, was der Markt nicht kennt: große Serife, gerahmtes Bild, Licht an. **Übernommen:** die Regel „Die Kamera bewegt sich, nicht das Werk“. Das Foto bewegt sich nie, wird nie skaliert und nie getönt. Das Objektschild empfehlen wir den Teams für Räume und Produkte, es ist nicht Teil dieses Einstiegs |

**Warum genau das, aus Sicht der drei Vorsitzenden:**
- **Awwwards-Juror:** Neu ist nicht der Effekt (Linien zeichnen gibt es), sondern die **Registrierung**: Eine Zeichnung wird pixelgenau zum echten Raum. Das ist ein Gedanke, ein Bild, eine Bewegung, und er wird im Kopf behalten.
- **Luxus-Markenchef:** Eine Farbe, eine Linie, Papier. Kein Loader, kein Cursor-Spiel, kein Ton. Die Seite zeigt, *wie* hier gearbeitet wird, statt Luxus zu behaupten.
- **Performance-Ingenieur:** Das LCP gehört einem vorgeladenen Bild, das ab dem ersten Frame gemalt ist. Die Sequenz ist reines CSS auf Server-HTML. Ohne JS läuft sie trotzdem, ohne WebGL fehlt nichts.

---

## 1. Leitidee

**Eine einzige Tuschelinie zeichnet den Raum, faltet sich zum weißen Kartonmodell, bekommt Licht und gibt dann Fläche für Fläche das echte Foto des Showrooms in Lochau frei. Wie Pauspapier liegt sie exakt darauf.** In vier Sekunden sieht der Besucher, was ihn bei Platzhirsch erwartet: Linie, Modell, Licht, Raum. Danach ist Ruhe.

Arbeitstitel: **„Pause“** (von Pauspapier). Nach außen heißt es nicht so.

Ehrlichkeitsregel: Die Linie ist bis Phase B eine **abstrahierte Grafik**. Das steht sichtbar in der Bildzeile. Sie wird nie als Haralds Zeichnung bezeichnet.

---

## 2. Ablauf mit Zeiten und Easing

Die Zeiten zählen ab dem ersten Paint. Alles Lesbare (Overline, H1, Lead, „Termin wählen“, „Showroom & Café“, Infozeile) steht **ab Frame 0 fertig und still** und kommt unverändert aus dem heutigen `Hero.js`. Die Sequenz läuft nur in der Bildbühne. Easing-Tokens nach Bibel §8.1.

### 2.1 Desktop ≥ 1024 px und Tablet 640–1023 px (Gesamtdauer 5,0 s)

| Phase | Zeit | Was man sieht | Technik | Easing |
|---|---|---|---|---|
| 0 Karton | 0–200 ms | Die Bühne zeigt Papier (`paper`) mit einem feinen Raster aus 4 % Ink. Unter „Linie · Modell · Licht · Raum“ steht die Schalterleiste, der Zustand „Linie“ ist markiert | Das Foto ist vorgeladen und **voll deckend gemalt**. Darüber liegt die Papierebene als eigenes SVG, ohne Bild und ohne Text | – |
| 1 Linie | 200–1400 ms | Die Linie setzt an der Bodenkante unten links an und zieht die Fluchtlinien: Boden, Vorhangfront, Deckenkante, Kaminband rechts. Dann folgen in Schwüngen die Konturen von Ecksofa, Couchtischen und den zwei Sesseln vorn | Inline-SVG, Desktop 30–45 Pfade in 5 Gruppen, `pathLength="1"`, `stroke-dashoffset 1→0`. Strichstärke 1,25 px, Ink, `vector-effect: non-scaling-stroke` | je Pfad `--ease-quiet-inout`, 240–520 ms je nach Länge, Gruppen um 160–240 ms versetzt |
| 2 Modell | 1400–2400 ms | Boden, Wände und Möbel stellen sich als weiße Kartonflächen mit dünner Kante auf, wie ein Modell aus Finnpappe. Die Möbel werden schlichte Blöcke | SVG-Polygone in `bone` und `stone`, `transform: scaleY(0.001→1)` mit dem Ursprung auf der Grundkante, dazu `opacity 0→1`. Höchstens 5 Gruppen | `--ease-quiet`, 600 ms je Gruppe, Versatz 60 ms (Bibel-Stagger) |
| 3 Licht | 2400–3400 ms | Ein warmes Lichtband fällt von der Fensterfront links schräg über Modellboden und Wand. Die Kartonflächen bekommen eine Licht- und eine Schattenseite | ein `<div>` mit `linear-gradient` (paper → brass-400, höchstens 10 % Deckkraft), `translateX(-40% → 0)`. Schattenseiten über `opacity` von Polygonen in `stone-deep` (höchstens 18 %) | `--ease-drift`, 1000 ms. Das Band blendet zwischen 3200 und 3400 ms aus, **bevor** das Foto sichtbar wird. Ein Foto wird nie getönt |
| 4 Raum | 3400–4600 ms | Fläche für Fläche gibt das Modell das Foto frei: zuerst der Boden, dann die Wände, zuletzt Sofa und Sessel im echten Stoff. Die Kanten der Freigabe sind die gezeichneten Linien | Die Papier- und Modellflächen sind dieselben Polygone. Jede Region geht `opacity 1→0`. Es laufen höchstens 2 Regionen gleichzeitig. Das Foto selbst wird nicht animiert | `--ease-quiet-inout`, 600 ms je Region, Start bei 3400, 3700 und 4000 ms |
| 5 Ausklang | 4600–5000 ms | Die Linien liegen noch einen Atemzug als Haarlinie auf dem Foto und verschwinden dann. Das Foto steht sauber und unverändert | Linien-Gruppe `opacity 0,35 → 0` | `--ease-exit`, 400 ms |
| Ruhe | ab 5000 ms | Stillstand. In der Schalterleiste ist „Raum“ aktiv, „Noch einmal“ erscheint. Am Desktop zeigt eine Lupe beim Überfahren des Fotos die Zeichnung darunter | Insel `WowControls` (Abschnitt 4) | Lupe folgt dem Zeiger ohne Nachlauf, Ein- und Ausblenden in `--duration-micro` |

**Die Schalterleiste erzählt mit.** Die vier Beschriftungen „Linie · Modell · Licht · Raum“ stehen ab Frame 0 im Server-HTML. Ein 1 px Ink-Unterstrich wandert per CSS-Keyframe auf derselben Zeitachse mit (Sprung an den Phasengrenzen, `--duration-micro`). Ohne Worte versteht der Besucher so, dass hier ein Prozess in vier Schritten läuft.

### 2.2 Handy < 640 px (Gesamtdauer 4,0 s)

| Phase | Zeit | Unterschied zum Desktop |
|---|---|---|
| 1 Linie | 200–1200 ms | nur die Pfade der Gruppe `base` (15–20), Strich 1,5 px |
| 2 Modell | 1200–2000 ms | 3 Flächengruppen, 500 ms je Gruppe |
| 3 Licht | 2000–2800 ms | wie Desktop, 800 ms |
| 4 Raum | 2800–3700 ms | 3 Regionen zu je 500 ms, Start bei 2800, 3000 und 3200 ms |
| 5 Ausklang | 3700–4000 ms | 300 ms |

**Startbedingung (Desktop und Handy):** Ein Inline-Skript vor der Bühne prüft vor dem ersten Paint, ob die Bühne zu mindestens 50 % im Viewport liegt. Ist sie das nicht (kleine Handys, Querformat, Rücksprung mit Scrollposition), steht sofort der Endzustand mit „Noch einmal“. Dasselbe gilt für Wiederholungsbesuche in derselben Sitzung (`sessionStorage` in try/catch).

### 2.3 Der leere Sessel (aus Vision B)

Fährt man mit der Maus über „Termin wählen“ oder fokussiert den Knopf mit der Tastatur, zeichnet sich nach Ende der Sequenz auf dem Foto die Kontur **eines** der beiden vorderen Sessel (280 ms, `--ease-quiet`, Ink 60 %). Beim Verlassen verschwindet sie in 180 ms (`--ease-exit`). Das ist „Nehmen Sie Platz.“ ohne Worte. Der Satz selbst steht weiter nur einmal, im Schluss-CTA (W15).

Technik: reines CSS über `section:has([data-wow-cta]:is(:hover, :focus-visible)) [data-wow-chair]`, 0 KB JS. Auf Touch-Geräten entfällt der Effekt. Er ist dekorativ (`aria-hidden`).
**Freigabe-Gate:** Lupe und Sessel legen Linien über Möbel im eigenen Foto (vermutlich Minotti-Stücke). Beides ist vom Besucher ausgelöst, dauert nur kurz und ist rückgängig, das Foto selbst bleibt unverändert. Vor dem Livegang trotzdem im Bildregister abzeichnen lassen. Ohne dieses OK sind beide über die Konstante `WOW_OVERLAY_INTERACTIONS` in `src/lib/wow/config.js` aus.

---

## 3. Layout

Gerüst und Textspalte bleiben **identisch zum heutigen Hero**, DOM-Reihenfolge wie heute. Getauscht wird nur der Inhalt des Bildfelds (Block 3 in `Hero.js`). Darunter steht eine reservierte Leiste.

| | Desktop ≥ 1024 | Tablet 640–1023 | Handy < 640 |
|---|---|---|---|
| Bühne | Spalten 7–12, `row-span-4`, Höhe wie heute `min-h-[34rem]` | volle Breite, `aspect-ratio: 3/2` | volle Breite, `aspect-ratio: 3/2` (Phase A, vorhandenes Foto). Mit dem Shooting wird daraus ein eigenes 4:5-Foto (Bibel §7.8) |
| Schalterleiste | unten in der Bühne, eigene Zeile, 52 px reserviert, Papiergrund mit `line-strong`-Haarlinie oben. Links „Linie · Modell · Licht · Raum“, rechts „Noch einmal“ | wie Desktop, 52 px | 2 Zeilen, 96 px reserviert: Zeile 1 die vier Schalter (44 px, waagerecht, kein Scrollen nötig), Zeile 2 Bildzeile `small` und „Noch einmal“ |
| Bildzeile | „Foto: Showroom Lochau · Linie: abstrahierte Grafik“, `small`, `text-soft`, unter der Schalterleiste | wie Desktop | in Zeile 2 |
| Lupe | Ø 180 px, nur bei `(hover: hover) and (pointer: fine)` | nur bei feinem Zeiger | keine. Stattdessen ist der Schalter „Linie“ der Weg zur Zeichnung |
| Erster Viewport | H1, Knopf, Infozeile und Bühne sichtbar (1440 × 900) | H1, Knopf und Bühnenanfang | 390 × 844: Overline, H1, Knöpfe, Bühne komplett. 375 × 667: Bühne angeschnitten, dann Endzustand nach Startbedingung |

**Deckung bei jeder Breite:** `<img>` mit `object-fit: cover; object-position: 50% 50%` und alle SVGs mit identischer `viewBox="0 0 2048 1228"` (Originalmaß von `aboutHome.jpg`) und `preserveAspectRatio="xMidYMid slice"`. Dadurch schneiden Foto und Zeichnung bei jedem Seitenverhältnis identisch zu. Für das 4:5-Foto aus dem Shooting gibt es eine eigene Pfaddatei.

---

## 4. Komponenten und Dateien

| Datei | Art | Inhalt |
|---|---|---|
| `src/components/Home/Hero.js` | **einzige** Änderung außerhalb der Wow-Ordner | (1) Schalter inline: `const WOW_HERO = (process.env.NEXT_PUBLIC_WOW_HERO ?? (process.env.NODE_ENV === "production" ? "0" : "1")) === "1";` (2) In Block 3: `WOW_HERO ? <WowStage img={img} alt={…} locale={locale} /> : <picture>…</picture>`, die Preload-Logik bleibt unverändert und gilt für beide Fälle. (3) `data-wow-cta` am Knopf „Termin wählen“. Ist der Schalter aus, ist der Hero Byte für Byte der heutige. Datei vor der Änderung neu lesen, denn andere Teams arbeiten parallel |
| `src/components/Wow/WowStage.js` | Server-Komponente | `<figure>` mit `<picture>` (Props aus `Hero.js`), Papier-/Modell-SVG, Linien-SVG, Lichtband, Sessel-Kontur, Inline-Startskript, Schalterleiste als Server-HTML, `<figcaption>`. Setzt `data-wow="play" \| "still"` und `data-wow-state` |
| `src/components/Wow/WowStage.module.css` | CSS | Keyframes und Zustände, Zeiten als CSS-Variablen aus `timeline.js` (inline `style`). Reduced Motion: `@media (prefers-reduced-motion: reduce)` **und** `:root[data-motion="reduced"]` |
| `src/components/Wow/WowControls.js` | `'use client'`, ≤ 4 KB gzip | Macht die Server-Schalter bedienbar: `aria-pressed`, Klick und Tastatur, springt in einen von vier Zuständen, „Noch einmal“ (Animation neu starten über einen Klassenwechsel), Lupe (`mask-image: radial-gradient` mit `--x/--y`, `pointermove` mit rAF-Drossel), `sessionStorage`. Keine Bibliothek, kein `motion` |
| `src/lib/wow/pause-paths.js` | Daten | Pfade `{ id, group: 1–5, detail: "base" \| "fine", d }`, Reihenfolge = Zeichenreihenfolge, Koordinaten auf 1 Dezimalstelle |
| `src/lib/wow/regions.js` | Daten | Polygone für Papier-/Modellflächen (Boden, Wand links, Wand rechts, Möbel) und die Sessel-Kontur |
| `src/lib/wow/timeline.js` | Daten | alle Zeiten aus Abschnitt 2 als einzige Quelle für CSS-Variablen und Tests |
| `src/lib/wow/config.js` | Daten | `WOW_OVERLAY_INTERACTIONS`, Bildpfad, Phase (`"A"` \| `"B"`) |
| `src/lib/wow/messages.js` | Daten | Texte DE (EN/FR/IT als Entwurf), bis sie in `src/messages/*.json` übernommen sind. Der Vorschlag steht in `features/wow-messages-vorschlag.json` |
| `public/wow/` | Assets | Phase A: leer. Phase B: `strokes-harald.json` |
| `tests/e2e/wow-hero.spec.js` | Playwright | Abnahme aus Abschnitt 8 |
| `tests/unit/wow-paths.test.js` | Unit | Deckungsprüfung: Pfade liegen innerhalb der `viewBox`, die `viewBox` hat das Maß des Fotos (sharp), Pfadanzahl und Gewicht im Budget |

**Inline-Startskript** (≤ 400 B, im Markup **vor** der Bühne): liest `sessionStorage` und die Sichtbarkeit der Bühne und setzt bei Bedarf `data-wow="still"`. Das Element bekommt `suppressHydrationWarning`. Für die CSP wird ein Hash-Eintrag benötigt (die CSP läuft laut Bibel zuerst als Report-Only).

**Wie die Linie entsteht (Phase A):** Die Fluchtlinien und Konturen werden **von Hand am Foto** gesetzt, als Koordinaten über `aboutHome.jpg`: Boden, Vorhangfront, Deckenkante, Kaminband, Sofa, Tische, Sessel. Desktop 30–45 Pfade, `base`-Teilmenge 15–20. Geprüft wird über ein Overlay-Screenshot mit 50 % Deckkraft bei 390, 768 und 1440 px. Keine automatische Kantenerkennung und keine KI: Die Linie soll gezogen wirken, nicht berechnet. Ein Designer darf die Pfade jederzeit in Illustrator oder Figma ersetzen, das Datenformat bleibt.

**Phase B (sobald Harald liefert):** Harald zeichnet dieselbe Ansicht auf einem Stift-Tablett. Gespeichert werden Striche mit Druck und Zeit. `WowControls` lädt `strokes-harald.json` nach `load` und im Leerlauf und spielt die Striche in Originalreihenfolge ab, zeitlich auf Phase 1 gestaucht. Strichstärke folgt dem Druck. Die Bildzeile lautet dann „Linie: Harald Menghin, von Hand gezeichnet“. Voraussetzung: schriftliche Einwilligung und bestätigter Titel.

---

## 5. Performance-Budget

| Posten | Budget | Zeitpunkt |
|---|---|---|
| **LCP-Element** | das vorgeladene Hero-`<img>` (heutige Preload-Logik, `fetchPriority="high"`, `loading="eager"`). Ab Frame 0 gemalt, **nie** `opacity: 0`, `visibility: hidden` oder `display: none`. Die Papierebene ist ein eigenes SVG ohne Bild und ohne Text und damit kein Kandidat | HTML-Parsing |
| LCP-Ziel | ≤ 2,0 s mobil (Moto-G-Profil, 4× CPU, langsames 4G, Produktions-Build-Maßstab). Bilder wie heute: mobil 750/1080 w AVIF ≈ 9–16 KB, Desktop ≤ 180 KB | – |
| Rückfallregel LCP | Meldet der Test ein anderes LCP-Element oder liegt der Wert über 2,0 s, startet die Papierebene mobil im Endzustand (nur Desktop spielt die Sequenz). Das ist keine Debatte, sondern die vorab festgelegte Folge | – |
| HTML-Zuwachs | Inline-SVG (Linien + Flächen + Sessel) ≤ 14 KB gzip, Schalterleiste und Bildzeile ≤ 1 KB | erster Byte |
| CSS | ≤ 3 KB gzip (CSS-Modul) | mit dem Seiten-CSS |
| Inline-Skript | ≤ 400 B | vor dem ersten Paint |
| **JS initial (Wow)** | **≤ 4 KB gzip** (`WowControls`, inkl. Lupe). Die Sequenz braucht 0 KB JS. Startseite gesamt bleibt ≤ 150 KB (Bibel §13) | hydriert nach dem Seiten-Chunk. Ohne Hydration läuft die Sequenz trotzdem |
| Phase B | `strokes-harald.json` ≤ 20 KB gzip | nach `load`, über `requestIdleCallback` |
| Nie im Bundle | `three`, `@react-three/*`, `motion`, `embla` | – |
| CLS | < 0,05. Bühne mit festem Seitenverhältnis bzw. Mindesthöhe, Schalterleiste mit reservierter Höhe im Server-HTML, keine Layout-Eigenschaft animiert | – |
| INP / Hauptthread | Während der Sequenz keine JS-Arbeit. Schalter reagieren in ≤ 100 ms, INP ≤ 150 ms. Long Tasks durch Wow: 0 | – |
| Animierte Eigenschaften | `opacity`, `transform`, dazu `stroke-dashoffset` (Paint, nur Phase 1, kleine Pfade, siehe Nachtrag W22) | – |

**Langsame Geräte:** Bei `@media (prefers-reduced-data: reduce)` und `(update: slow)` steht der Endzustand. Lädt das Foto später als 3,4 s (Desktop) bzw. 2,8 s (Handy), zeigt die Freigabe kurz `linen`. Das ist kein Fehler und kein Layoutsprung.

---

## 6. Varianten

**Reduced Motion** (`prefers-reduced-motion: reduce` oder „Ruhige Ansicht“ `html[data-motion="reduced"]`): Es steht sofort der Endzustand da, also das saubere Foto, Schalter auf „Raum“. Die vier Schalter bleiben **vollwertig**: Jeder zeigt sein Standbild (nur Linie auf Papier, Modell, Modell mit Licht, Foto). Der Wechsel geht nur per `opacity` in 150 ms. „Noch einmal“ ist ausgeblendet, die Lupe bleibt (sie ist Eingabe, keine Bewegung), der Sessel erscheint ohne Zeichnen in 150 ms. Damit ist die ganze Geschichte erzählt, nur ohne Bewegung.

**Ohne JavaScript:** Die CSS-Sequenz läuft einmal, die vier Beschriftungen stehen als Text da (die Buttons sind ohne Hydration `disabled`, damit keine toten Bedienelemente entstehen), die Bildzeile ist sichtbar. Ohne Inline-Skript gibt es keine Sitzungssperre. Das ist akzeptiert.

**Ohne WebGL:** Es fehlt nichts, denn der Einstieg nutzt kein WebGL. Eine spätere Phase 2 („Modell drehen“ mit Haralds echtem, fotogrammetrisch erfasstem Kartonmodell, R3F per dynamischem Import nach Klick) ist **nicht** Teil dieser Spezifikation.

**Schalter aus** (`NEXT_PUBLIC_WOW_HERO=0`): Der heutige Hero bleibt unverändert und dient als A/B-Kontrolle.

---

## 7. Texte DE (Vorschlag für `wow-messages-vorschlag.json`, Namespace `Wow`)

| Schlüssel | Text |
|---|---|
| `stage.label` (`aria-label` der Gruppe) | „Von der Linie zum Raum“ |
| `stage.description` (per `aria-describedby`, sichtbar nur für Screenreader) | „Eine Linie zeichnet unseren Showroom in Lochau, wird zum Modell, bekommt Licht und wird zum Foto.“ |
| `states.line` / `model` / `light` / `room` | „Linie“ · „Modell“ · „Licht“ · „Raum“ |
| `states.groupLabel` | „Zustand der Ansicht“ |
| `replay` | „Noch einmal“ |
| `caption.phaseA` | „Foto: Showroom Lochau · Linie: abstrahierte Grafik“ |
| `caption.phaseB` | „Foto: Showroom Lochau · Linie: Harald Menghin, von Hand gezeichnet“ |
| `loupe.hint` (nur für Screenreader am Foto) | „Mit dem Schalter „Linie“ sehen Sie die Zeichnung zum Foto.“ |

Das Foto behält seinen heutigen Alt-Text (`HomePage.hero.imageAlt`). H1, Lead, CTA und Infozeile bleiben wie heute. Keine Superlative, kein Ausrufezeichen. Der Name „Harald Menghin“ steht erst mit echtem Material da.

---

## 8. Akzeptanzkriterien

### 8.1 „Wow“ messbar (vor der Produktionsfreigabe durch den Inhaber)

| # | Test | Ziel |
|---|---|---|
| W-1 | **5-Sekunden-Test** (Bibel §3), n ≥ 30 aus der Zielgruppe 45+, Handy und Desktop gemischt. Frage: „Was bietet dieses Haus an?“ | ≥ 60 % nennen ungestützt **planen, zeichnen oder Designer**. ≥ 70 % nennen **Bodensee oder Lochau**. Heutiger Hero als Kontrolle: Wow-Hero ist besser |
| W-2 | **Erinnerungswert:** 24 h später, n ≥ 20, „Was ist Ihnen von der Startseite im Kopf geblieben?“ | ≥ 50 % beschreiben ungestützt den Übergang Linie → Raum |
| W-3 | **Unterscheidbarkeit:** Blindtest mit 6 Einstiegen ohne Logo (Platzhirsch, Minotti, Fretz, reiter, Höttges, Gamma) | ≥ 80 % ordnen Platzhirsch richtig zu, nachdem sie die Seite einmal gesehen haben |
| W-4 | **Neuheit und Ton:** „Haben Sie so etwas auf der Website eines Einrichtungshauses schon gesehen?“ sowie „Wirkt einladend“ (1–5) | ≥ 60 % „nein“. Mittelwert „einladend“ ≥ 4,0 und nicht schlechter als die Kontrolle |
| W-5 | **Geschäft (A/B über den Schalter, ab Livegang 4 Wochen):** Klickrate „Termin wählen“ und Klicks auf Planer (Küche, Sofa) aus der Startseite | Termin-Klickrate ≥ Kontrolle (Nichtunterlegenheit), Ziel +15 %. Planer-Klicks ≥ Kontrolle |
| W-6 | **Beschäftigung:** Anteil der Desktop-Sitzungen mit Schalter, Lupe oder „Noch einmal“ | ≥ 15 %. Analytics nur nach Consent über `src/lib/analytics.js` |

### 8.2 Technik und Barrierefreiheit (Playwright `PW_WORKERS=1`, Dev-Server relativ, Produktions-Maßstab extern)

1. LCP ≤ 2,0 s mobil im Produktions-Build-Maßstab. Das LCP-Element ist das Hero-`<img>` (oder die H1), geprüft per `PerformanceObserver` in `tests/e2e/wow-hero.spec.js`. Die Messung im Produktions-Maßstab übernimmt CI bzw. ein Build **außerhalb** des Repo-Ordners. Im Repo läuft kein `npm run build`.
2. CLS < 0,05 über die ersten 8 s auf 390 × 844, 768 × 1024 und 1440 × 900.
3. Wow-JS ≤ 4 KB gzip. `three`, `motion` und `@react-three` sind nicht im Startseiten-Chunk.
4. **Deckung:** Bildfolge aus `recordVideo` bei 390, 768 und 1440 px. Linie und Fotokante weichen um höchstens 2 px (CSS) ab, geprüft an 6 Referenzpunkten (Kaminecken, Sofaecke, Sesselkanten).
5. **Choreografie:** Die Bildfolge im 100-ms-Takt zeigt nie zwei Hauptphasen gleichzeitig (außer den 2 erlaubten Regionen in Phase 4). Ab 5,0 s (Handy 4,0 s) bewegt sich kein Pixel mehr. Text bewegt sich nie.
6. Reduced Motion (Emulation **und** `data-motion="reduced"`): erster Frame = Endzustand, alle vier Schalter zeigen ihr Standbild.
7. Ohne JS (`javaScriptEnabled: false`): Sequenz läuft, Endzustand ist das saubere Foto, keine leeren Flächen, keine aktiven Buttons ohne Funktion.
8. Tastatur: Fokusreihenfolge H1 → „Termin wählen“ → „Showroom & Café“ → Schalter → „Noch einmal“. Fokus sichtbar (W21). `aria-pressed` stimmt. Mit dem Pfeil wechselt man in der Gruppe, Treffer ≥ 44 × 44 px. Der Sessel reagiert auf `:focus-visible`.
9. axe: 0 Fehler der Stufen serious und critical. Kontrast der Bildzeile ≥ 4,5:1, Schalterrand ≥ 3:1.
10. Endzustand pixelgleich zum Foto ohne Overlay (Screenshot-Differenz in der Bühne = 0 bei abgeschalteter Lupe und Sessel).
11. Schalter aus: Der Hero-HTML-Snapshot ist identisch mit dem heutigen.
12. Prüfbilder: `node tools/qa/shoot.mjs qa-screenshots/wow <url>` für jede Breite, mit Read angesehen und abgelegt.

---

## 9. Grenzen (was dieser Einstieg nicht tut)

- Kein Loader, kein Intro vor dem Inhalt, kein Scroll-Hijacking, kein Pinning, kein Lenis, kein eigener Cursor, kein Ton, keine Partikel, kein Video.
- Das Foto wird nie skaliert, eingeblendet, getönt, maskiert oder beschnitten (über das heutige `object-cover` hinaus). Die Bewegung liegt **immer darüber** (Regel aus C).
- Keine Herstellerbilder in der Bühne. Phase A nutzt das eigene Foto `aboutHome.jpg` (Bildregister-Eintrag bestätigen). Minotti-Katalogbilder aus `/cmx` kommen hier nicht vor.
- Keine KI-Skizze, keine Aussage „Haralds Zeichnung“ vor Phase B. Händleraussagen nur ClassiCon und Ezarri, und keine davon im Einstieg.
- Kein Seeblick-Versprechen. Das Lichtband heißt intern „Fensterlicht“, nach außen wird es nicht benannt.
- Höchstens 5,0 s Bewegung, einmal pro Sitzung. WCAG 2.2.2 ist damit erfüllt, Pausieren und Wiederholen sind trotzdem möglich.
- Die Abschnitte unterhalb des Hero (Prozesskapitel, „Ein Projekt, vier Zustände“, Schluss-CTA mit Sessel) gehören anderen Teams. **Empfehlung** an diese Teams: dieselbe Schalterleiste „Linie · Modell · Licht · Raum“ im USP-Kapitel mit Haralds echter Vier-Zustände-Kette wiederverwenden (`WowControls` ist dafür generisch) und im Schluss-CTA denselben Sessel zeigen.

---

## 10. Benötigt vom Inhaber

| # | Was | Wofür | Ohne |
|---|---|---|---|
| 1 | Bestätigung, dass `aboutHome.jpg` ein eigenes Foto ist (Bildregister) und Linien-Overlays per Lupe und Sessel erlaubt sind | Phase A | Lupe und Sessel aus, Sequenz bleibt (Ende = sauberes Foto) |
| 2 | Freigabe des Schalters in Produktion | Livegang | Schalter in Produktion aus |
| 3 | Shooting Tag 1: dieselbe Ansicht in 21:9 und 4:5 aus derselben Stativposition, optional in 4 Tageslichtern | 4:5 mobil, später Seelicht als Bildauswahl | Phase A mit 3:2 mobil |
| 4 | Harald: Tablet-Aufnahme derselben Ansicht, Einwilligung, Titel | Phase B | Phase A bleibt mit Bildzeile „abstrahierte Grafik“ |

---

## 11. Nachträge zur Design-Bibel (Vorschlag, Entscheidung Kreativdirektor bzw. Inhaber; in Bibel §16 zu übernehmen)

| # | Stelle | Vorschlag | Begründung |
|---|---|---|---|
| **W22** | W12, §8.2 „LCP-Bild sofort voll deckend“, „animiert nur transform/opacity“ | Das Hero-Foto bleibt still, unverändert und ab Frame 0 gemalt. **Erlaubt** ist eine einmalige Sequenz auf einer Ebene **über** dem Foto (Papier, Linie, Modell, Licht, Freigabe per Opacity). Für die Linie ist zusätzlich `stroke-dashoffset` erlaubt. Höchstens 5 s, einmal pro Sitzung, mit vollwertigem Reduced-Motion-Standbild | Der Kern-USP braucht seinen Beweis im ersten Viewport. Das LCP bleibt beim Foto, weil es gemalt ist. Sichtbar wird es nach ≤ 4,6 s. Das ist eine bewusste Abweichung vom Wortlaut, nicht vom Zweck (Beweis des Ortes) |
| **W23** | P7, §8.2 „Auftakt steht nach ≤ 1100 ms still“ | gilt für Text und Bedienelemente (ab 0 ms erfüllt). Eine reine Bildbühne darf als Signature-Moment bis 5 s laufen, wenn sie Text weder bewegt noch verdeckt und die Handlung nie verzögert | Atmosphäre-Klasse nach §8.2, WCAG 2.2.2 bei ≤ 5 s erfüllt |
| **W24** | §8.3 Signature-Momente | „Pause“ ist **der eine** Höhepunkt der Startseite. Seelicht wird zur reinen Bildauswahl durch den Server, ohne eigenen Moment. Eine Horizontlinie weiter unten ist dann ein Gliederungselement und kein zweiter Höhepunkt | höchstens 1 Höhepunkt pro Seite |
| **W25** | §13 „`'use client'` nur unter `components/islands/`“ | Ausnahme: `src/components/Wow/**` (eine Insel ≤ 4 KB) | Dem Wow-Team exklusiv zugewiesener Ordner, damit keine Merge-Konflikte mit Parallelteams entstehen |
| **W26** | §6 Formate | Hero mobil bis zum Shooting 3:2 aus dem Desktop-Foto (wie heute), danach eigenes 4:5 | Phase A braucht kein Shooting |

| **W34–W39** (Push-Runde 3) | §8.2, §4/§5, §12, §6 | Compositor-Pflicht während der Hydration, Eingabe beendet die Sequenz, drei Akte Linie → Licht → Raum, Ruhezustand als Vergleichsregler, Horizont mit 12 px Abstand zur H1, Bühne am Handy 2:1 | Einzelheiten und Begründung: `wow.md` §0 |

Bewusst **nicht** übernommen: `display-stage` 120 px aus C (die Wirkung kommt aus der Bühne, nicht aus der Schriftgröße), der Material-Shader in Phase 1 aus B (W17 bleibt) und die Tagesreihe als Wow-Mechanik aus B (abhängig von Material, das es noch nicht gibt).

### Push-Runde 4 (Vorschlag; Begründung in `wow.md` §0)

| # | Stelle | Vorschlag | Begründung |
|---|---|---|---|
| W40 (neu) | §6 Hero / §10.2 | Im Einstieg sind Raum und Typo **eine** Komposition: Die Bühne nimmt ab xl mindestens 60 % der Breite und läuft randlos bis an die rechte Kante. Eine Linie aus dem Bild darf bis an die Satzkante der H1 laufen. Die H1 steht immer auf Papier, nie auf dem Foto | awwwards #4, luxus-cd #4: Der Split-Hero ist das Vorlagen-Muster. Die Linie aus dem Foto, die an der Schrift endet, sagt ohne Worte „erst die Linie, dann der Raum“ |
| W41 (ersetzt W37) | §12 Signature | Der Ruhezustand ist das Foto allein. Das Werkzeug (Vergleichsregler) zeigt sich einmal als Einladung (≤ 1,4 s, nur Compositor, nie bei reduced motion) und danach über eine stille Textschaltfläche; Griff 56 px mit Beschriftung | luxus-cd #3, Wächter #2, awwwards #2 |
| W42 (neu) | §8.2 Motion | Kanten und Masken in Signature-Animationen nur mit `transform`/`opacity`, kein animiertes `clip-path` mit `calc(var())`; WebKit-Videotest als Pflicht | Wächter #1, 3/3 Safari-Videos |
| W43 (ändert W39) | §6 Formate | Hero-Bühne am Handy 16:10 ohne Leiste darunter; 4:3, sobald das Cookie-Banner auf `ph:wow-done` wartet | awwwards #3, Wächter #3 |
| W44 (neu) | §8.3 | Erstes Bild einer Zeichen-Sequenz ist nie leeres Papier: Hilfslinien und Vorzeichnung stehen im Server-HTML | luxus-cd #2 |
