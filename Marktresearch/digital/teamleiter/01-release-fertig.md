# Endtest und Release-Bericht „fertig“

**Stand:** 29.10.2026 · Branch `feature/neuauftritt` · nichts committet, gepusht oder deployt · keine Formulare oder Mails abgesendet
**Umgebung:** Dev-Server http://localhost:3000 (Next 16.4.1, nicht neu gestartet). Prod-Gegenprobe im Build der Kopie `platzhirsch-prodtest` (BUILD_ID von 06:00, Quellen identisch mit dem Repo außer den zwei Code-Fixes unten), kurz mit `next start -p 3101` gestartet und danach wieder beendet.

---

## 1. Stufe „fertig“ erreicht?

**Nein.** Das Release-Gate verlangt: alle Abnahmen grün, Expertenrat ≥ 9/10 je Prüfer, keine P0. Technisch ist die Seite releasefähig: Unit-Tests und Lint sind grün, die E2E-Suite ist bis auf einen dokumentierten Umgebungsfall grün, und die 25 Kern-URLs zeigen keine Mängel bei Status, Überlauf oder Konsole. Offen bleiben aber drei P0 aus dem Release-Rat. Zwei davon kann nur der Inhaber lösen (Kern-USP ohne echtes Material, Kanzlei-Freigabe der Rechtstexte), einer ist Technik (ISR-Cache). Kein Prüfer steht bei 9.

## 2. Scores je Prüfer (letzter Release-Rat, Runde 6, unverändert)

In diesem Lauf wurde kein neuer Release-Rat einberufen. Die Werte sind die zuletzt vergebenen.

| Prüfer | Score | P0 | Offener P0 / Hauptgrund | Wer löst ihn |
|---|---|---|---|---|
| gesamtwerk | 7,5 | 1 | Kern-USP „von Hand gezeichnet“ ohne sichtbares echtes Material | Inhaber (A.1/33) |
| ux-conversion | 8,4 | 0 | P1: Arbeitsweise-Bilder fehlen, iPhone-Danke-Meldung | Inhaber / Code |
| technik | 5 | 1 | Unbekannte Slugs füllen den ISR-Cache auf der Platte (`dynamicParams = true` + `revalidate`). In diesem Lauf ist keine Behebung nachweisbar. Zusätzlich liefert `/de/ueber-uns/marken/Minotti` (Großschreibung) weiter 404 | Code (nächste Fix-Runde) |
| recht-inhalt | 7 | 1 | Rechtstexte ohne Kanzlei-Freigabe, ECG-/WKO-Angabe fehlt | Kanzlei / Inhaber (B.5/B.6/34) |
| neuland | 7 | 0 | Kein Beweis für den Kern-USP, kein Showroom-Splat | Inhaber (A.1, E.17) |
| seo | 8,5 | 0 | P1: Core Web Vitals mobil (LCP 4–5 s statt ≤ 2,0 s) | Code / Hosting |

## 3. Testergebnisse in Zahlen

| Prüfung | Ergebnis |
|---|---|
| `npm test` (Unit) | **1 567 Tests: 1 544 bestanden, 0 rot, 23 übersprungen.** Vorher und nach den Fixes gleich |
| `npm run lint` (ESLint) | **0 Fehler, 0 Warnungen** (Exit 0, auch nach den Änderungen) |
| Playwright komplett, `PW_WORKERS=1`, Dev (1,1 h) | **1 095 Tests: 953 bestanden, 23 rot, 2 flaky, 114 übersprungen, 3 nicht gelaufen** |
| Nach Ursachenklärung und Einzelwiederholung | 16 der 23 roten Fälle behoben (2 Code-Fixes, veraltete Tests angepasst, 404-Prüfungen an den Prod-Modus gebunden). **Die 7 übrigen sind ein Umgebungsfall:** Der Dev-Server lief vor der Änderung an `deOnlyRedirects.cjs` an (Start 04:31, Datei 04:37). Gegen den Prod-Build sind diese 7 grün. Sie werden auch auf Dev grün, sobald der Teamleiter den Dev-Server neu startet |
| Einzelwiederholungen Dev | geänderte Specs 69/69 grün (18 übersprungen), Sofaplaner-Specs 21/21, `smoke /de/produkte/lamps` 4/4, Gesamtblock 189 grün nur mit den 7 Arbeitsweise-Fällen rot |
| Gegenprobe Prod-Build (:3101) | 94 grün. Rot waren nur 2 Tests, die Backoffice-Daten brauchen (News-Sprachlinks, Team-Raster). Ursache: Mein Testserver lief ohne Backoffice-URL. Im Dev-Lauf sind beide grün |
| Screenshots `qa-screenshots/fertig/final` | 25 URLs × 4 Geräte = **100 Aufnahmen, alle HTTP 200, 0 Überlauf, 0 Konsolenfehler**. Ein abgebrochener Bild-Request (`aboutHome.jpg` w=750 auf `/en` Desktop, responsiver Wechsel, ohne Folgen) |

