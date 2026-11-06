"""Kalkulation v2 (Projektnachkalkulation) – reine Logik ohne Frappe.
cd Backend-Import/ph_projekte && PYTHONPATH=. python -m unittest ph_projekte.tests.test_kalkulation_v2"""

import unittest

from ph_projekte.utils import kalkulation as k

KOSTENARTEN = [
    {"name": "Ware", "db_stufe": "DB1", "reihenfolge": 1},
    {"name": "Fracht", "db_stufe": "DB1", "reihenfolge": 2},
    {"name": "Montage eigen", "db_stufe": "DB2", "reihenfolge": 3},
    {"name": "Fremdgewerk", "db_stufe": "DB2", "reihenfolge": 5},
    {"name": "Planung intern", "db_stufe": "DB3", "reihenfolge": 8},
    {"name": "Nachlauf", "db_stufe": "DB3", "reihenfolge": 10},
]


class TestGueltigkeit(unittest.TestCase):
    SAETZE = [
        {"taetigkeit": "Montage", "satz_cent": 4500, "gueltig_ab": "2026-01-01"},
        {"taetigkeit": "Montage", "satz_cent": 5000, "gueltig_ab": "2026-07-01"},
        {"taetigkeit": "Montage", "rolle": "PH Montage", "satz_cent": 4800, "gueltig_ab": "2026-01-01"},
        {"taetigkeit": "Montage", "mitarbeiter": "meister@x", "satz_cent": 6000, "gueltig_ab": "2026-03-01"},
        {"taetigkeit": "Projektleitung", "satz_cent": 7000, "gueltig_ab": "2026-01-01"},
        {"taetigkeit": "Alle", "satz_cent": 3000, "gueltig_ab": "2026-01-01"},
    ]

    def test_satz_zum_datum(self):
        self.assertEqual(k.kostensatz(self.SAETZE, "Montage", "2026-05-01")[0], 4500)
        self.assertEqual(k.kostensatz(self.SAETZE, "Montage", "2026-07-01")[0], 5000)
        self.assertEqual(k.kostensatz(self.SAETZE, "Montage", "2025-12-31")[0], 0)

    def test_spezifisch_vor_allgemein(self):
        self.assertEqual(k.kostensatz(self.SAETZE, "Montage", "2026-08-01", "x@y", ["PH Montage"])[0], 4800)  # Rolle vor neuerem allgemeinem Satz
        self.assertEqual(k.kostensatz(self.SAETZE, "Montage", "2026-08-01", "meister@x", ["PH Montage"])[0], 6000)  # Mitarbeiter vor Rolle
        self.assertEqual(k.kostensatz(self.SAETZE, "Montage", "2026-02-01", "meister@x", [])[0], 4500)  # Mitarbeitersatz erst ab März

    def test_alias_und_rueckfall(self):
        self.assertEqual(k.kostensatz(self.SAETZE, "Koordination", "2026-05-01")[0], 7000)
        self.assertEqual(k.kostensatz(self.SAETZE, "Beratung", "2026-05-01")[0], 3000)
        self.assertEqual(k.kostensatz([], "Montage", "2026-05-01"), (0, None))

    def test_zeiten_bewerten_historisch(self):
        z = k.zeiten_bewerten([{"name": "Z1", "taetigkeit": "Montage", "datum": "2026-05-01", "dauer_min": 120, "user": "a"},
                               {"name": "Z2", "taetigkeit": "Montage", "datum": "2026-08-01", "dauer_min": 60, "user": "a"},
                               {"name": "Z3", "taetigkeit": "Service", "datum": "2026-09-10", "dauer_min": 60, "user": "a"}],
                              self.SAETZE, uebergabe_am="2026-09-01")
        self.assertEqual([x["betrag_cent"] for x in z], [9000, 5000, 3000])
        self.assertEqual([x["kostenart"] for x in z], ["Montage eigen", "Montage eigen", "Nachlauf"])

    def test_ziel_db_projektart_vor_alle(self):
        einst = {"ziel_db": [{"projektart": "Alle", "ziel_db1": 30, "gueltig_ab": "2026-01-01"}, {"projektart": "Kueche", "ziel_db1": 38, "ziel_db2": 30, "budget_rot": 105, "gueltig_ab": "2026-01-01"}]}
        p = k.parameter(einst, "Kueche", "2026-06-01")
        self.assertEqual((p["ziel"]["ziel_db1"], p["ziel"]["ziel_db2"], p["budget_rot"], p["budget_gelb"]), (38, 30, 105, 90))
        self.assertEqual(k.parameter(einst, "Bad", "2026-06-01")["ziel"]["ziel_db1"], 30)
        self.assertIsNone(k.parameter({}, "Bad")["ziel"]["ziel_db1"])  # leer = keine Ampel
        a = k.parameter(einst, "Kueche", "2026-06-01", {"aktiv": 1, "ziel_db1": 25, "gemeinkosten_art": "Prozent auf Erloes", "gemeinkosten_prozent": 8})
        self.assertEqual((a["ziel"]["ziel_db1"], a["gemeinkosten"]["art"], a["abweichung"]), (25, "Prozent auf Erloes", True))

    def test_zuschlagsarten(self):
        self.assertIsNone(k.gemeinkosten({"art": "Aus", "prozent": 10}, 1000, 2000, 3000, 5))
        self.assertEqual(k.gemeinkosten({"art": "Prozent auf Wareneinsatz", "prozent": 10}, 100000, 200000, 300000), 10000)
        self.assertEqual(k.gemeinkosten({"art": "Prozent auf Gesamtkosten", "prozent": 5}, 100000, 200000, 300000), 10000)
        self.assertEqual(k.gemeinkosten({"art": "Prozent auf Erloes", "prozent": 7.5}, 0, 0, 300000), 22500)
        self.assertEqual(k.gemeinkosten({"art": "Betrag je Projektstunde", "betrag_je_stunde_cent": 1500}, stunden=10.5), 15750)

    def test_einstellungen_pruefen(self):
        self.assertEqual(k.einstellungen_pruefen(self.SAETZE, [{"projektart": "Kueche", "ziel_db1": 35, "gueltig_ab": "2026-01-01"}], [{"art": "Aus"}], ["Kueche"]), [])
        f = k.einstellungen_pruefen(
            [{"taetigkeit": "Montage", "satz_cent": 1, "gueltig_ab": "2026-01-01"}, {"taetigkeit": "Montage", "satz_cent": 2, "gueltig_ab": "2026-01-01"}, {"taetigkeit": "", "satz_cent": -1}],
            [{"projektart": "Kueche", "ziel_db1": 120, "ampel_gelb_unter": 6, "ampel_rot_unter": 3}, {"projektart": "Raumschiff"}],
            [{"art": "Prozent auf Erloes", "prozent": -1}, {"art": "Pauschal"}], ["Kueche"])
        text = " | ".join(f)
        for teil in ("doppelt", "Tätigkeit fehlt", "Satz negativ", "nicht zwischen 0 und 100", "Gelb-Schwelle", "unbekannte Projektart", "unbekannte Art"):
            self.assertIn(teil, text)


