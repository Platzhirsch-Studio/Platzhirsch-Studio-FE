# R2-qualitaetsnetz: Testnetz erweitert

Stand: 26.10.2026, Branch `feature/neuauftritt`. Nichts committet, gepusht oder deployt. Keine npm-Installation, kein `npm run build`, kein zweiter Server. Es wurde kein Formular abgeschickt: Alle Tests mit Formularen fangen Nicht-GET-Requests an `/api/**` per `page.route` ab.

## Ergebnis in Kürze

- **axe nach Schließen des Cookie-Banners** (WCAG 2.2 AA) läuft auf iPhone (WebKit) und Desktop über 7 Seiten: `/de`, `/de/produkte`, Produktseite, `/de/kontakt`, `/de/ratgeber`, `/de/adventsabend` und `/de/bewerten`. **14 von 14 grün.**
- **Neue Smoke-Specs:** `content.spec.js` (Ratgeber), `event.spec.js` (Adventsabend, Bewerten) und `errors.spec.js` (Fehlerseiten-Vorschau, 404). Dazu kommen die Labs in `smoke.spec.js`. Gezielter Lauf: **50 bestanden, 1 rot**. Der rote Test war ein Selektorfehler in meinem eigenen Test (er traf den Anfahrtslink im Header). Nach der Korrektur ist er grün (Nachlauf: 11 von 11).
- **Bereinigt:** `KNOWN_AXE` ist leer, weil der Kontrast auf `/de/kontakt` behoben ist. Das ist auf Pixel und Desktop mit Banner sowie auf iPhone und Desktop ohne Banner bestätigt. `KNOWN` (News-Superlative) und `PENDING_NOINDEX` (`/de/kuechen-vorarlberg`) bleiben, weil beide Befunde live noch bestehen (per curl geprüft).
- **Claim-Live-Check in 4 Sprachen:** 405 URLs, 0 HTTP-Fehler im zweiten Lauf. **Keine echte Händler-Behauptung mehr.** Alle 84 bzw. 139 Händler-Funde waren Fehlalarme der Regeln und sind behoben. Offen sind **28 Superlative live** und **38 im Quelltext** (zusammen 66), aufgeschlüsselt nach Besitzer in Abschnitt 4.
- **npm-Skripte:** `test:smoke` und `test:a11y` sind neu. `test:unit` ist repariert: `node --test tests/unit` (Ordner) bricht unter Node 24 mit `Cannot find module` ab, deshalb steht dort jetzt das Glob-Muster `"tests/unit/**/*.test.mjs"`.
- `npx eslint` auf alle eigenen Dateien: 0 Meldungen.

## 1. Dateien

