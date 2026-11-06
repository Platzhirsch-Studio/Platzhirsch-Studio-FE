"""bench --site <site> run-tests --app ph_projekte --doctype "PH Nachtrag" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_projekte.ph_projekte.doctype.ph_projekt.test_ph_projekt import testprojekt

SIGNATUR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="


class TestPHNachtrag(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.p = testprojekt("Nachtrag Test")

    def _nachtrag(self):
        zeile = self.p.positionen[0].name
        return frappe.get_doc(
            {
                "doctype": "PH Nachtrag",
                "projekt": self.p.name,
                "bezeichnung": "Weinkühlschrank statt Mikrowelle",
                "positionen": [
                    {"art": "neu", "bezeichnung": "Weinkühlschrank", "menge": 1, "einzel_cent": 189000},
                    {"art": "aenderung", "bezeichnung": "Bezug Stoffgruppe 3", "menge": 1, "einzel_cent": 25000, "bezug_zeile": zeile, "ausfuehrung_text": "Stoff PG3"},
                ],
            }
        ).insert()

    def test_summen_nummer_titel(self):
        n = self._nachtrag()
        self.assertEqual(n.differenz_cent, 214000)
        self.assertEqual(n.status, "Entwurf")
        self.assertTrue(n.nummer_im_projekt >= 1)
        self.assertIn("Nachtrag", n.titel)

    def test_fremde_zeile_und_freigabe_ohne_unterschrift(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Nachtrag", "projekt": self.p.name, "bezeichnung": "X", "positionen": [{"art": "entfall", "bezeichnung": "Y", "einzel_cent": 1, "bezug_zeile": "gibtsnicht"}]}).insert()
        n = self._nachtrag()
        n.kunden_vorlegen()
        n.reload()
        n.status = "Freigegeben"
        with self.assertRaises(frappe.ValidationError):
            n.save()

    def test_freigabe_uebernimmt_ins_projekt(self):
        n = self._nachtrag()
        n.kunden_vorlegen()
        n.reload()
        self.assertEqual(n.freigabe_erfassen(SIGNATUR, "Anna"), "Freigegeben")
        n.reload()
        self.assertTrue(n.uebernommen)
        self.p.reload()
        self.assertTrue(any(z.nachtrag == n.name and z.bezeichnung == "Weinkühlschrank" for z in self.p.positionen))
        self.assertEqual(self.p.positionen[0].ausfuehrung_text, "Stoff PG3")
        self.assertGreaterEqual(self.p.nachtraege_cent, 214000)

    def test_portal_ablehnen(self):
        n = self._nachtrag()
        n.kunden_vorlegen()
        n.reload()
        self.assertEqual(n.kunde_entscheidet("ablehnen", "zu teuer"), "Abgelehnt")
        self.assertEqual(n.ablehnung_grund, "zu teuer")
