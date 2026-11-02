# Integration: Labs aufgelöst, Neuland eingebunden (Inhaber-Entscheidung Nr. 9)

**Stand:** 28.10.2026 · Branch `feature/neuauftritt` (nichts committet, nichts deployt) · Integrations-Lead

Grundlagen: Inhaber-Entscheidungen Nr. 7 (Ezarri), Nr. 8 (Kern-USP Handzeichnung) und Nr. 9 (keine Labs-Welt). Dazu Usability-Gutachten 3.1/3.6, SEO-Gutachten (seo-tech P1 „Entscheidung 9“), USP-Durchdringungsplan, Expertenrat-Gesamturteil (P0) und Wachstumsplan §4 (W1–W9).

---

## 1. URL-Tabelle alt → neu

Alle alten URLs leiten mit **308** um, für alle vier Sprachpräfixe. Unterpfade und Query bleiben erhalten. Die Quelle ist eine Tabelle in `src/lib/seo/labsMoves.cjs`, die `next.config.js` als `...labsRedirects()` lädt. Umgeleitet wird nur **mit Sprachpräfix**, weil `public/labs/*` (Texturen, 3D-Modelle, Hub-Bilder) statische Dateien sind und an ihrem Ort bleiben.

| Alt | Neu | robots | Sitemap / llms.txt | Begründung |
|---|---|---|---|---|
| `/de/labs` | `/de/leistungen` (Hub „Planen & Erleben“) | index | ja | Usability 3.6 („/labs → /leistungen“) |
| `/de/labs/kuechenplaner` (+ `/druck`) | `/de/kuechenplaner` (+ `/druck`) | index (Druck: noindex) | ja | Suchbegriff „Küchenplaner online“ (SEO-Gutachten) |
| `/de/labs/sofaplaner` (+ `/katalog/*`, `/teilen`) | `/de/sofaplaner` | index | ja | |
| `/de/labs/stilfinder` (+ `/ergebnis/*`) | `/de/stil-finder` | index (Ergebnis: noindex) | ja | Schreibweise wie der Produktname „Stil-Finder“ |
| `/de/labs/ar-viewer` (+ `/[produkt]`, `/uebergabe`) | `/de/3d-ansicht` | index (Einzelansicht: noindex, follow) | ja | Usability 3.6, Suchwort „3D“. Nicht `/raum-ansicht`: Das hätte sich mit „Ihr Raum“ im Portal (N2) verwechseln lassen |
| `/de/labs/dreilaender` | `/de/dreilaender-rechner` | index | ja | |
| `/de/labs/concierge` | `/de/concierge` (zusätzlich seitenweit als schwebender Knopf) | index | ja | |
| `/de/labs/upload-demo` | `/de/upload` (Service-Seite; `/de/upload/<token>` unverändert) | **noindex** | nein | SEO-Gutachten: Upload, Portal und Druckansichten bleiben noindex |
| `/de/labs/<unbekannt>`, `/en|fr|it/labs/*` | `/de/leistungen` bzw. das deutsche Ziel | – | – | Vorher 404 |
| `/de/portal`, `/de/portal/raum` (N2) | unverändert | noindex (Login) | nein | |
| `/de/yacht-interior` | unverändert | **index (neu)** | **ja (neu)** | Bild weglassen statt Seite verstecken (Nr. 9), siehe §5 |
| `/de/outdoor-gartenplanung` | unverändert | noindex | nein | Rechtsprüfung GewO/Gewerke steht aus (Marktresearch/30 §8) |
| `/de/ezarri/**` | unverändert | **index (neu, `EZARRI_PUBLIC = true`)** | ja (Hub, Welten, 14 Kollektionen, 281 Mosaike) | Nr. 7. Filter-, Vergleichs- und Teilen-Seiten bleiben noindex, follow |
| `/de/arbeitsweise` | unverändert | noindex, follow | nein | `robotsForLaunch()`: indexierbar erst mit Haralds echtem Material, keine Platzhalter live |
| `/[locale]/showroom` (N1) | unverändert | Dev: Vorschau noindex · Produktion: 404 | erst mit Aufnahme (`showroomSitemapPaths()`) | Keine Aufnahme, kein Platzhalter live |
| `/de/bodensee-licht` (N4) | unverändert | index | ja | |
| `/de/ki-assistenten` (N3) | unverändert | index | ja | |

