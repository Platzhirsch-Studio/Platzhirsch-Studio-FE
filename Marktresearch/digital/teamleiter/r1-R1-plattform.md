# R1-plattform: Fehlerseiten, backofficeFetch, Fehler-Logging

Stand 26.10.2026, Branch `feature/neuauftritt`. Es gibt keinen Commit, kein Deploy und keine npm-Installation.

Gelesen habe ich vorher: `01-app/03-api-reference/03-file-conventions/error.md` (Next 16.3 übergibt `retry` neben `reset`, `global-error` braucht eigenes `<html>`/`<body>` und eigene Styles), `.../instrumentation.md` (`onRequestError(err, request, context)`) und `.../04-functions/fetch.md`. Wichtig daraus: **Ein fetch mit `signal` wird pro Render nicht memoisiert.** Der Datencache mit `revalidate`/`tags` gilt trotzdem weiter.

## Ergebnis

| # | Teil | Datei | Status |
|---|---|---|---|
| 1 | `backofficeFetch(url, { …init, timeoutMs = 6000, retries = 1, critical = false })` | `src/lib/api/http.js` | fertig |
| 2 | Alle 22 Backoffice-fetches in `src/lib/api/**` umgestellt | 20 Fetcher-Dateien | fertig, Verträge unverändert |
| 3 | Fehlerseiten, 4-sprachig | `src/app/[locale]/error.js`, `src/app/global-error.js` | fertig |
| 4 | `onRequestError` als JSON-Zeile, ohne externen Dienst | `src/instrumentation.js` (neu, vorher gab es keine Datei) | fertig |
| 5 | Unit-Tests | `tests/unit/http.test.mjs`: 14 Tests, alle grün | fertig |
| 6 | Seiten liefern 200, Screenshots | `qa-screenshots/teamleiter/r1-R1-plattform/selbst/` | siehe unten |

### backofficeFetch (`src/lib/api/http.js`)
- Alle RequestInit-Felder (`method`, `cache`, `next: { revalidate, tags }`) werden unverändert durchgereicht. Pro Versuch kommt ein eigenes `AbortSignal.timeout(timeoutMs)` dazu. Ein Signal des Aufrufers wird mit `AbortSignal.any` kombiniert.
- Nur GET, HEAD und OPTIONS werden wiederholt, und zwar bei Timeout, Netzfehler oder 5xx. Zwischen den Versuchen liegen 250 ms. **4xx wird nie wiederholt**, POST auch nicht.
- Pro Fehler, Wiederholung oder langsamem Aufruf (≥ 2 s) entsteht eine JSON-Logzeile: `{src:"backoffice", level, endpoint:"news.api.news_data", query:["marken"], method, status, ms, attempt, of, outcome}`. Von der Query werden **nur die Parameternamen** geloggt, nie die Werte (Suchbegriffe, Tokens). Erfolgreiche Aufrufe loggen nichts. Mit `BACKOFFICE_LOG=verbose` wird jeder Aufruf geloggt.
- Bei `critical:false` verhält sich die Funktion wie `fetch`: Eine Nicht-ok-Response kommt zurück, ein Netzfehler oder Timeout wird weitergeworfen. Die vorhandenen `try/catch`-Fallbacks der Fetcher greifen also wie bisher.
- Bei `critical:true` wirft die Funktion einen `BackofficeError` mit `{endpoint, status, attempts, reason}`.
- `backofficeMessage(url, { fallback, critical })` liefert `data.message` und wirft mit `critical:true` auch bei leerem Payload. Das ist die Vorbereitung für ISR („keine leeren Antworten cachen“). In R1 ist es noch nirgends eingesetzt.

### Umstellung der Fetcher
- Geändert wurden nur `fetch(` → `backofficeFetch(` und der Import. Wo vorher `signal: AbortSignal.timeout(15000)` stand (fetchAllProdukte/getMessage, fetchHomepage, fetchMarkenData, fetchLayoutKeywords), steht jetzt `timeoutMs: 15000`. Diese Fetcher behalten also ihr Zeitlimit. Alle anderen bekommen neu 6 s statt bisher gar keines.
- `revalidate`, `tags` und `cache` sind unverändert, ebenso alle Fallbacks und throws. `critical` ist nirgends gesetzt.
- Gemessene Backoffice-Latenzen (Produktion, curl): 0,1 bis 0,6 s. Das 6-s-Limit hat also reichlich Puffer.

