"""Skonto auf Ausgangsrechnungen – ohne Frappe.

Skonto ist eine nachträgliche Entgeltsminderung (§ 16 Abs 1 UStG): Bemessungsgrundlage und USt werden im
Voranmeldungszeitraum der Zahlung berichtigt (UVA: negativ im Monat der Zahlung), aufgeteilt nach Steuersätzen
der Rechnung (uva.skonto_aufteilen). Skonto gilt nur bei Zahlung bis zum Skontodatum und nur auf den Betrag,
den der Kunde tatsächlich schuldet (zahlbar nach Anzahlungsverrechnung).
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal


def skonto_bis(rechnungsdatum: date, skonto_tage: int) -> date | None:
    if not rechnungsdatum or not int(skonto_tage or 0):
        return None
    return rechnungsdatum + timedelta(days=int(skonto_tage))


def skonto_betrag(zahlbar_cent: int, skonto_promille: int) -> int:
    """skonto_promille: echte Promille (20 = 2 %, wie PH Zahlungsbedingung)."""
    if int(zahlbar_cent or 0) <= 0 or int(skonto_promille or 0) <= 0:
        return 0
    return int((Decimal(int(zahlbar_cent)) * Decimal(int(skonto_promille)) / Decimal(1000)).quantize(Decimal(1), ROUND_HALF_UP))


def skonto_pruefen(offen_cent: int, gezahlt_cent: int, zahlbar_cent: int, skonto_promille: int, skonto_bis_datum: date | None, zahlungsdatum: date, toleranz_cent: int = 100) -> dict:
    """Ist die Differenz zwischen offen und gezahlt als Skonto zulässig?

    → {"zulaessig": bool, "skonto_cent": int, "grund": str}. Toleranz: Kunde zieht aus Rundung bis zu 1 € mehr/weniger ab.
    """
    differenz = int(offen_cent) - int(gezahlt_cent)
    if differenz <= 0:
        return {"zulaessig": False, "skonto_cent": 0, "grund": "keine Differenz"}
    if not skonto_bis_datum or not int(skonto_promille or 0):
        return {"zulaessig": False, "skonto_cent": 0, "grund": "kein Skonto vereinbart"}
    if zahlungsdatum > skonto_bis_datum:
        return {"zulaessig": False, "skonto_cent": 0, "grund": f"Skontofrist am {skonto_bis_datum:%d.%m.%Y} abgelaufen"}
    soll = skonto_betrag(zahlbar_cent, skonto_promille)
    if differenz > soll + int(toleranz_cent):
        return {"zulaessig": False, "skonto_cent": 0, "grund": f"Abzug {differenz} ct übersteigt Skonto {soll} ct"}
    return {"zulaessig": True, "skonto_cent": differenz, "grund": "Skonto innerhalb der Frist"}
