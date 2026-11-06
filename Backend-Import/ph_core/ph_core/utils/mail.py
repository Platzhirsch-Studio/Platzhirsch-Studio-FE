"""Mailversand aller PH-Apps über Frappe (Email Account) – ein Einstieg, eine Testmodus-Regel.

    from ph_core.utils.mail import sende
    sende(empfaenger, betreff, html)                                   # einfach
    sende(e, b, html, text=…, anhaenge=[{"fname": "RE-1.pdf", "fcontent": pdf}])
    sende(e, None, None, vorlage="PH Termin Bestätigung", kontext={"doc": doc}, sprache="en")
    sende(e, b, html, cc=["einkauf@…"], reply_to="berater@…", absender_name="Platzhirsch Studio")

Regeln:
  * Testmodus (PH Einstellungen.testmodus): alle Empfänger (to/cc/bcc) werden durch team_email ersetzt,
    Betreff bekommt „[TEST] “ – Kundenmails verlassen Staging nie.
  * Absender: ph_mail_from aus site_config (optional mit absender_name als Anzeigename), sonst der
    Standard-Email-Account von Frappe.
  * Anhänge: Liste im frappe.sendmail-Format, unverändert durchgereicht –
      {"fname": "…", "fcontent": bytes}          (eigene PDFs/Dateien, ph_faktura)
      {"fid": "<File.name>"}                      (vorhandene Dateien, ph_service Fotos)
      {"print_format_attachment": 1, "doctype": …, "name": …, "print_format": …, "lang": …}
  * Vorlage: Name eines Email Template; mit `sprache` wird zuerst „<Vorlage> (<sprache>)“ gesucht
    (z. B. „PH Lieferbestätigung (en)“), dann die Grundvorlage. subject/response(_html) werden mit
    `kontext` gerendert (frappe.render_template). Übergebene betreff/html überschreiben die Vorlage.
  * Nie Tracking-Pixel; Versand über die Queue (now=False), Fehler wirft frappe.sendmail selbst.
"""

import frappe
from frappe.utils import validate_email_address


def sende(
    empfaenger,
    betreff,
    html,
    text=None,
    anhaenge=None,
    referenz_doctype=None,
    referenz_name=None,
    vorlage=None,
    kontext=None,
    sprache=None,
    cc=None,
    bcc=None,
    reply_to=None,
    absender_name=None,
    kopfzeilen=None,
):
    """Sendet eine Mail (Queue). Rückgabe: dict mit den tatsächlich verwendeten Empfängern und dem Betreff.

    kopfzeilen: optionale zusätzliche Mail-Header als dict, z. B. {"List-Unsubscribe": "<https://…>",
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"} (RFC 8058, ph_marketing). Nur übergeben, wenn die
    installierte Frappe-Version frappe.sendmail(headers=…) kennt; sonst stillschweigend weggelassen."""
    from ph_core.ph_core.doctype.ph_einstellungen.ph_einstellungen import einstellungen

    einst = einstellungen()

    if vorlage:
        tpl_betreff, tpl_html = vorlage_rendern(vorlage, kontext or {}, sprache)
        betreff = betreff or tpl_betreff
        html = html or tpl_html
    if not betreff or not html:
        frappe.throw(frappe._("Mail ohne Betreff oder Inhalt (Vorlage {0} fehlt?).").format(vorlage or "-"))

    empfaenger = _liste(empfaenger)
    cc = _liste(cc)
    bcc = _liste(bcc)
    if einst["testmodus"]:
        empfaenger, cc, bcc = [einst["team_email"]], [], []
        betreff = f"[TEST] {betreff}"
    if not empfaenger:
        frappe.throw(frappe._("Kein Empfänger."))

    absender = frappe.conf.get("ph_mail_from")
    if absender and absender_name and "<" not in absender:
        absender = f"{absender_name} <{absender}>"

    extra = {}
    if kopfzeilen:
        import inspect

        try:
            if "headers" in inspect.signature(frappe.sendmail).parameters:
                extra["headers"] = {str(k): str(v) for k, v in dict(kopfzeilen).items() if v}
        except (TypeError, ValueError):
            pass

    frappe.sendmail(
        recipients=empfaenger,
        cc=cc or None,
        bcc=bcc or None,
        sender=absender,
        reply_to=reply_to or None,
        subject=betreff,
        message=html,
        text_content=text,
        attachments=anhaenge or [],
        reference_doctype=referenz_doctype,
        reference_name=referenz_name,
        now=False,
        with_container=False,
        add_unsubscribe_link=0,
        **extra,
    )
    return {"empfaenger": empfaenger, "cc": cc, "bcc": bcc, "betreff": betreff, "testmodus": int(einst["testmodus"])}


def vorlage_rendern(vorlage, kontext, sprache=None):
    """(betreff, html) aus einem Email Template; Sprachvariante „<Vorlage> (<sprache>)“ bevorzugt."""
    name = None
    if sprache:
        kandidat = f"{vorlage} ({str(sprache).lower()})"
        if frappe.db.exists("Email Template", kandidat):
            name = kandidat
    if not name:
        if not frappe.db.exists("Email Template", vorlage):
            frappe.throw(frappe._("Email Template {0} fehlt.").format(vorlage))
        name = vorlage
    tpl = frappe.get_cached_doc("Email Template", name)
    betreff = frappe.render_template(tpl.subject or "", kontext)
    html = frappe.render_template(tpl.response_html or tpl.response or "", kontext)
    return betreff, html


def _liste(wert):
    """str | list | None → Liste gültiger Adressen (Trennzeichen Komma/Semikolon)."""
    if not wert:
        return []
    if isinstance(wert, str):
        wert = wert.replace(";", ",").split(",")
    out = []
    for e in wert:
        e = (e or "").strip()
        if e and validate_email_address(e):
            out.append(e)
    return out
