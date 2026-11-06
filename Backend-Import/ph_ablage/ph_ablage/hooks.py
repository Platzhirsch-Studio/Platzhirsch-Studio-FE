# ph_ablage/hooks.py – Platzhirsch Ablage: Dateiablage wie ein Drive im eigenen Backoffice.
# Konventionen: Backend-Import/CONVENTIONS.md · App Nr. 13 (PLAN.md Abschnitt 2, nach ph_kundenkarte)
app_name = "ph_ablage"
app_title = "Platzhirsch Ablage"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Dateiablage (Word, Excel, PDF, CAD, Bilder) mit Ordnerbaum je Kontakt/Projekt/Lieferant/Mitarbeiter/Servicefall, Versionen, Check-out, Freigabelinks, Portal-Anbindung und austauschbarem Speicher (lokal, S3-kompatibel EU, Google Drive, OneDrive) – für Mitarbeiter unsichtbar"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
# Bezüge (PH Kontakt – ph_crm, PH Projekt/PH Projekt Dokument – ph_projekte, PH Lieferant – ph_sortiment,
# PH Mitarbeiter – ph_personal, PH Servicefall – ph_service) sind optional: Dynamic Links, Zugriffe nur nach
# frappe.db.exists("DocType", …). Deshalb nur ph_core als Pflicht.
required_apps = ["frappe", "ph_core"]

# Fixtures: nur eigene Datensätze, immer mit Filter. Rollen „PH Ablage Mitarbeiter/Leitung“ liegen in ph_core.
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH Ablage"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Ablage"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Ablage"]]},
]

after_install = "ph_ablage.install.after_install"
after_migrate = "ph_ablage.install.after_migrate"

# Rechte über Bezug + Ordner-Modus auch in Desk-Listen/-Formularen (ph_ablage/ph_ablage/rechte.py)
permission_query_conditions = {
    "PH Ordner": "ph_ablage.ph_ablage.rechte.ordner_query",
    "PH Datei": "ph_ablage.ph_ablage.rechte.datei_query",
    "PH Datei Freigabelink": "ph_ablage.ph_ablage.rechte.freigabelink_query",
}
has_permission = {
    "PH Ordner": "ph_ablage.ph_ablage.rechte.ordner_hat_recht",
    "PH Datei": "ph_ablage.ph_ablage.rechte.datei_hat_recht",
    "PH Datei Freigabelink": "ph_ablage.ph_ablage.rechte.freigabelink_hat_recht",
}

# Automatische Ordner (Vorlagen in PH Ablage Einstellungen) – greifen nur, wenn die jeweilige App installiert ist;
# idempotent, nie Ausnahmen (ph_ablage/ph_ablage/ereignisse.py).
_BEZUG_EVENTS = {
    "after_insert": "ph_ablage.ph_ablage.ereignisse.bezug_angelegt",
    "on_update": "ph_ablage.ph_ablage.ereignisse.bezug_geaendert",
    "on_trash": "ph_ablage.ph_ablage.ereignisse.bezug_geloescht",
}
doc_events = {
    "PH Kontakt": dict(_BEZUG_EVENTS),
    "PH Projekt": dict(_BEZUG_EVENTS),
    "PH Lieferant": dict(_BEZUG_EVENTS),
    "PH Mitarbeiter": dict(_BEZUG_EVENTS),
    "PH Servicefall": dict(_BEZUG_EVENTS),
    # verlinkte Bestandsdatei wird im Original gelöscht → Inhalt vorher in die Ablage übernehmen
    "File": {"on_trash": "ph_ablage.ph_ablage.ereignisse.file_geloescht"},
}

# Zeiten Europe/Vienna (Site-Zeitzone). Funktionen: ph_ablage/ph_ablage/tasks.py (idempotent, commit je Einheit)
scheduler_events = {
    "cron": {
        # alle 30 min: abgelaufene Check-outs lösen, Freigabelinks auf Abgelaufen setzen, verwaiste Uploads entfernen
        "*/30 * * * *": [
            "ph_ablage.ph_ablage.tasks.sperren_aufheben",
            "ph_ablage.ph_ablage.tasks.freigaben_ablaufen",
            "ph_ablage.ph_ablage.tasks.uploads_aufraeumen",
        ],
        # 03:10 täglich: Papierkorb nach Frist endgültig leeren (Aufbewahrungssperre beachten), Portal-Ablauf
        "10 3 * * *": ["ph_ablage.ph_ablage.tasks.papierkorb_leeren", "ph_ablage.ph_ablage.tasks.portal_ablauf"],
        # 03:40 täglich: fehlende Prüfsummen/Vorschauen/Volltexte nachtragen (Bestand, Fehlversuche)
        "40 3 * * *": ["ph_ablage.ph_ablage.tasks.nachtragen"],
    }
}

# Hook-Vertrag Kundenakte (ph_crm/ph_crm/kontakt360.py): DSGVO-Auskunft (nur Metadaten), Löschplan mit
# Aufbewahrungssperre (Belege § 132 BAO), Kontakt-Zusammenführung (Ordner folgen dem Kontakt).
ph_kontakt_datenauskunft = ["ph_ablage.ph_ablage.kontakt.datenauskunft"]
ph_kontakt_anonymisieren = ["ph_ablage.ph_ablage.kontakt.anonymisieren"]
ph_kontakt_zusammengefuehrt = ["ph_ablage.ph_ablage.kontakt.zusammengefuehrt"]

# Hook von ph_microsoft (mail.anhaenge_speichern): Anhänge zugeordneter Kundenmails in den Ordner des Bezugs,
# Signatur fn(datei, bezug_doctype, bezug_name, kontakt, quelle) – ph_microsoft/README.md §8.
ph_microsoft_anhang_ablegen = ["ph_ablage.ph_ablage.mail.anhang_ablegen"]

# Keine Website-Routen: die Drive-Oberfläche baut das Next.js-Backoffice (README „Schnittstelle für das Backoffice“).
website_route_rules = []
