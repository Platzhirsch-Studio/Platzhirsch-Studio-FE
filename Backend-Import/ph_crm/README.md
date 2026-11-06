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
| PH Kontakt Rolle (Kind) | Rollen eines Kontakts in Projekten (Bauherr, Architekt, Innenarchitekt, Hotelier, Bauträger …) mit Bezug (Dynamic Link) | | |
| **PH Beratungsvorlage** | Gesprächsleitfaden je Raumtyp (Küche, Wohnen, Schlafen, Bad, Outdoor/Pool, Hotelzimmer) – Fragen mit Pflichtkennzeichen | `field:vorlage_name` | aktiv |
| PH Beratungsvorlage Frage / PH Beratungsgespraech Frage (Kind) | Fragen der Vorlage / Checkliste im Protokoll (offene Pflichtfrage blockiert „Abgeschlossen“) | | |
| **PH Datenschutzanfrage** | Betroffenenanfrage Art. 15–21 DSGVO: Frist (1 Monat, verlängerbar), Identität, JSON-Export, Lösch-/Aufbewahrungsplan, Nachweis | `PH-DSA-.YYYY.-.#####` (**neu, in ph_core eintragen**) | Offen → In Arbeit → Erledigt / Abgelehnt (Buttons) |

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

### Kundenakte 360°, Dubletten, Pipeline, DSGVO (Ausbau 04.11.2026, Lückenliste 52)

- **Dubletten:** `PH Kontakt.telefon_norm` (E.164, automatisch) · `aehnliche_kontakte()` (E-Mail ohne +Zusatz, Telefon/Mobil, Nachname + PLZ, Vor- + Nachname, Firmendatensatz; Kollegen derselben Firma sind keine Dublette) · Hinweisband im Formular · `zusammenfuehren(quelle, felder)` (Leitung: Feldübernahme `utils/dubletten.feld_uebernahme`, Adressen/Rollen kopieren, `frappe.rename_doc(merge=True)` biegt alle Links aller Apps um) · `keine_dublette(anderer)` · Report **PH Kontakt Dubletten**.
- **Firma + Personen:** `firma_kontakt` (Person → Firmendatensatz), `funktion`, Kindtabelle `rollen` (Architekt/Bauherr/Hotelier …); Dashboard „Personen der Firma“.
- **Zeitleiste/Kundenakte:** `ph_crm.api.get_zeitleiste` (= `zeitleiste`) und `get_kundenakte` (= `kundenakte`) sammeln generisch jede DocType mit Link auf PH Kontakt (DocField + Custom Field, `frappe.db.exists`), Mails (Communication + Timeline-Links), Notizen, Statuswechsel und Hook-Ereignisse.
- **E-Mail Ein-/Ausgang:** `ereignisse.kommunikation_an_kontakt` verknüpft jede Mail mit Bezug auf eine DocType mit Feld `kontakt` oder mit bekannter Absender-/Empfängeradresse und setzt `letzter_kontakt`; `PH Kontakt.mail_senden` (bei Widerspruch nur vertragsbezogen).
- **Pipeline:** `PH Anfrage.wert_cent`, `wahrscheinlichkeit_prozent` (Standard je Status 10/25/40/60/100/0, manuell überschreibbar), `gewichtet_cent`, `erwarteter_abschluss`, `gewonnen_am`/`verloren_am`; Verlust mit Grund-Katalog, Details, Mitbewerber (`als_verloren`, `als_gewonnen`); Reports **PH Pipeline**, **PH Verlustgruende**.
- **Quelle/Kampagne:** UTM (`utm_source/medium/campaign/term/content`, `klick_id`) aus dem Website-Herkunftsblock oder Payload an PH Anfrage, Erstkontakt-UTM am PH Kontakt; Report **PH Anfragen nach Kampagne** (Grundlage ROI in ph_marketing, Custom Field `ph_marketing_kampagne`).
- **Wiedervorlagen/Automationen** (Schalter in PH Termin Einstellungen): R1 Wiedervorlage (Anfrage + Kontakt), R2 ruhende Anfragen (7/14/21 Tage), R3 Termin ohne Abschluss, R4 No-Show-Aufgabe, R5 Band „nächster Schritt als Aufgabe?“, R6 Vortages-Übersicht 17:00, R7 erste AB → Anfrage im Angebot gewonnen, R8 doppelte Anfrage (`duplikat_von`).
- **Termine:** `termin_vorschlagen(…, berater, thema, mail, ohne_pruefung)` mit Slot-Prüfung FOR UPDATE; **Terminserien** `serie_anlegen(intervall, anzahl|bis)` / `serie_stornieren`; Rückweg `wieder_bestaetigen` (Leitung); Website-Hinweis nach Backoffice-Umbuchung (`website_benachrichtigen` → Frappe-Webhook); `PH Termin Einstellungen.meet_verbindung_pruefen`.
- **Beratungsprotokoll:** Vorlage je Raumtyp (`vorlage_anwenden`), Pflichtfragen, `protokoll_senden(empfaenger, nachricht)` (PDF über die Mail-Warteschlange), `planung_beauftragen(planer)`.
- **DSGVO:** `datenauskunft_export` (JSON aller Apps, privat), `loeschplan` (je Vorgang löschen/anonymisieren/aufbewahren mit Frist, `utils/aufbewahrung.py`: § 132 BAO 7 Jahre ab Ende des Kalenderjahres; gebuchte Belege fremder Apps = submittable + docstatus 1), `anonymisieren` (Leitung, Tippwort ANONYMISIEREN; löscht auch Versionen, Kommentare, Papierkorb-Kopien), PH Datenschutzanfrage mit Frist und Nachweis, Task `dsgvo_fristen` (Fristwarnung, Rest-Anonymisierung nach Fristende). Druckformat **PH Kontakt Etikett** (99 × 38 mm).

