"""bench --site <site> run-tests --app ph_sortiment --doctype "PH Produkt" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_months, nowdate

from ph_sortiment.api import get_produkt_by_path_field_api, get_produkte_by_kategorie, get_produkte_paths, marken_data


def marke(name="Testmarke Sortiment", **kw):
    if frappe.db.exists("PH Marke", name):
        return frappe.get_doc("PH Marke", name)
    return frappe.get_doc({"doctype": "PH Marke", "marke": name, "status": "Aktiv", "welt": "Accessoires", "haendlerstatus": "Keiner", **kw}).insert()


def kategorie(key="test-glas"):
    if frappe.db.exists("PH Kategorie", key):
        return frappe.get_doc("PH Kategorie", key)
    return frappe.get_doc({"doctype": "PH Kategorie", "key": key, "label_de": "Testglas", "welt": "Accessoires"}).insert()


def produkt(name="Testglas Eins", bild_freigabe="erteilt", **kw):
    marke()
    kategorie()
    doc = frappe.get_doc({
        "doctype": "PH Produkt",
        "name_herstellerbezeichnung": name,
        "marke": "Testmarke Sortiment",
        "kategorie": "test-glas",
        "kurz_de": "Mundgeblasenes Glas.",
        "bilder": [{"bild": "/files/test-glas.webp", "typ": "freisteller", "quelle_url": "https://example.com/glas", "abgerufen": nowdate(), "freigabe": bild_freigabe}],
        **kw,
    })
    doc.insert()
    return doc


class TestPHProdukt(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        for n in frappe.get_all("PH Produkt", filters={"marke": "Testmarke Sortiment"}, pluck="name"):
            frappe.delete_doc("PH Produkt", n, force=True)

    def test_slug_titel_status(self):
        p = produkt()
        self.assertEqual(p.name, "testmarke-sortiment-testglas-eins")
        self.assertEqual(p.titel, "Testmarke Sortiment Testglas Eins")
        self.assertEqual(p.status, "Entwurf")
        self.assertEqual(p.bild_freigegeben, 1)
        self.assertEqual(p.bild_hauptbild, "/files/test-glas.webp")

    def test_aktiv_ohne_bildfreigabe_verboten(self):
        p = produkt("Ohne Freigabe", bild_freigabe="offen")
        p.status = "Aktiv"
        with self.assertRaises(frappe.ValidationError):
            p.save()

    def test_claim_guard_in_texten(self):
        with self.assertRaises(frappe.ValidationError):
            produkt("Claim", kurz_de="Wir sind offizieller Händler dieser Marke.")

    def test_preis_mit_stand(self):
        p = produkt("Mit Preis")
        p.preis_hinzufuegen(brutto_cent=7900, stand=nowdate(), preisart="Verkaufspreis", quelle="Herstellershop", quelle_url="https://example.com/shop")
        p.reload()
        self.assertEqual(p.aktueller_preis_cent, 7900)
        self.assertEqual(p.preisstand_alt, 0)
        self.assertEqual(p.preisart, "Verkaufspreis")
        # Älterer Stand wird nicht gewählt; Stand > 3 Monate → veraltet
        p.append("preise", {"ab": add_months(nowdate(), -5), "stand": add_months(nowdate(), -5), "brutto_cent": 5000, "preisart": "Verkaufspreis", "quelle": "Eigen", "freigegeben": 1})
        p.save()
        self.assertEqual(p.aktueller_preis_cent, 7900)
        p.set("preise", [z for z in p.preise if z.brutto_cent == 5000])
        p.save()
        self.assertIsNone(p.aktueller_preis_cent)
        self.assertEqual(p.preisstand_alt, 1)

    def test_preis_freigabe_braucht_quelle(self):
        p = produkt("Preis ohne Quelle")
        p.append("preise", {"ab": nowdate(), "stand": nowdate(), "brutto_cent": 100, "preisart": "Verkaufspreis", "quelle": "Herstellershop", "freigegeben": 1})
        with self.assertRaises(frappe.ValidationError):
            p.save()

    def test_website_api_antwortform(self):
        p = produkt("API Glas")
        p.db_set("status", "Aktiv")
        p.preis_hinzufuegen(brutto_cent=4900, stand=nowdate(), quelle="Eigen")
        frappe.cache().delete_keys("ph_sortiment:api:")
        karten = get_produkte_by_kategorie("test-glas")
        self.assertTrue(karten)
        k = next(x for x in karten if x["path_field"] == p.name)
        for feld in ("name", "produkt_name", "path_field", "url_slug", "marken", "kategories", "status", "modified", "bild_anhangen"):
            self.assertIn(feld, k)
        self.assertEqual(k["marken"], "Testmarke Sortiment")
        self.assertEqual(k["bild_anhangen"][0]["bild_anhangen"], "/files/test-glas.webp")
        d = get_produkt_by_path_field_api(p.name, "en")
        for feld in ("beschreibung", "beschreibung_en", "mehr_beschreibung", "metadata_title_de", "additional_information", "pdf_produkte", "preise", "ausfuehrungen", "lieferzeit"):
            self.assertIn(feld, d)
        self.assertEqual(d["preise"]["ab_cent"], 4900)
        self.assertIsNone(d["lieferzeit"])  # nicht freigegeben → „auf Anfrage“
        self.assertIn(p.name, [x["path_field"] for x in get_produkte_paths()])
        m = next(x for x in marken_data() if x["name1"] == "Testmarke Sortiment")
        for feld in ("name1", "logo", "status", "produkte", "bild_anhagen", "es_gibt_produkte", "grundungsjahr", "herkunftsland", "website"):
            self.assertIn(feld, m)
        self.assertEqual(frappe.local.response.get("headers", {}).get("X-PH-Katalog-Version") is not None, True)

    def test_api_zeigt_nur_aktive(self):
        p = produkt("Entwurf Glas")
        frappe.cache().delete_keys("ph_sortiment:api:")
        self.assertEqual(get_produkt_by_path_field_api(p.name), {})
