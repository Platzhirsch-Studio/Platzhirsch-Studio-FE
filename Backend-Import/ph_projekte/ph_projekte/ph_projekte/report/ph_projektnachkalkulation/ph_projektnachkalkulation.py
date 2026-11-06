"""PH Projektnachkalkulation – je Projekt: Erlös, DB1/2/3 (DB4) absolut/%, Budget · Ist · Obligo · Prognose, Fertigstellung,
Ampel. Nur Leitung/GF. Logik: utils/kalkulation.py (v2), Daten: ph_projekte/nachkalkulation.py."""

import frappe
from frappe import _

from ph_projekte.ph_projekte import nachkalkulation as nk

AMPEL_TEXT = {"gruen": "grün", "gelb": "gelb", "rot": "rot", "": ""}


def execute(filters=None):
    nk.pruefe_leitung()
    filters = frappe._dict(filters or {})
    f = {"status": ("in", nk.LAUFEND)} if not filters.status else {"status": filters.status}
    for k in ("projektart", "berater"):
        if filters.get(k):
            f[k] = filters[k]
    if filters.projekt:
        f = {"name": filters.projekt}
    if filters.nur_rot:
        f["kalk_ampel"] = "rot"
    c = lambda fn, label, w=110, t="Currency": {"fieldname": fn, "label": label, "fieldtype": t, "width": w}  # noqa: E731
    columns = [
        {"fieldname": "projekt", "label": _("Projekt"), "fieldtype": "Link", "options": "PH Projekt", "width": 130},
        c("titel", _("Titel"), 180, "Data"), c("status", _("Phase"), 90, "Data"), c("ampel", _("Ampel"), 60, "Data"),
        c("fertig", _("Fertig %"), 70, "Int"), c("erloes", _("Erlös netto")), c("db1", _("DB1")), c("db1_p", _("DB1 %"), 70, "Percent"),
        c("db2", _("DB2")), c("db2_p", _("DB2 %"), 70, "Percent"), c("db3", _("DB3")), c("db3_p", _("DB3 %"), 70, "Percent"),
        c("db4_p", _("DB4 %"), 70, "Percent"), c("budget", _("Budget")), c("ist", _("Ist")), c("obligo", _("Obligo")), c("prognose", _("Prognose Kosten")),
        c("abweichung", _("Abweichung")), c("db_lauf_p", _("DB laufend %"), 90, "Percent"), c("db_prog_p", _("End-DB Prognose %"), 110, "Percent"),
    ]
    data = []
    for name in frappe.get_all("PH Projekt", filters=f, pluck="name", order_by="eingang desc", limit=300):
        try:
            r = nk.berechnen(name)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Projektnachkalkulation {name}")
            continue
        nk.cache_schreiben(name, r)
        k, s = r["kopf"], r["stufen_prognose"] if filters.basis != "Ist" else r["stufen_ist"]
        data.append({
            "projekt": name, "titel": r["projekt"]["titel"], "status": _(r["projekt"]["status"]), "ampel": AMPEL_TEXT.get(k["ampel"], ""), "fertig": k["fertigstellungsgrad"],
            "erloes": k["erloes_cent"] / 100, "db1": s["db1_cent"] / 100, "db1_p": s["db1_prozent"], "db2": s["db2_cent"] / 100, "db2_p": s["db2_prozent"],
            "db3": s["db3_cent"] / 100, "db3_p": s["db3_prozent"], "db4_p": s.get("db4_prozent"), "budget": k["budget_cent"] / 100, "ist": k["kosten_ist_cent"] / 100,
            "obligo": k["obligo_cent"] / 100, "prognose": k["prognose_kosten_cent"] / 100, "abweichung": k["abweichung_cent"] / 100,
            "db_lauf_p": k["db_laufend_prozent"], "db_prog_p": k["db_prognose_prozent"],
        })
    erl = sum(d["erloes"] for d in data)
    summary = [
        {"label": _("Erlös"), "value": erl, "datatype": "Currency", "indicator": "Blue"},
        {"label": _("DB1 gesamt"), "value": sum(d["db1"] for d in data), "datatype": "Currency", "indicator": "Green"},
        {"label": _("DB3 gesamt"), "value": sum(d["db3"] for d in data), "datatype": "Currency", "indicator": "Green"},
        {"label": _("Projekte rot"), "value": sum(1 for d in data if d["ampel"] == AMPEL_TEXT["rot"]), "datatype": "Int", "indicator": "Red"},
    ]
    chart = {"data": {"labels": [d["projekt"] for d in data[:20]], "datasets": [{"name": _("Budget"), "values": [d["budget"] for d in data[:20]]},
                                                                               {"name": _("Prognose"), "values": [d["prognose"] for d in data[:20]]}]},
             "type": "bar", "colors": ["#8a7a66", "#30373e"]}
    hinweis = _("Basis {0}. Ist = zugeordnete Eingangsrechnungen, Lagerentnahmen, Zeiten × Kostensatz, Kassa, Service; Obligo = bestellt, noch nicht berechnet; Prognose = Ist + Obligo + Restbudget (oder manuell).").format(_("Ist") if filters.basis == "Ist" else _("Prognose"))
    return columns, data, hinweis, chart, summary