### Fehlerseiten
- **`[locale]/error.js`**: läuft innerhalb des Locale-Layouts, Navbar und Footer bleiben also sichtbar. Inhalt: Overline, Bodoni-Headline (die beim Laden den Fokus bekommt), ein ruhiger Text, als Primärknopf „Erneut versuchen“ (`retry`, sonst `reset`), Links zu Startseite und Kontakt (lokalisiert über `ROUTES.kontakt`) und die Telefonnummer aus `src/lib/site.js`. Die Sprache kommt aus `useParams().locale`. Das Wörterbuch DE/EN/FR/IT steht lokal in der Datei. Es gibt keine Superlative und kein Ausrufezeichen, Farben und Schrift kommen nur aus `@theme` (Tokens, kein Hex), Ziele sind ≥ 44 px groß, Übergänge laufen mit `motion-reduce:transition-none`.
- **`global-error.js`**: eigenes `<html lang>`/`<body>`, importiert `globals.css`, setzt `<title>` und `noindex`. Die Links sind einfache `<a>`, weil nach einem Layout-Absturz ein voller Seitenaufruf der sicherere Weg ist. Die Sprache kommt aus `useParams`, sonst aus dem ersten Pfadsegment, sonst `de`.
- Besucher sehen keine technischen Details. In der Konsole landet nur `{digest}`, und genau diesen Digest findet man in der Serverlogzeile wieder.

### instrumentation (`src/instrumentation.js`)
- `onRequestError` schreibt eine `console.error`-JSON-Zeile mit den Feldern name, message, digest, method, path, route (`routePath`), routeType, renderSource, revalidateReason und runtime. Bei einem BackofficeError kommen endpoint, status und reason dazu.
- Nicht geloggt werden Header (Cookies, IP, User-Agent), Body, Query und Stack. E-Mail-Adressen in der Message werden zu `[email]`, eine Query in der Message zu `?[query]`, die Message wird auf 300 Zeichen gekürzt. Tokenartige Pfadsegmente (gemischte Groß-/Kleinschreibung plus Ziffern, ≥ 16 Zeichen, z. B. `/upload/[token]`) werden zu `[redacted]`. Slugs in Kleinbuchstaben bleiben lesbar.
- Es gibt keinen externen Dienst (E11 ist offen). Das Ziel lässt sich später an genau dieser Stelle einhängen.

## Prüfung
- `node --test tests/unit/http.test.mjs`: 14/14 grün. Geprüft werden Durchreichen der Optionen, Timeout plus Retry, Retry nach Timeout mit Erfolg, 5xx-Retry, kein Retry bei 400/403/404/429, kein Retry bei POST, Netzfehler, critical bei 4xx/Timeout/5xx, keine Query-Werte im Log, describeUrl bei ungültiger Basis-URL und backofficeMessage.
- `npx eslint` auf alle meine Dateien: 0 Meldungen.
- HTTP 200 (Dev-Server, warm, Zeiten in s): `/de` 5,9/6,6, `/de/produkte` 2,7/5,4, `/de/ueber-uns/marken/minotti` 3,3/2,8, `/de/news` 8,2/2,5, `/de/produkte/beds/sofas-twiggy-bed` 1,2/5,7. **Die Zeiten sind stark verrauscht**, weil parallel andere Teams auf demselben Dev-Server kompilieren. Vor meiner Änderung gab es keine saubere Vergleichsmessung: Der Server lieferte zu dem Zeitpunkt wegen eines fremden Compile-Fehlers (`Upload/ConsentText.js`) auf allen Seiten 500. Der Overhead des Wrappers liegt bei einem Objekt-Spread pro Aufruf. Bei Cache-Treffern ändert sich nichts.
- Screenshots: `qa-screenshots/teamleiter/r1-R1-plattform/selbst/` (report.json). Geprüft wurden 5 Seiten auf 4 Geräten. 19 von 20 Aufnahmen liefern 200, ohne horizontales Überlaufen und mit vollständigen Backoffice-Daten (Minotti-Hero, News, Produkt). Ausreißer ist Android `/de`: Dort lief der Seitenaufbau in ein Timeout, weil der Dev-Server gerade neu kompilierte (fremdes HMR, „Compiling…“). Auf iPhone, iPad und Desktop liefert `/de` 200. Die Konsolenwarnungen „state update on a component that hasn't mounted“ gehören zu vorhandenen Client-Komponenten, nicht zu meinen Dateien.

## Andere direkte Backoffice-fetches (bewusst NICHT geändert)
- `src/lib/seo/legacyProductRedirects.js:46`
- `src/components/Navbar/navbar.js:247` (Client-Suche)
- `src/app/cmx/[...path]/route.js:61` (Datei-Proxy, hat schon einen eigenen Timeout)
- `src/app/api/newsletter_subscribe/route.js`, `src/app/api/kontakt/route.js`, `src/app/api/anfrage_produkt/route.js`, `src/app/api/beratung_anfrage/route.js` (POST, kein Retry sinnvoll)
- `src/lib/portal/adapters/frappe.js`, `src/lib/upload/frappeAdapter.js`, `src/components/Labs/ArViewer/data/source.js`, `src/components/Labs/Dreilaender/store.server.js`

