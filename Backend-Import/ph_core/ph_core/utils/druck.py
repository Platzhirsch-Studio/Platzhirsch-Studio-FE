"""Jinja-Hilfen für Druckformate (hooks.py → jinja.methods). Verwendung in templates/print/ph_basis.html
und in allen Druckformaten der PH-Apps:

  ph_firma()                 Standardfirma als dict (Briefkopf, Fußzeile, § 11 UStG)
  ph_einstellungen()         PH Einstellungen als dict (testmodus, website_url …)
  ph_betrag(cent)            1234 → "12,34 €"
  ph_datum(d)                → "03.11.2026"
  ph_satz(promille)          2000 → "20 %" (Steuersatz Int ×100, CONVENTIONS 2)
  ph_qr_svg(text, mm=22)     QR-Code als Inline-SVG ohne externen Dienst (pyqrcode aus Frappe,
                             Rückfall qrcode, sonst Text) – Produktpass, GiroCode, Portal-Links
"""

import html

import frappe
from frappe.utils import formatdate

from ph_core.utils.zahlen import betrag_text, satz_text


def ph_firma(name=None):
    """Standardfirma (oder benannte) als dict für Briefkopf und Fußzeile."""
    from ph_core.ph_core.doctype.ph_firma.ph_firma import standard_firma

    return frappe.get_cached_doc("PH Firma", name or standard_firma()).as_dict()


def ph_einstellungen():
    from ph_core.ph_core.doctype.ph_einstellungen.ph_einstellungen import einstellungen

    return einstellungen()


def ph_betrag(cent, waehrung="EUR"):
    """Cent-Betrag → '1.234,50 €' (deutsches Format, Website-Konvention: Beträge in Cent)."""
    return betrag_text(cent, waehrung)


def ph_datum(wert):
    """Datum → '03.11.2026'."""
    return formatdate(wert, "dd.MM.yyyy") if wert else ""


def ph_satz(promille):
    """Steuersatz Int ×100 → Anzeige: 2000 → '20 %', 1000 → '10 %', 1950 → '19,5 %'."""
    return satz_text(promille)


def ph_qr_svg(text, groesse_mm=22, farbe="#30373e"):
    """QR-Code als Inline-SVG (String). Nie eine Ausnahme: ohne Bibliothek erscheint der Text.

    Bibliothek: pyqrcode (Abhängigkeit von Frappe selbst, frappe/twofactor.py) – deshalb die
    gemeinsame QR-Bibliothek aller PH-Apps; `qrcode` nur als Rückfall, falls eine App es mitbringt.
    """
    text = str(text or "")
    if not text:
        return ""
    svg = _svg_pyqrcode(text, farbe) or _svg_qrcode(text, farbe)
    if svg:
        return svg.replace("<svg ", f'<svg width="{groesse_mm}mm" height="{groesse_mm}mm" ', 1)
    return f'<span class="ph-qr-fallback" style="font-size:7pt;word-break:break-all">{html.escape(text)}</span>'


def _svg_pyqrcode(text, farbe):
    try:
        import io

        import pyqrcode

        qr = pyqrcode.create(text, error="M", encoding="utf-8")
        puffer = io.BytesIO()
        qr.svg(puffer, scale=1, xmldecl=False, svgclass="ph-qr", module_color=farbe, background="#ffffff", quiet_zone=2, omithw=True)
        return puffer.getvalue().decode()
    except Exception:  # noqa: BLE001
        return ""


def _svg_qrcode(text, farbe):
    try:
        import qrcode

        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2)
        qr.add_data(text)
        qr.make(fit=True)
        matrix = qr.get_matrix()
        n = len(matrix)
        pfade = [f"M{x},{y}h1v1h-1z" for y, zeile in enumerate(matrix) for x, an in enumerate(zeile) if an]
        return f'<svg class="ph-qr" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges"><rect width="{n}" height="{n}" fill="#ffffff"/><path d="{"".join(pfade)}" fill="{farbe}"/></svg>'
    except Exception:  # noqa: BLE001
        return ""
