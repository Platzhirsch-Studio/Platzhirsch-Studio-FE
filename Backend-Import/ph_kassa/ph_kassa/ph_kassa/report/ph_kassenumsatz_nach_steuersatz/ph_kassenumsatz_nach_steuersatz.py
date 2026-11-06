"""PH Kassenumsatz nach Steuersatz – Zuarbeit UVA: steuerbarer Kassenumsatz je Satz, getrennt von Zahlungen auf
Rechnungen, Anzahlungen auf Anzahlungsrechnungen und Mehrzweck-Gutscheinverkauf (Fachkritik 21 F5/P6).

Die Abgrenzung kommt aus ph_faktura.rechenwerk.uva (gleiche Regel wie PH UVA Auswertung – eine Quelle der Wahrheit).
"""

from frappe import _

from ph_kassa.auswertung import belege_zeitraum, zeitraum_filter

SATZ_NAME = {2000: "20 %", 1000: "10 %", 1300: "13 %", 1900: "19 %", 0: "0 % / steuerfrei"}


def _ar_belege():
    try:
        from ph_faktura.ph_faktura.doctype.ph_uva_auswertung.ph_uva_auswertung import ar_kassenbelege

        return ar_kassenbelege()
    except Exception:  # noqa: BLE001 – ph_faktura älter/fehlt: nur Beleg-eigene Bezüge
        return set()


def execute(filters=None):
    from ph_faktura.rechenwerk import uva

    filters, von, bis = zeitraum_filter(filters)
    nach_monat = filters.get("nach") == "Monat und Steuersatz"
    ar = _ar_belege()
    gruppen = {}
    for b in belege_zeitraum(von, bis, filters.get("kasse")):
        gruppen.setdefault(b["datum"].strftime("%Y-%m") if nach_monat else "", []).append(b)
    data = []
    for monat, belege in sorted(gruppen.items()):
        k = uva.kassa_umsaetze(belege, ar)
        for satz, w in sorted(k["je_satz"].items(), key=lambda x: -x[0]):
            data.append({"monat": monat, "art": _("Umsatz (UVA)"), "steuersatz": SATZ_NAME.get(satz, f"{satz / 100:g} %"), "promille": satz, "anzahl": w["anzahl"], "netto_cent": w["netto_cent"], "ust_cent": w["ust_cent"], "brutto_cent": w["brutto_cent"]})
        if k["anzahlungen_ist"]["brutto_cent"]:
            data.append({"monat": monat, "art": _("davon Anzahlungen ohne Anzahlungsrechnung (Ist)"), "steuersatz": "", "brutto_cent": k["anzahlungen_ist"]["brutto_cent"], "ust_cent": k["anzahlungen_ist"]["ust_cent"]})
        for grund, brutto in k["nicht_umsatz"].items():
            data.append({"monat": monat, "art": _("kein Kassenumsatz: {0}").format(uva.GRUENDE.get(grund, grund)), "steuersatz": "", "brutto_cent": brutto})
    columns = ([{"fieldname": "monat", "label": _("Monat"), "fieldtype": "Data", "width": 90}] if nach_monat else []) + [
        {"fieldname": "art", "label": _("Art"), "fieldtype": "Data", "width": 330},
        {"fieldname": "steuersatz", "label": _("Steuersatz"), "fieldtype": "Data", "width": 120},
        {"fieldname": "promille", "label": _("Satz ×100"), "fieldtype": "Int", "width": 90},
        {"fieldname": "anzahl", "label": _("Positionen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "netto_cent", "label": _("Netto (Cent)"), "fieldtype": "Int", "width": 130},
        {"fieldname": "ust_cent", "label": _("USt (Cent)"), "fieldtype": "Int", "width": 120},
        {"fieldname": "brutto_cent", "label": _("Brutto (Cent)"), "fieldtype": "Int", "width": 130},
    ]
    umsatz = [d for d in data if d.get("anzahl")]
    chart = {"data": {"labels": [f"{d['monat']} {d['steuersatz']}".strip() for d in umsatz], "datasets": [{"name": _("Netto"), "values": [d["netto_cent"] / 100 for d in umsatz]}, {"name": _("USt"), "values": [d["ust_cent"] / 100 for d in umsatz]}]}, "type": "bar", "colors": ["#30373e", "#8a7a66"]}
    summary = [
        {"value": sum(d["netto_cent"] for d in umsatz) / 100, "label": _("Netto Umsatz €"), "datatype": "Currency", "currency": "EUR"},
        {"value": sum(d["ust_cent"] for d in umsatz) / 100, "label": _("USt €"), "datatype": "Currency", "currency": "EUR"},
        {"value": sum(d.get("brutto_cent", 0) for d in data if d["art"].startswith(_("kein"))) / 100, "label": _("Zahlungen/kein Umsatz €"), "datatype": "Currency", "currency": "EUR", "indicator": "Blue"},
    ]
    return columns, data, _("Zahlungen auf gestellte Rechnungen und Anzahlungen auf Anzahlungsrechnungen sind Zahlungseingänge – deren USt erfasst die Faktura (PH UVA Auswertung). Methode vom Steuerberater bestätigen."), chart, summary
