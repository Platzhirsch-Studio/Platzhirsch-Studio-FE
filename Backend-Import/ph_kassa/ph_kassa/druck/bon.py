"""80-mm-Bon aus einem Kassenbeleg: Zeilenmodell → ESC/POS-Bytes oder Klartext (Vorschau) – ohne Frappe.

Pflichtangaben § 132a Abs 3 BAO + RKSV § 11: Bezeichnung des Unternehmers, fortlaufende Nummer,
Tag der Ausstellung (Datum/Uhrzeit), Menge und handelsübliche Bezeichnung, Betrag, Kassenidentifikations-
nummer, Betrag je Steuersatz, maschinenlesbarer Code (QR = Payload + Signatur), bei Trainings-/Stornobeleg
die Kennzeichnung. Quelle: PLAN.md WP10a/b.

Eingabe `beleg` ist ein einfaches dict (Felder wie PH Kassenbeleg, WP10a):
  belegnummer, kassen_id (Kasse), datum_uhrzeit (str/datetime), belegart, trainings, storno_von,
  positionen[{menge, bezeichnung, einzel_brutto_cent, brutto_cent, steuersatz}],
  je_satz{steuersatz: {netto_cent, ust_cent, brutto_cent}} (oder wird aus Positionen gebildet),
  gesamt_cent, zahlarten[{zahlart, betrag_cent, gegeben_cent, retour_cent}],
  maschinenlesbarer_code, see_ausgefallen, bediener_name, kunde_name, kundenbeleg_hinweis
`firma`: firmenname, strasse, plz, ort, uid, telefon, email, website · `einst`: bon_kopfzeile, bon_fusstext, bon_breite_zeichen
"""

from __future__ import annotations

from datetime import datetime

from ..logik.betraege import STEUERSATZ_KURZ, format_betrag, summen
from .escpos import EscPos, links_rechts_text, umbrechen, zentriert

ZAHLART_LABEL = {
    "Bar": "Bar",
    "Karte Stripe Terminal": "Karte",
    "Karte extern": "Karte",
    "Gutschein": "Gutschein",
    "Ueberweisung": "Überweisung",
}

BELEGART_TITEL = {
    "Standard": "KASSENBELEG",
    "Startbeleg": "STARTBELEG",
    "Nullbeleg": "NULLBELEG",
    "Monatsbeleg": "MONATSBELEG",
    "Jahresbeleg": "JAHRESBELEG",
    "Schlussbeleg": "SCHLUSSBELEG",
    "Sammelbeleg": "SAMMELBELEG",
    "Stornobeleg": "STORNOBELEG",
    "Trainingsbeleg": "TRAININGSBELEG",
}


def _datum(wert) -> str:
    if not wert:
        return ""
    if isinstance(wert, datetime):
        return wert.strftime("%d.%m.%Y %H:%M")
    s = str(wert)
    try:
        return datetime.fromisoformat(s[:19]).strftime("%d.%m.%Y %H:%M")
    except ValueError:
        return s


def _menge(m) -> str:
    try:
        f = float(m)
    except (TypeError, ValueError):
        return str(m or "1")
    return str(int(f)) if f == int(f) else f"{f:g}".replace(".", ",")


