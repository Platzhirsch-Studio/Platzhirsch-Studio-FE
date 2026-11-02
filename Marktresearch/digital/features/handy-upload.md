# Feature: Handy-Upload per QR

Stand: 27.10.2026 (Labs-Ausbau Handy-Upload Premium, siehe letzter Abschnitt; davor Runde 2–5) · Team „Handy-Upload per QR“ · Demo: `/de/labs/upload-demo`

## Was gebaut ist
Nach einer erfolgreichen **Produktanfrage**, **Beratungsanfrage** oder **Kontaktanfrage** erscheint unter der Bestätigung eine Karte „Zeigen Sie uns Ihren Raum“ mit:
- einem **QR-Code** (serverseitig mit `qrcode` als SVG erzeugt), der auf `/de/upload/<token>` zeigt,
- dem Knopf **„Upload-Seite öffnen“** (Desktop, neuer Tab) bzw. **„Jetzt Fotos & Pläne senden“** (Handy, gleicher Tab), dazu „Link kopieren“ und „An mich mailen“ als Textlinks (mailto, kein Server-Versand),
- der Referenz und dem Ablaufdatum (14 Tage).

Die mobile Upload-Seite `/de/upload/<token>` läuft in einem **ruhigen Vollbild-Rahmen** (`FocusShell`: nur Logo, Aufgabe, Mini-Footer Impressum · Datenschutz · Telefon; kein Menü, keine Sticky-CTA-Leiste, kein Cookie-Banner über dem Senden-Knopf). Sie bietet:
- zweistufige Einwilligung: ein Satz an einer großen Tap-Fläche (≥ 56 px, 24-px-Kästchen) plus aufklappbare Details (Speicherdauer, Widerruf, Datenschutz-Link); Pflicht vor jedem Upload,
- **Foto aufnehmen** (`<input accept="image/*" capture="environment">`), **Raum-Video** (`capture`, max. 2 Min. / 300 MB), **Aus Galerie** (mehrere), **Grundriss/Plan** (PDF oder Bild),
- lokale Vorschau (Object-URLs; der Server liefert nie Dateien zurück), Fortschrittsbalken pro Datei (XHR-Upload-Progress), Entfernen, Erneut versuchen,
- **Chunk-Upload** (4 MB) mit automatischen Wiederholungen (Backoff 1/2,5/6/12 s), Pause bei Offline und Fortsetzen bei Online, **Wiederaufnahme nach Reload** (dieselbe Datei erneut wählen → Server erkennt Name+Größe+lastModified und liefert die vorhandenen Chunks),
- Bildschirm-Wachhalten (Wake Lock, falls verfügbar) und Warnung beim Verlassen während des Uploads,
- **Sticky-Gesamtfortschritt** unten („2 von 4 hochgeladen · 63 %“, Goldbalken, Kurz-Knopf „Senden“), Screenreader-Ansage alle 25 %,
- endgültig abgelehnte Dateien (falscher Typ, zu groß, Limit) als „Abgelehnt“ mit `FileX`-Symbol und ohne „Erneut versuchen“; der Typ wird schon im Browser gegen `accept` geprüft,
- Notizfeld und **„An Platzhirsch senden“** (bei Netzfehlern 2 automatische Wiederholungen nach 1 s / 3 s; danach „Ihre Dateien sind gespeichert – nur die Bestätigung fehlt“) → Dankes-Block wird in den Blick gescrollt und seine Überschrift fokussiert; mit Miniaturen und Referenz in Display-Schrift (danach weitere Dateien möglich, solange der Link gilt),
- ab `lg` daneben ein ruhiger Block „Am Computer?“ mit dem QR-Code dieses Links,
- ungültiger Link → „Link unvollständig“, abgelaufener → „Link abgelaufen“, jeweils mit Knöpfen Anrufen / E-Mail.

## Dateien
| Bereich | Pfad |
|---|---|
| Konfiguration (Client+Server) | `src/lib/upload/config.js` |
| Token (HMAC) | `src/lib/upload/token.js` |
| Magic-Bytes-Prüfung | `src/lib/upload/magic.js` |
| GPS-Entfernung JPEG | `src/lib/upload/exif.js` |
| Geschäftslogik | `src/lib/upload/service.js` |
| Speicher-Adapter | `src/lib/upload/store.js`, `src/lib/upload/localStore.js` |
| Frappe-Plan (inaktiv) | `src/lib/upload/frappeAdapter.js` |
| QR/Link | `src/lib/upload/handoff.js` (URL, Ablauf), `src/lib/upload/qrSvg.js` (Haus-QR mit Monogramm) |
| HTTP-Helfer, Rate-Limit (Link-Erzeugung und pro Link) | `src/lib/upload/http.js` |
| Formular-Proxy (Logik, testbar ohne Next) | `src/lib/upload/inquiry.js` |
| Deutsche Fehlertexte aller API-Codes | `src/lib/upload/messages.js` |
| API | `src/app/api/upload/inquiry/[kind]/route.js` (Formular-Proxy + Ticket), `src/app/api/upload/session/route.js`, `src/app/api/upload/[token]/route.js`, `.../files/route.js`, `.../files/[fileId]/route.js` |
| Seiten | `src/app/[locale]/upload/[token]/page.js`, `src/app/[locale]/labs/upload-demo/page.js` |
| Komponenten | `src/components/Upload/UploadHandoff.js`, `UploadClient.js`, `ConsentText.js`, `FocusShell.js` |
| Formulare (senden über `/api/upload/inquiry/<kind>`, Erfolgszustand mit Karte) | `AnfrageFormProduct.js`, `BeratungClient.js`, `Kontakt/kontakt.js` |
| QA-Prüfskripte | `qa-screenshots/handy-upload/check-fix.mjs`, `qa-screenshots/handy-upload/r2/flow.mjs` (Formular → Handoff → Upload, Backoffice abgefangen), `r2/demo-scroll.mjs` |
| Tests | `tests/unit/upload.test.mjs` (16), `tests/unit/upload-qr.test.mjs` (6), `tests/e2e/upload.spec.js` (10), `tests/e2e/upload-premium.spec.js`, `tests/e2e/upload-premium-iphone.spec.js` (alle Projekt `desktop`) |

## Architektur
```
Formular ──POST /api/upload/inquiry/<kind>──► ruft POST von /api/anfrage_produkt | /api/beratung_anfrage | /api/kontakt auf
          (gleicher Body; X-Forwarded-For, X-Real-IP, Referer, Accept-Language, User-Agent werden mitgegeben)
          ◄── deren Antwort + upload.ticket (nur bei echtem success; nicht bei Honeypot/Zeitfalle; HMAC, 30 min)
Erfolgskarte ──POST /api/upload/session {ticket}──► mintSession (id aus Ticket abgeleitet) → Token + QR-SVG
Handy: /de/upload/<token> (Server Component prüft Token, lädt Status)
  └─ UploadClient
       POST /api/upload/<token>/files        {name,size,type,lastModified,category,consentVersion} → fileId, received[]
       PUT  /api/upload/<token>/files/<id>?index=n   (Rohbytes, ≤ 4 MB)  → Status; letzter Chunk → finalize
       DELETE /api/upload/<token>/files/<id>
       GET  /api/upload/<token>               Status
       POST /api/upload/<token> {note, submit, consentVersion}
```
- Server Components für beide Seiten; nur `UploadClient`/`UploadHandoff` sind Client-Komponenten. `qrcode` läuft nur auf dem Server.
- 4-MB-Chunks liegen unter dem 10-MB-Body-Puffer des Next-Proxys und üblichen nginx-Limits.
- Chunk 0 wird sofort per Magic Bytes geprüft → falscher Typ wird abgelehnt, bevor 300 MB übertragen sind. Nach dem letzten Chunk erneute Prüfung, dann GPS-Entfernung (JPEG) und Umbenennen `.part → .<ext>`.
- Genau ein Request darf finalisieren (Status `finalizing` unter Lock) – parallele Wiederholungen sind unkritisch.

### Token
`base64url("1|<Kind-Code>|<Ref>|<Ablauf base36>|<id>") + 22 Zeichen HMAC-SHA256` (128 Bit), Secret `UPLOAD_TOKEN_SECRET` (≥ 32 Zeichen). Ohne Secret: in Entwicklung Fallback mit Konsolenwarnung, **in Produktion Fehler** (Uploads deaktiviert). `id` = 128 Bit Zufall, benennt den Speicherordner. Vergleich mit `timingSafeEqual`. Kein `.` im Token (der Proxy-Matcher überspringt Pfade mit Punkt). Demo: **pro Seitenaufruf ein neuer Token** (Zufalls-id, 1 Stunde gültig); gespeichert wird erst beim ersten Upload, ein Neuladen startet eine neue Demo. Die Einwilligung wird bei Demos nie vorbelegt.

