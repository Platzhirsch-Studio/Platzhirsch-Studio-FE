"""bench --site <site> run-tests --app ph_sortiment --doctype "PH Preisliste Import" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import nowdate

from ph_sortiment.ph_sortiment.doctype.ph_produkt.test_ph_produkt import marke, produkt


def _datei(inhalt, name):
    return frappe.get_doc({"doctype": "File", "file_name": name, "content": inhalt, "is_private": 1}).insert(ignore_permissions=True).file_url


class TestPHPreislisteImport(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        marke()
        self.p = produkt("Preislistenglas")
        frappe.db.set_value("PH Produkt", self.p.name, "hersteller_artikelnr", "PL-1")

    def _import(self, inhalt, name, **kw):
        return frappe.get_doc({"doctype": "PH Preisliste Import", "marke": "Testmarke Sortiment", "stand": nowdate(), "preisart": kw.pop("preisart", "UVP"), "datei": _datei(inhalt, name), **kw}).insert()

    def test_csv_mit_mapping_und_vorschau(self):
        imp = self._import("Typ;Netto EUR;Text\nPL-1;1.234,50;Glas\nXX;5,00;fremd\n", "pl-test.csv", mapping_json='{"artikelnr": "Typ", "preis": "Netto EUR", "bezeichnung": "Text"}')
        v = imp.vorschau()
        self.assertEqual((v["zeilen"], v["zugeordnet"], v["ohne"]), (2, 1, 1))
        self.assertIn("<table", v["html"])
        imp.datei_einlesen()
        imp.reload()
        self.assertEqual(imp.zeilen[0].neu_cent, 123450)
        self.assertEqual(imp.zeilen[0].zuordnung, "artikelnr")
        self.assertEqual(imp.zeilen_ohne_produkt, 1)
        self.assertEqual(imp.status, "Geprueft")

    def test_datanorm_ek_mit_vk_vorschlag(self):
        frappe.db.set_value("PH Marke", "Testmarke Sortiment", {"kalkulationsfaktor_promille": 2000, "vk_rundung": "auf 10 Euro"})
        imp = self._import("V;011126;Test;;EUR\nA;N;PL-1;00;Glas;;2;0;Stk;10000;;;\n", "pl-test.dn4", preisart="Einkaufspreis", format="DataNorm", vk_vorschlag=1)
        imp.datei_einlesen()
        imp.reload()
        self.assertEqual(imp.zeilen[0].vk_vorschlag_cent, 20000)
        self.assertTrue(imp.hinweise)
        imp.uebernehmen()
        p = frappe.get_doc("PH Produkt", self.p.name)
        self.assertEqual(p.einkaufspreise[-1].netto_ek_cent, 10000)
        self.assertEqual(p.einkaufspreis_cent, 10000)
        self.assertTrue(any(z.brutto_cent == 20000 and not z.freigegeben for z in p.preise))

    def test_ungueltiges_mapping(self):
        with self.assertRaises(frappe.ValidationError):
            self._import("a;b\n", "pl-bad.csv", mapping_json="{kein json")
