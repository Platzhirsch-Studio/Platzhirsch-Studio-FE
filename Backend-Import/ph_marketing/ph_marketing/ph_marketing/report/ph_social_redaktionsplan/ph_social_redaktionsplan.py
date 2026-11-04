"""Script Report: Redaktionsplan – Beiträge je Woche und Kanal mit Status, Bildquelle und Kennzahlen."""

import frappe
from frappe import _
from frappe.utils import add_days, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_days(nowdate(), -14))
    bis = getdate(filters.get("bis") or add_days(nowdate(), 60))
    f = {"datum_geplant": ("between", [von, bis])}
    if filters.get("kanal"):
        f["kanal"] = filters.kanal
    if filters.get("status"):
        f["status"] = filters.status
    else:
        f["status"] = ("!=", "Verworfen")
    rows = frappe.get_all("PH Social Beitrag", filters=f, fields=["name", "titel", "kanal", "format", "status", "datum_geplant", "uhrzeit_geplant", "board", "bildquelle_freigabe", "zustaendig", "kampagne", "reichweite", "saves", "klicks", "veroeffentlicht_url"], order_by="datum_geplant asc, uhrzeit_geplant asc")
    data = []
    for r in rows:
        d = getdate(r.datum_geplant)
        r["kw"] = f"KW {d.isocalendar()[1]}"
        r["wochentag"] = d.strftime("%a")
        r["warnung"] = _("Bild offen") if r.bildquelle_freigabe == "offen" and r.status in ("Freigegeben", "Geplant") else ""
        data.append(r)
    columns = [
        {"fieldname": "kw", "label": _("KW"), "fieldtype": "Data", "width": 60},
        {"fieldname": "datum_geplant", "label": _("Datum"), "fieldtype": "Date", "width": 100},
        {"fieldname": "wochentag", "label": _("Tag"), "fieldtype": "Data", "width": 50},
        {"fieldname": "uhrzeit_geplant", "label": _("Zeit"), "fieldtype": "Time", "width": 70},
        {"fieldname": "name", "label": _("Beitrag"), "fieldtype": "Link", "options": "PH Social Beitrag", "width": 130},
        {"fieldname": "titel", "label": _("Titel"), "fieldtype": "Data", "width": 220},
        {"fieldname": "kanal", "label": _("Kanal"), "fieldtype": "Data", "width": 90},
        {"fieldname": "format", "label": _("Format"), "fieldtype": "Data", "width": 80},
        {"fieldname": "board", "label": _("Board"), "fieldtype": "Data", "width": 100},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
        {"fieldname": "bildquelle_freigabe", "label": _("Bildquelle"), "fieldtype": "Data", "width": 130},
        {"fieldname": "warnung", "label": _("Hinweis"), "fieldtype": "Data", "width": 90},
        {"fieldname": "zustaendig", "label": _("Zuständig"), "fieldtype": "Link", "options": "User", "width": 130},
        {"fieldname": "kampagne", "label": _("Kampagne"), "fieldtype": "Link", "options": "PH Kampagne", "width": 120},
        {"fieldname": "reichweite", "label": _("Reichweite"), "fieldtype": "Int", "width": 90},
        {"fieldname": "saves", "label": _("Saves"), "fieldtype": "Int", "width": 70},
        {"fieldname": "klicks", "label": _("Klicks"), "fieldtype": "Int", "width": 70},
    ]
    je_kanal = {}
    for r in data:
        je_kanal[r.kanal] = je_kanal.get(r.kanal, 0) + 1
    chart = {"data": {"labels": list(je_kanal.keys()), "datasets": [{"name": _("Beiträge"), "values": list(je_kanal.values())}]}, "type": "pie", "colors": ["#30373e", "#8a7a66", "#1d4ed8", "#15803d", "#b45309"]}
    summary = [
        {"value": len(data), "label": _("Beiträge im Zeitraum"), "datatype": "Int"},
        {"value": sum(1 for r in data if r.status == "Veroeffentlicht"), "label": _("Veröffentlicht"), "datatype": "Int", "indicator": "Green"},
        {"value": sum(1 for r in data if r.bildquelle_freigabe == "offen"), "label": _("Bildquelle offen"), "datatype": "Int", "indicator": "Orange"},
    ]
    return columns, data, None, chart, summary
