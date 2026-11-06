"""Reine Bestandslogik (kein Frappe-Import): Wirkung einer Lagerbewegung auf Bestandszeilen.

Eine Bewegung hat art, menge (> 0), lagerort_von, lagerort_nach. Wirkung in Stück je (lagerort):
  Wareneingang, Retoure        +menge auf lagerort_nach
  Verkauf, Ausbuchung          −menge von lagerort_von
  Umlagerung                   −menge von lagerort_von, +menge auf lagerort_nach
  Inventur                     setzt den Bestand auf lagerort_nach auf den Ist-Wert (menge = Differenz, Vorzeichen erlaubt)
  Reservierung / Freigabe      ändert nur `reserviert` (+/−), nicht `menge`
"""

ARTEN = ("Wareneingang", "Verkauf", "Umlagerung", "Inventur", "Retoure", "Ausbuchung", "Reservierung", "Freigabe")
ZUGANG = {"Wareneingang", "Retoure"}
ABGANG = {"Verkauf", "Ausbuchung"}


class BestandsFehler(ValueError):
    pass


def pruefe_bewegung(b):
    art = b.get("art")
    if art not in ARTEN:
        raise BestandsFehler(f"Unbekannte Bewegungsart: {art}")
    menge = int(b.get("menge") or 0)
    if art != "Inventur" and menge <= 0:
        raise BestandsFehler("Menge muss größer 0 sein.")
    if art in ZUGANG and not b.get("lagerort_nach"):
        raise BestandsFehler("Zugang braucht einen Ziel-Lagerort.")
    if art in ABGANG and not b.get("lagerort_von"):
        raise BestandsFehler("Abgang braucht einen Quell-Lagerort.")
    if art == "Umlagerung":
        if not (b.get("lagerort_von") and b.get("lagerort_nach")):
            raise BestandsFehler("Umlagerung braucht Quell- und Ziel-Lagerort.")
        if b["lagerort_von"] == b["lagerort_nach"] and (b.get("platz_von") or "") == (b.get("platz_nach") or ""):
            raise BestandsFehler("Umlagerung ohne Ortswechsel.")
    if art in ("Reservierung", "Freigabe") and not b.get("lagerort_von"):
        raise BestandsFehler("Reservierung braucht den Lagerort des Bestands.")
    if art == "Inventur" and not b.get("lagerort_nach"):
        raise BestandsFehler("Inventur braucht den Lagerort.")
    return True


def wirkung(b):
    """→ Liste von (lagerort, delta_menge, delta_reserviert)."""
    pruefe_bewegung(b)
    art, menge = b["art"], int(b.get("menge") or 0)
    if art in ZUGANG:
        return [(b["lagerort_nach"], menge, 0)]
    if art in ABGANG:
        return [(b["lagerort_von"], -menge, 0)]
    if art == "Umlagerung":
        return [(b["lagerort_von"], -menge, 0), (b["lagerort_nach"], menge, 0)]
    if art == "Inventur":
        return [(b["lagerort_nach"], menge, 0)]
    if art == "Reservierung":
        return [(b["lagerort_von"], 0, menge)]
    return [(b["lagerort_von"], 0, -menge)]


def anwenden(bestaende, b, negativ_erlaubt=False):
    """bestaende: dict lagerort → {"menge", "reserviert"}; wird kopiert und zurückgegeben."""
    neu = {k: dict(v) for k, v in bestaende.items()}
    for ort, dm, dr in wirkung(b):
        z = neu.setdefault(ort, {"menge": 0, "reserviert": 0})
        z["menge"] = int(z["menge"]) + dm
        z["reserviert"] = int(z["reserviert"]) + dr
        if z["menge"] < 0 and not negativ_erlaubt:
            raise BestandsFehler(f"Bestand an {ort} würde negativ ({z['menge']}).")
        if z["reserviert"] < 0:
            z["reserviert"] = 0
        if z["reserviert"] > z["menge"] and not negativ_erlaubt:
            raise BestandsFehler(f"Mehr reserviert als vorhanden an {ort}.")
    return neu


def verfuegbar(menge, reserviert, gesperrt=False, kommission=None):
    """Frei verkäuflich: gesperrte Ware (Schaden, an Lieferant) und Kommissionsware (gehört einem Projekt/Auftrag) zählen nicht."""
    if gesperrt or kommission:
        return 0
    return max(int(menge or 0) - int(reserviert or 0), 0)


