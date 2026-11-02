# Feature: KI-Concierge seitenweit (Website-Agent)

Stand: 27.10.2026 · Branch `feature/neuauftritt` · Grundlage: `concierge-sitewide-architektur.md` (Architektur), `concierge.md` (Labs, Runde 1–4)
Status: **gebaut, nur Entwicklung.** In Produktion ist der Concierge ohne Schalter aus (siehe „Schalter“). Freigabe erst nach den Bedingungen unter „Offen“.

## Was gebaut ist

- **Stiller Einstieg auf jeder Seite.** Unten rechts sitzt ein ruhiger Knopf „Concierge · KI“: Fläche `surface`, 1 px `line-strong`, Radius 0, kein Schatten, z 44. Mobil zeigt er nur Symbol und „KI“, ist 48 px hoch und hat 16 px Abstand plus Safe Area. Auf dem Desktop schrumpft er nach 400 px Scrollen auf Symbol und „KI“. Er öffnet sich nie von selbst. Es gibt keine Blase, kein Pulsieren, keinen Zähler und keine Eintrittsanimation. Er erscheint erst nach `requestIdleCallback`, so wie die Consent-Leiste.
- **Sichtbarkeit:**
  - Solange Cookie-Banner oder Cookie-Dialog offen sind, ist der Knopf ausgeblendet (`hidden`). Das gilt auch, wenn ein anderer modaler Dialog offen ist, etwa Menü, Suche, Filter oder Lightbox.
  - Über festen Leisten am unteren Rand, zum Beispiel der MobileCtaBar, hebt er sich 12 px an. Gemessen wird per `elementsFromPoint`, gedrosselt über rAF und zusätzlich 450 ms nach dem Einblenden. Mit z 44 liegt er immer unter der CTA-Leiste (45).
  - Ausgeblendet ist er auch unter `upload/**`, `portal/**`, `preview/**` sowie in `labs/concierge`, `kuechenplaner`, `sofaplaner`, `ar-viewer` und `upload-demo`.
- **Panel:**
  - Desktop: ein nicht modales Seitenpanel (`<dialog>.show()`), 400 px breit. Die Seite bleibt bedienbar, Esc schließt es.
  - Mobil: ein modales Bottom-Sheet (`showModal()`) mit 88 dvh, Griff, Wischen nach unten und Knopf „Schließen“.
  - Löst ein Vorschlag einen Seitenwechsel aus, oder tippt man im Sheet auf einen Link, verkleinert sich das Sheet zur 56-px-Leiste „Gespräch fortsetzen · KI“.
  - Das Panel kommt als eigener Chunk. Er wird bei Hover, Fokus oder Touch vorgeladen und beim Klick eingebunden. Vor dem Klick gibt es 0 Requests an die API (getestet).
- **Verlauf** liegt in `sessionStorage` (`ph-concierge:chat`) und übersteht Seitenwechsel und Neuladen im selben Tab. Das Einwilligungs-Token hat einen eigenen Schlüssel (`ph-concierge:site-token`), weil der Text jetzt auch die Seitendaten nennt.
- **„Nicht stören“** steht im Menü „…“: „Für diesen Besuch“ (sessionStorage) oder „Für 30 Tage“ (`localStorage ph-concierge:v1`). Danach gibt es weder Knopf noch Chunk noch Request. Der Rückweg ist eine Lasche „KI“ am rechten Rand (24 × 44 px). Außerdem stellt jedes Element mit `data-concierge-show` den Concierge per Klick wieder her; das ist der Vertrag für den Footer-Link.
- **Website-Agent** mit sechs Tools, die nur Vorschläge machen:

  | Tool | Was es vorschlägt |
  |---|---|
  | `propose_navigation` | Seite wechseln |
  | `propose_open_product` | Produkt öffnen |
  | `propose_catalog_filter` | Katalog filtern |
  | `propose_save_to_selection` | Merken |
  | `propose_appointment_form` | Termin vorbereiten, ohne Absenden |
  | `propose_scroll_to_section` | Zu einem Abschnitt springen |

  - Der Server prüft jede Eingabe mit zod und löst sie gegen den Katalog auf: Beim Filter muss es mehr als 0 Treffer geben, Produkte müssen vorher gezeigt worden sein, Abschnitte müssen im Seitenkontext stehen.
  - Erst dann schickt er den Vorschlag als `action`-Event. Es ist HMAC-signiert (id, sid, Ablauf 30 min). Pro Antwort sind es höchstens 3 Vorschläge, auch bei parallelen Aufrufen, pro Sitzung höchstens 30.
  - Die Karte trägt „KI-Vorschlag“ und hat die gleich großen Knöpfe „Ausführen“ und „Nein, danke“. Darunter steht das Ziel als lesbarer Pfad. Beim Merken gibt es danach „Wieder entfernen“.
  - Seitenwechsel werden über die Live-Region angesagt.
  - Ältere Vorschläge werden bei einer neuen Frage oder einem Seitenwechsel „nicht mehr aktuell“.