### Anfrage-Ticket und Missbrauchsschutz (QA P1-3)
- `base64url(JSON {v,k,n,e,l?,m?}) . HMAC-Tag` mit eigener HMAC-Domäne (`ticket:`), 30 min gültig. Es wird nur ausgestellt, wenn die bestehende Formular-Route `success` meldet, also das Backoffice die Anfrage angenommen hat. `l` = Frappe-Dokumentname (falls geliefert), `m` = E-Mail aus dem Formular.
- Die Sitzungs-id wird aus der Ticket-Nonce abgeleitet: Dasselbe Ticket liefert immer denselben Link, ein Replay legt nichts Neues an.
- Kein Ticket für Fake-Erfolge (R2): Honeypot (`website` gefüllt) und Zeitfalle (`_t` < 3 s) beantwortet die Formular-Route mit einem Schein-Erfolg ohne Backoffice. `inquiry.js#isTrapped` spiegelt diese Regel, damit ein Bot dafür keinen Upload-Link bekommt. Bisher bekam er einen.
- `/api/upload/session` verlangt Ticket + same-origin. Ohne Feld `ticket` (alte Aufrufer mit `{ kind, email, leadRef }`) kommt 400 `ticket_required`. Ein ungültiges Format gibt 400 `bad_request`, Fälschung 403 `bad_ticket`, Ablauf 403 `ticket_expired`. Zusätzliche Felder werden ignoriert. Rate-Limit pro IP nur über einen vertrauenswürdigen Proxy-Header (`UPLOAD_TRUSTED_IP_HEADER`, z. B. `x-real-ip`), sonst ein gemeinsamer Topf (120/Std.). Bei vollem Zähler-Speicher wird die ältere Hälfte verworfen statt alle zurückzusetzen.
- Globale Grenzen: max. 300 neue Links in 24 h (429 `daily_limit`), max. 20 GB Gesamtspeicher (507 `storage_full`, auch pro Datei geprüft).
- Start-Kontingent pro Link 350 MB, nach der ersten vollständigen Datei 1,5 GB.
- Demo-Uploads in Produktion gesperrt (403 `demo_disabled`, Hinweis auf der Seite), außer mit `UPLOAD_DEMO_ENABLED=1`; Demo-Grenzen 5 Dateien / 40 MB, der Ordner wird mit Ablauf (1 h) gelöscht.

### Grenzen (config.js)
Pro Link (R2, gegen Fluten mit einem gültigen Link, 10 min): 200 Datei-Anmeldungen, 1500 Chunks, 60 Notiz/Senden, 200 Löschungen → 429 `rate_limited` mit `Retry-After: 120`.
Fotos 30 MB · Videos 300 MB und 120 s (Dauer nur im Browser prüfbar) · Pläne 50 MB · max. 40 Dateien, 350 MB Start- bzw. 1,5 GB Gesamtkontingent pro Link · Notiz 2000 Zeichen · Link 14 Tage · Link-Erzeugung nur mit Ticket, same-origin, 120/Std. gesamt (10/Std. pro IP hinter vertrauenswürdigem Proxy), 300/Tag, Speicher 20 GB.
Erlaubte Typen (Magic Bytes): JPEG, PNG, WebP, HEIC/HEIF, AVIF, MP4/M4V, MOV, 3GP, WebM, PDF.

## Datenmodell (`.data/uploads/<id>/session.json`, gitignored, außerhalb `public/`)
```json
{ "id", "ref": "PH-K261026-A28032", "kind": "kontakt", "kindLabel", "demo": false,
  "createdAt", "updatedAt", "expiresAt", "deleteAfter",
  "hint": { "leadRef": null, "email": "…" },          // aus dem signierten Ticket (serverseitig aus dem Formular)
  "consent": { "version": "2026-10-v2", "at": "…" },
  "note": "", "submittedAt": null,
  "files": [{ "fileId", "name", "size", "category": "photo|video|plan", "declaredType",
              "fingerprint", "chunkSize", "totalChunks", "received": [0,1],
              "status": "uploading|finalizing|complete", "mime", "ext",
              "gpsRemoved": true|false|null, "createdAt", "completedAt" }] }
```
Dateien: `.data/uploads/<id>/files/<fileId>.<ext>`. Abgelaufene Ordner (`deleteAfter`; bei Demos = Ablauf des Links) werden bei jeder neuen Link-Erzeugung gelöscht (`purgeExpired`). `localStore.stats()` zählt Sitzungen der letzten 24 h und Bytes (30 s Cache) für die globalen Grenzen.

## EXIF/GPS
`exif.js` nullt im JPEG den GPS-IFD des Exif-Blocks samt ausgelagerter Werte und leert ein XMP-Paket, das GPS enthält – **in place, ohne Zusatzpaket**, Orientierung und übrige Tags bleiben. Getestet mit synthetischem GPS-Block (Werte nach Upload nicht mehr vorhanden).
**Nicht** bereinigt: HEIC/HEIF, PNG (eXIf), WebP, Videos (MP4/MOV können `©xyz`-Ortsangaben enthalten). Die Seite weist darauf hin. Für später: serverseitig `sharp` (HEIC→JPEG ohne Metadaten) bzw. `ffmpeg -map_metadata -1` in einem Worker – erfordert Paketfreigabe.

## Anbindung Frappe (später, `frappeAdapter.js`)
1. Die Anfrage-Endpunkte (`anfrage_produkt.api.create_anfrage`, `anfrage.api.create_anfrage`, `kontakt_form.api.create_contact`) sollen den Dokument-`name` zurückgeben; der Proxy `/api/upload/inquiry/<kind>` schreibt ihn dann schon heute ins Ticket (`leadRef`). Später soll er auch als `ref` des Links dienen.
2. API-User mit Key/Secret (`FRAPPE_API_KEY`, `FRAPPE_API_SECRET`), Rechte für `File` und die Anfrage-Doctypes.
3. Nach „Senden“ bzw. pro fertiger Datei: `POST /api/method/upload_file` (multipart: `file`, `file_name`, `is_private=1`, `doctype=<Anfrage-Doctype>`, `docname=<ref>`, `folder=Home/Attachments`), Header `Authorization: token key:secret`.
4. Notiz/Status: `PUT /api/resource/<Doctype>/<name>` mit Custom Fields `upload_note`, `upload_status` (offen/eingegangen); Benachrichtigung per Frappe-Notification an das Team.
5. Große Videos: in S3 ablegen und nur als `File` mit `file_url` (signierter, kurzlebiger Link oder interner Proxy) anhängen; Frappe-`max_file_size` beachten.

## Anbindung S3-kompatibler Speicher (später)
Neuer Adapter mit derselben Schnittstelle wie `localStore` (`ensureSession`, `updateSession`, `createPart`, `writeChunk`, `readHead`, `finalize`, `removeFile`, `purgeExpired`), Auswahl über `UPLOAD_STORAGE=s3`:
- Chunks → **S3 Multipart Upload** (`CreateMultipartUpload` bei `initFile`, `UploadPart` je Chunk – Mindestteilgröße 5 MB, daher Chunkgröße dann auf 5–8 MB anheben, `CompleteMultipartUpload` beim Finalisieren), Metadaten als `session.json`-Objekt oder in Frappe.
- Alternativ direkte Browser-Uploads mit presigned URLs pro Part (entlastet den Next-Server).
- Bucket in der EU (z. B. Exoscale AT, Hetzner DE), privat, SSE-Verschlüsselung, Lifecycle-Regel = Löschfrist, Magic-Bytes-Prüfung und GPS-Bereinigung serverseitig vor Freigabe.
- Lokaler Speicher ist nur für Entwicklung/Einzelserver gedacht (Warnung in Produktion, kein Backup); Rate-Limit ebenfalls nur pro Instanz.

## Rechtliches (zur Prüfung durch Inhaber/Datenschutzberatung)
- Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) per Checkbox vor dem ersten Upload, Version `2026-10-v2` + Zeitpunkt werden gespeichert; Kurzsatz + aufklappbarer Volltext in `ConsentText.js`; Widerruf per E-Mail. In Demos wird keine Einwilligung übernommen (jede Demo ist eine eigene Sitzung). Hinweis, keine erkennbaren Personen ohne Einverständnis aufzunehmen.
- **Löschfrist**: Platzhalter 180 Tage nach Ablauf des Links, außer für einen Auftrag benötigt – **[Frist vom Inhaber festzulegen]**; solange `retentionConfirmed: false` (config.js) gilt, steht dieser Vermerk auch sichtbar im Einwilligungs-Detailtext; die Datenschutzerklärung (`/de/datenschutz`) muss einen Abschnitt „Upload von Fotos/Videos/Plänen“ erhalten (Zweck, Speicherort/Auftragsverarbeiter, Frist).
- Upload ist freiwillig; Anfrage gilt auch ohne.
- Seiten `noindex, nofollow`, `Referrer-Policy: no-referrer` (Token im Pfad), API-Antworten `no-store`. Dateien nie in `public/`, nie zurückgeliefert.
- Keine KI-Verarbeitung der Uploads in diesem Feature (keine AI-Act-Kennzeichnung nötig). Falls später KI (z. B. Raumvermessung) dazukommt: gesonderte Einwilligung + Kennzeichnung.
- Hint-E-Mail im `session.json` ist personenbezogen → gleiche Löschfrist.

## Verhalten der Formulare
- Alle drei senden an `/api/upload/inquiry/<kind>`. Dieser Proxy ruft die bestehende Route **unverändert** auf und reicht deren Antwort durch (nur bei Erfolg ergänzt um `upload.ticket`). Fällt die Upload-Seite aus, bleibt die Anfrage unberührt; ohne Ticket zeigt die Karte nur den E-Mail-Hinweis.
- `trackLead`-Aufrufe und alle bisherigen Meldungen/Resets unverändert.
- **Kontakt** und **Beratung**: Karte erscheint zusätzlich und bleibt bis „Schließen“ (Formular-Reset nach 5 s wie bisher).
- **Produktanfrage**: Die automatische Weiterleitung nach 1,5 s zu `/produkte` entfällt zugunsten des Buttons „Weiter zu den Produkten“ auf der Karte (sonst wäre der QR-Code nicht lesbar); das Formular wird nach Erfolg ausgeblendet.
- Upload-Seite und Texte nur Deutsch (`/de/upload/…`); Link wird auch aus EN/FR/IT-Formularen auf `/de` gesetzt.

