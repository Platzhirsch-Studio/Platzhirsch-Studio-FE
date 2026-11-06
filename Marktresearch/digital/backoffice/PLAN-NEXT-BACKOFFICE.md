# PLAN – Eigenes Backoffice in Next.js (Fundament, Stand 04.11.2026)

**Entscheidungen des Inhabers:** Nr. 48 (04.11.2026) „Eigenes Backoffice in Next.js, nicht Frappe; Frappe unsichtbar im Hintergrund.“ · Ergänzung: eigene Next-App auf eigenem Port, getrennt gehostet (Website, Backoffice, Frappe) · Nr. 49: ein Login für alle, danach Arbeitsplatz-Auswahl; Kassa und Packtisch sind Vollbild-Arbeitsplätze derselben Anwendung.

Vorbild Bedienung: SHD marahplus (`Backend-Import/referenz/VORBILD-SHD-sauter-held-2026-11-03.md`) – Module als Bereiche, ein Ablauf Anfrage → Projekt → Beleg → Lieferung → Service – in der Klarheit moderner Admin-Oberflächen, aber in der Platzhirsch-Gestaltung.

## 1. Was steht (Fundament)

Ordner `backoffice/` im gemeinsamen Repo, eigene Next.js-16-App (Port 3100), **keine Laufzeit-Importe aus `../src/`** (gemeinsame Helfer kopiert, Quelle im Kommentar: `frappe/http.js` ← `src/lib/api/http.js`; Session/Crypto-Muster ← `src/lib/portal/`).

```
backoffice/
  package.json  next.config.js (turbopack.root = Repo, Sicherheits-Header)  jsconfig.json  postcss.config.mjs
  .env.example (nur Namen)  playwright.config.js  eslint.config.mjs
  src/app/
    layout.js (lang=de, noindex, Fonts)   globals.css (Platzhirsch-Token kopiert, --color-bo-* hell/dunkel)
    login/  arbeitsplatz/  wechsel/  geraet/  kein-zugriff/  not-found.js  loading.js
    page.js (Zentrale)  einstellungen/  benutzer/  protokoll/
    d/[doctype]/ (generische Liste + Kanban)  d/[doctype]/[name]/ (generisches Formular, "neu")
    druck/[doctype]/[name]/ (+ /pdf im Frappe-Modus)
    [bereich]/ (Platzhalter je Bereich)  kassa/verwaltung/
    (kiosk)/kassa|packtisch|montage|technik/ (KioskShell-Platzhalter)
    api/suche  api/link  api/datei  api/ping
  src/lib/backoffice/
    config.js  bereiche.js  format.js  listen.js  validierung.js  csv.js  suche.js  dashboard.js  actions.js ("use server")
    auth/ session.js (HMAC-Cookie) store.js (Sitzungen+Geräte, In-Memory, Interface für Redis) dal.js (requireSession…) login.js rechte.js rateLimit.js geraet.js mockUsers.js
    frappe/ http.js client.js auth.js errors.js meta.js feldtypen.js index.js
    mock/ engine.js (Filter/Sortierung/Nummernkreise/Bedingungen) seed.js (Beispieldaten) client.js zusatzMeta.js
  src/components/Backoffice/ (UI-Kit, README.md)
  tests/unit/backoffice-*.test.mjs  tests/e2e/backoffice.spec.js
```

## 2. Architektur (drei Dienste)

```
 Browser (Mitarbeiter, iPad an Kassa/Packtisch)
   │ HTTPS, Cookie ph_bo_session (HttpOnly, SameSite=Lax, Secure)
   ▼
 backoffice.platzhirsch.studio ──► Next.js Backoffice :3100  (dieses Projekt)
                                    │  Server Components / Server Actions / Route Handler
                                    │  Sitzung: Cookie (HMAC) + Server-Store (Frappe-sid, lastSeen)
                                    │  Rechte: rechte.js (Matrix) + Frappe-Rechte der Benutzer-Sitzung
                                    ▼
 backend.platzhirsch.studio ──────► Frappe v15 (ph_core … ph_kundenkarte = Datenschicht)
                                    ▲  REST /api/resource, /api/method (frappe.client.*, workflow, print)
 www.platzhirsch.studio ──► Next.js Website :3000 (eigener Service-User website@…, Token)
```

