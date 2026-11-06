# ph_shop/hooks.py – Platzhirsch Shop (Bestellung, Reservierung, Gutschein, Zahlung, Stripe, Widerruf, Retoure).
# Konventionen: Backend-Import/CONVENTIONS.md · Arbeitspaket: Backend-Import/PLAN.md, WP5
app_name = "ph_shop"
app_title = "Platzhirsch Shop"
app_publisher = "MW Immobilienverwaltungs GmbH"
app_description = "Website-Bestellungen, Reservierung/Abholung, Gutscheine, Zahlungen, Stripe, Widerruf, Retoure"
app_email = "info@platzhirsch.studio"
app_license = "proprietary"
required_apps = ["frappe", "ph_core", "ph_crm", "ph_sortiment"]

# Fixtures: nur eigene Datensätze, immer mit Filter. Export: bench --site <site> export-fixtures --app ph_shop
_WORKFLOW_STATES = [
    "PH Zahlung ausstehend", "PH Versandbereit", "PH Reserviert", "PH Abholbereit",
    "PH Abgeholt", "PH Fehlgeschlagen", "PH Abgelaufen", "PH Erstattet",
    "PH Teilerstattet", "PH Checkout-Fehler", "PH Pruefen", "PH Erstellt", "PH Teilweise eingeloest", "PH Eingeloest", ]
_WORKFLOW_ACTIONS = ["Abholbereit melden", "Abgeholt", "Widerruf erfassen", "Zurück auf Offen", "Als geprüft übernehmen"]
_EMAIL_TEMPLATES = [
    "PH Shop Bestellbestätigung", "PH Shop Abholbereit", "PH Shop Zahlung fehlgeschlagen", "PH Shop Reservierung abgelaufen",
    "PH Gutschein Versand", "PH Widerruf Eingangsbestätigung", "PH Anzahlung erhalten", "PH Anzahlung Zahlungslink", "PH Shop Teamhinweis",
    "PH Shop Zahlungslink", "PH Shop Versendet",
]
fixtures = [
    {"dt": "Workspace", "filters": [["module", "=", "PH Shop"]]},
    {"dt": "Workflow", "filters": [["document_type", "in", ["PH Bestellung", "PH Gutschein"]]]},
    {"dt": "Workflow State", "filters": [["name", "in", _WORKFLOW_STATES]]},
    {"dt": "Workflow Action Master", "filters": [["name", "in", _WORKFLOW_ACTIONS]]},
    {"dt": "Kanban Board", "filters": [["reference_doctype", "in", ["PH Bestellung", "PH Widerruf", "PH Retoure"]]]},
    {"dt": "Print Format", "filters": [["module", "=", "PH Shop"]]},
    {"dt": "Dashboard Chart", "filters": [["module", "=", "PH Shop"]]},
    {"dt": "Number Card", "filters": [["module", "=", "PH Shop"]]},
    {"dt": "Email Template", "filters": [["name", "in", _EMAIL_TEMPLATES]]},
    {"dt": "Custom Field", "filters": [["module", "=", "PH Shop"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "PH Shop"]]},
    {"dt": "Client Script", "filters": [["module", "=", "PH Shop"]]},
]

# Nach der Installation: Einstellungen anlegen, Schlüssel-Vorhandensein spiegeln (idempotent, ohne Geheimnisse).
after_install = "ph_shop.install.after_install"

doc_events = {}

# Kundenakte (Hook-Vertrag von ph_crm, s. ph_crm README „Kontakt-Zeitleiste/DSGVO/Zusammenführen“):
# Zeitleiste, Datenauskunft, Anonymisierung (BAO § 132: 7 Jahre) und Nacharbeit nach Kontakt-Zusammenführung.
ph_kontakt_zeitleiste = ["ph_shop.ph_shop.kontakt.zeitleiste"]
ph_kontakt_datenauskunft = ["ph_shop.ph_shop.kontakt.datenauskunft"]
ph_kontakt_anonymisieren = ["ph_shop.ph_shop.kontakt.anonymisieren"]
ph_kontakt_zusammengefuehrt = ["ph_shop.ph_shop.kontakt.zusammengefuehrt"]

# Zeiten Europe/Vienna (System Settings). Funktionen: ph_shop/ph_shop/tasks.py
scheduler_events = {
    "hourly": ["ph_shop.ph_shop.tasks.offene_checkouts_pruefen"],
    "cron": {
        "0 5 * * *": ["ph_shop.ph_shop.tasks.stripe_abgleich"],
        "0 6 * * *": ["ph_shop.ph_shop.tasks.fristen_pruefen", "ph_shop.ph_shop.tasks.automatisch_abschliessen"],
        "30 3 * * *": ["ph_shop.ph_shop.tasks.ereignisse_aufraeumen", "ph_shop.ph_shop.tasks.wunschlisten_aufraeumen"],
    },
}

# Erweiterungspunkte für andere PH-Apps (jeweils Liste dotted paths bzw. dict art → dotted path):
#   ph_stripe_art_handler       = [{"kassa": "ph_kassa.stripe.webhook_handler"}]   (metadata.art → eigene Verarbeitung)
#   ph_shop_rechnung_erstellen  = ["ph_faktura.api.rechnung_aus_bestellung"]        (Button „Rechnung erstellen“, fn(bestellung_doc))
#   ph_shop_lieferschein_erstellen = ["ph_logistik.api.lieferschein_aus_bestellung"] (Button „Packen“, fn(bestellung_doc))
#   ph_shop_gutschrift_erstellen   = ["ph_faktura.api.gutschrift_aus_bestellung"]   (Teilerstattung/Teilstorno nach Zahlung,
#                                    fn(bestellung_doc, erstattung_zeile) → Belegnummer; satz_json = USt je Satz)
ph_stripe_art_handler = []
ph_shop_rechnung_erstellen = []
ph_shop_lieferschein_erstellen = []
ph_shop_gutschrift_erstellen = []

# Keine eigenen Website-Routen: die Website ist Next.js (platzhirsch.studio).
website_route_rules = []
