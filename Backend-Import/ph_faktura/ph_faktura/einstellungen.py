"""Gecachter Zugriff auf PH Faktura Einstellungen, PH Mahnwesen Einstellungen und die Standardfirma."""

import frappe

CACHE_FAKTURA = "ph_faktura:einstellungen"
CACHE_MAHNWESEN = "ph_faktura:mahnwesen"


def faktura():
    data = frappe.cache().get_value(CACHE_FAKTURA)
    if not data:
        doc = frappe.get_cached_doc("PH Faktura Einstellungen")
        data = doc.as_dict()
        for k in ("zahlungsziel_tage", "angebot_gueltig_tage", "kleinbetragsgrenze_cent", "uid_pflicht_ab_cent", "lieferschwelle_eu_netto_cent", "debitoren_ab", "kreditoren_ab", "sachkontenlaenge"):
            data[k] = int(data.get(k) or 0)
        data["zahlungsziel_tage"] = data["zahlungsziel_tage"] or 14
        data["angebot_gueltig_tage"] = data["angebot_gueltig_tage"] or 30
        data["kleinbetragsgrenze_cent"] = data["kleinbetragsgrenze_cent"] or 40000
        data["uid_pflicht_ab_cent"] = data["uid_pflicht_ab_cent"] or 1000000
        frappe.cache().set_value(CACHE_FAKTURA, data)
    return data


def mahnwesen():
    data = frappe.cache().get_value(CACHE_MAHNWESEN)
    if not data:
        doc = frappe.get_cached_doc("PH Mahnwesen Einstellungen")
        data = doc.as_dict()
        frappe.cache().set_value(CACHE_MAHNWESEN, data)
    return data


def cache_leeren():
    frappe.cache().delete_value(CACHE_FAKTURA)
    frappe.cache().delete_value(CACHE_MAHNWESEN)


def firma():
    """Standardfirma (PH Firma) als dict – UID, IBAN, Name für Belege und EPC-QR."""
    from ph_core.ph_core.doctype.ph_firma.ph_firma import standard_firma

    return frappe.get_cached_doc("PH Firma", standard_firma()).as_dict()


def ust_texte():
    e = faktura()
    return {"ig": e.get("ust_text_ig"), "rc": e.get("ust_text_rc"), "ausfuhr": e.get("ust_text_ausfuhr"), "oss": e.get("ust_text_oss"), "anzahlung": e.get("ust_text_anzahlung")}


def bankkonto():
    """Standard-Bankkonto für Zahlungsangaben: PH Bankkonto (standard) oder Fallback PH Firma."""
    name = faktura().get("standard_bankkonto") or frappe.db.get_value("PH Bankkonto", {"standard": 1, "aktiv": 1}, "name")
    if name:
        k = frappe.get_cached_doc("PH Bankkonto", name)
        return {"iban": k.iban, "bic": k.bic, "bank": k.bank, "kontoinhaber": k.kontoinhaber}
    f = firma()
    return {"iban": f.get("iban"), "bic": f.get("bic"), "bank": f.get("bank"), "kontoinhaber": f.get("firmenname")}


def doctype_vorhanden(name):
    return bool(frappe.db.exists("DocType", name))
