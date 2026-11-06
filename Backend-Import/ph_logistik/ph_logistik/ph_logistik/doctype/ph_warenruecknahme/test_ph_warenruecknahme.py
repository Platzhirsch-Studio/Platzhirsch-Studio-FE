"""bench --site <site> run-tests --app ph_logistik --doctype "PH Warenruecknahme" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_logistik.tests.helfer_test import lagerort, produkt


class TestPHWarenruecknahme(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.p = produkt("Testsessel Ruecknahme")
        self.lager = lagerort("Testlager")

    def _wr(self, positionen):
        d = frappe.get_doc({"doctype": "PH Warenruecknahme", "anlass": "Projekt-Ruecknahme", "kunde_name": "Hotel Seeblick", "projekt": "PH-PRJ-2026-0001", "lagerort": self.lager, "positionen": positionen})
        d.insert()
        return d

    def test_regel_wiedereinlagern_nur_neuwertig(self):
        with self.assertRaises(frappe.ValidationError):
            self._wr([{"produkt": self.p, "beschreibung": "Sessel", "menge": 1, "zustand": "Defekt", "entscheidung": "Wiedereinlagern"}])

    def test_ablauf_und_buchungen(self):
        d = self._wr([
            {"produkt": self.p, "beschreibung": "Sessel neu", "menge": 1, "zustand": "Neuwertig", "entscheidung": "Wiedereinlagern"},
            {"produkt": self.p, "beschreibung": "Sessel Kratzer", "menge": 1, "zustand": "B-Ware", "entscheidung": "B-Ware"},
            {"produkt": self.p, "beschreibung": "Sessel defekt", "menge": 1, "zustand": "Defekt", "entscheidung": "An Lieferant"},
        ])
        self.assertTrue(d.name.startswith("PH-WR-"))
        self.assertEqual(d.status, "Angemeldet")
        with self.assertRaises(frappe.ValidationError):
            d.pruefung_buchen()  # erst annehmen
        d.annehmen(unterschrift="data:image/png;base64,iVBORw0KGgo=", unterschrift_name="Rezeption")
        d.reload()
        r = d.pruefung_buchen()
        self.assertEqual((r["status"], r["gebucht"]), ("Geprueft", 3))
        d.reload()
        self.assertTrue(d.alle_gebucht)
        neu = frappe.db.get_value("PH Lagerbestand", {"produkt": self.p, "lagerort": self.lager, "zustand": ("!=", "B-Ware"), "gesperrt": 0}, "menge")
        bware = frappe.db.get_value("PH Lagerbestand", {"produkt": self.p, "lagerort": self.lager, "zustand": "B-Ware", "gesperrt": 0}, "menge")
        gesperrt = frappe.db.get_value("PH Lagerbestand", {"produkt": self.p, "lagerort": self.lager, "gesperrt": 1}, ["menge", "status", "verfuegbar"], as_dict=True)
        self.assertGreaterEqual(neu, 1)
        self.assertGreaterEqual(bware, 1)
        self.assertEqual((gesperrt.status, gesperrt.verfuegbar), ("Gesperrt", 0))
        # erneutes Buchen bucht nichts doppelt (Schlüssel wr:<name>:<pos>)
        vorher = frappe.db.count("PH Lagerbewegung", {"bezug": d.name})
        d.pruefung_buchen()
        self.assertEqual(frappe.db.count("PH Lagerbewegung", {"bezug": d.name}), vorher)
        d.reload()
        d.abschliessen()
        self.assertEqual(frappe.db.get_value(d.doctype, d.name, "status"), "Abgeschlossen")

    def test_ausbuchen_defekt_bestand_null(self):
        d = self._wr([{"produkt": self.p, "beschreibung": "Lampe kaputt", "menge": 1, "zustand": "Defekt", "entscheidung": "Ausbuchen"}])
        d.annehmen()
        d.reload()
        d.pruefung_buchen()
        arten = sorted(frappe.get_all("PH Lagerbewegung", {"bezug": d.name}, pluck="art"))
        self.assertEqual(arten, ["Ausbuchung", "Retoure"])
