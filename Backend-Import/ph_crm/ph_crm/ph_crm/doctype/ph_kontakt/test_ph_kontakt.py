"""bench --site <site> run-tests --app ph_crm --doctype "PH Kontakt" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_crm.ph_crm.doctype.ph_kontakt.ph_kontakt import plz_ort_teilen, token_hash


class TestPHKontakt(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete("PH Kontakt", {"email": ("like", "%@kontakt-test.example")})

    def test_titel_status_und_serie(self):
        doc = frappe.get_doc({"doctype": "PH Kontakt", "vorname": "Anna", "nachname": "Muster", "email": "anna@kontakt-test.example"}).insert()
        self.assertEqual(doc.status, "Interessent")
        self.assertEqual(doc.titel, "Anna Muster")
        self.assertTrue(doc.name.startswith("PH-KON-"))

    def test_firmentitel(self):
        doc = frappe.get_doc({"doctype": "PH Kontakt", "kontaktart": "Architekt", "nachname": "Plan", "firma": "Büro Plan ZT", "email": "plan@kontakt-test.example"}).insert()
        self.assertEqual(doc.titel, "Büro Plan ZT – Plan")

    def test_email_eindeutig(self):
        frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Eins", "email": "doppelt@kontakt-test.example"}).insert()
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Zwei", "email": "Doppelt@kontakt-test.example"}).insert()

    def test_geburtstag_nur_mit_einwilligung(self):
        doc = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Geb", "email": "geb@kontakt-test.example", "geburtstag": "1980-01-01"}).insert()
        self.assertIsNone(doc.geburtstag)

    def test_portal_zugang(self):
        doc = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Portal", "email": "portal@kontakt-test.example"}).insert()
        r = doc.portal_zugang_erzeugen()
        doc.reload()
        self.assertEqual(doc.portal_aktiv, 1)
        self.assertEqual(doc.portal_token_hash, token_hash(r["token"]))
        doc.portal_sperren()
        doc.reload()
        self.assertEqual(doc.portal_aktiv, 0)
        self.assertFalse(doc.portal_token_hash)

    def test_kunde_markieren_und_datenauskunft(self):
        doc = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Kunde", "email": "kunde@kontakt-test.example"}).insert()
        doc.als_kunde_markieren("Test-AB")
        doc.reload()
        self.assertEqual(doc.status, "Kunde")
        self.assertTrue(doc.kunde_seit)
        frappe.get_doc({"doctype": "PH Anfrage", "art": "Kontakt", "nachname": "Kunde", "email": "kunde@kontakt-test.example", "anliegen": "x", "kontakt": doc.name}).insert()
        auskunft = doc.datenauskunft()
        self.assertIn("E-Mail", auskunft["stamm"])
        self.assertTrue(any(v["doctype"] == "PH Anfrage" and v["anzahl"] >= 1 for v in auskunft["vorgaenge"]))

    def test_plz_ort_teilen(self):
        self.assertEqual(plz_ort_teilen("6911 Lochau"), ("6911", "Lochau"))
        self.assertEqual(plz_ort_teilen("A-6900 Bregenz"), ("6900", "Bregenz"))
        self.assertEqual(plz_ort_teilen("Lindau"), ("", "Lindau"))


class TestPHKontaktDublettenUndAkte(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete("PH Kontakt", {"email": ("like", "%@dublette-test.example")})
        frappe.db.delete("PH Kontakt", {"nachname": ("in", ["Huberdub", "Firmendub"])})

    def _k(self, **kw):
        return frappe.get_doc({"doctype": "PH Kontakt", **kw}).insert()

    def test_telefon_norm_und_aehnliche(self):
        a = self._k(vorname="Anna", nachname="Huberdub", email="anna@dublette-test.example", telefon="0664 1112223", plz="6911")
        self.assertEqual(a.telefon_norm, "+436641112223")
        b = self._k(vorname="Anna", nachname="Huberdub", mobil="+43 664 1112223", plz="6911")
        kandidaten = b.aehnliche_kontakte()
        self.assertEqual(kandidaten[0]["name"], a.name)
        self.assertEqual(kandidaten[0]["einstufung"], "wahrscheinlich")
        b.keine_dublette(a.name)
        b.reload()
        self.assertEqual(b.aehnliche_kontakte(), [])

    def test_zusammenfuehren_biegt_vorgaenge_um(self):
        ziel = self._k(vorname="Anna", nachname="Huberdub", email="ziel@dublette-test.example", plz="6911")
        quelle = self._k(vorname="Anna", nachname="Huberdub", telefon="0664 9998887", plz="6911", status="Interessent")
        anfrage = frappe.get_doc({"doctype": "PH Anfrage", "art": "Kontakt", "nachname": "Huberdub", "telefon": "0664 9998887", "anliegen": "x", "kontakt": quelle.name}).insert()
        ziel.zusammenfuehren(quelle.name)
        self.assertFalse(frappe.db.exists("PH Kontakt", quelle.name))
        self.assertEqual(frappe.db.get_value("PH Anfrage", anfrage.name, "kontakt"), ziel.name)
        ziel.reload()
        self.assertEqual(ziel.telefon, "0664 9998887")

    def test_firma_und_personen(self):
        firma = self._k(kontaktart="Geschaeft", nachname="Firmendub", firma="Hotel Seeblick Test GmbH")
        person = self._k(vorname="Max", nachname="Huberdub", firma_kontakt=firma.name, funktion="Hotelier", rollen=[{"rolle": "Hotelier"}], email="max@dublette-test.example")
        self.assertEqual(person.firma, "Hotel Seeblick Test GmbH")
        from ph_crm.api import get_kundenakte

        akte = get_kundenakte(firma.name)
        self.assertEqual(akte["kopf"]["personen"][0]["name"], person.name)

    def test_zeitleiste_und_wiedervorlage(self):
        k = self._k(nachname="Huberdub", email="zl@dublette-test.example")
        frappe.get_doc({"doctype": "PH Anfrage", "art": "Kontakt", "nachname": "Huberdub", "email": "zl@dublette-test.example", "anliegen": "x", "kontakt": k.name}).insert()
        k.add_comment("Comment", "Rückruf vereinbart")
        r = k.zeitleiste(limit=10)
        arten = {e["art"] for e in r["eintraege"]}
        self.assertIn("Anfrage", arten)
        self.assertIn("Notiz", arten)
        k.wiedervorlage_setzen("2030-01-01", "Küche nachfassen")
        self.assertEqual(str(frappe.db.get_value("PH Kontakt", k.name, "wiedervorlage")), "2030-01-01")

    def test_create_kontakt_erkennt_dublette(self):
        from ph_crm.api import create_kontakt

        a = create_kontakt(nachname="Huberdub", vorname="Eva", email="eva@dublette-test.example", plz="6900")
        self.assertFalse(a["bestehend"])
        b = create_kontakt(nachname="Huberdub", vorname="Eva", email="EVA@dublette-test.example")
        self.assertTrue(b["bestehend"])
        self.assertEqual(b["kontakt"], a["kontakt"])

    def test_kundenakte_kanaele(self):
        from ph_crm.api import get_kundenakte

        k = self._k(nachname="Huberdub", email="kanal@dublette-test.example")
        akte = get_kundenakte(k.name)
        self.assertEqual(set(akte["kanaele"]), {"Showroom", "Shop", "Objekt"})
        self.assertIn("reklamationen", akte["kanaele"]["Shop"])