## Testen
1. `/de/labs/upload-demo` öffnen (Karte + eingebettete Upload-Seite mit Test-Token).
2. Echtes Handy: Dev-Server mit `UPLOAD_PUBLIC_BASE_URL=http://<LAN-IP>:3000` starten, QR scannen.
3. Formulare auf `/de/kontakt`, `/de/beratung`, `/de/merkliste` absenden → Karte erscheint.
4. API ohne UI: Ticket mit dem Entwicklungs-Secret erzeugen (siehe `qa-screenshots/handy-upload/check-fix.mjs`), dann `POST /api/upload/session {ticket}` (Header `Origin` = Host) → Link; Chunks per `PUT`. Ohne Ticket: 400, gefälschtes Ticket: 403 `bad_ticket`, abgelaufenes: 403 `ticket_expired`.
5. `node qa-screenshots/handy-upload/check-fix.mjs [iphone|iphone-se|desktop]` prüft Demo-Isolation, Scroll/Fokus nach Senden, Kacheln im ersten Bildschirm, Sticky-Leiste, Ablehnung ohne Retry und Tap-Größen.
6. R2: `node --test tests/unit/upload.test.mjs` (ohne Netz, Speicher im Temp-Ordner), `npx playwright test upload.spec.js --project=desktop` (Backoffice per `page.route` abgefangen, Uploads nur in den lokalen Dev-Speicher), `node qa-screenshots/handy-upload/r2/flow.mjs <ordner> [iphone|iphone-se|webkit-320|desktop|all]`, `node qa-screenshots/handy-upload/r2/demo-scroll.mjs`.
Geprüft: Abbruch nach Chunk 0 und Fortsetzen (9-MB-Video), Ablehnung falscher Typen (415), GPS-Entfernung, Playwright 375 px ohne horizontales Scrollen, Upload+Senden-Flow ohne Konsolenfehler, Lint sauber.

## Runde 2 (Paket R2-upload) – umgesetzt
- **Ticket-Fehler (vermuteter P1) geprüft: lag nicht vor.** `UploadHandoff` sendet seit dem QA-Fix aus Runde 1 `{ ticket }`, Kommentar und Bericht R1-formulare Nr. 2 waren veraltet. Nachgewiesen von Anfang bis Ende (`r2/flow.mjs`, `upload.spec.js`): Kontaktformular → abgefangener Proxy mit Ticket → `POST /api/upload/session` (Body nur `ticket`) → Link → `/de/upload/<token>` → Upload → Dank. Absicherung hinter der stabilen Schnittstelle: `handoffFrom(kind, { email, result, ticket })` nimmt das Ticket additiv auch aus `result.ticket` oder `ticket` an und prüft das Format. Die Session-Route nennt fehlende Tickets mit `ticket_required`.
- **Gefundener Fehler:** Fake-Erfolge (Honeypot/Zeitfalle) bekamen ein Ticket → behoben (siehe Missbrauchsschutz).
- **A-1:** `linkBase` setzt kein `display` mehr. Handy-Knopf `flex sm:hidden`, Desktop-Knopf `hidden sm:inline-flex`, Textlinks `inline-flex`. Geprüft: genau ein sichtbarer Hauptknopf bei 320/375/393 px (Chromium-e2e, WebKit 320 und iPhone 15 Pro) und Desktop (nur „Upload-Seite öffnen“, neuer Tab). Neues Attribut `data-upload-link="phone|desktop"` für Tests.
- **Kontrast gesperrter Zustand (A-5):** keine Deckkraft mehr auf der ganzen Kachel. Gesperrt: Bone-Fläche, gestrichelter Rand, Beschriftung `ink/80` (6,1:1), Unterzeile `ink/75` (5,3:1), Symbol `ink/45` (nur Deko). `ink/60` hätte auf Bone nur 3,5:1 und reicht damit nicht für AA. Notizfeld und Senden-Knopf ebenfalls ohne `opacity` (Senden gesperrt: `ink/80` auf Stone, 5,7:1). Die e2e-Prüfung rechnet den Kontrast aus den berechneten Farben nach (≥ 4,5:1, Deckkraft 1).
- **Demo-Scroll (A-2):** Der Rahmen hat eine feste Höhe `h-[min(760px,85svh)]` statt `max-h`. Wenn der Dankes-Block das Formular ersetzt, bleibt die Höhe gleich. Fensterbewegung beim Senden (DOM-Klick, `r2/demo-scroll.mjs`): 0 px auf iPhone 15 Pro, iPhone SE und Desktop, Dank sichtbar im Rahmen. Die 29/61 px aus der Abnahme kamen teils vom automatischen Scrollen von Playwright vor dem Klick.
- **Fehlerfälle mit deutscher Meldung:** Alle API-Codes stehen in `messages.js`, ein Unit-Test prüft, dass kein Code auf den Ersatztext fällt. Abgelaufener oder ungültiger Link beim Aufruf → Seite „Link abgelaufen“ / „Link unvollständig“ mit Anrufen/E-Mail. **Läuft der Link während des Uploads ab** (410/404), stoppt die Warteschlange, es erscheint eine Meldung (`role="alert"`) mit Telefon und E-Mail, die Kacheln werden gesperrt und die Dateien stehen auf „Gestoppt“ statt endlos „Erneut versuchen“. Zu groß und falscher Typ → „Abgelehnt: …“. Offline → Hinweis, Pause und automatische Fortsetzung. Beim Senden offline → „Keine Verbindung – bitte erneut auf ‚Senden‘ tippen …“. Rate-Limit (429) → „Zu viele Versuche in kurzer Zeit …“. Abbruch (Entfernen während des Uploads oder Seite verlassen) → XHR abgebrochen, Wiederaufnahme durch erneutes Auswählen.
- **Handoff-Karte bei Fehlern:** Gründe werden unterschieden (Rate-Limit, Tageslimit, Speicher voll, Ticket abgelaufen, keine Verbindung, **Zeitüberschreitung**, Serverfehler), immer mit dem E-Mail-Weg. Bei Netz-, Server-, Zeit- oder Rate-Limit-Fehlern gibt es „Erneut versuchen“. Automatisch höchstens 4 Anfragen (sofort, dann nach 0,8/2/4 s; Zeitlimit 20 s, danach 30 s; insgesamt höchstens 75 s), unter anderem wegen des WebKit-Fehlers „rewinding of the data stream failed“. Antwortet der Server nicht rechtzeitig, steht dort „Das dauert gerade länger als üblich – einen Moment bitte…“ und zuletzt „… dauert gerade länger als üblich. Bitte versuchen Sie es gleich noch einmal“, nicht „Keine Verbindung“ (R2-Fix). Texte, Versuche und Einstufung in `src/lib/upload/messages.js` (`HANDOFF_*`, `linkFailureReason`). Gleiches Ticket = gleicher Link, auch beim Wiederholen. Ohne Ticket wird nichts angefragt.
- **Fokus nach dem Absenden:** Geht der Fokus der Formulare verloren (`body`/`<main>`), setzt die Karte ihn auf die Bestätigung davor (`tabIndex=-1`), sonst auf ihre Überschrift. Das Schließen-× hat einen eigenen Freiraum (`pr-12`), bei 320 px überdeckt es den Eyebrow nicht.
- **IP-Weitergabe (R1-formulare offener Punkt 1):** Der Proxy gibt `x-forwarded-for`, `x-real-ip`, `x-forwarded-proto/host`, `referer`, `accept-language`, `user-agent` und `origin` an die Formular-Route weiter, keine Cookies. Damit greift das Rate-Limit pro IP auch ohne den `next/headers`-Rückgriff, und Sprache und IP stimmen überein (Unit-Test). 413 kommt jetzt schon über `Content-Length`, bevor der Body gelesen wird. Unbekanntes `kind` gibt 404 mit `code: "unknown_form"` (additiv), auch `__proto__`.

## QA-Runde 1 – umgesetzt
- P1-1: eigene Demo-Sitzung pro Aufruf, keine übernommene Einwilligung, Demo-Uploads in Produktion gesperrt.
- P1-2: Scroll und Fokus auf den Dankes-Block (im Demo-Rahmen nur innerhalb des Rahmens).
- P1-3: Ticket-Pflicht, vertrauenswürdige IP, Halbierung statt `clear()`, Tages- und Speicherlimit, Start-Kontingent.
- P2-1/P2-2: Vollbild-Rahmen ohne Website-Hülle. P2-3: Kurz-Einwilligung + Details, Kacheln im ersten Bildschirm. P2-4: Sticky-Fortschritt. P2-5: „Abgelehnt“ ohne Retry. P2-6: Auto-Retry beim Senden. P2-7: Handy-Knopftext, Chips als Aufzählung. P2-8: Karte in Display-Schrift, QR 200 px mit Goldring und Bildunterschrift, Knopf in normaler Schreibung, Goldakzent, Demo-Erfolgsbalken im Bone-Stil. P2-9: Fließtext ≥ 400, Hinweise ≥ `text-ink/80`. P2-10: Rahmen unter `sm` ohne Rand.
- P3-1 44-px-Knöpfe, P3-2 „Link unvollständig“ + Anrufen/E-Mail, P3-3 Datumsformat mit `timeZone: Europe/Vienna`, P3-4 „Demo-Link: 1 Stunde“, P3-5 Desktop-QR-Block, P3-6 Ansagen alle 25 %, P3-7 Miniaturen + Referenz, P3-8 `aria-live` beim Kopieren.

