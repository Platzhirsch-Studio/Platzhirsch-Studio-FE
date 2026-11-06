"""Backoffice-Methoden (Desk-/Next-Sitzung, kein Website-Token) für Leitung/Admin – Lücken aus
Marktresearch/digital/backoffice/10-konzept-kundenkarte.md §9.1:

  wallet_status()                       → Konfigurationszustand Apple/Google (nur Namen/Ja-Nein, keine Geheimnisse)
  umsatz_alle_neu_berechnen()           → Sammel-Neuberechnung als Hintergrundjob (nach Stufenänderung)
  stufenplan_vorschau(stufen=None)      → „n Karten würden auf-/absteigen“ für geänderte Schwellen
  stammdaten_anlegen()                  → Standardstufen/-vorteile/Einstellungen (leerer Mandant)
  dubletten_finden(limit=50)            → Kontakte mit mehr als einer offenen Karte
  sperrgruende()                        → Katalog für Dialoge (Ersatzkarte/Entsperrbar/Kassa-Text)
  karten_zusammenfuehren(karten, nur_plan=0) → mehrere Karten derselben Person zusammenführen
"""

import json

import frappe
from frappe import _
from frappe.utils import cint

from ph_kundenkarte.ph_kundenkarte.lebenszyklus import leitung_pruefen
from ph_kundenkarte.utils import kartenregeln as kr


@frappe.whitelist()
def wallet_status():
    leitung_pruefen(_("Wallet-Status ansehen"))
    from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einstellungen.ph_kundenkarte_einstellungen import wallet_konfiguriert

    ergebnis = {}
    for plattform in ("apple", "google"):
        try:
            ergebnis[plattform] = {"konfiguriert": bool(wallet_konfiguriert(plattform)), "fehlt": None}
        except Exception as e:  # noqa: BLE001 – Meldung nennt nur fehlende Schlüssel-/Feldnamen
            ergebnis[plattform] = {"konfiguriert": False, "fehlt": str(e)[:200]}
    return ergebnis


@frappe.whitelist(methods=["POST"])
def umsatz_alle_neu_berechnen():
    leitung_pruefen(_("Alle Karten neu berechnen"))
    frappe.enqueue("ph_kundenkarte.ph_kundenkarte.tasks.umsatz_und_stufen_neu_berechnen", queue="long", job_name="ph_kundenkarte:umsatz:alle", deduplicate=True)
    return {"eingereiht": True, "karten": frappe.db.count("PH Kundenkarte", {"status": ("in", ["Aktiv", "Gesperrt"]), "einwilligung_auswertung": 1})}


@frappe.whitelist()
def stufenplan_vorschau(stufen=None):
    """stufen: JSON-Liste [{stufenname, reihenfolge, schwelle_jahresumsatz_cent, aktiv}] (ungespeicherter Plan);
    leer = aktueller Plan. Grundlage: zuletzt berechneter Jahresumsatz der Karten (kein Neuberechnen)."""
    leitung_pruefen(_("Stufenplan-Vorschau"))
    if isinstance(stufen, str):
        stufen = json.loads(stufen or "null")
    if not stufen:
        stufen = frappe.get_all("PH Kundenkarte Stufe", fields=["stufenname", "reihenfolge", "schwelle_jahresumsatz_cent", "aktiv"])
    karten = frappe.get_all("PH Kundenkarte", filters={"status": ("in", ["Aktiv", "Gesperrt"])}, fields=["name", "stufe", "jahresumsatz_cent", "stufe_manuell", "einwilligung_auswertung"])
    return kr.stufenplan_vorschau([dict(k) for k in karten], [dict(s) for s in stufen])


@frappe.whitelist(methods=["POST"])
def stammdaten_anlegen():
    leitung_pruefen(_("Standardstufen anlegen"))
    from ph_kundenkarte.install import after_install

    after_install()
    return {"stufen": frappe.db.count("PH Kundenkarte Stufe"), "vorteile": frappe.db.count("PH Kundenkarte Vorteil")}


@frappe.whitelist()
def dubletten_finden(limit=50):
    """Kontakte mit mehr als einer offenen Karte (entsteht nach Kontakt-Zusammenführung ohne Hook oder Altimport)."""
    leitung_pruefen(_("Dubletten prüfen"))
    je_kontakt = {}
    for z in frappe.get_all("PH Kundenkarte", filters={"status": ("in", list(kr.OFFENE_STATUS))}, fields=["name", "kontakt"], order_by="kontakt"):
        je_kontakt.setdefault(z.kontakt, []).append(z.name)
    treffer = [{"kontakt": k, "anzahl": len(v), "karten": v} for k, v in je_kontakt.items() if len(v) > 1]
    return treffer[: cint(limit) or 50]


@frappe.whitelist()
def sperrgruende():
    return [{"wert": k, "label": _(v[0]), "ersatzkarte": v[1], "entsperrbar": v[2], "kassa_text": _(v[3])} for k, v in kr.SPERRGRUENDE.items()]


@frappe.whitelist(methods=["POST"])
def karten_zusammenfuehren(karten, nur_plan=0):
    from ph_kundenkarte.ph_kundenkarte import lebenszyklus

    if isinstance(karten, str):
        karten = json.loads(karten)
    if not cint(nur_plan):
        leitung_pruefen(_("Karten zusammenführen"))
    else:
        frappe.has_permission("PH Kundenkarte", "read", throw=True)
    return lebenszyklus.zusammenfuehren(karten, nur_plan=bool(cint(nur_plan)))
