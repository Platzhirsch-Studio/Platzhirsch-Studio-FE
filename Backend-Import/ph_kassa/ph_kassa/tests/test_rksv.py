"""RKSV-Kern ohne Site: cd Backend-Import/ph_kassa && PYTHONPATH=. python -m unittest discover -s ph_kassa/tests -t .

Deckt ab: Zähler-Verschlüsselung/Entschlüsselung, IV, TRA/STO, Codeformat (Regex der Spezifikation),
Startbeleg, Verkettung über 3 Belege + Manipulation, Storno, Training, SEE-Ausfall + Sammelbeleg,
DEP7-Struktur, Jahresbeleg, QR == Code+Signatur, OCR, A-Trust-Client mit Mock-Transport, FinanzOnline-Daten.
"""

import base64
import json
import unittest
from datetime import datetime

from ph_kassa.rksv import AUSFALL_TEXT, atrust, beleg, counter, dep, finanzonline, pruefung, qr
from ph_kassa.rksv.signer import KaputterSigner, SignaturFehler, SoftwareSigner, verifiziere

KASSE = "PH-SHOWROOM-1"
KEY = counter.schluessel_aus_b64(base64.b64encode(bytes(range(32))).decode())
T0 = datetime(2026, 11, 4, 9, 30, 0)


def daten(nr, betraege=None, art="Standard", vorbeleg="", signer=None, datum=T0):
    s = signer
    return beleg.Belegdaten(
        kassen_id=KASSE,
        belegnummer=str(nr),
        datum=datum,
        betraege_cent=betraege or {},
        belegart=art,
        zda_id=s.zda_id,
        zertifikat_seriennummer=s.zertifikat_seriennummer,
        vorbeleg_jws=vorbeleg,
    )


class Kette:
    """Hilfsklasse: baut eine Belegkette wie buchung.py, nur im Speicher."""

    def __init__(self, signer):
        self.signer = signer
        self.zaehler = 0
        self.nr = 0
        self.belege = []

    def buche(self, betraege=None, art="Standard", ausfall=False, datum=T0):
        self.nr += 1
        vor = self.belege[-1]["jws"] if self.belege else ""
        d = daten(self.nr, betraege, art, vor, self.signer, datum)
        erg = beleg.erzeuge(d, self.zaehler, KEY, None if ausfall else self.signer)
        self.zaehler = erg["zaehler_neu"]
        erg["daten"] = d
        self.belege.append(erg)
        return erg

    def jws(self):
        return [b["jws"] for b in self.belege]


class TestZaehler(unittest.TestCase):
    def test_rundlauf(self):
        for wert in (0, 1, 1250, 10**12, -500):
            enc = counter.verschluessele(wert, KEY, KASSE, "7")
            self.assertEqual(len(base64.b64decode(enc)), 8)
            self.assertEqual(counter.entschluessele(enc, KEY, KASSE, "7"), wert)

    def test_iv_aus_kasse_und_belegnummer(self):
        import hashlib

        self.assertEqual(counter.iv(KASSE, 12), hashlib.sha256(f"{KASSE}12".encode()).digest()[:16])
        self.assertNotEqual(counter.verschluessele(100, KEY, KASSE, "1"), counter.verschluessele(100, KEY, KASSE, "2"))

    def test_falscher_schluessel_entschluesselt_falsch(self):
        enc = counter.verschluessele(999, KEY, KASSE, "3")
        anderer = counter.schluessel_aus_b64(counter.neuer_schluessel_b64())
        self.assertNotEqual(counter.entschluessele(enc, anderer, KASSE, "3"), 999)

    def test_schluessel_laenge(self):
        with self.assertRaises(counter.ZaehlerFehler):
            counter.schluessel_aus_b64(base64.b64encode(b"kurz").decode())
        self.assertEqual(len(counter.schluessel_aus_b64(counter.neuer_schluessel_b64())), 32)

    def test_kennworte(self):
        self.assertEqual(counter.kennwort_b64("TRA"), base64.b64encode(b"TRA").decode())
        self.assertEqual(counter.kennwort_b64("STO"), "U1RP")
        self.assertTrue(counter.ist_kennwort("VFJB"))
        with self.assertRaises(counter.ZaehlerFehler):
            counter.entschluessele("U1RP", KEY, KASSE, "1")

    def test_pruefwert(self):
        pw = counter.pruefwert_schluessel(KEY)
        self.assertEqual(len(base64.b64decode(pw)), 3)