- **Doppelte Whitelist:** Server und Browser prüfen mit derselben Datei `src/lib/concierge/actionKinds.js`. Das Modell nennt nur Routen-Schlüssel, Kategorie-Slugs und Produkt-IDs, nie URLs. Der Pfad entsteht nur in `buildHref()` (ROUTES, `productsPath`), muss mit `/<locale>/` beginnen und auf demselben Origin bleiben.
- **Formulare** werden nie abgeschickt und **nicht vorausgefüllt**. Der Termin-Vorschlag öffnet `/<locale>/beratung?quelle=concierge&anliegen=…[&produkt=…]`; die Beratungsseite liest `anliegen` bisher nicht. Die Karte sagt deshalb ehrlich „Wir öffnen das Anfrageformular. Ihren Entwurf fügen Sie mit ‚Kopieren‘ selbst ein.“ Beim „Ausführen“ kopiert sie den Entwurf („KI-Entwurf – bitte prüfen“) automatisch in die Zwischenablage und bestätigt „Entwurf kopiert“ (sonst „Kopieren war nicht möglich …“). Auf dem Handy heißt die Leiste danach „Entwurf kopiert – Gespräch fortsetzen“. Die Notiz ist von Telefonnummern, E-Mail-Adressen, URLs und Steuerzeichen bereinigt. Der E2E-Test zählt 0 Requests an `/api/beratung_anfrage`.
- **Status ehrlich:** Navigationsvorschläge zeigen „Wird geöffnet …“ (`aria-busy`), bis `pathname` und Query dem Ziel entsprechen (Vergleich in ChatCore). Erst dann „Erledigt“ und die Ansage „Seite gewechselt“. Nach 12 s ohne Ankunft: „Das dauert länger als üblich“ mit Link „Seite direkt öffnen“ (geprüftes Ziel). Bei vollem Neuladen (Filter auf derselben Seite) wird „opening“ gespeichert und nach dem Laden gegen die Adresse aufgelöst.
- **Seitenkontext pro Frage:**
  - Gesendet werden Route, Slugs aus der URL, bekannte Filter (`marke, typ, material, farbe, bereich`), Abschnitte, die Anzahl in der Merkliste und die Ergebnisse früherer Vorschläge. Abschnitte kommen aus `[data-concierge-section]`, sonst aus `main h2[id]`, mit Label bis 60 Zeichen.
  - Freitext der Seite wird nicht gesendet.
  - Der Server löst die Namen aus dem Backoffice auf: Produkt, Marke, Kategorie in der Seitensprache. Gefälschte Rückmeldungen ohne gültige Signatur fallen weg.
  - `renderContext()` arbeitet deterministisch mit fester Reihenfolge und höchstens 800 Zeichen und steht als erster Textblock im Nutzer-Turn. Damit bleibt der Prompt-Cache gültig.
- **Sprachen:**
  - UI-Texte gibt es in de, en, fr und it (`core/texts.js`).
  - Karten- und Aktionslinks folgen der Sprache der Seite (`/fr/produits/…`, `/fr/conseil`). `catalog.js` nimmt dafür jetzt `locale` entgegen.
  - Seiten, die es nur auf Deutsch gibt (Yacht, Outdoor, Schweiz, Gutscheine, Ratgeber), verlinken auf `/de/…` und tragen den Hinweis „Seite auf Deutsch“.
- **Mock-Modus:** Er zeigt alle sechs Aktionen mit festen Beispielen und nutzt dafür denselben Servercode wie der Live-Modus:

  | Eingabe | Aktion |
  |---|---|
  | „Minotti Sofas“ | Filter |
  | „Ein Sofa merken“ | Merken |
  | „Minotti öffnen“ | Produkt öffnen |
  | „Termin“ | Anfrageformular öffnen, Entwurf kopieren |
  | „Maße“ auf einer Produktseite | Zu Abschnitt springen |
  | „Bitte zum Showroom“ | Navigation zur Kontaktseite |

