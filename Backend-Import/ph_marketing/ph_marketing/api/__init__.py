"""Whitelisted Methoden von ph_marketing für die Website (Token des Benutzers website@platzhirsch.studio).

Heute (src/lib/forms/newsletter.js): POST …/newsletter_website.api.subscribe_newsletter { email } → Website erwartet
2xx + JSON, antwortet dem Browser immer { success: true } (keine Adress-Enumeration). Neu identisch, plus optionale
Felder sprache, interessen, textversion, quelle, idempotency_key – und echtes Double-Opt-in.

Alle Methoden: ph_core.api.ph_api (Rolle, Rate-Limit, Idempotenz, Protokoll, Fehlerbild). Nie allow_guest.
Die Bestätigungs-/Abmelde-Links in den Mails zeigen auf Website-Seiten (PH Marketing Einstellungen bestaetigen_pfad /
abmelden_pfad); die Website ruft von dort confirm_newsletter(token) bzw. unsubscribe(token) auf.
"""

import frappe
from frappe import _

from ph_core.api import ApiFehler, pflicht, ph_api, text
from ph_marketing.ph_marketing import einblicke, einwilligung, events, newsletter
from ph_marketing.utils.regeln import DOI_ZWECKE, ZWECKE
from ph_marketing.utils.token import email_maskieren, email_normalisieren, email_plausibel


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=60, referenz=lambda r: ("PH Newsletter Abo", r.get("abo")))
def subscribe_newsletter(**d):
    """Wie heute: {email} → {"success": true}. Antwort neutral auch bei Duplikat."""
    pflicht(d, "email")
    email = email_normalisieren(d.get("email"))
    if not email_plausibel(email):
        raise ApiFehler("invalid", 400, _("E-Mail-Adresse ist ungültig."), {"field": "email"})
    r = newsletter.anmelden(
        email,
        sprache=text(d.get("sprache") or d.get("locale"), 2) or "de",
        interessen=d.get("interessen"),
        textversion=text(d.get("textversion") or d.get("einwilligung_text_version"), 80),
        quelle="website",
        quelle_detail=text(d.get("quelle") or d.get("seite"), 140),
        anrede_name=text(d.get("name"), 140),
        idempotency_key=None,
    )
    # „abo“ nur fürs Protokoll (Referenz); die Website bekommt keine Adresse zurück.
    return {"success": True, "doi": r["doi"], "abo": email}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=60)
def confirm_newsletter(token=None, **_d):
    """DOI-Bestätigung: {token} → {"status": bestaetigt|bereits_bestaetigt|abgelaufen|ungueltig}."""
    r = newsletter.bestaetigen(text(token, 128), kanal="website")
    if r["status"] == "ungueltig":
        raise ApiFehler("invalid_token", 404, _("Link ungültig."))
    if r["status"] == "abgelaufen":
        raise ApiFehler("expired", 410, _("Link abgelaufen. Bitte melden Sie sich erneut an."), {"status": "abgelaufen"})
    return r


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=60)
def unsubscribe(token=None, email=None, **_d):
    """Abmeldung per Token (Link aus jeder Mail). Ohne Token nur mit email → Abmeldung ohne Rückmeldung über Bestehen."""
    if token:
        r = newsletter.abmelden_mit_token(text(token, 128))
        if r["status"] == "ungueltig":
            raise ApiFehler("invalid_token", 404, _("Link ungültig."))
        return r
    email = email_normalisieren(email)
    if not email_plausibel(email):
        raise ApiFehler("invalid", 400, _("E-Mail-Adresse ist ungültig."))
    if frappe.db.exists("PH Newsletter Abo", email):
        abo = frappe.get_doc("PH Newsletter Abo", email)
        if abo.status != "Abgemeldet":
            newsletter.abmelden(abo, kanal="link", grund="Abmeldung per E-Mail-Formular")
    return {"status": "abgemeldet"}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=30, referenz=lambda r: ("PH Event", r.get("event")))
def register_event(**d):
    """Event-Anmeldung (Adventsabend): {event_id, name, email, telefon?, personen, nachricht?, textversion?}."""
    pflicht(d, "event_id", "name", "email")
    r = events.anmelden(
        text(d.get("event_id"), 80),
        text(d.get("name"), 140),
        d.get("email"),
        personen=d.get("personen") or 1,
        telefon=text(d.get("telefon"), 40),
        nachricht=text(d.get("nachricht") or d.get("ihre_nachricht"), 500),
        quelle="website",
        textversion=text(d.get("textversion") or d.get("einwilligung_text_version"), 80),
    )
    r["email"] = email_maskieren(d.get("email"))
    return r


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=30)
def cancel_event_registration(token=None, **_d):
    r = events.absagen_mit_token(text(token, 128))
    if r["status"] == "ungueltig":
        raise ApiFehler("invalid_token", 404, _("Link ungültig."))
    return r


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=60)
def get_event(event_id=None, **_d):
    """Öffentliche Eckdaten für die Website-Seite (ohne Teilnehmerdaten)."""
    pflicht({"event_id": event_id}, "event_id")
    if not frappe.db.exists("PH Event", event_id):
        raise ApiFehler("not_found", 404, _("Event nicht gefunden."))
    ev = frappe.get_doc("PH Event", event_id)
    return {"event": ev.name, "titel": ev.titel, "datum": str(ev.datum), "uhrzeit_von": str(ev.uhrzeit_von)[:5] if ev.uhrzeit_von else None, "uhrzeit_bis": str(ev.uhrzeit_bis)[:5] if ev.uhrzeit_bis else None, "ort": ev.ort, "status": ev.status, "kapazitaet": ev.kapazitaet, "plaetze_frei": ev.plaetze_frei, "warteliste": bool(ev.warteliste), "programm": ev.programm or "", "anmeldung_offen": ev.status == "Offen" or (ev.status == "Ausgebucht" and bool(ev.warteliste))}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=60, referenz=lambda r: ("PH Einwilligung", r.get("einwilligung")))
