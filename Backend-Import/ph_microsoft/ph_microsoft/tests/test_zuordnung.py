"""Zuordnungsregeln des Inhabers (Präzisierung 04.11.2026) – reine Logik."""

import unittest

from ph_microsoft.logik import zuordnung as Z

INTERN = {"platzhirsch.studio"}
EIGENE = {"info@platzhirsch.studio", "team@platzhirsch.studio"}
BUCH = {
    "kunde@beispiel.invalid": [("PH Kontakt", "PH-KON-00001")],
    "zweit@beispiel.invalid": [("PH Kontakt", "PH-KON-00001")],
    "geteilt@beispiel.invalid": [("PH Kontakt", "PH-KON-00002"), ("PH Kontakt", "PH-KON-00003")],
    "ab@lieferant.invalid": [("PH Lieferant", "LIEF-1")],
    "noreply@lieferant.invalid": [("PH Lieferant", "LIEF-1")],
    "andere@beispiel.invalid": [("PH Kontakt", "PH-KON-00004")],
}


def treffer(a):
    return BUCH.get(a, [])


def mail(**kw):
    m = {"richtung": "eingang", "absender": "kunde@beispiel.invalid", "an": ["info@platzhirsch.studio"], "cc": [], "sensitivity": "normal", "kopfzeilen": {}}
    m.update(kw)
    return m


def ent(m, gesperrt=()):
    return Z.entscheiden(m, treffer, INTERN, EIGENE, gesperrt)


class TestAdressen(unittest.TestCase):
    def test_normalisiere(self):
        self.assertEqual(Z.normalisiere("Max <MAX@Beispiel.Invalid>"), "max@beispiel.invalid")
        self.assertEqual(Z.normalisiere("mailto:A@b.invalid?subject=x"), "a@b.invalid")
        self.assertEqual(Z.normalisiere("kein-at"), "")
        self.assertEqual(Z.normalisiere(None), "")

    def test_intern(self):
        self.assertTrue(Z.ist_intern("x@platzhirsch.studio", INTERN))
        self.assertTrue(Z.ist_intern("x@mail.platzhirsch.studio", INTERN))
        self.assertFalse(Z.ist_intern("x@platzhirsch.studio.boese.invalid", INTERN))
        self.assertEqual(Z.domains_liste("platzhirsch.studio, @mw.invalid\nx.invalid"), {"platzhirsch.studio", "mw.invalid", "x.invalid"})


class TestRegeln(unittest.TestCase):
    def test_1_eindeutig_automatisch(self):
        e = ent(mail())
        self.assertEqual(e["aktion"], Z.AUTO)
        self.assertEqual(e["kontakte"], [("PH Kontakt", "PH-KON-00001")])

    def test_1_weitere_adresse_desselben_kontakts(self):
        self.assertEqual(ent(mail(absender="zweit@beispiel.invalid"))["kontakte"], [("PH Kontakt", "PH-KON-00001")])

    def test_1_lieferant(self):
        self.assertEqual(ent(mail(absender="ab@lieferant.invalid"))["kontakte"], [("PH Lieferant", "LIEF-1")])

    def test_2_unbekannt_nur_manuell(self):
        e = ent(mail(absender="fremd@beispiel.invalid"))
        self.assertEqual((e["aktion"], e["grund"]), (Z.MANUELL, "unbekannt"))
        self.assertEqual(e["vorschlaege"], [])

    def test_4_vertraulich_nie_automatisch(self):
        for s in ("private", "confidential", "Private"):
            e = ent(mail(sensitivity=s))
            self.assertEqual((e["aktion"], e["grund"]), (Z.MANUELL, "vertraulich"))
            self.assertEqual(e["vorschlaege"], [("PH Kontakt", "PH-KON-00001")])
        self.assertEqual(ent(mail(sensitivity="personal"))["aktion"], Z.AUTO)

    def test_5_mehrdeutig_mit_vorschlaegen(self):
        e = ent(mail(absender="geteilt@beispiel.invalid"))
        self.assertEqual((e["aktion"], e["grund"]), (Z.MANUELL, "mehrdeutig"))
        self.assertEqual(len(e["vorschlaege"]), 2)

    def test_intern_ignorieren(self):
        e = ent(mail(absender="kollege@platzhirsch.studio"))
        self.assertEqual((e["aktion"], e["grund"]), (Z.IGNORIEREN, "intern"))

    def test_newsletter_ignorieren(self):
        for k in ({"List-Unsubscribe": "<mailto:x>"}, {"precedence": "bulk"}, {"auto-submitted": "auto-replied"}, {"list-id": "x"}):
            self.assertEqual(ent(mail(kopfzeilen=k))["aktion"], Z.IGNORIEREN, k)
        self.assertEqual(ent(mail(kopfzeilen={"auto-submitted": "no"}))["aktion"], Z.AUTO)

    def test_noreply_unbekannt_ignorieren_bekannt_zuordnen(self):
        self.assertEqual(ent(mail(absender="no-reply@shop.invalid"))["grund"], "massenmail")
        self.assertEqual(ent(mail(absender="newsletter@shop.invalid"))["grund"], "massenmail")
        self.assertEqual(ent(mail(absender="noreply@lieferant.invalid"))["aktion"], Z.AUTO)

    def test_3_sperrliste(self):
        e = ent(mail(), gesperrt=["Kunde@Beispiel.invalid"])
        self.assertEqual((e["aktion"], e["grund"]), (Z.IGNORIEREN, "gesperrt"))

    def test_ausgang_an_kunden(self):
        e = ent(mail(richtung="ausgang", absender="info@platzhirsch.studio", an=["kunde@beispiel.invalid"], cc=["kollege@platzhirsch.studio"]))
        self.assertEqual(e["kontakte"], [("PH Kontakt", "PH-KON-00001")])

    def test_ausgang_an_zwei_kunden_beide_eindeutig(self):
        e = ent(mail(richtung="ausgang", absender="info@platzhirsch.studio", an=["kunde@beispiel.invalid", "andere@beispiel.invalid"]))
        self.assertEqual(e["aktion"], Z.AUTO)
        self.assertEqual(len(e["kontakte"]), 2)

    def test_ausgang_mit_unbekanntem_cc_bleibt_automatisch(self):
        e = ent(mail(richtung="ausgang", absender="info@platzhirsch.studio", an=["kunde@beispiel.invalid"], cc=["fremd@x.invalid"]))
        self.assertEqual(e["aktion"], Z.AUTO)

    def test_ausgang_mit_mehrdeutigem_empfaenger(self):
        e = ent(mail(richtung="ausgang", absender="info@platzhirsch.studio", an=["kunde@beispiel.invalid", "geteilt@beispiel.invalid"]))
        self.assertEqual(e["aktion"], Z.MANUELL)


