"""Tagesabschluss-Rechnung ohne Frappe: Soll aus Belegen, Zählprotokoll, Differenz, Sperre.

Quelle: PLAN.md WP10b (PH Kassenabschluss: Zählprotokoll, Soll/Ist, Differenzbuchung ins Kassenbuch,
Sperre der Belegerstellung nach Abschluss bis Öffnung).
"""

from __future__ import annotations

from .betraege import STUECKELUNG_CENT, KassenFehler

ABSCHLUSS_STATUS = ("Offen", "Gezaehlt", "Abgeschlossen", "Korrigiert")
GESPERRT_STATUS = ("Abgeschlossen",)  # nach Abschluss keine Belege bis zur Öffnung (Korrigiert = wieder offen)

KASSENBUCH_ARTEN = ("Anfangsbestand", "Einlage", "Entnahme", "Bareinnahme", "Barausgabe", "Differenz")
KASSENBUCH_VORZEICHEN = {"Anfangsbestand": 1, "Einlage": 1, "Entnahme": -1, "Bareinnahme": 1, "Barausgabe": -1, "Differenz": 1}


def bewegung_cent(art: str, betrag_cent: int) -> int:
    """Signierte Kassenbuch-Bewegung aus Art und (positivem) Betrag; Differenz darf negativ sein."""
    if art not in KASSENBUCH_ARTEN:
        raise KassenFehler(f"Unbekannte Kassenbuch-Art: {art!r}")
    b = int(betrag_cent)
    if art != "Differenz" and b < 0:
        raise KassenFehler("Betrag muss positiv sein; das Vorzeichen bestimmt die Art.")
    return KASSENBUCH_VORZEICHEN[art] * b


def soll_aus_belegen(belege: list[dict]) -> dict:
    """Aggregiert signierte Belege eines Tages (docstatus 1) zu Soll-Werten je Zahlart und Steuersatz.

    beleg: {"belegart": "Standard"|"Stornobeleg"|"Nullbeleg"|…, "trainings": 0/1, "gesamt_cent": int,
            "bediener": str,
            "zahlarten": [{"zahlart": "Bar", "betrag_cent": int}, …],
            "positionen": [{"art": "Anzahlung"|…, "steuersatz": str, "netto_cent", "ust_cent", "brutto_cent"}, …]}
    Trainingsbelege zählen nicht zum Umsatz, nur zur Anzahl. Nullbelege haben Betrag 0.
    """
    out = {
        "belege_anzahl": 0,
        "stornos_anzahl": 0,
        "trainings_anzahl": 0,
        "nullbelege_anzahl": 0,
        "bar_einnahmen_cent": 0,
        "bar_ausgaben_cent": 0,
        "karten_cent": 0,
        "gutschein_cent": 0,
        "ueberweisung_cent": 0,
        "umsatz_cent": 0,
        "anzahlungen_cent": 0,
        "gutschein_verkauf_cent": 0,
        "gutschein_einloesung_cent": 0,
        "retouren_cent": 0,
        "retouren_anzahl": 0,
        "chf_einnahmen_cent": 0,
        "je_satz": {},
        "je_zahlart": {},
        "je_bediener": {},
    }
    for b in belege:
        art = b.get("belegart") or "Standard"
        if int(b.get("trainings") or 0) or art == "Trainingsbeleg":
            out["trainings_anzahl"] += 1
            continue
        out["belege_anzahl"] += 1
        if art == "Nullbeleg":
            out["nullbelege_anzahl"] += 1
        if art == "Stornobeleg":
            out["stornos_anzahl"] += 1
        bed = b.get("bediener") or "unbekannt"
        jb = out["je_bediener"].setdefault(bed, {"anzahl": 0, "umsatz_cent": 0, "stornos": 0})
        jb["anzahl"] += 1
        jb["umsatz_cent"] += int(b.get("gesamt_cent") or 0)
        if art == "Stornobeleg":
            jb["stornos"] += 1
        out["umsatz_cent"] += int(b.get("gesamt_cent") or 0)
        for z in b.get("zahlarten") or []:
            za = z.get("zahlart")
            betrag = int(z.get("betrag_cent") or 0)
            out["je_zahlart"][za] = out["je_zahlart"].get(za, 0) + betrag
            if za == "Bar" and z.get("fremdwaehrung"):
                # Fremdwährung (CHF): CHF-Lade erhält den gegebenen Betrag, Rückgeld geht in Euro aus der EUR-Lade
                out["chf_einnahmen_cent"] += int(z.get("fremd_gegeben_cent") or 0)
                out["bar_ausgaben_cent"] += int(z.get("retour_cent") or 0)
            elif za == "Bar":
                if betrag >= 0:
                    out["bar_einnahmen_cent"] += betrag
                else:
                    out["bar_ausgaben_cent"] += -betrag
            elif za in ("Karte Stripe Terminal", "Karte extern"):
                out["karten_cent"] += betrag
            elif za == "Gutschein":
                out["gutschein_cent"] += betrag
            elif za == "Ueberweisung":
                out["ueberweisung_cent"] += betrag
        for p in b.get("positionen") or []:
            s = out["je_satz"].setdefault(p.get("steuersatz") or "Normal 20", {"netto_cent": 0, "ust_cent": 0, "brutto_cent": 0, "anzahl": 0})
            s["netto_cent"] += int(p.get("netto_cent") or 0)
            s["ust_cent"] += int(p.get("ust_cent") or 0)
            s["brutto_cent"] += int(p.get("brutto_cent") or 0)
            s["anzahl"] += 1
            pa = p.get("art")
            if pa in ("Anzahlung", "Teilzahlung", "Schlusszahlung"):
                out["anzahlungen_cent"] += int(p.get("brutto_cent") or 0)
            elif pa == "Gutschein Verkauf":
                out["gutschein_verkauf_cent"] += int(p.get("brutto_cent") or 0)
            elif pa == "Gutschein Einloesung":
                out["gutschein_einloesung_cent"] += -int(p.get("brutto_cent") or 0)
            elif pa == "Retoure":
                out["retouren_cent"] += -int(p.get("brutto_cent") or 0)
                out["retouren_anzahl"] += 1
    return out


