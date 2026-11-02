# R2-labs-service – Dreiländer-Rechner und KI-Concierge (Runde 2)

**Stand:** 26.10.2026 · Branch `feature/neuauftritt` (nichts committet) · keine npm-Installation · kein Test mit echtem Claude/API-Key

## Nachbesserung nach QM-Feedback (26.10.2026, Note vorher 8/10)

**Berichtigung:** Die frühere Angabe „10/10 e2e grün“ war nicht belastbar. Der Kartentest `labs-dreilaender.spec.js` („Bregenz und Rheintal antippbar“) schlug beim QM in 3 von 3 Läufen fehl, und `Seite: 200` war unter Last instabil. Beides ist jetzt behoben, siehe unten.

| P2 | Ursache | Behebung | Nachweis |
|---|---|---|---|
| 1 Roter Kartentest | Nach dem 1. Tipp scrollte die Seite, der 2. `tap({force:true})` traf veraltete Koordinaten. Zusätzlich konnte der Cookie-Banner unter Last erst nach `dismissCookies` erscheinen. | Vor jedem Tipp `scrollIntoViewIfNeeded()` und warten, bis nichts mehr scrollt (`scrollSettled`). Tipp **ohne** `force`, damit Playwright prüft, dass die Callout-Mitte den Button trifft. Neu: Prüfung, dass die Seite nach dem Tipp nicht scrollt, und Hit-Test der Mitte aller 14 Orte. `dismissCookies` wartet bis 8 s auf den Banner. | 5 Läufe ohne Retry nach dem Fix (Dreiländer + Concierge, `--retries=0`): 10/10, 10/10, 10/10, 10/10, 10/10. Davor ein Zwischenlauf 9/10, als der Banner Chur verdeckte; danach behoben. |
| 2 Auto-Scroll mobil | `selectPlace` scrollte nach jedem Tipp mit `block: "nearest"`. | Es wird nur noch gescrollt, wenn von der Kurzkarte weniger als 48 px im Bild sind. Bei `prefers-reduced-motion` ohne `smooth`. | 375 px (Chromium und WebKit): Tipp Bregenz → Rheintal, `scrollY` 797 → 797 → 797 (vorher 797 → 1064 → 1113). Screenshot `fix/karte-iphone-se.png` |
| 3 Trefferflächen | Die Label-Ebene lag über den Buttons. Ihre Texte schluckten Treffer, auch die Namen der Nachbarn, zum Beispiel „Friedrichshafen“ über Ravensburg. Das Rheintal-Callout lag über der Unterkante von St. Gallen. | Mobil (< 640 px) hat die Label-Ebene `pointer-events: none`. Auf dem Desktop bleibt der Klick auf den Namen erhalten. Das Rheintal-Callout ist von y 318 auf 336 gerückt. Die viewBox hat rechts 32 Einheiten Rand für Kempten. | `elementFromPoint` mit 375 px, Strecke durch die Punktmitte: Ravensburg 49 × 48, St. Gallen 49 × 49, Kempten 46 × 49 (vorher 14–31 breit), Bregenz-Callout 59 × 45, Rheintal-Callout 55 × 45. Die Mitte trifft jetzt den Button (`rect`) statt `text`. |
| 4 `Seite: 200` unter Last | Der Standard-Request-Timeout war zu knapp, solange der Dev-Server kompiliert. | Testeigener Timeout 300 s, Requests mit 150 s und vorher ein Warm-up-Abruf. | in allen 5 Läufen grün |

**Weiter offen (geometrisch, kein P2):** Lindau (49 × 42) und Dornbirn (40 × 42) liegen bei 375 px nur etwa 34 px auseinander. Die Voronoi-Teilung gibt beiden je die Hälfte. WCAG 2.5.8 (AA, 24 px) ist erfüllt, und für beide gibt es zusätzlich die Chips mit 44 px.

