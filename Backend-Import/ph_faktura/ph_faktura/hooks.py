# ph_faktura/hooks.py – Platzhirsch Faktura (WP6)
# Konventionen: Backend-Import/CONVENTIONS.md · Arbeitspaket: Backend-Import/PLAN.md, WP6
app_name = "ph_faktura"
app_title = "Platzhirsch Faktura"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Angebot, Auftragsbestätigung, Anzahlungs- und Schlussrechnung, Gutschrift, Mahnung, Zahlungsabgleich (CAMT.053), Eingangsrechnungen, UVA-Zuarbeit, Export BMD/DATEV"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
required_apps = ["frappe", "ph_core", "ph_crm", "ph_sortiment", "ph_projekte", "ph_shop"]

WORKFLOW_DOCTYPES = ["PH Angebot", "PH Auftragsbestaetigung", "PH Rechnung", "PH Eingangsrechnung"]
WORKFLOW_STATES = [
    "PH Angenommen", "PH Ersetzt",
    "PH In Bestellung", "PH Abgerechnet", "PH Gestellt", "PH Teilbezahlt", "PH Ueberfaellig", "PH Gemahnt", "PH Uneinbringlich",
    "PH Erfasst", "PH Sachlich geprueft", ]
WORKFLOW_ACTIONS = [
    "Annehmen", "Ablaufen lassen", "Neue Version", "In Bestellung geben", "Teillieferung melden", "Lieferung melden",
    "Stellen", "Als uneinbringlich buchen", "Sachlich pruefen", "Als bezahlt buchen", "Zurueck an Erfassung",
]

# Fixtures: nur eigene Datensätze, immer mit Filter. Export: bench --site <site> export-fixtures --app ph_faktura
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH Faktura"]]},
    {"dt": "Workflow", "filters": [["document_type", "in", WORKFLOW_DOCTYPES]]},
    {"dt": "Workflow State", "filters": [["name", "in", WORKFLOW_STATES]]},
    {"dt": "Workflow Action Master", "filters": [["name", "in", WORKFLOW_ACTIONS]]},
    {"dt": "Kanban Board", "filters": [["reference_doctype", "in", ["PH Angebot", "PH Rechnung", "PH Eingangsrechnung"]]]},
    {"dt": "Print Format", "filters": [["module", "=", "PH Faktura"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Faktura"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Faktura"]]},
    {"dt": "Custom Field", "filters": [["module", "=", "PH Faktura"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "PH Faktura"]]},
    {"dt": "Client Script", "filters": [["module", "=", "PH Faktura"]]},
]

after_install = "ph_faktura.install.after_install"

# Jinja-Hilfen für Druckformate (zusätzlich zu ph_core: ph_firma, ph_betrag, ph_datum, ph_einstellungen)
jinja = {
    "methods": [
        "ph_faktura.druck.ph_epc_qr",
        "ph_faktura.druck.ph_bankkonto",
        "ph_faktura.druck.ph_kontoauszug",
        "ph_faktura.druck.ph_zahlungsplan_text",
        "ph_faktura.druck.ph_faktura_einstellungen",
    ]
}

# Gemeinsame Desk-Hilfen (Summenblock, Dialoge) für alle Faktura-Formulare
app_include_js = ["/assets/ph_faktura/js/ph_faktura.js"]

# Zahlungen aus ph_shop/ph_kassa (PH Zahlung) auf Rechnungen verbuchen
doc_events = {
    "PH Zahlung": {
        "on_submit": "ph_faktura.ph_faktura.ereignisse.zahlung_gebucht",
        "on_cancel": "ph_faktura.ph_faktura.ereignisse.zahlung_storniert",
    },
    "PH Faktura Einstellungen": {"on_update": "ph_faktura.ph_faktura.ereignisse.einstellungen_geaendert"},
    "PH Mahnwesen Einstellungen": {"on_update": "ph_faktura.ph_faktura.ereignisse.einstellungen_geaendert"},
}

# Zeitgesteuert (Europe/Vienna laut System Settings)
scheduler_events = {
    "cron": {
        "0 6 * * *": ["ph_faktura.ph_faktura.tasks.ueberfaellig_pruefen", "ph_faktura.ph_faktura.tasks.angebote_ablaufen"],
        "30 6 * * 1-5": ["ph_faktura.ph_faktura.tasks.mahnlauf_automatisch"],
        "0 7 * * 1": ["ph_faktura.ph_faktura.tasks.oss_schwelle_pruefen"],
        "15 6 1 * *": ["ph_faktura.ph_faktura.tasks.uva_entwurf_monat"],
        "0 8 5 * *": ["ph_faktura.ph_faktura.tasks.export_erinnerung"],
    }
}

website_route_rules = []
