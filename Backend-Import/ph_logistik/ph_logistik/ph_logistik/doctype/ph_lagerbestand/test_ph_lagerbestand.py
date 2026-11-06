"""bench --site <site> run-tests --app ph_logistik --doctype "PH Lagerbestand" – Bestand und Bewegungen konsistent."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_logistik.ph_logistik.bestand import buche, storno
from ph_logistik.tests.helfer_test import lagerort, produkt


class TestPHLagerbestand(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.p = produkt("Testvase Bestand")
        self.lager = lagerort("Testlager")
        self.showroom = lagerort("Testshowroom", "Showroom")

    def _menge(self, ort):
        return frappe.db.get_value("PH Lagerbestand", {"produkt": self.p, "lagerort": ort, "ausstellungsstueck": 0}, ["menge", "reserviert", "verfuegbar", "status"], as_dict=True)

    def test_wareneingang_umlagerung_verkauf(self):
        b = buche("Wareneingang", self.p, 5, lagerort_nach=self.lager, idempotency_key="t-we-1")
        self.assertTrue(b.name.startswith("PH-LBW-"))
        self.assertEqual(self._menge(self.lager).menge, 5)
        self.assertEqual(buche("Wareneingang", self.p, 5, lagerort_nach=self.lager, idempotency_key="t-we-1").name, b.name)  # idempotent
        self.assertEqual(self._menge(self.lager).menge, 5)
        buche("Umlagerung", self.p, 2, lagerort_von=self.lager, lagerort_nach=self.showroom, platz_nach="EG")
        self.assertEqual((self._menge(self.lager).menge, self._menge(self.showroom).menge), (3, 2))
        buche("Verkauf", self.p, 3, lagerort_von=self.lager)
        z = self._menge(self.lager)
        self.assertEqual((z.menge, z.status), (0, "Verkauft"))
        with self.assertRaises(frappe.ValidationError):
            buche("Verkauf", self.p, 1, lagerort_von=self.lager)
        gesamt = sum(r.menge for r in frappe.get_all("PH Lagerbestand", {"produkt": self.p}, ["menge"]))
        self.assertEqual(gesamt, 2)

    def test_reservierung(self):
        buche("Wareneingang", self.p, 2, lagerort_nach=self.lager)
        bs = frappe.get_doc("PH Lagerbestand", frappe.db.get_value("PH Lagerbestand", {"produkt": self.p, "lagerort": self.lager, "ausstellungsstueck": 0}, "name"))
        bs.reservieren("PH Lagerort", self.lager, 2)
        z = self._menge(self.lager)
        self.assertEqual((z.reserviert, z.verfuegbar, z.status), (2, 0, "Reserviert"))
        bs.reload()
        bs.freigeben()
        self.assertEqual(self._menge(self.lager).status, "Verfuegbar")

    def test_storno_gegenbuchung(self):
        b = buche("Wareneingang", self.p, 4, lagerort_nach=self.lager)
        g = storno(b)
        self.assertEqual(g.art, "Ausbuchung")
        self.assertEqual(g.storno_von, b.name)
        self.assertEqual(frappe.db.get_value("PH Lagerbewegung", b.name, "status"), "Storniert")
        self.assertEqual(self._menge(self.lager).menge, 0)

    def test_ausstellungsstueck_braucht_seriennummer(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Lagerbestand", "produkt": self.p, "lagerort": self.showroom, "ausstellungsstueck": 1, "menge": 1}).insert()
        bs = frappe.get_doc({"doctype": "PH Lagerbestand", "produkt": self.p, "lagerort": self.showroom, "ausstellungsstueck": 1, "seriennummer": "SN-TEST-1", "menge": 1, "vk_cent_ausstellung": 99000}).insert()
        bs.reload()
        self.assertEqual(bs.menge, 1)  # Erstanlage wurde als Wareneingang gebucht
        self.assertEqual(bs.zustand, "Ausstellung")
        self.assertTrue(frappe.db.exists("PH Lagerbewegung", {"lagerbestand": bs.name, "art": "Wareneingang"}))
        r = bs.als_ausstellungsstueck_verkaufen()
        self.assertEqual(r["vk_cent"], 99000)
        bs.reload()
        self.assertEqual(bs.status, "Verkauft")

    def test_bewegung_loeschen_verboten(self):
        b = buche("Wareneingang", self.p, 1, lagerort_nach=self.lager)
        with self.assertRaises(frappe.ValidationError):
            frappe.delete_doc("PH Lagerbewegung", b.name)


class TestPHLagerbestandKommissionSperre(FrappeTestCase):
    """Kommission, Sperre, Reservierung mit Ablauf, Platz-Scan, Wareneingang mit Schaden (ereignisse)."""

    def setUp(self):
        frappe.set_user("Administrator")
        self.p = produkt("Testtisch Kommission")
        self.lager = lagerort("Testlager")
        lo = frappe.get_doc("PH Lagerort", self.lager)
        if not any(x.platz == "R1-01" for x in lo.plaetze):
            lo.append("plaetze", {"platz": "R1-01", "aktiv": 1})
            lo.save()

    def test_kommissionsware_getrennt_und_nicht_verfuegbar(self):
        frei = buche("Wareneingang", self.p, 2, lagerort_nach=self.lager)
        kom = buche("Wareneingang", self.p, 1, lagerort_nach=self.lager, kommission="PH-PRJ-TEST-1")
        self.assertNotEqual(frei.lagerbestand, kom.lagerbestand)
        z = frappe.db.get_value("PH Lagerbestand", kom.lagerbestand, ["status", "verfuegbar", "kommission"], as_dict=True)
        self.assertEqual((z.status, z.verfuegbar, z.kommission), ("Kommission", 0, "PH-PRJ-TEST-1"))
        from ph_logistik.ph_logistik.lager import kommissionsliste

        k = kommissionsliste("PH-PRJ-TEST-1")
        self.assertEqual(k["summen"]["im_lager"], 1)

    def test_lieferschein_aus_kommission_bucht_beim_packen(self):
        kom = buche("Wareneingang", self.p, 1, lagerort_nach=self.lager, kommission="PH-PRJ-TEST-2")
        from ph_logistik.ph_logistik.lager import lieferschein_aus_kommission

        ls = frappe.get_doc("PH Lieferschein", lieferschein_aus_kommission("PH-PRJ-TEST-2", lieferart="Abholung"))
        self.assertEqual((ls.kommission, ls.positionen[0].lagerbestand), ("PH-PRJ-TEST-2", kom.lagerbestand))
        with self.assertRaises(frappe.ValidationError):
            lieferschein_aus_kommission("PH-PRJ-TEST-2", lieferart="Abholung")  # schon auf offenem Lieferschein
        ls.positionen_setzen({ls.positionen[0].name: 1}, idempotency_key="t-kom-2")
        ls.reload()
        ls.als_gepackt()
        self.assertEqual(frappe.db.get_value("PH Lagerbestand", kom.lagerbestand, "menge"), 0)
        ls.reload()
        ls.stornieren("Test Rückbuchung")
        self.assertEqual(frappe.db.get_value("PH Lagerbestand", kom.lagerbestand, "menge"), 1)

    def test_sperren_reservieren_platzscan(self):
        b = buche("Wareneingang", self.p, 3, lagerort_nach=self.lager)
        doc = frappe.get_doc("PH Lagerbestand", b.lagerbestand)
        doc.reservieren("PH Lagerbestand", doc.name, 1, bis="2020-01-01")
        doc.reload()
        self.assertEqual(str(doc.reserviert_bis), "2020-01-01")
        from ph_logistik.ph_logistik.lager import platz_aufloesen, reservierungen_freigeben

        reservierungen_freigeben()
        doc.reload()
        self.assertEqual((doc.reserviert, doc.reserviert_bis), (0, None))
        self.assertEqual(platz_aufloesen(f"{self.lager}/R1-01"), (self.lager, "R1-01"))
        with self.assertRaises(frappe.ValidationError):
            platz_aufloesen(f"{self.lager}/GIBTSNICHT")
        doc.umlagern(platz_code=f"{self.lager}/R1-01", menge=1)
        self.assertTrue(frappe.db.exists("PH Lagerbestand", {"produkt": self.p, "lagerort": self.lager, "platz": "R1-01"}))
        doc.reload()
        doc.sperren("Kratzer")
        doc.reload()
        self.assertEqual((doc.status, doc.verfuegbar), ("Gesperrt", 0))
        with self.assertRaises(frappe.ValidationError):
            doc.reservieren("PH Lagerbestand", doc.name, 1)
        doc.entsperren()
        doc.reload()
        self.assertEqual(doc.status, "Verfuegbar")

    def test_wareneingang_schaden_gesperrt_nur_differenz(self):
        from ph_logistik.ph_logistik.ereignisse import wareneingang_aktualisiert

        we = frappe._dict(name="WE-TEST-1", status="Teilweise", kommission=None, positionen=[frappe._dict(name="wep1", produkt=self.p, menge_erhalten=1, zustand="Transportschaden"), frappe._dict(name="wep2", produkt=self.p, menge_erhalten=2, zustand="ok")])
        wareneingang_aktualisiert(we)
        wareneingang_aktualisiert(we)  # wiederholt: keine Doppelbuchung
        self.assertEqual(frappe.db.count("PH Lagerbewegung", {"bezug": "WE-TEST-1"}), 2)
        g = frappe.db.get_value("PH Lagerbestand", {"produkt": self.p, "gesperrt": 1, "lagerort": ("is", "set")}, ["zustand", "status"], as_dict=True)
        self.assertEqual((g.zustand, g.status), ("B-Ware", "Gesperrt"))
        we.positionen[1].menge_erhalten = 3  # Nachlieferung erfasst
        wareneingang_aktualisiert(we)
        self.assertEqual(frappe.db.count("PH Lagerbewegung", {"bezug": "WE-TEST-1"}), 3)
