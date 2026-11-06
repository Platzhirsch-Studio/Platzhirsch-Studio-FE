"""Whitelisted Backoffice-Methoden von ph_shop (Desk/Next-Backoffice mit Benutzer-Session, nicht Website-Token).

  create_phone_order(kunde, positionen, …)      Telefon-/Showroom-Bestellung anlegen, optional Zahlungslink erzeugen/senden
  check_voucher(code)                           Gutschein prüfen (Status, Restwert, art, steuersatz) für Shop-/Kassa-Rollen
  issue_voucher(wert_cent, …)                   Gutschein ausstellen (Kulanz/Geschenk, Leitung) – Klartext genau einmal
  sell_voucher(wert_cent, beleg_doctype, beleg, idempotency_key, …)   Verkauf im Showroom (Kassa) – idempotent
  cancel_voucher_sale(beleg_doctype, beleg, grund)                    Kassa-Storno eines Gutscheinverkaufs
  cancel_voucher_redemption(gutschein, beleg_doctype, beleg, grund)  Fehlbuchung einer Einlösung zurücknehmen (Leitung)
  credit_voucher(gutschein, betrag_cent, …)     Restwert gutschreiben (Kassa-Retoure auf Gutschein)
Rechte: Rollenprüfung je Methode; gebucht wird serverseitig mit ignore_permissions (wie ph_shop.zahlung).
Quelle der Lücken: Marktresearch/digital/backoffice/10-konzept-shop.md §10, 10-konzept-kassa.md §5/§15.
"""

import json

import frappe
from frappe import _
from frappe.utils import cint

SHOP = {"PH Shop Mitarbeiter", "PH Shop Leitung", "PH Geschäftsführung", "System Manager"}
LEITUNG = {"PH Shop Leitung", "PH Geschäftsführung", "System Manager"}
KASSA = {"PH Kassa Mitarbeiter", "PH Kassa Leitung"}


def _rolle(erlaubt):
    if frappe.session.user == "Administrator":
        return
    if not (set(frappe.get_roles()) & set(erlaubt)):
        frappe.throw(_("Keine Berechtigung für diese Aktion."), frappe.PermissionError)


def _liste(wert):
    if isinstance(wert, str):
        try:
            return json.loads(wert or "[]")
        except ValueError:
            frappe.throw(_("Ungültiges JSON."))
    return wert or []


# ─────────────────────────────── Telefonbestellung ───────────────────────────────

