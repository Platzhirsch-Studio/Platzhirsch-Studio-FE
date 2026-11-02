# Teamleiter – Runde 6 (Schlussrunde): Plan

Stand: 26.10.2026, ca. 17:10 MEZ, Branch `feature/neuauftritt`. Nichts wird committet, gepusht oder deployt. Keine echten Zahlungen, Mails oder Veröffentlichungen.

## 1. Lage (Monitor localhost:4545)

| Workflow | Status | Folge |
|---|---|---|
| platzhirsch-teamleiter-bis-fertig | läuft (diese Planung) | – |
| alle anderen 14 Workflows | **fertig** | keine gesperrten Dateien |
| Runde 5 (9 Pakete) | fertig, Noten 8–9/10 | Prod-Lauf `r5-fix`: **519 grün / 2 rot / 2 flaky**, Claims 910 URLs ohne Fund, NAP nur Hausnummer 11, 0 × static-to-dynamic. **Release-Tor rot** (2 Tests, TBT-Budget, leeres Bildband) |

Runde 6 ist die letzte Runde. Ziel: **Release-Tor im Code grün** (0 rot, TBT-Budget, keine offenen P2 mit Besitzer „Code“), **eine Textquelle ohne offene Vorschläge** und eine **Übergabemappe**, mit der der Inhaber nur noch Freigaben erteilen und Schalter setzen muss.

**Bewusst nicht in Runde 6:** Next 16.4.2. Es ist erst ab 30.10.2026 erlaubt (14-Tage-Regel). R6-release schreibt dafür ein fertiges Ablaufblatt; ausgeführt wird es nach dem 30.10. außerhalb dieser 6 Runden (Inhaber-Frage).

## 2. Offene Punkte (aus r5-*.md, release-check.md §R5.5–R5.7)

**Release-Tor (Code):**
- `r5-schweiz.spec.js:32/39`: Locator ohne `{ exact: true }` (rot auf Dev und Prod).
- `labs-kuechenplaner.spec.js:42` rot (Klick auf die Cookie-Leiste läuft in Timeout), `:62/96` flaky.
- TBT mobil (Budget 200 ms, `r5-fix`): `/de` 214, `/de/produkte` 211, Minotti 240, Produktseite 296, `/de/kontakt` 366, `/de/produkte/lamps` 460 ms. Laut CPU-Profil von R5-leads-perf liegt der Hauptanteil auf `/kontakt` in Hülle/Layout (Formular ca. 2 ms).
- Leeres Bildband unter dem Hero (Küchen, Yacht, Outdoor, Schweiz-Hub, `LandingHero` in `src/components/Landing/parts.js`). Ohne Fotofreigabe: **Band weglassen** (Teamleiter-Entscheidung, kein Inhaber nötig).
- `/cmx`-404 ohne `Cache-Control: no-store` in der Route selbst (`src/app/cmx/[...path]/route.js:43`).
- `src/lib/forms/schemas.js` ohne `config({ jitless: true })` → zod-`eval` würde eine erzwungene CSP verletzen.
- `"framer-motion": "12.43.0"` exakt in `dependencies` deklarieren (Lockfile hat die Version, Wächter-Test in `r5-portal-labs.test.mjs`).
- `"check:facts"` in `package.json`, ESLint-Warnregeln (Gold-Text, Händler-Strings) auf `error`, `check-claims.mjs` `EXTRA_PATHS` für den Schweiz-Hub.

**Texte:**
- `messages-r5-leads.json` (`forms.selfReport.*`) und `messages-r5-shell.json` (`Navbar.searchRateLimited`, `Navbar.searchError`, „Startseite“ für `marken.breadcrumbHome`, `brandCategory.breadcrumbHome`, `landing.home`) sind **nicht übernommen**. `messages-r5-portal.json` und `messages-r5-produkt.json` sind übernommen (R5-i18n).
- `check-facts --strict` endet mit Exit 1: `Home.trust1` „Über 35 internationale Marken“ (kein Beleg), `presse.magazines.3` „2022“, `Vernissage.time` 17:00 (je 4 Sprachen).
- „exklusive“ in der CMS-Meta, „Catalogo Prodotti“ hart in `produkte/page.js:19`.

