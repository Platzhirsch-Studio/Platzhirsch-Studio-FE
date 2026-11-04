"""Script Report: Top-Seiten aus den Besucher-Einblicken (Tagesaggregate, nur zusammengefasste Werte)."""

import frappe
from frappe import _
from frappe.utils import add_days, getdate, nowdate

from ph_marketing.ph_marketing.einblicke import top_seiten


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_days(nowdate(), -30))
    bis = getdate(filters.get("bis") or nowdate())
    data = top_seiten(von, bis, limit=int(filters.get("limit") or 30))
    columns = [
        {"fieldname": "pfad", "label": _("Seite"), "fieldtype": "Data", "width": 320},
        {"fieldname": "besuche", "label": _("Besuche"), "fieldtype": "Int", "width": 100},
        {"fieldname": "tage", "label": _("Tage mit Daten"), "fieldtype": "Int", "width": 110},
        {"fieldname": "scroll", "label": _("Scrolltiefe Ø %"), "fieldtype": "Float", "width": 120},
        {"fieldname": "ziele", "label": _("Ziele (Termin/Anfrage)"), "fieldtype": "Int", "width": 150},
    ]
    chart = {"data": {"labels": [d["pfad"][:30] for d in data[:12]], "datasets": [{"name": _("Besuche"), "values": [d["besuche"] for d in data[:12]]}]}, "type": "bar", "colors": ["#30373e"]}
    tage = frappe.db.count("PH Einblick Tag", {"datum": ("between", [von, bis])})
    summary = [
        {"value": tage, "label": _("Tage empfangen"), "datatype": "Int"},
        {"value": sum(d["besuche"] for d in data), "label": _("Besuche (Top-Seiten)"), "datatype": "Int"},
    ]
    hinweis = None if tage else _("Noch keine Tagesaggregate – Website sendet erst mit EINBLICKE_FRAPPE_URL/KEY/SECRET (src/lib/einblicke/frappe.server.js).")
    return columns, data, hinweis, chart, summary
