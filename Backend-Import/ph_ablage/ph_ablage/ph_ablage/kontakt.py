"""Anbieter für den Hook-Vertrag „Kundenakte“ von ph_crm (ph_crm/ph_crm/kontakt360.py):

  ph_kontakt_datenauskunft    datenauskunft(kontakt)               – DSGVO Art. 15: nur Metadaten der Dateien
  ph_kontakt_anonymisieren    anonymisieren(kontakt, ausfuehren)   – DSGVO Art. 17: Löschplan mit Aufbewahrungssperre
  ph_kontakt_zusammengefuehrt zusammengefuehrt(alt, neu)            – Ordner/Dateien folgen dem Kontakt

Erfasst werden Dateien mit Bezug auf den Kontakt sowie auf seine Projekte (PH Projekt.kontakt) und Servicefälle
(PH Servicefall.kontakt), soweit diese Apps installiert sind. Belege mit laufender Frist (Klasse „Beleg“, § 132 BAO)
bleiben (Aktion „aufbewahren“ mit frist_bis); alles andere wird endgültig gelöscht (Speicher-Objekte inklusive).
"""

import frappe
from frappe import _
from frappe.utils import getdate, nowdate

from ph_ablage.ph_ablage import dienste
from ph_ablage.utils import regeln

FELDER = ["name", "dateiname", "ordner", "status", "endung", "groesse", "aktuelle_version", "hochgeladen_am", "hochgeladen_von", "beschreibung", "tags", "aufbewahrungsklasse", "aufbewahren_bis", "bezug_doctype", "bezug_name", "portal_freigabe"]


def _bezuege(kontakt):
    paare = [("PH Kontakt", kontakt)]
    for dt in ("PH Projekt", "PH Servicefall"):
        if frappe.db.exists("DocType", dt) and frappe.get_meta(dt).has_field("kontakt"):
            paare += [(dt, n) for n in frappe.get_all(dt, filters={"kontakt": kontakt}, pluck="name", limit=1000)]
    return paare


def _dateien(kontakt, felder=None):
    out = []
    for dt, name in _bezuege(kontakt):
        out += frappe.get_all("PH Datei", filters={"bezug_doctype": dt, "bezug_name": name}, fields=felder or FELDER, limit=5000)
    return out


def _sicher(d):
    return {k: (str(v) if v is not None and not isinstance(v, (int, float, str, bool)) else v) for k, v in dict(d).items()}


def datenauskunft(kontakt):
    abschnitte = []
    dateien = _dateien(kontakt)
    for d in dateien:
        abschnitte.append({"abschnitt": _("Ablage – Dateien"), "doctype": "PH Datei", "name": d.name, "daten": _sicher({**d, "hinweis": _("Inhalt auf Anfrage als Download (nicht Teil der Auskunft)")})})
    if dateien:
        for l in frappe.get_all("PH Datei Freigabelink", filters={"datei": ("in", [d.name for d in dateien])}, fields=["name", "datei", "status", "ablauf", "download_zaehler", "empfaenger_hinweis"]):
            abschnitte.append({"abschnitt": _("Ablage – Freigabelinks"), "doctype": "PH Datei Freigabelink", "name": l.name, "daten": _sicher(l)})
    return abschnitte


def anonymisieren(kontakt, ausfuehren=False):
    heute = getdate(nowdate())
    plan = []
    for d in _dateien(kontakt):
        regel = regeln.AUFBEWAHRUNG.get(d.aufbewahrungsklasse or "Allgemein", regeln.AUFBEWAHRUNG["Allgemein"])
        if regel["sperre"] and d.aufbewahren_bis and heute <= getdate(d.aufbewahren_bis):
            plan.append({"doctype": "PH Datei", "name": d.name, "aktion": "aufbewahren", "grund": _("Beleg (§ 132 BAO) – Aufbewahrungsfrist"), "frist_bis": str(d.aufbewahren_bis)})
        else:
            plan.append({"doctype": "PH Datei", "name": d.name, "aktion": "loeschen", "grund": _("Datei mit Personenbezug ohne Aufbewahrungspflicht"), "frist_bis": None})
    for o in frappe.get_all("PH Ordner", filters={"bezug_doctype": "PH Kontakt", "bezug_name": kontakt, "ist_bezugswurzel": 1}, fields=["name"]):
        plan.append({"doctype": "PH Ordner", "name": o.name, "aktion": "anonymisieren", "grund": _("Ordnername ohne Personennamen"), "frist_bis": None})
    if not ausfuehren:
        return plan
    for z in plan:
        try:
            if z["doctype"] == "PH Datei" and z["aktion"] == "loeschen" and frappe.db.exists("PH Datei", z["name"]):
                dienste.endgueltig_loeschen(frappe.get_doc("PH Datei", z["name"]), automatisch=True, pruefen=False)
            elif z["doctype"] == "PH Datei" and z["aktion"] == "aufbewahren":
                frappe.db.set_value("PH Datei", z["name"], {"beschreibung": None, "tags": None, "volltext": None, "bezug_titel": None}, update_modified=False)
            elif z["doctype"] == "PH Ordner":
                frappe.db.set_value("PH Ordner", z["name"], {"titel": kontakt, "bezug_titel": kontakt, "pfad": None}, update_modified=False)
                dienste.unterbaum_aktualisieren(z["name"])
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"ph_ablage: Anonymisierung {z['doctype']} {z['name']} fehlgeschlagen")
            z["fehler"] = 1
    from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll

    protokoll("Anonymisiert", bezug_doctype="PH Kontakt", bezug_name=kontakt, hinweis=_("{0} Dateien gelöscht, {1} aufbewahrt").format(sum(1 for z in plan if z["aktion"] == "loeschen"), sum(1 for z in plan if z["aktion"] == "aufbewahren")), automatisch=True)
    return plan


def zusammengefuehrt(alt, neu):
    """Dubletten-Zusammenführung: Stammordner von `alt` wandert unter den von `neu` (oder wird zu dessen Stammordner)."""
    try:
        w_alt = frappe.db.get_value("PH Ordner", {"bezug_doctype": "PH Kontakt", "bezug_name": alt, "ist_bezugswurzel": 1}, "name")
        if not w_alt:
            return
        w_neu = frappe.db.get_value("PH Ordner", {"bezug_doctype": "PH Kontakt", "bezug_name": neu, "ist_bezugswurzel": 1}, "name")
        o = frappe.get_doc("PH Ordner", w_alt)
        o.flags.ph_system = True
        o.flags.ignore_permissions = True
        o.bezug_name = neu
        if w_neu:
            o.parent_ph_ordner = w_neu
            o.ist_bezugswurzel = 0
            o.titel = _("Aus Kontakt {0}").format(alt)
        else:
            o.titel = dienste.bezug_titel("PH Kontakt", neu)
            o.bezug_titel = o.titel
        o.save()
        dienste.unterbaum_aktualisieren(o.name)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_ablage: Zusammenführung {alt} → {neu} fehlgeschlagen")
