# Teamleiter – Runde 2: Plan

Stand: 26.10.2026, Branch `feature/neuauftritt`. Es wird nicht committet, nicht gepusht und nicht deployt.

## 1. Lage (Monitor localhost:4545)

| Workflow | Status | Folge für Runde 2 |
|---|---|---|
| platzhirsch-neuauftritt-bau | läuft: Fix „Inhaltsseiten“ und Fix „Katalog/Produkte“, danach deren Abnahme und die **Integration** (Messages zusammenführen, `npx eslint src`, Build in einer Kopie, Gesamt-QA) | **Weiter tabu:** alle Dateien aus Runde 1, Abschnitt 1, Zeile 1 (Shell, Startseite, Marken, Produkte, Landing, Inhaltsseiten, `src/messages/*.json`, `src/lib/content/**`, `globals.css`, `layout.js`, `client-layout.js`, `ui/**`, `Brand/**`, `Reusable/**`, `Navbar/**`). Auch fertige Bereiche bleiben gesperrt, weil der Integrator sie noch anfasst. |
| platzhirsch-feature-teams | läuft nur noch: Fix und Abnahme **Kundenportal** | **Tabu:** `src/app/[locale]/portal/**`, `src/components/Portal/**`, `src/lib/portal/**`, `src/app/api/portal/**`, `qa-screenshots/kundenportal/**`, `features/kundenportal.md`. **Frei geworden:** alle Labs-Features und die Upload-Strecke samt den drei Formular-Komponenten (alle Abnahmen MIT AUFLAGEN, 7–8/10). |
| design-jury, welle-0c, yacht-outdoor, beirat | fertig | `src/app/[locale]/preview/**` frei (Jury fertig) |
| Runde 1 (8 Pakete) | fertig | Ihre Dateien sind frei und gehen in Runde 2 an neue Besitzer |

**Konsequenz:** Runde 2 holt die Labs- und Upload-Auflagen nach, macht die Lead-Strecke (Formulare) produktionsreif und im neuen Design, baut Marke × Kategorie so vor, dass der Anschluss in Runde 3 nur noch wenige Zeilen in der gesperrten Marken-Route kostet, und spannt das Testnetz über die neuen Seiten. Die Messages bleiben gesperrt: Pakete mit neuen Texten legen einen Vorschlag `Marktresearch/digital/teamleiter/messages-r2-<paket>.json` (alle 4 Sprachen, Struktur wie `src/messages`) an und nutzen bis dahin `t.has()`/Fallback. Die Zusammenführung kommt in Runde 3 als eigenes i18n-Paket.

## 2. Offene Punkte (gesammelt)

- **Lead-Strecke:** Frontends senden `website`/`_t` noch nicht, zeigen englische `error`-Texte statt übersetzter `code`s (R1-formulare Nr. 3); Kontaktseite noch im alten Design (war für den Neuauftritt gesperrt); FormPrivacyNote fehlt (Release-Zug R2, AP2-Minimum); Adventsabend-`_t` auf Dauer seit Rendern umstellen (R1-formulare Nr. 7).
- **Upload (P1-verdächtig):** `UploadHandoff` schickt `{ kind, email, leadRef }` an `/api/upload/session`, die Route erwartet `ticket` → QR-Upload nach dem Formular schlägt vermutlich fehl. Dazu Auflage A-1 (doppelter Hauptknopf mobil, `hidden` vs. `inline-flex`), Kontrast im gesperrten Zustand, Scroll-Durchgriff der Demo.
- **Küchenplaner:** R4–R7 (Drehgrenzen, Kamera „Ich stehe drin“, `scroll-margin-top`, 3D-Fronten), englische Fehlertexte.
- **Sofaplaner:** Überlappung nach Raum verkleinern/vergrößern bleibt gespeichert, Statuszeile mobil, Palette abgeschnitten, 3D-Ausschnitt Desktop, Aufräumen alter Teilen-Pläne.
- **AR-Viewer:** P1 Maße im Hochformat (nur Breite sichtbar), React-Warnung „state update … not mounted“, `_rsc`-Abbrüche, 230 px Weiß über der H1, Studio-HDR.
- **Stil-Finder:** Bodoni-Lücke nach „W“, Zähler springt zu früh, iPad-Mischbalken leer, React-Warnung.
- **Dreiländer:** SVG-Schriftgewicht/-kontrast, Linien durch Labels, Trefferflächen 375 px, Live-Region entprellen, CTA-Umbruch, Mini-Karte im Desktop-Hero, Bregenz/Rheintal mobil.
- **Concierge:** A3/N1 (Aktionsleiste verdeckt Button), N2–N4, A4 Speicher-Abstraktion für Rate-Limit/Tagesbudget.
- **SEO:** Route Marke × Kategorie (R1-seo Nr. 3), `getIndexableRatgeber()` an Sitemap/llms anschließen, bestandene `LANDING_PAGES` in `llms.txt` (R1-seo Nr. 2).
- **Tests:** axe nach Schließen des Cookie-Banners, Smoke für Ratgeber/Adventsabend/Bewerten/Fehlerseiten/Labs, `check-claims --live` in 4 Sprachen, npm-Skripte, `KNOWN`-Listen bereinigen.
- **Wartet weiter:** Produktseite verdrahten (Produkttexte/FAQ), Marken-Route, `markenitems.js` → `claims.js`, `setRequestLocale`/ISR, Übersetzungen, Header-Überlauf 320 px, Montserrat dünn auf iOS, schlanke `/upload`-Hülle in `client-layout.js` → alles erst nach der Neuauftritt-Integration (Runde 3). Portal-Härtung nach Ende der Feature-Teams.

