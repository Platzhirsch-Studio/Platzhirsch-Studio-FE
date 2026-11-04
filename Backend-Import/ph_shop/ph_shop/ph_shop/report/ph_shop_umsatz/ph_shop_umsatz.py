"""Script Report PH Shop Umsatz: gebuchte Zahlungseingänge je Tag/Monat (alle Kanäle), Erstattungen gegengerechnet.
Grundlage ist PH Zahlung (docstatus 1), nicht die Bestellung – so zählt auch Showroom/Kassa, sobald ph_kassa bucht."""

import frappe
from frappe import _
from frappe.utils import add_months, cint, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -1))
    bis = getdate(filters.get("bis") or nowdate())
    nach_monat = filters.get("nach") == "Monat"
    bed = {"docstatus": 1, "zeitpunkt": ("between", [von, f"{bis} 23:59:59"])}
    if cint(filters.get("nur_live", 1)):
        bed["livemode"] = 1
    rows = frappe.get_all("PH Zahlung", bed, ["zeitpunkt", "art", "kanal", "betrag_cent", "stripe_gebuehr_cent", "bezug_doctype"])

    agg = {}
    for r in rows:
        d = getdate(r.zeitpunkt)
        key = d.strftime("%Y-%m") if nach_monat else d.isoformat()
        a = agg.setdefault(key, {"periode": key, "eingang_cent": 0, "erstattung_cent": 0, "stripe_cent": 0, "bar_cent": 0, "gutschein_cent": 0, "sonstige_cent": 0, "gebuehren_cent": 0, "anzahl": 0})
        if r.art == "Erstattung":
            a["erstattung_cent"] += cint(r.betrag_cent)
            continue
        if r.art != "Eingang":
            continue
        a["anzahl"] += 1
        a["eingang_cent"] += cint(r.betrag_cent)
        a["gebuehren_cent"] += cint(r.stripe_gebuehr_cent)
        if (r.kanal or "").startswith("Stripe"):
            a["stripe_cent"] += cint(r.betrag_cent)
        elif r.kanal in ("Bar", "Karte extern"):
            a["bar_cent"] += cint(r.betrag_cent)
        elif r.kanal == "Gutschein":
            a["gutschein_cent"] += cint(r.betrag_cent)
        else:
            a["sonstige_cent"] += cint(r.betrag_cent)
    data = []
    for a in sorted(agg.values(), key=lambda x: x["periode"]):
        a["netto_cent"] = a["eingang_cent"] - a["erstattung_cent"]
        data.append({k: (v / 100 if k.endswith("_cent") else v) for k, v in a.items()})

    cols = [
        {"fieldname": "periode", "label": _("Monat") if nach_monat else _("Tag"), "fieldtype": "Data", "width": 110},
        {"fieldname": "anzahl", "label": _("Zahlungen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "eingang_cent", "label": _("Eingang €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "erstattung_cent", "label": _("Erstattet €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "netto_cent", "label": _("Netto €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "stripe_cent", "label": _("davon Stripe €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "bar_cent", "label": _("Bar/Karte €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "gutschein_cent", "label": _("Gutschein €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "sonstige_cent", "label": _("Überweisung/Sonst. €"), "fieldtype": "Currency", "width": 130},
        {"fieldname": "gebuehren_cent", "label": _("Stripe-Gebühren €"), "fieldtype": "Currency", "width": 130},
    ]
    chart = {"data": {"labels": [d["periode"] for d in data], "datasets": [{"name": _("Eingang"), "values": [d["eingang_cent"] for d in data]}, {"name": _("Erstattet"), "values": [d["erstattung_cent"] for d in data]}]}, "type": "bar", "colors": ["#15803d", "#b91c1c"]}
    ges = sum(d["eingang_cent"] for d in data)
    erst = sum(d["erstattung_cent"] for d in data)
    summary = [
        {"value": ges, "label": _("Eingang €"), "datatype": "Currency", "indicator": "Green"},
        {"value": erst, "label": _("Erstattet €"), "datatype": "Currency", "indicator": "Red"},
        {"value": ges - erst, "label": _("Netto €"), "datatype": "Currency"},
        {"value": sum(d["anzahl"] for d in data), "label": _("Zahlungen"), "datatype": "Int"},
    ]
    return cols, data, None, chart, summary
