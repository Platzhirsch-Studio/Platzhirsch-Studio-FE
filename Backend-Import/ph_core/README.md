# Platzhirsch Core (`ph_core`)

Gemeinsame Basis aller PH-Apps. Muss **zuerst** installiert sein. Stand 04.11.2026 (Integration abgeschlossen).

| Baustein | Datei |
|---|---|
| Firma (Rechtsträger MW Immobilienverwaltungs GmbH, FN 443753 d, LG Feldkirch, UID ATU70035339 – Vorgabe in `install.py`) | `ph_core/ph_core/doctype/ph_firma/` |
| Einstellungen (Single: API-Schalter, Ratenbegrenzung, Idempotenz, Testmodus, Website-Revalidate, Feiertage/Betriebsruhe, Schlüsselregister) | `ph_core/ph_core/doctype/ph_einstellungen/`, Kindtabelle `ph_betriebsruhe/` |
| API-Audit und Idempotenz-Speicher | `ph_core/ph_core/doctype/ph_api_protokoll/` |
| Decorator `ph_api` (Auth, Rate-Limit, Idempotenz, Protokoll, einheitliches Fehlerbild auch bei GET), `portal_kontakt_pruefen` | `ph_core/api/__init__.py` |
| Verbindungstest `ph_core.api.health.ping` | `ph_core/api/health.py` |
| Nummernkreis-Register `NUMMERNKREISE` (58 DocTypes), `GETEILTE_SERIEN`, Kundenreferenzen | `ph_core/utils/naming.py` |
| Berechtigungsmatrix-Vorlage | `ph_core/utils/berechtigungen.py` |
| Jinja-Hilfen Druck: `ph_firma`, `ph_betrag`, `ph_datum`, `ph_einstellungen`, `ph_satz`, `ph_qr_svg` | `ph_core/utils/druck.py` |
| Zahlen ohne Frappe: `satz_text`, `satz_aus_prozent`, `anteil_cent`, `ust_aus_brutto_cent`, `betrag_text` | `ph_core/utils/zahlen.py` |
| Mailversand `sende(...)` mit Testmodus-Umleitung, Vorlagen (`vorlage`, `kontext`, `sprache`), `cc`/`bcc`/`reply_to`/`absender_name`, Anhänge im frappe.sendmail-Format | `ph_core/utils/mail.py` |
| Website-Cache `revalidate(pfad \| liste, sofort=False)` – gedrosselt, Queue, Header `X-Revalidate-Secret` | `ph_core/utils/website.py` |
| Feiertage AT/Vorarlberg, Betriebsruhe, `arbeitstage`, `arbeitstage_addieren`, `ist_geschlossen` | `ph_core/utils/feiertage.py` |
| Basis-Druckvorlage mit Wortmarke PLATZHIRSCH (alle App-Druckformate erben sie) | `ph_core/templates/print/ph_basis.html` |
| **Alle 27 PH-Rollen** (global + je Bereich Mitarbeiter/Leitung + PH Montage, PH Techniker, PH Personal Selbstservice) | `ph_core/fixtures/role.json` |
| Rollenprofile (Benutzergruppen-Vorlagen: PH Verkauf, PH Einkauf, PH Shop und Kassa, …) | `ph_core/fixtures/role_profile.json` |
| Generische Workflow States (23) und Workflow Action Master (28) zur Wiederverwendung | `ph_core/fixtures/workflow_state.json`, `workflow_action_master.json` |
| Briefkopf `PLATZHIRSCH` (Letter Head) | `ph_core/fixtures/letter_head.json` |
| Workspace „PH Zentrale“ (sequence 1) mit Chart und Number Cards | `ph_core/fixtures/workspace.json`, `dashboard_chart.json`, `number_card.json` |

## Installation (Staging)

```bash
bench get-app /pfad/zu/Backend-Import/ph_core
bench --site <site> install-app ph_core
bench --site <site> migrate
bench --site <site> run-tests --app ph_core
```