## Offene Punkte
- **R2:** Der Lauf auf iPhone SE (WebKit, 375 px) ist im Dev-Server nicht stabil durchgelaufen. Ursache waren Timeouts der Seite `/de/kontakt` (Backoffice-Lesezugriffe, HMR anderer Teams), kein Feature-Fehler. Die Demo-Teile auf dem iPhone SE haben bestanden. Gegen `next start` wiederholen.
- **R2:** `npm run test:unit` (`node --test tests/unit`) findet unter Node 24 das Verzeichnis nicht. Mit Glob `node --test "tests/unit/*.test.mjs"` laufen 312 Tests, davon 0 rot (an R2-qualitaetsnetz).
- **R2:** Rate-Limits gelten pro Link und pro Instanz, jeweils im Speicher. Bei mehreren Instanzen ist ein geteilter Speicher nötig.
- **Website-Team:** `client-layout.js` sollte für `/[locale]/upload/*` eine schlanke Hülle anbieten. Bis dahin überdeckt `FocusShell` die Website-Hülle (fixed, z-1000) und setzt Navbar, Footer, CTA-Leiste und Cookie-Banner auf `inert`.
- **Website-Team / P2-9:** WebKit (Playwright unter Windows) rendert Montserrat sehr dünn. Auf einem echten iPhone gegenprüfen und klären, ob `next/font` die variable Gewichtsachse korrekt liefert.
- Lead-Endpunkte sollen Frappe-`name` zurückgeben (dann verifizierte `leadRef` im Ticket statt nur eigener Ref).
- Rate-Limit und Tageszähler gelten pro Instanz (In-Memory bzw. lokaler Ordner); bei mehreren Instanzen braucht es Redis oder S3-Zähler.
- Team-Benachrichtigung bei „Senden“ (E-Mail/Frappe) fehlt noch; interne Ansicht der Uploads ebenfalls (bewusst kein öffentlicher Download).
- `UPLOAD_TOKEN_SECRET` in Produktion setzen; S3-Adapter; geteiltes Rate-Limit (Redis).
- HEIC/Video-Metadaten-Bereinigung, Virenscan (ClamAV) vor Übergabe an Frappe.
- Löschfrist und Datenschutztext vom Inhaber bestätigen; ggf. EN/FR/IT-Texte.

## Runde 3 (26.10.2026)

- `UploadHandoff` im Neuauftritt: Haarlinie (`border-line`) auf Paper, keine Radien, keine Schatten, kein Messingbalken; QR mit 1-px-Haarlinie. Name, Props und Exporte (`default`, `handoffFrom`) unverändert. Info-Kästen der Demo-Seite ebenso flach.
- `/de/upload/<token>`: unbekannter, gefälschter oder unvollständiger Token → `notFound()` = **HTTP 404** mit `noindex` und demselben Hilfetext (Anrufen, E-Mail) über `upload/[token]/not-found.js`. Abgelaufener Token bleibt 200 + `noindex` mit „Link abgelaufen“. Gemeinsamer Rahmen in `src/components/Upload/UploadFrame.js`.
- Tests: `tests/unit/r3-portal-upload.test.mjs`, `tests/e2e/r3-portal-upload.spec.js`.
- Offen: `UploadClient` (Upload-Seite selbst) hat noch Radien und einen Schatten an der Sende-Leiste.

## Runde 4 (26.10.2026): UploadClient ohne Radien

`UploadClient` hat keine Radien mehr: Kacheln, Buttons, Fortschrittsbalken und Hinweise sind jetzt eckig. Die klebende Aktionsleiste unten hat nur noch die Haarlinie und keinen Schatten. Die Demo-Seite behält den abgerundeten Handyrahmen ab `sm`, weil er das Gerät darstellt. Absicherung: `tests/unit/r3-portal-flat.test.mjs`.

## Runde 4 (Paket R4-portal-labs, 26.10.2026): FocusShell entfällt

Die Seiten-Shell rendert `/de/upload/**` jetzt schlank (`Reusable/BareShell.js`: `header[data-shell="bare"]` mit Wortmarke und „Zurück zur Website“, kein Menü, kein Footer, keine CTA- oder Cookie-Leiste). Deshalb ist `Upload/FocusShell.js` (fixe Abdeckung über der Seite und `inert` auf allem außer `<main>`) gelöscht.

- `UploadFrame.js`: kein eigenes Logo mehr (die Shell zeigt die Wortmarke), keine zweite Scroll-Fläche, normales Seiten-Scrollen. Die eigene Rechts-Navigation („Rechtliches“ mit Telefon) bleibt, die Shell blendet ihre einzeilige Fußzeile dann per `:has()` aus.
- `UploadClient` scrollt ohne `[data-upload-scroll]` mit `scrollIntoView` (in der Labs-Demo bleibt der Handy-Rahmen der Scroll-Container).
- Fokus und Escape auf 4 Geräten (`tests/e2e/r4-portal-labs.spec.js`): kein `[inert]`, kein Cover, `html` ohne `overflow: hidden`, „Zurück zur Website“ fokussierbar (Chromium: zweiter Tab-Halt nach dem Skip-Link; WebKit: fokussierbar, Links sind dort ohne „Tab zu Links“ nicht in der Tab-Folge), Escape lässt den Fokus stehen und navigiert nicht, weiteres Tabben erreicht das Formular bzw. das Rechtliche, kein Querscrollen.

## Runde 5 (Paket R5-portal-labs, 26.10.2026): Texte über t()

- Seite `/de/upload/[token]` (Überschrift, Einleitung, QR-Spalte), `UploadFrame` (Problemtexte abgelaufen/ungültig, Alternativen, Impressum/Datenschutz) und `not-found.js` lesen `Upload.*` per `tx()` mit DE-Fallback. Die neuen Schlüssel stehen in `messages-r5-portal.json`.
- `nav aria-label="Rechtliches"` bleibt wörtlich, weil `globals.css` die Shell-Fußzeile über diesen Selektor ausblendet (`r4-portal.test`). Vor einer EN-Freigabe auf ein data-Attribut umstellen.
- Upload bleibt DE-only (`locale !== "de"` → 404).

## Labs-Ausbau „Handy-Upload Premium“ (27.10.2026)

Ziel: QR-Übergabe und mobile Upload-Seite hochwertig und modern nach Design-Bibel (Paper, Haarlinien, Radius 0, ein Primärknopf pro Ansicht, Messing nur als Akzenttext/Funktionslinie, eine dunkle Fläche). **Sicherheitslogik unverändert:** Tickets, Token, Magic-Bytes, Limits, Chunking, Wiederholungen, Einwilligungsversion, alle API-Routen und `messages.js`. Geändert wurden nur Darstellung und Texte in `UploadHandoff.js`, `UploadClient.js`, `upload/[token]/page.js`, `labs/upload-demo/page.js` sowie die QR-Zeichnung (`qrSvg.js`, von `handoff.js` genutzt).

### Übergabekarte (`UploadHandoff.js`)
- **Haus-QR** (`src/lib/upload/qrSvg.js`, nur serverseitig): Ink-deep auf Paper (14,6:1), Ruhezone 4 Module, Datenmodule als leicht eingerückte Quadrate (8 % Fuge), Suchmuster massiv, in der Mitte das **Platzhirsch-Monogramm** (Striche aus `Brand/Logo.js`) auf einem Paper-Feld. Angezeigt in 224 × 224 px (≥ 3 px pro Modul) in einem **Sucher-Rahmen** (vier Ecken, dekorativ).
- **Scanbarkeit getestet**, bevor das Monogramm aktiv wurde: `node qa-screenshots/labs-ausbau/handy-upload/selbst/qr-scan.mjs <jsqr-node_modules>` rendert mit sharp und dekodiert mit **jsQR 1.4.0** (April 2021; nur im Scratch-Ordner installiert, **kein neues Projektpaket**). Matrix: Dev- und Produktions-URL, mit/ohne Monogramm, 180–400 px, scharf, JPEG q35, Unschärfe σ 1,2 (ab 200 px) → **56/56 dekodiert**. Vergleich: Das Monogramm-Feld (Fehlerkorrektur Q, Feld 11 × 11 von 57 × 57 Modulen = 3,7 %, Q repariert bis 25 %) dekodiert exakt so oft wie dasselbe Symbol ohne Monogramm. Stufe H war schlechter (Version 11/12 statt 10 → dichtere Module, Ausfälle unter 200 px), daher Q.
- **Mini-Anleitung in 3 Schritten** (Desktop/Tablet): Kamera öffnen · Code anvisieren · Raum zeigen.
- **Gültigkeit dezent:** „noch 59 Min. / 13 Std. / 13 Tage gültig“ plus 1-px-Restlaufzeitlinie (Messing-500 als Funktionslinie). Wird erst im Browser nach dem Mounten berechnet (`useSyncExternalStore`, Server-Snapshot `null` → keine Hydration-Abweichung), Takt 30 s. Darunter weiter „Referenz … · gültig bis …“.
- **„Link per SMS oder E-Mail an mich“ – vorbereitet:** aufklappbar, Etikett „Vorbereitet“, Wahl SMS/E-Mail (Radiogruppe), Feld für Nummer/Adresse (E-Mail aus dem Formular vorbelegt). Der Knopf öffnet **nur die eigene SMS- bzw. Mail-App** des Besuchers (`sms:…?&body=`, `mailto:`) mit fertigem Link; Platzhirsch sendet und speichert nichts, der Hinweistext sagt das ausdrücklich. Für echten Versand später: SMS-Anbieter (AVV, EU), Versand-Route mit Ticket-Bindung und Rate-Limit – nicht gebaut.
- **„Auf diesem Gerät hochladen“** (Desktop): sekundärer Knopf „Upload-Seite öffnen“ (neuer Tab, 1-px-Ink-Rahmen). Am Handy bleibt genau ein Primärknopf „Jetzt Fotos & Pläne senden“ (gleicher Tab), kein QR. „Link kopieren“ als ruhiger Textlink.
- Eintritt 600 ms `ease-quiet` (8 px, nur `motion-safe`), QR blendet in 240 ms ein.

