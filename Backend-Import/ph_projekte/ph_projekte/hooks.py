# ph_projekte/hooks.py – Platzhirsch Projekte (WP4)
# Konventionen: Backend-Import/CONVENTIONS.md · Arbeitspaket: Backend-Import/PLAN.md, Abschnitt WP4
app_name = "ph_projekte"
app_title = "Platzhirsch Projekte"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Projekte (digitale Auftragsmappe), Planung, Renderings und Kundenfeedback, Bautagebuch, Produktpass, Dokumente, Montage, Fremdgewerke, Abnahme, Aufgaben und Zeiten"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
required_apps = ["frappe", "ph_core", "ph_crm", "ph_sortiment"]

# Fixtures: nur eigene Datensätze, immer mit Filter. Export: bench --site <site> export-fixtures --app ph_projekte
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH Projekte"]]},
    {"dt": "Workflow", "filters": [["document_type", "in", ["PH Projekt", "PH Rendering", "PH Montageauftrag", "PH Abnahme", "PH Referenz"]]]},
    {
        "dt": "Workflow State",
        "filters": [["name", "in", [
            "PH Phase Anfrage", "PH Phase Planung", "PH Phase Angebot", "PH Phase Auftrag", "PH Phase Bestellung", "PH Phase Lieferung",
            "PH Phase Montage", "PH Phase Uebergabe", "PH Vorgelegt", "PH Feedback offen",
            "PH Unterwegs", "PH Abgenommen", "PH Unterzeichnet",
            "PH Mit Maengeln", "PH Eingereicht", ]]],
    },
    {
        "dt": "Workflow Action Master",
        "filters": [["name", "in", [
            "Planung starten", "Bestellen", "Liefern", "Montieren", "Zurück",
            "Kunden vorlegen", "Feedback erhalten", "Beantwortet", "Losfahren", "Beginnen", "Abnehmen", "Unterzeichnen", "Mängel feststellen", ]]],
    },
    {"dt": "Kanban Board", "filters": [["reference_doctype", "in", ["PH Projekt", "PH Rendering", "PH Montageauftrag", "PH Fremdgewerk", "PH Projekt Aufgabe"]]]},
    {"dt": "Print Format", "filters": [["module", "=", "PH Projekte"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Projekte"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Projekte"]]},
    {"dt": "Custom Field", "filters": [["module", "=", "PH Projekte"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "PH Projekte"]]},
    {"dt": "Client Script", "filters": [["module", "=", "PH Projekte"]]},
]

after_install = "ph_projekte.install.after_install"

# Jinja-Hilfen für die Druckformate (zusätzlich zu ph_core: ph_firma, ph_betrag, ph_datum, ph_einstellungen)
jinja = {
    "methods": [
        "ph_projekte.utils.texte.montage_text",
        "ph_projekte.ph_projekte.helfer.ph_einstellungen_projekte",
    ]
}

doc_events = {}

# Europe/Vienna laut System Settings
scheduler_events = {
    "cron": {
        "0 7 * * 1-6": ["ph_projekte.ph_projekte.tasks.montage_erinnerung"],
        "0 8 * * 1-5": ["ph_projekte.ph_projekte.tasks.feedback_erinnerung"],
        "30 2 * * *": ["ph_projekte.ph_projekte.tasks.garantien_pruefen", "ph_projekte.ph_projekte.tasks.summen_aktualisieren"],
    },
}

website_route_rules = []

# Desk: Galerie-/Auftragsmappen-Stile
app_include_css = ["/assets/ph_projekte/css/ph_projekte.css"]
