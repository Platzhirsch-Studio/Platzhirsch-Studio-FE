"""PH UVA Zuarbeit – Kennzahlen (KZ 000/022/029/006/017/021/011/070/057/060/065/066), Anzahlungen (Ist), OSS je Land und Belegliste."""

import frappe
from frappe import _

from ph_faktura.ph_faktura.doctype.ph_uva_auswertung.ph_uva_auswertung import berechne


def execute(filters=None):
    f = frappe._dict(filters or {})
    felder, zeilen, belege = berechne(f.von, f.bis)
    data = [{"kennzahl": z["kennzahl"], "bezeichnung": z["bezeichnung"], "land": z.get("land"), "satz": f"{z['satz_promille'] / 100:g} %" if z.get("satz_promille") else "", "bemessung": z["bemessung_cent"] / 100, "steuer": z["steuer_cent"] / 100, "belege": z.get("anzahl_belege")} for z in zeilen]
    data.append({"kennzahl": "", "bezeichnung": _("Zahllast (+) / Gutschrift (−)"), "bemessung": None, "steuer": felder["zahllast_cent"] / 100, "bold": 1})
    columns = [
        {"fieldname": "kennzahl", "label": _("KZ"), "fieldtype": "Data", "width": 70},
        {"fieldname": "bezeichnung", "label": _("Bezeichnung"), "fieldtype": "Data", "width": 320},
        {"fieldname": "land", "label": _("Land"), "fieldtype": "Data", "width": 60},
        {"fieldname": "satz", "label": _("Satz"), "fieldtype": "Data", "width": 70},
        {"fieldname": "bemessung", "label": _("Bemessung €"), "fieldtype": "Currency", "width": 130},
        {"fieldname": "steuer", "label": _("Steuer €"), "fieldtype": "Currency", "width": 130},
        {"fieldname": "belege", "label": _("Belege"), "fieldtype": "Int", "width": 70},
    ]
    message = "<b>" + _("Belegliste") + "</b><pre style='font-size:11px;max-height:300px;overflow:auto'>" + frappe.utils.escape_html("\n".join(belege)) + "</pre><p class='text-muted small'>" + _("Soll-Versteuerung für Rechnungen, Ist für Anzahlungen – Methode vom Steuerberater bestätigen lassen. Keine Abgabe, nur Zuarbeit.") + "</p>"
    ust_zeilen = [z for z in zeilen if z["kennzahl"] in ("022", "029", "006", "057", "060", "065", "066")]
    chart = {"data": {"labels": [z["kennzahl"] for z in ust_zeilen], "datasets": [{"name": _("Steuer €"), "values": [round(z["steuer_cent"] / 100, 2) for z in ust_zeilen]}]}, "type": "bar", "colors": ["#30373e"]}
    summary = [
        {"value": felder["kz000_cent"] / 100, "label": _("Umsätze gesamt"), "datatype": "Currency"},
        {"value": (felder["kz022_ust_cent"] + felder["kz029_ust_cent"] + felder["kz006_ust_cent"]) / 100, "label": _("USt"), "datatype": "Currency"},
        {"value": (felder["kz060_cent"] + felder["kz065_cent"] + felder["kz066_cent"]) / 100, "label": _("Vorsteuer"), "datatype": "Currency"},
        {"value": felder["zahllast_cent"] / 100, "label": _("Zahllast"), "datatype": "Currency", "indicator": "Orange" if felder["zahllast_cent"] > 0 else "Green"},
    ]
    return columns, data, message, chart, summary
