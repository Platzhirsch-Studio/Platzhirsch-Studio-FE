# Platzhirsch Marketing (`ph_marketing`) – WP9

Newsletter mit Double-Opt-in, Einwilligungs-Protokoll, Kundenreisen (einfache Automation), Empfehlungsprogramm, Kampagnen, Events (Adventsabend), Social-Planung mit Bildrechte-Prüfung, Besucher-Einblicke. Voraussetzungen: `frappe`, `ph_core`, `ph_crm` (Reihenfolge `../README.md`). Regeln: `../CONVENTIONS.md`, Plan: `../PLAN.md` WP9.

**Nichts hiervon ist installiert.** Staging zuerst, nie das produktive Backoffice. Es werden keine echten Mails versendet: `PH Einstellungen.testmodus` (ph_core) leitet alles an das Team-Postfach um.

## Bausteine

| DocType | Zweck | Datei |
|---|---|---|
| PH Newsletter Abo (32 Felder) | Abo je Adresse, Status nur über Server-Methoden: `Angemeldet unbestaetigt → Aktiv` (DOI) → `Abgemeldet / Bounce / Beschwerde`; Interessen (Table MultiSelect), Quelle, Sprache, Token-Hashes | `doctype/ph_newsletter_abo/` |
| PH Einwilligung (34) | Consent-Protokoll je Zweck (newsletter, einladungen, merkliste_/planer_erinnerung, rueckmeldung = Bewertungen, pflege_nachkauf, whatsapp, foto_referenz): Zeitpunkt, Textversion, Kanal, Quelle, DOI-Zeit, Widerruf (Kanal, Grund, Beleg). Nachweisfelder nachträglich unveränderlich | `doctype/ph_einwilligung/` |
| PH Interesse (4) + PH Newsletter Abo Interesse (1) | Stammdaten für Interessen | |
| PH Mail Vorlage (13) | Jinja-Vorlagen (Kundenreise, System, Event, Newsletter), Fußzeile A/B/V/S | `doctype/ph_mail_vorlage/`, HTML in `templates/emails/` |
| PH Kundenreise (32) + PH Reise Trigger (6) + PH Reise Versand (16) | Regel „Auslöser → Wartezeit → Vorlage“ mit Rechtsgrundlage V/B/E (`utils/regeln.py` = Spiegel von `rechtsgrundlagen.js`), Versandprotokoll gegen Doppelversand | `doctype/ph_kundenreise/`, `ph_marketing/engine.py` |
| PH Empfehlung (22) | „Unter Freunden“, Code EMP-XXXXXX, Rücktrittsfrist, Gutschein aus ph_shop | `doctype/ph_empfehlung/` |
| PH Kampagne (36) + PH Kampagne Kennzahl (6) | Kanal, Zeitraum, Budget/Ausgaben in Cent, Ziel, UTM, Kennzahlen, Auswertung (Anfragen aus `PH Anfrage.ph_marketing_kampagne`) | `doctype/ph_kampagne/` |
| PH Newsletter Ausgabe (35) + PH Newsletter Block (13) + PH Newsletter Versand (9) | „Post aus Lochau“: Blöcke nur mit echtem Inhalt und eigenen Bildern (`newsletter.js`-Regeln), Zielgruppe, Versandzeitpunkt, Protokoll je Empfänger | `doctype/ph_newsletter_ausgabe/`, `ph_marketing/newsletter.py` |
| PH Event (39) + PH Event Anmeldung (16) | Adventsabend u. a.: Datum, Plätze, Warteliste, Anmeldungen, Bestätigungs-/Erinnerungsmail, Löschfrist 3 Monate | `doctype/ph_event/`, `ph_marketing/events.py` |
| PH Social Beitrag (47) | Pinterest/Instagram-Plan, Claim-Guard (Bildquelle eigen / Hersteller freigegeben / offen), Freigabe-Referenz auf `PH Marke` (ph_sortiment) per Dynamic Link | `doctype/ph_social_beitrag/` |
| PH Einblick Tag (15) | Tagesaggregat der Besucher-Einblicke (Upsert je Teil ≤ 1 MB) | `doctype/ph_einblick_tag/`, `ph_marketing/einblicke.py` |
| PH Marketing Einstellungen (Single, 58) | Automatik-Schalter, Kanzlei-Freigaben, Versandweg (Frappe Email Queue / Resend – nur Schlüssel-**Namen**), DOI-Fristen, Datenquelle Aufträge, Empfehlung, Event-Fristen | `doctype/ph_marketing_einstellungen/` |

