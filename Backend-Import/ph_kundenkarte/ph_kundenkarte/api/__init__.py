"""Whitelisted Methoden von ph_kundenkarte für Website, Kundenportal, Kassa und Packtisch
(Token des Benutzers website@platzhirsch.studio, Decorator ph_core.api.ph_api; Portal-Methoden prüfen zusätzlich
kunde_token gegen PH Kontakt.portal_token_hash; Kassa-Methoden verlangen eine Desk-Rolle).

  Website (Antrag):
    create_card_application(**d)                     → Antrag anlegen (idempotent), DOI-Token im Klartext für die Mail der Website
    confirm_card_application(token)                  → DOI-Bestätigung {status}
    get_card_status(email)                           → {found, status} ohne Personendaten
  Kundenportal (src/lib/portal/adapters/frappe.js, Abschnitt „Kundenkarte“):
    portal_card(kontakt, kunde_token)                → Karte, Stufe, Vorteile, Einlösungen, nächste Stufe
    portal_wallet_pass(kontakt, kunde_token, plattform) → Apple: pkpass (base64) · Google: Save-URL · sonst 503
  Kassa / Packtisch (Rolle PH Kassa Mitarbeiter oder PH Kundenkarte Mitarbeiter):
    lookup_card(kartennummer)                        → Name, Stufe, verfügbare Vorteile, code (ok/card_blocked/…)
    redeem_benefit(kartennummer, vorteil, bezug_doctype, bezug, kommentar, ort) → Einlösung (idempotent je Bezug)
    cancel_redemption(referenz | bezug_doctype+bezug, grund) → Einlösung(en) zurücknehmen
    hand_over_card(kartennummer, ort)                 → beantragte Karte bei Übergabe aktivieren
  Backoffice (Desk-Sitzung, Leitung): ph_kundenkarte.api.backoffice.*
  Direkt aus Python (ph_kassa, selber Request, ohne Decorator/Commit): ph_kundenkarte.ph_kundenkarte.kassa.*

Kein Geldwert: Antworten enthalten keine Guthaben oder Punkte; „fehlt_noch_cent“ ist nur die Differenz zur
nächsten Stufen-Schwelle (Einstufung), kein Kontostand.
Fehlercodes: invalid 400, forbidden 403, not_found/invalid_token 404, conflict 409, expired 410, unavailable 503;
Einlösung: card_inactive / benefit_inactive / tier_too_low / benefit_not_in_tier / limit_reached (409).
Kassa-Status (Feld `code` in lookup_card, 409-Code in redeem_benefit): card_pending, card_blocked, card_replaced,
card_transferred, card_cancelled; card_merged wird automatisch auf die Hauptkarte geleitet (`weitergeleitet_von`).
"""

import base64
import hmac
import re

import frappe
from frappe import _
from frappe.utils import now_datetime

from ph_core.api import ApiFehler, ip_hash, pflicht, ph_api, portal_kontakt_pruefen, text
from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_antrag.ph_kundenkarte_antrag import antrag_zu_token
from ph_kundenkarte.ph_kundenkarte import kassa
from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einstellungen.ph_kundenkarte_einstellungen import einstellungen
from ph_kundenkarte.utils.antrag import antrag_pruefen, email_normalisieren, hash_token, neuer_token, token_plausibel
from ph_kundenkarte.utils.kartenregeln import OFFENE_STATUS, geburtstag_parsen

KASSA_ROLLEN = kassa.KASSA_ROLLEN  # Packtisch (Logistik) eingeschlossen

