"""Paketprofile – Python-Port der Tabelle PAKETTYPEN aus src/lib/shop/paketprofile.js (reine Logik, kein Frappe).

Alle Werte sind SCHÄTZUNGEN (geprueft = 0) bis der Inhaber den Karton gemessen hat
(qa-screenshots/shop/PAKETPROFILE.md). Formeln wie in der Website-Datei:
  Außenmaß = Inhalt + 2 × Polster + 1 cm Wand (aufgerundet), absteigend sortiert
  Tara     = ceil((150 g + 12 g je Liter Kartonvolumen) / 50) × 50
  Gewicht  = schwerster Artikel + Tara
Gefahrgut (Parfum UN 1266, Akku-Leuchte UN 3481, Streichhölzer UN 1944/1945) bleibt gesperrt – nur Abholung.
"""

import math

QUELLE_SCHAETZUNG = "Schätzung aus Produktdaten (31.10.2026), zu prüfen"
GESPERRT_GEFAHRGUT = "Versand erst nach Klärung Gefahrgut"
POLSTER_CM = {"zerbrechlich": 8, "kerze": 5, "duft": 5, "buch": 3, "akku": 5}
WAND_CM = 1
GLAS_FAMILIEN = {"glas", "karaffe", "vase", "geschirr", "geschenkset", "parfum", "duft"}


def karton_aus(inhalt_cm, polster_cm):
    return sorted((math.ceil(x + 2 * polster_cm + WAND_CM) for x in inhalt_cm), reverse=True)


def tara_aus(masse):
    l, b, h = masse
    return int(math.ceil((150 + 12 * ((l * b * h) / 1000)) / 50) * 50)


def typ(key, bezeichnung, familie, inhalt_cm, polster_cm, max_artikel_gewicht_g, max_stueck=1, versand_gesperrt=None, gefahrgut_un=None, gefahrgut_pruefen=False):
    l, b, h = karton_aus(inhalt_cm, polster_cm)
    tara = tara_aus((l, b, h))
    zerbrechlich = polster_cm == POLSTER_CM["zerbrechlich"] or familie in GLAS_FAMILIEN
    return {
        "key": key,
        "bezeichnung": bezeichnung,
        "familie": familie,
        "laenge_cm": l,
        "breite_cm": b,
        "hoehe_cm": h,
        "tara_g": tara,
        "max_artikel_gewicht_g": max_artikel_gewicht_g,
        "gewicht_g": max_artikel_gewicht_g + tara,
        "max_stueck": max_stueck,
        "polster_cm": polster_cm,
        "zerbrechlich": int(zerbrechlich),
        "glas": int(familie in GLAS_FAMILIEN),  # K17: Glas/zerbrechlich → Versicherung
        "kerze": int(familie == "kerze"),
        "versand_gesperrt": versand_gesperrt,
        "gefahrgut_un": gefahrgut_un,
        "gefahrgut_pruefen": int(gefahrgut_pruefen),
        "geprueft": 0,
        "quelle": QUELLE_SCHAETZUNG,
    }


Z = POLSTER_CM["zerbrechlich"]
GLAS_H, ZELLE = 30, 15


def glas(key, label, nx, ny, n):
    return typ(key, label, "glas", [GLAS_H, nx * ZELLE, ny * ZELLE], Z, n * 400, max_stueck=n)