### Ursachen der 23 roten Fälle

| # | Fälle | Ursache | Maßnahme |
|---|---|---|---|
| 1 | `smoke /de/produkte/lamps` (iPhone, Pixel) | **Echter Fehler:** Die A–Z-Liste aus R9-P5 gab Produktvarianten mit gleichem `url_slug` doppelt aus. Folgen: doppelte React-Keys (Konsolenfehler) und doppelte Links | **Code-Fix** in `src/app/[locale]/produkte/[category]/page.js`: Liste nach URL dedupliziert |
| 2 | `labs-sofaplaner` Kontextverlust | **Echter Fehler (P2):** Bei WebGL-Kontextverlust hieß die Meldung „konnte nicht geladen werden“ statt „vom Browser beendet“. Die Error-Boundary greift vor dem asynchronen `webglcontextlost` | **Code-Fix** in `Sofaplaner/Planner.js` und `Preview3D.js`: Im Fehlerpfad wird `isContextLost()` des Renderers abgefragt |
| 3 | `r4-portal-labs` Werkzeug-Seiten | Veralteter Test: `/de/concierge` ist ohne KI-Schlüssel bewusst noindex (P6 R2, F2) | Erwartung folgt `/api/labs/status` (wie smoke.spec.js) |
| 4 | `r6-produkt` 24 Links (329 gefunden) | Veralteter Test: R9-P5 (seo P2-13) ergänzt die A–Z-Liste aller Modelle im Server-HTML | Es wird nur das Raster vor `<details>` gezählt |
| 5 | `r6-shell-perf /de/projekte` | Veralteter Test: `/de/projekte` leitet auf `/de/arbeitsweise` (E.20), die es jetzt in 4 Sprachen gibt | Pfad aus der Liste rein deutscher Seiten entfernt |
| 6 | `r7-p1-shell` Portal-Login | Veralteter Test: Die Panel-Links des Mega-Menüs stehen erst nach dem Öffnen im DOM (R4/P4) | Panel „Planen & Erleben“ wird geöffnet, dann geprüft |
| 7 | `r7-p6` `/en/arbeitsweise → 308` (nur Prod) | Veralteter Test: Die Seite ist seit R5-fix P2 eine eigene EN-Seite | Eintrag entfernt (abgedeckt in r9-p2) |
| 8 | `r8-wow-webkit` Sprachhinweis und iPad-Grafik | Veraltete Tests: LangNotice und LineStudy auf /arbeitsweise sind bewusst entfernt worden (`[data-hero-sheet]`) | Erwartung „kein Hinweis“, Selektor `[data-hero-sheet]` |
| 9 | `r9-p2` Brotkrume/axe (Prod) | (a) Der Cookie-Helfer kannte die IT-voi-Form „Continuate senza consenso“ nicht. (b) Die Regex für den Seitenhinweis traf auch die korrekten Linkzusätze „(in German)“ an Links auf rein deutsche Werkzeuge | Helfer und Regex angepasst |
| 10 | `errors.spec` wp-login, `r7-p6` 6 × 404, `r9-p1` unbekannte Marke | Next 16.4.1 im **Dev** liefert für `notFound()` die Hülle `__next_error__` (per curl belegt). Die vorgerenderte 404 gibt es nur im Prod-Build, dort sind die Tests grün | `test.skip(!PROD)` mit Begründung |
| 11 | `r5-perf-shell` three.js vor dem Tippen | Turbopack lädt im Dev den Chunk von `import("./LichtSzene")` vorab. Im Prod-Build grün | Chunk-Prüfung nur mit `PROD`. „Kein Canvas vor dem Tippen“ gilt weiter überall |
| 12 | `arbeitsweise.spec` + `r9-p2` 6 × (Dev) | Der Dev-Server hat den alten Redirect-Stand (308 für EN/FR/IT) | **Offen, nur Neustart des Dev-Servers.** Im Prod-Build grün |