Workflows (`fixtures/workflow*.json`): **PH Newsletter Ausgabe** Entwurf → Freigabe → Geplant (Leitung, nur versandbereit + Zeitpunkt) → Wird versendet → Versendet / Abgebrochen · **PH Event** Geplant → Offen (Leitung, nur mit Uhrzeit) → Ausgebucht ↔ Offen → Durchgeführt / Abgesagt · **PH Kampagne** Entwurf → Aktiv ↔ Pausiert → Beendet · **PH Social Beitrag** Idee → Entwurf → Freigegeben (Leitung, Bedingung Bildquelle ≠ offen) → Geplant → Veröffentlicht / Verworfen.
Kanban: PH Social Beiträge, PH Kampagnen, PH Events; Kalenderansicht Social-Beiträge. Print Formats: PH Event Teilnehmerliste, PH Event Namensschilder (85 × 54 mm), PH Einwilligung Nachweis, PH Kampagnenbericht. Charts: Abos je Woche, Abos nach Quelle, Einwilligungen nach Zweck, Beiträge je Kanal, Abmeldungen je Monat. Number Cards: Aktive Abos, Unbestätigt > 48 h, DOI-Quote 30 Tage, Aktive Kampagnen, Event-Anmeldungen, Beiträge diese Woche. Reports: PH Newsletter-Entwicklung (Abos je Monat/Quelle, DOI-Quote, Abmeldungen), PH Kampagnen-ROI, PH Einwilligungen nach Zweck, PH Event-Auslastung, PH Social Redaktionsplan, PH Top-Seiten (Einblicke). Workspace „PH Marketing“ (sequence 9).

## Website-API (`ph_marketing.api`, Token des Benutzers `website@platzhirsch.studio`)

| Methode | Parameter | Antwort | Ersetzt |
|---|---|---|---|
| `subscribe_newsletter` | `email` (+ optional `sprache`, `interessen`, `textversion`, `quelle`, `name`, `idempotency_key`) | `{success: true, doi}` – **neutral auch bei Duplikat** | `newsletter_website.api.subscribe_newsletter` (`src/lib/forms/newsletter.js`) |
| `confirm_newsletter` | `token` | `{status: bestaetigt \| bereits_bestaetigt}`; 404 `invalid_token`, 410 `expired` | neu (DOI) |
| `unsubscribe` | `token` oder `email` | `{status: abgemeldet \| bereits_abgemeldet}` | neu |
| `register_event` | `event_id, name, email, personen, telefon?, nachricht?, textversion?` | `{success, status: angemeldet \| warteliste, plaetze_frei, email (maskiert)}`; 409 `conflict` wenn voll ohne Warteliste | Adventsabend-Formular über `/api/kontakt` |
| `cancel_event_registration` | `token` | `{status: abgesagt}` | neu |
| `get_event` | `event_id` | Eckdaten ohne Teilnehmerdaten | `event.js`-Konstanten |
| `record_consent` / `confirm_consent` | `email, zweck, textversion, quelle?, daten?` | `{success, doi, einwilligung}` | neu (Foto-Referenz, WhatsApp, Merkliste, Planer, Rückmeldung) |
| `tag_speichern` | `datum, schema, meta, teil?, seiten/heatmaps/pfade/signale/planer` | `{datum, teile, status}` | `platzhirsch_einblicke.api.tag_speichern` (`src/lib/einblicke/frappe.server.js`) |

Links in Mails zeigen auf Website-Seiten (`PH Marketing Einstellungen.bestaetigen_pfad` = `/de/newsletter/bestaetigen?token=…`, `abmelden_pfad`, Event-Absage `/de/adventsabend/absagen?token=…`); die Website ruft von dort die API auf (nie `allow_guest`).

## DOI und Datenschutz

- Token: `secrets.token_urlsafe(32)`, gespeichert nur als SHA-256 (`utils/token.py`); Link 48 h gültig (einstellbar), eine Erinnerung nach 24 h, danach keine weitere Mail; innerhalb einer Stunde keine zweite DOI-Mail (kein Mail-Bombing).
- Unbestätigte Abos samt offener Einwilligung werden nach **30 Tagen gelöscht** (`tasks.doi_aufraeumen`, 03:30); offene Einwilligungen anderer Zwecke → Status „Abgelaufen“.
- IP-frei: `ip_hash` nur, wenn `ip_hash_speichern` aktiv (Standard aus). Kein Tracking-Pixel, keine Öffnungsraten; Messung nur über UTM.
- Nachweis: jede Einwilligung mit Zweck, Textversion, Zeitpunkt, Kanal, Quelle, DOI-Zeitpunkt, Widerruf; Print Format „PH Einwilligung Nachweis“; Button „Auskunft (Art. 15)“ am Abo.
- Event-Anmeldedaten werden 3 Monate nach dem Event anonymisiert (`event.js LOESCHFRIST_MONATE`).
- Altbestand aus „Newsletter Website“ (PLAN M4): Kennzeichen `altbestand_ohne_doi`, nie im Versand.

