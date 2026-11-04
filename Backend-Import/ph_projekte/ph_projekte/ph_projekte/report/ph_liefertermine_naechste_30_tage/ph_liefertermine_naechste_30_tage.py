"""Script Report PH Liefertermine nächste 30 Tage: Projekte mit geplantem Liefertermin, Montagen und
Fremdgewerk-Terminen im Zeitfenster – eine Zeile je Termin (Zeitplanung Lager/Tour/Montage)."""

import frappe
from frappe import _
from frappe.utils import add_days, get_datetime, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or nowdate())
    bis = getdate(filters.get("bis") or add_days(nowdate(), 30))
    data = []

    for p in frappe.get_all("PH Projekt", filters={"liefertermin_geplant": ("between", [von, bis]), "status": ("not in", ("Abgeschlossen", "Abgebrochen"))}, fields=["name", "titel", "kunde_name", "status", "liefertermin_geplant", "objekt_ort", "berater"]):
        data.append({"datum": p.liefertermin_geplant, "art": "Lieferung", "projekt": p.name, "titel": p.titel, "kunde_name": p.kunde_name, "ort": p.objekt_ort, "status": p.status, "beleg_doctype": "PH Projekt", "beleg": p.name, "zustaendig": p.berater})
    for m in frappe.get_all("PH Montageauftrag", filters={"start": ("between", [f"{von} 00:00:00", f"{bis} 23:59:59"]), "status": ("!=", "Abgebrochen")}, fields=["name", "projekt", "start", "status", "ort", "montageleiter"]):
        pr = frappe.db.get_value("PH Projekt", m.projekt, ["titel", "kunde_name"], as_dict=True) or {}
        data.append({"datum": get_datetime(m.start).date(), "art": "Montage", "projekt": m.projekt, "titel": pr.get("titel"), "kunde_name": pr.get("kunde_name"), "ort": m.ort, "status": m.status, "beleg_doctype": "PH Montageauftrag", "beleg": m.name, "zustaendig": m.montageleiter})
    for g in frappe.get_all("PH Fremdgewerk", filters={"termin_von": ("between", [f"{von} 00:00:00", f"{bis} 23:59:59"]), "status": ("!=", "Abgesagt")}, fields=["name", "projekt", "termin_von", "status", "gewerk", "partner_text"]):
        pr = frappe.db.get_value("PH Projekt", g.projekt, ["titel", "kunde_name", "objekt_ort"], as_dict=True) or {}
        data.append({"datum": get_datetime(g.termin_von).date(), "art": f"Gewerk {g.gewerk}", "projekt": g.projekt, "titel": pr.get("titel"), "kunde_name": pr.get("kunde_name"), "ort": pr.get("objekt_ort"), "status": g.status, "beleg_doctype": "PH Fremdgewerk", "beleg": g.name, "zustaendig": g.partner_text})
    # Wareneingänge: PH Herstellerbestellung (ph_sortiment) hat keinen Projekt-Link, sondern bezug_doctype/bezug_name
    # (Dynamic Link) und den Termin `bestaetigter_termin` (sonst `wunschtermin`) – Feldnamen geprüft 04.11.2026.
    if frappe.db.exists("DocType", "PH Herstellerbestellung"):
        try:
            ab_projekt = {}
            if frappe.db.exists("DocType", "PH Auftragsbestaetigung"):
                for ab in frappe.get_all("PH Auftragsbestaetigung", filters={"projekt": ("is", "set")}, fields=["name", "projekt"], limit=2000):
                    ab_projekt[ab.name] = ab.projekt
            for h in frappe.get_all(
                "PH Herstellerbestellung",
                filters={"docstatus": ("<", 2), "status": ("not in", ("Geliefert", "Abgeschlossen", "Storniert"))},
                fields=["name", "bezug_doctype", "bezug_name", "bestaetigter_termin", "wunschtermin", "status", "lieferant"],
            ):
                termin = h.bestaetigter_termin or h.wunschtermin
                if not termin or not (von <= getdate(termin) <= bis):
                    continue
                projekt = None
                if h.bezug_doctype == "PH Projekt":
                    projekt = h.bezug_name
                elif h.bezug_doctype == "PH Auftragsbestaetigung":
                    projekt = ab_projekt.get(h.bezug_name)
                pr = frappe.db.get_value("PH Projekt", projekt, ["titel", "kunde_name"], as_dict=True) if projekt else {}
                data.append({"datum": getdate(termin), "art": "Wareneingang", "projekt": projekt, "titel": (pr or {}).get("titel"), "kunde_name": (pr or {}).get("kunde_name"), "ort": "Lager", "status": h.status, "beleg_doctype": "PH Herstellerbestellung", "beleg": h.name, "zustaendig": h.lieferant})
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Liefertermine: Herstellerbestellung")

    if filters.get("projekt"):
        data = [d for d in data if d["projekt"] == filters.projekt]
    data.sort(key=lambda d: (str(d["datum"]), d["art"]))
    columns = [
        {"fieldname": "datum", "label": _("Datum"), "fieldtype": "Date", "width": 100},
        {"fieldname": "art", "label": _("Art"), "fieldtype": "Data", "width": 120},
        {"fieldname": "projekt", "label": _("Projekt"), "fieldtype": "Link", "options": "PH Projekt", "width": 140},
        {"fieldname": "titel", "label": _("Titel"), "fieldtype": "Data", "width": 180},
        {"fieldname": "kunde_name", "label": _("Kunde"), "fieldtype": "Data", "width": 140},
        {"fieldname": "ort", "label": _("Ort"), "fieldtype": "Data", "width": 120},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
        {"fieldname": "zustaendig", "label": _("Zuständig / Partner"), "fieldtype": "Data", "width": 150},
        {"fieldname": "beleg", "label": _("Beleg"), "fieldtype": "Dynamic Link", "options": "beleg_doctype", "width": 150},
    ]
    je_tag = {}
    for d in data:
        je_tag[str(d["datum"])] = je_tag.get(str(d["datum"]), 0) + 1
    labels = sorted(je_tag)
    chart = {"data": {"labels": labels, "datasets": [{"name": _("Termine"), "values": [je_tag[k] for k in labels]}]}, "type": "bar", "colors": ["#1d4ed8"]}
    summary = [
        {"value": len(data), "label": _("Termine"), "datatype": "Int"},
        {"value": sum(1 for d in data if d["art"] == "Lieferung"), "label": _("Lieferungen"), "datatype": "Int", "indicator": "Blue"},
        {"value": sum(1 for d in data if d["art"] == "Montage"), "label": _("Montagen"), "datatype": "Int", "indicator": "Orange"},
    ]
    return columns, data, None, chart, summary
