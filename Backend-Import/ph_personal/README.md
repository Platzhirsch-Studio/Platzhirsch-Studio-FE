# Platzhirsch Personal (`ph_personal`) – WP8

Stellen (Karriere-Seite der Website), Bewerbungen mit DSGVO-Löschfrist, Bewerbungsgespräche, Mitarbeiter-Stammdaten,
einfache Zeiterfassung (Kommen/Gehen) und Urlaub/Abwesenheit mit Genehmigung. Frappe v15 (v16-kompatibel), nur `ph_core` als Voraussetzung.

**Nicht installiert.** Nur auf einer Staging-Site einspielen (PLAN.md, Abschnitt 0).

## Inhalt

| Baustein | Datei |
|---|---|
| **PH Stelle** (52 Datenfelder, Tabs Stelle/EN/FR/IT/Entgelt/Veröffentlichung/System; Slug = Website-Slug; GlBG-Sperre) | `ph_personal/ph_personal/doctype/ph_stelle/` |
| Kindtabellen PH Stelle Aufgabe / Anforderung / Leistung (Feldnamen `responsibility`, `anforderungen`, `benefit` = Website) | `…/doctype/ph_stelle_aufgabe/`, `ph_stelle_anforderung/`, `ph_stelle_leistung/` |
| **PH Bewerbung** (Serie PH-BEW-, 44 Datenfelder, Tabs Bewerbung/Bewertung (Leitung)/Verlauf/Datenschutz/System) + PH Bewerbung Unterlage (5) | `…/doctype/ph_bewerbung/`, `…/doctype/ph_bewerbung_unterlage/` |
| **PH Bewerbungsgespraech** (Serie PH-GSP-, 19 Datenfelder, Termin, Kalender-Event, Ergebnis) | `…/doctype/ph_bewerbungsgespraech/` |
| **PH Mitarbeiter** (Serie PH-MA-, 31 Datenfelder, Teams, Fahrzeugberechtigung, Vertraulich permlevel 1, Selbstservice) | `…/doctype/ph_mitarbeiter/` |
| **PH Zeiterfassung** (Serie PH-ZEIT-, 17 Datenfelder, Kommen/Gehen/Pause, Projektreferenz, Stempeln, Monatsübersicht) | `…/doctype/ph_zeiterfassung/` |
| **PH Abwesenheit** (Serie PH-ABW-, 21 Datenfelder, Urlaubskonto, Überschneidungsprüfung, Teamkalender) | `…/doctype/ph_abwesenheit/` |
| **PH Personal Einstellungen** (Single, 11 Datenfelder: Löschfrist, Arbeitszeit, Urlaubsanspruch, Briefvorlagen, Revalidate-Schalter) | `…/doctype/ph_personal_einstellungen/` |
| Website-API `karriere_data` (guest), `create_bewerbung`, `attach_unterlage` (Token), `stempeln`, Kalender | `ph_personal/api/__init__.py` |
| Workflows PH Stelle, PH Bewerbung, PH Abwesenheit (+ 15 Zustände, 15 Aktionen) | `fixtures/workflow*.json` |
| Kanban PH Bewerbungen (je Stelle filterbar), PH Stellen | `fixtures/kanban_board.json` |
| Druck: PH Stelle Aushang, PH Bewerbung Deckblatt/Absage/Zusage, PH Mitarbeiter Zeitnachweis (Quelle: `templates/print/*.html`) | `fixtures/print_format.json` |
| 5 Dashboard Charts, 6 Number Cards, Workspace „PH Personal“ | `fixtures/dashboard_chart.json`, `number_card.json`, `workspace.json` |
| Reports PH Bewerbungsstatistik, PH Loeschfristen, PH Monatsstunden, PH Abwesenheiten | `ph_personal/ph_personal/report/` |
| Scheduler: Löschlauf 03:15, abgelaufene Stellen 04:00, Löschfrist-Vorwarnung Mo 07:00, offene Buchungen 23:30 | `ph_personal/ph_personal/tasks.py`, `hooks.py` |
| Import der 8 Stellen (Stand 03.11.2026, KV-Mindestentgelte) | `ph_personal/install.py`, `ph_personal/ph_personal/daten/stellen_import.json` |
| Reine Logik (Slug, Entgelt, Fristen, Arbeitstage) ohne Frappe | `ph_personal/logik.py`, Tests `ph_personal/tests/test_logik.py` |

## Fachregeln

- **§ 9 Abs 2 GlBG:** `PH Stelle` wird nur „Aktiv“ (Workflow, nur Leitung) mit `entgelt_vollstaendig` = Betrag in Cent > 0, Zeitraum Monat/Jahr, Kollektivvertrag, Überzahlung ja/nein oder eigener Wortlaut. Der Controller wirft zusätzlich beim Speichern; die API filtert ein drittes Mal unabhängig vom gespeicherten Kennzeichen. Website-Regel: `src/components/Karriere/glbg.js`.
- **Slug:** identisch zu `src/lib/slugify.js generateSlug` (Dokumentname = Slug). Die Website verschmilzt Backoffice- und statische Stellen über den Slug (`mergeStellen`) – gleiche Slugs = kein Duplikat.
- **Veröffentlichungsfenster:** `veroeffentlicht` (posted) bis `gueltig_bis` (Standard +60 Tage wie `stellen.js`); danach pausiert der Tagesjob die Stelle.
- **Bewerbungen:** Unterlagen immer privat; Löschfrist = Entscheidung + 7 Monate (Einstellungen; GlBG § 15 Klagefrist 6 Monate + Puffer); Löschlauf entfernt Dateien, Anschreiben, Versionen, Kommunikation und pseudonymisiert Name/E-Mail/Telefon. Längere Aufbewahrung nur mit `einwilligung_evidenz` + Datum. Bewertungen/Notizen nur Leitung (permlevel 1). `PH Backoffice-Admin` hat bewusst **keinen** Zugriff auf Bewerbungen und Gespräche.
- **Mitarbeiter:** vertrauliche Felder (Geburtsdatum, Privatadresse, Notfallkontakt) permlevel 1 (Leitung schreibt, Geschäftsführung liest). Mit `user` verknüpft → Rolle `PH Personal Selbstservice` + User Permission auf den eigenen Datensatz (eigene Zeiten/Anträge, kein `if_owner`).
- **Zeiterfassung:** nur Erfassung und Summen (Pause-Vorschlag ab 6 h, Hinweis > 10 h); kein AZG-Prüfwerk. Soll = Wochenstunden/5 × Werktage Mo–Fr. Feiertage noch nicht berücksichtigt (offen).
- **Abwesenheit:** Workflow Beantragt → Genehmigt/Abgelehnt (Leitung, keine Selbstgenehmigung) → Storniert; Überschneidungen blockiert; Urlaubskonto je Jahr (Anspruch aus Mitarbeiter oder Einstellungen, kein Vorjahresübertrag).

