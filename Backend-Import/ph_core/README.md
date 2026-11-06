# Platzhirsch Core (`ph_core`)

Gemeinsame Basis aller PH-Apps. Muss **zuerst** installiert sein. Stand 04.11.2026 (Integration abgeschlossen).

| Baustein | Datei |
|---|---|
| Firma (Rechtsträger MW Immobilienverwaltungs GmbH, FN 443753 d, LG Feldkirch, UID ATU70035339 – Vorgabe in `install.py`) | `ph_core/ph_core/doctype/ph_firma/` |
| Einstellungen (Single: API-Schalter, Ratenbegrenzung, Idempotenz, Testmodus, Website-Revalidate, Feiertage/Betriebsruhe, Schlüsselregister) | `ph_core/ph_core/doctype/ph_einstellungen/`, Kindtabelle `ph_betriebsruhe/` |
| API-Audit und Idempotenz-Speicher | `ph_core/ph_core/doctype/ph_api_protokoll/` |
| Decorator `ph_api` (Auth, Rate-Limit je Client, Idempotenz, Protokoll, einheitliches Fehlerbild auch bei GET), `gast_rate_limit` (Gast-Lesemethoden), `portal_kontakt_pruefen` (PH Portal Sitzung → Altfeld) | `ph_core/api/__init__.py`, `ph_core/utils/ratelimit.py`, `ph_core/utils/portal.py` |
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
| **PH Geraet** – registrierte Arbeitsplatz-Geräte (Kassa-iPad, Packtisch, Mobil), Token nur als SHA-256 | `ph_core/ph_core/doctype/ph_geraet/` |
| Bediener-PIN/Kurzname/Standort am Frappe-User (Custom Fields `ph_core_*`) | `ph_core/fixtures/custom_field.json` |
| Token/PIN-Logik ohne Frappe (`neues_token`, `token_hash`, `pin_hash`, `pin_passt`, `pin_pruefen`) | `ph_core/utils/geraete.py` |
| Backoffice-API: Geräte, Bediener, globale Suche, Aktivitätsstrom | `ph_core/api/geraete.py`, `bediener.py`, `suche.py`, `aktivitaet.py` |

## Installation (Staging)

```bash
bench get-app /pfad/zu/Backend-Import/ph_core
bench --site <site> install-app ph_core
bench --site <site> migrate
bench --site <site> run-tests --app ph_core
```

`after_install` (auch `after_migrate`, idempotent) legt die Firma mit Stammdaten, die Einstellungen und den Benutzer `website@platzhirsch.studio` an (ohne Schlüssel) und trägt bei einer vorhandenen Firma nur leere Felder nach. Danach im Desk: Bank/IBAN/BIC und Geschäftsführung in **PH Firma**; in **PH Einstellungen** `api_aktiv` erst auf der Produktiv-Site einschalten und `testmodus` ausschalten. Vollständige Anleitung für alle elf Apps: `Backend-Import/README.md`.

### `api_aktiv` – Install- und Livegang-Hinweis

- **Standard bleibt 0** (Feld-Default und `after_install`). Solange 0, antwortet jede Website-Methode mit `@ph_api` (Rolle PH Website Integration) **503 `unavailable`**; Gast-Lesemethoden (Katalog `ph_sortiment.api.*`, `ph_personal.api.karriere_data`) und Desk-Methoden (`intern=True`) sind davon nicht betroffen.
- **Staging:** `deploy/staging/setup.sh` setzt über `deploy/staging/scripts/ph_staging.py konfigurieren()` nach der Installation `testmodus=1`, `api_aktiv=1`. Mit `produktion=True` setzt dasselbe Skript `api_aktiv=0` (bleibt aus bis zur Freigabe). Von Hand nur, wenn ohne Setup installiert wurde.
- **Produktion:** `deploy/CHECKLISTE-LIVEGANG.md` Punkt „PH Einstellungen: `testmodus` aus, `api_aktiv` an“ – erst nach Token für `website@platzhirsch.studio`, Mailversand und Abnahme der Staging-Gruppen (`Marktresearch/digital/backoffice/60-website-backend-umstellung.md` Abschnitt 4, Stufe 0: `ph_core.api.health.ping` mit Token = 200).
- Zurück in den Wartungsmodus: `api_aktiv=0` (wirkt sofort, Einstellungen-Cache wird beim Speichern geleert).

