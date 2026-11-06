"""Kartenkette: Karte + Vorgänger (Ersatzkarte, Übertragung) – für Jahreslimits der Vorteile und die Zeitleiste.
Reine Kettenlogik in utils/kartenregeln.kette (ohne Frappe)."""

import frappe

from ph_kundenkarte.utils.kartenregeln import kette


def karten_kette(karte):
    """[karte, vorgaenger, vorvorgaenger, …] – Jahreslimits zählen über Ersatz/Übertragung weiter."""
    if not karte:
        return []
    vorgaenger = {}
    aktuell = karte
    for _i in range(20):
        v = frappe.db.get_value("PH Kundenkarte", aktuell, "vorgaenger_karte")
        vorgaenger[aktuell] = v
        if not v or v in vorgaenger:
            break
        aktuell = v
    return kette(karte, vorgaenger)


def karten_der_person(karte):
    """Kette plus Dubletten, die in eine Karte der Kette zusammengeführt wurden (für Zeitleiste/Auskunft)."""
    namen = karten_kette(karte)
    if namen:
        namen += frappe.get_all("PH Kundenkarte", filters={"zusammengefuehrt_in": ("in", namen)}, pluck="name")
    return list(dict.fromkeys(namen))


def hauptkarte(karte):
    """Zusammengeführte Dublette → Zielkarte (eine Stufe genügt; Ziel wird nie selbst zusammengeführt, sonst folgen)."""
    gesehen = set()
    while karte and karte not in gesehen:
        gesehen.add(karte)
        ziel = frappe.db.get_value("PH Kundenkarte", karte, ["status", "zusammengefuehrt_in"], as_dict=True)
        if not ziel or ziel.status != "Zusammengefuehrt" or not ziel.zusammengefuehrt_in:
            return karte
        karte = ziel.zusammengefuehrt_in
    return karte
