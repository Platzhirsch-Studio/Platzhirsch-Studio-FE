"""Script Report PH Montagekapazität je Woche: geplante/ist-Stunden je Kalenderwoche gegen Kapazität
(Monteure × Tage × Stunden je Tag aus PH Projekte Einstellungen)."""

import frappe
from frappe import _
from frappe.utils import add_days, flt, get_datetime, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or nowdate())
    bis = getdate(filters.get("bis") or add_days(nowdate(), 56))
    tagesstunden = flt(frappe.db.get_single_value("PH Projekte Einstellungen", "montage_tagesstunden")) or 8.0
    monteure = int(filters.get("monteure") or 2)

    rows = frappe.get_all(
        "PH Montageauftrag",
        filters={"start": ("between", [f"{von} 00:00:00", f"{bis} 23:59:59"]), "status": ("!=", "Abgebrochen")},
        fields=["name", "projekt", "start", "ende", "status", "stunden_geplant", "stunden_ist", "montageleiter"],
    )
    wochen = {}
    for r in rows:
        d = get_datetime(r.start)
        jahr, kw, _wt = d.isocalendar()
        key = f"{jahr}-KW{kw:02d}"
        w = wochen.setdefault(key, {"woche": key, "montagen": 0, "stunden_geplant": 0.0, "stunden_ist": 0.0, "team": set(), "projekte": set()})
        w["montagen"] += 1
        geplant = flt(r.stunden_geplant)
        if not geplant and r.ende:
            geplant = max(0.0, (get_datetime(r.ende) - d).total_seconds() / 3600)
        w["stunden_geplant"] += geplant
        w["stunden_ist"] += flt(r.stunden_ist)
        w["projekte"].add(r.projekt)
        for t in frappe.get_all("PH Montage Team", filters={"parent": r.name, "parenttype": "PH Montageauftrag"}, pluck="user"):
            w["team"].add(t)

    kapazitaet = monteure * 5 * tagesstunden
    data = []
    for key in sorted(wochen):
        w = wochen[key]
        data.append(
            {
                "woche": key,
                "montagen": w["montagen"],
                "projekte": len(w["projekte"]),
                "stunden_geplant": round(w["stunden_geplant"], 1),
                "stunden_ist": round(w["stunden_ist"], 1),
                "kapazitaet": kapazitaet,
                "auslastung": round(100 * w["stunden_geplant"] / kapazitaet, 0) if kapazitaet else 0,
                "monteure_eingeteilt": len(w["team"]),
            }
        )
    columns = [
        {"fieldname": "woche", "label": _("Woche"), "fieldtype": "Data", "width": 110},
        {"fieldname": "montagen", "label": _("Montagen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "projekte", "label": _("Projekte"), "fieldtype": "Int", "width": 90},
        {"fieldname": "stunden_geplant", "label": _("Std. geplant"), "fieldtype": "Float", "width": 100},
        {"fieldname": "stunden_ist", "label": _("Std. ist"), "fieldtype": "Float", "width": 90},
        {"fieldname": "kapazitaet", "label": _("Kapazität (Std.)"), "fieldtype": "Float", "width": 110},
        {"fieldname": "auslastung", "label": _("Auslastung %"), "fieldtype": "Percent", "width": 110},
        {"fieldname": "monteure_eingeteilt", "label": _("Monteure eingeteilt"), "fieldtype": "Int", "width": 130},
    ]
    chart = {
        "data": {"labels": [d["woche"] for d in data], "datasets": [{"name": _("Std. geplant"), "values": [d["stunden_geplant"] for d in data]}, {"name": _("Kapazität"), "values": [d["kapazitaet"] for d in data]}]},
        "type": "bar",
        "colors": ["#1d4ed8", "#d9d4cc"],
    }
    summary = [
        {"value": sum(d["montagen"] for d in data), "label": _("Montagen"), "datatype": "Int"},
        {"value": round(sum(d["stunden_geplant"] for d in data), 1), "label": _("Std. geplant"), "datatype": "Float"},
        {"value": max((d["auslastung"] for d in data), default=0), "label": _("Spitze Auslastung %"), "datatype": "Percent", "indicator": "Orange"},
    ]
    return columns, data, None, chart, summary
