"""Script Report „PH Vertriebscockpit“ (SHD marahobjekt → Vertriebscockpit):
Trichter Anfragen → Termine → Beratungsgespräche → Angebote → Aufträge je Intervall, mit Umsatz,
offenen Angeboten und Anzahlungsstand aus ph_faktura, sofern installiert (sonst 0 und Hinweis).
"""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate

INTERVALLE = {"Monat": "%Y-%m", "Woche": "%Y-W%V", "Quartal": None}


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -12))
    bis = getdate(filters.get("bis") or nowdate())
    intervall = filters.get("intervall") or "Monat"
    berater = filters.get("berater")

    faktura = frappe.db.exists("DocType", "PH Angebot") and frappe.db.exists("DocType", "PH Auftragsbestaetigung")
    zeilen = {}

    def eintrag(datum):
        k = periode(datum, intervall)
        return zeilen.setdefault(k, {"periode": k, "anfragen": 0, "qualifiziert": 0, "termine": 0, "gespraeche": 0, "angebote": 0, "angebote_offen_cent": 0, "auftraege": 0, "umsatz_cent": 0, "anzahlung_offen_cent": 0, "gewonnen": 0, "verloren": 0})

    f_anf = {"eingang": ("between", [von, bis]), "status": ("!=", "Spam")}
    if berater:
        f_anf["zugewiesen_an"] = berater
    for a in frappe.get_all("PH Anfrage", filters=f_anf, fields=["eingang", "status"]):
        z = eintrag(a.eingang)
        z["anfragen"] += 1
        if a.status != "Neu":
            z["qualifiziert"] += 1
        if a.status == "Gewonnen":
            z["gewonnen"] += 1
        elif a.status == "Verloren":
            z["verloren"] += 1

    f_ter = {"start": ("between", [von, bis]), "status": ("in", ["Bestaetigt", "Erledigt", "Nicht erschienen"])}
    if berater:
        f_ter["berater"] = berater
    for t in frappe.get_all("PH Termin", filters=f_ter, fields=["start"]):
        eintrag(t.start)["termine"] += 1

    f_bg = {"datum": ("between", [von, bis])}
    if berater:
        f_bg["berater"] = berater
    for g in frappe.get_all("PH Beratungsgespraech", filters=f_bg, fields=["datum"]):
        eintrag(g.datum)["gespraeche"] += 1

    hinweis = None
    if faktura:
        ang_meta = frappe.get_meta("PH Angebot")
        datum_feld = "datum" if ang_meta.has_field("datum") else "creation"
        betrag_feld = "gesamt_cent" if ang_meta.has_field("gesamt_cent") else None
        felder = [datum_feld, "status"] + ([betrag_feld] if betrag_feld else [])
        for a in frappe.get_all("PH Angebot", filters={datum_feld: ("between", [von, bis]), "docstatus": ("<", 2)}, fields=felder):
            z = eintrag(a.get(datum_feld))
            z["angebote"] += 1
            if betrag_feld and a.status not in ("Angenommen", "Abgelehnt", "Abgelaufen", "Storniert"):
                z["angebote_offen_cent"] += int(a.get(betrag_feld) or 0)
        ab_meta = frappe.get_meta("PH Auftragsbestaetigung")
        ab_datum = "datum" if ab_meta.has_field("datum") else "creation"
        ab_betrag = "gesamt_cent" if ab_meta.has_field("gesamt_cent") else None
        ab_anz_soll = "anzahlung_soll_cent" if ab_meta.has_field("anzahlung_soll_cent") else None
        ab_anz_ist = "anzahlung_ist_cent" if ab_meta.has_field("anzahlung_ist_cent") else None
        felder = [ab_datum] + [f for f in (ab_betrag, ab_anz_soll, ab_anz_ist) if f]
        for ab in frappe.get_all("PH Auftragsbestaetigung", filters={ab_datum: ("between", [von, bis]), "docstatus": ("<", 2)}, fields=felder):
            z = eintrag(ab.get(ab_datum))
            z["auftraege"] += 1
            if ab_betrag:
                z["umsatz_cent"] += int(ab.get(ab_betrag) or 0)
            if ab_anz_soll and ab_anz_ist:
                z["anzahlung_offen_cent"] += max(0, int(ab.get(ab_anz_soll) or 0) - int(ab.get(ab_anz_ist) or 0))
    else:
        hinweis = _("ph_faktura ist nicht installiert – Angebote, Aufträge und Umsatz werden nach der Installation automatisch ergänzt.")

    data = sorted(zeilen.values(), key=lambda x: x["periode"])
    for z in data:
        z["quote_termin"] = round(100 * z["termine"] / z["anfragen"], 1) if z["anfragen"] else 0
        z["quote_auftrag"] = round(100 * z["auftraege"] / z["anfragen"], 1) if z["anfragen"] else 0

    columns = [
        {"fieldname": "periode", "label": _("Periode"), "fieldtype": "Data", "width": 110},
        {"fieldname": "anfragen", "label": _("Anfragen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "qualifiziert", "label": _("Bearbeitet"), "fieldtype": "Int", "width": 90},
        {"fieldname": "termine", "label": _("Termine"), "fieldtype": "Int", "width": 80},
        {"fieldname": "gespraeche", "label": _("Gespräche"), "fieldtype": "Int", "width": 90},
        {"fieldname": "angebote", "label": _("Angebote"), "fieldtype": "Int", "width": 90},
        {"fieldname": "angebote_offen_cent", "label": _("Offene Angebote €"), "fieldtype": "Int", "width": 140},
        {"fieldname": "auftraege", "label": _("Aufträge"), "fieldtype": "Int", "width": 90},
        {"fieldname": "umsatz_cent", "label": _("Auftragswert €"), "fieldtype": "Int", "width": 130},
        {"fieldname": "anzahlung_offen_cent", "label": _("Anzahlung offen €"), "fieldtype": "Int", "width": 140},
        {"fieldname": "gewonnen", "label": _("Gewonnen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "verloren", "label": _("Verloren"), "fieldtype": "Int", "width": 90},
        {"fieldname": "quote_termin", "label": _("Termin-Quote %"), "fieldtype": "Percent", "width": 110},
        {"fieldname": "quote_auftrag", "label": _("Auftrags-Quote %"), "fieldtype": "Percent", "width": 120},
    ]
    chart = {
        "data": {
            "labels": [z["periode"] for z in data],
            "datasets": [
                {"name": _("Anfragen"), "values": [z["anfragen"] for z in data]},
                {"name": _("Termine"), "values": [z["termine"] for z in data]},
                {"name": _("Angebote"), "values": [z["angebote"] for z in data]},
                {"name": _("Aufträge"), "values": [z["auftraege"] for z in data]},
            ],
        },
        "type": "bar",
        "colors": ["#30373e", "#1d4ed8", "#b45309", "#15803d"],
    }
    gesamt = {k: sum(z[k] for z in data) for k in ("anfragen", "termine", "angebote", "auftraege", "umsatz_cent", "angebote_offen_cent", "anzahlung_offen_cent")}
    summary = [
        {"value": gesamt["anfragen"], "label": _("Anfragen"), "datatype": "Int"},
        {"value": gesamt["termine"], "label": _("Termine"), "datatype": "Int", "indicator": "Blue"},
        {"value": gesamt["auftraege"], "label": _("Aufträge"), "datatype": "Int", "indicator": "Green"},
        {"value": gesamt["umsatz_cent"] / 100, "label": _("Auftragswert"), "datatype": "Currency", "currency": "EUR"},
        {"value": gesamt["angebote_offen_cent"] / 100, "label": _("Offene Angebote"), "datatype": "Currency", "currency": "EUR", "indicator": "Orange"},
        {"value": gesamt["anzahlung_offen_cent"] / 100, "label": _("Anzahlungen offen"), "datatype": "Currency", "currency": "EUR", "indicator": "Red"},
    ]
    return columns, data, hinweis, chart, summary


def periode(datum, intervall):
    d = getdate(datum)
    if intervall == "Quartal":
        return f"{d.year}-Q{(d.month - 1) // 3 + 1}"
    if intervall == "Woche":
        iso = d.isocalendar()
        return f"{iso[0]}-W{iso[1]:02d}"
    return d.strftime("%Y-%m")
