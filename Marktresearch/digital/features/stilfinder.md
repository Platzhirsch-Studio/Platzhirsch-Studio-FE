# Feature: Stil-Finder (Labs)

**Stand:** 28.10.2026 (Restliste der Abnahme Runde 3 eingearbeitet) · Team „Stil-Finder“ · Status: Labs-Prototyp (`noindex, nofollow`, nur Locale `de`)

## Was gebaut ist
- **/de/labs/stilfinder**: ein Bilder-Quiz mit 7 Fragen: Raum, Material, Farbe (Paletten statt Fotos), Form, Lebensstil, Licht und optional der Rahmen des Vorhabens.
  - Mobil ein Raster mit 2 Spalten (4:5). Eine ungerade letzte Karte geht über die volle Breite. Im ersten Bildschirm sind so 2–4 Antworten zu sehen.
  - Die Bilder werden als statische Importe geladen und haben daher einen **Unschärfe-Platzhalter**. Die Fotos der sichtbaren Frage laden sofort (`loading="eager"`, die ersten zwei mit `fetchPriority="high"`).
  - **Vorladen:** Das Intro lädt Frage 1 vor und, sobald der Browser untätig ist, Frage 2. Jede Frage lädt die nächste sofort vor und alle weiteren im Leerlauf. Dafür erzeugt `getImageProps` dieselbe `srcset`/`sizes`-Kombination, die auch gerendert wird.
  - Antwort per Tippen führt automatisch weiter. Wischen nach rechts geht eine Frage zurück; bei Frage 2 erscheint auf Touch-Geräten dazu einmal der Hinweis „← Nach rechts wischen geht zurück“. Tasten 1–5 wählen eine Antwort, ← oder Backspace gehen zurück.
  - Der Fokus landet beim Erscheinen auf der Überschrift der neuen Frage. Er wird in `QuestionView` selbst gesetzt, also nach dem Montieren durch `AnimatePresence`.
  - Während eine Frage ausgeblendet wird, nimmt sie keine Klicks mehr an (`pointer-events: none` im Exit).
  - Danach folgt der Zwischenschritt „Wir legen Ihr Moodboard aus …“ mit dem **immer sichtbaren Link „Ergebnis öffnen →“**. Das ist ein normales `<a>`, also ein vollständiger Seitenaufruf.
- **/de/labs/stilfinder/ergebnis/[profil]?a=<code>**: Ergebnis, das sich teilen lässt.
  - `loading.js` zeigt sofort ein Skelett (Bild, Profilkopf, Palette).
  - Profil, Palette und Marken werden direkt gerendert. Das **Moodboard wird per `<Suspense>` nachgestreamt** und hat ein eigenes Skelett.
  - Mobil steht das Heldenbild zuerst und randlos, der Profilname darunter.
  - Die Mischungs-Legende ist bis `lg` einspaltig. Die Prozentzahl bricht nicht um, der Name wird nicht abgeschnitten.
  - Die Palette ist mobil eine Liste aus 5 Zeilen (Farbfläche mit Name und Hex), ab `sm` sind es 5 hohe Felder.
  - **Moodboard:** 8 echte Katalogprodukte auf einheitlichem Bildgrund `#f3f0ea`. Freisteller werden mit `mix-blend-multiply` eingesetzt, Raumfotos erscheinen randlos (`object-cover`). Die Erkennung läuft clientseitig über die Randpixel des geladenen Bildes. Die Beschriftung steht klein unter dem Bild, darüber liegt ein Farbstreifen der Palette.
    - Raster auf md: 1 Stück 2×2, 1 Stück 2×1 (Querformat) und 6 Quadrate, also 12 Zellen ohne Lücke. Mobil gehen die beiden großen Stücke über die volle Breite.
    - Eigene Merklisten-Herzen mit 44 × 44 px und eindeutigem Label („<Marke> <Name> auf die Merkliste setzen“). Sie nutzen den exportierten Hook `useWishlistToggle`; die geteilte Komponente bleibt unverändert. Dazu „Alle merken“.
  - Dazu: passende Marken, Tipp aus dem Studio, Termin, Merkliste, Teilen und Link kopieren.
  - **Opt-in „Ergebnis auf diesem Gerät merken“** mit Kurztext und Link zur Datenschutzerklärung. Danach steht dort „Auf diesem Gerät gemerkt. Vergessen“.
- 5 Profile: **Italienische Ruhe**, **Warme Moderne**, **Seeterrasse**, **Pariser Salon**, **Klare Linie**.

## Dateien
| Datei | Rolle |
|---|---|
| `src/app/[locale]/labs/stilfinder/page.js` | Quiz-Seite (Server, noindex, `notFound()` außer `de`) |
| `src/app/[locale]/labs/stilfinder/ergebnis/[profil]/layout.js` | Prüft Locale und Profil **außerhalb** der Suspense-Grenze, damit unbekannte Profile echte 404 liefern |
| `src/app/[locale]/labs/stilfinder/ergebnis/[profil]/loading.js` | Sofortiges Skelett beim Wechsel zum Ergebnis |
| `src/app/[locale]/labs/stilfinder/ergebnis/[profil]/page.js` | Ergebnis (Server). Validiert `?a=` mit zod; Moodboard in `<Suspense>` |
| `src/components/Labs/Stilfinder/profiles.js` | Profile: Texte, Palette, Marken, Moodboard-Spezifikation, Hero (`src` für OG, `img` als statischer Import) |
| `src/components/Labs/Stilfinder/questions.js` | Fragen (Bilder als statische Importe), Gewichte, `scoreAnswers()`, `leadingProfile()`, Code-Validierung, Seed |
| `src/components/Labs/Stilfinder/catalog.js` | `server-only`-Adapter auf `fetchProdukteNewByMarke` |
| `src/components/Labs/Stilfinder/MoodboardLoader.js` | Async Server Component: lädt das Board, gestreamt |
| `src/components/Labs/Stilfinder/Moodboard.js` | Client: Moodboard-Raster, Erkennung Freisteller/Raumfoto, Herzen, „Alle merken“ |
| `src/components/Labs/Stilfinder/Skeletons.js` | `ResultSkeleton` (loading.js) und `MoodboardSkeleton` (Suspense) |
| `src/components/Labs/Stilfinder/StilfinderQuiz.js` | Client-Quiz (motion, Vorladen, Navigation mit Rückfall, Swipe, Tastatur) |
| `src/components/Labs/Stilfinder/StilResult.js` | Client-Ergebnis (Teilen, Kopieren, Palette, Opt-in-Merken) |
| `src/components/Labs/Stilfinder/storage.js` | localStorage-Zugriff, nur auf ausdrücklichen Wunsch |

## Architektur
- Das Quiz braucht keine Serverdaten. Der Katalog wird erst auf der Ergebnisseite geladen und dort gestreamt.
- **Navigation zum Ergebnis:**
  1. Ab Frage 6 `router.prefetch()` des Profils, das gerade vorne liegt (`leadingProfile`).
  2. Beim Abschluss `router.prefetch(href)` und nach 0,9 s `router.push(href)`. `loading.js` schaltet sofort auf das Skelett um.
  3. **Rückfall:** Ist die URL nach 6 s noch nicht gewechselt, folgt `window.location.assign(href)`. Der Link „Ergebnis öffnen →“ ist immer sichtbar.
  - Hinweis: Im Dev-Modus prefetcht Next nicht. Der Wechsel dauerte im Test auf dem ausgelasteten Dev-Server 5,5 s (iPhone) bzw. 8,5 s (Desktop, dort hat der Rückfall gegriffen). In Produktion ist er durch Prefetch und `loading.js` sofort da.
- **Bewertung:** transparente gewichtete Summe ohne KI. Die Rangfolge ist stabil: zuerst Punktzahl, dann Profil-Reihenfolge.
- **Antwort-Code** `a`: ein Zeichen je Frage (`0–4`, `x` = übersprungen, nur bei der optionalen Frage). Der Server rechnet nach. Ein manipulierter Code wird ignoriert. Zeigt der Code auf ein anderes Profil als der Pfad, entfällt die Mischung.
- **Moodboard:** pro Profil eine Liste aus `{brand, categories, count}`, ausgewählt per Round-Robin mit einem seeded PRNG (mulberry32, Seed = Hash des Codes). Derselbe Link zeigt dasselbe Board. An den Client gehen nur Name, Marke, Kategorie, erstes Bild, Alt-Text und Link.
- **Bewegung:** motion für Fragenwechsel, Karten, Ladeanimation und Mischungsbalken. Ergebnis-Abschnitte nutzen das CSS-`.reveal` der Website. `useReducedMotion` reduziert auf reine Überblendungen.
- **Bilder:** Fragen, Intro-Collage und Hero als statische Importe aus `public/Images` (Blur-Platzhalter). Produkte kommen über `/cmx`. Alle Bilder haben passende `sizes`.
  - Ersetzt wegen zu geringer Auflösung: „Bouclé & Leinen“ (`minotti-wohnwelt.jpg`, 469 px) durch `UberUns/livingroom-view.jpg` (2599 px), „Draußen sein“ (`thidImage.jpg`, 1200 × 580) durch `Outdoor/bannerImage4.jpg` (2048 px).
- **Kontrast:** Im Stil-Finder liegen kleine Texte nirgends unter `text-ink/75` (5,37 : 1). Fließtext ist explizit `font-normal`.

