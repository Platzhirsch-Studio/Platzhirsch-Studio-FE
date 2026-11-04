"""Gemeinsame Kundenprüfung der Portal-Methoden (ph_projekte.api und ph_projekte.api.tagebuch).

kunde_token: zufälliger Token aus portal_login_token; gespeichert wird nur der SHA-256-Hash in
PH Kontakt.portal_token_hash (ph_crm, PLAN.md WP2). Gültigkeit: PH Projekte Einstellungen.portal_token_tage
ab PH Kontakt.portal_letzter_login (wird bei jeder Token-Ausgabe gesetzt)."""

import frappe
from frappe import _
from frappe.utils import add_days, cint, get_datetime, now_datetime

from ph_core.api import ApiFehler, portal_kontakt_pruefen, text
from ph_projekte.utils.portal import ID_RE

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
    # Zentrale Prüfung (ph_core.api.portal_kontakt_pruefen): Kontakt vorhanden, portal_aktiv, sha256(kunde_token) ==
    # portal_token_hash – identisch für ph_projekte, ph_faktura, ph_service. Fehler: unavailable 503, not_found 404,
    # invalid_token 404 (auch bei inaktivem Portalzugang).
    portal_kontakt_pruefen(kontakt, kunde_token)
    felder = ["name", "portal_token_hash"] + [f for f in KONTAKT_FELDER if meta.has_field(f)]
    k = frappe.db.get_value("PH Kontakt", kontakt, felder, as_dict=True)
    if not k:
        raise ApiFehler("not_found", 404, _("Kunde nicht gefunden."))
    if k.get("status") == "Gesperrt":
        raise ApiFehler("forbidden", 403, _("Portalzugang ist gesperrt."))
    tage = cint(frappe.db.get_single_value("PH Projekte Einstellungen", "portal_token_tage")) or 30
    if k.get("portal_letzter_login") and get_datetime(k["portal_letzter_login"]) < add_days(now_datetime(), -tage):
        raise ApiFehler("expired", 410, _("Kunden-Token abgelaufen."))
    return k


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
