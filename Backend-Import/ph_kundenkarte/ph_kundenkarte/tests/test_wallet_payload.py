import json
import unittest

from ph_kundenkarte.utils import wallet_payload as wp

ARGS = dict(kartennummer="KK-7K3QX9", name="Anna Muster", stufe="Platzhirsch Plus", seit="2026-03-01")


class TestWalletPayload(unittest.TestCase):
    def test_apple_pass_json(self):
        p = wp.apple_pass_json(pass_type_id="pass.studio.platzhirsch.kundenkarte", team_id="TEAMID1234", organisation="Platzhirsch", farbe="#8a7a66", **ARGS)
        self.assertEqual(p["formatVersion"], 1)
        self.assertEqual(p["passTypeIdentifier"], "pass.studio.platzhirsch.kundenkarte")
        self.assertEqual(p["teamIdentifier"], "TEAMID1234")
        self.assertEqual(p["barcodes"][0]["format"], "PKBarcodeFormatQR")
        self.assertEqual(p["barcodes"][0]["message"], "KK-7K3QX9")
        self.assertEqual(p["backgroundColor"], "rgb(138, 122, 102)")
        felder = {f["key"]: f["value"] for f in p["storeCard"]["headerFields"] + p["storeCard"]["primaryFields"] + p["storeCard"]["secondaryFields"]}
        self.assertEqual(felder["stufe"], "Platzhirsch Plus")
        self.assertEqual(felder["name"], "Anna Muster")
        self.assertEqual(felder["seit"], "2026-03-01")
        self.assertEqual(felder["nummer"], "KK-7K3QX9")
        self.assertNotIn("webServiceURL", p)
        # Kein Geldwert im Pass
        self.assertNotIn("balance", json.dumps(p).lower())
        self.assertNotIn("punkte", json.dumps(p).lower())
        json.dumps(p)  # serialisierbar

    def test_apple_pass_mit_webservice(self):
        p = wp.apple_pass_json(pass_type_id="p", team_id="t", organisation="o", web_service_url="https://api.example.com/wallet", auth_token="abc", **ARGS)
        self.assertEqual(p["webServiceURL"], "https://api.example.com/wallet")
        self.assertEqual(p["authenticationToken"], "abc")

    def test_seriennummer_stabil_und_ohne_personendaten(self):
        a = wp.seriennummer("KK-7K3QX9")
        self.assertEqual(a, wp.seriennummer("KK-7K3QX9"))
        self.assertNotEqual(a, wp.seriennummer("KK-7K3QX8"))
        self.assertEqual(len(a), 24)
        self.assertNotIn("7K3QX9", a)

    def test_google_objekt(self):
        o = wp.google_loyalty_object(issuer_id="3388000000012345678", class_suffix="platzhirsch_kundenkarte", **ARGS)
        self.assertEqual(o["classId"], "3388000000012345678.platzhirsch_kundenkarte")
        self.assertTrue(o["id"].startswith("3388000000012345678."))
        self.assertEqual(o["barcode"], {"type": "QR_CODE", "value": "KK-7K3QX9", "alternateText": "KK-7K3QX9"})
        self.assertNotIn("loyaltyPoints", o)
        c = wp.google_loyalty_class(issuer_id="1", class_suffix="k", organisation="Platzhirsch")
        self.assertEqual(c["id"], "1.k")
        claims = wp.google_save_jwt_claims(service_account_email="sa@example.iam.gserviceaccount.com", origins=["https://platzhirsch.studio"], loyalty_objects=[o], loyalty_classes=[c])
        self.assertEqual(claims["typ"], "savetowallet")
        self.assertEqual(claims["payload"]["loyaltyObjects"][0]["id"], o["id"])

    def test_manifest(self):
        m = wp.manifest({"pass.json": b"{}", "icon.png": b"\x89PNG"})
        self.assertEqual(set(m), {"pass.json", "icon.png"})
        self.assertEqual(len(m["pass.json"]), 40)


if __name__ == "__main__":
    unittest.main()
