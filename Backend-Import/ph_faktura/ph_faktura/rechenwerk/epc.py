"""EPC-QR-Code („GiroCode“, EPC069-12 Version 002) – Text für Überweisungen auf Rechnungen.

Format (Zeilen, UTF-8, Zeilenumbruch LF):
  BCD / 002 / 1 (UTF-8) / SCT / BIC (optional ab V2) / Name / IBAN / EURx.xx / Zweck (leer) /
  Strukturierte Referenz (leer, wir nutzen unstrukturiert) / Verwendungszweck (≤ 140) / Hinweis (leer)
"""

from decimal import Decimal


def epc_text(name, iban, betrag_cent, verwendungszweck, bic="", waehrung="EUR"):
    if not name or not iban:
        return ""
    betrag = Decimal(int(betrag_cent or 0)) / Decimal(100)
    if betrag <= 0 or betrag > Decimal("999999999.99"):
        return ""
    iban = "".join(iban.split()).upper()
    zeilen = [
        "BCD",
        "002",
        "1",
        "SCT",
        (bic or "").strip().upper()[:11],
        str(name).strip()[:70],
        iban[:34],
        f"{waehrung}{betrag:.2f}",
        "",
        "",
        str(verwendungszweck or "").strip()[:140],
        "",
    ]
    return "\n".join(zeilen)


def epc_svg(text):
    """SVG-Data-URI des QR-Codes über pyqrcode (Frappe-Abhängigkeit, gemeinsame QR-Bibliothek der PH-Apps;
    Inline-SVG für Druckformate liefert ph_core.utils.druck.ph_qr_svg). Ohne Bibliothek '' – das
    Druckformat zeigt dann nur die Zahlungsangaben."""
    if not text:
        return ""
    try:
        import base64
        import io

        import pyqrcode  # noqa: WPS433 – Frappe-Abhängigkeit

        qr = pyqrcode.create(text, error="M", encoding="utf-8")
        buf = io.BytesIO()
        qr.svg(buf, scale=3, quiet_zone=2, module_color="#30373e", background="#ffffff", xmldecl=False)
        return "data:image/svg+xml;base64," + base64.b64encode(buf.getvalue()).decode()
    except Exception:  # noqa: BLE001
        return ""
