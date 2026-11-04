"""Scheduler-Funktionen von ph_sortiment (hooks.py scheduler_events). Idempotent, Fehler nur protokolliert."""

import frappe
from frappe.utils import nowdate

from ph_sortiment.logik.preise import ab_preis_cent, gueltiger_preis, veraltet


def preisstand_pruefen():
    """Täglich 05:10: preisstand_alt / aktueller Preis je Produkt neu berechnen (Höchstalter 3/6 Monate)."""
    from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import max_monate

    mm = max_monate()
    heute = nowdate()
    geaendert = 0
    for name in frappe.get_all("PH Produkt", filters={"status": ("in", ["Aktiv", "Geprueft", "Pausiert"])}, pluck="name"):
        try:
            preise = frappe.get_all("PH Produkt Preis", filters={"parent": name, "parenttype": "PH Produkt"}, fields=["ab", "stand", "brutto_cent", "preisart", "freigegeben", "ausfuehrung"])
            if not preise:
                continue
            aktuell = gueltiger_preis(preise, heute, None, mm)
            ab = ab_preis_cent(preise, heute, mm)
            freigegeben = [z for z in preise if z.freigegeben]
            alt = 1 if freigegeben and ab is None and all(veraltet(z.stand, z.preisart, heute, mm) for z in freigegeben) else 0
            werte = {"aktueller_preis_cent": ab, "aktueller_preis_stand": aktuell.stand if aktuell else None, "preisstand_alt": alt}
            vorher = frappe.db.get_value("PH Produkt", name, list(werte), as_dict=True)
            if any(str(vorher.get(k) or "") != str(v or "") for k, v in werte.items()):
                frappe.db.set_value("PH Produkt", name, werte, update_modified=False)
                geaendert += 1
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"preisstand_pruefen {name}")
    frappe.db.commit()
    if geaendert:
        from ph_sortiment.ph_sortiment.ereignisse import website_aktualisieren

        website_aktualisieren("products")
    return geaendert


def ab_erinnerung():
    """Werktags 08:00: gesendete Bestellungen ohne AB nach Frist → ToDo an Leitung (einmal je Bestellung)."""
    from ph_sortiment.ph_sortiment.doctype.ph_herstellerbestellung.ph_herstellerbestellung import ab_ueberfaellig

    leitung = frappe.get_all("Has Role", filters={"role": "PH Sortiment Leitung", "parenttype": "User"}, pluck="parent")
    leitung = [u for u in leitung if frappe.db.get_value("User", u, "enabled")]
    n = 0
    for r in ab_ueberfaellig():
        if frappe.db.exists("ToDo", {"reference_type": "PH Herstellerbestellung", "reference_name": r.name, "status": "Open"}):
            continue
        for user in leitung or ["Administrator"]:
            frappe.get_doc({"doctype": "ToDo", "allocated_to": user, "reference_type": "PH Herstellerbestellung", "reference_name": r.name, "priority": "Medium", "description": frappe._("AB ausständig: Bestellung {0} an {1} (gesendet {2}){3}").format(r.name, r.lieferant, frappe.utils.formatdate(r.gesendet_am), f" – {r.kommission}" if r.kommission else "")}).insert(ignore_permissions=True)
            n += 1
    frappe.db.commit()
    return n


def zaehler_aktualisieren():
    """Nächtlich: produkte_anzahl / es_gibt_produkte je Marke und Kategorie nachziehen."""
    for dt, feld in (("PH Marke", "marke"), ("PH Kategorie", "kategorie")):
        for name in frappe.get_all(dt, pluck="name"):
            n = frappe.db.count("PH Produkt", {feld: name, "status": "Aktiv", "website_sichtbar": 1})
            werte = {"produkte_anzahl": n}
            if dt == "PH Marke":
                werte["es_gibt_produkte"] = 1 if n else 0
            frappe.db.set_value(dt, name, werte, update_modified=False)
    frappe.db.commit()