**Shell / A11y / SEO:**
- Sprachumschalter auf DE-only-Seiten (Ratgeber, Projekte, Schweiz, Commerce) führt in EN/FR/IT auf 404.
- Globale 404 (`/wp-login.php`) in Systemschrift statt Bodoni/Instrument Sans.
- OG-Locale: Kontakt, Beratung, News, Karriere, Partner, Presse, Platzhirsch, Datenschutz, Impressum, Newsletter, `Landing/landingPage.js` setzen eigene Werte statt `ogLocale(locale)`.
- Tote Datei `Reusable/FadeInView.js` samt Testfall, Merkliste-Hero q=50, `ConsentEmbed` ohne Text/Icon-Props (YouTube-Platzhalter zeigt Kartensymbol).
- Schweiz P3-3: Lead unter dem CTA mobil (gemeinsamer `LandingHero`).

**Portal / Labs:**
- Demo-Banner sagt im Prod-Build „lokale Entwicklungsumgebung“ (N7).
- Portal mobil: Tab-Leiste und Cookie-Leiste überlagern sich (31 % Höhe).
- Server-Actions-DoS (bis Next 16.4.1+): Portal bleibt aus; zusätzlich App-seitige Bremse prüfen.

**Übergabe:** Es gibt keine zusammengefasste Übergabemappe (Schalter, Umgebungsvariablen, Freigabelisten, Ablaufblatt Next 16.4.2, Deploy-Reihenfolge).

## 3. Pakete Runde 6 (Dateien exklusiv, nur R6-release darf installieren)

