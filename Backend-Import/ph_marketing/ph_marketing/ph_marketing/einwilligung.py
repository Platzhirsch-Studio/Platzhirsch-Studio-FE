"""Consent-Protokoll (PH Einwilligung): anlegen, bestätigen, widerrufen, prüfen.

Nachweis nach Art. 7 Abs. 1 DSGVO: Zweck, Textversion, Zeitpunkt, Kanal, Quelle, DOI-Zeit, Widerruf.
Einträge werden nie überschrieben; ein Widerruf setzt widerrufen_am auf allen wirksamen Einträgen des Zwecks.
"""

import json

import frappe
from frappe.utils import now_datetime

from ph_core.api import ip_hash
from ph_marketing.ph_marketing.einstellungen import einstellungen
from ph_marketing.utils.regeln import DOI_ZWECKE, ZWECKE
from ph_marketing.utils.token import email_normalisieren


def aktiv(email, zweck):
    """Name der wirksamen Einwilligung (bestätigt, nicht widerrufen) oder None."""
    return frappe.db.get_value(
        "PH Einwilligung",
        {"email": email_normalisieren(email), "zweck": zweck, "status": "Bestaetigt"},
        "name",
        order_by="doi_bestaetigt_am desc",
    )


def protokollieren(email, zweck, textversion, quelle="", kanal="website", sprache="de", interessen="", daten=None, kontakt=None, doi_token_hash=None, referenz=None, bestaetigt=False, bestaetigt_kanal=None):
    """Neuen Einwilligungs-Eintrag anlegen. bestaetigt=True nur für Kanäle mit eigenem Beleg (showroom/papier/backoffice)."""
    if zweck not in ZWECKE:
        frappe.throw(frappe._("Unbekannter Zweck: {0}").format(zweck))
    e = einstellungen()
    doi_noetig = zweck in DOI_ZWECKE and kanal == "website" and not bestaetigt
    jetzt = now_datetime()
    doc = frappe.get_doc(
        {
            "doctype": "PH Einwilligung",
            "email": email_normalisieren(email),
            "kontakt": kontakt,
            "zweck": zweck,
            "textversion": (textversion or e["einwilligung_textversion"])[:80],
            "quelle": (quelle or "")[:140],
            "kanal": kanal if kanal in ("website", "showroom", "telefon", "email", "whatsapp", "papier", "backoffice") else "website",
            "sprache": sprache if sprache in ("de", "en", "fr", "it") else "de",
            "interessen": (interessen or "")[:500],
            "zeitpunkt": jetzt,
            "doi_noetig": int(doi_noetig),
            "doi_token_hash": doi_token_hash if doi_noetig else None,
            "doi_gesendet_am": jetzt if doi_noetig else None,
            "doi_bestaetigt_am": None if doi_noetig else jetzt,
            "doi_bestaetigt_kanal": None if doi_noetig else (bestaetigt_kanal or kanal),
            "status": "Offen" if doi_noetig else "Bestaetigt",
            "daten_json": json.dumps(daten, ensure_ascii=False, default=str) if daten else None,
            "referenz_doctype": referenz[0] if referenz else None,
            "referenz_name": referenz[1] if referenz else None,
            "ip_hash": ip_hash() if e["ip_hash_speichern"] else None,
            "quelle_system": "api" if kanal == "website" else "desk",
        }
    )
    doc.flags.ignore_permissions = True
    doc.insert()
    return doc


def bestaetigen(name, kanal="website"):
    doc = frappe.get_doc("PH Einwilligung", name)
    if doc.status == "Bestaetigt":
        return doc
    doc.db_set({"doi_bestaetigt_am": now_datetime(), "doi_bestaetigt_kanal": kanal, "status": "Bestaetigt", "doi_token_hash": None}, update_modified=True)
    return doc


def widerrufen(email, zweck, kanal="link", grund=None):
    """Alle wirksamen/offenen Einwilligungen dieses Zwecks widerrufen. → Anzahl."""
    namen = frappe.get_all("PH Einwilligung", filters={"email": email_normalisieren(email), "zweck": zweck, "status": ("in", ("Offen", "Bestaetigt"))}, pluck="name")
    for n in namen:
        frappe.db.set_value("PH Einwilligung", n, {"widerrufen_am": now_datetime(), "widerruf_kanal": kanal, "widerruf_grund": (grund or "")[:140], "status": "Widerrufen"}, update_modified=True)
    return len(namen)


def abgelaufen_markieren(name):
    frappe.db.set_value("PH Einwilligung", name, {"status": "Abgelaufen", "doi_token_hash": None}, update_modified=True)


def nachweis(email):
    """Alle Einträge einer Adresse (DSGVO-Auskunft, Print Format „PH Einwilligung Nachweis“)."""
    return frappe.get_all(
        "PH Einwilligung",
        filters={"email": email_normalisieren(email)},
        fields=["name", "zweck", "status", "zeitpunkt", "kanal", "quelle", "textversion", "doi_bestaetigt_am", "widerrufen_am", "widerruf_kanal"],
        order_by="zeitpunkt desc",
    )
