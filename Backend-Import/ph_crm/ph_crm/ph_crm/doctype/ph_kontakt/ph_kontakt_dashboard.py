"""Verknüpfungs-Dashboard des Kontakts („Alle Vorgänge“). Fremde DocTypes nur, wenn installiert."""

import frappe
from frappe import _

TRANSAKTIONEN = (
    (_("Vertrieb"), ["PH Anfrage", "PH Termin", "PH Beratungsgespraech"]),
    (_("Projekte und Belege"), ["PH Projekt", "PH Angebot", "PH Auftragsbestaetigung", "PH Rechnung"]),
    (_("Shop und Logistik"), ["PH Bestellung", "PH Gutschein", "PH Lieferschein"]),
    (_("Service und Marketing"), ["PH Servicefall", "PH Newsletter Abo", "PH Einwilligung"]),
)


def get_data():
    transactions = []
    for label, items in TRANSAKTIONEN:
        vorhanden = [dt for dt in items if frappe.db.exists("DocType", dt) and frappe.get_meta(dt).has_field("kontakt")]
        if vorhanden:
            transactions.append({"label": label, "items": vorhanden})
    return {
        "fieldname": "kontakt",
        "non_standard_fieldnames": {"PH Aufgabe": "referenz_name"},
        "transactions": transactions + [{"label": _("Aufgaben"), "items": ["PH Aufgabe"]}],
    }
