"""Tests für die Backend-Lücken Faktura (50-backend-luecken-kassa-faktura.md) – ohne Frappe."""

import unittest
import xml.dom.minidom
from datetime import date, datetime

from ph_faktura.rechenwerk import erechnung, export, mahnen, sepa, skonto, uva

RE = {
    "art": "Rechnung", "nummer": "RE-2026-00042", "datum": date(2026, 11, 4), "faellig": date(2026, 11, 18), "leistungsdatum": date(2026, 11, 2),
    "waehrung": "EUR", "ust_fall": "Steuerpflichtig AT", "ust_hinweistext": "", "bestellreferenz": "AB-2026-00012", "zahlungsreferenz": "RE-2026-00042",
    "verkaeufer": {"name": "MW Immobilienverwaltungs GmbH", "strasse": "Landstraße 11", "plz": "6911", "ort": "Lochau", "land": "AT", "uid": "ATU70035339", "iban": "AT61 1904 3002 3457 3201", "bic": "BKAUATWW"},
    "kaeufer": {"name": "Hotel Post & Co", "strasse": "Dorf 1", "plz": "6764", "ort": "Lech", "land": "AT", "uid": "ATU12345678"},
    "positionen": [{"pos": 1, "bezeichnung": "Sofa <Modell A>", "menge": 1, "einheit": "Stk", "einzel_netto_cent": 250000, "netto_cent": 250000, "ust_satz_promille": 2000},
                   {"pos": 2, "bezeichnung": "Montage", "menge": 2.5, "einheit": "Std", "einzel_netto_cent": 6000, "netto_cent": 15000, "ust_satz_promille": 2000}],
    "steuer": [{"ust_satz_promille": 2000, "netto_cent": 265000, "ust_cent": 53000}],
    "netto_cent": 265000, "ust_cent": 53000, "brutto_cent": 318000, "anzahlung_brutto_cent": 120000, "zahlbar_cent": 198000,
    "skonto_promille": 20, "skonto_bis": date(2026, 11, 11),
}


class TestUvaKassa(unittest.TestCase):
    BELEGE = [
        {"name": "K1-000001", "belegart": "Standard", "positionen": [{"art": "Artikel", "steuersatz": "Normal 20", "netto_cent": 10000, "ust_cent": 2000, "brutto_cent": 12000}]},
        {"name": "K1-000002", "belegart": "Standard", "rechnung": "RE-1", "positionen": [{"art": "Schlusszahlung", "steuersatz": "Normal 20", "netto_cent": 50000, "ust_cent": 10000, "brutto_cent": 60000}]},
        {"name": "K1-000003", "belegart": "Standard", "auftrag": "AB-1", "positionen": [{"art": "Anzahlung", "steuersatz": "Normal 20", "netto_cent": 100000, "ust_cent": 20000, "brutto_cent": 120000}]},
        {"name": "K1-000004", "belegart": "Standard", "auftrag": "AB-2", "positionen": [{"art": "Anzahlung", "steuersatz": "Ermaessigt-1 10", "netto_cent": 10000, "ust_cent": 1000, "brutto_cent": 11000}]},
        {"name": "K1-000005", "belegart": "Standard", "positionen": [{"art": "Gutschein Verkauf", "steuersatz": "Null 0", "netto_cent": 5000, "ust_cent": 0, "brutto_cent": 5000}]},
        {"name": "K1-000006", "belegart": "Stornobeleg", "storno_von": "K1-000003", "positionen": [{"art": "Storno", "ursprungsart": "Anzahlung", "steuersatz": "Normal 20", "netto_cent": -100000, "ust_cent": -20000, "brutto_cent": -120000}]},
        {"name": "K1-000007", "belegart": "Standard", "positionen": [{"art": "Retoure", "steuersatz": "Normal 20", "netto_cent": -5000, "ust_cent": -1000, "brutto_cent": -6000}]},
        {"name": "K1-000008", "belegart": "Trainingsbeleg", "trainings": 1, "positionen": [{"art": "Artikel", "steuersatz": "Normal 20", "netto_cent": 1, "ust_cent": 0, "brutto_cent": 1}]},
    ]

    def test_abgrenzung(self):
        r = uva.kassa_umsaetze(self.BELEGE, ar_belege={"K1-000003"})
        self.assertEqual(r["je_satz"][2000], {"netto_cent": 5000, "ust_cent": 1000, "brutto_cent": 6000, "anzahl": 2})
        self.assertEqual(r["je_satz"][1000]["ust_cent"], 1000)
        self.assertEqual(r["nicht_umsatz"], {"zahlung_auf_rechnung": 60000, "anzahlung_ueber_faktura": 0, "gutschein_mehrzweck": 5000})
        self.assertEqual(r["anzahlungen_ist"], {"brutto_cent": 11000, "ust_cent": 1000})
        self.assertEqual(r["belege"], 7)

    def test_skonto_aufteilen(self):
        t = uva.skonto_aufteilen(1000, [{"ust_satz_promille": 2000, "brutto_cent": 60000}, {"ust_satz_promille": 1000, "brutto_cent": 40000}])
        self.assertEqual(sum(x["brutto_cent"] for x in t), 1000)
        self.assertEqual(t[0], {"ust_satz_promille": 2000, "brutto_cent": 600, "netto_cent": 500, "ust_cent": 100})
        self.assertEqual(uva.skonto_aufteilen(0, []), [])


