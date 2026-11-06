"""v0.2 (Backend-Lücken 04.11.2026): Bestandsdaten auf neue Felder heben – idempotent, ohne Validierung (db.set_value).

- Fehlerkatalog: <BER>-99 „Sonstiges“ je Bereich.
- Servicefall: Lösungsfrist/SLA aus Priorität, Kulanz-Freigabestatus (bisherige Freigabe deckt den aktuellen Betrag).
- Lieferantenregress: Gutschrift-Abgleich.
"""

import frappe
from frappe.utils import cint, getdate, nowdate


def execute():
    from ph_service.install import sonstiges_je_bereich
    from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen, feiertage, sla_tabellen
    from ph_service.utils import kulanz as kul
    from ph_service.utils import regress as rg
    from ph_service.utils import sla

    sonstiges_je_bereich()
    einst = einstellungen()
    reaktion, loesung = sla_tabellen(einst)
    ft = feiertage()
    heute = getdate(nowdate())
    for f in frappe.get_all("PH Servicefall", fields=["name", "gemeldet_am", "prioritaet", "frist_reaktion", "frist_loesung", "erstreaktion_am", "erledigt_am", "kulanz_cent", "kulanz_freigegeben_von", "kulanz_freigabe_status"]):
        werte = {}
        if not f.frist_loesung and f.gemeldet_am:
            werte["frist_loesung"] = sla.fristen(getdate(f.gemeldet_am), f.prioritaet or "Normal", reaktion, loesung, ft)["frist_loesung"]
        st = sla.status(heute, f.frist_reaktion, werte.get("frist_loesung") or f.frist_loesung, getdate(f.erstreaktion_am) if f.erstreaktion_am else None, getdate(f.erledigt_am) if f.erledigt_am else None, cint(einst["sla_warn_werktage"]), ft)
        werte.update(sla_status=st["status"], sla_reaktion_verletzt=int(st["reaktion_verletzt"]), sla_loesung_verletzt=int(st["loesung_verletzt"]))
        freigegeben = cint(f.kulanz_cent) if f.kulanz_freigegeben_von else None
        werte["kulanz_freigabe_status"] = kul.freigabe_status(f.kulanz_cent, einst["kulanz_schwelle_cent"], freigegeben)
        if freigegeben:
            werte["kulanz_freigegeben_cent"] = freigegeben
        frappe.db.set_value("PH Servicefall", f.name, werte, update_modified=False)
    for r in frappe.get_all("PH Lieferantenregress", fields=["name", "status", "betrag_gefordert_cent", "betrag_anerkannt_cent", "betrag_erhalten_cent"]):
        a = rg.abgleich(r.betrag_gefordert_cent, r.betrag_anerkannt_cent, r.betrag_erhalten_cent, einst["regress_toleranz_cent"])
        frappe.db.set_value("PH Lieferantenregress", r.name, {"abgleich_status": a["status"], "differenz_cent": a["differenz_cent"], "quote_promille": a["quote_promille"]}, update_modified=False)