class TestReferenzen(unittest.TestCase):
    SERIEN = {
        "PH Anfrage": "PH-ANF-.YYYY.-.#####", "PH Projekt": "PH-PRJ-.YYYY.-.####", "PH Servicefall": "PH-SRV-.YYYY.-.#####",
        "PH Angebot": "AN-.YYYY.-.#####", "PH Rechnung": "RE-.YYYY.-.#####", "PH Bestellung": "PH-S-.YY.MM.DD.-.#####",
    }

    def setUp(self):
        self.m = Z.referenz_muster(self.SERIEN)

    def test_serie_zu_regex(self):
        self.assertEqual(Z.serie_zu_regex("PH-ANF-.YYYY.-.#####"), r"PH\-ANF\-\d{4}\-\d{5}")

    def test_erkennen(self):
        t = "AW: Ihr Projekt PH-PRJ-2026-0012 und Anfrage ph-anf-2026-00007, Rechnung RE-2026-00031"
        self.assertEqual(Z.referenzen_erkennen(t, self.m), [("PH Projekt", "PH-PRJ-2026-0012"), ("PH Anfrage", "PH-ANF-2026-00007"), ("PH Rechnung", "RE-2026-00031")])

    def test_keine_falschen_treffer(self):
        self.assertEqual(Z.referenzen_erkennen("PRE-2026-00031 / XAN-2026-00001 / PH-ANF-2026-000071", self.m), [])

    def test_bestellnummer(self):
        m = Z.referenz_muster({"PH Bestellung": "PH-S-.YY.MM.DD.-.#####"})
        self.assertEqual(Z.referenzen_erkennen("Bestellung PH-S-261104-00012", m), [("PH Bestellung", "PH-S-261104-00012")])

    def test_doppelte_einmal(self):
        self.assertEqual(len(Z.referenzen_erkennen("PH-SRV-2026-00001 PH-SRV-2026-00001", self.m)), 1)


class TestGraphMail(unittest.TestCase):
    def test_umwandlung(self):
        msg = {
            "id": "AAMk1", "internetMessageId": "<x@y>", "subject": "Hallo", "from": {"emailAddress": {"address": "Kunde@Beispiel.invalid", "name": "Max Muster"}},
            "toRecipients": [{"emailAddress": {"address": "info@platzhirsch.studio"}}], "receivedDateTime": "2026-11-04T09:00:00Z",
            "sensitivity": "confidential", "internetMessageHeaders": [{"name": "List-Id", "value": "x"}], "hasAttachments": True,
        }
        m = Z.graph_mail(msg, "info@platzhirsch.studio")
        self.assertEqual((m["richtung"], m["absender"], m["sensitivity"]), ("eingang", "kunde@beispiel.invalid", "confidential"))
        self.assertEqual(m["kopfzeilen"]["list-id"], "x")
        self.assertEqual(Z.graph_mail({**msg, "from": {"emailAddress": {"address": "info@platzhirsch.studio"}}}, "info@platzhirsch.studio")["richtung"], "ausgang")

    def test_name_teilen(self):
        self.assertEqual(Z.name_teilen("Muster, Max"), ("Max", "Muster"))
        self.assertEqual(Z.name_teilen("Anna Maria Beispiel"), ("Anna Maria", "Beispiel"))
        self.assertEqual(Z.name_teilen("", "max.muster@x.invalid"), ("Max", "Muster"))
        self.assertEqual(Z.name_teilen("Firma"), ("", "Firma"))


if __name__ == "__main__":
    unittest.main()
