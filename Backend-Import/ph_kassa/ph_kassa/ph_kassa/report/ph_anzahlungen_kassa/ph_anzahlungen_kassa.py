"""PH Anzahlungen Kassa – Anzahlungen/Teil-/Schlusszahlungen über die Kassa je Beleg mit Auftrag/Rechnung (Abgleich ph_faktura PH Anzahlungsstand)."""

from frappe import _

from ph_kassa.auswertung import belege_zeitraum, zeitraum_filter

ARTEN = ("Anzahlung", "Teilzahlung", "Schlusszahlung")


def execute(filters=None):
    filters, von, bis = zeitraum_filter(filters)
    data = []
    for b in belege_zeitraum(von, bis, filters.get("kasse")):
        for p in b["positionen"]:
            if p.get("art") in ARTEN:
                data.append({"datum": b["datum"], "beleg": b["name"], "art": p["art"], "auftrag": b.get("auftrag") or p.get("bezug"), "rechnung": b.get("rechnung"), "kontakt": b.get("kontakt"), "steuersatz": p.get("steuersatz"), "brutto_cent": int(p.get("brutto_cent") or 0), "ust_cent": int(p.get("ust_cent") or 0), "zahlarten": ", ".join(z.get("zahlart") or "" for z in b["zahlarten"]), "bediener": b.get("bediener")})
    columns = [
        {"fieldname": "datum", "label": _("Tag"), "fieldtype": "Date", "width": 100},
        {"fieldname": "beleg", "label": _("Beleg"), "fieldtype": "Link", "options": "PH Kassenbeleg", "width": 160},
        {"fieldname": "art", "label": _("Art"), "fieldtype": "Data", "width": 110},
        {"fieldname": "auftrag", "label": _("Auftrag"), "fieldtype": "Link", "options": "PH Auftragsbestaetigung", "width": 150},
        {"fieldname": "rechnung", "label": _("Rechnung"), "fieldtype": "Link", "options": "PH Rechnung", "width": 140},
        {"fieldname": "kontakt", "label": _("Kunde"), "fieldtype": "Link", "options": "PH Kontakt", "width": 150},
        {"fieldname": "steuersatz", "label": _("Steuersatz"), "fieldtype": "Data", "width": 120},
        {"fieldname": "brutto_cent", "label": _("Brutto (Cent)"), "fieldtype": "Int", "width": 120},
        {"fieldname": "ust_cent", "label": _("USt (Cent)"), "fieldtype": "Int", "width": 110},
        {"fieldname": "zahlarten", "label": _("Zahlarten"), "fieldtype": "Data", "width": 160},
        {"fieldname": "bediener", "label": _("Bedienung"), "fieldtype": "Link", "options": "User", "width": 140},
    ]
    summe = sum(d["brutto_cent"] for d in data)
    summary = [{"value": summe / 100, "label": _("Anzahlungen €"), "datatype": "Currency", "currency": "EUR"}, {"value": len(data), "label": _("Positionen"), "datatype": "Int"}]
    return columns, data, _("USt auf Anzahlungen wird mit Vereinnahmung fällig (Ist-Versteuerung) – Zuordnung zur Anzahlungsrechnung macht ph_faktura."), None, summary