- Der **Browser spricht nie direkt mit Frappe** (kein CORS nötig). Alle Aufrufe laufen serverseitig über `FrappeClient` (backofficeFetch: Timeout 8 s, Retry nur GET, Log ohne Werte).
- **Benutzeraktionen** laufen mit der Frappe-Sitzung (`sid`) des angemeldeten Mitarbeiters → Frappe-Rechte, Workflows, Versionen und Kommentare tragen seinen Namen. Das **Service-Token** `BACKOFFICE_FRAPPE_TOKEN` (Benutzer `backoffice@platzhirsch.studio`, Rolle System Manager oder enger) nur für Systemaufgaben (`backofficeService()`), nie für Benutzeraktionen.
- **Frappe-Desk** bleibt nur für Admins erreichbar; Mitarbeiter sehen ausschließlich das Next-Backoffice.
- Reverse-Proxy (nginx/Caddy): `www.` → :3000, `backoffice.` → :3100 (Basic-Auth-Vorschaltung in der Vorschauphase möglich, danach weg), `backend.` → Frappe – nur aus dem Netz von Website/Backoffice und Admin-IPs erreichbar; `X-Forwarded-For` setzen (Rate-Limit nutzt den Hash der Client-IP).

## 3. Auth-Fluss

1. `/login`: E-Mail + Passwort → Server Action `anmeldenAction` (Rate-Limit 5/10 min je IP-Hash).
2. Adapter (`auth/login.js`): **Frappe**: `POST /api/method/login` (usr/pwd) → `sid` aus `Set-Cookie`; dann `frappe.auth.get_logged_user` + `GET /api/resource/User/<name>` (roles[], full_name, enabled); Rückfall `frappe.core.doctype.user.user.get_roles`. Antwortet Frappe mit `verification` (2FA), zeigt das Formular den OTP-Schritt und ruft `login` erneut mit `tmp_id` + `otp`. **Mock**: Demo-Benutzer je Rolle (`mockUsers.js`), Passwort `BACKOFFICE_MOCK_PASSWORD` (Dev-Rückfall `demo`); in Produktion verweigert der Mock ohne gesetztes Passwort jede Anmeldung.
3. `startSession()`: `sid` (UUID) + Eintrag im Server-Store `{ frappeSid, standort, lastSeen, createdAt, idleSeconds }`; Cookie `ph_bo_session` = HMAC-signiertes JSON `{ sub, name, roles, sid, ap, iat, exp }` (Ablauf 10 h). Die Frappe-sid verlässt den Server nie.
4. Jede Seite/Action/Route: `getSession()` = Cookie prüfen (Signatur, exp) → Store-Eintrag (absolute Frist 10 h, Idle 60 min, Kiosk 15 min) → `lastSeen` aktualisieren. Ohne Secret in Produktion: fail-closed (jede Sitzung ungültig, Login-Seite erklärt es).
5. Nach dem Login: registriertes Gerät → direkt in dessen Arbeitsplatz; genau ein erlaubter Arbeitsplatz → dorthin; sonst `/arbeitsplatz` (Kacheln nach Rollen, Cookie `ph_bo_arbeitsplatz`, 1 Jahr).
6. Logout: `endSession()` → Frappe `/api/method/logout` mit der sid, Store-Eintrag löschen, Cookie leeren.
7. CSRF: Mutationen nur als Server Actions (Next prüft Origin); Route Handler mit schreibenden Methoden prüfen `Origin` gegen `Host` (`requireApiSession`).
8. **Bedienerwechsel** (`/wechsel`, Nr. 49): Benutzerliste des Standorts + PIN (4–6 Ziffern) → neue Sitzung ohne Passwort, Idle 15 min; alte Sitzung wird beendet. Mock: PIN aus `mockUsers.js`. Frappe: **PIN-Feld am Benutzer fehlt** → Anfrage an ph_core (Custom Field `User.ph_core_pin_hash`, gesetzt über eine Admin-Methode, Prüfung serverseitig; nie Klartext).
9. **Geräte** (`/geraet`): Name, Standort, Typ (Kassa/Packtisch/Mobil), Kasse (Link PH Kasse), Drucker → Token im HttpOnly-Cookie `ph_bo_geraet` (1 Jahr), Daten im Server-Store. Frappe: **DocType `PH Geraet` fehlt** → Anfrage an ph_core (Felder: name, standort, typ, kasse, drucker, token_hash, registriert_von, zuletzt_gesehen, aktiv). Schnittstelle `auth/geraet.js` (`geraetSpeichern/geraetAusCookie/geraetEntfernen`) wird dann auf den DocType umgestellt, Aufrufer bleiben.

