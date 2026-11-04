"""Zahlen- und Satzformate ohne Frappe (testbar per unittest). Druckformate nutzen die Jinja-Hüllen
in ph_core/utils/druck.py (ph_betrag, ph_satz).

Konvention (CONVENTIONS.md 2): Geld als Int in Cent, Prozentsätze als Int ×100
(`ust_satz_promille`, 2000 = 20 %, 1000 = 10 %, 1300 = 13 %, 1950 = 19,5 %).
"""

from decimal import ROUND_HALF_UP, Decimal


def satz_text(promille, mit_prozent=True):
    """2000 → "20 %", 1950 → "19,5 %", 0 → "0 %", None → "" (mit_prozent=False: ohne Zeichen)."""
    if promille is None or promille == "":
        return ""
    p = Decimal(int(promille)) / Decimal(100)
    txt = f"{p:.2f}".rstrip("0").rstrip(".").replace(".", ",") if p != p.to_integral_value() else str(int(p))
    return f"{txt} %" if mit_prozent else txt


def satz_aus_prozent(prozent):
    """"20" / 20.0 / "19,5" → 2000 / 1950 (Eingabe aus Oberfläche oder Import)."""
    if prozent is None or prozent == "":
        return 0
    p = Decimal(str(prozent).replace(",", ".").replace("%", "").strip())
    return int((p * 100).to_integral_value(rounding=ROUND_HALF_UP))


def anteil_cent(betrag_cent, promille):
    """Anteil eines Cent-Betrags zu einem Satz ×100, kaufmännisch gerundet: anteil_cent(10000, 2000) → 2000."""
    if not betrag_cent or not promille:
        return 0
    return int((Decimal(int(betrag_cent)) * Decimal(int(promille)) / Decimal(10000)).to_integral_value(rounding=ROUND_HALF_UP))


def ust_aus_brutto_cent(brutto_cent, promille):
    """USt-Anteil in einem Bruttobetrag: 12000 bei 2000 → 2000."""
    if not brutto_cent or not promille:
        return 0
    b = Decimal(int(brutto_cent))
    netto = b * Decimal(10000) / (Decimal(10000) + Decimal(int(promille)))
    return int((b - netto).to_integral_value(rounding=ROUND_HALF_UP))


def betrag_text(cent, waehrung="EUR"):
    """Cent-Betrag → '1.234,50 €' (deutsches Format). None → ''."""
    if cent is None or cent == "":
        return ""
    vorzeichen = "-" if int(cent) < 0 else ""
    euro = abs(int(cent)) / 100
    s = f"{euro:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{vorzeichen}{s} €" if waehrung == "EUR" else f"{vorzeichen}{s} {waehrung}"
