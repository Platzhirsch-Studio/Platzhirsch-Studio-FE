"""PH DB Auswertung – Deckungsbeiträge gruppiert nach Projektart, Berater, Marke oder Monat. Nur Leitung/GF.

Abgeschlossene Projekte: eingefrorene PH Projekt Nachkalkulation (falls vorhanden), sonst und für laufende Projekte die
aktuelle Berechnung (Basis Prognose). Monat = Abschlussmonat, bei laufenden Projekten Eingangsmonat.
Marke (Näherung): Erlös nach VK-Anteil der Projektpositionen je Marke, Wareneinsatz (DB1-Kosten) nach EK-Anteil;
DB2/DB3 lassen sich keiner Marke zuordnen und bleiben dort leer.
"""

import frappe
from frappe import _
from frappe.utils import cint

from ph_projekte.ph_projekte import nachkalkulation as nk
from ph_projekte.utils import kalkulation as kalk

GRUPPEN = ("Projektart", "Berater", "Marke", "Monat")


def _projektzahlen(p, umfang):
    snap = frappe.db.get_value("PH Projekt Nachkalkulation", {"projekt": p.name, "status": "Abgeschlossen"},
                               ["erloes_cent", "db1_cent", "db2_cent", "db3_cent", "kosten_ist_cent"], as_dict=True) if p.status == "Abgeschlossen" else None
    if snap:
        return {"erloes": cint(snap.erloes_cent), "db1": cint(snap.db1_cent), "db2": cint(snap.db2_cent), "db3": cint(snap.db3_cent), "ware": cint(snap.erloes_cent) - cint(snap.db1_cent)}
    r = nk.berechnen(p.name)
    s = r["stufen_prognose"] if umfang != "Ist" else r["stufen_ist"]
    return {"erloes": s["erloes_cent"], "db1": s["db1_cent"], "db2": s["db2_cent"], "db3": s["db3_cent"], "ware": s["kosten_je_stufe"]["DB1"]}


def execute(filters=None):
    nk.pruefe_leitung()
    filters = frappe._dict(filters or {})
    gruppe = filters.gruppierung if filters.gruppierung in GRUPPEN else "Projektart"
    status = ("in", nk.LAUFEND + ("Abgeschlossen",)) if not filters.status else filters.status
    f = {"status": status}
    if filters.von:
        f["eingang"] = (">=", filters.von)
    werte = {}
    for p in frappe.get_all("PH Projekt", filters=f, fields=["name", "projektart", "berater", "status", "eingang", "abgeschlossen_am"], limit=500, order_by="eingang desc"):
        try:
            z = _projektzahlen(p, filters.basis)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH DB Auswertung {p.name}")
            continue
        if gruppe == "Marke":
            pos = frappe.get_all("PH Projekt Position", filters={"parent": p.name, "parenttype": "PH Projekt", "lieferstatus": ("!=", "storniert")}, fields=["marke", "menge", "preis_cent", "ek_cent"])
            vk = sum(cint(x.preis_cent) * max(cint(x.menge), 1) for x in pos) or 1
            ek = sum(cint(x.ek_cent) * max(cint(x.menge), 1) for x in pos) or 1
            je = {}
            for x in pos:
                m = x.marke or _("ohne Marke")
                a = je.setdefault(m, [0, 0])
                a[0] += cint(x.preis_cent) * max(cint(x.menge), 1)
                a[1] += cint(x.ek_cent) * max(cint(x.menge), 1)
            for m, (v, e) in je.items():
                erl = int(round(z["erloes"] * v / vk))
                ware = int(round(z["ware"] * e / ek))
                g = werte.setdefault(m, {"gruppe": m, "projekte": set(), "erloes": 0, "db1": 0, "db2": None, "db3": None})
                g["projekte"].add(p.name)
                g["erloes"] += erl
                g["db1"] += erl - ware
            continue
        if gruppe == "Monat":
            schluessel = str(p.abgeschlossen_am or p.eingang or "")[:7] or _("ohne Datum")
        elif gruppe == "Berater":
            schluessel = p.berater or _("ohne Berater")
        else:
            schluessel = _(p.projektart or "Sonstiges")
        g = werte.setdefault(schluessel, {"gruppe": schluessel, "projekte": set(), "erloes": 0, "db1": 0, "db2": 0, "db3": 0})
        g["projekte"].add(p.name)
        for k in ("erloes", "db1", "db2", "db3"):
            g[k] += z[k]
    c = lambda fn, label, w=120, t="Currency": {"fieldname": fn, "label": label, "fieldtype": t, "width": w}  # noqa: E731
    columns = [c("gruppe", _(gruppe), 180, "Data"), c("anzahl", _("Projekte"), 80, "Int"), c("erloes", _("Erlös netto")), c("db1", _("DB1")), c("db1_p", _("DB1 %"), 80, "Percent"),
               c("db2", _("DB2")), c("db2_p", _("DB2 %"), 80, "Percent"), c("db3", _("DB3")), c("db3_p", _("DB3 %"), 80, "Percent")]
    data = []
    for g in sorted(werte.values(), key=lambda x: str(x["gruppe"]), reverse=gruppe == "Monat"):
        zeile = {"gruppe": g["gruppe"], "anzahl": len(g["projekte"]), "erloes": g["erloes"] / 100}
        for k in ("db1", "db2", "db3"):
            zeile[k] = g[k] / 100 if g[k] is not None else None
            zeile[k + "_p"] = kalk.prozent(g[k], g["erloes"]) if g[k] is not None else None
        data.append(zeile)
    chart = {"data": {"labels": [str(d["gruppe"]) for d in data[:24]], "datasets": [{"name": _("DB1 %"), "values": [d["db1_p"] or 0 for d in data[:24]]}]}, "type": "bar", "colors": ["#30373e"]}
    return columns, data, _("Abgeschlossene Projekte aus der eingefrorenen Nachkalkulation, laufende aus der aktuellen Prognose. Marke = Näherung über VK/EK-Anteile."), chart