Die Werkzeug-Seiten gibt es nur auf Deutsch. EN/FR/IT liefern 404, deshalb tragen sie keine hreflang-Alternativen, nur das Canonical auf sich selbst. Der Showroom-Rundgang ist die Ausnahme: Er ist viersprachig und hat hreflang.

**Code verschoben** (der Ordner war nicht in Git, deshalb `Move-Item` statt `git mv`): `src/app/[locale]/labs/{kuechenplaner,sofaplaner,stilfinder,ar-viewer,dreilaender,concierge}` → `src/app/[locale]/{kuechenplaner,sofaplaner,stil-finder,3d-ansicht,dreilaender-rechner,concierge}`. Außerdem `labs/upload-demo/page.js` → `upload/page.js` und `labs/page.js` → `leistungen/page.js`. Der Ordner `labs/` ist gelöscht. Die Komponenten bleiben unter `src/components/Labs/**` (interner Pfad) und die APIs unter `/api/labs/*` (nicht öffentlich verlinkt).

## 2. Menü (7 Hauptpunkte)

`src/components/Navbar/shellNav.js`. Leitlinien aus Usability 3.1: höchstens 7 Punkte, jede Option hat einen festen Ort, Werkzeuge stehen dort, wo die Aufgabe ist.

| Punkt | Inhalt (DE) |
|---|---|
| Wohnen | Produktgruppen + Spalte **Ideen & Planer**: Sofa zusammenstellen (Sofaplaner), Stil-Finder; dazu „Wohnzimmer einrichten“ |
| Küche | Küchen + Planung: Küchenplanung, **Küchenplaner online**, Beratung |
| Schlafen | unverändert |
| **Outdoor & Pool** (kurz „Outdoor“ unter 1440 px) | Möbel für draußen, Outdoor-Planung, Spalte **Pool, Bad & Wellness**: Ezarri Glasmosaik, Mosaik-Übersicht, Pool-Konfigurator, Mosaik für den Pool. Erscheint nur, wenn `EZARRI_PUBLIC` an ist |
| Marken | unverändert |
| **Planen & Erleben** (kurz „Planen“, ersetzt „Leistungen“, Hub `/leistungen`) | **Planung:** Beratung & Termin, Unsere Arbeitsweise, Interior Design, Yacht-Interior · **Online planen:** Küchenplaner, Sofaplaner, Stil-Finder (als Zweitverweis), Bodensee-Licht, 3D & AR ansehen · **Erleben & Service:** Showroom-Rundgang (nur mit Aufnahme), Fotos per Handy senden, Dreiländer-Rechner, KI-Concierge, Mein Platzhirsch, Ratgeber |
| Das Haus | unverändert |

- Einen Punkt „Objekte / Hotel & Contract“ gibt es nicht, weil die Seite fehlt (W4, siehe §8). Yacht steht deshalb unter „Planen & Erleben“.
- EN/FR/IT: „Planen & Erleben“ heißt „Plan & Experience“, „Planifier & découvrir“ und „Progettare & scoprire“. Diese Menüs verlinken nur Beratung und, sobald die Aufnahme vorliegt, den Showroom-Rundgang. Deutsche Werkzeugseiten verlinken sie nicht, weil sie dort 404 liefern.
- Der Footer übernimmt aus „Planen & Erleben“ nur die Hauptorte der Links, also keine `shared`-Doppelungen.
- Portal-Navigation (N2): neuer Punkt **„Ihr Raum“** → `/de/portal/raum` (`src/components/Portal/Core/navItems.js`, Text `Portal.nav.room` in vier Sprachen).

## 3. Feature-Schalter (standardmäßig AN)

