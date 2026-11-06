"""Geräte-API für das Backoffice (Nr. 49): registrieren, prüfen, berühren, auflisten.

Aufrufer: Next.js-Backoffice (backoffice/src/lib/backoffice/auth/geraet.js) mit der Frappe-Sitzung des
Mitarbeiters (register_device, list_devices) bzw. mit dem Service-Token (verify_device, touch_device –
das Gerät weist sich über sein Token aus, nicht über den Benutzer). Antworten enthalten nie den Hash.

Fehlercodes: invalid 400, forbidden 403 (Rolle fehlt / Gerät gesperrt → {"gesperrt": true}),
invalid_token 404 (Token unbekannt), rate_limited 429.
"""

import frappe
from frappe import _

from ph_core.api import ROLLEN_ADMIN, ApiFehler, ip_hash, liste, pflicht, ph_api, rolle_pruefen, text
from ph_core.ph_core.doctype.ph_geraet.ph_geraet import FELDER_OEFFENTLICH, beruehren, geraet_per_token, oeffentlich
from ph_core.utils.geraete import DRUCKER_TYPEN, GERAETE_TYPEN, arbeitsplatz_fuer_typ

MAX_TEXT = 140


def _geraet_aktiv(token):
    """Gerät zum Token oder ApiFehler (invalid 400 / invalid_token 404 / forbidden 403 bei Sperre)."""
    pflicht({"token": token}, "token")
    g = geraet_per_token(token)
    if not g:
        raise ApiFehler("invalid_token", 404, _("Gerät unbekannt oder Token ungültig."))
    if not g.get("aktiv"):
        raise ApiFehler("forbidden", 403, _("Gerät ist gesperrt."), {"gesperrt": True, "geraet": g["name"]})
    return g


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(intern=True, limit_pro_minute=20, referenz=lambda r: ("PH Geraet", r["geraet"]))
def register_device(geraetename, typ, standort=None, arbeitsplatz=None, kasse=None, drucker=None, drucker_typ=None, notizen=None):
    """Gerät anlegen und Token ausstellen (Rolle PH Backoffice-Admin, System Manager oder eine PH … Leitung).

    Rückgabe {"geraet", "token", "geraetename", "typ", "arbeitsplatz", "standort", "kasse", "drucker", "drucker_typ"} –
    `token` erscheint genau hier einmal; gespeichert wird nur sein SHA-256.
    """
    rolle_pruefen(*ROLLEN_ADMIN, leitung=True)
    pflicht({"geraetename": geraetename, "typ": typ}, "geraetename", "typ")
    typ = text(typ, 20)
    if typ not in GERAETE_TYPEN:
        raise ApiFehler("invalid", 400, _("Unbekannter Gerätetyp: {0}").format(typ), {"field": "typ"})
    drucker_typ = text(drucker_typ, 20) or None
    if drucker_typ and drucker_typ not in DRUCKER_TYPEN:
        raise ApiFehler("invalid", 400, _("Unbekannter Druckertyp: {0}").format(drucker_typ), {"field": "drucker_typ"})
    doc = frappe.get_doc(
        {
            "doctype": "PH Geraet",
            "geraetename": text(geraetename, MAX_TEXT),
            "typ": typ,
            "arbeitsplatz": arbeitsplatz_fuer_typ(typ, arbeitsplatz),
            "standort": text(standort, MAX_TEXT) or None,
            "kasse": text(kasse, MAX_TEXT) or None,
            "drucker": text(drucker, MAX_TEXT) or None,
            "drucker_typ": drucker_typ,
            "notizen": text(notizen, 1000) or None,
            "aktiv": 1,
        }
    )
    doc.flags.ignore_permissions = True  # Rolle oben geprüft; Leitung ohne DocPerm darf Geräte ihres Bereichs anlegen
    doc.insert(ignore_permissions=True)
    ergebnis = doc.registrieren()
    doc.reload()
    antwort = oeffentlich(doc.as_dict())
    antwort["token"] = ergebnis["token"]
    return antwort


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(intern=True, limit_pro_minute=60, referenz=lambda r: ("PH Geraet", r["geraet"]))
def verify_device(token):
    """Token prüfen. Rückgabe Gerätedaten ohne Hash: {"geraet", "geraetename", "typ", "arbeitsplatz", "standort",
    "kasse", "drucker", "drucker_typ", "aktiv", "zuletzt_gesehen"}. Setzt zuletzt_gesehen (gedrosselt)."""
    g = _geraet_aktiv(token)
    g["zuletzt_gesehen"] = beruehren(g["name"], ip_hash())
    return oeffentlich(g)


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(intern=True, limit_pro_minute=120)
def touch_device(token):
    """Lebenszeichen des Kiosks: zuletzt_gesehen/IP-Hash aktualisieren. Rückgabe {"ok", "geraet", "zuletzt_gesehen"}."""
    g = _geraet_aktiv(token)
    zeit = beruehren(g["name"], ip_hash())
    return {"ok": True, "geraet": g["name"], "zuletzt_gesehen": zeit.isoformat() if zeit else None}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(intern=True, limit_pro_minute=60)
def list_devices(nur_aktive=0, standort=None, arbeitsplatz=None):
    """Geräteliste ohne Hashes (Leserecht auf PH Geraet). Rückgabe Liste wie verify_device + "token_vorhanden", "registriert_am"."""
    if not frappe.has_permission("PH Geraet", "read"):
        raise ApiFehler("forbidden", 403, _("Keine Berechtigung."))
    filter_ = {}
    if frappe.utils.cint(nur_aktive):
        filter_["aktiv"] = 1
    if standort:
        filter_["standort"] = text(standort, MAX_TEXT)
    if arbeitsplatz:
        filter_["arbeitsplatz"] = ("in", liste(arbeitsplatz))
    zeilen = frappe.get_list("PH Geraet", filters=filter_, fields=FELDER_OEFFENTLICH + ["token_vorhanden", "registriert_am"], order_by="standort asc, geraetename asc", limit_page_length=500)
    aus = []
    for z in zeilen:
        o = oeffentlich(z)
        o["token_vorhanden"] = int(z.get("token_vorhanden") or 0)
        o["registriert_am"] = z["registriert_am"].isoformat() if z.get("registriert_am") else None
        aus.append(o)
    return aus
