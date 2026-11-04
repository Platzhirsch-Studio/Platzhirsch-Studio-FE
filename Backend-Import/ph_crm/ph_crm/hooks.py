# ph_crm/hooks.py – Platzhirsch CRM: Kontakte, Anfragen (Muster-DocType), Termine (Website-Buchung B3),
# Beratungsgespräche, Aufgaben, Kommunikation.
# Konventionen: Backend-Import/CONVENTIONS.md · Arbeitspaket: Backend-Import/PLAN.md, WP2
app_name = "ph_crm"
app_title = "Platzhirsch CRM"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Kontakte, Anfragen/Leads, Termine (Website-Buchung), Beratungsgespräche, Aufgaben, Kommunikation"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
required_apps = ["frappe", "ph_core"]

after_install = "ph_crm.install.after_install"

# Export: bench --site <site> export-fixtures --app ph_crm (Filter pflegen, sonst werden fremde Datensätze exportiert)
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH CRM"]]},
    {"dt": "Workflow", "filters": [["document_type", "in", ["PH Anfrage", "PH Termin", "PH Kontakt"]]]},
    {
        "dt": "Workflow State",
        "filters": [["name", "in", ["PH Qualifiziert", "PH Termin vereinbart", "PH Angebot", "PH Gewonnen", "PH Verloren", "PH Spam", "PH Unbestaetigt", "PH Bestaetigt", "PH Nicht erschienen", "PH Interessent", "PH Kunde", "PH Inaktiv"]]],
    },
    {
        "dt": "Workflow Action Master",
        "filters": [["name", "in", ["Qualifizieren", "Termin vereinbaren", "Angebot erstellen", "Gewonnen", "Verloren", "Als Spam markieren", "Zurück auf Neu", "Bestätigen", "Erledigt", "Nicht erschienen", "Als Kunde markieren", "Deaktivieren"]]],
    },
    {"dt": "Kanban Board", "filters": [["reference_doctype", "in", ["PH Anfrage", "PH Termin", "PH Aufgabe"]]]},
    {"dt": "Print Format", "filters": [["module", "=", "PH CRM"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH CRM"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH CRM"]]},
    {"dt": "Email Template", "filters": [["name", "in", ["PH Termin Bestätigung", "PH Termin Absage", "PH Termin Erinnerung"]]]},
    {"dt": "Custom DocPerm", "filters": [["role", "in", ["PH CRM Mitarbeiter", "PH CRM Leitung", "PH Website Integration"]], ["parent", "in", ["Event", "ToDo", "Email Template", "Communication", "File", "Country"]]]},
    {"dt": "Custom Field", "filters": [["module", "=", "PH CRM"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "PH CRM"]]},
    {"dt": "Client Script", "filters": [["module", "=", "PH CRM"]]},
]

doc_events = {
    "Event": {"on_trash": "ph_crm.ph_crm.ereignisse.event_geloescht"},
    "Communication": {"after_insert": "ph_crm.ph_crm.ereignisse.kommunikation_an_kontakt"},
}

# Zeiten Europe/Vienna (Site-Zeitzone). Funktionen: ph_crm/ph_crm/tasks.py
scheduler_events = {
    "hourly": ["ph_crm.ph_crm.tasks.termin_erinnerungen"],
    "daily": ["ph_crm.ph_crm.tasks.meet_raeume_aufraeumen"],
    "cron": {
        "*/10 * * * *": ["ph_crm.ph_crm.tasks.reservierungen_freigeben"],
        "30 7 * * 1-5": ["ph_crm.ph_crm.tasks.unbeantwortete_anfragen"],
        "0 7 * * *": ["ph_crm.ph_crm.tasks.aufgaben_erinnerungen"],
    },
}

# Kalenderansicht: PH Termin erscheint im Desk-Kalender (Liste → Kalender) mit Status-Farben
calendars = ["PH Termin"]

website_route_rules = []