@frappe.whitelist(methods=["POST"])
def create_phone_order(kunde, positionen, lieferart="versand", adresse=None, versand_cent=0, notiz_kunde=None, kontakt=None, bestellart="Telefon", zahlungslink=1, senden=0, sprache="de", idempotency_key=None):
    """Manuelle Bestellung im Backoffice (Telefon/E-Mail/Showroom).

    kunde: {name, email, telefon}; adresse: {land, plz, ort, strasse, hausnr, zusatz}
    positionen: [{produkt?, bezeichnung, marke?, kategorie?, menge, einzel_cent, ust_klasse?, variante?, variante_name?}]
    Zahlung: Versand → Zahlungslink (Stripe Checkout, Fernabsatz – Widerrufsbelehrung geht mit der Linkmail);
    Abholung + bestellart Showroom → Reservierung (zahlung vorort, Bezahlung an der Kassa).
    → {"bestellung", "status", "gesamt_cent", "zahlungslink": {url, gueltig_bis, simuliert}|None}
    """
    _rolle(SHOP)
    kunde = kunde if isinstance(kunde, dict) else json.loads(kunde or "{}")
    adresse = adresse if isinstance(adresse, dict) else json.loads(adresse or "{}")
    zeilen = _liste(positionen)
    if not zeilen:
        frappe.throw(_("Mindestens eine Position ist nötig."))
    if len(zeilen) > 50:
        frappe.throw(_("Zu viele Positionen."))
    if idempotency_key and frappe.db.exists("PH Bestellung", {"idempotency_key": idempotency_key}):
        name = frappe.db.get_value("PH Bestellung", {"idempotency_key": idempotency_key}, "name")
        doc = frappe.get_doc("PH Bestellung", name)
        return {"bestellung": name, "status": doc.status, "gesamt_cent": cint(doc.gesamt_cent), "zahlungslink": {"url": doc.zahlungslink_url} if doc.zahlungslink_url else None, "bereits_angelegt": True}
    pos = []
    for z in zeilen:
        menge = max(cint(z.get("menge")) or 1, 1)
        einzel = cint(z.get("einzel_cent"))
        if einzel < 0:
            frappe.throw(_("Preis darf nicht negativ sein."))
        if not (z.get("bezeichnung") or "").strip():
            frappe.throw(_("Bezeichnung fehlt."))
        pos.append({
            "produkt": z.get("produkt") if z.get("produkt") and frappe.db.exists("PH Produkt", z.get("produkt")) else None,
            "bezeichnung": z.get("bezeichnung")[:140],
            "marke": z.get("marke"), "kategorie": z.get("kategorie"), "variante": z.get("variante"), "variante_name": z.get("variante_name"),
            "menge": menge, "einzel_cent": einzel, "summe_cent": einzel * menge, "ust_klasse": z.get("ust_klasse"),
        })
    showroom = lieferart == "abholung" and bestellart == "Showroom"
    doc = frappe.get_doc({
        "doctype": "PH Bestellung",
        "bestellart": bestellart if bestellart in ("Telefon", "Showroom") else "Telefon",
        "quelle": "backoffice",
        "lieferart": lieferart,
        "zahlung": "vorort" if showroom else "online",
        "sprache": sprache if sprache in ("de", "en", "fr", "it") else "de",
        "kontakt": kontakt if kontakt and frappe.db.exists("PH Kontakt", kontakt) else None,
        "kunde_name": (kunde.get("name") or "")[:140],
        "kunde_email": kunde.get("email"),
        "kunde_telefon": kunde.get("telefon"),
        "adresse_land": adresse.get("land") or ("AT" if lieferart == "versand" else None),
        "adresse_plz": adresse.get("plz"), "adresse_ort": adresse.get("ort"), "adresse_strasse": adresse.get("strasse"),
        "adresse_hausnr": adresse.get("hausnr"), "adresse_zusatz": adresse.get("zusatz"),
        "versand_cent": cint(versand_cent) if lieferart == "versand" else 0,
        "notiz_kunde": notiz_kunde,
        "zugewiesen_an": frappe.session.user,
        "bestaetigung_unterdruecken": 0 if cint(senden) else 1,
        "idempotency_key": idempotency_key,
        "positionen": pos,
    })
    doc.insert()
    link = None
    if not showroom and cint(zahlungslink) and cint(doc.gesamt_cent) > 0:
        link = doc.zahlungslink_erstellen(senden=cint(senden))
    doc.reload()
    return {"bestellung": doc.name, "status": doc.status, "gesamt_cent": cint(doc.gesamt_cent), "zahlungslink": link, "bereits_angelegt": False}


# ─────────────────────────────── Gutscheine ───────────────────────────────

@frappe.whitelist(methods=["GET", "POST"])
def check_voucher(code):
    """Status/Restwert/Steuer für Shop- und Kassa-Rollen (ph_shop.gutschein.pruefen ist nicht whitelisted)."""
    from ph_shop.gutschein import pruefen

    _rolle(SHOP | KASSA)
    return pruefen(code)


