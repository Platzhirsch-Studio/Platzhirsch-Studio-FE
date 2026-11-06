"""Anbieter für den Hook-Vertrag „Kundenakte“ von ph_crm (ph_crm/ph_crm/kontakt360.py, README ph_crm):

  ph_kontakt_zeitleiste       zeitleiste(kontakt, vor=None, limit=30)
  ph_kontakt_datenauskunft    datenauskunft(kontakt)           – DSGVO Art. 15
  ph_kontakt_anonymisieren    anonymisieren(kontakt, ausfuehren=False) – DSGVO Art. 17
  ph_kontakt_zusammengefuehrt zusammengefuehrt(alt, neu)        – Karten folgen dem Kontakt, Dubletten zusammenführen

Kundenkarten-Daten haben keinen Geldwert und unterliegen keiner BAO-Aufbewahrung (Belege liegen in ph_kassa/
ph_faktura/ph_shop); sie werden bei Löschbegehren anonymisiert statt gelöscht, damit Nutzungsstatistik und
Jahreslimits ohne Personenbezug konsistent bleiben.
"""

from zoneinfo import ZoneInfo

import frappe
from frappe import _
from frappe.utils import cint, get_datetime, get_system_timezone, now_datetime

from ph_kundenkarte.utils import kartenregeln as kr

APP = "ph_kundenkarte"


def _iso(wert):
    if not wert:
        return None
    d = get_datetime(wert)
    if d.tzinfo is None:
        d = d.replace(tzinfo=ZoneInfo(get_system_timezone() or "Europe/Vienna"))
    return d.isoformat()


def _karten(kontakt):
    return frappe.get_all("PH Kundenkarte", filters={"kontakt": kontakt}, pluck="name")


# ── Zeitleiste ───────────────────────────────────────────────────────────────

def zeitleiste(kontakt, vor=None, limit=30):
    """Ereignisse der Karten (Ausstellung, Stufenwechsel, Sperre, Ersatz …), Einlösungen und Anträge."""
    limit = min(cint(limit) or 30, 200)
    karten = _karten(kontakt)
    ereignisse = []
    vor_dt = get_datetime(str(vor)[:19].replace("T", " ")) if vor else None
    if karten:
        f = {"kundenkarte": ("in", karten)}
        if vor_dt:
            f["zeitpunkt"] = ("<", vor_dt)
        for e in frappe.get_all("PH Kundenkarte Ereignis", filters=f, fields=["name", "kundenkarte", "art", "zeitpunkt", "alt", "neu", "hinweis"], order_by="zeitpunkt desc", limit=limit):
            wechsel = f" ({e.alt or '–'} → {e.neu or '–'})" if (e.alt or e.neu) else ""
            ereignisse.append({"zeit": _iso(e.zeitpunkt), "art": _("Kundenkarte"), "doctype": "PH Kundenkarte", "name": e.kundenkarte, "titel": f"{_(e.art)}{wechsel}", "text": (e.hinweis or "")[:300], "app": APP})
        f = {"kundenkarte": ("in", karten)}
        if vor_dt:
            f["eingeloest_am"] = ("<", vor_dt)
        for e in frappe.get_all("PH Kundenkarte Einloesung", filters=f, fields=["name", "vorteil_titel", "eingeloest_am", "status", "ort", "kundenkarte"], order_by="eingeloest_am desc", limit=limit):
            ereignisse.append({"zeit": _iso(e.eingeloest_am), "art": _("Vorteil"), "doctype": "PH Kundenkarte Einloesung", "name": e.name, "titel": _("Vorteil eingelöst: {0}").format(e.vorteil_titel or "–") + (f" ({_('storniert')})" if e.status == "Storniert" else ""), "text": _("{0} · Karte {1}").format(e.ort or "–", e.kundenkarte), "app": APP})
    f = {"kontakt": kontakt}
    if vor_dt:
        f["eingang"] = ("<", vor_dt)
    for a in frappe.get_all("PH Kundenkarte Antrag", filters=f, fields=["name", "eingang", "status", "quelle"], order_by="eingang desc", limit=limit):
        ereignisse.append({"zeit": _iso(a.eingang), "art": _("Kundenkarte"), "doctype": "PH Kundenkarte Antrag", "name": a.name, "titel": _("Antrag Kundenkarte ({0})").format(_(a.status)), "text": _("Quelle: {0}").format(a.quelle or "–"), "app": APP})
    ereignisse = [e for e in ereignisse if e["zeit"]]
    ereignisse.sort(key=lambda e: e["zeit"], reverse=True)
    return ereignisse[:limit]