## Datenmodell
- `Profile { key, slug, name, tagline, text, keywords[], palette[{name,hex}], brands[], moodboard[{brand,categories[],count}], hero{src,img,alt}, tip }`
- `Question { id, kind: image|palette|scope, overline, title, optional?, options[{label, image?(StaticImageData), alt?, swatches?, sub?, range?, w{profilKey:punkte}}] }`
- `MoodItem { id, name, brand, categoryKey, image, alt, url_slug, href }`
- Keine Serverspeicherung. Der lokale Schlüssel `platzhirsch:stilfinder:last` enthält `{slug, code, name, at}` und wird **nur nach Klick auf „Ergebnis auf diesem Gerät merken“** geschrieben (`code` ist leer bei Links ohne `?a=`). Ein `.data/`-Speicher ist nicht nötig.

## Anbindung Frappe
- Heute nur lesend über `produkte_new.api.get_produkte_by_marke_api?marken=<Marke>` (Doctype **Produkte New**, Felder `produkt_name, path_field, marken, kategories, status, bild_anhangen[]`). Gecacht 1 h, Tag `products`.
- Später empfohlen:
  1. Ein eigener Whitelist-Endpoint `get_stil_moodboard?profil=…`, damit nicht mehr ganze Markenlisten geladen werden.
  2. Ein Feld **„Stil-Tags“** (Table MultiSelect) in *Produkte New*.
  3. Ein Doctype **„Stilprofil“** für Texte, Palette und Marken.
  4. Ein Feld **„Bildtyp“** (Freisteller/Raumfoto) am Bildanhang. Damit entfällt die Erkennung im Client.
  5. Optional ein Doctype **„Stil-Finder Lead“**, aber nur mit dem Beratungsformular und mit Einwilligung.

## Rechtliches
- Labs-Seiten sind `noindex, nofollow` und nur unter `de` erreichbar. Unbekannte Profile oder Locales liefern 404 (Prüfung im `layout.js`).
- **localStorage nur per Opt-in** (§ 165 Abs. 3 TKG 2021 / § 25 TDDDG): Es gibt kein automatisches Speichern mehr. Der Text im Intro sagt das ausdrücklich. Auf der Ergebnisseite stehen ein Button, der Kurztext „Freiwillig: nur in Ihrem Browser gespeichert … jederzeit löschbar“ und der Link zur Datenschutzerklärung. „Vergessen“ steht auf der Ergebnisseite und im Intro.
- Keine Händler-Behauptungen. Die Überschrift „Diese Häuser tragen Ihre Handschrift“ soll der Inhaber freigeben.
- Keine Preise: In der Rahmen-Frage steht einmal „Richtwerte folgen – [Preis vom Inhaber festzulegen]“; die Werte sind in `questions.js` konfigurierbar.
- „Regelbasiert, keine KI“ ist im Fuß offengelegt, daher keine Kennzeichnung nach Art. 50 AI Act nötig.
- **Offen:** Die Bildrechte an den Herstellerfotos in `public/Images` sind vor dem Livegang zu prüfen.

## Offene Punkte
- **An das Layout-Team melden (nicht in unseren Dateien):**
  - Bodoni Moda zeigt in großen Titeln eine Lücke nach dem „W“ („W elcher“). `font-kerning: normal` ist im Stil-Finder gesetzt, hilft aber nicht. Wahrscheinlich liegt es an der Font-Einbindung bzw. der optischen Größe (`opsz`).
  - Montserrat wirkt auf iOS dünn. Im Stil-Finder ist `font-normal` explizit gesetzt und reicht dort.
  - Die Konsolenwarnung „Can't perform a React state update on a component that hasn't mounted yet“ kommt **nicht** aus dem Stil-Finder und nicht vom Merklisten-Herz. Sie tritt auch auf `/de/kontakt` und auf der Quiz-Seite ohne Herz auf. Die Ursache liegt im Layout bzw. in einer globalen Komponente. (Die frühere Doku hatte das falsch dem Herz bzw. CartContext zugeordnet.)
  - Warnungen „preloaded but not used“ für die Schriften kommen ebenfalls aus dem Layout.
- RSC-Fehlerserie auf dem iPhone (QA P3-6), nachgeprüft:
  - Im `shoot.mjs`-Lauf brach auf dem Desktop eine Ergebnisseite mit abgebrochenen `_rsc`-Requests ab (kein `networkidle` innerhalb von 120 s).
  - Bei der Gegenprobe (20 s Beobachtung) gab es 0 RSC-Requests, aber 5× „[Fast Refresh] rebuilding“. Ursache sind die HMR-Neuladungen durch parallele Änderungen anderer Teams, nicht der Stil-Finder.
  - Im Code gibt es kein `router.refresh`/`replace`. In Runde 2 bei ruhigem Dev-Server erneut prüfen.
- Semantik der Antworten als `radiogroup` (P3-3): bewusst nicht umgesetzt. Bei automatischem Weiter passen Buttons mit `aria-pressed` besser als Radios mit Pfeil-Navigation.
- Texte, Paletten und Gewichte mit dem Inhaber und 5–10 Testpersonen abstimmen. Echte Preisrahmen eintragen.
- Beratungsformular mit `?stil=<slug>` vorbelegen (liegt nicht in unseren Dateien). OG-Bild pro Profil. Übersetzungen.

## Prüfung (Runde 1 – Fixes)
- `curl`:
  - 200: `/de/labs/stilfinder`, `…/ergebnis/seeterrasse?a=0120120`, `…/italienische-ruhe`, `…/pariser-salon`, `…/klare-linie?a=2134111`, `…?a=<script>`
  - 404: `…/ergebnis/foo`, `/en/labs/stilfinder`, `/en/…/ergebnis/seeterrasse`
- Interaktion (Playwright, iPhone 15 Pro WebKit und Desktop Chromium; Screenshots in `qa-screenshots/stilfinder/fix/interact/`):
  - Fokus liegt nach jedem Wechsel auf der H2 der Frage.
  - Erster, kalter Lauf: Fragen 1 und 2 hatten nach 600 ms 5/5 Bilder, ab Frage 4 waren noch Blur-Platzhalter zu sehen. Seitdem wird alles Weitere im Leerlauf vorgeladen.
  - Zweiter Lauf: Alle Bildfragen (1, 2, 4, 5, 6) haben nach 600 ms 5/5 Bilder, auf iPhone und Desktop.
  - Der Wechsel zum Ergebnis dauerte auf dem Dev-Server rund 6,1 s; der Rückfall auf einen normalen Seitenaufruf hat gegriffen. Auf dem Desktop ist das Skelett aus `loading.js` sichtbar.
  - localStorage ist nach dem Abschluss `null`, nach dem Opt-in gesetzt und nach „Vergessen“ wieder `null`.
  - Herzen messen 44 × 44 px und haben eindeutige Labels. Kein horizontales Scrollen.
- `node tools/qa/shoot.mjs qa-screenshots/stilfinder/fix …`: Screenshots in `qa-screenshots/stilfinder/fix/`.
- `npx eslint src/app/[locale]/labs/stilfinder src/components/Labs/Stilfinder` läuft ohne Befund.


## Runde 2 (Paket R2-labs-erlebnis, 26.10.2026)

**Umgesetzt**
- **Punkt 7 Zähler:** `Progress` zeigt jetzt die Frage, die tatsächlich auf dem Bildschirm steht (`shown`). `QuestionView` meldet sie per `useLayoutEffect` vor dem ersten Paint. Bei `AnimatePresence mode="wait"` blieb die alte Frage sichtbar, während der Zähler schon „02“ zeigte. Messung alle 80–200 ms auf iPhone, Android und Desktop: Zähler und H2 sind immer synchron.
- **Punkt 8 Mischbalken:** Die Segmente werden serverseitig mit ihrer Endbreite gerendert und sind damit ohne JS, vor der Hydrierung und ohne Scrollen gefüllt. Das Einblenden ist eine reine CSS-Animation (`clip-path`, nur `motion-safe`). Mit reduced motion ist der Balken sofort voll (iPad gemessen: `animation: none`, 100 % Breite).
- **Punkt 5 Warnungen:** Unter reduced motion gab es auf der Ergebnisseite einen echten Hydration-Mismatch aus unserer Datei: Das Heldenbild bekam `transform: scale(1.04)` vom Server und `none` vom Client, weil `useReducedMotion` nur im Client wirkt. Das Settle-in ist jetzt CSS (`@keyframes sf-hero-settle`, motion-safe). `motion/react` wird in `StilResult.js` nicht mehr importiert. Danach gibt es 0 Meldungen.
  - Verbleibend (nicht unsere Datei): Hydration-Mismatch `caret-color: transparent` in `SearchDialog` (Navbar) in WebKit. Das betrifft das Header-Team.
  - Die frühere Meldung „state update … not mounted“ ist nicht reproduzierbar. Sie tritt im Zusammenhang mit HMR-Neuladungen des Dev-Servers auf.
- **Abstände:** Quiz `pt-12 sm:pt-16 md:pt-24 lg:pt-28`, Ergebnis `pt-8 sm:pt-16 md:pt-24 lg:pt-28` (vorher bis 208 px über dem Eyebrow).