class TestBelegCode(unittest.TestCase):
    def setUp(self):
        self.signer = SoftwareSigner()
        self.kette = Kette(self.signer)

    def test_betragformat(self):
        self.assertEqual(beleg.betrag_text(0), "0,00")
        self.assertEqual(beleg.betrag_text(1250), "12,50")
        self.assertEqual(beleg.betrag_text(-5), "-0,05")
        self.assertEqual(beleg.betrag_cent("1234,56"), 123456)

    def test_startbeleg(self):
        s = self.kette.buche(art="Startbeleg")
        felder = beleg.zerlege_code(s["code"])
        self.assertEqual(felder["belegnummer"], "1")
        self.assertEqual(sum(felder["betraege_cent"].values()), 0)
        self.assertEqual(counter.entschluessele(felder["zaehler_feld"], KEY, KASSE, "1"), 0)
        self.assertEqual(felder["sig_vorbeleg"], beleg.hash_startbeleg(KASSE))
        self.assertEqual(len(base64.b64decode(felder["sig_vorbeleg"])), 8)
        self.assertTrue(s["code"].startswith(f"_R1-{self.signer.zda_id}_{KASSE}_1_2026-11-04T09:30:00_0,00_0,00_0,00_0,00_0,00_"))
        self.assertTrue(verifiziere(s["jws"], self.signer.zertifikat))

    def test_code_regex_und_jws_header(self):
        self.kette.buche(art="Startbeleg")
        b = self.kette.buche({"normal": 11990, "ermaessigt1": 350})
        self.assertRegex(b["code"], beleg.CODE_RE)
        self.assertRegex(b["qr"], beleg.CODE_RE)
        self.assertEqual(b["jws"].split(".")[0], "eyJhbGciOiJFUzI1NiJ9")
        self.assertEqual(json.loads(base64.b64decode("eyJhbGciOiJFUzI1NiJ9")), {"alg": "ES256"})
        self.assertIn("_119,90_3,50_0,00_0,00_0,00_", b["code"])

    def test_verkettung_ueber_drei_belege(self):
        self.kette.buche(art="Startbeleg")
        b2 = self.kette.buche({"normal": 10000})
        b3 = self.kette.buche({"normal": 2500, "null": 5000})
        self.assertEqual(b2["sig_vorbeleg"], beleg.hash_vorbeleg(self.kette.belege[0]["jws"]))
        self.assertEqual(b3["sig_vorbeleg"], beleg.hash_vorbeleg(b2["jws"]))
        self.assertEqual(self.kette.zaehler, 17500)
        erg = pruefung.pruefe_kette(self.kette.jws(), self.signer.zertifikat, KEY, KASSE)
        self.assertTrue(erg["ok"], erg["fehler"])
        self.assertEqual([b["zaehler_cent"] for b in erg["belege"]], [0, 10000, 17500])

    def test_manipulation_bricht_kette(self):
        self.kette.buche(art="Startbeleg")
        self.kette.buche({"normal": 10000})
        self.kette.buche({"normal": 2500})
        jws = self.kette.jws()
        # Beleg 2 nachträglich auf 1,00 € ändern (Payload neu, Signatur alt)
        code = beleg.b64url_decode(jws[1].split(".")[1]).decode().replace("_100,00_", "_1,00_")
        jws[1] = f"{beleg.JWS_HEADER_B64URL}.{beleg.b64url(code.encode())}.{jws[1].split('.')[2]}"
        erg = pruefung.pruefe_kette(jws, self.signer.zertifikat, KEY, KASSE)
        self.assertFalse(erg["ok"])
        texte = " | ".join(t for _, t in erg["fehler"])
        self.assertIn("Signatur ungültig", texte)
        self.assertIn("Verkettung gebrochen", texte)

    def test_stornobeleg(self):
        self.kette.buche(art="Startbeleg")
        self.kette.buche({"normal": 10000})
        st = self.kette.buche({"normal": -10000}, art="Stornobeleg")
        self.assertIn("_-100,00_0,00_0,00_0,00_0,00_U1RP_", st["code"])
        self.assertEqual(self.kette.zaehler, 10000, "Storno verändert den Umsatzzähler nicht")
        erg = pruefung.pruefe_kette(self.kette.jws(), self.signer.zertifikat, KEY, KASSE)
        self.assertTrue(erg["ok"], erg["fehler"])

    def test_trainingsbeleg(self):
        self.kette.buche(art="Startbeleg")
        tr = self.kette.buche({"normal": 4990}, art="Trainingsbeleg")
        self.assertIn("_49,90_0,00_0,00_0,00_0,00_VFJB_", tr["code"])
        self.assertEqual(self.kette.zaehler, 0)
        folge = self.kette.buche({"normal": 100})
        self.assertEqual(folge["sig_vorbeleg"], beleg.hash_vorbeleg(tr["jws"]), "auch Trainingsbelege sind verkettet")
        self.assertTrue(pruefung.pruefe_kette(self.kette.jws(), self.signer.zertifikat, KEY, KASSE)["ok"])

    def test_nullbeleg_traegt_zaehler(self):
        self.kette.buche(art="Startbeleg")
        self.kette.buche({"ermaessigt2": 1300})
        n = self.kette.buche(art="Nullbeleg")
        f = beleg.zerlege_code(n["code"])
        self.assertEqual(sum(f["betraege_cent"].values()), 0)
        self.assertEqual(counter.entschluessele(f["zaehler_feld"], KEY, KASSE, "3"), 1300)
        with self.assertRaises(beleg.BelegFehler):
            daten(9, {"normal": 1}, "Nullbeleg", n["jws"], self.signer)

    def test_jahresbeleg_dezember(self):
        self.kette.buche(art="Startbeleg")
        self.kette.buche({"normal": 25000})
        j = self.kette.buche(art="Jahresbeleg", datum=datetime(2026, 12, 31, 23, 55, 0))
        self.assertIn("_2026-12-31T23:55:00_0,00_0,00_0,00_0,00_0,00_", j["code"])
        self.assertEqual(counter.entschluessele(j["zaehler_feld"], KEY, KASSE, "3"), 25000)
        self.assertEqual(j["daten"].datum.month, 12)
        self.assertIn("15. Februar", finanzonline.belegcheck_hinweis("Jahresbeleg"))

    def test_ausfall_und_sammelbeleg(self):
        self.kette.buche(art="Startbeleg")
        a1 = self.kette.buche({"normal": 5000}, ausfall=True)
        a2 = self.kette.buche({"normal": 7000}, ausfall=True)
        self.assertTrue(a1["ausfall"])
        self.assertTrue(a1["qr"].endswith("_" + base64.b64encode(AUSFALL_TEXT.encode()).decode()))
        self.assertTrue(beleg.ist_ausfall_jws(a2["jws"]))
        self.assertEqual(self.kette.zaehler, 12000, "Zähler läuft im Ausfall weiter")
        sammel = self.kette.buche(art="Sammelbeleg")
        self.assertFalse(sammel["ausfall"])
        self.assertEqual(sammel["sig_vorbeleg"], beleg.hash_vorbeleg(a2["jws"]), "Verkettung über Ausfallbelege")
        self.assertEqual(counter.entschluessele(sammel["zaehler_feld"], KEY, KASSE, "4"), 12000)
        erg = pruefung.pruefe_kette(self.kette.jws(), self.signer.zertifikat, KEY, KASSE)
        self.assertTrue(erg["ok"], erg["fehler"])
        self.assertEqual([b["signatur_ok"] for b in erg["belege"]], [True, None, None, True])

    def test_kaputter_signer_wirft(self):
        d = daten(1, art="Startbeleg", signer=KaputterSigner())
        with self.assertRaises(SignaturFehler):
            beleg.erzeuge(d, 0, KEY, KaputterSigner())

    def test_qr_und_ocr(self):
        self.kette.buche(art="Startbeleg")
        b = self.kette.buche({"normal": 999})
        self.assertEqual(qr.inhalt(b["jws"]), b["qr"])
        self.assertEqual(b["qr"], b["code"] + "_" + beleg.b64url_zu_b64(b["jws"].split(".")[2]))
        o = qr.ocr(b["jws"])
        teile = o.split("_")
        self.assertEqual(len(teile), 14)
        self.assertEqual(teile[:10], b["qr"].split("_")[:10])
        for i in (10, 12, 13):
            self.assertEqual(base64.b32decode(teile[i]), base64.b64decode(b["qr"].split("_")[i]))

    def test_kassen_id_ohne_unterstrich(self):
        with self.assertRaises(beleg.BelegFehler):
            beleg.Belegdaten("KASSE_1", "1", T0, {}, "Startbeleg", "AT1", "ab")