| Datei | Änderung |
|---|---|
| `tests/e2e/helpers.js` | **nur additiv**: `LABS_PAGES`, `dismissCookieBanner(page)` (Region „Cookie-Einstellungen“ in 4 Sprachen, Knopf „Weiter ohne Einwilligung“), `blockFormSends(page)` (Nicht-GET `/api/**` → 503, gibt die Liste der abgefangenen Requests zurück), `robotsDirectives`, `jsonLdNodes` (mit `@graph`), `measureOverflow`. Bestehende Exporte und Signaturen sind unverändert. |
| `tests/e2e/a11y.spec.js` | neuer Block „axe nach Schließen des Cookie-Banners“ (iPhone und Desktop). Gemeinsame Funktion `axeVerdict`. Überlaufmessung über `measureOverflow`. `KNOWN_AXE = {}`. |
| `tests/e2e/smoke.spec.js` | Block „Labs“: 7 Seiten. Desktop prüft 200 auf `/de`, 404 auf `/en` und `noindex`. iPhone und Pixel prüfen 375 px ohne Überlauf, dabei sind Formular-Sends blockiert. |
| `tests/e2e/content.spec.js` (neu) | Ratgeber-Hub und alle Artikel aus `src/content/ratgeber/*.md`: 200, eine H1, `robots` passend zu `freigegeben`, kein `[prüfen: …]` bzw. `[… eintragen]` im HTML samt Payload, EN/FR/IT 404 |
| `tests/e2e/event.spec.js` (neu) | Adventsabend und Bewerten: 200, `noindex`, eine H1, andere Sprachen 404. Kein `Event` ohne Uhrzeit. Das Formular ist vorhanden, alle Felder sind beschriftet, und ein leeres Absenden setzt `aria-invalid` und sendet nichts. Bewerten: Google-Link, Mail und Kontakt vorhanden, kein Formular davor (kein Review Gating) |
| `tests/e2e/errors.spec.js` (neu) | `/{de,en,fr,it}/preview/fehler`: 500, `noindex`, die übersetzte H1 hat den Fokus, Header und Footer bleiben, keine technische Meldung sichtbar. Die Tests werden übersprungen, wenn die Vorschau 404 liefert (Prod ohne `ERROR_PREVIEW=1`). Unbekannte URL: 404, `noindex`, eine H1 |
| `tools/checks/check-claims.mjs` | Der Live-Lauf umfasst jetzt auch `/de/ratgeber`, alle Ratgeber-Artikel, `/de/adventsabend` und `/de/bewerten`. |
| `tools/checks/claims-allowlist.json` | +1 Eintrag: Bildpfad `unique-workplace.jpg` (`karriere.js`) |
| `src/lib/legal/claims.js` | Schmale Ausnahmen gegen Fehlalarme. Alle wirken nur in Richtung „Text bleibt stehen“. **Händler:** „autorisé(e)s à“, „être/sont autorisés“, „authorised to“, „autorizzati a“, „certificato di origine“, „entreprises/artisans … agréées“ sowie „teak/legno/… certificato“. **Superlativ:** „un unico/un'unica“ und „unico designer“ bzw. „designer unique“ (gemeint ist „einzig“, kein Werturteil). Echte Claims werden weiter erkannt, z. B. „Revendeur agréé“, „Rivenditore autorizzato“, „Showroom agréé par …“, „approche unique“ und „progetto unico nel suo genere“. |
| `tests/unit/claims-r2.test.mjs` (neu) | 6 Tests zu diesen Ausnahmen, mit Gegenproben |
| `package.json` | **nur `scripts`**: `test:smoke` und `test:a11y` neu, `test:unit` auf das Glob-Muster umgestellt. Abhängigkeiten sind unverändert, `"type"` ist nicht gesetzt. |
| `tests/README.md` | Befehle, Projekte, neue Specs, Formular-Schutz, A11y-Stand |

Bewusst **nicht** geändert: `playwright.config.js`. Die neuen Specs laufen über die bestehende Regel im Desktop-Projekt, und die Labs-Überlaufprüfung läuft über `smoke` in den Telefon-Projekten. `seo.spec.js`, `legal.spec.js` und `global-setup.js` sind ebenfalls unverändert, weil keiner ihrer Einträge erledigt ist.

## 2. Abweichung vom Auftrag

- **„/bewerten: Formular vorhanden“:** Die Seite hat absichtlich kein Formular. Laut Code-Kommentar schließen die Google-Regeln ein „Review Gating“ aus, also keine Frage nach Zufriedenheit vor dem Link. Der Test prüft deshalb die Wege, die es gibt: „Auf Google bewerten“, E-Mail und Kontaktseite. Zusätzlich prüft er, dass **kein** Formular davorsteht. Das Anmeldeformular wird auf `/de/adventsabend` geprüft.
- `shoot.mjs` legt die Bilder gemäß Auftrag in `qa-screenshots/teamleiter/r2-R2-qualitaetsnetz/selbst/` ab. Die übrigen Artefakte (Logs, JSON) liegen in `qa-screenshots/teamleiter/r2-qualitaetsnetz/`.

## 3. Läufe gegen den Dev-Server

