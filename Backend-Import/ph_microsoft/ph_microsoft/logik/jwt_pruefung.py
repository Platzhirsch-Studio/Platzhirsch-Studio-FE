"""Prüfung von Entra-ID-ID-Tokens (OpenID Connect v2.0, RS256) – ohne Frappe, testbar mit unittest.

Quelle der Regeln: Microsoft identity platform, „ID tokens“ und „Validate tokens“
(https://learn.microsoft.com/entra/identity-platform/id-tokens). Geprüft wird:
  * Kopf: alg = RS256 (nie none/HS*), kid vorhanden, Schlüssel aus dem JWKS des Tenants
    (https://login.microsoftonline.com/<tenant>/discovery/v2.0/keys). Unbekannte kid → einmal neu laden.
  * Signatur RSASSA-PKCS1-v1_5 mit SHA-256 (Bibliothek `cryptography`, kommt mit Frappe).
  * Claims: iss = https://login.microsoftonline.com/<tenant>/v2.0, aud = Client-ID des Backoffice,
    tid = erlaubter Tenant (sonst „forbidden“), exp/nbf/iat mit Toleranz (Standard 300 s),
    ver = 2.0 (falls vorhanden), nonce nur, wenn übergeben (das Backoffice prüft sie ohnehin).
Fehler: TokenFehler(code, grund) mit code „invalid_token“ (→ HTTP 401) oder „forbidden“ (→ 403).
Der Token selbst wird nie protokolliert; `grund` enthält keine Token-Teile.
"""

import base64
import json
import re
import time

MAX_TOKEN_LAENGE = 16384
GUID_RE = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")


class TokenFehler(Exception):
    def __init__(self, code, grund):
        super().__init__(grund)
        self.code = code
        self.grund = grund


def ist_guid(wert):
    return bool(GUID_RE.match(str(wert or "").strip()))


def b64url_decode(teil):
    if not isinstance(teil, str) or not re.match(r"^[A-Za-z0-9_-]*$", teil):
        raise TokenFehler("invalid_token", "Base64url ungültig")
    return base64.urlsafe_b64decode(teil + "=" * (-len(teil) % 4))


def b64url_encode(daten):
    return base64.urlsafe_b64encode(daten).rstrip(b"=").decode("ascii")


def zerlegen(token):
    """→ (header, claims, signing_input: bytes, signatur: bytes)."""
    if not isinstance(token, str) or not token or len(token) > MAX_TOKEN_LAENGE:
        raise TokenFehler("invalid_token", "Token fehlt oder zu lang")
    teile = token.strip().split(".")
    if len(teile) != 3:
        raise TokenFehler("invalid_token", "Kein JWS (drei Teile erwartet)")
    try:
        header = json.loads(b64url_decode(teile[0]))
        claims = json.loads(b64url_decode(teile[1]))
    except TokenFehler:
        raise
    except Exception:  # noqa: BLE001
        raise TokenFehler("invalid_token", "Kopf oder Nutzlast kein JSON")
    if not isinstance(header, dict) or not isinstance(claims, dict):
        raise TokenFehler("invalid_token", "Kopf oder Nutzlast kein Objekt")
    return header, claims, f"{teile[0]}.{teile[1]}".encode("ascii"), b64url_decode(teile[2])


def jwks_index(jwks):
    """JWKS-Dokument {"keys": [...]} → {kid: jwk} (nur RSA-Signaturschlüssel)."""
    aus = {}
    for k in (jwks or {}).get("keys", []) or []:
        if isinstance(k, dict) and k.get("kty") == "RSA" and k.get("kid") and k.get("n") and k.get("e") and k.get("use", "sig") == "sig":
            aus[k["kid"]] = k
    return aus


def oeffentlicher_schluessel(jwk):
    from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicNumbers

    try:
        n = int.from_bytes(b64url_decode(jwk["n"]), "big")
        e = int.from_bytes(b64url_decode(jwk["e"]), "big")
    except (KeyError, TokenFehler):
        raise TokenFehler("invalid_token", "Schlüssel unvollständig")
    if n.bit_length() < 2048:
        raise TokenFehler("invalid_token", "Schlüssel zu kurz")
    return RSAPublicNumbers(e, n).public_key()


def signatur_pruefen(jwk, signing_input, signatur):
    from cryptography.exceptions import InvalidSignature
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding

    try:
        oeffentlicher_schluessel(jwk).verify(signatur, signing_input, padding.PKCS1v15(), hashes.SHA256())
    except InvalidSignature:
        raise TokenFehler("invalid_token", "Signatur ungültig")


