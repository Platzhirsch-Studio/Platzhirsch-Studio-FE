"""Export an den Steuerberater: BMD-CSV (NTCS Buchungsimport) und DATEV-Buchungsstapel (EXTF 700).

Eingabe sind Buchungszeilen (dict), die der Export-Lauf aus den Belegen bildet:
  {beleg_doctype, beleg, nummer, datum (date), kontakt_name, konto (Debitor/Kreditor),
   gegenkonto (Erlös-/Aufwandskonto), steuercode, satz_promille, netto_cent, ust_cent, brutto_cent,
   soll_haben ('S' Ausgangsrechnung, 'H' Gutschrift/Eingangsrechnung), text, leistungsdatum, uid}

Je Beleg eine Zeile pro USt-Satz (Aufteilung) – der Steuerberater bucht Debitor an Erlös + USt.
Alle Zeilen erhalten eine SHA-256-Prüfsumme (gekürzt) für das Übergabeprotokoll; die Datei eine Gesamtprüfsumme.

BMD-Spalten (Standard „Buchungen“ Textimport, Semikolon, ANSI/UTF-8 laut Kanzlei-Vorgabe):
  satzart;konto;gkonto;belegnr;belegdatum;buchsymbol;buchcode;prozent;steuercode;betrag;steuer;text;
  leistungsdatum;uid;extbelegnr
DATEV-Spalten (EXTF, Version 700, Formatkategorie 21 Buchungsstapel):
  Umsatz (ohne Soll/Haben-Kz);Soll/Haben-Kennzeichen;WKZ Umsatz;Kurs;Basis-Umsatz;WKZ Basis-Umsatz;
  Konto;Gegenkonto (ohne BU-Schlüssel);BU-Schlüssel;Belegdatum;Belegfeld 1;Belegfeld 2;Skonto;Buchungstext;…
Steuerschlüssel (mit Kanzlei abstimmen): BMD 1=20 %, 2=10 %, 3=13 %, 0=steuerfrei; DATEV BU 3=19 % (DE),
Österreich-Mandanten nutzen kanzleispezifische Schlüssel – Platzhalter in STEUERCODES_DATEV.
"""

import csv
import hashlib
import io
from decimal import Decimal

STEUERCODES_BMD = {2000: "1", 1000: "2", 1300: "3", 0: "0"}
STEUERCODES_DATEV = {2000: "", 1000: "", 1300: "", 0: ""}  # Kanzlei liefert die BU-Schlüssel (AT-Kontenrahmen)


def euro(cent, dezimal=","):
    d = Decimal(int(cent or 0)) / Decimal(100)
    s = f"{d:.2f}"
    return s.replace(".", dezimal) if dezimal != "." else s


def datum_ddmmyyyy(d):
    return f"{d.day:02d}.{d.month:02d}.{d.year}" if d else ""


def datum_ddmm(d):
    return f"{d.day:02d}{d.month:02d}" if d else ""


def zeilen_pruefsumme(z):
    roh = "|".join(str(z.get(k) or "") for k in ("beleg_doctype", "beleg", "nummer", "datum", "konto", "gegenkonto", "satz_promille", "netto_cent", "ust_cent", "brutto_cent", "soll_haben"))
    return hashlib.sha256(roh.encode()).hexdigest()[:16]


def gesamt_pruefsumme(inhalt):
    return hashlib.sha256(inhalt.encode("utf-8")).hexdigest()


def _csv(rows, delimiter=";"):
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=delimiter, quoting=csv.QUOTE_MINIMAL, lineterminator="\r\n")
    for r in rows:
        w.writerow(r)
    return buf.getvalue()


def bmd_csv(zeilen, buchsymbol_ar="AR", buchsymbol_er="ER"):
    """BMD NTCS Buchungsimport. Betrag = brutto, Steuer = USt, prozent = Satz. Rückgabe (text, pruefsumme)."""
    rows = [["satzart", "konto", "gkonto", "belegnr", "belegdatum", "buchsymbol", "buchcode", "prozent", "steuercode", "betrag", "steuer", "text", "leistungsdatum", "uid", "extbelegnr", "pruefsumme"]]
    for z in zeilen:
        ist_er = z.get("beleg_doctype") == "PH Eingangsrechnung"
        symbol = buchsymbol_er if ist_er else buchsymbol_ar
        prozent = f"{Decimal(int(z.get('satz_promille') or 0)) / 100:.1f}".replace(".", ",")
        betrag = int(z.get("brutto_cent") or 0)
        if z.get("soll_haben") == "H" and not ist_er:
            betrag = -betrag  # Gutschrift mindert Debitor
        rows.append([
            "0",
            z.get("konto") or "",
            z.get("gegenkonto") or "",
            z.get("nummer") or z.get("beleg") or "",
            datum_ddmmyyyy(z.get("datum")),
            symbol,
            "1",
            prozent,
            z.get("steuercode") if z.get("steuercode") is not None else STEUERCODES_BMD.get(int(z.get("satz_promille") or 0), "0"),
            euro(betrag),
            euro(int(z.get("ust_cent") or 0) * (-1 if betrag < 0 else 1)),
            (z.get("text") or "")[:60],
            datum_ddmmyyyy(z.get("leistungsdatum")),
            z.get("uid") or "",
            z.get("extbelegnr") or "",
            zeilen_pruefsumme(z),
        ])
    text = _csv(rows)
    return text, gesamt_pruefsumme(text)


