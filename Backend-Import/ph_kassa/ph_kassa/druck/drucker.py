"""Druckausgabe mit Frappe-Anbindung: Beleg-dict aufbauen, ESC/POS an Druckserver/QZ Tray, PDF-Rückfall.

Modi (PH Kassa Einstellungen.bondrucker_modus, je Kasse überschreibbar durch PH Kasse.bon_drucker, WP10a):
  „ESC-POS Druckserver“ – POST der Rohbytes (application/octet-stream) an druckserver_url
                          (kleiner Dienst im Showroom-LAN, z. B. Raspberry Pi mit USB-Bondrucker).
  „QZ Tray“             – Bytes gehen Base64 an den Browser; die Kassa-Page übergibt sie an QZ Tray
                          (Zertifikat/Signatur für QZ liegt beim Admin, nicht hier).
  „PDF 80 mm“ / „PDF A4“ – Standard-Druckformate (print_format/) als PDF.
Keine Geheimnisse: Druckserver-URL ist Konfiguration (LAN), kein Schlüssel.
"""

from __future__ import annotations

import base64

import frappe
from frappe import _
from frappe.utils import now_datetime

from .bon import bon_bytes, bon_text

PRINT_FORMAT_BON = "PH Kassenbeleg Bon 80mm"
PRINT_FORMAT_A4 = "PH Kassenbeleg A4"


def einstellungen() -> dict:
    from ph_kassa.ph_kassa.doctype.ph_kassa_einstellungen.ph_kassa_einstellungen import einstellungen as e

    return e()


def firma_dict() -> dict:
    from ph_core.utils.druck import ph_firma

    f = ph_firma()
    return {k: f.get(k) for k in ("firmenname", "kurzname", "marke", "strasse", "plz", "ort", "land", "uid", "telefon", "email", "website")}


def beleg_dict(beleg) -> dict:
    """PH Kassenbeleg (Document oder Name) → flaches dict für bon.py (Feldnamen laut PLAN.md WP10a)."""
    if isinstance(beleg, str):
        beleg = frappe.get_doc("PH Kassenbeleg", beleg)
    d = beleg.as_dict() if hasattr(beleg, "as_dict") else dict(beleg)
    kunde_name = None
    if d.get("kontakt") and frappe.db.exists("DocType", "PH Kontakt"):
        kunde_name = frappe.db.get_value("PH Kontakt", d["kontakt"], "titel") or d["kontakt"]
    bediener_name = bediener_kurz(d.get("bediener") or frappe.session.user)
    positionen = []
    for p in d.get("positionen") or []:
        p = dict(p)
        positionen.append({k: p.get(k) for k in ("art", "produkt", "bezeichnung", "menge", "einzel_brutto_cent", "brutto_cent", "netto_cent", "ust_cent", "steuersatz", "zusatz")})
    zahlarten = []
    for z in d.get("zahlarten") or []:
        z = dict(z)
        eintrag = {k: z.get(k) for k in ("zahlart", "betrag_cent", "gegeben_cent", "retour_cent")}
        if z.get("gutschein") and frappe.db.exists("DocType", "PH Gutschein"):
            eintrag["gutschein_letzte4"] = frappe.db.get_value("PH Gutschein", z["gutschein"], "code_letzte4")
        zahlarten.append(eintrag)
    return {
        "name": d.get("name"),
        "belegnummer": d.get("belegnummer"),
        "kassen_id": d.get("kasse"),
        "datum_uhrzeit": d.get("datum_uhrzeit"),
        "belegart": d.get("belegart") or "Standard",
        "trainings": d.get("trainings"),
        "storno_von": d.get("storno_von"),
        "positionen": positionen,
        "gesamt_cent": d.get("gesamt_cent") or 0,
        "zahlarten": zahlarten,
        "maschinenlesbarer_code": d.get("maschinenlesbarer_code"),
        "see_ausgefallen": d.get("see_ausgefallen"),
        "bediener_name": bediener_name,
        "kunde_name": kunde_name,
    }


def bediener_kurz(user):
    """Bon zeigt nur Kürzel/Vornamen (Fachkritik 21 R2/P10, DSGVO Datenminimierung) – ph_core_kurzname oder Vorname."""
    meta = frappe.get_meta("User")
    felder = ["first_name", "full_name"] + (["ph_core_kurzname"] if meta.has_field("ph_core_kurzname") else [])
    u = frappe.db.get_value("User", user, felder, as_dict=True) or {}
    return u.get("ph_core_kurzname") or u.get("first_name") or (u.get("full_name") or "").split(" ")[0] or None