HEX64 = re.compile(r"^[0-9a-f]{64}$")
# Kampagnenfelder wie PH Anfrage/PH Termin (src/lib/forms/attributionFields.js ATTRIBUTION_KEYS)
KAMPAGNE_FELDER = ("utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "klick_id")


# ── Website: Antrag ──────────────────────────────────────────────────────────


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=30, referenz=lambda r: ("PH Kundenkarte Antrag", r.get("referenz")))
def create_card_application(**d):
    """Antrag von der Website. Pflicht: vorname, nachname, email, vertragsdaten_akzeptiert.
    Optional: anrede, telefon, plz, ort, sprache, interessen, geburtstag, nachricht, einwilligung_auswertung,
    einwilligung_textversion, einwilligung_newsletter, newsletter_textversion, bedingungen_version, quelle,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content, klick_id (nur mit Ads-Einwilligung, Website
    pickAttribution; gespeichert am Antrag, je ≤ 140 Zeichen).
    → {referenz, status, doi, doi_token, email_maskiert}. Die Website verschickt die DOI-Mail mit doi_token."""
    d = {k: v for k, v in d.items() if v is not None}
    ok, feld, meldung = antrag_pruefen(d)
    if not ok:
        raise ApiFehler("invalid", 400, _(meldung), {"field": feld})
    email = email_normalisieren(d.get("email"))
    offen = frappe.db.get_value("PH Kundenkarte Antrag", {"email": email, "status": ("in", ["Neu", "Bestaetigt"])}, ["name", "status"], as_dict=True)
    if offen:
        # Zweitantrag derselben Adresse: kein neuer Datensatz, Website zeigt „bitte E-Mail bestätigen“
        return {"referenz": offen.name, "status": offen.status, "doi": offen.status == "Neu", "doi_token": None, "email_maskiert": _maskiert(email), "bereits_vorhanden": True}
    if frappe.db.exists("DocType", "PH Kontakt"):
        kontakt = frappe.db.get_value("PH Kontakt", {"email": email}, "name")
        if kontakt and frappe.db.exists("PH Kundenkarte", {"kontakt": kontakt, "status": ("in", list(OFFENE_STATUS))}):
            raise ApiFehler("conflict", 409, _("Für diese E-Mail-Adresse besteht bereits eine Kundenkarte."), {"field": "email"})
    einst = einstellungen()
    doi = bool(einst["doi_pflicht"])
    # Website-Muster wie bei der Terminbuchung (src/lib/kundenkarte/token.js): die Website erzeugt das
    # Link-Geheimnis selbst und übergibt nur dessen SHA-256 (confirm_hash); sie verschickt auch die Mail.
    # Ohne confirm_hash (Backoffice/Showroom-Formulare) erzeugt das Backend den Token.
    confirm_hash = text(d.get("confirm_hash"), 64)
    website_hash = bool(confirm_hash and HEX64.match(confirm_hash))
    token = None if website_hash or not doi else neuer_token()
    # Geburtstag: Website liefert ggf. ohne Jahr („--MM-TT“) – Teildatum getrennt speichern (Konzept §9.1)
    geb_voll, geb_teil = geburtstag_parsen(d.get("geburtstag"))
    if d.get("geburtstag") and not geb_teil:
        raise ApiFehler("invalid", 400, _("Geburtstag bitte als JJJJ-MM-TT oder --MM-TT angeben."), {"field": "geburtstag"})
    doc = frappe.get_doc(
        {
            "doctype": "PH Kundenkarte Antrag",
            "quelle": "website",
            "anrede": text(d.get("anrede"), 10),
            "vorname": text(d.get("vorname"), 80),
            "nachname": text(d.get("nachname"), 80),
            "email": email,
            "telefon": text(d.get("telefon"), 40),
            "plz": text(d.get("plz"), 10),
            "ort": text(d.get("ort"), 80),
            "sprache": text(d.get("sprache"), 2) or "de",
            "interessen": text(d.get("interessen"), 500),
            "geburtstag": geb_voll,
            "geburtstag_tag_monat": geb_teil,
            "nachricht": text(d.get("nachricht"), 1000),
            "vertragsdaten_akzeptiert": 1,
            "bedingungen_version": text(d.get("bedingungen_version"), 60) or einst.get("bedingungen_version"),
            "einwilligung_auswertung": int(bool(d.get("einwilligung_auswertung"))),
            "einwilligung_textversion": text(d.get("einwilligung_textversion"), 80),
            "einwilligung_newsletter": int(bool(d.get("einwilligung_newsletter"))),
            "newsletter_textversion": text(d.get("newsletter_textversion"), 80),
            "doi_token_hash": confirm_hash if website_hash else hash_token(token),
            "doi_gesendet_am": now_datetime() if doi else None,
            "ip_hash": ip_hash(),
            "idempotency_key": text(d.get("antrag_key") or d.get("idempotency_key"), 80) or None,
            **{k: text(d.get(k), 140) or None for k in KAMPAGNE_FELDER},
        }
    )
    doc.flags.ignore_permissions = True
    doc.insert()
    return {"referenz": doc.name, "status": doc.status, "doi": doi, "doi_token": token, "email_maskiert": _maskiert(email), "bereits_vorhanden": False}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=60)