- **Nachtrag 32-marktfunktionen (CRM):** Kundenakte liefert `kanaele` = Käufe (PH Bestellung, PH Kassenbeleg, PH Auftragsbestaetigung), Rechnungen, Planungen (PH Projekt, PH Planung über Projekt) und Reklamationen (PH Servicefall) je Kanal Showroom/Shop/Objekt (`utils/kanaele.py`, jede Quelle nur wenn installiert und Feld vorhanden; Beträge nur Leitung/GF/Faktura). Adressarten Liefer/Rechnung/Baustelle/Montage/Objekt. Verkaufsphase `PH Anfrage.phase` (Erstberatung → Aufmass → Planung → Angebot → Kaufvertrag) mit Pflichtfeldern je Phase und Standard-Wahrscheinlichkeit 20/35/50/60/100 %. Anonymisierung ruft zusätzlich `ph_kassa.dienste.kontakt_anonymisieren` (nur wenn ph_kassa installiert; Kassenbelege bleiben, Kontaktbezug weg).

### Hook-Vertrag Kundenakte (für alle Apps)

Registrierung in der **eigenen** `hooks.py` der Fach-App (Listen von Dotted Paths). ph_crm ruft jede Funktion in try/except auf (`kontakt360.hooks_aufrufen`, Fehler → Error Log).

| Hook | Signatur | Rückgabe |
|---|---|---|
| `ph_kontakt_zeitleiste` | `fn(kontakt, vor=None, limit=30)` | `[{zeit (ISO 8601), art, doctype, name, titel, text, app}]` – nur Ereignisse vor `vor` |
| `ph_kontakt_zeitleiste_ersetzt` | Liste von DocType-Namen | generische „angelegt/Status“-Einträge dieser DocTypes entfallen (App liefert eigene) |
| `ph_kontakt_datenauskunft` | `fn(kontakt)` | `[{abschnitt, doctype, name, daten: dict}]` |
| `ph_kontakt_anonymisieren` | `fn(kontakt, ausfuehren=False)` | `[{doctype, name, aktion (anonymisieren / aufbewahren / loeschen), grund, frist_bis}]`; bei `ausfuehren=True` führt die App ihre Zeilen selbst aus (ph_crm fasst sie dann nicht an) |
| `ph_kontakt_zusammengefuehrt` | `fn(alt, neu)` | – (nach `rename_doc(merge=True)`; alle Links zeigen schon auf `neu`) |

