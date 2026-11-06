"""Kundenakte über alle Kanäle und Verkaufsphasen – reine Logik ohne Frappe.

Quelle: Marktresearch/digital/backoffice/32-marktfunktionen-nachtrag.md, CRM Nr. 1 (Kaufhistorie, Rechnungen,
Planungen, Reklamationen je Kanal Showroom/Shop/Objekt) und Nr. 3 (Phasen Erstberatung → Aufmaß → Planung →
Angebot → Kaufvertrag mit Pflichtfeldern je Phase).
"""

KANAELE = ("Showroom", "Shop", "Objekt")
OBJEKT_PROJEKTARTEN = {"Hotel", "Objekt", "Gewerbe", "Yacht"}
BEREICHE = ("kaeufe", "rechnungen", "planungen", "reklamationen")

# Phase → (Standard-Wahrscheinlichkeit %, Pflichtfelder der PH Anfrage)
PHASEN = {
    "Erstberatung": (20, ("kontakt", "zugewiesen_an")),
    "Aufmass": (35, ("kontakt", "zugewiesen_an", "plz_ort")),
    "Planung": (50, ("kontakt", "zugewiesen_an", "plz_ort", "wert_cent")),
    "Angebot": (60, ("kontakt", "zugewiesen_an", "wert_cent", "erwarteter_abschluss")),
    "Kaufvertrag": (100, ("kontakt", "zugewiesen_an", "wert_cent")),
}
PHASEN_REIHENFOLGE = tuple(PHASEN)
FELD_LABEL = {"kontakt": "Kontakt", "zugewiesen_an": "Zuständig", "plz_ort": "PLZ/Ort (Objekt)", "wert_cent": "Erwarteter Auftragswert", "erwarteter_abschluss": "Erwarteter Abschluss"}


def kanal(doctype, zeile, projektart=None):
    """Kanal eines Vorgangs. zeile: dict mit den vorhandenen Feldern; projektart: Art des verknüpften Projekts."""
    zeile = zeile or {}
    if projektart in OBJEKT_PROJEKTARTEN:
        return "Objekt"
    if doctype == "PH Projekt" or doctype == "PH Planung":
        return "Objekt" if (zeile.get("projektart") in OBJEKT_PROJEKTARTEN) else "Showroom"
    if doctype == "PH Kassenbeleg":
        return "Showroom"
    if doctype == "PH Bestellung":
        return "Showroom" if zeile.get("bestellart") in ("Showroom", "Telefon") else "Shop"
    if doctype == "PH Auftragsbestaetigung" and zeile.get("vertragsort") == "Fernabsatz":
        return "Shop"
    if zeile.get("bestellung"):
        return "Shop"
    return "Showroom"


def gruppieren(eintraege):
    """eintraege: [{kanal, bereich, betrag_cent?, …}] → {kanal: {bereich: [...], "summe_cent": int, "anzahl": int}}."""
    erg = {k: {**{b: [] for b in BEREICHE}, "summe_cent": 0, "anzahl": 0} for k in KANAELE}
    for e in eintraege:
        g = erg.setdefault(e.get("kanal") or "Showroom", {**{b: [] for b in BEREICHE}, "summe_cent": 0, "anzahl": 0})
        g.setdefault(e["bereich"], []).append(e)
        g["anzahl"] += 1
        if e["bereich"] == "kaeufe" and e.get("betrag_cent") is not None:
            g["summe_cent"] += int(e["betrag_cent"] or 0)
    return erg


def fehlende_pflichtfelder(phase, werte):
    """Pflichtfelder der Phase, die in `werte` leer sind → [(feld, label)]."""
    if phase not in PHASEN:
        return []
    return [(f, FELD_LABEL.get(f, f)) for f in PHASEN[phase][1] if werte.get(f) in (None, "", 0)]


def phasen_wahrscheinlichkeit(phase):
    return PHASEN[phase][0] if phase in PHASEN else None


def interessent_loeschfaellig(letzter_kontakt, heute, jahre=3):
    """Speicherbegrenzung (Art. 5 Abs. 1 lit. e DSGVO, 32-Nachtrag A14): Interessent ohne Kauf, letzter Kontakt
    älter als `jahre` → Löschvorschlag. Datumswerte als date oder 'YYYY-MM-DD…'."""
    from datetime import date

    def d(x):
        return x if isinstance(x, date) else date.fromisoformat(str(x)[:10])

    if not letzter_kontakt:
        return False
    lk, h = d(letzter_kontakt), d(heute)
    try:
        grenze = lk.replace(year=lk.year + int(jahre))
    except ValueError:  # 29.02.
        grenze = lk.replace(year=lk.year + int(jahre), day=28)
    return h > grenze