**Punkt 4 Bodoni-Lücke nach „W“: Ursache gefunden, global, nur dokumentiert.**
- Messung (`r2/bodoni-kern.mjs`, 100 px, Kerning an minus aus): „AV“ −10,6, „To“ −6,1, „Ve“ −11,3, „Yo“ −10,9. Dagegen **„We“, „Wo“, „Wi“ = 0,0**, in Chromium und WebKit gleich.
- Die ausgelieferte Bodoni-Moda-Datei (Google Fonts, `latin`-Subset über next/font) enthält also Kerning, aber **keine Paare für W + Kleinbuchstabe**. Das W hat eine breite rechte Seitenpeilung.
- `letter-spacing`, `font-feature-settings`, `font-kerning`, `opsz` 11/96 und das Gewicht ändern den Abstand nicht (`r2/bodoni-probe.mjs`, Bilder in `r2/bodoni/`).
- Lösung für das Layout-Team, eine von beiden:
  - (a) Die Schrift selbst hosten und die W-Paare per fontTools ergänzen, etwa −0,08 bis −0,10 em, in Anlehnung an „Ve“.
  - (b) Eine globale Display-Hilfe, die ein führendes „W“ in Titeln mit `margin-right: -0.08em` umschließt.
- Im Stil-Finder bewusst kein lokaler Hack.

**Nicht bearbeitet (optional):** Punkt 9 (iPhone-Abstand vor dem Moodboard). Punkt 10: Ein Klick vor der Hydrierung wird ignoriert. Das ist im Dev-Server reproduzierbar und für den Produktions-Build zu prüfen; die Tests warten deshalb auf `__reactProps`.

**Tests:** `tests/unit/labs-stilfinder-r2.test.mjs` (Scoring über 305 Codes: Anteile 98–102 %, Codes, Regression für Balken, Hydration und Zähler; Bild-Imports werden per Loader-Hook ersetzt), `tests/e2e/labs-stilfinder.spec.js` (Zähler-Synchronität, Balken unter reduced motion).

**Bleibt beim Inhaber:** Bildrechte im Moodboard, Preise und Richtwerte, Textfreigabe. Die Kennzeichnungen sind unverändert.

### Runde 2, Nachbesserung (Teamleiter-Feedback)
- **Android-Konsolenfehler:** Der Fehler „state update … hasn't mounted yet“ kam von `next/image` mit `placeholder="blur"`. Die Komponente setzt nach `decode()` asynchron einen State. Bei einem Dev-HMR-Refresh trifft dieser Aufruf eine verworfene Fiber. Die Vorschau ist jetzt ein reiner CSS-Hintergrund (`blurBackdrop.js`).
- **Bodoni-W:** Lokales optisches Kerning (`kernW.js`, −0,085 em) in H1, Fragetiteln und Ergebnis-Titel, bis die globale Lösung umgesetzt ist.
- **Mischung:** Die Rundung erfolgt nach dem größten Rest, die Summe ergibt immer genau 100 %.
- **Frage 7:** `range: null`. Solange der Inhaber keine Richtwerte setzt, erscheint keine Preiszeile und kein Platzhalter.
- Tests in `tests/unit/labs-stilfinder-r2fix.test.mjs`, Belege in `qa-screenshots/stilfinder/r2/fix/`.

## Runde 5 (Paket R5-portal-labs, 26.10.2026)

- **LazyMotion mit domMax** (wegen `drag`, Wischen zurück): `StilfinderQuiz` rendert in `<LabsMotion features="max">`, alle Elemente als `m.*`. Die Eingangsanimationen (Collage, Karten, Palette) starten erst, wenn die Features geladen sind (`useMotionReady()`). Davor gilt `initial={false}`, deshalb ist im Server-HTML und während der Hydration alles sichtbar. Fällt der Feature-Chunk aus, geht das Quiz trotzdem weiter: AnimatePresence entfernt Kinder ohne Exit-Feature sofort. Das belegt e2e `r5-portal-labs.spec.js` gegen `next start` mit blockiertem Chunk. Reduced motion bleibt wie bisher.
- Bundle Prod: Initial 251,2 → **230,9 KB** gz, routeneigen 120,9 → 100,6 KB.

## Moodboard als PDF-Präsentation per E-Mail (27.10.2026, Team „Stil-Finder mit Premium-PDF“)

### Was gebaut ist
- **Formular unter dem Moodboard** auf jeder Ergebnisseite (`MoodboardPdfForm.js`, eigener Abschnitt nach „Stücke aus unserem Katalog“):
  - Pflicht ist **nur die E-Mail-Adresse**. Optional: Name (für die Titelseite), Vorhaben (Neubau, Umbau, einzelne Räume, Zweitwohnsitz, Objekt, noch offen) und Region (Vorarlberg, DE Bodensee/Allgäu, Ostschweiz/Zürich, Liechtenstein, andere).
  - **Hinweistext zum PDF-Versand** direkt über dem Knopf: einmaliger Versand, Angaben nur dafür verwendet und danach nicht gespeichert, KI-Kennzeichnung, Link zur Datenschutzerklärung. Bewusst gibt es **keine** Pflicht-Checkbox: Der Versand ist die angefragte Leistung (Art. 6 Abs. 1 lit. b DSGVO), informiert wird nach Art. 13. [anwaltlich prüfen]
  - **Newsletter separat und nicht vorangekreuzt**, mit Double-Opt-in-Hinweis („zuerst eine eigene E-Mail mit Bestätigungslink …, Abmeldung jederzeit“). Im Labs-Modus wird der Wunsch **nur protokolliert** (Postausgang, Mailtext). An Backoffice oder Brevo geht nichts.
  - Links stehen eine Vorschau aus drei gestapelten „Seiten“ (Titelbild, Palette) und die Kapitelliste mit Häkchen, rechts das Formular. Dazu kommen der Honeypot `website` und die Zeitfalle `_t` (Dauer seit dem Rendern).
  - Zustände:
    - Fehler am Feld: `aria-invalid`, Fokus springt aufs Feld, Text steht unter dem Feld.
    - Senden: „Präsentation wird gesetzt …“ mit `aria-busy` und `role=status`.
    - Erfolg: Fokus auf der Überschrift „Ihr Moodboard ist unterwegs.“. Im Dev-Modus steht dort der Hinweis „Testbetrieb (Labs): Es wurde keine E-Mail verschickt“ und der Knopf **„PDF ansehen“**, der das PDF aus dem Postausgang öffnet.
  - Mobil: Alle Textfelder sind 311 × 50 px, Selects 56 px, die Checkbox 24 × 24 px mit großem Label, der Knopf geht über die volle Breite. Kein horizontales Scrollen (gemessen auf dem iPhone in WebKit).
- **PDF mit 28 Seiten, A4 quer** (Präsentation), `src/lib/stilfinder/document.js`:
  1. Titel: Profilfoto randlos, Monogramm, Profilname in Bodoni, Tagline kursiv, Palettenstreifen, „Zusammengestellt für <Name>“, Vorhaben · Region · Datum, Wortmarke
  2. Inhalt
  3. Editorial-Einleitung mit persönlicher Anrede
  4. Stilprofil-Analyse: drei Merkmale, Stichworte, **Mischung in %** und **Ihre Antworten** aus dem Antwort-Code
  5. Farbpalette mit **HEX, RGB, CMYK**
  6. Farbe im Raum (60/30/10)
  7–8. Materialwelt: Holz und Stein, Textil und Metall
  9. Kapitel „Raum für Raum“
  10–19. **Wohnen, Essen, Küche, Schlafen, Outdoor**, je eine Leitseite (großes Stück, Text, drei Richtwerte) und eine Auswahlseite (drei Stücke). Zusammen **20 echte Katalogprodukte** mit Bild, Marke, Name, Kategorie, Link und **QR-Code**
  20. Kombinationsvorschläge (drei Ensembles)
  21. Licht: drei Schichten, Kelvin, eine Leuchte aus der Auswahl
  22. Pflege
  23. Planung
  24–25. **Das eine dunkle Kapitel**, Showroom & Café: Walnut, Messinglinie, „Nehmen Sie Platz.“, Öffnungszeiten aus `lib/site.js`, Adresse, Foto
  26. Nächster Schritt mit **Termin-QR** (`/de/beratung?stil=<slug>`)
  27. Bildnachweis, KI-Kennzeichnung, Datenschutz, Impressum, Hinweis „unverbindlich“
  28. Rückseite
  - **Gestaltung nach Design-Bibel:**
    - Papier `#faf8f4` als Grund, Bone und Stone als Flächen, Haarlinien statt Schatten, 0 Radien. Messing nur auf Walnut (`brass-400`) bzw. als Akzenttext `brass-700` auf Hell.
    - **Bodoni Moda** (400, 500, kursiv) nur für Titel ab 17 pt, **Instrument Sans** (400, 500, 600) für Text. Beide liegen als statische TTF aus Fontsource (latin, SIL OFL 1.1) in `src/lib/stilfinder/fonts/` und werden eingebettet (Subset durch react-pdf).
    - Keine automatische Silbentrennung, wegen der deutschen Komposita.
  - **Fußzeile jeder Seite:** Name und Profil, Seitenzahl „07 / 28“ und der **Bildnachweis je Seite** („Bilder: Minotti, Poliform – Abbildungen aus dem Platzhirsch-Online-Katalog bzw. vom Hersteller“). Im Labs-Modus kommt „**Labs: Bildrechte vor öffentlicher Nutzung klären.**“ dazu. Textseiten tragen „Text KI-gestützt erstellt · Hinweise auf Seite 27“.
  - **Bilder:**
    - Produktbilder kommen **nur aus dem Katalog** (Pfad `/cmx/files/…`). Serverseitig wird der Pfad wie im `/cmx`-Proxy auf `<Backoffice>/files/…` aufgelöst, mit derselben Allowlist.
    - Die Bilder werden nur **verkleinert** (max. 1200 px, JPEG q78), **nie beschnitten oder verändert** (Minotti-Regel). Freisteller stehen auf weißer Kachel, Raumfotos im eigenen Seitenverhältnis auf Papiergrund.
    - Profilfoto und Showroom-Foto stammen aus `public/Images` (Nachweis „Platzhirsch-Bildarchiv bzw. Hersteller“).
  - Fehlt ein Bild (Zeitlimit) oder ist das Backoffice nicht erreichbar, entsteht trotzdem ein vollständiges PDF mit Platzhaltern („Mehr im Studio“).
