"""Erstinstallation ph_logistik: Standard-Lagerorte, Paketprofile (Schätzungen, beispiel=1), Einstellungen. Idempotent, keine Geheimnisse."""

import frappe

from ph_logistik.ph_logistik.paketprofile import PAKETTYPEN

LAGERORTE = [
    {"bezeichnung": "Showroom Lochau", "art": "Showroom", "strasse": "Landstraße 11", "plz": "6911", "ort": "Lochau", "land": "AT", "plaetze": [{"platz": "EG"}, {"platz": "OG"}, {"platz": "Schaufenster"}, {"platz": "Atelier"}]},
    {"bezeichnung": "Lager Lochau", "art": "Lager", "strasse": "Landstraße 11", "plz": "6911", "ort": "Lochau", "land": "AT", "standard": 1, "plaetze": [{"platz": "Regal A"}, {"platz": "Regal B"}, {"platz": "Packtisch"}, {"platz": "Retouren"}]},
]


def after_install():
    lagerorte_anlegen()
    paketprofile_anlegen()
    einstellungen_setzen()
    from ph_logistik.ph_logistik.packtisch_ablauf import standardregeln_anlegen  # Packtisch nach JTL: Start-Dokument-/Packhinweisregeln

    standardregeln_anlegen()
    frappe.db.commit()


def lagerorte_anlegen():
    for lo in LAGERORTE:
        if frappe.db.exists("PH Lagerort", lo["bezeichnung"]):
            continue
        frappe.get_doc({"doctype": "PH Lagerort", **lo}).insert(ignore_permissions=True)


def paketprofile_anlegen():
    """Pakettypen aus paketprofile.js als Schätzungen (geprueft=0). Je Familie ist das leichteste Profil Standard."""
    standard_gesetzt = set()
    for p in PAKETTYPEN:
        if frappe.db.exists("PH Paketprofil", p["key"]):
            continue
        doc = frappe.get_doc({"doctype": "PH Paketprofil", **p, "aktiv": 1, "beispiel": 1, "standard": int(p["familie"] not in standard_gesetzt and not p.get("versand_gesperrt")), "hinweis": "Schätzung, zu prüfen – Karton messen und „Geprüft“ setzen (qa-screenshots/shop/PAKETPROFILE.md)."})
        doc.insert(ignore_permissions=True)
        if doc.standard:
            standard_gesetzt.add(p["familie"])


def einstellungen_setzen():
    e = frappe.get_single("PH Logistik Einstellungen")
    if not e.standard_lagerort and frappe.db.exists("PH Lagerort", "Lager Lochau"):
        e.standard_lagerort = "Lager Lochau"
        e.packtisch_lagerort = "Lager Lochau"
    if not e.showroom_lagerort and frappe.db.exists("PH Lagerort", "Showroom Lochau"):
        e.showroom_lagerort = "Showroom Lochau"
    try:
        firma = frappe.get_doc("PH Firma", frappe.db.get_value("PH Firma", {"standard": 1}, "name"))
        e.absender_telefon = e.absender_telefon or firma.get("telefon")
        e.absender_email = e.absender_email or firma.get("email")
    except Exception:  # noqa: BLE001
        pass
    e.letmeship_testmodus = 1
    e.save(ignore_permissions=True)
    bewertung_standard_setzen()


def bewertung_standard_setzen():
    """Lager & Inventur Ergänzung: Platzhalter-Abwertungsstaffel und Konten (nur wenn leer; Steuerberater bestätigt)."""
    from ph_logistik.ph_logistik.inventur_logik import STANDARD_STAFFEL

    e = frappe.get_single("PH Logistik Einstellungen")
    geaendert = False
    if not e.get("abwertung_staffel"):
        for r in STANDARD_STAFFEL:
            e.append("abwertung_staffel", {**r, "platzhalter": 1, "hinweis": "Platzhalter – Steuerberater"})
        geaendert = True
    for feld, wert in (("bewertung_methode", "Gleitender Durchschnitt"), ("konto_handelswaren", "1600"), ("konto_bestandsveraenderung", "5010"), ("geschaeftsjahr_beginn_monat", 1),
                       ("teilinventur_plaetze_je_lauf", 10), ("meldebestand_verbrauch_tage", 90), ("bewertung_ust_basispunkte", 2000)):
        if not e.get(feld):
            e.set(feld, wert)
            geaendert = True
    if geaendert:
        e.flags.ignore_permissions = True
        e.save(ignore_permissions=True)