| Schalter | Vorher | Jetzt | Aus |
|---|---|---|---|
| `NEXT_PUBLIC_FEATURE_*` (`src/lib/features.js`, 14 Features) | Produktion aus | **an in jeder Umgebung** | `=0` beim Build |
| `NEXT_PUBLIC_WOW_HERO` (`Home/Hero.js`) | Produktion aus | **an** | `=0` |
| `NEXT_PUBLIC_CONCIERGE_SITEWIDE` (`client-layout.js`, `Concierge/flags.js`) | Produktion aus | **an** (Sprachen in Produktion weiter nur DE, `NEXT_PUBLIC_CONCIERGE_LOCALES`) | `=0` |
| `EZARRI_PUBLIC` (`src/lib/ezarri/config.js`) | `false` | **`true`** | `false` setzen |
| `EZARRI_ANFRAGE_BACKOFFICE` (`api/ezarri/anfrage/versand.js`) | `false` | **`true`** (Freischalt-Sperre verlangt es; wirkt nur in Produktion ohne `EZARRI_ANFRAGE_DRY_RUN`) | `false` + `EZARRI_PUBLIC=false` |
| `SHOWROOM_SWITCH` | an | an; öffentlich erst mit Aufnahme | – |
| `NAVETTA_RELEASED` (neu, `src/lib/yacht/navetta.js`) | – | `false` | Freigabe: `true` + Ordner nach `public/` |

Schalter mit eigener Regel: Ezarri und Showroom erscheinen nur verlinkt, wenn die Zielseite ausgeliefert wird (`navFeatures()` in shellNav.js). Statusplaketten („Labs-Prototyp“, „Beta“) und Schalternamen sind aus der Kundenansicht entfernt (Usability B4, P0-15).

## 4. Startseite und Querverlinkung

- **Wow-Einstieg** ist standardmäßig an.
- **USP-Kapitel** „Von Hand gezeichnet, bevor es digital wird.“ (`src/components/Home/Process.js`, `HomePage.process.*` in DE/EN/FR/IT). Es steht als helles Band vor „Haus & Café“, wie in USP-Plan 1.1 vorgeschlagen, und zeigt die 7 Schritte mit Link zur Arbeitsweise. Am Handy erscheinen nur die Schrittnamen, um die Seite kurz zu halten. Ein Bild gibt es erst mit echtem Material.
- **Feature-Abschnitt** „Planen & Erleben / Vorab ausprobieren“ mit 4 Karten. Ganz unten steht der Link „Alle Werkzeuge“ → `/leistungen`.
- **Produktseite** (nur DE, `src/lib/crossSell.js` + `PlanLinks`): Jedes Produkt → 3D & AR. Minotti-Sofa/Sessel/Daybed → Sofaplaner. Küche → Küchenplaner + Bodensee-Licht. Outdoor → Outdoor-Konzept. Liegen/Lounge → Ezarri-Pool. Dazu der Brückensatz „Online starten – Harald zeichnet …“.
- **Markenseite**: Minotti → Sofaplaner, Küchenmarken → Küchenplaner, Ezarri → Ezarri-Welt, alle Marken → 3D/AR (gefiltert nach Marke).
- **Landingpages**: Küchen Vorarlberg mit dem Schritt „Von Hand gezeichnet“, der FAQ „Kann ich meine Küche erst online planen?“ und Links zu Arbeitsweise, Küchenplaner und Bodensee-Licht. Interior Design, Möbel Bodensee und Wohnzimmer bekommen Links zu Arbeitsweise und den passenden Planern.
- **Brücke Werkzeug → Mensch** (`src/components/Reusable/HandBridge.js`) auf Küchenplaner, Sofaplaner und Stil-Finder. Als Qualitätsversprechen steht sie auch auf Yacht, Outdoor und Ezarri-Hub, auf dem Ezarri-Hub mit eigenem USP-Kapitel (USP-Plan 11.1).
- **Arbeitsweise** Schritt 2 → Bodensee-Licht, mit Wintermorgen 21.12., 08:30.
- **N3**: WebMCP seitenweit über eine Zeile in `client-layout.js`, außerdem ein Eintrag in `/llms.txt`.

## 5. Rechtlich noch nicht öffentlich: so gelöst

