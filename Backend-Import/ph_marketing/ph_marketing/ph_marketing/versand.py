"""Mailversand des Marketings: Vorlagen rendern, Fußzeilen, Versandweg (Frappe Email Queue oder Resend).

Regeln:
  - Testmodus (PH Einstellungen) → alle Mails an die Testadresse, Betreff „[TEST → empfänger]“ (ph_core.utils.mail).
  - Resend nur über den Schlüssel ph_resend_api_key aus site_config.json; fehlt er → Fehler, kein Fallback ins Leere.
  - Kein Tracking-Pixel, kein Frappe-Standard-Abmeldefuß (eigene Fußzeile A/B/V/S, mail.js).
"""

import json

import frappe
from frappe import _
from frappe.utils import cint, escape_html, formatdate

from ph_marketing.ph_marketing.einstellungen import einstellungen, website_url

IMPRESSUM_ZEILE = "Platzhirsch Home Living · MW Immobilienverwaltungs GmbH · Landstraße 11 · 6911 Lochau · Österreich · +43 5574 46255 · info@platzhirsch.studio"
RESEND_URL = "https://api.resend.com/emails"


def vorlage(vorlage_id):
    if not frappe.db.exists("PH Mail Vorlage", vorlage_id):
        frappe.throw(_("Mail-Vorlage {0} fehlt (ph_marketing.install legt die Standardvorlagen an).").format(vorlage_id))
    return frappe.get_cached_doc("PH Mail Vorlage", vorlage_id)


def rendern(vorlage_id, ctx):
    """→ (betreff, html). ctx-Werte werden vom Aufrufer bereits escaped übergeben."""
    v = vorlage(vorlage_id)
    ctx = {"website_url": website_url(), "impressum_zeile": IMPRESSUM_ZEILE, **ctx}
    return frappe.render_template(v.betreff, ctx), frappe.render_template(v.html, ctx)


def bestaetigen_url(token):
    e = einstellungen()
    return f"{e['website_url']}{e['bestaetigen_pfad']}?token={token}"


def abmelde_url(token):
    e = einstellungen()
    return f"{e['website_url']}{e['abmelden_pfad']}?token={token}"


def abmelde_kopfzeilen(token):
    """List-Unsubscribe (RFC 2369) + One-Click (RFC 8058) für Newsletter/Werbung. Website-Route nimmt den POST an
    und ruft ph_marketing.api.unsubscribe_one_click(token) auf. Ohne HTTPS-Website-URL → None (kein Header)."""
    from ph_marketing.utils.mail_ereignis import list_unsubscribe_header

    e = einstellungen()
    url = f"{e['website_url']}{e['one_click_pfad']}?token={token}"
    try:
        return list_unsubscribe_header(url, e.get("abmelde_mailto"))
    except ValueError:
        return None


def fusszeile_html(grundlage, abmelde_link, einwilligung_datum=""):
    """Fußzeile A (Einwilligung) oder B (Bestandskunde) – Wortlaut: src/lib/kundenbetreuung/mail.js FUSSZEILEN."""
    if grundlage == "B":
        return (
            "Sie erhalten diese Nachricht als Kundin bzw. Kunde von Platzhirsch Home Living. Wenn Sie keine weiteren Informationen "
            f'von uns per E-Mail wünschen, genügt ein Klick: <a href="{abmelde_link}" style="color:#30373e">Keine weiteren E-Mails</a> – '
            "oder eine kurze Antwort auf diese Mail. Das ist kostenlos."
        )
    return (
        f"Sie erhalten diese Nachricht, weil Sie sich am {escape_html(einwilligung_datum)} dafür angemeldet und die Anmeldung bestätigt haben. "
        f'<a href="{abmelde_link}" style="color:#30373e">Abmelden</a> · <a href="{website_url("/de/datenschutz")}" style="color:#30373e">Datenschutz</a>'
    )


def datum_lang(d):
    """„Donnerstag, 26. November 2026“ (Mails, deutsch)."""
    return formatdate(d, "EEEE, d. MMMM yyyy") if d else ""


def absender(art="standard"):
    e = einstellungen()
    adresse = frappe.conf.get("ph_mail_from")
    if art == "gastgeberin" and e["absender_gastgeberin"]:
        return frappe.utils.formataddr((e["absender_gastgeberin_name"] or e["absender_name"], e["absender_gastgeberin"]))
    if adresse:
        return frappe.utils.formataddr((e["absender_name"], adresse))
    return None


def sende(empfaenger, betreff, html, referenz_doctype=None, referenz_name=None, absender_art="standard", versandweg=None, antwort_an=None, kopfzeilen=None):
    """Eine Mail über den konfigurierten Weg. → {"versandweg": ..., "nachricht_id": ...}. Wirft bei Fehlern."""
    e = einstellungen()
    weg = versandweg or e["versandweg"]
    if e["testmodus"]:
        empfaenger_echt = empfaenger
        empfaenger = e["test_empfaenger"]
        if not empfaenger:
            frappe.throw(_("Testmodus ohne Testadresse (PH Marketing Einstellungen / PH Einstellungen team_email)."))
        betreff = f"[TEST → {empfaenger_echt}] {betreff}"
    if weg == "Resend":
        return _sende_resend(empfaenger, betreff, html, antwort_an or e["antwort_an"], absender_art, kopfzeilen)
    # Frappe-Queue über den Core-Helfer – eigene Kopfzeilen (List-Unsubscribe) kann ph_core.utils.mail.sende noch nicht
    # durchreichen (Bedarf an ph_core); Frappe setzt bei Email Queue einen eigenen List-Unsubscribe nur mit Frappe-Abmeldung. (gemeinsamer Testmodus, reply_to, Absendername); Resend bleibt hier.
    from ph_core.utils.mail import sende as core_sende

    absender_name = e["absender_gastgeberin_name"] if absender_art == "gastgeberin" and e["absender_gastgeberin_name"] else e["absender_name"]
    core_sende(
        [empfaenger],
        betreff,
        html,
        referenz_doctype=referenz_doctype,
        referenz_name=referenz_name,
        reply_to=antwort_an or e["antwort_an"],
        absender_name=absender_name,
    )
    return {"versandweg": "Frappe Email Queue", "nachricht_id": None}


def _sende_resend(empfaenger, betreff, html, antwort_an, absender_art, kopfzeilen=None):
    schluessel = frappe.conf.get("ph_resend_api_key")
    von = absender(absender_art) or frappe.conf.get("ph_mail_from")
    if not schluessel or not von:
        frappe.throw(_("Resend: ph_resend_api_key oder ph_mail_from fehlt in site_config.json."))
    import requests

    r = requests.post(
        RESEND_URL,
        headers={"Authorization": f"Bearer {schluessel}", "Content-Type": "application/json"},
        data=json.dumps({"from": von, "to": [empfaenger], "subject": betreff, "html": html, "reply_to": antwort_an or None, **({"headers": kopfzeilen} if kopfzeilen else {})}),
        timeout=15,
    )
    if r.status_code >= 300:
        frappe.throw(_("Resend antwortet {0}: {1}").format(r.status_code, r.text[:200]))
    try:
        return {"versandweg": "Resend", "nachricht_id": r.json().get("id")}
    except ValueError:
        return {"versandweg": "Resend", "nachricht_id": None}


def anrede_fuer(name="", anrede=""):
    name = (name or "").strip()
    if anrede and name:
        return f"Guten Tag {escape_html(anrede)} {escape_html(name.split()[-1])}"
    if name:
        return f"Guten Tag {escape_html(name)}"
    return "Guten Tag"


def testmodus():
    return cint(einstellungen()["testmodus"])
