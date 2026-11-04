"""Script Report: Bewerbungen je Stelle oder Quelle – Anzahl, Status-Verteilung, Einstellungsquote,
Durchlaufzeit (Eingang → Entscheidung) und Time-to-Hire (Eingang → Eingestellt)."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -12))
    bis = getdate(filters.get("bis") or nowdate())
    gruppe = "quelle" if filters.get("nach") == "Quelle" else "stelle_titel"
    bedingungen = {"eingang": ("between", [von, bis])}
    if filters.get("stelle"):
        bedingungen["stelle"] = filters["stelle"]

    rows = frappe.get_all("PH Bewerbung", filters=bedingungen, fields=[gruppe, "status", "durchlauf_tage", "entschieden_am", "initiativ"])

    agg = {}
    for r in rows:
        key = r.get(gruppe) or (_("Initiativ") if gruppe == "stelle_titel" else _("unbekannt"))
        a = agg.setdefault(key, {"gruppe": key, "anzahl": 0, "offen": 0, "gespraech": 0, "eingestellt": 0, "abgesagt": 0, "zurueckgezogen": 0, "dl_sum": 0, "dl_n": 0, "tth_sum": 0, "tth_n": 0})
        a["anzahl"] += 1
        if r.status in ("Eingegangen", "Gesichtet", "Gespraech", "Angebot"):
            a["offen"] += 1
            if r.status in ("Gespraech", "Angebot"):
                a["gespraech"] += 1
        elif r.status == "Eingestellt":
            a["eingestellt"] += 1
            a["tth_sum"] += r.durchlauf_tage or 0
            a["tth_n"] += 1
        elif r.status == "Abgesagt":
            a["abgesagt"] += 1
        elif r.status == "Zurueckgezogen":
            a["zurueckgezogen"] += 1
        if r.entschieden_am:
            a["dl_sum"] += r.durchlauf_tage or 0
            a["dl_n"] += 1

    data = []
    for a in sorted(agg.values(), key=lambda x: -x["anzahl"]):
        data.append(
            {
                "gruppe": a["gruppe"],
                "anzahl": a["anzahl"],
                "offen": a["offen"],
                "gespraech": a["gespraech"],
                "eingestellt": a["eingestellt"],
                "abgesagt": a["abgesagt"],
                "zurueckgezogen": a["zurueckgezogen"],
                "quote": round(100 * a["eingestellt"] / a["anzahl"], 1) if a["anzahl"] else 0,
                "durchlauf": round(a["dl_sum"] / a["dl_n"], 1) if a["dl_n"] else None,
                "time_to_hire": round(a["tth_sum"] / a["tth_n"], 1) if a["tth_n"] else None,
            }
        )

    columns = [
        {"fieldname": "gruppe", "label": _("Quelle") if gruppe == "quelle" else _("Stelle"), "fieldtype": "Data", "width": 260},
        {"fieldname": "anzahl", "label": _("Bewerbungen"), "fieldtype": "Int", "width": 110},
        {"fieldname": "offen", "label": _("Offen"), "fieldtype": "Int", "width": 80},
        {"fieldname": "gespraech", "label": _("Im Gespräch/Angebot"), "fieldtype": "Int", "width": 150},
        {"fieldname": "eingestellt", "label": _("Eingestellt"), "fieldtype": "Int", "width": 100},
        {"fieldname": "abgesagt", "label": _("Abgesagt"), "fieldtype": "Int", "width": 90},
        {"fieldname": "zurueckgezogen", "label": _("Zurückgezogen"), "fieldtype": "Int", "width": 120},
        {"fieldname": "quote", "label": _("Einstellungsquote %"), "fieldtype": "Percent", "width": 140},
        {"fieldname": "durchlauf", "label": _("Ø Durchlauf (Tage)"), "fieldtype": "Float", "width": 140},
        {"fieldname": "time_to_hire", "label": _("Ø Time-to-Hire (Tage)"), "fieldtype": "Float", "width": 160},
    ]
    chart = {
        "data": {
            "labels": [d["gruppe"][:40] for d in data],
            "datasets": [
                {"name": _("Bewerbungen"), "values": [d["anzahl"] for d in data]},
                {"name": _("Eingestellt"), "values": [d["eingestellt"] for d in data]},
            ],
        },
        "type": "bar",
        "colors": ["#30373e", "#15803d"],
    }
    gesamt = sum(d["anzahl"] for d in data)
    eingestellt = sum(d["eingestellt"] for d in data)
    tth = [d["time_to_hire"] for d in data if d["time_to_hire"] is not None]
    summary = [
        {"value": gesamt, "label": _("Bewerbungen"), "datatype": "Int"},
        {"value": eingestellt, "label": _("Eingestellt"), "datatype": "Int", "indicator": "Green"},
        {"value": sum(d["offen"] for d in data), "label": _("Offen"), "datatype": "Int", "indicator": "Blue"},
        {"value": round(sum(tth) / len(tth), 1) if tth else 0, "label": _("Ø Time-to-Hire (Tage)"), "datatype": "Float"},
    ]
    return columns, data, None, chart, summary
