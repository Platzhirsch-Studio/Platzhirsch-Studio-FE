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
  3. Ratenbegrenzung je Methode, Benutzer und Client (Redis-Zähler, Fenster 60 s, Grenze aus
     PH Einstellungen.api_rate_limit_pro_minute oder `limit_pro_minute`) → 429 {"code": "rate_limited"}.
     Client = Header `X-PH-Client` (sha256 der Besucher-IP, nur Rolle PH Website Integration), sonst
     IP-Hash; zusätzlich Obergrenze je Methode und Benutzer über alle Clients
     (api_rate_limit_gesamt_pro_minute). Gast-Methoden ohne ph_api: Decorator `gast_rate_limit`
     (api_rate_limit_gast_pro_minute je Methode und IP). Logik: ph_core/utils/ratelimit.py.
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

Desk-/Backoffice-Methoden (ph_core.api.geraete, bediener, suche, aktivitaet) verwenden
@ph_api(intern=True, …): kein Wartungsschalter, Guest → 403, Rechte über frappe.has_permission
bzw. hilfsweise `rolle_pruefen(...)`; Rate-Limit und Protokoll wie bei der Website.

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


def _zaehlen(schluessel):
    cache = frappe.cache()
    zaehler = cache.incr(schluessel) if hasattr(cache, "incr") else None
    if zaehler is None:
        # Fallback ohne Redis-incr: ungefähre Zählung über get/set.
        zaehler = cint(cache.get_value(schluessel)) + 1
        cache.set_value(schluessel, zaehler, expires_in_sec=120)
    elif zaehler == 1:
        cache.expire(schluessel, 120)
    return cint(zaehler)


def _client_header():
    try:
        req = getattr(frappe.local, "request", None)
        return req.headers.get("X-PH-Client") if req is not None else None
    except Exception:  # noqa: BLE001
        return None


def _rate_limit_pruefen(methode, benutzer, limit, gesamt=0, ist_website=False):
    """True = erlaubt. Zählt je Methode+Benutzer+Client und (gesamt > 0) je Methode+Benutzer."""
    from ph_core.utils import ratelimit as RL

    jetzt = time.time()
    client = RL.client_kennung(benutzer in (None, "", "Guest"), ist_website, _client_header(), ip_hash())
    if not RL.erlaubt(_zaehlen(RL.schluessel(methode, benutzer, client, jetzt)), limit):
        return False
    if gesamt and gesamt > 0 and not RL.erlaubt(_zaehlen(RL.gesamt_schluessel(methode, benutzer, jetzt)), gesamt):
        return False
    return True


def gast_rate_limit(fn):
    """Ratenbegrenzung für allow_guest-Lesemethoden (Katalog, Karriere) je Methode und IP-Hash.

    Grenze PH Einstellungen.api_rate_limit_gast_pro_minute (0 = aus). Über der Grenze: HTTP 429 und
    {"code": "rate_limited"} statt der Daten. Kein Protokoll (Lesezugriffe, Datensparsamkeit). Für
    angemeldete Aufrufer (Token) gilt dieselbe Grenze je Benutzer und Client.
    Reihenfolge: @frappe.whitelist(...) außen, @gast_rate_limit innen.
    """
    methode = f"{fn.__module__}.{fn.__name__}"

    @functools.wraps(fn)
    def inner(*args, **kwargs):
        try:
            einst = _einstellungen()
            grenze = cint(einst.get("api_rate_limit_gast_pro_minute"))
            benutzer = frappe.session.user or "Guest"
            ist_website = benutzer not in ("Guest", "Administrator") and ROLLE_WEBSITE in frappe.get_roles(benutzer)
            ok = grenze <= 0 or _rate_limit_pruefen(methode, benutzer, grenze, ist_website=ist_website)
        except Exception:  # noqa: BLE001 – Zählerfehler sperren nie den Katalog
            ok = True
        if not ok:
            return _antwort_setzen(429, {"code": "rate_limited", "message": _("Zu viele Anfragen.")})
        return fn(*args, **kwargs)

    return inner


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


def ph_api(rolle=ROLLE_WEBSITE, idempotent=False, limit_pro_minute=None, referenz=None, intern=False):
    """Decorator, siehe Modul-Docstring.

    referenz: optionaler Callable(ergebnis) → (doctype, name) für das Protokoll,
    z. B. referenz=lambda r: ("PH Anfrage", r["referenz"]).
    intern=True: Methode für Desk-/Backoffice-Benutzer (ph_core.api.geraete, bediener, suche,
    aktivitaet). Der Wartungsschalter `api_aktiv` (gilt der Website) greift nicht; stattdessen wird
    Guest immer mit 403 abgewiesen. Rollenprüfung nur, wenn `rolle` gesetzt ist (Standard dann None).
    """
    if intern and rolle == ROLLE_WEBSITE:
        rolle = None

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

            if intern:
                if not benutzer or benutzer == "Guest":
                    return fertig("Abgelehnt", 403, {"code": "forbidden", "message": _("Anmeldung erforderlich.")})
            elif not einst["api_aktiv"]:
                return fertig("Abgelehnt", 503, {"code": "unavailable", "message": _("Website-API ist abgeschaltet.")})
            if benutzer != "Administrator" and rolle and rolle not in frappe.get_roles(benutzer):
                return fertig("Abgelehnt", 403, {"code": "forbidden", "message": _("Keine Berechtigung.")})

            limit = limit_pro_minute or einst["api_rate_limit_pro_minute"]
            ist_website = benutzer not in ("Guest", "Administrator") and ROLLE_WEBSITE in frappe.get_roles(benutzer)
            if not _rate_limit_pruefen(methode, benutzer, limit, cint(einst.get("api_rate_limit_gesamt_pro_minute")), ist_website):
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


