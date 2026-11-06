"""PH Speicherbelegung: belegter Speicher je Bezug, Endung, Speicher-Adapter oder Stammordner.
„Aktuell“ = aktuelle Versionen, „Gesamt“ = alle Versionen (ohne doppelt referenzierte Objekte nach Wiederherstellung)."""

import frappe
from frappe import _
from frappe.utils import cint, flt

GRUPPEN = {"Bezug": "bezug_doctype", "Endung": "endung", "Speicher": "speicher", "Stammordner": "wurzel", "Status": "status"}
MB = 1024 * 1024


def execute(filters=None):
    filters = frappe._dict(filters or {})
    gruppe = filters.get("gruppierung") or "Bezug"
    status = ["Aktiv", "Papierkorb"] if cint(filters.get("mit_papierkorb")) else ["Aktiv"]
    dateien = {d.name: d for d in frappe.get_all("PH Datei", filters={"status": ("in", status)}, fields=["name", "bezug_doctype", "bezug_titel", "endung", "groesse", "status", "ordner", "aktuelle_version"])}
    versionen = frappe.get_all("PH Datei Version", filters={"parenttype": "PH Datei", "parent": ("in", list(dateien) or ["-"])}, fields=["parent", "version", "groesse", "speicher", "schluessel"])
    wurzel = {}
    if gruppe == "Stammordner":
        for o in frappe.get_all("PH Ordner", filters={"ist_bezugswurzel": 1}, fields=["name", "titel", "lft", "rgt"]):
            for n in frappe.get_all("PH Ordner", filters={"lft": (">=", o.lft), "rgt": ("<=", o.rgt)}, pluck="name"):
                wurzel[n] = o.titel
    zeilen = {}
    gesehen = set()
    for v in versionen:
        d = dateien[v.parent]
        if gruppe == "Speicher":
            schluessel = v.speicher or "?"
        elif gruppe == "Stammordner":
            schluessel = wurzel.get(d.ordner) or _("(ohne Bezug)")
        else:
            schluessel = d.get(GRUPPEN.get(gruppe, "bezug_doctype")) or _("(ohne)")
        z = zeilen.setdefault(schluessel, {"gruppe": schluessel, "dateien": set(), "versionen": 0, "aktuell_mb": 0.0, "gesamt_mb": 0.0})
        z["dateien"].add(d.name)
        if (v.speicher, v.schluessel) not in gesehen:
            gesehen.add((v.speicher, v.schluessel))
            z["versionen"] += 1
            z["gesamt_mb"] += cint(v.groesse) / MB
        if cint(v.version) == cint(d.aktuelle_version):
            z["aktuell_mb"] += cint(v.groesse) / MB
    data = sorted(({**z, "dateien": len(z["dateien"]), "aktuell_mb": flt(z["aktuell_mb"], 2), "gesamt_mb": flt(z["gesamt_mb"], 2)} for z in zeilen.values()), key=lambda r: -r["gesamt_mb"])
    columns = [
        {"fieldname": "gruppe", "label": _(gruppe), "fieldtype": "Data", "width": 260},
        {"fieldname": "dateien", "label": _("Dateien"), "fieldtype": "Int", "width": 100},
        {"fieldname": "versionen", "label": _("Objekte (Versionen)"), "fieldtype": "Int", "width": 140},
        {"fieldname": "aktuell_mb", "label": _("Aktuelle Versionen (MB)"), "fieldtype": "Float", "precision": 2, "width": 170},
        {"fieldname": "gesamt_mb", "label": _("Alle Versionen (MB)"), "fieldtype": "Float", "precision": 2, "width": 160},
    ]
    gesamt = sum(r["gesamt_mb"] for r in data)
    chart = {"data": {"labels": [r["gruppe"] for r in data[:12]], "datasets": [{"name": _("MB"), "values": [r["gesamt_mb"] for r in data[:12]]}]}, "type": "bar", "colors": ["#30373e"]}
    summary = [{"label": _("Dateien"), "value": sum(r["dateien"] for r in data), "datatype": "Int"}, {"label": _("Belegt gesamt (MB)"), "value": flt(gesamt, 1), "datatype": "Float"}]
    return columns, data, None, chart, summary
