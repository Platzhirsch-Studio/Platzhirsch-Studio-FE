# Platzhirsch Projekte (`ph_projekte`) – WP4

Projekte als **digitale Auftragsmappe**, Planung mit Versionen, Renderings mit Kundenfeedback (Pins, Votes, Freigabe, Sprachnotiz), Bautagebuch, Referenz-Freigabe, Produktpass, Dokumente mit Portal-Freigabe, Montageaufträge mit mehrsprachigem Montagebericht, Fremdgewerke-Koordination (ohne Bauleitung), Abnahmeprotokoll, Aufgaben und Zeiterfassung. Stand 04.11.2026, **nicht installiert**, nur Staging.

- Arbeitspaket: `../PLAN.md` WP4 · Regeln: `../CONVENTIONS.md` · Vorbild SHD marahobjekt/mex/moa: `../referenz/VORBILD-SHD-sauter-held-2026-11-03.md`
- Voraussetzungen (`required_apps`): `frappe`, `ph_core`, `ph_crm` (PH Kontakt, PH Anfrage, PH Termin), `ph_sortiment` (PH Produkt, PH Lieferant). Links auf ph_faktura/ph_shop/ph_logistik/ph_service gibt es **nicht** – die Auftragsmappe fragt diese DocTypes nur ab, wenn sie installiert sind.

## DocTypes (Modul „PH Projekte“, 30 JSONs, 552 Felder)

| DocType | Felder | Zweck |
|---|---|---|
| **PH Projekt** | 63 | Auftragsmappe: Art (Wohnung/Haus/Kueche/Bad/Hotel/Objekt/Yacht/Outdoor), Phase = `status` (Website `PROJECT_STEPS`), Kunde, Team, Objekt/Baustelle, Termine, Räume, Positionen, Phasenverlauf, Budget/Summen (permlevel 1), Portal-Schalter, Galerie |
| PH Projekt Team / Raum / Position / Phase | 3/4/10/4 | Kindtabellen |
| **PH Planung** (+ Position) | 26/6 | Planstand mit Version je Projekt, Quelle (CAD/Küchenplaner/Sofaplaner/Handskizze/Modell), Datei, JSON-Konfiguration, Positionen |
| **PH Rendering** | 30 | Variante A–F, Version, privates Bild, KI-Kennzeichnung, Feedback-Kennzahlen, Vorschau mit Pins |
| **PH Rendering Feedback** | 38 | kommentar/vorschlag/annotation (Pin 0–100 %)/vote/freigabe/sprachnachricht (privater Audio-Anhang, Einwilligung), Antworten des Studios |
| **PH Projekt Nachricht** | 20 | Nachrichtenfaden Kunde ↔ Studio |
| **PH Tagebuch Foto** | 26 | Bautagebuch je Phase (skizze…nachher), `field:foto_id` |
| **PH Referenz** (+ Bild) | 39/9 | Referenz-Freigabe mit Einwilligungsnachweis, Prüfung, Widerruf löscht Bildkopien, `field:freigabe_id` |
| **PH Produktpass** (+ Material/Pflege/Dokument) | 37/3/2/4 | verbaute Produkte, Materialien, Pflege, Garantie (berechnet), Dokumente, QR auf Portal |
| **PH Projekt Dokument** | 28 | Datei mit Kategorie, Version, Portal-Freigabe, Beleg-Bezug |
| **PH Montageauftrag** (+ Team/Leistung/Unterlage/Foto/Mangel) | 47/3/5/3/5/6 | Montagetermin, Team, Leistungen, Fotos vorher/nachher, Bericht de/en/fr/it, Unterschrift, Mängel |
| **PH Fremdgewerk** | 29 | Partnerbetrieb, Gewerk, Leistung, Termin, Haftungshinweis (nur Koordination) |
| **PH Abnahme** (+ Position) | 32/8 | Abnahmeprotokoll mit ok/Mangel/Nacharbeit, Fristen, Unterschriften |
| **PH Projekt Aufgabe** | 21 | Aufgabe je Projekt (Fälligkeit, Zuständigkeit, erfasste Minuten) |
| **PH Projektzeit** | 26 | Zeiten je Projekt/Aufgabe/Montage, Stundensatz/Betrag (permlevel 1), Abrechnungsstatus |
| PH Projekte Einstellungen (Single) | 15 | Portal-URL, Feedback-Erinnerung, Audio-/Fotolimits, Tagebuch/Referenz-Schalter, Token-Gültigkeit, Montagekapazität, Fußtexte |

## Workflows, Kanban, Druck, Auswertung