Ohne Hook gilt generisch: Vorgänge mit Link-Feld auf PH Kontakt erscheinen in Zeitleiste/Auskunft; beim Löschen werden gebuchte Belege (Liste `BUCHUNGSRELEVANT` oder submittable + gebucht) aufbewahrt, CRM-Vorgänge gelöscht, übrige anonymisiert (bekannte Personenfelder geleert).

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
| PH Kontakt Dubletten | Script | Paare möglicher Dubletten mit Punkten, Gründen, Vorschlag Ziel/Quelle |
| PH Pipeline | Script | offene Anfragen je Status/Zuständig/Monat/Quelle/Kampagne: Anzahl, Wert, gewichtet (Mitarbeiter: nur eigene) |
| PH Verlustgruende | Script | verlorene Anfragen je Grund oder Mitbewerber, Anteil, Wert |
| PH Anfragen nach Kampagne | Script | UTM-Kampagne/Quelle/Medium/Kanal: Anfragen, Termine, Gewonnen, Quote, Wert |

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

Kampagnenfelder: `create_termin` speichert `utm_source, utm_medium, utm_campaign, utm_term, utm_content, klick_id` (Website `withAttributionFields`, nur mit Einwilligung) in gleichnamigen Feldern an **PH Termin** (Abschnitt „Kampagne (UTM)“).

Terminarten: Die vier Website-Keys `studio`, `video`, `vor_ort`, `planung` legt `install.py` / Patch `v0_2.terminarten_website` idempotent an (Daten `ph_crm/utils/terminarten.py`: Dauer, Puffer, Anfahrt, feste Startzeiten, Wochentage 0 = Mo, Themen, Texte aus `src/lib/booking/types.js`/`copy.js`; Test `tests/test_terminarten.py` vergleicht direkt mit `types.js`). Bewusst **kein** Fixture: ein Fixture-Sync ersetzt den Datensatz samt Berater-Tabelle, sobald er im Desk geändert wurde.

Planer-Ergebnisse (Sofaplaner, Dreiländer-Rechner …; ph_projekte ist für die Website nicht freigegeben): `create_anfrage`/`create_contact` nehmen zusätzlich `planer` (`sofaplaner|dreilaender|kuechenplaner|ezarri|3d|stil-finder|yacht|bodensee-licht`, wie `src/lib/forms/beratungContext.js`), `planer_konfiguration` (JSON-Objekt ≤ 64 KB, z. B. Sofaplaner `planSchema` v2 bzw. `{land, wert, lieferart}`) und `planer_link` (https, `*.platzhirsch.studio`). Ablage: PH Anfrage `planer`, `planer_link`, `planer_konfiguration` (JSON) + privater Anhang `planer_datei` (`<planer>-<anfrage>.json`); eine Zeile „Planer: …“ im Anliegen. Fehler 400 `invalid` mit `field` (`planer`, `planer_konfiguration`, `planer_link`). Logik `utils/planer.py`.

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
- **Neu:** `"PH Datenschutzanfrage": "PH-DSA-.YYYY.-.#####"` in `NUMMERNKREISE` eintragen (bis dahin meldet check.py die Abweichung).
- Recht/Steuer vor Echtbetrieb klären: Umfang `BUCHUNGSRELEVANT` (Angebote, Lieferscheine, Geschäftsbriefe als Geschäftspapiere i. S. § 132 BAO?), Nachweisfrist Datenschutzanfragen 3 Jahre, Löschfrist für Interessenten ohne Kauf (Vorschlag 3 Jahre nach letztem Kontakt), Gewährleistungsfristen der Service-App als `frist_bis` im Hook.
- Webhook PH Termin → Website (Spec B6) ist ein Frappe-`Webhook`-Datensatz, den der Admin im Desk anlegt (Secret nur dort).
- „Projekt anlegen“ in PH Anfrage und `projekt`-Felder liefern ph_projekte als Custom Field/Client Script; `kampagne` liefert ph_marketing.