## Scheduler (`hooks.py` → `ph_marketing/tasks.py`)

`*/15` Newsletter-Versand (ab `versand_geplant`, Stapel 200) · `*/30` DOI-Erinnerung · 03:30 DOI aufräumen · 06:00 Reisen planen · 07:00 Empfehlungen prüfen · 08:00 Event-Erinnerung (X Tage vorher), vergangene Events schließen, Löschfrist · 09:00 Reisen senden (Service täglich, Werbung nur Di–Do, nie an Sperrtagen). Alle Reisen werden mit `aktiv = 0` ausgeliefert; `automatik_aktiv` und die Kanzlei-Freigaben stehen auf 0.

## Installation (Staging)

```bash
bench get-app /pfad/zu/Backend-Import/ph_marketing
bench --site <site> install-app ph_marketing      # after_install: Interessen, 14 Mail-Vorlagen, 7 Kundenreisen, Event adventsabend-2026
bench --site <site> migrate
bench --site <site> run-tests --app ph_marketing
cd Backend-Import/ph_marketing && PYTHONPATH=. python -m unittest discover -s ph_marketing/tests -t .   # ohne Site: Token, Regeln
```

Danach im Desk: `PH Marketing Einstellungen` prüfen (Testadresse, Versandweg, Auftrags-Doctype und Feldzuordnung, sobald ph_faktura/ph_shop installiert sind). Geheimnisse nur in `site_config.json`: `ph_resend_api_key`, `ph_mail_from`.

## Website-Umstellung (nach Abnahme)

| Route | heute | neu |
|---|---|---|
| `/api/newsletter_subscribe` | `…newsletter_website.api.subscribe_newsletter` (guest) | `ph_marketing.api.subscribe_newsletter` mit Token-Header |
| neu `/de/newsletter/bestaetigen`, `/de/newsletter/abmelden` | – | Seiten rufen `confirm_newsletter(token)` / `unsubscribe(token)` |
| Adventsabend-Formular | `/api/kontakt` (Personenzahl im Text) | `register_event` mit eigenen Feldern (`event_id: adventsabend-2026`) |
| Einblicke | `platzhirsch_einblicke.api.tag_speichern` | `ph_marketing.api.tag_speichern` (`EINBLICKE_FRAPPE_URL/KEY/SECRET`) |

## Offene Punkte

1. Website-Seiten für Bestätigung/Abmeldung/Event-Absage existieren noch nicht (Website-Team, nach Abnahme).
2. Kanzlei: Fußzeilen A/B, Einladung an Bestandskunden (B), Bewertungsbitte, Empfehlungsbedingungen – Schalter in den Einstellungen bleiben bis dahin aus.
3. Datenquelle Aufträge (abgeglichen 04.11.): PH Auftragsbestaetigung `kunde_name`, `kontakt`, `liefertermin_bestaetigt`, `zugewiesen_an`, `status`; E-Mail/Anrede über PH Kontakt; Pflegekategorie/Outdoor liegen nur am PH Produktpass (ph_projekte) – Felder leer = kein Pflege-/Outdoor-Segment. Mail über Frappe-Queue läuft über `ph_core.utils.mail.sende` (reply_to, Absendername); Resend-Versand bleibt in `versand.py`.
4. Nummernkreise `PH-NL-.YYYY.-.###` (Newsletter Ausgabe) und `PH-SOC-.YYYY.-.####` (Social Beitrag) sind in `ANFRAGEN-AN-CORE.md` beantragt.
5. Bounce-Verarbeitung: `newsletter.bounce_verarbeiten(email, art)` ist vorhanden, der Anschluss an Email-Queue-Fehler bzw. Resend-Webhook folgt mit dem Mail-Entscheid (PLAN Frage 13).
6. Adventsabend: Uhrzeit, Programm, Plätze erst nach Bestätigung des Inhabers eintragen; bis dahin Status „Geplant“.
