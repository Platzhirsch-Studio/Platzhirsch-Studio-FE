"""SSO-Brücke Next.js-Backoffice ↔ Frappe (Inhaber-Entscheidung Nr. 52: „Backoffice muss mit Microsoft-Login gehen“).

Ablauf (README „Schnittstelle für das Backoffice“):
  Backoffice /auth/microsoft/callback (Authorization Code + PKCE, nonce geprüft) → id_token
  → POST ph_microsoft.api.sso_sitzung {id_token} (Gast, strenges Rate-Limit)
  → hier: Signatur/Claims selbst prüfen, Frappe-User zuordnen, Rollen aus Gruppen, Sitzung login_as(user)
  → {user, name, kurzname, roles, standort, sid}; das Backoffice speichert sid serverseitig (wie beim Passwort-Login).
"""

import hashlib
import hmac

import frappe
import requests
from frappe import _
from frappe.utils import cint, now_datetime

from ph_core.api import ApiFehler
from ph_microsoft.logik import gruppen as G
from ph_microsoft.logik.jwt_pruefung import TokenFehler, identitaet, jwks_index, pruefen
from ph_microsoft.ph_microsoft.einstellungen import einstellungen, gruppen_zuordnung
from ph_microsoft.ph_microsoft.protokoll import eintrag

JWKS_URL = "https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys"
JWKS_CACHE_SEKUNDEN = 24 * 3600
JWKS_NEU_SPERRE_SEKUNDEN = 300


def _jwks_laden(tenant):
    r = requests.get(JWKS_URL.format(tenant=tenant), timeout=6)
    r.raise_for_status()
    return jwks_index(r.json())


def schluessel_quelle(tenant):
    """(kid, neu_laden) → jwk. Cache 24 h in Redis; Neuladen bei unbekannter kid höchstens alle 5 min
    (Schlüsselwechsel bei Microsoft, Schutz gegen erfundene kids)."""
    key = f"ph_microsoft:jwks:{tenant}"

    def holen(kid, neu_laden):
        cache = frappe.cache()
        index = cache.get_value(key)
        if neu_laden or not index:
            if neu_laden and cache.get_value(key + ":gesperrt"):
                return (index or {}).get(kid)
            try:
                index = _jwks_laden(tenant)
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Microsoft SSO: JWKS nicht abrufbar")
                raise ApiFehler("unavailable", 503, _("Microsoft-Schlüssel nicht abrufbar."))
            cache.set_value(key, index, expires_in_sec=JWKS_CACHE_SEKUNDEN)
            if neu_laden:
                cache.set_value(key + ":gesperrt", 1, expires_in_sec=JWKS_NEU_SPERRE_SEKUNDEN)
        return (index or {}).get(kid)

    return holen


def _bruecken_schluessel_pruefen():
    """Optional: site_config ph_ms_sso_bridge_secret gesetzt → Header X-PH-Backoffice-Key muss passen.
    Standard aus (Abstimmung mit dem Backoffice: Aufruf ohne Service-Token)."""
    geheim = frappe.conf.get("ph_ms_sso_bridge_secret")
    if not geheim:
        return
    req = getattr(frappe.local, "request", None)
    gesendet = req.headers.get("X-PH-Backoffice-Key") if req is not None else None
    if not gesendet or not hmac.compare_digest(str(gesendet), str(geheim)):
        raise ApiFehler("forbidden", 403, _("Aufrufer nicht erlaubt."))


def _einmalig(ident):
    """Wiederverwendung desselben Tokens (uti/jti) verhindern – Ablauf wie das Token."""
    eid = ident.get("einmal_id")
    if not eid:
        return
    key = f"ph_microsoft:sso_uti:{hashlib.sha256(eid.encode()).hexdigest()[:40]}"
    cache = frappe.cache()
    if cache.get_value(key):
        raise ApiFehler("invalid_token", 401, _("Token wurde bereits verwendet."))
    cache.set_value(key, 1, expires_in_sec=3600 + 600)


def _rollen(user):
    return [r for r in frappe.get_roles(user) if r not in ("All", "Guest")]


