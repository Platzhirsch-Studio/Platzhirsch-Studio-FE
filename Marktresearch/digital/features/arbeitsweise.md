# Signature-Seite /de/arbeitsweise – Bau-Doku

**Stand:** 28.10.2026 · **Team:** Arbeitsweise · **Konzept:** `arbeitsweise-konzept.md` · **USP:** `usp-handzeichnung-designprozess.md` (Inhaber-Entscheidung Nr. 8)

## 1. LAUNCH-MUSS (vor dem Deploy)

1. **Echtes Material von Harald in `src/lib/arbeitsweise/media.js` eintragen**, mindestens `handzeichnung`, `modell`, `rendering` (mit `srcMobile` 4:5) und `portrait`. Dateien liegen unter `public/arbeitsweise/`. Jeder Eintrag braucht `credit`, `einwilligung` (Bildregister), `kiStufe` (bei Skizze und Modell immer `"keine"`) und `typ`. `missingForLaunch()` muss `[]` liefern. Der Unit-Test prüft die Pflichtfelder. **Keine KI-Skizzen, keine KI-Modellfotos, keine generierten Räume.**
2. Die Seite ist **indexierbar** (`index, follow`), so lautet der Auftrag. In Produktion sind Platzhalter unsichtbar: Leere Slots fallen weg, es bleiben Text und Schema-Grafik. Ohne Punkt 1 geht die Seite deshalb technisch korrekt, aber ohne Beweisbilder live. Das widerspricht der Empfehlung des Konzepts (§6.3). **Der Inhaber entscheidet:** Livegang erst mit Material oder vorher als reine Textfassung. Wer vorher `noindex` will, setzt in `page.js` `robots.index` auf `false`.
3. `[Inhaber]`-Stellen bestätigen, markiert mit `// INHABER:` in `copy.js`: „60 Minuten · kostenlos“, Haralds Titel „Designer & Zeichner“, der letzte Satz im Harald-Text, FAQ 1 (Handzeichnung bei jedem Auftrag?), FAQ 3 (Gebiet) und FAQ 4 (Preismodell, bis dahin ohne Zahl).
4. Rechte: Nutzungsrechte-Einräumung durch Harald, Projekt-Einwilligungen der Bauherrschaften, Porträt-Einwilligung (Konzept §11.3).

## 2. Dateien (exklusiv Team Arbeitsweise)

| Datei | Inhalt |
|---|---|
| `src/app/[locale]/arbeitsweise/page.js` | Route, nur DE (andere Sprachen 404), Metadaten (Title, Description, Canonical, OG mit Standardbild, solange kein Rendering da ist) |
| `src/components/Arbeitsweise/ArbeitsweisePage.js` | Server-Komponente, Kapitel K0–K11, JSON-LD |
| `src/components/Arbeitsweise/Linie.js` | Schema-Grafik „Die Linie“, 7 Phasen über `data-phase`, aria-hidden, Beschriftung „Schema“ |
| `src/components/Arbeitsweise/Werkstrecke.js` | Client-Insel: Sticky-Grafik ab 1024 px. Die Phase folgt dem Schritt in der Bildschirmmitte (motion `inView`), dazu Stationsanzeige und Fortschritts-Haarlinie (`useScroll`, `m.span`) |
| `src/components/Arbeitsweise/motion.js`, `motionFeatures/animation.js` | LazyMotion (strict), Features als eigener Chunk nach der Hydration (Muster wie Labs) |
| `src/components/Arbeitsweise/Kette.js` | Vorher-Nachher-Kette: Radiogruppe mit Pfeiltasten, Crossfade 240 ms. Ohne JS stehen alle 5 Bilder untereinander |
| `src/components/Arbeitsweise/ImageSlot.js` | Bild mit Credit, Platzhalter „Bild folgt“ (`data-placeholder="arbeitsweise"`) oder nichts |
| `src/components/Arbeitsweise/arbeitsweise.module.css` | Phasen, Übergänge, Scroll-Reveals (`animation-timeline: view()` hinter `@supports`), Reduced Motion |
| `src/lib/arbeitsweise/copy.js` | alle deutschen Texte |
| `src/lib/arbeitsweise/media.js` | **die eine Bildquelle**, Schalter für Platzhalter, `validateMedia`, `missingForLaunch`, `chainComplete` |
| `src/lib/arbeitsweise/schema.js` | JSON-LD mit WebPage, BreadcrumbList, FAQPage (8 Fragen = sichtbar) und Person (ohne jobTitle und image bis zur Bestätigung). Kein HowTo, kein Review |
| `tests/unit/arbeitsweise.test.mjs` | 11 Tests: media.js, Ton der Texte, Schema statt Skizze, LazyMotion, kein three.js, JSON-LD |
| `tests/e2e/arbeitsweise.spec.js` | 7 Tests (Desktop und iPhone-Emulation), siehe §5 |
| `Marktresearch/digital/features/arbeitsweise-messages-vorschlag.json` | Namespace `Arbeitsweise` in DE, EN, FR und IT (EN/FR/IT sind ein Vorschlag, vor der Freischaltung muttersprachlich prüfen) |

## 3. Gestaltung und Bewegung

