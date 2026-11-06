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
from ph_marketing.utils.attribution import utm_bereinigen
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
    _kontaktpunkt(d, "Newsletter-Anmeldung", email, ("PH Newsletter Abo", email))
    # „abo“ nur fürs Protokoll (Referenz); die Website bekommt keine Adresse zurück.
    return {"success": True, "doi": r["doi"], "abo": email}


def _kontaktpunkt(d, art, email, referenz):
    """UTM aus den Formularparametern (utm_source/medium/campaign/content/term) → PH Kampagne Kontaktpunkt."""
    utm = utm_bereinigen(d)
    if not utm.get("utm_campaign"):
        return
    try:
        from ph_marketing.ph_marketing import kampagnen

        kampagnen.kontaktpunkt(utm, art, email=email, referenz=referenz)
    except Exception:  # noqa: BLE001 – Attribution darf die Anmeldung nie verhindern
        frappe.log_error(title=f"PH Marketing Kontaktpunkt {art}")


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
        begleitung=text(d.get("begleitung"), 140),
        utm=utm_bereinigen(d),
    )
    r["email"] = email_maskieren(d.get("email"))
    return r


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=120)
def unsubscribe_one_click(token=None, body=None, **_d):
    """RFC 8058 One-Click aus dem Mail-Client: Website-Route (One-Click-Pfad) nimmt den POST an und reicht
    {token, body} weiter. body muss „List-Unsubscribe=One-Click“ sein (sonst 400). Antwort ohne Personendaten."""
    from ph_marketing.utils.mail_ereignis import one_click_gueltig

    if not one_click_gueltig(body or ""):
        raise ApiFehler("invalid", 400, _("Kein One-Click-Abmeldeaufruf."))
    r = newsletter.abmelden_mit_token(text(token, 128), kanal="one_click")
    if r["status"] == "ungueltig":
        raise ApiFehler("invalid_token", 404, _("Link ungültig."))
    return {"status": r["status"]}


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


# ── Ideenboard teilen (src/lib/ideenboard, Speicher-Schnittstelle localStore.js) ────────────────────────────────
# Die Website erzeugt boardId/shareId/adminSecret (ids.js) und prüft den Verwaltungsschlüssel selbst
# (service.js manageShared → matchesHash). Hier liegen nur boardId und die SHA-256-Hashes. Antworten enthalten die
# Hashes – nur für den Website-Server (Token), nie an den Browser weiterreichen (publicView/ownerView bildet die Website).


def _json_param(wert):
    if isinstance(wert, str):
        import json

        try:
            return json.loads(wert)
        except ValueError:
            raise ApiFehler("invalid", 400, _("JSON ungültig."), {"field": "record"})
    return wert


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=60, referenz=lambda r: ("PH Ideenboard", r["record"]["boardId"]))
def create_ideenboard(record=None, **_d):
    """localStore.create(record): {record} (model.js createRecord) → {record}; 409 conflict bei vorhandener boardId."""
    from ph_marketing.ph_marketing import ideenboard

    return {"record": ideenboard.anlegen(_json_param(record) or {})}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=240)
def get_ideenboard(board_id=None, **_d):
    """localStore.get(boardId) → {record} oder {record: null} (unbekannt/abgelaufen)."""
    from ph_marketing.ph_marketing import ideenboard

    return {"record": ideenboard.lesen(text(board_id, 40))}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=240)
def get_ideenboard_by_share(share_hash=None, share_id=None, **_d):
    """localStore.getByShare(): share_hash = sha256(shareId) (bevorzugt) oder share_id → {record} oder {record: null}."""
    from ph_marketing.ph_marketing import ideenboard

    return {"record": ideenboard.lesen_per_share(share_hash=text(share_hash, 64), share_id=text(share_id, 40))}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=120, referenz=lambda r: ("PH Ideenboard", r["record"]["boardId"]))
def update_ideenboard(board_id=None, record=None, expected_updated_at=None, expected_modified=None, **_d):
    """localStore.update(): ganzer Datensatz nach sync/revoke/renew → {record}.
    expected_updated_at (= gelesenes updatedAt) → 409 conflict bei paralleler Änderung; 404 not_found."""
    from ph_marketing.ph_marketing import ideenboard

    pflicht({"board_id": board_id}, "board_id")
    return {"record": ideenboard.aendern(text(board_id, 40), _json_param(record) or {}, erwartet=text(expected_updated_at or expected_modified, 40) or None)}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=60)
def remove_ideenboard(board_id=None, **_d):
    """localStore.remove(boardId) → {removed: bool}."""
    from ph_marketing.ph_marketing import ideenboard

    return {"removed": ideenboard.entfernen(text(board_id, 40))}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=10)
def sweep_ideenboards(**_d):
    """localStore.sweep(): abgelaufene löschen → {checked, removed, orphans}. Läuft zusätzlich täglich (03:45)."""
    from ph_marketing.ph_marketing import ideenboard

    return ideenboard.abgelaufene_loeschen()


# ── Bewertungen (/de/bewerten, QR-Karte; ReviewSummary) ─────────────────────────────────────────────────────────


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=20, referenz=lambda r: ("PH Bewertung", r["referenz"]))
def create_bewertung(**d):
    """Direkte Rückmeldung: {sterne? 1–5, text?, name?, email?, anlass? (lieferung|montage|abholung|beratung|service),
    quelle? (direkt|qr|mail), einwilligung_veroeffentlichung?, textversion?, seite?} → {referenz, status, email (maskiert)}.
    Sterne oder Text Pflicht. Kein Gating: alle Rückmeldungen gleich, unabhängig von der Sternezahl."""
    from ph_marketing.ph_marketing import bewertung

    if bewertung.bw.quelle_normalisieren(d.get("quelle")) == "Google":
        raise ApiFehler("invalid", 400, _("Google-Bewertungen werden im Backoffice importiert."), {"field": "quelle"})
    return bewertung.anlegen(d)


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=120)
def get_bewertungen(limit=20, quelle=None, **_d):
    """Öffentliche Liste: {count, average, reviews:[{id, author (maskiert), rating, text, date, source, occasion, reply}]}.
    Nur veröffentlichte, nie nach Sternen gefiltert; E-Mail/Telefon im Text entfernt."""
    from ph_marketing.ph_marketing import bewertung

    return bewertung.oeffentlich(limit=limit, quelle=text(quelle, 20) or None)