PAKETTYPEN = [
    glas("glas-1", "1 Glas", 1, 1, 1),
    glas("glas-2er-set", "Gläser, 2er-Set", 2, 1, 2),
    glas("glas-3er-set", "Gläser, 3er-Set", 3, 1, 3),
    glas("glas-4er-set", "Gläser, 4er-Set", 2, 2, 4),
    glas("glas-6er-set", "Gläser, 6er-Set", 3, 2, 6),
    typ("karaffe", "Karaffe / Dekanter bis 36 cm", "karaffe", [36, 22, 22], Z, 1800),
    typ("karaffe-gross", "Karaffe / Dekanter bis 45 cm", "karaffe", [45, 26, 26], Z, 2500),
    typ("kerze-klein", "Kerze klein (bis 11 cm, bis 550 g Wachs)", "kerze", [11, 11, 11], POLSTER_CM["kerze"], 1400),
    typ("kerze-mittel", "Kerze mittel (bis 17 cm, bis 1,2 kg Wachs)", "kerze", [17, 17, 17], POLSTER_CM["kerze"], 2600),
    typ("kerze-gross", "Kerze groß (bis 25 cm, bis 3 kg Wachs)", "kerze", [25, 25, 25], POLSTER_CM["kerze"], 5500),
    typ("kerze-3er-set", "Kerzen-Set bis 3 Mini-Kerzen (je bis 9 cm)", "kerze", [27, 9, 9], POLSTER_CM["kerze"], 900, max_stueck=3),
    typ("diffuser", "Diffuser / Nachfüllflasche (bis 42 cm, bis 1 l)", "duft", [42, 14, 14], POLSTER_CM["duft"], 2500, gefahrgut_pruefen=True),
    typ("raumspray", "Raumspray (bis 20 cm, bis 400 ml)", "duft", [20, 8, 8], POLSTER_CM["duft"], 700, gefahrgut_pruefen=True),
    typ("parfum", "Eau de Parfum (Flakon im Etui)", "parfum", [15, 8, 6], POLSTER_CM["duft"], 600, versand_gesperrt=f"{GESPERRT_GEFAHRGUT} (Parfum, UN 1266, Klasse 3)", gefahrgut_un="UN 1266"),
    typ("bildband-klein", "Bildband klein (bis 24 × 18 × 5 cm)", "bildband", [24, 18, 5], POLSTER_CM["buch"], 1500),
    typ("bildband-mittel", "Bildband mittel (bis 34 × 27 × 7 cm)", "bildband", [34, 27, 7], POLSTER_CM["buch"], 4000),
    typ("bildband-gross", "Bildband groß (bis 50 × 42 × 10 cm)", "bildband", [50, 42, 10], POLSTER_CM["buch"], 13000),
    typ("vase-klein", "Vase / Gefäß klein (bis 15 cm)", "vase", [15, 14, 14], Z, 900),
    typ("vase-mittel", "Vase / Gefäß mittel (bis 25 cm)", "vase", [25, 22, 22], Z, 2200),
    typ("vase-gross", "Vase / Gefäß groß (bis 36 cm)", "vase", [36, 28, 28], Z, 4000),
    typ("geschirr-klein", "Geschirr klein (Becher, Tasse, bis 14 cm)", "geschirr", [14, 12, 12], Z, 600),
    typ("geschirr-mittel", "Geschirr mittel (Teller bis Ø 24 cm, Schale, Kanne)", "geschirr", [24, 24, 12], Z, 1800),
    typ("geschirr-gross", "Geschirr groß (Teller/Platte bis 35 cm, flach)", "geschirr", [35, 30, 15], Z, 3500),
    typ("wohnaccessoire-klein", "Wohnaccessoire klein (bis 15 × 15 × 10 cm)", "wohnaccessoire", [15, 15, 10], Z, 1000),
    typ("wohnaccessoire-mittel", "Wohnaccessoire mittel (bis 30 × 25 × 15 cm)", "wohnaccessoire", [30, 25, 15], Z, 3000),
    typ("wohnaccessoire-gross", "Wohnaccessoire groß (bis 40 × 30 × 25 cm)", "wohnaccessoire", [40, 30, 25], Z, 6000),
    typ("geschenkset", "Geschenkset (bis 40 × 30 × 20 cm, bis 3 kg)", "geschenkset", [40, 30, 20], Z, 3000),
    typ("leuchte", "Tragbare Akku-Leuchte (Flos, Tom Dixon)", "leuchte", [30, 15, 15], POLSTER_CM["akku"], 1500, versand_gesperrt=f"{GESPERRT_GEFAHRGUT} (Lithium-Ionen-Akku, UN 3481)", gefahrgut_un="UN 3481"),
    typ("streichhoelzer", "Streichhölzer (Trudon)", "wohnaccessoire", [15, 10, 5], POLSTER_CM["duft"], 300, versand_gesperrt=f"{GESPERRT_GEFAHRGUT} (Streichhölzer, UN 1944/1945, Klasse 4.1)", gefahrgut_un="UN 1944/UN 1945"),
]

# Familie je Website-Kategorie (KATEGORIE_HINWEISE / pakettypOf in paketprofile.js) – für den Vorschlag am Packtisch.
KATEGORIE_FAMILIE = {
    "glas": "glas", "karaffe": "karaffe", "duftkerze": "kerze", "diffuser": "duft", "raumduft": "duft", "parfum": "parfum",
    "bildband": "bildband", "vase": "vase", "geschirr": "geschirr", "wohnaccessoire": "wohnaccessoire", "bar-zubehoer": "wohnaccessoire",
    "geschenkset": "geschenkset", "tragbare-leuchte": "leuchte",
}


def profil(key):
    return next((p for p in PAKETTYPEN if p["key"] == key), None)


def profil_nutzbar(p, modus="live"):
    """GATE wie paketprofile.js: gesperrt → nie; geprüft → immer; Schätzung → nur im Testmodus."""
    if not p or p.get("versand_gesperrt"):
        return False
    if p.get("gefahrgut_pruefen") and not p.get("sdb_geprueft") and modus != "test":
        return False
    if p.get("geprueft"):
        return True
    return modus == "test"
