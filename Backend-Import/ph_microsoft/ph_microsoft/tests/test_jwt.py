"""Entra-ID-Token-Prüfung mit selbst erzeugten RSA-Testschlüsseln (kein Aufruf an Microsoft)."""

import time
import unittest

from ph_microsoft.logik.jwt_pruefung import TokenFehler, b64url_encode, identitaet, jwks_index, pruefen, zerlegen
from ph_microsoft.tests.hilfen import CLIENT, TENANT, Schluesselquelle, jwk, schluesselpaar, token


class TestJWT(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.privat = schluesselpaar()
        cls.fremd = schluesselpaar()
        cls.quelle = {"k1": jwk(cls.privat, "k1")}

    def pruef(self, tok, quelle=None, **kw):
        return pruefen(tok, quelle or Schluesselquelle(self.quelle), TENANT, CLIENT, **kw)

    def fehler(self, tok, code="invalid_token", **kw):
        with self.assertRaises(TokenFehler) as ctx:
            self.pruef(tok, **kw)
        self.assertEqual(ctx.exception.code, code)
        return ctx.exception

    def test_gueltig(self):
        c = self.pruef(token(self.privat), nonce="n-1")
        self.assertEqual(c["tid"], TENANT)

    def test_falsche_signatur(self):
        self.fehler(token(self.fremd))

    def test_manipulierte_nutzlast(self):
        kopf, _nutz, sig = token(self.privat).split(".")
        boese = b64url_encode(b'{"aud":"x"}')
        self.fehler(f"{kopf}.{boese}.{sig}")

    def test_alg_none_und_hs256_abgelehnt(self):
        for alg in ("none", "HS256", "RS512"):
            self.assertIn("Algorithmus", self.fehler(token(self.privat, alg=alg)).grund)

    def test_abgelaufen_und_toleranz(self):
        jetzt = time.time()
        self.fehler(token(self.privat, exp=int(jetzt) - 301))
        self.pruef(token(self.privat, exp=int(jetzt) - 200))  # innerhalb 5 min Toleranz

    def test_nbf_iat_in_zukunft(self):
        self.fehler(token(self.privat, nbf=int(time.time()) + 900))
        self.fehler(token(self.privat, iat=int(time.time()) + 900))
        self.pruef(token(self.privat, nbf=int(time.time()) + 120))

    def test_falsche_zielgruppe(self):
        self.fehler(token(self.privat, aud="ffffffff-0000-0000-0000-000000000000"))
        self.pruef(token(self.privat, aud=[CLIENT, "x"]))

    def test_falscher_issuer(self):
        self.fehler(token(self.privat, iss="https://login.microsoftonline.com/common/v2.0"))
        self.fehler(token(self.privat, iss=f"https://sts.windows.net/{TENANT}/"))

    def test_fremder_tenant_ist_forbidden(self):
        anderer = "22222222-2222-3333-4444-555555555555"
        self.fehler(token(self.privat, tid=anderer, iss=f"https://login.microsoftonline.com/{anderer}/v2.0"), code="forbidden")

    def test_unbekannte_kid_laedt_einmal_neu(self):
        q = Schluesselquelle({}, {"k2": jwk(self.privat, "k2")})
        self.pruef(token(self.privat, kid="k2"), quelle=q)
        self.assertEqual(q.neu, 1)
        q2 = Schluesselquelle({}, {})
        self.fehler(token(self.privat, kid="k9"), quelle=q2)
        self.assertEqual(q2.neu, 1)

    def test_nonce(self):
        self.fehler(token(self.privat), nonce="anders")
        self.pruef(token(self.privat))  # ohne nonce-Parameter prüft das Backoffice

    def test_kurzer_schluessel_abgelehnt(self):
        klein = schluesselpaar(1024)
        self.fehler(token(klein), quelle=Schluesselquelle({"k1": jwk(klein, "k1")}))

    def test_kaputte_tokens(self):
        for t in ("", "a.b", "a.b.c.d", "!!.??.--", "x" * 20000):
            with self.assertRaises(TokenFehler):
                zerlegen(t)

    def test_identitaet_und_ueberlauf(self):
        c = self.pruef(token(self.privat))
        i = identitaet(c)
        self.assertEqual(i["email"], "max.muster@platzhirsch.studio")
        self.assertEqual(i["gruppen"], ["ab000000-0000-0000-0000-000000000001"])
        self.assertFalse(i["gruppen_ueberlauf"])
        i2 = identitaet({**c, "groups": None, "_claim_names": {"groups": "src1"}})
        self.assertIsNone(i2["gruppen"])
        self.assertTrue(i2["gruppen_ueberlauf"])

    def test_jwks_index_filtert(self):
        idx = jwks_index({"keys": [jwk(self.privat, "a"), {"kty": "EC", "kid": "b"}, {**jwk(self.privat, "c"), "use": "enc"}]})
        self.assertEqual(list(idx), ["a"])


if __name__ == "__main__":
    unittest.main()