**Prüfung nach dem Fix:**
- `npx eslint`: sauber.
- Unit: 26/26.
- `shoot.mjs` → `qa-screenshots/teamleiter/r2-R2-labs-service/fix/`: 8/8 mit 200, 0 Konsolenfehler, kein Querscrollen.
- Zusätzliche Kartenaufnahmen: `fix/karte-iphone-se.png` (Rheintal ausgewählt, Karte bleibt stehen) und `fix/karte-desktop.png` (Klick auf den Namen „Ravensburg“ wählt den Ort).
- Die Playwright-Ausgabe lag nur im Session-Scratchpad (`--reporter=list --output=…`). Der gemeinsame Report blieb unberührt.

**Geändert:** `DreilaenderClient.js`, `DreilaenderMap.js`, `dreilaender.module.css`, `geo.js`, `tests/e2e/labs-dreilaender.spec.js` und `features/dreilaender-rechner.md`.

## Ergebnis (Stand vor dem QM-Feedback)

Alle Code-Auflagen aus beiden Abnahmen sind umgesetzt und geprüft. Offen sind nur die Punkte, die beim Inhaber, Anwalt oder Betrieb liegen.

### Dreiländer-Rechner (`/de/labs/dreilaender`)
- **N1:** Die Kartenschrift ist jetzt Instrument Sans mit explizitem Gewicht 600/500 (CSS und SVG-Attribut). Die Fahrzeiten stehen in `#6b5314`, das ergibt etwa 6,7 : 1 auf Bone. Auf WebKit wurde 600 berechnet.
- **N2:** Die Beschriftungen liegen in einer eigenen Ebene über den Routen und haben einen Halo in Bone (`paint-order: stroke`).
- **N3/P3-15:**
  - Der Trefferradius wird aus der echten Breite berechnet (Ziel 48 px) und mit Voronoi beschnitten.
  - Bregenz und Rheintal stehen mobil als Callout mit Namen und Führungslinie; das Callout ist zugleich die Trefferfläche.
  - Gemessen bei 375 px: Box ≥ 48 px. Effektiv ≥ 44 px, nur Ravensburg (41 px) und St. Gallen (43 px) liegen in der Höhe knapp darunter.
- **N4:** Die zweite Live-Region ist um 800 ms entprellt.
- **N5:** Der CTA steht in einer eigenen Zeile und ist einzeilig.
- **P3-12:** Mini-Karte im Desktop-Hero (`HeroMiniMap.js`).
- **EZB-Ausfall:**
  - Neue reine Datei `rate.js`. Der Kurs wird immer mit Quelle, Datum und Alter angezeigt.
  - Ist der Kurs älter als 4 Tage, erscheint eine deutliche Warnung.
  - Ohne gültigen Kurs zeigt der Rechner keine CHF-Beträge, und die API antwortet mit 503.
  - Dazu ein Unit-Test.
- Werte und die Kennzeichnung „Richtwert – Beispielwert“ sind unverändert.

### KI-Concierge (`/de/labs/concierge`)
- **A3/N1:**
  - Der schwebende Button misst feste Leisten am unteren Rand und schiebt sich darüber.
  - Getestet mit einer simulierten 64-px-Leiste auf iPhone, SE 375 und Android: Der Button sitzt 76 px über der Unterkante und `elementFromPoint` trifft ihn.
- **N2:** Der Widerruf setzt optimistisch sofort zurück. Der Hinweis erscheint nach 60–260 ms, die Bestätigung des Servers folgt.
- **N3:** Ausblendverlauf auf beiden Seiten, auch mobil. Ursache war der fehlende `z-index`.
- **N4:** Bei offenem Cookie-Banner wird die Panelhöhe gemessen und begrenzt. Desktop: Panel-Unterkante 811 px, Banner-Oberkante 823 px.
- **A4:**
  - Speicher-Schnittstelle `limitStore.js`: Arbeitsspeicher als Standard, `createSharedStore(exec)` Redis-kompatibel vorbereitet, aber nicht angeschlossen.
  - Die Logik liegt in `limiter.js`; fällt der Speicher aus, rechnet sie mit dem Arbeitsspeicher weiter.
  - Die Routen warten jetzt auf die Prüfung (`await`).
- Mock-Modus und Einwilligung sind unverändert. Den Datenschutzabschnitt habe ich nicht geschrieben.