### 3a. Microsoft-Anmeldung (Entra ID / OIDC, Nr. 52) – Stand 04.11.2026

Eigene OIDC-Umsetzung ohne Fremdpaket (`node:crypto`): `auth/oidc.js` (PKCE S256, state/nonce, Flow-Cookie, Discovery-/JWKS-Cache, Code-Tausch, Client-Assertion, id_token-Prüfung) und `auth/microsoft.js` (Konfiguration, Login-Arten, Demo-Issuer, Start/Callback, `ph_microsoft.api.sso_sitzung`).

1. **Start** `GET /auth/microsoft/start?next=…`: PKCE-Paar, `state`, `nonce` → HMAC-signiertes HttpOnly-Cookie `ph_bo_oidc` (10 min, Pfad `/auth/microsoft`, SameSite=Lax, Secure in Produktion). Endpunkte aus `https://login.microsoftonline.com/<tenant>/v2.0/.well-known/openid-configuration` (24 h Cache). Scopes `openid profile email offline_access` (+ `BACKOFFICE_MS_SCOPES`, z. B. `User.Read`), `prompt=select_account`, `response_mode=query`.
2. **Callback** `GET /auth/microsoft/callback`: Flow-Cookie sofort löschen (einmalig) → state (zeitkonstant) → Code serverseitig tauschen (Client Secret oder Zertifikat/`private_key_jwt`, nie im Browser) → id_token prüfen: RS256 über JWKS (1 h Cache, unbekannte `kid` → einmal neu laden), `iss` = Discovery-Issuer, `aud` = Client-ID, `exp`/`nbf`/`iat` (±5 min), `nonce`, `tid` = BACKOFFICE_MS_TENANT_ID. Access-/Refresh-Token werden nicht gespeichert (Exchange-Zugriffe laufen über `ph_microsoft`).
3. **Frappe-Modus**: `POST ph_microsoft.api.sso_sitzung {id_token}` → `{user, name, roles, standort, sid}`; Frappe prüft das Token selbst. Fehler: 401 `invalid_token` → „nicht bestätigt“, 403 `forbidden` → „gesperrt“, 404 `not_found` → „kein Backoffice-Zugang“.
4. **Sitzung**: `startSession()` wie beim Passwort-Login (gleiche Cookie-/Store-Struktur, Arbeitsplatz-Regel `startziel()` = `anmeldenAction`), Store zusätzlich `loginArt`. Rate-Limit nur Fehlversuche (`login:ms:<ip-hash>`, `LOGIN_RATE_LIMIT`). Fehler → `/login?ms_fehler=<code>` (nur bekannte Codes, keine Eingaben in der Seite).
5. **Abmelden**: Menü `abmeldenAction` = Backoffice + Frappe; `/login?abgemeldet=1` bietet bei `BACKOFFICE_MS_LOGOUT=1` den Link „Auch bei Microsoft abmelden“. Kombiniert: `POST /auth/microsoft/abmelden` (Origin-Prüfung) → `endSession()` → Microsoft-`end_session_endpoint` mit `post_logout_redirect_uri=<origin>/login?abgemeldet=1` (für das Benutzermenü vorgesehen, Umstellung gehört zur Shell).
6. **Mock-Modus**: „Mit Microsoft anmelden (Demo)“ → lokaler Test-Issuer (`/auth/microsoft/demo` Kontowahl, `/auth/microsoft/demo/autorisieren` Code, eigener RSA-Schlüssel je Prozess) → derselbe Callback inkl. PKCE- und Token-Prüfung; Zuordnung per E-Mail wie `mockUsers.js`. Nur wo auch der Mock-Passwort-Login ginge (Produktion nur mit BACKOFFICE_MOCK_PASSWORD).
7. **Login-Arten** `BACKOFFICE_LOGIN_ARTEN=microsoft,passwort` (Reihenfolge = Anzeige); Standard Produktion `microsoft`, sonst `microsoft,passwort`. Ohne `passwort`: Passwortformular nur als „Notfall-Anmeldung“ für `BACKOFFICE_NOTFALL_ADMINS` und nur mit Admin-Rolle (System Manager / PH Backoffice-Admin) – serverseitig in `anmelden()` erzwungen. PIN-Wechsel an Kiosk-Geräten unverändert.

