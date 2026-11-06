"""Decorator `ms_api` – wie ph_core.api.ph_api(intern=True), aber ohne jede Nutzdaten-Protokollierung.

Warum eigener Decorator: ph_api schreibt bei PH Einstellungen.api_protokoll_nutzdaten = 1 die Parameter
(id_token, Mail-HTML) in PH API Protokoll – das ist hier ausgeschlossen (Auftrag Punkt 8: keine Tokens/
Mailinhalte in Logs). Rate-Limit, Protokoll und Fehlerbild kommen weiterhin aus ph_core.

    @frappe.whitelist(allow_guest=True, methods=["POST"])
    @ms_api(gast=True, limit=lambda e: e["sso_rate_limit_pro_minute"])
    def sso_sitzung(id_token, nonce=None): ...

gast=True: Gast erlaubt (Zähler je Methode + IP-Hash). gast=False: Gast → 403 forbidden.
idempotent=True: Parameter idempotency_key; Antwort wird (ohne Eingaben) im Protokoll gehalten.
"""

import functools
import json
import time

import frappe
from frappe import _
from frappe.utils import add_days, now_datetime

from ph_core.api import ApiFehler, _antwort_setzen, _protokoll, _rate_limit_pruefen, ip_hash


def _einst():
    from ph_microsoft.ph_microsoft.einstellungen import einstellungen

    try:
        return einstellungen()
    except Exception:  # noqa: BLE001 – Einstellungen noch nicht migriert
        return {"sso_rate_limit_pro_minute": 10}


def ms_api(gast=False, limit=60, idempotent=False, referenz=None):
    def wrapper(fn):
        methode = f"{fn.__module__}.{fn.__name__}"

        @functools.wraps(fn)
        def inner(*args, **kwargs):
            start = time.monotonic()
            kwargs.pop("cmd", None)
            idem = (kwargs.pop("idempotency_key", None) or "")[:80] if idempotent else None
            benutzer = frappe.session.user or "Guest"
            eintrag = {"methode": methode, "benutzer": benutzer if benutzer != "Guest" else None, "ip_hash": ip_hash(), "idempotency_key": idem or None}

            def fertig(status, http_status, body, **extra):
                eintrag["benutzer"] = frappe.session.user if frappe.session.user != "Guest" else eintrag["benutzer"]
                eintrag.update(status=status, http_status=http_status, dauer_ms=int((time.monotonic() - start) * 1000), **extra)
                _protokoll(**eintrag)
                return _antwort_setzen(http_status, body)

            if not gast and benutzer == "Guest":
                return fertig("Abgelehnt", 403, {"code": "forbidden", "message": _("Anmeldung erforderlich.")})
            grenze = limit(_einst()) if callable(limit) else limit
            if not _rate_limit_pruefen(methode, benutzer, int(grenze or 10)):
                return fertig("Rate-Limit", 429, {"code": "rate_limited", "message": _("Zu viele Anfragen.")})
            if idem:
                alt = frappe.db.get_value(
                    "PH API Protokoll",
                    {"methode": methode, "idempotency_key": idem, "benutzer": benutzer, "status": "OK", "zeitpunkt": (">", add_days(now_datetime(), -7))},
                    ["antwort_json"],
                    as_dict=True,
                    order_by="zeitpunkt desc",
                )
                if alt and alt.antwort_json:
                    return fertig("Wiederholt", 200, json.loads(alt.antwort_json))
            try:
                ergebnis = fn(*args, **kwargs)
            except ApiFehler as e:
                frappe.db.rollback()
                return fertig("Fehler", e.http_status, {"code": e.code, "message": e.meldung, **e.daten}, fehler=str(e.code)[:200])
            except frappe.PermissionError:
                frappe.db.rollback()
                return fertig("Fehler", 403, {"code": "forbidden", "message": _("Keine Berechtigung.")}, fehler="PermissionError")
            except frappe.DoesNotExistError:
                frappe.db.rollback()
                return fertig("Fehler", 404, {"code": "not_found", "message": _("Nicht gefunden.")}, fehler="DoesNotExistError")
            except frappe.ValidationError as e:
                frappe.db.rollback()
                return fertig("Fehler", 400, {"code": "invalid", "message": frappe.utils.strip_html(str(e))[:300]}, fehler="ValidationError")
            except Exception as e:  # noqa: BLE001
                frappe.db.rollback()
                frappe.log_error(title=f"PH Microsoft API {methode}")
                return fertig("Fehler", 500, {"code": "internal", "message": _("Interner Fehler.")}, fehler=type(e).__name__)
            ref_dt = ref_name = None
            if referenz:
                try:
                    ref_dt, ref_name = referenz(ergebnis)
                except Exception:  # noqa: BLE001
                    pass
            frappe.db.commit()
            extra = {"referenz_doctype": ref_dt, "referenz_name": ref_name}
            if idem:
                extra["antwort_json"] = json.dumps(ergebnis, default=str, ensure_ascii=False)
            return fertig("OK", 200, ergebnis, **extra)

        return inner

    return wrapper


def graph_fehler_abbilden(e):
    """GraphFehler/GraphTokenFehler → ApiFehler (ohne Inhalte)."""
    from ph_microsoft.graph.client import GraphFehler
    from ph_microsoft.graph.token import GraphTokenFehler

    if isinstance(e, GraphTokenFehler):
        return ApiFehler("unavailable", 503, _("Microsoft-Anbindung nicht konfiguriert oder Anmeldung fehlgeschlagen."), {"graph_code": e.code})
    if isinstance(e, GraphFehler):
        if e.status == 404:
            return ApiFehler("not_found", 404, _("In Microsoft 365 nicht gefunden."), {"graph_code": e.code})
        if e.status == 403:
            return ApiFehler("forbidden", 403, _("Microsoft 365 verweigert den Zugriff (Berechtigung/Application Access Policy)."), {"graph_code": e.code})
        return ApiFehler("unavailable", 503, _("Microsoft 365 nicht erreichbar."), {"graph_code": e.code, "graph_status": e.status})
    return e