| ID | Paket | Wirkung | Dateien (exklusiv) |
|---|---|---|---|
| R6-i18n | Übernahme `messages-r5-leads/shell.json`, check-facts-Lücken schließen, letzte Textreste, Schlussprüfung eine Textquelle | 0 offene Vorschläge, `check:facts --strict` grün | `src/messages/*.json`, `src/i18n/**`, `tools/i18n/**`, `tools/content/facts*.json`, `tools/content/build-facts.mjs`, `Marktresearch/digital/teamleiter/messages-r[1-5]-*.json` (lesend; `messages-r6-<paket>.json` gehört dem jeweiligen Paket), `tests/unit/r6-i18n*.test.mjs`, `qa-screenshots/teamleiter/r6-i18n/**` |
| R6-shell-perf | TBT `/de` und Hülle ≤ 200 ms (wirkt auf `/kontakt` und alle Seiten), Sprachumschalter DE-only, globale 404-Schrift, FadeInView weg, Merkliste-Bild, ConsentEmbed-Props | Budget für die Hülle, keine Sackgassen | `src/app/[locale]/{layout.js,client-layout.js,LoaderWrapper.js,not-found.js,error.js,page.js}`, `src/app/{not-found.js,global-error.js,layout.js,globals.css}`, `src/components/{Navbar,Reusable,ui,Cookies,Home,NotFound,ProuductSectionHome,WhyChooseUsSectionHome}/**`, `src/app/[locale]/merkliste/**`, `src/components/CartPage/**`, `src/lib/site.js`, `src/lib/seo/**`, `tests/unit/{r6-shell*,r3-shell,r5-shell-seo}.test.mjs`, `tests/e2e/r6-shell*.spec.js`, `qa-screenshots/teamleiter/r6-shell-perf/**` |
| R6-produkt-perf | TBT `/de/produkte/lamps` (460) und Produktseite (296) ≤ 200 ms, `/de/produkte` und Marke unter 200, „Catalogo prodotti“ | Budget auf den 7 000+ Katalogseiten | `src/app/[locale]/produkte/**`, `src/components/{ShopCatalog,BrandCategory,MarkenItems,MarkenClient}/**`, `src/app/[locale]/ueber-uns/marken/**`, `src/lib/{shop,data,productCopy,api,marken}/**`, `tests/unit/r6-produkt*.test.mjs`, `tests/e2e/r6-produkt*.spec.js`, `qa-screenshots/teamleiter/r6-produkt-perf/**` |
| R6-leads | zod `jitless` (CSP-fähig), CSP-Absende-Probe, OG-Locale der Lead-Seiten, Fallback `SELF_REPORT_TEXT` nach Übernahme dünn machen | Formulare tragen eine erzwungene CSP | `src/components/{Forms,BeratungClient,Beratung,AnfrageFormProduct,Newsletter,Kontakt,Event,Booking}/**`, `src/app/[locale]/{kontakt,beratung,newsletter,adventsabend,bewerten}/**`, `src/lib/forms/**`, `src/lib/{attribution,analytics}.js`, `src/app/api/{kontakt,beratung_anfrage,anfrage_produkt,newsletter_subscribe}/**`, `tests/unit/{r6-leads*,r4-leads,r5-leads,forms-leads}.test.mjs`, `tests/e2e/r6-leads*.spec.js`, `qa-screenshots/teamleiter/r6-leads/**` |
| R6-landing-inhalt | Leeres Bildband weg, Lead/CTA mobil im `LandingHero`, OG-Locale aller Inhalts- und Landingseiten, Doorway-Stand bestätigen | Kein unfertiger Eindruck auf 4 Landingseiten, saubere OG-Daten | `src/components/{Landing,Schweiz,News,NewsItem,Karriere,Partner,Presse,Team,UberUns,Ratgeber,Projects,Video,Datenschutz,Impressum}/**`, `src/app/[locale]/{kuechen-vorarlberg,yacht-interior,outdoor-gartenplanung,einkaufen-aus-der-schweiz,interior-design-vorarlberg,wohnzimmer-einrichten-vorarlberg,moebel-bodensee,designermoebel-*,news,ratgeber,projekte,ueber-uns/{karriere,partner,presse,platzhirsch,team},datenschutz,impressum,[slug],[...rest]}/**`, `src/lib/content/**`, `src/lib/ch/**`, `tests/unit/r6-landing*.test.mjs`, `tests/e2e/r6-landing*.spec.js`, `qa-screenshots/teamleiter/r6-landing-inhalt/**` |
| R6-portal-labs | Küchenplaner-Spec stabil (rot/flaky weg), Demo-Banner N7, Portal-Leiste vs. Cookie-Leiste, App-seitige Bremse für Server Actions | Release-Tor grün, Portal startklar für 16.4.2 | `src/app/[locale]/{portal,upload,labs}/**`, `src/components/{Portal,Upload,Labs}/**`, `src/lib/{portal,concierge,upload}/**`, `src/app/api/{portal,upload,labs}/**`, `tests/e2e/labs-*.spec.js`, `tests/e2e/{upload,r3-portal-upload,r3-portal-voice,r4-portal-labs,r5-portal-labs}.spec.js`, `tests/unit/{r6-portal*,r4-portal,r5-portal-labs}.test.mjs`, `Marktresearch/digital/features/*.md`, `qa-screenshots/teamleiter/r6-portal-labs/**` |
| R6-uebergabe | Übergabemappe für Inhaber/Kanzlei/Betrieb + Freigabe-Cockpit als noindex-Vorschau | Inhaber kann ohne Entwickler freigeben | `Marktresearch/digital/uebergabe/**` (neu), `src/app/[locale]/preview/freigaben/**` (neu), `src/components/Freigaben/**` (neu), `tests/unit/r6-uebergabe*.test.mjs`, `tests/e2e/r6-uebergabe*.spec.js`, `qa-screenshots/teamleiter/r6-uebergabe/**` |
| R6-release | `framer-motion` exakt deklarieren (einzige Installation), Skripte/ESLint-Tor, `EXTRA_PATHS`, `/cmx`-404 `no-store`, Schweiz-Spec, Prod-Läufe `r6-start`/`r6-ende`, TBT-Schlussmessung, Schlussabnahme, Ablaufblatt Next 16.4.2, Go-live-Liste final | Release-Tor grün, belegt in Produktion | `next.config.js`, `package.json`, `package-lock.json`, `playwright.config.js`, `eslint.config.mjs`, `.github/**`, `scripts/**`, `tools/{qa,checks,ci}/**`, `src/app/cmx/**`, `src/proxy.js`, `tests/e2e/*.spec.js` (alle, die keinem anderen R6-Paket gehören, inkl. `r5-schweiz.spec.js`, `helpers.js`, `global-setup.js`), `tests/unit/*.test.mjs` (alle, die keinem anderen R6-Paket gehören), `tests/README.md`, `Marktresearch/digital/teamleiter/release-check.md`, `qa-screenshots/teamleiter/r6-release/**` |

