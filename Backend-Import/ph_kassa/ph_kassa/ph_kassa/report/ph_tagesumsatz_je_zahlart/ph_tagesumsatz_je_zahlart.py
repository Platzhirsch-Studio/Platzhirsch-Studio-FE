"""PH Tagesumsatz je Zahlart – je Tag Bar / Karte / Gutschein / Überweisung, Belege, Stornos."""

from frappe import _

from ph_kassa.auswertung import belege_zeitraum, tage, zeitraum_filter
from ph_kassa.logik.abschluss import soll_aus_belegen


def execute(filters=None):
    filters, von, bis = zeitraum_filter(filters)
    je_tag = {}
    for b in belege_zeitraum(von, bis, filters.get("kasse"), mit_training=bool(filters.get("mit_training"))):
        je_tag.setdefault(b["datum"], []).append(b)
    data = []
    for t in tage(von, bis):
        if t not in je_tag:
            continue
        s = soll_aus_belegen(je_tag[t])
        data.append({"datum": t, "bar_cent": s["bar_einnahmen_cent"] - s["bar_ausgaben_cent"], "karte_cent": s["karten_cent"], "gutschein_cent": s["gutschein_cent"], "ueberweisung_cent": s["ueberweisung_cent"], "gesamt_cent": s["umsatz_cent"], "belege": s["belege_anzahl"], "stornos": s["stornos_anzahl"], "training": s["trainings_anzahl"]})
    columns = [
        {"fieldname": "datum", "label": _("Tag"), "fieldtype": "Date", "width": 110},
        {"fieldname": "bar_cent", "label": _("Bar (Cent)"), "fieldtype": "Int", "width": 120},
        {"fieldname": "karte_cent", "label": _("Karte"), "fieldtype": "Int", "width": 120},
        {"fieldname": "gutschein_cent", "label": _("Gutschein"), "fieldtype": "Int", "width": 120},
        {"fieldname": "ueberweisung_cent", "label": _("Überweisung"), "fieldtype": "Int", "width": 120},
        {"fieldname": "gesamt_cent", "label": _("Gesamt (Cent)"), "fieldtype": "Int", "width": 130},
        {"fieldname": "belege", "label": _("Belege"), "fieldtype": "Int", "width": 80},
        {"fieldname": "stornos", "label": _("Stornos"), "fieldtype": "Int", "width": 80},
        {"fieldname": "training", "label": _("Training"), "fieldtype": "Int", "width": 80},
    ]
    chart = {"data": {"labels": [str(d["datum"]) for d in data], "datasets": [{"name": _("Bar"), "values": [d["bar_cent"] / 100 for d in data]}, {"name": _("Karte"), "values": [d["karte_cent"] / 100 for d in data]}, {"name": _("Gutschein"), "values": [d["gutschein_cent"] / 100 for d in data]}, {"name": _("Überweisung"), "values": [d["ueberweisung_cent"] / 100 for d in data]}]}, "type": "bar", "barOptions": {"stacked": 1}, "colors": ["#30373e", "#1d4ed8", "#8a7a66", "#15803d"]}
    summary = [
        {"value": sum(d["gesamt_cent"] for d in data) / 100, "label": _("Umsatz €"), "datatype": "Currency", "currency": "EUR"},
        {"value": sum(d["bar_cent"] for d in data) / 100, "label": _("Bar €"), "datatype": "Currency", "currency": "EUR"},
        {"value": sum(d["karte_cent"] for d in data) / 100, "label": _("Karte €"), "datatype": "Currency", "currency": "EUR"},
        {"value": sum(d["belege"] for d in data), "label": _("Belege"), "datatype": "Int"},
    ]
    return columns, data, None, chart, summary
