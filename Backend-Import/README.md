# Backend-Import – Platzhirsch Backoffice als Frappe-Apps

Installierbare Frappe-Apps (v15, v16-kompatibel) für das Backoffice `backoffice.platzhirsch.studio`. **Nichts hiervon ist installiert.** Das produktive Backoffice ist nur lesend freigegeben – alles zuerst auf einer Staging-Kopie (PLAN.md M1).

| Nr. | App | Inhalt | Stand 04.11.2026 |
|---|---|---|---|
| 1 | `ph_core` | Firma, Einstellungen, alle PH-Rollen + Rollenprofile, Nummernkreis-Register, generische Workflow-Zustände/-Aktionen, API-Basis (Auth, Rate-Limit, Idempotenz, Audit, Portal-Token), Briefkopf, Druck-Basisvorlage, Mail, Website-Revalidate, Feiertage | **gebaut, Integration abgeschlossen** |
| 2 | `ph_crm` | Kontakte, Anfragen, Termine, Beratungsgespräche, Aufgaben | gebaut |
| 3 | `ph_sortiment` | Marken, Händlerstatus, Produkte, Ausführungen, Preise, Lieferanten, Herstellerbestellung, Wareneingang, Preislisten-Import | gebaut |
| 4 | `ph_projekte` | Projekt/Auftragsmappe, Planung, Renderings, Bautagebuch, Produktpass, Montage, Abnahme, Portal-API | gebaut |
| 5 | `ph_shop` | Bestellung, Gutschein, Zahlung, Stripe, Widerruf, Retoure, Anzahlung | gebaut |
| 6 | `ph_faktura` | Angebot, AB, Rechnung, Gutschrift, Mahnung, Bankimport, Eingangsrechnung, UVA, Export | gebaut |
| 7 | `ph_logistik` | Lieferschein, Packtisch, LetMeShip, Sendung, Lager, Inventur, Touren | gebaut |
| 8 | `ph_personal` | Stellen, Bewerbungen, Mitarbeiter, Zeiterfassung, Abwesenheiten | gebaut |
| 9 | `ph_marketing` | Newsletter mit DOI, Einwilligungen, Kundenreisen, Kampagnen, Events, Social | gebaut |
| 10 | `ph_kassa` | Registrierkasse RKSV (Belegkette, Signatur, DEP7, Oberfläche, Abschluss, Terminal) | gebaut |
| 11 | `ph_service` | Servicefall, Fehlercodes, Ersatzteile, Regress, Pflege-Abo, Serviceauftrag | gebaut |

Dokumente: **`PLAN.md`** (Architektur, Arbeitspakete, Migration M1–M10, Status) · **`CONVENTIONS.md`** (Regeln) · `ANFRAGEN-AN-CORE.md` (Wünsche an ph_core mit Status) · `INTEGRATION-BEFUNDE-CORE.md` (offene Befunde zwischen den Apps) · `referenz/` · `tools/check.py`.

---

## 1. Systemvoraussetzungen

| Was | Anforderung |
|---|---|
| Frappe | **v15.x** (getestet gegen v15-APIs; v16 ohne v16-only-Aufrufe lauffähig). ERPNext **nicht** installiert, nicht vorausgesetzt. |
| Python | ≥ 3.10 (Bench-Standard für v15: 3.11) |
| Node / Redis / MariaDB | wie Frappe v15 (Node 18, Redis 6+, MariaDB 10.6+) |
| PDF | **wkhtmltopdf 0.12.6 (patched Qt)** für Druckformate; Google-Fonts-Rückfall Georgia/Arial ohne Netz |
| Betriebssystem | Linux-Bench (Staging = Kopie der Produktiv-Site, PLAN.md M1) |

### Python-Abhängigkeiten (gesammelt aus allen `pyproject.toml`)

| Paket | Version | App(s) | Zweck |
|---|---|---|---|
| `stripe` | `>=10,<13` | ph_shop (pyproject), ph_kassa (Import, Terminal) | Refunds, Session-Nachlese, Terminal |
| `cryptography` | `>=41` | ph_kassa | RKSV ES256-Signatur, AES-256-CTR Umsatzzähler |
| `qrcode` | `>=7.4` | ph_kassa | QR als SVG/PNG im Bon (RKSV) |
| `requests` | – (Frappe-Abhängigkeit) | ph_core, ph_logistik, ph_marketing, ph_personal, ph_sortiment, ph_kassa | HTTP zu Website, LetMeShip, Resend, A-Trust |
| `pyqrcode` | – (Frappe-Abhängigkeit, `frappe/twofactor.py`) | ph_core `ph_qr_svg`, ph_faktura (GiroCode), ph_projekte (Produktpass) | QR als Inline-SVG |

