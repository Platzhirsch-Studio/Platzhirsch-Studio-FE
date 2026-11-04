"""Whitelisted Methoden des RKSV-Kerns für die Kassa-Oberfläche (WP10b) und Integrationen.

    ph_kassa.rksv.api.beleg_buchen(kasse, positionen, zahlarten, …)   → Beleg signieren (JSON-Strings erlaubt)
    ph_kassa.rksv.api.beleg_stornieren(beleg, grund)
    ph_kassa.rksv.api.nullbeleg(kasse)
    ph_kassa.rksv.api.beleg_daten(name)                                → Druck-/Anzeige-Daten inkl. QR-SVG
    ph_kassa.rksv.api.kassen_status(kasse)                             → Kettenstand, SEE-Status, Trainingsmodus
Alle Methoden prüfen DocType-Berechtigungen (PH Kassenbeleg create / read). Kein allow_guest.
"""

import json

import frappe
from frappe import _

from . import buchung
from .qr import svg


def _liste(wert):
    if isinstance(wert, str):
        wert = json.loads(wert or "[]")
    return list(wert or [])


@frappe.whitelist(methods=["POST"])
def beleg_buchen(kasse, positionen, zahlarten, kontakt=None, auftrag=None, rechnung=None, bestellung=None, trainings=0, kundenbeleg_email=None, kunde_name=None, zahlungsplan_position=None, idempotency_key=None):
    frappe.has_permission("PH Kassenbeleg", "create", throw=True)
    doc = buchung.erzeuge_beleg(
        kasse,
        positionen=_liste(positionen),
        zahlarten=_liste(zahlarten),
        kontakt=kontakt,
        auftrag=auftrag,
        rechnung=rechnung,
        bestellung=bestellung,
        trainings=bool(int(trainings or 0)),
        kundenbeleg_email=kundenbeleg_email,
        kunde_name=kunde_name,
        zahlungsplan_position=zahlungsplan_position,
        idempotency_key=idempotency_key,
        quelle="Kassa",
    )
    return _kurz(doc)


@frappe.whitelist(methods=["POST"])
def beleg_stornieren(beleg, grund):
    return _kurz(buchung.storniere_beleg(beleg, grund))


@frappe.whitelist(methods=["POST"])
def nullbeleg(kasse):
    frappe.has_permission("PH Kassenbeleg", "create", throw=True)
    return _kurz(buchung.nullbeleg(kasse, quelle="Kassa"))


@frappe.whitelist()
def beleg_daten(name):
    doc = frappe.get_doc("PH Kassenbeleg", name)
    doc.check_permission("read")
    d = _kurz(doc)
    d.update(
        positionen=[{k: p.get(k) for k in ("art", "produkt", "bezeichnung", "zusatz", "menge", "einzel_brutto_cent", "brutto_cent", "netto_cent", "ust_cent", "steuersatz")} for p in doc.positionen],
        zahlarten=[{k: z.get(k) for k in ("zahlart", "betrag_cent", "gegeben_cent", "retour_cent", "barumsatz", "gutschein")} for z in doc.zahlarten],
        betrag_normal_cent=doc.betrag_normal_cent,
        betrag_ermaessigt1_cent=doc.betrag_ermaessigt1_cent,
        betrag_ermaessigt2_cent=doc.betrag_ermaessigt2_cent,
        betrag_null_cent=doc.betrag_null_cent,
        betrag_besonders_cent=doc.betrag_besonders_cent,
        ust_cent=doc.ust_cent,
        kontakt=doc.kontakt,
        kunde_name=doc.kunde_name,
        bediener=doc.bediener,
        storno_von=doc.storno_von,
        ocr_code=doc.ocr_code,
        qr_svg=svg(doc.maschinenlesbarer_code) or "",
    )
    return d


@frappe.whitelist()
def kassen_status(kasse):
    k = frappe.get_doc("PH Kasse", kasse)
    k.check_permission("read")
    see = frappe.db.get_value("PH Signatureinheit", k.see, ["status", "art", "ausgefallen_seit", "zertifikat_seriennummer"], as_dict=True) if k.see else None
    return {
        "kasse": k.name,
        "kassen_id": k.kassen_id,
        "status": k.status,
        "trainings_modus": int(k.trainings_modus or 0),
        "startbeleg": k.startbeleg,
        "startbeleg_geprueft": bool(k.startbeleg_geprueft_am),
        "belegnummer_zaehler": int(k.belegnummer_zaehler or 0),
        "umsatzzaehler_cent": int(k.umsatzzaehler_cent or 0),
        "letzter_beleg": k.letzter_beleg,
        "letzter_beleg_am": str(k.letzter_beleg_am) if k.letzter_beleg_am else None,
        "aes_schluessel_vorhanden": int(k.aes_schluessel_vorhanden or 0),
        "see": see,
        "buchen_moeglich": bool(k.startbeleg and k.aes_schluessel_vorhanden and k.status != "Ausser Betrieb"),
        "hinweis": _("Kasse nicht aktiv – nur Trainingsbelege sinnvoll.") if k.status not in ("Aktiv", "Ausgefallen") else "",
    }


def _kurz(doc):
    return {
        "name": doc.name,
        "kasse": doc.kasse,
        "belegnummer": doc.belegnummer,
        "belegart": doc.belegart,
        "status": doc.status,
        "datum_uhrzeit": str(doc.datum_uhrzeit),
        "gesamt_cent": doc.gesamt_cent,
        "trainings": int(doc.trainings or 0),
        "see_ausgefallen": int(doc.see_ausgefallen or 0),
        "maschinenlesbarer_code": doc.maschinenlesbarer_code,
        "jws_compact": doc.jws_compact,
        "storniert_durch": doc.storniert_durch,
    }
