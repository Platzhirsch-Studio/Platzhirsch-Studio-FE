"""Erstinstallation ph_faktura: Standarddaten ohne Geheimnisse, idempotent."""

import frappe

ZAHLUNGSBEDINGUNGEN = [
    {"titel": "40 / 50 / 10 – Möbel mit Montage", "anzahlung_prozent": 40, "teilzahlung_prozent": 50, "zieltage": 14, "standard": 1,
     "text": "40 % Anzahlung bei Auftrag, 50 % bei Lieferung, 10 % nach Montage – jeweils innerhalb von 14 Tagen ohne Abzug."},
    {"titel": "50 / 50 – Lieferung ohne Montage", "anzahlung_prozent": 50, "teilzahlung_prozent": 50, "zieltage": 14,
     "text": "50 % Anzahlung bei Auftrag, 50 % bei Lieferung – jeweils innerhalb von 14 Tagen ohne Abzug."},
    {"titel": "100 % bei Auftrag – Sonderanfertigung", "anzahlung_prozent": 100, "teilzahlung_prozent": 0, "zieltage": 7,
     "text": "100 % bei Auftrag (Sonderanfertigung, kein Rückgaberecht), zahlbar innerhalb von 7 Tagen."},
    {"titel": "14 Tage netto", "anzahlung_prozent": 0, "teilzahlung_prozent": 0, "zieltage": 14,
     "text": "Zahlbar innerhalb von 14 Tagen ab Rechnungsdatum ohne Abzug."},
]


def after_install():
    zahlungsbedingungen_anlegen()
    einstellungen_anlegen()
    bankkonto_aus_firma()
    frappe.db.commit()


def zahlungsbedingungen_anlegen():
    for z in ZAHLUNGSBEDINGUNGEN:
        if frappe.db.exists("PH Zahlungsbedingung", z["titel"]):
            continue
        frappe.get_doc({"doctype": "PH Zahlungsbedingung", "aktiv": 1, **z}).insert(ignore_permissions=True)


def einstellungen_anlegen():
    e = frappe.get_single("PH Faktura Einstellungen")
    if not e.standard_zahlungsbedingung:
        e.standard_zahlungsbedingung = frappe.db.get_value("PH Zahlungsbedingung", {"standard": 1}, "name")
    e.save(ignore_permissions=True)
    m = frappe.get_single("PH Mahnwesen Einstellungen")
    m.save(ignore_permissions=True)


def bankkonto_aus_firma():
    """Legt das Standard-Bankkonto aus PH Firma an, sobald dort eine IBAN steht (sonst später im Desk)."""
    if frappe.db.count("PH Bankkonto"):
        return
    firma = frappe.db.get_value("PH Firma", {"standard": 1}, ["firmenname", "iban", "bic", "bank"], as_dict=True)
    if not firma or not firma.iban:
        return
    k = frappe.get_doc({"doctype": "PH Bankkonto", "bezeichnung": f"Geschäftskonto {firma.bank or ''}".strip(), "iban": firma.iban, "bic": firma.bic, "bank": firma.bank, "kontoinhaber": firma.firmenname, "standard": 1, "aktiv": 1}).insert(ignore_permissions=True)
    e = frappe.get_single("PH Faktura Einstellungen")
    e.standard_bankkonto = k.name
    e.save(ignore_permissions=True)
