"""PH Belege je Mitarbeiter – Anzahl, Umsatz, Stornos, Ø Bon je Bedienung (nur Leitung/Geschäftsführung)."""

import frappe
from frappe import _

from ph_kassa.auswertung import belege_zeitraum, zeitraum_filter
from ph_kassa.logik.abschluss import soll_aus_belegen


def execute(filters=None):
    filters, von, bis = zeitraum_filter(filters)
    s = soll_aus_belegen(belege_zeitraum(von, bis, filters.get("kasse"), bediener=filters.get("bediener")))
    data = []
    for user, w in sorted(s["je_bediener"].items(), key=lambda x: -x[1]["umsatz_cent"]):
        data.append({"bediener": user, "name_voll": frappe.db.get_value("User", user, "full_name") if user != "unbekannt" else "–", "anzahl": w["anzahl"], "stornos": w["stornos"], "umsatz_cent": w["umsatz_cent"], "schnitt_cent": int(w["umsatz_cent"] / w["anzahl"]) if w["anzahl"] else 0, "stornoquote": round(100 * w["stornos"] / w["anzahl"], 1) if w["anzahl"] else 0})
    columns = [
        {"fieldname": "bediener", "label": _("Benutzer"), "fieldtype": "Link", "options": "User", "width": 200},
        {"fieldname": "name_voll", "label": _("Name"), "fieldtype": "Data", "width": 160},
        {"fieldname": "anzahl", "label": _("Belege"), "fieldtype": "Int", "width": 90},
        {"fieldname": "stornos", "label": _("Stornos"), "fieldtype": "Int", "width": 90},
        {"fieldname": "stornoquote", "label": _("Stornoquote %"), "fieldtype": "Percent", "width": 110},
        {"fieldname": "umsatz_cent", "label": _("Umsatz (Cent)"), "fieldtype": "Int", "width": 130},
        {"fieldname": "schnitt_cent", "label": _("Ø Bon (Cent)"), "fieldtype": "Int", "width": 120},
    ]
    chart = {"data": {"labels": [d["name_voll"] or d["bediener"] for d in data], "datasets": [{"name": _("Umsatz €"), "values": [d["umsatz_cent"] / 100 for d in data]}]}, "type": "bar", "colors": ["#30373e"]}
    summary = [{"value": s["belege_anzahl"], "label": _("Belege"), "datatype": "Int"}, {"value": s["umsatz_cent"] / 100, "label": _("Umsatz €"), "datatype": "Currency", "currency": "EUR"}, {"value": s["stornos_anzahl"], "label": _("Stornos"), "datatype": "Int", "indicator": "Orange" if s["stornos_anzahl"] else "Green"}]
    return columns, data, None, chart, summary
