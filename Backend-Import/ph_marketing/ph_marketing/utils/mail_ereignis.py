"""Resend-Webhook (Zustellung, Bounce, Beschwerde) und List-Unsubscribe – ohne Frappe-Import.

Resend signiert Webhooks nach dem Svix-Schema (resend.com/docs/dashboard/webhooks/verify-webhooks-requests):
  Header svix-id, svix-timestamp (Unix s), svix-signature („v1,<base64> v1,<base64>“ – mehrere bei Schlüsselwechsel)
  Inhalt  = f"{svix_id}.{svix_timestamp}.{rohbody}"
  Schlüssel = base64-Teil nach „whsec_“ im Signing Secret (site_config: ph_resend_webhook_secret)
  Signatur = base64(HMAC-SHA256(schluessel, inhalt)); Toleranz ±5 min gegen Replay.

List-Unsubscribe nach RFC 2369/RFC 8058 (One-Click): Header „List-Unsubscribe: <https://…>, <mailto:…>“ und
„List-Unsubscribe-Post: List-Unsubscribe=One-Click“; der Empfänger-Client sendet POST mit genau diesem Body.
Gmail/Yahoo verlangen das seit 02/2024 für Massenversender.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import time

TOLERANZ_S = 300


class SignaturFehler(ValueError):
    pass


def _schluessel(secret):
    s = (secret or "").strip()
    if not s:
        raise SignaturFehler("kein Webhook-Geheimnis konfiguriert")
    if s.startswith("whsec_"):
        s = s[6:]
    try:
        return base64.b64decode(s)
    except (ValueError, TypeError):
        raise SignaturFehler("Webhook-Geheimnis ist kein gültiges base64") from None


def signatur_berechnen(secret, svix_id, svix_timestamp, body):
    if isinstance(body, str):
        body = body.encode("utf-8")
    inhalt = f"{svix_id}.{svix_timestamp}.".encode("utf-8") + body
    return base64.b64encode(hmac.new(_schluessel(secret), inhalt, hashlib.sha256).digest()).decode("ascii")


def signatur_pruefen(secret, svix_id, svix_timestamp, svix_signature, body, jetzt=None, toleranz_s=TOLERANZ_S):
    """Wirft SignaturFehler; → True."""
    if not svix_id or not svix_timestamp or not svix_signature:
        raise SignaturFehler("Signatur-Header fehlen")
    try:
        ts = int(str(svix_timestamp).strip())
    except ValueError:
        raise SignaturFehler("Zeitstempel ungültig") from None
    jetzt = int(jetzt if jetzt is not None else time.time())
    if abs(jetzt - ts) > toleranz_s:
        raise SignaturFehler("Zeitstempel außerhalb der Toleranz")
    erwartet = signatur_berechnen(secret, svix_id, ts, body)
    for teil in str(svix_signature).split():
        version, _, sig = teil.partition(",")
        if version == "v1" and hmac.compare_digest(sig.strip(), erwartet):
            return True
    raise SignaturFehler("Signatur stimmt nicht")


# Resend-Ereignistypen → interne Art
ARTEN = {
    "email.sent": "gesendet",
    "email.delivered": "zugestellt",
    "email.delivery_delayed": "verzoegert",
    "email.bounced": "bounce",
    "email.complained": "beschwerde",
    "email.failed": "fehler",
    "email.opened": "ignoriert",  # kein Tracking (README DOI und Datenschutz)
    "email.clicked": "ignoriert",
}
HART = ("permanent", "hard", "hardbounce", "undetermined_permanent")


def ereignis_abbilden(payload):
    """Resend-JSON → dict(art, typ, emails, nachricht_id, bounce_typ, grund, zeit). Unbekannt → art 'unbekannt'."""
    if not isinstance(payload, dict):
        raise ValueError("Ereignis ist kein Objekt")
    typ = str(payload.get("type") or "")
    daten = payload.get("data") or {}
    art = ARTEN.get(typ, "unbekannt")
    empf = daten.get("to") or []
    if isinstance(empf, str):
        empf = [empf]
    emails = [str(e).strip().lower() for e in empf if str(e).strip()]
    bounce_typ, grund = None, None
    if art == "bounce":
        b = daten.get("bounce") or {}
        roh = str(b.get("type") or daten.get("bounce_type") or "").strip().lower()
        bounce_typ = "hart" if roh in HART else "weich"
        grund = str(b.get("message") or b.get("subType") or "")[:140] or None
    if art == "fehler":
        grund = str((daten.get("failed") or {}).get("reason") or "")[:140] or None
    return {
        "art": art,
        "typ": typ,
        "emails": emails,
        "nachricht_id": daten.get("email_id") or daten.get("id"),
        "bounce_typ": bounce_typ,
        "grund": grund,
        "zeit": payload.get("created_at") or daten.get("created_at"),
    }


# Status im Versandprotokoll (PH Newsletter Versand.status) – Reihenfolge = „stärker“ überschreibt „schwächer“
STATUS_RANG = {"geplant": 0, "gesendet": 1, "verzoegert": 2, "zugestellt": 3, "fehler": 4, "bounce_weich": 5, "bounce": 6, "bounce_hart": 6, "abgemeldet": 7, "beschwerde": 8, "uebersprungen": 9}


def versand_status(art, bounce_typ=None):
    if art == "bounce":
        return "bounce_hart" if bounce_typ == "hart" else "bounce_weich"
    return {"gesendet": "gesendet", "zugestellt": "zugestellt", "verzoegert": "verzoegert", "beschwerde": "beschwerde", "fehler": "fehler", "abgemeldet": "abgemeldet"}.get(art)


def status_uebernehmen(alt, neu):
    """Nur stärkere Ereignisse überschreiben (ein später eintreffendes „delivered“ setzt Bounce nicht zurück)."""
    if not neu:
        return alt
    return neu if STATUS_RANG.get(neu, 0) >= STATUS_RANG.get(alt or "geplant", 0) else alt


def abo_folge(art, bounce_typ, bounce_count, soft_grenze=3):
    """Was passiert mit dem Abo? → None | 'bounce' | 'beschwerde'. Hart sofort, weich ab soft_grenze."""
    if art == "beschwerde":
        return "beschwerde"
    if art == "bounce":
        if bounce_typ == "hart":
            return "bounce"
        if int(bounce_count or 0) >= int(soft_grenze or 3):
            return "bounce"
    return None


def list_unsubscribe_header(https_url, mailto=None):
    """→ dict der Mail-Header (RFC 2369 + RFC 8058). https_url muss https sein (One-Click verlangt HTTPS)."""
    if not https_url or not str(https_url).startswith("https://"):
        raise ValueError("One-Click-Abmeldung braucht eine HTTPS-Adresse")
    teile = [f"<{https_url}>"]
    if mailto:
        teile.append(f"<mailto:{mailto}?subject=unsubscribe>")
    return {"List-Unsubscribe": ", ".join(teile), "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"}


def one_click_gueltig(body):
    """RFC 8058 §3.1: POST-Body muss „List-Unsubscribe=One-Click“ enthalten (form-encoded oder als dict)."""
    if isinstance(body, dict):
        return str(body.get("List-Unsubscribe") or "").strip() == "One-Click"
    if isinstance(body, bytes):
        body = body.decode("utf-8", "replace")
    teile = [t.strip() for t in str(body or "").split("&")]
    return "List-Unsubscribe=One-Click" in teile
