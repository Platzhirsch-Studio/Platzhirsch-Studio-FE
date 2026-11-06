"""Patch 04.11.2026: Standard-Checklisten anlegen; Altdaten „PH Abwesenheit · Krankenstand“ in PH Krankmeldung
überführen (Gesundheitsdatum, eigene Rechte) – idempotent. Seit dieser Version kennt PH Abwesenheit die Art
Krankenstand nicht mehr."""

import frappe


def execute():
    from ph_personal.install import checklisten_anlegen

    checklisten_anlegen()
    alt = frappe.db.sql(
        "select name, mitarbeiter, von, bis, status, begruendung from `tabPH Abwesenheit` where art = %s",
        ("Krankenstand",),
        as_dict=True,
    )
    for a in alt:
        if a.status in ("Abgelehnt", "Storniert"):
            frappe.db.set_value("PH Abwesenheit", a.name, {"art": "Sonderurlaub", "begruendung": "(alt: Krankenstand, abgelehnt/storniert – überführt)"}, update_modified=False)
            continue
        if not frappe.db.exists("PH Krankmeldung", {"mitarbeiter": a.mitarbeiter, "von": a.von}):
            k = frappe.get_doc({"doctype": "PH Krankmeldung", "mitarbeiter": a.mitarbeiter, "von": a.von, "bis_offen": 0, "bis_voraussichtlich": a.bis, "meldeweg": "Sonstiges", "notiz": f"Überführt aus {a.name}"})
            k.flags.ignore_permissions = True
            frappe.flags.ph_personal_abschluss_ignorieren = True
            k.insert()
            k.db_set({"bis": a.bis, "status": "Beendet"})
            frappe.flags.ph_personal_abschluss_ignorieren = False
        frappe.db.set_value("PH Abwesenheit", a.name, {"status": "Storniert", "workflow_state": "PH Storniert", "begruendung": "In PH Krankmeldung überführt"}, update_modified=False)
        frappe.db.sql("update `tabPH Abwesenheit` set art = %s where name = %s", ("Sonderurlaub", a.name))
    frappe.db.commit()
