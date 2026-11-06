"""PH Kostenarten je Projekt – je Projekt und Kostenart: Budget bei Auftrag/aktuell, Ist, Obligo, Rest, Prognose, Abweichung, Ampel.
Nur Leitung/GF. Daten: ph_projekte/nachkalkulation.py."""

import frappe
from frappe import _

from ph_projekte.ph_projekte import nachkalkulation as nk


def execute(filters=None):
    nk.pruefe_leitung()
    filters = frappe._dict(filters or {})
    f = {"name": filters.projekt} if filters.projekt else {"status": ("in", nk.LAUFEND) if not filters.status else filters.status}
    if filters.projektart and not filters.projekt:
        f["projektart"] = filters.projektart
    c = lambda fn, label, w=110, t="Currency": {"fieldname": fn, "label": label, "fieldtype": t, "width": w}  # noqa: E731
    columns = [
        {"fieldname": "projekt", "label": _("Projekt"), "fieldtype": "Link", "options": "PH Projekt", "width": 130},
        {"fieldname": "kostenart", "label": _("Kostenart"), "fieldtype": "Link", "options": "PH Kostenart", "width": 140},
        c("stufe", _("Stufe"), 60, "Data"), c("budget_auftrag", _("Budget bei Auftrag")), c("budget", _("Budget aktuell")), c("ist", _("Ist")),
        c("obligo", _("Obligo")), c("rest", _("Rest")), c("prognose", _("Prognose")), c("abweichung", _("Abweichung")),
        c("verbrauch", _("Verbrauch %"), 90, "Percent"), c("ampel", _("Ampel"), 70, "Data"), c("begruendung", _("Begründung Rest"), 200, "Data"),
    ]
    data = []
    for name in frappe.get_all("PH Projekt", filters=f, pluck="name", order_by="eingang desc", limit=200):
        r = nk.berechnen(name)
        for z in r["kostenarten"]:
            if filters.kostenart and z["kostenart"] != filters.kostenart:
                continue
            data.append({"projekt": name, "kostenart": z["kostenart"], "stufe": z["db_stufe"], "budget_auftrag": z["budget_auftrag_cent"] / 100, "budget": z["budget_cent"] / 100,
                         "ist": z["ist_cent"] / 100, "obligo": z["obligo_cent"] / 100, "rest": z["rest_cent"] / 100, "prognose": z["prognose_cent"] / 100,
                         "abweichung": z["abweichung_cent"] / 100, "verbrauch": z["verbrauch_prozent"], "ampel": _(z["ampel"]) if z["ampel"] else "",
                         "begruendung": z["prognose_begruendung"]})
    return columns, data
