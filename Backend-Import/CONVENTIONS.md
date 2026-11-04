# CONVENTIONS – Regeln für alle Bau-Agenten der PH-Apps

Stand 03.11.2026 · Ziel: Frappe **v15** (v16-kompatibel, keine v16-only-APIs). ERPNext ist **nicht** installiert und wird nicht vorausgesetzt.
Vorbild in `ph_crm`: DocType **PH Anfrage** (JSON, .py, .js, Kindtabelle, API, Workflow, Kanban, Druckformat, Chart, Number Card, Report, Tests). Kopieren, umbenennen, anpassen.

Grundregeln: kein `git commit`, keine Geheimnisse in Dateien, keine Verbindung zum produktiven Backoffice, keine Änderung an Dateien fremder Apps (Ausnahme: ein Bau-Agent darf in **seiner** App `Custom Field`-Fixtures für fremde DocTypes anlegen, s. 10). Jede App hat genau **einen** Bau-Agenten (ph_kassa zwei, s. PLAN.md).

---

## 1. App- und Ordnerstruktur

```
Backend-Import/<app>/
  pyproject.toml, README.md, license.txt
  <app>/__init__.py            __version__ = "0.1.0"
  <app>/hooks.py               app_*, required_apps, fixtures (mit Filtern!), doc_events, scheduler_events
  <app>/modules.txt            ein Modul: "PH <Bereich>"   (ph_core: "PH Core", ph_crm: "PH CRM", …)
  <app>/patches.txt            [pre_model_sync] / [post_model_sync]
  <app>/install.py             after_install(): Standarddaten, idempotent
  <app>/api/__init__.py        whitelisted Methoden für Website/Integrationen (+ weitere Module in api/)
  <app>/<modul>/doctype/<dt>/  <dt>.json, <dt>.py, <dt>.js, [<dt>_list.js], test_<dt>.py, __init__.py
  <app>/<modul>/report/<r>/    <r>.json, <r>.py, <r>.js, __init__.py
  <app>/<modul>/page/<p>/      (nur Desk-Pages: Kassa, Packtisch, Auftragsmappe)
  <app>/<modul>/tasks.py       Scheduler-Funktionen
  <app>/<modul>/ereignisse.py  doc_events-Handler
  <app>/fixtures/*.json        role, workflow, workflow_state, workflow_action_master, kanban_board,
                               print_format, dashboard_chart, number_card, workspace, custom_field
  <app>/templates/print/       eigene Jinja-Teilvorlagen (erben von ph_core templates/print/ph_basis.html)
  <app>/public/js|css/         nur, wenn Desk-Pages es brauchen
  <app>/tests/                 Tests ohne DocType-Bezug
```

Modulordner = Modulname klein mit Unterstrich (`PH CRM` → `ph_crm/ph_crm/ph_crm/`). DocType-Ordner = `frappe.scrub(name)` (`PH Anfrage` → `ph_anfrage`).

## 2. Namen

