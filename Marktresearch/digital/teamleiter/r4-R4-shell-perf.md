# R4-shell-perf: Performance und Hülle

Stand: 26.10.2026 · Branch `feature/neuauftritt` · keine Commits, keine Installationen. Produktions-Builds nur in der Kopie `C:/Users/admin.local/Documents/platzhirsch-prod-check-r4shell` (prod-check.mjs, Port 3110). Im Repo lief kein Build.

## Ergebnis

| Auftrag | Status | Umsetzung / Beleg |
|---|---|---|
| (1) TBT mobil ≤ 200 ms | **Struktur umgesetzt, Ziel auf dieser Maschine nicht belegbar** | Siehe §1. Hülle: Header und Footer sind Server Components, die Inseln bekommen fertige Texte, Suche, Mobilmenü-Inhalt und Consent laden lazy, Footer- und Mega-Menü-Links laufen über eine delegierte Navigation, weniger Messages im Client. Gemessen: keine ICU-Kompilierung mehr auf `/de` (vorher 2 aus der Hülle), DOM `/de` 1 603 → 1 313 Knoten. TBT mit perf.mjs (Median aus 3 Läufen) 421–1 340 ms, Basis am selben Tag 1 145–1 347 ms. Die Maschine war voll ausgelastet (25 Node-Prozesse, parallele Builds), die Werte schwanken von Lauf zu Lauf um ±50 %. |
| Lenis / Motion | erledigt (nichts zu tun) | Im Quelltext nutzt nur Labs `motion` (Dreiländer, Stilfinder), Lenis nutzt niemand. Kein Import in der Hülle. |
| (2) FadeInView als CSS | erledigt (war schon CSS), aufgeräumt | Gleiche API, Server-safe, `animation-timeline: view()`, aus bei reduced motion und „Ruhige Ansicht“. Den toten `<noscript>`-Override für `[data-fade-in]` in `layout.js` habe ich entfernt. Unit-Test wacht. |
| (3) LCP /de/kontakt ≤ 2,5 s | **erledigt** | Neues Bild `public/Images/Newsletter/room-1600.jpg` (1600 w, 270 KB statt 859 KB). `PageHeader`: echtes `sizes` (mobil `calc(100vw - 40px)`), `quality 50`, `preload` + `fetchPriority="high"`. LCP mobil **3 064 → 1 856 / 1 912 ms** (nachher-2/-3). Das Bild lädt jetzt in w=1080 q=50. |
| (4) Kern-Baustein | erledigt | `components/ui/Kern.js` (`kernDisplay` + `<Kern>`), Export in `ui/index.js`, `Home/kern.js` re-exportiert. |
| (5) Footer-Ticket | **erledigt** | Linkgruppen mobil als `<details>`, alle Links bleiben im HTML, Regionen zweispaltig. iPhone `/de` **3 413 → 2 018 px** (Ziel ≤ 2 200), Pixel 3 364 → 1 968, EN/IT 2 443 → 1 529, FR 2 508 → 1 593 px. Ab 768 px immer offen, auch ohne JS. `footer-vorher.txt`, `footer-nachher.txt`, Bilder in `footer/`. |
| (6) Doppelter 308 | **erledigt** | `src/proxy.js` fragt bei falschsprachigen Unterseiten mit dynamischem Segment den eigenen Server einmal per HEAD (`redirect: manual`, 3 s Timeout, Kopfzeile gegen Schleifen). Bei Fehlern bleibt es beim alten Sprung. Alle Ziele sind unverändert (§3). Die Antwort dauert ca. 0,1 s. |
| (7) AP8-A11y-Rest | erledigt | Skip-Link: volle Hülle schon vorhanden, jetzt auch in `BareShell`. `singlePageSlider` ist kein Fotobanner mehr: serverfähiger Wrapper um `PageHeader` mit gleicher API, ohne Text auf dem Foto, ohne `hover:text-gold`, `text-white/40` und `priority`. Gold: In meinen Dateien steht kein `#d1b250` mehr als Textfarbe (grep). |

## 1. TBT: Analyse und Maßnahmen

**Werkzeuge:**
- `qa-screenshots/teamleiter/r4-shell-perf/js-profile.mjs`: Script-Bytes, Long Tasks, ScriptDuration
- `cpu-profile.mjs`: Selbstzeit je Chunk und Funktion
- `intl-count.mjs`: ICU-Kompilierungen

