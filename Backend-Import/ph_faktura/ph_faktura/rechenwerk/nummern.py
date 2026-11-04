"""Lückenprüfung fortlaufender Belegnummern (§ 11 Abs 1 Z 3 lit b UStG: fortlaufend, einmalig).

Nummern der Form PRAEFIX-JJJJ-NNNNN (RE-2026-00012). Je Jahr muss die Folge 1..max lückenlos sein;
Stornos sind keine Lücke (Beleg bleibt, Gutschrift verweist darauf).
"""

import re

NUMMER_RE = re.compile(r"^(RE|GU|AN|AB|MA|ER|EX|BI|BU|UVA)-(\d{4})-(\d+)$")


def zerlegen(nummer):
    m = NUMMER_RE.match(str(nummer or "").strip())
    if not m:
        return None
    return m.group(1), int(m.group(2)), int(m.group(3))


def luecken(nummern):
    """→ {(praefix, jahr): {"max": n, "fehlend": [..], "doppelt": [..]}} nur für Gruppen mit Befund
    sowie Gesamtliste unter Schlüssel 'alle' mit allen Gruppen."""
    gruppen = {}
    for n in nummern:
        z = zerlegen(n)
        if not z:
            continue
        p, j, lauf = z
        gruppen.setdefault((p, j), []).append(lauf)
    ergebnis = {}
    for key, laeufe in gruppen.items():
        vorhanden = sorted(laeufe)
        maximum = vorhanden[-1]
        fehlend = sorted(set(range(1, maximum + 1)) - set(vorhanden))
        doppelt = sorted({x for x in vorhanden if vorhanden.count(x) > 1})
        ergebnis[key] = {"max": maximum, "anzahl": len(vorhanden), "fehlend": fehlend, "doppelt": doppelt}
    return ergebnis


def formatiere(praefix, jahr, lauf, breite=5):
    return f"{praefix}-{jahr}-{str(lauf).zfill(breite)}"