## 4. URL-Übersicht (Screenshots `qa-screenshots/fertig/final/`)

| URL | Status | Befund beim Ansehen |
|---|---|---|
| `/de` | 200 | Hero „Von Hand gezeichnet, am Bodensee.“, Linie, Termin-CTA. Mobil: Bildzeile oben, CTA über der Falz |
| `/en`, `/fr` | 200 | wie DE, übersetzt |
| `/it` | 200 | **P2:** Auf dem Desktop bricht „Richiedete un appuntamento“ im Hero-Knopf um und wird unten abgeschnitten (auch „Showroom & caffè“) |
| `/de/arbeitsweise` | 200 | Typografisches Papierblatt „Papier. Modell. Raum.“, **kein echtes Bild** (Inhaber A.1) |
| `/de/leistungen` | 200 | 3 Karten (Küche, Sofa, 3D) mit Maßgrafiken, Filter Online/Erleben/Service |
| `/de/kuechenplaner` | 200 | 3D-Startküche mobil sichtbar, 2D/3D-Umschalter |
| `/de/sofaplaner` | 200 | Ohne Minotti-Namen (C.10), Grundriss-Beispiel |
| `/de/3d-ansicht` | 200 | „Raumbedarf in Originalgröße“, ehrlich ohne 3D-Modelle (C.29) |
| `/de/stil-finder` | 200 | 3 Showroom-/Outdoor-Bilder, Start-CTA |
| `/de/ezarri`, `/de/ezarri/konfigurator` | 200 | „Vertragshändler von Ezarri“, Unternavigation, Konfigurator |
| `/de/yacht-interior` | 200 | Dunkles Kapitel, **keine Minotti-/Navetta-Bilder** (`NAVETTA_RELEASED = false`) |
| `/de/outdoor-gartenplanung` | 200 | noindex bis zur rechtlichen Prüfung (24) |
| `/de/produkte`, `/de/produkte/lamps/lamps-2097-18` | 200 | Katalog; Produkt mit Galerie und Termin-CTA, „auf Anfrage“ |
| `/de/ueber-uns/marken/minotti`, `…/armchairs-stools` | 200 | „Bild: Minotti“ als Nachweis, unverändertes Herstellerbild |
| `/de/ueber-uns/team` | 200 | Team mit Fotos; Haralds Porträt fehlt (46) |
| `/de/ueber-uns/platzhirsch`, `/de/kontakt`, `/de/beratung` | 200 | Kontakt mit Anrufen-CTA und USP-Satz |
| `/de/kuechen-vorarlberg`, `/de/impressum`, `/de/datenschutz` | 200 | Impressum/Datenschutz als Entwurf bis zur Kanzlei-Freigabe |

Übergreifend: Der Cookie-Dialog ist in allen 4 Sprachen gleichwertig („Alle akzeptieren“ / „Weiter ohne Einwilligung“). Im Dev erscheint das Next-Dev-Abzeichen „N“, das gibt es im Prod-Build nicht.

## 5. Was der Inhaber vor dem Deploy liefern oder entscheiden muss

Vollständige Liste: `inhaber-offen.md`. Deploy-blockierend sind:

1. **Echtes Material für den Kern-USP (A.1/33):** datierte Handzeichnungen, Fotos der Mini-Modelle, mindestens 1 bis 3 Projektketten Skizze → Modell → Rendering → Foto, Porträt von Harald (46), alles mit Freigaben. Ohne dieses Material ist ein Score ≥ 9 laut Release-Rat nicht erreichbar.
2. **Kanzlei-Freigabe** von Datenschutzerklärung und Impressum (B.5/B.6, 22, 35, 44). Dazu **WKO-Auszug** und **Blattlinie** (34), außerdem die Antwort zu „Innenarchitektur“ (45).
3. **Minotti-Zustimmung** für den Sofaplaner-Katalog (C.10) und **Freigabe der Yacht-Bilder** (C.11). Bis dahin bleiben sie neutral bzw. weggelassen.
4. **Rechte an `aboutHome.jpg`** (A.2), Klärung, ob darauf Minotti-Möbel zu sehen sind, sowie die **og:image-Herkunft** (31).
5. **Betrieb:** Anthropic-Schlüssel und AVV (D.14), `UPLOAD_TOKEN_SECRET` und Umgebungsvariablen (D.15), keine Mock-Variablen (48), Mail-Dienst mit DPF/SCC (35), Upload-Frist plus `retentionConfirmed` (7).
6. **Externe NAP-Pflege** auf Landstraße 11 (32).
7. **Freigabe für Commit, Merge und Deploy (D.16).** Außerdem ein **Neustart des Dev-Servers** durch den Teamleiter, damit die Arbeitsweise-Redirects auch auf Dev greifen.