`after_install` (auch `after_migrate`, idempotent) legt die Firma mit Stammdaten, die Einstellungen und den Benutzer `website@platzhirsch.studio` an (ohne Schlüssel) und trägt bei einer vorhandenen Firma nur leere Felder nach. Danach im Desk: Bank/IBAN/BIC und Geschäftsführung in **PH Firma**; in **PH Einstellungen** `api_aktiv` erst auf der Produktiv-Site einschalten und `testmodus` ausschalten. Vollständige Anleitung für alle elf Apps: `Backend-Import/README.md`.

## Verwendung aus anderen Apps

```python
from ph_core.api import ph_api, ApiFehler, pflicht, text, portal_kontakt_pruefen
from ph_core.utils.naming import NUMMERNKREISE, referenz
from ph_core.utils.mail import sende
from ph_core.utils.website import revalidate
from ph_core.utils.feiertage import feiertage, ist_arbeitstag, arbeitstage, arbeitstage_addieren, ist_geschlossen
from ph_core.utils.zahlen import satz_text, anteil_cent, ust_aus_brutto_cent

sende("kunde@example.org", None, None, vorlage="PH Lieferbestätigung", kontext={"doc": doc}, sprache="en",
      anhaenge=[{"fname": "LS-2026-00001.pdf", "fcontent": pdf}], cc=["einkauf@platzhirsch.studio"],
      referenz_doctype=doc.doctype, referenz_name=doc.name)
revalidate(["produkte", "marken"])          # nach Commit, je Pfad höchstens alle 30 s
arbeitstage_addieren(date.today(), 10)       # Liefertermin in 10 Arbeitstagen (Vorarlberg, Betriebsruhe)
```

Druckformate: `{% extends "templates/print/ph_basis.html" %}` und `{{ ph_satz(pos.ust_satz_promille) }}`, `{{ ph_qr_svg(url, 22) }}`.

### API-Fehlerbild (auch GET)

`ApiFehler(code, http_status, meldung, daten)` → `{"code", "message", **daten}`; Frappe-Ausnahmen: ValidationError → 400 `invalid`, PermissionError → 403 `forbidden`, DoesNotExistError → 404 `not_found`, DuplicateEntry/TimestampMismatch → 409 `conflict`, sonst 500 `internal`. Der HTTP-Status wird über `frappe.local.response["http_status_code"]` gesetzt und von `frappe.utils.response.build_response` methodenunabhängig übernommen – GET-Methoden ohne Body (`methods=["GET"]`) erhalten denselben Status.

## Hooks zwischen PH-Apps

ph_core bietet keine eigenen Hooks an; Konvention und Register (`ph_stripe_art_handler`, `ph_shop_rechnung_erstellen`, `ph_shop_lieferschein_erstellen`) stehen in `hooks.py` (Kommentarblock) und `Backend-Import/README.md` Abschnitt 8.

## Geheimnisse

Nie in Dateien oder DocTypes. Schlüsselregister in `Backend-Import/README.md` Abschnitt 3 und in PH Einstellungen → Schlüsselnamen:

```
ph_stripe_secret_key, ph_stripe_webhook_secret, ph_stripe_livemode, ph_stripe_terminal_location,
ph_resend_api_key, ph_mail_from,
ph_letmeship_api_id, ph_letmeship_api_password, ph_letmeship_env,
ph_website_revalidate_url, ph_website_revalidate_secret,
ph_kassa_aes_key_<kassen_id>, ph_kassa_test_see_key_<see>, ph_atrust_user, ph_atrust_password, ph_atrust_env,
ph_meet_api_token, ph_payments_link_secret
```

## Tests ohne Site

```bash
cd Backend-Import/ph_core && PYTHONPATH=. python -m unittest ph_core.tests.test_naming ph_core.tests.test_feiertage ph_core.tests.test_zahlen
```
