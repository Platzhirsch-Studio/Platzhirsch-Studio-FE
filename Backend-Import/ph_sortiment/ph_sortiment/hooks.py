# ph_sortiment/hooks.py – Platzhirsch Sortiment
# Konventionen: Backend-Import/CONVENTIONS.md · Arbeitspaket: Backend-Import/PLAN.md, WP3
app_name = "ph_sortiment"
app_title = "Platzhirsch Sortiment"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Marken, Händlerstatus/Claims, Produkte, Ausführungen, Preise mit Stand, Lieferzeiten, Herstellerbestellungen, Wareneingang"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
required_apps = ["frappe", "ph_core", "ph_crm"]  # ph_crm: Custom Field PH Anfrage Produkt.ph_sortiment_produkt, doc_events PH Anfrage

WORKFLOW_STATES = [
    "PH Geprueft", "PH Ausgelaufen",
    "PH AB erhalten", "PH AB geprueft", "PH Teilgeliefert", "PH Geliefert", "PH Hochgeladen", "PH Uebernommen", ]
WORKFLOW_ACTIONS = [
    "Prüfen", "Auslaufen lassen", "AB erfassen", "AB freigeben", "Teillieferung buchen", "Lieferung buchen", "Übernehmen", ]

# Fixtures: nur eigene Datensätze, immer mit Filter.
# Export: bench --site <site> export-fixtures --app ph_sortiment
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH Sortiment"]]},
    {"dt": "Workflow", "filters": [["document_type", "in", ["PH Produkt", "PH Herstellerbestellung", "PH Preisliste Import"]]]},
    {"dt": "Workflow State", "filters": [["name", "in", WORKFLOW_STATES]]},
    {"dt": "Workflow Action Master", "filters": [["name", "in", WORKFLOW_ACTIONS]]},
    {"dt": "Kanban Board", "filters": [["reference_doctype", "in", ["PH Produkt", "PH Herstellerbestellung"]]]},
    {"dt": "Print Format", "filters": [["module", "=", "PH Sortiment"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Sortiment"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Sortiment"]]},
    {"dt": "Custom Field", "filters": [["module", "=", "PH Sortiment"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "PH Sortiment"]]},
    {"dt": "Client Script", "filters": [["module", "=", "PH Sortiment"]]},
]

# Nach der Installation: Einstellungen, Standardkategorien (Website KATEGORIEN), idempotent.
after_install = "ph_sortiment.install.after_install"

# Dokument-Ereignisse fremder DocTypes (eigene DocTypes rufen ereignisse.website_aktualisieren im Controller).
# PH Anfrage gehört ph_crm (required_app seit 04.11.); der Handler prüft zusätzlich selbst, ob die DocType existiert.
doc_events = {
    "PH Anfrage": {"on_update": "ph_sortiment.ph_sortiment.ereignisse.anfrage_produkt_verknuepfen"},
}

# Zeitgesteuert (Europe/Vienna laut System Settings)
scheduler_events = {
    "cron": {
        "10 5 * * *": ["ph_sortiment.ph_sortiment.tasks.preisstand_pruefen"],   # Preisstand 3/6 Monate
        "0 8 * * 1-5": ["ph_sortiment.ph_sortiment.tasks.ab_erinnerung"],       # AB ausständig → ToDo Leitung
        "30 2 * * *": ["ph_sortiment.ph_sortiment.tasks.zaehler_aktualisieren"],
    }
}

website_route_rules = []
