"""PH Sync Fehler – Fehler/Konflikte der Microsoft-Abgleiche plus gestörte Postfächer, Kalender und Abos (ohne Inhalte)."""

import frappe
from frappe import _
from frappe.utils import add_days, getdate, nowdate


def execute(filters=None):
    f = frappe._dict(filters or {})
    von = getdate(f.von or add_days(nowdate(), -7))
    bis = getdate(f.bis or nowdate())
    columns = [
        {"fieldname": "zeitpunkt", "label": _("Zeitpunkt"), "fieldtype": "Datetime", "width": 160},
        {"fieldname": "quelle", "label": _("Quelle"), "fieldtype": "Data", "width": 120},
        {"fieldname": "bereich", "label": _("Bereich"), "fieldtype": "Data", "width": 90},
        {"fieldname": "aktion", "label": _("Aktion"), "fieldtype": "Data", "width": 180},
        {"fieldname": "ergebnis", "label": _("Ergebnis"), "fieldtype": "Data", "width": 90},
        {"fieldname": "referenz_doctype", "label": _("Bezug (DocType)"), "fieldtype": "Link", "options": "DocType", "width": 140},
        {"fieldname": "referenz_name", "label": _("Bezug"), "fieldtype": "Dynamic Link", "options": "referenz_doctype", "width": 160},
        {"fieldname": "benutzer", "label": _("Benutzer"), "fieldtype": "Link", "options": "User", "width": 160},
        {"fieldname": "meldung", "label": _("Meldung"), "fieldtype": "Data", "width": 320},
    ]
    filt = {"ergebnis": ("in", ["Fehler", "Konflikt", "Abgelehnt"] if f.mit_abgelehnt else ["Fehler", "Konflikt"]), "zeitpunkt": ("between", [f"{von} 00:00:00", f"{bis} 23:59:59"])}
    if f.bereich:
        filt["bereich"] = f.bereich
    data = [dict(r, quelle=_("Protokoll")) for r in frappe.get_all(
        "PH Sync Protokoll", filters=filt, fields=["zeitpunkt", "bereich", "aktion", "ergebnis", "referenz_doctype", "referenz_name", "benutzer", "meldung"],
        order_by="zeitpunkt desc", limit=2000)]
    for p in frappe.get_all("PH Postfach", filters={"status": "Fehler", "aktiv": 1}, fields=["name", "letzte_abholung", "letzter_fehler"]):
        data.append({"zeitpunkt": p.letzte_abholung, "quelle": _("Postfach"), "bereich": "Mail", "aktion": _("Abholung"), "ergebnis": "Fehler", "referenz_doctype": "PH Postfach", "referenz_name": p.name, "meldung": p.letzter_fehler})
    for z in frappe.get_all("PH Kalender Zuordnung", filters={"status": "Fehler", "aktiv": 1}, fields=["name", "user", "letzte_sync", "letzter_fehler"]):
        data.append({"zeitpunkt": z.letzte_sync, "quelle": _("Kalender"), "bereich": "Kalender", "aktion": _("Abgleich"), "ergebnis": "Fehler", "referenz_doctype": "PH Kalender Zuordnung", "referenz_name": z.name, "benutzer": z.user, "meldung": z.letzter_fehler})
    for a in frappe.get_all("PH Graph Abo", filters={"status": ("in", ["Fehler", "Abgelaufen"])}, fields=["name", "titel", "ablauf", "status", "letzter_fehler"]):
        data.append({"zeitpunkt": a.ablauf, "quelle": _("Webhook-Abo"), "bereich": "Abo", "aktion": a.titel, "ergebnis": a.status, "referenz_doctype": "PH Graph Abo", "referenz_name": a.name, "meldung": a.letzter_fehler})
    for v in frappe.get_all("PH Graph Verknuepfung", filters={"status": ("in", ["Konflikt", "Fehler"])}, fields=["name", "referenz_doctype", "referenz_name", "user", "letzte_sync", "letzter_fehler", "status"]):
        data.append({"zeitpunkt": v.letzte_sync, "quelle": _("Verknüpfung"), "bereich": "Kalender", "aktion": _("Outlook-Ereignis"), "ergebnis": v.status, "referenz_doctype": v.referenz_doctype, "referenz_name": v.referenz_name, "benutzer": v.user, "meldung": v.letzter_fehler})
    data.sort(key=lambda r: str(r.get("zeitpunkt") or ""), reverse=True)
    zaehler = {}
    for r in data:
        zaehler[r["bereich"]] = zaehler.get(r["bereich"], 0) + 1
    chart = {"data": {"labels": list(zaehler), "datasets": [{"name": _("Fehler/Konflikte"), "values": list(zaehler.values())}]}, "type": "bar", "colors": ["#b91c1c"]} if zaehler else None
    summary = [{"label": _("Einträge"), "value": len(data), "indicator": "Red" if data else "Green"}]
    return columns, data, None, chart, summary
