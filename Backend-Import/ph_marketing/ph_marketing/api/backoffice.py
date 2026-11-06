"""Whitelisted Methoden für das eigene Backoffice (Desk-/Backoffice-Benutzer, nicht die Website).

Konzept Marketing §9.3: L1 Anmeldung mit DOI aus dem Backoffice, L2 Empfängerliste, L3 Stapelaktionen, L5 Trockenlauf
Kundenreise, L15 Prüfung der Auftrags-Datenquelle; dazu Segment-Vorschau und Event-Check-in.
Alle über ph_core.api.ph_api(intern=True): Guest 403, Protokoll, Rate-Limit. Rollen je Methode explizit.
"""

import frappe
from frappe import _
from frappe.utils import cint, nowdate

from ph_core.api import ApiFehler, liste, pflicht, ph_api, rolle_pruefen, text
from ph_marketing.ph_marketing import checkin, newsletter, segmente
from ph_marketing.utils.token import email_maskieren, email_normalisieren, email_plausibel

MITARBEITER = ("PH Marketing Mitarbeiter", "PH Marketing Leitung", "System Manager", "PH Backoffice-Admin")
LEITUNG = ("PH Marketing Leitung", "System Manager", "PH Backoffice-Admin")
STAPEL_MAX = 200


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, idempotent=True, limit_pro_minute=60, referenz=lambda r: ("PH Newsletter Abo", r.get("abo")))
def create_subscription(**d):
    """L1: Anmeldung im Showroom/am Telefon → Abo unbestätigt + DOI-Mail. Pflicht: Hinweis auf die Bestätigungsmail."""
    rolle_pruefen(*MITARBEITER)
    pflicht(d, "email")
    if not cint(d.get("hinweis_bestaetigt")):
        raise ApiFehler("invalid", 400, _("Bitte bestätigen, dass die Person auf die Bestätigungsmail hingewiesen wurde."), {"field": "hinweis_bestaetigt"})
    email = email_normalisieren(d.get("email"))
    if not email_plausibel(email):
        raise ApiFehler("invalid", 400, _("E-Mail-Adresse ist ungültig."), {"field": "email"})
    quelle = text(d.get("quelle"), 20) or "backoffice"
    r = newsletter.anmelden(
        email,
        sprache=text(d.get("sprache"), 2) or "de",
        interessen=d.get("interessen"),
        textversion=text(d.get("textversion"), 80) or None,
        quelle=quelle if quelle in ("showroom", "event", "backoffice") else "backoffice",
        quelle_detail=text(d.get("quelle_detail"), 140) or f"backoffice:{frappe.session.user}",
        kanal="backoffice",
        anrede_name=text(d.get("anrede_name"), 140),
    )
    return {"success": True, "doi": r["doi"], "abo": email}


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, limit_pro_minute=10)
def resend_doi_bulk(abos=None, **_d):
    """L3: DOI erneut senden für mehrere Abos – nur unbestätigte, Sperre 60 min nach letzter DOI-Mail."""
    rolle_pruefen(*MITARBEITER)
    from frappe.utils import add_to_date, get_datetime, now_datetime

    erg = {"gesendet": [], "uebersprungen": []}
    for name in liste(abos)[:STAPEL_MAX]:
        if not frappe.db.exists("PH Newsletter Abo", name):
            erg["uebersprungen"].append({"abo": email_maskieren(name), "grund": "nicht_gefunden"})
            continue
        abo = frappe.get_doc("PH Newsletter Abo", name)
        if abo.status != newsletter.UNBESTAETIGT:
            erg["uebersprungen"].append({"abo": email_maskieren(name), "grund": abo.status})
            continue
        if abo.doi_gesendet_am and get_datetime(abo.doi_gesendet_am) > add_to_date(now_datetime(), hours=-1):
            erg["uebersprungen"].append({"abo": email_maskieren(name), "grund": "sperre_60_min"})
            continue
        newsletter.doi_erneut_senden(abo)
        erg["gesendet"].append(email_maskieren(name))
    return {"gesendet": len(erg["gesendet"]), "uebersprungen": erg["uebersprungen"]}


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, limit_pro_minute=10)
def unsubscribe_bulk(abos=None, kanal="backoffice", grund=None, **_d):
    """L3: mehrere Abos abmelden (Kanal backoffice/antwort_mail/import), Einwilligung widerrufen."""
    rolle_pruefen(*MITARBEITER)
    kanal = kanal if kanal in ("backoffice", "antwort_mail", "import") else "backoffice"
    n, ueber = 0, 0
    for name in liste(abos)[:STAPEL_MAX]:
        if not frappe.db.exists("PH Newsletter Abo", name):
            ueber += 1
            continue
        abo = frappe.get_doc("PH Newsletter Abo", name)
        if abo.status in ("Abgemeldet", "Bounce", "Beschwerde"):
            ueber += 1
            continue
        newsletter.abmelden(abo, kanal=kanal, grund=text(grund, 140))
        n += 1
    return {"abgemeldet": n, "uebersprungen": ueber}