def schublade_auftrag(kasse) -> dict:
    """Nur Kassenlade öffnen (ESC p), ohne Beleg – Wechselgeld (Ereignis protokolliert die Page)."""
    from ph_kassa.druck.escpos import EscPos

    einst = einstellungen()
    modus = _modus_normalisieren(frappe.db.get_value("PH Kasse", kasse, "bon_drucker") if frappe.db.exists("DocType", "PH Kasse") else None) or einst["bondrucker_modus"]
    roh = EscPos().init().schublade().bytes()
    if modus == "ESC-POS Druckserver":
        url = (frappe.db.get_value("PH Kasse", kasse, "drucker_adresse") if frappe.db.exists("DocType", "PH Kasse") else None) or einst["druckserver_url"]
        return {"modus": modus, "gesendet": _an_druckserver(roh, url)}
    if modus == "QZ Tray":
        return {"modus": modus, "escpos_base64": base64.b64encode(roh).decode("ascii"), "qz_drucker_name": einst["qz_drucker_name"]}
    return {"modus": modus, "hinweis": _("Kein ESC/POS-Drucker – Lade manuell öffnen.")}


def druckauftrag(beleg, modus: str | None = None, schublade: bool = False) -> dict:
    """Erzeugt den Druckauftrag für die Kassa-Page.

    Rückgabe: {"modus": …, "escpos_base64": …} | {"modus": "PDF …", "pdf_url": …} | {"modus": "ESC-POS Druckserver", "gesendet": True}
    """
    einst = einstellungen()
    kasse_modus = None
    druckserver_url = einst["druckserver_url"]
    name = beleg if isinstance(beleg, str) else beleg.name
    kasse = frappe.db.get_value("PH Kassenbeleg", name, "kasse") if name else None
    if kasse and frappe.db.exists("DocType", "PH Kasse"):
        meta = frappe.get_meta("PH Kasse")
        if meta.has_field("bon_drucker"):
            kasse_modus = frappe.db.get_value("PH Kasse", kasse, "bon_drucker")
        if meta.has_field("drucker_adresse"):
            # PH Kasse.drucker_adresse (WP10a) überschreibt die Druckserver-URL der Einstellungen je Kasse.
            druckserver_url = frappe.db.get_value("PH Kasse", kasse, "drucker_adresse") or druckserver_url
    modus = modus or _modus_normalisieren(kasse_modus) or einst["bondrucker_modus"]
    firma = firma_dict()
    daten = beleg_dict(beleg)
    ergebnis = {"modus": modus, "beleg": name, "vorschau": bon_text(daten, firma, einst)}

    if modus in ("ESC-POS Druckserver", "QZ Tray"):
        rohbytes = bon_bytes(daten, firma, einst, schublade=schublade and einst["schublade_oeffnen"])
        if modus == "ESC-POS Druckserver":
            ergebnis["gesendet"] = _an_druckserver(rohbytes, druckserver_url)
        else:
            ergebnis["escpos_base64"] = base64.b64encode(rohbytes).decode("ascii")
            ergebnis["qz_drucker_name"] = einst["qz_drucker_name"]
    else:
        pf = PRINT_FORMAT_BON if modus == "PDF 80 mm" else PRINT_FORMAT_A4
        ergebnis["pdf_url"] = f"/api/method/frappe.utils.print_format.download_pdf?doctype=PH%20Kassenbeleg&name={frappe.utils.quote(name)}&format={frappe.utils.quote(pf)}&no_letterhead=1"
    _gedruckt_markieren(name)
    return ergebnis


def _modus_normalisieren(kasse_modus):
    # PH Kasse.bon_drucker (WP10a): "PDF A4" / "ESC-POS Druckserver" / "QZ Tray"
    return kasse_modus if kasse_modus in ("PDF A4", "PDF 80 mm", "ESC-POS Druckserver", "QZ Tray") else None


def _an_druckserver(rohbytes: bytes, url: str) -> bool:
    if not url:
        frappe.throw(_("Kein Druckserver eingetragen (PH Kassa Einstellungen → Druckserver-URL)."))
    import requests

    try:
        r = requests.post(url, data=rohbytes, headers={"Content-Type": "application/octet-stream"}, timeout=8)
        r.raise_for_status()
        return True
    except Exception as e:  # noqa: BLE001
        frappe.log_error(title="PH Kassa: Druckserver nicht erreichbar", message=str(e))
        frappe.throw(_("Bondrucker nicht erreichbar. Beleg ist gebucht – bitte „Letzten Bon nachdrucken“ oder PDF verwenden."))
    return False


def _gedruckt_markieren(name):
    try:
        if name and frappe.get_meta("PH Kassenbeleg").has_field("gedruckt_am"):
            frappe.db.set_value("PH Kassenbeleg", name, "gedruckt_am", now_datetime(), update_modified=False)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Kassa: gedruckt_am konnte nicht gesetzt werden")


def pdf_bytes(name: str, print_format: str = PRINT_FORMAT_A4) -> bytes:
    from frappe.utils.pdf import get_pdf
    from frappe.www.printview import get_html_and_style

    html = get_html_and_style(frappe.get_doc("PH Kassenbeleg", name), print_format=print_format, no_letterhead=1)["html"]
    return get_pdf(html)