@frappe.whitelist(methods=["POST"])
def issue_voucher(wert_cent, art=None, motiv="schlicht", empfaenger=None, grusstext=None, kaeufer_name=None, kaeufer_email=None, kontakt=None, grund=None, senden_an=None, test=0, ust_satz_promille=None, idempotency_key=None):
    """Gutschein ohne Verkauf ausstellen (Kulanz, Gewinnspiel, Ersatz) – nur Leitung, Grund Pflicht.
    Klartext-Code genau einmal in der Antwort; PDF (mit QR) wird gespeichert und optional gesendet."""
    from ph_shop.ph_shop.doctype.ph_gutschein.ph_gutschein import ausstellen

    _rolle(LEITUNG)
    if not (grund or "").strip():
        frappe.throw(_("Bitte einen Grund angeben (z. B. Kulanz zu Servicefall …)."))
    doc, code = ausstellen(cint(wert_cent), test=bool(cint(test)), kanal="Showroom", motiv=motiv, empfaenger=empfaenger, grusstext=grusstext, kaeufer={"name": kaeufer_name, "email": kaeufer_email, "kontakt": kontakt}, quelle="backoffice", art=art, ust_satz_promille=ust_satz_promille, idempotency_key=idempotency_key)
    if code is None:
        return {"gutschein": doc.name, "code": None, "letzte4": doc.code_letzte4, "pdf": doc.pdf, "gesendet": False, "bereits_ausgestellt": True}
    doc.add_comment("Info", _("Ausgestellt ohne Verkauf: {0}").format(grund))
    pdf = doc.pdf_erzeugen(code)
    gesendet = doc.pdf_senden(senden_an, code_klartext=code) if senden_an else False
    return {"gutschein": doc.name, "code": code, "letzte4": doc.code_letzte4, "pdf": pdf, "gesendet": bool(gesendet), "bereits_ausgestellt": False}


@frappe.whitelist(methods=["POST"])
def sell_voucher(wert_cent, beleg_doctype, beleg, idempotency_key, position=None, zahlung=None, kontakt=None, kaeufer_name=None, kaeufer_email=None, motiv="schlicht", empfaenger=None, grusstext=None, art=None, ust_satz_promille=None, test=0):
    """Verkauf im Showroom (ph_kassa: nach Buchung des Kassenbelegs je Position „Gutschein Verkauf“)."""
    from ph_shop.gutschein import ausstellen_verkauf

    _rolle(SHOP | KASSA)
    return ausstellen_verkauf(wert_cent=wert_cent, beleg_doctype=beleg_doctype, beleg=beleg, idempotency_key=idempotency_key, position=position, zahlung=zahlung, kontakt=kontakt, kaeufer_name=kaeufer_name, kaeufer_email=kaeufer_email, motiv=motiv, empfaenger=empfaenger, grusstext=grusstext, art=art, ust_satz_promille=ust_satz_promille, test=bool(cint(test)))


@frappe.whitelist(methods=["POST"])
def cancel_voucher_sale(beleg_doctype, beleg, grund=None):
    from ph_shop.gutschein import verkauf_stornieren

    _rolle(LEITUNG | {"PH Kassa Leitung"})
    return verkauf_stornieren(beleg_doctype=beleg_doctype, beleg=beleg, grund=grund)


@frappe.whitelist(methods=["POST"])
def cancel_voucher_redemption(gutschein, beleg_doctype, beleg, grund=None):
    """Fehlbuchung einer Einlösung zurücknehmen (10-konzept-shop §10: storniere_einloesung nicht whitelisted)."""
    from ph_shop.gutschein import storniere_einloesung

    _rolle(LEITUNG | {"PH Kassa Leitung"})
    if not (grund or "").strip():
        frappe.throw(_("Bitte einen Grund angeben."))
    r = storniere_einloesung(gutschein=gutschein, beleg_doctype=beleg_doctype, beleg=beleg, grund=grund)
    if r is None:
        frappe.throw(_("Keine passende Einlösung gefunden (oder schon zurückgebucht)."))
    return r


@frappe.whitelist(methods=["POST"])
def credit_voucher(gutschein, betrag_cent, beleg_doctype=None, beleg=None, grund=None, idempotency_key=None):
    from ph_shop.gutschein import gutschreiben

    _rolle(LEITUNG | {"PH Kassa Leitung"})
    return gutschreiben(gutschein=gutschein, betrag_cent=betrag_cent, beleg_doctype=beleg_doctype, beleg=beleg, grund=grund, idempotency_key=idempotency_key)
