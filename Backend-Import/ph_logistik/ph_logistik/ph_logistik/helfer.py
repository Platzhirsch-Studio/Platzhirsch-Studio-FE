"""Gemeinsame Hilfen der Logistik-Controller (Frappe)."""

import frappe
from frappe import _
from frappe.utils import now_datetime


def einstellungen():
    """PH Logistik Einstellungen als dict (gecacht, Cache fällt beim Speichern der Single)."""
    key = "ph_logistik:einstellungen"
    d = frappe.cache().get_value(key)
    if d is None:
        doc = frappe.get_single("PH Logistik Einstellungen")
        d = doc.as_dict()
        d["letmeship_env"] = frappe.conf.get("ph_letmeship_env") or "test"
        d["letmeship_konfiguriert"] = bool(frappe.conf.get("ph_letmeship_api_id") and frappe.conf.get("ph_letmeship_api_password"))
        frappe.cache().set_value(key, d, expires_in_sec=300)
    return d


def cache_leeren():
    frappe.cache().delete_value("ph_logistik:einstellungen")


def setze_status(doc, status, **weitere):
    """Status UND workflow_state („PH <Status>“) setzen, damit Server-Aktionen und Workflow zusammenpassen.
    Schreibt per db_set (keine erneute Validierung) und ergänzt einen Kommentar."""
    werte = {"status": status, **weitere}
    if frappe.get_meta(doc.doctype).has_field("workflow_state"):
        werte["workflow_state"] = f"PH {status}"
    doc.db_set(werte, notify=True)
    for k, v in werte.items():
        setattr(doc, k, v)
    doc.add_comment("Info", _("Status: {0}").format(_(status)))


def absender():
    e = einstellungen()
    return {
        "firma": e.get("absender_firma") or "Platzhirsch Home Living",
        "name": e.get("absender_firma") or "Platzhirsch Home Living",
        "strasse": e.get("absender_strasse") or "",
        "hausnr": e.get("absender_hausnr") or "",
        "plz": e.get("absender_plz") or "",
        "ort": e.get("absender_ort") or "",
        "land": e.get("absender_land") or "AT",
        "email": e.get("absender_email") or "",
        "telefon": e.get("absender_telefon") or "",
    }


def naechster_werktag(tage=1):
    from frappe.utils import add_days, getdate

    d = getdate(add_days(now_datetime(), max(int(tage or 1), 1)))
    while d.weekday() >= 5:
        d = add_days(d, 1)
    return d


def feld_existiert(doctype, fieldname):
    try:
        return frappe.db.exists("DocType", doctype) and frappe.get_meta(doctype).has_field(fieldname)
    except Exception:  # noqa: BLE001
        return False


def produkt_info(produkt):
    """Bezeichnung, Marke, EAN, Slug, Zerbrechlich, Gewicht, Maße, Paketprofil eines PH Produkt.
    Feldnamen laut ph_sortiment, geprüft 04.11. (ph_logistik_paketprofil = eigenes Custom Field)."""
    if not produkt or not frappe.db.exists("DocType", "PH Produkt"):
        return {}
    felder = ["titel", "name_herstellerbezeichnung", "marke", "ean", "slug", "zerbrechlich", "gewicht_g", "versand_laenge_cm", "versand_breite_cm", "versand_hoehe_cm", "pakettyp", "gefahrgut_pruefen", "versand_gesperrt_grund", "lagerartikel", "sofort_lieferbar", "kategorie", "bild_hauptbild"]
    if frappe.get_meta("PH Produkt").has_field("ph_logistik_paketprofil"):
        felder.append("ph_logistik_paketprofil")
    w = frappe.db.get_value("PH Produkt", produkt, felder, as_dict=True) or {}
    return {
        "beschreibung": w.get("titel") or w.get("name_herstellerbezeichnung") or produkt,
        "marke": w.get("marke"),
        "ean": w.get("ean"),
        "slug": w.get("slug"),
        "zerbrechlich": int(w.get("zerbrechlich") or 0),
        "gewicht_g": w.get("gewicht_g"),
        "laenge_cm": w.get("versand_laenge_cm"),
        "breite_cm": w.get("versand_breite_cm"),
        "hoehe_cm": w.get("versand_hoehe_cm"),
        "pakettyp": w.get("pakettyp"),
        "gefahrgut_pruefen": int(w.get("gefahrgut_pruefen") or 0),
        "versand_gesperrt_grund": w.get("versand_gesperrt_grund"),
        "lagerartikel": int(w.get("lagerartikel") or 0),
        "sofort_lieferbar": int(w.get("sofort_lieferbar") or 0),
        "paketprofil": w.get("ph_logistik_paketprofil") or (w.get("pakettyp") if w.get("pakettyp") and frappe.db.exists("PH Paketprofil", w.get("pakettyp")) else None),
        "kategorie": w.get("kategorie"),
        "bild": w.get("bild_hauptbild"),
    }


def mail_senden(empfaenger, betreff, html, referenz_doctype=None, referenz_name=None, anhaenge=None):
    """Über ph_core.utils.mail.sende (Testmodus-Umleitung dort). Fehler nur protokollieren."""
    try:
        from ph_core.utils.mail import sende

        sende(empfaenger, betreff, html, anhaenge=anhaenge, referenz_doctype=referenz_doctype, referenz_name=referenz_name)
        return True
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_logistik: Mailversand fehlgeschlagen")
        return False


def idempotent(schluessel, fn, ttl_sekunden=172800):
    """Wiederholte Aufrufe mit gleichem Schlüssel (Offline-Puffer, Doppelklick) liefern das erste Ergebnis, ohne erneut auszuführen.
    Ohne Schlüssel: direkt ausführen. Speicher: Redis-Cache (48 h) – reicht für Puffer, ist kein Journal."""
    if not schluessel:
        return fn()
    key = f"ph_logistik:idem:{schluessel}"
    alt = frappe.cache().get_value(key)
    if alt is not None:
        return alt
    ergebnis = fn()
    frappe.cache().set_value(key, ergebnis if ergebnis is not None else True, expires_in_sec=ttl_sekunden)
    return ergebnis
