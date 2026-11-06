# ph_core/hooks.py – Platzhirsch Core: gemeinsame Basis aller PH-Apps.
# Konventionen: Backend-Import/CONVENTIONS.md · Plan: Backend-Import/PLAN.md
app_name = "ph_core"
app_title = "Platzhirsch Core"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Firma, Rollen, Nummernkreise, Briefkopf, Einstellungen, API-Basis und Audit für alle PH-Apps"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
required_apps = ["frappe"]

# Alle PH-Rollen gehören ph_core (genau eine Quelle, CONVENTIONS 4). Reihenfolge der Fixtures ist
# Importreihenfolge: Rollen vor Rollenprofilen, Workflow States/Actions vor Workflows der Apps.
PH_ROLLEN = [
    "PH Geschäftsführung", "PH Backoffice-Admin", "PH Website Integration", "PH Buchhaltung extern",
    "PH CRM Mitarbeiter", "PH CRM Leitung",
    "PH Sortiment Mitarbeiter", "PH Sortiment Leitung",
    "PH Projekte Mitarbeiter", "PH Projekte Leitung",
    "PH Shop Mitarbeiter", "PH Shop Leitung",
    "PH Faktura Mitarbeiter", "PH Faktura Leitung",
    "PH Logistik Mitarbeiter", "PH Logistik Leitung",
    "PH Personal Mitarbeiter", "PH Personal Leitung",
    "PH Marketing Mitarbeiter", "PH Marketing Leitung",
    "PH Kassa Mitarbeiter", "PH Kassa Leitung",
    "PH Service Mitarbeiter", "PH Service Leitung",
    "PH Montage", "PH Techniker", "PH Personal Selbstservice",
    "PH Kundenkarte Mitarbeiter", "PH Kundenkarte Leitung",
    "PH Ablage Mitarbeiter", "PH Ablage Leitung",
]
PH_ROLLENPROFILE = [
    "PH Verkauf", "PH Verkaufsleitung", "PH Einkauf", "PH Shop und Kassa", "PH Lager und Montage",
    "PH Servicetechnik", "PH Marketing", "PH Buchhaltung", "PH Steuerberatung", "PH Geschäftsführung", "PH Backoffice-Admin",
]
# Generische Workflow-Zustände/-Aktionen (fixtures/workflow_state.json, workflow_action_master.json):
# Apps verwenden diese Namen wieder, statt sie neu zu definieren (gleicher style).
PH_WORKFLOW_STATES = [
    "PH Entwurf", "PH Neu", "PH Offen", "PH Beantragt", "PH Geplant", "PH In Arbeit", "PH Freigegeben", "PH Genehmigt",
    "PH Aktiv", "PH Pausiert", "PH Gesendet", "PH Versendet", "PH Bezahlt", "PH Veroeffentlicht", "PH Erledigt",
    "PH Abgeschlossen", "PH Archiviert", "PH Gesperrt", "PH Abgelehnt", "PH Storniert", "PH Abgebrochen", "PH Verworfen", "PH Widerrufen",
]
PH_WORKFLOW_ACTIONS = [
    "Freigeben", "Genehmigen", "Ablehnen", "Stornieren", "Abbrechen", "Verwerfen", "Abschließen", "Erledigt melden",
    "Aktivieren", "Pausieren", "Fortsetzen", "Reaktivieren", "Archivieren", "Veröffentlichen", "Zurückziehen",
    "Zurück auf Entwurf", "Wieder öffnen", "Senden", "Versenden", "Packen", "Übergeben", "Beauftragen", "Abrechnen",
    "Beenden", "Absagen", "Sperren", "Entsperren", "Widerrufen",
]

# Fixtures (Export: bench --site <site> export-fixtures --app ph_core)
fixtures = [
    {"dt": "Role", "filters": [["name", "in", PH_ROLLEN]]},
    {"dt": "Role Profile", "filters": [["name", "in", PH_ROLLENPROFILE]]},
    {"dt": "Workflow State", "filters": [["name", "in", PH_WORKFLOW_STATES]]},
    {"dt": "Workflow Action Master", "filters": [["name", "in", PH_WORKFLOW_ACTIONS]]},
    {"dt": "Letter Head", "filters": [["name", "in", ["PLATZHIRSCH"]]]},
    {"dt": "Workspace", "filters": [["module", "=", "PH Core"]]},
    {"dt": "Print Format", "filters": [["module", "=", "PH Core"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Core"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Core"]]},
    # Bediener-PIN/Kurzname/Standort am Frappe-User (Backoffice Nr. 49, api/bediener.py)
    {"dt": "Custom Field", "filters": [["module", "=", "PH Core"]]},
]

# Nach der Installation: Firma (inkl. FN/UID), Einstellungen, Integrationsbenutzer (ohne Schlüssel) anlegen.
after_install = "ph_core.install.after_install"
after_migrate = "ph_core.install.after_install"  # idempotent: trägt neue Stammdaten/Vorgaben nach

# Jinja-Hilfen für alle Druckformate: {{ ph_firma() }}, {{ ph_betrag(cent) }}, {{ ph_datum(d) }},
# {{ ph_satz(2000) }} → „20 %“, {{ ph_qr_svg(text) }} → Inline-SVG
jinja = {
    "methods": [
        "ph_core.utils.druck.ph_firma",
        "ph_core.utils.druck.ph_betrag",
        "ph_core.utils.druck.ph_datum",
        "ph_core.utils.druck.ph_einstellungen",
        "ph_core.utils.druck.ph_satz",
        "ph_core.utils.druck.ph_qr_svg",
    ]
}

# Zeitgesteuert: API-Protokoll aufräumen (Aufbewahrung laut PH Einstellungen).
scheduler_events = {
    "daily": ["ph_core.ph_core.doctype.ph_api_protokoll.ph_api_protokoll.aufraeumen"],
}

doc_events = {}
website_route_rules = []

# ── App-übergreifende Hook-Konvention (CONVENTIONS 10, README „Hooks zwischen PH-Apps“) ──────────
# Eine App, die eine Erweiterung anbietet, deklariert in ihrer hooks.py eine leere Liste; andere Apps
# tragen dort dotted paths ein; der Anbieter liest frappe.get_hooks("<name>"). Register (Anbieter):
#   ph_stripe_art_handler        ph_shop   fn(event: dict) → None; je Stripe-Ereignisart (z. B. ph_kassa Terminal)
#   ph_shop_rechnung_erstellen   ph_shop   fn(bestellung: Document) → str (Name PH Rechnung); ph_faktura
#   ph_shop_lieferschein_erstellen ph_shop fn(bestellung: Document) → str (Name PH Lieferschein); ph_logistik
# ph_core selbst bietet keine Hooks an; Namen beginnen mit ph_<anbieter-app>_ bzw. ph_stripe_.

# Druck: gemeinsame CSS-Datei für alle PH-Druckformate (public/css/ph_druck.css wird in
# templates/print/ph_basis.html eingebunden; hier nur Desk-Stile).
app_include_css = ["/assets/ph_core/css/ph_desk.css"]
