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

## Ergänzungen 04.11. (Backend-Lücken, Inhaber-Entscheidung Nr. 50)

| Baustein | Zweck | Datei |
|---|---|---|
| PH Segment + PH Segment Regel | Segment-Builder: Interesse, Sprache, PLZ/Land, Kontaktart/-status, Kundenkarte-Stufe, Kauf in/seit N Tagen, Umsatz 12 M/gesamt, Anzahl Käufe, Event-Teilnahme, Abo-Quelle; UND/ODER, Negation; **Einwilligungsprüfung je Zweck zwingend** (Abo Aktiv/DOI, Widerruf, Bounce/Beschwerde, nicht kontaktieren, Email Unsubscribe); Vorschau mit Ausschlussgründen | `utils/segment.py`, `ph_marketing/segmente.py`, `doctype/ph_segment/` |
| Newsletter → Segment | Zielgruppe „Segment“ (nur Zweck newsletter), Empfängerliste `empfaenger_liste()`, Zustellstatistik `zustellung()`, ToDo an Leitung bei „Zur Freigabe“, Realtime-Fortschritt `ph_marketing_versand` | `doctype/ph_newsletter_ausgabe/` |
| Versandprotokoll | Status gesendet/verzoegert/zugestellt/bounce_weich/bounce_hart/beschwerde/abgemeldet; Hard-Bounce und Beschwerde sperren sofort, weiche ab 3; Beschwerde widerruft alle werblichen Zwecke | `utils/mail_ereignis.py`, `ph_marketing/mail_ereignisse.py`, PH Mail Ereignis (180 Tage) |
| Resend-Webhook | `POST ph_marketing.api.webhook.resend` (einzige Guest-Methode, Svix-HMAC, ±5 min) | `api/webhook.py` |
| List-Unsubscribe | RFC 2369/8058-Header bei Resend; `ph_marketing.api.unsubscribe_one_click(token, body)` für die Website-Route `one_click_pfad` | `versand.abmelde_kopfzeilen` |
| Event: Kontingent/Warteliste | Kontingent für Eingeladene bis Datum, automatisches Nachrücken (FIFO ohne Blockade durch große Gruppen) mit Mail, Einladung an Segment (Zweck einladungen), Absage-Mail an Teilnehmer, Begleitpersonen | `utils/eventlogik.py`, `events.py`, PH Event Einladung |
| Event: Check-in | QR-Code `PHE1.<event>.<zeile>.<HMAC>` ohne Personenbezug, Schlüssel aus dem Site-Verschlüsselungsschlüssel, Doppel-Check-in erkannt, `erschienen_am`/`checkin_durch`; Druckformat „PH Event Ticket“, Code in der Bestätigungsmail | `checkin.py`, `api/backoffice.event_check_in` |
| Kampagnen-Attribution | PH Kampagne Kontaktpunkt aus Website-UTM (Anfrage, Newsletter-, Event-Anmeldung), Modelle last/first/linear, Fenster 180 Tage, Nachlauf beendeter Kampagnen 30 Tage; Umsatz aus PH Auftragsbestaetigung/PH Bestellung (wenn installiert); ROI ‰, Zielfortschritt; CSV-Import Plattform-Kennzahlen | `utils/attribution.py`, `kampagnen.py`, `utils/kennzahlen_csv.py`, Report „PH Kampagnen-ROI“ |
| Backoffice-API | `ph_marketing.api.backoffice.create_subscription`, `resend_doi_bulk`, `unsubscribe_bulk`, `preview_segment`, `list_recipients`, `event_check_in`, `journey_dry_run`, `check_order_source` | `api/backoffice.py` |
| Kontakt-Hooks (ph_crm) | Zeitleiste, Auskunft Art. 15, Löschplan Art. 17 (Einwilligungsnachweis 3 J., Empfehlung mit Gutschein 7 J. BAO, Rest löschen/anonymisieren), Zusammenführen (Widerruf hat Vorrang) | `kontakt_hooks.py`, `utils/datenschutz.py` |
| A14 Löschfristen | Katalog je Datenkategorie (Abo, Einwilligung, Event, Versand, Kontaktpunkt, Mail-Ereignis, Empfehlung) mit Frist, Aktion, Grundlage; täglicher Lauf, Report „PH Marketing Löschfristen“ als Vorlage fürs Verarbeitungsverzeichnis | `utils/datenschutz.LOESCHFRISTEN`, `loeschfristen.py` |
| UTM-Quelle | Attribution liest `utm_*`/`klick_id` der PH Anfrage (ph_crm); eigene Custom Fields entfernt (Patch `v0_2.utm_felder_entfernen`); Kundenkarten-Stufe/-Umsatz im Segment nur mit Einwilligung `kundenkarte_auswertung` | `ereignisse.py`, `segmente.py` |
| Report „PH Newsletter Zustellung“ | Zustellung, Bounces, Beschwerden, Abmeldungen je Ausgabe | `report/ph_newsletter_zustellung/` |

