"""Kundenakte-Anbieter von ph_shop für den Hook-Vertrag von ph_crm (hooks.py: ph_kontakt_*).

  zeitleiste(kontakt, vor=None, limit=30)  → [{zeit, art, doctype, name, titel, text, app}]
  datenauskunft(kontakt)                   → [{abschnitt, doctype, name, daten}]   (Art. 15 DSGVO)
  anonymisieren(kontakt, ausfuehren=False) → [{doctype, name, aktion, grund, frist_bis}]  (Art. 17 DSGVO / § 132 BAO)
  zusammengefuehrt(alt, neu)               → Anzahl nachgezogener Datensätze

Zuordnung: Link-Feld auf PH Kontakt, sonst E-Mail-Abgleich (PH Widerruf kennt nur kunde_email; Website-Bestellungen
ohne Kontakt). Codes/Hashes (Gutschein-Code, Kunden-Token) werden nie ausgegeben.
"""

import frappe
from frappe import _
from frappe.utils import cint, get_datetime, get_system_timezone

from ph_shop import aufbewahrung as ab

APP = "ph_shop"
# doctype, Kontakt-Link, E-Mail-Feld, Zeitfeld, Art (Zeitleiste)
QUELLEN = (
    ("PH Bestellung", "kontakt", "kunde_email", "angelegt", "Bestellung"),
    ("PH Gutschein Bestellung", "kontakt", "kaeufer_email", "erstellt", "Gutscheinkauf"),
    ("PH Gutschein", "kaeufer_kontakt", "kaeufer_email", "ausgegeben_am", "Gutschein"),
    ("PH Anzahlung", "kontakt", "kunde_email", "erstellt", "Anzahlung"),
    ("PH Zahlung", "kontakt", None, "zeitpunkt", "Zahlung"),
    ("PH Widerruf", None, "kunde_email", "eingegangen_am", "Widerruf"),
)
AUSKUNFT_FELDER = {
    "PH Bestellung": ("name", "angelegt", "status", "bestellart", "lieferart", "gesamt_cent", "kunde_name", "kunde_email", "kunde_telefon", "adresse_land", "adresse_plz", "adresse_ort", "adresse_strasse", "adresse_hausnr", "rechnung_name", "rechnung_adresse", "notiz_kunde", "bezahlt_am", "versendet_am", "abgeholt_am", "erstattet_cent", "agb_stand", "einwilligung_zeit"),
    "PH Gutschein Bestellung": ("name", "erstellt", "status", "kaeufer_name", "kaeufer_email", "kaeufer_firma", "rechnung_name", "rechnung_adresse"),
    "PH Gutschein": ("name", "ausgegeben_am", "status", "wert_cent", "rest_cent", "code_letzte4", "gueltig_bis", "empfaenger", "grusstext", "kaeufer_name", "kaeufer_email"),
    "PH Anzahlung": ("name", "erstellt", "status", "kunde_email"),
    "PH Zahlung": ("name", "zeitpunkt", "art", "kanal", "status", "betrag_cent", "erstattet_cent", "bezug_doctype", "bezug"),
    "PH Widerruf": ("name", "eingegangen_am", "status", "kunde_name", "kunde_email", "anschrift", "bestellung"),
}
PERSONENFELDER = {
    "PH Bestellung": (ab.BESTELLUNG_PERSON, "kunde_email"),
    "PH Gutschein Bestellung": (("kaeufer_name", "kaeufer_firma", "rechnung_name", "rechnung_adresse"), "kaeufer_email"),
    "PH Gutschein": (("kaeufer_name", "kaeufer_firma", "empfaenger", "grusstext"), "kaeufer_email"),
    "PH Anzahlung": ((), "kunde_email"),
    "PH Zahlung": ((), None),
    "PH Widerruf": (("kunde_name", "anschrift"), "kunde_email"),
}


def _email(kontakt):
    return (frappe.db.get_value("PH Kontakt", kontakt, "email") or "").strip().lower() if frappe.db.exists("PH Kontakt", kontakt) else ""


def _namen(dt, link, email_feld, kontakt, email):
    """Datensätze eines DocTypes zum Kontakt (Link oder gleiche E-Mail)."""
    if not frappe.db.exists("DocType", dt):
        return []
    meta = frappe.get_meta(dt)
    namen = set()
    if link and meta.has_field(link):
        namen.update(frappe.get_all(dt, {link: kontakt}, pluck="name", limit=500))
    if email and email_feld and meta.has_field(email_feld):
        namen.update(frappe.get_all(dt, {email_feld: email}, pluck="name", limit=500))
    return sorted(namen)