**Entra-Einrichtung (IT):** App-Registrierung „Platzhirsch Backoffice“, nur dieser Mandant (Single tenant) · Plattform *Web*, Umleitungs-URI `https://backoffice.platzhirsch.studio/auth/microsoft/callback` (Entwicklung zusätzlich `http://localhost:3100/auth/microsoft/callback`) · Front-Channel-Abmelde-URL `https://backoffice.platzhirsch.studio/login?abgemeldet=1` · Geheimer Clientschlüssel oder (bevorzugt) Zertifikat hochladen, Fingerabdruck notieren · API-Berechtigungen delegiert `openid`, `profile`, `email`, `offline_access` (+ `User.Read`), Administratorzustimmung erteilen · Tokenkonfiguration: optionaler Claim `email` im ID-Token · Unternehmensanwendung: „Zuweisung erforderlich“ = Ja, Mitarbeitergruppe zuweisen · Bedingter Zugriff (MFA) für die App · Implizite Genehmigung (ID-/Access-Token) AUS lassen · Tenant-ID, Client-ID, Secret/Zertifikat an den Betrieb (nur Server-Env).

Produktion: `MemorySessionStore` durch Redis/KV mit derselben Schnittstelle ersetzen (`setSessionStore()`), sonst meldet ein Prozessneustart alle ab.

## 4. Rechte

Quelle: `Backend-Import/CONVENTIONS.md` §4/§5, `ph_core/fixtures/role.json` (29 Rollen).

| Rolle | Backoffice |
|---|---|
| System Manager / Administrator | alles |
| PH Backoffice-Admin | alle Bereiche read/write/create/delete/print/export/report + `admin` (Benutzer/Rollen, Einstellungen); kein submit/cancel/amend |
| PH Geschäftsführung | alle Bereiche lesend + print/export/report; Zentrale zusätzlich write/create (Aufgaben) |
| PH \<Bereich\> Leitung | eigener Bereich: alles inkl. delete/cancel/amend/export; Rückwärts-Workflowübergänge |
| PH \<Bereich\> Mitarbeiter | eigener Bereich: read/write/create/submit/print/report; kein delete/export |
| PH Buchhaltung extern | Faktura, Kassa: read/export/report |
| PH Montage | Projekte read/write/print, Logistik read; Arbeitsplatz Montage |
| PH Techniker | Service read/write/create/print, Projekte read; Arbeitsplatz Technik |
| PH Personal Selbstservice | Personal read/write/create (eigene Zeiten/Abwesenheiten – Filter „eigene“ baut der Personal-Agent) |
| PH Website Integration | nichts (reines API-Konto) |

Zwei Ebenen: `darf(session, bereich, aktion)` für Navigation/Seiten, `darfDoc(session, meta, aktion)` aus `meta.permissions` (die Rechte der DocType-JSON bzw. im Frappe-Modus aus getdoctype) mit Rückfall auf die Matrix. Workflow-Buttons nur, wenn `getTransitions()` sie liefert (Rolle `allowed`, Bedingung erfüllt). Im Frappe-Modus prüft der Server zusätzlich selbst.

## 5. Datenschicht

- `backoffice(session)` → `MockClient` | `FrappeClient`, identische Schnittstelle (siehe Komponenten-README). Fehlerbild `BackofficeError{code}` aus `exc_type`/HTTP-Status, Benutzertext aus `_server_messages` (JSON-in-JSON, HTML entfernt).
- **Meta**: Mock/Dev liest `../Backend-Import/**/doctype/*/*.json`, `fixtures/workflow.json`, `workflow_state.json`, `custom_field.json`, `kanban_board.json` (Cache 60 s). Frappe-Modus: **ausschließlich** vom Server (`frappe.desk.form.load.getdoctype`, Workflow-Dokumente, `has_permission`), Cache 5 min; fehlt der Meta-Ordner, bricht nichts.
- **Mock-DB**: In-Memory, 214 DocTypes bekannt, ~760 Datensätze aus Metas erzeugt + Kerndaten je Haupt-DocType (Status-Verteilung, Bezüge, Titel); Namen „Max Muster“ u. ä., E-Mails `@beispiel.invalid`, Beträge als runde Beispielwerte. Filter `= != like not like in not in > >= < <= between is`, Sortierung, Paging, Nummernkreise (`naming_series`, `format:`, `field:`, `hash`), Workflow-Übergänge aus den Fixtures (Rolle + Python-Bedingung), Versionen/Kommentare (docinfo), Konflikt über `modified`.

