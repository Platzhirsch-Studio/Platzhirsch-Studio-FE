"""after_install / after_migrate: Einstellungen mit Standardwerten und Ordnervorlagen (idempotent, ohne Personendaten).
Bereichsordner („Projekte“, „Kontakte“, …) entstehen erst beim ersten Bezug; Bestand übernimmt der Patch
ph_ablage.patches.v0_1.bestand_uebernehmen (Hintergrundjob)."""

import frappe

from ph_ablage.ph_ablage.doctype.ph_ablage_einstellungen.ph_ablage_einstellungen import STANDARD, standard_vorlagen_zeilen


def after_install():
    einstellungen_anlegen()


def after_migrate():
    einstellungen_anlegen()


def einstellungen_anlegen():
    doc = frappe.get_single("PH Ablage Einstellungen")
    geaendert = False
    for feld, wert in STANDARD.items():
        if doc.get(feld) in (None, "") and wert not in (None, ""):
            doc.set(feld, wert)
            geaendert = True
    if not doc.get("ordnervorlagen"):
        for z in standard_vorlagen_zeilen():
            doc.append("ordnervorlagen", z)
        geaendert = True
    if geaendert:
        doc.flags.ignore_permissions = True
        doc.save()
        frappe.db.commit()
