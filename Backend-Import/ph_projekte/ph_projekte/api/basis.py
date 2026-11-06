"""Gemeinsame Kundenprüfung der Portal-Methoden (ph_projekte.api und ph_projekte.api.tagebuch).

kunde_token: zufälliger Token aus portal_login_token; gespeichert wird nur der SHA-256-Hash in
PH Kontakt.portal_token_hash (ph_crm, PLAN.md WP2). Gültigkeit: PH Projekte Einstellungen.portal_token_tage
ab PH Kontakt.portal_letzter_login (wird bei jeder Token-Ausgabe gesetzt)."""

import frappe
from frappe import _
from frappe.utils import add_days, cint, get_datetime, now_datetime

from ph_core.api import ApiFehler, portal_kontakt_pruefen, text
from ph_projekte.utils import portal_sitzung as PS
from ph_projekte.utils.portal import ID_RE, token_hash

BERATER_STANDARD = {"name": "Ihr Platzhirsch-Beratungsteam", "email": "info@platzhirsch.studio", "phone": ""}
KONTAKT_FELDER = ("portal_aktiv", "portal_letzter_login", "email", "anrede", "vorname", "nachname", "firma", "telefon", "strasse", "plz", "ort", "land", "berater", "status")


def kontakt_meta_ok():
    if not frappe.db.exists("DocType", "PH Kontakt"):
        raise ApiFehler("unavailable", 503, _("PH Kontakt (ph_crm) ist nicht installiert."))
    meta = frappe.get_meta("PH Kontakt")
    if not meta.has_field("portal_token_hash"):
        raise ApiFehler("unavailable", 503, _("PH Kontakt.portal_token_hash fehlt (ph_crm, PLAN.md WP2)."))
    return meta


def kunde(kontakt, kunde_token):
    """Prüft kontakt + kunde_token. → Kontakt-Werte als dict (nur vorhandene Felder)."""
    kontakt = text(kontakt, 80)
    if not kontakt or not ID_RE.match(kontakt):
        raise ApiFehler("invalid", 400, _("kontakt fehlt."))
    meta = kontakt_meta_ok()
    # Mehrere gültige Tokens je Kontakt (PH Portal Sitzung, 60-website-backend-umstellung.md): Token einer Sitzung →
    # Prüfung hier (Ablauf je Sitzung, Aktivierung bei erster Nutzung). Sonst Altbestand über die zentrale Prüfung
    # ph_core.api.portal_kontakt_pruefen (portal_aktiv, sha256(kunde_token) == portal_token_hash).
    sitzung = sitzung_pruefen(kontakt, kunde_token)
    if sitzung is None:
        portal_kontakt_pruefen(kontakt, kunde_token)
    felder = ["name", "portal_token_hash"] + [f for f in KONTAKT_FELDER if meta.has_field(f)]
    k = frappe.db.get_value("PH Kontakt", kontakt, felder, as_dict=True)
    if not k:
        raise ApiFehler("not_found", 404, _("Kunde nicht gefunden."))
    if sitzung is not None and "portal_aktiv" in k and not cint(k.get("portal_aktiv")):
        raise ApiFehler("invalid_token", 404, _("Zugang ungültig."))
    if k.get("status") == "Gesperrt":
        raise ApiFehler("forbidden", 403, _("Portalzugang ist gesperrt."))
    if sitzung is None:
        tage = _token_tage()
        if k.get("portal_letzter_login") and get_datetime(k["portal_letzter_login"]) < add_days(now_datetime(), -tage):
            raise ApiFehler("expired", 410, _("Kunden-Token abgelaufen."))
    return k


def _token_tage():
    return cint(frappe.db.get_single_value("PH Projekte Einstellungen", "portal_token_tage")) or 30


def _sitzungen_da():
    return bool(frappe.db.exists("DocType", "PH Portal Sitzung"))


SITZUNG_FELDER = ["name", "kontakt", "status", "token_hash", "angefordert_am", "aktiviert_am", "letzter_zugriff", "ablauf_am"]


