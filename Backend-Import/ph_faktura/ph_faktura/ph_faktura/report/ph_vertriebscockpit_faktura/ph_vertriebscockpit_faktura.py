"""PH Vertriebscockpit Faktura – je Monat: Angebote (Anzahl/Summe), Angebotsquote, Auftragseingang, Umsatz (zahlbar),
Anzahlungen vereinnahmt, Liefertermine; Reklamationsquote aus ph_service (PH Servicefall), wenn installiert."""

import frappe
from frappe import _
from frappe.utils import add_days, cint, getdate, nowdate


def monat(d):
    d = getdate(d)
    return f"{d.year}-{d.month:02d}"


def execute(filters=None):
    f = frappe._dict(filters or {})
    von, bis = getdate(f.von), getdate(f.bis)
    m = {}

    def z(key):
        return m.setdefault(key, {"monat": key, "angebote": 0, "angebote_summe": 0, "angenommen": 0, "auftraege": 0, "auftragseingang": 0, "rechnungen": 0, "umsatz": 0, "gutschriften": 0, "anzahlungen": 0, "liefertermine": 0})

    for a in frappe.get_all("PH Angebot", filters={"datum": ("between", [von, bis]), "status": ("!=", "Ersetzt")}, fields=["datum", "brutto_cent", "status"]):
        e = z(monat(a.datum))
        e["angebote"] += 1
        e["angebote_summe"] += cint(a.brutto_cent)
        if a.status == "Angenommen":
            e["angenommen"] += 1
    for ab in frappe.get_all("PH Auftragsbestaetigung", filters={"datum": ("between", [von, bis]), "status": ("!=", "Storniert")}, fields=["datum", "auftragswert_cent"]):
        e = z(monat(ab.datum))
        e["auftraege"] += 1
        e["auftragseingang"] += cint(ab.auftragswert_cent)
    for r in frappe.get_all("PH Rechnung", filters={"docstatus": 1, "status": ("!=", "Storniert"), "art": ("!=", "Anzahlungsrechnung"), "datum": ("between", [von, bis])}, fields=["datum", "zahlbar_cent"]):
        e = z(monat(r.datum))
        e["rechnungen"] += 1
        e["umsatz"] += cint(r.zahlbar_cent)
    for g in frappe.get_all("PH Gutschrift", filters={"docstatus": 1, "datum": ("between", [von, bis])}, fields=["datum", "brutto_cent"]):
        z(monat(g.datum))["gutschriften"] += cint(g.brutto_cent)
    for p in frappe.db.sql("""select z.datum, z.betrag_cent from `tabPH Rechnung Zahlung` z join `tabPH Rechnung` r on r.name = z.parent where r.docstatus = 1 and r.art = 'Anzahlungsrechnung' and z.datum between %s and %s""", (von, bis), as_dict=True):
        z(monat(p.datum))["anzahlungen"] += cint(p.betrag_cent)
    for ab in frappe.get_all("PH Auftragsbestaetigung", filters={"status": ("in", ("Offen", "In Bestellung", "Teilgeliefert")), "liefertermin_geplant": ("between", [von, bis])}, fields=["liefertermin_geplant"]):
        z(monat(ab.liefertermin_geplant))["liefertermine"] += 1

    data = []
    for key in sorted(m):
        e = m[key]
        data.append({**e, "angebote_summe": e["angebote_summe"] / 100, "auftragseingang": e["auftragseingang"] / 100, "umsatz": (e["umsatz"] - e["gutschriften"]) / 100, "gutschriften": e["gutschriften"] / 100, "anzahlungen": e["anzahlungen"] / 100,
                     "quote": round(100 * e["angenommen"] / e["angebote"], 1) if e["angebote"] else None})
    columns = [
        {"fieldname": "monat", "label": _("Monat"), "fieldtype": "Data", "width": 90},
        {"fieldname": "angebote", "label": _("Angebote"), "fieldtype": "Int", "width": 80},
        {"fieldname": "angebote_summe", "label": _("Angebotssumme €"), "fieldtype": "Currency", "width": 130},
        {"fieldname": "angenommen", "label": _("Angenommen"), "fieldtype": "Int", "width": 95},
        {"fieldname": "quote", "label": _("Angebotsquote %"), "fieldtype": "Percent", "width": 110},
        {"fieldname": "auftraege", "label": _("Aufträge"), "fieldtype": "Int", "width": 80},
        {"fieldname": "auftragseingang", "label": _("Auftragseingang €"), "fieldtype": "Currency", "width": 140},
        {"fieldname": "rechnungen", "label": _("Rechnungen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "umsatz", "label": _("Umsatz netto GU €"), "fieldtype": "Currency", "width": 140},
        {"fieldname": "anzahlungen", "label": _("Anzahlungen vereinnahmt €"), "fieldtype": "Currency", "width": 160},
        {"fieldname": "liefertermine", "label": _("Liefertermine (offen)"), "fieldtype": "Int", "width": 130},
    ]
    offene_angebote = frappe.db.count("PH Angebot", {"status": ("in", ("Entwurf", "Gesendet"))})
    liefer_30 = frappe.db.count("PH Auftragsbestaetigung", {"status": ("in", ("Offen", "In Bestellung", "Teilgeliefert")), "liefertermin_geplant": ("between", [nowdate(), add_days(nowdate(), 30)])})
    summary = [
        {"value": sum(d["auftragseingang"] for d in data), "label": _("Auftragseingang"), "datatype": "Currency"},
        {"value": sum(d["umsatz"] for d in data), "label": _("Umsatz"), "datatype": "Currency", "indicator": "Green"},
        {"value": offene_angebote, "label": _("Offene Angebote"), "datatype": "Int"},
        {"value": liefer_30, "label": _("Liefertermine 30 Tage"), "datatype": "Int", "indicator": "Orange"},
    ]
    if frappe.db.exists("DocType", "PH Servicefall"):
        try:
            rekl = frappe.db.count("PH Servicefall", {"creation": ("between", [von, bis])})
            auftr = sum(d["auftraege"] for d in data) or 1
            summary.append({"value": round(100 * rekl / auftr, 1), "label": _("Reklamationsquote %"), "datatype": "Percent", "indicator": "Red" if rekl / auftr > 0.1 else "Green"})
        except Exception:  # noqa: BLE001
            pass
    chart = {"data": {"labels": [d["monat"] for d in data], "datasets": [{"name": _("Auftragseingang"), "values": [d["auftragseingang"] for d in data]}, {"name": _("Umsatz"), "values": [d["umsatz"] for d in data]}, {"name": _("Anzahlungen"), "values": [d["anzahlungen"] for d in data]}]}, "type": "bar", "colors": ["#8a7a66", "#30373e", "#15803d"]}
    return columns, data, None, chart, summary
