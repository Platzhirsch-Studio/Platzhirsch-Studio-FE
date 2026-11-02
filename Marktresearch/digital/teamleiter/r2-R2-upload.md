# R2-upload: Upload-Strecke produktionsreif

Stand 26.10.2026 · Paket R2-upload (Runde 2) · keine Commits, keine Installationen, keine echten Anfragen an das Backoffice, nichts in S3

## Ergebnis

| Auftrag | Status | Nachweis |
|---|---|---|
| (1) Ticket-Fehler `{ kind, email, leadRef }` | **Lag nicht vor.** `UploadHandoff` sendet schon `{ ticket }`, der Hinweis aus R1-formulare Nr. 2 war veraltet. Den Ablauf habe ich von Anfang bis Ende reproduziert: Kontaktformular → abgefangener Proxy mit Ticket → Session-Route → Link → `/de/upload/<token>` → Upload → Dank. Zur Absicherung (nur additiv): `handoffFrom` nimmt das Ticket auch aus `result.ticket` oder `ticket` an und prüft das Format. Die Session-Route meldet ein fehlendes Ticket mit 400 `ticket_required` | `r2/flow.mjs` (iPhone 15 Pro WebKit, Desktop: `sessionRequestKeys: ["ticket"]`, Dank sichtbar), e2e „Formular → Handoff …“ |
| **Neu gefunden (P1-artig):** Fake-Erfolge (Honeypot/Zeitfalle) bekamen ein Upload-Ticket, Bots also einen Upload-Link | behoben: `src/lib/upload/inquiry.js#isTrapped` | Unit „honeypot and time trap … NO ticket“, e2e „Fake-Erfolg ohne Ticket“ |
| (2) Auflage A-1 | behoben: `display` je Knopf (`flex sm:hidden` / `hidden sm:inline-flex`) | e2e 320/375/393 px und Desktop. WebKit 320 und iPhone 15 Pro zeigen je einen Knopf (`nachher-*/…-demo-card.png`, `iphone-handoff.png`) |
| (3) Kontrast gesperrt | Kachel ohne `opacity`. Beschriftung ink/80 (6,1:1), Unterzeile ink/75 (5,3:1) auf Bone. ink/60 hätte nur 3,5:1 und wäre damit kein AA | e2e berechnet den Kontrast ≥ 4,5:1, `iphone-demo-locked.png` |
| (3) Demo-Scroll | Rahmen mit fester Höhe | `r2/demo-scroll.mjs`: Fenster-Delta 0 px auf iPhone, iPhone SE und Desktop |
| (4) Fehlerfälle | Alle Codes deutsch (`messages.js`). Link läuft während des Uploads ab → Stopp, Hinweis mit Telefon und E-Mail. Offline beim Senden und 429 haben eigene Texte. Die Handoff-Karte nennt den Grund, wiederholt automatisch dreimal und bietet „Erneut versuchen“ | Unit (Codes, ungültig/abgelaufen, zu groß, Typ, Chunk), e2e (Typ, zu groß, offline, Ablauf, 429) |
| (5) X-Forwarded-For im Wrapper | Wird jetzt weitergegeben, zusammen mit X-Real-IP, Referer, Accept-Language, UA und Origin, ohne Cookies | Unit „visitor headers are passed on“ |
| (6) Tests | `tests/unit/upload.test.mjs` 16/16, `tests/e2e/upload.spec.js` 10/10 (desktop) | |

Zusätzlich gibt es ein Rate-Limit pro Link (429 `rate_limited`, `Retry-After`).

Prüfung: ESLint auf allen eigenen Dateien ohne Befund. `shoot.mjs` (`qa-screenshots/teamleiter/r2-R2-upload/selbst`): Demo und Kontakt liefern auf allen 4 Geräten 200, ohne Konsolenfehler und ohne Überlauf. Die Unit-Suite per Glob hat 312 Tests, davon 0 rot.

## Dateien

Neu: `src/lib/upload/inquiry.js`, `src/lib/upload/messages.js`, `tests/unit/upload.test.mjs`, `tests/e2e/upload.spec.js`, `qa-screenshots/handy-upload/r2/{flow,demo-scroll}.mjs`.
Geändert: `src/components/Upload/{UploadHandoff,UploadClient}.js`, `src/app/api/upload/inquiry/[kind]/route.js`, `src/app/api/upload/session/route.js`, `src/app/api/upload/[token]/{route,files/route,files/[fileId]/route}.js`, `src/lib/upload/http.js`, `src/app/[locale]/labs/upload-demo/page.js`, `Marktresearch/digital/features/handy-upload.md`.

## Offene Punkte

