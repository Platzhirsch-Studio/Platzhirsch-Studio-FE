"""Gemeinsame Hilfen für DocType-Tests (nur mit Site: bench --site <site> run-tests --app ph_logistik)."""

import frappe


def produkt(name="Testglas Riedel", **felder):
    """Minimales PH Produkt (ph_sortiment) – tolerant gegenüber Pflichtfeldern, die der Sortiment-Agent festlegt."""
    vorhanden = frappe.db.get_value("PH Produkt", {"name_herstellerbezeichnung": name}, "name")
    if vorhanden:
        return vorhanden
    doc = frappe.get_doc({"doctype": "PH Produkt", "name_herstellerbezeichnung": name, "status": "Aktiv", **felder})
    doc.flags.ignore_mandatory = True
    doc.flags.ignore_links = True
    doc.insert(ignore_permissions=True)
    return doc.name


def lagerort(bezeichnung="Testlager", art="Lager"):
    if not frappe.db.exists("PH Lagerort", bezeichnung):
        frappe.get_doc({"doctype": "PH Lagerort", "bezeichnung": bezeichnung, "art": art, "plz": "6911", "ort": "Lochau", "land": "AT", "strasse": "Landstraße 11"}).insert(ignore_permissions=True)
    return bezeichnung


def paketprofile():
    from ph_logistik.install import paketprofile_anlegen

    paketprofile_anlegen()


def lieferschein(lieferart="Versand", positionen=None, **felder):
    doc = frappe.get_doc(
        {
            "doctype": "PH Lieferschein",
            "lieferart": lieferart,
            "kunde_name": "Anna Muster",
            "kunde_email": "anna@example.com",
            "liefer_name": "Anna Muster",
            "liefer_strasse": "Seestraße",
            "liefer_hausnr": "1",
            "liefer_plz": "6900",
            "liefer_ort": "Bregenz",
            "liefer_land": "AT",
            "positionen": positionen or [{"beschreibung": "Riedel Veritas 2er", "menge": 2, "ean": "4001234567890", "slug": "riedel-veritas", "zerbrechlich": 1, "einzel_cent": 5900, "paketprofil": "glas-2er-set"}],
            **felder,
        }
    )
    doc.insert(ignore_permissions=True)
    return doc


def testmodus():
    frappe.db.set_single_value("PH Logistik Einstellungen", "letmeship_testmodus", 1)
    from ph_logistik.ph_logistik.helfer import cache_leeren

    cache_leeren()
    from ph_logistik.letmeship.dienst import mock_zuruecksetzen

    mock_zuruecksetzen()