| Was | Regel | Beispiel |
|---|---|---|
| DocType | deutsch, Präfix `PH `, Singular, ohne Umlaute im **technischen** Namen (Label darf Umlaute haben) | `PH Bestellung`, `PH Auftragsbestaetigung` (Label „PH Auftragsbestätigung“) |
| Kindtabelle | `PH <Eltern> <Zeile>` | `PH Bestellung Position`, `PH Anfrage Produkt` |
| Single | `PH <Bereich> Einstellungen` | `PH Shop Einstellungen` |
| Feldname | `snake_case`, deutsch, ohne Umlaute (ae/oe/ue/ss), Pflichtfelder s. 3 | `gesamt_cent`, `bezahlt_am`, `zugewiesen_an` |
| Beträge | **immer Cent als Int** (`*_cent`), Währung `waehrung` (Link Currency, Standard EUR). Nie Float für Geld. Steuersätze als Int ×100 (Basispunkte: `ust_satz_promille` = 2000 für 20 %, 1000 = 10 %; der Suffix `_promille` ist historisch und bedeutet **nicht** Promille – gilt für ph_shop, ph_faktura, ph_kassa gleich). Rabatte als echte Promille (`rabatt_promille` = 100 für 10 %) | `betrag_cent`, `ust_cent` |
| Zeit | `Datetime` in Site-Zeitzone Europe/Vienna; API gibt ISO 8601 mit Offset | `eingang`, `bezahlt_am`, `start`, `ende` |
| Status | Feld `status` (Select), Werte deutsch mit Großbuchstaben, **ohne** Umlaute für Workflow-Kompatibilität: `Neu`, `Bestaetigt`, `Storniert` | |
| Rollen | `PH <Bereich> Mitarbeiter`, `PH <Bereich> Leitung` + global `PH Geschäftsführung`, `PH Backoffice-Admin`, `PH Website Integration`, `PH Buchhaltung extern` | `PH Shop Leitung` |
| Workflow | gleich wie DocType | `PH Bestellung` |
| Workflow State | `PH <Zustand>` (Namen sind **global**, deshalb Präfix) | `PH Neu`, `PH Bezahlt` |
| Workflow Action Master | deutsch, Imperativ/Partizip, global geteilt – vorhandene wiederverwenden (ph_crm: Qualifizieren, Gewonnen, Verloren, Als Spam markieren, Zurück auf Neu, Termin vereinbaren, Angebot erstellen) | `Freigeben`, `Stornieren`, `Versenden` |
| Kanban Board | `PH <Plural>` | `PH Bestellungen` |
| Print Format | `PH <DocType> <Zweck>` | `PH Rechnung Standard` |
| Dashboard Chart / Number Card | `PH <Aussage>` | `PH Umsatz je Monat`, `PH Offene Posten` |
| Report | `PH <Aussage>` | `PH Anfragen nach Quelle` |
| Workspace | `PH <Bereich>` (einer je App) | `PH Shop` |
| API-Methode | `<app>.api.<verb>_<objekt>` (snake_case, englische Verben wie heute: create/get/list/update/cancel) | `ph_shop.api.create_order` |
| Nummernkreise | zentral in `ph_core/utils/naming.py NUMMERNKREISE`; Serie dort **eintragen**, bevor eine DocType sie verwendet | `PH-S-.YY.MM.DD.-.#####` |

## 3. Pflichtbestandteile jeder DocType (außer Kindtabellen/Singles)

JSON:
- `autoname: "naming_series:"` + Feld `naming_series` (Select, hidden, default = Serie aus `NUMMERNKREISE`) **oder** `autoname: "field:<kennung>"` bei fachlichen Kennungen (Gutschein-Code, Kassen-ID) **oder** `hash` für Protokolle.
- `title_field` (meist `titel`, read_only, in `validate()` gebildet), `search_fields`, `sort_field`/`sort_order`.
- `track_changes: 1`; bei personenbezogenen Daten zusätzlich `track_seen: 1`.
- `status` (Select) + `states` (Farben) + `in_standard_filter: 1` auf status/art/zugewiesen_an.
- Zeitstempel: `creation`/`modified` sind Frappe-Standard; fachliche Zeitpunkte als eigene Felder (`eingang`, `bezahlt_am`, `versendet_am`).
- Abschnitt „System“ (collapsible) für `idempotency_key` (unique, read_only), `ip_hash`, `quelle`.
- `links` (Dashboard-Verknüpfungen) zu Folgedokumenten.
- `permissions` nach Matrix (s. 5); generieren mit `python ph_core/ph_core/utils/berechtigungen.py <Bereich>`.
- `description` (ein Satz: wofür).
- Buchungsrelevante Belege (Rechnung, Gutschrift, Kassenbeleg, Zahlung): `is_submittable: 1`, kein Löschen nach Submit, Storno nur per Gegenbeleg (`amend`/Gutschrift), s. ph_faktura/ph_kassa.