@frappe.whitelist(methods=["GET", "POST"])
@ph_api(intern=True, limit_pro_minute=30)
def preview_segment(segment=None, **_d):
    """Segment-Vorschau: Treffer, zulässige Empfänger, Ausschlussgründe, 20 Beispiele (maskiert)."""
    rolle_pruefen(*MITARBEITER)
    pflicht({"segment": segment}, "segment")
    if not frappe.db.exists("PH Segment", segment):
        raise ApiFehler("not_found", 404, _("Segment nicht gefunden."))
    return segmente.vorschau(frappe.get_doc("PH Segment", segment), speichern=1)


@frappe.whitelist(methods=["GET", "POST"])
@ph_api(intern=True, limit_pro_minute=30)
def list_recipients(ausgabe=None, start=0, limit=100, **_d):
    """L2: Empfänger einer Newsletter-Ausgabe (Mitarbeiter maskiert, Leitung voll)."""
    rolle_pruefen(*MITARBEITER)
    pflicht({"ausgabe": ausgabe}, "ausgabe")
    if not frappe.db.exists("PH Newsletter Ausgabe", ausgabe):
        raise ApiFehler("not_found", 404, _("Ausgabe nicht gefunden."))
    return frappe.get_doc("PH Newsletter Ausgabe", ausgabe).empfaenger_liste(start=start, limit=limit)


@frappe.whitelist(methods=["POST"])
@ph_api(intern=True, limit_pro_minute=240)
def event_check_in(code=None, event=None, zeile=None, personen=None, **_d):
    """Einlass per QR-Scan (code) oder Liste (event+zeile). Doppel-Check-in → status „bereits“."""
    rolle_pruefen(*MITARBEITER)
    if not code and not (event and zeile):
        raise ApiFehler("invalid", 400, _("Code oder Event und Zeile angeben."))
    r = checkin.einchecken(code=text(code, 200) or None, event=event, zeile=zeile, personen=personen)
    if r["status"] == "ungueltig":
        raise ApiFehler("not_found", 404, _("Code ungültig oder Anmeldung nicht gefunden."))
    return r


@frappe.whitelist(methods=["GET", "POST"])
@ph_api(intern=True, limit_pro_minute=10)
def journey_dry_run(reise=None, **_d):
    """L5: Wer wäre heute für diese Kundenreise fällig? Nichts wird angelegt oder gesendet."""
    rolle_pruefen(*MITARBEITER)
    from ph_marketing.ph_marketing import engine

    pflicht({"reise": reise}, "reise")
    if not frappe.db.exists("PH Kundenreise", reise):
        raise ApiFehler("not_found", 404, _("Kundenreise nicht gefunden."))
    doc = frappe.get_doc("PH Kundenreise", reise)
    faellig, gesperrt = [], {}
    for t in doc.trigger:
        for k in engine.faellige_kontakte(doc, t, nowdate()):
            key = engine.schluessel(doc, t.idx if doc.reise_id == "merkliste" else 0, k, nowdate())
            if frappe.db.exists("PH Reise Versand", {"schluessel": key}):
                gesperrt["bereits_geplant"] = gesperrt.get("bereits_geplant", 0) + 1
                continue
            ok, grundlage, grund = engine.darf_senden(doc, k)
            if ok:
                faellig.append({"email": email_maskieren(k.get("email")), "grundlage": grundlage})
            else:
                gesperrt[grund] = gesperrt.get(grund, 0) + 1
    return {"faellig": len(faellig), "beispiele": faellig[:20], "gesperrt": gesperrt}


@frappe.whitelist(methods=["GET", "POST"])
@ph_api(intern=True, limit_pro_minute=10)
def check_order_source(**_d):
    """L15: Datenquelle Aufträge (PH Marketing Einstellungen) – existieren DocType und zugeordnete Felder?"""
    rolle_pruefen(*LEITUNG)
    from ph_marketing.ph_marketing.einstellungen import einstellungen

    e = einstellungen()
    dt = e["auftrags_doctype"]
    if not dt:
        return {"ok": False, "doctype": None, "felder": [], "hinweis": _("Keine Datenquelle eingetragen.")}
    if not frappe.db.exists("DocType", dt):
        return {"ok": False, "doctype": dt, "felder": [], "hinweis": _("DocType {0} ist nicht installiert.").format(dt)}
    meta = frappe.get_meta(dt)
    felder = []
    for schluessel, feld in e["felder"].items():
        if not feld:
            continue
        felder.append({"einstellung": schluessel, "feld": feld, "vorhanden": bool(meta.has_field(feld) or feld in ("name", "owner", "creation", "modified"))})
    return {"ok": all(f["vorhanden"] for f in felder), "doctype": dt, "felder": felder}