| Thema | Lösung in der Seite |
|---|---|
| Minotti/Custom-Line-Fotos (Navetta 42) | Das Kapitel ist ausgeblendet (`NAVETTA_RELEASED = false`) und die Kopien sind aus `public/labs/yacht/minotti-navetta42/` gelöscht, damit sie nicht per URL abrufbar sind. Die Originale liegen unverändert in `Herstellermaterial/Minotti/yacht-navetta42/`. Die Seite selbst ist indexierbar. |
| Herstellerbilder ohne Freigabe auf Werkzeugseiten (P0-8) | `X-Robots-Tag: noimageindex` für `/de/3d-ansicht/*`, `/de/sofaplaner/*`, `/de/stil-finder/*`, `/labs/ar-viewer/*` |
| Planer-Versand (Datenschutzabschnitt „Online-Planer“ fehlt) | Sofaplaner in Produktion: Statt eines Formulars, das nichts sendet, führt „Mit diesem Plan Beratung anfragen“ zur Beratung, die live ist (`?produkt=`). Der Küchenplaner bleibt wie gebaut (`sendReleased()`). |
| Preise | Es werden keine Beträge gezeigt. „vom Inhaber festzulegen“ ist ersetzt durch „Richtpreis auf Anfrage“ bzw. „Richtwert – die genauen Kosten nennen wir auf Anfrage“. |
| Outdoor | Die Seite bleibt noindex, bis die Rechtsprüfung (GewO) abgeschlossen ist. Sie ist im Menü erreichbar. |
| Showroom, Arbeitsweise | Kein Platzhalter live: Der Showroom liefert in Produktion ohne Aufnahme 404, die Arbeitsweise bleibt bis zum echten Material noindex. |

## 6. Texte (`src/messages/*.json`)

- Übernommen mit `tools/i18n/merge.mjs`: `features/arbeitsweise-`, `showroom-`, `wow-`, `ezarri-`, `upload-` und `stripe-messages-vorschlag.json`. `normalizeProposal()` versteht jetzt auch die flache Ezarri-Form (`"ezarri.c.rechner.title": {de,en,fr,it}`).
- Die Übersetzungen EN/FR/IT für die DE-only-Vorschläge (payments, 14 Ezarri-Schlüssel, 4 Upload-Testhinweise) stehen in `teamleiter/messages-integration-vorschlag.json`. Widerruf und Bedingungen sind als vorläufiger Rechtstext markiert (`legal-keys.json`); verbindlich macht sie die Kanzlei.
- Nachgeschärft: IT einheitlich „tu“ (Arbeitsweise, Ezarri, Wow-Coda). FR ohne Prüfwörter („uniquement“ → „seulement“). Wow-Konflikte zugunsten der neueren Wow-Fassung gelöst. Die ungültige ICU-Stelle `<LAN-IP>` ist korrigiert, auch im Upload-Vorschlag.
- Neu: `Shell.nav.*` (Menü), `HomePage.process.*`, `Portal.nav.room`. Faktenregister: 8 Belege in `tools/content/facts.core.json`, zum Beispiel C2TE, 402 Mosaike, 14 Tage FAGG, 30 Jahre ABGB.
- Ergebnis: Parität 0 Befunde, Faktencheck `--strict` 0 unbelegt, alle Vorschlagsdateien 0 fehlend.

## 7. Restpunkte Wow und Ezarri