## Offene Punkte
1. **Memoisierung:** Fetches mit Signal werden pro Render nicht dedupliziert. Bei den Fetchern, die schon vorher ein Signal hatten, ändert sich nichts. Alle anderen (Keywords, News, Team, Kategorien und so weiter) werden bei einem Cache-Miss pro Render gegebenenfalls doppelt geladen. Bei einem Cache-Treffer kommt alles aus dem Datencache. Falls Messungen ohne Parallellast eine Verschlechterung zeigen, kommt in R2 ein In-flight-Dedupe in `http.js` dazu.
2. **R2/ISR:** `critical:true` beziehungsweise `backofficeMessage` gezielt für Seiten einsetzen, die keine leeren Antworten cachen dürfen (Marken, Produktdetail, News). Dafür müssen die Rückgabeverträge bewusst geändert werden.
3. **Fehlerseiten** sind noch nicht mit einem echten Fehler ausgelöst. Dafür bräuchte es eine Test-Route außerhalb meines Dateibereichs (Vorschlag: `/[locale]/preview/fehler` mit `throw`, noindex).
4. **E11:** Ziel für die Fehlerprotokolle entscheiden (zum Beispiel Sentry EU oder eigener Log-Drain).
5. Die Fetcher, die vorher kein Zeitlimit hatten, brechen jetzt nach 6 s plus 6 s ab und liefern dann wie bisher ihren Fallback.

---

## Nachbesserung nach QA-Feedback (Note 8/10, kein P1), Stand 26.10.2026

Belege: `qa-screenshots/teamleiter/r1-R1-plattform/fix/` (shoot.mjs, report.json, `*--ohne-overlay.png`, `errcheck.json`), `fix2/` (global-error nach Schrift-Fix), `fix/seiten/` (Regression `/de` und Minotti: 8/8 mit 200, Backoffice-Daten vollständig).

