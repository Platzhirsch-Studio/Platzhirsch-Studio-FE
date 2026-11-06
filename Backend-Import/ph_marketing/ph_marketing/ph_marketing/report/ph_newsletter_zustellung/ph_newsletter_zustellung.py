"""Script Report: Zustellung je Newsletter-Ausgabe aus dem Versandprotokoll (Resend-Ereignisse) – ohne Öffnungen/Klicks."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate

SPALTEN = ("zugestellt", "verzoegert", "bounce_weich", "bounce_hart", "beschwerde", "abgemeldet", "fehler", "uebersprungen")


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -12))
    bis = getdate(filters.get("bis") or nowdate())
    ausgaben = frappe.get_all("PH Newsletter Ausgabe", filters={"versendet_am": ("between", [von, bis])}, fields=["name", "titel", "versendet_am", "empfaenger_anzahl", "gesendet"], order_by="versendet_am desc")
    data = []
    for a in ausgaben:
        z = {r.status: r.n for r in frappe.get_all("PH Newsletter Versand", filters={"ausgabe": a.name}, fields=["status", "count(name) as n"], group_by="status")}
        gesendet = a.gesendet or 0
        bounces = z.get("bounce_weich", 0) + z.get("bounce_hart", 0) + z.get("bounce", 0)
        zeile = {"ausgabe": a.name, "titel": a.titel, "versendet_am": a.versendet_am, "empfaenger": a.empfaenger_anzahl, "gesendet": gesendet}
        for s in SPALTEN:
            zeile[s] = z.get(s, 0)
        zeile["bounce_hart"] += z.get("bounce", 0)  # Altbestand „bounce“
        zeile["bounce_quote"] = round(100 * bounces / gesendet, 2) if gesendet else 0
        zeile["abmelde_quote"] = round(100 * z.get("abgemeldet", 0) / gesendet, 2) if gesendet else 0
        data.append(zeile)
    columns = [
        {"fieldname": "ausgabe", "label": _("Ausgabe"), "fieldtype": "Link", "options": "PH Newsletter Ausgabe", "width": 130},
        {"fieldname": "titel", "label": _("Titel"), "fieldtype": "Data", "width": 220},
        {"fieldname": "versendet_am", "label": _("Versendet"), "fieldtype": "Datetime", "width": 140},
        {"fieldname": "empfaenger", "label": _("Empfänger"), "fieldtype": "Int", "width": 90},
        {"fieldname": "gesendet", "label": _("Gesendet"), "fieldtype": "Int", "width": 90},
        {"fieldname": "zugestellt", "label": _("Zugestellt"), "fieldtype": "Int", "width": 90},
        {"fieldname": "verzoegert", "label": _("Verzögert"), "fieldtype": "Int", "width": 90},
        {"fieldname": "bounce_weich", "label": _("Bounce weich"), "fieldtype": "Int", "width": 100},
        {"fieldname": "bounce_hart", "label": _("Bounce hart"), "fieldtype": "Int", "width": 100},
        {"fieldname": "beschwerde", "label": _("Beschwerden"), "fieldtype": "Int", "width": 100},
        {"fieldname": "abgemeldet", "label": _("Abgemeldet"), "fieldtype": "Int", "width": 100},
        {"fieldname": "fehler", "label": _("Fehler"), "fieldtype": "Int", "width": 80},
        {"fieldname": "uebersprungen", "label": _("Übersprungen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "bounce_quote", "label": _("Bounce %"), "fieldtype": "Percent", "width": 90},
        {"fieldname": "abmelde_quote", "label": _("Abmelde %"), "fieldtype": "Percent", "width": 90},
    ]
    chart = {"data": {"labels": [d["titel"][:20] for d in data[:12]], "datasets": [{"name": _("Zugestellt"), "values": [d["zugestellt"] for d in data[:12]]}, {"name": _("Bounces"), "values": [d["bounce_weich"] + d["bounce_hart"] for d in data[:12]]}, {"name": _("Abgemeldet"), "values": [d["abgemeldet"] for d in data[:12]]}]}, "type": "bar", "colors": ["#15803d", "#b45309", "#8a7a66"]}
    hinweis = _("Keine Öffnungs- oder Klickmessung (kein Tracking-Pixel). Zustellstatus erst mit aktivem Resend-Webhook.")
    return columns, data, hinweis, chart