### Mobile Upload-Seite (`UploadClient.js`, `upload/[token]/page.js`)
- **Stepper** „1 · Zustimmen – 2 · Aufnehmen – 3 · Senden“ (`aria-current="step"`, Haarlinien-Balken).
- **Große Kacheln** (≥ 144 px hoch, 2 Spalten): Foto aufnehmen (Raumfotos), Video-Rundgang, Grundriss / Plan, Aus Galerie, dazu die breite Kachel **Notiz & Maße** (springt ins Notizfeld). Zähler je Kategorie (eckig, Ink). Gesperrter Zustand wie bisher AA-geprüft (ink/80, ink/75 auf Bone, Deckkraft 1).
- **Geführte Aufnahme-Tipps** mit eigenen Strichzeichnungen (Ink, ein Messing-500-Akzent): Aus den Ecken fotografieren · Video langsam schwenken · Maße notieren · Licht an, Vorhänge auf. Seitlich wischbar (Scroll-Snap, per Tastatur scrollbar, kein Autoplay).
- **Vorschau-Galerie** in 2 Spalten, 4:3-Vorschau (lokale Object-URLs), Fortschrittsbalken je Datei am Bildrand plus Prozent-Etikett, Häkchen wenn fertig, Entfernen 44 × 44 px oben rechts. Status- und Fehlertexte unverändert („Hochgeladen“, „Abgelehnt: …“, „Gestoppt: …“, „Erneut versuchen“).
- **Sticky-Gesamtfortschritt** auf **Ink-deep** (die eine dunkle Fläche der Seite, Bibel §4), Balken Messing-400 (auf Dunkel erlaubt), „Senden“ als Paper-Knopf, Safe Area unten.
- **Erfolgsseite:** gezeichnetes Häkchen (400 ms, entfällt bei reduzierter Bewegung), „Vielen Dank!“ (fokussiert), Miniaturen-Raster, Zusammenfassung (Referenz, z. B. „2 Fotos · 1 Video · 1 Plan“, Notiz mitgesendet/keine), **„So geht es weiter“** in 3 Schritten ohne Zeitversprechen, „Weitere Dateien hinzufügen“, „Zur Website von Platzhirsch“.
- **Haptik:** `navigator.vibrate` 8 ms pro fertiger Datei, 14 ms beim Senden – nur ohne `prefers-reduced-motion` (iOS Safari kennt kein `vibrate`, dort entfällt sie).
- **Bewegung:** nur `transform`/`opacity`, alles hinter `motion-safe` bzw. `@media (prefers-reduced-motion: no-preference)`; Kachel-Druck 0,98.
- **Dark/Light:** Die Bibel liefert zum Start **keinen systemgesteuerten Dark Mode** (§4.4). Die Seite bleibt hell; dunkel ist nur die Fortschrittsleiste (die eine dunkle Fläche). Abendmodus-Tokens folgen mit der Gesamtfreigabe.
- **Safe Areas** links/rechts (Querformat mit Notch) und unten; Touch-Ziele ≥ 44 px (Hauptknöpfe 48 px); Seitentitel 32–44 px Bodoni, Referenz als Haarlinien-Chip; Desktop-QR-Spalte 224 px mit Haarlinie.

### Labs-Demo (`/de/labs/upload-demo`)
Titel `display-l`, Ablauf als nummerierte Haarlinien-Zeilen, Karte auf Stone-Band, Handyrahmen mit Monogramm-Kopfzeile und Referenz. Bleibt `noindex`.

### Rechte
Keine Herstellerbilder verwendet; Tipp-Zeichnungen und QR sind eigene Vektorgrafik, das Monogramm ist das eigene Logo (Interims-Reinzeichnung, Bibel §3). Kein Eintrag im Rechte-Register nötig.

### Prüfung
- Unit: `node --test tests/unit/upload-qr.test.mjs` (QR-Eigenschaften, Schnittstellen, kein Versand-Fetch) plus alle bisherigen Upload-, Portal- und Leads-Tests.
- e2e: `npx playwright test upload-premium --project=desktop` (Desktop Chrome, dazu iPhone 15 Pro WebKit per `test.use` in `upload-premium-iphone.spec.js`): Karte, Sucher-QR, Countdown, vorbereiteter Versand (nur Link-Aufbau, kein Klick), axe WCAG 2.2 AA auf der Karte, Demo-Handy Upload → Dank mit Zusammenfassung; iPhone: ein Hauptknopf, kein QR, Touch-Ziele ≥ 44 px, Upload + Erfolgsseite, Reduced Motion ohne Animation.
- Screenshots: `qa-screenshots/labs-ausbau/handy-upload/selbst/` (shoot.mjs: Demo und Kontakt auf iPhone/Android/iPad/Desktop).

### Offen
- Echter Kamera-Scan mit iPhone und Android (Monogramm-QR) vor Livegang; für Drucksachen ggf. `qrSvg(url, { logo: false })`.
- Echter SMS/E-Mail-Versand durch Platzhirsch (Anbieter, AVV, Rate-Limit, Ticket-Bindung) – Entscheidung Inhaber.
- Texte der neuen Bausteine (Tipps, Stepper, Erfolgsseite, Karte) noch nicht in `messages/*.json` (Upload bleibt DE-only).

## Labs-Ausbau – QA-Runde fix1 (27.10.2026)

Grundlage: `qa-screenshots/labs-ausbau/handy-upload/feedback-1.md` (Note 7/10). Belege in `qa-screenshots/labs-ausbau/handy-upload/fix1/`. Sicherheitslogik unverändert (Ticket, Token, Grenzen, serverseitige Magic-Byte-Prüfung, Chunking). Keine neuen npm-Pakete.

### P1-1 · iPhone/WebKit: Upload hängt sichtbar bei „0 %“
- **Messung** (`fix1/webkit-put.mjs`, `fix1/webkit-net.mjs`, Ergebnis `fix1/webkit-put-messung.txt`): Gleicher 346-KB-Chunk an den Dev-Server. WebKit: Anlegen 16,5 s, PUT 8,5–10,6 s, jeweils **im ersten Versuch erfolgreich**. Chromium im selben Zeitfenster einmal 0,1 s, in einem späteren Lauf **86,7 s** für das Anlegen. Leere Requests an dieselbe Route liefen unter WebKit in 0,1–0,7 s. Ursache der Wartezeit ist in dieser Umgebung also der **überlastete Dev-Server** (ein Node-Prozess mit 12,5 GB, parallele Teams), nicht WebKit. Der Fehler „WebKit encountered an internal error“ trat in den fix1-Läufen nicht auf.
- **Umgesetzt:**
  - Jeder Chunk wird vor dem Senden einmal in einen `ArrayBuffer` gelesen (höchstens 4 MB) und bei Wiederholungen wiederverwendet. Das vermeidet den bekannten WebKit-Pfad beim Senden eines `File`-Slices. Kann die Datei nicht gelesen werden, geht der Blob wie bisher.
  - Jeder automatische Wiederholversuch ist sichtbar, sowohl beim Anlegen als auch beim Chunk: „Verbindung holpert – neuer Versuch (2/5)…“ an der Karte, mit drehendem Pfeil nur bei `motion-safe`. Die Live-Region sagt „neuer Versuch 2 von 5“.
  - Status vor dem ersten Byte: zuerst „Wird vorbereitet…“. Nach 5 s ohne Byte folgt „Verbindung ist langsam – wir bleiben dran…“.
  - Bei 0 % zeigt der Balken ein ruhig wanderndes Segment statt eines leeren Balkens; bei reduzierter Bewegung steht es still.
  - Das Prozent-Etikett erscheint erst nach dem Anlegen.
- **Offen:** Die Messung auf einem echten iPhone (Safari über LAN-IP mit `UPLOAD_PUBLIC_BASE_URL`, 3–5-MB-HEIC/JPG und ein 30-s-Video) war hier nicht möglich, weil kein Gerät vorhanden ist. Die Gegenprobe gegen einen Production-Build (`next start`) steht ebenfalls aus. Ziel: unter 2 s für 346 KB im LAN. `Connection: close` wurde serverseitig **nicht** gesetzt, weil die Routen nicht zu diesem Team gehören und die Messung keinen Keep-Alive-Fehler zeigte.

### P2
1. **Breite Übergabekarte:**
   - Am Desktop ab `lg` jetzt `max-w-[57rem]`, gemessen 912 px bei 1440.
   - QR-Spalte `lg:grid-cols-[20rem_1fr]`, QR 256 px, Figure vertikal zentriert.
   - Die Demo-Seite zeigt die Karte in einer eigenen Zeile; Handyrahmen und Test-Hinweise stehen darunter.
   - Belege: `fix1/fix1-desktop-handoff-card.png`, `fix1/de-labs-upload-demo--desktop--full.png`.
2. **„Link an mich senden“:**
   - Steht einzeilig, darunter das Etikett „Vorbereitet · per E-Mail oder SMS“.
   - Unter `sm` ausgeblendet; auf dem iPhone ist `display: none` gemessen.
   - E-Mail ist voreingestellt und mit der Adresse aus dem Formular vorbelegt, SMS ist die zweite Option.
3. **Dateityp vor dem Hochladen:**
   - `detectType` (`src/lib/upload/magic.js`) arbeitet jetzt auf jedem `Uint8Array`, also auf dem Buffer des Servers und dem Array des Browsers, mit identischen Regeln (Unit-Test vergleicht beide).
   - Der Browser liest `file.slice(0,16)` und lehnt eine umbenannte .exe sofort ab, ohne Request.
   - Ein leerer MIME-Typ wird anhand der Bytes als Foto oder Video eingeordnet.
   - Der Server prüft weiterhin verbindlich.
4. **Klicks vor der Hydration:** „Link kopieren“ und „Link an mich senden“ sind bis zum Mount `disabled` (Flag über `useSyncExternalStore`). Ein Klick direkt nach `domcontentloaded` zeigt „Kopiert“ (e2e).
5. **Gültigkeit:**
   - Das Label heißt „Gültig“ und steht nur einmal; der Wert lautet „noch 60 Min.“, „noch 13 Std.“ oder „noch 13 Tage“.
   - Vor dem Start der Uhr steht „bis 20:43 Uhr“ (Demo) bzw. „bis 10. November, 19:59 Uhr“, in der Zeitzone Europe/Vienna, damit die Hydration identisch bleibt.
   - Die Fußzeile der Upload-Seite zeigt Datum und Uhrzeit.

