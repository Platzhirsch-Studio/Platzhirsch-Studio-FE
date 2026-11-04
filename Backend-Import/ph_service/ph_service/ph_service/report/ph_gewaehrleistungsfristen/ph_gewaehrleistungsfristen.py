"""Gewährleistungsfristen: Servicefälle, deren Vermutungs-, Gewährleistungs- oder Regressfrist in den nächsten N Tagen endet
(oder bereits abgelaufen ist) – sortiert nach Dringlichkeit, mit Ampel."""

import frappe
from frappe import _
from frappe.utils import add_days, cint, getdate, nowdate

from ph_service.ph_service import fristen as fr
from ph_service.ph_service.doctype.ph_servicefall.ph_servicefall import OFFEN


def execute(filters=None):
    filters = frappe._dict(filters or {})
    tage = cint(filters.get("tage") or 60)
    heute = getdate(nowdate())
    bis = add_days(heute, tage)
    bedingungen = {"gewaehrleistung_bis": ("is", "set")}
    if not filters.get("alle"):
        bedingungen["status"] = ("in", OFFEN)
    if filters.get("marke"):
        bedingungen["marke"] = filters.marke
    rows = frappe.get_all(
        "PH Servicefall",
        filters=bedingungen,
        fields=["name", "titel", "kunde_name", "produkt_name", "marke", "kundentyp", "status", "uebergabe_datum", "kaufdatum", "beweislast_bis", "gewaehrleistung_bis", "verjaehrung_bis", "garantie_bis", "regress_frist_bis", "fristen_status", "verantwortlich", "erledigt_am"],
        order_by="gewaehrleistung_bis asc",
        limit=2000,
    )
    data = []
    for r in rows:
        naechste = None
        for feld in ("beweislast_bis", "gewaehrleistung_bis", "verjaehrung_bis", "garantie_bis", "regress_frist_bis"):
            d = r.get(feld)
            if d and getdate(d) >= heute and (naechste is None or getdate(d) < naechste[1]):
                naechste = (feld, getdate(d))
        rest_gwl = fr.tage_bis(r.gewaehrleistung_bis, heute)
        if not filters.get("alle") and rest_gwl is not None and rest_gwl > tage and not (r.regress_frist_bis and fr.tage_bis(r.regress_frist_bis, heute) <= tage):
            continue
        data.append(
            {
                "servicefall": r.name,
                "kunde": r.kunde_name,
                "produkt": r.produkt_name,
                "marke": r.marke,
                "kundentyp": r.kundentyp,
                "status": r.status,
                "uebergabe": r.uebergabe_datum or r.kaufdatum,
                "beweislast_bis": r.beweislast_bis,
                "gewaehrleistung_bis": r.gewaehrleistung_bis,
                "tage_rest": rest_gwl,
                "verjaehrung_bis": r.verjaehrung_bis,
                "garantie_bis": r.garantie_bis,
                "regress_frist_bis": r.regress_frist_bis,
                "fristen_status": r.fristen_status,
                "ampel": fr.AMPEL.get(r.fristen_status, "grau"),
                "naechste_frist": _(naechste[0].replace("_bis", "")) if naechste else _("keine"),
                "naechste_am": naechste[1] if naechste else None,
                "verantwortlich": r.verantwortlich,
            }
        )
    data.sort(key=lambda d: (d["tage_rest"] if d["tage_rest"] is not None else 99999))
    columns = [
        {"fieldname": "ampel", "label": _("Ampel"), "fieldtype": "Data", "width": 60},
        {"fieldname": "servicefall", "label": _("Servicefall"), "fieldtype": "Link", "options": "PH Servicefall", "width": 150},
        {"fieldname": "kunde", "label": _("Kunde"), "fieldtype": "Data", "width": 150},
        {"fieldname": "produkt", "label": _("Produkt"), "fieldtype": "Data", "width": 160},
        {"fieldname": "marke", "label": _("Marke"), "fieldtype": "Link", "options": "PH Marke", "width": 110},
        {"fieldname": "kundentyp", "label": _("Kundentyp"), "fieldtype": "Data", "width": 100},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 110},
        {"fieldname": "uebergabe", "label": _("Übergabe"), "fieldtype": "Date", "width": 100},
        {"fieldname": "beweislast_bis", "label": _("Vermutung bis"), "fieldtype": "Date", "width": 110},
        {"fieldname": "gewaehrleistung_bis", "label": _("Gewährleistung bis"), "fieldtype": "Date", "width": 130},
        {"fieldname": "tage_rest", "label": _("Tage Rest"), "fieldtype": "Int", "width": 90},
        {"fieldname": "verjaehrung_bis", "label": _("Verjährung bis"), "fieldtype": "Date", "width": 110},
        {"fieldname": "garantie_bis", "label": _("Garantie bis"), "fieldtype": "Date", "width": 100},
        {"fieldname": "regress_frist_bis", "label": _("Regress bis"), "fieldtype": "Date", "width": 100},
        {"fieldname": "fristen_status", "label": _("Fristenstatus"), "fieldtype": "Data", "width": 170},
        {"fieldname": "naechste_frist", "label": _("Nächste Frist"), "fieldtype": "Data", "width": 110},
        {"fieldname": "naechste_am", "label": _("am"), "fieldtype": "Date", "width": 100},
        {"fieldname": "verantwortlich", "label": _("Verantwortlich"), "fieldtype": "Link", "options": "User", "width": 140},
    ]
    stufen = {"gruen": 0, "gelb": 0, "orange": 0, "rot": 0, "grau": 0}
    for d in data:
        stufen[d["ampel"]] = stufen.get(d["ampel"], 0) + 1
    chart = {"data": {"labels": [_("Vermutung"), _("Gewährleistung"), _("Verjährung/Garantie"), _("Abgelaufen")], "datasets": [{"name": _("Fälle"), "values": [stufen["gruen"], stufen["gelb"], stufen["orange"], stufen["rot"]]}]}, "type": "bar", "colors": ["#b45309"]}
    summary = [
        {"value": len(data), "label": _("Fälle im Fenster ({0} Tage)").format(tage), "datatype": "Int"},
        {"value": stufen["rot"], "label": _("Abgelaufen"), "datatype": "Int", "indicator": "Red"},
        {"value": stufen["gelb"] + stufen["orange"], "label": _("Beweislast beim Kunden"), "datatype": "Int", "indicator": "Orange"},
    ]
    return columns, data, None, chart, summary