## 3. Pakete Runde 2 (alle Dateien exklusiv, niemand installiert)

| ID | Paket | Wirkung | Dateien |
|---|---|---|---|
| R2-leads | Lead-Strecke: Kontakt und Formulare im Neuauftritt, Formular-Vertrag im Frontend | Umsatz (direkte Anfragen), Release-Zug R2, Spam-Schutz greift erst damit | `src/components/{Kontakt,AnfrageFormProduct,BeratungClient}/**`, `src/app/[locale]/kontakt/**`, `src/components/Forms/**` (neu), `src/lib/forms/**`, `src/app/api/{kontakt,beratung_anfrage,anfrage_produkt,newsletter_subscribe}/**`, `src/app/[locale]/adventsabend/AdventsabendForm.js`, `tests/unit/forms*.test.mjs`, `tests/e2e/forms*.spec.js`, `Marktresearch/digital/teamleiter/messages-r2-leads.json`, `qa-screenshots/teamleiter/r2-leads/**` |
| R2-upload | Upload-Strecke produktionsreif (Ticket-Fehler, A-1, Kontrast, Demo-Scroll, Tests) | Lead-Qualität (Fotos/Pläne), behebt vermuteten P1 | `src/components/Upload/**`, `src/app/[locale]/upload/**`, `src/app/[locale]/labs/upload-demo/**`, `src/app/api/upload/**`, `src/lib/upload/**`, `tests/unit/upload*.test.mjs`, `tests/e2e/upload*.spec.js`, `Marktresearch/digital/features/handy-upload.md`, `qa-screenshots/handy-upload/r2/**` |
| R2-labs-planer | Küchenplaner und Sofaplaner: Auflagen, Fehlerfälle, Performance, Tests | Leitfeatures gegenüber Wettbewerbern | `src/app/[locale]/labs/{kuechenplaner,sofaplaner}/**`, `src/components/Labs/{Kuechenplaner,Sofaplaner}/**`, `src/app/api/labs/kuechenplaner/**`, `public/labs/kuechenplaner/**`, `tests/unit/labs-{kuechenplaner,sofaplaner}*.test.mjs`, `tests/e2e/labs-{kuechenplaner,sofaplaner}*.spec.js`, `Marktresearch/digital/features/{kuechenplaner,sofaplaner}.md`, `qa-screenshots/{kuechenplaner,sofaplaner}/r2/**` |
| R2-labs-erlebnis | AR-Viewer und Stil-Finder: P1 Maße mobil, Warnungen, Typo, Tests | Produkterlebnis, Inspiration | `src/app/[locale]/labs/{ar-viewer,stilfinder}/**`, `src/components/Labs/{ArViewer,Stilfinder}/**`, `public/labs/ar-viewer/**`, `tests/unit/labs-{arviewer,stilfinder}*.test.mjs`, `tests/e2e/labs-{arviewer,stilfinder}*.spec.js`, `Marktresearch/digital/features/{ar-viewer,stilfinder}.md`, `qa-screenshots/{ar-viewer,stilfinder}/r2/**` |
| R2-labs-service | Dreiländer-Rechner und KI-Concierge: Auflagen, Speicher-Abstraktion, Tests | Schweiz/DE-Kunden, Service | `src/app/[locale]/labs/{dreilaender,concierge}/**`, `src/components/Labs/{Dreilaender,Concierge}/**`, `src/app/api/labs/{wechselkurs,concierge}/**`, `src/lib/concierge/**`, `tests/unit/labs-{dreilaender,concierge}*.test.mjs`, `tests/e2e/labs-{dreilaender,concierge}*.spec.js`, `Marktresearch/digital/features/{dreilaender-rechner,concierge}.md`, `qa-screenshots/{dreilaender-rechner,concierge}/r2/**` |
| R2-seo | Marke × Kategorie als fertige Seitenkomponente + Vorschau-Route; Ratgeber und bestandene Landingpages an Sitemap/llms | Long-Tail-SEO (AP5), anschlussfertig für Runde 3 | `src/components/BrandCategory/**` (neu), `src/lib/marken/**`, `src/lib/seo/**`, `src/app/sitemap*.xml/**`, `src/app/llms.txt/**`, `src/app/robots.js`, `src/app/[locale]/preview/marke-kategorie/**` (neu), `tests/unit/{sitemap,brandCategory,llms}*.test.mjs`, `Marktresearch/digital/teamleiter/messages-r2-seo.json`, `qa-screenshots/teamleiter/r2-seo/**` |
| R2-qualitaetsnetz | Testnetz erweitern: axe nach Cookie-Banner, Smoke für neue Seiten, Claim-Live-Check in 4 Sprachen, npm-Skripte | Abnahme-Netz für Runde 3 und Livegang | `playwright.config.js`, `tests/e2e/{a11y,smoke,seo,legal,global-setup,helpers}*.js`, `tests/e2e/{content,event,errors}*.spec.js` (neu), `tests/README.md`, `package.json` (nur `scripts`, keine Abhängigkeiten), `tools/checks/**`, `src/lib/legal/**`, `tests/unit/{claims,nap}*.test.mjs`, `qa-screenshots/teamleiter/r2-qualitaetsnetz/**` |