def _iso(wert):
    if not wert:
        return None
    from zoneinfo import ZoneInfo

    dt = get_datetime(wert)
    return (dt if dt.tzinfo else dt.replace(tzinfo=ZoneInfo(get_system_timezone()))).isoformat()


def zeitleiste(kontakt, vor=None, limit=30):
    email = _email(kontakt)
    vor_dt = get_datetime(vor) if vor else None
    out = []
    for dt, link, email_feld, zeit_feld, art in QUELLEN:
        for name in _namen(dt, link, email_feld, kontakt, email):
            meta = frappe.get_meta(dt)
            felder = [zeit_feld, "status"] + [f for f in ("titel", "gesamt_cent", "betrag_cent", "wert_cent") if meta.has_field(f)]
            d = frappe.db.get_value(dt, name, felder, as_dict=True) or {}
            zeit = d.get(zeit_feld)
            if not zeit or (vor_dt and get_datetime(zeit).replace(tzinfo=None) >= vor_dt.replace(tzinfo=None)):
                continue
            betrag = d.get("gesamt_cent") or d.get("betrag_cent") or d.get("wert_cent")
            text = _("Status {0}").format(d.get("status") or "–") + (f" · {cint(betrag) / 100:.2f} €" if betrag else "")
            out.append({"zeit": _iso(zeit), "art": art, "doctype": dt, "name": name, "titel": d.get("titel") or f"{art} {name}", "text": text, "app": APP})
    out.sort(key=lambda e: e["zeit"] or "", reverse=True)
    return out[: cint(limit) or 30]


def datenauskunft(kontakt):
    email = _email(kontakt)
    out = []
    for dt, link, email_feld, _zeit, art in QUELLEN:
        felder = [f for f in AUSKUNFT_FELDER[dt] if f == "name" or (frappe.db.exists("DocType", dt) and frappe.get_meta(dt).has_field(f))]
        for name in _namen(dt, link, email_feld, kontakt, email):
            daten = frappe.db.get_value(dt, name, felder, as_dict=True) or {}
            out.append({"abschnitt": _("Shop · {0}").format(art), "doctype": dt, "name": name, "daten": {k: (str(v) if v is not None and not isinstance(v, (int, float, str)) else v) for k, v in daten.items()}})
    out.extend(_wunschliste_auskunft(kontakt, email))
    return out


# Wunschliste: kein Beleg (keine BAO-Frist) – eigene Liste des Kontakts löschen, Beiträge (Schenkende per E-Mail)
# anonymisieren. Hashes (Teilen/Verwaltung/Storno) werden nie ausgegeben.
WL_FELDER = ("name", "erstellt_am", "status", "ref", "anlass", "anlass_datum", "listen_titel", "nachricht", "laeuft_ab_am")
WL_BEITRAG_FELDER = ("parent", "zeitpunkt", "schenker_name", "schenker_email", "gruss", "betrag_cent", "kanal", "status")


def _wunschliste_da():
    return frappe.db.exists("DocType", "PH Wunschliste")


def _wunschliste_auskunft(kontakt, email):
    if not _wunschliste_da():
        return []
    out = []
    for d in frappe.get_all("PH Wunschliste", {"kontakt": kontakt}, list(WL_FELDER), limit=200):
        out.append({"abschnitt": _("Shop · Wunschliste"), "doctype": "PH Wunschliste", "name": d.name, "daten": {k: (str(v) if v is not None and not isinstance(v, (int, float, str)) else v) for k, v in d.items()}})
    if email:
        for d in frappe.get_all("PH Wunschliste Beitrag", {"schenker_email": email, "parenttype": "PH Wunschliste"}, ["name", *WL_BEITRAG_FELDER], limit=500):
            out.append({"abschnitt": _("Shop · Beitrag zu einer Wunschliste"), "doctype": "PH Wunschliste", "name": d.parent, "daten": {k: (str(v) if v is not None and not isinstance(v, (int, float, str)) else v) for k, v in d.items() if k != "name"}})
    return out