def bon_zeilen(beleg: dict, firma: dict, einst: dict | None = None) -> list[tuple]:
    """Zeilenmodell: [(art, *daten)] mit art ∈ wortmarke, titel, text, mitte, lr, linie, leer, qr, gross, hinweis."""
    einst = einst or {}
    z: list[tuple] = []
    trainings = bool(int(beleg.get("trainings") or 0)) or beleg.get("belegart") == "Trainingsbeleg"
    storno = beleg.get("belegart") == "Stornobeleg" or bool(beleg.get("storno_von"))

    z.append(("wortmarke", "PLATZHIRSCH"))
    z.append(("mitte", firma.get("kurzname") or "Home Living"))
    z.append(("mitte", firma.get("firmenname") or ""))
    z.append(("mitte", f"{firma.get('strasse') or ''}, {firma.get('plz') or ''} {firma.get('ort') or ''}".strip(", ")))
    if firma.get("uid"):
        z.append(("mitte", f"UID {firma['uid']}"))
    if einst.get("bon_kopfzeile"):
        z.append(("mitte", einst["bon_kopfzeile"]))
    z.append(("leer",))
    if trainings:
        z.append(("hinweis", "TRAINING – KEIN GÜLTIGER BELEG"))
    if storno:
        z.append(("hinweis", "STORNO" + (f" zu Beleg {beleg['storno_von']}" if beleg.get("storno_von") else "")))
    z.append(("titel", BELEGART_TITEL.get(beleg.get("belegart") or "Standard", "KASSENBELEG")))
    z.append(("lr", "Beleg-Nr.", str(beleg.get("belegnummer") or beleg.get("name") or "")))
    z.append(("lr", "Datum", _datum(beleg.get("datum_uhrzeit"))))
    z.append(("lr", "Kassen-ID", str(beleg.get("kassen_id") or beleg.get("kasse") or "")))
    if beleg.get("bediener_name"):
        z.append(("lr", "Bedienung", str(beleg["bediener_name"])))
    if beleg.get("kunde_name"):
        z.append(("lr", "Kunde", str(beleg["kunde_name"])))
    z.append(("linie",))

    positionen = beleg.get("positionen") or []
    for p in positionen:
        kurz = STEUERSATZ_KURZ.get(p.get("steuersatz") or "Normal 20", "")[:1]
        bez = str(p.get("bezeichnung") or p.get("produkt") or "Position")
        menge = _menge(p.get("menge") or 1)
        einzel = int(p.get("einzel_brutto_cent") or 0)
        brutto = int(p.get("brutto_cent") or 0)
        if float(p.get("menge") or 1) != 1:
            z.append(("text", bez))
            z.append(("lr", f"  {menge} x {format_betrag(einzel)}", f"{format_betrag(brutto)} {kurz}"))
        else:
            z.append(("lr", bez, f"{format_betrag(brutto)} {kurz}"))
        if p.get("zusatz"):
            z.append(("text", f"  {p['zusatz']}"))
    z.append(("linie",))

    gesamt = int(beleg.get("gesamt_cent") or 0)
    z.append(("gross", "SUMME", format_betrag(gesamt)))
    z.append(("leer",))

    je_satz = beleg.get("je_satz") or summen(positionen)["je_satz"]
    z.append(("lr", "Satz   Netto", "USt      Brutto"))
    for satz, s in je_satz.items():
        kurz = STEUERSATZ_KURZ.get(satz, satz)
        z.append(("satz", kurz, format_betrag(s["netto_cent"]), format_betrag(s["ust_cent"]), format_betrag(s["brutto_cent"])))
    z.append(("linie",))

    for za in beleg.get("zahlarten") or []:
        label = ZAHLART_LABEL.get(za.get("zahlart"), za.get("zahlart") or "")
        z.append(("lr", label, format_betrag(za.get("betrag_cent") or 0)))
        if za.get("zahlart") == "Bar" and int(za.get("retour_cent") or 0) > 0:
            z.append(("lr", "  Gegeben", format_betrag(za.get("gegeben_cent") or 0)))
            z.append(("lr", "  Rückgeld", format_betrag(za.get("retour_cent") or 0)))
        if za.get("zahlart") == "Gutschein" and za.get("gutschein_letzte4"):
            z.append(("text", f"  Gutschein ····{za['gutschein_letzte4']}"))
    z.append(("leer",))

    code = beleg.get("maschinenlesbarer_code")
    if code:
        z.append(("qr", code))
        if beleg.get("see_ausgefallen"):
            z.append(("hinweis", "Sicherheitseinrichtung ausgefallen"))
    else:
        z.append(("hinweis", "Beleg ohne Signatur (Entwurf)"))
    z.append(("leer",))
    if beleg.get("kundenbeleg_hinweis"):
        z.append(("text", beleg["kundenbeleg_hinweis"]))
    fuss = einst.get("bon_fusstext") or "Vielen Dank für Ihren Besuch."
    for t in str(fuss).splitlines():
        z.append(("mitte", t))
    if firma.get("website"):
        z.append(("mitte", firma["website"]))
    return z