| Abnahme | Punkt | Erledigt |
|---|---|---|
| Wow 3 | Cookie-Banner erst nach `ph:wow-done`: einheitlich, höchstens 9 s (`useAfterIdle` in `client-layout.js`) | ja |
| Wow 4 | Handy-Lücke von etwa 250 px: Die Coda steht ab dem ersten Bild, nur ihr Link blendet ein | ja |
| Wow 5 | Handy-Linienstärke am Höhepunkt halbiert (`--core` 1,9 → 0,95 px) | ja |
| Wow 6 | Desktop-Horizontlinie in Ruhe ausgeblendet | ja |
| Wow 7 | „Die Linie zeigen“ am Handy kleiner (Chip 30 px, Trefferfläche 44 px bleibt) | ja |
| Wow 1, 2, 8 | Haralds Strich (Phase B), Freigabe, Prod-LCP-Wache | offen (Inhaber bzw. Prod-Build) |
| Ezarri Welt 2 | EN/FR/IT-Sprachlinks auf 404: `ezarri` als „nur Deutsch“ eingetragen | ja |
| Ezarri Welt 3 | Merkliste mit Bild (`toEzarriWishlistItem`, `wishlistImageSrc` kennt `/ezarri/`) | ja |
| Ezarri Welt 5 | HTML von `/de/ezarri/mosaike`: Die Insel bekommt nur noch benötigte Felder (Dev 778 → 740 KB); Messung im Prod-Build offen | teilweise |
| Ezarri | Menü-Link nur mit `EZARRI_PUBLIC`, Händler-Aussage im Claim-Register | ja |
| `public/ezarri` (~560 MB) | in `.gitignore`. Der Deploy verlinkt `shared/public-ezarri` (`scripts/deploy.sh` bricht ohne den Ordner ab). Kopie einmalig per `robocopy public\ezarri <server>\shared\public-ezarri /MIR` oder `rsync -a public/ezarri/ server:/…/shared/public-ezarri/` | ja (Kopie selbst: Deploy-Team) |

## 8. P0 Expertenrat und Wachstumsplan W1–W9

| Punkt | Status |
|---|---|
| P0-7 Navetta-Bilder öffentlich · P0-8 noimageindex · P0-15 interne Texte · P0-16 Entscheidung 9 · P0-17 Ezarri (Claim-Register, ein führender Schalter) · P0-20/W5 USP auf Startseite, Planern, Geschäftsfeldern · P0-21 /projekte (weiter noindex, nicht in Menü/Sitemap) · W6 Ezarri live · W9 Yacht indexierbar | **erledigt** |
| P0-13/14 Planer-Versand | Sofaplaner übergibt an die Beratung. Echter Versand der Planer folgt erst nach dem Datenschutzabschnitt „Online-Planer“ (`NEXT_PUBLIC_LABS_PLANER_SENDEN=1`) |
| P0-1/W1 Next 16.3.8 → ≥ 16.4.1 | **offen.** Paket-Update bei laufendem Dev-Server und ohne Build im Repo nicht sicher prüfbar; zuerst im prodtest |
| P0-3 Release-Gate (Build, Crawl, axe) | offen (prodtest-Lauf vor Deploy) |
| P0-4/5/6/22 Datenschutz, Cookie-Texte, Double-Opt-in, Barrierefreiheit | Anwalt/Backoffice |
| P0-9 Herstellerbilder ohne Freigabe · P0-11 NAP · P0-12/W3 Termin-Buchung | Inhaber |
| P0-10 Stadtseiten-Fakten · P0-18/W1 Suche `q` · P0-19 Produktseiten-ISR · W2 Anfrage mit Thema · W4 Hotel-Seite + Menüpunkt „Objekte“ · W7 Produktseiten-Vorlagen · W8 Küchenplaner-Normen | offen (eigene Pakete, zu groß für diese Phase) |

## 9. Tests: bewusst geänderte Erwartungen

Jede geänderte Stelle trägt im Test den Kommentar „Integration 28.10.2026 (Inhaber-Entscheidung Nr. …)“.

- `labs-hub` (Unit + E2E): Schalter standardmäßig an, 308-Tabelle, 7 Menüpunkte, `/leistungen` indexierbar, keine Plaketten.
- `ezarri-basis`, `-welt`, `-rechner` (Unit), `ezarri-welt/-konfigurator/-rechner` (E2E): Ezarri ist an und indexierbar, die Händler-Aussage ist sichtbar.
- `claims`: Ezarri im Register (Nr. 7).
- `yacht-fix2`, `r4-seo`, `sitemap`, `llms`, `yacht-werfthalle`: Yacht ist indexierbar. Das Navetta-Kapitel ist ausgeblendet, der Navetta-Test übersprungen (mit Grund).
- `seo`, `smoke`, `r4-portal-labs`, `r5-portal-labs`, `labs-dreilaender`, `ar-viewer-sortiment`: neue Pfade, Werkzeugseiten indexierbar, Upload noindex.
- `wow-paths`, `concierge-launcher-size`: Schalter standardmäßig an.
- `r3-startseite`, `labs-hub`: Hauptinhalt mobil < 9 800 px (vorher 9 300), weil das USP-Kapitel etwa 350 px braucht. Neu geprüft wird die ganze Seite < 13 000 px (Ziel aus r3-R3-startseite.md), der Footer misst heute 2 018 statt 3 413 px.
- `r3-portal-flat`: Ordner `/upload`, N2-Pins und Aufnahmepunkt erlaubt. `messages-feinschliff`: Pfad `sofaplaner`.
- Vorher schon rot und jetzt grün: `messages-feinschliff` (Vorschläge übernommen), `r3-portal-flat` (N2), `r6-leads-fix` (zod jitless in `raumzwilling/platzierung.js`).

