# R6-leads: zod jitless (CSP-fähig), CSP-Absende-Probe, OG-Locale, dünne Fallbacks

Stand: 26.10.2026, Branch `feature/neuauftritt`, kein Commit. Kein echter Versand: Alle Form-POSTs waren abgefangen (e2e: `blockFormSends` + `page.route`; Unit: lokale Stubs). Nichts ging ans Backoffice, es wurde keine Mail verschickt. `next.config.js` im Repo ist unverändert und bleibt Report-Only.

## Ergebnis

| Auftrag | Status |
|---|---|
| (1) zod ohne eval | **erledigt.** `z.config({ jitless: true })` in `src/lib/forms/schemas.js` steht vor dem ersten `z.object()` |
| (1) CSP-Absende-Probe | **erledigt: 0 Verstöße** auf Kontakt, Beratung und Produktanfrage, mit erzwungener CSP im Prod-Build einer Kopie. Die Kontrollprobe greift. |
| (2) OG-Locale | **erledigt.** `ogLocale(locale)` steht auf Kontakt, Beratung, Newsletter, Adventsabend und Bewerten |
| (3) Dünne Fallbacks | **erledigt.** R6-i18n hat `forms.selfReport.*` übernommen, `cart.selection.*`/`booking.*` waren schon da. `SELF_REPORT_TEXT` und `LEADS_TEXT` enthalten nur noch DE, EN/FR/IT sind `{}`. |

## (1) zod jitless

- **API nachgelesen** in zod 4.6.7 (`node_modules/zod/v4/core/core.d.ts`, `$ZodConfig.jitless`): „Disable JIT schema compilation. Useful in environments that disallow `eval`.“ Was dahinter passiert (`core/schemas.js` `$ZodObjectJIT`, `core/util.js` `allowsEval`): Beim **Bauen** eines `z.object()` liest zod `globalConfig.jitless`. Ist das Flag aus, ruft zod `new Function("")` als Probe auf und kompiliert beim Parsen einen Schnellpfad über `new Function`. Ist es an, entfallen Probe und JIT. Der Aufruf muss deshalb vor den Schemas stehen. Ein Unit-Test prüft das.
- **Nachweis** (`tests/unit/r6-leads.test.mjs`): Ein frischer Prozess zählt `new Function`-Aufrufe über einen Proxy. Reines zod: > 0 (Kontrolle). `schemas.js` mit allen 4 Schemas gebaut und geparst: **0**. Die Ergebnisse sind gleich wie vorher: unbekannte Felder fallen weg, die Fehlermeldungen sind unverändert. Dazu laufen `r4-leads`, `r5-leads`, `forms`, `forms-fix`, `forms-leads`, `r5-commerce(-fix)` (diese importieren `schemas.js`) und `r5-i18n` grün: zusammen 108 von 108.
- **Einordnung:** Die Formular-Schemas laufen heute nur auf dem Server (API-Routen, `lib/forms/newsletter.js`; `lib/commerce/*` nutzt `EMAIL_RE`/`PHONE_RE`). Laut client-reference-manifest des Prod-Builds lädt keine der Seiten /kontakt, /beratung und /merkliste einen zod-Chunk. jitless verhindert, dass ein späterer Client-Import oder eine Laufzeit ohne Code-Generierung zu CSP-/eval-Fehlern führt. Die Einstellung gilt global für die zod-Instanz, wie `src/components/Labs/zod.js` es für Labs schon macht.
- Das Backoffice-Format ist unverändert: gleiche Felder, `lead_ref` wird weiter verworfen.

## (1) CSP-Absende-Probe (Prod-Build, erzwungene CSP)

- **Kopie** `C:/Users/admin.local/Documents/ph-prod-r6-leads` (außerhalb des Repos), angelegt mit `tools/qa/prod-check.mjs --steps=copy`. **Nur in der Kopie** wurde `next.config.repo.js` geändert: Der Header `Content-Security-Policy-Report-Only` heißt dort `Content-Security-Policy`, und zwar an beiden Stellen. Die Policy selbst ist dieselbe: `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' …`, **ohne `'unsafe-eval'`**.
- Der erste Build brach an einer fremden Zwischenänderung ab (`ShopCatalog/shopCatalog.js`, `FilterGroup is not defined`, Paket R6-produkt). `src` wurde neu in die Kopie gespiegelt, danach lief der Build sauber durch (7 802 statische Seiten). Der Server lief mit `next start` auf :3171. Die Probe meldet erwartungsgemäß „CSP-Report-Only fehlt“, weil der Header jetzt erzwingend gesetzt ist.
- **Spec** `tests/e2e/r6-leads-csp.spec.js`: Ein Init-Skript sammelt ab dem ersten Byte jedes `securitypolicyviolation`-Ereignis, dazu jede CSP-Konsolenmeldung. Ausgefüllt und abgeschickt werden Kontakt (mit Selbstauskunft, inklusive der danach lazy geladenen Upload-Karte), Beratung (4 Schritte) und Produktanfrage (Merkliste). Die Form-Endpunkte beantwortet `page.route`, alle übrigen `/api/**`-POSTs liefern 503, GTM wird abgebrochen. Auf dem Dev-Server (ohne CSP-Header) überspringt sich die Spec selbst.
- **Kontrolle:** Ein Skript von einem fremden Host (`csp-probe.invalid`) wird als `script-src-elem` gemeldet. Der Zähler funktioniert also.
- **Ergebnis** (`qa-screenshots/teamleiter/r6-leads/csp-probe-3/`): **4 von 4 grün, 0 flaky**, Annotation `csp: enforced`. Kontakt, Beratung und Produkt jeweils `{ "events": [], "console": [] }`. Erster Lauf ohne Kontrolle: `csp-probe-2/`, 3 von 3 grün.
- Abbau: Der Server wurde per `taskkill /T` auf seine PID beendet, die Junction mit `rmdir` entfernt. Das node_modules im Repo ist unversehrt.