| Lauf | Ergebnis |
|---|---|
| Gezielt: a11y (ohne Banner), content, event, errors, Labs auf Desktop und iPhone, 65 Tests | **50 bestanden, 1 rot, 14 übersprungen** (projektbedingt), 4,2 min. Rot: Bewerten-Test (eigener Selektorfehler, korrigiert) |
| Nachlauf: axe mit Banner (Pixel und Desktop), Bewerten | **11 bestanden**, 1 übersprungen, 3,2 min. `/de/kontakt` ist mit und ohne Banner grün, damit ist `KNOWN_AXE` erledigt. |
| Unit: `npm run test:unit` (Stand Fix-Runde, 312 Tests) | **311 bestanden, 0 rot, 1 todo, Exit 0.** Der frühere Syntaxfehler in `brandCategoryPage.js` (R2-seo) ist behoben. Todo: `sitemap.test.mjs` „live region pages: robots“. 7 Regionsseiten sind `index, follow`, obwohl das Doorway-Audit anderes verlangt, **Besitzer Regionen-Paket (AP6, Team 5 / R2-seo)**. Eigene Unit-Tests (claims, nap): **77/77 grün**. |
| `node tools/qa/shoot.mjs` (6 URLs × 4 Geräte) | Alle Seiten 200 und ohne Überlauf, außer `/de/preview/fehler`: dort 500 wie erwartet, mit Konsolenfehlern (der absichtliche Fehler). Desktop-Timeout bei `/de/preview/fehler`, weil `shoot.mjs` auf `networkidle` wartet und das Dev-Overlay eine Verbindung offenhält. Kein Seitenfehler: Der Playwright-Test ist auf Desktop grün. Die Screenshots sind sauber, die Fehlerseite zeigt H1, Text und „Erneut versuchen“ im Neuauftritt. |
| `npx eslint` (eigene Dateien) | 0 Meldungen |
| `check-nap` | Hausnummer 62 × „Landstraße 9“, 0 × „11“. Unverändert offen ist die Inhaberentscheidung. |

**Beobachtung für die Shell (Neuauftritt Team 1 / Integrator):** Der Cookie-Banner ist noch im alten Stil (`bg-gray-800`, `rounded-lg`, Schatten) und deckt auf dem iPhone rund 30 % des ersten Bildschirms ab. axe meldet dazu nichts, die Design-Bibel ist aber nicht umgesetzt.

## 4. Claim-Live-Check (`check-claims --live`, de/en/fr/it, Startseiten und Markenseiten)

Aufruf: `node tools/checks/check-claims.mjs --live --locales=de,en,fr,it --concurrency=2`. Rohdaten liegen in `qa-screenshots/teamleiter/r2-qualitaetsnetz/claims-live2.{txt,json}`, gruppiert in `claims-grouped2.txt`.

- **Lauf 1** (concurrency 3): 212 Verstöße (139 Händler, 73 Superlative) und 61 Fehler (60 × HTTP 500 auf Markenseiten unter Last, einzeln abgerufen alle 200, sowie 1 × 404). 138 der Händler-Funde waren FR-Presse- und Cookie-Texte („autorisés à les transmettre“, „peuvent être autorisés“) im Payload der FR-Markenseiten, dazu „da un certificato di origine“ (Poliform IT).
- **Lauf 2** (concurrency 2, nach der ersten Regelkorrektur): **150 Verstöße, 0 Fehler.** Die 84 Händler-Funde waren wieder nur Fehlalarme: „réalisés par des entreprises agréées“ (FR-Outdoor-Text im Payload, 83 ×) und „teak certificato“ (Gloster IT). Beide Regeln sind korrigiert. Eine Nachprüfung aller 84 Sätze mit dem neuen Regelwerk ergibt **0 Händler-Funde**. Ein dritter Volllauf steht aus, er dauert rund 12 min.
- **ClassiCon** zeigt den Händlerhinweis weiterhin, er ist belegt und bleibt.
- **404 im Sitemap:** `/it/chi-siamo/marche/sifas/sifas-oxford` steht in der Marken-Sitemap, liefert aber 404 (Lauf 1). **Besitzer: Team 3 / R2-seo** (Sitemap-Quelle).

### Offene Superlative nach Besitzer