def zu_escpos(zeilen: list[tuple], breite: int = 42, schublade: bool = False) -> bytes:
    """Zeilenmodell → ESC/POS-Bytes inkl. Schnitt."""
    p = EscPos(breite=breite).init()
    for art, *d in zeilen:
        if art == "wortmarke":
            p.zeile(d[0], "mitte", fett=True, groesse=2)
        elif art == "titel":
            p.leer(0)
            p.zeile(d[0], "mitte", fett=True)
        elif art == "mitte":
            for t in umbrechen(d[0], breite):
                p.zeile(t, "mitte")
        elif art == "text":
            for t in umbrechen(d[0], breite):
                p.zeile(t, "links")
        elif art == "lr":
            p.links_rechts(d[0], d[1])
        elif art == "satz":
            kurz, netto, ust, brutto = d
            p.links_rechts(f"{kurz:<7}{netto:>12}", f"{ust:>10}{brutto:>12}")
        elif art == "gross":
            p.ausrichtung("links").fett(True).groesse(2, 2)
            p.text(links_rechts_text(d[0], d[1], breite // 2))
            p.groesse(1, 1).fett(False)
        elif art == "linie":
            p.linie()
        elif art == "leer":
            p.leer(1)
        elif art == "qr":
            p.qr(d[0], modulgroesse=5, fehlerkorrektur="M")
        elif art == "hinweis":
            p.zeile(f"*** {d[0]} ***", "mitte", fett=True)
    p.vorschub(4).schneiden()
    if schublade:
        p.schublade()
    return p.bytes()


def zu_text(zeilen: list[tuple], breite: int = 42) -> str:
    """Zeilenmodell → Klartext (Vorschau rechts in der Kassa-Page, E-Mail-Textteil, Tests)."""
    out: list[str] = []
    for art, *d in zeilen:
        if art in ("wortmarke", "titel", "mitte"):
            out.extend(zentriert(t, breite) for t in umbrechen(d[0], breite))
        elif art == "text":
            out.extend(umbrechen(d[0], breite))
        elif art == "lr":
            out.append(links_rechts_text(d[0], d[1], breite))
        elif art == "satz":
            kurz, netto, ust, brutto = d
            out.append(links_rechts_text(f"{kurz:<7}{netto:>12}", f"{ust:>10}{brutto:>12}", breite))
        elif art == "gross":
            out.append(links_rechts_text(d[0], d[1], breite))
        elif art == "linie":
            out.append("-" * breite)
        elif art == "leer":
            out.append("")
        elif art == "qr":
            out.append(zentriert("[QR-Code]", breite))
            out.extend(umbrechen(d[0], breite))
        elif art == "hinweis":
            out.append(zentriert(f"*** {d[0]} ***", breite))
    return "\n".join(out)


def bon_bytes(beleg: dict, firma: dict, einst: dict | None = None, schublade: bool = False) -> bytes:
    einst = einst or {}
    breite = int(einst.get("bon_breite_zeichen") or 42)
    return zu_escpos(bon_zeilen(beleg, firma, einst), breite=breite, schublade=schublade)


def bon_text(beleg: dict, firma: dict, einst: dict | None = None) -> str:
    einst = einst or {}
    breite = int(einst.get("bon_breite_zeichen") or 42)
    return zu_text(bon_zeilen(beleg, firma, einst), breite=breite)