Alle laufen mit dem perf.mjs-Profil: Pixel 7, 4× CPU, 1,6 Mbit/s.

**Befunde in der Basis:**
- Header und Footer liefen komplett im Client. Dazu kamen `shellCopy` (4 Sprachen), `shellNav` mit Marken-, Landing- und Sitemap-Tabellen und rund 130 hydrierte `<Link>`-Komponenten, die meisten davon in geschlossenen Mega-Panels und im Footer.
- Der Client-Provider bekam die ganze Messages-Datei, etwa 60 KB im RSC-Payload jeder Seite.
- Die zweitgrößte JS-Funktion im CPU-Profil von `/de/kontakt` war `IntlMessageFormat.resolveLocale` (109 ms bei 4×). Ursache: ICU-Formatierung beim Hydrieren, 2 Aufrufe aus der Hülle (Auswahl-Zähler, Sprachknopf) und 5 aus den Formularen.

**Maßnahmen:**

| Maßnahme | Dateien |
|---|---|
| Navbar und Footer als Server Components, Slots `header`/`footer` | `layout.js`, `LoaderWrapper.js`, `client-layout.js` |
| Inseln mit fertigen Texten statt `useShellCopy`. Die Plural-Form „other“ wird auf dem Server mit Platzhalter 999 formatiert. | `Navbar/shellLabels.js` (neu, Server), `navMatch.js` (neu), `SelectionLink`, `LanguageSwitcher`, `MobileMenu`, `MobileCtaBar` |
| Such-Sheet lazy (`next/dynamic`, `ssr:false`, Prefetch bei Hover/Fokus) | `SearchDialog.js` (nur noch der Knopf), `SearchSheet.js` (neu) |
| Mobilmenü-Inhalt erst beim Öffnen. Rahmen und „Menü schließen“ bleiben im HTML, der Fokus funktioniert wie vorher. | `MobileMenu.js` |
| Consent lazy. Der Banner rendert auf dem Server ohnehin nichts. Die Footer-Einstellungen laden den Dialog erst beim Klick. BareShell lädt nur auf /upload. | `client-layout.js`, `FooterIslands.js` |
| Footer- und Mega-Panel-Links als `<a>` mit einer delegierten Navigation (`router.push`/`prefetch`) | `Reusable/LinkDelegate.js` (neu), `Footer.js`, `DesktopNav.js` |
| Client-Messages ohne Server-only-Namespaces (`inhalt`, `HomePage`, `about`, `ProductsMenu` …, etwa 28 KB). Als Deny-list gebaut, neue Namespaces kommen also durch. | `Reusable/clientMessages.js` (neu), Unit-Test |

**Wirkung (Produktions-Build, gleiche Seiten):**

| | Basis | nachher-3 |
|---|---|---|
| ICU-Kompilierungen beim Laden `/de` / `/de/kontakt` | 2 / 7 | **0 / 5** (die 5 stammen aus `Forms/useFormText`, fremd) |
| `resolveLocale` CPU `/de/kontakt` | 109 ms | 10 ms |
| DOM-Knoten `/de` / `/de/kontakt` | 1 603 / 1 099 | 1 313 / 804 |
| Footer- und Header-Links mit eigener `<Link>`-Komponente | ≈ 130 | 0 im Footer und in den Panels (sichtbare Header-Links unverändert) |
| perf.mjs mobil TBT, Median aus 3 (`/de`, `/produkte`, `/minotti`, `/lamps`, `/kontakt`) | 1162 / 1309 / 1224 / 1347 / 1145 | 421 / 675 / 1340 / 632 / 552 (nachher-2: 555 / 482 / 439 / 805 / 523) |
| perf.mjs mobil LCP | 2788 / 2076 / 2592 / 2616 / 3064 | 2296 / 1892 / 2892 / 2124 / 1912 |
| Desktop | TBT ≤ 21 ms, LCP ≤ 0,9 s | TBT ≤ 20 ms, LCP ≤ 0,48 s |

