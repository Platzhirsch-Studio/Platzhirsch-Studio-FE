"""Datenbeschaffung für die Reklamationsstatistik je Lieferant (Aggregation: logik/statistik.py).

Genutzt von Report „PH Reklamationen je Lieferant“ und ph_sortiment.api.reklamationsstatistik. Servicefälle und
Regresse nur, wenn ph_service installiert ist (frappe.db.exists DocType).
"""

import frappe
from frappe.utils import add_months, getdate, nowdate

from ph_sortiment.logik.statistik import reklamationsstatistik


def daten(lieferant=None, von=None, bis=None):
    von = getdate(von or add_months(nowdate(), -12))
    bis = getdate(bis or nowdate())
    zeitraum = ("between", [von, bis])
    basis = {"lieferant": lieferant} if lieferant else {}

    we = {w.name: w.lieferant for w in frappe.get_all("PH Wareneingang", filters={**basis, "datum": zeitraum}, fields=["name", "lieferant"])}
    we_pos = []
    if we:
        for z in frappe.get_all("PH Wareneingang Position", filters={"parenttype": "PH Wareneingang", "parent": ("in", list(we))}, fields=["parent", "zustand", "menge_erwartet", "menge_erhalten"]):
            we_pos.append({"lieferant": we[z.parent], "zustand": z.zustand, "menge_erwartet": z.menge_erwartet, "menge_erhalten": z.menge_erhalten})

    hb = {b.name: b.lieferant for b in frappe.get_all("PH Herstellerbestellung", filters={**basis, "datum": zeitraum, "ab_nummer": ("is", "set"), "status": ("!=", "Storniert")}, fields=["name", "lieferant"])}
    hb_pos = []
    if hb:
        for z in frappe.get_all("PH Herstellerbestellung Position", filters={"parenttype": "PH Herstellerbestellung", "parent": ("in", list(hb)), "status": ("!=", "Storniert")}, fields=["parent", "abweichung"]):
            hb_pos.append({"lieferant": hb[z.parent], "abweichung": z.abweichung})

    lieferungen = [{"lieferant": b.lieferant, "termin": b.bestaetigter_termin or b.wunschtermin, "geliefert_am": b.geliefert_am} for b in frappe.get_all("PH Herstellerbestellung", filters={**basis, "geliefert_am": zeitraum}, fields=["lieferant", "bestaetigter_termin", "wunschtermin", "geliefert_am"])]

    servicefaelle, regresse = [], []
    if frappe.db.exists("DocType", "PH Servicefall"):
        f = {"lieferant": lieferant} if lieferant else {"lieferant": ("is", "set")}
        servicefaelle = frappe.get_all("PH Servicefall", filters={**f, "gemeldet_am": zeitraum}, fields=["lieferant"])
    if frappe.db.exists("DocType", "PH Lieferantenregress"):
        f = {"lieferant": lieferant} if lieferant else {"lieferant": ("is", "set")}
        regresse = frappe.get_all("PH Lieferantenregress", filters={**f, "gemeldet_am": zeitraum}, fields=["lieferant", "status", "betrag_gefordert_cent", "betrag_anerkannt_cent"])

    zeilen, gesamt = reklamationsstatistik(we_pos, hb_pos, lieferungen, servicefaelle, regresse)
    return {"von": str(von), "bis": str(bis), "service_installiert": bool(frappe.db.exists("DocType", "PH Servicefall")), "zeilen": zeilen, "gesamt": gesamt}
