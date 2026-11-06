"""Testhilfen ohne Frappe: RSA-Testschlüssel zur Laufzeit (nie im Repo), signierte Test-JWTs."""

import json
import time

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa

from ph_microsoft.logik.jwt_pruefung import b64url_encode

TENANT = "11111111-2222-3333-4444-555555555555"
CLIENT = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"


def schluesselpaar(bits=2048):
    return rsa.generate_private_key(public_exponent=65537, key_size=bits)


def jwk(privat, kid):
    zahlen = privat.public_key().public_numbers()

    def b(i):
        return b64url_encode(i.to_bytes((i.bit_length() + 7) // 8, "big"))

    return {"kty": "RSA", "use": "sig", "kid": kid, "n": b(zahlen.n), "e": b(zahlen.e)}


def claims(**ueberschreiben):
    jetzt = int(time.time())
    c = {
        "aud": CLIENT, "iss": f"https://login.microsoftonline.com/{TENANT}/v2.0", "tid": TENANT, "ver": "2.0",
        "iat": jetzt, "nbf": jetzt, "exp": jetzt + 3600, "oid": "99999999-0000-0000-0000-000000000001",
        "preferred_username": "Max.Muster@platzhirsch.studio", "name": "Max Muster", "nonce": "n-1", "uti": "uti-1",
        "groups": ["Ab000000-0000-0000-0000-000000000001"],
    }
    c.update(ueberschreiben)
    return {k: v for k, v in c.items() if v is not None}


def token(privat, kid="k1", alg="RS256", **claim_werte):
    kopf = b64url_encode(json.dumps({"alg": alg, "kid": kid, "typ": "JWT"}).encode())
    nutz = b64url_encode(json.dumps(claims(**claim_werte)).encode())
    sig = privat.sign(f"{kopf}.{nutz}".encode(), padding.PKCS1v15(), hashes.SHA256())
    return f"{kopf}.{nutz}.{b64url_encode(sig)}"


class Schluesselquelle:
    """Attrappe für das JWKS: zählt Neulade-Aufrufe."""

    def __init__(self, vorher, nachher=None):
        self.vorher, self.nachher, self.neu = vorher, nachher if nachher is not None else vorher, 0

    def __call__(self, kid, neu_laden):
        if neu_laden:
            self.neu += 1
            return self.nachher.get(kid)
        return self.vorher.get(kid)
