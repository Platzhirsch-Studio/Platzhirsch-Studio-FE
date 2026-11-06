"""Script Report „PH Projektstunden“ (Nachtrag Nr. 57): Anwesenheitszeit mit Bezug auf Projekt/Auftrag je
Tätigkeit und Mitarbeiter für die Nachkalkulation. Buchungen ohne Dynamic Link fallen auf den Freitext
projekt_referenz zurück (Altdaten). Netto-Minuten der Buchung (ohne Pause); Stundensätze/Kosten nicht hier
(ph_projekte PH Projektzeit bzw. Faktura)."""

import frappe
from frappe import _


def execute(filters=None):
    f = frappe._dict(filters or {})
    bedingungen = {"datum": ("between", [f.von, f.bis]), "status": ("!=", "Offen")}
    for feld in ("projekt_doctype", "taetigkeit", "mitarbeiter"):
        if f.get(feld):
            bedingungen[feld] = f[feld]
    if f.get("projekt"):
        bedingungen["projekt"] = f.projekt
    rows = frappe.get_list(
        "PH Zeiterfassung",
        filters=bedingungen,
        fields=["projekt_doctype", "projekt", "projekt_referenz", "taetigkeit", "art", "mitarbeiter", "mitarbeiter_name", "dauer_min", "datum"],
    )
    gruppe = f.get("gruppierung") or "Projekt, Tätigkeit, Mitarbeiter"
    mit_t = "Tätigkeit" in gruppe
    mit_m = "Mitarbeiter" in gruppe
    summen = {}
    for r in rows:
        bezug = r.projekt or r.projekt_referenz
        if not bezug:
            continue
        schluessel = (r.projekt_doctype if r.projekt else _("Freitext"), bezug, (r.taetigkeit or r.art or "") if mit_t else "", r.mitarbeiter if mit_m else "")
        s = summen.setdefault(schluessel, {"minuten": 0, "buchungen": 0, "tage": set(), "name": r.mitarbeiter_name if mit_m else ""})
        s["minuten"] += int(r.dauer_min or 0)
        s["buchungen"] += 1
        s["tage"].add(str(r.datum))
    data = [
        {"bezug_art": k[0], "bezug": k[1], "taetigkeit": k[2], "mitarbeiter": k[3] or None, "name_text": v["name"], "stunden": round(v["minuten"] / 60, 2), "buchungen": v["buchungen"], "tage": len(v["tage"])}
        for k, v in sorted(summen.items(), key=lambda x: (x[0][1], x[0][2], x[0][3]))
    ]
    ohne = sum(int(r.dauer_min or 0) for r in rows if not (r.projekt or r.projekt_referenz))
    columns = [
        {"fieldname": "bezug_art", "label": _("Bezug (Art)"), "fieldtype": "Data", "width": 150},
        {"fieldname": "bezug", "label": _("Projekt / Auftrag"), "fieldtype": "Data", "width": 160},
        {"fieldname": "taetigkeit", "label": _("Tätigkeit"), "fieldtype": "Data", "width": 110},
        {"fieldname": "mitarbeiter", "label": _("Mitarbeiter"), "fieldtype": "Link", "options": "PH Mitarbeiter", "width": 110},
        {"fieldname": "name_text", "label": _("Name"), "fieldtype": "Data", "width": 160},
        {"fieldname": "stunden", "label": _("Stunden"), "fieldtype": "Float", "width": 90},
        {"fieldname": "buchungen", "label": _("Buchungen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "tage", "label": _("Tage"), "fieldtype": "Int", "width": 70},
    ]
    chart = {"data": {"labels": [d["bezug"] for d in data][:20], "datasets": [{"name": _("Stunden"), "values": [d["stunden"] for d in data][:20]}]}, "type": "bar", "colors": ["#8a7a66"]}
    message = _("Ohne Projektbezug im Zeitraum: {0} h (nicht in der Tabelle).").format(round(ohne / 60, 2))
    return columns, data, message, chart
