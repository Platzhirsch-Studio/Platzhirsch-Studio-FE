# ph_service/hooks.py – Platzhirsch Service (Reklamation/Servicefall nach Vorbild SHD resy).
# Konventionen: Backend-Import/CONVENTIONS.md · Arbeitspaket: Backend-Import/PLAN.md, WP11
app_name = "ph_service"
app_title = "Platzhirsch Service"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Reklamation und Servicefall: Fehlercodes, Fristen (VGG/ABGB), Fotos, Serviceeinsätze, Ersatzteile, Lieferantenregress, Pflege-/Wartungsverträge, Statistik"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
# ph_shop ist über ph_faktura ohnehin installiert; hier ausdrücklich, weil PH Servicefall.bestellung darauf verlinkt.
required_apps = ["frappe", "ph_core", "ph_crm", "ph_sortiment", "ph_projekte", "ph_shop", "ph_faktura", "ph_logistik"]

WORKFLOW_DOCTYPES = ["PH Servicefall", "PH Lieferantenregress", "PH Pflege Abo", "PH Serviceauftrag"]
WORKFLOW_STATES = [
    "PH Gemeldet", "PH Entscheidung", "PH In Bearbeitung", "PH Einsatz geplant", "PH Geschlossen", "PH Regress offen", "PH Regress gemeldet", "PH Regress anerkannt", "PH Regress abgelehnt", "PH Regress verrechnet",
    "PH Angefragt", "PH Angeboten", "PH Gekuendigt", "PH Beauftragt", "PH Eingelagert", "PH Zurueckgebracht", ]
WORKFLOW_ACTIONS = [
    "Prüfung abschließen", "Entscheidung treffen", "In Bearbeitung nehmen", "Einsatz planen", "Schließen", "Beim Lieferanten melden", "Regress anerkannt", "Regress abgelehnt", "Regress verrechnet",
    "Anbieten", "Kündigen", "Abholen", "Einlagern", "In Arbeit nehmen", "Zurückbringen", ]

# Fixtures: nur eigene Datensätze, immer mit Filter.
# Export: bench --site <site> export-fixtures --app ph_service
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH Service"]]},
    {"dt": "Workflow", "filters": [["document_type", "in", WORKFLOW_DOCTYPES]]},
    {"dt": "Workflow State", "filters": [["name", "in", WORKFLOW_STATES]]},
    {"dt": "Workflow Action Master", "filters": [["name", "in", WORKFLOW_ACTIONS]]},
    {"dt": "Kanban Board", "filters": [["reference_doctype", "in", ["PH Servicefall", "PH Serviceeinsatz", "PH Serviceauftrag"]]]},
    {"dt": "Print Format", "filters": [["module", "=", "PH Service"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Service"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Service"]]},
    {"dt": "Email Template", "filters": [["name", "like", "PH Service %"]]},
    {"dt": "Custom Field", "filters": [["module", "=", "PH Service"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "PH Service"]]},
    {"dt": "Client Script", "filters": [["module", "=", "PH Service"]]},
]

# Nach der Installation: Fehlerkatalog, Einstellungen (idempotent).
after_install = "ph_service.install.after_install"

# Ereignisse eigener und fremder DocTypes (ph_service/ph_service/ereignisse.py).
doc_events = {
    "PH Serviceeinsatz": {"on_update": "ph_service.ph_service.ereignisse.serviceeinsatz_aktualisiert"},
    "PH Lieferantenregress": {"on_update": "ph_service.ph_service.ereignisse.regress_aktualisiert"},
    "Comment": {"after_insert": "ph_service.ph_service.ereignisse.kommentar_eingefuegt"},
}

# Zeitgesteuert (Europe/Vienna laut System Settings), Funktionen in ph_service/ph_service/tasks.py.
scheduler_events = {
    "cron": {
        # 06:30 täglich: Fristenwarnung (Gewährleistung/Regress), Reaktionsfrist, Eskalation ohne Bewegung
        "30 6 * * *": ["ph_service.ph_service.tasks.fristen_pruefen", "ph_service.ph_service.tasks.eskalation"],
        # 06:45 täglich: Wartungs-/Pflegeerinnerungen und Nachkauf-Hinweise
        "45 6 * * *": ["ph_service.ph_service.tasks.wartungserinnerungen"],
        # 07:00 Mo: Wochenübersicht der Einsätze an die Leitung
        "0 7 * * 1": ["ph_service.ph_service.tasks.wochenuebersicht"],
    }
}

# Keine eigenen Website-Routen: die Website ist Next.js (platzhirsch.studio).
website_route_rules = []
