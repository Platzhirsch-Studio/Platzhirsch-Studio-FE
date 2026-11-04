"""Script Report (Muster): Anfragen je Quelle/Kanal mit Konversion und mittlerer Reaktionszeit.

execute(filters) → (columns, data, message, chart, report_summary)
Filter kommen aus ph_anfragen_nach_quelle.js. Nur frappe.qb / get_all, kein roher SQL mit f-Strings.
"""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -3))
    bis = getdate(filters.get("bis") or nowdate())
    gruppe = "kanal" if filters.get("nach") == "Kanal" else "quelle"

    rows = frappe.get_all(
        "PH Anfrage",
        filters={"eingang": ("between", [von, bis]), "status": ("!=", "Spam")},
        fields=[gruppe, "status", "eingang", "erstreaktion_am"],
    )

    agg = {}
    for r in rows:
        key = r.get(gruppe) or _("unbekannt")
        a = agg.setdefault(key, {"gruppe": key, "anzahl": 0, "offen": 0, "gewonnen": 0, "verloren": 0, "reaktion_sum": 0.0, "reaktion_n": 0})
        a["anzahl"] += 1
        if r.status == "Gewonnen":
            a["gewonnen"] += 1
        elif r.status == "Verloren":
            a["verloren"] += 1
        else:
            a["offen"] += 1
        if r.erstreaktion_am and r.eingang:
            a["reaktion_sum"] += (r.erstreaktion_am - r.eingang).total_seconds() / 3600
            a["reaktion_n"] += 1

    data = []
    for a in sorted(agg.values(), key=lambda x: -x["anzahl"]):
        data.append(
            {
                "gruppe": a["gruppe"],
                "anzahl": a["anzahl"],
                "offen": a["offen"],
                "gewonnen": a["gewonnen"],
                "verloren": a["verloren"],
                "quote": round(100 * a["gewonnen"] / a["anzahl"], 1) if a["anzahl"] else 0,
                "reaktion_h": round(a["reaktion_sum"] / a["reaktion_n"], 1) if a["reaktion_n"] else None,
            }
        )

    columns = [
        {"fieldname": "gruppe", "label": _("Kanal") if gruppe == "kanal" else _("Quelle"), "fieldtype": "Data", "width": 180},
        {"fieldname": "anzahl", "label": _("Anfragen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "offen", "label": _("Offen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "gewonnen", "label": _("Gewonnen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "verloren", "label": _("Verloren"), "fieldtype": "Int", "width": 100},
        {"fieldname": "quote", "label": _("Quote %"), "fieldtype": "Percent", "width": 90},
        {"fieldname": "reaktion_h", "label": _("Ø Reaktion (h)"), "fieldtype": "Float", "width": 120},
    ]

    chart = {
        "data": {"labels": [d["gruppe"] for d in data], "datasets": [{"name": _("Anfragen"), "values": [d["anzahl"] for d in data]}, {"name": _("Gewonnen"), "values": [d["gewonnen"] for d in data]}]},
        "type": "bar",
        "colors": ["#30373e", "#15803d"],
    }
    gesamt = sum(d["anzahl"] for d in data)
    gewonnen = sum(d["gewonnen"] for d in data)
    summary = [
        {"value": gesamt, "label": _("Anfragen"), "datatype": "Int"},
        {"value": gewonnen, "label": _("Gewonnen"), "datatype": "Int", "indicator": "Green"},
        {"value": round(100 * gewonnen / gesamt, 1) if gesamt else 0, "label": _("Quote %"), "datatype": "Percent"},
    ]
    return columns, data, None, chart, summary