### Ratenbegrenzung je Client

Früher teilte sich der gesamte Website-Verkehr (ein Benutzer `website@…`) je Methode einen Eimer. Jetzt (Logik `ph_core/utils/ratelimit.py`, Fenster 60 s, Redis):

| Aufrufer | Zähler-Schlüssel | Grenze (PH Einstellungen) |
|---|---|---|
| Rolle PH Website Integration mit Header `X-PH-Client: <sha256(besucher-ip) hex, 16–64 Zeichen>` | Methode + Benutzer + Header (gekürzt auf 32) | `api_rate_limit_pro_minute` (Standard 120) bzw. `limit_pro_minute` der Methode (Termine 30–120) |
| Token-Benutzer ohne gültigen Header, Desk-Benutzer | Methode + Benutzer + IP-Hash | wie oben |
| zusätzlich je Methode + Benutzer über alle Clients | – | `api_rate_limit_gesamt_pro_minute` (Standard 2400, 0 = aus) – gegen gefälschte Header |
| Gast-Lesemethoden (`@gast_rate_limit`: Katalog, 3D-Modelle, Wechselkurs, Karriere) | Methode + IP-Hash (ein Gast-Header wird ignoriert) | `api_rate_limit_gast_pro_minute` (Standard 600, 0 = aus) |

Über der Grenze: 429 `{"code": "rate_limited"}`. Die Website muss `X-PH-Client` noch senden (Website-Lücke, `src/lib/backend/*`); ohne Header verhält sie sich wie bisher (Eimer je Benutzer + Server-IP). Gast-Methoden: `@frappe.whitelist(allow_guest=True, methods=["GET"])` außen, `@gast_rate_limit` innen.

### Kundenportal: mehrere Sitzungen (`portal_kontakt_pruefen`)

`portal_kontakt_pruefen(kontakt, kunde_token)` (ph_faktura, ph_service, ph_kundenkarte, ph_projekte) prüft nach `portal_aktiv` zuerst eine **PH Portal Sitzung** (ph_projekte, mehrere aktive Sitzungen je Kontakt), erst danach den Altwert `PH Kontakt.portal_token_hash`:

1. **Hook `ph_portal_token_pruefen`** (bevorzugt): eine App trägt in `hooks.py` `ph_portal_token_pruefen = ["ph_projekte.api.basis.sitzung_pruefen"]` ein. Signatur `(kontakt, kunde_token)` → dict/True = gültige Sitzung, None = kein Sitzungs-Token, Fehler als `ApiFehler` (`invalid_token` 404, `expired` 410). Vorteil: Aktivierung, `letzter_zugriff` und Bereinigung bleiben in ph_projekte. **Offen:** Eintrag in `ph_projekte/hooks.py` (Schreibbereich des ph_projekte-Agenten).
2. **Ohne Hook, aber mit DocType PH Portal Sitzung:** rein lesende Prüfung in ph_core (`ph_core/utils/portal.py`: gleicher Kontakt, Status Angefordert/Aktiv, `ablauf_am` nicht überschritten). Abgelaufen → 410 `expired`, widerrufen/fremd → 404 `invalid_token`.
3. Sonst Rückfall `sha256(kunde_token) == portal_token_hash` (wie bisher).

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

## Backoffice-Schnittstellen (Next.js `backoffice/`, Entscheidungen Nr. 48/49)

Alle Methoden tragen `@ph_api(intern=True, …)`: kein Website-Wartungsschalter (`api_aktiv`), Guest → 403, Rate-Limit je Methode/Benutzer, PH API Protokoll, Fehlerbild `{"code", "message", …}`. Aufruf mit der Frappe-Sitzung des Mitarbeiters (sid) oder dem Service-Token des Backoffice-Benutzers. Zeiten ISO 8601, Listen als JSON-Array; `doctypes`/`bereiche` nehmen Liste, JSON-String oder kommagetrennten Text.

