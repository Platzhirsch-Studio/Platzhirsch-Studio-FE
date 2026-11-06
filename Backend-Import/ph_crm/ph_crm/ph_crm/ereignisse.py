"""doc_events-Handler (hooks.py). Nie Ausnahmen werfen – nur protokollieren."""

import frappe


def event_geloescht(doc, method=None):
    """Frappe-Event gelöscht → Verweis im PH Termin entfernen."""
    try:
        for name in frappe.get_all("PH Termin", filters={"event": doc.name}, pluck="name"):
            frappe.db.set_value("PH Termin", name, "event", None, update_modified=False)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Termin: Event-Verweis konnte nicht gelöst werden")


def _kontakt_zur_mail(doc):
    """Kontakt einer Communication: Bezugsdokument mit Feld `kontakt` (jede App), sonst Absender (Eingang)
    bzw. erster Empfänger (Ausgang) über die normalisierte E-Mail."""
    if doc.reference_doctype == "PH Kontakt" and doc.reference_name:
        return doc.reference_name
    if doc.reference_doctype and doc.reference_name and frappe.db.exists("DocType", doc.reference_doctype):
        meta = frappe.get_meta(doc.reference_doctype)
        if meta.has_field("kontakt") and meta.get_field("kontakt").options == "PH Kontakt":
            k = frappe.db.get_value(doc.reference_doctype, doc.reference_name, "kontakt")
            if k:
                return k
    from email.utils import getaddresses

    roh = doc.sender if doc.sent_or_received == "Received" else (doc.recipients or "").split(",")[0]
    adressen = [a for _n, a in getaddresses([roh or ""]) if a]
    if adressen:
        return frappe.db.get_value("PH Kontakt", {"email": adressen[0].strip().lower()}, "name")
    return None


def kommunikation_an_kontakt(doc, method=None):
    """E-Mail-Ein- und -Ausgang am Kontakt: jede Mail mit Bezug (Anfrage, Termin, Projekt, Rechnung … – jede
    DocType mit Feld `kontakt`) oder mit bekannter Absender-/Empfängeradresse erscheint in der Zeitleiste der
    Kundenakte (Timeline-Link) und setzt „Letzter Kontakt“."""
    try:
        if doc.communication_type not in (None, "", "Communication") or doc.communication_medium not in (None, "", "Email", "Phone", "Chat"):
            return
        kontakt = _kontakt_zur_mail(doc)
        if not kontakt:
            return
        from ph_crm.ph_crm.kontakt360 import letzter_kontakt_setzen

        letzter_kontakt_setzen(kontakt, doc.communication_date or frappe.utils.now_datetime(), "Anruf" if doc.communication_medium == "Phone" else "E-Mail")
        if doc.reference_doctype == "PH Kontakt" and doc.reference_name == kontakt:
            return
        if doc.flags.ph_crm_verknuepft or frappe.db.exists("Communication Link", {"parent": doc.name, "link_doctype": "PH Kontakt", "link_name": kontakt}):
            return
        doc.flags.ph_crm_verknuepft = True
        doc.append("timeline_links", {"link_doctype": "PH Kontakt", "link_name": kontakt})
        doc.save(ignore_permissions=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH CRM: Kommunikation konnte nicht am Kontakt verknüpft werden")
