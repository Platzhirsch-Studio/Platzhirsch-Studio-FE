"""Speicher-Adapter gegen Attrappen – keine echten Aufrufe, kein requests nötig."""

import io
import json
import os
import shutil
import tempfile
import unittest
from datetime import datetime, timezone

from ph_ablage import speicher
from ph_ablage.speicher import NichtGefunden, NichtKonfiguriert, SpeicherFehler
from ph_ablage.speicher.basis import content_disposition
from ph_ablage.speicher.google_drive import GoogleDriveSpeicher, jwt_erzeugen
from ph_ablage.speicher.lokal import LokalSpeicher
from ph_ablage.speicher.onedrive import OneDriveSpeicher
from ph_ablage.speicher.s3 import S3Speicher

KEY = "2026/PH-DAT-2026-000001/1-ab12cd34.pdf"


class Antwort:
    def __init__(self, status=200, body=b"", headers=None, js=None):
        self.status_code = status
        self.content = body if isinstance(body, bytes) else str(body).encode()
        self.text = self.content.decode("utf-8", "replace")
        self.headers = headers or {}
        self._js = js
        self.raw = io.BytesIO(self.content)

    def json(self):
        return self._js if self._js is not None else json.loads(self.text or "{}")

    def close(self):
        pass


class Sitzung:
    """Zeichnet Anfragen auf und antwortet aus einer Liste (FIFO) oder per Funktion."""

    def __init__(self, antworten=None, fn=None):
        self.antworten = list(antworten or [])
        self.fn = fn
        self.anfragen = []

    def request(self, methode, url, **kw):
        self.anfragen.append({"methode": methode, "url": url, **kw})
        if self.fn:
            return self.fn(methode, url, kw)
        return self.antworten.pop(0) if self.antworten else Antwort(200)