- **Recht und Barrierefreiheit:**
  - Kennzeichnung nach AI Act Art. 50: „KI“ am Knopf (sichtbar und im zugänglichen Namen), Badge im Kopf, „KI-Concierge“ an jeder Antwort, „KI-Vorschlag“ an jeder Karte, „KI-Entwurf“ an der Notiz.
  - „Mit einem Menschen sprechen“ steht im Kopf.
  - `CONSENT_VERSION` ist auf `2026-10-27b` erhöht (Löschfrist 30 Tage, Kurzfassung).
  - **Einwilligung kurz:** sichtbar sind zwei Sätze (KI-System, kein Mensch, Fehler möglich; Aktionen nur nach „Ausführen“, sendet nie) plus ein Satz zur Übermittlung an Anthropic PBC (USA). Der vollständige Text (AI Act Art. 50, Seitendaten, Widerruf, Datenschutz-Link) steht unverändert im aufklappbaren `<details>` „Was übermittelt wird – alle Details“. Checkbox und „Concierge starten“ sitzen in einem sticky Footer mit Safe Area.
  - **Löschfrist 30 Tage** (Rechtspaket 4.6): ein Wert in `src/lib/concierge/retention.js`, den `config.js`/`store.js`, ChatCore, der Labs-Client und das Dienste-Register (`services.js`, geprüft von `r4-recht.test`) nutzen. `anwalt-vorschau.md` Abschnitt 6 neu erzeugt.
  - **Fehler:** übersetzt (de/en/fr/it). „Keine Internetverbindung“ nur bei `navigator.onLine === false`, sonst „Verbindung unterbrochen“, Zeitüberschreitung und Serverfehler eigene Texte. Unter der Meldung „Erneut senden“; die gescheiterte Frage wird ersetzt, nicht doppelt.
  - **Neuladen:** gespeicherter Verlauf erscheint sofort, nur das Eingabefeld wartet auf die Modusantwort. Der Launcher heißt „Gespräch fortsetzen“, sobald ein Verlauf in der Session liegt.
  - Wortwahl: EN „Go ahead“, FR „Valider“, IT „Procedi“ statt „Run/Exécuter/Esegui“. Lasche „KI“ sitzt auf Launcher-Höhe und wird wie der Launcher über festen Leisten angehoben.
  - Touch-Ziele sind mindestens 44 px groß. Der Fokus geht beim Öffnen auf den Titel und beim Schließen zurück auf den Knopf. reduced motion und „Ruhige Ansicht“ werden beachtet. Es gibt keine Smooth-Scrolls.

## Schalter

| Umgebung | Ergebnis |
|---|---|
| `next dev`, nichts gesetzt | an (alle 4 Sprachen) |
| Produktion, nichts gesetzt | **aus**: die Bedingung in `client-layout.js` ist konstant falsch, der Launcher-Chunk wird nie angefordert |
| `NEXT_PUBLIC_CONCIERGE_SITEWIDE=1` beim Build | an |
| `NEXT_PUBLIC_CONCIERGE_LOCALES=de,en` beim Build | Sprachen, in denen der Knopf erscheint (Standard in Produktion: nur `de`) |
| `CONCIERGE_DISABLED=1` zur Laufzeit | Notaus: `GET /api/labs/concierge` → `{enabled:false}`, das Panel zeigt die Kontaktkarte; `POST` (Chat und Einwilligung) → 503 |
| `CONCIERGE_MOCK=1` | Mock (läuft auf dem Dev-Server) |

## Dateien