## Website-Umstellung (nach Installation, Staging zuerst)

| Zweck | heute | neu |
|---|---|---|
| Stellenliste/Detail (`src/lib/api/fetchKarrierData.js`) | `platzhirsch_studio.platzhirsch_studio.doctype.karriere.api.karriere_data` (guest) | `ph_personal.api.karriere_data` (guest, GET, gleiches `message`-Format; zusätzlich `slug`, `entgelt{kvMindestBrutto, zeitraum, ueberzahlung, kollektivvertrag}`, `valid_through`, `salary_unit`, `job_status_*`, `start_*`, `working_hours_*`) |
| Bewerbungsformular (künftig) | – | `ph_personal.api.create_bewerbung` (POST, Token `website@platzhirsch.studio`, idempotent) → `{"referenz": "PH-BEW-…"}`; danach `ph_personal.api.attach_unterlage(referenz, dateiname, inhalt_base64, art)` je Datei (PDF/JPG/PNG/DOC/DOCX ≤ 10 MB, max. 10) |
| Cache-Webhook | Frappe → `POST /revalidate/karriere` | unverändert; ph_personal ruft ihn nach Änderungen an aktiven Stellen (Schlüssel `ph_website_revalidate_url`, `ph_website_revalidate_secret` in `site_config.json`; Schalter in PH Personal Einstellungen) |

Nur die URL-Konstante in `fetchKarrierData.js` ändern; `generateSlug(member.title)` liefert denselben Slug wie das Backoffice. Die statischen Stellen in `src/lib/karriere/stellen.js` können nach Abnahme entfallen (Backoffice gewinnt bei gleichem Slug ohnehin).

## Installation (Staging)

```bash
bench get-app /pfad/zu/Backend-Import/ph_personal
bench --site <site> install-app ph_personal      # after_install: Einstellungen + Import der 8 Stellen (Status Aktiv, da Entgelt vollständig)
bench --site <site> migrate
bench --site <site> run-tests --app ph_personal
bench --site <site> execute ph_personal.install.stellen_importieren   # Import erneut (idempotent über sync_quelle)
```

Danach im Desk: PH Personal Einstellungen prüfen (Löschfrist, Bewerbungspostfach, Revalidate-Schalter), Mitarbeiter anlegen und Benutzer verknüpfen, Leitung die Rolle `PH Personal Leitung` geben (2FA).

## Tests ohne Site

```bash
cd Backend-Import/ph_personal && PYTHONPATH=. python -m unittest discover -s ph_personal/tests -t .
python Backend-Import/tools/check.py
```

Druckformate ändern: `templates/print/*.html` bearbeiten und `fixtures/print_format.json` neu erzeugen (Generator-Skript im Übergabebericht; Felder `html` 1:1 aus den Vorlagen).

## Rollen

`PH Personal Mitarbeiter` (Sachbearbeitung) · `PH Personal Leitung` (Veröffentlichen, Entscheiden, Vertrauliches, Genehmigen, Löschen; 2FA) · `PH Personal Selbstservice` (alle Mitarbeiter: eigene Zeiten und Anträge).

Wie in ph_crm gilt: Die Leitung erhält zusätzlich `PH Personal Mitarbeiter` (Workflow-`allow_edit` der Arbeitszustände liegt bei der Mitarbeiter-Rolle) und – über ihren eigenen PH Mitarbeiter-Datensatz – `PH Personal Selbstservice` (Abwesenheiten im Zustand „Beantragt“ bearbeitet diese Rolle).

## Offene Punkte

- Feiertagskalender (Vorarlberg) für Arbeitstage/Soll – Vorschlag: `PH Feiertag` in ph_core oder Frappe „Holiday List“ (ERPNext-frei nicht vorhanden).
- Nummernkreise `PH-GSP-`, `PH-MA-`, `PH-ZEIT-`, `PH-ABW-` in `ph_core/utils/naming.py` eintragen (ANFRAGEN-AN-CORE.md).
- Website-Revalidate läuft über `ph_core.utils.website.revalidate("karriere")` (`website.py` ist nur noch ein dünner Wrapper mit App-Schalter).
- Link `PH Zeiterfassung.projekt` auf `PH Projekt` legt ph_projekte als Custom Field an (CONVENTIONS 10).
- Entscheidung Inhaber (PLAN.md Frage 11/15): Löschkonzept 7 Monate bestätigen; Kollektivvertrags-Einstufung vom Steuerberater bestätigen lassen (Bericht KARRIERE-KV-2026-11-03.md).
