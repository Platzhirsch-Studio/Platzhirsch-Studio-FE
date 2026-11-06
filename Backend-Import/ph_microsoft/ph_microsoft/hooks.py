# ph_microsoft/hooks.py – Microsoft 365 (Entra ID, Exchange Online, Outlook, Teams) für das Platzhirsch-Backoffice.
# Inhaber-Entscheidung Nr. 52: „Backoffice muss mit Microsoft-Login gehen und wir verbinden das mit Microsoft
# Exchange Online.“ Konventionen: Backend-Import/CONVENTIONS.md · App Nr. 14 (nach ph_ablage = 13).
app_name = "ph_microsoft"
app_title = "Platzhirsch Microsoft 365"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Entra-ID-Anmeldung für das Backoffice, Exchange-Mail in der Kundenakte, Outlook-Kalender-Abgleich mit Teams-Links, Outlook-Kontakte, Graph-Zugang für ph_ablage"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
# Nur ph_core ist Pflicht. PH Kontakt/Termin (ph_crm), PH Montageauftrag (ph_projekte), PH Serviceeinsatz (ph_service),
# PH Lieferant (ph_sortiment) werden nur genutzt, wenn installiert (frappe.db.exists("DocType", …), Dynamic Links).
required_apps = ["frappe", "ph_core"]

# Fixtures: nur eigene Datensätze (Modul „PH Microsoft“). Rollen liegen in ph_core – keine neuen Rollen.
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH Microsoft"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Microsoft"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Microsoft"]]},
    {"dt": "Custom Field", "filters": [["module", "=", "PH Microsoft"]]},
]

after_install = "ph_microsoft.install.after_install"
after_migrate = "ph_microsoft.install.after_migrate"

# Backoffice-Vorgänge → Outlook (in die Warteschlange; ph_microsoft/ph_microsoft/ereignisse.py, wirft nie).
doc_events = {
    "PH Termin": {
        "on_update": "ph_microsoft.ph_microsoft.ereignisse.kalender_dokument",
        "on_trash": "ph_microsoft.ph_microsoft.ereignisse.kalender_geloescht",
    },
    "PH Montageauftrag": {
        "on_update": "ph_microsoft.ph_microsoft.ereignisse.kalender_dokument",
        "on_trash": "ph_microsoft.ph_microsoft.ereignisse.kalender_geloescht",
    },
    "PH Serviceeinsatz": {
        "on_update": "ph_microsoft.ph_microsoft.ereignisse.kalender_dokument",
        "on_trash": "ph_microsoft.ph_microsoft.ereignisse.kalender_geloescht",
    },
    "PH Kontakt": {
        "on_update": "ph_microsoft.ph_microsoft.ereignisse.kontakt_geaendert",
        "on_trash": "ph_microsoft.ph_microsoft.ereignisse.kontakt_geloescht",
    },
}

# Europe/Vienna (System Settings). Delta-Rückfall alle 5 min (auch wenn Webhooks laufen), Abos stündlich.
scheduler_events = {
    "cron": {
        "*/5 * * * *": [
            "ph_microsoft.ph_microsoft.tasks.mail_delta",
            "ph_microsoft.ph_microsoft.tasks.kalender_delta",
        ],
        "7 * * * *": ["ph_microsoft.ph_microsoft.tasks.abos_erneuern"],
        "10 3 * * *": ["ph_microsoft.ph_microsoft.tasks.kalender_fenster_erneuern"],
        "40 3 * * *": ["ph_microsoft.ph_microsoft.tasks.kontakte_vollabgleich"],
        "40 2 * * *": ["ph_microsoft.ph_microsoft.tasks.protokoll_bereinigen"],
    }
}

# Hook-Vertrag Kundenakte (ph_crm/ph_crm/kontakt360.py): Outlook-Ereignisse ohne Inhalt; Mails zeigt ph_crm selbst.
ph_kontakt_zeitleiste = ["ph_microsoft.ph_microsoft.kontakt_hooks.zeitleiste"]
ph_kontakt_datenauskunft = ["ph_microsoft.ph_microsoft.kontakt_hooks.datenauskunft"]
ph_kontakt_anonymisieren = ["ph_microsoft.ph_microsoft.kontakt_hooks.anonymisieren"]
ph_kontakt_zusammengefuehrt = ["ph_microsoft.ph_microsoft.kontakt_hooks.zusammengefuehrt"]

# Angebot an ph_crm (liest den Hook noch nicht – README „Anfragen an andere Apps“): Outlook-Frei/Belegt live in
# ph_crm.kalender.freie_slots. Signatur fn(von, bis, berater_liste) → [(user, (start, ende))]. Ohne Leser greift
# der Belegt-Spiegel (private Frappe-Events „Belegt (Outlook)“), den ph_crm bereits auswertet.
ph_crm_belegungen = ["ph_microsoft.ph_microsoft.kalender.crm_belegungen"]

# Angebot an Apps mit 1:1-Kundenmails (PH Kontakt.mail_senden, Angebot/Servicefall „Kunde informieren“):
# fn(empfaenger, betreff, html, anhaenge=None, bezug_doctype=None, bezug_name=None, von=None, cc=None) → dict | None.
# None = Exchange aus (PH Microsoft Einstellungen.kundenmails_ueber_exchange) → wie bisher ph_core.utils.mail.sende.
# Transaktions- und Newsletter-Mails bleiben bei Resend; ph_core.utils.mail.sende wird nicht verändert.
ph_mail_einzelversand = ["ph_microsoft.ph_microsoft.mail.einzel_versand"]

# Anbieter-Hook: Mail-Anhänge an eine Ablage weitergeben (ph_ablage trägt sich ein).
# Signatur fn(datei, bezug_doctype, bezug_name, kontakt, quelle) – datei = Name des File-Datensatzes.
ph_microsoft_anhang_ablegen = []

website_route_rules = []