| PH Ideenboard + PH Ideenboard Karte | Speicher des geteilten Ideenboards (Teilen-Link, `src/lib/ideenboard`): gleiche Schnittstelle wie `localStore.js` (create/get/getByShare/update/remove/sweep). Website erzeugt boardId/shareId/adminSecret und prüft den Verwaltungsschlüssel selbst; hier nur boardId + SHA-256-Hashes, keine Personendaten. Name = `board_id` (kein Nummernkreis). Löschung 12 Monate nach der letzten Änderung (`expiresAt`, 03:45) | `ph_marketing/ideenboard.py`, `utils/ideenboard.py`, `doctype/ph_ideenboard/` |
| PH Bewertung (Serie `PH-BWT-.YYYY.-.#####`) | Direkte Rückmeldung (`/de/bewerten`, QR-Karte) und Google-Bewertungen (Desk-Import, `externe_id`). Kein Gating: keine Weiche nach Sternen, öffentliche Liste nie nach Sternen gefiltert, Ausblenden nur aus festen Gründen (Rechtsverletzung, Spam, kein Kundenbezug, Widerruf). Öffentlich nur maskierter Name, E-Mail/Telefon im Text entfernt; direkte Rückmeldungen nur mit Einwilligung zur Veröffentlichung. Buttons Veröffentlichen/Ausblenden (Leitung), Number Card „PH Neue Rückmeldungen“, Kontakt-Hooks (Zeitleiste, Art. 15, Art. 17), Löschfrist 2 Jahre (anonymisieren) | `ph_marketing/bewertung.py`, `utils/bewertung.py`, `doctype/ph_bewertung/` |

Scheduler neu: 03:45 `datenschutz_aufraeumen` (Mail-Ereignisse > 180 Tage, widerrufene Einwilligungen > 3 Jahre), 05:00 `kampagnen_attribution`, 08:00 zusätzlich abgelaufene Kontingente → Nachrücken. Nummernkreise: Segment = Kennung, Protokolle = hash, Ideenboard = `board_id`; neu nur `PH Bewertung` `PH-BWT-.YYYY.-.#####` (in ph_core NUMMERNKREISE eingetragen). 03:45 löscht zusätzlich abgelaufene Ideenboards.

## Website-API (`ph_marketing.api`, Token des Benutzers `website@platzhirsch.studio`)

