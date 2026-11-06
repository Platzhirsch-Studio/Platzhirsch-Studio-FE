"""bench --site <site> run-tests --app ph_logistik --doctype "PH Meldebestand" (Meldebestand, Bestellvorschlag, Herstellerbestellung aus Vorschlägen)."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_logistik.ph_logistik.bestand import buche
from ph_logistik.ph_logistik.nachbestellung import bestellungen_aus_vorschlaegen, regel_pruefen, vorschlaege_erzeugen
from ph_logistik.tests.helfer_test import lagerort, produkt


def _lieferant(name="Test Lieferant Meldebestand"):
    vorhanden = frappe.db.get_value("PH Lieferant", {"firmenname": name}, "name")
    if vorhanden:
        return vorhanden
    d = frappe.get_doc({"doctype": "PH Lieferant", "firmenname": name, "status": "Aktiv", "lieferzeit_wochen_standard": 2})
    d.flags.ignore_mandatory = True
    d.insert(ignore_permissions=True)
    return d.name


class TestPHMeldebestand(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        kennung = frappe.generate_hash(length=6)  # je Test eigener Lagerort/Artikel (Bestände bleiben zwischen Tests bestehen)
        self.lo = lagerort(f"Testlager MB {kennung}")
        self.p = produkt(f"Testkerze MB {kennung}", typ="Accessoire")
        self.lief = _lieferant()
        buche("Wareneingang", self.p, 5, lagerort_nach=self.lo)

    def _regel(self, **kw):
        alt = frappe.db.get_value("PH Meldebestand", {"produkt": self.p, "lagerort": self.lo}, "name")
        if alt:
            frappe.delete_doc("PH Meldebestand", alt, force=True)
        return frappe.get_doc({"doctype": "PH Meldebestand", "produkt": self.p, "lagerort": self.lo, "lieferant": self.lief, "meldebestand": 5, "zielbestand": 20, **kw}).insert()

    def test_validierung(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Meldebestand", "produkt": self.p, "lagerort": self.lo, "meldebestand": 10, "zielbestand": 5}).insert()
        r = self._regel()
        self.assertIn(self.lo, r.titel)
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Meldebestand", "produkt": self.p, "lagerort": self.lo, "meldebestand": 1, "zielbestand": 5}).insert()

    def test_vorschlag_und_bestellung(self):
        r = self._regel(bestellmenge_min=6)
        v, neu = regel_pruefen(r.name)
        self.assertTrue(neu)
        vs = frappe.get_doc("PH Bestellvorschlag", v)
        self.assertEqual((vs.status, vs.verfuegbar, vs.vorschlag_menge, vs.lieferant), ("Offen", 5, 15, self.lief))
        self.assertEqual(vs.wiederbeschaffung_tage, 14)
        # Wiederholung am selben Tag: kein zweiter Vorschlag
        v2, neu2 = regel_pruefen(r.name)
        self.assertEqual((v2, neu2), (v, False))
        self.assertEqual(frappe.db.get_value("PH Meldebestand", r.name, "unter_meldebestand"), 1)
        erg = bestellungen_aus_vorschlaegen([v])
        self.assertTrue(erg["bestellungen"])
        vs.reload()
        self.assertEqual(vs.status, "Bestellt")
        self.assertTrue(frappe.db.exists("PH Herstellerbestellung Position", {"parent": vs.herstellerbestellung, "bezug_zeile": v, "menge": 15}))
        # Offene Bestellung zählt in den verfügbaren Bestand → kein neuer Vorschlag
        regel_pruefen(r.name)
        self.assertEqual(frappe.db.get_value("PH Meldebestand", r.name, "unter_meldebestand"), 0)

    def test_erledigt_wenn_wieder_ueber(self):
        r = self._regel()
        v, _neu = regel_pruefen(r.name)
        buche("Wareneingang", self.p, 10, lagerort_nach=self.lo)
        regel_pruefen(r.name)
        self.assertEqual(frappe.db.get_value("PH Bestellvorschlag", v, "status"), "Erledigt")

    def test_scheduler_und_reservierung(self):
        r = self._regel(meldebestand=3)
        self.assertEqual(frappe.db.get_value("PH Meldebestand", r.name, "unter_meldebestand"), 0)
        bs = frappe.db.get_value("PH Lagerbestand", {"produkt": self.p, "lagerort": self.lo}, "name")
        buche("Reservierung", self.p, 3, lagerort_von=self.lo, lagerbestand=bs)
        self.assertGreaterEqual(vorschlaege_erzeugen(), 1)
        self.assertEqual(frappe.db.get_value("PH Meldebestand", r.name, "verfuegbar"), 2)
