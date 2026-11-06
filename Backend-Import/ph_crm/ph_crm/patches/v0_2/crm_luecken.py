"""Patch (post_model_sync, 04.11.2026): Bestand an die Lücken-Erweiterung anpassen – idempotent.
  - Standard-Beratungsvorlagen anlegen
  - PH Kontakt.telefon_norm aus telefon/mobil (Dublettenprüfung, Telefonsuche)
  - PH Anfrage: Wahrscheinlichkeit/gewichteter Wert je Status; gewonnen_am/verloren_am aus modified (Näherung)
"""

import frappe

from ph_crm.utils import dubletten as dub
from ph_crm.utils import pipeline


def execute():
    if not frappe.db.exists("DocType", "PH Beratungsvorlage"):
        return
    from ph_crm.install import beratungsvorlagen_anlegen

    beratungsvorlagen_anlegen()
    for k in frappe.get_all("PH Kontakt", filters={"telefon_norm": ("is", "not set")}, fields=["name", "telefon", "mobil"]):
        norm = ", ".join(sorted(dub.telefone(k))) or None
        if norm:
            frappe.db.set_value("PH Kontakt", k.name, "telefon_norm", norm, update_modified=False)
    for a in frappe.get_all("PH Anfrage", fields=["name", "status", "wert_cent", "modified", "gewonnen_am", "verloren_am", "wahrscheinlichkeit_prozent"]):
        p = pipeline.wahrscheinlichkeit(a.status)
        werte = {"wahrscheinlichkeit_prozent": p, "gewichtet_cent": pipeline.gewichtet_cent(a.wert_cent, p)}
        if a.status == "Gewonnen" and not a.gewonnen_am:
            werte["gewonnen_am"] = a.modified
        if a.status in ("Verloren", "Spam") and not a.verloren_am:
            werte["verloren_am"] = a.modified
        frappe.db.set_value("PH Anfrage", a.name, werte, update_modified=False)
    frappe.db.commit()