- **Workflows** (`fixtures/workflow*.json`): PH Projekt (Anfrage → Planung → Angebot → Auftrag → Bestellung → Lieferung → Montage → Übergabe → Abgeschlossen; Beauftragen/Abschließen/Abbrechen/Zurück nur Leitung), PH Rendering (Entwurf → Vorgelegt → Feedback offen → Freigegeben/Verworfen; Freigeben durch Mitarbeiter nur mit Kunden-Freigabe), PH Montageauftrag (Geplant → Unterwegs → In Arbeit → Erledigt → Abgenommen; Abnehmen nur mit Unterschrift), PH Abnahme (Entwurf → Unterzeichnet/Mit Mängeln → Abgeschlossen), PH Referenz (Eingereicht → Veröffentlicht/Abgelehnt/Widerrufen).
- **Kanban**: PH Projekte (Phase), PH Renderings, PH Montageaufträge, PH Fremdgewerke, PH Projektaufgaben.
- **Druckformate** (`ph_basis.html`): PH Projekt Statusbericht (ohne Preise), PH Montagebericht (Sprache aus `sprache_bericht`, Texte `utils/texte.py`), PH Abnahmeprotokoll (mehrsprachig), PH Produktpass (A5, QR per pyqrcode), PH Referenz Einwilligung (Nachweis).
- **Workspace „PH Projekte“**: 6 Number Cards (Aktive Projekte, Offene Feedbacks, Montagen diese Woche, Offene Mängel, Renderings ohne Antwort, Ungelesene Kundennachrichten), 4 Charts (Projekte je Phase, je Projektart, Montagen je Woche, Kundenfeedback je Woche), Shortcuts (Kanban, Auftragsmappe, Reports).
- **Reports** (Script): PH Projektstatus, PH Offene Maengel, PH Montagekapazitaet je Woche, PH Zeiten je Projekt, PH Liefertermine naechste 30 Tage.
- **Desk-Page `ph-auftragsmappe`** (`/app/ph-auftragsmappe?projekt=PH-PRJ-…`): Kopf mit Phasenleiste, Belege (PH Angebot/AB/Rechnung/Lieferschein/Zahlung, sobald ph_faktura/ph_shop installiert), Zahlungsstand (Leitung), Termine, offene Rückmeldungen, Dokumente, Pläne/Renderings, Galerie, Herstellerbestellungen, Abnahmen, Produktpässe, Servicefälle, Aufgaben, Zeiten, Nachrichten, Schnellanlage. Daten: `ph_projekte.api.auftragsmappe(projekt)`.
- **Buttons**: Projekt (Auftragsmappe, Montageauftrag/Abnahme anlegen, Produktpässe erzeugen, Portal-Status senden, Summen aktualisieren, Neu: Planung/Rendering/Dokument/Gewerk/Aufgabe/Zeit), Rendering (Kunden vorlegen, Antworten, Feedback-Übersicht), Feedback (Antworten, Erledigt), Planung (Kunden vorlegen, Freigeben, Verwerfen, Neue Version, Positionen ins Projekt), Dokument (Portal-Freigabe, Neue Version), Montageauftrag (Unterschrift erfassen, Bericht PDF, Bericht in Auftragsmappe, Zeit buchen, Mängel → Servicefall, Abnahme anlegen), Abnahme (Unterschriften, Mangel erledigt, Mangel → Servicefall, Protokoll PDF/in Auftragsmappe), Fremdgewerk (Status setzen, Termin anlegen), Referenz (Veröffentlichen, Ablehnen, Zurückziehen, Widerruf erfassen), Produktpass (Drucken, Status), Aufgabe (Erledigt, Zeit buchen), Zeiterfassung (Als abgerechnet), PH Anfrage: **Projekt anlegen** (Client-Script-Fixture).
- **Scheduler** (`ph_projekte/tasks.py`): 07:00 Montage-Erinnerung (Aufgabe an Montageleiter), 08:00 Feedback-Erinnerung (> X Tage), 02:30 Garantien prüfen + Projektsummen.
- **Custom Fields** (eigene App): `PH Termin.ph_projekte_projekt`, `PH Beratungsgespraech.ph_projekte_projekt`.

## Website-/Portal-API (`ph_projekte.api`, Token `website@platzhirsch.studio` + `kunde_token`)

Antwortformen = Mock-Adapter der Website (`src/lib/portal/adapters/mock.js`, `interface.js`, `components/Portal/Planung/server/planungStore.js`): Zeiten ISO 8601 mit Offset, Beträge nie an den Browser, `amount: null` / `amountNote: "auf Anfrage"`.