## Prüfung

| Prüfung | Ergebnis |
|---|---|
| `npx eslint` auf alle eigenen Dateien | sauber |
| `node --test tests/unit/labs-dreilaender-rate.test.mjs tests/unit/labs-dreilaender-geo.test.mjs tests/unit/labs-concierge-limiter.test.mjs` | 26/26 grün |
| `npx playwright test tests/e2e/labs-dreilaender.spec.js tests/e2e/labs-concierge.spec.js --project=desktop` | ~~10/10 grün~~ Damals nicht reproduzierbar (QM: 8/10). Nach dem Fix: 5 Läufe 10/10 ohne Retry, siehe oben |
| `shoot.mjs` → `qa-screenshots/teamleiter/r2-R2-labs-service/selbst/` (Sammellauf) | 7 von 8 mit 200. Android/Dreiländer: Timeout bei `networkidle` wegen Last auf dem Dev-Server. Desktop/Concierge: 1 Dev-Meldung „state update … hasn't mounted yet“ zusammen mit einem abgebrochenen `_rsc`-Request (bekannt als P2.11). |
| `shoot.mjs` je Feature → `qa-screenshots/{dreilaender-rechner,concierge}/r2/shoot/` | 8/8 mit 200, 0 Konsolenfehler, kein Überlauf |
| Interaktion (iPhone 15 Pro und iPhone SE 375 mit WebKit, Pixel 7, Desktop 1440) | `qa-screenshots/{dreilaender-rechner,concierge}/r2/check-r2.mjs` → `interact/`. Screenshots angesehen. |

## Dateien

**Neu**
- `src/components/Labs/Dreilaender/rate.js`
- `src/components/Labs/Dreilaender/HeroMiniMap.js`
- `src/lib/concierge/limitStore.js`
- `src/lib/concierge/limiter.js`
- `tests/unit/labs-dreilaender-rate.test.mjs`
- `tests/unit/labs-dreilaender-geo.test.mjs`
- `tests/unit/labs-concierge-limiter.test.mjs`
- `tests/e2e/labs-dreilaender.spec.js`
- `tests/e2e/labs-concierge.spec.js`
- `qa-screenshots/{dreilaender-rechner,concierge}/r2/**`

**Geändert**
- Dreiländer:
  - `DreilaenderMap.js`
  - `DreilaenderClient.js`
  - `PriceCalculator.js`
  - `geo.js`
  - `ecb.server.js`
  - `dreilaender.module.css`
  - `src/app/[locale]/labs/dreilaender/page.js`
  - `src/app/api/labs/wechselkurs/route.js`
- Concierge:
  - `Concierge.js`
  - `concierge.module.css`
  - `src/lib/concierge/rateLimit.js`
  - `src/app/api/labs/concierge/route.js`
  - `src/app/api/labs/concierge/consent/route.js`
- Dokumentation:
  - `Marktresearch/digital/features/dreilaender-rechner.md`
  - `Marktresearch/digital/features/concierge.md`

## Offene Punkte

1. **Concierge A1** (Inhaber/Anwalt): Abschnitt `#ki-concierge` in der Datenschutzerklärung und AVV mit Anthropic.
2. **Concierge A2:** Test mit echtem Claude über einen API-Key.
3. **Betrieb:** Den geteilten Speicher anschließen, wenn mehrere Instanzen laufen (`setLimitStore(createSharedStore(exec))`). `CONCIERGE_PROXY_HOPS` an die echte Proxy-Kette anpassen.
4. **Dreiländer** (Inhaber): `ossActive`, Weitergabe der DE-USt, echte Liefer- und Verzollungspreise.
5. **Hinweis an R2-qualitaetsnetz:** Der Playwright-Lauf schreibt seinen HTML-Report nach `qa-screenshots/teamleiter/tests-report`. Das kommt aus der gemeinsamen Konfiguration; mein Lauf hat den Report dort überschrieben.
6. **Ab Runde 3:** Die neuen Specs senden eine eigene Test-IP (`x-forwarded-for`), damit das Consent-Limit bei wiederholten Läufen nicht greift.
