"""Whitelisted Methoden von ph_microsoft (Backoffice, Microsoft-Webhooks). Schnittstelle: README.md Abschnitt 6.

Gast (allow_guest) nur: sso_sitzung (strenges Rate-Limit je IP) und graph_webhook (clientState-Prüfung).
Alle anderen: angemeldeter Benutzer (Frappe-sid aus sso_sitzung oder Passwort-Login), Rechte je Postfach/Vorgang.
Protokoll: PH API Protokoll (ohne Parameter/Inhalte) + PH Sync Protokoll.
"""

import json

import frappe
from frappe import _
from frappe.utils import add_days, cint, now_datetime

from ph_core.api import ApiFehler, hat_rolle, liste, pflicht
from ph_microsoft.ph_microsoft.schnittstelle import graph_fehler_abbilden, ms_api


def _graph(fn, *args, **kwargs):
    from ph_microsoft.graph.client import GraphFehler
    from ph_microsoft.graph.token import GraphTokenFehler

    try:
        return fn(*args, **kwargs)
    except (GraphFehler, GraphTokenFehler) as e:
        raise graph_fehler_abbilden(e)


# ── 1. SSO-Brücke ─────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=True, methods=["POST"])
@ms_api(gast=True, limit=lambda e: e["sso_rate_limit_pro_minute"], referenz=lambda r: ("User", r["user"]))
def sso_sitzung(id_token=None, nonce=None):
    """Entra-ID-Token → Frappe-Sitzung. → {user, name, kurzname, roles, standort, sid, neu_angelegt}.
    Fehler: invalid_token 401, forbidden 403, not_found 404, rate_limited 429, unavailable 503."""
    if not id_token:
        raise ApiFehler("invalid_token", 401, _("id_token fehlt."))
    from ph_microsoft.ph_microsoft.sso import sitzung

    return sitzung(id_token, nonce=nonce)


# ── 2. Graph-Webhook ──────────────────────────────────────────────────────────────────────────
@frappe.whitelist(allow_guest=True, methods=["POST"])
def graph_webhook(**kwargs):
    """Validierungs-Handshake (validationToken → text/plain 200) und Change-Notifications (→ 202)."""
    from werkzeug.wrappers import Response

    from ph_microsoft.logik import webhook as W

    args = dict(getattr(frappe.request, "args", {}) or {})
    token = W.validierungs_token(args) or W.validierungs_token(kwargs)
    if token is not None:
        return Response(token, status=200, mimetype="text/plain")
    body = kwargs if kwargs.get("value") else {}
    if not body:
        try:
            body = json.loads(frappe.request.get_data(as_text=True) or "{}")
        except Exception:  # noqa: BLE001
            body = {}

    def abo_hash(sid):
        return frappe.db.get_value("PH Graph Abo", {"subscription_id": sid, "status": ("in", ["Aktiv", "Fehler"])}, "client_state_hash")

    gueltig, abgelehnt = W.benachrichtigungen(body, abo_hash)
    if gueltig:
        from ph_microsoft.ph_microsoft.abos import benachrichtigungen_verarbeiten

        try:
            benachrichtigungen_verarbeiten(gueltig)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Microsoft: Webhook-Verarbeitung fehlgeschlagen")
    if abgelehnt:
        from ph_microsoft.ph_microsoft.protokoll import eintrag

        eintrag("Abo", "Webhook", "Abgelehnt", f"{abgelehnt} Benachrichtigung(en) mit falschem clientState", anzahl=abgelehnt, commit=True)
    return Response("", status=202)


# ── 3. Mail ───────────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(methods=["POST"])
@ms_api(limit=30, idempotent=True, referenz=lambda r: ("Communication", r["communication"]))
def mail_senden(an=None, betreff=None, html=None, von=None, anhaenge=None, bezug_doctype=None, bezug_name=None, cc=None, bcc=None):
    """1:1-Mail über Graph aus dem Postfach des Benutzers (oder Shared-Mailbox mit Senderecht).
    → {ok, communication, von, testmodus}."""
    pflicht({"an": an, "betreff": betreff}, "an", "betreff")
    from ph_microsoft.ph_microsoft.mail import senden

    return _graph(senden, an, betreff, html, von=von, anhaenge=anhaenge, bezug_doctype=bezug_doctype, bezug_name=bezug_name, cc=cc, bcc=bcc)