| Pfad | Zweck |
|---|---|
| `src/components/Concierge/Launcher.js`, `launcher.module.css`, `flags.js` | Knopf, Sichtbarkeit, Anheben, „nicht stören“, Lasche, Lazy-Load des Panels (≤ 3 KB-Ziel; Quelle gzip 3,6 KB inkl. Kommentarresten, Grenze 5 KB im Test) |
| `src/components/Concierge/Panel.js`, `panel.module.css` | Hülle: Desktop-Panel bzw. mobiles Sheet, Esc, Wischen, Minimieren, Live-Region |
| `src/components/Concierge/core/ChatCore.js` | Einwilligung, Stream, Verlauf, Karten, Übergabe, Menü, Vorschläge |
| `core/ActionCard.js`, `core/executeAction.js` | Bestätigungskarte; Ausführung nach erneuter Prüfung (Router, CartContext, Scroll) |
| `core/SiteProductCards.js` | Karten mit „Öffnen“ und „Merken“ (direkte Nutzeraktionen) |
| `core/pageContext.js`, `core/session.js`, `core/texts.js` | Kontext sammeln, sessionStorage, Texte de/en/fr/it |
| `src/lib/concierge/actionKinds.js` | **geteilte** Whitelist, `buildHref`, `checkAction`, `cleanNote` |
| `src/lib/concierge/actions.js` | Tool-Definitionen, zod, Auflösung, Signatur, Grenzen (`createProposer`, injizierbar) |
| `src/lib/concierge/pageContext.js`, `prepare.js` | Kontext-Schema, Auflösung, `renderContext`; Aufbau der Modell-Nachrichten |
| geändert: `tools.js` (13 Tools, fest in der Reihenfolge; Vorschläge nur bei `surface:"site"`), `catalog.js` (Locale, Index gezeigter Produkte), `run.js` (`action`-Event, Tool-Umgebung), `mock.js`, `schema.js` (`ctx`, `surface`), `systemPrompt.js` (Abschnitt Seitenkontext/Website-Bedienung), `config.js` (`isDisabled`, Consent-Version), `token.js` (`signAction`), `api/labs/concierge/route.js` (+ `consent/route.js`) | |
| `src/app/[locale]/client-layout.js` | nur die Einbindung (inline-Schalter, nach Idle, nicht im Upload-Shell) |
| Tests | `tests/unit/concierge-actions.test.mjs`, `concierge-context.test.mjs`, `concierge-launcher-size.test.mjs`, `concierge-retry.test.mjs`, `tests/e2e/concierge-helpers.js` (gemeinsam), `concierge-sitewide.spec.js`, `concierge-sitewide-iphone.spec.js`, `labs-concierge.spec.js` |

Die Endpunkte bleiben `/api/labs/concierge` (+ `/consent`). Ein eigener Pfad `/api/concierge` lag außerhalb der freigegebenen Dateien. Labs- und seitenweite Anfragen unterscheiden sich über `surface`.

## Geprüft (27.10.2026, Dev-Server, Mock)

- `node --test tests/unit/concierge-*.test.mjs`: 16 von 16 grün. Gesamtlauf `tests/unit`: 838 von 843 grün. Die 5 roten Tests gehören fremden Bereichen (Region-Robots live, Yacht-Hero, Sitemap-lastModified). `r4-shell` war durch den String „landing“ kurz rot; die Route heißt jetzt `thema`, danach war der Test grün.
- `npx playwright test tests/e2e/concierge-sitewide*.spec.js --project=desktop` mit 1 Worker: 8 von 8 grün. Ein API-Test war einmal flaky, weil der kalte Routen-Compile länger als 15 s dauerte; das Timeout steht jetzt auf 120 s. Unter Last durch den parallelen Workflow fiel der Dev-Server zeitweise aus (ECONNRESET, leere Seiten).
- Interaktion: Desktop (Chromium 1440) und iPhone 15 Pro (WebKit), 0 Konsolenfehler.
  - Desktop: Banner → ausgeblendet, „Weiter ohne Einwilligung“ → sichtbar, nicht modal, Filter → `?marke=minotti`, Panel bleibt offen, Ansage, „Erledigt“.
  - iPhone: Knopf 48 px über der CTA-Leiste (`elementFromPoint` trifft den Knopf, Abstand ≥ 8 px, z 44), Sheet modal, Seitenwechsel → Leiste „Gespräch fortsetzen“, wieder öffnen.
- Sichtprüfung: `node tools/qa/shoot.mjs qa-screenshots/erlebnis/concierge-sitewide/selbst …`. 4 Geräte × 4 Seiten mit 200 und 0 Fehlern. Die Zustände stehen in `qa-screenshots/erlebnis/concierge-sitewide/selbst/interact/` (Skript `interact.mjs`).

## QA-Runde 1 umgesetzt (27.10.2026, Ordner `qa-screenshots/erlebnis/concierge-sitewide/fix1`)