def geschaeftstag(zeitpunkt, wechsel_uhrzeit: str | None = None):
    """Geschäftstag eines Zeitpunkts: vor der Tageswechsel-Uhrzeit (z. B. „03:00“ bei Abendveranstaltungen)
    zählt ein Beleg zum Vortag. Ohne Einstellung = Kalendertag. zeitpunkt: datetime."""
    from datetime import timedelta

    if not wechsel_uhrzeit or str(wechsel_uhrzeit) in ("0:00:00", "00:00", "00:00:00"):
        return zeitpunkt.date()
    h, m = (int(x) for x in str(wechsel_uhrzeit).split(":")[:2])
    return (zeitpunkt - timedelta(hours=h, minutes=m)).date()


def zeitraum(datum, wechsel_uhrzeit: str | None = None) -> tuple[str, str]:
    """(von, bis) als Text 'YYYY-MM-DD HH:MM:SS' für den Geschäftstag `datum` (date)."""
    from datetime import datetime, time, timedelta

    h, m = 0, 0
    if wechsel_uhrzeit and str(wechsel_uhrzeit) not in ("0:00:00", "00:00", "00:00:00"):
        h, m = (int(x) for x in str(wechsel_uhrzeit).split(":")[:2])
    von = datetime.combine(datum, time(h, m))
    bis = von + timedelta(days=1) - timedelta(seconds=1)
    return von.strftime("%Y-%m-%d %H:%M:%S"), bis.strftime("%Y-%m-%d %H:%M:%S")