def record_consent(**d):
    """Einwilligung aus Website-Formularen protokollieren (Foto-Referenz, WhatsApp, Merkliste, Planer, Rückmeldung).
    {email, zweck, textversion, quelle?, sprache?, interessen?, daten?, referenz_doctype?, referenz_name?}
    Zwecke mit E-Mail-Werbung bekommen eine DOI-Mail (Token), die übrigen gelten mit dem Formular-Nachweis."""
    pflicht(d, "email", "zweck", "textversion")
    zweck = text(d.get("zweck"), 40)
    if zweck not in ZWECKE:
        raise ApiFehler("invalid", 400, _("Unbekannter Zweck."), {"field": "zweck"})
    email = email_normalisieren(d.get("email"))
    if not email_plausibel(email):
        raise ApiFehler("invalid", 400, _("E-Mail-Adresse ist ungültig."), {"field": "email"})
    if zweck == "newsletter":
        r = newsletter.anmelden(email, sprache=text(d.get("sprache"), 2) or "de", interessen=d.get("interessen"), textversion=text(d.get("textversion"), 80), quelle_detail=text(d.get("quelle"), 140))
        return {"success": True, "doi": r["doi"], "einwilligung": None}
    referenz = (text(d.get("referenz_doctype"), 80), text(d.get("referenz_name"), 140)) if d.get("referenz_doctype") and d.get("referenz_name") else None
    if referenz and not frappe.db.exists("DocType", referenz[0]):
        referenz = None
    doi = zweck in DOI_ZWECKE
    token_hash = None
    token = None
    if doi:
        from ph_marketing.utils.token import hash_token, neuer_token

        token = neuer_token()
        token_hash = hash_token(token)
    e = einwilligung.protokollieren(email, zweck, text(d.get("textversion"), 80), quelle=text(d.get("quelle"), 140), kanal="website", sprache=text(d.get("sprache"), 2) or "de", interessen=text(d.get("interessen"), 500), daten=d.get("daten"), doi_token_hash=token_hash, referenz=referenz)
    if doi:
        from ph_marketing.ph_marketing import versand
        from ph_marketing.utils.regeln import ZWECK_TEXT

        betreff, html = versand.rendern("doi_bestaetigen", {"zweck_text": ZWECK_TEXT[zweck], "gueltig_stunden": einwilligung.einstellungen()["doi_gueltig_stunden"], "bestaetigen_url": versand.bestaetigen_url(token), "anrede": "Guten Tag"})
        versand.sende(email, betreff, html, referenz_doctype="PH Einwilligung", referenz_name=e.name)
    return {"success": True, "doi": doi, "einwilligung": e.name}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=60)
def confirm_consent(token=None, **_d):
    """DOI für Einwilligungen außerhalb des Newsletters (record_consent mit doi=true)."""
    from ph_marketing.utils.token import hash_token, token_plausibel

    if not token_plausibel(token):
        raise ApiFehler("invalid_token", 404, _("Link ungültig."))
    name = frappe.db.get_value("PH Einwilligung", {"doi_token_hash": hash_token(token)}, "name")
    if not name:
        # Newsletter-Token? → dorthin weiterreichen
        r = newsletter.bestaetigen(text(token, 128), kanal="website")
        if r["status"] == "ungueltig":
            raise ApiFehler("invalid_token", 404, _("Link ungültig."))
        return r
    e = frappe.get_doc("PH Einwilligung", name)
    if e.status == "Bestaetigt":
        return {"status": "bereits_bestaetigt", "zweck": e.zweck}
    from frappe.utils import add_to_date, get_datetime, now_datetime

    if get_datetime(e.doi_gesendet_am or e.zeitpunkt) < add_to_date(now_datetime(), hours=-einwilligung.einstellungen()["doi_gueltig_stunden"]):
        raise ApiFehler("expired", 410, _("Link abgelaufen."))
    einwilligung.bestaetigen(name, kanal="website")
    return {"status": "bestaetigt", "zweck": e.zweck}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=10, referenz=lambda r: ("PH Einblick Tag", r.get("datum")))
def tag_speichern(datum=None, schema=None, meta=None, teil=None, seiten=None, heatmaps=None, pfade=None, signale=None, planer=None, **_d):
    """Besucher-Einblicke Tagesaggregat (Upsert), src/lib/einblicke/frappe.server.js – heute platzhirsch_einblicke.api.tag_speichern."""
    pflicht({"datum": datum}, "datum")
    return einblicke.tag_speichern(datum, schema=schema, meta=meta, teil=teil, seiten=seiten, heatmaps=heatmaps, pfade=pfade, signale=signale, planer=planer)