Controller `.py`:
```python
class PHBeispiel(Document):
    def before_insert(self): ...   # Eingang, Status
    def validate(self): ...        # Bereinigen, Titel, Regeln → frappe.throw(_("…"))
    def on_update(self): ...       # Nebenwirkungen; NIE Fehler werfen (frappe.log_error)
    def on_submit(self) / on_cancel(self)   # nur submittable
    @frappe.whitelist()
    def aktion(self, ...): self.check_permission("write"); ...   # Button-Ziel
```
Kein SQL mit f-Strings; `frappe.qb` oder `get_all`. `frappe.db.set_value`/`db_set` nur für Nebenfelder ohne Validierung.

## 4. Rollen und Standardrechte

Globale Rollen (ph_core): `PH Geschäftsführung` (liest alles, gibt frei, 2FA), `PH Backoffice-Admin` (Technik, 2FA), `PH Website Integration` (nur API, kein Desk), `PH Buchhaltung extern` (lesen Faktura/Kassa, Export).
Je App zwei Rollen in `fixtures/role.json` (bereits angelegt): `PH <Bereich> Mitarbeiter`, `PH <Bereich> Leitung`.

## 5. Berechtigungsmatrix-Vorlage

| Rolle | read | write | create | delete | submit | cancel | amend | print/email | export/report |
|---|---|---|---|---|---|---|---|---|---|
| System Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| PH Backoffice-Admin | ✓ | ✓ | ✓ | ✓ | – | – | – | ✓ | ✓ |
| PH Geschäftsführung | ✓ | – | – | – | – | – | – | ✓ | ✓ |
| PH <Bereich> Leitung | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| PH <Bereich> Mitarbeiter | ✓ | ✓ | ✓ | – | ✓ | – | – | ✓ | report ✓, export – |
| PH Website Integration | je Schnittstelle (create/read/write), nie delete | | | – | – | – | – | – | – |
| PH Buchhaltung extern | nur Faktura/Kassa: read, export, report | | | | | | | | |

`if_owner`-Rechte nicht verwenden (Teamarbeit). Feldebene über `permlevel 1` für interne Notizen/Margen (nur Leitung + Geschäftsführung).

## 6. Workflow-Vorlage

Drei Fixtures (Beispiel `ph_crm/fixtures/workflow*.json`):
1. `workflow_state.json` – `PH <Zustand>` mit `style` (Primary/Info/Success/Warning/Danger/Inverse).
2. `workflow_action_master.json` – Aktionen (global, nur neue anlegen).
3. `workflow.json` – `document_type`, `workflow_state_field: "workflow_state"`, `states[]` mit `update_field: "status"`, `update_value`, `allow_edit: <Rolle>`; `transitions[]` mit `allowed: <Rolle>`, optional `condition` (Python-Ausdruck über `doc`). `send_email_alert: 0`.
Regeln: Jeder Übergang, der Geld, Lieferung oder Kundenkommunikation auslöst, ist `Leitung`-pflichtig oder hat eine `condition`. Rückwärtsübergänge nur für Leitung. Das `status`-Feld der DocType ist `read_only` – es wird nur über Workflow oder Server-Methoden gesetzt.

## 7. Kanban

`fixtures/kanban_board.json`: `reference_doctype`, `field_name: "status"`, `columns[]` (Name = Status-Wert, `indicator`), `filters` (Endzustände ausblenden), `fields` (Kartenfelder). Ein Board je Haupt-DocType; Workspace-Shortcut mit `doc_view: "Kanban"`, `kanban_board: "<Name>"`.

## 8. Client-Scripts und Buttons

