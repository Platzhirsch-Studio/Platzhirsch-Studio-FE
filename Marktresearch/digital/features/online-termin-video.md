# Online-Termin & Videoberatung über Frappe

Stand 29.10.2026 · Inhaber-Entscheidung Nr. 12 („Online-Kalender machen wir und bieten Videoberatung an – dazu das neue Frappe Webconference nehmen“).
Rollen: Frappe-Architekt + Datenschutz-Jurist (Recherche). Adressat Teil B: Frappe-Entwickler des Inhabers. Rechtstexte bleiben unverändert, der DSE-Vorschlag liegt separat in `termin-dse-vorschlag.md`.

---

## Kurzfassung

- **„Frappe Webconference“ ist Frappe Meet.** Das eigenständige Repo `frappe/meet` ist seit 28.06.2026 archiviert. Der Code lebt jetzt als Modul in **Frappe Suite** (`frappe/suite`, AGPL-3.0, Status „[WIP]“, öffentliches Release laut Keynote *angestrebt* bis Ende 2026).
- **Technisch passt Meet:** Es gibt Gastzugang ohne Login über `/meet/<raum-id>`, einen Warteraum mit Host-Freigabe (`meeting_type = "restricted"`), eine abschaltbare Aufzeichnung (`Meet Settings.enable_recording`) und optional Ende-zu-Ende-Verschlüsselung. Eine dokumentierte öffentliche REST-API gibt es nicht. Die whitelisted Python-Funktionen lassen sich aber serverseitig nutzen.
- **Nicht auf dem Produktiv-Backoffice installieren.** Suite braucht Frappe ≥ 16 und Python 3.14, verträgt sich nicht mit gleichzeitig installierten Einzel-Apps und braucht einen eigenen mediasoup-SFU-Server (Docker, UDP-Ports). Empfehlung: eigene Site, z. B. `meet.platzhirsch.studio`.
- **Terminbuchung:** Auf dem Backoffice ist **kein ERPNext installiert**. Die Lese-Probe ergab `/book_appointment` → 404 und die ERPNext-Methode → „Failed to get method“. Das ERPNext-Modul *Appointment* wäre zudem zu schmal: eine globale Dauer, keine Terminarten, keine Berater-Kalender je Typ. Frappe CRM hat keine Selbstbuchung, und Suite Calendar hat keine Buchungsseiten. → **Eigene Doctypes in der App `platzhirsch_studio`**, angelehnt an das ERPNext-Muster (Unverified → Bestätigung per Mail → Open).
- **Recht:** Rechtsgrundlage für die Videoberatung ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahme auf Anfrage). Die vom Inhaber gewünschte ausdrückliche Einwilligung zur Video-Übertragung kommt *zusätzlich* als Transparenz- und Freiwilligkeits-Schritt dazu. Keine Aufzeichnung, keine Live-Untertitel. „Ohne Auftragsverarbeiter“ gilt nur für eigene Hardware. Beim gemieteten Server bleibt der Hoster Auftragsverarbeiter (AVV nötig).

---

## Teil A – Recherche

### A1 Frappe Meet / Frappe Suite (Code-Stand `frappe/suite@2831a5d`, 29.10.2026)