def confirm_card_application(token=None, antrag=None, confirm_hash=None, **_d):
    """DOI-Bestätigung. Zwei Formen:
    - {token}: Backend-erzeugter Token (Hash-Vergleich).
    - {antrag, confirm_hash}: Website-Form (src/lib/kundenkarte/adapters/frappe.js) – Antragsnummer plus
      SHA-256 des Link-Geheimnisses, das nur die Website kennt.
    → {status: bestaetigt | bereits_bestaetigt | ungueltig | aktiv, referenz, kartennummer?}.
    Ist „Website-Anträge automatisch annehmen“ aktiv, wird nach der Bestätigung sofort die Karte ausgestellt
    (Stufe 1 ohne Geldwert) und status="aktiv" mit kartennummer zurückgegeben."""
    if antrag and confirm_hash:
        name = text(antrag, 20)
        gespeichert = frappe.db.get_value("PH Kundenkarte Antrag", name, "doi_token_hash") if name else None
        confirm_hash = text(confirm_hash, 64)
        if not gespeichert or not HEX64.match(confirm_hash) or not hmac.compare_digest(gespeichert, confirm_hash):
            raise ApiFehler("invalid_token", 404, _("Link ungültig."))
    else:
        if not token_plausibel(token):
            raise ApiFehler("invalid_token", 404, _("Link ungültig."))
        name = antrag_zu_token(text(token, 128))
        if not name:
            raise ApiFehler("invalid_token", 404, _("Link ungültig."))
    doc = frappe.get_doc("PH Kundenkarte Antrag", name)
    doc.flags.ignore_permissions = True
    status = doc.doi_bestaetigen(kanal="website")
    if status == "abgelaufen":
        raise ApiFehler("expired", 410, _("Der Bestätigungslink ist abgelaufen. Bitte stellen Sie den Antrag erneut."), {"status": status})
    antwort = {"status": status, "referenz": name}
    if status in ("bestaetigt", "bereits_bestaetigt") and einstellungen().get("website_automatisch_annehmen"):
        karte = doc.kundenkarte
        if not karte and doc.status == "Bestaetigt":
            try:
                karte = doc.annehmen(aktiv=True)
            except Exception:
                frappe.log_error(title="ph_kundenkarte: automatische Annahme fehlgeschlagen", message=frappe.get_traceback())
                karte = None
        if karte:
            antwort.update({"status": "aktiv", "kartennummer": karte, "bereits_bestaetigt": status == "bereits_bestaetigt"})
    return antwort


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=30)
def get_card_status(email=None, **_d):
    """{email} → {found, status} – status: beantragt | bestaetigt | aktiv | gesperrt | keine. Keine Personendaten."""
    pflicht({"email": email}, "email")
    email = email_normalisieren(email)
    if frappe.db.exists("DocType", "PH Kontakt"):
        kontakt = frappe.db.get_value("PH Kontakt", {"email": email}, "name")
        if kontakt:
            status = frappe.db.get_value("PH Kundenkarte", {"kontakt": kontakt, "status": ("in", ["Aktiv", "Gesperrt", "Beantragt"])}, "status")
            if status:
                return {"found": True, "status": {"Aktiv": "aktiv", "Gesperrt": "gesperrt", "Beantragt": "beantragt"}[status]}
    antrag = frappe.db.get_value("PH Kundenkarte Antrag", {"email": email, "status": ("in", ["Neu", "Bestaetigt"])}, "status")
    if antrag:
        return {"found": True, "status": "beantragt" if antrag == "Neu" else "bestaetigt"}
    return {"found": False, "status": "keine"}