**Bewertung:**
- Die absoluten TBT-Werte sind auf dieser Maschine nicht aussagekräftig. Die Release-Prüfung L2 maß für fast denselben Code 202–297 ms, heute misst dieselbe Methode 2- bis 4-mal so viel. Die Werte springen auch zwischen zwei Läufen derselben Build-Version, z. B. `/minotti` 439 ms gegen 1 340 ms.
- Der größte Block bleibt fix: React-DOM, Next-Router, Turbopack-Modulauswertung und „program“ (HTML, CSS, Layout).
- **Nachweis ≤ 200 ms:** R4-release muss das auf ruhiger Maschine messen (`npm run check:prod`, Schritt perf).

## 2. Fremde Ursachen (Übergabe)

1. **Formulare (`Forms/useFormText`, `formCopy`, Besitz R4-leads/Formulare):**
   - Jedes `t()` bekommt `{ phone }` mit. Damit kompiliert jede Formular-Meldung per ICU, 5× auf `/de/kontakt`.
   - Besser: Werte nur übergeben, wenn die Meldung `{` enthält.
2. **Upload (`src/lib/upload/config.js`, Besitz R4-portal):**
   - Erzeugt beim Modul-Laden 2× `Intl.DateTimeFormat`, also ICU-Init, auch auf `/de/kontakt`. Im CPU-Profil sind das 139 ms bei 4×.
   - Besser: das Format lazy erzeugen, etwa per Funktion statt Modul-Konstante.
3. **Dev-Server:**
   - `.next/dev/prerender-manifest.json` war um 12:43 durch parallele Schreibzugriffe kaputt: 44 Byte Rest hinter gültigem JSON. Folge: Alle Seiten lieferten 500.
   - Ich habe den Rest abgeschnitten (generierte Datei, kein Quelltext). Danach lief alles wieder mit 200.
4. **`/produkte` → 307 → `/de/produkte`:** Das ist der next-intl-Standard für Pfade ohne Sprachpräfix. Ziel und Status bleiben unverändert, nicht im Auftrag.

## 3. Weiterleitungen (curl)

- Vorher: `qa-screenshots/teamleiter/r4-shell-perf/redirects-vorher-dev.txt`
- Nachher: `redirects-nachher-prod.txt`

| URL | vorher | nachher |
|---|---|---|
| `/en/ueber-uns/marken/minotti/sofas` | 308 → `/en/about-us/brands/minotti/sofas` → 308 → `…/sofas-couches` | **308 → `/en/about-us/brands/minotti/sofas-couches`** |
| `/de/about-us/brands/minotti/sofas` | 2 Sprünge | **1 Sprung** → `/de/ueber-uns/marken/minotti/sofas-couches` |
| `/fr/…/sofas`, `/it/…/sofas` | 2 Sprünge | **1 Sprung**, gleiches Ziel |
| `/en/ueber-uns/marken/minotti`, `/en/produkte/lamps(/…)`, `/en/beratung`, `/en/ueber-uns/karriere`, `/`, `/produkte`, `/en` | 1 Sprung bzw. 200 | unverändert |

## 4. Prüfung

- **shoot.mjs**: 6 URLs auf 4 Geräten, Ordner `qa-screenshots/teamleiter/r4-R4-shell-perf/selbst/`.
  - Ergebnis: 24/24 mit Status 200, kein Querscroll, 0 Konsolenfehler, 0 fehlgeschlagene Requests.
  - Angesehen: Kontakt iPhone und Desktop (Bild neben dem Text, scharf), EN-Marken Android, Start iPad.
- **Funktionsprüfung** `islands-check.mjs`, Dev und Prod, 24/24 OK. Geprüft:
  - Skip-Link als erstes Tab-Ziel
  - Zugängliche Namen: „Ihre Auswahl, noch leer“, „Sprache wählen, aktuell Deutsch“
  - EN-Link `/en/contact`
  - Suche nicht im HTML, öffnet mit Fokus im Feld, Esc schließt, öffnet ein zweites Mal
  - Privatsphäre-Dialog aus dem Footer
  - Footer-Gruppen auf dem Desktop offen, auf dem iPhone zu
  - Footer- und Mega-Menü-Link navigieren ohne Neuladen, das Panel schließt
  - Mobilmenü: Fokus auf „Close menu“, Inhalt da, Esc gibt den Fokus an „Open menu“ zurück
  - CTA-Leiste vorhanden
  - Einziger Prod-Hinweis: WebKit-Warnung zum Report-only-CSP aus `next.config.js` (fremd)
