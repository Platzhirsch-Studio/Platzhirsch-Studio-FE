"""Gemeinsame Helfer für Site-Tests (FrappeTestCase): Testkontakt, Stufen/Vorteile, Einstellungen, Website-Sitzung."""

import frappe

from ph_kundenkarte.install import after_install

TEST_EMAIL = "kundenkarte-test@example.com"


def einstellungen_fuer_tests():
    frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
    frappe.db.set_single_value("PH Einstellungen", "testmodus", 1)
    frappe.cache().delete_value("ph_core:einstellungen")
    frappe.cache().delete_value("ph_kundenkarte:einstellungen")
    frappe.cache().delete_value("ph_kundenkarte:stufen")
    if not frappe.db.exists("PH Kundenkarte Stufe", "Platzhirsch"):
        after_install()
    frappe.db.set_single_value("PH Kundenkarte Einstellungen", "startstufe", "Platzhirsch")
    frappe.cache().delete_value("ph_kundenkarte:einstellungen")


def testkontakt(email=TEST_EMAIL, nachname="Kartentest", vorname="Anna"):
    name = frappe.db.get_value("PH Kontakt", {"email": email}, "name")
    if name:
        return name
    k = frappe.get_doc({"doctype": "PH Kontakt", "vorname": vorname, "nachname": nachname, "email": email, "telefon": "+43 660 0000000", "kontaktart": "Privat", "status": "Kunde", "plz": "6911", "ort": "Lochau", "sprache": "de"})
    k.flags.ignore_mandatory = True
    k.flags.ignore_permissions = True
    k.insert()
    return k.name


def testkarte(kontakt=None, **werte):
    daten = {"doctype": "PH Kundenkarte", "kontakt": kontakt or testkontakt(), "status": "Aktiv", "kanal": "showroom", "einwilligung_auswertung": 1, "einwilligung_textversion": "test-v1"}
    daten.update(werte)
    doc = frappe.get_doc(daten)
    doc.flags.ignore_permissions = True
    doc.insert()
    return doc


def vorteil(titel):
    return frappe.db.get_value("PH Kundenkarte Vorteil", {"titel": titel}, "name")


def aufraeumen(doctype, filters):
    for n in frappe.get_all(doctype, filters=filters, pluck="name"):
        frappe.delete_doc(doctype, n, force=True, ignore_permissions=True)