| Methode (`POST /api/method/…`) | Parameter | Antwort | Fehlercodes |
|---|---|---|---|
| `ph_core.api.geraete.register_device` | `geraetename, typ (Kassa/Packtisch/Mobil/Backoffice), standort?, arbeitsplatz? (kassa/packtisch/montage/technik/backoffice), kasse?, drucker?, drucker_typ? (Bon 80 mm/A4/Etikett), notizen?` – Rolle System Manager / PH Backoffice-Admin / PH … Leitung | `{geraet, token (einmalig!), geraetename, typ, arbeitsplatz, standort, kasse, drucker, drucker_typ, aktiv, gesperrt_grund, zuletzt_gesehen}` | invalid 400, forbidden 403, rate_limited 429 |
| `ph_core.api.geraete.verify_device` | `token` | wie oben ohne `token`; setzt `zuletzt_gesehen` (≤ 1×/60 s) | invalid 400, invalid_token 404, forbidden 403 `{gesperrt: true, geraet}` |
| `ph_core.api.geraete.touch_device` | `token` | `{ok, geraet, zuletzt_gesehen}` | wie verify_device |
| `ph_core.api.geraete.list_devices` (GET/POST) | `nur_aktive?=0, standort?, arbeitsplatz?` – Leserecht PH Geraet | Liste wie verify_device + `token_vorhanden, registriert_am` | forbidden 403 |
| `ph_core.api.bediener.set_pin` | `pin (4–6 Ziffern, keine Folge/gleiche Ziffern), user? (fremd nur Admin/Leitung), standort?, kurzname?` | `{ok, user, pin_gesetzt_am}` | invalid 400 `{field: "pin"}`, forbidden 403, not_found 404 |
| `ph_core.api.bediener.verify_pin` | `email, pin, geraet_token` | `{user, name, kurzname, roles: [...], standort, geraet, arbeitsplatz}` | invalid 400, invalid_token 404, not_found 404, forbidden 403 (deaktiviert/Gerät gesperrt), invalid_pin 401 `{verbleibend}`, rate_limited 429 `{sekunden}` (5 Fehlversuche → 15 min je Benutzer+Gerät) |
| `ph_core.api.bediener.list_operators` (GET/POST) | `geraet_token, alle_standorte?=0` | Liste `{user, name, kurzname, roles, standort}` – aktive Desk-Benutzer mit PIN und Rolle PH Kassa */PH Logistik */PH Montage/PH Techniker (oder Admin) am Standort des Geräts | invalid_token 404, forbidden 403 |
| `ph_core.api.suche.global_search` (GET/POST) | `q (≥ 2 Zeichen), limit?=20 (≤ 50), doctypes?` | Liste `{doctype, name, titel, status, geaendert, href_hinweis ("/d/<slug>/<name>"), bereich}` – neueste zuerst, dedupliziert, nur lesbare DocTypes (`SUCH_DOCTYPES`/`BEREICHE` in `suche.py`) | invalid 400 |
| `ph_core.api.aktivitaet.recent_activity` (GET/POST) | `limit?=30 (≤ 100), bereiche?` (Schlüssel aus `BEREICHE`) | Liste `{zeit, benutzer, benutzer_name, doctype, name, titel, art (Angelegt/Geaendert/Kommentar/Workflow/Zugewiesen/Anhang/E-Mail/Geloescht), zusammenfassung (nur Feld-Labels, keine Werte/Texte/Adressen), href_hinweis, bereich}` | – |

Dokumentmethoden `PH Geraet` (Desk-Buttons, `run_doc_method`): `registrieren()` → `{token, geraet, arbeitsplatz}` (nur ohne Token), `token_erneuern()`, `sperren(grund)`, `entsperren()`. Feld `kasse` ist Data (Kassenidentifikationsnummer), weil ph_kassa nach ph_core installiert wird; `validate()` prüft den Datensatz, sobald `PH Kasse` existiert.

Datenschutz: `token_hash` und `ph_core_pin_hash` verlassen den Server nie; `pin_hash` ist PBKDF2-HMAC-SHA256 (200 000 Iterationen, 16 Byte Salz); Geräte-Token 32 Byte `secrets.token_urlsafe`.

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
cd Backend-Import/ph_core && PYTHONPATH=. python -I -m unittest discover -s ph_core/tests -t .
```

(`test_naming`, `test_feiertage`, `test_zahlen`, `test_geraete`, `test_ratelimit`, `test_portal`; `test_ph_firma` überspringt sich ohne Bench.)
