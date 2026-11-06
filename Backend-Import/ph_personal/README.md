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
| **Stand 04.11.2026 – Backend-Lücken (Fachkritik 21-kritik-fach-personal.md P1–P17)** | |
| **PH Krankmeldung** (Serie PH-KRANK-, Gemeldet → Bestätigt → Beendet, keine Genehmigung; AU-Bestätigung privat; Rechte nur Leitung/GF/Person; § 5 UrlG-Urlaubsunterbrechung) | `…/doctype/ph_krankmeldung/` |
| **PH Urlaubsanspruch** (UA-<MA>-<Beginn>, je Urlaubsjahr: 5/6 Wochen × Arbeitstage, Aliquotierung erstes Halbjahr, Verjährung +2 Jahre, FIFO, Vorgriff, Pflegefreistellungs-Kontingent) | `…/doctype/ph_urlaubsanspruch/`, `ph_personal/ph_personal/urlaubskonto.py` |
| **PH Zeitabschluss** (ZAB-<MA>-<JJJJ-MM>, Monatsabschluss mit Sperre, Saldo-Vortrag, Lohnvorbereitungs-Spalten) + Report **PH Lohnvorbereitung** | `…/doctype/ph_zeitabschluss/`, `…/report/ph_lohnvorbereitung/` |
| **PH Dienstplan** (DP-<JJJJ-KWnn>) + **PH Dienstplan Schicht**, **PH Schicht** (Vorlagen), Mindestbesetzung in den Einstellungen (**PH Personal Besetzung**); Prüfung Unterbesetzung, Abwesenheit, Ruhezeit 11 h, Höchstgrenzen, Wochenruhe 36 h | `…/doctype/ph_dienstplan/`, `ph_personal/utils/dienstplan.py` |
| **PH Onboarding Vorlage** (+ Aufgabe) und Checkliste je Mitarbeiter (**PH Mitarbeiter Checkliste**, Nachweisfelder ÖGK/Dienstzettel/Datenschutzinfo/Unterweisung/Abmeldung) | `…/doctype/ph_onboarding_vorlage/`, `install.checklisten_anlegen` |
| Kindtabellen am Mitarbeiter: **Arbeitszeit** (Modell mit Gültigkeit), **Arbeitsmittel**, **Dokument** (privat, permlevel 1) | `…/doctype/ph_mitarbeiter_*` |
| Zeitkonto (Feiertage getrennt von Betriebsruhe, Modell je Tag, Gutschrift-Matrix, Mehrarbeit/Überstunden) | `ph_personal/ph_personal/zeitkonto.py`, `ph_personal/utils/arbeitszeit.py` |
| Nachtrag Nr. 57/A15/A16: GlBG-Entgeltprüfung (Zeitraum auch Stunde), AZG/ARG-Prüfung an Zeiterfassung und Monatsabschluss (protokolliert, keine Sperre), Projekt/Auftrag (Dynamic Link) + Tätigkeit, Report PH Projektstunden, Nachweis Zeitnachweis-Übermittlung (§ 26 Abs 8 AZG) | `utils/glbg.py`, `utils/azg.py`, `zeitkonto.azg_befunde`, `api.azg_pruefung`, `report/ph_projektstunden`; Tests `tests/test_azg_glbg.py` |
| Reine Logik UrlG/AZG/ARG/KJBG/GlBG-Fristen | `ph_personal/utils/urlaub.py`, `arbeitszeit.py`, `dienstplan.py`, `datenschutz.py`; Tests `tests/test_urlaub.py`, `tests/test_arbeitszeit.py` |

## Fachregeln

