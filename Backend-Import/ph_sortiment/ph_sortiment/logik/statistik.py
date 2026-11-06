"""Reklamationsstatistik je Lieferant (Datenbasis für Lieferantengespräche und ph_service-Regress).

Reine Aggregation ohne Frappe (Tests: ph_sortiment/tests/test_statistik.py). Quoten in echten Promille.
Eingaben sind Listen von dicts, die der Report/die API aus der Datenbank liest:
  we_positionen   [{lieferant, zustand, menge_erwartet, menge_erhalten}]          (PH Wareneingang Position + Kopf)
  hb_positionen   [{lieferant, abweichung}]                                       (PH Herstellerbestellung Position, nicht storniert, mit AB)
  lieferungen     [{lieferant, termin (bestätigt/Wunsch), geliefert_am}]          (PH Herstellerbestellung)
  servicefaelle   [{lieferant}] · regresse [{lieferant, status, betrag_gefordert_cent, betrag_anerkannt_cent}]  (nur mit ph_service)
"""

from datetime import date

SCHADEN = ("Transportschaden", "beschaedigt", "falsch", "fehlt")


def _d(v):
    if isinstance(v, date):
        return v
    return date.fromisoformat(str(v)[:10]) if v else None


def _promille(teil, ganz):
    return int(round(teil * 1000 / ganz)) if ganz else None


def reklamationsstatistik(we_positionen=(), hb_positionen=(), lieferungen=(), servicefaelle=(), regresse=()):
    """→ Liste je Lieferant (sortiert nach Schadenquote absteigend) und Gesamtzeile."""
    s = {}

    def zeile(l):
        return s.setdefault(l or "(ohne Lieferant)", {"lieferant": l or "(ohne Lieferant)", "we_positionen": 0, "we_schaeden": 0, "Transportschaden": 0, "beschaedigt": 0, "falsch": 0, "fehlt": 0, "unterlieferung": 0,
                                                       "ab_positionen": 0, "ab_abweichungen": 0, "lieferungen": 0, "puenktlich": 0, "verspaetet": 0, "verspaetung_tage_summe": 0,
                                                       "servicefaelle": 0, "regresse": 0, "regress_gefordert_cent": 0, "regress_anerkannt_cent": 0})

    for p in we_positionen:
        z = zeile(p.get("lieferant"))
        z["we_positionen"] += 1
        zu = p.get("zustand") or "ok"
        if zu in SCHADEN:
            z["we_schaeden"] += 1
            z[zu] += 1
        elif int(p.get("menge_erhalten") or 0) < int(p.get("menge_erwartet") or 0):
            z["unterlieferung"] += 1
    for p in hb_positionen:
        z = zeile(p.get("lieferant"))
        z["ab_positionen"] += 1
        if (p.get("abweichung") or "keine") != "keine":
            z["ab_abweichungen"] += 1
    for b in lieferungen:
        termin, ist = _d(b.get("termin")), _d(b.get("geliefert_am"))
        if not (termin and ist):
            continue
        z = zeile(b.get("lieferant"))
        z["lieferungen"] += 1
        tage = (ist - termin).days
        if tage <= 0:
            z["puenktlich"] += 1
        else:
            z["verspaetet"] += 1
            z["verspaetung_tage_summe"] += tage
    for f in servicefaelle:
        zeile(f.get("lieferant"))["servicefaelle"] += 1
    for r in regresse:
        z = zeile(r.get("lieferant"))
        z["regresse"] += 1
        z["regress_gefordert_cent"] += int(r.get("betrag_gefordert_cent") or 0)
        z["regress_anerkannt_cent"] += int(r.get("betrag_anerkannt_cent") or 0)

    def quoten(z):
        z["schadenquote_promille"] = _promille(z["we_schaeden"], z["we_positionen"])
        z["ab_abweichungsquote_promille"] = _promille(z["ab_abweichungen"], z["ab_positionen"])
        z["termintreue_promille"] = _promille(z["puenktlich"], z["lieferungen"])
        z["verspaetung_tage_schnitt"] = round(z["verspaetung_tage_summe"] / z["verspaetet"], 1) if z["verspaetet"] else 0
        z["regress_quote_promille"] = _promille(z["regress_anerkannt_cent"], z["regress_gefordert_cent"])
        return z

    zeilen = [quoten(z) for z in s.values()]
    zeilen.sort(key=lambda z: (-(z["schadenquote_promille"] or 0), -(z["ab_abweichungsquote_promille"] or 0), z["lieferant"]))
    gesamt = {"lieferant": "Gesamt"}
    for k in zeilen[0] if zeilen else []:
        if k != "lieferant" and not k.endswith("_promille") and k != "verspaetung_tage_schnitt":
            gesamt[k] = sum(z[k] for z in zeilen)
    if zeilen:
        quoten(gesamt)
    return zeilen, (gesamt if zeilen else None)
