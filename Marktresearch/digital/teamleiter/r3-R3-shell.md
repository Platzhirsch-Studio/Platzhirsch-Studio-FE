# R3-shell: Cookie-Banner, Header, Mobilmenü, Footer, Öffnungszeiten, /upload-Hülle, Lint

Stand: 26.10.2026 · Branch `feature/neuauftritt` · keine Commits, keine Installationen. Details je Punkt: `Marktresearch/digital/redesign/header-footer.md` §0b.

## Ergebnis

| Auftrag | Status | Umsetzung / Beleg |
|---|---|---|
| (1) Cookie-Banner | erledigt | `Cookies/cookiecomponent.js` neu nach Bibel: Paper, eine Haarlinie, kein Radius, kein Schatten, kein Gold. „Alle akzeptieren“ und „Weiter ohne Einwilligung“ sind identisch (e2e vergleicht Farbe, Rahmen, Größe), „Individuelle Einstellungen“ ist Textknopf im Satz. Mobil 18–24 % der Höhe (320 × 640: 23,8 %, iPhone 15 Pro 23,2 %, Pixel 7 18,2 %), der Hero-Knopf „Termin wählen“ bleibt frei (e2e iPhone/Pixel). Einstellungen als `<dialog>`/`showModal()`: Fokus-Falle (40 × Tab bleibt im Dialog), Esc, Fokus zurück an den Auslöser (Leiste und Footer-Knopf). Detail-Schalter jetzt echte Knöpfe mit `aria-expanded`. Leistenhöhe als `--ph-consent-h` → `scroll-padding-bottom` + Body-Polster. Unverändert: zugängliche Namen, Cookie `cookieConsent` (gleiche Schlüssel und Reihenfolge, e2e), Ereignis `ph-consent-change`. `ConsentEmbed`: Platzhalter auf `surface-band`, Ink-Rahmen-Knopf, kein Gold-Hover. `cookieItem.js` ohne Radien/Blau |
| (2) Lint | erledigt | Banner, `ConsentEmbed` und `context/CartContext.js` lesen über `useSyncExternalStore`. Merkliste: gleicher Schlüssel `cart`, gleiche Reparatur, Speichern bei jeder Änderung. **`npx eslint src`: 0 Fehler, 0 Warnungen** |
| (3) Header/Menüs | erledigt | 320 px WebKit + Chromium ohne Überlauf. Mobilmenü: „Menü schließen“ ist jetzt erstes DOM-Element (rechts per `flex-row-reverse`) und bekommt den Fokus; Esc → „Menü öffnen“ (e2e beide Engines). Mega-Menü `repeat(n, auto)`: „Chaiselongues & Daybeds“/„Sideboards & Kommoden“ bei 1280 px einzeilig. Footer: 2/3/5 Spalten (`auto` ab 1280), Zeiten `nowrap`, Telefon bündig am Gutter (1360 bei 1440). `caret-color`-Mismatch: Ursache Playwright-WebKit-Screenshot (Inline-Style vor Hydration), `suppressHydrationWarning` am Suchfeld; `caret.mjs` vorher Meldung, nachher keine |
| (4) globals.css | erledigt / dokumentiert | `scroll-padding-bottom: max(5rem, Leiste + 1rem)`. Bodoni „W“: gemessen (`kerning.mjs`) – Kerning ist aktiv (AV/To/Yo gekernt), die ausgelieferte Bodoni Moda hat aber **keine Paare** für We/Wo/Wi und „Ne“. Per CSS nicht lösbar → Empfehlung unten |
| (5) Öffnungszeiten | erledigt | `OPENING_HOURS` + Helfer in `src/lib/site.js`; Footer, Mobilmenü, `Kontakt/copy.js` (Re-Export) und JSON-LD lesen daraus, Werte identisch (Unit). Adresse unberührt |
| (6) /upload | erledigt | `client-layout.js` → `Reusable/BareShell.js` für `/<locale>/upload/**`: Wortmarke + „Zurück zur Website“ (Verlauf, sonst Startseite), kein Menü/Footer/Banner/CTA-Leiste; serverseitig gerendert. Upload-Formular unverändert |
| Texte | | nur `Shell.bare.back` → `messages-r3-shell.json` (4 Sprachen), Fallback in `shellCopy.js` |

## Prüfung

- `shoot.mjs` → `qa-screenshots/teamleiter/r3-R3-shell/selbst/`: 7 URLs × 4 Geräte, alle 200 (außer `/de/upload` = 404 by design, ohne Token; Konsole nur der 404), kein Überlauf, keine Konsolenfehler. Bilder angesehen. Hinweis: Auf `de--iphone.png` fehlt die Leiste, weil die erste Seite beim kalten Dev-Server noch nicht hydriert war; `it--iphone.png` und e2e (WebKit /de) zeigen sie.
- `tests/e2e/r3-shell.spec.js` 8/8 grün (inkl. axe mit offener Leiste, offenem Dialog und nach Schließen: 0 serious/critical), `a11y.spec.js` desktop 16/16 (4 Skips by design).
- Unit: `tests/unit/r3-shell.test.mjs` 9/9, Gesamt 410/410. `check:claims`: keine Funde in eigenen Dateien.
- Messskripte: `qa-screenshots/teamleiter/r3-shell/{wraps,megawidths,caret,hydration,kerning}.mjs`.