class TestSkonto(unittest.TestCase):
    def test_skonto(self):
        self.assertEqual(skonto.skonto_bis(date(2026, 11, 4), 7), date(2026, 11, 11))
        self.assertEqual(skonto.skonto_betrag(198000, 20), 3960)
        ok = skonto.skonto_pruefen(198000, 194040, 198000, 20, date(2026, 11, 11), date(2026, 11, 10))
        self.assertEqual((ok["zulaessig"], ok["skonto_cent"]), (True, 3960))
        self.assertFalse(skonto.skonto_pruefen(198000, 194040, 198000, 20, date(2026, 11, 11), date(2026, 11, 12))["zulaessig"])
        self.assertFalse(skonto.skonto_pruefen(198000, 180000, 198000, 20, date(2026, 11, 11), date(2026, 11, 10))["zulaessig"])
        self.assertFalse(skonto.skonto_pruefen(198000, 194040, 198000, 0, None, date(2026, 11, 10))["zulaessig"])


class TestERechnung(unittest.TestCase):
    def test_ebinterface(self):
        name, x = erechnung.erzeuge("ebInterface 6.1", RE)
        self.assertTrue(name.endswith("ebInterface61.xml"))
        dom = xml.dom.minidom.parseString(x.encode("utf-8"))
        self.assertEqual(dom.documentElement.getAttribute("xmlns"), erechnung.EBI_NS)
        self.assertIn("<PayableAmount>1980.00</PayableAmount>", x)
        self.assertIn("<PrepaidAmount>1200.00</PrepaidAmount>", x)
        self.assertIn("Sofa &lt;Modell A&gt;", x)
        self.assertIn('<Quantity Unit="HUR">2.5</Quantity>', x)
        self.assertIn("<Percentage>2.00</Percentage>", x)

    def test_cii_profile(self):
        _, x = erechnung.erzeuge("ZUGFeRD EN16931", RE)
        xml.dom.minidom.parseString(x.encode("utf-8"))
        self.assertIn("urn:cen.eu:en16931:2017</ram:ID>", x)
        self.assertIn("<ram:DuePayableAmount>1980.00</ram:DuePayableAmount>", x)
        self.assertIn('<ram:TaxTotalAmount currencyID="EUR">530.00</ram:TaxTotalAmount>', x)
        with self.assertRaises(erechnung.ERechnungFehler):
            erechnung.erzeuge("XRechnung", RE)  # Leitweg-ID fehlt
        _, xr = erechnung.erzeuge("XRechnung", {**RE, "leitweg_id": "04011000-1234512345-06"})
        self.assertIn("xrechnung_3.0", xr)

    def test_steuerfrei_braucht_grund_und_uid(self):
        d = {**RE, "ust_fall": "Innergemeinschaftlich steuerfrei", "kaeufer": {**RE["kaeufer"], "uid": ""}}
        self.assertIn("kaeufer.uid", erechnung.pruefen(d, "ebInterface 6.1"))
        self.assertIn("ust_hinweistext (Befreiungsgrund)", erechnung.pruefen(d, "ebInterface 6.1"))
        ok = {**RE, "ust_fall": "Reverse Charge", "ust_hinweistext": "Steuerschuld geht auf den Leistungsempfänger über", "steuer": [{"ust_satz_promille": 0, "netto_cent": 265000, "ust_cent": 0}]}
        _, x = erechnung.erzeuge("ZUGFeRD EN16931", ok)
        self.assertIn("<ram:CategoryCode>AE</ram:CategoryCode>", x)
        self.assertIn("<ram:ExemptionReason>", x)


