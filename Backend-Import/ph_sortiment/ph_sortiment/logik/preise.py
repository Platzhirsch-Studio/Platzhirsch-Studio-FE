"""Preis mit Stand (Inhaber-Entscheidungen Nr. 26/27, src/lib/katalog/schema.js PREIS_ARTEN).

Regeln, die die Website heute im Code hat und die das Backoffice übernimmt:
  - Verkaufspreis: höchstens 3 Monate alt (stand), UVP/Herstellerpreis: höchstens 6 Monate.
  - Nie schätzen: ohne Quelle + Stand kein Preis (freigegeben = 0 → nicht anzeigen).
  - Der gültige Preis ist der jüngste freigegebene Eintrag mit ab ≤ heute; bei gleichem ab
    gewinnt der jüngere Stand. Alte Einträge bleiben als Historie stehen.
  - Beträge immer Cent (Int). Umrechnung aus Euro-Float nur beim Import (to_cent, kaufmännisch).
"""

from datetime import date
from decimal import ROUND_HALF_UP, Decimal

MAX_MONATE = {"Verkaufspreis": 3, "Angebot": 3, "UVP": 6, "Herstellerpreis": 6}


def to_cent(betrag):
    """79.9 → 7990, '2.490,00' → 249000, None → None. Kaufmännisch gerundet."""
    if betrag is None or betrag == "":
        return None
    if isinstance(betrag, str):
        s = betrag.strip().replace("€", "").replace(" ", "")
        if "," in s and "." in s:
            s = s.replace(".", "").replace(",", ".")
        elif "," in s:
            s = s.replace(",", ".")
        betrag = s
    return int((Decimal(str(betrag)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def plus_monate(d, n):
    """Datum + n Monate (Tag bleibt, Monatsende wird gekappt) – wie schema.js plusMonate."""
    monat = d.month - 1 + n
    jahr = d.year + monat // 12
    monat = monat % 12 + 1
    tag = d.day
    while True:
        try:
            return date(jahr, monat, tag)
        except ValueError:
            tag -= 1


def _datum(v):
    if isinstance(v, date):
        return v
    if not v:
        return None
    return date.fromisoformat(str(v)[:10])


def gueltig_bis(stand, preisart, max_monate=None):
    """Letzter Anzeigetag eines Preises (stand + Höchstalter der Art)."""
    stand = _datum(stand)
    if not stand:
        return None
    monate = (max_monate or {}).get(preisart) or MAX_MONATE.get(preisart, 3)
    return plus_monate(stand, monate)


def veraltet(stand, preisart, heute=None, max_monate=None):
    bis = gueltig_bis(stand, preisart, max_monate)
    heute = _datum(heute) or date.today()
    return bis is None or bis < heute


def gueltiger_preis(preise, heute=None, ausfuehrung=None, max_monate=None, nur_freigegeben=True):
    """Aus einer Liste von Preiszeilen (dicts oder Objekte mit ab, brutto_cent, preisart, stand,
    freigegeben, ausfuehrung) den gültigen Eintrag wählen, sonst None.

    ausfuehrung: None = Grundpreis des Produkts (Zeilen ohne ausfuehrung); sonst Zeilen dieser
    Ausführung, mit Rückfall auf den Grundpreis.
    """
    heute = _datum(heute) or date.today()

    def wert(z, k):
        return z.get(k) if isinstance(z, dict) else getattr(z, k, None)

    def kandidaten(ausf):
        out = []
        for z in preise or []:
            if nur_freigegeben and not int(wert(z, "freigegeben") or 0):
                continue
            if (wert(z, "ausfuehrung") or None) != ausf:
                continue
            ab = _datum(wert(z, "ab"))
            if not ab or ab > heute:
                continue
            if veraltet(wert(z, "stand"), wert(z, "preisart"), heute, max_monate):
                continue
            out.append((ab, _datum(wert(z, "stand")) or ab, z))
        out.sort(key=lambda t: (t[0], t[1]))
        return out[-1][2] if out else None

    if ausfuehrung:
        treffer = kandidaten(ausfuehrung)
        if treffer:
            return treffer
    return kandidaten(None)


def ab_preis_cent(preise, heute=None, max_monate=None):
    """Kleinster gültiger Preis über alle Ausführungen („ab € …“), sonst None."""
    heute = _datum(heute) or date.today()
    werte = []
    ausfuehrungen = {(z.get("ausfuehrung") if isinstance(z, dict) else getattr(z, "ausfuehrung", None)) or None for z in preise or []}
    for a in ausfuehrungen:
        z = gueltiger_preis(preise, heute, a, max_monate)
        if z is not None:
            werte.append(int(z.get("brutto_cent") if isinstance(z, dict) else z.brutto_cent))
    return min(werte) if werte else None


def abweichung_prozent(alt_cent, neu_cent):
    """Prozentuale Abweichung neu zu alt (gerundet auf 1 Nachkommastelle); None ohne Altwert."""
    if not alt_cent:
        return None
    return round((int(neu_cent) - int(alt_cent)) * 100.0 / int(alt_cent), 1)


def preisliste_zeilen_pruefen(zeilen, schwelle_prozent=15):
    """Markiert Zeilen einer Preisliste: abweichung_prozent, hinweis, uebernehmen (0 über Schwelle oder ohne Produkt).
    Gibt (anzahl, auffaellig) zurück. zeilen: dicts mit produkt, alt_cent, neu_cent."""
    auffaellig = 0
    for z in zeilen:
        z["abweichung_prozent"] = abweichung_prozent(z.get("alt_cent"), z.get("neu_cent"))
        hinweise = []
        if not z.get("produkt"):
            hinweise.append("kein Produkt zugeordnet")
            z["uebernehmen"] = 0
        if not z.get("neu_cent"):
            hinweise.append("kein neuer Preis")
            z["uebernehmen"] = 0
        p = z["abweichung_prozent"]
        if p is not None and abs(p) > schwelle_prozent:
            hinweise.append(f"Abweichung {p:+.1f} % über Schwelle {schwelle_prozent} %")
            z["uebernehmen"] = 0
            auffaellig += 1
        if z.get("alt_cent") is None and z.get("produkt"):
            hinweise.append("erster Preis")
        z["hinweis"] = "; ".join(hinweise)
    return len(zeilen), auffaellig


def monate_alt(stand, heute=None):
    """Alter eines Preisstands in ganzen Monaten (für Reports)."""
    stand = _datum(stand)
    heute = _datum(heute) or date.today()
    if not stand:
        return None
    return (heute.year - stand.year) * 12 + heute.month - stand.month - (1 if heute.day < stand.day else 0)


def stichtag_monate(n, heute=None):
    """Datum vor n Monaten (Report „Preisstand älter als 3 Monate“)."""
    heute = _datum(heute) or date.today()
    return plus_monate(heute, -n)


def tage_bis(d, heute=None):
    d = _datum(d)
    heute = _datum(heute) or date.today()
    return (d - heute).days if d else None
