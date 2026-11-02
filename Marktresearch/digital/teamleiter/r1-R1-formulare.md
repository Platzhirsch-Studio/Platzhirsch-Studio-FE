# R1-formulare: Härtung der Formular-APIs (abwärtskompatibel)

Stand 26.10.2026 · Runde 1 + Fix nach QA (Feedback `qa-screenshots/teamleiter/r1-R1-formulare/feedback.md`, Note 6/10) · Branch `feature/neuauftritt` (nicht committet) · Grundlage: Masterplan AP3 Nr. 1

## Fix nach QA-Runde 1

| Punkt | Status | Was geändert wurde |
|---|---|---|
| **P1-1** Rate-Limit pro IP greift nicht über `/api/upload/inquiry/<kind>` | **behoben** | Der Wrapper (Upload-Team) bleibt unverändert. Die vier Routen lesen jetzt zusätzlich die Header der **ursprünglichen** Anfrage über `next/headers` (`src/lib/forms/requestHeaders.js` → `resolveHeaders` → `guardForm({ outerHeaders })`). Der Wrapper ruft die Handler im selben Request-Kontext auf, deshalb kommt die echte `X-Forwarded-For` an. Der gemeinsame Eimer ohne IP wird damit praktisch nicht mehr benutzt. Live (dev) geprüft für alle drei Wrapper-Formulare mit schema-ungültigem Body: Kontakt, Beratung und Produkt geben ab Anfrage 21 von derselben IP **429** zurück, eine andere IP bekommt gleichzeitig 400. Ohne den Fix wären alle im Eimer ohne IP gelandet, der erst nach 120 Versuchen sperrt. Unit-Test „wrapper request without XFF …“: Anfrage 6 (gültig) ergibt 429, ein anderer Besucher kommt durch. |
| **P1-2** Doku falsch („kein Formular nutzt den Wrapper“) | **behoben** | Aufruferliste und offene Punkte korrigiert, siehe unten. Kontakt, Beratung und Produkt laufen über den Wrapper. |
| **P2-1** Backoffice antwortet auf Kontakt mit `500 {}` | **offen, an das Backoffice-Team** | Bewusst keine weitere Anfrage an das Produktiv-Backoffice. Aus dem Log ist nur bekannt: Eine schema-gültige Anfrage („QA Test“, `qa@example.invalid`, 01:46:49) bekam `http 500 {}`. Frappe meldet Validierungsfehler normalerweise mit 417 und `_server_messages`. Ein leeres `{}` mit 500 deutet auf eine Ausnahme im eigenen Endpunkt `kontakt_form.api.create_contact` hin. Das Backoffice-Team muss im Frappe **Error Log** nachsehen, ob ein Eintrag „QA Test“ entstanden ist (dann löschen) und ob der Endpunkt mit gültigen Daten funktioniert. Die alte Route hat Fehler genauso nur geloggt, das Problem stammt also nicht aus diesem Paket. **Bis zur Klärung ist nicht sicher, dass Kontaktanfragen ankommen.** |
| **P2-2** Zeitfalle `_t` hängt von der Uhr des Geräts ab | **behoben (Server), Frontend-Umstellung offen** | `_t` darf jetzt die **Dauer seit dem Rendern** in ms sein (`Math.round(performance.now() - renderedAt)`). Werte unter 1e11 gelten als Dauer und sind unabhängig von der Uhr des Geräts. Größere Werte gelten weiter als alter Zeitstempel. Jeder Fake-Erfolg wird pro Route und Grund gezählt (`fakeSuccessStats()`, Log `… (#n)`, mit Kennzeichnung `duration`/`timestamp`), damit Fehlalarme auffallen. **Offen:** Der Adventsabend (Paket R1-event) sendet noch den absoluten Zeitstempel. Er sollte auf die Dauer umstellen. Alle Frontends in Runde 2 bitte nur noch die Dauer senden. |
| **P2-3** 400er zählen mit, Sperrmeldung auf Englisch | **behoben** | Zwei Zähler pro IP und Route: **5 / 10 min** zählen nur Anfragen, die alle Prüfungen bestehen und weitergeleitet werden. **20 / 10 min** zählen jede Anfrage (gegen Fluten mit Unsinn). Zehnmal am Telefonformat zu scheitern sperrt niemanden mehr. Die 429-Meldung kommt in der Sprache des Besuchers (Referer `/de|en|fr|it/…`, sonst `Accept-Language`, sonst Deutsch) und endet ohne Punkt, weil der Küchenplaner „. Bitte versuchen Sie es erneut …“ anhängt. Die Übersetzung von `code` in den Frontends bleibt für Runde 2 offen. |