- **Link-Ziele:** `href-compare.mjs` vergleicht Header und Footer.
  - Alter Prod-Build gegen neuen Dev-Stand: `/de` 140, `/en` 115, `/de/produkte` 140 Links, alle identisch.
  - Neuer Prod-Build gegen Dev: ebenfalls identisch.
- **E2E:**
  - `tests/e2e/r4-shell.spec.js`: 4/4 grün.
  - `r3-shell.spec.js`: 7 grün, 2 flaky. Ursache: Die Consent-Leiste brauchte im Dev beim ersten Aufruf länger als 20 s, weil der Lazy-Chunk kalt kompiliert wird. Im 2. Versuch grün.
  - `a11y.spec.js` + `r3-startseite.spec.js`: 45 grün, 4 flaky, 1 rot. Die Fehler sind `ENOENT` auf Trace-Dateien im gemeinsamen `tests-results`-Ordner, verursacht durch parallele Playwright-Läufe anderer Teams. Keine axe-Befunde.
- **Unit-Tests:** `tests/unit/r4-shell.test.mjs` 11/11, `r3-shell`, `r3-startseite` und `r4-ci-bundle-budget` grün.
- **Weitere Checks:** `check:claims` 0 Verstöße. `npx eslint` auf alle eigenen Dateien: 0 Meldungen.

## 5. Dateien

- **Neu:**
  - `src/components/Navbar/{navMatch,shellLabels,SearchSheet}.js`
  - `src/components/Reusable/{clientMessages,LinkDelegate}.js`
  - `src/components/ui/Kern.js`
  - `public/Images/Newsletter/room-1600.jpg`
  - `tests/unit/r4-shell.test.mjs`
  - `tests/e2e/r4-shell.spec.js`
- **Geändert:**
  - `src/app/[locale]/{layout,client-layout,LoaderWrapper}.js`
  - `src/app/[locale]/kontakt/page.js`
  - `src/app/globals.css`
  - `src/proxy.js`
  - `src/components/Navbar/{navbar,DesktopNav,MobileMenu,SearchDialog,SelectionLink,LanguageSwitcher,shellNav}.js`
  - `src/components/Reusable/{Footer,FooterIslands,MobileCtaBar,BareShell,singlePageSlider}.js`
  - `src/components/ui/index.js`
  - `src/components/UberUns/PageHeader.js`
  - `src/components/Home/kern.js`
  - `Marktresearch/digital/redesign/header-footer.md` (§0c)
- **Messskripte und Daten:** `qa-screenshots/teamleiter/r4-shell-perf/`
  - Läufe `basis/`, `nachher-1..3/`
  - Profile `js-profile-*.json`, `cpu-*.txt`
- **Nicht angefasst:** `shellCopy.js`, `Cookies/**`.

## 6. Offene Punkte

1. **TBT-Nachweis ≤ 200 ms** auf ruhiger Maschine, durch R4-release.
2. **Fremd:** ICU in den Formularen und `upload/config.js` (§2). Beides kostet auf `/de/kontakt` nach wie vor die ICU-Initialisierung.
3. `Reusable/breadcrumbBar.js` wird nicht mehr genutzt. Ich habe ihn nicht gelöscht, die Entscheidung liegt beim Integrator.
4. Die Seiten `merkliste` (fremd) verweisen noch auf `room.jpg`. Ein Wechsel auf `room-1600.jpg` wäre optional.

## Nachbesserung nach QM-Feedback (26.10.2026)

Grundlage: `qa-screenshots/teamleiter/r4-R4-shell-perf/feedback.md` (Note 8/10, P1: keine). Produktions-Build nur in der Kopie `platzhirsch-prod-check-r4shell` (prod-check.mjs, Port 3110, Label `fix`), im Repo kein Build.

