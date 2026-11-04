"""API-Basis aller PH-Apps: ein Decorator für whitelisted Methoden, die die Website aufruft.

    from ph_core.api import ph_api

    @frappe.whitelist(allow_guest=False, methods=["POST"])
    @ph_api(rolle="PH Website Integration", idempotent=True)
    def create_anfrage(**daten):
        ...
        return {"referenz": doc.name}

Der Decorator liefert in dieser Reihenfolge:
  1. Wartungsschalter: PH Einstellungen.api_aktiv = 0 → 503 {"code": "unavailable"}.
  2. Rollenprüfung: der angemeldete Benutzer (API-Token) braucht `rolle` (Standard
     „PH Website Integration“); Administrator darf immer. Sonst 403 {"code": "forbidden"}.
  3. Ratenbegrenzung je Methode und Benutzer (Redis-Zähler, Fenster 60 s, Grenze aus
     PH Einstellungen oder `limit_pro_minute`) → 429 {"code": "rate_limited"}.
  4. Idempotenz (nur mit idempotent=True): Parameter `idempotency_key` (≤ 80 Zeichen).
     Gleicher Schlüssel + gleiche Methode innerhalb der Gültigkeit → dieselbe Antwort,
     ohne die Funktion erneut auszuführen (PH API Protokoll, Status „Wiederholt“).
  5. Audit: jeder Aufruf schreibt einen PH API Protokoll-Eintrag (Methode, Benutzer,
     Ergebnis, Dauer, IP-Hash, Referenz); Nutzdaten nur, wenn in den Einstellungen erlaubt.
  6. Fehlerbild: ApiFehler(code, http_status, meldung, daten) → JSON {"code": ..., "message": ...,
     **daten} mit passendem HTTP-Status (daten wird flach in den Body übernommen, z. B.
     {"ausgebucht": true} bei 409 – ph_marketing). Frappe-Ausnahmen werden einheitlich abgebildet:
       frappe.ValidationError / MandatoryError  → 400 invalid
       frappe.PermissionError                   → 403 forbidden
       frappe.DoesNotExistError                 → 404 not_found
       frappe.DuplicateEntryError, TimestampMismatchError → 409 conflict
       alles andere                             → 500 internal (Fehlertext nur im Protokoll)

HTTP-Methoden: Der HTTP-Status wird über frappe.local.response["http_status_code"] gesetzt. Frappe
übernimmt ihn in frappe.utils.response.build_response → as_json() unabhängig von der Methode, also
auch bei GET-Aufrufen ohne Body (ph_crm get_freie_slots/get_termin/get_terminarten). Bei GET kommen
die Parameter aus der Query-String in **kwargs (Strings!) – `cmd`/`idempotency_key` werden entfernt.

Die Website erwartet Fehlercodes als `body.code` (src/lib/booking/adapters/frappe.js,
src/lib/forms/forward.js): invalid 400, forbidden 403, not_found/invalid_token 404,
conflict/slot_taken 409, expired 410, outside_window 422, rate_limited 429, unavailable 503.
"""

import functools
import hashlib
import json
import time

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

ROLLE_WEBSITE = "PH Website Integration"
MAX_FEHLERTEXT = 500


class ApiFehler(Exception):
    """Fachlicher Fehler mit Code und HTTP-Status für den Aufrufer."""

    def __init__(self, code, http_status=400, meldung=None, daten=None):
        super().__init__(meldung or code)
        self.code = code
        self.http_status = http_status
        self.meldung = meldung or code
        self.daten = daten or {}


def ip_hash():
    ip = getattr(frappe.local, "request_ip", None) or ""
    return hashlib.sha256(f"ph:{ip}".encode()).hexdigest()[:16] if ip else None


def _einstellungen():
    from ph_core.ph_core.doctype.ph_einstellungen.ph_einstellungen import einstellungen

    return einstellungen()


