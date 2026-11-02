# R3-portal-upload: Kundenportal-Auflagen, routengenaue Header, Upload-Feinschliff

Stand 26.10.2026 · Paket R3-portal-upload (Runde 3)
- Keine Commits, keine Installationen, keine Mails, kein zweiter Dev-Server.

## Nachbesserung nach QA-Feedback (Note 8/10), 26.10.2026

| Punkt | Status | Nachweis |
|---|---|---|
| **P2-1** Radien und Schatten in Portal und UploadClient | **behoben.** In 31 Dateien wurden `rounded-*` entfernt. Die Pille bleibt nur bei Avataren, beim Zähler, bei Status-Punkten und Plan-Pins (Bibel §6). Schatten gibt es nur auf schwebenden Ebenen: Sheet, PDF-Dialog, Bedienelemente über Bild oder 3D. Karten-Hover nutzt jetzt die Rahmenfarbe statt eines Schattens. | `tests/unit/r3-portal-flat.test.mjs` (2) und e2e „ohne Radien“ (berechneter Radius auf 3 Seiten). Bilder: `qa-screenshots/kundenportal/r3/fix/**` |
| **P2-2** Header im Prod-Build | **erledigt.** `next build` + `next start` liefen in einer Kopie außerhalb des Repos (`tools/qa/prod-check.mjs`, Port 3117). Die curl-Werte sind identisch mit Dev: Planung `microphone=(self)`, sonst `()` + DENY, Dokument SAMEORIGIN + `frame-ancestors 'self'`, Kalender/Pass DENY. | `qa-screenshots/kundenportal/r3/prod-headers.log`. Prod-e2e 7/7: `qa-screenshots/teamleiter/r3-release/r3-portal-upload-r4c/` |
| Zusatzbefund aus dem Prod-Lauf | **behoben.** Fehlte `PORTAL_SESSION_SECRET`, endete jede Portalseite mit Cookie in einem **500er**. Jetzt: kein Secret, also keine Session. Das Portal leitet zum Login, dort steht „Anmeldung gerade nicht verfügbar“ mit Telefonnummer. | `tests/unit/r3-portal-config.test.mjs`. Prod-Lauf r4b (ohne Secret) zeigte den 500er. |
| **P2-3** Sprachaufnahme | **teilweise.** Der Ablehnungspfad ist per e2e in Dev und Prod belegt (NotAllowedError): Hinweis, „Erneut versuchen“ fragt erneut, „Stattdessen schreiben“ fokussiert das Textfeld. | `tests/e2e/r3-portal-voice.spec.js` |
| **P2-4** A3–A5, N6 | **offen**, liegt außerhalb dieses Pakets (Inhaber, Betrieb, R3-shell, Filter-Chips). | – |
| **P3-1** Cookie-Banner auf dem iPhone | **entschärft.** Das Banner von R3-shell setzt `--ph-consent-h` als unteren Abstand. Das Login-Formular einschließlich Button ist voll sichtbar, der Datenschutzhinweis lässt sich hochscrollen. Der Banner-Text gehört zu R3-shell. | `fix/de-portal-login--iphone.png` |
| Zusatz | Auf dem Android-Gerät war die Termin-Art („PLANUNGSGE…“) abgeschnitten. Sie wird jetzt umbrochen. Der lokale Demo-Speicher (`.data/portal/demo.json`, gitignored) nannte noch Landstraße 9, jetzt 11. Der Seed war bereits korrekt. | `fix/auth/de-portal-termine--android.png` |

**Prüfung:**
- Unit: 29/29.
- e2e Dev: 19/19 (`upload`, `r3-portal-upload`, `r3-portal-voice`).
- e2e Prod: 7/7.
- ESLint: 0 Befunde.
- shoot.mjs: 3 öffentliche Seiten plus 5 Portalseiten mit Session, jeweils auf 4 Geräten. Alle liefern 200, ohne Überlauf. Die Bilder habe ich angesehen.

**Weiter offen:**
- Test auf echtem iPhone und Android mit Mikrofon-Erlaubnis.
- A3–A5 und N6.

## Ergebnis (Runde 3)

