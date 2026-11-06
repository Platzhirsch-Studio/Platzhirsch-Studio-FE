"""Reine Logik Warenrücknahme (außerhalb des Shop-Widerrufs) ohne Frappe: Prüfregeln und Buchungsplan je Position.

Entscheidung → Buchung (bestand.buche):
  Wiedereinlagern → Retoure, Zustand Neu, verfügbar
  B-Ware          → Retoure, Zustand B-Ware, verfügbar (eigene Bestandszeile)
  An Lieferant    → Retoure, Zustand B-Ware, gesperrt (Sperrbestand bis Rücksendung/Regress)
  Ausbuchen       → Retoure + Ausbuchung (Journal vollständig, Bestand 0)
"""

ZUSTAENDE = ("Neuwertig", "B-Ware", "Defekt")
ENTSCHEIDUNGEN = ("Wiedereinlagern", "B-Ware", "Ausbuchen", "An Lieferant")


def position_fehler(p):
    """Fehlertext oder None."""
    z, e = p.get("zustand"), p.get("entscheidung")
    if int(p.get("menge") or 0) <= 0:
        return "Menge muss größer 0 sein"
    if z and z not in ZUSTAENDE:
        return f"Unbekannter Zustand {z}"
    if e and e not in ENTSCHEIDUNGEN:
        return f"Unbekannte Entscheidung {e}"
    if e == "Wiedereinlagern" and z and z != "Neuwertig":
        return "Nur neuwertige Ware wird als Neuware eingelagert (sonst B-Ware wählen)"
    if e == "B-Ware" and z == "Defekt":
        return "Defekte Ware: Ausbuchen oder An Lieferant"
    if e and e != "Ausbuchen" and not p.get("produkt"):
        return "Ohne Produkt kann nicht eingelagert werden – Ausbuchen wählen oder Produkt zuordnen"
    return None


def buchungen(positionen, lagerort):
    """→ Liste {position, art, produkt, menge, lagerort_nach|lagerort_von, zustand, gesperrt, platz} in Buchungsreihenfolge.
    Bereits gebuchte Positionen (gebucht=1) und Positionen ohne Entscheidung werden übersprungen."""
    out = []
    for p in positionen:
        if p.get("gebucht") or not p.get("entscheidung") or position_fehler(p):
            continue
        e = p["entscheidung"]
        basis = {"position": p.get("name"), "produkt": p.get("produkt"), "menge": int(p.get("menge") or 0), "platz": p.get("platz"), "seriennummer": p.get("seriennummer")}
        if e == "Ausbuchen" and not p.get("produkt"):
            continue  # nichts im Bestand – nur Protokoll
        zustand = "Neu" if e == "Wiedereinlagern" else "B-Ware"
        out.append({**basis, "art": "Retoure", "lagerort_nach": lagerort, "zustand": zustand, "gesperrt": int(e in ("An Lieferant", "Ausbuchen"))})
        if e == "Ausbuchen":
            out.append({**basis, "art": "Ausbuchung", "lagerort_von": lagerort, "zustand": zustand, "gesperrt": 1})
    return out


def vollstaendig(positionen):
    """Alle Positionen entschieden und fehlerfrei?"""
    return bool(positionen) and all(p.get("entscheidung") and not position_fehler(p) for p in positionen)
