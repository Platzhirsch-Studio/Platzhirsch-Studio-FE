"""PH OSS Umsaetze je Land – EU-Fernverkäufe an Private nach Bestimmungsland und Satz (OSS-Meldung, Quartal)."""

import frappe
from frappe import _
from frappe.utils import cint

from ph_faktura import einstellungen


def execute(filters=None):
    f = frappe._dict(filters or {})
    agg = {}
    for r in frappe.get_all("PH Rechnung", filters={"docstatus": 1, "ust_fall": "OSS", "datum": ("between", [f.von, f.bis])}, fields=["name", "oss_land", "land"]):
        land = r.oss_land or r.land
        for a in frappe.get_all("PH Beleg Steuer", filters={"parent": r.name, "parenttype": "PH Rechnung", "parentfield": "ust_aufteilung"}, fields=["ust_satz_promille", "netto_cent", "ust_cent"]):
            e = agg.setdefault((land, cint(a.ust_satz_promille)), {"netto": 0, "ust": 0, "n": 0})
            e["netto"] += cint(a.netto_cent)
            e["ust"] += cint(a.ust_cent)
            e["n"] += 1
    for g in frappe.get_all("PH Gutschrift", filters={"docstatus": 1, "ust_fall": "OSS", "datum": ("between", [f.von, f.bis])}, fields=["name", "rechnung", "land"]):
        land = frappe.db.get_value("PH Rechnung", g.rechnung, "oss_land") or g.land
        for a in frappe.get_all("PH Beleg Steuer", filters={"parent": g.name, "parenttype": "PH Gutschrift", "parentfield": "ust_aufteilung"}, fields=["ust_satz_promille", "netto_cent", "ust_cent"]):
            e = agg.setdefault((land, cint(a.ust_satz_promille)), {"netto": 0, "ust": 0, "n": 0})
            e["netto"] -= cint(a.netto_cent)
            e["ust"] -= cint(a.ust_cent)
    data = [{"land": k[0], "satz": f"{k[1] / 100:g} %", "netto": v["netto"] / 100, "ust": v["ust"] / 100, "brutto": (v["netto"] + v["ust"]) / 100, "belege": v["n"]} for k, v in sorted(agg.items())]
    columns = [
        {"fieldname": "land", "label": _("Bestimmungsland"), "fieldtype": "Data", "width": 130},
        {"fieldname": "satz", "label": _("Satz"), "fieldtype": "Data", "width": 80},
        {"fieldname": "netto", "label": _("Bemessung €"), "fieldtype": "Currency", "width": 130},
        {"fieldname": "ust", "label": _("USt €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "brutto", "label": _("Brutto €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "belege", "label": _("Belege"), "fieldtype": "Int", "width": 70},
    ]
    e = einstellungen.faktura()
    laufend = cint(e.get("fernverkaeufe_eu_laufend_cent"))
    schwelle = cint(e.get("lieferschwelle_eu_netto_cent") or 1000000)
    message = _("OSS {0}. EU-Fernverkäufe laufendes Jahr: {1} € von {2} € Lieferschwelle.").format(_("aktiv") if e.get("oss_aktiv") else _("nicht aktiv – Umsätze an EU-Private werden mit österreichischer USt gestellt"), laufend / 100, schwelle / 100)
    chart = {"data": {"labels": [f"{d['land']} {d['satz']}" for d in data], "datasets": [{"name": _("Netto €"), "values": [d["netto"] for d in data]}]}, "type": "bar", "colors": ["#1d4ed8"]}
    summary = [{"value": sum(d["netto"] for d in data), "label": _("OSS netto"), "datatype": "Currency"}, {"value": sum(d["ust"] for d in data), "label": _("OSS USt"), "datatype": "Currency"}, {"value": laufend / 100, "label": _("Fernverkäufe Jahr"), "datatype": "Currency", "indicator": "Red" if laufend >= schwelle * 0.8 else "Green"}]
    return columns, data, message, chart, summary