- Standard: Datei `<dt>.js` im DocType-Ordner (automatisch geladen). `Client Script`-Fixtures nur für fremde DocTypes.
- Buttons in `refresh`, nur bei `!frm.is_new()`, gruppiert unter `__("Aktionen")`; Server-Logik immer als Dokument-Methode `frm.call({method, doc: frm.doc, args})` oder `frappe.call` auf `<app>.api.*`; Eingaben über `frappe.ui.Dialog`; Rückfrage bei irreversiblen Aktionen `frappe.confirm`; danach `frm.reload_doc()`.
- Pflichtbuttons laut PLAN.md (z. B. „Rechnung erstellen“ aus PH Bestellung, „Etikett erzeugen“ aus PH Lieferschein, „Rückerstatten“ aus PH Zahlung).
- Listen: `<dt>_list.js` mit `get_indicator` und Standardfilter „offen“.
- Texte mit `__()`; keine Inline-HTML mit Nutzerdaten ohne `frappe.utils.escape_html`.

## 9. Druckformate

- Fixture `print_format.json`: `print_format_type: "Jinja"`, `standard: "Yes"`, `module`, `custom_format: 1`, `default_print_language: "de"`.
- HTML erbt **immer** `{% extends "templates/print/ph_basis.html" %}` (ph_core): Wortmarke PLATZHIRSCH (Bodoni Moda), Text Instrument Sans (Google Fonts, Rückfall Georgia/Arial), Firmenblock aus **PH Firma** (Standardfirma), TEST-Markierung im Testmodus. Blöcke: `titel`, `kopfrechts`, `inhalt`, `fuss`, `css`.
- Helfer: `ph_firma()`, `ph_betrag(cent)`, `ph_datum(d)`, `ph_einstellungen()`.
- Rechnungen: Pflichtangaben § 11 UStG (s. PLAN.md ph_faktura) – Vorlage dort.
- Bon (ph_kassa): eigene Vorlage 80 mm ohne `ph_basis.html`, mit QR-Code (RKSV).

## 10. Fremde DocTypes erweitern

Nur über `Custom Field`-Fixtures in der **eigenen** App (`fixtures/custom_field.json`, `module` = eigenes Modul, `fieldname` mit Präfix `ph_<app>_`), nie durch Ändern fremder JSONs. Link-Felder auf DocTypes anderer Apps nur, wenn die App in `required_apps` steht (Reihenfolge in PLAN.md). Vor Installation existieren Ziel-DocTypes evtl. noch nicht – in `validate()` mit `frappe.db.exists("DocType", …)` abfangen (Muster: `PH Anfrage.kontakt_anlegen`).

## 11. API-Methoden für die Website

```python
from ph_core.api import ph_api, ApiFehler, pflicht, text

@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Bestellung", r["referenz"]))
def create_order(**d): ...
```
- Nie `allow_guest=True` für Schreibzugriffe. Lesende Katalog-Methoden (heute guest in `platzhirsch_studio`) bleiben bis zur Migration dort (PLAN.md, Migration).
- Auth: API-Token des Benutzers `website@platzhirsch.studio` (Rolle `PH Website Integration`). Rate-Limit, Idempotenz (`idempotency_key`), Protokoll und Fehlerbild liefert der Decorator.
- Fehler: `raise ApiFehler("slot_taken", 409)`; Codes der Website: `invalid` 400, `forbidden` 403, `not_found`/`invalid_token` 404, `conflict`/`slot_taken` 409, `expired` 410, `outside_window` 422, `rate_limited` 429, `unavailable` 503.
- Antwort: flaches dict, Beträge in Cent, Zeiten ISO 8601; **nie** Telefon/E-Mail an Browser-nahe Endpunkte (maskieren).
- Kundenportal-Endpunkte (`ph_projekte.api.portal_*`, `ph_faktura.api.portal_*`): zusätzlich `kunde_token` (Hash in `PH Kontakt.portal_token_hash`) prüfen, Zugriff immer über `kontakt` filtern.
- Jede Methode hat einen Test in `test_<dt>.py` (Erfolg, Pflichtfeld fehlt, Idempotenz).

## 12. Dashboard Chart / Number Card / Report / Workspace