def erwarteter_issuer(tenant_id):
    return f"https://login.microsoftonline.com/{str(tenant_id).strip().lower()}/v2.0"


def claims_pruefen(claims, tenant_id, client_id, jetzt=None, toleranz=300, nonce=None):
    jetzt = time.time() if jetzt is None else jetzt
    tenant = str(tenant_id or "").strip().lower()
    if not ist_guid(tenant) or not str(client_id or "").strip():
        raise TokenFehler("invalid_token", "Tenant oder Client-ID nicht konfiguriert")
    if str(claims.get("tid") or "").lower() != tenant:
        raise TokenFehler("forbidden", "Tenant nicht erlaubt")
    if str(claims.get("iss") or "").lower() != erwarteter_issuer(tenant):
        raise TokenFehler("invalid_token", "Aussteller (iss) passt nicht")
    if claims.get("ver") not in (None, "2.0"):
        raise TokenFehler("invalid_token", "Token-Version nicht 2.0")
    aud = claims.get("aud")
    zielgruppen = aud if isinstance(aud, list) else [aud]
    if str(client_id).strip() not in [str(a) for a in zielgruppen]:
        raise TokenFehler("invalid_token", "Zielgruppe (aud) passt nicht")
    try:
        exp = float(claims["exp"])
    except (KeyError, TypeError, ValueError):
        raise TokenFehler("invalid_token", "exp fehlt")
    if jetzt > exp + toleranz:
        raise TokenFehler("invalid_token", "Token abgelaufen")
    for feld, text in (("nbf", "noch nicht gültig (nbf)"), ("iat", "in der Zukunft ausgestellt (iat)")):
        if claims.get(feld) is not None:
            try:
                wert = float(claims[feld])
            except (TypeError, ValueError):
                raise TokenFehler("invalid_token", f"{feld} ungültig")
            if wert > jetzt + toleranz:
                raise TokenFehler("invalid_token", f"Token {text}")
    if nonce is not None and str(claims.get("nonce") or "") != str(nonce):
        raise TokenFehler("invalid_token", "nonce passt nicht")
    if not claims.get("oid") and not claims.get("sub"):
        raise TokenFehler("invalid_token", "oid/sub fehlt")
    return claims


def pruefen(token, schluessel_quelle, tenant_id, client_id, jetzt=None, toleranz=300, nonce=None):
    """Volle Prüfung. schluessel_quelle(kid, neu_laden: bool) → jwk-dict oder None.
    Rückgabe: Claims (dict)."""
    header, claims, signing_input, signatur = zerlegen(token)
    if header.get("alg") != "RS256":
        raise TokenFehler("invalid_token", "Algorithmus nicht erlaubt")
    if header.get("crit"):
        raise TokenFehler("invalid_token", "crit-Kopf nicht unterstützt")
    kid = header.get("kid")
    if not kid or not isinstance(kid, str) or len(kid) > 200:
        raise TokenFehler("invalid_token", "kid fehlt")
    jwk = schluessel_quelle(kid, False) or schluessel_quelle(kid, True)
    if not jwk:
        raise TokenFehler("invalid_token", "Schlüssel unbekannt")
    signatur_pruefen(jwk, signing_input, signatur)
    return claims_pruefen(claims, tenant_id, client_id, jetzt=jetzt, toleranz=toleranz, nonce=nonce)


def identitaet(claims):
    """Benutzerdaten aus den Claims. groups = None bei Gruppen-Überlauf (> 200 Gruppen, `_claim_names`/`hasgroups`)."""
    email = str(claims.get("preferred_username") or claims.get("email") or claims.get("upn") or "").strip().lower()
    alternativ = str(claims.get("email") or "").strip().lower()
    ueberlauf = bool((claims.get("_claim_names") or {}).get("groups")) or bool(claims.get("hasgroups"))
    gruppen = claims.get("groups")
    if ueberlauf or not isinstance(gruppen, list):
        gruppen = None if ueberlauf else []
    return {
        "oid": str(claims.get("oid") or claims.get("sub") or "").strip().lower(),
        "email": email if "@" in email else "",
        "email_alternativ": alternativ if "@" in alternativ and alternativ != email else "",
        "name": str(claims.get("name") or "").strip()[:140],
        "gruppen": [str(g).lower() for g in gruppen] if gruppen is not None else None,
        "gruppen_ueberlauf": ueberlauf,
        "tid": str(claims.get("tid") or "").lower(),
        "einmal_id": str(claims.get("uti") or claims.get("jti") or ""),
        "exp": claims.get("exp"),
    }
