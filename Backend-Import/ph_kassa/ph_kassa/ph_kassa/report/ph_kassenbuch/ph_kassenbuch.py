"""PH Kassenbuch – je Tag: Anfangsbestand, Bareinnahmen/-ausgaben (Belege), Einlagen, Entnahmen, Differenz, Endbestand (Kassenbuch)."""

import frappe
from frappe import _
from frappe.utils import getdate

from ph_kassa.auswertung import belege_zeitraum, tage, zeitraum_filter
from ph_kassa.logik.abschluss import soll_aus_belegen


def execute(filters=None):
    filters, von, bis = zeitraum_filter(filters)
    kasse = filters.get("kasse")
    kb_filter = {"datum": ("between", [von, bis]), "status": "Gebucht"}
    if kasse:
        kb_filter["kasse"] = kasse
    kb = frappe.get_all("PH Kassenbuch", filters=kb_filter, fields=["datum", "art", "betrag_cent", "bewegung_cent", "bestand_danach_cent", "zeitpunkt"], order_by="zeitpunkt asc")
    belege = belege_zeitraum(von, bis, kasse)
    je_tag_beleg = {}
    for b in belege:
        je_tag_beleg.setdefault(b["datum"], []).append(b)
    je_tag_kb = {}
    for r in kb:
        je_tag_kb.setdefault(getdate(r.datum), []).append(r)

    # Anfangsbestand des ersten Tages = letzter Bestand vor dem Zeitraum
    vor_filter = {"datum": ("<", von), "status": "Gebucht"}
    if kasse:
        vor_filter["kasse"] = kasse
    vor = frappe.get_all("PH Kassenbuch", filters=vor_filter, fields=["bestand_danach_cent"], order_by="zeitpunkt desc", limit=1)
    bestand = int(vor[0].bestand_danach_cent or 0) if vor else 0

    data = []
    for t in tage(von, bis):
        s = soll_aus_belegen(je_tag_beleg.get(t, []))
        rows = je_tag_kb.get(t, [])
        einl = sum(int(r.betrag_cent) for r in rows if r.art == "Einlage")
        entn = sum(int(r.betrag_cent) for r in rows if r.art == "Entnahme")
        diff = sum(int(r.bewegung_cent) for r in rows if r.art == "Differenz")
        anf = sum(int(r.betrag_cent) for r in rows if r.art == "Anfangsbestand")
        if not rows and not s["belege_anzahl"]:
            continue
        anfang = bestand + anf
        ende = anfang + s["bar_einnahmen_cent"] - s["bar_ausgaben_cent"] + einl - entn + diff
        data.append({"datum": t, "anfang_cent": anfang, "bar_einnahmen_cent": s["bar_einnahmen_cent"], "bar_ausgaben_cent": s["bar_ausgaben_cent"], "einlagen_cent": einl, "entnahmen_cent": entn, "differenz_cent": diff, "ende_cent": ende, "belege": s["belege_anzahl"]})
        bestand = ende

    columns = [
        {"fieldname": "datum", "label": _("Tag"), "fieldtype": "Date", "width": 110},
        {"fieldname": "anfang_cent", "label": _("Anfang (Cent)"), "fieldtype": "Int", "width": 120},
        {"fieldname": "bar_einnahmen_cent", "label": _("Bareinnahmen"), "fieldtype": "Int", "width": 120},
        {"fieldname": "bar_ausgaben_cent", "label": _("Barausgaben"), "fieldtype": "Int", "width": 120},
        {"fieldname": "einlagen_cent", "label": _("Einlagen"), "fieldtype": "Int", "width": 110},
        {"fieldname": "entnahmen_cent", "label": _("Entnahmen"), "fieldtype": "Int", "width": 110},
        {"fieldname": "differenz_cent", "label": _("Differenz"), "fieldtype": "Int", "width": 110},
        {"fieldname": "ende_cent", "label": _("Ende (Cent)"), "fieldtype": "Int", "width": 120},
        {"fieldname": "belege", "label": _("Belege"), "fieldtype": "Int", "width": 80},
    ]
    chart = {"data": {"labels": [str(d["datum"]) for d in data], "datasets": [{"name": _("Bargeldbestand Ende"), "values": [d["ende_cent"] / 100 for d in data]}]}, "type": "line", "colors": ["#30373e"]}
    summary = [
        {"value": sum(d["bar_einnahmen_cent"] for d in data) / 100, "label": _("Bareinnahmen €"), "datatype": "Currency", "currency": "EUR"},
        {"value": sum(d["differenz_cent"] for d in data) / 100, "label": _("Differenzen €"), "datatype": "Currency", "currency": "EUR", "indicator": "Red" if any(d["differenz_cent"] for d in data) else "Green"},
        {"value": bestand / 100, "label": _("Bestand Ende €"), "datatype": "Currency", "currency": "EUR"},
    ]
    return columns, data, _("Beträge in Cent (CONVENTIONS 2); Kassenbuch-Buchungen sind unveränderlich."), chart, summary
