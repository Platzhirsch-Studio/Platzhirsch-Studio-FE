"""Ohne Site: Standard-Terminarten (utils/terminarten.py, angelegt von install.py) passen zur Website src/lib/booking/types.js.

cd Backend-Import/ph_crm && python -m unittest discover -s ph_crm/tests -t .
Liegt das Website-Repo nicht daneben, prüft der Test gegen die hier festgehaltenen Werte (Stand 04.11.2026).
"""

import os
import re
import unittest

from ph_crm.utils.terminarten import TERMINARTEN

TYPES_JS = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src", "lib", "booking", "types.js"))
# Stand types.js 04.11.2026 (Rückfall, falls das Website-Repo fehlt)
WEBSITE = {
    "studio": {"dauer": 60, "puffer": 15, "vorher": 0, "bestaetigung": "sofort", "starts": [], "days": [], "themen": []},
    "video": {"dauer": 45, "puffer": 15, "vorher": 0, "bestaetigung": "sofort", "starts": [], "days": [], "themen": []},
    "vor_ort": {"dauer": 90, "puffer": 60, "vorher": 60, "bestaetigung": "anfrage", "starts": ["10:00", "14:00"], "days": [2, 3, 4, 5], "themen": []},
    "planung": {"dauer": 90, "puffer": 15, "vorher": 0, "bestaetigung": "sofort", "starts": [], "days": [], "themen": ["kueche", "wohnen", "ezarri", "licht", "yacht", "hotel"]},
}


def _liste(text):
    return [x.strip().strip('"') for x in text.split(",") if x.strip()] if text else []


def website_terminarten():
    if not os.path.exists(TYPES_JS):
        return WEBSITE
    js = open(TYPES_JS, encoding="utf-8").read()
    out = {}
    for m in re.finditer(r"^\s*(\w+): \{ key: \"(\w+)\"(.*)\},?$", js, re.M):
        rumpf = m.group(3)

        def zahl(k, rumpf=rumpf):
            r = re.search(rf"\b{k}: (\d+)", rumpf)
            return int(r.group(1)) if r else 0

        def feld(k, rumpf=rumpf):
            r = re.search(rf"\b{k}: \[([^\]]*)\]", rumpf)
            return _liste(r.group(1)) if r else []

        best = re.search(r'bestaetigung: "(\w+)"', rumpf)
        out[m.group(2)] = {"dauer": zahl("dauer"), "puffer": zahl("puffer"), "vorher": zahl("vorher"), "bestaetigung": best.group(1) if best else "",
                           "starts": feld("starts"), "days": [int(x) for x in feld("days")], "themen": feld("themen")}
    return out


class TestTerminarten(unittest.TestCase):
    def test_keys_und_werte_wie_website(self):
        web = website_terminarten()
        self.assertEqual(set(web), {"studio", "video", "vor_ort", "planung"})
        backend = {t["key"]: t for t in TERMINARTEN}
        self.assertEqual(set(backend), set(web))
        for key, w in web.items():
            b = backend[key]
            with self.subTest(key=key):
                self.assertEqual(b["dauer_min"], w["dauer"])
                self.assertEqual(b["puffer_min"], w["puffer"])
                self.assertEqual(b["anfahrt_min"], w["vorher"])
                self.assertEqual(b["bestaetigung"], "manuell" if w["bestaetigung"] == "anfrage" else "automatisch")
                self.assertEqual(_liste(b.get("feste_startzeiten")), w["starts"])
                # Website 0 = Sonntag, PH Terminart 0 = Montag
                self.assertEqual([int(x) for x in _liste(b.get("wochentage"))], [(d - 1) % 7 for d in w["days"]])
                self.assertEqual(_liste(b.get("themen")), w["themen"])
                self.assertTrue(b.get("beschreibung"))

    def test_modi(self):
        backend = {t["key"]: t for t in TERMINARTEN}
        self.assertEqual(backend["studio"]["modus"], "Showroom")
        self.assertEqual(backend["video"]["modus"], "Video")
        self.assertEqual(backend["vor_ort"]["modus"], "Vor Ort")
        self.assertEqual(_liste(backend["planung"]["modi_erlaubt"]), ["Showroom", "Video"])


if __name__ == "__main__":
    unittest.main()
