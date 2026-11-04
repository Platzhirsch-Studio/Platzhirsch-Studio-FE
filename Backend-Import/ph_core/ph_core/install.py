"""Erstinstallation von ph_core: Standarddaten ohne Geheimnisse, idempotent.

Läuft bei `bench --site <site> install-app ph_core` (hooks.after_install) und kann jederzeit
wiederholt werden: `bench --site <site> execute ph_core.install.after_install`.
"""

import frappe

# Firmenstammdaten (Quelle: Impressum platzhirsch.studio, Firmenbuch). Werte, die der Inhaber im Desk
# bereits geändert hat, werden nicht überschrieben – nur leere Felder werden nachgetragen.
FIRMA = {
    "doctype": "PH Firma",
    "firmenname": "MW Immobilienverwaltungs GmbH",
    "marke": "Platzhirsch",
    "kurzname": "Platzhirsch Home Living",
    "rechtsform": "GmbH",
    "strasse": "Landstraße 11",
    "plz": "6911",
    "ort": "Lochau",
    "land": "Österreich",
    "email": "info@platzhirsch.studio",
    "website": "https://platzhirsch.studio",
    "waehrung": "EUR",
    "firmenbuchnummer": "443753 d",
    "firmenbuchgericht": "Landesgericht Feldkirch",
    "uid": "ATU70035339",
    "standard": 1,
}
# Bankverbindung (IBAN/BIC/Bank) und Geschäftsführung trägt der Inhaber im Desk ein (keine Annahmen).

INTEGRATIONSBENUTZER = {
    "doctype": "User",
    "email": "website@platzhirsch.studio",
    "first_name": "Website",
    "last_name": "Integration",
    "user_type": "System User",
    "send_welcome_email": 0,
    "enabled": 1,
}


def after_install():
    firma_anlegen()
    einstellungen_anlegen()
    integrationsbenutzer_anlegen()
    frappe.db.commit()


def firma_anlegen():
    name = frappe.db.get_value("PH Firma", {"firmenname": FIRMA["firmenname"]}, "name")
    if not name:
        frappe.get_doc(FIRMA).insert(ignore_permissions=True)
        return
    # Vorhandene Firma: nur leere Stammdaten nachtragen (z. B. FN/UID nach Core-Update).
    doc = frappe.get_doc("PH Firma", name)
    geaendert = False
    for feld in ("firmenbuchnummer", "firmenbuchgericht", "uid", "kurzname", "rechtsform", "website"):
        if not doc.get(feld) and FIRMA.get(feld):
            doc.set(feld, FIRMA[feld])
            geaendert = True
    if not frappe.db.exists("PH Firma", {"standard": 1}):
        doc.standard = 1
        geaendert = True
    if geaendert:
        doc.save(ignore_permissions=True)


def einstellungen_anlegen():
    doc = frappe.get_single("PH Einstellungen")
    if not doc.standard_firma:
        doc.standard_firma = frappe.db.get_value("PH Firma", {"standard": 1}, "name")
    if not doc.get("feiertage_bundesland"):
        doc.feiertage_bundesland = "Vorarlberg"
    doc.save(ignore_permissions=True)


def integrationsbenutzer_anlegen():
    """Technischer Benutzer für die Website. API-Schlüssel erzeugt der Admin im Desk
    (User → API Access) und hinterlegt sie NUR in der Website-Umgebung, nie hier."""
    if frappe.db.exists("User", INTEGRATIONSBENUTZER["email"]):
        return
    user = frappe.get_doc(INTEGRATIONSBENUTZER)
    user.flags.no_welcome_mail = True
    user.insert(ignore_permissions=True)
    if frappe.db.exists("Role", "PH Website Integration"):
        user.add_roles("PH Website Integration")
