"""Gutschein-Einlösung und -Prüfung für andere Apps (ph_kassa, ph_faktura) – Modul ``ph_shop.gutschein``.

Die Fachlogik liegt im Controller PH Gutschein (``PHGutschein.einloesen``/``pruefe_einloesbar``); dieses Modul
ist die stabile Server-Schnittstelle dafür: Gutschein per Name oder Klartextcode finden, idempotent einlösen,
Restwert liefern. Rechteprüfung macht der Aufrufer (Kassa-Page, Button); gebucht wird mit ignore_permissions.

    from ph_shop.gutschein import einloesen, pruefen
    pruefen("PH-ABCD-EFGH")                      → {"gutschein", "status", "rest_cent", "wert_cent", "einloesbar", "letzte4", "gueltig_bis"}
    einloesen(gutschein="PH-GS-2026-00001", betrag_cent=2500, kanal="Kassa",
              beleg_doctype="PH Kassenbeleg", beleg="SHOWROOM1-000012")
                                                 → {"gutschein", "rest_cent", "eingeloest_cent", "status", "bereits_gebucht"}
Idempotenz: gleicher beleg_doctype/beleg (oder gleicher idempotency_key im Hinweis) → vorhandene Einlösung, keine zweite Buchung.
"""

import frappe
from frappe import _
from frappe.utils import cint, getdate, nowdate

from ph_shop.ph_shop.doctype.ph_gutschein.ph_gutschein import EINLOESBAR, finde_nach_code

KANAELE = ("Showroom", "Online", "Kassa")


def _laden(gutschein=None, code=None):
    """Gutschein-Dokument per Name oder Klartextcode; wirft 404-artigen Fehler, wenn nicht gefunden."""
    doc = None
    if gutschein and frappe.db.exists("PH Gutschein", gutschein):
        doc = frappe.get_doc("PH Gutschein", gutschein)
    elif code:
        doc = finde_nach_code(code)
        if doc is None and frappe.db.exists("PH Gutschein", code):
            doc = frappe.get_doc("PH Gutschein", code)
    if doc is None:
        frappe.throw(_("Gutschein nicht gefunden."), frappe.DoesNotExistError)
    return doc


def pruefen(code_or_name):
    """Status und Restwert eines Gutscheins (Kassa-Page „Gutschein einlösen“). Kein Käufer, kein Code."""
    doc = _laden(gutschein=code_or_name, code=code_or_name)
    abgelaufen = bool(doc.gueltig_bis and getdate(doc.gueltig_bis) < getdate(nowdate()))
    return {
        "gutschein": doc.name,
        "status": doc.status,
        "wert_cent": cint(doc.wert_cent),
        "rest_cent": cint(doc.rest_cent),
        "waehrung": doc.waehrung or "EUR",
        "einloesbar": doc.status in EINLOESBAR and not abgelaufen and cint(doc.rest_cent) > 0,
        "abgelaufen": abgelaufen,
        "gueltig_bis": str(doc.gueltig_bis) if doc.gueltig_bis else None,
        "test": bool(doc.test),
        "letzte4": doc.code_letzte4,
        "art": doc.art,
    }


def _vorhandene_einloesung(doc, beleg_doctype, beleg, idempotency_key):
    for z in doc.einloesungen:
        if beleg_doctype and beleg and z.beleg_doctype == beleg_doctype and z.beleg == beleg:
            return z
        if idempotency_key and (z.hinweis or "").endswith(f"[{idempotency_key}]"):
            return z
    return None


def einloesen(*, gutschein=None, code=None, betrag_cent, kanal="Kassa", beleg_doctype=None, beleg=None, kontakt=None, hinweis=None, idempotency_key=None, zahlung_buchen=False):
    """Teilbetrag eines Gutscheins einlösen (Serverfunktion für ph_kassa/ph_faktura).

    kanal: Showroom | Online | Kassa (Select der Kindtabelle PH Gutschein Einloesung).
    zahlung_buchen: False = der Aufrufer bucht die PH Zahlung selbst (Kassenbeleg je Zahlart); True = Controller
    legt eine PH Zahlung (Kanal Gutschein) an.
    Rückgabe: {"gutschein", "rest_cent", "eingeloest_cent", "status", "zahlung", "bereits_gebucht"}.
    """
    betrag_cent = cint(betrag_cent)
    if betrag_cent <= 0:
        frappe.throw(_("Betrag muss größer als 0 Cent sein."))
    if kanal not in KANAELE:
        kanal = "Kassa" if str(kanal).lower().startswith("kassa") else "Showroom"
    doc = _laden(gutschein=gutschein, code=code)
    alt = _vorhandene_einloesung(doc, beleg_doctype, beleg, idempotency_key)
    if alt is not None:
        return {"gutschein": doc.name, "rest_cent": cint(doc.rest_cent), "eingeloest_cent": cint(alt.betrag_cent), "status": doc.status, "zahlung": alt.zahlung, "bereits_gebucht": True}
    if beleg_doctype and not frappe.db.exists("DocType", beleg_doctype):
        beleg_doctype, beleg = None, None
    text = (hinweis or "").strip()
    if idempotency_key:
        text = f"{text} [{idempotency_key}]".strip()
    doc.flags.ignore_permissions = True
    r = doc.einloesen(betrag_cent, kanal=kanal, beleg_doctype=beleg_doctype, beleg=beleg, hinweis=text[:140] or None, zahlung_buchen=bool(zahlung_buchen), kontakt=kontakt)
    return {"gutschein": doc.name, "rest_cent": cint(r.get("rest_cent")), "eingeloest_cent": betrag_cent, "status": r.get("status"), "zahlung": r.get("zahlung"), "bereits_gebucht": False}


def storniere_einloesung(*, gutschein, beleg_doctype, beleg, grund=None):
    """Einlösung zu einem stornierten Beleg zurückbuchen (Kassa-Stornobeleg): Restwert erhöhen, Status zurücksetzen.
    Idempotent: ohne passende Einlösung passiert nichts (None)."""
    from ph_shop.ph_shop import status as st

    doc = frappe.get_doc("PH Gutschein", gutschein)
    zeile = _vorhandene_einloesung(doc, beleg_doctype, beleg, None)
    if zeile is None or (zeile.hinweis or "").startswith("STORNO"):
        return None
    if doc.status in ("Gesperrt", "Erstattet"):
        frappe.throw(_("Gutschein ist {0} – Einlösung kann nicht zurückgebucht werden.").format(doc.status))
    betrag = cint(zeile.betrag_cent)
    rest = min(cint(doc.rest_cent) + betrag, cint(doc.wert_cent))
    gegen = doc.append("einloesungen", {"datum": frappe.utils.now_datetime(), "betrag_cent": -betrag, "rest_danach_cent": rest, "kanal": zeile.kanal, "beleg_doctype": beleg_doctype, "beleg": beleg, "mitarbeiter": frappe.session.user, "hinweis": f"STORNO {grund or ''}"[:140]})
    gegen.db_insert()
    frappe.db.set_value("PH Gutschein Einloesung", zeile.name, "hinweis", f"STORNO→{gegen.name}"[:140], update_modified=False)
    neu = "Aktiv" if rest >= cint(doc.wert_cent) else ("Teilweise eingeloest" if rest > 0 else "Eingeloest")
    doc.flags.ignore_permissions = True
    st.setzen(doc, neu, _("Einlösung {0} Cent zurückgebucht ({1})").format(betrag, beleg), None, {"rest_cent": rest, "rest_eur": rest / 100})
    return {"gutschein": doc.name, "rest_cent": rest, "status": neu}