- **KI-Kennzeichnung (Art. 50 AI Act):** Die redaktionellen Texte in `content.js` sind KI-gestützt verfasst und werden regelbasiert zugeordnet. Zur Laufzeit läuft keine KI. Gekennzeichnet wird im Formular, auf jeder Textseite, auf der Hinweisseite und in der Mail. Die Profil-Auswertung bleibt „regelbasiert, keine KI“.

### Dateien (neu)
| Datei | Rolle |
|---|---|
| `src/components/Labs/Stilfinder/MoodboardPdfForm.js` | Client-Formular, Vorschau, Zustände (in `StilResult.js` eingebunden) |
| `src/app/api/labs/stilfinder/moodboard/route.js` | POST: Same-Origin, `guardForm`, Limit je Adresse, Build-Slot, Versand |
| `src/app/api/labs/stilfinder/postausgang/[id]/route.js` | **nur Dev**: PDF eines Postausgang-Eintrags (Produktion 404) |
| `src/lib/stilfinder/config.js` | Limits, Budget, Pfade, `mailMode()`, `isLabsMode()` |
| `src/lib/stilfinder/options.js`, `schema.js` | Auswahllisten (Client) und zod-Schema (Server) |
| `src/lib/stilfinder/content.js` | Texte je Profil und gemeinsame Kapitel (Richtwerte, Pflege, Planung, Licht), KI-Hinweis |
| `src/lib/stilfinder/rooms.js` | Produktauswahl je Profil und Raum (Slots `Marke\|Kategorie`, seeded, ohne Dubletten) |
| `src/lib/stilfinder/images.js` | Katalogbild-Lader (Allowlist, Timeout, LRU-Cache 120), sharp → JPEG, Freisteller-Erkennung, `loadAll` mit Gesamtfrist |
| `src/lib/stilfinder/palette.js` | HEX/RGB/CMYK |
| `src/lib/stilfinder/document.js` | Das PDF (react-pdf mit `createElement`, kein JSX, daher direkt testbar) |
| `src/lib/stilfinder/build.js` | Pipeline: Zeilen → Items → Bilder/QR → PDF-Buffer, dazu `countPdfPages` |
| `src/lib/stilfinder/pdfWorker.mjs`, `pdfPool.js` | PDF im **Worker-Thread** (blockiert den Server nicht), Rückfall inline |
| `src/lib/stilfinder/mail.js` | Mail (Text und HTML ohne externe Bilder und Tracking) und Provider-Adapter |
| `src/lib/stilfinder/outbox.js` | Dev-Postausgang mit Frist |
| `src/lib/stilfinder/limits.js` | Limit je E-Mail-Adresse (gehasht), max. gleichzeitige Builds |
| `src/lib/stilfinder/service.js` | Ablauf eines Auftrags (server-only) |
| `src/lib/stilfinder/fonts/*` | Bodoni Moda, Instrument Sans (TTF) und OFL-Lizenztexte |
| `tests/unit/stilfinder-pdf.test.mjs`, `tests/e2e/stilfinder-pdf.spec.js` | Tests |

### Neues Paket
- **`@react-pdf/renderer` 4.9.0**: exakt gepinnt, veröffentlicht am 27.08.2026, also älter als 14 Tage. Installiert mit `--before=2026-10-13`, damit auch alle Unterpakete mindestens 14 Tage alt sind. Lizenz MIT.
  - **Begründung:**
    - Layout mit Flexbox (Yoga) statt Koordinaten.
    - **Eingebettete TTF-Schriften mit Subsetting ohne Zusatzpaket.** pdf-lib bräuchte dafür zusätzlich `@pdf-lib/fontkit`.
    - SVG für Monogramm und Wortmarke, dazu Links, JPEG und PNG.
    - Das Paket steht in Next 16 bereits auf der Liste `serverExternalPackages`, `next.config.js` muss also nicht geändert werden.
- Ohne neues Paket genutzt: `qrcode` (QR als PNG), `sharp` (Bilder), `zod`.

### Versand, Postausgang, Produktion
- **Dev/Labs (Standard):** Keine Mail verlässt den Rechner.
  - Jeder Auftrag landet in `.data/stilfinder/outbox/<id>/` mit `moodboard.pdf`, `mail.html`, `mail.txt` und `meta.json` (Empfänger, Angaben, Newsletter-Wunsch, Zeiten, Produkt-IDs, Renderer).
  - Die Antwort enthält `preview` → `/api/labs/stilfinder/postausgang/<id>`. Das gibt es nur außerhalb von Produktion, die ID ist 96 bit zufällig.
- **Produktion: vorbereitet, aber nicht aktiv.** Echter Versand braucht `STILFINDER_MAIL_ENABLED=1` **und** einen vollständig konfigurierten Anbieter:
  - `STILFINDER_MAIL_PROVIDER=resend` mit `STILFINDER_MAIL_API_KEY` und `STILFINDER_MAIL_FROM` (PDF als Anhang)
  - `…=postmark` mit Server-Token und From (Anhang, `TrackOpens:false`, `TrackLinks:None`)
  - `…=webhook` mit `STILFINDER_MAIL_WEBHOOK_URL` und `STILFINDER_MAIL_WEBHOOK_SECRET` (HMAC-SHA256 im Header `X-Stilfinder-Signature`, z. B. für n8n oder ein eigenes SMTP-Relay)
  - Optional: `STILFINDER_MAIL_BCC` schickt eine Kopie ans Studio, aber nur mit Rechtsgrundlage. `STILFINDER_PDF_PUBLIC=1` entfernt den Labs-Hinweis zu den Bildrechten; erst nach Freigabe durch die Hersteller setzen.
  - Fehlt in Produktion ein Teil der Konfiguration, antwortet die Route mit **503 `mail_unavailable`**. Ein falsches „gesendet“ gibt es nie.
  - Vor dem Einschalten nötig: AVV mit dem Mailanbieter, Eintrag im Verarbeitungsverzeichnis, Absender-Domain mit SPF, DKIM und DMARC.
  - **Newsletter im Livebetrieb:** an den bestehenden Double-Opt-in-Weg anschließen (Brevo, Rechtspaket 4.4: Protokoll von Zeit, Bestätigung und Einwilligungstext). Das geschieht erst nach Freigabe; heute ist es bewusst nicht verdrahtet.

### Validierung, Rate-Limit, Speicherfrist
- Reihenfolge der Prüfungen:
  1. Same-Origin, sonst 403.
  2. `guardForm`:
     - Limit je IP: **3 erzeugte PDFs / 10 min** und **15 Anfragen / 10 min**.
     - Body ≤ 4 KB.
     - Honeypot und Zeitfalle führen zu einem stillen Schein-Erfolg.
     - zod-Allowlist.
  3. **Je E-Mail-Adresse 3 / 24 h.** Der Schlüssel ist ein SHA-256-Hash, die Adresse liegt nie im Klartext im Speicher.
  4. **Höchstens 2 gleichzeitige Builds**, sonst 503 `busy` mit `Retry-After: 15`.
- Schema:
  - E-Mail nach HTML5-Regel, höchstens 254 Zeichen.
  - Name nur aus Buchstaben (inkl. ç/ë), Leerzeichen und `.'’-`, höchstens 80 Zeichen.
  - Vorhaben und Region nur aus den Listen.
  - Dazu Profil-Slug und Antwort-Code `[0-4x]`. Ein Antwort-Code, der auf ein anderes Profil zeigt, wird ignoriert.
- Die Zähler liegen im Speicher des Prozesses, wie in `forms/rateLimit.js` (pm2 `instances: 1`).
- **Speicherfrist:**
  - Produktion: PDF und Angaben liegen nur während des Versands im Arbeitsspeicher, **gespeichert wird nichts**. Beim Mailanbieter gilt dessen Log-Frist; sie wird im AVV festgelegt.
  - Dev-Postausgang: **7 Tage**, höchstens 30 Einträge. Abgelaufene Einträge werden bei jedem neuen Eintrag gelöscht. Ab dem Ablauf liefert die Vorschau sie nicht mehr aus.

### Leistung
- Budget:
  - Katalog: 4 s je Marke, Next-Datencache 1 h.
  - Bilder: zusammen 5,5 s; je Bild 4 s, 6 parallel. Was danach fehlt, wird Platzhalter.
  - PDF: höchstens 15 MB, sonst Fehler.
