"""CAD-Metadaten und Volltext-Extraktion ohne Bibliotheken."""

import io
import unittest
import zipfile

from ph_ablage.utils import cad, volltext

DXF = "\n".join([
    "0", "SECTION", "2", "HEADER",
    "9", "$ACADVER", "1", "AC1032",
    "9", "$INSUNITS", "70", "4",
    "9", "$EXTMIN", "10", "0.0", "20", "0.0", "30", "0.0",
    "9", "$EXTMAX", "10", "4200.5", "20", "3000", "30", "0.0",
    "0", "ENDSEC", "0", "EOF",
])
IFC = """ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('kueche.ifc','2026-11-04T10:00:00',('Planer'),('Studio'),'IfcOpenShell','ArchiCAD 27','');
FILE_SCHEMA(('IFC4'));
ENDSEC;"""


def _zip(dateien):
    puffer = io.BytesIO()
    with zipfile.ZipFile(puffer, "w") as z:
        for name, inhalt in dateien.items():
            z.writestr(name, inhalt)
    return puffer.getvalue()


class TestCad(unittest.TestCase):
    def test_dxf(self):
        m = cad.metadaten("dxf", DXF.encode())
        self.assertEqual(m["version_text"], "AutoCAD 2018")
        self.assertEqual(m["einheit"], "Millimeter")
        self.assertEqual(m["ausdehnung"], {"breite": 4200.5, "hoehe": 3000.0})

    def test_dwg(self):
        self.assertEqual(cad.metadaten("dwg", b"AC1027\x00\x00rest")["version_text"], "AutoCAD 2013")
        self.assertEqual(cad.metadaten("dwg", b"XX9999")["version_text"], "unbekannt")

    def test_ifc(self):
        m = cad.metadaten("ifc", IFC.encode())
        self.assertEqual(m["schema"], "IFC4")
        self.assertEqual(m["programm"], "ArchiCAD 27")

    def test_3dm_skp(self):
        self.assertEqual(cad.metadaten("3dm", b"3D Geometry File Format        7")["version"], 7)
        self.assertTrue(cad.metadaten("skp", "﻿SketchUp Model{22.0.354}".encode("utf-16-le"))["erkannt"])

    def test_unbekannt_und_kaputt(self):
        self.assertEqual(cad.metadaten("zip", b"PK"), {})
        self.assertEqual(cad.metadaten("dxf", b"\xff\xfe")["format"], "DXF")


class TestVolltext(unittest.TestCase):
    def test_txt_kodierungen(self):
        self.assertEqual(volltext.text_aus("txt", "Küche Müller".encode("cp1252")), ("Küche Müller", "ok"))
        self.assertEqual(volltext.text_aus("txt", b"   "), (None, "leer"))

    def test_docx(self):
        xml = '<w:document><w:body><w:p><w:r><w:t>Angebot</w:t></w:r><w:r><w:t xml:space="preserve"> Küche</w:t></w:r></w:p><w:p><w:r><w:t>Zeile &amp; zwei</w:t></w:r></w:p></w:body></w:document>'
        text, status = volltext.text_aus("docx", _zip({"word/document.xml": xml}))
        self.assertEqual(status, "ok")
        self.assertEqual(text, "Angebot Küche\nZeile & zwei")

    def test_xlsx_und_pptx(self):
        xlsx = _zip({"xl/sharedStrings.xml": "<sst><si><t>Position</t></si><si><t>Arbeitsplatte Eiche</t></si></sst>"})
        self.assertIn("Arbeitsplatte Eiche", volltext.text_aus("xlsx", xlsx)[0])
        pptx = _zip({"ppt/slides/slide2.xml": "<p:sld><a:p><a:t>Zwei</a:t></a:p></p:sld>", "ppt/slides/slide1.xml": "<p:sld><a:p><a:t>Eins</a:t></a:p></p:sld>"})
        self.assertEqual(volltext.text_aus("pptx", pptx)[0], "Eins\nZwei")

    def test_entity_wird_nicht_expandiert(self):
        boese = '<!DOCTYPE x [<!ENTITY a "AAAA">]><w:p><w:t>&a;</w:t></w:p>'
        text, _ = volltext.text_aus("docx", _zip({"word/document.xml": boese}))
        self.assertEqual(text, "&a;")

    def test_kaputt_und_unbekannt(self):
        self.assertEqual(volltext.text_aus("docx", b"kein zip"), (None, "fehler"))
        self.assertEqual(volltext.text_aus("dwg", b"AC1032"), (None, "nicht_unterstuetzt"))


if __name__ == "__main__":
    unittest.main()