## 6. Env-Variablen (nur Namen)

| Name | Zweck |
|---|---|
| `BACKOFFICE_MODE` | `mock` \| `frappe` (Standard mock, solange keine URL gesetzt) |
| `BACKOFFICE_FRAPPE_URL` | Frappe-Server (gleicher wie Website), z. B. backend.platzhirsch.studio |
| `BACKOFFICE_FRAPPE_TOKEN` | Service-Token `backoffice@platzhirsch.studio` – nur Systemaufgaben |
| `BACKOFFICE_SESSION_SECRET` | HMAC-Secret ≥ 32 Zeichen, in Produktion Pflicht |
| `BACKOFFICE_MOCK_PASSWORD` | Demo-Passwort; in Produktion kein Rückfall |
| `BACKOFFICE_META_DIR` | Meta-Ordner für Mock/Dev (Standard `../Backend-Import`) |
| `BACKOFFICE_MS_TENANT_ID` | Entra-Mandanten-GUID (erlaubter Tenant, `tid`) |
| `BACKOFFICE_MS_CLIENT_ID` | Client-ID der App-Registrierung (`aud`) |
| `BACKOFFICE_MS_CLIENT_SECRET` | Geheimer Clientschlüssel – oder Zertifikat: |
| `BACKOFFICE_MS_CERT_KEY` / `BACKOFFICE_MS_CERT_KEY_FILE` / `BACKOFFICE_MS_CERT_THUMBPRINT` | Privater Schlüssel (PEM bzw. Pfad) + SHA-1-Fingerabdruck; hat Vorrang vor dem Secret |
| `BACKOFFICE_MS_REDIRECT_URI` | `https://backoffice.platzhirsch.studio/auth/microsoft/callback` |
| `BACKOFFICE_MS_SCOPES` | optional, zusätzliche Scopes (z. B. `User.Read`) |
| `BACKOFFICE_MS_LOGOUT` | optional `1`: Abmelden auch bei Microsoft |
| `BACKOFFICE_LOGIN_ARTEN` | `microsoft,passwort` (Reihenfolge = Anzeige; Produktion Standard `microsoft`) |
| `BACKOFFICE_NOTFALL_ADMINS` | E-Mail-Liste für den Notfall-Passwort-Login (nur Admin-Rollen) |

Die Website behält ihre eigenen Variablen (SERVER/Token für ihre Methoden); beide Dienste sprechen mit demselben Frappe, aber mit getrennten Service-Benutzern.

## 7. Deployment

- Eigener Dienst/Container. Dockerfile-Skizze (nicht ausgeführt): `node:24-alpine` → Repo kopieren → `npm ci` im Root → `cd backoffice && npx next build` → `next start -p 3100`. Da die Abhängigkeiten im Root-`node_modules` liegen und `turbopack.root` auf das Repo zeigt, wird das **Repo** gebaut, nicht nur der Ordner. Alternativ `output: "standalone"` in `backoffice/next.config.js` und nur `.next/standalone` ausliefern.
- PM2-Variante wie die Website (`ecosystem.config.js` um einen Prozess `platzhirsch-backoffice` erweitern, `cwd: backoffice`, `PORT`/`-p 3100`).
- Reverse-Proxy siehe §2. Session-Store in Produktion: Redis.
- Start lokal: `cd backoffice && BACKOFFICE_MODE=mock BACKOFFICE_SESSION_SECRET=<32+ Zeichen> npx next dev -p 3100` → http://localhost:3100 (Demo-Zugänge auf der Login-Seite).

## 8. Arbeitsplätze und Kiosk (Nr. 49)

