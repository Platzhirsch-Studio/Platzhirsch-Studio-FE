"""Script Report: Datenauskunft (Art. 15 DSGVO) zu einem Kontakt – alle Stammdaten, Vorgänge in allen
installierten PH-Apps und Kommunikation als flache Liste (Bereich · Feld · Wert · Quelle)."""

import frappe
from frappe import _


def execute(filters=None):
    filters = frappe._dict(filters or {})
    if not filters.get("kontakt"):
        return spalten(), [], _("Bitte einen Kontakt wählen."), None, []
    doc = frappe.get_doc("PH Kontakt", filters["kontakt"])
    doc.check_permission("read")
    a = doc.datenauskunft()
    data = []
    for k, v in a["stamm"].items():
        data.append({"bereich": _("Stammdaten"), "feld": _(k), "wert": str(v), "quelle": doc.name})
    for ad in a["adressen"]:
        data.append({"bereich": _("Adresse"), "feld": ad["art"], "wert": f"{ad['strasse']}, {ad['plz']} {ad['ort']}" + (f", {ad['land']}" if ad.get("land") else ""), "quelle": doc.name})
    for v in a["vorgaenge"]:
        for z in v["zeilen"]:
            werte = " · ".join(f"{f}: {z.get(f)}" for f in v["felder"] if f != "name" and z.get(f) is not None)
            data.append({"bereich": _(v["doctype"]), "feld": z.get("name"), "wert": werte, "quelle": v["doctype"]})
    for k in a["kommunikation"]:
        data.append({"bereich": _("Kommunikation"), "feld": str(k.communication_date)[:16], "wert": f"{k.sent_or_received}: {k.subject or ''}", "quelle": "Communication"})
    summary = [
        {"value": len(a["stamm"]), "label": _("Stammdatenfelder"), "datatype": "Int"},
        {"value": sum(v["anzahl"] for v in a["vorgaenge"]), "label": _("Vorgänge"), "datatype": "Int"},
        {"value": len(a["kommunikation"]), "label": _("Nachrichten"), "datatype": "Int"},
    ]
    return spalten(), data, _("Auskunft erstellt {0}. Interne Notizen (Feldebene 1) sind nicht enthalten.").format(frappe.utils.format_datetime(a["erstellt"])), None, summary


def spalten():
    return [
        {"fieldname": "bereich", "label": _("Bereich"), "fieldtype": "Data", "width": 160},
        {"fieldname": "feld", "label": _("Feld / Beleg"), "fieldtype": "Data", "width": 200},
        {"fieldname": "wert", "label": _("Wert"), "fieldtype": "Data", "width": 520},
        {"fieldname": "quelle", "label": _("Quelle"), "fieldtype": "Data", "width": 160},
    ]