- `dashboard_chart.json`: `is_standard: 1`, `module`, `chart_type` Count/Sum/Group By, `timeseries`, `filters_json` (String!), `roles[]`.
- `number_card.json`: `is_standard: 1`, `module`, `function`, `filters_json`, `show_percentage_stats`, `roles[]`.
- Script Report: Ordner mit `.json` (`is_standard: "Yes"`, `report_type: "Script Report"`, `roles[]`), `.py` `execute(filters) → columns, data, message, chart, summary`, `.js` Filter. Query Report: `.json` mit `query` (nur SELECT, Parameter `%(name)s`).
- Workspace (einer je App): `content` als JSON-String mit header/number_card/chart/shortcut/card-Blöcken; `shortcuts`, `charts`, `number_cards`, `links` (Card Break + Link), `roles`, `sequence_id` = Nummer der App (PLAN.md). Mindestens: 3 Number Cards, 2 Charts, Kanban-Shortcut, Report-Shortcut.
- Farben: Tinte `#30373e`, Sand `#8a7a66`, Grün `#15803d`, Orange `#b45309`, Rot `#b91c1c`, Blau `#1d4ed8`.

## 13. Scheduler und Ereignisse

`scheduler_events` mit Cron in Europe/Vienna, Funktionen in `<modul>/tasks.py`, idempotent, mit `frappe.db.commit()` je Durchlauf-Einheit und `frappe.log_error` statt Ausnahme. `doc_events` in `<modul>/ereignisse.py`. Lange Arbeiten in `frappe.enqueue(..., queue="long")`.

## 14. Geheimnisse und Konfiguration

Nur `frappe.conf.get("ph_…")` aus `site_config.json`. Schlüsselnamen: `ph_stripe_secret_key`, `ph_stripe_webhook_secret`, `ph_stripe_livemode`, `ph_stripe_terminal_location`, `ph_letmeship_api_id`, `ph_letmeship_api_password`, `ph_letmeship_env`, `ph_resend_api_key`, `ph_mail_from`, `ph_website_revalidate_url`, `ph_website_revalidate_secret`, `ph_kassa_aes_key_<kassen_id>`, `ph_atrust_user`, `ph_atrust_password`, `ph_atrust_env`. Fachliche Schalter in `PH <Bereich> Einstellungen` (Single). Testdaten in Fixtures sind als solche markiert (`beispiel: 1`) und nie Geld- oder Personendaten echter Personen.

## 15. Tests

- DocType-Tests: `test_<dt>.py` mit `frappe.tests.utils.FrappeTestCase` (v15; v16 kennt zusätzlich `IntegrationTestCase`, nicht verwenden). Mindestens: Anlegen + Titel/Status, eine Validierungsregel, jeder Workflow-Endzustand, jede API-Methode (Erfolg, Fehler, Idempotenz).
- Reine Logik (Signatur, Steuer, Preise) ohne Frappe-Import in `<app>/tests/test_*.py` mit `unittest`, lauffähig per `python -m unittest` ohne Site.
- Ausführen: `bench --site <site> run-tests --app <app>`; ohne Site: `cd Backend-Import/<app> && PYTHONPATH=. python -m unittest discover -s <app>/tests -t .`.

## 16. Prüfungen vor Übergabe

```bash
python Backend-Import/tools/check.py            # py_compile, JSON-Validität, Fixture-Pflichtfelder, Geheimnis-Scan
```
Fixture-Export nach Arbeit im Desk einer Staging-Site: `bench --site <site> export-fixtures --app <app>` (Filter in hooks.py pflegen, sonst werden fremde Datensätze exportiert).

## 17. Sprache

Labels, Beschreibungen, Fehlermeldungen deutsch (Sie-Form gegenüber Kunden, neutral intern), `_()`/`__()` um jeden Text. Technische Namen ohne Umlaute. Kommentare deutsch, knapp, mit Quelle (Website-Datei oder Marktresearch-Pfad), wenn eine Regel von dort stammt.
