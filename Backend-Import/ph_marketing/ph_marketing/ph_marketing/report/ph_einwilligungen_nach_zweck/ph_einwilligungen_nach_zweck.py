"""Script Report: Einwilligungen je Zweck – erteilt, bestätigt, offen, widerrufen, abgelaufen; DOI-Quote je Zweck."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate

from ph_marketing.utils.regeln import ZWECK_TEXT


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -12))
    bis = getdate(filters.get("bis") or nowdate())
    f = {"zeitpunkt": ("between", [von, bis])}
    if filters.get("kanal"):
        f["kanal"] = filters.kanal
    rows = frappe.get_all("PH Einwilligung", filters=f, fields=["zweck", "status", "kanal", "doi_noetig"])
    agg = {}
    for r in rows:
        a = agg.setdefault(r.zweck, {"zweck": r.zweck, "beschreibung": ZWECK_TEXT.get(r.zweck, ""), "erteilt": 0, "bestaetigt": 0, "offen": 0, "widerrufen": 0, "abgelaufen": 0, "doi": 0})
        a["erteilt"] += 1
        a["doi"] += int(r.doi_noetig or 0)
        a[{"Bestaetigt": "bestaetigt", "Offen": "offen", "Widerrufen": "widerrufen", "Abgelaufen": "abgelaufen"}.get(r.status, "offen")] += 1
    data = []
    for a in sorted(agg.values(), key=lambda x: -x["erteilt"]):
        a["quote"] = round(100 * a["bestaetigt"] / a["erteilt"], 1) if a["erteilt"] else 0
        a["wirksam"] = frappe.db.count("PH Einwilligung", {"zweck": a["zweck"], "status": "Bestaetigt"})
        data.append(a)
    columns = [
        {"fieldname": "zweck", "label": _("Zweck"), "fieldtype": "Data", "width": 160},
        {"fieldname": "beschreibung", "label": _("Beschreibung"), "fieldtype": "Data", "width": 260},
        {"fieldname": "erteilt", "label": _("Erteilt"), "fieldtype": "Int", "width": 80},
        {"fieldname": "bestaetigt", "label": _("Bestätigt"), "fieldtype": "Int", "width": 90},
        {"fieldname": "offen", "label": _("Offen"), "fieldtype": "Int", "width": 80},
        {"fieldname": "widerrufen", "label": _("Widerrufen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "abgelaufen", "label": _("Abgelaufen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "quote", "label": _("Bestätigt %"), "fieldtype": "Percent", "width": 100},
        {"fieldname": "wirksam", "label": _("Wirksam gesamt"), "fieldtype": "Int", "width": 120},
    ]
    chart = {"data": {"labels": [d["zweck"] for d in data], "datasets": [{"name": _("Bestätigt"), "values": [d["bestaetigt"] for d in data]}, {"name": _("Widerrufen"), "values": [d["widerrufen"] for d in data]}]}, "type": "bar", "colors": ["#15803d", "#6b7280"]}
    summary = [
        {"value": sum(d["erteilt"] for d in data), "label": _("Erteilt im Zeitraum"), "datatype": "Int"},
        {"value": sum(d["wirksam"] for d in data), "label": _("Wirksam gesamt"), "datatype": "Int", "indicator": "Green"},
        {"value": sum(d["widerrufen"] for d in data), "label": _("Widerrufen"), "datatype": "Int"},
    ]
    return columns, data, None, chart, summary