- `/arbeitsplatz`: Kacheln Backoffice · Kassa (PH Kassa *) · Packtisch (PH Logistik *) · Montage (PH Montage, PH Projekte *) · Technikereinsatz (PH Techniker, PH Service *); Admin alle. Im Benutzer-Menü wechselbar.
- `KioskShell` (`components/Backoffice/Kiosk/`): ohne Seitenleiste, Kopfzeile (Arbeitsplatz, Gerät, Benutzer, Uhr, Verbindungsstatus via `/api/ping`), Touch-Ziele ≥ 48 px, Tastenkürzel-Registry (`useTastenkuerzel`), Scanner-Hook (`useScanner`: schnelle Zeichenfolge + Enter), Vollbild-Knopf (`useVollbild`), Druck-Hook (`useDruck` → heute `window.print`, später Druckdienst/ESC-POS aus ph_kassa `druck/`).
- **Offline (nur beschrieben, baut der Kassa-Agent)**: IndexedDB-Warteschlange für Belege; bei Ausfall der Signatureinheit oder Verbindung werden Belege nach RKSV-Regeln mit dem Kennzeichen „Sicherheitseinrichtung ausgefallen“ erzeugt und nach Rückkehr nachsigniert (`ph_kassa/rksv`), Bediener je Beleg aus der Kiosk-Sitzung; die Shell zeigt den Status und sperrt nichts von sich aus.

## 9. Aufgabenpakete der 11 Fachbereiche

Jeder Bereich: Ordner `src/app/<bereich>/`, `src/components/Backoffice/<Bereich>/`, `src/lib/backoffice/<bereich>/` (actions.js, kennzahlen.js, mock-Ergänzungen). Navigation in `bereiche.js` eintragen, Schnellaktionen in `suche.js`, Buttons über `WorkflowLeiste aktionen`. Pflicht je Bereich: Startseite mit Kennzahlen/Charts aus den Number Cards/Charts der App, Listen mit Filtern, Kanban, Formulare mit Buttons, Reports (`getReport` → Tabelle + Chart), Druck-Links auf die Frappe-Druckformate. Pflichtseiten (aus den README.md der Apps):

