"""Token für Double-Opt-in, Abmeldung und Event-Absage – ohne Frappe-Import (Tests ohne Site).

Regel: Im Datensatz liegt nur der SHA-256-Hash, der Klartext steht einmalig im Link der Mail.
Zufall: secrets.token_urlsafe(32) = 43 Zeichen, URL-sicher.
"""

import hashlib
import secrets
from datetime import datetime, timedelta

TOKEN_LAENGE = 32
PRAEFIX = "ph-mkt:"


def neuer_token():
    return secrets.token_urlsafe(TOKEN_LAENGE)


def hash_token(token):
    """SHA-256 über Präfix + Token; None/leer → None (nie den Hash des leeren Strings speichern)."""
    token = (token or "").strip()
    if not token:
        return None
    return hashlib.sha256((PRAEFIX + token).encode("utf-8")).hexdigest()


def token_plausibel(token):
    token = (token or "").strip()
    return 20 <= len(token) <= 128 and all(c.isalnum() or c in "-_" for c in token)


def token_gueltig(gesendet_am, gueltig_stunden, jetzt=None):
    """DOI-Link gültig? gesendet_am: datetime; gueltig_stunden: int (Standard 48)."""
    if not gesendet_am:
        return False
    jetzt = jetzt or datetime.now()
    return jetzt <= gesendet_am + timedelta(hours=int(gueltig_stunden or 48))


def email_normalisieren(email):
    return str(email or "").strip().lower()


def email_plausibel(email):
    e = email_normalisieren(email)
    if not e or len(e) > 254 or "@" not in e or " " in e:
        return False
    lokal, _, domain = e.rpartition("@")
    return bool(lokal) and "." in domain and not domain.startswith(".") and not domain.endswith(".")


def email_maskieren(email):
    """a***@example.com – für Antworten an Browser-nahe Endpunkte (CONVENTIONS 11)."""
    e = email_normalisieren(email)
    if "@" not in e:
        return ""
    lokal, domain = e.split("@", 1)
    return f"{lokal[:1]}***@{domain}"