### Aufträge im Einzelnen

**R6-i18n**
1. `messages-r5-leads.json` und `messages-r5-shell.json` mit `tools/i18n/merge.mjs` übernehmen (4 Sprachen, IT „tu“, 0 Konflikte). Danach prüfen, dass in `Marktresearch/digital/teamleiter/messages-r*.json` **kein** Schlüssel mehr fehlt (Skript, Bericht als Tabelle). `Cookies.intro`/`thirdCountryNotice` bleiben ausgeschlossen (Anwalt).
2. check-facts-Lücken: `Home.trust1` – Zahl gegen die Markenliste in `src/lib` zählen. Gibt es keinen Beleg mit genau dieser Zahl, die Zahl streichen („Internationale Designmarken“ o. ä., 4 Sprachen). `presse.magazines.3` und `Vernissage.time` gegen Quelle (Presse-Material, Event-Daten) prüfen; belegbar → `facts.core.json` + `build-facts.mjs`, sonst neutralisieren. Ziel: `node tools/content/check-facts.mjs --strict` Exit 0. Nichts erfinden.
3. „exklusive“ in der CMS-Meta neutralisieren, Rohschlüssel-, Orphan- und Paritätsprüfung (`raw-keys`, `orphans`), `check:claims` 0.
4. Erst nach Abschluss von Punkt 1 im Bericht vermerken, damit R6-leads den Fallback dünn machen kann (R6-leads liest den Monitor bzw. die Messages).

**R6-shell-perf**
1. TBT der Hülle senken: CPU-Profil `/de` und `/de/kontakt` (Prod-Build in eigener Kopie außerhalb des Repos, z. B. `../ph-prod-r6-shell`, nach dem Muster von `prod-check.mjs`), dann Langläufer in `client-layout`/`LoaderWrapper`/Navbar/Cookies/Home lazy oder per `requestIdleCallback`. Ziel ≤ 200 ms mobil gedrosselt, Median aus 3 Läufen. Keine Änderung an Knopfnamen, Cookie-Name/-Format oder Banner-Texten (sha256-Snapshot aus R4 grün).
2. Sprachumschalter: Auf Seiten ohne Übersetzung (Ratgeber, Projekte, Schweiz, Commerce, Bewerten …) zeigen EN/FR/IT auf die jeweilige Startseite oder werden als „nur Deutsch“ deaktiviert dargestellt. Keine 404 aus dem Umschalter. hreflang bleibt unverändert.
3. Globale 404 und `global-error.js` mit Hausschriften (ohne `cookies()`/`headers()`, statische Auslieferung bleibt; logscan 0 × static-to-dynamic).
4. `Reusable/FadeInView.js` samt Testfall entfernen (grep 0 Leser), Merkliste-Hero-Qualität, `ConsentEmbed` mit `label`/`icon`-Props (YouTube-Fall), Merkliste-Bild.
5. axe + Lighthouse A11y `/de` mobil/desktop bleiben 100.