| Punkt | Status | Umsetzung / Beleg |
|---|---|---|
| P2-1 TBT ≤ 200 ms | **verbessert, knapp offen** | Prod-Build, perf.mjs mobil (4× CPU, Median aus 3): `/de` 225, `/produkte` 211, `/minotti` 231, `/lamps` 379, `/kontakt` 276 ms (vorher 421–1 340 ms). Desktop überall 0 ms. LCP mobil 1,56–2,10 s, CLS 0. Rest liegt außerhalb der Hülle: `Forms/useFormText` (ICU 5× auf `/kontakt`), `lib/upload/config.js` und Produktseiten-Galerie (`/lamps`). Diese Ursachen gehören anderen Teams. R4-release misst final auf ruhiger Maschine (`npm run check:prod`). |
| P2-2 Redirect-Probe kalt | **erledigt** | `src/proxy.js`: `PROBE_TIMEOUT_MS` 3000 → **1000**. Der Probe läuft nur noch bei Routen, die wirklich `permanentRedirect()` aufrufen: Marke × Kollektion und Katalog-Kategorie/Produkt. Markenseiten und Jobs haben keinen Probe mehr, `/fr/ueber-uns/marken/minotti` antwortet in 0,01 s statt mit Probe. Prod, erster ungecachter Aufruf (IT/FR/EN Minotti „sofas“): **246 / 100 / 66 ms**, jeweils **ein** 308 direkt auf `…/sofas-couches`. Damit ist auch belegt, dass `next start` unter `127.0.0.1:$PORT` erreichbar ist. Bei gesetztem `HOSTNAME` greift weiterhin der Rückfall auf zwei Sprünge, jetzt aber mit höchstens 1 s Wartezeit. Unit-Test prüft Routenliste und Timeout ≤ 1000. |
| P2-3 Cookie-Leiste | **erledigt** | `client-layout.js` startet den Download des Consent-Chunks schon beim Laden des Moduls (gleiches Promise für `next/dynamic`, nicht auf `/upload`). Prod, frischer Kontext ohne Einwilligung: Leiste **151–314 ms** nach `load` (mobil und desktop). Einziger Ausreißer: Minotti desktop mit 964 ms, also noch ≤ 1 s. Auf dem Minotti-iPhone-Screenshot im Dev ist die Leiste jetzt sichtbar. Geprüft wird das in `tests/e2e/r4-shell-prod.spec.js`. Gegen den Dev-Server wird der Test übersprungen. Rohdaten: `qa-screenshots/teamleiter/r4-shell-perf/prod-timing.json`. Tracking bleibt bis zur Einwilligung aus, der Consent-Mode-Default im Layout ist unverändert. |
| P3-1 FadeInView ungenutzt | dokumentiert | Ein Statuskopf in `Reusable/FadeInView.js` sagt jetzt: nirgends importiert. Ob die Datei gelöscht wird, entscheidet der Integrator. Ich lösche nichts, weil parallel arbeitende Teams sie noch importieren könnten. |
| P3-2 falscher Testname | erledigt | Kommentar in `clientMessages.js` → `tests/unit/r4-shell.test.mjs` |
| P3-3 Brotkrumen „Home“/„Startseite“ | weitergegeben | Quelle ist `ueber-uns/marken/page.js`, `marken/[title]/page.js`, `MarkenClient/Marken.js` (Besitz Marken-Team). Die Hülle und `PageHeader` verwenden „Startseite“. |
| P3-4/5 | weitergegeben | Hero `aboutHome.jpg` ohne `sizes` gehört dem Startseiten-Team, Manifest-Symptom kommt ins Integrator-Protokoll. |

**Prüfung:**
- `node --test tests/unit/r4-shell.test.mjs`: 11/11
- eslint auf den geänderten Dateien: sauber
- Prod-Playwright (`r4-shell-prod.spec.js` + `r4-shell.spec.js`): **15/15 grün**
- shoot.mjs `qa-screenshots/teamleiter/r4-shell-perf/fix` (5 URLs × 4 Geräte): 20/20 mit Status 200. Eine Dev-Warnung „state update on a component that hasn't mounted“ trat einmal auf (iPad, EN-Marken). Beim erneuten Lauf mit 12 Aufnahmen kam sie nicht wieder. Die gleiche Warnung steht auch in älteren Berichten anderer Teams (HMR bei parallelen Änderungen).
- Angesehen: `/de` iPhone, Minotti iPhone mit Cookie-Leiste, `/de/kontakt` Desktop. Hülle, Leiste und Kontaktbild sind sauber.

**Geänderte Dateien:**
- `src/proxy.js`
- `src/app/[locale]/client-layout.js`
- `src/components/Reusable/clientMessages.js`
- `src/components/Reusable/FadeInView.js`
- `tests/unit/r4-shell.test.mjs`
- `tests/e2e/r4-shell-prod.spec.js` (neu)