Nicht blockierend, aber offen: Showroom-Splat (E.17), Kalender (E.18/42), Referenzen und Projekte (E.19/E.20), 3D-Modelle (C.29), Fakten für die Stadtseiten (37), Raumfotos (53), Steuerberater für Dreiländer-Rechner und Schweiz-Hub (B.8/40).

## 6. Code-Arbeit für die nächste Fix-Runde (ohne Inhaber lösbar)

- **technik P0-1:** unbekannte Slugs nicht in den ISR-Cache schreiben (z. B. Proxy-Prüfung gegen die bekannten Marken-/Kategorie-/News-Slugs mit Rewrite auf die vorgerenderte 404, Slugs normalisieren bzw. Großschreibung per 308 umleiten).
- **seo/technik P1:** LCP mobil ≤ 2,0 s.
- **P2 IT-Hero:** Knopfbreite bzw. Zeilenumbruch für „Richiedete un appuntamento“ auf dem Desktop.

## 7. Empfohlene thematische Commits (auf `feature/neuauftritt`, nicht pushen)

Stand: 141 geänderte, 12 gelöschte und 254 neue Pfade (3 660 Dateien einschließlich Assets: `public/labs` rund 40 MB, `public/licht` rund 21 MB). Vorher den Patch C1 (Markenzahl) aus `00-abschluss.md` prüfen.

1. `chore(tooling)`: package.json/-lock (Next 16.4.1), eslint.config, .gitignore, `tools/**`, CI, `AGENTS.md`-Block von `next dev`
2. `test`: `tests/unit/**`, `tests/e2e/**`, playwright.config (einschließlich der Anpassungen aus diesem Endtest, siehe Abschnitt 3)
3. `feat(platform)`: next.config.js, `src/proxy.js`, `src/lib/seo/**` (deOnlyRedirects, labsMoves, Sitemap), Error-/404-Seiten, Instrumentation
4. `feat(i18n)`: `src/messages/*.json`, `tools/i18n/patches`
5. `feat(shell)`: Navbar/Mega-Menü, Footer, Cookie-Dialog/Consent, Wow-Hero, Startseite (`src/components/Home`)
6. `feat(katalog)`: Marken, Kategorien, Produktseite, ShopCatalog, Katalog-A–Z (inklusive Dedupe-Fix)
7. `feat(werkzeuge)`: Küchenplaner, Sofaplaner (inklusive Kontextverlust-Fix), 3D-Ansicht, Stil-Finder, Bodensee-Licht, Dreiländer-Rechner, Concierge, Agent/MCP, ohne große Assets
8. `feat(ezarri)`: Ezarri-Welt, Konfigurator, Rechner (`src/lib/ezarri`, `src/components/Ezarri`)
9. `feat(portal-upload)`: Portal, Raumzwilling, Handy-Upload
10. `feat(content)`: Arbeitsweise, Yacht, Outdoor, Landing- und Stadtseiten, Ratgeber, News, Karriere, Team
11. `feat(leads-recht)`: Formular-APIs, Beratung/Kontakt, Recht-Vorschau, Commerce/Gutscheine (Schalter aus), Schweiz-Hub
12. `assets`: `public/labs/**`, `public/licht/**`, `public/bilder/**`, getrennt wegen der Größe (vorher Git-LFS prüfen)
13. `docs`: `Marktresearch/**`, `qa-screenshots/**/*.md` (Screenshots selbst eher nicht einchecken)

## 8. In diesem Endtest geänderte Dateien

- Code: `src/app/[locale]/produkte/[category]/page.js`, `src/components/Labs/Sofaplaner/Planner.js`, `src/components/Labs/Sofaplaner/Preview3D.js`
- Tests (jeweils mit Begründungskommentar „Endtest 29.10.2026“): `tests/e2e/helpers.js`, `r4-portal-labs`, `r5-perf-shell`, `r6-produkt`, `r6-shell-perf`, `r7-p1-shell`, `r7-p6-release`, `r8-wow-webkit`, `r9-p1-marken-prod`, `r9-p2-arbeitsweise-i18n`, `errors`
