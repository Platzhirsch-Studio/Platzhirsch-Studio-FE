"""PH Nummernluecken – prüft Rechnungs- und Gutschriftnummern auf Lücken/Doppel (§ 11 Abs 1 Z 3 lit b UStG)."""

import frappe
from frappe import _
from frappe.utils import cint

from ph_faktura.rechenwerk import nummern as N


def execute(filters=None):
    f = frappe._dict(filters or {})
    namen = frappe.get_all("PH Rechnung", filters={"docstatus": 1}, pluck="name") + frappe.get_all("PH Gutschrift", filters={"docstatus": 1}, pluck="name")
    namen += frappe.get_all("PH Mahnung", pluck="name") + frappe.get_all("PH Angebot", pluck="name") + frappe.get_all("PH Auftragsbestaetigung", pluck="name")
    erg = N.luecken(namen)
    data = []
    for (praefix, jahr), e in sorted(erg.items()):
        if f.get("jahr") and cint(f.jahr) != jahr:
            continue
        data.append({"serie": praefix, "jahr": jahr, "anzahl": e["anzahl"], "hoechste": N.formatiere(praefix, jahr, e["max"]), "fehlend_anzahl": len(e["fehlend"]), "fehlend": ", ".join(N.formatiere(praefix, jahr, x) for x in e["fehlend"][:50]) + (" …" if len(e["fehlend"]) > 50 else ""),
                     "doppelt": ", ".join(N.formatiere(praefix, jahr, x) for x in e["doppelt"]), "status": _("OK") if not e["fehlend"] and not e["doppelt"] else _("PRÜFEN"), "pflicht": praefix in ("RE", "GU")})
    entwuerfe = frappe.db.count("PH Rechnung", {"docstatus": 0}) + frappe.db.count("PH Gutschrift", {"docstatus": 0})
    columns = [
        {"fieldname": "serie", "label": _("Serie"), "fieldtype": "Data", "width": 70},
        {"fieldname": "jahr", "label": _("Jahr"), "fieldtype": "Int", "width": 70},
        {"fieldname": "anzahl", "label": _("Belege"), "fieldtype": "Int", "width": 80},
        {"fieldname": "hoechste", "label": _("Höchste Nummer"), "fieldtype": "Data", "width": 140},
        {"fieldname": "fehlend_anzahl", "label": _("Lücken"), "fieldtype": "Int", "width": 70},
        {"fieldname": "fehlend", "label": _("Fehlende Nummern"), "fieldtype": "Data", "width": 320},
        {"fieldname": "doppelt", "label": _("Doppelt"), "fieldtype": "Data", "width": 160},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 90},
        {"fieldname": "pflicht", "label": _("Lückenlos Pflicht"), "fieldtype": "Check", "width": 110},
    ]
    kritisch = [d for d in data if d["pflicht"] and d["status"] != _("OK")]
    message = _("Rechnungs- (RE) und Gutschriftnummern (GU) müssen je Jahr lückenlos sein. Entwürfe (ENTW-…) zählen nicht. Offene Entwürfe: {0}.").format(entwuerfe)
    summary = [{"value": len(kritisch), "label": _("Serien mit Befund (RE/GU)"), "datatype": "Int", "indicator": "Red" if kritisch else "Green"}, {"value": entwuerfe, "label": _("Entwürfe ohne Nummer"), "datatype": "Int"}]
    return columns, data, message, None, summary
