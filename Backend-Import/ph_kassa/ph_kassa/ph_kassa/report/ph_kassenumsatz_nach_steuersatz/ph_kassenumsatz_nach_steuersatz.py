"""PH Kassenumsatz nach Steuersatz – Zuarbeit UVA (ph_faktura): Netto/USt/Brutto je RKSV-Satzgruppe, optional je Monat."""

from frappe import _

from ph_kassa.auswertung import belege_zeitraum, zeitraum_filter
from ph_kassa.logik.betraege import STEUERSAETZE


def execute(filters=None):
    filters, von, bis = zeitraum_filter(filters)
    nach_monat = filters.get("nach") == "Monat und Steuersatz"
    agg = {}
    for b in belege_zeitraum(von, bis, filters.get("kasse")):
        monat = b["datum"].strftime("%Y-%m") if nach_monat else ""
        for p in b["positionen"]:
            key = (monat, p.get("steuersatz") or "Normal 20")
            a = agg.setdefault(key, {"monat": monat, "steuersatz": key[1], "promille": STEUERSAETZE.get(key[1], 0), "anzahl": 0, "netto_cent": 0, "ust_cent": 0, "brutto_cent": 0})
            a["anzahl"] += 1
            a["netto_cent"] += int(p.get("netto_cent") or 0)
            a["ust_cent"] += int(p.get("ust_cent") or 0)
            a["brutto_cent"] += int(p.get("brutto_cent") or 0)
    data = sorted(agg.values(), key=lambda x: (x["monat"], -x["promille"]))
    columns = ([{"fieldname": "monat", "label": _("Monat"), "fieldtype": "Data", "width": 90}] if nach_monat else []) + [
        {"fieldname": "steuersatz", "label": _("Steuersatz"), "fieldtype": "Data", "width": 150},
        {"fieldname": "promille", "label": _("Promille"), "fieldtype": "Int", "width": 80},
        {"fieldname": "anzahl", "label": _("Positionen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "netto_cent", "label": _("Netto (Cent)"), "fieldtype": "Int", "width": 130},
        {"fieldname": "ust_cent", "label": _("USt (Cent)"), "fieldtype": "Int", "width": 120},
        {"fieldname": "brutto_cent", "label": _("Brutto (Cent)"), "fieldtype": "Int", "width": 130},
    ]
    chart = {"data": {"labels": [f"{d['monat']} {d['steuersatz']}".strip() for d in data], "datasets": [{"name": _("Netto"), "values": [d["netto_cent"] / 100 for d in data]}, {"name": _("USt"), "values": [d["ust_cent"] / 100 for d in data]}]}, "type": "bar", "colors": ["#30373e", "#8a7a66"]}
    summary = [
        {"value": sum(d["netto_cent"] for d in data) / 100, "label": _("Netto €"), "datatype": "Currency", "currency": "EUR"},
        {"value": sum(d["ust_cent"] for d in data) / 100, "label": _("USt €"), "datatype": "Currency", "currency": "EUR"},
        {"value": sum(d["brutto_cent"] for d in data) / 100, "label": _("Brutto €"), "datatype": "Currency", "currency": "EUR"},
    ]
    return columns, data, _("Mehrzweckgutscheine stehen beim Verkauf unter „Null 0“; Umsatz entsteht bei Einlösung. Methode vom Steuerberater bestätigen (PLAN.md)."), chart, summary
