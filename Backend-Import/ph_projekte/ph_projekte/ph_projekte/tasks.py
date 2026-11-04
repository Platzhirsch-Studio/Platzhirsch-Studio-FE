"""Zeitgesteuerte Jobs von ph_projekte (hooks.py → scheduler_events). Idempotent, nie werfen."""

import frappe
from frappe import _
from frappe.utils import add_days, cint, now_datetime, nowdate


def feedback_erinnerung():
    """Täglich 08:00: Renderings mit offenem Kundenfeedback älter als X Tage → PH Projekt Aufgabe an den Berater."""
    tage = cint(frappe.db.get_single_value("PH Projekte Einstellungen", "feedback_erinnerung_tage")) or 3
    grenze = add_days(now_datetime(), -tage)
    for r in frappe.get_all("PH Rendering", filters={"status": "Feedback offen", "letztes_feedback_am": ("<", grenze)}, fields=["name", "projekt", "titel"]):
        try:
            if frappe.db.exists("PH Projekt Aufgabe", {"referenz_doctype": "PH Rendering", "referenz_name": r.name, "status": ("in", ("Offen", "In Arbeit"))}):
                continue
            berater = frappe.db.get_value("PH Projekt", r.projekt, "berater") or frappe.db.get_value("PH Projekt", r.projekt, "planer")
            frappe.get_doc(
                {
                    "doctype": "PH Projekt Aufgabe",
                    "projekt": r.projekt,
                    "titel": _("Kundenfeedback beantworten: {0}").format(r.titel),
                    "art": "Planung",
                    "prioritaet": "Hoch",
                    "faellig": nowdate(),
                    "zugewiesen_an": berater or "Administrator",
                    "referenz_doctype": "PH Rendering",
                    "referenz_name": r.name,
                    "abrechenbar": 0,
                }
            ).insert(ignore_permissions=True)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"ph_projekte.tasks.feedback_erinnerung {r.name}")


def garantien_pruefen():
    """Täglich: Produktpässe mit abgelaufener Garantie markieren."""
    try:
        from ph_projekte.ph_projekte.doctype.ph_produktpass.ph_produktpass import garantie_pruefen

        garantie_pruefen()
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_projekte.tasks.garantien_pruefen")


def montage_erinnerung():
    """Täglich 07:00: Montagen von morgen → Aufgabe an den Montageleiter (Unterlagen/Team prüfen)."""
    morgen = add_days(nowdate(), 1)
    for m in frappe.get_all("PH Montageauftrag", filters={"status": "Geplant", "start": ("between", [f"{morgen} 00:00:00", f"{morgen} 23:59:59"])}, fields=["name", "projekt", "titel", "montageleiter"]):
        try:
            if frappe.db.exists("PH Projekt Aufgabe", {"referenz_doctype": "PH Montageauftrag", "referenz_name": m.name}):
                continue
            frappe.get_doc(
                {
                    "doctype": "PH Projekt Aufgabe",
                    "projekt": m.projekt,
                    "titel": _("Montage morgen vorbereiten: {0}").format(m.titel),
                    "art": "Montage",
                    "faellig": nowdate(),
                    "zugewiesen_an": m.montageleiter or frappe.db.get_value("PH Projekt", m.projekt, "montageleiter") or "Administrator",
                    "referenz_doctype": "PH Montageauftrag",
                    "referenz_name": m.name,
                    "abrechenbar": 0,
                }
            ).insert(ignore_permissions=True)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"ph_projekte.tasks.montage_erinnerung {m.name}")


def summen_aktualisieren():
    """Nächtlich: Auftragswert/bezahlt/offen/Zeiten je aktivem Projekt (ph_faktura nur wenn installiert)."""
    from ph_projekte.ph_projekte.doctype.ph_projekt.ph_projekt import OFFEN, summen

    for name in frappe.get_all("PH Projekt", filters={"status": ("in", OFFEN)}, pluck="name"):
        try:
            frappe.db.set_value("PH Projekt", name, summen(name), update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"ph_projekte.tasks.summen_aktualisieren {name}")
    frappe.db.commit()