### P3
- **P3-1:** Die Fortschrittsleiste blendet ihr „Senden“ aus, solange der Formular-Knopf im Bild ist (IntersectionObserver, Wurzel ist der Scroll-Container der Demo bzw. der Viewport).
- **P3-2:** Die Leiste zeigt „1 von 3 fertig · 50 % der Daten“.
- **P3-3:** Die Tipps zeigen „1 / 4“ und vier Balken als Sprungmarken (44 × 44 px Tippfläche, 2-px-Linie).
- **P3-4:** Vor der Zustimmung sehen die Kacheln fertig aus, sind aber `aria-disabled` und verweisen per `aria-describedby` auf den Hinweis. Antippen scrollt zur Checkbox, setzt den Fokus darauf, rahmt sie ein und ändert den Hinweis in „Einmal oben zustimmen – dann geht es los.“. Abgelaufener Link oder abgeschaltete Demo bleiben hart gesperrt (`disabled`, gestrichelt).
- **P3-7:** Unter dem QR steht „Code bereit · mit der Kamera scannen“, auf dem Tablet kurz „Code bereit · scannen“. Ein grüner Punkt pulsiert zweimal, nur bei `motion-safe`.
- **Offen:**
  - **P3-5:** Die Texte liegen noch nicht in `messages/*.json`; Upload bleibt DE-only.
  - **P3-6:** Gegenprobe gegen einen Production-Build.

### Tests
- Unit: `node --test tests/unit/upload-fix1.test.mjs` (7 Tests) und alle bisherigen Upload-, Portal- und Leads-Unit-Tests, zusammen 65/65 grün.
- e2e in `tests/e2e/upload-premium.spec.js`:
  - Kartenbreite 860–930 px, QR ≥ 250 px, „Gültig“ nur einmal
  - „Link an mich senden“ einzeilig, E-Mail voreingestellt
  - Klick auf „Kopieren“ direkt nach `domcontentloaded`
  - erzwungener Netzabbruch beim ersten PUT, danach „neuer Versuch (2/5)“ und „Hochgeladen“
  - falsche Datei: kein Request, Ablehnung unter 3 s
  - weiche Sperre führt zur Checkbox
- e2e in `upload-premium-iphone.spec.js`: kein Versand-Angebot am Handy; `programm.jpg` wird unter WebKit ohne Request abgelehnt.
- **Hinweis:** Auf dem überlasteten Dev-Server liefen Tests, die einen Link prägen (`POST /api/upload/session`), mehrfach in Zeitüberschreitungen (> 90 s). Die Karte zeigt dann wie vorgesehen „dauert gerade länger als üblich“ mit „Erneut versuchen“. Ergebnis siehe `fix1/e2e-lauf2.txt`.
- **Lauf 2** (`upload-premium`, ein Worker): 7 bestanden, 1 wackelig (Link-Prägung > 90 s, im Wiederholungslauf grün) und 1 rot. Rot war der bestehende iPhone-Upload-Test: Das Anlegen der Datei scheiterte unter WebKit wiederholt mit einem Netzfehler und lief damit über 60 s. Die Karte zeigte dabei korrekt „Verbindung holpert – neuer Versuch (2/3)…“ (beim Anlegen 3 Versuche, je Chunk 5). Der WebKit-Abbruch beim POST bleibt damit offen, bis auf einem echten iPhone und gegen `next start` gemessen ist.
- Erster Lauf (`upload-premium`, `upload.spec`, `r3-portal-upload`): Alle roten Tests scheiterten an Zeitüberschreitungen des Dev-Servers bei `/api/upload/session` (Karte: „dauert länger als üblich“), dazu ein eigener Testfehler (`gültig.*gültig` traf den Container) – der ist behoben.

## Labs-Ausbau – QA-Runde fix2 (27.10.2026)

Grundlage: `qa-screenshots/labs-ausbau/handy-upload/feedback-2.md` (Note 7,5/10). Belege: `qa-screenshots/labs-ausbau/handy-upload/fix2/` (`fx-*.png`, `fix2-interact.mjs` und `fix2-interact-*.log`, shoot.mjs-Bilder `de-*`, `report.json`) und der Produktions-Lauf `qa-screenshots/teamleiter/labs-ausbau-handy-upload/fix2/` (`summary.md`, `playwright.log`). Keine neuen npm-Pakete. Ticket, Token, Grenzen, Magic Bytes und Chunking sind unverändert.

### P1-1 · Hängender Upload war im sichtbaren Bereich stumm
- **Timeout am Client:** Jeder POST-Versuch hat ein eigenes Timeout: 12 s für die ersten beiden Versuche, danach 24, 36 und 48 s. So kommt ein nur langsamer Server (Kaltstart) doch noch durch. Ein Lauf auf dem überlasteten Dev-Server, bei dem jeder Versuch über 12 s brauchte, endete mit gleichen Timeouts im Fehler (`AbortSignal.timeout`, kombiniert per `AbortSignal.any`). Safari unter 17.4 nutzt `AbortController` mit `setTimeout`. Das Absenden hat 20 s.
- **Mehr Versuche:** `POST /files` hat jetzt 5 Versuche wie die Chunks (`BACKOFF`). Der Endpunkt ist über den Fingerprint idempotent. Der Unit-Test zeigt: 5 parallele Wiederholungen ergeben dieselbe `fileId` und genau einen Eintrag.
- **Die Leiste zeigt den Zustand der aktiven Datei:**
  - „Verbindung ist langsam – wir bleiben dran…“ nach 5 s
  - „Neuer Versuch n/5…“ mit drehendem Icon
  - „Pausiert – wartet auf Verbindung“ mit WifiOff-Icon
  - „n Dateien nicht hochgeladen“ mit „Erneut versuchen“
  - Darunter steht „x von y fertig · z % der Daten“, links eine Mini-Vorschau von 32 px (P3-2).
  - Solange nichts Messbares läuft, gleitet ein Segment über den Balken (`motion-safe`, bei reduzierter Bewegung ausgeblendet).
- **„Erneut versuchen“ nach 20 s ohne Byte-Fortschritt:** Der Knopf beendet den laufenden fetch- oder XHR-Versuch oder die Wartepause und startet sofort neu. Das kostet keinen der 5 Versuche. Gemessen auf dem Dev-Server: langsam nach 5,2–5,7 s, Versuch 2/5 nach 12,4–12,7 s, Knopf nach 20,6–21,1 s (iPhone, Android, Desktop).
- **Anlegen des Links entlastet:** `purgeExpired()` läuft im Hintergrund (`purgeInBackground`, höchstens alle 10 min, immer nur ein Lauf). `stats()` liest alle Sitzungsdateien mit `Promise.all`.
- **Produktions-Build:** `tools/qa/prod-check.mjs` in einer Kopie außerhalb des Repos (`../ph-prodcheck-upload`, Port 3110, `UPLOAD_DEMO_ENABLED=1`). Gemessen mit `tests/e2e/upload-timing.spec.js` (opt-in `UPLOAD_TIMING=1`) auf iPhone 15 Pro (WebKit), 3 von 3 Läufen grün:

  | Lauf | Link anlegen | 489-KB-Foto |
  |---|---|---|
  | 1 | 18 ms | 0,58 s |
  | 2 | 19 ms | 0,59 s |
  | 3 | 17 ms | 1,11 s |

  Ziele: < 300 ms für das Anlegen, < 3 s für das Foto. Im selben Lauf waren `upload-premium-iphone`, `upload-fix2` und `upload-premium` grün: 17 Tests bestanden.
- **Offen:** Messung mit einem echten iPhone über die LAN-IP (3–5-MB-HEIC, 30-s-Video). Dafür war kein Gerät verfügbar.

### P2
- **P2-1 · Fortschritt springt nicht mehr zurück:**
  - Pro Chunk höchstens 97 %, bis der Server bestätigt.
  - Angezeigt wird `max(bisher, neu)`.
  - Gemessen mit einem PUT-500: Android 50→82→94→98, iPhone 50→82→89→98, jeweils monoton. 98 % ist der Gesamtwert über drei Dateien.
- **P2-2 · 100 % erst nach Bestätigung:** „100 %“ erscheint nur, wenn alle Dateien vom Server bestätigt sind, sonst höchstens 99 % (`floor`). Offline zeigt die Leiste „Pausiert – wartet auf Verbindung · 1 von 2 fertig · 99 %“ (`fx-android-b-offline-paused.png`).
- **P2-3 · Zwischenablage blockiert oder nicht vorhanden:**
  - Es erscheint ein schreibgeschütztes Feld mit dem Link, fokussiert und vollständig markiert.
  - Dazu der Hinweis „Kopieren nicht möglich – Link markiert, mit ⌘/Strg + C kopieren“, auch in der Live-Region.
  - Beleg: `fx-desktop-e-copy-fallback.png`.

### P3
- **P3-1:** Erfolgsseite mit einer Datei: Vorschau in voller Breite (4:3). Zwei oder drei Dateien stehen in 2 bzw. 3 Spalten, ab vier im bisherigen Raster.
- **P3-2:** Mini-Vorschau in der Leiste (siehe oben).
- **Zusätzlich:** Ein Häkchen bei der Zustimmung vor der Hydration ging verloren (sichtbar angehakt, aber Schritt 1). Es wird jetzt nach dem Mounten übernommen.
- **P3-3 (Testdoku):** Kacheln mit `aria-disabled` brauchen in Playwright `dispatchEvent`/`force`.
- **P3-3 (Testskripte):** Skripte, die direkt nach `goto` Dateien setzen, sollen vorher auf die Hydration warten, etwa Schritt „Aufnehmen“ aktiv (`li[aria-current=step]`).
- **P3-4 (Texte in `messages/*.json`)** ist weiter offen.
- **P3-5 (Dev-Indicator)** ist offen: `next.config.js` liegt außerhalb dieses Pakets. Saubere Bilder liefert der Produktions-Lauf.