def _rate_limit_pruefen(methode, benutzer, limit):
    schluessel = f"ph_api:rl:{methode}:{benutzer}:{int(time.time() // 60)}"
    cache = frappe.cache()
    zaehler = cache.incr(schluessel) if hasattr(cache, "incr") else None
    if zaehler is None:
        # Fallback ohne Redis-incr: ungefähre Zählung über get/set.
        zaehler = cint(cache.get_value(schluessel)) + 1
        cache.set_value(schluessel, zaehler, expires_in_sec=120)
    elif zaehler == 1:
        cache.expire(schluessel, 120)
    return zaehler <= limit


def _antwort_setzen(http_status, body):
    frappe.local.response["http_status_code"] = http_status
    frappe.local.response["message"] = body
    return body


def _protokoll(**werte):
    try:
        doc = frappe.get_doc({"doctype": "PH API Protokoll", "zeitpunkt": now_datetime(), **werte})
        doc.flags.ignore_permissions = True
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
    except Exception:
        frappe.log_error(title="PH API Protokoll konnte nicht geschrieben werden")


def ph_api(rolle=ROLLE_WEBSITE, idempotent=False, limit_pro_minute=None, referenz=None):
    """Decorator, siehe Modul-Docstring.

    referenz: optionaler Callable(ergebnis) → (doctype, name) für das Protokoll,
    z. B. referenz=lambda r: ("PH Anfrage", r["referenz"]).
    """

    def wrapper(fn):
        methode = f"{fn.__module__}.{fn.__name__}"

        @functools.wraps(fn)
        def inner(*args, **kwargs):
            start = time.monotonic()
            benutzer = frappe.session.user
            kwargs.pop("cmd", None)
            idem = (kwargs.pop("idempotency_key", None) or "")[:80] if idempotent else None
            einst = _einstellungen()
            nutzdaten = einst["api_protokoll_nutzdaten"]
            eintrag = {"methode": methode, "benutzer": benutzer, "ip_hash": ip_hash(), "idempotency_key": idem or None}
            if nutzdaten:
                eintrag["anfrage_json"] = json.dumps(kwargs, default=str, ensure_ascii=False)[:20000]

            def fertig(status, http_status, body, **extra):
                eintrag.update(status=status, http_status=http_status, dauer_ms=int((time.monotonic() - start) * 1000), **extra)
                _protokoll(**eintrag)
                return _antwort_setzen(http_status, body)

            if not einst["api_aktiv"]:
                return fertig("Abgelehnt", 503, {"code": "unavailable", "message": _("Website-API ist abgeschaltet.")})
            if benutzer != "Administrator" and rolle and rolle not in frappe.get_roles(benutzer):
                return fertig("Abgelehnt", 403, {"code": "forbidden", "message": _("Keine Berechtigung.")})

            limit = limit_pro_minute or einst["api_rate_limit_pro_minute"]
            if not _rate_limit_pruefen(methode, benutzer, limit):
                return fertig("Rate-Limit", 429, {"code": "rate_limited", "message": _("Zu viele Anfragen.")})

            if idem:
                alt = frappe.db.get_value(
                    "PH API Protokoll",
                    {"methode": methode, "idempotency_key": idem, "status": "OK", "zeitpunkt": (">", frappe.utils.add_days(now_datetime(), -einst["api_idempotenz_tage"]))},
                    ["antwort_json", "referenz_doctype", "referenz_name"],
                    as_dict=True,
                    order_by="zeitpunkt desc",
                )
                if alt and alt.antwort_json:
                    body = json.loads(alt.antwort_json)
                    return fertig("Wiederholt", 200, body, referenz_doctype=alt.referenz_doctype, referenz_name=alt.referenz_name)

            try:
                ergebnis = fn(*args, **kwargs)
            except ApiFehler as e:
                frappe.db.rollback()
                return fertig("Fehler", e.http_status, {"code": e.code, "message": e.meldung, **e.daten}, fehler=str(e)[:MAX_FEHLERTEXT])
            except frappe.PermissionError as e:
                frappe.db.rollback()
                return fertig("Fehler", 403, {"code": "forbidden", "message": _("Keine Berechtigung.")}, fehler=str(e)[:MAX_FEHLERTEXT])
            except frappe.DoesNotExistError as e:
                frappe.db.rollback()
                return fertig("Fehler", 404, {"code": "not_found", "message": _("Nicht gefunden.")}, fehler=str(e)[:MAX_FEHLERTEXT])
            except (frappe.DuplicateEntryError, frappe.TimestampMismatchError) as e:
                frappe.db.rollback()
                return fertig("Fehler", 409, {"code": "conflict", "message": _("Konflikt – Datensatz existiert oder wurde geändert.")}, fehler=str(e)[:MAX_FEHLERTEXT])
            except frappe.ValidationError as e:  # auch MandatoryError, InvalidEmailAddressError …
                frappe.db.rollback()
                return fertig("Fehler", 400, {"code": "invalid", "message": _text_ohne_html(str(e))[:300]}, fehler=str(e)[:MAX_FEHLERTEXT])
            except Exception as e:  # noqa: BLE001 – wird protokolliert, nie an den Aufrufer
                frappe.db.rollback()
                frappe.log_error(title=f"PH API {methode}")
                return fertig("Fehler", 500, {"code": "internal", "message": _("Interner Fehler.")}, fehler=str(e)[:MAX_FEHLERTEXT])

            ref_dt = ref_name = None
            if referenz:
                try:
                    ref_dt, ref_name = referenz(ergebnis)
                except Exception:  # noqa: BLE001
                    pass
            frappe.db.commit()
            extra = {"referenz_doctype": ref_dt, "referenz_name": ref_name}
            if idem or nutzdaten:
                extra["antwort_json"] = json.dumps(ergebnis, default=str, ensure_ascii=False)
            return fertig("OK", 200, ergebnis, **extra)

        return inner

    return wrapper