class TestStufenObligoPrognose(unittest.TestCase):
    STUFE = {x["name"]: x["db_stufe"] for x in KOSTENARTEN}

    def test_db_stufen(self):
        s = k.stufen(1000000, {"Ware": 500000, "Fracht": 20000, "Montage eigen": 80000, "Fremdgewerk": 50000, "Planung intern": 30000, "Nachlauf": 10000}, self.STUFE)
        self.assertEqual((s["db1_cent"], s["db2_cent"], s["db3_cent"]), (480000, 350000, 310000))
        self.assertEqual((s["db1_prozent"], s["db2_prozent"], s["db3_prozent"]), (48.0, 35.0, 31.0))
        self.assertNotIn("db4_cent", s)
        s4 = k.stufen(1000000, {"Ware": 500000}, self.STUFE, gemeinkosten_cent=50000)
        self.assertEqual((s4["db4_cent"], s4["db4_prozent"]), (450000, 45.0))
        self.assertIsNone(k.stufen(0, {"Ware": 1}, self.STUFE)["db1_prozent"])
        self.assertEqual(k.stufen(100, {"Unbekannt": 10}, self.STUFE)["kosten_je_stufe"]["DB2"], 10)

    def test_obligo_ohne_doppelzaehlung(self):
        best = [
            {"bezug_doctype": "PH Herstellerbestellung", "bezug_name": "HB-1", "kostenart": "Ware", "wert_cent": 500000, "status": "AB geprueft"},
            {"bezug_doctype": "PH Herstellerbestellung", "bezug_name": "HB-2", "kostenart": "Ware", "wert_cent": 100000, "status": "Storniert"},
            {"bezug_doctype": "PH Herstellerbestellung", "bezug_name": "HB-3", "kostenart": "Ware", "wert_cent": 200000, "status": "Geliefert", "vollstaendig_berechnet": 1},
            {"bezug_doctype": "PH Speditionsauftrag", "bezug_name": "SPA-1", "kostenart": "Fracht", "wert_cent": 30000, "status": "Bestaetigt"},
        ]
        o = k.obligo(best, {("PH Herstellerbestellung", "HB-1"): 300000, ("PH Speditionsauftrag", "SPA-1"): 35000})
        self.assertEqual([x["betrag_cent"] for x in o], [200000, 0, 0, 0])  # teilberechnet, Storno, vollständig, überberechnet
        # Ist (ER 300.000) + Obligo (200.000) = Bestellwert 500.000 → nichts doppelt
        self.assertEqual(o[0]["verrechnet_cent"] + o[0]["betrag_cent"], 500000)

    def test_prognose(self):
        p = k.prognose_zeile(100000, 40000, 30000)
        self.assertEqual((p["rest_cent"], p["prognose_cent"], p["abweichung_cent"]), (30000, 100000, 0))
        p = k.prognose_zeile(100000, 90000, 30000)
        self.assertEqual((p["rest_cent"], p["prognose_cent"], p["abweichung_cent"]), (0, 120000, 20000))
        p = k.prognose_zeile(100000, 40000, 0, manuell_cent=80000)
        self.assertEqual((p["rest_cent"], p["prognose_cent"], p["rest_manuell"]), (80000, 120000, True))
        self.assertEqual(k.prognose_zeile(100000, 40000, 0, manuell_cent=0)["prognose_cent"], 40000)

    def test_ampel(self):
        self.assertEqual(k.ampel_budget(100000, 50000, 0, 100000), "gruen")
        self.assertEqual(k.ampel_budget(100000, 60000, 30000, 100000), "gelb")
        self.assertEqual(k.ampel_budget(100000, 100000, 0, 100000), "gelb")  # genau ausgeschöpft
        self.assertEqual(k.ampel_budget(100000, 90000, 20000, 110000), "rot")
        self.assertEqual(k.ampel_budget(100000, 10000, 0, 120000), "rot")  # manuelle Prognose drüber
        self.assertEqual(k.ampel_budget(0, 5000, 0), "gelb")
        self.assertEqual(k.ampel_budget(0, 0, 0), "")
        self.assertEqual(k.ampel_budget(100000, 80000, 0, gelb=75), "gelb")
        self.assertEqual(k.ampel_db(30.0, None), "")
        self.assertEqual(k.ampel_db(36.0, 35.0), "gruen")
        self.assertEqual(k.ampel_db(33.0, 35.0, 0, 5), "gelb")
        self.assertEqual(k.ampel_db(29.0, 35.0, 0, 5), "rot")
        self.assertEqual(k.ampel_db(34.0, 35.0, 2, 5), "gruen")  # Toleranz 2 Punkte
        self.assertEqual(k.ampel_gesamt(["gruen", "", "gelb"]), "gelb")
        self.assertEqual(k.ampel_gesamt([]), "")

    def test_fertigstellungsgrad(self):
        pos = [{"menge": 2, "menge_geliefert": 2}, {"menge": 2, "menge_geliefert": 0}, {"menge": 5, "lieferstatus": "storniert"}]
        f = k.fertigstellungsgrad("Lieferung", pos, 0, 0)
        self.assertEqual(f["grad"], 47)  # (40×20 + 50×40) / 60 = 46,7
        f = k.fertigstellungsgrad("Montage", pos, 6, 12)
        self.assertEqual(f["grad"], 60)  # (60×20+50×40+50×40)/100 = 52 → nie unter Phase 60
        f = k.fertigstellungsgrad("Montage", [{"menge": 1, "menge_geliefert": 1}], 12, 12)
        self.assertEqual(f["grad"], 92)
        self.assertEqual(k.fertigstellungsgrad("Uebergabe", pos, 0, 10)["grad"], 95)
        self.assertEqual(k.fertigstellungsgrad("Abgeschlossen")["grad"], 100)
        self.assertEqual(k.fertigstellungsgrad("Auftrag")["grad"], 10)

    def test_erloes_ohne_anzahlung_doppelt(self):
        e = k.erloes(1000000, 50000)
        self.assertEqual((e["erloes_cent"], e["basis"]), (1050000, "auftrag"))
        r = [{"art": "Anzahlungsrechnung", "netto_cent": 400000, "status": "Bezahlt"},
             {"art": "Schlussrechnung", "netto_cent": 1050000, "status": "Gestellt"},
             {"art": "Rechnung", "netto_cent": 9999, "status": "Entwurf"}]
        e = k.erloes(1000000, 50000, r, gutschriften_netto_cent=20000, skonto_gewaehrt_cent=5000)
        self.assertEqual((e["erloes_cent"], e["basis"], e["gestellt_cent"]), (1025000, "gestellt", 1025000))


