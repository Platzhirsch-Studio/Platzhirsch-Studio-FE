"""CSV-Import von Plattform-Kennzahlen (Meta, Google Ads, Pinterest) ohne Frappe (Konzept Marketing L9).

Erkennt Trennzeichen (; , Tab), deutsche und englische Spaltennamen, Dezimalkomma; Kosten → Cent-Int.
→ (list[dict(datum, impressionen, klicks, kosten_cent)], list[Fehlertexte]).
"""

from __future__ import annotations

import csv
import io
import re
from datetime import date, datetime

SPALTEN = {
    "datum": ("datum", "date", "day", "tag", "reporting starts", "berichtsbeginn"),
    "impressionen": ("impressionen", "impressions", "impr.", "impr"),
    "klicks": ("klicks", "clicks", "link clicks", "link-klicks", "outbound clicks"),
    "kosten": ("kosten", "cost", "spend", "amount spent (eur)", "ausgegebener betrag (eur)", "betrag", "ausgaben"),
}
MAX_ZEILEN = 2000


def _zahl(text):
    t = str(text or "").strip().replace("€", "").replace("EUR", "").replace(" ", "").replace(" ", "")
    if not t or t in ("-", "--"):
        return 0.0
    if "," in t and "." in t:
        t = t.replace(".", "").replace(",", ".") if t.rfind(",") > t.rfind(".") else t.replace(",", "")
    elif "," in t:
        t = t.replace(",", ".")
    return float(t)


_TAUSENDER = re.compile(r"^\d{1,3}([.,]\d{3})+$")


def _ganz(text):
    """Ganzzahl-Spalten (Impressionen, Klicks): „1.234“ und „1,234“ sind Tausender, nicht Dezimal."""
    t = str(text or "").strip().replace(" ", "").replace(" ", "")
    if _TAUSENDER.match(t):
        return int(t.replace(".", "").replace(",", ""))
    return int(round(_zahl(t)))


def _datum(text):
    t = str(text or "").strip()[:10]
    for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(t, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Datum nicht lesbar: {text!r}")


def lesen(inhalt, standard_datum=None):
    if isinstance(inhalt, bytes):
        inhalt = inhalt.decode("utf-8-sig", "replace")
    inhalt = str(inhalt or "").lstrip("﻿")
    try:
        dialekt = csv.Sniffer().sniff(inhalt[:2048], delimiters=";,\t")
    except csv.Error:
        dialekt = csv.excel
    kopf = None
    zeilen, fehler = [], []
    for nr, row in enumerate(csv.reader(io.StringIO(inhalt), dialekt), start=1):
        if not any(c.strip() for c in row):
            continue
        if kopf is None:
            norm = [c.strip().lower() for c in row]
            kopf = {}
            for ziel, namen in SPALTEN.items():
                for i, c in enumerate(norm):
                    if c in namen and ziel not in kopf:
                        kopf[ziel] = i
            if not ({"kosten", "klicks", "impressionen"} & set(kopf)):
                return [], ["Kopfzeile ohne bekannte Spalten (Impressionen/Klicks/Kosten)"]
            continue
        if str(row[0]).strip().lower() in ("gesamt", "total", "summe"):
            continue
        if len(zeilen) >= MAX_ZEILEN:
            fehler.append(f"mehr als {MAX_ZEILEN} Zeilen – Rest ignoriert")
            break
        try:
            d = _datum(row[kopf["datum"]]) if "datum" in kopf else (standard_datum or date.today())
            zeilen.append({
                "datum": d.isoformat() if isinstance(d, date) else str(d),
                "impressionen": _ganz(row[kopf["impressionen"]]) if "impressionen" in kopf else 0,
                "klicks": _ganz(row[kopf["klicks"]]) if "klicks" in kopf else 0,
                "kosten_cent": int(round(_zahl(row[kopf["kosten"]]) * 100)) if "kosten" in kopf else 0,
            })
        except (ValueError, IndexError) as e:
            fehler.append(f"Zeile {nr}: {e}")
    return zeilen, fehler
