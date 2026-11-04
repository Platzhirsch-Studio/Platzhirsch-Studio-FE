# Platzhirsch CRM (`ph_crm`) – Arbeitspaket WP2

Kontakte, Anfragen/Leads, Termine (Online-Buchung der Website mit Double-Opt-in), Beratungsgespräche, Aufgaben, Kommunikation. Frappe v15 (v16-kompatibel), benötigt `ph_core`. Enthält die **Muster-DocType „PH Anfrage“** für alle Bau-Agenten (s. CONVENTIONS.md).

## DocTypes

| DocType | Zweck | Nummer / Name | Status (Workflow) |
|---|---|---|---|
| **PH Anfrage** | Lead aller Kanäle (Kontakt, Beratung, Produkt, Gutschein, Reservierung, Ezarri, KI-Assistent); Uploads der Website (`upload_status`, `upload_note`, `upload_anzahl`) | `PH-ANF-.YYYY.-.#####` | Neu → Qualifiziert → Termin vereinbart → Angebot → Gewonnen / Verloren / Spam |
| PH Anfrage Produkt (Kind) | Merkliste | | |
| **PH Kontakt** | Person/Firma mit Adressen, Datenschutz (Widerspruch, Geburtstag nur mit Einwilligung), Portal-Zugang (Token-Hash), interne Notizen (permlevel 1) | `PH-KON-.#####` | Interessent → Kunde → Inaktiv / Gesperrt |
| PH Kontakt Adresse (Kind) | Liefer-/Rechnungs-/Objektadresse | | |
| **PH Terminart** | Buchbare Terminart der Website (`studio`, `video`, `vor_ort`, `planung`) mit Dauer, Puffer, Anfahrt, Vorlauf, festen Startzeiten, Bestätigungsart, Beratern | `field:key` | – |
| PH Terminart Berater (Kind) | Berater je Terminart (Anzeigename, Foto-URL für Website) | | |
| **PH Verfuegbarkeit** | Wochenplan je Berater (Wochentag, von–bis, Modus, Gültigkeit) | hash | – |
| **PH Termin Einstellungen** (Single) | Reservierungsdauer, Horizont, Studio-Öffnungszeiten (Rückfall), Feiertage, Erinnerung, Mail-Vorlagen, Frappe-Meet-Schalter | | |
| PH Termin Feiertag / PH Termin Oeffnungszeit (Kind) | | | |
| **PH Termin** | Beratungs-/Planungs-/Vor-Ort-/Videotermin; Website-Buchung (verify_hash, link_version, sequence, reserviert_bis) und intern | `PH-TER-.YYYY.-.#####`, Kundenreferenz `PT-XXXXXX` | Unbestaetigt → Bestaetigt → Erledigt / Nicht erschienen; → Storniert; → Abgelehnt (Leitung) |
| **PH Beratungsgespraech** | Gesprächsprotokoll: Räume/Wünsche/Budget (Cent), Stil, Zeitrahmen, nächster Schritt | `PH-BG-.YYYY.-.#####` | Offen → Planung beauftragt → Angebot → Abgeschlossen (Buttons) |
| PH Beratungsgespraech Raum (Kind) | | | |
| **PH Aufgabe** | Aufgabe mit Fälligkeit, Priorität, Dynamic Link auf den Vorgang; spiegelt Frappe-Zuweisung (ToDo) | `PH-AUF-.YYYY.-.#####` | Offen → In Arbeit → Erledigt / Verworfen (Buttons, Kanban) |

Kommunikation: Frappe `Communication` + `Email Account` (info@) – eingehende Mails an Anfrage/Termin werden zusätzlich am Kontakt in der Timeline verknüpft (`ereignisse.kommunikation_an_kontakt`). Mail-Vorlagen: `PH Termin Bestätigung`, `PH Termin Absage`, `PH Termin Erinnerung` (Fixtures).

## Abläufe

### Website-Terminbuchung (Spec `Marktresearch/digital/features/online-termin-video.md` B3–B6)

```
Website /termin                       Frappe ph_crm.api
  GET  slots          ──────────────▶ get_freie_slots(terminart, modus, von, bis, zeitzone[, berater])
  POST book           ──────────────▶ create_termin(…, verify_hash, link_version=1, kundenmail=website, idempotency_key)
                                        → SELECT … FOR UPDATE auf überlappende Termine, 409 slot_taken
                                        → PH Termin „Unbestaetigt“, reserviert_bis = +30 min
  Mail mit Bestätigungslink (Website)
  POST confirm        ──────────────▶ verify_termin(referenz, verify_hash)
                                        automatisch → Bestaetigt + Event (+ Meet-Raum, optional)
                                        manuell (Vor Ort) → bleibt Unbestaetigt, email_verifiziert=1, PH Aufgabe an Team
  POST manage         ──────────────▶ get_termin(referenz[, link_version])
  POST cancel         ──────────────▶ cancel_termin(referenz, link_version)        → Storniert, Event Cancelled
  POST reschedule     ──────────────▶ reschedule_termin(referenz, link_version, neuer_start) → link_version+1
  „Zum Gespräch“      ──────────────▶ get_meet_link(referenz, link_version)        → meet_url ab 15 min vorher
```

