"""Hilfen für DocType-Tests (FrappeTestCase). PH Kontakt (ph_crm) kann auf einer Staging-Site fehlen – dann
werden Link-Prüfungen für den Testkontakt übersprungen."""

import frappe

TEST_KONTAKT = "PH-KON-TEST-FAKTURA"


def testkontakt(email="faktura-test@example.com"):
    """Name eines Testkontakts; legt ihn an, wenn PH Kontakt installiert ist."""
    if not frappe.db.exists("DocType", "PH Kontakt"):
        return TEST_KONTAKT
    name = frappe.db.get_value("PH Kontakt", {"email": email}, "name")
    if name:
        return name
    doc = frappe.get_doc({"doctype": "PH Kontakt", "vorname": "Anna", "nachname": "Testkundin", "email": email, "strasse": "Seestraße 1", "plz": "6900", "ort": "Bregenz", "land": "AT"})
    doc.flags.ignore_mandatory = True
    doc.insert(ignore_permissions=True)
    return doc.name


def beleg(doctype, **werte):
    """Dokument mit Testkontakt; ohne PH Kontakt werden Links nicht geprüft."""
    doc = frappe.get_doc({"doctype": doctype, "kontakt": werte.pop("kontakt", None) or testkontakt(), "kunde_name": werte.pop("kunde_name", "Anna Testkundin"), "strasse": "Seestraße 1", "plz": "6900", "ort": "Bregenz", "land": "AT", **werte})
    if not frappe.db.exists("DocType", "PH Kontakt"):
        doc.flags.ignore_links = True
    return doc


def position(bezeichnung="Sofa Testmodell", menge=1, einzel_netto_cent=100000, ust_satz_promille=2000, **kw):
    return {"art": "Produkt", "bezeichnung": bezeichnung, "menge": menge, "einzel_netto_cent": einzel_netto_cent, "ust_satz_promille": ust_satz_promille, **kw}


def einstellungen_testmodus():
    frappe.db.set_single_value("PH Faktura Einstellungen", "pdf_bei_stellen", 0)
    from ph_faktura.einstellungen import cache_leeren

    cache_leeren()
