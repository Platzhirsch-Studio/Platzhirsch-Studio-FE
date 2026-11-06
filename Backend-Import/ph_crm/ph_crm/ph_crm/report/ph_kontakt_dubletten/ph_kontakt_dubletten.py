"""Script Report: mögliche Dubletten unter den Kontakten (E-Mail, Telefon normalisiert, Name + PLZ, Firma).
Je Zeile ein Paar mit Punkten und Gründen; Zusammenführen im Kontakt („Ähnliche Kontakte“, Leitung)."""

import frappe
from frappe import _

from ph_crm.ph_crm.dubletten import alle_paare


def execute(filters=None):
    filters = frappe._dict(filters or {})
    paare, kontakte = alle_paare(min_punkte=int(filters.get("min_punkte") or 30), limit=int(filters.get("limit") or 500))
    data = []
    for a, b, punkte, gruende in paare:
        ka, kb = kontakte[a], kontakte[b]
        # Ziel-Vorschlag: Kunde vor Interessent, dann jüngster Kontakt
        rang = {"Kunde": 3, "Interessent": 2, "Inaktiv": 1}
        ziel, quelle = (a, b) if (rang.get(ka.status, 0), str(ka.letzter_kontakt or "")) >= (rang.get(kb.status, 0), str(kb.letzter_kontakt or "")) else (b, a)
        data.append({"kontakt_a": a, "titel_a": ka.titel, "status_a": ka.status, "kontakt_b": b, "titel_b": kb.titel, "status_b": kb.status, "punkte": punkte, "gruende": ", ".join(gruende), "vorschlag_ziel": ziel, "vorschlag_quelle": quelle})
    summary = [{"value": len(data), "label": _("Paare"), "datatype": "Int"}, {"value": sum(1 for d in data if d["punkte"] >= 60), "label": _("wahrscheinlich"), "datatype": "Int", "indicator": "Red"}]
    return spalten(), data, _("Bestätigt verschiedene Kontakte („Keine Dublette“) erscheinen nicht mehr."), None, summary


def spalten():
    return [
        {"fieldname": "kontakt_a", "label": _("Kontakt A"), "fieldtype": "Link", "options": "PH Kontakt", "width": 120},
        {"fieldname": "titel_a", "label": _("Name A"), "fieldtype": "Data", "width": 180},
        {"fieldname": "status_a", "label": _("Status A"), "fieldtype": "Data", "width": 90},
        {"fieldname": "kontakt_b", "label": _("Kontakt B"), "fieldtype": "Link", "options": "PH Kontakt", "width": 120},
        {"fieldname": "titel_b", "label": _("Name B"), "fieldtype": "Data", "width": 180},
        {"fieldname": "status_b", "label": _("Status B"), "fieldtype": "Data", "width": 90},
        {"fieldname": "punkte", "label": _("Punkte"), "fieldtype": "Int", "width": 70},
        {"fieldname": "gruende", "label": _("Gründe"), "fieldtype": "Data", "width": 240},
        {"fieldname": "vorschlag_ziel", "label": _("Behalten (Vorschlag)"), "fieldtype": "Link", "options": "PH Kontakt", "width": 130},
        {"fieldname": "vorschlag_quelle", "label": _("Zusammenführen"), "fieldtype": "Link", "options": "PH Kontakt", "width": 130},
    ]