### Tests
- **Unit:**
  - `tests/unit/upload-fix2.test.mjs`, 9 Tests:
    - Timeout und 5 Versuche mit einem hängenden `fetch`
    - manueller Neustart
    - offline
    - Fingerprint ergibt dieselbe `fileId`
    - Hintergrund-Purge
    - Quellprüfungen
  - In `upload-fix1.test.mjs` wurde eine Quellprüfung angepasst (`sleep` → `nap`).
  - Alle Upload-Unit-Tests: 45/45 grün.
- **E2E:** `tests/e2e/upload-fix2.spec.js`, 5 Tests: Clipboard blockiert und fehlend, offline mit PDF, PUT-500 monoton, hängender Server mit „Erneut versuchen“. Grün auf dem Dev-Server und im Produktions-Build.
- **Gesamtlauf Upload-E2E (Dev):** 29 bestanden, 2 flaky, 3 übersprungen (Timing nur opt-in). Flaky waren der Hängetest vor dem gestuften Timeout und der Portal-Header-Test (Timeout des Dev-Servers).
- **Fremd:** `r3-portal-upload.spec.js` (Permissions-Policy-Header) ist rot. Die Ursache liegt in der Header-Konfiguration und hat mit dem Upload nichts zu tun.

## Nachtrag fix2 · Reste aus der Abnahme (27.10.2026)

Grundlage: `qa-screenshots/labs-ausbau/handy-upload/abnahme.md` (8/10, bedingt abgenommen). Alle P1/P2 aus `feedback-2.md` waren schon umgesetzt (siehe oben). Hier sind die offenen Reste. Keine neuen npm-Pakete. Ticket, Token, Grenzen, Magic Bytes, Chunking und Retry-Logik sind unverändert.

- **R-1 · Vor der Hydration ging nichts mehr stumm verloren:**
  - Die Zustimmungs-Checkbox ist bis zur Hydration `disabled` (`useMounted`, wie die Knöpfe der Übergabekarte). Ein früher Tipp kann also nicht mehr angehakt aussehen, ohne dass React ihn kennt.
  - Dateien, die vor der Hydration in einem Aufnahme-Input landen, werden nach dem Mounten einmal übernommen und nicht verworfen. Sie durchlaufen die volle Client-Prüfung und warten in der Warteschlange, bis die Zustimmung da ist. Die Queue startet weiter nur mit `consent`.
  - E2E: `tests/e2e/upload-abnahme.spec.js` „R-1“ (iPhone/WebKit). Die JS-Chunks werden zurückgehalten, die Datei wird vor der Hydration gesetzt, dann wird die Hydration freigegeben. Erwartet: die Checkbox ist gesperrt, die Datei erscheint, und nach der Zustimmung kommt „Hochgeladen“.
- **R-5 · Die iPhone-Leiste schneidet keinen Text mehr ab:**
  - „Erneut versuchen“ ist unter `sm` ein Icon-Knopf mit 44 × 44 px. Der Name bleibt per `sr-only`-Text erhalten. Das gilt für den Stall-Knopf und für „nicht hochgeladen“.
  - Das Lauf-Segment ist jetzt messingfarben (`bg-brass-400/80`) statt `paper/45` und damit auf der dunklen Spur erkennbar. Bei reduzierter Bewegung bleibt es ausgeblendet.
  - E2E „R-5“ prüft:
    - Titel und Detailzeile ohne Überlauf auf 393 px
    - Knopf ≥ 44 px mit Namen
    - Segment vorhanden
    - axe 0
  - Beleg: `qa-screenshots/labs-ausbau/handy-upload/fix2/r5-iphone-bar-stalled.png` („Neuer Versuch 2/5…“ und „0 von 1 fertig · 0 % der Daten“, beide vollständig).
- **Unit:** In `tests/unit/upload-fix2.test.mjs` ist eine Quellprüfung „Abnahme R-1/R-5“ dazugekommen. Upload-Unit gesamt: 46/46 grün.
- **R-2 · Produktions-Lauf mit dem aktuellen Stand** (`tools/qa/prod-check.mjs`):
  - Kopie `../ph-prodcheck-upload`, Port 3110, `UPLOAD_DEMO_ENABLED=1`, `UPLOAD_TIMING=1`.
  - Bericht: `qa-screenshots/teamleiter/labs-ausbau-handy-upload/fix2-abnahme/` und `fix2-abnahme-r1/`.
  - Der erste Build brach in der fremden Galerie-Vorschau ab (`next/font/google`, Cormorant). Der zweite Build lief ohne Änderung durch, der Fehler war also vorübergehend.
  - iPhone 15 Pro (WebKit), 3 von 3 Läufen grün:

    | Lauf | Link anlegen | 489-KB-Foto |
    |---|---|---|
    | 1 | 21 ms | 0,46 s |
    | 2 | 35 ms | 0,52 s |
    | 3 | 24 ms | 0,55 s |

  - Upload-Specs: 18 grün, 0 flaky, 1 rot. Rot war der neue R-1-Test, und der Fehler lag im Test: Er hielt auch das CSS zurück, das bei Turbopack im selben Ordner liegt. Nach der Korrektur (nur `.js` zurückhalten) auf demselben Build 2/2 grün.
- **Dev-Gesamtlauf Upload-E2E** (überlasteter Dev-Server, nicht repräsentativ): 27 grün, 0 rot, 1 flaky, 3 übersprungen (Timing nur opt-in). Flaky war die 3-s-Grenze bei der umbenannten .exe; im Retry grün.
- **shoot.mjs `fix2/`:**
  - upload-demo auf iPhone, Android, iPad und Desktop: 4 × 200.
  - Auf dem iPhone 3× „Failed to load resource: Timeout was reached“. Das sind Ladezeiten-Abbrüche des überlasteten Dev-Servers, keine Fehler im Code.
- **Weiter offen:**
  - R-3: echtes iPhone und Android über die LAN-IP (HEIC 3–5 MB, 30-s-Video, Mobilfunk). Es war kein Gerät verfügbar.
  - R-6 / P3-4: Texte in `messages/*.json`.
  - R-7 / P3-5: Dev-Indicator (`next.config.js`, liegt außerhalb des Pakets).

## Abnahme-Restliste (28.10.2026)

Grundlage: `qa-screenshots/labs-ausbau/handy-upload/abnahme.md` (9/10, für Labs abgenommen). Keine neuen npm-Pakete, kein Cloud-Dienst angebunden. Ticket, Token, Grenzwerte, Magic Bytes, Chunking und Retry sind unverändert.

- **R-6 · Texte:** Der Vorschlag liegt in `Marktresearch/digital/features/upload-messages-vorschlag.json`. Er ist bewusst nicht in `src/messages/*.json`, denn das übernimmt das Übersetzungsteam.
  - Inhalt: Namespace `Upload` mit `client`, `handoff`, `consent`, `errors`, `handoffReasons`, `categories` und `demo`, in ICU-Syntax (Plural, Platzhalter, `t.rich`-Tags). Die vorhandenen Schlüssel `Upload.page`, `problem` und `frame` sind nicht doppelt enthalten.
  - Einwilligung: Jede inhaltliche Änderung braucht eine neue `CONSENT_VERSION`. Übersetzungen vor der Freigabe rechtlich prüfen lassen.
  - Danach: Sobald die Schlüssel in `de.json` stehen, stellt das Upload-Team die Komponenten auf `tx()` um. Bis dahin bleibt die Upload-Seite DE-only.
- **R-7 · Dev-Indicator: nur dokumentiert, nicht geändert.** `next.config.js` setzt kein `devIndicators`, also gilt der Standard `bottom-left` (siehe `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/devIndicators.md`). Das „N“ überdeckt in Dev-Aufnahmen links unten Inhalte. Für das Plattform-Team gibt es zwei Möglichkeiten:
  - `devIndicators: { position: "bottom-right" }` (die Upload-Leiste hat rechts unten keinen Inhalt unter dem Knopf)
  - `devIndicators: false` (Compile- und Laufzeitfehler zeigt Next weiterhin an)

  Bis dahin QA-Bilder für Abnahmen aus dem Prod-Lauf nehmen. Im Live-Betrieb gibt es den Indicator nicht.
- **R-8 · Portal-Header-Tests:** `tests/e2e/r3-portal-upload.spec.js` hat ein eigenes Request-Timeout von 90 s (`PW_REQUEST_TIMEOUT`, Standard `90000`) statt der globalen 15 s (`actionTimeout`). Dazu kommt ein Test-Timeout von 300 s für den Block.
  - Ein `beforeAll` mit eigenem API-Kontext ruft die sieben Routen parallel auf. Er wärmt sie damit vor, sein Ergebnis wird nicht geprüft. Sein Timeout wird per `test.setTimeout` gesetzt, weil `describe.configure` nicht für Hooks gilt.
  - Die Erwartungen selbst sind unverändert.
- **R-9 · Live-Einsatz vorbereitet:** Konfiguration und Prüfliste sind fertig, aber nichts ist aktiviert. Einzelheiten stehen im nächsten Abschnitt.
- **R-3 bleibt offen:** echtes iPhone und Android über die LAN-IP. Es ist weiterhin kein Gerät verfügbar.
- **Tests:**
  - neu: `tests/unit/upload-live.test.mjs` (Prüfliste, Speicher-Config, beide Limit-Speicher, http.js und Routen, R-8, R-7, Gültigkeit des R-6-Vorschlags)
  - angepasst: `tests/unit/upload.test.mjs`, weil `linkLimited` jetzt async ist
  - Unit (Upload + r3-portal-upload): 56/56 grün. ESLint auf den geänderten Dateien ohne Befund.
  - E2E (Dev, 1 Worker, desktop: `r3-portal-upload`, `upload`) auf einem stark überlasteten Dev-Server (`/de/labs/upload-demo` brauchte per curl 100–150 s): 10 grün, 2 flaky (darunter der Portal-Header-Test, der im Retry mit dem neuen Timeout grün war), 5 rot. Alle 5 sind `page.goto`- bzw. Test-Timeouts beim Laden, keine Assertion. Gegen `next start` wiederholen.
  - `shoot.mjs feinschliff/handy-upload/selbst/`: 4 × 200, kein Überlauf, 0 Konsolenfehler. Das Bild zeigt den Dev-Indicator („Compiling“) links unten (R-7).