class TestDep(unittest.TestCase):
    def test_struktur(self):
        signer = SoftwareSigner()
        k = Kette(signer)
        k.buche(art="Startbeleg")
        k.buche({"normal": 100})
        d = dep.baue(k.jws(), signer.zertifikat_der_b64(), signer.zertifikatskette_der_b64())
        self.assertEqual(list(d.keys()), ["Belege-Gruppe"])
        g = d["Belege-Gruppe"][0]
        self.assertEqual(set(g.keys()), {"Signaturzertifikat", "Zertifizierungsstellen", "Belege-kompakt"})
        self.assertEqual(g["Belege-kompakt"], k.jws())
        self.assertEqual(dep.pruefe_struktur(d), [])
        self.assertEqual(dep.anzahl_belege(d), 2)
        text = dep.als_json(d)
        self.assertEqual(json.loads(text), d)
        self.assertEqual(len(dep.pruefsumme(text)), 64)
        self.assertEqual(dep.dateiname(KASSE, "2026-11-01", "2026-11-30"), f"DEP7_{KASSE}_2026-11-01_2026-11-30.json")

    def test_struktur_fehler(self):
        self.assertTrue(dep.pruefe_struktur({"Belege-Gruppe": []}))
        self.assertTrue(dep.pruefe_struktur({"Belege-Gruppe": [{"Signaturzertifikat": "", "Zertifizierungsstellen": [], "Belege-kompakt": ["kein.jws"]}]}))
        with self.assertRaises(dep.DepFehler):
            dep.baue(["abc"], "")