**R6-produkt-perf**
1. `/de/produkte/lamps` (Kachelraster) und Produktseite (Galerie): Profil im eigenen Prod-Build, Hydrations-Kosten senken (z. B. Server-Komponenten für statische Kacheln, Virtualisierung/Paginierung ohne SEO-Verlust – alle Produkt-Links bleiben im HTML, Lightbox und Galerie-Interaktion lazy). Ziel ≤ 200 ms mobil, Median aus 3 Läufen.
2. „Catalogo prodotti“ in `produkte/page.js`. Keine Änderung an Preisen („auf Anfrage“), JSON-LD ohne Bild bei Stücken ohne Foto bleibt.
3. axe ohne serious/critical auf Katalog, Produkt mit/ohne Bild, Marke, Marke × Kategorie.

**R6-leads**
1. `src/lib/forms/schemas.js`: `z.config({ jitless: true })` (bzw. die zod-4-API laut installierter Version prüfen). Probe: Prod-Build in eigener Kopie mit **erzwungener** CSP (nur in der Kopie, `next.config.js` im Repo bleibt Report-Only), Absenden auf Kontakt/Beratung/Produktanfrage mit abgefangenem Request → 0 CSP-Verstöße.
2. OG-Locale über `ogLocale(locale)` auf Kontakt, Beratung, Newsletter, Adventsabend, Bewerten.
3. Nach Übernahme durch R6-i18n: `SELF_REPORT_TEXT` und `LEADS_TEXT` auf dünnen Fallback reduzieren, Tests (`r4-leads`, `r5-leads`, `forms-leads`) gegen die Messages. Keine echten POSTs.

**R6-landing-inhalt**
1. `LandingHero` (parts.js): Ohne freigegebenes Bild **kein Bildband**, sondern typografischer Abschluss ohne Lücke. Mobil: Lead über/neben dem CTA so, dass der Lead nicht unter den Knopf rutscht (Schweiz P3-3). Gilt für Küchen, Yacht, Outdoor, Schweiz-Hub; Screenshots 4 Geräte.
2. OG-Locale über `ogLocale(locale)` in News, Karriere, Partner, Presse, Platzhirsch, Team, Datenschutz, Impressum (nur Metadaten, **kein Rechtstext ändern**), `Landing/landingPage.js`.
3. Doorway-Audit und Robots der Regionsseiten unverändert bestätigen (Test), Schweiz/Projekte/Ratgeber weiter noindex.

**R6-portal-labs**
1. `labs-kuechenplaner.spec.js:42/62/96`: Ursache (Cookie-Leiste überdeckt, Hydrations-Timing) beheben, in der Komponente oder im Spec über `helpers.js`-Muster (Banner per Cookie vorab schließen). 5 Läufe ohne Retry grün, Dev und Prod.
2. N7: Demo-Banner nur im Dev-Modus „lokale Entwicklungsumgebung“, im Prod-Build mit Demo-Sitzung „Demo-Zugang“ (Text über `tx()` + `messages-r6-portal.json`, falls neu – Übernahme dann im Bericht als Rest).
3. Portal mobil: Tab-Leiste über der Cookie-Leiste, Gesamthöhe ≤ 25 %, ohne Kürzung der Banner-Texte (Anwalt).
4. Server Actions (`Portal/{Docs,Messages}/actions.js`): App-seitiges Rate-Limit über die vorhandene Speicher-Abstraktion, Test. Portal bleibt bis Next 16.4.2 aus.