Tests: `node --test tests/unit/forms.test.mjs tests/unit/forms-fix.test.mjs` ergibt **24/24** grün (16 alt, 8 neu). ESLint ist auf allen eigenen Dateien sauber. Live wurden nur schema-ungültige Bodys gesendet, keine einzige Anfrage ging an das Backoffice.

Hinweis zur Prüfumgebung: Während des Fixes lieferte der dev-Server zeitweise für **alle** Routen 500. Die Ursache waren Kompilierfehler anderer Teams (`Labs/Kuechenplaner/planState.js`, `MarkenItems/markenitems.js` → `./brandData`, `fehlerseite-global.preview/probe/page.js`). Diese Fehler stammen nicht aus diesem Paket. Die Messreihen oben wurden wiederholt, bis sie ohne 500 durchliefen.

Screenshots `qa-screenshots/teamleiter/r1-R1-formulare/fix/` (/de/kontakt, /de/beratung, 4 Geräte): alle mit Status 200. Auf dem iPhone gibt es auf beiden Seiten einen horizontalen Überlauf, weil der neue Header den Button „Termin“ rechts abschneidet. Das gehört zu Team 1 (Header) und nicht zu diesem Paket, das nur die APIs ändert. Weitere Meldungen: der React-Hinweis „state update on a component that hasn't mounted“ (wie in Runde 1) und eine Hydration-Warnung auf Beratung/Desktop. Beides kommt aus dem Frontend.

## Ergebnis

Die vier Formular-Routen prüfen jetzt jede Anfrage über ein gemeinsames `guardForm` und leiten nur noch bekannte Felder weiter. Alle Payloads, die heute gesendet werden, kommen unverändert durch. Ziel-URL, Header, Antwortformat und Statuscode 200 bei Erfolg sind gleich geblieben.

| Prüfung | Verhalten |
|---|---|
| Rate-Limit | je IP **und Route**: 5 weitergeleitete Anfragen pro 10 min, dazu 20 Anfragen insgesamt (auch abgelehnte) pro 10 min → `429 rate_limited` mit `Retry-After`, Text in der Sprache des Besuchers. Die IP stammt aus der Anfrage selbst oder, beim Upload-Wrapper, aus der ursprünglichen Anfrage (`next/headers`) |
| Body-Größe | `Content-Length` und gelesene Bytes (Stream wird abgebrochen) → `413 too_large` |
| JSON | unlesbar oder kein Objekt → `400` |
| Honeypot `website` | nicht leer → **Fake-Erfolg** (200, gleiches Format), nichts wird weitergeleitet |
| Zeitfalle `_t` | Dauer seit dem Rendern in ms (empfohlen, unabhängig von der Uhr des Geräts) oder alter Render-Zeitstempel. Absenden unter 3 s → **Fake-Erfolg** (wird gezählt), nichts wird weitergeleitet. Fehlende, ungültige, 0 oder zukünftige Werte werden ignoriert |
| zod-Schema | Allowlist (unbekannte Felder fallen weg), alte Pflicht- und Formatregeln, neu nur Obergrenzen → `400` |
| Weiterleitung | `AbortSignal.timeout(10000)` → bei Zeitüberschreitung `504 timeout`, sonst Backoffice-Fehler `502 upstream` |
| Fehlerantworten | `{ success:false, code, error[, field] }`. `error` ist unser eigener Text (bei 400 die alten Meldungen wie „Invalid email format“). Backoffice-Details (Frappe-Text, Traceback, Status) stehen nur im Server-Log |

`website` und `_t` werden vor der Weiterleitung immer entfernt. Log-Zeilen `[forms] <route>: <grund>` enthalten keine personenbezogenen Daten (keine IP, keine E-Mail).

### Body-Limits (gemessen)