**QR-Bibliothek vereinheitlicht:** gemeinsamer Jinja-Helfer `ph_qr_svg(text)` in ph_core nutzt **pyqrcode** (kommt mit Frappe, keine Zusatzinstallation) und fällt auf `qrcode` zurück. Befund: ph_kassa bringt `qrcode` als eigene Abhängigkeit mit (für PNG im RKSV-Bon weiterhin zulässig); ph_faktura/ph_projekte sollen ihre lokalen Varianten durch `ph_qr_svg` ersetzen (INTEGRATION-BEFUNDE-CORE.md). `bench get-app` installiert die `dependencies` der pyproject automatisch; bei Bedarf `bench pip install stripe cryptography qrcode`.

## 2. Installation (Staging) – Reihenfolge ist Pflicht

```bash
cd /pfad/zur/bench
# 1) Apps holen (lokaler Ordner; jede App hat pyproject.toml mit flit-Backend)
for app in ph_core ph_crm ph_sortiment ph_projekte ph_shop ph_faktura ph_logistik ph_personal ph_marketing ph_kassa ph_service; do
  bench get-app /pfad/zu/Backend-Import/$app
done

# 2) Installieren – in dieser Reihenfolge (required_apps, PLAN.md Abschnitt 2)
SITE=staging.platzhirsch.local
for app in ph_core ph_crm ph_sortiment ph_projekte ph_shop ph_faktura ph_logistik ph_personal ph_marketing ph_kassa ph_service; do
  bench --site $SITE install-app $app || break
done

# 3) Migration, Fixtures, Assets
bench --site $SITE migrate
bench build --app ph_core          # Desk-CSS (ph_desk.css); weitere Apps nur, wenn public/ Assets haben
bench --site $SITE clear-cache
```

Warum diese Reihenfolge: ph_core (Rollen, Workflow-Zustände, Nummernkreise) → ph_crm (PH Kontakt) → ph_sortiment (PH Produkt) → ph_projekte → ph_shop (PH Zahlung) → ph_faktura (PH Beleg Position) → ph_logistik → ph_personal → ph_marketing → ph_kassa → ph_service. Rückwärts-Verknüpfungen liefern die späteren Apps als `Custom Field`-Fixtures.

## 3. `site_config.json` – Schlüsselregister (nur Namen im Repo)

Alle Geheimnisse ausschließlich in `sites/<site>/site_config.json`, gelesen mit `frappe.conf.get(...)`. Dieselbe Liste steht in **PH Einstellungen → Schlüsselnamen**.

| Schlüssel | App | Zweck |
|---|---|---|
| `ph_stripe_secret_key` | ph_shop, ph_kassa | Stripe-API |
| `ph_stripe_webhook_secret` | ph_shop | Signatur eingehender Webhooks |
| `ph_stripe_livemode` | ph_shop, ph_kassa | `1` = Live |
| `ph_stripe_terminal_location` | ph_kassa | Terminal-Standort `tml_…` |
| `ph_resend_api_key` | ph_marketing | Newsletter-Versand (Resend) |
| `ph_mail_from` | ph_core | Absenderadresse aller Mails (optional) |
| `ph_letmeship_api_id`, `ph_letmeship_api_password`, `ph_letmeship_env` | ph_logistik | Versandlabels |
| `ph_website_revalidate_url` | ph_core | Basis-URL der Website (ohne `/revalidate`) |
| `ph_website_revalidate_secret` | ph_core | = `REVALIDATE_SECRET` der Website; Name in PH Einstellungen änderbar |
| `ph_kassa_aes_key_<kassen_id>` | ph_kassa | AES-256 je Kasse (Base64) |
| `ph_kassa_test_see_key_<see>` | ph_kassa | Test-Signaturschlüssel (PEM), nur Staging |
| `ph_atrust_user`, `ph_atrust_password`, `ph_atrust_env` | ph_kassa | A-Trust a.sign RK Online |
| `ph_meet_api_token` | ph_crm | Frappe-Meet-Site, Format `key:secret` |
| `ph_payments_link_secret` | ph_shop | = `PAYMENTS_LINK_SECRET` der Website (HMAC Anzahlungs-Links) |

