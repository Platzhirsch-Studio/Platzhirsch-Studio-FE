"""Bestellübermittlung an Hersteller: Adapter-Schnittstelle (Basisklasse + Registry) und Exportformate.

Reine Logik ohne Frappe (Tests: ph_sortiment/tests/test_uebermittlung.py). PH Herstellerbestellung.exportieren()
baut ein dict der Bestellung, ruft `exportieren(adapter, bestellung, absender, lieferant)` und legt das Ergebnis als
**privaten Anhang** ab. Es gibt **keine echte Übertragung** (kein IWOfurn-/EDI-Zugang im Repo); der Status
„Uebermittelt“ wird gesetzt, wenn die Datei hochgeladen bzw. die Mail versendet ist.

Formate:
  - "E-Mail": PDF per Mail (PH Herstellerbestellung.per_email_senden) – kein Dateiexport hier.
  - "CSV": bisheriger Platzhalter `export_schnittstelle` (Spalten unverändert, kompatibel).
  - "IWOfurn": XML-Bestellsatz nach öffentlich beschriebenen Inhalten (Käufer/Lieferant-GLN, Kommission, Positionen
    mit Typnummer/Ausführung/Menge/Termin). **Unverifiziert – Struktur mit IWOfurn/Lieferant abstimmen.**
  - "EDI": EDIFACT ORDERS D.96A (EANCOM-ähnlich) generisch. **Unverifiziert – Subset mit Lieferant abstimmen.**
  - pCon-Basket-Rückweg: bewusst nicht gebaut (braucht echte pCon.basket-Exportdatei); generischer XML-Import
    ist über logik/preislisten_format.xml_lesen möglich.

bestellung (dict): name, datum, wunschtermin, kommission, waehrung, lieferadresse_text, notizen_lieferant,
  positionen [{idx, hersteller_artikelnr, ean, bezeichnung, ausfuehrung_text, menge, einheit, wunschtermin, kommission}]
absender (dict): firma, gln, strasse, plz, ort, land · lieferant (dict): firmenname, gln, kundennummer
"""

from datetime import date
from xml.sax.saxutils import escape

ADAPTER = {}


class AdapterFehler(ValueError):
    pass


def registrieren(cls):
    ADAPTER[cls.name] = cls()
    return cls


def adapter(name):
    if name not in ADAPTER:
        raise AdapterFehler("Unbekannter Übermittlungsweg {0}".format(name))
    return ADAPTER[name]


def adapter_fuer_bestellweg(bestellweg):
    """Bestellweg des Lieferanten (E-Mail/Portal/IWOfurn/pCon/EDI/Fax) → Adaptername."""
    return {"IWOfurn": "IWOfurn", "EDI": "EDI", "pCon": "CSV", "Portal": "CSV"}.get(bestellweg or "", "E-Mail")


def _d(v):
    if isinstance(v, date):
        return v
    return date.fromisoformat(str(v)[:10]) if v else None


def gln_gueltig(gln):
    """GS1-GLN: 13 Ziffern, Prüfziffer Modulo 10 (Gewichte 1/3 von rechts)."""
    s = str(gln or "").strip()
    if len(s) != 13 or not s.isdigit():
        return False
    summe = sum(int(z) * (3 if i % 2 == 0 else 1) for i, z in enumerate(reversed(s[:-1])))
    return (10 - summe % 10) % 10 == int(s[-1])


class BestellAdapter:
    """Basisklasse. erzeuge() → (dateiname, inhalt:str). datei=False: Adapter versendet selbst (E-Mail)."""

    name = ""
    label = ""
    endung = ""
    mime = "text/plain"
    datei = True
    verifiziert = False
    braucht_gln = False

    def pruefen(self, bestellung, absender, lieferant):
        fehler = []
        if not bestellung.get("positionen"):
            fehler.append("Bestellung ohne Positionen")
        for p in bestellung.get("positionen") or []:
            if int(p.get("menge") or 0) <= 0:
                fehler.append("Position {0}: Menge fehlt".format(p.get("idx")))
        if self.braucht_gln:
            if not gln_gueltig(absender.get("gln")):
                fehler.append("Eigene GLN fehlt/ungültig (PH Sortiment Einstellungen)")
            if not gln_gueltig(lieferant.get("gln")):
                fehler.append("GLN des Lieferanten fehlt/ungültig")
        return fehler

    def erzeuge(self, bestellung, absender, lieferant):
        raise NotImplementedError


@registrieren
class EmailAdapter(BestellAdapter):
    name, label, datei, verifiziert = "E-Mail", "E-Mail mit PDF", False, True