class TestGesamt(unittest.TestCase):
    def daten(self, **kw):
        e = {
            "erloes": {"auftrag_netto_cent": 2000000},
            "kostenarten": KOSTENARTEN,
            "ist": [{"kostenart": "Ware", "betrag_cent": 600000, "datum": "2026-10-05", "quelle_doctype": "PH Eingangsrechnung", "quelle_name": "ER-1"},
                    {"kostenart": "Montage eigen", "betrag_cent": 90000, "datum": "2026-10-20", "quelle_doctype": "PH Projektzeit", "quelle_name": "Z1"}],
            "obligo": [{"kostenart": "Ware", "betrag_cent": 400000, "datum": "2026-09-28", "bezug_doctype": "PH Herstellerbestellung", "bezug_name": "HB-1"}],
            "budget": [{"kostenart": "Ware", "budget_auftrag_cent": 1000000, "budget_aktuell_cent": 1000000},
                       {"kostenart": "Montage eigen", "budget_auftrag_cent": 100000, "budget_aktuell_cent": 100000}],
            "fortschritt": {"phase": "Montage", "positionen": [{"menge": 1, "menge_geliefert": 1}], "montage_h_ist": 20, "montage_h_plan": 20},
            "parameter": k.parameter({"ziel_db1": None, "ziel_db": [{"projektart": "Kueche", "ziel_db1": 45, "ziel_db3": 40}]}, "Kueche"),
            "stunden_ist": 20,
        }
        e.update(kw)
        return e

    def test_kalkulation_v2(self):
        r = k.kalkulation_v2(self.daten())
        kopf = r["kopf"]
        self.assertEqual(kopf["kosten_ist_cent"], 690000)
        self.assertEqual(kopf["obligo_cent"], 400000)
        self.assertEqual(kopf["prognose_kosten_cent"], 1100000)  # Ware 1.000.000 (voll), Montage 90.000 + Rest 10.000
        self.assertEqual(r["stufen_prognose"]["db1_cent"], 1000000)
        self.assertEqual(kopf["db_prognose_prozent"], 45.0)
        self.assertEqual(kopf["fertigstellungsgrad"], 92)  # Phase Montage (60), alles geliefert und montiert
        self.assertEqual(kopf["erloes_anteilig_cent"], 1840000)
        self.assertEqual(kopf["db_laufend_cent"], 1840000 - 690000)
        self.assertEqual(kopf["ampel"], "gelb")  # Ware zu 100 % gebunden, DB-Ziele erreicht
        self.assertFalse(kopf["ueber_budget"])
        self.assertEqual([z["woche"] for z in r["zeitreihe"]], ["2026-W40", "2026-W41", "2026-W43"])
        self.assertEqual(r["zeitreihe"][-1]["ist_kumuliert_cent"], 690000)
        self.assertEqual(len(r["quellen"]), 3)

    def test_ueber_budget_rot_und_db4(self):
        d = self.daten(obligo=[{"kostenart": "Ware", "betrag_cent": 600000, "datum": "2026-09-28"}])
        d["parameter"]["gemeinkosten"] = {"art": "Prozent auf Erloes", "prozent": 5}
        r = k.kalkulation_v2(d)
        self.assertTrue(r["kopf"]["ueber_budget"])
        self.assertEqual(r["kopf"]["ampel_kosten"], "rot")
        self.assertEqual(r["kopf"]["db_prognose_stufe"], "DB4")
        self.assertEqual(r["stufen_prognose"]["gemeinkosten_cent"], 100000)
        self.assertEqual(r["stufen_prognose"]["db4_cent"], 2000000 - 1200000 - 100000 - 100000)

    def test_kostenart_ohne_budget_erscheint(self):
        d = self.daten()
        d["ist"].append({"kostenart": "Nachlauf", "betrag_cent": 15000, "datum": "2026-11-02"})
        r = k.kalkulation_v2(d)
        z = next(x for x in r["kostenarten"] if x["kostenart"] == "Nachlauf")
        self.assertEqual((z["ampel"], z["db_stufe"]), ("gelb", "DB3"))