Slot-Regeln identisch zur Website (`src/lib/booking/slots.js`): Raster 30 min, Block = [Start − Anfahrt, Ende + Puffer], Vorlauf, Horizont, Feiertage, unbestätigte Buchungen blockieren bis `reserviert_bis`. Berater: Terminart-Berater oder alle Benutzer mit Verfügbarkeit; ohne Verfügbarkeit gelten die Studio-Öffnungszeiten als Pool. Frappe-Events (Status Open) der Berater zählen als belegt. Reine Logik in `ph_crm/utils/slots.py` (ohne Frappe testbar).

Fehlercodes (Website `CODES`/`DOMAIN`): `invalid_token` 404, `slot_taken` 409, `too_late_to_change` 409, `expired`/`verify_expired`/`cancelled` 410, `outside_window` 422, `rate_limited` 429, `invalid` 400, `unavailable` 503.

Scheduler (`ph_crm/ph_crm/tasks.py`): Erinnerung n h vorher (stündlich), Reservierungen 24 h nach Ablauf → Abgelehnt (alle 10 min), unbeantwortete Anfragen > 24 h → PH Aufgabe an Leitung (07:30 Mo–Fr), fällige Aufgaben → Benachrichtigung (07:00), Meet-Räume aufräumen (täglich).

### Anfrage → Kontakt → Termin → Gespräch → Projekt

1. Website-Formular → `create_anfrage` → PH Anfrage „Neu“ (Kanban „PH Anfragen“).
2. Buttons in PH Anfrage: **Kontakt anlegen** (findet per E-Mail oder legt PH Kontakt an), **Termin anlegen** (Dialog → PH Termin bestätigt, Anfrage → „Termin vereinbart“), **Aufgabe anlegen**, **Als Spam markieren**; „Projekt anlegen“ liefert ph_projekte als Client Script.
3. PH Termin: **Bestätigen** (Mail bei Backoffice-Terminen), **Absagen** (Dialog, Mail, Leitung: Ablehnen), **Umbuchen** (Dialog mit freien Zeiten), **Meet-Link erzeugen**, **Erledigt + Gesprächsprotokoll** (legt PH Beratungsgespraech an), **Nicht erschienen**, Kalenderansicht mit Statusfarben.
4. PH Beratungsgespraech: **Aufgabe: nächster Schritt**, **Planung beauftragen** (→ PH Projekt, wenn ph_projekte installiert), **Angebot**, **Abschließen**, **Protokoll drucken**.
5. PH Kontakt: **Portal-Zugang erzeugen/sperren/erneuern** (Token einmalig sichtbar, nur Hash gespeichert), **Als Kunde markieren** (ph_faktura ruft `als_kunde_markieren` bei der ersten AB), **Widerspruch erfassen**, **Alle Vorgänge** (Verknüpfungs-Dashboard über alle installierten Apps), **DSGVO-Auskunft** (Report + Druckformat).

## Oberfläche (Screenshots-Beschreibung für die Abnahme)

- **Workspace „PH CRM“**: oben acht Kennzahlen (Offene Anfragen, Neu ohne Reaktion, Termine heute, Unbestätigte Termine, Offene/Überfällige Aufgaben, Gewonnen Quartal, Neue Kunden Monat), darunter Schnellzugriffe (Kanban Anfragen/Termine/Aufgaben, Terminkalender, Neue Anfrage, Neuer Termin, Kontakte, Vertriebscockpit), dann sechs Charts (Anfragen je Woche, nach Art, Termine je Woche, nach Modus, Reaktionszeit je Woche, No-Show-Quote je Berater), unten fünf Karten mit Links.
- **Kanban „PH Termine“**: Spalten Unbestaetigt (orange) · Bestaetigt (grün) · Erledigt (blau) · Nicht erschienen (violett); Karten zeigen Referenz, Modus, Beginn, Berater.
- **PH Termin Formular**: Tabs „Termin“ (Kopf mit Status-Indikator, Kunde, Anliegen/Links, Bearbeitung) und „Website-Buchung“ (Double-Opt-in-Felder, Einwilligung, Technik); Kopfzeile warnt bei ablaufender Reservierung.
- **PH Kontakt Formular**: Tabs „Person“, „Datenschutz und Portal“, „Intern“; rote Kopfzeile bei Widerspruch; Verknüpfungs-Dashboard „Vertrieb · Projekte und Belege · Shop und Logistik · Service und Marketing · Aufgaben“.
- **Druck**: PH Termin Bestätigung (A4 Brief), PH Beratungsgespraech Protokoll, PH Kontakt DSGVO-Auskunft, PH Anfrage Übersicht – alle auf `ph_basis.html` (Wortmarke, Firmenblock aus PH Firma).

