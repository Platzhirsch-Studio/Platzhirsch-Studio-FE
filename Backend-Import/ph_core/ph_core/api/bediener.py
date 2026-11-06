"""Bedienerwechsel per PIN an Kassa/Packtisch (Nr. 49, PLAN-NEXT-BACKOFFICE.md §3 Punkt 8).

Felder am Frappe-User (fixtures/custom_field.json): ph_core_pin_hash (PBKDF2, nie Klartext),
ph_core_pin_gesetzt_am, ph_core_standort, ph_core_kurzname. Prüfung nur von einem registrierten,
aktiven Gerät (geraet_token → PH Geraet). Zusätzlich zum ph_api-Rate-Limit: nach FEHLVERSUCHE_MAX
falschen PINs je Benutzer und Gerät ist die PIN für SPERRE_SEKUNDEN gesperrt (Redis-Zähler).

Fehlercodes: invalid 400 (PIN-Format), forbidden 403 (fremder Benutzer ohne Adminrolle, Gerät gesperrt,
Benutzer deaktiviert), invalid_token 404 (Gerät), not_found 404 (Benutzer), invalid_pin 401,
rate_limited 429 (PIN-Sperre, mit {"sekunden": n}).
"""

import time

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from ph_core.api import ROLLEN_ADMIN, ApiFehler, hat_rolle, pflicht, ph_api, rolle_pruefen, text
from ph_core.api.geraete import _geraet_aktiv
from ph_core.utils.geraete import PIN_RE, pin_hash, pin_passt, pin_pruefen

FEHLVERSUCHE_MAX = 5
SPERRE_SEKUNDEN = 15 * 60
# Rollen, die am Kiosk als Bediener erscheinen (list_operators).
BEDIENER_ROLLEN_PRAEFIX = ("PH Kassa ", "PH Logistik ")
BEDIENER_ROLLEN = ("PH Montage", "PH Techniker")
ROLLEN_AUSBLENDEN = {"All", "Guest", "Desk User", "Administrator"}


def _rollen(user):
    return sorted(r for r in frappe.get_roles(user) if r not in ROLLEN_AUSBLENDEN)


def _ist_bediener(rollen):
    return any(r in BEDIENER_ROLLEN or r.startswith(BEDIENER_ROLLEN_PRAEFIX) for r in rollen)


def _sperr_schluessel(user, geraet):
    return f"ph_core:pin:fehl:{user}:{geraet}"


def _fehlversuche(user, geraet):
    cache = frappe.cache()
    wert = cache.get_value(_sperr_schluessel(user, geraet)) or {}
    if isinstance(wert, dict) and wert.get("bis", 0) > time.time():
        return wert
    return {}


def _fehlversuch_merken(user, geraet):
    cache = frappe.cache()
    wert = _fehlversuche(user, geraet)
    anzahl = cint(wert.get("anzahl")) + 1
    cache.set_value(_sperr_schluessel(user, geraet), {"anzahl": anzahl, "bis": time.time() + SPERRE_SEKUNDEN}, expires_in_sec=SPERRE_SEKUNDEN)
    return anzahl


def _benutzer(email):
    pflicht({"email": email}, "email")
    u = frappe.db.get_value(
        "User",
        text(email, 140),
        ["name", "full_name", "enabled", "user_type", "ph_core_pin_hash", "ph_core_standort", "ph_core_kurzname"],
        as_dict=True,
    )
    if not u:
        raise ApiFehler("not_found", 404, _("Benutzer unbekannt."))
    return u