# ── Datenauskunft ────────────────────────────────────────────────────────────

KARTE_FELDER = ["name", "status", "stufe", "stufe_seit", "kanal", "ausgestellt_am", "persoenlicher_berater", "geburtstag", "geburtstag_tag_monat", "jahresumsatz_cent", "gesamtumsatz_cent", "letzter_einkauf", "einwilligung_auswertung", "einwilligung_am", "einwilligung_textversion", "einwilligung_widerrufen_am", "gesperrt_am", "sperrgrund_art", "gekuendigt_am", "vorgaenger_karte", "nachfolger_karte", "zusammengefuehrt_in", "wallet_apple_erzeugt_am", "wallet_google_erzeugt_am"]
ANTRAG_FELDER = ["name", "eingang", "status", "quelle", "anrede", "vorname", "nachname", "email", "telefon", "plz", "ort", "sprache", "interessen", "geburtstag", "geburtstag_tag_monat", "nachricht", "vertragsdaten_akzeptiert", "bedingungen_version", "einwilligung_auswertung", "einwilligung_textversion", "einwilligung_newsletter", "newsletter_textversion", "einwilligung_zeitpunkt", "bestaetigt_am", "bestaetigt_kanal", "entschieden_am", "nachweis_art"]


def _json_sicher(d):
    return {k: (str(v) if v is not None and not isinstance(v, (int, float, str, bool)) else v) for k, v in dict(d).items()}


def datenauskunft(kontakt):
    """Alle Kundenkarten-Daten einer Person (ohne interne Notizen: permlevel 1, interne Bewertung – Hinweis im
    Abschnitt; ohne QR/Hashes/IP: technische Kennungen ohne Aussagewert für die Person)."""
    abschnitte = []
    karten = frappe.get_all("PH Kundenkarte", filters={"kontakt": kontakt}, fields=KARTE_FELDER)
    for k in karten:
        abschnitte.append({"abschnitt": _("Kundenkarte"), "doctype": "PH Kundenkarte", "name": k.name, "daten": _json_sicher(k)})
    namen = [k.name for k in karten]
    if namen:
        for e in frappe.get_all("PH Kundenkarte Einloesung", filters={"kundenkarte": ("in", namen)}, fields=["name", "kundenkarte", "vorteil_titel", "stufe", "eingeloest_am", "ort", "status", "bezug_doctype", "bezug", "kommentar", "storniert_am"], order_by="eingeloest_am"):
            abschnitte.append({"abschnitt": _("Kundenkarte – Einlösungen"), "doctype": "PH Kundenkarte Einloesung", "name": e.name, "daten": _json_sicher(e)})
        for e in frappe.get_all("PH Kundenkarte Ereignis", filters={"kundenkarte": ("in", namen)}, fields=["name", "kundenkarte", "art", "zeitpunkt", "alt", "neu", "hinweis"], order_by="zeitpunkt"):
            abschnitte.append({"abschnitt": _("Kundenkarte – Verlauf"), "doctype": "PH Kundenkarte Ereignis", "name": e.name, "daten": _json_sicher(e)})
    for a in frappe.get_all("PH Kundenkarte Antrag", filters={"kontakt": kontakt}, fields=ANTRAG_FELDER):
        abschnitte.append({"abschnitt": _("Kundenkarte – Anträge"), "doctype": "PH Kundenkarte Antrag", "name": a.name, "daten": _json_sicher(a)})
    return abschnitte


# ── Anonymisieren ────────────────────────────────────────────────────────────