def benutzer_finden(ident, zuordnung, auto_anlegen):
    """→ (user_name, neu_angelegt). Fehler: forbidden 403, not_found 404."""
    oid = ident["oid"]
    felder = ["name", "enabled", "user_type", "ph_microsoft_oid", "ph_microsoft_sso_gesperrt"]
    u = frappe.db.get_value("User", {"ph_microsoft_oid": oid}, felder, as_dict=True) if oid else None
    for adresse in (ident["email"], ident.get("email_alternativ")):
        if u or not adresse:
            continue
        name = frappe.db.get_value("User", {"name": adresse}) or frappe.db.get_value("User", {"email": adresse})
        if name:
            u = frappe.db.get_value("User", name, felder, as_dict=True)
    if u:
        if u.name in ("Administrator", "Guest"):
            raise ApiFehler("forbidden", 403, _("Dieser Benutzer kann sich nicht per Microsoft anmelden."))
        if u.ph_microsoft_oid and oid and u.ph_microsoft_oid != oid:
            raise ApiFehler("forbidden", 403, _("Benutzer ist mit einer anderen Microsoft-Identität verknüpft."))
        if not cint(u.enabled) or cint(u.ph_microsoft_sso_gesperrt):
            raise ApiFehler("forbidden", 403, _("Benutzer ist gesperrt."), {"gesperrt": True})
        if u.user_type != "System User":
            raise ApiFehler("forbidden", 403, _("Kein Backoffice-Benutzer."))
        if not u.ph_microsoft_oid and oid:
            frappe.db.set_value("User", u.name, "ph_microsoft_oid", oid, update_modified=False)
        return u.name, False
    if not (auto_anlegen and ident["email"] and G.hat_gemappte_gruppe(ident["gruppen"], zuordnung)):
        raise ApiFehler("not_found", 404, _("Kein Backoffice-Benutzer zu diesem Microsoft-Konto."))
    teile = (ident["name"] or ident["email"].split("@")[0]).split(" ", 1)
    doc = frappe.get_doc({
        "doctype": "User",
        "email": ident["email"],
        "first_name": teile[0][:140],
        "last_name": (teile[1] if len(teile) > 1 else "")[:140],
        "user_type": "System User",
        "enabled": 1,
        "send_welcome_email": 0,
        "ph_microsoft_oid": oid,
    })
    doc.flags.ignore_permissions = True
    doc.flags.no_welcome_mail = True
    doc.insert(ignore_permissions=True)
    return doc.name, True


def rollen_abgleichen(user, gruppen, zuordnung):
    hinzu, weg = G.rollen_abgleich(_rollen(user), gruppen, zuordnung)
    if not hinzu and not weg:
        return [], []
    doc = frappe.get_doc("User", user)
    doc.flags.ignore_permissions = True
    vorhandene = set(frappe.get_all("Role", filters={"name": ("in", hinzu)}, pluck="name")) if hinzu else set()
    hinzu = [r for r in hinzu if r in vorhandene]
    if hinzu:
        doc.add_roles(*hinzu)
    if weg:
        doc.remove_roles(*weg)
    return hinzu, weg


def sitzung(id_token, nonce=None):
    e = einstellungen()
    if not e["sso_aktiv"] or not e["tenant_id"] or not e["backoffice_client_id"]:
        raise ApiFehler("unavailable", 503, _("Microsoft-Anmeldung ist nicht eingerichtet."))
    _bruecken_schluessel_pruefen()
    try:
        claims = pruefen(id_token, schluessel_quelle(e["tenant_id"]), e["tenant_id"], e["backoffice_client_id"], toleranz=e["toleranz_sekunden"], nonce=nonce or None)
    except TokenFehler as f:
        eintrag("SSO", "Anmeldung", "Abgelehnt", f.grund, commit=True)
        if f.code == "forbidden":
            raise ApiFehler("forbidden", 403, _("Microsoft-Tenant nicht erlaubt."))
        raise ApiFehler("invalid_token", 401, _("Microsoft-Anmeldung ungültig oder abgelaufen."))
    ident = identitaet(claims)
    _einmalig(ident)
    zuordnung = gruppen_zuordnung()
    try:
        user, neu = benutzer_finden(ident, zuordnung, e["auto_benutzer_anlegen"])
    except ApiFehler as f:
        eintrag("SSO", "Anmeldung", "Abgelehnt", f"{f.code}: {f.meldung}", commit=True)
        raise
    hinzu = weg = []
    if e["rollen_aus_gruppen"] or neu:
        hinzu, weg = rollen_abgleichen(user, ident["gruppen"], zuordnung)
    standort = G.standort_aus_gruppen(ident["gruppen"], zuordnung)
    werte = {"ph_microsoft_letzte_anmeldung": now_datetime()}
    if standort and not frappe.db.get_value("User", user, "ph_core_standort"):
        werte["ph_core_standort"] = standort
    frappe.db.set_value("User", user, werte, update_modified=False)

    login_manager = getattr(frappe.local, "login_manager", None)
    if login_manager is None:
        from frappe.auth import LoginManager

        login_manager = frappe.local.login_manager = LoginManager()
    login_manager.login_as(user)

    meldung = ("neu angelegt; " if neu else "") + (f"+{len(hinzu)} −{len(weg)} Rollen" if hinzu or weg else "Rollen unverändert")
    if ident["gruppen_ueberlauf"]:
        meldung += "; Gruppen-Überlauf: Rollen nicht abgeglichen"
    eintrag("SSO", "Anmeldung", "OK", meldung, referenz_doctype="User", referenz_name=user, benutzer=user)
    u = frappe.db.get_value("User", user, ["full_name", "ph_core_standort", "ph_core_kurzname"], as_dict=True) or {}
    voll = u.get("full_name") or user
    return {
        "user": user,
        "name": voll,
        "kurzname": u.get("ph_core_kurzname") or voll.split(" ")[0],
        "roles": _rollen(user),
        "standort": u.get("ph_core_standort") or "",
        "sid": frappe.session.sid,
        "neu_angelegt": bool(neu),
    }