| Methode | Parameter | Antwort | Ersetzt |
|---|---|---|---|
| `subscribe_newsletter` | `email` (+ optional `sprache`, `interessen`, `textversion`, `quelle`, `name`, `utm_*`, `idempotency_key`) | `{success: true, doi}` – **neutral auch bei Duplikat** | `newsletter_website.api.subscribe_newsletter` (`src/lib/forms/newsletter.js`) |
| `confirm_newsletter` | `token` | `{status: bestaetigt \| bereits_bestaetigt}`; 404 `invalid_token`, 410 `expired` | neu (DOI) |
| `unsubscribe` | `token` oder `email` | `{status: abgemeldet \| bereits_abgemeldet}` | neu |
| `register_event` | `event_id, name, email, personen, begleitung?, telefon?, nachricht?, textversion?, utm_*?` | `{success, status: angemeldet \| warteliste, plaetze_frei, email (maskiert)}`; 409 `conflict` wenn voll ohne Warteliste | Adventsabend-Formular über `/api/kontakt` |
| `cancel_event_registration` | `token` | `{status: abgesagt}` – Wartende rücken automatisch nach | neu |
| `unsubscribe_one_click` | `token, body` (RFC 8058) | `{status}` | neu |
| `get_event` | `event_id` | Eckdaten ohne Teilnehmerdaten | `event.js`-Konstanten |
| `record_consent` / `confirm_consent` | `email, zweck, textversion, quelle?, daten?` | `{success, doi, einwilligung}` | neu (Foto-Referenz, WhatsApp, Merkliste, Planer, Rückmeldung) |
| `tag_speichern` | `datum, schema, meta, teil?, seiten/heatmaps/pfade/signale/planer` | `{datum, teile, status}` | `platzhirsch_einblicke.api.tag_speichern` (`src/lib/einblicke/frappe.server.js`) |
| `create_ideenboard` (POST, idempotent) | `record` = model.js `createRecord` `{v, boardId, shareHash, adminHash, status, createdAt, updatedAt, expiresAt, cards[]}` | `{record}`; 400 `invalid`/`empty`, 409 `conflict` | `localStore.create` (`src/lib/ideenboard/service.js createShared`) |
| `get_ideenboard` (GET/POST) | `board_id` | `{record}` bzw. `{record: null}` (unbekannt/abgelaufen) | `localStore.get` |
| `get_ideenboard_by_share` (GET/POST) | `share_hash` (= sha256(shareId), bevorzugt) oder `share_id` | `{record}` bzw. `{record: null}` | `localStore.getByShare` (`getSharedBoard`) |
| `update_ideenboard` (POST) | `board_id, record, expected_updated_at?` (Alias `expected_modified`) | `{record}`; 404 `not_found`, 409 `conflict` bei paralleler Änderung, `adminHash`/`createdAt` unveränderlich | `localStore.update` (`manageShared` sync/revoke/renew) |
| `remove_ideenboard` (POST) | `board_id` | `{removed}` | `localStore.remove` (`manageShared` delete) |
| `sweep_ideenboards` (POST) | – | `{checked, removed, orphans: 0}` | `localStore.sweep` / `tools/ideenboard/sweep.mjs` |
| `create_bewertung` (POST, idempotent) | `sterne? (1–5), text?, name?, email?, anlass? (lieferung/montage/abholung/beratung/service), quelle? (direkt/qr/mail), einwilligung_veroeffentlichung?, textversion?, seite?` – Sterne oder Text Pflicht | `{referenz, status: "Neu", email (maskiert)}` | neu (Weg „Lieber direkt an uns?“ auf `/de/bewerten`, heute Mail-Link) |
| `get_bewertungen` (GET/POST) | `limit? (≤ 100), quelle? (google/direkt/qr/mail)` | `{count, average, reviews: [{id, author (maskiert), rating, text, date, source, occasion, reply}]}` | neu (ReviewSummary AP6, `ReviewNotice` „summary“) |

Ideenboard-Antworten enthalten die Hashes und sind nur für den Website-Server bestimmt; an den Browser gehen weiter nur `publicView`/`ownerView` (bildet die Website).

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
5. Bounce-Verarbeitung: Resend-Webhook `ph_marketing.api.webhook.resend` ist gebaut (Svix-Signatur, `resend_webhook_aktiv` = 0 bis zum Mail-Entscheid PLAN Frage 13; Geheimnis `ph_resend_webhook_secret`). Bei Versand über die Frappe-Queue fehlen Bounces und List-Unsubscribe-Header (ph_core.utils.mail.sende reicht keine Kopfzeilen durch).
6. Adventsabend: Uhrzeit, Programm, Plätze erst nach Bestätigung des Inhabers eintragen; bis dahin Status „Geplant“.