def status_aus(menge, reserviert, ausgeschieden=False, verkauft=False, gesperrt=False, kommission=None):
    if ausgeschieden:
        return "Ausgeschieden"
    if verkauft or int(menge or 0) <= 0:
        return "Verkauft" if verkauft or int(menge or 0) <= 0 else "Verfuegbar"
    if gesperrt:
        return "Gesperrt"
    if kommission:
        return "Kommission"
    if int(reserviert or 0) >= int(menge or 0):
        return "Reserviert"
    return "Verfuegbar"


def inventur_differenzen(positionen):
    """positionen: [{soll, ist, gezaehlt}] → (anzahl, gezaehlt, mit_differenz, summe_differenz, [Bewegungen])."""
    bew = []
    mit_diff = 0
    summe = 0
    gez = 0
    for p in positionen:
        if not p.get("gezaehlt"):
            continue
        gez += 1
        d = int(p.get("ist") or 0) - int(p.get("soll") or 0)
        if d:
            mit_diff += 1
            summe += d
            bew.append({"art": "Inventur", "menge": d, "lagerbestand": p.get("lagerbestand"), "produkt": p.get("produkt"), "grund": p.get("grund")})
    return len(positionen), gez, mit_diff, summe, bew


# ── Wareneingang, Reservierung, Kommission, Platz-Codes ───────────────────

SCHADEN = ("Transportschaden", "beschaedigt")


def einlagerung_aus_wareneingang(zustand):
    """Zustand einer PH Wareneingang Position → (buchen?, bestand_zustand, gesperrt).
    falsch/fehlt: nichts einlagern; Schaden: B-Ware gesperrt (bis Servicefall/Regress entschieden)."""
    if zustand in ("falsch", "fehlt"):
        return False, None, 0
    if zustand in SCHADEN:
        return True, "B-Ware", 1
    return True, "Neu", 0


def reservierung_abgelaufen(bis, heute):
    """bis/heute als date oder 'YYYY-MM-DD'; ohne Ablaufdatum nie abgelaufen."""
    if not bis:
        return False
    return str(bis)[:10] < str(heute)[:10]


PLATZ_TRENNER = "/"


def platz_code(lagerort, platz):
    """QR-Inhalt eines Platzetiketts: '<Lagerort>/<Platz>'."""
    return f"{lagerort}{PLATZ_TRENNER}{platz}" if platz else str(lagerort)


def platz_aus_code(code):
    """'Lager Lochau/R1-03' → ('Lager Lochau', 'R1-03'); ohne Trenner → (code, None). Letzter Trenner zählt (Lagerorte ohne '/')."""
    c = str(code or "").strip()
    if not c:
        return None, None
    if PLATZ_TRENNER not in c:
        return c, None
    ort, platz = c.split(PLATZ_TRENNER, 1)
    return ort.strip() or None, platz.strip() or None


def kommission_offen(bestaende, erwartet):
    """Kommissionsübersicht: bestaende [{produkt, menge, gesperrt}] (im Lager), erwartet [{produkt, menge, menge_erhalten}]
    (Herstellerbestellungen) → {im_lager, gesperrt, erwartet_offen, vollstaendig}."""
    im_lager = sum(int(b.get("menge") or 0) for b in bestaende if not b.get("gesperrt"))
    gesperrt = sum(int(b.get("menge") or 0) for b in bestaende if b.get("gesperrt"))
    offen = sum(max(int(e.get("menge") or 0) - int(e.get("menge_erhalten") or 0), 0) for e in erwartet)
    return {"im_lager": im_lager, "gesperrt": gesperrt, "erwartet_offen": offen, "vollstaendig": offen == 0 and gesperrt == 0 and im_lager > 0}


def zaehlen_plus(positionen, schluessel, anzahl=1):
    """Stückscan in der Inventur: erste Position, deren lagerbestand/seriennummer/ean zum Schlüssel passt, um anzahl erhöhen.
    → (position_name, neues_ist) oder (None, None)."""
    k = str(schluessel or "").strip().lower()
    if not k:
        return None, None
    for feld in ("lagerbestand", "seriennummer", "ean"):
        for p in positionen:
            if str(p.get(feld) or "").strip().lower() == k:
                neu = int(p.get("ist") or 0) + int(anzahl)
                if neu < 0:
                    neu = 0
                return p.get("name"), neu
    return None, None