**R6-uebergabe**
1. `Marktresearch/digital/uebergabe/00-uebergabe.md`: Was ist fertig (Seitenarten, Features, Noten), was ist aus (Schalter `VOUCHER_MODE`, `ATELIER_MODE`, `COMMERCE_PREVIEW`, `NEXT_PUBLIC_LABS_PLANER_SENDEN`, Termin-Schalter, Portal, noindex-Seiten), alle Umgebungsvariablen mit Zweck (Werte nie eintragen), Freigabelisten nach Besitzer (Inhaber, Kanzlei, Steuerberater, Insolvenzrechtler, Betrieb) mit Datei/Zeile, wo die Freigabe technisch gesetzt wird, Deploy-Reihenfolge mit Verweis auf `release-check.md`. Quellen: alle `r*-*.md`, `release-check.md`, `inhaber-entscheidungen.md`, Rechtspaket. Keine neuen Fakten.
2. Freigabe-Cockpit `/de/preview/freigaben`: nur Dev oder `FREIGABE_PREVIEW=1` (sonst 404), `noindex, nofollow`, nicht in Sitemap/Navigation. Liest nur per Import: Ratgeber-Status und [prüfen]-Stellen, Produkttexte mit Freigabe-Status (`src/lib/productCopy/approvals.js`), Bildregister (`released`), Rechtsentwürfe (Vorschau-Links), Commerce-/Schweiz-Status. Keine Schreibfunktion, kein Formular. 4 Geräte, axe.

**R6-release (einziges Paket mit Installation)**
1. `"framer-motion": "12.43.0"` exakt in `dependencies` (Version laut Lockfile vorher prüfen, Alter > 14 Tage), `npm install --save-exact framer-motion@12.43.0` zuerst in isolierter Kopie, dann im Repo. `npm ls` sauber, Dev-Server :3000 nicht neu starten, per curl 200 belegen. **Kein Next-Update** (erst ab 30.10.).
2. `package.json`: `"check:facts": "node tools/content/check-facts.mjs --strict"`, in `check:prod` und CI aufnehmen. `eslint.config.mjs`: Gold-Text- und Händler-Regeln auf `error`, vorher 0 Funde belegen.
3. `tools/checks/check-claims.mjs` `EXTRA_PATHS`: Schweiz-Hub, Commerce-Vorschau, Projekte, Freigabe-Cockpit (nur bei gesetztem Vorschau-Schalter).
4. `src/app/cmx/[...path]/route.js`: 404 mit `Cache-Control: no-store`, Prod-curl-Beleg.
5. `tests/e2e/r5-schweiz.spec.js`: `{ exact: true }`.
6. `check:prod --label=r6-start` zu Beginn, `--label=r6-ende` erst, wenn laut Monitor alle anderen R6-Pakete fertig sind (Bau, QA, Fix). **Ziel r6-ende: 0 rot, 0 flaky**, Claims/NAP/facts 0, logscan 0. TBT-Schlussmessung auf ruhiger Maschine (keine parallelen Builds), Median aus 3 Läufen für `/de`, `/de/produkte`, Minotti, Produktseite, `/de/kontakt`, `/de/produkte/lamps`.
7. Schlussabnahme: `tools/qa/abnahme-urls.txt` um die R6-Seiten ergänzen, alle Seitenarten × 4 Sprachen × 4 Geräte, Bilder ansehen.
8. `release-check.md`: Ablaufblatt Next 16.4.2 (Befehle, Prüfschritte, Rückbau), Go-live-Liste final mit Haken je erledigtem Code-Punkt.

### Schnittstellen und Regeln

