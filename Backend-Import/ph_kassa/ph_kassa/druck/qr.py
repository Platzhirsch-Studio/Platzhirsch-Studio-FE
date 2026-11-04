"""QR-Code als SVG für Druckformate und Belegvorschau (Jinja-Methode `ph_kassa_qr_svg`).

Die RKSV-QR-Erzeugung als PNG liegt bei WP10a (`ph_kassa.rksv.qr`). Hier nur die Darstellung:
wenn das Paket `qrcode` installiert ist (WP10a trägt es in pyproject ein), wird ein Inline-SVG
erzeugt; sonst ein Platzhalter, damit Vorschau und PDF nie brechen.
"""

from __future__ import annotations


def qr_svg(text: str, groesse_mm: int = 28) -> str:
    """Inline-SVG (String) für `{{ ph_kassa_qr_svg(doc.maschinenlesbarer_code) }}`."""
    if not text:
        return ""
    try:
        import qrcode  # type: ignore
    except ImportError:
        return _platzhalter(groesse_mm)
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2)
    qr.add_data(text)
    qr.make(fit=True)
    matrix = qr.get_matrix()
    n = len(matrix)
    pfade = []
    for y, zeile in enumerate(matrix):
        x = 0
        while x < n:
            if zeile[x]:
                start = x
                while x < n and zeile[x]:
                    x += 1
                pfade.append(f"M{start} {y}h{x - start}v1h-{x - start}z")
            else:
                x += 1
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" width="{groesse_mm}mm" height="{groesse_mm}mm" '
        f'shape-rendering="crispEdges" role="img" aria-label="RKSV QR-Code"><rect width="{n}" height="{n}" fill="#fff"/>'
        f'<path d="{"".join(pfade)}" fill="#000"/></svg>'
    )


def _platzhalter(groesse_mm: int) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{groesse_mm}mm" height="{groesse_mm}mm" role="img" aria-label="QR-Code (Paket qrcode fehlt)">'
        '<rect width="100" height="100" fill="#fff" stroke="#30373e" stroke-width="2"/>'
        '<text x="50" y="46" font-family="Arial" font-size="9" text-anchor="middle" fill="#30373e">QR-Code</text>'
        '<text x="50" y="60" font-family="Arial" font-size="7" text-anchor="middle" fill="#6b7280">Paket qrcode fehlt</text></svg>'
    )