| Route | Limit | Begründung |
|---|---|---|
| `/api/kontakt` | 20 KB | Nachricht max. 8.000 Zeichen (Umlaute = 2 Byte). Typische Anfrage < 1 KB |
| `/api/beratung_anfrage` | 32 KB | Küchenplaner, schlimmster Fall gemessen mit den echten Modulen `planState`/`pricing`: U-Form 3 × 8 m, 78 Module, Notiz 1.500 Umlaute, Teilen-Link (835 Zeichen), Plan-ID und Screenshot-Link = **7,2 KB**. Beschreibung max. 12.000 Zeichen |
| `/api/anfrage_produkt` | 24 KB | bis 300 Produkt-IDs, Beschreibung max. 4.000 Zeichen |
| `/api/newsletter_subscribe` | 2 KB | `{ email, website }` |

Der Screenshot des Küchenplaners geht **nicht** über diese Routen. Er geht an `/api/labs/kuechenplaner/plan`, in die Anfrage kommt nur der Link.

### Rate-Limit-Speicher

Der Speicher liegt im Arbeitsspeicher (`src/lib/forms/rateLimit.js`) und funktioniert nur, weil `ecosystem.config.js` **pm2 `instances: 1`, `exec_mode: fork`** setzt. Bei mehreren Instanzen oder Serverless zählt jede Instanz für sich (Limit × n). Dann muss der Speicher auf Redis/Upstash umgestellt werden, etwa mit `rate-limiter-flexible` und Store. Ein Neustart setzt die Zähler zurück.

Für die IP gilt der **letzte** Eintrag in `X-Forwarded-For`, also der, den nginx angehängt hat. Ohne nginx (dev) setzt Next.js den Header selbst auf die Socket-Adresse (`base-server.js`). Anfragen ohne jede IP teilen sich einen Eimer mit 30 weitergeleiteten bzw. 120 Anfragen pro 10 min. Seit dem Fix kommt das nur noch außerhalb eines Request-Kontexts vor (Tests), weil die Routen die ursprünglichen Header lesen.

## Dateien

- neu `src/lib/forms/guard.js`: `guardForm(request, schema, { route, limit, maxBytes, invalidCode, fakeSuccess })`, `readCapped`, `isTooFast`, `errorResponse`
- neu `src/lib/forms/rateLimit.js`: Sliding Window, `clientIp`
- neu `src/lib/forms/schemas.js`: Schemas je Route, `MAX_BYTES`
- neu `src/lib/forms/forward.js`: `forwardJson` (Timeout, wirft nie), `inquiryHandler` (gemeinsamer POST für Kontakt, Beratung, Produkt)
- neu `src/lib/forms/newsletter.js`: `newsletterHandler` (alte Codes `invalid_email`/`already_subscribed`/`failed`)
- geändert `src/app/api/{kontakt,beratung_anfrage,anfrage_produkt,newsletter_subscribe}/route.js`: nur noch Konfiguration (URL, Schema, Limit, Texte)
- neu `src/lib/forms/requestHeaders.js`: `originalRequestHeaders()` (Header der ursprünglichen Anfrage über `next/headers`, außerhalb eines Request-Kontexts `null`)
- neu `tests/unit/forms.test.mjs`: 16 Tests; neu `tests/unit/forms-fix.test.mjs`: 8 Tests zu den QA-Punkten. Lauf: `node --test tests/unit/forms.test.mjs tests/unit/forms-fix.test.mjs`

Die getestete Logik hat keine `@/`-Importe. Node meldet beim Testlauf `MODULE_TYPELESS_PACKAGE_JSON`; das ist nur eine Warnung, weil `package.json` kein `"type"` hat.

## Formular-Vertrag für Clients

```
POST /api/<route>   Content-Type: application/json
Body: { ...Felder der Route..., website: "", _t: <Date.now() beim Rendern des Formulars> }
```

- `website`: optional. Ein für Menschen verstecktes Feld (`aria-hidden`, `tabIndex=-1`, `autoComplete="off"`, außerhalb des sichtbaren Bereichs, **nicht** `display:none`). Immer leer senden.
- `_t`: optional. **Dauer seit dem Rendern in ms**: beim Mount `renderedAt = performance.now()` merken, beim Absenden `_t: Math.round(performance.now() - renderedAt)` senden. Diese Dauer hängt nicht von der Uhr des Geräts ab. Der alte absolute Zeitstempel (`Date.now()` beim Rendern) wird weiter angenommen. Geht die Uhr eines Geräts aber um ungefähr die Ausfüllzeit vor, kann er echte Anfragen verwerfen, deshalb nicht mehr neu verwenden.
- **Erfolg:** `response.ok && json.success === true`. Bei Kontakt, Beratung und Produkt bleibt die Form `{ success, message, data }`. `data` ist die Backoffice-Antwort, `UploadHandoff` liest daraus `data.message.name`. Newsletter: `{ success: true }`.
- **Fehler:** `json.code` auswerten, nicht `json.error` anzeigen. Codes: `invalid` (Newsletter: `invalid_email`) 400, `too_large` 413, `rate_limited` 429, `already_subscribed` 409 (nur Newsletter), `upstream`/`failed` 502, `timeout` 504, `internal` 500. Bei 400 nennt `field` das erste fehlerhafte Feld.
- Fake-Erfolg bei Bots sieht aus wie ein echter Erfolg. Clients brauchen keinen Sonderfall.

