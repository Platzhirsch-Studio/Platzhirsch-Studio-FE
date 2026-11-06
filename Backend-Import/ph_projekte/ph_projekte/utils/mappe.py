"""Auftragsmappe als PDF-Sammeldruck – Reihenfolge der Teile und Zusammenführen (pypdf, kommt mit Frappe).

Reine Logik (tests/test_mappe.py). Aufrufer: ph_projekte.api.auftragsmappe_pdf.
"""

import io

TEILE = ("deckblatt", "statusbericht", "aufmass", "planung", "nachtrag", "montagebericht", "abnahme", "produktpass")
DRUCKFORMAT = {
    "deckblatt": ("PH Projekt", "PH Auftragsmappe Deckblatt"),
    "statusbericht": ("PH Projekt", "PH Projekt Statusbericht"),
    "aufmass": ("PH Aufmass", "PH Aufmass Protokoll"),
    "nachtrag": ("PH Nachtrag", "PH Nachtrag Standard"),
    "montagebericht": ("PH Montageauftrag", "PH Montagebericht"),
    "abnahme": ("PH Abnahme", "PH Abnahmeprotokoll"),
    "produktpass": ("PH Produktpass", "PH Produktpass"),
}


def teile_waehlen(teile=None):
    """Gewünschte Teile in fester Reihenfolge; None/leer = alle. Unbekannte werden ignoriert."""
    if not teile:
        return list(TEILE)
    if isinstance(teile, str):
        teile = [t.strip() for t in teile.split(",")]
    gewuenscht = {t.lower() for t in teile if t}
    return [t for t in TEILE if t in gewuenscht]


def ist_pdf(daten):
    return isinstance(daten, (bytes, bytearray)) and bytes(daten[:5]) == b"%PDF-"


def zusammenfuehren(pdfs):
    """Liste PDF-Bytes → ein PDF (Bytes). Nicht-PDFs werden übersprungen. Gibt (bytes, seiten, uebersprungen) zurück."""
    from pypdf import PdfReader, PdfWriter

    writer = PdfWriter()
    seiten = 0
    uebersprungen = 0
    for daten in pdfs:
        if not ist_pdf(daten):
            uebersprungen += 1
            continue
        try:
            reader = PdfReader(io.BytesIO(bytes(daten)))
        except Exception:  # noqa: BLE001 – defekte Datei überspringen
            uebersprungen += 1
            continue
        for seite in reader.pages:
            writer.add_page(seite)
            seiten += 1
    puffer = io.BytesIO()
    writer.write(puffer)
    return puffer.getvalue(), seiten, uebersprungen


def inhaltsverzeichnis(eintraege):
    """[(teil, titel)] → [{nr, teil, titel}] für das Deckblatt."""
    return [{"nr": i, "teil": t, "titel": titel} for i, (t, titel) in enumerate(eintraege, start=1)]
