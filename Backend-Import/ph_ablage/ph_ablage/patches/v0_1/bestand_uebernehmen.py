"""Bestehende Anhänge (Frappe File an PH Kontakt/PH Projekt/PH Lieferant/PH Mitarbeiter/PH Servicefall,
PH Projekt Dokument) in die Ablage verlinken – nicht kopieren. Läuft als Hintergrundjob in Blöcken; idempotent
(bereits verlinkte Files werden übersprungen). Manuell: ph_ablage.api.bestand_uebernehmen (Leitung)."""

import frappe


def execute():
    if frappe.flags.in_test:
        return
    frappe.enqueue("ph_ablage.patches.v0_1.bestand_uebernehmen.alle_bloecke", queue="long", timeout=7200, enqueue_after_commit=True)


def alle_bloecke(max_bloecke=200):
    from ph_ablage.ph_ablage.bestand import bestand_uebernehmen

    for _ in range(max_bloecke):
        erg = bestand_uebernehmen(limit=500)
        if not erg.get("verlinkt"):
            break
