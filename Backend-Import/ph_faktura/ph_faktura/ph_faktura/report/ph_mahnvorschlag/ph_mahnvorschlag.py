"""PH Mahnvorschlag – was der Mahnlauf zum Stichtag anlegen würde (ohne Änderungen), plus Mahnstufen-Verteilung."""

import frappe
from frappe import _
from frappe.utils import cint

from ph_faktura.ph_faktura.tasks import mahnlauf


def execute(filters=None):
    f = frappe._dict(filters or {})
    rows = mahnlauf(stichtag=f.get("stichtag"), nur_vorschlag=True)
    data = []
    for r in rows:
        re = frappe.db.get_value("PH Rechnung", r["rechnung"], ["kunde_name", "kontakt", "faellig", "mahnstufe", "letzte_mahnung"], as_dict=True) or {}
        data.append({"rechnung": r["rechnung"], "kunde_name": re.get("kunde_name"), "kontakt": re.get("kontakt"), "faellig": re.get("faellig"), "verzugstage": r["verzugstage"], "offen": cint(r["offen_cent"]) / 100, "bisher": re.get("mahnstufe"), "letzte_mahnung": re.get("letzte_mahnung"), "stufe": r["stufe"]})
    columns = [
        {"fieldname": "rechnung", "label": _("Rechnung"), "fieldtype": "Link", "options": "PH Rechnung", "width": 140},
        {"fieldname": "kunde_name", "label": _("Kunde"), "fieldtype": "Data", "width": 180},
        {"fieldname": "kontakt", "label": _("Kontakt"), "fieldtype": "Link", "options": "PH Kontakt", "width": 110},
        {"fieldname": "faellig", "label": _("Fällig"), "fieldtype": "Date", "width": 95},
        {"fieldname": "verzugstage", "label": _("Verzugstage"), "fieldtype": "Int", "width": 100},
        {"fieldname": "offen", "label": _("Offen €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "bisher", "label": _("Bisherige Stufe"), "fieldtype": "Int", "width": 110},
        {"fieldname": "letzte_mahnung", "label": _("Letzte Mahnung"), "fieldtype": "Date", "width": 110},
        {"fieldname": "stufe", "label": _("Nächste Stufe"), "fieldtype": "Int", "width": 100},
    ]
    verteilung = {s: 0 for s in (1, 2, 3)}
    for d in data:
        verteilung[d["stufe"]] = verteilung.get(d["stufe"], 0) + 1
    chart = {"data": {"labels": [_("Stufe {0}").format(s) for s in (1, 2, 3)], "datasets": [{"name": _("Rechnungen"), "values": [verteilung[s] for s in (1, 2, 3)]}]}, "type": "bar", "colors": ["#b91c1c"]}
    summary = [{"value": len(data), "label": _("Zu mahnen"), "datatype": "Int", "indicator": "Orange" if data else "Green"}, {"value": sum(d["offen"] for d in data), "label": _("Summe offen"), "datatype": "Currency"}]
    return columns, data, None, chart, summary
