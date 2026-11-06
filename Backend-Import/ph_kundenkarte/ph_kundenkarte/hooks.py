# ph_kundenkarte/hooks.py – Platzhirsch Kundenkarte, Stufe 1 ohne Geldwert (Inhaber-Entscheidung).
# Konventionen: Backend-Import/CONVENTIONS.md · App Nr. 12 (PLAN.md Abschnitt 2)
app_name = "ph_kundenkarte"
app_title = "Platzhirsch Kundenkarte"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Kundenkarte: Karten, Stufen, Leistungsvorteile (Lieferung, Montage, Pflege, Events), Einlösungen, Anträge von der Website, Wallet-Pässe, Umsatz- und Stufenberechnung – ohne Guthaben, Punkte oder Rabatt in Euro"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
# Umsatzquellen: PH Kassenbeleg (ph_kassa), PH Bestellung/PH Zahlung (ph_shop), PH Rechnung (ph_faktura);
# Einwilligung/Events: ph_marketing; Pflege-Abo als Vorteil: ph_service; Kontakt/Aufgabe: ph_crm.
required_apps = ["frappe", "ph_core", "ph_crm", "ph_shop", "ph_faktura", "ph_kassa", "ph_service", "ph_marketing"]

# Fixtures: nur eigene Datensätze, immer mit Filter. Rollen liegen in ph_core (role.json), hier nicht erneut.
# Export: bench --site <site> export-fixtures --app ph_kundenkarte
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH Kundenkarte"]]},
    {"dt": "Kanban Board", "filters": [["reference_doctype", "in", ["PH Kundenkarte Antrag"]]]},
    {"dt": "Print Format", "filters": [["module", "=", "PH Kundenkarte"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Kundenkarte"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Kundenkarte"]]},
    {"dt": "Custom Field", "filters": [["module", "=", "PH Kundenkarte"]]},
]

# Nach der Installation: Stufen, Vorteilskatalog, Einstellungen (idempotent, ohne Personendaten).
after_install = "ph_kundenkarte.install.after_install"

# Umsatz der Karte neu berechnen, wenn ein Beleg des Kontakts gebucht/bezahlt/storniert wird
# (ph_kundenkarte/ph_kundenkarte/ereignisse.py – enqueue, nie Ausnahmen).
doc_events = {
    "PH Kassenbeleg": {
        "on_submit": "ph_kundenkarte.ph_kundenkarte.ereignisse.kassenbeleg_gebucht",
        "on_cancel": "ph_kundenkarte.ph_kundenkarte.ereignisse.kassenbeleg_gebucht",
    },
    "PH Bestellung": {"on_update": "ph_kundenkarte.ph_kundenkarte.ereignisse.bestellung_aktualisiert"},
    "PH Rechnung": {
        "on_submit": "ph_kundenkarte.ph_kundenkarte.ereignisse.rechnung_gebucht",
        "on_cancel": "ph_kundenkarte.ph_kundenkarte.ereignisse.rechnung_gebucht",
    },
}

# Zeitgesteuert (Europe/Vienna laut System Settings), Funktionen in ph_kundenkarte/ph_kundenkarte/tasks.py.
scheduler_events = {
    "cron": {
        # 03:30 täglich: Jahres-/Gesamtumsatz und Stufe aller aktiven Karten neu berechnen
        "30 3 * * *": ["ph_kundenkarte.ph_kundenkarte.tasks.umsatz_und_stufen_neu_berechnen"],
        # 08:00 täglich: Geburtstage heute → PH Aufgabe für die Beraterin/den Berater (kein automatischer Mailversand)
        "0 8 * * *": ["ph_kundenkarte.ph_kundenkarte.tasks.geburtstage_heute"],
        # 08:05 täglich: Karten „Beantragt“ > 7 Tage ohne Übergabe → PH Aufgabe für den Berater
        "5 8 * * *": ["ph_kundenkarte.ph_kundenkarte.tasks.karten_nicht_uebergeben"],
        # 1. Dezember 08:10: ungenutzte limitierte Vorteile (Pflegetermin) → PH Aufgabe „anbieten“
        "10 8 1 12 *": ["ph_kundenkarte.ph_kundenkarte.tasks.vorteile_ungenutzt_dezember"],
    }
}

# Hook-Vertrag „Kundenakte“ (ph_crm/ph_crm/kontakt360.py): Zeitleiste, DSGVO-Auskunft/-Anonymisierung,
# Kontakt-Zusammenführung (Karten folgen dem Kontakt, Dubletten werden zusammengeführt).
ph_kontakt_zeitleiste = ["ph_kundenkarte.ph_kundenkarte.kontakt.zeitleiste"]
ph_kontakt_zeitleiste_ersetzt = ["PH Kundenkarte", "PH Kundenkarte Einloesung", "PH Kundenkarte Antrag"]
ph_kontakt_datenauskunft = ["ph_kundenkarte.ph_kundenkarte.kontakt.datenauskunft"]
ph_kontakt_anonymisieren = ["ph_kundenkarte.ph_kundenkarte.kontakt.anonymisieren"]
ph_kontakt_zusammengefuehrt = ["ph_kundenkarte.ph_kundenkarte.kontakt.zusammengefuehrt"]

# Keine eigenen Website-Routen: die Website ist Next.js (platzhirsch.studio), Wallet-Pässe liefert die API.
website_route_rules = []