| Punkt | Befund | Quelle |
|---|---|---|
| Status | `frappe/meet` archiviert am 28.06.2026: „Frappe Meet is archived and is now part of Frappe Suite.“ Suite-README: „[WIP]“. Keynote Frappeverse 2026: öffentliches Release *angestrebt* bis Jahresende, Team „noch nicht zufrieden mit dem Feinschliff“. | [frappe/meet](https://github.com/frappe/meet), [frappe/suite](https://github.com/frappe/suite), [Crator Labs Keynote-Bericht](https://www.cratorlabs.ai/blog/frappeverse-mumbai-2026-frappe-suite) |
| Umfang Suite | Drive, Writer, Sheets, Slides, **Meet**, Mail, **Calendar** in *einer* App. | Suite-README |
| Lizenz | **AGPL-3.0**. Eigennutzung ohne Änderung ist unkritisch. Wird Meet *verändert* und Dritten über das Netz angeboten, muss der geänderte Quellcode den Nutzern zugänglich sein (§ 13 AGPL). Bei einer eigenen Custom-App, die nur über die API spricht, ist das unproblematisch. | `license.txt` |
| Voraussetzungen | `pyproject.toml`: `requires-python >=3.14,<3.15`, `frappe >=16.0.0,<18.0.0`. Installation `bench get-app https://github.com/frappe/suite` → `bench new-site … --install-app suite`. Sites mit Einzel-Apps (meet/drive/…) müssen diese **deinstallieren**, bevor Suite installiert wird. | `pyproject.toml`, Suite-README |
| Medienserver | „Meet requires a separate mediasoup SFU server.“ Produktion per Docker Compose (`/opt/meet-sfu`, Install-Skript), Ports 80/443 TCP und **UDP ab 40000** (1 Port je Worker + RTC-Bereich bis +1000). Pflicht-Env: `JWT_SECRET` (= Site-Config `sfu_secret`), `WEBRTC_ANNOUNCED_IP` (öffentliche IPv4). Site-Config `sfu_server_url`. | `suite/meet/sfu-server/README.md`, `src/config.ts` |
| TURN | Meet konfiguriert **keinen TURN-Server**, und der SFU hat `enableTcp: false`, nimmt also nur UDP an. Folge: In Netzen, die UDP sperren (manche Firmen- und Hotel-WLANs), kommt kein Bild durch. Gegenmaßnahme: UDP-Ports sauber öffnen, auf der Buchungsseite einen Verbindungstest anbieten und als Rückfall das Telefon nennen. Ein eigener coturn bringt nur etwas, wenn das Frontend ihn als `iceServers` übergibt, und das ist im aktuellen Code nicht vorgesehen. | `sfu-server/src/config.ts` Z. 320 f. |
| Gastzugang | `Meet Settings.allow_guest` **und** `Meet Room.allow_guest` müssen gesetzt sein. Gast ruft `/meet/<id>` auf und gibt einen Namen ein (2–50 Zeichen). `join_meeting_as_guest` erzeugt eine Gast-„Lease“ (max. 24 h). Bei `meeting_type = "restricted"` landet der Gast im **Warteraum**, bis Host oder Co-Host ihn zulässt (Lease im Wartezustand 30 min). Rate-Limit: 10 Neu-Beitritte je IP und Stunde. | `suite/meet/api/meeting.py`, `suite/meet/guest_access.py`, `utils/user.py` |
| Raum anlegen (API) | `suite.meet.api.meeting.create(meeting_type="open"\|"restricted", allow_guest=True, title=None) → raum-id`, setzt einen eingeloggten User voraus (Raum-Eigentümer = Host). `suite.meet.api.schedule.create_scheduled_meeting(account, title, start, duration, time_zone, participants, …)` legt Raum + Kalender-Event an, braucht aber ein **JMAP-Mail-Konto** (Suite Mail/Calendar). Für uns reicht `create` mit einem technischen Host-User je Berater. | `api/meeting.py` Z. 198 ff., `api/schedule.py` |
| Rollen | Host (Raum-Eigentümer), Co-Hosts (`co_hosts`), Mitglieder, Warteraum, gesperrte Nutzer. Host-Moderation, `host_only_chat`. | `meet_room.json` |
| Aufzeichnung | Vorhanden: Komposit-Video in Drive, max. 4 h. Der „Recording Notice“ ist laut Doku ausdrücklich **keine Einwilligung**. Abschaltbar global über `Meet Settings.enable_recording`. | `suite/meet/CONTEXT.md`, `meet_settings.json` |
| E2EE | Raum-Option `e2ee_enabled` (Insertable Streams bzw. `RTCRtpScriptTransform`). Gast-Tauglichkeit von E2EE vor Livegang im Test prüfen, sie ist nicht dokumentiert. | `frontend/src/apps/meet/utils/media/e2ee.ts` |
| Untertitel | Live-Captions brauchen einen eigenen NVIDIA-ASR-Server (`STT_SERVER_URL`) und verarbeiten Sprache. → **aus lassen**. | SFU-README |
| Browser | WebRTC im Browser, keine App-Installation. README nennt keine Mindestversionen. Praxis: aktuelle Chrome/Edge/Firefox/Safari (iOS ≥ 16 wegen Simulcast/SVC) vor Livegang auf iPhone, Android und Desktop testen. | eigene Einschätzung, im Test zu belegen |
| Kalender in Suite | Suite Calendar läuft über **JMAP** (eigener Mailserver nötig). Es gibt **keine** öffentlichen Buchungsseiten oder Verfügbarkeits-APIs. | Suite-README, `suite/calendar/api` |

### A2 Terminbuchung in Frappe / ERPNext / Frappe CRM

| System | Befund | Quelle |
|---|---|---|
| Backoffice heute | Nur Frappe + Custom-App `platzhirsch_studio` (Doctype `Anfrage`). ERPNext nicht installiert: `/book_appointment` 404, `erpnext.www.book_appointment…` → „Failed to get method“. Reine GET-Probe, nichts gesendet. | Probe 29.10.2026 |
| ERPNext *Appointment* | Felder `customer_name`, `customer_email`, `customer_phone_number`, `customer_details`, `scheduled_time`, `status` (Open/Unverified/Closed), `calendar_event` (→ Event), `appointment_with`/`party` (Lead/Customer), `email_verified`, `verification_token` (nur SHA-256 gespeichert). Portal-Buchung startet „Unverified“, Mail-Link `/book_appointment/verify?key=…`, erst dann Open, Berater-Zuweisung nach Auslastung und Event-Anlage. | [appointment.json](https://raw.githubusercontent.com/frappe/erpnext/develop/erpnext/crm/doctype/appointment/appointment.json), [appointment.py](https://raw.githubusercontent.com/frappe/erpnext/develop/erpnext/crm/doctype/appointment/appointment.py) |
| *Appointment Booking Settings* | **Eine** globale `appointment_duration`, Wochenfenster `availability_of_slots`, `holiday_list`, `number_of_agents`, `agent_list`, `advance_booking_days`. Gast-APIs `get_appointment_slots(date, timezone)` (60/min) und `create_appointment(date, time, tz, contact)` (5 je 5 min). → Keine Terminarten, keine Dauer je Typ, keine Berater-Wahl. | [book_appointment/index.py](https://raw.githubusercontent.com/frappe/erpnext/develop/erpnext/www/book_appointment/index.py) |
| Frappe CRM | Keine native Selbstbuchung. Events lassen sich an Leads und Deals hängen. | [Frappe-Forum](https://discuss.frappe.io/t/frappe-crm-appointments-scheduling-and-viewing/157956) |
| Google Calendar | Im Frappe-Kern (`Google Calendar`-Doctype): **Zwei-Wege-Sync** des `Event`-Doctypes (Pull/Push getrennt schaltbar). Optional `add_video_conferencing` erzeugt Google-Meet-Links, **für uns aus**, weil wir Frappe Meet nehmen. | [google_calendar.py](https://raw.githubusercontent.com/frappe/frappe/develop/frappe/integrations/doctype/google_calendar/google_calendar.py) |
| Outlook / Microsoft 365 | Kein nativer Sync im Frappe-Kern. Pragmatisch: Buchungsmail mit `.ics` (RFC 5545, `METHOD:REQUEST`) an Kunde und Berater. Belegt-Zeiten der Berater kommen über Frappe-`Event` (Google-Sync) oder einen Graph-Abgleich als spätere Ausbaustufe. | eigene Einschätzung |

**Folgerung:** Eigene schlanke Doctypes `PH Terminart`, `PH Berater-Verfügbarkeit`, `PH Termin` in `platzhirsch_studio`. Das Statusmodell und das Token-Hashing übernehmen wir von ERPNext. Belegte Zeiten liest das System aus `PH Termin` und `Event` (Google-Sync).

### A3 Rechtliches AT / DE / CH (keine Rechtsberatung – Vorschlag an die Kanzlei)

1. **Rechtsgrundlage (AT/DE, DSGVO):** Die Kundin bucht die Beratung selbst → Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahme). Die DSK-Checkliste nennt lit. a, b, e oder f als mögliche Grundlagen, und eine Einwilligung muss informiert und freiwillig sein ([DSK-Checkliste OH Videokonferenzsysteme, 23.10.2020](https://www.datenschutzkonferenz-online.de/media/oh/20201111_checkliste_oh_videokonferenzsysteme.pdf), [DSK-Pressemitteilung](https://www.datenschutzkonferenz-online.de/media/pm/20201113_pm_oh_videokonferenzsysteme.pdf)). **Inhaber-Vorgabe „nur mit Einwilligung“** umsetzen als Pflicht-Checkbox vor der Video-Buchung: „Ich bin einverstanden, dass Bild und Ton für die Dauer des Gesprächs live übertragen werden. Es wird nichts aufgezeichnet.“ Kamera bleibt freiwillig, Ton allein oder Telefon ist immer möglich (Freiwilligkeit, Art. 7 Abs. 4).
2. **Keine Aufzeichnung, keine Untertitel, kein Chat-Export** (Datenminimierung, Art. 5 Abs. 1 lit. c, Art. 25). Global `enable_recording = 0`, STT nicht konfigurieren. Bildschirmfreigabe nur durch das Team, für Pläne und Renderings.
3. **Self-Hosting:** Wenn Website und Frappe Meet auf eigenen Servern laufen, braucht es keinen Videodienst als Auftragsverarbeiter und keine Drittland-Übermittlung (kein Zoom/Teams). Der **Server-Hoster bleibt Auftragsverarbeiter** (Art. 28) → AVV mit dem Hoster, EU-Standort. Keine Google-STUN- oder TURN-Server einbinden.
4. **Speicherdauer (Vorschlag):** Termin-Datensatz bis 6 Monate nach Termin, sofern kein Auftrag folgt. Meet-Raum nach dem Termin löschen. Gast-Lease verfällt technisch nach max. 24 h.
5. **AT-Besonderheiten:** DSG 2018 ergänzt die DSGVO, keine abweichende Rechtsgrundlage. Kamerazugriff erfolgt über die Browser-Berechtigung, kein Cookie. § 165 TKG 2021 betrifft nur Speicherzugriffe. Ein technisch nötiger Sitzungswert für den Gast ist zulässig.
6. **CH (revDSG seit 01.09.2023):** keine generelle Einwilligungspflicht, aber Informationspflicht (Art. 19 revDSG). Die Server-Location EU gilt als angemessen (Bundesrat-Liste). Die DSE-Ergänzung deckt das mit ab.
7. **E-Mail-Erinnerung:** Erinnerung vor dem Termin ist Vertragskommunikation, keine Werbung. Kein Newsletter-Opt-in koppeln.

DSE-Textvorschlag → `Marktresearch/digital/features/termin-dse-vorschlag.md` (separat, zur Freigabe durch die Kanzlei).

---

## Teil B – Schnittstellen-Spezifikation (Website ↔ Frappe)

### B1 Architektur

```
Browser ──► Next.js /[locale]/termin  ──► /api/termin/* (Route Handler, Node)
                                            │  API-Key nur hier (env), nie im Client
                                            ▼
                 backoffice.platzhirsch.studio  (App platzhirsch_studio: PH Termin …)
                                            │  serverseitig, technischer User
                                            ▼
                 meet.platzhirsch.studio  (eigene Site mit Frappe Suite/Meet + SFU)
```

- Die Website ruft **nur** das Backoffice auf. Das Backoffice legt den Meet-Raum auf der Meet-Site an, mit Token eines technischen Host-Users je Berater. Der Meet-API-Key liegt nur im Backoffice.
- Website-Env (Vorschlag): `BOOKING_PROVIDER=frappe` (neuer Wert neben `none|link`), `BOOKING_FRAPPE_URL`, `BOOKING_FRAPPE_KEY`, `BOOKING_FRAPPE_SECRET`, `BOOKING_LINK_SECRET` (Signatur Storno/Umbuchen), `BOOKING_WEBHOOK_SECRET`.
- Auth Website → Frappe: `Authorization: token <api_key>:<api_secret>` eines **eigenen API-Users „website-termin“** mit Rolle nur auf `PH Termin` (create/read eigener Datensätze) und Lesen von `PH Terminart` und `PH Berater-Verfügbarkeit`.
- Ohne Konfiguration läuft die Website im **Mock-Modus** (`BOOKING_PROVIDER=mock`, nur außerhalb von production): Slots aus einer lokalen Fixture, Mails in den bestehenden Dev-Postausgang.

### B2 Doctypes (App `platzhirsch_studio`)

**PH Terminart** (`name` = Schlüssel)

| Feld | Typ | Bemerkung |
|---|---|---|
| `key` | Data, unique | `studio`, `video`, `vor_ort`, `planung_kueche`, `planung_sofa`, `planung_ezarri`, `planung_yacht`, `planung_hotel` |
| `titel_de/en/fr/it` | Data | Anzeige-Titel |
| `modus` | Select | `studio` \| `video` \| `vor_ort` |
| `dauer_min` | Int | z. B. Studio 60, Video 45, Planung 90 |
| `puffer_min` | Int | Puffer nach dem Termin |
| `vorlauf_std` | Int | frühester Termin ab jetzt (z. B. 24) |
| `horizont_tage` | Int | buchbar bis (z. B. 60) |
| `bestaetigung` | Select | `sofort` (Studio, Video, Planung) \| `anfrage` (Vor Ort: Team bestätigt) |
| `berater` | Table MultiSelect → User | wer diese Art anbietet |
| `aktiv` | Check | |

**PH Berater-Verfügbarkeit**: `berater` (User), `wochentag`, `von`, `bis`, `ort` (`studio`/`remote`), plus Ausnahmen über Holiday List oder Frappe-`Event` mit `Busy`.

**PH Termin**

| Feld | Typ | Bemerkung |
|---|---|---|
| `referenz` | Data, unique | `PT-XXXXXX` (wie `AG-…` im Agenten-Modul) |
| `terminart` | Link PH Terminart | |
| `berater` | Link User | vom Kunden gewählt oder automatisch (geringste Auslastung) |
| `start` / `ende` | Datetime (UTC) + `zeitzone` (Data) | |
| `status` | Select | `Unbestaetigt` → `Bestaetigt` → `Erledigt` / `Storniert` / `Abgelehnt` (nur Vor-Ort-Anfrage) |
| `vorname`, `nachname`, `email`, `telefon` | Data | Telefon nur Pflicht bei Vor Ort |
| `plz_ort` | Data | nur Vor Ort |
| `anliegen` | Small Text, ≤ 1000 Zeichen | optional |
| `sprache` | Select de/en/fr/it | |
| `einwilligung_video` | Check + `einwilligung_zeit` (Datetime) + `einwilligung_text_version` | Pflicht bei `modus=video` |
| `verify_hash`, `manage_hash` | Data | nur SHA-256 der Tokens |
| `meet_raum_id`, `meet_url` | Data | nur Video, erst nach Bestätigung |
| `event` | Link Event | für Google-Sync des Beraters |
| `anfrage` | Link Anfrage | optional, Verknüpfung zum bestehenden Lead |
| `quelle` | Data | `website` \| `agent` \| `mcp` (wie `HERKUNFT_TITLE`) |

### B3 Endpunkte im Backoffice (`/api/method/platzhirsch_studio.termin.api.<name>`)

Alle **nur mit API-Token**, kein `allow_guest`. Zeiten ISO 8601 mit Offset. Antworten `{"message": …}` (Frappe-Standard).

| # | Methode | HTTP | Parameter | Antwort |
|---|---|---|---|---|
| 1 | `get_terminarten` | GET | `sprache` | `[{key, titel, modus, dauer_min, bestaetigung, berater:[{id, vorname, foto_url?}]}]` |
| 2 | `get_freie_slots` | GET | `terminart`, `von` (Datum), `bis` (≤ 14 Tage), `berater?`, `zeitzone` | `[{start, ende, berater:[id…]}]`. Abzüglich `PH Termin` (≠ Storniert/Abgelehnt, inkl. Unbestaetigt < 30 min als Reservierung), Frappe-`Event` Busy, Holiday List, Puffer, Vorlauf |
| 3 | `create_termin` | POST | `terminart`, `start`, `berater?`, `zeitzone`, Kontaktfelder, `anliegen?`, `sprache`, `einwilligung_video?`, `einwilligung_text_version`, `verify_hash`, `manage_hash`, `quelle`, `idempotency_key` | `{referenz, status:"Unbestaetigt", reserviert_bis}`. **409** `slot_taken`, falls inzwischen belegt (Prüfung in DB-Transaktion mit `SELECT … FOR UPDATE` auf Berater+Zeitraum). Bei identischem `idempotency_key` dieselbe Antwort |
| 4 | `verify_termin` | POST | `referenz`, `verify_hash` | Studio/Video/Planung → `Bestaetigt`, legt `Event` an, bei Video Meet-Raum (B4). Vor Ort → bleibt `Unbestaetigt (Anfrage)`, Team-ToDo. Antwort `{status, start, ende, terminart, meet_url?}` |
| 5 | `get_termin` | GET | `referenz`, `manage_hash` | Zusammenfassung ohne Telefon/Mail im Klartext (maskiert) |
| 6 | `cancel_termin` | POST | `referenz`, `manage_hash`, `grund?` | `Storniert`, Event absagen, Meet-Raum löschen. Bis Termin-Start erlaubt |
| 7 | `reschedule_termin` | POST | `referenz`, `manage_hash`, `neuer_start`, `berater?` | atomar: neuer Slot prüfen → Zeit ändern, Event verschieben. Meet-Raum bleibt. Danach neuer `manage_hash` (alter Link ungültig) |
| 8 | `get_meet_link` | POST | `referenz`, `manage_hash` | `meet_url` erst ab 15 min vor Start, sonst `{verfuegbar_ab}` |

Rate-Limits zusätzlich zur Website: `create_termin` 5 je 5 min je E-Mail-Hash, `get_freie_slots` 60/min.

### B4 Meet-Raum erzeugen (im Backoffice, nicht von der Website)

1. Bei `verify_termin` für `modus=video`: Aufruf der Meet-Site `POST https://meet.platzhirsch.studio/api/method/suite.meet.api.meeting.create` mit `meeting_type=restricted`, `allow_guest=1`, `title="Platzhirsch Beratung PT-XXXXXX"` (**kein Kundenname im Titel**: Der Titel ist für Gäste öffentlich über `get_public_meeting_preview` lesbar). Auth: API-Token des technischen Host-Users des Beraters.
2. `meet_url = https://meet.platzhirsch.studio/meet/<id>` in `PH Termin` speichern. Den Link bekommt die Kundin erst über `get_meet_link` bzw. die Erinnerungsmail und die Seite „Zum Gespräch“.
3. Berater ist Host. Die Kundin tritt als Gast mit Vornamen bei und landet im **Warteraum**, der Berater lässt sie zu.
4. Nach `ende + 2 h` oder bei Storno: Raum löschen (`frappe.delete_doc("Meet Room", id)` per Job).
5. Meet-Site-Einstellungen: `allow_guest=1`, `enable_recording=0`, keine `STT_SERVER_URL`. `e2ee_enabled` erst nach Gast-Test aktivieren.

### B5 Signierte Links (Website-Seite, `src/lib/booking`)

- Die Website erzeugt zwei Zufalls-Tokens (32 Byte, base64url) und sendet ans Backoffice **nur deren SHA-256** (`verify_hash`, `manage_hash`).
- Bestätigungslink `/{locale}/termin/bestaetigen#<referenz>.<verify_token>` (TTL 30 min, danach gibt der Slot frei).
- Verwaltungslink `/{locale}/termin/verwalten#<referenz>.<manage_token>` für Storno, Umbuchen und den Gesprächslink.
- Token im **URL-Fragment** (wie `seal.js` im Agenten-Modul), so landet nichts in Zugriffs-Logs. Die Seite schickt den Token per POST an `/api/termin/*`. `Referrer-Policy: no-referrer` auf diesen Seiten. Die Same-Origin-Prüfung über `Sec-Fetch-Site` funktioniert wie im Portal-Fix (`src/lib/portal/http.js`).
- Website-Routen: `GET /api/termin/arten`, `GET /api/termin/slots`, `POST /api/termin/buchen`, `POST /api/termin/bestaetigen`, `POST /api/termin/verwalten` (`action: get|cancel|reschedule|meet`), `POST /api/termin/webhook`.

### B6 Benachrichtigung: Webhook statt Polling

- Frappe-**Webhook** (Kern-Doctype `Webhook`) auf `PH Termin` bei `on_update` (Statuswechsel durch das Team: Vor-Ort bestätigt/abgelehnt, Storno durch Team) → `POST https://www.platzhirsch.studio/api/termin/webhook`. Header `X-Frappe-Webhook-Signature` (HMAC-SHA256 über den Body mit `BOOKING_WEBHOOK_SECRET`, Frappe-Standard „Webhook Secret“). Body nur `{referenz, status, start, ende, terminart, sprache}`, **keine Kontaktdaten**.
- Die Website versendet daraufhin die Mail (Bestätigung, Absage) über den bestehenden Mailer. Alternativ versendet Frappe selbst, das ist eine Entscheidung des Entwicklers. Wichtig: nur **ein** Absender pro Mailtyp.
- Erinnerungsmail 24 h und 1 h vorher: Frappe-Scheduler (`hourly`), mit `.ics` im Anhang.
- Polling nur als Rückfall: Die Verwaltungsseite liest den Status bei jedem Aufruf live über `get_termin`.

### B7 Terminarten (Vorschlag Erstbefüllung)

| key | Modus | Dauer | Bestätigung | Hinweis |
|---|---|---|---|---|
| `studio` | Studio Lochau, Landstraße 11 | 60 min | sofort | „mit Kaffee aus unserem Café“ |
| `video` | Videoberatung (Frappe Meet) | 45 min | sofort | Einwilligung Pflicht, Telefon als Alternative |
| `vor_ort` | Bei Ihnen vor Ort | 90 min | **Anfrage** | Team bestätigt Termin und Anfahrt. Telefon + PLZ/Ort Pflicht |
| `planung_kueche` | Studio oder Video | 90 min | sofort | |
| `planung_sofa` | Studio oder Video | 60 min | sofort | |
| `planung_ezarri` | Studio oder Video | 60 min | sofort | Pool/Mosaik |
| `planung_yacht` | Video oder vor Ort | 60 min | Anfrage | |
| `planung_hotel` | Video oder vor Ort | 60 min | Anfrage | Contract/FF&E |

Planungstermine mit zwei Modi: Bei der Auswahl wählt die Kundin den Modus, und das Backoffice behandelt sie als zwei Datensätze (`planung_kueche_studio`, `planung_kueche_video`) oder bekommt `modus` als Parameter. Entscheidung des Entwicklers, die Website kann beides.

### B8 Fehlercodes (Website erwartet)

`slot_taken` (409), `outside_window` (422), `invalid_token` (403), `expired` (410), `too_late_to_change` (409), `rate_limited` (429), `not_configured` (503 → Website zeigt das Anfrageformular `/beratung`).

---

## Teil C – Schritte für den Inhaber

1. **Frappe-Entwickler beauftragen** mit Teil B (Doctypes, 8 Methoden, Webhook, Scheduler). API-User „website-termin“ anlegen, Key + Secret **nur** in die Server-Env der Website eintragen.
2. **Eigenen Server für Meet** bereitstellen (EU-Rechenzentrum, AVV mit Hoster), Subdomain `meet.platzhirsch.studio` + öffentliche IPv4, Firewall UDP 40000 ff. öffnen. Frappe 16 + Python 3.14 + Suite installieren und den SFU per Docker-Skript einrichten. **Nicht** auf dem Produktiv-Backoffice. Weil Suite „WIP“ ist, eine Version festschreiben und Updates erst nach einem Test einspielen.
3. **Meet-Einstellungen:** Gäste erlauben, Aufzeichnung aus, keine Untertitel. Pro Berater einen Meet-User anlegen.
4. **Verfügbarkeiten** je Berater und Terminarten im Backoffice pflegen, optional den Google-Calendar-Sync der Berater aktivieren (ohne „Video Conferencing“).
5. **Test vor Livegang:** iPhone (Safari), Android (Chrome), Windows/Mac (Chrome, Edge, Firefox), dazu ein Firmen-WLAN. Warteraum, Bildschirmfreigabe und Ton prüfen. Bei UDP-Sperre den Rückfall auf das Telefon prüfen.
6. **Kanzlei:** DSE-Ergänzung aus `termin-dse-vorschlag.md` und den Einwilligungstext für die Videoberatung freigeben lassen.
7. **Livegang:** `BOOKING_PROVIDER=frappe` setzen. Bis dahin läuft die Website mit Mock (Dev) bzw. `none` (Produktion → Anfrageformular).

Offene Entscheidungen: Berater-Liste und Fotos, Öffnungszeiten der Videoberatung, ob Kundinnen den Berater wählen dürfen, Storno-Frist (Vorschlag: bis Terminbeginn, Vor Ort bis 24 h vorher).