Beispiel (Staging, Testwerte):
```bash
bench --site $SITE set-config ph_stripe_livemode 0
bench --site $SITE set-config ph_website_revalidate_url https://staging.platzhirsch.studio
bench --site $SITE set-config ph_website_revalidate_secret "<REVALIDATE_SECRET der Staging-Website>"
```

API-Schlüssel des Website-Benutzers `website@platzhirsch.studio` (Rolle `PH Website Integration`) erzeugt der Admin im Desk (User → API Access); die Website erhält sie als `API_KEY`/`API_SECRET` (bzw. `FRAPPE_API_KEY`/`FRAPPE_API_SECRET`).

## 4. Erster Startlauf (Checkliste nach `install-app`)

1. **Firma prüfen:** Desk → PH Firma → „MW Immobilienverwaltungs GmbH“ (von `ph_core.install` angelegt: FN 443753 d, Landesgericht Feldkirch, UID ATU70035339, Landstraße 11, 6911 Lochau). **Nachtragen:** Geschäftsführung, Telefon, Bank/IBAN/BIC (Belege, GiroCode).
2. **PH Einstellungen:** `testmodus` = an (Staging) · `api_aktiv` = aus, bis die Website umgestellt wird · Website-Revalidate-Schalter · Bundesland Vorarlberg · Betriebsruhe-Tage.
3. **Rollen** (alle aus `ph_core/fixtures/role.json`): `bench --site $SITE execute frappe.core.doctype.role.role.get_info_based_on_role --kwargs '{"role":"PH Geschäftsführung","field":"email"}'` zeigt Zuordnungen. Rollenprofile zuweisen: PH Verkauf, PH Verkaufsleitung, PH Einkauf, PH Shop und Kassa, PH Lager und Montage, PH Servicetechnik, PH Marketing, PH Buchhaltung, PH Steuerberatung, PH Geschäftsführung, PH Backoffice-Admin (User → Role Profile).
4. **Benutzer:** Inhaber mit `PH Geschäftsführung` (2FA Pflicht), Admin mit `PH Backoffice-Admin`, `website@platzhirsch.studio` (ohne Desk, API-Schlüssel erzeugen).
5. **Testmodus prüfen:** `GET /api/method/ph_core.api.health.ping` mit Token → `{"ok": true, "testmodus": 1}`; Testmail über eine Vorlage → kommt an `team_email` mit `[TEST]`.
6. **Fachliche Einstellungen je App** (Singles): PH Termin/Shop/Stripe/Faktura/Logistik/Personal/Marketing/Kassa/Service Einstellungen – jede App-README nennt Pflichtwerte.
7. **Druck:** ein Beispiel-Druckformat als PDF (Letter Head PLATZHIRSCH, Fußzeile mit UID/FN); wkhtmltopdf-Pfad in `common_site_config.json` prüfen.

## 5. Tests

```bash
# Je App auf der Staging-Site (FrappeTestCase; legt Testdaten an, danach Rollback)
for app in ph_core ph_crm ph_sortiment ph_projekte ph_shop ph_faktura ph_logistik ph_personal ph_marketing ph_kassa ph_service; do
  bench --site $SITE run-tests --app $app || break
done

# Ohne Site (reine Logik, je App)
cd Backend-Import/ph_core && PYTHONPATH=. python -m unittest discover -s ph_core/tests -t .

# Statische Prüfung aller Apps (Syntax, JSON, Fixtures, Rollen, Nummernkreise, Workspaces, Link-Ziele, Geheimnisse)
python -I Backend-Import/tools/check.py            # Warnungen = Befunde für andere Apps, Exit 0
python -I Backend-Import/tools/check.py --streng   # Warnungen als Fehler (nach Abarbeitung der Befunde)
```

## 6. Backup und Rollback

```bash
bench --site $SITE backup --with-files                       # vor jedem install-app/migrate
bench --site $SITE list-backups
# Rollback einer Site auf ein Backup:
bench --site $SITE restore sites/$SITE/private/backups/<datei>-database.sql.gz \
  --with-public-files <…>-files.tar --with-private-files <…>-private-files.tar
# Einzelne App entfernen (nur Staging; löscht deren DocTypes und Daten!):
bench --site $SITE uninstall-app ph_service --yes             # in umgekehrter Reihenfolge (11 → 1)
```
Produktion: Backup der produktiven Site ist Schritt M1; Installation dort erst nach Abnahme aller Workspaces, mit frischem Backup unmittelbar davor und Wartungsfenster (`bench --site <site> set-maintenance-mode on`).

