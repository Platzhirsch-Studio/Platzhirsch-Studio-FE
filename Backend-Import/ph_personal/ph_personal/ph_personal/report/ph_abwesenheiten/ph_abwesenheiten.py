"""Script Report: Urlaubskonto und Abwesenheiten je Mitarbeiter und Jahr – Anspruch, genommen, beantragt,
Rest, Krankenstandstage, sonstige Abwesenheiten (Arbeitstage). Selbstservice sieht nur den eigenen Datensatz."""

import frappe
from frappe import _
from frappe.utils import getdate, nowdate

from ph_personal.ph_personal.doctype.ph_abwesenheit.ph_abwesenheit import urlaubskonto


def execute(filters=None):
    filters = frappe._dict(filters or {})
    jahr = int(filters.get("jahr") or getdate(nowdate()).year)
    bedingungen = {"status": ("!=", "Ausgetreten")} if not filters.get("mit_ausgetretenen") else {}
    if filters.get("mitarbeiter"):
        bedingungen["name"] = filters["mitarbeiter"]
    mitarbeiter = frappe.get_list("PH Mitarbeiter", filters=bedingungen, fields=["name", "titel", "rolle_intern"], order_by="nachname asc")

    from ph_personal.ph_personal.doctype.ph_abwesenheit.ph_abwesenheit import darf_art_sehen

    voll = darf_art_sehen()  # Krankenstand nur Leitung/GF (Art. 9 DSGVO)
    data = []
    for ma in mitarbeiter:
        k = urlaubskonto(ma.name, jahr)
        rows = frappe.get_all(
            "PH Abwesenheit",
            filters={"mitarbeiter": ma.name, "status": "Genehmigt", "von": ("between", [f"{jahr}-01-01", f"{jahr}-12-31"])},
            fields=["art", "tage"],
        )
        krank = None
        if voll and frappe.db.exists("DocType", "PH Krankmeldung"):
            krank = sum(float(k.tage or 0) for k in frappe.get_all("PH Krankmeldung", filters={"mitarbeiter": ma.name, "status": ("in", ["Gemeldet", "Bestaetigt", "Beendet"]), "von": ("between", [f"{jahr}-01-01", f"{jahr}-12-31"])}, fields=["tage"]))
        za = sum(float(r.tage or 0) for r in rows if r.art == "Zeitausgleich")
        sonstige = sum(float(r.tage or 0) for r in rows if r.art not in ("Urlaub", "Krankenstand", "Zeitausgleich"))
        data.append(
            {
                "mitarbeiter": ma.name,
                "name_text": ma.titel,
                "rolle": ma.rolle_intern,
                "anspruch": k["anspruch"],
                "genommen": k["genommen"],
                "beantragt": k["beantragt"],
                "rest": k["rest"],
                "krank": krank,
                "zeitausgleich": za,
                "sonstige": sonstige,
            }
        )

    columns = [
        {"fieldname": "mitarbeiter", "label": _("Mitarbeiter"), "fieldtype": "Link", "options": "PH Mitarbeiter", "width": 110},
        {"fieldname": "name_text", "label": _("Name"), "fieldtype": "Data", "width": 180},
        {"fieldname": "rolle", "label": _("Rolle"), "fieldtype": "Data", "width": 110},
        {"fieldname": "anspruch", "label": _("Urlaub Anspruch"), "fieldtype": "Float", "width": 120},
        {"fieldname": "genommen", "label": _("Genommen"), "fieldtype": "Float", "width": 100},
        {"fieldname": "beantragt", "label": _("Beantragt"), "fieldtype": "Float", "width": 100},
        {"fieldname": "rest", "label": _("Rest"), "fieldtype": "Float", "width": 90},
        {"fieldname": "krank", "label": _("Krankenstand (Tage)"), "fieldtype": "Float", "width": 150},
        {"fieldname": "zeitausgleich", "label": _("Zeitausgleich (Tage)"), "fieldtype": "Float", "width": 150},
        {"fieldname": "sonstige", "label": _("Sonstige (Tage)"), "fieldtype": "Float", "width": 120},
    ]
    chart = {
        "data": {
            "labels": [d["name_text"] for d in data],
            "datasets": [
                {"name": _("Genommen"), "values": [d["genommen"] for d in data]},
                {"name": _("Beantragt"), "values": [d["beantragt"] for d in data]},
                {"name": _("Rest"), "values": [max(0.0, d["rest"]) for d in data]},
            ],
        },
        "type": "bar",
        "barOptions": {"stacked": 1},
        "colors": ["#15803d", "#b45309", "#d9d4cc"],
    }
    summary = [
        {"value": round(sum(d["genommen"] for d in data), 1), "label": _("Urlaub genommen"), "datatype": "Float", "indicator": "Green"},
        {"value": round(sum(d["rest"] for d in data), 1), "label": _("Resturlaub gesamt"), "datatype": "Float"},
        {"value": round(sum(d["krank"] or 0 for d in data), 1) if voll else "–", "label": _("Krankenstandstage"), "datatype": "Float" if voll else "Data", "indicator": "Red"},
    ]
    message = _("Tage nach Arbeitszeitmodell ohne gesetzliche Feiertage. Anspruch des Urlaubsjahres nach UrlG; Rest = alle unverjährten Urlaubsjahre (Verjährung 2 Jahre nach Ende des Urlaubsjahres, § 4 Abs 5 UrlG). Resturlaub aus dem Vorsystem als Korrektur am PH Urlaubsanspruch erfassen.")
    return columns, data, message, chart, summary
