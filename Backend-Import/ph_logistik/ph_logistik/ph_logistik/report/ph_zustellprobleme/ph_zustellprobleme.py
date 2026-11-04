"""Script Report: Sendungen mit Problem (offen oder im Zeitraum), letzter Tracking-Text, Tage seit Buchung."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, now_datetime, nowdate


def execute(filters=None):
    f = frappe._dict(filters or {})
    von = getdate(f.get("von") or add_months(nowdate(), -3))
    bis = getdate(f.get("bis") or nowdate())
    filt = {"status": "Problem"} if int(f.get("nur_offen") or 0) else {"creation": ("between", [von, bis]), "status": ("in", ["Problem", "Zugestellt", "Storniert"])}
    rows = frappe.get_all("PH Sendung", filt, ["name", "status", "carrier", "tracking_nr", "tracking_url", "lieferschein", "bestellung", "empf_ort", "empf_land", "gebucht_am", "letzter_abgleich", "fehler", "richtung"], order_by="modified desc")
    data = []
    for r in rows:
        letzte = frappe.get_all("PH Sendung Tracking", {"parent": r.name}, ["code", "text", "zeit"], order_by="idx desc", limit=1)
        war_problem = r.status == "Problem" or frappe.db.exists("PH Sendung Tracking", {"parent": r.name, "status": "Problem"})
        if not war_problem:
            continue
        data.append({**r, "letzter_code": letzte[0].code if letzte else None, "letzter_text": letzte[0].text if letzte else r.fehler, "tage": round((now_datetime() - r.gebucht_am).total_seconds() / 86400, 1) if r.gebucht_am else None})
    columns = [
        {"fieldname": "name", "label": _("Sendung"), "fieldtype": "Link", "options": "PH Sendung", "width": 150},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 90},
        {"fieldname": "richtung", "label": _("Richtung"), "fieldtype": "Data", "width": 80},
        {"fieldname": "carrier", "label": _("Carrier"), "fieldtype": "Data", "width": 110},
        {"fieldname": "tracking_nr", "label": _("Tracking"), "fieldtype": "Data", "width": 140},
        {"fieldname": "empf_ort", "label": _("Ort"), "fieldtype": "Data", "width": 120},
        {"fieldname": "empf_land", "label": _("Land"), "fieldtype": "Data", "width": 60},
        {"fieldname": "tage", "label": _("Tage seit Buchung"), "fieldtype": "Float", "width": 110},
        {"fieldname": "letzter_code", "label": _("Letzter Code"), "fieldtype": "Data", "width": 120},
        {"fieldname": "letzter_text", "label": _("Text"), "fieldtype": "Data", "width": 240},
        {"fieldname": "lieferschein", "label": _("Lieferschein"), "fieldtype": "Link", "options": "PH Lieferschein", "width": 140},
        {"fieldname": "bestellung", "label": _("Bestellung"), "fieldtype": "Link", "options": "PH Bestellung", "width": 150},
    ]
    offen = sum(1 for d in data if d["status"] == "Problem")
    summary = [{"value": len(data), "label": _("Mit Problem"), "datatype": "Int"}, {"value": offen, "label": _("Offen"), "datatype": "Int", "indicator": "Red" if offen else "Green"}]
    return columns, data, None, None, summary