- **§ 9 Abs 2 GlBG:** `PH Stelle` wird nur „Aktiv“ (Workflow, nur Leitung) mit `entgelt_vollstaendig` = Betrag in Cent > 0, Zeitraum Monat/Jahr, Kollektivvertrag, Überzahlung ja/nein oder eigener Wortlaut. Der Controller wirft zusätzlich beim Speichern; die API filtert ein drittes Mal unabhängig vom gespeicherten Kennzeichen. Website-Regel: `src/components/Karriere/glbg.js`.
- **Slug:** identisch zu `src/lib/slugify.js generateSlug` (Dokumentname = Slug). Die Website verschmilzt Backoffice- und statische Stellen über den Slug (`mergeStellen`) – gleiche Slugs = kein Duplikat.
- **Veröffentlichungsfenster:** `veroeffentlicht` (posted) bis `gueltig_bis` (Standard +60 Tage wie `stellen.js`); danach pausiert der Tagesjob die Stelle.
- **Bewerbungen:** Unterlagen immer privat; Löschfrist = Entscheidung + 7 Monate (Einstellungen; GlBG § 15 Klagefrist 6 Monate + Puffer); Löschlauf entfernt Dateien, Anschreiben, Versionen, Kommunikation und pseudonymisiert Name/E-Mail/Telefon. Längere Aufbewahrung nur mit `einwilligung_evidenz` + Datum. Bewertungen/Notizen nur Leitung (permlevel 1). `PH Backoffice-Admin` hat bewusst **keinen** Zugriff auf Bewerbungen und Gespräche.
- **Mitarbeiter:** vertrauliche Felder (Geburtsdatum, Privatadresse, Notfallkontakt) permlevel 1 (Leitung schreibt, Geschäftsführung liest). Mit `user` verknüpft → Rolle `PH Personal Selbstservice` + User Permission auf den eigenen Datensatz (eigene Zeiten/Anträge, kein `if_owner`).
- **Zeiterfassung:** Soll nach Arbeitszeitmodell der Person (gültig am Tag), gesetzliche Feiertage Soll 0, Josefstag/Betriebsruhe nach Einstellung. Gutschrift-Matrix: Urlaub/Krankenstand/Pflege/Sonderurlaub/Fortbildung/Berufsschule = Tagessoll; **Zeitausgleich keine Gutschrift** (senkt das Guthaben); unbezahlt/Karenz Soll 0. Wochenaufteilung Normal/Mehrarbeit Teilzeit/über KV-Normal/Überstunden > 40 h und ZA-Wert je Abgeltung (1 : 1,5 / Gleitzeit 1 : 1 / Auszahlung). Pause wird vorgeschlagen und muss bestätigt werden; Jugendliche: Pause ab 4,5 h, Hinweis > 8 h. Selbstservice ändert nur Buchungen des Tages, sonst Korrekturantrag (Leitung entscheidet). Abgeschlossene Monate (PH Zeitabschluss) sind gesperrt. Keine Zuschläge in Geld (Lohnverrechnung).
- **Abwesenheit:** Workflow Beantragt → Genehmigt/Abgelehnt → Storniert; niemand genehmigt den eigenen Antrag (Bedingung gegen PH Mitarbeiter.user, nicht owner); Geschäftsführung genehmigt Anträge der Leitung; Genehmigung vor Beginn zurücknehmbar; Antragsteller storniert vor Beginn auch genehmigte Anträge; „Früher zurück“ (Leitung). Tage nach Modell ohne Feiertage. Urlaubskonto nach UrlG (Urlaubsjahr = Arbeitsjahr, Kalenderjahr nur mit Grundlage), tageweise Zuordnung über Jahresgrenzen, Vorgriff nur mit Kennzeichen. **Krankenstand ist keine Abwesenheitsart mehr** → PH Krankmeldung (Art. 9 DSGVO; Teamkalender zeigt Nicht-Leitung nur „abwesend“).
- **Austritt:** Scheduler 00:10 vollzieht den Austritt (Benutzer deaktivieren, Selbstservice/User Permission, Kassa-PIN `ph_core_pin_hash`, Sitzungen), Offboarding-Checkliste, `austritt_konto` (Urlaubsersatzleistung § 10 UrlG, Saldo). Beschäftigtendaten: Notfallkontakt/Privates 30 Tage nach Austritt löschen, Zeit-/Abwesenheitsdaten nach 7 Jahren (BAO, StB bestätigen).
- **Bewerbungen:** Löschfrist ab Zugang der Absage (`absage_versand_am`, Post/Telefon/persönlich dokumentierbar); Löschlauf entfernt zusätzlich Gespräche, Events, ToDos, Mail-Warteschlange, Website-Referenz; `einstellen` legt Mitarbeiter und Status in einer Transaktion an; „Nicht angetreten“; Eingangsbestätigung mit Datenschutzinformation; Hinweis bei offenen Bewerbungen > 90 Tage; GlBG-Titelprüfung als Warnung.

