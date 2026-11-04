"""QR-Code des Belegs (RKSV § 10, Detailspezifikation Abschnitt 12).

Inhalt des QR-Codes = vollständiger maschinenlesbarer Code mit Signatur (`beleg.code_mit_signatur`).
PNG-Erzeugung optional über `qrcode` (pyproject); ohne Bibliothek liefert `png_base64()` None und das
Druckformat (WP10b) zeigt den OCR-Text. Kein Frappe-Import.
"""

import base64
import io

from .beleg import code_aus_jws, ocr_code


def inhalt(jws):
    """QR-Inhalt aus der gespeicherten JWS (identisch mit PH Kassenbeleg.maschinenlesbarer_code)."""
    return code_aus_jws(jws)


def ocr(jws):
    return ocr_code(code_aus_jws(jws))


def png_base64(text, box_size=4, border=2):
    """PNG (Base64) für Bon/A4; None, wenn `qrcode` nicht installiert ist."""
    try:
        import qrcode
    except ImportError:
        return None
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=box_size, border=border)
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def svg(text, modul=3):
    """Einfaches SVG ohne Zusatzbibliothek-Abhängigkeit (nutzt qrcode nur zur Matrix); None ohne qrcode."""
    try:
        import qrcode
    except ImportError:
        return None
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2)
    qr.add_data(text)
    qr.make(fit=True)
    m = qr.get_matrix()
    n = len(m)
    rects = "".join(
        f'<rect x="{x * modul}" y="{y * modul}" width="{modul}" height="{modul}"/>' for y, zeile in enumerate(m) for x, v in enumerate(zeile) if v
    )
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n * modul} {n * modul}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">{rects}</g></svg>'
