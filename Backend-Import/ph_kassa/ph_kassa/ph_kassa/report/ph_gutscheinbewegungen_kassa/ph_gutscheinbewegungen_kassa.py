"""PH Gutscheinbewegungen Kassa – Verkäufe (Position „Gutschein Verkauf“) und Einlösungen (Zahlart „Gutschein“) über die Kassa."""

from frappe import _

from ph_kassa.auswertung import belege_zeitraum, zeitraum_filter


def execute(filters=None):
    filters, von, bis = zeitraum_filter(filters)
    data = []
    for b in belege_zeitraum(von, bis, filters.get("kasse")):
        for p in b["positionen"]:
            if p.get("art") == "Gutschein Verkauf":
                data.append({"datum": b["datum"], "beleg": b["name"], "bewegung": _("Verkauf"), "gutschein": None, "betrag_cent": int(p.get("brutto_cent") or 0), "steuersatz": p.get("steuersatz"), "kontakt": b.get("kontakt"), "bediener": b.get("bediener")})
        for z in b["zahlarten"]:
            if z.get("zahlart") == "Gutschein":
                data.append({"datum": b["datum"], "beleg": b["name"], "bewegung": _("Einlösung"), "gutschein": z.get("gutschein"), "betrag_cent": -int(z.get("betrag_cent") or 0), "steuersatz": None, "kontakt": b.get("kontakt"), "bediener": b.get("bediener")})
    columns = [
        {"fieldname": "datum", "label": _("Tag"), "fieldtype": "Date", "width": 100},
        {"fieldname": "beleg", "label": _("Beleg"), "fieldtype": "Link", "options": "PH Kassenbeleg", "width": 160},
        {"fieldname": "bewegung", "label": _("Bewegung"), "fieldtype": "Data", "width": 100},
        {"fieldname": "gutschein", "label": _("Gutschein"), "fieldtype": "Link", "options": "PH Gutschein", "width": 160},
        {"fieldname": "betrag_cent", "label": _("Betrag (Cent, Einlösung negativ)"), "fieldtype": "Int", "width": 200},
        {"fieldname": "steuersatz", "label": _("Steuersatz"), "fieldtype": "Data", "width": 110},
        {"fieldname": "kontakt", "label": _("Kunde"), "fieldtype": "Link", "options": "PH Kontakt", "width": 150},
        {"fieldname": "bediener", "label": _("Bedienung"), "fieldtype": "Link", "options": "User", "width": 140},
    ]
    verkauf = sum(d["betrag_cent"] for d in data if d["betrag_cent"] > 0)
    einl = -sum(d["betrag_cent"] for d in data if d["betrag_cent"] < 0)
    chart = {"data": {"labels": [_("Verkauf"), _("Einlösung")], "datasets": [{"name": "€", "values": [verkauf / 100, einl / 100]}]}, "type": "bar", "colors": ["#8a7a66"]}
    summary = [{"value": verkauf / 100, "label": _("Verkauft €"), "datatype": "Currency", "currency": "EUR"}, {"value": einl / 100, "label": _("Eingelöst €"), "datatype": "Currency", "currency": "EUR"}]
    return columns, data, _("Gesamtbestand/Verbindlichkeit: ph_shop Report „PH Gutschein-Bestand“."), chart, summary