| Website (`adapters/frappe.js`) | Methode | Hinweis |
|---|---|---|
| Magic-Link anfordern | `portal_login_token(email)` | → `{found, kontakt, kunde_token, customer}`; Hash in `PH Kontakt.portal_token_hash`, Website mailt. Unbekannte E-Mail: `{found:false}` |
| `findCustomerByEmail` / `getCustomer` | `portal_find_customer(email)` / `portal_customer(kontakt, kunde_token)` | |
| `listProjects` / `getProject` | `portal_projects` / `portal_project(…, projekt)` | 8 Steps, items (Preise nur mit `portal_positionen_preise`), trades aus PH Fremdgewerk |
| `listDocuments` | `portal_documents(…, type?, projekt?)` | PH Projekt Dokument (freigegeben); Belege mit Beträgen: `ph_faktura.api.portal_documents` |
| `listAppointments` | `portal_appointments(…, projekt?, von?)` | PH Termin (ph_crm), Montagen, Fremdgewerk-Termine |
| `getProductPass` | `portal_product_pass(…, produktpass)` / `portal_product_passes` | |
| – (Desk, ph_logistik Lieferschein) | `create_product_passes(lieferschein=, auftrag=, projekt=, positionen=[{produkt, bezeichnung, menge, seriennummer?, ausfuehrung_text?, ab_position?}], idempotency_key=)` | Produktpässe aus Lieferung, idempotent → `{produktpaesse, uebersprungen}`; gemeinsame Logik `ph_produktpass.pass_anlegen` |
| `listRenderings` | `portal_renderings(…, projekt)` | `image` = private file_url → `portal_file` |
| Feedback (`/api/portal/feedback`, `/voice`) | `portal_feedback_list`, `portal_add_feedback(…, eintrag, audio_base64?, audio_mime?, website_id?)` | `feedbackEntrySchema` 1:1; Sprachnotiz mit Signaturprüfung, max. 5 MB |
| `listMessages` / `sendMessage` / `markMessagesRead` | `portal_messages`, `portal_send_message(…, body, projekt?)`, `portal_mark_read(…, message_ids)` | |
| `requestPlanning` | `portal_request_planning(…, eintrag)` | → PH Anfrage art Beratung, Kanal Kundenportal |
| Dateien (Rendering, Dokument, Audio, Pass-Anhang) | `portal_file(…, file_url)` | Base64, nur eigene private Dateien; Website streamt |
| Tagebuch (`tagebuch/adapter.js`) | `tagebuch_list/add/delete/file` (`rolle=team` oder Kunde) | Dateien `<foto_id>-<w>.<avif|webp>` als private Files |
| Referenz | `referenz_create`, `referenz_list`, `referenz_update(freigabe_id, aktion, …)`, `referenz_file` | Statusregeln der Spec; `referenz_file` nur bei Veröffentlicht |

Fehlercodes: `invalid` 400, `forbidden` 403, `not_found`/`invalid_token` 404, `conflict` 409, `expired` 410, `rate_limited` 429, `unavailable` 503 (auch solange `PH Kontakt.portal_token_hash` fehlt).

Schreibende Methoden sind idempotent (`idempotency_key`). Alle Aufrufe werden in PH API Protokoll (ph_core) protokolliert.

## Installation (Staging)

```bash
bench get-app /pfad/zu/Backend-Import/ph_projekte
bench --site <site> install-app ph_projekte
bench --site <site> migrate
bench --site <site> run-tests --app ph_projekte
```

Website-Umstellung (nach Abnahme): `PORTAL_ADAPTER=frappe`, `TAGEBUCH_ADAPTER=frappe`, `FRAPPE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET`; der Frappe-Adapter ruft die Methoden oben auf und hält den `kunde_token` in der Portal-Session.

## Tests

```bash
cd Backend-Import/ph_projekte && PYTHONPATH=. python -m unittest discover -s ph_projekte/tests -t .   # ohne Site: Portal-Logik, Texte
bench --site <site> run-tests --app ph_projekte                                                          # DocType- und API-Tests
```

DocType-Tests: PH Projekt (Phasen, Buttons, Portal-API, fremder Kontakt), PH Rendering Feedback (Pin, Antwort, API inkl. Idempotenz und Sprachnotiz), PH Referenz (eine aktive je Projekt, Skizze verboten, Pflichtfelder, Widerruf löscht Dateien, API), PH Montageauftrag, PH Projektzeit, PH Abnahme.

## Offene Punkte

- `PH Kontakt` (ph_crm) braucht `portal_aktiv`, `portal_token_hash`, `portal_letzter_login` (PLAN WP2) – bis dahin antwortet die Portal-API 503 `unavailable`.
- Nummernkreise der neuen DocTypes in `ph_core/utils/naming.py` eintragen (`../ANFRAGEN-AN-CORE.md`).
- ph_faktura: Summen (`auftragswert_cent`, `anzahlung_ist_cent`, `offen_cent`, `bezahlt_cent`) und Button „Angebot erstellen“ im Projekt kommen aus WP6; `dokument_aus_beleg()` in `ph_projekt_dokument.py` legt Beleg-PDFs in die Mappe.
- ph_service: „Mängel → Servicefall“ erzeugt `PH Servicefall` erst, wenn installiert (Feldnamen `kontakt`, `projekt`, `beschreibung`, `quelle` angenommen).
- Portal-Freigabe von Preisen (Inhaber-Frage Nr. 10) bleibt aus (`portal_positionen_preise` = 0); Einwilligungstext Referenz nur Entwurf (`referenz_freigabe_aktiv` = 0).