def pflicht(daten, *felder):
    """Wirft ApiFehler("invalid") mit Feldname, wenn ein Pflichtfeld fehlt oder leer ist."""
    for f in felder:
        if not str(daten.get(f) or "").strip():
            raise ApiFehler("invalid", 400, _("Pflichtfeld fehlt: {0}").format(f), {"field": f})


def text(wert, laenge):
    """Zeichenkette kürzen und trimmen (None → '')."""
    return str(wert or "").strip()[:laenge]


def _text_ohne_html(s):
    import re

    return re.sub(r"<[^>]+>", "", s or "").strip()


def token_hash(token):
    """sha256-Hex eines Portal-Tokens (Website: src/lib/portal/adapters/frappe.js, PH Kontakt.portal_token_hash)."""
    return hashlib.sha256(str(token or "").encode()).hexdigest()


def portal_kontakt_pruefen(kontakt, kunde_token):
    """Zentrale Kundenportal-Prüfung für ph_projekte, ph_faktura, ph_service (CONVENTIONS 11).

    Prüft: Kontakt übergeben, PH Kontakt installiert (ph_crm), Kontakt existiert, portal_aktiv,
    portal_token_hash == sha256(kunde_token) in konstanter Zeit. Rückgabe: Name des Kontakts.
    Fehler: invalid 400, unavailable 503 (ph_crm fehlt/Felder fehlen), not_found 404, invalid_token 404.
    """
    import hmac

    pflicht({"kontakt": kontakt, "kunde_token": kunde_token}, "kontakt", "kunde_token")
    if not frappe.db.exists("DocType", "PH Kontakt"):
        raise ApiFehler("unavailable", 503, _("PH Kontakt ist nicht installiert."))
    try:
        k = frappe.db.get_value("PH Kontakt", kontakt, ["portal_aktiv", "portal_token_hash"], as_dict=True)
    except Exception:  # noqa: BLE001 – Portal-Felder fehlen noch (Migration ph_crm)
        raise ApiFehler("unavailable", 503, _("Portal-Felder an PH Kontakt fehlen."))
    if not k:
        raise ApiFehler("not_found", 404, _("Kontakt unbekannt."))
    if not cint(k.portal_aktiv) or not k.portal_token_hash or not hmac.compare_digest(str(k.portal_token_hash), token_hash(kunde_token)):
        raise ApiFehler("invalid_token", 404, _("Zugang ungültig."))
    return kontakt