@frappe.whitelist(methods=["GET", "POST"])
@ms_api(limit=30)
def mails_unzugeordnet(postfach=None, tage=14):
    """Live-Liste (nichts gespeichert): [{message_id, postfach, richtung, absender, absender_name, gegenadresse, betreff,
    datum, grund (unbekannt|mehrdeutig|vertraulich), vertraulich, vorschlaege:[{doctype, name, titel}]}]."""
    from ph_microsoft.ph_microsoft.mail import unzugeordnet

    return _graph(unzugeordnet, postfach=postfach, tage=tage)


@frappe.whitelist(methods=["POST"])
@ms_api(limit=60, idempotent=True, referenz=lambda r: ("Communication", r["communication"]))
def mail_zuordnen(message_id=None, postfach=None, bezug_doctype=None, bezug_name=None, adresse_merken=0):
    """Mail einem Vorgang/Kontakt zuordnen → erst jetzt gespeichert. → {communication, bezug_doctype, bezug_name, adresse_gemerkt}."""
    pflicht({"message_id": message_id, "postfach": postfach, "bezug_doctype": bezug_doctype, "bezug_name": bezug_name}, "message_id", "postfach", "bezug_doctype", "bezug_name")
    from ph_microsoft.ph_microsoft.mail import zuordnen

    return _graph(zuordnen, message_id, postfach, bezug_doctype, bezug_name, adresse_merken=cint(adresse_merken))


@frappe.whitelist(methods=["POST"])
@ms_api(limit=60)
def mail_zuordnung_aufheben(communication=None):
    """Mail aus der Akte entfernen (im Backoffice gelöscht, bleibt in Outlook), protokolliert. → {ok, communication}."""
    pflicht({"communication": communication}, "communication")
    from ph_microsoft.ph_microsoft.mail import zuordnung_aufheben

    return zuordnung_aufheben(communication)


@frappe.whitelist(methods=["POST"])
@ms_api(limit=60)
def adresse_sperren(adresse=None, notiz=None):
    """Adresse nie zuordnen (Sperrliste: Werbung, Privates). → {ok, adresse, eintrag}."""
    from ph_microsoft.ph_microsoft.mail import adresse_sperren as sperren

    return sperren(adresse, notiz)


@frappe.whitelist(methods=["POST"])
@ms_api(limit=60)
def adresse_entsperren(adresse=None):
    """Sperre aufheben – Leitung/Admin oder wer sie angelegt hat. → {ok, adresse, entfernt}."""
    from ph_microsoft.logik.zuordnung import normalisiere

    a = normalisiere(adresse)
    namen = frappe.get_all("PH Mail Adresse", filters={"adresse": a, "art": "Sperre"}, fields=["name", "owner"])
    for n in namen:
        if n.owner != frappe.session.user and not hat_rolle("System Manager", "PH Backoffice-Admin", leitung=True):
            raise ApiFehler("forbidden", 403, _("Keine Berechtigung."))
        frappe.delete_doc("PH Mail Adresse", n.name, ignore_permissions=True)
    return {"ok": True, "adresse": a, "entfernt": len(namen)}


@frappe.whitelist(methods=["POST"])
@ms_api(limit=30, idempotent=True, referenz=lambda r: ("PH Kontakt", r["kontakt"]))
def kontakt_aus_mail(message_id=None, postfach=None):
    """Neuen PH Kontakt aus Absender/Empfänger anlegen und die Mail zuordnen. → {kontakt, communication}.
    409 conflict {vorschlaege}, wenn die Adresse schon bekannt ist."""
    pflicht({"message_id": message_id, "postfach": postfach}, "message_id", "postfach")
    from ph_microsoft.ph_microsoft.mail import kontakt_aus_mail as anlegen

    return _graph(anlegen, message_id, postfach)


