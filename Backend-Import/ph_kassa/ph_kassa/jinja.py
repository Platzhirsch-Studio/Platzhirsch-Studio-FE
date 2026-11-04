"""Jinja-Hilfen der Druckformate (hooks.py, WP10b-Block): {{ ph_kassa_einstellungen() }}, {{ ph_kassa_qr_svg(code, mm) }}."""


def ph_kassa_einstellungen():
    from ph_kassa.ph_kassa.doctype.ph_kassa_einstellungen.ph_kassa_einstellungen import einstellungen

    return einstellungen()


def ph_kassa_qr_svg(text, groesse_mm=28):
    from ph_kassa.druck.qr import qr_svg

    return qr_svg(text, int(groesse_mm))