ROLLEN_ADMIN = ("System Manager", "PH Backoffice-Admin")


def hat_rolle(*rollen, leitung=False, benutzer=None):
    """True, wenn der Benutzer Administrator ist, eine der Rollen hat oder (leitung=True) eine „PH … Leitung“-Rolle."""
    benutzer = benutzer or frappe.session.user
    if benutzer == "Administrator":
        return True
    eigene = set(frappe.get_roles(benutzer))
    if eigene & set(rollen):
        return True
    return bool(leitung and any(r.startswith("PH ") and r.endswith(" Leitung") for r in eigene))


def rolle_pruefen(*rollen, leitung=False):
    """Wirft ApiFehler("forbidden", 403), wenn hat_rolle() falsch ist."""
    if not hat_rolle(*rollen, leitung=leitung):
        raise ApiFehler("forbidden", 403, _("Keine Berechtigung."))


def liste(wert):
    """Parameter als Liste: JSON-String, kommagetrennter String, Liste oder None → list[str]."""
    if not wert:
        return []
    if isinstance(wert, str):
        s = wert.strip()
        if s.startswith("["):
            try:
                wert = json.loads(s)
            except ValueError:
                wert = s.split(",")
        else:
            wert = s.split(",")
    return [str(x).strip() for x in wert if str(x).strip()]


def _text_ohne_html(s):
    import re

    return re.sub(r"<[^>]+>", "", s or "").strip()


def token_hash(token):
    """sha256-Hex eines Portal-Tokens (Website: src/lib/portal/adapters/frappe.js, PH Kontakt.portal_token_hash)."""
    return hashlib.sha256(str(token or "").encode()).hexdigest()


def _portal_sitzung_pruefen(kontakt, kunde_token):
    """Kunden-Token einer `PH Portal Sitzung` (ph_projekte, mehrere aktive Sitzungen je Kontakt)?

    1. Hook `ph_portal_token_pruefen` (hooks.py einer App, z. B. ph_projekte:
       ph_portal_token_pruefen = ["ph_projekte.api.basis.sitzung_pruefen"]): Signatur (kontakt, kunde_token)
       → dict/True = gültige Sitzung, None = kein Sitzungs-Token; Fehler als ApiFehler. Der Hook hat Vorrang,
       weil die App dabei aktiviert, letzter_zugriff pflegt und überzählige Sitzungen bereinigt.
    2. Ohne Hook, aber mit DocType PH Portal Sitzung: rein lesende Prüfung hier (Kontakt, Status
       Angefordert/Aktiv, ablauf_am) über ph_core/utils/portal.py.
    3. Sonst None → Rückfall auf PH Kontakt.portal_token_hash.
    → True (gültige Sitzung) oder None.
    """
    for pfad in frappe.get_hooks("ph_portal_token_pruefen") or []:
        ergebnis = frappe.get_attr(pfad)(kontakt, kunde_token)
        if ergebnis:
            return True
    if frappe.get_hooks("ph_portal_token_pruefen"):
        return None
    if not frappe.db.exists("DocType", "PH Portal Sitzung"):
        return None
    from ph_core.utils.portal import sitzung_zustand

    s = frappe.db.get_value("PH Portal Sitzung", {"token_hash": token_hash(kunde_token)}, ["kontakt", "status", "ablauf_am"], as_dict=True)
    if not s:
        return None
    zustand = sitzung_zustand(s, kontakt, now_datetime())
    if zustand == "abgelaufen":
        raise ApiFehler("expired", 410, _("Kunden-Token abgelaufen."))
    if zustand != "ok":
        raise ApiFehler("invalid_token", 404, _("Zugang ungültig."))
    return True


def portal_kontakt_pruefen(kontakt, kunde_token):
    """Zentrale Kundenportal-Prüfung für ph_projekte, ph_faktura, ph_service, ph_kundenkarte (CONVENTIONS 11).

    Prüft: Kontakt übergeben, PH Kontakt installiert (ph_crm), Kontakt existiert, portal_aktiv, dann
    zuerst eine gültige `PH Portal Sitzung` mit sha256(kunde_token) (_portal_sitzung_pruefen: Hook
    `ph_portal_token_pruefen` oder lesende Prüfung, nur wenn der DocType existiert), sonst Rückfall auf
    portal_token_hash == sha256(kunde_token) in konstanter Zeit. Rückgabe: Name des Kontakts.
    Fehler: invalid 400, unavailable 503 (ph_crm fehlt/Felder fehlen), not_found 404, invalid_token 404,
    expired 410 (Sitzung abgelaufen).
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
    if not cint(k.portal_aktiv):
        raise ApiFehler("invalid_token", 404, _("Zugang ungültig."))
    if _portal_sitzung_pruefen(kontakt, kunde_token):
        return kontakt
    if not k.portal_token_hash or not hmac.compare_digest(str(k.portal_token_hash), token_hash(kunde_token)):
        raise ApiFehler("invalid_token", 404, _("Zugang ungültig."))
    return kontakt
