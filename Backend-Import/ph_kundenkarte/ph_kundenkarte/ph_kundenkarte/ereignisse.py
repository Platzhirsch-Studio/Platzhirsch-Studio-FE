"""doc_events (hooks.py): Belege fremder Apps → Umsatz der Kundenkarte neu berechnen (enqueue, nie Ausnahmen);
Storno eines Belegs → Einlösungen mit diesem Bezug zurücknehmen (Leistung nicht erbracht, Jahreslimit wieder frei)."""

import frappe

from ph_kundenkarte.utils.karte import kartennummer_gueltig, normalisiere_kartennummer

BESTELLUNG_RELEVANT = ("bezahlt", "versandbereit", "versendet", "reserviert", "abholbereit", "abgeholt", "abgeschlossen", "teilerstattet", "erstattet", "storniert", "widerrufen")


def _karte_aus_nummer(wert):
    nr = normalisiere_kartennummer(wert)
    if nr and kartennummer_gueltig(nr) and frappe.db.exists("PH Kundenkarte", nr):
        return nr
    return None


def _neu_berechnen(kontakt=None, kartennummer=None):
    try:
        karte = _karte_aus_nummer(kartennummer) if kartennummer else None
        if not karte and kontakt:
            karte = frappe.db.get_value("PH Kundenkarte", {"kontakt": kontakt, "status": ("in", ["Aktiv", "Gesperrt"])}, "name")
        if not karte:
            return
        frappe.enqueue("ph_kundenkarte.ph_kundenkarte.umsatz.karte_neu_berechnen", queue="short", enqueue_after_commit=True, job_name=f"ph_kundenkarte:umsatz:{karte}", karte=karte, automatisch=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_kundenkarte: Umsatz-Neuberechnung einreihen")


# nur Storno vor Leistung; Widerruf/Erstattung nach Lieferung: Leistung war erbracht, Einlösung bleibt
STORNO_BESTELLUNG = ("storniert",)


def _einloesungen_zuruecknehmen(bezug_doctype, bezug, grund):
    try:
        from ph_kundenkarte.ph_kundenkarte.lebenszyklus import einloesungen_zu_bezug_stornieren

        einloesungen_zu_bezug_stornieren(bezug_doctype, bezug, grund)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_kundenkarte: Einlösungen zu {bezug_doctype} {bezug} stornieren")


def kassenbeleg_gebucht(doc, method=None):
    """on_submit / on_cancel PH Kassenbeleg (ph_kassa). Kartennummer an der Kassa (Custom Field) oder Kontakt.
    Stornobeleg (`storno_von`) bzw. Cancel des Originals → Einlösungen mit Bezug auf das Original stornieren."""
    _neu_berechnen(kontakt=doc.get("kontakt"), kartennummer=doc.get("ph_kundenkarte_kartennummer"))
    if method == "on_submit" and doc.get("belegart") == "Stornobeleg" and doc.get("storno_von"):
        _einloesungen_zuruecknehmen("PH Kassenbeleg", doc.get("storno_von"), f"Kassenstorno {doc.name}")
    elif method == "on_cancel":
        _einloesungen_zuruecknehmen("PH Kassenbeleg", doc.name, "Kassenbeleg storniert")


def bestellung_aktualisiert(doc, method=None):
    """on_update PH Bestellung (ph_shop): nur bei Statuswechsel in einen zahlungsrelevanten Zustand."""
    try:
        if not doc.has_value_changed("status") or doc.get("status") not in BESTELLUNG_RELEVANT:
            return
    except Exception:  # noqa: BLE001
        return
    _neu_berechnen(kontakt=doc.get("kontakt"), kartennummer=doc.get("ph_kundenkarte_kartennummer"))
    if doc.get("status") in STORNO_BESTELLUNG:
        _einloesungen_zuruecknehmen("PH Bestellung", doc.name, f"Bestellung {doc.get('status')}")


def rechnung_gebucht(doc, method=None):
    """on_submit / on_cancel PH Rechnung (ph_faktura)."""
    _neu_berechnen(kontakt=doc.get("kontakt"))
    if method == "on_cancel":
        _einloesungen_zuruecknehmen("PH Rechnung", doc.name, "Rechnung storniert")