## Berichte

| Report | Typ | Inhalt |
|---|---|---|
| PH Anfragen nach Quelle | Script | Anfragen, Gewonnen, Quote, Ø Reaktion je Quelle/Kanal |
| PH Reaktionszeiten | Script | Ø/Median/Max Reaktionszeit je Woche/Zuständig/Quelle/Art, Ziel-Quote |
| PH Termine je Berater | Query | Termine je Berater und Modus, No-Show-Quote, Stunden |
| PH Vertriebscockpit | Script | Trichter Anfragen → Termine → Gespräche → Angebote → Aufträge je Periode; Auftragswert, offene Angebote, Anzahlungsstand aus ph_faktura (wenn installiert) |
| PH Kontakt Datenauskunft | Script | Art. 15 DSGVO: alle Daten und Vorgänge eines Kontakts |

## Rollen und Rechte

`PH CRM Mitarbeiter` (lesen, anlegen, bearbeiten; kein Löschen/Export), `PH CRM Leitung` (alles, Ablehnen/Sperren, permlevel 1), `PH Geschäftsführung` (lesen, Berichte), `PH Website Integration` (API: PH Anfrage create, PH Termin/PH Kontakt create/read/write, File create, Event create). Zusatzrechte auf Frappe-DocTypes (Event, ToDo, Communication, Email Template, File, Country) als `Custom DocPerm`-Fixture.

## Website-Umstellung (nach Installation, Staging zuerst)

| Website | heute | neu |
|---|---|---|
| `/api/kontakt` | `…kontakt_form.api.create_contact` | `ph_crm.api.create_contact` |
| `/api/beratung_anfrage`, Ezarri, KI-Assistent | `…anfrage.api.create_anfrage` | `ph_crm.api.create_anfrage` |
| `/api/anfrage_produkt` | `…anfrage_produkt.api.create_anfrage` | `ph_crm.api.create_anfrage` |
| Upload-Anhänge (`lib/upload/frappeAdapter.js`) | – | `ph_crm.api.attach_upload` (multipart `file` oder `file_url`) |
| Termine (`lib/booking/adapters/frappe.js`) | `platzhirsch_studio.termin.api.*` (Mock) | `methodBase = "ph_crm.api"`, `BOOKING_PROVIDER=frappe` |

Auth: `Authorization: token <key>:<secret>` des Benutzers `website@platzhirsch.studio`. Antwortfelder von `create_termin`/`verify_termin`/`get_termin` entsprechen `fromFrappe()` (referenz, terminart, modus in Website-Schreibweise, start/ende ISO mit Offset, status, email_verifiziert, reserviert_bis, link_version, sequence, sprache, vorname, nachname, email, meet_url, bereits_bestaetigt).

Abweichungen zur Spec: `manage_hash` wird akzeptiert, die Website arbeitet aber mit `link_version` (signierter Link auf Website-Seite) – beides wird geprüft, wenn übergeben. `get_meet_link` nimmt `link_version` statt `manage_hash`.

## Installation und Tests

```bash
bench get-app /pfad/zu/Backend-Import/ph_crm
bench --site <staging> install-app ph_crm          # legt Terminarten, Öffnungszeiten, Feiertage, Vorlagen an
bench --site <staging> run-tests --app ph_crm       # DocType-Tests inkl. Slot-Kollision, Idempotenz, verify_expired
cd Backend-Import/ph_crm && PYTHONPATH=. python -m unittest discover -s ph_crm/tests -t .   # ohne Site: Slots, Feiertage, Zeit
```

Danach im Desk: Berater-Verfügbarkeiten (PH Verfuegbarkeit) je Benutzer eintragen, Berater in PH Terminart zuordnen, `PH Termin Einstellungen` → Empfänger für Team-Aufgaben setzen; optional Meet-Site und `ph_meet_api_token` in `site_config.json`.

## Offene Punkte

- `Holiday List` gibt es ohne ERPNext nicht → eigene Feiertagstabelle in PH Termin Einstellungen (Wunsch an ph_core: gemeinsamer Feiertagskalender, s. ANFRAGEN-AN-CORE.md).
- Nummernkreise `PH-BG-` (Beratungsgespräch) und `PH-AUF-` (Aufgabe) müssen in `ph_core/utils/naming.py NUMMERNKREISE` ergänzt werden.
- Webhook PH Termin → Website (Spec B6) ist ein Frappe-`Webhook`-Datensatz, den der Admin im Desk anlegt (Secret nur dort).
- „Projekt anlegen“ in PH Anfrage und `projekt`-Felder liefern ph_projekte als Custom Field/Client Script; `kampagne` liefert ph_marketing.