Umstellung: Das Paket **R1-event** baut `website` und `_t` in den Adventsabend ein. Kontakt, Beratung, Produktanfrage und Küchenplaner stellt das zuständige Team in **Runde 2** um. Newsletter sendet `website` schon heute, `_t` fehlt noch. Solange die Felder fehlen, greifen Rate-Limit, Größe und Schema trotzdem.

## Aufrufer und Prüfergebnis

Alle Aufrufer wurden nur gelesen, nicht geändert. Für jeden Payload wurde mit dem neuen Schema geprüft, dass er unverändert durchgeht (Unit-Test „schemas accept every payload the callers send today“).

| Aufrufer | Route | Payload | Ergebnis |
|---|---|---|---|
| `src/components/Kontakt/kontakt.js` | `/api/upload/inquiry/kontakt` → `/api/kontakt` | `{ name, company, email_address, telefon, ihre_nachricht }` | ok. Wertet nur `ok && success` aus, Handoff über `data` |
| `src/app/[locale]/adventsabend/AdventsabendForm.js` | `/api/kontakt` | wie Kontakt, `company: ""`, Personen im Nachrichtentext | ok |
| `src/components/BeratungClient/BeratungClient.js` | `/api/upload/inquiry/beratung` → `/api/beratung_anfrage` | `{ bei_meiner_anfrage_geht_es_um, das_projekt_soll_verwirklicht_werden, bitte_beschreiben_sie_ihr_vorhaben, vorname, nachname, email, telefon }`. Die Auswahlfelder enthalten übersetzte Labels, deshalb freier Text statt Enum | ok. Zeigt bei Fehlern `data.error` an, jetzt unser generischer Text |
| `src/components/Labs/Kuechenplaner/ResultPanel.js` | `/api/beratung_anfrage` | wie Beratung, Konfiguration als Text, max. 7,2 KB gemessen | ok. In dev nur mit `?senden=1` |
| `src/components/Labs/Sofaplaner/ResultPanel.js` | (keiner) | bereitet Beratungs-Payload vor, sendet nicht (Labs) | nicht betroffen, Payload passt zum Schema |
| `src/components/AnfrageFormProduct/AnfrageFormProduct.js` | `/api/upload/inquiry/produkt` → `/api/anfrage_produkt` | `anfrage_*` + `produkte: [id…]`, bei „Geschäft“ zusätzlich `anfrage_company`, `anfrage_fiscal_number` | ok. IDs als Zahl, Text oder `null` erlaubt |
| `src/components/Newsletter/newsletter.js` | `/api/newsletter_subscribe` | `{ email, website }` | ok. Alte Codes bleiben, neue Codes landen in `errGeneric` |
| `src/app/api/upload/inquiry/[kind]/route.js` | ruft die drei POST-Handler direkt auf | Body unverändert | ok. Importe `POST` funktionieren weiter, Ablehnungen werden durchgereicht (live geprüft: 400, 429). **Kontakt, Beratung und Produkt laufen heute über diesen Wrapper.** Er gibt `X-Forwarded-For` nicht weiter. Die Routen lesen die IP deshalb aus der ursprünglichen Anfrage (Fix P1-1) |
| `src/components/Upload/UploadHandoff.js` | reagiert auf die Antwort | liest `result.data.message.name` | ok. Erfolgsformat unverändert. Beim Fake-Erfolg ist `data` leer, also kein Lead-Ref |
| Concierge, Portal, Kuechenplaner `plan`-Route | (keine) | rufen keine der vier Routen auf | nicht betroffen |

## Prüfungen