## Website-Umstellung (nach Installation, Staging zuerst)

| Zweck | heute | neu |
|---|---|---|
| Stellenliste/Detail (`src/lib/api/fetchKarrierData.js`) | `platzhirsch_studio.platzhirsch_studio.doctype.karriere.api.karriere_data` (guest) | `ph_personal.api.karriere_data` (guest, GET, gleiches `message`-Format; zusätzlich `slug`, `entgelt{kvMindestBrutto, zeitraum, ueberzahlung, kollektivvertrag}`, `valid_through`, `salary_unit`, `job_status_*`, `start_*`, `working_hours_*`) |
| Bewerbungsformular (künftig) | – | `ph_personal.api.create_bewerbung` (POST, Token `website@platzhirsch.studio`, idempotent; optional `gehaltsvorstellung` Freitext ≤ 140 → Feld `gehaltsvorstellung`, permlevel 1, nur Personal-Leitung/Geschäftsführung) → `{"referenz": "PH-BEW-…"}`; danach `ph_personal.api.attach_unterlage(referenz, dateiname, inhalt_base64, art)` je Datei (PDF/JPG/PNG/DOC/DOCX ≤ 10 MB, max. 10) |
| Cache-Webhook | Frappe → `POST /revalidate/karriere` | unverändert; ph_personal ruft ihn nach Änderungen an aktiven Stellen (Schlüssel `ph_website_revalidate_url`, `ph_website_revalidate_secret` in `site_config.json`; Schalter in PH Personal Einstellungen) |

Stundenlohn-Stellen (`entgelt_zeitraum = Stunde`) werden wie Monat/Jahr veröffentlicht (`salary_unit: "HOUR"`); die frühere Ausblendung ist aufgehoben, die Website kann „Stunde“ (`stellen.js`, `texte.js`). `karriere_data`/`get_stellen` haben das Gast-Rate-Limit je IP (`ph_core.api.gast_rate_limit`).

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

- Feiertage: angebunden über `ph_core.utils.feiertage` (gesetzlich/Land/Betriebsruhe getrennt, `zeitkonto.freie_tage`).
- Nummernkreise `PH-GSP-`, `PH-ABW-` und neu **`PH Krankmeldung` → `PH-KRANK-.YYYY.-.#####`** in `ph_core/utils/naming.py` eintragen (ANFRAGEN-AN-CORE.md); bis dahin meldet check.py die Abweichung.
- Mindestbesetzung (Showroom-Öffnungszeiten) und Schichtvorlagen in den Einstellungen bzw. PH Schicht erfassen – bewusst keine erfundenen Zeiten im Installer.
- Offen Recht/Steuer: Urlaubsjahr, Gleitzeitvereinbarung, Behandlung 24./31.12., KV-Handel-Mehrstunden 38,5–40 h, Aufbewahrungsfristen, Spalten der Lohnvorbereitung (Steuerberatung).
- Website-Revalidate läuft über `ph_core.utils.website.revalidate("karriere")` (`website.py` ist nur noch ein dünner Wrapper mit App-Schalter).
- Link `PH Zeiterfassung.projekt` auf `PH Projekt` legt ph_projekte als Custom Field an (CONVENTIONS 10).
- Entscheidung Inhaber (PLAN.md Frage 11/15): Löschkonzept 7 Monate bestätigen; Kollektivvertrags-Einstufung vom Steuerberater bestätigen lassen (Bericht KARRIERE-KV-2026-11-03.md).
