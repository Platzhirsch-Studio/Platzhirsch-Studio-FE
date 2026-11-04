"""Anbindung an die gemeinsame Zahlungs-DocType PH Zahlung (ph_shop) – PLAN.md Abschnitt 5.

Echte Signatur in ph_shop/ph_shop/zahlung.py (Modul ``ph_shop.zahlung``, keyword-only):

    buche(*, kanal, betrag_cent, art="Eingang", bezug_doctype=None, bezug=None, waehrung="EUR", status="Bezahlt",
          zeitpunkt=None, kontakt=None, stripe_payment_intent=None, …, zahlungsreferenz=None, bank_referenz=None,
          gutschein=None, notiz=None, ursprung=None, idempotency_key=None, quelle="backoffice", submit=None) -> Document

Dieser Wrapper behält die kurze Positions-Signatur der Faktura-Aufrufer (Rechnung, Gutschrift, Eingangsrechnung,
Bankumsatz) bei, ruft ph_shop keyword-korrekt auf und gibt den Namen der gebuchten PH Zahlung zurück.
ph_shop ist required_app von ph_faktura – es gibt keinen Fallback mehr, der PH Zahlung direkt anlegt.
Außerdem: zahlung_auf_rechnung() – OP-Fortschreibung je Rechnung, Statuswechsel, UVA-Fälligkeit der Anzahlung.
"""

import frappe
from frappe import _
from frappe.utils import getdate, nowdate

from ph_faktura import journal

KANAELE = ("Stripe Checkout", "Stripe Terminal", "Stripe Link", "Bar", "Karte extern", "Ueberweisung", "Gutschein", "Verrechnung")


def buche(art, kanal, betrag_cent, bezug_doctype, bezug, zeitpunkt=None, kontakt=None, waehrung="EUR", zahlungsreferenz=None, bank_referenz=None, stripe_payment_intent=None, notiz=None, idempotency_key=None, quelle="backoffice"):
    """Bucht eine PH Zahlung über ph_shop.zahlung.buche → name der PH Zahlung.

    ph_shop legt an und submitted; dabei läuft der doc_events-Handler ereignisse.zahlung_gebucht. Weil die
    Faktura-Aufrufer (zahlung_erfassen, Bankumsatz) die OP-Zeile selbst schreiben, setzt dieser Wrapper
    frappe.flags.ph_faktura_bucht – der Handler überspringt dann; zusätzlich ist zahlung_auf_rechnung idempotent je zahlung_name.
    """
    if kanal not in KANAELE:
        frappe.throw(_("Unbekannter Zahlungskanal: {0}").format(kanal))
    if int(betrag_cent or 0) <= 0:
        frappe.throw(_("Zahlungsbetrag muss größer 0 sein."))
    from ph_shop.zahlung import buche as shop_buche

    frappe.flags.ph_faktura_bucht = True  # ereignisse.zahlung_gebucht überspringt die Rück-Verbuchung (Aufrufer schreibt OP selbst)
    try:
        doc = shop_buche(
            kanal=kanal,
            betrag_cent=int(betrag_cent),
            art=art,
            bezug_doctype=bezug_doctype,
            bezug=bezug,
            waehrung=waehrung or "EUR",
            zeitpunkt=zeitpunkt,
            kontakt=kontakt,
            stripe_payment_intent=stripe_payment_intent,
            zahlungsreferenz=zahlungsreferenz,
            bank_referenz=bank_referenz,
            notiz=notiz,
            idempotency_key=idempotency_key,
            quelle=quelle,
        )
    finally:
        frappe.flags.ph_faktura_bucht = False
    return doc.name


