"""Graph-Client und Token gegen Attrappen – kein Netzwerk, kein requests nötig."""

import json
import unittest

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

from ph_microsoft.graph.client import DeltaAbgelaufen, GraphClient, GraphFehler
from ph_microsoft.graph.token import GraphTokenFehler, TokenQuelle
from ph_microsoft.logik.jwt_pruefung import b64url_decode
from ph_microsoft.tests.hilfen import CLIENT, TENANT, schluesselpaar


class FesterToken:
    def __init__(self):
        self.erzwungen = 0

    def token(self, erzwingen=False):
        self.erzwungen += 1 if erzwingen else 0
        return "tok-neu" if self.erzwungen else "tok-alt"


class Transport:
    """Antwortet der Reihe nach mit (status, headers, body); merkt sich die Aufrufe."""

    def __init__(self, *antworten):
        self.antworten = list(antworten)
        self.aufrufe = []

    def __call__(self, methode, url, headers, json_body, params, timeout):
        self.aufrufe.append((methode, url, headers.get("Authorization"), params))
        return self.antworten.pop(0)


class TestClient(unittest.TestCase):
    def client(self, *antworten):
        self.schlaf = []
        self.t = Transport(*antworten)
        return GraphClient(FesterToken(), transport=self.t, schlafen=self.schlaf.append, max_warten=30)

    def test_retry_after_bei_429_und_503(self):
        g = self.client((429, {"Retry-After": "7"}, None), (503, {}, None), (200, {}, {"ok": 1}))
        self.assertEqual(g.get("/me"), {"ok": 1})
        self.assertEqual(self.schlaf, [7.0, 2.0])

    def test_retry_after_gedeckelt(self):
        g = self.client((429, {"retry-after": "999"}, None), (200, {}, {}))
        g.get("/x")
        self.assertEqual(self.schlaf, [30])

    def test_401_holt_neuen_token(self):
        g = self.client((401, {}, None), (200, {}, {"v": 1}))
        g.get("/x")
        self.assertEqual([a[2] for a in self.t.aufrufe], ["Bearer tok-alt", "Bearer tok-neu"])

    def test_fehlerbild_ohne_inhalt(self):
        g = self.client((403, {}, {"error": {"code": "ErrorAccessDenied", "message": "Access is denied." * 50}}))
        with self.assertRaises(GraphFehler) as ctx:
            g.get("/users/x/messages")
        self.assertEqual((ctx.exception.status, ctx.exception.code), (403, "ErrorAccessDenied"))
        self.assertLessEqual(len(ctx.exception.meldung), 200)

    def test_paging(self):
        g = self.client(
            (200, {}, {"value": [1, 2], "@odata.nextLink": "https://graph.microsoft.com/v1.0/x?$skiptoken=a"}),
            (200, {}, {"value": [3]}),
        )
        self.assertEqual(list(g.seiten("/x", params={"$top": 2})), [1, 2, 3])
        self.assertIsNone(self.t.aufrufe[1][3])  # nextLink ohne erneute Parameter

    def test_delta(self):
        g = self.client(
            (200, {}, {"value": [{"id": "a"}], "@odata.nextLink": "https://graph.microsoft.com/v1.0/d?skip=1"}),
            (200, {}, {"value": [{"id": "b", "@removed": {"reason": "deleted"}}], "@odata.deltaLink": "https://graph.microsoft.com/v1.0/d?delta=2"}),
        )
        items, link = g.delta("/users/x/calendarView/delta", params={"startDateTime": "s"})
        self.assertEqual([i["id"] for i in items], ["a", "b"])
        self.assertTrue(link.endswith("delta=2"))

    def test_delta_abgelaufen(self):
        g = self.client((410, {}, {"error": {"code": "syncStateNotFound"}}))
        with self.assertRaises(DeltaAbgelaufen):
            g.delta("https://graph.microsoft.com/v1.0/d?delta=alt")

    def test_fremder_host_abgelehnt(self):
        g = self.client()
        with self.assertRaises(GraphFehler):
            g.get("https://boese.invalid/v1.0/x")
        self.assertEqual(self.t.aufrufe, [])

    def test_204_leer(self):
        self.assertEqual(self.client((204, {}, None)).delete("/x"), {})


class TestToken(unittest.TestCase):
    def test_secret_und_cache(self):
        aufrufe = []

        def post(url, data, timeout):
            aufrufe.append((url, dict(data)))
            return 200, {"access_token": f"at-{len(aufrufe)}", "expires_in": 3600}

        q = TokenQuelle(TENANT, CLIENT, client_secret="geheim-test", http_post=post)
        self.assertEqual(q.token(), "at-1")
        self.assertEqual(q.token(), "at-1")
        self.assertEqual(q.token(erzwingen=True), "at-2")
        url, form = aufrufe[0]
        self.assertIn(f"/{TENANT}/oauth2/v2.0/token", url)
        self.assertEqual((form["grant_type"], form["scope"]), ("client_credentials", "https://graph.microsoft.com/.default"))

    def test_fehler_ohne_token_im_text(self):
        q = TokenQuelle(TENANT, CLIENT, client_secret="x", http_post=lambda u, d, t: (401, {"error": "invalid_client", "error_description": "AADSTS7000215"}))
        with self.assertRaises(GraphTokenFehler) as ctx:
            q.token()
        self.assertEqual(ctx.exception.code, "invalid_client")

    def test_nicht_konfiguriert(self):
        with self.assertRaises(GraphTokenFehler):
            TokenQuelle("kein-guid", CLIENT, client_secret="x")
        with self.assertRaises(GraphTokenFehler):
            TokenQuelle(TENANT, CLIENT)

    def test_zertifikat_assertion(self):
        privat = schluesselpaar()
        pem = privat.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()).decode()
        gesendet = {}

        def post(url, data, timeout):
            gesendet.update(data)
            return 200, {"access_token": "at", "expires_in": 3600}

        q = TokenQuelle(TENANT, CLIENT, cert_pem=pem, cert_thumbprint="AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01", http_post=post, uhr=lambda: 1_800_000_000)
        q.token()
        self.assertNotIn("client_secret", gesendet)
        kopf, nutz, sig = gesendet["client_assertion"].split(".")
        k = json.loads(b64url_decode(kopf))
        c = json.loads(b64url_decode(nutz))
        self.assertEqual(k["alg"], "RS256")
        self.assertEqual(b64url_decode(k["x5t"]).hex().upper(), "ABCDEF0123456789ABCDEF0123456789ABCDEF01")
        self.assertEqual((c["iss"], c["sub"], c["exp"] - c["nbf"]), (CLIENT, CLIENT, 600))
        privat.public_key().verify(b64url_decode(sig), f"{kopf}.{nutz}".encode(), padding.PKCS1v15(), hashes.SHA256())


if __name__ == "__main__":
    unittest.main()
