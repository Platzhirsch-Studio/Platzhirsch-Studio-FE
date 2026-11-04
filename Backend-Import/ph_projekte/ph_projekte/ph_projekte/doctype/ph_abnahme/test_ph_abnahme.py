"""bench --site <site> run-tests --app ph_projekte --doctype "PH Abnahme" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_projekte.ph_projekte.doctype.ph_projekt.test_ph_projekt import testprojekt

SIGNATUR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="


class TestPHAbnahme(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.p = testprojekt("Abnahme Test")

    def _abnahme(self, positionen=None):
        return frappe.get_doc(
            {
                "doctype": "PH Abnahme",
                "projekt": self.p.name,
                "datum": "2026-12-05",
                "anwesend_kunde": "Anna Projekttest",
                "positionen": positionen or [{"bezeichnung": "Sofa Connery", "zustand": "ok"}, {"bezeichnung": "Leuchte", "zustand": "Mangel", "beschreibung": "Kratzer am Sockel", "frist": "2026-12-20"}],
            }
        ).insert()

    def test_maengel_zaehlen_und_beschreibung_pflicht(self):
        a = self._abnahme()
        self.assertEqual(a.maengel_offen, 1)
        self.assertEqual(a.kontakt, self.p.kontakt)
        with self.assertRaises(frappe.ValidationError):
            self._abnahme([{"bezeichnung": "X", "zustand": "Nacharbeit"}])

    def test_unterzeichnen_braucht_unterschrift_abschluss_braucht_keine_maengel(self):
        a = self._abnahme()
        a.status = "Mit Maengeln"
        with self.assertRaises(frappe.ValidationError):
            a.save()
        a.reload()
        a.unterschrift_erfassen(unterschrift_kunde=SIGNATUR, name_kunde="Anna")
        a.reload()
        a.status = "Mit Maengeln"
        a.save()
        a.status = "Abgeschlossen"
        with self.assertRaises(frappe.ValidationError):
            a.save()
        a.reload()
        zeile = next(p for p in a.positionen if p.zustand == "Mangel")
        self.assertEqual(a.mangel_erledigt(zeile.name), 0)
        a.reload()
        a.status = "Abgeschlossen"
        a.save()
        self.assertTrue(a.abgeschlossen_am)

    def test_report_offene_maengel_listet_abnahme(self):
        from ph_projekte.ph_projekte.report.ph_offene_maengel.ph_offene_maengel import execute

        a = self._abnahme()
        _cols, data, _m, _c, summary = execute({"projekt": self.p.name})
        self.assertTrue(any(d["beleg"] == a.name for d in data))
        self.assertEqual(summary[0]["value"], len(data))
