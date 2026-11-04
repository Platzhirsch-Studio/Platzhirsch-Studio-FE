"""Script Report: Liefertermintreue je Lieferant – bestätigter Termin vs. erste/vollständige Lieferung,
AB-Reaktionszeit, Abweichungsquote. Chart wird vom Dashboard „PH Lieferterminabweichung je Lieferant“ genutzt."""

import frappe
from frappe import _
from frappe.utils import add_months, date_diff, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -12))
    bis = getdate(filters.get("bis") or nowdate())
    f = {"datum": ("between", [von, bis]), "status": ("in", ["Geliefert", "Abgeschlossen", "Teilgeliefert", "AB geprueft", "AB erhalten"])}
    if filters.get("lieferant"):
        f["lieferant"] = filters.lieferant
    rows = frappe.get_all("PH Herstellerbestellung", filters=f, fields=["name", "lieferant", "status", "gesendet_am", "ab_eingang", "wunschtermin", "bestaetigter_termin", "liefertermin_ist", "geliefert_am", "abweichungen_anzahl"])
    agg = {}
    for r in rows:
        a = agg.setdefault(r.lieferant, {"lieferant": r.lieferant, "bestellungen": 0, "geliefert": 0, "puenktlich": 0, "verspaetung_sum": 0, "verspaetung_n": 0, "max_verspaetung": 0, "ab_tage_sum": 0.0, "ab_n": 0, "mit_abweichung": 0, "wunsch_vs_ab_sum": 0, "wunsch_n": 0})
        a["bestellungen"] += 1
        if r.abweichungen_anzahl:
            a["mit_abweichung"] += 1
        if r.gesendet_am and r.ab_eingang:
            a["ab_tage_sum"] += (r.ab_eingang - r.gesendet_am).total_seconds() / 86400
            a["ab_n"] += 1
        if r.wunschtermin and r.bestaetigter_termin:
            a["wunsch_vs_ab_sum"] += date_diff(r.bestaetigter_termin, r.wunschtermin)
            a["wunsch_n"] += 1
        ist = r.geliefert_am or r.liefertermin_ist
        if ist and r.bestaetigter_termin:
            a["geliefert"] += 1
            v = date_diff(ist, r.bestaetigter_termin)
            if v <= 0:
                a["puenktlich"] += 1
            else:
                a["verspaetung_sum"] += v
                a["verspaetung_n"] += 1
                a["max_verspaetung"] = max(a["max_verspaetung"], v)
    data = []
    for a in sorted(agg.values(), key=lambda x: -x["bestellungen"]):
        data.append({
            "lieferant": a["lieferant"], "bestellungen": a["bestellungen"], "geliefert": a["geliefert"],
            "quote_puenktlich": round(100 * a["puenktlich"] / a["geliefert"], 1) if a["geliefert"] else None,
            "verspaetung_tage": round(a["verspaetung_sum"] / a["verspaetung_n"], 1) if a["verspaetung_n"] else 0,
            "max_verspaetung": a["max_verspaetung"],
            "ab_tage": round(a["ab_tage_sum"] / a["ab_n"], 1) if a["ab_n"] else None,
            "wunsch_vs_ab": round(a["wunsch_vs_ab_sum"] / a["wunsch_n"], 1) if a["wunsch_n"] else None,
            "quote_abweichung": round(100 * a["mit_abweichung"] / a["bestellungen"], 1) if a["bestellungen"] else 0,
        })
    columns = [
        {"fieldname": "lieferant", "label": _("Lieferant"), "fieldtype": "Link", "options": "PH Lieferant", "width": 180},
        {"fieldname": "bestellungen", "label": _("Bestellungen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "geliefert", "label": _("Geliefert"), "fieldtype": "Int", "width": 90},
        {"fieldname": "quote_puenktlich", "label": _("Pünktlich %"), "fieldtype": "Percent", "width": 100},
        {"fieldname": "verspaetung_tage", "label": _("Ø Verspätung (Tage)"), "fieldtype": "Float", "width": 130},
        {"fieldname": "max_verspaetung", "label": _("Max. Verspätung"), "fieldtype": "Int", "width": 110},
        {"fieldname": "ab_tage", "label": _("Ø AB nach (Tagen)"), "fieldtype": "Float", "width": 120},
        {"fieldname": "wunsch_vs_ab", "label": _("Ø AB-Termin vs. Wunsch (Tage)"), "fieldtype": "Float", "width": 170},
        {"fieldname": "quote_abweichung", "label": _("AB mit Abweichung %"), "fieldtype": "Percent", "width": 130},
    ]
    chart = {"data": {"labels": [d["lieferant"] for d in data], "datasets": [{"name": _("Ø Verspätung (Tage)"), "values": [d["verspaetung_tage"] for d in data]}, {"name": _("AB mit Abweichung %"), "values": [d["quote_abweichung"] for d in data]}]}, "type": "bar", "colors": ["#b45309", "#8a7a66"]}
    geliefert = sum(d["geliefert"] for d in data)
    puenktlich = sum(a["puenktlich"] for a in agg.values())
    summary = [
        {"value": sum(d["bestellungen"] for d in data), "label": _("Bestellungen"), "datatype": "Int"},
        {"value": round(100 * puenktlich / geliefert, 1) if geliefert else 0, "label": _("Pünktlich %"), "datatype": "Percent", "indicator": "Green"},
        {"value": sum(a["mit_abweichung"] for a in agg.values()), "label": _("AB mit Abweichung"), "datatype": "Int", "indicator": "Orange"},
    ]
    return columns, data, None, chart, summary
