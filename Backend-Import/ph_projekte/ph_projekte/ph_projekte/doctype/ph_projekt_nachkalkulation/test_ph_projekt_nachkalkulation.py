"""bench --site <site> run-tests --app ph_projekte --doctype "PH Projekt Nachkalkulation" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import nowdate

from ph_projekte.ph_projekte import nachkalkulation as nk


class TestPHProjektNachkalkulation(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        nk.kostenarten_anlegen()
        e = frappe.get_single("PH Projekte Einstellungen")
        e.set("kostensaetze", [{"taetigkeit": "Montage", "satz_cent": 5000, "gueltig_ab": "2026-01-01"}, {"taetigkeit": "Montage", "satz_cent": 6000, "gueltig_ab": "2026-10-01"}])
        e.set("ziel_db", [{"projektart": "Kueche", "ziel_db1": 40, "ziel_db3": 30, "gueltig_ab": "2026-01-01"}])
        e.set("gemeinkosten_regeln", [])
        e.budget_bei_auftrag_vorbelegen = 1
        e.save()
        self.p = frappe.get_doc({"doctype": "PH Projekt", "titel": "Test Nachkalkulation", "projektart": "Kueche", "status": "Planung",
                                 "positionen": [{"bezeichnung": "Unterschrank", "kategorie": "Unterschrank", "menge": 4, "preis_cent": 250000, "ek_cent": 120000, "menge_geliefert": 4}]})
        self.p.flags.ignore_links = True
        self.p.insert()

    def test_budget_einfrieren_bei_auftrag_und_protokoll(self):
        self.p.status = "Auftrag"
        self.p.save()
        self.p.reload()
        self.assertTrue(self.p.kalk_budget_eingefroren_am)
        ware = next(b for b in self.p.kalk_budget if b.kostenart == "Ware")
        self.assertEqual((ware.budget_auftrag_cent, ware.budget_aktuell_cent), (480000, 480000))
        ware.budget_auftrag_cent = 1
        with self.assertRaises(frappe.ValidationError):
            self.p.save()
        self.p.reload()
        ware = next(b for b in self.p.kalk_budget if b.kostenart == "Ware")
        ware.anpassung_cent = 20000
        self.p.save()
        self.assertEqual(next(b for b in self.p.kalk_budget if b.kostenart == "Ware").budget_aktuell_cent, 500000)
        self.assertTrue(frappe.db.exists("PH Kalkulation Protokoll", {"projekt": self.p.name, "feld": "kalk_budget"}))

    def test_abweichung_braucht_begruendung(self):
        self.p.kalk_abweichung_aktiv = 1
        self.p.kalk_ziel_db1 = 25
        with self.assertRaises(frappe.ValidationError):
            self.p.save()
        self.p.kalk_abweichung_begruendung = "Referenzprojekt, bewusst günstiger"
        self.p.save()
        self.assertTrue(frappe.db.exists("PH Kalkulation Protokoll", {"projekt": self.p.name, "feld": "kalk_ziel_db1"}))
        self.assertEqual(self.p.kalkulation_v2()["parameter"]["ziel"]["ziel_db1"], 25)

    def test_kalkulation_v2_und_zeitsatz_historisch(self):
        for datum in ("2026-09-15", "2026-10-15"):
            frappe.get_doc({"doctype": "PH Projektzeit", "projekt": self.p.name, "taetigkeit": "Montage", "datum": datum, "dauer_min": 60, "user": "Administrator"}).insert(ignore_permissions=True)
        r = self.p.kalkulation_v2()
        self.assertEqual(r["kopf"]["erloes_cent"], 1000000)
        montage = next(z for z in r["kostenarten"] if z["kostenart"] == "Montage eigen")
        self.assertEqual(montage["ist_cent"], 11000)  # 50 € (September) + 60 € (Oktober)
        self.assertTrue(r["zeitreihe"])
        self.assertTrue(all(q.get("link") for q in r["quellen"]))
        self.assertEqual(frappe.db.get_value("PH Projekt", self.p.name, "kalk_ist_cent"), 11000)

    def test_abschluss_snapshot_kommentarpflicht(self):
        self.p.status = "Auftrag"
        self.p.save()
        self.p.reload()
        self.p.status = "Abgeschlossen"
        self.p.save()
        name = frappe.db.get_value("PH Projekt", self.p.name, "nachkalkulation")
        self.assertTrue(name)
        nkd = frappe.get_doc("PH Projekt Nachkalkulation", name)
        self.assertEqual((nkd.status, nkd.erloes_cent), ("Entwurf", 1000000))
        pflicht = [z for z in nkd.kostenarten if z.kommentar_pflicht]
        self.assertTrue(pflicht)  # Ware: Budget 4.800 €, Ist 0 → −100 %
        with self.assertRaises(frappe.ValidationError):
            nkd.abschliessen()
        for z in pflicht:
            z.kommentar = "Rechnung kommt noch"
        nkd.save()
        nkd.abschliessen()
        nkd.reload()
        self.assertEqual(nkd.status, "Abgeschlossen")
        nkd.db1_cent = 1
        with self.assertRaises(frappe.ValidationError):
            nkd.save()

    def test_einstellungen_api_validierung(self):
        from ph_projekte.api.kalkulation import kalkulation_einstellungen, kalkulation_einstellungen_speichern

        with self.assertRaises(frappe.ValidationError):
            kalkulation_einstellungen_speichern(ziel_db=[{"projektart": "Kueche", "ziel_db1": 140, "gueltig_ab": nowdate()}])
        with self.assertRaises(frappe.ValidationError):
            kalkulation_einstellungen_speichern(kostensaetze=[{"taetigkeit": "Montage", "satz_cent": 1, "gueltig_ab": "2026-01-01"}, {"taetigkeit": "Montage", "satz_cent": 2, "gueltig_ab": "2026-01-01"}])
        r = kalkulation_einstellungen_speichern(gemeinkosten=[{"projektart": "Alle", "art": "Prozent auf Erloes", "prozent": 8, "gueltig_ab": "2026-01-01"}])
        self.assertEqual(r["gemeinkosten"][0]["art"], "Prozent auf Erloes")
        self.assertTrue(kalkulation_einstellungen()["eingerichtet"])
        self.assertTrue(frappe.db.exists("PH Kalkulation Protokoll", {"bereich": "Einstellungen", "feld": "gemeinkosten_regeln"}))
        self.assertEqual(self.p.kalkulation_v2()["kopf"]["db_prognose_stufe"], "DB4")