def anonymisieren(kontakt, ausfuehren=False):
    karten = _karten(kontakt)
    einloesungen = frappe.get_all("PH Kundenkarte Einloesung", filters={"kundenkarte": ("in", karten)}, pluck="name") if karten else []
    antraege = frappe.get_all("PH Kundenkarte Antrag", filters={"kontakt": kontakt}, pluck="name")
    anzahl_ereignisse = frappe.db.count("PH Kundenkarte Ereignis", {"kundenkarte": ("in", karten)}) if karten else 0
    plan = kr.anonymisierungsplan(karten, einloesungen, antraege, anzahl_ereignisse)
    if not ausfuehren:
        return plan
    jetzt = now_datetime()
    for k in karten:
        status = frappe.db.get_value("PH Kundenkarte", k, "status")
        werte = {"kunde_name": kr.ANONYM, "titel": f"{kr.ANONYM} · {k}", "geburtstag": None, "geburtstag_tag_monat": None, "notizen_intern": None, "qr_svg": None, "wallet_pass_seriennummer": None, "ip_hash": None, "persoenlicher_berater": None, "einwilligung_auswertung": 0, "jahresumsatz_cent": 0, "gesamtumsatz_cent": 0, "letzter_einkauf": None, "anonymisiert_am": jetzt}
        if status in kr.OFFENE_STATUS:
            werte.update({"status": "Gekuendigt", "gekuendigt_am": jetzt.date(), "sperrgrund_art": "Datenschutz"})
        frappe.db.set_value("PH Kundenkarte", k, werte, update_modified=False)
    for e in einloesungen:
        frappe.db.set_value("PH Kundenkarte Einloesung", e, {"kunde_name": kr.ANONYM, "kommentar": None, "titel": kr.ANONYM}, update_modified=False)
    if karten:
        for e in frappe.get_all("PH Kundenkarte Ereignis", filters={"kundenkarte": ("in", karten)}, pluck="name"):
            frappe.db.set_value("PH Kundenkarte Ereignis", e, "hinweis", None, update_modified=False)
        for k in karten:
            from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_ereignis.ph_kundenkarte_ereignis import protokoll

            protokoll(k, "Anonymisierung", hinweis=_("DSGVO-Löschbegehren – personenbezogene Daten entfernt"))
    for a in antraege:
        frappe.db.set_value("PH Kundenkarte Antrag", a, {"vorname": kr.ANONYM, "nachname": kr.ANONYM, "email": f"{a.lower()}@anonym.invalid", "telefon": None, "plz": None, "ort": None, "geburtstag": None, "geburtstag_tag_monat": None, "interessen": None, "nachricht": None, "ip_hash": None, "doi_token_hash": None, "notizen_intern": None, "entscheidung_grund": None, "nachweis": None, "klick_id": None, "titel": f"{kr.ANONYM} · {a}", "anonymisiert_am": jetzt}, update_modified=False)
        for datei in frappe.get_all("File", filters={"attached_to_doctype": "PH Kundenkarte Antrag", "attached_to_name": a}, pluck="name"):
            frappe.delete_doc("File", datei, ignore_permissions=True, force=True)
    if frappe.db.exists("DocType", "PH Kontakt") and frappe.get_meta("PH Kontakt").has_field("ph_kundenkarte_karte"):
        frappe.db.set_value("PH Kontakt", kontakt, {"ph_kundenkarte_karte": None, "ph_kundenkarte_stufe": None}, update_modified=False)
    return plan


# ── Kontakt-Zusammenführung (ph_crm) ─────────────────────────────────────────

def zusammengefuehrt(alt, neu):
    """ph_crm hat Kontakt `alt` in `neu` zusammengeführt. Falls Links noch auf `alt` zeigen, umhängen; danach
    offene Karten am Kontakt `neu` zusammenführen (höhere Stufe bleibt, Einlösungen werden umgehängt)."""
    if not alt or not neu or alt == neu:
        return None
    for dt, feld in (("PH Kundenkarte", "kontakt"), ("PH Kundenkarte Einloesung", "kontakt"), ("PH Kundenkarte Antrag", "kontakt")):
        for n in frappe.get_all(dt, filters={feld: alt}, pluck="name"):
            frappe.db.set_value(dt, n, feld, neu, update_modified=False)
    from ph_kundenkarte.ph_kundenkarte import lebenszyklus

    offen = lebenszyklus.offene_karten_des_kontakts(neu)
    if len(offen) < 2:
        if offen:
            frappe.get_doc("PH Kundenkarte", offen[0])._kontakt_spiegeln()
        return None
    return lebenszyklus.zusammenfuehren(offen)