| Punkt | Umsetzung |
|---|---|
| P1-1 Termin | Variante b: ehrliche Karte, Entwurf beim „Ausführen“ automatisch kopiert, Bestätigung, Leiste „Entwurf kopiert – Gespräch fortsetzen“. Server-Texte (Tool-Beschreibung, Systemprompt, Mock) sagen nicht mehr „vorausfüllen“. |
| P1-2 „Erledigt“ zu früh | Zustand `opening` („Wird geöffnet …“, `aria-busy`), „Erledigt“ erst bei Ankunft, nach 12 s Link „Seite direkt öffnen“, Neuladen-Fall nach dem Laden aufgelöst. Tests: `toHaveURL` mit 120 s, erst danach „Erledigt“. |
| P1-3 Löschfrist | 30 Tage, ein Wert (`retention.js`), Dienste-Register und `anwalt-vorschau.md` angepasst, `CONSENT_VERSION` 2026-10-27b. |
| P2-1 Fehler | übersetzt, offline nur bei `navigator.onLine === false`, Button „Erneut senden“ (eigene Prüfung statt `netErrorText`). |
| P2-2 Einwilligung mobil | Kurzfassung + `<details>`, sticky Footer mit Safe Area. Gemessen: Start-Button auf Pixel 7, iPhone 15 Pro und Desktop ohne Scrollen sichtbar, auch bei geöffneten Details. |
| P2-3 Labs-Tests | `enterMock()` für beide Server-Modi, längere API-Zeitlimits. |
| P2-4 Neuladen | Verlauf sofort, Eingabe bis zur Modusantwort deaktiviert; Launcher „Gespräch fortsetzen“, sobald ein Verlauf in der Session liegt. |
| P3-1, P3-2 | „Go ahead / Valider / Procedi“; Lasche „KI“ auf Launcher-Höhe, mit Anheben. |

Test-Härtung (Wiederholung 28.10.): Im Dev erscheint der Launcher erst nach der Kompilierung (bis 38 s, siehe P3-4), und ein Klick auf das Cookie-Banner vor der Hydration verpufft. Die Specs warten daher bis 60 s auf den Launcher und klicken „Weiter ohne Einwilligung“, bis das Banner wirklich weg ist (`toPass`); „Ausführen“-Klick und Widerruf-Meldung warten bis 60 s. Läufe 10–12 in `fix1/e2e-2x.txt`: 0 rot (10/11 mit Flakes durch Last auf dem Dev-Server, 12 nach letzter Härtung 15/15 ohne Wiederholung).
Neue E2E-Tests: Fehler/„Erneut senden“ (EN), Neuladen mit verzögertem GET, Einwilligung kurz auf dem iPhone. Jede Einwilligung in den Specs nutzt eine eigene Test-IP (`freshIp`), damit das Consent-Limit bei Wiederholungsläufen nicht greift.
Sichtprüfung `fix1/flow/` (Skript im Scratchpad, Protokoll `fix1/flow/flow-log.txt`): axe 0 Verstöße in Einwilligung und Karte auf Android, iPhone, Desktop; 0 Formular-Absendungen; Zwischenablage enthält den Entwurf. Testläufe: `fix1/e2e-2x.txt`.

Nicht umgesetzt: P3-3 (Panel schiebt Inhalt), P3-4 (Prod-Messung, kein Build erlaubt), P3-5 (iPad-Warnung im alten Labs-Client), P3-6 (Live-Red-Team braucht echten Schlüssel), P3-7 (Label beim ersten Besuch).

## QA-Runde 2 umgesetzt (28.10.2026, Ordner `qa-screenshots/erlebnis/concierge-sitewide/fix2`)

