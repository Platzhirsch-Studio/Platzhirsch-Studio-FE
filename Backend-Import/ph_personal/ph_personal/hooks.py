# ph_personal/hooks.py – Platzhirsch Personal (WP8): Stellen (Karriere), Bewerbungen, Gespräche,
# Mitarbeiter, Zeiterfassung, Abwesenheiten.
# Konventionen: Backend-Import/CONVENTIONS.md · Arbeitspaket: Backend-Import/PLAN.md, WP8
app_name = "ph_personal"
app_title = "Platzhirsch Personal"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Stellen (Karriere), Bewerbungen, Bewerbungsgespräche, Mitarbeiter-Stammdaten, Zeiterfassung, Urlaub/Abwesenheit"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
required_apps = ["frappe", "ph_core"]

# Fixtures: nur eigene Datensätze, immer mit Filter.
# Export: bench --site <site> export-fixtures --app ph_personal
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH Personal"]]},
    {"dt": "Workflow", "filters": [["document_type", "in", ["PH Stelle", "PH Bewerbung", "PH Abwesenheit"]]]},
    {
        "dt": "Workflow State",
        "filters": [
            [
                "name",
                "in",
                [
                    "PH Besetzt", "PH Eingegangen", "PH Gesichtet", "PH Gespraech", "PH Eingestellt", "PH Abgesagt", "PH Zurueckgezogen",
                    ],
            ]
        ],
    },
    {
        "dt": "Workflow Action Master",
        "filters": [
            [
                "name",
                "in",
                [
                    "Wieder aktivieren", "Als besetzt schließen", "Sichten", "Einstellen", "Zurück auf Gesichtet",
                    "Erneut beantragen",
                ],
            ]
        ],
    },
    {"dt": "Kanban Board", "filters": [["reference_doctype", "in", ["PH Bewerbung", "PH Stelle"]]]},
    {"dt": "Print Format", "filters": [["module", "=", "PH Personal"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Personal"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Personal"]]},
    {"dt": "Custom Field", "filters": [["module", "=", "PH Personal"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "PH Personal"]]},
    {"dt": "Client Script", "filters": [["module", "=", "PH Personal"]]},
]

# Nach der Installation: Einstellungen + Import der 8 Stellen (qa-screenshots/karriere/frappe-import.json).
after_install = "ph_personal.install.after_install"

# Website-Cache (Tag career) und API-Cache nach Änderungen an Stellen (Controller ruft website.revalidate_career;
# hier zusätzlich der API-Cache, damit karriere_data sofort aktuell ist).
doc_events = {
    "PH Stelle": {
        "on_update": "ph_personal.ph_personal.ereignisse.stelle_geaendert",
        "on_trash": "ph_personal.ph_personal.ereignisse.stelle_geaendert",
    },
}

# Zeitgesteuert (Europe/Vienna laut System Settings)
scheduler_events = {
    "cron": {
        "15 3 * * *": ["ph_personal.ph_personal.tasks.loeschfristen_ausfuehren"],   # DSGVO: Unterlagen nach Löschfrist
        "0 4 * * *": ["ph_personal.ph_personal.tasks.abgelaufene_stellen"],         # gueltig_bis überschritten → Pausiert
        "0 7 * * 1": ["ph_personal.ph_personal.tasks.loeschfrist_vorwarnung"],      # montags: Vorwarnung 14 Tage
        "30 23 * * *": ["ph_personal.ph_personal.tasks.offene_zeitbuchungen_hinweis"],
    },
}

# Keine eigenen Website-Routen: die Website ist Next.js (platzhirsch.studio).
website_route_rules = []

# Rollen, die der Admin dem Benutzer website@platzhirsch.studio zusätzlich NICHT geben muss:
# karriere_data ist guest-lesend; create_bewerbung/attach_unterlage laufen über PH Website Integration (ph_core).