## 7. Migrationsreihenfolge (PLAN.md Abschnitt 4)

| Schritt | Inhalt | Wer |
|---|---|---|
| M1 | Staging-Site aus Backup der Produktiv-Site; alle elf Apps installieren (Abschnitt 2) | Betreiber/Admin |
| M2 | Marken, Kategorien, Merkmale → PH Marke/Kategorie/Merkmal (`ph_sortiment/patches/import_platzhirsch_studio.py`) | ph_sortiment |
| M3 | Produkte (1.765) + Bilder + Katalogpreise → PH Produkt | ph_sortiment |
| M4 | Anfragen-Historie, Newsletter-Altbestand (ohne DOI gekennzeichnet) → PH Anfrage, PH Newsletter Abo | ph_crm, ph_marketing |
| M5 | Karriere → PH Stelle (`ph_personal/install.py`) | ph_personal |
| M6 | Shop/Zahlungen aus Website-Store + Stripe-Backfill → PH Bestellung/Gutschein/Zahlung | ph_shop |
| M7 | Kundenbetreuung-App-Fixtures → PH Mail Vorlage, PH Kundenreise, PH Event | ph_marketing |
| M8 | Service-App (Pflege, Tagebuch, Wunschliste) → ph_service, ph_projekte, ph_shop | jeweilige App |
| M9 | Website-Umstellung per Konfiguration (`SERVER`, `API_KEY`, `API_SECRET`, `PORTAL_ADAPTER=frappe`, `BOOKING_PROVIDER=frappe`, `PAYMENTS_BACKOFFICE=frappe`, …) | Website-Team |
| M10 | Alte Schreibmethoden in `platzhirsch_studio` abschalten / weiterleiten | Betreiber |

Nach M1: `bench --site $SITE migrate`, Fixtures prüfen, `run-tests --app` je App, dann M2–M8, Abnahme durch den Inhaber je Workspace, erst dann M9/M10.

## 8. Hooks zwischen PH-Apps (Konvention)

Eine App, die eine Erweiterung anbietet, deklariert in ihrer `hooks.py` eine leere Liste; andere Apps tragen dotted paths ein; der Anbieter liest `frappe.get_hooks("<name>")`. Namen: `ph_<anbieter>_<zweck>` bzw. `ph_stripe_<zweck>`.

| Hook | Anbieter | Signatur | Nutzer |
|---|---|---|---|
| `ph_stripe_art_handler` | ph_shop | `fn(event: dict) -> None` je Stripe-Ereignisart | ph_kassa (Terminal) |
| `ph_shop_rechnung_erstellen` | ph_shop | `fn(bestellung) -> str` (Name PH Rechnung) | ph_faktura |
| `ph_shop_lieferschein_erstellen` | ph_shop | `fn(bestellung) -> str` (Name PH Lieferschein) | ph_logistik |

## 9. Gemeinsame Helfer aus ph_core (Kurzreferenz)

| Aufruf | Zweck |
|---|---|
| `ph_core.api.ph_api(...)`, `ApiFehler`, `pflicht`, `text`, `portal_kontakt_pruefen(kontakt, kunde_token)` | Website-/Portal-API |
| `ph_core.utils.naming.NUMMERNKREISE`, `referenz("PT")` | Nummernkreise, Kundenreferenzen |
| `ph_core.utils.mail.sende(empfaenger, betreff, html, text=, anhaenge=, vorlage=, kontext=, sprache=, cc=, bcc=, reply_to=, absender_name=)` | Mail mit Testmodus-Umleitung |
| `ph_core.utils.website.revalidate("produkte" \| [...], sofort=False)` | Website-Cache, gedrosselt, Header `X-Revalidate-Secret` |
| `ph_core.utils.feiertage.feiertage(jahr)`, `ist_arbeitstag`, `arbeitstage(von, bis)`, `arbeitstage_addieren(d, n)`, `ist_geschlossen(d)` | Feiertage AT/Vorarlberg, Betriebsruhe, Arbeitstage |
| `ph_core.utils.zahlen.satz_text(2000)`, `anteil_cent`, `ust_aus_brutto_cent`, `betrag_text` | Steuersatz Int×100, Cent-Rechnung |
| Jinja: `ph_firma()`, `ph_einstellungen()`, `ph_betrag(cent)`, `ph_datum(d)`, `ph_satz(2000)`, `ph_qr_svg(text)` | Druckformate (erben `templates/print/ph_basis.html`) |