| Punkt | Umsetzung |
|---|---|
| P1-1 Specs ohne Wiederholung | Gemeinsame Hilfsdatei `tests/e2e/concierge-helpers.js` (`mockAvailable`, `dismissCookies`, `enterMock`, `openAndConsent`, `ask`, `freshIp`, `visibleInLog`, `SERVER = { timeout: 60_000 }`). Alle drei Specs (`concierge-sitewide`, `-iphone`, `labs-concierge`) nutzen sie. `ask()` wartet vor `fill` mit `toBeEnabled` (60 s). Neuladen `toBeEnabled` und Labs „Guten Tag.“ jetzt mit 60 s. Zusätzlich gelten 300 s pro Test, 120 s für das Erscheinen des Launchers, und alle ersten Erwartungen nach einer Antwort warten 60 s. **Abnahme offen:** Der erste Lauf mit dem neuen Code (`fix2/e2e-lauf-0-…`, vor dem Serverausfall) hatte die Tests 1–11 grün, darunter alle neuen. Danach waren keine zwei gültigen Läufe möglich. Der Dev-Server lieferte 500 durch Syntaxfehler fremder Teams (`src/lib/upload/store.js`, `src/lib/stilfinder/curate.js`) oder war durch parallele Specs und `shoot.mjs` so ausgelastet, dass JS-Chunks über 30 s brauchten und `page.goto` nach 120 s abbrach. Protokolle `fix2/e2e-lauf-0*.txt`. Die Abnahme mit `--retries=0 ×2` ist bei ruhigem Server zu wiederholen. |
| P2-1 Status verdeckt | `ActionCard` holt bei jedem Statuswechsel (opening, done, failed, undone …) die Statuszeile per `scrollIntoView({ block: "nearest" })` ins Bild, bei reduzierter Bewegung ohne `smooth`. Hinweise mit „Erneut senden“ (`Notice` in `ChatCore`) machen es genauso. Das gilt nur für die letzte Antwort und nur, wenn der Nutzer nicht selbst nach oben gescrollt hat (`awayRef`; eigene Scrolls werden 1 s lang ignoriert). Tests: „Erneut senden“, „Ihre Auswahl ansehen“ und „Entwurf kopiert“ liegen vollständig über dem Eingabefeld. |
| P2-2 WebKit „Load failed“ | `ChatCore.send()` wiederholt bei einem Netzfehler einmal still nach 600 ms, mit demselben `AbortController` und dem Rest des 30-s-Budgets. Bedingung: Es ist noch kein Byte angekommen. Erst wenn auch der zweite Versuch scheitert, erscheint „Verbindung unterbrochen“. Zum Rate-Limit: Es zählt jeden Versuch, der `checkChat` erreicht. Darum schickt jede Frage eine Anfrage-ID `rid`. Der zweite Versuch mit derselben `rid` (innerhalb von 2 min, einmal je `rid`) wird gegen die IP- und Sitzungsgrenzen nicht erneut gezählt (`createRetryPass` in `limiter.js`). Das globale Tagesbudget zählt weiter, weil ein abgebrochener Versuch das Modell schon gestartet haben kann. Tests: E2E mit `route.abort("failed")` und Unit-Test `concierge-retry.test.mjs`. |
| P2-3 Modus ohne Zeitlimit | Die GET-Anfrage läuft über `fetchWithTimeout`. Nach 4 s erscheint „Das dauert länger als üblich.“, nach 10 s die Kontaktkarte (Termin, Telefon, Route). Ein vorhandener Verlauf steht darunter als „Bisheriger Verlauf“. **Abweichung:** Die Anfrage wird nach 10 s nicht abgebrochen. Kommt die Antwort noch innerhalb von 60 s, wird der Chat freigeschaltet. So landet ein langsamer Dev-Server nicht dauerhaft auf der Kontaktkarte. E2E-Test mit dauerhaft hängendem GET. |
| P2-4 Vorausfüllung | Bis zur echten Vorausfüllung führt das Termin-Ziel auf `/beratung?…#anfrage` (`buildHref`). `executeAction` behält den Anker. Ist nur der Anker anders, springt die Seite dorthin, ohne neu zu laden. Die Anfrage an das Team der Beratungsseite (siehe „Offen“ 2) geht über den Teamleiter. |
| P3-1 Kartentext | „Beim Ausführen kopieren wir Ihren Entwurf. Im Formular fügen Sie ihn ein und senden selbst.“ (de/en/fr/it) |
| P3-2 Fokusrahmen | Ein einziger Ring: Die 2-px-Outline in `--color-focus` liegt über dem Rahmen (`outline-offset: -1px`). Damit gibt es keine Lücke und keine Kerben. |
| P3-4 Fokus nach Start | Ein Effekt auf `token` setzt den Fokus mit `setTimeout(…, 0)` ins Eingabefeld. Der iPhone-Test prüft `toBeFocused`. |
| P3-5 Einwilligung Android | `.panel[data-sheet]:has(> .consent)` hat `height: auto` und `max-height: 88dvh`. Im Chat gelten wieder 88 dvh. |
| P3-6 Leiste „Entwurf kopiert“ | Gilt nur noch auf dem Pfad, auf dem kopiert wurde (`copiedOn` in `Launcher.js`). |
| P3-7 Ziel mit Filter | Die Karte zeigt „Ziel: /de/produkte/sofas-couches · Marke: Minotti“. Die Filternamen sind übersetzt, die URL bleibt verborgen. |