## Dateien

`src/components/Cookies/{cookiecomponent,ConsentEmbed,cookieItem}.js`, `src/context/CartContext.js`, `src/components/Navbar/{MobileMenu,DesktopNav,SearchDialog,shellCopy}.js`, `src/components/Reusable/{Footer,BareShell (neu)}.js`, `src/app/[locale]/{layout,client-layout}.js`, `src/app/globals.css`, `src/lib/site.js`, `src/components/Kontakt/copy.js`, `tests/unit/r3-shell.test.mjs`, `tests/e2e/r3-shell.spec.js`, `Marktresearch/digital/redesign/header-footer.md`, `Marktresearch/digital/teamleiter/messages-r3-shell.json`.

## Offene Punkte

1. **R3-portal-upload:** `Upload/FocusShell.js` deckt die Seite weiter fixed ab (eigenes Logo) und macht die neue Hülle `inert`. Mit `header[data-shell="bare"]` kann der Cover entfallen.
2. **Bodoni-Kerning:** `Home/kern.js` als gemeinsamen Baustein nach `components/ui` heben (Fundament, Runde 4) oder Schriftdatei mit ergänzten W-/N-Paaren (Schriftgestalter, OFL).
3. **R3-i18n:** `Shell.bare.back` übernehmen; `Navbar.hours` wird vom Mobilmenü nicht mehr gelesen (verwaist, nicht gelöscht).
4. Weitere Kopien der Öffnungszeiten außerhalb meiner Dateien: `lib/concierge/showroom.js`, `Home/HouseCafe.js` (Kommentar), `Preview/buehne/content.js` – Besitzer sollten aus `@/lib/site` importieren.
5. Nicht im Auftrag: Navbar/Footer als echte Server Components in `layout.js` (header-footer.md §4a.3).

## Nachbesserung nach QA (feedback.md, Note 8/10)

| Punkt | Status | Umsetzung |
|---|---|---|
| P2-1 Consent-Text Art. 49 | **Text geliefert, Übernahme offen** | `src/messages/*.json` gehören R3-recht/R3-i18n. Neue Texte für `Cookies.thirdCountryNotice` (DPF/SCC statt Art. 49) und `Cookies.intro` (nur Einwilligung, kein „berechtigtes Interesse“) nach Rechtspaket 02 §4 C1/C2 in allen 4 Sprachen in `messages-r3-shell.json`. Wirksam, sobald der Integrator sie zusammenführt. C3–C12 (Dienstliste, GTM, Banner-Version, Protokoll) bleiben beim Rechtspaket |
| P2-2 FocusShell über /upload-Hülle | **offen, Besitz R3-portal-upload** | Shell-Seite fertig: `header[data-shell="bare"]` vorhanden. `Upload/FocusShell.js` (Cover + `inert`) muss dort entfallen. Nicht in meinen Dateien, nicht überschrieben |
| P3-1 Leistenhöhe 320 px | erledigt (Bericht) | Gemessen 23,8 % bei 320 × 640 (< 25 %). Bericht nennt jetzt 18–24 % |
| P3-2 Fokusrahmen nach Tippen (WebKit) | erledigt | `MobileMenu.js` setzt beim Öffnen per Zeiger `data-pointer-focus` auf „Menü schließen“, CSS blendet den Ring aus, bis eine Taste gedrückt wird oder der Fokus wechselt. e2e prüft `outline-style: none` in WebKit und Chromium |
| P3-3 /upload-404 ohne Impressum | erledigt | `BareShell` hat eine einzeilige Rechts-Fußzeile (Impressum, Datenschutz, `Footer.*`-Texte). Wenn die Seite eine eigene Rechts-Nav mitbringt (UploadFrame), wird sie per `:has()` ausgeblendet, damit nichts doppelt steht. Neuer e2e-Test |
| P3-4 Mobile Leiste ohne sichtbaren Titel | bewusst so belassen | Der zugängliche Name der Region („Cookie-Einstellungen“) ist auf allen Geräten gleich. Ein sichtbarer Vorspann mobil hätte die Leiste auf 27 % gebracht (gemessen), über der Grenze |
| P3-5 Übergaben | weitergegeben | R3-i18n: `Navbar.hours` verwaist, `Shell.bare.back` und `Cookies.*` aus `messages-r3-shell.json`. Besitzer von `lib/concierge/showroom.js` und `Preview/buehne/content.js`: aus `@/lib/site` (`OPENING_HOURS`) importieren |

Prüfung nach Fix: `shoot.mjs` → `qa-screenshots/teamleiter/r3-R3-shell/fix/` (4 URLs × 4 Geräte; 200 bzw. 404 für /upload wie gewollt, kein Überlauf, Konsole nur die 404-Meldung). Bilder angesehen: Rechts-Fußzeile auf der /upload-404 sichtbar, Leiste unverändert. `r3-shell.spec.js` 9/9 grün, Unit 9/9, eslint 0.