- **Gemessen außerhalb des Dev-Servers** mit echtem Katalog (Produktions-Backoffice, nur GET), alle fünf Profile: **3,2–4,4 s** je PDF, **1,6–2,5 MB**, 28 Seiten, 20 von 20 Bildern. Im Unit-Test offline etwa 3 s je Profil.
- **Auf dem gemeinsamen Dev-Server** (ein Node-Prozess mit rund 12 GB, parallele HMR anderer Teams, stark ausgelastet):
  - Vorher: Das Rendern im Hauptprozess dauerte 22–47 s und blockierte alle anderen Anfragen.
  - Jetzt rendert das PDF in einem **Worker-Thread**: 3,7 s fürs Rendern, 9,7 s gesamt im Dev.
  - Hinweis: Turbopack schreibt ein wörtliches `new Worker(…)` um, was zu `__dirname is not defined` führt. `pdfPool.js` nutzt deshalb `Reflect.construct`.

### Tests
- `node --test tests/unit/stilfinder-pdf.test.mjs` (13 Tests):
  - Echtes PDF je Profil, offline erzeugt: **≥ 20 Seiten (28)**, Seitenplan = Seiten im PDF, < 10 s, < 15 MB, alle Bilder eingebettet.
  - Auch ohne Katalog hat das PDF ≥ 20 Seiten. Die Schriften sind eingebettet.
  - Produktauswahl ohne Dubletten und reproduzierbar. Nach Ablauf der Frist erscheinen Platzhalter. Bild-Allowlist.
  - Schema: nur die E-Mail ist Pflicht, Newsletter ist `false`, im Client gibt es keine vorangekreuzte Checkbox.
  - Mail-Modus. Mail-HTML ohne `<img>`, Eingaben escaped, mit KI- und DOI-Hinweis.
  - Postausgang mit Frist, Limit je Adresse.
- `npx playwright test stilfinder-pdf.spec.js --project=desktop`:
  - Formular auf Desktop und im iPhone-Viewport. Der POST wird per `page.route` beantwortet, **gesendet wird nichts**.
  - API: 400, 403, 404.
- Manuell (Dev, Postausgang): Playwright auf iPhone 15 Pro (**WebKit**) und Desktop (Chromium). Belege in `qa-screenshots/erlebnis/stilfinder/selbst/` (Unterordner `interact/`).

### Offen
- **Inhaber/Recht:**
  - Bildrechte der Herstellerabbildungen im PDF (heute steht der Labs-Hinweis auf jeder Bildseite)
  - Freigabe der KI-gestützten Texte
  - Mailanbieter und AVV
  - Newsletter-Anbindung mit DOI-Protokoll
  - Datenschutzerklärung um „Stil-Finder PDF“ ergänzen
  - Café-Öffnungszeiten (heute stehen nur die des Showrooms im PDF)
- `/de/beratung?stil=<slug>` (Ziel des Termin-QR) wertet den Parameter noch nicht aus. Die Datei gehört nicht zu unserem Team.
- Die Kategorie „kitchen“ kommt nur von Poliform. Für die „Steinküche (Binni)“ gibt es noch keine Katalogprodukte.
- Fontsource-Bodoni ist die Standard-Instanz der `opsz`-Achse. Für sehr große Titel wäre eine `opsz 96`-Instanz feiner.

### QA Runde 1 – Fixes (27.10.2026, Bericht `qa-screenshots/erlebnis/stilfinder/feedback-1.md`)
Belege: `qa-screenshots/erlebnis/stilfinder/fix1/` (Geräte-Screenshots, `form-*.png`, `axe-ergebnis.json`, gerenderte PDFs `pdf-*/pNN.png`, `sheet-*.png`, `info.json` mit Links und Lesezeichen).

**Neues PDF (33 Seiten):** Titel, Inhalt (verlinkt), Einleitung, Analyse, **Moodboard-Doppelseite** (Collage randabfallend: Profil-Raumbild, 4 Katalogstücke, 3 Materialfotos; rechts Stichworte, Zitat, Palette als Kreise), Palette, 60/30/10, **Materialwelt als 4 Seiten mit Materialfoto** (Farbe nur noch als Streifen), Raum für Raum (Hero randabfallend), 2 Seiten Kombinationen als Collagen, Licht (eigene, sonst ungenutzte Leuchte), Pflege, Planung (je Detailbild), Showroom-Kapitel mit randabfallendem Foto, Termin, Hinweise, Rückseite. PDF-Lesezeichen je Kapitel, Inhaltsverzeichnis und Raumliste als interne Links, `tel:`/`mailto:`/https-Links.

**Bild-Tor und Cache (P1.1):**
- `build.js curateRooms`: Kandidaten je Raum (Kuratoren-Picks + Slots, bis 12), Bilder in bis zu 3 Wellen im Budget 5,5 s; fehlende oder abgelehnte Bilder werden durch das nächste Stück ersetzt.
- Unter **16 von 20** Bildern → `ImageGateError` → Route **503 „busy“** mit Retry-After. Nie ein Platzhalter-PDF. `IMAGE_GATE` in `config.js`.
- Plattencache `.data/stilfinder/img-cache/<sha1>.jpg|json` (verkleinerte JPEG + Analyse, TTL 7 Tage, max. 3000), gemeinsam für Hauptprozess und Worker. `warm.js warmProfile()` lädt die Kandidaten eines Profils vor: per `after()` beim Aufruf der Ergebnisseite und nach jedem PDF; startet dabei auch den PDF-Worker vor.
- Katalogzeilen 10 min im Speicher; `timings.catalog` steht jetzt in `meta.json` (dazu `worker`, `service`, `imageWaves`).

**Kuratierung (P1.4):** `rooms.js`: `CURATOR_PICKS` je Profil/Raum (am 27.10. per Kontaktbogen gegen die Palette geprüft), Hero nur Sofa/Lounge, Esstisch, Küche, Bett (Outdoor auch Gartentisch), höchstens 1 Accessoire je Raum, nie vorne; Füllstücke (`FILLER_NAME`: Chopstick, Lazy Susan, Kerzenhalter, Umbrosa Bases …) und Kampagnenbilder ohne Produkt (`CAMPAIGN_ONLY`: Soft Stone Sofa, Corker) nie. `imageStats.js`: Produktfarben ohne Hintergrund, **Anteil palettenfremder Farbe (ΔE CIE76 > 25) > 18 % → verworfen** (gilt nicht für Kuratoren-Picks), Bedeckung < 3 % (leere Strichleuchte) oder Kontrast < 6 → verworfen. Hinweis: CIEDE2000 wurde getestet, liefert bei 25 aber kaum Treffer (Türkis gegen Taupe nur 24) – deshalb CIE76 wie im QA-Bericht.

**Bildrahmen (P1.5/P1.6):** fester Rahmen je Seite (Auswahl 4:5, oben bündig; 4:3 nur wenn die Mehrheit Minotti-Querformate sind). Szenen `cover`. Freisteller: weißer Rand per `sharp.trim` entfernt und Weiß per Multiplikation auf Papierton #f7f5f1 gebracht, 12 % Luft. **Minotti (`PROTECTED_BRANDS`) wird nie beschnitten oder getönt:** contain auf Tonfläche, Raum-Hero als randabfallendes Querformat über 62 % der Breite. Kombinationen: 3:4 + zwei 1:1 (Szene vorne), bei Minotti-Querformat Querformat + zwei 4:3.

**Materialfotos (P1.3):** Katalog und Showroom liefern noch keine Mustermotive, daher CC0-Texturen von **ambientCG.com** (Lizenz CC0 1.0, Quelle trotzdem im PDF genannt). 21 Motive in `src/lib/stilfinder/materials/*.jpg` (720 × 900, zusammen 1,6 MB), erzeugt mit `materials/make-materials.mjs` (Zuschnitt, Streiflicht; Messing, Samt per Einfärbung). Zuordnung `materials.js PROFILE_MATERIALS`, Vorschau auf der Webseite `components/Labs/Stilfinder/materialImages.js` (synchron halten). Sobald Showroom-Fotos echter Muster da sind, Dateien tauschen.

**P2:** Abstand Titel → Text einheitlich 18 pt, Bodoni-Zeilenhöhe 1,12; TOC auf gemeinsamer Grundlinie; Palettentext nach WCAG-Kontrast (`palette.js textOn`, Ergebnisseite `profiles.js onColor`, `opacity-90` entfernt; axe auf der Ergebnisseite: 0 Verstöße); Produktnamen mit „…“ (`build.js typoQuotes`); Einleitung: wiederholter Absatz ersetzt durch einen Satz aus Vorhaben/Region (`content.js personalLine`) + Bild 3:4 rechts unten; Showroom-Trenner mit Foto, ohne Messing-Haarlinie, Text auf dem 52-pt-Raster; Formular zeigt nach 8 s „Fast fertig – wir setzen die Bilder.“, Button „Wird gesetzt …“.

**Datenschutz-Wortlaut (P2.4) – bitte anwaltlich prüfen:** Formular, PDF (`document.js PRIVACY_PDF`) und Mail (`mail.js PRIVACY_MAIL`) sagen jetzt gleich: „Ihre Angaben verwenden wir nur für diesen Versand und speichern sie danach nicht.“ Im Testbetrieb (nicht Produktion) steht in Formular und PDF zusätzlich der 7-Tage-Testpostfach-Hinweis. Mail-Fußzeile mit Firmenwortlaut „MW Immobilienverwaltungs GmbH“ und Impressum-Link (Pflichtangaben im geschäftlichen E-Mail-Verkehr – prüfen).