def anfangsbestand(bestand_vortag_cent: int, anfangsbuchungen_heute_cent: int = 0, vortag_ist_cent: int | None = None) -> dict:
    """Bargeld-Anfang eines Abschlusses (Fachkritik 21 P3/P-F).

    Grundlage ist der Kassenbuch-Bestand am Ende des Vortags (enthält Bar-Belege, Einlagen/Entnahmen, Differenz-
    buchung des letzten Abschlusses) plus heute gebuchte „Anfangsbestand“-Zeilen (Ersteinrichtung). Einlagen/
    Entnahmen von heute laufen getrennt ins Soll. vortag_ist_cent dient nur der Plausibilität: nach Differenz-
    buchung muss Kassenbuch-Bestand = gezähltes Ist des Vortags sein, sonst Hinweis.
    """
    anfang = int(bestand_vortag_cent) + int(anfangsbuchungen_heute_cent or 0)
    hinweis = None
    if vortag_ist_cent is not None and int(vortag_ist_cent) != int(bestand_vortag_cent):
        hinweis = f"Kassenbuch-Bestand Vortag ({int(bestand_vortag_cent)} ct) ≠ gezähltes Ist Vortag ({int(vortag_ist_cent)} ct) – Buchung nach Abschluss prüfen."
    return {"bargeld_anfang_cent": anfang, "quelle": "Vortag", "hinweis": hinweis}


def bargeld_soll(bargeld_anfang_cent: int, bar_einnahmen_cent: int, bar_ausgaben_cent: int, einlagen_cent: int = 0, entnahmen_cent: int = 0) -> int:
    return int(bargeld_anfang_cent) + int(bar_einnahmen_cent) - int(bar_ausgaben_cent) + int(einlagen_cent) - int(entnahmen_cent)


def zaehlprotokoll_summe(zeilen: list[dict]) -> int:
    """Summe des Zählprotokolls: [{"stueckelung_cent": 5000, "anzahl": 3}, …] → Cent."""
    summe = 0
    for z in zeilen or []:
        s = int(z.get("stueckelung_cent") or 0)
        n = int(z.get("anzahl") or 0)
        if s not in STUECKELUNG_CENT:
            raise KassenFehler(f"Unbekannte Stückelung: {s} Cent")
        if n < 0:
            raise KassenFehler("Anzahl im Zählprotokoll darf nicht negativ sein.")
        summe += s * n
    return summe


def zaehlprotokoll_leer() -> list[dict]:
    return [{"stueckelung_cent": s, "anzahl": 0, "summe_cent": 0} for s in STUECKELUNG_CENT]


def differenz(bargeld_ist_cent: int, bargeld_soll_cent: int) -> int:
    """Ist minus Soll: positiv = Überschuss, negativ = Fehlbetrag."""
    return int(bargeld_ist_cent) - int(bargeld_soll_cent)


def differenz_grund_pflichtig(differenz_cent: int, toleranz_cent: int = 0) -> bool:
    return abs(int(differenz_cent)) > int(toleranz_cent)


def buchung_gesperrt(abschluesse: list[dict]) -> bool:
    """True, wenn für Kasse+Tag ein Abschluss im Zustand „Abgeschlossen“ existiert (kein späterer „Korrigiert“/„Offen“).

    abschluesse: alle Abschlüsse dieser Kasse für den Buchungstag, z. B. [{"status": "Abgeschlossen", "geschlossen_am": …}].
    Ein nachträglich geöffneter Abschluss hat Status „Korrigiert“ → Buchung wieder erlaubt.
    """
    return any((a.get("status") in GESPERRT_STATUS) for a in abschluesse or [])


def naechster_status(aktuell: str, aktion: str) -> str:
    """Zustandsmaschine des Tagesabschlusses (ersetzt einen Workflow, damit WP10a die Workflow-Fixtures frei hat)."""
    erlaubt = {
        ("Offen", "zaehlen"): "Gezaehlt",
        ("Gezaehlt", "zaehlen"): "Gezaehlt",
        ("Korrigiert", "zaehlen"): "Gezaehlt",
        ("Gezaehlt", "abschliessen"): "Abgeschlossen",
        ("Abgeschlossen", "oeffnen"): "Korrigiert",
    }
    if (aktuell, aktion) not in erlaubt:
        raise KassenFehler(f"Aktion „{aktion}“ ist im Status „{aktuell}“ nicht möglich.")
    return erlaubt[(aktuell, aktion)]