# ── Kundenportal ─────────────────────────────────────────────────────────────


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=60)
def portal_card(kontakt=None, kunde_token=None, **_d):
    """Karte des Kontakts: Stufe, Stufentext, nächste Stufe (fehlt_noch_cent), Vorteile mit Restkontingent, Einlösungen.
    Ohne Karte → {found: False}."""
    kontakt = portal_kontakt_pruefen(kontakt, kunde_token)
    karte = frappe.db.get_value("PH Kundenkarte", {"kontakt": kontakt, "status": ("in", ["Aktiv", "Gesperrt", "Beantragt"])}, "name")
    if not karte:
        return {"found": False}
    from ph_kundenkarte.ph_kundenkarte import umsatz

    daten = umsatz.karten_uebersicht(karte)
    daten["found"] = True
    daten["wallet"] = {"apple": _wallet_bereit("apple"), "google": _wallet_bereit("google")}
    return daten


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=20)
def portal_wallet_pass(kontakt=None, kunde_token=None, plattform=None, **_d):
    """plattform apple → {plattform, dateiname, mime, inhalt_base64}; google → {plattform, url}. 503 ohne Zertifikate."""
    kontakt = portal_kontakt_pruefen(kontakt, kunde_token)
    plattform = (plattform or "").strip().lower()
    if plattform not in ("apple", "google"):
        raise ApiFehler("invalid", 400, _("plattform muss apple oder google sein."), {"field": "plattform"})
    karte = frappe.db.get_value("PH Kundenkarte", {"kontakt": kontakt, "status": "Aktiv"}, "name")
    if not karte:
        raise ApiFehler("not_found", 404, _("Keine aktive Kundenkarte."))
    from ph_kundenkarte.ph_kundenkarte import wallet

    if plattform == "apple":
        inhalt = wallet.apple_pkpass(karte)
        return {"plattform": "apple", "dateiname": f"platzhirsch-kundenkarte-{karte}.pkpass", "mime": "application/vnd.apple.pkpass", "inhalt_base64": base64.b64encode(inhalt).decode()}
    return {"plattform": "google", "url": wallet.google_save_url(karte)}


# ── Kassa / Packtisch ────────────────────────────────────────────────────────
# Dünne HTTP-Hüllen um ph_kundenkarte.ph_kundenkarte.kassa (dort ohne Decorator für direkte Python-Aufrufe aus
# ph_kassa im selben Request). intern=True: Desk-/Kassa-Sitzung genügt, kein Website-Token, der Website-
# Wartungsschalter `api_aktiv` sperrt die Kassa nicht; Gäste werden abgewiesen. Rollen: kassa.KASSA_ROLLEN.


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(intern=True, limit_pro_minute=120)
def lookup_card(kartennummer=None, **_d):
    """Kassa/Packtisch: {kartennummer} → Name, Status, code, Stufe, verfügbare Vorteile (keine Kontaktdaten, kein Umsatz)."""
    return kassa.karte_pruefen(kartennummer)


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(intern=True, idempotent=True, limit_pro_minute=60, referenz=lambda r: ("PH Kundenkarte Einloesung", r.get("referenz")))
def redeem_benefit(kartennummer=None, vorteil=None, bezug_doctype=None, bezug=None, kommentar=None, ort="Kassa", **_d):
    """Vorteil einlösen → {referenz, vorteil, titel, verbleibend, bereits_eingeloest, kartennummer, weitergeleitet_von}.
    409-Codes: card_pending | card_blocked | card_replaced | card_transferred | card_cancelled | benefit_inactive |
    tier_too_low | benefit_not_in_tier | limit_reached."""
    return kassa.einloesen(kartennummer, vorteil, bezug_doctype=bezug_doctype, bezug=bezug, kommentar=kommentar, ort=ort)


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(intern=True, limit_pro_minute=60)
def cancel_redemption(referenz=None, bezug_doctype=None, bezug=None, grund=None, **_d):
    """Einlösung zurücknehmen – {referenz} oder {bezug_doctype, bezug}. → {storniert: [namen]}"""
    return kassa.einloesung_zuruecknehmen(referenz=referenz, bezug_doctype=bezug_doctype, bezug=bezug, grund=grund)


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(intern=True, limit_pro_minute=30)
def hand_over_card(kartennummer=None, ort="Kassa", **_d):
    """Beantragte Karte bei physischer Übergabe aktivieren → {kartennummer, status}."""
    return kassa.karte_uebergeben(kartennummer, ort=ort)


# ── Helfer ───────────────────────────────────────────────────────────────────


def _maskiert(email):
    from ph_kundenkarte.utils.antrag import email_maskieren

    return email_maskieren(email)


def _wallet_bereit(plattform):
    from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_einstellungen.ph_kundenkarte_einstellungen import wallet_konfiguriert

    try:
        return bool(wallet_konfiguriert(plattform))
    except Exception:  # noqa: BLE001
        return False