def datev_buchungsstapel(zeilen, berater_nr, mandanten_nr, von, bis, wj_beginn, sachkontenlaenge=4, bezeichnung="PH Faktura", erzeugt=None):
    """DATEV-Format EXTF (Version 700). Rückgabe (text, pruefsumme). Umsatz immer positiv mit S/H."""
    import datetime as _dt

    erzeugt = erzeugt or _dt.datetime.now()
    header = [
        "EXTF", "700", "21", "Buchungsstapel", "12", erzeugt.strftime("%Y%m%d%H%M%S000"), "", "PH", "", "",
        str(berater_nr or ""), str(mandanten_nr or ""), wj_beginn.strftime("%Y%m%d"), str(sachkontenlaenge),
        von.strftime("%Y%m%d"), bis.strftime("%Y%m%d"), bezeichnung[:30], "", "1", "0", "0", "EUR", "", "", "", "", "", "", "", "", "", "",
    ]
    spalten = [
        "Umsatz (ohne Soll/Haben-Kz)", "Soll/Haben-Kennzeichen", "WKZ Umsatz", "Kurs", "Basis-Umsatz", "WKZ Basis-Umsatz",
        "Konto", "Gegenkonto (ohne BU-Schlüssel)", "BU-Schlüssel", "Belegdatum", "Belegfeld 1", "Belegfeld 2", "Skonto",
        "Buchungstext", "Postensperre", "Diverse Adressnummer", "Geschäftspartnerbank", "Sachverhalt", "Zinssperre",
        "Beleglink", "Beleginfo - Art 1", "Beleginfo - Inhalt 1", "Beleginfo - Art 2", "Beleginfo - Inhalt 2",
        "Leistungsdatum", "EU-Land u. UStID", "EU-Steuersatz", "Prüfsumme PH",
    ]
    rows = [header, spalten]
    for z in zeilen:
        betrag = int(z.get("brutto_cent") or 0)
        sh = z.get("soll_haben") or "S"
        rows.append([
            euro(abs(betrag)), sh, "EUR", "", "", "",
            z.get("konto") or "", z.get("gegenkonto") or "",
            z.get("steuercode") if z.get("steuercode") is not None else STEUERCODES_DATEV.get(int(z.get("satz_promille") or 0), ""),
            datum_ddmm(z.get("datum")), (z.get("nummer") or z.get("beleg") or "")[:36], "", "",
            (z.get("text") or "")[:60], "", "", "", "", "",
            "", "Beleg", (z.get("beleg") or "")[:36], "USt-Satz", f"{Decimal(int(z.get('satz_promille') or 0)) / 100:.1f}".replace(".", ","),
            z.get("leistungsdatum").strftime("%d%m%Y") if z.get("leistungsdatum") else "",
            z.get("uid") or "", f"{Decimal(int(z.get('satz_promille') or 0)) / 100:.2f}".replace(".", ",") if z.get("uid") else "",
            zeilen_pruefsumme(z),
        ])
    text = _csv(rows)
    return text, gesamt_pruefsumme(text)


def csv_generisch(zeilen):
    rows = [["belegart", "beleg", "nummer", "datum", "kunde_lieferant", "konto", "gegenkonto", "satz_promille", "netto_cent", "ust_cent", "brutto_cent", "soll_haben", "text", "pruefsumme"]]
    for z in zeilen:
        rows.append([z.get("beleg_doctype"), z.get("beleg"), z.get("nummer"), z.get("datum").isoformat() if z.get("datum") else "", z.get("kontakt_name"), z.get("konto"), z.get("gegenkonto"),
                     z.get("satz_promille"), z.get("netto_cent"), z.get("ust_cent"), z.get("brutto_cent"), z.get("soll_haben"), z.get("text"), zeilen_pruefsumme(z)])
    text = _csv(rows)
    return text, gesamt_pruefsumme(text)


def protokoll_csv(zeilen):
    """Übergabeprotokoll je Beleg (eine Zeile je Beleg, Beträge summiert)."""
    je_beleg = {}
    for z in zeilen:
        e = je_beleg.setdefault(z.get("beleg"), {"beleg_doctype": z.get("beleg_doctype"), "beleg": z.get("beleg"), "nummer": z.get("nummer"), "datum": z.get("datum"), "kontakt_name": z.get("kontakt_name"), "netto_cent": 0, "ust_cent": 0, "brutto_cent": 0, "pruefsummen": []})
        e["netto_cent"] += int(z.get("netto_cent") or 0)
        e["ust_cent"] += int(z.get("ust_cent") or 0)
        e["brutto_cent"] += int(z.get("brutto_cent") or 0)
        e["pruefsummen"].append(zeilen_pruefsumme(z))
    rows = [["belegart", "beleg", "nummer", "datum", "kunde_lieferant", "netto", "ust", "brutto", "pruefsumme"]]
    protokoll = []
    for e in je_beleg.values():
        ps = hashlib.sha256("".join(e["pruefsummen"]).encode()).hexdigest()[:16]
        e["pruefsumme"] = ps
        protokoll.append(e)
        rows.append([e["beleg_doctype"], e["beleg"], e["nummer"], datum_ddmmyyyy(e["datum"]), e["kontakt_name"], euro(e["netto_cent"]), euro(e["ust_cent"]), euro(e["brutto_cent"]), ps])
    return _csv(rows), protokoll


def erzeuge(format_name, zeilen, **kw):
    if format_name == "BMD CSV":
        return bmd_csv(zeilen)
    if format_name == "DATEV Buchungsstapel":
        return datev_buchungsstapel(zeilen, **kw)
    return csv_generisch(zeilen)