@registrieren
class CsvAdapter(BestellAdapter):
    name, label, endung, mime, verifiziert = "CSV", "CSV (IWOfurn/pCon-Platzhalter)", "csv", "text/csv", True

    def erzeuge(self, bestellung, absender, lieferant):
        zeilen = ["pos;hersteller_artikelnr;bezeichnung;ausfuehrung;menge;wunschtermin;kommission"]
        for p in bestellung["positionen"]:
            zeilen.append(";".join(str(x or "") for x in (p.get("idx"), p.get("hersteller_artikelnr"), p.get("bezeichnung"), p.get("ausfuehrung_text"), p.get("menge"), p.get("wunschtermin"), p.get("kommission"))))
        return f"{bestellung['name']}-csv.csv", "﻿" + "\r\n".join(zeilen) + "\r\n"


@registrieren
class IwofurnAdapter(BestellAdapter):
    """UNVERIFIZIERT – Struktur mit IWOfurn/Lieferant abstimmen."""

    name, label, endung, mime, braucht_gln = "IWOfurn", "IWOfurn-Bestellung (XML, unverifiziert)", "xml", "application/xml", True

    def erzeuge(self, bestellung, absender, lieferant):
        e = lambda v: escape(str(v if v is not None else ""))  # noqa: E731
        pos = []
        for p in bestellung["positionen"]:
            pos.append(
                f'  <Position Nr="{e(p.get("idx"))}"><TypNr>{e(p.get("hersteller_artikelnr"))}</TypNr><EAN>{e(p.get("ean"))}</EAN>'
                f'<Text>{e(p.get("bezeichnung"))}</Text><Ausfuehrung>{e(p.get("ausfuehrung_text"))}</Ausfuehrung>'
                f'<Menge Einheit="{e(p.get("einheit") or "Stk")}">{e(p.get("menge"))}</Menge><Wunschtermin>{e(p.get("wunschtermin"))}</Wunschtermin>'
                f'<Kommission>{e(p.get("kommission") or bestellung.get("kommission"))}</Kommission></Position>'
            )
        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<!-- UNVERIFIZIERT: Platzhirsch-Bestellsatz für IWOfurn, Struktur mit IWOfurn/Lieferant abstimmen -->\n'
            f'<Bestellung Nummer="{e(bestellung["name"])}" Datum="{e(bestellung.get("datum"))}" Waehrung="{e(bestellung.get("waehrung") or "EUR")}">\n'
            f'  <Kaeufer GLN="{e(absender.get("gln"))}" Kundennummer="{e(lieferant.get("kundennummer"))}">{e(absender.get("firma"))}</Kaeufer>\n'
            f'  <Lieferant GLN="{e(lieferant.get("gln"))}">{e(lieferant.get("firmenname"))}</Lieferant>\n'
            f'  <Lieferadresse>{e(bestellung.get("lieferadresse_text"))}</Lieferadresse>\n'
            f'  <Kommission>{e(bestellung.get("kommission"))}</Kommission><Wunschtermin>{e(bestellung.get("wunschtermin"))}</Wunschtermin>\n'
            f'  <Hinweis>{e(bestellung.get("notizen_lieferant"))}</Hinweis>\n'
            + "\n".join(pos)
            + "\n</Bestellung>\n"
        )
        return f"{bestellung['name']}-iwofurn.xml", xml


def edi_escape(text):
    """EDIFACT-Freigabezeichen ? vor ' + : ? ; Zeilenumbrüche raus; max. 35 Zeichen je Datenelement."""
    s = " ".join(str(text or "").split())[:35]
    for z in ("?", "'", "+", ":"):
        s = s.replace(z, "?" + z)
    return s


def _edi_datum(v):
    d = _d(v)
    return d.strftime("%Y%m%d") if d else None


