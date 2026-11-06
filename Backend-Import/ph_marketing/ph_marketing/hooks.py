# ph_marketing/hooks.py – Platzhirsch Marketing
# Konventionen: Backend-Import/CONVENTIONS.md · Arbeitspaket: Backend-Import/PLAN.md, WP9
app_name = "ph_marketing"
app_title = "Platzhirsch Marketing"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Newsletter mit Double-Opt-in, Einwilligungen, Kundenreisen, Empfehlungen, Kampagnen, Events, Social-Planung, Einblicke"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
required_apps = ["frappe", "ph_core", "ph_crm"]

WORKFLOW_DOCTYPES = ["PH Newsletter Ausgabe", "PH Event", "PH Kampagne", "PH Social Beitrag"]
WORKFLOW_STATES = [
    "PH Freigabe", "PH Wird versendet", "PH Ausgebucht", "PH Durchgefuehrt", "PH Beendet",
    "PH Idee", ]
WORKFLOW_ACTIONS = ["Zur Freigabe", "Planen", "Als ausgebucht markieren", "Durchgeführt", "Ausarbeiten"]

# Fixtures: nur eigene Datensätze, immer mit Filter. Export: bench --site <site> export-fixtures --app ph_marketing
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH Marketing"]]},
    {"dt": "Workflow", "filters": [["document_type", "in", WORKFLOW_DOCTYPES]]},
    {"dt": "Workflow State", "filters": [["name", "in", WORKFLOW_STATES]]},
    {"dt": "Workflow Action Master", "filters": [["name", "in", WORKFLOW_ACTIONS]]},
    {"dt": "Kanban Board", "filters": [["reference_doctype", "in", ["PH Social Beitrag", "PH Kampagne", "PH Event"]]]},
    {"dt": "Print Format", "filters": [["module", "=", "PH Marketing"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Marketing"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Marketing"]]},
    {"dt": "Custom Field", "filters": [["module", "=", "PH Marketing"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "PH Marketing"]]},
    {"dt": "Client Script", "filters": [["module", "=", "PH Marketing"]]},
]

# Nach der Installation: Interessen, Mail-Vorlagen, Kundenreisen (aktiv = 0), Event Adventsabend, Einstellungen.
after_install = "ph_marketing.install.after_install"

# Anfragen der Website (ph_crm): Kampagne aus utm_campaign zuordnen, Empfehlungskontext erkennen.
doc_events = {
    "PH Anfrage": {"after_insert": "ph_marketing.ph_marketing.ereignisse.anfrage_eingang"},
}

# Zeitplan Europe/Vienna (System Settings). Details: ph_marketing/ph_marketing/tasks.py
scheduler_events = {
    "cron": {
        "*/15 * * * *": ["ph_marketing.ph_marketing.tasks.newsletter_versand"],
        "*/30 * * * *": ["ph_marketing.ph_marketing.tasks.doi_erinnerungen"],
        "30 3 * * *": ["ph_marketing.ph_marketing.tasks.doi_aufraeumen"],
        "0 6 * * *": ["ph_marketing.ph_marketing.tasks.reisen_planen"],
        "0 7 * * *": ["ph_marketing.ph_marketing.tasks.empfehlungen_pruefen"],
        "0 8 * * *": ["ph_marketing.ph_marketing.tasks.event_erinnerungen"],
        "0 9 * * *": ["ph_marketing.ph_marketing.tasks.reisen_senden"],
        "45 3 * * *": ["ph_marketing.ph_marketing.tasks.datenschutz_aufraeumen"],
        "0 5 * * *": ["ph_marketing.ph_marketing.tasks.kampagnen_attribution"],
    }
}

# Jinja: QR-Code für das Druckformat „PH Event Ticket“ (Check-in)
jinja = {"methods": ["ph_marketing.ph_marketing.checkin.ph_event_ticket_qr"]}

# Kontakt-Hooks (Vertrag von ph_crm: Zeitleiste, Auskunft Art. 15, Löschen Art. 17, Zusammenführen)
ph_kontakt_zeitleiste = ["ph_marketing.ph_marketing.kontakt_hooks.zeitleiste"]
ph_kontakt_zeitleiste_ersetzt = ["PH Newsletter Abo", "PH Einwilligung", "PH Kampagne Kontaktpunkt", "PH Empfehlung", "PH Bewertung"]
ph_kontakt_datenauskunft = ["ph_marketing.ph_marketing.kontakt_hooks.datenauskunft"]
ph_kontakt_anonymisieren = ["ph_marketing.ph_marketing.kontakt_hooks.anonymisieren"]
ph_kontakt_zusammengefuehrt = ["ph_marketing.ph_marketing.kontakt_hooks.zusammengefuehrt"]

# Keine eigenen Website-Routen: die Website ist Next.js (platzhirsch.studio).
website_route_rules = []
