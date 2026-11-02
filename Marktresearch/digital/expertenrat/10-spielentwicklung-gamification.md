# Expertenrat 10 – Spielentwicklung, Interaction-Design und Gamification

**Stand:** 26.10.2026 · **Rolle:** Spieleentwickler und Interaction-Designer · **Schwerpunkt:** spielerische, aber edle Interaktionen (Raum-Explorer, Material- und Stoffspiel, interaktive Dreiländereck-Karte, Stil-Finder, Belohnung durch Entdecken, Game-Feel)

**Grundlage:** `digital/01` (Designsystem, Farben, Typo), `digital/02` (Motion-Tokens, „kein WebGL im Initial-Bundle“), `digital/12` (Markenstimme „Der Gastgeber“), `digital/13` (Performance-Budget, Regeln für schwere Features), `digital/14` (Dark Patterns, BaFG/BFSG, Bildrechte, EuGH *Mio/konektra*), `23-masterkonzept.md` Abschnitt 4 (Positionierung) und 9 („Nicht jetzt: eigener 3D/AR-Konfigurator“), außerdem `digital/03` und `digital/04` (3D, 360°, 2D-Planer).

**Stand der Prototypen:** Unter `src/app/[locale]/preview/galerie` liegt bisher nur `layout.js` (noindex, nur `de`), dazu Bausteine in `src/components/Preview/{galerie,buehne,dreilaendereck}`. `curl http://localhost:3000/de/preview/galerie` gab am 26.10.2026 **404** zurück, es gibt also noch keine Seite. Die Checkliste in Abschnitt 5 ist deshalb so geschrieben, dass sie ohne Vorwissen auf die fertigen Prototypen angewendet werden kann.

**Bibliotheksgrößen** (bundlephobia-API, abgerufen am 26.10.2026, gzip, ohne Assets):

| Paket | Version | Lizenz | gzip JS | Anmerkung |
|---|---|---|---|---|
| `three` | 0.186.1 | MIT | **185 KB** | Grundlage für R3F, Photo Sphere Viewer und Splats |
| `@react-three/fiber` | 9.8.2 | MIT | 58 KB | zusätzlich zu three, also ≈ 243 KB |
| `@react-three/drei` | 10.7.9 | MIT | tree-shakebar | jede Hilfe bringt eigene Kosten mit |
| `pixi.js` | 8.22.0 | MIT | **265 KB** (voll) | 2D-WebGL; für diese Website überdimensioniert |
| `@rive-app/canvas-lite` | 2.47.1 | MIT | 54 KB JS **+ WASM ≈ 222 KB brotli** (Herstellerangabe Rive, „Runtime sizes“, Jan. 2026) | ohne Rive-Text |
| `@rive-app/react-canvas` | 4.37.1 | MIT | 75 KB JS + WASM (voll ≈ 567 KB brotli laut Rive) | |
| `@splinetool/runtime` | 2.0.111 | proprietär (keine OSI-Lizenz im Paket) | **279 KB** Einstieg, weitere Chunks bis > 1 MB, 36 MB entpackt | Szenen liegen standardmäßig beim Anbieter (Drittland, Consent) [vor Einsatz prüfen] |
| `@photo-sphere-viewer/core` | 5.15.1 | MIT | 206 KB (inkl. three) | 360°-Panoramen |
| `maplibre-gl` | 6.16.0 | BSD-3 | 296 KB | Vektorkarte; braucht Kachelserver |
| `d3-geo` | 3.1.1 | ISC | 13 KB | **nur zur Build-Zeit** nötig, 0 KB im Client |
| `@use-gesture/react` | 10.3.1 | MIT | 9 KB | Drag/Pinch, falls CSS/Pointer Events nicht reichen |
| `@google/model-viewer` | 4.4.0 | Apache-2.0 | ≈ 71 KB + three ≈ 250 KB | laut `digital/13`, nur nach Klick |

Zum Vergleich: Das ganze Initial-Budget pro Route ist **≤ 170 KB gzip**, ein neues Feature darf **≤ 10 KB** in den Initial-Bundle bringen (`digital/13`, 3.3). **Jede der großen Engines sprengt das Budget allein.** Deshalb gilt in diesem Bericht: spielerisch durch Gestaltung und Timing, nicht durch Engines.

---

## 1. Die wichtigsten Erkenntnisse meiner Disziplin für dieses Projekt

