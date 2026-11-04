"""Script Report: Laufzeiten (Buchung → Zustellung) je Carrier/Dienst/Land, mit versprochener Laufzeit."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate

from ph_logistik.letmeship.status import laufzeit_tage


def execute(filters=None):
    f = frappe._dict(filters or {})
    von = getdate(f.get("von") or add_months(nowdate(), -3))
    bis = getdate(f.get("bis") or nowdate())
    rows = frappe.get_all("PH Sendung", {"gebucht_am": ("between", [von, bis]), "status": "Zugestellt", "richtung": "Ausgang"}, ["carrier", "service_name", "empf_land", "gebucht_am", "zugestellt_am", "laufzeit_tage"])
    feld = {"Carrier": "carrier", "Dienst": "service_name", "Land": "empf_land"}.get(f.get("nach") or "Carrier", "carrier")
    agg = {}
    for r in rows:
        lz = laufzeit_tage(r.gebucht_am, r.zugestellt_am)
        if lz is None:
            continue
        key = r.get(feld) or _("unbekannt")
        a = agg.setdefault(key, {"gruppe": key, "anzahl": 0, "summe": 0.0, "max": 0.0, "versprochen_sum": 0, "versprochen_n": 0, "zu_spaet": 0})
        a["anzahl"] += 1
        a["summe"] += lz
        a["max"] = max(a["max"], lz)
        if r.laufzeit_tage:
            a["versprochen_sum"] += r.laufzeit_tage
            a["versprochen_n"] += 1
            if lz > r.laufzeit_tage + 1:
                a["zu_spaet"] += 1
    data = []
    for a in sorted(agg.values(), key=lambda x: -x["anzahl"]):
        data.append({"gruppe": a["gruppe"], "anzahl": a["anzahl"], "schnitt": round(a["summe"] / a["anzahl"], 1), "max": round(a["max"], 1), "versprochen": round(a["versprochen_sum"] / a["versprochen_n"], 1) if a["versprochen_n"] else None, "zu_spaet": a["zu_spaet"], "quote_zu_spaet": round(100 * a["zu_spaet"] / a["anzahl"], 1)})
    columns = [
        {"fieldname": "gruppe", "label": _(f.get("nach") or "Carrier"), "fieldtype": "Data", "width": 180},
        {"fieldname": "anzahl", "label": _("Zugestellt"), "fieldtype": "Int", "width": 100},
        {"fieldname": "schnitt", "label": _("Ø Tage"), "fieldtype": "Float", "width": 90},
        {"fieldname": "max", "label": _("Max Tage"), "fieldtype": "Float", "width": 90},
        {"fieldname": "versprochen", "label": _("Ø versprochen"), "fieldtype": "Float", "width": 110},
        {"fieldname": "zu_spaet", "label": _("> 1 Tag zu spät"), "fieldtype": "Int", "width": 110},
        {"fieldname": "quote_zu_spaet", "label": _("Quote %"), "fieldtype": "Percent", "width": 90},
    ]
    chart = {"data": {"labels": [d["gruppe"] for d in data], "datasets": [{"name": _("Ø Tage"), "values": [d["schnitt"] for d in data]}]}, "type": "bar", "colors": ["#1d4ed8"]} if data else None
    gesamt = sum(a["anzahl"] for a in agg.values())
    summe = sum(a["summe"] for a in agg.values())
    summary = [{"value": gesamt, "label": _("Zugestellt"), "datatype": "Int"}, {"value": round(summe / gesamt, 1) if gesamt else 0, "label": _("Ø Laufzeit (Tage)"), "datatype": "Float"}]
    return columns, data, None, chart, summary