| Bereich | Pflichtseiten (Listen · Kanban · Formular-Buttons · Reports · Druck) |
|---|---|
| **CRM** (`ph_crm`) | Anfragen (Liste/Kanban, Qualifizieren, Spam, Kontakt anlegen, Termin anlegen, Folgedokument) · Kontakte (Tabs Person/Datenschutz/Intern, Verknüpfungen, DSGVO-Auskunft) · Termine (Kanban, Kalenderansicht Woche, Bestätigen/Stornieren, Terminbestätigung drucken, Verfügbarkeiten/Terminarten/Feiertage) · Beratungsgespräche (Protokoll) · Aufgaben (Kanban, Erinnerung) · Reports Anfragen je Quelle, Reaktionszeit, Konversion · 8 Kennzahlen des Workspaces |
| **Sortiment** (`ph_sortiment`) | Produkte (Liste mit Bild, Kanban Entwurf→Aktiv, Preis mit Stand, Ausführung anlegen, Website-Cache erneuern, Vorschau, Duplizieren, Ausstellungsstück) · Marken (Händlerstatus/Claims prüfen, Bildfreigabe) · Kategorien, Merkmale, Lieferanten · Herstellerbestellungen (Kanban, AB-Abgleich) · Wareneingang (Fotos) · Preislisten-Import (Hochladen, Prüfen, Übernehmen) |
| **Projekte** (`ph_projekte`) | Projekte (Kanban Phase, Auftragsmappe als eigene Seite: Phasenleiste, Belege, Zahlungsstand) · Planungen, Renderings (Kunden vorlegen, Feedback), Dokumente, Fremdgewerke, Projektaufgaben, Zeiten · Montageaufträge (Kanban, Montagebericht, Abnahme, Fotos) → Arbeitsplatz **Montage** · Produktpässe (QR, A5) · Referenzen · Reports Projektstatus, Offene Mängel, Montagekapazität, Liefertermine 30 Tage |
| **Shop** (`ph_shop`) | Bestellungen (Kanban, Zahlung erfassen, Gutschein einlösen, Abholbereit, Packen→Lieferschein, Versendet, Rechnung erstellen) · Zahlungen (Rückerstatten mit GF-Freigabe, Beleg, Auszahlung zuordnen) · Gutscheine (Einlösung, Sperren, Ersetzen, PDF) · Widerrufe/Retouren (Kanban) · Anzahlungen (Zahlungslink) · Stripe-Ereignisse/Auszahlungen (Erneut verarbeiten, Abgleichen) · Reports Umsatz je Kanal, offene Erstattungen |
| **Faktura** (`ph_faktura`) | Angebote (Kanban; Senden, Als AB übernehmen, Neue Version, Anzahlungslink) · Auftragsbestätigungen (Anzahlungs-/Teil-/Schlussrechnung, Herstellerbestellungen, Lieferschein erzeugen) · Rechnungen (Kanban; Stellen, Anzahlungen verrechnen, Zahlung erfassen, Zahlungslink, Mahnen, Gutschrift, Uneinbringlich) · Gutschriften, Mahnungen, Eingangsrechnungen (Prüfen/Freigeben/Zahllauf), Bankumsätze (Zuordnen-Dialog), Export-Läufe (Kanzlei), UVA · Reports Offene Posten (Altersstruktur), Anzahlungsstand, UVA, OSS, Nummernlücken, Umsatz nach Marke · Vertriebscockpit |
| **Logistik** (`ph_logistik`) | Lieferscheine (Kanban; Packen, Etikett erzeugen, Übergeben, Zugestellt mit Unterschrift) → Arbeitsplatz **Packtisch** (Scan → Positionen abhaken, Pakete, Etikett drucken) · Sendungen (Tracking, Retourenlabel, Problem) · Touren (Stopps, Reihenfolge, Tourenblatt, Mobil) · Lagerbestand/-bewegung (Umlagern, Reservieren, Etikett 62×29) · Inventur (Zählliste, Scan zählen, Differenzen) · Reports Versandkosten, Laufzeiten, Bestandsliste |
| **Personal** (`ph_personal`) | Stellen (Tabs DE/EN/FR/IT/Entgelt, Aushang, Website-Slug) · Bewerbungen (Kanban je Stelle, Gespräch planen, Absage/Zusage drucken, Löschfristen) · Bewerbungsgespräche · Mitarbeiter (permlevel 1 nur Leitung) · Zeiterfassung (Stempeln, Monatsübersicht) und Abwesenheiten (Urlaubskonto, Teamkalender) inkl. **Selbstservice**-Sicht (nur eigene Datensätze) · Reports Bewerbungsstatistik, Löschfristen, Monatsstunden |
| **Marketing** (`ph_marketing`) | Newsletter-Ausgaben (Kanban Entwurf→Versendet, Blöcke, Testversand, Freigabe Leitung) · Abos (DOI-Status, Abmelden), Einwilligungen (Nachweis-PDF) · Events (Kanban, Anmeldungen, Warteliste, Teilnehmerliste/Namensschilder) · Kampagnen (Kennzahlen, Bericht) · Kundenreisen (Regeln, Versandprotokoll) · Social-Beiträge (Kanban + Kalender, Claim-Guard) · Empfehlungen · Mail-Vorlagen |
| **Kassa** (`ph_kassa`) | Arbeitsplatz **/kassa** (POS, drei Spalten wie Desk-Page: Kunde/Auftrag, Positionen mit Scanner, Summe/Zahlarten mit Split, Stripe Terminal-Polling, Trainingsmodus, Bon nachdrucken, Storno Leitung, Offline-Puffer §8) · Verwaltung `/kassa/verwaltung`: Kassen, Kassenbelege, Tagesabschluss (Zählung, Differenz), Kassenbuch, DEP-Export, Terminals, Ereignisse · Druck Bon 80 mm (ESC/POS über Druckdienst), A4-Beleg, Abschlussprotokoll |
| **Service** (`ph_service`) | Servicefälle (Kanban, Tabs mit Fristen-Ampel, Einsatz planen, Ersatzteile bestellen, Kunde/Lieferant informieren, Regress, Gutschrift/Kulanz) · Serviceeinsätze (Kanban „Meine Einsätze“, Bericht mit Unterschrift) → Arbeitsplatz **Technik** · Serviceaufträge (Winterlager/Pflege, Kanban) · Ersatzteile/-bestellungen (Bewegungen, Mindestbestand) · Lieferantenregress · Pflege-Abos (Termine, Protokoll) · Reports Reklamationsquote je Marke, Fehlercode-Statistik |
| **Kundenkarte** (`ph_kundenkarte`) | Anträge (Kanban Eingegangen→Karte ausgestellt, DOI-Status, Karte ausstellen) · Karten (Stufe, Gültigkeit, Sperren, Wallet-Pass erneut senden) · Stufen/Vorteile (Stammdaten) · Einlösungen (an der Kassa: Lookup per Kartennummer/QR im Arbeitsplatz Kassa) · Kundenwert-Auswertung (nur mit Einwilligungszweck `kundenkarte_auswertung`). DocType-JSONs fehlen noch im Repo – bis dahin greifen die Platzhalter-Metas aus `mock/zusatzMeta.js`. |