def _antwort(u):
    return {
        "user": u.name,
        "name": u.full_name or u.name,
        "kurzname": u.ph_core_kurzname or (u.full_name or u.name).split(" ")[0],
        "roles": _rollen(u.name),
        "standort": u.ph_core_standort or "",
    }


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(intern=True, limit_pro_minute=10)
def set_pin(pin, user=None, standort=None, kurzname=None):
    """PIN setzen (4–6 Ziffern) für den eigenen Benutzer; für andere nur System Manager/PH Backoffice-Admin/PH … Leitung.
    Optional ph_core_standort/ph_core_kurzname mitsetzen. Rückgabe {"ok", "user", "pin_gesetzt_am"}; nie die PIN."""
    ziel = text(user, 140) or frappe.session.user
    if ziel != frappe.session.user:
        rolle_pruefen(*ROLLEN_ADMIN, leitung=True)
    if not frappe.db.exists("User", ziel):
        raise ApiFehler("not_found", 404, _("Benutzer unbekannt."))
    if ziel in ("Guest",):
        raise ApiFehler("invalid", 400, _("Für diesen Benutzer ist keine PIN möglich."))
    fehler = pin_pruefen(pin)
    if fehler:
        raise ApiFehler("invalid", 400, _(fehler), {"field": "pin"})
    jetzt = now_datetime()
    werte = {"ph_core_pin_hash": pin_hash(pin), "ph_core_pin_gesetzt_am": jetzt}
    if standort is not None:
        werte["ph_core_standort"] = text(standort, 140) or None
    if kurzname is not None:
        werte["ph_core_kurzname"] = text(kurzname, 40) or None
    frappe.db.set_value("User", ziel, werte, update_modified=False)
    frappe.get_doc(
        {"doctype": "Comment", "comment_type": "Info", "reference_doctype": "User", "reference_name": ziel, "content": _("Bediener-PIN gesetzt durch {0}").format(frappe.session.user)}
    ).insert(ignore_permissions=True)
    return {"ok": True, "user": ziel, "pin_gesetzt_am": jetzt.isoformat()}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(intern=True, limit_pro_minute=20)
def verify_pin(email, pin, geraet_token):
    """PIN prüfen – nur von registriertem, aktivem Gerät. Rückgabe {"user", "name", "kurzname", "roles": [...], "standort", "geraet", "arbeitsplatz"}."""
    g = _geraet_aktiv(geraet_token)
    u = _benutzer(email)
    sperre = _fehlversuche(u.name, g["name"])
    if cint(sperre.get("anzahl")) >= FEHLVERSUCHE_MAX:
        raise ApiFehler("rate_limited", 429, _("PIN vorübergehend gesperrt."), {"sekunden": int(max(0, sperre.get("bis", 0) - time.time()))})
    if not cint(u.enabled) or u.user_type != "System User":
        raise ApiFehler("forbidden", 403, _("Benutzer ist deaktiviert oder kein Desk-Benutzer."))
    if not PIN_RE.match(str(pin or "").strip()):
        raise ApiFehler("invalid", 400, _("PIN muss aus 4 bis 6 Ziffern bestehen."), {"field": "pin"})
    if not u.ph_core_pin_hash or not pin_passt(pin, u.ph_core_pin_hash):
        anzahl = _fehlversuch_merken(u.name, g["name"])
        raise ApiFehler("invalid_pin", 401, _("PIN stimmt nicht."), {"verbleibend": max(0, FEHLVERSUCHE_MAX - anzahl)})
    frappe.cache().delete_value(_sperr_schluessel(u.name, g["name"]))
    antwort = _antwort(u)
    antwort.update({"geraet": g["name"], "arbeitsplatz": g.get("arbeitsplatz")})
    return antwort


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(intern=True, limit_pro_minute=60)
def list_operators(geraet_token, alle_standorte=0):
    """Bediener für den Wechsel-Bildschirm: aktive Desk-Benutzer mit PIN und Rolle PH Kassa */PH Logistik */PH Montage/
    PH Techniker am Standort des Geräts (ph_core_standort leer = überall). Rückgabe Liste {"user", "name", "kurzname", "roles", "standort"} – keine Hashes."""
    g = _geraet_aktiv(geraet_token)
    zeilen = frappe.get_all(
        "User",
        filters={"enabled": 1, "user_type": "System User", "ph_core_pin_hash": ("is", "set")},
        fields=["name", "full_name", "ph_core_standort", "ph_core_kurzname"],
        order_by="full_name asc",
        limit_page_length=200,
    )
    aus = []
    for u in zeilen:
        if u.name in ("Administrator", "Guest"):
            continue
        if not cint(alle_standorte) and u.ph_core_standort and g.get("standort") and u.ph_core_standort != g["standort"]:
            continue
        rollen = _rollen(u.name)
        if not _ist_bediener(rollen) and not hat_rolle(*ROLLEN_ADMIN, benutzer=u.name):
            continue
        aus.append({"user": u.name, "name": u.full_name or u.name, "kurzname": u.ph_core_kurzname or (u.full_name or u.name).split(" ")[0], "roles": rollen, "standort": u.ph_core_standort or ""})
    return aus