def sitzung_anlegen(kontakt, token, quelle="website"):
    """Login-Anfrage: neue Sitzung „Angefordert“; bestehende aktive Sitzungen bleiben gültig, überzählige offene
    Anforderungen (älteste) werden widerrufen. → Name der Sitzung"""
    from ph_core.api import ip_hash

    jetzt = now_datetime()
    s = frappe.get_doc({"doctype": "PH Portal Sitzung", "kontakt": kontakt, "status": "Angefordert", "token_hash": token_hash(token), "angefordert_am": jetzt,
                        "ablauf_am": PS.ablauf(jetzt, _token_tage()), "ip_hash": ip_hash(), "quelle": quelle})
    s.insert(ignore_permissions=True)
    _bereinigen(kontakt)
    return s.name


def _bereinigen(kontakt):
    offen = frappe.get_all("PH Portal Sitzung", filters={"kontakt": kontakt, "status": ("in", ("Angefordert", "Aktiv"))}, fields=SITZUNG_FELDER)
    jetzt = now_datetime()
    for s in offen:
        if PS.zustand(s, jetzt) == "expired":
            frappe.db.set_value("PH Portal Sitzung", s.name, {"status": "Abgelaufen"}, update_modified=False)
            s.status = "Abgelaufen"
    for name in PS.ueberzaehlig([s for s in offen if s.status in ("Angefordert", "Aktiv")]):
        frappe.db.set_value("PH Portal Sitzung", name, {"status": "Widerrufen", "widerrufen_am": jetzt, "widerruf_grund": _("Limit je Kontakt (älteste Sitzung)")}, update_modified=False)
    _kontakt_hash_nachziehen(kontakt)


def _kontakt_hash_nachziehen(kontakt, ausser=None):
    """PH Kontakt.portal_token_hash = Hash der jüngsten aktiven Sitzung (ph_faktura/ph_service/ph_kundenkarte prüfen über
    ph_core gegen dieses Feld). Ohne aktive Sitzung bleibt ein Alt-Token stehen, solange er nicht widerrufen wurde."""
    aktiv = frappe.get_all("PH Portal Sitzung", filters={"kontakt": kontakt, "status": "Aktiv"}, fields=SITZUNG_FELDER)
    neu = PS.nachfolger_hash(aktiv, ausser)
    alt = frappe.db.get_value("PH Kontakt", kontakt, "portal_token_hash")
    bekannt = alt and frappe.db.exists("PH Portal Sitzung", {"token_hash": alt})
    if neu and neu != alt:
        frappe.db.set_value("PH Kontakt", kontakt, "portal_token_hash", neu, update_modified=False)
    elif not neu and bekannt and frappe.db.get_value("PH Portal Sitzung", {"token_hash": alt}, "status") != "Aktiv":
        frappe.db.set_value("PH Kontakt", kontakt, "portal_token_hash", None, update_modified=False)


def sitzung_pruefen(kontakt, kunde_token):
    """Token einer PH Portal Sitzung? → Sitzungs-dict (aktiviert bei erster Nutzung) oder None (kein Sitzungs-Token).
    Fehler: invalid_token 404 (fremder Kontakt/widerrufen), expired 410."""
    if not kunde_token or not _sitzungen_da():
        return None
    s = frappe.db.get_value("PH Portal Sitzung", {"token_hash": token_hash(kunde_token)}, SITZUNG_FELDER, as_dict=True)
    if not s:
        return None
    if s.kontakt != kontakt:
        raise ApiFehler("invalid_token", 404, _("Zugang ungültig."))
    jetzt = now_datetime()
    z = PS.zustand(s, jetzt)
    if z == "revoked":
        raise ApiFehler("invalid_token", 404, _("Zugang ungültig."))
    if z == "expired":
        raise ApiFehler("expired", 410, _("Kunden-Token abgelaufen."))
    if s.status == "Angefordert":
        frappe.db.set_value("PH Portal Sitzung", s.name, {"status": "Aktiv", "aktiviert_am": jetzt, "letzter_zugriff": jetzt}, update_modified=False)
        s.update(status="Aktiv", aktiviert_am=jetzt)
        if frappe.get_meta("PH Kontakt").has_field("portal_letzter_login"):
            frappe.db.set_value("PH Kontakt", kontakt, "portal_letzter_login", jetzt, update_modified=False)
        _bereinigen(kontakt)
    elif not s.letzter_zugriff or get_datetime(s.letzter_zugriff) < frappe.utils.add_to_date(jetzt, minutes=-5):
        frappe.db.set_value("PH Portal Sitzung", s.name, "letzter_zugriff", jetzt, update_modified=False)
    return s