Anfragen an ph_core aus diesem Fundament: DocType **PH Geraet** (§3), **PIN-Feld/-Methode am User** für den Bedienerwechsel (§3), optional eine Methode `ph_core.api.aktivitaet` (letzte Änderungen über DocTypes hinweg, statt n getList-Aufrufe) und `ph_core.api.suche` (Palette) für den Frappe-Modus.

**Anfragen an ph_core – erledigt (04.11.2026).** ph_core liefert alle vier Punkte (Backend-Import/ph_core/README.md „Backoffice-Schnittstellen“); das Backoffice ist angebunden über `backoffice/src/lib/backoffice/frappe/core.js` (Frappe) und `mock/core.js` (Mock, gleiche Antwortform), Auswahl per `phCore(modus)`:

- [x] DocType **PH Geraet** → `ph_core.api.geraete.register_device` (`registerDevice`, Benutzersitzung), `verify_device` (`verifyDevice`, Service-Token), `touch_device` (`touchDevice`, Service-Token), `list_devices` (`listDevices`, Benutzersitzung). Umgestellt: `auth/geraet.js` (Cookie `ph_bo_geraet` → verify_device, serverseitig nur Token-Hash als 60-s-Cache), `auth/dal.js` `getGeraet`/`getGeraetStatus`/`getGeraetToken`.
- [x] **PIN am User** (`ph_core_pin_hash` PBKDF2, `ph_core_standort`, `ph_core_kurzname`) → `ph_core.api.bediener.set_pin` (`setPin`), `verify_pin` (`verifyPin`, Service-Token, Sperre 5 Fehlversuche → 15 min), `list_operators` (`listOperators`). Umgestellt: `auth/login.js` `anmeldenMitPin` (jetzt auch im Frappe-Modus) und neu `bedienerListe`; Standort aus `ph_core_standort` statt `User.location` (`frappe/auth.js`).
- [x] `ph_core.api.suche.global_search` (`globalSearch`) → `suche.js` (ein Aufruf statt n getList; getList bleibt Rückfall).
- [x] `ph_core.api.aktivitaet.recent_activity` (`recentActivity`) → `dashboard.js` `aktivitaet` (je Dokument neuestes Ereignis) und `aktivitaetsStrom` (roh); Mock aus dem Änderungsprotokoll `mock/protokoll.js` (insert/save/workflowAction/Kommentare).
- Fehlerbild: ph_api-Codes 1:1 als `BackofficeError` (`phCoreFehler` in `frappe/client.js`): `invalid_pin` → code `auth` + `verbleibend`, `rate_limited` + `sekunden`, `forbidden` + `gesperrt`, `invalid_token` → `not_found`; Originalcode in `err.phCode`/`detail.phCode`. Tests: `backoffice/tests/unit/backoffice-core.test.mjs`.
- Offen für ph_core: `User.ph_core_pin_hash` ist Data auf permlevel 0 – `/api/resource/User/<selbst>` liefert den Hash an die eigene Sitzung aus (README: „verlässt den Server nie“); Vorschlag permlevel 1 oder Feldtyp Password.

## 10. Qualitätsregeln

- Jede Seite: `requireSession()`/`requireDocRecht()` zuerst; `export const dynamic = "force-dynamic"`; Fehler als `Fehler`-Komponente, nie als 500.
- Jede Server Action: Sitzung + Recht erneut prüfen, Eingaben über `validiere(meta, …)` oder zod, Ergebnis `{ ok, code, message }`.
- Keine Geheimnisse, keine Personendaten echter Personen, keine Superlative in UI-Texten; Beträge aus Cent; Datum de-AT.
- Barrierefreiheit: axe serious/critical = 0 (E2E prüft Dashboard, Liste, Formular, Kassa-Shell), Tastatur für Tabelle/Kanban/Palette, Fokusring sichtbar, Kontrast hell und dunkel.
- Tests: Unit mit `node --test` (reine Module ohne `server-only`/`@/`), E2E gegen :3100 (desktop + ipad), ESLint 0 Fehler. Keine Änderungen in `Backend-Import/` (nur lesen).
- Mock bleibt Pflicht: jede neue Seite muss im Mock-Modus laufen (Seed-Daten in `mock/seed.js` ergänzen), damit Abnahmen ohne Frappe möglich sind.