| QA-Punkt | Status | Umsetzung |
|---|---|---|
| P2.1 Fehlerseiten nie ausgelöst | **behoben** | Zwei noindex-Testrouten, die absichtlich werfen. Aktiv nur in Dev oder mit `ERROR_PREVIEW=1`, sonst 404 (`force-dynamic`, damit der Build nichts vorrendert). `/{de,en,fr,it}/preview/fehler` löst `[locale]/error.js` aus. `/fehlerseite-global.preview` liegt außerhalb von `[locale]`, deshalb landet der Fehler direkt in `global-error.js`. Der Punkt im Ordnernamen sorgt dafür, dass der next-intl-Proxy die Route nicht umleitet. Geprüft auf allen 4 Geräten (DE, EN, FR, IT, global): Status **500**, Meta `noindex` (global-error setzt es selbst, error.js jetzt ebenfalls über eine React-19-`<meta>`), `lang` korrekt, Navbar und Footer bei error.js sichtbar, Retry-Knopf 44 px und funktioniert (die Seite wirft erneut und die Fehlerseite kommt wieder), kein Überlauf, Konsole zeigt nur `{digest}`. Fokus liegt bei error.js auf der H1. Der sichtbare Fokusrahmen um die H1 ist entfernt: Die globale `:focus-visible`-Regel liegt ohne Layer und schlägt `outline-none`, deshalb jetzt inline. Die H1 ist kein Tab-Stopp. |
| P2.2 Worst Case 30 s | **behoben** | `http.js` hat ein neues Gesamtbudget `budgetMs`. Jeder Versuch bekommt min(timeoutMs, Rest). Ein Retry startet nur, wenn danach noch ≥ 1 s übrig ist. `fetchLayoutKeywords`, `fetchHomepage`, `fetchMarkenData` und `fetchAllProdukte/getMessage` laufen jetzt mit **2 × 7 s in einem Budget von 15 s**, im schlimmsten Fall also ≤ 15 s wie vorher, aber mit Retry. Gemessene Latenz der Endpunkte: 0,10 bis 0,24 s (Marken 343 KB), 7 s sind also mehr als 25-facher Puffer. |
| P2.3 Memoisierung/Ladezeit | **behoben (Dedupe), Messung eingeschränkt** | In-flight-Dedupe pro Request in `http.js`: Gleiche GET/HEAD-Aufrufe ohne Body und ohne Signal des Aufrufers teilen sich innerhalb eines Renders einen Backend-Call. Der Scope kommt aus React `cache()` und gilt nur innerhalb eines Server-Requests. Zwischen Requests wird **nie** geteilt, so registriert jeder Request weiter seine eigenen `revalidate`/`tags`. Jeder Aufrufer bekommt eine eigene Response-Kopie, Fehler werden nicht im Scope gecacht. Isolierte Messung gegen das Produktions-Backoffice, ohne Dev-Server (Cold-Render-Muster `/de`: Layout, Metadata und Seite fragen Layout-Keywords, Homepage und Marken je zweimal ab, 5 Läufe, Median): **ohne Dedupe 6 Calls / 176 ms, mit Dedupe 3 Calls / 139 ms**. Eine saubere Seitenmessung über den Dev-Server war wieder nicht möglich, weil laut Monitor 13 Agenten parallel liefen. `/de` brauchte 7,6 bis 10,9 s, die Werte sind stark verrauscht und nicht aussagekräftig. |
| P3.1 Token-Schwärzung geraten | **behoben** | `sanitizePath(path, routePath)`: Segmente unter geheimen Platzhaltern (`[token]`, `[id]`, `[fileId]`, `…code/key/secret/hash/pass/sig`, auch als Catch-all) werden deterministisch durch den Platzhalter ersetzt, z. B. `/de/upload/[token]`. Route-Gruppen und `@slots` werden übersprungen. Lesbare Platzhalter (`[locale]`, `[slug]`, `[title]`) bleiben. Die Heuristik bleibt als zweites Netz und erkennt jetzt zusätzlich Hex-IDs und UUIDs in Kleinbuchstaben. |
| P3.2 Bodoni in global-error | **bewusst entschieden** | `next/font` lässt sich dort nicht nutzen. Turbopack 16.3 lehnt Font-Loader-Aufrufe in diesem Client-Modul ab („Font loader calls must be assigned to a const“), getestet in einer isolierten Probe-Route, die danach gelöscht wurde. Ein kurzer Versuch direkt in global-error.js hat für etwa 1 Minute alle Seiten mit 500 gebrochen und wurde sofort zurückgenommen. Stattdessen setzt global-error `--font-bodoni`/`--font-instrument` auf die Familiennamen. Vorher waren die Variablen undefiniert und die ganze `font-family` ungültig, sichtbar war Systemschrift. Jetzt greift die Serif-Kette der Design-Bibel (Bodoni Moda, sonst Didot oder Georgia). Zusätzlich springt der Fokus auf die H1. |
| P3.3 fetch außerhalb `src/lib/api` | offen (R2) | nicht in meinem Dateibereich |
| P3.4 Minotti-Text „luxuriöse … feinster Handwerkskunst“ | offen, Team 7 / Backoffice | auf der Minotti-Seite weiterhin sichtbar |
| P3.5 fremde Build-Fehler melden | dokumentiert | `Kuechenplaner/planState.js:154` und `forms/guard.js:24` (aus QA) gehören zu anderen Teams. Hier sind sie dokumentiert, die Weitergabe läuft über den Teamleiter. Beim Nachtest traten sie nicht mehr auf. |

**Tests:** `node --test tests/unit/http*.test.mjs` ergibt **26/26 grün** (vorher 14). Neu sind 7 Tests in `http.test.mjs` (Budget-Deckel, kein Retry unter der Mindestzeit, 2×7-in-15-Setting skaliert, Dedupe teilt Calls, Dedupe teilt nicht bei anderen Cache-Optionen, POST, Signal oder neuem Scope, fehlgeschlagener Call wird verworfen, Nicht-ok-Antworten und critical bleiben intakt) und 5 Tests in `http-instrumentation.test.mjs` (routePath-Schwärzung, Slugs bleiben, Gruppen und Catch-all, Heuristik-Fallback, Logeintrag ohne Query, Header und E-Mail). eslint auf allen geänderten Dateien: 0 Meldungen.

**Hinweise:**
- In Dev legt Next bei global-error das Fehler-Overlay über die Seite. Die Screenshots `*--ohne-overlay.png` entfernen es per Skript. Deshalb ist der Fokus auf der H1 dort nicht messbar, weil das Overlay ihn zuerst nimmt. In Produktion gibt es kein Overlay.
- Ob der Digest in der Konsole zur Serverlogzeile passt, ließ sich nicht prüfen, weil die stdout des Dev-Servers für mich nicht lesbar ist. In der Konsole stimmt er je Route stabil überein (z. B. `1078601975` für `[locale]`, `3429113244` für global).
- Neue Dateien außerhalb meines Bereichs, aber vom QA verlangt: `src/app/[locale]/preview/fehler/page.js` und `src/app/fehlerseite-global.preview/page.js`. Beide sind nur Testrouten.
