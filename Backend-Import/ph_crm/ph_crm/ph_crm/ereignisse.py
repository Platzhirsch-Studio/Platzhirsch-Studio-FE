"""doc_events-Handler (hooks.py). Nie Ausnahmen werfen – nur protokollieren."""

import frappe


def event_geloescht(doc, method=None):
    """Frappe-Event gelöscht → Verweis im PH Termin entfernen."""
    try:
        for name in frappe.get_all("PH Termin", filters={"event": doc.name}, pluck="name"):
            frappe.db.set_value("PH Termin", name, "event", None, update_modified=False)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Termin: Event-Verweis konnte nicht gelöst werden")


def kommunikation_an_kontakt(doc, method=None):
    """Eingehende Mail an eine PH Anfrage / einen PH Termin zusätzlich am Kontakt in der Timeline zeigen."""
    try:
        if doc.reference_doctype not in ("PH Anfrage", "PH Termin") or not doc.reference_name:
            return
        kontakt = frappe.db.get_value(doc.reference_doctype, doc.reference_name, "kontakt")
        if not kontakt:
            return
        if doc.flags.ph_crm_verknuepft or frappe.db.exists("Communication Link", {"parent": doc.name, "link_doctype": "PH Kontakt", "link_name": kontakt}):
            return
        doc.flags.ph_crm_verknuepft = True
        doc.append("timeline_links", {"link_doctype": "PH Kontakt", "link_name": kontakt})
        doc.save(ignore_permissions=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH CRM: Kommunikation konnte nicht am Kontakt verknüpft werden")