| Auftrag | Status | Nachweis |
|---|---|---|
| **N1 (P1)** Vollbild-Viewer | **behoben.** `Lightbox.js`: Der Cleanup ruft kein `close()` mehr auf (Ursache: Unter StrictMode erreichte das asynchrone `close` den neu registrierten Listener). `onClose` reagiert nur auf ein echtes Schließen (`!d.open && d.isConnected`). | `qa-screenshots/kundenportal/r3/probe3-desktop.log` und `probe3-iphone.log`: `…Vollbild:true` nach 1 s, **nach Esc: 0**, 2. Öffnen: 1. Keine Fehler aus dem Viewer. |
| **N2** iPad-Tabs | **behoben.** Zwischen 768 und 1023 px erscheint „Neue Planung“ nur als Icon-Knopf (44 px, `aria-label`) und der Tab-Abstand beträgt 16 px. | `r3/n2-n3-axe.log`: Bei 768, 834, 900 und 1024 px gilt `scrollWidth == clientWidth`, der letzte Tab ist sichtbar. Bild: `r3/shots/de-portal--ipad.png` |
| **N3** Kontrast | **behoben.** Die Metazeile der Team-Einträge (Bezeichnung, Varianten-Chip, Datum) auf `#f4efe8` hat jetzt `ink/80`, rechnerisch 6,3:1 (vorher 4,48:1). | axe (WCAG 2.0/2.1/2.2 A+AA) auf 12 Portalseiten inkl. Login und Datenschutz: **0 Befunde** |
| N4 (zusätzlich) | Overline der Datenschutzseite lautet jetzt „Rechtliches“. | `selbst/de-portal-datenschutz--iphone.png` |
| **N5** Platzhalter Produktpass | **behoben.** Ruhige Fläche ohne Verlauf. Keine Linie läuft mehr durch den Markennamen. Ein kurzer Messingstrich steht unter der Kategorie, die Strichzeichnung klein in der Ecke. | `r3/shots/de-portal-pass-PASS-014-1--android.png` |
| **Header** in `next.config.js` (nur `headers()`) | **erledigt.** Zwei Einträge hinter dem globalen Eintrag, nach der Regel „letzter gleicher Schlüssel gewinnt“: `/de/portal/projekte/:id` bekommt `microphone=(self)`, `/api/portal/dokumente/:id((?!kalender$\|pass$)[^/]+)` bekommt `SAMEORIGIN` und `frame-ancestors 'self'`. Der globale Eintrag ist unverändert. | curl siehe unten, Unit 3 Tests, e2e 2 Tests |
| Upload: `UploadHandoff` | **erledigt.** Haarlinie auf Paper, keine Radien, keine Schatten, kein Messingbalken. Name, Props und Exporte bleiben gleich. Die Info-Kästen der Demo-Seite sind ebenfalls flach. | e2e prüft für alle Elemente der Karte: `border-radius` 0 und kein Schatten mit Versatz oder Unschärfe. Bild: `selbst/de-labs-upload-demo--desktop--full.png` |
| Upload: ungültiger Token | **erledigt.** Liefert **404** und `noindex`, mit demselben Hilfetext (Anrufen, E-Mail) über `upload/[token]/not-found.js`. Ein abgelaufener Token bleibt bei 200 + `noindex` mit „Link abgelaufen“. | curl `/de/upload/abc` → 404 mit `<meta name="robots" content="noindex">`. e2e. Bild: `selbst/de-upload-xxx…--iphone.png` |

## curl (Dev-Server :3000)

```
/de/portal/projekte/PRJ-2026-021  307  X-Frame-Options: DENY        Permissions-Policy: camera=(), microphone=(self), geolocation=(self), interest-cohort=()
/de/portal/projekte               307  DENY                          microphone=()
/de/portal, /de/portal/dokumente  307  DENY                          microphone=()
/de                               200  DENY                          microphone=()   (nosniff, HSTS, X-XSS, Referrer-Policy unverändert)
/api/portal/dokumente/DOC-1       401  X-Frame-Options: SAMEORIGIN   Content-Security-Policy: frame-ancestors 'self'
/api/portal/dokumente/kalender    401  DENY
/api/portal/dokumente/pass/…      401  DENY
```

## Prüfung

