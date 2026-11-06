"""Script Report: Inventurbewertung zum Stichtag (Menge × Einstandspreis, Abwertung, Niederstwert) je Position oder Summe je
Lagerort/Warengruppe/Marke/Bewertungsart. Nur Leitung, Geschäftsführung, Buchhaltung extern. CSV über den Report-Export;
Festschreiben + PDF „PH Inventurbewertung“ über den Beleg PH Inventurbewertung (Button „Als Bewertung festhalten“)."""

import frappe
from frappe import _
from frappe.utils import nowdate

from ph_logistik.ph_logistik.bewertung import berechnen


def _euro(cent):
    return (cent or 0) / 100


GELD = [
    {"fieldname": "wert_ak", "label": "Wert AK €", "fieldtype": "Currency", "options": "EUR", "width": 110},
    {"fieldname": "abwertung", "label": "Abwertung €", "fieldtype": "Currency", "options": "EUR", "width": 105},
    {"fieldname": "wert", "label": "Bilanzwert €", "fieldtype": "Currency", "options": "EUR", "width": 115},
]


def execute(filters=None):
    f = frappe._dict(filters or {})
    r = berechnen(f.get("stichtag") or nowdate(), f.get("lagerort"), f.get("methode"))
    gruppe = f.get("gruppierung") or "Position"
    geld = [{**c, "label": _(c["label"])} for c in GELD]
    if gruppe == "Position":
        columns = [
            {"fieldname": "lagerort", "label": _("Lagerort"), "fieldtype": "Link", "options": "PH Lagerort", "width": 120},
            {"fieldname": "platz", "label": _("Platz"), "fieldtype": "Data", "width": 80},
            {"fieldname": "lagerbestand", "label": _("Bestand"), "fieldtype": "Link", "options": "PH Lagerbestand", "width": 105},
            {"fieldname": "produkt_name", "label": _("Artikel"), "fieldtype": "Data", "width": 210},
            {"fieldname": "marke", "label": _("Marke"), "fieldtype": "Data", "width": 100},
            {"fieldname": "warengruppe", "label": _("Warengruppe"), "fieldtype": "Data", "width": 110},
            {"fieldname": "bewertungsart", "label": _("Art"), "fieldtype": "Data", "width": 105},
            {"fieldname": "menge", "label": _("Menge"), "fieldtype": "Int", "width": 65},
            {"fieldname": "einstandspreis", "label": _("Einstandspreis €"), "fieldtype": "Currency", "options": "EUR", "width": 115},
            {"fieldname": "ek_quelle", "label": _("EK-Quelle"), "fieldtype": "Data", "width": 130},
            {"fieldname": "alter_monate", "label": _("Alter Mon."), "fieldtype": "Int", "width": 75},
            {"fieldname": "abwertung_prozent", "label": _("Abwertung %"), "fieldtype": "Float", "precision": 1, "width": 90},
        ] + geld + [{"fieldname": "hinweis", "label": _("Hinweis"), "fieldtype": "Data", "width": 160}]
        data = [{**z, "einstandspreis": _euro(z["einstandspreis_cent"]), "abwertung_prozent": z["abwertung_promille"] / 10, "wert_ak": _euro(z["wert_ak_cent"]),
                 "abwertung": _euro(z["abwertung_cent"]), "wert": _euro(z["wert_cent"])} for z in r["zeilen"]]
    else:
        schluessel = {"Lagerort": "lagerort", "Warengruppe": "warengruppe", "Marke": "marke", "Bewertungsart": "bewertungsart"}[gruppe]
        columns = [{"fieldname": "gruppe", "label": _(gruppe), "fieldtype": "Data", "width": 200}, {"fieldname": "positionen", "label": _("Positionen"), "fieldtype": "Int", "width": 90},
                   {"fieldname": "menge", "label": _("Menge"), "fieldtype": "Int", "width": 80}] + geld
        data = [{**s, "wert_ak": _euro(s["wert_ak_cent"]), "abwertung": _euro(s["abwertung_cent"]), "wert": _euro(s["wert_cent"])} for s in r["summen"][schluessel]]
    g = r["gesamt"]
    summary = [
        {"value": _euro(g["wert_ak_cent"]), "label": _("Anschaffungskosten"), "datatype": "Currency", "currency": "EUR"},
        {"value": _euro(g["abwertung_cent"]), "label": _("Abwertung"), "datatype": "Currency", "currency": "EUR", "indicator": "Orange"},
        {"value": _euro(g["wert_cent"]), "label": _("Bilanzwert"), "datatype": "Currency", "currency": "EUR", "indicator": "Green"},
        {"value": g["menge"], "label": _("Stück"), "datatype": "Int"},
    ]
    msg = "<br>".join([frappe.utils.escape_html(_("Methode: {0}").format(r["methode_beschreibung"]))] + [frappe.utils.escape_html(h) for h in r["hinweise"]])
    lo = r["summen"]["lagerort"]
    chart = {"data": {"labels": [s["gruppe"] for s in lo], "datasets": [{"name": _("Bilanzwert €"), "values": [_euro(s["wert_cent"]) for s in lo]}]}, "type": "bar", "colors": ["#8a7a66"]} if lo else None
    return columns, data, msg, chart, summary


@frappe.whitelist(methods=["POST"])
def festhalten(stichtag, lagerort=None, methode=None):
    """Button im Bericht: PH Inventurbewertung (Entwurf) anlegen und berechnen → Name."""
    frappe.has_permission("PH Inventurbewertung", "create", throw=True)
    doc = frappe.get_doc({"doctype": "PH Inventurbewertung", "stichtag": stichtag, "lagerort": lagerort or None, "methode": methode or None}).insert()
    doc.berechnen()
    return doc.name