**E1 – Game-Feel entsteht durch Antwortzeit und Rückmeldung, nicht durch 3D.**
Swink definiert Game-Feel als „Echtzeit-Kontrolle virtueller Objekte in einem simulierten Raum, betont durch Politur“. Echtzeit heißt dabei: eine Antwort innerhalb eines Korrekturzyklus von **unter 100 ms** ([Swink, *Game Feel*, 2008/2009; Zusammenfassung Wikipedia „Game feel“](https://en.wikipedia.org/wiki/Game_feel); [Pichlmair & Johansen, „Designing Game Feel. A Survey“, arXiv 2011.09201](https://arxiv.org/pdf/2011.09201)). Das deckt sich mit Nielsens Grenzen: 0,1 s wirkt sofort, 1 s hält den Gedankenfluss, ab 10 s braucht es eine Fortschrittsanzeige ([NN/g, „Response Time Limits“](https://www.nngroup.com/videos/3-response-time-limits-interaction-design/)). **Folge für Platzhirsch:** Ein Stoffmuster, das nach 60 ms das Sofa umfärbt, fühlt sich hochwertiger an als ein WebGL-Raum, der 4 s lädt. INP ≤ 150 ms (Budget aus `digital/13`) ist hier die Game-Feel-Grenze.

**E2 – Punkte, Abzeichen und Ranglisten schaden der Motivation und der Marke.**
Gamification heißt „Elemente des Spieldesigns in Kontexten, die keine Spiele sind“ ([Deterding et al., MindTrek 2011](https://pure.itu.dk/en/publications/from-game-design-elements-to-gamefulness-defining-gamification/)). Die billigste Form dieser Elemente (Punkte, Abzeichen, Ranglisten) senkte in einer Semesterstudie Zufriedenheit, intrinsische Motivation und Prüfungsleistung gegenüber einem identischen Kurs ohne diese Elemente ([Hanus & Fox, *Computers & Education* 80, 2015, 152–161](https://www.smhp.psych.ucla.edu/pdfdocs/gamil.pdf)). Erklärung der Autoren: sozialer Vergleich und fehlende Autonomie. Ein Kunde, der 80.000 € für einen Wohnraum ausgibt, will weder „Level 3“ noch einen Rabatt-Coupon fürs Durchklicken. **Belohnung ist hier das Entdecken selbst:** ein neues Bild, ein Detail, eine Geschichte, ein Ergebnis, das ihm gehört.

**E3 – Neugier braucht eine Lücke, die sich schließen lässt.**
Loewensteins Informationslücken-Theorie: Neugier entsteht, wenn die Aufmerksamkeit auf eine Wissenslücke fällt. Sie setzt etwas Vorwissen voraus, und die Lücke muss schließbar wirken ([Loewenstein, *Psychological Bulletin* 116, 1994; Zusammenfassung PBS/NOVA](https://www.pbs.org/wgbh/nova/article/how-to-stimulate-curiosity/)). **Folge:** Hotspots im Raumbild zeigen zunächst nur einen feinen Punkt und das Wort „Bouclé“. Das Detail (Herkunft, Pflege, Musterbuch im Showroom) öffnet sich erst auf Antippen. Das ist Neugier ohne Druck. Ein Countdown oder „nur noch 2 verfügbar“ wäre Druck ohne Neugier.

**E4 – Was man selbst zusammenstellt, bewertet man höher, aber nur, wenn es fertig wird.**
Der IKEA-Effekt: Selbstgebautes wird höher bewertet. Er verschwindet, wenn die Aufgabe nicht abgeschlossen oder das Ergebnis zerstört wird ([Norton, Mochon & Ariely, *Journal of Consumer Psychology* 22(3), 2012, 453–460](https://dash.harvard.edu/handle/1/12136084)). **Folge:** Stil-Finder und Material-Spiel müssen in **≤ 90 s** zu einem fertigen, speicherbaren Ergebnis führen (Moodboard, Stoffkombination). Das Ergebnis bekommt einen eigenen Link und lässt sich ohne Anmeldung behalten. Ein Quiz, das vor dem Ergebnis eine E-Mail verlangt, zerstört genau diesen Effekt (und ist ein Dark Pattern, siehe 4).

**E5 – Das Ende prägt die Erinnerung.**
Peak-End-Regel: Erlebnisse werden nach ihrem Höhepunkt und ihrem Ende erinnert, nicht nach ihrer Dauer ([Kahneman et al., „When more pain is preferred to less: Adding a better end“, *Psychological Science* 4, 1993, 401–405](https://www.psychologytoday.com/us/blog/fulfillment-any-age/201209/happiness-it-s-all-about-the-ending)). **Folge:** Jede Interaktion hat genau einen gestalteten Höhepunkt (das Moodboard baut sich auf, das Sofa wechselt den Stoff) und ein ruhiges, warmes Ende („Ihr Moodboard ist gespeichert. Wir legen die Muster für Sie bereit, wenn Sie vorbeikommen.“), keinen abrupten Formular-Abschluss.

**E6 – Sichtbare Arbeit erhöht den wahrgenommenen Wert.**
Der „Labor Illusion“-Effekt: Wer sieht, dass für ihn gearbeitet wird, schätzt das Ergebnis höher, auch bei längerer Wartezeit ([Buell & Norton, *Management Science* 57(9), 2011, 1564–1579](https://ideas.repec.org/p/hbs/wpaper/14-034.html)). **Folge:** Beim Stil-Finder zeigt der Übergang zum Ergebnis 1,2–1,6 s lang, *was* passiert („Wir legen Eiche geräuchert neben Cognac-Leder …“), statt eines Spinners. Das ist ehrlich, weil es wirklich die gewählten Materialien zeigt. Künstliche Wartezeit über 2 s wäre Theater.

**E7 – Rechtliche Leitplanken sind zugleich Designregeln.**
Art. 25 DSA verbietet Oberflächen, die Nutzer täuschen, manipulieren oder ihre freie Entscheidung wesentlich beeinträchtigen. Für Fälle der UGP-Richtlinie und der DSGVO gelten diese selbst ([DSA Art. 25, OJ L 277/2022](https://www.springlex.eu/en/packages/dsa/dsa-regulation/article-25/)). WCAG 2.2 AA verlangt, dass jede Ziehgeste auch mit einem einfachen Antippen geht (SC 2.5.7, [W3C Understanding](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)). Bewegung, die durch Interaktion ausgelöst wird, muss sich abschalten lassen (SC 2.3.3, AAA, hier als Hausstandard über `prefers-reduced-motion`). Für den Gutschein- und Shop-Teil greift ggf. das BaFG/BFSG (`digital/14`, F10).

**E8 – 3D von Designermöbeln ist ein Rechtsthema, kein Technikthema.**
Nach EuGH C-580/23 und C-795/23 (*Mio/konektra*, 04.12.2025) können detailgetreue 3D-Modelle oder Renderings von Designermöbeln Vervielfältigungen geschützter Werke sein (`digital/14`, Zeile 120). Minotti, Poliform und Paola Lenti haben laut `digital/04` keinen Roomle-Content. **Folge:** Ein „begehbarer Showroom“ nur aus **eigenen Fotos des eigenen Raums** (360°-Panoramen, Fotostil „Seelicht“ aus `digital/12`). Produkte darin sind fotografiert, nicht nachmodelliert. Das ist rechtlich sauber und ehrlicher als jedes Rendering.

**E9 – Studien zu 3D und AR betreffen fast nur Mode.**
Eine Metaanalyse zu 3D und Kaufabsicht bei Möbeln habe ich nicht gefunden. Die Belege zu Virtual Try-on stammen überwiegend aus der Bekleidung (z. B. weniger wahrgenommenes Risiko bei Anzügen; Übersicht über die Treffer in der Recherche vom 26.10.2026, u. a. [Universität Jyväskylä, „More than skin-deep“, 2023](https://jyx.jyu.fi/jyx/Record/jyx_123456789_89265/Description)). Eine Studie mit einem 3D-Showroom für Möbel ([Kent State, „Understanding Furniture Design Choices Using a 3D Virtual Showroom“](https://digitalcommons.kent.edu/caedpubs/32)) hat Stilpräferenzen gemessen, nicht Umsatz. **Ehrliche Folge:** Kein Business Case für eine eigene 3D-Engine. Die Wirkung muss im eigenen A/B-Test belegt werden (Kennzahl: Terminbuchungen pro 100 Sitzungen mit Interaktion).

---

## 2. Konkrete Vorgaben für den Neuauftritt

### 2.1 Game-Feel-Tokens (ergänzen die Motion-Tokens aus `digital/02`, 3.2)

| Token | Wert | Einsatz |
|---|---|---|
| `--feedback-ack` | **≤ 50 ms** bis zur ersten sichtbaren Reaktion (Farbwechsel, Ring, Druckzustand) | jedes Antippen von Swatch, Hotspot, Quizkarte, Kartenregion |
| `--duration-micro` | 160 ms | Hover, Fokus, Druckzustand (vorhanden) |
| `--duration-swap` | **240 ms** Crossfade | Stoff- oder Materialwechsel am Produktbild |
| `--duration-ui` | 280 ms | Hotspot-Karte öffnet sich, Quiz-Schritt wechselt (vorhanden) |
| `--duration-reveal` | **1.200–1.600 ms** gestaffelt (Stagger 80 ms × max. 9 Kacheln) | einziger Höhepunkt: Moodboard baut sich auf |
| `--ease-quiet` | `cubic-bezier(0.22, 1, 0.36, 1)` | alles Eintretende (vorhanden) |
| `--ease-press` | `cubic-bezier(0.2, 0, 0, 1)`, Scale 1 → 0,97 → 1 in 160 ms | gedrückte Swatch oder Karte, die einzige „Federung“ |
| Austritt | 150 ms, `ease-in` | Schließen, Zurück |

Regeln:
- **Kein Overshoot über 2 %**, kein Bounce, kein Wackeln (Ausnahme: Formularfehler 2 × 4 px, `motion-safe`, wie in `digital/02` F8). Edel heißt gedämpft. Federkonstanten, falls `motion` genutzt wird: `stiffness 300, damping 30, mass 1` (kritisch gedämpft, kein Nachschwingen).
- **Nur `transform`, `opacity`, `clip-path`, `filter`** animieren. Nie `width`, `top`, `box-shadow`.
- Bei `prefers-reduced-motion: reduce` werden alle Wege, Skalierungen und das Stagger zu einem Crossfade von **≤ 150 ms**. Die Rückmeldung (Farbwechsel, Häkchen, Text) bleibt.
- **Haptik:** `navigator.vibrate` gibt es in Safari/iOS nicht. Deshalb nie als einziges Signal verwenden. Höchstens 10 ms beim Speichern des Moodboards auf Android, abschaltbar. Im Zweifel ganz weglassen.
- **Ton:** standardmäßig aus. Wenn überhaupt, dann ein einziger, leiser Stoff- oder Holzklang, nur nach ausdrücklichem Einschalten.

### 2.2 Baustein A – „Material-Spiel“ (Stoff, Leder, Stein, Holz)

Der wichtigste spielerische Baustein, weil er direkt auf Anfragen, Muster und Termine einzahlt (`digital/04`, F3).

- **Was:** Auf Produkt- und Markenseiten eine Reihe von **6–12 Swatches** (Ø 44 px, Abstand 8 px, Zielgröße ≥ 44 × 44 px, also über den 24 px aus WCAG 2.5.8). Antippen → das Produktbild wechselt per Crossfade in 240 ms auf die fotografierte Variante. Langes Drücken oder ein Doppeltipp öffnet eine **Makro-Ansicht** (Stoff in 1:1 bei 2× DPR, 800 × 800 px AVIF ≤ 90 KB) mit Name, Zusammensetzung, Pflegehinweis und der Zeile „Liegt im Showroom in Lochau im Musterbuch, Regal 3“.
- **Technik:** Server-gerenderte Bilder, Wechsel per CSS (`opacity` zweier `next/image`, das zweite Bild wird bei `pointerenter` bzw. Fokus vorgeladen). **0 KB Bibliothek.** Kein Umfärben per Shader und kein Canvas-Tinting, weil das bei Bouclé und Leder unecht wirkt (Uncanny-Valley-Risiko, `digital/04`).
- **Nur echte Varianten:** Swatch nur, wenn ein Foto dieser Variante mit Bildfreigabe existiert, sonst Hinweis „Weitere 140 Bezüge im Musterbuch, gern zeigen wir sie Ihnen“. Farbcodes aus `fetchFarben.js` (`hex_code`) nur als Swatch-Fläche, nie als vorgetäuschtes Produktfoto.
- **Steinplatten der Küchenlinie (Binni):** eigene Makrofotos der Platten (Kante, Oberfläche geschliffen/gebürstet/poliert) unter Streiflicht. Ein Regler „Licht“ (3 Stufen: Morgen, Mittag, Abend; Wechsel per Crossfade 400 ms) zeigt, wie der Stein im Tagesverlauf wirkt. Das ist ein echter Beratungsnutzen, weil polierter Stein abends spiegelt.
- **Ergebnis:** „Diese Kombination merken“ legt die Kombination in die Merkliste („Ihre Auswahl“, `digital/01` F9), der Share-Link enthält sie per `lz-string` (2 KB, `digital/04`). CTA: **„Muster zum Termin bereitlegen lassen“** (Terminbuchung). Kein Zwang, kein Formular vor dem Ergebnis.
- **Tastatur:** Swatches als `radiogroup` mit Pfeiltasten, sichtbarer Fokusring 2 px `--color-gold` mit 2 px Versatz (Kontrast ≥ 3:1 auf `#faf8f4` prüfen; `#d1b250` auf Paper reicht wahrscheinlich **nicht**. Dann `--color-gold-text #7a5f17` für den Ring nehmen).

### 2.3 Baustein B – „Stil-Finder“ (kurzes Quiz mit Moodboard)

- **Umfang:** **5 Fragen, maximal 7**, jede als Bildwahl mit 4 Fotos (eigene Fotos oder freigegebene Herstellerbilder, Format 4:5, `sizes="(max-width: 768px) 50vw, 25vw"`). Fortschritt als „2 von 5“ in Text plus eine 1 px dünne Linie, keine Punkte und keine Prozent-Gamification.
- **Fragen (Beispiel):** (1) Welches Licht am Abend? (2) Welcher Boden? (3) Welche Hand fühlt gern … (Leder, Bouclé, Leinen, Samt)? (4) Wohnen Sie eher am See, in den Bergen oder in der Stadt? (5) Wie viele Menschen sitzen bei Ihnen am Tisch? Jede Frage hat **„Weiß ich nicht“** als gleichwertige Option und einen sichtbaren Link **„Überspringen“**.
- **Dauer:** Zielwert **60–90 s** bis zum Ergebnis. Jeder Schrittwechsel dauert 280 ms (Crossfade plus 8 px Versatz). Die Auswahl zeigt in ≤ 50 ms einen Ring und ein Häkchen (SVG `stroke-dashoffset`, 200 ms), dann geht es nach 350 ms automatisch weiter. Ein Zurück-Pfeil ist immer sichtbar. Ohne JavaScript funktioniert der Stil-Finder als normales Formular mit Server-Action (Progressive Enhancement).
- **Höhepunkt:** Das Ergebnis ist ein **Moodboard aus 9 Kacheln** (3 × 3 auf dem Desktop, 2 Spalten auf dem Handy): 3 Produkte aus dem Katalog, 2 Materialien, 1 Raumfoto aus einem Referenzprojekt, 1 Farbfeld mit Hex-Code (z. B. `#3f3129` Walnuss), 1 Leuchte, 1 Café-Moment. Aufbau gestaffelt, 80 ms Abstand, insgesamt ≤ 1,6 s. Der Ergebnisname ist poetisch, aber konkret: „Seeseite – warmes Holz, helles Leinen, ein Minotti-Sofa in Sand“. **Keine Persönlichkeits-Diagnose**, keine Pseudopsychologie („Sie sind ein Typ C“).
- **Behalten ohne Anmeldung:** Das Ergebnis liegt unter einer eigenen URL (`/de/stil/[code]`, `noindex`), zum Teilen mit Partner oder Architekt. Das ist wichtig, weil Wohnentscheidungen fast immer zu zweit fallen. Optional „Als PDF für den Termin“ (serverseitig erzeugt). **E-Mail erst danach und freiwillig** („Schicken Sie mir das Moodboard“, mit Einwilligungstext aus `digital/14`).
- **Daten:** Antworten bleiben im URL-Code und werden ohne Einwilligung nicht im Backoffice gespeichert. Ein Analytics-Event `stilfinder_complete` (ohne Antworten, nur Schrittzahl) wird nur nach Consent gesendet.
- **Technik:** Server Component plus eine Client-Insel ≤ 6 KB gzip. Kein Quiz-SaaS (Typeform & Co. = Drittland, Cookies, 100+ KB).

### 2.4 Baustein C – „Raum-Explorer“ (der Showroom als begehbarer Raum)

- **Stufe 1, sofort, 0 KB:** „Shop the Room“-Hotspots auf **eigenen Raumfotos** (`digital/02` F10, `digital/03` F6). 3–7 Hotspots pro Bild, Punkt Ø 12 px mit 32 px Trefferfläche (unsichtbare Fläche ≥ 44 px), ein ruhiges Pulsieren **einmal** beim Eintritt (2 × 1.200 ms, danach still, bei Reduced Motion gar nicht). Antippen öffnet eine Karte (280 ms) mit Produkt, Material und „Steht im Showroom, Zone Seeblick“. Zusätzlich eine Liste aller Hotspots unter dem Bild (Text-Alternative, Tastatur, Screenreader).
- **Stufe 2, Pilot: 360°-Rundgang aus eigenen Panoramen.** 5–8 Standpunkte im Showroom und Café (Eingang, Café-Tresen, Minotti-Vignette, Küchen-Insel, Outdoor-Terrasse). Viewer **nur nach Klick** auf eine Fassade („Rundgang starten“, Server-`next/image` als Poster) per `next/dynamic(..., { ssr: false })`. Optionen: `@photo-sphere-viewer/core` 5.15.1 (206 KB gzip inkl. three, MIT, Plugin für Markierungen) oder eine eigene Lösung mit CSS-3D-Würfel (6 Würfelflächen à 2048 px AVIF, ≈ 3 KB eigener Code). **Empfehlung: zuerst der CSS-Würfel**, weil er ohne WebGL auf jedem Gerät läuft und nur ein Budget-Tor braucht. Panorama-Kacheln ≤ 250 KB je Fläche, zuerst 512 px als Platzhalter.
- **Steuerung:** Ziehen dreht (Trägheit 300 ms, Reibung 0,92 pro Frame), Pfeiltasten drehen in 15°-Schritten, sichtbare Knöpfe **„← Drehen →“** und **„Weiter zur Küche“** (WCAG 2.5.7). Gyroskop nur nach ausdrücklichem Antippen von „Handy bewegen“ (iOS verlangt dafür ohnehin eine Erlaubnis). Übergang zwischen Standpunkten: Überblendung 450 ms mit leichtem Zoom 1 → 1,04. **Kein** „Fliegen“, weil das Bewegungsübelkeit auslösen kann.
- **Belohnung durch Entdecken:** Pro Standpunkt ein **„stilles Detail“**, das nur sieht, wer sich umsieht, z. B. die Espressotasse auf dem Café-Tresen mit der Zeile „Unser Espresso: 2,90 €. Kommen Sie auf einen vorbei.“ oder die Kante der Binni-Steinplatte mit Streiflicht. Keine Zählung („3 von 8 gefunden“), sondern Inhalte. Am Ende des Rundgangs steht die Terrasse mit dem Pfänderblick und der Zeile „Samstag 10–17 Uhr, Donnerstag bis 20 Uhr“ als ruhiges Ende (Peak-End-Regel).
- **Stufe 3, nicht jetzt:** WebGL-Raum mit R3F (≈ 243 KB + Modelle) oder Gaussian Splatting (30–150 MB je Szene, `digital/03`). Erst wenn Stufe 2 messbar mehr Termine bringt und Hersteller 3D-Lizenzen liefern.

### 2.5 Baustein D – „Dreiländereck-Karte“ (interaktiv)

- **Was:** Eine eigene, gezeichnete **SVG-Karte** des Bodensees mit AT, DE, CH und FL. Kein Kachel-Kartendienst, keine Google-Maps-Einbettung (Consent, `digital/14`). Geodaten (Natural Earth, Public Domain) werden **zur Build-Zeit** mit `d3-geo` + `topojson-client` in einen SVG-Pfad gerechnet, also **0 KB Client-Bibliothek**, SVG ≤ 25 KB gzip.
- **Inhalt pro Region** (verknüpft mit den neuen Regionsseiten `designermoebel-*`): Fahrzeit nach Lochau (z. B. „Lindau 5 Min.“, „St. Gallen ca. 35 Min.“, „Lech ca. 1 h 30“, Werte vor Veröffentlichung prüfen), Währung (EUR/CHF), was bei Lieferung passiert (Verzollung, MWST 8,1 %, Montage über CH-Partner, laut Masterkonzept 4.2 #5), ein Referenzprojekt, falls vorhanden.
- **Interaktion:** Hover/Fokus hebt eine Region mit Fläche `--color-stone #ece8e1` und 1 px Kontur `--color-ink` an (160 ms). Antippen zeichnet die Route nach Lochau (SVG `stroke-dashoffset`, **900 ms**, `--ease-quiet`, bei Reduced Motion sofort sichtbar). Danach erscheint die Karte mit Fakten (280 ms). Der See ist eine ruhige Fläche in `#dfe4e6` mit einer sehr langsamen Lichtwelle (CSS-Gradient, 12 s, nur `motion-safe`, pausiert außerhalb des Viewports).
- **Barrierefreiheit:** Jede Region ist ein `<a>` bzw. `<button>` im SVG mit `aria-label` („St. Gallen, Schweiz – 35 Minuten, Lieferung in CHF“). Darunter dieselben Inhalte als Liste. Kontrast der Regionen-Beschriftung ≥ 4,5:1.
- **Kein „Sie sind hier“ per Geolocation** ohne Antippen. Eine optionale Schaltfläche „Meine Fahrzeit berechnen“ fragt die Postleitzahl ab, nicht den Standort.

### 2.6 Querschnitts-Regeln

1. **Jede spielerische Insel ≤ 10 KB gzip im Initial-Bundle**, alles Größere hinter einer Fassade und erst nach Klick (`digital/13`, 3.3, Regel 1).
2. **Erster Paint ohne JS fertig:** Poster, Text und Liste sind Server-HTML. Die Interaktion ist eine Verbesserung.
3. **Jede Interaktion endet in einer menschlichen Handlung:** Termin, Muster bereitlegen, Rückruf, Besuch im Café. Nie in einer Sackgasse.
4. **Maximal ein gestalteter Höhepunkt pro Seite** (passt zu „Ein Gedanke pro Bildschirm“, `digital/01` 3.1).
5. **Messen:** Events `material_swap`, `stilfinder_step`, `stilfinder_complete`, `tour_start`, `tour_node`, `map_region` (nur nach Consent). Erfolg ist **Termin pro 100 Interaktionen**, nicht Verweildauer.
6. **Gerätematrix vor Freigabe:** Moto G Power (Lighthouse-Profil), iPhone SE 2. Generation, iPad, Desktop Safari/Chrome/Firefox. INP p75 ≤ 150 ms auf allen.

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

Keiner der regionalen Wettbewerber (Höttges, reiter design, Dolce Vita, Fretz, Gamma) hat laut `digital/02` und `digital/12` Hotspots, Stil-Finder, Materialspiel oder einen Rundgang. Fretz bezahlt seine Effekte mit GSAP + Lenis + AOS.

1. **„Das Musterbuch online, das Muster in Lochau.“** Das Material-Spiel (2.2) verbindet digitales Entdecken mit dem Gastgeberort: Wer online drei Bezüge merkt, findet sie beim Termin bereitgelegt, neben einem Espresso. Online-Spiel und Café werden *ein* Erlebnis. Das kann kein Wettbewerber ohne Café kopieren (Masterkonzept 4.2 #1).
2. **„Ein Abend im Haus“ als Rundgang.** Der 360°-Rundgang (2.4) läuft wahlweise als „Tag“ und „Abend“ (zwei Fotoserien, gleiche Standpunkte, Umschalter mit Crossfade 600 ms). Gerade die Leuchten von Flos und das Licht auf den Steinplatten wirken erst abends. Das zeigt sonst niemand.
3. **Moodboard zum Mitbringen.** Das Stil-Finder-Ergebnis wird zum Gesprächsstart beim Termin: Die Beraterin hat dasselbe Board auf dem Tablet (Code aus der URL) und legt die echten Materialien daneben. Online-Spiel → Offline-Beratung ohne Medienbruch.
4. **„Ihr Raum, Ihr Licht“ für Steinplatten der Küchenlinie.** Der Licht-Regler (Morgen/Mittag/Abend) mit echten Fotos macht aus einer leistbaren Küchenlinie ein Beratungsthema mit Tiefe und hebt sie vom Küchenstudio-Konfigurator ab.
5. **Die Karte als Versprechen.** Die Dreiländereck-Karte zeigt nicht nur „wo“, sondern „wie einfach“: Fahrzeit, Währung, Verzollung, Montage in einer ruhigen Animation. Das ist der Dreiländer-Festpreis (4.2 #5), erlebbar gemacht.
6. **Saisonale „stille Details“.** Im Rundgang ändern sich die versteckten Details mit der Saison (Advent: der Adventsabend am 26.11. als Detail am Café-Tresen; Frühling: Tuuci-Schirme auf der Terrasse). Wiederkehrende Besucher entdecken Neues, ohne dass ein Zähler sie dazu drängt.
7. **Schneller als die anderen, obwohl spielerischer.** Alle Bausteine zusammen kosten im Initial-Bundle unter 15 KB. Das ist ein messbarer Vorsprung (LCP, INP), den man der Zielgruppe nicht erklären muss, weil sie ihn spürt.

---

## 4. Was man auf keinen Fall tun darf

- **Keine Punkte, Abzeichen, Ranglisten, Fortschritts-„Level“, Glücksräder oder Rubbellose.** Sie senken die Motivation (Hanus & Fox 2015) und wirken für eine Luxusmarke billig. Ein Glücksrad gegen E-Mail ist zudem ein Kopplungsproblem (DSGVO-Einwilligung nicht freiwillig).
- **Kein Ergebnis hinter einer E-Mail-Mauer** („Geben Sie Ihre E-Mail ein, um Ihr Stilprofil zu sehen“). Das ist Erzwingen von Daten und zerstört den IKEA-Effekt.
- **Keine Fake-Knappheit, keine Countdowns, kein Confirmshaming** („Nein danke, ich mag keine schönen Räume“), keine vorangekreuzten Häkchen (DSA Art. 25, UGP-Richtlinie Anhang I, UWG AT/DE).
- **Keine variablen Belohnungen nach dem Spielautomaten-Prinzip** (zufällige „Überraschungsrabatte“ beim Scrollen). Das ist Manipulation und Rabattsprache.
- **Keine Pseudo-Psychologie im Stil-Finder** (Persönlichkeitstypen, „neuronale“ Versprechen). Das Ergebnis beschreibt Materialien und Räume, nicht den Menschen.
- **Kein Preloader, kein Intro, kein Scroll-Hijacking, kein Custom Cursor, kein Lenis-Smooth-Scroll** (`digital/02`, „Bewusst nicht im Plan“). Lenis steht zwar in `package.json`, gehört aber in keine dieser Interaktionen.
- **Keine Engine im Initial-Bundle:** kein `three`, `pixi.js`, `@splinetool/runtime` oder Rive-WASM in geteilten Komponenten oder Layouts. Spline zusätzlich nicht ohne Consent und Lizenzprüfung (Szenen beim Anbieter, proprietär).
- **Keine nachmodellierten 3D-Möbel oder KI-Renderings von Designerstücken** ohne Lizenz der Marke (EuGH *Mio/konektra*), und keine KI-Raumbilder als echte Referenzen (UWG, `digital/01`).
- **Keine Ziehgeste ohne Alternative** (WCAG 2.5.7), kein Inhalt nur im Canvas ohne Text-Alternative, keine Bewegung ohne Reduced-Motion-Variante, keine Autoplay-Animation länger als 5 s ohne Pause (WCAG 2.2.2).
- **Kein Bounce, kein Konfetti, kein Wackeln, keine Sounds ohne Einschalten.** Edel heißt: gedämpft, leise, präzise.
- **Kein Gyroskop, keine Kamera, kein Standort ohne ausdrückliches Antippen** (`Permissions-Policy`, `digital/13` Regel 9).
- **Keine Händler-Behauptungen in den Interaktionen** (z. B. „offizieller Minotti-Partner“ als Hotspot-Text). Formulierung nach `digital/12`: Marken werden „gezeigt“ bzw. „geführt“, „offiziell“ nur bei ClassiCon.

---

## 5. Prüf-Checkliste für die drei Prototypen (galerie, buehne, dreilaendereck)

**Skala je Kriterium:** 0 = fehlt oder verletzt eine „Nie“-Regel · 1 = vorhanden, aber spürbare Mängel · 2 = solide · 3 = vorbildlich und messbar belegt. **Gewicht** in Klammern. Punkte = Wertung × Gewicht. 26 Kriterien, maximal **207 Punkte** (A 45, B 30, C 24, D 45, E 36, F 27). Ein einziges **K.-o.-Kriterium** (mit [K.O.] markiert) mit 0 Punkten führt zur Ablehnung, egal wie hoch die Summe ist.

### A. Game-Feel und Timing (Gewicht 3)
| # | Kriterium | Wie prüfen | 3 Punkte, wenn … |
|---|---|---|---|
| A1 | Sofortige Rückmeldung | Performance-Panel, Tippen auf Swatch, Hotspot, Karte | erste sichtbare Reaktion ≤ 50 ms, INP p75 ≤ 150 ms auf Moto-G-Profil |
| A2 | Einheitliche Timing-Sprache | Code lesen: Tokens statt Zahlen | nur `--duration-*` und `--ease-quiet*`, keine Einzelwerte |
| A3 | Gedämpfte Bewegung | ansehen | kein Overshoot > 2 %, kein Bounce, Austritt ≤ 200 ms |
| A4 | Ein Höhepunkt pro Seite | Seite komplett durchgehen | genau ein gestalteter Moment, Rest ruhig |
| A5 | Gestaltetes Ende | Interaktion bis zum Schluss spielen | warmer Abschluss mit menschlicher nächster Handlung |

### B. Entdecken statt Punkte (Gewicht 2)
| # | Kriterium | 3 Punkte, wenn … |
|---|---|---|
| B1 | Neugier-Lücken | Hotspots/Details zeigen zuerst wenig und öffnen sich auf Wunsch |
| B2 | [K.O.] Keine Punkte, Abzeichen, Ranglisten, Zähler | nichts davon vorhanden |
| B3 | Belohnung ist Inhalt | entdeckte Details liefern Wissen, Geschichte oder Ortsbezug (Café, See, Musterbuch) |
| B4 | Eigenes Ergebnis | Nutzer erhält in ≤ 90 s etwas Eigenes (Kombination, Moodboard), teilbar per Link |
| B5 | Bezug zum Ort Lochau | die Interaktion führt sichtbar zum Showroom/Café (Termin, Muster, Besuch) |

### C. Konkrete Bausteine (Gewicht 2, nur bewerten, was der Prototyp zeigt; nicht gezeigte Bausteine mit 1 bewerten, als „Konzept fehlt“)
| # | Kriterium | 3 Punkte, wenn … |
|---|---|---|
| C1 | Material-Spiel | echte Variantenfotos, Crossfade 240 ms, Makroansicht, Radiogroup mit Tastatur |
| C2 | Stil-Finder | 5–7 Fragen, „Weiß ich nicht“/Überspringen, Moodboard ohne E-Mail-Mauer |
| C3 | Raum-Explorer | Hotspots mit Liste als Alternative, Rundgang nur nach Klick, Knöpfe statt nur Ziehen |
| C4 | Dreiländereck-Karte | eigene SVG, 0 KB Kartenbibliothek, Fahrzeit/Währung/Lieferung je Region, Liste darunter |

### D. Performance und Technik (Gewicht 3)
| # | Kriterium | Wie prüfen | 3 Punkte, wenn … |
|---|---|---|---|
| D1 | [K.O.] Keine Engine im Initial-Bundle | `next experimental-analyze` bzw. Bundle-Analyzer | kein `three`, `pixi`, `@splinetool`, `@rive-app` im Initial-Chunk |
| D2 | Insel-Budget | `size-limit` | jede spielerische Insel ≤ 10 KB gzip, Initial-JS der Route ≤ 170 KB |
| D3 | LCP unberührt | Lighthouse mobil | LCP ≤ 2,0 s (Feld) bzw. ≤ 2,5 s (Labor), LCP-Element nie animiert eingeblendet |
| D4 | CLS | Lighthouse | ≤ 0,05, Fassaden haben feste Seitenverhältnisse |
| D5 | Funktioniert ohne JS | JS abschalten | Bilder, Texte, Listen, Formular (Stil-Finder) nutzbar |

### E. Barrierefreiheit (Gewicht 3)
| # | Kriterium | 3 Punkte, wenn … |
|---|---|---|
| E1 | [K.O.] Reduced Motion | bei `prefers-reduced-motion: reduce` nur Crossfades ≤ 150 ms, kein Puls, kein Stagger, keine Route-Animation |
| E2 | [K.O.] Ziehen hat Alternative (WCAG 2.5.7) | jede Drag-/Dreh-Geste auch per Knopf und Tastatur |
| E3 | Fokus und Ziele | sichtbarer Fokus ≥ 3:1, Ziele ≥ 44 px, logische Tab-Reihenfolge, axe ohne Fehler |
| E4 | Text-Alternative | jeder Canvas/SVG-Inhalt auch als Liste oder Text |

### F. Recht und Ethik (Gewicht 3)
| # | Kriterium | 3 Punkte, wenn … |
|---|---|---|
| F1 | [K.O.] Keine Dark Patterns | keine Fake-Knappheit, kein Countdown, kein Confirmshaming, keine E-Mail-Mauer, keine vorangekreuzten Felder |
| F2 | [K.O.] Keine Händler-Behauptungen, keine unlizenzierten 3D-Möbel/KI-Referenzen | Formulierungen nach `digital/12`, nur eigene oder freigegebene Bilder |
| F3 | Daten | keine Speicherung von Quiz-Antworten ohne Einwilligung, kein Drittanbieter-Embed vor Consent, kein Standort/Gyroskop ohne Antippen |

### Auswertung
- **≥ 165 Punkte (80 %) und kein [K.O.] mit 0:** freigeben, als Grundlage für den Neuauftritt nehmen.
- **124–164 Punkte (60–79 %):** gute Basis, gezielt in den schwachen Bereichen nachbessern.
- **< 124 Punkte oder ein [K.O.] mit 0:** nicht weiterverfolgen, nur einzelne Ideen übernehmen.
- **Bonus-Notiz statt Punkte:** Welcher Prototyp hat die beste *Idee* für „Entdecken im Raum“? Ideen lassen sich zwischen den Prototypen übertragen, Performance-Schulden nicht.

---

## Quellen

- Swink, S.: *Game Feel*, Morgan Kaufmann 2008/2009; Zusammenfassung: [Wikipedia „Game feel“](https://en.wikipedia.org/wiki/Game_feel); [Pichlmair & Johansen, „Designing Game Feel. A Survey“, arXiv 2011.09201](https://arxiv.org/pdf/2011.09201)
- [Nielsen, J.: „The 3 Response Time Limits in Interaction Design“, NN/g](https://www.nngroup.com/videos/3-response-time-limits-interaction-design/)
- [Deterding, Dixon, Khaled & Nacke: „From Game Design Elements to Gamefulness: Defining Gamification“, MindTrek 2011](https://pure.itu.dk/en/publications/from-game-design-elements-to-gamefulness-defining-gamification/)
- [Hanus, M. D. & Fox, J.: „Assessing the effects of gamification in the classroom“, *Computers & Education* 80 (2015) 152–161](https://www.smhp.psych.ucla.edu/pdfdocs/gamil.pdf)
- Loewenstein, G.: „The Psychology of Curiosity“, *Psychological Bulletin* 116 (1994); Zusammenfassung: [PBS/NOVA „How to Stimulate Curiosity“](https://www.pbs.org/wgbh/nova/article/how-to-stimulate-curiosity/)
- [Norton, Mochon & Ariely: „The IKEA Effect: When Labor Leads to Love“, *Journal of Consumer Psychology* 22(3), 2012](https://dash.harvard.edu/handle/1/12136084)
- Kahneman, Fredrickson, Schreiber & Redelmeier: „When more pain is preferred to less“, *Psychological Science* 4 (1993) 401–405; Zusammenfassung: [Psychology Today](https://www.psychologytoday.com/us/blog/fulfillment-any-age/201209/happiness-it-s-all-about-the-ending)
- Buell, R. W. & Norton, M. I.: „The Labor Illusion“, *Management Science* 57(9), 2011, 1564–1579; Nachweis: [IDEAS/RePEc](https://ideas.repec.org/p/hbs/wpaper/14-034.html)
- [Verordnung (EU) 2022/2065 (DSA), Art. 25](https://www.springlex.eu/en/packages/dsa/dsa-regulation/article-25/)
- [W3C: Understanding SC 2.5.7 Dragging Movements (WCAG 2.2)](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)
- [Rive: Runtime sizes](https://rive.app/docs/runtimes/runtime-sizes.md) (Herstellerangabe)
- [Universität Jyväskylä: „More than skin-deep: presence dimensions and purchase intentions in AR shopping“, 2023](https://jyx.jyu.fi/jyx/Record/jyx_123456789_89265/Description)
- [Kent State University: „Understanding Furniture Design Choices Using a 3D Virtual Showroom“](https://digitalcommons.kent.edu/caedpubs/32)
- Bundle-Größen: bundlephobia-API und `npm view`, abgerufen am 26.10.2026
- Interne Berichte: `Marktresearch/digital/01`, `02`, `03`, `04`, `12`, `13`, `14`, `Marktresearch/23-masterkonzept.md`
