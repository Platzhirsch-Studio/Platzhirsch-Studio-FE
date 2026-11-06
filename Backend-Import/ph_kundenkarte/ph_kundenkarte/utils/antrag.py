"""Antragsprüfung und DOI-Token – ohne Frappe-Import (Tests ohne Site).

Regel wie ph_marketing.utils.token: im Datensatz liegt nur der SHA-256-Hash, der Klartext geht einmal
an die Website (die mailt den Bestätigungslink).
"""

import hashlib
import re
import secrets
from datetime import timedelta

PRAEFIX = "ph-kk:"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PLZ_RE = re.compile(r"^[A-Za-z]{0,2}-?\d{4,5}$")


def neuer_token():
    return secrets.token_urlsafe(32)


def hash_token(token):
    token = (token or "").strip()
    if not token:
        return None
    return hashlib.sha256((PRAEFIX + token).encode("utf-8")).hexdigest()


def token_plausibel(token):
    token = (token or "").strip()
    return 20 <= len(token) <= 128 and all(c.isalnum() or c in "-_" for c in token)


def token_gueltig(gesendet_am, gueltig_stunden, jetzt):
    if not gesendet_am:
        return False
    return jetzt <= gesendet_am + timedelta(hours=int(gueltig_stunden or 48))


def email_normalisieren(email):
    return str(email or "").strip().lower()


def email_plausibel(email):
    e = email_normalisieren(email)
    return bool(e) and len(e) <= 254 and bool(EMAIL_RE.match(e))


def email_maskieren(email):
    e = email_normalisieren(email)
    if "@" not in e:
        return ""
    lokal, domain = e.split("@", 1)
    return f"{lokal[:1]}***@{domain}"


def telefon_maskieren(telefon):
    """'+43 660 1234567' → '+43 ••• ••• 567'; leer → ''."""
    ziffern = re.sub(r"\D", "", str(telefon or ""))
    if len(ziffern) < 4:
        return ""
    return ("+" if str(telefon).strip().startswith("+") else "") + "•" * (len(ziffern) - 3) + ziffern[-3:]


def plz_plausibel(plz):
    return bool(PLZ_RE.match(str(plz or "").strip())) if plz else True


def antrag_pruefen(d):
    """Pflichtfelder und Plausibilität eines Website-Antrags → (ok, feld, meldung)."""
    for feld in ("vorname", "nachname", "email"):
        if not str(d.get(feld) or "").strip():
            return False, feld, "Pflichtfeld fehlt"
    if not email_plausibel(d.get("email")):
        return False, "email", "E-Mail-Adresse ist ungültig"
    if not plz_plausibel(d.get("plz")):
        return False, "plz", "Postleitzahl ist ungültig"
    if not d.get("vertragsdaten_akzeptiert"):
        return False, "vertragsdaten_akzeptiert", "Die Teilnahmebedingungen müssen akzeptiert werden"
    return True, None, None