@registrieren
class EdiOrdersAdapter(BestellAdapter):
    """EDIFACT ORDERS D.96A, generisch (EANCOM-nah). UNVERIFIZIERT – Subset mit dem Lieferanten abstimmen."""

    name, label, endung, mime, braucht_gln = "EDI", "EDIFACT ORDERS (unverifiziert)", "edi", "application/edifact", True

    def erzeuge(self, bestellung, absender, lieferant, jetzt=None):
        jetzt = jetzt or date.today()
        ref = "".join(c for c in bestellung["name"] if c.isalnum())[-14:] or "1"
        seg = [
            "UNH+1+ORDERS:D:96A:UN:EAN008",
            f"BGM+220+{edi_escape(bestellung['name'])}+9",
            f"DTM+137:{_edi_datum(bestellung.get('datum')) or jetzt.strftime('%Y%m%d')}:102",
        ]
        if _edi_datum(bestellung.get("wunschtermin")):
            seg.append(f"DTM+2:{_edi_datum(bestellung['wunschtermin'])}:102")
        if bestellung.get("kommission"):
            seg.append(f"RFF+CR:{edi_escape(bestellung['kommission'])}")
        seg += [f"NAD+BY+{absender.get('gln')}::9", f"NAD+SU+{lieferant.get('gln')}::9"]
        if lieferant.get("kundennummer"):
            seg.append(f"RFF+IA:{edi_escape(lieferant['kundennummer'])}")
        if bestellung.get("lieferadresse_text"):
            teile = [edi_escape(t) for t in str(bestellung["lieferadresse_text"]).splitlines() if t.strip()][:4]
            seg.append("NAD+DP+++" + ":".join(teile))
        seg.append(f"CUX+2:{bestellung.get('waehrung') or 'EUR'}:9")
        for p in bestellung["positionen"]:
            lin = f"LIN+{p.get('idx')}"
            if p.get("ean"):
                lin += f"++{edi_escape(p['ean'])}:SRV"
            seg.append(lin)
            if p.get("hersteller_artikelnr"):
                seg.append(f"PIA+1+{edi_escape(p['hersteller_artikelnr'])}:SA")
            seg.append(f"IMD+F++:::{edi_escape(p.get('bezeichnung'))}")
            if p.get("ausfuehrung_text"):
                seg.append(f"IMD+F+35+:::{edi_escape(p['ausfuehrung_text'])}")
            seg.append(f"QTY+21:{int(p.get('menge') or 0)}")
            if _edi_datum(p.get("wunschtermin")):
                seg.append(f"DTM+2:{_edi_datum(p['wunschtermin'])}:102")
        seg += ["UNS+S", f"CNT+2:{len(bestellung['positionen'])}"]
        seg.append(f"UNT+{len(seg) + 1}+1")
        kopf = ["UNA:+.? '", f"UNB+UNOC:3+{absender.get('gln')}:14+{lieferant.get('gln')}:14+{jetzt.strftime('%y%m%d')}:0000+{ref}"]
        fuss = [f"UNZ+1+{ref}"]
        return f"{bestellung['name']}-orders.edi", kopf[0] + "\n" + "'\n".join(kopf[1:] + seg + fuss) + "'\n"


def exportieren(name, bestellung, absender, lieferant):
    """→ {dateiname, inhalt, mime, verifiziert, hinweis}. Wirft AdapterFehler mit allen Prüffehlern."""
    a = adapter(name)
    if not a.datei:
        raise AdapterFehler("{0} erzeugt keine Datei – bitte „Per E-Mail senden“.".format(a.label))
    fehler = a.pruefen(bestellung, absender, lieferant)
    if fehler:
        raise AdapterFehler("; ".join(fehler))
    dateiname, inhalt = a.erzeuge(bestellung, absender, lieferant)
    return {"dateiname": dateiname, "inhalt": inhalt, "mime": a.mime, "verifiziert": a.verifiziert, "hinweis": None if a.verifiziert else "Format unverifiziert – mit Lieferant/IWOfurn abstimmen, bevor es produktiv genutzt wird."}


UEBERGAENGE = {
    None: {"Vorbereitet", "Exportiert", "Uebermittelt", "Fehler"},
    "": {"Vorbereitet", "Exportiert", "Uebermittelt", "Fehler"},
    "Vorbereitet": {"Exportiert", "Uebermittelt", "Fehler"},
    "Exportiert": {"Exportiert", "Uebermittelt", "Fehler"},
    "Uebermittelt": {"Bestaetigt", "Fehler", "Uebermittelt"},
    "Fehler": {"Vorbereitet", "Exportiert", "Uebermittelt", "Fehler"},
    "Bestaetigt": {"Bestaetigt"},
}


def uebermittlung_erlaubt(von, nach):
    return nach in UEBERGAENGE.get(von, set())


# ── AB-Merker je Position ────────────────────────────────────────────────

MERKER_FERTIG = ("bestaetigt", "geklaert")


def ab_merker(ab_vorhanden, zeilen):
    """Merker einer Position: offen (keine AB) · abweichung (Protokollzeile offen/pruefen) · geklaert (alle Zeilen
    ok/abgelehnt bewertet) · bestaetigt (AB ohne Abweichung)."""
    if not ab_vorhanden:
        return "offen"
    if not zeilen:
        return "bestaetigt"
    if any((z.get("bewertung") or "offen") in ("offen", "pruefen") for z in zeilen):
        return "abweichung"
    return "geklaert"


def ab_vollstaendig(merker):
    """AB vollständig, wenn jede aktive Position bestätigt oder geklärt ist."""
    merker = list(merker)
    return bool(merker) and all(m in MERKER_FERTIG for m in merker)