def zahlung_auf_rechnung(rechnung, betrag_cent, kanal, datum=None, zahlung_name=None, hinweis=None):
    """Schreibt einen Zahlungseingang in die OP-Tabelle der Rechnung (PH Rechnung Zahlung), aktualisiert
    bezahlt/offen/status, UVA-Fälligkeit (Anzahlung: Ist) und den Auftragsstand. Idempotent je zahlung_name.
    rechnung: Document (docstatus 1)."""
    if isinstance(rechnung, str):
        rechnung = frappe.get_doc("PH Rechnung", rechnung)
    if rechnung.docstatus != 1:
        frappe.throw(_("Zahlungen können nur gestellten Rechnungen zugeordnet werden ({0}).").format(rechnung.name))
    if rechnung.status == "Storniert":
        frappe.throw(_("Rechnung {0} ist storniert.").format(rechnung.name))
    if zahlung_name and any(z.zahlung == zahlung_name for z in rechnung.zahlungen):
        return rechnung
    betrag_cent = int(betrag_cent or 0)
    datum = getdate(datum or nowdate())
    rechnung.append("zahlungen", {"zahlung": zahlung_name, "datum": datum, "kanal": kanal, "betrag_cent": betrag_cent, "hinweis": (hinweis or "")[:140]})
    bezahlt = sum(int(z.betrag_cent or 0) for z in rechnung.zahlungen)
    offen = int(rechnung.zahlbar_cent or 0) - bezahlt
    status = rechnung.status
    bezahlt_am = rechnung.bezahlt_am
    if offen <= 0:
        status = "Bezahlt"
        bezahlt_am = datum
    elif bezahlt > 0:
        status = "Teilbezahlt" if rechnung.mahnstufe == 0 else rechnung.status
    rechnung.bezahlt_cent = bezahlt
    rechnung.offen_cent = max(offen, 0)
    rechnung.status = status
    rechnung.workflow_state = f"PH {status}"
    rechnung.bezahlt_am = bezahlt_am
    if rechnung.art == "Anzahlungsrechnung" and rechnung.ust_faelligkeit != "faellig":
        # USt der Anzahlung wird mit Vereinnahmung geschuldet (§ 19 Abs 2 Z 1 lit a UStG)
        rechnung.ust_faelligkeit = "faellig"
        rechnung.ust_faellig_am = datum
        rechnung.uva_monat = datum.strftime("%Y-%m")
    # Felder sind allow_on_submit; validate() der Rechnung überspringt gebuchte Belege.
    rechnung.flags.ignore_permissions = True
    rechnung.save()
    rechnung.add_comment("Info", _("Zahlung {0} über {1} ({2})").format(zahlung_name or "", frappe.format_value(betrag_cent / 100, {"fieldtype": "Currency"}), kanal))
    journal.schreibe("Zahlung", rechnung, betrag_cent, f"{kanal} {zahlung_name or ''} {hinweis or ''}".strip())
    if rechnung.auftrag:
        try:
            frappe.get_doc("PH Auftragsbestaetigung", rechnung.auftrag).stand_aktualisieren(speichern=True)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Auftragsbestaetigung: Stand nach Zahlung")
    return rechnung


def zahlung_auf_eingangsrechnung(er, betrag_cent, datum=None, zahlung_name=None, bankumsatz=None):
    if isinstance(er, str):
        er = frappe.get_doc("PH Eingangsrechnung", er)
    if er.status not in ("Freigegeben", "Bezahlt"):
        frappe.throw(_("Eingangsrechnung {0} ist nicht freigegeben.").format(er.name))
    bezahlt = int(er.bezahlt_cent or 0) + int(betrag_cent or 0)
    werte = {"bezahlt_cent": bezahlt, "zahlung": zahlung_name or er.zahlung, "bankumsatz": bankumsatz or er.bankumsatz}
    if bezahlt >= int(er.zahlbetrag_cent or er.brutto_cent or 0):
        werte.update({"status": "Bezahlt", "workflow_state": "PH Bezahlt", "bezahlt_am": getdate(datum or nowdate()), "zahllauf": 0})
    er.db_set(werte, update_modified=True)
    journal.schreibe("Eingangsrechnung", er, betrag_cent, f"Zahlung {zahlung_name or ''}")
    return er