**Messung (gemeinsamer Dev-Server, Postausgang):** PDF-Bau 3,2–5,9 s (Bilder 0,6–2,9 s aus dem Cache, Rendern 1,6–3,8 s), 20–21 von 20 Bildern, 2,1–2,8 MB. Die HTTP-Zeit lag bei 10–11 s; der Rest ist Dev-Kompilierung der Route und ein kalter Worker-Start (3,5 s), den `prewarmWorker()` jetzt beim Aufruf der Ergebnisseite vorzieht. Offline (gleicher Code, ohne Next) 2,1–4,6 s je PDF.

**Tests:** `tests/unit/stilfinder-pdf.test.mjs` jetzt 21 Tests, u. a. Bild-Tor (Timeout aller Bilder → `ImageGateError`, Ersatz in 2. Welle), Plattencache, Kuratierungsregeln, Farb-/Leer-Prüfung, Anführungszeichen, Datenschutz-Gleichlaut, Kontrast 4,5:1. `stilfinder-pdf.spec.js` (desktop) 5/5 grün.

**Offen nach Runde 1:**
- P3.7 iPad-Konsolenfehler „state update on a component that hasn't mounted yet“: in fix1 nicht reproduziert. Ursache vermutlich `src/components/Labs/motion.js` (`setReady` im LazyMotion-Loader-Promise) – gemeinsame Datei, nicht im Dateibereich dieses Teams.
- Kuratoren-Picks sind Docnames; ändert das Backoffice Namen, greift der Algorithmus (mit Farbprüfung). Bei neuen Kampagnenbildern `CAMPAIGN_ONLY` pflegen.
- Herkunft der Titelbilder Seeterrasse, Pariser Salon, Klare Linie (Herstellerbilder ohne bekannten Hersteller) vor öffentlicher Nutzung bestätigen (`build.js HERO_CREDITS`).
- Echte Muster-/Showroomfotos statt CC0-Texturen.

### QA Runde 2, zweiter Durchgang – Fixes (28.10.2026, Bericht `qa-screenshots/erlebnis/stilfinder/feedback-2.md`)
Belege: `qa-screenshots/erlebnis/stilfinder/fix2/r3/` (alle 5 PDFs mit echtem Katalog: `pdf-*/moodboard.pdf`, `pNN.png`, `sheet-a…d.png`, `info.json`; Auswahl `selection.json`, `build.log`; Ergebnisseiten `web/`). Die älteren Dateien direkt in `fix2/` stammen aus Runde 2 und sind überholt.

**P1 Hinweise-Seite (S. 32):** Bildnachweis ohne Dateinamen. Statt der Dateinamen steht dort eine Sammelzeile: „Einleitungsbild und Raumszenen S. 3, 14, …: Website-Archiv Platzhirsch, Herstellerbilder; Hersteller vor öffentlicher Nutzung bestätigen.“ (`document.js archiveCreditLine`). Auch Titelbild- und Szenen-Vermerke (`build.js HERO_CREDITS`, `ARCHIVE`) nennen keine Dateien mehr. Die Dateinamen stehen jetzt in `meta.json` unter `imageFiles`. Der KI-Block (Art. 50) steht in der mittleren Spalte unter „Datenschutz“. Test `stilfinder-r3`: Er liest den Inhaltsstrom von S. 32 aus und prüft für alle 5 Profile im Fall mit den meisten Archivszenen, dass keine Textzeile ab 8 pt unter die Oberkante der Fußzeile reicht. Gegen das alte Salon-PDF schlägt der Test an (564 > 557 pt).

**P2.1/2.2 Raumszenen:**
- `build.js ROOM_SCENES` hat jetzt eine Szene für jedes Profil und jeden Raum (25 Einträge). Am 28.10. per Kontaktbogen ausgewählt: keine Minotti-Bilder, keine erkennbaren Tom-Dixon-Szenen (`Licht4`/`Licht3` ersetzt), jedes Profil mit eigener Outdoor-Szene. Die Einleitung bei Warme Moderne zeigt die Plaid-Szene statt Tom Dixon.
- `document.js leadLayout` legt das Layout fest:
  - Szenen-Hero: das Bild läuft randabfallend.
  - Minotti-Querformat: Bildband über die Seitenbreite.
  - Freisteller: Raumszene mit Einschub. Der Einschub liegt bündig unten an der Innenkante, auf Papierton #f7f5f1, mit 0,5-pt-Haarlinie `line` und 8 pt Innenabstand. Querformatige Stücke bekommen einen breiten Einschub, die übrigen einen hohen.
- Unter 35 % Bedeckung fällt der Einschub weg (`fill` wird nach dem Zuschnitt in `images.js toneToPaper` gemessen). Dann zeigt die Leitseite nur die Szene, und das Stück eröffnet die Auswahlseite, die dann 4 Spalten hat. Die Seitenverweise passen sich an.
- Szenen tragen das Etikett „Raumstimmung“. „Im Bild“ heißt jetzt „Im Bild: das Stück im Einschub“.

**P2.3 Kuratierung:** `rooms.js fitsVisible`:
- je Raum 1 Stück pro Kategorie (der Hero zählt mit) und höchstens 2 Stücke pro Marke;
- Schlafen in der Reihenfolge Bett → Nachttisch → Leuchte/Spiegel → Schrank (`ROOM_SEQUENCE`);
- kein Essen-Hero, dessen Name auf Bistro, Bar, Square, Side oder kleine Maße deutet (`HERO_NAME_DENY.essen`). Salon zeigt deshalb den Bodega Rectangular statt Declan;
- kleine Stücke (Spiegel, Deko, Kerzen, Küchenzubehör, Bettwäsche) nur als Freisteller, nie als Szene (`SMALL_IN_SCENE`). Cypris ist gestrichen;
- Freisteller mit weniger als 8 % Bedeckung werden verworfen (weißes Stück auf Weiß, z. B. Mac Outdoor);
- die Slots je Raum sind auf mehrere Marken verteilt;
- `curate.js` lädt nur noch Kandidaten, die zu den Regeln passen, in bis zu 4 Wellen;
- Außenleuchten kommen nicht in Innenräume.

**P2.4 Licht:** Die Lichtseite wählt in dieser Reihenfolge: zuerst eine eigene Leuchte (Ersatzleuchten `roomCandidates()[LIGHT_KEY]`, Salon fest Chandelier Maranello über `LIGHT_PICKS`), dann eine Leuchte aus der Auswahl mit „Aus Ihrer Auswahl: Raum, Seite“, dann die Lichtszene `LIGHT_SCENE`. Der dunkle Block bleibt die letzte Notlösung, dann mit Materialfoto.

**P2.5 Outdoor:** Die Farbprüfung gilt bei Outdoor auch für Stücke der Kuratoren. Der Salon-Text passt jetzt zu den Stücken („Schmiedeeisen in Schwarz, helle Polster …“), und der Salon hat eine eigene Szene (Provence-Terrasse).

**P2.6 Web-Moodboard:**
- Die große Kachel zeigt die Raumszene eines Raum-Heros in der Reihenfolge Wohnen → Schlafen → Essen → Outdoor → Küche. Beim Salon ist das jetzt das Tréca-Bett in Bordeaux.
- Die breite Kachel nimmt nur eine Szene im Querformat. Gibt es keine, kommen 2 quadratische Kacheln, damit das Raster geschlossen bleibt (Feld `tile`).
- Küchen-Hero je Profil: Ruhe Phoenix, Seeterrasse Artex Pro, Salon Alea Pro, Klare Linie Twelve, Warme Moderne Harp.
- P3.4 umgesetzt: Im PDF-Moodboard bekommen die hohen Kacheln die Bilder mit der größten Bedeckung.

**P2.7 Tempo:**
- In `meta.json timings` stehen jetzt `queueMs` (Worker übernimmt den Auftrag) und `returnMs` (Ergebnis kommt im Hauptthread an).
- Das Vorwärmen (`warm.js`) wartet, solange ein Auftrag läuft, und hält beim Absenden an (`orderStarted/orderFinished`, `warmImages shouldStop`).
- **Messung ohne Dev-Kompilierung:** gleicher Ablauf wie `service.js` mit echtem Worker (`pdfPool`) und Live-Katalog über GET, kein Build im Repo. Ergebnis: **2,6–4,4 s** beim ersten Abruf je Profil, **1,3 s** mit Katalog-Cache. Das liegt unter 10 s, also kein P1.
- Auf dem Dev-Server (28.10., 3 Aufträge im Postausgang): HTTP 8,9–18,4 s, `queueMs` 5–9 ms, `returnMs` 0,3–0,7 s. Den Rest machen neue Kandidatenbilder aus (Salon: 9 s Download, kalter Cache) und die CPU-Last des gemeinsamen Dev-Servers (Rendern 3–5 s statt 1,3 s).

**P3:** P3.4 umgesetzt (siehe oben), P3.5 Überschrift „Ihre persönliche Präsentation – über 20 Seiten.“ P3.6 (`scroll-mt-24`) und P3.7 (`onError`-Fallback) waren schon umgesetzt. Weiter offen sind P3.1 (Termin-Seite), P3.2 (Kombinationen S. 24) und P3.3 (Materialfotos).

**Tests:** `tests/unit/stilfinder-r3.test.mjs` hat 8 Tests (Fußzeile S. 32, keine Dateinamen, randabfallende Leitseiten und Einschub ab 35 %, Szenen ohne Fremdmarken und Outdoor je Profil, Kategorie- und Markenregeln, Lichtseite, Web-Kacheln und Küchen-Heros, Vorwärmen und `queueMs`). Alle Stil-Finder-Unit-Tests sind grün (52/52), die ganze Unit-Suite ebenfalls (938 grün, 4 übersprungen).

