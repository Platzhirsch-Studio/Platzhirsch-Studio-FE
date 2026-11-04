"""doc_events-Handler (hooks.py): Zahlungen aus ph_shop/ph_kassa auf Rechnungen verbuchen."""

import frappe
from frappe.utils import cint, getdate

from ph_faktura import zahlung


def _rechnung_der_zahlung(doc):
    if doc.get("ph_faktura_rechnung"):
        return doc.ph_faktura_rechnung
    if doc.get("bezug_doctype") == "PH Rechnung" and doc.get("bezug"):
        return doc.bezug
    if doc.get("bezug_doctype") == "PH Kassenbeleg" and doc.get("bezug") and frappe.db.exists("DocType", "PH Kassenbeleg"):
        # Kassa: Rechnung steht am Kassenbeleg (ph_faktura.ph_faktura.kassa.kassenbeleg_gebucht deckt Auftrag/Zahlungsplan ab)
        return frappe.db.get_value("PH Kassenbeleg", doc.bezug, "rechnung")
    # Zahlungsreferenz = Rechnungsnummer (Überweisung, Kassa, Stripe-Metadaten)
    ref = (doc.get("zahlungsreferenz") or "").strip().upper()
    if ref and frappe.db.exists("PH Rechnung", {"name": ref, "docstatus": 1}):
        return ref
    return None


def zahlung_gebucht(doc, method=None):
    """PH Zahlung on_submit: Art Eingang mit Rechnungsbezug → OP der Rechnung fortschreiben (idempotent)."""
    if doc.flags.get("ph_faktura_intern") or frappe.flags.get("ph_faktura_bucht") or doc.get("art") != "Eingang":
        return  # Faktura-Aufrufer (zahlung.buche) schreiben die OP-Zeile selbst
    rechnung = _rechnung_der_zahlung(doc)
    if not rechnung:
        return
    try:
        re = frappe.get_doc("PH Rechnung", rechnung)
        if re.docstatus != 1:
            return
        zeit = doc.get("zeitpunkt")
        zahlung.zahlung_auf_rechnung(re, cint(doc.betrag_cent), doc.get("kanal") or "Verrechnung", getdate(zeit) if zeit else None, zahlung_name=doc.name, hinweis=doc.get("stripe_payment_intent") or doc.get("bank_referenz"))
        if doc.meta.has_field("ph_faktura_rechnung") and not doc.get("ph_faktura_rechnung"):
            doc.db_set("ph_faktura_rechnung", rechnung, update_modified=False)
    except Exception:  # noqa: BLE001 – Zahlung darf nie an der Faktura scheitern
        frappe.log_error(title=f"ph_faktura: Zahlung {doc.name} auf Rechnung {rechnung}")


def zahlung_storniert(doc, method=None):
    """PH Zahlung on_cancel: Zuordnung aus der Rechnung entfernen und OP neu berechnen."""
    rechnung = _rechnung_der_zahlung(doc)
    if not rechnung or not frappe.db.exists("PH Rechnung", rechnung):
        return
    try:
        re = frappe.get_doc("PH Rechnung", rechnung)
        rows = [z for z in re.zahlungen if z.zahlung == doc.name]
        if not rows:
            return
        for z in rows:
            re.remove(z)
        bezahlt = sum(cint(z.betrag_cent) for z in re.zahlungen)
        offen = cint(re.zahlbar_cent) - bezahlt
        re.bezahlt_cent = bezahlt
        re.offen_cent = max(offen, 0)
        re.status = "Gestellt" if bezahlt == 0 else "Teilbezahlt"
        re.workflow_state = f"PH {re.status}"
        re.bezahlt_am = None
        re.flags.ignore_permissions = True
        re.save()
        re.add_comment("Info", f"Zahlung {doc.name} storniert – OP neu berechnet")
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_faktura: Zahlungsstorno {doc.name}")


def einstellungen_geaendert(doc, method=None):
    from ph_faktura.einstellungen import cache_leeren

    cache_leeren()