### Schnittstellen

- **UploadHandoff-Vertrag (R2-upload ↔ R2-leads):** `export default UploadHandoff` und `export { handoffFrom }` behalten Namen und Props. R2-upload behebt den `ticket`-Fehler hinter dieser Schnittstelle (z. B. `handoffFrom()` liefert das Ticket aus der Formularantwort, die Session-Route nimmt beides an). Ändert sich etwas an den Props, dann nur additiv und dokumentiert in `features/handy-upload.md`. R2-leads ändert `UploadHandoff` nicht.
- **Formular-Vertrag (aus Runde 1):** `website` (leer) und `_t` (ms seit Rendern) optional, Antwortformat und Statuscodes unverändert. Neue Fehlercodes nur additiv. Die Übersetzung der `code`s liegt in `src/lib/forms/` (4 Sprachen als Modul, bis die Messages frei sind). Labs-Pakete übersetzen ihre eigenen Fehler in ihren eigenen Dateien.
- **Tests:** Paketeigene e2e-Specs importieren `tests/e2e/helpers.js` nur lesend. R2-qualitaetsnetz ändert die Signaturen in `helpers.js` nur additiv. Unit-Tests: `node --test tests/unit`.
- **Marke × Kategorie:** R2-seo liefert eine Server-Komponente `BrandCategoryPage` plus Loader (`getBrandCategoryPageData(brand, category, locale)`), `generateMetadata`-Helfer (noindex unter 3 Produkten, Canonical, hreflang, BreadcrumbList/ItemList-JSON-LD) und eine Einbau-Anleitung für `ueber-uns/marken/[title]/[collection]/page.js` (Collections zuerst, Kollisionen beachten). Die Vorschau-Route ist nur in Dev oder mit `ERROR_PREVIEW=1`/eigener Variable aktiv und immer `noindex`. Sitemap nimmt Kategorie-URLs erst auf, wenn die Route in Runde 3 angeschlossen ist (Schalter, Standard aus).
- **Design:** Alle bauen mit `src/components/ui/*` und den Tokens (nur importieren, nicht ändern), lesen vorher `Marktresearch/digital/redesign/fundament.md` und die Design-Bibel.

## 4. Begründung der Auswahl

1. **R2-leads und R2-upload zuerst nach Umsatzwirkung:** Release-Zug R2 (KW 46) ist die Lead-Strecke. Das Rate-Limit/Honeypot aus Runde 1 wirkt erst, wenn die Frontends mitspielen, und der vermutete Ticket-Fehler würde jede QR-Übergabe nach einer Anfrage brechen. Die Kontaktseite ist die letzte große Seite im alten Design.
2. **Labs in drei Paketen:** Alle sechs Features sind abgenommen mit Auflagen, die Code-Auflagen sind ohne Inhaber lösbar. Drei Pakete à zwei Features halten Kontext und Prüfaufwand pro Agent beherrschbar und sind dateigetrennt.
3. **R2-seo:** Die Marken-Route ist gesperrt, aber 90 % der Arbeit (Komponente, Daten, Metadaten, Tests, Vorschau) ist es nicht. Runde 3 schließt sie in Minuten an.
4. **R2-qualitaetsnetz:** Runde 3 bringt die Integration und viele Anschlüsse. Ohne erweitertes Netz und Claim-Live-Check fehlt die Abnahmegrundlage.
5. **Nicht in Runde 2:** Messages/Übersetzungen, Produktseite, Marken-Route, `setRequestLocale`, Header-Fixes (Neuauftritt läuft); Portal (Feature-Team läuft); Gutscheine (Insolvenzrecht); Atelierverkauf (Inventur, Preisregel); Schweiz-Hub-Texte (Steuerberater); Performance-Messung gegen Produktions-Build erst nach dem Integrations-Build.

## 5. Vorschau Runde 3

Nach Ende von Neuauftritt-Integration und Portal-Abnahme: i18n-Paket (alle `messages-*.json`-Vorschläge plus EN/FR/IT neuer Seiten, allein Besitzer der Messages), Produktseite mit Produkttexten/FAQ, Marke × Kategorie anschließen, `markenitems.js`/`showroomText.js` → `src/lib/legal`, `setRequestLocale`/ISR, Header 320 px und iOS-Schriftgewicht, schlanke `/upload`-Hülle, Portal-Härtung, Volllauf des Testnetzes gegen `next start`.

## 6. Fragen an den Inhaber

Siehe `ownerQuestions` in der strukturierten Rückgabe (gleiche Liste).