class TestSepa(unittest.TestCase):
    def test_iban(self):
        self.assertTrue(sepa.iban_gueltig("AT61 1904 3002 3457 3201"))
        self.assertFalse(sepa.iban_gueltig("AT61 1904 3002 3457 3202"))
        self.assertTrue(sepa.iban_gueltig("DE89370400440532013000"))

    def test_pain001(self):
        x = sepa.pain001({"name": "MW Immobilienverwaltungs GmbH", "iban": "AT611904300234573201", "bic": "BKAUATWW"},
                         [{"empfaenger": "Möbelwerk Süd & Co", "iban": "DE89370400440532013000", "betrag_cent": 123456, "verwendungszweck": "RE 4711 / Kunde 12", "end_to_end_id": "ER-2026-00001"},
                          {"empfaenger": "Leuchten AG", "iban": "AT611904300234573201", "betrag_cent": 100, "verwendungszweck": "R-1"}],
                         date(2026, 11, 6), "ZL-2026-11-06", erstellt=datetime(2026, 11, 4, 9, 0))
        xml.dom.minidom.parseString(x.encode("utf-8"))
        self.assertIn("<NbOfTxs>2</NbOfTxs><CtrlSum>1235.56</CtrlSum>", x)
        self.assertIn("<Nm>Moebelwerk Sued + Co</Nm>", x)
        with self.assertRaises(sepa.SepaFehler):
            sepa.pain001({"name": "X", "iban": "AT611904300234573201"}, [{"empfaenger": "Y", "iban": "AT00", "betrag_cent": 1}], date(2026, 11, 6), "Z")


class TestMahnenAT(unittest.TestCase):
    EINST = {"zinsen_ab_stufe": 1, "zinssatz_verbraucher_promille": 40, "zinssatz_unternehmer_promille": 122, "gebuehr1_cent": 500, "gebuehr2_cent": 1000}

    def test_verbraucher(self):
        b = mahnen.mahnbetrag(100000, 1, 30, self.EINST)
        self.assertEqual((b["mahngebuehr_cent"], b["verzugszinsen_cent"], b["zinssatz_promille"]), (500, 329, 40))

    def test_unternehmer_basiszins_und_pauschale(self):
        e = {**self.EINST, "basiszinssatz_bp": 153, "pauschale_unternehmer_cent": 4000}
        b = mahnen.mahnbetrag(100000, 1, 30, e, unternehmer=True)
        self.assertEqual(b["zinssatz_bp"], 1073)
        self.assertEqual(b["verzugszinsen_cent"], 882)
        self.assertEqual((b["pauschale_cent"], b["mahngebuehr_cent"]), (4000, 4000))
        b2 = mahnen.mahnbetrag(100000, 2, 45, e, unternehmer=True, pauschale_bereits=True)
        self.assertEqual((b2["pauschale_cent"], b2["mahngebuehr_cent"]), (0, 1000))
        self.assertEqual(mahnen.zinssatz_unternehmer_bp(-62), 858)


class TestExportRzl(unittest.TestCase):
    def test_rzl(self):
        z = [{"datum": date(2026, 11, 4), "nummer": "RE-2026-00042", "konto": "20001", "gegenkonto": "4000", "brutto_cent": 120000, "soll_haben": "S", "satz_promille": 2000, "ust_cent": 20000, "text": "Hotel Post", "leistungsdatum": date(2026, 11, 2), "uid": "ATU12345678"}]
        out = export.erzeuge("RZL CSV", z)
        zeilen = out.strip().split("\r\n")
        self.assertEqual(zeilen[0].split(";")[0], "Belegdatum")
        self.assertEqual(zeilen[1], "04.11.2026;RE-2026-00042;20001;4000;1200,00;S;1;20,00;200,00;Hotel Post;02.11.2026;ATU12345678")


if __name__ == "__main__":
    unittest.main()