1. Der Lauf auf iPhone SE (WebKit) über `/de/kontakt` ist im Dev-Server an Timeouts gescheitert (Backoffice-Lesezugriffe, HMR anderer Teams). Gegen `next start` wiederholen (Runde 3).
2. `npm run test:unit` (`node --test tests/unit`) findet unter Node 24 das Verzeichnis nicht → an R2-qualitaetsnetz: Glob `"tests/unit/*.test.mjs"`.
3. Für den Inhaber bleiben offen: Speicherfrist (Platzhalter) und der Abschnitt „Uploads“ in der Datenschutzerklärung.
4. Unverändert offen: Frappe-Übergabe, S3-Adapter, ein geteilter Rate-Limit-Speicher bei mehreren Instanzen und die schlanke `/upload`-Hülle (Website-Team).

## Nachbesserung nach QA (26.10.2026, Note vorher 8/10)

| Befund | Status | Nachweis |
|---|---|---|
| **P1** Kerntest e2e rot, langsamer Server erschien als „Keine Verbindung“ | **behoben.** Neuer Grund `timeout` (`TimeoutError`/`AbortError` des Zeitlimits): während des Wartens „Das dauert gerade länger als üblich – einen Moment bitte…“, am Ende „… dauert gerade länger als üblich. Bitte versuchen Sie es gleich noch einmal“ mit „Erneut versuchen“. Wiederholungen auch nach Zeitüberschreitung, mit wachsendem Zeitlimit (20 s, dann 30 s) und höchstens 4 Anfragen bzw. 75 s. Die Konstanten liegen in `src/lib/upload/messages.js`. Der Kerntest erlaubt jetzt bis zu 4 Anfragen mit demselben Ticket und prüft, dass alle Antworten dieselbe Referenz haben und „Keine Verbindung“ nicht erscheint | e2e **12/12 im ersten Versuch** (desktop, 2 Worker, Dev-Server), davon neu: „Langsamer Server …“ (1. Anfrage hängt 21 s → Hinweis „länger als üblich“ → derselbe Link nach genau 2 Anfragen). Unit 17/17 (neu: Einstufung und Grenzen) |
| P1 (c) Lauf gegen `next start` | **offen, blockiert.** Ein Build in einer Kopie außerhalb des Repos ist gescheitert: Das Portal-Team hat Dateien noch nicht angelegt (`@/components/Portal/Docs/*`), `SERVER`/Backoffice-Zugang gibt es nur in der Umgebung des Dev-Prozesses, und die Seitendaten-Sammlung bricht bei `/[locale]/ueber-uns/marken/[title]` ab. Gemessen im Dev-Server: Session-Route kalt 4,2 s, warm 0,5 s. → Integrator: `npm run test:e2e:prod -- tests/e2e/upload.spec.js --project=desktop` auf :3100 | |
| P2 × überdeckt „DAUERT 1 MINUTE“ bei 320 px | **behoben**: Eyebrow mit `pr-12`, wenn es ein × gibt | `fix/se-320-card.png` (WebKit, iPhone SE, 320 px), e2e misst die Textrechtecke gegen das × |
| P2 Fokus nach dem Absenden auf `<main>` | **behoben** in der Karte: Ist der Fokus nach dem Einblenden verloren (`body`/`main`/entfernter Knopf), geht er auf die Bestätigung davor (`FormSuccess`, `tabIndex=-1`, `role=status`), sonst auf `#upload-handoff-title`. Die Formulare selbst (fremde Dateien) bleiben unverändert | WebKit 320 px: Fokus auf `DIV[role=status] „Vielen Dank für Ihre Anfrage …“`. e2e „Nach dem Absenden: Fokus …“ |
| P2 Demo-Hinweis doppelt | **behoben**: „eigener Test-Link, 1 Stunde gültig“ | `fix/de-labs-upload-demo--iphone.png` |
| P3 Leerraum über dem Eyebrow (Demo) | **behoben**: `pt-12 sm:pt-20 lg:pt-28` statt `pt-28/36/48` | `fix/de-labs-upload-demo--iphone.png` |
| P3 ungültiger Token liefert 200 | offen (noindex, unkritisch) | |

Prüfwerkzeug `shoot.mjs` (`qa-screenshots/teamleiter/r2-R2-upload/fix/`): Demo und Kontakt auf iPhone, Android, iPad und Desktop jeweils 200, keine Konsolenfehler, keine fehlgeschlagenen Requests, kein Überlauf. ESLint ohne Befund.
Geändert: `src/components/Upload/UploadHandoff.js`, `src/lib/upload/messages.js`, `src/app/[locale]/labs/upload-demo/page.js`, `tests/unit/upload.test.mjs`, `tests/e2e/upload.spec.js`, `Marktresearch/digital/features/handy-upload.md`. Neu: `qa-screenshots/handy-upload/r2/card320.mjs`.