| Fundstelle | Befund | Besitzer |
|---|---|---|
| `/de/ueber-uns/marken/bombyxx` (Text und Meta, 4 Sprachen), `qeeboo` („Einzigartige Veredelung“), `desalto`, `antoniolupi` (DE/IT), `/fr/…/101-copenhagen` („approche unique“), `/fr/…/bullfrog` (Meta), `/en/…/schueller` („largest“) | Markentexte und Meta-Descriptions aus dem Backoffice | **Team 3 Marken / Integrator**: `sanitizeClaims` bzw. `publicBrand` auch auf Beschreibung und Meta anwenden. Dazu Redaktion im Backoffice. |
| `/de/news`, `/en/news`, `/fr/nouvelles`, `/it/notizie`: Teaser „Birds Zyklus“/Paola Lenti, „Küchenkonzepte MCR/next125“, „Dylan und Raphael“ (einzigartig/unique/uniques/uniche) | News-Teaser | **Team 6 News / Team 7 Texte** |
| News-Artikel `platzhirsch-home-living-grand-opening`, `platzhirsch-unsere-broschuere-2022-ist-da` (4 Sprachen) | „größte Minotti-Ausstellung“, „die größte im Umkreis von 500 km“ | **Team 6 / Team 7**, weiter als `KNOWN` in `legal.spec.js` |
| `/fr/contact`, `/it/contatto` sowie `src/messages/fr.json:909, 991` und `it.json:991` | „idées uniques“, „progetto … unico“, „unique“ (Küchenrenovierung) | **Team 7 Texte / i18n-Paket Runde 3** (Messages gesperrt) |
| `/de/kuechen-vorarlberg`, `/de/wohnzimmer-einrichten-vorarlberg`, `/de/interior-design-vorarlberg` (Meta) sowie `src/app/[locale]/{kuechen,wohnzimmer-einrichten,interior-design}-vorarlberg/page.js`, `src/app/[locale]/layout.js:75` | „führender (Design)marken“. Beschreibt die Marken. `legal.spec.js` lässt das zu, `claims.js` meldet es. | **Team 5 Landing / Integrator (layout.js)**. Empfehlung: zu „bekannter Designmarken“ umformulieren, dann sind beide Prüfer einig. |
| `src/components/Impressum/impressum.js:53` | „einzigartige Wohnkonzepte“ | **Rechtspaket** (wird durch den Impressum-Entwurf ersetzt) |
| `src/lib/data/importedProducts/brandVanEgmond.js` (16 ×), `treca.js` (6 ×), `next125.js` (4 ×), `src/lib/data/staticShopProducts.js` (4 ×, „leading“) | Herstellertexte | **Team 4 Katalog / Runde 3 Produktseite**: `sanitizeClaims` beim Rendern |

## 5. Bekannt-Listen (Stand nach Bereinigung)

| Liste | Eintrag | Status |
|---|---|---|
| `KNOWN_AXE` (`a11y.spec.js`) | `/de/kontakt` color-contrast | **gelöscht**, behoben |
| `KNOWN` (`legal.spec.js`) | News-Superlative (2 Artikel × 4 Sprachen) | bleibt, live noch vorhanden |
| `PENDING_NOINDEX` (`seo.spec.js`) | `/de/kuechen-vorarlberg` | bleibt, liefert weiter `index, follow` |

## 6. Offene Punkte

1. ~~R2-seo: Syntaxfehler in `brandCategoryPage.js`~~ – erledigt, Unit-Lauf grün.
2. **Team 5 / Regionen:** 7 Regionsseiten `index, follow` (Unit-todo) sowie `/de/kuechen-vorarlberg` (`PENDING_NOINDEX`).
3. **Team 3 / Team 6 / Team 7 / Team 4:** Superlative wie in Abschnitt 4. Kein Händler-Claim offen.
4. **Dritter Volllauf** `check-claims --live` nach den Regelkorrekturen. Erwartet werden 0 Händler-Funde und 66 Superlative.
5. **Cookie-Banner** im alten Stil (Team 1 / Integrator).
6. Volllauf aller Specs gegen `next start` (`npm run test:e2e:prod`) nach dem Integrations-Build. Im Dev-Server erzeugt paralleles Crawlen 500er.
