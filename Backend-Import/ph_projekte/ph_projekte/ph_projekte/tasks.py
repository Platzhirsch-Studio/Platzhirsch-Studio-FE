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


def maengel_fristen_pruefen():
    """Täglich 07:15: überfällige Mängel (Montage-, Fremdgewerk-, Abnahme-Mängel) → PH Projekt Aufgabe an Montageleiter/Berater,
    höchstens alle X Tage je Mangel (PH Projekte Einstellungen.maengel_erinnerung_tage). Groß/klein bei „behoben“ egal."""
    from ph_projekte.utils.maengel import erinnerung_faellig, ist_erledigt, tage_ueberfaellig

    heute = nowdate()
    intervall = cint(frappe.db.get_single_value("PH Projekte Einstellungen", "maengel_erinnerung_tage")) or 3
    quellen = (
        ("PH Montage Mangel", ["name", "parent", "parenttype", "beschreibung", "frist", "status", "behoben_am", "erinnert_am", "verantwortlich", "verantwortlich_ref"]),
        ("PH Abnahme Position", ["name", "parent", "parenttype", "bezeichnung", "beschreibung", "frist", "erledigt", "zustand", "erinnert_am", "verantwortlich", "verantwortlich_ref"]),
    )
    for dt, felder in quellen:
        for m in frappe.get_all(dt, filters={"frist": ("<", heute)}, fields=felder, limit=2000):
            try:
                if dt == "PH Abnahme Position" and m.zustand == "ok":
                    continue
                if ist_erledigt(m.get("status"), m.get("behoben_am"), m.get("erledigt")) or not erinnerung_faellig(m.frist, m.erinnert_am, heute, intervall):
                    continue
                projekt = frappe.db.get_value(m.parenttype, m.parent, "projekt")
                if not projekt:
                    continue
                verantwortlich = None
                if m.parenttype == "PH Montageauftrag":
                    verantwortlich = frappe.db.get_value("PH Montageauftrag", m.parent, "montageleiter")
                p = frappe.db.get_value("PH Projekt", projekt, ["montageleiter", "berater"], as_dict=True) or {}
                verantwortlich = verantwortlich or p.get("montageleiter") or p.get("berater") or "Administrator"
                text = (m.get("beschreibung") or m.get("bezeichnung") or _("Mangel"))[:100]
                wer = f" ({_(m.verantwortlich)}: {m.verantwortlich_ref or ''})" if m.verantwortlich else ""
                frappe.get_doc(
                    {
                        "doctype": "PH Projekt Aufgabe",
                        "projekt": projekt,
                        "titel": _("Mangel überfällig ({0} Tage): {1}").format(tage_ueberfaellig(m.frist, heute), text)[:140],
                        "art": "Service",
                        "prioritaet": "Hoch",
                        "faellig": heute,
                        "zugewiesen_an": verantwortlich,
                        "referenz_doctype": m.parenttype,
                        "referenz_name": m.parent,
                        "beschreibung": _("Frist {0} überschritten{1}.").format(m.frist, wer),
                        "abrechenbar": 0,
                    }
                ).insert(ignore_permissions=True)
                frappe.db.set_value(dt, m.name, "erinnert_am", heute, update_modified=False)
                frappe.db.commit()
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"ph_projekte.tasks.maengel_fristen_pruefen {dt} {m.name}")


def kalkulation_pruefen():
    """Täglich 05:45: Projektnachkalkulation laufender Projekte (Cache, Warnungen) – ph_projekte/nachkalkulation.py."""
    from ph_projekte.ph_projekte.nachkalkulation import kalkulation_pruefen as pruefen

    pruefen()
