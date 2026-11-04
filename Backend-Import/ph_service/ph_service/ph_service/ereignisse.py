"""doc_events (hooks.py): Rückmeldungen von Einsatz/Regress/Kommentar in den Servicefall. Nie Ausnahmen werfen."""

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from ph_service.ph_service import kommunikation as kom


def serviceeinsatz_aktualisiert(doc, method=None):
    """Einsatz erledigt → Servicefall von „Einsatz geplant“ zurück auf „In Bearbeitung“ (Abschluss durch Sachbearbeitung)."""
    if not doc.servicefall or not doc.has_value_changed("status"):
        return
    try:
        if doc.status in ("Erledigt", "Nicht angetroffen", "Abgebrochen"):
            offen = frappe.db.count("PH Serviceeinsatz", {"servicefall": doc.servicefall, "status": ("in", ["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit"]), "name": ("!=", doc.name)})
            sf_status = frappe.db.get_value("PH Servicefall", doc.servicefall, "status")
            if offen == 0 and sf_status == "Einsatz geplant":
                sf = frappe.get_doc("PH Servicefall", doc.servicefall)
                sf.flags.ignore_permissions = True
                hinweis = _("Einsatz {0}: {1} – bitte Abschlussbericht erstellen").format(doc.name, _(doc.ergebnis or doc.status))
                sf._status_setzen("In Bearbeitung", hinweis)
        else:
            frappe.db.set_value("PH Servicefall", doc.servicefall, "letzte_bewegung", now_datetime(), update_modified=False)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_service: Einsatz → Servicefall")


def regress_aktualisiert(doc, method=None):
    """Summen und Status des Regresses in den Servicefall spiegeln."""
    try:
        from ph_service.ph_service.doctype.ph_lieferantenregress.ph_lieferantenregress import summen_je_servicefall

        gefordert, erhalten, status = summen_je_servicefall(doc.servicefall)
        sf = frappe.db.get_value("PH Servicefall", doc.servicefall, ["kosten_gesamt_cent", "kosten_kunde_cent", "regress_status"], as_dict=True)
        if not sf:
            return
        netto = cint(sf.kosten_gesamt_cent) - cint(sf.kosten_kunde_cent) - erhalten
        werte = {"regress_gefordert_cent": gefordert, "regress_erhalten_cent": erhalten, "regress_status": status, "netto_kosten_cent": netto, "regress_hinweis": doc.frist_hinweis, "letzte_bewegung": now_datetime()}
        frappe.db.set_value("PH Servicefall", doc.servicefall, werte, update_modified=False)
        if doc.has_value_changed("status") and sf.regress_status != status:
            sfdoc = frappe.get_doc("PH Servicefall", doc.servicefall)
            kom.verlauf(sfdoc, "Regress", status=sfdoc.status, hinweis=_("Regress {0}: {1}").format(doc.name, _(doc.status)), speichern=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_service: Regress → Servicefall")


def kommentar_eingefuegt(doc, method=None):
    """Kommentar am Servicefall zählt als Bewegung (verhindert falsche Eskalation)."""
    try:
        if doc.reference_doctype == "PH Servicefall" and doc.comment_type in ("Comment", "Info") and doc.reference_name:
            frappe.db.set_value("PH Servicefall", doc.reference_name, "letzte_bewegung", now_datetime(), update_modified=False)
    except Exception:  # noqa: BLE001
        pass