**Offen / Inhaber:**
- **Archivszenen ohne bestätigte Herkunft:** Jede Raumszene stammt aus dem Website-Archiv, ihr Hersteller ist unbekannt. Die Liste steht in `build.js ROOM_SCENES`, `INTRO_IMAGES` und `LIGHT_SCENE` und pro PDF in `meta.json imageFiles`. Vor öffentlicher Nutzung bestätigen.
- Das Salon-Titelbild (`profiles.js`, Licht5) zeigt weiter erkennbar Tom Dixon. Das Titelbild von Warme Moderne ist ebenfalls Tom Dixon. Freigabe oder Tausch entscheidet der Inhaber.
- In 1–3 Räumen je Profil bleiben nur 3 Stücke, weil die Kategorie- und Markenregeln und die Farbprüfung keinen weiteren Kandidaten zulassen (z. B. Salon: Küche und Schlafen, Klare Linie: Essen und Küche). Dort steht dann die Karte „Mehr im Studio“. Abhilfe: weitere Kuratoren-Picks setzen.
- Die Kategorie „kitchen“ kommt weiter nur von Poliform.

### Abnahme Runde 3 – Restliste (28.10.2026, Team „Stil-Finder Restliste“, Bericht `qa-screenshots/erlebnis/stilfinder/abnahme.md`)
Belege:
- `qa-screenshots/feinschliff/stilfinder/pdf/`: alle 5 PDFs mit echtem Katalog (nur GET, Bilder über den Plattencache) als `pdf-*/moodboard.pdf`, dazu `pNN.png`, `sheet-a…d.png` und `info.json`, die Auswahl in `selection.json` und `build.log`.
- `qa-screenshots/feinschliff/stilfinder/selbst/`: Quiz und Ergebnisseiten auf 4 Geräten, dazu `report.json`.

Jede PDF-Seite aller 5 Profile haben wir angesehen.

**Restliste 1 – Szenen-Regel (Teil von P2.3):** Wie viel Fläche ein Stück in einer Raumszene einnimmt, lässt sich nicht messen. Die Saliency von `sharp` haben wir getestet und verworfen: Sie wählt Fenster und Grün, nicht das Stück. Die Regel geht deshalb über die Kategorie:
- Für `curate.js SCENE_DETAIL` gilt ein Auswahlbild nur als Freisteller. Dazu gehören Couch- und Beistelltisch, Nachttisch, Sideboard, Vitrine, Barhocker, Leuchte, Kleinmöbel und Lowboard.
- Ist das erste Katalogbild eine Szene, prüft `loadFor` bis zu 3 weitere Bilder **derselben Bildfamilie** (`altImages`). Zur Familie gehört ein Bild, wenn sein Dateiname ohne laufende Nummer in den ersten drei Wörtern übereinstimmt. „vase-10.jpg“ unter Bow Coffee Table zählt also nicht, ebenso wenig der Arc-Esstisch unter Drop Chandelier.
- Genommen wird der erste Freisteller mit mindestens 8 % Bedeckung. Die Web-Kachel zeigt dasselbe Bild (`it.shown`, `catalog.js toTile`).
- Ohne Freisteller fällt das Stück weg. Es gibt zwei Ausnahmen:
  - Kuratoren-Picks, die per Auge geprüft sind (z. B. Rialto Comodini, Drop Chandelier Brass).
  - Die **letzte Reserve** (`lastResort`): Ein Raum fiele sonst unter 3 Stücke. Das hält auch das Bild-Tor ein.
- Ergebnis im echten Katalog:
  - Jetzt als Freisteller: Bow Coffee Table No. 4 (42 % Bedeckung), Alambra Barversion (13 %), Nachttisch Joséphine (13 %).
  - Ersetzt: Superquadra (Minotti, nur Szenen), Bell Side Table, Rivoli Table und Drop Chandelier Mini.
- `warm.js` wärmt diese Zusatzbilder mit vor.
- Laufzeit offline: Der erste Lauf mit kaltem Cache dauert bis zu 24 s (Italienische Ruhe), mit Cache 5–9 s je Profil.

**Restliste 2 – keine leere Kachel „Mehr im Studio“:**
- `document.js selectionGrid` richtet die Spalten nach der Zahl der Stücke:
  - 4 Spalten, wenn der Hero auf der Auswahlseite steht, sonst 3.
  - Bei 2 Stücken zwei große Rahmen, höchstens 330 pt hoch.
  - Bei 1 Stück der Rahmen und daneben ein Hinweis als Text, keine Platzhalter-Kachel.
- `curateRooms`: Hat ein Raum weniger als `MIN_PIECES` = 3 Stücke, darf er ein drittes Stück derselben Marke zeigen. Das gilt nach zwei Wellen oder sobald kein anderer Kandidat mehr passt. Beispiel: Pariser Salon, Essen, mit dem Chandelier Prati von Eichholtz.
- Klare Linie, Essen: Die Flos-Leuchten bedecken als Freisteller weniger als 8 %. Deshalb gibt es zwei weitere Slots: `Rimadesio|sideboards-chests,display-cabinets` und `Desalto|small-furniture`.
- Stand mit echtem Katalog: Jeder Raum aller 5 Profile hat 3–4 Stücke. Die Karte „Mehr im Studio“ kommt nicht mehr vor.

**P3.1 Termin-Seite (S. 31):** Unter den Kontaktdaten stehen jetzt drei Schritte (`TERMIN_STEPS`):
1. Termin wählen
2. Gespräch im Studio
3. Weiterplanen, mit Verweis auf die Planungsseite

Darunter folgt ein Band mit den vier Materialfotos des Profils. Der CC0-Vermerk steht in der Fußzeile. Neue Tatsachenbehauptungen gibt es nicht: Probesitzen, Bezüge vergleichen und Muster stehen schon auf der Showroom-Seite.

**P3.2 Kombinationen (S. 24):**
- Die erste Kombination läuft rechts randabfallend über die volle Seitenhöhe (`ComboColumn`, 430 pt breit).
- Oben steht das Leitbild auf 60 % der Höhe, darunter zwei Stücke.
- Ein Minotti-Querformat behält sein Seitenverhältnis.
- Die Fußzeile steht schmal links (`Frame` mit `footRight`).
- Eine Teppich-Szene führt eine Collage nur noch an, wenn es keine andere Szene gibt.

**P3.3 Materialwelt:**
- Jede der vier Seiten hat ein eigenes Layout (`MATERIAL_LAYOUTS`):
  - Holz: Foto links randabfallend
  - Stein: Foto rechts randabfallend
  - Textil: Foto über die volle Breite mit Papierkarte
  - Metall: „Musterbrett“ mit dem Materialfoto und den zwei Palettentönen als Musterkarten
- Samt Bordeaux hat jetzt einen Faltenwurf mit Glanz auf den Graten:
  - Er entsteht in `make-materials.mjs` aus derselben CC0-Textur Fabric082A (Option `folds`, SVG-Lichtfilter, deterministisch).
  - Der Helligkeitskontrast (Standardabweichung) stieg von 4,3 auf 24.
  - Neu erzeugen mit `node src/lib/stilfinder/materials/make-materials.mjs <ambientCG-Ordner> samt`.
  - Der Bildnachweis lautet jetzt „zugeschnitten, belichtet und teils eingefärbt“.

**P3.5 Licht:** `rooms.js fitsRoom` lässt In Vitro (Flos-Außenlaternen, auch „Unplugged“) weder in Innenräume noch auf die Lichtseite. Die Lichtseite von Warme Moderne zeigt jetzt Pochette Up-Down.

**P3.6 KI-Button mobil:**
- Unter `md` hält der Textblock des Quiz-Intros rechts den Abstand `var(--ph-concierge-h, 0px)`.
- Die Variable setzt der Concierge selbst auf 64 px, solange er sichtbar ist. Ohne Concierge ist der Abstand 0.
- Den Concierge selbst haben wir nicht geändert.

**Bilder ohne geklärte Herkunft (bis zur Freigabe neutralere Bilder):**
- Titelbild Warme Moderne: `Team/unique-workplace.jpg` statt `UberUns/tomdixon.webp`.
- Titelbild Pariser Salon: `Home/download.jpg` statt `Licht/bannerImageLicht5.jpg`.
- Beide neuen Titelbilder erscheinen auch als Hero der Ergebnisseite.
- Quiz-Intro: das Showroom-Foto `UberUns/living.jpg` statt der goldenen Pendelgruppe `Licht/bannerImageLicht4.jpg`.
- `HERO_CREDITS` nennen Tom Dixon nicht mehr.

**Tests:** `tests/unit/stilfinder-restliste.test.mjs` hat 9 Tests. Sie prüfen:
- Bildfamilie
- Freisteller statt Szene, letzte Reserve und drittes Stück einer Marke
- Raster ohne leere Kachel
- Termin-Seite: Text und Materialband in der unteren Hälfte, gelesen aus dem Inhaltsstrom
- Kombinationsbilder über mehr als 80 % der Seitenhöhe
- vier Material-Layouts
- Samt-Kontrast
- In-Vitro-Ausschluss
- Concierge-Abstand
- keine Tom-Dixon-Titelbilder

Ergebnis: alle Stil-Finder-Unit-Tests grün (61/61), E2E `labs-stilfinder.spec.js` und `stilfinder-pdf.spec.js` grün (7/7, `PW_WORKERS=1`).

