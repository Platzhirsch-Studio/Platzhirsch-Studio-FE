"""Kundenwert: Karte, Kontakt, Stufe, Umsatz im Bewertungszeitraum, Gesamtumsatz, letzter Einkauf, offene Vorteile.
Umsätze erscheinen nur bei Karten mit Einwilligung zur Auswertung (sonst leer)."""

import frappe
from frappe import _
from frappe.utils import cint, getdate, nowdate

from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_stufe.ph_kundenkarte_stufe import stufen_liste, stufen_vorteile
from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einloesung.ph_kundenkarte_einloesung import anzahl_im_jahr
from ph_kundenkarte.utils import vorteile as vt

UMSATZ_ROLLEN = {"PH Kundenkarte Leitung", "PH Geschäftsführung", "System Manager", "PH Backoffice-Admin"}


def execute(filters=None):
    filters = frappe._dict(filters or {})
    bedingungen = {"status": ("in", ["Aktiv", "Gesperrt"])}
    if filters.get("stufe"):
        bedingungen["stufe"] = filters.get("stufe")
    if filters.get("berater"):
        bedingungen["persoenlicher_berater"] = filters.get("berater")
    if filters.get("nur_mit_einwilligung"):
        bedingungen["einwilligung_auswertung"] = 1
    karten = frappe.get_all(
        "PH Kundenkarte",
        filters=bedingungen,
        fields=["name", "kontakt", "kunde_name", "stufe", "stufe_seit", "jahresumsatz_cent", "gesamtumsatz_cent", "letzter_einkauf", "einwilligung_auswertung", "persoenlicher_berater", "ausgestellt_am"],
        order_by="jahresumsatz_cent desc, kunde_name asc",
    )
    # Euro-Spalten nur für Leitung/Geschäftsführung (Konzept §9.1 „Kundenwert nur Leitung“); Mitarbeiter sehen Stufe/Vorteile
    darf_umsatz = frappe.session.user == "Administrator" or bool(UMSATZ_ROLLEN & set(frappe.get_roles()))
    stufen = stufen_liste()
    zuordnung = stufen_vorteile()
    jahr = getdate(nowdate()).year
    data = []
    for k in karten:
        offen = 0
        for z in vt.vorteile_fuer_stufe(zuordnung, stufen, k.stufe):
            limit = int(z.get("einloesbar_pro_jahr") or 0)
            if limit == 0:
                continue
            genutzt = anzahl_im_jahr(k.name, z["vorteil"], jahr)
            offen += max(0, limit - genutzt)
        mit = cint(k.einwilligung_auswertung)
        euro = mit and darf_umsatz
        data.append(
            {
                "karte": k.name,
                "kontakt": k.kontakt,
                "kunde_name": k.kunde_name,
                "stufe": k.stufe,
                "stufe_seit": k.stufe_seit,
                "jahresumsatz": (cint(k.jahresumsatz_cent) / 100) if euro else None,
                "gesamtumsatz": (cint(k.gesamtumsatz_cent) / 100) if euro else None,
                "letzter_einkauf": k.letzter_einkauf if mit else None,
                "einwilligung": _("ja") if mit else _("nein"),
                "offene_vorteile": offen,
                "berater": k.persoenlicher_berater,
                "ausgestellt_am": k.ausgestellt_am,
            }
        )
    columns = [
        {"fieldname": "karte", "label": _("Karte"), "fieldtype": "Link", "options": "PH Kundenkarte", "width": 110},
        {"fieldname": "kunde_name", "label": _("Kunde"), "fieldtype": "Data", "width": 170},
        {"fieldname": "kontakt", "label": _("Kontakt"), "fieldtype": "Link", "options": "PH Kontakt", "width": 120},
        {"fieldname": "stufe", "label": _("Stufe"), "fieldtype": "Link", "options": "PH Kundenkarte Stufe", "width": 130},
        {"fieldname": "stufe_seit", "label": _("Stufe seit"), "fieldtype": "Date", "width": 95},
        {"fieldname": "jahresumsatz", "label": _("Umsatz Zeitraum €"), "fieldtype": "Currency", "width": 130},
        {"fieldname": "gesamtumsatz", "label": _("Gesamtumsatz €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "letzter_einkauf", "label": _("Letzter Einkauf"), "fieldtype": "Date", "width": 105},
        {"fieldname": "einwilligung", "label": _("Auswertung"), "fieldtype": "Data", "width": 85},
        {"fieldname": "offene_vorteile", "label": _("Offene Vorteile (limitiert)"), "fieldtype": "Int", "width": 150},
        {"fieldname": "berater", "label": _("Berater"), "fieldtype": "Link", "options": "User", "width": 140},
        {"fieldname": "ausgestellt_am", "label": _("Ausgestellt"), "fieldtype": "Date", "width": 95},
    ]
    je_stufe = {}
    for d in data:
        je_stufe[d["stufe"] or _("ohne")] = je_stufe.get(d["stufe"] or _("ohne"), 0) + 1
    chart = {"data": {"labels": list(je_stufe.keys()), "datasets": [{"name": _("Karten"), "values": list(je_stufe.values())}]}, "type": "bar", "colors": ["#8a7a66"]}
    summary = [
        {"value": len(data), "label": _("Karten"), "datatype": "Int"},
        {"value": sum(1 for d in data if d["einwilligung"] == _("ja")), "label": _("mit Einwilligung"), "datatype": "Int", "indicator": "Green"},
        {"value": sum(d["offene_vorteile"] for d in data), "label": _("offene Vorteile"), "datatype": "Int", "indicator": "Blue"},
    ]
    return columns, data, None, chart, summary
