"""Jinja-Hilfen der Faktura-Druckformate (hooks.py → jinja.methods).

  ph_satz(2000)                  → "20 %"
  ph_epc_qr(doc)                 → SVG-Data-URI des GiroCodes oder ""
  ph_bankkonto()                 → {iban, bic, bank, kontoinhaber}
  ph_kontoauszug(kontakt)        → {rechnungen: [...], summe_offen_cent, summe_ueberfaellig_cent}
  ph_zahlungsplan_text(ab)       → Zeilen für den Zahlungsplan
  ph_faktura_einstellungen()     → dict
"""

import frappe
from frappe.utils import getdate, nowdate

from ph_faktura import einstellungen
from ph_faktura.rechenwerk import epc
from ph_faktura.rechenwerk import steuer as S


def ph_satz(promille):
    """Re-Export: den Jinja-Helfer ph_satz liefert ph_core (hooks.jinja dort); hier nur für Python-Aufrufer."""
    try:
        from ph_core.utils.druck import ph_satz as _core

        return _core(promille)
    except ImportError:
        return S.satz_prozent_text(promille)


def ph_bankkonto():
    return einstellungen.bankkonto()


def ph_faktura_einstellungen():
    return einstellungen.faktura()


def ph_epc_qr(doc):
    e = einstellungen.faktura()
    if not e.get("epc_qr_aktiv") or not doc.get("qr_code_girocode") or int(doc.get("offen_cent") or 0) <= 0:
        return ""
    k = einstellungen.bankkonto()
    if not k.get("iban"):
        return ""
    text = epc.epc_text(k.get("kontoinhaber") or einstellungen.firma().get("firmenname"), k["iban"], doc.get("offen_cent"), doc.get("zahlungsreferenz") or doc.name, k.get("bic") or "")
    return epc.epc_svg(text)


def ph_kontoauszug(kontakt, nur_offen=False):
    heute = getdate(nowdate())
    filters = {"kontakt": kontakt, "docstatus": 1, "status": ("!=", "Storniert")}
    if nur_offen:
        filters["offen_cent"] = (">", 0)
    rows = frappe.get_all("PH Rechnung", filters=filters, fields=["name", "art", "datum", "faellig", "zahlbar_cent", "bezahlt_cent", "offen_cent", "status", "mahnstufe"], order_by="datum asc")
    for r in rows:
        r["ueberfaellig_tage"] = max((heute - getdate(r.faellig)).days, 0) if r.faellig and r.offen_cent > 0 else 0
    gutschriften = frappe.get_all("PH Gutschrift", filters={"kontakt": kontakt, "docstatus": 1}, fields=["name", "art", "datum", "rechnung", "brutto_cent", "status"], order_by="datum asc")
    return {
        "rechnungen": rows,
        "gutschriften": gutschriften,
        "summe_offen_cent": sum(r.offen_cent for r in rows),
        "summe_ueberfaellig_cent": sum(r.offen_cent for r in rows if r["ueberfaellig_tage"] > 0),
        "stichtag": heute,
    }


def ph_zahlungsplan_text(doc):
    zeilen = []
    for z in doc.get("zahlungsplan") or []:
        wann = {"Auftrag": "bei Auftrag", "Lieferung": "bei Lieferung", "Montage": "nach Montage", "Datum": f"am {frappe.utils.formatdate(z.faellig, 'dd.MM.yyyy')}" if z.faellig else ""}.get(z.faellig_bei, "")
        zeilen.append({"art": z.art, "prozent": z.prozent, "betrag_cent": z.betrag_cent, "wann": wann, "rechnung": z.rechnung, "status": z.status})
    return zeilen