- **Portal:** `shoot-auth.mjs` mit Session aus `mint.mjs` (Kopien in `qa-screenshots/kundenportal/r3/`), 11 Seiten × 4 Geräte, alle 200, kein Überlauf. Bilder angesehen (iPad-Tabs, Produktpass, Datenschutz).
  - Die Konsolenfehler „Router action dispatched before initialization“ und „state update on a component that hasn't mounted yet“ (N7) treten auch in Berichten anderer Seiten auf (`neuauftritt/*`, `jury/*`, `concierge/*`). Sie kommen aus der Seiten-Shell bzw. dem Dev-Modus, nicht aus dem Portal.
- **`shoot.mjs` (`selbst/`):**
  - Portal (ohne Session) und Datenschutz liefern 200.
  - `/de/upload` liefert 404, das ist gewollt: Es gibt keine Indexseite, nur `/de/upload/<token>`.
  - Ungültiger Token liefert 404.
  - Die Demo liefert 200.
  - Kein Überlauf, keine fremden Fehler außer dem 404-Ressourcenfehler.
- **Unit:** `node --test tests/unit/r3-portal-upload.test.mjs tests/unit/upload.test.mjs src/lib/portal/format.test.mjs` → **25/25 grün**.
- **e2e (desktop):** `upload.spec.js` und `r3-portal-upload.spec.js`, insgesamt 17 Tests. Alle grün, wenn sie einzeln laufen. Im Gesamtlauf gibt es zwei Ausreißer, die nicht aus diesem Paket kommen:
  - Der Test „Langsamer Server“ erwartet genau 2 Anfragen, bekam 3. Die zweite Session-Anfrage brauchte unter der Last des geteilten Dev-Servers mehr als 30 s. Einzeln ist der Test grün (35 s).
  - Beim Kerntest gab es einmal `ENOENT` auf `.playwright-artifacts` im gemeinsamen Ergebnisordner, vermutlich durch einen parallelen Playwright-Lauf eines anderen Pakets. Einzeln ist er grün.
  - Die Komponente selbst ist unverändert (nur Klassen).
- **ESLint:** alle eigenen Pfade und Tests: 0 Befunde.

## Dateien

- **Geändert:**
  - `next.config.js` (nur `headers()`)
  - `src/components/Portal/Planung/{Lightbox,Thread}.js`
  - `src/components/Portal/Core/PortalNav.js`
  - `src/components/Portal/Docs/PassVisual.js`
  - `src/app/[locale]/portal/datenschutz/page.js`
  - `src/components/Upload/UploadHandoff.js`
  - `src/app/[locale]/upload/[token]/page.js`
  - `src/app/[locale]/labs/upload-demo/page.js`
  - `Marktresearch/digital/features/{kundenportal,handy-upload}.md`
- **Neu:**
  - `src/components/Upload/UploadFrame.js`
  - `src/app/[locale]/upload/[token]/not-found.js`
  - `tests/unit/r3-portal-upload.test.mjs`
  - `tests/e2e/r3-portal-upload.spec.js`
  - `qa-screenshots/kundenportal/r3/**` (Skripte, Logs, Bilder)
  - `qa-screenshots/teamleiter/r3-R3-portal-upload/selbst/**`

## Offene Punkte

1. Die Sprachaufnahme muss auf einem echten iPhone und einem echten Android-Gerät getestet werden. Der Header ist gesetzt, der Test braucht ein Gerät im LAN.
2. Der Header greift erst nach einem Neustart bzw. Build. Der Dev-Server hat `next.config.js` automatisch neu geladen. R3-release sollte die Header im Prod-Build per curl gegenprüfen.
3. A3 bis A5 aus der Abnahme bleiben unverändert offen (Datenschutz-Abschnitt und Fristen beim Inhaber, Mail-Konfiguration im Betrieb, Cookie-Banner bei R3-shell). N6 (Filter-Chips) wurde nicht bearbeitet.
4. Portal-Oberfläche und `UploadClient` haben noch Radien und Schatten aus der Zeit vor dem Neuauftritt. Kandidat für Runde 4.
5. Testdaten: Der Lauf hat keine Einträge angelegt. `probe3` öffnet und schließt nur.
