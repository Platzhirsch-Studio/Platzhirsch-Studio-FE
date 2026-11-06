"""PH Nicht zugeordnete Eingangsrechnungen – ER ohne vollständige Kostenzuordnung (Projekt/Kostenart bzw. Gemeinkosten).
Grundlage der Projektnachkalkulation (ph_projekte/nachkalkulation.py): solange offen, fehlen Kosten im Projekt-Ist."""

import frappe
from frappe import _
from frappe.utils import cint


def execute(filters=None):
    filters = frappe._dict(filters or {})
    f = {"status": ("!=", "Abgelehnt"), "zuordnung_status": "Offen"}
    if filters.status:
        f["status"] = filters.status
    if filters.lieferant:
        f["lieferant"] = filters.lieferant
    if filters.von:
        f["datum"] = (">=", filters.von)
    columns = [
        {"fieldname": "name", "label": _("Eingangsrechnung"), "fieldtype": "Link", "options": "PH Eingangsrechnung", "width": 140},
        {"fieldname": "datum", "label": _("Datum"), "fieldtype": "Date", "width": 90},
        {"fieldname": "lieferant_name", "label": _("Lieferant"), "fieldtype": "Data", "width": 180},
        {"fieldname": "rechnungsnummer_lieferant", "label": _("Rechnungs-Nr."), "fieldtype": "Data", "width": 120},
        {"fieldname": "belegart", "label": _("Belegart"), "fieldtype": "Data", "width": 90},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 110},
        {"fieldname": "netto", "label": _("Netto"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "zugeordnet", "label": _("Zugeordnet"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "differenz", "label": _("Differenz"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "zuordnung_modus", "label": _("Modus"), "fieldtype": "Data", "width": 130},
        {"fieldname": "projekt", "label": _("Projekt (Kopf)"), "fieldtype": "Link", "options": "PH Projekt", "width": 130},
        {"fieldname": "herstellerbestellung", "label": _("Herstellerbestellung"), "fieldtype": "Link", "options": "PH Herstellerbestellung", "width": 130},
    ]
    data = []
    for r in frappe.get_all("PH Eingangsrechnung", filters=f, fields=["name", "datum", "lieferant_name", "rechnungsnummer_lieferant", "belegart", "status", "netto_cent",
                                                                  "zuordnung_summe_cent", "zuordnung_modus", "projekt", "herstellerbestellung"], order_by="datum asc", limit=1000):
        vz = -1 if r.belegart == "Gutschrift" else 1
        data.append({**r, "netto": vz * cint(r.netto_cent) / 100, "zugeordnet": vz * cint(r.zuordnung_summe_cent) / 100,
                     "differenz": vz * (cint(r.netto_cent) - cint(r.zuordnung_summe_cent)) / 100, "status": _(r.status), "zuordnung_modus": _(r.zuordnung_modus) if r.zuordnung_modus else "–"})
    summary = [{"label": _("Offen"), "value": len(data), "datatype": "Int", "indicator": "Orange"},
               {"label": _("Netto nicht zugeordnet"), "value": sum(d["differenz"] for d in data), "datatype": "Currency", "indicator": "Red"}]
    return columns, data, _("Freigabe verlangt eine vollständige Zuordnung (Projekt + Kostenart, aliquot oder Gemeinkosten)."), None, summary