def _wunschliste_anonymisieren(kontakt, email, ausfuehren):
    if not _wunschliste_da():
        return []
    out = []
    for name in frappe.get_all("PH Wunschliste", {"kontakt": kontakt}, pluck="name", limit=200):
        out.append({"doctype": "PH Wunschliste", "name": name, "aktion": "loeschen", "grund": _("Wunschliste ohne Aufbewahrungspflicht"), "frist_bis": None})
        if cint(ausfuehren):
            frappe.delete_doc("PH Wunschliste", name, ignore_permissions=True, force=True)
    if email:
        for b in frappe.get_all("PH Wunschliste Beitrag", {"schenker_email": email, "parenttype": "PH Wunschliste"}, ["name", "parent"], limit=500):
            out.append({"doctype": "PH Wunschliste", "name": b.parent, "aktion": "anonymisieren", "grund": _("Beitrag zur Wunschliste"), "frist_bis": None})
            if cint(ausfuehren):
                frappe.db.set_value("PH Wunschliste Beitrag", b.name, {"schenker_name": ab.ANONYM, "schenker_email": None, "gruss": "", "name_anzeigen": 0}, update_modified=False)
    return out


def _belegdatum(dt, name):
    feld = next(q[3] for q in QUELLEN if q[0] == dt)
    return frappe.db.get_value(dt, name, feld) or frappe.db.get_value(dt, name, "creation")


def anonymisieren(kontakt, ausfuehren=False):
    """Vorschlag (ausfuehren=False) bzw. Durchführung. Innerhalb der BAO-Frist: aufbewahren, nur entbehrliche Felder
    (Telefon, Token-/IP-Hash) entfernen; Gutscheine mit Restwert: aufbewahren; danach: Personenfelder anonymisieren
    und Kontakt-Links lösen (damit der Kontakt gelöscht werden kann)."""
    email = _email(kontakt)
    out = []
    for dt, link, email_feld, _zeit, _art in QUELLEN:
        for name in _namen(dt, link, email_feld, kontakt, email):
            rest = cint(frappe.db.get_value(dt, name, "rest_cent")) if dt == "PH Gutschein" else 0
            aktion, grund, frist = ab.entscheidung(_belegdatum(dt, name), restwert_cent=rest)
            out.append({"doctype": dt, "name": name, "aktion": aktion, "grund": grund, "frist_bis": frist.isoformat() if frist else None})
            if not cint(ausfuehren):
                continue
            meta = frappe.get_meta(dt)
            if aktion == "aufbewahren":
                if dt == "PH Bestellung":
                    frappe.db.set_value(dt, name, {f: None for f in ab.BESTELLUNG_SOFORT if meta.has_field(f)}, update_modified=False)
                continue
            felder, email_f = PERSONENFELDER[dt]
            werte = {k: v for k, v in ab.anonym_werte([f for f in felder if meta.has_field(f)], email_f if email_f and meta.has_field(email_f) else None).items()}
            if link and meta.has_field(link):
                werte[link] = None
            if dt == "PH Bestellung":
                werte.update({f: None for f in ab.BESTELLUNG_SOFORT if meta.has_field(f)})
            if werte:
                frappe.db.set_value(dt, name, werte, update_modified=False)
                frappe.get_doc(dt, name).add_comment("Info", _("Personenbezug entfernt (Art. 17 DSGVO, Kontakt {0})").format(kontakt))
    out.extend(_wunschliste_anonymisieren(kontakt, email, ausfuehren))
    return out


def zusammengefuehrt(alt, neu):
    """Nach rename_doc(merge=True) sind Link-Felder schon umgehängt. Nachziehen: Datensätze ohne Kontakt-Link mit
    der E-Mail des Ziels (z. B. Website-Bestellungen als Gast) dem Ziel zuordnen."""
    email = _email(neu)
    if not email:
        return 0
    n = 0
    for dt, link, email_feld, _zeit, _art in QUELLEN:
        if not (link and email_feld and frappe.db.exists("DocType", dt)):
            continue
        meta = frappe.get_meta(dt)
        if not (meta.has_field(link) and meta.has_field(email_feld)):
            continue
        for name in frappe.get_all(dt, {email_feld: email, link: ("is", "not set")}, pluck="name", limit=500):
            frappe.db.set_value(dt, name, link, neu, update_modified=False)
            n += 1
    return n