class TestATrustClient(unittest.TestCase):
    """REST-Client nur gegen Mock-Transport – nie echte Aufrufe."""

    def setUp(self):
        self.soft = SoftwareSigner()
        self.aufrufe = []

        def transport(methode, url, body, timeout):
            self.aufrufe.append((methode, url, body))
            if url.endswith("/Certificate"):
                return 200, {"Signaturzertifikat": self.soft.zertifikat_der_b64(), "Zertifizierungsstellen": [], "ZDA": "AT1", "Zertifikatsseriennummer": self.soft.zertifikat_seriennummer}
            if url.endswith("/Sign/JWS"):
                payload = body["jws_payload"]
                sig = self.soft.sign(f"{beleg.JWS_HEADER_B64URL}.{payload}".encode())
                return 200, {"result": f"{beleg.JWS_HEADER_B64URL}.{payload}.{beleg.b64url(sig)}"}
            return 404, {}

        self.client = atrust.ATrustSigner("u123456789", "geheim-test", env="test", transport=transport)

    def test_zertifikat_und_signatur(self):
        z = self.client.zertifikat_abrufen()
        self.assertEqual(z["ZDA"], "AT1")
        self.assertEqual(self.client.zertifikat_seriennummer, self.soft.zertifikat_seriennummer)
        self.assertTrue(self.aufrufe[0][1].startswith("https://hs-abnahme.a-trust.at/"))
        d = daten(1, art="Startbeleg", signer=self.client)
        erg = beleg.erzeuge(d, 0, KEY, self.client)
        self.assertTrue(verifiziere(erg["jws"], self.soft.zertifikat))
        self.assertEqual(self.aufrufe[-1][0], "POST")
        self.assertNotIn("geheim-test", self.aufrufe[-1][1])

    def test_fehler_wird_signaturfehler(self):
        client = atrust.ATrustSigner("u1", "pw", env="test", transport=lambda *a: (503, {}))
        with self.assertRaises(SignaturFehler):
            client.sign(beleg.signing_input("_R1-AT1_K_1_2026-01-01T00:00:00_0,00_0,00_0,00_0,00_0,00_AAAAAAAAAAA=_1_AAAAAAAAAAA="))
        with self.assertRaises(SignaturFehler):
            atrust.ATrustSigner("u1", "pw", env="falsch")
        with self.assertRaises(SignaturFehler):
            atrust.ATrustSigner("", "", env="test")


class TestFinanzOnline(unittest.TestCase):
    def test_registrierungsdaten(self):
        r = finanzonline.registrierungsdaten_kasse(KASSE, KEY, "Showroom Lochau")
        self.assertEqual(r["aes_schluessel_pruefwert"], counter.pruefwert_schluessel(KEY))
        self.assertNotIn(base64.b64encode(KEY).decode(), json.dumps(r), "Schlüssel darf nicht ausgegeben werden")
        s = finanzonline.registrierungsdaten_see("1f3a", "AT1")
        self.assertEqual(s["zertifikat_seriennummer_dezimal"], str(0x1F3A))
        self.assertTrue(finanzonline.ausfall_meldepflichtig(49))
        self.assertFalse(finanzonline.ausfall_meldepflichtig(48))


if __name__ == "__main__":
    unittest.main()
