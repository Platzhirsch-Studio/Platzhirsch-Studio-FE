"""Gemeinsame Helfer für Site-Tests (FrappeTestCase): Testkontakt, Testfall, Einstellungen."""

import frappe
from frappe.utils import add_months, nowdate

TEST_EMAIL = "service-test@example.com"


def einstellungen_fuer_tests():
    frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
    frappe.db.set_single_value("PH Einstellungen", "testmodus", 1)
    frappe.cache().delete_value("ph_core:einstellungen")
    frappe.cache().delete_value("ph_service:einstellungen")


def testkontakt(email=TEST_EMAIL, nachname="Servicetest", kontaktart="Privat"):
    """PH Kontakt (ph_crm) anlegen oder finden; Felder laut PLAN WP2, fehlende Pflichtfelder ignoriert."""
    name = frappe.db.get_value("PH Kontakt", {"email": email}, "name")
    if name:
        return name
    k = frappe.get_doc({"doctype": "PH Kontakt", "vorname": "Anna", "nachname": nachname, "email": email, "telefon": "+43 660 0000000", "kontaktart": kontaktart, "status": "Kunde", "strasse": "Teststraße 1", "plz": "6911", "ort": "Lochau", "land": "Österreich", "sprache": "de"})
    k.flags.ignore_mandatory = True
    k.flags.ignore_permissions = True
    k.insert()
    return k.name


def testfall(**werte):
    daten = {
        "doctype": "PH Servicefall",
        "kontakt": testkontakt(),
        "art": "Mangel",
        "beschreibung": "Scharnier der linken Tür hängt durch.",
        "produkt_name": "Testschrank",
        "kaufdatum": add_months(nowdate(), -3),
        "uebergabe_datum": add_months(nowdate(), -2),
        "kundentyp": "Verbraucher",
    }
    daten.update(werte)
    doc = frappe.get_doc(daten)
    doc.flags.ignore_permissions = True
    doc.insert()
    return doc


def aufraeumen(doctype, filters):
    for n in frappe.get_all(doctype, filters=filters, pluck="name"):
        frappe.delete_doc(doctype, n, force=True, ignore_permissions=True)