## Feinschliff fix2 (28.10.2026)

Grundlage: `qa-screenshots/feinschliff/handy-upload/feedback.md` (Note 8,5/10). Belege: `qa-screenshots/feinschliff/handy-upload/fix2/`. Kein neues Paket, `next.config.js` und `src/messages/*.json` unverändert.

- **P2-1:** `withFallback(store, memory, { timeoutMs })` in `limitStore.js`. Ein hängender oder werfender geteilter Speicher zählt nach `UPLOAD_CONFIG.rateLimits.storeTimeoutMs` (300 ms) bzw. sofort im Arbeitsspeicher, Log höchstens einmal pro Minute. `setUploadLimitStore` hüllt den Speicher automatisch ein. Unit-Tests lösen das Verhalten wirklich aus (`exec`, das nie auflöst, bzw. wirft).
- **P2-2:** `sharedStoreMismatch(env, activeName)` in `limitStore.js`; `http.js` ruft sie in Produktion beim ersten `rateLimited`-Aufruf auf und schreibt dann `console.error`. Kommentar in `liveConfig.js` korrigiert.
- **P2-3 (angefordert beim Plattform-Team/Integrator):** Prod-Lauf gegen `next start`, Ergebnis nach `qa-screenshots/feinschliff/handy-upload/prod/`:

  ```
  BASE_URL=http://localhost:3100 PW_WORKERS=1 npx playwright test r3-portal-upload upload upload-premium-iphone upload-abnahme --project=desktop
  ```
- **P3-1:** Doku sagt jetzt „beim ersten Upload-Aufruf“ (siehe unten). Verlegen in `instrumentation.js` nur als Vorschlag ans Plattform-Team.
- **P3-2:** Portal-Header-Tests senden `HEAD` (`request.fetch(p, { method: "HEAD", … })`). Vorher per `curl -I` geprüft: alle sieben Routen antworten auf HEAD mit demselben Status und denselben Headern. Lauf: 2/2 grün (`fix2/playwright-header.log`).
- **P3-3:** `Upload.demo.testNotesItems.{lanIp, limits, resume, magicBytes}` im Vorschlag ergänzt (nur DE).
- **P3-4:** `labelPlural` je Kategorie in `config.js` („Fotos“, „Videos“, „Pläne“), `UploadClient.js` nutzt es in beiden Größen-Fehlern.
- **P3-5:** `liveReadiness`: `text` nur bei `ok: false`, sonst `null`.
- **P3-6:** Bündeln der Redis-Befehle in der Doku vermerkt (siehe unten).
- **Tests:** `tests/unit/upload-live.test.mjs` um 7 Tests erweitert. Die alte Prüfung „Vorschlag nicht in `de.json` übernommen“ ist überholt, weil das Übersetzungsteam ihn inzwischen übernommen hat; sie prüft jetzt, dass die übernommenen Fehlertexte dem Vorschlag entsprechen. Unit (Upload + r3-portal-upload): 63/63 grün, ESLint ohne Befund.

## Live-Einsatz: Speicher und Rate-Limit (R-9)

Produktion läuft heute als **ein** Prozess (`ecosystem.config.js`: pm2, `instances: 1`, `fork`). Damit gibt es zwei mögliche Wege:

1. **Einzelserver mit lokalem Ordner.** Das geht ohne neuen Dienst und braucht kein Inhaber-OK für einen Anbieter.
2. **S3-kompatibler Speicher in der EU.** Der Adapter ist noch **nicht gebaut**. Vorher muss der Inhaber den Anbieter, den Vertrag und die AV-Vereinbarung freigeben.

**Prüfliste** `src/lib/upload/liveConfig.js`:
- `liveReadiness(env, { retentionConfirmed })` liefert `{ ready, items[] }`.
- In Produktion schreibt `store.js` einmal eine Warnung mit allen offenen Punkten ins Log, und zwar **beim ersten Upload-Aufruf** (erstes Laden des Moduls, auch während `next build`), nicht beim Serverstart. Vorschlag ans Plattform-Team: die Prüfung in `instrumentation.js` verlegen.
- Jeder Punkt hat `{ key, ok, text }`. `text` ist nur bei offenen Punkten (`ok: false`) gesetzt, sonst `null`.
- Selbst prüfen:

  ```
  node --input-type=module -e "const m=await import('./src/lib/upload/liveConfig.js');console.log(m.liveReadiness(process.env))"
  ```

| Variable | Zweck | Live-Wert |
|---|---|---|
| `UPLOAD_TOKEN_SECRET` | HMAC für Token und Ticket | ≥ 32 Zeichen, nur auf dem Server |
| `UPLOAD_PUBLIC_BASE_URL` | Basis für den QR-Link | `https://…` |
| `UPLOAD_DEMO_ENABLED` | Demo-Uploads in Produktion | nicht setzen |
| `UPLOAD_STORAGE` | Speicher-Adapter | `local` (`s3` ist geplant, aber nicht umgesetzt) |
| `UPLOAD_LOCAL_DIR` | Upload-Ordner (neu, wird in `localStore.js` gelesen) | absoluter Pfad auf einem dauerhaften Volume außerhalb des Deploy-Ordners, z. B. `/srv/platzhirsch/uploads`. Ohne Wert gilt `<cwd>/.data/uploads`. |
| `UPLOAD_BACKUP_CONFIRMED` | Backup des Ordners ist eingerichtet | `1`, sobald es eingerichtet ist (verschlüsselt, EU, Aufbewahrung ≤ Löschfrist) |
| `UPLOAD_SINGLE_INSTANCE` | `0` = mehrere Instanzen | nicht setzen, solange pm2 eine Instanz hat |
| `UPLOAD_RATE_LIMIT_STORE` | `memory` (Standard) oder `shared` | `memory`, bei mehreren Instanzen `shared` |
| `UPLOAD_TRUSTED_IP_HEADER` | IP-Limit pro Besucher | nur einen Header nennen, den der Reverse-Proxy **überschreibt** (z. B. `x-real-ip`) |
| `UPLOAD_S3_ENDPOINT`, `_REGION`, `_BUCKET`, `_ACCESS_KEY_ID`, `_SECRET_ACCESS_KEY`, `_PREFIX` | für den späteren S3-Adapter | erst nach dem Inhaber-OK |

Löschfrist: Die Prüfliste meldet „offen“, bis in `config.js` `retentionConfirmed: true` mit der Frist des Inhabers steht. Bis dahin zeigt der Einwilligungstext den Platzhalter.

**Rate-Limit:**
- Die Grenzwerte stehen jetzt zentral in `UPLOAD_CONFIG.rateLimits`. Es sind dieselben Werte wie vorher:
  - Links erzeugen: 10 pro IP und Stunde, 120 pro Stunde insgesamt
  - pro Link in 10 min: 200 Anmeldungen, 1500 Chunks, 60 Notizen, 200 Löschungen, `Retry-After: 120`
- Der Speicher hängt an der Schnittstelle `src/lib/upload/limitStore.js`:
  - `createMemoryStore()` ist der Standard. Er zählt pro Instanz, ein Neustart setzt die Zähler zurück.
  - `createSharedStore(exec)` ist für Redis-kompatible Dienste gedacht (Sorted Set je Schlüssel, Kommentar mit node-redis/ioredis/Upstash).
- Anschluss: `setUploadLimitStore(createSharedStore(exec))` einmal beim Start aufrufen, z. B. in `instrumentation.js` (gehört dem Plattform-Team). Danach `UPLOAD_RATE_LIMIT_STORE=shared` setzen.
- Fällt der geteilte Speicher aus **oder antwortet er nicht innerhalb von `UPLOAD_CONFIG.rateLimits.storeTimeoutMs` (300 ms)**, zählt `http.js` im Arbeitsspeicher weiter (`withFallback` in `limitStore.js`) und schreibt das höchstens einmal pro Minute ins Log. Uploads brechen dadurch nicht ab.
- Den Redis-Client **ohne Offline-Queue** anlegen: node-redis `disableOfflineQueue: true`, ioredis `enableOfflineQueue: false`. Sonst puffert der Client bei getrennter Verbindung, und jede Anfrage wartet bis zum Zeitlimit.
- Steht `UPLOAD_RATE_LIMIT_STORE=shared`, aber niemand hat `setUploadLimitStore` aufgerufen, schreibt `http.js` in Produktion beim ersten `rateLimited`-Aufruf einmal `console.error("[upload] UPLOAD_RATE_LIMIT_STORE=shared, aber kein geteilter Speicher angeschlossen – zähle im Arbeitsspeicher")`. Die Prüfliste allein kann das nicht sehen, weil sie nur `env` liest.
- Später (erst wenn `shared` aktiv wird): Die 4 Redis-Befehle je Anfrage (`ZREMRANGEBYSCORE`, `ZADD`, `PEXPIRE`, `ZCARD`) als `MULTI`/`EXEC` oder Lua-`EVAL` bündeln. Das spart Round-Trips je Chunk und macht das Zählen atomar.
- `rateLimited`/`linkLimited` sind dafür async geworden. Alle vier Upload-Routen warten auf das Ergebnis.
- Es ist kein Redis-Client installiert und kein Dienst angebunden.

**Vor dem Go-live (Betrieb):**
- Reverse-Proxy: `client_max_body_size` ≥ 5 MB für die Chunks und einen Header für die echte IP setzen.
- Den Ordner `UPLOAD_LOCAL_DIR` anlegen (nur der Node-Benutzer darf ihn lesen und schreiben) und ins Backup aufnehmen.
- Die Prüfliste muss leer sein.
- Danach R-3 auf echten Geräten.