- **Messages:** Nur R6-i18n schreibt `src/messages/*.json`. Neue Texte anderer Pakete nur, wenn unvermeidbar, als `messages-r6-<paket>.json` mit `t.has()`/Fallback; R6-i18n übernimmt sie am Ende seiner Bauphase, falls sie bis dahin vorliegen, sonst Rest in der Übergabe.
- **Builds:** Kein Build im Repo. Perf-Pakete (R6-shell-perf, R6-produkt-perf, R6-leads) dürfen je **eine** Kopie außerhalb des Repos bauen und messen (Junction danach mit `rmdir` entfernen). Ihre Werte gelten als Richtwert; verbindlich ist die Schlussmessung von R6-release in `r6-ende`.
- **TBT-Budget:** Wird 200 ms auf einer Seite trotz Optimierung nicht erreicht, dokumentiert das Paket Profil und Ursache. Der Teamleiter legt dann in der Schlussabnahme fest, ob das Budget für diese Seite bewusst bei 250 ms liegt (kein Inhaber nötig).
- **Tests:** Jedes Paket schreibt `tests/unit/r6-<id>*.test.mjs` und `tests/e2e/r6-<id>*.spec.js` plus die in der Tabelle genannten Altverträge. Alle übrigen Specs/Unit-Tests gehören R6-release.
- **Inhalte:** Keine Händler-Behauptungen (nur ClassiCon), keine Superlative, keine erfundenen Fakten/Preise/Referenzen, keine „abgesicherte Anzahlung“. Rechtstexte live nicht ändern. Herstellerbilder ohne Freigabe nicht verwenden.
- **Prüfung für alle:** `node tools/qa/shoot.mjs <ordner> <url …>` auf 4 Geräten, Bilder ansehen. `npx eslint` eigene Dateien 0 Fehler, Unit-Suite grün, `npm run check:claims` ohne neue Funde, kein zweiter Dev-Server, WCAG 2.2 AA, reduced motion.

## 4. Begründung der Auswahl

1. **Release-Tor grün ist der größte Hebel.** Nach Runde 6 gibt es keine Teams mehr. Alles, was im Code rot ist (2 Tests, TBT, Bildband, `/cmx`-404, zod-eval, Paketdeklaration), muss jetzt einen Besitzer haben. Danach hängt der Go-live nur noch an Inhaber, Kanzlei, Betrieb und dem Next-Termin.
2. **TBT in drei Pakete geteilt, nach Ursache:** Hülle (wirkt auf jede Seite, Hauptanteil bei `/kontakt`), Katalog/Produkt (7 000+ Seiten), Formulare (CSP). Gemessen wird verbindlich einmal zentral, damit sich parallele Builds nicht gegenseitig verfälschen.
3. **Eine Textquelle ohne Reste:** Zwei R5-Vorschläge sind noch nicht übernommen, und `check-facts` ist rot. Unbelegte Zahlen sind ein UWG-Risiko und werden ohne Beleg entfernt statt behauptet.
4. **Kein unfertiger Eindruck:** Das leere Bildband steht auf vier Landingseiten. Die Fotofreigabe kann später kommen, bis dahin ist der typografische Hero der saubere Weg.
5. **Übergabe statt weiterer Features:** Alle Welle-1-Teile, die ohne Inhaber baubar sind, stehen. Der größte Restnutzen ist jetzt, dass der Inhaber Freigaben ohne Entwickler erteilen kann (Mappe + Cockpit).
6. **Eine Installation:** Nur `framer-motion` exakt deklarieren, keine neue Abhängigkeit. Next 16.4.2 bleibt bis 30.10. tabu.
7. **Bewusst nicht in Runde 6:** Next 16.4.2, Live-Rechtstexte DPF/SCC, Gutschein-/Atelier-Livegang, Schweiz-Hub-Freigabe, Termin-Tool/WhatsApp, Backoffice-Felder/-Bilder, Freigaben Ratgeber/Produkttexte/Herstellerbilder, Portal live, CSP erzwingen (braucht `report-to`-Endpunkt aus dem Monitoring), Commit/Deploy.

## 5. Nach Runde 6

`done` bleibt in dieser Planung `false`, weil Runde 6 noch Code-Arbeit enthält. Nach Runde 6 ist alles, was ohne Inhaber geht, erledigt bis auf das Next-Update ab 30.10. (Ablaufblatt liegt bereit). Rest: Inhaber-Fragen unten und die Go-live-Liste in `release-check.md`.

## 6. Fragen an den Inhaber

Siehe `ownerQuestions` in der strukturierten Rückgabe (gleiche Liste).