@frappe.whitelist(methods=["GET", "POST"])
@ms_api(limit=60)
def meine_postfaecher():
    """→ {lesen: [adressen], senden: [adressen]} für die Postfach-Auswahl im Backoffice."""
    from ph_microsoft.ph_microsoft.mail import erlaubte_postfaecher

    return {"lesen": erlaubte_postfaecher(recht="lesen"), "senden": erlaubte_postfaecher(recht="senden")}


# ── 4. Kalender ───────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(methods=["GET", "POST"])
@ms_api(limit=60)
def frei_belegt(benutzer=None, von=None, bis=None):
    """getSchedule für Frappe-Benutzer (mit PH Kalender Zuordnung). → {user: [{start, ende, status}]}."""
    pflicht({"benutzer": benutzer, "von": von, "bis": bis}, "benutzer", "von", "bis")
    from ph_microsoft.ph_microsoft.kalender import frei_belegt as fb

    return _graph(fb, liste(benutzer), von, bis)


@frappe.whitelist(methods=["POST"])
@ms_api(limit=30)
def kalender_abgleichen(doctype=None, name=None):
    """Vorgang sofort nach Outlook übertragen (Button). → {ok, verknuepfungen}."""
    pflicht({"doctype": doctype, "name": name}, "doctype", "name")
    if not frappe.has_permission(doctype, "write", doc=name):
        raise ApiFehler("forbidden", 403, _("Keine Berechtigung."))
    from ph_microsoft.ph_microsoft.kalender import dokument_abgleichen, verknuepfungen

    _graph(dokument_abgleichen, doctype, name)
    return {"ok": True, "verknuepfungen": [{"user": v.user, "status": v.status, "teams_link": v.teams_link} for v in verknuepfungen(doctype, name)]}


# ── 7. Status ─────────────────────────────────────────────────────────────────────────────────
@frappe.whitelist(methods=["GET", "POST"])
@ms_api(limit=60)
def status():
    """Kennzahlen für Workspace/Backoffice (ohne Inhalte)."""
    if not hat_rolle("System Manager", "PH Backoffice-Admin", "PH Geschäftsführung"):
        raise ApiFehler("forbidden", 403, _("Keine Berechtigung."))
    from ph_microsoft.ph_microsoft.graph_dienst import ist_konfiguriert

    e = frappe.get_cached_doc("PH Microsoft Einstellungen")
    seit = add_days(now_datetime(), -1)
    return {
        "konfiguriert": ist_konfiguriert(),
        "sso_aktiv": cint(e.sso_aktiv),
        "letzte_mail_sync": str(e.letzte_mail_sync or ""),
        "letzte_kalender_sync": str(e.letzte_kalender_sync or ""),
        "letzte_abo_pruefung": str(e.letzte_abo_pruefung or ""),
        "fehler_24h": frappe.db.count("PH Sync Protokoll", {"ergebnis": "Fehler", "zeitpunkt": (">", seit)}),
        "konflikte_24h": frappe.db.count("PH Sync Protokoll", {"ergebnis": "Konflikt", "zeitpunkt": (">", seit)}),
        "abos_aktiv": frappe.db.count("PH Graph Abo", {"status": "Aktiv"}),
        "abos_laufen_ab_24h": frappe.db.count("PH Graph Abo", {"status": "Aktiv", "ablauf": ("<", add_days(now_datetime(), 1))}),
        "abos_gestoert": frappe.db.count("PH Graph Abo", {"status": ("in", ["Fehler", "Abgelaufen"])}),
        "postfaecher_aktiv": frappe.db.count("PH Postfach", {"aktiv": 1}),
        "postfaecher_fehler": frappe.db.count("PH Postfach", {"aktiv": 1, "status": "Fehler"}),
        "kalender_aktiv": frappe.db.count("PH Kalender Zuordnung", {"aktiv": 1}),
    }