Nicht umgesetzt: P3-3 (der kompakte Launcher verdeckt Text). Ein Abstand von 24 px rechts löst das nicht, die Lösung liegt in `globals.css` beim Fremd-Team (siehe „Offen“). Weiter offen aus Runde 1: Panel schiebt Inhalt, Prod-Messung, Live-Red-Team, Label beim ersten Besuch.

## Offen (vor einer Freigabe)

1. **Löschfrist:** erledigt (30 Tage überall, siehe oben). Will der Inhaber 90, entscheidet er das in `inhaber-entscheidungen.md`; dann Rechtspaket und `retention.js` gemeinsam ändern.
2. **Fremde Teams:**
   - Footer-Link „KI-Concierge einblenden“: nur ein Element mit `data-concierge-show`; bis dahin dient die Lasche als Rückweg.
   - **Echte Vorausfüllung (Variante a), Anfrage über den Teamleiter an den Eigentümer von `src/components/BeratungClient/BeratungClient.js`:** Dort wird `?produkt=` schon gelesen (Z. 64–79). Für `anliegen` fehlen etwa 5 Zeilen am selben Ort: nur bei `quelle=concierge` lesen, auf 600 Zeichen kürzen und als reinen Text **zusätzlich** zum Produktpräfix in `message` setzen. Über Schritt 3 den Hinweis „KI-Entwurf – bitte prüfen“ zeigen. Nichts automatisch absenden. Danach `formHint` in `texts.js` ändern auf „Wir öffnen das Formular, Ihr Entwurf steht in Schritt 3 – Sie prüfen und senden selbst.“ Der Termin-Test prüft dann `#beratung-vorhaben` mit Inhalt. Bis dahin gilt Variante b (Kopieren) mit dem Ziel `#anfrage`.
   - Der Link in der Einwilligung führt auf `#ki-concierge`. Dieser Abschnitt liegt bisher nur als Entwurf vor (`LegalDrafts/docs/datenschutz.js:309`) und muss vor der Freigabe live gehen.
   - Abschnitt `#ki-concierge` in der Datenschutzerklärung.
   - In `globals.css` soll `--ph-concierge-h` (64 px, wird gesetzt) zu `scroll-padding-bottom` addiert werden.
   - Optional `data-concierge-section` an wichtigen Abschnitten.
3. **Anbieter W12** (Bedrock EU oder API mit SCC/TIA): offen. Ein Wechsel betrifft nur `run.js`.
4. **Sprachen außer de** erst nach Übersetzung der Rechtstexte (Produktion: `NEXT_PUBLIC_CONCIERGE_LOCALES` unverändert lassen).
5. **E7 nur halb umgesetzt:** Die Labs-Seite nutzt noch ihren eigenen Client (`Labs/Concierge/Concierge.js`), nur Server, Tools und `RichText` sind gemeinsam. Die Umstellung auf `ChatCore` kommt im nächsten Schritt.
6. **`tests/e2e/labs-concierge.spec.js`:** robust gegen beide Server-Modi (`enterMock`: Knopf „Mock-Modus testen“ nur klicken, wenn vorhanden; nicht übersprungen).
7. Ein Produktions-Build wurde nicht gemessen (kein `npm run build` im Repo). Dass der Chunk bei ausgeschaltetem Flag ganz aus dem Bundle fällt und wie groß der Launcher minifiziert ist, prüft der Integrator mit `tools/ci/bundle-budget.mjs`.
8. Rate-Limit und Vorschlagszähler liegen im Arbeitsspeicher. Für mehrere Instanzen braucht es `createSharedStore`, und die IP-Grenzen sind für den seitenweiten Betrieb zu prüfen.
9. Der Kontext auf der 404-Seite wird nicht gesondert erkannt; der Knopf erscheint dort. Ein 50-Fragen-Test mit echtem Modell, inklusive Aktionen und Prompt-Injection, steht noch aus.
