import unittest

from ph_kassa.druck.qr import qr_svg


class TestQrSvg(unittest.TestCase):
    def test_svg_oder_platzhalter(self):
        svg = qr_svg("_R1-AT1_K1_1_2026-11-04T10:00:00_0,00_0,00_0,00_0,00_0,00_x_y_z", 30)
        self.assertTrue(svg.startswith("<svg"))
        self.assertIn('width="30mm"', svg)
        self.assertEqual(qr_svg(""), "")


if __name__ == "__main__":
    unittest.main()
