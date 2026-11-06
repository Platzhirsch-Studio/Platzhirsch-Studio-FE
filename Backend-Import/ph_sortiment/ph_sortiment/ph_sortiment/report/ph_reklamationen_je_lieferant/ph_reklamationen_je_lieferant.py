"""Script Report: Reklamationsstatistik je Lieferant – Wareneingangsschäden, AB-Abweichungen, Liefertermintreue,
Servicefälle/Regresse (nur mit ph_service). Quoten in Promille. Grundlage für Lieferantengespräche (32-Nachtrag S12)."""

import frappe
from frappe import _

from ph_sortiment.ph_sortiment.statistik import daten


def execute(filters=None):
    filters = frappe._dict(filters or {})
    d = daten(filters.get("lieferant"), filters.get("von"), filters.get("bis"))
    zeilen = list(d["zeilen"])
    if d["gesamt"] and len(zeilen) > 1:
        zeilen.append(d["gesamt"])
    for z in zeilen:
        for k in ("schadenquote_promille", "ab_abweichungsquote_promille", "termintreue_promille", "regress_quote_promille"):
            z[k.replace("_promille", "_prozent")] = None if z.get(k) is None else z[k] / 10
    chart = None
    if d["zeilen"]:
        top = d["zeilen"][:10]
        chart = {"data": {"labels": [z["lieferant"] for z in top], "datasets": [{"name": _("Schadenquote %"), "values": [(z["schadenquote_promille"] or 0) / 10 for z in top]}, {"name": _("AB-Abweichung %"), "values": [(z["ab_abweichungsquote_promille"] or 0) / 10 for z in top]}]}, "type": "bar", "colors": ["#b91c1c", "#b45309"]}
    g = d["gesamt"] or {}
    summary = [
        {"value": len(d["zeilen"]), "label": _("Lieferanten"), "datatype": "Int"},
        {"value": (g.get("schadenquote_promille") or 0) / 10, "label": _("Schadenquote gesamt %"), "datatype": "Float", "indicator": "Red"},
        {"value": (g.get("termintreue_promille") or 0) / 10, "label": _("Termintreue gesamt %"), "datatype": "Float", "indicator": "Green"},
    ]
    message = None if d["service_installiert"] else _("Servicefälle/Regresse erscheinen, sobald ph_service installiert ist.")
    return spalten(), zeilen, message, chart, summary


def spalten():
    s = lambda f, l, t="Int", w=90, **x: {"fieldname": f, "label": l, "fieldtype": t, "width": w, **x}  # noqa: E731
    return [
        s("lieferant", _("Lieferant"), "Link", 170, options="PH Lieferant"),
        s("we_positionen", _("WE-Positionen")), s("we_schaeden", _("Schäden/Fehler")), s("schadenquote_prozent", _("Schadenquote %"), "Float"),
        s("Transportschaden", _("Transport")), s("beschaedigt", _("beschädigt")), s("falsch", _("falsch")), s("fehlt", _("fehlt")), s("unterlieferung", _("Unterlieferung")),
        s("ab_positionen", _("AB-Positionen")), s("ab_abweichungen", _("AB-Abweichungen")), s("ab_abweichungsquote_prozent", _("AB-Abw. %"), "Float"),
        s("lieferungen", _("Lieferungen")), s("termintreue_prozent", _("Termintreue %"), "Float"), s("verspaetung_tage_schnitt", _("Ø Tage spät"), "Float"),
        s("servicefaelle", _("Servicefälle")), s("regresse", _("Regresse")), s("regress_gefordert_cent", _("Regress gefordert (Cent)")), s("regress_anerkannt_cent", _("anerkannt (Cent)")), s("regress_quote_prozent", _("Regressquote %"), "Float"),
    ]
