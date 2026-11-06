"""Whitelisted Methoden rund um PH Kontakt für Backoffice (Next) und Kassa – re-exportiert in ph_crm.api.

  get_kundenakte(kontakt)                       Kopf + Übersicht + Bereiche aller Apps (rechtegefiltert)
  get_zeitleiste(kontakt, vor, limit)           vereinte Zeitleiste (Hook ph_kontakt_zeitleiste)
  find_duplicates(kontakt | email/telefon/…)    ähnliche Kontakte mit Punkten/Gründen
  merge_kontakte(ziel, quelle, felder)          Zusammenführen (Leitung)
  create_kontakt(...)                           Schnellanlage (Kassa „Rechnungsempfänger“, Telefon) mit Dublettenprüfung
  export_kontakt_daten(kontakt)                 DSGVO-Auskunft als JSON-Datei (Art. 15/20)
  get_loeschplan(kontakt)                       Vorschau Löschung/Aufbewahrung (§ 132 BAO)
  anonymize_kontakt(kontakt, bestaetigung)      Löschung ausführen (Leitung)
Aliasse laut Konzept CRM §12: kundenakte, zeitleiste.
Diese Methoden sind Desk-/Backoffice-Methoden (Session des Mitarbeiters), keine Website-Endpunkte.
"""

import frappe
from frappe import _
from frappe.utils import cint

from ph_crm.ph_crm import dsgvo
from ph_crm.ph_crm import dubletten as dub
from ph_crm.ph_crm import kontakt360


def _lesen(kontakt):
    if not kontakt or not frappe.db.exists("PH Kontakt", kontakt):
        frappe.throw(_("Kontakt {0} nicht gefunden.").format(kontakt), frappe.DoesNotExistError)
    if not frappe.has_permission("PH Kontakt", "read", kontakt):
        frappe.throw(_("Keine Berechtigung."), frappe.PermissionError)


@frappe.whitelist(methods=["GET", "POST"])
def get_kundenakte(kontakt):
    _lesen(kontakt)
    return kontakt360.kundenakte(kontakt)


@frappe.whitelist(methods=["GET", "POST"])
def get_zeitleiste(kontakt, vor=None, limit=30):
    _lesen(kontakt)
    return kontakt360.zeitleiste(kontakt, vor=vor, limit=cint(limit) or 30)


kundenakte = get_kundenakte
zeitleiste = get_zeitleiste


@frappe.whitelist(methods=["GET", "POST"])
def find_duplicates(kontakt=None, email=None, telefon=None, mobil=None, vorname=None, nachname=None, plz=None, firma=None, limit=10):
    if not frappe.has_permission("PH Kontakt", "read"):
        frappe.throw(_("Keine Berechtigung."), frappe.PermissionError)
    if kontakt:
        _lesen(kontakt)
        werte = frappe.get_doc("PH Kontakt", kontakt).as_dict()
    else:
        werte = {"email": email, "telefon": telefon, "mobil": mobil, "vorname": vorname, "nachname": nachname, "plz": plz, "firma": firma}
    return dub.kandidaten(werte, ausser=kontakt, limit=cint(limit) or 10)


@frappe.whitelist(methods=["POST"])
def merge_kontakte(ziel, quelle, felder=None):
    return dub.zusammenfuehren(ziel, quelle, felder)


@frappe.whitelist(methods=["POST"])
def create_kontakt(nachname, vorname=None, firma=None, email=None, telefon=None, strasse=None, plz=None, ort=None, uid=None, land=None, quelle="showroom", trotzdem=0):
    """Schnellanlage ohne Marketing-Einwilligung. Wahrscheinliche Dublette → {bestehend: name} statt Anlage,
    außer `trotzdem=1`."""
    if not frappe.has_permission("PH Kontakt", "create"):
        frappe.throw(_("Keine Berechtigung."), frappe.PermissionError)
    werte = {"vorname": vorname, "nachname": nachname, "firma": firma, "email": email, "telefon": telefon, "plz": plz}
    if not cint(trotzdem):
        treffer = [k for k in dub.kandidaten(werte, limit=3) if k["einstufung"] == "wahrscheinlich"]
        if treffer:
            return {"kontakt": treffer[0]["name"], "bestehend": True, "kandidaten": treffer}
    doc = frappe.get_doc({
        "doctype": "PH Kontakt", "vorname": vorname, "nachname": nachname, "firma": firma,
        "kontaktart": "Geschaeft" if (firma or uid) else "Privat", "email": email or None, "telefon": telefon,
        "strasse": strasse, "plz": plz, "ort": ort, "uid": uid,
        "land": land if land and frappe.db.exists("Country", land) else None,
        "quelle": quelle if quelle in ("website", "agent", "telefon", "showroom", "email", "empfehlung", "messe", "sonstige") else "showroom",
    }).insert()
    return {"kontakt": doc.name, "bestehend": False, "titel": doc.titel}


@frappe.whitelist(methods=["POST"])
def export_kontakt_daten(kontakt):
    frappe.only_for(("System Manager", "PH CRM Leitung", "PH Backoffice-Admin", "PH Geschäftsführung"))
    _lesen(kontakt)
    return {"file_url": dsgvo.export(kontakt)}


@frappe.whitelist(methods=["GET", "POST"])
def get_loeschplan(kontakt):
    frappe.only_for(("System Manager", "PH CRM Leitung", "PH Backoffice-Admin", "PH Geschäftsführung"))
    _lesen(kontakt)
    return dsgvo.plan(kontakt)


@frappe.whitelist(methods=["POST"])
def anonymize_kontakt(kontakt, bestaetigung=None):
    _lesen(kontakt)
    return dsgvo.ausfuehren(kontakt, bestaetigung)