- **Ablauf:**
  - Auftakt mit H1 (das LCP-Element ist Text) und der einen Horizontlinie
  - Haltung mit drei Bodoni-Wörtern: Ort · Hand · Präzision
  - Übersicht der 7 Stationen: Desktop eine Linie, mobil eine vertikale Liste; jeder Eintrag ist ein Anker
  - Werkstrecke hell (Schritte 01–04): Grafik rechts, sticky
  - **Das eine dunkle Kapitel** (Schritte 05–06): Messing auf Walnut, Grafik links. Danach öffnet sich der volle Rendering-Platz per Bildmaske (≤ 7 % je Seite). Das ist der Signature-Moment.
  - Wirklichkeit (07): die Linie wird wieder Horizont
  - Harald, die Kette, „Online starten. Harald zeichnet weiter.“ (Karten nur für freigeschaltete Planer aus `src/lib/features.js`), die Fragen und „Designs, die leben.“ (der einzige zentrierte Satz)
- **Die Linie:**
  - Phasen: Raumumriss → Sonnenbogen → Grundriss → Isometrie mit Wänden → Raster und Maßketten (Schemawerte 4,80 × 3,60 m) → Drahtmodell bei 24 % → Horizont
  - Animiert werden nur `transform`, `opacity` und `clip-path`.
  - Jede Wand trägt ihre volle 3D-Matrix und braucht kein `preserve-3d`. WebKit rechnet `preserve-3d` teils flach, so stehen die Wände auch in Safari.
- **Mobil:** Es gibt kein Sticky. Jeder Schritt zeigt Text → Standbild seiner Phase (max. 320 px, zeichnet sich beim Scrollen per `clip-path` ein) → Bildplatz.
- **Reduced Motion** (System oder `data-motion="reduced"`): keine Übergänge und keine Scroll-Animation. Jede Grafik steht sofort im Endzustand, die Fortschrittslinie entfällt.
- **Budget:** keine Abhängigkeit von three.js oder R3F. Die einzige JS-Bibliothek ist motion (LazyMotion), und das nur in Werkstrecke.

## 4. Ehrlichkeit

- Die Grafik heißt überall „Schema“. Sie hat keinen Alt-Text und imitiert keinen Handstrich.
- Unter jedem Rendering steht Pflichttext: „Visualisierung aus der Planung, kein Foto.“
- Keine Superlative, kein Ausrufezeichen, keine Preise, keine erfundenen Projekte, Zahlen oder Zitate. Die Unit-Tests prüfen das.
- „Ein, zwei Tage vor Ort“ steht nur in der Form „wenn Ihr Projekt es braucht“. Auch das prüft ein Test.

## 5. Prüfung (28.10.2026, Dev-Server :3000)

- `node --test tests/unit/arbeitsweise.test.mjs`: 11/11 grün. `npm run test:unit`: grün. Ein früherer Lauf meldete in `r6-shell-perf` „arbeitsweise“ als fehlenden Eintrag; das ist inzwischen von einem anderen Team in `shellNav.js` nachgetragen.
- `PW_WORKERS=1 npx playwright test arbeitsweise.spec.js --project=desktop`: 7/7 grün. Geprüft werden:
  - Status 200, Titel, H1, `index`, Canonical, EN/FR/IT 404
  - FAQ sichtbar = JSON-LD
  - Platzhalter nur in der Vorschau
  - Phase folgt dem Schritt (2, 4, 5, 7)
  - Reduced Motion ohne laufende Animation
  - axe ohne serious/critical
  - iPhone 393 und 375 px ohne Überlauf, 7 Standbilder, Sticky ausgeblendet
- Screenshots in `qa-screenshots/arbeitsweise/selbst/` (Desktop je Schritt, iPhone je Schritt, WebKit-Detail `wk-05-*.png`). `tools/qa/shoot.mjs` lief wegen des ausgelasteten Dev-Servers in Timeouts beim Laden der Chunks. Dieselben Ansichten habe ich deshalb mit einem eigenen Skript erstellt (`waitUntil: load`).
- `eslint` ohne Befund für alle Arbeitsweise-Dateien.

## 6. Integration (Dateien anderer Teams, Vorschläge)

| Wo | Was |
|---|---|
| `src/lib/seo/sitemap/extraPages.js` | Eintrag `{ path: "/arbeitsweise", kind: "service", label: "Arbeitsweise", lastModified: "2026-10-28", llms: LLMS_LINE }` (Text in `copy.js`), sobald der Livegang entschieden ist |
| `src/components/Navbar/shellNav.js` | Menü „Das Haus“ und „Leistungen“: Link „Arbeitsweise“ (DE-only steht schon in `GERMAN_ONLY_FIRST_SEGMENTS`) |
| `src/messages/*.json` | Namespace `Arbeitsweise` aus dem Vorschlag. Danach `copy.js` über `useTranslations` lesen und die Slugs EN `/approach`, FR `/demarche`, IT `/metodo` in `ROUTES` und `proxy.js` eintragen |
| Startseite, Interior, Beratung, Küchen, Regionen, Team, Planer | Verweise laut `usp-durchdringungsplan.md` |

## 7. Offen beim Inhaber

Leitmotiv („Digital perfektioniert“ oder „Im Raum gebaut“) · Haralds Titel · Handzeichnung bei jedem Auftrag? · Preis und Umfang der Vor-Ort-Tage · Livegang vor oder nach dem Mindest-Material · optionaler Slot `portal` (Screenshot Kundenportal) ist im Konzept vorgesehen und bewusst nicht eingebaut, bis es echte Screens gibt.