Sichtprüfung KI-Button: Der Dev-Server war beim Prüflauf überlastet (Timeouts bei den Chunks), und der Concierge wurde nicht eingeblendet. Belegt ist nur, dass `--ph-concierge-h` = 64px gesetzt war, solange der Concierge geladen war. Die Prüfung auf dem iPhone bei sichtbarem Button steht noch aus (Skript-Beleg `selbst/ki-button-iphone.png`).

Geändert: Test P2.1 in `stilfinder-kuratierung.test.mjs` beachtet jetzt den Modus „scene-only“. In diesem Modus steht der Hero auf der Auswahlseite. Das Layout ist seit Runde 3 so gebaut; der Test hatte diesen Fall bisher nur nie getroffen.

**Offen:**
- Inhaber: die Inhaber-Frage unten.
- Anwalt (unverändert): Datenschutz-Wortlaut, Pflichtangaben in der Mail, Firmenbuchnummer und UID im PDF-Impressum.
- Außerhalb des Dateibereichs dieses Teams: Der Cookie-Banner verdeckt Footer-Links (axe `target-size`).
- P3.4 (Bistrotisch als Küchenstück) ist vertretbar und bleibt unverändert.
- Die alten Dateien in `fix2/` müssen weiter von Hand aufgeräumt werden.

#### Inhaber-Frage: Herkunft der Archivbilder (bitte entscheiden)
Der Stil-Finder nutzt die folgenden Bilder aus `public/Images`. Bei keinem ist der Rechteinhaber bekannt; `Marktresearch/recht/bildrechte.csv` führt sie als „Herstellerbild oder eigene Aufnahme – unbekannt“. Bitte je Datei entscheiden: eigene Aufnahme, Herstellerbild (welcher Hersteller, Nutzung freigegeben?) oder tauschen.

| Verwendung | Dateien |
|---|---|
| Raumszenen im PDF (`build.js ROOM_SCENES`) | `Home/Rimadesio-Modulor-1.jpg`, `UberUns/Rimadesio-Modulor.jpg`, `Wohnen/bannerImage1/3/6/7/8/9.jpg`, `Home/Poliform-Kitchen.jpg`, `Home/bannerImage-1.jpg`, `Home/bannerImage-2.jpg`, `Home/thidImage.jpg`, `Kuche/bannerImageKuche1/2/3.jpg`, `Licht/bannerImageLicht1.jpg`, `UberUns/indoor.jpg`, `Outdoor/bannerImage1/2/3/4.jpg` |
| Einleitungsbilder (`INTRO_IMAGES`) | `Accessories/bannerImageAccessories1/3.jpg`, `Outdoor/bannerImage3.jpg`, `Licht/bannerImageLicht2.jpg`, `Wohnen/bannerImage1.jpg` |
| Lichtszene (`LIGHT_SCENE`) | `Home/bannerImage-2.jpg` |
| Titelbilder (`profiles.js`) | `Home/aboutHome.jpg` (Showroom), `Home/bannerImage-3.jpg` (Poliform-Küche mit Esstisch, seit Feinschliff), `Outdoor/bannerImage5.jpg`, `Home/download.jpg`, `Wohnen/bannerImage2.jpg` |
| Erkennbar Tom Dixon | `UberUns/tomdixon.webp`, `Licht/bannerImageLicht4.jpg`, `Licht/bannerImageLicht5.jpg`. Auf Titelbild und Intro sind sie **nicht** mehr zu sehen, als **Antwortbilder im Quiz** aber weiterhin (`questions.js`: „Tafel unter Olivenbäumen“, „Salon mit Geschichte“, „Goldenes Glühen“). |

Fragen an den Inhaber:
1. Dürfen wir die Tom-Dixon-Bilder verwenden, obwohl Platzhirsch die Marke nicht im Katalog führt? Wenn ja, setzen wir die alten Titelbilder wieder ein. Wenn nein, tauschen wir auch die drei Quiz-Antwortbilder.
2. Welche Archivszenen sind eigene Aufnahmen? Bei diesen Bildern entfällt der Vermerk „Hersteller vor öffentlicher Nutzung bestätigen“ (`build.js ARCHIVE_CREDIT`, `document.js archiveCreditLine`).
3. Gibt es Showroom-Fotos echter Muster (Samt, Messing, Stein)? Dann ersetzen sie die CC0-Texturen.

### Feinschliff (QM-Feedback 28.10.2026, `qa-screenshots/feinschliff/stilfinder/feedback.md`)

**P2.1 – KI-Button-Abstand**
- `StilfinderQuiz.js`: Intro-Block `data-sf-ki-gap` mit `max-md:pr-[calc(var(--ph-concierge-h,0px)*1.25)]`, also 80 px. Ohne Concierge bleibt der Abstand 0. `--ph-concierge-h` ist die Höhe des Buttons (64 px), der Button selbst ist etwa 75 px breit.
- Neuer Messtest `tests/e2e/stilfinder-ki-abstand.spec.js` (statt Regex). Er läuft nach „Weiter ohne Einwilligung“ mit den Viewports von Pixel 7 und iPhone 15 Pro (Chromium-Emulation im Projekt desktop). Geprüft wird, dass die rechte Kante jedes Text-Rects und jedes Links oder Buttons im Block ≤ der linken Kante von `[data-concierge-launcher]` ist. Ergebnis 2/2 grün.
- Beleg-Screenshots bei sichtbarem Button: `fix2/ki-abstand-pixel-7.png`, `fix2/ki-abstand-iphone-15-pro.png`. Aufruf: `SF_KI_SHOTS=<ordner>`.

**P3**
- **P3.1 Licht:**
  - `rooms.js LIGHT_PICKS`: Warm nimmt Taraxacum 88 Suspension 1, Klar nimmt Belt. Ein Pick ist für die Lichtseite reserviert, kein Raum kann ihn vorher nehmen.
  - `LIGHT_MATCH`/`lightFits` sortiert die Ersatzleuchten nach dem Lichttext. Das gilt in `roomCandidates`, in `curate.js pickLamps` und in `document.js` (Modus reuse).
  - Der Warm-Text lautet jetzt „Pendelleuchten mit weich streuendem Schirm aus Opalglas, Stoff oder Kokon“.
- **P3.2 Restplätze:**
  - `ROOM_ALLOWED.kueche` erlaubt nur noch Küche, Barhocker und Leuchte, also auch keinen Ess- oder Bistrotisch mehr.
  - `ROOM_ALLOWED.schlafen` erlaubt Bett, Nachttisch, Schrank, Spiegel, Textil und Leuchte.
  - `TRAY_NAME` und `kitchen-accessories` sind nie ein Raumstück. Die toten Slots sind entfernt.
  - Dadurch zeigen Küche und Essen teils 2 Stücke in großen Rahmen. Der Unit-Test verlangt deshalb ≥ 18 statt ≥ 20 Stücke.
- **P3.3 Kleine Freisteller:**
  - `images.js toneToPaper` trimmt ein zweites Mal gegen hellgraue Studio-Boxen.
  - `document.js cutoutPad` verringert die Luft schrittweise von 12 % auf 3 %, bis die Kachel zu ≥ 35 % bedeckt ist.
  - Bei Minotti bleibt alles unverändert (fester Passepartout).
  - Der Lou Nightstand (Minotti) bleibt deshalb bewusst klein.
- **P3.4 Kombinationen:**
  - `comboColumnPlan`: Ein Teppich ist nie Leitbild. In der Spalte erscheint er nur als schmaler Streifen (26 %) unter dem zweiten Stück.
  - Breite Freisteller bekommen die volle Breite (Westside, Mush).
- **P3.5 Titelbild Warme Moderne:** `Home/bannerImage-3.jpg` zeigt einen Nussbaum-Esstisch mit Cognac-Lederstühlen unter Taraxacum. Es ist ein Herstellerbild aus dem Archiv (Poliform-Küche), Credit „Herstellerbild Küche und Essen“. Die Freigabe durch den Hersteller bleibt Inhaber-Frage 2.
- **P3.6 Zeittest:**
  - `stilfinder-pdf.test.mjs` misst jetzt `timings.render` < 10 s.
  - Die Gesamtzeit hat nur eine Schutzgrenze: 20 s, unter CI 30 s.
  - Grund: Paralleler Last (shoot.mjs, andere Workflows) hat die Gesamtzeit einmal auf 12,8 s getrieben.
- **P3.7 Labs-URL:** bleibt offen. Für eine eigene URL außerhalb von `/labs`, die Umleitung (`next.config.js`) und die Verlinkung in Menü und Startseite braucht es Dateien außerhalb des Team-Bereichs. Die nächste Runde braucht dafür einen eigenen Auftrag.

**Tests:**
- Neue Suite `tests/unit/stilfinder-feinschliff.test.mjs` mit 5 Tests.
- Alle Stil-Finder-Unit-Suiten grün: 66/66.
- Einmal waren 2 Tests nur unter Parallellast rot. Bei der Wiederholung waren sie grün, einzeln ebenfalls.
- E2E `stilfinder-ki-abstand.spec.js` 2/2 grün.

**PDF:**
- 5 × 33 Seiten aus dem Live-Katalog, nur lesend, ohne Formular und ohne Mail.
- Liegt unter `fix2/pdf/pdf-*/moodboard.pdf`. Die Kontaktbögen heißen `sheet-a…d.jpg`.
- Skripte: `fix2/build-pdfs.mjs` und `fix2/render-pages.mjs` (pdf.js in Chromium).