class TestAbschluss(unittest.TestCase):
    def test_abweichungen_kommentarpflicht(self):
        a = k.abweichungen([{"kostenart": "Ware", "budget_auftrag_cent": 100000, "budget_cent": 100000, "ist_cent": 108000},
                            {"kostenart": "Fracht", "budget_auftrag_cent": 10000, "budget_cent": 10000, "ist_cent": 12000},
                            {"kostenart": "Nachlauf", "budget_auftrag_cent": 0, "ist_cent": 500}])
        self.assertEqual([x["kommentar_pflicht"] for x in a], [0, 1, 1])
        self.assertEqual(a[1]["abweichung_prozent"], 20.0)

    def test_lernwerte(self):
        pos = [{"kategorie": "Unterschrank", "menge": 4}, {"kategorie": "Hochschrank", "menge": 2}, {"kategorie": "Sofa", "menge": 1, "montage_art": "ohne"}]
        l = k.lernwerte(pos, {"Unterschrank": 30, "Hochschrank": 60}, montage_min_ist=300)
        self.assertEqual({x["kategorie"]: x["ist_min"] for x in l}, {"Hochschrank": 150, "Unterschrank": 150})
        self.assertEqual({x["kategorie"]: x["min_je_stueck"] for x in l}, {"Hochschrank": 75, "Unterschrank": 38})
        self.assertEqual(sum(x["ist_min"] for x in k.lernwerte([{"kategorie": "A", "menge": 1}, {"kategorie": "B", "menge": 2}], {}, 100)), 100)
        self.assertEqual(k.lernwerte([], {}, 100), [])


if __name__ == "__main__":
    unittest.main()
