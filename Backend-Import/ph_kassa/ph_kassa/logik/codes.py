"""Scan-Code-Erkennung an der Kassa (Konzept 10-konzept-kassa.md §9.1 „code_erkennen“) – ohne Frappe.

Ein Scanner liefert eine Zeichenkette; die Kassa muss entscheiden, ob das ein Produkt (EAN/GTIN), eine
Kundenkarte (KK-XXXXXX, ph_kundenkarte), ein Gutschein (PH-XXXX-XXXX, ph_shop), ein Kassenbeleg (Name
<Kassen-ID>-<6 Ziffern> oder RKSV-QR-Code), ein Auftrag (AB-…), eine Rechnung (RE-…) oder eine Bestellung ist.
Die Reihenfolge der Prüfungen ist bewusst: eindeutige Präfixe zuerst, EAN mit Prüfziffer, sonst Freitext-Suche.
"""

from __future__ import annotations

import re

ARTEN = ("kundenkarte", "gutschein", "kassenbeleg", "rksv_qr", "auftrag", "rechnung", "bestellung", "ean", "suche")

_KK = re.compile(r"^KK-?[0-9A-Z]{6}$")
_GS = re.compile(r"^(TEST-?)?PH-?([0-9A-Z]{4}-?){3}[0-9A-Z]{4}$")  # ph_shop.gutschein_code: PH-XXXX-XXXX-XXXX-XXXX
_AB = re.compile(r"^AB-\d{4}-\d{3,6}$")
_RE = re.compile(r"^RE-\d{4}-\d{3,6}$")
_BEST = re.compile(r"^PH-S-\d{2}\.?\d{2}\.?\d{2}-?\d{3,6}$|^PH-S-[0-9.\-]+$")
_BELEG = re.compile(r"^[A-Z0-9][A-Z0-9-]*-\d{6}$")


def ean_pruefziffer_ok(code: str) -> bool:
    """GTIN-8/12/13/14 mit Modulo-10-Prüfziffer."""
    if not code.isdigit() or len(code) not in (8, 12, 13, 14):
        return False
    ziffern = [int(c) for c in code]
    pruef = ziffern.pop()
    summe = sum(d * (3 if i % 2 == 0 else 1) for i, d in enumerate(reversed(ziffern)))
    return (10 - summe % 10) % 10 == pruef


def erkennen(code: str) -> dict:
    """→ {"art": eine von ARTEN, "wert": normalisierter Code}."""
    roh = (code or "").strip()
    if not roh:
        return {"art": "suche", "wert": ""}
    if roh.startswith("_R1-AT"):
        teile = roh.split("_")
        return {"art": "rksv_qr", "wert": roh, "kassen_id": teile[2] if len(teile) > 3 else None, "belegnummer": teile[3] if len(teile) > 3 else None}
    gross = roh.upper().replace(" ", "")
    if _KK.match(gross):
        return {"art": "kundenkarte", "wert": gross if "-" in gross else f"KK-{gross[2:]}"}
    if _AB.match(gross):
        return {"art": "auftrag", "wert": gross}
    if _RE.match(gross):
        return {"art": "rechnung", "wert": gross}
    if gross.startswith("PH-S-") and _BEST.match(gross):
        return {"art": "bestellung", "wert": gross}
    if _GS.match(gross):
        return {"art": "gutschein", "wert": gross}
    if gross.isdigit() and ean_pruefziffer_ok(gross):
        return {"art": "ean", "wert": gross}
    if _BELEG.match(gross):
        return {"art": "kassenbeleg", "wert": gross}
    return {"art": "suche", "wert": roh}