- **Unit-Tests:** `node --test tests/unit/forms.test.mjs`, 16/16 grün, `fetch` gemockt. Abgedeckt: Allowlist (unbekannte Felder, `website` und `_t` entfernt), gleiche URL, Header und Antwort, Timeout-Signal, Fake-Erfolg ohne Weiterleitung, 413 auch ohne `Content-Length`, Rate-Limit (6. Anfrage → 429, andere IP frei, Fenster läuft ab), letzter XFF-Eintrag, Eimer ohne IP, 502/504 ohne Frappe-Details, alte Newsletter-Codes.
- **Live (dev, nur Ablehnungspfade, Test-IPs 203.0.113.77–79 per `X-Forwarded-For`), keine gültige Anfrage gesendet.** Für alle vier Routen gab es 413, 400 (Schema), 400 (JSON), Honeypot → 200 Fake-Erfolg, Zeitfalle → 200 Fake-Erfolg und nach 5 Anfragen 429 mit `Retry-After`. Nachweis in `.next/dev/logs/next-development.log`, z. B. `[forms] kontakt: honeypot -> fake success, not forwarded`, ohne Backoffice-Aufruf der Formular-Routen. Hinweis: Beim ersten Durchlauf ging die Zeitfalle bei Beratung und Produkt nicht los, weil der dev-Server über 3 s kompilierte. Danach ausgelöst.
- **ESLint:** `npx eslint` auf allen eigenen Dateien ohne Befund.
- **Screenshots:** `qa-screenshots/teamleiter/r1-R1-formulare/selbst/` (`/de/kontakt`, `/de/beratung` auf 4 Geräten). Alle mit Status 200 und ohne horizontalen Überlauf. Ein React-Hinweis „state update on a component that hasn't mounted“ auf Android/Kontakt kommt aus dem Frontend und nicht aus dieser Änderung.

## Offene Punkte

1. **Upload-Wrapper** (`/api/upload/inquiry/[kind]`, gehört dem Upload-Team): Kontakt, Beratung und Produkt laufen darüber. Der Wrapper baut einen neuen Request **ohne** `X-Forwarded-For`. Das war **P1** (globaler Eimer, mit dem man alle Leads hätte sperren können) und ist auf Seite der Formular-Routen behoben (`next/headers`). Als zusätzliche Absicherung (INT-Anfrage an das Upload-Team, nicht mehr blockierend): `x-forwarded-for`, `x-real-ip`, `referer` und `accept-language` beim Weiterreichen mitgeben.
6. **Backoffice Kontakt `500 {}`** (P2-1): an das Backoffice-Team. Im Frappe Error Log prüfen, einen etwaigen Eintrag „QA Test“ / `qa@example.invalid` löschen und klären, ob `create_contact` mit gültigen Daten funktioniert. Keine Testanfrage an Produktion ohne Absprache.
7. **Adventsabend `_t`** (R1-event): auf die Dauer seit dem Rendern umstellen (siehe Formular-Vertrag).
8. Aus dem QA-Feedback, P3: In der Datenschutzerklärung (Entwurf 3.4) ergänzen, dass die IP bis zu 10 min im Arbeitsspeicher zur Missbrauchsabwehr gehalten wird (Art. 6 Abs 1 lit f, keine Speicherung auf Datenträger). nginx `proxy_add_x_forwarded_for` auf dem Server prüfen, denn hinter einem CDN teilen sich alle die CDN-IP. Kommentar zu `instances: 1` in `ecosystem.config.js` ergänzen. Diese Datei gehört nicht zu diesem Paket.
2. **UploadHandoff** sendet `{ kind, email, leadRef }` an `/api/upload/session`, die Route erwartet aber `ticket`. Der QR-Upload nach dem Formular schlägt deshalb vermutlich fehl. Das liegt außerhalb dieses Pakets, Meldung an das Upload-Team.
3. **Frontends (Runde 2):** `website` und `_t` senden, bei Fehlern `code` übersetzen statt `error` anzuzeigen. Beratung und Küchenplaner zeigen heute den englischen `error`-Text an.
4. Masterplan AP3 nennt „URL aus `NEW_API_BASE_URL`“. Laut Auftrag bleiben die festen Backoffice-URLs der drei Anfrage-Routen vorerst gleich. Umstellung später mit Testanfrage gegen den Dev-Endpunkt.
5. Bei mehr als einer Instanz muss das Rate-Limit auf einen geteilten Speicher umziehen (siehe oben).
