# ph_logistik/hooks.py – Platzhirsch Logistik (WP7: Lieferschein, Packtisch, LetMeShip, Sendung, Retoure, Lager, Inventur, Touren)
# Konventionen: Backend-Import/CONVENTIONS.md · Arbeitspaket: Backend-Import/PLAN.md, Abschnitt WP7
app_name = "ph_logistik"
app_title = "Platzhirsch Logistik"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Lieferschein, Packtisch, LetMeShip-Versand, Sendungsverfolgung, Retourenlabel, Lager/Bestand, Inventur, Touren"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
required_apps = ["frappe", "ph_core", "ph_crm", "ph_sortiment", "ph_shop", "ph_faktura"]

WORKFLOW_DOCTYPES = ["PH Lieferschein", "PH Sendung", "PH Tour", "PH Inventur", "PH Speditionsauftrag", "PH Warenruecknahme"]
WORKFLOW_STATES = [
    "PH Gepackt", "PH Uebergeben", "PH Zugestellt", "PH Angelegt", "PH Etikett", "PH Problem",
    "PH Laufend", "PH Angemeldet", ]
WORKFLOW_ACTIONS = ["Zustellen", "Etikett erzeugen", "Problem melden", "Starten", "Zählung starten"]

# Fixtures: nur eigene Datensätze, immer mit Filter. Export: bench --site <site> export-fixtures --app ph_logistik
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH Logistik"]]},
    {"dt": "Workflow", "filters": [["document_type", "in", WORKFLOW_DOCTYPES]]},
    {"dt": "Workflow State", "filters": [["name", "in", WORKFLOW_STATES]]},
    {"dt": "Workflow Action Master", "filters": [["name", "in", WORKFLOW_ACTIONS]]},
    {"dt": "Kanban Board", "filters": [["reference_doctype", "in", ["PH Lieferschein", "PH Sendung", "PH Tour", "PH Speditionsauftrag"]]]},
    {"dt": "Print Format", "filters": [["module", "=", "PH Logistik"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Logistik"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Logistik"]]},
    {"dt": "Custom Field", "filters": [["module", "=", "PH Logistik"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "PH Logistik"]]},
    {"dt": "Client Script", "filters": [["module", "=", "PH Logistik"]]},
]

after_install = "ph_logistik.install.after_install"

# Desk-Pages (Packtisch, Tour heute) brauchen eigene Stile – große Touch-Schaltflächen, Statusfarben.
app_include_css = ["/assets/ph_logistik/css/ph_logistik.css"]

# Ereignisse fremder DocTypes (ph_sortiment Wareneingang → Bestand; ph_shop Retoure → Wiedereinlagerung). Handler fangen alles ab.
doc_events = {
    "PH Wareneingang": {"on_update": "ph_logistik.ph_logistik.ereignisse.wareneingang_aktualisiert"},
    "PH Retoure": {"on_update": "ph_logistik.ph_logistik.ereignisse.retoure_aktualisiert"},
}

# Zeitgesteuert (Europe/Vienna laut System Settings)
scheduler_events = {
    "cron": {
        "15 */2 * * *": ["ph_logistik.ph_logistik.tasks.tracking_aktualisieren"],   # Tracking offener Sendungen alle 2 h
        "0 7 * * *": ["ph_logistik.ph_logistik.tasks.haengende_sendungen_melden"],   # 07:00 hängende Sendungen → Problem/Aufgabe
        "0 16 * * 1-5": ["ph_logistik.ph_logistik.tasks.touren_morgen_pruefen"],     # 16:00 Mo–Fr Touren für morgen prüfen
        "30 6 * * *": ["ph_logistik.ph_logistik.lager.reservierungen_freigeben"],     # 06:30 abgelaufene Reservierungen freigeben
        "45 5 * * *": ["ph_logistik.ph_logistik.nachbestellung.vorschlaege_erzeugen"],  # 05:45 Meldebestand → Nachbestellvorschläge
        "15 7 * * 1": ["ph_logistik.ph_logistik.inventur_plan.abdeckung_pruefen"],     # Mo 07:15 Teilinventur-Plan prüfen (wenn aktiv)
    }
}

website_route_rules = []

# ph_shop PH Bestellung.packen ruft frappe.get_attr(fn)(doc) für jeden Eintrag; Rückgabe = Lieferschein-Name
ph_shop_lieferschein_erstellen = ["ph_logistik.ph_logistik.doctype.ph_lieferschein.ph_lieferschein.lieferschein_aus_bestellung_hook"]
