"""bench --site <site> run-tests --app ph_microsoft --doctype "PH Graph Verknuepfung" """

import frappe
from frappe.tests.utils import FrappeTestCase


class TestPHGraphVerknuepfung(FrappeTestCase):
    def tearDown(self):
        frappe.db.rollback()

    def test_titel_und_suche_per_graph_id(self):
        gid = "AAMkAD" + "x" * 140  # Graph-IDs sind länger als 140 Zeichen
        v = frappe.get_doc({"doctype": "PH Graph Verknuepfung", "art": "Kalender", "referenz_doctype": "User", "referenz_name": "Administrator", "graph_id": gid}).insert()
        self.assertTrue(v.titel.startswith("Kalender: User"))
        self.assertEqual(frappe.db.get_value("PH Graph Verknuepfung", {"graph_id": gid}), v.name)
