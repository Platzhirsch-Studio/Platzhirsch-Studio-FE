"""Script Report: Produkte, deren Preisstand älter als n Monate ist (Website blendet alte Preise aus,
src/lib/shop/catalog.js + schema.js preisVeraltet). Zeigt je Produkt den jüngsten freigegebenen Preis."""

import frappe
from frappe import _
from frappe.utils import cint, getdate, nowdate

from ph_sortiment.logik.preise import gueltig_bis, monate_alt, stichtag_monate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    monate = cint(filters.get("monate")) or 3
    stichtag = stichtag_monate(monate, nowdate())
    bedingungen = {"status": ("in", ["Aktiv", "Geprueft", "Pausiert"])}
    if filters.get("marke"):
        bedingungen["marke"] = filters.marke
    if filters.get("nur_aktiv"):
        bedingungen["status"] = "Aktiv"

    produkte = frappe.get_all("PH Produkt", filters=bedingungen, fields=["name", "titel", "marke", "kategorie", "status", "preisart", "aktueller_preis_cent", "preisstand_alt", "verkauf_online"])
    data = []
    for p in produkte:
        preise = frappe.get_all("PH Produkt Preis", filters={"parent": p.name, "parenttype": "PH Produkt", "freigegeben": 1}, fields=["stand", "preisart", "brutto_cent", "quelle", "quelle_url"], order_by="stand desc", limit=1)
        if not preise:
            continue
        z = preise[0]
        if getdate(z.stand) > stichtag and not p.preisstand_alt:
            continue
        data.append({
            "produkt": p.name, "titel": p.titel, "marke": p.marke, "kategorie": p.kategorie, "status": p.status,
            "preisart": z.preisart, "brutto_cent": z.brutto_cent, "stand": z.stand, "monate": monate_alt(z.stand, nowdate()),
            "gueltig_bis": gueltig_bis(z.stand, z.preisart), "quelle": z.quelle_url or z.quelle, "online": p.verkauf_online, "veraltet": p.preisstand_alt,
        })
    data.sort(key=lambda d: (d["stand"] or ""))

    columns = [
        {"fieldname": "produkt", "label": _("Produkt"), "fieldtype": "Link", "options": "PH Produkt", "width": 220},
        {"fieldname": "titel", "label": _("Titel"), "fieldtype": "Data", "width": 220},
        {"fieldname": "marke", "label": _("Marke"), "fieldtype": "Link", "options": "PH Marke", "width": 130},
        {"fieldname": "kategorie", "label": _("Kategorie"), "fieldtype": "Link", "options": "PH Kategorie", "width": 120},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 90},
        {"fieldname": "preisart", "label": _("Preisart"), "fieldtype": "Data", "width": 100},
        {"fieldname": "brutto_cent", "label": _("Preis (Cent)"), "fieldtype": "Int", "width": 100},
        {"fieldname": "stand", "label": _("Preisstand"), "fieldtype": "Date", "width": 100},
        {"fieldname": "monate", "label": _("Monate alt"), "fieldtype": "Int", "width": 90},
        {"fieldname": "gueltig_bis", "label": _("Anzeige bis"), "fieldtype": "Date", "width": 100},
        {"fieldname": "veraltet", "label": _("Website ohne Preis"), "fieldtype": "Check", "width": 110},
        {"fieldname": "online", "label": _("Online"), "fieldtype": "Check", "width": 70},
        {"fieldname": "quelle", "label": _("Quelle"), "fieldtype": "Data", "width": 240},
    ]
    je_marke = {}
    for d in data:
        je_marke[d["marke"]] = je_marke.get(d["marke"], 0) + 1
    chart = {"data": {"labels": list(je_marke), "datasets": [{"name": _("Produkte"), "values": list(je_marke.values())}]}, "type": "bar", "colors": ["#b45309"]}
    summary = [
        {"value": len(data), "label": _("Produkte mit altem Preisstand"), "datatype": "Int", "indicator": "Orange" if data else "Green"},
        {"value": sum(1 for d in data if d["veraltet"]), "label": _("davon ohne Preis auf der Website"), "datatype": "Int", "indicator": "Red"},
        {"value": sum(1 for d in data if d["online"]), "label": _("davon online verkäuflich"), "datatype": "Int"},
    ]
    return columns, data, None, chart, summary
