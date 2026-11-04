import unittest

from ph_faktura.rechenwerk import camt

CAMT = """<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
 <BkToCstmrStmt>
  <GrpHdr><MsgId>M1</MsgId><CreDtTm>2026-11-03T06:00:00</CreDtTm></GrpHdr>
  <Stmt>
   <Id>S1</Id>
   <FrToDt><FrDtTm>2026-11-02T00:00:00</FrDtTm><ToDtTm>2026-11-02T23:59:59</ToDtTm></FrToDt>
   <Acct><Id><IBAN>AT611904300234573201</IBAN></Id><Ccy>EUR</Ccy></Acct>
   <Bal><Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">1000.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal>
   <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">6580.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal>
   <Ntry>
    <Amt Ccy="EUR">5680.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><Sts>BOOK</Sts>
    <BookgDt><Dt>2026-11-02</Dt></BookgDt><ValDt><Dt>2026-11-02</Dt></ValDt>
    <AcctSvcrRef>REF-0001</AcctSvcrRef>
    <NtryDtls><TxDtls>
      <Refs><EndToEndId>NOTPROVIDED</EndToEndId></Refs>
      <RltdPties><Dbtr><Nm>Anna Muster</Nm></Dbtr><DbtrAcct><Id><IBAN>DE89370400440532013000</IBAN></Id></DbtrAcct></RltdPties>
      <RmtInf><Ustrd>Anzahlung RE-2026-00001 Sofa</Ustrd></RmtInf>
    </TxDtls></NtryDtls>
   </Ntry>
   <Ntry>
    <Amt Ccy="EUR">100.00</Amt><CdtDbtInd>DBIT</CdtDbtInd><Sts>BOOK</Sts>
    <BookgDt><Dt>2026-11-02</Dt></BookgDt>
    <NtryDtls><TxDtls>
      <RltdPties><Cdtr><Nm>Lieferant GmbH</Nm></Cdtr></RltdPties>
      <RmtInf><Ustrd>Rechnung 4711</Ustrd></RmtInf>
    </TxDtls></NtryDtls>
   </Ntry>
  </Stmt>
 </BkToCstmrStmt>
</Document>"""


class TestCamt(unittest.TestCase):
    def test_parse(self):
        e = camt.parse(CAMT)
        self.assertEqual(e["iban"], "AT611904300234573201")
        self.assertEqual(e["saldo_start_cent"], 100000)
        self.assertEqual(e["saldo_ende_cent"], 658000)
        self.assertEqual(e["von"], "2026-11-02")
        self.assertEqual(len(e["umsaetze"]), 2)
        u = e["umsaetze"][0]
        self.assertEqual(u["betrag_cent"], 568000)
        self.assertEqual(u["auftraggeber"], "Anna Muster")
        self.assertEqual(u["iban_gegen"], "DE89370400440532013000")
        self.assertEqual(u["camt_ref"], "REF-0001")
        self.assertIn("RE-2026-00001", u["verwendungszweck"])
        a = e["umsaetze"][1]
        self.assertEqual(a["betrag_cent"], -10000)
        self.assertTrue(a["camt_ref"].startswith("H"))  # Hash, weil keine Referenz

    def test_hash_stabil(self):
        a = camt.parse(CAMT)["umsaetze"][1]["camt_ref"]
        b = camt.parse(CAMT)["umsaetze"][1]["camt_ref"]
        self.assertEqual(a, b)

    def test_vorschlag_referenz(self):
        u = camt.parse(CAMT)["umsaetze"][0]
        offen = [
            {"doctype": "PH Rechnung", "name": "RE-2026-00001", "nummer": "RE-2026-00001", "kunde_name": "Anna Muster", "offen_cent": 568000},
            {"doctype": "PH Rechnung", "name": "RE-2026-00002", "nummer": "RE-2026-00002", "kunde_name": "Bert Beispiel", "offen_cent": 568000},
        ]
        v = camt.vorschlag(u, offen)
        self.assertEqual(v["name"], "RE-2026-00001")
        self.assertEqual(v["sicherheit"], 100)

    def test_vorschlag_betrag_und_name(self):
        u = {"betrag_cent": 568000, "verwendungszweck": "Sofa", "auftraggeber": "Muster Anna"}
        offen = [
            {"doctype": "PH Rechnung", "name": "RE-2026-00001", "nummer": "RE-2026-00001", "kunde_name": "Anna Muster", "offen_cent": 568000},
            {"doctype": "PH Rechnung", "name": "RE-2026-00002", "nummer": "RE-2026-00002", "kunde_name": "Bert Beispiel", "offen_cent": 568000},
        ]
        v = camt.vorschlag(u, offen)
        self.assertEqual(v["name"], "RE-2026-00001")
        self.assertEqual(v["sicherheit"], 80)

    def test_kein_vorschlag(self):
        self.assertIsNone(camt.vorschlag({"betrag_cent": 1, "verwendungszweck": "", "auftraggeber": "X"}, []))

    def test_nummern_im_text(self):
        self.assertEqual(camt.nummern_im_text("Zahlung re 2026 00012 und GU-2026-00003"), ["RE-2026-00012", "GU-2026-00003"])


if __name__ == "__main__":
    unittest.main()