class TestLokal(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.s = LokalSpeicher(self.tmp)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_rundlauf(self):
        self.assertEqual(self.s.put(KEY, b"%PDF-1.7 inhalt", "application/pdf")["groesse"], 15)
        self.assertTrue(self.s.exists(KEY))
        self.assertEqual(self.s.head(KEY)["groesse"], 15)
        with self.s.get(KEY) as f:
            self.assertEqual(f.read(), b"%PDF-1.7 inhalt")
        self.assertEqual(self.s.list("2026/"), [KEY])
        self.s.delete(KEY)
        self.assertFalse(self.s.exists(KEY))
        self.assertEqual(os.listdir(self.tmp), [])  # leere Ordner aufgeräumt
        self.s.delete(KEY)  # zweites Löschen ist kein Fehler

    def test_stream(self):
        self.s.put(KEY, io.BytesIO(b"x" * 100000))
        self.assertEqual(self.s.head(KEY)["groesse"], 100000)

    def test_pfad_ausbruch(self):
        for boese in ("../x", "a/../../x", "/etc/passwd", "", "a//b"):
            with self.assertRaises(SpeicherFehler, msg=boese):
                self.s.put(boese, b"x")

    def test_fehlend(self):
        with self.assertRaises(NichtGefunden):
            self.s.get(KEY)
        self.assertIsNone(self.s.presign_get(KEY))
        self.assertTrue(self.s.pruefen()["ok"])


class TestS3(unittest.TestCase):
    def _s3(self, sitzung):
        return S3Speicher("https://fsn1.example-objectstorage.eu", "eu-central", "ph-ablage", "KEYID", "SECRET", session=sitzung, zeit=datetime(2026, 11, 4, 12, tzinfo=timezone.utc))

    def test_nicht_konfiguriert(self):
        with self.assertRaises(NichtKonfiguriert) as e:
            S3Speicher("", "eu", "b", None, "s")
        self.assertIn("ph_ablage_s3_endpoint", e.exception.fehlend)
        self.assertIn("ph_ablage_s3_key", e.exception.fehlend)
        with self.assertRaises(NichtKonfiguriert):
            S3Speicher("http://unsicher.example", "eu", "bucket", "k", "s")

    def test_put_signiert(self):
        sz = Sitzung([Antwort(200, headers={"ETag": '"abc"'})])
        erg = self._s3(sz).put(KEY, b"inhalt", "application/pdf")
        a = sz.anfragen[0]
        self.assertEqual(a["methode"], "PUT")
        self.assertEqual(a["url"], "https://fsn1.example-objectstorage.eu/ph-ablage/" + KEY)
        self.assertTrue(a["headers"]["Authorization"].startswith("AWS4-HMAC-SHA256 Credential=KEYID/20261104/eu-central/s3/aws4_request"))
        import hashlib

        self.assertEqual(a["headers"]["x-amz-content-sha256"], hashlib.sha256(b"inhalt").hexdigest())
        self.assertEqual(erg, {"groesse": 6, "etag": "abc"})

    def test_put_stream_unsigned(self):
        sz = Sitzung([Antwort(200)])
        self._s3(sz).put(KEY, io.BytesIO(b"12345"))
        self.assertEqual(sz.anfragen[0]["headers"]["x-amz-content-sha256"], "UNSIGNED-PAYLOAD")
        self.assertEqual(sz.anfragen[0]["headers"]["content-length"], "5")

    def test_fehler_und_404(self):
        s = self._s3(Sitzung([Antwort(403, "<Error><Code>AccessDenied</Code></Error>")]))
        with self.assertRaises(SpeicherFehler) as e:
            s.put(KEY, b"x")
        self.assertIn("AccessDenied", str(e.exception))
        s = self._s3(Sitzung([Antwort(404)]))
        with self.assertRaises(NichtGefunden):
            s.get(KEY)
        self.assertIsNone(self._s3(Sitzung([Antwort(404)])).head(KEY))
        self._s3(Sitzung([Antwort(404)])).delete(KEY)  # fehlend = ok

    def test_get_und_head(self):
        s = self._s3(Sitzung([Antwort(200, b"daten")]))
        self.assertEqual(s.get(KEY).read(), b"daten")
        s = self._s3(Sitzung([Antwort(200, headers={"Content-Length": "42", "x-amz-checksum-sha256": "q83v"})]))
        self.assertEqual(s.head(KEY), {"groesse": 42, "etag": None, "sha256_b64": "q83v"})

    def test_list_mit_fortsetzung(self):
        seite1 = "<ListBucketResult><Contents><Key>2026/a</Key></Contents><IsTruncated>true</IsTruncated><NextContinuationToken>t+1</NextContinuationToken></ListBucketResult>"
        seite2 = "<ListBucketResult><Contents><Key>2026/b&amp;c</Key></Contents><IsTruncated>false</IsTruncated></ListBucketResult>"
        sz = Sitzung([Antwort(200, seite1), Antwort(200, seite2)])
        self.assertEqual(self._s3(sz).list("2026/"), ["2026/a", "2026/b&c"])
        self.assertIn("continuation-token=t%2B1", sz.anfragen[1]["url"])

    def test_presign(self):
        s = self._s3(Sitzung())
        url = s.presign_get(KEY, 300, dateiname="Küche Müller.pdf")
        self.assertIn("X-Amz-Expires=300", url)
        self.assertIn("response-content-disposition=attachment", url)
        put = s.presign_put(KEY, 900, "application/pdf", sha256_b64="q83v")
        self.assertEqual(put["methode"], "PUT")
        self.assertEqual(put["header"], {"Content-Type": "application/pdf", "x-amz-checksum-sha256": "q83v"})
        self.assertIn("content-type%3Bhost%3Bx-amz-checksum-sha256", put["url"])

    def test_virtueller_host(self):
        s = S3Speicher("https://{bucket}.s3.eu-central-1.amazonaws.com", "eu-central-1", "ph-ablage", "K", "S", session=Sitzung())
        self.assertEqual(s.url(KEY), "https://ph-ablage.s3.eu-central-1.amazonaws.com/" + KEY)


class TestGoogleDrive(unittest.TestCase):
    KONTO = {"client_email": "ablage@projekt.iam.gserviceaccount.com", "private_key_id": "k1"}

    def _gd(self, fn):
        return GoogleDriveSpeicher(self.KONTO, "ROOT123", session=Sitzung(fn=fn), signierer=lambda b: b"sig", uhr=lambda: 1_800_000_000)

    def test_nicht_konfiguriert(self):
        with self.assertRaises(NichtKonfiguriert) as e:
            GoogleDriveSpeicher(None, None)
        self.assertEqual(e.exception.fehlend, ("ph_ablage_gdrive_service_account", "ph_ablage_gdrive_root_id"))
        with self.assertRaises(NichtKonfiguriert):
            GoogleDriveSpeicher("{kein json", "R")

    def test_jwt(self):
        t = jwt_erzeugen(self.KONTO, 1_800_000_000, lambda b: b"sig")
        kopf, claims, sig = t.split(".")
        import base64

        c = json.loads(base64.urlsafe_b64decode(claims + "=="))
        self.assertEqual(c["iss"], self.KONTO["client_email"])
        self.assertEqual(c["exp"] - c["iat"], 3600)
        self.assertEqual(sig, "c2ln")

    def test_put_resumable_und_get(self):
        def fn(m, url, kw):
            if "oauth2" in url:
                return Antwort(200, js={"access_token": "tok", "expires_in": 3600})
            if url.endswith("/files") and m == "GET":
                q = kw["params"]["q"]
                self.assertIn("'ROOT123' in parents", q)
                return Antwort(200, js={"files": [{"id": "F1", "name": KEY, "size": "6"}] if getattr(self, "_da", False) else []})
            if "uploadType=resumable" in url:
                self.assertEqual(json.loads(kw["data"])["parents"], ["ROOT123"])
                return Antwort(200, headers={"Location": "https://upload.example/session1"})
            if url == "https://upload.example/session1":
                self.assertEqual(kw["headers"]["Content-Range"], "bytes 0-5/6")
                self._da = True
                return Antwort(200, js={"id": "F1"})
            if "/files/F1" in url:
                self.assertEqual(kw["headers"]["Authorization"], "Bearer tok")
                return Antwort(200, b"inhalt")
            raise AssertionError(url)

        gd = self._gd(fn)
        self.assertEqual(gd.put(KEY, b"inhalt", "application/pdf")["groesse"], 6)
        self.assertEqual(gd.get(KEY).read(), b"inhalt")
        self.assertEqual(gd.head(KEY)["groesse"], 6)
        self.assertIsNone(gd.presign_get(KEY))

    def test_name_mit_hochkomma_escaped(self):
        gesehen = {}

        def fn(m, url, kw):
            if "oauth2" in url:
                return Antwort(200, js={"access_token": "t"})
            gesehen["q"] = kw["params"]["q"]
            return Antwort(200, js={"files": []})

        self.assertFalse(self._gd(fn).exists("a'b"))
        self.assertIn("name = 'a\\'b'", gesehen["q"])

    def test_token_fehler(self):
        gd = self._gd(lambda m, u, kw: Antwort(401))
        with self.assertRaises(SpeicherFehler):
            gd.exists(KEY)


class TestOneDrive(unittest.TestCase):
    def _od(self, fn):
        return OneDriveSpeicher("tenant-id", "client", "geheim", "b!drive", session=Sitzung(fn=fn), uhr=lambda: 1_800_000_000)

    def test_nicht_konfiguriert(self):
        with self.assertRaises(NichtKonfiguriert) as e:
            OneDriveSpeicher("t", None, None, "d")
        self.assertEqual(e.exception.fehlend, ("ph_ablage_ms_client_id", "ph_ablage_ms_client_secret"))

    def test_kleiner_upload_und_presign(self):
        def fn(m, url, kw):
            if "login.microsoftonline.com/tenant-id/oauth2/v2.0/token" in url:
                self.assertEqual(kw["data"]["grant_type"], "client_credentials")
                return Antwort(200, js={"access_token": "tok"})
            self.assertTrue(url.startswith("https://graph.microsoft.com/v1.0/drives/b!drive/root:/ph-ablage/2026/"), url)
            if m == "PUT":
                self.assertTrue(url.endswith(":/content"))
                return Antwort(201, js={"eTag": "e1"})
            return Antwort(200, js={"size": 6, "@microsoft.graph.downloadUrl": "https://dl.example/x"})

        od = self._od(fn)
        self.assertEqual(od.put(KEY, b"inhalt")["groesse"], 6)
        self.assertEqual(od.presign_get(KEY), "https://dl.example/x")
        self.assertEqual(od.head(KEY)["groesse"], 6)

    def test_grosser_upload_in_teilen(self):
        teile = []

        def fn(m, url, kw):
            if "oauth2" in url:
                return Antwort(200, js={"access_token": "tok"})
            if url.endswith(":/createUploadSession"):
                return Antwort(200, js={"uploadUrl": "https://upload.example/s"})
            if url == "https://upload.example/s":
                self.assertNotIn("Authorization", kw["headers"])
                teile.append(kw["headers"]["Content-Range"])
                return Antwort(202)
            raise AssertionError(url)

        groesse = 9 * 1024 * 1024
        self._od(fn).put(KEY, io.BytesIO(b"x" * groesse))
        self.assertEqual(teile[0], f"bytes 0-{320 * 1024 * 25 - 1}/{groesse}")
        self.assertTrue(teile[-1].endswith(f"-{groesse - 1}/{groesse}"))

    def test_token_aus_ph_microsoft(self):
        gesehen = {}

        def fn(m, url, kw):
            self.assertNotIn("oauth2", url)  # kein eigener Token-Abruf
            gesehen["auth"] = kw["headers"]["Authorization"]
            return Antwort(404)

        od = OneDriveSpeicher(None, None, None, "b!drive", session=Sitzung(fn=fn), token_quelle=lambda: "fremd")
        self.assertFalse(od.exists(KEY))
        self.assertEqual(gesehen["auth"], "Bearer fremd")
        with self.assertRaises(NichtKonfiguriert):
            OneDriveSpeicher(None, None, None, None, token_quelle=lambda: "x")

    def test_404(self):
        def fn(m, url, kw):
            return Antwort(200, js={"access_token": "t"}) if "oauth2" in url else Antwort(404)

        od = self._od(fn)
        self.assertFalse(od.exists(KEY))
        with self.assertRaises(NichtGefunden):
            od.get(KEY)


class TestRegistry(unittest.TestCase):
    def test_konfig_schluessel_und_status(self):
        self.assertIn("ph_ablage_s3_secret", speicher.konfig_schluessel("s3"))
        st = speicher.konfig_status("s3", {"ph_ablage_s3_endpoint": "https://x", "ph_ablage_s3_secret": ""})
        self.assertTrue(st["ph_ablage_s3_endpoint"])
        self.assertFalse(st["ph_ablage_s3_secret"])

    def test_nicht_konfiguriert_sauber(self):
        for name in ("s3", "google_drive", "onedrive"):
            with self.assertRaises(NichtKonfiguriert, msg=name) as e:
                speicher.erzeugen(name, {})
            self.assertTrue(e.exception.fehlend)
        with self.assertRaises(NichtKonfiguriert):
            speicher.erzeugen("dropbox", {})

    def test_lokal(self):
        tmp = tempfile.mkdtemp()
        try:
            self.assertIsInstance(speicher.erzeugen("lokal", {}, basis_pfad=tmp), LokalSpeicher)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_content_disposition(self):
        cd = content_disposition('Küche "A".pdf')
        self.assertTrue(cd.startswith('attachment; filename="K_che \'A\'.pdf"'))
        self.assertIn("filename*=UTF-8''K%C3%BCche%20%27A%27.pdf", cd)


if __name__ == "__main__":
    unittest.main()