**Ergebnis der Läufe (Dev-Server :3000, `PW_WORKERS=1`):** Unit 1 245, alle grün, darunter die vorher roten. Lint der geänderten Dateien sauber. E2E Desktop: Batch A (labs-hub, seo, smoke, Portal/Labs, Dreiländer, Yacht, Ezarri-Welt/Rechner, Wow, Startseite, Shell, Concierge) mit 198 bestanden, 10 übersprungen. Batch B (Planer, AR, Stil-Finder, Upload, Licht, Showroom, Agent, Raum, Ezarri-Konfigurator, Produkt) mit 175 bestanden, 1 übersprungen. Die einzelnen Fehlschläge sind behoben und nachgeprüft: die neue Upload-Seite, die Druckblatt-Robots und alte `/en/labs`-404-Erwartungen. `seo › meta /de/ueber-uns/marken` war ein Ausreißer des Backoffice, beim zweiten Lauf grün. Die Telefon-Projekte (iphone/pixel) sind nicht gesondert gelaufen; die Mobil-Prüfungen in labs-hub und wow-hero laufen im Desktop-Projekt mit Gerätemaßen.

**Sichtprüfung:** `node tools/qa/shoot.mjs qa-screenshots/fertig/integration` auf /de, /de/leistungen, /de/kuechenplaner, /de/sofaplaner, /de/yacht-interior, /de/ezarri, /de/upload und /en, jeweils iPhone, Android, iPad und Desktop: 32/32 mit Status 200, 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein Querscroll.

## 10. Offen

1. **Inhaber:** Deploy-OK. Haralds echtes Material (Skizzen, Modelle, Porträt) für Arbeitsweise, Wow Phase B und Team-Seite. Die Showroom-Aufnahme. Den Titel „Designer & Zeichner“ und „60 Minuten · kostenlos“ bestätigen (steht in der Bibel, Bestätigung offen). Die Entscheidung zur Termin-Buchung.
2. **Anwalt:** Datenschutz-Abschnitte für Planer-Versand, Raumzwilling (N2) und Terminwunsch per KI-Assistent (N3). Danach `NEXT_PUBLIC_LABS_PLANER_SENDEN=1` und `PRIVACY_TEXT_APPROVED`. Außerdem die EN/FR/IT-Fassungen der Widerrufstexte und die Outdoor-Rechtsprüfung.
3. **Vor dem Deploy:** Ezarri-Testanfrage im Backoffice prüfen (`create_anfrage`), den Wortlaut der Ezarri-Händleraussage mit dem Vertrag abgleichen und `shared/public-ezarri` anlegen. Next ≥ 16.4.1, dann Prod-Build, Crawl und Lighthouse im prodtest, dazu Wow-Prod-LCP und HTML-Gewicht `/de/ezarri/mosaike`.
4. **Code, nächste Pakete:** Hotel-/Contract-Seite mit Menüpunkt „Objekte“ (W4). Suche mit `q` (W1/P0-18). Anfrage mit Thema/Anlass (W2). Upload-Kategorie „Raumvideo“ (N2, braucht UI, Texte und Tests im Upload-Paket). Bodensee-Licht als Szene in Küchenplaner, Ezarri-Pool und Portal-Planung (heute nur verlinkt, Code-Beispiel in neuland.md §5.6). Werkzeugseiten auf EN/FR/IT übersetzen (heute nur DE).
