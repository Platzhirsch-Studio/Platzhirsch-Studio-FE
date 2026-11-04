# ph_kassa/hooks.py – Platzhirsch Kassa
# Konventionen: Backend-Import/CONVENTIONS.md · Arbeitspaket: Backend-Import/PLAN.md
app_name = "ph_kassa"
app_title = "Platzhirsch Kassa"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Registrierkasse Showroom nach RKSV 2016 / BAO § 131b: Belegkette, Signatur (A-Trust), DEP7-Export, Kassen-Oberfläche, Tagesabschluss, Stripe Terminal"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
required_apps = ["frappe", "ph_core", "ph_crm", "ph_sortiment", "ph_shop", "ph_faktura"]

# Fixtures: nur eigene Datensätze, immer mit Filter (nie den ganzen Doctype exportieren).
# Export: bench --site <site> export-fixtures --app ph_kassa
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH Kassa"]]},
    {"dt": "Workflow", "filters": [["document_type", "in", []]]},            # Bau-Agent: eigene Doctypes eintragen
    {"dt": "Workflow State", "filters": [["name", "in", []]]},               # Bau-Agent: eigene Zustände eintragen
    {"dt": "Workflow Action Master", "filters": [["name", "in", []]]},       # Bau-Agent: eigene Aktionen eintragen
    {"dt": "Kanban Board", "filters": [["reference_doctype", "in", []]]},    # Bau-Agent: eigene Doctypes eintragen
    {"dt": "Print Format", "filters": [["module", "=", "PH Kassa"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Kassa"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Kassa"]]},
    {"dt": "Custom Field", "filters": [["module", "=", "PH Kassa"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "PH Kassa"]]},
    {"dt": "Client Script", "filters": [["module", "=", "PH Kassa"]]},
]

# Dokument-Ereignisse anderer Apps (z. B. {"PH Bestellung": {"on_update": "ph_kassa.ph_kassa.ereignisse.bestellung_aktualisiert"}})
doc_events = {}

# Zeitgesteuerte Jobs (Europe/Vienna laut System Settings), z. B. {"cron": {"*/15 * * * *": ["ph_kassa.ph_kassa.tasks.abgleich"]}}
scheduler_events = {}

# Keine eigenen Website-Routen: die Website ist Next.js (platzhirsch.studio).
website_route_rules = []

# Nach der Installation: Standarddaten anlegen (idempotent).
# after_install = "ph_kassa.install.after_install"

# ── WP10a (RKSV-Kern: Belegkette, Signatur, DEP, Ausfall) – Beginn ──────────────────────────────
# Nur dieser Block gehört WP10a. Scheduler (Europe/Vienna): Monats-/Jahresbeleg am Monatsletzten 23:50,
# Erinnerungen (Startbeleg/Jahresbeleg prüfen, DEP, Meldepflicht) 08:00, SEE-Ausfall stündlich prüfen.
scheduler_events.setdefault("cron", {}).update(
    {
        "50 23 * * *": ["ph_kassa.rksv.tasks.monats_und_jahresbelege"],
        "0 8 * * *": ["ph_kassa.rksv.tasks.erinnerungen"],
        "15 * * * *": ["ph_kassa.rksv.tasks.ausfall_ueberwachen"],
    }
)
# Fixtures: Custom Field PH Zahlung.kassenbeleg liegt in fixtures/custom_field.json (Filter module = PH Kassa oben).
# ── WP10a – Ende ─────────────────────────────────────────────────────────────────────────────────

# ── WP10b (Kassa-Oberfläche, Druck, Tagesabschluss, Kassenbuch, Terminal, Workspace) – Beginn ────
# Nur dieser Block gehört WP10b. Merge-sicher geschrieben (setdefault/update), damit der WP10a-Block
# oben unberührt bleibt. Dateien: ph_kassa/ph_kassa/page/ph_kassa/, print_format/, druck/, logik/,
# terminal.py, schnittstellen.py, auswertung.py, jinja.py, DocTypes PH Kassenabschluss (+ Zaehlung,
# Steuersatz), PH Kassenbuch, PH Terminal, PH Kassa Einstellungen, fixtures workspace/number_card/dashboard_chart.

# Sperre: nach „Abgeschlossen“ keine Belege für Kasse+Tag, bis die Leitung den Abschluss öffnet.
doc_events.setdefault("PH Kassenbeleg", {}).setdefault("before_submit", [])
if isinstance(doc_events["PH Kassenbeleg"]["before_submit"], str):
    doc_events["PH Kassenbeleg"]["before_submit"] = [doc_events["PH Kassenbeleg"]["before_submit"]]
doc_events["PH Kassenbeleg"]["before_submit"].append("ph_kassa.ph_kassa.doctype.ph_kassenabschluss.ph_kassenabschluss.sperre_pruefen")

# Jinja-Hilfen der Druckformate (Bon 80 mm, A4, Abschlussprotokoll): {{ ph_kassa_einstellungen() }}, {{ ph_kassa_qr_svg(code, mm) }}
jinja = globals().get("jinja") or {}
jinja.setdefault("methods", []).extend(["ph_kassa.jinja.ph_kassa_einstellungen", "ph_kassa.jinja.ph_kassa_qr_svg"])

# Stripe-Webhook (ph_shop.stripe_webhook): PaymentIntents mit metadata.art == "kassa" (Terminal) landen hier.
ph_stripe_art_handler = [{"kassa": "ph_kassa.terminal.stripe_ereignis"}]

# Kein Workflow-Fixture für PH Kassenabschluss: Zustände (Offen → Gezaehlt → Abgeschlossen → Korrigiert)
# setzen Server-Methoden (zaehlen/abschliessen/oeffnen), damit die Workflow-Fixtures frei für WP10a bleiben.
# ── WP10b – Ende ─────────────────────────────────────────────────────────────────────────────────
