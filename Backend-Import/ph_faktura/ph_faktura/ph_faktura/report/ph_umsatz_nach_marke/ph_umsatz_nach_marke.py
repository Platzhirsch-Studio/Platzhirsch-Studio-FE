"""PH Umsatz nach Marke – Netto-Umsatz aus Positionen gestellter Rechnungen (ohne Anzahlungsrechnungen) abzüglich Gutschriften, nach Marke/Produkt/Art."""

import frappe
from frappe import _
from frappe.utils import cint


def execute(filters=None):
    f = frappe._dict(filters or {})
    nach = {"Marke": "marke", "Produkt": "produkt", "Art": "art"}.get(f.get("nach") or "Marke", "marke")
    agg = {}

    def sammle(parenttype, vorzeichen, flt):
        eltern = frappe.get_all(parenttype, filters=flt, pluck="name")
        if not eltern:
            return
        for p in frappe.get_all("PH Beleg Position", filters={"parenttype": parenttype, "parentfield": "positionen", "parent": ("in", eltern), "art": ("not in", ("Text", "Zwischensumme")), "alternativ": 0}, fields=[nach, "art", "menge", "netto_cent", "einkauf_cent"]):
            key = p.get(nach) or _("ohne Angabe")
            e = agg.setdefault(key, {"gruppe": key, "menge": 0, "netto": 0, "einkauf": 0, "positionen": 0})
            e["menge"] += vorzeichen * (p.menge or 0)
            e["netto"] += vorzeichen * cint(p.netto_cent)
            e["einkauf"] += vorzeichen * cint(p.einkauf_cent or 0) * (p.menge or 0)
            e["positionen"] += 1

    sammle("PH Rechnung", 1, {"docstatus": 1, "art": ("!=", "Anzahlungsrechnung"), "status": ("!=", "Storniert"), "datum": ("between", [f.von, f.bis])})
    sammle("PH Gutschrift", -1, {"docstatus": 1, "datum": ("between", [f.von, f.bis])})
    leitung = bool(set(frappe.get_roles()) & {"PH Faktura Leitung", "PH Geschäftsführung", "System Manager"})
    data = []
    for e in sorted(agg.values(), key=lambda x: -x["netto"]):
        row = {"gruppe": e["gruppe"], "positionen": e["positionen"], "menge": e["menge"], "netto": e["netto"] / 100}
        if leitung:
            row["einkauf"] = e["einkauf"] / 100
            row["marge"] = (e["netto"] - e["einkauf"]) / 100 if e["einkauf"] else None
            row["marge_prozent"] = round(100 * (e["netto"] - e["einkauf"]) / e["netto"], 1) if e["einkauf"] and e["netto"] else None
        data.append(row)
    gesamt = sum(d["netto"] for d in data) or 1
    for d in data:
        d["anteil"] = round(100 * d["netto"] / gesamt, 1)
    columns = [
        {"fieldname": "gruppe", "label": _(f.get("nach") or "Marke"), "fieldtype": "Data", "width": 220},
        {"fieldname": "positionen", "label": _("Positionen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "menge", "label": _("Menge"), "fieldtype": "Float", "width": 90},
        {"fieldname": "netto", "label": _("Netto €"), "fieldtype": "Currency", "width": 130},
        {"fieldname": "anteil", "label": _("Anteil %"), "fieldtype": "Percent", "width": 90},
    ]
    if leitung:
        columns += [{"fieldname": "einkauf", "label": _("Einkauf €"), "fieldtype": "Currency", "width": 120}, {"fieldname": "marge", "label": _("Marge €"), "fieldtype": "Currency", "width": 120}, {"fieldname": "marge_prozent", "label": _("Marge %"), "fieldtype": "Percent", "width": 90}]
    top = data[:12]
    chart = {"data": {"labels": [d["gruppe"] for d in top], "datasets": [{"name": _("Netto €"), "values": [d["netto"] for d in top]}]}, "type": "bar", "colors": ["#8a7a66"]}
    summary = [{"value": sum(d["netto"] for d in data), "label": _("Netto-Umsatz"), "datatype": "Currency"}, {"value": len(data), "label": _("Gruppen"), "datatype": "Int"}]
    return columns, data, None, chart, summary
