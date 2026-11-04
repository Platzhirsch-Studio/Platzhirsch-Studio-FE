"""Script Report PH Shop Umsatz nach USt-Satz (Zuarbeit UVA): bezahlte Bestellungen je Monat, Steuerland und
Satz (Brutto, Netto, USt) aus PH Bestellung Steuer; OSS-Lieferungen getrennt ausgewiesen."""

import frappe
from frappe import _
from frappe.utils import add_months, cint, getdate, nowdate

BEZAHLT = ("bezahlt", "versandbereit", "versendet", "abholbereit", "abgeholt", "abgeschlossen", "teilerstattet")


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -1))
    bis = getdate(filters.get("bis") or nowdate())
    bed = {"status": ("in", BEZAHLT), "bezahlt_am": ("between", [von, f"{bis} 23:59:59"])}
    if cint(filters.get("nur_live", 1)):
        bed["modus"] = "live"
    best = frappe.get_all("PH Bestellung", bed, ["name", "bezahlt_am", "steuerland", "oss", "erstattet_cent", "gesamt_cent"])
    if not best:
        return _spalten(), [], None, None, []
    namen = [b.name for b in best]
    steuer = frappe.get_all("PH Bestellung Steuer", {"parent": ("in", namen), "parenttype": "PH Bestellung"}, ["parent", "satz_promille", "brutto_cent", "netto_cent", "ust_cent", "versand_cent"])
    info = {b.name: b for b in best}
    agg = {}
    for s in steuer:
        b = info[s.parent]
        key = (getdate(b.bezahlt_am).strftime("%Y-%m"), b.steuerland or "AT", cint(b.oss), cint(s.satz_promille))
        a = agg.setdefault(key, {"monat": key[0], "steuerland": key[1], "oss": _("ja") if key[2] else _("nein"), "satz": key[3] / 100, "brutto": 0, "netto": 0, "ust": 0, "versand": 0, "bestellungen": set()})
        a["brutto"] += cint(s.brutto_cent)
        a["netto"] += cint(s.netto_cent)
        a["ust"] += cint(s.ust_cent)
        a["versand"] += cint(s.versand_cent)
        a["bestellungen"].add(s.parent)
    data = []
    for a in sorted(agg.values(), key=lambda x: (x["monat"], x["steuerland"], -x["satz"])):
        data.append({"monat": a["monat"], "steuerland": a["steuerland"], "oss": a["oss"], "satz": a["satz"], "anzahl": len(a["bestellungen"]), "brutto": a["brutto"] / 100, "netto": a["netto"] / 100, "ust": a["ust"] / 100, "versand": a["versand"] / 100})
    chart = {"data": {"labels": [f"{d['monat']} {d['steuerland']} {d['satz']:g} %" for d in data], "datasets": [{"name": _("Netto"), "values": [d["netto"] for d in data]}, {"name": _("USt"), "values": [d["ust"] for d in data]}]}, "type": "bar", "colors": ["#30373e", "#8a7a66"]}
    erstattet = sum(cint(b.erstattet_cent) for b in best) / 100
    summary = [
        {"value": sum(d["brutto"] for d in data), "label": _("Brutto €"), "datatype": "Currency"},
        {"value": sum(d["ust"] for d in data), "label": _("USt €"), "datatype": "Currency", "indicator": "Blue"},
        {"value": erstattet, "label": _("davon später erstattet €"), "datatype": "Currency", "indicator": "Orange"},
        {"value": sum(1 for b in best if cint(b.oss)), "label": _("OSS-Bestellungen"), "datatype": "Int"},
    ]
    return _spalten(), data, _("Entwurf nach src/lib/shop/ust.js (Stand 31.10.2026) – Steuerberater-Freigabe offen. Erstattungen mindern die Bemessungsgrundlage im Monat der Erstattung (Report PH Rueckerstattungen)."), chart, summary


def _spalten():
    return [
        {"fieldname": "monat", "label": _("Monat"), "fieldtype": "Data", "width": 90},
        {"fieldname": "steuerland", "label": _("Steuerland"), "fieldtype": "Data", "width": 90},
        {"fieldname": "oss", "label": _("OSS"), "fieldtype": "Data", "width": 60},
        {"fieldname": "satz", "label": _("Satz %"), "fieldtype": "Float", "precision": 1, "width": 80},
        {"fieldname": "anzahl", "label": _("Bestellungen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "brutto", "label": _("Brutto €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "netto", "label": _("Netto €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "ust", "label": _("USt €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "versand", "label": _("davon Versand brutto €"), "fieldtype": "Currency", "width": 150},
    ]