def sitzung_widerrufen(kontakt, kunde_token, grund=None):
    """Logout: nur die eigene Sitzung. Alt-Token (ohne Sitzung) → portal_token_hash leeren. → bool (etwas widerrufen)"""
    h = token_hash(kunde_token)
    if _sitzungen_da():
        name = frappe.db.get_value("PH Portal Sitzung", {"token_hash": h, "kontakt": kontakt, "status": ("in", ("Angefordert", "Aktiv"))}, "name")
        if name:
            frappe.db.set_value("PH Portal Sitzung", name, {"status": "Widerrufen", "widerrufen_am": now_datetime(), "widerruf_grund": (grund or _("Abgemeldet"))[:140]}, update_modified=False)
            _kontakt_hash_nachziehen(kontakt, ausser=name)
            return True
    import hmac

    alt = frappe.db.get_value("PH Kontakt", kontakt, "portal_token_hash")
    if alt and hmac.compare_digest(str(alt), h):
        frappe.db.set_value("PH Kontakt", kontakt, "portal_token_hash", None, update_modified=False)
        return True
    return False


def customer(k):
    """Customer-Form der Website (interface.js)."""
    anrede = k.get("anrede") or ""
    vor, nach = k.get("vorname") or "", k.get("nachname") or ""
    display = (f"{anrede} {nach}".strip() if anrede == "Familie" else " ".join(x for x in (vor, nach) if x)) or k.get("firma") or k["name"]
    berater = dict(BERATER_STANDARD)
    if k.get("berater"):
        u = frappe.db.get_value("User", k["berater"], ["full_name", "email", "phone"], as_dict=True)
        if u:
            berater = {"name": u.full_name or berater["name"], "email": u.email or berater["email"], "phone": u.phone or ""}
    adresse = None
    if k.get("strasse") or k.get("ort"):
        adresse = {"street": k.get("strasse") or "", "zip": k.get("plz") or "", "city": k.get("ort") or "", "country": k.get("land") or "AT"}
    return {
        "id": k["name"],
        "email": k.get("email") or "",
        "salutation": anrede if anrede in ("Frau", "Herr", "Familie") else "",
        "firstName": vor,
        "lastName": nach,
        "displayName": display,
        "phone": k.get("telefon") or "",
        "address": adresse,
        "advisor": berater,
    }


def projekt_des_kunden(kontakt, projekt):
    projekt = text(projekt, 80)
    if not projekt or not ID_RE.match(projekt):
        raise ApiFehler("invalid", 400, _("projekt fehlt."))
    p = frappe.db.get_value("PH Projekt", {"name": projekt, "kontakt": kontakt, "portal_sichtbar": 1}, "name")
    if not p:
        raise ApiFehler("not_found", 404, _("Projekt nicht gefunden."))
    return p


def team_oder_kunde(rolle, kontakt, kunde_token, projekt):
    """Tagebuch-Methoden: Website-Team (rolle=team, nur API-Token) oder Kunde (kontakt + kunde_token).
    → (rolle, kontakt_name, projekt_name)."""
    rolle = "team" if str(rolle or "").lower() == "team" else "kunde"
    projekt = text(projekt, 80)
    if rolle == "team":
        if not projekt or not frappe.db.exists("PH Projekt", projekt):
            raise ApiFehler("not_found", 404, _("Projekt nicht gefunden."))
        return rolle, frappe.db.get_value("PH Projekt", projekt, "kontakt"), projekt
    k = kunde(kontakt, kunde_token)
    return rolle, k["name"], projekt_des_kunden(k["name"], projekt)