## (2) OG-Locale

`import { ogLocale } from "@/lib/seo/pageMetadata"` (nur importiert, die Datei selbst ist unverändert):
- Kontakt, Beratung: Beide Zweige (CMS und Fallback) nutzen jetzt `ogLocale(locale)`. Vorher war es `de_DE`/`en_US`, beim CMS-Zweig sogar `meta?.locale` aus dem Backoffice.
- Newsletter: `ogLocale(locale)` statt `de_DE`/`en_US`.
- Adventsabend: `ogLocale(locale)` statt des festen `"de_AT"`. Der Wert bleibt gleich, die Seite ist nur auf DE.
- Bewerten: hat jetzt ein eigenes `openGraph` (type, url, title, description, siteName, `locale: ogLocale(locale)`, Bild wie im Layout). Ein Seiten-`openGraph` ersetzt das des Layouts, deshalb steht das Bild dort noch einmal.
- Geprüft per curl auf :3000: de/* `de_AT`, it/contatto und it/consulenza `it_IT`, en/contact `en_GB`, fr/contact `fr_FR`. Canonical, hreflang und robots sind unverändert, es gibt keinen SEO-Verlust.

## (3) Dünne Fallbacks

- `src/lib/forms/selfReport.js` → `SELF_REPORT_TEXT` enthält nur noch `de` (= `messages/de.json` `forms.selfReport`), `en/fr/it: {}`. `Forms/SelfReportField.js` liest zuerst die Messages (`t.has`) und fällt bei einem fehlenden Schlüssel auf DE zurück. `useLocale` wurde entfernt.
- `src/lib/forms/leadsCopy.js` → `LEADS_TEXT` enthält nur noch `de`, `en/fr/it: {}`. `leadsText()` fällt auf DE zurück und zeigt nie einen nackten Schlüssel.
- Die Tests prüfen jetzt gegen die Messages:
  - `r4-leads`: Vorschlag r4 = Messages in 4 Sprachen, Fallback DE = messages/de, kein Superlativ.
  - `r5-leads`: `forms.selfReport.*` in 4 Sprachen = Vorschlag r5, jeder Code vorhanden.
  - `forms-leads`: neuer Test, r4 und r5 sind über next-intl lesbar (inklusive ICU `booking.note`).
  - `r5-i18n` (IT-tu-Prüfung der Fallbacks) bleibt grün.

## Prüfung

- Unit: 108 von 108 grün (r6-leads 5, r5-leads, r4-leads, forms-leads, forms, forms-fix, r5-i18n, r5-commerce, r5-commerce-fix).
- e2e Dev (:3000, desktop): `r4-leads` + `r5-leads` 12 von 12. Ein Test war im ersten Lauf rot, weil gerade ein fremder Kompilierfehler im Dev-Server stand. Einzeln wiederholt war er grün.
- ESLint auf allen Paketdateien und Tests: 0 Meldungen.
- **Screenshots** in `qa-screenshots/teamleiter/r6-R6-leads/selbst/` (6 URLs × 4 Geräte). Der letzte Lauf ergab 24 von 24 mit Status 200 und 0 Konsolenfehlern. Die Läufe 1 bis 3 trafen auf globale 500er und Fehler im Dev-Server, weil andere Pakete gerade Zwischenstände gespeichert hatten (MarkenItems, Navbar/DesktopNav, Freigaben/Cockpit, Reusable/fonts.js). Ein Hydration-Hinweis auf dem iPad war in einem gezielten WebKit-Nachlauf nicht mehr reproduzierbar.
- **Angesehen:** Kontakt auf dem iPhone, Contatto auf dem iPad, Beratung und Bewerten am Desktop. Layout, Buttons und Texte sind sauber. Auf IT-Contatto steht die Selbstauskunft im HTML als „Come ci hai conosciuto?“, der Text kommt also aus den Messages.

## Dateien

Neu: `tests/unit/r6-leads.test.mjs`, `tests/e2e/r6-leads-csp.spec.js`.
Geändert:
- `src/lib/forms/{schemas,selfReport,leadsCopy}.js`
- `src/components/Forms/SelfReportField.js`
- `src/app/[locale]/{kontakt,beratung,newsletter,adventsabend,bewerten}/page.js`
- `tests/unit/{r4-leads,r5-leads,forms-leads}.test.mjs`

Unverändert: API-Routen, `forward.js`, `leadPayload.js`, `next.config.js` (Report-Only), Backoffice-Format.

## Offene Punkte

1. **CSP scharf schalten** ist Sache von R6-release bzw. der Übergabe. Für die Lead-Strecke ist das belegt unbedenklich (0 Verstöße mit erzwungener Policy). Die übrigen Seiten (Labs, Portal, Maps-Einbettung nach Einwilligung) sind damit nicht geprüft.
2. Fremde Zwischenstände (ShopCatalog, Navbar/DesktopNav, Freigaben/Cockpit) haben während der Arbeit zeitweise Build und Dev-Server gebrochen. Die Lead-Dateien betraf das nicht.
3. Aufräumen: Die Build-Kopie `../ph-prod-r6-leads` kann gelöscht werden. Ältere Kopien sind `../ph-prod-r5-leads*`.

## Fix-Runde (Teamleiter-Feedback `qa-screenshots/teamleiter/r6-R6-leads/feedback.md`, Note 8/10, P1: keine)

| Punkt | Status |
|---|---|
| P2-1 Deutsche Upload-Karte auf IT/EN (WCAG 3.1.2) | **behoben.** `src/components/Forms/lazyHandoff.js` hat jetzt `HANDOFF_LOCALES = {"de"}`. `handoffAfterSend(kind, { …, locale })` gibt außerhalb von DE `null` zurück, `prefetchHandoff(locale)` lädt dort nichts. Kontakt, Beratung und Produktanfrage geben ihre Locale mit. Auf en/fr/it steht nur noch die übersetzte Erfolgsmeldung, der Upload-Chunk wird nicht geladen und `/api/upload/session` nicht aufgerufen. `UploadHandoff.js` gehört zum Upload-Paket und bleibt unverändert. Sobald dessen Texte in `src/messages/*.json` stehen, wird die Locale in `HANDOFF_LOCALES` ergänzt. |
| P2-2 CSP-Probe nur für die Lead-Formulare | **statisch geschlossen, Laufzeitprobe bleibt bei R6-release.** Der neue Test `tests/unit/r6-leads-fix.test.mjs` baut den Importgraphen ab allen `"use client"`-Modulen auf. `"use server"`- und `server-only`-Module zählt er nicht mit. Ergebnis: Das einzige zod-Modul, das im Browser landet, ist `src/components/Labs/zod.js`, und es setzt bereits `config({ jitless: true })`. Portal (`lib/portal/schemas.js`, `Portal/Planung/schemas.js`, `Portal/Docs/actions.js` mit „use server“), Upload-Routen, Concierge und Commerce laufen nur auf dem Server, die Seiten-CSP betrifft sie nicht. Der Test schlägt fehl, sobald ein clientseitiges zod-Modul ohne jitless dazukommt. Die Laufzeitprobe mit erzwungener CSP auf Labs, Portal und Upload bleibt Aufgabe von R6-release, weil diese Routen fremde Pakete sind. |

**Prüfung Fix-Runde**
- Unit: r6-leads, r6-leads-fix, r4, r5 und forms-leads: 51/51 grün. In `forms-leads.test.mjs` erlaubt das Muster jetzt `, locale` im Aufruf von `handoffAfterSend`. ESLint ist sauber.
- Funktion (Playwright gegen den Dev-Server, alle POSTs abgefangen und gemockt, Antwort mit Upload-Ticket, nichts gesendet): Auf DE erscheint die Karte wie bisher. Auf IT, EN und FR erscheint keine Karte und kein deutscher Text, es geht genau ein POST an `/api/upload/inquiry/kontakt`, und die Erfolgsmeldung steht in der Seitensprache. Belege: `qa-screenshots/teamleiter/r6-leads/fix/func-{de,it,en,fr}.png`.
- Screenshots: `node tools/qa/shoot.mjs qa-screenshots/teamleiter/r6-leads/fix` für de/kontakt, it/contatto, en/contact, de/beratung, it/beratung und de/merkliste. Ergebnis: 24/24 mit Status 200, 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein Overflow.

Neu: `tests/unit/r6-leads-fix.test.mjs`. Geändert: `src/components/Forms/lazyHandoff.js`, `src/components/Kontakt/KontaktForm.js`, `src/components/BeratungClient/BeratungClient.js`, `src/components/AnfrageFormProduct/AnfrageFormProduct.js`, `tests/unit/forms-leads.test.mjs`.

Offen (P3, nicht Teil dieser Runde): Die Build-Kopie `../ph-prod-r6-leads` ist noch nicht gelöscht. In der Feature-Doku fehlt die Begründung, warum Adventsabend keine Selbstauskunft hat. Es fehlt ein Test zur Importreihenfolge bei jitless.
